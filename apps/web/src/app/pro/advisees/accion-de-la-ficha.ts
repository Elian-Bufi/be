/**
 * La acción principal del encabezado de la ficha (bloque 5 del encargo de consolidación, 2026-10-19): una sola, según el
 * momento de la persona en las áreas que el profesional puede leer. WP-TABLERO-ALTA-GAMA TB-09 la encadena en el orden en
 * que se cierra un ciclo, porque cada eslabón deja sin sentido a los que siguen:
 * 1. **Aplicar:** una revisión registrada y sin aplicar (`lastReview.application` en `null`): «Aplicar la revisión de …».
 *    Lleva a esa revisión en la lista de Revisiones, con su «Aplicar» a la vista; llegar no aplica nada. Antes, una
 *    revisión vencida y sin aplicar ofrecía preparar otra (el caso de Federico Álvarez en la cohorte).
 * 2. **La revisión acordada,** vencida o de los próximos siete días, si todavía no se hizo: «Preparar la revisión de …»,
 *    que abre la revisión nueva ya preparada (`preparar=1`, con el período desde la última). La fecha la fijó el
 *    profesional; BE no decide qué es urgente. Una revisión registrada desde siete días antes de esa fecha es la de esa
 *    fecha (TA-13): aplicada, la fecha que queda en el plan vigente es de un ciclo ya revisado, y lo que sigue es su
 *    borrador, o nada (D-6: «no sigue como vencida»).
 * 3. **Un plan en borrador:** «Seguir el borrador».
 * 4. **Un área sin plan vigente ni borrador:** «Empezar el plan».
 * Con todo al día, ninguna: la ficha no inventa una urgencia. Las tarjetas del Resumen siguen teniendo las suyas.
 * Un área legible sin ningún dato todavía llega con el resumen en `null` (el tablero no inventa ceros): para la ficha es
 * un área sin plan, y la acción es empezarlo (lo encontró el recorrido de navegador `primerPlan`).
 */
import type { DashboardResponse } from '@be/domain';

export type AreaDeLaAccion = 'NUTRICION' | 'ENTRENAMIENTO';

export interface AccionDeLaFicha {
  readonly tipo: 'aplicar' | 'revisar' | 'borrador' | 'empezar';
  readonly area: AreaDeLaAccion;
  readonly texto: string;
  /** La sección del área a la que lleva. */
  readonly vista: 'revisiones' | 'plan';
  /** Lo que se suma a la dirección: `&preparar=1` abre la revisión nueva; `&revision=…`, la registrada sin aplicar. */
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
  ).flatMap(([area, d]) => (d.available ? [{ area, resumen: d.summary }] : []));
  // Con dos áreas, el texto dice de cuál es; con una, no hace falta.
  const deCual = (area: AreaDeLaAccion) => (legibles.length > 1 ? ` de ${NOMBRE[area]}` : '');

  // 1. Registrar no es aplicar: la que espera hace más tiempo, primero.
  const sinAplicar = legibles
    .flatMap(({ area, resumen }) => (resumen?.lastReview && resumen.lastReview.application === null ? [{ area, revision: resumen.lastReview }] : []))
    .sort((a, b) => a.revision.recordedAt.localeCompare(b.revision.recordedAt))[0];
  if (sinAplicar) return { tipo: 'aplicar', area: sinAplicar.area, texto: `Aplicar la revisión de ${NOMBRE[sinAplicar.area]}`, vista: 'revisiones', extra: `&revision=${encodeURIComponent(sinAplicar.revision.reviewId)}` };

  // 2. La revisión acordada más cercana, vencida o de los próximos siete días, que todavía no se hizo.
  const revisiones = legibles
    .flatMap(({ area, resumen }) => {
      const fecha = resumen?.activePlan?.nextReviewAt ?? null;
      const hecha = resumen?.lastReview ? dias(resumen.lastReview.recordedAt.slice(0, 10), fecha ?? '') <= DIAS_DE_ANTICIPACION : false;
      return fecha && !hecha && dias(hoy, fecha) <= DIAS_DE_ANTICIPACION ? [{ area, fecha }] : [];
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const revision = revisiones[0];
  if (revision) return { tipo: 'revisar', area: revision.area, texto: `Preparar la revisión de ${NOMBRE[revision.area]}`, vista: 'revisiones', extra: '&preparar=1' };

  // 3. Un borrador sin activar.
  const borrador = legibles.find(({ resumen }) => resumen?.draftPlan);
  if (borrador) return { tipo: 'borrador', area: borrador.area, texto: `Seguir el borrador${deCual(borrador.area)}`, vista: 'plan', extra: '' };

  // 4. Un área sin plan vigente.
  const sinPlan = legibles.find(({ resumen }) => !resumen?.activePlan);
  if (sinPlan) return { tipo: 'empezar', area: sinPlan.area, texto: `Empezar el plan${deCual(sinPlan.area)}`, vista: 'plan', extra: '' };
  return null;
}
