/**
 * TEST-PG-001 (WP-PULIDO-GRANDES, PG-01, con PG-D1): Inicio con varias sesiones y sin días muestra una sola tarjeta, con
 * la que sigue en el orden del plan, y «Otra sesión» con todas. Se prueba la lógica pura (`la-que-sigue.ts`) y, leyendo el
 * código, que la tarjeta la usa como corresponde: con una sesión en curso, solo esa (AV2-D4); con días, el día; con una
 * sola sesión, esa.
 *
 * Mutación verificada: con `(k + 1) % plan.length` cambiado por `k`, la tarjeta repite la última hecha y la prueba se pone
 * en rojo; con el filtro de `realizada` quitado, una «sin realizar» corre el orden y también se pone en rojo.
 *
 * Uso: cd apps/mobile && npx jest src/la-que-sigue.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { conLasSesiones, encabezadoDeLaQueSigue, estadoEnLaSemana, lunesDe, sesionQueSigue, usaLaQueSigue, type SesionRegistrada } from './la-que-sigue';

// El jest de la APK compila sin los tipos de Node: lo poco que usa la lectura del código se declara acá.
declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const PLAN = [{ sessionId: 'piernas-a' }, { sessionId: 'torso-a' }, { sessionId: 'piernas-b' }];
const hecha = (sessionId: string, date: string, hora = '10:00', realizada = true): SesionRegistrada => ({ sessionId, date, occurredAt: `${date}T${hora}:00.000Z`, realizada });

describe('TEST-PG-001 · la sesión que sigue en el orden del plan', () => {
  test('sin ninguna realizada, la primera; después de la k, la k+1; después de la última, la primera', () => {
    expect(sesionQueSigue(PLAN, [])).toEqual({ indice: 0, motivo: 'primera' });
    expect(sesionQueSigue(PLAN, [hecha('piernas-a', '2026-11-09')])).toEqual({ indice: 1, motivo: 'sigue' });
    expect(sesionQueSigue(PLAN, [hecha('piernas-a', '2026-11-09'), hecha('torso-a', '2026-11-11')])).toEqual({ indice: 2, motivo: 'sigue' });
    expect(sesionQueSigue(PLAN, [hecha('piernas-b', '2026-11-12')])).toEqual({ indice: 0, motivo: 'sigue' });
  });

  test('manda la más reciente por el momento en que ocurrió, no el orden en que llega la lista', () => {
    const desordenadas = [hecha('torso-a', '2026-11-11'), hecha('piernas-a', '2026-11-12', '07:30'), hecha('piernas-b', '2026-11-10')];
    expect(sesionQueSigue(PLAN, desordenadas)).toEqual({ indice: 1, motivo: 'sigue' });
  });

  test('una registrada sin realizar no corre el orden (PG-T1); una sesión que ya no está en el plan, tampoco', () => {
    expect(sesionQueSigue(PLAN, [hecha('piernas-a', '2026-11-09'), hecha('torso-a', '2026-11-11', '10:00', false)])).toEqual({ indice: 1, motivo: 'sigue' });
    expect(sesionQueSigue(PLAN, [hecha('otra-del-plan-viejo', '2026-11-12')])).toEqual({ indice: 0, motivo: 'primera' });
  });

  test('sin poder leer lo registrado, la primera, y no dice «Sigue en tu plan»', () => {
    const r = sesionQueSigue(PLAN, null);
    expect(r).toEqual({ indice: 0, motivo: 'sin-historial' });
    expect(encabezadoDeLaQueSigue('sin-historial')).toBe('La primera de tu plan');
    expect(encabezadoDeLaQueSigue('sigue')).toBe('Sigue en tu plan');
    expect(encabezadoDeLaQueSigue('primera')).toBe('Sigue en tu plan');
    expect(sesionQueSigue([], [])).toBeNull();
  });

  test('la tarjeta única va solo sin días y con dos o más sesiones', () => {
    expect(usaLaQueSigue(3, false)).toBe(true);
    expect(usaLaQueSigue(2, false)).toBe(true);
    expect(usaLaQueSigue(1, false)).toBe(false);
    expect(usaLaQueSigue(3, true)).toBe(false);
  });
});

describe('TEST-PG-001 · la hoja: cada sesión con su semana, desde el lunes, sin juicio', () => {
  test('la semana empieza el lunes', () => {
    expect(lunesDe('2026-11-13')).toBe('2026-11-09'); // viernes → lunes
    expect(lunesDe('2026-11-09')).toBe('2026-11-09');
    expect(lunesDe('2026-11-15')).toBe('2026-11-09'); // domingo → el lunes anterior
  });

  test('«Realizada el martes», «Realizada hoy», «Sin registrar esta semana»; lo de la semana pasada no cuenta', () => {
    const registradas = [hecha('piernas-a', '2026-11-10'), hecha('torso-a', '2026-11-13'), hecha('piernas-b', '2026-11-06'), hecha('torso-a', '2026-11-11', '09:00', false)];
    expect(estadoEnLaSemana('piernas-a', registradas, '2026-11-13')).toBe('Realizada el martes');
    expect(estadoEnLaSemana('torso-a', registradas, '2026-11-13')).toBe('Realizada hoy');
    expect(estadoEnLaSemana('piernas-b', registradas, '2026-11-13')).toBe('Sin registrar esta semana');
    expect(estadoEnLaSemana('torso-a', [hecha('torso-a', '2026-11-11', '09:00', false)], '2026-11-13')).toBe('Registrada el miércoles, sin realizar');
    expect(estadoEnLaSemana('piernas-a', null, '2026-11-13')).toBeNull();
  });
});

describe('TEST-PG-001 · la lectura: una sola, la misma de siempre, con las sesiones', () => {
  test('conLasSesiones no pide de más y conserva el resumen tal cual', async () => {
    const ejecucion = {
      plannedSession: { sessionId: 'torso-a' },
      date: '2026-11-11',
      occurredAt: '2026-11-11T10:00:00.000Z',
      original: { sessionCondition: 'COMPLETED_WITH_DEVIATION' },
      corrections: [],
      effectiveView: { kind: 'ORIGINAL' },
    };
    let pedidos = 0;
    const api = {
      misEjecucionesDeEntrenamiento: async (_token: string, _periodo: { periodStart: string; periodEnd: string }) => {
        pedidos++;
        return { ok: true as const, datos: { data: { period: { start: '2026-10-15', end: '2026-11-13' }, executions: [ejecucion] } } as never };
      },
    };
    const r = await conLasSesiones(api, async (a) => {
      const h = await a.misEjecucionesDeEntrenamiento('t', { periodStart: '2026-10-15', periodEnd: '2026-11-13' });
      return h.ok ? { ok: true as const, datos: { registradas: 1 } } : h;
    });
    expect(pedidos).toBe(1);
    expect(r).toEqual({ ok: true, datos: { registradas: 1, sesiones: [{ sessionId: 'torso-a', date: '2026-11-11', occurredAt: '2026-11-11T10:00:00.000Z', realizada: true }] } });
  });
});

describe('TEST-PG-001 · la tarjeta usa la lógica como corresponde (lectura del código)', () => {
  const tarjeta = readFileSync(join(__dirname, 'pantallas', 'inicio-entrenamiento.tsx'), 'utf8');
  const sinComentarios = tarjeta.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  test('con una sesión en curso, solo esa; con días, el día; la tarjeta única, después', () => {
    const enCurso = sinComentarios.indexOf('else if (ahora)');
    const conAgenda = sinComentarios.indexOf('else if (agenda)');
    const laQueSigue = sinComentarios.indexOf('else if (usaLaQueSigue(hoy.occurrences.length, false))');
    expect(enCurso).toBeGreaterThan(0);
    expect(conAgenda).toBeGreaterThan(enCurso);
    expect(laQueSigue).toBeGreaterThan(conAgenda);
  });

  test('una sola tarjeta de sesión y «Otra sesión», que nombra cuántas abre; la hoja, sin destacar ninguna', () => {
    const componente = sinComentarios.slice(sinComentarios.indexOf('function LaQueSigue('), sinComentarios.indexOf('function HojaDeLasSesiones('));
    expect(componente.match(/<SesionDeHoy\b/g)).toHaveLength(1);
    expect(componente).toContain('etiqueta={TP.otraSesionParaLeer(ocurrencias.length)}');
    const hoja = sinComentarios.slice(sinComentarios.indexOf('function HojaDeLasSesiones('), sinComentarios.indexOf('const estilosDeLaQueSigue'));
    expect(hoja).toContain('{ocurrencias.map((x) =>');
    expect(hoja).not.toMatch(/Insignia|hecha=|exito|acento/);
  });
});
