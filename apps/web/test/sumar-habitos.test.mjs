/**
 * WP-FORMULARIOS-RONDA-2, ronda 2.1 (DL-165 D-15 nueva; D-22) · «Sumar «Tus hábitos»» en «Pedir información»
 * (`apps/web/src/app/pro/advisees/forms/sumar-habitos.ts`), sin React:
 *  1. cuándo se ofrece: con un formulario de área propia que no trae la parte, si el catálogo trae «Tus hábitos» y si
 *     API-HBT-07 no dio el 404 de lo inexistente;
 *  2. qué viene marcado: lo que sugiere el dominio con lo que devuelve API-HBT-07 (marcada sin hábitos o con más de 3
 *     meses; sin marcar, con su fecha, si son recientes o si hay uno pendiente); sin saberlo, sin marcar y sin motivo;
 *  3. el segundo pedido: todas las preguntas de «Tus hábitos», requeridas las que sugiere, el «para qué» y la misma área;
 *  4. lo que se dice al terminar: cuál quedó y cuál no;
 *  5. los textos no califican ni usan los términos prohibidos.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/sumar-habitos.ts');
const { marcadoPorOmision } = await import('../src/app/pro/advisees/forms/formulario-de-inicio.ts');
const {
  COPY_FORMULARIOS,
  COPY_HABITOS,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_ENTRENAMIENTO_V4,
  PLANTILLA_HABITOS_V2,
  PLANTILLA_NUTRICION_INICIO_V2,
  PLANTILLA_NUTRICION_INICIO_V3,
  terminosProhibidosDeFormulariosEn,
} = await import('@be/domain');

const H = COPY_HABITOS.web;
const fecha = (iso) => iso.slice(0, 10);
const AHORA = '2026-11-06T15:00:00.000Z';

/** Una versión como la devuelve API-FRI-01, con lo que mira el cajón. */
const version = (p, id = 'v-1') => ({ key: p.clave, domain: p.dominio, sections: p.sections, templateVersionId: id });
/** El catálogo de API-FRM-01: «Tus hábitos» seleccionable, y otro sin área propia. */
const HABITOS_EN_EL_CATALOGO = { templateId: 'p-hab', key: 'FRM-HABITOS', name: 'Tus hábitos', purpose: '', domain: null, status: 'SELECTABLE', latestVersionId: 'v-hab', fieldCount: 6, effectiveSince: AHORA };
const SALUD = { ...HABITOS_EN_EL_CATALOGO, templateId: 'p-sal', key: 'FRM-SALUD', name: 'Antecedentes de salud declarados', latestVersionId: 'v-sal' };
const CATALOGO = [SALUD, HABITOS_EN_EL_CATALOGO];

/** Lo que devuelve API-HBT-07 (lo demás no lo mira el cajón). */
const sabe = (cambios = {}) => ({
  tipo: 'listo',
  datos: {
    scopes: ['NUTRICION'],
    receives: false,
    sharedSince: null,
    latestSeenAt: null,
    pendingHabitsRequestSince: null,
    accessRequest: null,
    canRequestAccess: true,
    canRequestAccessFrom: null,
    ...cambios,
  },
});

test('1 · se ofrece con «Cómo comés hoy» v3 y «Antes de entrenar» v4, que no traen la parte, si el catálogo trae «Tus hábitos»', () => {
  for (const p of [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4]) {
    assert.equal(m.habitosParaSumar({ version: version(p), catalogo: CATALOGO, lectura: sabe() }), HABITOS_EN_EL_CATALOGO, `${p.clave} v${p.version}`);
    // Mientras se lee lo que sabe, o si esa lectura falló, se ofrece igual: no bloquea el pedido.
    for (const lectura of [null, { tipo: 'cargando' }, { tipo: 'fallo' }]) assert.equal(m.habitosParaSumar({ version: version(p), catalogo: CATALOGO, lectura }), HABITOS_EN_EL_CATALOGO);
  }
});

