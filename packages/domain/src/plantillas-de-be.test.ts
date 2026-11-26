/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-3 (DL-199) · las Plantillas de BE: TEST-ET3-01 a TEST-ET3-06.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EstructuraDePlanDeEntrenamientoEntradaSchema } from './contratos-entrenamiento';
import { PlanificacionDeLaPlantillaSchema } from './contratos-plantillas';
import { ListaDePlantillasDeBeResponseSchema, PlanDesdePlantillaDeBeResponseSchema } from './contratos-plantillas-de-be';
import {
  armarPlantillaDeBe,
  conLasCargasDeLaPlantillaDeBe,
  ejerciciosDeLaPlantillaDeBe,
  PLANTILLAS_DE_BE,
  plantillaDeBe,
  plantillaDeBeParaLaApi,
  renglonDelEjercicioDeBe,
  resumenDeLasCargas,
  semanasDeLaPlantillaDeBe,
  type EjercicioResuelto,
} from './plantillas-de-be';
import type { UnoRMVigente } from './repeticion-maxima';

const catalogoCompleto = (): Map<string, EjercicioResuelto> => {
  const m = new Map<string, EjercicioResuelto>();
  for (const p of PLANTILLAS_DE_BE)
    for (const f of p.fases) for (const s of f.sesiones) for (const e of s.ejercicios) m.set(e.wger, { exerciseId: `ej-${e.wger}`, exerciseVersionId: `v-${e.wger}`, nombre: e.nombre });
  return m;
};

test('TEST-ET3-01: las cuatro de la semilla, una por división, con claves únicas, dos fases y sus semanas', () => {
  assert.equal(PLANTILLAS_DE_BE.length, 4);
  assert.deepEqual(PLANTILLAS_DE_BE.map((p) => p.division), ['FULL_BODY', 'UPPER_LOWER', 'PUSH_PULL_LEGS', 'BODY_PART_SPLIT']);
  assert.equal(new Set(PLANTILLAS_DE_BE.map((p) => p.clave)).size, 4);
  for (const p of PLANTILLAS_DE_BE) {
    assert.ok(p.fases.length >= 2, p.clave);
    assert.equal(semanasDeLaPlantillaDeBe(p), p.fases.reduce((n, f) => n + f.semanas, 0));
    assert.ok(p.fases.every((f) => f.sesiones.length === p.fases[0]!.sesiones.length), `${p.clave}: las fases tienen las mismas sesiones`);
    for (const f of p.fases)
      for (const s of f.sesiones)
        for (const e of s.ejercicios) {
          assert.ok(e.porcentaje === null || (e.porcentaje >= 30 && e.porcentaje <= 100), `${e.nombre}: % RM entre 30 y 100 (ET1-D16)`);
          assert.ok(e.series >= 1 && e.series <= 20 && e.descanso >= 30);
        }
  }
  assert.equal(plantillaDeBe('BE-TORSO-PIERNA', 1)?.diasPorSemana, 4);
  assert.equal(plantillaDeBe('BE-TORSO-PIERNA', 2), null);
});

test('TEST-ET3-02: cada número de wger existe en el catálogo base, con el mismo nombre', () => {
  const csv = readFileSync(join(__dirname, '..', '..', '..', 'prisma', 'datos', 'catalogo-base', 'clasificacion-de-ejercicios.csv'), 'utf8');
  const nombres = new Map(csv.split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(';')).map((c) => [c[0]!, c[1]!]));
  for (const p of PLANTILLAS_DE_BE)
    for (const f of p.fases) for (const s of f.sesiones) for (const e of s.ejercicios) assert.equal(nombres.get(e.wger), e.nombre, `${p.clave} · wger ${e.wger}`);
  assert.ok(ejerciciosDeLaPlantillaDeBe(PLANTILLAS_DE_BE[0]!).length >= 10);
});

test('TEST-ET3-03: armada, la estructura y la planificación son las del contrato, con aproximaciones, progresión e intensidad', () => {
  for (const p of PLANTILLAS_DE_BE) {
    const a = armarPlantillaDeBe(p, catalogoCompleto());
    assert.deepEqual(a.noDisponibles, []);
    assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse(a.estructura).success, true, p.clave);
    assert.equal(PlanificacionDeLaPlantillaSchema.safeParse(a.planificacion).success, true, p.clave);
    assert.equal(a.planificacion.intensity, 'PERCENT_RM');
    assert.equal(a.planificacion.weeks, semanasDeLaPlantillaDeBe(p));
    assert.equal(a.planificacion.phases.length, p.fases.length);
    assert.ok((a.planificacion.warmUps ?? []).length > 0);
    assert.equal((a.planificacion.progressions ?? []).length, p.fases.length);
    // Los accesorios van sin intensidad (ET3-D04): ni criterio ni herencia.
    const sinIntensidad = new Set(a.planificacion.withoutIntensity ?? []);
    for (const b of a.estructura.blocks) for (const s of b.sessions ?? []) for (const pr of s.prescriptions) assert.equal(pr.intensity === null, sinIntensidad.has(pr.prescriptionId!));
  }
  // Lo que no está en el catálogo de este entorno no entra, y se dice (ET3-D05).
  const sinPrensa = catalogoCompleto();
  sinPrensa.delete('371');
  const a = armarPlantillaDeBe(PLANTILLAS_DE_BE[0]!, sinPrensa);
  assert.deepEqual(a.noDisponibles, ['Prensa de piernas']);
  assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse(a.estructura).success, true);
});

