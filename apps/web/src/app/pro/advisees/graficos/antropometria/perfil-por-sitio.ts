/**
 * GR-18 · Perfil por sitio entre dos tomas (WP-GRAFICOS fase 2, rama C; DL-174): ¿en qué sitios cambió y en cuáles no?
 *
 * - Una fila por sitio (pliegues, perímetros y diámetros), en el orden del catálogo de medidas, que es el de la planilla
 *   de la toma (GR-T46). Los valores de las dos tomas unidos por un segmento: la diferencia entre dos tomas, no una
 *   interpolación en el tiempo.
 * - **Solo dentro del mismo grupo de comparabilidad** (protocolo, método y unidad: REG-06-162). Si el sitio se tomó con
 *   otro protocolo, método o unidad, no se une ni se resta, y se dice.
 * - **Un sitio que no se midió en una de las dos tomas es un hueco**: se dibuja el valor que hay y se dice cuál falta.
 * - Cada familia con su eje común (los pliegues en mm, los perímetros en cm): un eje por fila agrandaría cualquier
 *   diferencia chica. La diferencia es una resta con su signo y su unidad, sin flechas ni colores.
 * - BE no tiene cargado el error de medición de quien mide (GR-D4), y el cambio de un sitio no se atribuye al ejercicio de
 *   esa zona (no hay reducción localizada).
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { cantidad, compararPorCatalogo, FAMILIA_DE_METRICA, nombreDeMetrica, textoDeDiferenciaAntropometrica } from '@be/domain';
import { extremosDelCarril } from '../carriles';
import type { MarcasDelEje } from '../ejes';
import { diaYMes } from '../nutricion-y-cuerpo/lienzo';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';
import type { ObservacionDeLaToma } from './tomas';

export type FamiliaDelSitio = 'PLIEGUES' | 'PERIMETROS' | 'DIAMETROS';

const ORDEN_DE_LAS_FAMILIAS: readonly FamiliaDelSitio[] = ['PLIEGUES', 'PERIMETROS', 'DIAMETROS'];

/** La familia de un sitio, o `null` si la medida no es un sitio (el peso, la talla, un resultado calculado). */
export function familiaDelSitio(metrica: string): FamiliaDelSitio | null {
  const familia: string | undefined = FAMILIA_DE_METRICA[metrica];
  return familia === 'PLIEGUES' || familia === 'PERIMETROS' || familia === 'DIAMETROS' ? familia : null;
}

export interface TomaDelPerfil {
  readonly evaluacionId: string;
  readonly fecha: string;
  readonly en: string;
  /** «T1», «T2»…: el orden entre las tomas con sitios, de la más vieja a la más nueva. */
  readonly etiqueta: string;
  readonly sitios: number;
}

/** Las tomas que tienen algún sitio medido, de la más vieja a la más nueva. */
export function tomasConSitios(observaciones: readonly ObservacionDeLaToma[]): TomaDelPerfil[] {
  const porToma = new Map<string, { fecha: string; en: string; sitios: Set<string> }>();
  for (const o of observaciones) {
    if (familiaDelSitio(o.metrica) === null) continue;
    const t = porToma.get(o.evaluacionId) ?? { fecha: o.fecha, en: o.en, sitios: new Set<string>() };
    t.sitios.add(o.metrica);
    if (o.en < t.en) {
      t.en = o.en;
      t.fecha = o.fecha;
    }
    porToma.set(o.evaluacionId, t);
  }
  return [...porToma.entries()]
    .sort(([a, x], [b, y]) => x.en.localeCompare(y.en) || a.localeCompare(b))
    .map(([evaluacionId, t], i) => ({ evaluacionId, fecha: t.fecha, en: t.en, etiqueta: `T${i + 1}`, sitios: t.sitios.size }));
}

/** Las dos tomas que se comparan si no se eligió otra cosa: la más nueva y la anterior. */
export function tomasPorOmision(tomas: readonly TomaDelPerfil[]): { readonly antes: string; readonly despues: string } | null {
  if (tomas.length < 2) return null;
  return { antes: tomas[tomas.length - 2]!.evaluacionId, despues: tomas[tomas.length - 1]!.evaluacionId };
}

export interface ValorDelSitio {
  readonly valor: number;
  readonly unidad: string;
  readonly clase: ObservacionDeLaToma['clase'];
  readonly comparable: string;
}

export type EstadoDelSitio = 'PAR' | 'SOLO_ANTES' | 'SOLO_DESPUES' | 'OTRO_GRUPO';

export interface FilaDelPerfil {
  readonly metrica: string;
  readonly nombre: string;
  readonly antes: ValorDelSitio | null;
  readonly despues: ValorDelSitio | null;
  readonly estado: EstadoDelSitio;
  /** La resta con su signo («−2,0 mm»), solo en un par del mismo grupo. */
  readonly diferencia: string | null;
}

export interface GrupoDelPerfil {
  readonly clave: string;
  readonly familia: FamiliaDelSitio;
  /** «Pliegues», «Perímetros», «Diámetros». */
  readonly nombre: string;
  readonly unidad: string;
  readonly filas: readonly FilaDelPerfil[];
  /** El eje común de la familia: abarca los valores de las dos tomas en esta unidad. */
  readonly extremos: MarcasDelEje;
}

