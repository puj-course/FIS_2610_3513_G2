import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ModeracionService } from './moderacion.service';
import { ModeracionRequestDto } from './dto/moderacion-request.dto';

@Controller('moderacion')
export class ModeracionController {
  constructor(private readonly moderacionService: ModeracionService) {}

  @Post()
  @HttpCode(200)
  async moderar(@Body() dto: ModeracionRequestDto) {
    await this.moderacionService.moderar(dto);
    return { message: 'Acción de moderación ejecutada correctamente' };
  }
}
