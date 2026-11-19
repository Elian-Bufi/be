/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179): la lógica pura del panel «Contexto de <nombre>», sin React ni base, para que la usen
 * el website y la API y se pruebe sola (`contexto-de-la-persona.test.ts`).
 * - **«Lo importante»** (`loImportante`): el criterio del §1 del paquete, por área, aplicado solo a lo que los formularios de
 *   BE preguntan. Ordena por seguridad primero (CTX-D05), muestra lo que la persona respondió en sus palabras y con su
 *   fuente (CTX-D06), el PAR-Q+ pregunta por pregunta (CTX-D07), la medicación con su nota fija (CTX-D08) y la conducta
 *   alimentaria con cuidado (CTX-D09).
 * - **El cuerpo** (`metricasDelCuerpo`): el cambio entre dos tomas solo si son comparables, con el «%» y su base (CTX-D15).
 * - **El buscador** de «Formularios» (`buscarEnFormularios`): en la pregunta y en la respuesta, sin tildes.
 * - **Los textos** (`COPY_CONTEXTO`): ninguno dice «asesorado», «cumplimiento», «adherencia», «racha» ni «puntaje».
 * Ubicar, nunca calificar: nada de acá dice «riesgo», «bien», «mal», ni pinta un color.
 */
import type { Alcance } from './alcance';
import type { CuerpoDelContextoResponse, FormularioEnElContexto, MetricaDelCuerpo, RespuestaEnElContexto, TomaEnElContexto, ValorDeLaToma } from './contratos-contexto-de-la-persona';
import type { RespuestaDeCampoV2, ValorDeRespuestaV2 } from './contratos-formularios-v2';
import { resumenDeValor } from './formularios-v2';
import { normalizarTexto } from './linea-de-tiempo';
import { NOMBRE_DE_METRICA } from './nombres-de-metricas';
import { SECCION_DE_HABITOS } from './plantillas-de-inicio';

export type CuerpoDelContexto = CuerpoDelContextoResponse['data'];

// ─── Los textos ──────────────────────────────────────────────────────────────────────────────────

export const COPY_CONTEXTO = {
  boton: (nombre: string | null) => (nombre ? `Contexto de ${nombre}` : 'Contexto de la persona'),
  atajo: 'Alt + C',
  cerrar: 'Cerrar el contexto',
  volverALeer: 'Volver a leer',
  pestanas: { importante: 'Lo importante', formularios: 'Formularios', cuerpo: 'Cuerpo', otras: 'Otras áreas', notas: 'Notas' },
  leyendo: (que: string) => `Leyendo ${que}…`,
  noSeLeyo: (que: string) => `No pudimos leer ${que}.`,
  reintentar: 'Reintentar',
  // Lo importante
  introImportante: 'Lo que conviene tener presente antes de planificar, con su fuente. Es lo que respondió la persona, en sus palabras.',
  sinNadaImportante: 'Todavía no hay respuestas para mostrar acá.',
  pediUnFormulario: (formulario: string) => `Pedile «${formulario}» desde Información: lo que responda aparece acá.`,
  citar: 'Citar',
  citada: 'Citada',
  citarEnLaEvaluacion: 'Citar en la evaluación',
  citarEnElObjetivo: 'Citar en el fundamento del objetivo',
  sinDondeCitar: 'Para citar, abrí «Nueva evaluación» o «Nueva versión de objetivo» en el Resumen.',
  ayudaDeCitarEnLaEvaluacion: 'Citar en la evaluación: tocá «Citar» al lado de cada respuesta.',
  ayudaDeCitarEnElObjetivo: 'Citar en el fundamento del objetivo: tocá «Citar» al lado de cada respuesta. Lo de salud se cita solo en la evaluación, porque el objetivo lo ve también quien vea su plan.',
  topeDeCitas: (n: number) => `Ya hay ${n} citas: es el máximo por evaluación.`,
  citadaEnLaEvaluacion: 'Quedó citada en la evaluación.',
  citadaEnElObjetivo: 'Quedó en el fundamento del objetivo.',
  datoSensible: 'Lo contó en un formulario. Mostralo solo si hace falta.',
  conductaAlimentaria: 'Conducta alimentaria',
  // Formularios
  buscar: 'Buscar en las respuestas',
  buscarAyuda: 'Busca en las preguntas y en las respuestas, sin importar las tildes.',
  sinFormularios: 'Todavía no respondió ningún formulario que le hayas pedido.',
  sinResultados: (q: string) => `Nada coincide con «${q}».`,
  resultados: (n: number) => (n === 1 ? '1 respuesta coincide.' : `${n} respuestas coinciden.`),
  // Cuerpo
  sinTomas: 'Todavía no hay tomas registradas.',
  unaSolaToma: 'Hay una sola toma: el cambio aparece con la próxima.',
  noCompartido: 'No compartido',
  cuerpoNoCompartido: 'No compartido. Lo decide la persona en «Quién ve qué», en su app.',
  cuerpoCompartido: (quien: string) => `Lo comparte la persona: el peso y la composición en kilos, de las tomas de ${quien}.`,
  ultimaToma: 'Última toma',
  tomaAnterior: 'Anterior',
  cambio: 'Cambio',
  noSeCompara: (por: string) => `No se compara: ${por}.`,
  // Otras áreas
  pedirAcceso: 'Pedir acceso',
  pedirVerSusHabitos: 'Pedir ver sus hábitos',
  susHabitos: 'Sus hábitos',
  susHabitosLosVe: (desde: string) => `Te los comparte desde el ${desde}.`,
  susHabitosNoLosVe: 'No compartido.',
  nuncaNotasPrivadas: 'Las notas privadas de otros profesionales no se comparten nunca.',
  // Notas
  notasIntro: 'Tus notas sobre la persona. Solo las ves vos; no se mandan a nadie.',
  sinNotas: 'Todavía no escribiste notas sobre la persona.',
  agregarNota: 'Agregar una nota',
} as const;

