import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ModeraciónHandler } from './moderacion.handler';
import { ModeracionRequestDto } from '../dto/moderacion-request.dto';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class AutenticacionHandler extends ModeraciónHandler {
  constructor(private readonly usuariosService: UsuariosService) {
    super();
  }

  async handle(request: ModeracionRequestDto): Promise<void> {
    const usuario = await this.usuariosService.getById(request.usuarioId);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // guarda el usuario en el request para que los siguientes handlers lo usen
    (request as any).usuario = usuario;

    this.pasarAlSiguiente(request);
  }
}
