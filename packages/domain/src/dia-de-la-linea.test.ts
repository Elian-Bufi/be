/**
 * El día como unidad de la línea de tiempo (WP-ESCRITORIO-AMABLE, parte 4): hitos, rasgos de un hecho, la composición
 * del día y las vistas con nombre.
 *
 * Los resultados esperados se escriben a mano, a partir de la definición del paquete (criterios C-06, C-07 y C-25) y de
 * los filtros de API-DSH-04. Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CalidadDeEntradaSchema, TIPOS_DE_EVENTO, type EntradaDeLineaDeTiempo } from './contratos-analisis';
import {
  componerLosDias,
  cuentaDeLaVista,
  diasSinHechosEntre,
  DOMINIO_DE_LA_CALIDAD,
  esHito,
  filtrosDeLaVista,
  NOMBRE_DEL_RASGO,
  rasgoDeVariasComidas,
  RASGOS_DE_UN_HECHO,
  rasgosDeUnHecho,
  TIPOS_DE_HITO,
  TIPOS_DE_HITO_DE_PLANIFICACION,
  vistaDeLosFiltros,
  VISTAS_DE_LA_LINEA,
} from './dia-de-la-linea';
import { conteosDelPeriodo, cumpleFiltros, DOMINIO_DE_TIPO_DE_EVENTO, ordenarEntradas, registradoTarde } from './linea-de-tiempo';

const ZONA = 'America/Argentina/Buenos_Aires';

/** Una comida a esa hora, registrada diez minutos después, con lo que se indique de distinto. */
const hecho = (idE: string, fecha: string, hora: string | null, extra: Partial<EntradaDeLineaDeTiempo> = {}): EntradaDeLineaDeTiempo => {
  const registrado = extra.recordedAt !== undefined ? extra.recordedAt : hora ? new Date(Date.parse(`${fecha}T${hora}:00.000-03:00`) + 600_000).toISOString() : null;
  return {
    timelineEntryId: idE,
    domain: 'NUTRITION',
    eventType: 'MEAL_RECORDED',
    source: { type: 'MEAL_RECORD', id: idE },
    occurredAt: hora ? `${fecha}T${hora}:00.000-03:00` : null,
    occurredDate: fecha,
    recordedLate: registrado ? registradoTarde(fecha, registrado, ZONA) : false,
    timeZone: ZONA,
    author: null,
    title: 'Comida registrada · Almuerzo',
    details: [],
    state: 'EFFECTIVE',
    quality: ['QUANTITIES_FROM_PLAN'],
    planVersionId: null,
    exerciseKeys: [],
    relations: [],
    ...extra,
    recordedAt: registrado,
  };
};
const sesion = (idE: string, fecha: string, hora: string, extra: Partial<EntradaDeLineaDeTiempo> = {}) =>
  hecho(idE, fecha, hora, { domain: 'TRAINING', eventType: 'TRAINING_SESSION_RECORDED', source: { type: 'TRAINING_EXECUTION', id: idE }, title: 'Sesión registrada · A · Tren inferior', quality: [], ...extra });
const toma = (idE: string, fecha: string, hora: string, extra: Partial<EntradaDeLineaDeTiempo> = {}) =>
  hecho(idE, fecha, hora, { domain: 'ANTHROPOMETRY', eventType: 'ANTHROPOMETRIC_EVALUATION_RECORDED', source: { type: 'ANTHROPOMETRIC_EVALUATION', id: idE }, title: 'Toma antropométrica registrada', quality: [], ...extra });
const revision = (idE: string, fecha: string, hora: string) =>
  hecho(idE, fecha, hora, { eventType: 'NUTRITION_REVIEW_RECORDED', source: { type: 'NUTRITION_REVIEW', id: idE }, title: 'Revisión de nutrición registrada', quality: [] });

const ids = (es: readonly EntradaDeLineaDeTiempo[]) => es.map((e) => e.timelineEntryId);

