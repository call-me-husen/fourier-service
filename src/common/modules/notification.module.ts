import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from '../../common/gateways/notification.gateway';
import { Role } from '../../shared/entities/role.entity';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d'),
        } as object,
      }),
    }),
    TypeOrmModule.forFeature([Role]),
  ],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
