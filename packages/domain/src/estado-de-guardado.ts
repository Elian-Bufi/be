/**
 * El estado de escritura de un borrador (encargo de consolidación de Dirección del 2026-10-19, bloque 3): cuatro estados
 * inequívocos, iguales en todos los editores con borrador en el servidor.
 * - **Guardando…** mientras la API responde.
 * - **Guardado** solo con la respuesta del servidor: nunca porque sí.
 * - **Pendiente de guardar** con cambios en pantalla que todavía no viajaron (el autoguardado los manda en cuanto se
 *   pueden guardar; si falta completar algo, lo dice).
 * - **No se pudo guardar** si el último intento falló, o si el borrador cambió en otra pestaña (conflicto): lo escrito
 *   sigue en pantalla durante la sesión, pero no se promete recuperarlo si se cierra la página.
 * Un autoguardado guarda la preparación: no activa planes, no registra revisiones ni confirma actos profesionales.
 */
export const COPY_GUARDADO = {
  guardando: 'Guardando…',
  guardadoA: (hora: string): string => `Guardado a las ${hora}`,
  guardado: 'Guardado',
  pendiente: 'Pendiente de guardar',
  pendienteIncompleto: 'Pendiente de guardar: falta completar algo',
  noSePudo: 'No se pudo guardar',
  noSePudoReintento: 'No se pudo guardar: se reintenta al seguir editando o con «Guardar cambios»',
  conflictoCorto: 'No se pudo guardar: el borrador cambió en otra pestaña',
  conflicto:
    'Este borrador cambió en otra pestaña o en otro equipo. Lo tuyo no se guardó, para no pisar esos cambios: sigue en pantalla, así podés copiar lo que necesites.',
  cargarGuardada: 'Cargar la versión guardada',
  cargarGuardadaAclaracion: 'Reemplaza lo que tenés en pantalla por lo guardado.',
} as const;

export type TipoDeGuardado = 'guardando' | 'guardado' | 'pendiente' | 'fallo';

export interface EntradaDeGuardado {
  readonly guardando: boolean;
  /** Cambios en pantalla que no viajaron. */
  readonly sucio: boolean;
  /** Lo que está en pantalla se puede guardar (nada mal escrito ni incompleto). */
  readonly puedeGuardar: boolean;
  /** El último intento falló (red, servidor o rechazo). */
  readonly fallo: boolean;
  /** El borrador cambió en otra pestaña o en otro equipo (409 por versión). */
  readonly conflicto: boolean;
  /** La hora del último guardado confirmado por el servidor en esta pantalla, ya formateada; `null` si no hubo. */
  readonly guardadoA: string | null;
}

/** El estado y su texto. El orden importa: lo que está pasando, después lo que falló, después lo pendiente. */
export function estadoDeGuardado(e: EntradaDeGuardado): { readonly tipo: TipoDeGuardado; readonly texto: string } {
  if (e.guardando) return { tipo: 'guardando', texto: COPY_GUARDADO.guardando };
  if (e.conflicto) return { tipo: 'fallo', texto: COPY_GUARDADO.conflictoCorto };
  if (e.fallo) return { tipo: 'fallo', texto: e.sucio ? COPY_GUARDADO.noSePudoReintento : COPY_GUARDADO.noSePudo };
  if (e.sucio) return { tipo: 'pendiente', texto: e.puedeGuardar ? COPY_GUARDADO.pendiente : COPY_GUARDADO.pendienteIncompleto };
  return { tipo: 'guardado', texto: e.guardadoA ? COPY_GUARDADO.guardadoA(e.guardadoA) : COPY_GUARDADO.guardado };
}
