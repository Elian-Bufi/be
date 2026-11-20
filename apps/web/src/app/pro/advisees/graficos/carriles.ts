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
import { MARCA_SEGUN_EL_DATO, type AreaDeMetrica, type MarcaSemantica, type SentidoDeLaMarca } from '@be/domain';
import { escalaDeLaUnidad } from '../seguimiento/geometria';
import type { EventoDeLaCinta } from './cinta-del-tiempo';
import type { EscalaDeFechas } from './eje-de-fechas';
import { marcasRedondas, type MarcasDelEje } from './ejes';

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
  /**
   * Qué dice la marca, cuando una forma sirve para más de un sentido (revisión del 15/11): una marca hueca es un subtotal en
   * Nutrición y una orientativa en el 1RM estimado. Sin esto, la leyenda decide por la forma.
   */
  readonly sentido?: SentidoDeLaMarca;
}

/** El objetivo, en escalón discontinuo: un valor desde una fecha hasta otra (o hasta hoy). */
export interface EscalonDelCarril {
  readonly desde: string;
  readonly hasta: string | null;
  readonly valor: number;
  readonly rotulo: string;
}

/**
 * WP-GRAFICOS-POR-FASE (GPF-05): lo indicado como **franja**, en escalones según la versión que rige: de `minimo` a
 * `maximo` (un valor fijo es una franja de alto cero, que se dibuja como una raya), de `desde` a `hasta`. Va de fondo,
 * en gris, sin color de juicio: lo registrado se marca encima.
 */
export interface FranjaDelCarril {
  readonly desde: string;
  readonly hasta: string;
  readonly minimo: number;
  readonly maximo: number;
  /** «8 a 10 rep · v3», para la lectura y la tabla. */
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
  /**
   * Un punto por sesión, no por día (Entrenamiento, rama B): la marca se mide con el lugar de una sesión y no con el ancho
   * de un día, para que se vea sobre la línea en 12 semanas o en un año (DISENO-VISUAL §1, principio 7: lo que dice la
   * leyenda se ve en el dibujo). Sin esto, la marca sigue al ancho del día, como siempre.
   */
  readonly porSesion?: boolean;
  /** GPF-05: la franja de lo indicado, de fondo (solo si comparte la unidad). */
  readonly franjas?: readonly FranjaDelCarril[];
}

export interface SemanaDelCarril {
  readonly lunes: string;
  readonly valor: number | null;
  /** Con cuántos días se hizo. */
  readonly dias: number;
  readonly lectura: string;
  /**
   * Con la media de GR-12 (GR-VC13, rama D; un cambio que solo agrega): `true` si entran los siete días (la barra va
   * llena), `false` si quedó alguno afuera (hueca, con su contorno). Sin esto, la barra va como siempre.
   */
  readonly entera?: boolean;
  /** La semana tiene días con valor aunque no tenga media (GR-VC12): va con su contorno cortado, no como semana vacía. */
  readonly conDias?: boolean;
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
  /**
   * Lo que cambió en lo indicado al empezar esta versión («de 4 a 3 repeticiones», `cambioCortoDeLoIndicado`): va en la
   * línea del cambio, con la versión («v8 · de 4 a 3 repeticiones»), si entra. Sin esto, solo «v8».
   */
  readonly cambio?: string | null;
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
      /** GPF-05: la franja de lo indicado, de fondo; ausente si el carril no la tiene. */
      readonly franjas?: readonly { readonly x1: number; readonly x2: number; readonly y1: number; readonly y2: number; readonly rotulo: string }[];
      /** Lo que no entra en la escala: lleva su muesca y la cuenta en el pie. */
      readonly fueraDeLaEscala: number;
    }
  | {
      readonly tipo: 'BARRAS_SEMANALES';
      readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
      readonly marcasY: readonly MarcaDelEjeY[];
      /** `hueca`: con la media de GR-12, a la semana le quedó algún día afuera (`entera: false`). */
      readonly barras: readonly { readonly lunes: string; readonly x1: number; readonly x2: number; readonly y: number; readonly base: number; readonly hueca: boolean }[];
      /** Las semanas sin ningún día con dato: vacías, con una marca fina en la base (nunca una barra en cero). */
      readonly vacias: readonly { readonly lunes: string; readonly x1: number; readonly x2: number; readonly base: number }[];
      /** Las semanas con días pero sin media (GR-VC12): el contorno cortado de todo el alto, sin relleno. */
      readonly sinMedia: readonly { readonly lunes: string; readonly x1: number; readonly x2: number; readonly base: number }[];
    }
  | { readonly tipo: 'EVENTOS'; readonly eventos: readonly { readonly clave: string; readonly x1: number; readonly x2: number | null }[] };

const conValor = (p: PuntoDelCarril): p is PuntoDelCarril & { readonly valor: number } => p.valor !== null && Number.isFinite(p.valor);

/**
 * Los extremos del eje vertical de un carril, con su escala: el rango mínimo de la serie manda sobre el de la unidad.
 * Desde la pasada visual (15/11), los extremos son la primera y la última de 3 a 5 marcas redondas (`marcasRedondas`):
 * la grilla cierra arriba y abajo, y ningún número del eje se repite.
 */
