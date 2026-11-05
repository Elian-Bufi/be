/**
 * APK · los formularios V2 (WP-FORMULARIOS-DE-INICIO, DL-164): la lógica pura detrás de «Información» y de una
 * solicitud. `formulario-v2.test.ts` la prueba sin teléfono; la pantalla (`pantallas/formularios.tsx`) solo dibuja y
 * despacha.
 *
 * - **El borrador guarda lo que la persona tocó o escribió, tal cual.** Un número es el texto que escribió; un Sí o no
 *   tiene tres estados (sin elegir, Sí, No); una lista son renglones con un id local. Nada se interpreta hasta enviar.
 * - **Al enviar, lo vacío se omite** (09:1586-1587): un campo sin tocar, un renglón sin nada, una hora en blanco no
 *   viajan. Lo escrito que no se entiende (un número ilegible, una hora que no es una hora) se marca junto al campo y
 *   frena el envío: perderlo en silencio haría que un requerido parezca faltante.
 * - **Lo oculto no se envía** (DL-164 D-2): `sinRespuestasOcultas` saca lo que quedó detrás de una condición cerrada.
 * - **La validación es la del dominio** (`validarRespuestasV2`, la misma de la API) y cada problema vuelve a su campo
 *   con el mensaje de `MENSAJE_DE_PROBLEMA_V2`; un issue de la API sobre un renglón vuelve a ese renglón.
 * - **Ubicar, nunca calificar:** la bandeja agrupa por lo que falta hacer; no cuenta porcentajes ni mide a nadie.
 */
import {
  camposCorregidos,
  camposEnOrden,
  camposVisibles,
  COPY,
  COPY_FORMULARIOS,
  COPY_FORMULARIOS_V2,
  leerNumero,
  MENSAJE_DE_PROBLEMA_V2,
  motivoDeNumeroIlegible,
  obligatoriosSinResponder,
  resumenDeValor,
  sinRespuestasOcultas,
  validarRespuestasV2,
  type CampoDePlantillaV2,
  type CodigoDeProblemaV2,
  type DesenlaceDeEnvio,
  type ProblemaDeRespuestaV2,
  type RespuestaDeCampoV2Entrada,
  type RespuestaDeFormularioV2,
  type Resultado,
  type SeccionDePlantillaV2,
  type SolicitudAValidar,
  type SolicitudPropiaV2,
  type ValorDeRespuestaV2,
  type ValorDeSubcampo,
} from '@be/domain';

/** Textos propios de la APK para los formularios V2; los compartidos con el website están en `COPY_FORMULARIOS_V2`. */
export const TEXTOS_DE_FORMULARIO_V2 = {
  horaIlegible: 'Escribí la hora como 07:30.',
  horaEjemplo: '07:30',
  sinElegir: 'Sin elegir',
  renglones: (n: number, maximo: number) => `${n} de hasta ${maximo}`,
  hastaOpciones: (n: number) => (n === 1 ? 'Podés elegir 1.' : `Podés elegir hasta ${n}.`),
  elegiVarias: 'Podés elegir varias.',
  // DL-165 D-2: el «tocá de nuevo para soltarla» se fue; una pregunta opcional se suelta con «Quitar respuesta».
  unaPorFila: 'Elegí una opción por fila.',
  tocaLosQueApliquen: 'Tocá los que apliquen y sumá los que falten.',
  sumar: 'Sumar',
  quitar: 'Quitar',
  elegidos: 'Elegidos',
  sinSugeridos: 'Escribí los alimentos, de a uno.',
  nombreDelAlimento: 'Alimento',
  renglonVacio: 'Completá al menos un dato o quitá el renglón.',
  datoIlegible: 'Hay un dato que no se entiende. Revisá los campos marcados.',
  propuestaCambio: 'Lo que cargó tu profesional cambió desde que lo viste. Volvé a consultar y revisalo de nuevo.',
  // El 409 de FRI-08: la propuesta que se vio ya no es la pendiente (la cambiaron, la retiraron o ya se resolvió).
  propuestaCambioAntesDeDescartar: 'Lo que se había cargado cambió o ya no está: tu profesional lo modificó, lo retiró o ya se resolvió. Volvé a consultar antes de descartarlo.',
  // El 409 de FRI-04 sin `fromProposal`: apareció una propuesta que esta pantalla no vio. Nada se pisa en silencio.
  aparecioPropuesta:
    'Mientras completabas, tu profesional cargó respuestas para que las confirmes. Lo que escribiste no se envió. Volvé a consultar y revisá lo cargado: podés confirmarlo, corregirlo o descartarlo y responder vos.',
  volvimosAConsultar: 'Volvimos a consultar: hay respuestas cargadas para que las confirmes.',
  loEscritoSigue: 'Si las descartás, lo que escribiste sigue en el formulario.',
  // FR-01 · el borrador guardado en el teléfono (`borrador-de-formulario.ts`).
  recuperamosLoEscrito: 'Recuperamos lo que habías escrito: todavía no se envió.',
  siDescartasLoCargado: 'Si descartás lo cargado, lo que escribiste sigue en el formulario.',
  noSeGuardoEnElTelefono: 'No se pudo guardar en este teléfono. Si cerrás la app, se pierde lo que escribiste.',
  // Con la solicitud en pausa (el PDP dice que no se puede responder) lo cargado se puede ver y descartar, no confirmar.
  porAhoraNoSePuedeResponder: 'Por ahora no se puede responder: puede que el vínculo esté en pausa o que tus autorizaciones hayan cambiado.',
  revisarSinResponder: 'Podés ver lo que se cargó y, si no es correcto, descartarlo. Para confirmarlo o corregirlo hace falta que se pueda responder.',
  revisarCargado: 'Revisar lo cargado',
  cargadoPorEl: (profesional: string, fecha: string) => `${profesional} cargó tus respuestas el ${fecha}.`,
  revisar: 'Revisar',
  verMiRespuesta: 'Ver mi respuesta',
  rechazando: 'Descartando…',
  confirmando: 'Guardando…',
  loQueCargo: (profesional: string) => `Lo que cargó ${profesional}`,
  volverALoCargado: 'Volver a lo cargado',
  corrigiendo: 'Estás corrigiendo lo cargado: lo que cambies queda como tu respuesta al confirmar.',
  transcripcion: (profesional: string, cargado: string, confirmado: string) => `Cargado por ${profesional} el ${cargado} · confirmado por vos el ${confirmado}.`,
  corregisteAntes: (n: number) => (n === 0 ? 'Lo confirmaste tal cual.' : n === 1 ? 'Corregiste 1 respuesta antes de confirmar.' : `Corregiste ${n} respuestas antes de confirmar.`),
} as const;

