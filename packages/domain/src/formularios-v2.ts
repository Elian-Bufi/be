/**
 * Reglas puras de los formularios V2 (DL-164), que comparten la API, el website y la APK: qué campos se ven según las
 * condiciones, cómo se valida cada tipo, qué corrigió la persona sobre lo que cargó el profesional y cómo se traduce una
 * plantilla de P0 al formato V2. La autorización (Vínculo, Alcance, B2) sigue en el PDP de la API, nunca acá (DL-095).
 */
import type { CampoDePlantilla } from './contratos-formularios';
import { CODIGO_DE_NUMERO_FUERA_DE_LIMITES, CODIGO_DE_TEXTO_DEMASIADO_LARGO, largoDeTexto } from './contratos-formularios';
import type { CampoDePlantillaV2, RespuestaDeCampoV2Entrada, SeccionDePlantillaV2, SubcampoDeLista, TipoDeCampoV2, ValorDeRespuestaV2, ValorDeSubcampo } from './contratos-formularios-v2';
import { limiteVulnerado, type LimitesNumericos } from './formularios';

/** Los seis tipos que la APK instalada no conoce (DL-164 D-1). Con uno solo, la versión «usa tipos nuevos». */
export const TIPOS_DE_CAMPO_NUEVOS: readonly TipoDeCampoV2[] = ['CHOICE', 'MULTI_CHOICE', 'LIST', 'MATRIX', 'FOODS', 'TIMES'];

/** Topes de los textos cortos dentro de un valor (el «otro» de una opción, un alimento, un subcampo de texto). */
export const LARGO_MAXIMO_DE_OTRO = 200;
export const LARGO_MAXIMO_DE_ALIMENTO = 80;

/** Códigos de issue del `422 FORM_RESPONSE_INVALID` que suma V2 (los de V1 se conservan con su significado). */
export const CODIGO_DE_PROBLEMA_V2 = {
  NOT_REQUESTED: 'FORM_ANSWER_NOT_REQUESTED',
  UNKNOWN_FIELD: 'FORM_ANSWER_UNKNOWN_FIELD',
  DUPLICATED: 'FORM_ANSWER_DUPLICATED',
  TYPE_MISMATCH: 'FORM_ANSWER_TYPE_MISMATCH',
  NOT_VISIBLE: 'FORM_ANSWER_NOT_VISIBLE',
  REQUIRED: 'FORM_ANSWER_REQUIRED',
  EMPTY: 'FORM_ANSWER_EMPTY',
  UNKNOWN_OPTION: 'FORM_ANSWER_UNKNOWN_OPTION',
  TOO_MANY: 'FORM_ANSWER_TOO_MANY',
  TOO_FEW: 'FORM_ANSWER_TOO_FEW',
  EXCLUSIVE_OPTION: 'FORM_ANSWER_EXCLUSIVE_OPTION',
  OTHER_TEXT_NOT_ALLOWED: 'FORM_ANSWER_OTHER_TEXT_NOT_ALLOWED',
  REPEATED_ITEM: 'FORM_ANSWER_REPEATED_ITEM',
  ITEM_FIELD_REQUIRED: 'FORM_ANSWER_ITEM_FIELD_REQUIRED',
  ITEM_FIELD_UNKNOWN: 'FORM_ANSWER_ITEM_FIELD_UNKNOWN',
  ITEM_FIELD_INVALID: 'FORM_ANSWER_ITEM_FIELD_INVALID',
} as const;
export type CodigoDeProblemaV2 =
  | (typeof CODIGO_DE_PROBLEMA_V2)[keyof typeof CODIGO_DE_PROBLEMA_V2]
  | (typeof CODIGO_DE_NUMERO_FUERA_DE_LIMITES)[keyof typeof CODIGO_DE_NUMERO_FUERA_DE_LIMITES]
  | typeof CODIGO_DE_TEXTO_DEMASIADO_LARGO;

