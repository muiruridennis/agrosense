// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import dns from 'node:dns';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Render's network doesn't route outbound IPv6, but Node 18+ tries IPv6
// first by default — that caused SMTP (and would cause any outbound
// connection) to fail with ENETUNREACH when a host resolves to an IPv6
// address. Preferring IPv4 avoids that.
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Render terminates TLS at its edge proxy — without this, Express won't
  // recognize the connection as secure, and any `secure: true` cookies
  // (e.g. refresh tokens) silently fail to be set.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.use(helmet());


  app.use(cookieParser());

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  // Supports one or multiple comma-separated origins, e.g.
  // CORS_ORIGIN=https://agrosense-client.onrender.com,https://app.agrosense.co
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin?.split(',').map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = configService.get<number>('PORT') ?? 3001;

  // Bind to 0.0.0.0 explicitly — required for Render (and most container
  // platforms) to route traffic to the container.
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on port ${port} (prefix: /api/v1)`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});