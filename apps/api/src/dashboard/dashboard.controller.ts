import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CLAVE_DE_DOMINIO, type DashboardResponse } from '@be/domain';
import { decisionesDe, OperacionProtegida, PdpGuard, type SolicitudAutorizada } from '../autorizacion/pdp.guard';
import { errores } from '../http/errores';
import { SesionGuard } from '../sesion/sesion.guard';
import { nombreDeAsesorado } from '../vinculo/lectura';

type EntradaDeDominio = DashboardResponse['data']['domains']['nutrition'];

/**
 * API-DSH-03 mínimo (09v11 §15; DEUDA_LEGAJO DL-031): el recurso protegido con el que WP-03 demuestra el acceso sin
 * dominios de salud.
 * - `SesionGuard` autentica y `PdpGuard` decide por alcance y registra cada decisión.
 * - Este controlador no decide nada: muestra disponible solo lo que el PDP permitió, con los hechos que el PDP leyó.
 * - Sin ningún alcance permitido, el guard ya respondió 404, idéntico a un asesorado inexistente.
 * - Los resúmenes por dominio llegan con WP-04. Mientras tanto, `summary: null` muestra el faltante «como tal» (RF-053).
 */
@Controller()
export class DashboardController {
  @Get('advisees/:adviseeId/dashboard')
  @UseGuards(SesionGuard, PdpGuard)
  @OperacionProtegida({ operacion: 'API-DSH-03', parametroDelTitular: 'adviseeId' })
  consultar(@Param('adviseeId') _adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: SolicitudAutorizada): DashboardResponse {
    // Después del PDP (09:213-233): la query solo se valida sobre un recurso ya revelable.
    const periodo = leerPeriodo(query);
    const decisiones = decisionesDe(req);
    const titularId = decisiones.titularId as string;
    const dominios = Object.fromEntries(
      decisiones.porAlcance.map(({ alcance, decision }) => [
        CLAVE_DE_DOMINIO[alcance],
        decision.permitida
          ? ({ available: true, relationshipId: decision.alcanceDeVinculoId, summary: null } satisfies EntradaDeDominio)
          : ({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' } satisfies EntradaDeDominio),
      ]),
    ) as DashboardResponse['data']['domains'];
    return {
      data: {
        advisee: { identityId: titularId, displayName: nombreDeAsesorado(titularId) },
        period: periodo,
        partialView: decisiones.porAlcance.some((d) => !d.decision.permitida),
        domains: dominios,
      },
    };
  }
}

function leerPeriodo(query: Record<string, unknown>): { start: string | null; end: string | null } {
  const permitidos = new Set(['periodStart', 'periodEnd']);
  const desconocidos = Object.keys(query ?? {}).filter((k) => !permitidos.has(k));
  if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
  const leer = (clave: string): string | null => {
    const valor = query[clave];
    if (valor === undefined) return null;
    const fecha = typeof valor === 'string' ? new Date(valor) : null;
    if (!fecha || Number.isNaN(fecha.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(valor as string)) {
      throw errores.solicitudInvalida([{ code: 'INVALID_DATE_TIME', path: clave }]);
    }
    return fecha.toISOString();
  };
  return { start: leer('periodStart'), end: leer('periodEnd') };
}
