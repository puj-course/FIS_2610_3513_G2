import { Module } from '@nestjs/common'
import { IngredientesController } from './ingredientes.controller'
import { IngredientesService } from './ingredientes.service'
import { PrismaService } from '../../prisma/prisma.service'
import { IngredienteFlyweightFactory } from './flyweight/ingrediente-flyweight.factory';

// adding module Ingredientes
@Module({
  controllers: [IngredientesController],
  providers: [IngredientesService, IngredienteFlyweightFactory, PrismaService],
  exports: [IngredientesService, IngredienteFlyweightFactory],

})
export class IngredientesModule {}
