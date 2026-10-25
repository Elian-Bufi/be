/**
 * Los textos del centro de novedades y de los avisos push (WP-NOVEDADES-Y-AVISOS, DL-133). Los arma BE para cada actor:
 * dicen qué pasó y quién lo hizo, nunca el contenido (ni datos de salud, ni mediciones, ni el plan; UC-P30, INV-06-32).
 * El aviso push no dice ni eso: solo que hay algo para ver (REG-06-30; UC-E08: «emite un aviso genérico»).
 */
import { ETIQUETA_DE_ALCANCE, type Alcance } from './alcance';
import type { TipoDeNovedad, VistaDeNovedad } from './contratos-novedades';

export interface TextoDeNovedad {
  readonly title: string;
  readonly body: string;
}

/** Lo que hace falta para escribir una novedad: el área y el nombre de quien la originó, tal como este actor lo ve. */
export interface DatosDelTexto {
  readonly alcance: Alcance | null;
  readonly fuente: string | null;
  /** La fecha civil de la novedad: la del día del recordatorio o, en una sesión pendiente, la fecha prevista (DL-137). */
  readonly fecha?: string | null;
  /**
   * La persona sobre la que trata una nota de coordinación (DL-140), con el nombre que este profesional puede ver de ella
   * (DL-040: el visible con un vínculo vigente; si no, la referencia neutral).
   */
  readonly sujeto?: string | null;
  /**
   * WP-ADMINISTRACION (D-6): la decisión de Administración que cuenta una novedad al profesional: el hecho del 06, el texto
   * que se le comunicó y si después de la decisión puede operar el área. Nunca el fundamento interno.
   */
  readonly decision?: { readonly hecho: string; readonly mensaje: string | null; readonly puedeOperar: boolean } | null;
  /** WP-ADMINISTRACION: el profesional del que trata el aviso a una persona vinculada, con el nombre que ella ve. */
  readonly profesional?: string | null;
}

const area = (alcance: Alcance | null): string => (alcance ? ETIQUETA_DE_ALCANCE[alcance] : 'BE');
const quien = (fuente: string | null, siNoHay: string): string => fuente ?? siNoHay;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
/** «del miércoles»: el día de la semana de una fecha civil, sin depender de la zona. */
const delDia = (fecha: string | null | undefined): string => (fecha ? `del ${DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]}` : 'de un día anterior');

