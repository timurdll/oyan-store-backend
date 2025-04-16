// sitemap.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from 'src/products/products.service';
import slugify from 'slugify';

@Controller('sitemap.xml')
export class SitemapController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async generateSitemap(@Res() res: Response) {
    const products = await this.productsService.getAllProducts();

    const urls = products.map((product) => {
      const slug = slugify(product.name, { lower: true });
      return `<url><loc>https://yourdomain.kz/products/${slug}</loc></url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  }
}
