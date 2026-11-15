/**
 * WP-COMPARTIR (DL-176) · la lógica pura de la pantalla única de consentimiento, TEST-CMP-001 a TEST-CMP-012 y TEST-CMP-014
 * (de la revisión: lo retirado de a una cosa, lo bajado de nivel y un «Ahora no» no vuelven marcados). Cada prueba
 * dice la mutación que la tiene que poner en rojo. Lo que pasa con la base y la API (el toque único escribe todo o nada,
 * retirar cada cosa corta, los 404), en test/integration/compartir.int-spec.ts (TEST-CMP-020 a 029).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CODIGO_DE_PROBLEMA_DE_LA_ELECCION,
  SIN_DECISIONES_ANTERIORES,
  claveDe,
  eleccionCoherente,
  eleccionInicial,
  habitosAlCompartir,
  habitosSinElProfesional,
  leerClave,
  loQueSePuedeCompartir,
  renglonesAlCompartir,
  renglonesSinElPar,
  revisarLaEleccion,
  sePuedeElegir,
  textosDeLaEleccion,
  textosDeLosResumenesElegidos,
  versionDeLoQueSeComparte,
  type ComponenteParaCompartir,
  type EstadoParaCompartir,
  type LoQueSeComparte,
} from './compartir';
import { CompartirLoElegidoRequestSchema, DejarDeCompartirUnaCosaRequestSchema, LoQueSePuedeCompartirResponseSchema } from './contratos-compartir';
import { COPY_COMPARTIR, textosDeCompartir } from './copy-compartir';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosEn } from './copy-nutricion';
import type { RenglonDeResumen } from './resumenes-compartidos';

// Los profesionales: Paz (Nutrición), Ruiz (Entrenamiento) y Gómez (Antropometría). Uno anterior de Nutrición, Vera.
const PAZ = '11111111-1111-4111-8111-111111111111';
const RUIZ = '22222222-2222-4222-8222-222222222222';
const GOMEZ = '33333333-3333-4333-8333-333333333333';
const VERA = '44444444-4444-4444-8444-444444444444';
const C_PAZ = 'aaaaaaaa-0000-4000-8000-000000000001';
const C_RUIZ = 'aaaaaaaa-0000-4000-8000-000000000002';
const C_GOMEZ = 'aaaaaaaa-0000-4000-8000-000000000003';
const C_VERA = 'aaaaaaaa-0000-4000-8000-000000000004';

const comp = (id: string, profesionalId: string, alcance: ComponenteParaCompartir['alcance'], inicio: string, estado: ComponenteParaCompartir['estado'] = 'ACEPTADO'): ComponenteParaCompartir => ({ id, profesionalId, alcance, estado, inicio });
const TEXTOS = { datosDeSalud: 'a3', resumen: 'res', resumenYPlan: 'resp', historiaAnterior: 'hia', habitos: 'hbt' };

/** La persona: Vera la acompañó en Nutrición (terminado); hoy, Ruiz y Gómez, y acaba de aceptar a Paz. Nunca decidió nada. */
function estado(cambios: Partial<EstadoParaCompartir> = {}): EstadoParaCompartir {
  return {
    componentes: [
      comp(C_VERA, VERA, 'NUTRICION', '2026-01-01T00:00:00.000Z', 'FINALIZADO'),
      comp(C_RUIZ, RUIZ, 'ENTRENAMIENTO', '2026-03-01T00:00:00.000Z'),
      comp(C_GOMEZ, GOMEZ, 'ANTROPOMETRIA', '2026-04-01T00:00:00.000Z'),
      comp(C_PAZ, PAZ, 'NUTRICION', '2026-11-15T00:00:00.000Z'),
    ],
    a3: { estado: 'NUNCA', desde: null },
    b2: new Map([
      [C_RUIZ, { vigente: true, textoId: 'b2-san', desde: '2026-03-01T00:00:00.000Z' }],
      [C_GOMEZ, { vigente: true, textoId: 'b2-san', desde: '2026-04-01T00:00:00.000Z' }],
    ]),
    textoDeB2: new Map([
      [C_RUIZ, 'b2-san'],
      [C_GOMEZ, 'b2-san'],
      [C_PAZ, 'b2-san'],
    ]),
    resumenes: { estado: 'NUNCA', version: null, renglones: [] },
    habitos: { estado: 'NUNCA', version: null, renglones: null, hayHabitos: true },
    historia: new Map(),
    textos: TEXTOS,
    decisiones: SIN_DECISIONES_ANTERIORES,
    ...cambios,
  };
}

