/**
 * Datos SINTÉTICOS para medir Inicio sin la API real: una respuesta por operación, con el tamaño y la forma que tendría en
 * la API. Cada una se valida al armarse contra su esquema estricto de @be/domain: si no cumple el contrato, falla acá.
 *
 * Lo que se buscó que sea representativo:
 * - Entrenamiento de hoy: dos sesiones del plan, de seis ejercicios con cuatro series cada uno.
 * - Nutrición de hoy: un plan con dos días tipo, cuatro comidas, dos opciones por comida y cuatro alimentos por opción.
 * - Tu historial (30 días): cada sesión trae su plan, su registro original y sus correcciones completas, como la API.
 * - Mi evolución (90 días): tres tomas con 28 medidas y 5 resultados de fórmulas, con los huecos entre tomas. Un período
 *   sin mediciones trae la lista de medidas vacía, como la API (`pedidas` sale de las observaciones del período).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const d = require('../../../../packages/domain/dist/index.js');

const ZONA = 'America/Argentina/Buenos_Aires';
export const HOY = '2026-10-04';
const HUELLA = 'a'.repeat(64);

export function diaMas(base, delta) {
  const x = new Date(`${base}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + delta);
  return x.toISOString().slice(0, 10);
}
const instante = (fecha, hora = '13:00') => `${fecha}T${hora}:00.000Z`;
const validar = (esquema, valor, nombre) => {
  const r = esquema.safeParse(valor);
  if (!r.success) throw new Error(`${nombre} no cumple su contrato: ${JSON.stringify(r.error.issues.slice(0, 3))}`);
  return valor;
};

// ─── Entrenamiento ──────────────────────────────────────────────────────────────────────────────
const EJERCICIOS = ['Press de banca', 'Remo con barra', 'Sentadilla', 'Peso muerto rumano', 'Press militar', 'Dominadas asistidas'];
const prescripcion = (sesion, i) => ({
  prescriptionId: `p-${sesion}-${i}`,
  order: i + 1,
  exerciseId: `ej-${i}`,
  exerciseVersionId: `ejv-${i}`,
  exerciseName: EJERCICIOS[i],
  sets: [1, 2, 3, 4].map((k) => ({ setIndex: k, repetitions: { min: 8, max: 12 }, note: null })),
  intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
  suggestedLoad: { value: 40 + i * 5, unit: 'kg' },
  professionalParameters: [{ label: 'Descanso', value: 90, unit: 's' }],
  note: i === 0 ? 'Controlar la bajada en tres tiempos.' : null,
});
const sesionPlanificada = (n) => ({
  sessionId: `ses-${n % 2}`,
  label: n % 2 ? 'Fuerza · tren inferior' : 'Fuerza · tren superior',
  order: (n % 2) + 1,
  instructions: 'Entrada en calor de diez minutos y movilidad articular.',
  prescriptions: Array.from({ length: 6 }, (_, i) => prescripcion(n % 2, i)),
  blockId: 'bloque-2',
  blockLabel: 'Bloque 2 · Fuerza',
  microcycleId: 'micro-3',
  microcycleLabel: 'Semana 3',
});

export function hoyDeEntrenamiento() {
  const ocurrencia = (n, execution) => ({ occurrenceId: `oc-${n}`, date: HOY, planId: 'plan-ent', plannedSession: sesionPlanificada(n), execution });
  return validar(
    d.HoyDeEntrenamientoResponseSchema,
    {
      data: {
        date: HOY,
        timeZone: ZONA,
        planState: 'AVAILABLE',
        activePlan: { planId: 'plan-ent', trainingPlanId: 'tp-1', snapshotVersion: HUELLA, activatedAt: instante('2026-09-01') },
        occurrences: [
          ocurrencia(0, { state: 'REGISTERED', draftId: 'dr-0', executionId: 'ex-hoy', sessionCondition: 'COMPLETED' }),
          ocurrencia(1, { state: 'NOT_STARTED', draftId: null, executionId: null, sessionCondition: null }),
        ],
      },
    },
    'Entrenamiento de hoy',
  );
}

const registro = (condicion, n) => ({
  granularity: condicion === 'NOT_COMPLETED' ? null : 'SET',
  sessionCondition: condicion,
  reason: condicion === 'COMPLETED' ? null : 'Molestia en el hombro derecho.',
  exercises:
    condicion === 'NOT_COMPLETED'
      ? []
      : Array.from({ length: 6 }, (_, i) => ({
          prescriptionId: `p-${n % 2}-${i}`,
          prescribedExerciseVersionId: `ejv-${i}`,
          prescribedExerciseName: EJERCICIOS[i],
          performedExerciseVersionId: `ejv-${i}`,
          performedExerciseName: EJERCICIOS[i],
          substituted: false,
          sets: [1, 2, 3, 4].map((k) => ({ setIndex: k, load: { value: 40 + i * 5, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null })),
          executionSummary: null,
        })),
  sessionSummary: null,
});
const CONDICIONES = ['COMPLETED', 'COMPLETED', 'COMPLETED_WITH_DEVIATION', 'COMPLETED', 'NOT_COMPLETED'];

/**
 * Tu historial de un período: `sesiones` sesiones repartidas en los días, de la más nueva a la más vieja. Cada tercera
 * sesión corregida tiene una corrección, y algunas dos (`corregidas` en total).
 */
