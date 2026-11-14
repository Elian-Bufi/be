/**
 * SP-01 · Carbohidratos registrados × 1RM estimado (Epley v1), el ejemplo de Dirección (WP-GRAFICOS fase 2, DL-174).
 * Solo en el caso 1: el mismo profesional con Nutrición y Entrenamiento y planes propios en las dos (`caso-de-acceso.ts`).
 *
 * - **Tres carriles alineados por fecha:** los carbohidratos por día (con lo que se sabe de cada día y el objetivo en
 *   escalón), las calorías registradas **al lado** (los carbohidratos solos casi no cambian la fuerza cuando la energía
 *   alcanza) y el 1RM estimado por sesión, lleno el núcleo, hueco lo orientativo y en rombo lo observado.
 * - **La ventana**, fijada antes de mirar: dos etapas seguidas del objetivo, de 3 semanas o más cada una (`ventanas.ts`).
 * - **El ruido antes que el cambio:** en la primera línea, lo que cambió en lo indicado del ejercicio; en cada etapa, la
 *   mediana del RIR registrado y el rango de repeticiones; y cuánto se mueve la estimación entre sesiones de una misma
 *   versión, sin «±», sin porcentaje y sin «primero → último».
 * - **Lo que también cambió** y **lo que BE no registra**, a la vista; y la frase de la coincidencia.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import {
  estimacionALaVista,
  lecturaPorVersion,
  numero,
  serieDisponible,
  valorConUnidad,
  type EscalonDelObjetivoApi,
  type ObjetivoDeLaSerie,
  type PuntoDeFuerza,
  type SerieAnalitica,
  type SerieDisponible,
  type VigenciaDePlan,
} from '@be/domain';
import { carrilDeSerie, puntosDeLaFuerza } from '../adaptadores';
import { escalaDeLaSerie, lecturaDelPunto } from '../arma-tu-grafico/compositor';
import type { BandaDeVersion, CarrilDePuntos, EscalonDelCarril } from '../carriles';
import { COPY_DE_LOS_CRUCES } from './copy';
import { cambiosDeLoIndicado, LO_QUE_BE_NO_REGISTRA, versionesQueSeActivaron } from './lo-que-tambien-cambio';
import { diasDeNutricion, diaYMes, elDiaAnterior, etapasDelObjetivo, mediana, ventanaDelObjetivo, type DiasDeLaVentana, type EtapaDelObjetivo, type VentanaDeDosEtapas } from './ventanas';

const C = COPY_DE_LOS_CRUCES.carbohidratosYFuerza;

/** Una serie del catálogo que tiene que estar: si falta, es un error de programación. */
export function delCatalogo(id: string): SerieDisponible {
  const s = serieDisponible(id);
  if (!s) throw new Error(`El catálogo de series no tiene ${id}`);
  return s;
}

export interface EntradaDeCarbohidratosYFuerza {
  /** Los carbohidratos registrados por día (API-PRJ-01, grano DAY). */
  readonly carbohidratos: SerieAnalitica;
  /** Las calorías registradas por día. */
  readonly energia: SerieAnalitica;
  /** Los escalones del objetivo de los carbohidratos (DL-158): marcan las etapas. */
  readonly escalones: readonly EscalonDelObjetivoApi[];
  /** Los del objetivo de las calorías, para su carril. */
  readonly escalonesDeEnergia: readonly EscalonDelObjetivoApi[];
  /** Los puntos del 1RM estimado del ejercicio, en una sola unidad (de la persona y observados). */
  readonly fuerza: readonly PuntoDeFuerza[];
  readonly unidad: 'kg' | 'lb';
  /** Las versiones del plan de entrenamiento (de la misma lectura de la fuerza). */
  readonly bandasDeEntrenamiento: readonly VigenciaDePlan[];
  /** Las versiones de los planes de las dos áreas, para decir qué más se activó en la ventana. */
  readonly vigencias: readonly VigenciaDePlan[];
  /** Lo indicado del ejercicio en cada versión; `null` si no se pudo leer (se dice). */
  readonly objetivos: ReadonlyMap<string, ObjetivoDeLaSerie> | null;
  readonly ejercicio: string;
  readonly periodo: { readonly desde: string; readonly hasta: string };
  readonly hoy: string;
}

