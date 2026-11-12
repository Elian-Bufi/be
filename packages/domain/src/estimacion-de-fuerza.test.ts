/**
 * ED-71 · El método Epley v1 (DL-171; WP-EDITORES-PROFESIONAL §5.8): los oráculos RM-01 a RM-35 y RM-43
 * (`docs/paquetes/WP-EDITORES-PROFESIONAL-ORACULOS.md`). Cada negativa se probó en rojo con una mutación del método.
 *
 * Las series son sintéticas: el press de banca plano con barra del catálogo base, del 11/11, escrito por la persona con
 * la app nueva (la procedencia por campo de ED-70) o observado por el profesional.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COPY_FUERZA,
  EJERCICIOS_DE_LA_ESTIMACION_V1,
  ESPECIFICACION_DE_LA_ESTIMACION,
  diaDeLaEstimacion,
  diferenciaEntreEstimaciones,
  entraEnLaEstimacion,
  epley,
  estimacionALaVista,
  estimacionConLaDecima,
  estimarLaSerie,
  laCuentaDeLaEstimacion,
  motivoEnPalabras,
  origenDeLaEstimacion,
  rotuloDeLaEstimacion,
  seriesElegidasDeLaSesion,
  terminosProhibidosDeFuerzaEn,
  type EstimacionDeFuerza,
  type ResultadoDeLaSerie,
  type SerieParaEstimar,
} from './estimacion-de-fuerza';
import { numero, numeroConPrecision } from './formato-numeros';

const BANCA = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';
/** Un ejercicio que no está en la lista de la v1 (sintético): el press en máquina, una dominada. */
const PRESS_EN_MAQUINA = '00000000-0000-5000-8000-0000000000aa';
const DOMINADA = '00000000-0000-5000-8000-0000000000bb';

/** Una serie que escribió la persona con la app nueva: los tres valores, de procedencia PERSON (los que tienen valor). */
function escrita(carga: number | null, repeticiones: number | null, rir: number | null, extra: Partial<SerieParaEstimar> = {}): SerieParaEstimar {
  const origenes = Object.fromEntries(
    ([['load', carga], ['completedRepetitions', repeticiones], ['rir', rir]] as const).filter(([, v]) => v !== null).map(([c]) => [c, 'PERSON']),
  );
  return {
    exerciseId: BANCA,
    fuente: 'PERSONA',
    recordedAs: 'TYPED',
    fieldOrigins: origenes,
    load: carga === null ? null : { value: carga, unit: 'kg' },
    completedRepetitions: repeticiones,
    rir,
    fechaCivil: '2026-11-11',
    ...extra,
  };
}

function valor(s: SerieParaEstimar): EstimacionDeFuerza {
  const r = estimarLaSerie(s);
  assert.ok(r.entra, `esperaba un valor y quedó fuera: ${r.entra ? '' : r.motivo}`);
  return r.estimacion;
}
function fuera(s: SerieParaEstimar): Extract<ResultadoDeLaSerie, { entra: false }> {
  const r = estimarLaSerie(s);
  assert.equal(r.entra, false, 'esperaba que quedara fuera');
  return r as Extract<ResultadoDeLaSerie, { entra: false }>;
}
const casi = (a: number, b: number, mensaje?: string) => assert.ok(Math.abs(a - b) < 1e-9, mensaje ?? `${a} ≠ ${b}`);

/** Todos los textos del método, con los que se arman (para las guardias). */
function textosDelMetodo(): string[] {
  const e = valor(escrita(80, 8, 2));
  const planos: string[] = [];
  const recorrer = (x: unknown) => {
    if (typeof x === 'string') planos.push(x);
    else if (typeof x === 'function') planos.push(String(x('106,7 kg')));
    else if (x && typeof x === 'object') Object.values(x).forEach(recorrer);
  };
  recorrer(COPY_FUERZA);
  return [
    ...planos,
    rotuloDeLaEstimacion('NUCLEO'),
    rotuloDeLaEstimacion('ORIENTATIVA'),
    laCuentaDeLaEstimacion(e),
    estimacionALaVista(e),
    origenDeLaEstimacion('PERSONA', 'Diego'),
    origenDeLaEstimacion('OBSERVADA', 'Martín'),
    diferenciaEntreEstimaciones(valor(escrita(90, 1, 0)), valor(escrita(70, 12, 0)))!,
  ];
}

