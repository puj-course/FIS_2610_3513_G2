import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string;
  private readonly chatId: string;
  private readonly apiUrl: string;

  constructor(private config: ConfigService) {
    this.token  = this.config.get<string>('TELEGRAM_TOKEN')  || ''; 
    this.chatId = this.config.get<string>('TELEGRAM_CHAT_ID') || '';
    this.apiUrl = `https://api.telegram.org/bot${this.token}/sendMessage`;
  }

  async enviarMensaje(texto: string): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: texto,
        }),
      });
    } catch (err) {
      console.error('Error enviando mensaje a Telegram:', err);
    }
  }


async enviarFoto(imagenBuffer: Buffer, caption: string): Promise<void> {
  try {
    // no se puede usar blob por unas cosas de compatibilidad :c
    const uint8Array = new Uint8Array(imagenBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('chat_id', this.chatId);
    formData.append('caption', caption);
    formData.append('photo', blob, 'receta.jpg');

    await fetch(`https://api.telegram.org/bot${this.token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Error enviando foto a Telegram:', err);
  }
}


async enviarMensajeA(chatId: number | string, texto: string): Promise<void> {
  try {
    await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
    });
    this.logger.log(`[Telegram] ✓ Mensaje enviado a chatId=${chatId}`);
  } catch (err) {
    console.error(`[Telegram] ✗ Error enviando a chatId=${chatId}:`, err);
  }
}

async enviarFotoA(chatId: number | string, imagenBuffer: Buffer, caption: string): Promise<void> {
  try {
    const uint8Array = new Uint8Array(imagenBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('photo', blob, 'receta.jpg');

    await fetch(`https://api.telegram.org/bot${this.token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    this.logger.log(`[Telegram] ✓ Foto enviada a chatId=${chatId}`);
  } catch (err) {
    console.error(`[Telegram] ✗ Error enviando foto a chatId=${chatId}:`, err);
  }
}
}