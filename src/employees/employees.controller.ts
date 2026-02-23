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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Employee } from '../database/entities/employee.entity';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ImageUploadPipe } from '../image-upload/image-upload.pipe';

@Controller('api/employees')
@UseGuards(JwtGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: Employee) {
    return this.employeesService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: Employee,
    @Body() updateData: { phone?: string; password?: string },
  ) {
    const employee = await this.employeesService.updateProfile(
      user.id,
      updateData,
    );

    return employee;
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
}
