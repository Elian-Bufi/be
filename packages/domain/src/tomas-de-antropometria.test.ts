/**
 * Antropometría · Tomas (WP-ESCRITORIO-AREAS, parte 3): la lista por protocolo, las cuentas de una toma, las mediciones
 * por familia, la historia de una medición y lo que cambió con una corrección.
 *
 * Los resultados esperados se escriben a mano, a partir de las maquetas 22 y 29, del criterio (C-58 a C-64) y de las
 * reglas de B-06 (el valor que rige; anular no borra; una corrida reemplaza a otra por relación). Datos sintéticos,
 * validados contra los esquemas estrictos de la medición y de la corrida. Si una prueba falla, se corrige el cálculo,
 * no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MedicionSchema, type Medicion } from './contratos-antropometria';
import { CorridaDeCalculoSchema, type CorridaDeCalculoApi } from './contratos-calculo';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { NOMBRE_DE_METRICA, FAMILIA_DE_METRICA } from './nombres-de-metricas';
import {
  cuentasDeLaTomaEnPalabras,
  excepcionesDeLaMedicion,
  FAMILIAS_EN_ORDEN,
  historiaDeLaMedicion,
  loQueCambio,
  medicionesPorFamilia,
  nombreCortoDeMetrica,
  resumenDeLaToma,
  tomasDeLaMasNueva,
  tramosDeProtocolo,
  valorDelResultado,
  valorQueRige,
} from './tomas-de-antropometria';

const PERFIL = { protocolId: 'prot-perfil', protocolVersionId: 'prot-perfil-v1', protocolName: 'Perfil antropométrico completo', methodId: null, methodVersionId: null };
const LABORATORIO = { protocolId: 'prot-lab', protocolVersionId: 'prot-lab-v1', protocolName: 'Protocolo de laboratorio (demostración)', methodId: null, methodVersionId: null };
const SOFIA = { identityId: 'id-sofia', displayName: 'Lic. Sofía Paz (sintética)' };
const BRUNO = { identityId: 'id-bruno', displayName: 'Lic. Bruno Díaz (sintético)' };

let n = 0;
/** Una medición vigente y sin correcciones, del perfil completo, tomada por el profesional. */
function medicion(metric: string, value: number, unit: string, cambios: Partial<Medicion> = {}): Medicion {
  n += 1;
  return MedicionSchema.parse({
    measurementId: `med-${n}`,
    evaluationId: 'toma-1',
    metric,
    magnitude: { value, unit },
    origin: 'DIRECT_CAPTURE',
    dataClass: 'MEASURED',
    protocol: { ...PERFIL, unit },
    preparationReference: null,
    condition: 'EFFECTIVE',
    annulment: null,
    corrections: [],
    effectiveMagnitude: { value, unit },
    occurredAt: '2026-09-24T11:40:00.000Z',
    recordedAt: `2026-09-24T12:02:${String(n % 60).padStart(2, '0')}.000Z`,
    ...cambios,
  });
}
const correccion = (id: string, anterior: string | null, value: number, unit: string, reason: string, author = SOFIA, recordedAt = '2026-09-24T12:05:00.000Z') => ({
  correctionId: id,
  previousCorrectionId: anterior,
  reason,
  magnitude: { value, unit },
  author,
  recordedAt,
});

