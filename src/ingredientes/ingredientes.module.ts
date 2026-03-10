import { Module } from '@nestjs/common'
import { IngredientesController } from './ingredientes.controller'
import { IngredientesService } from './ingredientes.service'
  import { PrismaService } from '../../prisma/prisma.service'

// adding module Ingredientes
@Module({
  controllers: [IngredientesController],
  providers: [IngredientesService, PrismaService]
})
export class IngredientesModule {}
