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
 * - **Con una en curso, ninguna otra ofrece empezar** (DL-170, AV2-09; error 1 de la crítica de la 0.23): `sePuedeIniciar`
 *   lo dice antes de tocar, en Inicio y en Entrenamiento. El freno reactivo de `useAbrirOcurrencia` queda como red de
 *   seguridad, por si la lectura está vieja.
 * - **«En curso» sale de la corrida abierta**, no de cualquier borrador: un «Ya la hice» a medias no está en curso.
 *
 * Es lógica pura: la lectura de la API y las sesiones del teléfono se pasan.
 */
import { COPY_ENTRENAMIENTO, type Ocurrencia, type SesionEnCurso } from '@be/domain';
import type { SesionLocal } from './almacen-de-entrenamiento';
import { corridaAbierta, estadoLocal, type Corrida } from './corrida-de-entrenamiento';
import type { NombreDeIcono } from './icono';
import { TEXTOS_DE_LA_VUELTA as T } from './textos-de-la-vuelta';

/**
 * Si la sesión quedó registrada como hecha: «Realizada» o «Realizada con desvío», con la condición que rige. Es lo que
 * lleva la tilde en `exito` (DL-170): se celebra lo hecho; una «No realizada» queda neutra, nunca en rojo.
 */
export const sesionRealizada = (e: Pick<Ocurrencia['execution'], 'state' | 'sessionCondition'>): boolean =>
  e.state === 'REGISTERED' && (e.sessionCondition === 'COMPLETED' || e.sessionCondition === 'COMPLETED_WITH_DEVIATION');

/**
 * El ícono de la etiqueta de estado de una sesión del plan (PA-06), el mismo en Inicio y en Entrenamiento: acompaña al
 * texto, que es el que dice el estado. Sin registro, la marca vacía; en curso, el reloj; con desvío, el desvío; no
 * realizada, la salteada; registrada, el guardado. Lo hecho lleva además la tilde de la etiqueta (`hecha`).
 */
export function iconoDelEstado(execution: Pick<Ocurrencia['execution'], 'state' | 'sessionCondition'>): NombreDeIcono {
  if (execution.state === 'DRAFT_IN_PROGRESS') return 'reloj';
  if (execution.state !== 'REGISTERED' || !execution.sessionCondition) return 'sin-registro';
  if (execution.sessionCondition === 'NOT_COMPLETED') return 'salteada';
  return execution.sessionCondition === 'COMPLETED_WITH_DEVIATION' ? 'desvio' : 'guardar';
}

/** Si la corrida abierta está en curso o en pausa. */
export type MarchaDeLaCorrida = 'en-curso' | 'en-pausa';

/**
 * Si se puede empezar esta sesión (AV2-09): solo si no hay ninguna en curso, o si la que está en curso es esta misma,
 * que se retoma. Con otra en curso, ni «Empezar», ni «Iniciar entrenamiento», ni «Hacerla hoy».
 */
export const sePuedeIniciar = (occurrenceId: string, enCurso: Pick<EnCurso, 'occurrenceId'> | null): boolean => enCurso === null || enCurso.occurrenceId === occurrenceId;

/**
 * La marcha de la sesión en curso: la de API-TIE-04 (`state`), o, si la API no respondió, la de la corrida del teléfono.
 */
export function marchaDeLaSesionEnCurso(remota: Pick<SesionEnCurso, 'state'> | null | undefined, delTelefono: Pick<SesionDelTelefono, 'corrida'> | null | undefined): MarchaDeLaCorrida {
  if (remota) return remota.state === 'PAUSED' ? 'en-pausa' : 'en-curso';
  return delTelefono && estadoLocal(delTelefono.corrida).pausada ? 'en-pausa' : 'en-curso';
}

/**
 * La etiqueta de estado de una sesión (AV2-09). «En curso» o «En pausa» salen de la corrida abierta (`marcha`, que es
 * `null` si esta sesión no es la que corre), no de cualquier borrador: un borrador sin corrida, como un «Ya la hice» a
 * medias, dice «Sin registrar». El resto, lo que dice `vistaDeOcurrencia` del dominio, que llega a la condición solo por
 * una ejecución registrada. `hecha`: la tilde de lo hecho.
 */
export function vistaDeLaSesion(
  vista: { readonly texto: string },
  e: Pick<Ocurrencia['execution'], 'state' | 'sessionCondition'>,
  marcha: MarchaDeLaCorrida | null,
): { readonly texto: string; readonly hecha: boolean; readonly icono: NombreDeIcono } {
  if (marcha) return { texto: marcha === 'en-pausa' ? T.enPausa : COPY_ENTRENAMIENTO.enCurso, hecha: false, icono: 'reloj' };
  if (e.state === 'DRAFT_IN_PROGRESS') return { texto: T.sinRegistrar, hecha: false, icono: 'sin-registro' };
  return { texto: vista.texto, hecha: sesionRealizada(e), icono: iconoDelEstado(e) };
}

/**
 * La línea del ejercicio y la serie de la corrida de este teléfono: «Sentadilla goblet · serie 3». `null` si la sesión
 * corre en otro teléfono o todavía no hay una fila activa: esa línea no va.
 */
export function lineaDeLaSerie(local: Pick<SesionLocal, 'foco' | 'sesion'> | null | undefined): string | null {
  const foco = local?.foco;
  const ejercicio = foco ? local?.sesion?.prescriptions.find((p) => p.prescriptionId === foco.prescriptionId) : undefined;
  return foco && ejercicio ? T.ejercicioYSerie(ejercicio.exerciseName, foco.setIndex) : null;
}

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