test('1 · no se ofrece con las que ya traen la parte, con «Tus hábitos» mismo, con uno sin área, sin «Tus hábitos» en el catálogo ni con el 404', () => {
  const ofrece = (v, catalogo = CATALOGO, lectura = sabe()) => m.habitosParaSumar({ version: v, catalogo, lectura });
  // Las de la ronda 2 traen la parte (sus Solicitudes ya creadas siguen en su versión).
  assert.equal(ofrece(version(PLANTILLA_NUTRICION_INICIO_V2)), null);
  assert.equal(ofrece(version(PLANTILLA_ENTRENAMIENTO_V3)), null);
  // «Tus hábitos» mismo, y cualquier otro sin área propia.
  assert.equal(ofrece(version(PLANTILLA_HABITOS_V2)), null);
  assert.equal(ofrece({ key: 'FRM-SALUD', domain: null, sections: PLANTILLA_HABITOS_V2.sections.map((s) => ({ ...s, sectionCode: 'condiciones' })) }), null);
  // Sin «Tus hábitos» seleccionable en el catálogo, o sin catálogo.
  assert.equal(ofrece(version(PLANTILLA_NUTRICION_INICIO_V3), [SALUD]), null);
  assert.equal(ofrece(version(PLANTILLA_NUTRICION_INICIO_V3), [{ ...HABITOS_EN_EL_CATALOGO, status: 'HISTORICAL_NOT_SELECTABLE' }]), null);
  assert.equal(ofrece(version(PLANTILLA_NUTRICION_INICIO_V3), null), null);
  // El 404 de API-HBT-07: hoy no la acompaña con el acceso vigente (el pedido de área va a recibir el mismo 404).
  assert.equal(ofrece(version(PLANTILLA_NUTRICION_INICIO_V3), CATALOGO, { tipo: 'sin-acceso' }), null);
  // Sin un formulario elegido, nada.
  assert.equal(ofrece(null), null);
});

test('2 · marcada si no ve ningún hábito o lo que ve tiene más de 3 meses; sin marcar, con su fecha, si es reciente o hay uno pendiente', () => {
  const caso = (cambios) => {
    const s = m.sugerenciaDelCajon(sabe(cambios), AHORA);
    return { marcada: m.marcadaPorOmision(s), motivo: m.motivoDeLaSugerencia(s, fecha) };
  };
  assert.deepEqual(caso({}), { marcada: true, motivo: 'Todavía no tenés sus hábitos.' });
  assert.deepEqual(caso({ latestSeenAt: '2026-07-20T10:00:00.000Z' }), { marcada: true, motivo: 'Los hábitos que ves son del 2026-07-20: tienen más de 3 meses.' });
  assert.deepEqual(caso({ latestSeenAt: '2026-10-01T10:00:00.000Z' }), { marcada: false, motivo: 'Ya tenés sus hábitos del 2026-10-01.' });
  // Tres meses justos todavía no son «más de 3 meses».
  assert.equal(caso({ latestSeenAt: '2026-08-06T15:00:00.000Z' }).marcada, false);
  // Uno pendiente manda, aunque no vea ninguno: pedirlo de nuevo no le suma nada a la persona.
  assert.deepEqual(caso({ pendingHabitsRequestSince: '2026-11-02T09:00:00.000Z' }), { marcada: false, motivo: 'Ya le pediste sus hábitos el 2026-11-02: esperan su respuesta.' });
});

test('2 · sin saber lo que ve (se está leyendo, o la lectura falló), sin marcar y sin motivo: no se afirma nada que no se sabe', () => {
  for (const lectura of [null, { tipo: 'cargando' }, { tipo: 'fallo' }, { tipo: 'sin-acceso' }]) {
    const s = m.sugerenciaDelCajon(lectura, AHORA);
    assert.equal(s, null);
    assert.equal(m.marcadaPorOmision(s), false);
    assert.equal(m.motivoDeLaSugerencia(s, fecha), null);
  }
});