/** Una corrida vigente de la toma 1, con sus entradas. */
function corrida(id: string, metodo: string, valor: number, unidad: string, decimales: number, entradas: readonly { ref: string; metric: string; value?: number; unit?: string; anulada?: boolean }[], cambios: Partial<CorridaDeCalculoApi> = {}): CorridaDeCalculoApi {
  return CorridaDeCalculoSchema.parse({
    calculationRunId: id,
    adviseeId: 'ase-1',
    evaluationId: 'toma-1',
    evaluationContext: 'REGISTERED',
    purpose: 'ANTHROPOMETRIC_SUPPORT',
    methodId: `met-${metodo}`,
    methodVersionId: `met-${metodo}-v1`,
    methodName: metodo,
    methodVersion: '1',
    ruleId: 'regla-1',
    result: { metric: 'resultado', magnitude: { value: valor, unit: unidad } },
    precision: { decimals: decimales, rounding: 'HALF_UP' },
    inputProvenance: entradas.map((e, i) => ({
      inputCode: `entrada-${i + 1}`,
      sourceRef: e.ref,
      metric: e.metric,
      ...(e.value === undefined ? {} : { magnitude: { value: e.value, unit: e.unit ?? 'cm' } }),
      provenanceType: 'DIRECT_CAPTURE',
      condition: e.anulada ? 'ANNULLED' : 'EFFECTIVE',
      sourceOccurredAt: '2026-09-24T11:40:00.000Z',
    })),
    supersedesRunId: null,
    referenceForPurpose: false,
    referenceVersion: null,
    effective: true,
    supersededByRunId: null,
    author: SOFIA,
    recordedAt: '2026-09-24T12:10:00.000Z',
    ...cambios,
  });
}

// ─── La lista ───────────────────────────────────────────────────────────────────────────────────

test('las tomas van por cuándo se tomaron, la más nueva primero; con la misma fecha, la registrada después', () => {
  const tomas = [
    { id: 'vieja-cargada-despues', occurredAt: '2026-09-09T11:30:00.000Z', registeredAt: '2026-10-01T10:00:00.000Z' },
    { id: 'nueva', occurredAt: '2026-09-24T11:40:00.000Z', registeredAt: '2026-09-24T12:02:00.000Z' },
    { id: 'misma-fecha-a', occurredAt: '2026-09-17T11:35:00.000Z', registeredAt: '2026-09-17T12:00:00.000Z' },
    { id: 'misma-fecha-b', occurredAt: '2026-09-17T11:35:00.000Z', registeredAt: '2026-09-17T13:00:00.000Z' },
    { id: 'sin-registro', occurredAt: '2026-08-01T11:00:00.000Z', registeredAt: null },
  ];
  assert.deepEqual(
    tomasDeLaMasNueva(tomas).map((t) => t.id),
    ['nueva', 'misma-fecha-b', 'misma-fecha-a', 'vieja-cargada-despues', 'sin-registro'],
  );
  assert.equal(tomas[0]!.id, 'vieja-cargada-despues', 'no cambia la lista que recibe');
});

test('los tramos de protocolo son seguidos: una toma con otro protocolo en el medio parte el tramo, y nada se reordena', () => {
  const tomas = [
    { id: 't5', p: 'Perfil' },
    { id: 't4', p: 'Perfil' },
    { id: 't3', p: 'Laboratorio' },
    { id: 't2', p: 'Perfil' },
    { id: 't1', p: 'Perfil' },
  ];
  assert.deepEqual(
    tramosDeProtocolo(tomas, (t) => t.p).map((t) => [t.protocolo, t.tomas.map((x) => x.id)]),
    [
      ['Perfil', ['t5', 't4']],
      ['Laboratorio', ['t3']],
      ['Perfil', ['t2', 't1']],
    ],
  );
  assert.deepEqual(tramosDeProtocolo([], () => 'x'), []);
});

test('una toma cuyo protocolo todavía no se leyó no se suma al tramo de al lado: va en uno propio, sin nombre', () => {
  const tomas = [
    { id: 't4', p: 'Perfil' as string | null | undefined },
    { id: 't3', p: undefined },
    { id: 't2', p: undefined },
    { id: 't1', p: null },
  ];
  assert.deepEqual(
    tramosDeProtocolo(tomas, (t) => t.p).map((t) => [t.protocolo, t.tomas.length]),
    [
      ['Perfil', 1],
      [undefined, 2],
      [null, 1],
    ],
  );
});

