import { Module } from '@nestjs/common';
import { RecetasService } from './recetas.service';
import { RecetasController } from './recetas.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRecetaService } from './crear-receta.service';
import { GuardarBorradorService } from './guardar-borrador.service';
import { TelegramModule } from '../telegram/telegram.module';
import { IngredientesModule } from '../ingredientes/ingredientes.module'
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => TelegramModule), IngredientesModule],
  controllers: [RecetasController],
  providers: [
    RecetasService,
    CrearRecetaService,
    GuardarBorradorService,
    PrismaService,  
  ],
  exports: [RecetasService],
})
export class RecetasModule {}
