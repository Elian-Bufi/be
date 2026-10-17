/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DL-137): los textos de la agenda del plan, para el editor del website y para la APK. Dicen
 * qué días va cada sesión y desde cuándo, sin juicios: una sesión salteada es «no realizada» porque la persona lo dijo,
 * nunca por no haberla registrado (REG-06-131).
 */
import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana } from './contratos-entrenamiento';
import { diaDeLaSemana, type ProblemaDeAgenda } from './agenda-de-entrenamiento';

export const NOMBRE_DEL_DIA: Readonly<Record<DiaDeLaSemana, string>> = {
  MONDAY: 'lunes',
  TUESDAY: 'martes',
  WEDNESDAY: 'miércoles',
  THURSDAY: 'jueves',
  FRIDAY: 'viernes',
  SATURDAY: 'sábado',
  SUNDAY: 'domingo',
};

/** Para los botones de los días: dos letras, que no se confunden (martes y miércoles). */
export const DIA_ABREVIADO: Readonly<Record<DiaDeLaSemana, string>> = {
  MONDAY: 'Lu',
  TUESDAY: 'Ma',
  WEDNESDAY: 'Mi',
  THURSDAY: 'Ju',
  FRIDAY: 'Vi',
  SATURDAY: 'Sá',
  SUNDAY: 'Do',
};

/** «miércoles»: el día de la semana de una fecha civil. */
export const nombreDelDia = (fecha: string): string => NOMBRE_DEL_DIA[diaDeLaSemana(fecha)];

