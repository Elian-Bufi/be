/**
 * El Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5): lo que la pantalla decide sin dibujar nada.
 * - `apps/web/src/app/pro/directorio.ts`: «Tus asesorados», una persona por renglón, con las palabras de BE;
 * - `apps/web/src/app/pro/pendiente-en-una-fila.ts`: un pendiente en una fila, su último registro y a dónde lleva.
 * Las cantidades de las vistas y la partición de los tipos son del dominio (`packages/domain/src/cartera.test.ts`), y
 * también la lectura de una lista entera (`packages/domain/src/todas-las-paginas.test.ts`).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { areaUnicaDelProfesional, armarElDirectorio: armarConNombres, buscarEnElDirectorio, estadoEnUnaFrase } = await import('../apps/web/src/app/pro/directorio.ts');
/** El directorio con los nombres a la vista; con «Ocultar nombres» (TB-05), «Tus asesorados» le pasa la referencia. */
const armarElDirectorio = (vinculos, yo) => armarConNombres(vinculos, yo, (a) => a.displayName);
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
    [{ consentState: 'REQUIRED', accessMode: 'BLOCKED' }, 'Vínculo activo · Acceso pendiente de autorización de la persona'],
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
  // TB-05: con «Ocultar nombres», cada persona es su referencia: el nombre no se ve ni se encuentra.
  const ocultas = armarConNombres([conNombre('a9be23', 'Martina Gómez', 'NUTRICION')], YO, (a) => `Asesorado · ${a.identityId.slice(-6)}`);
  assert.deepEqual(ocultas.map((p) => p.nombre), ['Asesorado · a9be23']);
  assert.deepEqual(buscarEnElDirectorio(ocultas, 'martina'), []);
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

// ─── TEST-TAG-010 · La acción del momento sigue la cadena (WP-TABLERO-ALTA-GAMA TB-09) ─────────────────────────────

