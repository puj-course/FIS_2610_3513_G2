import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { DatosCreacion } from './IUsuarioCreado.factory';
import { UsuarioFactory } from '../usuarioFactory.factory';

@Injectable()
export class UsuarioVerificadoFactory extends UsuarioFactory {

  getRol(): string {
    return 'chef';
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
