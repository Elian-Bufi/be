/**
 * Nutrición · La versión en preparación (WP-ESCRITORIO-AREAS, parte 7): lo que el editor del plan de comidas resuelve sin
 * dibujar nada. Dónde está un problema de «Validar», para poder llevar hasta ahí; qué dice una comida plegada, que no
 * puede esconder que adentro falta algo; qué día tipo y qué comidas se miran según la dirección; y qué entra y qué queda
 * al activar.
 *
 * Las posiciones son las de la pantalla: lo que se acaba de agregar todavía no tiene número de orden, y la dirección
 * las nombra desde uno («dia=2» es el segundo día tipo de la versión, guardado o no).
 */
import { opcionesEnPalabras } from './plan-de-nutricion';

/** Lo que el editor necesita saber de la estructura: nombres y cantidades. */
interface ItemDelEditor {
  readonly quantity?: { readonly value: number } | null;
}
interface OpcionDelEditor {
  readonly label: string;
  readonly items: readonly ItemDelEditor[];
}
interface ComidaDelEditor {
  readonly label: string;
  readonly options: readonly OpcionDelEditor[];
}
interface DiaDelEditor {
  readonly label: string;
  readonly meals: readonly ComidaDelEditor[];
}

// ─── Los problemas de «Validar» ──────────────────────────────────────────────────────────────────────────────────

/** Dónde está un problema: las posiciones (desde cero) de su día tipo, su comida, su opción y su ítem. */
export interface LugarDelProblema {
  readonly dia: number | null;
  readonly comida: number | null;
  readonly opcion: number | null;
  readonly item: number | null;
}

const RUTA_DE_UN_PROBLEMA = /^dayTypes\[(\d+)\](?:\.meals\[(\d+)\](?:\.options\[(\d+)\](?:\.items\[(\d+)\])?)?)?/;

/** Lee la ruta que da la validación («dayTypes[0].meals[2].options[1]»). Una ruta que no es de la estructura no ubica nada. */
export function lugarDelProblema(ruta: string): LugarDelProblema {
  const m = RUTA_DE_UN_PROBLEMA.exec(ruta);
  const n = (x: string | undefined): number | null => (x === undefined ? null : Number(x));
  return m ? { dia: n(m[1]), comida: n(m[2]), opcion: n(m[3]), item: n(m[4]) } : { dia: null, comida: null, opcion: null, item: null };
}

/**
 * La ubicación de un problema, dicha sin rutas técnicas: «Día habitual → Almuerzo → Opción 2 → Ítem 1» (B05:654-659).
 * Lo que todavía no tiene nombre se dice por lo que es y su número; lo que no se puede ubicar es del plan entero.
 */
export function ubicacionDelProblema(ruta: string, dias: readonly DiaDelEditor[]): string {
  const { dia, comida, opcion, item } = lugarDelProblema(ruta);
  if (dia === null) return 'Plan';
  const d = dias[dia];
  const partes = [d?.label.trim() || `Día tipo ${dia + 1}`];
  if (comida !== null) partes.push(d?.meals[comida]?.label.trim() || `Comida ${comida + 1}`);
  if (opcion !== null) partes.push(`Opción ${opcion + 1}`);
  if (item !== null) partes.push(`Ítem ${item + 1}`);
  return partes.join(' → ');
}

/** Cuántos problemas hay dentro de una comida: los que la validación ubicó en ella o en algo de adentro. */
export function problemasDeLaComida(rutas: readonly string[], dia: number, comida: number): number {
  return rutas.filter((r) => {
    const l = lugarDelProblema(r);
    return l.dia === dia && l.comida === comida;
  }).length;
}

// ─── Lo que se mira, según la dirección ─────────────────────────────────────────────────────────────────────────

/** La posición (desde cero) que pide la dirección, que cuenta desde uno. Sin pedido, o con uno que no existe, la primera. */
export function posicionPedida(cuantos: number, pedido: string | null): number {
  if (cuantos <= 0) return -1;
  const n = pedido !== null && /^[1-9]\d*$/.test(pedido) ? Number(pedido) : 1;
  return n <= cuantos ? n - 1 : 0;
}

