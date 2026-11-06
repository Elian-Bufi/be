/**
 * La composición corporal en kg (WP-TABLERO-ALTA-GAMA TB-24; DL-163 D-11; propuesta, §18.3), sin React, para probarla sin
 * navegador (`apps/web/test/composicion.test.mjs`, TEST-TAG-017). Lee API-ANT-06 tal como responde: el peso medido de cada
 * toma y las masas que calculó el profesional con un método del catálogo (DL-111). No calcula ninguna masa.
 *
 * Las reglas, que no se negocian:
 * - **La columna se parte solo con un método de dos compartimentos** (Durnin y Womersley con Siri, o Faulkner): masa
 *   grasa más masa libre de grasa es el peso de la toma. Se parte cuando la toma tiene las dos masas del mismo método y
 *   suman su peso (con el redondeo de cada masa a 0,1 kg); si no suman, la columna va sin partir y lo dice.
 * - **Un método por gráfico:** las tomas partidas con otro método van sin partir, con su método escrito, y el
 *   profesional elige cuál mira. Dos ecuaciones dan hasta 3 kg de diferencia sobre la misma toma.
 * - **Lo que no suma el peso va en su fila:** la masa muscular esquelética de Lee y la de cuatro componentes no son una
 *   parte de la columna.
 * - **Un cambio de método corta las diferencias:** donde cambia el método, el protocolo o la unidad hay una vertical
 *   rotulada, y ninguna diferencia la cruza.
 * - **Una toma con solo peso es una columna en contorno,** sin partir, y no corta la fila del peso.
 * - **Ubica, no califica:** sin «%», sin rangos ni colores de bien o mal. Las diferencias se escriben con su signo.
 */
import { fechaCivil, nombreDeMetrica, numeroConPrecision, type EvolucionResponse } from '@be/domain';

type DatosDeLaEvolucion = EvolucionResponse['data'];
type ClaseDeDato = 'MEASURED' | 'REPORTED' | 'DERIVED';

export type Familia = 'DURNIN_WOMERSLEY' | 'FAULKNER';

/** Los métodos de dos compartimentos del catálogo: la masa grasa y la libre de grasa de cada uno, que suman el peso. */
export const DOS_COMPARTIMENTOS: Readonly<Record<Familia, { readonly grasa: string; readonly libre: string; readonly nombre: string }>> = {
  DURNIN_WOMERSLEY: { grasa: 'masa-grasa-durnin-womersley', libre: 'masa-libre-de-grasa-durnin-womersley', nombre: 'Durnin y Womersley, con Siri' },
  FAULKNER: { grasa: 'masa-grasa-faulkner', libre: 'masa-libre-de-grasa-faulkner', nombre: 'Faulkner' },
};
const FAMILIAS = Object.keys(DOS_COMPARTIMENTOS) as Familia[];

/** Las masas que no suman el peso: cada una en su fila, nunca en la columna (D-11). */
export const MASAS_QUE_NO_SUMAN: readonly string[] = ['masa-muscular-esqueletica-lee', 'masa-muscular-esqueletica-lee-peso', 'masa-muscular-cuatro-componentes'];

/** Las métricas que la pieza le pide a API-ANT-06 (`metric=`, separadas por comas): ninguna más. */
export const METRICAS_DE_LA_COMPOSICION: readonly string[] = ['peso', ...FAMILIAS.flatMap((f) => [DOS_COMPARTIMENTOS[f].grasa, DOS_COMPARTIMENTOS[f].libre]), ...MASAS_QUE_NO_SUMAN];

/** Cuánto pueden diferir las dos masas del peso de su toma: cada una viene redondeada a 0,1 kg (DL-112). */
export const TOLERANCIA_DE_LA_SUMA = 0.15;

/** API-ANT-06 lee hasta 92 días por pedido: un período más largo se lee en tramos. */
export const DIAS_POR_LECTURA = 92;

