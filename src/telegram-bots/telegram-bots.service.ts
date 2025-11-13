import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios, { isAxiosError } from 'axios';

interface CreateTelegramBotDto {
  name: string;
  token: string;
  chatId: string;
  isActive?: boolean;
}

interface UpdateTelegramBotDto {
  name?: string;
  token?: string;
  chatId?: string;
  isActive?: boolean;
}

@Injectable()
export class TelegramBotsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTelegramBotDto) {
    return this.prisma.telegramBot.create({
      data: {
        name: data.name,
        token: data.token,
        chatId: data.chatId,
        isActive: data.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.telegramBot.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.telegramBot.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateTelegramBotDto) {
    return this.prisma.telegramBot.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.telegramBot.delete({ where: { id } });
  }

  async sendMessageToActiveBots(message: string) {
    const bots = await this.prisma.telegramBot.findMany({
      where: { isActive: true },
    });

    if (bots.length === 0) {
      return;
    }

    await Promise.all(
      bots.map(async (bot) => {
        try {
          await axios.post(
            `https://api.telegram.org/bot${bot.token}/sendMessage`,
            {
              chat_id: bot.chatId,
              text: message,
            },
          );
        } catch (error) {
          if (isAxiosError(error)) {
            console.error(
              `Failed to send Telegram message for bot ${bot.id}:`,
              error.response?.data ?? error.message,
            );
          } else {
            console.error(
              `Failed to send Telegram message for bot ${bot.id}:`,
              error,
            );
          }
        }
      }),
    );
  }
}

