import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../shared/entities/employee.entity';
import { Contact } from '../../shared/entities/contact.entity';
import { Department } from '../../shared/entities/department.entity';
import { JobPosition } from '../../shared/entities/job-position.entity';
import { Holiday } from '../../shared/entities/holiday.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Role } from '../../shared/entities/role.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(JobPosition)
    private jobPositionRepository: Repository<JobPosition>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const roleCount = await this.roleRepository.count();
    if (!roleCount) {
      await this.roleRepository.save({ name: 'ADMIN' });
      await this.roleRepository.save({ name: 'EMPLOYEE' });
    }

    const holidayCount = await this.holidayRepository.count();
    if (!holidayCount) {
      const holidays: { name: string; date: string }[] = [];
      const year = 2026;

      for (let month = 1; month <= 3; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            holidays.push({
              name: 'Weekend',
              date: date.toISOString().split('T')[0],
            });
          }
        }
      }

      for (const holiday of holidays) {
        await this.holidayRepository.save(holiday);
      }
    }

    const employeeCount = await this.employeeRepository.count();
    if (employeeCount > 0) {
      return;
    }

    const adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMIN' },
    });
    const employeeRole = await this.roleRepository.findOne({
      where: { name: 'EMPLOYEE' },
    });

    const engineering = await this.departmentRepository.save({
      name: 'Engineering',
      description: 'Engineering Department',
    });

    const hr = await this.departmentRepository.save({
      name: 'Human Resources',
      description: 'HR Department',
    });

    const senior = await this.jobPositionRepository.save({
      name: 'Senior Engineer',
      description: 'Senior level engineer',
    });

    const lead = await this.jobPositionRepository.save({
      name: 'Tech Lead',
      description: 'Technical Lead',
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await this.employeeRepository.save({
      firstName: 'Admin',
      lastName: 'User',
      employeeCode: 'EMP0001',
      email: 'admin@company.com',
      password: hashedPassword,
      role: adminRole ?? undefined,
      department: engineering,
      jobPosition: lead,
      dateOfBirth: new Date('1990-01-15'),
    });
    await this.contactRepository.save({
      employee: admin,
      phone: '+6281234567890',
      address: 'Jl. Sudirman No. 1, Jakarta',
    });

    const john = await this.employeeRepository.save({
      firstName: 'John',
      lastName: 'Doe',
      employeeCode: 'EMP0002',
      email: 'john@company.com',
      password: hashedPassword,
      role: employeeRole ?? undefined,
      department: engineering,
      jobPosition: senior,
      dateOfBirth: new Date('1993-05-22'),
    });
    await this.contactRepository.save({
      employee: john,
      phone: '+6281234567891',
      address: 'Jl. Thamrin No. 5, Jakarta',
    });

    const jane = await this.employeeRepository.save({
      firstName: 'Jane',
      lastName: 'Smith',
      employeeCode: 'EMP0003',
      email: 'jane@company.com',
      password: hashedPassword,
      role: employeeRole ?? undefined,
      department: hr,
      jobPosition: lead,
      dateOfBirth: new Date('1991-08-30'),
    });
    await this.contactRepository.save({
      employee: jane,
      phone: '+6281234567892',
      address: 'Jl. Gatot Subroto No. 10, Jakarta',
    });

    console.log('Seed completed successfully');
  }
}
