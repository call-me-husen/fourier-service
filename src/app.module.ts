import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Attendance } from './shared/entities/attendance.entity';
import { Holiday } from './shared/entities/holiday.entity';
import { Department } from './shared/entities/department.entity';
import { Employee } from './shared/entities/employee.entity';
import { Contact } from './shared/entities/contact.entity';
import { JobPosition } from './shared/entities/job-position.entity';
import { Role } from './shared/entities/role.entity';

import { AuthModule } from './v1/modules/auth/auth.module';
import { EmployeesModule } from './v1/modules/employees/employees.module';
import { HolidaysModule } from './v1/modules/holidays/holidays.module';
import { DepartmentsModule } from './v1/modules/departments/departments.module';
import { JobPositionsModule } from './v1/modules/job-positions/job-positions.module';
import { AttendanceModule } from './v1/modules/attendance/attendance.module';
import { ReportsModule } from './v1/modules/reports/reports.module';
import { NotificationModule } from './common/modules/notification.module';
import { CacheConfigModule } from './common/modules/cache-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'fourier'),
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [
          Attendance,
          Holiday,
          Department,
          Employee,
          Contact,
          JobPosition,
          Role,
        ],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Employee,
      Contact,
      Department,
      JobPosition,
      Holiday,
      Attendance,
      Role,
    ]),
    AuthModule,
    EmployeesModule,
    HolidaysModule,
    DepartmentsModule,
    JobPositionsModule,
    AttendanceModule,
    ReportsModule,
    NotificationModule,
    CacheConfigModule,
  ],
})
export class AppModule {}
