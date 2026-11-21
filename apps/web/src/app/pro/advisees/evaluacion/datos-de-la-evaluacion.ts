/**
 * WP-EVALUACION-INICIAL-2 (DL-189) · la parte pura de la evaluación inicial en el website, sin React y sin imports
 * relativos, para probarla con Node (`apps/web/test/evaluacion-inicial.test.mjs`). Las reglas son del dominio
 * (`evaluacion-inicial.ts`); acá se arma lo que necesita la pantalla con lo que devolvió la API:
 * - las fuentes de lo que contó la persona: lo que respondió (API-CTX-01), lo que cargó el profesional y espera su
 *   confirmación (API-FRI-03) y lo que comparte de sus hábitos (API-HBT-05), cada una con su origen y su fecha;
 * - lo que se resume de cada formulario: lo crítico primero (`CAMPOS_CRITICOS_POR_PLANTILLA`);
 * - el origen de cada dato y cada corrección, en palabras;
 * - la fecha de la evaluación (RP-11): sin cambiarla, la del momento en que se registra;
 * - lo que crea «Completarlo ahora con {nombre}» (RP-14): el formulario del área, «Tus hábitos» si el dominio sugiere
 *   sumarlo y, para tildar, lo demás que puede pedir.
 * Nada de esto se guarda en el navegador.
 */
import {
  CAMPOS_CRITICOS_POR_PLANTILLA,
  camposEnOrden,
  CLAVE_DEL_FORMULARIO_DE_HABITOS,
  COPY_EVALUACION_INICIAL as EI,
  COPY_HABITOS,
  resumenDeValor,
  sugerenciaDeSumarHabitos,
  type Alcance,
  type CorreccionDeLaPersona,
  type FormularioEnElContexto,
  type FuenteDeRespuestas,
  type HabitosCompartidosResponse,
  type HabitosParaElProfesionalResponse,
  type OrigenDelDato,
  type Plantilla,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
  type SolicitudDeFormulario,
  type VersionDePlantillaV2,
} from '@be/domain';

/** Un formulario respondido de este profesional en el área, con lo que la persona corrigió al confirmar (si lo cargó él). */
export interface FormularioRespondido {
  readonly form: FormularioEnElContexto;
  readonly corregidos: readonly string[];
}

/** Una solicitud de este profesional en el área, sin responder, con lo que él cargó y espera confirmación (si hay). */
export interface SolicitudPendiente {
  readonly solicitud: SolicitudDeFormulario;
  readonly propuesta: { readonly answers: readonly RespuestaDeCampoV2Entrada[]; readonly loadedAt: string } | null;
  readonly version: Pick<VersionDePlantillaV2, 'key' | 'sections'> | null;
}

export type LosHabitosCompartidos = HabitosCompartidosResponse['data'];

/** Un renglón en palabras: la pregunta, el valor y su código. */
export interface RenglonEnPalabras {
  readonly fieldCode: string;
  readonly label: string;
  readonly text: string;
  readonly answer: RespuestaDeCampoV2Entrada['answer'] | null;
}

/** Las respuestas de un formulario respondido, en el orden de sus secciones. */
export const renglonesDelRespondido = (form: FormularioEnElContexto): RenglonEnPalabras[] =>
  form.sections.flatMap((s) => s.answers.map((a) => ({ fieldCode: a.fieldCode, label: a.label, text: a.text, answer: a.answer })));

/** Respuestas guardadas (de lo cargado o de los hábitos) en palabras, con la pregunta de su versión. Lo que no está, se saltea. */
export function renglonesDeRespuestas(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[]): RenglonEnPalabras[] {
  const porCodigo = new Map(respuestas.map((r) => [r.fieldCode, r.answer] as const));
  return camposEnOrden(secciones).flatMap((c) => {
    const answer = porCodigo.get(c.fieldCode);
    if (!answer) return [];
    const text = resumenDeValor(c, answer);
    return text ? [{ fieldCode: c.fieldCode, label: c.label, text, answer }] : [];
  });
}

/** Lo que se resume de un formulario: lo crítico de su plantilla (y de hábitos) primero, en su orden, y después el resto, hasta `tope`. */
export function resumenDelFormulario(clavePlantilla: string, renglones: readonly RenglonEnPalabras[], tope = 4): RenglonEnPalabras[] {
  // Los de hábitos también: aparecen solo si el formulario los trae (las versiones de la ronda 2 traen la parte).
  const criticos = new Set([...(CAMPOS_CRITICOS_POR_PLANTILLA[clavePlantilla] ?? []), ...(CAMPOS_CRITICOS_POR_PLANTILLA[CLAVE_DEL_FORMULARIO_DE_HABITOS] ?? [])]);
  const primero = renglones.filter((r) => criticos.has(r.fieldCode));
  const resto = renglones.filter((r) => !criticos.has(r.fieldCode));
  return [...primero, ...resto].slice(0, tope);
}

