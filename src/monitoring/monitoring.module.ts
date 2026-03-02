import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { EventEmitterService } from './event-emitter.service';
import { ChangeLog } from '../database/entities/change-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeLog], 'logDb')],
  controllers: [MonitoringController],
  providers: [MonitoringService, EventEmitterService],
  exports: [EventEmitterService],
})
export class MonitoringModule {}
