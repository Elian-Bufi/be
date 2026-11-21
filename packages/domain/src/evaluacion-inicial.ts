/**
 * WP-EVALUACION-INICIAL-2 (DEUDA_LEGAJO DL-189; pedido de Dirección del 2026-11-21) · la evaluación inicial como pantallazo
 * del caso, la parte pura. La comparten el website y las pruebas; la API no la necesita: la forma de la evaluación no cambia.
 *
 * - **RP-15 · lo crítico primero:** `CAMPOS_CRITICOS_POR_PLANTILLA`, por clave de plantilla, y `camposCriticos`, los que
 *   cuentan en una solicitud (pedidos y visibles con lo cargado). Los elige el dominio, no el profesional.
 * - **RP-12 · lo que necesita el cálculo:** edad, sexo, peso, talla y nivel de actividad, cada uno con su origen y su fecha
 *   (`loQueNecesitaElCalculo`). Si hay un medido y un declarado, vale el medido y el declarado queda al lado. Lo que el
 *   profesional cambia pasa a «Cargado por vos».
 * - **Lo que se registra** (`entradasDelCalculo`): un dato por renglón con su fuente (la toma, observado; lo demás,
 *   informado) y su procedencia en palabras, para `evidenceReferences`. La evaluación no cambia de forma (DL-048).
 * - **El punto de unión con el calculador** (`datosDelCalculoEnLaEvaluacion`, EI-D15): de una evaluación registrada, los
 *   datos del cálculo con su fuente, también de las anteriores que usaron «Peso» y «Talla».
 * - **RP-16 · la corrección** (`correccionesDeLaPersona`): lo que la persona cambió de lo que cargó el profesional, con el
 *   antes solo si quedó en la evaluación (EI-D12: al confirmar, la propuesta se borra, DL-164 D-6).
 *
 * Ubica, no califica: ningún texto juzga un dato.
 */
import type { RespuestaDeCampoV2Entrada, SeccionDePlantillaV2, ValorDeRespuestaV2 } from './contratos-formularios-v2';
import { TOPES_DEL_CALCULADOR, type SexoDelCalculo } from './contratos-objetivo-y-calculador';
import { CLAVE_DEL_FORMULARIO_DE_HABITOS, CONTEXTO_DE_ENTRENAMIENTO, CONTEXTO_DE_NUTRICION } from './formularios';
import { camposEnOrden, camposVisibles } from './formularios-v2';
import { leerNumero, numero } from './formato-numeros';
import { traeLaParteDeHabitos } from './habitos-de-la-persona';

/** La fuente de un dato de la evaluación (REG-06-109; `FuenteDeDatoSchema` de los contratos de Nutrición). */
type FuenteDeDato = 'REPORTED' | 'OBSERVED' | 'CALCULATED';

// ─── RP-15 · los campos críticos ────────────────────────────────────────────────────────────────

/**
 * Lo que el objetivo y el plan necesitan saber primero, por clave de plantilla y en el orden del formulario (EI-D10, a
 * ratificar). Un código que una versión no tiene no se busca: la lista sirve para las versiones viejas y las nuevas.
 */
export const CAMPOS_CRITICOS_POR_PLANTILLA: Readonly<Record<string, readonly string[]>> = {
  // «Cómo comés hoy»: lo que arma el plan (las comidas, la jornada), lo que lo acota (lo que no come, alergias,
  // intolerancias, estilo) y lo que condiciona el objetivo (condiciones, medicación, peso reciente, embarazo, conducta
  // alimentaria, lo que busca).
  [CONTEXTO_DE_NUTRICION.clavePlantilla]: [
    'nut_jornada',
    'nut_momentos',
    'nut_alimentos_no',
    'nut_alergias',
    'nut_alergias_cuales',
    'nut_intolerancias',
    'nut_estilo',
    'condiciones_declaradas',
    'medicacion_relevante',
    'nut_peso_reciente',
    'nut_embarazo',
    'nut_tca',
    'nut_objetivo',
  ],
  // «Antes de entrenar»: la salud antes de entrenar y el dolor de hoy (si se empieza y con qué cuidado), y lo que arma el
  // plan (experiencia, lo que busca, días, tiempo y lugar).
  [CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla]: [
    'trn_salud_corazon',
    'trn_salud_dolor_de_pecho',
    'trn_salud_mareos',
    'trn_salud_cronica',
    'medicacion_relevante',
    'trn_salud_huesos',
    'trn_salud_supervision',
    'trn_embarazo',
    'trn_apto_medico',
    'dolor_o_lesiones',
    'trn_zonas',
    'trn_experiencia_en_fuerza',
    'trn_objetivo_principal',
    'trn_dias_y_horario',
    'trn_dias_por_semana',
    'trn_minutos_por_sesion',
    'trn_lugar_y_equipamiento',
  ],
  // «Tus hábitos»: el nivel de actividad entra en el cálculo; los horarios, el sueño y el deporte ubican comidas y sesiones.
  [CLAVE_DEL_FORMULARIO_DE_HABITOS]: ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes'],
};