const claves = (items: readonly LoQueSeComparte[]) => items.map((i) => i.clave);
const de = (items: readonly LoQueSeComparte[], clave: string) => items.find((i) => i.clave === clave)!;

test('TEST-CMP-001 · al aceptar: el A3, su área, lo de las otras áreas para ella y lo de su área para los demás, la historia anterior y los hábitos', () => {
  // Mutación: ofrecer pares que no tocan al componente aceptado (Ruiz ← Antropometría) la pone en rojo.
  const items = loQueSePuedeCompartir(estado(), C_PAZ);
  assert.deepEqual(claves(items), [
    'HEALTH_DATA',
    `AREA_CONSENT:${C_PAZ}`,
    `SUMMARY:${PAZ}:ENTRENAMIENTO`,
    `SUMMARY:${PAZ}:ANTROPOMETRIA`,
    `SUMMARY:${RUIZ}:NUTRICION`,
    `SUMMARY:${GOMEZ}:NUTRICION`,
    `PREVIOUS_HISTORY:${C_PAZ}`,
    `HABITS:${PAZ}`,
  ]);
  assert.ok(items.every((i) => i.ofrecido && i.preseleccionado && !i.dado), 'nada decidido: todo ofrecido y marcado');
  // El plan, si el área lo tiene; Antropometría, el resumen.
  assert.equal((de(items, `SUMMARY:${PAZ}:ENTRENAMIENTO`) as { nivel: string }).nivel, 'SUMMARY_AND_PLAN');
  assert.equal((de(items, `SUMMARY:${PAZ}:ANTROPOMETRIA`) as { nivel: string }).nivel, 'SUMMARY');
  assert.equal(de(items, `SUMMARY:${PAZ}:ANTROPOMETRIA`).textoId, 'res');
  assert.equal(de(items, `SUMMARY:${RUIZ}:NUTRICION`).textoId, 'resp');
  assert.deepEqual((de(items, `SUMMARY:${RUIZ}:NUTRICION`) as { deQuienes: readonly string[] }).deQuienes, [PAZ]);
});

test('TEST-CMP-002 · sin componente: todo lo que se puede compartir entre todos, y nada de un vínculo terminado', () => {
  // Mutación: contar a Vera (terminado) como receptor u origen la pone en rojo.
  const items = loQueSePuedeCompartir(estado(), null);
  const pares = items.filter((i) => i.tipo === 'SUMMARY').map((i) => i.clave);
  assert.deepEqual(pares, [
    `SUMMARY:${PAZ}:ENTRENAMIENTO`,
    `SUMMARY:${PAZ}:ANTROPOMETRIA`,
    `SUMMARY:${RUIZ}:NUTRICION`,
    `SUMMARY:${RUIZ}:ANTROPOMETRIA`,
    `SUMMARY:${GOMEZ}:NUTRICION`,
    `SUMMARY:${GOMEZ}:ENTRENAMIENTO`,
  ]);
  assert.ok(!claves(items).some((k) => k.includes(VERA) || k.includes(C_VERA)));
  assert.deepEqual(loQueSePuedeCompartir(estado(), C_VERA), [], 'un componente terminado no tiene nada para dar');
});

