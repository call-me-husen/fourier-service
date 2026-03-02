import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class ClockOutDto {
  @IsDate()
  @Type(() => Date)
  date!: Date;
}
