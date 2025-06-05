import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Language, PreOrder, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { ProductCharacteristicsService } from './product-characteristics.service';
import { ProductPreOrderService } from './product-pre-order.service';
import { ProductTranslationService } from './product-translation.service';

export type ProductSortField = 'price' | 'name' | 'createdAt' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilterOptions {
  typeId?: number;
  limit?: number;
  offset?: number;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
  language?: Language;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly characteristicsService: ProductCharacteristicsService,
    private readonly preOrderService: ProductPreOrderService,
    private readonly translationService: ProductTranslationService,
  ) {}

  async createProduct(data: {
    name: string;
    price: number | string;
    cover_image: string;
    images: string[];
    typeId: number | string;
    productInfo?: {
      title: string;
      description: string;
    };
    stock: number;
    characteristics?: { name: string; description: string }[];
    halyqLink?: string;
    kaspiLink?: string;
    satuLink?: string;
  }): Promise<Product> {
    const {
      productInfo,
      characteristics,
      halyqLink,
      kaspiLink,
      satuLink,
      ...productData
    } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Create product with marketplace links
      const product = await prisma.product.create({
        data: {
          ...productData,
          price: parseFloat(data.price as string),
          typeId: parseInt(data.typeId as string, 10),
          stock: data.stock,
          halyqLink,
          kaspiLink,
          satuLink,
          productInfo: productInfo ? { create: productInfo } : undefined,
        },
      });

      // Step 2: Process characteristics
      if (characteristics && characteristics.length > 0) {
        await this.characteristicsService.updateProductCharacteristics(
          product.id,
          characteristics,
          parseInt(data.typeId as string, 10),
        );
      }

      return product;
    });
  }

  async getAllProducts(language?: Language): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      include: {
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
        translations: language
          ? {
              where: { language },
            }
          : true,
        productInfo: {
          include: {
            translations: language
              ? {
                  where: { language },
                }
              : true,
          },
        },
      },
    });

    // Apply translations if language is specified
    return language
      ? this.translationService.applyTranslationsToMany(products, language)
      : products;
  }

  async getProductById(id: number, language?: Language): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
        translations: language
          ? {
              where: { language },
            }
          : true,
        productInfo: {
          include: {
            translations: language
              ? {
                  where: { language },
                }
              : true,
          },
        },
      },
    });

    if (!product) return null;

    // Apply translations if language is specified
    return language
      ? this.translationService.applyTranslations(product, language)
      : product;
  }

  async updateProduct(
    id: number,
    data: {
      name?: string;
      price?: number;
      cover_image?: string;
      images?: string[];
      typeId?: number;
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
      halyqLink?: string;
      kaspiLink?: string;
      satuLink?: string;
    },
  ): Promise<Product> {
    const {
      productInfo,
      characteristics,
      cover_image,
      images,
      halyqLink,
      kaspiLink,
      satuLink,
      ...productData
    } = data;

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    // Check name uniqueness if changed
    if (data.name && data.name !== existingProduct.name) {
      const productWithSameName = await this.prisma.product.findUnique({
        where: { name: data.name },
      });

      if (productWithSameName) {
        throw new Error(`Product with name "${data.name}" already exists`);
      }
    }

    // Check product type if specified
    if (data.typeId) {
      const typeId = parseInt(data.typeId.toString(), 10);
      if (isNaN(typeId)) {
        throw new Error('Invalid product type ID');
      }

      const typeExists = await this.prisma.type.findUnique({
        where: { id: typeId },
      });

      if (!typeExists) {
        throw new Error(`Product type with ID ${typeId} not found`);
      }
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Step 1: Update product with new fields
        const product = await prisma.product.update({
          where: { id },
          data: {
            ...productData,
            cover_image: cover_image || undefined,
            images: images && images.length > 0 ? images : undefined,
            price: data.price ? parseFloat(data.price.toString()) : undefined,
            typeId: data.typeId
              ? parseInt(data.typeId.toString(), 10)
              : undefined,
            halyqLink,
            kaspiLink,
            satuLink,
          },
        });

        // Step 2: Update or create productInfo
        if (productInfo) {
          await prisma.productInfo.upsert({
            where: { product_id: id },
            update: productInfo,
            create: {
              ...productInfo,
              product_id: id,
            },
          });
        }

        // Step 3: Process characteristics
        if (characteristics && characteristics.length > 0) {
          await this.characteristicsService.updateProductCharacteristics(
            id,
            characteristics,
            data.typeId ? parseInt(data.typeId.toString(), 10) : undefined,
          );
        }

        return product;
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An error occurred while updating the product',
      );
    }
  }

  async getProductByName(name: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { name },
      include: {
        productInfo: true,
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
      },
    });
  }

  async deleteProduct(id: number): Promise<Product> {
    return this.prisma.$transaction(async (prisma) => {
      // Delete related entities
      await prisma.productInfo.deleteMany({
        where: { product_id: id },
      });

      await prisma.basketProduct.deleteMany({
        where: { product_id: id },
      });

      await prisma.productCharacteristic.deleteMany({
        where: { productId: id },
      });

      await prisma.rating.deleteMany({
        where: { product_id: id },
      });

      await prisma.favorite.deleteMany({
        where: { product_id: id },
      });

      // Delete the Product itself
      return prisma.product.delete({
        where: { id },
      });
    });
  }

  async updateStock(productId: number, newStock: number): Promise<Product> {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Notify pre-order users if stock increased
    if (newStock > 0) {
      await this.preOrderService.notifyPreOrderUsers(productId);
    }

    return product;
  }

  async getProductBySlug(slug: string, language?: Language): Promise<any> {
    // Get all products with their information and translations
    const allProducts = await this.prisma.product.findMany({
      include: {
        productInfo: {
          include: {
            translations: language
              ? {
                  where: { language },
                }
              : true,
          },
        },
        ratings: true,
        productCharacteristics: {
          include: {
            characteristic: {
              include: {
                translations: language
                  ? {
                      where: { language },
                    }
                  : true,
              },
            },
            translations: language
              ? {
                  where: { language },
                }
              : true,
          },
        },
        translations: language
          ? {
              where: { language },
            }
          : true,
      },
    });

    // Find product where slugify(product.name) matches slug
    const product = allProducts.find(
      (product) => slugify(product.name, { lower: true }) === slug,
    );

    if (!product) return null;

    // Apply translations if language is specified
    return language
      ? this.translationService.applyTranslations(product, language)
      : product;
  }

  // Delegate to PreOrderService
  async createPreOrder(
    userId: number,
    productId: number,
    phoneNumber: string,
  ): Promise<PreOrder> {
    return this.preOrderService.createPreOrder(userId, productId, phoneNumber);
  }

  // Delegate to PreOrderService
  async getUserPreOrders(userId: number) {
    return this.preOrderService.getUserPreOrders(userId);
  }

  // Delegate to CharacteristicsService
  async addCharacteristics(
    productId: number,
    characteristics: { name: string; description: string; typeId?: number }[],
  ): Promise<void> {
    return this.characteristicsService.addCharacteristics(
      productId,
      characteristics,
    );
  }

  // Enhanced filtered products method with sorting and pagination
  async getFilteredProducts(options: ProductFilterOptions = {}) {
    const {
      typeId,
      limit = 10,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc',
      language,
      minPrice,
      maxPrice,
    } = options;

    // Validate sort field
    const validSortFields: ProductSortField[] = [
      'price',
      'name',
      'rating',
      'createdAt',
    ];
    if (sortBy && !validSortFields.includes(sortBy as ProductSortField)) {
      throw new BadRequestException(
        `Invalid sort field. Valid options are: ${validSortFields.join(', ')}`,
      );
    }

    // Validate sort order
    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    if (sortOrder && !validSortOrders.includes(sortOrder as SortOrder)) {
      throw new BadRequestException(
        `Invalid sort order. Valid options are: ${validSortOrders.join(', ')}`,
      );
    }

    // Build the order by condition
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Build the where condition for products (с учётом цены)
    const where: Prisma.ProductWhereInput = {};
    if (typeId) {
      where.typeId = typeId;
    }
    // Формируем price-условие отдельно
    const price: any = {};
    if (minPrice !== undefined) {
      price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      price.lte = maxPrice;
    }
    if (Object.keys(price).length > 0) {
      where.price = price;
    }

    // Build the where condition for min/max (БЕЗ учёта цены)
    const whereForMinMax: Prisma.ProductWhereInput = {};
    if (typeId) {
      whereForMinMax.typeId = typeId;
    }

    // Execute the query with pagination
    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
      include: {
        translations: language ? { where: { language } } : true,
        type: {
          include: { translations: language ? { where: { language } } : true },
        },
        productInfo: {
          include: {
            translations: language ? { where: { language } } : true,
          },
        },
      },
    });

    // Get total count for pagination metadata
    const totalCount = await this.prisma.product.count({ where });

    // Получаем min и max цену по всем товарам, подходящим под фильтр (без учёта цены)
    const minMax = await this.prisma.product.aggregate({
      where: whereForMinMax,
      _min: { price: true },
      _max: { price: true },
    });

    // Apply translations if language is specified
    const translatedProducts = language
      ? this.translationService.applyTranslationsToMany(products, language)
      : products;

    return {
      products: translatedProducts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      minPrice: minMax._min.price ?? 0,
      maxPrice: minMax._max.price ?? 0,
    };
  }
}