test('las cuentas de una toma se dicen con sus plurales; lo que no se sabe o es cero no se dice', () => {
  assert.equal(cuentasDeLaTomaEnPalabras({ mediciones: 30, corregidas: 1, anuladas: 0 }), '30 mediciones · 1 corregida');
  assert.equal(cuentasDeLaTomaEnPalabras({ mediciones: 30, corregidas: 2, anuladas: 3 }), '30 mediciones · 2 corregidas · 3 anuladas');
  assert.equal(cuentasDeLaTomaEnPalabras({ mediciones: 1, corregidas: 0, anuladas: 1 }), '1 medición · 1 anulada');
  assert.equal(cuentasDeLaTomaEnPalabras({ mediciones: 16, corregidas: null, anuladas: 0 }), '16 mediciones');
  assert.equal(cuentasDeLaTomaEnPalabras({ mediciones: 1200, corregidas: null, anuladas: 0 }), '1.200 mediciones');
});

test('el resumen de una toma: su protocolo (el más frecuente), sus cuentas y la clase del dato si todas la comparten', () => {
  const corregida = medicion('perimetro-cintura', 48, 'cm', { corrections: [correccion('c1', null, 84, 'cm', 'Valor tipeado mal')], effectiveMagnitude: { value: 84, unit: 'cm' } });
  const anuladaYCorregida = medicion('pliegue-biceps', 11, 'mm', {
    condition: 'ANNULLED',
    annulment: { annulmentId: 'an-1', reason: 'Mal tomada', author: SOFIA, occurredAt: '2026-09-24T12:20:00.000Z', recordedAt: '2026-09-24T12:20:00.000Z' },
    corrections: [correccion('c2', null, 12, 'mm', 'Otra lectura')],
    effectiveMagnitude: { value: 12, unit: 'mm' },
  });
  const deOtroProtocolo = medicion('talla', 168, 'cm', { protocol: { ...LABORATORIO, unit: 'cm' } });
  const r = resumenDeLaToma([medicion('peso', 77.9, 'kg'), corregida, anuladaYCorregida, deOtroProtocolo]);
  assert.equal(r.protocolo, 'Perfil antropométrico completo');
  // La anulada cuenta como anulada, no además como corregida: dejó de contar.
  assert.deepEqual(r.cuentas, { mediciones: 4, corregidas: 1, anuladas: 1 });
  assert.equal(r.claseComun, 'MEASURED');
  assert.equal(resumenDeLaToma([medicion('peso', 77.9, 'kg'), medicion('talla', 168, 'cm', { dataClass: 'REPORTED', origin: 'SELF_REPORTED' })]).claseComun, null);
  assert.deepEqual(resumenDeLaToma([]), { protocolo: null, cuentas: { mediciones: 0, corregidas: 0, anuladas: 0 }, claseComun: null });
});

// ─── Las mediciones ─────────────────────────────────────────────────────────────────────────────

test('el nombre corto saca la palabra de la familia y su preposición, en las 27 mediciones del catálogo que la llevan', () => {
  const esperado: Record<string, string> = {
    'pliegue-pectoral': 'Pectoral',
    'pliegue-axilar-media': 'Axilar medio',
    'pliegue-triceps': 'Tricipital',
    'pliegue-subescapular': 'Subescapular',
    'pliegue-biceps': 'Bicipital',
    'pliegue-cresta-iliaca': 'Cresta ilíaca',
    'pliegue-supraespinal': 'Supraespinal',
    'pliegue-abdominal': 'Abdominal',
    'pliegue-muslo-frontal': 'Muslo frontal',
    'pliegue-pantorrilla': 'Pantorrilla',
    'pliegue-antebrazo': 'Antebrazo',
    'perimetro-cuello': 'Cuello',
    'perimetro-hombros': 'Hombros',
    'perimetro-pecho': 'Pecho',
    'perimetro-brazo-relajado': 'Brazo relajado',
    'perimetro-brazo-flexionado': 'Brazo flexionado y contraído',
    'perimetro-antebrazo': 'Antebrazo',
    'perimetro-muneca': 'Muñeca',
    'perimetro-cintura': 'Cintura',
    'perimetro-abdomen': 'Abdomen',
    'perimetro-cadera': 'Cadera',
    'perimetro-muslo': 'Muslo',
    'perimetro-pantorrilla': 'Pantorrilla',
    'perimetro-tobillo': 'Tobillo',
    'diametro-humero': 'Biepicondíleo del húmero (codo)',
    'diametro-biestiloideo': 'Biestiloideo (muñeca)',
    'diametro-femur': 'Bicondíleo del fémur (rodilla)',
  };
  // Las 27 son todas las del catálogo con familia de pliegues, perímetros o diámetros: ni una más ni una menos.
  const delCatalogo = Object.keys(FAMILIA_DE_METRICA).filter((c) => ['PLIEGUES', 'PERIMETROS', 'DIAMETROS'].includes(FAMILIA_DE_METRICA[c]!));
  assert.deepEqual(delCatalogo.sort(), Object.keys(esperado).sort());
  for (const [clave, corto] of Object.entries(esperado)) assert.equal(nombreCortoDeMetrica(clave), corto, clave);
});

