import { ApiProperty } from '@nestjs/swagger';
import { EmployeeResponseDto } from '../../employees/dto/employee-response.dto';
import { HolidayResponseDto } from '../../holidays/dto/holiday-response.dto';

export class EmployeeAttendanceItemDto {
  @ApiProperty({ example: '2026-01-05' })
  date: string;

  @ApiProperty({ example: '2026-01-05T01:19:00.000Z', nullable: true })
  clockIn: Date | null;

  @ApiProperty({ example: '2026-01-05T10:27:00.000Z', nullable: true })
  clockOut: Date | null;

  @ApiProperty({ enum: ['present', 'incomplete'], example: 'present' })
  status: 'present' | 'incomplete';
}

export class EmployeeAttendanceStatsDto {
  @ApiProperty()
  present: number;

  @ApiProperty()
  incomplete: number;

  @ApiProperty()
  absent: number;

  @ApiProperty()
  holidays: number;

  @ApiProperty()
  totalDurationMinutes: number;

  @ApiProperty()
  averageDurationMinutes: number;
}

export class EmployeeAttendanceReportDto {
  @ApiProperty({ type: () => EmployeeResponseDto, nullable: true })
  employee: EmployeeResponseDto | null;

  @ApiProperty({ type: () => EmployeeAttendanceItemDto, isArray: true })
  attendances: EmployeeAttendanceItemDto[];

  @ApiProperty({ type: () => EmployeeAttendanceStatsDto })
  stats: EmployeeAttendanceStatsDto;

  @ApiProperty({ type: () => HolidayResponseDto, isArray: true })
  holidays: HolidayResponseDto[];
}
