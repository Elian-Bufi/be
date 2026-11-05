/**
 * DL-165 D-9 (WP-FORMULARIOS-RONDA-2, FR-10) · los hábitos de la persona y la autorización para compartirlos. Reglas puras
 * que comparten la API, la APK y el website; la base las vuelve a exigir (migración 20261105130100) y la autorización de
 * cada lectura sigue en el PDP de la API (DL-095).
 *
 * **Los hábitos son de la persona, no de un área** (`habitos_de_la_persona`, de solo agregar). Cada versión guarda las
 * respuestas de la parte «Tus hábitos» (`SECCION_DE_HABITOS`) en el formato V2, siempre declaradas por ella. La vigente
 * es la última; las anteriores son su historia (una corrección agrega, nunca pisa). Llegan de dos lados:
 * - **un formulario** con la parte «Tus hábitos», al responderlo o confirmarlo (API-FRI-04, en la misma transacción): lo
 *   que el formulario preguntó de la parte reemplaza lo vigente —lo respondido, y lo que la persona dejó sin responder
 *   sale—; lo que no preguntó queda como estaba (`habitosDespuesDeUnFormulario`, D-16);
 * - **«Mis hábitos»**, en su app (API-HBT-02): la parte entera, sin obligatorias, porque nadie se la está pidiendo.
 *
 * **La autorización** (`autorizacion_de_habitos`, versionada: cada cambio es una fila nueva) es un acto de la persona,
 * distinto de A3 y de B2: no autoriza un Alcance, sino una categoría —sus hábitos— hacia una **lista explícita** de
 * profesionales (08 C-12: ampliar exige una aceptación nueva).
 * - Cada versión ACTIVA guarda, por profesional y por componente de vínculo sin terminar (aceptado o en pausa), si los
 *   recibe y desde cuándo, o si la persona dijo que no (`renglonesDeLaAutorizacion`).
 * - Un profesional que empieza a acompañarla después no figura en la versión vigente: no los recibe solo, y la app le
 *   pregunta a la persona (`NOT_ASKED`). Lo mismo si terminó su vínculo y vuelve con otro: son componentes nuevos (D-17).
 * - Un profesional los ve (API-HBT-05) si la autorización está ACTIVA, lo incluye con un componente que el PDP hoy
 *   permite (vínculo aceptado, ni en pausa ni terminado, con su B2 y el A3 de la persona) (`desdeCuandoLosRecibe`).
 */
import type { Alcance } from './alcance';
import type { CampoDePlantillaV2, RespuestaDeCampoV2Entrada, SeccionDePlantillaV2 } from './contratos-formularios-v2';
import type { ValidationIssue } from './contratos';
import { normalizarValor, problemasDeValor, sinRespuestasOcultas, type SolicitudAValidar } from './formularios-v2';
import { SECCION_DE_HABITOS } from './plantillas-de-inicio';


/** El código de la parte común en las plantillas: así se reconoce en cualquier versión que la traiga. */
export const CODIGO_DE_LA_PARTE_DE_HABITOS = SECCION_DE_HABITOS.sectionCode;

/** Las preguntas de «Tus hábitos», en su orden. Son las únicas que guarda `habitos_de_la_persona`. */
export const CAMPOS_DE_HABITOS: readonly string[] = SECCION_DE_HABITOS.fields.map((c) => c.fieldCode);

const CAMPO_DE_HABITOS: ReadonlyMap<string, CampoDePlantillaV2> = new Map(SECCION_DE_HABITOS.fields.map((c) => [c.fieldCode, c] as const));

/**
 * «Mis hábitos» (API-HBT-02) valida como un formulario que pide toda la parte y no exige nada: son los datos de la
 * persona, y nadie se los está pidiendo. Una lista abierta sigue exigiendo sus renglones completos.
 */
export const SOLICITUD_DE_MIS_HABITOS: SolicitudAValidar = { requestedFieldCodes: CAMPOS_DE_HABITOS, requiredFieldCodes: [] };

