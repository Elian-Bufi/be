/**
 * WP-08 D-H · un proveedor falso HTTP local que responde como Open Food Facts y como wger. Las pruebas nunca llaman a
 * un tercero: la CI no depende de que otro servicio esté arriba, y cada caso —completo, incompleto, inexistente,
 * caído, lento— se reproduce igual siempre.
 *
 * Todos los datos son inventados: códigos de barras de prueba, nombres y composiciones sintéticas.
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/** Códigos de barras de prueba (no son productos reales). */
export const OFF = {
  completo: '7790000000017',
  sinComposicion: '7790000000024',
  inexistente: '7790000000031',
  caido: '7790000000048',
  lento: '7790000000055',
  liquido: '7790000000062',
} as const;

/** Números de ejercicio de prueba. */
export const WGER = {
  enEspanol: '901',
  soloEnIngles: '902',
  inexistente: '903',
  caido: '904',
} as const;

const productoCompleto = {
  code: OFF.completo,
  product_name: 'Test crackers',
  product_name_es: 'Galletitas de prueba',
  nutriments: { 'energy-kcal_100g': 452, proteins_100g: 8.5, carbohydrates_100g: 66, fat_100g: 17.25, 'energy_100g': 1891 },
  nutrition_data_per: '100g',
};
const productoSinComposicion = { code: OFF.sinComposicion, product_name: 'Producto sin tabla', nutriments: {} };
const productoLiquido = {
  code: OFF.liquido,
  product_name_es: 'Bebida de prueba',
  product_quantity_unit: 'ml',
  nutriments: { 'energy-kcal_100g': 42, proteins_100g: 0, carbohydrates_100g: 10.6, fat_100g: 0 },
};

const ejercicio = (id: number, traducciones: { language: number; name: string; license: number; license_author: string }[]) => ({
  id,
  category: { id: 10, name: 'Abs' },
  muscles: [{ id: 6, name: 'Rectus abdominis', name_en: 'Abs' }],
  muscles_secondary: [{ id: 14, name: 'Obliquus externus abdominis', name_en: '' }],
  equipment: [{ id: 4, name: 'Gym mat' }],
  license: { id: 1, full_name: 'Creative Commons Attribution Share Alike 3', short_name: 'CC-BY-SA 3', url: 'https://creativecommons.org/licenses/by-sa/3.0/deed.en' },
  license_author: 'autora-sintetica',
  translations: traducciones,
  images: [{ id: 1, image: 'https://example.invalid/imagen.png' }],
});

export interface ProveedorFalso {
  readonly url: string;
  /** Cuántas consultas recibió, por ruta: para verificar que un reintento no vuelve a consultar. */
  readonly consultas: Map<string, number>;
  cerrar(): Promise<void>;
}

export async function levantarProveedorFalso(): Promise<ProveedorFalso> {
  const consultas = new Map<string, number>();
  const servidor: Server = createServer((req, res) => {
    const ruta = (req.url ?? '').split('?')[0]!;
    consultas.set(ruta, (consultas.get(ruta) ?? 0) + 1);
    const json = (status: number, cuerpo: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cuerpo));
    };
    const off = /^\/api\/v2\/product\/(\d+)\.json$/.exec(ruta);
    if (off) {
      const codigo = off[1];
      if (codigo === OFF.completo) return json(200, { status: 1, product: productoCompleto });
      if (codigo === OFF.sinComposicion) return json(200, { status: 1, product: productoSinComposicion });
      if (codigo === OFF.liquido) return json(200, { status: 1, product: productoLiquido });
      if (codigo === OFF.caido) return json(500, { error: 'sintético' });
      if (codigo === OFF.lento) return void setTimeout(() => json(200, { status: 1, product: productoCompleto }), 5_000);
      // Open Food Facts responde así cuando no tiene el producto.
      return json(404, { code: codigo, status: 0, status_verbose: 'product not found' });
    }
    const wger = /^\/api\/v2\/exerciseinfo\/(\d+)\/$/.exec(ruta);
    if (wger) {
      const numero = wger[1];
      if (numero === WGER.enEspanol)
        return json(200, ejercicio(901, [
          { language: 2, name: 'Abdominal stabilization', license: 1, license_author: 'autora-sintetica' },
          { language: 4, name: 'Estabilización abdominal', license: 2, license_author: 'traductora-sintetica' },
        ]));
      if (numero === WGER.soloEnIngles) return json(200, ejercicio(902, [{ language: 2, name: 'Plank', license: 1, license_author: 'autora-sintetica' }]));
      if (numero === WGER.caido) return json(503, { detail: 'sintético' });
      return json(404, { detail: 'No Exercise matches the given query.' });
    }
    json(404, {});
  });
  await new Promise<void>((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  const { port } = servidor.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    consultas,
    cerrar: () =>
      new Promise<void>((resolver) => {
        servidor.closeAllConnections?.();
        servidor.close(() => resolver());
      }),
  };
}
