/**
 * WP-ENTRENAMIENTO-SERIES (DL-122, DL-124): los tiempos de una sesión y la relación de cada serie con su objetivo, contra
 * los oráculos del paquete de Dirección del 2026-10-06 (`datos/casos_tiempos.json` y `datos/casos_series.json`). Los
 * casos no se cambian para que la prueba pase. El reloj es inyectado: ninguna prueba espera tiempo real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { descansoCalculado, deduplicarEventos, diferenciaParaMostrar, duracionDeIntervalo, duracionParaMostrar, resumenDeSesion, type CalidadDeTiempo, type InstanteDeEvento } from './tiempos-de-entrenamiento';
import { hayDatosRealizados, relacionDeCarga, relacionDeRepeticiones, relacionDeRir, type RelacionConElObjetivo } from './relacion-con-el-objetivo';

const DATOS = join(__dirname, '..', '..', '..', 'docs', 'fuente_entrenamiento', 'BE_Entrenamiento_Autonomo_2026-10-06', 'datos');
const leer = <T>(archivo: string): T => JSON.parse(readFileSync(join(DATOS, archivo), 'utf8')) as T;

const CALIDAD: Readonly<Record<string, CalidadDeTiempo>> = { medido: 'MEDIDO', estimado: 'ESTIMADO', incompleto: 'INCOMPLETO', sin_dato: 'SIN_DATO', invalido: 'INVALIDO' };
const S = 1000;

/** Un instante de la fixture: monotónico en el mismo proceso (ancla «proceso-1»), o recuperado por reloj civil. */
function instante(offset: number | null, source: string | undefined, civil?: number): InstanteDeEvento | null {
  if (offset === null) return null;
  if (source === 'recovered_wall_clock') return { civilMs: offset * S, monotonico: null, origen: 'RELOJ_CIVIL_RECUPERADO' };
  return { civilMs: (civil ?? offset) * S, monotonico: { ancla: 'proceso-1', ms: offset * S }, origen: 'MONOTONICO' };
}

interface CasoDeTiempo {
  id: string;
  kind: 'interval' | 'rest' | 'session' | 'duplicates';
  start?: number | null;
  end?: number | null;
  source?: string;
  civilStart?: number;
  civilEnd?: number;
  target?: number | null;
  pauses?: [number, number][];
  exerciseSpans?: { exercise: string; start: number; end: number }[];
  events?: { id: string; type: string; offset: number }[];
  expected: Record<string, unknown>;
}

const casosDeTiempo = leer<{ cases: CasoDeTiempo[] }>('casos_tiempos.json').cases;

test('los 16 casos de tiempos del paquete', () => {
  assert.equal(casosDeTiempo.length, 16);
  for (const c of casosDeTiempo) {
    const e = c.expected as Record<string, unknown>;
    if (c.kind === 'interval') {
      const d = duracionDeIntervalo(instante(c.start ?? null, c.source, c.civilStart), instante(c.end ?? null, c.source, c.civilEnd));
      assert.deepEqual({ segundos: d.ms === null ? null : d.ms / S, calidad: d.calidad }, { segundos: e.seconds, calidad: CALIDAD[e.quality as string] }, c.id);
    } else if (c.kind === 'rest') {
      const d = descansoCalculado(instante(c.start ?? null, c.source), instante(c.end ?? null, c.source), c.target ?? null);
      assert.deepEqual({ seconds: d.ms === null ? null : d.ms / S, differenceSeconds: d.diferenciaMs === null ? null : d.diferenciaMs / S }, e, c.id);
    } else if (c.kind === 'session') {
      const r = resumenDeSesion({
        inicio: c.start! * S,
        fin: c.end! * S,
        pausas: (c.pauses ?? []).map(([a, b]) => ({ inicio: a * S, fin: b * S })),
        tramos: (c.exerciseSpans ?? []).map((t) => ({ ejercicio: t.exercise, inicio: t.start * S, fin: t.end * S })),
      });
      assert.deepEqual(
        {
          elapsedSeconds: r.transcurridoMs / S,
          pauseSeconds: r.pausasMs / S,
          withoutPausesSeconds: r.sinPausasMs / S,
          exerciseSeconds: Object.fromEntries(Object.entries(r.porEjercicioMs).map(([k, v]) => [k, v / S])),
          unassignedSeconds: r.sinEjercicioMs / S,
        },
        e,
        c.id,
      );
    } else {
      const { unicos, conflictos } = deduplicarEventos(c.events!, (a, b) => a.type === b.type && a.offset === b.offset);
      const inicio = unicos.find((x) => x.type === 'start')!;
      const fin = unicos.find((x) => x.type === 'end')!;
      assert.deepEqual({ uniqueEvents: unicos.length, restSeconds: fin.offset - inicio.offset }, e, c.id);
      assert.equal(conflictos.length, 0, c.id);
    }
  }
});

