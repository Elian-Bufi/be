/**
 * Las lecturas de Inicio que combinan dos pedidos o resumen una lista (DL-117; matriz en
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
  registroVigente,
  numero,
  type HistorialDeEntrenamientoResponse,
  type HoyResponse,
  type Ingesta,
  type ListaDeSolicitudesPropiasResponse,
  type MedidaDeLaToma,
  type RequisitoDeConsentimientoDeSaludResponse,
  type Resultado,
  type SolicitudPropia,
  type UltimaToma,
} from '@be/domain';

export interface ApiDeInicio {
  hoyNutricional(token: string, diaTipoId?: string): Promise<Resultado<HoyResponse>>;
  listarMisIngestas(token: string, filtro?: { cursor?: string; limit?: string }): Promise<Resultado<{ readonly data: readonly Ingesta[]; readonly page: { readonly hasMore: boolean } }>>;
  misEjecucionesDeEntrenamiento(token: string, periodo: { periodStart: string; periodEnd: string }): Promise<Resultado<HistorialDeEntrenamientoResponse>>;
  misSolicitudesDeFormulario(token: string, filtro?: { status?: string; cursor?: string; limit?: string }): Promise<Resultado<ListaDeSolicitudesPropiasResponse>>;
  consultarRequisitoA3(token: string): Promise<Resultado<RequisitoDeConsentimientoDeSaludResponse>>;
}

// ─── Nutrición de hoy, con el último registro si hoy no hay ninguno ─────────────────────────────

/** Lo que Inicio dice del último registro: solo lo necesario para nombrarlo y abrirlo. */
export interface UltimoRegistro {
  readonly executionId: string;
  readonly localDate: string;
  readonly origin: Ingesta['origin'];
}

export type DetalleDelUltimo =
  /** Hoy hay registros: el último está en la lista de hoy, y no se pidió nada más. */
  | { readonly tipo: 'hoy' }
  | { readonly tipo: 'anterior'; readonly registro: UltimoRegistro }
  | { readonly tipo: 'nunca' }
  /** No se pudo leer: la tarjeta no dice nada del último registro. */
  | { readonly tipo: 'sin-leer' };

export interface NutricionDeInicio {
  readonly hoy: HoyResponse['data'];
  readonly ultimo: DetalleDelUltimo;
}

/**
 * API-NUT-14 con el día del plan elegido y, solo si hoy no hay registros, la primera página de API-NUT-16-LISTA con
 * `limit` 1: el registro más reciente por momento de registro. No recorre el historial. «Días con registros en un
 * período» no se puede saber con una página (D-1) y no se calcula.
 */
export async function leerNutricionDeInicio(api: ApiDeInicio, token: string, diaTipo: string | undefined): Promise<Resultado<NutricionDeInicio>> {
  const r = await api.hoyNutricional(token, diaTipo);
  if (!r.ok) return r;
  const hoy = r.datos.data;
  if (hoy.registeredIntake.length > 0) return { ok: true, datos: { hoy, ultimo: { tipo: 'hoy' } } };
  const lista = await api.listarMisIngestas(token, { limit: '1' });
  if (!lista.ok) {
    const falla = clasificarFalla(lista);
    if (falla === 'sesion' || falla === 'acceso') return lista;
    return { ok: true, datos: { hoy, ultimo: { tipo: 'sin-leer' } } };
  }
  const i = lista.datos.data[0];
  return { ok: true, datos: { hoy, ultimo: i ? { tipo: 'anterior', registro: { executionId: i.executionId, localDate: i.localDate, origin: i.origin } } : { tipo: 'nunca' } } };
}

// ─── Entrenamiento: actividad de un período ─────────────────────────────────────────────────────

/** Cuántas sesiones se registraron en el período, por su condición vigente: con las correcciones aplicadas. */
export interface ActividadDeEntrenamiento {
  readonly periodo: { readonly desde: string; readonly hasta: string };
  readonly registradas: number;
  readonly realizadas: number;
  readonly conDesvio: number;
  readonly noRealizadas: number;
  /** Cuántas de las registradas tienen al menos una corrección. Su condición ya es la corregida. */
  readonly corregidas: number;
}

/** Los días del resumen de actividad: un mes, dentro del tope de la lista (hasta un año). */
export const DIAS_DE_ACTIVIDAD = 30;

/**
 * API-TRN-19-LISTA, la lista de «Tu historial», para un período. Se guarda solo el resumen, no las sesiones: Inicio
 * cuenta, y el detalle está en «Tu historial». La condición de cada sesión es la vigente (`registroVigente`): una sesión
 * corregida cuenta como quedó después de la corrección.
 */
export async function leerActividadDeEntrenamiento(api: ApiDeInicio, token: string, periodo: { periodStart: string; periodEnd: string }): Promise<Resultado<ActividadDeEntrenamiento>> {
  const r = await api.misEjecucionesDeEntrenamiento(token, periodo);
  if (!r.ok) return r;
  const cuenta = { registradas: 0, realizadas: 0, conDesvio: 0, noRealizadas: 0, corregidas: 0 };
  for (const x of r.datos.data.executions) {
    cuenta.registradas++;
    const condicion = registroVigente(x).sessionCondition;
    if (condicion === 'COMPLETED') cuenta.realizadas++;
    else if (condicion === 'COMPLETED_WITH_DEVIATION') cuenta.conDesvio++;
    else cuenta.noRealizadas++;
    if (x.corrections.length > 0) cuenta.corregidas++;
  }
  return { ok: true, datos: { periodo: { desde: periodo.periodStart, hasta: periodo.periodEnd }, ...cuenta } };
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
