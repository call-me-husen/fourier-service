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

export class UpdateEmployeeDto {
  @IsString()
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @MaxLength(255)
  lastName!: string;

  @IsEnum(AccountRole)
  role!: AccountRole;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsString()
  departmentId!: string;

  @IsString()
  positionId!: string;

  @IsEnum(['male', 'female'])
  gender!: 'male' | 'female';

  @Type(() => Date)
  @IsDate()
  dateOfBirth!: Date;
}
