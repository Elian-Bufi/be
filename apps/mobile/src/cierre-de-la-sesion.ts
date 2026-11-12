/**
 * El cierre de la sesión en curso y sus tiempos, con lo que encontró Dirección al probar la 0.25 (WP-APP-VUELTA-2,
 * etapa B: AV2-31, AV2-34, AV2-35, AV2-37 y AV2-38). Es lógica pura: la pantalla (`pantallas/entrenamiento.tsx`) y
 * `scripts/vuelta-de-rosca.test.mjs` usan estas funciones.
 *
 * - **Por qué no se puede finalizar todavía** (AV2-31): el motivo se dice junto al botón, y el botón no parece que
 *   funciona. Antes, el aviso salía arriba de todo y la persona estaba abajo.
 * - **La condición que corresponde** (AV2-31): «Realizada» viene elegida solo cuando los datos lo dicen (todas las series
 *   del plan registradas, ninguna escrita sin registrar y ningún ejercicio sustituido). Si no, la elige la persona.
 * - **La hora de la sesión** (AV2-35) se toma sola al empezar: es el instante de «Iniciar entrenamiento», si cae en el
 *   día de la sesión. Solo se pide cuando no hay ese instante (una sesión de otro día cargada después).
 * - **Una sesión abierta hace horas** (AV2-37) no cuenta «89:08:26»: dice desde cuándo está abierta, con su fecha.
 * - **Los tiempos de la sesión, resumidos** (AV2-38): un renglón por ejercicio, sin repetir «sin recomendado».
 */
import { duracionParaMostrar, ETIQUETA_DE_CALIDAD_DE_TIEMPO, fechaCivil as fechaDelInstante, numero, type CalculoDeTiempos, type DuracionApi, type EventoDeTiempo } from '@be/domain';
import { fecha } from './formato';
import type { ResumenDelEjercicio } from './series-de-la-sesion';

export type CondicionDeLaSesion = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';

export const TEXTOS_DEL_CIERRE = {
  titulo: 'Terminar el entrenamiento',
  comoResulto: '¿Cómo resultó?',
  realizada: 'Realizada',
  conDesvio: 'Con desvío',
  porQueRealizada: 'Viene elegida porque registraste todas las series del plan. Podés cambiarla.',
  volverALaSesion: 'Volver a la sesión',
  detalle: 'Ver el detalle',
  seriesRegistradas: (registradas: number, planificadas: number) => `${numero(registradas, 0)} de ${numero(planificadas, 0)} series del plan registradas`,
  faltaLaCondicion: 'Para finalizar, elegí cómo resultó la sesión.',
  faltaResolverLaMedicion: 'Para finalizar, resolvé la medición abierta.',
  faltaLoEscrito: 'Para finalizar, registrá o descartá lo escrito sin registrar.',
  faltaLaHora: 'Para finalizar, indicá a qué hora la hiciste.',
  horaTomada: (hora: string) => `Hora de la sesión: ${hora}, la de «Iniciar entrenamiento».`,
  abiertaDesde: (cuando: string) => `Sesión abierta desde el ${cuando}`,
  sinPausas: (duracion: string) => `Sin pausas: ${duracion}`,
  descansos: (lista: string) => `Descansos: ${lista}`,
  recomendado: (duracion: string) => `${duracion} recomendado`,
  seriesMedidas: (lista: string) => `Series medidas: ${lista}`,
} as const;

// ─── Finalizar (AV2-31) ─────────────────────────────────────────────────────────────────────────

/**
 * Por qué todavía no se puede finalizar, en el orden en que se resuelve en la pantalla, o `null` si se puede. Lo que se
 * comprueba recién al tocar (el envío, la API) sigue saliendo junto al botón.
 */
export function motivoParaNoFinalizar(d: { readonly condicion: CondicionDeLaSesion | null; readonly medicionAbierta: boolean; readonly escritasSinRegistrar: boolean; readonly faltaLaHora: boolean }): string | null {
  const T = TEXTOS_DEL_CIERRE;
  if (d.medicionAbierta) return T.faltaResolverLaMedicion;
  if (d.escritasSinRegistrar) return T.faltaLoEscrito;
  if (d.condicion === null) return T.faltaLaCondicion;
  if (d.faltaLaHora) return T.faltaLaHora;
  return null;
}

/**
 * La condición que corresponde por los datos, sin suponer: «Realizada» solo si cada ejercicio tiene registradas todas sus
 * series del plan, nada escrito sin registrar y ningún ejercicio sustituido. En cualquier otro caso, `null`: la elige la
 * persona (un desvío no se infiere, ni para un lado ni para el otro).
 */
export function condicionQueCorresponde(resumen: readonly Pick<ResumenDelEjercicio, 'planificadas' | 'sinRegistrar' | 'escritas' | 'ejecutado'>[]): 'COMPLETED' | null {
  if (resumen.length === 0) return null;
  const todo = resumen.every((r) => r.planificadas > 0 && r.sinRegistrar.length === 0 && r.escritas.length === 0 && r.ejecutado === null);
  return todo ? 'COMPLETED' : null;
}

