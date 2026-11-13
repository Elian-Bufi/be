/**
 * ED-30 (WP-EDITORES-PROFESIONAL, §5.5) · El asistente de Nutrición, sin React: los siete pasos, el que se sugiere según
 * el borrador, «Lo que llevás armado» y el número de la versión del objetivo.
 *
 * - **Es el mismo borrador que la estación:** el asistente no guarda en qué paso quedó; el paso pedido vive en la
 *   dirección (\`asistente=N\`) y el sugerido se deduce de la estructura, como en Entrenamiento (EDT-13).
 * - **Paso 2, el objetivo (DJ-7):** el vigente se llama «Objetivo general», con su versión y su fecha; o se escribe una
 *   versión nueva, como hoy (REG-06-123). El reparto se escribe en gramos y ningún texto de Nutrición dice «%». Sin
 *   objetivo, el asistente no ofrece el paso 2: empieza por la evaluación (B10-06; DL-145).
 * - **Paso 4, las comidas:** la estructura del día o una comida habitual. **Paso 5, las opciones:** cada una se arma en el
 *   cuadro de la opción (ED-31).
 */

export const PASOS_DE_NUTRICION = ['Punto de partida', 'Objetivo', 'Días tipo', 'Comidas', 'Opciones', 'Revisar', 'Activar'] as const;
export type PasoDeNutricion = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Lo mínimo de la estructura del plan que miran el paso sugerido y «Lo que llevás armado». */
interface Opcion {
  readonly label: string;
  readonly items: readonly unknown[];
  readonly recipeVersionId?: string | undefined;
}
interface Comida {
  readonly label: string;
  readonly options: readonly Opcion[];
}
interface Dia {
  readonly label: string;
  readonly meals: readonly Comida[];
}

/** Una opción de alimentos sin alimentos (una de receta trae los suyos al guardar). */
const opcionVacia = (o: Opcion): boolean => !o.recipeVersionId && o.items.length === 0;

/** El paso que se sugiere para seguir un borrador. Nunca el 1 (el borrador existe), el 2 (ya tiene objetivo) ni el 7. */
export function pasoQueSigueEnNutricion(dias: readonly Dia[]): PasoDeNutricion {
  if (dias.length === 0) return 3;
  if (dias.some((d) => d.meals.length === 0)) return 4;
  if (dias.some((d) => d.meals.some((m) => m.options.length === 0 || m.options.some(opcionVacia)))) return 5;
  return 6;
}

const contar = (n: number, uno: string, varios: string): string => (n === 1 ? `1 ${uno}` : `${n} ${varios}`);

/**
 * «Lo que llevás armado», en pocas líneas: los días tipo y las comidas y, por día tipo, sus comidas, sus opciones y las
 * que todavía no tienen alimentos. Hasta \`maximo\` días tipo, y cuántos más.
 */
export function loQueLlevasArmadoEnNutricion(dias: readonly Dia[], maximo = 7): readonly string[] {
  const comidas = dias.reduce((n, d) => n + d.meals.length, 0);
  const total = [contar(dias.length, 'día tipo', 'días tipo'), contar(comidas, 'comida', 'comidas')].join(' · ');
  if (dias.length === 0) return [total, 'Todavía sin días tipo.'];
  const filas = dias.slice(0, maximo).map((d, n) => {
    const opciones = d.meals.reduce((x, m) => x + m.options.length, 0);
    const vacias = d.meals.reduce((x, m) => x + m.options.filter(opcionVacia).length, 0);
    return [
      d.label.trim() || `Día tipo ${n + 1}`,
      d.meals.length === 0 ? 'sin comidas' : contar(d.meals.length, 'comida', 'comidas'),
      ...(d.meals.length > 0 ? [contar(opciones, 'opción', 'opciones')] : []),
      ...(vacias > 0 ? [vacias === 1 ? '1 sin alimentos' : `${vacias} sin alimentos`] : []),
    ].join(' · ');
  });
  const resto = dias.length - filas.length;
  return [total, ...filas, ...(resto > 0 ? [resto === 1 ? 'y 1 día tipo más' : `y ${resto} días tipo más`] : [])];
}

/**
 * El número de una versión del objetivo: su lugar, de la más vieja a la más nueva, entre las versiones de su mismo
 * objetivo. \`null\` si no está en la lista.
 */
