import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HolidayService } from './holidays.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { Employee } from '../../../shared/entities/employee.entity';

@ApiTags('Holidays')
@ApiBearerAuth()
@Controller({
  path: 'holidays',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class HolidaysController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  @ApiOperation({ summary: 'Create new holiday' })
  @ApiResponse({
    status: 201,
    description: 'Holiday created',
    type: HolidayResponseDto,
  })
  async create(@Body() dto: CreateHolidayDto, @CurrentUser() user: Employee) {
    const holiday = await this.holidayService.createWithCache(dto, user);
    return HolidayResponseDto.fromEntity(holiday);
  }

  @Get()
  @ApiOperation({ summary: 'Get all holidays' })
  @ApiResponse({ status: 200, type: HolidayResponseDto, isArray: true })
  async findAll() {
    const holidays = await this.holidayService.findAllWithCache();
    return HolidayResponseDto.fromEntities(holidays);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete holiday' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Employee,
  ) {
    return this.holidayService.deleteWithCache(id, user);
  }
}
