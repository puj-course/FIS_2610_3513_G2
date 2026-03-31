import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngredientesModule } from './ingredientes/ingredientes.module';
import { RecetasModule } from './recetas/recetas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { TelegramModule } from './telegram/telegram.module';

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
  ],
})
export class AppModule {}
