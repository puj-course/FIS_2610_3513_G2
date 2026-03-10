import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.usuariosService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.usuariosService.login(dto);
  }
}