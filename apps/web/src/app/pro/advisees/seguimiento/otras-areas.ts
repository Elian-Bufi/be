/**
 * El panel «Otras áreas» y el plan del otro profesional (WP-TABLERO-ALTA-GAMA TB-52, TB-53, TB-54 y TB-56; DL-163 D-13,
 * ampliada por Dirección el 2026-11-07: «el nutricionista debería poder ver el resumen y hasta la planificación, y poder
 * dejarle comentarios al otro profesional»). Sin React, para probarlo sin navegador (`apps/web/test/otras-areas.test.mjs`,
 * TEST-TAG-039). Lee lo que devuelven API-RES-04, 06 y 07: no calcula nada que la API no diga.
 *
 * Las reglas:
 * - **Sin otra área, no hay panel** (08 §11-bis.7): ni candado, ni aviso, ni un lugar vacío. Una otra área cuenta si la
 *   lleva otro profesional: sin nadie, no hay a quién mirar ni a quién pedirle.
 * - **Cada área dice quién la lleva y qué le comparte la persona,** con su fecha: «resumen y plan», «resumen» o nada. Sin
 *   nada compartido, una línea neutra con quién la lleva: nunca «no te compartió» ni un candado.
 * - **Del pedido, cuándo y si espera respuesta;** nunca qué respondió la persona (eso lo dice lo que comparte).
 * - **Se lee de a poco:** al abrir la página, API-RES-04; los planes (API-RES-06) y con quién se comparte lo propio
 *   (API-RES-07), recién al desplegar el panel.
 * - **Nada escribe, salvo «Dejar una nota» y «Pedir ver su plan».**
 * - **Lo avanzado, en cifras:** lo registrado por semana, sin «%», sin juicios y sin las palabras de las listas de las
 *   tres áreas (T13).
 * Los nombres y las fechas llegan ya formateados (`nombreDe`, `fecha`): el módulo no depende de «Ocultar nombres» ni de
 * cómo escribe las fechas la pantalla.
 */
import {
  ETIQUETA_DE_ALCANCE,
  nombresEnUnaFrase,
  type Alcance,
  type AreaConPlan,
  type AvanceDelPlan,
  type LoQueSeComparteDeMiAreaResponse,
  type OtraArea,
  type PlanCompartido,
  type ResumenesParaElProfesionalResponse,
} from '@be/domain';

export type DatosDelPanel = ResumenesParaElProfesionalResponse['data'];
export type LoQueSeComparteDeMiArea = LoQueSeComparteDeMiAreaResponse['data'];
type Actor = { readonly identityId: string; readonly displayName: string };

/** Las áreas que tienen plan (las mismas del contrato: Antropometría no tiene). */
const CON_PLAN: readonly Alcance[] = ['NUTRICION', 'ENTRENAMIENTO'];
export const tienePlan = (area: Alcance): area is AreaConPlan => CON_PLAN.includes(area);

const nivelEnPalabras = (nivel: 'SUMMARY' | 'SUMMARY_AND_PLAN') => (nivel === 'SUMMARY_AND_PLAN' ? 'resumen y plan' : 'resumen');
const contar = (n: number, uno: string, varios: string) => (n === 1 ? `1 ${uno}` : `${n} ${varios}`);

