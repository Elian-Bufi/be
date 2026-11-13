/**
 * ED-24 · «Duplicar el día» (WP-EDITORES-PROFESIONAL; V3 E-01), como lo eligió Dirección el 2026-11-12: copia las
 * sesiones de ese día a otro día. Sin React:
 * - cada sesión que tiene ese día en la agenda (DL-137) se copia justo después de la original, con sus ejercicios y sus
 *   series, sin identificadores de ejercicio y con «(copia)» en el nombre, como «Duplicar»;
 * - la copia lleva un identificador de sesión nuevo, que da el cliente: así entra en la agenda con el día de destino en
 *   el mismo guardado (la API conserva el identificador que recibe, REG-06-111). Sin él, sus días se elegirían después
 *   de guardar;
 * - las originales no cambian: siguen en su día;
 * - nunca cambia los bloques ni la agenda que recibe.
 */
import { DIAS_DE_LA_SEMANA, sinIdentificadoresDeSesion, type AgendaDeEntrenamiento, type DiaDeLaSemana, type EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];

/**
 * «Torso A (copia)», dentro de los 120 caracteres del nombre de una sesión: lo mismo que `nombreDeLaCopia` de
 * `editar-la-estructura.ts`, acá sin importarlo para que la prueba lo cargue sin compilar (`node --test` no resuelve
 * un import relativo sin extensión).
 */
const SUFIJO = ' (copia)';
const nombreDeLaCopia = (nombre: string, siNoTiene: string): string => `${(nombre.trim() || siNoTiene).slice(0, 120 - SUFIJO.length).trimEnd()}${SUFIJO}`;

/** El tope de sesiones de la agenda (`AgendaDeEntrenamientoSchema`: 60) y los de un bloque y un microciclo (30 y 14). */
export const TOPE_DE_LA_AGENDA = 60;
const TOPE_DEL_BLOQUE = 30;
const TOPE_DEL_MICROCICLO = 14;

export type ResultadoDeDuplicarElDia =
  | { readonly tipo: 'duplicado'; readonly bloques: Bloques; readonly agenda: AgendaDeEntrenamiento; readonly copiadas: readonly string[] }
  | { readonly tipo: 'no-se-puede'; readonly motivo: 'MISMO_DIA' | 'SIN_SESIONES' | 'TOPE' };

/** Las sesiones del plan que tienen ese día en la agenda, con su nombre: lo que copia «Duplicar el día». */
export function sesionesDelDia(bloques: Bloques, agenda: AgendaDeEntrenamiento | null, dia: DiaDeLaSemana): string[] {
  const conElDia = new Set((agenda?.sessions ?? []).filter((s) => s.weekdays.includes(dia)).map((s) => s.sessionId));
  return bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]).flatMap((s, n) => (s.sessionId && conElDia.has(s.sessionId) ? [s.label.trim() || `Sesión ${n + 1}`] : []));
}

export function duplicarElDia(bloques: Bloques, agenda: AgendaDeEntrenamiento | null, desde: DiaDeLaSemana, hacia: DiaDeLaSemana, nuevoId: () => string): ResultadoDeDuplicarElDia {
  if (desde === hacia) return { tipo: 'no-se-puede', motivo: 'MISMO_DIA' };
  if (!agenda) return { tipo: 'no-se-puede', motivo: 'SIN_SESIONES' };
  const conElDia = new Set(agenda.sessions.filter((s) => s.weekdays.includes(desde)).map((s) => s.sessionId));
  if (conElDia.size === 0) return { tipo: 'no-se-puede', motivo: 'SIN_SESIONES' };
  if (agenda.sessions.length + conElDia.size > TOPE_DE_LA_AGENDA) return { tipo: 'no-se-puede', motivo: 'TOPE' };
  const copia = structuredClone(bloques);
  const nuevas: { sessionId: string; weekdays: DiaDeLaSemana[] }[] = [];
  const copiadas: string[] = [];
  let pasaElTope = false;
  const enLaLista = (sesiones: NonNullable<Bloques[number]['sessions']>, tope: number) => {
    if (sesiones.length + sesiones.filter((s) => s.sessionId && conElDia.has(s.sessionId)).length > tope) pasaElTope = true;
    // En orden, de arriba abajo: cada copia va justo después de su original (y se saltea al seguir).
    for (let k = 0; k < sesiones.length; k++) {
      const s = sesiones[k]!;
      if (!s.sessionId || !conElDia.has(s.sessionId)) continue;
      const sessionId = nuevoId();
      const nueva = { ...sinIdentificadoresDeSesion(structuredClone(s)), sessionId, label: nombreDeLaCopia(s.label, `Sesión ${k + 1}`) };
      sesiones.splice(k + 1, 0, nueva);
      k++;
      nuevas.push({ sessionId, weekdays: [hacia] });
      copiadas.push(nueva.label);
    }
  };
  for (const b of copia) {
    if (b.sessions) enLaLista(b.sessions, TOPE_DEL_BLOQUE);
    for (const m of b.microcycles ?? []) enLaLista(m.sessions, TOPE_DEL_MICROCICLO);
  }
  if (pasaElTope) return { tipo: 'no-se-puede', motivo: 'TOPE' };
  if (nuevas.length === 0) return { tipo: 'no-se-puede', motivo: 'SIN_SESIONES' };
  return { tipo: 'duplicado', bloques: copia, agenda: { ...structuredClone(agenda), sessions: [...structuredClone(agenda.sessions), ...nuevas] }, copiadas };
}

const DIA: Readonly<Record<DiaDeLaSemana, string>> = { MONDAY: 'el lunes', TUESDAY: 'el martes', WEDNESDAY: 'el miércoles', THURSDAY: 'el jueves', FRIDAY: 'el viernes', SATURDAY: 'el sábado', SUNDAY: 'el domingo' };

export const COPY_DUPLICAR_EL_DIA = {
  accion: 'Duplicar el día',
  titulo: (desde: DiaDeLaSemana) => `Duplicar ${DIA[desde]}`,
  destino: 'A qué día',
  principal: (hacia: DiaDeLaSemana) => `Copiar a ${DIA[hacia].replace('el ', '')}`,
  nadaElegido: 'Elegí a qué día se copian.',
  vistaPrevia: (sesiones: readonly string[], hacia: DiaDeLaSemana) =>
    `${sesiones.length === 1 ? `Se copia «${sesiones[0]}»` : `Se copian ${sesiones.map((s) => `«${s}»`).join(', ')}`}, con sus ejercicios y sus series, a ${DIA[hacia]}, con «(copia)» en el nombre. Las de ahora siguen en su día.`,
  hecho: (n: number, hacia: DiaDeLaSemana) => `${n === 1 ? 'Se copió 1 sesión' : `Se copiaron ${n} sesiones`} a ${DIA[hacia]}. Se guarda sola.`,
  motivo: { MISMO_DIA: 'Elegí otro día.', SIN_SESIONES: 'Ese día no tiene sesiones.', TOPE: `No entran: una semana admite hasta ${TOPE_DEL_MICROCICLO} sesiones, un bloque ${TOPE_DEL_BLOQUE} y la agenda ${TOPE_DE_LA_AGENDA}.` },
} as const;

/** Los días a los que se puede copiar: todos menos el de origen, en el orden de la semana. */
export const diasDeDestino = (desde: DiaDeLaSemana): DiaDeLaSemana[] => DIAS_DE_LA_SEMANA.filter((d) => d !== desde);