/**
 * Los críticos que cuentan en una solicitud, en el orden del formulario: los de su plantilla (y, si la versión trae la parte
 * «Tus hábitos», también los de hábitos), pedidos en la solicitud y visibles con lo cargado.
 */
export function camposCriticos(
  clavePlantilla: string,
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: { readonly requestedFieldCodes: readonly string[] },
  respuestas: readonly RespuestaDeCampoV2Entrada[] = [],
): string[] {
  const propios = CAMPOS_CRITICOS_POR_PLANTILLA[clavePlantilla] ?? [];
  const deHabitos = clavePlantilla !== CLAVE_DEL_FORMULARIO_DE_HABITOS && traeLaParteDeHabitos(secciones) ? (CAMPOS_CRITICOS_POR_PLANTILLA[CLAVE_DEL_FORMULARIO_DE_HABITOS] ?? []) : [];
  const criticos = new Set([...propios, ...deHabitos]);
  const pedidos = new Set(solicitud.requestedFieldCodes);
  const visibles = camposVisibles(secciones, respuestas);
  return camposEnOrden(secciones)
    .map((c) => c.fieldCode)
    .filter((c) => criticos.has(c) && pedidos.has(c) && visibles.has(c));
}

// ─── RP-12 · lo que necesita el cálculo ─────────────────────────────────────────────────────────

export const DATOS_DE_LA_EVALUACION_INICIAL = ['edad', 'sexo', 'peso', 'talla', 'actividad'] as const;
export type DatoDeLaEvaluacionInicial = (typeof DATOS_DE_LA_EVALUACION_INICIAL)[number];

/**
 * Cómo se llama cada dato en la evaluación (el `concept` de su renglón) y su unidad. «Peso» y «Talla» son los mismos
 * conceptos de los atajos de antes (`CONCEPTOS_FRECUENTES_DE_NUTRICION`): las evaluaciones viejas se leen igual.
 */
export const CONCEPTO_DEL_DATO: Readonly<Record<DatoDeLaEvaluacionInicial, { readonly concepto: string; readonly unidad: string | null; readonly numerico: boolean }>> = {
  edad: { concepto: 'Edad', unidad: 'años', numerico: true },
  sexo: { concepto: 'Sexo', unidad: null, numerico: false },
  peso: { concepto: 'Peso', unidad: 'kg', numerico: true },
  talla: { concepto: 'Talla', unidad: 'cm', numerico: true },
  actividad: { concepto: 'Nivel de actividad', unidad: null, numerico: false },
};

/**
 * Las preguntas de los formularios que alimentan cada dato (EI-D03). Hoy solo el nivel de actividad: ningún formulario
 * pregunta el peso ni la talla (DL-164: «el peso en sí lo vemos en la toma de medidas»), y el perfil propio no tiene la
 * edad ni el sexo (DL-169). Sumar acá el código de una pregunta nueva activa «vale el medido y el declarado al lado».
 */
export const CAMPOS_DEL_CALCULO: Readonly<Record<DatoDeLaEvaluacionInicial, readonly string[]>> = {
  edad: [],
  sexo: [],
  peso: [],
  talla: [],
  actividad: ['nivel_de_actividad'],
};

/** El sexo con el que se elige la ecuación (DL-186: lo elige el profesional), con su texto. */
export const SEXOS_DE_LA_EVALUACION: readonly { readonly valor: SexoDelCalculo; readonly texto: string }[] = [
  { valor: 'FEMALE', texto: 'Femenino' },
  { valor: 'MALE', texto: 'Masculino' },
];