export interface DatoDeLaToma {
  readonly valor: number;
  readonly unidad: string;
  readonly clase: ClaseDeDato;
  /** Protocolo, método y unidad: dos datos son comparables si comparten esta clave (REG-06-162). */
  readonly comparable: string;
  readonly protocoloVersionId: string;
  readonly metodoVersionId: string | null;
  readonly corregido: boolean;
}

export interface TomaDeLaComposicion {
  readonly evaluacionId: string;
  /** El día civil de la toma, en la zona del asesorado. */
  readonly fecha: string;
  readonly instante: string;
  /** Lo que trajo API-ANT-06 de esta toma, por métrica. */
  readonly datos: ReadonlyMap<string, DatoDeLaToma>;
}

/** Los tramos de un período largo, de hasta 92 días cada uno, del más viejo al más nuevo. */
export function tramosDeLectura(desde: string, hasta: string, dias = DIAS_POR_LECTURA): { readonly desde: string; readonly hasta: string }[] {
  const tramos: { desde: string; hasta: string }[] = [];
  let fin = hasta;
  while (fin >= desde) {
    const inicio = sumarDias(fin, -(dias - 1));
    tramos.unshift({ desde: inicio < desde ? desde : inicio, hasta: fin });
    fin = sumarDias(inicio, -1);
  }
  return tramos;
}

/**
 * Las tomas de una o más respuestas de API-ANT-06 (una por tramo de lectura), juntas: cada punto va a la evaluación de
 * la que salió. Los grupos de comparabilidad se nombran por respuesta (`cmp-1`…), así que se juntan por lo que son: el
 * protocolo, el método y la unidad.
 */
export function tomasDeLaEvolucion(respuestas: readonly DatosDeLaEvolucion[]): { readonly tomas: readonly TomaDeLaComposicion[]; readonly parcial: boolean } {
  const porEvaluacion = new Map<string, { fecha: string; instante: string; datos: Map<string, DatoDeLaToma>; momentos: Map<string, string> }>();
  const vistos = new Set<string>();
  for (const r of respuestas) {
    for (const serie of r.metrics) {
      const grupos = new Map(serie.comparability.groups.map((g) => [g.comparabilityGroup, g] as const));
      for (const p of serie.series) {
        if (vistos.has(`${serie.metricCode}|${p.sourceId}`)) continue;
        vistos.add(`${serie.metricCode}|${p.sourceId}`);
        const g = grupos.get(p.comparabilityGroup);
        const toma = porEvaluacion.get(p.sourceEvaluationId) ?? { fecha: fechaCivil(p.occurredAt, r.period.timeZone), instante: p.occurredAt, datos: new Map(), momentos: new Map() };
        if (p.occurredAt > toma.instante) toma.instante = p.occurredAt;
        // Dos mediciones de la misma métrica en una toma: queda la que se tomó después.
        const previo = toma.momentos.get(serie.metricCode);
        if (previo === undefined || p.occurredAt >= previo) {
          toma.momentos.set(serie.metricCode, p.occurredAt);
          toma.datos.set(serie.metricCode, {
            valor: p.value,
            unidad: p.unit,
            clase: p.dataClass,
            comparable: `${g?.protocolVersionId ?? '?'}|${g?.methodVersionId ?? ''}|${g?.unit ?? p.unit}`,
            protocoloVersionId: g?.protocolVersionId ?? '?',
            metodoVersionId: g?.methodVersionId ?? null,
            corregido: p.correctionState === 'CORRECTED',
          });
        }
        porEvaluacion.set(p.sourceEvaluationId, toma);
      }
    }
  }
  const tomas = [...porEvaluacion.entries()]
    .map(([evaluacionId, t]) => ({ evaluacionId, fecha: t.fecha, instante: t.instante, datos: t.datos as ReadonlyMap<string, DatoDeLaToma> }))
    .sort((a, b) => a.instante.localeCompare(b.instante) || a.evaluacionId.localeCompare(b.evaluacionId));
  return { tomas, parcial: respuestas.some((r) => r.partialView) };
}