// ─── Las fuentes y los renglones de «Lo importante» ─────────────────────────────────────────────

/** De dónde sale un dato: el formulario (con su fecha), «Mis hábitos» compartidos o la última toma. */
export interface FuenteDelDato {
  readonly tipo: 'FORMULARIO' | 'HABITOS' | 'TOMA';
  readonly nombre: string;
  /** ISO 8601: cuándo se registró lo vigente. */
  readonly fecha: string;
  readonly corregida: boolean;
  /** Lo cargó el profesional con la persona y ella lo confirmó (DL-164 D-4). */
  readonly cargadaConElProfesional: boolean;
}

/** Lo que se manda en una cita (DL-102): la respuesta, el campo y la versión que se vio. */
export interface CitaPosible {
  readonly formResponseId: string;
  readonly fieldCode: string;
  readonly expectedVersion: string;
  /** El área en la que se pidió: una evaluación solo cita las de su área. */
  readonly area: Alcance;
  /**
   * Si es de salud (la categoría `SALUD_Y_SEGURIDAD` de la plantilla). Revisión del PR: lo de salud se cita solo en la
   * evaluación, nunca en el fundamento del objetivo, porque el objetivo viaja con el plan que la persona comparte (API-RES-06)
   * y el texto que aceptó promete que lo compartido nunca incluye «lo de salud de tus formularios» (CTX-D12).
   */
  readonly deSalud: boolean;
  /** La pregunta y la respuesta, para el renglón de la cita y para el fundamento del objetivo. */
  readonly pregunta: string;
  readonly respuesta: string;
  readonly fuente: FuenteDelDato;
}

export interface DatoImportante {
  readonly clave: string;
  readonly pregunta: string;
  readonly respuesta: string;
  readonly fuente: FuenteDelDato;
  /** Lo que se cita con «Citar»: la respuesta principal y su detalle, si lo tiene. Vacío si no se cita (CTX-D09). */
  readonly citas: readonly CitaPosible[];
  /** CTX-D09: se muestra con cuidado (sin color, plegado del resumen, no se cita). */
  readonly sensible: boolean;
  /** CTX-D08: una nota fija del área, no una lectura del dato. */
  readonly nota: string | null;
}

export interface GrupoImportante {
  readonly clave: string;
  readonly titulo: string;
  readonly datos: readonly DatoImportante[];
}

/** Una pregunta de «Lo importante»: los códigos que la responden (de una versión a otra) y su detalle. */
interface Pregunta {
  readonly codigos: readonly string[];
  readonly pregunta: string;
  /** El código de la pregunta que la detalla («¿Cuál?»): su respuesta va al lado. */
  readonly detalle?: readonly string[];
  /** Cómo se presenta el detalle, si no se entiende solo («indicación del médico: …»). */
  readonly rotuloDelDetalle?: string;
  readonly nota?: string;
  readonly sensible?: boolean;
  /** Si `true`, una respuesta «No» o «Ninguna» no se muestra (no aporta nada que tener presente). */
  readonly soloSiAporta?: boolean;
}

interface Grupo {
  readonly clave: string;
  readonly titulo: string;
  readonly preguntas: readonly Pregunta[];
  /** El PAR-Q+ (CTX-D07): las siete preguntas generales, juntas. */
  readonly parq?: boolean;
}

/**
 * La nota de la medicación **ubica, no indica** (CTX-D08, ratificación del 19/11): dice por qué el dato importa y deja la
 * decisión al profesional. Nunca un consejo de dosificación ni de qué hacer con la carga o con la comida.
 */
const NOTA_MEDICACION_ENTRENAMIENTO = 'Algunas medicaciones cambian el pulso o la respuesta al esfuerzo.';
const NOTA_MEDICACION_NUTRICION = 'Algunas medicaciones van con horarios o con algún alimento.';

