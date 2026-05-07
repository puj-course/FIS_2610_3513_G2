import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsuarioFactory } from './usuarioFactory.factory';
import { UsuarioNormalFactory } from './factory/usuarioNormal.factory';
import { UsuarioModeradorFactory } from './factory/usuarioModerador.factory';
import { UsuarioAdminFactory } from './factory/usuarioAdmin.factory';
import { UsuarioVerificadoFactory } from './factory/usuarioVerificado.factory';
import { EditarPerfilDto } from './dto/editar-perfil.dto';
import { v2 as cloudinary } from 'cloudinary'; // para lo de la imagen de perfil
import * as bcrypt from 'bcrypt';

const SALT = 10;

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private normalFactory: UsuarioNormalFactory,
    private moderadorFactory: UsuarioModeradorFactory,
    private adminFactory: UsuarioAdminFactory,
    private verificadoFactory: UsuarioVerificadoFactory,
  ) {}
  //---------------------------------------------------------------------------------------------------------------------
    // ─── método privado compartido ───────────────────────────────────────────────
  private async crearConFactory(
    dto: RegisterDto,
    factory: UsuarioFactory,
    rolCreador?: string,
  ) {
    const existing = await this.prisma.usuario.findFirst({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Hay una cuenta registrada con este correo...');

    // validación específica del factory (solo AdminFactory hace algo aquí)
    factory.validarCreador(rolCreador ?? 'usuario');

    const hashedPassword = await bcrypt.hash(dto.contrasena, SALT);
    const datos = factory.crearDatos(dto, hashedPassword);

    const user = await this.prisma.usuario.create({
      data: datos,
      select: { idusuario: true, nickname: true, email: true, rol: true },
    });

    return { message: '¡Cuenta creada exitosamente!', user };
  }


  // ─── endpoints ───────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    return this.crearConFactory(dto, this.normalFactory);
  }

  async crearModerador(dto: RegisterDto, rolCreador: string) {
    return this.crearConFactory(dto, this.moderadorFactory, rolCreador);
  }

  async crearAdmin(dto: RegisterDto, rolCreador: string) {
    return this.crearConFactory(dto, this.adminFactory, rolCreador);
  }

  async crearVerificado(dto: RegisterDto, rolCreador: string) {
    return this.crearConFactory(dto, this.verificadoFactory, rolCreador);
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
}


// editar perfil (nickname y foto de perfil)
async editarPerfil(id: number, dto: EditarPerfilDto) {
  if (dto.solicitanteId !== id) {
    throw new UnauthorizedException('No puedes editar el perfil de otro usuario');
  }
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const data: any = {};

  if (dto.username !== undefined) {
    data.username = dto.username;
  }

  if (dto.imagen) {
    const buffer = Buffer.from(dto.imagen.split(',')[1], 'base64');
    data.fotoperfil = buffer;

    try {
      const url = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'recetasya/perfiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          },
        ).end(buffer);
      });
      data.profile_picture_url = url;
    } catch (e) {
      console.error('Error subiendo foto de perfil a Cloudinary:', e);
    }
  }
  // Revisa que el nuevo username no esté en uso por otro usuario (si se está cambiando)
  if (dto.username !== undefined) {
  const existente = await this.prisma.usuario.findFirst({
    where: {
      username: dto.username,
      NOT: { idusuario: id },
    },
  });

  if (existente) {
    throw new ConflictException('Ese nickname ya está en uso');
  }

  data.username = dto.username;
}

  const usuario = await this.prisma.usuario.update({
    where: { idusuario: id },
    data,
    select: {
      idusuario: true,
      nickname: true,
      username: true,
      email: true,
      rol: true,
      profile_picture_url: true,
    },
  });

  return { message: 'Perfil actualizado correctamente', usuario };
}
}
