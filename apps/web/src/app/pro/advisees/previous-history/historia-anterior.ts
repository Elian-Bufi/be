/**
 * Website `/pro/advisees/previous-history?id=…&area=…` · la historia anterior de un área, para el profesional nuevo
 * (WP-HISTORIA-ANTERIOR, DL-175). Lógica pura, sin React ni red: la dibuja `historia-anterior.tsx` y la prueba
 * `apps/web/test/historia-anterior.test.mjs` (TEST-HA-050 a 056).
 *
 * - **Sale de una sola lectura,** API-HIA-04, por tramos de fechas (`desde` y `hasta` en la dirección; sin ellos, la API
 *   da los últimos 90 días de esa historia).
 * - **Sin la autorización no hay nada que insinuar:** la API responde el 404 de lo inexistente (sin autorización, sin
 *   vínculo, sin el B2, otra área), y la página dice cómo pedírsela a la persona, con el mismo texto en todos los casos
 *   (`estadoDeLaLectura`).
 * - **Todo es de otro profesional y sin su nombre:** cada cosa lleva «De otro profesional», con su número solo si hubo
 *   más de uno (`rotuloDelAutor`).
 * - **Lo que se muestra:** las versiones de los planes con sus fechas; lo registrado por semana; las tomas, con su
 *   protocolo, de dónde salió cada medición si no la midió el profesional («Lo informó la persona», como en el resto del
 *   website) y lo que calculó BE con su método; y las decisiones de las revisiones (resultado, fundamento y próxima
 *   acción). Las fechas llegan formateadas por quien llama (`dia`), para que esto no dependa del navegador.
 * - **El tramo que pide la dirección** es como mucho el de la página (90 días): uno más largo vuelve al de la API. La API
 *   acepta hasta 366, pero la lectura de un año entero es para otros usos (la segunda etapa), no para esta página.
 *
 * La integración con los gráficos (WP-GRAFICOS) queda para una segunda etapa: esto no toca `graficos/**`, «Analizar» ni
 * la cinta.
 */
import {
  ALCANCES,
  COPY_HISTORIA_ANTERIOR as C,
  DIAS_DEL_TRAMO,
  ETIQUETA_DE_ALCANCE,
  ETIQUETA_DE_ORIGEN,
  ETIQUETA_DE_RESULTADO,
  cantidad,
  diasEntreFechas,
  esAlcance,
  esFechaCivil,
  etiquetaDeCondicionRegistrada,
  nombreDeMetrica,
  porSemana,
  rotuloDelAutor,
  tramoAnterior,
  tramoSiguiente,
  type Alcance,
  type HistoriaAnteriorResponse,
  type ParteDeLaHistoriaAnterior,
  type RegistroAnterior,
  type Resultado,
  type TramoDeFechas,
} from '@be/domain';

export type HistoriaAnterior = HistoriaAnteriorResponse['data'];

/** La ruta de la página: una carpeta propia, fuera de la ficha, para no chocar con las vistas del seguimiento. */
export const RUTA_DE_LA_HISTORIA_ANTERIOR = '/pro/advisees/previous-history';

/** Formatea una fecha civil («2026-11-03») para la pantalla. */
export type Dia = (fechaCivil: string) => string;

// ─── La dirección ───────────────────────────────────────────────────────────────────────────────────────────────────

/** El área de la dirección; sin una válida, Nutrición (la ficha siempre la pone). */
export const leerArea = (valor: string | null): Alcance => (esAlcance(valor) ? valor : 'NUTRICION');

/**
 * El tramo de la dirección: las dos fechas juntas, válidas, en orden y de hasta 90 días (los tramos de la página). Si no,
 * `null` (el tramo por omisión de la API): una dirección escrita a mano no pide un año entero en una sola lectura.
 */
export function leerTramo(params: URLSearchParams): TramoDeFechas | null {
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  if (!esFechaCivil(desde) || !esFechaCivil(hasta) || desde > hasta) return null;
  if (diasEntreFechas(desde, hasta) + 1 > DIAS_DEL_TRAMO) return null;
  return { desde, hasta };
}

