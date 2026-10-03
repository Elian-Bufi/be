import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DominioDeCarteraSchema, esFechaCivil, TipoDePendienteSchema, type CarteraResponse } from '@be/domain';
import { PdpService } from '../autorizacion/pdp.service';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO } from '../http/paginacion';
import { LimitadorService } from '../plataforma/limitador.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProcesoService } from '../proceso/proceso.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { leerCartera, type ConsultaDeCartera } from './lectura-cartera';

/**
 * API-CAR-01 — Cartera del profesional (PF-07, propuesta del 2026-09-30; antes API-DSH-04, DL-116).
 * - `SesionGuard` autentica. No hay un titular en la ruta: el PDP decide por cada asesorado con vínculo vigente, dentro
 *   de la lectura, y registra cada decisión como en API-DSH-03.
 * - Es una lectura protegida: comparte el límite por actor de las demás (429 RATE_LIMITED).
 * - El controlador no decide nada: valida la consulta y delega en la lectura.
 */
@Controller()
export class CarteraController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdp: PdpService,
    private readonly procesos: ProcesoService,
    private readonly limitador: LimitadorService,
  ) {}

  @Get('me/portfolio')
  @UseGuards(SesionGuard)
  async consultar(@Query() query: Record<string, unknown>, @Req() req: SolicitudAutenticada & SolicitudConContexto): Promise<CarteraResponse> {
    const consulta = leerConsulta(query);
    const actor = actorDe(req);
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    return leerCartera(this.prisma, this.pdp, this.procesos, actor.identidadId, contextoDe(req), consulta);
  }
}

/** La query, validada antes de cualquier lectura (09 §3): parámetros conocidos, fechas RFC 3339, enumerados y límite. */
function leerConsulta(query: Record<string, unknown>): ConsultaDeCartera {
  const permitidos = new Set(['periodStart', 'periodEnd', 'domain', 'kind', 'limit', 'cursor']);
  const desconocidos = Object.keys(query ?? {}).filter((k) => !permitidos.has(k));
  if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
  // Fechas civiles, como en las lecturas por período de los dominios (API-ANT-06, API-TRN-21): el filtro del website las manda así.
  const fecha = (clave: string): string | null => {
    const valor = query[clave];
    if (valor === undefined) return null;
    if (!esFechaCivil(valor)) throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path: clave }]);
    return valor;
  };
  const enumerado = <T extends string>(clave: string, esquema: { safeParse: (v: unknown) => { success: boolean; data?: T } }): T | null => {
    if (query[clave] === undefined) return null;
    const r = esquema.safeParse(query[clave]);
    if (!r.success || r.data === undefined) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: clave }]);
    return r.data;
  };
  let limit = LIMITE_POR_DEFECTO;
  if (query.limit !== undefined) {
    const n = typeof query.limit === 'string' && /^\d{1,3}$/.test(query.limit) ? Number(query.limit) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > LIMITE_MAXIMO) throw errores.solicitudInvalida([{ code: 'INVALID_LIMIT', path: 'limit' }]);
    limit = n;
  }
  if (query.cursor !== undefined && typeof query.cursor !== 'string') throw errores.cursorInvalido();
  const periodo = { start: fecha('periodStart'), end: fecha('periodEnd') };
  if (periodo.start && periodo.end && periodo.start > periodo.end) throw errores.solicitudInvalida([{ code: 'INVALID_PERIOD', path: 'periodStart' }]);
  return {
    periodo,
    domain: enumerado('domain', DominioDeCarteraSchema),
    kind: enumerado('kind', TipoDePendienteSchema),
    limit,
    cursor: (query.cursor as string | undefined) ?? null,
  };
}
