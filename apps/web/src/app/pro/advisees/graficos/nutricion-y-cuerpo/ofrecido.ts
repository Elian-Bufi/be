/**
 * Cuándo se ofrece un gráfico de Nutrición o Antropometría (WP-GRAFICOS fase 2, rama C; DL-174): solo si se ofrecen
 * todas sus series con esta persona (`seriesOfrecidas`, del catálogo). Un área sin acceso no deja rastro, y una serie de
 * dos áreas (los g/kg) pide además planes o tomas propios en las dos.
 */
import { seriesOfrecidas } from '@be/domain';
import type { ContextoDelRegistro } from '../registro-de-graficos';

export const seOfrecenTodas =
  (series: readonly string[]) =>
  (c: ContextoDelRegistro): boolean => {
    const ofrecidas = new Set(seriesOfrecidas(c.acceso).map((s) => s.id));
    return series.length > 0 && series.every((s) => ofrecidas.has(s));
  };
