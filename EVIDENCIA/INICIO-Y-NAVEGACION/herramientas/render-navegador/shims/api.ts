// El cliente de la API en el render del navegador: datos SINTÉTICOS por escena (?escena=...). No hay red ni cuentas.
// Cada respuesta tiene la forma de su contrato en @be/domain, con lo que las pantallas leen.
const parametros = new URLSearchParams(globalThis.location?.search ?? '');
const escena = parametros.get('escena') ?? 'inicio';

type R = Promise<any>;
const ok = (datos: unknown): R => Promise.resolve({ ok: true, datos });
const nunca = (): R => new Promise(() => undefined);
const sinRed = (): R => Promise.resolve({ ok: false, tipo: 'RED' });
const sinA3 = (): R => Promise.resolve({ ok: false, tipo: 'API', status: 403, codigo: 'ACTION_FORBIDDEN', issues: [] });

const ZONA = 'America/Argentina/Buenos_Aires';
const HOY = '2026-10-04';
const pagina = (hasMore = false) => ({ limit: 20, nextCursor: hasMore ? 'c' : null, hasMore });

// ─── Entrenamiento ──────────────────────────────────────────────────────────────────────────────
const prescripciones = (n: number) => Array.from({ length: n }, (_, i) => ({ prescriptionId: `p${i}`, exerciseName: `Ejercicio ${i + 1}`, exerciseVersionId: `e${i}` }));
const ocurrencia = (id: string, label: string, ejercicios: number, execution: object) => ({
  occurrenceId: id,
  date: HOY,
  planId: 'plan-1',
  plannedSession: { label, blockLabel: 'Bloque 2 · Fuerza', microcycleLabel: 'Semana 3', prescriptions: prescripciones(ejercicios) },
  execution: { state: 'NOT_STARTED', draftId: null, executionId: null, sessionCondition: null, ...execution },
});
const hoyDeEntrenamiento = {
  data: {
    date: HOY,
    timeZone: ZONA,
    planState: 'AVAILABLE',
    activePlan: { planId: 'plan-1' },
    occurrences: [
      ocurrencia('o1', 'Fuerza · tren superior', 6, { state: 'REGISTERED', draftId: 'd1', executionId: 'x1', sessionCondition: 'COMPLETED_WITH_DEVIATION' }),
      ocurrencia('o2', 'Fuerza · tren inferior', 5, {}),
    ],
  },
};
const ejecucion = (id: string, condicion: string, corregida = false) => ({
  executionId: id,
  original: { sessionCondition: corregida ? 'COMPLETED' : condicion },
  corrections: corregida ? [{ correctionId: `${id}-c`, correction: { sessionCondition: condicion } }] : [],
  effectiveView: corregida ? { kind: 'CORRECTED', correctionId: `${id}-c` } : { kind: 'ORIGINAL' },
});
const historial = {
  data: {
    period: { start: '2026-09-05', end: HOY },
    executions: [
      ...['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ejecucion(id, 'COMPLETED')),
      ejecucion('g', 'COMPLETED_WITH_DEVIATION'),
      ejecucion('h', 'COMPLETED_WITH_DEVIATION', true),
      ejecucion('i', 'NOT_COMPLETED'),
    ],
  },
};

// ─── Nutrición ──────────────────────────────────────────────────────────────────────────────────
const comidas = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map((label, i) => ({ mealId: `m${i}`, label, options: [] }));
const plan = {
  planId: 'pn-1',
  version: 'v1',
  activatedAt: '2026-09-01T12:00:00.000Z',
  objective: null,
  dayTypes: [
    { dayTypeId: 'dt-ent', label: 'Día de entrenamiento', meals: comidas },
    { dayTypeId: 'dt-desc', label: 'Día de descanso', meals: comidas },
  ],
};
const ingesta = (id: string, origin: string, hora: string, localDate = HOY) => ({ executionId: id, origin, recordedAt: `${localDate}T${hora}:00.000Z`, occurredAt: `${localDate}T${hora}:00.000Z`, localDate });
const hoyNutricional = (diaTipo?: string, extra: object = {}) => ({
  data: {
    date: HOY,
    timeZone: ZONA,
    planState: 'AVAILABLE',
    activePlan: plan,
    selectedDayTypeId: escena === 'inicio-elegir-dia' ? (diaTipo ?? null) : (diaTipo ?? 'dt-ent'),
    registeredIntake: [ingesta('i1', 'PRESCRIBED', '11:40'), ingesta('i2', 'OUTSIDE_PRESCRIPTION', '15:10')],
    dataState: 'HAS_DATA',
    ...extra,
  },
});

// ─── Información ────────────────────────────────────────────────────────────────────────────────
const solicitud = (id: string, nombre: string, respondable: boolean, dia: string) => ({
  formRequestId: id,
  status: 'PENDING',
  respondable,
  templateName: nombre,
  professional: { identityId: 'pro-1', displayName: 'Lic. Martina Gómez' },
  createdAt: `${dia}T13:00:00.000Z`,
});
const a3 = (estado: 'ACTIVE' | 'REVOKED' | null) => ({
  data: {
    type: 'HEALTH_DATA_BE',
    consentVersion: { id: 'cv', text: '', textHash: '', effectiveFrom: '2026-01-01T00:00:00.000Z' },
    purpose: 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY',
    currentConsent: estado ? { consentId: 'c', state: estado, consentVersionId: 'cv', acceptedAt: '2026-09-01T12:00:00.000Z' } : null,
  },
});

// ─── Antropometría: tomas sintéticas por escena ─────────────────────────────────────────────────
type Toma = { id: string; dia: string; hora?: string };
/** Un valor de una toma: un número, `null` si esa toma no lo tiene, o un valor con otro protocolo (otro grupo). */
type Valor = number | null | { isak: number };
const JUEGO = escena.startsWith('evolucion-12') ? 'doce' : escena.startsWith('evolucion-mismo-dia') ? 'mismo-dia' : 'tres';

const TRES: Toma[] = [
  { id: 'ev-jul', dia: '2026-07-25' },
  { id: 'ev-ago', dia: '2026-08-24' },
  { id: 'ev-sep', dia: '2026-09-27' },
];
// [julio, agosto, septiembre]. En agosto, el tríceps se tomó con el protocolo ISAK: otro grupo, no se compara.
const VALORES_TRES: Record<string, Valor[]> = {
  peso: [78.9, 78.6, 78.4],
  talla: [176, null, 176],
  'perimetro-cuello': [38.5, null, 38],
  'perimetro-hombros': [114.8, null, 116],
  'perimetro-pecho': [97.2, null, 98],
  'perimetro-brazo-relajado': [31.6, null, 32],
  'perimetro-brazo-flexionado': [33.9, null, 34.5],
  'perimetro-antebrazo': [28, null, 28],
  'perimetro-muneca': [17, null, 17],
  'perimetro-cintura': [86, 85.1, 84],
  'perimetro-abdomen': [87.5, null, 86],
  'perimetro-cadera': [98.8, 98.2, 98],
  'perimetro-muslo': [55.7, null, 56],
  'perimetro-pantorrilla': [36.9, null, 37],
  'perimetro-tobillo': [22, null, 22],
  'pliegue-pectoral': [10, null, 9],
  'pliegue-axilar-media': [11.5, null, 11],
  'pliegue-triceps': [11.2, { isak: 10.6 }, 10],
  'pliegue-subescapular': [12.8, null, 12],
  'pliegue-biceps': [6.4, null, 6],
  'pliegue-cresta-iliaca': [14, null, 13],
  'pliegue-supraespinal': [9.1, null, 8],
  'pliegue-abdominal': [17.3, null, 15],
  'pliegue-muslo-frontal': [14.6, null, 14],
  'pliegue-pantorrilla': [7.2, null, 7],
  'diametro-humero': [7, null, 7],
  'diametro-biestiloideo': [5.8, null, 5.8],
  'diametro-femur': [9.9, null, 9.9],
};

// Doce tomas semanales dentro del período. Los pliegues, cada dos semanas; el tríceps de la sexta, con ISAK.
const DOCE: Toma[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 8 + i * 7));
  return { id: `ev-s${i + 1}`, dia: d.toISOString().slice(0, 10) };
});
const serieDe = (base: number, paso: number, cada = 1, isakEn = -1): Valor[] =>
  Array.from({ length: 12 }, (_, i) => (i === isakEn ? { isak: Math.round((base + 0.6) * 10) / 10 } : i % cada === 0 || i === 11 ? Math.round((base + paso * i + (i % 3 === 1 ? 0.3 : 0)) * 10) / 10 : null));
