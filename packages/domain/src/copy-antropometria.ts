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
  finalidadDeCalculo: { ANTHROPOMETRIC_SUPPORT: 'Soporte antropométrico', NUTRITION_OBJECTIVE_SUPPORT: 'Soporte de un objetivo nutricional' } as Record<string, string>,
  decimales: (n: number): string => `${n} ${n === 1 ? 'decimal' : 'decimales'}`,
  ejecutarCalculo: 'Calcular',
  // DL-111 · la ficha del método al elegirlo
  metodoPide: 'Pide',
  metodoDa: 'Da',
  metodoFuente: 'Fuente',
  metodoPoblacion: 'Población en que se validó',
  datoFalta: 'Falta en esta toma',
  datoEnOtraUnidad: 'Está en otra unidad en esta toma',
  datoSinValorVigente: 'No tiene un valor vigente en esta toma',
  metodosPosibles: 'Se pueden calcular con esta toma',
  metodosConDatosFaltantes: 'Les faltan datos de esta toma',
  asignacionAutomatica: 'Cada dato se toma de la medición de esta toma con la misma clave. Podés cambiarlo.',
  categoriaDeMetodo: { INDICES: 'Índices', SUMAS_DE_PLIEGUES: 'Sumas de pliegues', GRASA_CORPORAL: 'Grasa corporal', MASAS: 'Masas corporales', SOMATOTIPO: 'Somatotipo' } as Record<string, string>,
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
  sinValorVigente: 'Sin valor vigente',

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
  // DL-115 · con el A3 revocado o nunca otorgado, la evolución propia no se lee (08:406). No es «sin datos»: los datos
  // siguen guardados y vuelven a verse con un A3 nuevo.
  irAPrivacidad: 'Ir a Privacidad y consentimientos',
  evolucionNecesitaA3: 'Para ver tu evolución necesitás tener activo el consentimiento de datos de salud. Tus mediciones no se borraron: vuelven a verse cuando lo actives de nuevo.',
  periodo: 'Período',
  sinDato: 'Sin dato',
  explicacionDeSinDato: 'Los días sin medición aparecen como «Sin dato». No se completan con cero ni se unen con una línea.',
  sinMediciones: 'Todavía no hay mediciones registradas en este período.',
  comparableConElAnterior: 'Comparable con el punto anterior',
  corregida: 'Corregida',
  vistaParcial:
    'Esta evolución se armó con lo que vos podés consultar. El asesorado tiene evaluaciones de otro profesional en este período: existen, y no se muestran acá.',
  noComparable: 'No comparable con el punto anterior',
  motivoNoComparable: {
    PROTOCOL: 'Se tomó con otro protocolo',
    METHOD: 'Se calculó con otro método',
    UNIT: 'Está en otra unidad',
  },
  explicacionDeComparabilidad: 'Dos mediciones se comparan solo si comparten protocolo, método y unidad. Cuando no, se muestran igual, señaladas.',
  catalogoSintetico: 'Catálogo BE con protocolos y métodos sintéticos de demostración.',

  // ─── Última toma y resultados de las fórmulas (APK y lámina; DL-111) ─────────────────────────
  tuUltimaToma: 'Tu última toma',
  ultimaToma: 'Última toma',
  tomaDel: 'Toma del',
  comparadaCon: 'Comparada con la toma anterior del',
  antes: 'Antes',
  diferencia: 'Diferencia',
  sinAnteriorComparable: 'Sin una toma anterior comparable en el período',
  explicacionDeDiferencia:
    'La diferencia es una resta entre dos tomas comparables: mismo protocolo, método y unidad. Dice cuánto cambió cada medida, sin calificar el cambio.',
  resultadosDeLasFormulas: 'Resultados de las fórmulas',
  explicacionDeResultados:
    'Los calcula tu profesional a partir de las mediciones de la toma, con el método que elige. Cada resultado dice con qué método salió: dos métodos distintos no se comparan entre sí.',
  metodoDelResultado: 'Método',
  metodoSinNombre: 'Un método de cálculo elegido por tu profesional',
  evolucionPorMedida: 'Evolución por medida',
  verEvolucion: 'Ver evolución',
  ocultarEvolucion: 'Ocultar evolución',
  figura: 'Figura',
  figuraHombre: 'Hombre',
  figuraMujer: 'Mujer',
  explicacionDeFigura: 'La figura ubica dónde se tomó cada medida. Elegí la que prefieras ver: no cambia ningún dato.',
  perimetrosEnLaFigura: 'Perímetros',
  plieguesEnLaFigura: 'Pliegues',
  medidasDeLaFigura: 'Medidas en la figura',
  numerosDeLaFigura: 'Cada número de la figura, con su valor',
  otrasMedidas: 'Otras medidas de la toma',

  // ─── Lámina (compositor de Dirección v13.3, en el website del profesional; DL-111) ───────────
  lamina: 'Lámina',
  verLamina: 'Ver lámina',
  explicacionDeLamina:
    'La lámina arma con los datos registrados la del compositor de Dirección: ubica cada medida sobre la figura y no califica ningún valor. Los datos completos siguen en el detalle de cada evaluación.',
  laminaModo: 'Modo',
  laminaEncuadre: 'Encuadre',
  laminaTema: 'Tema de la lámina',
  laminaTemaPropio: 'El tema es solo de la lámina: no cambia la apariencia del website.',
  laminaHojas: { CIRCUNFERENCIAS: 'Circunferencias', PLIEGUES: 'Pliegues', CONCLUSIONES: 'Conclusiones' },
  laminaModos: { MEDICION: 'Medición', SERIE: 'Serie' },
  laminaEncuadres: { ENTERO: 'Entero', TREN_SUPERIOR: 'Tren superior', TREN_INFERIOR: 'Tren inferior' },
  laminaTemas: { CLARO: 'Claro', OSCURO: 'Oscuro', AZUL: 'Azul' },
  laminaToma: 'Toma',
  laminaTomasDeLaSerie: 'Tomas de la serie',
  laminaAyudaDeLaSerie: 'Hasta ocho tomas registradas. En la lámina van por fecha: T1 es la más antigua.',
  laminaSerieSinEntero: 'En Serie la figura va en tren superior o inferior, como en el compositor.',
  laminaSeriesEnLaLamina: 'Qué va en la lámina',
  laminaAyudaDeSeries: 'Hasta ocho. Cada resultado calculado es una serie por método y versión: dos métodos no se comparan entre sí.',
  descargarImagen: 'Descargar imagen',
  preparandoImagen: 'Preparando la imagen…',
  imagenDescargada: 'La imagen se descargó.',
  imagenNoSePudo: 'No se pudo preparar la imagen. Probá de nuevo.',
  laminaSinMedidasTitulo: 'Sin medidas para mostrar',
  laminaSinMedidas: 'Esta toma no tiene medidas para este encuadre.',
  laminaSinResultadosTitulo: 'Sin resultados calculados',
  laminaSinResultados: 'Todavía no hay resultados calculados para esta toma.',
  laminaComoCalcular: 'Se calculan desde el detalle de la evaluación, en «Cálculos».',
  laminaResultadosCalculados: 'Resultados calculados, cada uno con su método',
  laminaDatosDeLaToma: 'Datos de la toma',
  laminaOtrosCalculos: 'Otros cálculos',
  laminaPosterior: 'posterior',
  laminaPlieguesEnLaFigura: 'Pliegues en la figura',
  laminaSumaDeSietePliegues: 'Suma 7 pliegues (JP)',
  laminaSinCalcular: 'Sin calcular',
  laminaNoComparables: 'No comparables',
  laminaEvolucionAntropometrica: 'Evolución antropométrica',
  laminaTomas: 'tomas',
  laminaElegiTomasTitulo: 'Serie sin tomas',
  laminaElegiTomas: 'Elegí al menos una toma para armar la serie.',
  laminaSerieSinMedidas: 'Las tomas elegidas no tienen medidas para este encuadre.',
  laminaEvolucionSinSeries: 'Las tomas elegidas no tienen peso, cintura ni resultados calculados.',
  laminaSinSitio: 'Sin sitio en la figura',
  laminaEnOtroEncuadre: 'Con valor, en otro encuadre',
  laminaRepetidas: 'Con más de una medición vigente en la toma (la lámina muestra la más reciente)',
  laminaCalculosSinEfecto:
    'Los cálculos sin efecto (reemplazados o con una entrada anulada) no van en la lámina; se conservan en el detalle de la evaluación.',
  laminaNoEntran: 'No entran en la lámina (están en el detalle de la evaluación)',
  laminaSeriesQueNoVan: 'Series que no van en la lámina',
  laminaListaIncompleta: 'La lista de cálculos llegó incompleta: puede faltar alguno.',
  laminaExplicacionDeResta:
    'La diferencia es una resta entre la primera y la última toma con dato, y se hace solo si comparten protocolo, método y unidad; si no, la tarjeta dice «No comparables». No califica el cambio, y una toma sin dato corta la línea.',
  laminaTomaNoCargo: 'No se pudo cargar una de las tomas.',
  laminaEvaluacionPedidaNoEsta: 'La evaluación pedida no está entre las registradas: se muestra la más reciente.',
  laminaImagen: 'Imagen de la lámina',
  laminaMedidasEnLaFigura: 'medidas ubicadas sobre la figura',
  laminaResultadosEnLaImagen: 'resultados calculados',
  laminaSeriesEnLaImagen: 'series con sus valores por toma',
  laminaDatosEnElDetalle: 'Los valores completos están en el detalle de cada evaluación.',
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
