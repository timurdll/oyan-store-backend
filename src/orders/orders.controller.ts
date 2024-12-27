import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @Req() req: Request,
    @Body()
    orderData: {
      product: { productId: number; quantity: number }[];
      userId: number;
      phoneNumber: string;
      address: {
        city: string;
        street: string;
        houseNumber: string;
        entrance: string;
        apartment: string;
      };
      paymentData: { paymentMethod: string[] };
      totalAmount: number;
    },
  ) {
    const userId = req.user['userId'];

    // Validate product array
    if (!orderData.product || !Array.isArray(orderData.product)) {
      console.log('Received order data:', orderData);
      throw new Error('Invalid product data');
    }

    return this.orderService.createOrder(userId, orderData);
  }

  @Get()
  @UseGuards(AuthGuard) // Защищаем маршрут
  async getUserOrders(@Req() req: Request) {
    const userId = req.user['userId']; // Получаем userId из токена
    return this.orderService.getUserOrders(userId);
  }

  @Get('all') // Новый маршрут для админов
  @UseGuards(AuthGuard, RolesGuard) // Защищаем маршрут только для админов
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  async updateOrderStatus(
    @Param('id') orderId: string, // Initially a string
    @Body('status') status: OrderStatus,
  ) {
    return this.orderService.updateOrderStatus(Number(orderId), status); // Convert to number
  }
}