test('TEST-CMP-003 · lo que se retiró antes no vuelve marcado; lo nunca decidido, sí (CMP-D3)', () => {
  // Mutación: preseleccionar siempre lo ofrecido la pone en rojo.
  const items = loQueSePuedeCompartir(
    estado({
      a3: { estado: 'REVOCADO', desde: null },
      b2: new Map([[C_PAZ, { vigente: false, textoId: 'b2-san', desde: '2026-11-15T00:00:00.000Z' }]]),
      resumenes: { estado: 'RETIRADA', version: 2, renglones: [] },
      habitos: { estado: 'RETIRADA', version: 3, renglones: null, hayHabitos: true },
      historia: new Map([[C_PAZ, { estado: 'RETIRADA', version: 2, desde: '2026-11-15T00:00:00.000Z' }]]),
    }),
    C_PAZ,
  );
  assert.ok(items.every((i) => i.ofrecido && !i.preseleccionado), claves(items.filter((i) => i.preseleccionado)).join(', '));
  assert.deepEqual([...eleccionInicial(items)], []);
});

test('TEST-CMP-004 · lo dado se dice como dado, con su fecha, y lo completo no se ofrece', () => {
  // Mutación: dar por completo un par con un renglón de menos nivel (o de un solo origen) la pone en rojo.
  const renglon = (profesionalId: string, alcanceDeVinculoId: string, origenId: string, area: RenglonDeResumen['area'], nivel: RenglonDeResumen['nivel']): RenglonDeResumen => ({ profesionalId, alcanceDeVinculoId, origenId, area, nivel, desde: '2026-10-01T00:00:00.000Z' });
  const e = estado({
    a3: { estado: 'VIGENTE', desde: '2026-02-01T00:00:00.000Z' },
    resumenes: {
      estado: 'ACTIVA',
      version: 4,
      renglones: [renglon(RUIZ, C_RUIZ, C_GOMEZ, 'ANTROPOMETRIA', 'SUMMARY'), renglon(GOMEZ, C_GOMEZ, C_RUIZ, 'ENTRENAMIENTO', 'SUMMARY'), renglon(RUIZ, C_RUIZ, C_VERA, 'NUTRICION', 'SUMMARY_AND_PLAN')],
    },
  });
  const items = loQueSePuedeCompartir(e, null);
  assert.equal(de(items, 'HEALTH_DATA').dado, true);
  assert.equal(de(items, 'HEALTH_DATA').ofrecido, false);
  const completo = de(items, `SUMMARY:${RUIZ}:ANTROPOMETRIA`);
  assert.deepEqual([completo.dado, completo.ofrecido, completo.desde], [true, false, '2026-10-01T00:00:00.000Z']);
  // Gómez recibe el resumen de Entrenamiento, pero se le ofrece el plan: dado, y ofrecido para subir.
  const bajo = de(items, `SUMMARY:${GOMEZ}:ENTRENAMIENTO`);
  assert.deepEqual([bajo.dado, bajo.ofrecido], [true, true]);
  // Lo de Vera (terminado) no cuenta: Ruiz no recibe Nutrición.
  assert.equal(de(items, `SUMMARY:${RUIZ}:NUTRICION`).dado, false);
  // El B2 vigente con el texto de hoy no se ofrece; con otro texto, sí (y marcado).
  assert.equal(de(items, `AREA_CONSENT:${C_RUIZ}`).ofrecido, false);
  const viejo = loQueSePuedeCompartir(estado({ b2: new Map([[C_RUIZ, { vigente: true, textoId: 'b2-viejo', desde: '2026-03-01T00:00:00.000Z' }]]) }), C_RUIZ);
  assert.deepEqual([de(viejo, `AREA_CONSENT:${C_RUIZ}`).dado, de(viejo, `AREA_CONSENT:${C_RUIZ}`).ofrecido, de(viejo, `AREA_CONSENT:${C_RUIZ}`).preseleccionado], [true, true, true]);
});

