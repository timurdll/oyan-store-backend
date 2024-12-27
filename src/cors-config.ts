import { ConfigService } from '@nestjs/config';

export function configureCors(configService: ConfigService) {
  const origins = configService.get<string>('CORS_ORIGIN')?.split(',');
  const methods = configService.get<string>('CORS_METHODS');
  const credentials = configService.get<string>('CORS_CREDENTIALS') === 'true';

  return {
    origin: origins, // массив доменов
    methods: methods, // строка методов
    credentials: credentials, // логическое значение
  };
}
