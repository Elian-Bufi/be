import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { CuerpoDelContextoResponse, RespuestasDelContextoResponse } from '@be/domain';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ContextoDeLaPersonaService } from './contexto-de-la-persona.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179) · API-CTX-01 y 02. Ningún handler decide autorización: el servicio decide con el PDP
 * dentro de su transacción. Las dos son lecturas de datos de salud: consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class ContextoDeLaPersonaController {
  constructor(
    private readonly contexto: ContextoDeLaPersonaService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-CTX-01: las respuestas vigentes a las Solicitudes propias, de las áreas con el PDP permitido. */
  @Get('advisees/:adviseeId/person-context/answers')
  respuestas(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<RespuestasDelContextoResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.contexto.respuestas(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-CTX-02: la última toma y la anterior, enteras por el área propia o el peso y la composición por el resumen compartido. */
  @Get('advisees/:adviseeId/person-context/body')
  cuerpo(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<CuerpoDelContextoResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.contexto.cuerpo(actorDe(req), adviseeId, query, contextoDe(req));
  }
}
