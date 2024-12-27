import { Module } from '@nestjs/common';
import { TypesController } from './types.controller';
import { TypesService } from './types.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TypesController],
  providers: [TypesService, PrismaService],
  exports: [TypesService], // Добавьте это
})
export class TypesModule {}
