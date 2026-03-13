import { ApiProperty } from '@nestjs/swagger';
import { JobPosition } from '../../../../shared/entities/job-position.entity';

export class JobPositionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  static fromEntity(
    jobPosition: JobPosition | null | undefined,
  ): JobPositionResponseDto | null {
    if (!jobPosition) {
      return null;
    }

    return {
      id: jobPosition.id,
      name: jobPosition.name,
      description: jobPosition.description ?? null,
    };
  }

  static fromEntities(jobPositions: JobPosition[]): JobPositionResponseDto[] {
    return jobPositions.map(
      (jobPosition) => JobPositionResponseDto.fromEntity(jobPosition)!,
    );
  }
}
