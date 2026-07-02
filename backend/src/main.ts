import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import * as dns from 'dns';
import { normalizeUrl } from './common/utils/runtime-url.util';

// Force IPv4 preference for DNS resolution to avoid ENETUNREACH on IPv6-only cloud networks
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust reverse proxy (Render, Vercel) so real client IPs are used for rate limiting
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security
  app.use(helmet());

  const frontendOrigins = new Set(
    [
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      process.env.CORS_ORIGIN,
    ]
      .filter(Boolean)
      .map((origin) => normalizeUrl(origin!)),
  );
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || frontendOrigins.has(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      return callback(new Error('CORS blocked'));
    },
    credentials: true,
  });

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // increased for production proxy environments
      message: {
        statusCode: 429,
        message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
      },
      standardHeaders: true,
      legacyHeaders: false,
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
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      const secondaryPort = process.env.SECONDARY_PORT || 3002;
      console.warn(
        `Port ${port} is in use, trying secondary port ${secondaryPort}...`,
      );
      await app.listen(secondaryPort, '0.0.0.0');
      console.log(`Application is running on: ${await app.getUrl()}`);
    } else {
      throw error;
    }
  }
}
void bootstrap();
