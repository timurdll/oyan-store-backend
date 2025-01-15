import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [];

@WebSocketGateway({
  cors: { origin: corsOrigins, credentials: true },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Record<number, string> = {}; // Соответствие userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Удаляем пользователя из списка при отключении
    const userId = Object.keys(this.connectedUsers).find(
      (key) => this.connectedUsers[key] === client.id,
    );
    if (userId) {
      delete this.connectedUsers[+userId];
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: number) {
    this.connectedUsers[userId] = client.id;
  }

  sendNotification(userId: number, message: string) {
    const socketId = this.connectedUsers[userId];
    if (socketId) {
      this.server.to(socketId).emit('notification', message);
    }
  }
}
