/**
 * Copy de recetas y del registro de comidas con opciones (WP-NUTRICION-RECETAS; DL-119 a DL-121), para el website del
 * profesional y la APK. Sigue el criterio de `copy-nutricion.ts`: describir, no calificar, y nunca decir lo que BE no hace.
 * - La imagen es «de referencia»: no mide la porción ni demuestra lo que se comió.
 * - Los macros del plan son una estimación de las porciones del plan, no lo consumido.
 * - Una cantidad vacía no es cero, y una foto no agrega macros.
 * - Las opciones de una comida no se presentan como equivalentes nutricionales.
 * La prueba de términos prohibidos de nutrición también recorre este copy.
 */
import type { NutrienteCalculado } from './calculo-nutricional';

/** Los nombres de los nutrientes, en el orden de la franja (sin la fibra, que va en el detalle). */
export const ETIQUETA_DE_NUTRIENTE: Readonly<Record<NutrienteCalculado, string>> = {
  energyKcal: 'Calorías',
  carbohydrateG: 'Carbohidratos',
  fatG: 'Grasas',
  proteinG: 'Proteínas',
  fiberG: 'Fibra',
};

/** La unidad de cada nutriente al mostrarlo. */
export const UNIDAD_DE_NUTRIENTE: Readonly<Record<NutrienteCalculado, string>> = { energyKcal: 'kcal', carbohydrateG: 'g', fatG: 'g', proteinG: 'g', fiberG: 'g' };

export const ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN: Readonly<Record<'AI_GENERATED' | 'PERSON_PROVIDED', string>> = {
  AI_GENERATED: 'Generada por IA',
  PERSON_PROVIDED: 'Aportada por una persona',
};

export const ETIQUETA_DE_FALTANTE: Readonly<Record<'SIN_CANTIDAD' | 'SIN_COMPOSICION' | 'SIN_DATO_DEL_NUTRIENTE' | 'UNIDAD_SIN_EQUIVALENCIA', string>> = {
  SIN_CANTIDAD: 'sin cantidad',
  SIN_COMPOSICION: 'sin composición en el catálogo',
  SIN_DATO_DEL_NUTRIENTE: 'sin el dato en su fuente',
  UNIDAD_SIN_EQUIVALENCIA: 'en una unidad sin equivalencia identificada',
};

export const COPY_RECETAS = {
  misRecetas: 'Mis recetas',
  nuevaReceta: 'Nueva receta',
  editarReceta: 'Editar receta',
  sinRecetas: 'Todavía no tenés recetas. Una receta reúne ingredientes del catálogo con sus cantidades, y podés ofrecerla como opción de una comida del plan.',
  nombre: 'Nombre',
  descripcion: 'Descripción (opcional)',
  porciones: 'Porciones que rinde',
  ingredientes: 'Ingredientes',
  agregarIngrediente: 'Agregar ingrediente',
  quitarIngrediente: 'Quitar',
  cantidad: 'Cantidad',
  estadoDePreparacion: 'Estado de preparación',
  avisoDeCantidades: 'Cada cantidad es del estado indicado: por ejemplo, gramos de arroz cocido. BE no convierte entre crudo y cocido ni entre mililitros y gramos.',
  pasos: 'Preparación (opcional)',
  agregarPaso: 'Agregar paso',
  quitarPaso: 'Quitar paso',
  imagenDeReferencia: 'Imagen de referencia',
  elegirImagen: 'Elegir imagen',
  reemplazarImagen: 'Reemplazar imagen',
  retirarImagen: 'Retirar imagen',
  vistaPrevia: 'Vista previa',
  cargarImagen: 'Cargar imagen',
  cargandoImagen: 'Cargando la imagen…',
  imagenCargada: 'Imagen cargada.',
  imagenRetirada: 'Imagen retirada. Los ingredientes y los registros no cambian.',
  procedenciaDeLaImagen: 'Procedencia',
  autoria: 'Autoría (opcional)',
  avisoDeImagen: 'La imagen es una referencia: no mide la porción ni demuestra lo que se comió.',
  imagenInvalida: 'Esa imagen no se puede usar: tiene que ser JPG, PNG o WebP, de hasta 10 MB y entre 64 y 8000 píxeles por lado.',
  imagenNoCargada: 'La imagen no se pudo cargar. La receta no cambió: probá de nuevo.',
  calculo: 'Energía y macros estimados',
  recetaCompleta: 'Receta completa',
  porPorcion: 'Por porción',
  calculando: 'Calculando…',
  metodo: 'Suma de cada ingrediente según su composición cada 100 g, con la energía de la fuente. Se redondea solo al mostrar.',
  fuenteUsda: 'Fuente de los alimentos de referencia: USDA FoodData Central (SR Legacy), de dominio público.',
  faltanDatos: 'Faltan datos para completar el cálculo',
  sinDato: 'Sin dato',
  guardar: 'Guardar receta',
  guardando: 'Guardando…',
  guardada: 'Receta guardada.',
  versionNueva: (n: number) => `Se guardó la versión ${n}. Los planes ya activados conservan la versión que tenían.`,
  version: (n: number) => `Versión ${n}`,
  historial: 'Versiones',
  agregarComoOpcion: 'Agregar receta como opción',
  elegirReceta: 'Elegí una receta',
  opcionDeReceta: (nombre: string, version: number) => `Receta «${nombre}», versión ${version}`,
  avisoDeOpciones: 'Las opciones de una comida no son equivalencias nutricionales: cada una muestra su propia estimación.',
  porcionDeLaOpcion: 'La opción lleva los ingredientes de una porción de la receta.',
} as const;

