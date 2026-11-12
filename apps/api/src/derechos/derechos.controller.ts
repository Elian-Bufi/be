import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type ExportacionResponse, type ListaDePedidosDeDerechoResponse, type PedidoDeDerechoResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { DerechosService } from './derechos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * UF-06 de WP-USO-FINAL (DL-169; 09 v0.12 §14 y §15): los derechos de la persona, API-RGT-01 a 03 y API-EXP-01 y 02, con
 * sesión (lo propio, siempre de la persona autenticada), y la descarga por su ruta firmada (API-EXP-02-DESCARGA), sin
 * sesión: la autoriza la ruta, que vence a los 15 minutos. Prefijo global /api/v1.
 */
@Controller()
export class DerechosController {
  constructor(private readonly derechos: DerechosService) {}

  /** API-RGT-01 — Idempotency-Key requerida. */
  @Post('me/data-rights-requests')
  @UseGuards(SesionGuard)
  async pedir(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.derechos.pedir(actorDe(req), cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-RGT-03. */
  @Get('me/data-rights-requests')
  @UseGuards(SesionGuard)
  pedidos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDePedidosDeDerechoResponse> {
    return this.derechos.pedidosPropios(actorDe(req), query);
  }

  /** API-RGT-02. */
  @Get('me/data-rights-requests/:requestId')
  @UseGuards(SesionGuard)
  pedido(@Param('requestId') pedidoId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<PedidoDeDerechoResponse> {
    sinParametrosDeQuery(query);
    return this.derechos.pedidoPropio(actorDe(req), pedidoId);
  }

  /** API-EXP-01 — Idempotency-Key requerida. */
  @Post('me/exports')
  @UseGuards(SesionGuard)
  async exportar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.derechos.exportar(actorDe(req), cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-EXP-02. */
  @Get('me/exports/:exportId')
  @UseGuards(SesionGuard)
  exportacion(@Param('exportId') exportacionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ExportacionResponse> {
    sinParametrosDeQuery(query);
    return this.derechos.exportacionPropia(actorDe(req), exportacionId);
  }

  /** API-EXP-02-DESCARGA — SIGNED_URL: sin sesión; el archivo como adjunto, sin caché. */
  @Get('exports/content/:token')
  async descargar(@Param('token') token: string, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res() res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    const { nombre, contenido } = await this.derechos.descargar(token, contextoDe(req));
    res.status(200);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(contenido);
  }
}
