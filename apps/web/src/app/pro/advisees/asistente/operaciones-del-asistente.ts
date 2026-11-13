/**
 * ED-14 y ED-11 (WP-EDITORES-PROFESIONAL, §2.1; DJ-8) · Lo que el asistente y la estación escriben en el borrador, sin
 * React, para probarlo con datos (TEST-EDP-021 y TEST-EDP-055):
 * - **Las sesiones de todo el plan, por bloque y por semana** (`gruposDelAsistente`): los pasos 2 a 5 recorren todas, como
 *   `pasoQueSigue`, y no solo las de la semana que se mira en la estación.
 * - **Cada escritura toca un campo** de una sesión de un grupo (`sesionesDelGrupo`), sobre una copia.
 * - **Un preset de estructura no borra nada propio** (`conLaEstructura`): reemplaza solo las sesiones que no tienen nada
 *   escrito (sin ejercicios, sin indicaciones, sin días y con el nombre de compromiso); las demás quedan en su orden, y
 *   las del preset se suman al final. La vista previa nombra las que se reemplazan.
 * - **La marca «escrita para 6-8: revisala»** (`firmaDeLaCarga`) vale mientras el ejercicio siga como quedó al aplicar:
 *   si se edita la carga o las repeticiones, o se deshace, deja de verse; si se mueve, va con él.
 */
import { COPY_ENTRENAMIENTO, type EstructuraDePlanDeEntrenamientoEntrada } from '@be/domain';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
type SesionE = NonNullable<Bloques[number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

/** Un bloque sin semanas, o una semana de un bloque: lo que el asistente muestra con su encabezado. */
export interface GrupoDelAsistente {
  readonly i: number;
  readonly j: number | null;
  readonly titulo: string;
  readonly sesiones: readonly SesionE[];
}

const nombre = (label: string, defecto: string, n: number): string => label.trim() || `${defecto} ${n + 1}`;

/** Todas las sesiones del plan, por bloque (o por semana, si el bloque las usa), en orden. */
export function gruposDelAsistente(bloques: Bloques): readonly GrupoDelAsistente[] {
  return bloques.flatMap((b, i): GrupoDelAsistente[] => {
    const bloque = nombre(b.label, COPY_ENTRENAMIENTO.bloque, i);
    const semanas = b.microcycles ?? [];
    if (semanas.length === 0) return [{ i, j: null, titulo: bloque, sesiones: b.sessions ?? [] }];
    return semanas.map((m, j) => ({ i, j, titulo: `${bloque} · ${nombre(m.label, COPY_ENTRENAMIENTO.microciclo, j)}`, sesiones: m.sessions }));
  });
}

/** Las sesiones de un grupo, dentro de una copia de la estructura (para escribir con `cambiar`). */
export const sesionesDelGrupo = (x: Bloques, g: { readonly i: number; readonly j: number | null }): SesionE[] =>
  g.j !== null ? x[g.i]!.microcycles![g.j]!.sessions : (x[g.i]!.sessions ??= []);

/** La clave de una sesión por su lugar: la misma que usa la estación (`b0-m1-s2`). */
export const claveDeLaSesion = (g: { readonly i: number; readonly j: number | null }, n: number): string => `b${g.i}${g.j !== null ? `-m${g.j}` : ''}-s${n}`;

/** Una sesión sin nada propio: sin ejercicios, sin indicaciones, sin días y con el nombre de compromiso («Sesión A»). */
export const sesionSinNadaPropio = (s: SesionE, tieneDias: boolean): boolean =>
  s.prescriptions.length === 0 && !s.instructions?.trim() && !tieneDias && /^(sesi[oó]n\s+\S{1,2})?$/i.test(s.label.trim());

/** ED-11: las sesiones que un preset de estructura reemplazaría (sus posiciones). */
export const loQueReemplazaLaEstructura = (sesiones: readonly SesionE[], tieneDias: (s: SesionE) => boolean): readonly number[] =>
  sesiones.flatMap((s, n) => (sesionSinNadaPropio(s, tieneDias(s)) ? [n] : []));

/** ED-11: aplica un preset de estructura a una lista de sesiones (la escribe en el lugar). Nada propio se borra. */
export function conLaEstructura(sesiones: SesionE[], nombres: readonly string[], tieneDias: (s: SesionE) => boolean): void {
  const fuera = new Set(loQueReemplazaLaEstructura(sesiones, tieneDias));
  const quedan = sesiones.filter((_, n) => !fuera.has(n));
  sesiones.splice(0, sesiones.length, ...quedan, ...nombres.map((label) => ({ label, instructions: null, prescriptions: [] })));
}

const repsEnTexto = (r: unknown): string => {
  if (!r || typeof r !== 'object') return '';
  const x = r as { value?: number; min?: number; max?: number };
  return x.value !== undefined ? `${x.value}` : `${x.min}-${x.max}`;
};
const cargaEnTexto = (c: { readonly value: number; readonly unit: string } | null | undefined): string => (c ? `${c.value}${c.unit}` : '');

/** Lo que define la marca de una carga a revisar: el ejercicio, sus repeticiones y sus cargas (sin identificadores). */
export const firmaDeLaCarga = (p: PrescripcionE): string =>
  [p.exerciseVersionId, cargaEnTexto(p.suggestedLoad), ...p.sets.map((s) => `${repsEnTexto(s.repetitions)}/${cargaEnTexto(s.suggestedLoad)}`)].join('|');

/** ED-14 · Una pestaña del paso 4: una sesión de un grupo, con su nombre y cuántos ejercicios tiene. */
export interface PestanaDelPaso4 {
  /** La clave de la sesión (`b0-m1-s2`), para los identificadores de la pestaña y de su panel. */
  readonly clave: string;
  readonly g: GrupoDelAsistente;
  readonly n: number;
  /** «Sesión A» o, con varios grupos, «Bloque 1 · Semana 2 · Sesión A». */
  readonly rotulo: string;
  readonly ejercicios: number;
}

/**
 * ED-14 (maqueta 03) · Las pestañas del paso 4, una por sesión de todo el plan, en el orden de los pasos 2 a 5. Con un
 * solo grupo, el nombre de la sesión; con varios, también el del grupo, porque dos semanas pueden tener una «Sesión A».
 */
export function pestanasDelPaso4(grupos: readonly GrupoDelAsistente[], nombreDeLaSesion: (s: SesionE, n: number) => string): PestanaDelPaso4[] {
  const varios = grupos.length > 1;
  return grupos.flatMap((g) =>
    g.sesiones.map((s, n) => ({ clave: claveDeLaSesion(g, n), g, n, rotulo: varios ? `${g.titulo} · ${nombreDeLaSesion(s, n)}` : nombreDeLaSesion(s, n), ejercicios: s.prescriptions.length })),
  );
}

/**
 * La pestaña a la que lleva una tecla, con el patrón de pestañas de ARIA: las flechas dan la vuelta, Inicio y Fin van a
 * las puntas. `null` si la tecla no mueve.
 */
export function pestanaConLaTecla(actual: number, total: number, tecla: string): number | null {
  if (total <= 0) return null;
  if (tecla === 'ArrowRight') return (actual + 1) % total;
  if (tecla === 'ArrowLeft') return (actual - 1 + total) % total;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  return null;
}

/** La pestaña que se muestra: la elegida si sigue existiendo; si se quitaron sesiones, la última. */
export const pestanaVigente = (elegida: number, total: number): number => (total <= 0 ? 0 : Math.min(Math.max(elegida, 0), total - 1));