export interface Particion {
  readonly familia: Familia;
  readonly peso: number;
  readonly libre: number;
  readonly grasa: number;
  /** La clave de comparabilidad del par: si cambia entre dos tomas, cambió el método o el protocolo. */
  readonly comparable: string;
  readonly metodoVersionId: string;
  readonly protocoloVersionId: string;
}

/** Por qué una columna no se parte (con el método que se mira). */
export type SinPartir = 'SOLO_PESO' | 'NO_SUMA' | 'OTRO_METODO';

const enKg = (d: DatoDeLaToma | undefined): d is DatoDeLaToma => d !== undefined && d.unidad === 'kg';

/**
 * La toma partida con un método: solo si tiene el peso y las dos masas de ese método, en kg, y las masas suman el peso.
 * Cualquier otra cosa (un método que no suma el peso, como Lee; una sola de las dos masas; masas calculadas sobre otro
 * peso) devuelve `null`: esa columna no se parte.
 */
export function particionDe(toma: TomaDeLaComposicion, familia: Familia): Particion | null {
  const peso = toma.datos.get('peso');
  const grasa = toma.datos.get(DOS_COMPARTIMENTOS[familia].grasa);
  const libre = toma.datos.get(DOS_COMPARTIMENTOS[familia].libre);
  if (!enKg(peso) || !enKg(grasa) || !enKg(libre)) return null;
  if (grasa.valor < 0 || libre.valor < 0) return null;
  if (Math.abs(grasa.valor + libre.valor - peso.valor) > TOLERANCIA_DE_LA_SUMA) return null;
  if (grasa.metodoVersionId === null || libre.metodoVersionId === null) return null;
  return {
    familia,
    peso: peso.valor,
    libre: libre.valor,
    grasa: grasa.valor,
    comparable: `${familia}|${grasa.comparable}|${libre.comparable}`,
    metodoVersionId: grasa.metodoVersionId,
    protocoloVersionId: grasa.protocoloVersionId,
  };
}

/** Las familias con las que alguna toma se parte, empezando por la de la toma partida más reciente. */
export function familiasDe(tomas: readonly TomaDeLaComposicion[]): readonly Familia[] {
  const orden: Familia[] = [];
  for (const t of [...tomas].reverse()) for (const f of FAMILIAS) if (!orden.includes(f) && particionDe(t, f)) orden.push(f);
  return orden;
}

export interface ColumnaDeLaComposicion {
  readonly evaluacionId: string;
  readonly fecha: string;
  readonly peso: number;
  readonly pesoReportado: boolean;
  /** Partida con el método que se mira, o `null`. */
  readonly particion: Particion | null;
  readonly sinPartir: SinPartir | null;
  /** Si la toma se parte con otro método: cuál (va sin partir en este gráfico). */
  readonly otroMetodo: Familia | null;
}

export interface CambioDeMetodo {
  readonly fecha: string;
  readonly motivo: 'METODO' | 'PROTOCOLO' | 'UNIDAD';
}

export interface FilaDelCambio {
  readonly clave: string;
  readonly nombre: string;
  /** `false` para las masas que no suman el peso (Lee): van con su nota. */
  readonly suma: boolean;
  /** Los puntos de la fila; la línea une solo los del mismo `tramo`. */
  readonly puntos: readonly { readonly fecha: string; readonly valor: number; readonly tramo: string }[];
  readonly desde: { readonly fecha: string; readonly valor: number } | null;
  readonly hasta: { readonly fecha: string; readonly valor: number } | null;
  readonly diferencia: number | null;
}

