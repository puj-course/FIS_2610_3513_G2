import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ModeracionController } from './moderacion.controller';
import { ModeracionService } from './moderacion.service';
import { AutenticacionHandler } from './handlers/autenticacion.handler';
import { RolHandler } from './handlers/rol.handler';
import { ModeraciónAccionHandler } from './handlers/moderacion-accion.handler';
import { NotificacionesFacade } from './facades/notificaciones.facade';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RecetasModule } from '../recetas/recetas.module';
import { MetricasMiddleware } from './metricas.middleware';
import { MetricasService } from './metricas.service';

@Module({
  imports: [UsuariosModule, TelegramModule, RecetasModule],
  controllers: [ModeracionController],
  providers: [
    ModeracionService,
    AutenticacionHandler,
    RolHandler,
    MetricasMiddleware,
    MetricasService,
    ModeraciónAccionHandler,
    NotificacionesFacade,
    PrismaService,
  ],
})
export class ModeracionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricasMiddleware).forRoutes('*');
  }
}