/** La parte «Tus hábitos» de una versión de plantilla, si la trae. */
export function parteDeHabitos(secciones: readonly SeccionDePlantillaV2[]): SeccionDePlantillaV2 | null {
  return secciones.find((s) => s.sectionCode === CODIGO_DE_LA_PARTE_DE_HABITOS) ?? null;
}

/** Si la versión trae la parte común: es lo que hace que responderla agregue una versión de los hábitos. */
export const traeLaParteDeHabitos = (secciones: readonly SeccionDePlantillaV2[]): boolean => parteDeHabitos(secciones) !== null;

/**
 * Las respuestas de hábitos en su forma guardada: solo las preguntas de la parte, una vez cada una, en su orden, sin lo
 * que una condición dejó oculto, sin un valor que la parte de hoy no acepta y en su forma canónica (`normalizarValor`).
 * Lo que no pasa se descarta: una versión vieja de una pregunta no se arrastra a una versión nueva de los hábitos.
 */
export function habitosEnOrden(respuestas: readonly RespuestaDeCampoV2Entrada[]): RespuestaDeCampoV2Entrada[] {
  const porCodigo = new Map<string, RespuestaDeCampoV2Entrada>();
  for (const r of respuestas) if (CAMPO_DE_HABITOS.has(r.fieldCode) && !porCodigo.has(r.fieldCode)) porCodigo.set(r.fieldCode, r);
  const enOrden = CAMPOS_DE_HABITOS.flatMap((codigo) => {
    const r = porCodigo.get(codigo);
    const campo = CAMPO_DE_HABITOS.get(codigo)!;
    if (!r || problemasDeValor(campo, r.answer, 'x').length > 0) return [];
    return [{ fieldCode: codigo, answer: normalizarValor(campo, r.answer) }];
  });
  return sinRespuestasOcultas([SECCION_DE_HABITOS], enOrden);
}

/**
 * API-FRI-04 (§4.2; D-16) · los hábitos que quedan después de responder o confirmar un formulario con la parte «Tus
 * hábitos». Lo que el formulario **preguntó** de la parte (lo pedido en la Solicitud) es lo que la persona dijo ahora:
 * reemplaza lo vigente, y si quedó sin responder, sale. Lo que el formulario no preguntó queda como estaba.
 * `null`: no hay nada que agregar (el formulario no pidió nada de la parte, o no hay vigente y no respondió nada de ella).
 */
export function habitosDespuesDeUnFormulario(p: {
  readonly parte: SeccionDePlantillaV2;
  readonly pedidos: readonly string[];
  readonly respondidas: readonly RespuestaDeCampoV2Entrada[];
  readonly vigentes: readonly RespuestaDeCampoV2Entrada[] | null;
}): RespuestaDeCampoV2Entrada[] | null {
  const deLaParte = new Set(p.parte.fields.map((c) => c.fieldCode));
  const preguntadas = new Set(p.pedidos.filter((c) => deLaParte.has(c) && CAMPO_DE_HABITOS.has(c)));
  if (preguntadas.size === 0) return null;
  const nuevas = p.respondidas.filter((r) => preguntadas.has(r.fieldCode));
  const quedan = (p.vigentes ?? []).filter((r) => !preguntadas.has(r.fieldCode));
  const resultado = habitosEnOrden([...nuevas, ...quedan]);
  if (resultado.length === 0 && (p.vigentes === null || p.vigentes.length === 0)) return null;
  return resultado;
}

/**
 * La precarga de «¿Sigue igual?» (D-18): en la app de la persona, la parte «Tus hábitos» de un formulario nuevo trae lo
 * vigente de lo que ese formulario pide. Es su propio dato, en su teléfono; lo que envía es una respuesta del área que lo
 * pidió. En «Cargar con la persona», el website lo hace solo si ese profesional ya los recibe (API-HBT-05).
 */