export const COPY_OTRAS_AREAS = {
  titulo: 'Otras áreas · lo comparte la persona',
  loLleva: (quien: string) => `Lo lleva ${quien}.`,
  comparteElPlan: (desde: string) => `Te comparte el resumen y el plan desde el ${desde}.`,
  comparteElResumen: (desde: string) => `Te comparte el resumen desde el ${desde}.`,
  pedidoPendiente: (el: string) => `Le pediste ver su plan el ${el}: espera la respuesta de la persona.`,
  pedidoRespondido: (el: string) => `Le pediste ver su plan el ${el}.`,
  volverAPedirDesde: (el: string) => `Podés volver a pedirlo desde el ${el}.`,
  verElPlan: 'Ver el plan completo',
  dejarUnaNota: (quien: string) => `Dejar una nota a ${quien}`,
  pedirVerSuPlan: 'Pedir ver su plan',
  volverAPedir: 'Volver a pedir ver su plan',
  loDeTuArea: (quienes: string) => `Lo de tu área lo ve también: ${quienes}.`,
  leyendo: 'Leyendo lo que comparte…',
  noSeLeyo: 'No pudimos leer el plan de esa área.',
  noSePuedeVer: 'Por ahora no se puede ver ese plan.',
  // ─── TB-52 · el plan completo ───────────────────────────────────────────────────────────────
  tituloDelPlan: (area: string) => `Plan de ${area}`,
  soloLectura: 'Solo lectura · lo comparte la persona',
  loArmo: (quien: string) => `Lo armó ${quien}`,
  rigeDesde: (el: string) => `Rige desde el ${el}`,
  proximaRevision: (el: string) => `Próxima revisión: ${el}`,
  sinProximaRevision: 'Sin próxima revisión acordada',
  objetivo: 'Objetivo vigente',
  sinObjetivo: 'No tiene un objetivo vigente.',
  loRegistrado: 'Lo registrado desde que rige',
  elPlan: 'El plan',
  sinPlanVigente: 'Esa área no tiene un plan vigente.',
  semanaDel: (el: string) => `Semana del ${el}`,
  sinSemanas: 'Todavía no hay semanas registradas desde que rige.',
  // ─── TB-53 · la nota ────────────────────────────────────────────────────────────────────────
  citaDelPlan: (area: string, el: string) => `Plan de ${area} que te comparte la persona · activado el ${el}`,
  notaPara: (quien: string, area: string) => `Le escribís a ${quien}, que lleva ${area}. La persona también la lee, en su app.`,
  // ─── TB-56 · el pedido ──────────────────────────────────────────────────────────────────────
  tituloDelPedido: (area: string) => `Pedir ver su plan de ${area}`,
  queLeLlega: 'Le llega una novedad con tu nombre, tu área y para qué. Es su decisión.',
  siDiceQueSi: 'Si dice que sí, ves el plan vigente de esa área, en solo lectura. Si dice «No, por ahora», podés volver a pedirlo a los 7 días.',
  desdeTuArea: (area: string) => `Lo pedís desde ${area}.`,
  volver: 'Volver',
  pidiendo: 'Pidiendo…',
  pedidoEnviado: 'Listo: le pediste ver su plan. Lo decide la persona.',
} as const;
const T = COPY_OTRAS_AREAS;

/**
 * Las áreas del panel: las que lleva otro profesional y quien mira no lleva. Sin ninguna, no hay panel (08 §11-bis.7).
 * El orden es el de la API.
 */
export function areasDelPanel(datos: DatosDelPanel | null): readonly OtraArea[] {
  if (!datos) return [];
  return datos.areas.filter((a) => a.professional !== null && !datos.scopes.includes(a.area));
}

export const hayPanel = (datos: DatosDelPanel | null): boolean => areasDelPanel(datos).length > 0;

/** Qué le comparte la persona de esa área: el plan (con el resumen), solo el resumen, o nada. */
export type EstadoDeOtraArea = 'PLAN' | 'RESUMEN' | 'NADA';
export function estadoDeOtraArea(a: OtraArea): EstadoDeOtraArea {
  if (!a.shared) return 'NADA';
  return a.shared.level === 'SUMMARY_AND_PLAN' && tienePlan(a.area) ? 'PLAN' : 'RESUMEN';
}

/** Lo que se puede hacer desde la tarjeta de un área. Son las únicas acciones del panel: dos escriben (la nota y el pedido). */
export type AccionDelPanel = 'ver-plan' | 'dejar-nota' | 'pedir';
export const ACCIONES_QUE_ESCRIBEN: readonly AccionDelPanel[] = ['dejar-nota', 'pedir'];

export interface TarjetaDeOtraArea {
  readonly area: Alcance;
  readonly etiqueta: string;
  readonly quien: string;
  readonly profesionalId: string;
  readonly estado: EstadoDeOtraArea;
  /** Lo que se dice, en orden: quién la lleva, qué comparte y desde cuándo, su pedido y desde cuándo puede volver a pedir. */
  readonly lineas: readonly string[];
  readonly acciones: readonly AccionDelPanel[];
  /** El texto del botón del pedido, si se puede pedir. */
  readonly pedir: string | null;
}