// ─── El borrador ─────────────────────────────────────────────────────────────────────────────────

export type EleccionSiONo = '' | 'SI' | 'NO';

/**
 * Un renglón de una lista: un id local para dibujarlo y lo escrito o elegido en cada subcampo, como texto. Las varias
 * opciones de un subcampo (formato 3, DL-165 D-6) van como sus códigos separados por coma («lun,jue»): así el borrador
 * guardado en el teléfono (FR-01) sigue siendo de textos.
 */
export interface RenglonDeBorrador {
  readonly id: number;
  readonly valores: Readonly<Record<string, string>>;
}

/** Los códigos elegidos en un subcampo de varias opciones, desde su texto en el borrador. */
export const codigosDelSubvalor = (texto: string): string[] =>
  texto
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c !== '');

/** Suma o saca una opción de un subcampo de varias opciones, en el orden de sus opciones. */
export function alternarEnElSubvalor(texto: string, codigo: string, opciones: readonly { readonly code: string }[]): string {
  const elegidos = new Set(codigosDelSubvalor(texto));
  if (elegidos.has(codigo)) elegidos.delete(codigo);
  else elegidos.add(codigo);
  return opciones
    .map((o) => o.code)
    .filter((c) => elegidos.has(c))
    .join(',');
}

export interface AlimentoDeBorrador {
  readonly nombre: string;
  readonly motivo: string | null;
}

export type ValorDeBorrador =
  | { readonly tipo: 'TEXT'; readonly texto: string }
  | { readonly tipo: 'NUMBER'; readonly texto: string }
  | { readonly tipo: 'BOOLEAN'; readonly eleccion: EleccionSiONo }
  | { readonly tipo: 'CHOICE'; readonly opcion: string | null; readonly otro: string }
  | { readonly tipo: 'MULTI_CHOICE'; readonly opciones: readonly string[]; readonly otro: string }
  | { readonly tipo: 'LIST'; readonly renglones: readonly RenglonDeBorrador[] }
  /** Por fila, la columna elegida. */
  | { readonly tipo: 'MATRIX'; readonly celdas: Readonly<Record<string, string>> }
  | { readonly tipo: 'FOODS'; readonly alimentos: readonly AlimentoDeBorrador[] }
  /** Por parte, la hora como la escribió la persona. */
  | { readonly tipo: 'TIMES'; readonly horas: Readonly<Record<string, string>> };

export type Borrador = Readonly<Record<string, ValorDeBorrador>>;
export const BORRADOR_VACIO: Borrador = {};

export function valorVacio(tipo: CampoDePlantillaV2['dataType']): ValorDeBorrador {
  switch (tipo) {
    case 'TEXT':
      return { tipo: 'TEXT', texto: '' };
    case 'NUMBER':
      return { tipo: 'NUMBER', texto: '' };
    case 'BOOLEAN':
      return { tipo: 'BOOLEAN', eleccion: '' };
    case 'CHOICE':
      return { tipo: 'CHOICE', opcion: null, otro: '' };
    case 'MULTI_CHOICE':
      return { tipo: 'MULTI_CHOICE', opciones: [], otro: '' };
    case 'LIST':
      return { tipo: 'LIST', renglones: [] };
    case 'MATRIX':
      return { tipo: 'MATRIX', celdas: {} };
    case 'FOODS':
      return { tipo: 'FOODS', alimentos: [] };
    case 'TIMES':
      return { tipo: 'TIMES', horas: {} };
  }
}

/** Lo que el borrador tiene para un campo, o el valor vacío de su tipo (también si guardó algo de otro tipo). */
export function valorDe(b: Borrador, campo: CampoDePlantillaV2): ValorDeBorrador {
  const v = b[campo.fieldCode];
  return v && v.tipo === campo.dataType ? v : valorVacio(campo.dataType);
}