/** El enlace a la historia anterior de un área, con su tramo (si lo hay) y la vuelta a la ficha (si se llegó de ahí). */
export function hrefDeLaHistoriaAnterior(id: string, area: Alcance, tramo: TramoDeFechas | null = null, volver: string | null = null): string {
  let href = `${RUTA_DE_LA_HISTORIA_ANTERIOR}?id=${encodeURIComponent(id)}&area=${area}`;
  if (tramo) href += `&desde=${tramo.desde}&hasta=${tramo.hasta}`;
  if (volver) href += `&volver=${encodeURIComponent(volver)}`;
  return href;
}

/** Las pestañas: las tres áreas, cada una con su ícono. */
export const AREAS_DE_LA_HISTORIA = ALCANCES.map((a) => ({ clave: a, texto: ETIQUETA_DE_ALCANCE[a], icono: iconoDelArea(a) }));

function iconoDelArea(a: Alcance): 'nutricion' | 'entrenamiento' | 'antropometria' {
  return a === 'NUTRICION' ? 'nutricion' : a === 'ENTRENAMIENTO' ? 'entrenamiento' : 'antropometria';
}

/**
 * El área con que la ficha abre la historia anterior: la primera, en el orden de BE, de los vínculos aceptados de quien
 * lee con esta persona. Sin ninguno, `null` (la ficha no ofrece la entrada).
 */
export function areaParaAbrir(vinculos: readonly { readonly scope: { readonly code: string }; readonly relationshipState: string }[]): Alcance | null {
  const aceptadas = new Set(vinculos.filter((v) => v.relationshipState === 'ACEPTADO').map((v) => v.scope.code));
  return ALCANCES.find((a) => aceptadas.has(a)) ?? null;
}

// ─── El estado de la lectura ────────────────────────────────────────────────────────────────────────────────────────

export type EstadoDeLaLectura = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly historia: HistoriaAnterior } | { readonly tipo: 'sin-autorizacion' } | { readonly tipo: 'error' };

/**
 * Qué mostrar con la respuesta de API-HIA-04. El 404 es «sin autorización», sea cual sea la causa: la API no la dice, y
 * la página no la adivina (lo ajeno responde igual que lo inexistente). Otra falla, «Reintentar».
 */
export function estadoDeLaLectura(r: Resultado<HistoriaAnteriorResponse> | null): EstadoDeLaLectura {
  if (r === null) return { tipo: 'cargando' };
  if (r.ok) return { tipo: 'listo', historia: r.datos.data };
  if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return { tipo: 'sin-autorizacion' };
  return { tipo: 'error' };
}

/**
 * Lo que dice la página sin la autorización: primero lo que hace falta (acompañarla en esa área y que ella la autorice) y
 * después dónde lo encuentra ella. Ni un dato, ni un número, ni si hubo alguien antes.
 */
export function sinAutorizacion(area: Alcance): { readonly titulo: string; readonly cuerpo: string; readonly donde: string } {
  return { titulo: C.comoPedirla.titulo, cuerpo: C.comoPedirla.cuerpo(area), donde: C.comoPedirla.donde(area) };
}

// ─── El tramo ───────────────────────────────────────────────────────────────────────────────────────────────────────

const comoTramo = (t: { readonly from: string; readonly to: string } | null): TramoDeFechas | null => (t ? { desde: t.from, hasta: t.to } : null);

/** El tramo que se ve, de cuándo a cuándo va la historia y los tramos de antes y de después (si la historia sigue). */
export function navegacionDelTramo(h: HistoriaAnterior, dia: Dia): { readonly tramo: string; readonly extension: string | null; readonly anterior: TramoDeFechas | null; readonly siguiente: TramoDeFechas | null } {
  const tramo = comoTramo(h.period)!;
  const extension = comoTramo(h.extent);
  return {
    tramo: C.tramo(dia(tramo.desde), dia(tramo.hasta)),
    extension: extension ? C.laHistoriaVa(dia(extension.desde), dia(extension.hasta)) : null,
    anterior: tramoAnterior(tramo, extension),
    siguiente: tramoSiguiente(tramo, extension),
  };
}

