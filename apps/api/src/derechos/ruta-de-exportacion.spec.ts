import { RutaDeExportacion } from './ruta-de-exportacion';
import type { Entorno } from '../config/entorno';

/**
 * TEST-UF-011 (UF-06 de WP-USO-FINAL; DL-169; 08 §21): la ruta firmada de la descarga de una exportación propia. Vence a
 * los 15 minutos, no se puede alterar, y no sirve con otra clave (otro servidor) ni como la de un medio.
 */
const EXPORTACION = '00000000-0000-4000-8000-0000000000e1';
const entorno = (jwtSecret: string) => ({ jwtSecret }) as unknown as Entorno;

describe('TEST-UF-011 · la ruta firmada de la exportación propia', () => {
  it('vale hasta los 15 minutos y después no', () => {
    const rutas = new RutaDeExportacion(entorno('secreto-sintetico-de-prueba-de-32-caracteres'));
    const ahora = Date.now();
    rutas.ahora = () => ahora;
    const vence = rutas.vencimiento();
    expect(vence.getTime() - Math.floor(ahora / 1000) * 1000).toBe(15 * 60 * 1000);
    const token = rutas.firmar(EXPORTACION, vence, 7);
    // La versión del control de sesión viaja firmada: la descarga la compara con la vigente (una revocación la corta).
    expect(rutas.verificar(token)).toEqual({ exportacionId: EXPORTACION, vence, versionDeSesion: 7 });
    rutas.ahora = () => vence.getTime();
    expect(rutas.verificar(token)).toBeNull();
  });

  it('alterada, de otro servidor o con forma rara, no vale', () => {
    const rutas = new RutaDeExportacion(entorno('secreto-sintetico-de-prueba-de-32-caracteres'));
    const token = rutas.firmar(EXPORTACION, rutas.vencimiento(), 1);
    const [carga, firma] = token.split('.') as [string, string];
    expect(rutas.verificar(`${carga}.${firma.slice(0, -1)}${firma.endsWith('A') ? 'B' : 'A'}`)).toBeNull();
    expect(rutas.verificar(`${Buffer.from(`e.${EXPORTACION}.9999999999.1`).toString('base64url')}.${firma}`)).toBeNull();
    // Otra versión de sesión con la misma firma tampoco: la versión es parte de lo firmado.
    const vence = Math.floor(rutas.vencimiento().getTime() / 1000);
    expect(rutas.verificar(`${Buffer.from(`e.${EXPORTACION}.${vence}.2`).toString('base64url')}.${firma}`)).toBeNull();
    expect(new RutaDeExportacion(entorno('otro-secreto-sintetico-de-prueba-de-32-c')).verificar(token)).toBeNull();
    for (const raro of ['', 'sin-punto', 'a.b.c', `${'x'.repeat(300)}.y`]) expect(rutas.verificar(raro)).toBeNull();
  });
});