const vacio = (s: string) => s.trim() === '';
const normal = (s: string) => s.trim().toLocaleLowerCase('es-AR');
const mismoNombre = (a: string, b: string) => normal(a) === normal(b);

/** Si hay algo escrito o elegido en un valor del borrador. */
export function tieneAlgo(v: ValorDeBorrador): boolean {
  switch (v.tipo) {
    case 'TEXT':
    case 'NUMBER':
      return !vacio(v.texto);
    case 'BOOLEAN':
      return v.eleccion !== '';
    case 'CHOICE':
      return v.opcion !== null || !vacio(v.otro);
    case 'MULTI_CHOICE':
      return v.opciones.length > 0 || !vacio(v.otro);
    case 'LIST':
      return v.renglones.some((r) => Object.values(r.valores).some((x) => !vacio(x)));
    case 'MATRIX':
      return Object.values(v.celdas).some((c) => c !== '');
    case 'FOODS':
      return v.alimentos.length > 0;
    case 'TIMES':
      return Object.values(v.horas).some((h) => !vacio(h));
  }
}

/** Si hay algo que se perdería al salir: lo declara `useCambiosSinGuardar`. */
export const hayAlgoEscrito = (b: Borrador): boolean => Object.values(b).some(tieneAlgo);

export type EventoDeBorrador =
  /** Lo escrito en un texto o en un número: queda tal cual, y se interpreta recién al enviar. */
  | { readonly tipo: 'escribir'; readonly fieldCode: string; readonly como: 'TEXT' | 'NUMBER'; readonly texto: string }
  | { readonly tipo: 'elegir-si-o-no'; readonly fieldCode: string; readonly eleccion: EleccionSiONo }
  /** `null` suelta la opción elegida. */
  | { readonly tipo: 'elegir-opcion'; readonly fieldCode: string; readonly opcion: string | null }
  /** `exclusivas` («Ninguna») van solas; con `maximo` alcanzado, sumar otra no hace nada. */
  | { readonly tipo: 'alternar-opcion'; readonly fieldCode: string; readonly opcion: string; readonly exclusivas: readonly string[]; readonly maximo: number | null }
  | { readonly tipo: 'escribir-otro'; readonly fieldCode: string; readonly texto: string }
  | { readonly tipo: 'sumar-renglon'; readonly fieldCode: string; readonly maximo: number }
  | { readonly tipo: 'quitar-renglon'; readonly fieldCode: string; readonly id: number }
  | { readonly tipo: 'editar-subcampo'; readonly fieldCode: string; readonly id: number; readonly code: string; readonly valor: string }
  /** `null` suelta la columna de esa fila. */
  | { readonly tipo: 'elegir-celda'; readonly fieldCode: string; readonly fila: string; readonly columna: string | null }
  /** Un sugerido tocado: entra si no estaba, sale si estaba. */
  | { readonly tipo: 'alternar-alimento'; readonly fieldCode: string; readonly nombre: string; readonly maximo: number }
  | { readonly tipo: 'sumar-alimento'; readonly fieldCode: string; readonly nombre: string; readonly maximo: number }
  | { readonly tipo: 'quitar-alimento'; readonly fieldCode: string; readonly nombre: string }
  | { readonly tipo: 'motivo-de-alimento'; readonly fieldCode: string; readonly nombre: string; readonly motivo: string | null }
  | { readonly tipo: 'escribir-hora'; readonly fieldCode: string; readonly parte: string; readonly texto: string }
  /** DL-165 D-2 · «Quitar respuesta»: la pregunta vuelve a estar sin responder, como si no se hubiera tocado. */
  | { readonly tipo: 'quitar'; readonly fieldCode: string }
  /** Reemplaza todo el borrador: lo que cargó el profesional, o la respuesta vigente para corregirla. */
  | { readonly tipo: 'cargar'; readonly valores: Borrador }
  | { readonly tipo: 'limpiar' };

const con = (b: Borrador, fieldCode: string, v: ValorDeBorrador): Borrador => ({ ...b, [fieldCode]: v });

/** Lo que el borrador tiene para un campo, ya con el tipo que se le pide (o el vacío de ese tipo): para dibujarlo. */
export function valorComo<T extends ValorDeBorrador['tipo']>(b: Borrador, fieldCode: string, tipo: T): Extract<ValorDeBorrador, { tipo: T }> {
  const v = b[fieldCode];
  return (v && v.tipo === tipo ? v : valorVacio(tipo)) as Extract<ValorDeBorrador, { tipo: T }>;
}
const actual = valorComo;

/** Si dos borradores dicen lo mismo: lo precargado sin tocar no es algo «sin guardar». */
export const mismoBorrador = (a: Borrador, b: Borrador): boolean => JSON.stringify(a) === JSON.stringify(b);

