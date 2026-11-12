import 'reflect-metadata';
import { INestApplication, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { HEADER_DE_CAPACIDADES, HEADER_DE_SUPERFICIE, HEADER_IDEMPOTENCY_KEY, HEADER_REQUEST_ID } from '@be/domain';
import helmet from 'helmet';
import { AppModule, OpcionesApp } from './app.module';
import { esJsonDePlanOReceta, LIMITE_DE_PLANES_Y_RECETAS } from './http/limite-de-cuerpo';
import { requestId } from './http/request-id';
import { abrirElContextoDelPedido } from './sesion/sesion-de-la-solicitud';

/**
 * 07 §29: los contratos de WP-02 son JSON chicos; un cuerpo mayor se rechaza antes de parsear. Salvo las diez escrituras
 * que llevan un plan entero (un borrador o una plantilla) o una receta, que tienen su propio límite (DL-168,
 * `http/limite-de-cuerpo.ts`).
 */
const LIMITE_DE_CUERPO = '16kb';

/** Construye la aplicación con la misma configuración en runtime y en pruebas. */
export async function crearApp(opciones: OpcionesApp): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.con(opciones), { logger: ['error', 'warn'] });
  // `req.ip` = cliente real detrás del proxy de la plataforma (evidencia del acto y límite de intentos).
  app.set('trust proxy', opciones.entorno.saltosDeProxy);
  // Orden: request id, cabeceras de seguridad y CORS ANTES que los body parsers. Un error del parser (JSON inválido,
  // cuerpo mayor que su límite) saltea los middlewares siguientes: si CORS fuera después, el website (cross-origin desde
  // DL-030) vería ese 400 como un error de red y la respuesta saldría sin X-Request-Id.
  app.use(requestId());
  app.use(helmet());
  // Respuestas con datos de la persona o de su sesión: ningún intermediario ni el navegador las guarda (08 §30).
  app.use((_req: unknown, res: { setHeader: (n: string, v: string) => void }, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  if (opciones.entorno.corsAllowedOrigins.length > 0) {
    app.enableCors({
      origin: [...opciones.entorno.corsAllowedOrigins],
      // Los nombres de cabecera no distinguen mayúsculas: la de capacidades va en minúsculas, como las demás de la lista.
      allowedHeaders: ['authorization', 'content-type', HEADER_IDEMPOTENCY_KEY, HEADER_DE_SUPERFICIE, HEADER_DE_CAPACIDADES.toLowerCase()],
      exposedHeaders: [HEADER_REQUEST_ID],
      // DL-147: el website manda credenciales (la cookie de reanudación) solo a /api/v1/auth/sessions; las demás
      // operaciones se autentican con el Bearer, así que ninguna de datos depende de una cookie.
      credentials: true,
    });
  }
  // DL-168: el parser de planes y recetas va primero y lee solo el JSON de esas diez rutas, con su límite. El general no
  // vuelve a leer un cuerpo ya leído (body-parser lo saltea), así que para el resto de la API nada cambia.
  app.useBodyParser('json', { limit: LIMITE_DE_PLANES_Y_RECETAS, type: esJsonDePlanOReceta });
  app.useBodyParser('json', { limit: LIMITE_DE_CUERPO });
  app.useBodyParser('urlencoded', { limit: LIMITE_DE_CUERPO, extended: false });
  // UF-11 (DL-169): el contexto de cada pedido, donde SesionGuard anota la sesión y el segundo factor del profesional. Va
  // después de los parsers: su lectura del cuerpo sigue en un evento del stream, que no conserva el contexto.
  app.use(abrirElContextoDelPedido);
  // 09 §3.1 — prefijo obligatorio; health queda fuera (07 §13.2, DEUDA_LEGAJO DL-004), y la ruta interna de las tareas (DL-133).
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      // DL-133: la ruta interna de la tarea programada (07 §24), fuera del contrato de los clientes.
      { path: 'internal/reminder-runs', method: RequestMethod.POST },
    ],
  });
  app.enableShutdownHooks();
  return app;
}
