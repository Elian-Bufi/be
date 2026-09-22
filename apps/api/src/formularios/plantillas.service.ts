import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { plantillaApi, versionDePlantillaApi } from './lectura-formularios';

/**
 * API-FRM-01 y API-FRM-02 — el catálogo BE de plantillas (09v16.1 §22.1 y §22.2; D-D).
 *
 * Son **metadatos** igual que los métodos de WP-05 (09:1461): no aceptan `adviseeId`, no dependen de ningún dato
 * personal para decidir qué listar, y una plantilla listada no prueba que todos sus campos puedan solicitarse a un
 * asesorado concreto — esa pertinencia se evalúa recién en FRM-03. Por eso acá no hay PDP: solo sesión.
 */
@Injectable()
export class PlantillasService {
  constructor(private readonly ejecutor: EjecutorDeFormularios) {}

  // ─── API-FRM-01 · listar ────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, {
      domain: ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'],
      status: ['SELECTABLE', 'HISTORICAL_NOT_SELECTABLE'],
    });
    return this.ejecutor.leer({
      operacion: 'API-FRM-01',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx: Prisma.TransactionClient) => {
        // Solo la versión terminal (seleccionable) de cada plantilla, salvo que se pida explícitamente la histórica:
        // el 09 no da un filtro para eso, así que se lista lo seleccionable, como el resto de los catálogos.
        const filas = await tx.plantillaDeFormulario.findMany({
          where: { versiones: { some: { sucesora: null } }, ...despuesDelCursor(consulta.cursor) },
          include: { versiones: { where: { sucesora: null }, include: { sucesora: { select: { id: true } } } } },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const plantillas = pagina.flatMap((p) => {
          const ultima = p.versiones[0];
          if (!ultima) return [];
          if (consulta.filtros.domain && ultima.dominio !== consulta.filtros.domain) return [];
          if (consulta.filtros.status && consulta.filtros.status !== 'SELECTABLE') return [];
          return [plantillaApi(p, ultima)];
        });
        return { data: plantillas, page };
      },
    });
  }

  // ─── API-FRM-02 · consultar la versión exacta ──────────────────────────────────────────────
  /** Devuelve la versión pedida, seleccionable o histórica: no devuelve datos personales (09:1479). */
  consultar(actor: ActorAutenticado, templateId: string, versionId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    return this.ejecutor.leer({
      operacion: 'API-FRM-02',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: { tipo: 'VersionDePlantillaDeFormulario', id: versionId },
      lectura: async (tx: Prisma.TransactionClient) => {
        const v =
          esUuid(templateId) && esUuid(versionId)
            ? await tx.versionDePlantillaDeFormulario.findFirst({
                where: { id: versionId, plantillaId: templateId },
                include: { plantilla: true, sucesora: { select: { id: true } } },
              })
            : null;
        if (!v) throw errores.recursoNoEncontrado();
        return { data: versionDePlantillaApi(v) };
      },
    });
  }
}
