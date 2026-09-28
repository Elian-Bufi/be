/**
 * PF-02 · auditoría del #102 · la lógica del «Contexto declarado» del formulario de evaluación de entrenamiento
 * (apps/web/src/app/pro/advisees/training/contexto-citable.ts), con una fuente falsa en lugar de la API:
 *  1. versión vista: cada citable guarda el `version` de FRM-05 y la cita lo envía como `expectedVersion`; después de un
 *     conflicto, las elegidas que cambiaron se desmarcan y quedan señaladas, sin descartarse en silencio, y la relectura
 *     sigue hasta encontrar las elegidas aunque se hayan corrido de página;
 *  2. paginación: una primera página solo con Solicitudes de otro alcance no es un vacío definitivo si hay más; la
 *     siguiente trae las respuestas de entrenamiento, y la selección se conserva entre páginas;
 *  3. tope de 20 citas: la 21 no se marca, se puede desmarcar y volver a marcar, y el envío también se valida.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../apps/web/src/app/pro/advisees/training/contexto-citable.ts');

// ─── Fuente falsa: FRM-04 paginado, FRM-05 y FRM-02 ─────────────────────────────────────────────

const PLANTILLA = { templateId: 't-trn', templateVersionId: 'tv-trn' };
const CAMPOS = [
  { fieldCode: 'trn_dias_por_semana', label: 'Días por semana', unit: 'días por semana' },
  { fieldCode: 'trn_minutos_por_sesion', label: 'Minutos por sesión', unit: 'min' },
];

function solicitud(formRequestId, scope) {
  return { formRequestId, scope, status: 'RESPONDED', ...(scope === 'ENTRENAMIENTO' ? PLANTILLA : { templateId: 't-hab', templateVersionId: 'tv-hab' }) };
}
/** Una respuesta con su versión vigente: `rectificada` agrega una rectificación terminal (v2). */
function detalle(formRequestId, { dias = 3, rectificada = false } = {}) {
  const original = { answers: [{ fieldCode: 'trn_dias_por_semana', value: dias, unit: null }, { fieldCode: 'trn_minutos_por_sesion', value: 45, unit: 'minutos' }] };
  const rectificacion = { rectificationId: `${formRequestId}-r1`, answers: [{ fieldCode: 'trn_dias_por_semana', value: dias + 1, unit: null }], recordedAt: '2026-09-28T12:00:00.000Z' };
  return {
    ok: true,
    datos: {
      data: {
        response: {
          formResponseId: `${formRequestId}-resp`,
          original,
          rectifications: rectificada ? [rectificacion] : [],
          effectiveView: rectificada ? { kind: 'RECTIFIED', rectificationId: rectificacion.rectificationId } : { kind: 'ORIGINAL' },
          version: rectificada ? 'v2' : 'v1',
          submittedAt: '2026-09-27T12:00:00.000Z',
        },
      },
    },
  };
}

function fuenteFalsa({ paginas, rectificadas = new Set() }) {
  const pedidos = [];
  return {
    pedidos,
    listar: async (cursor) => {
      pedidos.push(cursor ?? null);
      const i = cursor ? Number(cursor.slice(1)) : 0;
      const hasMore = i + 1 < paginas.length;
      return { ok: true, datos: { data: paginas[i], page: { limit: 20, nextCursor: hasMore ? `c${i + 1}` : null, hasMore } } };
    },
    detalle: async (id) => detalle(id, { rectificada: rectificadas.has(id) }),
    version: async () => ({ ok: true, datos: { data: { sections: [{ fields: CAMPOS }] } } }),
  };
}

const deOtroAlcance = Array.from({ length: 20 }, (_, i) => solicitud(`nut-${i}`, 'NUTRICION'));
const deEntrenamiento = [solicitud('trn-a', 'ENTRENAMIENTO'), solicitud('trn-b', 'ENTRENAMIENTO')];

// ─── 2. Paginación ──────────────────────────────────────────────────────────────────────────────