const VALORES_DOCE: Record<string, Valor[]> = Object.fromEntries(
  Object.entries(VALORES_TRES).map(([m, v]) => {
    const ultimo = v[2] as number;
    if (m === 'pliegue-triceps') return [m, serieDe(ultimo + 1.4, -0.12, 2, 5)];
    if (m.startsWith('pliegue')) return [m, serieDe(ultimo + 1.2, -0.1, 2)];
    if (m === 'talla' || m.startsWith('diametro')) return [m, serieDe(ultimo, 0, 4)];
    if (m === 'peso') return [m, serieDe(ultimo + 1.1, -0.1)];
    return [m, serieDe(ultimo + 0.8, -0.07)];
  }),
);

// D-3: dos evaluaciones el 27/9. La API muestra una medición por día y medida: el peso, la cintura y la cadera de ese
// día son los de la mañana, y de la tarde se ven solo los pliegues y los perímetros que la mañana no tomó.
const MISMO_DIA: Toma[] = [
  { id: 'ev-ago', dia: '2026-08-24' },
  { id: 'ev-manana', dia: '2026-09-27', hora: '12' },
  { id: 'ev-tarde', dia: '2026-09-27', hora: '20' },
];
const VALORES_MISMO_DIA: Record<string, Valor[]> = Object.fromEntries(
  Object.entries(VALORES_TRES).map(([m, v]) => {
    const [jul, , sep] = v as number[];
    if (['peso', 'talla', 'perimetro-cintura', 'perimetro-cadera'].includes(m)) return [m, [jul, sep, null]];
    return [m, [jul, null, sep]];
  }),
);