// ─── Las secciones ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Las secciones del área, en el orden de BE (`includes`), con su título y lo que dicen si en el tramo no hay nada. */
export function seccionesDeLaHistoria(h: HistoriaAnterior): readonly { readonly parte: ParteDeLaHistoriaAnterior; readonly titulo: string; readonly vacio: string; readonly cuantas: number }[] {
  const cuantas: Readonly<Record<ParteDeLaHistoriaAnterior, number>> = { PLANS: h.planVersions.length, RECORDS: h.records.length, MEASUREMENTS: h.measurements.length, DECISIONS: h.decisions.length };
  return h.includes.map((parte) => ({ parte, titulo: C.secciones[parte], vacio: C.vacio[parte], cuantas: cuantas[parte] }));
}

/** De lo más nuevo a lo más viejo, con un desempate fijo para que el orden no cambie de una lectura a otra. */
const masNuevoPrimero = <T>(fecha: (x: T) => string, id: (x: T) => string) => (a: T, b: T) => (fecha(a) === fecha(b) ? id(a).localeCompare(id(b)) : fecha(a) < fecha(b) ? 1 : -1);

export interface VersionEnPantalla {
  readonly id: string;
  readonly titulo: string;
  readonly autor: string;
  readonly vigencia: string;
  /** Por qué terminó, o que seguía vigente al empezar el acompañamiento de quien lee. */
  readonly corte: string | null;
  /** Lo que tenía: cada día tipo con sus comidas, o cada bloque con sus sesiones. */
  readonly contenido: readonly string[];
}

/** Las versiones de los planes de antes, de la más nueva a la más vieja, con sus fechas (TEST-HA-052). */
export function versionesEnPantalla(h: HistoriaAnterior, dia: Dia): readonly VersionEnPantalla[] {
  return [...h.planVersions]
    .sort(masNuevoPrimero((v) => v.activatedAt, (v) => v.planVersionId))
    .map((v) => ({
      id: v.planVersionId,
      titulo: C.version(v.number),
      autor: rotuloDelAutor(v.author, h.otherProfessionals),
      vigencia: C.vigencia(dia(v.from), v.to === null ? null : dia(v.to)),
      corte: v.inEffectAtYourStart ? C.seguiaVigente : v.endReason ? C.motivoDelCorte[v.endReason] : null,
      contenido:
        v.content.kind === 'NUTRITION'
          ? [...v.content.dayTypes].sort((a, b) => a.order - b.order).map((d) => conDetalle(d.label, [...d.meals].sort((a, b) => a.order - b.order).map((m) => m.label)))
          : [...v.content.blocks].sort((a, b) => a.order - b.order).map((b) => conDetalle(b.label, [...b.sessions].sort((a, c) => a.order - c.order).map((s) => s.label))),
    }));
}

const conDetalle = (titulo: string, partes: readonly string[]): string => (partes.length > 0 ? `${titulo}: ${partes.join(', ')}` : titulo);

export interface RegistroEnPantalla {
  readonly id: string;
  readonly fecha: string;
  readonly texto: string;
  /** Lo que lo marca: anulado o corregido después. */
  readonly marcas: readonly string[];
  readonly autor: string;
}

export interface SemanaEnPantalla {
  readonly clave: string;
  readonly titulo: string;
  readonly cuenta: string;
  readonly registros: readonly RegistroEnPantalla[];
}

/** Una comida o una sesión, en una línea. */
function registroEnPantalla(r: RegistroAnterior, otros: number, dia: Dia): RegistroEnPantalla {
  const autor = rotuloDelAutor(r.author, otros);
  if (r.kind === 'MEAL') {
    const donde = [r.meal, r.option].filter((x): x is string => !!x).join(' · ');
    const texto =
      r.type === 'PLAN_OPTION'
        ? `${C.opcionDelPlan}${donde ? `: ${donde}` : ''}`
        : `${C.algoDiferente}${r.meal ? ` (${r.meal})` : ''}${r.description ? `: ${r.description}` : ''}`;
    return { id: r.recordId, fecha: dia(r.date), texto, marcas: r.annulled ? [C.anulado] : [], autor };
  }
  const texto = `${r.session} · ${etiquetaDeCondicionRegistrada({ sessionCondition: r.condition })} · ${C.ejercicios(r.exercises)}`;
  return { id: r.recordId, fecha: dia(r.date), texto, marcas: r.corrected ? [C.corregida] : [], autor };
}

/**
 * Lo registrado, por semana (de lunes a domingo, de la más nueva a la más vieja), con lo de cada semana en orden de
 * fecha y la cuenta en palabras: las comidas que siguen en pie (una anulada no cuenta) y las sesiones (TEST-HA-053). La
 * semana va con `diaCorto` («3 nov»); cada registro, con `dia`.
 */
