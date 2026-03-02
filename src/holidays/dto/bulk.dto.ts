import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class BulkHolidayDto {
  @IsString()
  @IsNotEmpty({ message: 'Holiday name is required' })
  name!: string;

  @IsString()
  description?: string;

  @Type(() => Date)
  @IsDate({ each: true })
  @IsNotEmpty({ message: 'Holiday dates are required' })
  @ArrayNotEmpty({ message: 'Holiday dates cannot be empty' })
  dates!: Date[];
}
