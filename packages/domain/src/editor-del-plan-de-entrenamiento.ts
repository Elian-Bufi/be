/**
 * Entrenamiento · La versión en preparación (WP-ESCRITORIO-AREAS, parte 8; maqueta 28): lo que el editor del plan de
 * entrenamiento resuelve sin dibujar nada. Qué bloque, qué microciclo y qué sesión se miran según la dirección; qué dice
 * un ejercicio plegado, con lo escrito y todavía sin guardar; dónde está un problema, para poder llevar hasta ahí; qué
 * no deja guardar, antes de pedirle nada a la API; cómo se lee y qué escribe la celda de un objetivo de una serie; cómo se
 * lee un descanso escrito; y qué entra al activar.
 *
 * Las posiciones son las de la pantalla (desde cero): lo que se acaba de agregar todavía no tiene número de orden, y la
 * dirección las nombra desde uno («sesion=2» es la segunda sesión de lo que se mira, guardada o no). Las reglas de la
 * dirección son las del editor del plan de comidas (`editor-del-plan-de-nutricion.ts`): los dos editores hacen lo mismo.
 */
import type { PrescripcionConObjetivos } from './contratos-entrenamiento-por-serie';
import { cantidadDeSeries } from './copy-entrenamiento';
import { COPY_ENTRENAMIENTO_POR_SERIE } from './copy-entrenamiento-por-serie';
import { comidasAbiertasEnElEditor, pedidoDeComidasDelEditor, posicionPedida, type ProblemaDelEditor } from './editor-del-plan-de-nutricion';
import { renglonDelEjercicio } from './lectura-del-plan-de-entrenamiento';
import { objetivosEfectivos, type SerieParaResolver } from './objetivos-por-serie';

/** Lo que el editor necesita saber de la estructura: nombres, sesiones y lo que cada ejercicio pide. */
interface SerieDelEditor extends SerieParaResolver {
  readonly note?: string | null;
}
interface ParametroDelEditor {
  readonly label: string;
  readonly value: string | number;
}
export interface EjercicioDelEditor {
  readonly intensity: { readonly criterion: string; readonly target: { readonly value: number; readonly reference?: { readonly description: string } | null } } | null;
  readonly suggestedLoad?: { readonly value: number; readonly unit: 'kg' | 'lb' } | null;
  readonly restSeconds?: number | null;
  readonly professionalParameters?: readonly ParametroDelEditor[];
  readonly sets: readonly SerieDelEditor[];
}
interface SesionDelEditor {
  readonly label: string;
  readonly prescriptions: readonly EjercicioDelEditor[];
}
interface MicrocicloDelEditor {
  readonly label: string;
  readonly sessions: readonly SesionDelEditor[];
}
interface BloqueDelEditor {
  readonly label: string;
  readonly sessions?: readonly SesionDelEditor[];
  readonly microcycles?: readonly MicrocicloDelEditor[];
}

// ─── Lo que se mira, según la dirección ─────────────────────────────────────────────────────────────────────────

/** Lo que pide la dirección de la página, por posición desde uno; `null`: lo primero. */
export interface PedidoDelEditorDeEntrenamiento {
  readonly bloque: string | null;
  readonly microciclo: string | null;
  readonly sesion: string | null;
}

/** Las posiciones (desde cero) de lo que se mira. `-1`: no hay; en el microciclo, además, que el bloque no los usa. */
export interface LoQueSeMiraEnElEditor {
  readonly bloque: number;
  readonly conMicrociclos: boolean;
  readonly microciclo: number;
  /** Cuántas sesiones hay donde se elige: las del microciclo, o las del bloque. */
  readonly sesiones: number;
  readonly sesion: number;
}

/**
 * El bloque, el microciclo y la sesión que se editan. Un bloque organiza sus sesiones bajo microciclos o directamente,
 * nunca las dos cosas (09v10:281-283): si tiene microciclos, las sesiones son las del elegido. Lo que la dirección pide
 * y la versión no tiene cae en lo primero: no deja la pantalla vacía.
 */
