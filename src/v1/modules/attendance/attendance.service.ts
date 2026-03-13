import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, IsNull, Repository } from 'typeorm';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { Holiday } from '../../../shared/entities/holiday.entity';
import dayjs from 'dayjs';

type AttendanceStatus = 'present' | 'incomplete' | 'holiday';

type AttendanceWithStatus = Attendance & {
  status: AttendanceStatus;
};

type AttendanceStats = {
  present: number;
  incomplete: number;
  absent: number;
  holidays: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
};

type MyAttendanceResult = {
  attendances: AttendanceWithStatus[];
  stats: AttendanceStats;
  holidays: Holiday[];
};

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    private dataSource: DataSource,
  ) {}

  private toAttendanceWithStatus(
    attendance: Attendance | null,
  ): AttendanceWithStatus | null {
    if (!attendance) {
      return null;
    }

    return {
      ...attendance,
      status: attendance.clockOut ? 'present' : 'incomplete',
    };
  }

  private toAttendancesWithStatus(
    attendances: Attendance[],
  ): AttendanceWithStatus[] {
    return attendances.map((attendance) => ({
      ...attendance,
      status: attendance.clockOut ? 'present' : 'incomplete',
    }));
  }

  private async getHolidayDateSet(
    startDate: string,
    endDate: string,
  ): Promise<Set<string>> {
    const holidays = await this.holidayRepository.find({
      where: { date: Between(startDate, endDate) },
    });

    return new Set(holidays.map((holiday) => holiday.date));
  }

  private countWorkingDays(
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
    holidayDates: Set<string>,
  ): number {
    let count = 0;

    for (
      let current = start.startOf('day');
      current.isBefore(end) || current.isSame(end, 'day');
      current = current.add(1, 'day')
    ) {
      const date = current.format('YYYY-MM-DD');
      if (!holidayDates.has(date)) {
        count += 1;
      }
    }

    return count;
  }

  private async buildStats(
    attendances: AttendanceWithStatus[],
    month?: number,
    year?: number,
  ): Promise<AttendanceStats> {
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    const present = attendances.filter(
      (attendance) => attendance.status === 'present',
    ).length;
    const incomplete = attendances.filter(
      (attendance) => attendance.status === 'incomplete',
    ).length;

    const durations = attendances
      .filter((attendance) => attendance.clockIn && attendance.clockOut)
      .map((attendance) =>
        Math.max(
          dayjs(attendance.clockOut).diff(dayjs(attendance.clockIn), 'minute'),
          0,
        ),
      );

    const totalDurationMinutes = durations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageDurationMinutes =
      durations.length > 0
        ? Math.round(totalDurationMinutes / durations.length)
        : 0;

    let absent = 0;
    let holidays = 0;

    if (month && year) {
      const monthStart = dayjs(`${year}-${month}-01`).startOf('month');
      const monthEnd = dayjs(`${year}-${month}-01`).endOf('month');

      const holidayDates = await this.getHolidayDateSet(
        monthStart.format('YYYY-MM-DD'),
        monthEnd.format('YYYY-MM-DD'),
      );
      holidays = holidayDates.size;

      let start = monthStart;
      let end = monthEnd;

      if (end.isAfter(yesterday)) {
        end = yesterday;
      }
      if (start.isAfter(yesterday)) {
        start = yesterday.add(1, 'day');
      }

      if (start.isBefore(end) || start.isSame(end, 'day')) {
        const workingDays = this.countWorkingDays(start, end, holidayDates);
        const attendedDays = attendances.filter((a) => {
          const attendanceDate = dayjs(a.date);
          return (
            (attendanceDate.isAfter(start) ||
              attendanceDate.isSame(start, 'day')) &&
            (attendanceDate.isBefore(end) || attendanceDate.isSame(end, 'day'))
          );
        }).length;
        absent = Math.max(workingDays - attendedDays, 0);
      }
    } else if (attendances.length > 0) {
      const dates = attendances.map((attendance) => dayjs(attendance.date));
      const sortedDates = dates.sort(
        (left, right) => left.valueOf() - right.valueOf(),
      );
      const rangeStart = sortedDates[0];
      const rangeEnd = sortedDates[sortedDates.length - 1];

      const holidayDates = await this.getHolidayDateSet(
        rangeStart.format('YYYY-MM-DD'),
        rangeEnd.format('YYYY-MM-DD'),
      );
      holidays = holidayDates.size;

      let start = rangeStart;
      let end = rangeEnd;

      if (end.isAfter(yesterday)) {
        end = yesterday;
      }
      if (start.isAfter(yesterday)) {
        start = yesterday.add(1, 'day');
      }

      if (start.isBefore(end) || start.isSame(end, 'day')) {
        const workingDays = this.countWorkingDays(start, end, holidayDates);
        const attendedDays = attendances.filter((a) => {
          const attendanceDate = dayjs(a.date);
          return (
            (attendanceDate.isAfter(start) ||
              attendanceDate.isSame(start, 'day')) &&
            (attendanceDate.isBefore(end) || attendanceDate.isSame(end, 'day'))
          );
        }).length;
        absent = Math.max(workingDays - attendedDays, 0);
      }
    }

    return {
      present,
      incomplete,
      absent,
      holidays,
      totalDurationMinutes,
      averageDurationMinutes,
    };
  }

  async clockIn(employeeId: string) {
    const today = dayjs().format('YYYY-MM-DD');

    const holiday = await this.holidayRepository.findOne({
      where: { date: today },
    });
    if (holiday) {
      throw new BadRequestException('Cannot clock in on a holiday');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(Attendance, {
        where: { employee: { id: employeeId }, date: today },
      });

      if (existing && existing.clockIn) {
        throw new BadRequestException('Already clocked in today');
      }

      if (existing) {
        await queryRunner.manager.update(Attendance, existing.id, {
          clockIn: new Date(),
        });
      } else {
        await queryRunner.manager.insert(Attendance, {
          employee: { id: employeeId },
          date: today,
          clockIn: new Date(),
        });
      }

      await queryRunner.commitTransaction();
      return { message: 'Clocked in successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clockOut(employeeId: string) {
    const today = dayjs().format('YYYY-MM-DD');

    const result = await this.attendanceRepository.update(
      { employee: { id: employeeId }, date: today, clockOut: IsNull() },
      { clockOut: new Date() },
    );

    if (result.affected === 0) {
      throw new BadRequestException('No incomplete attendance record found');
    }

    return { message: 'Clocked out successfully' };
  }

  async getTodayAttendance(employeeId: string) {
    const today = dayjs().format('YYYY-MM-DD');

    const holiday = await this.holidayRepository.findOne({
      where: { date: today },
    });

    if (holiday) {
      return {
        id: '',
        employee: { id: employeeId } as any,
        date: today,
        clockIn: null,
        clockOut: null,
        status: 'holiday' as const,
      };
    }

    const attendance = await this.attendanceRepository.findOne({
      where: { employee: { id: employeeId }, date: today },
    });

    return this.toAttendanceWithStatus(attendance);
  }

  async getMyAttendances(
    employeeId: string,
    month?: number,
    year?: number,
  ): Promise<MyAttendanceResult> {
    if (month && year) {
      const startDate = dayjs(`${year}-${month}-01`)
        .startOf('month')
        .format('YYYY-MM-DD');
      const endDate = dayjs(`${year}-${month}-01`)
        .endOf('month')
        .format('YYYY-MM-DD');

      const attendances = await this.attendanceRepository.find({
        where: {
          employee: { id: employeeId },
          date: Between(startDate, endDate),
        },
        order: { date: 'DESC' },
      });

      const holidays = await this.holidayRepository.find({
        where: { date: Between(startDate, endDate) },
        order: { date: 'ASC' },
      });

      const attendancesWithStatus = this.toAttendancesWithStatus(attendances);
      return {
        attendances: attendancesWithStatus,
        stats: await this.buildStats(attendancesWithStatus, month, year),
        holidays,
      };
    }

    const attendances = await this.attendanceRepository.find({
      where: { employee: { id: employeeId } },
      order: { date: 'DESC' },
    });

    let holidays: Holiday[] = [];
    if (attendances.length > 0) {
      const dates = attendances.map((attendance) => dayjs(attendance.date));
      const sortedDates = dates.sort(
        (left, right) => left.valueOf() - right.valueOf(),
      );
      const startDate = sortedDates[0].format('YYYY-MM-DD');
      const endDate = sortedDates[sortedDates.length - 1].format('YYYY-MM-DD');

      holidays = await this.holidayRepository.find({
        where: { date: Between(startDate, endDate) },
        order: { date: 'ASC' },
      });
    }

    const attendancesWithStatus = this.toAttendancesWithStatus(attendances);

    return {
      attendances: attendancesWithStatus,
      stats: await this.buildStats(attendancesWithStatus),
      holidays,
    };
  }
}
