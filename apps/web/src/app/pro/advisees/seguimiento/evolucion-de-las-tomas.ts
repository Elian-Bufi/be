/**
 * La evolución de las últimas tomas, en la tarjeta de Antropometría del Resumen (WP-TABLERO-ALTA-GAMA TB-50; pedido de
 * Dirección del 2026-11-07: «que se vea al mismo tiempo tomas de cintura y pliegue abdominal, y así en 3 o 4 tomas,
 * para rápidamente interpretar cómo avanza el resultado físico»). Sin React, para probarla sin navegador
 * (`apps/web/test/evolucion-de-las-tomas.test.mjs`, TEST-TAG-036). Lee lo que ya trae la lectura de la tarjeta
 * (API-ANT-06, la ventana de 92 días que termina en la última toma): no calcula ninguna medida.
 *
 * Las reglas:
 * - **Medidas que se leen en par,** en las mismas tomas: cintura y pliegue abdominal; suma de 6 pliegues y peso; brazo
 *   flexionado y pliegue tricipital. Cada par, una fila por medida, con las tomas en columnas alineadas.
 * - **Una columna por toma, en orden** (hasta cuatro, las últimas con alguna medida de los pares), con su fecha escrita:
 *   la distancia entre columnas no es el tiempo, y por eso cada una dice su día.
 * - **Kilos con kilos** (la propuesta, §18): cada medida va en su unidad, nunca dos unidades en un mismo eje, y las filas
 *   de una misma unidad usan la misma vara (un centímetro mide lo mismo en la cintura que en el brazo), nunca más
 *   angosta que 2 kg, 2 cm o 4 mm (TB-04).
 * - **Lo no comparable se dice con palabras:** la línea une solo dos columnas seguidas con valor y comparables (el mismo
 *   protocolo, método y unidad, REG-06-162); un cambio corta la línea y la diferencia va desde ahí, y lo dice. Una toma
 *   sin esa medida es un hueco, sin completar (REG-06-166).
 * - **Ubica, no califica:** el valor y la diferencia con su signo y su unidad, sin colores de bien o mal.
 */
import { numeroConPrecision } from '@be/domain';
import type { DatoDeLaToma, TomaDeLaComposicion } from './composicion';
// Solo tipos de `geometria.ts`: la vara mínima de cada unidad y la medida de las marcas las pasa quien dibuja (así este
// módulo se prueba sin compilar, con la misma regla de TB-02 y TB-04).
import type { EstadoDeMarca } from './geometria';

export interface MedidaDelPar {
  readonly metrica: string;
  readonly nombre: string;
}

export interface Par {
  readonly clave: string;
  readonly titulo: string;
  readonly medidas: readonly [MedidaDelPar, MedidaDelPar];
}

/** Los pares, en el orden de la tarjeta. */
export const PARES: readonly Par[] = [
  { clave: 'cintura-y-abdominal', titulo: 'Cintura y pliegue abdominal', medidas: [{ metrica: 'perimetro-cintura', nombre: 'Cintura' }, { metrica: 'pliegue-abdominal', nombre: 'Pliegue abdominal' }] },
  { clave: 'pliegues-y-peso', titulo: 'Suma de 6 pliegues y peso', medidas: [{ metrica: 'suma-6-pliegues-isak', nombre: 'Suma de 6 pliegues' }, { metrica: 'peso', nombre: 'Peso' }] },
  { clave: 'brazo-y-tricipital', titulo: 'Brazo flexionado y pliegue tricipital', medidas: [{ metrica: 'perimetro-brazo-flexionado', nombre: 'Brazo flexionado' }, { metrica: 'pliegue-triceps', nombre: 'Pliegue tricipital' }] },
];

/** Lo que la pieza suma a la lectura de la tarjeta (`metric=` de API-ANT-06): la misma lectura, sin peticiones nuevas. */
export const METRICAS_DE_LA_EVOLUCION: readonly string[] = [...new Set(PARES.flatMap((p) => p.medidas.map((m) => m.metrica)))];

/** Hasta cuántas tomas: con tomas cada cuatro a seis semanas, la ventana de 92 días de la lectura trae tres o cuatro. */
export const MAXIMO_DE_TOMAS = 4;

export interface ValorDeLaColumna {
  readonly valor: number;
  readonly unidad: string;
  readonly clase: DatoDeLaToma['clase'];
  readonly corregido: boolean;
  /** Protocolo, método y unidad (REG-06-162). */
  readonly comparable: string;
}

