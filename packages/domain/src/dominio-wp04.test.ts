/**
 * WP-04 — pruebas unitarias del dominio (docs/paquetes/WP-04.md §6):
 * - TEST-RNF-DAT-001: una prueba por transición declarada y por las prohibidas de las máquinas de Versión de plan
 *   (06 §10.7) y de Proceso (06 §8). La base repite las listas blancas con triggers (maquinas-wp04.int-spec.ts);
 * - reapertura: no hay salida desde ACTIVADA (INV-06-109; 06:4307);
 * - capacidad REG-06-91, revisión válida REG-06-141/144 y pendiente REG-06-150;
 * - jerarquía REG-06-118/122, instantánea REG-06-13/105 y contraste descriptivo REG-06-125 (TEST-NUT-002, 005);
 * - TEST-PRJ-009: ningún schema de nutrición tiene puntaje de adherencia.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { evaluarAdmision, capacidadEfectiva } from './capacidad';
import * as contratosNutricion from './contratos-nutricion';
import { paresPermitidos } from './maquina';
import {
  TRANSICIONES_DE_VERSION_DE_PLAN,
  construirContraste,
  construirInstantanea,
  evaluarIngestaPrescripta,
  evaluarTransicionDePlan,
  fechasDelPeriodo,
  normalizarEstructura,
  problemasDeBorrador,
  problemasParaActivar,
  type ContenidoDePlan,
  type ElementoResuelto,
} from './nutricion';
import { TRANSICIONES_DE_PROCESO, clasificarActivacion, evaluarTransicionDeProceso, procesoVigente } from './proceso';
import { EFECTO_DE_RESULTADO, RESULTADOS_DE_REVISION, RESULTADO_DESDE_API, evaluarRevision, revisionPendiente } from './revision';
import { serializacionCanonica } from './versionado';

// ─── Versión de plan ─────────────────────────────────────────────────────────────────────────────

test('06 §10.7 · CrearBorrador, GuardarBorrador y ActivarVersion están declaradas y con guardas favorables se permiten', () => {
  assert.equal(evaluarTransicionDePlan(null, { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: true }).permitida, true);
  assert.equal(evaluarTransicionDePlan('BORRADOR', { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: true }).permitida, true);
  assert.equal(
    evaluarTransicionDePlan('BORRADOR', { transicion: 'ActivarVersion', validacionFavorable: true, instantaneaPreservable: true, capacidadFavorable: true }).permitida,
    true,
  );
});

test('INV-06-109 · no hay ninguna transición que salga de ACTIVADA: reabrir, editar o reactivar falla', () => {
  assert.deepEqual(
    paresPermitidos(TRANSICIONES_DE_VERSION_DE_PLAN).filter(([origen]) => origen === 'ACTIVADA'),
    [],
    'la lista blanca no tiene salida desde ACTIVADA (06:4307)',
  );
  assert.deepEqual(evaluarTransicionDePlan('ACTIVADA', { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: true }), {
    permitida: false,
    motivo: 'TRANSICION_NO_DECLARADA',
  });
  assert.deepEqual(
    evaluarTransicionDePlan('ACTIVADA', { transicion: 'ActivarVersion', validacionFavorable: true, instantaneaPreservable: true, capacidadFavorable: true }),
    { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' },
  );
  assert.deepEqual(evaluarTransicionDePlan('ACTIVADA', { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: true }), {
    permitida: false,
    motivo: 'TRANSICION_NO_DECLARADA',
  });
});

test('06 §10.7 · un borrador no se vuelve a crear sobre sí mismo', () => {
  assert.deepEqual(evaluarTransicionDePlan('BORRADOR', { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: true }), {
    permitida: false,
    motivo: 'TRANSICION_NO_DECLARADA',
  });
});

test('REG-06-104 · cada guarda de ActivarVersion desfavorable impide activar', () => {
  const base = { transicion: 'ActivarVersion' as const, validacionFavorable: true, instantaneaPreservable: true, capacidadFavorable: true };
  assert.deepEqual(evaluarTransicionDePlan('BORRADOR', { ...base, validacionFavorable: false }), { permitida: false, motivo: 'VALIDACION_DESFAVORABLE' });
  assert.deepEqual(evaluarTransicionDePlan('BORRADOR', { ...base, instantaneaPreservable: false }), { permitida: false, motivo: 'INSTANTANEA_NO_PRESERVABLE' });
  assert.deepEqual(evaluarTransicionDePlan('BORRADOR', { ...base, capacidadFavorable: false }), { permitida: false, motivo: 'CAPACIDAD_NO_DISPONIBLE' });
  assert.deepEqual(evaluarTransicionDePlan(null, { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: false }), {
    permitida: false,
    motivo: 'SIN_EVALUACION_U_OBJETIVO',
  });
  assert.deepEqual(evaluarTransicionDePlan('BORRADOR', { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: false }), { permitida: false, motivo: 'CAMBIOS_INVALIDOS' });
});

// ─── Proceso ─────────────────────────────────────────────────────────────────────────────────────

test('06 §8 · las cinco transiciones del Proceso con guardas favorables se permiten', () => {
  assert.equal(evaluarTransicionDeProceso(null, { transicion: 'AbrirProceso', actor: 'PROFESIONAL', activacionConfirmada: true, capacidadAdmite: true }).permitida, true);
  assert.equal(evaluarTransicionDeProceso('ABIERTO', { transicion: 'AplicarContinuidad', actor: 'PROFESIONAL', revisionValida: true }).permitida, true);
  assert.equal(evaluarTransicionDeProceso('ABIERTO', { transicion: 'CerrarPorRevision', actor: 'PROFESIONAL', revisionValida: true }).permitida, true);
  assert.equal(evaluarTransicionDeProceso('ABIERTO', { transicion: 'CerrarPorFinalizacionVinculo', actor: 'SISTEMA' }).permitida, true);
  assert.equal(evaluarTransicionDeProceso('ABIERTO', { transicion: 'CerrarPorCierreCuenta', actor: 'SISTEMA' }).permitida, true);
});

test('INV-06-86 · CERRADO es terminal: ninguna transición sale de CERRADO', () => {
  assert.deepEqual(
    paresPermitidos(TRANSICIONES_DE_PROCESO).filter(([origen]) => origen === 'CERRADO'),
    [],
  );
  assert.equal(evaluarTransicionDeProceso('CERRADO', { transicion: 'AplicarContinuidad', actor: 'PROFESIONAL', revisionValida: true }).permitida, false);
  assert.equal(evaluarTransicionDeProceso('CERRADO', { transicion: 'CerrarPorRevision', actor: 'PROFESIONAL', revisionValida: true }).permitida, false);
});

test('INV-06-74 · AbrirProceso solo desde inicio; los cierres del sistema no los ejecuta el profesional', () => {
  assert.equal(evaluarTransicionDeProceso('ABIERTO', { transicion: 'AbrirProceso', actor: 'PROFESIONAL', activacionConfirmada: true, capacidadAdmite: true }).permitida, false);
  assert.deepEqual(evaluarTransicionDeProceso('ABIERTO', { transicion: 'CerrarPorCierreCuenta', actor: 'PROFESIONAL' }), { permitida: false, motivo: 'ACTOR_NO_HABILITADO' });
});

test('INV-06-75, 85 · abrir exige capacidad; continuar o cerrar por revisión exige revisión válida', () => {
  assert.deepEqual(evaluarTransicionDeProceso(null, { transicion: 'AbrirProceso', actor: 'PROFESIONAL', activacionConfirmada: true, capacidadAdmite: false }), {
    permitida: false,
    motivo: 'CAPACIDAD_NO_ADMITE',
  });
  assert.deepEqual(evaluarTransicionDeProceso('ABIERTO', { transicion: 'CerrarPorRevision', actor: 'PROFESIONAL', revisionValida: false }), {
    permitida: false,
    motivo: 'SIN_REVISION_VALIDA',
  });
});

test('REG-06-64/78 · con un Proceso abierto, la activación es continuidad; sin él, es NUEVO', () => {
  assert.deepEqual(clasificarActivacion(null), { tipo: 'NUEVO' });
  assert.deepEqual(clasificarActivacion('p1'), { tipo: 'CONTINUIDAD', procesoId: 'p1' });
});

test('REG-06-66 · el Proceso vigente exige todas las condiciones; revocar el consentimiento lo vuelve no vigente sin cerrarlo', () => {
  const h = { estado: 'ABIERTO' as const, cuentasOperativas: true, verificado: true, habilitado: true, vinculoAceptado: true, consentimientoVigente: true };
  assert.equal(procesoVigente(h), true);
  assert.equal(procesoVigente({ ...h, consentimientoVigente: false }), false);
  assert.equal(procesoVigente({ ...h, vinculoAceptado: false }), false);
  assert.equal(procesoVigente({ ...h, estado: 'CERRADO' }), false);
});

// ─── Capacidad ───────────────────────────────────────────────────────────────────────────────────

test('REG-06-82 · sin configuración, SIN_LIMITE: nunca rechaza', () => {
  assert.deepEqual(capacidadEfectiva(null), { modo: 'SIN_LIMITE' });
  assert.equal(evaluarAdmision({ capacidad: capacidadEfectiva(null), asesoradosQueOcupan: ['a', 'b', 'c'], asesoradoId: 'd' }).admite, true);
});

test('REG-06-91 · LIMITADA admite si la ocupación proyectada no supera el límite', () => {
  assert.equal(evaluarAdmision({ capacidad: { modo: 'LIMITADA', limite: 2 }, asesoradosQueOcupan: ['a'], asesoradoId: 'b' }).admite, true);
  assert.deepEqual(evaluarAdmision({ capacidad: { modo: 'LIMITADA', limite: 1 }, asesoradosQueOcupan: ['a'], asesoradoId: 'b' }), {
    admite: false,
    motivo: 'EXCEDE_LIMITE',
    ocupacionActual: 1,
    limite: 1,
  });
});

test('REG-06-91 · un asesorado que ya cuenta no suma ni se rechaza; la sobreocupación rechaza todo nuevo', () => {
  assert.equal(evaluarAdmision({ capacidad: { modo: 'LIMITADA', limite: 1 }, asesoradosQueOcupan: ['a'], asesoradoId: 'a' }).admite, true);
  assert.deepEqual(evaluarAdmision({ capacidad: { modo: 'LIMITADA', limite: 1 }, asesoradosQueOcupan: ['a', 'b'], asesoradoId: 'c' }), {
    admite: false,
    motivo: 'SOBREOCUPADA',
    ocupacionActual: 2,
    limite: 1,
  });
});

// ─── Revisión ────────────────────────────────────────────────────────────────────────────────────

const revisionCompleta = {
  periodo: { inicio: '2026-09-01', fin: '2026-09-07' },
  evidencias: [{ type: 'EXECUTION', id: 'e1' }],
  interpretacion: 'Registró la mayoría de las comidas de la semana.',
  resultado: 'MANTENER',
  fundamento: 'Sin cambios necesarios en la planificación.',
  proximaAccion: 'Revisar en dos semanas.',
  proximaRevision: null,
};

test('REG-06-144 · la taxonomía tiene exactamente seis resultados y la API mapea uno a uno', () => {
  assert.deepEqual([...RESULTADOS_DE_REVISION], ['MANTENER', 'AJUSTAR', 'SUSTITUIR', 'REPROGRAMAR_REVISION', 'CAMBIAR_OBJETIVO', 'FINALIZAR']);
  assert.deepEqual(Object.values(RESULTADO_DESDE_API).sort(), [...RESULTADOS_DE_REVISION].sort());
});

test('REG-06-147 · solo FINALIZAR cierra el Proceso (INV-06-82, 83)', () => {
  for (const r of RESULTADOS_DE_REVISION) assert.equal(EFECTO_DE_RESULTADO[r].procesoDespues, r === 'FINALIZAR' ? 'CERRADO' : 'ABIERTO');
});

test('TEST-NUT-006 · la revisión válida exige evidencia, interpretación, resultado, fundamento y próxima acción o cierre', () => {
  assert.deepEqual(evaluarRevision(revisionCompleta), { valida: true, resultado: 'MANTENER' });
  assert.deepEqual(evaluarRevision({ ...revisionCompleta, evidencias: [], interpretacion: ' ', fundamento: '', proximaAccion: '' }), {
    valida: false,
    faltantes: ['EVIDENCIA', 'INTERPRETACION', 'FUNDAMENTO', 'PROXIMA_ACCION_O_CIERRE'],
  });
});

test('UC-P13 E05 · un resultado fuera de la taxonomía no es una revisión válida', () => {
  assert.deepEqual(evaluarRevision({ ...revisionCompleta, resultado: 'PROGRESAR' }), { valida: false, faltantes: ['RESULTADO_FUERA_DE_TAXONOMIA'] });
});

test('REG-06-146 · REPROGRAMAR_REVISION exige la fecha de la próxima revisión', () => {
  assert.deepEqual(evaluarRevision({ ...revisionCompleta, resultado: 'REPROGRAMAR_REVISION' }), { valida: false, faltantes: ['PROXIMA_REVISION'] });
  assert.equal(evaluarRevision({ ...revisionCompleta, resultado: 'REPROGRAMAR_REVISION', proximaRevision: '2026-09-21' }).valida, true);
});

test('REG-06-150 · el pendiente nace de una expectativa explícita y se resuelve solo con una revisión aplicada', () => {
  const base = { procesoAbierto: true, expectativa: { fechaObjetivo: '2026-09-10', registradaEn: '2026-09-01' }, revisionAplicadaPosterior: false, ahora: '2026-09-12' };
  assert.deepEqual(revisionPendiente(base), { pendiente: true, desde: '2026-09-10' });
  assert.deepEqual(revisionPendiente({ ...base, ahora: '2026-09-05' }), { pendiente: false });
  assert.deepEqual(revisionPendiente({ ...base, revisionAplicadaPosterior: true }), { pendiente: false });
  assert.deepEqual(revisionPendiente({ ...base, expectativa: undefined }), { pendiente: false });
  assert.deepEqual(revisionPendiente({ ...base, procesoAbierto: false }), { pendiente: false });
  assert.deepEqual(revisionPendiente({ ...base, expectativa: { fechaObjetivo: null, registradaEn: '2026-09-01' } }), { pendiente: true, desde: '2026-09-01' });
});

// ─── Jerarquía, validación e instantánea ─────────────────────────────────────────────────────────

let contador = 0;
const nuevoId = () => `n${++contador}`;
const CATALOGO = new Set(['arroz', 'pollo', 'avena']);

function planDeEjemplo(): ContenidoDePlan {
  return normalizarEstructura(
    {
      dayTypes: [
        {
          label: 'Día habitual',
          meals: [
            {
              label: 'Almuerzo',
              prescriptionMode: 'DISH_OPTIONS',
              options: [
                {
                  label: 'Arroz con pollo',
                  items: [
                    { catalogItemId: 'arroz', quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' },
                    { catalogItemId: 'pollo', quantity: { value: 120, unit: 'g' }, preparationState: 'COOKED' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    nuevoId,
  );
}

test('DL-049 · normalizar asigna identificadores faltantes y conserva los que vienen', () => {
  const c = normalizarEstructura({ dayTypes: [{ dayTypeId: 'dt-fijo', label: 'D', meals: [] }] }, nuevoId);
  assert.equal(c.dayTypes[0]?.dayTypeId, 'dt-fijo');
  const d = normalizarEstructura({ dayTypes: [{ label: 'D', meals: [] }] }, nuevoId);
  assert.match(d.dayTypes[0]?.dayTypeId ?? '', /^n\d+$/);
});

test('RF-030 · un borrador incompleto se puede guardar; validar informa lo que falta, con la ruta (09v9:589)', () => {
  const incompleto = normalizarEstructura({ dayTypes: [{ label: 'D', meals: [{ label: 'Cena', prescriptionMode: 'DISH_OPTIONS', options: [] }] }] }, nuevoId);
  assert.deepEqual(problemasDeBorrador(incompleto, CATALOGO), []);
  assert.deepEqual(problemasParaActivar(incompleto, CATALOGO), [{ code: 'MEAL_OPTION_REQUIRED', path: 'dayTypes[0].meals[0]' }]);
  assert.deepEqual(problemasParaActivar(normalizarEstructura({ dayTypes: [] }, nuevoId), CATALOGO), [{ code: 'DAY_TYPE_REQUIRED', path: 'dayTypes' }]);
});

test('REG-06-122 · con cantidad, el estado de preparación es obligatorio; sin cantidad, no', () => {
  const c = normalizarEstructura(
    {
      dayTypes: [
        {
          label: 'D',
          meals: [
            {
              label: 'Desayuno',
              prescriptionMode: 'DISH_OPTIONS',
              options: [
                {
                  label: 'Avena',
                  items: [
                    { catalogItemId: 'avena', quantity: { value: 40, unit: 'g' }, preparationState: null },
                    { catalogItemId: 'avena', quantity: null, preparationState: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    nuevoId,
  );
  assert.deepEqual(problemasParaActivar(c, CATALOGO), [{ code: 'PREPARATION_STATE_REQUIRED', path: 'dayTypes[0].meals[0].options[0].items[0].preparationState' }]);
});

test('09v9 PATCH · modalidad B no habilitada, referencia de catálogo inválida e identificador repetido impiden guardar', () => {
  const c = normalizarEstructura(
    {
      dayTypes: [
        {
          dayTypeId: 'x',
          label: 'D',
          meals: [
            {
              mealId: 'x',
              label: 'M',
              prescriptionMode: 'EXCHANGE_PORTIONS',
              options: [{ label: 'O', items: [{ catalogItemId: 'inexistente', quantity: null, preparationState: null }] }],
            },
          ],
        },
      ],
    },
    nuevoId,
  );
  const codigos = problemasDeBorrador(c, CATALOGO).map((p) => p.code).sort();
  assert.deepEqual(codigos, ['CATALOG_REFERENCE_INVALID', 'DUPLICATE_NODE_ID', 'EXCHANGE_MODE_NOT_AVAILABLE']);
});

const RESUELTO: ReadonlyMap<string, ElementoResuelto> = new Map([
  ['arroz', { versionId: 'arroz-v1', name: 'Arroz blanco', composition: { referenceAmount: '100g', energyKcal: 130, proteinG: 2.7, carbohydrateG: 28, fatG: 0.3 } }],
  ['pollo', { versionId: 'pollo-v1', name: 'Pechuga de pollo', composition: { referenceAmount: '100g', energyKcal: 165, proteinG: 31, carbohydrateG: 0, fatG: 3.6 } }],
]);

test('REG-06-105 · la instantánea resuelve nombre y versión del catálogo al activar', () => {
  const inst = construirInstantanea(planDeEjemplo(), RESUELTO);
  assert.ok(inst);
  const item = inst.dayTypes[0]?.meals[0]?.options[0]?.items[0];
  assert.equal(item?.name, 'Arroz blanco');
  assert.equal(item?.catalogItemVersionId, 'arroz-v1');
});

test('06:1391 · si un ítem no se resuelve, la instantánea no se puede preservar', () => {
  assert.equal(construirInstantanea(planDeEjemplo(), new Map([...RESUELTO].slice(0, 1))), null);
});

test('REG-06-101 · cambiar el catálogo después de activar no cambia la instantánea (INV-06-115)', () => {
  const catalogo = new Map(RESUELTO);
  const inst = construirInstantanea(planDeEjemplo(), catalogo);
  const antes = serializacionCanonica(inst);
  catalogo.set('arroz', { versionId: 'arroz-v2', name: 'Arroz integral', composition: { referenceAmount: '100g', energyKcal: 111, proteinG: 2.6, carbohydrateG: 23, fatG: 0.9 } });
  assert.equal(serializacionCanonica(inst), antes);
});

// ─── Ingesta y contraste ─────────────────────────────────────────────────────────────────────────

test('REG-06-106 · la ingesta prescripta referencia día tipo, comida y opción de la instantánea', () => {
  const inst = construirInstantanea(planDeEjemplo(), RESUELTO);
  assert.ok(inst);
  const dia = inst.dayTypes[0]!;
  const comida = dia.meals[0]!;
  const opcion = comida.options[0]!;
  const arroz = opcion.items[0]!;
  const ok = { dayTypeId: dia.dayTypeId, mealId: comida.mealId, optionId: opcion.optionId, consumedItems: [{ itemId: arroz.itemId, quantity: { value: 80, unit: 'g' as const } }] };
  assert.deepEqual(evaluarIngestaPrescripta(inst, ok), { valida: true });
  assert.deepEqual(evaluarIngestaPrescripta(inst, { ...ok, optionId: 'otra' }), { valida: false, motivo: 'OPCION_INEXISTENTE' });
  assert.deepEqual(evaluarIngestaPrescripta(inst, { ...ok, consumedItems: [{ itemId: arroz.itemId, quantity: { value: 1, unit: 'unit' } }] }), {
    valida: false,
    motivo: 'UNIDAD_DISTINTA',
  });
  assert.deepEqual(evaluarIngestaPrescripta(inst, { ...ok, consumedItems: [{ itemId: 'ajeno', quantity: { value: 1, unit: 'g' } }] }), {
    valida: false,
    motivo: 'ITEM_AJENO_A_LA_OPCION',
  });
});

test('TEST-NUT-002/005 · contraste: prescripto ≠ registrado, sin registro = NO_DATA, y la diferencia es de cantidad (DV-05 TEST-RF-034)', () => {
  const inst = construirInstantanea(planDeEjemplo(), RESUELTO);
  assert.ok(inst);
  const dia = inst.dayTypes[0]!;
  const comida = dia.meals[0]!;
  const opcion = comida.options[0]!;
  const arroz = opcion.items[0]!;
  const contraste = construirContraste(
    fechasDelPeriodo('2026-09-01', '2026-09-03'),
    [{ planId: 'p1', desde: '2026-09-01', hasta: null, instantanea: inst }],
    [
      {
        executionId: 'e1',
        planId: 'p1',
        localDate: '2026-09-01',
        origin: 'PRESCRIBED',
        dayTypeId: dia.dayTypeId,
        mealId: comida.mealId,
        optionId: opcion.optionId,
        consumedItems: [{ itemId: arroz.itemId, quantity: { value: 80, unit: 'g' } }],
        description: null,
      },
      { executionId: 'e2', planId: 'p1', localDate: '2026-09-02', origin: 'OUTSIDE_PRESCRIPTION', dayTypeId: null, mealId: null, optionId: null, consumedItems: [], description: 'Milanesa con puré' },
    ],
  );
  const [d1, d2, d3] = contraste.days;
  assert.equal(d1?.meals[0]?.state, 'REGISTERED');
  assert.deepEqual(d1?.meals[0]?.quantityDifferences, [
    { itemId: arroz.itemId, name: 'Arroz blanco', prescribed: { value: 100, unit: 'g' }, registered: { value: 80, unit: 'g' }, difference: -20, unit: 'g' },
  ]);
  // La comida libre es un dato aparte: no marca el almuerzo como registrado (CONS:599-612).
  assert.equal(d2?.dataState, 'HAS_DATA');
  assert.equal(d2?.meals[0]?.state, 'NO_DATA');
  assert.deepEqual(d2?.outsidePrescription, [{ executionId: 'e2', description: 'Milanesa con puré' }]);
  // Sin ningún registro: sin dato, nunca cero ni incumplimiento (INV-06-135).
  assert.equal(d3?.dataState, 'NO_DATA');
  assert.equal(d3?.meals[0]?.state, 'NO_DATA');
});

test('INV-06-13 · lo registrado contra una versión no se pierde si ese día se activa una sucesora', () => {
  // v1 y v2 con nodos distintos: la sucesora se reescribió entera (sin conservar identificadores).
  const v1 = construirInstantanea(planDeEjemplo(), RESUELTO)!;
  const v2 = construirInstantanea(planDeEjemplo(), RESUELTO)!;
  const almuerzo1 = v1.dayTypes[0]!.meals[0]!;
  const arroz1 = almuerzo1.options[0]!.items[0]!;
  const versiones = [
    { planId: 'v1', desde: '2026-09-01', hasta: '2026-09-02', instantanea: v1 },
    { planId: 'v2', desde: '2026-09-02', hasta: null, instantanea: v2 },
  ];
  const registro = {
    executionId: 'e1',
    planId: 'v1',
    localDate: '2026-09-02',
    origin: 'PRESCRIBED' as const,
    dayTypeId: v1.dayTypes[0]!.dayTypeId,
    mealId: almuerzo1.mealId,
    optionId: almuerzo1.options[0]!.optionId,
    consumedItems: [{ itemId: arroz1.itemId, quantity: { value: 80, unit: 'g' as const } }],
    description: null,
  };
  const [d2] = construirContraste(['2026-09-02'], versiones, [registro]).days;
  // El día se lee contra la versión que referencia el registro, con su diferencia de cantidad.
  assert.equal(d2?.planId, 'v1');
  assert.equal(d2?.meals[0]?.state, 'REGISTERED');
  assert.equal(d2?.meals[0]?.quantityDifferences[0]?.difference, -20);

  // Si ese día también hay un registro contra la sucesora, el día es de la sucesora y el anterior se agrega con su
  // etiqueta: nada registrado aparece como «sin dato».
  const almuerzo2 = v2.dayTypes[0]!.meals[0]!;
  const otro = { ...registro, executionId: 'e2', planId: 'v2', dayTypeId: v2.dayTypes[0]!.dayTypeId, mealId: almuerzo2.mealId, optionId: almuerzo2.options[0]!.optionId, consumedItems: [] };
  const [ambos] = construirContraste(['2026-09-02'], versiones, [registro, otro]).days;
  assert.equal(ambos?.planId, 'v2');
  assert.deepEqual(
    ambos?.meals.map((m) => [m.executionId, m.state]),
    [
      ['e2', 'REGISTERED'],
      ['e1', 'REGISTERED'],
    ],
  );
  assert.equal(ambos?.meals[1]?.quantityDifferences[0]?.difference, -20);
});

test('fechasDelPeriodo · incluye los extremos y respeta los cambios de mes', () => {
  assert.deepEqual(fechasDelPeriodo('2026-09-29', '2026-10-02'), ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  assert.deepEqual(fechasDelPeriodo('2026-09-02', '2026-09-01'), []);
});

// ─── TEST-PRJ-009 · cero puntaje de adherencia ──────────────────────────────────────────────────

/** Términos prohibidos como nombres de campo o valores de enum (09v9:112-116, 832-837; REG-06-125). */
const PROHIBIDO = /adherence|compliance|score|grade|percent|cumplid|adherencia/i;

