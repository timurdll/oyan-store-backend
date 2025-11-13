import { Module } from '@nestjs/common';
import { TelegramBotsService } from './telegram-bots.service';
import { TelegramBotsController } from './telegram-bots.controller';

@Module({
  controllers: [TelegramBotsController],
  providers: [TelegramBotsService],
  exports: [TelegramBotsService],
})
export class TelegramBotsModule {}

