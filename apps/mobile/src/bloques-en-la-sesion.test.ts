/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION) · los bloques de la sesión en la APK: los ejercicios de una sesión planificada,
 * agrupados bajo su bloque. Se prueba la lógica pura (`bloques-en-la-sesion.ts`) y, leyendo el código, que las listas de
 * ejercicios de las pantallas la usan.
 * - Sin bloques (sin la clave o con la lista vacía), las partes son la lista de siempre: un ejercicio suelto por lugar.
 * - Con uno «En vueltas», el encabezado lleva su nombre y la indicación; TalkBack la lee entera, con el descanso en palabras.
 * - Uno «Seguido», solo el título. En «Ya la hice», el resumen en lugar de la indicación.
 * - Un bloque sin ejercicios no se muestra; un ejercicio con un bloque que la sesión no tiene queda suelto, a la vista.
 *
 * Mutaciones verificadas (2026-11-19), que ponen estas pruebas en rojo: dar la indicación en un «Seguido» (3 en rojo);
 * dar la indicación en «Ya la hice» (1); mostrar un bloque vacío (1). Volver a recorrer `prescriptions.map` en alguna de
 * las pantallas pone en rojo su prueba de lectura del código.
 *
 * Uso: cd apps/mobile && npx jest src/bloques-en-la-sesion.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { terminosProhibidosDeEntrenamientoEn, type BloqueDeLaSesion } from '@be/domain';
import { descansoParaLeer, encabezadoDelBloque, partesParaMostrar, type ParteDeLaLista } from './bloques-en-la-sesion';

// El jest de la APK compila sin los tipos de Node: lo poco que usa la lectura del código se declara acá.
declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

type Ejercicio = { readonly prescriptionId: string; readonly exerciseName: string; readonly exerciseGroupId?: string | null };
const ej = (prescriptionId: string, exerciseName: string, exerciseGroupId?: string | null): Ejercicio => ({ prescriptionId, exerciseName, ...(exerciseGroupId !== undefined ? { exerciseGroupId } : {}) });
const bloque = (groupId: string, label: string, order: number, extra: Partial<BloqueDeLaSesion> = {}): BloqueDeLaSesion => ({ groupId, label, order, kind: 'SEQUENTIAL', rounds: null, restAfterRoundSeconds: null, ...extra });

/** Lo que se ve, en una línea por parte: así la prueba lee como la pantalla. */
const vista = (partes: readonly ParteDeLaLista<Ejercicio>[]): string[] =>
  partes.map((p) =>
    p.tipo === 'suelto'
      ? `${p.ejercicio.posicion + 1}. ${p.ejercicio.prescripcion.exerciseName}`
      : `[${p.encabezado.nombre}${p.encabezado.detalle ? ` | ${p.encabezado.detalle}` : ''}] ${p.ejercicios.map((e) => `${e.posicion + 1}. ${e.prescripcion.exerciseName}`).join(', ')}`,
  );

const SIN_BLOQUES = [ej('p1', 'Sentadilla goblet'), ej('p2', 'Press de banca'), ej('p3', 'Remo con barra')];