export interface FilaDeLaEvolucion {
  readonly metrica: string;
  readonly nombre: string;
  /** La unidad del último valor de la fila; `null` si la fila no tiene ninguno. */
  readonly unidad: string | null;
  /** Un valor por columna, o `null` si esa toma no la midió. */
  readonly valores: readonly (ValorDeLaColumna | null)[];
  /** Las columnas que une la línea, por tramos: dos seguidas, las dos con valor y comparables. */
  readonly tramos: readonly (readonly number[])[];
  /** Entre la primera y la última columna comparables con la última: la diferencia, con las columnas de cada punta. */
  readonly diferencia: { readonly valor: number; readonly desde: number; readonly hasta: number } | null;
  /** La columna donde cambia el protocolo, el método o la unidad: la diferencia va desde ahí. */
  readonly cambio: number | null;
}

export interface ParDeLaEvolucion {
  readonly par: Par;
  readonly filas: readonly [FilaDeLaEvolucion, FilaDeLaEvolucion];
}

export interface EvolucionDeLasTomas {
  readonly columnas: readonly { readonly evaluacionId: string; readonly fecha: string }[];
  /** Solo los pares con algún valor en estas tomas. */
  readonly pares: readonly ParDeLaEvolucion[];
}

const redondear = (x: number): number => Math.round(x * 10) / 10;
const METRICAS_SIN_EL_PESO = METRICAS_DE_LA_EVOLUCION.filter((m) => m !== 'peso');

function filaDe(medida: MedidaDelPar, tomas: readonly TomaDeLaComposicion[]): FilaDeLaEvolucion {
  const valores = tomas.map((t): ValorDeLaColumna | null => {
    const d = t.datos.get(medida.metrica);
    return d ? { valor: d.valor, unidad: d.unidad, clase: d.clase, corregido: d.corregido, comparable: d.comparable } : null;
  });
  const tramos: number[][] = [];
  let actual: number[] = [];
  valores.forEach((v, i) => {
    const anterior = i > 0 ? valores[i - 1] : null;
    if (v && anterior && anterior.comparable === v.comparable) actual.push(i);
    else {
      if (actual.length) tramos.push(actual);
      actual = v ? [i] : [];
    }
  });
  if (actual.length) tramos.push(actual);
  // La diferencia: desde la última columna con valor hacia atrás, mientras sea comparable con ella (un hueco no corta
  // la comparación, pero un cambio de protocolo, método o unidad, sí).
  const conValor = valores.flatMap((v, i) => (v ? [i] : []));
  const ultima = conValor[conValor.length - 1];
  let desde = ultima;
  let cambio: number | null = null;
  if (ultima !== undefined) {
    const clave = (valores[ultima] as ValorDeLaColumna).comparable;
    for (let k = conValor.length - 2; k >= 0; k--) {
      const i = conValor[k] as number;
      if ((valores[i] as ValorDeLaColumna).comparable !== clave) {
        cambio = desde ?? null;
        break;
      }
      desde = i;
    }
  }
  const diferencia =
    ultima !== undefined && desde !== undefined && desde !== ultima
      ? { valor: redondear((valores[ultima] as ValorDeLaColumna).valor - (valores[desde] as ValorDeLaColumna).valor), desde, hasta: ultima }
      : null;
  return {
    metrica: medida.metrica,
    nombre: medida.nombre,
    unidad: ultima !== undefined ? (valores[ultima] as ValorDeLaColumna).unidad : null,
    valores,
    tramos,
    diferencia,
    cambio,
  };
}

/**
 * La pieza: las columnas (las últimas tomas con alguna medida de los pares, sin contar el peso solo) y los pares con
 * algún valor. Con menos de dos columnas no hay evolución que mostrar, pero la pieza la devuelve igual: la pantalla lo
 * dice.
 */
export function evolucionDeLasTomas(tomas: readonly TomaDeLaComposicion[], maximo = MAXIMO_DE_TOMAS): EvolucionDeLasTomas {
  const conMedidas = [...tomas].sort((a, b) => a.instante.localeCompare(b.instante) || a.evaluacionId.localeCompare(b.evaluacionId)).filter((t) => METRICAS_SIN_EL_PESO.some((m) => t.datos.has(m)));
  const elegidas = conMedidas.slice(-maximo);
  const pares = PARES.flatMap((par): ParDeLaEvolucion[] => {
    const filas = [filaDe(par.medidas[0], elegidas), filaDe(par.medidas[1], elegidas)] as const;
    return filas.some((f) => f.unidad !== null) ? [{ par, filas }] : [];
  });
  return { columnas: elegidas.map((t) => ({ evaluacionId: t.evaluacionId, fecha: t.fecha })), pares };
}

