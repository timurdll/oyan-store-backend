import { Injectable } from '@nestjs/common';
import { Type } from '@prisma/client'; // Импортируйте тип Prisma
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
  async getAllTypes(): Promise<Type[]> {
    return this.prisma.type.findMany();
  }

  // Метод для получения типа по ID
  async getTypeById(id: number): Promise<Type | null> {
    return this.prisma.type.findUnique({
      where: { id },
    });
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
