import { ApiProperty } from '@nestjs/swagger';
import { HolidayResponseDto } from '../../holidays/dto/holiday-response.dto';

type AttendanceLike = {
  id: string;
  date: string;
  clockIn?: Date | null;
  clockOut?: Date | null;
  status: 'present' | 'incomplete' | 'holiday';
};

export class AttendanceStatsDto {
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

export class MyAttendanceResponseDto {
  @ApiProperty({ type: () => AttendanceResponseDto, isArray: true })
  attendances: AttendanceResponseDto[];

  @ApiProperty({ type: () => AttendanceStatsDto })
  stats: AttendanceStatsDto;

  @ApiProperty({ type: () => HolidayResponseDto, isArray: true })
  holidays: HolidayResponseDto[];
}

export class AttendanceResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '2026-03-09' })
  date: string;

  @ApiProperty({ example: '2026-03-09T08:12:00.000Z', nullable: true })
  clockIn: Date | null;

  @ApiProperty({ example: '2026-03-09T17:08:00.000Z', nullable: true })
  clockOut: Date | null;

  @ApiProperty({
    enum: ['present', 'incomplete', 'holiday'],
    example: 'present',
  })
  status: 'present' | 'incomplete' | 'holiday';

  static fromData(
    attendance: AttendanceLike | null | undefined,
  ): AttendanceResponseDto | null {
    if (!attendance) {
      return null;
    }

    return {
      id: attendance.id,
      date: attendance.date,
      clockIn: attendance.clockIn ?? null,
      clockOut: attendance.clockOut ?? null,
      status: attendance.status,
    };
  }

  static fromMany(attendances: AttendanceLike[]): AttendanceResponseDto[] {
    return attendances.map(
      (attendance) => AttendanceResponseDto.fromData(attendance)!,
    );
  }
}