test('el mismo identificador con otro contenido es un conflicto, no un reemplazo silencioso', () => {
  const { unicos, conflictos } = deduplicarEventos(
    [
      { id: 'r1:end', type: 'end', offset: 155 },
      { id: 'r1:end', type: 'end', offset: 170 },
    ],
    (a, b) => a.type === b.type && a.offset === b.offset,
  );
  assert.equal(unicos.length, 1);
  assert.equal(unicos[0]!.offset, 155);
  assert.equal(conflictos.length, 1);
});

test('el ejemplo principal: un tramo abierto se cierra en el cambio de ejercicio o en el fin; una pausa abierta, en el fin', () => {
  const r = resumenDeSesion({
    inicio: 0,
    fin: 900 * S,
    pausas: [{ inicio: 500 * S, fin: null }],
    tramos: [
      { ejercicio: 'A', inicio: 10 * S, fin: null },
      { ejercicio: 'B', inicio: 450 * S, fin: null },
    ],
  });
  // La pausa abierta se cierra al finalizar: va de 500 a 900.
  assert.deepEqual({ pausas: r.pausasMs / S, a: r.porEjercicioMs.A! / S, b: r.porEjercicioMs.B! / S, sin: r.sinEjercicioMs / S }, { pausas: 400, a: 440, b: 50, sin: 10 });
});

test('una duración se redondea solo al mostrar, y la diferencia se dice sin juicio', () => {
  assert.equal(duracionParaMostrar(105 * S), '01:45');
  assert.equal(duracionParaMostrar(65 * 60 * S), '1:05:00');
  assert.equal(duracionParaMostrar(null), null);
  assert.equal(diferenciaParaMostrar(15 * S), '+00:15');
  assert.equal(diferenciaParaMostrar(-30 * S), '−00:30');
  assert.equal(diferenciaParaMostrar(0), '±00:00');
  assert.equal(diferenciaParaMostrar(null), null);
});

// ─── Series ───────────────────────────────────────────────────────────────────────────────────────

const RELACION: Readonly<Record<string, RelacionConElObjetivo>> = {
  dentro: 'DENTRO',
  debajo: 'DEBAJO',
  encima: 'ENCIMA',
  igual: 'IGUAL',
  sin_dato: 'SIN_DATO',
  sin_objetivo: 'SIN_OBJETIVO',
  unidades_incompatibles: 'UNIDADES_INCOMPATIBLES',
  invalido: 'INVALIDO',
};

interface CasoDeSerie {
  id: string;
  type: 'reps' | 'rir' | 'load' | 'empty_submission';
  target?: unknown;
  actual: unknown;
  expected: string;
}

test('los 20 casos de series del paquete: relaciones neutrales, cero explícito distinto de ausente', () => {
  const casos = leer<{ cases: CasoDeSerie[] }>('casos_series.json').cases;
  assert.equal(casos.length, 20);
  for (const c of casos) {
    if (c.type === 'empty_submission') {
      const fila = c.actual as { load: number | null; reps: number | null; rir: number | null };
      assert.equal(hayDatosRealizados({ carga: fila.load === null ? null : { value: fila.load, unit: 'kg' }, repeticiones: fila.reps, rir: fila.rir }), false, c.id);
      assert.equal(c.expected, 'no_hay_datos_realizados', c.id);
      continue;
    }
    const obtenido =
      c.type === 'reps'
        ? relacionDeRepeticiones(c.target as never, c.actual as number | null)
        : c.type === 'rir'
          ? relacionDeRir(c.target as number | null, c.actual as number | null)
          : relacionDeCarga(c.target as never, c.actual as never);
    assert.equal(obtenido, RELACION[c.expected], c.id);
  }
});

test('un dato realizado basta para registrar, y el cero cuenta como dato', () => {
  assert.equal(hayDatosRealizados({ carga: null, repeticiones: 0, rir: null }), true);
  assert.equal(hayDatosRealizados({ carga: { value: 0, unit: 'kg' }, repeticiones: null, rir: null }), true);
  assert.equal(hayDatosRealizados({ carga: null, repeticiones: null, rir: 0 }), true);
});
