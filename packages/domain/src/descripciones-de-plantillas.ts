/**
 * ED-05 · Lo que dice cada plantilla de inicio al profesional, en palabras (WP-EDITORES-PROFESIONAL; DL-167).
 *
 * El propósito guardado de cada versión de plantilla es inmutable y lleva notas de su historia para el equipo («Sucede a
 * la v2 (DL-165, ronda 2.1): …»). Esas notas no son para el profesional: «Pedir información» mostraba el propósito crudo
 * (la captura C13). Ahora muestra esta descripción, por la clave de la plantilla. El propósito guardado no cambia: las
 * versiones son inmutables, y la próxima nace con uno limpio.
 */

/** La descripción de cada plantilla de inicio de BE, por su clave: lo que pide y para qué, como lo lee el profesional. */
export const DESCRIPCIONES_DE_PLANTILLAS: Readonly<Record<string, string>> = {
  'FRM-NUTRICION-INICIO':
    'Cómo come hoy la persona, para armar el primer plan de alimentación: su día, las comidas de su semana, lo que sí y lo que no, lo que toma, lo que su salud pide tener en cuenta y lo que busca. Los hábitos se piden aparte, con «Tus hábitos».',
  'FRM-ENTRENAMIENTO':
    'Lo que la persona cuenta antes de entrenar, para armar el primer plan: su salud, dolor y lesiones, su experiencia, lo que busca, su semana y sus preferencias. Los hábitos se piden aparte, con «Tus hábitos».',
  'FRM-HABITOS':
    'Los hábitos de la persona, en un formulario aparte que puede pedir cualquiera de sus profesionales: el sueño y los horarios, la actividad del día, el deporte en la semana y el estrés. Al responderlo, se actualizan los hábitos que ve en su app.',
};

/** Un código interno del equipo (DL-…, TB-…, RF-…, UC-…, API-…, REG-…, INV-…, «ronda»): nunca va a la vista. */
export const CODIGO_INTERNO = /\b(?:DL|TB|RF|UC|API|REG|INV)-[A-Z0-9]|\bronda\b/i;

export function tieneCodigosInternos(texto: string): boolean {
  return CODIGO_INTERNO.test(texto);
}

/**
 * La descripción de una plantilla para el profesional: la de la tabla, por su clave; si no está, el propósito guardado,
 * solo si no tiene códigos internos; si los tiene, ninguna (mejor nada que un código a la vista).
 */
export function descripcionDeLaPlantilla(clave: string, propositoGuardado: string | null | undefined): string | null {
  const deLaTabla = DESCRIPCIONES_DE_PLANTILLAS[clave];
  if (deLaTabla) return deLaTabla;
  const proposito = propositoGuardado?.trim() ?? '';
  return proposito && !tieneCodigosInternos(proposito) ? proposito : null;
}
