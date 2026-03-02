import { IsNotEmpty, IsString } from 'class-validator';

export class EmployeeContactDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact!: string;

  @IsString()
  @IsNotEmpty()
  emergencyPhone!: string;
}
