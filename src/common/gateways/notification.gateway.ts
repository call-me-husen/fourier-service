import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Role } from '../../shared/entities/role.entity';

type SocketUser = {
  role?: string;
  userId?: string;
  email?: string;
};

export interface NotificationPayload {
  type: 'profile_update' | 'attendance' | 'general';
  title: string;
  message: string;
  employeeId?: string;
  employeeName?: string;
  timestamp?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedAdmins: Map<string, Socket> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const token = this.extractTokenFromAuth(socket.handshake.auth?.token);

      if (!token) {
        this.logger.warn(`No token provided for socket ${socket.id}`);
        return next(new Error('Authentication required'));
      }

      try {
        const payload = this.jwtService.verify<{
          sub: string;
          email: string;
          role: string;
        }>(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        const role = await this.roleRepository.findOne({
          where: { id: payload.role },
        });

        (socket.data as { user?: SocketUser }).user = {
          userId: payload.sub,
          email: payload.email,
          role: role?.name || 'EMPLOYEE',
        };

        this.logger.log(`Socket ${socket.id} authenticated as ${role?.name}`);
        next();
      } catch (error) {
        this.logger.warn(
          `Authentication failed for socket ${socket.id}: ${error}`,
        );
        next(new Error('Invalid token'));
      }
    });
  }

  private getSocketUser(client: Socket): SocketUser | undefined {
    const data = client.data as { user?: SocketUser };
    return data.user;
  }

  private extractTokenFromAuth(auth: unknown): string | null {
    if (!auth) return null;
    if (typeof auth === 'string') {
      if (auth.startsWith('Bearer ')) {
        return auth.substring(7);
      }
      return auth;
    }
    if (typeof auth === 'object' && 'token' in auth) {
      const token = (auth as { token: unknown }).token;
      if (typeof token === 'string') {
        if (token.startsWith('Bearer ')) {
          return token.substring(7);
        }
        return token;
      }
    }
    return null;
  }

  private async validateToken(token: string): Promise<SocketUser | undefined> {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const role = await this.roleRepository.findOne({
        where: { id: payload.role },
      });

      return {
        userId: payload.sub,
        email: payload.email,
        role: role?.name || 'EMPLOYEE',
      };
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error}`);
      return undefined;
    }
  }

  async handleConnection(client: Socket) {
    const user = this.getSocketUser(client);
    this.logger.log(
      `Client connected: ${client.id}, user: ${JSON.stringify(user)}`,
    );

    if (user?.role === 'ADMIN') {
      this.connectedAdmins.set(client.id, client);
      this.logger.log(`Admin connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedAdmins.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  getConnectedClients() {
    if (!this.server?.sockets?.adapter) {
      return {
        totalConnected: 0,
        connectedAdmins: [],
        adminsRoomSize: 0,
      };
    }

    const rooms = this.server.sockets.adapter.rooms;
    const adminsRoom = rooms.get('admins');

    return {
      totalConnected: this.server.sockets.adapter.sids.size,
      connectedAdmins: Array.from(this.connectedAdmins.values()).map((s) => ({
        id: s.id,
        user: s.data.user,
      })),
      adminsRoomSize: adminsRoom?.size || 0,
    };
  }

  @SubscribeMessage('join_admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    this.logger.log(
      `Client ${client.id} requested to join admins room, current user: ${JSON.stringify(client.data.user)}`,
    );
    const user = this.getSocketUser(client);
    if (user?.role === 'ADMIN') {
      void client.join('admins');
      this.logger.log(`Admin ${client.id} joined admins room`);
      return { event: 'joined', room: 'admins' };
    }
    return { event: 'error', message: 'Unauthorized - role: ' + user?.role };
  }

  notifyAdmins(payload: NotificationPayload) {
    const server = this.server;
    if (!server || !server.sockets) {
      this.logger.warn('Server not initialized, skipping notification');
      return;
    }

    const notification = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('notification', notification);
    this.logger.log(`Notification sent to admins: ${payload.title}`);
  }

  notifyProfileUpdate(
    employeeId: string,
    employeeName: string,
    changes: string[],
  ) {
    this.notifyAdmins({
      type: 'profile_update',
      title: 'Profile Update Request',
      message: `${employeeName} has updated their profile. Changed fields: ${changes.join(', ')}`,
      employeeId,
      employeeName,
    });
  }
}
