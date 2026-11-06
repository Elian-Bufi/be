/**
 * El Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5): lo que la pantalla decide sin dibujar nada.
 * - `apps/web/src/app/pro/directorio.ts`: «Tus asesorados», una persona por renglón, con las palabras de BE;
 * - `apps/web/src/app/pro/pendiente-en-una-fila.ts`: un pendiente en una fila, su último registro y a dónde lleva.
 * Las cantidades de las vistas y la partición de los tipos son del dominio (`packages/domain/src/cartera.test.ts`), y
 * también la lectura de una lista entera (`packages/domain/src/todas-las-paginas.test.ts`).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { areaUnicaDelProfesional, armarElDirectorio, buscarEnElDirectorio, estadoEnUnaFrase } = await import('../apps/web/src/app/pro/directorio.ts');
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

test('DL-146: el área viene elegida solo si todos los vínculos del profesional son de una misma área', () => {
  assert.equal(areaUnicaDelProfesional([], YO), null, 'sin vínculos, ninguna');
  assert.equal(areaUnicaDelProfesional([vinculo('a1', 'ENTRENAMIENTO'), vinculo('a2', 'ENTRENAMIENTO', { relationshipState: 'FINALIZADO' })], YO), 'ENTRENAMIENTO', 'de cualquier estado');
  assert.equal(areaUnicaDelProfesional([vinculo('a1', 'NUTRICION'), vinculo('a1', 'ANTROPOMETRIA')], YO), null, 'dos áreas: lo decide el profesional');
  const deOtro = { ...vinculo('a3', 'NUTRICION'), professional: { identityId: 'otro', displayName: 'Otro' } };
  assert.equal(areaUnicaDelProfesional([vinculo('a1', 'ENTRENAMIENTO'), deOtro], YO), 'ENTRENAMIENTO', 'los vínculos de otro profesional no cuentan');
});

test('«con acceso» es exactamente lo que BE llama «Activo · con acceso», en las 18 combinaciones de estados', () => {
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
  assert.deepEqual(reanudado.vinculos.map((v) => v.estado), ['Activo · con acceso', 'Finalizado'], 'el detalle los trae a los dos, el más nuevo primero');

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

test('con un nombre visible (DL-040, 2026-10-15) se busca por el nombre o por la referencia corta, sin acentos', () => {
  const conNombre = (asesorado, nombre, alcance) => vinculo(asesorado, alcance, { advisee: { identityId: `ase-${asesorado}`, displayName: nombre } });
  const personas = armarElDirectorio([conNombre('a9be23', 'Martina Gómez', 'NUTRICION'), conNombre('c5c72c', 'Lucas Fernández', 'NUTRICION'), vinculo('16de3f', 'ENTRENAMIENTO')], YO);
  assert.deepEqual(
    personas.map((p) => [p.nombre, p.referencia]),
    [
      ['Martina Gómez', 'a9be23'],
      ['Lucas Fernández', 'c5c72c'],
      ['Asesorado · 16de3f', '16de3f'],
    ],
  );
  const quienes = (buscado) => buscarEnElDirectorio(personas, buscado).map((p) => p.referencia);
  assert.deepEqual(quienes('gomez'), ['a9be23'], 'sin el acento');
  assert.deepEqual(quienes('Martina G'), ['a9be23'], 'con todas las palabras');
  assert.deepEqual(quienes('c5c7'), ['c5c72c'], 'por la referencia, aunque tenga nombre');
  assert.deepEqual(quienes('asesorado'), ['16de3f'], 'la referencia neutral, solo en quien no tiene un nombre a la vista');
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
  assert.equal(textoDePendiente(pendiente('ANTHRO_DRAFT_PENDING', { since: '2026-09-25' }), dia), 'Toma en preparación desde el 25 sept');
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

// ─── La acción principal de la ficha (bloque 5 del encargo de consolidación) ─────────────────────────────────────

const { accionDeLaFicha, rutaDeLaAccion } = await import('../apps/web/src/app/pro/advisees/accion-de-la-ficha.ts');

test('la acción principal de la ficha: revisión de la semana, después el borrador, después empezar; con todo al día, ninguna', () => {
  const HOY = '2026-10-19';
  const plan = (nextReviewAt = null) => ({ planVersionId: 'p', activatedAt: '2026-09-01T12:00:00.000Z', nextReviewAt });
  const resumen = (cambios = {}) => ({ activePlan: null, objective: null, lastReview: null, draftPlan: null, registeredExecutions: 0, lastExecutionAt: null, registeredIntakes: 0, lastIntakeAt: null, ...cambios });
  const legible = (summary) => ({ available: true, relationshipId: 'r', summary });
  const ajeno = { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' };
  const dominios = (nutrition, training) => ({ nutrition, training, anthropometry: ajeno });

  // Persona nueva, solo Entrenamiento: empezar, sin decir el área.
  assert.deepEqual(accionDeLaFicha(dominios(ajeno, legible(resumen())), HOY), { tipo: 'empezar', area: 'ENTRENAMIENTO', texto: 'Empezar el plan', vista: 'plan', extra: '' });
  // Con borrador: seguirlo.
  assert.equal(accionDeLaFicha(dominios(ajeno, legible(resumen({ draftPlan: { planVersionId: 'b', recordedAt: '2026-10-18T12:00:00.000Z', fromReviewId: null } }))), HOY).tipo, 'borrador');
  // Plan vigente al día: ninguna.
  assert.equal(accionDeLaFicha(dominios(ajeno, legible(resumen({ activePlan: plan('2026-11-30') }))), HOY), null);
  // La revisión de la semana gana al borrador y a empezar; con dos áreas, la más cercana, con su nombre.
  const dos = dominios(legible(resumen({ activePlan: plan('2026-10-24') })), legible(resumen({ activePlan: plan('2026-10-17'), draftPlan: { planVersionId: 'b', recordedAt: '2026-10-18T12:00:00.000Z', fromReviewId: null } })));
  assert.deepEqual(accionDeLaFicha(dos, HOY), { tipo: 'revisar', area: 'ENTRENAMIENTO', texto: 'Preparar la revisión de Entrenamiento', vista: 'revisiones', extra: '&preparar=1' });
  // Sin revisión cercana y con dos áreas, el borrador dice de qué área es.
  assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan() })), legible(resumen({ draftPlan: { planVersionId: 'b', recordedAt: '2026-10-18T12:00:00.000Z', fromReviewId: null } }))), HOY).texto, 'Seguir el borrador de Entrenamiento');
  // Lo que el profesional no puede leer no cuenta.
  assert.equal(accionDeLaFicha(dominios(ajeno, ajeno), HOY), null);
  // Un área legible sin ningún dato llega con el resumen en null: es un área sin plan, y la acción es empezarlo.
  assert.deepEqual(accionDeLaFicha(dominios(legible(null), ajeno), HOY), { tipo: 'empezar', area: 'NUTRICION', texto: 'Empezar el plan', vista: 'plan', extra: '' });
  // La dirección: el área, la vista y, para la revisión, el formulario abierto (`preparar=1`); el id va codificado.
  assert.equal(rutaDeLaAccion(accionDeLaFicha(dos, HOY), 'a b'), '/pro/advisees/training?id=a%20b&vista=revisiones&preparar=1');
  assert.equal(rutaDeLaAccion(accionDeLaFicha(dominios(legible(resumen()), ajeno), HOY), 'x'), '/pro/advisees/nutrition?id=x&vista=plan');
});

// ─── La evaluación que el objetivo propone de entrada (bloque 5) ───────────────────────────────────────────────────

const { evaluacionMasReciente } = await import('../apps/web/src/app/pro/advisees/evaluacion-reciente.ts');

test('el objetivo propone la evaluación más reciente; sin evaluaciones, ninguna', () => {
  const evs = [
    { evaluationId: 'vieja', occurredAt: '2026-09-01T10:00:00.000Z' },
    { evaluationId: 'nueva', occurredAt: '2026-10-19T09:30:00.000Z' },
    { evaluationId: 'media', occurredAt: '2026-10-01T10:00:00.000Z' },
  ];
  assert.equal(evaluacionMasReciente(evs), 'nueva');
  assert.equal(evaluacionMasReciente([]), '');
});
