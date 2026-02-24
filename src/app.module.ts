import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config/config.service';
import {
  Attendance,
  ChangeLog,
  Holiday,
  Department,
  JobPosition,
} from './database/entities';
import { Employee } from './database/entities/employee.entity';
import { EmployeeContact } from './database/entities/employee-contact.entity';
import { SeedService } from './database/seeds/seeds';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { HolidaysModule } from './holidays/holidays.module';
import { DepartmentsModule } from './departments/departments.module';
import { JobPositionsModule } from './job-positions/job-positions.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        entities: [
          Attendance,
          Holiday,
          Department,
          Employee,
          EmployeeContact,
          JobPosition,
        ],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'logDb',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.logDbHost,
        port: configService.logDbPort,
        username: configService.logDbUsername,
        password: configService.logDbPassword,
        database: configService.logDbName,
        entities: [ChangeLog],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Employee,
      EmployeeContact,
      Department,
      JobPosition,
      Holiday,
      Attendance,
    ]),
    RabbitMqModule,
    AuthModule,
    EmployeesModule,
    HolidaysModule,
    DepartmentsModule,
    JobPositionsModule,
    AttendanceModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
