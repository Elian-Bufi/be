/**
 * DL-192 · RPE y máximo estimado (WP-RPE-Y-MAXIMO-ESTIMADO §6): TEST-RPE-001 a 012, las pruebas de la conversión entre
 * RIR y RPE, de «6 o menos», de la notación de un plan y del máximo estimado escrito en esa notación. Las series son
 * sintéticas: el press de banca plano con barra del catálogo base, observado por el profesional.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoDeRir, textoDelPlanDeLaSerie } from './copy-entrenamiento-por-serie';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { COPY_FUERZA, epley, estimarLaSerie, motivoEnPalabras, terminosProhibidosDeFuerzaEn, type ResultadoDeLaSerie } from './estimacion-de-fuerza';
import { numero } from './formato-numeros';
import { renglonDelEjercicio, seriesDelEjercicio } from './lectura-del-plan-de-entrenamiento';
import {
  conQueSeEstimo,
  copyDeLaEstimacion,
  COPY_NOTACION_DEL_ESFUERZO,
  esfuerzoEnCampo,
  leerRpeEscrito,
  motivoEnLaNotacion,
  notacionDe,
  notacionDeLasVersiones,
  notacionInicial,
  OPCIONES_DE_RPE,
  RIR_DEL_PISO,
  rirDeUnRpe,
  rpeDeUnRir,
  textoDelEsfuerzo,
} from './notacion-del-esfuerzo';
import { intensidadPlanificada } from './presentacion-de-prescripcion';
import { textoDeLaSerie } from './la-vez-pasada';
import { relacionDeUnaSerie, serieRegistradaEnPalabras } from './registros-de-entrenamiento';

const BANCA = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
/** Los RIR de la escala, de a medio: 0, 0,5 … 4. */
const RIR_DE_LA_ESCALA = Array.from({ length: 9 }, (_, i) => i / 2);

test('TEST-RPE-001 · RPE = 10 − RIR, de 6 a 10 con medios puntos, en las dos direcciones', () => {
  const tabla: readonly [number, number][] = [
    [0, 10],
    [0.5, 9.5],
    [1, 9],
    [1.5, 8.5],
    [2, 8],
    [2.5, 7.5],
    [3, 7],
    [3.5, 6.5],
    [4, 6],
  ];
  for (const [rir, rpe] of tabla) {
    assert.equal(rpeDeUnRir(rir), rpe, `RIR ${rir}`);
    assert.equal(rirDeUnRpe(rpe), rir, `RPE ${rpe}`);
  }
  // Sin ruido del binario: 10 − 0,3 es 9,7.
  assert.equal(rpeDeUnRir(0.3), 9.7);
  assert.equal(textoDelEsfuerzo(0.3, 'RPE'), 'RPE 9,7');
});

test('TEST-RPE-002 · los bordes: el fallo, el piso, lo que no es de la escala', () => {
  // El fallo.
  assert.equal(rpeDeUnRir(0), 10);
  assert.equal(rirDeUnRpe(10), 0);
  // Más de 10 o menos de 1 no son de la escala; tampoco un RPE de 6 a 10 que no cae en un medio punto.
  for (const rpe of [10.5, 11, 0, 0.5, -1, Number.NaN, Number.POSITIVE_INFINITY, 8.3, 9.25]) assert.equal(rirDeUnRpe(rpe), null, `RPE ${rpe}`);
  // Un RIR negativo o que no es un número no tiene RPE.
  for (const rir of [-0.5, Number.NaN, Number.NEGATIVE_INFINITY]) assert.equal(rpeDeUnRir(rir), null, `RIR ${rir}`);
  assert.equal(textoDelEsfuerzo(Number.NaN, 'RPE'), null);
  assert.equal(esfuerzoEnCampo(-1, 'RPE'), '');
  // Sin valor, ningún texto: el que llama dice «Sin indicar».
  assert.equal(textoDelEsfuerzo(null, 'RPE'), null);
  assert.equal(textoDelEsfuerzo(undefined, 'RIR'), null);
});

