import { RegisterDto } from './dto/register.dto';
import { DatosCreacion } from './factory/IUsuarioCreado.factory';

export abstract class UsuarioFactory {
  abstract getRol(): string;
  abstract crearDatos(dto: RegisterDto, hashedPassword: string): DatosCreacion;

  validarCreador(rolCreador: string): void {}
}