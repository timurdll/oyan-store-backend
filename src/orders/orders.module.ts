import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderController } from './orders.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { TelegramBotsModule } from 'src/telegram-bots/telegram-bots.module';
import { OrdersGateway } from './gateways/orders.gateways';

@Module({
  imports: [NotificationsModule, TelegramBotsModule],
  providers: [OrdersService, OrdersGateway],
  controllers: [OrderController],
})
export class OrdersModule {}
