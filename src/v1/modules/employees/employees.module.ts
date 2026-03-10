import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../../../shared/entities/contact.entity';
import { Employee } from '../../../shared/entities/employee.entity';
import { EmployeeService } from './employee.service';
import { EmployeesController } from './employees.controller';
import { AuthModule } from '../auth/auth.module';
import { ImageKitService } from '../../../common/services/imagekit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Contact]),
    forwardRef(() => AuthModule),
  ],
  controllers: [EmployeesController],
  providers: [EmployeeService, ImageKitService],
  exports: [EmployeeService],
})
export class EmployeesModule {}