/** La tarjeta de un área del panel. `nombreDe` ya pasa por «Ocultar nombres». */
export function tarjetaDeOtraArea(a: OtraArea, nombreDe: (actor: Actor) => string, fecha: (iso: string) => string): TarjetaDeOtraArea {
  const quien = a.professional ? nombreDe(a.professional) : '';
  const estado = estadoDeOtraArea(a);
  const lineas: string[] = [T.loLleva(quien)];
  if (a.shared) lineas.push(estado === 'PLAN' ? T.comparteElPlan(fecha(a.shared.since)) : T.comparteElResumen(fecha(a.shared.since)));
  const pedido = estado === 'PLAN' ? null : a.accessRequest;
  if (pedido) lineas.push(pedido.status === 'PENDING' ? T.pedidoPendiente(fecha(pedido.requestedAt)) : T.pedidoRespondido(fecha(pedido.requestedAt)));
  if (estado !== 'PLAN' && !a.canRequestPlan && a.canRequestPlanFrom) lineas.push(T.volverAPedirDesde(fecha(a.canRequestPlanFrom)));
  const puedePedir = estado !== 'PLAN' && a.canRequestPlan && tienePlan(a.area);
  const acciones: AccionDelPanel[] = estado === 'PLAN' ? ['ver-plan', 'dejar-nota'] : puedePedir ? ['pedir'] : [];
  return {
    area: a.area,
    etiqueta: ETIQUETA_DE_ALCANCE[a.area],
    quien,
    profesionalId: a.professional?.identityId ?? '',
    estado,
    lineas,
    acciones,
    pedir: puedePedir ? (a.accessRequest ? T.volverAPedir : T.pedirVerSuPlan) : null,
  };
}

/** El renglón del panel plegado: cada área con lo que comparte, para leerlo sin abrir. Sin nombres. */
export function renglonPlegado(tarjetas: readonly TarjetaDeOtraArea[], pendientes: ReadonlySet<Alcance> = new Set()): string {
  return tarjetas
    .map((t) => (t.estado === 'PLAN' ? `${t.etiqueta}: resumen y plan` : t.estado === 'RESUMEN' ? `${t.etiqueta}: resumen` : pendientes.has(t.area) ? `${t.etiqueta}: pediste ver su plan` : t.etiqueta))
    .join(' · ');
}

/** Las áreas con un pedido que espera respuesta: el renglón plegado lo dice. */
export const conPedidoPendiente = (areas: readonly OtraArea[]): ReadonlySet<Alcance> =>
  new Set(areas.filter((a) => estadoDeOtraArea(a) !== 'PLAN' && a.accessRequest?.status === 'PENDING').map((a) => a.area));

/** Lo que se lee al abrir la página: solo API-RES-04, porque sin otras áreas no hay panel. */
export const LECTURAS_AL_ABRIR = ['API-RES-04'] as const;

/** Lo que se lee al desplegar el panel: el plan de cada área que lo comparte (API-RES-06) y con quién se comparte lo propio (API-RES-07). */
export function lecturasAlDesplegar(tarjetas: readonly TarjetaDeOtraArea[]): readonly string[] {
  return [...tarjetas.filter((t) => t.estado === 'PLAN').map((t) => `API-RES-06 ${t.area}`), 'API-RES-07'];
}

/** Desde qué área sale el pedido: la de la página, si es una de las suyas; si no, la primera. Con más de una, se dice cuál. */
export function areaDelPedido(scopes: readonly Alcance[], dePagina: Alcance): { readonly scope: Alcance; readonly aviso: string | null } {
  if (scopes.includes(dePagina)) return { scope: dePagina, aviso: scopes.length > 1 ? T.desdeTuArea(ETIQUETA_DE_ALCANCE[dePagina]) : null };
  const scope = scopes[0] ?? dePagina;
  return { scope, aviso: scopes.length > 1 ? T.desdeTuArea(ETIQUETA_DE_ALCANCE[scope]) : null };
}

/** Qué hacer con la respuesta de API-RES-08: un 404 o un rechazo por el estado (otro pedido, ya lo comparte) se resuelve volviendo a leer. */
export type TrasPedir = 'enviado' | 'releer' | 'otro';
export function trasPedirVerElPlan(r: { readonly ok: true } | { readonly ok: false; readonly tipo: string; readonly status?: number }): TrasPedir {
  if (r.ok) return 'enviado';
  if (r.tipo === 'API' && (r.status === 404 || r.status === 409 || r.status === 422)) return 'releer';
  return 'otro';
}

/** «Lo de tu área lo ve también: …», con API-RES-07; `null` si no se comparte con nadie. */
export function lineaDeMiArea(lista: LoQueSeComparteDeMiArea, nombreDe: (actor: Actor) => string, fecha: (iso: string) => string): string | null {
  if (lista.length === 0) return null;
  return T.loDeTuArea(nombresEnUnaFrase(lista.map((x) => `${nombreDe(x.professional)} (${ETIQUETA_DE_ALCANCE[x.area]}, ${nivelEnPalabras(x.level)}, desde el ${fecha(x.since)})`)));
}