test('paginación · una primera página solo de otro alcance no es un vacío definitivo: hay cursor para seguir', async () => {
  const fuente = fuenteFalsa({ paginas: [deOtroAlcance, deEntrenamiento] });
  const plantillas = new Map();
  const primera = await m.cargarPaginaDeCitables(fuente, undefined, plantillas);
  assert.equal(primera.ok, true);
  assert.deepEqual(primera.datos.citables, []);
  assert.equal(primera.datos.siguiente, 'c1', 'queda una página por consultar: la pantalla ofrece «Cargar más», no «no hay respuestas»');
  const segunda = await m.cargarPaginaDeCitables(fuente, primera.datos.siguiente, plantillas);
  assert.equal(segunda.datos.siguiente, null);
  assert.deepEqual(segunda.datos.citables.map(m.claveDe), ['trn-a-resp#trn_dias_por_semana', 'trn-a-resp#trn_minutos_por_sesion', 'trn-b-resp#trn_dias_por_semana', 'trn-b-resp#trn_minutos_por_sesion']);
  assert.deepEqual(fuente.pedidos, [null, 'c1'], 'la segunda página usa el cursor de FRM-04');
});

test('paginación · la selección se conserva al cargar más: se agrega a lo cargado, no lo reemplaza', async () => {
  const fuente = fuenteFalsa({ paginas: [[deEntrenamiento[0], ...deOtroAlcance.slice(0, 19)], [deEntrenamiento[1]]] });
  const plantillas = new Map();
  const p1 = await m.cargarPaginaDeCitables(fuente, undefined, plantillas);
  let seleccion = m.alternarSeleccion([], m.claveDe(p1.datos.citables[0])).seleccion;
  const p2 = await m.cargarPaginaDeCitables(fuente, p1.datos.siguiente, plantillas);
  const todas = [...p1.datos.citables, ...p2.datos.citables];
  seleccion = m.alternarSeleccion(seleccion, m.claveDe(p2.datos.citables[0])).seleccion;
  assert.deepEqual(m.citasAEnviar(todas, seleccion).map((c) => c.formResponseId), ['trn-a-resp', 'trn-b-resp']);
});

// ─── 1. Versión vista ───────────────────────────────────────────────────────────────────────────

test('versión vista · cada citable guarda la versión de FRM-05 y la cita la envía como expectedVersion', async () => {
  const fuente = fuenteFalsa({ paginas: [deEntrenamiento], rectificadas: new Set(['trn-b']) });
  const { datos } = await m.cargarPaginaDeCitables(fuente, undefined, new Map());
  const porClave = new Map(datos.citables.map((c) => [m.claveDe(c), c]));
  assert.equal(porClave.get('trn-a-resp#trn_dias_por_semana').expectedVersion, 'v1');
  assert.equal(porClave.get('trn-b-resp#trn_dias_por_semana').expectedVersion, 'v2');
  assert.equal(porClave.get('trn-b-resp#trn_dias_por_semana').valor, '4 días por semana', 'se muestra el valor de la versión vigente');
  assert.equal(porClave.get('trn-a-resp#trn_minutos_por_sesion').valor, '45 minutos', 'la unidad declarada gana a la de la plantilla');
  const enviadas = m.citasAEnviar(datos.citables, ['trn-a-resp#trn_dias_por_semana', 'trn-b-resp#trn_dias_por_semana']);
  assert.deepEqual(enviadas, [
    { formResponseId: 'trn-a-resp', fieldCode: 'trn_dias_por_semana', expectedVersion: 'v1' },
    { formResponseId: 'trn-b-resp', fieldCode: 'trn_dias_por_semana', expectedVersion: 'v2' },
  ]);
});

