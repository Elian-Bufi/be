/**
 * Información · Solicitudes (WP-ESCRITORIO-AREAS, parte 4): las vistas, el valor de una respuesta, la respuesta que rige
 * por pregunta pedida, «Corregida» y «Antes», y la historia de sus versiones.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 26, del criterio (C-70 a C-74) y de las reglas
 * del legajo que cita el contrato (la respuesta que rige se elige por relación; la original se conserva; lo declarado
 * no es una medición). Datos sintéticos, validados contra los esquemas estrictos de la solicitud, de la respuesta y de
 * la versión del formulario. Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RespuestaDeFormularioSchema, SolicitudDeFormularioSchema, VersionDePlantillaSchema, type RespuestaDeFormulario } from './contratos-formularios';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { COPY_SOLICITUDES, contarLasVistasDeSolicitudes, loDeclarado, respondeCon, solicitudEnLaVista, valorDeclarado, VISTAS_DE_SOLICITUDES } from './solicitudes-de-informacion';

const SALUD = VersionDePlantillaSchema.parse({
  templateId: 'frm-salud',
  templateVersionId: 'frm-salud-v1',
  key: 'FRM-SALUD',
  name: 'Antecedentes de salud declarados',
  purpose: 'Antecedentes de salud, dolor o lesiones y medicación',
  domain: null,
  version: '1',
  status: 'SELECTABLE',
  sections: [
    {
      sectionCode: 'condiciones',
      title: 'Condiciones y antecedentes',
      fields: [
        { fieldCode: 'condiciones_declaradas', label: 'Condiciones de salud declaradas', dataType: 'TEXT', unit: null, category: 'SALUD_Y_SEGURIDAD', helpText: null },
        { fieldCode: 'dolor_o_lesiones', label: 'Dolor o lesiones actuales', dataType: 'TEXT', unit: null, category: 'SALUD_Y_SEGURIDAD', helpText: null },
        { fieldCode: 'medicacion_relevante', label: 'Medicación con relevancia para la práctica', dataType: 'TEXT', unit: null, category: 'SALUD_Y_SEGURIDAD', helpText: null },
      ],
    },
  ],
  supersededByVersionId: null,
  effectiveSince: '2026-09-21T00:00:00.000Z',
  provenanceNote: 'Catálogo sintético de demostración',
});

const HABITOS = VersionDePlantillaSchema.parse({
  ...SALUD,
  templateId: 'frm-habitos',
  templateVersionId: 'frm-habitos-v1',
  key: 'FRM-HABITOS',
  name: 'Hábitos y contexto',
  sections: [
    {
      sectionCode: 'rutina',
      title: 'Rutina y hábitos',
      fields: [
        { fieldCode: 'horas_de_sueno', label: 'Horas de sueño habituales', dataType: 'NUMBER', unit: 'h', category: 'HABITOS_Y_CONTEXTO', helpText: null },
        { fieldCode: 'nivel_de_actividad', label: 'Nivel de actividad física habitual', dataType: 'TEXT', unit: null, category: 'HABITOS_Y_CONTEXTO', helpText: null },
        { fieldCode: 'fuma', label: 'Fuma actualmente', dataType: 'BOOLEAN', unit: null, category: 'HABITOS_Y_CONTEXTO', helpText: null },
      ],
    },
  ],
});

/** Una solicitud del formulario de salud, con las dos preguntas de la maqueta 26 (la primera, requerida). */
function solicitud(cambios: { status?: 'PENDING' | 'RESPONDED'; requestedFieldCodes?: string[]; requiredFieldCodes?: string[] } = {}) {
  return SolicitudDeFormularioSchema.parse({
    formRequestId: 'sol-1',
    professional: { identityId: 'pro-1', displayName: 'Lic. Sofía Paz (sintética)' },
    advisee: { identityId: 'ase-1', displayName: 'Asesorado' },
    relationshipId: 'vin-1',
    purpose: 'Necesito saber si hay lesiones o condiciones que cambien la carga del plan.',
    scope: 'ENTRENAMIENTO',
    templateId: 'frm-salud',
    templateVersionId: 'frm-salud-v1',
    templateName: 'Antecedentes de salud declarados',
    requestedFieldCodes: ['condiciones_declaradas', 'dolor_o_lesiones'],
    requiredFieldCodes: ['condiciones_declaradas'],
    status: 'RESPONDED',
    createdAt: '2026-09-22T21:43:00.000Z',
    ...cambios,
  });
}

