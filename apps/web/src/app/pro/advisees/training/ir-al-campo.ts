/**
 * C9 de Dirección (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · «Ir a…» lleva al campo exacto. Sin React: de un problema
 * (el código y la ruta, los del editor y los que dice la API al revisar) salen los campos a los que se puede llevar el
 * foco, en orden, con el renglón del ejercicio al final como ancla.
 *
 * - **El campo que hay que corregir,** no el renglón: el RIR de la serie 3, el objetivo del criterio, la casilla del
 *   calentamiento que quedó abajo, «Agregar serie» si no tiene ninguna, la escritura rápida sin aplicar.
 * - **Primero el código, después la ruta:** los problemas del editor dicen qué es en el código (la ruta es la del
 *   ejercicio o la serie); los de la API, en la ruta (`…sets[2].rir`, `…intensity.target.value`).
 * - **Si el campo exacto no está dibujado** (el RIR por serie de un ejercicio que no usa el criterio RIR), el foco va al
 *   siguiente de la lista; el último es siempre el renglón del ejercicio, que existe. Quien enfoca espera a que el
 *   ejercicio esté abierto antes de elegir: si no, saltaría al renglón antes de tiempo.
 * Los identificadores son los de `ejercicio-del-editor.tsx` (`{ejercicio}-serie-{n}-rir`, `{ejercicio}-objetivo`…).
 */
import { PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO as N } from '@be/domain';

/** El de `INCOMPLETO.sinSeries` (`revisar-el-plan.ts`; la prueba los compara): un módulo puro no importa otro del website. */
const SIN_SERIES = 'INCOMPLETO_SIN_SERIES';

/** El de `INCOMPLETO.sinIntensidad`: el ejercicio que hereda la intensidad del plan sin objetivo lleva al «Común». */
const SIN_INTENSIDAD = 'INCOMPLETO_SIN_OBJETIVO_DE_INTENSIDAD';

/** El código de la escritura rápida sin aplicar (C7): lleva a la línea del ejercicio. */
export const SIN_APLICAR = 'ESCRITURA_RAPIDA_SIN_APLICAR';

/** El renglón del ejercicio: el ancla, que siempre está. */
export const renglonDelEjercicio = (ejercicio: string): string => `abrir-ejercicio-${ejercicio}`;

/** Lo que dice la ruta después de la serie o del ejercicio: `rir`, `suggestedLoad`, `intensity.target.value`… */
function campoDeLaRuta(ruta: string): string {
  const m = /\.(?:sets|prescriptions)\[\d+\]\.([A-Za-z.]+)$/.exec(ruta.replace(/^changes\./, '').replace(/\.(\d+)/g, '[$1]'));
  return m?.[1] ?? '';
}

/**
 * Los campos a los que lleva un problema de un ejercicio, en orden; el último es el renglón del ejercicio. `ejercicio` es
 * el prefijo de sus identificadores (`b0-s1-p2`); `serie`, la posición de la serie (desde cero) si la ruta la tiene.
 */
export function camposDelProblema(p: { readonly code: string; readonly path: string }, ejercicio: string, serie: number | null): readonly string[] {
  const campo = campoDeLaRuta(p.path);
  const exactos: string[] = [];
  if (serie !== null) {
    const deLaSerie = `${ejercicio}-serie-${serie}`;
    if (p.code === 'SET_RIR_WITHOUT_RIR_CRITERION') exactos.push(`${deLaSerie}-rir`, `${ejercicio}-criterio`);
    else if (p.code === N.cargaIlegible || campo.startsWith('suggestedLoad')) exactos.push(`${deLaSerie}-carga`);
    else if (p.code === N.rirIlegible || campo === 'rir') exactos.push(`${deLaSerie}-rir`);
    else if (p.code === N.descansoIlegible || campo === 'restSeconds') exactos.push(`${deLaSerie}-descanso`);
    else if (p.code === 'WARM_UP_AFTER_WORKING_SET' || campo === 'setKind') exactos.push(`${deLaSerie}-calentamiento`);
    else if (campo === 'note') exactos.push(`${deLaSerie}-nota`);
    else exactos.push(deLaSerie);
  } else if (p.code === SIN_APLICAR) exactos.push(`${ejercicio}-linea`);
  else if (p.code === N.faltaElObjetivo || p.code === SIN_INTENSIDAD || campo === 'intensity.target.value') exactos.push(`${ejercicio}-objetivo-comun`, `${ejercicio}-objetivo`, `${ejercicio}-criterio`);
  else if (campo.startsWith('intensity')) exactos.push(`${ejercicio}-criterio`);
  else if (p.code === N.cargaIlegible || campo.startsWith('suggestedLoad')) exactos.push(`${ejercicio}-carga`);
  else if (p.code === N.descansoIlegible || campo === 'restSeconds') exactos.push(`${ejercicio}-descanso`);
  else if (p.code === SIN_SERIES) exactos.push(`${ejercicio}-agregar-serie`);
  else {
    const parametro = /professionalParameters\[(\d+)\]/.exec(p.path);
    if (parametro) exactos.push(`${ejercicio}-param-${parametro[1]}-etiqueta`);
  }
  return [...exactos, renglonDelEjercicio(ejercicio)];
}

/**
 * Cuál de los campos enfocar, con lo que hay dibujado: `null` mientras el ejercicio (el ancla) no esté abierto; después,
 * el primero que exista. Con un solo campo (un menú, un nombre), ese, apenas exista.
 */
export function campoParaEnfocar(campos: readonly string[], existe: (id: string) => boolean, abierto: (id: string) => boolean): string | null {
  if (campos.length === 0) return null;
  if (campos.length === 1) return existe(campos[0]!) ? campos[0]! : null;
  const ancla = campos[campos.length - 1]!;
  if (!existe(ancla) || !abierto(ancla)) return null;
  return campos.find(existe) ?? null;
}