test('3 · el segundo pedido: todas las preguntas de «Tus hábitos», requeridas las que sugiere, el «para qué» y la misma área', () => {
  const cuerpo = m.pedidoDeHabitos({ templateVersionId: 'v-hab', sections: PLANTILLA_HABITOS_V2.sections }, 'ENTRENAMIENTO');
  assert.deepEqual(cuerpo, {
    templateVersionId: 'v-hab',
    purpose: H.propositoDelFormulario,
    scope: 'ENTRENAMIENTO',
    requestedFieldCodes: ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres'],
    requiredFieldCodes: ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes'],
  });
  // Lo mismo que viene marcado al elegir «Tus hábitos» solo en el cajón.
  const marcado = marcadoPorOmision(PLANTILLA_HABITOS_V2.sections);
  assert.deepEqual([cuerpo.requestedFieldCodes, cuerpo.requiredFieldCodes], [marcado.pedidas, marcado.requeridas]);
  // Requerida ⊆ pedida (REG-06-212), y el «para qué» es el de la plantilla.
  assert.ok(cuerpo.requiredFieldCodes.every((c) => cuerpo.requestedFieldCodes.includes(c)));
  assert.ok(cuerpo.purpose.trim().length > 0 && cuerpo.purpose.length <= 300);
});

test('4 · lo que se dice al terminar: las dos, una sola, ninguna, y sin saber si llegó', () => {
  const formulario = 'Cómo comés hoy';
  const no = (motivo, incierto = false) => ({ ok: false, incierto, motivo });
  const motivo = 'El servicio no está disponible en este momento. Probá de nuevo más tarde.';
  // Sin la casilla, lo de siempre.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: false, area: { ok: true }, habitos: null }), { donde: 'pagina', texto: COPY_FORMULARIOS.solicitudEnviada });
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: false, area: no(motivo), habitos: null }), { donde: 'cajon', texto: motivo });
  // Las dos salieron.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: true, area: { ok: true }, habitos: { ok: true } }), { donde: 'pagina', texto: 'Listo: enviaste «Cómo comés hoy» y «Tus hábitos».' });
  // La de área no salió: no se mandó la otra, y se dice.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: true, area: no(motivo), habitos: null }), { donde: 'cajon', texto: `No se envió «Cómo comés hoy» ni «Tus hábitos». ${motivo}` });
  // Sin saber si la de área llegó, no se dice que no se envió ninguna: se reintenta con la misma clave.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: true, area: no('No pudimos confirmar el resultado. Reintentá.', true), habitos: null }), { donde: 'cajon', texto: 'No pudimos confirmar el resultado. Reintentá.' });
  // La de área salió y la de hábitos no: se dice cuál quedó.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: true, area: { ok: true }, habitos: no(motivo) }), {
    donde: 'pagina',
    texto: `«Cómo comés hoy» quedó enviado, pero «Tus hábitos» no: ${motivo} Lo podés pedir solo, eligiéndolo en la lista.`,
  });
  // La de hábitos sin respuesta (después de reintentarla una vez): que lo mire antes de pedirlo de nuevo.
  assert.deepEqual(m.mensajeDelEnvio({ formulario, sumaHabitos: true, area: { ok: true }, habitos: no('', true) }), {
    donde: 'pagina',
    texto: '«Cómo comés hoy» quedó enviado. No pudimos confirmar si «Tus hábitos» también: fijate en «Solicitudes» antes de pedirlo de nuevo.',
  });
});

test('5 · los textos del cajón no califican ni usan los términos prohibidos', () => {
  const textos = [
    H.sumarHabitos,
    H.sumarHabitosQueEs,
    H.sugerencia.SIN_HABITOS(),
    H.sugerencia.VIEJOS('5 nov'),
    H.sugerencia.RECIENTES('5 nov'),
    H.sugerencia.PENDIENTE('5 nov'),
    H.propositoDelFormulario,
    H.enviadasLasDos('Antes de entrenar'),
    H.noSeEnvioHabitos('Antes de entrenar', 'El servicio no está disponible.'),
    H.noSeEnvioNinguna('Antes de entrenar'),
    H.habitosSinConfirmar('Antes de entrenar'),
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    assert.doesNotMatch(t, /\bpx\b|cumplimiento|adherencia|recomendad/i, t);
  }
  assert.equal(H.sumarHabitos, 'Sumar «Tus hábitos»');
});
