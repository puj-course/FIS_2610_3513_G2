import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngredientesModule } from './ingredientes/ingredientes.module';
import { RecetasModule } from './recetas/recetas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { TelegramModule } from './telegram/telegram.module';
import { v2 as cloudinary } from 'cloudinary';
import { ModeracionModule } from './moderacion/moderacion.module';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); //configrar cloudinary

// adding module to nest ingredientes
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IngredientesModule,
    RecetasModule,
    UsuariosModule,
    TelegramModule,
    ModeracionModule,
  ],
})
export class AppModule {}