describe('DL-181 · la lista de ejercicios con sus bloques', () => {
  test('sin bloques, las partes son la lista de siempre: un ejercicio suelto por lugar, en su orden', () => {
    const siempre = ['1. Sentadilla goblet', '2. Press de banca', '3. Remo con barra'];
    // La APK que declara la capacidad recibe la lista vacía y cada ejercicio con `null`; la de antes, sin las claves.
    expect(vista(partesParaMostrar({ prescriptions: SIN_BLOQUES }))).toEqual(siempre);
    expect(vista(partesParaMostrar({ prescriptions: SIN_BLOQUES.map((p) => ({ ...p, exerciseGroupId: null })), exerciseGroups: [] }))).toEqual(siempre);
    const partes = partesParaMostrar({ prescriptions: SIN_BLOQUES });
    expect(partes.every((p) => p.tipo === 'suelto')).toBe(true);
    // Cada parte lleva el mismo objeto de la sesión: la pantalla dibuja lo mismo que antes.
    expect(partes.map((p) => (p.tipo === 'suelto' ? p.ejercicio.prescripcion : null))).toEqual(SIN_BLOQUES);
    expect(partesParaMostrar({ prescriptions: [] })).toEqual([]);
  });

  test('con uno «En vueltas»: el encabezado con su nombre y la indicación, y los ejercicios numerados desde la sesión', () => {
    const sesion = {
      prescriptions: [ej('p0', 'Movilidad de cadera', null), ej('p1', 'Press de banca', 'g-1'), ej('p2', 'Remo con barra', 'g-1'), ej('p3', 'Plancha', null)],
      exerciseGroups: [bloque('g-1', 'Torso', 1, { kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 })],
    };
    const partes = partesParaMostrar(sesion);
    expect(vista(partes)).toEqual(['1. Movilidad de cadera', '[Torso | Alterná estos 2 ejercicios · 3 vueltas · descansá 90 s al terminar cada vuelta] 2. Press de banca, 3. Remo con barra', '4. Plancha']);
    const b = partes[1]!;
    if (b.tipo !== 'bloque') throw new Error('se esperaba el bloque');
    // TalkBack: el bloque, la indicación con comas y el descanso en palabras.
    expect(b.encabezado.etiqueta).toBe('Bloque Torso. Alterná estos 2 ejercicios, 3 vueltas, descansá 90 segundos al terminar cada vuelta.');
    expect(b.encabezado.groupId).toBe('g-1');
  });

  test('uno «Seguido» lleva solo el título; sin nombre, «Bloque N», y el lector no lo repite', () => {
    const sesion = {
      prescriptions: [ej('p1', 'Sentadilla goblet', 'g-1'), ej('p2', 'Prensa de piernas', 'g-1'), ej('p3', 'Plancha', 'g-2')],
      exerciseGroups: [bloque('g-1', 'Pierna', 1), bloque('g-2', '  ', 2)],
    };
    const partes = partesParaMostrar(sesion);
    expect(vista(partes)).toEqual(['[Pierna] 1. Sentadilla goblet, 2. Prensa de piernas', '[Bloque 2] 3. Plancha']);
    const [pierna, segundo] = partes.map((p) => (p.tipo === 'bloque' ? p.encabezado : null));
    expect(pierna).toEqual({ groupId: 'g-1', nombre: 'Pierna', detalle: null, etiqueta: 'Bloque Pierna, 2 ejercicios.' });
    expect(segundo?.etiqueta).toBe('Bloque 2, 1 ejercicio.');
  });

  test('en «Ya la hice», uno «En vueltas» dice su resumen y no la indicación para hacerlo', () => {
    const torso = bloque('g-1', 'Torso', 1, { kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 });
    expect(encabezadoDelBloque(torso, 0, 2, 'resumen')).toEqual({ groupId: 'g-1', nombre: 'Torso', detalle: 'En vueltas · 3 vueltas', etiqueta: 'Bloque Torso. En vueltas, 3 vueltas, 2 ejercicios.' });
    // Uno «Seguido», igual que siempre: solo el título.
    expect(encabezadoDelBloque(bloque('g-2', 'Core', 2), 1, 3, 'resumen').detalle).toBeNull();
  });

  test('la indicación sin descanso, sin pausa o con minutos, y el descanso como lo dice el lector', () => {
    expect(encabezadoDelBloque(bloque('g-1', 'Circuito', 1, { kind: 'ROUNDS', rounds: 4, restAfterRoundSeconds: null }), 0, 3).etiqueta).toBe('Bloque Circuito. Alterná estos 3 ejercicios, 4 vueltas.');
    expect(encabezadoDelBloque(bloque('g-1', 'Circuito', 1, { kind: 'ROUNDS', rounds: 2, restAfterRoundSeconds: 0 }), 0, 2).etiqueta).toBe('Bloque Circuito. Alterná estos 2 ejercicios, 2 vueltas, sin pausa al terminar cada vuelta.');
    const largo = encabezadoDelBloque(bloque('g-1', 'Circuito', 1, { kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 150 }), 0, 2);
    expect(largo.detalle).toBe('Alterná estos 2 ejercicios · 3 vueltas · descansá 2 min 30 s al terminar cada vuelta');
    expect(largo.etiqueta).toBe('Bloque Circuito. Alterná estos 2 ejercicios, 3 vueltas, descansá 2 minutos 30 segundos al terminar cada vuelta.');
    expect([45, 60, 61, 90, 120, 150, 181].map(descansoParaLeer)).toEqual(['45 segundos', '1 minuto', '61 segundos', '90 segundos', '2 minutos', '2 minutos 30 segundos', '3 minutos 1 segundo']);
  });

  test('un bloque sin ejercicios no se muestra, y un ejercicio con un bloque que la sesión no tiene queda suelto, a la vista', () => {
    const sesion = {
      prescriptions: [ej('p1', 'Press de banca', 'g-1'), ej('p2', 'Remo con barra', 'g-9')],
      exerciseGroups: [bloque('g-1', 'Torso', 1), bloque('g-2', 'Vacío', 2)],
    };
    expect(vista(partesParaMostrar(sesion))).toEqual(['[Torso] 1. Press de banca', '2. Remo con barra']);
  });

  test('lo que dice el encabezado describe, no califica', () => {
    const torso = bloque('g-1', 'Torso', 1, { kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 });
    const textos = [encabezadoDelBloque(torso, 0, 2), encabezadoDelBloque(torso, 0, 2, 'resumen'), encabezadoDelBloque(bloque('g-2', 'Pierna', 2), 1, 2)].flatMap((e) => [e.nombre, e.detalle ?? '', e.etiqueta]);
    expect(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t))).toEqual([]);
  });
});

