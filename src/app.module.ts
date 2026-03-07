import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngredientesModule } from './ingredientes/ingredientes.module';

// adding module to nest ingredientes
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IngredientesModule,
  ],
})
export class AppModule {}
