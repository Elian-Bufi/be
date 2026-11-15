/**
 * WP-COMPARTIR (DEUDA_LEGAJO DL-176; decisión de Dirección del 2026-11-15): compartir es casi por omisión. Lo único que
 * pide un paso aparte es conectar con el profesional (aceptar el vínculo, por Vínculos, el enlace, el QR o el código);
 * después, una sola pantalla de consentimiento trae preseleccionado todo lo que sirve para planificar con conciencia de las
 * otras áreas, y un toque lo registra.
 *
 * Lógica pura, sin base ni red: la usan la API (API-CMP-01 a 03), la APK y sus pruebas (`compartir.test.ts`, TEST-CMP-001
 * a 012). Lo que sostiene:
 * - **qué se puede compartir** (`loQueSePuedeCompartir`): el tratamiento de los datos de salud (A3), la autorización del
 *   área (B2), lo de otras áreas (RES: el resumen y, si el área tiene plan, el plan vigente), la historia anterior de un
 *   área (HIA) y los hábitos (HBT). Cada cosa dice si hoy está dada, si se puede dar y si va preseleccionada;
 * - **qué va preseleccionado** (CMP-D3): lo que la persona nunca decidió. Lo que retiró antes no vuelve preseleccionado;
 * - **qué depende de qué** (CMP-D4): lo de otras áreas, la historia anterior y los hábitos piden el A3 (como sus operaciones
 *   de siempre). La autorización del área, no (API-CON-02 no lo pide);
 * - **qué escribe cada toque**: cada acto con su texto, su versión y su auditoría, como lo escribiría su operación de
 *   siempre, pero solo lo elegido (`renglonesAlCompartir`, `habitosAlCompartir`), sin extender en silencio lo que ya estaba.
 */
import { ALCANCES, type Alcance } from './alcance';
import { laMatrizDejaVerElPlan, type NivelDeResumen, type TextosAceptados } from './contratos-resumenes-compartidos';
import { comoLosRecibe, renglonesDeLaAutorizacion, type ProfesionalDeLaPersona, type RenglonDeLaAutorizacion } from './habitos-de-la-persona';
import { huboOtroAntes } from './historia-anterior';
import { esAreaConPlan, type RenglonDeResumen } from './resumenes-compartidos';

// ─── Lo que se comparte ─────────────────────────────────────────────────────────────────────────────────────────────

/** Las cinco cosas que se pueden compartir, en el orden en que se muestran. */
export const TIPOS_DE_LO_QUE_SE_COMPARTE = ['HEALTH_DATA', 'AREA_CONSENT', 'SUMMARY', 'PREVIOUS_HISTORY', 'HABITS'] as const;
export type TipoDeLoQueSeComparte = (typeof TIPOS_DE_LO_QUE_SE_COMPARTE)[number];

/** Las que piden el A3 vigente (o elegido en el mismo toque), como API-RES-02, API-HIA-02 y API-HBT-03 (CMP-D4). */
export const PIDEN_EL_A3: ReadonlySet<TipoDeLoQueSeComparte> = new Set(['SUMMARY', 'PREVIOUS_HISTORY', 'HABITS']);

/** Las que se pueden retirar una por una con API-CMP-03. El A3, el B2 y la historia anterior tienen su operación de siempre. */
export const SE_RETIRAN_CON_CMP: ReadonlySet<TipoDeLoQueSeComparte> = new Set(['SUMMARY', 'HABITS']);

/** Un componente de vínculo de la persona (también los terminados: dicen si hubo otro profesional antes en un área). */
export interface ComponenteParaCompartir {
  readonly id: string;
  readonly profesionalId: string;
  readonly alcance: Alcance;
  readonly estado: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO';
  /** ISO 8601: cuándo empezó. */
  readonly inicio: string;
}

/** Los ids de los textos vigentes de cada acto (el de B2 depende del perfil de cada profesional: va por componente). */
export interface TextosParaCompartir {
  readonly datosDeSalud: string;
  readonly resumen: string;
  readonly resumenYPlan: string;
  readonly historiaAnterior: string;
  readonly habitos: string;
}