/** El título y el texto de cada tipo. Un tipo que este código no conoce no llega acá: la API solo emite los conocidos. */
export function textoDeNovedad(tipo: TipoDeNovedad, d: DatosDelTexto): TextoDeNovedad {
  switch (tipo) {
    case 'PLAN_ACTIVATED':
      return { title: `Plan nuevo de ${area(d.alcance)}`, body: `${quien(d.fuente, 'Tu profesional')} activó una versión nueva de tu plan de ${area(d.alcance)}.` };
    case 'REVIEW_RECORDED':
      return { title: `Revisión de ${area(d.alcance)}`, body: `${quien(d.fuente, 'Tu profesional')} registró una revisión de ${area(d.alcance)}.` };
    case 'RELATIONSHIP_REQUEST_RECEIVED':
      return { title: 'Solicitud de vínculo', body: `${quien(d.fuente, 'Alguien')} te envió una solicitud de vínculo de ${area(d.alcance)}.` };
    case 'RELATIONSHIP_REQUEST_ACCEPTED':
      return { title: 'Solicitud aceptada', body: `${quien(d.fuente, 'La otra parte')} aceptó tu solicitud de vínculo de ${area(d.alcance)}.` };
    case 'RELATIONSHIP_REQUEST_REJECTED':
      return { title: 'Solicitud rechazada', body: `Una solicitud de vínculo de ${area(d.alcance)} que enviaste fue rechazada.` };
    case 'RELATIONSHIP_PAUSED':
      return { title: `Vínculo de ${area(d.alcance)} en pausa`, body: `${quien(d.fuente, 'La otra parte')} pausó el vínculo de ${area(d.alcance)}. La historia se conserva.` };
    case 'RELATIONSHIP_RESUMED':
      return { title: `Vínculo de ${area(d.alcance)} reanudado`, body: `${quien(d.fuente, 'La otra parte')} reanudó el vínculo de ${area(d.alcance)}.` };
    case 'RELATIONSHIP_ENDED':
      return { title: `Vínculo de ${area(d.alcance)} finalizado`, body: `${quien(d.fuente, 'La otra parte')} finalizó el vínculo de ${area(d.alcance)}. La historia se conserva.` };
    case 'CONSENT_REVOKED':
      return {
        title: `Consentimiento de ${area(d.alcance)} revocado`,
        body: `${quien(d.fuente, 'La persona')} revocó el consentimiento de datos de salud de ${area(d.alcance)}. Ya no ves su información de esa área.`,
      };
    case 'MEAL_LOG_REMINDER':
      return { title: 'Recordatorio', body: 'Hoy todavía no registraste comidas. Si ya comiste, registralo en Nutrición.' };
    case 'TRAINING_LOG_REMINDER':
      return { title: 'Recordatorio', body: 'Hoy tenías una sesión de entrenamiento y todavía no la registraste. Si entrenaste, registrala; si no, podés hacerla otro día o saltearla.' };
    case 'TRAINING_SESSION_TODAY_REMINDER':
      return { title: 'Entrenamiento de hoy', body: 'Hoy tenés una sesión de tu plan de entrenamiento. Abrí Entrenamiento para verla.' };
    case 'TRAINING_SESSION_PENDING_REMINDER':
      return { title: 'Sesión pendiente', body: `Te quedó pendiente una sesión ${delDia(d.fecha)}. Podés hacerla hoy o saltearla, desde Entrenamiento.` };
    // DL-140 (CRD-D6): quién la escribió y sobre quién; nunca el texto, que se lee en la ficha con su autorización.
    case 'COORDINATION_NOTE_RECEIVED':
      return { title: 'Nota de coordinación', body: `${quien(d.fuente, 'Otro profesional')} dejó una nota de coordinación sobre ${d.sujeto ?? 'una persona que acompañás'}.` };
    // WP-ADMINISTRACION (D-6): la decisión, lo que se le comunicó y qué significa. Sin el fundamento interno.
    case 'ADMINISTRATIVE_DECISION':
      return textoDeDecisionAdministrativa(area(d.alcance), d.decision ?? null);
    // A la persona: el efecto operativo, sin motivos (D-6). El nombre es el que ella ve de su profesional.
    case 'PROFESSIONAL_ACCESS_SUSPENDED':
      return {
        title: `Acceso de tu profesional a ${area(d.alcance)}`,
        body: `${quien(d.profesional ?? null, 'Tu profesional')} tiene suspendido el acceso a ${area(d.alcance)} en BE. ${mientrasNoOpera(d.alcance)} Lo que ya registraste se conserva.`,
      };
    case 'PROFESSIONAL_ACCESS_RESTORED':
      return {
        title: `Acceso de tu profesional a ${area(d.alcance)}`,
        body: `${quien(d.profesional ?? null, 'Tu profesional')} volvió a tener acceso a ${area(d.alcance)} en BE. Puede ver tu información de ${area(d.alcance)} solo si su vínculo con vos y tu autorización siguen vigentes.`,
      };
  }
}

/** Lo que la persona deja de poder hacer mientras su profesional no opera el área: lo que se decide con los dos (UC-P12 E06). */
function mientrasNoOpera(alcance: Alcance | null): string {
  if (alcance === 'NUTRICION') return 'Mientras tanto, no puede ver tu información de Nutrición y no podés registrar comidas en el plan que te indicó.';
  if (alcance === 'ENTRENAMIENTO') return 'Mientras tanto, no puede ver tu información de Entrenamiento y no podés registrar sesiones en el plan que te indicó.';
  if (alcance === 'ANTROPOMETRIA') return 'Mientras tanto, no puede ver ni registrar tus tomas de Antropometría.';
  return 'Mientras tanto, no puede ver tu información de esa área.';
}

/**
 * El texto al profesional de cada decisión de Administración (D-6): qué se decidió sobre qué área, lo que Administración le
 * escribió y qué significa. Sin botones ni promesas de acciones que no existen: no dice «respondé» ni «subsaná».
 */
