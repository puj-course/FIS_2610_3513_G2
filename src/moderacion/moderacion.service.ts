import { Injectable } from '@nestjs/common';
import { AutenticacionHandler } from './handlers/autenticacion.handler';
import { RolHandler } from './handlers/rol.handler';
import { ModeraciónAccionHandler } from './handlers/moderacion-accion.handler';
import { ModeracionRequestDto } from './dto/moderacion-request.dto';

@Injectable()
export class ModeracionService {
  constructor(
    private readonly autenticacion: AutenticacionHandler,
    private readonly rol: RolHandler,
    private readonly accion: ModeraciónAccionHandler,
  ) {
    // Construye la cadena una sola vez al inicializar el servicio
    this.autenticacion.setNext(this.rol).setNext(this.accion);
  }

  async moderar(request: ModeracionRequestDto): Promise<void> {
    await this.autenticacion.handle(request);
  }
}
