/**
 * TEST-PG-011 (WP-PULIDO-GRANDES, PG-12, con PG-D7): quién miró lo que compartiste. Por profesional, la última lectura,
 * con el plan que miró, el día y la hora en 24 h, sin contar cuántas veces; «Todavía no miró» solo cuando se sabe. Se
 * prueba la lógica pura (`quien-miro.ts`) con la forma de la respuesta de la API y, leyendo el código, que la pantalla la
 * dibuja sin depender de ella: si la lectura falla, la tarjeta sigue con sus permisos.
 *
 * Mutación verificada: tomar la primera lectura de cada profesional (la más vieja) en lugar de la última pone en rojo
 * «la última por su hora»; dejar de mirar el tope de 50 pone en rojo «con la lista llena no afirma nada».
 *
 * Uso: cd apps/mobile && npx jest src/quien-miro.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { cuandoLoMiro, lineaDe, quienMiro, TEXTOS_DE_QUIEN_MIRO, TOPE_DE_LECTURAS, type LoCompartido } from './quien-miro';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const ZONA = 'America/Argentina/Buenos_Aires';
// Sábado 14 de noviembre de 2026, en Buenos Aires.
const HOY = '2026-11-14';
const LAURA = '11111111-1111-4111-8111-111111111111';
const MARTIN = '22222222-2222-4222-8222-222222222222';
const SOFIA = '33333333-3333-4333-8333-333333333333';

const profesional = (identityId: string, displayName: string, shares: LoCompartido['professionals'][number]['shares']): LoCompartido['professionals'][number] => ({
  professional: { identityId, displayName },
  scopes: [{ code: 'ENTRENAMIENTO', label: 'Entrenamiento' }],
  link: 'ACTIVE',
  shareableAreas: ['NUTRICION', 'ANTROPOMETRIA'],
  shares,
});
const lectura = (identityId: string, area: 'NUTRICION' | 'ENTRENAMIENTO', readAt: string): LoCompartido['accesses'][number] => ({ professional: { identityId, displayName: 'Prof.' }, area, readAt });
const ACTIVA: LoCompartido['sharing'] = { status: 'ACTIVE', version: 'v1', activeSince: '2026-11-01T12:00:00.000Z', withdrawnAt: null, acceptedTexts: { summary: null, summaryAndPlan: 't1' } };
const plan = (area: 'NUTRICION' | 'ENTRENAMIENTO') => ({ area, level: 'SUMMARY_AND_PLAN' as const, since: '2026-11-01T12:00:00.000Z' });
const resumen = (area: 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA') => ({ area, level: 'SUMMARY' as const, since: '2026-11-01T12:00:00.000Z' });

describe('TEST-PG-011 · cuándo lo miró, con las palabras de acá', () => {
  test('hoy, ayer, el día del mes, el mes y, con otro año, el año; la hora de 24 h', () => {
    // 21:20 UTC son las 18:20 en Buenos Aires.
    expect(cuandoLoMiro('2026-11-14T21:20:00.000Z', HOY, ZONA)).toBe('hoy a las 18:20');
    expect(cuandoLoMiro('2026-11-13T12:05:00.000Z', HOY, ZONA)).toBe('ayer a las 09:05');
    expect(cuandoLoMiro('2026-11-10T21:20:00.000Z', HOY, ZONA)).toBe('el martes 10 a las 18:20');
    expect(cuandoLoMiro('2026-10-20T21:20:00.000Z', HOY, ZONA)).toBe('el martes 20 de octubre a las 18:20');
    expect(cuandoLoMiro('2025-12-09T21:20:00.000Z', HOY, ZONA)).toBe('el martes 9 de diciembre de 2025 a las 18:20');
  });

  test('el día es el de la zona, no el de UTC: a las 23:30 de Buenos Aires ya es otro día en UTC', () => {
    expect(cuandoLoMiro('2026-11-14T02:30:00.000Z', HOY, ZONA)).toBe('ayer a las 23:30');
  });
});

describe('TEST-PG-011 · la última lectura por profesional', () => {
  test('la última por su hora, no por su lugar en la lista; con el plan que miró', () => {
    const compartido: LoCompartido = {
      sharing: ACTIVA,
      professionals: [profesional(LAURA, 'Laura', [plan('NUTRICION')])],
      // Desordenadas a propósito: la más nueva no es la primera.
      accesses: [lectura(LAURA, 'NUTRICION', '2026-11-03T13:00:00.000Z'), lectura(LAURA, 'NUTRICION', '2026-11-10T21:20:00.000Z'), lectura(LAURA, 'NUTRICION', '2026-11-08T15:00:00.000Z')],
    };
    expect(lineaDe(quienMiro(compartido, HOY, ZONA), LAURA)).toBe('Miró tu plan de Nutrición el martes 10 a las 18:20');
  });

  test('una línea por profesional, sin contar cuántas veces: ninguna cifra de lecturas', () => {
    const muchas = Array.from({ length: 12 }, (_, i) => lectura(LAURA, 'NUTRICION', `2026-11-${String(i + 1).padStart(2, '0')}T15:00:00.000Z`));
    const lineas = quienMiro({ sharing: ACTIVA, professionals: [profesional(LAURA, 'Laura', [plan('NUTRICION')])], accesses: muchas }, HOY, ZONA);
    expect([...lineas.values()]).toEqual(['Miró tu plan de Nutrición el jueves 12 a las 12:00']);
    expect([...lineas.values()].join(' ')).not.toMatch(/\b12 (veces|lecturas)\b|veces/);
  });

  test('el identificador se compara sin la caja: la tarjeta lo encuentra igual', () => {
    const lineas = quienMiro({ sharing: ACTIVA, professionals: [], accesses: [lectura(LAURA.toUpperCase(), 'ENTRENAMIENTO', '2026-11-14T21:20:00.000Z')] }, HOY, ZONA);
    expect(lineaDe(lineas, LAURA)).toBe('Miró tu plan de Entrenamiento hoy a las 18:20');
  });

  test('una lectura vieja se sigue diciendo aunque hoy ya no le compartas nada: es lo que pasó', () => {
    const retirada: LoCompartido['sharing'] = { ...ACTIVA, status: 'WITHDRAWN', withdrawnAt: '2026-11-12T12:00:00.000Z', acceptedTexts: null };
    const lineas = quienMiro({ sharing: retirada, professionals: [], accesses: [lectura(MARTIN, 'NUTRICION', '2026-11-10T21:20:00.000Z')] }, HOY, ZONA);
    expect(lineaDe(lineas, MARTIN)).toBe('Miró tu plan de Nutrición el martes 10 a las 18:20');
  });
});

describe('TEST-PG-011 · «Todavía no miró», solo cuando se sabe', () => {
  test('con un plan compartido y sin lecturas: el plan que puede mirar; con dos, los dos, en el orden de BE', () => {
    const compartido: LoCompartido = {
      sharing: ACTIVA,
      professionals: [profesional(LAURA, 'Laura', [plan('NUTRICION')]), profesional(SOFIA, 'Sofía', [plan('ENTRENAMIENTO'), plan('NUTRICION')])],
      accesses: [],
    };
    const lineas = quienMiro(compartido, HOY, ZONA);
    expect(lineaDe(lineas, LAURA)).toBe('Todavía no miró tu plan de Nutrición');
    expect(lineaDe(lineas, SOFIA)).toBe('Todavía no miró tus planes de Nutrición y Entrenamiento');
  });

  test('lo que se comparte solo como resumen no se registra como lectura: no se dice nada', () => {
    const lineas = quienMiro({ sharing: ACTIVA, professionals: [profesional(MARTIN, 'Martín', [resumen('NUTRICION'), resumen('ANTROPOMETRIA')])], accesses: [] }, HOY, ZONA);
    expect(lineaDe(lineas, MARTIN)).toBeNull();
  });

  test('sin compartir nada hoy, tampoco: no hay qué mirar', () => {
    const nunca: LoCompartido['sharing'] = { status: 'NOT_GIVEN', version: null, activeSince: null, withdrawnAt: null, acceptedTexts: null };
    expect(quienMiro({ sharing: nunca, professionals: [profesional(LAURA, 'Laura', [plan('NUTRICION')])], accesses: [] }, HOY, ZONA).size).toBe(0);
  });

  test('con la lista llena (50), una ausencia no prueba nada: no afirma que no lo miró', () => {
    expect(TOPE_DE_LECTURAS).toBe(50);
    const llena = Array.from({ length: TOPE_DE_LECTURAS }, (_, i) => lectura(SOFIA, 'NUTRICION', new Date(Date.UTC(2026, 10, 14, 12) - i * 3_600_000).toISOString()));
    const lineas = quienMiro({ sharing: ACTIVA, professionals: [profesional(LAURA, 'Laura', [plan('NUTRICION')]), profesional(SOFIA, 'Sofía', [plan('NUTRICION')])], accesses: llena }, HOY, ZONA);
    expect(lineaDe(lineas, LAURA)).toBeNull();
    expect(lineaDe(lineas, SOFIA)).toBe('Miró tu plan de Nutrición hoy a las 09:00');
  });
});

describe('TEST-PG-011 · la pantalla (lectura del código)', () => {
  const pantalla = readFileSync(join(__dirname, 'pantallas', 'quien-ve-que.tsx'), 'utf8');

  test('lee lo compartido aparte: si esa lectura falla, la línea no se dibuja y la tarjeta sigue', () => {
    expect(pantalla).toContain('api.misResumenesCompartidos(token)');
    // La falla de la vista entera sale de las tres lecturas de siempre, no de esta.
    expect(pantalla).toContain('const lecturas = [a3, vinculos, consentimientos];');
    expect(pantalla).toMatch(/compartido\.r\?\.ok \? quienMiro\(compartido\.r\.datos\.data, /);
    expect(pantalla).toMatch(/const lineaDeQuienMiro = lineaDe\(lineasDeQuienMiro, t\.profesionalId\);/);
  });

  test('la línea no deja quitar nada: no es un botón ni un enlace', () => {
    const bloque = pantalla.slice(pantalla.indexOf('{lineaDeQuienMiro ?'), pantalla.indexOf(': null}', pantalla.indexOf('{lineaDeQuienMiro ?')));
    expect(bloque).toContain('accessibilityLabel={lineaDeQuienMiro}');
    expect(bloque).not.toMatch(/<Boton|onPress/);
  });

  test('los textos ubican: sin contadores ni juicios', () => {
    const todos = [TEXTOS_DE_QUIEN_MIRO.miro('tu plan de Nutrición', 'hoy a las 18:20'), TEXTOS_DE_QUIEN_MIRO.todaviaNoMiro('tu plan de Nutrición')].join(' ');
    expect(todos).not.toMatch(/\d+ veces|vez|siempre|nunca|todos tus datos/i);
  });
});
