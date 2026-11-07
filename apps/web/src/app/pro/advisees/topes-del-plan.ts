/**
 * Los topes de un plan, avisados antes de guardar (WP-TABLERO-ALTA-GAMA TB-48). El contrato admite hasta tantos días
 * tipo, comidas, opciones e ítems en Nutrición, y tantos bloques, microciclos, sesiones, ejercicios, series y parámetros
 * en Entrenamiento (`contratos-nutricion.ts` y `contratos-entrenamiento.ts`). El editor no los contaba: el pedido salía,
 * la API lo rechazaba por la forma y el aviso decía «hay más elementos de los que admite un plan» sin decir dónde.
 * Ahora cada tope que se pasa es un problema más de lo que no deja guardar, con su lugar, como un nombre vacío: se lista,
 * lleva a su lugar y el autoguardado espera. Los números son los del contrato, y una prueba los compara con él.
 * Vive en el website hasta TB-20 (§8.2 del paquete), como `reloj.ts`.
 */

/** Los topes del contrato de Nutrición (API-NUT-07 a 10). */
export const TOPES_DE_NUTRICION = { diasTipo: 7, comidas: 12, opciones: 12, items: 40 } as const;
/** Los topes del contrato de Entrenamiento (API-TRN-07 a 10). */
export const TOPES_DE_ENTRENAMIENTO = { bloques: 12, microciclos: 26, sesionesDelBloque: 30, sesionesDelMicrociclo: 14, ejercicios: 40, series: 20, parametros: 12 } as const;

/** El código de cada tope, como el de un problema de «Validar»: se dice con su texto y lleva a su lugar. */
export const TOPE = {
  diasTipo: 'TOPE_DE_DIAS_TIPO',
  comidas: 'TOPE_DE_COMIDAS',
  opciones: 'TOPE_DE_OPCIONES',
  items: 'TOPE_DE_ITEMS',
  bloques: 'TOPE_DE_BLOQUES',
  microciclos: 'TOPE_DE_MICROCICLOS',
  sesiones: 'TOPE_DE_SESIONES',
  ejercicios: 'TOPE_DE_EJERCICIOS',
  series: 'TOPE_DE_SERIES',
  parametros: 'TOPE_DE_PARAMETROS',
} as const;

/** Lo que dice cada tope en la lista de problemas: cuánto admite, en palabras. */
export const TEXTO_DE_LOS_TOPES: Readonly<Record<string, string>> = {
  [TOPE.diasTipo]: `hay más días tipo de los que admite un plan (${TOPES_DE_NUTRICION.diasTipo} como máximo)`,
  [TOPE.comidas]: `hay más comidas de las que admite un día tipo (${TOPES_DE_NUTRICION.comidas} como máximo)`,
  [TOPE.opciones]: `hay más opciones de las que admite una comida (${TOPES_DE_NUTRICION.opciones} como máximo)`,
  [TOPE.items]: `hay más ítems de los que admite una opción (${TOPES_DE_NUTRICION.items} como máximo)`,
  [TOPE.bloques]: `hay más bloques de los que admite un plan (${TOPES_DE_ENTRENAMIENTO.bloques} como máximo)`,
  [TOPE.microciclos]: `hay más microciclos de los que admite un bloque (${TOPES_DE_ENTRENAMIENTO.microciclos} como máximo)`,
  [TOPE.sesiones]: `hay más sesiones de las que admite (${TOPES_DE_ENTRENAMIENTO.sesionesDelBloque} en un bloque, ${TOPES_DE_ENTRENAMIENTO.sesionesDelMicrociclo} en un microciclo)`,
  [TOPE.ejercicios]: `hay más ejercicios de los que admite una sesión (${TOPES_DE_ENTRENAMIENTO.ejercicios} como máximo)`,
  [TOPE.series]: `hay más series de las que admite un ejercicio (${TOPES_DE_ENTRENAMIENTO.series} como máximo)`,
  [TOPE.parametros]: `hay más parámetros de los que admite un ejercicio (${TOPES_DE_ENTRENAMIENTO.parametros} como máximo)`,
};