export interface Composicion {
  /** El método que se mira; `null` si ninguna toma del período se parte. */
  readonly familia: Familia | null;
  readonly familias: readonly Familia[];
  readonly columnas: readonly ColumnaDeLaComposicion[];
  readonly cambios: readonly CambioDeMetodo[];
  /** «Cuánto cambió cada parte»: peso, masa grasa y masa libre de grasa con las mismas fechas, y las que no suman. */
  readonly filas: readonly FilaDelCambio[];
  /** Las dos tomas partidas entre las que se escriben las diferencias (las del último tramo del método). */
  readonly entre: { readonly desde: string; readonly hasta: string } | null;
  /** Una sola toma partida en el último tramo: el cambio aparece con la segunda. */
  readonly unaSola: boolean;
}

const redondear = (x: number): number => Math.round(x * 10) / 10;

/** La partición de una toma con el método que se mira o, si no la parte, con otro. */
const particionPreferida = (t: TomaDeLaComposicion, preferida: Familia | null): Particion | null =>
  (preferida ? particionDe(t, preferida) : null) ?? FAMILIAS.map((f) => particionDe(t, f)).find((x): x is Particion => x !== null) ?? null;

/**
 * La clave del tramo de cada toma partida, de cualquier método (con el que se mira primero, si la parte): si cambia entre
 * dos seguidas, hay una vertical, y ninguna diferencia la cruza.
 */
function tramosDeLasPartidas(tomas: readonly TomaDeLaComposicion[], preferida: Familia | null): { readonly porEvaluacion: ReadonlyMap<string, string>; readonly cambios: readonly CambioDeMetodo[] } {
  const porEvaluacion = new Map<string, string>();
  const cambios: CambioDeMetodo[] = [];
  let anterior: Particion | null = null;
  let n = 0;
  for (const t of tomas) {
    const p = particionPreferida(t, preferida);
    if (!p) continue;
    if (anterior && anterior.comparable !== p.comparable) {
      n++;
      const motivo = anterior.familia !== p.familia || anterior.metodoVersionId !== p.metodoVersionId ? 'METODO' : anterior.protocoloVersionId !== p.protocoloVersionId ? 'PROTOCOLO' : 'UNIDAD';
      cambios.push({ fecha: t.fecha, motivo });
    }
    porEvaluacion.set(t.evaluacionId, `${p.familia}#${n}`);
    anterior = p;
  }
  return { porEvaluacion, cambios };
}

/**
 * La pieza entera: las columnas, las verticales de cada cambio de método y las filas de «Cuánto cambió cada parte».
 * `pedida`: el método que eligió el profesional; si no parte ninguna toma del período, el de la toma partida más reciente.
 */
