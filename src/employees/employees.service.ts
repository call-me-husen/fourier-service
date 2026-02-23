import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../database/entities/employee.entity';
import bcrypt from 'bcryptjs';
import { ImageKitService } from '../image-kit/image-kit.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly imageKitService: ImageKitService,
  ) {}

  async getProfile(employeeId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['department', 'position'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = employee;
    return result as Employee;
  }

  async updateProfile(
    employeeId: string,
    updateData: { phone?: string; password?: string },
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (updateData.phone) {
      employee.phone = updateData.phone;
    }

    if (updateData.password) {
      employee.password = await bcrypt.hash(updateData.password, 10);
    }

    await this.employeeRepository.save(employee);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = employee;
    return result as Employee;
  }

  async updatePhoto(
    employeeId: string,
    file: Express.Multer.File,
  ): Promise<Employee> {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = employee;
    return result as Employee;
  }
}
