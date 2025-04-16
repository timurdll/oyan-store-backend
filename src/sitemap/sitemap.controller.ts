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

    const staticPages = [
      'https://oyan-store.kz/',
      'https://oyan-store.kz/about-us',
    ];

    const urls = [
      ...staticPages.map((url) => `<url><loc>${url}</loc></url>`),
      ...products.map((product) => {
        const slug = slugify(product.name, { lower: true });
        return `<url>
        <loc>https://oyan-store.kz/products/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
      }),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  }
}