// ─── El plan en una línea y lo avanzado ───────────────────────────────────────────────────────

/** Cuántas sesiones tiene un plan de entrenamiento, contando las de sus microciclos. */
export function sesionesDelPlan(plan: Extract<PlanCompartido, { area: 'ENTRENAMIENTO' }>['plan']): number {
  return plan.blocks.reduce((n, b) => n + b.sessions.length + b.microcycles.reduce((m, c) => m + c.sessions.length, 0), 0);
}

/** El plan vigente en una línea: desde cuándo rige y qué tiene. */
export function lineaDelPlan(p: PlanCompartido, fecha: (iso: string) => string): string {
  const desde = T.rigeDesde(fecha(p.activatedAt));
  if (p.area === 'NUTRICION') {
    const comidas = p.plan.dayTypes.reduce((n, d) => n + d.meals.length, 0);
    return [desde, contar(p.plan.dayTypes.length, 'día tipo', 'días tipo'), contar(comidas, 'comida', 'comidas')].join(' · ');
  }
  return [desde, contar(p.plan.blocks.length, 'bloque', 'bloques'), contar(sesionesDelPlan(p.plan), 'sesión', 'sesiones')].join(' · ');
}

const QUE_SE_REGISTRA = { SESSIONS: 'Sesiones registradas', MEAL_RECORDS: 'Comidas registradas' } as const;
/** Cuántas semanas dice el renglón del panel; el plan completo las muestra todas. */
export const SEMANAS_EN_EL_RENGLON = 4;

/** Lo avanzado en un renglón: lo registrado en las últimas semanas, en cifras, y lo que el plan prevé si lo dice. */
export function lineaDelAvance(avance: AvanceDelPlan, diaCivil: (fecha: string) => string): string {
  if (avance.weeks.length === 0) return T.sinSemanas;
  const ultimas = avance.weeks.slice(-SEMANAS_EN_EL_RENGLON);
  const cifras = nombresEnUnaFrase(ultimas.map((w) => String(w.recorded)));
  const previstas = avance.plannedPerWeek !== null ? ` · el plan prevé ${avance.plannedPerWeek} por semana` : '';
  return `${QUE_SE_REGISTRA[avance.unit]} por semana: ${cifras} (desde la semana del ${diaCivil(ultimas[0]!.weekStart)})${previstas}`;
}

/** Lo avanzado en una tabla, para el plan completo: una fila por semana, de la más vieja a la más nueva. */
export function tablaDelAvance(avance: AvanceDelPlan, diaCivil: (fecha: string) => string): { readonly encabezado: string; readonly filas: readonly { readonly semana: string; readonly cifra: string }[]; readonly previstas: string | null } {
  return {
    encabezado: QUE_SE_REGISTRA[avance.unit],
    filas: avance.weeks.map((w) => ({ semana: T.semanaDel(diaCivil(w.weekStart)), cifra: String(w.recorded) })),
    previstas: avance.plannedPerWeek !== null ? `El plan prevé ${avance.plannedPerWeek} sesiones por semana.` : null,
  };
}

/** El encabezado del plan completo: quién lo armó, desde cuándo rige y la próxima revisión (solo la fecha). */
export function encabezadoDelPlan(p: PlanCompartido, nombreDe: (actor: Actor) => string, fecha: (iso: string) => string, diaCivil: (fecha: string) => string): readonly string[] {
  return [T.loArmo(nombreDe(p.author)), T.rigeDesde(fecha(p.activatedAt)), p.nextReviewAt ? T.proximaRevision(diaCivil(p.nextReviewAt)) : T.sinProximaRevision];
}

/** La cita del plan compartido en una nota (TB-53): el tipo de referencia que ya existe, con la versión que se ve. */
export function citaDelPlan(p: PlanCompartido, fecha: (iso: string) => string): { readonly type: 'NUTRITION_PLAN_VERSION' | 'TRAINING_PLAN_VERSION'; readonly id: string; readonly texto: string } {
  return { type: p.area === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION', id: p.plan.planId, texto: T.citaDelPlan(ETIQUETA_DE_ALCANCE[p.area], fecha(p.activatedAt)) };
}