/** De dónde sale un dato. Las fechas son instantes o días (`AAAA-MM-DD`) de la API. */
export type OrigenDelDato =
  | { readonly tipo: 'TOMA'; readonly fecha: string }
  | { readonly tipo: 'RESPONDIDO'; readonly fecha: string; readonly formulario: string }
  | { readonly tipo: 'CONFIRMADO'; readonly fecha: string; readonly formulario: string }
  | { readonly tipo: 'CORREGIDO'; readonly fecha: string; readonly formulario: string }
  | { readonly tipo: 'CARGADO_SIN_CONFIRMAR'; readonly fecha: string; readonly formulario: string }
  | { readonly tipo: 'COMPARTIDO'; readonly fecha: string }
  | { readonly tipo: 'CARGADO_POR_VOS' };

/** Un valor posible para un dato, con su origen: de un formulario, de lo cargado con la persona o de sus hábitos. */
export interface ValorCandidato {
  readonly dato: DatoDeLaEvaluacionInicial;
  /** Lo que se registra: un número en los numéricos; el texto en palabras en los demás. */
  readonly valor: number | string;
  readonly texto: string;
  readonly origen: Exclude<OrigenDelDato, { readonly tipo: 'TOMA' | 'CARGADO_POR_VOS' }>;
}

/** Lo que trae una fuente de respuestas: cada pregunta respondida, con el valor y en palabras. */
export interface FuenteDeRespuestas {
  readonly respuestas: readonly { readonly fieldCode: string; readonly answer?: ValorDeRespuestaV2 | null; readonly text: string }[];
  readonly origen: ValorCandidato['origen'];
  /** Los campos que la persona corrigió al confirmar lo cargado; su origen es «corregido». */
  readonly corregidos?: readonly string[];
}

/** Los valores que dan las respuestas para cada dato, según `CAMPOS_DEL_CALCULO`. */
export function candidatosDeLasRespuestas(fuentes: readonly FuenteDeRespuestas[]): ValorCandidato[] {
  const candidatos: ValorCandidato[] = [];
  for (const f of fuentes) {
    for (const dato of DATOS_DE_LA_EVALUACION_INICIAL) {
      for (const codigo of CAMPOS_DEL_CALCULO[dato]) {
        const r = f.respuestas.find((x) => x.fieldCode === codigo);
        if (!r || r.text.trim() === '') continue;
        const valor = CONCEPTO_DEL_DATO[dato].numerico && r.answer?.type === 'NUMBER' ? r.answer.number : r.text.trim();
        const origen = f.origen.tipo === 'CONFIRMADO' && f.corregidos?.includes(codigo) ? { ...f.origen, tipo: 'CORREGIDO' as const } : f.origen;
        candidatos.push({ dato, valor, texto: r.text.trim(), origen });
      }
    }
  }
  return candidatos;
}

/** La toma de referencia, como la da API-OBC-01 (la misma del calculador). */
export interface TomaParaLaEvaluacion {
  readonly measuredOn: string;
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly ageYears: number | null;
}

/** Un dato como se ve y se registra: el valor que vale, su origen y, si hay otro, el que queda al lado. */
export interface DatoParaElCalculo {
  readonly dato: DatoDeLaEvaluacionInicial;
  readonly concepto: string;
  readonly unidad: string | null;
  /** Lo que se registra; `null`: sin indicar. */
  readonly valor: number | string | null;
  /** En palabras, con su unidad; `null`: sin indicar. */
  readonly texto: string | null;
  readonly origen: OrigenDelDato | null;
  /** El otro valor que había (el declarado frente al medido, o el automático frente a lo que cambió el profesional). */
  readonly alLado: { readonly texto: string; readonly origen: OrigenDelDato } | null;
}

const conUnidad = (valor: number | string, unidad: string | null): string => (typeof valor === 'number' ? `${numero(valor, 2)}${unidad ? ` ${unidad}` : ''}` : valor);
const fechaDe = (o: OrigenDelDato): string => ('fecha' in o ? o.fecha : '');

