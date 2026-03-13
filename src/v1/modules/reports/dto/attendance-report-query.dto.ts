import { Type, Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';

export class AttendanceReportQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') {
      return undefined;
    }
    return value;
  })
  employeeName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') {
      return undefined;
    }
    return value;
  })
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit?: number = 10;
}
