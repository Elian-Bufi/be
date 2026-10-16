/**
 * El Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5): lo que la pantalla decide sin dibujar nada.
 * - `apps/web/src/app/pro/directorio.ts`: «Tus asesorados», una persona por renglón, con las palabras de BE;
 * - `apps/web/src/app/pro/pendiente-en-una-fila.ts`: un pendiente en una fila, su último registro y a dónde lleva.
 * Las cantidades de las vistas y la partición de los tipos son del dominio (`packages/domain/src/cartera.test.ts`), y
 * también la lectura de una lista entera (`packages/domain/src/todas-las-paginas.test.ts`).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { armarElDirectorio, buscarEnElDirectorio, estadoEnUnaFrase } = await import('../apps/web/src/app/pro/directorio.ts');
const { ICONO_DEL_AREA_DE_CARTERA, ICONO_DEL_PENDIENTE, ICONO_DE_LA_VISTA_DE_PENDIENTES, rutaQueResuelve, textoDePendiente, ultimoRegistroDe } = await import('../apps/web/src/app/pro/pendiente-en-una-fila.ts');
const { diaConSuSemana, diaDelAnioEnCurso } = await import('../apps/web/src/lib/formato.ts');
const { COPY_VINCULO, ICONOS, TIPOS_DE_PENDIENTE, VISTAS_DE_PENDIENTES, estadoParaMostrar } = await import('../packages/domain/dist/index.js');

// ─── El directorio ───────────────────────────────────────────────────────────────────────────────

const YO = 'pro-1';
const AREA = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento', ANTROPOMETRIA: 'Antropometría' };
const FINALIDAD = { NUTRICION: 'ACOMPANAMIENTO_NUTRICIONAL', ENTRENAMIENTO: 'PLANIFICACION_DEL_ENTRENAMIENTO', ANTROPOMETRIA: 'EVALUACION_ANTROPOMETRICA' };
let serie = 0;
const vinculo = (asesorado, alcance, extra = {}) => ({
  relationshipId: `rel-${++serie}`,
  version: 'v1',
  professional: { identityId: YO, displayName: 'Lic. Sofía Paz (sintética)' },
  advisee: { identityId: `ase-${asesorado}`, displayName: `Asesorado · ${asesorado}` },
  scope: { code: alcance, label: AREA[alcance] },
  purpose: FINALIDAD[alcance],
  relationshipState: 'ACEPTADO',
  consentState: 'ACTIVE',
  accessMode: 'CONTEXTUAL',
  pausedBy: null,
  acceptedAt: '2026-09-01T12:00:00.000Z',
  ...extra,
});

test('una persona, un renglón: sus áreas con acceso van en el orden de BE, no en el de la lista', () => {
  const personas = armarElDirectorio([vinculo('a9be23', 'ANTROPOMETRIA'), vinculo('a9be23', 'ENTRENAMIENTO'), vinculo('c5c72c', 'NUTRICION'), vinculo('a9be23', 'NUTRICION')], YO);
  assert.deepEqual(
    personas.map((p) => [p.nombre, p.conAcceso.join(' · '), p.sinAcceso.length]),
    [
      ['Asesorado · a9be23', 'Nutrición · Entrenamiento · Antropometría', 0],
      ['Asesorado · c5c72c', 'Nutrición', 0],
    ],
    'las personas, en el orden en que llegan de la API',
  );
  assert.deepEqual(personas[0].vinculos.map((v) => `${v.area} · ${v.finalidad}`), ['Nutrición · Acompañamiento nutricional', 'Entrenamiento · Planificación del entrenamiento', 'Antropometría · Evaluación antropométrica']);
  assert.equal(personas[0].vinculos[0].desde, '2026-09-01T12:00:00.000Z', 'desde cuándo: el dato de cada vínculo no se pierde');
});

test('los vínculos donde la cuenta es la asesorada no son de este directorio', () => {
  const ajeno = { ...vinculo('zzz999', 'NUTRICION'), professional: { identityId: 'otro-pro', displayName: 'Otro profesional' }, advisee: { identityId: YO, displayName: 'Yo' } };
  const personas = armarElDirectorio([ajeno, vinculo('a9be23', 'NUTRICION')], YO);
  assert.deepEqual(personas.map((p) => p.nombre), ['Asesorado · a9be23']);
  assert.deepEqual(armarElDirectorio([ajeno], YO), [], 'una cuenta que solo es asesorada no tiene a nadie en su directorio');
});

test('un área sin acceso se dice con las palabras de BE, las mismas de `estadoParaMostrar`: seis estados, seis frases', () => {
  const casos = [
    [{ relationshipState: 'FINALIZADO' }, 'Finalizado'],
    [{ relationshipState: 'PAUSADO', pausedBy: 'ADVISEE' }, 'Pausado · sin acceso'],
    [{ consentState: 'REQUIRED', accessMode: 'BLOCKED' }, 'Vínculo activo · Acceso pendiente de autorización del asesorado'],
    [{ consentState: 'REVOKED', accessMode: 'BLOCKED' }, 'Consentimiento revocado · Acceso no disponible'],
    [{ consentState: 'ACTIVE', accessMode: 'BLOCKED' }, 'Vínculo activo · Acceso no disponible'],
  ];
  for (const [extra, frase] of casos) {
    const [persona] = armarElDirectorio([vinculo('a9be23', 'ENTRENAMIENTO', extra), vinculo('a9be23', 'NUTRICION')], YO);
    assert.deepEqual(persona.conAcceso, ['Nutrición'], frase);
    assert.deepEqual(persona.sinAcceso, [{ area: 'Entrenamiento', estado: frase }]);
  }
  // El sexto estado es el del acceso activo: el área se nombra sola.
  const [conAcceso] = armarElDirectorio([vinculo('a9be23', 'ENTRENAMIENTO')], YO);
  assert.deepEqual([conAcceso.conAcceso, conAcceso.sinAcceso], [['Entrenamiento'], []]);
  assert.equal(conAcceso.vinculos[0].estado, COPY_VINCULO.accesoContextual);
});

test('«con acceso» es exactamente lo que BE llama «Activo · acceso contextual», en las 18 combinaciones de estados', () => {
  for (const relationshipState of ['ACEPTADO', 'PAUSADO', 'FINALIZADO']) {
    for (const consentState of ['REQUIRED', 'ACTIVE', 'REVOKED']) {
      for (const accessMode of ['BLOCKED', 'CONTEXTUAL']) {
        const v = vinculo('a9be23', 'NUTRICION', { relationshipState, consentState, accessMode });
        const [persona] = armarElDirectorio([v], YO);
        const deBe = estadoParaMostrar(v, 'PROFESSIONAL');
        const caso = `${relationshipState} ${consentState} ${accessMode}`;
        assert.equal(persona.vinculos[0].conAcceso, deBe.estado === COPY_VINCULO.accesoContextual, caso);
        assert.equal(persona.vinculos[0].estado, deBe.estado, caso);
        assert.equal(persona.vinculos[0].detalle, deBe.detalle, caso);
        assert.equal(persona.conAcceso.length + persona.sinAcceso.length, 1, caso);
      }
    }
  }
});

test('con varios vínculos en un área, el resumen dice uno: el que da acceso; si ninguno, el vigente antes que el pausado y este antes que el finalizado', () => {
  const viejo = { relationshipState: 'FINALIZADO', acceptedAt: '2026-03-01T12:00:00.000Z' };
  const [reanudado] = armarElDirectorio([vinculo('a9be23', 'NUTRICION', viejo), vinculo('a9be23', 'NUTRICION')], YO);
  assert.deepEqual([reanudado.conAcceso, reanudado.sinAcceso], [['Nutrición'], []], 'un vínculo terminado no tapa al que hoy da acceso');
  assert.deepEqual(reanudado.vinculos.map((v) => v.estado), ['Activo · acceso contextual', 'Finalizado'], 'el detalle los trae a los dos, el más nuevo primero');

  const [pausado] = armarElDirectorio([vinculo('a9be23', 'NUTRICION', viejo), vinculo('a9be23', 'NUTRICION', { relationshipState: 'PAUSADO', pausedBy: 'PROFESSIONAL' })], YO);
  assert.deepEqual(pausado.sinAcceso, [{ area: 'Nutrición', estado: 'Pausado · sin acceso' }]);

  const [dosTerminados] = armarElDirectorio([vinculo('a9be23', 'NUTRICION', viejo), vinculo('a9be23', 'NUTRICION', { relationshipState: 'FINALIZADO', acceptedAt: '2026-06-01T12:00:00.000Z' })], YO);
  assert.deepEqual(dosTerminados.sinAcceso, [{ area: 'Nutrición', estado: 'Finalizado' }], 'una sola vez, aunque haya dos');
  assert.equal(dosTerminados.vinculos.length, 2);
  assert.equal(estadoEnUnaFrase({ estado: 'Finalizado', detalle: null }), 'Finalizado');
});

test('se busca por la referencia: sin acentos ni signos, con todas las palabras; sin nada que buscar, están todas', () => {
  const personas = armarElDirectorio([vinculo('a9be23', 'NUTRICION'), vinculo('c5c72c', 'NUTRICION'), vinculo('16de3f', 'ENTRENAMIENTO')], YO);
  const nombres = (buscado) => buscarEnElDirectorio(personas, buscado).map((p) => p.nombre.slice(-6));
  assert.deepEqual(nombres(''), ['a9be23', 'c5c72c', '16de3f']);
  assert.deepEqual(nombres('   '), ['a9be23', 'c5c72c', '16de3f']);
  assert.deepEqual(nombres('e23'), ['a9be23']);
  assert.deepEqual(nombres('E23'), ['a9be23'], 'mayúsculas y minúsculas');
  assert.deepEqual(nombres('asesorado a9be23'), ['a9be23'], 'sin el punto del medio');
  assert.deepEqual(nombres('Asesorado · c5c'), ['c5c72c'], 'con el punto del medio');
  assert.deepEqual(nombres('c'), ['c5c72c'], 'una letra que también está en «asesorado» no trae a todos: «asesorado» no tiene «c»');
  assert.deepEqual(nombres('asesorado'), ['a9be23', 'c5c72c', '16de3f'], 'la palabra que comparten todas las referencias las trae a todas');
  assert.deepEqual(nombres('zzz'), []);
  assert.equal(personas.length, 3, 'buscar no cambia la lista');
});

// ─── Un pendiente en una fila ────────────────────────────────────────────────────────────────────

const HOY = '2026-10-11';
const dia = (f) => diaDelAnioEnCurso(f, HOY);
const pendiente = (kind, extra = {}) => ({
  advisee: { identityId: 'ase-a9be23', displayName: 'Asesorado · a9be23' },
  relationshipId: 'rel-1',
  domain: 'nutrition',
  kind,
  since: null,
  daysOverdue: null,
  daysUntil: null,
  lastActivityAt: null,
  activityCount: 0,
  open: { view: 'revisiones' },
  ...extra,
});

test('cada tipo de pendiente se dice con la frase de BE; la fecha, sin el año si es del año en curso', () => {
  assert.equal(textoDePendiente(pendiente('REVIEW_OVERDUE', { daysOverdue: 3, since: '2026-10-08' }), dia), 'Revisión vencida hace 3 días');
  assert.equal(textoDePendiente(pendiente('REVIEW_OVERDUE', { daysOverdue: 1 }), dia), 'Revisión vencida hace 1 día');
  assert.equal(textoDePendiente(pendiente('REVIEW_DUE_SOON', { daysUntil: 0 }), dia), 'Revisión hoy');
  assert.equal(textoDePendiente(pendiente('REVIEW_DUE_SOON', { daysUntil: 3 }), dia), 'Revisión en 3 días');
  assert.equal(textoDePendiente(pendiente('REVIEW_UNDATED', { since: '2026-09-12' }), dia), 'Revisión pendiente desde el 12 sept');
  assert.equal(textoDePendiente(pendiente('PLAN_DRAFT_PENDING', { since: '2026-10-11' }), dia), 'Plan en borrador desde el 11 oct');
  assert.equal(textoDePendiente(pendiente('PLAN_DRAFT_PENDING', { since: '2025-12-30' }), dia), 'Plan en borrador desde el 30 dic 2025', 'de otro año, con su año');
  assert.equal(textoDePendiente(pendiente('NO_ACTIVE_PLAN'), dia), 'Sin plan activo');
  assert.equal(textoDePendiente(pendiente('FORM_REQUEST_OPEN', { since: '2026-09-22' }), dia), 'Formulario sin responder desde el 22 sept');
  assert.equal(textoDePendiente(pendiente('ANTHRO_DRAFT_PENDING', { since: '2026-09-25' }), dia), 'Evaluación en preparación desde el 25 sept');
  assert.equal(textoDePendiente(pendiente('REVIEW_UNDATED'), dia), 'Revisión pendiente desde el —', 'sin la fecha, no se inventa una');
});

test('el último registro es el día en que ocurrió, en la zona de la respuesta; sin ninguno, se dice según lo que se miró', () => {
  const zona = 'America/Argentina/Buenos_Aires';
  // Las 01:30 UTC del 11 son las 22:30 del 10 en Buenos Aires: el día es el 10.
  assert.equal(ultimoRegistroDe({ lastActivityAt: '2026-10-11T01:30:00.000Z' }, { zona, conPeriodo: false, dia }), 'Último registro: 10 oct');
  assert.equal(ultimoRegistroDe({ lastActivityAt: '2026-10-11T03:30:00.000Z' }, { zona, conPeriodo: true, dia }), 'Último registro: 11 oct');
  assert.equal(ultimoRegistroDe({ lastActivityAt: null }, { zona, conPeriodo: true, dia }), 'Sin registros en el período');
  assert.equal(ultimoRegistroDe({ lastActivityAt: null }, { zona, conPeriodo: false, dia }), 'Sin registros todavía', 'sin período no se habla de un período');
});

test('«Abrir» lleva a la vista que resuelve el pendiente, la que dice la API', () => {
  assert.equal(rutaQueResuelve(pendiente('REVIEW_OVERDUE')), '/pro/advisees/nutrition?id=ase-a9be23&vista=revisiones');
  assert.equal(rutaQueResuelve(pendiente('PLAN_DRAFT_PENDING', { domain: 'training', open: { view: 'plan' } })), '/pro/advisees/training?id=ase-a9be23&vista=plan');
  assert.equal(rutaQueResuelve(pendiente('ANTHRO_DRAFT_PENDING', { domain: 'anthropometry', open: { view: 'preparacion' } })), '/pro/advisees/anthropometry?id=ase-a9be23&vista=preparacion');
  assert.equal(rutaQueResuelve(pendiente('FORM_REQUEST_OPEN', { open: { view: 'solicitudes' } })), '/pro/advisees/forms?id=ase-a9be23&vista=solicitudes', 'un formulario se resuelve en Información, sea del área que sea');
  assert.equal(rutaQueResuelve(pendiente('NO_ACTIVE_PLAN', { advisee: { identityId: 'a b/c', displayName: 'x' }, open: { view: 'plan' } })), '/pro/advisees/nutrition?id=a%20b%2Fc&vista=plan');
});

test('cada tipo, cada vista y cada área tienen su ícono, y todos existen en el catálogo', () => {
  assert.deepEqual(Object.keys(ICONO_DEL_PENDIENTE).sort(), [...TIPOS_DE_PENDIENTE].sort());
  assert.deepEqual(Object.keys(ICONO_DE_LA_VISTA_DE_PENDIENTES).sort(), [...VISTAS_DE_PENDIENTES].sort());
  const usados = [...Object.values(ICONO_DEL_PENDIENTE), ...Object.values(ICONO_DE_LA_VISTA_DE_PENDIENTES).filter(Boolean), ...Object.values(ICONO_DEL_AREA_DE_CARTERA)];
  assert.deepEqual(usados.filter((nombre) => !Object.hasOwn(ICONOS, nombre)), []);
  assert.equal(ICONO_DE_LA_VISTA_DE_PENDIENTES.TODO, null);
});

test('«hoy» se dice con su día de la semana y su año, sin pasar por la zona del navegador', () => {
  assert.equal(diaConSuSemana('2026-10-11'), 'domingo 11 oct 2026');
  assert.equal(diaConSuSemana('2026-09-28'), 'lunes 28 sept 2026');
  assert.equal(diaConSuSemana(''), '');
});
