import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

//début nest.js
/*

Clé de contact (créer l'app)
Configurer les réglages (middlewares)
Démarrer le moteur (listen)
Prêt à rouler !
*/
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // specify frontend
    credentials: true,
  });

  // Enable vlaidation
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(4000, '0.0.0.0');
  console.log('Backend is running on http://localhost:4000');
}

bootstrap();

// USERSYL