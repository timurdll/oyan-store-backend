import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { extname, join } from 'path';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import configurations from './configurations';
import { PrismaModule } from './prisma/prisma.module';
import { TypesModule } from './products/types/types.module';
import { BasketModule } from './basket/basket.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurations],
    }),
    PrismaModule,
    ProductsModule,
    UsersModule,
    BasketModule,
    TypesModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = file.fieldname === 'avatar' ? 'users' : 'products';
          cb(null, `./uploads/${folder}`);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    FavoritesModule,
    OrdersModule,
  ],
})
export class AppModule {}
