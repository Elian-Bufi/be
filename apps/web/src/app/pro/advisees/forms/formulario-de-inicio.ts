/**
 * La lógica pura de los formularios V2 en el website (WP-FORMULARIOS-DE-INICIO, DL-164), sin React ni Next, para
 * probarla sola (`apps/web/test/formulario-de-inicio.test.mjs`):
 * - **«Pedir información»**: qué viene marcado al elegir una versión (todas pedidas; requeridas las que la plantilla
 *   sugiere), la precarga desde la evaluación de entrenamiento (DL-100) y cómo se dice cada tipo con sus opciones.
 * - **«Cargar con la persona»** (FI-05): el estado del formulario es la lista de respuestas, en el orden del formulario y
 *   sin las de los campos que una condición ocultó; qué bloquea el envío (todo problema del dominio salvo un
 *   obligatorio sin responder, que la persona completa al confirmar) y qué se le dice al profesional junto a cada campo.
 * Las reglas (condiciones, validación, normalización, el valor en palabras) son del dominio: acá solo se componen.
 */
import {
  camposEnOrden,
  CODIGO_DE_PROBLEMA_V2,
  CONTEXTO_DE_ENTRENAMIENTO,
  MENSAJE_DE_PROBLEMA_V2,
  NOMBRE_DE_TIPO_V2,
  normalizarValor,
  obligatoriosSinResponder,
  resumenDeValor,
  sinRespuestasOcultas,
  validarRespuestasV2,
  type CampoDePlantillaV2,
  type ProblemaDeRespuestaV2,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
  type SolicitudAValidar,
  type ValorDeRespuestaV2,
} from '@be/domain';

// ─── «Pedir información» ────────────────────────────────────────────────────────────────────────

/** Lo que viene marcado al elegir una versión (F-05): todas las preguntas pedidas y, requeridas, las que la plantilla sugiere. */
export function marcadoPorOmision(secciones: readonly SeccionDePlantillaV2[]): { readonly pedidas: readonly string[]; readonly requeridas: readonly string[] } {
  const campos = camposEnOrden(secciones);
  return { pedidas: campos.map((c) => c.fieldCode), requeridas: campos.filter((c) => c.requiredByDefault).map((c) => c.fieldCode) };
}

/** PF-02 (DL-100): la precarga desde la evaluación de entrenamiento, solo con lo que la versión elegida realmente tiene. */
export function precargaDeEntrenamiento(codigosDeLaVersion: readonly string[]): { readonly pedidas: readonly string[]; readonly requeridas: readonly string[] } {
  return {
    pedidas: CONTEXTO_DE_ENTRENAMIENTO.campos.filter((c) => codigosDeLaVersion.includes(c)),
    requeridas: CONTEXTO_DE_ENTRENAMIENTO.requeridos.filter((c) => codigosDeLaVersion.includes(c)),
  };
}

/** Cuántas opciones se nombran antes de resumir con «… (n opciones)». */
const OPCIONES_A_LA_VISTA = 6;

const enumerar = (etiquetas: readonly string[]): string =>
  etiquetas.length <= OPCIONES_A_LA_VISTA ? etiquetas.join(', ') : `${etiquetas.slice(0, OPCIONES_A_LA_VISTA).join(', ')}… (${etiquetas.length} opciones)`;

/** Con qué se responde una pregunta, en palabras y con un resumen de sus opciones: «Una opción · En casa, Fuera de casa». */
export function respondeConV2(campo: CampoDePlantillaV2): string {
  const tipo = NOMBRE_DE_TIPO_V2[campo.dataType];
  switch (campo.dataType) {
    case 'NUMBER':
      return campo.unit ? `${tipo} · ${campo.unit}` : tipo;
    case 'CHOICE':
    case 'MULTI_CHOICE':
      return `${tipo} · ${enumerar(campo.options.map((o) => o.label))}`;
    case 'LIST': {
      const cuantas = campo.minItems > 0 ? `de ${campo.minItems} a ${campo.maxItems}` : `hasta ${campo.maxItems}`;
      return `${tipo} · ${cuantas} (${campo.itemLabel}) · ${enumerar(campo.itemFields.map((s) => s.label))}`;
    }
    case 'MATRIX':
      return `${tipo} · ${campo.rows.length} ${campo.rows.length === 1 ? 'fila' : 'filas'} · ${enumerar(campo.columns.map((o) => o.label))}`;
    case 'FOODS':
      return `${tipo} · ${campo.suggestions.length} sugeridos${campo.reasons.length > 0 ? ' · con el motivo' : ''}`;
    case 'TIMES':
      return `${tipo} · ${enumerar(campo.parts.map((o) => o.label))}`;
    default:
      return tipo;
  }
}

