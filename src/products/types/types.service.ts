import { Injectable } from '@nestjs/common';
import { Language, Type } from '@prisma/client'; // Обновленный импорт
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TypesService {
  constructor(private readonly prisma: PrismaService) {}

  // Метод для создания нового типа
  async createType(data: { name: string }): Promise<Type> {
    return this.prisma.type.create({
      data,
    });
  }

  // Метод для получения всех типов
  async getAllTypes(language?: Language): Promise<any[]> {
    const types = await this.prisma.type.findMany({
      include: {
        translations: language
          ? {
              where: { language },
            }
          : true,
        characteristics: {
          include: {
            productCharacteristics: true,
          },
        },
      },
    });

    // Если указан язык, применяем переводы к результатам
    if (language) {
      return types.map((type) => {
        const translation = type.translations.find(
          (t) => t.language === language,
        );
        return {
          ...type,
          name: translation?.name || type.name, // Используем перевод, если он есть
          originalName: type.name, // Сохраняем оригинальное имя
          translation: translation || null,
        };
      });
    }

    return types;
  }

  // Метод для получения типа по ID
  async getTypeById(id: number, language?: Language): Promise<any> {
    const type = await this.prisma.type.findUnique({
      where: { id },
      include: {
        translations: language
          ? {
              where: { language },
            }
          : true,
        characteristics: {
          include: {
            productCharacteristics: true,
          },
        },
      },
    });

    if (!type) return null;

    // Если указан язык, применяем перевод
    if (language) {
      const translation = type.translations.find(
        (t) => t.language === language,
      );
      return {
        ...type,
        name: translation?.name || type.name,
        originalName: type.name,
        translation: translation || null,
      };
    }

    return type;
  }

  // Метод для обновления типа
  async updateType(id: number, data: { name: string }): Promise<Type> {
    return this.prisma.type.update({
      where: { id },
      data,
    });
  }

  // Метод для удаления типа
  async deleteType(id: number): Promise<Type> {
    return this.prisma.type.delete({
      where: { id },
    });
  }

  async getCharacteristicsByType(typeId: number): Promise<string[]> {
    const characteristics = await this.prisma.characteristic.findMany({
      where: { typeId },
      select: { name: true },
    });

    // Возвращаем только массив названий
    return characteristics.map((char) => char.name);
  }
}
