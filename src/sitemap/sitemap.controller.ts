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
      { path: '/', priority: '1.0' },
      { path: '/about-us', priority: '0.8' },
    ];

    const languages = ['', '/ru', '/kk'];

    const urls = [
      ...staticPages.flatMap((page) =>
        languages.map(
          (lang) => `<url>
        <loc>https://oyan-store.kz${lang}${page.path}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page.priority}</priority>
      </url>`,
        ),
      ),
      ...products.flatMap((product) => {
        const slug = slugify(product.name, { lower: true });
        return languages.map(
          (lang) => `<url>
        <loc>https://oyan-store.kz${lang}/products/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`,
        );
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