const respuestaDe = (fieldCode: string, value: string | number | boolean, unit: string | null = null) => ({ fieldCode, value, unit, profileSourceRef: null, provenance: 'SELF_REPORTED' as const });

/** Una respuesta con sus correcciones, tal como las entrega API-FRM-05. */
function respuesta(cambios: Partial<RespuestaDeFormulario> = {}): RespuestaDeFormulario {
  return RespuestaDeFormularioSchema.parse({
    formResponseId: 'res-1',
    formRequestId: 'sol-1',
    adviseeId: 'ase-1',
    templateVersionId: 'frm-salud-v1',
    original: { answers: [respuestaDe('condiciones_declaradas', 'Asma leve, desde hace años.')] },
    rectifications: [],
    effectiveView: { kind: 'ORIGINAL' },
    version: 'v1',
    submittedAt: '2026-09-22T21:43:30.000Z',
    ...cambios,
  });
}

const CORRECCION = {
  rectificationId: 'rec-1',
  previousRectificationId: null,
  reason: 'Me olvidé de aclarar que uso inhalador antes de entrenar.',
  answers: [respuestaDe('condiciones_declaradas', 'Asma leve. Uso inhalador antes de entrenar.'), respuestaDe('dolor_o_lesiones', 'Molestia en el hombro derecho desde hace dos semanas.')],
  version: 'v2',
  recordedAt: '2026-09-22T21:44:10.000Z',
};

// ─── Las vistas ─────────────────────────────────────────────────────────────────────────────────

test('las vistas: «Sin responder» y «Respondidas» suman «Todas», y cada solicitud está en una sola de las dos', () => {
  const lista = [{ status: 'PENDING' as const }, { status: 'RESPONDED' as const }, { status: 'RESPONDED' as const }];
  assert.deepEqual(contarLasVistasDeSolicitudes(lista), { TODAS: 3, SIN_RESPONDER: 1, RESPONDIDAS: 2 });
  assert.deepEqual(VISTAS_DE_SOLICITUDES, ['TODAS', 'SIN_RESPONDER', 'RESPONDIDAS']);
  for (const s of lista) {
    assert.equal(solicitudEnLaVista(s, 'TODAS'), true);
    assert.equal(solicitudEnLaVista(s, 'SIN_RESPONDER'), s.status === 'PENDING');
    assert.equal(solicitudEnLaVista(s, 'RESPONDIDAS'), s.status === 'RESPONDED');
  }
});

test('las vistas: sin ninguna solicitud, las tres cuentan cero; no hay una cantidad que no sea un número', () => {
  assert.deepEqual(contarLasVistasDeSolicitudes([]), { TODAS: 0, SIN_RESPONDER: 0, RESPONDIDAS: 0 });
});

// ─── El valor de una respuesta ──────────────────────────────────────────────────────────────────

test('el valor declarado: el número con coma y su unidad; «Sí» o «No»; el texto, tal como se escribió', () => {
  assert.equal(valorDeclarado(7.5, 'h'), '7,5 h');
  assert.equal(valorDeclarado(45, null), '45');
  assert.equal(valorDeclarado(true, null), 'Sí');
  assert.equal(valorDeclarado(false, null), 'No');
  assert.equal(valorDeclarado('Gimnasio del barrio', null), 'Gimnasio del barrio');
});

