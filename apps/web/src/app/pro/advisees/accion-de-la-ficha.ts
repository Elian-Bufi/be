/**
 * La acción principal del encabezado de la ficha (bloque 5 del encargo de consolidación, 2026-10-19): una sola, según el
 * momento de la persona en las áreas que el profesional puede leer.
 * 1. Una revisión acordada vencida o de los próximos siete días: «Preparar la revisión de …». La fecha la fijó el
 *    profesional; BE no decide qué es urgente.
 * 2. Un plan en borrador: «Seguir el borrador».
 * 3. Un área sin plan vigente ni borrador: «Empezar el plan».
 * Con todo al día, ninguna: la ficha no inventa una urgencia. Una ficha nueva, una con borrador y una con plan vigente
 * ofrecen así caminos distintos y previsibles; las tarjetas del Resumen siguen teniendo los suyos.
 */
import type { DashboardResponse } from '@be/domain';

export type AreaDeLaAccion = 'NUTRICION' | 'ENTRENAMIENTO';

export interface AccionDeLaFicha {
  readonly tipo: 'revisar' | 'borrador' | 'empezar';
  readonly area: AreaDeLaAccion;
  readonly texto: string;
  /** La sección del área a la que lleva. */
  readonly vista: 'revisiones' | 'plan';
  /** Lo que se suma a la dirección: `&preparar=1` abre el formulario de la revisión. */
  readonly extra: string;
}

const NOMBRE: Readonly<Record<AreaDeLaAccion, string>> = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento' };
const RUTA_DEL_AREA: Readonly<Record<AreaDeLaAccion, string>> = { NUTRICION: 'nutrition', ENTRENAMIENTO: 'training' };

/** La dirección de la acción, sin el retorno (lo suma quien arma el enlace). */
export const rutaDeLaAccion = (a: AccionDeLaFicha, asesoradoId: string): string =>
  `/pro/advisees/${RUTA_DEL_AREA[a.area]}?id=${encodeURIComponent(asesoradoId)}&vista=${a.vista}${a.extra}`;
const DIAS_DE_ANTICIPACION = 7;
const dias = (desde: string, hasta: string): number => Math.round((Date.parse(`${hasta.slice(0, 10)}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);

type Dominios = DashboardResponse['data']['domains'];

export function accionDeLaFicha(dominios: Dominios, hoy: string): AccionDeLaFicha | null {
  const legibles = (
    [
      ['NUTRICION', dominios.nutrition],
      ['ENTRENAMIENTO', dominios.training],
    ] as const
  ).flatMap(([area, d]) => (d.available && d.summary ? [{ area, resumen: d.summary }] : []));
  // Con dos áreas, el texto dice de cuál es; con una, no hace falta.
  const deCual = (area: AreaDeLaAccion) => (legibles.length > 1 ? ` de ${NOMBRE[area]}` : '');

  const revisiones = legibles
    .flatMap(({ area, resumen }) => {
      const fecha = resumen.activePlan?.nextReviewAt ?? null;
      return fecha && dias(hoy, fecha) <= DIAS_DE_ANTICIPACION ? [{ area, fecha }] : [];
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const revision = revisiones[0];
  if (revision) return { tipo: 'revisar', area: revision.area, texto: `Preparar la revisión de ${NOMBRE[revision.area]}`, vista: 'revisiones', extra: '&preparar=1' };

  const borrador = legibles.find(({ resumen }) => resumen.draftPlan);
  if (borrador) return { tipo: 'borrador', area: borrador.area, texto: `Seguir el borrador${deCual(borrador.area)}`, vista: 'plan', extra: '' };

  const sinPlan = legibles.find(({ resumen }) => !resumen.activePlan);
  if (sinPlan) return { tipo: 'empezar', area: sinPlan.area, texto: `Empezar el plan${deCual(sinPlan.area)}`, vista: 'plan', extra: '' };
  return null;
}
