import { Injectable } from "@nestjs/common";
import { PrismaService } from "./../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { RecetaCreacionBase } from "./receta-creacion-base.service";

@Injectable()
export class GuardarBorradorService extends RecetaCreacionBase {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Sobreescribe ejecutar solo para forzar el estado borrador
  async ejecutar(dto: CrearRecetaDto) {
    return super.ejecutar({ ...dto, estado: "borrador" });
  }

  // Borrador no notifica
  protected async notificar(_receta: any): Promise<void> {}
}