export interface LecturaDeUnCruce {
  readonly ventana: { readonly a: { readonly desde: string; readonly hasta: string }; readonly b: { readonly desde: string; readonly hasta: string } } | null;
  /** Por qué no hay ventana, dicho; `null` si la hay. */
  readonly falta: string | null;
  /** La primera línea: lo que cambió en lo indicado (el ruido antes que el cambio). */
  readonly primeraLinea: readonly string[];
  readonly lineas: readonly string[];
  readonly tambienCambio: readonly string[];
  readonly noRegistra: readonly string[];
  readonly frase: string;
}

/** «310 g/día», «2.150 kcal/día». */
const porDia = (valor: number, unidad: string): string => `${valorConUnidad(valor, unidad, 0)}/día`;

/** «7 sin registro y 4 con algún dato faltante», solo con lo que no es cero. */
function afueraEnPalabras(d: DiasDeLaVentana): string | null {
  const partes = [...(d.sinRegistro > 0 ? [`${numero(d.sinRegistro, 0)} sin registro`] : []), ...(d.conFaltantes > 0 ? [`${numero(d.conFaltantes, 0)} con algún dato faltante`] : [])];
  if (partes.length === 0) return null;
  const total = d.sinRegistro + d.conFaltantes;
  return `${numero(total, 0)} ${total === 1 ? 'quedó afuera' : 'quedaron afuera'}: ${partes.join(' y ')}`;
}

/** Los días con los que se hizo una mediana de Nutrición, y los que quedaron afuera (regla de honestidad 13). */
export function diasEnPalabras(d: DiasDeLaVentana): string {
  const n = d.incluidos.length;
  const con = n === 1 ? 'con el único día que tiene cantidades en todos sus registros y ninguna comida del plan sin registro' : `con los ${numero(n, 0)} días que tienen cantidades en todos sus registros y ninguna comida del plan sin registro`;
  const afuera = afueraEnPalabras(d);
  return `${con}${afuera ? ` (${afuera})` : ''}${d.enCurso ? '; hoy sigue en curso y no entra' : ''}`;
}

const rotuloDeLaEtapa = (e: EtapaDelObjetivo): string => `objetivo desde el ${diaYMes(e.inicio)}, ${numero(e.dias, 0)} ${e.dias === 1 ? 'día' : 'días'}${e.recortada ? ' en el período' : ''}`;

/**
 * Lo de la fuerza en una etapa (por fechas): las sesiones de la persona, el núcleo y lo orientativo aparte. La mediana
 * del RIR y el rango de repeticiones son los de las sesiones del núcleo: las mismas que dan el rango de la estimación.
 */
function fuerzaDeLaEtapa(puntos: readonly PuntoDeFuerza[], e: EtapaDelObjetivo) {
  const propios = puntos.filter((p) => p.source === 'PERSON' && p.date >= e.desde && p.date <= e.hasta);
  const nucleo = propios.filter((p) => p.estimate.band === 'CORE');
  const reps = nucleo.map((p) => p.estimate.completedRepetitions);
  return {
    sesiones: propios.length,
    nucleo,
    orientativas: propios.length - nucleo.length,
    medianaDelRir: mediana(nucleo.map((p) => p.estimate.rir)),
    repeticiones: reps.length === 0 ? null : { desde: Math.min(...reps), hasta: Math.max(...reps) },
  };
}

const aLaVista = (p: PuntoDeFuerza): string => estimacionALaVista({ carga: p.estimate.load.value, repeticiones: p.estimate.completedRepetitions, rir: p.estimate.rir, unidad: p.estimate.load.unit });

