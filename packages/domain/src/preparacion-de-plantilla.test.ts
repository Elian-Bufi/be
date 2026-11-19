/**
 * PLT (DL-182) · la preparación de una plantilla de entrenamiento, sin persona: lo que impide guardarla, lo que queda
 * para completar al adaptarla, las cargas escritas, la forma de lo que se guarda y el contrato de sus nueve operaciones.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { EstructuraDePlanDeEntrenamientoEntradaSchema, type EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import {
  CrearPreparacionDePlantillaRequestSchema,
  GuardarPreparacionDePlantillaRequestSchema,
  PreparacionDePlantillaSchema,
  RevisionDePreparacionResponseSchema,
  VersionDeLaPreparacionRequestSchema,
} from './contratos-plantillas';
import { normalizarEstructuraDeEntrenamiento } from './plan-de-entrenamiento';
import { CodigoDeProblemaDeLaPlantilla, ESTRUCTURA_EN_BLANCO, ejerciciosConCargaEscrita, paraCompletarAlAdaptar, problemasParaGuardarLaPlantilla, sinCambiosFrenteALaBase } from './preparacion-de-plantilla';

const EJERCICIO = '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02';
const con = (e: unknown): EstructuraDePlanDeEntrenamientoEntrada => EstructuraDePlanDeEntrenamientoEntradaSchema.parse(e);
const prescripcion = (extra: Record<string, unknown> = {}) => ({ exerciseVersionId: EJERCICIO, sets: [{ repetitions: { value: 8 } }], intensity: null, ...extra });
const normalizado = (e: EstructuraDePlanDeEntrenamientoEntrada) => {
  const r = normalizarEstructuraDeEntrenamiento(e, randomUUID);
  if (!r.ok) throw new Error('no normaliza');
  return r.contenido;
};

test('PLT-D08 · lo que impide guardar: el nombre de una plantilla nueva y al menos una sesión; nada de una persona', () => {
  const vacia = con(ESTRUCTURA_EN_BLANCO);
  assert.deepEqual(problemasParaGuardarLaPlantilla({ nueva: true, nombre: '  ', estructura: vacia }), [
    { code: 'TEMPLATE_NAME_REQUIRED', path: 'name' },
    { code: 'TEMPLATE_SESSION_REQUIRED', path: 'blocks' },
  ]);
  // El nombre de una existente es el de la plantilla (PLT-D05): no se mira.
  assert.deepEqual(problemasParaGuardarLaPlantilla({ nueva: false, nombre: '', estructura: vacia }), [{ code: 'TEMPLATE_SESSION_REQUIRED', path: 'blocks' }]);
  // Una sesión vacía alcanza para guardar: lo que le falta queda para completar al adaptarla.
  const unaSesion = con({ blocks: [{ label: 'Fase 1', sessions: [{ label: 'Sesión A', prescriptions: [] }] }] });
  assert.deepEqual(problemasParaGuardarLaPlantilla({ nueva: true, nombre: 'Fuerza 3 días', estructura: unaSesion }), []);
  // También dentro de un microciclo.
  const enMicrociclo = con({ blocks: [{ label: 'Fase 1', microcycles: [{ label: 'Semana 1', sessions: [{ label: 'A', prescriptions: [] }] }] }] });
  assert.deepEqual(problemasParaGuardarLaPlantilla({ nueva: true, nombre: 'x', estructura: enMicrociclo }), []);
  assert.deepEqual(Object.values(CodigoDeProblemaDeLaPlantilla).sort(), ['TEMPLATE_ARCHIVED', 'TEMPLATE_NAME_REQUIRED', 'TEMPLATE_NAME_TAKEN', 'TEMPLATE_SESSION_REQUIRED', 'TEMPLATE_UNCHANGED']);
});

test('PLT-D09 · lo incompleto de un plan queda para completar al adaptarla, y sin sesiones no se repite lo que impide', () => {
  const contenido = normalizado(
    con({
      blocks: [
        { label: 'Fase 1', sessions: [{ label: 'A', prescriptions: [] }, { label: 'B', prescriptions: [prescripcion()], exerciseGroups: [{ groupId: 'g1', label: 'Vacío', kind: 'SEQUENTIAL' }] }] },
        { label: 'Fase 2', sessions: [] },
      ],
    }),
  );
  assert.deepEqual(
    paraCompletarAlAdaptar(contenido).map((x) => `${x.code} ${x.path}`),
    ['SESSION_REQUIRED blocks[1].sessions', 'PRESCRIPTION_REQUIRED blocks[0].sessions[0].prescriptions', 'EXERCISE_GROUP_EMPTY blocks[0].sessions[1].exerciseGroups[0]'],
  );
  // Sin ninguna sesión, «la fase no tiene sesiones» ya lo dice TEMPLATE_SESSION_REQUIRED, que impide guardar.
  assert.deepEqual(paraCompletarAlAdaptar(normalizado(con(ESTRUCTURA_EN_BLANCO))), []);
  assert.deepEqual(paraCompletarAlAdaptar(normalizado(con({ blocks: [] }))), []);
});

test('D-2 de DL-108 · se cuentan los ejercicios con una carga escrita, en lo general o en una serie', () => {
  const e = con({
    blocks: [
      {
        label: 'Fase 1',
        sessions: [
          {
            label: 'A',
            prescriptions: [
              prescripcion({ suggestedLoad: { value: 60, unit: 'kg' } }),
              prescripcion({ sets: [{ repetitions: { value: 8 }, suggestedLoad: { value: 40, unit: 'kg' } }] }),
              // `null` en una serie es «sin objetivo»: no es una carga escrita.
              prescripcion({ sets: [{ repetitions: { value: 8 }, suggestedLoad: null }] }),
              prescripcion(),
            ],
          },
        ],
        microcycles: [],
      },
    ],
  });
  assert.equal(ejerciciosConCargaEscrita(e), 2);
  assert.equal(ejerciciosConCargaEscrita(con(ESTRUCTURA_EN_BLANCO)), 0);
});

test('PLT-D10 · sin cambios frente a la versión de base: la misma estructura y el mismo interruptor, sin mirar el orden de las claves', () => {
  const base = { blocks: [{ blockId: 'b1', label: 'Fase 1', purpose: null, microcycles: [], sessions: [{ sessionId: 's1', label: 'A', instructions: null, prescriptions: [] }] }] };
  const igualOtroOrden = { blocks: [{ sessions: [{ prescriptions: [], instructions: null, label: 'A', sessionId: 's1' }], microcycles: [], purpose: null, label: 'Fase 1', blockId: 'b1' }] };
  assert.equal(sinCambiosFrenteALaBase({ estructura: base, conCargas: false }, { estructuraQueIria: igualOtroOrden, conCargas: false }), true);
  // Prender el interruptor de las cargas es un cambio, aunque la estructura sea la misma.
  assert.equal(sinCambiosFrenteALaBase({ estructura: base, conCargas: false }, { estructuraQueIria: base, conCargas: true }), false);
  const otroNombre = structuredClone(base);
  otroNombre.blocks[0]!.sessions[0]!.label = 'B';
  assert.equal(sinCambiosFrenteALaBase({ estructura: base, conCargas: false }, { estructuraQueIria: otroNombre, conCargas: false }), false);
  assert.equal(CodigoDeProblemaDeLaPlantilla.TEMPLATE_UNCHANGED, 'TEMPLATE_UNCHANGED');
});

test('PLT-D10 · la base guardada tal como llegó (API-TPL-01, sin identificadores ni campos omitidos) frente a su preparación sin tocar: sin cambios', () => {
  // Lo que guardó «Guardar como plantilla»: la entrada, sin cargas (D-2), con campos omitidos y un ejercicio sin identificador.
  const base = con({
    blocks: [
      {
        blockId: 'b1',
        label: 'Fase 1',
        sessions: [{ sessionId: 's1', label: 'A', prescriptions: [prescripcion({ sets: [{ repetitions: { value: 8 }, setKind: 'WARM_UP' }, { repetitions: { value: 6 } }] }), prescripcion()] }],
      },
    ],
  });
  // Lo que guarda la preparación al abrirla (API-TPL-07): la misma, normalizada y con los identificadores que faltaban.
  const abierta = { blocks: normalizado(base).blocks };
  assert.equal(sinCambiosFrenteALaBase({ estructura: base, conCargas: false }, { estructuraQueIria: abierta, conCargas: false }), true);
  // Un cambio real sigue siendo un cambio: las repeticiones, el calentamiento, un ejercicio menos, una fase más.
  type Editable = { blocks: { label: string; sessions: { prescriptions: { sets: Record<string, unknown>[] }[] }[] }[] };
  const cambiar = (f: (e: Editable) => void): boolean => {
    const e = structuredClone(abierta) as unknown as Editable;
    f(e);
    return sinCambiosFrenteALaBase({ estructura: base, conCargas: false }, { estructuraQueIria: e, conCargas: false });
  };
  assert.equal(cambiar((e) => void (e.blocks[0]!.sessions[0]!.prescriptions[0]!.sets[1]!.repetitions = { value: 7 })), false);
  assert.equal(cambiar((e) => void delete e.blocks[0]!.sessions[0]!.prescriptions[0]!.sets[0]!.setKind), false);
  assert.equal(cambiar((e) => void e.blocks[0]!.sessions[0]!.prescriptions.pop()), false);
  assert.equal(cambiar((e) => void e.blocks.push({ label: 'Fase 2', sessions: [] })), false);
  // Los bloques de la sesión (DL-181) son contenido: agruparlos «En vueltas» es un cambio.
  assert.equal(
    cambiar((e) => {
      const s = e.blocks[0]!.sessions[0]! as unknown as { exerciseGroups?: unknown[]; prescriptions: Record<string, unknown>[] };
      s.exerciseGroups = [{ groupId: 'g1', label: 'Pierna', kind: 'ROUNDS', rounds: 3 }];
      for (const p of s.prescriptions) p.exerciseGroupId = 'g1';
    }),
    false,
  );
});

test('lo que se guarda en la preparación (la estructura normalizada, con identificadores) es una estructura de entrada válida', () => {
  const contenido = normalizado(
    con({
      blocks: [
        {
          label: 'Fase 1',
          purpose: 'Base',
          sessions: [
            {
              label: 'A',
              instructions: 'Movilidad',
              prescriptions: [
                prescripcion({ intensity: { criterion: 'RIR', target: { value: 2 } }, sets: [{ repetitions: { min: 8, max: 12 }, rir: 1, setKind: 'WARM_UP' }, { repetitions: { value: 8 } }], exerciseGroupId: 'g1' }),
                prescripcion({ exerciseGroupId: 'g1' }),
              ],
              exerciseGroups: [{ groupId: 'g1', label: 'Pierna', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }],
            },
          ],
        },
      ],
    }),
  );
  const r = EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse({ blocks: contenido.blocks });
  assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  // Vuelve a normalizarse igual: los identificadores que le puso el servidor se conservan entre guardados.
  assert.deepEqual(normalizado(r.data!), contenido);
});

test('el contrato de la preparación: estricto, sin nada de una persona, y el nombre puede quedar vacío mientras se prepara', () => {
  assert.equal(CrearPreparacionDePlantillaRequestSchema.safeParse({}).success, true);
  assert.equal(CrearPreparacionDePlantillaRequestSchema.safeParse({ fromTemplateVersionId: EJERCICIO }).success, true);
  assert.equal(CrearPreparacionDePlantillaRequestSchema.safeParse({ adviseeId: EJERCICIO }).success, false);
  const guardar = { expectedVersion: 'v1', structure: ESTRUCTURA_EN_BLANCO };
  assert.equal(GuardarPreparacionDePlantillaRequestSchema.safeParse({ ...guardar, name: '' }).success, true);
  assert.equal(GuardarPreparacionDePlantillaRequestSchema.safeParse({ ...guardar, name: 'x'.repeat(121) }).success, false);
  for (const ajeno of ['objectiveVersionId', 'nextReviewAt', 'agenda']) assert.equal(GuardarPreparacionDePlantillaRequestSchema.safeParse({ ...guardar, [ajeno]: null }).success, false, ajeno);
  assert.equal(VersionDeLaPreparacionRequestSchema.safeParse({ expectedVersion: 'v0' }).success, false);
  const forma = Object.keys(PreparacionDePlantillaSchema.shape).sort();
  assert.deepEqual(forma, ['baseVersionId', 'baseVersionNumber', 'copySuggestedLoads', 'createdAt', 'description', 'draftId', 'exercises', 'name', 'sessionCount', 'structure', 'templateId', 'templateState', 'updatedAt', 'version']);
  assert.equal(RevisionDePreparacionResponseSchema.safeParse({ data: { valid: true, version: 'v2', issues: [], toComplete: [] } }).success, true);
});

test('el OpenAPI declara las nueve operaciones de la preparación, con su método y su ruta, y ninguna «plan-drafts»', async () => {
  const { OPERACIONES } = await import('./openapi');
  const de = (id: string) => OPERACIONES.find((o) => o.id === id);
  const esperadas: readonly (readonly [string, string, string, boolean])[] = [
    ['API-TPL-06', 'post', '/training/plan-template-drafts', true],
    ['API-TPL-07', 'put', '/training/plan-templates/{templateId}/draft', false],
    ['API-TPL-08', 'get', '/training/plan-template-drafts', false],
    ['API-TPL-09', 'get', '/training/plan-template-drafts/{draftId}', false],
    ['API-TPL-10', 'patch', '/training/plan-template-drafts/{draftId}', false],
    ['API-TPL-11', 'post', '/training/plan-template-drafts/{draftId}/review', false],
    ['API-TPL-12', 'post', '/training/plan-template-drafts/{draftId}/publish', true],
    ['API-TPL-13', 'post', '/training/plan-template-drafts/{draftId}/discard', true],
    ['API-TPL-14', 'get', '/training/plan-templates/{templateId}/versions', false],
  ];
  for (const [id, metodo, ruta, idempotencia] of esperadas) {
    assert.deepEqual([id, de(id)?.metodo, de(id)?.ruta, de(id)?.idempotencia], [id, metodo, ruta, idempotencia]);
    assert.match(de(id)?.fuente ?? '', /DL-182/, id);
  }
  assert.equal(OPERACIONES.some((o) => o.ruta.includes('plan-drafts')), false);
  // Guardar la plantilla: lo que impide es 422 OPERATION_NOT_READY; el nombre tomado, 409 como en API-TPL-01.
  assert.deepEqual(de('API-TPL-12')?.errores[422], ['OPERATION_NOT_READY', 'TEMPLATE_ARCHIVED']);
  assert.ok(de('API-TPL-12')?.errores[409]?.includes('TEMPLATE_NAME_TAKEN'));
});
