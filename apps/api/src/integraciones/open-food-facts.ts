import { Inject, Injectable } from '@nestjs/common';
import type { AlimentoCandidato, LicenciaExterna } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { comoJson, consultarProveedor, ProveedorNoDisponible, textoDelProveedor, type RespuestaDelProveedor } from './proveedor-http';

/**
 * Open Food Facts (RF-028; 09v12 §5). Se consulta un producto por su código de barras y se normaliza **únicamente lo
 * necesario para revisión** (09v12:196): nombre, base y composición. Nada se convierte ni se completa:
 * si el producto no declara las kilocalorías, el candidato dice `null`, no las calcula desde los kilojoules. El
 * profesional ve el faltante y decide (RF-028: «datos insuficientes se corrigen o rechazan»).
 */
export const LICENCIA_DE_OPEN_FOOD_FACTS: LicenciaExterna = {
  id: 'ODbL-1.0',
  label: 'Open Database License (ODbL) 1.0',
  url: 'https://opendatacommons.org/licenses/odbl/1-0/',
  attribution: 'Colaboradores de Open Food Facts',
};

/**
 * Los campos que se piden: solo los que se revisan (minimización, 08). `quantity` y `product_quantity` van aunque no se
 * muestran: Open Food Facts deriva `product_quantity_unit` de ellos y, si no se piden, no la devuelve —y sin la unidad
 * del envase no se puede ver que un «100g» es dudoso en un líquido— (verificado el 2026-09-24 con 5449000000996).
 */
const CAMPOS = 'code,product_name,product_name_es,generic_name,generic_name_es,nutriments,nutrition_data_per,quantity,product_quantity,product_quantity_unit';

export type ResultadoDeOpenFoodFacts =
  | { readonly encontrado: true; readonly candidato: AlimentoCandidato; readonly respuesta: RespuestaDelProveedor; readonly licencia: LicenciaExterna }
  | { readonly encontrado: false };

@Injectable()
export class OpenFoodFacts {
  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  async consultar(codigoDeBarras: string): Promise<ResultadoDeOpenFoodFacts> {
    const url = `${this.entorno.proveedores.openFoodFactsUrl}/api/v2/product/${encodeURIComponent(codigoDeBarras)}.json?fields=${CAMPOS}`;
    const respuesta = await consultarProveedor(url, this.entorno.proveedores.presupuestoMs);
    const json = comoJson(respuesta.cuerpo);
    const cuerpo = json !== null && typeof json === 'object' && !Array.isArray(json) ? (json as { status?: unknown; product?: unknown }) : null;
    // «No tengo ese producto» es un 404 —o un 200— con el cuerpo propio de Open Food Facts: `status: 0`. Un 404 con otra
    // forma (una ruta que cambió, un proxy, una base mal configurada) no dice nada del producto: es una caída.
    if (cuerpo?.status === 0 && (respuesta.status === 404 || respuesta.status === 200)) return { encontrado: false };
    if (respuesta.status !== 200 || cuerpo === null || !cuerpo.product || typeof cuerpo.product !== 'object') throw new ProveedorNoDisponible(`respuesta inesperada ${respuesta.status}`);
    return { encontrado: true, candidato: normalizarProducto(cuerpo.product as Record<string, unknown>), respuesta, licencia: LICENCIA_DE_OPEN_FOOD_FACTS };
  }
}

/**
 * El producto tal como lo describe Open Food Facts, llevado a la forma del candidato. Pura: se prueba sin red.
 *
 * La base (cada 100 g o cada 100 ml) se toma solo cuando el proveedor la declara sin ambigüedad. Open Food Facts guarda
 * `nutrition_data_per: "100g"` también en muchos líquidos: si el envase se mide en ml, cl o l y la base dice «100g», no
 * se sabe cuál es, y el candidato dice `null` para que el profesional la elija (B10-10 §1: un faltante no se completa).
 */
export function normalizarProducto(p: Record<string, unknown>): AlimentoCandidato {
  const n = (p.nutriments && typeof p.nutriments === 'object' ? p.nutriments : {}) as Record<string, unknown>;
  const por = typeof p.nutrition_data_per === 'string' ? p.nutrition_data_per.trim().toLowerCase() : null;
  const unidadDelEnvase = typeof p.product_quantity_unit === 'string' ? p.product_quantity_unit.trim().toLowerCase() : null;
  const envaseLiquido = unidadDelEnvase === 'ml' || unidadDelEnvase === 'cl' || unidadDelEnvase === 'l';
  return {
    name: primerTexto(p.product_name_es, p.product_name, p.generic_name_es, p.generic_name),
    composition: {
      referenceAmount: por === '100ml' ? '100ml' : por === '100g' && !envaseLiquido ? '100g' : null,
      energyKcal: nutriente(n['energy-kcal_100g']),
      proteinG: nutriente(n.proteins_100g),
      carbohydrateG: nutriente(n.carbohydrates_100g),
      fatG: nutriente(n.fat_100g),
    },
  };
}

/** Un nutriente declarado: número finito y no negativo. Cualquier otra cosa es «no vino», nunca cero. */
function nutriente(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function primerTexto(...candidatos: unknown[]): string | null {
  for (const c of candidatos) {
    const t = textoDelProveedor(c);
    if (t !== null) return t;
  }
  return null;
}
