import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseFilePipeBuilder,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create.dto';
import { UpdateEmployeeDto } from './dto/update.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmployeeQueryDto } from './dto/query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Employee } from '../../../shared/entities/employee.entity';
import bcrypt from 'bcryptjs';
import { ImageKitService } from '../../../common/services/imagekit.service';

type UploadedImageFile = {
  buffer: Buffer;
  originalname: string;
};

@ApiTags('Employees')
@ApiBearerAuth()
@Controller({
  path: 'employees',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new employee (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Employee created',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: Employee) {
    const employee = await this.employeeService.createWithAudit(
      dto as Partial<Employee>,
      user,
    );
    return EmployeeResponseDto.fromEntity(employee);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'employeeCode', required: false })
  @ApiResponse({ status: 200, type: EmployeeResponseDto, isArray: true })
  async findAll(@Query() query: EmployeeQueryDto) {
    const employees = await this.employeeService.findAllWithSearch(query);
    return EmployeeResponseDto.fromEntities(employees);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const employee = await this.employeeService.findOne({
      where: { id },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });
    return EmployeeResponseDto.fromEntity(employee);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update employee (Admin only)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: Employee,
  ) {
    const employee = await this.employeeService.updateAdminWithAudit(
      id,
      dto as Partial<Employee>,
      user,
    );
    return EmployeeResponseDto.fromEntity(employee);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee (Admin only)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Employee,
  ) {
    return this.employeeService.deleteWithAudit(id, user);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async getProfile(@CurrentUser() user: Employee) {
    const employee = await this.employeeService.findOne({
      where: { id: user.id },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });
    return EmployeeResponseDto.fromEntity(employee);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async updateProfile(
    @CurrentUser() user: Employee,
    @Body() dto: UpdateProfileDto,
  ) {
    const employee = await this.employeeService.updateProfileWithNotification(
      user.id,
      dto,
      user,
    );
    return EmployeeResponseDto.fromEntity(employee);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 401, description: 'Invalid old password' })
  async changePassword(
    @CurrentUser() user: Employee,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const employee = await this.employeeService.findById(user.id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      employee.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.employeeService.updateWithNotification(
      user.id,
      {
        password: hashedPassword,
      },
      user,
    );
    res.clearCookie('access_token', {
      path: '/',
    });
    return { message: 'Password changed successfully' };
  }

  @Patch('me/profile-picture')
  @ApiOperation({ summary: 'Update current user profile picture' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @CurrentUser() user: Employee,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: 400,
        }),
    )
    file: UploadedImageFile,
  ) {
    const photoUrl = await this.imageKitService.uploadProfileImage(
      file,
      user.id,
    );
    const employee = await this.employeeService.updateWithNotification(
      user.id,
      {
        photo: photoUrl,
      },
      user,
    );
    return EmployeeResponseDto.fromEntity(employee);
  }
}
