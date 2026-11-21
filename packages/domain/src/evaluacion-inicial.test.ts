/**
 * WP-EVALUACION-INICIAL-2 (DL-189) · TEST-EVI-001 a TEST-EVI-006, la parte pura de la evaluación inicial:
 *  1. los campos críticos por plantilla: existen en sus plantillas vigentes, cuentan solo los pedidos y visibles, en el
 *     orden del formulario, y en una versión con la parte «Tus hábitos» suman los de hábitos;
 *  2. lo que necesita el cálculo: la toma vale y el declarado queda al lado; sin toma, el declarado más nuevo; lo que cambia
 *     el profesional vale como «Cargado por vos» con lo anterior al lado; vaciarlo deja «Sin indicar»;
 *  3. lo que se registra: un renglón por dato indicado, la toma como observado y lo demás como informado, con su procedencia;
 *  4. el punto de unión con el calculador lee lo registrado, también evaluaciones anteriores con «Peso» y «Talla»;
 *  5. la corrección: «antes → después» solo con el antes en la evaluación;
 *  6. los textos sin el vocabulario prohibido ni calificaciones.
 *
 * Mutaciones verificadas, cada una pone su prueba en rojo: no filtrar por lo pedido; preferir el declarado al medido; no
 * marcar lo cambiado como «Cargado por vos»; registrar la toma como informada; leer el sexo sin normalizar; escribir
 * «asesorado» en un texto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPOS_CRITICOS_POR_PLANTILLA,
  camposCriticos,
  candidatosDeLasRespuestas,
  COPY_EVALUACION_INICIAL,
  correccionesDeLaPersona,
  datosDelCalculoEnLaEvaluacion,
  entradasDelCalculo,
  loQueNecesitaElCalculo,
  valorEscrito,
  type DatoParaElCalculo,
} from './evaluacion-inicial';
import { PLANTILLA_ENTRENAMIENTO_V4, PLANTILLA_HABITOS_V2, PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_NUTRICION_INICIO_V3, PLANTILLAS_DE_INICIO } from './plantillas-de-inicio';
import { camposEnOrden } from './formularios-v2';
import { terminosProhibidosEn } from './copy-nutricion';

const todos = (secciones: Parameters<typeof camposEnOrden>[0]) => ({ requestedFieldCodes: camposEnOrden(secciones).map((c) => c.fieldCode) });
const dia = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

test('TEST-EVI-001 · los críticos existen en sus plantillas, cuentan los pedidos y visibles, y suman los de hábitos con la parte', () => {
  // Cada código crítico existe en alguna versión de su plantilla: una lista con un código mal escrito no carga nada.
  for (const [clave, codigos] of Object.entries(CAMPOS_CRITICOS_POR_PLANTILLA)) {
    const deLaClave = new Set(PLANTILLAS_DE_INICIO.filter((p) => p.clave === clave).flatMap((p) => camposEnOrden(p.sections).map((c) => c.fieldCode)));
    for (const c of codigos) assert.ok(deLaClave.has(c), `${clave}: ${c} no está en ninguna versión`);
  }
  const v3 = PLANTILLA_NUTRICION_INICIO_V3.sections;
  const criticos = camposCriticos('FRM-NUTRICION-INICIO', v3, todos(v3));
  // En el orden del formulario y sin las condicionales cerradas (las alergias, sin «Sí»).
  const orden = camposEnOrden(v3).map((c) => c.fieldCode);
  assert.deepEqual(criticos, [...criticos].sort((a, b) => orden.indexOf(a) - orden.indexOf(b)));
  assert.ok(criticos.includes('nut_alergias'));
  assert.ok(!criticos.includes('nut_alergias_cuales'));
  const conAlergia = camposCriticos('FRM-NUTRICION-INICIO', v3, todos(v3), [{ fieldCode: 'nut_alergias', answer: { type: 'BOOLEAN', yes: true } }]);
  assert.ok(conAlergia.includes('nut_alergias_cuales'));
  // Solo los pedidos: sin pedir el embarazo, no cuenta.
  const sinEmbarazo = camposCriticos('FRM-NUTRICION-INICIO', v3, { requestedFieldCodes: orden.filter((c) => c !== 'nut_embarazo') });
  assert.ok(!sinEmbarazo.includes('nut_embarazo'));
  // La v2 trae «Tus hábitos»: suma el nivel de actividad; la v3, no.
  assert.ok(camposCriticos('FRM-NUTRICION-INICIO', PLANTILLA_NUTRICION_INICIO_V2.sections, todos(PLANTILLA_NUTRICION_INICIO_V2.sections)).includes('nivel_de_actividad'));
  assert.ok(!criticos.includes('nivel_de_actividad'));
  assert.ok(camposCriticos('FRM-HABITOS', PLANTILLA_HABITOS_V2.sections, todos(PLANTILLA_HABITOS_V2.sections)).includes('nivel_de_actividad'));
  assert.ok(camposCriticos('FRM-ENTRENAMIENTO', PLANTILLA_ENTRENAMIENTO_V4.sections, todos(PLANTILLA_ENTRENAMIENTO_V4.sections)).includes('trn_salud_corazon'));
  // Otra plantilla: ninguna crítica.
  assert.deepEqual(camposCriticos('FRM-OTRA', v3, todos(v3)), []);
});

const TOMA = { measuredOn: '2026-11-10', weightKg: 68.4, heightCm: 162, ageYears: 45 };
const porDato = (ds: readonly DatoParaElCalculo[]) => Object.fromEntries(ds.map((d) => [d.dato, d]));
const HABITOS = { fieldCode: 'nivel_de_actividad', answer: { type: 'CHOICE' as const, option: 'sentado_y_de_pie', otherText: null }, text: 'Combino sentado y de pie' };

test('TEST-EVI-002 · lo que necesita el cálculo: medido antes que declarado, el más nuevo, y lo cambiado como «Cargado por vos»', () => {
  const candidatos = candidatosDeLasRespuestas([
    { respuestas: [HABITOS], origen: { tipo: 'RESPONDIDO', fecha: '2026-11-12T10:00:00.000Z', formulario: 'Tus hábitos' } },
    { respuestas: [{ ...HABITOS, text: 'Mucho de pie o caminando' }], origen: { tipo: 'CARGADO_SIN_CONFIRMAR', fecha: '2026-11-21T10:00:00.000Z', formulario: 'Tus hábitos' } },
  ]);
  const d = porDato(loQueNecesitaElCalculo({ toma: TOMA, candidatos }));
  assert.equal(d.peso.valor, 68.4);
  assert.equal(d.peso.texto, '68,4 kg');
  assert.deepEqual(d.peso.origen, { tipo: 'TOMA', fecha: '2026-11-10' });
  assert.equal(d.edad.valor, 45);
  // El más nuevo: lo cargado hoy, que falta confirmar.
  assert.equal(d.actividad.valor, 'Mucho de pie o caminando');
  assert.equal(d.actividad.origen?.tipo, 'CARGADO_SIN_CONFIRMAR');
  assert.equal(d.sexo.valor, null);
  assert.equal(d.sexo.texto, null);
  // Sin toma, nada medido.
  assert.equal(porDato(loQueNecesitaElCalculo({ toma: null, candidatos })).peso.valor, null);
  // Un declarado del mismo dato que el medido queda al lado (con una pregunta que lo alimente; hoy ninguna, EI-D03).
  const conDeclarado = loQueNecesitaElCalculo({ toma: TOMA, candidatos: [{ dato: 'peso', valor: 70, texto: '70 kg', origen: { tipo: 'RESPONDIDO', fecha: '2026-11-12', formulario: 'X' } }] });
  assert.equal(porDato(conDeclarado).peso.valor, 68.4);
  assert.deepEqual(porDato(conDeclarado).peso.alLado, { texto: '70 kg', origen: { tipo: 'RESPONDIDO', fecha: '2026-11-12', formulario: 'X' } });
  // Lo que cambia el profesional vale, con lo anterior al lado; vaciarlo deja «Sin indicar».
  const cambiado = porDato(loQueNecesitaElCalculo({ toma: TOMA, candidatos, cambiados: { peso: '70,2', sexo: 'FEMALE', edad: '' } }));
  assert.equal(cambiado.peso.valor, 70.2);
  assert.deepEqual(cambiado.peso.origen, { tipo: 'CARGADO_POR_VOS' });
  assert.equal(cambiado.peso.alLado?.texto, '68,4 kg');
  assert.equal(cambiado.sexo.valor, 'Femenino');
  assert.equal(cambiado.edad.valor, null);
  assert.equal(cambiado.edad.alLado?.texto, '45 años');
  // Lo que no se entiende o está fuera de lo posible no se registra.
  assert.equal(valorEscrito('peso', '1.850'), null);
  assert.equal(valorEscrito('talla', '40'), null);
  assert.equal(valorEscrito('edad', '45'), 45);
  // La corrección de la persona al confirmar es su origen: «corregido».
  const corregido = candidatosDeLasRespuestas([{ respuestas: [HABITOS], origen: { tipo: 'CONFIRMADO', fecha: '2026-11-13', formulario: 'Tus hábitos' }, corregidos: ['nivel_de_actividad'] }]);
  assert.equal(corregido[0]?.origen.tipo, 'CORREGIDO');
});

test('TEST-EVI-003 · lo que se registra: un renglón por dato indicado, la toma observada y lo demás informado, con su procedencia', () => {
  const datos = loQueNecesitaElCalculo({ toma: TOMA, candidatos: candidatosDeLasRespuestas([{ respuestas: [HABITOS], origen: { tipo: 'RESPONDIDO', fecha: '2026-11-12', formulario: 'Tus hábitos' } }]), cambiados: { sexo: 'MALE' } });
  const { entries, evidencias } = entradasDelCalculo(datos, dia);
  assert.deepEqual(
    entries.map((e) => [e.concept, e.value, e.unit, e.source]),
    [
      ['Edad', 45, 'años', 'OBSERVED'],
      ['Sexo', 'Masculino', null, 'REPORTED'],
      ['Peso', 68.4, 'kg', 'OBSERVED'],
      ['Talla', 162, 'cm', 'OBSERVED'],
      ['Nivel de actividad', 'Combino sentado y de pie', null, 'REPORTED'],
    ],
  );
  assert.ok(entries.every((e) => e.methodStatement === null));
  assert.equal(evidencias[0], 'Edad: toma de Antropometría del 10/11/2026.');
  assert.equal(evidencias[1], 'Sexo: cargado por el profesional.');
  assert.equal(evidencias[4], 'Nivel de actividad: respondido por la persona en «Tus hábitos» el 12/11/2026.');
  assert.ok(evidencias.every((e) => e.length <= 200));
  // Sin nombres: el registro es del profesional.
  assert.ok(evidencias.every((e) => !/Ana|Sofía/.test(e)));
});

test('TEST-EVI-004 · el punto de unión con el calculador lee lo registrado, también evaluaciones anteriores', () => {
  const datos = datosDelCalculoEnLaEvaluacion({
    occurredAt: '2026-11-21T12:00:00.000Z',
    assessment: {
      entries: [
        { concept: 'Peso', value: 68.4, source: 'OBSERVED' },
        { concept: 'talla ', value: '162', source: 'REPORTED' },
        { concept: 'Edad', value: 300, source: 'OBSERVED' },
        { concept: 'Sexo', value: 'femenino', source: 'REPORTED' },
        { concept: 'Nivel de actividad', value: 'Combino sentado y de pie', source: 'REPORTED' },
      ],
    },
  });
  assert.deepEqual(datos.pesoKg, { valor: 68.4, medido: true });
  assert.deepEqual(datos.tallaCm, { valor: 162, medido: false });
  // Fuera de los topes del calculador: no se usa.
  assert.equal(datos.edadAnios, null);
  assert.equal(datos.sexo, 'FEMALE');
  assert.equal(datos.nivelDeActividad, 'Combino sentado y de pie');
  // Una evaluación sin esos datos no inventa nada.
  const vacia = datosDelCalculoEnLaEvaluacion({ occurredAt: '2026-11-21T12:00:00.000Z', assessment: { entries: [{ concept: 'Comidas por día', value: 4, source: 'REPORTED' }] } });
  assert.deepEqual([vacia.pesoKg, vacia.tallaCm, vacia.edadAnios, vacia.sexo, vacia.nivelDeActividad], [null, null, null, null, null]);
});

test('TEST-EVI-005 · la corrección: «antes → después» solo con el antes en la evaluación; si no, lo que dice hoy', () => {
  const c = correccionesDeLaPersona({
    corregidos: ['nivel_de_actividad', 'nut_agua', 'nut_mate'],
    respuestas: [
      { fieldCode: 'nivel_de_actividad', label: '¿Cómo es tu día, en movimiento?', text: 'Mucho de pie o caminando' },
      { fieldCode: 'nut_agua', label: '¿Cuánta agua tomás en un día?', text: 'Más de 2 litros' },
    ],
    etiquetas: new Map([['nut_mate', '¿Tomás mate?']]),
    registrado: [{ concept: 'Nivel de actividad', value: 'Combino sentado y de pie' }],
  });
  assert.deepEqual(c[0], { fieldCode: 'nivel_de_actividad', pregunta: '¿Cómo es tu día, en movimiento?', ahora: 'Mucho de pie o caminando', antes: 'Combino sentado y de pie' });
  assert.deepEqual(c[1], { fieldCode: 'nut_agua', pregunta: '¿Cuánta agua tomás en un día?', ahora: 'Más de 2 litros', antes: null });
  assert.deepEqual(c[2], { fieldCode: 'nut_mate', pregunta: '¿Tomás mate?', ahora: null, antes: null });
  assert.equal(COPY_EVALUACION_INICIAL.corrigio('Ana', c[0]!.antes!, c[0]!.ahora!), 'Ana corrigió: Combino sentado y de pie → Mucho de pie o caminando');
  // Si lo registrado es igual a lo de hoy, no hay antes que mostrar.
  assert.equal(correccionesDeLaPersona({ corregidos: ['nivel_de_actividad'], respuestas: [{ fieldCode: 'nivel_de_actividad', text: 'X' }], registrado: [{ concept: 'Nivel de actividad', value: 'X' }] })[0]?.antes, null);
});

test('TEST-EVI-006 · los textos ubican sin calificar y sin el vocabulario prohibido; «BE no calcula» ya no se dice', () => {
  const planos: string[] = [];
  const juntar = (v: unknown) => {
    if (typeof v === 'string') planos.push(v);
    else if (typeof v === 'function') planos.push((v as (...a: string[]) => string)('Ana', '12/11', '12:12'));
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(COPY_EVALUACION_INICIAL);
  for (const t of planos) {
    assert.doesNotMatch(t, /\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje|estaci[oó]n)\b/i, t);
    assert.doesNotMatch(t, /\b(mejor|peor|bien|mal)\b/i, t);
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /BE no calcula/i, t);
  }
  assert.equal(COPY_EVALUACION_INICIAL.hoy('12:12'), 'Hoy, 12:12');
  assert.equal(COPY_EVALUACION_INICIAL.origen.CARGADO_SIN_CONFIRMAR('Ana'), 'Cargado por vos · falta que Ana lo confirme');
});
