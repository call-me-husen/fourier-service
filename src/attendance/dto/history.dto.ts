import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class AttendanceHistoryQueryDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Type(() => Number)
  year!: number;
}
