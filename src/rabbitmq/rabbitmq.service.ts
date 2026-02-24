import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as amqplib from 'amqplib';
import { ConfigService } from '../config/config.service';

export interface EmployeeChangeEvent {
  eventId: string;
  timestamp: Date;
  actorEmployeeId: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  targetId: string;
  summary: string;
  changes?: Record<string, unknown>;
}

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
  private channel: Awaited<
    ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>
  > | null = null;
  private readonly logger = new Logger(RabbitMqService.name);
  private readonly queueName = 'employee_changes';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.rabbitMqUrl;
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  publishEmployeeChange(event: EmployeeChangeEvent): boolean {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel not available');
      return false;
    }

    try {
      const message = JSON.stringify(event);
      const sent = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(message),
        {
          persistent: true,
        },
      );
      if (sent) {
        this.logger.log(`Published event: ${event.eventId}`);
      }
      return sent;
    } catch (error) {
      this.logger.error('Failed to publish message', error);
      return false;
    }
  }

  async consume(callback: (event: EmployeeChangeEvent) => void): Promise<void> {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel not available');
      return;
    }

    await this.channel.consume(this.queueName, (msg) => {
      if (msg) {
        try {
          const parsed = JSON.parse(
            msg.content.toString(),
          ) as EmployeeChangeEvent;
          const event: EmployeeChangeEvent = parsed;
          callback(event);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('Failed to process message', error);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