test('RM-01 · lo indicado no es fuerza: una serie que viene de la prescripción no da ningún valor', () => {
  const r = fuera({ ...escrita(70, 12, 0), fuente: 'PLAN' });
  assert.equal(r.motivo, 'LO_INDICADO');
  assert.equal(motivoEnPalabras(r), 'es lo que indica el plan, no lo que se hizo');
});

test('RM-02 · 70 × 12 con RIR 0, escrita por la persona: 98,0 kg (n_eq 12), orientativa, con la fecha civil de la sesión', () => {
  const e = valor(escrita(70, 12, 0));
  casi(e.valor, 98);
  assert.equal(e.repeticionesEquivalentes, 12);
  assert.equal(e.banda, 'ORIENTATIVA');
  assert.equal(e.fechaCivil, '2026-11-11');
  assert.equal(estimacionALaVista(e), '≈ 98 kg');
  assert.equal(rotuloDeLaEstimacion(e.banda), 'estimación orientativa · Epley v1');
});

test('RM-03 · 80 × 6 con RIR 2: 101,33 (n_eq 8), núcleo; a la vista «≈ 101,5 kg» y la décima solo en la cuenta', () => {
  const e = valor(escrita(80, 6, 2));
  casi(e.valor, 80 * (1 + 8 / 30));
  assert.equal(e.banda, 'NUCLEO');
  assert.equal(estimacionALaVista(e), '≈ 101,5 kg');
  assert.equal(estimacionConLaDecima(e), '101,3 kg');
  assert.equal(laCuentaDeLaEstimacion(e), '6 + 2 = 8 repeticiones equivalentes · 80 × (1 + 8/30) = 101,3 kg');
});

test('RM-04 · 70 × 12 con RIR 2: fuera (n_eq 14), con su motivo; y n/30 es exacto (102,7, nunca el 102,6 de 0,0333)', () => {
  const r = fuera(escrita(70, 12, 2));
  assert.equal(r.motivo, 'MAS_DE_12');
  assert.equal(motivoEnPalabras(r), 'tiene más de 12 repeticiones equivalentes');
  assert.ok(!('estimacion' in r), 'fuera no lleva ningún valor');
  // La forma de la cuenta, aunque esta serie quede fuera: con n/30 exacto da 102,7; con la constante 0,0333, 102,6.
  assert.equal(numeroConPrecision(epley(70, 14), 1), '102,7');
});

test('RM-05 · 90 × 5 con RIR 0: 105,0 kg, núcleo', () => {
  const e = valor(escrita(90, 5, 0));
  casi(e.valor, 105);
  assert.equal(e.banda, 'NUCLEO');
});

test('RM-06 · 100 × 1 con RIR 0: la carga (100,0 kg), nunca 103,3, y nunca «1RM real»', () => {
  const e = valor(escrita(100, 1, 0));
  assert.equal(e.repeticionesEquivalentes, 1);
  assert.equal(e.valor, 100);
  assert.equal(estimacionConLaDecima(e), '100,0 kg');
  assert.equal(laCuentaDeLaEstimacion(e), '1 + 0 = 1 repetición equivalente · con una sola, la estimación es la carga: 100,0 kg');
  for (const t of textosDelMetodo()) assert.doesNotMatch(t.toLowerCase(), /1rm real/);
});

test('RM-07 · 100 × 1 con RIR 2: 110,0 kg (n_eq 3), núcleo: «estimación», nunca «orientativa»', () => {
  const e = valor(escrita(100, 1, 2));
  casi(e.valor, 110);
  assert.equal(e.banda, 'NUCLEO');
  assert.equal(rotuloDeLaEstimacion(e.banda), 'estimación · Epley v1');
  assert.doesNotMatch(rotuloDeLaEstimacion(e.banda), /orientativa/);
});