/** Las siete preguntas generales del PAR-Q+ en «Antes de entrenar», con su detalle. */
const PARQ: readonly Pregunta[] = [
  { codigos: ['trn_salud_corazon'], pregunta: 'Corazón o presión alta (dicho por un médico)' },
  { codigos: ['trn_salud_dolor_de_pecho'], pregunta: 'Dolor en el pecho' },
  { codigos: ['trn_salud_mareos'], pregunta: 'Mareos o pérdida del conocimiento en el último año' },
  { codigos: ['trn_salud_cronica'], pregunta: 'Otra enfermedad crónica', detalle: ['trn_salud_cronica_cual'] },
  { codigos: ['medicacion_relevante'], pregunta: 'Medicación para una enfermedad crónica', detalle: ['trn_medicacion_cual'], nota: NOTA_MEDICACION_ENTRENAMIENTO },
  { codigos: ['trn_salud_huesos'], pregunta: 'Huesos, articulaciones o músculos que pueden empeorar' },
  { codigos: ['trn_salud_supervision'], pregunta: 'Actividad física solo con supervisión médica' },
];

const GRUPOS: Readonly<Record<Alcance, readonly Grupo[]>> = {
  ENTRENAMIENTO: [
    {
      clave: 'salud',
      titulo: 'Salud antes de entrenar',
      parq: true,
      preguntas: [
        { codigos: ['trn_apto_medico'], pregunta: 'Apto médico de los últimos 12 meses' },
        { codigos: ['trn_embarazo'], pregunta: 'Embarazo o parto en los últimos 6 meses', soloSiAporta: true },
        { codigos: ['fuma'], pregunta: 'Fuma', soloSiAporta: true },
      ],
    },
    {
      clave: 'dolor',
      titulo: 'Dolor, lesiones y cirugías',
      preguntas: [
        { codigos: ['dolor_o_lesiones'], pregunta: 'Dolor o lesión hoy' },
        { codigos: ['trn_zonas'], pregunta: 'Dónde' },
        { codigos: ['trn_dolor_cuando'], pregunta: 'Cuándo molesta' },
        { codigos: ['trn_movimientos_que_molestan'], pregunta: 'Movimientos que molestan' },
        { codigos: ['trn_dolor_tratamiento'], pregunta: 'Tratamiento' },
        { codigos: ['trn_cirugias'], pregunta: 'Cirugía o lesión importante en los últimos 2 años', detalle: ['trn_cirugias_cual'] },
      ],
    },
    {
      clave: 'experiencia',
      titulo: 'Experiencia y nivel',
      preguntas: [
        { codigos: ['trn_experiencia'], pregunta: 'Lo que viene haciendo' },
        { codigos: ['trn_experiencia_en_fuerza'], pregunta: 'Experiencia con fuerza' },
        { codigos: ['trn_tecnica'], pregunta: 'Técnica de los ejercicios básicos' },
        { codigos: ['trn_resistencia_hoy'], pregunta: 'Resistencia hoy' },
        { codigos: ['trn_rir'], pregunta: 'Conoce el RIR' },
        { codigos: ['trn_cargas'], pregunta: 'Cargas que conoce' },
      ],
    },
    {
      clave: 'semana',
      titulo: 'Disponibilidad y equipamiento',
      preguntas: [
        { codigos: ['trn_dias_por_semana'], pregunta: 'Días por semana' },
        { codigos: ['trn_dias_y_horario'], pregunta: 'Días y momento' },
        { codigos: ['trn_dias_posibles'], pregunta: 'Días posibles' },
        { codigos: ['trn_franja'], pregunta: 'Momento del día' },
        { codigos: ['trn_minutos_por_sesion'], pregunta: 'Minutos por sesión' },
        { codigos: ['trn_lugar_y_equipamiento'], pregunta: 'Dónde entrena', detalle: ['trn_equipamiento'], rotuloDelDetalle: 'cuenta con' },
        { codigos: ['habitos_deportes', 'trn_otros_deportes'], pregunta: 'Otras actividades de la semana' },
        { codigos: ['nivel_de_actividad'], pregunta: 'Su día, en movimiento' },
      ],
    },
    {
      clave: 'descanso',
      titulo: 'Descanso',
      preguntas: [
        { codigos: ['horas_de_sueno'], pregunta: 'Horas de sueño' },
        { codigos: ['habitos_estres', 'trn_estres'], pregunta: 'Estrés de la semana' },
      ],
    },
    {
      clave: 'busca',
      titulo: 'Lo que busca',
      preguntas: [
        { codigos: ['trn_objetivo_principal'], pregunta: 'Lo que más busca' },
        { codigos: ['trn_objetivo_declarado'], pregunta: 'En sus palabras' },
        { codigos: ['trn_fecha_importante'], pregunta: 'Una fecha que le importa' },
        { codigos: ['trn_preferencias'], pregunta: 'Lo que disfruta y lo que evita' },
        { codigos: ['trn_no_quiero'], pregunta: 'Lo que no quiere hacer o le da miedo' },
      ],
    },
  ],
  NUTRICION: [
    {
      clave: 'alergias',
      titulo: 'Alergias e intolerancias',
      preguntas: [
        { codigos: ['nut_alergias'], pregunta: 'Alergia alimentaria diagnosticada', detalle: ['nut_alergias_cuales'] },
        { codigos: ['nut_intolerancias'], pregunta: 'Intolerancia o condición que pide evitar algo', detalle: ['nut_intolerancias_quien'], rotuloDelDetalle: 'diagnóstico médico' },
      ],
    },
    {
      clave: 'salud',
      titulo: 'Salud que el plan tiene en cuenta',
      preguntas: [
        { codigos: ['condiciones_declaradas'], pregunta: 'Condiciones diagnosticadas', detalle: ['nut_condiciones_indicacion'], rotuloDelDetalle: 'indicación del médico' },
        { codigos: ['medicacion_relevante'], pregunta: 'Medicación todos los días', detalle: ['nut_medicacion_cual'], nota: NOTA_MEDICACION_NUTRICION },
        { codigos: ['nut_suplementos'], pregunta: 'Suplementos', soloSiAporta: true },
        { codigos: ['nut_embarazo'], pregunta: 'Embarazo o lactancia', soloSiAporta: true },
        { codigos: ['nut_digestion'], pregunta: 'Acidez, hinchazón o constipación', detalle: ['nut_digestion_que'], rotuloDelDetalle: 'qué le pasa' },
        { codigos: ['nut_peso_reciente'], pregunta: 'Su peso en los últimos 6 meses' },
        { codigos: ['nut_tca'], pregunta: 'Conducta alimentaria', sensible: true, soloSiAporta: true },
      ],
    },
    {
      clave: 'patron',
      titulo: 'Patrón y preferencias',
      preguntas: [
        { codigos: ['nut_estilo'], pregunta: 'Estilo de alimentación' },
        { codigos: ['nut_alimentos_no'], pregunta: 'Lo que no come o no quiere' },
        { codigos: ['nut_no_negociable'], pregunta: 'Lo que no quiere cambiar' },
        { codigos: ['nut_ritmo_de_cambio'], pregunta: 'Cómo prefiere los cambios' },
        { codigos: ['nut_planes_previos'], pregunta: 'Planes anteriores', detalle: ['nut_planes_previos_que'], rotuloDelDetalle: 'qué le sirvió y qué no' },
        { codigos: ['nut_alimentos_si'], pregunta: 'Lo que le gusta y comería seguido' },
      ],
    },
    {
      clave: 'dia',
      titulo: 'Horario y día tipo',
      preguntas: [
        { codigos: ['habitos_horarios', 'nut_horarios'], pregunta: 'Se levanta y se acuesta' },
        { codigos: ['nut_jornada'], pregunta: 'Su jornada', detalle: ['nut_comida_en_jornada'], rotuloDelDetalle: 'afuera' },
        { codigos: ['nut_momentos'], pregunta: 'Comidas de un día típico' },
        { codigos: ['nut_saltea'], pregunta: 'Comidas que saltea', detalle: ['nut_saltea_por_que'], rotuloDelDetalle: 'por qué', soloSiAporta: true },
        { codigos: ['nut_mas_hambre'], pregunta: 'Cuándo tiene más hambre' },
        { codigos: ['nut_fin_de_semana'], pregunta: 'El fin de semana', detalle: ['nut_fin_de_semana_que_cambia'], rotuloDelDetalle: 'qué cambia' },
        { codigos: ['nut_afuera'], pregunta: 'Come afuera o pide', detalle: ['nut_afuera_que_elegis'], rotuloDelDetalle: 'qué elige' },
        { codigos: ['nut_hora_de_entrenamiento'], pregunta: 'Cuándo entrena' },
        { codigos: ['habitos_deportes'], pregunta: 'Actividades de la semana' },
      ],
    },
    {
      clave: 'logistica',
      titulo: 'Quién cocina, tiempo y presupuesto',
      preguntas: [
        { codigos: ['nut_quien_cocina'], pregunta: 'Quién cocina y compra' },
        { codigos: ['nut_tiempo_para_cocinar'], pregunta: 'Tiempo para cocinar' },
        { codigos: ['nut_equipamiento_cocina'], pregunta: 'Con qué cuenta en la cocina' },
        { codigos: ['nut_presupuesto'], pregunta: 'El precio le limita' },
      ],
    },
    {
      clave: 'busca',
      titulo: 'Lo que busca',
      preguntas: [
        { codigos: ['nut_objetivo'], pregunta: 'Lo que le gustaría lograr' },
        { codigos: ['nut_objetivo_propio'], pregunta: 'En sus palabras' },
      ],
    },
  ],
  ANTROPOMETRIA: [],
};

