import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async create(
    email: string,
    password: string,
    role: 'user' | 'admin',
    firstName?: string,
    lastName?: string,
    dateOfBirth?: Date,
    profileImage?: string,
    phoneNumber?: string, // Новый параметр
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        dateOfBirth,
        profileImage,
        phoneNumber, // Добавлено
      },
    });

    await this.prisma.basket.create({
      data: {
        user_id: newUser.id,
      },
    });

    return newUser;
  }

  async updateProfileImage(
    userId: number,
    profileImagePath: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: profileImagePath },
    });
  }

  async updateProfile(
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: Date;
      profileImage?: string;
      phoneNumber: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
      },
    });
  }
  async getUserBonuses(userId: number): Promise<{ bonuses: number; holdingBonuses: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bonuses: true, holdingBonuses: true }, // Укажите оба поля
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    return { bonuses: user.bonuses, holdingBonuses: user.holdingBonuses };
  }
  

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: Number(userId) } });
  }

  async generateJwt(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
