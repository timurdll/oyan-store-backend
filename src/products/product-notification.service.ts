import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class ProductNotificationService {
  private twilioClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  private companyWhatsAppNumber = process.env.COMPANY_WHATSAPP_NUMBER;

  async sendWhatsAppMessage(message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        from: 'whatsapp:+14155238886', // Twilio WhatsApp number
        to: this.companyWhatsAppNumber, // Company number to receive messages
        body: message,
      });
      console.log('Message sent to WhatsApp');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
