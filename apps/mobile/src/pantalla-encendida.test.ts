/**
 * TEST-PG-004 (WP-PULIDO-GRANDES, PG-05, con PG-D3): la pantalla encendida solo con la sesión corriendo, y liberada en cada
 * salida. Se prueba la regla y el control con un teléfono de mentira que anota cada pedido, la casilla guardada en el
 * teléfono (`preferencias-del-telefono.ts`) y, leyendo el código, que la sesión la usa y que nada más la pide.
 *
 * Mutación verificada: con la liberación sacada de `actualizar` (pausar no libera), la secuencia de la sesión se pone en
 * rojo; con la casilla ignorada en `debeEstarEncendida`, también.
 *
 * Uso: cd apps/mobile && npx jest src/pantalla-encendida.test.ts --runInBand.
 */
import { describe, expect, test } from '@jest/globals';
import { crearControlDeLaPantalla, debeEstarEncendida, type CondicionesDeLaPantalla } from './pantalla-encendida';
import { CLAVE_DE_LAS_PREFERENCIAS, crearPreferenciasDelTelefono, PREFERENCIAS_DE_FABRICA, preferenciasDe } from './preferencias-del-telefono';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; readdirSync(ruta: string): string[]; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]) => readFileSync(join(__dirname, ...partes), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** Un teléfono de mentira: anota «prender» y «liberar» en orden. */
function telefono() {
  const pedidos: string[] = [];
  return { pedidos, pantalla: { prender: () => void pedidos.push('prender'), liberar: () => void pedidos.push('liberar') } };
}

const EN_LA_SESION: CondicionesDeLaPantalla = { corriendo: true, primerPlano: true, preferencia: true };

describe('TEST-PG-004 · cuándo se prende', () => {
  test('solo con la sesión corriendo, la app adelante y la casilla prendida', () => {
    expect(debeEstarEncendida(EN_LA_SESION)).toBe(true);
    expect(debeEstarEncendida({ ...EN_LA_SESION, corriendo: false })).toBe(false);
    expect(debeEstarEncendida({ ...EN_LA_SESION, primerPlano: false })).toBe(false);
    expect(debeEstarEncendida({ ...EN_LA_SESION, preferencia: false })).toBe(false);
  });
});

describe('TEST-PG-004 · cada salida de la sesión libera la pantalla', () => {
  test('iniciar, pausar, reanudar, segundo plano, volver y finalizar: prende y libera en cada cambio, sin repetir', () => {
    const { pedidos, pantalla } = telefono();
    const control = crearControlDeLaPantalla(pantalla);
    const paso = (c: Partial<CondicionesDeLaPantalla>) => control.actualizar(debeEstarEncendida({ ...EN_LA_SESION, ...c }));
    paso({ corriendo: false }); // la sesión abierta, sin «Iniciar entrenamiento»
    paso({}); // Iniciar entrenamiento
    paso({}); // un redibujo: no pide de nuevo
    paso({ corriendo: false }); // Pausar
    paso({}); // Reanudar
    paso({ primerPlano: false }); // la app atrás
    paso({}); // vuelve a la sesión en curso
    paso({ corriendo: false }); // Finalizar
    expect(pedidos).toEqual(['prender', 'liberar', 'prender', 'liberar', 'prender', 'liberar']);
    expect(control.prendida()).toBe(false);
  });

  test('salir de la sesión con la pantalla prendida la libera; sin prender, no pide nada', () => {
    const uno = telefono();
    const control = crearControlDeLaPantalla(uno.pantalla);
    control.actualizar(true);
    control.terminar();
    control.terminar();
    expect(uno.pedidos).toEqual(['prender', 'liberar']);
    const otro = telefono();
    crearControlDeLaPantalla(otro.pantalla).terminar();
    expect(otro.pedidos).toEqual([]);
  });

  test('con la casilla apagada, nunca se pide', () => {
    const { pedidos, pantalla } = telefono();
    const control = crearControlDeLaPantalla(pantalla);
    for (const c of [EN_LA_SESION, { ...EN_LA_SESION, corriendo: false }, EN_LA_SESION]) control.actualizar(debeEstarEncendida({ ...c, preferencia: false }));
    control.terminar();
    expect(pedidos).toEqual([]);
  });
});

describe('TEST-PG-004 · la casilla se recuerda en el teléfono', () => {
  test('de fábrica, prendidas (PG-D3 y PG-D4); lo guardado vale en un proceso nuevo; si no se puede leer, las de fábrica', async () => {
    expect(PREFERENCIAS_DE_FABRICA).toEqual({ pantallaEncendida: true, haptica: true });
    const guardado = new Map<string, string>();
    const almacen = { getItem: async (k: string) => guardado.get(k) ?? null, setItem: async (k: string, v: string) => void guardado.set(k, v) };
    const a = crearPreferenciasDelTelefono(almacen);
    expect(await a.leer()).toEqual(PREFERENCIAS_DE_FABRICA);
    expect(await a.cambiar({ pantallaEncendida: false })).toBe(true);
    expect(guardado.has(CLAVE_DE_LAS_PREFERENCIAS)).toBe(true);
    expect(await crearPreferenciasDelTelefono(almacen).leer()).toEqual({ pantallaEncendida: false, haptica: true });
    const roto = crearPreferenciasDelTelefono({
      getItem: async () => {
        throw new Error('sin almacenamiento');
      },
      setItem: async () => {
        throw new Error('no');
      },
    });
    expect(await roto.leer()).toEqual(PREFERENCIAS_DE_FABRICA);
    expect(await roto.cambiar({ haptica: false })).toBe(false);
    expect(roto.actuales().haptica).toBe(false);
    expect(preferenciasDe('{"pantallaEncendida":"no"}')).toEqual(PREFERENCIAS_DE_FABRICA);
    expect(preferenciasDe('basura')).toEqual(PREFERENCIAS_DE_FABRICA);
  });
});

describe('TEST-PG-004 · dónde se usa (lectura del código)', () => {
  test('la sesión en vivo la pide con la corrida sin pausa; salir de la pantalla la libera', () => {
    expect(leer('pantallas', 'entrenamiento.tsx')).toContain('usePantallaEncendida(conCorrida && !estado.pausada);');
    const gancho = leer('pantalla-encendida-en-la-sesion.ts');
    expect(gancho).toContain('useEffect(() => () => control.terminar(), [control]);');
    expect(gancho).toContain("setPrimerPlano(momento === 'active')");
  });

  test('solo ese archivo usa expo-keep-awake: ni Nutrición ni otra pantalla dejan la pantalla prendida', () => {
    const archivos = [...readdirSync(__dirname).map((f) => [f]), ...readdirSync(join(__dirname, 'pantallas')).map((f) => ['pantallas', f])].filter((p) => /\.tsx?$/.test(p[p.length - 1]) && !/\.test\./.test(p[p.length - 1]));
    const usan = archivos.filter((p) => /expo-keep-awake|useKeepAwake|activateKeepAwake/.test(leer(...p))).map((p) => p.join('/'));
    expect(usan).toEqual(['pantalla-encendida-en-la-sesion.ts']);
    expect(leer('..', 'App.tsx')).not.toMatch(/keep-awake|KeepAwake/);
  });

  test('la casilla está en los ajustes del descanso, con su texto', () => {
    expect(leer('pantallas', 'sesion-enfocada.tsx')).toContain('<CasillaSimple marcada={pantallaEncendida} onCambio={onPantallaEncendida} texto={TEXTOS_DEL_PULIDO.mantenerLaPantalla} />');
    expect(leer('textos-del-pulido.ts')).toContain("mantenerLaPantalla: 'Mantener la pantalla encendida durante la sesión',");
  });
});
