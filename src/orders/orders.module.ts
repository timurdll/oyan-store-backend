import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderController } from './orders.controller';

@Module({
  providers: [OrdersService],
  controllers: [OrderController],
})
export class OrdersModule {}