function textoDeDecisionAdministrativa(area: string, d: { readonly hecho: string; readonly mensaje: string | null; readonly puedeOperar: boolean } | null): TextoDeNovedad {
  const dijo = d?.mensaje ? ` Administración te escribió: «${d.mensaje}».` : '';
  const opera = d?.puedeOperar ? ` Podés operar ${area} en BE.` : '';
  switch (d?.hecho) {
    case 'ObservacionRegistrada':
      return { title: `Observación sobre ${area}`, body: `Administración de BE registró una observación sobre tu presentación de ${area}.${dijo} Tu verificación sigue pendiente.` };
    case 'AlcanceVerificado':
      return { title: `${area}: verificación`, body: `Administración de BE verificó tu presentación de ${area}.${dijo}${d.puedeOperar ? opera : ' Para operar el área falta la habilitación.'}` };
    case 'AlcanceRechazado':
      return { title: `${area}: verificación rechazada`, body: `Administración de BE rechazó tu presentación de ${area}.${dijo} No podés operar ${area} en BE.` };
    case 'AlcanceSuspendido':
      return {
        title: `${area}: acceso suspendido`,
        body: `Administración de BE suspendió tu acceso a ${area} en BE.${dijo} Mientras dure, no podés operar ${area}; tus planes, registros y borradores se conservan, y las otras áreas no cambian.`,
      };
    case 'AlcanceRehabilitado':
      return {
        title: `${area}: verificación rehabilitada`,
        body: `Administración de BE rehabilitó tu verificación de ${area}.${dijo}${d.puedeOperar ? `${opera} El acceso a cada persona depende de su vínculo y su autorización.` : ' Todavía no podés operar el área: la habilitación no está vigente.'}`,
      };
    case 'HabilitacionConcedida':
      return {
        title: `${area}: habilitación concedida`,
        body: `Administración de BE te concedió la habilitación para operar ${area} en BE.${dijo}${d.puedeOperar ? opera : ' Todavía no podés operar el área: la verificación no está vigente.'}`,
      };
    case 'HabilitacionRetirada':
      return {
        title: `${area}: habilitación retirada`,
        body: `Administración de BE retiró tu habilitación para operar ${area} en BE.${dijo} Tus planes, registros y borradores se conservan, y las otras áreas no cambian.`,
      };
    default:
      return { title: `${area}: decisión de Administración`, body: `Administración de BE registró una decisión sobre ${area}.${dijo}` };
  }
}

/** La pantalla que resuelve cada tipo, según quién lo lee. */
export function vistaDeNovedad(tipo: TipoDeNovedad, alcance: Alcance | null, lectorEsProfesional: boolean): VistaDeNovedad {
  switch (tipo) {
    case 'PLAN_ACTIVATED':
      return alcance === 'ENTRENAMIENTO' ? 'TRAINING' : alcance === 'NUTRICION' ? 'NUTRITION' : 'NEWS';
    // REV-A (DL-134): la persona lee la revisión completa.
    case 'REVIEW_RECORDED':
      return alcance === 'ENTRENAMIENTO' ? 'TRAINING_REVIEW' : alcance === 'NUTRICION' ? 'NUTRITION_REVIEW' : 'NEWS';
    case 'MEAL_LOG_REMINDER':
      return 'NUTRITION';
    case 'TRAINING_LOG_REMINDER':
    case 'TRAINING_SESSION_TODAY_REMINDER':
    case 'TRAINING_SESSION_PENDING_REMINDER':
      return 'TRAINING';
    case 'CONSENT_REVOKED':
    // DL-140: la ficha de la persona sobre la que trata la nota; su Resumen muestra las notas recientes del equipo.
    case 'COORDINATION_NOTE_RECEIVED':
      return 'ADVISEE';
    // Para el profesional: la ficha de la persona si hay o hubo vínculo; el espacio profesional si es una solicitud. Para
    // la persona: sus vínculos.
    case 'RELATIONSHIP_REQUEST_RECEIVED':
    case 'RELATIONSHIP_REQUEST_REJECTED':
      return lectorEsProfesional ? 'PRO_HOME' : 'RELATIONSHIPS';
    case 'RELATIONSHIP_REQUEST_ACCEPTED':
    case 'RELATIONSHIP_PAUSED':
    case 'RELATIONSHIP_RESUMED':
    case 'RELATIONSHIP_ENDED':
      return lectorEsProfesional ? 'ADVISEE' : 'RELATIONSHIPS';
    // WP-ADMINISTRACION: el profesional la lee entera en el centro; la persona va a sus vínculos (vistas que la APK conoce).
    case 'ADMINISTRATIVE_DECISION':
      return 'NEWS';
    case 'PROFESSIONAL_ACCESS_SUSPENDED':
    case 'PROFESSIONAL_ACCESS_RESTORED':
      return 'RELATIONSHIPS';
    default:
      return 'RELATIONSHIPS';
  }
}

/** Los recordatorios son de BE; las demás novedades, de una persona. */
export const esRecordatorio = (tipo: string): boolean =>
  tipo === 'MEAL_LOG_REMINDER' || tipo === 'TRAINING_LOG_REMINDER' || tipo === 'TRAINING_SESSION_TODAY_REMINDER' || tipo === 'TRAINING_SESSION_PENDING_REMINDER';

/** El título del aviso push: siempre el mismo. */
export const TITULO_DEL_AVISO_PUSH = 'BE';