/** Un problema por campo (y por renglón, si es una lista). `path` apunta a la entrada: `answers[3].answer`. Nunca repite el valor enviado. */
export interface ProblemaDeRespuestaV2 {
  readonly code: CodigoDeProblemaV2;
  readonly path: string;
  readonly fieldCode: string;
}

/** Todos los campos de las secciones, en el orden del formulario. */
export function camposEnOrden(secciones: readonly SeccionDePlantillaV2[]): CampoDePlantillaV2[] {
  return secciones.flatMap((s) => s.fields);
}

export function usaTiposNuevos(secciones: readonly SeccionDePlantillaV2[]): boolean {
  return camposEnOrden(secciones).some((c) => TIPOS_DE_CAMPO_NUEVOS.includes(c.dataType) || c.showIf !== null);
}

// ─── Condiciones (DL-164 D-2) ───────────────────────────────────────────────────────────────────

/** El valor que mira una condición: el Sí o no, la opción elegida o las opciones elegidas. */
function valoresQueMiraUnaCondicion(valor: ValorDeRespuestaV2 | undefined): readonly (string | boolean)[] {
  if (!valor) return [];
  if (valor.type === 'BOOLEAN') return [valor.yes];
  if (valor.type === 'CHOICE') return [valor.option];
  if (valor.type === 'MULTI_CHOICE') return valor.options;
  return [];
}

/**
 * Los campos visibles con estas respuestas, en orden. Un campo sin condición se ve siempre; uno con condición, solo si
 * el campo del que depende se ve y su respuesta tiene alguno de los valores. Una condición que apunta a un campo
 * posterior o inexistente deja el campo oculto: así un error de la plantilla nunca muestra de más.
 */
export function camposVisibles(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[]): Set<string> {
  const porCampo = new Map(respuestas.map((r) => [r.fieldCode, r.answer] as const));
  const visibles = new Set<string>();
  for (const campo of camposEnOrden(secciones)) {
    if (campo.showIf === null) { visibles.add(campo.fieldCode); continue; }
    const { fieldCode, anyOf } = campo.showIf;
    if (!visibles.has(fieldCode)) continue;
    const mirados = valoresQueMiraUnaCondicion(porCampo.get(fieldCode));
    if (mirados.some((v) => anyOf.includes(v))) visibles.add(campo.fieldCode);
  }
  return visibles;
}

/** Saca las respuestas de los campos que quedaron ocultos (por ejemplo, la persona cambió un «sí» por un «no»). */
export function sinRespuestasOcultas(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[]): RespuestaDeCampoV2Entrada[] {
  let actuales = [...respuestas];
  // Se repite hasta que no cambia: ocultar un campo puede ocultar a los que dependen de él.
  for (let i = 0; i < 10; i++) {
    const visibles = camposVisibles(secciones, actuales);
    const filtradas = actuales.filter((r) => visibles.has(r.fieldCode));
    if (filtradas.length === actuales.length) return filtradas;
    actuales = filtradas;
  }
  return actuales;
}

// ─── Validación (DL-164 D-1) ────────────────────────────────────────────────────────────────────

const vacio = (s: string) => s.trim().length === 0;
const normal = (s: string) => s.trim().toLocaleLowerCase('es-AR');

function problemaDeNumero(valor: number, limites: LimitesNumericos | null | undefined) {
  if (!Number.isFinite(valor)) return CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH;
  const vulnerado = limiteVulnerado(valor, limites ?? undefined);
  return vulnerado ? CODIGO_DE_NUMERO_FUERA_DE_LIMITES[vulnerado] : null;
}

