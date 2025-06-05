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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ProductsService,
  ProductFilterOptions,
  ProductSortField,
  SortOrder,
} from './products.service';
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

  @Get('filter')
  async getFilteredProducts(
    @Query('typeId') typeId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('sortBy', new DefaultValuePipe('name')) sortBy?: ProductSortField,
    @Query('sortOrder', new DefaultValuePipe('asc')) sortOrder?: SortOrder,
    @Query('language') language?: Language,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    // only parse if the client actually passed it
    const parsedTypeId =
      typeId !== undefined ? parseInt(typeId, 10) : undefined;
    const parsedMinPrice =
      minPrice !== undefined ? parseFloat(minPrice) : undefined;
    const parsedMaxPrice =
      maxPrice !== undefined ? parseFloat(maxPrice) : undefined;

    const options: ProductFilterOptions = {
      typeId: parsedTypeId,
      limit,
      offset,
      sortBy,
      sortOrder,
      language,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
    };

    return this.productsService.getFilteredProducts(options);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language?: Language,
  ): Promise<Product | null> {
    return this.productsService.getProductById(+id, language);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productsService.deleteProduct(+id);
  }

  @Get('pre-orders')
  @UseGuards(AuthGuard)
  async getUserPreOrders(@Request() req): Promise<PreOrder[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.productsService.getUserPreOrders(userId);
  }

  @Post(':id/characteristics')
  async addCharacteristics(
    @Param('id') productId: string,
    @Body() characteristics: { name: string; description: string }[],
  ): Promise<void> {
    await this.productsService.addCharacteristics(+productId, characteristics);
  }

  @Get('name/:name')
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
    @Body() body: { phoneNumber: string },
  ): Promise<PreOrder> {
    const userId = req.user['userId'];
    return this.productsService.createPreOrder(
      userId,
      +productId,
      body.phoneNumber,
    );
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
      halyqLink?: string;
      kaspiLink?: string;
      satuLink?: string;
    },
  ): Promise<Product> {
    try {
      // Валидация ID
      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        throw new Error('Некорректный ID продукта');
      }

      // Валидация цены
      if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
        throw new Error('Некорректная цена продукта');
      }

      // Валидация типа продукта
      if (data.typeId !== undefined && isNaN(data.typeId)) {
        throw new Error('Некорректный ID типа продукта');
      }

      // Валидация количества
      if (data.stock !== undefined && (isNaN(data.stock) || data.stock < 0)) {
        throw new Error('Некорректное количество товара');
      }

      // Валидация информации о продукте
      if (data.productInfo) {
        if (!data.productInfo.title?.trim()) {
          throw new Error('Заголовок продукта не может быть пустым');
        }
        if (!data.productInfo.description?.trim()) {
          throw new Error('Описание продукта не может быть пустым');
        }
      }

      // Валидация характеристик
      if (data.characteristics) {
        for (const char of data.characteristics) {
          if (!char.name?.trim()) {
            throw new Error('Название характеристики не может быть пустым');
          }
          if (!char.description?.trim()) {
            throw new Error('Описание характеристики не может быть пустым');
          }
        }
      }

      // Валидация URL маркетплейсов
      const urlRegex =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (data.halyqLink && !urlRegex.test(data.halyqLink)) {
        throw new Error('Некорректный URL для Халык');
      }
      if (data.kaspiLink && !urlRegex.test(data.kaspiLink)) {
        throw new Error('Некорректный URL для Каспи');
      }
      if (data.satuLink && !urlRegex.test(data.satuLink)) {
        throw new Error('Некорректный URL для Сату');
      }

      const coverImagePath = files.cover_image
        ? `/uploads/products/${files.cover_image[0].filename}`
        : undefined;

      const imagesPaths = files.images
        ? files.images.map((file) => `/uploads/products/${file.filename}`)
        : undefined;

      return this.productsService.updateProduct(productId, {
        ...data,
        cover_image: coverImagePath,
        images: imagesPaths,
      });
    } catch (error) {
      console.error('Ошибка при обновлении продукта:', error);
      throw error;
    }
  }
}