test('con qué se responde una pregunta: el tipo y, si es un número con unidad, su unidad', () => {
  assert.equal(respondeCon({ dataType: 'TEXT', unit: null }), 'Texto');
  assert.equal(respondeCon({ dataType: 'NUMBER', unit: 'min' }), 'Número · min');
  assert.equal(respondeCon({ dataType: 'NUMBER', unit: null }), 'Número');
  assert.equal(respondeCon({ dataType: 'BOOLEAN', unit: null }), 'Sí o no');
});

// ─── Lo que declaró ─────────────────────────────────────────────────────────────────────────────

test('sin respuesta: una fila por pregunta pedida, sin valor, en el orden del formulario; sin historia', () => {
  // Pedidas al revés que en el formulario: las filas van en el orden del formulario.
  const d = loDeclarado(solicitud({ status: 'PENDING', requestedFieldCodes: ['dolor_o_lesiones', 'condiciones_declaradas'] }), null, SALUD);
  assert.equal(d.estado, 'SIN_RESPONDER');
  assert.equal(d.pedidas, 2);
  assert.deepEqual(
    d.filas.map((f) => [f.pregunta, f.requerida, f.valor, f.corregida, f.antes]),
    [
      ['Condiciones de salud declaradas', true, null, false, null],
      ['Dolor o lesiones actuales', false, null, false, null],
    ],
  );
  assert.deepEqual(d.historia, []);
  assert.equal(d.respondioEl, null);
  assert.equal(d.corrigioEl, null);
});

test('la original sola: rige la original; la pregunta que no respondió es una fila «sin valor», no un texto vacío', () => {
  const d = loDeclarado(solicitud(), respuesta(), SALUD);
  assert.equal(d.estado, 'RESPONDIDA');
  assert.deepEqual(
    d.filas.map((f) => [f.codigo, f.valor, f.corregida, f.antes]),
    [
      ['condiciones_declaradas', 'Asma leve, desde hace años.', false, null],
      ['dolor_o_lesiones', null, false, null],
    ],
  );
  assert.equal(d.historia.length, 1);
  assert.deepEqual({ ...d.historia[0], respuestas: d.historia[0]!.respuestas.map((r) => r.valor) }, { tipo: 'ORIGINAL', id: 'res-1', cuando: '2026-09-22T21:43:30.000Z', rige: true, motivo: null, respuestas: ['Asma leve, desde hace años.'], respondidas: 1 });
  assert.equal(d.respondioEl, '2026-09-22T21:43:30.000Z');
  assert.equal(d.corrigioEl, null);
});

