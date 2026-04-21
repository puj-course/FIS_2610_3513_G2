import { Injectable, ForbiddenException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { DatosCreacion } from './IUsuarioCreado.factory';
import { UsuarioFactory } from '../usuarioFactory.factory';

@Injectable()
export class UsuarioAdminFactory extends UsuarioFactory {
  

  getRol(): string {
    return 'admin';
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

  validarCreador(rolCreador: string): void {
    if (rolCreador !== 'admin') {
      throw new ForbiddenException(
        'Solo un administrador puede crear otro administrador',
      );
    }
  }

}