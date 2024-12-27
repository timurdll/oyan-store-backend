import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('favorites')
@UseGuards(AuthGuard) // Защита маршрутов JWT-аутентификацией
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  // Контроллер
  @Post(':productId')
  async addFavorite(
    @Param('productId') productId: string, // получаем productId как строку
    @Req() req: Request,
  ) {
    const userId = req.user['userId']; // Преобразование ID пользователя в число
    return this.favoritesService.addFavorite(userId, Number(productId)); // преобразование productId в Int
  }

  @Delete(':productId')
  async removeFavorite(
    @Param('productId') productId: string, // получаем productId как строку
    @Req() req: Request,
  ) {
    const userId = req.user['userId']; // Преобразование ID пользователя в число
    return this.favoritesService.removeFavorite(userId, Number(productId)); // Преобразование productId в число
  }

  @Get()
  async getUserFavorites(@Req() req: Request) {
    const userId = req.user['id'];
    return this.favoritesService.getUserFavorites(userId);
  }
}
