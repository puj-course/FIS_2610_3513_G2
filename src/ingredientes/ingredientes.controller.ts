import { Controller, Get, Query } from '@nestjs/common'
import { IngredientesService } from './ingredientes.service'

@Controller('ingredientes')
export class IngredientesController {

  // agregando autocompletado
  constructor(private ingredientesService: IngredientesService) {}

  @Get()
  getAll() {
    return this.ingredientesService.getAll();
  }

  @Get('autocomplete')
  async autocomplete(@Query('q') query: string) {

      return this.ingredientesService.autocomplete(query)

  }

}
