/**
 * ED-04 · Los avisos se actualizan al corregir (WP-EDITORES-PROFESIONAL).
 *
 * Antes, los errores de un formulario se calculaban solo al enviar: un aviso corregido seguía a la vista hasta el envío
 * siguiente (la revisión, la receta, los formularios de Nutrición, solicitar el vínculo). Ahora:
 * - **antes del primer intento de envío, ningún aviso;**
 * - **al enviar,** se muestran todos los que hay;
 * - **al salir de un campo** (después de un intento), ese campo dice lo que tiene ahora: si se corrigió, su aviso se va;
 *   si quedó mal, aparece. Lo que ya se mostraba de otros campos se recalcula (se va si ya no falta), y un error nuevo de
 *   otro campo espera a su salida o al envío;
 * - **mientras se escribe,** nada cambia: el foco no salta y el aviso no aparece a mitad de una palabra;
 * - **sin nada pendiente,** el lector de pantalla oye «Listo para registrar» (o «para guardar», «para enviar»).
 *
 * Sin React ni navegador: lo usa `useAvisosVivos` (`components/formulario.tsx`), y la prueba lo recorre sola.
 */

export interface ErrorDeCampo {
  /** El `id` del campo (o del grupo de campos) al que lleva el aviso. */
  readonly id: string;
  readonly texto: string;
}

/** Lo que se muestra: si ya hubo un intento de envío, y los avisos a la vista. */
export interface AvisosDelFormulario {
  readonly intentado: boolean;
  readonly mostrados: readonly ErrorDeCampo[];
  /** Desde el último envío se mostró algún aviso: cuando no quede ninguno, se anuncia que está listo. */
  readonly huboAvisos: boolean;
}

export const SIN_AVISOS: AvisosDelFormulario = { intentado: false, mostrados: [], huboAvisos: false };

/** Al enviar: se muestran todos los que hay ahora. */
export function alEnviar(ahora: readonly ErrorDeCampo[]): AvisosDelFormulario {
  return { intentado: true, mostrados: ahora, huboAvisos: ahora.length > 0 };
}

/**
 * Al salir de un campo (`campo`: su `id` y los de los grupos que lo contienen). Antes del primer intento, nada cambia.
 * Después, quedan los avisos que ya se mostraban y siguen faltando, y los del campo que se dejó.
 */
export function alSalirDelCampo(a: AvisosDelFormulario, campo: readonly string[], ahora: readonly ErrorDeCampo[]): AvisosDelFormulario {
  if (!a.intentado) return a;
  const yaSeMostraban = new Set(a.mostrados.map((e) => e.id));
  const mostrados = ahora.filter((e) => yaSeMostraban.has(e.id) || campo.includes(e.id));
  return { intentado: true, mostrados, huboAvisos: a.huboAvisos || mostrados.length > 0 };
}

/**
 * RP-19 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · «Sin saltos»: los renglones del resumen de errores. Quedan los del último
 * envío, en su orden y con el texto de ahora; lo corregido se marca y no se va hasta el envío siguiente (si se fuera, el
 * resumen se achicaría y el formulario entero subiría al pasar al campo siguiente). Al final, lo que apareció después, al
 * salir de un campo que estaba bien.
 */
export function renglonesDelResumen(delEnvio: readonly ErrorDeCampo[], ahora: readonly ErrorDeCampo[]): readonly (ErrorDeCampo & { readonly corregido: boolean })[] {
  const actuales = new Map(ahora.map((e) => [e.id, e] as const));
  const delEnvioIds = new Set(delEnvio.map((e) => e.id));
  return [
    ...delEnvio.map((e) => ({ id: e.id, texto: actuales.get(e.id)?.texto ?? e.texto, corregido: !actuales.has(e.id) })),
    ...ahora.filter((e) => !delEnvioIds.has(e.id)).map((e) => ({ id: e.id, texto: e.texto, corregido: false })),
  ];
}

/** Los `id` de un elemento y de los que lo contienen, hasta el formulario (un casillero dentro de un grupo con su aviso). */
export function idsDelCampo(elemento: { readonly id?: string; readonly parentElement: unknown } | null, hasta: unknown): string[] {
  const ids: string[] = [];
  let e = elemento as { readonly id?: string; readonly parentElement: unknown } | null;
  while (e && e !== hasta) {
    if (e.id) ids.push(e.id);
    e = e.parentElement as typeof e;
  }
  return ids;
}

/**
 * NUP-09 (WP-NUTRICION-PLANIFICACION; NUP-D09) · Enter en un campo, mientras falten datos: a qué campo pasa. Las
 * posiciones son el orden del formulario: `actual`, la del campo donde se apretó; `faltan`, las de los campos que
 * faltan o tienen algo por corregir. Pasa al siguiente que falta después del actual y, si no hay, al primero. `null`:
 * no falta nada en otro campo (o falta solo el actual), y Enter envía como siempre.
 */
export function siguienteQueFalta(actual: number, faltan: readonly number[]): number | null {
  const otros = [...new Set(faltan)].filter((p) => p !== actual).sort((a, b) => a - b);
  if (otros.length === 0) return null;
  return otros.find((p) => p > actual) ?? otros[0]!;
}

/** Lo que puede recibir el foco adentro de un lugar que falta (un grupo con su aviso, como un `fieldset`). */
const ENFOCABLES = 'input, select, textarea, button, [tabindex]';

/**
 * NUP-09 · Enter, cuando hay a dónde ir: lleva el foco al lugar que falta (el campo, o el primero de adentro si es un
 * grupo) y dice si llegó. Un campo apagado o escondido no lo recibe: entonces Enter no se frena y envía como siempre (y
 * el envío muestra lo que falta), en vez de no hacer nada. Recibe el elemento: la prueba lo recorre sin navegador.
 */
export function enfocarLoQueFalta(lugar: HTMLElement): boolean {
  const destino = (lugar.matches(ENFOCABLES) ? lugar : lugar.querySelector<HTMLElement>(ENFOCABLES)) ?? lugar;
  destino.focus();
  return destino.ownerDocument.activeElement === destino;
}

/** Lo que oye el lector cuando ya no queda nada por corregir, después de haber mostrado avisos; si no, nada. */
export function anuncioDeLosAvisos(a: AvisosDelFormulario, listo: string): string {
  return a.huboAvisos && a.mostrados.length === 0 ? listo : '';
}

export const COPY_AVISOS_VIVOS = {
  listoParaRegistrar: 'Listo para registrar',
  listoParaGuardar: 'Listo para guardar',
  listoParaEnviar: 'Listo para enviar',
  /** RP-19: el resumen, cuando ya se corrigió todo lo marcado (queda hasta el envío siguiente). */
  todoCorregido: 'Ya corregiste lo marcado.',
  /** RP-19: lo que oye el lector junto a un renglón corregido del resumen. */
  corregido: 'corregido',
} as const;
