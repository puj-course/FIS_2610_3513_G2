import { Injectable } from "@nestjs/common";
import { PrismaService } from "./../../prisma/prisma.service";
import { NotificacionesFacade } from "./../telegram/NotificacionesFacade";
import { RecetaCreacionBase } from "./receta-creacion-base.service";

@Injectable()
export class CrearRecetaService extends RecetaCreacionBase {
  constructor(
    prisma: PrismaService,
    private readonly notificaciones: NotificacionesFacade
  ) {
    super(prisma);
  }

  protected async notificar(receta: any): Promise<void> {
    if (receta.estado === "pendiente") {
      await this.notificaciones.notificarTelegram(receta);
    }
  }
}