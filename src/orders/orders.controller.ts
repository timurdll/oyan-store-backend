import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { Language, OrderStatus } from '@prisma/client';
import {
  CreateOrderDto,
  QuickPurchaseDto,
  OrderWithTranslations,
} from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Req() req: Request, @Body() orderData: CreateOrderDto) {
    const userId = req.user['userId'];

    if (!orderData.product || !Array.isArray(orderData.product)) {
      console.log('Received order data:', orderData);
      throw new Error('Invalid product data');
    }

    return this.orderService.createOrder(userId, orderData);
  }

  @Post('quick-purchase')
  async quickPurchase(@Body() quickPurchaseData: QuickPurchaseDto) {
    const { fullName, phoneNumber, productId } = quickPurchaseData;
    return this.orderService.quickPurchase(fullName, phoneNumber, productId);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getUserOrders(
    @Req() req: Request,
    @Query('language') language?: Language,
  ): Promise<OrderWithTranslations[]> {
    const userId = req.user['userId'];
    return this.orderService.getUserOrders(userId, language);
  }

  @Get('all')
  @UseGuards(AuthGuard, RolesGuard)
  async getAllOrders(
    @Query('language') language?: Language,
  ): Promise<OrderWithTranslations[]> {
    return this.orderService.getAllOrders(language);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.orderService.updateOrderStatus(Number(orderId), status);
  }
}