/**
 * Las fuentes de lo que necesita el cálculo: cada formulario respondido (respondido o confirmado, con lo corregido), cada
 * cosa cargada que espera confirmación y los hábitos compartidos, con su fecha.
 */
export function fuentesDeLoQueConto(p: {
  readonly respondidos: readonly FormularioRespondido[];
  readonly pendientes: readonly SolicitudPendiente[];
  readonly compartidos: LosHabitosCompartidos | null;
}): FuenteDeRespuestas[] {
  const fuentes: FuenteDeRespuestas[] = [];
  for (const r of p.respondidos) {
    const origen: FuenteDeRespuestas['origen'] = r.form.transcribedConfirmedAt
      ? { tipo: 'CONFIRMADO', fecha: r.form.answeredAt, formulario: r.form.templateName }
      : { tipo: 'RESPONDIDO', fecha: r.form.answeredAt, formulario: r.form.templateName };
    fuentes.push({ respuestas: renglonesDelRespondido(r.form), origen, corregidos: r.corregidos });
  }
  for (const s of p.pendientes) {
    if (!s.propuesta || !s.version) continue;
    fuentes.push({ respuestas: renglonesDeRespuestas(s.version.sections, s.propuesta.answers), origen: { tipo: 'CARGADO_SIN_CONFIRMAR', fecha: s.propuesta.loadedAt, formulario: s.solicitud.templateName } });
  }
  if (p.compartidos?.current) {
    fuentes.push({ respuestas: renglonesDeRespuestas([p.compartidos.section], p.compartidos.current.answers), origen: { tipo: 'COMPARTIDO', fecha: p.compartidos.current.recordedAt } });
  }
  return fuentes;
}

/** El origen de un dato en palabras, para la pantalla («Toma del 10/11», «Respondido por Ana · 12/11»). */
export function origenEnPalabras(o: OrigenDelDato, nombre: string, dia: (isoODia: string) => string): string {
  switch (o.tipo) {
    case 'TOMA': return EI.origen.TOMA(dia(o.fecha));
    case 'RESPONDIDO': return EI.origen.RESPONDIDO(nombre, dia(o.fecha));
    case 'CONFIRMADO': return EI.origen.CONFIRMADO(nombre, dia(o.fecha));
    case 'CORREGIDO': return EI.origen.CORREGIDO(nombre, dia(o.fecha));
    case 'CARGADO_SIN_CONFIRMAR': return EI.origen.CARGADO_SIN_CONFIRMAR(nombre);
    case 'COMPARTIDO': return EI.origen.COMPARTIDO(nombre, dia(o.fecha));
    case 'CARGADO_POR_VOS': return EI.origen.CARGADO_POR_VOS;
  }
}

/** RP-16 · una corrección en palabras: «Ana corrigió: 80 → 82 kg», o lo que dice hoy si el antes no quedó (EI-D12). */
export function correccionEnPalabras(c: CorreccionDeLaPersona, nombre: string): string {
  if (c.antes && c.ahora) return EI.corrigio(nombre, c.antes, c.ahora);
  if (c.pregunta && c.ahora) return EI.corrigioLaPregunta(nombre, c.pregunta, c.ahora);
  if (c.pregunta) return EI.quitoLaRespuesta(nombre, c.pregunta);
  return EI.corrigioOtra(nombre);
}

// ─── RP-11 · la fecha ───────────────────────────────────────────────────────────────────────────

/**
 * El momento de la evaluación (EI-D14): sin cambiarla (`null`), el de ahora, al registrar; con «cambiar», el escrito
 * (`AAAA-MM-DDTHH:MM`, hora local), que no puede ser posterior a ahora.
 */
export function momentoDeLaEvaluacion(escrito: string | null, ahora: Date): { readonly ok: true; readonly iso: string } | { readonly ok: false; readonly problema: string } {
  if (escrito === null) return { ok: true, iso: ahora.toISOString() };
  const d = new Date(escrito);
  if (!escrito.trim() || Number.isNaN(d.getTime())) return { ok: false, problema: EI.fechaIlegible };
  // Un minuto de gracia: el campo no tiene segundos.
  if (d.getTime() > ahora.getTime() + 60_000) return { ok: false, problema: EI.fechaFutura };
  return { ok: true, iso: d.toISOString() };
}

