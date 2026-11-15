import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type NotasDeLasSesionesResponse, type NotasDeUnaSesionResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { NotasDeLaSesionService } from './notas-de-la-sesion.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-PULIDO-GRANDES PG-15 (DL-173; PG-D10) · API-TRN-25 y sus dos lecturas. Como el resto de la familia TRN, ningún
 * handler decide autorización: el servicio la decide con el PDP dentro de su transacción. Las lecturas consumen el límite
 * de consultas protegidas del actor, como las de la ejecución (API-TRN-19).
 */
@Controller()
@UseGuards(SesionGuard)
export class NotasDeLaSesionController {
  constructor(
    private readonly notas: NotasDeLaSesionService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-TRN-25: la persona agrega una nota a una sesión suya ya registrada. Idempotency-Key requerida. */
  @Post('training/executions/:executionId/notes')
  async agregar(
    @Param('executionId') executionId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const resultado = await this.notas.agregar(actorDe(req), executionId, cuerpo, clave, contextoDe(req));
    res.status(resultado.estadoHttp);
    return resultado.cuerpo;
  }

  /** API-TRN-25-PROPIA: las notas de una sesión propia. */
  @Get('me/training/executions/:executionId/notes')
  propias(@Param('executionId') executionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<NotasDeUnaSesionResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.notas.propias(actorDe(req), executionId, query, contextoDe(req));
  }

  /** API-TRN-25-LISTA: las notas de las sesiones que el profesional de Entrenamiento ya ve, por período. */
  @Get('advisees/:adviseeId/training/execution-notes')
  delProfesional(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<NotasDeLasSesionesResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.notas.delProfesional(actorDe(req), adviseeId, query, contextoDe(req));
  }
}
