import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'New Year' })
  @IsString()
  name: string;
}
