/**
 * TEST-PG-012 (WP-PULIDO-GRANDES, PG-13, con PG-D8): la presentación se ve una sola vez por teléfono y por cuenta, y el
 * permiso de los avisos se pide una sola vez, solo en la tercera tarjeta. Se prueba la lógica pura (`presentacion.ts`)
 * con un almacén en memoria y el `activar` de siempre (`avisos.ts`) con un teléfono de mentira, y, leyendo el código, que
 * la raíz la muestra después de «Antes de seguir» y que la Bienvenida dejó la frase vieja.
 *
 * Mutación verificada: con `guardarLaPresentacionVista` sin escribir en el almacén (no guardar lo visto), «una sola
 * vez» se pone en rojo; con `sePuedenPedirLosAvisos` sin mirar la tarjeta, «solo en la tercera» también.
 *
 * Uso: cd apps/mobile && npx jest src/presentacion.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { terminosProhibidosDeAntropometriaEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosDeFormulariosEn, terminosProhibidosEn } from '@be/domain';
import { activar, type DependenciasDeAvisos, type EstadoDeAvisos, type Permiso } from './avisos';
import type { AlmacenDeTexto } from './descanso-automatico';
import {
  activarDesdeLaPresentacion,
  claveDeLaPresentacion,
  crearRegistroDeLaPresentacion,
  PRESENTACION_AL_EMPEZAR,
  presentacionTras,
  respuestaDeLosAvisos,
  sePuedenPedirLosAvisos,
  TARJETAS_DE_LA_PRESENTACION,
  TEXTOS_DE_LA_PRESENTACION,
  type AccionDeLaPresentacion,
  type PasoDeLaPresentacion,
} from './presentacion';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const leer = (...partes: string[]): string => readFileSync(join(__dirname, ...partes), 'utf8');
const sinComentarios = (codigo: string): string => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const CUENTA = '11111111-1111-4111-8111-111111111111';
const OTRA = '22222222-2222-4222-8222-222222222222';

function almacenEnMemoria(fallas: { leer?: boolean; guardar?: boolean } = {}): AlmacenDeTexto & { readonly datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    async getItem(clave) {
      if (fallas.leer) throw new Error('El teléfono no deja leer');
      return datos.get(clave) ?? null;
    },
    async setItem(clave, valor) {
      if (fallas.guardar) throw new Error('El teléfono no deja guardar');
      datos.set(clave, valor);
    },
  };
}
/** Una espera que no termina nunca: la lectura del almacén siempre llega antes. */
const nunca = (): Promise<void> => new Promise<void>(() => undefined);

describe('TEST-PG-012 · una sola vez por teléfono y por cuenta', () => {
  test('la primera vez se muestra; vista, no vuelve, ni al abrir la app de nuevo', async () => {
    const almacen = almacenEnMemoria();
    const registro = crearRegistroDeLaPresentacion(almacen, nunca);
    expect(registro.estado(CUENTA)).toBe('leyendo');
    expect(await registro.leer(CUENTA)).toBe('pendiente');
    expect(await registro.marcarVista(CUENTA)).toBe(true);
    expect(registro.estado(CUENTA)).toBe('vista');
    // Otra vez la app, desde cero: lo visto quedó en el teléfono.
    const despues = crearRegistroDeLaPresentacion(almacen, nunca);
    expect(await despues.leer(CUENTA)).toBe('vista');
    expect(almacen.datos.has(claveDeLaPresentacion(CUENTA))).toBe(true);
  });

  test('es por cuenta: otra cuenta en el mismo teléfono la ve; la misma, con otra caja, no', async () => {
    const almacen = almacenEnMemoria();
    const registro = crearRegistroDeLaPresentacion(almacen, nunca);
    await registro.marcarVista(CUENTA);
    const despues = crearRegistroDeLaPresentacion(almacen, nunca);
    expect(await despues.leer(OTRA)).toBe('pendiente');
    expect(await despues.leer(CUENTA.toUpperCase())).toBe('vista');
    expect(claveDeLaPresentacion(CUENTA)).toBe(`be:presentacion-vista:${CUENTA}`);
  });

  test('si el teléfono no deja leer, o tarda, no se insiste: cuenta como vista', async () => {
    expect(await crearRegistroDeLaPresentacion(almacenEnMemoria({ leer: true }), nunca).leer(CUENTA)).toBe('vista');
    const lento: AlmacenDeTexto = { getItem: () => new Promise<string | null>(() => undefined), setItem: async () => undefined };
    expect(await crearRegistroDeLaPresentacion(lento, () => Promise.resolve()).leer(CUENTA)).toBe('vista');
  });

  test('si no se puede guardar, vale mientras la app esté abierta, y se dice', async () => {
    const registro = crearRegistroDeLaPresentacion(almacenEnMemoria({ guardar: true }), nunca);
    await registro.leer(CUENTA);
    expect(await registro.marcarVista(CUENTA)).toBe(false);
    expect(registro.estado(CUENTA)).toBe('vista');
  });

  test('avisa a quien la mira cuando cambia: la raíz deja la presentación y muestra la app', async () => {
    const registro = crearRegistroDeLaPresentacion(almacenEnMemoria(), nunca);
    let avisos = 0;
    const dejar = registro.suscribir(() => avisos++);
    await registro.leer(CUENTA);
    await registro.marcarVista(CUENTA);
    expect(avisos).toBe(2);
    dejar();
    await registro.marcarVista(OTRA);
    expect(avisos).toBe(2);
  });
});