function recorrer(nodo: unknown, ruta: string, hallazgos: string[]): void {
  if (Array.isArray(nodo)) {
    nodo.forEach((n, i) => recorrer(n, `${ruta}[${i}]`, hallazgos));
    return;
  }
  if (nodo && typeof nodo === 'object') {
    for (const [clave, valor] of Object.entries(nodo)) {
      if (clave === 'properties' && valor && typeof valor === 'object') {
        for (const nombre of Object.keys(valor)) if (PROHIBIDO.test(nombre)) hallazgos.push(`${ruta}.${nombre}`);
      }
      if (clave === 'enum' && Array.isArray(valor)) for (const v of valor) if (typeof v === 'string' && PROHIBIDO.test(v)) hallazgos.push(`${ruta}=${v}`);
      recorrer(valor, `${ruta}.${clave}`, hallazgos);
    }
  }
}

test('TEST-PRJ-009 · ningún schema de nutrición tiene puntaje, porcentaje de cumplimiento ni calificación', () => {
  const hallazgos: string[] = [];
  let revisados = 0;
  for (const [nombre, valor] of Object.entries(contratosNutricion)) {
    if (!(valor instanceof z.ZodType)) continue;
    revisados++;
    recorrer(z.toJSONSchema(valor, { unrepresentable: 'any', io: 'input' }), nombre, hallazgos);
    recorrer(z.toJSONSchema(valor, { unrepresentable: 'any', io: 'output' }), nombre, hallazgos);
  }
  assert.ok(revisados > 30, `se revisaron ${revisados} schemas`);
  assert.deepEqual(hallazgos, []);
});

