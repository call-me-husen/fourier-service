import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { AccountRole } from '../database/entities';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceHistoryQueryDto } from './dto/history.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: AccountRole;
  };
}

@Controller('attendance')
@UseGuards(JwtGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Req() req: AuthenticatedRequest, @Body() dto: ClockInDto) {
    return await this.attendanceService.clockIn(req.user.id, dto);
  }

  @Post('clock-out')
  async clockOut(@Req() req: AuthenticatedRequest, @Body() dto: ClockOutDto) {
    return await this.attendanceService.clockOut(req.user.id, dto);
  }

  @Get()
  async getMyAttendance(
    @Req() req: AuthenticatedRequest,
    @Query() query: AttendanceQueryDto,
  ) {
    return await this.attendanceService.getMyAttendance(req.user.id, query);
  }

  @Get('history')
  async getMyAttendanceHistory(
    @Req() req: AuthenticatedRequest,
    @Query() query: AttendanceHistoryQueryDto,
  ) {
    return await this.attendanceService.getMyAttendanceHistory(
      req.user.id,
      query,
    );
  }

  @Get('dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return await this.attendanceService.getMyAttendanceDashboard(req.user.id);
  }

  @Get('report')
  @UseGuards(RoleGuard)
  @Roles(AccountRole.ADMIN)
  async getAdminAttendanceReport(@Query() query: AdminAttendanceQueryDto) {
    return await this.attendanceService.getAdminAttendanceReport(query);
  }
}
