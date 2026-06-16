import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitToUsers(userIds: string[], event: string, data: unknown): void {
    for (const userId of userIds) {
      this.server?.to(`user:${userId}`).emit(event, data);
    }
  }

  emitToAll(event: string, data: unknown): void {
    this.server?.emit(event, data);
  }
}
