import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../database/entities/employee.entity';
import bcrypt from 'bcryptjs';
import { ImageKitService } from '../image-kit/image-kit.service';
import { EmployeeContactDto } from './dto/employee-contact.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmployeeContactsService } from '../employee-contacts/employee-contacts.service';
import { CreateEmployeeDto } from './dto/create.dto';
import { UpdateEmployeeDto } from './dto/update.dto';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly imageKitService: ImageKitService,
    private readonly contactService: EmployeeContactsService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async create(data: CreateEmployeeDto) {
    const { password, photo, employeeNumber, ...employeeData } = data;

    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: employeeData.email },
    });

    if (existingEmployee) {
      throw new NotFoundException('Employee with this email already exists');
    }
    const existingEmployeeNumber = await this.employeeRepository.findOne({
      where: { employeeNumber },
    });

    if (existingEmployeeNumber) {
      throw new NotFoundException(
        'Employee with this employee number already exists',
      );
    }

    const photoUrl = await this.imageKitService.uploadFile(
      photo,
      '/employees/photos',
    );

    const employee = this.employeeRepository.create({
      ...employeeData,
      password: await bcrypt.hash(password, 10),
      employeeNumber,
      photoUrl,
    });

    const savedEmployee = await this.employeeRepository.save(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: savedEmployee.id,
      entity: 'employee',
      action: 'create',
      targetId: savedEmployee.id,
      summary: `Employee ${savedEmployee.firstName} ${savedEmployee.lastName || ''} was created`,
      changes: {
        employeeNumber: savedEmployee.employeeNumber,
        email: savedEmployee.email,
        firstName: savedEmployee.firstName,
        lastName: savedEmployee.lastName,
      },
    });

    return savedEmployee;
  }

  async update(employeeId: string, updateData: Partial<UpdateEmployeeDto>) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const previousData = { ...employee };
    Object.assign(employee, updateData);

    const savedEmployee = await this.employeeRepository.save(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: employeeId,
      entity: 'employee',
      action: 'update',
      targetId: employeeId,
      summary: `Employee ${savedEmployee.firstName} ${savedEmployee.lastName || ''} was updated`,
      changes: this.getChangedFields(previousData, savedEmployee),
    });

    return savedEmployee;
  }

  async delete(employeeId: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const employeeName = `${employee.firstName} ${employee.lastName || ''}`;
    await this.employeeRepository.remove(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: employeeId,
      entity: 'employee',
      action: 'delete',
      targetId: employeeId,
      summary: `Employee ${employeeName} was deleted`,
      changes: {
        employeeNumber: employee.employeeNumber,
        email: employee.email,
      },
    });

    return { message: 'Employee deleted successfully' };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    positionId?: string;
  }) {
    const { page = 1, limit = 10, search, departmentId, positionId } = query;
    const offset = (page - 1) * limit;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.position', 'position');

    if (search) {
      queryBuilder.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', {
        departmentId,
      });
    }

    if (positionId) {
      queryBuilder.andWhere('employee.positionId = :positionId', {
        positionId,
      });
    }

    const [data, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getProfile(employeeId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['department', 'position', 'contact'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = employee;
    return result as Employee;
  }

  async updateContact(employeeId: string, updateData: EmployeeContactDto) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.contactService.createOrUpdateContact(employeeId, updateData);

    const savedEmployee = await this.employeeRepository.save(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: employeeId,
      entity: 'employee',
      action: 'update',
      targetId: employeeId,
      summary: `Employee contact for ${savedEmployee.firstName} ${savedEmployee.lastName || ''} was updated`,
      changes: { contact: updateData },
    });

    return savedEmployee;
  }

  async changePassword(
    employeeId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      employee.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isPasswordSameAsOld = await bcrypt.compare(
      changePasswordDto.newPassword,
      employee.password,
    );

    if (isPasswordSameAsOld) {
      throw new BadRequestException(
        'New password must be different from the old password',
      );
    }

    employee.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.employeeRepository.save(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: employeeId,
      entity: 'employee',
      action: 'update',
      targetId: employeeId,
      summary: `Password changed for ${employee.firstName} ${employee.lastName || ''}`,
      changes: { passwordChanged: true },
    });

    return {
      message:
        'Password changed successfully, please sign in again with your new password',
    };
  }

  async updatePhoto(
    employeeId: string,
    file: Express.Multer.File,
  ): Promise<{ photoUrl: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    employee.photoUrl = await this.imageKitService.uploadFile(
      file,
      '/employees/photos',
    );

    await this.employeeRepository.save(employee);

    void this.rabbitMqService.publishEmployeeChange({
      eventId: this.rabbitMqService.generateEventId(),
      timestamp: new Date(),
      actorEmployeeId: employeeId,
      entity: 'employee',
      action: 'update',
      targetId: employeeId,
      summary: `Photo updated for ${employee.firstName} ${employee.lastName || ''}`,
      changes: { photoUpdated: true },
    });

    return { photoUrl: employee.photoUrl };
  }

  private getChangedFields(
    previous: Employee,
    current: Employee,
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const sensitiveFields = ['password'];

    const previousObj = previous as unknown as Record<string, unknown>;
    const currentObj = current as unknown as Record<string, unknown>;

    for (const key of Object.keys(currentObj)) {
      if (sensitiveFields.includes(key)) continue;
      if (previousObj[key] !== currentObj[key]) {
        changes[key] = { from: previousObj[key], to: currentObj[key] };
      }
    }
    return changes;
  }
}