/**
 * CTX-D09: lo que no se cita nunca, ni en la evaluación ni en el objetivo, y se muestra con cuidado: la conducta alimentaria.
 * La API lo repite (`validarCitas` responde el 422 neutral), así no depende de la pantalla.
 */
export const CAMPOS_QUE_NO_SE_CITAN: ReadonlySet<string> = new Set(['nut_tca']);
export const seCita = (fieldCode: string): boolean => !CAMPOS_QUE_NO_SE_CITAN.has(fieldCode);

/** Lo que el formulario prometió cuando la persona contó un antecedente de conducta alimentaria (FRM-NUTRICION-INICIO). */
const TCA_EN_PALABRAS: Readonly<Record<string, string>> = {
  si: 'Contó un antecedente. Lo que le prometimos: armar el plan sin números a la vista y junto con un profesional de la salud.',
  prefiero_en_persona: 'Prefiere hablarlo en persona.',
};

/** Las respuestas que no aportan nada que tener presente, en las preguntas `soloSiAporta`. */
const NO_APORTA = new Set(['no', 'ninguna', 'no_tomo', 'no_corresponde']);

function aporta(valor: ValorDeRespuestaV2): boolean {
  if (valor.type === 'BOOLEAN') return valor.yes;
  if (valor.type === 'CHOICE') return !NO_APORTA.has(valor.option);
  if (valor.type === 'MULTI_CHOICE') return valor.options.some((o) => !NO_APORTA.has(o));
  return true;
}