test('TEST-CMP-005 · la historia anterior, solo si antes hubo otro en esa área; los hábitos, «si corresponde» (CMP-D5)', () => {
  // Mutación: ofrecer los hábitos sin hábitos y sin compartirlos la pone en rojo.
  assert.ok(!claves(loQueSePuedeCompartir(estado(), C_RUIZ)).some((k) => k.startsWith('PREVIOUS_HISTORY')), 'Ruiz fue el primero de Entrenamiento');
  const sinHabitos = loQueSePuedeCompartir(estado({ habitos: { estado: 'NUNCA', version: null, renglones: null, hayHabitos: false } }), C_PAZ);
  assert.ok(!claves(sinHabitos).some((k) => k.startsWith('HABITS')));
  // Ya los comparte con Ruiz: a Paz, que llegó después (NOT_ASKED), se le ofrecen marcados aunque no haya hábitos todavía.
  const activa = estado({ habitos: { estado: 'ACTIVA', version: 2, renglones: [{ profesionalId: RUIZ, alcanceDeVinculoId: C_RUIZ, incluido: true, incluidoDesde: '2026-05-01T00:00:00.000Z' }, { profesionalId: GOMEZ, alcanceDeVinculoId: C_GOMEZ, incluido: false, incluidoDesde: null }], hayHabitos: false } });
  const items = loQueSePuedeCompartir(activa, null);
  assert.deepEqual([de(items, `HABITS:${PAZ}`).ofrecido, de(items, `HABITS:${PAZ}`).preseleccionado], [true, true]);
  assert.deepEqual([de(items, `HABITS:${RUIZ}`).dado, de(items, `HABITS:${RUIZ}`).desde], [true, '2026-05-01T00:00:00.000Z']);
  // A Gómez le dijo que no: se ofrece, sin marcar.
  assert.deepEqual([de(items, `HABITS:${GOMEZ}`).ofrecido, de(items, `HABITS:${GOMEZ}`).preseleccionado], [true, false]);
});

test('TEST-CMP-006 · sin el A3, lo que lo pide no se puede elegir; la autorización del área, sí (CMP-D4)', () => {
  // Mutación: dejar elegir lo de otras áreas sin el A3 la pone en rojo.
  const items = loQueSePuedeCompartir(estado(), C_PAZ);
  const todo = eleccionInicial(items);
  assert.ok(todo.has('HEALTH_DATA'));
  const sinA3 = eleccionCoherente(items, new Set([...todo].filter((k) => k !== 'HEALTH_DATA')));
  assert.deepEqual([...sinA3], [`AREA_CONSENT:${C_PAZ}`]);
  assert.equal(sePuedeElegir(items, sinA3, `HABITS:${PAZ}`), false);
  assert.equal(sePuedeElegir(items, todo, `HABITS:${PAZ}`), true);
  assert.equal(sePuedeElegir(items, todo, 'HABITS:00000000-0000-4000-8000-000000000000'), false, 'lo que no está, no se elige');
  // Los textos de lo elegido, sin repetir.
  assert.deepEqual(textosDeLaEleccion(items, todo), ['a3', 'b2-san', 'resp', 'res', 'hia', 'hbt']);
});

test('TEST-CMP-007 · revisar la elección: lo no ofrecido (ajeno o inexistente, igual), sin el A3, el texto viejo y el que falta', () => {
  // Mutación: aceptar una clave que no se ofrece, o un texto que no es el vigente, la pone en rojo.
  const items = loQueSePuedeCompartir(estado(), C_PAZ);
  const ajena = `HABITS:${VERA}`;
  const inexistente = 'HABITS:00000000-0000-4000-8000-000000000000';
  const r1 = revisarLaEleccion(items, [ajena, inexistente], ['hbt']);
  assert.deepEqual(r1, { ok: false, motivo: 'NO_DISPONIBLE', issues: [{ code: CODIGO_DE_PROBLEMA_DE_LA_ELECCION.NOT_AVAILABLE, path: 'choices[0]' }, { code: CODIGO_DE_PROBLEMA_DE_LA_ELECCION.NOT_AVAILABLE, path: 'choices[1]' }] });
  assert.deepEqual(revisarLaEleccion(items, [`HABITS:${PAZ}`], ['hbt']), { ok: false, motivo: 'SIN_EL_A3' });
  assert.deepEqual(revisarLaEleccion(items, ['HEALTH_DATA', `HABITS:${PAZ}`], ['a3', 'hbt-viejo']), { ok: false, motivo: 'TEXTO_VIEJO' });
  assert.equal(revisarLaEleccion(items, ['HEALTH_DATA', `HABITS:${PAZ}`], ['a3']).ok, false);
  const ok = revisarLaEleccion(items, ['HEALTH_DATA', `HABITS:${PAZ}`], ['a3', 'hbt']);
  assert.ok(ok.ok);
  assert.deepEqual(ok.ok && ok.elegidos.map((i) => i.clave), ['HEALTH_DATA', `HABITS:${PAZ}`]);
  // Lo ya dado no se vuelve a dar.
  const dado = loQueSePuedeCompartir(estado({ a3: { estado: 'VIGENTE', desde: '2026-02-01T00:00:00.000Z' } }), C_PAZ);
  assert.equal(revisarLaEleccion(dado, ['HEALTH_DATA'], ['a3']).ok, false);
});