export function loQueSeMiraEnElEditor<B extends BloqueDelEditor>(bloques: readonly B[], pedido: PedidoDelEditorDeEntrenamiento): LoQueSeMiraEnElEditor {
  const i = posicionPedida(bloques.length, pedido.bloque);
  const bloque = i >= 0 ? bloques[i] : undefined;
  const microciclos = bloque?.microcycles ?? [];
  const conMicrociclos = microciclos.length > 0;
  const j = conMicrociclos ? posicionPedida(microciclos.length, pedido.microciclo) : -1;
  const sesiones = conMicrociclos ? (microciclos[j]?.sessions ?? []) : (bloque?.sessions ?? []);
  return { bloque: i, conMicrociclos, microciclo: j, sesiones: sesiones.length, sesion: posicionPedida(sesiones.length, pedido.sesion) };
}

/**
 * Los ejercicios abiertos de la sesión que se mira (posiciones desde cero). **Al entrar, ninguno:** la sesión entera se
 * lee en un renglón por ejercicio, y se abre el que se va a tocar. La dirección los nombra desde uno, separados por
 * punto («1.3»), como los del plan activo; lo que la sesión no tiene —y el «ninguno» del plan activo— se ignora.
 */
export function ejerciciosAbiertosEnElEditor(cuantos: number, pedido: string | null): ReadonlySet<number> {
  return comidasAbiertasEnElEditor(cuantos, pedido);
}

/** Lo que se escribe en la dirección: nada, si no hay ninguno abierto (que es como se entra). */
export function pedidoDeEjerciciosDelEditor(abiertos: ReadonlySet<number>): string | null {
  return pedidoDeComidasDelEditor(abiertos);
}

// ─── Dónde está un problema ─────────────────────────────────────────────────────────────────────────────────────

/** Dónde está un problema: las posiciones (desde cero) de su bloque, su microciclo, su sesión, su ejercicio y su serie. */
export interface LugarDelProblemaDeEntrenamiento {
  readonly bloque: number | null;
  /** `null` si la sesión cuelga del bloque, sin microciclo. */
  readonly microciclo: number | null;
  readonly sesion: number | null;
  readonly ejercicio: number | null;
  readonly serie: number | null;
}

const RUTA = /^blocks\[(\d+)\](?:\.microcycles\[(\d+)\])?(?:\.sessions\[(\d+)\])?(?:\.prescriptions\[(\d+)\])?(?:\.sets\[(\d+)\])?/;

/**
 * Lee la ruta de un problema. La validación la da con corchetes («blocks[0].sessions[1]»); una falla de forma del
 * pedido, con puntos y con su prefijo («changes.blocks.0.sessions.1»): las dos dicen lo mismo.
 */
export function lugarDelProblemaDeEntrenamiento(ruta: string): LugarDelProblemaDeEntrenamiento {
  const m = RUTA.exec(ruta.replace(/^changes\./, '').replace(/\.(\d+)/g, '[$1]'));
  const n = (x: string | undefined): number | null => (x === undefined ? null : Number(x));
  return m ? { bloque: n(m[1]), microciclo: n(m[2]), sesion: n(m[3]), ejercicio: n(m[4]), serie: n(m[5]) } : { bloque: null, microciclo: null, sesion: null, ejercicio: null, serie: null };
}

/**
 * La ubicación de un problema, dicha sin rutas técnicas: «Bloque 1 → Semana 1 → Sesión A → Ejercicio 2 → Serie 3»
 * (B10-06:571-577). El bloque, el microciclo y la sesión van con su nombre; lo que no lo tiene, por lo que es y su
 * número. Lo que no se puede ubicar es del plan entero.
 */
