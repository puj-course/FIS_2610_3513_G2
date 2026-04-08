import { Injectable, BadRequestException } from '@nestjs/common';
import { ModeraciónHandler } from './moderacion.handler';
import { ModeracionRequestDto } from '../dto/moderacion-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificacionesFacade } from '../facades/notificaciones.facade';

@Injectable()
export class ModeraciónAccionHandler extends ModeraciónHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesFacade,
  ) {
    super();
  }

  async handle(request: ModeracionRequestDto): Promise<void> {
    const { recetaId, accion } = request;

    if (accion === 'eliminar') {
      await this.prisma.receta.delete({ where: { idreceta: recetaId } });
      await this.notificaciones.notificarCambioEstado({ nombre: 'N/A', idreceta: recetaId }, accion);
      return;
    }

    const nuevoEstado = accion === 'aprobar' ? 'publicado' : 'rechazado';

    const receta = await this.prisma.receta.update({
      where: { idreceta: recetaId },
      data: { estado: nuevoEstado },
    });

    await this.notificaciones.notificarCambioEstado(receta, accion);
  }
}