test('TEST-PRJ-009 · el OpenAPI generado tampoco expone puntaje de adherencia en ninguna operación de nutrición', async () => {
  const { documentoOpenApi } = await import('./openapi');
  const doc = documentoOpenApi() as { paths: Record<string, unknown> };
  const hallazgos: string[] = [];
  for (const [ruta, metodos] of Object.entries(doc.paths)) if (ruta.includes('nutrition')) recorrer(metodos, ruta, hallazgos);
  const operaciones = Object.entries(doc.paths).filter(([r]) => r.includes('nutrition')).reduce((n, [, m]) => n + Object.keys(m as object).length, 0);
  assert.equal(operaciones, 25, 'las 21 NUT, INT-NUT-01, la lista propia de ingestas y la importación de Open Food Facts (INT-NUT-02/03, WP-08)');
  assert.deepEqual(hallazgos, []);
});

test('T13 · el copy de nutrición no usa ningún término prohibido (B10-05; REG-06-125)', async () => {
  const { COPY_NUTRICION, EFECTO_VISIBLE_DE_RESULTADO, ETIQUETA_DE_RESULTADO, ETIQUETA_DE_FUENTE, ETIQUETA_DE_PREPARACION, terminosProhibidosEn } = await import('./copy-nutricion');
  const textos = [COPY_NUTRICION, EFECTO_VISIBLE_DE_RESULTADO, ETIQUETA_DE_RESULTADO, ETIQUETA_DE_FUENTE, ETIQUETA_DE_PREPARACION].flatMap((o) => Object.values(o));
  const hallazgos = textos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`));
  assert.deepEqual(hallazgos, []);
  // El detector funciona: estos sí se detectan.
  assert.deepEqual(terminosProhibidosEn('82 % adherencia'), ['adherencia', '%']);
  assert.deepEqual(terminosProhibidosEn('Comida trampa'), ['comida trampa']);
  assert.deepEqual(terminosProhibidosEn('Almuerzo normal'), []);
});
