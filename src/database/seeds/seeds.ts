import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  AccountRole,
  EmploymentType,
} from '../entities/employee.entity';
import { Department } from '../entities/department.entity';
import { JobPosition } from '../entities/job-position.entity';
import { DayOff } from '../entities/day-off.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(JobPosition)
    private jobPositionRepository: Repository<JobPosition>,
    @InjectRepository(DayOff)
    private dayOffRepository: Repository<DayOff>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const employeeCount = await this.employeeRepository.count();
    if (employeeCount > 0) {
      return;
    }

    const engineering = await this.departmentRepository.save({
      name: 'Engineering',
    });

    const hr = await this.departmentRepository.save({
      name: 'Human Resources',
    });

    const marketing = await this.departmentRepository.save({
      name: 'Marketing',
    });

    const junior = await this.jobPositionRepository.save({
      name: 'Junior Engineer',
      level: 1,
    });

    const senior = await this.jobPositionRepository.save({
      name: 'Senior Engineer',
      level: 2,
    });

    const lead = await this.jobPositionRepository.save({
      name: 'Tech Lead',
      level: 3,
    });

    const hrManager = await this.jobPositionRepository.save({
      name: 'HR Manager',
      level: 3,
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    await this.employeeRepository.save({
      firstName: 'Admin',
      lastName: 'User',
      employeeNumber: 'EMP0001',
      email: 'admin@fourier.com',
      password: hashedPassword,
      role: AccountRole.ADMIN,
      employmentType: EmploymentType.FULLTIME,
      department: engineering,
      position: lead,
    });

    await this.employeeRepository.save({
      firstName: 'John',
      lastName: 'Doe',
      employeeNumber: 'EMP0002',
      email: 'john@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.FULLTIME,
      department: engineering,
      position: senior,
    });

    await this.employeeRepository.save({
      firstName: 'Jane',
      lastName: 'Smith',
      employeeNumber: 'EMP0003',
      email: 'jane@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.FULLTIME,
      department: hr,
      position: hrManager,
    });

    await this.employeeRepository.save({
      firstName: 'Bob',
      lastName: 'Wilson',
      employeeNumber: 'EMP0004',
      email: 'bob@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.INTERN,
      department: marketing,
      position: junior,
    });

    const currentYear = new Date().getFullYear();
    await this.dayOffRepository.save({
      name: 'New Year',
      date: new Date(`${currentYear}-01-01`),
      description: 'New Year Holiday',
    });

    await this.dayOffRepository.save({
      name: 'Independence Day',
      date: new Date(`${currentYear}-08-17`),
      description: 'Independence Day of Indonesia',
    });

    await this.dayOffRepository.save({
      name: 'Christmas',
      date: new Date(`${currentYear}-12-25`),
      description: 'Christmas Holiday',
    });

    console.log('Seed completed successfully');
  }
}
