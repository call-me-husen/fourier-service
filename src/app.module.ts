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
import { EmployeeContactsService } from './employee-contacts/employee-contacts.service';

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
          ChangeLog,
          Holiday,
          Department,
          Employee,
          EmployeeContact,
          JobPosition,
        ],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Employee,
      EmployeeContact,
      Department,
      JobPosition,
      Holiday,
    ]),
    AuthModule,
    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService, EmployeeContactsService],
})
export class AppModule {}
