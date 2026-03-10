import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { AttendanceSummaryReportDto } from './dto/attendance-summary-report.dto';
import { EmployeeAttendanceReportDto } from './dto/employee-attendance-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({
  path: 'reports',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly reportService: ReportService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'employeeName', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: AttendanceSummaryReportDto })
  getAttendanceReport(@Query() query: AttendanceReportQueryDto) {
    return this.reportService.getAttendanceReport(query);
  }

  @Get('employee-attendance/:employeeId')
  @ApiOperation({ summary: 'Get employee attendance report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, type: EmployeeAttendanceReportDto })
  getEmployeeAttendance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getEmployeeAttendance(
      employeeId,
      startDate,
      endDate,
    );
  }
}
