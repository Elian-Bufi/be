/**
 * El reloj del profesional (WP-TABLERO-ALTA-GAMA TB-10; DL-163 D-1): el tramo del ciclo de revisión de cada área, de la
 * última revisión (o de la activación del plan vigente) a la fecha que acordó el profesional.
 *
 * - **La barra se llena solo con el calendario del profesional.** Lo que entra son fechas y actos suyos (activar un
 *   plan, registrar una revisión, acordar la próxima), nunca registros de la persona: con las mismas fechas, el tramo es
 *   el mismo, registre lo que registre (TEST-TAG-001, una prueba de propiedad en `apps/web/test/tarjetas-del-resumen`).
 * - **Sin fecha acordada no hay barra:** queda el hecho, en palabras.
 * - **Al vencer, la pista sigue en discontinua neutra y lo dice** («vencida hace 4 días»), sin color nuevo, sin «%» y
 *   sin «te faltan». Lo vencido ocupa como mucho la cuarta parte del ancho (anexo A10 de la propuesta).
 * - **Para el lector de pantalla, una frase** (`aria-valuetext`), sin porcentajes (TEST-TAG-002).
 * - **Una revisión hecha para la fecha acordada cierra ese ciclo** (TA-13): la fecha que queda en el plan vigente no
 *   vuelve a correr como vencida.
 *
 * Vive en el website hasta la candidata de la APK (§8.2 del paquete), como `retrato.ts`.
 */
import { diasEntreFechas, fechaCivil, type ResumenDeEntrenamiento, type ResumenDeNutricion } from '@be/domain';

/** La zona de las fechas civiles de BE. */
const ZONA = 'America/Argentina/Buenos_Aires';

/** Lo vencido ocupa, como mucho, esta parte del ancho del tramo (A10). */
export const TOPE_DE_LO_VENCIDO = 0.25;

/** TA-13: una revisión registrada desde siete días antes de la fecha acordada es la de esa fecha. */
const DIAS_DE_LA_REVISION_DE_LA_FECHA = 7;

/**
 * Dónde está hoy entre el inicio del ciclo y la fecha acordada. Las posiciones van de 0 a 1 sobre el ancho del tramo.
 * - `EN_CURSO`: hoy está entre el inicio y la fecha acordada (incluida); la fecha acordada está al final.
 * - `VENCIDO`: hoy pasó la fecha acordada; hoy está al final y la fecha acordada, antes, con lo vencido en discontinua.
 */
export type AvanceDelReloj =
  | { readonly tipo: 'EN_CURSO'; readonly total: number; readonly transcurridos: number; readonly posicionDeHoy: number; readonly posicionDeLaAcordada: 1 }
  | { readonly tipo: 'VENCIDO'; readonly total: number; readonly vencidoHace: number; readonly posicionDeHoy: 1; readonly posicionDeLaAcordada: number };

/** El avance de un ciclo, en días enteros: solo con tres fechas civiles. */
export function avanceDelReloj(inicio: string, acordada: string, hoy: string): AvanceDelReloj {
  const total = Math.max(0, diasEntreFechas(inicio, acordada));
  if (hoy <= acordada) {
    const transcurridos = Math.min(total, Math.max(0, diasEntreFechas(inicio, hoy)));
    return { tipo: 'EN_CURSO', total, transcurridos, posicionDeHoy: total === 0 ? 1 : transcurridos / total, posicionDeLaAcordada: 1 };
  }
  const vencidoHace = diasEntreFechas(acordada, hoy);
  const vencida = Math.min(TOPE_DE_LO_VENCIDO, vencidoHace / (total + vencidoHace));
  return { tipo: 'VENCIDO', total, vencidoHace, posicionDeHoy: 1, posicionDeLaAcordada: 1 - vencida };
}

/** La última revisión del área, como la ve el reloj: su día y si ya se aplicó. */
export interface RevisionDelReloj {
  readonly dia: string;
  readonly aplicada: boolean;
}

/**
 * El ciclo de un área con plan vigente, listo para dibujar.
 * - `SIN_FECHA`: el plan no tiene una revisión acordada. No hay barra.
 * - `REVISADA`: la revisión de la fecha acordada ya se registró (TA-13). No hay barra: si falta aplicarla, lo dice el
 *   pendiente de la tarjeta.
 * - `RELOJ`: el tramo, desde la última revisión o, si es anterior al plan vigente, desde su activación (TA-17).
 */
export type TramoDelCiclo =
  | { readonly tipo: 'SIN_FECHA'; readonly revision: RevisionDelReloj | null }
  | { readonly tipo: 'REVISADA'; readonly revision: RevisionDelReloj }
  | { readonly tipo: 'RELOJ'; readonly inicio: string; readonly desde: 'REVISION' | 'PLAN'; readonly acordada: string; readonly avance: AvanceDelReloj };