function problemaDeSubcampo(sub: SubcampoDeLista, valor: ValorDeSubcampo): boolean {
  switch (sub.dataType) {
    case 'TEXT': return typeof valor !== 'string' || vacio(valor) || largoDeTexto(valor) > sub.maxLength;
    case 'NUMBER': return typeof valor !== 'number' || problemaDeNumero(valor, sub.limits) !== null;
    case 'CHOICE': return typeof valor !== 'string' || !sub.options.some((o) => o.code === valor);
    case 'BOOLEAN': return typeof valor !== 'boolean';
    // Formato 3 (DL-165 D-6): al menos una opción, todas de la pregunta y sin repetir.
    case 'MULTI_CHOICE': {
      if (!Array.isArray(valor) || valor.length === 0) return true;
      const codigos = new Set(sub.options.map((o) => o.code));
      return valor.some((c) => !codigos.has(c)) || new Set(valor).size !== valor.length;
    }
  }
}

// ─── El formato 3 (DL-165) ──────────────────────────────────────────────────────────────────────

/**
 * Lo que una versión usa del formato 3 (DL-165): el subcampo de varias opciones y el ejemplo de un subcampo de texto. Una
 * versión que usa algo de esto **tiene que** declarar `format: 3`, y una de formato 2 no puede usarlo: si no, la APK
 * 0.20 recibiría una forma que no lee (DL-152). Lo verifican las pruebas de las plantillas y el generador de la migración.
 */
export function loQueUsaDelFormato3(secciones: readonly SeccionDePlantillaV2[]): string[] {
  const usos: string[] = [];
  for (const campo of camposEnOrden(secciones)) {
    if (campo.dataType !== 'LIST') continue;
    for (const sub of campo.itemFields) {
      if (sub.dataType === 'MULTI_CHOICE') usos.push(`${campo.fieldCode}.${sub.code}: varias opciones en el renglón`);
      if (sub.dataType === 'TEXT' && sub.helpText !== undefined) usos.push(`${campo.fieldCode}.${sub.code}: el ejemplo del renglón`);
    }
  }
  return usos;
}

export const usaLoDelFormato3 = (secciones: readonly SeccionDePlantillaV2[]): boolean => loQueUsaDelFormato3(secciones).length > 0;

