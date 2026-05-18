import { Injectable, UnauthorizedException } from "@nestjs/common";
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
    if (!dto.id_usuariocreador){
      throw new UnauthorizedException(
        "Debes iniciar sesión para guardar un borrador"
      );
    }
    return super.ejecutar({ ...dto, estado: "borrador" });
  }

  // Borrador no notifica
  protected async notificar(_receta: any): Promise<void> {}
}