test('TEST-CMP-008 · lo de otras áreas: solo lo elegido, sin extender en silencio lo que ya estaba (CMP-D7)', () => {
  // Mutación: reconstruir la lista desde los permisos (como API-RES-02) extiende el par de Ruiz al origen nuevo y la pone en rojo.
  const C_PAZ_2 = 'aaaaaaaa-0000-4000-8000-000000000005';
  const componentes = [
    { profesionalId: RUIZ, alcanceDeVinculoId: C_RUIZ, alcance: 'ENTRENAMIENTO' as const },
    { profesionalId: GOMEZ, alcanceDeVinculoId: C_GOMEZ, alcance: 'ANTROPOMETRIA' as const },
    { profesionalId: PAZ, alcanceDeVinculoId: C_PAZ, alcance: 'NUTRICION' as const },
    { profesionalId: VERA, alcanceDeVinculoId: C_PAZ_2, alcance: 'NUTRICION' as const },
  ];
  const antes: RenglonDeResumen[] = [{ profesionalId: RUIZ, alcanceDeVinculoId: C_RUIZ, origenId: C_PAZ_2, area: 'NUTRICION', nivel: 'SUMMARY', desde: '2026-10-01T00:00:00.000Z' }];
  const nuevos = renglonesAlCompartir({ componentes, anteriores: antes, elegidos: [{ profesionalId: GOMEZ, area: 'ENTRENAMIENTO', nivel: 'SUMMARY_AND_PLAN' }], ahora: '2026-11-15T12:00:00.000Z' });
  assert.deepEqual(nuevos.map((r) => `${r.profesionalId}:${r.origenId}:${r.nivel}:${r.desde}`).sort(), [`${GOMEZ}:${C_RUIZ}:SUMMARY_AND_PLAN:2026-11-15T12:00:00.000Z`, `${RUIZ}:${C_PAZ_2}:SUMMARY:2026-10-01T00:00:00.000Z`].sort());
  // Subir de nivel reinicia el «desde»; elegir lo mismo, lo conserva.
  const sube = renglonesAlCompartir({ componentes, anteriores: antes, elegidos: [{ profesionalId: RUIZ, area: 'NUTRICION', nivel: 'SUMMARY_AND_PLAN' }], ahora: '2026-11-15T12:00:00.000Z' });
  assert.deepEqual(sube.map((r) => `${r.origenId}:${r.nivel}:${r.desde}`).sort(), [`${C_PAZ}:SUMMARY_AND_PLAN:2026-11-15T12:00:00.000Z`, `${C_PAZ_2}:SUMMARY_AND_PLAN:2026-11-15T12:00:00.000Z`].sort());
  assert.deepEqual(textosDeLosResumenesElegidos([{ nivel: 'SUMMARY_AND_PLAN' }], { resumen: 'res', resumenYPlan: 'resp' }), { summary: null, summaryAndPlan: 'resp' });
  // Retirar un par saca solo ese par.
  assert.deepEqual(renglonesSinElPar(nuevos, componentes, RUIZ, 'NUTRICION').map((r) => r.profesionalId), [GOMEZ]);
});

