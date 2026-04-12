import { Module } from '@nestjs/common';
import { ModeracionController } from './moderacion.controller';
import { ModeracionService } from './moderacion.service';
import { AutenticacionHandler } from './handlers/autenticacion.handler';
import { RolHandler } from './handlers/rol.handler';
import { ModeraciónAccionHandler } from './handlers/moderacion-accion.handler';
import { NotificacionesFacade } from './facades/notificaciones.facade';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [UsuariosModule, TelegramModule],
  controllers: [ModeracionController],
  providers: [
    ModeracionService,
    AutenticacionHandler,
    RolHandler,
    ModeraciónAccionHandler,
    NotificacionesFacade,
    PrismaService,
  ],
})
export class ModeracionModule {}
