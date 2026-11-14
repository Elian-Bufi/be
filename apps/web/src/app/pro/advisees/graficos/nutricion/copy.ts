/**
 * Los textos de los gráficos de Nutrición (WP-GRAFICOS fase 2, rama C; DL-174): GR-11 a GR-14. Ubican, nunca califican,
 * y dicen lo que BE sabe de cada día: «con cantidades en todos sus registros y sin comidas del plan sin registro», nunca
 * que un día esté entero (DL-153). Lo de la persona es lo **registrado**: el subregistro es sistemático (Hill y Davies,
 * 2001). Sin el signo de porcentaje, sin «desvío» y sin juicios: los recorre la guardia unida de los gráficos
 * (`terminosProhibidosEnUnGrafico`, TEST-GRF-055).
 */

/** Uno o varios, con su palabra: «1 registro», «3 registros». */
export const contar = (n: number, uno: string, varios: string): string => `${n.toLocaleString('es-AR')} ${n === 1 ? uno : varios}`;

/** «a», «a y b», «a, b y c». */
export function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

export const COPY_NUTRICION_EN_GRAFICOS = {
  // ─── Lo que BE sabe de un día (las marcas, la lectura y la tabla) ─────────────────────────────
  conTodo: 'con cantidades en todos sus registros y sin comidas del plan sin registro',
  sinSaber: (motivo: string) => `con cantidades en todos sus registros; no se puede saber si faltan comidas (${motivo})`,
  motivoSinPlan: 'no regía un plan',
  motivoSinDiaTipo: 'el plan tiene más de un día tipo y ningún registro dice cuál',
  subtotal: (queFalta: string) => `subtotal: ${queFalta}`,
  sinValor: (queFalta: string) => `sin valor: ${queFalta}`,
  hoyEnCurso: 'hoy, el día sigue en curso',
  cargadoDespues: 'cargado después',
  algoQueFalta: 'falta un dato',
  /** Lo que falta en un día, por motivo (`missing` de API-PRJ-01). */
  faltante: {
    SIN_CANTIDADES: ['registro sin cantidades', 'registros sin cantidades'],
    COMIDA_DIFERENTE_SIN_CANTIDADES: ['comida diferente sin cantidades', 'comidas diferentes sin cantidades'],
    SIN_DATO_DEL_NUTRIENTE: ['registro sin el dato de este nutriente', 'registros sin el dato de este nutriente'],
    COMIDA_DEL_PLAN_SIN_REGISTRO: ['comida del plan sin registro', 'comidas del plan sin registro'],
    SIN_TOMA_ANTERIOR: ['día sin una toma de peso anterior', 'días sin una toma de peso anterior'],
  } as Readonly<Record<string, readonly [string, string]>>,

  // ─── GR-11 · las temporadas ──────────────────────────────────────────────────────────────────
  temporadas: 'Temporadas',
  temporadaDelPlan: (version: string, desde: string) => `Plan ${version} · desde el ${desde}`,
  temporadaDelPlanCorta: (version: string) => `Plan ${version}`,
  temporadaDelObjetivo: (desde: string) => `Objetivo desde el ${desde}`,
  temporadaDelObjetivoCorta: 'Objetivo',
  proporcion: (nombre: string, desde: string, texto: string) => `${nombre}, objetivo desde el ${desde}: ${texto}.`,
  sinObjetivo: 'sin objetivo',
  objetivoEnLaCelda: (texto: string) => `objetivo ${texto}`,

  // ─── La leyenda ──────────────────────────────────────────────────────────────────────────────
  leyenda: {
    conTodo: 'Con cantidades en todos sus registros y sin comidas del plan sin registro: lleno',
    subtotal: 'Subtotal, con algo que falta: hueco',
    sinSaber: 'No se puede saber si faltan comidas: contorno cortado',
    tarde: 'Cargado después: una muesca arriba de la marca',
    objetivo: 'Objetivo del profesional: línea discontinua',
    media: 'Media de la semana: tramo continuo',
    indicado: 'Indicado en el plan: rombo hueco',
    diferencia: 'Lo indicado y lo registrado del mismo día, unidos: la diferencia va escrita',
    conOpcion: 'Comida con la opción del plan: cuadrado lleno',
    comidaDiferente: 'Comida con una comida diferente: cuadrado con una raya',
    sinRegistro: 'Comida sin registro: guion',
    temporada: 'Cada versión del plan, de fondo; una línea fina donde cambia el plan o el objetivo',
  },

  // ─── Lo común de las notas ───────────────────────────────────────────────────────────────────
  metodoDeLaSuma: 'Suma de lo registrado con cantidades (v1)',
  loRegistrado: 'Es lo registrado: si una comida no se registró, o se registró sin cantidades, no está en el número. No es la ingesta real.',
  diaSinRegistros: 'Un día sin registros no es cero: no se dibuja.',
  sinLoCargadoDespues: 'No se pudo leer qué registros se cargaron después: las marcas no lo dicen.',
  sinRegistrosEnElPeriodo: 'Sin registros de comida en estas fechas.',

  // ─── GR-12 · las calorías por día ────────────────────────────────────────────────────────────
  energia: {
    titulo: 'Calorías registradas por día',
    pregunta: '¿Cuántas calorías registró cada día, y qué se sabe de cada día?',
    panel: 'Calorías registradas',
    columnaObjetivo: 'Objetivo del profesional',
    columnaMedia: 'Media de su semana',
    unidadPorDia: 'kcal por día',
    metodoDeLaMedia: (minimo: number) =>
      `Media de la semana (v1): el promedio de los días de esa semana con cantidades en todos sus registros, si son ${minimo} o más. Cada media dice con qué días se hizo y cuáles quedaron afuera, y por qué: promediar solo los días registrados con cuidado deja afuera a los otros. Hoy no cuenta: el día sigue en curso.`,
  },
  media: {
    valor: (valor: string, conCuantos: string) => `${valor} por día de media · ${conCuantos}`,
    sinMedia: (minimo: number, conCuantos: string) => `sin media: hacen falta ${minimo} días con cantidades en todos sus registros · ${conCuantos}`,
    conDias: (incluidos: number, dias: number) => `con ${incluidos.toLocaleString('es-AR')} de ${contar(dias, 'día', 'días')}`,
    sinRegistro: (n: number) => `${n.toLocaleString('es-AR')} sin registro`,
    conCantidadesFaltantes: (n: number) => `${n.toLocaleString('es-AR')} con cantidades faltantes`,
    conComidasSinRegistro: (n: number) => `${n.toLocaleString('es-AR')} con comidas del plan sin registro`,
    sinSaber: (n: number) => `en ${contar(n, 'día', 'días')} no se puede saber si faltan comidas`,
    hoyAfuera: 'hoy no cuenta',
  },

  // ─── GR-13 · los macronutrientes ─────────────────────────────────────────────────────────────
  macros: {
    titulo: 'Proteínas, carbohidratos, grasas y fibra, cada uno en su panel',
    pregunta: '¿Cómo se movió cada macronutriente registrado de una temporada a otra?',
    sinBarrasApiladas: 'Cada macronutriente va en su panel, con su eje: apilados invitarían a leer proporciones.',
    fibraDesconocida: 'Un registro sin el dato de fibra no es cero: el día queda como subtotal.',
  },
  porKilo: {
    titulo: 'Proteínas, carbohidratos y grasas por kilo de peso',
    pregunta: '¿Cuántos gramos por kilo de peso registró cada día?',
    metodo: 'g/kg con el peso de la toma, v1',
    reglaDelPeso:
      'Cada día se divide por el peso medido en tu última toma de ese día o anterior. Sin una toma anterior, el día no tiene valor: no se usa un peso posterior ni uno inventado.',
    pesoViejo: 'Si el peso cambió desde esa toma, el número no lo sabe: la línea se corta donde cambia el peso usado.',
    pesoUsado: (kg: string, fecha: string) => `peso del ${fecha}: ${kg}`,
    sinPesoAnterior: 'sin una toma de peso anterior',
    pesosUsados: (lista: string) => `Pesos usados: ${lista}.`,
    diasSinPeso: (n: number) =>
      n === 1 ? '1 día con registros no tiene una toma de peso anterior: no tiene valor en g/kg.' : `${contar(n, 'día', 'días')} con registros no tienen una toma de peso anterior: no tienen valor en g/kg.`,
    sinPesos: 'Ninguna de tus tomas hasta estas fechas tiene un peso medido: sin un peso, los gramos por kilo no se calculan.',
    buscadoDesde: (fecha: string) => `El peso anterior se buscó desde el ${fecha}.`,
  },

  // ─── GR-14 · lo indicado y lo registrado ─────────────────────────────────────────────────────
  indicadoYRegistrado: {
    titulo: 'Lo indicado y lo registrado, día por día',
    pregunta: '¿En qué días y en qué comidas lo registrado se aparta de lo indicado, y hacia dónde?',
    tira: 'Comidas del plan',
    columnaComidas: 'Comidas del plan',
    registrado: (texto: string) => `registrado ${texto}`,
    indicado: (texto: string) => `indicado ${texto}`,
    diferencia: (texto: string) => `diferencia ${texto}`,
    sinRegistro: 'sin registro',
    subtotalSinDiferencia: 'sin diferencia escrita: lo registrado es un subtotal',
    sinSaberSinDiferencia: 'sin diferencia escrita: no se puede saber si faltan comidas',
    comoSeLeeLaDiferencia:
      'La diferencia es lo registrado menos lo indicado, en la unidad de cada panel: +18 g quiere decir 18 g más registrados que indicados. Va solo en los días con cantidades en todos sus registros y sin comidas del plan sin registro.',
    comidaDiferenteSinCantidades: 'Una comida diferente sin cantidades no es 0 g: el día queda como subtotal.',
    sinTira: 'No se pudieron leer las comidas de cada día: la tira no está.',
    estadoDeLaComida: { CON_OPCION: 'con la opción del plan', COMIDA_DIFERENTE: 'con una comida diferente', SIN_REGISTRO: 'sin registro' },
    comidasSinPlan: 'sin plan vigente: no se conocen sus comidas',
    comidasSinDiaTipo: 'día tipo sin determinar: no se conocen sus comidas',
    sinRegistros: 'sin registros',
    comidaEnLaCelda: (comida: string, estado: string) => `${comida}: ${estado}`,
  },
} as const;
