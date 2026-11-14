/**
 * WP-PULIDO-GRANDES PG-16 (DL-173; PG-D11): lo que el website hace con las notas propias del profesional, sin React, para
 * que una prueba lo fije (TEST-PG-015) y el bloc de la ficha y los dos editores digan lo mismo.
 * - **Dónde aparece una nota atada** (PG-T67): al lado de su ejercicio (por el ejercicio del catálogo) o de cada comida con
 *   su nombre, sin importar mayúsculas, tildes ni espacios de más. Una archivada no aparece.
 * - **Cómo se dice el ancla:** «Sobre el ejercicio Sentadilla»; si ya no está en el plan, «Del ejercicio Sentadilla, que ya
 *   no está en el plan» (PG-T68). Sin plan de esa área, solo «Sobre…».
 * - **Lo que dicen las pantallas**, en un solo lugar: el bloc dice que solo las ve quien las escribe y que la persona las
 *   recibe si pide sus datos (PG-D11). Nada califica ni resume.
 * - **Con «Ocultar nombres»** (PG-T73) la pantalla se está mostrando a otros: el texto de las notas no se ve hasta que el
 *   profesional lo pide, en esa pantalla.
 */
import type { AnclaDeNotaPropia, NotaPropia } from './contratos-notas-propias';

export const COPY_NOTAS_PROPIAS = {
  titulo: 'Tus notas',
  queSon: 'Solo las ves vos. No se mandan a nadie; si la persona pide sus datos, las recibe.',
  escribir: 'Nota para vos',
  ayudaDelCampo: 'Lo que necesitás recordar de esta persona. Hasta 1000 caracteres.',
  guardar: 'Guardar la nota',
  guardando: 'Guardando…',
  guardada: 'Nota guardada.',
  vacio: 'Todavía no anotaste nada. Lo que escribas acá queda con su fecha.',
  archivar: 'Archivar',
  archivando: 'Archivando…',
  archivada: (cuando: string) => `Archivada el ${cuando}`,
  archivadaAviso: 'Nota archivada: sigue en «Archivadas».',
  archivadas: (n: number) => (n === 1 ? 'Archivadas (1)' : `Archivadas (${n})`),
  delDia: (cuando: string) => `Del ${cuando}`,
  anotarSobreElEjercicio: 'Anotar sobre este ejercicio',
  anotarSobreLaComida: 'Anotar sobre esta comida',
  tituloDelCuadroDelEjercicio: (nombre: string) => `Nota sobre ${nombre}`,
  tituloDelCuadroDeLaComida: (nombre: string) => `Nota sobre la comida «${nombre}»`,
  ayudaDelCuadro: 'Solo la ves vos. Aparece al lado de este lugar cada vez que armes el plan, y también en «Tus notas» del Resumen.',
  tuNota: 'Tu nota',
  tusNotas: (n: number) => (n === 1 ? 'Tu nota' : `Tus ${n} notas`),
  noSePudoLeer: 'No pudimos leer tus notas.',
  sinAcceso: 'Hoy no acompañás a esta persona: tus notas quedan guardadas, y no se pueden leer ni agregar.',
  hayMas: (tope: number) => `Se ven las ${tope} más nuevas.`,
  soloVos: 'Solo las ves vos',
  faltaElTexto: 'Escribí la nota para guardarla.',
  quedan: (n: number) => (n === 1 ? 'Te queda 1 carácter.' : `Te quedan ${n} caracteres.`),
  // PG-T73: con «Ocultar nombres» la pantalla se muestra a otros: el texto de las notas no se ve hasta pedirlo.
  ocultas: 'Ocultas mientras «Ocultar nombres» está prendido.',
  mostrar: 'Mostrar en esta pantalla',
  volverAOcultar: 'Volver a ocultar',
} as const;

/** El nombre de una comida para compararlo: sin tildes, en minúsculas y con un solo espacio entre palabras. */
export function claveDeLaComida(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Si dos nombres de comida son la misma comida para una nota: «Almuerzo» y « almuerzo » sí; «Almuerzo» y «Cena», no. */
export const mismaComida = (a: string, b: string): boolean => claveDeLaComida(a) === claveDeLaComida(b);

/** Las notas que siguen activas, de la más nueva a la más vieja. */
export function notasActivas(notas: readonly NotaPropia[]): NotaPropia[] {
  return notas.filter((n) => n.archivedAt === null).sort(deLaMasNueva);
}

/** Las archivadas, de la última archivada a la primera. */
export function notasArchivadas(notas: readonly NotaPropia[]): NotaPropia[] {
  return notas.filter((n) => n.archivedAt !== null).sort((a, b) => (b.archivedAt as string).localeCompare(a.archivedAt as string) || b.noteId.localeCompare(a.noteId));
}

const deLaMasNueva = (a: NotaPropia, b: NotaPropia): number => b.recordedAt.localeCompare(a.recordedAt) || b.noteId.localeCompare(a.noteId);

/** Las notas activas atadas a un ejercicio del catálogo: las que el editor muestra al lado de ese ejercicio. */
export function notasPropiasDelEjercicio(notas: readonly NotaPropia[], exerciseId: string | null): NotaPropia[] {
  if (!exerciseId) return [];
  const id = exerciseId.toLowerCase();
  return notasActivas(notas).filter((n) => n.anchor?.type === 'EXERCISE' && n.anchor.exerciseId.toLowerCase() === id);
}

/** Las notas activas atadas a una comida con ese nombre: las que el editor muestra al lado de esa comida. */
export function notasPropiasDeLaComida(notas: readonly NotaPropia[], nombre: string): NotaPropia[] {
  if (claveDeLaComida(nombre) === '') return [];
  return notasActivas(notas).filter((n) => n.anchor?.type === 'MEAL' && mismaComida(n.anchor.mealLabel, nombre));
}

/** Cómo se dice el ancla de una nota en el bloc; `null` si la nota no está atada a nada. */
export function rotuloDelAncla(ancla: AnclaDeNotaPropia | null): string | null {
  if (!ancla) return null;
  if (ancla.type === 'EXERCISE') return ancla.inPlan === false ? `Del ejercicio ${ancla.exerciseName}, que ya no está en el plan` : `Sobre el ejercicio ${ancla.exerciseName}`;
  return ancla.inPlan === false ? `De la comida «${ancla.mealLabel}», que ya no está en el plan` : `Sobre la comida «${ancla.mealLabel}»`;
}