/**
 * La condición de una pregunta, en palabras y con las etiquetas de la plantilla, nunca los códigos: «Solo si «¿Tenés
 * alguna alergia?» es Sí». Si el campo del que depende no está en el formulario, se dice que depende de otra pregunta.
 */
export function condicionEnPalabras(campo: CampoDePlantillaV2, campos: readonly CampoDePlantillaV2[]): string | null {
  if (campo.showIf === null) return null;
  const de = campos.find((c) => c.fieldCode === campo.showIf?.fieldCode);
  if (!de) return 'Solo si responde otra pregunta.';
  const opciones = de.dataType === 'CHOICE' || de.dataType === 'MULTI_CHOICE' ? de.options : [];
  const valores = campo.showIf.anyOf.map((v) => (typeof v === 'boolean' ? (v ? 'Sí' : 'No') : (opciones.find((o) => o.code === v)?.label ?? v)));
  return `Solo si «${de.label}» es ${valores.join(' o ')}.`;
}

// ─── El estado de «Cargar con la persona» ───────────────────────────────────────────────────────

export const respuestaDe = (respuestas: readonly RespuestaDeCampoV2Entrada[], fieldCode: string): ValorDeRespuestaV2 | undefined =>
  respuestas.find((r) => r.fieldCode === fieldCode)?.answer;

/**
 * Las respuestas después de cambiar una: `null` deja el campo sin responder (se omite, nunca viaja vacío). Quedan en el
 * orden del formulario, y se sacan las de los campos que la condición ocultó (cambiar un «sí» por un «no» retira lo que
 * dependía de él, DL-164 D-2).
 */
export function conRespuesta(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[], fieldCode: string, valor: ValorDeRespuestaV2 | null): RespuestaDeCampoV2Entrada[] {
  const orden = new Map(camposEnOrden(secciones).map((c, i) => [c.fieldCode, i] as const));
  const otras = respuestas.filter((r) => r.fieldCode !== fieldCode);
  const todas = valor === null ? otras : [...otras, { fieldCode, answer: valor }];
  todas.sort((a, b) => (orden.get(a.fieldCode) ?? 999) - (orden.get(b.fieldCode) ?? 999));
  return sinRespuestasOcultas(secciones, todas);
}

/** Marcar o desmarcar una de «varias opciones»: las exclusivas («Ninguna») van solas, y el tope no se pasa. */
export function alternarOpcionMultiple(campo: Extract<CampoDePlantillaV2, { dataType: 'MULTI_CHOICE' }>, elegidas: readonly string[], codigo: string): string[] {
  if (elegidas.includes(codigo)) return elegidas.filter((c) => c !== codigo);
  if (campo.exclusiveOptionCodes.includes(codigo)) return [codigo];
  const sinExclusivas = elegidas.filter((c) => !campo.exclusiveOptionCodes.includes(c));
  if (campo.maxSelected !== null && sinExclusivas.length >= campo.maxSelected) return [...elegidas];
  return [...sinExclusivas, codigo];
}

export interface RevisionAntesDeEnviar {
  /** Lo que la API rechazaría: no se envía hasta corregirlo. */
  readonly bloqueantes: readonly ProblemaDeRespuestaV2[];
  /** Los obligatorios pedidos, visibles y sin responder: se marcan, pero no frenan. La persona los completa al confirmar. */
  readonly sinResponder: readonly string[];
}

/** Lo que se revisa antes de «Enviar para que lo confirme»: la validación del dominio, sin exigir los obligatorios. */
export function revisarAntesDeEnviar(secciones: readonly SeccionDePlantillaV2[], solicitud: SolicitudAValidar, respuestas: readonly RespuestaDeCampoV2Entrada[]): RevisionAntesDeEnviar {
  return {
    bloqueantes: validarRespuestasV2(secciones, solicitud, respuestas).filter((p) => p.code !== CODIGO_DE_PROBLEMA_V2.REQUIRED),
    sinResponder: obligatoriosSinResponder(secciones, solicitud, respuestas),
  };
}

/** El lugar dentro de un valor al que apunta un problema, en palabras: «Renglón 2», «Alimento 3». `null` si es el campo entero. */
function lugarDelProblema(path: string): string | null {
  const renglon = /\.items\[(\d+)\]/.exec(path);
  if (renglon) return `Renglón ${Number(renglon[1]) + 1}`;
  const alimento = /\.foods\[(\d+)\]/.exec(path);
  if (alimento) return `Alimento ${Number(alimento[1]) + 1}`;
  return null;
}

