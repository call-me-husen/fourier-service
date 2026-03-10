import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

type SocketUser = {
  role?: string;
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
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedAdmins: Map<string, Socket> = new Map();

  private getSocketUser(client: Socket): SocketUser | undefined {
    const data = client.data as { user?: SocketUser };
    return data.user;
  }

  handleConnection(client: Socket) {
    const user = this.getSocketUser(client);
    this.logger.log(
      `Client connected: ${client.id}, user: ${user?.role || 'unknown'}`,
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

  @SubscribeMessage('join_admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    const user = this.getSocketUser(client);
    if (user?.role === 'ADMIN') {
      void client.join('admins');
      this.logger.log(`Admin ${client.id} joined admins room`);
      return { event: 'joined', room: 'admins' };
    }
    return { event: 'error', message: 'Unauthorized' };
  }

  notifyAdmins(payload: NotificationPayload) {
    const notification = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.server.to('admins').emit('notification', notification);
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