/** Lo que escribió el profesional en un dato, si se entiende; `null` si no (el renglón lo marca). */
export function valorEscrito(dato: DatoDeLaEvaluacionInicial, escrito: string): number | string | null {
  const t = escrito.trim();
  if (t === '') return null;
  if (dato === 'sexo') return SEXOS_DE_LA_EVALUACION.find((s) => s.valor === t || s.texto.toLowerCase() === t.toLowerCase())?.texto ?? null;
  if (!CONCEPTO_DEL_DATO[dato].numerico) return t.slice(0, 500);
  const n = leerNumero(t);
  const tope = dato === 'peso' ? TOPES_DEL_CALCULADOR.pesoKg : dato === 'talla' ? TOPES_DEL_CALCULADOR.tallaCm : TOPES_DEL_CALCULADOR.edadAnios;
  return n !== null && n >= tope.minimo && n <= tope.maximo ? n : null;
}

/**
 * Lo que necesita el cálculo, dato por dato (RP-12):
 * - lo que cambió el profesional vale, como «Cargado por vos», y lo automático queda al lado (vaciarlo deja «Sin indicar»);
 * - si no, la toma vale para el peso, la talla y la edad, y el declarado más nuevo queda al lado;
 * - si no hay toma, vale el declarado más nuevo.
 */
export function loQueNecesitaElCalculo(p: {
  readonly toma: TomaParaLaEvaluacion | null;
  readonly candidatos: readonly ValorCandidato[];
  readonly cambiados?: Readonly<Partial<Record<DatoDeLaEvaluacionInicial, string>>>;
}): DatoParaElCalculo[] {
  return DATOS_DE_LA_EVALUACION_INICIAL.map((dato) => {
    const { concepto, unidad } = CONCEPTO_DEL_DATO[dato];
    const medido = p.toma ? (dato === 'peso' ? p.toma.weightKg : dato === 'talla' ? p.toma.heightCm : dato === 'edad' ? p.toma.ageYears : null) : null;
    const delMedido = medido !== null && p.toma ? { valor: medido as number | string, texto: conUnidad(medido, unidad), origen: { tipo: 'TOMA', fecha: p.toma.measuredOn } as OrigenDelDato } : null;
    const declarado = [...p.candidatos.filter((c) => c.dato === dato)].sort((a, b) => fechaDe(b.origen).localeCompare(fechaDe(a.origen)))[0] ?? null;
    const delDeclarado = declarado ? { valor: declarado.valor, texto: conUnidad(declarado.valor, typeof declarado.valor === 'number' ? unidad : null), origen: declarado.origen as OrigenDelDato } : null;
    const automatico = delMedido ?? delDeclarado;
    const otro = delMedido && delDeclarado ? delDeclarado : null;
    const escrito = p.cambiados?.[dato];
    if (escrito !== undefined) {
      const valor = valorEscrito(dato, escrito);
      const antes = automatico ? { texto: automatico.texto, origen: automatico.origen } : null;
      if (valor === null) return { dato, concepto, unidad, valor: null, texto: null, origen: null, alLado: antes };
      const texto = conUnidad(valor, unidad);
      return { dato, concepto, unidad, valor, texto, origen: { tipo: 'CARGADO_POR_VOS' }, alLado: antes && antes.texto !== texto ? antes : null };
    }
    if (!automatico) return { dato, concepto, unidad, valor: null, texto: null, origen: null, alLado: null };
    return { dato, concepto, unidad, valor: automatico.valor, texto: automatico.texto, origen: automatico.origen, alLado: otro ? { texto: otro.texto, origen: otro.origen } : null };
  });
}

// ─── Lo que se registra ─────────────────────────────────────────────────────────────────────────

/** La procedencia en palabras, como queda en la evaluación (sin el nombre de la persona: el registro es del profesional). */
export function procedenciaParaRegistrar(o: OrigenDelDato, fecha: (isoODia: string) => string): string {
  switch (o.tipo) {
    case 'TOMA': return `toma de Antropometría del ${fecha(o.fecha)}`;
    case 'RESPONDIDO': return `respondido por la persona en «${o.formulario}» el ${fecha(o.fecha)}`;
    case 'CONFIRMADO': return `cargado con la persona en «${o.formulario}» y confirmado por ella el ${fecha(o.fecha)}`;
    case 'CORREGIDO': return `corregido por la persona en «${o.formulario}» el ${fecha(o.fecha)}`;
    case 'CARGADO_SIN_CONFIRMAR': return `cargado con la persona en «${o.formulario}» el ${fecha(o.fecha)}, sin confirmar todavía`;
    case 'COMPARTIDO': return `hábitos que compartió la persona, del ${fecha(o.fecha)}`;
    case 'CARGADO_POR_VOS': return 'cargado por el profesional';
  }
}

