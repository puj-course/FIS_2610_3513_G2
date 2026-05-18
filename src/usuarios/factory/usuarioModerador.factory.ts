import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { DatosCreacion } from './IUsuarioCreado.factory';
import { UsuarioFactory } from '../usuarioFactory.factory';

@Injectable()
export class UsuarioModeradorFactory extends UsuarioFactory {

  getRol(): string {
    return 'moderador';
  }

  crearDatos(dto: RegisterDto, hashedPassword: string): DatosCreacion {
    return {
      nickname: dto.nickname,
      email: dto.email,
      contrasena: hashedPassword,
      fecha_registro: new Date(),
      rol: this.getRol(),
    };
  }

}