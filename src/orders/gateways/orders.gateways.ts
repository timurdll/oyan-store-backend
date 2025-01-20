import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [];
const socketPath = process.env.SOCKET_PATH;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/socket.io/',
  transports: ['websocket'],
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected on orders: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected on orders: ${client.id}`);
  }

  sendOrderUpdate(orderId: number, status: string) {
    this.server.emit('orderStatusUpdate', { orderId, status });
  }
}
