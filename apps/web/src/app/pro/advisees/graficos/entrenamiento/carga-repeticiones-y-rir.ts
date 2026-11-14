/**
 * GR-03 · Carga, repeticiones y RIR de la misma serie, en tres paneles alineados (WP-GRAFICOS fase 2, rama B; DL-174;
 * B10-08 §23). Lo puro: los tres carriles, cada uno con su unidad y su escala, y el RIR indicado de cada sesión, hueco,
 * en el panel del RIR.
 *
 * - Sin doble eje: un panel por magnitud, con el mismo eje de fechas y la regla del cursor común.
 * - La serie del mismo número entre sesiones, sin promediar (la progresión por serie de API-PRJ-01).
 * - El eje del RIR va de 0 al máximo registrado, con 5 como mínimo: el contrato admite de 0 a 20, con decimales.
 * - Un RIR sin escribir no es 0: no es un punto, y la tabla dice «sin dato». Lo tildado sin escribir (carga rápida) son
 *   los valores del plan: va hueco y gris, nunca lleno (`marcaDelPunto`).
 * - El RIR indicado sale del comparador (GR-T14): la prescripción de la versión que rigió esa sesión.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { DETALLE_DE_SERIE, esPuntoDeCargaRapida, evolucion, numero, serieDisponible, type ObservacionDeEvolucion, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';
import { carrilDeSerie } from '../adaptadores';
import type { CarrilDePuntos, EscalaDelCarril, PuntoDelCarril } from '../carriles';
import { COPY_CARGA_REPETICIONES_Y_RIR as C } from './copy';

export const ESCALA_DE_LA_CARGA: EscalaDelCarril = { enteros: false };
export const ESCALA_DE_LAS_REPETICIONES: EscalaDelCarril = { enteros: true, desdeCero: true };
/** El RIR, de 0 al máximo registrado, con 5 como mínimo (GR-03). */
export const ESCALA_DEL_RIR: EscalaDelCarril = { enteros: true, desdeCero: true, minimoDelMaximo: 5 };

const SIN_DATO = 'sin dato';

/** Lo que se dice además del valor: la carga rápida, la corrección y, con dos sesiones el mismo día, cuál es. */
function conLoQueSeSabe(texto: string, p: PuntoAnalitico): string {
  const delDia = p.detail.find((d) => d.label === DETALLE_DE_SERIE.SESION_DEL_DIA)?.value ?? null;
  return [texto, ...(esPuntoDeCargaRapida(p) ? [C.cargaRapida] : []), ...(p.corrected ? [C.corregida] : []), ...(delDia ? [C.delDia(delDia)] : [])].join(' · ');
}

/** «80 kg», con lo que se sabe del punto. */
export const lecturaDeLaCarga =
  (unidad: string) =>
  (p: PuntoAnalitico): string =>
    conLoQueSeSabe(p.value === null ? SIN_DATO : `${numero(p.value)} ${unidad}`, p);

/** «8 repeticiones», con lo que se sabe del punto. */
export const lecturaDeLasRepeticiones = (p: PuntoAnalitico): string => conLoQueSeSabe(p.value === null ? SIN_DATO : C.repeticionesEnPalabras(numero(p.value), p.value === 1), p);

/** «RIR 1», con lo que se sabe del punto. */
export const lecturaDelRir = (p: PuntoAnalitico): string => conLoQueSeSabe(p.value === null ? SIN_DATO : C.rirEnPalabras(numero(p.value)), p);

/**
 * El RIR indicado de cada sesión para la serie elegida, como marca hueca (GR-03): lo que indicaba la versión que ejecutó
 * esa sesión. Un rango indicado («RIR 1 a 2») es un segmento hueco. Sin RIR indicado (o con otro ejercicio planificado),
 * no hay marca.
 */
export function rirIndicadoPorSesion(observaciones: readonly ObservacionDeEvolucion[], serie: number): PuntoDelCarril[] {
  return evolucion(observaciones, { variable: 'rir' }, serie).flatMap((p): PuntoDelCarril[] => {
    const c = p.observacion.comparacion;
    const base = { clave: `i:${c.executionId}:${c.prescriptionId}:${serie}`, fecha: c.fecha, hasta: null, en: c.ocurrio, tramo: `indicado-${p.tramoPlanificado ?? 0}`, marca: 'HUECA' as const, tarde: false };
    if (p.planificado.tipo === 'valor') return [{ ...base, valor: p.planificado.valor, rango: null, lectura: C.rirIndicadoEnPalabras(numero(p.planificado.valor), numero(p.planificado.valor)) }];
    if (p.planificado.tipo === 'rango') {
      return [{ ...base, valor: null, rango: { desde: p.planificado.min, hasta: p.planificado.max }, lectura: C.rirIndicadoEnPalabras(numero(p.planificado.min), numero(p.planificado.max)) }];
    }
    return [];
  });
}

export interface SeriesDeLaSerie {
  readonly carga: SerieAnalitica | null;
  readonly repeticiones: SerieAnalitica | null;
  readonly rir: SerieAnalitica | null;
}

const conValor = (s: SerieAnalitica | null): number => (s ? s.points.filter((p) => p.value !== null).length : 0);

/**
 * Los tres carriles de GR-03, en este orden: la carga (en la unidad de la serie), las repeticiones y el RIR, con el RIR
 * indicado hueco en su panel. `cargadoTarde`: las fechas con la sesión cargada en un día posterior.
 */
export function carrilesDeCargaRepeticionesYRir(s: SeriesDeLaSerie, o: { readonly serie: number; readonly indicado: readonly PuntoDelCarril[]; readonly cargadoTarde: ReadonlySet<string> }): CarrilDePuntos[] {
  const carriles: CarrilDePuntos[] = [];
  const carga = s.carga ? serieDisponible('entrenamiento.carga', s.carga.unit) : null;
  if (s.carga && carga) {
    carriles.push(
      carrilDeSerie(s.carga, carga, {
        id: 'carga',
        nombre: C.carga(o.serie),
        indice: 0,
        metodo: null,
        escala: ESCALA_DE_LA_CARGA,
        descripcion: C.descripcion(conValor(s.carga), o.serie),
        lectura: lecturaDeLaCarga(s.carga.unit),
        cargadoTarde: o.cargadoTarde,
      }),
    );
  }
  const repeticiones = serieDisponible('entrenamiento.repeticiones');
  if (s.repeticiones && repeticiones) {
    carriles.push(
      carrilDeSerie(s.repeticiones, repeticiones, {
        id: 'repeticiones',
        nombre: C.repeticiones(o.serie),
        indice: 1,
        metodo: null,
        escala: ESCALA_DE_LAS_REPETICIONES,
        descripcion: C.descripcion(conValor(s.repeticiones), o.serie),
        lectura: lecturaDeLasRepeticiones,
        cargadoTarde: o.cargadoTarde,
      }),
    );
  }
  const rir = serieDisponible('entrenamiento.rir');
  if (s.rir && rir) {
    carriles.push(
      carrilDeSerie(s.rir, rir, {
        id: 'rir',
        nombre: C.rir(o.serie),
        indice: 2,
        metodo: null,
        escala: ESCALA_DEL_RIR,
        descripcion: C.descripcion(conValor(s.rir), o.serie),
        lectura: lecturaDelRir,
        cargadoTarde: o.cargadoTarde,
        indicado: o.indicado,
      }),
    );
  }
  return carriles;
}
