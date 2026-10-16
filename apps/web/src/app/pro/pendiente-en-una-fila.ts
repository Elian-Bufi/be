/**
 * Un pendiente de la cartera en una fila (WP-ESCRITORIO-AMABLE, parte 5; API-CAR-01, PF-07, DL-107): qué está
 * pendiente, con las frases de BE (`COPY_CARTERA`); el último registro, como dato que lo acompaña; y a dónde lleva
 * «Abrir».
 * - Las fechas son civiles, en la zona con que la API clasificó las revisiones (`timeZone`): no pasan por la del
 *   navegador. Cómo se escribe un día lo decide la pantalla (`dia`): acá se decide qué día es.
 * - El ícono acompaña a la palabra y sale del tipo: ninguno se colorea ni dice urgencia.
 * - Sin período elegido, la API mira toda la historia: «sin registros en el período» sería hablar de un período que no hay.
 */
import { COPY_CARTERA, fechaCivil, type DominioDeCartera, type NombreDeIcono, type PendienteDeCartera, type TipoDePendiente, type VistaDePendientes } from '@be/domain';

/** El ícono de cada tipo de pendiente (la pantalla 13 de las maquetas). */
export const ICONO_DEL_PENDIENTE: Readonly<Record<TipoDePendiente, NombreDeIcono>> = {
  REVIEW_OVERDUE: 'reloj',
  REVIEW_DUE_SOON: 'reloj',
  REVIEW_UNDATED: 'reloj',
  PLAN_DRAFT_PENDING: 'borrador',
  NO_ACTIVE_PLAN: 'plan',
  FORM_REQUEST_OPEN: 'informacion',
  ANTHRO_DRAFT_PENDING: 'borrador',
};

/** El ícono de cada vista con nombre. «Todo» no lleva. */
export const ICONO_DE_LA_VISTA_DE_PENDIENTES: Readonly<Record<VistaDePendientes, NombreDeIcono | null>> = {
  TODO: null,
  REVISIONES: 'revision',
  PLANES: 'plan',
  FORMULARIOS: 'informacion',
  EVALUACIONES: 'antropometria',
};

export const ICONO_DEL_AREA_DE_CARTERA: Readonly<Record<DominioDeCartera, NombreDeIcono>> = { nutrition: 'nutricion', training: 'entrenamiento', anthropometry: 'antropometria' };

/** Cómo escribe la pantalla una fecha civil (`AAAA-MM-DD`). */
type Dia = (fechaCivil: string) => string;

/** Qué está pendiente, con la frase de BE. */
export function textoDePendiente(p: Pick<PendienteDeCartera, 'kind' | 'since' | 'daysOverdue' | 'daysUntil'>, dia: Dia): string {
  const t = COPY_CARTERA.pendiente;
  const desde = p.since ? dia(p.since) : '—';
  switch (p.kind) {
    case 'REVIEW_OVERDUE':
      return t.REVIEW_OVERDUE(p.daysOverdue ?? 0);
    case 'REVIEW_DUE_SOON':
      return t.REVIEW_DUE_SOON(p.daysUntil ?? 0);
    case 'REVIEW_UNDATED':
      return t.REVIEW_UNDATED(desde);
    case 'PLAN_DRAFT_PENDING':
      return t.PLAN_DRAFT_PENDING(desde);
    case 'NO_ACTIVE_PLAN':
      return t.NO_ACTIVE_PLAN();
    case 'FORM_REQUEST_OPEN':
      return t.FORM_REQUEST_OPEN(desde);
    case 'ANTHRO_DRAFT_PENDING':
      return t.ANTHRO_DRAFT_PENDING(desde);
  }
}

/**
 * El último registro de la persona en esa área: el día en que ocurrió, en la zona de la respuesta. Sin ninguno, se dice
 * según lo que se miró: un período elegido, o toda la historia.
 */
export function ultimoRegistroDe(p: Pick<PendienteDeCartera, 'lastActivityAt'>, { zona, conPeriodo, dia }: { zona: string; conPeriodo: boolean; dia: Dia }): string {
  if (p.lastActivityAt) return COPY_CARTERA.ultimoRegistro(dia(fechaCivil(p.lastActivityAt, zona)));
  return conPeriodo ? COPY_CARTERA.sinRegistros : COPY_CARTERA.sinRegistrosTodavia;
}

/** La ruta del website que resuelve el pendiente: la API dice la vista; la página es la del área (o la de formularios). */
export function rutaQueResuelve(p: Pick<PendienteDeCartera, 'advisee' | 'domain' | 'open'>): string {
  const id = encodeURIComponent(p.advisee.identityId);
  if (p.open.view === 'solicitudes') return `/pro/advisees/forms?id=${id}&vista=solicitudes`;
  return `/pro/advisees/${p.domain}?id=${id}&vista=${p.open.view}`;
}
