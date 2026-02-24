import { IsOptional, IsDateString } from 'class-validator';

export class ClockOutDto {
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
