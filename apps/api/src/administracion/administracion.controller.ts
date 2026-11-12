import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  HEADER_IDEMPOTENCY_KEY,
  type CodigosDeRecuperacionResponse,
  type ConfiguracionConfirmadaResponse,
  type ConfiguracionDelAutenticadorResponse,
  type EstadoDeSesionAdministrativaResponse,
  type FichaDeProfesionalResponse,
  type HistorialAdministrativoResponse,
  type ListaAdministrativaDePedidosDeDerechoResponse,
  type ListaDeProfesionalesResponse,
  type SegundoFactorVerificadoResponse,
  type SesionAdministrativaResponse,
} from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { borrarCookieDeReanudacion, PERFIL_ADMINISTRATIVO } from '../sesion/reanudacion.service';
import { DerechosService } from '../derechos/derechos.service';
import { AccesoAdministrativoService } from './acceso-administrativo.service';
import { AdministracionService } from './administracion.service';
import { actorAdministrativoDe, OperacionAdministrativa, SegundoFactorGuard, SesionAdministrativaGuard, type SolicitudAdministrativa } from './sesion-administrativa.guard';

type Solicitud = SolicitudAdministrativa & SolicitudConContexto;

/**
 * WP-ADMINISTRACION (DL-155): la familia ADM, API-ADM-01 a 13; desde UF-04 de WP-USO-FINAL (DL-169), también API-ADM-14
 * (incorporar un profesional) y 15 (cambiar su nombre profesional). Prefijo global /api/v1.
 * - Sin guard: abrir y reanudar la sesión (el primer factor y la cookie) y cerrarla (idempotente).
 * - `SesionAdministrativaGuard`: una sesión administrativa válida, con el rol vigente. Alcanza solo para el segundo factor
 *   y para el estado de la propia sesión.
 * - `SesionAdministrativaGuard` + `SegundoFactorGuard` (SESSION_MFA): todo lo que lee o decide.
 * El cliente no aporta nada a la autorización: ni rol, ni nivel, ni el estado de su segundo factor.
 */
@Controller('admin')
export class AdministracionController {
  constructor(
    private readonly acceso: AccesoAdministrativoService,
    private readonly administracion: AdministracionService,
    private readonly derechos: DerechosService,
  ) {}

