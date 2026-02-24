import { IsOptional, IsDateString } from 'class-validator';

export class ClockInDto {
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
