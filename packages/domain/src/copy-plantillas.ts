/**
 * Textos de las plantillas del profesional (PF-09; DL-108). Una plantilla es un molde: los textos lo dicen y nunca
 * prometen que el plan «sale solo» ni califican nada (TEST-PRJ-009 se aplica con los términos de entrenamiento).
 */
export const COPY_PLANTILLAS = {
  misPlantillas: 'Mis plantillas',
  plantilla: 'Plantilla',
  descripcion: 'Descripción',
  nombre: 'Nombre',
  guardarComoPlantilla: 'Guardar como plantilla',
  empezarDesdePlantilla: 'Empezar desde una plantilla',
  empezarEnBlanco: 'Empezar en blanco',
  aplicar: 'Crear el borrador desde esta plantilla',
  nuevaVersion: 'Nueva versión de la plantilla',
  archivar: 'Archivar',
  reactivar: 'Reactivar',
  guardar: 'Guardar la plantilla',
  cancelar: 'Cancelar',
  activa: 'Activa',
  archivada: 'Archivada',
  sinPlantillas: 'Todavía no guardaste ninguna plantilla. Se guardan desde una versión de plan, con «Guardar como plantilla».',
  sinPlantillasActivas: 'No tenés plantillas activas para aplicar.',
  /**
   * «Mis plantillas» con el filtro «Estado» puesto y nada que coincida (encargo de consolidación, bloque 5): lo que no hay
   * es una plantilla con ese estado, no una plantilla. El filtro queda a la vista y «Ver todas» lo quita.
   */
  ningunaActiva: 'Ninguna plantilla activa.',
  ningunaArchivada: 'Ninguna plantilla archivada.',
  verTodas: 'Ver todas',
  /** Una lectura de «Mis plantillas» que falla no es «todavía no guardaste ninguna». */
  noSeLeyeronLasDeEntrenamiento: 'No pudimos leer tus plantillas de entrenamiento.',
  noSeLeyeronLasDeComidas: 'No pudimos leer tus plantillas de comidas.',
  /** El diálogo de «Empezar desde una plantilla» (WP-ESCRITORIO-AREAS, parte 5). Una lectura que falla no es «no tenés». */
  noCargaron: 'No pudimos leer tus plantillas',
  elegiUna: 'Elegí la plantilla con la que empieza la versión nueva. Nace como borrador: la persona no la ve hasta que la actives.',
  /**
   * WP-TABLERO-ALTA-GAMA TB-48: el cuadro sin plantillas prometía que «se escriben en «Plantillas y habituales»», y ahí
   * no se arma una desde cero: se ven, se cambian y se archivan.
   */
  dondeSeArman: 'Se guardan desde una versión de plan, con «Guardar como plantilla». En «Plantillas y habituales» se ven y se cambian.',
  plantillasActivas: 'Plantillas activas',
  creandoElBorrador: 'Creando el borrador…',
  queCopia: 'La plantilla copia la estructura (fases, sesiones, bloques, ejercicios, series, intensidad y parámetros), no a la persona: no lleva objetivo ni próxima revisión.',
  cargas: 'Conservar las cargas sugeridas como referencia de la plantilla',
  cargasAyuda: 'Apagado, las cargas no se copian: son de cada persona. Encendido, quedan en la plantilla como referencia y las revisás al aplicarla.',
  notasTitulo: 'Notas que se van a copiar',
  notasAyuda: 'Revisá que ninguna nombre a una persona ni describa su situación. Podés vaciarlas una por una.',
  vaciarNota: 'Vaciar',
  sinNotas: 'Esta versión no tiene notas de texto libre.',
  guardada: 'Plantilla guardada. La encontrás en «Mis plantillas».',
  versionCreada: 'Nueva versión guardada. Las anteriores no cambian; los planes ya creados tampoco.',
  aplicada: 'Borrador creado desde la plantilla. Adaptalo a la persona antes de activarlo: la persona no lo ve hasta que lo actives.',
  creadaDesde: (nombre: string, numero: number): string => `Creada desde la plantilla «${nombre}», versión ${numero}. El plan es de esta persona: la plantilla no cambia si lo editás.`,
  origenDesconocido: 'Creada desde una plantilla que ya no está disponible.',
  nombreTomado: 'Ya tenés una plantilla con ese nombre.',
  archivadaNoSeAplica: 'Esa plantilla está archivada: reactivala para usarla.',
  sesiones: (n: number): string => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`,
  conCargas: 'Con cargas de referencia',
  sinCargas: 'Sin cargas',
  origen: (fecha: string): string => `Guardada desde una versión de plan el ${fecha}`,
  desdeCero: 'Escrita desde cero',
  soloTuya: 'Solo vos ves y aplicás tus plantillas. Si dejás BE, quedan inactivas; los planes ya creados no dependen de ellas.',
  // Nutrición
  queCopiaNutricion: 'La plantilla copia la estructura (días tipo, comidas, opciones y alimentos), no a la persona: no lleva objetivo, cantidades ni próxima revisión.',
  cantidades: 'Conservar las cantidades como referencia de la plantilla',
  cantidadesAyuda: 'Apagado, las cantidades no se copian: son de cada persona. Encendido, quedan en la plantilla como referencia y las revisás al aplicarla.',
  comidas: (n: number): string => `${n} ${n === 1 ? 'comida' : 'comidas'}`,
  conCantidades: 'Con cantidades de referencia',
  sinCantidades: 'Sin cantidades',
  plantillasDeEntrenamiento: 'Plantillas de entrenamiento',
  plantillasDeNutricion: 'Plantillas de comidas',
} as const;

/**
 * PLT (DL-182): los textos de la preparación de una plantilla de entrenamiento, sin persona: la colección, el editor, la
 * revisión antes de guardar, el detalle con sus versiones y la nota de origen de un plan. Ubican y no califican; dicen qué
 * queda guardado, qué versión se usa y que los planes ya creados no cambian.
 */
export const COPY_PREPARACION_DE_PLANTILLA = {
  // La colección
  nuevaPlantilla: 'Nueva plantilla',
  creandoLaPlantilla: 'Abriendo el editor…',
  queSeHaceAca: 'Armala acá, sin elegir a nadie: en blanco o desde otra. Se usa con una persona desde su plan, con «Empezar desde una plantilla».',
  sinTitulo: 'Sin título',
  enPreparacion: 'En preparación',
  nuevaEnPreparacion: 'Nueva · todavía no es una plantilla',
  cambiosEnPreparacion: (n: number): string => `Versión ${n} disponible · cambios en preparación`,
  guardadaEl: (fecha: string): string => `lo preparado se guardó el ${fecha}`,
  retomar: 'Retomar',
  retomarLosCambios: 'Retomar los cambios',
  editar: 'Editar',
  crearOtraDesdeEsta: 'Crear otra desde esta',
  ningunaEnPreparacion: 'No tenés plantillas en preparación.',
  sinPlantillasDeEntrenamiento: 'Todavía no tenés plantillas de entrenamiento. Creá la primera con «Nueva plantilla», o guardala desde una versión de plan con «Guardar como plantilla».',
  sinIndicar: 'Sin indicar',
  noSeLeyeronLasEnPreparacion: 'No pudimos leer tus plantillas en preparación.',
  // El editor
  queEs: 'Plantilla de entrenamiento',
  nueva: 'Plantilla nueva · todavía no se guardó como plantilla',
  cambiosSobre: (n: number): string => `Cambios sobre la versión ${n}`,
  laVersionSigue: (n: number): string => `La versión ${n} sigue disponible y sin cambios hasta que guardes una nueva.`,
  archivada: 'Archivada: para guardar una versión nueva, reactivala en «Mis plantillas».',
  volver: 'Plantillas y habituales',
  revisarYGuardar: 'Revisar y guardar…',
  nombre: 'Nombre de la plantilla',
  nombreAyuda: 'Podés escribirlo después: se pide al guardar la plantilla.',
  descripcion: 'Descripción',
  nombreEnMisPlantillas: 'El nombre y la descripción se cambian en «Mis plantillas», sin crear una versión.',
  sinDias: 'Una plantilla no tiene días: se eligen en el plan de cada persona, al usarla.',
  sinPersona: 'La revisión mira lo que impide guardar la plantilla. Lo que depende de una persona (sus días, su objetivo, su app) se revisa en su plan, antes de activarlo.',
  masDeLaPlantilla: 'Más acciones de la plantilla',
  descartarLaNueva: 'Descartar esta plantilla nueva',
  descartarLosCambios: 'Descartar estos cambios',
  noDisponible: 'Esta plantilla en preparación ya no está: se guardó o se descartó, quizás en otra pestaña.',
  irAMisPlantillas: 'Ir a «Mis plantillas»',
  // Las cargas (D-2 de DL-108)
  cargasEscritasNoVan: (n: number): string =>
    `${n === 1 ? 'Un ejercicio tiene' : `${n} ejercicios tienen`} una carga sugerida escrita: con esto apagado, no va a la plantilla.`,
  cargasVan: (n: number): string => `${n === 1 ? 'La carga escrita en un ejercicio va' : `Las cargas escritas en ${n} ejercicios van`} a la plantilla como referencia.`,
  // La revisión antes de guardar
  tituloNueva: 'Antes de guardar la plantilla',
  tituloVersion: (n: number): string => `Antes de guardar los cambios sobre la versión ${n}`,
  guardarPlantilla: 'Guardar plantilla',
  guardarNuevaVersion: 'Guardar nueva versión',
  guardando: 'Guardando…',
  descartando: 'Descartando…',
  volverAlEditor: 'Volver al editor',
  loQueImpide: 'Lo que impide guardar',
  revisando: 'Revisando lo preparado…',
  nadaImpide: 'No se encontraron impedimentos para guardar la plantilla.',
  noSePudoRevisar: 'No se pudo revisar lo preparado.',
  volverARevisar: 'Volver a revisar',
  cambiosSinGuardar: 'Hay cambios que todavía no se guardaron: lo que se guarda como plantilla es lo guardado.',
  paraCompletar: 'Para completar al usarla con una persona',
  paraCompletarAyuda: 'No impide guardar: se completa en el plan de cada persona, antes de activarlo.',
  nadaParaCompletar: 'No queda nada para completar.',
  loQueCambia: (n: number): string => `Lo que cambia frente a la versión ${n}`,
  sinLaBase: 'No pudimos leer la versión de la que partió: lo que cambia no se puede mostrar.',
  queQueda: 'Qué queda guardado',
  consecuenciaNueva: 'Queda en «Mis plantillas» como versión 1, lista para usar con una persona. Solo vos la ves.',
  consecuenciaVersion: (n: number): string =>
    `Se guarda como la versión siguiente. La versión ${n} no cambia, y los planes que ya creaste desde esta plantilla tampoco: la nueva se ofrece para los próximos.`,
  falta: (partes: readonly string[]): string => `Falta: ${partes.join(', ')}.`,
  guardarLosCambios: 'guardar los cambios',
  corregir: (n: number): string => (n === 1 ? 'corregir 1 cosa' : `corregir ${n} cosas`),
  revisarDeNuevo: 'revisar de nuevo',
  cargarLaGuardada: 'cargar lo guardado',
  irACorregir: 'Ir a corregir',
  volverALaRevision: 'Corregí acá y volvé a «Antes de guardar».',
  // El resultado
  guardadaPrimera: 'Plantilla guardada · versión 1',
  guardadaVersion: (n: number): string => `Versión ${n} guardada. Las anteriores y los planes ya creados no cambian.`,
  descartadaLaNueva: 'Se descartó la plantilla nueva.',
  descartadosLosCambios: (n: number): string => `Se descartaron los cambios. La versión ${n} sigue como estaba.`,
  confirmarDescarteNueva: 'Lo preparado se pierde. No hay ninguna versión guardada de esta plantilla.',
  confirmarDescarteCambios: (n: number): string => `Lo preparado se pierde. La versión ${n} sigue disponible, como estaba.`,
  // Lo que impide guardar, dicho de la plantilla
  problema: {
    TEMPLATE_NAME_REQUIRED: 'falta el nombre de la plantilla',
    TEMPLATE_NAME_TAKEN: 'ya tenés otra plantilla con ese nombre',
    TEMPLATE_SESSION_REQUIRED: 'no tiene ninguna sesión',
    TEMPLATE_ARCHIVED: 'la plantilla está archivada: reactivala en «Mis plantillas» para guardar una versión nueva',
    TEMPLATE_UNCHANGED: 'no cambió nada frente a la versión de la que partió',
  } as Readonly<Record<string, string>>,
  irAlNombre: 'Nombre de la plantilla',
  // El detalle
  versiones: 'Versiones',
  vigente: 'vigente',
  version: (n: number): string => `Versión ${n}`,
  planesCreados: (n: number): string => (n === 0 ? 'todavía no se usó con nadie' : n === 1 ? 'se usó en 1 plan' : `se usó en ${n} planes`),
  planesCreadosAyuda: 'Cuántos planes (en preparación o activados) nacieron de cada versión. No dice de quién: la plantilla no lleva personas.',
  noSeLeyeronLasVersiones: 'No pudimos leer las versiones de esta plantilla.',
  usarConUnaPersona: 'Para usarla con una persona: en su plan, «Empezar desde una plantilla». Se usa la versión vigente.',
  estructura: 'Lo que tiene',
  // La nota de origen en el plan de una persona: el número de la versión que se aplicó, no el de la vigente.
  creadaDesdeSinNumero: (nombre: string): string => `Creada desde la plantilla «${nombre}». El plan es de esta persona: la plantilla no cambia si lo editás.`,
  // «Empezar desde una plantilla» (Entrenamiento): ya no se guardan solo desde un plan.
  dondeSeArmanEntrenamiento: 'Se crean en «Plantillas y habituales», con «Nueva plantilla», o desde una versión de plan, con «Guardar como plantilla».',
} as const;

/**
 * La nota de origen de un plan de Nutrición (ratificación de Dirección del 19/11, como Entrenamiento en #294): dice la
 * versión de la plantilla **que se aplicó**, no la vigente. La lectura de la plantilla nutricional trae solo la vigente:
 * si es la aplicada, se dice su número; si no, que salió de una versión anterior, con el número de la vigente para
 * ubicarla. Nunca el número de la vigente como si fuera el de la aplicada. Sin la plantilla, que ya no está disponible.
 */
export function notaDeOrigenNutricional(
  origen: { readonly templateVersionId: string },
  plantilla: { readonly name: string; readonly versionId: string; readonly versionNumber: number } | null,
): string {
  if (!plantilla) return COPY_PLANTILLAS.origenDesconocido;
  if (plantilla.versionId === origen.templateVersionId) return COPY_PLANTILLAS.creadaDesde(plantilla.name, plantilla.versionNumber);
  return `Creada desde la plantilla «${plantilla.name}», con una versión anterior a la vigente (hoy va por la versión ${plantilla.versionNumber}). El plan es de esta persona: la plantilla no cambia si lo editás.`;
}
