/**
 * TEST-PG-003 (WP-PULIDO-GRANDES, PG-04, con PG-D2): el título grande y el de la cabecera nunca a la vez; sin fundido con
 * «reducir movimiento». La lógica es pura (`titulo-de-la-cabecera.ts`); la conexión con la cabecera, el título grande y
 * el desplazamiento se fija leyendo el código.
 *
 * Mutación verificada: con el grande en `v` en lugar de `1 − v`, los dos quedan prendidos y la prueba se pone en rojo; con
 * el umbral en `>` cero en lugar del fin del título, sube antes de tiempo y también.
 *
 * Uso: cd apps/mobile && npx jest src/titulo-de-la-cabecera.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import { crearRegistroDelTitulo, duracionDelTitulo, finDelTitulo, FUNDIDO_DEL_TITULO, margenDelTituloChico, opacidadesDelTitulo, tituloEnLaCabecera } from './titulo-de-la-cabecera';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]) => readFileSync(join(__dirname, ...partes), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('TEST-PG-003 · un solo título a la vez', () => {
  test('en todo el fundido, nunca los dos a más del 50 %', () => {
    for (let i = 0; i <= 100; i++) {
      const { cabecera, grande } = opacidadesDelTitulo(i / 100);
      expect(cabecera > 0.5 && grande > 0.5).toBe(false);
      expect(cabecera + grande).toBeCloseTo(1);
    }
    expect(opacidadesDelTitulo(0)).toEqual({ cabecera: 0, grande: 1 });
    expect(opacidadesDelTitulo(1)).toEqual({ cabecera: 1, grande: 0 });
  });

  test('sube al pasar el borde de abajo del título grande, no antes; sin título medido, no sube', () => {
    const fin = finDelTitulo(0, 34);
    expect(fin).toBe(54);
    expect(tituloEnLaCabecera(0, fin)).toBe(false);
    expect(tituloEnLaCabecera(53, fin)).toBe(false);
    expect(tituloEnLaCabecera(54, fin)).toBe(true);
    expect(tituloEnLaCabecera(800, null)).toBe(false);
  });

  test('con «reducir movimiento», instantáneo; si no, el fundido corto de la cabecera', () => {
    expect(duracionDelTitulo(true)).toBe(0);
    expect(duracionDelTitulo(false)).toBe(FUNDIDO_DEL_TITULO);
  });

  test('el título chico deja lugar para «Volver», el logo y la campana', () => {
    expect(margenDelTituloChico(true)).toBeGreaterThanOrEqual(105);
    expect(margenDelTituloChico(false)).toBeGreaterThanOrEqual(54);
  });
});

describe('TEST-PG-003 · el registro: el primer título de la pantalla, y se va con ella', () => {
  test('el primero que se registra manda; al irse, el siguiente; la medida avisa', () => {
    const r = crearRegistroDelTitulo();
    let avisos = 0;
    r.suscribir(() => avisos++);
    expect(r.actual()).toBeNull();
    r.registrar('a', 'Nutrición');
    r.registrar('b', 'Otro título de la misma pantalla');
    expect(r.actual()).toEqual({ texto: 'Nutrición', fin: null });
    r.medir('a', 62);
    expect(r.actual()).toEqual({ texto: 'Nutrición', fin: 62 });
    r.medir('a', 62);
    r.quitar('a');
    expect(r.actual()?.texto).toBe('Otro título de la misma pantalla');
    r.quitar('b');
    expect(r.actual()).toBeNull();
    expect(avisos).toBe(4);
  });
});

describe('TEST-PG-003 · la conexión (lectura del código)', () => {
  test('el grande se apaga con 1 − v y se lee como encabezado; el chico va con v, no se lee y se corta con «…»', () => {
    const conexion = leer('titulo-en-la-cabecera.tsx');
    expect(conexion).toContain('outputRange: [1, 0]');
    const ui = leer('ui.tsx');
    expect(ui).toMatch(/<Animated\.Text style=\{\[estilos\.titulo, opacidad \? \{ opacity: opacidad \} : null\]\} accessibilityRole="header" onLayout=\{alMedir\}>/);
    const cabecera = leer('cabecera.tsx');
    expect(cabecera).toMatch(/importantForAccessibility="no-hide-descendants"\s*accessibilityElementsHidden\s*style=\{\[estilos\.centro, \{ left: margen, right: margen, opacity: titulo\.valor \}\]\}/);
    expect(cabecera).toContain('numberOfLines={1} ellipsizeMode="tail"');
    expect(cabecera).toMatch(/centro: \{ position: 'absolute'/);
  });

  test('App.tsx lo anima al cruzar el umbral, con el controlador nativo y la duración de «reducir movimiento»', () => {
    const app = leer('..', 'App.tsx');
    expect(app).toContain('if (arriba !== tituloArriba.current) {');
    expect(app).toContain('Animated.timing(valorDelTitulo, { toValue: arriba ? 1 : 0, duration: duracionDelTitulo(movimientoReducido), useNativeDriver: true }).start();');
    expect(app).toContain('<ContextoDelTitulo.Provider value={tituloCompartido}>');
    expect(app).toContain('titulo={tituloCompartido}');
  });

  test('Inicio conserva la fecha como título', () => {
    expect(leer('pantallas', 'inicio.tsx')).toContain('<Titulo>{fechaLarga(hoy)}</Titulo>');
  });
});
