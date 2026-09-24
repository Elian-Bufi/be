import { Inject, Injectable } from '@nestjs/common';
import type { AlimentoCandidato, LicenciaExterna } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { comoJson, consultarProveedor, ProveedorNoDisponible, type RespuestaDelProveedor } from './proveedor-http';

/**
 * Open Food Facts (RF-028; 09v12 §5). Se consulta un producto por su código de barras y se normaliza **únicamente lo
 * necesario para revisión** (09v12:196): nombre y composición cada 100 g o 100 ml. Nada se convierte ni se completa:
 * si el producto no declara las kilocalorías, el candidato dice `null`, no las calcula desde los kilojoules. El
 * profesional ve el faltante y decide (RF-028: «datos insuficientes se corrigen o rechazan»).
 */
export const LICENCIA_DE_OPEN_FOOD_FACTS: LicenciaExterna = {
  id: 'ODbL-1.0',
  label: 'Open Database License (ODbL) 1.0',
  url: 'https://opendatacommons.org/licenses/odbl/1-0/',
  attribution: 'Colaboradores de Open Food Facts',
};

/** Los campos que se piden: solo los que se revisan (minimización, 08). */
const CAMPOS = 'code,product_name,product_name_es,generic_name,generic_name_es,nutriments,nutrition_data_per,product_quantity_unit';

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
    if (respuesta.status === 404) return { encontrado: false };
    if (respuesta.status !== 200 || json === null || typeof json !== 'object') throw new ProveedorNoDisponible(`respuesta inesperada ${respuesta.status}`);
    const producto = (json as { status?: unknown; product?: unknown }).product;
    // Open Food Facts responde 200 con `status: 0` cuando no tiene el producto.
    if ((json as { status?: unknown }).status === 0 || !producto || typeof producto !== 'object') return { encontrado: false };
    return { encontrado: true, candidato: normalizarProducto(producto as Record<string, unknown>), respuesta, licencia: LICENCIA_DE_OPEN_FOOD_FACTS };
  }
}

/** El producto tal como lo describe Open Food Facts, llevado a la forma del candidato. Pura: se prueba sin red. */
export function normalizarProducto(p: Record<string, unknown>): AlimentoCandidato {
  const n = (p.nutriments && typeof p.nutriments === 'object' ? p.nutriments : {}) as Record<string, unknown>;
  const liquido = p.nutrition_data_per === '100ml' || (typeof p.product_quantity_unit === 'string' && p.product_quantity_unit.toLowerCase() === 'ml');
  return {
    name: primerTexto(p.product_name_es, p.product_name, p.generic_name_es, p.generic_name),
    composition: {
      referenceAmount: liquido ? '100ml' : '100g',
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
  for (const c of candidatos) if (typeof c === 'string' && c.trim() !== '') return c.trim().slice(0, 200);
  return null;
}