/** Lo que la persona tiene hoy, leído de la base: lo único que necesita la propuesta. */
export interface EstadoParaCompartir {
  readonly componentes: readonly ComponenteParaCompartir[];
  readonly a3: { readonly estado: 'VIGENTE' | 'NUNCA' | 'REVOCADO'; readonly desde: string | null };
  /** El B2 de cada componente que alguna vez lo tuvo: si está vigente, con qué texto lo aceptó y desde cuándo. */
  readonly b2: ReadonlyMap<string, { readonly vigente: boolean; readonly textoId: string | null; readonly desde: string }>;
  /** El texto de B2 aplicable a cada componente sin terminar, según el perfil de su profesional (08 §12.3). */
  readonly textoDeB2: ReadonlyMap<string, string>;
  /** La autorización de lo de otras áreas: su estado, su versión y, si está activa, sus renglones (todos los guardados). */
  readonly resumenes: { readonly estado: 'NUNCA' | 'ACTIVA' | 'RETIRADA'; readonly version: number | null; readonly renglones: readonly RenglonDeResumen[] };
  /** La de los hábitos, y si la persona tiene hábitos para compartir (una versión con alguna respuesta). */
  readonly habitos: { readonly estado: 'NUNCA' | 'ACTIVA' | 'RETIRADA'; readonly version: number | null; readonly renglones: readonly RenglonDeLaAutorizacion[] | null; readonly hayHabitos: boolean };
  /** La última versión de la autorización de la historia anterior de cada componente que la tiene. */
  readonly historia: ReadonlyMap<string, { readonly estado: 'VIGENTE' | 'RETIRADA'; readonly version: number; readonly desde: string }>;
  readonly textos: TextosParaCompartir;
}

interface Base {
  /** La clave estable de la cosa: lo que la app manda en API-CMP-02 y 03. */
  readonly clave: string;
  /** Si hoy está dada. */
  readonly dado: boolean;
  /** Desde cuándo está dada (ISO); `null` si no. */
  readonly desde: string | null;
  /** Si se puede dar ahora con API-CMP-02 (no está dada del todo y nada lo impide). */
  readonly ofrecido: boolean;
  /** Si la pantalla única la trae marcada (solo si se ofrece). */
  readonly preseleccionado: boolean;
  /** El id del texto que se acepta al darla. */
  readonly textoId: string;
}

export type LoQueSeComparte =
  | (Base & { readonly tipo: 'HEALTH_DATA' })
  | (Base & { readonly tipo: 'AREA_CONSENT'; readonly componenteId: string; readonly profesionalId: string; readonly area: Alcance })
  | (Base & { readonly tipo: 'SUMMARY'; readonly profesionalId: string; readonly area: Alcance; readonly nivel: NivelDeResumen; readonly deQuienes: readonly string[] })
  | (Base & { readonly tipo: 'PREVIOUS_HISTORY'; readonly componenteId: string; readonly profesionalId: string; readonly area: Alcance })
  | (Base & { readonly tipo: 'HABITS'; readonly profesionalId: string });

// ─── Las claves ─────────────────────────────────────────────────────────────────────────────────────────────────────

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
/** La forma de una clave (en minúsculas, como la da la API). */
export const FORMA_DE_LA_CLAVE = new RegExp(`^(HEALTH_DATA|AREA_CONSENT:${UUID}|SUMMARY:${UUID}:(NUTRICION|ENTRENAMIENTO|ANTROPOMETRIA)|PREVIOUS_HISTORY:${UUID}|HABITS:${UUID})$`);
/** Las que se retiran con API-CMP-03. */
export const FORMA_DE_LA_CLAVE_QUE_SE_RETIRA = new RegExp(`^(SUMMARY:${UUID}:(NUTRICION|ENTRENAMIENTO|ANTROPOMETRIA)|HABITS:${UUID})$`);

export const claveDe = {
  datosDeSalud: (): string => 'HEALTH_DATA',
  area: (componenteId: string): string => `AREA_CONSENT:${componenteId}`,
  resumen: (profesionalId: string, area: Alcance): string => `SUMMARY:${profesionalId}:${area}`,
  historia: (componenteId: string): string => `PREVIOUS_HISTORY:${componenteId}`,
  habitos: (profesionalId: string): string => `HABITS:${profesionalId}`,
};