export interface PerfilPorSitio {
  readonly antes: TomaDelPerfil;
  readonly despues: TomaDelPerfil;
  readonly grupos: readonly GrupoDelPerfil[];
  readonly pares: number;
  readonly sinPar: number;
  readonly descripcion: string;
}

const ultimaDeLaToma = (observaciones: readonly ObservacionDeLaToma[], metrica: string, evaluacionId: string): ValorDelSitio | null => {
  const deLaToma = observaciones.filter((o) => o.metrica === metrica && o.evaluacionId === evaluacionId);
  const o = deLaToma[deLaToma.length - 1];
  return o ? { valor: o.valor, unidad: o.unidad, clase: o.clase, comparable: o.comparable } : null;
};

/**
 * El perfil por sitio entre dos tomas; `null` si alguna no está o son la misma. Las dos se ordenan en el tiempo: la
 * diferencia es siempre la de la más nueva menos la de la anterior, se elijan en el orden que se elijan.
 */
export function perfilPorSitio(observaciones: readonly ObservacionDeLaToma[], tomas: readonly TomaDelPerfil[], primeraId: string, segundaId: string): PerfilPorSitio | null {
  const primera = tomas.find((t) => t.evaluacionId === primeraId);
  const segunda = tomas.find((t) => t.evaluacionId === segundaId);
  if (!primera || !segunda || primeraId === segundaId) return null;
  const [antes, despues] = primera.en <= segunda.en ? [primera, segunda] : [segunda, primera];
  const antesId = antes.evaluacionId;
  const despuesId = despues.evaluacionId;
  const sitios = [...new Set(observaciones.filter((o) => familiaDelSitio(o.metrica) !== null && (o.evaluacionId === antesId || o.evaluacionId === despuesId)).map((o) => o.metrica))].sort(compararPorCatalogo);
  const grupos = new Map<string, { familia: FamiliaDelSitio; unidad: string; filas: FilaDelPerfil[] }>();
  for (const metrica of sitios) {
    const a = ultimaDeLaToma(observaciones, metrica, antesId);
    const d = ultimaDeLaToma(observaciones, metrica, despuesId);
    const estado: EstadoDelSitio = a && d ? (a.comparable === d.comparable ? 'PAR' : 'OTRO_GRUPO') : a ? 'SOLO_ANTES' : 'SOLO_DESPUES';
    const diferencia = estado === 'PAR' && a && d ? textoDeDiferenciaAntropometrica({ delta: Number((d.valor - a.valor).toPrecision(12)), unidad: d.unidad }) : null;
    const familia = familiaDelSitio(metrica) as FamiliaDelSitio;
    const unidad = (d ?? a)!.unidad;
    const clave = `${familia}|${unidad}`;
    const grupo = grupos.get(clave) ?? { familia, unidad, filas: [] };
    grupo.filas.push({ metrica, nombre: nombreDeMetrica(metrica), antes: a, despues: d, estado, diferencia });
    grupos.set(clave, grupo);
  }
  const ordenados = [...grupos.entries()].sort(([, x], [, y]) => ORDEN_DE_LAS_FAMILIAS.indexOf(x.familia) - ORDEN_DE_LAS_FAMILIAS.indexOf(y.familia) || x.unidad.localeCompare(y.unidad));
  const listos = ordenados.map(([clave, g]): GrupoDelPerfil => {
    const valores = g.filas.flatMap((f) => [f.antes, f.despues].flatMap((v) => (v && v.unidad === g.unidad ? [v.valor] : [])));
    return { clave, familia: g.familia, nombre: C.perfil.familia[g.familia] ?? g.familia, unidad: g.unidad, filas: g.filas, extremos: extremosDelCarril(valores, g.unidad, { enteros: false }) };
  });
  const filas = listos.flatMap((g) => g.filas);
  const pares = filas.filter((f) => f.estado === 'PAR').length;
  const sinPar = filas.length - pares;
  return { antes, despues, grupos: listos, pares, sinPar, descripcion: C.perfil.descripcion(diaYMes(antes.fecha, despues.fecha), diaYMes(despues.fecha), pares, sinPar) };
}

const valorEnPalabras = (v: ValorDelSitio): string => `${cantidad(v.valor, v.unidad)}${v.clase === 'REPORTED' ? ' (reportado por la persona)' : ''}`;

/** Lo que dice una fila en la tabla: los dos valores y la diferencia, o qué falta y por qué no se resta. */
export function filaEnPalabras(f: FilaDelPerfil, antes: TomaDelPerfil, despues: TomaDelPerfil): { readonly antes: string; readonly despues: string; readonly diferencia: string } {
  return {
    antes: f.antes ? valorEnPalabras(f.antes) : C.perfil.soloDespues(diaYMes(antes.fecha, despues.fecha)),
    despues: f.despues ? valorEnPalabras(f.despues) : C.perfil.soloAntes(diaYMes(despues.fecha)),
    diferencia: f.diferencia ?? (f.estado === 'OTRO_GRUPO' ? C.perfil.otroGrupo : '—'),
  };
}

