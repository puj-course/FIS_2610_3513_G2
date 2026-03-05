import { Module } from '@nestjs/common'
import { IngredientesController } from './ingredientes.controller'
import { IngredientesService } from './ingredientes.service'
  import { PrismaService } from '../../prisma/prisma.service'

@Module({
  controllers: [IngredientesController],
  providers: [IngredientesService, PrismaService]
})
export class IngredientesModule {}
