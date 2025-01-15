import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createNotification(
    @Body('message') message: string,
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    return this.notificationsService.createNotification(userId, message);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getUserNotifications(@Req() req: Request) {
    const userId = req.user['userId'];
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch('mark-all-read')
  @UseGuards(AuthGuard)
  async markAllNotificationsAsRead(@Req() req: Request) {
    const userId = req.user['userId'];
    return this.notificationsService.markAllNotificationsAsRead(userId);
  }
}