/** La x de un valor en el eje común de su familia, en una caja de `izquierda` a `derecha`. */
export function xDelValor(valor: number, extremos: GrupoDelPerfil['extremos'], izquierda: number, derecha: number): number {
  const rango = extremos.arriba - extremos.abajo || 1;
  return izquierda + ((valor - extremos.abajo) / rango) * (derecha - izquierda);
}

// ─── La pasada visual (GR-VC07) ─────────────────────────────────────────────────────────────────

/** El ancho aproximado de una letra de 12,5 px, para medir el nombre de un sitio (el de la base). */
const ANCHO_DE_UNA_LETRA = 6.6;
const ALTO_DE_UNA_FILA = 26;
const ALTO_DE_UN_RENGLON = 15;

/**
 * El nombre de un sitio en uno o dos renglones, **entero** (nunca cortado con «…»): si no entra en `letras`, se parte en el
 * espacio que deja los dos renglones más parejos.
 */
export function nombreEnRenglones(nombre: string, letras: number): string[] {
  if (nombre.length <= letras) return [nombre];
  const espacios = [...nombre.matchAll(/ /g)].map((m) => m.index ?? 0);
  if (espacios.length === 0) return [nombre];
  const corte = espacios.reduce((mejor, i) => (Math.abs(i - nombre.length / 2) < Math.abs(mejor - nombre.length / 2) ? i : mejor), espacios[0]!);
  return [nombre.slice(0, corte), nombre.slice(corte + 1)];
}

/**
 * Cómo se acomodan las filas de una familia en un ancho: la columna de los nombres mide lo que el nombre más largo (entre
 * 120 px y el 42 % del ancho) y cada fila, uno o dos renglones.
 */
export function filasDelGrupo(g: Pick<GrupoDelPerfil, 'filas'>, ancho: number): { readonly nombres: number; readonly alto: number; readonly filas: readonly { readonly fila: FilaDelPerfil; readonly y: number; readonly renglones: readonly string[] }[] } {
  const largo = Math.max(...g.filas.map((f) => f.nombre.length), 1);
  const nombres = Math.round(Math.min(Math.max(120, largo * ANCHO_DE_UNA_LETRA + 4), Math.max(120, ancho * 0.42)));
  const letras = Math.max(8, Math.floor(nombres / ANCHO_DE_UNA_LETRA));
  let y = 0;
  const filas = g.filas.map((fila) => {
    const renglones = nombreEnRenglones(fila.nombre, letras);
    const alto = ALTO_DE_UNA_FILA + (renglones.length - 1) * ALTO_DE_UN_RENGLON;
    const centro = y + alto / 2;
    y += alto;
    return { fila, y: centro, renglones };
  });
  return { nombres, alto: y, filas };
}

/** La línea tenue: qué familias y en qué unidades, y entre qué tomas («pliegues en mm y perímetros en cm · entre…»). */
export function detalleDelPerfil(p: Pick<PerfilPorSitio, 'grupos' | 'antes' | 'despues'>): string {
  const familias = p.grupos.map((g) => C.perfil.familiaEnElDetalle(g.nombre.toLowerCase(), g.unidad));
  const lista = familias.length <= 1 ? (familias[0] ?? '') : `${familias.slice(0, -1).join(', ')} y ${familias[familias.length - 1]}`;
  return C.perfil.detalle(lista, diaYMes(p.antes.fecha, p.despues.fecha), diaYMes(p.despues.fecha));
}

/**
 * Lo que se ve debajo del perfil y lo que va a «Cómo leerlo» (§5 manda sobre la guía): a la vista, el error de medición
 * (§5.7), los sitios sin par o de otro grupo (lo que no se compara) y lo de otro profesional; en «Cómo leerlo», qué es la
 * línea, que no hay reducción localizada (la explicación fisiológica, con su fuente: §5.1), el eje común y el orden.
 */
export function notasDelPerfil(p: Pick<PerfilPorSitio, 'grupos'>, o: { readonly parcial: boolean; readonly enTramos: boolean }): { readonly notas: string[]; readonly aclaraciones: string[] } {
  const filas = p.grupos.flatMap((g) => g.filas);
  const sinPar = filas.filter((f) => f.estado === 'SOLO_ANTES' || f.estado === 'SOLO_DESPUES').length;
  const otroGrupo = filas.filter((f) => f.estado === 'OTRO_GRUPO').length;
  return {
    notas: [C.sinErrorDeMedicion, ...(sinPar > 0 ? [C.perfil.sinPar(sinPar)] : []), ...(otroGrupo > 0 ? [C.perfil.otroGrupoEnLaNota(otroGrupo)] : []), ...(o.parcial ? [C.parcial] : [])],
    aclaraciones: [C.perfil.segmento, C.perfil.sinReduccionLocalizada, C.perfil.ejeComun, C.perfil.ordenAnatomico, ...(o.enTramos ? [C.leidoEnTramos] : [])],
  };
}
