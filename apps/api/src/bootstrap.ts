import 'reflect-metadata';
import { INestApplication, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule, OpcionesApp } from './app.module';
import { requestId } from './http/request-id';

/** Construye la aplicación con la misma configuración en runtime y en pruebas. */
export async function crearApp(opciones: OpcionesApp): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.con(opciones), { logger: ['error', 'warn'] });
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
    app.enableCors({ origin: [...opciones.entorno.corsAllowedOrigins] });
  }
  app.enableShutdownHooks();
  return app;
}
