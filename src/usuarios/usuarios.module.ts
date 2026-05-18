import { Module, forwardRef } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramModule } from '../telegram/telegram.module';
import { UsuarioNormalFactory } from './factory/usuarioNormal.factory';
import { UsuarioModeradorFactory } from './factory/usuarioModerador.factory';
import { UsuarioAdminFactory } from './factory/usuarioAdmin.factory';
import { UsuarioVerificadoFactory } from './factory/usuarioVerificado.factory';


@Module({
  imports: [forwardRef(() => TelegramModule)],   
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    PrismaService,
    UsuarioNormalFactory,    
    UsuarioModeradorFactory,
    UsuarioAdminFactory,
    UsuarioVerificadoFactory,
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}