/** Un renglón de la evaluación (`DatoDeEvaluacionSchema` de API-NUT-01). */
export interface RenglonDeLaEvaluacion {
  readonly concept: string;
  readonly value: number | string;
  readonly unit: string | null;
  readonly source: FuenteDeDato;
  readonly methodStatement: null;
}

/**
 * Lo que se registra de lo que necesita el cálculo (EI-D04): un renglón por dato indicado, con su fuente (la toma,
 * observado; lo demás, informado), y su procedencia en palabras para `evidenceReferences` (hasta 200 caracteres).
 */
export function entradasDelCalculo(datos: readonly DatoParaElCalculo[], fecha: (isoODia: string) => string): { readonly entries: RenglonDeLaEvaluacion[]; readonly evidencias: string[] } {
  const entries: RenglonDeLaEvaluacion[] = [];
  const evidencias: string[] = [];
  for (const d of datos) {
    if (d.valor === null || !d.origen) continue;
    entries.push({ concept: d.concepto, value: d.valor, unit: typeof d.valor === 'number' ? d.unidad : null, source: d.origen.tipo === 'TOMA' ? 'OBSERVED' : 'REPORTED', methodStatement: null });
    evidencias.push(`${d.concepto}: ${procedenciaParaRegistrar(d.origen, fecha)}.`.slice(0, 200));
  }
  return { entries, evidencias };
}

// ─── EI-D15 · el punto de unión con el calculador ───────────────────────────────────────────────

const normalizar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

/** Los datos del cálculo de una evaluación registrada, con su fuente. Lo que no está o no se entiende, `null`. */
export interface DatosDelCalculoDeLaEvaluacion {
  readonly pesoKg: { readonly valor: number; readonly medido: boolean } | null;
  readonly tallaCm: { readonly valor: number; readonly medido: boolean } | null;
  readonly edadAnios: { readonly valor: number; readonly medido: boolean } | null;
  readonly sexo: SexoDelCalculo | null;
  readonly nivelDeActividad: string | null;
  readonly occurredAt: string;
}

/**
 * EI-D15 · lo que registró la evaluación para el calculador (DL-186): el peso, la talla y la edad dentro de sus topes, con
 * si salieron de una toma (`OBSERVED`); el sexo, si se indicó; el nivel de actividad en palabras. Lee también evaluaciones
 * anteriores a este paquete que usaron «Peso» y «Talla». El calculador lo usa para arrancar; nunca decide por el
 * profesional.
 */
export function datosDelCalculoEnLaEvaluacion(e: {
  readonly occurredAt: string;
  readonly assessment: { readonly entries: readonly { readonly concept: string; readonly value: string | number; readonly source: FuenteDeDato }[] };
}): DatosDelCalculoDeLaEvaluacion {
  const renglon = (dato: DatoDeLaEvaluacionInicial) => {
    const buscado = normalizar(CONCEPTO_DEL_DATO[dato].concepto);
    // Si un concepto está dos veces, vale el último renglón: es lo último que escribió.
    return [...e.assessment.entries].reverse().find((x) => normalizar(x.concept) === buscado) ?? null;
  };
  const numerico = (dato: 'peso' | 'talla' | 'edad') => {
    const r = renglon(dato);
    if (!r) return null;
    const valor = typeof r.value === 'number' ? r.value : valorEscrito(dato, r.value);
    if (typeof valor !== 'number') return null;
    return valorEscrito(dato, String(valor).replace('.', ',')) === null ? null : { valor, medido: r.source === 'OBSERVED' };
  };
  const sexo = renglon('sexo');
  const actividad = renglon('actividad');
  const textoDeSexo = sexo ? normalizar(String(sexo.value)) : '';
  return {
    pesoKg: numerico('peso'),
    tallaCm: numerico('talla'),
    edadAnios: numerico('edad'),
    sexo: SEXOS_DE_LA_EVALUACION.find((s) => normalizar(s.texto) === textoDeSexo || normalizar(s.valor) === textoDeSexo)?.valor ?? null,
    nivelDeActividad: actividad ? String(actividad.value) : null,
    occurredAt: e.occurredAt,
  };
}

// ─── RP-16 · la corrección se ve ────────────────────────────────────────────────────────────────