/** Una respuesta hallada, con su formulario. */
interface Hallada {
  readonly respuesta: RespuestaEnElContexto;
  readonly formulario: FormularioEnElContexto | null;
  readonly fuente: FuenteDelDato;
}

function fuenteDeFormulario(f: FormularioEnElContexto): FuenteDelDato {
  return { tipo: 'FORMULARIO', nombre: f.templateName, fecha: f.answeredAt, corregida: f.rectified, cargadaConElProfesional: f.transcribedConfirmedAt !== null };
}

/** Los hábitos que la persona le comparte (API-HBT-05), como respuestas con su fuente: «Mis hábitos». */
export interface HabitosCompartidos {
  readonly answers: readonly RespuestaDeCampoV2[];
  readonly recordedAt: string;
}

const CAMPOS_DE_HABITOS = new Map(SECCION_DE_HABITOS.fields.map((c) => [c.fieldCode, c] as const));

/**
 * Un buscador de respuestas: primero los formularios del área del panel, después los demás propios (un profesional con dos
 * áreas), del más nuevo al más viejo; al final, los hábitos que la persona comparte (CTX-D11).
 */
function buscador(area: Alcance, formularios: readonly FormularioEnElContexto[], habitos: HabitosCompartidos | null): (codigo: string) => Hallada | null {
  const orden = [...formularios].sort((a, b) => Number(b.scope === area) - Number(a.scope === area) || b.answeredAt.localeCompare(a.answeredAt));
  return (codigo) => {
    for (const f of orden) {
      for (const s of f.sections) {
        const r = s.answers.find((x) => x.fieldCode === codigo);
        if (r) return { respuesta: r, formulario: f, fuente: fuenteDeFormulario(f) };
      }
    }
    const campo = CAMPOS_DE_HABITOS.get(codigo);
    const h = habitos?.answers.find((x) => x.fieldCode === codigo);
    if (campo && h && habitos) {
      return {
        respuesta: { fieldCode: codigo, label: campo.label, category: campo.category, dataType: campo.dataType, answer: h.answer, text: resumenDeValor(campo, h.answer) },
        formulario: null,
        fuente: { tipo: 'HABITOS', nombre: 'Mis hábitos', fecha: habitos.recordedAt, corregida: false, cargadaConElProfesional: false },
      };
    }
    return null;
  };
}

function citaDe(h: Hallada, pregunta: string): CitaPosible | null {
  if (!h.formulario || !seCita(h.respuesta.fieldCode)) return null;
  return {
    formResponseId: h.formulario.formResponseId,
    fieldCode: h.respuesta.fieldCode,
    expectedVersion: h.formulario.version,
    area: h.formulario.scope,
    deSalud: h.respuesta.category === 'SALUD_Y_SEGURIDAD',
    pregunta,
    respuesta: h.respuesta.text,
    fuente: h.fuente,
  };
}

function primera(buscar: (c: string) => Hallada | null, codigos: readonly string[] | undefined): Hallada | null {
  for (const c of codigos ?? []) {
    const h = buscar(c);
    if (h) return h;
  }
  return null;
}

/**
 * El detalle de una respuesta sale del mismo formulario que ella. Revisión del PR: si se buscaba en todos, un «No» nuevo
 * quedaba pegado al «¿Cuál?» de un formulario viejo («No · maní»). Una respuesta de «Mis hábitos» no tiene detalle.
 */
function detalleDe(h: Hallada, codigos: readonly string[] | undefined): Hallada | null {
  if (!h.formulario) return null;
  for (const c of codigos ?? []) {
    for (const s of h.formulario.sections) {
      const r = s.answers.find((x) => x.fieldCode === c);
      if (r) return { respuesta: r, formulario: h.formulario, fuente: h.fuente };
    }
  }
  return null;
}