test('TEST-RPE-003 · «6 o menos»: se elige como RIR 4, y todo RIR de 4 o más se lee así en RPE; en RIR, tal cual', () => {
  assert.equal(RIR_DEL_PISO, 4);
  // De 1 a 6, el piso: BE no distingue por debajo de RPE 6.
  for (const rpe of [6, 5.5, 5, 3, 1, 5.3]) assert.equal(rirDeUnRpe(rpe), 4, `RPE ${rpe}`);
  for (const rir of [4, 4.5, 5, 7, 10, 20]) {
    assert.equal(rpeDeUnRir(rir), 6, `RIR ${rir}`);
    assert.equal(textoDelEsfuerzo(rir, 'RPE'), 'RPE 6 o menos', `RIR ${rir}`);
    // En RIR, el número guardado se lee como es: no se agrupa.
    assert.equal(textoDelEsfuerzo(rir, 'RIR'), `RIR ${numero(rir)}`, `RIR ${rir}`);
  }
  assert.equal(esfuerzoEnCampo(5, 'RPE'), '6 o menos');
  // RIR 3,5 todavía es de la escala.
  assert.equal(textoDelEsfuerzo(3.5, 'RPE'), 'RPE 6,5');
});

test('TEST-RPE-004 · ida y vuelta sin perder nada: opción → RIR → texto → RIR, y RIR → RPE → RIR', () => {
  assert.equal(OPCIONES_DE_RPE.length, 9);
  assert.deepEqual(
    OPCIONES_DE_RPE.map((o) => o.texto),
    ['10', '9,5', '9', '8,5', '8', '7,5', '7', '6,5', '6 o menos'],
  );
  for (const o of OPCIONES_DE_RPE) {
    const enCampo = esfuerzoEnCampo(o.rir, 'RPE');
    assert.equal(enCampo, o.texto, `RIR ${o.rir}`);
    assert.equal(leerRpeEscrito(enCampo), o.rir, `«${enCampo}»`);
  }
  for (const rir of RIR_DE_LA_ESCALA) {
    const rpe = rpeDeUnRir(rir);
    assert.notEqual(rpe, null);
    assert.equal(rirDeUnRpe(rpe!), rir, `RIR ${rir}`);
    // En RIR, el campo vuelve al mismo número.
    assert.equal(Number(esfuerzoEnCampo(rir, 'RIR').replace(',', '.')), rir);
  }
});

test('TEST-RPE-005 · lo que escribe el profesional en un campo de RPE', () => {
  const casos: readonly [string, number | null][] = [
    ['8', 2],
    ['8,5', 1.5],
    ['8.5', 1.5],
    [' 9 ', 1],
    ['RPE 7', 3],
    ['10', 0],
    ['6 o menos', 4],
    ['6 O MENOS', 4],
    ['≤6', 4],
    ['≤ 6', 4],
    ['<= 6', 4],
    ['<6', 4],
    ['6-', 4],
    ['5', 4],
    ['', null],
    ['  ', null],
    ['ocho', null],
    ['11', null],
    ['8,3', null],
    ['-2', null],
    ['8 a 9', null],
  ];
  for (const [texto, rir] of casos) assert.equal(leerRpeEscrito(texto), rir, `«${texto}»`);
});