/** «En Sentadilla, el 1RM estimado (Epley v1) estuvo entre ≈ 98 y ≈ 102 kg en 7 sesiones, con RIR registrado de mediana 1 y series de 5 a 6 repeticiones». */
function fuerzaEnPalabras(ejercicio: string, letra: string, f: ReturnType<typeof fuerzaDeLaEtapa>): string {
  if (f.nucleo.length === 0) return `En ${ejercicio}, la etapa ${letra} no tiene sesiones con una estimación del núcleo (hasta 10 repeticiones equivalentes).`;
  const ordenados = [...f.nucleo].sort((a, b) => a.estimate.value - b.estimate.value);
  const menor = ordenados[0] as PuntoDeFuerza;
  const mayor = ordenados[ordenados.length - 1] as PuntoDeFuerza;
  const sesiones = `${numero(f.nucleo.length, 0)} ${f.nucleo.length === 1 ? 'sesión' : 'sesiones'}`;
  const valor = aLaVista(menor) === aLaVista(mayor) ? `en ${aLaVista(menor)}` : `entre ${aLaVista(menor).replace(/ (kg|lb)$/, '')} y ${aLaVista(mayor)}`;
  const rir = f.medianaDelRir === null ? '' : `, con RIR registrado de mediana ${numero(f.medianaDelRir, 1)}`;
  const reps = f.repeticiones === null ? '' : f.repeticiones.desde === f.repeticiones.hasta ? ` y series de ${f.repeticiones.desde} repeticiones` : ` y series de ${f.repeticiones.desde} a ${f.repeticiones.hasta} repeticiones`;
  const orientativas =
    f.orientativas === 0
      ? ''
      : f.orientativas === 1
        ? '; 1 sesión orientativa (de más de 10 a 12 repeticiones equivalentes) se ve hueca y no entra'
        : `; ${numero(f.orientativas, 0)} sesiones orientativas (de más de 10 a 12 repeticiones equivalentes) se ven huecas y no entran`;
  return `En ${ejercicio}, en la etapa ${letra}, el 1RM estimado (Epley v1) estuvo ${valor} en ${sesiones}${rir}${reps}${orientativas}.`;
}

