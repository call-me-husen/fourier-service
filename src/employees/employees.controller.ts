import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Query,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountRole, Employee } from '../database/entities/employee.entity';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ImageUploadPipe } from '../image-upload/image-upload.pipe';
import { EmployeeContactDto } from './dto/employee-contact.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateEmployeeDto } from './dto/create.dto';
import { UpdateEmployeeDto } from './dto/update.dto';
import type { Response } from 'express';

@Controller('api/employees')
@UseGuards(JwtGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('department') departmentId?: string,
    @Query('position') positionId?: string,
  ) {
    return this.employeesService.findAll({
      page,
      limit,
      search,
      departmentId,
      positionId,
    });
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: Employee) {
    return this.employeesService.getProfile(user.id);
  }

  @Patch('contact')
  async updateProfile(
    @CurrentUser() user: Employee,
    @Body() updateData: EmployeeContactDto,
  ) {
    await this.employeesService.updateContact(user.id, updateData);

    return;
  }

  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: Employee,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.employeesService.changePassword(
      user.id,
      changePasswordDto,
    );

    res.clearCookie('access_token', { path: '/' });

    return result;
  }

  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: Employee,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
      ImageUploadPipe,
    )
    file: Express.Multer.File,
  ) {
    return this.employeesService.updatePhoto(user.id, file);
  }

  @Get(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async getEmployee(@Param('id') id: string) {
    return this.employeesService.getProfile(id);
  }

  @Post()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: Partial<UpdateEmployeeDto>,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(AccountRole.ADMIN)
  async deleteEmployee(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }
}
