import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TelegramBotsService } from './telegram-bots.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('telegram-bots')
@UseGuards(AuthGuard, RolesGuard)
export class TelegramBotsController {
  constructor(private readonly telegramBotsService: TelegramBotsService) {}

  @Post()
  create(
    @Body()
    data: {
      name: string;
      token: string;
      chatId: string;
      isActive?: boolean;
    },
  ) {
    return this.telegramBotsService.create(data);
  }

  @Get()
  findAll() {
    return this.telegramBotsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.telegramBotsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      name?: string;
      token?: string;
      chatId?: string;
      isActive?: boolean;
    },
  ) {
    return this.telegramBotsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.telegramBotsService.remove(id);
  }
}