describe('DL-181 · las pantallas agrupan la lista con sus bloques', () => {
  const leer = (archivo: string) => readFileSync(join(__dirname, archivo), 'utf8');
  // [archivo, la lista de antes]: cada una pasó a `ejerciciosConSusBloques`, en el mismo lugar.
  const LISTAS: readonly (readonly [string, string])[] = [
    ['pantallas/entrenamiento.tsx', 'o.plannedSession.prescriptions.map('],
    ['pantallas/plan-por-serie.tsx', 'sesion.prescriptions.map('],
    ['pantallas/sesion-enfocada.tsx', 'sesion.prescriptions.map('],
    ['pantallas/registro-rapido.tsx', 'ctx.sesion.prescriptions.map('],
    ['pantallas/historial.tsx', 's.prescriptions.map('],
  ];

  for (const [archivo, antes] of LISTAS) {
    test(`${archivo} usa ejerciciosConSusBloques y no recorre la lista suelta`, () => {
      const codigo = leer(archivo);
      expect(codigo).toContain('ejerciciosConSusBloques(');
      expect(codigo).not.toContain(antes);
    });
  }

  test('«Ya la hice» dice el resumen; «Ver rutina» numera desde la sesión', () => {
    expect(leer('pantallas/registro-rapido.tsx').match(/\}, 'resumen'\)\}/g)).toHaveLength(2);
    expect(leer('pantallas/sesion-enfocada.tsx')).toMatch(/ejerciciosConSusBloques\(sesion, \(p, i\) => \{[\s\S]{0,600}numero\(i \+ 1, 0\)/);
  });

  test('el encabezado es un encabezado para TalkBack, con su etiqueta, y la línea usa un color del tema', () => {
    const pieza = leer('bloques-en-pantalla.tsx');
    expect(pieza).toMatch(/accessibilityRole="header" accessibilityLabel=\{encabezado\.etiqueta\}/);
    expect(pieza).toMatch(/borderLeftColor: COLOR\.\w+/);
    expect(pieza).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  test('la sesión de respaldo conserva las marcas de los bloques, solo si vienen', () => {
    const series = leer('series-de-la-sesion.ts');
    expect(series).toContain('...(p.exerciseGroupId !== undefined ? { exerciseGroupId: p.exerciseGroupId } : {})');
    expect(series).toContain('...(s.exerciseGroups !== undefined ? { exerciseGroups: s.exerciseGroups } : {})');
  });
});
