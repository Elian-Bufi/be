/**
 * Los registros de Nutrición por día (WP-ESCRITORIO-AREAS, parte 1): las filas, sus estados, las vistas con su cuenta y
 * el día dicho en un renglón.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 20, del criterio (C-49 a C-51 y C-53) y de lo que
 * dicen los contratos del contraste y de la línea de tiempo. Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EntradaDeLineaDeTiempo } from './contratos-analisis';
import type { ContrasteDescriptivo } from './contratos-nutricion';
import {
  componerLosRegistros,
  contarLasVistas,
  diaAbiertoAlEntrar,
  diasSinComidasDelPlan,
  diferenciaEnUnRenglon,
  filaEnLaVista,
  frenteALoIndicadoDeUnaComida,
  modoDeUnaComida,
  MODO_EN_UN_RENGLON,
  opcionDeUnaComida,
  rasgosDeLaFila,
  registroDeLaOpcion,
  resumenDeUnDia,
  VISTAS_DE_REGISTROS,
  type ClaveDeVistaDeRegistros,
  type DiaDeRegistros,
} from './registros-de-nutricion';

type Dia = ContrasteDescriptivo['days'][number];
type Comida = Dia['meals'][number];

const comida = (etiqueta: string, extra: Partial<Comida> = {}): Comida => ({
  mealId: `comida-${etiqueta.toLowerCase()}`,
  label: etiqueta,
  state: 'NO_DATA',
  registeredOptionId: null,
  executionId: null,
  differentMealExecutionIds: [],
  quantityDifferences: [],
  ...extra,
});
const registrada = (etiqueta: string, registro: string, extra: Partial<Comida> = {}): Comida => comida(etiqueta, { state: 'REGISTERED', registeredOptionId: `opcion-${registro}`, executionId: registro, ...extra });
const dia = (fecha: string, meals: Comida[], extra: Partial<Dia> = {}): Dia => ({
  date: fecha,
  planId: 'plan-1',
  dayTypeId: 'dia-tipo-1',
  dataState: meals.some((m) => m.state === 'REGISTERED' || m.differentMealExecutionIds.length > 0) ? 'HAS_DATA' : 'NO_DATA',
  meals,
  outsidePrescription: [],
  ...extra,
});
/** Lo que la línea de tiempo dice de un registro de comida. */
const entrada = (registro: string, extra: Partial<EntradaDeLineaDeTiempo> = {}): EntradaDeLineaDeTiempo => ({
  timelineEntryId: `meal:${registro}`,
  domain: 'NUTRITION',
  eventType: 'MEAL_RECORDED',
  source: { type: 'MEAL_RECORD', id: registro },
  occurredAt: '2026-09-25T12:30:00.000-03:00',
  occurredDate: '2026-09-25',
  recordedAt: '2026-09-25T12:40:00.000-03:00',
  recordedLate: false,
  timeZone: 'America/Argentina/Buenos_Aires',
  author: null,
  title: 'Comida registrada · Almuerzo',
  details: [{ label: 'Opción', value: '1 · Tarta de atún' }],
  state: 'EFFECTIVE',
  quality: ['QUANTITIES_FROM_PLAN'],
  planVersionId: 'plan-1',
  exerciseKeys: [],
  relations: [],
  ...extra,
});
const POLLO = { itemId: 'item-pollo', name: 'Pollo', prescribed: { value: 150, unit: 'g' as const }, registered: { value: 180, unit: 'g' as const }, difference: 30, unit: 'g' as const };
const ACEITE = { itemId: 'item-aceite', name: 'Aceite', prescribed: { value: 10, unit: 'ml' as const }, registered: { value: 5, unit: 'ml' as const }, difference: -5, unit: 'ml' as const };

/**
 * El período de la maqueta, en chico. El 25: dos comidas con las porciones del plan, una sin registro y una cena con una
 * comida diferente. El 24: cuatro registradas, una con cantidades informadas que difieren. El 23: cuatro con las
 * porciones del plan. El 22: sin ningún registro. El 21: una sola registrada, sin confirmar, y una comida diferente que
 * no se registró en ninguna comida.
 */