{
  const HOY = '2026-10-19';
  const plan = (nextReviewAt = null) => ({ planVersionId: 'p', activatedAt: '2026-09-01T12:00:00.000Z', nextReviewAt });
  const resumen = (cambios = {}) => ({ activePlan: null, objective: null, lastReview: null, draftPlan: null, registeredExecutions: 0, lastExecutionAt: null, registeredIntakes: 0, lastIntakeAt: null, ...cambios });
  const legible = (summary) => ({ available: true, relationshipId: 'r', summary });
  const ajeno = { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' };
  const dominios = (nutrition, training) => ({ nutrition, training, anthropometry: ajeno });
  const autor = { identityId: 'pro-1', displayName: 'Lic. Sintética' };
  const sinAplicar = (reviewId, recordedAt = '2026-10-10T12:00:00.000Z') => ({ reviewId, recordedAt, author: autor, application: null });
  const aplicada = (reviewId) => ({ reviewId, recordedAt: '2026-10-01T12:00:00.000Z', author: autor, application: { appliedAt: '2026-10-01T13:00:00.000Z', createdPlanId: null, createdObjectiveVersionId: null } });
  const borrador = { planVersionId: 'b', recordedAt: '2026-10-18T12:00:00.000Z', fromReviewId: null };

  test('TEST-TAG-010 · 1. aplicar: una revisión registrada y sin aplicar va antes que todo, y lleva a esa revisión', () => {
    // El caso de Federico Álvarez en la cohorte: la revisión acordada ya venció y la última revisión está sin aplicar.
    // Antes ofrecía «Preparar la revisión»: preparar otra encima de una que todavía no rige.
    const federico = dominios(legible(resumen({ activePlan: plan('2026-10-12'), lastReview: sinAplicar('rev-1') })), ajeno);
    assert.deepEqual(accionDeLaFicha(federico, HOY), { tipo: 'aplicar', area: 'NUTRICION', texto: 'Aplicar la revisión de Nutrición', vista: 'revisiones', extra: '&revision=rev-1' });
    assert.equal(rutaDeLaAccion(accionDeLaFicha(federico, HOY), 'ase 1'), '/pro/advisees/nutrition?id=ase%201&vista=revisiones&revision=rev-1');
    // Gana también al borrador y a empezar en la otra área; con dos sin aplicar, la que espera hace más tiempo.
    const dos = dominios(legible(resumen({ lastReview: sinAplicar('rev-n', '2026-10-15T12:00:00.000Z'), draftPlan: borrador })), legible(resumen({ activePlan: plan('2026-10-20'), lastReview: sinAplicar('rev-t', '2026-10-05T12:00:00.000Z') })));
    assert.deepEqual(accionDeLaFicha(dos, HOY), { tipo: 'aplicar', area: 'ENTRENAMIENTO', texto: 'Aplicar la revisión de Entrenamiento', vista: 'revisiones', extra: '&revision=rev-t' });
    // Una revisión aplicada no es un pendiente: sigue la cadena.
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-11-30'), lastReview: aplicada('rev-a') })), ajeno), HOY), null);
    // El identificador va codificado en la dirección.
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ lastReview: sinAplicar('a&b') })), ajeno), HOY).extra, '&revision=a%26b');
  });

  test('TEST-TAG-010 · 2. la revisión acordada: vencida o de la semana, y abre la revisión ya preparada', () => {
    // La última revisión es del 1 oct, de un ciclo anterior: la del 12 oct todavía no se hizo.
    const vencida = dominios(legible(resumen({ activePlan: plan('2026-10-12'), lastReview: aplicada('rev-a'), draftPlan: borrador })), ajeno);
    assert.deepEqual(accionDeLaFicha(vencida, HOY), { tipo: 'revisar', area: 'NUTRICION', texto: 'Preparar la revisión de Nutrición', vista: 'revisiones', extra: '&preparar=1' });
    // «Preparar la revisión» abre la pantalla de la revisión nueva con el período preparado (`preparar=1`).
    assert.equal(rutaDeLaAccion(accionDeLaFicha(vencida, HOY), 'x'), '/pro/advisees/nutrition?id=x&vista=revisiones&preparar=1');
    // A más de siete días, no es la acción del momento.
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-10-27') })), ajeno), HOY), null);
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-10-26') })), ajeno), HOY).tipo, 'revisar');
  });

  test('TEST-TAG-010 · una revisión hecha para la fecha acordada no vuelve a pedirse (TA-13)', () => {
    const hecha = (recordedAt) => ({ ...aplicada('rev-h'), recordedAt });
    // Registrada el 15 oct para la fecha del 12, y aplicada: la fecha del plan vigente es de un ciclo ya revisado (D-6).
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-10-12'), lastReview: hecha('2026-10-15T12:00:00.000Z') })), ajeno), HOY), null);
    // Registrada una semana antes de la fecha, también es la de esa fecha.
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-10-20'), lastReview: hecha('2026-10-13T12:00:00.000Z') })), ajeno), HOY), null);
    // Registrada el 1 oct, cuando se reprogramó para el 20: la del 20 todavía no se hizo.
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-10-20'), lastReview: hecha('2026-10-01T12:00:00.000Z') })), ajeno), HOY).tipo, 'revisar');
  });

  test('TEST-TAG-010 · 3. el borrador, después de las revisiones; 4. empezar, al final', () => {
    assert.equal(accionDeLaFicha(dominios(legible(resumen({ activePlan: plan('2026-11-30'), draftPlan: borrador })), ajeno), HOY).tipo, 'borrador');
    assert.equal(accionDeLaFicha(dominios(legible(resumen()), legible(resumen({ activePlan: plan('2026-11-30'), draftPlan: borrador }))), HOY).texto, 'Seguir el borrador de Entrenamiento', 'el borrador gana a empezar en la otra área');
    assert.deepEqual(accionDeLaFicha(dominios(legible(resumen()), legible(resumen({ activePlan: plan('2026-11-30') }))), HOY), { tipo: 'empezar', area: 'NUTRICION', texto: 'Empezar el plan de Nutrición', vista: 'plan', extra: '' });
  });

  test('TEST-TAG-010 · la cadena entera, de un eslabón al siguiente, como se cierra un ciclo', () => {
    // Registrada → aplicada (con un borrador nuevo) → activado con fecha → al día.
    const revisada = { ...aplicada('rev-1'), recordedAt: '2026-10-13T12:00:00.000Z' };
    const pasos = [
      resumen({ activePlan: plan('2026-10-12'), lastReview: { ...sinAplicar('rev-1'), recordedAt: '2026-10-13T12:00:00.000Z' } }),
      resumen({ activePlan: plan('2026-10-12'), lastReview: revisada, draftPlan: { ...borrador, fromReviewId: 'rev-1' } }),
      resumen({ activePlan: plan('2026-11-16'), lastReview: revisada }),
    ];
    assert.deepEqual(
      pasos.map((r) => accionDeLaFicha(dominios(legible(r), ajeno), HOY)?.tipo ?? null),
      // Aplicada la revisión, lo que sigue es su borrador: la fecha vieja del plan vigente ya se revisó.
      ['aplicar', 'borrador', null],
    );
    // Lo que el profesional no puede leer no entra en la cadena.
    assert.equal(accionDeLaFicha(dominios(ajeno, ajeno), HOY), null);
  });
}

