import { IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  parentId?: string | null;
}
