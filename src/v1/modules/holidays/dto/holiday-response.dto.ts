import { ApiProperty } from '@nestjs/swagger';
import { Holiday } from '../../../../shared/entities/holiday.entity';

export class HolidayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  name: string;

  static fromEntity(
    holiday: Holiday | null | undefined,
  ): HolidayResponseDto | null {
    if (!holiday) {
      return null;
    }

    return {
      id: holiday.id,
      date: holiday.date,
      name: holiday.name,
    };
  }

  static fromEntities(holidays: Holiday[]): HolidayResponseDto[] {
    return holidays.map((holiday) => HolidayResponseDto.fromEntity(holiday)!);
  }
}
