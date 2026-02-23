import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccountRole } from '../database/entities';
import { CreateHolidayDto } from './dto/create.dto';
import { BulkHolidayDto } from './dto/bulk.dto';
import { UpdateHolidayDto } from './dto/update.dto';

@Controller('api/holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(@Query('from') fromDate: string, @Query('to') toDate: string) {
    return this.holidaysService.findAll(fromDate, toDate);
  }

  @Post()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  create(@Body() body: CreateHolidayDto) {
    return this.holidaysService.create(body);
  }

  @Post('insert-many')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  insertMany(@Body() body: BulkHolidayDto) {
    return this.holidaysService.insertMany(body);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  update(
    @Param('id')
    id: Date,
    @Body() body: UpdateHolidayDto,
  ) {
    return this.holidaysService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  delete(@Param('id') id: Date) {
    return this.holidaysService.delete(id);
  }
}
