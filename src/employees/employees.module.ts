import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from '../database/entities/employee.entity';
import { ImageKitService } from '../image-kit/image-kit.service';
import { EmployeeContact } from '../database/entities/employee-contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, EmployeeContact])],
  controllers: [EmployeesController],
  providers: [EmployeesService, ImageKitService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