export function precargaDeHabitos(secciones: readonly SeccionDePlantillaV2[], solicitud: Pick<SolicitudAValidar, 'requestedFieldCodes'>, vigentes: readonly RespuestaDeCampoV2Entrada[]): RespuestaDeCampoV2Entrada[] {
  const parte = parteDeHabitos(secciones);
  if (!parte) return [];
  const pedidas = new Set(solicitud.requestedFieldCodes);
  const deLaParte = new Set(parte.fields.map((c) => c.fieldCode).filter((c) => pedidas.has(c)));
  return sinRespuestasOcultas(secciones, habitosEnOrden(vigentes).filter((r) => deLaParte.has(r.fieldCode)));
}

// ─── La autorización ────────────────────────────────────────────────────────────────────────────

/** Un componente de vínculo sin terminar de un profesional con la persona: aceptado o en pausa. */
export interface ComponenteParaHabitos {
  readonly alcanceDeVinculoId: string;
  readonly alcance: Alcance;
  readonly estado: 'ACEPTADO' | 'PAUSADO';
}

/** Un profesional de la persona, con sus componentes sin terminar. */
export interface ProfesionalDeLaPersona {
  readonly profesionalId: string;
  readonly componentes: readonly ComponenteParaHabitos[];
}

/** Un renglón de una versión ACTIVA: un profesional, por uno de sus componentes, si los recibe y desde cuándo. */
export interface RenglonDeLaAutorizacion {
  readonly profesionalId: string;
  readonly alcanceDeVinculoId: string;
  readonly incluido: boolean;
  /** ISO 8601. Solo si `incluido`: desde cuándo los recibe, sin cortes en la lista. */
  readonly incluidoDesde: string | null;
}

/**
 * Qué dice la autorización de un profesional: los recibe, la persona dijo que no, o empezó a acompañarla después y todavía
 * no se le preguntó (`NOT_ASKED`). Sin una versión ACTIVA (nunca la dio o la retiró), nadie los recibe.
 */
export type ComoLosRecibe = 'RECEIVES' | 'DOES_NOT_RECEIVE' | 'NOT_ASKED';

const primero = (instantes: readonly string[]): string | null => (instantes.length === 0 ? null : [...instantes].sort()[0]!);

export function comoLosRecibe(
  componentes: readonly ComponenteParaHabitos[],
  profesionalId: string,
  renglones: readonly RenglonDeLaAutorizacion[] | null,
): { readonly sharing: ComoLosRecibe; readonly sharedSince: string | null } {
  if (renglones === null) return { sharing: 'DOES_NOT_RECEIVE', sharedSince: null };
  const ids = new Set(componentes.map((c) => c.alcanceDeVinculoId));
  const propios = renglones.filter((r) => r.profesionalId === profesionalId && ids.has(r.alcanceDeVinculoId));
  const incluidos = propios.filter((r) => r.incluido);
  if (incluidos.length > 0) return { sharing: 'RECEIVES', sharedSince: primero(incluidos.flatMap((r) => (r.incluidoDesde ? [r.incluidoDesde] : []))) };
  return { sharing: propios.length > 0 ? 'DOES_NOT_RECEIVE' : 'NOT_ASKED', sharedSince: null };
}

/** Lo que la app pregunta: un profesional con el vínculo aceptado que la autorización ACTIVA todavía no nombra. */
export const hayQuePreguntar = (componentes: readonly ComponenteParaHabitos[], profesionalId: string, renglones: readonly RenglonDeLaAutorizacion[] | null): boolean =>
  renglones !== null && componentes.some((c) => c.estado === 'ACEPTADO') && comoLosRecibe(componentes, profesionalId, renglones).sharing === 'NOT_ASKED';

/** Los códigos de los problemas de un pedido de API-HBT-03, en `details.issues` del 422. */
export const CODIGO_DE_PROBLEMA_DE_COMPARTIR = {
  /** Ese profesional no acompaña hoy a la persona (sin vínculo, o con el vínculo terminado). */
  NOT_AVAILABLE: 'HABITS_RECIPIENT_NOT_AVAILABLE',
  /** El mismo profesional está en las dos listas, o dos veces en una. */
  REPEATED: 'HABITS_RECIPIENT_REPEATED',
} as const;

/**
 * Los problemas de un pedido de compartir (API-HBT-03): cada profesional nombrado tiene que acompañar hoy a la persona
 * (un componente sin terminar) y aparecer una sola vez, en una sola de las dos listas.
 */
