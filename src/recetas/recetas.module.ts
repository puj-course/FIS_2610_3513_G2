import { Module } from '@nestjs/common';
import { RecetasService } from './recetas.service';
import { RecetasController } from './recetas.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramModule } from '../telegram/telegram.module';


@Module({
  imports: [TelegramModule],
  controllers: [RecetasController],
  providers: [RecetasService, PrismaService],
})
export class RecetasModule {}