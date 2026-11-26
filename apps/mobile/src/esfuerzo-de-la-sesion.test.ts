/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2) en la APK: el rótulo de la semana de la fase y el esfuerzo de la sesión al
 * terminar. Se prueba la lógica pura (`esfuerzo-de-la-sesion.ts`) y, leyendo el código, que:
 * - la APK declara `training-week-load-1` y `training-session-effort-1`;
 * - el esfuerzo se manda con su propia operación (API-ESF-01), nunca dentro de «Finalizar»: la sesión ya quedó registrada;
 * - la pregunta se muestra en la sesión recién registrada (en vivo y en «Ya la hice») y el rótulo, junto al nombre.
 *
 * Uso: cd apps/mobile && npx jest src/esfuerzo-de-la-sesion.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { CAPACIDAD_ESFUERZO_DE_LA_SESION, CAPACIDAD_SEMANA_DE_LA_FASE, RegistrarEsfuerzoDeLaSesionRequestSchema, terminosProhibidosDeEntrenamientoEn, type Resultado } from '@be/domain';
import {
  cuerpoDelEsfuerzo,
  etiquetaDelPunto,
  filasDeLaEscala,
  MAXIMO_DE_MINUTOS,
  minutosDelCronometro,
  minutosIniciales,
  palabraDebajo,
  PUNTOS_DE_LA_ESCALA,
  rotuloDeLaSemana,
  sePreguntaElEsfuerzo,
  TEXTO_DEL_MOTIVO_DEL_ESFUERZO,
  TEXTOS_DEL_ESFUERZO,
  trasGuardarElEsfuerzo,
} from './esfuerzo-de-la-sesion';

// El jest de la APK compila sin los tipos de Node: lo poco que usa la lectura del código se declara acá.
declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]): string => readFileSync(join(__dirname, ...partes), 'utf8');

const api = (status: number, codigo: string): Resultado<unknown> => ({ ok: false, tipo: 'API', status, codigo, issues: [] }) as unknown as Resultado<unknown>;
const RED = { ok: false, tipo: 'RED' } as Resultado<unknown>;

describe('la semana de la fase', () => {
  test('con `week`, «Semana 3 de 6»; con la descarga, «· descarga»', () => {
    expect(rotuloDeLaSemana({ week: { phaseWeek: 3, phaseWeeks: 6, deload: false } })).toBe('Semana 3 de 6');
    expect(rotuloDeLaSemana({ week: { phaseWeek: 4, phaseWeeks: 6, deload: true } })).toBe('Semana 4 de 6 · descarga');
  });

  test('sin `week` (sin progresión o sin la lectura), nada: la pantalla queda como antes', () => {
    expect(rotuloDeLaSemana({})).toBeNull();
    expect(rotuloDeLaSemana({ week: null })).toBeNull();
    expect(rotuloDeLaSemana(null)).toBeNull();
    expect(rotuloDeLaSemana(undefined)).toBeNull();
  });
});

describe('cuándo se pregunta el esfuerzo', () => {
  test('solo con `askSessionEffort: true`', () => {
    expect(sePreguntaElEsfuerzo({ askSessionEffort: true })).toBe(true);
    expect(sePreguntaElEsfuerzo({ askSessionEffort: false })).toBe(false);
    expect(sePreguntaElEsfuerzo({})).toBe(false);
    expect(sePreguntaElEsfuerzo(null)).toBe(false);
  });
});

describe('los minutos del cronómetro', () => {
  test('los de la sesión sin pausas, redondeados al minuto', () => {
    expect(minutosDelCronometro({ ms: 60 * 60_000, quality: 'MEASURED' })).toBe(60);
    expect(minutosDelCronometro({ ms: 47 * 60_000 + 31_000, quality: 'MEASURED' })).toBe(48);
    expect(minutosDelCronometro({ ms: 52 * 60_000, quality: 'ESTIMATED' })).toBe(52);
  });

  test('menos de un minuto cuenta como 1; sin medida o fuera del tope de la API, vacío', () => {
    expect(minutosDelCronometro({ ms: 20_000, quality: 'MEASURED' })).toBe(1);
    expect(minutosDelCronometro({ ms: 0, quality: 'MEASURED' })).toBeNull();
    expect(minutosDelCronometro({ ms: null, quality: 'INCOMPLETE' })).toBeNull();
    expect(minutosDelCronometro(null)).toBeNull();
    // Una sesión que quedó abierta horas no se ofrece como duración.
    expect(minutosDelCronometro({ ms: (MAXIMO_DE_MINUTOS + 1) * 60_000, quality: 'MEASURED' })).toBeNull();
    expect(minutosIniciales(null)).toBe('');
    expect(minutosIniciales(60)).toBe('60');
  });
});