/** El valor de un `datetime-local` para un instante, en la hora local. */
export function aCampoLocal(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

// ─── RP-14 · «Completarlo ahora con {nombre}» ───────────────────────────────────────────────────

/** Lo que crea «Completarlo ahora»: lo que va de un clic y lo que se puede tildar antes de seguir (EI-D08). */
export interface PedidosParaCompletar {
  /** El del área (y «Tus hábitos» si el dominio sugiere sumarlo): se crean sin preguntar. */
  readonly fijos: readonly Plantilla[];
  /** Lo demás que puede pedir en el área (y «Tus hábitos» si ya los ve recientes): se tilda antes de seguir. */
  readonly paraTildar: readonly { readonly plantilla: Plantilla; readonly motivo: string | null }[];
}

/**
 * Qué formularios ofrece «Completarlo ahora» en un área: el seleccionable del área con esa clave; «Tus hábitos» fijo si el
 * dominio lo sugiere (no ve hábitos o tienen más de 3 meses), para tildar si no (con su motivo), y nada si API-HBT-07 dio el
 * 404 de lo inexistente; los demás seleccionables del área o transversales, para tildar. Sin el del área, nada.
 */
export function pedidosParaCompletar(p: {
  readonly catalogo: readonly Plantilla[];
  readonly area: Alcance;
  readonly claveDelArea: string;
  /** Lo que sabe de los hábitos (API-HBT-07): `null` si dio el 404 de lo inexistente o no se pudo leer. */
  readonly loQueSabe: HabitosParaElProfesionalResponse['data'] | null;
  /** Si API-HBT-07 dio el 404: entonces «Tus hábitos» no se ofrece. */
  readonly sinAccesoAHabitos: boolean;
  /** Las plantillas que ya tienen una solicitud pendiente en el área: no se piden otra vez (EI-D09). */
  readonly yaPedidas: ReadonlySet<string>;
  readonly ahora: string;
  readonly fecha: (iso: string) => string;
}): PedidosParaCompletar {
  const seleccionables = p.catalogo.filter((x) => x.status === 'SELECTABLE' && !p.yaPedidas.has(x.templateId));
  const delArea = seleccionables.find((x) => x.key === p.claveDelArea && x.domain === p.area) ?? null;
  if (!delArea) return { fijos: [], paraTildar: [] };
  const fijos: Plantilla[] = [delArea];
  const paraTildar: { plantilla: Plantilla; motivo: string | null }[] = [];
  const habitos = p.sinAccesoAHabitos ? null : (seleccionables.find((x) => x.key === CLAVE_DEL_FORMULARIO_DE_HABITOS) ?? null);
  if (habitos) {
    const sugerencia = p.loQueSabe ? sugerenciaDeSumarHabitos({ vistosEl: p.loQueSabe.latestSeenAt, pendienteDesde: p.loQueSabe.pendingHabitsRequestSince, ahora: p.ahora }) : null;
    if (sugerencia?.marcada) fijos.push(habitos);
    else {
      const H = COPY_HABITOS.web.sugerencia;
      const motivo = !sugerencia ? null : sugerencia.motivo === 'SIN_HABITOS' || sugerencia.desde === null ? H.SIN_HABITOS() : H[sugerencia.motivo](p.fecha(sugerencia.desde));
      paraTildar.push({ plantilla: habitos, motivo });
    }
  }
  for (const x of seleccionables) {
    if (x === delArea || x === habitos || x.key === CLAVE_DEL_FORMULARIO_DE_HABITOS) continue;
    if (x.domain === p.area || x.domain === null) paraTildar.push({ plantilla: x, motivo: null });
  }
  return { fijos, paraTildar };
}

/**
 * El cuerpo de FRM-03 para un formulario de «Completarlo ahora»: lo que viene marcado al elegirlo en «Pedir información»
 * (todas las preguntas que la plantilla trae pedidas y, obligatorias, las que sugiere) y el «para qué» que se le da.
 */
export function pedidoParaCompletar(version: Pick<VersionDePlantillaV2, 'templateVersionId' | 'sections'>, area: Alcance, proposito: string) {
  const pedidas = camposEnOrden(version.sections).filter((c) => c.requestedByDefault !== false);
  return {
    templateVersionId: version.templateVersionId,
    purpose: proposito.trim().slice(0, 300),
    scope: area,
    requestedFieldCodes: pedidas.map((c) => c.fieldCode).slice(0, 60),
    requiredFieldCodes: pedidas.filter((c) => c.requiredByDefault).map((c) => c.fieldCode).slice(0, 60),
  };
}