/** Los problemas de un valor contra su campo, sin mirar si se pidió o si se ve (eso lo hace `validarRespuestasV2`). */
export function problemasDeValor(campo: CampoDePlantillaV2, valor: ValorDeRespuestaV2, path: string): ProblemaDeRespuestaV2[] {
  const p = (code: CodigoDeProblemaV2, sufijo = ''): ProblemaDeRespuestaV2 => ({ code, path: path + sufijo, fieldCode: campo.fieldCode });
  if (valor.type !== campo.dataType) return [p(CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH)];
  switch (campo.dataType) {
    case 'TEXT': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'TEXT' }>;
      if (vacio(v.text)) return [p(CODIGO_DE_PROBLEMA_V2.EMPTY)];
      return largoDeTexto(v.text) > campo.maxLength ? [p(CODIGO_DE_TEXTO_DEMASIADO_LARGO)] : [];
    }
    case 'NUMBER': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'NUMBER' }>;
      const code = problemaDeNumero(v.number, campo.limits);
      return code ? [p(code)] : [];
    }
    case 'BOOLEAN': return [];
    case 'CHOICE': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'CHOICE' }>;
      if (!campo.options.some((o) => o.code === v.option)) return [p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION)];
      return problemasDeOtro(campo.otherOptionCode, [v.option], v.otherText, p);
    }
    case 'MULTI_CHOICE': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'MULTI_CHOICE' }>;
      const codigos = new Set(campo.options.map((o) => o.code));
      if (v.options.some((o) => !codigos.has(o))) return [p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION)];
      if (new Set(v.options).size !== v.options.length) return [p(CODIGO_DE_PROBLEMA_V2.DUPLICATED)];
      if (campo.maxSelected !== null && v.options.length > campo.maxSelected) return [p(CODIGO_DE_PROBLEMA_V2.TOO_MANY)];
      if (v.options.length > 1 && v.options.some((o) => campo.exclusiveOptionCodes.includes(o))) return [p(CODIGO_DE_PROBLEMA_V2.EXCLUSIVE_OPTION)];
      return problemasDeOtro(campo.otherOptionCode, v.options, v.otherText, p);
    }
    case 'LIST': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'LIST' }>;
      if (v.items.length > campo.maxItems) return [p(CODIGO_DE_PROBLEMA_V2.TOO_MANY)];
      if (v.items.length < Math.max(campo.minItems, 1)) return [p(CODIGO_DE_PROBLEMA_V2.TOO_FEW)];
      const subs = new Map(campo.itemFields.map((s) => [s.code, s] as const));
      const problemas: ProblemaDeRespuestaV2[] = [];
      v.items.forEach((renglon, i) => {
        for (const [codigo, valorSub] of Object.entries(renglon)) {
          const sub = subs.get(codigo);
          if (!sub) problemas.push(p(CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_UNKNOWN, `.items[${i}].${codigo}`));
          else if (problemaDeSubcampo(sub, valorSub)) problemas.push(p(CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID, `.items[${i}].${codigo}`));
        }
        for (const sub of campo.itemFields) {
          if (sub.required && !(sub.code in renglon)) problemas.push(p(CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED, `.items[${i}].${sub.code}`));
        }
      });
      return problemas;
    }
    case 'MATRIX': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'MATRIX' }>;
      const filas = new Set(campo.rows.map((o) => o.code));
      const columnas = new Set(campo.columns.map((o) => o.code));
      if (v.cells.some((c) => !filas.has(c.row) || !columnas.has(c.column))) return [p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION)];
      if (new Set(v.cells.map((c) => c.row)).size !== v.cells.length) return [p(CODIGO_DE_PROBLEMA_V2.DUPLICATED)];
      return [];
    }
    case 'FOODS': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'FOODS' }>;
      if (v.foods.length > campo.maxItems) return [p(CODIGO_DE_PROBLEMA_V2.TOO_MANY)];
      const motivos = new Set(campo.reasons.map((o) => o.code));
      const vistos = new Set<string>();
      const problemas: ProblemaDeRespuestaV2[] = [];
      v.foods.forEach((a, i) => {
        if (vacio(a.name)) problemas.push(p(CODIGO_DE_PROBLEMA_V2.EMPTY, `.foods[${i}].name`));
        else if (largoDeTexto(a.name.trim()) > LARGO_MAXIMO_DE_ALIMENTO) problemas.push(p(CODIGO_DE_TEXTO_DEMASIADO_LARGO, `.foods[${i}].name`));
        else if (vistos.has(normal(a.name))) problemas.push(p(CODIGO_DE_PROBLEMA_V2.REPEATED_ITEM, `.foods[${i}].name`));
        vistos.add(normal(a.name));
        if (a.reason !== null && !motivos.has(a.reason)) problemas.push(p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION, `.foods[${i}].reason`));
      });
      return problemas;
    }
    case 'TIMES': {
      const v = valor as Extract<ValorDeRespuestaV2, { type: 'TIMES' }>;
      const partes = new Set(campo.parts.map((o) => o.code));
      if (v.times.some((t) => !partes.has(t.part))) return [p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION)];
      if (new Set(v.times.map((t) => t.part)).size !== v.times.length) return [p(CODIGO_DE_PROBLEMA_V2.DUPLICATED)];
      return [];
    }
  }
}

function problemasDeOtro(
  otroCodigo: string | null,
  elegidas: readonly string[],
  otroTexto: string | null,
  p: (code: CodigoDeProblemaV2, sufijo?: string) => ProblemaDeRespuestaV2,
): ProblemaDeRespuestaV2[] {
  if (otroTexto === null) return [];
  if (otroCodigo === null || !elegidas.includes(otroCodigo)) return [p(CODIGO_DE_PROBLEMA_V2.OTHER_TEXT_NOT_ALLOWED, '.otherText')];
  if (vacio(otroTexto)) return [p(CODIGO_DE_PROBLEMA_V2.EMPTY, '.otherText')];
  return largoDeTexto(otroTexto.trim()) > LARGO_MAXIMO_DE_OTRO ? [p(CODIGO_DE_TEXTO_DEMASIADO_LARGO, '.otherText')] : [];
}