test('RM-08 · sin RIR: fuera («no tiene RIR»); nunca se supone 0', () => {
  const r = fuera(escrita(80, 5, null));
  assert.equal(r.motivo, 'SIN_RIR');
  assert.equal(motivoEnPalabras(r), 'no tiene RIR');
  assert.equal(COPY_FUERZA.sinRir, 'Sin RIR no se puede estimar');
});

test('DL-171 · R3 · un RIR mayor que 2 queda fuera, con su motivo; la regla se explica al profesional', () => {
  const r = fuera(escrita(80, 5, 3));
  assert.equal(r.motivo, 'RIR_MAYOR_QUE_2');
  assert.equal(motivoEnPalabras(r), 'el RIR es mayor que 2');
  assert.equal(COPY_FUERZA.rirMayorQue2, 'Con un RIR mayor que 2 no se estima');
  assert.equal(COPY_FUERZA.reglaDelRir, 'BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR que se escribe es menos confiable.');
  assert.equal(COPY_FUERZA.campoDelRir, 'De 0 a 2');
  // RIR 2 con decimales entra; 2,5 no.
  assert.ok(estimarLaSerie(escrita(80, 5, 2)).entra);
  assert.equal(fuera(escrita(80, 5, 2.5)).motivo, 'RIR_MAYOR_QUE_2');
});

test('DL-171 · 10 con RIR 0,5 son 10,5 repeticiones equivalentes: orientativa, y el texto de la banda lo dice («de más de 10 a 12»)', () => {
  const e = valor(escrita(80, 10, 0.5));
  assert.equal(e.repeticionesEquivalentes, 10.5);
  assert.equal(e.banda, 'ORIENTATIVA');
  // El interruptor apagado (ED-74) la deja afuera; encendido, entra.
  assert.deepEqual(seriesElegidasDeLaSesion([escrita(80, 10, 0.5)], { incluirOrientativas: false }), []);
  assert.equal(seriesElegidasDeLaSesion([escrita(80, 10, 0.5)], { incluirOrientativas: true }).length, 1);
  // El texto de la banda la incluye: «de 11 a 12» dejaba afuera, en palabras, a una serie que está adentro.
  assert.equal(COPY_FUERZA.banda.ORIENTATIVA, 'de más de 10 a 12 repeticiones equivalentes: estimación orientativa');
  assert.doesNotMatch(COPY_FUERZA.banda.ORIENTATIVA, /de 11 a 12/);
  // Y 10 con RIR 0 sigue en el núcleo («hasta 10»).
  assert.equal(valor(escrita(80, 10, 0)).banda, 'NUCLEO');
});

test('RM-09 · 15 repeticiones: fuera (más de 12 equivalentes)', () => {
  assert.equal(fuera(escrita(50, 15, 0)).motivo, 'MAS_DE_12');
  assert.equal(COPY_FUERZA.masDe12, 'Con más de 12 repeticiones equivalentes no se estima');
});

test('RM-10 · el press de banca con barra y el press en máquina nunca van en la misma línea: la identidad es el exerciseId', () => {
  const sesion = [escrita(80, 5, 1, { exerciseId: PRESS_EN_MAQUINA }), escrita(70, 5, 1), escrita(100, 5, 1, { exerciseId: SENTADILLA })];
  const elegidas = seriesElegidasDeLaSesion(sesion, { incluirOrientativas: false });
  assert.deepEqual(
    elegidas.map((x) => [x.exerciseId, x.posicion]),
    [
      [BANCA, 1],
      [SENTADILLA, 2],
    ],
  );
});

test('RM-11 · una corrección: la de la persona se recalcula; la del profesional deja ese valor sin procedencia y la serie fuera', () => {
  const original = valor(escrita(80, 5, 1));
  const corregidaPorLaPersona = valor(escrita(85, 5, 1));
  assert.ok(corregidaPorLaPersona.valor !== original.valor, 'con la corrección de la persona, un valor nuevo');
  // El profesional corrigió la carga: esa clave sale de la procedencia (ED-70).
  const r = fuera(escrita(85, 5, 1, { fieldOrigins: { completedRepetitions: 'PERSON', rir: 'PERSON' } }));
  assert.equal(r.motivo, 'SIN_PROCEDENCIA');
  assert.deepEqual(r.campos, ['load']);
  assert.equal(motivoEnPalabras(r), 'no se sabe quién escribió la carga');
  // El original se sigue reproduciendo igual.
  assert.deepEqual(valor(escrita(80, 5, 1)), original);
});

