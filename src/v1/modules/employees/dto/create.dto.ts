import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  employeeCode: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  surename?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsUUID()
  roleId: string;

  @IsUUID()
  departmentId: string;

  @IsUUID()
  jobPositionId: string;
}