/** Lo que se escribe en la dirección para una posición: nada, si es la primera. */
export function pedidoDeLaPosicion(posicion: number): string | null {
  return posicion <= 0 ? null : String(posicion + 1);
}

/**
 * Las comidas abiertas en el editor (posiciones desde cero). **Al entrar, ninguna:** el día entero se lee en un renglón
 * por comida, y se abre la que se va a tocar. La dirección las nombra desde uno, separadas por punto («1.3»); lo que el
 * día no tiene se ignora.
 */
export function comidasAbiertasEnElEditor(cuantas: number, pedido: string | null): ReadonlySet<number> {
  const abiertas = new Set<number>();
  for (const parte of (pedido ?? '').split('.')) {
    if (!/^[1-9]\d*$/.test(parte)) continue;
    const n = Number(parte);
    if (n <= cuantas) abiertas.add(n - 1);
  }
  return abiertas;
}

/** Lo que se escribe en la dirección: nada, si no hay ninguna abierta (que es como se entra). */
export function pedidoDeComidasDelEditor(abiertas: ReadonlySet<number>): string | null {
  return abiertas.size === 0 ? null : [...abiertas].sort((a, b) => a - b).map((p) => String(p + 1)).join('.');
}

// ─── Lo que no deja guardar ────────────────────────────────────────────────────────────────────────────────────

/** Los problemas que el editor encuentra solo, antes de pedirle nada a la API. */
export const PROBLEMA_DEL_EDITOR = { faltaElNombre: 'NAME_REQUIRED', cantidadIlegible: 'QUANTITY_NOT_READABLE' } as const;

/** Un problema, con la forma de los de «Validar»: un código y la ruta a su lugar. */
export interface ProblemaDelEditor {
  readonly code: string;
  readonly path: string;
}

const sinNombre = (x: { readonly label: string }): boolean => x.label.trim() === '';
// Una cantidad escrita que no es un número viaja como NaN. Un ítem sin cantidad no es eso: nace así y se completa después.
const ilegible = (i: ItemDelEditor): boolean => i.quantity != null && Number.isNaN(i.quantity.value);

/**
 * Lo que no deja guardar, en el orden de la estructura: un día tipo, una comida o una opción sin nombre —el contrato
 * pide los tres— y una cantidad escrita que no es un número. Con un día tipo por vez, las comidas plegadas y una opción
 * por pestaña, cualquiera de ellos puede no estar a la vista: por eso se listan como los problemas de «Validar», y cada
 * uno lleva a su lugar.
 */
export function loQueNoDejaGuardar(dias: readonly DiaDelEditor[]): readonly ProblemaDelEditor[] {
  const problemas: ProblemaDelEditor[] = [];
  dias.forEach((d, i) => {
    const pd = `dayTypes[${i}]`;
    if (sinNombre(d)) problemas.push({ code: PROBLEMA_DEL_EDITOR.faltaElNombre, path: pd });
    d.meals.forEach((m, j) => {
      const pm = `${pd}.meals[${j}]`;
      if (sinNombre(m)) problemas.push({ code: PROBLEMA_DEL_EDITOR.faltaElNombre, path: pm });
      m.options.forEach((o, k) => {
        const po = `${pm}.options[${k}]`;
        if (sinNombre(o)) problemas.push({ code: PROBLEMA_DEL_EDITOR.faltaElNombre, path: po });
        o.items.forEach((it, l) => {
          if (ilegible(it)) problemas.push({ code: PROBLEMA_DEL_EDITOR.cantidadIlegible, path: `${po}.items[${l}]` });
        });
      });
    });
  });
  return problemas;
}

/** El aviso que encabeza esa lista: dice qué hay que corregir, sin mandar a buscar «los campos marcados». */
export function avisoDeLoQueNoDejaGuardar(problemas: readonly ProblemaDelEditor[]): string {
  const nombres = problemas.some((p) => p.code === PROBLEMA_DEL_EDITOR.faltaElNombre);
  const cantidades = problemas.some((p) => p.code === PROBLEMA_DEL_EDITOR.cantidadIlegible);
  if (nombres && cantidades) return 'Hay nombres sin completar y cantidades que no se entienden. Corregilos antes de guardar.';
  return nombres ? 'Hay nombres sin completar. Completalos antes de guardar.' : 'Hay cantidades que no se entienden. Corregilas antes de guardar.';
}