export function historial({ periodStart, periodEnd }, { sesiones, corregidas }) {
  const dias = Math.round((Date.parse(`${periodEnd}T12:00:00Z`) - Date.parse(`${periodStart}T12:00:00Z`)) / 86_400_000) + 1;
  const executions = Array.from({ length: sesiones }, (_, n) => {
    const fecha = diaMas(periodEnd, -Math.floor((n * dias) / sesiones));
    const condicion = CONDICIONES[n % CONDICIONES.length];
    const corrige = n < corregidas;
    const correcciones = !corrige ? [] : n % 4 === 0 ? ['COMPLETED_WITH_DEVIATION', 'COMPLETED'] : ['COMPLETED'];
    return {
      executionId: `ex-${n}`,
      state: 'REGISTERED',
      adviseeId: 'yo',
      planId: 'plan-ent',
      snapshotDigest: HUELLA,
      occurrenceId: `oc-h-${n}`,
      date: fecha,
      timeZone: ZONA,
      plannedSession: sesionPlanificada(n),
      original: registro(condicion, n),
      corrections: correcciones.map((c, i) => ({
        correctionId: `co-${n}-${i}`,
        previousCorrectionId: i ? `co-${n}-${i - 1}` : null,
        reason: 'Corrijo las cargas que anoté mal.',
        correction: registro(c, n),
        author: { identityId: 'yo', displayName: 'Asesorado de prueba' },
        authorRole: 'ADVISEE',
        recordedAt: instante(fecha, '21:00'),
      })),
      effectiveView: correcciones.length ? { kind: 'CORRECTED', correctionId: `co-${n}-${correcciones.length - 1}` } : { kind: 'ORIGINAL' },
      occurredAt: instante(fecha, '18:00'),
      recordedAt: instante(fecha, '19:00'),
    };
  });
  return validar(d.HistorialDeEntrenamientoResponseSchema, { data: { period: { start: periodStart, end: periodEnd, timeZone: ZONA }, executions } }, 'Tu historial');
}