// ─── TB-08 · «Tus asesorados» con rostro y antigüedad (WP-TABLERO-ALTA-GAMA; DL-163 D-2) ───────────────────────────

const { enOrdenAlfabetico } = await import('../apps/web/src/app/pro/directorio.ts');

test('TB-08 · «Con vos desde» es el vínculo vigente más antiguo, y un vínculo que terminó no cuenta', () => {
  const [dos] = armarElDirectorio(
    [vinculo('a9be23', 'NUTRICION', { acceptedAt: '2026-05-10T12:00:00.000Z' }), vinculo('a9be23', 'ANTROPOMETRIA', { acceptedAt: '2025-11-03T12:00:00.000Z', relationshipState: 'PAUSADO', pausedBy: 'ADVISEE' })],
    YO,
  );
  assert.equal(dos.conVosDesde, '2025-11-03T12:00:00.000Z', 'el más antiguo, aunque esté en pausa');
  const [conUnoTerminado] = armarElDirectorio([vinculo('a9be23', 'NUTRICION', { relationshipState: 'FINALIZADO', acceptedAt: '2024-01-01T12:00:00.000Z' }), vinculo('a9be23', 'ENTRENAMIENTO', { acceptedAt: '2026-02-01T12:00:00.000Z' })], YO);
  assert.equal(conUnoTerminado.conVosDesde, '2026-02-01T12:00:00.000Z', 'lo que terminó no alarga la antigüedad');
  const [terminado] = armarElDirectorio([vinculo('a9be23', 'NUTRICION', { relationshipState: 'FINALIZADO' })], YO);
  assert.equal(terminado.conVosDesde, null, 'sin un vínculo vigente, no es «con vos»');
});

test('TB-08 · en orden alfabético, como en español, y a igual nombre por la referencia', () => {
  const conNombre = (asesorado, nombre) => vinculo(asesorado, 'NUTRICION', { advisee: { identityId: `ase-${asesorado}`, displayName: nombre } });
  const personas = armarElDirectorio([conNombre('000003', 'diego sosa'), conNombre('000001', 'Ángela Ruiz'), conNombre('000004', 'Agustina Ledesma'), conNombre('000002', 'Diego Sosa'), conNombre('000005', 'Benítez Lucía')], YO);
  assert.deepEqual(
    enOrdenAlfabetico(personas).map((p) => `${p.nombre} ${p.referencia}`),
    ['Agustina Ledesma 000004', 'Ángela Ruiz 000001', 'Benítez Lucía 000005', 'Diego Sosa 000002', 'diego sosa 000003'],
  );
  // No cambia la lista que recibe: el orden de la API sigue disponible.
  assert.equal(personas[0].nombre, 'diego sosa');
});

// ─── TB-07 · «Tu semana» (WP-TABLERO-ALTA-GAMA; DL-163 D-3) ─────────────────────────────────────────────────────────

const { DIAS_DE_LA_SEMANA, FICHAS_POR_DIA, semanaDeRevisiones } = await import('../apps/web/src/app/pro/tu-semana.ts');

