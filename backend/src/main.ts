import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve static files from 'uploads'
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Security
  // app.use(helmet()); // Temporarily disabled to debug connectivity
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }),
  );

  // Validation & Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
    new SanitizationPipe(),
  );

  // Interceptors
  // app.useGlobalInterceptors(new LoggingInterceptor()); // Middleware now handles logging

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
