import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    app.enableCors({
    origin: '*', // puse esto para que acepte cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // esto pq me daba errores con el preflight
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
  await app.listen(3000);
}
bootstrap();