function datoDe(p: Pregunta, buscar: (c: string) => Hallada | null): DatoImportante | null {
  const h = primera(buscar, p.codigos);
  if (!h) return null;
  if (p.soloSiAporta && !aporta(h.respuesta.answer)) return null;
  const detalle = detalleDe(h, p.detalle);
  if (p.sensible) {
    // CTX-D09: en palabras propias, sin el nombre del trastorno y sin citar.
    const opcion = h.respuesta.answer.type === 'CHOICE' ? h.respuesta.answer.option : '';
    return { clave: `${p.codigos[0]}`, pregunta: p.pregunta, respuesta: TCA_EN_PALABRAS[opcion] ?? h.respuesta.text, fuente: h.fuente, citas: [], sensible: true, nota: null };
  }
  const respuesta = detalle && detalle.respuesta.text ? `${h.respuesta.text} · ${p.rotuloDelDetalle ? `${p.rotuloDelDetalle}: ` : ''}${detalle.respuesta.text}` : h.respuesta.text;
  const citas = [citaDe(h, p.pregunta), detalle ? citaDe(detalle, p.pregunta) : null].filter((c): c is CitaPosible => c !== null);
  return { clave: p.codigos[0]!, pregunta: p.pregunta, respuesta, fuente: h.fuente, citas, sensible: false, nota: p.nota ?? null };
}

/**
 * CTX-D07: el PAR-Q+ pregunta por pregunta. Cada «sí» en su renglón, con su detalle; si las siete son «no», un renglón; si
 * no respondió todas y ninguna es «sí», lo dice. Nunca «2 de 7»: no es un puntaje.
 */
function datosDelParq(buscar: (c: string) => Hallada | null): DatoImportante[] {
  const halladas = PARQ.map((p) => ({ p, h: primera(buscar, p.codigos) }));
  const respondidas = halladas.filter((x) => x.h !== null);
  if (respondidas.length === 0) return [];
  const si = respondidas.filter((x) => x.h!.respuesta.answer.type === 'BOOLEAN' && (x.h!.respuesta.answer as { yes: boolean }).yes);
  if (si.length > 0) return si.map((x) => datoDe(x.p, buscar)).filter((d): d is DatoImportante => d !== null);
  const fuente = respondidas[0]!.h!.fuente;
  const texto = respondidas.length === PARQ.length ? 'Las 7 preguntas generales del PAR-Q+: todas «no».' : 'Ningún «sí» entre las preguntas del PAR-Q+ que respondió.';
  const citas = respondidas.map((x) => citaDe(x.h!, x.p.pregunta)).filter((c): c is CitaPosible => c !== null);
  return [{ clave: 'parq', pregunta: 'PAR-Q+', respuesta: texto, fuente, citas, sensible: false, nota: null }];
}

const ORIGEN_EN_PALABRAS: Readonly<Record<TomaEnElContexto['origins'][number], string>> = {
  DIRECT_CAPTURE: 'Medida en la toma',
  SELF_REPORTED: 'Informada por la persona',
  CONTROLLED_IMPORT: 'Importada de otro equipo',
};

/** Las condiciones de la última toma (Antropometría, §1.3): lo que BE registra hoy. */
function datosDeLaToma(toma: TomaEnElContexto, fecha: (iso: string) => string, hora: (iso: string) => string, nombre: (actor: TomaEnElContexto['author']) => string): GrupoImportante {
  const fuente: FuenteDelDato = { tipo: 'TOMA', nombre: 'Última toma', fecha: toma.occurredAt, corregida: false, cargadaConElProfesional: false };
  const dato = (clave: string, pregunta: string, respuesta: string, nota: string | null = null): DatoImportante => ({ clave, pregunta, respuesta, fuente, citas: [], sensible: false, nota });
  const datos = [
    dato('toma-fecha', 'Fecha y hora', `${fecha(toma.occurredAt)}, ${hora(toma.occurredAt)}`, 'Para comparar la próxima, repetí la hora del día, el ayuno, la hidratación y el ejercicio previo.'),
    dato('toma-protocolo', 'Protocolo', toma.protocols.join(', ') || '—'),
    dato('toma-origen', 'Procedencia', toma.origins.map((o) => ORIGEN_EN_PALABRAS[o]).join(', ') || '—'),
    dato('toma-quien', 'La tomó', nombre(toma.author)),
    ...(toma.context ? [dato('toma-contexto', 'Contexto', toma.context)] : []),
  ];
  return { clave: 'toma', titulo: 'Condiciones de la última toma', datos };
}

/** Las respuestas de salud de formularios que el criterio del área no nombra (un formulario propio, otra versión). */
function otrosDeSalud(formularios: readonly FormularioEnElContexto[], usados: ReadonlySet<string>): DatoImportante[] {
  const datos: DatoImportante[] = [];
  const vistos = new Set<string>();
  for (const f of [...formularios].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))) {
    for (const s of f.sections) {
      for (const r of s.answers) {
        if (r.category !== 'SALUD_Y_SEGURIDAD' || usados.has(r.fieldCode) || vistos.has(r.fieldCode) || !seCita(r.fieldCode)) continue;
        vistos.add(r.fieldCode);
        const h: Hallada = { respuesta: r, formulario: f, fuente: fuenteDeFormulario(f) };
        const cita = citaDe(h, r.label);
        datos.push({ clave: r.fieldCode, pregunta: r.label, respuesta: r.text, fuente: h.fuente, citas: cita ? [cita] : [], sensible: false, nota: null });
      }
    }
  }
  return datos;
}

