/**
 * «Tu historial» en filas (DL-170, AV2-22): el período a la vista y una fila por sesión, que se toca entera.
 *
 * Antes, cada sesión era una tarjeta con hasta tres píldoras con borde y un botón propio, y la lista pedía 90 días sin
 * decirlo. Ahora, como una lista agrupada (Apple HIG, Material 3, Strong y Hevy):
 * - la lista dice su período: «Últimos 90 días»;
 * - cada sesión es una fila: el nombre, la fecha («9 nov») y el estado como etiqueta neutra, con la tilde en `exito` si
 *   fue realizada, también con desvío, que se dice en palabras. «Cargada como el plan» y «Corregida» van en `tenue`, en
 *   una línea. La fila se toca entera y abre la sesión: sin botón propio;
 * - los planes, con el mismo trato.
 * Es un módulo puro: la prueba lo usa sin React. Los textos nuevos viven en la APK, no en el dominio (AV2-T13).
 */
import {
  COPY_ENTRENAMIENTO,
  etiquetaDeCondicionRegistrada,
  nivelDeDetalle,
  registroVigente,
  textoDelNivelDeDetalle,
  type HistorialDeEntrenamientoResponse,
  type ResumenDeVersionDePlanDeEntrenamiento,
} from '@be/domain';
import { dia, diaYMes, fechaCivil } from './formato';

type Ejecucion = HistorialDeEntrenamientoResponse['data']['executions'][number];

/** La ventana de la lista: los últimos 90 días, dentro del tope del contrato (hasta un año). */
export const DIAS_DEL_HISTORIAL = 90;

export const TEXTOS_DEL_HISTORIAL = {
  periodo: `Últimos ${DIAS_DEL_HISTORIAL} días`,
} as const;

export interface FilaDelHistorial {
  readonly titulo: string;
  /** «9 nov», con el año solo si no es el del día de la API. */
  readonly fecha: string;
  /** La etiqueta neutra del estado; `null` si no hay nada que decir (un plan que no es el vigente). */
  readonly estado: string | null;
  /** Si lleva la tilde en `exito`: lo hecho se celebra, lo demás queda neutro (ubicar, nunca calificar). */
  readonly hecha: boolean;
  /** «Cargada como el plan · Corregida», en `tenue` y en una línea; `null` si no hay nada. */
  readonly detalle: string | null;
  /** Lo que dice TalkBack: «Piernas A, 9 de noviembre, realizada. Ver la sesión». */
  readonly paraLeer: string;
}

const enMinuscula = (texto: string): string => texto.charAt(0).toLocaleLowerCase('es-AR') + texto.slice(1);

/** Una sesión registrada, como fila. Rige lo vigente: una sesión corregida dice la condición corregida (REG-06-16). */
export function filaDeSesion(e: Ejecucion): FilaDelHistorial {
  const estado = etiquetaDeCondicionRegistrada(registroVigente(e));
  const { sessionCondition } = registroVigente(e);
  const hecha = sessionCondition === 'COMPLETED' || sessionCondition === 'COMPLETED_WITH_DEVIATION';
  // El nivel de detalle de lo que rige (DL-161); nada para una no realizada, que ya lo dice su condición.
  const nivel = nivelDeDetalle(e);
  const comoSeCargo = nivel === null || nivel === 'NO_REALIZADA' ? null : textoDelNivelDeDetalle(nivel);
  const detalle = [comoSeCargo, e.effectiveView.kind === 'CORRECTED' ? COPY_ENTRENAMIENTO.corregida : null].filter((t): t is string => t !== null).join(' · ') || null;
  const titulo = e.plannedSession.label;
  return {
    titulo,
    fecha: fechaCivil(e.date),
    estado,
    hecha,
    detalle,
    paraLeer: `${titulo}, ${diaYMes(e.date)}, ${enMinuscula(estado)}.${detalle ? ` ${detalle}.` : ''} ${COPY_ENTRENAMIENTO.verLaSesion}`,
  };
}

/** Un plan del historial, con el mismo trato: quién lo armó, desde cuándo y si es el vigente. */
export function filaDePlan(v: Pick<ResumenDeVersionDePlanDeEntrenamiento, 'professional' | 'activatedAt' | 'isEffective'>): FilaDelHistorial {
  const titulo = v.professional.displayName;
  const fecha = v.activatedAt ? dia(v.activatedAt) : '';
  const estado = v.isEffective ? COPY_ENTRENAMIENTO.vigente : null;
  const partes = [titulo, fecha || null, estado ? enMinuscula(estado) : null].filter((t): t is string => t !== null);
  return { titulo, fecha, estado, hecha: false, detalle: null, paraLeer: `${partes.join(', ')}. ${COPY_ENTRENAMIENTO.verElPlan}` };
}