test('TEST-RPE-006 · los textos de la serie, del plan y de lo registrado, en cada notación; sin notación, RIR como siempre', () => {
  assert.equal(textoDeRir(2), 'RIR 2');
  assert.equal(textoDeRir(2, 'RIR'), 'RIR 2');
  assert.equal(textoDeRir(2, 'RPE'), 'RPE 8');
  assert.equal(textoDeRir(2.5, 'RPE'), 'RPE 7,5');
  assert.equal(textoDeRir(null, 'RPE'), null);
  assert.equal(textoDelPlanDeLaSerie({ repetitions: { value: 5 }, rir: 1, suggestedLoad: { value: 100, unit: 'kg' }, restSeconds: null }, 'RPE'), '100 kg · 5 rep. · RPE 9');
  assert.equal(intensidadPlanificada({ intensity: { criterion: 'RIR', target: { value: 2, reference: null } } }), 'RIR 2');
  assert.equal(intensidadPlanificada({ intensity: { criterion: 'RIR', target: { value: 2, reference: null } } }, 'RPE'), 'RPE 8');
  // El % RM no cambia con la notación: el RPE es solo la otra forma de escribir el RIR.
  assert.equal(intensidadPlanificada({ intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: null } } }, 'RPE'), '75 % RM');

  const serie = (setIndex: number, rir: number) => ({
    setIndex,
    note: null,
    target: { repetitions: { value: 5 }, rir, suggestedLoad: null, restSeconds: null },
    targetOrigin: { rir: 'PRESCRIPTION' as const, suggestedLoad: 'NONE' as const, restSeconds: 'NONE' as const },
  });
  const prescripcion = { intensity: { criterion: 'RIR' as const, target: { value: 2, reference: null } }, sets: [serie(1, 2), serie(2, 2), serie(3, 2)] };
  assert.equal(renglonDelEjercicio(prescripcion), '3 × 5 rep. · RIR 2');
  assert.equal(renglonDelEjercicio(prescripcion, 'RPE'), '3 × 5 rep. · RPE 8');
  const distintas = { ...prescripcion, sets: [serie(1, 2), serie(2, 1), serie(3, 0)] };
  assert.equal(renglonDelEjercicio(distintas, 'RPE'), '3 series · 5 rep. · RPE por serie');
  assert.deepEqual(
    seriesDelEjercicio(distintas, 'RPE').filas.map((f) => f.rir),
    ['RPE 8', 'RPE 9', 'RPE 10'],
  );

  const registrada = { setIndex: 1, load: { value: 100, unit: 'kg' as const }, completedRepetitions: 5, rir: 2, perceivedExertion: 7 };
  assert.equal(serieRegistradaEnPalabras(registrada), '100 kg · 5 rep. · RIR 2 · esfuerzo percibido 7');
  // El esfuerzo percibido es otra medida: no se convierte.
  assert.equal(serieRegistradaEnPalabras(registrada, 'RPE'), '100 kg · 5 rep. · RPE 8 · esfuerzo percibido 7');
  // «La vez pasada» del editor: lo registrado, en la notación del borrador; sin notación, RIR como siempre.
  const vez = { carga: { value: 20, unit: 'kg' as const }, repeticiones: 8, rir: 2 };
  assert.equal(textoDeLaSerie(vez), '20 kg × 8 · RIR 2');
  assert.equal(textoDeLaSerie(vez, 'RPE'), '20 kg × 8 · RPE 8');
  assert.equal(textoDeLaSerie({ ...vez, rir: 5 }, 'RPE'), '20 kg × 8 · RPE 6 o menos');
});

test('TEST-RPE-007 · la comparación con lo indicado es la del RIR guardado, dicha en RPE con el sentido al revés', () => {
  const objetivo = { repetitions: { value: 5 }, rir: 2, suggestedLoad: null };
  const conRir = (rir: number) => ({ setIndex: 1, load: null, completedRepetitions: 5, rir, perceivedExertion: null });
  // Le quedó una en reserva con dos indicadas: menos RIR, más RPE.
  assert.equal(relacionDeUnaSerie(objetivo, conRir(1)).texto, 'RIR: por debajo');
  assert.equal(relacionDeUnaSerie(objetivo, conRir(1), 'RPE').texto, 'RPE: por encima');
  assert.equal(relacionDeUnaSerie(objetivo, conRir(3), 'RPE').texto, 'RPE: por debajo');
  assert.equal(relacionDeUnaSerie(objetivo, conRir(2), 'RPE').texto, 'Dentro de lo indicado');
  // La diferencia es la misma en las dos notaciones: cambia solo cómo se dice.
  assert.equal(relacionDeUnaSerie(objetivo, conRir(1)).conDiferencia, relacionDeUnaSerie(objetivo, conRir(1), 'RPE').conDiferencia);
  // RPE-D03: indicado «6 o menos» (RIR 4) y registrado RIR 6 se leen los dos «RPE 6 o menos»: en RPE no hay diferencia
  // que mostrar; en RIR, el número se compara tal cual. Con lo indicado arriba del piso, la diferencia sigue.
  const enElPiso = { repetitions: { value: 5 }, rir: 4, suggestedLoad: null };
  assert.equal(relacionDeUnaSerie(enElPiso, conRir(6)).texto, 'RIR: por encima');
  assert.deepEqual(
    [relacionDeUnaSerie(enElPiso, conRir(6), 'RPE').texto, relacionDeUnaSerie(enElPiso, conRir(6), 'RPE').conDiferencia],
    ['Dentro de lo indicado', false],
  );
  assert.equal(relacionDeUnaSerie(enElPiso, conRir(3), 'RPE').texto, 'RPE: por encima');
  assert.equal(relacionDeUnaSerie({ ...enElPiso, rir: 3 }, conRir(6), 'RPE').texto, 'RPE: por debajo');
});

