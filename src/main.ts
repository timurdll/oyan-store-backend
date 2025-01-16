import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureCors } from './cors-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  app.enableCors(configureCors(configService));
  app.setGlobalPrefix('api');

  console.log('Server configuration:', {
    port,
    corsOrigins: process.env.CORS_ORIGIN,
    socketPath: process.env.SOCKET_PATH,
  });

  await app.listen(port);
}
bootstrap();
