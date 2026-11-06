/**
 * PF-02 · auditoría del #102 · la lógica del «Contexto declarado» del formulario de evaluación de entrenamiento
 * (apps/web/src/app/pro/advisees/training/contexto-citable.ts), con una fuente falsa en lugar de la API:
 *  1. versión vista: cada citable guarda el `version` de la respuesta y la cita lo envía como `expectedVersion`; después
 *     de un conflicto, las elegidas que cambiaron se desmarcan y quedan señaladas, sin descartarse en silencio, y la
 *     relectura sigue hasta encontrar las elegidas aunque se hayan corrido de página;
 *  2. paginación: una primera página solo con Solicitudes de otro alcance no es un vacío definitivo si hay más; la
 *     siguiente trae las respuestas de entrenamiento, y la selección se conserva entre páginas;
 *  3. tope de 20 citas: la 21 no se marca, se puede desmarcar y volver a marcar, y el envío también se valida.
 * WP-FORMULARIOS-DE-INICIO (DL-164): el detalle y la estructura se leen con API-FRI-03 y API-FRI-01 (sirven cualquier
 * versión) y cada valor se muestra en palabras: la etiqueta de la opción elegida, el número con su unidad. Reemplaza a
 * `scripts/contexto-citable.test.mjs`, que usaba la fuente V1 (FRM-05 y FRM-02).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/training/contexto-citable.ts');

// ─── Fuente falsa: FRM-04 paginado, FRI-03 y FRI-01 ─────────────────────────────────────────────

const PLANTILLA = { templateId: 't-trn', templateVersionId: 'tv-trn' };
const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const CAMPOS = [
  { ...base, fieldCode: 'trn_dias_por_semana', label: 'Días por semana', dataType: 'NUMBER', unit: 'días por semana', limits: null },
  { ...base, fieldCode: 'trn_minutos_por_sesion', label: 'Minutos por sesión', dataType: 'NUMBER', unit: 'min', limits: null },
  { ...base, fieldCode: 'trn_experiencia', label: 'Experiencia', dataType: 'CHOICE', options: [{ code: 'nada', label: 'Nunca entrené' }, { code: 'algo', label: 'Entrené un tiempo' }], otherOptionCode: null },
];

function solicitud(formRequestId, scope) {
  return { formRequestId, scope, status: 'RESPONDED', ...(scope === 'ENTRENAMIENTO' ? PLANTILLA : { templateId: 't-hab', templateVersionId: 'tv-hab' }) };
}
const a = (fieldCode, answer) => ({ fieldCode, answer, provenance: 'SELF_REPORTED' });
/** Una respuesta V2 con su versión vigente: `rectificada` agrega una rectificación terminal (v2). */
function vista(formRequestId, { dias = 3, rectificada = false } = {}) {
  const original = { answers: [a('trn_dias_por_semana', { type: 'NUMBER', number: dias, unit: 'días por semana' }), a('trn_minutos_por_sesion', { type: 'NUMBER', number: 45, unit: 'minutos' }), a('trn_experiencia', { type: 'CHOICE', option: 'algo', otherText: null })] };
  const rectificacion = { rectificationId: `${formRequestId}-r1`, previousRectificationId: null, reason: 'Cambió', answers: [a('trn_dias_por_semana', { type: 'NUMBER', number: dias + 1, unit: 'días por semana' })], version: 'v2', recordedAt: '2026-09-28T12:00:00.000Z' };
  return {
    ok: true,
    datos: {
      data: {
        request: { formRequestId },
        respondable: false,
        response: {
          formResponseId: `${formRequestId}-resp`,
          formRequestId,
          original,
          rectifications: rectificada ? [rectificacion] : [],
          effectiveView: rectificada ? { kind: 'RECTIFIED', rectificationId: rectificacion.rectificationId } : { kind: 'ORIGINAL' },
          transcription: null,
          version: rectificada ? 'v2' : 'v1',
          submittedAt: '2026-09-27T12:00:00.000Z',
        },
        proposal: null,
        lastProposalOutcome: null,
      },
    },
  };
}

function fuenteFalsa({ paginas, rectificadas = new Set() }) {
  const pedidos = [];
  const definiciones = [];
  return {
    pedidos,
    definiciones,
    listar: async (cursor) => {
      pedidos.push(cursor ?? null);
      const i = cursor ? Number(cursor.slice(1)) : 0;
      const hasMore = i + 1 < paginas.length;
      return { ok: true, datos: { data: paginas[i], page: { limit: 20, nextCursor: hasMore ? `c${i + 1}` : null, hasMore } } };
    },
    vista: async (id) => vista(id, { rectificada: rectificadas.has(id) }),
    definicion: async (templateId, versionId) => {
      definiciones.push(versionId);
      return { ok: true, datos: { data: { sections: [{ sectionCode: 's', title: 'S', intro: null, fields: CAMPOS }] } } };
    },
  };
}

