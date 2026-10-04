/**
 * Las lecturas de Inicio que combinan dos pedidos o resumen una respuesta (DL-117; matriz en
 * docs/ux/INICIO-Y-NAVEGACION.md §2). Como `lecturas-de-las-zonas.ts`, son funciones puras que reciben el cliente de la
 * API, y `scripts/inicio.test.mjs` las ejercita con respuestas controladas.
 *
 * Cada una usa una operación que ya existe y con el mismo permiso que en su módulo. Ninguna escribe.
 * Regla común (G5 de `ciclo-de-lectura.ts`): una falla no se disfraza de dato. Una falla de sesión o de acceso en un
 * pedido secundario se devuelve tal cual. Una falla pasajera en un pedido secundario deja ese detalle «sin leer», y la
 * tarjeta no afirma nada sobre él.
 */
import {
  clasificarFalla,
  COPY_NUTRICION,
  registroVigente,
  numero,
  type HistorialDeEntrenamientoResponse,
  type Ingesta,
  type ListaDeSolicitudesPropiasResponse,
  type MedidaDeLaToma,
  type RequisitoDeConsentimientoDeSaludResponse,
  type Resultado,
  type SolicitudPropia,
  type UltimaToma,
} from '@be/domain';

export interface ApiDeInicio {
  listarMisIngestas(token: string, filtro?: { cursor?: string; limit?: string }): Promise<Resultado<{ readonly data: readonly Ingesta[]; readonly page: { readonly hasMore: boolean } }>>;
  misEjecucionesDeEntrenamiento(token: string, periodo: { periodStart: string; periodEnd: string }): Promise<Resultado<HistorialDeEntrenamientoResponse>>;
  misSolicitudesDeFormulario(token: string, filtro?: { status?: string; cursor?: string; limit?: string }): Promise<Resultado<ListaDeSolicitudesPropiasResponse>>;
  consultarRequisitoA3(token: string): Promise<Resultado<RequisitoDeConsentimientoDeSaludResponse>>;
}

// ─── Nutrición: el último registro, si hoy no hay ninguno ───────────────────────────────────────

/** Lo que Inicio dice del último registro: solo lo necesario para nombrarlo y abrirlo. */
export interface UltimoRegistro {
  readonly executionId: string;
  readonly localDate: string;
  readonly origin: Ingesta['origin'];
}

/**
 * La primera página de API-NUT-16-LISTA con `limit` 1: el registro más reciente por momento de registro, o `null` si
 * nunca hubo uno. No recorre el historial. «Días con registros en un período» no se puede saber con una página (D-1).
 *
 * Es una lectura aparte de «Hoy» (API-NUT-14), con su propio ciclo: la tarjeta de Nutrición se puede usar en cuanto llega
 * «Hoy», y este renglón se completa después, sin demorarla (cierre del 2026-10-04: antes la tarjeta lo esperaba).
 */
export async function leerUltimoRegistro(api: Pick<ApiDeInicio, 'listarMisIngestas'>, token: string): Promise<Resultado<UltimoRegistro | null>> {
  const lista = await api.listarMisIngestas(token, { limit: '1' });
  if (!lista.ok) return lista;
  const i = lista.datos.data[0];
  return { ok: true, datos: i ? { executionId: i.executionId, localDate: i.localDate, origin: i.origin } : null };
}

/** Si la tarjeta pide el último registro: solo si hoy no hay ninguno. Es la regla que usan la tarjeta y la prueba. */
export function pideElUltimoRegistro(hoy: { readonly registeredIntake: readonly unknown[] }): boolean {
  return hoy.registeredIntake.length === 0;
}

/** Lo que dice la tarjeta si hoy no hay registros: la frase, la fecha del último y el registro que se puede abrir. */
export interface SinRegistrosDeHoy {
  readonly texto: string;
  readonly ultimo: { readonly texto: string; readonly executionId: string } | null;
}

/**
 * Sin registros hoy, la tarjeta lo dice enseguida y completa el renglón cuando llega el último registro (`ultimo`, o
 * `null` mientras se lee). Si nunca hubo uno, lo dice una sola vez. Una falla de esa lectura no se disfraza de dato: no
 * dice «nunca» ni inventa una fecha, y queda solo lo que se sabe, que hoy no hay registros.
 */