/**
 * «Lo importante» del área: los grupos en orden de seguridad (CTX-D05), cada uno solo con lo respondido. Un grupo sin
 * respuestas no aparece. `fecha` y `hora` escriben un instante como lo escribe la pantalla, y `nombre` a un profesional (con
 * «Ocultar nombres», su referencia; sin `nombre`, el que trae la API).
 */
export function loImportante(
  area: Alcance,
  entradas: { readonly formularios: readonly FormularioEnElContexto[]; readonly habitos?: HabitosCompartidos | null; readonly cuerpo?: CuerpoDelContexto | null },
  formato: { readonly fecha: (iso: string) => string; readonly hora: (iso: string) => string; readonly nombre?: (actor: TomaEnElContexto['author']) => string },
): GrupoImportante[] {
  const buscar = buscador(area, entradas.formularios, entradas.habitos ?? null);
  const grupos: GrupoImportante[] = [];
  const usados = new Set<string>();
  if (area === 'ANTROPOMETRIA' && entradas.cuerpo?.latest) grupos.push(datosDeLaToma(entradas.cuerpo.latest, formato.fecha, formato.hora, formato.nombre ?? ((a) => a.displayName)));
  for (const g of GRUPOS[area]) {
    const datos: DatoImportante[] = [];
    if (g.parq) {
      datos.push(...datosDelParq(buscar));
      for (const p of PARQ) for (const c of [...p.codigos, ...(p.detalle ?? [])]) usados.add(c);
    }
    for (const p of g.preguntas) {
      for (const c of [...p.codigos, ...(p.detalle ?? [])]) usados.add(c);
      const d = datoDe(p, buscar);
      if (d) datos.push(d);
    }
    if (datos.length > 0) grupos.push({ clave: g.clave, titulo: g.titulo, datos });
  }
  // Lo de salud que el criterio no nombra, de los formularios propios: nunca se pierde un dato de seguridad.
  const otros = otrosDeSalud(entradas.formularios, usados);
  if (otros.length > 0) grupos.push({ clave: 'otros-salud', titulo: area === 'ANTROPOMETRIA' ? 'De salud, en tus formularios' : 'Otros datos de salud', datos: otros });
  return grupos;
}

/** El formulario que conviene pedir si «Lo importante» está vacío, por área. */
export const FORMULARIO_PARA_PEDIR: Readonly<Record<Alcance, string | null>> = { ENTRENAMIENTO: 'Antes de entrenar', NUTRICION: 'Cómo comés hoy', ANTROPOMETRIA: null };

// ─── «Formularios»: las respuestas completas y el buscador ─────────────────────────────────────

export interface RenglonDeFormulario {
  readonly clave: string;
  readonly pregunta: string;
  readonly respuesta: string;
  readonly cita: CitaPosible | null;
  readonly sensible: boolean;
}

/**
 * Las respuestas de un formulario, sección por sección, para la pestaña «Formularios». La conducta alimentaria no se cita y
 * se rotula «Conducta alimentaria», sin los nombres de trastornos que trae la pregunta (CTX-D09).
 */
export function renglonesDelFormulario(f: FormularioEnElContexto): { readonly titulo: string; readonly renglones: readonly RenglonDeFormulario[] }[] {
  const fuente = fuenteDeFormulario(f);
  return f.sections
    .filter((s) => s.answers.length > 0)
    .map((s) => ({
      titulo: s.title,
      renglones: s.answers.map((r) => {
        const sensible = !seCita(r.fieldCode);
        return {
          clave: `${f.formResponseId}#${r.fieldCode}`,
          pregunta: sensible ? COPY_CONTEXTO.conductaAlimentaria : r.label,
          respuesta: sensible && r.answer.type === 'CHOICE' ? (TCA_EN_PALABRAS[r.answer.option] ?? r.text) : r.text,
          cita: sensible ? null : citaDe({ respuesta: r, formulario: f, fuente }, r.label),
          sensible,
        };
      }),
    }));
}

/**
 * El buscador de «Formularios»: cada palabra tiene que estar en la pregunta, la respuesta, la sección o el nombre del
 * formulario, sin importar mayúsculas ni tildes. Vacío: todo. Devuelve los formularios con solo lo que coincide.
 */
