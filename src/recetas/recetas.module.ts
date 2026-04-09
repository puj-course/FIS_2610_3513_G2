import { Module } from '@nestjs/common';
import { RecetasService } from './recetas.service';
import { RecetasController } from './recetas.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRecetaService } from './crear-receta.service';
import { GuardarBorradorService } from './guardar-borrador.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [RecetasController],
  providers: [
    RecetasService,
    CrearRecetaService,
    GuardarBorradorService,
    PrismaService,   // ← así, directo
  ],
})
export class RecetasModule {}