test('un hito es todo lo que no se registra todos los días: ni una comida ni una sesión', () => {
  assert.deepEqual(TIPOS_DE_HITO, [
    'NUTRITION_PLAN_ACTIVATED',
    'NUTRITION_OBJECTIVE_SET',
    'NUTRITION_REVIEW_RECORDED',
    'TRAINING_PLAN_ACTIVATED',
    'TRAINING_OBJECTIVE_SET',
    'TRAINING_REVIEW_RECORDED',
    'ANTHROPOMETRIC_EVALUATION_RECORDED',
    'FOLLOW_UP_OPENED',
    'FOLLOW_UP_CLOSED',
    // DL-140: la nota de coordinación también es un hito.
    'COORDINATION_NOTE_RECORDED',
  ]);
  // Cada tipo del contrato es un hito o es de todos los días: ninguno queda sin clase si el contrato suma un tipo.
  assert.equal(TIPOS_DE_HITO.length + 2, TIPOS_DE_EVENTO.length);
  // Los de planificación son los que «Analizar» dibuja como líneas: los mismos, sin la toma (que ahí ya es un punto) y sin
  // la nota de coordinación (no cambia lo que se le indica a nadie, DL-140).
  assert.deepEqual(
    [...TIPOS_DE_HITO_DE_PLANIFICACION].sort(),
    ['FOLLOW_UP_CLOSED', 'FOLLOW_UP_OPENED', 'NUTRITION_OBJECTIVE_SET', 'NUTRITION_PLAN_ACTIVATED', 'NUTRITION_REVIEW_RECORDED', 'TRAINING_OBJECTIVE_SET', 'TRAINING_PLAN_ACTIVATED', 'TRAINING_REVIEW_RECORDED'],
  );
  assert.ok(TIPOS_DE_HITO_DE_PLANIFICACION.every((t) => TIPOS_DE_HITO.includes(t)));
  assert.equal(esHito(hecho('c', '2026-10-05', '13:00')), false);
  assert.equal(esHito(sesion('s', '2026-10-05', '19:00')), false);
  assert.equal(esHito(toma('t', '2026-10-05', '08:40')), true);
  assert.equal(esHito(revision('r', '2026-10-05', '11:00')), true);
});

test('los rasgos de un hecho: lo que se dice en su renglón, en orden fijo, y nada de lo de siempre', () => {
  // Lo de siempre no es un rasgo: porciones del plan confirmadas, cantidades informadas que coinciden, y un nutriente
  // que falta (depende del alimento, no de cómo se registró).
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00')), []);
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { quality: ['QUANTITIES_REPORTED', 'NUTRIENTS_INCOMPLETE'] })), []);
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { quality: ['QUANTITIES_UNCONFIRMED'] })), ['SIN_CONFIRMAR']);
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'] })), ['DISTINTO_DE_LO_INDICADO']);
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { quality: ['DIFFERENT_MEAL'] })), ['COMIDA_DIFERENTE']);
  assert.deepEqual(rasgosDeUnHecho(sesion('s', '2026-10-05', '19:00', { quality: ['SESSION_WITH_DEVIATION', 'SESSION_SUMMARY_ONLY'], state: 'CORRECTED' })), ['SESION_CON_CAMBIOS', 'SESION_RESUMIDA', 'CORREGIDO']);
  assert.deepEqual(rasgosDeUnHecho(sesion('s', '2026-10-05', '19:00', { quality: ['SESSION_NOT_COMPLETED'] })), ['SESION_NO_REALIZADA']);
  // Anulada, y además cargada dos días después: los dos rasgos, el del estado primero.
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { state: 'ANNULLED', recordedAt: '2026-10-07T15:00:00.000Z' })), ['ANULADO', 'CARGADO_OTRO_DIA']);
  assert.deepEqual(rasgosDeUnHecho(hecho('a', '2026-10-05', '13:00', { state: 'RECTIFIED' })), ['RECTIFICADO']);
  // Cada rasgo tiene su nombre, y ninguno califica.
  for (const r of RASGOS_DE_UN_HECHO) {
    assert.ok(NOMBRE_DEL_RASGO[r].length > 0);
    assert.doesNotMatch(`${NOMBRE_DEL_RASGO[r]} ${rasgoDeVariasComidas(r, 2)}`, /mal|bien|incumpl|fall[oó]|error|alerta|riesgo/i);
  }
});

