import type { Resultado } from './cliente-http';

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
  // DL-168: por qué no se guardó, dicho claro. Lo escrito sigue en pantalla: el editor no lo toca al fallar, y salir con
  // cambios sin guardar pide confirmar (`useCambiosSinGuardar`).
  sinRespuesta: 'No pudimos guardar los cambios. Tus cambios siguen acá. Reintentá.',
  demasiadoGrande:
    'El plan es demasiado grande para guardarlo de una vez. Tus cambios siguen acá: quitá lo que no haga falta (opciones, semanas o notas largas) y volvé a guardar.',
} as const;

/**
 * Por qué no se guardó un borrador (DL-168, arreglo del 2026-11-11). Antes, un plan que no entraba se decía «El servicio
 * no está disponible en este momento», como si BE estuviera caído.
 * - `DEMASIADO_GRANDE`: no entró de una vez. La API lo dice con un 400 INVALID_REQUEST y el issue TOO_BIG en `(body)`, por
 *   el límite del cuerpo de su ruta o por la cota de elementos; un 413 puede venir de un intermediario. Reintentar no lo
 *   arregla: el editor lo dice también en el autoguardado.
 * - `SIN_RESPUESTA`: no hubo respuesta, no se entendió o el servidor falló (5xx). Reintentar es seguro: si el intento
 *   anterior sí se guardó, el editor lo reconoce por la versión.
 * - `OTRO`: un rechazo del contrato o del estado, que cada editor dice a su manera (un conflicto, un problema con su lugar).
 */
export type FalloDeGuardado = 'DEMASIADO_GRANDE' | 'SIN_RESPUESTA' | 'OTRO';

export function falloDeGuardado(r: Resultado<unknown>): FalloDeGuardado {
  if (r.ok) return 'OTRO';
  if (r.tipo === 'RED') return 'SIN_RESPUESTA';
  if (r.status === 413 || (r.codigo === 'INVALID_REQUEST' && r.issues.some((i) => i.code === 'TOO_BIG' && i.path === '(body)'))) return 'DEMASIADO_GRANDE';
  if (r.codigo === 'RESPUESTA_NO_RECONOCIDA' || r.status >= 500) return 'SIN_RESPUESTA';
  return 'OTRO';
}

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
