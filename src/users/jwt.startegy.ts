import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client'; // Используем тип User из Prisma

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // Обновляем метод validate, чтобы он использовал Prisma
  async validate(payload: { sub: string }): Promise<User> {
    const user = await this.usersService.findById(payload.sub); // Используем Prisma-метод для поиска пользователя
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // Возвращаем пользователя
  }
}
