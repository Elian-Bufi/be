import type { Entorno } from '../config/entorno';
import { RutasFirmadas } from './rutas-firmadas';

/** Un secreto sintético: no firma nada fuera de esta prueba. */
const ENTORNO = { jwtSecret: 'secreto-sintetico-de-prueba-de-32-caracteres-o-mas' } as Entorno;
const MEDIO = '6a4f9c2e-1b3d-4e5f-8a9b-0c1d2e3f4a5b';

describe('DL-120 · rutas firmadas de los medios privados', () => {
  it('la ruta lleva solo [A-Za-z0-9._-] y se verifica con su propósito, dentro de su vigencia', () => {
    const rutas = new RutasFirmadas(ENTORNO);
    const vence = rutas.vencimiento('LECTURA');
    const token = rutas.firmar(MEDIO, 'LECTURA', vence);
    expect(token).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(rutas.verificar(token, 'LECTURA')).toEqual({ medioId: MEDIO, vence });
    // Una ruta de lectura no sirve para subir, ni al revés.
    expect(rutas.verificar(token, 'SUBIDA')).toBeNull();
    expect(rutas.verificar(rutas.firmar(MEDIO, 'SUBIDA', rutas.vencimiento('SUBIDA')), 'LECTURA')).toBeNull();
  });

  it('vence a los 10 minutos para subir y a los 15 para leer (08 §21)', () => {
    const rutas = new RutasFirmadas(ENTORNO);
    const ahora = Date.UTC(2026, 9, 5, 12, 0, 0);
    rutas.ahora = () => ahora;
    expect(rutas.vencimiento('SUBIDA').getTime() - ahora).toBe(10 * 60 * 1000);
    expect(rutas.vencimiento('LECTURA').getTime() - ahora).toBe(15 * 60 * 1000);
    const token = rutas.firmar(MEDIO, 'LECTURA', rutas.vencimiento('LECTURA'));
    rutas.ahora = () => ahora + 15 * 60 * 1000 - 1;
    expect(rutas.verificar(token, 'LECTURA')).not.toBeNull();
    rutas.ahora = () => ahora + 15 * 60 * 1000;
    expect(rutas.verificar(token, 'LECTURA')).toBeNull();
  });

  it('una ruta alterada (carga, firma, o firmada con otro secreto) no vale', () => {
    const rutas = new RutasFirmadas(ENTORNO);
    const token = rutas.firmar(MEDIO, 'LECTURA', rutas.vencimiento('LECTURA'));
    const [carga, firma] = token.split('.') as [string, string];
    const otraCarga = Buffer.from(`l.${MEDIO.replace('6a4f', '7a4f')}.${Math.floor(Date.now() / 1000) + 900}`, 'utf8').toString('base64url');
    const cambiarUno = (s: string) => `${s.slice(0, -1)}${s.endsWith('A') ? 'B' : 'A'}`;
    for (const alterada of [`${otraCarga}.${firma}`, `${carga}.${cambiarUno(firma)}`, `${carga}.`, carga, `${carga}.${firma}.x`, 'basura']) {
      expect(rutas.verificar(alterada, 'LECTURA')).toBeNull();
    }
    const otroServidor = new RutasFirmadas({ jwtSecret: 'otro-secreto-sintetico-de-32-caracteres-o-mas!' } as Entorno);
    expect(otroServidor.verificar(token, 'LECTURA')).toBeNull();
  });

  it('la clave de las rutas es derivada: no es el secreto de las sesiones', () => {
    const rutas = new RutasFirmadas(ENTORNO);
    const clave = (rutas as unknown as { clave: Buffer }).clave;
    expect(clave.length).toBe(32);
    expect(clave.toString('utf8')).not.toContain(ENTORNO.jwtSecret);
    expect(clave.equals(Buffer.from(ENTORNO.jwtSecret).subarray(0, 32))).toBe(false);
  });
});
