import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}
  //---------------------------------------------------------------------------------------------------------------------
  // register
  async register(dto: RegisterDto) {
    
    const existing = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Hay una cuenta registrada con este correo...');

    // para crear una cuenta en la tabla de usuario
    const user = await this.prisma.usuario.create({
      data: { nickname: dto.nickname, email: dto.email, contrasena: dto.contrasena, fecha_registro: new Date() },
      select: { idusuario: true, nickname: true, email: true },
    });
    return { message: '¡Cuenta creada exitosamente!', user };
  }
//---------------------------------------------------------------------------------------------------------------------
  async getById(id: number) {
  return this.prisma.usuario.findUnique({ where: { idusuario: id } });
}
// login
  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findFirst({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('No existe una cuenta con este correo');
    if (user.contrasena !== dto.contrasena) throw new UnauthorizedException('Contraseña incorrecta');

    return { message: `¡Bienvenido, ${user.nickname}!`, user: { idusuario: user.idusuario, nickname: user.nickname, email: user.email } };
  }
}