/** Lo que dice una clave, para tomar los cerrojos antes de leer (y para API-CMP-03). `null` si no tiene la forma. */
export function leerClave(
  clave: string,
):
  | { readonly tipo: 'HEALTH_DATA' }
  | { readonly tipo: 'AREA_CONSENT' | 'PREVIOUS_HISTORY'; readonly componenteId: string }
  | { readonly tipo: 'SUMMARY'; readonly profesionalId: string; readonly area: Alcance }
  | { readonly tipo: 'HABITS'; readonly profesionalId: string }
  | null {
  if (!FORMA_DE_LA_CLAVE.test(clave)) return null;
  const [tipo, a, b] = clave.split(':');
  if (tipo === 'HEALTH_DATA') return { tipo: 'HEALTH_DATA' };
  if (tipo === 'AREA_CONSENT') return { tipo: 'AREA_CONSENT', componenteId: a! };
  if (tipo === 'PREVIOUS_HISTORY') return { tipo: 'PREVIOUS_HISTORY', componenteId: a! };
  if (tipo === 'SUMMARY') return { tipo: 'SUMMARY', profesionalId: a!, area: b as Alcance };
  return { tipo: 'HABITS', profesionalId: a! };
}

// ─── La propuesta ───────────────────────────────────────────────────────────────────────────────────────────────────

const vivos = (e: EstadoParaCompartir): ComponenteParaCompartir[] => e.componentes.filter((c) => c.estado !== 'FINALIZADO');
const unicos = (xs: readonly string[]): string[] => [...new Set(xs)];
const primero = (xs: readonly string[]): string | null => (xs.length === 0 ? null : [...xs].sort()[0]!);

/** Las áreas que lleva un profesional con la persona (sus componentes sin terminar). */
const areasDe = (profesionalId: string, comps: readonly ComponenteParaCompartir[]): Alcance[] => ALCANCES.filter((a) => comps.some((c) => c.profesionalId === profesionalId && c.alcance === a));

/**
 * El nivel que la pantalla única ofrece de un área para un profesional (CMP-D2): «el resumen y el plan vigente» si el área
 * tiene plan y la matriz lo deja (TA-87, «todos con todos»); si no (Antropometría), el resumen.
 */
export function nivelQueSeOfrece(area: Alcance, areasDelReceptor: readonly Alcance[]): NivelDeResumen {
  return esAreaConPlan(area) && laMatrizDejaVerElPlan(area, areasDelReceptor) ? 'SUMMARY_AND_PLAN' : 'SUMMARY';
}

/** Los renglones que siguen valiendo: los de un componente de quien recibe y uno de origen que hoy siguen sin terminar. */
function renglonesVivos(e: EstadoParaCompartir): RenglonDeResumen[] {
  if (e.resumenes.estado !== 'ACTIVA') return [];
  const ids = new Set(vivos(e).map((c) => c.id));
  return e.resumenes.renglones.filter((r) => ids.has(r.alcanceDeVinculoId) && ids.has(r.origenId));
}

/**
 * Los pares (quién recibe, de qué área) que se pueden compartir. Con un componente al aceptar, solo los que lo tocan: lo de
 * las otras áreas para ese profesional y, recíprocamente, lo de su área para los otros profesionales de la persona (CMP-D2).
 */
function paresDeResumen(comps: readonly ComponenteParaCompartir[], este: ComponenteParaCompartir | null): { readonly receptor: string; readonly area: Alcance }[] {
  const profesionales = unicos(comps.map((c) => c.profesionalId)).sort();
  if (este === null) return profesionales.flatMap((receptor) => ALCANCES.map((area) => ({ receptor, area })));
  return [...ALCANCES.map((area) => ({ receptor: este.profesionalId, area })), ...profesionales.filter((p) => p !== este.profesionalId).map((receptor) => ({ receptor, area: este.alcance }))];
}

/**
 * Lo que la persona puede compartir hoy, con lo que ya está dado. Con `alAceptar` (el componente del vínculo recién
 * aceptado, o el que se revisa desde el vínculo), solo lo que lo toca; sin él, todo (la tarjeta única y «Quién ve qué»).
 * Un componente terminado no tiene nada para dar.
 */