const recorrer = (acciones: readonly AccionDeLaPresentacion[], desde: PasoDeLaPresentacion = PRESENTACION_AL_EMPEZAR): PasoDeLaPresentacion => acciones.reduce(presentacionTras, desde);
const ACTIVOS: EstadoDeAvisos = { tipo: 'activos' };

describe('TEST-PG-012 · las tarjetas', () => {
  test('tres, con «Siguiente» y «Anterior», sin salirse de la primera ni de la última', () => {
    expect(TARJETAS_DE_LA_PRESENTACION.map((t) => t.titulo)).toEqual(['Acá nadie te califica', 'Vos decidís quién ve qué', 'Tu profesional arma el plan; mientras, podés contar tus hábitos']);
    expect(recorrer([{ tipo: 'anterior' }]).indice).toBe(0);
    expect(recorrer([{ tipo: 'siguiente' }, { tipo: 'siguiente' }, { tipo: 'siguiente' }]).indice).toBe(2);
    expect(recorrer([{ tipo: 'siguiente' }, { tipo: 'anterior' }]).indice).toBe(0);
  });

  test('con el dedo: a la izquierda la siguiente, a la derecha la anterior; un toque o un desplazamiento hacia abajo, nada', () => {
    expect(recorrer([{ tipo: 'gesto', dx: -80, dy: 4 }]).indice).toBe(1);
    expect(recorrer([{ tipo: 'gesto', dx: -80, dy: 4 }, { tipo: 'gesto', dx: 90, dy: -6 }]).indice).toBe(0);
    expect(recorrer([{ tipo: 'gesto', dx: -20, dy: 0 }]).indice).toBe(0);
    expect(recorrer([{ tipo: 'gesto', dx: -80, dy: 200 }]).indice).toBe(0);
  });

  test('«Saltar» en cualquiera termina, sin pedir los avisos', () => {
    for (const hasta of [0, 1, 2]) {
      const p = recorrer([...Array.from({ length: hasta }, () => ({ tipo: 'siguiente' }) as const), { tipo: 'saltar' }]);
      expect(p.terminada).toBe(true);
      expect(p.avisos).toEqual({ tipo: 'sin-pedir' });
    }
  });
});