test('los rasgos de varias comidas concuerdan en número: «1 distinta», «2 distintas»', () => {
  assert.equal(rasgoDeVariasComidas('SIN_CONFIRMAR', 1), '1 sin confirmar');
  assert.equal(rasgoDeVariasComidas('SIN_CONFIRMAR', 3), '3 sin confirmar');
  assert.equal(rasgoDeVariasComidas('DISTINTO_DE_LO_INDICADO', 1), '1 distinta de lo indicado');
  assert.equal(rasgoDeVariasComidas('DISTINTO_DE_LO_INDICADO', 2), '2 distintas de lo indicado');
  assert.equal(rasgoDeVariasComidas('COMIDA_DIFERENTE', 1), '1 comida diferente');
  assert.equal(rasgoDeVariasComidas('COMIDA_DIFERENTE', 2), '2 comidas diferentes');
  assert.equal(rasgoDeVariasComidas('ANULADO', 1), '1 anulada');
  assert.equal(rasgoDeVariasComidas('RECTIFICADO', 2), '2 rectificadas');
  assert.equal(rasgoDeVariasComidas('CARGADO_OTRO_DIA', 1), '1 cargada otro día');
  assert.equal(rasgoDeVariasComidas('CARGADO_OTRO_DIA', 4), '4 cargadas otro día');
});