test('la maqueta 26: una corrección que cambia una respuesta y agrega otra; rige la corrección, y «antes» dice lo que había', () => {
  const d = loDeclarado(solicitud(), respuesta({ rectifications: [CORRECCION], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-1' }, version: 'v2' }), SALUD);
  assert.equal(d.estado, 'RESPONDIDA');
  assert.deepEqual(d.filas, [
    { codigo: 'condiciones_declaradas', pregunta: 'Condiciones de salud declaradas', requerida: true, valor: 'Asma leve. Uso inhalador antes de entrenar.', corregida: true, antes: { tipo: 'VALOR', texto: 'Asma leve, desde hace años.' } },
    { codigo: 'dolor_o_lesiones', pregunta: 'Dolor o lesiones actuales', requerida: false, valor: 'Molestia en el hombro derecho desde hace dos semanas.', corregida: true, antes: { tipo: 'SIN_RESPONDER' } },
  ]);
  // La historia, de lo más nuevo a lo más viejo: la corrección (que rige), con su motivo; y la original, que se conserva.
  assert.deepEqual(
    d.historia.map((v) => [v.tipo, v.id, v.rige, v.motivo, v.respondidas, v.respuestas.length]),
    [
      ['CORRECCION', 'rec-1', true, 'Me olvidé de aclarar que uso inhalador antes de entrenar.', 2, 2],
      ['ORIGINAL', 'res-1', false, null, 1, 1],
    ],
  );
  assert.equal(d.corrigioEl, '2026-09-22T21:44:10.000Z');
});

test('una corrección que saca una respuesta: la fila queda sin valor, corregida, y «antes» dice el valor que tenía', () => {
  const original = { answers: [respuestaDe('condiciones_declaradas', 'Asma leve.'), respuestaDe('dolor_o_lesiones', 'Dolor de rodilla.')] };
  const correccion = { ...CORRECCION, answers: [respuestaDe('condiciones_declaradas', 'Asma leve.')] };
  const d = loDeclarado(solicitud(), respuesta({ original, rectifications: [correccion], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-1' }, version: 'v2' }), SALUD);
  assert.deepEqual(
    d.filas.map((f) => [f.codigo, f.valor, f.corregida, f.antes]),
    [
      ['condiciones_declaradas', 'Asma leve.', false, null],
      ['dolor_o_lesiones', null, true, { tipo: 'VALOR', texto: 'Dolor de rodilla.' }],
    ],
  );
});

test('dos correcciones que llegan desordenadas: rige la que dice la relación, no la última por fecha; «antes» es el último valor distinto', () => {
  // La segunda de la cadena (rec-2, la que rige) tiene la fecha más vieja, y llega primera en la lista.
  const primera = { ...CORRECCION, rectificationId: 'rec-1', previousRectificationId: null, answers: [respuestaDe('condiciones_declaradas', 'Asma moderada.')], recordedAt: '2026-09-25T10:00:00.000Z' };
  const segunda = { ...CORRECCION, rectificationId: 'rec-2', previousRectificationId: 'rec-1', reason: 'Era leve.', answers: [respuestaDe('condiciones_declaradas', 'Asma leve, desde hace años.')], version: 'v3', recordedAt: '2026-09-24T10:00:00.000Z' };
  const d = loDeclarado(solicitud(), respuesta({ rectifications: [segunda, primera], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-2' }, version: 'v3' }), SALUD);
  // Lo que rige es igual a la original, pero pasó por otro valor en el medio: se dice que se corrigió, y cuál fue el anterior.
  assert.deepEqual(d.filas[0], { codigo: 'condiciones_declaradas', pregunta: 'Condiciones de salud declaradas', requerida: true, valor: 'Asma leve, desde hace años.', corregida: true, antes: { tipo: 'VALOR', texto: 'Asma moderada.' } });
  assert.deepEqual(
    d.historia.map((v) => [v.id, v.rige]),
    [
      ['rec-2', true],
      ['rec-1', false],
      ['res-1', false],
    ],
  );
  assert.equal(d.corrigioEl, '2026-09-24T10:00:00.000Z');
});

test('rige una corrección que no es la última de la cadena: lo que vino después no cuenta para «antes» ni para el valor', () => {
  const primera = { ...CORRECCION, rectificationId: 'rec-1', previousRectificationId: null, answers: [respuestaDe('condiciones_declaradas', 'Asma moderada.')] };
  const segunda = { ...CORRECCION, rectificationId: 'rec-2', previousRectificationId: 'rec-1', answers: [respuestaDe('condiciones_declaradas', 'Otra cosa.')], version: 'v3', recordedAt: '2026-09-26T10:00:00.000Z' };
  const d = loDeclarado(solicitud(), respuesta({ rectifications: [primera, segunda], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-1' }, version: 'v3' }), SALUD);
  assert.equal(d.filas[0]!.valor, 'Asma moderada.');
  assert.deepEqual(d.filas[0]!.antes, { tipo: 'VALOR', texto: 'Asma leve, desde hace años.' });
  assert.deepEqual(d.historia.map((v) => v.rige), [false, true, false]);
});

test('«antes», con dos correcciones: es el último valor distinto del que rige, aunque haya que saltear una versión que dice lo mismo', () => {
  const original = { answers: [respuestaDe('condiciones_declaradas', 'Asma.'), respuestaDe('dolor_o_lesiones', 'Rodilla.')] };
  const primera = { ...CORRECCION, rectificationId: 'rec-1', previousRectificationId: null, answers: [respuestaDe('condiciones_declaradas', 'Asma moderada.'), respuestaDe('dolor_o_lesiones', 'Hombro.')] };
  const segunda = { ...CORRECCION, rectificationId: 'rec-2', previousRectificationId: 'rec-1', answers: [respuestaDe('condiciones_declaradas', 'Asma leve.'), respuestaDe('dolor_o_lesiones', 'Hombro.')], version: 'v3', recordedAt: '2026-09-26T10:00:00.000Z' };
  const d = loDeclarado(solicitud(), respuesta({ original, rectifications: [primera, segunda], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-2' }, version: 'v3' }), SALUD);
  // Cambió dos veces: «antes» es lo que decía la primera corrección, no la original.
  assert.deepEqual([d.filas[0]!.valor, d.filas[0]!.antes], ['Asma leve.', { tipo: 'VALOR', texto: 'Asma moderada.' }]);
  // Cambió una sola vez, en la primera corrección: la versión inmediata anterior dice lo mismo que la que rige, y
  // «antes» es lo que decía la original.
  assert.deepEqual([d.filas[1]!.valor, d.filas[1]!.corregida, d.filas[1]!.antes], ['Hombro.', true, { tipo: 'VALOR', texto: 'Rodilla.' }]);
});

test('la cadena que no se puede resolver: ninguna versión rige y ninguna fila tiene valor; la historia queda completa', () => {
  const d = loDeclarado(solicitud(), respuesta({ rectifications: [CORRECCION], effectiveView: { kind: 'NOT_RESOLVABLE' }, version: 'v2' }), SALUD);
  assert.equal(d.estado, 'SIN_RESOLVER');
  assert.deepEqual(d.filas.map((f) => [f.valor, f.corregida, f.antes]), [[null, false, null], [null, false, null]]);
  assert.deepEqual(d.historia.map((v) => [v.tipo, v.rige]), [['CORRECCION', false], ['ORIGINAL', false]]);
  // La API dice que rige una corrección que no entrega: tampoco se inventa cuál rige.
  const rara = loDeclarado(solicitud(), respuesta({ rectifications: [CORRECCION], effectiveView: { kind: 'RECTIFIED', rectificationId: 'rec-que-no-esta' }, version: 'v2' }), SALUD);
  assert.equal(rara.estado, 'SIN_RESOLVER');
  assert.equal(rara.historia.some((v) => v.rige), false);
});

test('la unidad de un número: la que declaró la persona o, si falta, la de la pregunta; un «Sí o no» se dice con palabras', () => {
  const pedido = solicitud({ requestedFieldCodes: ['horas_de_sueno', 'nivel_de_actividad', 'fuma'], requiredFieldCodes: [] });
  // La APK no manda unidad: sale de la pregunta.
  const sinUnidad = loDeclarado(pedido, respuesta({ original: { answers: [respuestaDe('horas_de_sueno', 7.5), respuestaDe('fuma', false)] } }), HABITOS);
  assert.deepEqual(sinUnidad.filas.map((f) => [f.pregunta, f.valor]), [['Horas de sueño habituales', '7,5 h'], ['Nivel de actividad física habitual', null], ['Fuma actualmente', 'No']]);
  const conUnidad = loDeclarado(pedido, respuesta({ original: { answers: [respuestaDe('horas_de_sueno', 7, 'horas')] } }), HABITOS);
  assert.equal(conUnidad.filas[0]!.valor, '7 horas');
  assert.equal(conUnidad.historia[0]!.respondidas, 1);
});

test('sin el formulario (no se pudo leer): las filas no llevan el texto de la pregunta, y nunca el código en su lugar', () => {
  const d = loDeclarado(solicitud(), respuesta(), null);
  assert.deepEqual(d.filas.map((f) => [f.codigo, f.pregunta, f.valor]), [['condiciones_declaradas', null, 'Asma leve, desde hace años.'], ['dolor_o_lesiones', null, null]]);
  assert.equal(d.historia[0]!.respuestas[0]!.pregunta, null);
  // Tampoco en una solicitud sin responder, ni cuando la cadena no se puede resolver: son filas sin valor, y sin código.
  assert.deepEqual(loDeclarado(solicitud({ status: 'PENDING' }), null, null).filas.map((f) => f.pregunta), [null, null]);
  assert.deepEqual(loDeclarado(solicitud(), respuesta({ rectifications: [CORRECCION], effectiveView: { kind: 'NOT_RESOLVABLE' }, version: 'v2' }), null).filas.map((f) => f.pregunta), [null, null]);
});

test('una pregunta pedida que el formulario no trae va al final, sin texto; una respuesta a algo no pedido no suma a las respondidas', () => {
  const pedido = solicitud({ requestedFieldCodes: ['codigo_que_no_esta', 'condiciones_declaradas'], requiredFieldCodes: [] });
  const d = loDeclarado(pedido, respuesta({ original: { answers: [respuestaDe('condiciones_declaradas', 'Asma leve.'), respuestaDe('medicacion_relevante', 'Ninguna')] } }), SALUD);
  assert.deepEqual(d.filas.map((f) => [f.codigo, f.pregunta]), [['condiciones_declaradas', 'Condiciones de salud declaradas'], ['codigo_que_no_esta', null]]);
  assert.equal(d.historia[0]!.respondidas, 1);
  // Lo que respondió de más se conserva en la historia: no se esconde.
  assert.deepEqual(d.historia[0]!.respuestas.map((r) => r.codigo), ['condiciones_declaradas', 'medicacion_relevante']);
});

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

test('los textos del profesional: ninguno usa un término prohibido de formularios, tampoco los que dependen de una cantidad', () => {
  const textos: string[] = [];
  const juntar = (valor: unknown): void => {
    if (typeof valor === 'string') textos.push(valor);
    else if (typeof valor === 'function') for (const args of [[0, 1], [1, 1], [1, 2], [2, 2], [3, 6]]) juntar((valor as (...a: number[]) => unknown)(...args));
    else if (Array.isArray(valor)) valor.forEach(juntar);
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(juntar);
  };
  juntar(COPY_SOLICITUDES);
  assert.ok(textos.length > 40);
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeFormulariosEn(t).map((p) => `${p} en «${t}»`)), []);
});

test('«Respondió N de las M preguntas» es una cuenta, nunca una proporción; con todas respondidas no dice «N de N»', () => {
  assert.equal(COPY_SOLICITUDES.respondioDe(1, 2), 'Respondió 1 de las 2 preguntas.');
  assert.equal(COPY_SOLICITUDES.respondioDe(2, 2), 'Respondió las 2 preguntas.');
  assert.equal(COPY_SOLICITUDES.respondioDe(1, 1), 'Respondió la pregunta.');
  assert.equal(COPY_SOLICITUDES.preguntas(1), '1 pregunta');
  assert.equal(COPY_SOLICITUDES.preguntas(6), '6 preguntas');
});

test('los textos del pedido que llevan un dato: cuántas preguntas quedaron elegidas, de cuántas, y de qué área es el formulario', () => {
  assert.equal(COPY_SOLICITUDES.elegidas(2, 3), '2 de 3 elegidas.');
  assert.equal(COPY_SOLICITUDES.elegidas(0, 6), '0 de 6 elegidas.');
  assert.equal(COPY_SOLICITUDES.soloDeEstaArea('Entrenamiento'), 'Este formulario es solo de Entrenamiento.');
});