describe('TEST-PG-012 · los avisos, una sola vez y solo en la tercera', () => {
  test('en la primera y la segunda no se pueden pedir', () => {
    expect(sePuedenPedirLosAvisos(PRESENTACION_AL_EMPEZAR)).toBe(false);
    expect(recorrer([{ tipo: 'pedir-avisos' }]).avisos).toEqual({ tipo: 'sin-pedir' });
    expect(recorrer([{ tipo: 'siguiente' }, { tipo: 'pedir-avisos' }]).avisos).toEqual({ tipo: 'sin-pedir' });
    expect(sePuedenPedirLosAvisos(recorrer([{ tipo: 'siguiente' }, { tipo: 'siguiente' }]))).toBe(true);
  });

  test('pedidos una vez, no se vuelven a pedir; mientras tanto no se sale ni se pasa de tarjeta', () => {
    const pidiendo = recorrer([{ tipo: 'siguiente' }, { tipo: 'siguiente' }, { tipo: 'pedir-avisos' }]);
    expect(pidiendo.avisos).toEqual({ tipo: 'pidiendo' });
    expect(sePuedenPedirLosAvisos(pidiendo)).toBe(false);
    expect(presentacionTras(pidiendo, { tipo: 'saltar' }).terminada).toBe(false);
    expect(presentacionTras(pidiendo, { tipo: 'gesto', dx: 90, dy: 0 }).indice).toBe(2);
    const respondidos = presentacionTras(pidiendo, { tipo: 'avisos-respondidos', estado: ACTIVOS });
    expect(respondidos.avisos).toEqual({ tipo: 'respondidos', estado: ACTIVOS });
    expect(presentacionTras(respondidos, { tipo: 'pedir-avisos' })).toBe(respondidos);
    expect(presentacionTras(respondidos, { tipo: 'entrar' }).terminada).toBe(true);
  });

  test('«Ahora no» termina sin pedirlos, y después no se pide nada', () => {
    const ahoraNo = recorrer([{ tipo: 'siguiente' }, { tipo: 'siguiente' }, { tipo: 'ahora-no' }]);
    expect(ahoraNo).toEqual({ indice: 2, avisos: { tipo: 'sin-pedir' }, terminada: true });
    expect(presentacionTras(ahoraNo, { tipo: 'pedir-avisos' })).toBe(ahoraNo);
  });

  test('con el teléfono: el permiso de Android se pide una sola vez, aunque se toque dos veces', async () => {
    let pedidos = 0;
    let permiso: Permiso = 'sin-preguntar';
    const telefono: DependenciasDeAvisos = {
      canal: {
        permiso: async () => permiso,
        pedirPermiso: async () => {
          pedidos++;
          permiso = 'concedido';
          return permiso;
        },
        token: async () => 'ExponentPushToken[prueba]',
      },
      almacen: { leer: async () => null, guardar: async () => undefined, borrar: async () => undefined },
      api: { registrar: async () => ({ ok: true, datos: null }), retirar: async () => ({ ok: true, datos: null }) },
      nuevoIdentificador: () => '33333333-3333-4333-8333-333333333333',
    };
    // Como la pantalla: cada «Activar avisos» pasa por `sePuedenPedirLosAvisos` antes de llamar al teléfono.
    let paso = recorrer([{ tipo: 'siguiente' }, { tipo: 'siguiente' }]);
    for (let toque = 0; toque < 2; toque++) {
      if (!sePuedenPedirLosAvisos(paso)) continue;
      paso = presentacionTras(paso, { tipo: 'pedir-avisos' });
      const estado = await activarDesdeLaPresentacion({ activar: () => activar(telefono, { token: 't', identidadId: CUENTA }), primeraVez: async () => false, encenderLosRecordatorios: async () => undefined });
      paso = presentacionTras(paso, { tipo: 'avisos-respondidos', estado });
    }
    expect(pedidos).toBe(1);
    expect(paso.avisos).toEqual({ tipo: 'respondidos', estado: ACTIVOS });
  });
});

describe('TEST-PG-012 · activar, como en Cuenta', () => {
  test('la primera vez enciende los recordatorios; si ya se tocaron, no', async () => {
    let encendidos = 0;
    const pasos = (primeraVez: boolean | null, estado: EstadoDeAvisos = ACTIVOS) => ({
      activar: async () => estado,
      primeraVez: async () => primeraVez,
      encenderLosRecordatorios: async () => {
        encendidos++;
      },
    });
    expect(await activarDesdeLaPresentacion(pasos(true))).toEqual(ACTIVOS);
    expect(encendidos).toBe(1);
    await activarDesdeLaPresentacion(pasos(false));
    await activarDesdeLaPresentacion(pasos(null));
    expect(encendidos).toBe(1);
    // Sin permiso, no se toca nada más.
    expect(await activarDesdeLaPresentacion(pasos(true, { tipo: 'sin-permiso' }))).toEqual({ tipo: 'sin-permiso' });
    expect(encendidos).toBe(1);
  });

  test('si los recordatorios no se pueden encender, los avisos quedan activos igual', async () => {
    const estado = await activarDesdeLaPresentacion({ activar: async () => ACTIVOS, primeraVez: async () => true, encenderLosRecordatorios: () => Promise.reject(new Error('sin red')) });
    expect(estado).toEqual(ACTIVOS);
  });

  test('la respuesta se dice con las palabras de Cuenta', () => {
    const cuenta = { activos: 'Los avisos están activos en este teléfono.', sinPermiso: 'Sin permiso.', noDisponibles: 'No disponibles.' };
    expect(respuestaDeLosAvisos(ACTIVOS, cuenta)).toBe(cuenta.activos);
    expect(respuestaDeLosAvisos({ tipo: 'sin-permiso' }, cuenta)).toBe(cuenta.sinPermiso);
    expect(respuestaDeLosAvisos({ tipo: 'no-disponibles' }, cuenta)).toBe(cuenta.noDisponibles);
    expect(respuestaDeLosAvisos({ tipo: 'error', sinConexion: true, resultado: { ok: false, tipo: 'RED' } }, cuenta)).toBe(TEXTOS_DE_LA_PRESENTACION.sinConexion);
    expect(respuestaDeLosAvisos({ tipo: 'error', sinConexion: false, resultado: { ok: false, tipo: 'RED' } }, cuenta)).toBe(TEXTOS_DE_LA_PRESENTACION.noSePudoActivar);
  });
});