// ─── La vara: kilos con kilos ───────────────────────────────────────────────────────────────────────────────────

export interface EscalaDeLaFila {
  readonly abajo: number;
  readonly arriba: number;
}

/**
 * La escala de cada fila, por métrica: las filas de una misma unidad tienen el mismo largo de escala, el de la que más
 * varía o el mínimo de la unidad (`rangoMinimo`, el de TB-04: 2 kg, 2 cm o 4 mm), centrado en lo suyo. Dos unidades
 * nunca comparten un largo.
 */
export function escalasDeLaEvolucion(e: EvolucionDeLasTomas, rangoMinimo: Readonly<Record<string, number>>): ReadonlyMap<string, EscalaDeLaFila> {
  const filas = e.pares.flatMap((p) => p.filas).filter((f) => f.unidad !== null);
  const extremos = new Map<string, [number, number]>();
  for (const f of filas) {
    const vs = f.valores.flatMap((v) => (v && v.unidad === f.unidad ? [v.valor] : []));
    extremos.set(f.metrica, [Math.min(...vs), Math.max(...vs)]);
  }
  const largoDe = new Map<string, number>();
  for (const f of filas) {
    const [a, b] = extremos.get(f.metrica) as [number, number];
    const unidad = f.unidad as string;
    largoDe.set(unidad, Math.max(largoDe.get(unidad) ?? rangoMinimo[unidad] ?? 1, b - a));
  }
  return new Map(
    filas.map((f) => {
      const [a, b] = extremos.get(f.metrica) as [number, number];
      const largo = largoDe.get(f.unidad as string) as number;
      return [f.metrica, { abajo: (a + b) / 2 - largo / 2, arriba: (a + b) / 2 + largo / 2 }] as const;
    }),
  );
}

// ─── La geometría de una fila ───────────────────────────────────────────────────────────────────────────────────

/** El alto de una fila: la franja de los valores escritos arriba y la del dibujo debajo. */
export const ALTO_DE_LA_FILA = 42;
/** Lo que ocupa el valor escrito sobre su punto. */
export const FRANJA_DEL_VALOR = 18;
/** El aire de los costados: el valor de la primera y de la última columna se escribe centrado sobre su punto. */
export const MARGEN_DE_LAS_COLUMNAS = 22;
const ABAJO_DEL_DIBUJO = 6;

/** La x de cada columna: repartidas a lo ancho, la primera y la última a `MARGEN_DE_LAS_COLUMNAS` de los bordes. */
export function xDeLaColumna(i: number, columnas: number, ancho: number): number {
  if (columnas <= 1) return ancho / 2;
  return MARGEN_DE_LAS_COLUMNAS + (i * (ancho - 2 * MARGEN_DE_LAS_COLUMNAS)) / (columnas - 1);
}

export interface PuntoDeLaFila {
  readonly columna: number;
  readonly x: number;
  readonly y: number;
  readonly valor: number;
  /** El estado del dato: la marca la mide `medidaDeMarca` con el lugar de la columna (TB-02). */
  readonly estado: EstadoDeMarca;
  readonly corregido: boolean;
  /** La última columna con valor: su cifra va en la tinta del texto; las demás, en la tenue. */
  readonly ultimo: boolean;
}

export interface GeometriaDeLaFila {
  /** El lugar de cada columna, en px: el `porDia` de `medidaDeMarca`. */
  readonly lugar: number;
  readonly puntos: readonly PuntoDeLaFila[];
  /** Un trazo por tramo de columnas comparables seguidas («M x y L x y…»). */
  readonly trazos: readonly string[];
  /** La x de cada columna sin valor: ahí va «—». */
  readonly huecos: readonly number[];
}

const ESTADO_DE_LA_CLASE: Readonly<Record<DatoDeLaToma['clase'], EstadoDeMarca>> = { MEASURED: 'lleno', REPORTED: 'reportado', DERIVED: 'calculado' };

/**
 * Los puntos, los trazos y los huecos de una fila (TB-02 y TB-03): la marca, por el estado del dato y el lugar de cada
 * columna (`medidaDeMarca`, en quien dibuja); la línea, solo entre columnas comparables seguidas; sin valor, un hueco que
 * no se completa.
 */
