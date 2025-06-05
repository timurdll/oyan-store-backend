// products/product-translation.service.ts
import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';

@Injectable()
export class ProductTranslationService {
  applyTranslations(product: any, language?: Language): any {
    if (!language || !product) return product;

    const productTranslation = product.translations?.find(
      (t) => t.language === language,
    );

    const productInfoTranslation = product.productInfo?.translations?.find(
      (t) => t.language === language,
    );

    return {
      ...product,
      name: productTranslation?.name || product.name,
      originalName: product.name,
      productInfo: product.productInfo
        ? {
            ...product.productInfo,
            title: productInfoTranslation?.title || product.productInfo.title,
            description:
              productInfoTranslation?.description ||
              product.productInfo.description,
            originalTitle: product.productInfo.title,
            originalDescription: product.productInfo.description,
          }
        : null,
      productCharacteristics: product.productCharacteristics?.map((char) => ({
        ...char,
        characteristic: {
          ...char.characteristic,
          name:
            char.characteristic.translations?.[0]?.name ||
            char.characteristic.name,
        },
        description: char.translations?.[0]?.description || char.description,
      })),
      translation: productTranslation || null,
      productInfoTranslation: productInfoTranslation || null,
    };
  }

  applyTranslationsToMany(products: any[], language?: Language): any[] {
    if (!language || !products?.length) return products;

    return products.map((product) => this.applyTranslations(product, language));
  }
}
