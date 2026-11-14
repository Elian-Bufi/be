/**
 * La guardia de vocabulario de los gráficos (DL-174) y la frase de la coincidencia. Un gráfico puede juntar dos o tres
 * áreas: sus textos (títulos, rótulos de ejes, leyendas, lecturas, notas y «Cómo leerlo») pasan por la **unión** de las
 * listas de esas áreas, cada una con su regla:
 * - Nutrición: las palabras cortas, completas; el signo de porcentaje no va en ningún texto del gráfico, aunque también
 *   esté Antropometría.
 * - Entrenamiento: su lista y la de la fuerza (DL-171); el porcentaje solo como criterio de prescripción («% RM»).
 * - Antropometría: se admite la negación explícita («no es un diagnóstico»), como en sus pantallas.
 * Y además lo que no va en ningún lado (B05 y TEST-PRJ-009), tampoco negado.
 */
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { terminosProhibidosEn } from './copy-nutricion';
import { terminosProhibidosDeFuerzaEn } from './estimacion-de-fuerza';
import type { AreaDeMetrica } from './metricas-del-analisis';

/** Va debajo de todo gráfico con dos áreas o con dos ejes (GR-T06). «Analizar» deja su frase anterior por esta. */
export const FRASE_DE_LA_COINCIDENCIA = 'Coinciden en el tiempo; esto no prueba que una cosa cause la otra.';

/** Lo que ningún texto de un gráfico dice, de ninguna área y tampoco en negación. */
export const TERMINOS_PROHIBIDOS_EN_TODO_GRAFICO: readonly string[] = ['asesorado', 'asesorada', 'asesorados', 'asesoradas', 'cumplimiento', 'adherencia', 'racha', 'puntaje', 'score', 'ranking'];

const LETRA = 'a-záéíóúüñ';

function prohibidosSiempre(texto: string): string[] {
  const t = texto.toLowerCase();
  return TERMINOS_PROHIBIDOS_EN_TODO_GRAFICO.filter((p) => new RegExp(`(^|[^${LETRA}])${p}([^${LETRA}]|$)`).test(t));
}

const POR_AREA: Readonly<Record<AreaDeMetrica, (texto: string) => string[]>> = {
  NUTRICION: terminosProhibidosEn,
  ENTRENAMIENTO: terminosProhibidosDeFuerzaEn,
  ANTROPOMETRIA: terminosProhibidosDeAntropometriaEn,
};

/** Los términos prohibidos que aparecen en un texto de un gráfico de esas áreas, sin repetir. */
export function terminosProhibidosEnUnGrafico(texto: string, areas: readonly AreaDeMetrica[]): string[] {
  const hallados = [...prohibidosSiempre(texto)];
  for (const area of new Set(areas)) hallados.push(...POR_AREA[area](texto));
  return [...new Set(hallados)];
}