export function geometriaDeLaFila(fila: FilaDeLaEvolucion, escala: EscalaDeLaFila, ancho: number, alto = ALTO_DE_LA_FILA): GeometriaDeLaFila {
  const n = fila.valores.length;
  const lugar = n > 1 ? (ancho - 2 * MARGEN_DE_LAS_COLUMNAS) / (n - 1) : ancho;
  const arriba = FRANJA_DEL_VALOR;
  const abajo = alto - ABAJO_DEL_DIBUJO;
  const largo = Math.max(escala.arriba - escala.abajo, 0.001);
  const y = (v: number) => abajo - ((v - escala.abajo) / largo) * (abajo - arriba);
  // Un valor en otra unidad (un cambio de unidad en la fila) no se dibuja en esta escala: queda en la tabla.
  const conValor = fila.valores.flatMap((v, i) => (v && v.unidad === fila.unidad ? [i] : []));
  const ultima = conValor[conValor.length - 1];
  const puntos = conValor.map((i): PuntoDeLaFila => {
    const v = fila.valores[i] as ValorDeLaColumna;
    return { columna: i, x: xDeLaColumna(i, n, ancho), y: y(v.valor), valor: v.valor, estado: ESTADO_DE_LA_CLASE[v.clase], corregido: v.corregido, ultimo: i === ultima };
  });
  const porColumna = new Map(puntos.map((p) => [p.columna, p] as const));
  const trazos = fila.tramos.filter((t) => t.length > 1 && t.every((i) => porColumna.has(i))).map((t) => t.map((i, j) => `${j === 0 ? 'M' : 'L'}${(porColumna.get(i) as PuntoDeLaFila).x},${(porColumna.get(i) as PuntoDeLaFila).y}`).join(' '));
  const huecos = fila.valores.flatMap((v, i) => (porColumna.has(i) ? [] : [xDeLaColumna(i, n, ancho)]));
  return { lugar, puntos, trazos, huecos };
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Un valor con un decimal, como se toma: «89,5». */
export const valorEnPalabras = (x: number): string => numeroConPrecision(x, 1);

/** «−2,5 cm», «+0,4 kg», «sin cambio»: con su signo y su unidad, sin flechas ni colores. */
export function diferenciaConUnidad(x: number, unidad: string): string {
  if (Math.abs(x) < 0.05) return 'sin cambio';
  return `${x > 0 ? '+' : ''}${numeroConPrecision(x, 1)} ${unidad}`;
}

/** Lo que dice una fila al lado de su línea: la diferencia o, sin ella, por qué, en pocas palabras (la nota lo explica). */
export function textoDeLaFila(fila: FilaDeLaEvolucion): string {
  if (fila.unidad === null) return 'sin medir';
  if (fila.diferencia) return diferenciaConUnidad(fila.diferencia.valor, fila.unidad);
  return fila.cambio !== null ? 'sin comparar' : 'una toma';
}

/** El renglón que abre la pieza plegada: el primer par con diferencias, en palabras («Cintura −2,5 cm · pliegue abdominal −3,0 mm»). */
export function resumenDeLaEvolucion(e: EvolucionDeLasTomas): string | null {
  for (const p of e.pares) {
    const con = p.filas.filter((f) => f.diferencia && f.unidad);
    if (con.length === 0) continue;
    const texto = con.map((f) => `${f.nombre.toLowerCase()} ${diferenciaConUnidad((f.diferencia as NonNullable<FilaDeLaEvolucion['diferencia']>).valor, f.unidad as string)}`).join(' · ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
  return null;
}

/** Lo que una fila deja dicho cuando la diferencia no abarca todas las columnas: desde qué toma y por qué. */
export function notaDeLaFila(fila: FilaDeLaEvolucion, fecha: (i: number) => string): string | null {
  if (fila.unidad === null) return `${fila.nombre}: no se midió en estas tomas.`;
  if (fila.cambio !== null) return `${fila.nombre}: cambia el protocolo, el método o la unidad el ${fecha(fila.cambio)}; ${fila.diferencia ? 'la diferencia va desde ahí' : 'desde ahí hay una sola toma, y no se compara con las anteriores'}.`;
  if (fila.diferencia && fila.diferencia.desde > 0) return `${fila.nombre}: la diferencia va desde la toma del ${fecha(fila.diferencia.desde)}, la primera que la midió.`;
  return null;
}

/** Las pocas tomas, en palabras: con una sola columna no hay evolución. */
export const UNA_SOLA_TOMA_CON_MEDIDAS = 'Una sola toma con estas medidas: la evolución aparece con la segunda.';
/** Lo que explica la pieza: las columnas y la vara. */
export const COMO_SE_LEE_LA_EVOLUCION = 'Una columna por toma, con su fecha. Cada medida va en su unidad: los centímetros con los centímetros y los milímetros con los milímetros, a la misma escala.';
