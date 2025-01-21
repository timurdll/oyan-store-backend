import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProductsService } from './products.service';
import { Product } from '@prisma/client';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'cover_image', maxCount: 1 }, { name: 'images' }],
      {
        storage: diskStorage({
          destination: './uploads/products',
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async create(
    @UploadedFiles()
    files: {
      cover_image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Body()
    data: {
      name: string;
      price: number;
      typeId: number;
      stock: number; // Добавлено поле stock
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
    },
  ): Promise<Product> {
    const coverImagePath = files.cover_image
      ? `/uploads/products/${files.cover_image[0].filename}`
      : null;
    const imagesPaths = files.images
      ? files.images.map((file) => `/uploads/products/${file.filename}`)
      : [];

    return this.productsService.createProduct({
      ...data,
      cover_image: coverImagePath,
      images: imagesPaths,
      stock: parseInt(data.stock as any, 10), // Приведение stock к целому числу
    });
  }

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.getProductById(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productsService.deleteProduct(+id);
  }

  // Добавление характеристик к продукту
  @Post(':id/characteristics')
  async addCharacteristics(
    @Param('id') productId: string,
    @Body() characteristics: { name: string; description: string }[],
  ): Promise<void> {
    await this.productsService.addCharacteristics(+productId, characteristics);
  }

  @Get('name/:name') // Новый маршрут
  async getProductByName(@Param('name') name: string): Promise<Product | null> {
    return this.productsService.getProductByName(name);
  }

  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string): Promise<Product | null> {
    return this.productsService.getProductBySlug(slug);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() data: { stock: number },
  ): Promise<Product> {
    const { stock } = data;
    return this.productsService.updateProductStock(+id, stock);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover_image', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],

      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10 MB
        },
        storage: diskStorage({
          destination: './uploads/products',
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      cover_image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Body()
    data: {
      name?: string;
      price?: number;
      typeId?: number;
      stock?: number; // Поле stock для обновления
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
    },
  ): Promise<Product> {
    const coverImagePath = files.cover_image
      ? `/uploads/${files.cover_image[0].filename}`
      : undefined;
    const imagesPaths = files.images
      ? files.images.map((file) => `/uploads/${file.filename}`)
      : undefined;

    return this.productsService.updateProduct(+id, {
      ...data,
      cover_image: coverImagePath,
      images: imagesPaths,
    });
  }
}