export interface SolicitudAValidar {
  readonly requestedFieldCodes: readonly string[];
  readonly requiredFieldCodes: readonly string[];
}

/**
 * Todos los problemas de un conjunto de respuestas, a la vez (como DL-104). Un campo:
 * - tiene que existir en la versión y estar pedido en la Solicitud (minimización, 09:1528);
 * - no puede repetirse ni estar oculto por su condición (no se guarda lo que no se preguntó);
 * - si es obligatorio y se ve, tiene que estar.
 */
export function validarRespuestasV2(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: SolicitudAValidar,
  respuestas: readonly RespuestaDeCampoV2Entrada[],
): ProblemaDeRespuestaV2[] {
  const campos = new Map(camposEnOrden(secciones).map((c) => [c.fieldCode, c] as const));
  const pedidos = new Set(solicitud.requestedFieldCodes);
  const visibles = camposVisibles(secciones, respuestas);
  const problemas: ProblemaDeRespuestaV2[] = [];
  const vistos = new Set<string>();
  respuestas.forEach((r, i) => {
    const path = `answers[${i}].answer`;
    const campo = campos.get(r.fieldCode);
    const p = (code: CodigoDeProblemaV2): ProblemaDeRespuestaV2 => ({ code, path, fieldCode: r.fieldCode });
    if (!campo) { problemas.push(p(CODIGO_DE_PROBLEMA_V2.UNKNOWN_FIELD)); return; }
    if (!pedidos.has(r.fieldCode)) { problemas.push(p(CODIGO_DE_PROBLEMA_V2.NOT_REQUESTED)); return; }
    if (vistos.has(r.fieldCode)) { problemas.push(p(CODIGO_DE_PROBLEMA_V2.DUPLICATED)); return; }
    vistos.add(r.fieldCode);
    if (!visibles.has(r.fieldCode)) { problemas.push(p(CODIGO_DE_PROBLEMA_V2.NOT_VISIBLE)); return; }
    problemas.push(...problemasDeValor(campo, r.answer, path));
  });
  for (const codigo of solicitud.requiredFieldCodes) {
    if (!vistos.has(codigo) && visibles.has(codigo) && pedidos.has(codigo)) {
      problemas.push({ code: CODIGO_DE_PROBLEMA_V2.REQUIRED, path: 'answers', fieldCode: codigo });
    }
  }
  return problemas;
}

/** Los obligatorios pedidos que se ven y todavía no tienen respuesta: lo que la pantalla marca antes de enviar. */
export function obligatoriosSinResponder(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: SolicitudAValidar,
  respuestas: readonly RespuestaDeCampoV2Entrada[],
): string[] {
  const visibles = camposVisibles(secciones, respuestas);
  const respondidos = new Set(respuestas.map((r) => r.fieldCode));
  const pedidos = new Set(solicitud.requestedFieldCodes);
  return solicitud.requiredFieldCodes.filter((c) => pedidos.has(c) && visibles.has(c) && !respondidos.has(c));
}

// ─── Las ayudas de una pregunta (DL-165 D-2) ────────────────────────────────────────────────────

/**
 * Dónde va la ayuda de una pregunta. En una respuesta de texto es su **texto de muestra**: el ejemplo se lee donde se
 * escribe y se va al escribir. En las demás, una línea corta debajo de la pregunta (el rango de un número, «Elegí hasta
 * dos»). El «para qué» no va acá: va plegado, detrás de «¿Para qué?».
 */
