import { Controller, Get, Delete, Post, Patch, Body, Query, Param, HttpCode } from '@nestjs/common';
import { RecetasService } from './recetas.service';
import { BuscarRecetasDto } from './dto/buscar-recetas.dto';
import { CrearRecetaDto } from './dto/crear-receta.dto';

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

  // POST /recetas/crear → crea receta (estado por defecto: 'publicado')
  @Post('crear')
  @HttpCode(201)
  async crear(@Body() dto: CrearRecetaDto) {
    return this.recetasService.crearReceta(dto);
  }

  // POST /recetas/borrador → guarda borrador (estado: 'borrador')
  @Post('borrador')
  @HttpCode(201)
  async guardarBorrador(@Body() dto: CrearRecetaDto) {
    return this.recetasService.guardarBorrador(dto);
  }

  // PATCH /recetas/:id/estado → cambia estado de una receta
  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
  ) {
    return this.recetasService.actualizarEstado(Number(id), estado);
  }
  @Delete(':id')
  async eliminarReceta(@Param('id') id: string) {
    return this.recetasService.eliminarReceta(Number(id));
  }
}
