import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Type } from '@prisma/client';
import { RolesGuard } from 'src/guards/roles.guard';
import { TypesService } from './types.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @UseGuards(AuthGuard, RolesGuard) // Только администраторы могут создавать типы
  @Post()
  async create(@Body() data: { name: string }): Promise<Type> {
    return this.typesService.createType(data);
  }

  @Get()
  async findAll(): Promise<Type[]> {
    return this.typesService.getAllTypes();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Type | null> {
    return this.typesService.getTypeById(+id);
  }

  @UseGuards(AuthGuard, RolesGuard) // Только администраторы могут обновлять типы
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { name: string },
  ): Promise<Type> {
    return this.typesService.updateType(+id, data);
  }

  @UseGuards(AuthGuard, RolesGuard) // Только администраторы могут удалять типы
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Type> {
    return this.typesService.deleteType(+id);
  }

  @Get(':id/characteristics')
  async getCharacteristicsByType(
    @Param('id') typeId: string,
  ): Promise<string[]> {
    return this.typesService.getCharacteristicsByType(+typeId);
  }
}
