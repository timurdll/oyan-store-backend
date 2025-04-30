import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TranslationsService } from './translations.service';
import { Language } from '@prisma/client';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get('languages')
  async getSupportedLanguages() {
    return this.translationsService.getSupportedLanguages();
  }

  // PRODUCT TRANSLATIONS

  @Get('product/:id/:language')
  async getProductTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
  ) {
    return this.translationsService.getProductTranslation(+id, language);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('product/:id/:language')
  async createProductTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.createProductTranslation(
      +id,
      language,
      data,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Put('product/:id/:language')
  async updateProductTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.updateProductTranslation(
      +id,
      language,
      data,
    );
  }

  // PRODUCT INFO TRANSLATIONS

  @Get('product-info/:id/:language')
  async getProductInfoTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
  ) {
    return this.translationsService.getProductInfoTranslation(+id, language);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('product-info/:id/:language')
  async createProductInfoTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { title: string; description: string },
  ) {
    return this.translationsService.createProductInfoTranslation(
      +id,
      language,
      data,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Put('product-info/:id/:language')
  async updateProductInfoTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { title: string; description: string },
  ) {
    return this.translationsService.updateProductInfoTranslation(
      +id,
      language,
      data,
    );
  }

  // TYPE TRANSLATIONS

  @Get('type/:id/:language')
  async getTypeTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
  ) {
    return this.translationsService.getTypeTranslation(+id, language);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('type/:id/:language')
  async createTypeTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.createTypeTranslation(+id, language, data);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Put('type/:id/:language')
  async updateTypeTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.updateTypeTranslation(+id, language, data);
  }

  // CHARACTERISTIC TRANSLATIONS

  @Get('characteristic/:id/:language')
  async getCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
  ) {
    return this.translationsService.getCharacteristicTranslation(+id, language);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('characteristic/:id/:language')
  async createCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.createCharacteristicTranslation(
      +id,
      language,
      data,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Put('characteristic/:id/:language')
  async updateCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { name: string },
  ) {
    return this.translationsService.updateCharacteristicTranslation(
      +id,
      language,
      data,
    );
  }

  // PRODUCT CHARACTERISTIC TRANSLATIONS

  @Get('product-characteristic/:id/:language')
  async getProductCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
  ) {
    return this.translationsService.getProductCharacteristicTranslation(
      +id,
      language,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('product-characteristic/:id/:language')
  async createProductCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { description: string },
  ) {
    return this.translationsService.createProductCharacteristicTranslation(
      +id,
      language,
      data,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Put('product-characteristic/:id/:language')
  async updateProductCharacteristicTranslation(
    @Param('id') id: string,
    @Param('language') language: Language,
    @Body() data: { description: string },
  ) {
    return this.translationsService.updateProductCharacteristicTranslation(
      +id,
      language,
      data,
    );
  }
}
