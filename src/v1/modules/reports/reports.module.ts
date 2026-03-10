import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { Employee } from '../../../shared/entities/employee.entity';
import { Holiday } from '../../../shared/entities/holiday.entity';
import { ReportService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Employee, Holiday])],
  controllers: [ReportsController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportsModule {}