test('lo que no lleva la palabra de su familia, o no es del catálogo, queda con su nombre entero', () => {
  assert.equal(nombreCortoDeMetrica('peso'), 'Peso');
  assert.equal(nombreCortoDeMetrica('edad'), NOMBRE_DE_METRICA['edad']);
  assert.equal(nombreCortoDeMetrica('grasa-rfm'), 'Grasa corporal (RFM)');
  assert.equal(nombreCortoDeMetrica('envergadura-de-brazos'), 'Envergadura de brazos');
  // Una métrica de otro catálogo que cae en «Perímetros» pero no se llama «Perímetro …» no se recorta.
  assert.equal(nombreCortoDeMetrica('contorno-de-gemelo', 'PERIMETROS'), 'Contorno de gemelo');
});

test('las mediciones van por familia en el orden del dominio y, adentro, en el del catálogo; una familia vacía no aparece', () => {
  const familias = medicionesPorFamilia([
    medicion('perimetro-cintura', 84, 'cm'),
    medicion('talla', 168, 'cm'),
    medicion('pliegue-abdominal', 27.5, 'mm'),
    medicion('perimetro-cuello', 33.5, 'cm'),
    medicion('peso', 77.9, 'kg'),
    medicion('edad', 34, 'años'),
    medicion('pliegue-pectoral', 13, 'mm'),
  ]);
  assert.deepEqual(
    familias.map((f) => [f.familia, f.filas.map((x) => x.nombreCorto)]),
    [
      ['MASA_Y_ESTATURA', ['Peso', 'Talla']],
      ['PLIEGUES', ['Pectoral', 'Abdominal']],
      ['PERIMETROS', ['Cuello', 'Cintura']],
      ['OTRAS', ['Edad al momento de la toma']],
    ],
  );
  assert.deepEqual(FAMILIAS_EN_ORDEN, ['MASA_Y_ESTATURA', 'PLIEGUES', 'PERIMETROS', 'DIAMETROS', 'OTRAS']);
  assert.deepEqual(familias.map((f) => f.titulo), ['Masa y estatura', 'Pliegues cutáneos', 'Perímetros', 'Otras mediciones del protocolo']);
});

test('la unidad se dice una vez por familia si todas sus mediciones la comparten y son más de una; si no, en cada fila', () => {
  const familias = medicionesPorFamilia([
    medicion('peso', 77.9, 'kg'),
    medicion('talla', 168, 'cm'),
    medicion('perimetro-cintura', 84, 'cm'),
    medicion('perimetro-cuello', 33.5, 'cm'),
    medicion('edad', 34, 'años'),
  ]);
  const [masa, perimetros, otras] = familias;
  // Masa y estatura mezcla kg y cm: cada fila con la suya.
  assert.equal(masa!.unidad, null);
  assert.deepEqual(masa!.filas.map((f) => f.valor), ['77,9 kg', '168 cm']);
  // Perímetros comparte cm: va en el título, y la fila muestra el número. El valor completo conserva la unidad.
  assert.equal(perimetros!.unidad, 'cm');
  assert.deepEqual(perimetros!.filas.map((f) => [f.valor, f.valorCompleto]), [
    ['33,5', '33,5 cm'],
    ['84', '84 cm'],
  ]);
  // Una sola medición no hace «una unidad de la familia»: va en la fila.
  assert.equal(otras!.unidad, null);
  assert.deepEqual(otras!.filas.map((f) => f.valor), ['34 años']);
  // Una medición corregida a otra unidad no puede existir (la corrección conserva la unidad); dos unidades sí.
  const mezcla = medicionesPorFamilia([medicion('perimetro-cintura', 84, 'cm'), medicion('perimetro-cuello', 13.2, 'in')]);
  assert.equal(mezcla[0]!.unidad, null);
  assert.deepEqual(mezcla[0]!.filas.map((f) => f.valor), ['13,2 in', '84 cm']);
});