{
  const HOY_DE_LA_SEMANA = '2026-11-06';
  let n = 0;
  const fila = (kind, since, extra = {}) => ({
    advisee: { identityId: `ase-${++n}`, displayName: `Persona ${n}` },
    relationshipId: `rel-${n}`,
    domain: 'nutrition',
    kind,
    since,
    open: { view: 'revisiones' },
    ...extra,
  });

  test('TB-07 · ocho días de hoy a hoy + 7, también los vacíos, y las vencidas aparte', () => {
    const items = [fila('REVIEW_OVERDUE', '2026-10-30'), fila('REVIEW_DUE_SOON', '2026-11-06'), fila('REVIEW_DUE_SOON', '2026-11-13'), fila('REVIEW_OVERDUE', '2026-11-02')];
    const s = semanaDeRevisiones(items, HOY_DE_LA_SEMANA);
    assert.equal(DIAS_DE_LA_SEMANA, 8);
    assert.deepEqual(
      s.dias.map((d) => d.clave),
      ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'],
    );
    assert.deepEqual(s.dias.map((d) => d.fichas.length), [1, 0, 0, 0, 0, 0, 0, 1], 'un día vacío es un día, no un hueco');
    assert.deepEqual(s.vencidas.fichas.map((f) => f.since), ['2026-10-30', '2026-11-02'], 'en el orden de la cartera');
    assert.equal(s.total, 4);
  });

  test('TB-07 · solo revisiones con fecha: sin tomas, sin planes, sin formularios y sin las que no tienen fecha', () => {
    const items = [fila('REVIEW_UNDATED', null), fila('ANTHRO_DRAFT_PENDING', '2026-11-06'), fila('PLAN_DRAFT_PENDING', '2026-11-06'), fila('NO_ACTIVE_PLAN', null), fila('FORM_REQUEST_OPEN', '2026-11-06')];
    const s = semanaDeRevisiones(items, HOY_DE_LA_SEMANA);
    assert.equal(s.total, 0);
    assert.equal(s.vencidas.fichas.length, 0);
    assert.ok(s.dias.every((d) => d.fichas.length === 0));
  });

  test('TB-07 · hasta tres por día y después «y N más», con el orden de la cartera', () => {
    const items = [1, 2, 3, 4, 5].map(() => fila('REVIEW_DUE_SOON', '2026-11-08'));
    const s = semanaDeRevisiones(items, HOY_DE_LA_SEMANA);
    const dia = s.dias[2];
    assert.equal(FICHAS_POR_DIA, 3);
    assert.deepEqual(dia.fichas.map((f) => f.advisee.identityId), items.slice(0, 3).map((f) => f.advisee.identityId));
    assert.equal(dia.mas, 2);
    // Sin tope («Ver como lista» y «y N más» abierto), todas.
    assert.equal(semanaDeRevisiones(items, HOY_DE_LA_SEMANA, Infinity).dias[2].fichas.length, 5);
    assert.equal(semanaDeRevisiones(items, HOY_DE_LA_SEMANA, Infinity).dias[2].mas, 0);
  });

  test('TB-07 · lo que registra la persona no mueve nada: el día sale de la fecha acordada', () => {
    const base = fila('REVIEW_DUE_SOON', '2026-11-10');
    const conRegistros = { ...base, lastActivityAt: '2026-11-05T12:00:00.000Z', activityCount: 40 };
    const sinRegistros = { ...base, lastActivityAt: null, activityCount: 0 };
    assert.deepEqual(semanaDeRevisiones([conRegistros], HOY_DE_LA_SEMANA).dias.map((d) => d.fichas.length), semanaDeRevisiones([sinRegistros], HOY_DE_LA_SEMANA).dias.map((d) => d.fichas.length));
  });
}

// ─── TA-71 · «Tu semana» no pisa la columna de al lado (TB-07) ──────────────────────────────────────────────────────
// En la galería de capturas del PR #240, a 1280 y a 1440, «Norma Castro» pisaba la raya de «Hoy» y «Diego Sosa» la de
// «mar 10»: la columna implícita de las fichas crecía con el nombre en un renglón y la elipsis nunca cortaba. La medida
// en el navegador la hacen las capturas (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/tu-semana.mjs`); acá, lo que decide
// y lo que la sostiene en el código.

const { fichasMedidas, partesQueSePasan, TOLERANCIA_PX } = await import('../EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/tu-semana.mjs');
const { readFileSync } = await import('node:fs');
const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');