/** Una respuesta que la persona cambió, sumó o quitó al confirmar lo que cargó el profesional. */
export interface CorreccionDeLaPersona {
  readonly fieldCode: string;
  readonly pregunta: string | null;
  /** Lo que dice hoy; `null` si la quitó. */
  readonly ahora: string | null;
  /** Lo que había quedado en la evaluación de ese dato, si es distinto de lo de hoy (EI-D12); si no, `null`. */
  readonly antes: string | null;
}

/**
 * Las correcciones de la persona (`correctedFieldCodes` de la transcripción), en ese orden, con lo que dice hoy. El antes
 * sale de la evaluación registrada, solo para las preguntas que alimentan un dato del cálculo (EI-D12).
 */
export function correccionesDeLaPersona(p: {
  readonly corregidos: readonly string[];
  readonly respuestas: readonly { readonly fieldCode: string; readonly label?: string; readonly text: string }[];
  readonly etiquetas?: ReadonlyMap<string, string>;
  readonly registrado?: readonly { readonly concept: string; readonly value: string | number; readonly unit?: string | null }[];
}): CorreccionDeLaPersona[] {
  return p.corregidos.map((codigo) => {
    const r = p.respuestas.find((x) => x.fieldCode === codigo) ?? null;
    const pregunta = r?.label ?? p.etiquetas?.get(codigo) ?? null;
    const ahora = r ? r.text.trim() || null : null;
    const dato = DATOS_DE_LA_EVALUACION_INICIAL.find((d) => CAMPOS_DEL_CALCULO[d].includes(codigo)) ?? null;
    const enLaEvaluacion = dato ? [...(p.registrado ?? [])].reverse().find((x) => normalizar(x.concept) === normalizar(CONCEPTO_DEL_DATO[dato].concepto)) ?? null : null;
    const antes = enLaEvaluacion ? conUnidad(enLaEvaluacion.value, typeof enLaEvaluacion.value === 'number' ? (enLaEvaluacion.unit ?? null) : null) : null;
    return { fieldCode: codigo, pregunta, ahora, antes: antes !== null && antes !== ahora ? antes : null };
  });
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** Los textos de la evaluación inicial (DL-189). Ubican sin calificar; la persona se nombra como la nombra el marco. */
export const COPY_EVALUACION_INICIAL = {
  persona: 'la persona',
  // RP-10 · la franja
  franja: 'Los pasos para empezar el plan',
  ahora: 'Ahora',
  despues: 'Después',
  evaluacionLista: (dia: string): string => `Registrada el ${dia}`,
  objetivoListo: (dia: string): string => `Vigente desde el ${dia}`,
  verElPaso: (paso: string): string => `Ver ${paso.toLowerCase()}`,
  // RP-11 · la fecha
  hoy: (hora: string): string => `Hoy, ${hora}`,
  elDia: (dia: string, hora: string): string => `${dia}, ${hora}`,
  cambiarLaFecha: 'cambiar',
  usarLaDeAhora: 'usar la de ahora',
  etiquetaDeLaFecha: 'Fecha y hora de la evaluación',
  ayudaDeLaFecha: 'Para una evaluación que hiciste antes. Sin cambiarla, queda la del momento en que la registrás.',
  fechaFutura: 'La fecha no puede ser posterior a ahora.',
  fechaIlegible: 'Elegí la fecha y la hora de la evaluación.',
  // RP-12 · los bloques
  loQueConto: (nombre: string): string => `Lo que contó ${nombre}`,
  loMedido: 'Lo medido',
  loQueNecesita: 'Lo que necesita el cálculo',
  // Lo que contó
  respondido: (dia: string): string => `Respondido el ${dia}`,
  corregidoEl: (dia: string, diaDeLaCorreccion: string): string => `Respondido el ${dia} · corregido el ${diaDeLaCorreccion}`,
  confirmadoEl: (nombre: string, dia: string): string => `Lo cargaste vos · ${nombre} lo confirmó el ${dia}`,
  seLoPediste: (dia: string): string => `Se lo pediste el ${dia}.`,
  cargadoSinConfirmar: (dia: string, nombre: string): string => `Cargado por vos el ${dia} · falta que ${nombre} lo confirme`,
  compartidos: (dia: string): string => `Sus hábitos, como los compartió el ${dia}`,
  noSeVinculanLosCompartidos: 'Los hábitos que te comparte se ven acá y no se vinculan: no son una respuesta a un pedido tuyo.',
  seVinculan: 'Al registrar, estos formularios quedan vinculados a la evaluación: no se copia ninguna respuesta.',
  sinFormularios: (nombre: string): string => `Todavía no hay formularios de ${nombre} en esta área.`,
  completarAhora: (nombre: string): string => `Completarlo ahora con ${nombre}`,
  seguirCargando: 'Seguir cargando',
  enviarselo: 'Enviárselo',
  verTodo: 'Ver todo',
  ocultar: 'Ocultar',
  nadaCargadoTodavia: 'Todavía no cargaste nada.',
  leyendo: 'Leyendo lo que contó…',
  noSePudoLeer: 'No pudimos leer lo que contó.',
  volverALeer: 'Volver a leer',
  // RP-16
  corrigio: (nombre: string, antes: string, ahora: string): string => `${nombre} corrigió: ${antes} → ${ahora}`,
  corrigioLaPregunta: (nombre: string, pregunta: string, ahora: string): string => `${nombre} corrigió «${pregunta}»: ahora dice ${ahora}`,
  quitoLaRespuesta: (nombre: string, pregunta: string): string => `${nombre} quitó la respuesta de «${pregunta}»`,
  corrigioOtra: (nombre: string): string => `${nombre} corrigió una respuesta`,
  // Lo medido
  toma: (dia: string): string => `Toma del ${dia}`,
  verToma: 'Ver toma',
  sinToma: 'Sin tomas de Antropometría que puedas usar para el cálculo.',
  pesoTallaEdad: { peso: 'Peso', talla: 'Talla', edad: 'Edad' },
  // Lo que necesita el cálculo
  ayudaDelCalculo: 'Con esto arranca el calculador del objetivo. Si cambiás un dato, queda como cargado por vos.',
  origen: {
    TOMA: (dia: string): string => `Toma del ${dia}`,
    RESPONDIDO: (nombre: string, dia: string): string => `Respondido por ${nombre} · ${dia}`,
    CONFIRMADO: (nombre: string, dia: string): string => `Confirmado por ${nombre} · ${dia}`,
    CORREGIDO: (nombre: string, dia: string): string => `Corregido por ${nombre} · ${dia}`,
    CARGADO_SIN_CONFIRMAR: (nombre: string): string => `Cargado por vos · falta que ${nombre} lo confirme`,
    COMPARTIDO: (nombre: string, dia: string): string => `Compartido por ${nombre} · ${dia}`,
    CARGADO_POR_VOS: 'Cargado por vos',
  },
  sinIndicar: 'Sin indicar',
  cambiar: 'Cambiar',
  listo: 'Listo',
  elegi: 'Elegí',
  valorIlegible: (dato: string): string => `Revisá ${dato.toLowerCase()}: no se entiende o está fuera de lo posible.`,
  // El pie
  agregarOtroDato: '+ Agregar otro dato',
  anotaciones: 'Anotaciones',
  ayudaDeLasAnotaciones: (nombre: string): string => `Solo para vos: ${nombre} no las ve en su app. Quedan con la evaluación.`,
  registrar: 'Registrar la evaluación',
  registrando: 'Registrando…',
  nadaParaRegistrar: 'Para registrar la evaluación, indicá al menos un dato.',
  // RP-14 · completarlo ahora
  vasACompletar: (nombre: string, formularios: string): string => `Vas a completar con ${nombre}: ${formularios}.`,
  tambienPodesSumar: 'También podés sumar:',
  seguir: 'Seguir',
  preparando: 'Preparando los formularios…',
  noSePudoPreparar: (formulario: string, motivo: string): string => `No se pudo pedir «${formulario}»: ${motivo}`,
  volverALaEvaluacion: 'Volver a la evaluación',
  despuesSigue: (formulario: string): string => `Después sigue «${formulario}».`,
  propositoGenerico: (area: string): string => `Para la evaluación inicial de ${area}.`,
  // RP-15 · lo crítico primero
  primeroLoNecesario: 'Primero lo necesario para planificar',
  primeroBajada: (nombre: string): string => `Lo que no cargues, ${nombre} lo responde en su app al confirmar.`,
  cargarElResto: 'Cargar también el resto',
  soloLoNecesario: 'Volver a lo necesario',
} as const;