test('el día: primero los hitos, después las sesiones y las comidas en un grupo, cada clase en el orden en que ocurrió', () => {
  // Como llegan de la API: del hecho más reciente al más viejo.
  const entradas = ordenarEntradas([
    hecho('cena', '2026-09-24', '21:15'),
    sesion('sesion', '2026-09-24', '18:10'),
    hecho('merienda', '2026-09-24', '17:00'),
    hecho('almuerzo', '2026-09-24', '13:30', { quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'], recordedAt: '2026-09-26T21:10:00.000Z', state: 'RECTIFIED' }),
    toma('toma', '2026-09-24', '08:40'),
    hecho('desayuno', '2026-09-24', '08:10'),
  ]);
  const { dias, hechos } = componerLosDias(entradas, { agrupar: true, hayMas: false });
  assert.equal(dias.length, 1);
  assert.equal(hechos, 6);
  const dia = dias[0]!;
  assert.deepEqual(ids(dia.hechos), ['toma', 'sesion'], 'el hito pesa más: va primero aunque la sesión sea posterior');
  assert.deepEqual(ids(dia.grupo?.comidas ?? []), ['desayuno', 'almuerzo', 'merienda', 'cena'], 'del desayuno a la cena');
  assert.deepEqual(dia.grupo?.rasgos, [
    { rasgo: 'DISTINTO_DE_LO_INDICADO', cuenta: 1 },
    { rasgo: 'RECTIFICADO', cuenta: 1 },
    { rasgo: 'CARGADO_OTRO_DIA', cuenta: 1 },
  ]);
  assert.equal(dia.conNovedades, true);
  assert.equal(dia.incompleto, false);
});

test('agrupar no pierde ni repite hechos: cada entrada del día está una vez, en un renglón o en el grupo', () => {
  const entradas = ordenarEntradas([
    ...['08:00', '13:00', '17:00', '21:00'].map((h, i) => hecho(`a${i}`, '2026-10-06', h)),
    sesion('s1', '2026-10-06', '19:00'),
    revision('r1', '2026-10-06', '11:00'),
    ...['08:00', '13:00'].map((h, i) => hecho(`b${i}`, '2026-10-05', h)),
    hecho('c0', '2026-10-04', '13:00'),
    hecho('sin-hora', '2026-10-04', null, { recordedAt: '2026-10-04T23:00:00.000Z' }),
  ]);
  for (const agrupar of [true, false]) {
    const { dias, hechos } = componerLosDias(entradas, { agrupar, hayMas: false });
    const vistos = dias.flatMap((d) => [...ids(d.hechos), ...ids(d.grupo?.comidas ?? [])]);
    assert.equal(hechos, entradas.length);
    assert.deepEqual([...vistos].sort(), ids(entradas).sort(), `agrupar=${agrupar}`);
    assert.deepEqual(dias.map((d) => d.fecha), ['2026-10-06', '2026-10-05', '2026-10-04'], 'los días, del más nuevo al más viejo');
  }
  // Sin agrupar, las comidas van cada una en su renglón, después de los hitos y las sesiones.
  const plano = componerLosDias(entradas, { agrupar: false, hayMas: false }).dias[0]!;
  assert.equal(plano.grupo, null);
  assert.deepEqual(ids(plano.hechos), ['r1', 's1', 'a0', 'a1', 'a2', 'a3']);
  // El hecho que solo tiene fecha va al final del día.
  assert.deepEqual(ids(componerLosDias(entradas, { agrupar: true, hayMas: false }).dias[2]!.grupo?.comidas ?? []), ['c0', 'sin-hora']);
});

test('una sola comida va en su renglón: abrir un grupo de una no ahorra nada', () => {
  const { dias } = componerLosDias([hecho('unica', '2026-10-06', '13:00')], { agrupar: true, hayMas: false });
  assert.equal(dias[0]!.grupo, null);
  assert.deepEqual(ids(dias[0]!.hechos), ['unica']);
});

test('un día sin novedades tiene solo sus comidas y ningún rasgo; una sesión, un hito o un rasgo lo cambian (C-25)', () => {
  const comidas = (fecha: string, extra: Partial<EntradaDeLineaDeTiempo> = {}) => [hecho(`${fecha}-a`, fecha, '08:00'), hecho(`${fecha}-b`, fecha, '13:00', extra)];
  const conNovedades = (entradas: EntradaDeLineaDeTiempo[]) => componerLosDias(ordenarEntradas(entradas), { agrupar: true, hayMas: false }).dias[0]!.conNovedades;
  assert.equal(conNovedades(comidas('2026-10-06')), false);
  // «Falta algún nutriente» y «cantidades informadas» no son novedades: no hay nada distinto que mirar.
  assert.equal(conNovedades(comidas('2026-10-06', { quality: ['QUANTITIES_REPORTED', 'NUTRIENTS_INCOMPLETE'] })), false);
  assert.equal(conNovedades([...comidas('2026-10-06'), sesion('s', '2026-10-06', '19:00')]), true);
  assert.equal(conNovedades([...comidas('2026-10-06'), toma('t', '2026-10-06', '08:40')]), true);
  assert.equal(conNovedades(comidas('2026-10-06', { quality: ['QUANTITIES_UNCONFIRMED'] })), true);
  assert.equal(conNovedades(comidas('2026-10-06', { state: 'ANNULLED' })), true);
  assert.equal(conNovedades(comidas('2026-10-06', { recordedAt: '2026-10-08T15:00:00.000Z' })), true, 'cargada dos días después');
});

test('si quedan hechos por leer, el último día leído no se muestra por la mitad', () => {
  const entradas = ordenarEntradas([
    ...['08:00', '13:00', '21:00'].map((h, i) => hecho(`a${i}`, '2026-10-06', h)),
    // La página se cortó acá: del 5/10 llegaron dos de sus cuatro comidas.
    hecho('b3', '2026-10-05', '21:00'),
    hecho('b2', '2026-10-05', '17:00'),
  ]);
  const cortado = componerLosDias(entradas, { agrupar: true, hayMas: true });
  assert.deepEqual(cortado.dias.map((d) => d.fecha), ['2026-10-06'], 'el 5/10 espera a que se lea lo que falta');
  assert.equal(cortado.hechos, 3);
  // Sin más por leer, el mismo día está completo y se muestra.
  const entero = componerLosDias(entradas, { agrupar: true, hayMas: false });
  assert.deepEqual(entero.dias.map((d) => [d.fecha, d.grupo?.comidas.length]), [
    ['2026-10-06', 3],
    ['2026-10-05', 2],
  ]);
  assert.equal(entero.hechos, 5);
  // Si lo leído es de un solo día y quedan más, se muestra sin agrupar ni contar, marcado como incompleto.
  const unSoloDia = componerLosDias(entradas.slice(0, 3), { agrupar: true, hayMas: true });
  assert.equal(unSoloDia.dias.length, 1);
  assert.equal(unSoloDia.dias[0]!.incompleto, true);
  assert.equal(unSoloDia.dias[0]!.grupo, null);
  assert.equal(unSoloDia.hechos, 3);
});

test('los días sin hechos entre dos días de la lista: un hueco con sus fechas, nunca un cero', () => {
  assert.equal(diasSinHechosEntre('2026-09-24', '2026-09-23'), null, 'días seguidos');
  assert.equal(diasSinHechosEntre('2026-09-24', '2026-09-24'), null);
  assert.deepEqual(diasSinHechosEntre('2026-09-24', '2026-09-22'), { desde: '2026-09-23', hasta: '2026-09-23', dias: 1 });
  assert.deepEqual(diasSinHechosEntre('2026-10-02', '2026-09-28'), { desde: '2026-09-29', hasta: '2026-10-01', dias: 3 }, 'cruza el fin de mes');
  assert.deepEqual(diasSinHechosEntre('2027-01-02', '2026-12-30'), { desde: '2026-12-31', hasta: '2027-01-01', dias: 2 }, 'cruza el fin de año');
});

// ─── Las vistas con nombre ──────────────────────────────────────────────────────────────────────

/** Un período con todas las combinaciones que arma la API (`lectura-linea-de-tiempo.ts`), y varias de cada una. */
const PERIODO: EntradaDeLineaDeTiempo[] = ordenarEntradas([
  ...Array.from({ length: 9 }, (_, i) => hecho(`plan-${i}`, `2026-09-${String(10 + i).padStart(2, '0')}`, '13:00', { quality: ['QUANTITIES_FROM_PLAN', ...(i % 2 ? (['NUTRIENTS_INCOMPLETE'] as const) : [])] })),
  hecho('sc-1', '2026-09-11', '17:00', { quality: ['QUANTITIES_UNCONFIRMED'] }),
  hecho('sc-2', '2026-09-12', '17:00', { quality: ['QUANTITIES_UNCONFIRMED'] }),
  hecho('sc-3', '2026-09-12', '21:00', { quality: ['QUANTITIES_UNCONFIRMED'], state: 'ANNULLED' }),
  hecho('inf-igual', '2026-09-13', '17:00', { quality: ['QUANTITIES_REPORTED'] }),
  hecho('inf-dist-1', '2026-09-13', '21:00', { quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'] }),
  hecho('inf-dist-2', '2026-09-14', '21:00', { quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN', 'NUTRIENTS_INCOMPLETE'] }),
  hecho('dif-1', '2026-09-15', '21:00', { quality: ['DIFFERENT_MEAL'] }),
  sesion('ses-1', '2026-09-10', '19:00'),
  sesion('ses-2', '2026-09-12', '19:00', { quality: ['SESSION_WITH_DEVIATION'] }),
  sesion('ses-3', '2026-09-14', '19:00', { quality: ['SESSION_WITH_DEVIATION', 'SESSION_SUMMARY_ONLY'] }),
  sesion('ses-4', '2026-09-16', '19:00', { quality: ['SESSION_NOT_COMPLETED'] }),
  toma('toma-1', '2026-09-10', '08:40'),
  toma('toma-2', '2026-09-17', '08:40', { state: 'CORRECTED' }),
  revision('rev-1', '2026-09-18', '11:00'),
  hecho('plan-act', '2026-09-10', '10:00', { eventType: 'NUTRITION_PLAN_ACTIVATED', source: { type: 'NUTRITION_PLAN_VERSION', id: 'p' }, quality: [] }),
  hecho('seg', '2026-09-10', '09:00', { eventType: 'FOLLOW_UP_OPENED', source: { type: 'FOLLOW_UP_PROCESS', id: 's' }, quality: [] }),
]);

test('la cantidad que anuncia cada vista es la cantidad de hechos que trae con sus filtros (C-07)', () => {
  const conteos = conteosDelPeriodo(PERIODO);
  const esperado = { TODO: PERIODO.length, HITOS: 5, DISTINTO_DE_LO_INDICADO: 4, SIN_CONFIRMAR: 3 } as const;
  assert.deepEqual(VISTAS_DE_LA_LINEA.map((v) => v.clave), ['TODO', 'HITOS', 'DISTINTO_DE_LO_INDICADO', 'SIN_CONFIRMAR']);
  for (const v of VISTAS_DE_LA_LINEA) {
    const traidos = PERIODO.filter((e) => cumpleFiltros(e, filtrosDeLaVista(v)));
    assert.equal(cuentaDeLaVista(v, conteos), traidos.length, `${v.nombre}: la cuenta coincide con la consulta`);
    assert.equal(traidos.length, esperado[v.clave], `${v.nombre}: a mano`);
  }
  // Los hitos son los hechos que `esHito` reconoce: la vista y los renglones destacados son los mismos.
  const hitos = VISTAS_DE_LA_LINEA.find((v) => v.clave === 'HITOS')!;
  assert.deepEqual(ids(PERIODO.filter((e) => cumpleFiltros(e, filtrosDeLaVista(hitos)))).sort(), ids(PERIODO.filter(esHito)).sort());
  // Un período sin hechos: todas las vistas en cero, sin romperse.
  for (const v of VISTAS_DE_LA_LINEA) assert.equal(cuentaDeLaVista(v, conteosDelPeriodo([])), 0);
});

test('una vista con dos rasgos de calidad los toma de áreas distintas: ningún hecho se cuenta dos veces', () => {
  for (const calidad of CalidadDeEntradaSchema.options) assert.ok(DOMINIO_DE_LA_CALIDAD[calidad], `${calidad} tiene su área`);
  for (const v of VISTAS_DE_LA_LINEA) {
    const areas = v.calidades.map((c) => DOMINIO_DE_LA_CALIDAD[c]);
    assert.equal(new Set(areas).size, areas.length, `${v.nombre}: ${v.calidades.join(', ')}`);
    assert.ok(!(v.tipos.length > 0 && v.calidades.length > 0), `${v.nombre}: tipos o rasgos, no las dos cosas (la cuenta sale de un solo conteo)`);
  }
  // Los rasgos de calidad son del área de su hecho: la API no pone un rasgo de sesión en una comida.
  for (const e of PERIODO) for (const q of e.quality) assert.equal(DOMINIO_DE_LA_CALIDAD[q], DOMINIO_DE_TIPO_DE_EVENTO[e.eventType]);
});

test('qué vista corresponde a unos filtros: la exacta, o ninguna si es una combinación a medida', () => {
  for (const v of VISTAS_DE_LA_LINEA) assert.equal(vistaDeLosFiltros(filtrosDeLaVista(v)), v.clave);
  assert.equal(vistaDeLosFiltros({}), 'TODO');
  assert.equal(vistaDeLosFiltros({ tipos: [...TIPOS_DE_HITO].reverse() }), 'HITOS', 'el orden no importa');
  assert.equal(vistaDeLosFiltros({ calidades: ['SESSION_WITH_DEVIATION', 'QUANTITIES_DIFFER_FROM_PLAN'] }), 'DISTINTO_DE_LO_INDICADO');
  // Con cualquier otro filtro encima deja de ser la vista con nombre: lo que se ve no es lo que el nombre promete.
  assert.equal(vistaDeLosFiltros({ tipos: TIPOS_DE_HITO, dominios: ['NUTRITION'] }), null);
  assert.equal(vistaDeLosFiltros({ calidades: ['QUANTITIES_UNCONFIRMED'], soloTardias: true }), null);
  assert.equal(vistaDeLosFiltros({ calidades: ['QUANTITIES_UNCONFIRMED'], q: 'cena' }), null);
  assert.equal(vistaDeLosFiltros({ novedadesDesde: '2026-09-20T14:00:00.000Z' }), null);
  assert.equal(vistaDeLosFiltros({ tipos: ['MEAL_RECORDED'] }), null);
  assert.equal(vistaDeLosFiltros({ calidades: ['QUANTITIES_DIFFER_FROM_PLAN'] }), null, 'una parte de la vista no es la vista');
});
