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
    attendance.totalWorkTime = date.getTime() - attendance.clockIn.getTime();
    await this.attendanceRepository.save(attendance);

    return {
      id: attendance.id,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      totalWorkTime: attendance.totalWorkTime,
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
    const from = new Date(`${year}-${month}-1`);
    const to = new Date(`${year}-${month + 1}-1`);
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

    const records = Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, i) => {
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
      },
    );

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
          stats.totalWorkingHours += attendance.totalWorkTime;
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
    stats.totalWorkingHours = stats.totalWorkingHours / 1000; // convert ms to seconds
    const totalHours = Math.floor(stats.totalWorkingHours / 3600);
    const totalMinutes = Math.floor((stats.totalWorkingHours % 3600) / 60);
    const totalSeconds = Math.floor(stats.totalWorkingHours % 60);
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

  async getAdminAttendanceReport({
    from,
    to,
    keyword,
  }: AdminAttendanceQueryDto) {
    if (from > to) {
      throw new BadRequestException('Invalid date range: from > to');
    }

    // Search by employee name or email
    const search = keyword ? `%${keyword}%` : null;

    // Get total and avg of working hours grouped by employee
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.date >= :from', { from })
      .andWhere('attendance.date <= :to', { to })
      .leftJoinAndSelect('attendance.employee', 'employee');

    if (search) {
      queryBuilder.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const holidayRecords = await this.holidayRepository.find({
      where: {
        date: Between(from, to),
      },
      select: ['date'],
    });

    const totalDateInRange =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1;
    const holidayDateInRange = holidayRecords.map((r) => r.date);

    const [data] = await queryBuilder
      .orderBy('attendance.date', 'DESC')
      .getManyAndCount();

    // Process data to group by employee
    const groupedData = data.reduce(
      (acc, record) => {
        const empId = record.employee.id;
        if (!acc[empId]) {
          acc[empId] = {
            employeeId: empId,
            firstName: record.employee.firstName,
            lastName: record.employee.lastName || '',
            email: record.employee.email,
            totalWorkingHours: 0,
            present: 0,
            incomplete: 0,
          };
        }

        const workingHours =
          record.clockIn && record.clockOut
            ? record.clockOut.getTime() - record.clockIn.getTime()
            : 0;
        acc[empId].totalWorkingHours += workingHours;
        if (record.clockIn && record.clockOut) {
          acc[empId].present++;
        } else if (record.clockIn && !record.clockOut) {
          acc[empId].incomplete++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          employeeId: string;
          firstName: string;
          lastName: string;
          email: string;
          totalWorkingHours: number;
          present: number;
          incomplete: number;
        }
      >,
    );

    return {
      records: Object.values(groupedData).map((rec) => {
        const totalDays = rec.present + rec.incomplete;
        return {
          ...rec,
          avgWorkingHours:
            totalDays > 0 ? rec.totalWorkingHours / totalDays : 0,
          absent:
            totalDateInRange -
            holidayDateInRange.length -
            rec.present -
            rec.incomplete,
        };
      }),
    };
  }
}
