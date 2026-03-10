import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Employee } from '../../../shared/entities/employee.entity';
import {
  AttendanceResponseDto,
  MyAttendanceResponseDto,
} from './dto/attendance-response.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller({
  path: 'attendance',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in for today' })
  @ApiResponse({ status: 201, description: 'Clocked in successfully' })
  @ApiResponse({ status: 400, description: 'Already clocked in or holiday' })
  clockIn(@CurrentUser() user: Employee) {
    return this.attendanceService.clockIn(user.id);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out for today' })
  @ApiResponse({ status: 201, description: 'Clocked out successfully' })
  @ApiResponse({ status: 400, description: 'No active attendance record' })
  clockOut(@CurrentUser() user: Employee) {
    return this.attendanceService.clockOut(user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today attendance' })
  @ApiResponse({
    status: 200,
    type: AttendanceResponseDto,
    description: 'Today attendance with derived status',
  })
  async getTodayAttendance(@CurrentUser() user: Employee) {
    const attendance = await this.attendanceService.getTodayAttendance(user.id);
    return AttendanceResponseDto.fromData(attendance);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my attendance records' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiResponse({
    status: 200,
    type: MyAttendanceResponseDto,
    description: 'Attendance records with derived status',
  })
  async getMyAttendances(
    @CurrentUser() user: Employee,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const result = await this.attendanceService.getMyAttendances(
      user.id,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
    return {
      attendances: AttendanceResponseDto.fromMany(result.attendances),
      stats: result.stats,
    };
  }
}
