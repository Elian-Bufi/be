/**
 * Una sola sesión en curso por titular (API-TIE-01 rechaza otro inicio con ANOTHER_SESSION_IN_PROGRESS). Antes de iniciar
 * una sesión, la app ofrece continuar la que está en curso o dejarla incompleta, y no abre nada nuevo hasta que se decida
 * (defecto de la APK 0.15.0-candidata.1, 2026-10-08: con una sesión abierta del 6/10, Inicio ofrecía «Iniciar
 * entrenamiento», se abría otro borrador y el rechazo aparecía después, al registrar una serie).
 *
 * - **Primero la API** (API-TIE-04): sabe de la sesión en curso de cualquier día y de cualquier dispositivo, aunque el
 *   teléfono no la tenga. Si no responde, vale lo del teléfono; si después la API rechaza el inicio, la sesión enfocada
 *   ofrece lo mismo y reintenta con los mismos eventos.
 * - **Después el teléfono:** una corrida empezada acá y sin cerrar, aunque la API todavía no la tenga.
 * - **La misma ocurrencia no bloquea:** se retoma.
 *
 * Es lógica pura: la lectura de la API y las sesiones del teléfono se pasan.
 */
import type { SesionEnCurso } from '@be/domain';
import { corridaAbierta, type Corrida } from './corrida-de-entrenamiento';

/** La sesión en curso que se ofrece continuar o dejar incompleta. */
export interface EnCurso {
  readonly draftId: string;
  readonly occurrenceId: string;
  readonly fecha: string;
  readonly etiqueta: string;
}

/** Lo que se mira de una sesión del teléfono. */
export interface SesionDelTelefono {
  readonly draftId: string;
  readonly occurrenceId: string;
  readonly fecha: string;
  readonly etiqueta: string;
  readonly modo: 'en-vivo' | 'otro-dia';
  readonly corrida: Corrida;
}

/** La sesión en curso según la API (API-TIE-04), en la forma de la pantalla. */
export const enCursoDeLaApi = (s: SesionEnCurso): EnCurso => ({ draftId: s.draftId, occurrenceId: s.occurrenceId, fecha: s.date, etiqueta: s.sessionLabel });

/** La sesión del teléfono con una corrida empezada y sin cerrar, si hay una. Solo las que se entrenan en vivo corren. */
export function enCursoEnElTelefono(sesiones: readonly SesionDelTelefono[], salvoOcurrencia: string | null = null): EnCurso | null {
  const s = sesiones.find((x) => x.modo === 'en-vivo' && x.occurrenceId !== salvoOcurrencia && corridaAbierta(x.corrida));
  return s ? { draftId: s.draftId, occurrenceId: s.occurrenceId, fecha: s.fecha, etiqueta: s.etiqueta } : null;
}

/**
 * La sesión en curso que se muestra para continuar o dejar incompleta: primero la de la API, que es la que impide iniciar
 * otra; si la API no informa ninguna (o no respondió), la del teléfono. Resuelta una, aparece la siguiente.
 */
export function sesionEnCursoParaMostrar(remota: SesionEnCurso | null | undefined, sesiones: readonly SesionDelTelefono[]): EnCurso | null {
  return remota ? enCursoDeLaApi(remota) : enCursoEnElTelefono(sesiones);
}

/**
 * La sesión en curso que impide iniciar la de esta ocurrencia, o `null` si se puede iniciar (o retomar). `remota` es
 * `undefined` si la API no respondió: entonces decide solo el teléfono.
 */
export function otraSesionEnCurso(occurrenceId: string, remota: SesionEnCurso | null | undefined, sesiones: readonly SesionDelTelefono[]): EnCurso | null {
  if (remota && remota.occurrenceId !== occurrenceId) return enCursoDeLaApi(remota);
  return enCursoEnElTelefono(sesiones, occurrenceId);
}
