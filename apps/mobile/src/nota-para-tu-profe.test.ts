/**
 * TEST-PG-014 (WP-PULIDO-GRANDES, PG-15, con PG-D10), la parte de la APK: la nota para tu profe nunca bloquea el cierre.
 * Se prueba la lógica (`nota-para-tu-profe.ts`: el texto con las frases, el tope y qué pasa con cada respuesta) y, leyendo
 * el código, que finalizar no la manda ni la espera: confirmar (API-TRN-18) sigue igual, y la nota vive en la pantalla de
 * la sesión ya registrada, con su propia operación (API-TRN-25).
 *
 * Mutaciones verificadas, cada una pone su prueba en rojo: mandar la nota dentro de `finalizar()`; dar por enviada una nota
 * sin respuesta del servidor; tratar el 404 como reintentable; ordenar las frases como se tocaron.
 *
 * Uso: cd apps/mobile && npx jest src/nota-para-tu-profe.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import { MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION, type Resultado } from '@be/domain';
import { alternarFrase, caracteresQueQuedan, FRASES_PARA_TU_PROFE, sePuedeMandar, TEXTO_DEL_MOTIVO, TEXTOS_DE_LA_NOTA, textoDeLaNota, trasMandar } from './nota-para-tu-profe';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]) => readFileSync(join(__dirname, ...partes), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const api = (status: number, codigo: string): Resultado<unknown> => ({ ok: false, tipo: 'API', status, codigo, issues: [] });

describe('TEST-PG-014 · el texto de la nota', () => {
  test('las frases van en el orden de la lista, cada una con su punto, y después lo escrito', () => {
    expect([...FRASES_PARA_TU_PROFE]).toEqual(['Algo me molestó', 'Cambié de máquina', 'Tuve poco tiempo']);
    expect(textoDeLaNota(['Tuve poco tiempo', 'Algo me molestó'], '  la rodilla  ')).toBe('Algo me molestó. Tuve poco tiempo. la rodilla');
    expect(textoDeLaNota([], 'Solo esto')).toBe('Solo esto');
    expect(textoDeLaNota(['Cambié de máquina'], '')).toBe('Cambié de máquina.');
    expect(textoDeLaNota([], '   ')).toBe('');
  });

  test('tocar una frase la suma o la saca', () => {
    expect(alternarFrase([], 'Algo me molestó')).toEqual(['Algo me molestó']);
    expect(alternarFrase(['Algo me molestó', 'Tuve poco tiempo'], 'Algo me molestó')).toEqual(['Tuve poco tiempo']);
  });

  test('hasta 280 caracteres: vacía o de más no se manda, y se dice cuánto sobra', () => {
    expect(MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION).toBe(280);
    expect(sePuedeMandar('x'.repeat(280))).toBe(true);
    expect(sePuedeMandar('x'.repeat(281))).toBe(false);
    expect(sePuedeMandar('   ')).toBe(false);
    expect(caracteresQueQuedan('x'.repeat(283))).toBe(-3);
    expect(TEXTOS_DE_LA_NOTA.quedan(-3)).toBe('Sobran 3 caracteres.');
    expect(TEXTOS_DE_LA_NOTA.quedan(1)).toBe('Te queda 1 carácter.');
  });
});

describe('TEST-PG-014 · lo enviado, solo con la respuesta del servidor', () => {
  test('enviada solo con el éxito; sin respuesta, se reintenta con la misma clave', () => {
    expect(trasMandar({ ok: true, datos: {} })).toEqual({ tipo: 'enviada' });
    expect(trasMandar({ ok: false, tipo: 'RED' } as Resultado<unknown>)).toEqual({ tipo: 'no-se-mando', motivo: 'conexion', reintentable: true });
    expect(trasMandar(api(503, 'DB_UNAVAILABLE'))).toMatchObject({ motivo: 'conexion', reintentable: true });
    expect(trasMandar(api(429, 'RATE_LIMITED'))).toMatchObject({ motivo: 'conexion', reintentable: true });
  });

  test('sin acceso, con el tope o con un texto que la API no acepta, reintentar no cambia nada', () => {
    expect(trasMandar(api(404, 'RESOURCE_NOT_FOUND'))).toEqual({ tipo: 'no-se-mando', motivo: 'sin-acceso', reintentable: false });
    expect(trasMandar(api(422, 'VALIDATION_FAILED'))).toEqual({ tipo: 'no-se-mando', motivo: 'tope', reintentable: false });
    expect(trasMandar(api(400, 'INVALID_REQUEST'))).toEqual({ tipo: 'no-se-mando', motivo: 'no-se-entendio', reintentable: false });
    for (const texto of Object.values(TEXTO_DEL_MOTIVO)) expect(texto.length).toBeGreaterThan(10);
    // Lo que se le dice a la persona: la sesión ya quedó registrada.
    expect(TEXTO_DEL_MOTIVO.conexion).toContain('ya quedó registrada');
    expect(TEXTO_DEL_MOTIVO['sin-acceso']).toContain('sigue registrada');
  });
});

describe('TEST-PG-014 · la nota nunca bloquea el cierre', () => {
  const sesion = leer('pantallas', 'entrenamiento.tsx');
  const inicio = sesion.indexOf('async function finalizar()');
  const fin = sesion.indexOf('\n  }\n', inicio);
  const finalizar = sesion.slice(inicio, fin);

  test('finalizar confirma como siempre y no manda ni espera ninguna nota', () => {
    expect(inicio).toBeGreaterThan(0);
    expect(finalizar).toContain('api.confirmarEjecucion(');
    expect(finalizar).not.toMatch(/agregarNotaDeLaSesion|notasDeMiSesion|NotaParaTuProfe/);
  });

  test('la nota vive en la pantalla de la sesión ya registrada, con su propia operación', () => {
    const pantalla = sesion.slice(sesion.indexOf('export function PantallaDeEjecucionDeEntrenamiento('));
    expect(pantalla).toContain('<NotaParaTuProfe');
    const nota = leer('pantallas', 'nota-para-tu-profe.tsx');
    expect(nota).toContain('api.agregarNotaDeLaSesion(');
    expect(nota).toContain('api.notasDeMiSesion(');
    expect(nota).not.toContain('confirmarEjecucion');
  });
});
