import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Between, In, Repository } from 'typeorm';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { Employee } from '../../../shared/entities/employee.entity';
import { Holiday } from '../../../shared/entities/holiday.entity';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { AttendanceSummaryReportDto } from './dto/attendance-summary-report.dto';
import { EmployeeAttendanceReportDto } from './dto/employee-attendance-report.dto';
import { EmployeeResponseDto } from '../employees/dto/employee-response.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  async getAttendanceReport(
    query: AttendanceReportQueryDto,
  ): Promise<AttendanceSummaryReportDto> {
    const start = dayjs(query.startDate).startOf('day');
    const end = dayjs(query.endDate).endOf('day');

    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
      throw new BadRequestException('Invalid date range');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const employeeQuery = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.jobPosition', 'jobPosition')
      .orderBy('employee.firstName', 'ASC')
      .addOrderBy('employee.lastName', 'ASC');

    if (query.employeeName) {
      employeeQuery.andWhere(
        '(employee.firstName ILIKE :employeeName OR employee.lastName ILIKE :employeeName)',
        { employeeName: `%${query.employeeName}%` },
      );
    }

    if (query.departmentId) {
      employeeQuery.andWhere('department.id = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    const [employees, total] = await employeeQuery
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    if (employees.length === 0) {
      const holidayDates = await this.getHolidayDates(
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD'),
      );
      return {
        items: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        workingDays: this.getWorkingDays(start, end, holidayDates),
        holidays: holidayDates.size,
      };
    }

    const employeeIds = employees.map((employee) => employee.id);
    const holidayDates = await this.getHolidayDates(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD'),
    );
    const workingDays = this.getWorkingDays(start, end, holidayDates);

    const attendances = await this.attendanceRepository.find({
      where: {
        employee: { id: In(employeeIds) },
        date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
      },
      relations: ['employee'],
      order: { date: 'ASC' },
    });

    const items = employees.map((employee) => {
      const employeeAttendances = attendances.filter(
        (attendance) => attendance.employee.id === employee.id,
      );

      const presentDays = employeeAttendances.filter(
        (attendance) => attendance.clockIn && attendance.clockOut,
      ).length;
      const incompleteDays = employeeAttendances.filter(
        (attendance) => attendance.clockIn && !attendance.clockOut,
      ).length;
      const absentDays = Math.max(workingDays - employeeAttendances.length, 0);

      const durations = employeeAttendances
        .filter((attendance) => attendance.clockIn && attendance.clockOut)
        .map((attendance) => {
          const clockIn = dayjs(attendance.clockIn);
          const clockOut = dayjs(attendance.clockOut);
          return Math.max(clockOut.diff(clockIn, 'minute'), 0);
        });

      const totalDurationMinutes = durations.reduce(
        (sum, duration) => sum + duration,
        0,
      );
      const averageDurationMinutes =
        durations.length > 0
          ? Math.round(totalDurationMinutes / durations.length)
          : 0;

      return {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName ?? null,
          department: employee.department?.name ?? null,
          jobPosition: employee.jobPosition?.name ?? null,
        },
        presentDays,
        incompleteDays,
        absentDays,
        totalDurationMinutes,
        averageDurationMinutes,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      workingDays,
      holidays: holidayDates.size,
    };
  }

  private async getHolidayDates(
    startDate: string,
    endDate: string,
  ): Promise<Set<string>> {
    const holidays = await this.holidayRepository.find({
      where: { date: Between(startDate, endDate) },
    });

    return new Set(holidays.map((holiday) => holiday.date));
  }

  private getWorkingDays(
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
    holidayDates: Set<string>,
  ): number {
    let count = 0;

    for (
      let current = start;
      current.isBefore(end) || current.isSame(end, 'day');
      current = current.add(1, 'day')
    ) {
      if (!holidayDates.has(current.format('YYYY-MM-DD'))) {
        count += 1;
      }
    }

    return count;
  }

  async getEmployeeAttendance(
    employeeId: string,
    startDate: string,
    endDate: string,
  ): Promise<EmployeeAttendanceReportDto> {
    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).endOf('day');

    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
      throw new BadRequestException('Invalid date range');
    }

    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const attendances = await this.attendanceRepository.find({
      where: {
        employee: { id: employeeId },
        date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
      },
      order: { date: 'ASC' },
    });

    const holidayDates = await this.getHolidayDates(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD'),
    );
    const workingDays = this.getWorkingDays(start, end, holidayDates);

    const present = attendances.filter(
      (attendance) => attendance.clockIn && attendance.clockOut,
    ).length;
    const incomplete = attendances.filter(
      (attendance) => attendance.clockIn && !attendance.clockOut,
    ).length;
    const absent = Math.max(workingDays - attendances.length, 0);

    const durations = attendances
      .filter((attendance) => attendance.clockIn && attendance.clockOut)
      .map((attendance) => {
        const clockIn = dayjs(attendance.clockIn);
        const clockOut = dayjs(attendance.clockOut);
        return Math.max(clockOut.diff(clockIn, 'minute'), 0);
      });

    const totalDurationMinutes = durations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageDurationMinutes =
      durations.length > 0
        ? Math.round(totalDurationMinutes / durations.length)
        : 0;

    return {
      employee: EmployeeResponseDto.fromEntity(employee),
      attendances: attendances.map((attendance) => ({
        date: attendance.date,
        clockIn: attendance.clockIn ?? null,
        clockOut: attendance.clockOut ?? null,
        status: attendance.clockOut ? 'present' : 'incomplete',
      })),
      stats: {
        present,
        incomplete,
        absent,
        holidays: holidayDates.size,
        totalDurationMinutes,
        averageDurationMinutes,
      },
    };
  }
}