export function extremosDelCarril(valores: readonly number[], unidad: string, escala: EscalaDelCarril): MarcasDelEje {
  const deLaUnidad = escalaDeLaUnidad(unidad);
  const rangoMinimo = escala.rangoMinimo ?? deLaUnidad.rangoMinimo;
  if (valores.length === 0) return marcasRedondas(0, escala.minimoDelMaximo ?? 1, { enteros: escala.enteros });
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
  return marcasRedondas(minimo, maximo, { enteros: escala.enteros });
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
    // Una semana que empieza antes del eje (el vínculo, TB-16) se dibuja desde el primer día del eje; una que cae afuera, no.
    const izquierda = escala.x(escala.desde) - escala.porDia / 2;
    const derecha = escala.x(escala.hasta) + escala.porDia / 2;
    const tocaElEje = (s: SemanaDelCarril): boolean => escala.x(s.lunes) - escala.porDia / 2 + 7 * escala.porDia > izquierda && escala.x(s.lunes) - escala.porDia / 2 < derecha;
    const enElEje = c.semanas.filter((s) => s.valor !== null && tocaElEje(s));
    const valores = enElEje.flatMap((s) => (s.valor === null ? [] : [s.valor]));
    // Las barras arrancan en cero (lo único del eje que arranca en cero, DISENO-VISUAL §1, principio 4).
    const extremos = extremosDelCarril([0, ...valores], c.unidad, { enteros: false, desdeCero: true });
    const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
    const base = y(Math.max(0, extremos.abajo));
    const lugar = (s: SemanaDelCarril) => {
      const inicio = escala.x(s.lunes) - escala.porDia / 2;
      return { x1: Math.max(izquierda, inicio), x2: Math.min(derecha, inicio + 7 * escala.porDia) };
    };
    const barras = enElEje.flatMap((s) => (s.valor === null ? [] : [{ lunes: s.lunes, ...lugar(s), y: y(s.valor), base, hueca: s.entera === false }]));
    const vacias = c.semanas.filter((s) => s.valor === null && s.conDias !== true && tocaElEje(s)).map((s) => ({ lunes: s.lunes, ...lugar(s), base }));
    const sinMedia = c.semanas.filter((s) => s.valor === null && s.conDias === true && tocaElEje(s)).map((s) => ({ lunes: s.lunes, ...lugar(s), base }));
    return { tipo: 'BARRAS_SEMANALES', extremos, marcasY: extremos.valores.map((valor) => ({ valor, y: y(valor) })), barras, vacias, sinMedia };
  }
  const visibles = (ps: readonly PuntoDelCarril[]) => ps.filter((p) => p.fecha >= escala.desde && p.fecha <= escala.hasta);
  const puntos = visibles(c.puntos);
  const indicado = visibles(c.indicado);
  const valores = [
    ...puntos.filter(conValor).map((p) => p.valor),
    ...indicado.flatMap((p) => (p.rango ? [p.rango.desde, p.rango.hasta] : conValor(p) ? [p.valor] : [])),
    ...c.escalones.map((e) => e.valor),
    ...(c.franjas ?? []).filter((f) => f.hasta >= escala.desde && f.desde <= escala.hasta).flatMap((f) => [f.minimo, f.maximo]),
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
  const franjas = (c.franjas ?? [])
    .filter((f) => f.hasta >= escala.desde && f.desde <= escala.hasta)
    .map((f) => ({
      x1: escala.x(f.desde < escala.desde ? escala.desde : f.desde) - escala.porDia / 2,
      x2: escala.x(f.hasta > escala.hasta ? escala.hasta : f.hasta) + escala.porDia / 2,
      y1: acotada(f.maximo),
      y2: acotada(f.minimo),
      rotulo: f.rotulo,
    }));
  // De 3 a 5 marcas redondas, sin un número repetido: la grilla tenue va en cada una (DISENO-VISUAL §1, principio 4).
  const marcasY = extremos.valores.map((valor) => ({ valor, y: y(valor) }));
  return { tipo: 'PUNTOS', extremos, marcasY, lineas, marcas, indicado: indicadoUbicado, escalones, ...(c.franjas ? { franjas } : {}), fueraDeLaEscala: puntos.filter((p) => conValor(p) && fuera(p.valor)).length };
}

/**
 * Los sentidos de la leyenda que se ven en el dibujo (DISENO-VISUAL §1, principio 7): una marca de la leyenda que no
 * aparece en ningún carril es un error. Lo indicado está si algún carril lo dibuja; lo demás, si alguna marca de lo
 * registrado tiene esa forma **y ese sentido**: SUBTOTAL y ORIENTATIVA comparten la forma hueca, y un día de comida con
 * algo que falta no pide «De más de 10 a 12 rep. equivalentes» (revisión del 15/11). Un punto sin `sentido` vale por su
 * forma. Mantiene el orden pedido.
 */
export function sentidosQueSeVen(sentidos: readonly SentidoDeLaMarca[], carriles: readonly Carril[]): SentidoDeLaMarca[] {
  const puntos = carriles.flatMap((c) => (c.tipo === 'PUNTOS' ? c.puntos.filter((p) => p.valor !== null || p.rango !== null) : []));
  const conIndicado = carriles.some((c) => c.tipo === 'PUNTOS' && c.indicado.some((p) => p.valor !== null || p.rango !== null));
  const conSemanas = carriles.some((c) => c.tipo === 'BARRAS_SEMANALES' && c.semanas.some((s) => s.valor !== null));
  const seVe = (s: SentidoDeLaMarca): boolean => puntos.some((p) => p.marca === MARCA_SEGUN_EL_DATO[s] && (p.sentido === undefined || p.sentido === s));
  return sentidos.filter((s) => (s === 'INDICADO' ? conIndicado || puntos.some((p) => p.sentido === 'INDICADO') : seVe(s) || (s === 'REGISTRADO' && conSemanas)));
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