test('TEST-RPE-008 · la notación de un plan: lo guardado, el borrador que nace y lo que se lee de la persona', () => {
  assert.equal(notacionDe('RPE'), 'RPE');
  for (const otro of ['RIR', undefined, null, 'rpe', 3, {}]) assert.equal(notacionDe(otro), 'RIR');
  // RPE-D01: la pedida; si no, la de la base; si no, la última del profesional; si no, RIR.
  assert.equal(notacionInicial({ pedida: 'RIR', deLaBase: 'RPE', ultimaDelProfesional: 'RPE' }), 'RIR');
  assert.equal(notacionInicial({ deLaBase: 'RPE', ultimaDelProfesional: 'RIR' }), 'RPE');
  assert.equal(notacionInicial({ deLaBase: 'RIR', ultimaDelProfesional: 'RPE' }), 'RIR');
  assert.equal(notacionInicial({ ultimaDelProfesional: 'RPE' }), 'RPE');
  assert.equal(notacionInicial({}), 'RIR');
  // La vigente manda; sin vigente, la más nueva; una versión de antes de DL-192 es RIR.
  const v = (isEffective: boolean, createdAt: string, effortNotation?: 'RIR' | 'RPE') => ({ isEffective, createdAt, ...(effortNotation ? { effortNotation } : {}) });
  assert.equal(notacionDeLasVersiones([v(false, '2026-11-22T10:00:00Z', 'RPE'), v(true, '2026-11-01T10:00:00Z', 'RIR')]), 'RIR');
  assert.equal(notacionDeLasVersiones([v(false, '2026-11-01T10:00:00Z', 'RIR'), v(false, '2026-11-22T10:00:00Z', 'RPE')]), 'RPE');
  assert.equal(notacionDeLasVersiones([v(true, '2026-11-01T10:00:00Z')]), 'RIR');
  assert.equal(notacionDeLasVersiones([]), 'RIR');
});

test('TEST-RPE-009 · el máximo estimado, en la notación: «estimado con 5 reps a RPE 8» o «a RIR 2»', () => {
  assert.equal(conQueSeEstimo({ repeticiones: 5, rir: 2 }, 'RPE'), 'estimado con 5 reps a RPE 8');
  assert.equal(conQueSeEstimo({ repeticiones: 5, rir: 2 }, 'RIR'), 'estimado con 5 reps a RIR 2');
  assert.equal(conQueSeEstimo({ repeticiones: 1, rir: 0 }, 'RPE'), 'estimado con 1 rep a RPE 10');
  assert.equal(conQueSeEstimo({ repeticiones: 8, rir: 1.5 }, 'RPE'), 'estimado con 8 reps a RPE 8,5');
});

const observada = (carga: number, repeticiones: number, rir: number | null) =>
  estimarLaSerie({ exerciseId: BANCA, fuente: 'OBSERVADA', load: { value: carga, unit: 'kg' }, completedRepetitions: repeticiones, rir, fechaCivil: '2026-11-22' });
const valor = (r: ResultadoDeLaSerie): number => (r.entra ? r.estimacion.valor : Number.NaN);

test('TEST-RPE-010 · Epley v1 con valores conocidos: el RPE escrito llega al método como su RIR', () => {
  // 100 kg × 5 a RPE 8 = RIR 2: n_eq 7, 100 × 37/30.
  const deRpe = leerRpeEscrito('8');
  assert.equal(deRpe, 2);
  assert.ok(Math.abs(valor(observada(100, 5, deRpe)) - 123.333333) < 1e-5);
  assert.equal(valor(observada(100, 5, deRpe)), epley(100, 7));
  // 80 × 8 a RPE 10 (RIR 0): 80 × 38/30 = 101,33.
  assert.ok(Math.abs(valor(observada(80, 8, leerRpeEscrito('10'))) - 101.333333) < 1e-5);
  // 1 a RPE 10: la carga.
  assert.equal(valor(observada(140, 1, leerRpeEscrito('10'))), 140);
  // 70 × 10 a RPE 8 y 70 × 12 a RPE 10 dan lo mismo (98,0), como en RIR: la notación no cambia la cuenta.
  assert.equal(valor(observada(70, 10, leerRpeEscrito('8'))), valor(observada(70, 12, leerRpeEscrito('10'))));
});

