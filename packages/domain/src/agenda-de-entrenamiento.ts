/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DEUDA_LEGAJO DL-137): el calendario de una versión del plan de entrenamiento, qué registro
 * resolvió cada fecha prevista y qué quedó pendiente. Lógica pura, compartida por la API («Hoy» y los recordatorios), el
 * website (la vista previa del calendario) y la APK.
 *
 * - **La fecha prevista se deriva** (D-3): de la fecha de inicio, los días de la semana de cada sesión y los movimientos
 *   que hizo el profesional. No se guarda.
 * - **La ejecución no cambia** (DL-077, opción A): sigue siendo una por sesión y por fecha de ejecución. La agenda agrega
 *   arriba la ocurrencia prevista, sin reemplazar esa clave.
 * - **Hacerla otro día la resuelve** (D-4): la resuelve la primera ejecución de esa sesión desde su fecha y antes de la
 *   próxima fecha prevista de la misma sesión. Si no hay, una hecha antes, después de la prevista anterior: la adelantó.
 * - **Saltearla es un acto explícito** (D-5): una ejecución «no realizada» también la resuelve. La ausencia de registro,
 *   nunca (REG-06-131; WP-06 §9.2): una fecha sin registro queda pendiente, no «no realizada».
 */
import { DIAS_DE_LA_SEMANA, type AgendaDeEntrenamiento, type DiaDeLaSemana } from './contratos-entrenamiento';
import { diaSiguiente, diasEntreFechas } from './fechas-civiles';

export interface FechaPrevista {
  readonly sessionId: string;
  readonly date: string;
}

export type CondicionParaLaAgenda = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';

/** Una ejecución registrada, con lo único que la agenda necesita saber de ella. */
export interface EjecucionParaLaAgenda {
  readonly sessionId: string;
  readonly date: string;
  readonly condition: CondicionParaLaAgenda;
}

export interface FechaPrevistaResuelta extends FechaPrevista {
  /** La ejecución que la resolvió, o `null` si sigue sin registro. */
  readonly resolvedBy: EjecucionParaLaAgenda | null;
}

const DIA = 86_400_000;

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1) + dias * DIA).toISOString().slice(0, 10);
}

/** El día de la semana de una fecha civil. Es aritmética de calendario: no depende de la zona horaria. */
export function diaDeLaSemana(fecha: string): DiaDeLaSemana {
  const domingoEsCero = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return DIAS_DE_LA_SEMANA[(domingoEsCero + 6) % 7] as DiaDeLaSemana;
}

/** Si la sesión va esa fecha por sus días de la semana, antes de aplicar los movimientos. */
function porSusDias(agenda: AgendaDeEntrenamiento, sessionId: string, fecha: string): boolean {
  if (fecha < agenda.startDate) return false;
  const sesion = agenda.sessions.find((s) => s.sessionId === sessionId);
  return sesion !== undefined && sesion.weekdays.includes(diaDeLaSemana(fecha));
}

/**
 * Las fechas previstas entre `desde` y `hasta`, inclusive, con los movimientos aplicados. Van en orden de fecha y, el
 * mismo día, en el orden de las sesiones de la agenda. Un movimiento que no parte de una fecha prevista no cuenta (la
 * validación lo rechaza antes de guardar).
 */
export function fechasPrevistas(agenda: AgendaDeEntrenamiento, desde: string, hasta: string): FechaPrevista[] {
  const inicio = desde < agenda.startDate ? agenda.startDate : desde;
  const previstas = new Map<string, FechaPrevista>();
  for (let fecha = inicio; fecha <= hasta; fecha = diaSiguiente(fecha)) {
    const dia = diaDeLaSemana(fecha);
    for (const s of agenda.sessions) if (s.weekdays.includes(dia)) previstas.set(`${fecha}|${s.sessionId}`, { sessionId: s.sessionId, date: fecha });
  }
  for (const m of agenda.moves) {
    if (!porSusDias(agenda, m.sessionId, m.from)) continue;
    previstas.delete(`${m.from}|${m.sessionId}`);
    if (m.to >= inicio && m.to <= hasta) previstas.set(`${m.to}|${m.sessionId}`, { sessionId: m.sessionId, date: m.to });
  }
  const orden = new Map(agenda.sessions.map((s, i) => [s.sessionId, i]));
  return [...previstas.values()].sort((a, b) => a.date.localeCompare(b.date) || (orden.get(a.sessionId) ?? 0) - (orden.get(b.sessionId) ?? 0));
}

