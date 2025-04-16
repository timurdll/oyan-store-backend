// sitemap.module.ts
import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [SitemapController],
  // providers: [ProductsService, PrismaService], ❌ УДАЛИ это
})
export class SitemapModule {}
