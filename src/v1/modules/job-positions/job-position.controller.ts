import {
  Controller,
  Get,
  Post,
  Patch,
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
import { JobPositionService } from './job-position.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionResponseDto } from './dto/job-position-response.dto';

@ApiTags('Job Positions')
@ApiBearerAuth()
@Controller({
  path: 'job-positions',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class JobPositionController {
  constructor(private readonly jobPositionService: JobPositionService) {}

  @Post()
  @ApiOperation({ summary: 'Create new job position' })
  @ApiResponse({
    status: 201,
    description: 'Job position created',
    type: JobPositionResponseDto,
  })
  async create(@Body() dto: CreateJobPositionDto) {
    const jobPosition = await this.jobPositionService.createWithCache(dto);
    return JobPositionResponseDto.fromEntity(jobPosition);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job positions' })
  @ApiResponse({ status: 200, type: JobPositionResponseDto, isArray: true })
  async findAll() {
    const jobPositions = await this.jobPositionService.findAllWithCache();
    return JobPositionResponseDto.fromEntities(jobPositions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job position by ID' })
  @ApiResponse({ status: 200, type: JobPositionResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const jobPosition = await this.jobPositionService.findOneWithCache(id);
    return JobPositionResponseDto.fromEntity(jobPosition);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job position' })
  @ApiResponse({ status: 200, type: JobPositionResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobPositionDto,
  ) {
    const jobPosition = await this.jobPositionService.updateWithCache(id, dto);
    return JobPositionResponseDto.fromEntity(jobPosition);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job position' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobPositionService.deleteWithCache(id);
  }
}
