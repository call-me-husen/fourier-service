import { ApiProperty } from '@nestjs/swagger';

class AttendanceReportEmployeeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty({ nullable: true })
  jobPosition: string | null;
}

export class AttendanceSummaryItemDto {
  @ApiProperty({ type: () => AttendanceReportEmployeeDto })
  employee: AttendanceReportEmployeeDto;

  @ApiProperty()
  presentDays: number;

  @ApiProperty()
  incompleteDays: number;

  @ApiProperty()
  absentDays: number;

  @ApiProperty()
  totalDurationMinutes: number;

  @ApiProperty()
  averageDurationMinutes: number;
}

export class AttendanceSummaryReportDto {
  @ApiProperty({ type: () => AttendanceSummaryItemDto, isArray: true })
  items: AttendanceSummaryItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  workingDays: number;

  @ApiProperty()
  holidays: number;
}
