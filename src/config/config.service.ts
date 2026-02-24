import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get dbHost(): string {
    return this.configService.get<string>('DB_HOST') || 'localhost';
  }

  get dbPort(): number {
    return Number(this.configService.get<number>('DB_PORT')) || 5432;
  }

  get dbUsername(): string {
    return this.configService.get<string>('DB_USERNAME') || '';
  }

  get dbPassword(): string {
    return this.configService.get<string>('DB_PASSWORD') || '';
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME') || '';
  }

  get logDbName(): string {
    return this.configService.get<string>('LOG_DB_NAME') || '';
  }

  get logDbHost(): string {
    return this.configService.get<string>('LOG_DB_HOST') || 'localhost';
  }

  get logDbPort(): number {
    return Number(this.configService.get<number>('LOG_DB_PORT')) || 5433;
  }

  get logDbUsername(): string {
    return this.configService.get<string>('LOG_DB_USERNAME') || '';
  }

  get logDbPassword(): string {
    return this.configService.get<string>('LOG_DB_PASSWORD') || '';
  }

  get rabbitMqUser(): string {
    return this.configService.get<string>('RABBITMQ_USER') || 'guest';
  }

  get rabbitMqPassword(): string {
    return this.configService.get<string>('RABBITMQ_PASSWORD') || 'guest';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || '';
  }

  get jwtExpiration(): StringValue {
    return this.configService.get<StringValue>('JWT_EXPIRATION') || '24h';
  }

  get rabbitMqUrl(): string {
    return this.configService.get<string>('RABBITMQ_URL') || '';
  }

  get imageKitPublicKey(): string {
    return this.configService.get<string>('IMAGEKIT_PUBLIC_KEY') || '';
  }

  get imageKitPrivateKey(): string {
    return this.configService.get<string>('IMAGEKIT_PRIVATE_KEY') || '';
  }

  get imageKitUrlEndpoint(): string {
    return this.configService.get<string>('IMAGEKIT_URL_ENDPOINT') || '';
  }
}
