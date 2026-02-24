import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { EventEmitterService } from './event-emitter.service';
import {
  RabbitMqService,
  EmployeeChangeEvent,
} from '../rabbitmq/rabbitmq.service';
import { ChangeLog } from '../database/entities/change-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);
  private clients: Map<string, Response> = new Map();

  constructor(
    private eventEmitter: EventEmitterService,
    private rabbitMqService: RabbitMqService,
    @InjectRepository(ChangeLog, 'logDb')
    private changeLogRepository: Repository<ChangeLog>,
  ) {}

  async onModuleInit() {
    await this.rabbitMqService.consume((event: EmployeeChangeEvent) => {
      void this.persistToLogDb(event).then(() => {
        this.eventEmitter.emit(event);
      });
    });

    this.eventEmitter.getObservable().subscribe((event) => {
      this.broadcastToClients(event);
    });
  }

  addClient(clientId: string, res: Response) {
    this.clients.set(clientId, res);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
  }

  private broadcastToClients(event: EmployeeChangeEvent) {
    const data = `event: employee-change\ndata: ${JSON.stringify(event)}\n\n`;
    this.clients.forEach((res) => {
      res.write(data);
    });
  }

  private async persistToLogDb(event: EmployeeChangeEvent) {
    try {
      const changeLog = this.changeLogRepository.create({
        employeeId: event.actorEmployeeId,
        entity: event.entity,
        action: event.action,
        changes: event.changes || {},
        timestamp: event.timestamp,
      });
      await this.changeLogRepository.save(changeLog);
    } catch (error) {
      this.logger.error('Failed to persist change log:', error);
    }
  }
}