export function problemasDelPedidoDeCompartir(disponibles: ReadonlySet<string>, incluidos: readonly string[], declinados: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const vistos = new Set<string>();
  const revisar = (lista: readonly string[], nombre: string) =>
    lista.forEach((id, i) => {
      const clave = id.toLowerCase();
      if (vistos.has(clave)) issues.push({ code: CODIGO_DE_PROBLEMA_DE_COMPARTIR.REPEATED, path: `${nombre}[${i}]` });
      else if (!disponibles.has(clave)) issues.push({ code: CODIGO_DE_PROBLEMA_DE_COMPARTIR.NOT_AVAILABLE, path: `${nombre}[${i}]` });
      vistos.add(clave);
    });
  revisar(incluidos, 'professionalIds');
  revisar(declinados, 'declinedProfessionalIds');
  return issues;
}

/**
 * Los renglones de la versión nueva (API-HBT-03), para cada profesional con algún componente sin terminar, por cada uno
 * de esos componentes:
 * - si está entre los `incluidos`, los recibe; desde cuándo es lo de la versión anterior si ya los recibía, o `ahora`;
 * - si está entre los `declinados`, o la versión anterior ya lo nombraba (la persona ya decidió), no los recibe;
 * - si no, no se lo nombra: sigue `NOT_ASKED`, y la app le va a preguntar cuando tenga el vínculo aceptado.
 * Los componentes se toman de nuevo en cada versión: así un área que el profesional sumó después queda registrada.
 */
export function renglonesDeLaAutorizacion(p: {
  readonly profesionales: readonly ProfesionalDeLaPersona[];
  readonly anteriores: readonly RenglonDeLaAutorizacion[] | null;
  readonly incluidos: ReadonlySet<string>;
  readonly declinados: ReadonlySet<string>;
  readonly ahora: string;
}): RenglonDeLaAutorizacion[] {
  const renglones: RenglonDeLaAutorizacion[] = [];
  for (const prof of [...p.profesionales].sort((a, b) => a.profesionalId.localeCompare(b.profesionalId))) {
    const ids = new Set(prof.componentes.map((c) => c.alcanceDeVinculoId));
    const previos = (p.anteriores ?? []).filter((r) => r.profesionalId === prof.profesionalId && ids.has(r.alcanceDeVinculoId));
    const componentes = [...prof.componentes].sort((a, b) => a.alcanceDeVinculoId.localeCompare(b.alcanceDeVinculoId));
    if (p.incluidos.has(prof.profesionalId)) {
      const desde = primero(previos.filter((r) => r.incluido).flatMap((r) => (r.incluidoDesde ? [r.incluidoDesde] : []))) ?? p.ahora;
      for (const c of componentes) renglones.push({ profesionalId: prof.profesionalId, alcanceDeVinculoId: c.alcanceDeVinculoId, incluido: true, incluidoDesde: desde });
    } else if (p.declinados.has(prof.profesionalId) || previos.length > 0) {
      for (const c of componentes) renglones.push({ profesionalId: prof.profesionalId, alcanceDeVinculoId: c.alcanceDeVinculoId, incluido: false, incluidoDesde: null });
    }
  }
  return renglones;
}

/**
 * API-HBT-05 · desde cuándo este profesional recibe los hábitos, o `null` si hoy no los recibe: la autorización tiene que
 * estar ACTIVA (`renglones` no nulo) y nombrarlo como incluido con un componente que el PDP permite ahora
 * (`permitidos`: los componentes de las decisiones permitidas). Un componente en pausa o terminado no lo permite el PDP.
 */
export function desdeCuandoLosRecibe(profesionalId: string, permitidos: readonly string[], renglones: readonly RenglonDeLaAutorizacion[] | null): string | null {
  if (renglones === null) return null;
  const ids = new Set(permitidos);
  return primero(renglones.filter((r) => r.profesionalId === profesionalId && r.incluido && ids.has(r.alcanceDeVinculoId)).flatMap((r) => (r.incluidoDesde ? [r.incluidoDesde] : [])));
}
