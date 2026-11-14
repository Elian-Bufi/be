/**
 * El carril: una fila de un gráfico sobre el eje de fechas común (WP-GRAFICOS fase 2, DL-174), con su unidad, su escala
 * y sus marcas. Todos los gráficos de la fase 2 se arman con carriles: los dibuja `PanelesAlineados`, los lee
 * `LecturaEnLaFecha` y los escribe `TablaEquivalente`, así que el dibujo y la tabla no pueden decir cosas distintas.
 *
 * Reglas que heredan (§1.4 del diseño): un hueco no es cero, la línea une solo puntos del mismo tramo, lo desconocido no
 * es un punto, Antropometría va en puntos sueltos y lo indicado no se mezcla con lo registrado.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import type { AreaDeMetrica, MarcaSemantica } from '@be/domain';
import { escalaDeLaUnidad, extremosDelEje } from '../seguimiento/geometria';
import type { EventoDeLaCinta } from './cinta-del-tiempo';
import type { EscalaDeFechas } from './eje-de-fechas';

export type { MarcaSemantica } from '@be/domain';

export interface PuntoDelCarril {
  /** El `pointId`: elegir y volver al punto. */
  readonly clave: string;
  /** AAAA-MM-DD (en la semana, el lunes). */
  readonly fecha: string;
  /** El fin del balde semanal; `null` en los otros granos. */
  readonly hasta: string | null;
  /** La hora del hecho, si la tiene. */
  readonly en: string | null;
  /** `null`: no se dibuja (un hueco no es cero). */
  readonly valor: number | null;
  /** Lo indicado como rango («RIR 1 a 2»): un segmento hueco. */
  readonly rango: { readonly desde: number; readonly hasta: number } | null;
  /** Dos puntos se unen solo si comparten tramo. */
  readonly tramo: string;
  readonly marca: MarcaSemantica;
  /** Cargado en un día posterior: una muesca chica arriba de la marca y el texto en la lectura y la tabla. */
  readonly tarde: boolean;
  /** Lo que dicen la lectura y la tabla: «96 kg · 5 rep · RIR 1». */
  readonly lectura: string;
}

/** El objetivo, en escalón discontinuo: un valor desde una fecha hasta otra (o hasta hoy). */
export interface EscalonDelCarril {
  readonly desde: string;
  readonly hasta: string | null;
  readonly valor: number;
  readonly rotulo: string;
}

export interface EscalaDelCarril {
  readonly rangoMinimo?: number;
  readonly enteros: boolean;
  readonly desdeCero?: boolean;
  /** El techo mínimo del eje: el RIR va de 0 a 5 como mínimo. */
  readonly minimoDelMaximo?: number;
}

/** El estado de cada día en la tira de cobertura (TB-10): con dato, con algo que falta o sin registros. */
export type EstadoDelDiaEnLaTira = 'con' | 'hueco' | 'sin';

export interface CarrilDePuntos {
  readonly tipo: 'PUNTOS';
  readonly id: string;
  /** «Carga registrada en la serie 1». */
  readonly nombre: string;
  readonly unidad: string;
  /** «Epley v1». */
  readonly metodo: string | null;
  /** El color (`ESTILOS`), de 0 a 2. */
  readonly indice: number;
  readonly puntos: readonly PuntoDelCarril[];
  /** Lo indicado, hueco, en el mismo panel (solo si comparte la unidad). */
  readonly indicado: readonly PuntoDelCarril[];
  /** El objetivo, discontinuo. */
  readonly escalones: readonly EscalonDelCarril[];
  readonly unir: boolean;
  readonly escala: EscalaDelCarril;
  readonly cobertura: readonly { readonly fecha: string; readonly estado: EstadoDelDiaEnLaTira }[];
  /** El resumen en texto, para el lector de pantalla. */
  readonly descripcion: string;
}

export interface SemanaDelCarril {
  readonly lunes: string;
  readonly valor: number | null;
  /** Con cuántos días se hizo. */
  readonly dias: number;
  readonly lectura: string;
}

export interface CarrilDeBarrasSemanales {
  readonly tipo: 'BARRAS_SEMANALES';
  readonly id: string;
  readonly nombre: string;
  readonly unidad: string;
  readonly semanas: readonly SemanaDelCarril[];
  readonly descripcion: string;
}

export interface CarrilDeEventos {
  readonly tipo: 'EVENTOS';
  readonly id: string;
  readonly nombre: string;
  readonly eventos: readonly EventoDeLaCinta[];
}

export type Carril = CarrilDePuntos | CarrilDeBarrasSemanales | CarrilDeEventos;