export function reducirBorrador(b: Borrador, ev: EventoDeBorrador): Borrador {
  switch (ev.tipo) {
    case 'escribir':
      return con(b, ev.fieldCode, { tipo: ev.como, texto: ev.texto });
    case 'elegir-si-o-no':
      return con(b, ev.fieldCode, { tipo: 'BOOLEAN', eleccion: ev.eleccion });
    case 'elegir-opcion':
      return con(b, ev.fieldCode, { ...actual(b, ev.fieldCode, 'CHOICE'), opcion: ev.opcion });
    case 'alternar-opcion': {
      const v = actual(b, ev.fieldCode, 'MULTI_CHOICE');
      if (v.opciones.includes(ev.opcion)) return con(b, ev.fieldCode, { ...v, opciones: v.opciones.filter((o) => o !== ev.opcion) });
      // Una exclusiva va sola; sumar una común saca las exclusivas que hubiera.
      if (ev.exclusivas.includes(ev.opcion)) return con(b, ev.fieldCode, { ...v, opciones: [ev.opcion] });
      const sinExclusivas = v.opciones.filter((o) => !ev.exclusivas.includes(o));
      if (ev.maximo !== null && sinExclusivas.length >= ev.maximo) return b;
      return con(b, ev.fieldCode, { ...v, opciones: [...sinExclusivas, ev.opcion] });
    }
    case 'escribir-otro': {
      const v = b[ev.fieldCode];
      if (v?.tipo === 'MULTI_CHOICE') return con(b, ev.fieldCode, { ...v, otro: ev.texto });
      return con(b, ev.fieldCode, { ...actual(b, ev.fieldCode, 'CHOICE'), otro: ev.texto });
    }
    case 'sumar-renglon': {
      const v = actual(b, ev.fieldCode, 'LIST');
      if (v.renglones.length >= ev.maximo) return b;
      const id = v.renglones.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      return con(b, ev.fieldCode, { tipo: 'LIST', renglones: [...v.renglones, { id, valores: {} }] });
    }
    case 'quitar-renglon': {
      const v = actual(b, ev.fieldCode, 'LIST');
      return con(b, ev.fieldCode, { tipo: 'LIST', renglones: v.renglones.filter((r) => r.id !== ev.id) });
    }
    case 'editar-subcampo': {
      const v = actual(b, ev.fieldCode, 'LIST');
      return con(b, ev.fieldCode, { tipo: 'LIST', renglones: v.renglones.map((r) => (r.id === ev.id ? { ...r, valores: { ...r.valores, [ev.code]: ev.valor } } : r)) });
    }
    case 'elegir-celda': {
      const v = actual(b, ev.fieldCode, 'MATRIX');
      const { [ev.fila]: _, ...resto } = v.celdas;
      return con(b, ev.fieldCode, { tipo: 'MATRIX', celdas: ev.columna === null ? resto : { ...resto, [ev.fila]: ev.columna } });
    }
    case 'alternar-alimento': {
      const v = actual(b, ev.fieldCode, 'FOODS');
      if (v.alimentos.some((a) => mismoNombre(a.nombre, ev.nombre))) return con(b, ev.fieldCode, { tipo: 'FOODS', alimentos: v.alimentos.filter((a) => !mismoNombre(a.nombre, ev.nombre)) });
      if (v.alimentos.length >= ev.maximo) return b;
      return con(b, ev.fieldCode, { tipo: 'FOODS', alimentos: [...v.alimentos, { nombre: ev.nombre, motivo: null }] });
    }
    case 'sumar-alimento': {
      const v = actual(b, ev.fieldCode, 'FOODS');
      const nombre = ev.nombre.trim();
      // Vacío o repetido (sin distinguir mayúsculas): no entra dos veces, que la API lo rechazaría.
      if (nombre === '' || v.alimentos.some((a) => mismoNombre(a.nombre, nombre)) || v.alimentos.length >= ev.maximo) return b;
      return con(b, ev.fieldCode, { tipo: 'FOODS', alimentos: [...v.alimentos, { nombre, motivo: null }] });
    }
    case 'quitar-alimento': {
      const v = actual(b, ev.fieldCode, 'FOODS');
      return con(b, ev.fieldCode, { tipo: 'FOODS', alimentos: v.alimentos.filter((a) => !mismoNombre(a.nombre, ev.nombre)) });
    }
    case 'motivo-de-alimento': {
      const v = actual(b, ev.fieldCode, 'FOODS');
      return con(b, ev.fieldCode, { tipo: 'FOODS', alimentos: v.alimentos.map((a) => (mismoNombre(a.nombre, ev.nombre) ? { ...a, motivo: ev.motivo } : a)) });
    }
    case 'escribir-hora': {
      const v = actual(b, ev.fieldCode, 'TIMES');
      return con(b, ev.fieldCode, { tipo: 'TIMES', horas: { ...v.horas, [ev.parte]: ev.texto } });
    }
    case 'quitar': {
      if (!(ev.fieldCode in b)) return b;
      const { [ev.fieldCode]: _, ...resto } = b;
      return resto;
    }
    case 'cargar':
      return ev.valores;
    case 'limpiar':
      return BORRADOR_VACIO;
  }
}

// ─── De una respuesta al borrador (lo cargado por el profesional, o lo vigente para corregir) ────

/** Un número como texto para el campo: con coma decimal y sin punto de miles, que `leerNumero` rechaza como ambiguo. */
export const textoDeNumero = (n: number): string => String(n).replace('.', ',');

const textoDeSubvalor = (v: ValorDeSubcampo): string => (typeof v === 'boolean' ? (v ? 'SI' : 'NO') : typeof v === 'number' ? textoDeNumero(v) : Array.isArray(v) ? v.join(',') : v);

