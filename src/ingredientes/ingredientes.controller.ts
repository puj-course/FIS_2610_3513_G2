import { Controller, Get, Query } from '@nestjs/common'
import { IngredientesService } from './ingredientes.service'

@Controller('ingredientes')
export class IngredientesController {

  constructor(private ingredientesService: IngredientesService) {}

  @Get('autocomplete')
  async autocomplete(@Query('q') query: string) {

      return this.ingredientesService.autocomplete(query)

  }

}