test('RM-12 · con un solo punto, ninguna diferencia; con dos, en kg, nunca un %', () => {
  const noventa = valor(escrita(90, 1, 0));
  const noventaYOcho = valor(escrita(70, 12, 0));
  assert.equal(diferenciaEntreEstimaciones(null, noventaYOcho), null);
  const d = diferenciaEntreEstimaciones(noventa, noventaYOcho);
  assert.equal(d, 'estimación: 90 → 98 kg');
  assert.doesNotMatch(d!, /%/);
  // Entre kg y lb, o entre dos ejercicios, no hay diferencia que decir.
  assert.equal(diferenciaEntreEstimaciones(noventa, valor(escrita(200, 5, 0, { load: { value: 200, unit: 'lb' } }))), null);
});

test('RM-13 · ningún texto del método dice «1RM real», «máximo real», «récord» ni «marca personal»', () => {
  for (const t of textosDelMetodo()) assert.doesNotMatch(t.toLowerCase(), /1rm real|máximo real|récord|marca personal/, t);
});

test('RM-14 · cada valor dice la especificación, la versión y el método', () => {
  const e = valor(escrita(80, 8, 2));
  assert.deepEqual([e.especificacion, e.version, e.metodo], ['BE-E1RM', 1, 'EPLEY_V1']);
  assert.deepEqual(ESPECIFICACION_DE_LA_ESTIMACION, { especificacion: 'BE-E1RM', version: 1, metodo: 'EPLEY_V1' });
  assert.match(rotuloDeLaEstimacion(e.banda), /Epley v1$/);
});

test('RM-15 · la fecha del valor es la civil de la ejecución, nunca la de UTC ni la de una zona fija', () => {
  // La sesión fue el 11/11 a las 23:30 en la zona de la persona (en UTC ya es el 12): llega su fecha civil.
  const e = valor(escrita(80, 8, 2, { fechaCivil: '2026-11-11' }));
  assert.equal(e.fechaCivil, '2026-11-11');
  assert.equal(diaDeLaEstimacion(e.fechaCivil), '11 nov');
  assert.equal(diaDeLaEstimacion('2026-01-02'), '2 ene');
});

test('RM-16 · un ejercicio fuera de la lista no da valor', () => {
  assert.equal(entraEnLaEstimacion(PRESS_EN_MAQUINA), false);
  assert.equal(fuera(escrita(80, 5, 1, { exerciseId: PRESS_EN_MAQUINA })).motivo, 'FUERA_DE_LA_LISTA');
  // La lista de la v1: los seis con barra del catálogo base (ED-D18).
  assert.deepEqual(
    EJERCICIOS_DE_LA_ESTIMACION_V1.map((x) => x.nombre),
    ['Sentadilla trasera con barra', 'Sentadilla frontal con barra', 'Press de banca plano con barra', 'Peso muerto convencional', 'Press de hombros con barra', 'Remo inclinado con barra, agarre prono'],
  );
});

test('RM-17 · una dominada sin carga no da valor (la v1 no modela el peso corporal)', () => {
  assert.equal(fuera(escrita(null, 8, 1, { exerciseId: DOMINADA })).motivo, 'FUERA_DE_LA_LISTA');
  // Y aunque fuera un ejercicio de la lista, sin carga no hay valor.
  assert.equal(fuera(escrita(null, 8, 1)).motivo, 'SIN_CARGA');
});

test('RM-18 · la misma serie se reproduce igual con la v1: nunca dos valores del mismo método para la misma serie', () => {
  const s = escrita(82.5, 5, 1);
  const guardada = JSON.parse(JSON.stringify(valor(s))) as EstimacionDeFuerza;
  assert.deepEqual(valor(s), guardada);
  // Desde sus entradas, la cuenta da el mismo valor (lo que «Cómo se calculó» reproduce después).
  casi(epley(guardada.carga, guardada.repeticionesEquivalentes), guardada.valor);
});