export function ayudaDeLaPregunta(campo: Pick<CampoDePlantillaV2, 'dataType' | 'helpText'>): { readonly aLaVista: string | null; readonly deMuestra: string | null } {
  const ayuda = campo.helpText?.trim() || null;
  return campo.dataType === 'TEXT' ? { aLaVista: null, deMuestra: ayuda } : { aLaVista: ayuda, deMuestra: null };
}

/** Las preguntas en las que se «elige» algo: ahí va «Quitar respuesta». En las demás se borra lo escrito o se quita el renglón. */
export const TIPOS_CON_QUITAR_RESPUESTA: readonly TipoDeCampoV2[] = ['BOOLEAN', 'CHOICE', 'MULTI_CHOICE', 'MATRIX'];

/**
 * DL-165 D-2 · «Quitar respuesta» reemplaza a «tocá de nuevo la opción elegida»: aparece solo cuando hay algo elegido en
 * una pregunta opcional. En una obligatoria no se ofrece: se cambia de opción.
 */
export function seOfreceQuitarRespuesta(campo: Pick<CampoDePlantillaV2, 'dataType' | 'fieldCode'>, solicitud: Pick<SolicitudAValidar, 'requiredFieldCodes'>, hayAlgoElegido: boolean): boolean {
  return hayAlgoElegido && TIPOS_CON_QUITAR_RESPUESTA.includes(campo.dataType) && !solicitud.requiredFieldCodes.includes(campo.fieldCode);
}

// ─── Normalización y correcciones (DL-164 D-4) ──────────────────────────────────────────────────

/**
 * La forma canónica de un valor, para guardarlo y para compararlo: textos sin espacios en los bordes, opciones y celdas
 * en el orden del campo, alimentos y horarios sin repetidos. No cambia lo que la persona dijo, solo su forma.
 */
export function normalizarValor(campo: CampoDePlantillaV2 | undefined, valor: ValorDeRespuestaV2): ValorDeRespuestaV2 {
  const orden = (codigos: readonly { code: string }[] | undefined) => {
    const pos = new Map((codigos ?? []).map((o, i) => [o.code, i] as const));
    return (a: string, b: string) => (pos.get(a) ?? 999) - (pos.get(b) ?? 999);
  };
  switch (valor.type) {
    case 'TEXT': return { type: 'TEXT', text: valor.text.trim() };
    case 'CHOICE': return { type: 'CHOICE', option: valor.option, otherText: valor.otherText === null ? null : valor.otherText.trim() };
    case 'MULTI_CHOICE': {
      const opciones = campo?.dataType === 'MULTI_CHOICE' ? campo.options : undefined;
      return { type: 'MULTI_CHOICE', options: [...new Set(valor.options)].sort(orden(opciones)), otherText: valor.otherText === null ? null : valor.otherText.trim() };
    }
    case 'LIST': {
      // Las varias opciones de un renglón (formato 3), sin repetir y en el orden de su subcampo.
      const subs = new Map((campo?.dataType === 'LIST' ? campo.itemFields : []).map((s) => [s.code, s] as const));
      const enOrden = (codigo: string, v: readonly string[]) => {
        const sub = subs.get(codigo);
        return [...new Set(v)].sort(orden(sub?.dataType === 'MULTI_CHOICE' ? sub.options : undefined));
      };
      return { type: 'LIST', items: valor.items.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : Array.isArray(v) ? enOrden(k, v) : v]))) };
    }
    case 'MATRIX': {
      const filas = campo?.dataType === 'MATRIX' ? campo.rows : undefined;
      const o = orden(filas);
      return { type: 'MATRIX', cells: [...valor.cells].sort((a, b) => o(a.row, b.row)) };
    }
    case 'FOODS': return { type: 'FOODS', foods: valor.foods.map((a) => ({ name: a.name.trim(), reason: a.reason })) };
    case 'TIMES': {
      const partes = campo?.dataType === 'TIMES' ? campo.parts : undefined;
      const o = orden(partes);
      return { type: 'TIMES', times: [...valor.times].sort((a, b) => o(a.part, b.part)) };
    }
    default: return valor;
  }
}