export function composicionDe(tomas: readonly TomaDeLaComposicion[], pedida: Familia | null = null): Composicion {
  const familias = familiasDe(tomas);
  const familia = pedida && familias.includes(pedida) ? pedida : (familias[0] ?? null);
  const { porEvaluacion, cambios } = tramosDeLasPartidas(tomas, familia);
  const columnas: ColumnaDeLaComposicion[] = tomas.flatMap((t) => {
    const peso = t.datos.get('peso');
    if (!enKg(peso)) return [];
    const particion = familia ? particionDe(t, familia) : null;
    const otro = FAMILIAS.find((f) => f !== familia && particionDe(t, f) !== null) ?? null;
    const conMasas = FAMILIAS.some((f) => t.datos.has(DOS_COMPARTIMENTOS[f].grasa) || t.datos.has(DOS_COMPARTIMENTOS[f].libre));
    const sinPartir: SinPartir | null = particion ? null : otro ? 'OTRO_METODO' : conMasas ? 'NO_SUMA' : 'SOLO_PESO';
    return [{ evaluacionId: t.evaluacionId, fecha: t.fecha, peso: peso.valor, pesoReportado: peso.clase === 'REPORTED', particion, sinPartir, otroMetodo: particion ? null : otro }];
  });

  // El último tramo del método que se mira: las diferencias se escriben entre su primera y su última toma.
  const partidas = columnas.filter((c) => c.particion !== null);
  const ultimoTramo = partidas.length ? porEvaluacion.get(partidas[partidas.length - 1]!.evaluacionId) : undefined;
  const delTramo = partidas.filter((c) => porEvaluacion.get(c.evaluacionId) === ultimoTramo);
  const primera = delTramo[0] ?? null;
  const ultima = delTramo[delTramo.length - 1] ?? null;
  const dos = primera !== null && ultima !== null && primera !== ultima;
  const entre = dos ? { desde: primera.fecha, hasta: ultima.fecha } : null;

  const fila = (clave: string, nombre: string, puntos: FilaDelCambio['puntos'], valor: (c: ColumnaDeLaComposicion) => number): FilaDelCambio => ({
    clave,
    nombre,
    suma: true,
    puntos,
    desde: dos ? { fecha: primera.fecha, valor: valor(primera) } : null,
    hasta: dos ? { fecha: ultima.fecha, valor: valor(ultima) } : null,
    diferencia: dos ? redondear(valor(ultima) - valor(primera)) : null,
  });
  const comparableDelPeso = (c: ColumnaDeLaComposicion) => tomas.find((t) => t.evaluacionId === c.evaluacionId)?.datos.get('peso')?.comparable ?? '';
  const filas: FilaDelCambio[] =
    familia === null || partidas.length === 0
      ? []
      : [
          // El peso, de todas las tomas: una toma con solo peso no corta su fila.
          fila('peso', 'Peso', columnas.map((c) => ({ fecha: c.fecha, valor: c.peso, tramo: comparableDelPeso(c) })), (c) => c.peso),
          fila('grasa', 'Masa grasa', partidas.map((c) => ({ fecha: c.fecha, valor: (c.particion as Particion).grasa, tramo: porEvaluacion.get(c.evaluacionId) ?? '' })), (c) => (c.particion as Particion).grasa),
          fila('libre', 'Masa libre de grasa', partidas.map((c) => ({ fecha: c.fecha, valor: (c.particion as Particion).libre, tramo: porEvaluacion.get(c.evaluacionId) ?? '' })), (c) => (c.particion as Particion).libre),
        ];
  // Las que no suman, en su fila, con su propia primera y última toma comparables.
  for (const metrica of MASAS_QUE_NO_SUMAN) {
    const puntos = tomas.flatMap((t) => {
      const d = t.datos.get(metrica);
      return enKg(d) ? [{ fecha: t.fecha, valor: d.valor, tramo: d.comparable }] : [];
    });
    if (puntos.length === 0) continue;
    const ultimoDeLaFila = puntos[puntos.length - 1]!;
    const comparables = puntos.filter((p) => p.tramo === ultimoDeLaFila.tramo);
    const a = comparables[0]!;
    const conDos = comparables.length > 1;
    filas.push({
      clave: metrica,
      nombre: nombreDeMetrica(metrica),
      suma: false,
      puntos,
      desde: conDos ? { fecha: a.fecha, valor: a.valor } : null,
      hasta: conDos ? { fecha: ultimoDeLaFila.fecha, valor: ultimoDeLaFila.valor } : null,
      diferencia: conDos ? redondear(ultimoDeLaFila.valor - a.valor) : null,
    });
  }
  return { familia, familias, columnas, cambios, filas, entre, unaSola: partidas.length > 0 && !dos };
}

export interface LaUltimaToma {
  /** La última toma partida, con su fecha. */
  readonly fecha: string;
  readonly particion: Particion;
  /** La toma partida anterior, del mismo método y protocolo: las diferencias van desde ahí. */
  readonly anterior: { readonly fecha: string; readonly particion: Particion } | null;
  /** La toma partida anterior es de otro método o protocolo: no hay diferencias que escribir. */
  readonly cambioDeMetodo: boolean;
  /** Una toma posterior a la partida, que tiene solo el peso. */
  readonly despues: { readonly fecha: string; readonly peso: number } | null;
}

