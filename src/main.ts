import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureCors } from './cors-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsConfig = {
    origin: configService.get<string>('CORS_ORIGIN'),
    methods: configService.get<string>('CORS_METHODS'),
    credentials: configService.get<boolean>('CORS_CREDENTIALS'),
    allowedHeaders: 'Content-Type,Authorization',
  };
  const port = configService.get('port');
  app.enableCors(corsConfig);
  app.setGlobalPrefix('api');
  await app.listen(port);
  console.log(port);
}
bootstrap();
