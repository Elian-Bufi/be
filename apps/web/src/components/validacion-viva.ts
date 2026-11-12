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

/** Lo que oye el lector cuando ya no queda nada por corregir, después de haber mostrado avisos; si no, nada. */
export function anuncioDeLosAvisos(a: AvisosDelFormulario, listo: string): string {
  return a.huboAvisos && a.mostrados.length === 0 ? listo : '';
}

export const COPY_AVISOS_VIVOS = {
  listoParaRegistrar: 'Listo para registrar',
  listoParaGuardar: 'Listo para guardar',
  listoParaEnviar: 'Listo para enviar',
} as const;
