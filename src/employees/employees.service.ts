import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../database/entities/employee.entity';
import bcrypt from 'bcryptjs';
import { ImageKitService } from '../image-kit/image-kit.service';
import { EmployeeContactDto } from './dto/employee-contact.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmployeeContactsService } from '../employee-contacts/employee-contacts.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly imageKitService: ImageKitService,
    private readonly contactService: EmployeeContactsService,
  ) {}

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

    return await this.employeeRepository.save(employee);
  }

  async changePassword(
    employeeId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
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
      throw new NotFoundException('Current password is incorrect');
    }

    employee.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.employeeRepository.save(employee);

    return;
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

    return { photoUrl: employee.photoUrl };
  }
}
