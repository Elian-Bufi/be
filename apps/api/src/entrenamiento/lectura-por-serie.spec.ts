import { EventoDeTiempoSchema } from '@be/domain';
import { eventosDeTiempo } from './lectura-por-serie';

/**
 * DL-124, precierre del 2026-10-06, §3 · los eventos guardados antes de que el instante declarara la base de su reloj. Solo
 * existen en bases locales (la tabla no se desplegó) y la base ya no deja insertar otros así (CHECK
 * `evento_de_tiempo_base_del_reloj`), por eso se prueba sin base: una transacción falsa que devuelve las filas.
 */
const RECEPCION = new Date('2026-10-06T12:00:00.000Z');
const evento = (monotonic: Record<string, unknown> | null) => ({
  eventId: 'corrida-1-001',
  runId: 'corrida-1',
  sequence: 1,
  compoundActionId: null,
  type: 'SESSION_STARTED',
  at: { civil: '2026-10-06T11:59:00.000Z', monotonic, source: monotonic ? 'MONOTONIC' : 'RECOVERED_WALL_CLOCK' },
});
const filas = (...contenidos: unknown[]) => ({
  eventoDeTiempoDeEntrenamiento: { findMany: async () => contenidos.map((contenido) => ({ contenido, descansoRecomendadoSegundos: null, momentoDeRecepcion: RECEPCION })) },
});

describe('DL-124 · la base del reloj de lo ya guardado', () => {
  it('un evento anterior se lee con el reloj del proceso, con el que se tomó; cumple el contrato vigente', async () => {
    const [f] = await eventosDeTiempo(filas(evento({ anchor: 'proceso-1', ms: 5000 })) as never, 'borrador');
    expect(f!.contenido).toEqual(evento({ anchor: 'proceso-1', ms: 5000, clock: 'PROCESS_MONOTONIC' }));
    expect(EventoDeTiempoSchema.safeParse(f!.contenido).success).toBe(true);
    expect(EventoDeTiempoSchema.safeParse(evento({ anchor: 'proceso-1', ms: 5000 })).success).toBe(false);
  });

  it('un evento con su base, o sin monotónico, sale tal como se guardó', async () => {
    const conBase = evento({ anchor: 'arranque-1', ms: 5000, clock: 'ELAPSED_SINCE_BOOT' });
    const civil = evento(null);
    const leidas = await eventosDeTiempo(filas(conBase, civil) as never, 'borrador');
    expect(leidas.map((f) => f.contenido)).toEqual([conBase, civil]);
    expect(leidas.map((f) => [f.descansoRecomendadoSegundos, f.momentoDeRecepcion])).toEqual([
      [null, RECEPCION],
      [null, RECEPCION],
    ]);
  });
});
