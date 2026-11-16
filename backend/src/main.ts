import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';
import { CORS_ORIGINS } from './common/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Chess API')
    .setDescription('API documentation for Chess Platform')
    .setVersion('1.0.0')
    .addServer('/api', 'API Gateway')
    .addServer('http://localhost:4000', 'Local Backend')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);  

  app.set('trust proxy', 1);

  app.useStaticAssets(join(process.cwd(), 'src', 'uploads'), {
  prefix: '/uploads/',
  // nginx's nosniff is not inherited by /api/ (that location sets its own add_header)
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
});

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.enableCors({
	origin: CORS_ORIGINS,

    credentials: true,
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const prisma = app.get(PrismaService);
    await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    }).catch(() => {});
  }

  await app.listen(4000, '0.0.0.0');
  console.log('Backend is running on http://localhost:4000');
}

bootstrap();