/** Lo que muestra la tarjeta de Antropometría del Resumen: la barra de la última toma partida y lo que cambió desde la anterior. */
export function laUltimaToma(tomas: readonly TomaDeLaComposicion[]): LaUltimaToma | null {
  const c = composicionDe(tomas);
  if (c.familia === null) return null;
  const { porEvaluacion } = tramosDeLasPartidas(tomas, c.familia);
  const partidas = tomas.flatMap((t) => {
    const p = particionPreferida(t, c.familia);
    return p ? [{ t, p }] : [];
  });
  const ultima = partidas[partidas.length - 1];
  if (!ultima) return null;
  const previa = partidas[partidas.length - 2] ?? null;
  const mismoTramo = previa !== null && porEvaluacion.get(previa.t.evaluacionId) === porEvaluacion.get(ultima.t.evaluacionId);
  const ultimaConPeso = [...c.columnas].reverse()[0];
  return {
    fecha: ultima.t.fecha,
    particion: ultima.p,
    anterior: previa && mismoTramo ? { fecha: previa.t.fecha, particion: previa.p } : null,
    cambioDeMetodo: previa !== null && !mismoTramo,
    despues: ultimaConPeso && ultimaConPeso.evaluacionId !== ultima.t.evaluacionId && ultimaConPeso.fecha >= ultima.t.fecha ? { fecha: ultimaConPeso.fecha, peso: ultimaConPeso.peso } : null,
  };
}

/** Los pesos de las tomas, para la línea de respaldo de la tarjeta cuando ninguna toma tiene un método que los parta. */
export function pesosDeLasTomas(tomas: readonly TomaDeLaComposicion[]): readonly { readonly fecha: string; readonly valor: number; readonly tramo: string }[] {
  return tomas.flatMap((t) => {
    const d = t.datos.get('peso');
    return enKg(d) ? [{ fecha: t.fecha, valor: d.valor, tramo: d.comparable }] : [];
  });
}

/** El tramo más angosto de la escala de una fila: con menos, una diferencia de 0,1 kg se dibujaría como un salto. */
export const RANGO_MINIMO_DE_LA_FILA = 2;

/**
 * «La misma vara» (propuesta, §18.2, regla 4): todas las filas de «Cuánto cambió cada parte» usan el mismo largo de
 * escala, el de la fila que más varía, centrado en lo suyo. Un kilo mide lo mismo en el peso que en la grasa.
 */