test('la fila muestra el valor que rige, no el que se tomó primero; sin valor vigente lo dice y no inventa uno', () => {
  const corregida = medicion('perimetro-cintura', 48, 'cm', { corrections: [correccion('c1', null, 84, 'cm', 'Valor tipeado mal')], effectiveMagnitude: { value: 84, unit: 'cm' } });
  const sinVigente = medicion('perimetro-cadera', 104, 'cm', { corrections: [correccion('c9', 'no-existe', 101, 'cm', 'Cadena rota')], effectiveMagnitude: null });
  const filas = medicionesPorFamilia([corregida, sinVigente])[0]!.filas;
  assert.deepEqual(
    filas.map((f) => [f.nombreCorto, f.valor, f.valorCompleto, f.marcas.map((x) => x.texto)]),
    [
      ['Cintura', '84', '84 cm', ['Corregida']],
      ['Cadera', null, 'Sin valor vigente', ['Sin valor vigente']],
    ],
  );
  assert.equal(valorQueRige(corregida), '84 cm');
  assert.equal(valorQueRige(sinVigente), null);
});

test('en la fila solo se marca la excepción: una medición vigente y sin correcciones no lleva ninguna marca', () => {
  const anulada = medicion('pliegue-biceps', 11, 'mm', {
    condition: 'ANNULLED',
    annulment: { annulmentId: 'an-1', reason: 'Mal tomada', author: SOFIA, occurredAt: '2026-09-24T12:20:00.000Z', recordedAt: '2026-09-24T12:20:00.000Z' },
    corrections: [correccion('c2', null, 12, 'mm', 'Otra lectura')],
    effectiveMagnitude: { value: 12, unit: 'mm' },
  });
  const filas = medicionesPorFamilia([medicion('pliegue-pectoral', 13, 'mm'), anulada])[0]!.filas;
  assert.deepEqual(filas[0]!.marcas, []);
  assert.equal(filas[0]!.anulada, false);
  // Una anulada se dice «Anulada» y nada más (no además «Corregida»), y conserva su valor a la vista: anular no borra.
  assert.deepEqual(filas[1]!.marcas, [{ clase: 'anulado', texto: 'Anulada' }]);
  assert.equal(filas[1]!.anulada, true);
  assert.equal(filas[1]!.valor, '12');
  assert.deepEqual(excepcionesDeLaMedicion(medicion('peso', 77.9, 'kg')), []);
});

test('si la toma mezcla lo medido y lo reportado, cada fila dice su clase; si todas son de una, ninguna la repite', () => {
  const reportada = medicion('talla', 168, 'cm', { dataClass: 'REPORTED', origin: 'SELF_REPORTED' });
  const mezcla = medicionesPorFamilia([medicion('peso', 77.9, 'kg'), reportada])[0]!.filas;
  assert.deepEqual(mezcla.map((f) => f.marcas), [[{ clase: 'medido', texto: 'Medido' }], [{ clase: 'reportado', texto: 'Reportado' }]]);
  const todasReportadas = medicionesPorFamilia([reportada])[0]!.filas;
  assert.deepEqual(todasReportadas[0]!.marcas, []);
});

