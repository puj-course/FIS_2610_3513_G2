import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { NotificacionesFacade } from './NotificacionesFacade';
import { NotificacionesFacade } from './NotificacionesFacade';

@Module({
  providers: [TelegramService, NotificacionesFacade],
  exports: [TelegramService, NotificacionesFacade],
  providers: [TelegramService, NotificacionesFacade],
  exports: [TelegramService, NotificacionesFacade],
})
export class TelegramModule {}