/**
 * La forma canónica de un valor para compararlo: las claves de cada objeto ordenadas, los arreglos en su orden (ese ya
 * lo canoniza `normalizarValor`). La propuesta vuelve de Postgres como `jsonb`, que reordena las claves de cada objeto
 * (primero por largo, después alfabético): `{type, number, unit}` vuelve `{type, unit, number}`, `{type, yes}` vuelve
 * `{yes, type}`, `{type, text}` vuelve `{text, type}`; un `JSON.stringify` a secas los daba por distintos y la
 * transcripción marcaba como corregidas preguntas que la persona no tocó. No lanza (a diferencia de
 * `serializacionCanonica`, pensada para huellas): acá se compara dentro de la confirmación, y un valor raro no la corta.
 */
function formaCanonica(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(formaCanonica).join(',')}]`;
  if (valor !== null && typeof valor === 'object') {
    const o = valor as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${formaCanonica(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor) ?? 'null';
}

/** Iguales sin importar el orden de las claves de los objetos (sí importa el de los arreglos). */
function igualesProfundo(a: unknown, b: unknown): boolean {
  return formaCanonica(a) === formaCanonica(b);
}

/**
 * Los campos que la persona cambió, sumó o quitó respecto de lo que cargó el profesional, en el orden del formulario.
 * Es lo que queda escrito en la transcripción («La persona corrigió 2 respuestas»).
 */
export function camposCorregidos(
  secciones: readonly SeccionDePlantillaV2[],
  propuestas: readonly RespuestaDeCampoV2Entrada[],
  confirmadas: readonly RespuestaDeCampoV2Entrada[],
): string[] {
  const campos = new Map(camposEnOrden(secciones).map((c) => [c.fieldCode, c] as const));
  const antes = new Map(propuestas.map((r) => [r.fieldCode, normalizarValor(campos.get(r.fieldCode), r.answer)] as const));
  const despues = new Map(confirmadas.map((r) => [r.fieldCode, normalizarValor(campos.get(r.fieldCode), r.answer)] as const));
  const orden = camposEnOrden(secciones).map((c) => c.fieldCode);
  return orden.filter((codigo) => {
    const a = antes.get(codigo), d = despues.get(codigo);
    if (a === undefined && d === undefined) return false;
    return a === undefined || d === undefined || !igualesProfundo(a, d);
  });
}

// ─── De P0 a V2 ─────────────────────────────────────────────────────────────────────────────────

/**
 * Un campo de P0 (V1) en formato V2, para que FRM-02b sirva cualquier versión con una sola forma. El texto de P0 es de
 * varias líneas y admite el tope de V1; el número conserva sus límites internos (`contenido.numberLimits`, DL-101).
 */
export function campoV1AV2(campo: CampoDePlantilla, limites?: LimitesNumericos): CampoDePlantillaV2 {
  const base = { fieldCode: campo.fieldCode, label: campo.label, category: campo.category, helpText: campo.helpText, purpose: null, showIf: null, requiredByDefault: false };
  if (campo.dataType === 'NUMBER') return { ...base, dataType: 'NUMBER', unit: campo.unit, limits: limites ? { ...limites } : null };
  if (campo.dataType === 'BOOLEAN') return { ...base, dataType: 'BOOLEAN' };
  return { ...base, dataType: 'TEXT', multiline: true, maxLength: 2000 };
}

// ─── Lectura de una respuesta, en palabras (website, APK y citas) ───────────────────────────────

const etiquetaDe = (opciones: readonly { code: string; label: string }[], codigo: string) => opciones.find((o) => o.code === codigo)?.label ?? codigo;
const numeroEnPalabras = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

/**
 * Una respuesta V2 en una línea legible, con las etiquetas de la plantilla y nunca los códigos: «Desayuno · Café con
 * leche · Todos los días; Almuerzo · Milanesa con puré», «Sentadilla: Con ayuda», «Leche (Me cae mal)». La usan la ficha,
 * la APK y el contexto citable de la evaluación de entrenamiento. Si la plantilla ya no tiene una opción, muestra el
 * código: nunca la inventa.
 */
export function resumenDeValor(campo: CampoDePlantillaV2 | undefined, valor: ValorDeRespuestaV2): string {
  switch (valor.type) {
    case 'TEXT': return valor.text.trim();
    case 'NUMBER': {
      // Las APK instaladas mandan el número sin `unit` (P0 traducido a V2): la unidad es la de la pregunta, nunca se pierde.
      const unidad = valor.unit || (campo?.dataType === 'NUMBER' ? campo.unit : null);
      return unidad ? `${numeroEnPalabras(valor.number)} ${unidad}` : numeroEnPalabras(valor.number);
    }
    case 'BOOLEAN': return valor.yes ? 'Sí' : 'No';
    case 'CHOICE': {
      const etiqueta = campo?.dataType === 'CHOICE' ? etiquetaDe(campo.options, valor.option) : valor.option;
      return valor.otherText ? `${etiqueta}: ${valor.otherText.trim()}` : etiqueta;
    }
    case 'MULTI_CHOICE': {
      const opciones = campo?.dataType === 'MULTI_CHOICE' ? campo.options : [];
      const etiquetas = valor.options.map((o) => (opciones.length ? etiquetaDe(opciones, o) : o));
      return valor.otherText ? `${etiquetas.join(', ')} (${valor.otherText.trim()})` : etiquetas.join(', ');
    }
    case 'LIST': {
      const subs = campo?.dataType === 'LIST' ? campo.itemFields : [];
      return valor.items.map((renglon) => (subs.length ? subs : Object.keys(renglon).map((code) => ({ code, dataType: 'TEXT' as const, options: [] as { code: string; label: string }[] })))
        .filter((s) => s.code in renglon)
        .map((s) => {
          const v = renglon[s.code]!;
          if (s.dataType === 'CHOICE' && typeof v === 'string' && 'options' in s) return etiquetaDe(s.options, v);
          // Formato 3: las varias opciones del renglón, con sus etiquetas («Lunes, Jueves»).
          if (Array.isArray(v)) return v.map((c) => ('options' in s ? etiquetaDe(s.options, c) : c)).join(', ');
          if (typeof v === 'boolean') return v ? 'Sí' : 'No';
          // El número de un renglón no lleva unidad propia: la de su subcampo, si la tiene.
          if (typeof v === 'number') return s.dataType === 'NUMBER' && s.unit ? `${numeroEnPalabras(v)} ${s.unit}` : numeroEnPalabras(v);
          return String(v).trim();
        })
        .join(' · ')).join('; ');
    }
    case 'MATRIX': {
      const filas = campo?.dataType === 'MATRIX' ? campo.rows : [];
      const columnas = campo?.dataType === 'MATRIX' ? campo.columns : [];
      return valor.cells.map((c) => `${filas.length ? etiquetaDe(filas, c.row) : c.row}: ${columnas.length ? etiquetaDe(columnas, c.column) : c.column}`).join('; ');
    }
    case 'FOODS': {
      const motivos = campo?.dataType === 'FOODS' ? campo.reasons : [];
      return valor.foods.map((a) => (a.reason ? `${a.name.trim()} (${motivos.length ? etiquetaDe(motivos, a.reason) : a.reason})` : a.name.trim())).join(', ');
    }
    case 'TIMES': {
      const partes = campo?.dataType === 'TIMES' ? campo.parts : [];
      return valor.times.map((t) => `${partes.length ? etiquetaDe(partes, t.part) : t.part}: ${t.time}`).join(' · ');
    }
  }
}