export function ubicacionDelProblemaDeEntrenamiento(ruta: string, bloques: readonly BloqueDelEditor[]): string {
  const l = lugarDelProblemaDeEntrenamiento(ruta);
  if (l.bloque === null) return 'Plan';
  const bloque = bloques[l.bloque];
  const partes = [bloque?.label.trim() || `Bloque ${l.bloque + 1}`];
  const microciclo = l.microciclo !== null ? bloque?.microcycles?.[l.microciclo] : undefined;
  if (l.microciclo !== null) partes.push(microciclo?.label.trim() || `Microciclo ${l.microciclo + 1}`);
  const sesiones = l.microciclo !== null ? microciclo?.sessions : bloque?.sessions;
  if (l.sesion !== null) partes.push(sesiones?.[l.sesion]?.label.trim() || `Sesión ${l.sesion + 1}`);
  if (l.ejercicio !== null) partes.push(`Ejercicio ${l.ejercicio + 1}`);
  if (l.serie !== null) partes.push(`Serie ${l.serie + 1}`);
  return partes.join(' → ');
}

/** Cuántos problemas hay dentro de un ejercicio: los que se ubicaron en él o en una de sus series. */
export function problemasDelEjercicio(rutas: readonly string[], lugar: { readonly bloque: number; readonly microciclo: number | null; readonly sesion: number; readonly ejercicio: number }): number {
  return rutas.filter((r) => {
    const l = lugarDelProblemaDeEntrenamiento(r);
    return l.bloque === lugar.bloque && l.microciclo === lugar.microciclo && l.sesion === lugar.sesion && l.ejercicio === lugar.ejercicio;
  }).length;
}

// ─── Lo que no deja guardar ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Los problemas que el editor encuentra solo, antes de pedirle nada a la API. Lo escrito que no es un número viaja como
 * NaN, y al armar el pedido un NaN se vuelve «nada»: en un descanso o en el RIR de una serie, «nada» quiere decir otra
 * cosa («sin pausa indicada», «Sin objetivo en esta serie») y se guardaría en silencio. Por eso el editor no lo manda.
 */
export const PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO = {
  faltaElNombre: 'NAME_REQUIRED',
  faltaElObjetivo: 'INTENSITY_TARGET_REQUIRED',
  repeticionesIlegibles: 'REPETITIONS_NOT_READABLE',
  cargaIlegible: 'LOAD_NOT_READABLE',
  rirIlegible: 'RIR_NOT_READABLE',
  descansoIlegible: 'REST_NOT_READABLE',
  parametroIncompleto: 'PARAMETER_INCOMPLETE',
} as const;

const P = PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO;
const noSeEntiende = (n: number | null | undefined): boolean => typeof n === 'number' && Number.isNaN(n);
const sinNombre = (x: { readonly label: string }): boolean => x.label.trim() === '';
const incompleto = (q: ParametroDelEditor): boolean => q.label.trim() === '' || (typeof q.value === 'string' ? q.value.trim() === '' : !Number.isFinite(q.value));

/**
 * Lo que no deja guardar de un ejercicio, en el orden en que se ve: lo general y después cada serie. `ruta` es la del
 * ejercicio. Con un criterio elegido, su objetivo no es opcional (09v10:339-340): vacío o mal escrito, falta. Un campo
 * vacío de los demás no es un problema: quiere decir que ese dato no se indica. Un parámetro nace vacío y el contrato
 * pide su nombre y su valor.
 */
export function loQueNoDejaGuardarDelEjercicio(p: EjercicioDelEditor, ruta: string): readonly ProblemaDelEditor[] {
  const problemas: ProblemaDelEditor[] = [];
  if (noSeEntiende(p.intensity?.target.value)) problemas.push({ code: P.faltaElObjetivo, path: ruta });
  if (noSeEntiende(p.suggestedLoad?.value)) problemas.push({ code: P.cargaIlegible, path: ruta });
  if (noSeEntiende(p.restSeconds)) problemas.push({ code: P.descansoIlegible, path: ruta });
  (p.professionalParameters ?? []).forEach((q, n) => {
    if (incompleto(q)) problemas.push({ code: P.parametroIncompleto, path: `${ruta}.professionalParameters[${n}]` });
  });
  p.sets.forEach((s, n) => {
    const deLaSerie = `${ruta}.sets[${n}]`;
    const r = s.repetitions;
    if (r && ('value' in r ? noSeEntiende(r.value) : noSeEntiende(r.min) || noSeEntiende(r.max))) problemas.push({ code: P.repeticionesIlegibles, path: deLaSerie });
    if (noSeEntiende(s.suggestedLoad?.value)) problemas.push({ code: P.cargaIlegible, path: deLaSerie });
    if (noSeEntiende(s.rir)) problemas.push({ code: P.rirIlegible, path: deLaSerie });
    if (noSeEntiende(s.restSeconds)) problemas.push({ code: P.descansoIlegible, path: deLaSerie });
  });
  return problemas;
}

