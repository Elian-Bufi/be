/**
 * ED-07 · «Antes de activar»: una sola entrada fija (WP-EDITORES-PROFESIONAL; DJ-6).
 *
 * «Revisar y activar…» está siempre en el mismo lugar de la barra y abre el cuadro siempre, también con algo por
 * corregir: el cuadro revisa al abrirse (lo local al instante y después la validación de la API) y dice, en este orden,
 * lo que impide activar (cada cosa con «Ir a corregir»), lo que queda sin completar (sin bloquear), lo que cambia frente
 * a la vigente, lo que va a ver la persona y «¿Cuándo la revisás?». Un solo botón principal, «Activar la versión 9 de
 * Entrenamiento», apagado con su motivo mientras falte algo.
 *
 * Sin React ni red: los textos y la regla del principal. La validación final sigue siendo de la API (API-TRN-11 y
 * API-NUT-11), y la activación la decide la API (API-TRN-12 y API-NUT-12).
 */

export type AreaQueSeActiva = 'Entrenamiento' | 'Nutrición';

const cosas = (n: number): string => (n === 1 ? '1 cosa' : `${n} cosas`);

export const COPY_ANTES_DE_ACTIVAR = {
  revisarYActivar: 'Revisar y activar…',
  titulo: (numero: number, area: AreaQueSeActiva): string => `Antes de activar la versión ${numero} de ${area}`,
  bajada: (vigente: number | null, primera: boolean): string =>
    primera ? 'Es la primera versión del plan.' : vigente === null ? 'Al activarla, la versión vigente queda en el historial.' : `Al activarla, la versión ${vigente} queda en el historial.`,
  // 1. Lo que impide activar, y lo que queda sin completar.
  loQueImpide: 'Lo que impide activar',
  nadaImpide: 'Nada impide activar.',
  revisando: 'Revisando el plan…',
  noSePudoRevisar: 'No pudimos revisar el plan.',
  volverARevisar: 'Volver a revisar',
  irACorregir: 'Ir a corregir',
  sinCompletar: 'Queda sin completar, y no impide:',
  ir: 'Ir',
  noJuzga: 'Revisar mira la forma del plan, no su calidad.',
  // Con cambios sin guardar, primero se guarda: lo que se activa es lo que guardó el servidor.
  cambiosSinGuardar: 'Tenés cambios sin guardar. Lo que se activa es lo guardado: guardalos primero.',
  // 2. Lo que cambia frente a la vigente.
  loQueCambia: (vigente: number): string => `Lo que cambia frente a la versión ${vigente}`,
  loQueTiene: 'Lo que tiene esta versión',
  primeraVersion: 'Es la primera versión: todo lo que tiene es nuevo.',
  sinCambios: 'No cambia nada frente a la vigente.',
  sinLaVigente: 'No pudimos leer la versión vigente para compararla.',
  yMas: (n: number): string => (n === 1 ? 'y 1 cambio más' : `y ${n} cambios más`),
  // 3. Lo que va a ver la persona, con su nombre o su referencia neutral (DL-169), como en la maqueta 10.
  loQueVe: (persona: string | null): string => `Lo que va a ver ${(typeof persona === 'string' && persona.trim()) || 'la persona'}`,
  // 4. Su app (hasta ED-08, la API todavía la espera: va con lo que impide).
  suApp: 'Su app',
  // El principal y su motivo.
  activar: (numero: number, area: AreaQueSeActiva): string => `Activar la versión ${numero} de ${area}`,
  activando: 'Activando…',
  volverAlPlan: 'Volver al plan',
  falta: (partes: readonly string[]): string => `Falta ${partes.length <= 1 ? (partes[0] ?? '') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`}`,
  guardarLosCambios: 'guardar los cambios',
  // Con el borrador cambiado en otra pestaña (409), no se puede guardar ni activar: primero se carga lo guardado.
  cargarLaGuardada: 'cargar la versión guardada',
  corregir: (n: number): string => `corregir ${cosas(n)}`,
  elegirCuando: 'elegir cuándo la revisás',
  revisarDeNuevo: 'volver a revisar el plan',
} as const;

const A = COPY_ANTES_DE_ACTIVAR;

/** Lo que decide si el principal se puede tocar. */
export interface EstadoDelCuadro {
  /** Cuántas cosas impiden activar: lo que el editor ve solo, lo que dijo la API y, hasta ED-08, la app de la persona. */
  readonly impiden: number;
  /** La API todavía no respondió la validación. */
  readonly revisando: boolean;
  /** La validación de la API no se pudo hacer (sin respuesta u otro rechazo). */
  readonly sinRevisar: boolean;
  /** Hay cambios en pantalla que el servidor todavía no guardó. */
  readonly sinGuardar: boolean;
  /** «¿Cuándo la revisás?» tiene una elección (una fecha o «Sin fecha por ahora»). */
  readonly eligioCuando: boolean;
  /**
   * El borrador cambió en otra pestaña o en otro equipo (un 409, DL-148): activar repetiría el mismo 409. Gana a todo lo
   * demás, porque guardar tampoco se puede.
   */
  readonly conflicto?: boolean;
}

/**
 * Por qué «Activar la versión N de …» está apagado, o `null` si se puede tocar. Nunca se enciende con algo por corregir,
 * con cambios sin guardar, sin la revisión de la API ni sin una elección de fecha.
 */
export function motivoDelPrincipal(e: EstadoDelCuadro): string | null {
  if (e.conflicto) return A.falta([A.cargarLaGuardada]);
  if (e.revisando) return A.revisando;
  const partes = [
    ...(e.sinGuardar ? [A.guardarLosCambios] : []),
    ...(e.impiden > 0 ? [A.corregir(e.impiden)] : []),
    ...(!e.sinGuardar && e.sinRevisar ? [A.revisarDeNuevo] : []),
    ...(!e.eligioCuando ? [A.elegirCuando] : []),
  ];
  return partes.length > 0 ? A.falta(partes) : null;
}

/** Hasta cuántos cambios se listan; el resto se cuenta («y 6 cambios más»). */
export const CAMBIOS_A_LA_VISTA = 5;
