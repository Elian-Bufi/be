/**
 * Los conceptos frecuentes de una evaluación (DL-146; análisis del espacio profesional del 2026-10-18: el formulario
 * arrancaba con «Concepto» y «Valor» en blanco). Son atajos para escribir el concepto y su unidad: no son un instrumento
 * clínico ni preguntas del legajo, y el profesional decide qué registrar y con qué fuente (DL-048, opción A; DL-100).
 */
export interface ConceptoFrecuente {
  readonly concepto: string;
  /** La unidad en que se suele escribir, o vacía si el valor es un texto. */
  readonly unidad: string;
}

export const COPY_DE_LA_EVALUACION = {
  /** El rótulo de los atajos, antes de la lista. */
  paraEmpezar: 'Para empezar',
  /** Lo opcional de una evaluación, plegado: el contexto y las notas del profesional. */
  contextoYNotas: 'Contexto y notas (opcional)',
} as const;

export const CONCEPTOS_FRECUENTES_DE_ENTRENAMIENTO: readonly ConceptoFrecuente[] = [
  { concepto: 'Lo que quiere lograr', unidad: '' },
  { concepto: 'Experiencia entrenando', unidad: '' },
  { concepto: 'Días disponibles por semana', unidad: 'días' },
  { concepto: 'Tiempo por sesión', unidad: 'min' },
  { concepto: 'Dónde entrena', unidad: '' },
  { concepto: 'Lesiones o molestias', unidad: '' },
  { concepto: 'Peso corporal', unidad: 'kg' },
];

export const CONCEPTOS_FRECUENTES_DE_NUTRICION: readonly ConceptoFrecuente[] = [
  { concepto: 'Lo que quiere lograr', unidad: '' },
  { concepto: 'Peso', unidad: 'kg' },
  { concepto: 'Talla', unidad: 'cm' },
  { concepto: 'Comidas por día', unidad: '' },
  { concepto: 'Alergias o intolerancias', unidad: '' },
  { concepto: 'Lo que no come', unidad: '' },
  { concepto: 'Actividad física', unidad: '' },
];