/**
 * Lo que no deja guardar, en el orden de la estructura: un bloque, un microciclo o una sesión sin nombre —el contrato
 * pide los tres— y lo de cada ejercicio. Con un bloque y una sesión por vez y los ejercicios plegados, cualquiera de
 * ellos puede no estar a la vista: por eso se listan como los problemas de «Validar», y cada uno lleva a su lugar. Las
 * sesiones que se recorren son las que se editan: las de los microciclos, si el bloque los usa.
 */
export function loQueNoDejaGuardarElEntrenamiento(bloques: readonly BloqueDelEditor[]): readonly ProblemaDelEditor[] {
  const problemas: ProblemaDelEditor[] = [];
  const deLasSesiones = (sesiones: readonly SesionDelEditor[], base: string): void =>
    sesiones.forEach((s, k) => {
      const deLaSesion = `${base}.sessions[${k}]`;
      if (sinNombre(s)) problemas.push({ code: P.faltaElNombre, path: deLaSesion });
      s.prescriptions.forEach((p, l) => problemas.push(...loQueNoDejaGuardarDelEjercicio(p, `${deLaSesion}.prescriptions[${l}]`)));
    });
  bloques.forEach((b, i) => {
    const delBloque = `blocks[${i}]`;
    if (sinNombre(b)) problemas.push({ code: P.faltaElNombre, path: delBloque });
    const microciclos = b.microcycles ?? [];
    if (microciclos.length === 0) return deLasSesiones(b.sessions ?? [], delBloque);
    microciclos.forEach((m, j) => {
      const delMicrociclo = `${delBloque}.microcycles[${j}]`;
      if (sinNombre(m)) problemas.push({ code: P.faltaElNombre, path: delMicrociclo });
      deLasSesiones(m.sessions, delMicrociclo);
    });
  });
  return problemas;
}

/** El aviso que encabeza esa lista: dice qué hay que corregir, sin mandar a buscar «los campos marcados». */
export function avisoDeLoQueNoDejaGuardarElEntrenamiento(problemas: readonly ProblemaDelEditor[]): string {
  const nombres = problemas.some((p) => p.code === P.faltaElNombre);
  const datos = problemas.some((p) => p.code !== P.faltaElNombre);
  if (nombres && datos) return 'Hay nombres sin completar y datos que faltan o no se entienden. Corregilos antes de guardar.';
  return nombres ? 'Hay nombres sin completar. Completalos antes de guardar.' : 'Hay datos que faltan o no se entienden. Corregilos antes de guardar.';
}

// ─── Un ejercicio plegado ───────────────────────────────────────────────────────────────────────────────────────

/** Lo escrito en el editor, con la forma de lo guardado: el objetivo de cada serie resuelto como lo resuelve la API. */
function comoLoLeeElPlan(p: EjercicioDelEditor): Pick<PrescripcionConObjetivos, 'sets' | 'intensity'> {
  const criterio = p.intensity ? p.intensity.criterion.trim().toUpperCase() : null;
  return {
    sets: objetivosEfectivos(p).map((f, n) => ({
      setIndex: f.setIndex,
      note: p.sets[n]?.note ?? null,
      target: { repetitions: f.repetitions, rir: f.rir, suggestedLoad: f.suggestedLoad, restSeconds: f.restSeconds },
      targetOrigin: f.origin,
    })),
    intensity: p.intensity && (criterio === 'RIR' || criterio === 'PERCENT_RM') ? { criterion: criterio, target: { value: p.intensity.target.value, reference: p.intensity.target.reference ?? null } } : null,
  };
}