/** «Mañana», «El jueves 23»: cuándo es una fecha cercana, dicho desde hoy. */
export function cuandoEs(fecha: string, hoy: string): string {
  const dias = Math.round((new Date(`${fecha}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime()) / 86_400_000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `El ${nombreDelDia(fecha)} ${Number(fecha.slice(8, 10))}`;
}

/** «lunes y jueves», «lunes, miércoles y viernes», «todos los días»: en el orden de la semana, sin repetir. */
export function diasDeLaSemanaEnPalabras(dias: readonly DiaDeLaSemana[]): string {
  const elegidos = DIAS_DE_LA_SEMANA.filter((d) => dias.includes(d));
  if (elegidos.length === 7) return 'todos los días';
  const nombres = elegidos.map((d) => NOMBRE_DEL_DIA[d]);
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** «el lunes 19 de octubre»: el día de la semana y la fecha, sin el año (las fechas de la agenda son cercanas). */
export function fechaDeLaAgenda(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = NOMBRE_DEL_DIA[DIAS_DE_LA_SEMANA[(d.getUTCDay() + 6) % 7] as DiaDeLaSemana];
  const mes = new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' }).format(d);
  return `el ${dia} ${d.getUTCDate()} de ${mes}`;
}

export const COPY_AGENDA_DE_ENTRENAMIENTO = {
  titulo: 'Días de entrenamiento',
  /** Sin agenda: como antes de DL-137. */
  sinAgenda: 'Este plan no tiene días: tu asesorado elige qué sesión hace cada vez, y no recibe avisos de entrenamiento.',
  ponerDias: 'Elegir los días',
  cambiarDias: 'Cambiar los días',
  ocultar: 'Listo',
  quitarDias: 'Quitar los días',
  quitarDiasAyuda: 'Sin días, tu asesorado elige qué sesión hace, y no recibe avisos de entrenamiento.',
  desde: 'Empieza el',
  desdeAyuda: 'Antes de que actives esta versión no hay nada previsto: cuenta desde la activación.',
  sesion: 'Sesión',
  /** Una sesión que todavía no se guardó no tiene identificador: sus días se eligen después de guardar. */
  sesionNueva: 'Guardá los cambios para elegir sus días.',
  sinDias: 'Sin días: la hace cuando quiera.',
  diasDe: (sesion: string): string => `Días de ${sesion}`,
  /** «Lunes y jueves: Torso; Miércoles: Piernas. Desde el lunes 19 de octubre.» */
  resumen: (lineas: readonly string[], desde: string): string => `${lineas.join('; ')}. Desde ${fechaDeLaAgenda(desde)}.`,
  desdeLa: (desde: string): string => `Desde ${fechaDeLaAgenda(desde)}.`,
  ningunaSesionConDias: 'Todavía ninguna sesión tiene días.',
  proximasDosSemanas: 'Las próximas dos semanas',
  sinFechasEnEstasSemanas: 'No hay sesiones previstas en estas dos semanas.',
  mover: 'Mover',
  moverA: 'Pasarla al',
  moverConfirmar: 'Mover',
  moverCancelar: 'Cancelar',
  movidaDesde: (desde: string): string => `Movida desde ${fechaDeLaAgenda(desde)}`,
  deshacerMovimiento: 'Volver a su día',
  /** Lo que cambia para la persona, sin prometer más de lo que hace BE. */
  avisos: 'Con días, tu asesorado ve qué sesión le toca, puede pasarla a otro día o saltearla, y recibe un aviso a las 10 el día que le toca y otro a las 22 si todavía no la registró.',
  sinDiaAsignado: 'Sin día asignado: tu asesorado elige cuál hace.',
  // ── En la APK, para la persona ──
  hoyTeToca: 'Hoy te toca',
  hoyNoHaySesion: 'Hoy no tenés una sesión prevista. Si querés entrenar igual, elegí una sesión de tu plan.',
  tePendiente: 'Te quedó pendiente',
  /** «Piernas A, del miércoles»: una pendiente es de la última semana, así que alcanza con el día. */
  pendiente: (sesion: string, fecha: string): string => `${sesion}, del ${nombreDelDia(fecha)}`,
  hacerlaHoy: 'Hacerla hoy',
  saltearla: 'Saltearla',
  saltearTitulo: 'Saltear la sesión',
  saltearDetalle: (sesion: string, fecha: string): string =>
    `${sesion} del ${nombreDelDia(fecha)} queda registrada como no realizada. Si después la hacés, lo podés corregir desde su registro.`,
  salteada: 'Listo: quedó registrada como no realizada.',
  conDatosCargados: 'Esa sesión ya tiene datos cargados: abrila para terminarla o para marcarla como no realizada.',
  loQueViene: 'Lo que viene',
  /** «Mañana · Piernas A». */
  proxima: (sesion: string, fecha: string, hoy: string): string => `${cuandoEs(fecha, hoy)} · ${sesion}`,
  otrasSesiones: 'Otras sesiones del plan',
  otrasSesionesAyuda: 'Si querés entrenar otra sesión, elegila acá. La que hagas cuenta igual.',
  /** Al empezar una sesión con otra pendiente (Dirección, 2026-10-16): la persona decide. */
  preguntaPendiente: (sesion: string, fecha: string): string => `Te quedó pendiente ${sesion} del ${nombreDelDia(fecha)}`,
  preguntaPendienteDetalle: 'Antes de empezar esta, ¿la salteás o la dejás pendiente?',
  dejarlaPendiente: 'Dejarla pendiente',
  /** En el renglón de la sesión: «Lunes y jueves». */
  diasDeLaSesion: (dias: readonly DiaDeLaSemana[]): string => {
    const t = diasDeLaSemanaEnPalabras(dias);
    return t ? `${t.charAt(0).toUpperCase()}${t.slice(1)}` : '';
  },
} as const;

/** Lo que dice cada problema de una agenda que no se puede guardar (DL-137 D-8). */
export const PROBLEMA_DE_AGENDA: Readonly<Record<ProblemaDeAgenda['code'], string>> = {
  AGENDA_SESSION_UNKNOWN: 'una sesión de la agenda ya no está en el plan',
  AGENDA_SESSION_DUPLICATED: 'una sesión aparece dos veces en la agenda',
  AGENDA_WEEKDAY_DUPLICATED: 'un día está repetido en la misma sesión',
  AGENDA_MOVE_NOT_PLANNED: 'una fecha movida no era un día de esa sesión',
  AGENDA_MOVE_DUPLICATED: 'la misma fecha se movió dos veces',
  AGENDA_MOVE_BEFORE_START: 'una fecha se movió a antes de que empiece la agenda',
  AGENDA_MOVE_COLLISION: 'una fecha se movió a un día en que esa sesión ya va',
};