const deOtroAlcance = Array.from({ length: 20 }, (_, i) => solicitud(`nut-${i}`, 'NUTRICION'));
const deEntrenamiento = [solicitud('trn-a', 'ENTRENAMIENTO'), solicitud('trn-b', 'ENTRENAMIENTO')];
const CLAVES_DE = (id) => [`${id}-resp#trn_dias_por_semana`, `${id}-resp#trn_minutos_por_sesion`, `${id}-resp#trn_experiencia`];

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
  assert.deepEqual(segunda.datos.citables.map(m.claveDe), [...CLAVES_DE('trn-a'), ...CLAVES_DE('trn-b')]);
  assert.deepEqual(fuente.pedidos, [null, 'c1'], 'la segunda página usa el cursor de FRM-04');
  assert.deepEqual(fuente.definiciones, ['tv-trn'], 'la estructura se lee una vez por versión (API-FRI-01)');
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

test('versión vista · cada citable guarda la versión de la respuesta y la cita la envía como expectedVersion; el valor va en palabras', async () => {
  const fuente = fuenteFalsa({ paginas: [deEntrenamiento], rectificadas: new Set(['trn-b']) });
  const { datos } = await m.cargarPaginaDeCitables(fuente, undefined, new Map());
  const porClave = new Map(datos.citables.map((c) => [m.claveDe(c), c]));
  assert.equal(porClave.get('trn-a-resp#trn_dias_por_semana').expectedVersion, 'v1');
  assert.equal(porClave.get('trn-b-resp#trn_dias_por_semana').expectedVersion, 'v2');
  assert.equal(porClave.get('trn-b-resp#trn_dias_por_semana').valor, '4 días por semana', 'se muestra el valor de la versión vigente');
  assert.equal(porClave.get('trn-a-resp#trn_minutos_por_sesion').valor, '45 minutos', 'la unidad declarada gana a la de la plantilla');
  assert.equal(porClave.get('trn-a-resp#trn_experiencia').valor, 'Entrené un tiempo', 'una opción se cita con su etiqueta, nunca con el código');
  assert.equal(porClave.get('trn-a-resp#trn_experiencia').etiqueta, 'Experiencia');
  assert.equal(porClave.has('trn-b-resp#trn_experiencia'), false, 'la rectificación terminal no trajo la experiencia: no se cita lo que no rige');
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
  assert.deepEqual(corrida.definiciones, [], 'la plantilla ya estaba en la caché: no se vuelve a leer');
  const { seleccion, cambiadas } = m.reconciliarSeleccion([elegida], antes.citables, r.datos.citables);
  assert.deepEqual({ seleccion, cambiadas }, { seleccion: [], cambiadas: [elegida] });
});

test('lectura · una falla en el detalle o en la estructura se devuelve tal cual: no se arma un contexto a medias', async () => {
  const fuente = fuenteFalsa({ paginas: [deEntrenamiento] });
  fuente.vista = async () => ({ ok: false, tipo: 'RED' });
  const r = await m.cargarPaginaDeCitables(fuente, undefined, new Map());
  assert.deepEqual(r, { ok: false, tipo: 'RED' });
});

// ─── 3. Tope de 20 citas ────────────────────────────────────────────────────────────────────────

test('tope · la cita 21 no se marca y se avisa; desmarcar siempre se puede; el envío también se valida', () => {
  let seleccion = [];
  for (let i = 0; i < m.MAXIMO_DE_CITAS; i++) seleccion = m.alternarSeleccion(seleccion, `r#${i}`).seleccion;
  assert.equal(seleccion.length, 20);
  const r = m.alternarSeleccion(seleccion, 'r#20');
  assert.equal(r.topeAlcanzado, true);
  assert.equal(r.seleccion.length, 20, 'la 21 no entra');
  const menos = m.alternarSeleccion(seleccion, 'r#0');
  assert.equal(menos.seleccion.length, 19, 'desmarcar siempre se puede');
  assert.equal(m.alternarSeleccion(menos.seleccion, 'r#20').seleccion.length, 20, 'y entonces se puede volver a marcar');
  assert.equal(m.excesoDeSeleccion(seleccion), null);
  assert.equal(m.excesoDeSeleccion([...seleccion, 'r#x', 'r#y']), 2);
});
