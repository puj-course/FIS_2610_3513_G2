import { Controller, Post, Body, Get, HttpCode } from '@nestjs/common';
import { ModeracionService } from './moderacion.service';
import { ModeracionRequestDto } from './dto/moderacion-request.dto';
import { MetricasService } from './metricas.service';

@Controller('moderacion')
export class ModeracionController {
  constructor(
    private readonly moderacionService: ModeracionService,
    private readonly metricasService: MetricasService,)
    {}

  @Post()
  @HttpCode(200)
  async moderar(@Body() dto: ModeracionRequestDto) {
    await this.moderacionService.moderar(dto);
    return { message: 'Acción de moderación ejecutada correctamente' };
  }
  @Get('admin/metricas')
  getMetricas() {
    return this.metricasService.getTasaRechazo();
  }

  @Get('admin/metricas/rendimiento')
  getRendimiento() {
    return this.metricasService.getLatenciaYThroughput();
  }
}

