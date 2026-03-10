import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngredientesModule } from './ingredientes/ingredientes.module';
import { RecetasModule } from './recetas/recetas.module';
import { UsuariosModule } from './usuarios/usuarios.module';

// adding module to nest ingredientes
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IngredientesModule,
    RecetasModule,
    UsuariosModule,
  ],
})
export class AppModule {}
