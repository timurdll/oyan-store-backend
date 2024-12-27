// guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Получаем информацию о пользователе

    if (user && user.role === 'admin') {
      return true; // Разрешить доступ, если пользователь админ
    }

    throw new ForbiddenException(
      'Access denied: only admins can perform this action.',
    );
  }
}
