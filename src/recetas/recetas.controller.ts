import { Controller, Get, Delete, Post, Patch, UploadedFile, UseInterceptors, Body, Query, Param, HttpCode, UnauthorizedException} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecetasService } from './recetas.service';
import { BuscarRecetasDto } from './dto/buscar-recetas.dto';
import { CrearRecetaDto } from './dto/crear-receta.dto';
import { v2 as cloudinary } from "cloudinary";

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
  @Get('borrador/:userId')
async getBorradorByUsuario(@Param('userId') userId: string) {
  return this.recetasService.getBorradorByUsuario(Number(userId));
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
  

  @Get('guardadas/:userId')
  async getGuardadas(@Param('userId') userId: string) {
    return this.recetasService.getRecetasGuardadas(Number(userId));
  }

  @Post(':id/guardar')
  @HttpCode(201)
  async guardar(
    @Param('id') id: string,
    @Body('usuarioId') usuarioId: number,
  ) {
    return this.recetasService.guardarReceta(usuarioId, Number(id));
  }

  @Delete(':id/guardar')
  async quitar(
    @Param('id') id: string,
    @Body('usuarioId') usuarioId: number,
  ) {
    return this.recetasService.quitarRecetaGuardada(usuarioId, Number(id));
  }

  // endpoints para calificacion de recetas
  
  @Post(':id/calificar')
  async calificar(
    @Param('id') id:string,
    @Body('usuarioId') usuarioId:number,
    @Body('puntaje') puntaje: number,
  ) {
    if (!usuarioId){
      throw new UnauthorizedException('Debes iniciar sesion para calificar');
    }
    return this.recetasService.calificar(Number(id), Number(usuarioId), Number(puntaje));
  }

  @Get(':id/promedio')
  async getPromedio(@Param('id') id:string) { 
    return this.recetasService.getCalificacionPromedio(Number(id));
  }
}
