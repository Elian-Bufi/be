/**
 * ED-01 · Descartar la versión en preparación (WP-EDITORES-PROFESIONAL; la API es TB-47, DL-163 D-21: API-PLE-05 y
 * API-PLN-07, integradas el 2026-11-07).
 *
 * Sin React ni red: qué se ofrece, qué dice el cuadro y qué hace la pantalla con cada respuesta. La clave de idempotencia
 * es la del intento (`useClaveDeIntento`, en `lib/intento.ts`): el reintento de un resultado incierto reusa la misma, así
 * el servidor devuelve el resultado original en vez de descartar dos veces.
 *
 * - Solo se ofrece en una versión en preparación que nunca se activó: la vigente no se descarta nunca.
 * - El cuadro dice de qué versión salió, que lo armado se borra, que la vigente no cambia y que no se deshace; con cambios
 *   sin guardar, que también se pierden. «Cancelar» tiene el foco y no llama a la API.
 * - Descartada, o si ya no estaba (se descartó o se activó en otra pestaña: el mismo 404 que lo inexistente), la pantalla
 *   vuelve a leer el plan: vuelven «Crear una nueva versión» y «Empezar desde una plantilla».
 */
import { COPY, COPY_DESCARTAR_LA_VERSION as D, type Resultado } from '@be/domain';

export type ResultadoDelDescarte = 'DESCARTADA' | 'YA_NO_ESTA' | 'CAMBIO_EN_OTRA_PESTANA' | 'YA_ACTIVADA' | 'INCIERTO' | 'OTRO';

export function resultadoDelDescarte(r: Resultado<unknown>): ResultadoDelDescarte {
  if (r.ok) return 'DESCARTADA';
  if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return 'INCIERTO';
  if (r.codigo === 'RESOURCE_NOT_FOUND') return 'YA_NO_ESTA';
  if (r.codigo === 'VERSION_CONFLICT') return 'CAMBIO_EN_OTRA_PESTANA';
  if (r.codigo === 'PLAN_NOT_EDITABLE') return 'YA_ACTIVADA';
  return 'OTRO';
}

/** Lo que se dice cuando el descarte no se hizo; `null` si la pantalla sigue sola (descartada, o ya no estaba). */
export function textoDelDescarteQueNoSeHizo(que: ResultadoDelDescarte): string | null {
  switch (que) {
    case 'DESCARTADA':
    case 'YA_NO_ESTA':
      return null;
    case 'CAMBIO_EN_OTRA_PESTANA':
      return D.cambioEnOtraPestana;
    case 'YA_ACTIVADA':
      return D.yaActivada;
    case 'INCIERTO':
      return COPY.resultadoIncierto;
    default:
      return COPY.noDisponible;
  }
}

/** La versión vigente, con la fecha ya formateada («martes 10 de noviembre»), o `null` si es la primera. */
export interface VigenteParaElCuadro {
  readonly numero: number;
  readonly desde: string;
}

/**
 * Lo que dice el cuadro, en orden: el título, los párrafos y el botón que descarta. `persona` es el nombre o la referencia
 * neutral (DL-169), como en la maqueta 11 («Diego no ve nada distinto»); sin ninguno, «la persona».
 */
export function cuadroDelDescarte({
  numero,
  vigente,
  sinGuardar,
  persona = null,
}: {
  readonly numero: number;
  readonly vigente: VigenteParaElCuadro | null;
  readonly sinGuardar: boolean;
  readonly persona?: string | null;
}) {
  return {
    titulo: D.titulo(numero),
    parrafos: [vigente ? D.saleDe(vigente.numero, vigente.desde) : D.primera, vigente ? D.vigenteNoCambia(vigente.numero, persona) : D.noLaVio(persona), ...(sinGuardar ? [D.sinGuardar] : [])],
    confirmar: D.confirmar(numero),
  } as const;
}

/** Solo una versión en preparación que nunca se activó ofrece descartarse: la vigente, nunca (DL-163 D-21). */
export function ofreceDescartar(v: { readonly state: string; readonly activatedAt: string | null }): boolean {
  return v.state === 'DRAFT' && v.activatedAt === null;
}

/** El número de la versión en preparación: el de las activadas más uno (DJ-6). */
export function numeroDelBorrador(historial: readonly { readonly numero: number }[]): number {
  return historial.reduce((mayor, v) => Math.max(mayor, v.numero), 0) + 1;
}