/** Una versión de un plan de fondo: «Objetivo v3 · desde el 2/9». Contexto temporal, no «plan cumplido». */
export interface BandaDeVersion {
  readonly area: AreaDeMetrica;
  readonly desde: string;
  readonly hasta: string | null;
  readonly rotulo: string;
}

// ─── La geometría ───────────────────────────────────────────────────────────────────────────────

/** El aire arriba y abajo del carril, para que una marca no toque el borde. */
export const AIRE_DEL_CARRIL = 10;

export interface MarcaUbicada {
  readonly clave: string;
  readonly x: number;
  readonly y: number;
  readonly marca: MarcaSemantica;
  readonly tarde: boolean;
  /** Lo indicado como rango: de dónde a dónde va el segmento hueco. */
  readonly yHasta: number | null;
}

export interface MarcaDelEjeY {
  readonly valor: number;
  readonly y: number;
}

export type GeometriaDelCarril =
  | {
      readonly tipo: 'PUNTOS';
      readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
      readonly marcasY: readonly MarcaDelEjeY[];
      /** Las líneas: cada una une puntos seguidos del mismo tramo, con valor. */
      readonly lineas: readonly (readonly { readonly x: number; readonly y: number }[])[];
      readonly marcas: readonly MarcaUbicada[];
      readonly indicado: readonly MarcaUbicada[];
      readonly escalones: readonly { readonly x1: number; readonly x2: number; readonly y: number; readonly rotulo: string }[];
      /** Lo que no entra en la escala: lleva su muesca y la cuenta en el pie. */
      readonly fueraDeLaEscala: number;
    }
  | { readonly tipo: 'BARRAS_SEMANALES'; readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number }; readonly barras: readonly { readonly lunes: string; readonly x1: number; readonly x2: number; readonly y: number; readonly base: number }[] }
  | { readonly tipo: 'EVENTOS'; readonly eventos: readonly { readonly clave: string; readonly x1: number; readonly x2: number | null }[] };

const conValor = (p: PuntoDelCarril): p is PuntoDelCarril & { readonly valor: number } => p.valor !== null && Number.isFinite(p.valor);

/** Los extremos del eje vertical de un carril, con su escala: el rango mínimo de la serie manda sobre el de la unidad. */
export function extremosDelCarril(valores: readonly number[], unidad: string, escala: EscalaDelCarril): { readonly abajo: number; readonly arriba: number; readonly decimales: number } {
  const deLaUnidad = escalaDeLaUnidad(unidad);
  const rangoMinimo = escala.rangoMinimo ?? deLaUnidad.rangoMinimo;
  if (valores.length === 0) return extremosDelEje(0, escala.minimoDelMaximo ?? 1, 2, escala.enteros);
  let minimo = Math.min(...valores);
  let maximo = Math.max(...valores);
  if (escala.desdeCero) minimo = Math.min(0, minimo);
  if (escala.minimoDelMaximo !== undefined) maximo = Math.max(maximo, escala.minimoDelMaximo);
  if (rangoMinimo !== undefined && maximo - minimo < rangoMinimo) {
    const centro = (minimo + maximo) / 2;
    minimo = centro - rangoMinimo / 2;
    maximo = centro + rangoMinimo / 2;
    if (Math.min(...valores) >= 0 && minimo < 0) {
      maximo -= minimo;
      minimo = 0;
    }
  }
  return extremosDelEje(minimo, maximo, 2, escala.enteros);
}

/**
 * Las líneas de un carril: solo entre puntos seguidos con valor y del mismo tramo. Un punto sin valor corta la línea
 * (un hueco no es cero) y un cambio de tramo también.
 */
export function lineasDelCarril(puntos: readonly PuntoDelCarril[]): readonly (readonly PuntoDelCarril[])[] {
  const lineas: PuntoDelCarril[][] = [];
  let actual: PuntoDelCarril[] = [];
  for (const p of puntos) {
    if (!conValor(p)) {
      if (actual.length > 1) lineas.push(actual);
      actual = [];
      continue;
    }
    if (actual.length > 0 && actual[actual.length - 1].tramo !== p.tramo) {
      if (actual.length > 1) lineas.push(actual);
      actual = [];
    }
    actual.push(p);
  }
  if (actual.length > 1) lineas.push(actual);
  return lineas;
}

