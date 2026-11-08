/**
 * WP-TABLERO-ALTA-GAMA TB-06 y TB-11 (DL-163 D-4) · la mesa del Espacio profesional, sin React (`src/app/pro/mesa.ts`):
 *  1. TEST-TAG-008 · el orden de «Te toca a vos» sale de DL-107: las personas, por su pendiente más urgente según
 *     `compararPendientes`; los renglones de cada una, en ese orden; «Por pendiente», exactamente el orden de la API; y
 *     se agrupa por `identityId`, nunca por nombre. Una prueba de propiedad con una semilla fija.
 *  2. Los dos carriles parten los siete tipos de la cartera, y «Esperan respuesta» va por antigüedad.
 *  3. El saludo: la primera palabra del nombre propio que no es un título, o a secas.
 *  4. TEST-TAG-031 · los textos nuevos pasan la prueba de términos de la cartera.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { COPY_MESA, delCarril, loQueEspera, personasPorArea, porPersona, primerNombre, saludo, TIPOS_QUE_ESPERAN, TIPOS_QUE_TE_TOCAN } = await import('../src/app/pro/mesa.ts');
const { compararPendientes, ordenarPendientes, terminosProhibidosDeCarteraEn, TIPOS_DE_PENDIENTE } = await import('@be/domain');

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ordenable = (p) => ({ kind: p.kind, since: p.since, daysOverdue: p.daysOverdue, adviseeId: p.advisee.identityId });

/** Un generador con semilla: la misma corrida da los mismos casos. */
function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Una fila de la cartera; `nombre` se repite a propósito entre personas distintas. */
function fila(persona, kind, domain, { since = null, daysOverdue = null, nombre = `Persona ${persona}` } = {}) {
  return { kind, domain, since, daysOverdue, daysUntil: null, lastActivityAt: null, relationshipId: ID(900 + persona), open: { view: 'revisiones' }, advisee: { identityId: ID(persona), displayName: nombre } };
}

/** Una cartera al azar, ordenada como la ordena la API (DL-107). */
function carteraAlAzar(r) {
  const filas = [];
  const personas = 2 + Math.floor(r() * 7);
  for (let p = 1; p <= personas; p++) {
    for (const domain of ['nutrition', 'training', 'anthropometry']) {
      if (r() < 0.4) continue;
      const kind = TIPOS_DE_PENDIENTE[Math.floor(r() * TIPOS_DE_PENDIENTE.length)];
      const vencida = kind === 'REVIEW_OVERDUE';
      const conFecha = !['NO_ACTIVE_PLAN', 'REVIEW_DUE_SOON'].includes(kind) && r() < 0.8;
      filas.push(fila(p, kind, domain, { daysOverdue: vencida ? 1 + Math.floor(r() * 30) : null, since: conFecha ? `2026-10-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}` : null, nombre: r() < 0.3 ? 'Ana Gómez' : `Persona ${p}` }));
    }
  }
  return ordenarPendientes(filas.map((f) => ({ ...f, adviseeId: f.advisee.identityId }))).map(({ adviseeId, ...f }) => f);
}

test('TEST-TAG-008 · las personas van por su pendiente más urgente, y los renglones de cada una en el orden de DL-107', () => {
  const ana = fila(1, 'PLAN_DRAFT_PENDING', 'nutrition', { since: '2026-10-01' });
  const anaVencida = fila(1, 'REVIEW_OVERDUE', 'training', { daysOverdue: 2, since: '2026-10-28' });
  const beto = fila(2, 'REVIEW_OVERDUE', 'nutrition', { daysOverdue: 9, since: '2026-10-21' });
  const caro = fila(3, 'ANTHRO_DRAFT_PENDING', 'anthropometry', { since: '2026-09-01' });
  // El orden de la API: Beto (vencida hace 9), Ana (vencida hace 2), el borrador de Ana y la toma de Caro.
  const personas = porPersona([beto, anaVencida, ana, caro]);
  assert.deepEqual(personas.map((p) => p.identityId), [ID(2), ID(1), ID(3)]);
  assert.deepEqual(personas[1].pendientes, [anaVencida, ana]);
});

test('TEST-TAG-008 · se agrupa por identityId: dos personas con el mismo nombre son dos grupos', () => {
  const una = fila(1, 'REVIEW_OVERDUE', 'nutrition', { daysOverdue: 3, nombre: 'Ana Gómez' });
  const otra = fila(2, 'NO_ACTIVE_PLAN', 'training', { nombre: 'Ana Gómez' });
  const personas = porPersona([una, otra]);
  assert.equal(personas.length, 2);
  assert.deepEqual(personas.map((p) => p.pendientes.length), [1, 1]);
});