/** La lectura de SP-01: la ventana, lo que dice cada etapa, el ruido, lo que también cambió y la frase. */
export function lecturaDeCarbohidratosYFuerza(e: EntradaDeCarbohidratosYFuerza): LecturaDeUnCruce {
  const ventana: VentanaDeDosEtapas = ventanaDelObjetivo(etapasDelObjetivo(e.escalones, e.periodo));
  const base = { noRegistra: LO_QUE_BE_NO_REGISTRA['SP-01'], frase: COPY_DE_LOS_CRUCES.frase };
  if (ventana.tipo === 'FALTA') return { ...base, ventana: null, falta: C.faltaVentana[ventana.motivo], primeraLinea: [], lineas: [], tambienCambio: [] };
  const { a, b } = ventana;
  const unidadDeCarbohidratos = e.carbohidratos.unit;
  const carbohidratos = [a, b].map((x) => diasDeNutricion(e.carbohidratos, x.desde, x.hasta, e.hoy));
  const energia = [a, b].map((x) => diasDeNutricion(e.energia, x.desde, x.hasta, e.hoy));
  const fuerza = [a, b].map((x) => fuerzaDeLaEtapa(e.fuerza, x));
  const lineas: string[] = [];
  [a, b].forEach((etapa, i) => {
    const letra = i === 0 ? 'A' : 'B';
    const d = carbohidratos[i] as DiasDeLaVentana;
    const valor = d.mediana === null ? 'no hay días con cantidades en todos sus registros y ninguna comida del plan sin registro: no hay mediana de carbohidratos' : `mediana de carbohidratos registrados de ${porDia(d.mediana, unidadDeCarbohidratos)}, ${diasEnPalabras(d)}`;
    lineas.push(`Etapa ${letra} (${rotuloDeLaEtapa(etapa)}): ${valor}.`);
    lineas.push(fuerzaEnPalabras(e.ejercicio, letra, fuerza[i] as ReturnType<typeof fuerzaDeLaEtapa>));
  });
  const [fa, fb] = fuerza as [ReturnType<typeof fuerzaDeLaEtapa>, ReturnType<typeof fuerzaDeLaEtapa>];
  if (fa.nucleo.length < 5 || fb.nucleo.length < 5)
    lineas.push(`Con menos de 5 sesiones del núcleo de un lado, las dos etapas no se comparan como patrón: hay ${numero(fa.nucleo.length, 0)} y ${numero(fb.nucleo.length, 0)}.`);
  // El ruido propio: la mayor diferencia entre sesiones seguidas del núcleo de una misma versión, en las que tocan la ventana.
  const enLaVentana = e.bandasDeEntrenamiento.filter((v) => v.domain === 'TRAINING' && v.from <= b.hasta && (v.to === null || elDiaAnterior(v.to) >= a.desde));
  const diferencias = lecturaPorVersion(e.fuerza, enLaVentana).flatMap((l) => (l.diferenciaEntreSesiones === null ? [] : [l.diferenciaEntreSesiones]));
  lineas.push(diferencias.length === 0 ? C.sinDiferenciaTodavia : C.diferenciaEntreSesiones(`${numero(Math.max(...diferencias), 1)} ${e.unidad}`));
  const [ea, eb] = energia as [DiasDeLaVentana, DiasDeLaVentana];
  const unidadDeEnergia = e.energia.unit;
  lineas.push(
    `Las calorías registradas, con el mismo criterio de días: ${ea.mediana === null ? 'sin mediana en la etapa A' : `mediana de ${porDia(ea.mediana, unidadDeEnergia)} en la etapa A`} y ${eb.mediana === null ? 'sin mediana en la B' : `de ${porDia(eb.mediana, unidadDeEnergia)} en la B`}.`,
  );
  return {
    ...base,
    ventana: { a: { desde: a.desde, hasta: a.hasta }, b: { desde: b.desde, hasta: b.hasta } },
    falta: null,
    primeraLinea: e.objetivos === null ? [C.sinLoIndicado] : cambiosDeLoIndicado(e.objetivos, e.bandasDeEntrenamiento, a.desde, b.hasta),
    lineas,
    tambienCambio: versionesQueSeActivaron(e.vigencias, a.desde, b.hasta),
  };
}

/** Los escalones del objetivo en la unidad de la serie (los que son una proporción de las calorías no se dibujan). */
export function escalonesDelObjetivo(escalones: readonly EscalonDelObjetivoApi[], unidad: 'g/day' | 'kcal/day'): EscalonDelCarril[] {
  return escalones.flatMap((x) =>
    x.amount && x.amount.unit === unidad
      ? [{ desde: x.from, hasta: x.to === null ? null : elDiaAnterior(x.to), valor: x.amount.value, rotulo: `Objetivo: ${valorConUnidad(x.amount.value, unidad === 'g/day' ? 'g' : 'kcal', 0)}/día desde el ${diaYMes(x.from)}` }]
      : [],
  );
}

/** La descripción de un carril de Nutrición en el período: con cuántos días se dibuja y cuántos no. */
export function descripcionDeNutricion(nombre: string, serie: SerieAnalitica, periodo: { readonly desde: string; readonly hasta: string }, hoy: string): string {
  const d = diasDeNutricion(serie, periodo.desde, periodo.hasta, hoy);
  const conValor = serie.points.filter((p) => p.value !== null && p.date >= periodo.desde && p.date <= periodo.hasta).length;
  return `${nombre}: ${numero(conValor, 0)} ${conValor === 1 ? 'día con valor' : 'días con valor'}, de los que ${numero(d.conFaltantes, 0)} tienen algún dato faltante (huecos); ${numero(d.sinRegistro, 0)} ${d.sinRegistro === 1 ? 'día' : 'días'} sin registros.`;
}

