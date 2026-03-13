import { ApiProperty } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty({ example: 'f3b6bdba-afc7-442b-8450-fea52285e29f' })
  id: string;

  @ApiProperty({ example: 'Engineering' })
  name: string;

  @ApiProperty({ example: 'Engineering Department', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'Technology', nullable: true })
  parent: string | null;
}