test('TA-71 · una parte que se pasa de su columna se dice, por la derecha o por la izquierda; dentro de medio punto, no', () => {
  const columna = { izquierda: 100, derecha: 207 };
  const parte = (nombre, izquierda, derecha) => ({ parte: nombre, izquierda, derecha });
  const vencidas = (...partes) => [{ dia: 'Vencidas', columna, fichas: [partes] }];
  assert.equal(TOLERANCIA_PX, 0.5);
  assert.deepEqual(partesQueSePasan(vencidas(parte('monograma', 104, 132), parte('nombre', 138, 207.5), parte('área', 104, 190))), []);
  // Lo de la galería, a 1280: el nombre en un renglón, 39 más allá de la columna.
  assert.deepEqual(partesQueSePasan(vencidas(parte('nombre', 138, 246))), ['Vencidas · nombre: sobresale 39 a la derecha']);
  assert.deepEqual(partesQueSePasan(vencidas(parte('área', 98, 150))), ['Vencidas · área: sobresale 2 a la izquierda']);
  // Con varias fichas en un día se dice cuál.
  const dos = [{ dia: 'lun 9', columna, fichas: [[parte('nombre', 138, 200)], [parte('nombre', 138, 210)]] }];
  assert.deepEqual(partesQueSePasan(dos), ['lun 9 (ficha 2) · nombre: sobresale 3 a la derecha']);
  assert.equal(fichasMedidas([...dos, { dia: 'mar 10', columna, fichas: [] }]), 2);
});

test('TA-71 · el nombre no estira su columna: hasta dos renglones y «…», y entero en el título y en el texto del enlace', () => {
  const css = leer('apps/web/src/app/globals.css');
  const regla = (selector) => {
    const i = css.indexOf(`\n${selector} {`);
    assert.ok(i >= 0, `falta la regla ${selector}`);
    return css.slice(i, css.indexOf('\n}', i));
  };
  assert.match(regla('.tu-semana__fichas'), /grid-template-columns: minmax\(0, 1fr\);/, 'la columna de las fichas no crece con el nombre');
  const nombre = regla('.ficha-de-la-semana__nombre');
  for (const declaracion of ['overflow: hidden;', '-webkit-line-clamp: 2;', 'overflow-wrap: anywhere;']) assert.ok(nombre.includes(declaracion), `el nombre lleva ${declaracion}`);
  assert.doesNotMatch(nombre, /white-space: nowrap/, 'en un solo renglón, un nombre largo no entra en la columna de 1280');
  assert.match(regla('.ficha-de-la-semana__cual'), /text-overflow: ellipsis;/);
  // En una columna angosta, el monograma arriba y el área en palabras: lo decide el ancho de la columna, no la ventana.
  assert.match(regla('.tu-semana__dia'), /container: dia-de-la-semana \/ inline-size;/);
  assert.match(css, /@container dia-de-la-semana \(max-width: 7\.5rem\) \{/);
  // Entero para el lector de pantalla (el texto del enlace no se recorta) y en el título, con «Ocultar nombres» también.
  const ficha = leer('apps/web/src/app/pro/tu-semana-en-pantalla.tsx');
  assert.match(ficha, /<span className="ficha-de-la-semana__nombre" title=\{quien\}>\s*\{quien\}\s*<\/span>/);
  assert.match(ficha, /const quien = delAsesorado\(f\.advisee\);/);
});

test('TA-71 · las capturas miden «Tu semana» en cada tamaño y tema, también con los nombres ocultos, y fallan si algo se pasa', () => {
  const capturas = leer('EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs');
  assert.match(capturas, /fila\.tuSemana\[`\$\{tema\}-\$\{ancho\}`\] = await laSemanaEntra\(page, mediciones, `\$\{NOMBRES\[prefijo\]\} · \$\{tema\} · \$\{ancho\}`\);/);
  assert.match(capturas, /await laSemanaEntra\(page, mediciones, `\$\{NOMBRES\[prefijo\]\} · nombres ocultos · \$\{tema\} · \$\{ancho\}`\);/);
  assert.match(capturas, /if \(\(mediciones\.tuSemanaQueSePasa \?\? \[\]\)\.length > 0\) process\.exitCode = 1;/);
  assert.match(capturas, /fichasMedidas\(columnas\) === 0 \? \['no se midió ninguna ficha de «Tu semana»'\]/);
});