export function numeroDeLaVersionDelObjetivo(versiones: readonly { readonly objectiveId: string; readonly versionId: string; readonly createdAt: string }[], versionId: string): number | null {
  const esta = versiones.find((v) => v.versionId === versionId);
  if (!esta) return null;
  const delMismo = versiones.filter((v) => v.objectiveId === esta.objectiveId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return delMismo.findIndex((v) => v.versionId === versionId) + 1;
}

export const COPY_ASISTENTE_DE_NUTRICION = {
  armarConElAsistente: 'Armar con el asistente',
  // Paso 1
  puntoDePartida: '¿Desde dónde arrancás?',
  copiarLaVigente: 'Copiar el plan vigente',
  copiarLaVigenteDetalle: 'Los días tipo, las comidas y las opciones de la versión activa, para ajustarlos.',
  desdeUnaPlantilla: 'Desde una plantilla',
  desdeUnaPlantillaDetalle: 'Una de tus plantillas de plan de comidas.',
  enBlanco: 'En blanco',
  enBlancoDetalle: 'Un día tipo vacío: vos armás todo.',
  elegiUnPuntoDePartida: 'Elegí desde dónde arrancás.',
  sinObjetivo: 'Sin un objetivo general, el asistente empieza por la evaluación: registrala y escribí el objetivo, y después se arma el plan.',
  // Paso 2
  objetivo: '¿Con qué objetivo se arma el plan?',
  objetivoGeneral: 'Objetivo general',
  leyendoElObjetivoNuevo: 'Leyendo el objetivo nuevo…',
  versionYFecha: (n: number | null, desde: string) => (n ? `Versión ${n}, vigente desde el ${desde}.` : `Vigente desde el ${desde}.`),
  enGramos: 'El plan se escribe en gramos: cada alimento con su cantidad. El reparto del objetivo también va en gramos.',
  versionNueva: 'Escribir una versión nueva del objetivo',
  versionNuevaDetalle: 'Queda en el historial del objetivo y puede partir de uno de tus repartos habituales; la versión en preparación pasa a usarla al guardar.',
  sinEvaluaciones: 'Para escribir una versión nueva del objetivo, primero registrá una evaluación.',
  objetivoNuevo: 'El objetivo tiene una versión nueva: la versión en preparación pasa a usarla.',
  // Paso 3
  dias: '¿Qué días tipo tiene el plan?',
  diasAyuda: 'Un día tipo no es una fecha: es un día modelo, como «Día habitual» o «Día de entrenamiento».',
  nombreDelDia: (n: number) => `Nombre del día tipo ${n}`,
  agregarDia: 'Agregar un día tipo',
  duplicarDia: (dia: string) => `Duplicar ${dia}`,
  quitarDia: (dia: string) => `Quitar ${dia}`,
  // Paso 4
  comidas: '¿Qué comidas tiene cada día tipo?',
  nombreDeLaComida: (dia: string, n: number) => `Nombre de la comida ${n} de ${dia}`,
  agregarComida: (dia: string) => `Agregar una comida a ${dia}`,
  usarHabitual: (dia: string) => `Usar una comida habitual en ${dia}`,
  sinComidas: 'Sin comidas todavía.',
  // Paso 5
  opciones: '¿Qué opciones tiene cada comida?',
  opcionesAyuda: 'La persona elige una opción en cada comida. Cada opción se arma en su cuadro, con el buscador adentro.',
  editarLaOpcion: (opcion: string) => `Armar ${opcion}`,
  agregarOpcion: (comida: string) => `Agregar una opción de alimentos a ${comida}`,
  receta: 'Receta',
  sinAlimentos: 'sin alimentos',
  // Paso 6 y 7
  revisar: 'Lo que impide activar y lo que queda sin completar',
  revisarAyuda: 'Revisar mira la forma del plan, no la calidad de la alimentación.',
  nadaImpide: 'Nada impide activar.',
  nadaSinCompletar: 'No queda nada sin completar.',
  impiden: 'Lo que impide activar',
  sinCompletar: 'Lo que queda sin completar',
  irEnLaEstacion: 'Ir a corregirlo en la estación',
  activar: 'Activar la versión',
  activarAyuda: (persona: string) => `«Revisar y activar…» abre lo que va a ver ${persona}, la fecha de la próxima revisión y el botón para activar.`,
} as const;
