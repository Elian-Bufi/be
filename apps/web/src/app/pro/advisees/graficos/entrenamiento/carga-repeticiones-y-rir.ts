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
 * - El RIR indicado sale del comparador (GR-T14), con `puntosDeLoIndicado` de la base: la prescripción de la versión que
 *   rigió esa sesión, hueca y en la fecha y la hora de la sesión.
 * - Con la pasada visual: cada carril es de un punto por sesión (`porSesion`), así la marca se ve sobre la línea.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { DETALLE_DE_SERIE, esPuntoDeCargaRapida, numero, serieDisponible, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';
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

export interface SeriesDeLaSerie {
  readonly carga: SerieAnalitica | null;
  readonly repeticiones: SerieAnalitica | null;
  readonly rir: SerieAnalitica | null;
}

const conValor = (s: SerieAnalitica | null): number => (s ? s.points.filter((p) => p.value !== null).length : 0);

/**
 * La tira de un panel de GR-03, una marca por sesión (con la pasada visual: «Cada sesión» en la leyenda): lo que ya dice
 * el carril y, además, una raya baja en cada sesión sin el dato: un punto sin valor (un RIR sin escribir no es 0) o, en
 * el panel del RIR, una sesión con el RIR indicado y sin registrar. Una sesión con el dato sigue entera.
 */
export function coberturaPorSesion(c: Pick<CarrilDePuntos, 'cobertura' | 'puntos'>, sinDato: readonly string[] = []): CarrilDePuntos['cobertura'] {
  const estados = new Map(c.cobertura.map((d) => [d.fecha, d.estado] as const));
  for (const fecha of [...c.puntos.filter((p) => p.valor === null).map((p) => p.fecha), ...sinDato]) if (!estados.has(fecha)) estados.set(fecha, 'sin');
  return [...estados.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([fecha, estado]) => ({ fecha, estado }));
}

/**
 * Lo indicado solo de las sesiones en las que se hizo el ejercicio (`ejecucionesConElEjercicio`): una sesión «no
 * realizada», o con el ejercicio del plan sin registrar, no tiene un RIR indicado que leer contra nada (revisión del 15/11).
 * La clave de un punto de lo indicado es la de la base: `indicado:<ejecución>:<prescripción>:<serie>`.
 */
export function indicadoDeLasSesionesHechas(indicado: readonly PuntoDelCarril[], hechas: ReadonlySet<string>): PuntoDelCarril[] {
  return indicado.filter((p) => hechas.has(p.clave.split(':')[1] ?? ''));
}

/**
 * Los tres carriles de GR-03, en este orden: la carga (en la unidad de la serie), las repeticiones y el RIR, con el RIR
 * indicado hueco en su panel. `cargadoTarde`: las fechas con la sesión cargada en un día posterior.
 *
 * `sesiones` (revisión del 15/11): las fechas de las sesiones en las que se hizo el ejercicio. Las tres tiras marcan las
 * mismas sesiones, cada una con su raya baja donde a su panel le falta el dato: antes solo la del RIR marcaba la sesión
 * sin series escritas, y en la carga y las repeticiones la línea se cortaba sin que la tira dijera por qué.
 */
export function carrilesDeCargaRepeticionesYRir(
  s: SeriesDeLaSerie,
  o: { readonly serie: number; readonly indicado: readonly PuntoDelCarril[]; readonly cargadoTarde: ReadonlySet<string>; readonly sesiones?: readonly string[] },
): CarrilDePuntos[] {
  const carriles: CarrilDePuntos[] = [];
  const sesiones = o.sesiones ?? [];
  const porSesion = (c: CarrilDePuntos, sinDato: readonly string[] = sesiones): CarrilDePuntos => ({ ...c, porSesion: true, cobertura: coberturaPorSesion(c, sinDato) });
  const carga = s.carga ? serieDisponible('entrenamiento.carga', s.carga.unit) : null;
  if (s.carga && carga) {
    carriles.push(
      porSesion(carrilDeSerie(s.carga, carga, {
        id: 'carga',
        nombre: C.carga(o.serie),
        indice: 0,
        metodo: null,
        escala: ESCALA_DE_LA_CARGA,
        descripcion: C.descripcion(conValor(s.carga), o.serie),
        lectura: lecturaDeLaCarga(s.carga.unit),
        cargadoTarde: o.cargadoTarde,
      })),
    );
  }
  const repeticiones = serieDisponible('entrenamiento.repeticiones');
  if (s.repeticiones && repeticiones) {
    carriles.push(
      porSesion(carrilDeSerie(s.repeticiones, repeticiones, {
        id: 'repeticiones',
        nombre: C.repeticiones(o.serie),
        indice: 1,
        metodo: null,
        escala: ESCALA_DE_LAS_REPETICIONES,
        descripcion: C.descripcion(conValor(s.repeticiones), o.serie),
        lectura: lecturaDeLasRepeticiones,
        cargadoTarde: o.cargadoTarde,
      })),
    );
  }
  const rir = serieDisponible('entrenamiento.rir');
  if (s.rir && rir) {
    carriles.push(
      porSesion(carrilDeSerie(s.rir, rir, {
        id: 'rir',
        nombre: C.rir(o.serie),
        indice: 2,
        metodo: null,
        escala: ESCALA_DEL_RIR,
        descripcion: C.descripcion(conValor(s.rir), o.serie),
        lectura: lecturaDelRir,
        cargadoTarde: o.cargadoTarde,
        indicado: o.indicado,
      }), [...sesiones, ...o.indicado.map((p) => p.fecha)]),
    );
  }
  return carriles;
}