/**
 * El texto del aviso push: cuántas cosas hay para ver y, si son solo recordatorios, que lo son. Nada más (UC-E08 §13.8.6:
 * sin datos de salud, sin nombres, sin planes; «no permite inferir contenido protegido»).
 */
export function textoDelAvisoPush(tipos: readonly string[]): string {
  const n = tipos.length;
  if (n <= 1) return tipos.length === 1 && esRecordatorio(tipos[0]!) ? 'Tenés un recordatorio para hoy.' : 'Tenés una novedad.';
  return tipos.every(esRecordatorio) ? `Tenés ${n} recordatorios para hoy.` : `Tenés ${n} novedades.`;
}

/** Los textos de las pantallas del centro y de las preferencias (website y APK). */
export const COPY_NOVEDADES = {
  titulo: 'Novedades',
  vacio: 'Todavía no tenés novedades. Cuando tu profesional active un plan o registre una revisión, aparece acá.',
  vacioProfesional: 'Todavía no tenés novedades. Cuando una persona acepte una solicitud o cambie un vínculo, aparece acá.',
  noLeida: 'Sin leer',
  deBe: 'BE',
  abrir: 'Ver',
  errorAlCargar: 'No pudimos cargar tus novedades. Las novedades no se pierden: probá de nuevo en un momento.',
  avisosTitulo: 'Avisos en este teléfono',
  avisosExplicacion:
    'Un aviso dice solo que tenés algo para ver en BE, sin datos de salud ni nombres. El detalle lo ves acá, en Novedades, con tu sesión.',
  avisosActivar: 'Activar avisos',
  avisosDesactivar: 'Desactivar avisos',
  avisosActivos: 'Los avisos están activos en este teléfono.',
  avisosInactivos: 'Los avisos están apagados en este teléfono.',
  avisosSinPermiso: 'Android no le dio permiso a BE para mostrar avisos. Podés darlo en los ajustes del teléfono.',
  avisosNoDisponibles: 'Los avisos todavía no están disponibles en esta versión de la app. Tus novedades siguen acá.',
  recordatorioComidas: 'Recordarme registrar las comidas (15:00 y 22:00, si ese día no registré ninguna)',
  recordatorioEntrenamiento: 'Recordarme mis sesiones de entrenamiento (10:00 el día que toca o si quedó una pendiente, y 22:00 si no la registré)',
  recordatoriosExplicacion: 'Los recordatorios llegan como avisos y quedan en Novedades. Podés apagarlos cuando quieras.',
  guardado: 'Guardado.',
} as const;

/**
 * REV-A (DL-134): las revisiones que la persona lee en la APK. El resultado lleva su nombre (ETIQUETA_DE_RESULTADO) y lo
 * que significa para su plan, dicho para ella: sin juicios ni puntajes (REG-06-117 y 125).
 */
export const COPY_REVISIONES_PROPIAS = {
  titulo: 'Tus revisiones',
  entrada: 'Ver las revisiones de tu profesional',
  /** Para el profesional, al escribir la revisión (propuesta REV-A, §3, D1): información, no una restricción. */
  laPersonaLaLee: 'La persona lee la revisión completa en su app: lo que observaste, lo que decidís y por qué.',
  explicacion: 'Las revisiones que registraron tus profesionales, completas: qué observaron, qué decidieron, por qué y qué sigue.',
  vacio: 'Todavía no hay revisiones registradas.',
  sinA3: 'Para ver tu historia, BE necesita tu autorización de datos de salud vigente. Podés darla en Cuenta, en Privacidad.',
  noDisponible: 'Esta revisión no está disponible.',
  sinAplicar: 'Todavía no se aplicó.',
  aplicadaEl: (dia: string) => `Se aplicó el ${dia}.`,
  revisionDel: (fecha: string) => `Revisión del ${fecha}`,
  queSignifica: {
    MAINTAIN: 'Tu plan sigue igual.',
    ADJUST: 'Tu profesional va a preparar una versión ajustada de tu plan. Cuando la active, vas a ver el aviso.',
    REPLACE: 'Tu profesional va a preparar un plan nuevo que reemplaza al actual. Cuando lo active, vas a ver el aviso.',
    RESCHEDULE_REVIEW: 'Se fijó otra fecha para la próxima revisión. Tu plan sigue igual.',
    CHANGE_OBJECTIVE: 'Cambia el objetivo de tu seguimiento. El plan se ajusta aparte.',
    FINALIZE: 'Se cierra este seguimiento. Tu historia se conserva.',
  } as Readonly<Record<'MAINTAIN' | 'ADJUST' | 'REPLACE' | 'RESCHEDULE_REVIEW' | 'CHANGE_OBJECTIVE' | 'FINALIZE', string>>,
} as const;
