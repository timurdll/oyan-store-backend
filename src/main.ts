import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get('port');

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  app.use(bodyParser.json({ limit: '10mb' })); // Adjust as needed
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  await app.listen(port);
  console.log(port);
}
bootstrap();