export function sinRegistrosDeHoy(ultimo: Resultado<UltimoRegistro | null> | null, fecha: (fechaLocal: string) => string): SinRegistrosDeHoy {
  if (ultimo?.ok && ultimo.datos === null) return { texto: 'Todavía no registraste ninguna comida.', ultimo: null };
  const registro = ultimo?.ok ? ultimo.datos : null;
  return {
    texto: COPY_NUTRICION.sinRegistrosHoy,
    ultimo: registro ? { texto: `Tu último registro es del ${fecha(registro.localDate)}.`, executionId: registro.executionId } : null,
  };
}

// ─── Entrenamiento: actividad de un período ─────────────────────────────────────────────────────

/** Cuántas sesiones se registraron en el período, por su condición vigente: con las correcciones aplicadas. */
export interface ActividadDeEntrenamiento {
  readonly periodo: { readonly desde: string; readonly hasta: string };
  readonly registradas: number;
  readonly realizadas: number;
  readonly conDesvio: number;
  readonly noRealizadas: number;
  /** Cuántas de las registradas rigen por una corrección: su condición ya es la corregida. */
  readonly corregidas: number;
  /** Cuántas tienen correcciones que no se pueden ordenar (`NOT_RESOLVABLE`): cuentan como se registraron. */
  readonly sinOrdenar: number;
}

/**
 * El encabezado de la tarjeta de actividad. Las fechas son las del período que la API respondió, no las del pedido: si
 * la API rechazó el último día como futuro y se pidió un día antes, se dicen esas. Mientras no hay respuesta, sin fechas.
 */
export function detalleDeActividad(periodo: ActividadDeEntrenamiento['periodo'] | null, fecha: (fechaLocal: string) => string): string {
  const base = `Entrenamiento · últimos ${numero(DIAS_DE_ACTIVIDAD)} días`;
  return periodo ? `${base}, del ${fecha(periodo.desde)} al ${fecha(periodo.hasta)}` : base;
}

/** Los días del resumen de actividad: un mes, dentro del tope de la lista (hasta un año). */
export const DIAS_DE_ACTIVIDAD = 30;

