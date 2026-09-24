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
  /** Declara «cada 100 ml». */
  liquido: '7790000000062',
  /** Envase en ml y base «100g»: Open Food Facts lo guarda así en muchos líquidos; la base no se sabe. */
  liquidoAmbiguo: '7790000000079',
  /** Responde 200 con `status: 0`: tampoco lo tiene. */
  sinProductoCon200: '7790000000086',
  /** Un cuerpo de más de 2 MB, sin `content-length`: se corta al leerlo. */
  enorme: '7790000000093',
  /** `content-length` de más de 2 MB: se descarta sin leerlo. */
  enormeDeclarado: '7790000000109',
  /** Una redirección: no se sigue. */
  redirige: '7790000000116',
  /** Un 404 que no es de Open Food Facts (HTML): la ruta cambió, no es «no existe». */
  rutaRota: '7790000000123',
} as const;

/** Números de ejercicio de prueba. */
export const WGER = {
  enEspanol: '901',
  soloEnIngles: '902',
  inexistente: '903',
  caido: '904',
  /** Un 404 en HTML: la ruta cambió, no es «no existe». */
  rutaRota: '905',
  /** Traducciones con basura: un `null`, un número, un nombre con caracteres de control. */
  datosRaros: '906',
  /** La traducción elegida no informa su licencia ni su autor. */
  sinAutor: '907',
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
  nutrition_data_per: '100ml',
  nutriments: { 'energy-kcal_100g': 42, proteins_100g: 0, carbohydrates_100g: 10.6, fat_100g: 0 },
};
const productoLiquidoAmbiguo = { ...productoLiquido, code: OFF.liquidoAmbiguo, product_name_es: 'Bebida ambigua de prueba', nutrition_data_per: '100g' };

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
      if (codigo === OFF.liquidoAmbiguo) return json(200, { status: 1, product: productoLiquidoAmbiguo });
      if (codigo === OFF.sinProductoCon200) return json(200, { code: codigo, status: 0, status_verbose: 'product not found' });
      if (codigo === OFF.enorme) {
        // Sin content-length: se manda de a partes, 3 MB en total. La API tiene que cortar al pasar los 2 MB.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const parte = Buffer.alloc(256 * 1024, 0x20);
        for (let i = 0; i < 12; i++) res.write(parte);
        return void res.end();
      }
      if (codigo === OFF.enormeDeclarado) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': String(3 * 1024 * 1024) });
        return void res.end('{}');
      }
      if (codigo === OFF.redirige) {
        res.writeHead(302, { Location: 'http://127.0.0.1:9/otra-parte' });
        return void res.end();
      }
      if (codigo === OFF.rutaRota) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return void res.end('<html><body>Not Found</body></html>');
      }
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
      if (numero === WGER.rutaRota) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return void res.end('<html><body>Page not found</body></html>');
      }
      if (numero === WGER.datosRaros)
        return json(200, {
          ...ejercicio(906, []),
          translations: [null, 7, { language: 4, name: 'Plancha\u0000 lateral\t ', license: 2, license_author: 'autora\u0007-sintetica' }],
        });
      if (numero === WGER.sinAutor) return json(200, ejercicio(907, [{ language: 4, name: 'Puente de glúteos', license: 99 } as never]));
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
