/**
 * Copy de antropometría, compartido por el website y el APK (B10-07 v0.7.1 y la adenda v0.5 de métodos y cálculos).
 *
 * Tres reglas mandan sobre todo el texto:
 * - **medido ≠ informado ≠ calculado**, y se dice en pantalla: «La Antropometría deberá distinguir mediciones
 *   directas, resultados derivados y correcciones» (04:1090);
 * - **anular no es borrar**: «en anulación, mostrar acción destructiva no: debe explicitar que preserva historia»
 *   (08 §56.12);
 * - **sin dato es sin dato**: nunca cero, nunca una línea que cruce el hueco (INV-06-176/177).
 *
 * `TERMINOS_PROHIBIDOS_DE_ANTROPOMETRIA` lo verifica una prueba sobre este copy y sobre el texto de las pantallas,
 * igual que en nutrición (T13 de WP-04, extendido en WP-05).
 */

export const COPY_ANTROPOMETRIA = {
  // ─── Pestaña y estados ────────────────────────────────────────────────────────────────────────
  pestana: 'Antropometría',
  sinEvaluaciones: 'Todavía no hay evaluaciones registradas.',
  sinBorrador: 'No hay ninguna evaluación en preparación.',
  borradorEnCurso: 'Evaluación en preparación',
  borradorNoEsHistoria: 'Una evaluación en preparación no forma parte de la historia: no aparece en la evolución ni como última evaluación registrada.',
  evaluacionRegistrada: 'Evaluación registrada',
  soloLectura: 'Solo lectura',

  // ─── Captura ──────────────────────────────────────────────────────────────────────────────────
  nuevaEvaluacion: 'Nueva evaluación',
  retomarBorrador: 'Retomar la evaluación en preparación',
  agregarMedicion: 'Agregar medición',
  quitarMedicion: 'Quitar medición',
  metrica: 'Qué se midió',
  valor: 'Valor',
  unidad: 'Unidad',
  protocolo: 'Protocolo',
  momentoDeLaToma: 'Cuándo se tomó',
  origenDelDato: 'Cómo se obtuvo',
  guardarBorrador: 'Guardar',
  guardado: 'Guardado',
  cambiosSinGuardar: 'Cambios sin guardar',
  medicionIncompleta: 'Hay una medición sin completar. Cada medición necesita qué se midió, el valor, la unidad y cuándo se tomó. Completala o quitala antes de guardar.',

  // ─── Registrar ────────────────────────────────────────────────────────────────────────────────
  registrarEvaluacion: 'Registrar evaluación',
  confirmarRegistro: 'Registrar esta evaluación',
  explicacionDeRegistro:
    'Al registrarla pasa a formar parte de la historia del asesorado y de su evolución. Después no se edita: si hace falta cambiar un valor, se corrige o se anula la medición, y queda constancia.',
  sinContenidoRegistrable: 'Una evaluación sin mediciones no se puede registrar.',
  registroHecho: 'Evaluación registrada. Ya forma parte de la evolución.',
  yaRegistrada: 'Esta evaluación ya está registrada. Para cambiar un valor, corregí o anulá la medición.',

  // ─── Clases del dato (04:1090) ────────────────────────────────────────────────────────────────
  medido: 'Medido',
  informado: 'Reportado',
  calculado: 'Calculado',
  explicacionDeClases: 'Medido lo tomó el profesional; Reportado lo informó la persona; Calculado lo derivó BE con un método declarado.',

  // ─── Cálculo derivado ─────────────────────────────────────────────────────────────────────────
  resultadosDerivados: 'Resultados calculados',
  metodoYVersion: 'Método y versión',
  entradasDelCalculo: 'Con qué se calculó',
  precisionDeclarada: 'Precisión declarada',
  noEsDiagnostico: 'Un resultado calculado no es un diagnóstico ni una causa: es una derivación con su método a la vista.',
  corridaReemplazada: 'Reemplaza a un cálculo anterior, que se conserva.',
  sinSucesor: 'No se pudo recalcular: falta una medición vigente. No se reemplaza por cero.',

  // ─── Métodos y cálculos (06 §20.3) ────────────────────────────────────────────────────────────
  calculos: 'Cálculos',
  nuevoCalculo: 'Calcular con un método',
  metodo: 'Método',
  versionDelMetodo: 'Versión',
  reglaAplicada: 'Regla aplicada',
  entradasDelMetodo: 'Qué necesita este método',
  elegirEntrada: 'Con qué medición',
  finalidadDelCalculo: 'Para qué se calcula',
  ejecutarCalculo: 'Calcular',
  calculoHecho: 'Cálculo registrado. Queda con su método, su versión y sus entradas a la vista.',
  sinCalculos: 'Todavía no hay cálculos para esta evaluación.',
  sinMetodosSeleccionables: 'No hay métodos seleccionables en el catálogo.',
  metodoHistorico: 'Versión anterior del método. Se conserva para poder explicar los cálculos que la usaron.',
  explicacionDeCoexistencia:
    'Los cálculos conviven: BE no los promedia, no los ordena por mejor y no elige uno. Si querés dejar uno como referencia, lo elegís vos y queda registrado.',
  explicacionDeAdmisibilidad:
    'Que una medición exista no alcanza: cada versión del método declara qué necesita, en qué unidad y obtenida de qué manera. Si algo no corresponde, el cálculo no se hace.',
  entradaNoAdmisible: 'Esta medición no corresponde a lo que el método declara.',
  referenciaAdoptada: 'Referencia',
  adoptarReferencia: 'Dejar como referencia',
  fundamentoDeLaReferencia: 'Por qué esta',
  referenciaHecha: 'Referencia registrada. Los demás cálculos se conservan.',
  yaEsReferencia: 'Este cálculo ya era la referencia.',
  explicacionDeReferencia:
    'Dejar un cálculo como referencia no cambia el cálculo ni borra los otros, y no crea un objetivo ni una prescripción. La decisión sigue siendo tuya y queda registrada con su fecha.',
  referenciaReemplazada: 'Reemplaza a la referencia anterior, que se conserva.',
  calculoEnPreparacion: 'De una evaluación en preparación',
  calculoNoVigente: 'Sin efecto',
  explicacionDeCalculoNoVigente:
    'Este cálculo dejó de tener efecto: alguna de sus entradas se anuló, o lo reemplazó un cálculo posterior. Se conserva porque es parte de la historia.',
  valorNoConsultable: 'Valor no disponible para vos',

  // ─── Corregir ─────────────────────────────────────────────────────────────────────────────────
  corregirMedicion: 'Corregir medición',
  motivoDeCorreccion: 'Por qué se corrige',
  valorOriginal: 'Valor original',
  valorVigente: 'Valor vigente',
  correccionHecha: 'Corrección registrada. El valor original se conserva.',
  historialDeCorrecciones: 'Correcciones',
  cadenaNoResoluble: 'La historia de correcciones de esta medición no se puede resolver. No se muestra un valor vigente hasta que se revise.',

  // ─── Anular (08 §56.12) ───────────────────────────────────────────────────────────────────────
  anularMedicion: 'Anular medición',
  motivoDeAnulacion: 'Por qué se anula',
  explicacionDeAnulacion:
    'Anular no borra nada: la medición y su historia se conservan, con el motivo y quién la anuló. Deja de contar para la evolución y para los cálculos.',
  confirmarAnulacion: 'Anular esta medición',
  anulacionHecha: 'Medición anulada. Su historia se conserva.',
  yaAnulada: 'Esta medición ya estaba anulada.',
  sinReversion: 'Una medición anulada no se reactiva. Si hay una observación nueva, se registra como una medición nueva.',
  anulada: 'Anulada',
  vigente: 'Vigente',

  // ─── Evolución ────────────────────────────────────────────────────────────────────────────────
  evolucion: 'Evolución',
  miEvolucion: 'Mi evolución',
  periodo: 'Período',
  sinDato: 'Sin dato',
  explicacionDeSinDato: 'Los días sin medición aparecen como «Sin dato». No se completan con cero ni se unen con una línea.',
  sinMediciones: 'Todavía no hay mediciones registradas en este período.',
  noComparable: 'No comparable con el punto anterior',
  motivoNoComparable: {
    PROTOCOL: 'Se tomó con otro protocolo',
    METHOD: 'Se calculó con otro método',
    UNIT: 'Está en otra unidad',
  },
  explicacionDeComparabilidad: 'Dos mediciones se comparan solo si comparten protocolo, método y unidad. Cuando no, se muestran igual, señaladas.',
  catalogoSintetico: 'Catálogo BE con protocolos y métodos sintéticos de demostración.',
} as const;

