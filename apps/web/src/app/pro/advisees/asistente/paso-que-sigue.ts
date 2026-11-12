/**
 * ED-14 y ED-20 (WP-EDITORES-PROFESIONAL, §2.1) · El asistente de Entrenamiento, sin React: los siete pasos, el que
 * sigue según lo que tiene el borrador y lo que se pide en la dirección.
 *
 * - **El asistente no guarda en qué paso quedó** (ni en el servidor ni en el navegador): el paso se deduce del borrador
 *   (sin sesiones, el 2; con sesiones sin ejercicios, el 3; con ejercicios sin prescribir, el 4; con días sin asignar, el
 *   5; si no, el 6). **Lo deducido es una sugerencia:** el indicador muestra los siete y el profesional elige (V3 X-01).
 * - Pasar por el asistente no cambia lo que no muestra: los valores propios de una serie, las notas y los parámetros
 *   viajan intactos, porque cada paso escribe solo lo que toca, sobre el mismo borrador (TEST-EDP-055).
 */
import type { AgendaDeEntrenamiento, EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
type SesionE = NonNullable<Bloques[number]['sessions']>[number];

export const PASOS_DEL_ASISTENTE = ['Punto de partida', 'Estructura', 'Ejercicios', 'Prescripción', 'Días de la semana', 'Revisar', 'Activar'] as const;
export type PasoDelAsistente = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** El paso que pide la dirección (`asistente=4`), o `null` si no se pidió el asistente o el número no es un paso. */
export function pasoPedido(valor: string | null): PasoDelAsistente | null {
  if (valor === null || !/^[1-7]$/.test(valor)) return null;
  return Number(valor) as PasoDelAsistente;
}

const todasLasSesiones = (bloques: Bloques): SesionE[] => bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]);

/** Un ejercicio sin prescribir: ninguna serie con repeticiones y sin criterio. */
const sinPrescribir = (p: SesionE['prescriptions'][number]): boolean => p.intensity === null && p.sets.every((s) => s.repetitions === null);

/** El paso que se sugiere para seguir un borrador. Nunca el 1 (el borrador ya existe) ni el 7 (activar se elige). */
export function pasoQueSigue(bloques: Bloques, agenda: AgendaDeEntrenamiento | null): PasoDelAsistente {
  const sesiones = todasLasSesiones(bloques);
  if (sesiones.length === 0) return 2;
  if (sesiones.some((s) => s.prescriptions.length === 0)) return 3;
  if (sesiones.some((s) => s.prescriptions.some(sinPrescribir))) return 4;
  const conDias = new Set((agenda?.sessions ?? []).map((s) => s.sessionId));
  if (sesiones.length > 1 && sesiones.some((s) => !s.sessionId || !conDias.has(s.sessionId))) return 5;
  return 6;
}

export const COPY_ASISTENTE = {
  pasoNDe7: (n: number) => `Paso ${n} de 7`,
  pasos: 'Los pasos del asistente',
  sugerido: 'sugerido',
  siguiente: (n: PasoDelAsistente) => `Siguiente: ${PASOS_DEL_ASISTENTE[n - 1]}`,
  atras: 'Atrás',
  seguirEnLaEstacion: 'Seguir en la estación',
  guardando: 'Guardando antes de seguir…',
  noAvanzo: 'No se pudo guardar, así que no se avanzó. Lo escrito sigue acá.',
  seguirConElAsistente: (n: number) => `Seguir con el asistente · paso ${n} de 7`,
  // Paso 1
  puntoDePartida: '¿Desde dónde arrancás?',
  elegiUnPuntoDePartida: 'Elegí desde dónde arrancás.',
  copiarLaVigente: 'Copiar el plan vigente',
  copiarLaVigenteDetalle: 'Las sesiones, los ejercicios y los días de la versión activa, para ajustarlos.',
  desdeUnaPlantilla: 'Desde una plantilla',
  desdeUnaPlantillaDetalle: 'Una de tus plantillas de plan.',
  desdeUnPreset: 'Desde un preset',
  desdeUnPresetDetalle: 'Una estructura de BE: nombres de sesiones y días sugeridos, sin ejercicios.',
  enBlanco: 'En blanco',
  enBlancoDetalle: 'Un bloque vacío: vos armás todo.',
  yaHayBorrador: 'Este borrador ya tiene su punto de partida. Para empezar de otro, descartá la versión en preparación desde el «⋯»: lo armado se borra, y la versión activa no cambia.',
  // Pasos 2 a 7
  estructura: '¿Cuántas sesiones tiene la semana, y cómo se llaman?',
  presetDeEstructura: 'Usar un preset de estructura',
  agregarSesion: 'Agregar una sesión',
  nombreDeLaSesion: (n: number) => `Nombre de la sesión ${n}`,
  ejercicios: '¿Qué ejercicios lleva cada sesión?',
  agregarEjercicios: (sesion: string) => `Agregar ejercicios a ${sesion}`,
  sinEjercicios: 'Sin ejercicios todavía.',
  prescripcion: '¿Cómo se prescribe cada ejercicio?',
  presetDePrescripcion: (sesion: string) => `Aplicar un preset a ${sesion}`,
  dias: '¿Qué días va cada sesión?',
  diasAyuda: 'Los días son opcionales: sin días, la persona elige cuándo hacer cada sesión.',
  revisar: 'Lo que impide activar y lo que queda sin completar',
  revisarAyuda: 'Revisar mira la forma del plan, no la calidad del programa.',
  irEnLaEstacion: 'Ir a corregirlo en la estación',
  activar: 'Activar la versión',
  activarAyuda: (persona: string) => `«Revisar y activar…» abre lo que va a ver ${persona}, la fecha de la próxima revisión y el botón para activar.`,
} as const;

/**
 * TEST-EDP-017 · «Siguiente» nunca avanza sin la respuesta del servidor: con algo sin guardar, guarda y espera; si el
 * guardado falla (o no se pudo intentar), no avanza y lo escrito sigue en pantalla. Mientras viaja otro guardado, espera
 * a que termine. Sin cambios, avanza sin escribir nada (pasar por un paso no toca el borrador: TEST-EDP-055).
 */
export async function sePuedeAvanzar(p: { readonly sucio: boolean; readonly guardando: boolean; readonly guardar: () => Promise<unknown> }): Promise<boolean> {
  if (p.guardando) return false;
  if (!p.sucio) return true;
  return (await p.guardar()) != null;
}