/**
 * El tramo del ciclo de un área, del resumen de API-DSH-03. Lee solo fechas del profesional: la activación del plan
 * vigente, la fecha acordada y la última revisión (cuándo se registró y si se aplicó). Nada de lo que registra la persona
 * (`registeredIntakes`, `lastIntakeAt`, las ejecuciones) entra acá. `null` sin plan vigente: no hay ciclo.
 */
export function tramoDelCiclo(resumen: ResumenDeNutricion | ResumenDeEntrenamiento | null, hoy: string): TramoDelCiclo | null {
  const plan = resumen?.activePlan;
  if (!resumen || !plan) return null;
  const revision: RevisionDelReloj | null = resumen.lastReview ? { dia: fechaCivil(resumen.lastReview.recordedAt, ZONA), aplicada: resumen.lastReview.application !== null } : null;
  const acordada = plan.nextReviewAt ? plan.nextReviewAt.slice(0, 10) : null;
  if (!acordada) return { tipo: 'SIN_FECHA', revision };
  if (revision && diasEntreFechas(revision.dia, acordada) <= DIAS_DE_LA_REVISION_DE_LA_FECHA) return { tipo: 'REVISADA', revision };
  const activado = fechaCivil(plan.activatedAt, ZONA);
  const desdeLaRevision = revision !== null && revision.dia >= activado;
  const inicio = desdeLaRevision ? revision.dia : activado;
  return { tipo: 'RELOJ', inicio, desde: desdeLaRevision ? 'REVISION' : 'PLAN', acordada, avance: avanceDelReloj(inicio, acordada, hoy) };
}

/** Cómo escribe las fechas quien dibuja el tramo: el día («16 nov», con el año si no es el actual) y su día de la semana. */
export interface FormatoDelReloj {
  readonly fecha: (civil: string) => string;
  readonly diaDeLaSemana: (civil: string) => string;
}

/** Los textos del tramo: el título, su detalle, los rótulos de las puntas y la frase para el lector de pantalla. */
export interface TextosDelTramo {
  readonly titulo: string;
  readonly detalle: string | null;
  readonly inicio: string | null;
  readonly fin: string | null;
  /** La frase del `aria-valuetext`: en palabras, sin «%» ni «por ciento». `null` si no hay barra. */
  readonly enPalabras: string | null;
}

const dias = (n: number): string => (n === 1 ? '1 día' : `${n} días`);

/** «en 10 días», «mañana», «hoy»: cuánto falta para la fecha acordada, como un hecho del calendario. */
function cuandoEs(n: number): string {
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  return `en ${dias(n)}`;
}

export function textosDelTramo(t: TramoDelCiclo, f: FormatoDelReloj, hoy: string): TextosDelTramo {
  switch (t.tipo) {
    case 'SIN_FECHA':
      return { titulo: 'Sin revisión acordada', detalle: null, inicio: null, fin: null, enPalabras: null };
    case 'REVISADA':
      return { titulo: 'Sin otra revisión acordada', detalle: `después de la del ${f.fecha(t.revision.dia)}`, inicio: null, fin: null, enPalabras: null };
    case 'RELOJ': {
      const conSemana = `${f.diaDeLaSemana(t.acordada)} ${f.fecha(t.acordada)}`;
      const desde = t.desde === 'REVISION' ? `desde la revisión del ${f.fecha(t.inicio)}` : `desde que rige el plan, el ${f.fecha(t.inicio)}`;
      const acordados = (total: number) => (total === 1 ? 'el día acordado' : `los ${total} días acordados`);
      if (t.avance.tipo === 'EN_CURSO') {
        const faltan = diasEntreFechas(hoy, t.acordada);
        const { total, transcurridos } = t.avance;
        return {
          titulo: `Próxima revisión: ${conSemana}`,
          detalle: cuandoEs(faltan),
          inicio: f.fecha(t.inicio),
          fin: f.fecha(t.acordada),
          enPalabras:
            total === 0
              ? `La revisión está acordada para hoy, ${conSemana}, ${desde}`
              : `Pasaron ${transcurridos} de ${total === 1 ? '1 día acordado' : `los ${total} días acordados`}, ${desde} hasta la próxima, el ${conSemana}`,
        };
      }
      return {
        titulo: `Acordada para el ${conSemana}`,
        detalle: `vencida hace ${dias(t.avance.vencidoHace)}`,
        inicio: f.fecha(t.inicio),
        fin: 'hoy',
        enPalabras: `${t.avance.total === 0 ? 'Pasó la fecha acordada' : `Pasaron ${acordados(t.avance.total)}`} y ${dias(t.avance.vencidoHace)} más, ${desde}: la revisión estaba acordada para el ${conSemana}`,
      };
    }
  }
}