export function valorDeBorradorDe(valor: ValorDeRespuestaV2): ValorDeBorrador {
  switch (valor.type) {
    case 'TEXT':
      return { tipo: 'TEXT', texto: valor.text };
    case 'NUMBER':
      return { tipo: 'NUMBER', texto: textoDeNumero(valor.number) };
    case 'BOOLEAN':
      return { tipo: 'BOOLEAN', eleccion: valor.yes ? 'SI' : 'NO' };
    case 'CHOICE':
      return { tipo: 'CHOICE', opcion: valor.option, otro: valor.otherText ?? '' };
    case 'MULTI_CHOICE':
      return { tipo: 'MULTI_CHOICE', opciones: [...valor.options], otro: valor.otherText ?? '' };
    case 'LIST':
      return { tipo: 'LIST', renglones: valor.items.map((renglon, i) => ({ id: i + 1, valores: Object.fromEntries(Object.entries(renglon).map(([k, v]) => [k, textoDeSubvalor(v)])) })) };
    case 'MATRIX':
      return { tipo: 'MATRIX', celdas: Object.fromEntries(valor.cells.map((c) => [c.row, c.column])) };
    case 'FOODS':
      return { tipo: 'FOODS', alimentos: valor.foods.map((a) => ({ nombre: a.name, motivo: a.reason })) };
    case 'TIMES':
      return { tipo: 'TIMES', horas: Object.fromEntries(valor.times.map((t) => [t.part, t.time])) };
  }
}

/**
 * Las respuestas que valen hoy de una respuesta guardada: la corrección vigente o, si no hay, la original. Es lo que
 * se precarga para corregir: la persona cambia lo que cambió y la historia queda (09:1618).
 */
export function respuestasVigentes(response: Pick<RespuestaDeFormularioV2, 'original' | 'rectifications' | 'effectiveView'>): readonly RespuestaDeCampoV2Entrada[] {
  if (response.effectiveView.kind === 'RECTIFIED') {
    const id = response.effectiveView.rectificationId;
    const vigente = response.rectifications.find((c) => c.rectificationId === id);
    if (vigente) return vigente.answers;
  }
  return response.original.answers;
}

/** El borrador con estas respuestas precargadas, para corregirlas tocando. Lo que no está en la plantilla se ignora. */
export function borradorDeRespuestas(secciones: readonly SeccionDePlantillaV2[], respuestas: readonly RespuestaDeCampoV2Entrada[]): Borrador {
  const campos = new Map(camposEnOrden(secciones).map((c) => [c.fieldCode, c] as const));
  const b: Record<string, ValorDeBorrador> = {};
  for (const r of respuestas) {
    const campo = campos.get(r.fieldCode);
    if (campo && campo.dataType === r.answer.type) b[r.fieldCode] = valorDeBorradorDe(r.answer);
  }
  return b;
}

// ─── Del borrador a las respuestas ──────────────────────────────────────────────────────────────

/** La clave de un subcampo de un renglón, para marcar su error junto a él. */
export const claveDeSubcampo = (fieldCode: string, id: number, code: string): string => `${fieldCode}/${id}/${code}`;
/** La clave de una parte de un horario. */
export const claveDeParte = (fieldCode: string, parte: string): string => `${fieldCode}/${parte}`;
const campoDeLaClave = (clave: string): string => clave.split('/')[0]!;

/** Las preguntas que tienen un aviso, sin repetir: de un campo, de un renglón o de una parte de un horario (DL-165 D-1). */
export const camposDeLosErrores = (errores: Readonly<Record<string, string>>): string[] => [...new Set(Object.keys(errores).map(campoDeLaClave))];

/**
 * Una hora escrita como la escribe la gente («7:30», «07.30», «0730», «7h30») en `HH:MM`, o `null` si no es una hora.
 */