const TOMAS = JUEGO === 'doce' ? DOCE : JUEGO === 'mismo-dia' ? MISMO_DIA : TRES;
const VALORES = JUEGO === 'doce' ? VALORES_DOCE : JUEGO === 'mismo-dia' ? VALORES_MISMO_DIA : VALORES_TRES;
const METODO = (n: string) => `3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f${n}`;
const derivada = (tres: (number | null)[]): (number | null)[] => (JUEGO === 'doce' ? Array.from({ length: 12 }, (_, i) => (tres[2] === null ? null : i % 2 === 0 || i === 11 ? Math.round((tres[2] + 0.05 * (11 - i)) * 100) / 100 : null)) : JUEGO === 'mismo-dia' ? [tres[0], tres[2], null] : tres);
const DERIVADAS: Record<string, { valores: (number | null)[]; unidad: string; metodo: string }> = {
  imc: { valores: derivada([25.5, 25.4, 25.3]), unidad: 'kg/m2', metodo: METODO('01') },
  'indice-cintura-talla': { valores: derivada([0.49, null, 0.48]), unidad: '', metodo: METODO('03') },
  'suma-6-pliegues-isak': { valores: derivada([71.6, null, 65]), unidad: 'mm', metodo: METODO('05') },
  'grasa-durnin-womersley': { valores: derivada([17.9, null, 16.8]), unidad: '%', metodo: METODO('08') },
  'masa-osea-rocha': { valores: derivada([null, null, 11.6]), unidad: 'kg', metodo: METODO('1e') },
};
let fuente = 0;
function serie(metricCode: string, valores: Valor[], unidad: string, metodo: string | null, esDerivada: boolean) {
  const grupo = { comparabilityGroup: `g-${metricCode}`, protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: metodo, unit: unidad };
  const isak = { comparabilityGroup: `g-${metricCode}-isak`, protocolVersionId: 'isak', protocolName: 'ISAK', methodVersionId: metodo, unit: unidad };
  let usaIsak = false;
  const series = TOMAS.flatMap((t, i) => {
    const v = valores[i];
    if (v === null || v === undefined) return [];
    const otro = typeof v === 'object';
    if (otro) usaIsak = true;
    const hora = t.hora ?? '13';
    return [
      {
        occurredAt: `${t.dia}T${hora}:00:00.000Z`,
        recordedAt: `${t.dia}T${hora}:30:00.000Z`,
        value: otro ? v.isak : v,
        unit: unidad,
        sourceEvaluationId: t.id,
        sourceId: `s-${++fuente}`,
        dataClass: esDerivada ? 'DERIVED' : 'MEASURED',
        comparabilityGroup: otro ? isak.comparabilityGroup : grupo.comparabilityGroup,
        correctionState: 'EFFECTIVE',
        incomparableWithPrevious: [],
      },
    ];
  });
  return { metricCode, series, gaps: [], comparability: { groups: usaIsak ? [grupo, isak] : [grupo] } };
}
const evolucion = {
  data: {
    adviseeId: 'yo',
    period: { start: '2026-07-07', end: HOY, timeZone: ZONA },
    metrics: [
      ...Object.entries(VALORES).map(([m, v]) => serie(m, v, m.startsWith('pliegue') ? 'mm' : m === 'peso' ? 'kg' : 'cm', null, false)),
      ...Object.entries(DERIVADAS).map(([m, d]) => serie(m, d.valores, d.unidad, d.metodo, true)),
    ],
    partialView: false,
    honesty: { interpolated: false, imputed: false, carriedForward: false },
  },
};
const evolucionVacia = { data: { ...evolucion.data, metrics: evolucion.data.metrics.map((m) => ({ ...m, series: [] })) } };

