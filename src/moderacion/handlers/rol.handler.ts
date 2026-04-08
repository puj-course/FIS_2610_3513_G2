import { Injectable, ForbiddenException } from '@nestjs/common';
import { ModeraciónHandler } from './moderacion.handler';
import { ModeracionRequestDto } from '../dto/moderacion-request.dto';

@Injectable()
export class RolHandler extends ModeraciónHandler {
  private readonly rolesPermitidos = ['admin', 'moderador'];

  async handle(request: ModeracionRequestDto): Promise<void> {
    const usuario = (request as any).usuario;

    if (!this.rolesPermitidos.includes(usuario?.rol)) {
      throw new ForbiddenException('No tienes permisos para moderar recetas');
    }

    this.pasarAlSiguiente(request);
  }
}
