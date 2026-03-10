import { IsOptional, IsString } from 'class-validator';

export class EmployeeQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;
}