describe('el cuerpo de API-ESF-01: los minutos van con su origen', () => {
  const valido = (c: ReturnType<typeof cuerpoDelEsfuerzo>) => {
    expect(c.ok).toBe(true);
    if (c.ok) expect(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse(c.cuerpo).success).toBe(true);
    return c.ok ? c.cuerpo : null;
  };

  test('los del cronómetro sin tocar: TIMER', () => {
    expect(valido(cuerpoDelEsfuerzo({ valor: 7, minutosEscritos: '60', delCronometro: 60 }))).toEqual({ rating: 7, durationMinutes: 60, durationSource: 'TIMER' });
  });

  test('cambiados por la persona, o escritos sin cronómetro: DECLARED', () => {
    expect(valido(cuerpoDelEsfuerzo({ valor: 7, minutosEscritos: '55', delCronometro: 60 }))).toEqual({ rating: 7, durationMinutes: 55, durationSource: 'DECLARED' });
    expect(valido(cuerpoDelEsfuerzo({ valor: 5, minutosEscritos: ' 40 ', delCronometro: null }))).toEqual({ rating: 5, durationMinutes: 40, durationSource: 'DECLARED' });
  });

  test('vacíos: sin minutos y sin origen', () => {
    expect(valido(cuerpoDelEsfuerzo({ valor: 0, minutosEscritos: '', delCronometro: 60 }))).toEqual({ rating: 0, durationMinutes: null, durationSource: null });
    expect(valido(cuerpoDelEsfuerzo({ valor: 10, minutosEscritos: '   ', delCronometro: null }))).toEqual({ rating: 10, durationMinutes: null, durationSource: null });
  });

  test('sin elegir un número, o con minutos que la API no acepta, no se manda', () => {
    expect(cuerpoDelEsfuerzo({ valor: null, minutosEscritos: '60', delCronometro: 60 })).toEqual({ ok: false, motivo: 'sin-valor' });
    expect(cuerpoDelEsfuerzo({ valor: 11, minutosEscritos: '', delCronometro: null })).toEqual({ ok: false, motivo: 'sin-valor' });
    for (const m of ['0', '601', '4,5', '-3', 'abc']) expect(cuerpoDelEsfuerzo({ valor: 6, minutosEscritos: m, delCronometro: null })).toEqual({ ok: false, motivo: 'minutos' });
  });
});

describe('la escala en pantalla', () => {
  test('once puntos, del 0 al 10, y TalkBack dice el número y la palabra de cada uno', () => {
    expect(PUNTOS_DE_LA_ESCALA).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(etiquetaDelPunto(0)).toBe('0, Reposo');
    expect(etiquetaDelPunto(7)).toBe('7, Muy duro');
    expect(etiquetaDelPunto(8)).toBe('8, Muy duro');
    // En la grilla, de cuatro por fila y en el orden de la escala.
    expect(filasDeLaEscala()).toEqual([[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10]]);
  });

  test('la palabra debajo, solo donde cambia: el 6 y el 8 no repiten la del 5 y la del 7 (CR-10 de Foster)', () => {
    expect(PUNTOS_DE_LA_ESCALA.map(palabraDebajo)).toEqual(['Reposo', 'Muy, muy suave', 'Suave', 'Moderado', 'Algo duro', 'Duro', null, 'Muy duro', null, 'Casi máximo', 'Máximo']);
  });
});

describe('qué pasa con cada respuesta de API-ESF-01', () => {
  test('guardado con la respuesta del servidor, o con el 409 de una sesión ya respondida', () => {
    expect(trasGuardarElEsfuerzo({ ok: true, datos: {} } as Resultado<unknown>)).toEqual({ tipo: 'guardado' });
    expect(trasGuardarElEsfuerzo(api(409, 'RESOURCE_CONFLICT'))).toEqual({ tipo: 'guardado' });
    expect(trasGuardarElEsfuerzo(api(409, 'IDEMPOTENCY_KEY_REUSED'))).toEqual({ tipo: 'guardado' });
  });

  test('sin respuesta, con un 5xx o con demasiados pedidos: reintentar con la misma clave', () => {
    for (const r of [RED, api(503, 'SERVICE_UNAVAILABLE'), api(429, 'RATE_LIMITED'), api(200, 'RESPUESTA_NO_RECONOCIDA')]) {
      expect(trasGuardarElEsfuerzo(r)).toEqual({ tipo: 'no-se-guardo', motivo: 'conexion', reintentable: true });
    }
  });

  test('sin acceso o con un cuerpo que no se acepta, reintentar no cambia nada; la sesión sigue registrada', () => {
    expect(trasGuardarElEsfuerzo(api(404, 'RESOURCE_NOT_FOUND'))).toEqual({ tipo: 'no-se-guardo', motivo: 'sin-acceso', reintentable: false });
    expect(trasGuardarElEsfuerzo(api(400, 'VALIDATION_FAILED'))).toEqual({ tipo: 'no-se-guardo', motivo: 'no-se-entendio', reintentable: false });
    expect(TEXTO_DEL_MOTIVO_DEL_ESFUERZO.conexion).toContain('ya quedó registrada');
    expect(TEXTO_DEL_MOTIVO_DEL_ESFUERZO['sin-acceso']).toContain('sigue registrada');
  });
});