export const ETIQUETA_DE_CLASE_DE_DATO = {
  MEASURED: COPY_ANTROPOMETRIA.medido,
  REPORTED: COPY_ANTROPOMETRIA.informado,
  DERIVED: COPY_ANTROPOMETRIA.calculado,
} as const;

export const ETIQUETA_DE_ORIGEN = {
  DIRECT_CAPTURE: 'Medición del profesional',
  SELF_REPORTED: 'Lo informó la persona',
  CONTROLLED_IMPORT: 'Importado con procedencia',
} as const;

export const ETIQUETA_DE_CONDICION = {
  EFFECTIVE: COPY_ANTROPOMETRIA.vigente,
  ANNULLED: COPY_ANTROPOMETRIA.anulada,
} as const;

export const ETIQUETA_DE_REDONDEO = {
  HALF_UP: 'Medio hacia arriba',
  DOWN: 'Hacia abajo',
  UP: 'Hacia arriba',
} as const;

/**
 * Términos que no pueden aparecer en ningún texto de antropometría. Además de los de nutrición, acá se prohíben los
 * que insinúan que un hueco es un valor o que un derivado es un diagnóstico (INV-06-176/177; RF-048, RF-049).
 */
export const TERMINOS_PROHIBIDOS_DE_ANTROPOMETRIA: readonly string[] = [
  'diagnóstico',
  'diagnostico',
  'estimado automáticamente',
  'valor estimado en cero',
  'interpolado',
  'imputado',
  'se completó',
  'tendencia automática',
  'peso ideal',
  'sobrepeso',
  'obesidad',
  'bajo peso',
  'normal',
  'anormal',
  'score',
  'puntaje',
  'eliminar medición',
  'borrar medición',
];