// ─── Nutrición ──────────────────────────────────────────────────────────────────────────────────
const ALIMENTOS = ['Arroz integral', 'Pechuga de pollo', 'Brócoli', 'Aceite de oliva', 'Avena', 'Banana', 'Yogur natural', 'Nueces'];
const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
const PLAN = {
  planId: 'plan-nut',
  version: 'v3',
  activatedAt: instante('2026-09-01'),
  objective: {
    versionId: 'obj-1',
    estimatedEnergyRequirement: { value: 2400, unit: 'kcal/day' },
    macronutrientDistribution: { protein: { value: 140, unit: 'g/day' }, carbohydrate: { value: 280, unit: 'g/day' }, fat: { value: 75, unit: 'g/day' } },
    mealDistribution: null,
    effectiveFrom: instante('2026-09-01'),
    effectiveUntil: null,
  },
  dayTypes: [0, 1].map((t) => ({
    dayTypeId: `dt-${t}`,
    label: t ? 'Día de descanso' : 'Día de entrenamiento',
    order: t + 1,
    meals: COMIDAS.map((label, m) => ({
      mealId: `meal-${t}-${m}`,
      label,
      order: m + 1,
      prescriptionMode: 'DISH_OPTIONS',
      options: [0, 1].map((o) => ({
        optionId: `op-${t}-${m}-${o}`,
        label: `Opción ${o + 1}`,
        order: o + 1,
        items: [0, 1, 2, 3].map((k) => ({
          itemId: `it-${t}-${m}-${o}-${k}`,
          catalogItemId: `cat-${(m + o + k) % ALIMENTOS.length}`,
          catalogItemVersionId: `catv-${(m + o + k) % ALIMENTOS.length}`,
          name: ALIMENTOS[(m + o + k) % ALIMENTOS.length],
          quantity: { value: 60 + 20 * k, unit: 'g' },
          preparationState: k === 1 ? 'COOKED' : null,
          note: null,
        })),
      })),
    })),
  })),
};
const ingesta = (n, fecha, origin) => ({
  executionId: `in-${n}`,
  planId: 'plan-nut',
  adviseeId: 'yo',
  origin,
  mode: origin === 'PRESCRIBED' ? 'DISH_OPTIONS' : 'FREE_DESCRIPTION',
  occurredAt: instante(fecha, '15:30'),
  recordedAt: instante(fecha, '15:40'),
  localDate: fecha,
  timeZone: ZONA,
  dayTypeId: origin === 'PRESCRIBED' ? 'dt-0' : null,
  mealId: origin === 'PRESCRIBED' ? 'meal-0-1' : null,
  optionId: origin === 'PRESCRIBED' ? 'op-0-1-0' : null,
  consumedItems: origin === 'PRESCRIBED' ? [0, 1, 2, 3].map((k) => ({ itemId: `it-0-1-0-${k}`, quantity: { value: 60 + 20 * k, unit: 'g' } })) : [],
  observation: null,
  description: origin === 'PRESCRIBED' ? null : 'Un sándwich de jamón y queso con una gaseosa.',
  portionDescription: origin === 'PRESCRIBED' ? null : 'Uno mediano.',
  corrections: [],
  effectiveView: { kind: 'ORIGINAL' },
});

export function hoyNutricional({ conRegistrosHoy }) {
  const registros = conRegistrosHoy ? [ingesta(1, HOY, 'PRESCRIBED'), ingesta(2, HOY, 'OUTSIDE_PRESCRIPTION')] : [];
  return validar(
    d.HoyResponseSchema,
    { data: { date: HOY, timeZone: ZONA, planState: 'AVAILABLE', activePlan: PLAN, selectedDayTypeId: 'dt-0', registeredIntake: registros, dataState: registros.length ? 'HAS_DATA' : 'NO_DATA' } },
    'Nutrición de hoy',
  );
}

/** API-NUT-16-LISTA con `limit` 1: la primera página, de una fila. */
export function ultimoRegistro() {
  return validar(d.ListaDeIngestasResponseSchema, { data: [ingesta(9, diaMas(HOY, -2), 'PRESCRIBED')], page: { limit: 1, nextCursor: 'cursor-1', hasMore: true } }, 'Último registro');
}

// ─── Información ────────────────────────────────────────────────────────────────────────────────
export function pendientes() {
  const solicitud = (n) => ({
    formRequestId: `fr-${n}`,
    professional: { identityId: 'pro-1', displayName: 'Lic. Martina Gómez' },
    advisee: { identityId: 'yo', displayName: 'Asesorado de prueba' },
    relationshipId: 'rel-1',
    purpose: n ? 'Conocer lesiones previas antes de planificar' : 'Conocer tus hábitos de sueño',
    scope: n ? 'ENTRENAMIENTO' : 'NUTRICION',
    templateId: `tpl-${n}`,
    templateVersionId: `tplv-${n}`,
    templateName: n ? 'Registro de lesiones previas' : 'Hábitos de sueño',
    requestedFieldCodes: ['horas', 'calidad', 'despertares', 'siesta'],
    requiredFieldCodes: ['horas'],
    status: 'PENDING',
    createdAt: instante(diaMas(HOY, -2 - n)),
    respondable: true,
  });
  return validar(d.ListaDeSolicitudesPropiasResponseSchema, { data: [solicitud(0), solicitud(1)], page: { limit: 3, nextCursor: null, hasMore: false } }, 'Pendientes');
}

