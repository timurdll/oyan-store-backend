import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ProductCharacteristicsService } from './product-characteristics.service';
import { ProductPreOrderService } from './product-pre-order.service';
import { ProductNotificationService } from './product-notification.service';
import { ProductTranslationService } from './product-translation.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    PrismaService,
    ProductCharacteristicsService,
    ProductPreOrderService,
    ProductNotificationService,
    ProductTranslationService,
  ],
  imports: [NotificationsModule],
  exports: [ProductsService],
})
export class ProductsModule {}
