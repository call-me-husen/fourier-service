import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  AccountRole,
  EmploymentType,
} from '../entities/employee.entity';
import { EmployeeContact } from '../entities/employee-contact.entity';
import { Department } from '../entities/department.entity';
import { JobPosition } from '../entities/job-position.entity';
import bcrypt from 'bcryptjs';
import { Attendance, Holiday } from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(EmployeeContact)
    private contactRepository: Repository<EmployeeContact>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(JobPosition)
    private jobPositionRepository: Repository<JobPosition>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const holidayCount = await this.holidayRepository.count();
    if (!holidayCount) {
      // Insert each saturday and sunday of Feb 2026 as holidays
      const holidays: Date[] = [];
      const year = 2026;

      for (let month = 1; month <= 3; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            holidays.push(date);
          }
        }
      }

      for (const date of holidays) {
        await this.holidayRepository.save({
          name: `Weekend`,
          date,
          description: 'This day is a weekend holiday.',
        });
      }
    }

    const attendanceCount = await this.attendanceRepository.count();
    if (!attendanceCount) {
      const employeeAdm = await this.employeeRepository.findOneBy({
        email: 'admin@fourier.com',
      });

      const dates = [
        new Date('2026-02-09'),
        new Date('2026-02-10'),
        new Date('2026-02-11'),
        new Date('2026-02-12'),
        new Date('2026-02-13'),
        new Date('2026-02-16'),
      ];

      for (const date of dates) {
        const hasClockOut = Math.random() > 0.2; // 80% chance of clocking out
        const hourIn = 0;
        // Randomize clock in minutes between 0-15
        const minuteIn = Math.floor(Math.random() * 16);
        const secondIn = Math.floor(Math.random() * 60);
        const clockInTime = new Date(date.setHours(hourIn, minuteIn, secondIn));

        const hourOut = hourIn + 9;
        const minuteOut = Math.floor(Math.random() * 16);
        const secondOut = Math.floor(Math.random() * 60);
        const clockOutTime = new Date(
          date.setHours(hourOut, minuteOut, secondOut),
        );

        const totalWorkTime = hasClockOut
          ? clockOutTime.getTime() - clockInTime.getTime()
          : 0; // in milliseconds

        await this.attendanceRepository.save({
          employee: employeeAdm!,
          date,
          clockIn: clockInTime,
          clockOut: hasClockOut ? clockOutTime : null,
          totalWorkTime,
        });
      }

      const employeeJane = await this.employeeRepository.findOneBy({
        email: 'jane@fourier.com',
      });

      for (const date of dates) {
        const hasClockOut = Math.random() > 0.2; // 80% chance of clocking out
        const hourIn = 0;
        // Randomize clock in minutes between 0-15
        const minuteIn = Math.floor(Math.random() * 16);
        const secondIn = Math.floor(Math.random() * 60);
        const clockInTime = new Date(date.setHours(hourIn, minuteIn, secondIn));

        const hourOut = hourIn + 9;
        const minuteOut = Math.floor(Math.random() * 16);
        const secondOut = Math.floor(Math.random() * 60);
        const clockOutTime = new Date(
          date.setHours(hourOut, minuteOut, secondOut),
        );

        const totalWorkTime = hasClockOut
          ? clockOutTime.getTime() - clockInTime.getTime()
          : 0; // in milliseconds

        // const clockInToday = new Date(date.getTime())
        await this.attendanceRepository.save({
          employee: employeeJane!,
          date,
          clockIn: clockInTime,
          clockOut: hasClockOut ? clockOutTime : null,
          totalWorkTime,
        });
      }
    }

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

    const admin = await this.employeeRepository.save({
      firstName: 'Admin',
      lastName: 'User',
      employeeNumber: 'EMP0001',
      email: 'admin@fourier.com',
      password: hashedPassword,
      role: AccountRole.ADMIN,
      employmentType: EmploymentType.FULLTIME,
      department: engineering,
      position: lead,
      gender: 'male' as const,
      dateOfBirth: new Date('1990-01-15'),
    });
    await this.contactRepository.save({
      employeeNumber: admin.employeeNumber,
      employee: admin,
      phone: '+6281234567890',
      address: 'Jl. Sudirman No. 1, Jakarta',
    });

    const john = await this.employeeRepository.save({
      firstName: 'John',
      lastName: 'Doe',
      employeeNumber: 'EMP0002',
      email: 'john@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.FULLTIME,
      department: engineering,
      position: senior,
      gender: 'male' as const,
      dateOfBirth: new Date('1993-05-22'),
    });
    await this.contactRepository.save({
      employeeNumber: john.employeeNumber,
      employee: john,
      phone: '+6281234567891',
      address: 'Jl. Thamrin No. 5, Jakarta',
    });

    const jane = await this.employeeRepository.save({
      firstName: 'Jane',
      lastName: 'Smith',
      employeeNumber: 'EMP0003',
      email: 'jane@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.FULLTIME,
      department: hr,
      position: hrManager,
      gender: 'female' as const,
      dateOfBirth: new Date('1991-08-30'),
    });
    await this.contactRepository.save({
      employeeNumber: jane.employeeNumber,
      employee: jane,
      phone: '+6281234567892',
      address: 'Jl. Gatot Subroto No. 10, Jakarta',
    });

    const bob = await this.employeeRepository.save({
      firstName: 'Bob',
      lastName: 'Wilson',
      employeeNumber: 'EMP0004',
      email: 'bob@fourier.com',
      password: hashedPassword,
      role: AccountRole.STANDARD,
      employmentType: EmploymentType.INTERN,
      department: marketing,
      position: junior,
      gender: 'male' as const,
      dateOfBirth: new Date('2000-03-10'),
    });
    await this.contactRepository.save({
      employeeNumber: bob.employeeNumber,
      employee: bob,
      phone: '+6281234567893',
      address: 'Jl. Kuningan No. 3, Jakarta',
    });
    console.log('Seed completed successfully');
  }
}