test('versión vista · después del conflicto, la elegida que cambió de versión se desmarca y se señala; la que sigue igual queda marcada', async () => {
  const antes = (await m.cargarPaginaDeCitables(fuenteFalsa({ paginas: [deEntrenamiento] }), undefined, new Map())).datos.citables;
  const despues = (await m.cargarPaginaDeCitables(fuenteFalsa({ paginas: [deEntrenamiento], rectificadas: new Set(['trn-a']) }), undefined, new Map())).datos.citables;
  const elegidas = ['trn-a-resp#trn_dias_por_semana', 'trn-b-resp#trn_dias_por_semana'];
  const r = m.reconciliarSeleccion(elegidas, antes, despues);
  assert.deepEqual(r.seleccion, ['trn-b-resp#trn_dias_por_semana']);
  assert.deepEqual(r.cambiadas, ['trn-a-resp#trn_dias_por_semana'], 'no se descarta en silencio: vuelve señalada');
  // Una elegida que ya no está disponible (la rectificación quitó el campo) también vuelve señalada.
  const sinMinutos = despues.filter((c) => c.fieldCode !== 'trn_minutos_por_sesion');
  const r2 = m.reconciliarSeleccion(['trn-b-resp#trn_minutos_por_sesion'], antes, sinMinutos);
  assert.deepEqual(r2, { seleccion: [], cambiadas: ['trn-b-resp#trn_minutos_por_sesion'] });
});

test('versión vista · al actualizar se sigue leyendo hasta encontrar las elegidas: una que se corrió de página no se da por perdida', async () => {
  // Antes: una sola página con trn-a. En el medio llegaron 20 Solicitudes nuevas de otro alcance y trn-a pasó a la página 2.
  const plantillas = new Map();
  const antes = (await m.cargarPaginasDeCitables(fuenteFalsa({ paginas: [[deEntrenamiento[0]]] }), plantillas, { minimo: 1 })).datos;
  const elegida = 'trn-a-resp#trn_dias_por_semana';
  const corrida = fuenteFalsa({ paginas: [deOtroAlcance, [deEntrenamiento[0]]], rectificadas: new Set(['trn-a']) });
  const r = await m.cargarPaginasDeCitables(corrida, plantillas, { minimo: antes.paginas, buscadas: [elegida] });
  assert.equal(r.datos.paginas, 2, 'no se queda en la primera página: la elegida todavía no apareció');
  assert.deepEqual(corrida.pedidos, [null, 'c1']);
  assert.deepEqual(m.reconciliarSeleccion([elegida], antes.citables, r.datos.citables), { seleccion: [], cambiadas: [elegida] });
  assert.ok(r.datos.citables.some((c) => m.claveDe(c) === elegida), 'la cambiada está en la lista, señalada, y no como «ya no disponible»');
  // Sin elegidas por buscar, se leen solo las páginas mínimas.
  const sinBuscar = fuenteFalsa({ paginas: [deOtroAlcance, [deEntrenamiento[0]]] });
  assert.equal((await m.cargarPaginasDeCitables(sinBuscar, plantillas, { minimo: 1 })).datos.paginas, 1);
});

// ─── 3. Tope de 20 citas ────────────────────────────────────────────────────────────────────────

test('tope · se marcan 20; la 21 no se marca y lo avisa; desmarcar libera un lugar', () => {
  const claves = Array.from({ length: 21 }, (_, i) => `r${i}#trn_dias_por_semana`);
  let seleccion = [];
  for (const k of claves.slice(0, 20)) {
    const r = m.alternarSeleccion(seleccion, k);
    assert.equal(r.topeAlcanzado, false);
    seleccion = r.seleccion;
  }
  assert.equal(seleccion.length, m.MAXIMO_DE_CITAS);
  const veintiuna = m.alternarSeleccion(seleccion, claves[20]);
  assert.equal(veintiuna.topeAlcanzado, true);
  assert.deepEqual(veintiuna.seleccion, seleccion, 'la selección de 20 queda intacta: nada se descarta');
  const desmarcada = m.alternarSeleccion(seleccion, claves[0]);
  assert.equal(desmarcada.seleccion.length, 19);
  const ahoraSi = m.alternarSeleccion(desmarcada.seleccion, claves[20]);
  assert.equal(ahoraSi.topeAlcanzado, false);
  assert.equal(ahoraSi.seleccion.length, 20);
  assert.ok(ahoraSi.seleccion.includes(claves[20]));
});

test('tope · el envío también se valida: 20 pasa, 21 no', () => {
  const de = (n) => Array.from({ length: n }, (_, i) => `r${i}#trn_dias_por_semana`);
  assert.equal(m.excesoDeSeleccion(de(20)), null);
  assert.equal(m.excesoDeSeleccion(de(21)), 1);
});
