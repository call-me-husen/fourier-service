import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobPositionDto {
  @ApiProperty({ example: 'Senior Engineer' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Senior level engineering position' })
  @IsString()
  @IsOptional()
  description?: string;
}