  /** API-ADM-01 — PUBLIC. */
  @Post('auth/sessions')
  @HttpCode(201)
  iniciar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<SesionAdministrativaResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.iniciar(cuerpo, contextoDe(req), res);
  }

  /** API-ADM-02 — con la cookie de reanudación de Administración. */
  @Post('auth/sessions/resume')
  @HttpCode(200)
  reanudar(@Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<SesionAdministrativaResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.reanudar(req.get('cookie'), req.get('origin'), contextoDe(req), res);
  }

  /** API-ADM-03 — idempotente; borra la cookie. */
  @Delete('auth/sessions/current')
  @HttpCode(204)
  async cerrar(@Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    await this.acceso.cerrar(req.get('authorization'), contextoDe(req));
    borrarCookieDeReanudacion(res, PERFIL_ADMINISTRATIVO);
  }

  /** API-ADM-04 — primer factor. */
  @Get('auth/sessions/current')
  @OperacionAdministrativa('API-ADM-04')
  @UseGuards(SesionAdministrativaGuard)
  estado(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<EstadoDeSesionAdministrativaResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.estado(actorAdministrativoDe(req));
  }

  /** API-ADM-05 — primer factor. */
  @Post('auth/sessions/current/second-factor')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-05')
  @UseGuards(SesionAdministrativaGuard)
  verificarCodigo(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<SegundoFactorVerificadoResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.verificarCodigo(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-06 — primer factor. */
  @Post('auth/sessions/current/recovery-code')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-06')
  @UseGuards(SesionAdministrativaGuard)
  usarCodigoDeRecuperacion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<SegundoFactorVerificadoResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.usarCodigoDeRecuperacion(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-07 — primer factor (más el código de incorporación, o el segundo factor y la contraseña para reemplazar). */
  @Post('auth/second-factor/enrollment')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-07')
  @UseGuards(SesionAdministrativaGuard)
  iniciarConfiguracion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ConfiguracionDelAutenticadorResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.iniciarConfiguracion(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-08 — primer factor. */
  @Post('auth/second-factor/enrollment/confirm')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-08')
  @UseGuards(SesionAdministrativaGuard)
  confirmarConfiguracion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ConfiguracionConfirmadaResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.confirmarConfiguracion(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-09 — SESSION_MFA más la contraseña. */
  @Post('auth/recovery-codes')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-09')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  regenerarCodigos(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<CodigosDeRecuperacionResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.regenerarCodigos(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-10 — SESSION_MFA. La búsqueda va en el cuerpo, no en la URL. */
  @Post('professionals/query')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-10')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  consultar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeProfesionalesResponse> {
    sinParametrosDeQuery(query);
    return this.administracion.consultar(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-11 — SESSION_MFA. */
  @Get('professionals/:professionalId')
  @OperacionAdministrativa('API-ADM-11')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  ficha(@Param('professionalId') profesionalId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<FichaDeProfesionalResponse> {
    sinParametrosDeQuery(query);
    return this.administracion.ficha(actorAdministrativoDe(req), profesionalId, contextoDe(req));
  }

  /** API-ADM-12 — SESSION_MFA. */
  @Get('professionals/:professionalId/history')
  @OperacionAdministrativa('API-ADM-12')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  historial(@Param('professionalId') profesionalId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<HistorialAdministrativoResponse> {
    return this.administracion.historial(actorAdministrativoDe(req), profesionalId, query, contextoDe(req));
  }

  /** API-ADM-13 — SESSION_MFA, Idempotency-Key requerida. */
  @Post('professionals/:professionalId/scopes/:scope/decisions')
  @OperacionAdministrativa('API-ADM-13')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  async decidir(
    @Param('professionalId') profesionalId: string,
    @Param('scope') alcance: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.administracion.decidir(actorAdministrativoDe(req), profesionalId, alcance, cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-ADM-14 — SESSION_MFA, Idempotency-Key requerida (UF-04 de WP-USO-FINAL, DL-169). */
  @Post('professionals')
  @OperacionAdministrativa('API-ADM-14')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  async incorporar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.administracion.incorporar(actorAdministrativoDe(req), cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-ADM-15 — SESSION_MFA, Idempotency-Key requerida (UF-04 de WP-USO-FINAL, DL-169). */
  @Post('professionals/:professionalId/name')
  @OperacionAdministrativa('API-ADM-15')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  async cambiarNombre(
    @Param('professionalId') profesionalId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.administracion.cambiarNombre(actorAdministrativoDe(req), profesionalId, cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-ADM-16 — SESSION_MFA. Los pedidos de derechos de las personas (UF-06 de WP-USO-FINAL, DL-169). */
  @Post('data-rights-requests/query')
  @HttpCode(200)
  @OperacionAdministrativa('API-ADM-16')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  pedidosDeDerecho(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaAdministrativaDePedidosDeDerechoResponse> {
    sinParametrosDeQuery(query);
    return this.derechos.consultarParaAdministracion(actorAdministrativoDe(req), cuerpo, contextoDe(req));
  }

  /** API-ADM-17 — SESSION_MFA, Idempotency-Key requerida. Resolver un pedido de derechos (UF-06). */
  @Post('data-rights-requests/:requestId/resolution')
  @OperacionAdministrativa('API-ADM-17')
  @UseGuards(SesionAdministrativaGuard, SegundoFactorGuard)
  async resolverPedidoDeDerecho(
    @Param('requestId') pedidoId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.derechos.resolver(actorAdministrativoDe(req), pedidoId, cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }
}
