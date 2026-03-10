import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

export type AuditAction = 'created' | 'updated' | 'deleted';

export type AuditActor = {
  id: string;
  email: string;
  role?: string | null;
};

type AuditEventPayload = {
  entity: 'employee' | 'department' | 'job-position' | 'holiday';
  action: AuditAction;
  entityId?: string;
  actor?: AuditActor;
  data: unknown;
  occurredAt: string;
};

@Injectable()
export class AuditPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditPublisherService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connectingPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get queueName() {
    return this.configService.get<string>('RABBITMQ_AUDIT_QUEUE', 'audit.logs');
  }

  private get rabbitmqUrl() {
    return this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
  }

  private async ensureChannel() {
    if (this.channel) {
      return;
    }

    if (!this.connectingPromise) {
      this.connectingPromise = (async () => {
        const connection = await connect(this.rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue(this.queueName, { durable: true });

        this.connection = connection;
        this.channel = channel;

        connection.on('close', () => {
          this.channel = null;
          this.connection = null;
          this.connectingPromise = null;
        });
      })();
    }

    await this.connectingPromise;
  }

  async publish(event: AuditEventPayload) {
    await this.ensureChannel();

    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    const published = this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );

    if (!published) {
      this.logger.warn(`RabbitMQ queue backpressure for ${event.entity}`);
    }
  }

  async publishEntityChange(
    entity: AuditEventPayload['entity'],
    action: AuditAction,
    data: unknown,
    entityId?: string,
    actor?: AuditActor,
  ) {
    await this.publish({
      entity,
      action,
      entityId,
      actor,
      data,
      occurredAt: new Date().toISOString(),
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