test('TEST-CMP-009 · los hábitos: los que los reciben siguen, se suma lo elegido y lo desmarcado queda dicho', () => {
  // Mutación: no sumar a los que ya los recibían (los saca en silencio) la pone en rojo.
  const profesionales = [
    { profesionalId: RUIZ, componentes: [{ alcanceDeVinculoId: C_RUIZ, alcance: 'ENTRENAMIENTO' as const, estado: 'ACEPTADO' as const }] },
    { profesionalId: GOMEZ, componentes: [{ alcanceDeVinculoId: C_GOMEZ, alcance: 'ANTROPOMETRIA' as const, estado: 'ACEPTADO' as const }] },
    { profesionalId: PAZ, componentes: [{ alcanceDeVinculoId: C_PAZ, alcance: 'NUTRICION' as const, estado: 'ACEPTADO' as const }] },
  ];
  const anteriores = [{ profesionalId: RUIZ, alcanceDeVinculoId: C_RUIZ, incluido: true, incluidoDesde: '2026-05-01T00:00:00.000Z' }];
  const r = habitosAlCompartir({ profesionales, anteriores, elegidos: [PAZ], declinados: [GOMEZ], ahora: '2026-11-15T12:00:00.000Z' });
  assert.deepEqual(r.map((x) => `${x.profesionalId}:${x.incluido}:${x.incluidoDesde}`).sort(), [`${GOMEZ}:false:null`, `${PAZ}:true:2026-11-15T12:00:00.000Z`, `${RUIZ}:true:2026-05-01T00:00:00.000Z`].sort());
  // Retirarlos a Ruiz: Paz sigue; sin nadie, la autorización queda retirada (null).
  const sinRuiz = habitosSinElProfesional({ profesionales, anteriores: r, profesionalId: RUIZ, ahora: '2026-11-16T00:00:00.000Z' });
  assert.deepEqual(sinRuiz?.filter((x) => x.incluido).map((x) => x.profesionalId), [PAZ]);
  assert.equal(habitosSinElProfesional({ profesionales, anteriores, profesionalId: RUIZ, ahora: '2026-11-16T00:00:00.000Z' }), null);
});

test('TEST-CMP-010 · la versión cambia con lo que la propuesta mira, y no con el orden', () => {
  // Mutación: dejar afuera de la versión el estado de los hábitos (o de un B2) la pone en rojo.
  const v = versionDeLoQueSeComparte(estado());
  assert.match(v, /^p[0-9a-z]+$/);
  assert.equal(versionDeLoQueSeComparte(estado({ componentes: [...estado().componentes].reverse() })), v);
  assert.notEqual(versionDeLoQueSeComparte(estado({ habitos: { estado: 'NUNCA', version: null, renglones: null, hayHabitos: false } })), v);
  assert.notEqual(versionDeLoQueSeComparte(estado({ a3: { estado: 'VIGENTE', desde: '2026-02-01T00:00:00.000Z' } })), v);
  assert.notEqual(versionDeLoQueSeComparte(estado({ historia: new Map([[C_PAZ, { estado: 'VIGENTE', version: 1, desde: '2026-11-15T00:00:00.000Z' }]]) })), v);
});

