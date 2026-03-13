import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holiday } from '../../../shared/entities/holiday.entity';
import { HolidayService } from './holidays.service';
import { HolidaysController } from './holidays.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday])],
  controllers: [HolidaysController],
  providers: [HolidayService],
  exports: [HolidayService],
})
export class HolidaysModule {}