const CONTRASTE: ContrasteDescriptivo = {
  days: [
    dia('2026-09-21', [registrada('Desayuno', 'r-21-des'), comida('Almuerzo')], { outsidePrescription: [{ executionId: 'r-21-suelta', description: 'Empanadas en la calle' }] }),
    dia('2026-09-22', [comida('Desayuno'), comida('Almuerzo'), comida('Merienda'), comida('Cena')]),
    dia('2026-09-23', [registrada('Desayuno', 'r-23-des'), registrada('Almuerzo', 'r-23-alm'), registrada('Merienda', 'r-23-mer'), registrada('Cena', 'r-23-cen')]),
    dia('2026-09-24', [registrada('Desayuno', 'r-24-des'), registrada('Almuerzo', 'r-24-alm', { quantityDifferences: [POLLO, ACEITE] }), registrada('Merienda', 'r-24-mer'), registrada('Cena', 'r-24-cen')]),
    dia('2026-09-25', [registrada('Desayuno', 'r-25-des'), registrada('Almuerzo', 'r-25-alm'), comida('Merienda'), comida('Cena', { differentMealExecutionIds: ['r-25-pizza'] })], {
      outsidePrescription: [{ executionId: 'r-25-pizza', description: 'Pizza con amigos' }],
    }),
  ],
};
const ENTRADAS: EntradaDeLineaDeTiempo[] = [
  entrada('r-21-des', { quality: ['QUANTITIES_UNCONFIRMED'], details: [{ label: 'Opción', value: '2' }] }),
  entrada('r-21-suelta', { title: 'Comida diferente · Comida', quality: ['DIFFERENT_MEAL'], details: [{ label: 'Descripción', value: 'Empanadas en la calle' }] }),
  ...['r-23-des', 'r-23-alm', 'r-23-mer', 'r-23-cen', 'r-24-des', 'r-24-mer', 'r-24-cen', 'r-25-des', 'r-25-alm'].map((r) => entrada(r)),
  entrada('r-24-alm', {
    quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'],
    details: [
      { label: 'Opción', value: '1 · Pollo, arroz y verduras' },
      { label: 'Frente a lo indicado', value: 'Distinta de lo indicado en 2 de 4 ingredientes' },
    ],
  }),
  entrada('r-25-pizza', { title: 'Comida diferente · Cena', quality: ['DIFFERENT_MEAL'], details: [{ label: 'Descripción', value: 'Pizza con amigos' }, { label: 'Cantidad aproximada', value: '3 porciones' }] }),
  // Un registro anulado: la línea de tiempo lo trae y el contraste no. No arma ninguna fila.
  entrada('r-22-anulado', { state: 'ANNULLED', occurredDate: '2026-09-22' }),
];
const DIAS = componerLosRegistros(CONTRASTE, ENTRADAS);
const elDia = (fecha: string, dias: readonly DiaDeRegistros[] = DIAS): DiaDeRegistros => dias.find((d) => d.fecha === fecha)!;