test('TEST-CMP-011 · las claves y los contratos son estrictos', () => {
  // Mutación: aceptar una clave en mayúsculas o con otra forma la pone en rojo.
  assert.deepEqual(leerClave(claveDe.resumen(PAZ, 'NUTRICION')), { tipo: 'SUMMARY', profesionalId: PAZ, area: 'NUTRICION' });
  assert.deepEqual(leerClave(claveDe.area(C_PAZ)), { tipo: 'AREA_CONSENT', componenteId: C_PAZ });
  assert.equal(leerClave(`SUMMARY:${C_PAZ.toUpperCase()}:NUTRICION`), null);
  assert.equal(leerClave('HABITS:otro'), null);
  const pedido = { relationshipId: C_PAZ, expectedVersion: 'pabc', acceptedTextIds: ['a3'], choices: ['HEALTH_DATA'] };
  assert.ok(CompartirLoElegidoRequestSchema.safeParse(pedido).success);
  assert.ok(!CompartirLoElegidoRequestSchema.safeParse({ ...pedido, choices: ['HEALTH_DATA', 'HEALTH_DATA'] }).success, 'una sola vez');
  assert.ok(!CompartirLoElegidoRequestSchema.safeParse({ ...pedido, choices: [] }).success, 'al menos una');
  assert.ok(!CompartirLoElegidoRequestSchema.safeParse({ ...pedido, extra: 1 }).success, 'estricto');
  assert.ok(!DejarDeCompartirUnaCosaRequestSchema.safeParse({ key: 'HEALTH_DATA' }).success, 'el A3 se retira en Privacidad');
  assert.ok(!DejarDeCompartirUnaCosaRequestSchema.safeParse({ key: claveDe.historia(C_PAZ) }).success, 'la historia anterior, con API-HIA-03');
  assert.ok(DejarDeCompartirUnaCosaRequestSchema.safeParse({ key: claveDe.habitos(PAZ) }).success);
  const respuesta = {
    data: {
      relationshipId: null,
      version: 'p1',
      items: [{ kind: 'HABITS', key: claveDe.habitos(PAZ), given: false, since: null, offered: true, preselected: true, textId: 'hbt', recipient: { identityId: PAZ, displayName: 'Lic. Paz' } }],
      texts: [{ id: 'hbt', kind: 'HABITS', title: 'T', text: 'x', textHash: 'a'.repeat(64), effectiveFrom: '2026-11-01T00:00:00.000Z', approval: 'PENDING_APPROVAL' }],
    },
  };
  assert.ok(LoQueSePuedeCompartirResponseSchema.safeParse(respuesta).success);
  assert.ok(!LoQueSePuedeCompartirResponseSchema.safeParse({ data: { ...respuesta.data, items: [{ ...respuesta.data.items[0], note: 'x' }] } }).success, 'ningún lugar para una nota');
});

test('TEST-CMP-012 · el vocabulario: ubicar, nunca calificar; sin «%», sin «asesorado» y sin prometer «todos tus datos»', () => {
  // Mutación: un texto con «cumplimiento», «%», «asesorado» o «todos tus datos» la pone en rojo.
  for (const t of textosDeCompartir()) {
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /asesorad|racha|puntaje|adherencia|cumplimiento/i, t);
    assert.doesNotMatch(t, /todos tus datos|toda tu información|puede ver todo/i, t);
  }
  assert.equal(COPY_COMPARTIR.aceptarYCompartir, 'Aceptar y compartir');
  assert.equal(COPY_COMPARTIR.elegir, 'Elegir qué compartir');
  assert.match(COPY_COMPARTIR.nuncaSeComparte, /notas privadas/);
});