export interface ProblemaDeAgenda {
  readonly code:
    | 'AGENDA_SESSION_UNKNOWN'
    | 'AGENDA_SESSION_DUPLICATED'
    | 'AGENDA_WEEKDAY_DUPLICATED'
    | 'AGENDA_MOVE_NOT_PLANNED'
    | 'AGENDA_MOVE_DUPLICATED'
    | 'AGENDA_MOVE_BEFORE_START'
    | 'AGENDA_MOVE_COLLISION';
  readonly path: string;
}

/**
 * Lo que impide guardar una agenda: una sesión que no está en el plan o que aparece dos veces, un día repetido, y un
 * movimiento que no parte de una fecha prevista, se repite, cae antes del inicio o cae sobre otra fecha prevista de la
 * misma sesión. Vacío si se puede guardar.
 */
export function problemasDeAgenda(agenda: AgendaDeEntrenamiento, sesionesDelPlan: ReadonlySet<string>): ProblemaDeAgenda[] {
  const problemas: ProblemaDeAgenda[] = [];
  const vistas = new Set<string>();
  agenda.sessions.forEach((s, i) => {
    if (!sesionesDelPlan.has(s.sessionId)) problemas.push({ code: 'AGENDA_SESSION_UNKNOWN', path: `agenda.sessions[${i}].sessionId` });
    if (vistas.has(s.sessionId)) problemas.push({ code: 'AGENDA_SESSION_DUPLICATED', path: `agenda.sessions[${i}].sessionId` });
    vistas.add(s.sessionId);
    if (new Set(s.weekdays).size !== s.weekdays.length) problemas.push({ code: 'AGENDA_WEEKDAY_DUPLICATED', path: `agenda.sessions[${i}].weekdays` });
  });
  const origenes = new Set<string>();
  const destinos = new Set<string>();
  agenda.moves.forEach((m, i) => {
    const ruta = `agenda.moves[${i}]`;
    if (!porSusDias(agenda, m.sessionId, m.from)) problemas.push({ code: 'AGENDA_MOVE_NOT_PLANNED', path: `${ruta}.from` });
    if (origenes.has(`${m.sessionId}|${m.from}`)) problemas.push({ code: 'AGENDA_MOVE_DUPLICATED', path: `${ruta}.from` });
    origenes.add(`${m.sessionId}|${m.from}`);
    if (m.to < agenda.startDate) problemas.push({ code: 'AGENDA_MOVE_BEFORE_START', path: `${ruta}.to` });
    // El destino no puede ser una fecha en la que esa sesión ya está, ni el destino de otro movimiento.
    const yaEsta = porSusDias(agenda, m.sessionId, m.to) && !agenda.moves.some((o) => o.sessionId === m.sessionId && o.from === m.to);
    if (m.to !== m.from && (yaEsta || destinos.has(`${m.sessionId}|${m.to}`))) problemas.push({ code: 'AGENDA_MOVE_COLLISION', path: `${ruta}.to` });
    destinos.add(`${m.sessionId}|${m.to}`);
  });
  return problemas;
}

/**
 * Qué ejecución resuelve cada fecha prevista (D-4 y D-5). Por sesión, en orden: primero la primera ejecución desde su
 * fecha y antes de la próxima prevista de la misma sesión; si no hay, la última hecha antes, después de la prevista
 * anterior (la adelantó). Cada ejecución resuelve una sola fecha. Devuelve las previstas en el orden en que llegaron.
 */
