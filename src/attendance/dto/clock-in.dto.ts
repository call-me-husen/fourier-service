import { Type } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';

export class ClockInDto {
  @IsDate()
  @Type(() => Date)
  date!: Date;
}