/**
 * Lo que está prohibido es **presentar** un resultado como un diagnóstico, un juicio o un hueco completado. Decir
 * que algo **no** lo es no está prohibido: es justamente lo que pide RF-048 («no se presenta como diagnóstico ni
 * causalidad»). Por eso una aparición negada explícitamente no cuenta como hallazgo.
 */
const NEGACIONES = ['no es un ', 'no es una ', 'ni un ', 'ni una ', 'no constituye ', 'no son ', 'nunca es ', 'no se completan con ', 'no hay '];

/** Devuelve los términos prohibidos que aparecen en un texto (palabras completas para las cortas). */
export function terminosProhibidosDeAntropometriaEn(texto: string): string[] {
  const t = texto.toLowerCase();
  const negado = (termino: string): boolean => {
    const i = t.indexOf(termino);
    return i >= 0 && NEGACIONES.some((n) => t.slice(Math.max(0, i - n.length), i) === n);
  };
  return TERMINOS_PROHIBIDOS_DE_ANTROPOMETRIA.filter((p) => {
    const aparece = p.length <= 7 && /^[a-záéíóúñ]+$/.test(p) ? new RegExp(`(^|[^a-záéíóúñ])${p}([^a-záéíóúñ]|$)`).test(t) : t.includes(p);
    return aparece && !negado(p);
  });
}