test('TEST-TAG-008 · propiedad: el agrupado no pierde ni suma filas, y respeta compararPendientes; «Por pendiente» es el orden de la API', () => {
  const r = azar(20261106);
  for (let caso = 0; caso < 300; caso++) {
    const api = carteraAlAzar(r);
    const teTocan = delCarril(api, TIPOS_QUE_TE_TOCAN);
    // «Por pendiente»: la misma secuencia que llegó, sin las filas del otro carril.
    assert.deepEqual(teTocan, api.filter((p) => TIPOS_QUE_TE_TOCAN.includes(p.kind)));
    const personas = porPersona(teTocan);
    const aplanadas = personas.flatMap((p) => p.pendientes);
    assert.equal(aplanadas.length, teTocan.length);
    assert.deepEqual(new Set(aplanadas), new Set(teTocan));
    for (const p of personas) {
      assert.ok(p.pendientes.every((f) => f.advisee.identityId === p.identityId));
      for (let i = 1; i < p.pendientes.length; i++) assert.ok(compararPendientes(ordenable(p.pendientes[i - 1]), ordenable(p.pendientes[i])) <= 0);
    }
    for (let i = 1; i < personas.length; i++) assert.ok(compararPendientes(ordenable(personas[i - 1].pendientes[0]), ordenable(personas[i].pendientes[0])) <= 0);
    assert.equal(new Set(personas.map((p) => p.identityId)).size, personas.length);
    // El orden no depende del orden de llegada: con las filas mezcladas, las mismas personas en el mismo orden.
    const mezcladas = teTocan.map((f) => [r(), f]).sort((a, b) => a[0] - b[0]).map(([, f]) => f);
    assert.deepEqual(porPersona(mezcladas).map((p) => p.identityId), personas.map((p) => p.identityId));
  }
});

test('los dos carriles parten los siete tipos: revisiones, planes y tomas te tocan; los formularios esperan', () => {
  assert.deepEqual([...TIPOS_QUE_TE_TOCAN, ...TIPOS_QUE_ESPERAN].sort(), [...TIPOS_DE_PENDIENTE].sort());
  assert.equal(TIPOS_QUE_TE_TOCAN.filter((t) => TIPOS_QUE_ESPERAN.includes(t)).length, 0);
  assert.deepEqual(TIPOS_QUE_ESPERAN, ['FORM_REQUEST_OPEN']);
});

test('«Esperan respuesta»: formularios, solicitudes sin responder e invitaciones sin usar, lo más antiguo primero', () => {
  const formulario = { ...fila(4, 'FORM_REQUEST_OPEN', 'nutrition', { since: '2026-10-20' }), open: { view: 'solicitudes' } };
  const revision = fila(5, 'REVIEW_OVERDUE', 'nutrition', { daysOverdue: 1, since: '2026-10-01' });
  const solicitudes = [
    { relationshipRequestId: 'S1', createdAt: '2026-10-25T15:00:00.000Z', state: 'PENDIENTE' },
    { relationshipRequestId: 'S2', createdAt: '2026-10-02T15:00:00.000Z', state: 'ACEPTADA' },
  ];
  const invitaciones = [
    { invitationId: 'I1', createdAt: '2026-10-18T15:00:00.000Z', state: 'PENDING' },
    { invitationId: 'I2', createdAt: '2026-10-10T15:00:00.000Z', state: 'EXPIRED' },
  ];
  const espera = loQueEspera([revision, formulario], solicitudes, invitaciones, 'America/Argentina/Buenos_Aires');
  assert.deepEqual(espera.map((e) => e.clave), ['invitacion|I1', `formulario|nutrition|${ID(4)}`, 'solicitud|S1']);
  assert.deepEqual(espera.map((e) => e.desde), ['2026-10-18', '2026-10-20', '2026-10-25']);
});

test('el saludo usa la primera palabra que no es un título, y va a secas sin nombre o con los nombres ocultos', () => {
  assert.equal(primerNombre('Lic. Sofía Paz'), 'Sofía');
  assert.equal(primerNombre('Dra Ana María López'), 'Ana');
  assert.equal(primerNombre('Prof. Lic. Martín Acosta'), 'Martín');
  assert.equal(primerNombre('🙂 Juan'), 'Juan');
  assert.equal(primerNombre('Lic.'), null);
  assert.equal(primerNombre(''), null);
  assert.equal(primerNombre(null), null);
  assert.equal(saludo(9, 'Lic. Sofía Paz', false), 'Buen día, Sofía');
  assert.equal(saludo(15, 'Lic. Sofía Paz', false), 'Buenas tardes, Sofía');
  assert.equal(saludo(23, 'Lic. Sofía Paz', false), 'Buenas noches, Sofía');
  assert.equal(saludo(9, 'Lic. Sofía Paz', true), 'Buen día');
  assert.equal(saludo(4, null, false), 'Buenas noches');
});

test('«Personas» se desglosa por área con acceso, sin contar actividad', () => {
  assert.deepEqual(personasPorArea([{ conAcceso: ['Nutrición', 'Antropometría'] }, { conAcceso: ['Nutrición'] }, { conAcceso: [] }]), [
    { area: 'Nutrición', personas: 2 },
    { area: 'Antropometría', personas: 1 },
  ]);
});

test('TEST-TAG-031 · los textos de la mesa pasan la prueba de términos de la cartera', () => {
  const textos = Object.values(COPY_MESA).map((v) => (typeof v === 'function' ? v('Nutrición', '3 nov') : v));
  textos.push(COPY_MESA.cifra(12, false), COPY_MESA.pendientesDe(1), COPY_MESA.pendientesDe(3));
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeCarteraEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
});
