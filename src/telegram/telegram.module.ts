import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { NotificacionesFacade } from './NotificacionesFacade';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RecetasModule } from '../recetas/recetas.module';

@Module({
  imports: [
    forwardRef(() => UsuariosModule),
    forwardRef(() => RecetasModule),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, NotificacionesFacade],
  exports: [TelegramService, NotificacionesFacade],
})
export class TelegramModule {}