export function horaNormalizada(texto: string): string | null {
  const m = /^\s*(\d{1,2})\s*[:.,hH]?\s*(\d{2})\s*$/.exec(texto);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

export interface RespuestasArmadas {
  readonly respuestas: readonly RespuestaDeCampoV2Entrada[];
  /** Lo escrito que no se entiende, por clave de campo, subcampo o parte: se marca y no se envía. */
  readonly errores: Readonly<Record<string, string>>;
  /** Por cada lista enviada, el id del renglón que ocupa cada posición de `items`: un issue de la API vuelve a su renglón. */
  readonly idsDeRenglones: Readonly<Record<string, readonly number[]>>;
}

function valorDeRespuesta(campo: CampoDePlantillaV2, v: ValorDeBorrador, errores: Record<string, string>, ids: Record<string, number[]>): ValorDeRespuestaV2 | null {
  if (v.tipo !== campo.dataType) return null;
  switch (campo.dataType) {
    case 'TEXT': {
      const texto = (v as Extract<ValorDeBorrador, { tipo: 'TEXT' }>).texto.trim();
      return texto === '' ? null : { type: 'TEXT', text: texto };
    }
    case 'NUMBER': {
      const crudo = (v as Extract<ValorDeBorrador, { tipo: 'NUMBER' }>).texto.trim();
      if (crudo === '') return null;
      const n = leerNumero(crudo);
      if (n === null) {
        errores[campo.fieldCode] = motivoDeNumeroIlegible(crudo);
        return null;
      }
      return { type: 'NUMBER', number: n, unit: campo.unit };
    }
    case 'BOOLEAN': {
      const e = (v as Extract<ValorDeBorrador, { tipo: 'BOOLEAN' }>).eleccion;
      return e === '' ? null : { type: 'BOOLEAN', yes: e === 'SI' };
    }
    case 'CHOICE': {
      const c = v as Extract<ValorDeBorrador, { tipo: 'CHOICE' }>;
      if (c.opcion === null) return null;
      const otro = c.opcion === campo.otherOptionCode ? c.otro.trim() : '';
      return { type: 'CHOICE', option: c.opcion, otherText: otro === '' ? null : otro };
    }
    case 'MULTI_CHOICE': {
      const m = v as Extract<ValorDeBorrador, { tipo: 'MULTI_CHOICE' }>;
      if (m.opciones.length === 0) return null;
      const otro = campo.otherOptionCode !== null && m.opciones.includes(campo.otherOptionCode) ? m.otro.trim() : '';
      return { type: 'MULTI_CHOICE', options: [...m.opciones], otherText: otro === '' ? null : otro };
    }
    case 'LIST': {
      const l = v as Extract<ValorDeBorrador, { tipo: 'LIST' }>;
      const items: Record<string, ValorDeSubcampo>[] = [];
      const idsEnviados: number[] = [];
      for (const renglon of l.renglones) {
        const item: Record<string, ValorDeSubcampo> = {};
        for (const sub of campo.itemFields) {
          const crudo = (renglon.valores[sub.code] ?? '').trim();
          if (crudo === '') continue;
          if (sub.dataType === 'MULTI_CHOICE') {
            // Formato 3 (DL-165 D-6): las opciones elegidas, en el orden de la pregunta.
            const elegidos = new Set(codigosDelSubvalor(crudo));
            const codigos = sub.options.map((o) => o.code).filter((c) => elegidos.has(c));
            if (codigos.length > 0) item[sub.code] = codigos;
          } else if (sub.dataType === 'NUMBER') {
            const n = leerNumero(crudo);
            if (n === null) errores[claveDeSubcampo(campo.fieldCode, renglon.id, sub.code)] = motivoDeNumeroIlegible(crudo);
            else item[sub.code] = n;
          } else if (sub.dataType === 'BOOLEAN') {
            if (crudo === 'SI' || crudo === 'NO') item[sub.code] = crudo === 'SI';
          } else item[sub.code] = crudo;
        }
        // Un renglón sin nada no viaja: sumarlo y no completarlo es como no haberlo sumado.
        if (Object.keys(item).length === 0) continue;
        items.push(item);
        idsEnviados.push(renglon.id);
      }
      if (items.length === 0) return null;
      ids[campo.fieldCode] = idsEnviados;
      return { type: 'LIST', items };
    }
    case 'MATRIX': {
      const t = v as Extract<ValorDeBorrador, { tipo: 'MATRIX' }>;
      const cells = campo.rows.filter((f) => (t.celdas[f.code] ?? '') !== '').map((f) => ({ row: f.code, column: t.celdas[f.code]! }));
      return cells.length === 0 ? null : { type: 'MATRIX', cells };
    }
    case 'FOODS': {
      const a = v as Extract<ValorDeBorrador, { tipo: 'FOODS' }>;
      const foods = a.alimentos.filter((x) => !vacio(x.nombre)).map((x) => ({ name: x.nombre.trim(), reason: campo.reasons.length ? x.motivo : null }));
      return foods.length === 0 ? null : { type: 'FOODS', foods };
    }
    case 'TIMES': {
      const h = v as Extract<ValorDeBorrador, { tipo: 'TIMES' }>;
      const times: { part: string; time: string }[] = [];
      for (const parte of campo.parts) {
        const crudo = (h.horas[parte.code] ?? '').trim();
        if (crudo === '') continue;
        const hora = horaNormalizada(crudo);
        if (hora === null) errores[claveDeParte(campo.fieldCode, parte.code)] = TEXTOS_DE_FORMULARIO_V2.horaIlegible;
        else times.push({ part: parte.code, time: hora });
      }
      return times.length === 0 ? null : { type: 'TIMES', times };
    }
  }
}

/**
 * Las respuestas que viajan: solo los campos pedidos, en el orden del formulario, sin lo vacío y sin lo que quedó
 * oculto por una condición. Lo escrito que no se entiende queda en `errores` (solo de campos visibles) y no viaja.
 */
export function armarRespuestas(secciones: readonly SeccionDePlantillaV2[], solicitud: SolicitudAValidar, b: Borrador): RespuestasArmadas {
  const errores: Record<string, string> = {};
  const ids: Record<string, number[]> = {};
  const pedidos = new Set(solicitud.requestedFieldCodes);
  const todas: RespuestaDeCampoV2Entrada[] = [];
  for (const campo of camposEnOrden(secciones)) {
    if (!pedidos.has(campo.fieldCode)) continue;
    const answer = valorDeRespuesta(campo, valorDe(b, campo), errores, ids);
    if (answer) todas.push({ fieldCode: campo.fieldCode, answer });
  }
  const respuestas = sinRespuestasOcultas(secciones, todas);
  const visibles = camposVisibles(secciones, respuestas);
  // Un error de un campo que quedó oculto no frena nada: la persona no lo ve.
  const erroresVisibles = Object.fromEntries(Object.entries(errores).filter(([clave]) => visibles.has(campoDeLaClave(clave))));
  return { respuestas, errores: erroresVisibles, idsDeRenglones: ids };
}

/** Los campos pedidos que se ven con este borrador, en orden: lo que la pantalla dibuja. */
export function camposQueSeVen(secciones: readonly SeccionDePlantillaV2[], solicitud: SolicitudAValidar, b: Borrador): Set<string> {
  return camposVisibles(secciones, armarRespuestas(secciones, solicitud, b).respuestas);
}

// ─── Problemas, por campo ───────────────────────────────────────────────────────────────────────

const mensajeDe = (code: string): string => (MENSAJE_DE_PROBLEMA_V2 as Readonly<Record<string, string>>)[code] ?? COPY_FORMULARIOS.respuestaNoAceptada;

/** La clave de pantalla de un problema: el renglón, si el `path` apunta a uno (`answers[2].answer.items[1].comida`). */
function claveDelProblema(p: Pick<ProblemaDeRespuestaV2, 'path' | 'fieldCode'>, idsDeRenglones: Readonly<Record<string, readonly number[]>>): string {
  const m = /\.items\[(\d+)\]\.([a-z0-9_]+)$/.exec(p.path);
  if (!m) return p.fieldCode;
  const id = idsDeRenglones[p.fieldCode]?.[Number(m[1])];
  return id === undefined ? p.fieldCode : claveDeSubcampo(p.fieldCode, id, m[2]!);
}

/** Un mensaje por campo (o renglón), con el primero que llega; y una línea por campo con su rótulo, para el resumen. */
export function erroresDeProblemas(
  problemas: readonly Pick<ProblemaDeRespuestaV2, 'code' | 'path' | 'fieldCode'>[],
  campos: readonly CampoDePlantillaV2[],
  idsDeRenglones: Readonly<Record<string, readonly number[]>>,
): { readonly errores: Readonly<Record<string, string>>; readonly lineas: readonly string[] } {
  const errores: Record<string, string> = {};
  const lineas: string[] = [];
  const nombrados = new Set<string>();
  for (const p of problemas) {
    const clave = claveDelProblema(p, idsDeRenglones);
    if (!(clave in errores)) errores[clave] = mensajeDe(p.code);
    if (nombrados.has(p.fieldCode)) continue;
    nombrados.add(p.fieldCode);
    const campo = campos.find((c) => c.fieldCode === p.fieldCode);
    lineas.push(`${campo?.label ?? p.fieldCode}: ${mensajeDe(p.code)}`);
  }
  return { errores, lineas };
}

/** Los issues del `422 FORM_RESPONSE_INVALID` que la APK reconoce: `{ code, path, fieldCode }`. Lo demás se ignora. */
export function problemasReconocidosV2(issues: unknown): Pick<ProblemaDeRespuestaV2, 'code' | 'path' | 'fieldCode'>[] {
  if (!Array.isArray(issues)) return [];
  const reconocidos: Pick<ProblemaDeRespuestaV2, 'code' | 'path' | 'fieldCode'>[] = [];
  for (const issue of issues as readonly unknown[]) {
    if (typeof issue !== 'object' || issue === null) continue;
    const { code, path, fieldCode } = issue as { code?: unknown; path?: unknown; fieldCode?: unknown };
    if (typeof code === 'string' && typeof path === 'string' && typeof fieldCode === 'string') reconocidos.push({ code: code as CodigoDeProblemaV2, path, fieldCode });
  }
  return reconocidos;
}

/**
 * Lo que la pantalla revisa antes de enviar, con las reglas del dominio: lo ilegible, los problemas de cada valor y
 * los requeridos que se ven y faltan. `null` si no hay nada que corregir.
 */
export function problemasAntesDeEnviar(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: SolicitudAValidar,
  armadas: RespuestasArmadas,
): { readonly titulo: string; readonly errores: Readonly<Record<string, string>>; readonly lineas: readonly string[] } | null {
  if (Object.keys(armadas.errores).length > 0) return { titulo: TEXTOS_DE_FORMULARIO_V2.datoIlegible, errores: armadas.errores, lineas: [] };
  const campos = camposEnOrden(secciones);
  const problemas = validarRespuestasV2(secciones, solicitud, armadas.respuestas);
  if (problemas.length === 0) return null;
  const { errores, lineas } = erroresDeProblemas(problemas, campos, armadas.idsDeRenglones);
  const faltan = obligatoriosSinResponder(secciones, solicitud, armadas.respuestas);
  // Si todo lo que falta son requeridos sin responder, se dice eso, como en los formularios de P0.
  const titulo = faltan.length === problemas.length ? COPY_FORMULARIOS.faltaRequerido : COPY.resumenDeErrores(new Set(problemas.map((p) => p.fieldCode)).size);
  return { titulo, errores, lineas };
}

/**
 * Qué hacer con un envío V2 que la API rechazó: un `422 FORM_RESPONSE_INVALID` vuelve a cada campo con su mensaje; un
 * `409 VERSION_CONFLICT` de API-FRI-04 dice qué pasó con lo cargado: al confirmarlo, que eso cambió; al responder sin
 * haberlo visto, que el profesional cargó algo mientras la persona completaba (la API no pisa nada en silencio). En los
 * dos casos el envío queda suspendido hasta volver a leer, y leer trae la propuesta para revisarla. El 409 de una
 * corrección (API-FRI-05) y lo demás lo decide `desenlaceDeEnvio` o `falloDe`.
 */
export function rechazoV2(
  r: Resultado<unknown>,
  campos: readonly CampoDePlantillaV2[],
  armadas: Pick<RespuestasArmadas, 'idsDeRenglones'>,
  opciones: { readonly desdePropuesta: boolean; readonly esCorreccion: boolean },
): DesenlaceDeEnvio | null {
  if (r.ok || r.tipo !== 'API') return null;
  if (r.codigo === 'FORM_RESPONSE_INVALID') {
    const problemas = problemasReconocidosV2(r.issues);
    if (problemas.length === 0) return { tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada };
    const { errores, lineas } = erroresDeProblemas(problemas, campos, armadas.idsDeRenglones);
    return { tipo: 'por-campo', errores, lineas, resumen: COPY.resumenDeErrores(new Set(problemas.map((p) => p.fieldCode)).size) };
  }
  if (r.codigo === 'VERSION_CONFLICT' && !opciones.esCorreccion) {
    return { tipo: 'version-vieja', mensaje: opciones.desdePropuesta ? TEXTOS_DE_FORMULARIO_V2.propuestaCambio : TEXTOS_DE_FORMULARIO_V2.aparecioPropuesta, acciones: ['cargar', 'volver'] };
  }
  return null;
}

// ─── La bandeja ─────────────────────────────────────────────────────────────────────────────────

export interface GruposDeLaBandeja {
  /** Pendientes con algo cargado por el profesional que espera confirmación. */
  readonly paraConfirmar: readonly SolicitudPropiaV2[];
  readonly paraResponder: readonly SolicitudPropiaV2[];
  readonly respondidos: readonly SolicitudPropiaV2[];
}

/** Tres grupos por lo que falta hacer, en el orden en que llegaron. Nada se cuenta ni se mide. */
export function gruposDeLaBandeja(solicitudes: readonly SolicitudPropiaV2[]): GruposDeLaBandeja {
  return {
    paraConfirmar: solicitudes.filter((s) => s.status === 'PENDING' && s.pendingProposal !== null),
    paraResponder: solicitudes.filter((s) => s.status === 'PENDING' && s.pendingProposal === null),
    respondidos: solicitudes.filter((s) => s.status === 'RESPONDED'),
  };
}

// ─── Leer respuestas en palabras: la revisión de lo cargado y la respuesta guardada ─────────────

export interface LineaDeRespuesta {
  readonly fieldCode: string;
  readonly etiqueta: string;
  /** `null`: la pregunta se pidió y se ve, pero no tiene respuesta. */
  readonly valor: string | null;
}

export interface SeccionEnPalabras {
  readonly sectionCode: string;
  readonly titulo: string;
  readonly lineas: readonly LineaDeRespuesta[];
}

/**
 * Las respuestas por sección, en palabras, con las etiquetas de la plantilla y nunca los códigos. Solo los campos
 * pedidos que se ven con esas respuestas; los que no tienen respuesta van con `valor: null` («Sin responder»).
 */
export function seccionesEnPalabras(secciones: readonly SeccionDePlantillaV2[], solicitud: SolicitudAValidar, respuestas: readonly RespuestaDeCampoV2Entrada[]): SeccionEnPalabras[] {
  const pedidos = new Set(solicitud.requestedFieldCodes);
  const visibles = camposVisibles(secciones, respuestas);
  const porCampo = new Map(respuestas.map((r) => [r.fieldCode, r.answer] as const));
  return secciones
    .map((s) => ({
      sectionCode: s.sectionCode,
      titulo: s.title,
      lineas: s.fields
        .filter((c) => pedidos.has(c.fieldCode) && visibles.has(c.fieldCode))
        .map((c) => {
          const valor = porCampo.get(c.fieldCode);
          return { fieldCode: c.fieldCode, etiqueta: c.label, valor: valor ? resumenDeValor(c, valor) : null };
        }),
    }))
    .filter((s) => s.lineas.length > 0);
}

/** Cuántas respuestas cambió la persona respecto de lo cargado, para decirlo al confirmar (DL-164 D-4). */
export function cuantasCorrigio(secciones: readonly SeccionDePlantillaV2[], propuestas: readonly RespuestaDeCampoV2Entrada[], confirmadas: readonly RespuestaDeCampoV2Entrada[]): number {
  return camposCorregidos(secciones, propuestas, confirmadas).length;
}

/** El rótulo de una pregunta: su etiqueta y, si no es requerida, «(Opcional)», como en los formularios de P0. */
export function rotuloDe(campo: Pick<CampoDePlantillaV2, 'label' | 'fieldCode'>, solicitud: SolicitudAValidar): string {
  return solicitud.requiredFieldCodes.includes(campo.fieldCode) ? campo.label : `${campo.label} (${COPY_FORMULARIOS_V2.opcional})`;
}