test('RM-19 · la persona corrige el RIR de 2 a 1: un valor nuevo, sin leer el plan', () => {
  const antes = valor(escrita(80, 8, 2));
  const despues = valor(escrita(80, 8, 1));
  casi(antes.valor, 80 * (1 + 10 / 30));
  casi(despues.valor, 80 * (1 + 9 / 30));
});

test('RM-20 · el profesional cambia el RIR objetivo del borrador: ninguna estimación cambia (el método no lee la prescripción)', () => {
  const s = escrita(80, 8, 2);
  const conObjetivo = (rirObjetivo: number) => ({ ...s, rirObjetivo, prescripcion: { sets: [{ rir: rirObjetivo }] } }) as unknown as SerieParaEstimar;
  assert.deepEqual(estimarLaSerie(conObjetivo(0)), estimarLaSerie(s));
  assert.deepEqual(estimarLaSerie(conObjetivo(4)), estimarLaSerie(s));
});

test('RM-21 · cada valor dice de dónde sale y su fecha; nunca «validado»', () => {
  assert.equal(origenDeLaEstimacion('PERSONA', 'Diego'), 'la escribió Diego en la app');
  assert.equal(origenDeLaEstimacion('OBSERVADA', 'Martín'), 'la observó Martín');
  assert.equal(valor(escrita(80, 8, 2)).fuente, 'PERSONA');
  assert.equal(valor({ ...escrita(85, 5, 1), fuente: 'OBSERVADA', fieldOrigins: undefined }).fuente, 'OBSERVADA');
  for (const t of textosDelMetodo()) assert.doesNotMatch(t.toLowerCase(), /validad/, t);
});

test('RM-22 · sin intervalo ni «±»; al medio kilo o a la libra entera, con «≈»; la décima, solo en «Cómo se calculó»', () => {
  const enLibras = (carga: number, repeticiones: number, rir: number) => valor(escrita(carga, repeticiones, rir, { load: { value: carga, unit: 'lb' } }));
  // 65 × 8 con RIR 2 = 86,67; 80 × 8 con RIR 2 = 106,67; 89 × 6 con RIR 0 = 106,8.
  assert.equal(estimacionALaVista(valor(escrita(65, 8, 2))), '≈ 86,5 kg');
  assert.equal(estimacionALaVista(valor(escrita(80, 8, 2))), '≈ 106,5 kg');
  assert.equal(estimacionALaVista(valor(escrita(89, 6, 0))), '≈ 107 kg');
  // 162,5 lb × 10 con RIR 0 = 216,67: a la libra entera.
  assert.equal(estimacionALaVista(enLibras(162.5, 10, 0)), '≈ 217 lb');
  for (const t of textosDelMetodo()) assert.doesNotMatch(t, /±|intervalo/, t);
  assert.doesNotMatch(estimacionALaVista(valor(escrita(80, 6, 2))), /101,3/);
});

