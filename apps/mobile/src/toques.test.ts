/**
 * TEST-PG-007 (WP-PULIDO-GRANDES, PG-08, con PG-D4): tres toques en un solo lugar; solo después de confirmar; apagados con
 * el interruptor. Se prueba la lógica (`toques.ts`: cuándo suena, cuál y qué secuencia elige el teléfono) y, leyendo el
 * código, que expo-haptics se usa en un solo archivo y que cada toque va después de la respuesta o del guardado.
 *
 * Mutación verificada: con un `Haptics.impactAsync()` suelto en otra pantalla, la prueba de estructura se pone en rojo;
 * con `toqueTrasLaRespuesta` devolviendo «confirmar» sin mirar `ok`, también.
 *
 * Uso: cd apps/mobile && npx jest src/toques.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import { EN_IOS, primeroQueAnde, SECUENCIA_EN_ANDROID, suena, TOQUES, toqueTrasLaRespuesta, toqueTrasLaSerie } from './toques';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; readdirSync(ruta: string): string[]; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]) => readFileSync(join(__dirname, ...partes), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('TEST-PG-007 · cuándo suena y cuál', () => {
  test('tres toques, ninguno de festejo', () => {
    expect([...TOQUES]).toEqual(['confirmar', 'deshacer', 'error']);
    expect(Object.keys(SECUENCIA_EN_ANDROID).sort()).toEqual(['confirmar', 'deshacer', 'error']);
    expect(Object.keys(EN_IOS).sort()).toEqual(['confirmar', 'deshacer', 'error']);
    // Ninguno es el «éxito» de iOS ni un patrón largo de vibración.
    expect(Object.values(EN_IOS).map((t) => t.estilo)).not.toContain('success');
  });

  test('después de la respuesta: lo confirmado confirma o deshace; lo no confirmado es error', () => {
    expect(toqueTrasLaRespuesta({ ok: true }, 'guardar')).toBe('confirmar');
    expect(toqueTrasLaRespuesta({ ok: true }, 'deshacer')).toBe('deshacer');
    expect(toqueTrasLaRespuesta({ ok: false }, 'guardar')).toBe('error');
    expect(toqueTrasLaRespuesta({ ok: false }, 'deshacer')).toBe('error');
  });

  test('una serie: guardada en el teléfono confirma, destildada deshace, y si no quedó, nada', () => {
    expect(toqueTrasLaSerie('registrada')).toBe('confirmar');
    expect(toqueTrasLaSerie('quitada')).toBe('deshacer');
    expect(toqueTrasLaSerie('sin-sesion')).toBeNull();
  });

  test('con el interruptor apagado, ninguno', () => {
    for (const t of TOQUES) {
      expect(suena(t, true)).toBe(true);
      expect(suena(t, false)).toBe(false);
    }
    expect(suena(null, true)).toBe(false);
  });
});

describe('TEST-PG-007 · qué secuencia elige el teléfono', () => {
  test('el del sistema primero y, si el teléfono no lo tiene, uno de siempre', async () => {
    expect(SECUENCIA_EN_ANDROID.confirmar[0]).toBe('confirm');
    expect(SECUENCIA_EN_ANDROID.error[0]).toBe('reject');
    const hechos: string[] = [];
    const androidViejo = async (tipo: string) => {
      if (['confirm', 'reject', 'toggle-off'].includes(tipo)) throw new Error('no lo tiene');
      hechos.push(tipo);
    };
    expect(await primeroQueAnde(SECUENCIA_EN_ANDROID.confirmar, androidViejo)).toBe('context-click');
    expect(await primeroQueAnde(SECUENCIA_EN_ANDROID.deshacer, androidViejo)).toBe('clock-tick');
    expect(await primeroQueAnde(SECUENCIA_EN_ANDROID.error, androidViejo)).toBe('long-press');
    expect(hechos).toEqual(['context-click', 'clock-tick', 'long-press']);
    const androidNuevo = async () => undefined;
    expect(await primeroQueAnde(SECUENCIA_EN_ANDROID.deshacer, androidNuevo)).toBe('toggle-off');
    expect(await primeroQueAnde(['x'], async () => Promise.reject(new Error('nada')))).toBeNull();
  });
});

describe('TEST-PG-007 · en un solo lugar y después de confirmar (lectura del código)', () => {
  const archivos = [...readdirSync(__dirname).map((f) => [f]), ...readdirSync(join(__dirname, 'pantallas')).map((f) => ['pantallas', f])].filter((p) => /\.tsx?$/.test(p[p.length - 1]) && !/\.test\./.test(p[p.length - 1]));

  test('expo-haptics se usa solo en haptica.ts, que expone los tres toques y nada más', () => {
    const usan = archivos.filter((p) => /expo-haptics|\bHaptics\./.test(leer(...p))).map((p) => p.join('/'));
    expect(usan).toEqual(['haptica.ts']);
    expect(leer('..', 'App.tsx')).not.toMatch(/expo-haptics|Haptics\./);
    const exportadas = [...leer('haptica.ts').matchAll(/export (?:const|function) (\w+)/g)].map((m) => m[1]).sort();
    expect(exportadas).toEqual(['tocarPorUnError', 'tocarTrasLaRespuesta', 'tocarTrasLaSerie']);
  });

  test('la vibración del final del descanso sigue como estaba, y es la única con Vibration', () => {
    const conVibration = archivos.filter((p) => /\bVibration\.vibrate\(/.test(leer(...p))).map((p) => p.join('/'));
    expect(conVibration).toEqual(['pantallas/entrenamiento.tsx']);
    expect(leer('pantallas', 'entrenamiento.tsx')).toContain('if (ajustes.vibrar) Vibration.vibrate([0, 400, 200, 400]);');
  });

  test('cada toque va después de que algo quedó: la respuesta del servidor o la serie guardada', () => {
    const comidas = leer('registro-de-comidas.tsx');
    expect(comidas).toMatch(/const r = await comandoDeRegistro\.enviar\([^\n]*\);\s*tocarTrasLaRespuesta\(r, 'guardar'\);/);
    expect(comidas).toMatch(/const r = await api\.deshacerRegistroDeComida\([^\n]*\);\s*tocarTrasLaRespuesta\(r, 'deshacer'\);/);
    const sesion = leer('pantallas', 'entrenamiento.tsx');
    expect(sesion).toMatch(/if \(resultado !== 'registrada'\) return;\s*tocarTrasLaSerie\(resultado\);/);
    expect(sesion).toMatch(/!== 'quitada'\) return;\s*tocarTrasLaSerie\('quitada'\);/);
  });

  test('el interruptor está en Perfil, guardado en el teléfono', () => {
    const perfil = leer('pantallas', 'perfil.tsx');
    expect(perfil).toContain("{a === 'apariencia' ? <FilaDeLaHaptica /> : null}");
    expect(perfil).toContain('accessibilityRole="switch"');
    expect(perfil).toContain('preferenciasDelTelefono.cambiar({ haptica: !haptica })');
    expect(leer('haptica.ts')).toContain('preferenciasDelTelefono.actuales().haptica');
  });
});
