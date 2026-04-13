// telegram/notificaciones.facade.ts
import { Injectable } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Injectable()
export class NotificacionesFacade {
  constructor(private readonly telegram: TelegramService) {}

  async notificarTelegram(receta: any): Promise<void> {
    const mensaje = this.formatearMensaje(receta);

    // verificación de que tipo de receta es
    if (receta.imagenreceta) {
      await this.telegram.enviarFoto(Buffer.from(receta.imagenreceta), mensaje);
    } else {
      await this.telegram.enviarMensaje(mensaje);
    }
  }

  // mensaje personalizado 
  private formatearMensaje(receta: any): string {
    return `📋 Nueva receta para verificar\n\n` +
    `🍽️ Nombre: ${receta.nombre}\n` +
    `📝 Descripción: ${receta.descripcion || 'Sin descripción'}\n` +
    `🆔 ID: ${receta.idreceta}\n\n` +
    `Estado: ${receta.estado}\n` +
    `Creador: ${receta.id_usuariocreador || 'Anónimo'}`;
  }
}
