import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type ListaDePlantillasDeBeResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { PlanesDeEntrenamientoService } from './planes.service';
import { PlantillasDeBeService } from './plantillas-de-be.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3) · las Plantillas de BE: leerlas (API-TPB-01) y empezar el plan de una persona
 * desde una (API-TPB-02). Ningún handler decide autorización: la deciden los servicios dentro de su transacción.
 */
@Controller()
@UseGuards(SesionGuard)
export class PlantillasDeBeController {
  constructor(
    private readonly plantillas: PlantillasDeBeService,
    private readonly planes: PlanesDeEntrenamientoService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-TPB-01: las Plantillas de BE que se ofrecen. */
  @Get('training/be-templates')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDePlantillasDeBeResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.plantillas.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-TPB-02: el borrador del plan de la persona desde una Plantilla de BE. Idempotency-Key requerida. */
  @Post('advisees/:adviseeId/training/plans/from-be-template')
  async crear(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.planes.crearDesdePlantillaDeBe(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }
}