/** El aviso que encabeza la lista cuando hay un tope pasado: qué hacer, sin mandar a buscar. */
export const AVISO_DE_LOS_TOPES = 'Hay más elementos de los que admite un plan. Quitá los que sobran antes de guardar.';

export const esUnTope = (codigo: string): boolean => (Object.values(TOPE) as string[]).includes(codigo);

export interface ProblemaDeTope {
  readonly code: string;
  readonly path: string;
}

interface DiaTipo {
  readonly meals: readonly { readonly options: readonly { readonly items: readonly unknown[] }[] }[];
}

/** Los topes de Nutrición que se pasan, en el orden de la estructura, con el lugar donde está lo que sobra. */
export function topesPasadosDeNutricion(dias: readonly DiaTipo[]): readonly ProblemaDeTope[] {
  const t = TOPES_DE_NUTRICION;
  const problemas: ProblemaDeTope[] = [];
  if (dias.length > t.diasTipo) problemas.push({ code: TOPE.diasTipo, path: 'dayTypes' });
  dias.forEach((d, i) => {
    if (d.meals.length > t.comidas) problemas.push({ code: TOPE.comidas, path: `dayTypes[${i}]` });
    d.meals.forEach((m, j) => {
      if (m.options.length > t.opciones) problemas.push({ code: TOPE.opciones, path: `dayTypes[${i}].meals[${j}]` });
      m.options.forEach((o, k) => {
        if (o.items.length > t.items) problemas.push({ code: TOPE.items, path: `dayTypes[${i}].meals[${j}].options[${k}]` });
      });
    });
  });
  return problemas;
}

interface Sesion {
  readonly prescriptions: readonly { readonly sets: readonly unknown[]; readonly professionalParameters?: readonly unknown[] | null }[];
}
interface Bloque {
  readonly microcycles?: readonly { readonly sessions: readonly Sesion[] }[] | null;
  readonly sessions?: readonly Sesion[] | null;
}

/** Los topes de Entrenamiento que se pasan, en el orden de la estructura, con el lugar donde está lo que sobra. */
export function topesPasadosDeEntrenamiento(bloques: readonly Bloque[]): readonly ProblemaDeTope[] {
  const t = TOPES_DE_ENTRENAMIENTO;
  const problemas: ProblemaDeTope[] = [];
  const deLasSesiones = (sesiones: readonly Sesion[], base: string, tope: number): void => {
    if (sesiones.length > tope) problemas.push({ code: TOPE.sesiones, path: base });
    sesiones.forEach((s, k) => {
      const deLaSesion = `${base}.sessions[${k}]`;
      if (s.prescriptions.length > t.ejercicios) problemas.push({ code: TOPE.ejercicios, path: deLaSesion });
      s.prescriptions.forEach((p, l) => {
        const delEjercicio = `${deLaSesion}.prescriptions[${l}]`;
        if (p.sets.length > t.series) problemas.push({ code: TOPE.series, path: delEjercicio });
        if ((p.professionalParameters ?? []).length > t.parametros) problemas.push({ code: TOPE.parametros, path: delEjercicio });
      });
    });
  };
  if (bloques.length > t.bloques) problemas.push({ code: TOPE.bloques, path: 'blocks' });
  bloques.forEach((b, i) => {
    const delBloque = `blocks[${i}]`;
    const microciclos = b.microcycles ?? [];
    if (microciclos.length > t.microciclos) problemas.push({ code: TOPE.microciclos, path: delBloque });
    if (microciclos.length === 0) return deLasSesiones(b.sessions ?? [], delBloque, t.sesionesDelBloque);
    microciclos.forEach((m, j) => deLasSesiones(m.sessions, `${delBloque}.microcycles[${j}]`, t.sesionesDelMicrociclo));
  });
  return problemas;
}
