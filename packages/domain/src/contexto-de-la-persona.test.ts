/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179) · TEST-CTX-001 a TEST-CTX-009, la parte pura del panel:
 * - «Lo importante» por área: seguridad primero, solo lo respondido, cada dato con su fuente, el PAR-Q+ pregunta por
 *   pregunta, la medicación con su nota, los hábitos compartidos como fuente aparte y la conducta alimentaria con cuidado.
 * - El cambio entre tomas: solo entre comparables, con el «%» y su base, sin «mejor» ni «peor».
 * - El buscador, sin tildes. Los contratos estrictos. El vocabulario: nada de «asesorado», «cumplimiento», «adherencia»,
 *   «racha» ni «puntaje».
 *
 * Mutaciones verificadas, cada una pone su prueba en rojo: mostrar «2 de 7» en el PAR-Q+; citar la conducta alimentaria;
 * comparar dos tomas con otro protocolo; tomar el formulario de otra área antes que el del panel; buscar con tildes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarEnFormularios, cambioDelCuerpoEnPalabras, cantidadDeRespuestas, COPY_CONTEXTO, loImportante, metricasDelCuerpo, renglonesDelFormulario, type ValorComparable } from './contexto-de-la-persona';
import { CuerpoDelContextoResponseSchema, entraEnElCuerpoCompartido, RespuestasDelContextoResponseSchema, type FormularioEnElContexto, type RespuestaEnElContexto } from './contratos-contexto-de-la-persona';
import { CrearEvaluacionRequestSchema, EvaluacionNutricionalSchema } from './contratos-nutricion';
import type { ValorDeRespuestaV2 } from './contratos-formularios-v2';

const fecha = (iso: string) => iso.slice(0, 10);
const hora = (iso: string) => iso.slice(11, 16);
const formato = { fecha, hora };

const r = (fieldCode: string, answer: ValorDeRespuestaV2, text: string, category: RespuestaEnElContexto['category'] = 'SALUD_Y_SEGURIDAD'): RespuestaEnElContexto => ({
  fieldCode,
  label: fieldCode,
  category,
  dataType: answer.type,
  answer,
  text,
});
const si = (code: string, text = 'Sí') => r(code, { type: 'BOOLEAN', yes: true }, text);
const no = (code: string) => r(code, { type: 'BOOLEAN', yes: false }, 'No');
const opcion = (code: string, option: string, text: string, category?: RespuestaEnElContexto['category']) => r(code, { type: 'CHOICE', option, otherText: null }, text, category);
const texto = (code: string, t: string, category?: RespuestaEnElContexto['category']) => r(code, { type: 'TEXT', text: t }, t, category);

const formulario = (scope: FormularioEnElContexto['scope'], respuestas: RespuestaEnElContexto[], extra: Partial<FormularioEnElContexto> = {}): FormularioEnElContexto => ({
  formRequestId: '00000000-0000-4000-8000-000000000001',
  formResponseId: extra.formResponseId ?? `00000000-0000-4000-8000-00000000000${scope === 'NUTRICION' ? 2 : 3}`,
  scope,
  templateKey: scope === 'NUTRICION' ? 'FRM-NUTRICION-INICIO' : 'FRM-ENTRENAMIENTO',
  templateName: scope === 'NUTRICION' ? 'Cómo comés hoy' : 'Antes de entrenar',
  templateVersion: '3',
  purpose: 'Planificar',
  requestedAt: '2026-11-08T10:00:00.000Z',
  answeredAt: '2026-11-10T10:00:00.000Z',
  version: 'v1',
  rectified: false,
  transcribedConfirmedAt: null,
  sections: [{ sectionCode: 's', title: 'Sección', answers: respuestas }],
  ...extra,
});

const PARQ_NO = ['trn_salud_corazon', 'trn_salud_dolor_de_pecho', 'trn_salud_mareos', 'trn_salud_cronica', 'medicacion_relevante', 'trn_salud_huesos', 'trn_salud_supervision'].map(no);