test('el nombre accesible de una fila es el completo: con los cortos hay dos «Antebrazo» y dos «Pantorrilla»', () => {
  const familias = medicionesPorFamilia([medicion('pliegue-antebrazo', 8, 'mm'), medicion('perimetro-antebrazo', 25, 'cm'), medicion('pliegue-pantorrilla', 17, 'mm'), medicion('perimetro-pantorrilla', 37.5, 'cm')]);
  const filas = familias.flatMap((f) => f.filas);
  assert.deepEqual(filas.map((f) => f.nombreCorto).sort(), ['Antebrazo', 'Antebrazo', 'Pantorrilla', 'Pantorrilla']);
  assert.equal(new Set(filas.map((f) => f.nombre)).size, 4);
});

// ─── La historia ────────────────────────────────────────────────────────────────────────────────

test('la historia va de lo más nuevo a lo más viejo, por la cadena de correcciones, y conserva el original', () => {
  // Las fechas están al revés a propósito: manda la cadena (cada corrección señala a la anterior), no la fecha.
  const m = medicion('perimetro-cintura', 48, 'cm', {
    corrections: [
      correccion('c2', 'c1', 84, 'cm', 'Valor tipeado mal: era 84', SOFIA, '2026-09-24T12:03:00.000Z'),
      correccion('c1', null, 94, 'cm', 'Primera lectura de la planilla', BRUNO, '2026-09-24T12:05:00.000Z'),
    ],
    effectiveMagnitude: { value: 84, unit: 'cm' },
  });
  const historia = historiaDeLaMedicion(m, 'id-sofia');
  assert.deepEqual(
    historia.map((e) => [e.tipo, e.valor, e.rige, e.motivo, e.autor, e.propio]),
    [
      ['CORRECCION', '84 cm', true, 'Valor tipeado mal: era 84', 'Lic. Sofía Paz (sintética)', true],
      ['CORRECCION', '94 cm', false, 'Primera lectura de la planilla', 'Lic. Bruno Díaz (sintético)', false],
      ['ORIGINAL', '48 cm', false, null, null, false],
    ],
  );
  assert.equal(historia.filter((e) => e.rige).length, 1);
});

test('sin correcciones rige el original; con la cadena sin resolver no rige ninguno', () => {
  assert.deepEqual(
    historiaDeLaMedicion(medicion('peso', 77.9, 'kg'), null).map((e) => [e.tipo, e.valor, e.rige]),
    [['ORIGINAL', '77,9 kg', true]],
  );
  const rota = medicion('perimetro-cadera', 104, 'cm', { corrections: [correccion('c9', 'no-existe', 101, 'cm', 'Cadena rota')], effectiveMagnitude: null });
  const historia = historiaDeLaMedicion(rota, null);
  assert.deepEqual(historia.map((e) => e.tipo), ['CORRECCION', 'ORIGINAL']);
  assert.equal(historia.some((e) => e.rige), false);
});

test('una medición anulada cuenta su anulación primero, con el motivo y quién; su valor y su historia se conservan', () => {
  const m = medicion('pliegue-biceps', 11, 'mm', {
    condition: 'ANNULLED',
    annulment: { annulmentId: 'an-1', reason: 'El calibre estaba mal apoyado', author: BRUNO, occurredAt: '2026-09-25T10:00:00.000Z', recordedAt: '2026-09-25T10:01:00.000Z' },
  });
  const historia = historiaDeLaMedicion(m, 'id-sofia');
  assert.deepEqual(
    historia.map((e) => [e.tipo, e.valor, e.motivo, e.autor, e.propio, e.cuando]),
    [
      ['ANULACION', null, 'El calibre estaba mal apoyado', 'Lic. Bruno Díaz (sintético)', false, '2026-09-25T10:01:00.000Z'],
      ['ORIGINAL', '11 mm', null, null, false, m.recordedAt],
    ],
  );
  // En una medición anulada ningún valor rige: quedan a la vista, y dejó de contar.
  assert.equal(historia.some((e) => e.rige), false);
  // Si la anuló quien mira, es «propio»; sin la identidad de quien mira, nada lo es.
  assert.equal(historiaDeLaMedicion(m, 'id-bruno')[0]!.propio, true);
  assert.equal(historiaDeLaMedicion(m, null)[0]!.propio, false);
});