// ─── Por escena ─────────────────────────────────────────────────────────────────────────────────
const sinPlan = (extra: object) => ({ data: { date: HOY, timeZone: ZONA, planState: 'NO_ACTIVE_PLAN', activePlan: null, ...extra } });

export const api = {
  hoyDeEntrenamiento: (): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    if (escena === 'inicio-sin-a3') return ok({ data: { ...hoyDeEntrenamiento.data, planState: 'NOT_AVAILABLE', activePlan: null, occurrences: [] } });
    if (escena === 'inicio-vacio') return ok(sinPlan({ occurrences: [] }));
    return ok(hoyDeEntrenamiento);
  },
  hoyNutricional: (_t: string, diaTipo?: string): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    if (escena === 'inicio-sin-a3') return sinA3();
    if (escena === 'inicio-vacio') return ok(sinPlan({ selectedDayTypeId: null, registeredIntake: [], dataState: 'NO_DATA' }));
    if (escena === 'inicio-elegir-dia') return ok(hoyNutricional(diaTipo, { registeredIntake: [], dataState: 'NO_DATA' }));
    return ok(hoyNutricional(diaTipo));
  },
  listarMisIngestas: (): R => {
    if (escena === 'inicio-vacio') return ok({ data: [], page: pagina() });
    return ok({ data: [ingesta('i0', 'PRESCRIBED', '21:00', '2026-10-02')], page: pagina(true) });
  },
  misEjecucionesDeEntrenamiento: (): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    if (escena === 'inicio-sin-a3') return sinA3();
    if (escena === 'inicio-vacio') return ok({ data: { period: { start: '2026-09-05', end: HOY }, executions: [] } });
    return ok(historial);
  },
  misSolicitudesDeFormulario: (): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    if (escena === 'inicio-vacio') return ok({ data: [], page: pagina() });
    return ok({ data: [solicitud('f1', 'Hábitos de sueño', true, '2026-10-02'), solicitud('f2', 'Registro de lesiones previas', false, '2026-09-28')], page: pagina() });
  },
  consultarRequisitoA3: (): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    return ok(a3(escena === 'inicio-sin-a3' ? 'REVOKED' : 'ACTIVE'));
  },
  miEvolucionAntropometrica: (): R => {
    if (escena === 'inicio-cargando') return nunca();
    if (escena === 'inicio-sin-red') return sinRed();
    if (escena === 'inicio-sin-a3') return sinA3();
    if (escena === 'inicio-vacio' || escena === 'evolucion-vacia') return ok(evolucionVacia);
    return ok(evolucion);
  },
  consultarCuenta: (): R =>
    ok({ data: { identityId: '7f3e2a10-5b4c-4d8e-9a61-2c0f8b1d4e93', accountOperationalState: 'OPERATIVA', registrationIntent: 'ADVISEE', profile: {}, actorCapabilities: [], session: { id: 's', expiresAt: '2026-10-04T23:30:00.000Z' } } }),
  abrirBorradorDeEjecucion: (): R => nunca(),
  finalizarSesion: (): R => nunca(),
  cerrarTodasLasSesiones: (): R => nunca(),
  solicitarCierre: (): R => nunca(),
};
export const apiConfigurada = true;
export const extra = {};
export const nuevaClaveDeIdempotencia = () => 'clave';
