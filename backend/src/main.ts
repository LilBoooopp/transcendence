import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);//create the next app using the AppModule

  app.useStaticAssets(join(__dirname, '..', 'src', 'uploads'), { prefix: '/uploads/' });

  app.enableCors({
	origin: ['https://localhost:4443', 'http://localhost:3000'],

    credentials: true,
  });

  // Enable vlaidation pas encore compris...
//  app.useGlobalPipes(new ValidationPipe());
/*app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
et utiliser des DTO sur toutes les routes qui reçoivent un body.
	*/

  await app.listen(4000, '0.0.0.0');// il écoute sur ce port
  console.log('Backend is running on http://localhost:4000');
}

bootstrap();