describe('TEST-PG-012 · la raíz y la Bienvenida (lectura del código)', () => {
  const app = sinComentarios(leer('..', 'App.tsx'));
  const pantalla = sinComentarios(leer('pantallas', 'presentacion.tsx'));

  test('después de «Antes de seguir» y en lugar de la app: sin la barra ni la campana hasta que se vea', () => {
    expect(app).toContain("const enLaPresentacion = compuertaAbierta && presentacion !== 'vista';");
    expect(app).toContain("const conSesion = compuertaAbierta && presentacion === 'vista';");
    expect(app).toContain("{enLaPresentacion && sesion && presentacion === 'pendiente' ? <PantallaDePresentacion");
    expect(app).toContain("{requiereSesion(ruta) && sesion && dejaSeguir(compuerta) && presentacion === 'vista' ? (");
  });

  test('la pantalla pide los avisos solo desde «Activar avisos», y «Ahora no» no los pide', () => {
    expect((pantalla.match(/\bactivar\(dependenciasDeAvisos/g) ?? []).length).toBe(1);
    expect(pantalla).toMatch(/async function pedirLosAvisos\(\) \{\s*if \(!sePuedenPedirLosAvisos\(paso\)\) return;/);
    expect(pantalla).toContain("onPress={() => despachar({ tipo: 'ahora-no' })}");
    expect(pantalla).toContain('registroDeLaPresentacion.marcarVista(identidadId)');
    // TalkBack: «Tarjeta 1 de 3» con el título; y sin fundido con «reducir movimiento».
    expect(pantalla).toContain('accessibilityLabel={`${cual}. ${tarjeta.titulo}`}');
    expect(pantalla).toMatch(/if \(movimientoReducido\) return;\s*entrada\.setValue\(0\);/);
    expect(TEXTOS_DE_LA_PRESENTACION.tarjeta(1, 3)).toBe('Tarjeta 1 de 3');
  });

  test('la Bienvenida deja «Plataforma integrada de inteligencia en salud»; la versión y el commit siguen, más chicos', () => {
    expect(app).not.toContain('Plataforma integrada de inteligencia en salud');
    expect(app).toContain('{TEXTOS_DE_LA_PRESENTACION.bienvenida}');
    expect(app).toContain('app {version} · {extra.appEnv ??');
    expect(app).toMatch(/identidad: \{ fontSize: 11,/);
  });
});

describe('TEST-PG-019 · los textos de la presentación ubican, no califican', () => {
  test('ninguna palabra que prohíbe TEST-PRJ-009, en ninguna lista', () => {
    const textos = [
      ...TARJETAS_DE_LA_PRESENTACION.flatMap((t) => [t.titulo, t.texto]),
      ...Object.values(TEXTOS_DE_LA_PRESENTACION).map((v) => (typeof v === 'function' ? v(1, 3) : v)),
    ];
    const hallazgos = textos.flatMap((t) =>
      [...terminosProhibidosEn(t), ...terminosProhibidosDeEntrenamientoEn(t), ...terminosProhibidosDeAntropometriaEn(t), ...terminosProhibidosDeFormulariosEn(t)].map((p) => `${p} en «${t}»`),
    );
    expect(hallazgos).toEqual([]);
    expect(textos.join(' ')).not.toMatch(/\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje)\b/i);
    // No pide metas, peso ni datos de salud: la presentación no tiene campos.
    expect(textos.join(' ')).not.toMatch(/\btu peso\b|\btus metas\b|\btu objetivo\b/i);
  });
});
