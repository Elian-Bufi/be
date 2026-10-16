import { NUTRIENTE_DE_LA_METRICA, nutrienteParaMostrar, valorConUnidad, type DefinicionDeMetrica, type MetricaNutricional } from '@be/domain';

/**
 * Un valor para mostrar. En nutrición, con la misma función de la pantalla de registro (`nutrienteParaMostrar`: kcal a
 * entero y gramos a un decimal, HALF_UP sobre el exacto), para que el número coincida en los dos lugares (encargo §11).
 */
export function valorParaMostrar(valor: number, definicion: DefinicionDeMetrica, unidad: string): string {
  if (definicion.area === 'NUTRICION' && definicion.parametro !== 'RECORDS') {
    const nutriente = NUTRIENTE_DE_LA_METRICA[definicion.parametro as Exclude<MetricaNutricional, 'RECORDS'>];
    try {
      const texto = nutriente ? nutrienteParaMostrar({ value: String(valor) }, nutriente) : null;
      if (texto !== null) return `${texto} ${unidad}`;
    } catch {
      // Un valor que no es un decimal exacto (no debería pasar): se muestra con los decimales de la métrica.
    }
  }
  return valorConUnidad(valor, unidad, definicion.decimales);
}