test('ED-71 · un empate se redondea como la cuenta a mano: 41,25 × 12 con RIR 0 es 57,75 justo, «≈ 58 kg» y 57,8 kg', () => {
  // Con `carga × (1 + n/30)` daba 57,749999…, y se mostraba «≈ 57,5 kg» y 57,7 kg (la forma vieja, en rojo).
  const e = valor(escrita(41.25, 12, 0));
  assert.equal(e.valor, 57.75);
  assert.equal(estimacionALaVista(e), '≈ 58 kg');
  assert.equal(estimacionConLaDecima(e), '57,8 kg');
  assert.equal(laCuentaDeLaEstimacion(e), '12 + 0 = 12 repeticiones equivalentes · 41,25 × (1 + 12/30) = 57,8 kg');
  // Los otros empates que destapó la revisión: 25 × 4 con RIR 0,5 (28,75), 43,75 × 12 con RIR 0 (61,25) y 90 lb × 8 con
  // RIR 0,5 (115,5 lb).
  assert.equal(estimacionALaVista(valor(escrita(25, 4, 0.5))), '≈ 29 kg');
  assert.equal(estimacionALaVista(valor(escrita(43.75, 12, 0))), '≈ 61,5 kg');
  assert.equal(estimacionALaVista(valor(escrita(90, 8, 0.5, { load: { value: 90, unit: 'lb' } }))), '≈ 116 lb');
  // Una décima que empata y no tiene número binario exacto: 21 × 4 con RIR 0,5 son 24,15 (el binario más cercano queda
  // por debajo, y con él se mostraba 24,1); 20,25 × 4 con RIR 0 son 22,95.
  assert.equal(estimacionConLaDecima(valor(escrita(21, 4, 0.5))), '24,2 kg');
  assert.equal(estimacionConLaDecima(valor(escrita(20.25, 4, 0))), '23,0 kg');
});

test('ED-71 · la vista y la décima son las de la cuenta exacta para toda carga de 0,25 en 0,25 kg y todo RIR de 0,5 en 0,5', () => {
  // La cuenta exacta con enteros, independiente del método: la carga en cuartos (c4) y n_eq en medios (n2). El valor es
  // c4 × (60 + n2) / 240 (con n_eq 1, la carga: c4 × 60 / 240). Se redondea mitad hacia arriba.
  const aMano = (c4: number, n2: number, pasosPorUnidad: number) => {
    const numerador = c4 * (n2 === 2 ? 60 : 60 + n2);
    return Math.floor((2 * numerador * pasosPorUnidad + 240) / 480) / pasosPorUnidad;
  };
  const distintas: string[] = [];
  for (let c4 = 1; c4 <= 4 * 200; c4++) {
    for (let repeticiones = 1; repeticiones <= 12; repeticiones++) {
      for (let r2 = 0; r2 <= 4; r2++) {
        const n2 = 2 * repeticiones + r2;
        if (n2 > 24) continue;
        const kg = valor(escrita(c4 / 4, repeticiones, r2 / 2));
        const lb = valor(escrita(c4 / 4, repeticiones, r2 / 2, { load: { value: c4 / 4, unit: 'lb' } }));
        const esperado = [`≈ ${numero(aMano(c4, n2, 2), 1)} kg`, `${numeroConPrecision(aMano(c4, n2, 10), 1)} kg`, `≈ ${numero(aMano(c4, n2, 1), 1)} lb`];
        const obtenido = [estimacionALaVista(kg), estimacionConLaDecima(kg), estimacionALaVista(lb)];
        if (obtenido.join('|') !== esperado.join('|') && distintas.length < 5) distintas.push(`${c4 / 4} × ${repeticiones} RIR ${r2 / 2}: ${obtenido.join(' ')} ≠ ${esperado.join(' ')}`);
      }
    }
  }
  assert.deepEqual(distintas, []);
});

test('RM-23 · una serie de carga rápida (AS_PLANNED) no da valor', () => {
  const r = fuera(escrita(80, 8, 2, { recordedAs: 'AS_PLANNED', fieldOrigins: undefined }));
  assert.equal(r.motivo, 'CARGA_RAPIDA');
  assert.equal(motivoEnPalabras(r), 'se tildó sin escribir: los valores son los del plan');
});