/** La geometría de un carril sobre la escala de fechas, en una caja de `alto` píxeles. */
export function geometriaDelCarril(c: Carril, escala: EscalaDeFechas, alto: number): GeometriaDelCarril {
  if (c.tipo === 'EVENTOS') {
    return { tipo: 'EVENTOS', eventos: c.eventos.map((e) => ({ clave: e.clave, x1: escala.x(e.desde), x2: e.hasta === null ? null : escala.x(e.hasta) })) };
  }
  const util = Math.max(1, alto - 2 * AIRE_DEL_CARRIL);
  if (c.tipo === 'BARRAS_SEMANALES') {
    const valores = c.semanas.flatMap((s) => (s.valor === null ? [] : [s.valor]));
    const extremos = extremosDelCarril([0, ...valores], c.unidad, { enteros: false, desdeCero: true });
    const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
    const barras = c.semanas.flatMap((s) => {
      if (s.valor === null) return [];
      const x1 = escala.x(s.lunes) - escala.porDia / 2;
      return [{ lunes: s.lunes, x1, x2: x1 + 7 * escala.porDia, y: y(s.valor), base: y(Math.max(0, extremos.abajo)) }];
    });
    return { tipo: 'BARRAS_SEMANALES', extremos, barras };
  }
  const visibles = (ps: readonly PuntoDelCarril[]) => ps.filter((p) => p.fecha >= escala.desde && p.fecha <= escala.hasta);
  const puntos = visibles(c.puntos);
  const indicado = visibles(c.indicado);
  const valores = [
    ...puntos.filter(conValor).map((p) => p.valor),
    ...indicado.flatMap((p) => (p.rango ? [p.rango.desde, p.rango.hasta] : conValor(p) ? [p.valor] : [])),
    ...c.escalones.map((e) => e.valor),
  ];
  const extremos = extremosDelCarril(valores, c.unidad, c.escala);
  const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
  const fuera = (v: number): boolean => v < extremos.abajo || v > extremos.arriba;
  const acotada = (v: number): number => y(Math.min(Math.max(v, extremos.abajo), extremos.arriba));
  const ubicar = (p: PuntoDelCarril & { readonly valor: number }): MarcaUbicada => ({ clave: p.clave, x: escala.xDePunto(p), y: acotada(p.valor), marca: p.marca, tarde: p.tarde, yHasta: null });
  const marcas = puntos.filter(conValor).map(ubicar);
  const indicadoUbicado = indicado.flatMap((p): MarcaUbicada[] => {
    if (p.rango) return [{ clave: p.clave, x: escala.xDePunto(p), y: acotada(p.rango.hasta), marca: p.marca, tarde: false, yHasta: acotada(p.rango.desde) }];
    return conValor(p) ? [ubicar(p)] : [];
  });
  const lineas = c.unir ? lineasDelCarril(puntos).map((l) => l.filter(conValor).map((p) => ({ x: escala.xDePunto(p), y: acotada(p.valor) }))) : [];
  const escalones = c.escalones.map((e) => ({
    x1: escala.x(e.desde < escala.desde ? escala.desde : e.desde) - escala.porDia / 2,
    x2: escala.x(e.hasta === null || e.hasta > escala.hasta ? escala.hasta : e.hasta) + escala.porDia / 2,
    y: acotada(e.valor),
    rotulo: e.rotulo,
  }));
  const paso = (extremos.arriba - extremos.abajo) / 2;
  // La marca del medio va solo si se escribe con los decimales de las otras dos: de 0 a 5 diría «3» donde va 2,5 (rama B).
  const medio = extremos.abajo + paso;
  const medioSeEscribe = Math.abs(Number(medio.toFixed(extremos.decimales)) - medio) < 1e-9;
  const marcasY = [extremos.abajo, ...(medioSeEscribe ? [medio] : []), extremos.arriba].map((valor) => ({ valor, y: y(valor) }));
  return { tipo: 'PUNTOS', extremos, marcasY, lineas, marcas, indicado: indicadoUbicado, escalones, fueraDeLaEscala: puntos.filter((p) => conValor(p) && fuera(p.valor)).length };
}

/** Las fechas con alguna observación en algún carril, ordenadas: por ellas se mueve el cursor con el teclado. */
export function fechasConObservacion(carriles: readonly Carril[]): string[] {
  const fechas = new Set<string>();
  for (const c of carriles) {
    if (c.tipo === 'PUNTOS') for (const p of [...c.puntos, ...c.indicado]) if (p.valor !== null || p.rango !== null) fechas.add(p.fecha);
    if (c.tipo === 'BARRAS_SEMANALES') for (const s of c.semanas) if (s.valor !== null) fechas.add(s.lunes);
  }
  return [...fechas].sort();
}

/** «3 de 21 días cargados después»: la línea de la tira de cobertura, o `null` si no hay nada cargado después. */
export function lineaDeLoCargadoTarde(c: CarrilDePuntos): string | null {
  const dias = new Set(c.puntos.filter((p) => p.valor !== null).map((p) => p.fecha));
  const tarde = new Set(c.puntos.filter((p) => p.valor !== null && p.tarde).map((p) => p.fecha));
  if (tarde.size === 0) return null;
  return `${tarde.size} de ${dias.size} ${dias.size === 1 ? 'día cargado' : 'días cargados'} después`;
}