/** El renglón de un ejercicio en el editor: lo que piden sus series y lo que adentro pide atención. */
export interface EjercicioPlegadoDelEditor {
  /** «4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00», con lo escrito y todavía sin guardar. */
  readonly resumen: string;
  /** Lo que plegar no puede esconder: lo que no deja guardar y los problemas de «Validar». */
  readonly avisos: readonly string[];
}

const unoOVarios = (n: number, uno: string, varios: string): string => (n === 1 ? `1 ${uno}` : `${n} ${varios}`);

/**
 * Lo que dice un ejercicio plegado. El resumen es el del plan activo (`renglonDelEjercicio`), calculado sobre lo que el
 * editor tiene escrito: el objetivo de cada serie se resuelve igual que al guardar. Si falta el objetivo de intensidad o
 * hay un dato que no se entiende, no hay resumen que valga: dice cuántas series tiene, y el aviso dice qué pasa.
 * `problemas` son los de «Validar» que cayeron en este ejercicio.
 */
export function ejercicioPlegadoDelEditor(p: EjercicioDelEditor, problemas: number): EjercicioPlegadoDelEditor {
  const propios = loQueNoDejaGuardarDelEjercicio(p, '');
  const faltaElObjetivo = propios.some((x) => x.code === P.faltaElObjetivo);
  const parametros = propios.filter((x) => x.code === P.parametroIncompleto).length;
  const ilegibles = propios.length - parametros - (faltaElObjetivo ? 1 : 0);
  return {
    resumen: faltaElObjetivo || ilegibles > 0 ? cantidadDeSeries(p.sets.length) : renglonDelEjercicio(comoLoLeeElPlan(p)),
    avisos: [
      ...(faltaElObjetivo ? ['Falta el objetivo de intensidad'] : []),
      ...(ilegibles > 0 ? [unoOVarios(ilegibles, 'dato que no se entiende', 'datos que no se entienden')] : []),
      ...(parametros > 0 ? [unoOVarios(parametros, 'parámetro sin completar', 'parámetros sin completar')] : []),
      ...(problemas > 0 ? [unoOVarios(problemas, 'problema para revisar', 'problemas para revisar')] : []),
    ],
  };
}

// ─── El descanso, escrito ───────────────────────────────────────────────────────────────────────────────────────

/**
 * Lee un descanso como se escribe en el editor: «2:30», «02:30», «1:00:00», o un número solo, que son segundos («150»),
 * como se venía escribiendo. Devuelve los segundos; `null`, si lo escrito no es nada de eso. «0» es sin pausa. Después
 * de los dos puntos van dos cifras por debajo de 60: «2:5» y «2:75» no se adivinan.
 */
export function leerDescanso(texto: string): number | null {
  const t = texto.trim();
  if (/^\d{1,5}$/.test(t)) return Number(t);
  const m = /^(?:(\d{1,2}):([0-5]\d)|(\d{1,3})):([0-5]\d)$/.exec(t);
  if (!m) return null;
  const [, horas, minutosDeLaHora, minutos, segundos] = m;
  return horas !== undefined ? Number(horas) * 3600 + Number(minutosDeLaHora) * 60 + Number(segundos) : Number(minutos) * 60 + Number(segundos);
}

// ─── La celda de un objetivo de una serie ───────────────────────────────────────────────────────────────────────

/** Lo que el botón de la celda deja elegir: quitarle el objetivo a la serie, o volver a tomarlo de lo general. */
export type OpcionDeLaCelda = 'sin-objetivo' | 'de-lo-general';

/**
 * Cómo se ve la celda de un objetivo de una serie (la carga sugerida, el RIR o el descanso), que tiene tres estados
 * (DL-122): la serie toma el de lo general, tiene uno propio, o no tiene ninguno aunque lo general lo tenga.
 */
