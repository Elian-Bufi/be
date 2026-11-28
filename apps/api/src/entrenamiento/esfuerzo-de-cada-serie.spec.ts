import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPACIDAD_ESFUERZO_DE_CADA_SERIE, CAPACIDAD_ESFUERZO_DE_LA_SESION, type CapacidadDeCliente } from '@be/domain';
import type { ContextoDeSolicitud } from '../http/contexto';
import { sabeElEsfuerzoDeCadaSerie } from './compatibilidad-de-clientes';
import { pideElEsfuerzoDeCadaSerieDelPlan } from './lectura-por-serie';

/**
 * DL-202 (WP-ESFUERZO-POR-SERIE) · «Pedir el esfuerzo de cada serie» en la API, sin base: cómo se resuelve para un plan
 * (EP-D02) y a quién se le manda (EP-D06). La lectura de las ejecuciones va con un cliente de mentira que registra lo que
 * se le pide.
 */
const contexto = (capacidades: readonly CapacidadDeCliente[]): ContextoDeSolicitud => ({
  requestId: 'pedido-de-prueba',
  momentoDeRecepcion: new Date(),
  superficie: 'APK',
  direccionIp: null,
  agenteDeUsuario: null,
  capacidades: new Set(capacidades),
});

const serie = (rir: number | null, extra: Record<string, unknown> = {}) => ({ setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir, perceivedExertion: null, ...extra });

function clienteCon(ejecuciones: { contenido: unknown; correcciones: { contenido: unknown }[] }[]) {
  const pedidos: unknown[] = [];
  const tx = {
    ejecucionDeEntrenamiento: {
      findMany: async (args: unknown) => {
        pedidos.push(args);
        return ejecuciones;
      },
    },
  };
  return { tx: tx as unknown as Parameters<typeof pideElEsfuerzoDeCadaSerieDelPlan>[0], pedidos };
}

describe('DL-202 · el esfuerzo de cada serie en la API', () => {
  it('lo escrito en el plan manda, encendido o apagado, sin leer ninguna ejecución', async () => {
    for (const valor of [true, false]) {
      const { tx, pedidos } = clienteCon([{ contenido: { exercises: [{ sets: [serie(2)] }] }, correcciones: [] }]);
      await expect(pideElEsfuerzoDeCadaSerieDelPlan(tx, { askSetEffort: valor }, 'persona', 'plan')).resolves.toBe(valor);
      expect(pedidos).toHaveLength(0);
    }
  });

  it('ausente: apagado si la persona no declaró ningún esfuerzo en ese plan', async () => {
    const { tx, pedidos } = clienteCon([
      { contenido: { exercises: [{ sets: [serie(null), serie(2, { recordedAs: 'AS_PLANNED' }), serie(1, { fieldOrigins: { rir: 'PLAN' } }), serie(3, { setKind: 'WARM_UP' })] }] }, correcciones: [] },
    ]);
    await expect(pideElEsfuerzoDeCadaSerieDelPlan(tx, null, 'persona', 'plan')).resolves.toBe(false);
    // Las ejecuciones de la persona en cualquier versión de ese plan, con sus correcciones.
    expect(pedidos).toEqual([{ where: { asesoradoId: 'persona', versionDePlan: { planId: 'plan' } }, select: { contenido: true, correcciones: { select: { contenido: true } } } }]);
  });

  it('ausente: encendido si la declaró, en lo registrado o en una corrección', async () => {
    const enLoRegistrado = clienteCon([{ contenido: { exercises: [{ sets: [serie(2, { fieldOrigins: { rir: 'PERSON' } })] }] }, correcciones: [] }]);
    await expect(pideElEsfuerzoDeCadaSerieDelPlan(enLoRegistrado.tx, {}, 'persona', 'plan')).resolves.toBe(true);
    const enUnaCorreccion = clienteCon([{ contenido: { exercises: [{ sets: [serie(null)] }] }, correcciones: [{ contenido: { exercises: [{ sets: [serie(0)] }] } }] }]);
    await expect(pideElEsfuerzoDeCadaSerieDelPlan(enUnaCorreccion.tx, undefined, 'persona', 'plan')).resolves.toBe(true);
  });

  it('a la app le sale `askSetEffort` solo si declara la capacidad; al profesional, siempre', () => {
    expect(sabeElEsfuerzoDeCadaSerie(contexto([CAPACIDAD_ESFUERZO_DE_CADA_SERIE]))).toBe(true);
    expect(sabeElEsfuerzoDeCadaSerie(contexto([]))).toBe(false);
    expect(sabeElEsfuerzoDeCadaSerie(contexto([CAPACIDAD_ESFUERZO_DE_LA_SESION]))).toBe(false);
    const servicio = readFileSync(join(__dirname, 'series.service.ts'), 'utf8');
    expect(servicio).toMatch(/sabeElEsfuerzoDeCadaSerie\(ctx\) \? \{ askSetEffort: await pideElEsfuerzoDeCadaSerieDelPlan\(tx, planning, actor\.identidadId, version\.planId\) \}/);
    expect(servicio).toMatch(/askSetEffort: await pideElEsfuerzoDeCadaSerieDelPlan\(tx, contenido\.planning, titular, v\.planId\),/);
  });
});
