/**
 * TEST-PG-002 (WP-PULIDO-GRANDES, PG-02 y PG-03): la pantalla de carga. El logo llena el aro sin el texto «BE» adentro, y
 * «BE está preparando tu espacio» con «Comprobando tu sesión» van en una sola región viva, sin que el indicador se anuncie
 * aparte. La cuenta del logo es pura (`logo-de-la-carga.ts`); lo demás se fija leyendo la pantalla
 * (`pantallas/recuperacion.tsx`).
 *
 * Mutación verificada: con el lado del logo en 132 (el diámetro del aro, sin la proporción de la esfera), queda un borde
 * vacío y la prueba se pone en rojo; con el `<Text>` de «BE» de vuelta dentro del emblema, también.
 *
 * Uso: cd apps/mobile && npx jest src/logo-de-la-carga.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import { LADO_DEL_EMBLEMA, LADO_DEL_LOGO_DE_LA_CARGA, PROPORCION_DE_LA_ESFERA, RADIO_DEL_ARO, ladoParaLlenarElAro } from './logo-de-la-carga';

// El jest de la APK compila sin los tipos de Node: lo poco que usa la lectura del código se declara acá.
declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const PANTALLA = readFileSync(join(__dirname, 'pantallas', 'recuperacion.tsx'), 'utf8');
const sinComentarios = (codigo: string) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/.*$/gm, '');
const CODIGO = sinComentarios(PANTALLA);
const tramo = (desde: string, hasta: string) => CODIGO.slice(CODIGO.indexOf(desde), CODIGO.indexOf(hasta, CODIGO.indexOf(desde) + desde.length));

describe('TEST-PG-002 · el logo llena el aro', () => {
  test('la esfera del logo cubre el aro entero y la imagen no se sale del emblema', () => {
    expect(LADO_DEL_LOGO_DE_LA_CARGA * PROPORCION_DE_LA_ESFERA).toBeGreaterThanOrEqual(2 * RADIO_DEL_ARO);
    // Sin pasarse: a lo sumo un dp más que lo justo, para que la esfera no tape el aro.
    expect(LADO_DEL_LOGO_DE_LA_CARGA * PROPORCION_DE_LA_ESFERA).toBeLessThan(2 * RADIO_DEL_ARO + 1);
    expect(LADO_DEL_LOGO_DE_LA_CARGA).toBeLessThanOrEqual(LADO_DEL_EMBLEMA);
    expect(ladoParaLlenarElAro(66, 0.5)).toBe(264);
  });

  test('el emblema usa ese lado, sin el texto «BE» adentro, y se llama «BE» una vez', () => {
    const emblema = tramo('function Emblema()', 'function Indicador(');
    expect(CODIGO).toMatch(/isotipo: \{ width: LADO_DEL_LOGO_DE_LA_CARGA, height: LADO_DEL_LOGO_DE_LA_CARGA \}/);
    expect(emblema).not.toMatch(/>\s*BE\s*</);
    expect(emblema).not.toMatch(/<Text\b/);
    expect(emblema.match(/accessibilityLabel="BE"/g)).toHaveLength(1);
    expect(emblema).toContain('r={RADIO_DEL_ARO}');
  });
});

describe('TEST-PG-002 · los dos textos, en una sola región viva', () => {
  test('«BE está preparando tu espacio» y, abajo, «Comprobando tu sesión»', () => {
    expect(PANTALLA).toContain("preparando: 'BE está preparando tu espacio',");
    expect(PANTALLA).toContain("comprobando: 'Comprobando tu sesión',");
  });

  test('mientras comprueba: una región viva con los dos, en orden, y el indicador sin anunciarse aparte', () => {
    const comprobando = tramo("if (fase.tipo === 'comprobando')", "if (fase.tipo === 'tardando')");
    expect(comprobando.match(/accessibilityLiveRegion=/g)).toHaveLength(1);
    expect(comprobando).toContain('accessibilityLabel={`${t.preparando}. ${t.comprobando}`}');
    expect(comprobando.indexOf('{t.preparando}')).toBeLessThan(comprobando.indexOf('{t.comprobando}'));
    expect(comprobando).toContain('<Indicador anunciado={false} />');
    expect(comprobando).not.toMatch(/%|porcentaje|progreso/i);
  });
});
