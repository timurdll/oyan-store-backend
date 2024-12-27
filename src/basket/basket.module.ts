import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BasketController } from './basket.controller';
import { BasketService } from './basket.service';

@Module({
  controllers: [BasketController],
  providers: [BasketService, PrismaService],
})
export class BasketModule {}
