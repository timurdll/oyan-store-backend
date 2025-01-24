import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma/prisma.service'; // Импортируйте PrismaService
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
  imports: [NotificationsModule],
})
export class ProductsModule {}
