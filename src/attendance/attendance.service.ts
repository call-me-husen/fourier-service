import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../database/entities/attendance.entity';
import { Employee } from '../database/entities/employee.entity';
import { Holiday } from '../database/entities/holidays';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  private getJakartaDate(date?: string): Date {
    if (date) {
      return new Date(date);
    }
    return new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
  }

  private getJakartaDateOnly(date?: string): Date {
    const jakartaDate = this.getJakartaDate(date);
    return new Date(jakartaDate.toISOString().split('T')[0]);
  }

  private getFirstDayOfCurrentMonth(): Date {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private async isHoliday(date: Date): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0];
    const holiday = await this.holidayRepository.findOne({
      where: { date: new Date(dateString) },
    });
    return !!holiday;
  }

  async clockIn(employeeId: string, dto: ClockInDto) {
    const date = this.getJakartaDateOnly();
    const isHolidayToday = await this.isHoliday(date);
    if (isHolidayToday) {
      throw new BadRequestException('Cannot clock-in on a holiday');
    }

    const clockInTime = this.getJakartaDate(dto.timestamp);

    let attendance = await this.attendanceRepository.findOne({
      where: { employeeId, date },
    });

    if (attendance) {
      if (attendance.clockIn) {
        throw new BadRequestException('Duplicate clock-in for today');
      }
      attendance.clockIn = clockInTime;
    } else {
      attendance = this.attendanceRepository.create({
        employeeId,
        date,
        clockIn: clockInTime,
      });
    }

    await this.attendanceRepository.save(attendance);

    return {
      id: attendance.id,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      status: 'clocked_in',
    };
  }

  async clockOut(employeeId: string, dto: ClockOutDto) {
    const date = this.getJakartaDateOnly();
    const isHolidayToday = await this.isHoliday(date);
    if (isHolidayToday) {
      throw new BadRequestException('Cannot clock-out on a holiday');
    }

    const clockOutTime = this.getJakartaDate(dto.timestamp);

    const attendance = await this.attendanceRepository.findOne({
      where: { employeeId, date },
    });

    if (!attendance) {
      throw new BadRequestException('No clock-in record found for today');
    }

    if (!attendance.clockIn) {
      throw new BadRequestException('Cannot clock-out before clock-in');
    }

    if (attendance.clockOut) {
      throw new BadRequestException('Duplicate clock-out for today');
    }

    attendance.clockOut = clockOutTime;
    await this.attendanceRepository.save(attendance);

    return {
      id: attendance.id,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      status: 'clocked_out',
    };
  }

  async getMyAttendance(employeeId: string, query: AttendanceQueryDto) {
    const today = this.getJakartaDateOnly();
    const from = query.from
      ? this.getJakartaDateOnly(query.from)
      : this.getFirstDayOfCurrentMonth();
    const to = query.to ? this.getJakartaDateOnly(query.to) : today;

    if (from > to) {
      throw new BadRequestException('Invalid date range: from > to');
    }

    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const [data, total] = await this.attendanceRepository.findAndCount({
      where: {
        employeeId,
        date: Between(from, to),
      },
      order: { date: 'DESC', clockIn: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAdminAttendanceReport(query: AdminAttendanceQueryDto) {
    const today = this.getJakartaDateOnly();
    const from = query.from
      ? this.getJakartaDateOnly(query.from)
      : this.getFirstDayOfCurrentMonth();
    const to = query.to ? this.getJakartaDateOnly(query.to) : today;

    if (from > to) {
      throw new BadRequestException('Invalid date range: from > to');
    }

    const { page = 1, limit = 10, search, employeeId } = query;
    const offset = (page - 1) * limit;

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.date >= :from', { from })
      .andWhere('attendance.date <= :to', { to });

    if (employeeId) {
      queryBuilder.andWhere('attendance.employeeId = :employeeId', {
        employeeId,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('attendance.date', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const adminData = data.map((attendance) => ({
      id: attendance.id,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      employeeId: attendance.employeeId,
      employee: attendance.employee
        ? {
            employeeNumber: attendance.employee.employeeNumber,
            firstName: attendance.employee.firstName,
            lastName: attendance.employee.lastName,
            email: attendance.employee.email,
          }
        : null,
    }));

    return {
      data: adminData,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
