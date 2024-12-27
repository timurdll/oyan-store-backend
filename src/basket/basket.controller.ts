import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
  Put,
} from '@nestjs/common';
import { BasketService } from './basket.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('basket')
@UseGuards(AuthGuard) // Защищаем маршруты авторизацией
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  // Добавление продукта в корзину
  @Post('add/:productId')
  async addProduct(
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    return this.basketService.addProductToBasket(
      userId,
      +productId,
      body.quantity,
    );
  }

  // Удаление продукта из корзины
  @Delete('remove/:productId')
  async removeProduct(
    @Param('productId') productId: string,
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    return this.basketService.removeProductFromBasket(userId, +productId);
  }

  // Получение всех продуктов в корзине пользователя
  @Get()
  async getBasketProducts(@Req() req: Request) {
    const userId = req.user['userId'];
    return this.basketService.getBasketProducts(userId);
  }

  // Обновление количества продукта в корзине
  @Put('update/:productId')
  async updateProductQuantity(
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    return this.basketService.updateProductQuantity(
      userId,
      +productId,
      body.quantity,
    );
  }

  @Delete('clear')
  async clearBasket(@Req() req: Request) {
    const userId = req.user['userId'];
    return this.basketService.clearBasket(userId);
  }
}
