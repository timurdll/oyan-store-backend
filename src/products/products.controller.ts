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
  Request,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProductsService } from './products.service';
import { Language, PreOrder, Product } from '@prisma/client';
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
      stock: number;
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
      // Новые поля для маркетплейс ссылок
      halyqLink?: string;
      kaspiLink?: string;
      satuLink?: string;
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
      stock: parseInt(data.stock as any, 10),
    });
  }

  @Get()
  async findAll(@Query('language') language?: Language): Promise<Product[]> {
    return this.productsService.getAllProducts(language);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('language') language?: Language,
  ): Promise<Product | null> {
    return this.productsService.getProductById(+id, language);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productsService.deleteProduct(+id);
  }

  // In ProductsController
  @Get('pre-orders') // Changed from '/pre-order' to 'pre-orders'
  @UseGuards(AuthGuard)
  async getUserPreOrders(@Request() req): Promise<PreOrder[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.productsService.getUserPreOrders(userId);
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
  async getProductBySlug(
    @Param('slug') slug: string,
    @Query('language') language?: Language,
  ): Promise<Product | null> {
    return this.productsService.getProductBySlug(slug, language);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() data: { stock: number },
  ): Promise<Product> {
    const { stock } = data;
    return this.productsService.updateStock(+id, stock);
  }
  @Post(':id/pre-order')
  @UseGuards(AuthGuard)
  async createPreOrder(
    @Param('id') productId: string,
    @Request() req,
    @Body() body: { phoneNumber: string }, // Change type to an object with phoneNumber
  ): Promise<PreOrder> {
    const userId = req.user['userId'];
    return this.productsService.createPreOrder(
      userId,
      +productId,
      body.phoneNumber,
    ); // Extract phoneNumber from body
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
      stock?: number;
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
    },
  ): Promise<Product> {
    const coverImagePath = files.cover_image
      ? `/uploads/products/${files.cover_image[0].filename}`
      : undefined;

    const imagesPaths = files.images
      ? files.images.map((file) => `/uploads/products/${file.filename}`)
      : undefined;

    return this.productsService.updateProduct(+id, {
      ...data,
      cover_image: coverImagePath,
      images: imagesPaths,
    });
  }
}
