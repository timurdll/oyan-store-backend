import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
  Get,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      username: string;
      password: string;
      role: 'user' | 'admin';
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      profileImage?: string;
      phoneNumber?: string; // Новый параметр
    },
  ) {
    const user = await this.usersService.create(
      body.username,
      body.password,
      body.role,
      body.firstName,
      body.lastName,
      body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      body.profileImage,
      body.phoneNumber, // Передаем номер телефона
    );
    return this.usersService.generateJwt(user);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body() body: { email: string }) {
    const user = await this.usersService.findOne(body.email);
    if (!user) {
      return { exists: false }; // Return false if the user does not exist
    }
    return { exists: true };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }) {
    const { username, password } = body;
    const user = await this.usersService.findOne(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      return this.usersService.generateJwt(user);
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @UseGuards(AuthGuard)
  @Post('upload-avatar/:id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const profileImagePath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfileImage(
      Number(userId),
      profileImagePath,
    );
  }

  @UseGuards(AuthGuard)
  @Patch('update-profile/:id')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateProfile(
    @Param('id') userId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string; // ISO формат
      phoneNumber?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const profileImage = file ? `/uploads/avatars/${file.filename}` : undefined;

    const updatedUser = await this.usersService.updateProfile(Number(userId), {
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      profileImage,
    });

    return updatedUser;
  }

  @UseGuards(AuthGuard)
  @Get('bonuses')
  async getUserBonuses(@Request() req: any) {
    const userId = req.user['userId']; // ID пользователя из токена
    return this.usersService.getUserBonuses(userId);
  }

  @Get('find/:id')
  async findUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