export function escalaComun(filas: readonly Pick<FilaDelCambio, 'puntos'>[], minimo = RANGO_MINIMO_DE_LA_FILA): readonly { readonly abajo: number; readonly arriba: number }[] {
  const extremos = filas.map((f) => (f.puntos.length ? [Math.min(...f.puntos.map((p) => p.valor)), Math.max(...f.puntos.map((p) => p.valor))] : [0, 0]) as [number, number]);
  const largo = Math.max(minimo, ...extremos.map(([a, b]) => b - a));
  return extremos.map(([a, b]) => ({ abajo: (a + b) / 2 - largo / 2, arriba: (a + b) / 2 + largo / 2 }));
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Los kilos, siempre con un decimal, como los calcula el método (DL-112): «15,0», no «15». */
export const unDecimal = (x: number): string => numeroConPrecision(x, 1);
const kg = (x: number): string => `${unDecimal(x)} kg`;

/** «+0,1 kg», «−0,4 kg», «sin cambio»: con su signo, sin flechas ni colores. */
export function diferenciaEnPalabras(x: number): string {
  if (Math.abs(x) < 0.05) return 'sin cambio';
  return `${x > 0 ? '+' : ''}${unDecimal(x)} kg`;
}

/** «80,8 kg = 66,6 libre de grasa + 14,2 grasa»: la barra, en palabras. */
export const textoDeLaParticion = (p: Particion): string => `${kg(p.peso)} = ${unDecimal(p.libre)} libre de grasa + ${unDecimal(p.grasa)} grasa`;

/** «peso −0,4 kg · grasa −0,5 kg · libre de grasa +0,1 kg». */
export function textoDeLasDiferencias(a: Particion, b: Particion): string {
  return [`peso ${diferenciaEnPalabras(redondear(b.peso - a.peso))}`, `grasa ${diferenciaEnPalabras(redondear(b.grasa - a.grasa))}`, `libre de grasa ${diferenciaEnPalabras(redondear(b.libre - a.libre))}`].join(' · ');
}

/** Si las diferencias de las masas no suman la del peso por el redondeo de cada una, se dice. */
export function redondeoQueNoCierra(a: Particion, b: Particion): boolean {
  return Math.abs(redondear(b.grasa - a.grasa) + redondear(b.libre - a.libre) - redondear(b.peso - a.peso)) >= 0.05;
}

export const TEXTO_SIN_PARTIR: Readonly<Record<Exclude<SinPartir, 'OTRO_METODO'>, string>> = {
  SOLO_PESO: 'Solo peso: la toma no tiene un método que lo parta',
  NO_SUMA: 'Sin partir: sus masas no suman el peso de la toma',
};

/** Por qué una columna va sin partir, en palabras; `null` si va partida. */
export function textoSinPartir(c: ColumnaDeLaComposicion): string | null {
  if (c.sinPartir === null) return null;
  if (c.sinPartir === 'OTRO_METODO') return `Partida con ${c.otroMetodo ? DOS_COMPARTIMENTOS[c.otroMetodo].nombre : 'otro método'}, en su propio gráfico`;
  return TEXTO_SIN_PARTIR[c.sinPartir];
}

export const TEXTO_DEL_CAMBIO: Readonly<Record<CambioDeMetodo['motivo'], string>> = { METODO: 'Cambia el método', PROTOCOLO: 'Cambia el protocolo', UNIDAD: 'Cambia la unidad' };

/** Lo que dice la pieza cuando el último tramo tiene una sola toma partida. */
export const UNA_SOLA_TOMA = 'Una sola toma con el método: el cambio aparece con la segunda.';
/** Lo que no suma, al lado de su fila. */
export const NO_SUMA_CON_LAS_OTRAS = 'no suma con las otras';

// ─── El período de la pieza, en la pestaña Antropometría ────────────────────────────────────────────────────────

export const ATAJOS_DE_LA_COMPOSICION = [
  { dias: 90, texto: '90 días' },
  { dias: 365, texto: '1 año' },
] as const;
export type DiasDeLaComposicion = (typeof ATAJOS_DE_LA_COMPOSICION)[number]['dias'];
/** El cuerpo cambia despacio y las tomas son cada cuatro a seis semanas: la pieza abre con un año. */
export const DIAS_POR_OMISION_DE_LA_COMPOSICION: DiasDeLaComposicion = 365;
export const MAXIMO_DE_DIAS_DE_LA_COMPOSICION = 366;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** El período de la dirección (`p=90|365`, o `desde` y `hasta`, hasta 366 días); sin nada, el año que termina hoy. */
export function periodoDeLaComposicion(parametros: { get(clave: string): string | null }, hoy: string): { readonly preset: DiasDeLaComposicion | null; readonly desde: string; readonly hasta: string } {
  const desde = parametros.get('desde');
  const hasta = parametros.get('hasta');
  if (desde && hasta && FECHA.test(desde) && FECHA.test(hasta) && desde <= hasta && dias(desde, hasta) <= MAXIMO_DE_DIAS_DE_LA_COMPOSICION) return { preset: null, desde, hasta };
  const atajo = ATAJOS_DE_LA_COMPOSICION.find((a) => String(a.dias) === parametros.get('p'))?.dias ?? DIAS_POR_OMISION_DE_LA_COMPOSICION;
  return { preset: atajo, desde: sumarDias(hoy, -(atajo - 1)), hasta: hoy };
}

function sumarDias(fecha: string, n: number): string {
  return new Date(Date.parse(`${fecha}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
const dias = (desde: string, hasta: string): number => Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000) + 1;