export interface CeldaDeObjetivoDelEditor {
  readonly estado: 'de-lo-general' | 'propio' | 'sin-objetivo' | 'no-se-entiende';
  /** Lo que la celda dice cuando no tiene un valor escrito: lo que toma de lo general, o «Sin objetivo». */
  readonly sinValor: string;
  /**
   * Si eso va en gris: es lo que la serie toma de lo general (o lo general no lo tiene). «Sin objetivo» elegido a mano
   * va en el color del texto: es una decisión de esa serie.
   */
  readonly enGris: boolean;
  /** Lo mismo, dicho con palabras: el gris no se le lee a nadie. */
  readonly descripcion: string;
  /** Lo que ofrece el botón de la celda: nunca el estado en el que ya está. */
  readonly opciones: readonly OpcionDeLaCelda[];
}

/**
 * `valor` es lo que la serie tiene escrito: `undefined`, nada (toma de lo general); `null`, sin objetivo; un número, el
 * propio; NaN, algo que no se entiende. `deLoGeneral` es lo que tomaría, ya escrito para la persona («62,5 kg»), o
 * `null` si lo general no tiene ese objetivo.
 */
export function celdaDeObjetivoDelEditor(valor: number | null | undefined, deLoGeneral: string | null): CeldaDeObjetivoDelEditor {
  const sinObjetivo = COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
  const loGeneral = deLoGeneral ?? sinObjetivo;
  if (valor === undefined) {
    return {
      estado: 'de-lo-general',
      sinValor: loGeneral,
      enGris: true,
      descripcion: deLoGeneral ? `Vacío: toma ${deLoGeneral} de lo general.` : 'Vacío: sin objetivo, porque lo general no lo tiene.',
      opciones: ['sin-objetivo'],
    };
  }
  if (valor === null) {
    return { estado: 'sin-objetivo', sinValor: sinObjetivo, enGris: false, descripcion: deLoGeneral ? `Sin objetivo en esta serie. Lo general: ${deLoGeneral}.` : 'Sin objetivo en esta serie.', opciones: ['de-lo-general'] };
  }
  if (Number.isNaN(valor)) return { estado: 'no-se-entiende', sinValor: loGeneral, enGris: true, descripcion: 'No se entiende lo escrito.', opciones: ['sin-objetivo', 'de-lo-general'] };
  return { estado: 'propio', sinValor: loGeneral, enGris: true, descripcion: deLoGeneral ? `Propio de esta serie. Lo general: ${deLoGeneral}.` : 'Propio de esta serie.', opciones: ['sin-objetivo', 'de-lo-general'] };
}

/**
 * Lo que queda en la serie al escribir en la celda: vacío, nada —la clave no viaja y la serie toma de lo general—; un
 * número, el propio; lo que no se entiende, NaN, que no deja guardar. Nunca `null`: «Sin objetivo» se elige, no se
 * escribe.
 */
export function objetivoEscritoEnLaCelda(texto: string, leer: (t: string) => number | null): number | undefined {
  if (texto.trim() === '') return undefined;
  return leer(texto) ?? Number.NaN;
}

/** Lo que queda al elegir con el botón de la celda: «Sin objetivo» es `null`; «Tomar de lo general», que la clave no viaje. */
export function objetivoElegidoEnLaCelda(opcion: OpcionDeLaCelda): null | undefined {
  return opcion === 'sin-objetivo' ? null : undefined;
}

/** Si lo escrito en la celda y lo que la serie tiene son lo mismo: nada y «Sin objetivo» se ven igual (la celda vacía). */
export function esLoQueTieneLaCelda(escrito: number | undefined, valor: number | null | undefined): boolean {
  return escrito === undefined ? valor === undefined || valor === null : Object.is(escrito, valor);
}

// ─── Activar ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que entra al activar, contado de la estructura: «2 bloques y 5 sesiones» (las de los microciclos también). */
export function loQueEntraAlActivarElEntrenamiento(bloques: readonly BloqueDelEditor[]): string {
  const sesiones = bloques.reduce((n, b) => n + (b.sessions?.length ?? 0) + (b.microcycles ?? []).reduce((k, m) => k + m.sessions.length, 0), 0);
  return `${unoOVarios(bloques.length, 'bloque', 'bloques')} y ${unoOVarios(sesiones, 'sesión', 'sesiones')}`;
}
