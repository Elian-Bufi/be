/**
 * La cinta del tiempo (GR-23; WP-GRAFICOS fase 2, DL-174): lo que pasó en cada momento, arriba de los gráficos y sobre el
 * mismo eje de fechas. Acá queda su forma, que usan los carriles de tipo `EVENTOS`; el armado desde API-DSH-04 y las
 * vigencias de los planes llega en el próximo commit de la rama base.
 *
 * - Las versiones de los planes van como barras; las tomas, las sustituciones, las revisiones y las notas de
 *   coordinación, como íconos con forma y texto. Los hitos que caen juntos se agrupan («3 hitos»).
 * - Una descarga no se infiere: si no hay dato, no se dibuja. Un evento de un área sin acceso no llega (la API ya lo
 *   filtra) ni se dibuja como «algo pasó».
 * - Las notas de la persona al finalizar (PG-15) y las propias del profesional (PG-16) entran como dos fuentes más cuando
 *   se integre la tanda B. Los hábitos versionados (SP-08) tienen su lugar reservado y no se dibujan hasta su DL (GR-D10).
 */
import type { AreaDeMetrica } from '@be/domain';

export type TipoDeEventoDeLaCinta =
  | 'VERSION_DE_PLAN'
  | 'TOMA'
  | 'SUSTITUCION'
  | 'REVISION'
  | 'NOTA_DE_COORDINACION'
  /** Una sesión registrada con cambios respecto de lo indicado (`SESSION_WITH_DEVIATION` de API-DSH-04). */
  | 'SESION_CON_CAMBIOS'
  /** PG-15, con la tanda B. */
  | 'NOTA_DE_LA_PERSONA'
  /** PG-16, con la tanda B. */
  | 'NOTA_PROPIA'
  /** SP-08: lugar reservado, no se dibuja hasta su DL (GR-D10). */
  | 'HABITO';

export interface EventoDeLaCinta {
  /** Estable dentro de la cinta: elegir y volver al evento. */
  readonly clave: string;
  readonly tipo: TipoDeEventoDeLaCinta;
  /** El área del hecho; `null` si es de la relación (una nota de coordinación). */
  readonly area: AreaDeMetrica | null;
  readonly desde: string;
  /** Las barras (una versión de un plan) tienen fin; `null` si sigue o si es un hecho de un día. */
  readonly hasta: string | null;
  /** Lo que dice el ícono o la barra: «Plan de entrenamiento v3», «Toma», «3 hitos». */
  readonly rotulo: string;
  /** El detalle de la lectura y la tabla, o `null`. */
  readonly detalle: string | null;
  /** Cuántos hechos agrupa (1 si es uno solo). */
  readonly agrupados: number;
}