test('TEST-CTX-001 · Entrenamiento: el PAR-Q+ todo «no» es un renglón; con un «sí», cada «sí» con su detalle y la nota de la medicación', () => {
  const todoNo = loImportante('ENTRENAMIENTO', { formularios: [formulario('ENTRENAMIENTO', PARQ_NO)] }, formato);
  assert.equal(todoNo[0]!.clave, 'salud');
  assert.equal(todoNo[0]!.datos.length, 1);
  assert.match(todoNo[0]!.datos[0]!.respuesta, /Las 7 preguntas generales del PAR-Q\+: todas «no»/);
  // Las siete se citan juntas.
  assert.equal(todoNo[0]!.datos[0]!.citas.length, 7);

  const conMedicacion = PARQ_NO.map((x) => (x.fieldCode === 'medicacion_relevante' ? si('medicacion_relevante') : x));
  const grupos = loImportante('ENTRENAMIENTO', { formularios: [formulario('ENTRENAMIENTO', [...conMedicacion, texto('trn_medicacion_cual', 'Atenolol 50 mg')])] }, formato);
  const salud = grupos.find((g) => g.clave === 'salud')!;
  assert.equal(salud.datos.length, 1);
  const med = salud.datos[0]!;
  assert.equal(med.respuesta, 'Sí · Atenolol 50 mg');
  assert.match(med.nota ?? '', /esfuerzo percibido/);
  // Se cita la pregunta y su detalle; nunca un conteo de «sí».
  assert.deepEqual(med.citas.map((c) => c.fieldCode), ['medicacion_relevante', 'trn_medicacion_cual']);
  assert.ok(!JSON.stringify(grupos).includes('de 7'));
});

test('TEST-CTX-002 · el orden es seguridad primero, y un grupo sin respuestas no aparece', () => {
  const f = formulario('ENTRENAMIENTO', [...PARQ_NO, opcion('trn_objetivo_principal', 'ganar_fuerza', 'Ganar fuerza', 'OBJETIVOS_Y_PREFERENCIAS'), si('dolor_o_lesiones'), texto('trn_zonas', 'Rodillas')]);
  const grupos = loImportante('ENTRENAMIENTO', { formularios: [f] }, formato);
  assert.deepEqual(grupos.map((g) => g.clave), ['salud', 'dolor', 'busca']);
  // Cada dato con su fuente: el formulario y la fecha de lo vigente.
  const fuente = grupos[1]!.datos[0]!.fuente;
  assert.deepEqual(fuente, { tipo: 'FORMULARIO', nombre: 'Antes de entrenar', fecha: '2026-11-10T10:00:00.000Z', corregida: false, cargadaConElProfesional: false });
});

test('TEST-CTX-003 · Nutrición: alergias primero, con su detalle; lo que no aporta («No», «Ninguna») no se muestra en las preguntas que lo piden', () => {
  const f = formulario('NUTRICION', [
    si('nut_alergias'),
    texto('nut_alergias_cuales', 'Maní: urticaria'),
    r('nut_intolerancias', { type: 'MULTI_CHOICE', options: ['ninguna'], otherText: null }, 'Ninguna'),
    r('nut_suplementos', { type: 'MULTI_CHOICE', options: ['no_tomo'], otherText: null }, 'No tomo'),
    opcion('nut_quien_cocina', 'otra_persona', 'Otra persona', 'HABITOS_Y_CONTEXTO'),
  ]);
  const grupos = loImportante('NUTRICION', { formularios: [f] }, formato);
  assert.equal(grupos[0]!.clave, 'alergias');
  assert.equal(grupos[0]!.datos[0]!.respuesta, 'Sí · Maní: urticaria');
  // «Ninguna» en intolerancias se muestra (es un dato de seguridad); «No tomo» suplementos, no.
  assert.equal(grupos[0]!.datos[1]!.respuesta, 'Ninguna');
  // El detalle se presenta con su rótulo cuando no se entiende solo.
  const conIndicacion = loImportante('NUTRICION', { formularios: [formulario('NUTRICION', [r('condiciones_declaradas', { type: 'MULTI_CHOICE', options: ['presion_alta'], otherText: null }, 'Presión alta'), opcion('nut_condiciones_indicacion', 'me_la_dijo', 'Sí, me la dijo')])] }, formato);
  assert.equal(conIndicacion[0]!.datos[0]!.respuesta, 'Presión alta · indicación del médico: Sí, me la dijo');
  assert.ok(!grupos.some((g) => g.datos.some((d) => d.clave === 'nut_suplementos')));
  assert.equal(grupos.at(-1)!.clave, 'logistica');
});

