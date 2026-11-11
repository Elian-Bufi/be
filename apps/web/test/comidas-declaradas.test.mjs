/**
 * FI-07 (WP-FORMULARIOS-DE-INICIO; DL-164 D-9) · las comidas habituales que contó la persona, para decidir con ella
 * (`apps/web/src/app/pro/advisees/forms/comidas-declaradas.ts`): cómo se encuentra el campo de comidas, una fila por
 * renglón con el momento, qué come y lo demás en partes, el nombre listo para «Mis habituales», y los textos que ubican
 * sin calificar (las listas de términos prohibidos de información y de nutrición).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/comidas-declaradas.ts');
const { terminosProhibidosDeFormulariosEn, terminosProhibidosEn } = await import('@be/domain');

const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const op = (code, label) => ({ code, label });
const COMIDAS = {
  ...base,
  fieldCode: 'nut_comidas_habituales',
  label: 'Contame las comidas que más se repiten en tu semana',
  dataType: 'LIST',
  itemLabel: 'comida',
  minItems: 3,
  maxItems: 15,
  itemFields: [
    { code: 'momento', label: 'Momento', required: true, dataType: 'CHOICE', options: [op('desayuno', 'Desayuno'), op('almuerzo', 'Almuerzo'), op('merienda', 'Merienda')] },
    { code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 300 },
    { code: 'veces', label: 'Cuántas veces por semana', required: true, dataType: 'CHOICE', options: [op('1', '1 vez'), op('2_3', '2 o 3 veces')] },
    { code: 'porcion', label: 'Cuánto', required: false, dataType: 'TEXT', maxLength: 300 },
    { code: 'seguir', label: '¿Querés seguir comiéndola?', required: false, dataType: 'BOOLEAN' },
  ],
};
const OTRA_LISTA = { ...base, fieldCode: 'trn_deportes', label: 'Otros deportes', dataType: 'LIST', itemLabel: 'deporte', minItems: 0, maxItems: 5, itemFields: [{ code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 80 }] };
const seccion = (...fields) => [{ sectionCode: 's', title: 'S', intro: null, fields }];

test('el campo de comidas · por su código; si la plantilla lo renombró, la primera lista con un momento y un qué; si no hay, null', () => {
  assert.equal(m.campoDeComidas(seccion(OTRA_LISTA, COMIDAS)).fieldCode, 'nut_comidas_habituales');
  const renombrado = { ...COMIDAS, fieldCode: 'nut_semana' };
  assert.equal(m.campoDeComidas(seccion(OTRA_LISTA, renombrado)).fieldCode, 'nut_semana');
  assert.equal(m.campoDeComidas(seccion(OTRA_LISTA)), null, 'una lista sin momento (opción) no es la de comidas');
  assert.equal(m.campoDeComidas(seccion()), null);
});

test('las comidas · una por renglón, con el momento y lo demás en palabras, y el nombre listo para el habitual', () => {
  const filas = m.comidasDeclaradas(COMIDAS, {
    type: 'LIST',
    items: [
      { momento: 'almuerzo', que: 'Milanesa al horno con puré', veces: '2_3', porcion: '2 milanesas y 1 plato de puré', seguir: true },
      { que: 'Mate con facturas', veces: '1' },
    ],
  });
  assert.equal(filas.length, 2);
  assert.deepEqual(filas[0], {
    numero: 1,
    momento: 'Almuerzo',
    que: 'Milanesa al horno con puré',
    detalle: 'Cuántas veces por semana: 2 o 3 veces · Cuánto: 2 milanesas y 1 plato de puré · ¿Querés seguir comiéndola?: Sí',
    texto: 'Almuerzo · Milanesa al horno con puré',
  });
  assert.deepEqual([filas[1].momento, filas[1].que, filas[1].detalle, filas[1].texto], [null, 'Mate con facturas', 'Cuántas veces por semana: 1 vez', 'Mate con facturas'], 'sin momento no se inventa uno');
  for (const f of filas) assert.doesNotMatch(f.detalle, /\b(2_3|almuerzo)\b/, 'etiquetas, nunca códigos');
});

test('las comidas · sin respuesta a ese campo, o con un valor de otro tipo, no hay filas', () => {
  assert.deepEqual(m.comidasDeclaradas(COMIDAS, undefined), []);
  assert.deepEqual(m.comidasDeclaradas(COMIDAS, { type: 'TEXT', text: 'Milanesa' }), []);
});

test('las cuatro decisiones · tal cual, ajustar la porción, mejorar y cambiar, cada una con su ícono; ninguna por omisión', () => {
  assert.deepEqual(
    m.DECISIONES.map((d) => d.clave),
    ['tal-cual', 'porcion', 'mejorar', 'cambiar'],
  );
  assert.deepEqual(
    m.DECISIONES.map((d) => d.icono),
    ['tilde', 'rango', 'repetir', 'distinto'],
  );
  assert.equal(m.DECISIONES.some((d) => 'porOmision' in d || 'elegida' in d), false, 'nada viene elegido (D-9)');
});

test('los textos · ubican sin calificar: pasan las listas de términos prohibidos de información y de nutrición', () => {
  const textos = [...Object.values(m.COPY_COMIDAS_DECLARADAS), ...m.DECISIONES.map((d) => d.texto)];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], `«${t}»`);
    assert.deepEqual(terminosProhibidosEn(t), [], `«${t}»`);
  }
});