describe('las palabras', () => {
  test('lo que se ve no juzga: sin «cumplimiento», «adherencia», «racha», «puntaje» ni «volumen»', () => {
    const T = TEXTOS_DEL_ESFUERZO;
    const textos = [T.pregunta, T.preguntaAclaracion, T.minutos, T.minutosDelCronometro(60), T.saltear, T.guardar, T.guardado, T.escala, T.guardando, T.reintentar, T.noSeGuardo, T.minutosAyuda, T.minutosInvalidos, T.elegido(7), ...Object.values(TEXTO_DEL_MOTIVO_DEL_ESFUERZO), ...PUNTOS_DE_LA_ESCALA.map(etiquetaDelPunto), rotuloDeLaSemana({ week: { phaseWeek: 4, phaseWeeks: 6, deload: true } }) ?? ''];
    expect(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t))).toEqual([]);
    for (const t of textos) expect(t).not.toMatch(/cumplimiento|adherencia|racha|puntaje|volumen/i);
  });
});

describe('leyendo el código', () => {
  test('la APK declara la semana de la fase y el esfuerzo de la sesión', () => {
    expect(CAPACIDAD_SEMANA_DE_LA_FASE).toBe('training-week-load-1');
    expect(CAPACIDAD_ESFUERZO_DE_LA_SESION).toBe('training-session-effort-1');
    const fuente = leer('api.ts');
    const lista = fuente.slice(fuente.indexOf('const CAPACIDADES = ['), fuente.indexOf('] as const;', fuente.indexOf('const CAPACIDADES = [')));
    expect(lista).toContain('CAPACIDAD_SEMANA_DE_LA_FASE');
    expect(lista).toContain('CAPACIDAD_ESFUERZO_DE_LA_SESION');
  });

  test('el esfuerzo viaja aparte (API-ESF-01), nunca dentro de «Finalizar»', () => {
    const sesion = leer('pantallas', 'entrenamiento.tsx');
    const inicio = sesion.indexOf('async function finalizar()');
    const finalizar = sesion.slice(inicio, sesion.indexOf('\n  }\n', inicio));
    expect(inicio).toBeGreaterThan(0);
    expect(finalizar).toContain('api.confirmarEjecucion(');
    expect(finalizar).not.toMatch(/registrarEsfuerzoDeLaSesion|<EsfuerzoDeLaSesion/);
    // La pregunta se decide con lo que mandó API-SER-02 y llega con la ruta de la sesión registrada.
    expect(finalizar).toContain('sePreguntaElEsfuerzo(delPlan)');
    // «No pude realizarla» no tiene esfuerzo que contar: no se pregunta (la API lo rechaza con 422 SESSION_NOT_COMPLETED).
    expect(finalizar).toContain("sessionCondition !== 'NOT_COMPLETED'");
    const pregunta = leer('pantallas', 'esfuerzo-de-la-sesion.tsx');
    expect(pregunta).toContain('api.registrarEsfuerzoDeLaSesion(');
    expect(pregunta).toContain('intento.actual()');
    expect(pregunta).not.toContain('confirmarEjecucion');
  });

  test('la pregunta está en la sesión recién registrada y en el final de «Ya la hice»', () => {
    const sesion = leer('pantallas', 'entrenamiento.tsx');
    const registrada = sesion.slice(sesion.indexOf('export function PantallaDeEjecucionDeEntrenamiento('));
    expect(registrada).toContain('<EsfuerzoDeLaSesion');
    // Antes de la nota para tu profe.
    expect(registrada.indexOf('<EsfuerzoDeLaSesion')).toBeLessThan(registrada.indexOf('<NotaParaTuProfe'));
    expect(leer('pantallas', 'registro-rapido.tsx')).toContain('<EsfuerzoDeLaSesion');
  });

  test('cada opción es un radio con su número y su palabra, y dice si está elegida', () => {
    const pregunta = leer('pantallas', 'esfuerzo-de-la-sesion.tsx');
    expect(pregunta).toContain('accessibilityRole="radiogroup"');
    expect(pregunta).toContain('accessibilityRole="radio"');
    expect(pregunta).toContain('accessibilityLabel={etiquetaDelPunto(v)}');
    expect(pregunta).toMatch(/accessibilityState=\{\{ checked: elegida, selected: elegida/);
  });

  test('el rótulo de la semana va junto al nombre de la sesión y en el plan', () => {
    expect(leer('pantallas', 'entrenamiento.tsx')).toContain('semana={rotuloDeLaSemana(delPlan)}');
    expect(leer('pantallas', 'plan-por-serie.tsx')).toContain('rotuloDeLaSemana(r.ok ? r.datos.data : null)');
  });
});
