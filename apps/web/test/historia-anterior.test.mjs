/**
 * WP-HISTORIA-ANTERIOR (DL-175) · TEST-HA-050 a 056 · «Historia anterior» en el website, sin React:
 *  - TEST-HA-050: la dirección (el área, el tramo, el enlace con la vuelta) y el área con que la abre la ficha;
 *  - TEST-HA-051: sin la autorización (el 404 de API-HIA-04, por la causa que sea), cómo pedírsela, sin un dato;
 *  - TEST-HA-052: las versiones de los planes, con sus fechas, de otro profesional y sin su nombre;
 *  - TEST-HA-053: lo registrado, por semana;
 *  - TEST-HA-054: las tomas, con su protocolo y lo calculado con su método;
 *  - TEST-HA-055: las decisiones de las revisiones (resultado, fundamento y próxima acción) y los tramos;
 *  - TEST-HA-056: la pantalla y la ficha, leyendo el código: solo lee, dice el aviso fijo, la ficha la ofrece en «Más» y
 *    nada de los gráficos se toca; los textos, sin las palabras prohibidas ni «%».
 *
 * Mutaciones verificadas: tratar el 403 como «sin autorización» (TEST-HA-051), contar una comida anulada (TEST-HA-053),
 * ordenar las versiones de la más vieja a la más nueva (TEST-HA-052) y ofrecer la entrada con un vínculo en pausa
 * (TEST-HA-050) ponen en rojo su prueba.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { COPY_HISTORIA_ANTERIOR as C, terminosProhibidosDeAntropometriaEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosEn } from '@be/domain';

const H = await import('../src/app/pro/advisees/previous-history/historia-anterior.ts');
const {
  AREAS_DE_LA_HISTORIA,
  RUTA_DE_LA_HISTORIA_ANTERIOR,
  areaParaAbrir,
  decisionesEnPantalla,
  estadoDeLaLectura,
  hrefDeLaHistoriaAnterior,
  leerArea,
  leerTramo,
  navegacionDelTramo,
  seccionesDeLaHistoria,
  semanasEnPantalla,
  sinAutorizacion,
  tomasEnPantalla,
  versionesEnPantalla,
} = H;

const WEB = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(join(WEB, ruta), 'utf8');
const PERSONA = '0b6f2c1e-1111-4a2b-8c3d-0000000000aa';
const dia = (f) => f.split('-').reverse().join('/');
const corto = (f) => f.slice(5).split('-').reverse().join('/');
const UNO = { kind: 'OTHER_PROFESSIONAL', ordinal: 1 };
const DOS = { kind: 'OTHER_PROFESSIONAL', ordinal: 2 };

const VERSION_1 = {
  planVersionId: '5e5e5e5e-0000-4000-8000-000000000001',
  author: UNO,
  number: 1,
  activatedAt: '2026-06-01T13:00:00.000Z',
  from: '2026-06-01',
  to: '2026-07-31',
  endReason: 'SUCCESSOR_ACTIVATED',
  inEffectAtYourStart: false,
  content: {
    kind: 'NUTRITION',
    dayTypes: [
      { dayTypeId: 'd2', label: 'Día de entrenamiento', order: 2, meals: [] },
      { dayTypeId: 'd1', label: 'Día habitual', order: 1, meals: [{ mealId: 'm2', label: 'Cena', order: 2, prescriptionMode: 'OPTIONS', options: [] }, { mealId: 'm1', label: 'Almuerzo', order: 1, prescriptionMode: 'OPTIONS', options: [] }] },
    ],
  },
};
const VERSION_2 = { ...VERSION_1, planVersionId: '5e5e5e5e-0000-4000-8000-000000000002', number: 2, activatedAt: '2026-08-01T13:00:00.000Z', from: '2026-08-01', to: null, endReason: null, inEffectAtYourStart: true };

const comida = (recordId, date, x = {}) => ({ kind: 'MEAL', recordId, author: UNO, planVersionId: VERSION_2.planVersionId, date, type: 'PLAN_OPTION', meal: 'Almuerzo', option: 'Opción 1', description: null, annulled: false, ...x });
const REGISTROS = [
  comida('7a000000-0000-4000-8000-000000000001', '2026-11-02'),
  comida('7a000000-0000-4000-8000-000000000002', '2026-11-04', { type: 'DIFFERENT', option: null, meal: 'Cena', description: 'Pizza con amigos' }),
  comida('7a000000-0000-4000-8000-000000000003', '2026-11-05', { annulled: true }),
  comida('7a000000-0000-4000-8000-000000000004', '2026-10-28'),
];

const historia = (x = {}) => ({
  area: 'NUTRICION',
  beforeYourStart: '2026-11-10',
  period: { from: '2026-08-12', to: '2026-11-09' },
  extent: { from: '2026-06-01', to: '2026-11-09' },
  otherProfessionals: 1,
  includes: ['PLANS', 'RECORDS', 'DECISIONS'],
  planVersions: [VERSION_1, VERSION_2],
  records: REGISTROS,
  measurements: [],
  decisions: [
    {
      reviewId: '9e000000-0000-4000-8000-000000000001',
      author: UNO,
      recordedAt: '2026-10-15T15:00:00.000Z',
      date: '2026-10-15',
      reviewedPeriod: { from: '2026-10-01', to: '2026-10-14' },
      result: 'ADJUST',
      rationale: 'Las cenas quedaron cortas para los días de entrenamiento.',
      nextAction: { description: 'Sumar una opción de cena con más proteína.', nextReviewAt: '2026-11-01' },
    },
  ],
  ...x,
});

const ok = (data) => ({ ok: true, datos: { data } });
const api = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });

test('TEST-HA-050 · la dirección: el área, el tramo y el enlace con la vuelta; la ficha la abre en la primera área aceptada', () => {
  assert.equal(leerArea('ENTRENAMIENTO'), 'ENTRENAMIENTO');
  assert.equal(leerArea('OTRA'), 'NUTRICION');
  assert.equal(leerArea(null), 'NUTRICION');
  assert.deepEqual(leerTramo(new URLSearchParams('desde=2026-08-01&hasta=2026-10-29')), { desde: '2026-08-01', hasta: '2026-10-29' });
  // Las dos fechas juntas, válidas y en orden; si no, el tramo por omisión de la API.
  assert.equal(leerTramo(new URLSearchParams('desde=2026-08-01')), null);
  assert.equal(leerTramo(new URLSearchParams('desde=2026-02-30&hasta=2026-03-10')), null);
  assert.equal(leerTramo(new URLSearchParams('desde=2026-10-29&hasta=2026-08-01')), null);
  assert.equal(hrefDeLaHistoriaAnterior(PERSONA, 'NUTRICION'), `${RUTA_DE_LA_HISTORIA_ANTERIOR}?id=${PERSONA}&area=NUTRICION`);
  assert.equal(
    hrefDeLaHistoriaAnterior(PERSONA, 'ANTROPOMETRIA', { desde: '2026-05-01', hasta: '2026-07-29' }, 'vista=linea&p=30'),
    `/pro/advisees/previous-history?id=${PERSONA}&area=ANTROPOMETRIA&desde=2026-05-01&hasta=2026-07-29&volver=vista%3Dlinea%26p%3D30`,
  );
  assert.deepEqual(AREAS_DE_LA_HISTORIA.map((a) => [a.clave, a.texto, a.icono]), [
    ['NUTRICION', 'Nutrición', 'nutricion'],
    ['ENTRENAMIENTO', 'Entrenamiento', 'entrenamiento'],
    ['ANTROPOMETRIA', 'Antropometría', 'antropometria'],
  ]);
  const v = (code, relationshipState) => ({ scope: { code }, relationshipState });
  assert.equal(areaParaAbrir([v('ANTROPOMETRIA', 'ACEPTADO'), v('NUTRICION', 'ACEPTADO')]), 'NUTRICION');
  assert.equal(areaParaAbrir([v('NUTRICION', 'PAUSADO'), v('ENTRENAMIENTO', 'ACEPTADO')]), 'ENTRENAMIENTO');
  assert.equal(areaParaAbrir([v('NUTRICION', 'PAUSADO'), v('ENTRENAMIENTO', 'FINALIZADO')]), null);
  assert.equal(areaParaAbrir([]), null);
});

test('TEST-HA-051 · sin la autorización: el 404, por la causa que sea, dice cómo pedírsela, sin un dato ni un número', () => {
  assert.deepEqual(estadoDeLaLectura(null), { tipo: 'cargando' });
  assert.equal(estadoDeLaLectura(ok(historia())).tipo, 'listo');
  assert.deepEqual(estadoDeLaLectura(api(404, 'RESOURCE_NOT_FOUND')), { tipo: 'sin-autorizacion' });
  // Lo demás es una falla, con «Reintentar»: ni el 403 ni el 400 se confunden con la falta de autorización.
  assert.deepEqual(estadoDeLaLectura(api(403, 'ACTION_FORBIDDEN')), { tipo: 'error' });
  assert.deepEqual(estadoDeLaLectura(api(400, 'INVALID_REQUEST')), { tipo: 'error' });
  assert.deepEqual(estadoDeLaLectura({ ok: false, tipo: 'RED' }), { tipo: 'error' });
  for (const area of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']) {
    const s = sinAutorizacion(area);
    assert.deepEqual(Object.keys(s), ['titulo', 'cuerpo', 'sinAcceso']);
    // Un condicional: no afirma que haya habido otro profesional ni que haya datos.
    assert.match(s.cuerpo, /^Si la persona tuvo antes otro profesional de /);
    assert.match(s.cuerpo, /«Quién ve qué»/);
    for (const t of Object.values(s)) assert.doesNotMatch(t, /\d/, t);
  }
});

test('TEST-HA-052 · las versiones de los planes: de la más nueva a la más vieja, con sus fechas, «De otro profesional» y sin nombre', () => {
  const [v2, v1] = versionesEnPantalla(historia(), dia);
  assert.deepEqual(v2, { id: VERSION_2.planVersionId, titulo: 'Versión 2', autor: 'De otro profesional', vigencia: 'Desde el 01/08/2026', corte: C.seguiaVigente, contenido: ['Día habitual: Almuerzo, Cena', 'Día de entrenamiento'] });
  assert.deepEqual(v1, { id: VERSION_1.planVersionId, titulo: 'Versión 1', autor: 'De otro profesional', vigencia: 'Del 01/06/2026 al 31/07/2026', corte: 'La reemplazó una versión nueva.', contenido: ['Día habitual: Almuerzo, Cena', 'Día de entrenamiento'] });
  // Con dos profesionales antes, el número dice cuál: el 1.º es el que empezó antes. Nunca un nombre.
  const dos = versionesEnPantalla(historia({ otherProfessionals: 2, planVersions: [{ ...VERSION_1, author: DOS }] }), dia);
  assert.equal(dos[0].autor, 'De otro profesional (2.º)');
  // Entrenamiento: cada bloque con sus sesiones.
  const entrenamiento = versionesEnPantalla(
    historia({ planVersions: [{ ...VERSION_1, content: { kind: 'TRAINING', blocks: [{ blockId: 'b1', label: 'Bloque de base', order: 1, purpose: null, microcycles: [], sessions: [{ sessionId: 's2', label: 'Piernas', order: 2, instructions: null, prescriptions: [] }, { sessionId: 's1', label: 'Empuje', order: 1, instructions: null, prescriptions: [] }] }] } }] }),
    dia,
  );
  assert.deepEqual(entrenamiento[0].contenido, ['Bloque de base: Empuje, Piernas']);
});

test('TEST-HA-053 · lo registrado, por semana de lunes a domingo, de la más nueva a la más vieja; una comida anulada no cuenta', () => {
  const semanas = semanasEnPantalla(historia(), dia, corto);
  assert.deepEqual(semanas.map((s) => [s.titulo, s.cuenta]), [
    ['Semana del 02/11 al 08/11', '2 comidas registradas'],
    ['Semana del 26/10 al 01/11', '1 comida registrada'],
  ]);
  assert.deepEqual(
    semanas[0].registros.map((r) => [r.fecha, r.texto, r.marcas, r.autor]),
    [
      ['02/11/2026', 'Opción del plan: Almuerzo · Opción 1', [], 'De otro profesional'],
      ['04/11/2026', 'Comió algo diferente (Cena): Pizza con amigos', [], 'De otro profesional'],
      ['05/11/2026', 'Opción del plan: Almuerzo · Opción 1', ['Anulado'], 'De otro profesional'],
    ],
  );
  // Entrenamiento: la sesión con su condición registrada y cuántos ejercicios; la corregida, marcada.
  const sesion = { kind: 'SESSION', recordId: '7b000000-0000-4000-8000-000000000001', author: UNO, planVersionId: VERSION_1.planVersionId, date: '2026-07-07', session: 'Empuje', condition: 'COMPLETED_WITH_DEVIATION', corrected: true, exercises: 5 };
  const [s] = semanasEnPantalla(historia({ records: [sesion, { ...sesion, recordId: '7b000000-0000-4000-8000-000000000002', date: '2026-07-09', condition: 'COMPLETED', corrected: false, exercises: 1 }] }), dia, corto);
  assert.equal(s.cuenta, '2 sesiones registradas');
  assert.deepEqual(s.registros.map((r) => [r.texto, r.marcas]), [
    ['Empuje · Realizada con desvío · 5 ejercicios', ['Corregida después']],
    ['Empuje · Realizada · 1 ejercicio', []],
  ]);
});

test('TEST-HA-054 · las tomas: cada medición con su valor y unidad, el protocolo una vez y lo calculado con su método', () => {
  const toma = {
    evaluationId: '8e000000-0000-4000-8000-000000000001',
    author: UNO,
    takenAt: '2026-09-10T14:00:00.000Z',
    date: '2026-09-10',
    measurements: [
      { metric: 'peso', magnitude: { value: 72.5, unit: 'kg' }, protocolName: 'ISAK 2', origin: 'OBSERVED', corrected: false },
      { metric: 'perimetro-cintura', magnitude: { value: 81, unit: 'cm' }, protocolName: 'ISAK 2', origin: 'OBSERVED', corrected: true },
      { metric: 'talla', magnitude: null, protocolName: 'ISAK 2', origin: 'OBSERVED', corrected: false },
    ],
    derivedResults: [{ metric: 'imc', magnitude: { value: 23.1, unit: 'kg/m²' }, methodName: 'IMC (Quetelet)' }],
  };
  const vieja = { ...toma, evaluationId: '8e000000-0000-4000-8000-000000000002', takenAt: '2026-06-10T14:00:00.000Z', date: '2026-06-10', derivedResults: [] };
  const tomas = tomasEnPantalla(historia({ area: 'ANTROPOMETRIA', includes: ['MEASUREMENTS'], measurements: [vieja, toma] }), dia);
  assert.deepEqual(tomas.map((t) => t.titulo), ['10/09/2026', '10/06/2026']);
  assert.deepEqual(tomas[0], {
    id: toma.evaluationId,
    titulo: '10/09/2026',
    autor: 'De otro profesional',
    protocolos: ['Protocolo: ISAK 2'],
    mediciones: ['Peso: 72,5 kg', 'Perímetro de cintura: 81 cm (corregida después)', `Talla: ${C.sinValor}`],
    calculos: ['Índice de masa corporal: 23,1 kg/m² · Método: IMC (Quetelet)'],
  });
});

test('TEST-HA-055 · las decisiones de las revisiones y los tramos: resultado, fundamento y próxima acción; el tramo de antes y el de después', () => {
  assert.deepEqual(decisionesEnPantalla(historia(), dia), [
    {
      id: '9e000000-0000-4000-8000-000000000001',
      titulo: '15/10/2026',
      autor: 'De otro profesional',
      periodo: 'Período revisado: del 01/10/2026 al 14/10/2026',
      resultado: 'Ajustar',
      fundamento: 'Las cenas quedaron cortas para los días de entrenamiento.',
      proximaAccion: 'Sumar una opción de cena con más proteína.',
      proximaRevision: 'Próxima revisión: 01/11/2026',
    },
  ]);
  // Las secciones, en el orden de BE, con su cuenta y su texto de vacío.
  assert.deepEqual(seccionesDeLaHistoria(historia()).map((s) => [s.parte, s.titulo, s.cuantas]), [
    ['PLANS', 'Planes', 2],
    ['RECORDS', 'Lo registrado', 4],
    ['DECISIONS', 'Decisiones de las revisiones', 1],
  ]);
  const nav = navegacionDelTramo(historia(), dia);
  assert.equal(nav.tramo, 'Del 12/08/2026 al 09/11/2026');
  assert.equal(nav.extension, 'La historia anterior va del 01/06/2026 al 09/11/2026.');
  assert.deepEqual(nav.anterior, { desde: '2026-05-14', hasta: '2026-08-11' });
  assert.equal(nav.siguiente, null);
  // Sin nada antes, no hay tramos a los costados.
  const vacia = navegacionDelTramo(historia({ extent: null }), dia);
  assert.deepEqual([vacia.extension, vacia.anterior, vacia.siguiente], [null, null, null]);
});

test('TEST-HA-056 · la pantalla y la ficha: solo lee, dice el aviso fijo, se ofrece en «Más» y no toca los gráficos', () => {
  const pantalla = leer('src/app/pro/advisees/previous-history/historia-anterior-en-pantalla.tsx');
  // Una sola lectura (API-HIA-04) y ninguna escritura.
  assert.deepEqual([...pantalla.matchAll(/api\.(\w+)\(/g)].map((m) => m[1]), ['historiaAnterior']);
  assert.match(pantalla, /<strong>\{C\.aviso\}<\/strong>/);
  assert.match(pantalla, /if \(estado\.tipo === 'sin-autorizacion'\) return <ComoPedirla area=\{area\} \/>;/);
  assert.doesNotMatch(pantalla, /<button|onClick=\{\(\) => api/);
  // Los colores salen de las clases de siempre: nada escrito a mano.
  assert.doesNotMatch(pantalla, /#[0-9a-f]{3,6}\b|style=\{/i);
  const pagina = leer('src/app/pro/advisees/previous-history/page.tsx');
  assert.match(pagina, /<PorAsesorado>/);
  assert.match(pagina, /<Suspense fallback=\{null\}>/);
  // La ficha la ofrece en «Más», con el área aceptada de quien lee y la vuelta a donde estaba.
  const ficha = leer('src/app/pro/advisees/workspace.tsx');
  assert.match(ficha, /areaParaAbrir\(encabezado\.vinculos\)/);
  assert.match(ficha, /hrefDeLaHistoriaAnterior\(id, areaDeLaHistoria, null, retorno\)/);
  // Nada de los gráficos, de «Analizar» ni de la cinta la usa (la integración es la segunda etapa).
  const archivos = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivos(join(dir, n)) : [join(dir, n)]));
  for (const r of [...archivos(join(WEB, 'src/app/pro/advisees/graficos')), join(WEB, 'src/app/pro/advisees/seguimiento/analizar.tsx')]) {
    assert.doesNotMatch(readFileSync(r, 'utf8'), /previous-history|historiaAnterior|HISTORIA_ANTERIOR/, r);
  }
  assert.ok(existsSync(join(WEB, 'src/app/pro/advisees/previous-history/historia-anterior.ts')));
});

test('TEST-HA-056 · los textos que arma la pantalla: sin las palabras prohibidas, sin «asesorado» ni «%»', () => {
  const h = historia();
  const textos = [
    ...versionesEnPantalla(h, dia).flatMap((v) => [v.titulo, v.autor, v.vigencia, v.corte ?? '', ...v.contenido]),
    ...semanasEnPantalla(h, dia, corto).flatMap((s) => [s.titulo, s.cuenta, ...s.registros.flatMap((r) => [r.texto, r.autor, ...r.marcas])]),
    ...decisionesEnPantalla(h, dia).flatMap((d) => [d.periodo, d.resultado, d.proximaRevision ?? '']),
    ...seccionesDeLaHistoria(h).flatMap((s) => [s.titulo, s.vacio]),
    ...['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'].flatMap((a) => Object.values(sinAutorizacion(a))),
    navegacionDelTramo(h, dia).tramo,
    C.aviso,
    C.pistaEnLaFicha,
  ].filter(Boolean);
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
    assert.doesNotMatch(t, /asesorad|cumplimiento|adherencia|racha|puntaje|%/i, t);
  }
});