// ─── Una comida plegada ────────────────────────────────────────────────────────────────────────────────────────

/** El renglón de una comida plegada: cómo se llama, cuántas opciones tiene y lo que adentro pide atención. */
export interface ComidaPlegadaDelEditor {
  readonly titulo: string;
  readonly opciones: string;
  /**
   * Lo que plegar no puede esconder: que no tiene nombre, una opción sin nombre, una cantidad que no se entiende, un
   * problema de «Validar».
   */
  readonly avisos: readonly string[];
}

const unoOVarios = (n: number, uno: string, varios: string): string => (n === 1 ? `1 ${uno}` : `${n} ${varios}`);

/** `problemas` son los de «Validar» que cayeron en esta comida; lo que el editor ve solo se cuenta acá, de la comida. */
export function comidaPlegadaDelEditor(comida: ComidaDelEditor, posicion: number, problemas: number): ComidaPlegadaDelEditor {
  const opcionesSinNombre = comida.options.filter(sinNombre).length;
  const ilegibles = comida.options.reduce((n, o) => n + o.items.filter(ilegible).length, 0);
  return {
    titulo: sinNombre(comida) ? `Comida ${posicion + 1}` : comida.label.trim(),
    opciones: opcionesEnPalabras(comida.options.length),
    avisos: [
      ...(sinNombre(comida) ? ['Falta el nombre'] : []),
      ...(opcionesSinNombre > 0 ? [unoOVarios(opcionesSinNombre, 'opción sin nombre', 'opciones sin nombre')] : []),
      ...(ilegibles > 0 ? [unoOVarios(ilegibles, 'cantidad que no se entiende', 'cantidades que no se entienden')] : []),
      ...(problemas > 0 ? [unoOVarios(problemas, 'problema para revisar', 'problemas para revisar')] : []),
    ],
  };
}

/**
 * El rótulo de la pestaña de una opción: su número y su nombre. Sin nombre —o con el que le pone el editor al nacer,
 * que es su número— dice solo «Opción N», no «4 · Opción 4».
 */
export function pestanaDeLaOpcion(opcion: { readonly label: string }, posicion: number): string {
  const nombre = opcion.label.trim();
  const sinNombrePropio = `Opción ${posicion + 1}`;
  return nombre === '' || nombre === sinNombrePropio ? sinNombrePropio : `${posicion + 1} · ${nombre}`;
}

// ─── Activar ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que entra al activar, contado de la estructura: «2 días tipo y 8 comidas». */
export function loQueEntraAlActivar(dias: readonly DiaDelEditor[]): string {
  const comidas = dias.reduce((n, d) => n + d.meals.length, 0);
  return `${unoOVarios(dias.length, 'día tipo', 'días tipo')} y ${unoOVarios(comidas, 'comida', 'comidas')}`;
}

/** Una frase de «Activar», en dos partes: de quién habla (que en pantalla va destacado) y qué le pasa. Se leen seguidas. */
export interface FraseDeActivar {
  readonly quien: string;
  readonly que: string;
}

export const COPY_DE_ACTIVAR_EL_PLAN = {
  /** La versión en preparación no tiene número hasta que se activa (F-65): no se le promete uno. */
  entra: (queTiene: string): FraseDeActivar => ({ quien: 'Esta versión', que: ` pasa a ser la vigente: ${queTiene}.` }),
  queda: (numero: number, desde: string): FraseDeActivar => ({ quien: `La versión ${numero}`, que: `, activa desde el ${desde}, queda en el historial.` }),
  proximaRevision: 'Próxima revisión',
  opcional: 'opcional',
  ayudaDeLaRevision: 'Si la fijás, al activar queda como revisión pendiente del seguimiento a partir de esa fecha.',
  volver: 'Volver',
  activarEstaVersion: 'Activar esta versión',
  activando: 'Activando…',
  noSePudoGuardarAntes: 'No pudimos guardar los cambios, y sin guardarlos no se puede activar.',
} as const;
