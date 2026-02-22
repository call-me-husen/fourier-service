import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

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

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || '';
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION') || '24h';
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
