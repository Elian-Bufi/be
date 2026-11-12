import { Body, Controller, Get, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import type {
  CodigosDeRecuperacionResponse,
  ConfiguracionDelAutenticadorResponse,
  ConfiguracionDeLaSesionConfirmadaResponse,
  SegundoFactorDeLaSesionResponse,
  SegundoFactorDeLaSesionVerificadoResponse,
} from '@be/domain';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { SegundoFactorDeLaSesionService } from './segundo-factor-de-la-sesion.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from './sesion.guard';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12): la familia MFA, API-MFA-01 a 06, el segundo factor del profesional sobre su
 * sesión común. Prefijo global /api/v1. Todas con `SesionGuard`: el cliente no aporta nada a la decisión, ni el estado de
 * su segundo factor ni si es profesional. Lo que exige el segundo factor en cada operación profesional no está acá: lo
 * deciden `SesionGuard` y `puedeActuarComoProfesional` (sesion-de-la-solicitud.ts).
 */
@Controller('me/second-factor')
@UseGuards(SesionGuard)
export class SegundoFactorDeLaSesionController {
  constructor(private readonly segundoFactor: SegundoFactorDeLaSesionService) {}

  /** API-MFA-01. */
  @Get()
  estado(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<SegundoFactorDeLaSesionResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.estado(actorDe(req));
  }

  /** API-MFA-02. */
  @Post('verification')
  @HttpCode(200)
  verificar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<SegundoFactorDeLaSesionVerificadoResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.verificar(actorDe(req), cuerpo, contextoDe(req));
  }

  /** API-MFA-03. */
  @Post('recovery-code')
  @HttpCode(200)
  usarCodigoDeRecuperacion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<SegundoFactorDeLaSesionVerificadoResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.usarCodigoDeRecuperacion(actorDe(req), cuerpo, contextoDe(req));
  }

  /** API-MFA-04. */
  @Post('enrollment')
  @HttpCode(200)
  iniciarConfiguracion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ConfiguracionDelAutenticadorResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.iniciarConfiguracion(actorDe(req), cuerpo, contextoDe(req));
  }

  /** API-MFA-05. */
  @Post('enrollment/confirm')
  @HttpCode(200)
  confirmarConfiguracion(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ConfiguracionDeLaSesionConfirmadaResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.confirmarConfiguracion(actorDe(req), cuerpo, contextoDe(req));
  }

  /** API-MFA-06. */
  @Post('recovery-codes')
  @HttpCode(200)
  regenerarCodigos(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<CodigosDeRecuperacionResponse> {
    sinParametrosDeQuery(query);
    return this.segundoFactor.regenerarCodigos(actorDe(req), cuerpo, contextoDe(req));
  }
}
