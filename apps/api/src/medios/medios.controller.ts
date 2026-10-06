import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { MediosService } from './medios.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia MED con sesión (DL-120): la intención de subida (API-MED-01), el acceso de lectura (API-MED-03) y la supresión
 * a pedido (API-MED-05). Ningún handler decide autorización: la decide el servicio con el PDP, en su transacción.
 */
@Controller()
@UseGuards(SesionGuard)
export class MediosController {
  constructor(
    private readonly medios: MediosService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-MED-01. */
  @Post('me/media/upload-intents')
  async crearIntencion(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.medios.crearIntencion(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-MED-03. Una lectura protegida: consume el límite de consultas del actor, como las demás. */
  @Get('media/:mediaId/access')
  acceso(@Param('mediaId') mediaId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.medios.acceso(actorDe(req), mediaId, query, contextoDe(req));
  }

  /** API-MED-05. */
  @Delete('me/media/:mediaId')
  async suprimir(@Param('mediaId') mediaId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.medios.suprimir(actorDe(req), mediaId, cuerpo, clave, contextoDe(req)));
  }
}

/**
 * Familia MED sin sesión (DL-120): las rutas firmadas que emitieron API-MED-01 y 03. No llevan `SesionGuard`: las
 * autoriza la firma, que vence. Una ruta vencida, alterada o de un medio suprimido es el mismo 404.
 */
@Controller()
export class RutasFirmadasController {
  constructor(private readonly medios: MediosService) {}

  /** API-MED-02: el cuerpo crudo se lee acá, con su propio límite (10 MB); el resto de la API sigue con 16 kB. */
  @Put('media/uploads/:token')
  subir(@Param('token') token: string, @Headers('content-type') contentType: string | undefined, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<unknown> {
    return this.medios.subir(token, contentType, req, query, contextoDe(req));
  }

  /**
   * API-MED-04: los bytes, sin caché (`no-store` ya va en toda respuesta, bootstrap.ts). La ruta firmada es la
   * autorización, así que la imagen se puede mostrar desde el website, que está en otro origen: la política de recursos
   * de origen cruzado de esta respuesta lo permite (las demás siguen en `same-origin`).
   */
  @Get('media/content/:token')
  async contenido(@Param('token') token: string, @Query() query: Record<string, unknown>, @Res() res: Response): Promise<void> {
    const bytes = await this.medios.contenido(token, query);
    res.status(200);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Pragma', 'no-cache');
    res.end(bytes);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
