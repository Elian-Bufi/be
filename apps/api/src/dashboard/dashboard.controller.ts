import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { CLAVE_DE_DOMINIO, type DashboardResponse } from '@be/domain';
import { decisionesDe, OperacionProtegida, PdpGuard, type SolicitudAutorizada } from '../autorizacion/pdp.guard';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import { ProcesoService } from '../proceso/proceso.service';
import { actorDe, SesionGuard } from '../sesion/sesion.guard';
import { nombreDeAsesorado } from '../vinculo/lectura';
import { resumenDeAntropometria, resumenDeEntrenamiento, resumenDeNutricion, type Periodo } from './lectura-dashboard';

/**
 * API-DSH-03 — Dashboard interdisciplinario (09v11 §15; DEUDA_LEGAJO DL-031, condición de cierre).
 * - `SesionGuard` autentica y `PdpGuard` decide por alcance y registra cada decisión.
 * - Este controlador no decide nada: muestra disponible solo lo que el PDP permitió, y pide el resumen **únicamente**
 *   de esos alcances. Un dominio denegado no aporta ni un dato, ni siquiera un conteo, al resumen de otro.
 * - Sin ningún alcance permitido, el guard ya respondió 404, idéntico a un asesorado inexistente.
 * - El resumen es composición de read models, no mezcla semántica (B10-08 §8.3): nada se agrega entre dominios y no
 *   existe ningún score, semáforo ni «estado general» (09v11 §15, regla crítica; B10-08 §10).
 * - `summary: null` con `available: true` es «sin datos todavía», que es un hecho y se muestra como tal (RF-053).
 * - Lo que este dashboard no trae —cola de revisiones, próximas acciones y disponibilidad de proyecciones— pertenece a
 *   B10-08 §6, §13 y B10-09, que quedan fuera de la entrega por la decisión de alcance del 2026-09-22.
 */
@Controller()
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly procesos: ProcesoService,
  ) {}

  @Get('advisees/:adviseeId/dashboard')
  @UseGuards(SesionGuard, PdpGuard)
  @OperacionProtegida({ operacion: 'API-DSH-03', parametroDelTitular: 'adviseeId', validarConsulta: leerPeriodo })
  async consultar(@Param('adviseeId') _adviseeId: string, @Req() req: SolicitudAutorizada): Promise<DashboardResponse> {
    // La query ya se validó en el guard, antes del PDP (09 §3: schema y payload primero).
    const periodo = req.consultaValidada as Periodo;
    const decisiones = decisionesDe(req);
    const titularId = decisiones.titularId as string;
    const profesionalId = actorDe(req).identidadId;

    // Una sola transacción de lectura para los tres resúmenes: el dashboard es una foto, no tres fotos de momentos
    // distintos. El PDP ya decidió antes de entrar acá, en su propia transacción.
    const dominios = await this.prisma.$transaction(async (tx) => {
      const entradas = await Promise.all(
        decisiones.porAlcance.map(async ({ alcance, decision }) => {
          if (!decision.permitida) return [CLAVE_DE_DOMINIO[alcance], { available: false as const, reason: 'NOT_AVAILABLE_TO_VIEW' as const }] as const;
          const summary =
            alcance === 'NUTRICION'
              ? await resumenDeNutricion(tx, this.procesos, profesionalId, titularId, periodo)
              : alcance === 'ENTRENAMIENTO'
                ? await resumenDeEntrenamiento(tx, this.procesos, profesionalId, titularId, periodo)
                : await resumenDeAntropometria(tx, profesionalId, titularId, periodo);
          return [CLAVE_DE_DOMINIO[alcance], { available: true as const, relationshipId: decision.alcanceDeVinculoId, summary }] as const;
        }),
      );
      return Object.fromEntries(entradas) as DashboardResponse['data']['domains'];
    });

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

function leerPeriodo(query: Record<string, unknown>): Periodo {
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
