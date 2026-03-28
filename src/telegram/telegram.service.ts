import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
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
}