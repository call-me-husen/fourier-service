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
import { AttendanceHistoryQueryDto } from './dto/history.dto';

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

  async clockIn(employeeId: string, { date }: ClockInDto) {
    const isHolidayToday = await this.isHoliday(date);
    if (isHolidayToday) {
      throw new BadRequestException('Cannot clock-in on a holiday');
    }

    let attendance = await this.attendanceRepository.findOne({
      where: { employeeId, date },
    });

    if (attendance) {
      if (attendance.clockIn) {
        throw new BadRequestException('Duplicate clock-in for today');
      }
    } else {
      attendance = this.attendanceRepository.create({
        employeeId,
        date,
        clockIn: date.toISOString(),
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

  async clockOut(employeeId: string, { date }: ClockOutDto) {
    const isHolidayToday = await this.isHoliday(date);
    if (isHolidayToday) {
      throw new BadRequestException('Cannot clock-out on a holiday');
    }

    // const clockOutTime = this.getJakartaDate(dto.timestamp);

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

    attendance.clockOut = date;
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

  async getMyAttendanceHistory(
    employeeId: string,
    query: AttendanceHistoryQueryDto,
  ) {
    const { month, year } = query;
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0); // Last day of the month

    // Holiday
    const holidayRecords = await this.holidayRepository.find({
      where: {
        date: Between(from, to),
      },
    });

    // Attendance records (holidays included)
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(from, to),
      },
      order: { date: 'ASC' },
    });

    const stats = {
      holiday: 0,
      present: 0,
      absent: 0,
      incomplete: 0,
    };

    const records = Array.from({ length: to.getDate() }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      const formattedDate = date.toLocaleDateString('en-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const isHoliday = holidayRecords.some(
        (r) =>
          new Date(r.date).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );

      if (isHoliday) {
        stats.holiday++;
        return {
          date: formattedDate,
          state: 'holiday',
          clockIn: null,
          clockOut: null,
        };
      }

      const isFuture = date.getTime() > Date.now();
      if (isFuture) {
        return {
          date: formattedDate,
          state: 'future',
          clockIn: null,
          clockOut: null,
        };
      }

      const attendance = attendanceRecords.find(
        (a) =>
          new Date(a.date).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );

      const state = attendance
        ? attendance.clockIn && attendance.clockOut
          ? 'present'
          : 'incomplete'
        : 'absent';

      stats[state]++;
      return {
        date: formattedDate,
        state,
        clockIn: attendance ? Number(attendance.clockIn) : null,
        clockOut: attendance ? Number(attendance.clockOut) : null,
      };
    });

    return {
      records: records.reduce(
        (acc, rec) => {
          return {
            ...acc,
            [rec.date]: rec,
          };
        },
        {} as Record<string, (typeof records)[0]>,
      ),
      stats,
    };
  }

  async getMyAttendanceDashboard(employeeId: string) {
    // Get start and end of current week (Monday to Sunday)
    const today = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );

    const firstDayOfWeek = new Date(
      new Date().setDate(today.getDate() - today.getDay() + 1),
    );

    const lastDayOfWeek = new Date(
      new Date().setDate(today.getDate() - today.getDay() + 7),
    );

    const holidayRecords = await this.holidayRepository.find({
      where: {
        date: Between(firstDayOfWeek, lastDayOfWeek),
      },
    });

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(firstDayOfWeek, lastDayOfWeek),
      },
    });

    const isTodayHoliday = await this.holidayRepository.findOne({
      where: {
        date: today,
      },
    });

    console.log('isTodayHoliday', isTodayHoliday?.date, today);

    const stats = {
      holiday: 0,
      working: 0,
      absent: 0,
      totalWorkingHours: 0,
    };

    let clockInToday: Date | null = null;
    let clockOutToday: Date | null = null;
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(date.getDate() + i);

      const isHoliday = holidayRecords.some(
        (r) =>
          new Date(r.date).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );

      if (isHoliday) {
        stats.holiday++;
        continue;
      }

      const isFuture = date.getTime() > Date.now();
      if (isFuture) {
        continue;
      }

      const attendance = attendanceRecords.find(
        (a) =>
          new Date(a.date).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );

      if (attendance) {
        stats.working++;
        if (attendance.clockIn && attendance.clockOut) {
          const clockInTime = new Date(attendance.clockIn).getTime();
          const clockOutTime = new Date(attendance.clockOut).getTime();
          stats.totalWorkingHours +=
            (clockOutTime - clockInTime) / (1000 * 60 * 60);
        }
      } else {
        stats.absent++;
      }

      // Today details
      if (
        date.toISOString().split('T')[0] ===
        new Date().toISOString().split('T')[0]
      ) {
        clockInToday = attendance ? attendance.clockIn : null;
        clockOutToday = attendance ? attendance.clockOut : null;
      }
    }

    // HH:MM:DD format
    const totalHours = Math.floor(stats.totalWorkingHours);
    const totalMinutes = Math.floor(
      (stats.totalWorkingHours - totalHours) * 60,
    );
    const totalSeconds = Math.floor(
      ((stats.totalWorkingHours - totalHours) * 60 - totalMinutes) * 60,
    );
    const formattedTotalWorkingHours = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds
      .toString()
      .padStart(2, '0')}`;

    return {
      stats: {
        ...stats,
        formattedTotalWorkingHours,
      },
      today: {
        isHoliday: isTodayHoliday ? true : false,
        clockIn: clockInToday ?? null,
        clockOut: clockOutToday ?? null,
      },
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