/** «12 de 16 series del plan registradas»: lo mismo que cuentan los tramos de la franja. */
export function lineaDelResultado(resumen: readonly Pick<ResumenDelEjercicio, 'planificadas' | 'sinRegistrar'>[]): string {
  const planificadas = resumen.reduce((n, r) => n + r.planificadas, 0);
  const registradas = resumen.reduce((n, r) => n + r.planificadas - r.sinRegistrar.length, 0);
  return TEXTOS_DEL_CIERRE.seriesRegistradas(registradas, planificadas);
}

// ─── La hora de la sesión (AV2-35) ──────────────────────────────────────────────────────────────

/** El instante civil de «Iniciar entrenamiento», o `null` si la corrida no empezó. */
export function inicioDeLaCorrida(eventos: readonly EventoDeTiempo[]): string | null {
  return eventos.find((e) => e.type === 'SESSION_STARTED')?.at.civil ?? null;
}

/**
 * La hora de la sesión tomada al empezar: el instante de «Iniciar entrenamiento», si cae en el día de la sesión en su
 * zona. Si no (se empezó otro día, o no hay corrida), `null`, y la hora se pide como antes.
 */
export function horaTomadaAlEmpezar(d: { readonly fechaDeLaSesion: string; readonly zona: string; readonly inicio: string | null }): string | null {
  if (!d.inicio) return null;
  return fechaDelInstante(d.inicio, d.zona) === d.fechaDeLaSesion ? d.inicio : null;
}

// ─── Una sesión abierta hace horas (AV2-37) ─────────────────────────────────────────────────────

/** Desde cuánto el conteo deja de servir: ninguna sesión de entrenamiento dura seis horas seguidas. */
export const CONTEO_HASTA_MS = 6 * 60 * 60 * 1000;

/**
 * Cómo se muestra el tiempo de la sesión: el conteo de siempre o, con la sesión abierta hace seis horas o más (se quedó
 * abierta otro día), desde cuándo está abierta, con su fecha y su hora: «Sesión abierta desde el 8 nov · 10:15». El
 * tiempo del ejercicio, en ese caso, no se muestra: contaría lo mismo.
 */
export function tiempoDeLaSesionAbierta(ms: number | null, inicio: string | null, zona?: string): { readonly tipo: 'conteo' } | { readonly tipo: 'desde'; readonly texto: string } {
  if (ms === null || inicio === null || ms < CONTEO_HASTA_MS) return { tipo: 'conteo' };
  return { tipo: 'desde', texto: TEXTOS_DEL_CIERRE.abiertaDesde(fecha(inicio, zona)) };
}

// ─── Los tiempos de la sesión, resumidos (AV2-38) ───────────────────────────────────────────────

/** «01:32», o «01:32 estimado» si no se midió; «incompleto» si no tiene fin. */
function duracionCorta(d: DuracionApi): string {
  if (d.ms === null) return d.quality === 'INCOMPLETE' ? 'incompleto' : 'no informado';
  const texto = duracionParaMostrar(d.ms) ?? '—';
  return d.quality === 'MEASURED' ? texto : `${texto} ${ETIQUETA_DE_CALIDAD_DE_TIEMPO[d.quality]}`;
}

export interface RenglonDeTiempos {
  readonly prescriptionId: string;
  readonly nombre: string;
  /** «Descansos: 01:32 · 01:45 · 01:30 recomendado», o `null` sin descansos. */
  readonly descansos: string | null;
  /** «Series medidas: 00:40 · 00:38», o `null` sin series cronometradas. */
  readonly series: string | null;
}

/**
 * Un renglón por ejercicio, en el orden de la rutina: sus descansos y sus series medidas, en el orden en que se hicieron.
 * El recomendado se dice una vez por ejercicio, y solo si es el mismo para todos sus descansos; sin recomendado no se
 * escribe nada (lo que no hay queda neutro, no se repite en cada fila).
 */
export function tiemposResumidos(calculo: Pick<CalculoDeTiempos, 'rests' | 'timedSets'> | null, orden: readonly { readonly prescriptionId: string; readonly nombre: string }[]): RenglonDeTiempos[] {
  if (!calculo) return [];
  return orden.flatMap((x) => {
    const descansos = calculo.rests.filter((d) => d.prescriptionId === x.prescriptionId);
    const series = calculo.timedSets.filter((s) => s.prescriptionId === x.prescriptionId);
    if (descansos.length === 0 && series.length === 0) return [];
    const recomendados = [...new Set(descansos.map((d) => d.recommendedSeconds))];
    const uno = recomendados.length === 1 && recomendados[0] !== null ? duracionParaMostrar(recomendados[0] * 1000) : null;
    const listaDeDescansos = descansos.map((d) => duracionCorta(d.duration)).join(' · ');
    return [
      {
        prescriptionId: x.prescriptionId,
        nombre: x.nombre,
        descansos: descansos.length === 0 ? null : TEXTOS_DEL_CIERRE.descansos(uno ? `${listaDeDescansos} · ${TEXTOS_DEL_CIERRE.recomendado(uno)}` : listaDeDescansos),
        series: series.length === 0 ? null : TEXTOS_DEL_CIERRE.seriesMedidas(series.map((s) => duracionCorta(s.duration)).join(' · ')),
      },
    ];
  });
}
