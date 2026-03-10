import { Controller, Get, Query } from '@nestjs/common';
import { RecetasService } from './recetas.service';
import { BuscarRecetasDto } from './dto/buscar-recetas.dto';

@Controller('recetas')
export class RecetasController {
  constructor(private readonly recetasService: RecetasService) {}

  @Get('buscar')
  buscarPorRelevancia(@Query() dto: BuscarRecetasDto) {
  const ids = Array.isArray(dto.ingredientesIds)
    ? dto.ingredientesIds
    : dto.ingredientesIds ? [dto.ingredientesIds] : [];
  
  return this.recetasService.buscarPorIngredientes(ids.map(Number));
  }

  @Get()
  getAll() {
    return this.recetasService.getAll();
  }
}
