import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Language } from '@prisma/client';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Получение списка доступных языков
  async getSupportedLanguages() {
    return Object.values(Language);
  }

  // PRODUCT TRANSLATIONS

  async getProductTranslation(productId: number, language: Language) {
    return this.prisma.productTranslation.findUnique({
      where: {
        productId_language: {
          productId,
          language,
        },
      },
    });
  }

  async createProductTranslation(
    productId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.productTranslation.create({
      data: {
        productId,
        language,
        ...data,
      },
    });
  }

  async updateProductTranslation(
    productId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.productTranslation.upsert({
      where: {
        productId_language: {
          productId,
          language,
        },
      },
      update: data,
      create: {
        productId,
        language,
        ...data,
      },
    });
  }

  // PRODUCT INFO TRANSLATIONS

  async getProductInfoTranslation(productInfoId: number, language: Language) {
    return this.prisma.productInfoTranslation.findUnique({
      where: {
        productInfoId_language: {
          productInfoId,
          language,
        },
      },
    });
  }

  async createProductInfoTranslation(
    productInfoId: number,
    language: Language,
    data: { title: string; description: string },
  ) {
    return this.prisma.productInfoTranslation.create({
      data: {
        productInfoId,
        language,
        ...data,
      },
    });
  }

  async updateProductInfoTranslation(
    productInfoId: number,
    language: Language,
    data: { title: string; description: string },
  ) {
    return this.prisma.productInfoTranslation.upsert({
      where: {
        productInfoId_language: {
          productInfoId,
          language,
        },
      },
      update: data,
      create: {
        productInfoId,
        language,
        ...data,
      },
    });
  }

  // TYPE TRANSLATIONS

  async getTypeTranslation(typeId: number, language: Language) {
    return this.prisma.typeTranslation.findUnique({
      where: {
        typeId_language: {
          typeId,
          language,
        },
      },
    });
  }

  async createTypeTranslation(
    typeId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.typeTranslation.create({
      data: {
        typeId,
        language,
        ...data,
      },
    });
  }

  async updateTypeTranslation(
    typeId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.typeTranslation.upsert({
      where: {
        typeId_language: {
          typeId,
          language,
        },
      },
      update: data,
      create: {
        typeId,
        language,
        ...data,
      },
    });
  }

  // CHARACTERISTIC TRANSLATIONS

  async getCharacteristicTranslation(
    characteristicId: number,
    language: Language,
  ) {
    return this.prisma.characteristicTranslation.findUnique({
      where: {
        characteristicId_language: {
          characteristicId,
          language,
        },
      },
    });
  }

  async createCharacteristicTranslation(
    characteristicId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.characteristicTranslation.create({
      data: {
        characteristicId,
        language,
        ...data,
      },
    });
  }

  async updateCharacteristicTranslation(
    characteristicId: number,
    language: Language,
    data: { name: string },
  ) {
    return this.prisma.characteristicTranslation.upsert({
      where: {
        characteristicId_language: {
          characteristicId,
          language,
        },
      },
      update: data,
      create: {
        characteristicId,
        language,
        ...data,
      },
    });
  }

  // PRODUCT CHARACTERISTIC TRANSLATIONS

  async getProductCharacteristicTranslation(
    productCharacteristicId: number,
    language: Language,
  ) {
    return this.prisma.productCharacteristicTranslation.findUnique({
      where: {
        productCharacteristicId_language: {
          productCharacteristicId,
          language,
        },
      },
    });
  }

  async createProductCharacteristicTranslation(
    productCharacteristicId: number,
    language: Language,
    data: { description: string },
  ) {
    return this.prisma.productCharacteristicTranslation.create({
      data: {
        productCharacteristicId,
        language,
        ...data,
      },
    });
  }

  async updateProductCharacteristicTranslation(
    productCharacteristicId: number,
    language: Language,
    data: { description: string },
  ) {
    return this.prisma.productCharacteristicTranslation.upsert({
      where: {
        productCharacteristicId_language: {
          productCharacteristicId,
          language,
        },
      },
      update: data,
      create: {
        productCharacteristicId,
        language,
        ...data,
      },
    });
  }
}
