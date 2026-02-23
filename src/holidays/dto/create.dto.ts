import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty({ message: 'Holiday name is required' })
  name!: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty({ message: 'Holiday date is required' })
  date!: Date;

  @IsString()
  description?: string;
}
