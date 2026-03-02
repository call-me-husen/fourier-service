import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { AccountRole, EmploymentType } from '../../database/entities';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @MaxLength(255)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MaxLength(255)
  password!: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber!: string;

  // Photo profile is a file
  photo!: Express.Multer.File;

  @IsEnum(AccountRole)
  role!: AccountRole;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType!: EmploymentType;

  @IsString()
  departmentId!: string;

  @IsString()
  positionId!: string;

  @IsEnum(['male', 'female'])
  gender!: 'male' | 'female';

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth!: Date;
}