test('RM-24 · la persona escribe solo las repeticiones; la carga y el RIR son los del plan: fuera', () => {
  const r = fuera(escrita(60, 10, 2, { fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } }));
  assert.equal(r.motivo, 'VALOR_DEL_PLAN');
  assert.deepEqual(r.campos, ['load', 'rir']);
  assert.equal(motivoEnPalabras(r), 'la carga y el RIR son los del plan');
  assert.equal(motivoEnPalabras(fuera(escrita(60, 10, 2, { fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PLAN' } }))), 'el RIR es el del plan');
});

test('RM-25 · un ejercicio sustituido en la sesión queda fuera', () => {
  assert.equal(fuera(escrita(80, 8, 2, { sustituido: true })).motivo, 'SUSTITUIDO');
});

test('RM-26 · 0 kg no da valor', () => {
  assert.equal(fuera(escrita(0, 8, 2)).motivo, 'SIN_CARGA');
});

test('RM-27 · 70 × 10 con RIR 2 y 70 × 12 con RIR 0: n_eq 12 las dos, 98,0 kg, orientativas', () => {
  for (const e of [valor(escrita(70, 10, 2)), valor(escrita(70, 12, 0))]) {
    assert.equal(e.repeticionesEquivalentes, 12);
    casi(e.valor, 98);
    assert.equal(e.banda, 'ORIENTATIVA');
  }
});

test('RM-28 · 80 × 6 con RIR 1,5: 100,0 kg (n_eq 7,5), núcleo', () => {
  const e = valor(escrita(80, 6, 1.5));
  assert.equal(e.repeticionesEquivalentes, 7.5);
  casi(e.valor, 100);
  assert.equal(e.banda, 'NUCLEO');
  assert.equal(laCuentaDeLaEstimacion(e), '6 + 1,5 = 7,5 repeticiones equivalentes · 80 × (1 + 7,5/30) = 100,0 kg');
});

test('RM-29 · series en kg y en lb del mismo ejercicio: dos líneas aparte, sin convertir', () => {
  const sesion = [escrita(100, 5, 1), escrita(225, 5, 1, { load: { value: 225, unit: 'lb' } })];
  const elegidas = seriesElegidasDeLaSesion(sesion, { incluirOrientativas: true });
  assert.deepEqual(
    elegidas.map((x) => [x.unidad, x.estimacion.carga]),
    [
      ['kg', 100],
      ['lb', 225],
    ],
  );
  casi(elegidas[1]!.estimacion.valor, 225 * (1 + 6 / 30));
  assert.equal(estimacionALaVista(elegidas[1]!.estimacion), '≈ 270 lb');
});

test('RM-30 · la carga por implemento o las repeticiones por lado quedan fuera en la v1', () => {
  assert.equal(fuera(escrita(40, 8, 1, { loadBasis: 'PER_IMPLEMENT' })).motivo, 'CARGA_NO_TOTAL');
  assert.equal(fuera(escrita(40, 8, 1, { loadBasis: 'SINGLE_IMPLEMENT' })).motivo, 'CARGA_NO_TOTAL');
  assert.equal(fuera(escrita(40, 8, 1, { repetitionBasis: 'PER_SIDE' })).motivo, 'REPETICIONES_POR_LADO');
  assert.ok(estimarLaSerie(escrita(80, 8, 1, { loadBasis: 'TOTAL_EXTERNAL', repetitionBasis: 'PER_SET' })).entra);
});

test('RM-31 · ninguna estimación produce un aviso, una novedad ni «Te toca a vos»', () => {
  const fuente = readFileSync(join(__dirname, '..', 'src', 'estimacion-de-fuerza.ts'), 'utf8');
  // El método no importa nada de avisos ni de novedades: solo la guardia de Entrenamiento y el formato de los números.
  assert.deepEqual(
    [...fuente.matchAll(/from '(\.\/[^']+)'/g)].map((m) => m[1]),
    ['./copy-entrenamiento', './formato-numeros'],
  );
  for (const t of textosDelMetodo()) assert.doesNotMatch(t.toLowerCase(), /te toca a vos|novedad|felicit|¡/, t);
});

test('RM-32 · los textos pasan las guardias de Entrenamiento y de fuerza; la guardia marca lo prohibido (mutación)', () => {
  for (const t of textosDelMetodo()) assert.deepEqual(terminosProhibidosDeFuerzaEn(t), [], t);
  // La guardia ve lo que tiene que ver, también en negación.
  assert.deepEqual(terminosProhibidosDeFuerzaEn('No es tu marca personal'), ['marca personal']);
  assert.deepEqual(terminosProhibidosDeFuerzaEn('Nuevo máximo: 1RM real'), ['1rm real', 'nuevo máximo']);
  assert.deepEqual(terminosProhibidosDeFuerzaEn('≈ 98 kg ± 3'), ['±']);
  assert.deepEqual(terminosProhibidosDeFuerzaEn('subió un 5 %'), ['%']);
  assert.deepEqual(terminosProhibidosDeFuerzaEn('la carga la elegís vos con un % RM'), []);
});

test('RM-33 · una serie registrada antes de la procedencia queda fuera, con su motivo', () => {
  const r = fuera(escrita(80, 8, 2, { fieldOrigins: undefined }));
  assert.equal(r.motivo, 'SIN_PROCEDENCIA');
  assert.equal(motivoEnPalabras(r), 'se registró antes de que la app guardara quién escribió cada dato');
});

test('RM-34 · 80 × 10 con RIR 1 (109,3) y 95 × 3 con RIR 1 (107,7): se toma 95 × 3, nunca la mayor estimación', () => {
  const sesion = [escrita(80, 10, 1), escrita(95, 3, 1)];
  for (const incluirOrientativas of [false, true]) {
    const [elegida] = seriesElegidasDeLaSesion(sesion, { incluirOrientativas });
    assert.equal(elegida!.posicion, 1);
    assert.equal(estimacionConLaDecima(elegida!.estimacion), '107,7 kg');
  }
  assert.equal(estimacionConLaDecima(valor(sesion[0]!)), '109,3 kg');
});

test('RM-35 · dos series que entran con la misma carga: la primera de la sesión', () => {
  const [elegida] = seriesElegidasDeLaSesion([escrita(80, 5, 2), escrita(80, 6, 1), escrita(75, 5, 0)], { incluirOrientativas: false });
  assert.equal(elegida!.posicion, 0);
});

test('RM-43 · 70 × 12 RIR 0 y 65 × 8 RIR 2: apagado, 65 × 8 («≈ 86,5 kg»); encendido, 70 × 12 (98,0)', () => {
  const sesion = [escrita(70, 12, 0), escrita(65, 8, 2)];
  const [apagado] = seriesElegidasDeLaSesion(sesion, { incluirOrientativas: false });
  assert.equal(apagado!.posicion, 1);
  casi(apagado!.estimacion.valor, 65 * (1 + 10 / 30));
  assert.equal(estimacionConLaDecima(apagado!.estimacion), '86,7 kg');
  assert.equal(estimacionALaVista(apagado!.estimacion), '≈ 86,5 kg');
  assert.equal(apagado!.estimacion.banda, 'NUCLEO');
  const [encendido] = seriesElegidasDeLaSesion(sesion, { incluirOrientativas: true });
  assert.equal(encendido!.posicion, 0);
  casi(encendido!.estimacion.valor, 98);
  assert.equal(encendido!.estimacion.banda, 'ORIENTATIVA');
  // Una sesión que solo tiene orientativas: apagado queda sin punto; la tarjeta muestra la de mayor carga, orientativa.
  const soloOrientativas = [escrita(60, 12, 0), escrita(70, 12, 0)];
  assert.deepEqual(seriesElegidasDeLaSesion(soloOrientativas, { incluirOrientativas: false }), []);
  const [tarjeta] = seriesElegidasDeLaSesion(soloOrientativas, { incluirOrientativas: false, respaldoOrientativo: true });
  assert.equal(tarjeta!.posicion, 1);
  assert.equal(tarjeta!.estimacion.banda, 'ORIENTATIVA');
});

test('DL-171 · la serie que observa el profesional entra sin procedencia: 85 × 5 con RIR 1 da 102,0 kg (n_eq 6)', () => {
  const e = valor({ exerciseId: BANCA, fuente: 'OBSERVADA', load: { value: 85, unit: 'kg' }, completedRepetitions: 5, rir: 1, fechaCivil: '2026-11-12' });
  casi(e.valor, 102);
  assert.equal(e.repeticionesEquivalentes, 6);
  assert.equal(e.banda, 'NUCLEO');
  assert.equal(COPY_FUERZA.queNoSignifica(estimacionConLaDecima(e)), 'No se levantaron 102,0 kg. No es una marca. No es una indicación de carga: la carga la elegís vos con un % RM.');
});
