/**
 * ED-15, ED-17, ED-24 y ED-25 (WP-EDITORES-PROFESIONAL, §2.2) · La estación de tres zonas, sin React: los textos de la
 * barra, de las zonas y del panel, los días de cada sesión en siete chips y la ayuda de primer uso.
 *
 * Los chips escriben la misma agenda de DL-137 (`AgendaDeEntrenamiento`): el inicio, los avisos y lo que se mueve no
 * cambian. Un día con dos sesiones se dice, no se impide (TEST-EDP-025).
 */
import { DIAS_DE_LA_SEMANA, type AgendaDeEntrenamiento, type DiaDeLaSemana } from '@be/domain';

export const DIA_CORTO: Readonly<Record<DiaDeLaSemana, string>> = { MONDAY: 'L', TUESDAY: 'M', WEDNESDAY: 'X', THURSDAY: 'J', FRIDAY: 'V', SATURDAY: 'S', SUNDAY: 'D' };
export const DIA_LARGO: Readonly<Record<DiaDeLaSemana, string>> = { MONDAY: 'lunes', TUESDAY: 'martes', WEDNESDAY: 'miércoles', THURSDAY: 'jueves', FRIDAY: 'viernes', SATURDAY: 'sábado', SUNDAY: 'domingo' };

/** Prende o apaga un día de una sesión. Sin agenda, nace una que empieza hoy (como «Armar la agenda» de DL-137). */
export function alternarDia(agenda: AgendaDeEntrenamiento | null, sessionId: string, dia: DiaDeLaSemana, hoy: string): AgendaDeEntrenamiento {
  const base: AgendaDeEntrenamiento = agenda ?? { startDate: hoy, sessions: [], moves: [] };
  const actuales = base.sessions.find((s) => s.sessionId === sessionId)?.weekdays ?? [];
  const nuevos = actuales.includes(dia) ? actuales.filter((d) => d !== dia) : DIAS_DE_LA_SEMANA.filter((d) => d === dia || actuales.includes(d));
  return conDias(base, sessionId, nuevos);
}

/** ED-20: los días que trajo un preset de estructura, confirmados de una vez. */
export const ponerDias = (agenda: AgendaDeEntrenamiento | null, sessionId: string, dias: readonly DiaDeLaSemana[], hoy: string): AgendaDeEntrenamiento =>
  conDias(agenda ?? { startDate: hoy, sessions: [], moves: [] }, sessionId, DIAS_DE_LA_SEMANA.filter((d) => dias.includes(d)));

/** «Sin día»: la sesión sale de la agenda (la persona elige cuándo hacerla). */
export const sinDias = (agenda: AgendaDeEntrenamiento, sessionId: string): AgendaDeEntrenamiento => conDias(agenda, sessionId, []);

function conDias(agenda: AgendaDeEntrenamiento, sessionId: string, dias: readonly DiaDeLaSemana[]): AgendaDeEntrenamiento {
  const otras = agenda.sessions.filter((s) => s.sessionId !== sessionId);
  const esta = agenda.sessions.findIndex((s) => s.sessionId === sessionId);
  const nueva = dias.length > 0 ? [{ sessionId, weekdays: [...dias] }] : [];
  // Se conserva el lugar de la sesión en la agenda: un chip no reordena nada.
  const sessions = esta < 0 ? [...otras, ...nueva] : [...agenda.sessions.slice(0, esta), ...nueva, ...agenda.sessions.slice(esta + 1)];
  return { ...agenda, sessions };
}

/** TEST-EDP-025: los días que esta sesión comparte con otra, con su nombre («martes, con Torso A»). Se dicen, no se impiden. */
export function diasCompartidos(agenda: AgendaDeEntrenamiento | null, sessionId: string, nombreDe: (sessionId: string) => string): readonly string[] {
  if (!agenda) return [];
  const mios = agenda.sessions.find((s) => s.sessionId === sessionId)?.weekdays ?? [];
  return mios.flatMap((d) => {
    const otras = agenda.sessions.filter((s) => s.sessionId !== sessionId && s.weekdays.includes(d)).map((s) => nombreDe(s.sessionId));
    return otras.length > 0 ? [`${DIA_LARGO[d]}, con ${otras.join(' y ')}`] : [];
  });
}

