import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateHolidayDto {
  @IsString()
  @IsNotEmpty({ message: 'Holiday name is required' })
  name!: string;

  @IsString()
  description?: string;
}