// ─── Lo que cambió ──────────────────────────────────────────────────────────────────────────────

const CINTURA = { measurementId: 'med-cintura', evaluationId: 'toma-1', condition: 'EFFECTIVE' as const, effectiveMagnitude: { value: 84, unit: 'cm' } };

test('un resultado se dice con los decimales de su método, aunque termine en cero, y sin unidad si no tiene', () => {
  assert.equal(valorDelResultado(corrida('r1', 'Índice cintura/talla', 0.5, 'adimensional', 2, [])), '0,50');
  assert.equal(valorDelResultado(corrida('r2', 'Masa grasa relativa (RFM), mujeres', 36, '%', 1, [])), '36,0 %');
  assert.equal(valorDelResultado(corrida('r3', 'Índice de masa corporal (IMC)', 27.6, 'kg/m²', 1, [])), '27,6 kg/m²');
});

test('lo que cambió con la corrección: la corrida vigente y la que reemplaza usaron esta medición con valores distintos', () => {
  const corridas = [
    // Llegan con las de RFM primero: el orden por método lo pone el cálculo, no el orden de llegada.
    corrida('rfm-1', 'Masa grasa relativa (RFM), mujeres', 6, '%', 1, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 48 }], { effective: false, supersededByRunId: 'rfm-2' }),
    corrida('rfm-2', 'Masa grasa relativa (RFM), mujeres', 36, '%', 1, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }], { supersedesRunId: 'rfm-1' }),
    corrida('icc-1', 'Índice cintura/cadera', 0.46, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 48 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104 }], { effective: false, supersededByRunId: 'icc-2' }),
    corrida('icc-2', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104 }], { supersedesRunId: 'icc-1' }),
    // No usa la cintura: no es de esta medición.
    corrida('imc-1', 'Índice de masa corporal (IMC)', 27.6, 'kg/m²', 1, [{ ref: 'med-peso', metric: 'peso', value: 77.9, unit: 'kg' }]),
  ];
  assert.deepEqual(loQueCambio(CINTURA, corridas), {
    recalculados: [
      { corridaId: 'icc-2', metodo: 'Índice cintura/cadera', ahora: '0,81', antes: '0,46' },
      { corridaId: 'rfm-2', metodo: 'Masa grasa relativa (RFM), mujeres', ahora: '36,0 %', antes: '6,0 %' },
    ],
    sinRecalcular: [],
    sinAtribuir: 0,
  });
});

test('una corrida reemitida porque cambió otra de sus entradas no se le atribuye a esta medición', () => {
  // Se corrigió la cadera (104 → 100): el índice se volvió a calcular, y la cintura entró con el mismo valor.
  const corridas = [
    corrida('icc-1', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104 }], { effective: false, supersededByRunId: 'icc-2' }),
    corrida('icc-2', 'Índice cintura/cadera', 0.84, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 100 }], { supersedesRunId: 'icc-1' }),
  ];
  assert.deepEqual(loQueCambio(CINTURA, corridas), { recalculados: [], sinRecalcular: [], sinAtribuir: 0 });
  // Desde la cadera, sí.
  const cadera = { measurementId: 'med-cadera', evaluationId: 'toma-1', condition: 'EFFECTIVE' as const, effectiveMagnitude: { value: 100, unit: 'cm' } };
  assert.deepEqual(loQueCambio(cadera, corridas).recalculados, [{ corridaId: 'icc-2', metodo: 'Índice cintura/cadera', ahora: '0,84', antes: '0,81' }]);
});

