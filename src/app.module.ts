import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngredientesModule } from './ingredientes/ingredientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IngredientesModule,
  ],
})
export class AppModule {}