/** El período corrido un día atrás: lo que se pide si para la API el último día todavía es mañana. */
function unDiaAntes(periodo: { periodStart: string; periodEnd: string }): { periodStart: string; periodEnd: string } {
  const correr = (fecha: string) => {
    const d = new Date(`${fecha}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  return { periodStart: correr(periodo.periodStart), periodEnd: correr(periodo.periodEnd) };
}

/** La API rechazó el período porque su último día todavía no llegó (400 con `PERIOD_IN_FUTURE`). */
const esPeriodoFuturo = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.issues.some((i) => i.code === 'PERIOD_IN_FUTURE');

/**
 * API-TRN-19-LISTA, la lista de «Tu historial», para un período. Se guarda solo el resumen, no las sesiones: Inicio
 * cuenta, y el detalle está en «Tu historial». La condición de cada sesión es la vigente (`registroVigente`): una sesión
 * corregida cuenta como quedó después de la corrección. Una con correcciones que no se pueden ordenar
 * (`NOT_RESOLVABLE`) cuenta como se registró, y se cuenta aparte.
 *
 * El período que se guarda es el que la API respondió (`data.period`), no el pedido. Si el período termina en un día que
 * para la API todavía es mañana, la API responde `PERIOD_IN_FUTURE` y se pide una vez más, un día antes. Con la hora del
 * servidor (`reloj-del-servidor.ts`) no debería pasar, salvo en la primera lectura antes de conocerla o si el reloj del
 * teléfono se movió desde la última respuesta. Esa respuesta corrige la hora, el día cambia y la tarjeta vuelve a leer.
 */
export async function leerActividadDeEntrenamiento(api: ApiDeInicio, token: string, periodo: { periodStart: string; periodEnd: string }): Promise<Resultado<ActividadDeEntrenamiento>> {
  let r = await api.misEjecucionesDeEntrenamiento(token, periodo);
  if (esPeriodoFuturo(r)) r = await api.misEjecucionesDeEntrenamiento(token, unDiaAntes(periodo));
  if (!r.ok) return r;
  const cuenta = { registradas: 0, realizadas: 0, conDesvio: 0, noRealizadas: 0, corregidas: 0, sinOrdenar: 0 };
  for (const x of r.datos.data.executions) {
    cuenta.registradas++;
    const condicion = registroVigente(x).sessionCondition;
    if (condicion === 'COMPLETED') cuenta.realizadas++;
    else if (condicion === 'COMPLETED_WITH_DEVIATION') cuenta.conDesvio++;
    else cuenta.noRealizadas++;
    if (x.effectiveView.kind === 'CORRECTED') cuenta.corregidas++;
    else if (x.effectiveView.kind === 'NOT_RESOLVABLE') cuenta.sinOrdenar++;
  }
  const { start, end } = r.datos.data.period;
  return { ok: true, datos: { periodo: { desde: start, hasta: end }, ...cuenta } };
}

// ─── Información: lo pendiente de responder ─────────────────────────────────────────────────────

/** Cuántas solicitudes pendientes se piden para Inicio: las más recientes. El resto está en Información. */
export const PENDIENTES_EN_INICIO = 3;

export interface PendientesDeInicio {
  readonly pendientes: readonly SolicitudPropia[];
  /** Hay más pendientes que las que se pidieron: la cuenta de la lista no es el total. */
  readonly hayMas: boolean;
  readonly sinA3: boolean;
}

/**
 * API-FRM-06 filtrada a las pendientes, con `limit` y `page.hasMore`, junto con API-CON-05: responder exige el A3
 * (DL-115). Las mismas reglas que `leerLista`: solo un A3 leído y no vigente muestra el aviso, y una falla pasajera o de
 * sesión al leer el A3 se devuelve, porque la lista sin el aviso diría que el A3 está bien sin saberlo.
 */
export async function leerPendientes(api: ApiDeInicio, token: string): Promise<Resultado<PendientesDeInicio>> {
  const [r, requisito] = await Promise.all([api.misSolicitudesDeFormulario(token, { status: 'PENDING', limit: String(PENDIENTES_EN_INICIO) }), api.consultarRequisitoA3(token)]);
  if (!requisito.ok) {
    const falla = clasificarFalla(requisito);
    if (falla === 'sesion' || falla === 'pasajera') return requisito;
  }
  if (!r.ok) return r;
  return {
    ok: true,
    datos: {
      pendientes: r.datos.data.filter((s) => s.status === 'PENDING'),
      hayMas: r.datos.page.hasMore,
      sinA3: requisito.ok && requisito.datos.data.currentConsent?.state !== 'ACTIVE',
    },
  };
}

// ─── Textos y criterios de las tarjetas ─────────────────────────────────────────────────────────

/** «Hoy hiciste 3 registros: 2 del plan y 1 fuera del plan.» Registros, no comidas: uno puede ser de fuera del plan. */
export function textoDeRegistrosDeHoy(registros: readonly Pick<Ingesta, 'origin'>[]): string {
  const total = registros.length;
  const delPlan = registros.filter((i) => i.origin === 'PRESCRIBED').length;
  const fuera = total - delPlan;
  const base = `Hoy hiciste ${numero(total)} ${total === 1 ? 'registro' : 'registros'}`;
  if (fuera === 0) return `${base} del plan.`;
  if (delPlan === 0) return `${base} fuera del plan.`;
  return `${base}: ${numero(delPlan)} del plan y ${numero(fuera)} fuera del plan.`;
}

/**
 * La medida que Inicio destaca, con un criterio fijo y dicho en la tarjeta: la primera de la última toma en el orden del
 * catálogo de BE, que empieza por el peso. Si la toma solo tiene resultados de fórmulas, el primero de ellos.
 */
export function medidaDestacada(toma: Pick<UltimaToma, 'medidas' | 'derivadas'>): MedidaDeLaToma | null {
  return toma.medidas[0] ?? toma.derivadas[0] ?? null;
}
