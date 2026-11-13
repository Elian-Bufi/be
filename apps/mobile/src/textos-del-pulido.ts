/**
 * Los textos de la tanda A de WP-PULIDO-GRANDES (DL-173) en la APK, en un solo lugar: Inicio con la sesión que sigue
 * (PG-01), la pantalla encendida durante la sesión (PG-05), la háptica (PG-08) y la hora de lo que se ve (PG-09). Los de
 * la carga (PG-03) siguen con los suyos, en `pantallas/recuperacion.tsx`.
 *
 * Ubican, nunca califican (TEST-PRJ-009): «Sigue en tu plan» dice de dónde sale el orden, «Sin registrar» es un dato y no
 * un reproche, y la hora dice de cuándo es lo que se ve, sin contar cuántas cosas cambiaron.
 */
import { numero } from '@be/domain';

export const TEXTOS_DEL_PULIDO = {
  // ─── PG-01 · Inicio: la sesión que sigue y «Otra sesión» ───────────────────────────────────
  sigueEnTuPlan: 'Sigue en tu plan',
  /** Sin poder leer lo registrado, no se afirma que «sigue»: se dice que es la primera del plan. */
  primeraDeTuPlan: 'La primera de tu plan',
  deDondeSaleElOrden: 'En el orden que armó tu profesional.',
  paraLeerLaQueSigue: (encabezado: string, sesion: string) => `${encabezado}, ${sesion}`,
  otraSesion: 'Otra sesión',
  otraSesionParaLeer: (n: number) => `Otra sesión, abre la lista de ${numero(n)} sesiones`,
  lasSesionesDeTuPlan: (n: number) => `Las ${numero(n)} sesiones de tu plan`,
  cerrarLaLista: 'Cerrar la lista de sesiones',
  /** El estado de la semana, para cada sesión de la hoja: un dato, sin juicio. */
  realizadaHoy: 'Realizada hoy',
  realizadaEl: (dia: string) => `Realizada el ${dia}`,
  registradaHoySinRealizar: 'Registrada hoy, sin realizar',
  registradaElSinRealizar: (dia: string) => `Registrada el ${dia}, sin realizar`,
  sinRegistrar: 'Sin registrar esta semana',
  elegidaPorVos: 'Elegiste esta sesión',
  volverALaQueSigue: 'Volver a la que sigue',

  // ─── PG-05 · La pantalla encendida durante la sesión ────────────────────────────────────────
  mantenerLaPantalla: 'Mantener la pantalla encendida durante la sesión',
  mantenerLaPantallaDetalle: 'Se apaga al pausar, al finalizar o al salir de la sesión.',

  // ─── PG-08 · La háptica ─────────────────────────────────────────────────────────────────────
  haptica: 'Vibrar al confirmar',
  hapticaDetalle: 'Un toque corto cuando algo quedó guardado, otro al deshacer y uno doble si algo falla.',

  // ─── PG-09 · La hora de lo que ves ──────────────────────────────────────────────────────────
  alDia: (hora: string) => `Al día, ${hora}`,
  vesLoDeLas: (hora: string) => `Ves lo de las ${hora}`,
  actualizado: (hora: string) => `Actualizado, ${hora}`,
  noSePudoActualizar: (hora: string) => `No se pudo actualizar. Ves lo de las ${hora}`,
} as const;