/** Los carriles de SP-01, en su orden: los carbohidratos, las calorías al lado, y el 1RM estimado. */
export function carrilesDeCarbohidratosYFuerza(e: EntradaDeCarbohidratosYFuerza): CarrilDePuntos[] {
  const deNutricion = (id: 'nutricion.carbohidratos' | 'nutricion.energia', s: SerieAnalitica, nombre: string, indice: number, unidad: 'g/day' | 'kcal/day'): CarrilDePuntos => {
    const serie = delCatalogo(id);
    return carrilDeSerie(s, serie, {
      id,
      nombre,
      indice,
      metodo: serie.metodo?.rotulo ?? null,
      escala: escalaDeLaSerie(serie, s.unit),
      descripcion: descripcionDeNutricion(nombre, s, e.periodo, e.hoy),
      lectura: (p) => lecturaDelPunto(p, serie.definicion, s.unit),
      escalones: escalonesDelObjetivo(id === 'nutricion.carbohidratos' ? e.escalones : e.escalonesDeEnergia, unidad),
    });
  };
  const uno = delCatalogo('entrenamiento.1rm-estimado');
  const puntos = puntosDeLaFuerza(e.fuerza, e.unidad, (p) => {
    const banda = p.source === 'OBSERVED' ? 'observada por el profesional' : p.estimate.band === 'ORIENTATIVE' ? 'estimación orientativa' : 'estimación';
    return `${aLaVista(p)} · ${p.estimate.completedRepetitions} rep · RIR ${numero(p.estimate.rir, 1)} · ${banda}`;
  });
  const propios = e.fuerza.filter((p) => p.source === 'PERSON' && p.estimate.load.unit === e.unidad);
  const observadas = e.fuerza.filter((p) => p.source === 'OBSERVED' && p.estimate.load.unit === e.unidad).length;
  const orientativas = propios.filter((p) => p.estimate.band === 'ORIENTATIVE').length;
  const fuerza: CarrilDePuntos = {
    tipo: 'PUNTOS',
    id: uno.id,
    nombre: `${C.carriles.fuerza} · ${e.ejercicio}`,
    unidad: e.unidad,
    metodo: uno.metodo?.nombre ?? null,
    indice: 2,
    puntos,
    indicado: [],
    escalones: [],
    unir: uno.unirPuntos,
    escala: escalaDeLaSerie(uno, e.unidad),
    cobertura: [],
    descripcion: `${C.carriles.fuerza}: ${numero(propios.length, 0)} ${propios.length === 1 ? 'sesión' : 'sesiones'} de la persona (${numero(orientativas, 0)} ${orientativas === 1 ? 'orientativa' : 'orientativas'}) y ${numero(observadas, 0)} ${observadas === 1 ? 'serie observada' : 'series observadas'} por el profesional.`,
  };
  return [deNutricion('nutricion.carbohidratos', e.carbohidratos, C.carriles.carbohidratos, 0, 'g/day'), deNutricion('nutricion.energia', e.energia, C.carriles.energia, 1, 'kcal/day'), fuerza];
}

/** Las dos etapas de la ventana como bandas de fondo: «Etapa A · objetivo desde el 2/9». */
export function bandasDeLaVentana(l: LecturaDeUnCruce): BandaDeVersion[] {
  if (!l.ventana) return [];
  return [
    { area: 'NUTRICION', desde: l.ventana.a.desde, hasta: l.ventana.a.hasta, rotulo: 'Etapa A' },
    { area: 'NUTRICION', desde: l.ventana.b.desde, hasta: l.ventana.b.hasta, rotulo: 'Etapa B' },
  ];
}

