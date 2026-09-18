import 'reflect-metadata';
import { INestApplication, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { HEADER_DE_SUPERFICIE, HEADER_IDEMPOTENCY_KEY, HEADER_REQUEST_ID } from '@be/domain';
import helmet from 'helmet';
import { AppModule, OpcionesApp } from './app.module';
import { requestId } from './http/request-id';

/** 07 §29: los contratos de WP-02 son JSON chicos; un cuerpo mayor se rechaza antes de parsear. */
const LIMITE_DE_CUERPO = '16kb';

/** Construye la aplicación con la misma configuración en runtime y en pruebas. */
export async function crearApp(opciones: OpcionesApp): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.con(opciones), { logger: ['error', 'warn'] });
  // `req.ip` = cliente real detrás del proxy de la plataforma (evidencia del acto y límite de intentos).
  app.set('trust proxy', opciones.entorno.saltosDeProxy);
  app.useBodyParser('json', { limit: LIMITE_DE_CUERPO });
  app.useBodyParser('urlencoded', { limit: LIMITE_DE_CUERPO, extended: false });
  app.use(requestId());
  app.use(helmet());
  // 09 §3.1 — prefijo obligatorio; health queda fuera (07 §13.2, DEUDA_LEGAJO DL-004).
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  if (opciones.entorno.corsAllowedOrigins.length > 0) {
    app.enableCors({
      origin: [...opciones.entorno.corsAllowedOrigins],
      allowedHeaders: ['authorization', 'content-type', HEADER_IDEMPOTENCY_KEY, HEADER_DE_SUPERFICIE],
      exposedHeaders: [HEADER_REQUEST_ID],
    });
  }
  app.enableShutdownHooks();
  return app;
}