test('TEST-CMP-014 · lo retirado de a una cosa, lo bajado de nivel y un «Ahora no» no vuelven marcados; lo nunca decidido, sí (CMP-D3)', () => {
  // Mutación: decidir lo marcado solo con la versión vigente (sin las decisiones anteriores) la pone en rojo: Ruiz
  // ← Antropometría, retirado desde «Quién ve qué» con otras cosas todavía compartidas, volvería marcado.
  const renglon = (profesionalId: string, alcanceDeVinculoId: string, origenId: string, area: RenglonDeResumen['area'], nivel: RenglonDeResumen['nivel']): RenglonDeResumen => ({ profesionalId, alcanceDeVinculoId, origenId, area, nivel, desde: '2026-10-01T00:00:00.000Z' });
  const historicos = [
    renglon(RUIZ, C_RUIZ, C_GOMEZ, 'ANTROPOMETRIA', 'SUMMARY'), // lo retiró (la autorización sigue ACTIVA con otra cosa)
    renglon(GOMEZ, C_GOMEZ, C_RUIZ, 'ENTRENAMIENTO', 'SUMMARY_AND_PLAN'), // lo bajó a «resumen»
    renglon(RUIZ, C_RUIZ, C_VERA, 'NUTRICION', 'SUMMARY_AND_PLAN'), // se fue porque Vera terminó: no lo decidió ella
  ];
  const e = estado({
    a3: { estado: 'VIGENTE', desde: '2026-02-01T00:00:00.000Z' },
    resumenes: { estado: 'ACTIVA', version: 5, renglones: [renglon(GOMEZ, C_GOMEZ, C_RUIZ, 'ENTRENAMIENTO', 'SUMMARY')] },
    habitos: { estado: 'ACTIVA', version: 4, renglones: [{ profesionalId: PAZ, alcanceDeVinculoId: C_PAZ, incluido: true, incluidoDesde: '2026-11-01T00:00:00.000Z' }], hayHabitos: true },
    // Antes de un retiro de todo, Ruiz recibía los hábitos (la versión vigente ya no lo nombra).
    decisiones: { resumenes: historicos, habitos: [{ profesionalId: RUIZ, alcanceDeVinculoId: C_RUIZ }], planesNoPorAhora: [], habitosNoPorAhora: [] },
  });
  const items = loQueSePuedeCompartir(e, null);
  const marca = (k: string) => [de(items, k).ofrecido, de(items, k).preseleccionado];
  assert.deepEqual(marca(`SUMMARY:${RUIZ}:ANTROPOMETRIA`), [true, false], 'retirado de a uno: sin marcar');
  assert.deepEqual(marca(`SUMMARY:${GOMEZ}:ENTRENAMIENTO`), [true, false], 'bajado de nivel: subirlo no va marcado');
  assert.deepEqual(marca(`SUMMARY:${RUIZ}:NUTRICION`), [true, true], 'Paz es nueva en Nutrición: nunca lo decidió');
  assert.deepEqual(marca(`SUMMARY:${PAZ}:ENTRENAMIENTO`), [true, true], 'nunca decidido: marcado');
  assert.deepEqual(marca(`HABITS:${RUIZ}`), [true, false], 'los hábitos que se le retiraron antes de un retiro de todo');
  assert.deepEqual(marca(`HABITS:${GOMEZ}`), [true, true], 'a Gómez nunca se le preguntó');
  // Lo que ve hoy, aunque se ofrezca más: el nivel dado (lo dice «Quién ve qué»).
  const bajo = de(items, `SUMMARY:${GOMEZ}:ENTRENAMIENTO`);
  assert.deepEqual(bajo.tipo === 'SUMMARY' && [bajo.nivel, bajo.nivelDado], ['SUMMARY_AND_PLAN', 'SUMMARY']);
  const nunca = de(items, `SUMMARY:${PAZ}:ENTRENAMIENTO`);
  assert.equal(nunca.tipo === 'SUMMARY' && nunca.nivelDado, null);

  // Un «Ahora no» al pedido de un profesional (de ver un plan o los hábitos): lo que pidió no va marcado.
  const conNo = loQueSePuedeCompartir(estado({ a3: e.a3, decisiones: { ...SIN_DECISIONES_ANTERIORES, planesNoPorAhora: [{ profesionalId: RUIZ, area: 'NUTRICION' }], habitosNoPorAhora: [GOMEZ] } }), null);
  assert.deepEqual([de(conNo, `SUMMARY:${RUIZ}:NUTRICION`).preseleccionado, de(conNo, `HABITS:${GOMEZ}`).preseleccionado], [false, false]);
  assert.equal(de(conNo, `SUMMARY:${GOMEZ}:NUTRICION`).preseleccionado, true, 'el «no» es a ese profesional y esa área');
  // Al aceptar a Paz, lo recíproco que la persona retiró antes tampoco vuelve marcado.
  const alAceptar = loQueSePuedeCompartir(estado({ a3: e.a3, decisiones: { ...SIN_DECISIONES_ANTERIORES, resumenes: [renglon(RUIZ, C_RUIZ, C_PAZ, 'NUTRICION', 'SUMMARY_AND_PLAN')] } }), C_PAZ);
  assert.equal(de(alAceptar, `SUMMARY:${RUIZ}:NUTRICION`).preseleccionado, false);
  assert.equal(de(alAceptar, `SUMMARY:${GOMEZ}:NUTRICION`).preseleccionado, true);
});