export function semanasEnPantalla(h: HistoriaAnterior, dia: Dia, diaCorto: Dia = dia): readonly SemanaEnPantalla[] {
  return porSemana(h.records).map((s) => {
    const comidas = s.registros.filter((r) => r.kind === 'MEAL' && !r.annulled).length;
    const sesiones = s.registros.filter((r) => r.kind === 'SESSION').length;
    const cuenta = [comidas > 0 ? C.comidasRegistradas(comidas) : null, sesiones > 0 ? C.sesionesRegistradas(sesiones) : null].filter((x): x is string => x !== null).join(' · ');
    return { clave: s.desde, titulo: C.semana(diaCorto(s.desde), diaCorto(s.hasta)), cuenta, registros: s.registros.map((r) => registroEnPantalla(r, h.otherProfessionals, dia)) };
  });
}

export interface TomaEnPantalla {
  readonly id: string;
  readonly titulo: string;
  readonly autor: string;
  readonly protocolos: readonly string[];
  readonly mediciones: readonly string[];
  /** Lo que calculó BE, cada uno con su método. */
  readonly calculos: readonly string[];
}

/** De dónde salió una medición, solo si no la midió el profesional: «Lo informó la persona» o «Importado con procedencia». */
const origenDe = (origen: keyof typeof ETIQUETA_DE_ORIGEN): string => (origen === 'DIRECT_CAPTURE' ? '' : ` · ${ETIQUETA_DE_ORIGEN[origen]}`);

/**
 * Las tomas, de la más nueva a la más vieja: cada medición con su valor y, si no la midió el profesional, de dónde salió;
 * el protocolo y lo calculado con su método (TEST-HA-054). «Ubicar, nunca calificar»: quien lee no conoce a la persona ni
 * al profesional anterior, y un peso que ella contó no se ve igual que uno medido.
 */
export function tomasEnPantalla(h: HistoriaAnterior, dia: Dia): readonly TomaEnPantalla[] {
  return [...h.measurements]
    .sort(masNuevoPrimero((t) => t.takenAt, (t) => t.evaluationId))
    .map((t) => ({
      id: t.evaluationId,
      titulo: dia(t.date),
      autor: rotuloDelAutor(t.author, h.otherProfessionals),
      protocolos: [...new Set(t.measurements.map((m) => m.protocolName))].map(C.protocolo),
      mediciones: t.measurements.map((m) => `${nombreDeMetrica(m.metric)}: ${m.magnitude ? cantidad(m.magnitude.value, m.magnitude.unit) : C.sinValor}${origenDe(m.origin)}${m.corrected ? ` (${C.corregida.toLowerCase()})` : ''}`),
      calculos: t.derivedResults.map((d) => `${nombreDeMetrica(d.metric)}: ${cantidad(d.magnitude.value, d.magnitude.unit)} · ${C.metodo(d.methodName)}`),
    }));
}

export interface DecisionEnPantalla {
  readonly id: string;
  readonly titulo: string;
  readonly autor: string;
  readonly periodo: string;
  readonly resultado: string;
  readonly fundamento: string;
  readonly proximaAccion: string;
  readonly proximaRevision: string | null;
}

/** Las decisiones de las revisiones, de la más nueva a la más vieja: resultado, fundamento y próxima acción (TEST-HA-055). */
export function decisionesEnPantalla(h: HistoriaAnterior, dia: Dia): readonly DecisionEnPantalla[] {
  return [...h.decisions]
    .sort(masNuevoPrimero((d) => d.recordedAt, (d) => d.reviewId))
    .map((d) => ({
      id: d.reviewId,
      titulo: dia(d.date),
      autor: rotuloDelAutor(d.author, h.otherProfessionals),
      periodo: C.periodoRevisado(dia(d.reviewedPeriod.from), dia(d.reviewedPeriod.to)),
      resultado: ETIQUETA_DE_RESULTADO[d.result],
      fundamento: d.rationale,
      proximaAccion: d.nextAction.description,
      proximaRevision: d.nextAction.nextReviewAt ? C.proximaRevision(dia(d.nextAction.nextReviewAt)) : null,
    }));
}