export function loQueSePuedeCompartir(e: EstadoParaCompartir, alAceptar: string | null): LoQueSeComparte[] {
  const comps = vivos(e);
  const este = alAceptar === null ? null : (e.componentes.find((c) => c.id === alAceptar) ?? null);
  if (alAceptar !== null && (este === null || este.estado === 'FINALIZADO')) return [];
  const items: LoQueSeComparte[] = [];

  // El tratamiento de los datos de salud (A3): sin él, ningún profesional ve nada, y lo demás no se puede compartir.
  const a3 = e.a3.estado === 'VIGENTE';
  items.push({ tipo: 'HEALTH_DATA', clave: claveDe.datosDeSalud(), dado: a3, desde: a3 ? e.a3.desde : null, ofrecido: !a3, preseleccionado: e.a3.estado === 'NUNCA', textoId: e.textos.datosDeSalud });

  // La autorización del área (B2), por componente: se ofrece con el vínculo aceptado, si no está vigente con el texto de hoy.
  for (const c of este ? [este] : comps) {
    const texto = e.textoDeB2.get(c.id);
    if (!texto) continue;
    const b2 = e.b2.get(c.id);
    const vigente = b2?.vigente === true;
    const ofrecido = c.estado === 'ACEPTADO' && !(vigente && b2?.textoId === texto);
    if (!vigente && !ofrecido) continue;
    // Revocada antes, no vuelve marcada (CMP-D3); una versión nueva del texto de un B2 vigente, sí.
    const preseleccionado = ofrecido && (b2 === undefined || vigente);
    items.push({ tipo: 'AREA_CONSENT', clave: claveDe.area(c.id), componenteId: c.id, profesionalId: c.profesionalId, area: c.alcance, dado: vigente, desde: vigente ? (b2?.desde ?? null) : null, ofrecido, preseleccionado, textoId: texto });
  }

  // Lo de otras áreas (RES), por par: dado si ya recibe algo; se ofrece si falta algún renglón en el nivel que se ofrece.
  const existentes = renglonesVivos(e);
  for (const { receptor, area } of paresDeResumen(comps, este)) {
    const propios = comps.filter((c) => c.profesionalId === receptor);
    const origenes = comps.filter((c) => c.profesionalId !== receptor && c.alcance === area);
    if (propios.length === 0 || origenes.length === 0 || propios.some((c) => c.alcance === area)) continue;
    const nivel = nivelQueSeOfrece(area, areasDe(receptor, comps));
    const delPar = existentes.filter((r) => r.profesionalId === receptor && r.area === area);
    const completo = propios.every((r) => origenes.every((o) => delPar.some((x) => x.alcanceDeVinculoId === r.id && x.origenId === o.id && x.nivel === nivel)));
    const dado = delPar.length > 0;
    items.push({
      tipo: 'SUMMARY',
      clave: claveDe.resumen(receptor, area),
      profesionalId: receptor,
      area,
      nivel,
      deQuienes: unicos(origenes.map((o) => o.profesionalId)).sort(),
      dado,
      desde: dado ? primero(delPar.map((r) => r.desde)) : null,
      ofrecido: !completo,
      preseleccionado: !completo && e.resumenes.estado !== 'RETIRADA',
      textoId: nivel === 'SUMMARY_AND_PLAN' ? e.textos.resumenYPlan : e.textos.resumen,
    });
  }

  // La historia anterior (HIA), por componente: solo si antes hubo otro profesional en esa área (HA-T06).
  const todos = e.componentes.map((c) => ({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio }));
  for (const c of este ? [este] : comps) {
    if (!huboOtroAntes({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio }, todos)) continue;
    const h = e.historia.get(c.id);
    const dado = h?.estado === 'VIGENTE';
    items.push({ tipo: 'PREVIOUS_HISTORY', clave: claveDe.historia(c.id), componenteId: c.id, profesionalId: c.profesionalId, area: c.alcance, dado, desde: dado ? (h?.desde ?? null) : null, ofrecido: !dado, preseleccionado: !dado && h === undefined, textoId: e.textos.historiaAnterior });
  }

  // Los hábitos (HBT), por profesional, «si corresponde» (CMP-D5): si la persona ya los comparte, o si tiene hábitos.
  for (const p of este ? [este.profesionalId] : unicos(comps.map((c) => c.profesionalId)).sort()) {
    const suyos = comps.filter((c) => c.profesionalId === p).map((c) => ({ alcanceDeVinculoId: c.id, alcance: c.alcance, estado: c.estado as 'ACEPTADO' | 'PAUSADO' }));
    if (suyos.length === 0) continue;
    const como = e.habitos.estado === 'ACTIVA' ? comoLosRecibe(suyos, p, e.habitos.renglones) : { sharing: 'DOES_NOT_RECEIVE' as const, sharedSince: null };
    const dado = como.sharing === 'RECEIVES';
    const ofrecido = !dado && (e.habitos.estado === 'ACTIVA' || e.habitos.hayHabitos);
    if (!dado && !ofrecido) continue;
    const preseleccionado = ofrecido && (e.habitos.estado === 'NUNCA' || (e.habitos.estado === 'ACTIVA' && como.sharing === 'NOT_ASKED'));
    items.push({ tipo: 'HABITS', clave: claveDe.habitos(p), profesionalId: p, dado, desde: dado ? como.sharedSince : null, ofrecido, preseleccionado, textoId: e.textos.habitos });
  }
  return items;
}