test('TEST-CTX-004 · la conducta alimentaria va con cuidado: en palabras propias, sensible y sin citar (CTX-D09)', () => {
  const f = formulario('NUTRICION', [opcion('nut_tca', 'si', 'Sí')]);
  const dato = loImportante('NUTRICION', { formularios: [f] }, formato).flatMap((g) => g.datos).find((d) => d.clave === 'nut_tca')!;
  assert.equal(dato.pregunta, 'Conducta alimentaria');
  assert.equal(dato.sensible, true);
  assert.deepEqual(dato.citas, []);
  assert.match(dato.respuesta, /sin números a la vista/);
  assert.ok(!/anorexia|bulimia|trastorno/i.test(dato.pregunta + dato.respuesta));
  // «No» no se muestra; y en «Formularios» tampoco se cita.
  assert.equal(loImportante('NUTRICION', { formularios: [formulario('NUTRICION', [opcion('nut_tca', 'no', 'No')])] }, formato).length, 0);
  const renglon = renglonesDelFormulario(f)[0]!.renglones[0]!;
  assert.equal(renglon.cita, null);
  assert.equal(renglon.sensible, true);
});

test('TEST-CTX-005 · primero el formulario del área del panel; los hábitos compartidos, como «Mis hábitos»; lo de otra área no se cita en la evaluación', () => {
  const deNutricion = formulario('NUTRICION', [r('horas_de_sueno', { type: 'NUMBER', number: 6, unit: 'h' }, '6 h', 'HABITOS_Y_CONTEXTO')], { answeredAt: '2026-11-12T10:00:00.000Z' });
  const deEntrenamiento = formulario('ENTRENAMIENTO', [r('horas_de_sueno', { type: 'NUMBER', number: 8, unit: 'h' }, '8 h', 'HABITOS_Y_CONTEXTO')]);
  const sueno = loImportante('ENTRENAMIENTO', { formularios: [deNutricion, deEntrenamiento] }, formato).flatMap((g) => g.datos).find((d) => d.clave === 'horas_de_sueno')!;
  assert.equal(sueno.respuesta, '8 h');
  assert.equal(sueno.citas[0]!.area, 'ENTRENAMIENTO');

  const habitos = { answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER' as const, number: 7.5, unit: 'h' }, provenance: 'SELF_REPORTED' as const }], recordedAt: '2026-11-12T09:00:00.000Z' };
  const desdeHabitos = loImportante('ENTRENAMIENTO', { formularios: [], habitos }, formato).flatMap((g) => g.datos).find((d) => d.clave === 'horas_de_sueno')!;
  assert.equal(desdeHabitos.fuente.tipo, 'HABITOS');
  assert.equal(desdeHabitos.fuente.nombre, 'Mis hábitos');
  assert.deepEqual(desdeHabitos.citas, []);
});

test('TEST-CTX-006 · Antropometría: las condiciones de la última toma, y lo de salud de los formularios propios no se pierde', () => {
  const cuerpo = {
    access: 'OWN_AREA' as const,
    latest: {
      evaluationId: 'e1',
      occurredAt: '2026-11-10T08:30:00.000Z',
      registeredAt: '2026-11-10T09:00:00.000Z',
      author: { identityId: 'a', displayName: 'Lic. Ana Ríos' },
      protocols: ['ISAK perfil restringido'],
      origins: ['DIRECT_CAPTURE' as const],
      context: 'En ayunas',
    },
    previous: null,
    metrics: [],
  };
  const f = formulario('ANTROPOMETRIA', [texto('marcapasos', 'Tengo marcapasos')]);
  const grupos = loImportante('ANTROPOMETRIA', { formularios: [f], cuerpo }, formato);
  assert.deepEqual(grupos.map((g) => g.clave), ['toma', 'otros-salud']);
  assert.deepEqual(grupos[0]!.datos.map((d) => d.pregunta), ['Fecha y hora', 'Protocolo', 'Procedencia', 'La tomó', 'Contexto']);
  assert.equal(grupos[0]!.datos[0]!.respuesta, '2026-11-10, 08:30');
  assert.equal(grupos[1]!.datos[0]!.respuesta, 'Tengo marcapasos');
});

test('TEST-CTX-007 · el cambio entre tomas: solo entre comparables, con el % y su base; sin comparables, por qué', () => {
  const v = (value: number, extra: Partial<ValorComparable> = {}): ValorComparable => ({ value, unit: 'kg', dataClass: 'MEASURED', methodName: null, protocolName: 'ISAK', protocolVersionId: 'p1', methodVersionId: null, ...extra });
  const m = metricasDelCuerpo(
    new Map([
      ['peso', v(78.8)],
      ['perimetro-cintura', v(84, { unit: 'cm' })],
      ['masa-grasa-faulkner', v(14, { protocolVersionId: 'p2' })],
    ]),
    new Map([
      ['peso', v(80)],
      ['perimetro-cintura', v(0, { unit: 'cm' })],
      ['masa-grasa-faulkner', v(15)],
    ]),
  );
  // El orden del catálogo: el peso antes que los perímetros y que los resultados.
  assert.deepEqual(m.map((x) => x.metricCode), ['peso', 'perimetro-cintura', 'masa-grasa-faulkner']);
  assert.deepEqual(m[0]!.change, { value: -1.2, unit: 'kg', percent: -1.5, base: 80 });
  assert.equal(cambioDelCuerpoEnPalabras(m[0]!.change!, (x) => String(x).replace('.', ',')), '−1,2 kg (−1,5 % de 80 kg)');
  // Base cero: sin «%».
  assert.equal(m[1]!.change!.percent, null);
  // Otro protocolo: no se compara, y se dice por qué.
  assert.equal(m[2]!.change, null);
  assert.deepEqual(m[2]!.notComparableBecause, ['PROTOCOL']);
  // Lo compartido: el peso y la composición en kilos; nunca pliegues ni perímetros.
  assert.equal(entraEnElCuerpoCompartido('peso', 'kg'), true);
  assert.equal(entraEnElCuerpoCompartido('masa-grasa-faulkner', 'kg'), true);
  assert.equal(entraEnElCuerpoCompartido('masa-grasa-faulkner', '%'), false);
  assert.equal(entraEnElCuerpoCompartido('pliegue-triceps', 'mm'), false);
  assert.equal(entraEnElCuerpoCompartido('perimetro-cintura', 'cm'), false);
});

test('TEST-CTX-008 · el buscador busca en la pregunta y en la respuesta, sin tildes ni mayúsculas', () => {
  const f = formulario('NUTRICION', [{ ...texto('nut_no_negociable', 'El asado del domingo', 'OBJETIVOS_Y_PREFERENCIAS'), label: '¿Qué no estás dispuesto a cambiar?' }, si('nut_alergias')]);
  assert.equal(cantidadDeRespuestas(buscarEnFormularios([f], 'ASADO')), 1);
  assert.equal(cantidadDeRespuestas(buscarEnFormularios([f], 'que no estas')), 1);
  assert.equal(cantidadDeRespuestas(buscarEnFormularios([f], 'nada que ver')), 0);
  assert.equal(cantidadDeRespuestas(buscarEnFormularios([f], '  ')), 2);
});

test('TEST-CTX-009 · los contratos son estrictos, la cita de Nutrición es opcional, y los textos no dicen lo prohibido', () => {
  assert.equal(RespuestasDelContextoResponseSchema.safeParse({ data: { scopes: ['NUTRICION'], forms: [formulario('NUTRICION', [])] } }).success, true);
  assert.equal(RespuestasDelContextoResponseSchema.safeParse({ data: { scopes: [], forms: [] } }).success, false);
  assert.equal(CuerpoDelContextoResponseSchema.safeParse({ data: { access: 'OWN_AREA', latest: null, previous: null, metrics: [], extra: 1 } }).success, false);
  const base = { occurredAt: '2026-11-10T10:00:00.000Z', context: null, assessment: { entries: [{ concept: 'Peso', value: 80, source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: null };
  assert.equal(CrearEvaluacionRequestSchema.safeParse(base).success, true);
  assert.equal(CrearEvaluacionRequestSchema.safeParse({ ...base, formResponseReferences: [{ formResponseId: '00000000-0000-4000-8000-000000000002', fieldCode: 'nut_alergias', expectedVersion: 'v1' }] }).success, true);
  assert.equal(CrearEvaluacionRequestSchema.safeParse({ ...base, formResponseReferences: Array.from({ length: 21 }, (_, i) => ({ formResponseId: '00000000-0000-4000-8000-000000000002', fieldCode: `c${i}` })) }).success, false);
  assert.ok('formResponseReferences' in EvaluacionNutricionalSchema.shape);
  const textos = JSON.stringify(COPY_CONTEXTO, (_k, v) => (typeof v === 'function' ? v('X') : v)).toLowerCase();
  for (const prohibida of ['asesorad', 'cumplimiento', 'adherencia', 'racha', 'puntaje', 'riesgo']) assert.ok(!textos.includes(prohibida), `COPY_CONTEXTO dice «${prohibida}»`);
});