test('los días van del más nuevo al más viejo y las comidas, en el orden del plan', () => {
  assert.deepEqual(DIAS.map((d) => d.fecha), ['2026-09-25', '2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21']);
  assert.deepEqual(elDia('2026-09-25').filas.map((f) => f.comida), ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']);
});

test('cada fila está en un solo estado, y los tres suman «Todas las comidas»', () => {
  const filas = DIAS.flatMap((d) => d.filas);
  const cuenta = (estado: string) => filas.filter((f) => f.estado === estado).length;
  // 25: 2 registradas, 1 sin registro, 1 con comida diferente. 24 y 23: 4 y 4. 22: 4 sin registro. 21: 1 registrada, 1 sin
  // registro y la comida diferente suelta.
  assert.equal(cuenta('REGISTRADA'), 2 + 4 + 4 + 0 + 1);
  assert.equal(cuenta('SIN_REGISTRO'), 1 + 0 + 0 + 4 + 1);
  assert.equal(cuenta('COMIDA_DIFERENTE'), 1 + 0 + 0 + 0 + 1);
  assert.equal(filas.length, 11 + 6 + 2);
  const cuentas = contarLasVistas(DIAS, true);
  assert.equal(cuentas.TODAS, 19);
  assert.equal(cuentas.TODAS, cuenta('REGISTRADA') + cuenta('SIN_REGISTRO') + cuenta('COMIDA_DIFERENTE'));
  assert.equal(new Set(filas.map((f) => f.clave)).size, filas.length, 'las claves no se repiten');
});

test('una comida diferente no marca la comida del plan como registrada: se dice en su comida, con su registro', () => {
  const cena = elDia('2026-09-25').filas[3]!;
  assert.equal(cena.comida, 'Cena');
  assert.equal(cena.estado, 'COMIDA_DIFERENTE');
  assert.equal(registroDeLaOpcion(cena), null, 'no hay una opción del plan registrada');
  assert.deepEqual(cena.registros.map((r) => [r.id, r.clase, r.descripcion]), [['r-25-pizza', 'COMIDA_DIFERENTE', 'Pizza con amigos']]);
  // No figura además como un renglón suelto: está una sola vez.
  assert.equal(elDia('2026-09-25').filas.length, 4);
});

test('una comida diferente que no se registró en ninguna comida del plan va en un renglón propio del día', () => {
  const filas = elDia('2026-09-21').filas;
  assert.deepEqual(filas.map((f) => [f.comida, f.estado]), [['Desayuno', 'REGISTRADA'], ['Almuerzo', 'SIN_REGISTRO'], [null, 'COMIDA_DIFERENTE']]);
  assert.equal(filas[2]!.registros[0]!.descripcion, 'Empanadas en la calle');
});

test('una comida con su opción registrada y, además, una comida diferente: sigue registrada y lleva los dos registros', () => {
  const contraste: ContrasteDescriptivo = {
    days: [dia('2026-09-26', [registrada('Cena', 'r-cena', { differentMealExecutionIds: ['r-postre'] })], { outsidePrescription: [{ executionId: 'r-postre', description: 'Helado' }] })],
  };
  const [d] = componerLosRegistros(contraste, [entrada('r-cena'), entrada('r-postre', { quality: ['DIFFERENT_MEAL'] })]);
  const cena = d!.filas[0]!;
  assert.equal(cena.estado, 'REGISTRADA');
  assert.deepEqual(cena.registros.map((r) => r.clase), ['OPCION_DEL_PLAN', 'COMIDA_DIFERENTE']);
  assert.equal(registroDeLaOpcion(cena)?.id, 'r-cena');
  assert.equal(filaEnLaVista(cena, 'COMIDA_DIFERENTE'), true, 'la vista «Comida diferente» la trae');
  assert.deepEqual(rasgosDeLaFila(cena), ['COMIDA_DIFERENTE']);
});

test('cada vista trae lo que dice su nombre, contado sobre las filas', () => {
  const cuentas = contarLasVistas(DIAS, true);
  assert.deepEqual(cuentas, { TODAS: 19, DISTINTAS: 1, SIN_CONFIRMAR: 1, COMIDA_DIFERENTE: 2, SIN_REGISTRO: 6 });
  const de = (vista: ClaveDeVistaDeRegistros) => DIAS.flatMap((d) => d.filas).filter((f) => filaEnLaVista(f, vista)).map((f) => `${f.fecha.slice(8)} ${f.comida ?? 'suelta'}`);
  assert.deepEqual(de('DISTINTAS'), ['24 Almuerzo']);
  assert.deepEqual(de('SIN_CONFIRMAR'), ['21 Desayuno']);
  assert.deepEqual(de('COMIDA_DIFERENTE'), ['25 Cena', '21 suelta']);
  assert.deepEqual(de('SIN_REGISTRO'), ['25 Merienda', '22 Desayuno', '22 Almuerzo', '22 Merienda', '22 Cena', '21 Almuerzo']);
  assert.deepEqual(VISTAS_DE_REGISTROS.map((v) => v.clave), ['TODAS', 'DISTINTAS', 'SIN_CONFIRMAR', 'COMIDA_DIFERENTE', 'SIN_REGISTRO']);
});

test('sin la línea de tiempo, los días se arman igual y lo que depende de ella queda sin número: no es un cero', () => {
  const dias = componerLosRegistros(CONTRASTE, null);
  assert.deepEqual(dias.map((d) => d.filas.length), [4, 4, 4, 4, 3]);
  assert.ok(dias.flatMap((d) => d.filas).flatMap((f) => f.registros).every((r) => r.entrada === null));
  assert.deepEqual(contarLasVistas(dias, false), { TODAS: 19, DISTINTAS: null, SIN_CONFIRMAR: null, COMIDA_DIFERENTE: 2, SIN_REGISTRO: 6 });
  // El día se sigue pudiendo decir con lo que el contraste sabe.
  assert.deepEqual(resumenDeUnDia(elDia('2026-09-24', dias), false), { principal: '4 de 4 comidas con registro', notas: [] });
});

test('un registro anulado no arma ninguna fila, aunque la línea de tiempo lo traiga', () => {
  assert.ok(!DIAS.flatMap((d) => d.filas).flatMap((f) => f.registros).some((r) => r.id === 'r-22-anulado'));
  assert.equal(elDia('2026-09-22').sinRegistros, true);
});

test('el día en un renglón: «N de M comidas con registro», con lo que tiene de distinto (DL-153, criterios del 2026-10-24)', () => {
  assert.deepEqual(resumenDeUnDia(elDia('2026-09-23'), true), { principal: '4 de 4 comidas con registro', notas: [{ rasgo: null, texto: 'todas con las porciones del plan' }] });
  assert.deepEqual(resumenDeUnDia(elDia('2026-09-24'), true), { principal: '4 de 4 comidas con registro', notas: [{ rasgo: 'DISTINTO_DE_LO_INDICADO', texto: '1 distinta de lo indicado' }] });
  // El 25: dos con la opción del plan, la cena con una comida diferente y la merienda sin registro. La cena tiene registro.
  assert.deepEqual(resumenDeUnDia(elDia('2026-09-25'), true), {
    principal: '3 de 4 comidas con registro',
    notas: [
      { rasgo: null, texto: '2 con opción del plan' },
      { rasgo: 'COMIDA_DIFERENTE', texto: '1 comida diferente' },
      { rasgo: null, texto: '1 sin registro' },
    ],
  });
  // El 21: la comida diferente suelta no se registró en ninguna comida del plan, así que no cubre el almuerzo.
  assert.deepEqual(resumenDeUnDia(elDia('2026-09-21'), true), {
    principal: '1 de 2 comidas con registro',
    notas: [
      { rasgo: 'COMIDA_DIFERENTE', texto: '1 comida diferente' },
      { rasgo: 'SIN_CONFIRMAR', texto: '1 sin confirmar' },
      { rasgo: null, texto: '1 sin registro' },
    ],
  });
});

test('un día sin ningún registro dice «Sin registro», nunca «0 de 4»', () => {
  const resumen = resumenDeUnDia(elDia('2026-09-22'), true);
  assert.deepEqual(resumen, { principal: 'Sin registro', notas: [{ rasgo: null, texto: '4 comidas en el plan' }] });
  assert.ok(!/\b0 de\b/.test(`${resumen.principal} ${resumen.notas.map((n) => n.texto).join(' ')}`));
});

test('un día con solo una comida diferente, registrada en la cena: la cena tiene registro, y ninguna tiene la opción del plan', () => {
  const contraste: ContrasteDescriptivo = {
    days: [dia('2026-09-27', [comida('Desayuno'), comida('Cena', { differentMealExecutionIds: ['r-x'] })], { outsidePrescription: [{ executionId: 'r-x', description: 'Asado' }] })],
  };
  const [d] = componerLosRegistros(contraste, []);
  assert.deepEqual(resumenDeUnDia(d!, true), {
    principal: '1 de 2 comidas con registro',
    notas: [
      { rasgo: null, texto: 'ninguna con opción del plan' },
      { rasgo: 'COMIDA_DIFERENTE', texto: '1 comida diferente' },
      { rasgo: null, texto: '1 sin registro' },
    ],
  });
});

test('un día con registros, pero ninguno en una comida del plan, no dice «0 de N»', () => {
  const contraste: ContrasteDescriptivo = {
    days: [dia('2026-09-27', [comida('Desayuno'), comida('Cena')], { dataState: 'HAS_DATA', outsidePrescription: [{ executionId: 'r-x', description: 'Asado' }] })],
  };
  const resumen = resumenDeUnDia(componerLosRegistros(contraste, [])[0]!, true);
  assert.deepEqual(resumen, {
    principal: 'Ninguna comida del plan con registro',
    notas: [
      { rasgo: 'COMIDA_DIFERENTE', texto: '1 comida diferente' },
      { rasgo: null, texto: '2 sin registro' },
    ],
  });
  assert.ok(!/\b0 de\b/.test(`${resumen.principal} ${resumen.notas.map((n) => n.texto).join(' ')}`));
});

test('un día sin plan vigente, o sin un día tipo determinado, lo dice y no aporta filas del plan', () => {
  const contraste: ContrasteDescriptivo = {
    days: [
      dia('2026-09-10', [], { planId: null, dayTypeId: null }),
      dia('2026-09-11', [], { dayTypeId: null }),
      dia('2026-09-12', [], { dayTypeId: null, dataState: 'HAS_DATA', outsidePrescription: [{ executionId: 'r-y', description: 'Guiso' }] }),
    ],
  };
  const dias = componerLosRegistros(contraste, []);
  assert.deepEqual(dias.map((d) => [d.fecha.slice(8), d.sinComidasDelPlan, d.filas.length]), [['12', 'SIN_DIA_TIPO', 1], ['11', 'SIN_DIA_TIPO', 0], ['10', 'SIN_PLAN', 0]]);
  assert.deepEqual(diasSinComidasDelPlan(dias), { sinPlan: 1, sinDiaTipo: 2 });
  assert.equal(resumenDeUnDia(dias[2]!, true).principal, 'Ese día no había un plan vigente.');
  assert.equal(resumenDeUnDia(dias[1]!, true).principal, 'El plan tiene más de un día tipo y ese día no hay registros que indiquen cuál correspondía.');
  // La comida diferente de ese día sigue ahí, en su renglón, y la vista la cuenta.
  assert.deepEqual(resumenDeUnDia(dias[0]!, true).notas, [{ rasgo: 'COMIDA_DIFERENTE', texto: '1 comida diferente' }]);
  assert.equal(contarLasVistas(dias, true).TODAS, 1);
});

test('«todas con las porciones del plan» se dice solo si es cierto de todas', () => {
  const con = (calidad: EntradaDeLineaDeTiempo['quality']) =>
    resumenDeUnDia(componerLosRegistros({ days: [dia('2026-09-28', [registrada('Desayuno', 'a'), registrada('Cena', 'b')])] }, [entrada('a'), entrada('b', { quality: calidad })])[0]!, true).notas;
  assert.deepEqual(con(['QUANTITIES_FROM_PLAN']), [{ rasgo: null, texto: 'todas con las porciones del plan' }]);
  // Cantidades informadas que coinciden con la opción: no son «las porciones del plan».
  assert.deepEqual(con(['QUANTITIES_REPORTED']), []);
  // Con una comida sin registro tampoco: no es cierto de todas las del día.
  const conHueco = componerLosRegistros({ days: [dia('2026-09-28', [registrada('Desayuno', 'a'), comida('Cena')])] }, [entrada('a')])[0]!;
  assert.deepEqual(resumenDeUnDia(conHueco, true), { principal: '1 de 2 comidas con registro', notas: [{ rasgo: null, texto: '1 sin registro' }] });
});

test('arrancan abiertos los días con una comida diferente o con algo distinto de lo indicado; los demás, en un renglón', () => {
  assert.deepEqual(DIAS.map((d) => [d.fecha.slice(8), diaAbiertoAlEntrar(d)]), [['25', true], ['24', true], ['23', false], ['22', false], ['21', true]]);
  // Sin la línea de tiempo, las restas que llegan con el contraste alcanzan para abrir el 24.
  assert.equal(diaAbiertoAlEntrar(elDia('2026-09-24', componerLosRegistros(CONTRASTE, null))), true);
  // Las cantidades sin confirmar no abren el día: se dicen en su renglón («1 sin confirmar») y se abren a pedido.
  const [soloSinConfirmar] = componerLosRegistros({ days: [dia('2026-09-28', [registrada('Desayuno', 'a'), registrada('Cena', 'b')])] }, [entrada('a'), entrada('b', { quality: ['QUANTITIES_UNCONFIRMED'] })]);
  assert.equal(diaAbiertoAlEntrar(soloSinConfirmar!), false);
  assert.deepEqual(resumenDeUnDia(soloSinConfirmar!, true).notas, [{ rasgo: 'SIN_CONFIRMAR', texto: '1 sin confirmar' }]);
});

test('una resta que da cero no es una diferencia: no se muestra ni abre el día', () => {
  // Así llega una comida con las porciones del plan confirmadas: una resta por ítem, todas en cero.
  const IGUAL = { ...POLLO, registered: POLLO.prescribed, difference: 0 };
  const contraste: ContrasteDescriptivo = { days: [dia('2026-09-30', [registrada('Almuerzo', 'q', { quantityDifferences: [IGUAL, { ...ACEITE, registered: ACEITE.prescribed, difference: 0 }] }), registrada('Cena', 'w', { quantityDifferences: [IGUAL, ACEITE] })])] };
  const [soloCeros] = componerLosRegistros({ days: [dia('2026-09-30', [contraste.days[0]!.meals[0]!])] }, [entrada('q')]);
  assert.deepEqual(soloCeros!.filas[0]!.diferencias, []);
  assert.equal(diaAbiertoAlEntrar(soloCeros!), false, 'las porciones del plan no abren el día');
  assert.deepEqual(resumenDeUnDia(soloCeros!, true).notas, [{ rasgo: null, texto: 'con las porciones del plan' }]);
  // Con una resta distinta de cero en la otra comida, queda esa sola, y el día arranca abierto.
  const [conUna] = componerLosRegistros(contraste, null);
  assert.deepEqual(conUna!.filas.map((f) => f.diferencias.map(diferenciaEnUnRenglon)), [[], ['Aceite −5 ml']]);
  assert.equal(diaAbiertoAlEntrar(conUna!), true);
});

test('lo que la línea de tiempo dice de un registro, como va en su renglón', () => {
  const informada = ENTRADAS.find((e) => e.source.id === 'r-24-alm')!;
  const sinConfirmar = ENTRADAS.find((e) => e.source.id === 'r-21-des')!;
  const pizza = ENTRADAS.find((e) => e.source.id === 'r-25-pizza')!;
  assert.equal(opcionDeUnaComida(entrada('x')), 'Tarta de atún');
  assert.equal(opcionDeUnaComida(sinConfirmar), 'Opción 2', 'una opción sin nombre se dice con su número');
  assert.equal(opcionDeUnaComida(pizza), null, 'una comida diferente no tiene opción');
  assert.deepEqual([entrada('x'), informada, sinConfirmar, pizza].map(modoDeUnaComida), ['PORCIONES_DEL_PLAN', 'INFORMADAS', 'SIN_CONFIRMAR', 'COMIDA_DIFERENTE']);
  assert.deepEqual(MODO_EN_UN_RENGLON.PORCIONES_DEL_PLAN, { icono: 'plan', texto: 'Porciones del plan' });
  assert.deepEqual(MODO_EN_UN_RENGLON.INFORMADAS, { icono: 'a-mano', texto: 'Cantidades informadas' });
  assert.equal(MODO_EN_UN_RENGLON.COMIDA_DIFERENTE, undefined, 'una comida diferente no tiene modo de cantidades');
  // Las palabras son las del dominio: con las porciones del plan no se dice «igual», porque BE no comparó nada.
  assert.equal(frenteALoIndicadoDeUnaComida(entrada('x')), 'Sin diferencia: son las porciones del plan');
  assert.equal(frenteALoIndicadoDeUnaComida(informada), 'Distinta de lo indicado en 2 de 4 ingredientes');
  assert.equal(frenteALoIndicadoDeUnaComida(sinConfirmar), 'No se puede comprobar: sin confirmar');
  assert.equal(frenteALoIndicadoDeUnaComida(pizza), 'No se compara: fuera de lo indicado');
  assert.equal(frenteALoIndicadoDeUnaComida(entrada('x', { quality: [] })), 'Sin dato');
  // Cantidades informadas sin lo que comprobó la API: el resultado no se supone.
  assert.equal(frenteALoIndicadoDeUnaComida(entrada('x', { quality: ['QUANTITIES_REPORTED'] })), 'Sin dato');
});

test('una resta de cantidad se escribe con su signo y su unidad, como llega', () => {
  assert.equal(diferenciaEnUnRenglon(POLLO), 'Pollo +30 g');
  assert.equal(diferenciaEnUnRenglon(ACEITE), 'Aceite −5 ml');
  assert.equal(diferenciaEnUnRenglon({ ...POLLO, difference: 0, registered: POLLO.prescribed }), 'Pollo 0 g');
});

test('los rasgos de una fila salen de su registro: sin confirmar, distinta, rectificada, cargada otro día', () => {
  const fila = (extra: Partial<EntradaDeLineaDeTiempo>) => componerLosRegistros({ days: [dia('2026-09-29', [registrada('Cena', 'z')])] }, [entrada('z', extra)])[0]!.filas[0]!;
  assert.deepEqual(rasgosDeLaFila(fila({})), []);
  assert.deepEqual(rasgosDeLaFila(fila({ quality: ['QUANTITIES_UNCONFIRMED'] })), ['SIN_CONFIRMAR']);
  assert.deepEqual(rasgosDeLaFila(fila({ quality: ['QUANTITIES_REPORTED', 'QUANTITIES_DIFFER_FROM_PLAN'], state: 'RECTIFIED', recordedLate: true })), ['DISTINTO_DE_LO_INDICADO', 'RECTIFICADO', 'CARGADO_OTRO_DIA']);
  // Una fila sin registro no tiene rasgos.
  assert.deepEqual(rasgosDeLaFila(elDia('2026-09-22').filas[0]!), []);
  // Con dos registros en la misma comida, los rasgos van en el orden de siempre, no en el que aparecen: primero la
  // comida diferente (que es el segundo registro) y después el estado de la opción.
  const conDos = componerLosRegistros(
    { days: [dia('2026-09-29', [registrada('Cena', 'z', { differentMealExecutionIds: ['postre'] })], { outsidePrescription: [{ executionId: 'postre', description: 'Helado' }] })] },
    [entrada('z', { state: 'RECTIFIED' }), entrada('postre', { quality: ['DIFFERENT_MEAL'] })],
  )[0]!.filas[0]!;
  assert.deepEqual(rasgosDeLaFila(conDos), ['COMIDA_DIFERENTE', 'RECTIFICADO']);
  // Que es una comida diferente lo dice el contraste: se sabe aunque la línea de tiempo no haya llegado.
  assert.deepEqual(rasgosDeLaFila(elDia('2026-09-25', componerLosRegistros(CONTRASTE, null)).filas[3]!), ['COMIDA_DIFERENTE']);
});

test('con una sola comida en el plan, el día se dice en singular', () => {
  const unaSola = (meals: Comida[], entradas: EntradaDeLineaDeTiempo[]) => resumenDeUnDia(componerLosRegistros({ days: [dia('2026-09-29', meals)] }, entradas)[0]!, true);
  assert.deepEqual(unaSola([registrada('Almuerzo', 'u')], [entrada('u')]), { principal: '1 de 1 comida con registro', notas: [{ rasgo: null, texto: 'con las porciones del plan' }] });
  assert.deepEqual(unaSola([comida('Almuerzo')], []), { principal: 'Sin registro', notas: [{ rasgo: null, texto: '1 comida en el plan' }] });
});
