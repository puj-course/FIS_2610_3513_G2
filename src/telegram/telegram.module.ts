import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Module({
  providers: [TelegramService],
  exports: [TelegramService],   // ← exports para que RecetasModule lo pueda usar
})
export class TelegramModule {}
