import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

const SALT = 10;

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

    const hashedPassword = await bcrypt.hash(dto.contrasena, SALT) // esto genera el hash de la contraseña

    // para crear una cuenta en la tabla de usuario
    const user = await this.prisma.usuario.create({
      data: { nickname: dto.nickname, email: dto.email, contrasena: hashedPassword, fecha_registro: new Date() },
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

  const passwordMatch = await bcrypt.compare(dto.contrasena, user.contrasena);
  if (!passwordMatch) throw new UnauthorizedException('Contraseña incorrecta');

  return {
    message: `¡Bienvenido, ${user.nickname}!`,
    user: {
      idusuario: user.idusuario,
      nickname:  user.nickname,
      email:     user.email,
      rol:       user.rol,     
    },
  };
}}
