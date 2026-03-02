import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JobPositionsService } from './job-positions.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { AccountRole } from '../database/entities';

@Controller('api/job-positions')
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  @Post()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async create(@Body() createJobPositionDto: CreateJobPositionDto) {
    return await this.jobPositionsService.create(createJobPositionDto);
  }

  @Get()
  @Get()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async queryAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return await this.jobPositionsService.queryAll({ page, limit, search });
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.jobPositionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateJobPositionDto: UpdateJobPositionDto,
  ) {
    return this.jobPositionsService.update(id, updateJobPositionDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.jobPositionsService.remove(id);
  }
}