/** El participio que concuerda con el nombre de la comida, que viene del plan: «Almuerzo registrado», «Merienda registrada». */
export function textoDeComidaRegistrada(comida: string): string {
  const ultima = comida.trim().split(/\s+/)[0]!.toLocaleLowerCase('es-AR');
  const femenina = /(a|ción|sión)$/.test(ultima) && ultima !== 'día';
  return `${comida.trim()} ${femenina ? 'registrada' : 'registrado'}`;
}

export const COPY_REGISTRO_DE_COMIDAS = {
  hoy: 'Hoy',
  plan: 'Plan',
  registros: 'Registros',
  opcionDe: (n: number, total: number) => `Opción ${n} de ${total}`,
  opcionAnterior: 'Opción anterior',
  opcionSiguiente: 'Opción siguiente',
  imagenDeReferencia: 'Imagen de referencia',
  sinImagen: 'Sin imagen de referencia',
  estimacionDelPlan: 'Estimación para las porciones del plan',
  verDetalle: 'Ver detalle',
  comiEstaOpcion: 'Comí esta opción',
  comiAlgoDiferente: 'Comí algo diferente',
  agregarFotoODescribir: 'Agregar foto o describir',
  sinRegistro: 'Sin registro',
  registrado: 'Registrado',
  detalleDeLaComida: 'Detalle de la comida',
  ingredientes: 'Ingredientes y cantidades',
  porcionesDelPlan: 'Porciones del plan',
  preparacion: 'Preparación',
  cuantoComiste: '¿Cuánto comiste?',
  comiLasPorcionesDelPlan: 'Comí las porciones del plan',
  informarCantidades: 'Informar lo que comí de cada ingrediente',
  noLoComi: 'No lo comí',
  vacioNoEsCero: 'Si dejás un ingrediente vacío, queda sin confirmar: no cuenta como cero.',
  cantidadesSinConfirmar: 'Cantidades sin confirmar',
  cantidadesSinConfirmarDetalle: 'Registraste la opción. Podés completar cuánto comiste cuando quieras.',
  completarCantidades: 'Completar cantidades',
  verOCorregir: 'Ver o corregir registro',
  deshacer: 'Deshacer registro',
  deshacerPregunta: '¿Deshacer el registro? Queda anotado que lo deshiciste, y podés volver a registrar esta comida.',
  deshecho: 'Registro deshecho. Podés volver a registrar esta comida.',
  seguirConMiDia: 'Seguir con mi día',
  macrosSinCalcular: 'Macros sin calcular',
  macrosSinCalcularDetalle: 'Faltan datos para estimarlos. Podés guardar el registro igualmente.',
  lasCantidadesDelPlan: 'Los macros previos corresponden a las porciones del plan. Lo que comiste se calcula solo con las cantidades que confirmes.',
  podesAgregar: 'Podés agregar una foto, una descripción o ambas.',
  agregarFoto: 'Agregar foto',
  camara: 'Cámara',
  galeria: 'Galería',
  quitarFoto: 'Quitar foto',
  reemplazarFoto: 'Reemplazar foto',
  queComiste: '¿Qué comiste?',
  cantidadAproximada: 'Cantidad aproximada (opcional)',
  ejemploDeCantidad: 'Ej.: 1 sándwich y 1 manzana',
  hacenFaltaDatos: 'Agregá una foto o una descripción para guardar.',
  guardarComida: (comida: string) => `Guardar ${comida.toLocaleLowerCase('es-AR')}`,
  volverAlPlan: 'Volver al plan',
  subiendoFoto: 'Subiendo la foto…',
  guardando: 'Guardando…',
  guardado: 'Guardado.',
  noSePudoGuardar: 'No pudimos guardar. Lo que escribiste y la foto siguen acá: probá de nuevo.',
  fotoNoSubio: 'La foto no se pudo subir. El texto se conserva: probá de nuevo o guardá sin la foto.',
  fotoInvalida: 'Esa imagen no se puede usar: tiene que ser JPG, PNG o WebP, de hasta 10 MB.',
  permisoDeCamara: 'Para sacar una foto, BE necesita permiso para usar la cámara. Podés darlo en los ajustes del teléfono.',
  permisoDeGaleria: 'Para elegir una foto, BE necesita permiso para ver tus fotos. Podés darlo en los ajustes del teléfono.',
  fotoPrivada: 'La foto es privada: la ven vos y el profesional que te acompaña en Nutrición.',
} as const;
