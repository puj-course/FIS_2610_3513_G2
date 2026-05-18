import { Injectable } from '@nestjs/common';
import { TelegramService } from '../../telegram/telegram.service';

@Injectable()
export class NotificacionesFacade {
  constructor(private readonly telegram: TelegramService) {}

  async notificarCambioEstado(receta: any, accion: string): Promise<void> {
    const texto =
      `Receta moderada\n\n` +
      `Nombre: ${receta.nombre}\n` +
      `ID: ${receta.idreceta}\n` +
      `Acción: ${accion.toUpperCase()}\n` +
      `Fecha: ${new Date().toLocaleDateString('es-CO')}`;

    await this.telegram.enviarMensaje(texto);
  }
}