test('TEST-ET3-04: las cargas en % RM salen del 1RM de la persona; sin 1RM, quedan para completar y se dice', () => {
  const catalogo = catalogoCompleto();
  const a = armarPlantillaDeBe(PLANTILLAS_DE_BE[0]!, catalogo);
  const porVersion = new Map([...catalogo.values()].map((c) => [c.exerciseVersionId, { exerciseId: c.exerciseId, nombre: c.nombre }]));
  const vigente: UnoRMVigente = { origen: 'CALIBRATION', valor: { value: 100, unit: 'kg' }, fecha: '2026-11-25', banda: null, serie: null, entryId: 'x' };
  const { estructura, cargas } = conLasCargasDeLaPlantillaDeBe(a, porVersion, new Map([['ej-615', vigente]]));
  const sentadilla = cargas.find((c) => c.nombre === 'Sentadilla trasera con barra' && c.estado === 'RESUELTA');
  assert.ok(sentadilla && sentadilla.estado === 'RESUELTA');
  assert.deepEqual(sentadilla.carga, { value: 65, unit: 'kg' });
  assert.equal(sentadilla.base, '65 % de 100 kg = 65 kg');
  const pr = estructura.blocks[0]!.sessions![0]!.prescriptions[0]!;
  assert.deepEqual(pr.suggestedLoad, { value: 65, unit: 'kg' });
  assert.match(pr.intensity!.target.reference!.description, /1RM 100 kg/);
  // Tres aproximaciones arriba de las efectivas, sin RIR y crecientes, menores que la de trabajo.
  const previas = pr.sets.filter((s) => s.setKind === 'WARM_UP');
  assert.equal(previas.length, 3);
  assert.ok(previas.every((s, i) => s.rir === null && s.suggestedLoad!.value < 65 && (i === 0 || s.suggestedLoad!.value > previas[i - 1]!.suggestedLoad!.value)));
  // El press de banca no tiene 1RM: sin carga y en la lista.
  const banca = cargas.filter((c) => c.nombre === 'Press de banca plano con barra');
  assert.ok(banca.length > 0 && banca.every((c) => c.estado === 'SIN_UNO_RM'));
  const pb = estructura.blocks[0]!.sessions![0]!.prescriptions[1]!;
  assert.equal(pb.suggestedLoad, null);
  assert.equal(pb.sets.some((s) => s.setKind === 'WARM_UP'), false);
  assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse(estructura).success, true);
  assert.match(resumenDeLasCargas(cargas), /de \d+ cargas en % RM salen del 1RM de la persona/);
  assert.equal(resumenDeLasCargas([]), 'La plantilla no tiene ejercicios en % RM.');
});

test('TEST-ET3-05: la lectura para la pantalla y el contrato de la respuesta', () => {
  const catalogo = catalogoCompleto();
  const api = PLANTILLAS_DE_BE.map((p) => plantillaDeBeParaLaApi(p, catalogo, 'PUBLISHED'));
  assert.equal(ListaDePlantillasDeBeResponseSchema.safeParse({ data: api }).success, true);
  assert.equal(api[0]!.validation, 'PROPOSAL');
  assert.match(api[0]!.phases[0]!.progression ?? '', /2,5/);
  assert.equal(api[0]!.phases[0]!.sessions[0]!.exercises[0]!.prescription, '3 × 10 · 65 % RM');
  assert.equal(renglonDelEjercicioDeBe({ wger: '1', nombre: 'x', series: 3, repeticiones: { min: 8, max: 10 }, porcentaje: null, descanso: 90 }), '3 × 8–10');
  const sinCatalogo = plantillaDeBeParaLaApi(PLANTILLAS_DE_BE[0]!, new Map(), 'WITHDRAWN');
  assert.equal(sinCatalogo.phases[0]!.sessions[0]!.exercises[0]!.exerciseId, null);
  assert.equal(
    PlanDesdePlantillaDeBeResponseSchema.shape.beTemplate.safeParse({ key: 'BE-CUERPO-COMPLETO', version: 1, loads: [{ prescriptionId: 'a', exerciseName: 'x', percentRm: 70, status: 'WITHOUT_ONE_REP_MAX' }], unavailableExercises: [] }).success,
    true,
  );
});

test('TEST-ET3-06: en pantalla, sin las palabras que BE no usa y todo «%» con su base', () => {
  const texto = JSON.stringify(PLANTILLAS_DE_BE).toLowerCase();
  for (const w of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', 'volumen']) assert.equal(texto.includes(w), false, w);
  const api = JSON.stringify(PLANTILLAS_DE_BE.map((p) => plantillaDeBeParaLaApi(p, catalogoCompleto(), 'PUBLISHED')));
  for (const m of api.matchAll(/(\d+) %(?! RM| de la carga)/g)) assert.fail(`«${m[0]}» sin su base`);
});