test('una corrida que nunca se reemplazó, una de otra toma y una ya reemplazada no cuentan como cambios', () => {
  const corridas = [
    corrida('rfm-1', 'Masa grasa relativa (RFM), mujeres', 36, '%', 1, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }]),
    corrida('otra-toma-1', 'Índice cintura/cadera', 0.46, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 48 }], { evaluationId: 'toma-2', effective: false, supersededByRunId: 'otra-toma-2' }),
    corrida('otra-toma-2', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }], { evaluationId: 'toma-2', supersedesRunId: 'otra-toma-1' }),
  ];
  assert.deepEqual(loQueCambio(CINTURA, corridas), { recalculados: [], sinRecalcular: [], sinAtribuir: 0 });
});

test('si la API no dice con qué valor entró la medición, el cambio no se atribuye: se cuenta aparte', () => {
  const corridas = [
    corrida('icc-1', 'Índice cintura/cadera', 0.46, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura' }], { effective: false, supersededByRunId: 'icc-2' }),
    corrida('icc-2', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }], { supersedesRunId: 'icc-1' }),
  ];
  assert.deepEqual(loQueCambio(CINTURA, corridas), { recalculados: [], sinRecalcular: [], sinAtribuir: 1 });
});

test('al anular una medición, los resultados que la usaban quedan sin efecto y sin reemplazo: se dicen, sin un cero', () => {
  const anulada = { measurementId: 'med-cintura', evaluationId: 'toma-1', condition: 'ANNULLED' as const, effectiveMagnitude: { value: 84, unit: 'cm' } };
  const corridas = [
    corrida('icc-1', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84, anulada: true }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104 }], { effective: false }),
    corrida('imc-1', 'Índice de masa corporal (IMC)', 27.6, 'kg/m²', 1, [{ ref: 'med-peso', metric: 'peso', value: 77.9, unit: 'kg' }]),
  ];
  assert.deepEqual(loQueCambio(anulada, corridas), { recalculados: [], sinRecalcular: [{ corridaId: 'icc-1', metodo: 'Índice cintura/cadera', antes: '0,81' }], sinAtribuir: 0 });
});

test('una corrida que quedó sin efecto por otra de sus entradas no se le cuenta a esta medición, salvo que haya quedado con un valor suyo que ya no rige', () => {
  // Se anuló la cadera: el índice quedó sin efecto. La cintura entró con el valor que sigue rigiendo: no es suya.
  const porLaCadera = [corrida('icc-1', 'Índice cintura/cadera', 0.81, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 84 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104, anulada: true }], { effective: false })];
  assert.deepEqual(loQueCambio(CINTURA, porLaCadera).sinRecalcular, []);
  // Se corrigió la cintura (48 → 84) con la cadera ya anulada: no se pudo volver a calcular, y la corrida quedó con el 48.
  const conElValorViejo = [corrida('icc-1', 'Índice cintura/cadera', 0.46, 'adimensional', 2, [{ ref: 'med-cintura', metric: 'perimetro-cintura', value: 48 }, { ref: 'med-cadera', metric: 'perimetro-cadera', value: 104, anulada: true }], { effective: false })];
  assert.deepEqual(loQueCambio(CINTURA, conElValorViejo).sinRecalcular, [{ corridaId: 'icc-1', metodo: 'Índice cintura/cadera', antes: '0,46' }]);
});

// ─── Las palabras ───────────────────────────────────────────────────────────────────────────────

test('ninguna palabra de las filas, las marcas ni las cuentas califica un valor', () => {
  const corregida = medicion('perimetro-cintura', 48, 'cm', { corrections: [correccion('c1', null, 84, 'cm', 'Valor tipeado mal')], effectiveMagnitude: { value: 84, unit: 'cm' } });
  const familias = medicionesPorFamilia([medicion('peso', 77.9, 'kg'), corregida, medicion('talla', 168, 'cm', { dataClass: 'REPORTED', origin: 'SELF_REPORTED' })]);
  const textos = [
    ...familias.flatMap((f) => [f.titulo, ...f.filas.flatMap((x) => [x.nombre, x.nombreCorto, x.valorCompleto, ...x.marcas.map((y) => y.texto)])]),
    cuentasDeLaTomaEnPalabras({ mediciones: 30, corregidas: 1, anuladas: 2 }),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
});