export function resolverFechasPrevistas(previstas: readonly FechaPrevista[], ejecuciones: readonly EjecucionParaLaAgenda[]): FechaPrevistaResuelta[] {
  const resueltas = new Map<FechaPrevista, EjecucionParaLaAgenda | null>();
  const porSesion = new Map<string, FechaPrevista[]>();
  for (const p of previstas) porSesion.set(p.sessionId, [...(porSesion.get(p.sessionId) ?? []), p]);
  for (const [sesion, fechas] of porSesion) {
    const ordenadas = [...fechas].sort((a, b) => a.date.localeCompare(b.date));
    const suyas = ejecuciones.filter((e) => e.sessionId === sesion).sort((a, b) => a.date.localeCompare(b.date));
    const usadas = new Set<EjecucionParaLaAgenda>();
    ordenadas.forEach((p, i) => {
      const proxima = ordenadas[i + 1]?.date ?? null;
      const anterior = ordenadas[i - 1]?.date ?? null;
      const aTiempoOTarde = suyas.find((e) => !usadas.has(e) && e.date >= p.date && (proxima === null || e.date < proxima));
      const adelantada = aTiempoOTarde ? undefined : [...suyas].reverse().find((e) => !usadas.has(e) && e.date < p.date && (anterior === null || e.date > anterior));
      const elegida = aTiempoOTarde ?? adelantada ?? null;
      if (elegida) usadas.add(elegida);
      resueltas.set(p, elegida);
    });
  }
  return previstas.map((p) => ({ ...p, resolvedBy: resueltas.get(p) ?? null }));
}

/** Cuántos días antes y después de hoy hay que mirar para resolver bien las fechas del día: más que una semana. */
const MARGEN_DE_DIAS = 21;

/** Lo que una pendiente se queda a la vista en «Hoy»: una semana, como mucho hasta la próxima de la misma sesión. */
export const DIAS_QUE_SE_MUESTRA_UNA_PENDIENTE = 7;

/** Cuántos días se recuerda una misma pendiente (Dirección, 2026-10-16: «el aviso insiste dos días como mucho»). */
export const DIAS_QUE_SE_RECUERDA_UNA_PENDIENTE = 2;

export interface AgendaDelDia {
  /** Las fechas previstas para hoy, resueltas o no. */
  readonly hoy: readonly FechaPrevistaResuelta[];
  /** Las previstas de días anteriores que siguen sin registro, de la más vieja a la más nueva. */
  readonly pendientes: readonly FechaPrevistaResuelta[];
}

/**
 * La agenda de un día: lo previsto para hoy y lo que quedó pendiente. `vigenteDesde` es la fecha local en que la versión
 * empezó a regir: antes, nada estaba previsto todavía. Una pendiente deja de mostrarse a la semana o cuando llega la
 * próxima fecha de la misma sesión.
 */
export function agendaDelDia(agenda: AgendaDeEntrenamiento, ejecuciones: readonly EjecucionParaLaAgenda[], hoy: string, vigenteDesde: string): AgendaDelDia {
  const desde = sumarDias(hoy, -MARGEN_DE_DIAS) < vigenteDesde ? vigenteDesde : sumarDias(hoy, -MARGEN_DE_DIAS);
  const resueltas = resolverFechasPrevistas(fechasPrevistas(agenda, desde, sumarDias(hoy, MARGEN_DE_DIAS)), ejecuciones);
  const proximaDeLaSesion = (p: FechaPrevista): string | null => resueltas.find((o) => o.sessionId === p.sessionId && o.date > p.date)?.date ?? null;
  return {
    hoy: resueltas.filter((p) => p.date === hoy),
    pendientes: resueltas.filter((p) => {
      if (p.date >= hoy || p.resolvedBy !== null) return false;
      if (diasEntreFechas(p.date, hoy) > DIAS_QUE_SE_MUESTRA_UNA_PENDIENTE) return false;
      const proxima = proximaDeLaSesion(p);
      return proxima === null || proxima > hoy;
    }),
  };
}

/** Las pendientes que todavía se recuerdan hoy: las de los últimos dos días. */
export const pendientesParaRecordar = (agenda: AgendaDelDia, hoy: string): FechaPrevistaResuelta[] =>
  agenda.pendientes.filter((p) => diasEntreFechas(p.date, hoy) <= DIAS_QUE_SE_RECUERDA_UNA_PENDIENTE);