test('TEST-RPE-011 · los límites de confiabilidad (DL-171, sin cambios): RIR 0 a 2 = RPE 8 a 10, y hasta 12 equivalentes', () => {
  // RPE 8 (RIR 2) entra; RPE 7,5 (RIR 2,5) ya no.
  assert.equal(observada(100, 5, leerRpeEscrito('8')).entra, true);
  const r = observada(100, 5, leerRpeEscrito('7,5'));
  assert.equal(r.entra, false);
  assert.equal(!r.entra && r.motivo, 'RIR_MAYOR_QUE_2');
  // «6 o menos» (RIR 4) nunca estima.
  assert.equal(observada(100, 5, leerRpeEscrito('6 o menos')).entra, false);
  // Las bandas, sobre las repeticiones equivalentes: 8 a RPE 8 es núcleo (10); 10 a RPE 8, orientativa (12); 11 a RPE 8, fuera (13).
  const nucleo = observada(100, 8, 2);
  assert.equal(nucleo.entra && nucleo.estimacion.banda, 'NUCLEO');
  const orientativa = observada(100, 10, 2);
  assert.equal(orientativa.entra && orientativa.estimacion.banda, 'ORIENTATIVA');
  const fuera = observada(100, 11, 2);
  assert.equal(!fuera.entra && fuera.motivo, 'MAS_DE_12');
  // Sin esfuerzo, no se estima.
  const sin = observada(100, 5, null);
  assert.equal(!sin.entra && sin.motivo, 'SIN_RIR');
  // Los motivos, dichos en la notación.
  assert.equal(motivoEnLaNotacion('RIR_MAYOR_QUE_2', motivoEnPalabras({ entra: false, motivo: 'RIR_MAYOR_QUE_2' }), 'RPE'), 'el RPE es menor que 8');
  assert.equal(motivoEnLaNotacion('SIN_RIR', motivoEnPalabras({ entra: false, motivo: 'SIN_RIR' }), 'RPE'), 'no tiene RPE');
  assert.equal(motivoEnLaNotacion('VALOR_DEL_PLAN', motivoEnPalabras({ entra: false, motivo: 'VALOR_DEL_PLAN', campos: ['rir'] }), 'RPE'), 'el RPE es el del plan');
  assert.equal(motivoEnLaNotacion('RIR_MAYOR_QUE_2', motivoEnPalabras({ entra: false, motivo: 'RIR_MAYOR_QUE_2' }), 'RIR'), COPY_FUERZA.motivo.RIR_MAYOR_QUE_2);
  assert.equal(copyDeLaEstimacion('RIR').reglaDelRir, COPY_FUERZA.reglaDelRir);
  assert.match(copyDeLaEstimacion('RPE').reglaDelRir, /RPE 8 a 10 \(RIR 0 a 2\)/);
});

test('TEST-RPE-012 · los textos pasan las guardias de Entrenamiento y de fuerza', () => {
  const textos = [
    ...Object.values(COPY_NOTACION_DEL_ESFUERZO.etiqueta),
    ...Object.values(COPY_NOTACION_DEL_ESFUERZO.nombre),
    COPY_NOTACION_DEL_ESFUERZO.titulo,
    COPY_NOTACION_DEL_ESFUERZO.queEs,
    ...COPY_NOTACION_DEL_ESFUERZO.explicacion,
    COPY_NOTACION_DEL_ESFUERZO.fuentes,
    ...(['RIR', 'RPE'] as const).flatMap((n) => Object.values(copyDeLaEstimacion(n))),
    conQueSeEstimo({ repeticiones: 5, rir: 2 }, 'RPE'),
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeFuerzaEn(t), [], t);
  }
});