/** API-CON-05. El texto del consentimiento viaja entero, como en la API: es el texto vigente del A3 en el dominio. */
export function requisitoA3() {
  const texto = d.VERSION_VIGENTE?.DATOS_SALUD_BE?.texto ?? 'Texto del consentimiento para el tratamiento de datos de salud. '.repeat(40);
  return validar(
    d.RequisitoDeConsentimientoDeSaludResponseSchema,
    {
      data: {
        type: 'HEALTH_DATA_BE',
        consentVersion: { id: 'cv-1', text: texto, textHash: HUELLA, effectiveFrom: instante('2026-01-01') },
        purpose: 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY',
        currentConsent: { consentId: 'c-1', state: 'ACTIVE', consentVersionId: 'cv-1', acceptedAt: instante('2026-09-01'), revokedAt: null },
      },
    },
    'Requisito del A3',
  );
}

// ─── Antropometría ──────────────────────────────────────────────────────────────────────────────
const MEDIDAS = [
  ['peso', 'kg', 78.4],
  ['talla', 'cm', 176],
  ...['cuello', 'hombros', 'pecho', 'brazo-relajado', 'brazo-flexionado', 'antebrazo', 'muneca', 'cintura', 'abdomen', 'cadera', 'muslo', 'pantorrilla', 'tobillo'].map((s, i) => [`perimetro-${s}`, 'cm', 20 + i * 6]),
  ...['pectoral', 'axilar-media', 'triceps', 'subescapular', 'biceps', 'cresta-iliaca', 'supraespinal', 'abdominal', 'muslo-frontal', 'pantorrilla'].map((s, i) => [`pliegue-${s}`, 'mm', 6 + i]),
  ['diametro-humero', 'cm', 7],
  ['diametro-biestiloideo', 'cm', 5.8],
  ['diametro-femur', 'cm', 9.9],
];
const DERIVADAS = [
  ['imc', 'kg/m2', 25.3, 'metodo-imc'],
  ['indice-cintura-talla', '', 0.48, 'metodo-ict'],
  ['suma-6-pliegues-isak', 'mm', 65, 'metodo-suma'],
  ['grasa-durnin-womersley', '%', 16.8, 'metodo-dw'],
  ['masa-osea-rocha', 'kg', 11.6, 'metodo-rocha'],
];

/** Los huecos de una serie: cada tramo del período sin observación, con su cantidad de días. */
function huecos(periodStart, periodEnd, fechas) {
  const tramos = [];
  let desde = periodStart;
  for (const f of [...fechas].sort()) {
    if (f > desde) tramos.push([desde, diaMas(f, -1)]);
    desde = diaMas(f, 1);
  }
  if (desde <= periodEnd) tramos.push([desde, periodEnd]);
  return tramos.map(([from, to]) => ({ from, to, state: 'NO_DATA', days: Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000) + 1 }));
}

/** Mi evolución de un período, con las tomas que caen en él. Sin tomas, la lista de medidas viene vacía, como en la API. */
export function evolucion({ periodStart, periodEnd }, fechasDeLasTomas) {
  const tomas = fechasDeLasTomas.filter((f) => f >= periodStart && f <= periodEnd);
  let fuente = 0;
  const serie = ([metricCode, unit, base, metodo = null], derivada) => {
    const grupo = { comparabilityGroup: `cmp-${metricCode}`, protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: metodo, unit };
    return {
      metricCode,
      series: tomas.map((f, i) => ({
        occurredAt: instante(f, '13:00'),
        recordedAt: instante(f, '13:30'),
        value: Math.round((base + (tomas.length - 1 - i) * 0.3) * 10) / 10,
        unit,
        sourceEvaluationId: `ev-${f}`,
        sourceId: `med-${metricCode}-${++fuente}`,
        dataClass: derivada ? 'DERIVED' : 'MEASURED',
        comparabilityGroup: grupo.comparabilityGroup,
        correctionState: 'EFFECTIVE',
        incomparableWithPrevious: [],
      })),
      gaps: huecos(periodStart, periodEnd, tomas),
      comparability: { groups: [grupo] },
    };
  };
  const metrics = tomas.length === 0 ? [] : [...MEDIDAS.map((m) => serie(m, false)), ...DERIVADAS.map((m) => serie(m, true))];
  return validar(
    d.EvolucionResponseSchema,
    { data: { adviseeId: 'yo', period: { start: periodStart, end: periodEnd, timeZone: ZONA }, metrics, partialView: false, honesty: { interpolated: false, imputed: false, carriedForward: false } } },
    'Mi evolución',
  );
}