// ─── La versión de lo que se vio ────────────────────────────────────────────────────────────────────────────────────

/** cyrb53: un hash corto y estable, sin cripto (la versión no protege nada: solo dice si algo cambió). */
function hashCorto(texto: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * La versión de lo que la persona vio (CMP-D6): cambia si cambia cualquier cosa que la propuesta mira (un vínculo, el A3, un
 * B2, una autorización o si hay hábitos). API-CMP-02 la compara con la de la base, con los cerrojos tomados: si no es la
 * misma, 409 VERSION_CONFLICT y la app vuelve a leer. Los textos no entran: los compara aparte (409 CONSENT_VERSION_STALE).
 */
export function versionDeLoQueSeComparte(e: EstadoParaCompartir): string {
  const ordenadas = (xs: string[]) => xs.sort();
  const partes = [
    `a3:${e.a3.estado}`,
    ...ordenadas(e.componentes.map((c) => `c:${c.id}:${c.estado}`)),
    ...ordenadas([...e.b2.entries()].map(([id, b]) => `b2:${id}:${b.vigente}:${b.textoId ?? ''}`)),
    `res:${e.resumenes.estado}:${e.resumenes.version ?? 0}`,
    `hbt:${e.habitos.estado}:${e.habitos.version ?? 0}:${e.habitos.hayHabitos}`,
    ...ordenadas([...e.historia.entries()].map(([id, h]) => `hia:${id}:${h.version}`)),
  ];
  return `p${hashCorto(partes.join('|'))}`;
}

// ─── La elección ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Si con esta elección hay A3: dado, o elegido en el mismo toque. */
function conElA3(items: readonly LoQueSeComparte[], elegidas: ReadonlySet<string>): boolean {
  const a3 = items.find((i) => i.tipo === 'HEALTH_DATA');
  return a3?.dado === true || elegidas.has(claveDe.datosDeSalud());
}

/** Si una cosa se puede elegir con lo demás que está elegido (lo que pide el A3, solo con el A3). */
export function sePuedeElegir(items: readonly LoQueSeComparte[], elegidas: ReadonlySet<string>, clave: string): boolean {
  const item = items.find((i) => i.clave === clave);
  if (!item || !item.ofrecido) return false;
  return !PIDEN_EL_A3.has(item.tipo) || conElA3(items, elegidas);
}

/** Lo elegido, sin lo que no se puede dar con lo demás (sacar el A3 saca lo que lo pide). */
export function eleccionCoherente(items: readonly LoQueSeComparte[], elegidas: ReadonlySet<string>): Set<string> {
  return new Set([...elegidas].filter((k) => sePuedeElegir(items, elegidas, k)));
}

/** Lo que trae marcado la pantalla única: lo ofrecido y preseleccionado, coherente (CMP-D3). */
export function eleccionInicial(items: readonly LoQueSeComparte[]): Set<string> {
  return eleccionCoherente(items, new Set(items.filter((i) => i.ofrecido && i.preseleccionado).map((i) => i.clave)));
}

/** Los ids de los textos que se aceptan con una elección, sin repetir, en el orden de las cosas. */
export function textosDeLaEleccion(items: readonly LoQueSeComparte[], elegidas: ReadonlySet<string>): string[] {
  return unicos(items.filter((i) => elegidas.has(i.clave)).map((i) => i.textoId));
}

/** Los códigos de los problemas de una elección, en `details.issues` del 422. */
export const CODIGO_DE_PROBLEMA_DE_LA_ELECCION = {
  /** Esa cosa no está en lo que hoy se puede dar: ya está dada, no existe, es ajena o no tiene la forma. */
  NOT_AVAILABLE: 'SHARING_CHOICE_NOT_AVAILABLE',
  /** Falta aceptar el texto de algo elegido. */
  TEXT_REQUIRED: 'SHARING_TEXT_REQUIRED',
} as const;

export type ResultadoDeLaEleccion =
  | { readonly ok: true; readonly elegidos: readonly LoQueSeComparte[] }
  | { readonly ok: false; readonly motivo: 'NO_DISPONIBLE'; readonly issues: readonly { readonly code: string; readonly path: string }[] }
  | { readonly ok: false; readonly motivo: 'FALTA_EL_TEXTO'; readonly issues: readonly { readonly code: string; readonly path: string }[] }
  | { readonly ok: false; readonly motivo: 'SIN_EL_A3' }
  | { readonly ok: false; readonly motivo: 'TEXTO_VIEJO' };

/**
 * Lo que pide API-CMP-02 de la elección, en orden (la versión ya se comparó antes):
 * 1. cada clave tiene que ser algo que hoy se ofrece (si no, 422 SHARING_CHOICE_NOT_AVAILABLE, una por clave: lo ajeno y
 *    lo inexistente dan lo mismo);
 * 2. lo que pide el A3, con el A3 (si no, 403, como sus operaciones de siempre);
 * 3. cada texto aceptado tiene que ser uno de los vigentes de lo que se ofrece (si no, 409 CONSENT_VERSION_STALE), y cada
 *    cosa elegida, con su texto aceptado (si falta, 422 SHARING_TEXT_REQUIRED). La mostrada es la aceptada (08 §12.2).
 */
export function revisarLaEleccion(items: readonly LoQueSeComparte[], claves: readonly string[], textosAceptados: readonly string[]): ResultadoDeLaEleccion {
  const porClave = new Map(items.map((i) => [i.clave, i] as const));
  const noDisponibles = claves.flatMap((k, i) => (porClave.get(k)?.ofrecido === true ? [] : [{ code: CODIGO_DE_PROBLEMA_DE_LA_ELECCION.NOT_AVAILABLE, path: `choices[${i}]` }]));
  if (noDisponibles.length > 0) return { ok: false, motivo: 'NO_DISPONIBLE', issues: noDisponibles };
  const elegidas = new Set(claves);
  const elegidos = items.filter((i) => elegidas.has(i.clave));
  if (elegidos.some((i) => PIDEN_EL_A3.has(i.tipo)) && !conElA3(items, elegidas)) return { ok: false, motivo: 'SIN_EL_A3' };
  const vigentes = new Set(items.filter((i) => i.ofrecido).map((i) => i.textoId));
  if (textosAceptados.some((t) => !vigentes.has(t))) return { ok: false, motivo: 'TEXTO_VIEJO' };
  const aceptados = new Set(textosAceptados);
  const sinTexto = elegidos.flatMap((i) => (aceptados.has(i.textoId) ? [] : [{ code: CODIGO_DE_PROBLEMA_DE_LA_ELECCION.TEXT_REQUIRED, path: `acceptedTextIds` }]));
  if (sinTexto.length > 0) return { ok: false, motivo: 'FALTA_EL_TEXTO', issues: sinTexto.slice(0, 1) };
  return { ok: true, elegidos };
}

// ─── Lo que escribe cada acto ───────────────────────────────────────────────────────────────────────────────────────

/** Un componente sin terminar, con la forma de lo de otras áreas. */
export interface ComponenteDeResumen {
  readonly profesionalId: string;
  readonly alcanceDeVinculoId: string;
  readonly alcance: Alcance;
}

/**
 * Los renglones de la versión nueva de lo de otras áreas (CMP-D7): los que ya valían, tal cual, más los de cada par elegido
 * (por cada componente de quien recibe y cada componente de origen, en el nivel que se ofrece). Uno que ya estaba en ese
 * nivel conserva su «desde»; uno nuevo o que sube, `ahora`. A diferencia de API-RES-02 (la lista completa por permisos),
 * no extiende en silencio un par que la persona no eligió a un componente de origen nuevo.
 */
export function renglonesAlCompartir(p: {
  readonly componentes: readonly ComponenteDeResumen[];
  readonly anteriores: readonly RenglonDeResumen[];
  readonly elegidos: readonly { readonly profesionalId: string; readonly area: Alcance; readonly nivel: NivelDeResumen }[];
  readonly ahora: string;
}): RenglonDeResumen[] {
  const ids = new Set(p.componentes.map((c) => c.alcanceDeVinculoId));
  const renglones = new Map<string, RenglonDeResumen>(p.anteriores.filter((r) => ids.has(r.alcanceDeVinculoId) && ids.has(r.origenId)).map((r): [string, RenglonDeResumen] => [`${r.alcanceDeVinculoId}|${r.origenId}`, r]));
  for (const e of p.elegidos) {
    const propios = p.componentes.filter((c) => c.profesionalId === e.profesionalId);
    const origenes = p.componentes.filter((c) => c.profesionalId !== e.profesionalId && c.alcance === e.area);
    for (const r of propios) {
      for (const o of origenes) {
        const clave = `${r.alcanceDeVinculoId}|${o.alcanceDeVinculoId}`;
        const antes = renglones.get(clave);
        if (antes && antes.nivel === e.nivel) continue;
        renglones.set(clave, { profesionalId: e.profesionalId, alcanceDeVinculoId: r.alcanceDeVinculoId, origenId: o.alcanceDeVinculoId, area: e.area, nivel: e.nivel, desde: p.ahora });
      }
    }
  }
  return [...renglones.values()].sort((a, b) => a.alcanceDeVinculoId.localeCompare(b.alcanceDeVinculoId) || a.origenId.localeCompare(b.origenId));
}

/** Los textos que se aceptan con los pares elegidos, por nivel (un texto por nivel, Dirección, 2026-11-07). */
export function textosDeLosResumenesElegidos(elegidos: readonly { readonly nivel: NivelDeResumen }[], textos: Pick<TextosParaCompartir, 'resumen' | 'resumenYPlan'>): TextosAceptados {
  return { summary: elegidos.some((e) => e.nivel === 'SUMMARY') ? textos.resumen : null, summaryAndPlan: elegidos.some((e) => e.nivel === 'SUMMARY_AND_PLAN') ? textos.resumenYPlan : null };
}

/** Retirar un par (API-CMP-03): los renglones que valen, sin los de ese profesional y esa área. */
export function renglonesSinElPar(anteriores: readonly RenglonDeResumen[], componentes: readonly ComponenteDeResumen[], profesionalId: string, area: Alcance): RenglonDeResumen[] {
  const ids = new Set(componentes.map((c) => c.alcanceDeVinculoId));
  return anteriores.filter((r) => ids.has(r.alcanceDeVinculoId) && ids.has(r.origenId) && !(r.profesionalId === profesionalId && r.area === area));
}

/**
 * Los renglones de la versión nueva de los hábitos (CMP-D7): los que hoy los reciben siguen y se suman los elegidos. Los
 * `declinados` quedan nombrados como que no los ven, si quien llama sabe que la persona les dijo que no en este acto
 * (API-CMP-02 no lo sabe y no manda ninguno). Quien no se nombró sigue como estaba (o `NOT_ASKED`).
 */
export function habitosAlCompartir(p: {
  readonly profesionales: readonly ProfesionalDeLaPersona[];
  readonly anteriores: readonly RenglonDeLaAutorizacion[] | null;
  readonly elegidos: readonly string[];
  readonly declinados: readonly string[];
  readonly ahora: string;
}): RenglonDeLaAutorizacion[] {
  const vivos = new Set(p.profesionales.map((x) => x.profesionalId));
  const reciben = (p.anteriores ?? []).filter((r) => r.incluido && vivos.has(r.profesionalId)).map((r) => r.profesionalId);
  const incluidos = new Set([...reciben, ...p.elegidos]);
  return renglonesDeLaAutorizacion({ profesionales: p.profesionales, anteriores: p.anteriores, incluidos, declinados: new Set(p.declinados.filter((d) => !incluidos.has(d))), ahora: p.ahora });
}

/** Retirar los hábitos a un profesional (API-CMP-03): los demás siguen; él queda como que no los ve. Sin nadie, `null` (retirada). */
export function habitosSinElProfesional(p: { readonly profesionales: readonly ProfesionalDeLaPersona[]; readonly anteriores: readonly RenglonDeLaAutorizacion[]; readonly profesionalId: string; readonly ahora: string }): RenglonDeLaAutorizacion[] | null {
  const vivos = new Set(p.profesionales.map((x) => x.profesionalId));
  const incluidos = new Set(p.anteriores.filter((r) => r.incluido && vivos.has(r.profesionalId) && r.profesionalId !== p.profesionalId).map((r) => r.profesionalId));
  if (incluidos.size === 0) return null;
  return renglonesDeLaAutorizacion({ profesionales: p.profesionales, anteriores: p.anteriores, incluidos, declinados: new Set([p.profesionalId]), ahora: p.ahora });
}