export function buscarEnFormularios(formularios: readonly FormularioEnElContexto[], consulta: string): FormularioEnElContexto[] {
  const palabras = normalizarTexto(consulta).split(' ').filter(Boolean);
  if (palabras.length === 0) return [...formularios];
  const coincide = (...textos: string[]) => {
    const todo = normalizarTexto(textos.join(' '));
    return palabras.every((p) => todo.includes(p));
  };
  return formularios
    .map((f) => ({
      ...f,
      // Lo sensible se busca por lo que muestra la pantalla («Conducta alimentaria»), no por la pregunta ni por la respuesta.
      sections: f.sections
        .map((s) => ({ ...s, answers: s.answers.filter((r) => (seCita(r.fieldCode) ? coincide(r.label, r.text, s.title, f.templateName) : coincide(COPY_CONTEXTO.conductaAlimentaria, s.title, f.templateName))) }))
        .filter((s) => s.answers.length > 0),
    }))
    .filter((f) => f.sections.length > 0);
}

export const cantidadDeRespuestas = (formularios: readonly FormularioEnElContexto[]): number => formularios.reduce((n, f) => n + f.sections.reduce((m, s) => m + s.answers.length, 0), 0);

// ─── El cuerpo: el cambio entre dos tomas (CTX-D14 y CTX-D15) ──────────────────────────────────

/** Un valor de una toma con lo que hace falta para compararlo (REG-06-162). */
export interface ValorComparable extends ValorDeLaToma {
  readonly protocolVersionId: string;
  readonly methodVersionId: string | null;
}

/** Redondea sin arrastrar el error del punto flotante (0,1 + 0,2). */
const redondear = (x: number, decimales: number): number => Math.round(x * 10 ** decimales) / 10 ** decimales;

/**
 * Las métricas de dos tomas: el cambio solo si las dos tienen valor y son comparables (mismo protocolo, método y unidad).
 * El «%» lleva su base (el valor anterior) y es `null` si la base es cero. Las métricas van en el orden del catálogo, y las
 * que no están en él, al final, por código.
 */
export function metricasDelCuerpo(ultima: ReadonlyMap<string, ValorComparable>, anterior: ReadonlyMap<string, ValorComparable>): MetricaDelCuerpo[] {
  const orden = Object.keys(NOMBRE_DE_METRICA);
  const posicion = (m: string) => {
    const i = orden.indexOf(m);
    return i < 0 ? orden.length : i;
  };
  const codigos = [...new Set([...ultima.keys(), ...anterior.keys()])].sort((a, b) => posicion(a) - posicion(b) || a.localeCompare(b));
  const sinFicha = ({ protocolVersionId: _p, methodVersionId: _m, ...v }: ValorComparable): ValorDeLaToma => v;
  return codigos.map((metricCode) => {
    const u = ultima.get(metricCode) ?? null;
    const a = anterior.get(metricCode) ?? null;
    const motivos: ('PROTOCOL' | 'METHOD' | 'UNIT')[] = [];
    if (u && a) {
      if (u.protocolVersionId !== a.protocolVersionId) motivos.push('PROTOCOL');
      if (u.methodVersionId !== a.methodVersionId) motivos.push('METHOD');
      if (u.unit !== a.unit) motivos.push('UNIT');
    }
    const change =
      u && a && motivos.length === 0
        ? { value: redondear(u.value - a.value, 4), unit: u.unit, percent: a.value === 0 ? null : redondear(((u.value - a.value) / a.value) * 100, 2), base: a.value }
        : null;
    return { metricCode, latest: u ? sinFicha(u) : null, previous: a ? sinFicha(a) : null, change, notComparableBecause: motivos };
  });
}

const POR_QUE_NO_SE_COMPARA: Readonly<Record<'PROTOCOL' | 'METHOD' | 'UNIT', string>> = { PROTOCOL: 'otro protocolo', METHOD: 'otro método', UNIT: 'otra unidad' };
export const motivosDelCuerpoEnPalabras = (motivos: readonly ('PROTOCOL' | 'METHOD' | 'UNIT')[]): string => motivos.map((m) => POR_QUE_NO_SE_COMPARA[m]).join(', ');

/**
 * El cambio en palabras, con su signo y su unidad, y el «%» con su base (Dirección, 2026-11-18): «−1,2 kg (−1,5 % de 80
 * kg)». `numero` escribe un número como la pantalla (coma decimal). Sin «mejor» ni «peor».
 */
export function cambioDelCuerpoEnPalabras(c: NonNullable<MetricaDelCuerpo['change']>, numero: (x: number) => string): string {
  const { diferencia, porcentaje } = partesDelCambio(c, numero);
  return porcentaje === null ? diferencia : `${diferencia} (${porcentaje})`;
}

/** El cambio en dos partes, para dos renglones: la diferencia con su signo, y el «%» con su base (`null` si la base es cero). */
export function partesDelCambio(c: NonNullable<MetricaDelCuerpo['change']>, numero: (x: number) => string): { readonly diferencia: string; readonly porcentaje: string | null } {
  const signo = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '');
  return {
    diferencia: `${signo(c.value)}${numero(Math.abs(c.value))} ${c.unit}`,
    porcentaje: c.percent === null ? null : `${signo(c.percent)}${numero(Math.abs(c.percent))} % de ${numero(c.base)} ${c.unit}`,
  };
}
