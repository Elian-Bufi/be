/**
 * Un hecho de la línea de tiempo en un renglón (WP-ESCRITORIO-AMABLE, parte 4;
 * `apps/web/src/app/pro/advisees/seguimiento/hecho-en-un-renglon.ts`): qué es, lo que lo distingue y, si es una comida,
 * cómo se registraron sus cantidades.
 * - sale todo de la entrada que entrega API-DSH-04, con los títulos y los rótulos que arma la API
 *   (`apps/api/src/analisis/lectura-linea-de-tiempo.ts`): acá van tal como llegan;
 * - nada se calcula ni se completa: sin el dato, el renglón no lo inventa;
 * - si la API cambia un título o un rótulo, el renglón cae en el título entero y en el primer detalle.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { cambiosDelRegistro, dondeCoincide, frenteALoIndicadoDe, numeroDeVersionDe, relacionesEnPalabras, renglonDelHecho, textoDelHueco, tituloDelHecho, ICONO_DEL_RASGO, VERBO_DE_LA_RELACION } = await import('../apps/web/src/app/pro/advisees/seguimiento/hecho-en-un-renglon.ts');
const { ICONOS, RASGOS_DE_UN_HECHO } = await import('../packages/domain/dist/index.js');

const entrada = (eventType, title, details = [], extra = {}) => ({
  timelineEntryId: 'x',
  domain: 'NUTRITION',
  eventType,
  source: { type: 'MEAL_RECORD', id: 'x' },
  occurredAt: '2026-10-09T16:00:00.000Z',
  occurredDate: '2026-10-09',
  recordedAt: '2026-10-09T16:10:00.000Z',
  recordedLate: false,
  timeZone: 'America/Argentina/Buenos_Aires',
  author: null,
  title,
  details: details.map(([label, value]) => ({ label, value })),
  state: 'EFFECTIVE',
  quality: [],
  planVersionId: null,
  exerciseKeys: [],
  relations: [],
  ...extra,
});

test('una comida: el nombre de la comida, la opción elegida y el modo de registro de siempre', () => {
  const e = entrada(
    'MEAL_RECORDED',
    'Comida registrada · Almuerzo',
    [
      ['Opción', '1 · Arroz con pollo y brócoli'],
      ['Cantidades', 'las del plan, confirmadas'],
      ['Calorías registradas', '440 kcal'],
      ['Plan', 'versión 2'],
    ],
    { quality: ['QUANTITIES_FROM_PLAN'] },
  );
  assert.deepEqual(renglonDelHecho(e), { icono: 'nutricion', nombre: 'Almuerzo', dato: 'Arroz con pollo y brócoli', modo: { icono: 'plan', texto: 'Porciones del plan' } });
  assert.equal(tituloDelHecho(e), 'Almuerzo · Arroz con pollo y brócoli');
  // Informadas a mano es un modo, no una diferencia: la diferencia comprobada es un rasgo aparte.
  const informadas = renglonDelHecho({ ...e, quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'] });
  assert.deepEqual(informadas.modo, { icono: 'a-mano', texto: 'Cantidades informadas' });
  // Sin confirmar no es un modo de siempre: lo dice su etiqueta, y el renglón no pone otra cosa en su lugar.
  assert.equal(renglonDelHecho({ ...e, quality: ['QUANTITIES_UNCONFIRMED'] }).modo, null);
});

test('una comida diferente: su descripción, y ningún modo ni cantidad inventados', () => {
  const e = entrada(
    'MEAL_RECORDED',
    'Comida diferente · Cena',
    [
      ['Descripción', 'Milanesa con ensalada en un cumpleaños'],
      ['Cantidad aproximada', 'Un plato'],
      ['Calorías y macros', 'sin calcular (no se inventan)'],
    ],
    { quality: ['DIFFERENT_MEAL'] },
  );
  assert.deepEqual(renglonDelHecho(e), { icono: 'nutricion', nombre: 'Cena', dato: 'Milanesa con ensalada en un cumpleaños', modo: null });
  // Una opción sin nombre se dice con su número; una comida sin opción ni descripción no lleva dato.
  assert.equal(renglonDelHecho(entrada('MEAL_RECORDED', 'Comida registrada · Desayuno', [['Opción', '2']])).dato, 'Opción 2');
  assert.equal(renglonDelHecho(entrada('MEAL_RECORDED', 'Comida registrada · Desayuno', [['Plan', 'versión 2']])).dato, null);
});

test('una sesión: su nombre en el plan (que puede traer un punto medio) y cuántas de sus series tienen datos', () => {
  const e = entrada(
    'TRAINING_SESSION_RECORDED',
    'Sesión registrada · A · Tren inferior',
    [
      ['Condición', 'Realizada'],
      ['Series con datos', '7'],
      ['Ejercicios', 'Sentadilla, Peso muerto'],
    ],
    { domain: 'TRAINING' },
  );
  // «Series con datos» no son todas las series de la sesión: el renglón lo dice con esas palabras.
  assert.deepEqual(renglonDelHecho(e), { icono: 'entrenamiento', nombre: 'Sesión A · Tren inferior', dato: '7 series con datos', modo: null });
  assert.equal(tituloDelHecho(e), 'Sesión A · Tren inferior', 'la cuenta de series no es parte del nombre');
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · B', [['Series con datos', '1']])).dato, '1 serie con datos');
  // El nombre lo escribe el profesional: si ya empieza con «Sesión», no se le antepone otra.
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · Sesión de fuerza')).nombre, 'Sesión de fuerza');
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · sesion 3')).nombre, 'sesion 3');
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · Sesiones cortas')).nombre, 'Sesión Sesiones cortas', '«Sesiones» es otra palabra');
  // Resumida o no realizada: no hay series que contar, y el renglón no pone un cero.
  const resumida = entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · A · Tren inferior', [
    ['Condición', 'Realizada'],
    ['Registro', 'resumido, sin series'],
  ]);
  assert.equal(renglonDelHecho(resumida).dato, null);
});

test('los hitos: cada uno con su ícono, su nombre y el dato que lo distingue', () => {
  assert.deepEqual(renglonDelHecho(entrada('ANTHROPOMETRIC_EVALUATION_RECORDED', 'Toma antropométrica registrada', [['Mediciones vigentes', '9'], ['Protocolo', 'Perfil antropométrico completo']])), {
    icono: 'antropometria',
    nombre: 'Toma antropométrica',
    dato: '9 mediciones',
    modo: null,
  });
  assert.equal(renglonDelHecho(entrada('ANTHROPOMETRIC_EVALUATION_RECORDED', 'Toma antropométrica registrada', [['Mediciones vigentes', '1']])).dato, '1 medición');
  assert.deepEqual(renglonDelHecho(entrada('NUTRITION_REVIEW_RECORDED', 'Revisión de nutrición registrada', [['Período revisado', '21/8/2026 al 20/9/2026'], ['Resultado', 'Mantener']])), {
    icono: 'revision',
    nombre: 'Revisión de nutrición',
    dato: 'Resultado: Mantener',
    modo: null,
  });
  assert.deepEqual(renglonDelHecho(entrada('TRAINING_PLAN_ACTIVATED', 'Plan de entrenamiento activado · versión 2', [['Versión', '2'], ['Reemplaza a', 'la versión 1']])), {
    icono: 'plan',
    nombre: 'Plan de entrenamiento activado · versión 2',
    dato: 'Reemplaza a la versión 1',
    modo: null,
  });
  assert.equal(renglonDelHecho(entrada('NUTRITION_PLAN_ACTIVATED', 'Plan de nutrición activado · versión 1', [['Versión', '1'], ['Primera versión activada', 'sí']])).dato, 'Primera versión activada');
  assert.equal(renglonDelHecho(entrada('NUTRITION_OBJECTIVE_SET', 'Objetivo de nutrición actualizado', [['Requerimiento energético estimado', '1950 kcal/día']])).dato, '1950 kcal/día');
  assert.equal(renglonDelHecho(entrada('TRAINING_OBJECTIVE_SET', 'Objetivo de entrenamiento definido', [['Objetivo', 'Ganar fuerza en los básicos']])).dato, 'Ganar fuerza en los básicos');
  assert.deepEqual(renglonDelHecho(entrada('FOLLOW_UP_OPENED', 'Seguimiento de entrenamiento abierto')), { icono: 'seguimiento', nombre: 'Seguimiento de entrenamiento abierto', dato: null, modo: null });
  assert.equal(renglonDelHecho(entrada('FOLLOW_UP_CLOSED', 'Seguimiento de nutrición cerrado', [['Motivo', 'Fin del vínculo']])).dato, 'Motivo: Fin del vínculo');
  // DL-140: una nota de coordinación dice para qué es y quién la escribió; el texto, al abrirla. El detalle lleva la finalidad.
  const nota = entrada('COORDINATION_NOTE_RECORDED', 'Nota de coordinación · Pedido de coordinación', [['Desde', 'Nutrición'], ['Para', 'Prof. Martín Acosta'], ['Nota', 'Texto sintético.']], {
    author: { identityId: 'a', displayName: 'Lic. Sofía Paz', role: 'PROFESSIONAL' },
    source: { type: 'COORDINATION_NOTE', id: 'n' },
  });
  assert.deepEqual(renglonDelHecho(nota), { icono: 'texto', nombre: 'Nota de coordinación', dato: 'Pedido de coordinación · de Lic. Sofía Paz', modo: null });
  assert.equal(tituloDelHecho(nota), 'Nota de coordinación · Pedido de coordinación');
  // Sin autor ni finalidad en el título, no inventa nada.
  assert.deepEqual(renglonDelHecho(entrada('COORDINATION_NOTE_RECORDED', 'Nota de coordinación')), { icono: 'texto', nombre: 'Nota de coordinación', dato: null, modo: null });
});

test('si la API cambia un título o un rótulo, el renglón no inventa: muestra el título entero y lo que haya', () => {
  // Un título sin el punto medio queda entero.
  assert.equal(renglonDelHecho(entrada('MEAL_RECORDED', 'Almuerzo registrado')).nombre, 'Almuerzo registrado');
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión del martes')).nombre, 'Sesión del martes');
  // Un rótulo que ya no se llama igual: la toma y la revisión caen en su primer detalle; la sesión, sin dato.
  assert.equal(renglonDelHecho(entrada('ANTHROPOMETRIC_EVALUATION_RECORDED', 'Toma antropométrica registrada', [['Mediciones', '9']])).dato, 'Mediciones: 9');
  assert.equal(renglonDelHecho(entrada('TRAINING_REVIEW_RECORDED', 'Revisión de entrenamiento registrada', [['Decisión', 'Ajustar']])).dato, 'Decisión: Ajustar');
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · A', [['Series', '7']])).dato, null);
  // Una cuenta que no es un número no se pluraliza a ciegas.
  assert.equal(renglonDelHecho(entrada('TRAINING_SESSION_RECORDED', 'Sesión registrada · A', [['Series con datos', 'varias']])).dato, null);
});

test('cada rasgo tiene un ícono que existe, y cada relación con fecha, su verbo', () => {
  for (const r of RASGOS_DE_UN_HECHO) assert.ok(ICONOS[ICONO_DEL_RASGO[r]], `${r} → ${ICONO_DEL_RASGO[r]}`);
  // El catálogo de íconos reserva el desvío para «una comida diferente o una sesión con cambios», el mismo en las dos áreas.
  assert.equal(ICONO_DEL_RASGO.COMIDA_DIFERENTE, 'desvio');
  assert.equal(ICONO_DEL_RASGO.SESION_CON_CAMBIOS, 'desvio');
  const iconos = ['nutricion', 'entrenamiento', 'antropometria', 'revision', 'plan', 'objetivo', 'seguimiento', 'a-mano', 'texto'];
  for (const i of iconos) assert.ok(ICONOS[i], i);
  assert.deepEqual(Object.keys(VERBO_DE_LA_RELACION).sort(), ['ANNULLED', 'CORRECTED', 'MEASUREMENT_ANNULLED', 'MEASUREMENT_CORRECTED', 'RECTIFIED']);
});

test('el número de versión de un plan activado sale de la entrada: su planificación no se abre como «versión 0»', () => {
  assert.equal(numeroDeVersionDe(entrada('NUTRITION_PLAN_ACTIVATED', 'Plan de nutrición activado · versión 2', [['Versión', '2'], ['Reemplaza a', 'la versión 1']])), 2);
  // Si el detalle faltara, el número del título.
  assert.equal(numeroDeVersionDe(entrada('TRAINING_PLAN_ACTIVATED', 'Plan de entrenamiento activado · versión 12')), 12);
  // Sin número, o en un hecho que no es una activación, no se inventa uno.
  assert.equal(numeroDeVersionDe(entrada('TRAINING_PLAN_ACTIVATED', 'Plan de entrenamiento activado')), undefined);
  assert.equal(numeroDeVersionDe(entrada('MEAL_RECORDED', 'Comida registrada · Almuerzo', [['Versión', '2']])), undefined);
});

test('con un texto buscado, el renglón dice por qué coincide cuando no está a la vista', () => {
  const sesion = entrada(
    'TRAINING_SESSION_RECORDED',
    'Sesión registrada · B · Tren superior',
    [
      ['Condición', 'No realizada'],
      ['Motivo', 'Viaje laboral'],
      ['Plan', 'versión 1'],
    ],
    { domain: 'TRAINING', quality: ['SESSION_NOT_COMPLETED'], relations: [{ kind: 'EXECUTES_PLAN_VERSION', at: null, target: null, label: 'Ejecuta la versión 1 del plan' }] },
  );
  // «viaje» está en el motivo, que el renglón no muestra: se dice. Sin distinguir mayúsculas ni acentos, como la búsqueda.
  assert.equal(dondeCoincide(sesion, 'VIAJÉ'), 'Motivo: Viaje laboral');
  // Lo que ya está a la vista (el nombre, el dato, una etiqueta) no se repite.
  assert.equal(dondeCoincide(sesion, 'tren superior'), null);
  assert.equal(dondeCoincide(sesion, 'no realizada'), null, 'lo dice la etiqueta del renglón');
  // Dos palabras: alcanza con que falte una a la vista; se muestra el detalle que la tiene.
  assert.equal(dondeCoincide(sesion, 'superior laboral'), 'Motivo: Viaje laboral');
  // Si coincide en una relación, se dice la relación.
  assert.equal(dondeCoincide(sesion, 'ejecuta'), 'Ejecuta la versión 1 del plan');
  // Si coincide por el tipo de hecho («registrada»), no hay detalle que mostrar; sin texto, tampoco.
  assert.equal(dondeCoincide(sesion, 'registrada'), null);
  assert.equal(dondeCoincide(sesion, '   '), null);
  const comida = entrada('MEAL_RECORDED', 'Comida registrada · Cena', [['Opción', '1 · Salmón con papa'], ['Observación', 'Comí afuera, en un cumpleaños']], { quality: ['QUANTITIES_FROM_PLAN'] });
  assert.equal(dondeCoincide(comida, 'salmon'), null, 'la opción está en el renglón');
  assert.equal(dondeCoincide(comida, 'cumpleanos'), 'Observación: Comí afuera, en un cumpleaños');
});

test('lo que le pasó al registro después se dice una vez por clase de cambio, con la fecha del último', () => {
  const rectificada = entrada('MEAL_RECORDED', 'Comida registrada · Almuerzo', [], {
    relations: [
      { kind: 'RECTIFIED', at: '2026-10-10T13:00:00.000Z', target: null, label: 'Cantidades rectificadas: cuenta una sola vez, en su versión vigente' },
      { kind: 'EXECUTES_PLAN_VERSION', at: null, target: null, label: 'Registrado sobre la versión 2 del plan' },
    ],
  });
  assert.deepEqual(cambiosDelRegistro(rectificada), [{ clase: 'RECTIFIED', verbo: 'Se rectificó', instante: '2026-10-10T13:00:00.000Z', cuantos: 1 }]);
  assert.deepEqual(relacionesEnPalabras(rectificada), ['Cantidades rectificadas: cuenta una sola vez, en su versión vigente', 'Registrado sobre la versión 2 del plan']);
  // Una toma con tres mediciones corregidas y una anulada: dos renglones, no cuatro.
  const medicion = (kind, at) => ({ kind, at, target: null, label: kind === 'MEASUREMENT_CORRECTED' ? 'Medición corregida' : 'Medición anulada' });
  const toma = entrada('ANTHROPOMETRIC_EVALUATION_RECORDED', 'Toma antropométrica registrada', [], {
    relations: [
      medicion('MEASUREMENT_CORRECTED', '2026-08-11T12:00:00.000Z'),
      medicion('MEASUREMENT_CORRECTED', '2026-08-14T09:00:00.000Z'),
      medicion('MEASUREMENT_CORRECTED', '2026-08-12T12:00:00.000Z'),
      medicion('MEASUREMENT_ANNULLED', '2026-08-13T12:00:00.000Z'),
    ],
  });
  assert.deepEqual(cambiosDelRegistro(toma), [
    { clase: 'MEASUREMENT_CORRECTED', verbo: 'Se corrigieron 3 mediciones', instante: '2026-08-14T09:00:00.000Z', cuantos: 3 },
    { clase: 'MEASUREMENT_ANNULLED', verbo: 'Se anuló una medición', instante: '2026-08-13T12:00:00.000Z', cuantos: 1 },
  ]);
  assert.deepEqual(relacionesEnPalabras(toma), ['Medición corregida (3)', 'Medición anulada']);
  // Sin relaciones con fecha, nada: no se inventa un cambio.
  assert.deepEqual(cambiosDelRegistro(entrada('MEAL_RECORDED', 'Comida registrada · Cena')), []);
});

test('«Frente a lo indicado» sale de la entrada tal como lo escribió el dominio, o no está', () => {
  const informada = entrada('MEAL_RECORDED', 'Comida registrada · Cena', [['Opción', '1 · Salmón con papa'], ['Cantidades', 'informadas a mano'], ['Frente a lo indicado', 'Distinta de lo indicado en 2 de 3 ingredientes']]);
  assert.equal(frenteALoIndicadoDe(informada), 'Distinta de lo indicado en 2 de 3 ingredientes');
  assert.equal(frenteALoIndicadoDe(entrada('MEAL_RECORDED', 'Comida registrada · Cena', [['Cantidades', 'las del plan, confirmadas']])), null);
});

test('los días sin hechos se dicen con sus fechas: uno, dos o un tramo, y el mes una sola vez si es el mismo', () => {
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const fecha = (f) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]}`;
  assert.equal(textoDelHueco({ desde: '2026-08-09', hasta: '2026-08-09', dias: 1 }, fecha), '9 ago: sin hechos registrados');
  assert.equal(textoDelHueco({ desde: '2026-08-11', hasta: '2026-08-12', dias: 2 }, fecha), '11 y 12 ago: sin hechos registrados');
  assert.equal(textoDelHueco({ desde: '2026-09-30', hasta: '2026-10-01', dias: 2 }, fecha), '30 sept y 1 oct: sin hechos registrados', 'dos meses: cada uno con el suyo');
  assert.equal(textoDelHueco({ desde: '2026-10-05', hasta: '2026-10-09', dias: 5 }, fecha), 'Del 5 al 9 oct: 5 días sin hechos registrados');
  assert.equal(textoDelHueco({ desde: '2026-09-29', hasta: '2026-10-01', dias: 3 }, fecha), 'Del 29 sept al 1 oct: 3 días sin hechos registrados');
  // Nunca un cero ni una cuenta de registros: dice que no hay hechos, y de qué días.
  for (const dias of [1, 2, 7]) assert.doesNotMatch(textoDelHueco({ desde: '2026-10-01', hasta: '2026-10-07', dias }, fecha), /\b0\b|registros/);
});