/** La tira de la semana: qué sesiones tiene cada día, en orden. */
export function tiraDeLaSemana(agenda: AgendaDeEntrenamiento | null, nombreDe: (sessionId: string) => string): readonly { readonly dia: DiaDeLaSemana; readonly sesiones: readonly string[] }[] {
  return DIAS_DE_LA_SEMANA.map((dia) => ({ dia, sesiones: (agenda?.sessions ?? []).filter((s) => s.weekdays.includes(dia)).map((s) => nombreDe(s.sessionId)) }));
}

export const COPY_ESTACION = {
  saltos: 'Saltos de la estación',
  irALaEstructura: 'Ir a la estructura',
  irAlEditor: 'Ir al editor',
  irAlPanel: 'Ir al panel',
  estructura: 'Estructura',
  editor: 'La sesión',
  panel: 'Panel',
  abrirPanel: 'Panel',
  cerrarPanel: 'Cerrar el panel',
  sesiones: 'Sesiones',
  masSesion: 'Sesión',
  sinDia: 'Sin día',
  diasDe: (sesion: string) => `Días de ${sesion}`,
  confirmarDelPreset: (dias: string) => `Confirmar ${dias} · del preset`,
  primeroGuardar: 'Se guarda sola en un momento; después elegís sus días.',
  compartido: (dias: readonly string[]) => `Comparte ${dias.join('; ')}. Se puede: solo se avisa.`,
  sinSesionEseDia: 'Sin sesión',
  semana: 'La semana',
  presets: 'Presets',
  ejercicios: 'Ejercicios',
  // El panel (ED-25)
  pestanaAntes: 'Antes de activar',
  pestanaSemana: 'Lo que trabaja la semana',
  pestanaOtras: 'Otras áreas',
  impide: 'Impide activar',
  nadaImpide: 'Nada impide activar.',
  quedaSinCompletar: 'Queda sin completar',
  noImpide: 'no impide',
  nadaSinCompletar: 'No queda nada sin completar.',
  irACorregir: 'Ir a corregir',
  enVivo: (persona: string | null) => `Esta pestaña se actualiza mientras escribís. «Revisar y activar…» abre lo mismo, con lo que va a ver ${persona ?? 'la persona'} y la fecha de la revisión.`,
  semanaComoSeCuenta: 'Una serie por cada zona de su ejercicio, por rol, contada del plan de esta semana. Sin mínimos ni un ideal, y nunca junto a lo registrado.',
  semanaMasAdelante: 'La cuenta por zona necesita las zonas de cada ejercicio del catálogo; la suma la próxima entrega de esta estación. Mientras tanto, cada sesión muestra sus zonas en el plan activo.',
  // El «⋯» de la barra (ED-12)
  masDeLaVersion: 'más acciones de la versión',
  guardarComoPreset: 'Guardar como preset',
  elPlanComoPlantilla: 'El plan, como plantilla',
  laSesionComoHabitual: 'Esta sesión, como sesión habitual',
  lasSeriesComoPrescripcion: 'Estas series, como prescripción habitual',
  prescripcionHabitualMasAdelante: 'Llega con la próxima actualización del servidor.',
  galeriaDeEstructura: 'Presets de estructura',
  rehacerConElAsistente: 'Rehacer con el asistente',
} as const;

/** ED-17: la ayuda de primer uso de la estación, de tres renglones; se cierra y se recuerda en el navegador. */
export const PRIMER_USO_DE_LA_ESTACION = {
  clave: 'be.primer-uso.estacion.v1',
  titulo: 'Cómo se usa la estación',
  renglones: [
    'A la izquierda, la estructura: el bloque, las semanas y las sesiones con sus días.',
    'Al centro, la sesión elegida; arriba de cada ejercicio, la prescripción en una línea.',
    'A la derecha, lo que impide activar, en vivo. Se guarda sola: guardar no activa.',
  ],
  cerrar: 'Entendido',
  dondeEsta: 'Está también en «Cómo se lee esta vista».',
} as const;
