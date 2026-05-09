import { Get, Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { Patch, Param, ParseIntPipe } from '@nestjs/common';
import { EditarPerfilDto } from './dto/editar-perfil.dto';

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


  @Post('crear-moderador')
crearModerador(@Body() dto: RegisterDto, @Body('rolCreador') rolCreador: string) {
  return this.usuariosService.crearModerador(dto, rolCreador);
}

@Post('crear-admin')
crearAdmin(@Body() dto: RegisterDto, @Body('rolCreador') rolCreador: string) {
  return this.usuariosService.crearAdmin(dto, rolCreador);
}

@Post('crear-verificado')
crearChef(@Body() dto: RegisterDto, @Body('rolCreador') rolCreador: string) {
  return this.usuariosService.crearVerificado(dto, rolCreador);
}

@Patch(':id/perfil')
editarPerfil(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: EditarPerfilDto,
) {
  return this.usuariosService.editarPerfil(id, dto);
  }

  @Get()
    getAll(){
      return this.usuariosService.getAll();
    }
// agregar endpoint para cambiar rol de usuario en el panel de crear-admin

  @Patch(':id/rol')
  actualizarRol(
    @Param('id', ParseIntPipe) id:number,
    @Body('rol') rol: string,
  ) {
    return this.usuariosService.actualizarRol(id, rol);
  }
}