/** Los problemas por campo, cada uno con su mensaje y, si es de un renglón o un alimento, cuál; sin repetidos. */
export function mensajesPorCampo(problemas: readonly ProblemaDeRespuestaV2[]): ReadonlyMap<string, readonly string[]> {
  const porCampo = new Map<string, string[]>();
  for (const p of problemas) {
    const lugar = lugarDelProblema(p.path);
    const mensaje = `${lugar ? `${lugar}: ` : ''}${MENSAJE_DE_PROBLEMA_V2[p.code] ?? MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH]}`;
    const lista = porCampo.get(p.fieldCode) ?? [];
    if (!lista.includes(mensaje)) lista.push(mensaje);
    porCampo.set(p.fieldCode, lista);
  }
  return porCampo;
}

/** El cuerpo que se envía: cada valor en su forma canónica (textos sin bordes, opciones en el orden del campo). */
export function respuestasParaEnviar(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[]): RespuestaDeCampoV2Entrada[] {
  const campos = new Map(camposEnOrden(secciones).map((c) => [c.fieldCode, c] as const));
  return respuestas.map((r) => ({ fieldCode: r.fieldCode, answer: normalizarValor(campos.get(r.fieldCode), r.answer) }));
}

/**
 * Los problemas que devolvió la API (`422 FORM_RESPONSE_INVALID`, `details.issues`), en la forma del dominio. El cliente
 * solo garantiza `code` y `path`; `fieldCode` viaja en el issue (DL-104) y, si faltara, se deduce del índice del `path`
 * sobre lo que se envió. Lo que no se puede ubicar en un campo se descarta: la pantalla dice igual que no se aceptó.
 */
export function problemasDeLaApi(issues: readonly { readonly code: string; readonly path: string }[], enviadas: readonly RespuestaDeCampoV2Entrada[]): ProblemaDeRespuestaV2[] {
  const problemas: ProblemaDeRespuestaV2[] = [];
  for (const issue of issues) {
    const declarado = (issue as { readonly fieldCode?: unknown }).fieldCode;
    const indice = /^answers\[(\d+)\]/.exec(issue.path);
    const fieldCode = typeof declarado === 'string' ? declarado : indice ? enviadas[Number(indice[1])]?.fieldCode : undefined;
    if (!fieldCode) continue;
    problemas.push({ code: issue.code as ProblemaDeRespuestaV2['code'], path: issue.path, fieldCode });
  }
  return problemas;
}

// ─── Un valor, en renglones ─────────────────────────────────────────────────────────────────────

/**
 * Un valor V2 en renglones legibles, con las etiquetas de la plantilla: una lista da un renglón por ítem, una tabla uno
 * por fila, los horarios uno por parte; lo demás, una línea (`resumenDeValor`).
 */
export function lineasDeValor(campo: CampoDePlantillaV2 | undefined, valor: ValorDeRespuestaV2): string[] {
  switch (valor.type) {
    case 'LIST':
      return valor.items.map((item) => resumenDeValor(campo, { type: 'LIST', items: [item] }));
    case 'MATRIX':
      return valor.cells.map((celda) => resumenDeValor(campo, { type: 'MATRIX', cells: [celda] }));
    case 'TIMES':
      return valor.times.map((hora) => resumenDeValor(campo, { type: 'TIMES', times: [hora] }));
    default:
      return [resumenDeValor(campo, valor)];
  }
}

// ─── Por sección ────────────────────────────────────────────────────────────────────────────────

export interface GrupoDeSeccion {
  readonly clave: string;
  /** El título de la sección; `null` sin versión, para lo que no es de ninguna sección, o si hay un solo grupo. */
  readonly titulo: string | null;
  readonly codigos: readonly string[];
}

/**
 * Los códigos agrupados por la sección de la versión a la que pertenecen, en el orden del formulario, para leer una
 * respuesta larga como se respondió. Lo que no está en ninguna sección (una pregunta que la versión ya no tiene) va al
 * final, sin título; sin la versión, un solo grupo en el orden dado. Con un solo grupo el título sobra y se omite.
 */
export function porSeccion(secciones: readonly SeccionDePlantillaV2[] | null, codigos: readonly string[]): GrupoDeSeccion[] {
  const pendientes = new Set(codigos);
  const grupos: GrupoDeSeccion[] = [];
  for (const s of secciones ?? []) {
    const deLaSeccion = s.fields.map((c) => c.fieldCode).filter((c) => pendientes.has(c));
    if (deLaSeccion.length === 0) continue;
    for (const c of deLaSeccion) pendientes.delete(c);
    grupos.push({ clave: s.sectionCode, titulo: s.title, codigos: deLaSeccion });
  }
  if (pendientes.size > 0) grupos.push({ clave: 'sin-seccion', titulo: null, codigos: codigos.filter((c) => pendientes.has(c)) });
  const unico = grupos.length === 1 ? grupos[0] : undefined;
  return unico ? [{ ...unico, titulo: null }] : grupos;
}
