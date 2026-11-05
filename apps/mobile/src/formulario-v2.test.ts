/**
 * La lógica pura de los formularios V2 en la APK (`formulario-v2.ts`), con una plantilla de los nueve tipos y una
 * pregunta condicional. Cada caso define primero lo que manda el contrato (DL-164; 09:1586-1587) y después lo prueba.
 *
 * Uso: cd apps/mobile && npx jest src/formulario-v2.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { CODIGO_DE_PROBLEMA_V2, COPY, COPY_FORMULARIOS, MENSAJE_DE_PROBLEMA_V2, type RespuestaDeCampoV2Entrada, type Resultado, type SeccionDePlantillaV2, type SolicitudPropiaV2 } from '@be/domain';
import {
  armarRespuestas,
  BORRADOR_VACIO,
  borradorDeRespuestas,
  camposQueSeVen,
  claveDeParte,
  claveDeSubcampo,
  cuantasCorrigio,
  erroresDeProblemas,
  gruposDeLaBandeja,
  hayAlgoEscrito,
  horaNormalizada,
  mismoBorrador,
  problemasAntesDeEnviar,
  rechazoV2,
  reducirBorrador,
  respuestasVigentes,
  rotuloDe,
  seccionesEnPalabras,
  TEXTOS_DE_FORMULARIO_V2 as T,
  valorComo,
  type Borrador,
  type EventoDeBorrador,
} from './formulario-v2';

// ─── Una plantilla con los nueve tipos y una condición ─────────────────────────────────────────

const base = { category: 'HABITOS_Y_CONTEXTO' as const, helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const op = (code: string, label: string) => ({ code, label });

const SECCIONES: SeccionDePlantillaV2[] = [
  {
    sectionCode: 'habitos',
    title: 'Hábitos',
    intro: null,
    fields: [
      { ...base, fieldCode: 'notas', label: 'Algo más que quieras contar', dataType: 'TEXT', multiline: true, maxLength: 200 },
      { ...base, fieldCode: 'comidas_por_dia', label: 'Cuántas comidas hacés por día', dataType: 'NUMBER', unit: 'comidas', limits: { minimum: 1, maximum: 10, integer: true } },
      { ...base, fieldCode: 'come_fuera', label: 'Comés fuera de tu casa', dataType: 'BOOLEAN' },
      { ...base, fieldCode: 'donde', label: 'Dónde comés fuera', dataType: 'CHOICE', showIf: { fieldCode: 'come_fuera', anyOf: [true] }, options: [op('trabajo', 'En el trabajo'), op('club', 'En el club'), op('otro', 'Otro')], otherOptionCode: 'otro' },
      { ...base, fieldCode: 'veces_fuera', label: 'Cuántas veces por semana', dataType: 'NUMBER', showIf: { fieldCode: 'come_fuera', anyOf: [true] }, unit: null, limits: null },
      { ...base, fieldCode: 'evita', label: 'Qué evitás', dataType: 'MULTI_CHOICE', options: [op('gluten', 'Gluten'), op('lactosa', 'Lactosa'), op('ninguna', 'Ninguna'), op('otro', 'Otro')], maxSelected: 2, exclusiveOptionCodes: ['ninguna'], otherOptionCode: 'otro' },
    ],
  },
  {
    sectionCode: 'comidas',
    title: 'Tus comidas',
    intro: 'Contanos una semana común.',
    fields: [
      {
        ...base,
        fieldCode: 'comidas',
        label: 'Las comidas de tu semana',
        dataType: 'LIST',
        itemLabel: 'comida',
        itemFields: [
          { code: 'nombre', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 80 },
          { code: 'veces', label: 'Cuántas veces', required: false, dataType: 'NUMBER', unit: 'por semana', limits: null },
          { code: 'momento', label: 'Cuándo', required: false, dataType: 'CHOICE', options: [op('manana', 'A la mañana'), op('noche', 'A la noche')] },
          { code: 'afuera', label: 'Fuera de casa', required: false, dataType: 'BOOLEAN' },
        ],
        minItems: 0,
        maxItems: 3,
      },
      { ...base, fieldCode: 'ejercicios', label: 'Qué podés hacer hoy', dataType: 'MATRIX', rows: [op('sentadilla', 'Sentadilla'), op('flexion', 'Flexión')], columns: [op('solo', 'Solo'), op('ayuda', 'Con ayuda'), op('no', 'Todavía no')] },
      { ...base, fieldCode: 'no_come', label: 'Alimentos que no comés', dataType: 'FOODS', suggestions: ['Leche', 'Huevo'], reasons: [op('mal', 'Me cae mal'), op('gusto', 'No me gusta')], maxItems: 5 },
      { ...base, fieldCode: 'le_gusta', label: 'Alimentos que te gustan', dataType: 'FOODS', suggestions: [], reasons: [], maxItems: 2 },
      { ...base, fieldCode: 'horarios', label: 'Tus horarios', dataType: 'TIMES', parts: [op('levanta', 'Me levanto'), op('acuesta', 'Me acuesto')] },
    ],
  },
];
const CAMPOS = SECCIONES.flatMap((s) => s.fields);
const TODOS = CAMPOS.map((c) => c.fieldCode);
const SOLICITUD = { requestedFieldCodes: TODOS, requiredFieldCodes: ['comidas_por_dia', 'come_fuera', 'donde', 'comidas'] };

const reducir = (eventos: readonly EventoDeBorrador[], desde: Borrador = BORRADOR_VACIO) => eventos.reduce(reducirBorrador, desde);

/** Un borrador completo, con lo escrito tal cual (espacios, coma decimal, un renglón vacío). */
const COMPLETO: Borrador = {
  notas: { tipo: 'TEXT', texto: '  hola  ' },
  comidas_por_dia: { tipo: 'NUMBER', texto: '4' },
  come_fuera: { tipo: 'BOOLEAN', eleccion: 'SI' },
  donde: { tipo: 'CHOICE', opcion: 'otro', otro: ' en lo de mi vieja ' },
  veces_fuera: { tipo: 'NUMBER', texto: '2' },
  evita: { tipo: 'MULTI_CHOICE', opciones: ['gluten', 'otro'], otro: '' },
  comidas: {
    tipo: 'LIST',
    renglones: [
      { id: 1, valores: { nombre: 'Desayuno', veces: '3', momento: 'manana', afuera: 'NO' } },
      { id: 2, valores: {} },
      { id: 3, valores: { nombre: 'Cena', veces: '2,5' } },
    ],
  },
  ejercicios: { tipo: 'MATRIX', celdas: { sentadilla: 'solo' } },
  no_come: { tipo: 'FOODS', alimentos: [{ nombre: 'Leche', motivo: 'mal' }, { nombre: ' Miel ', motivo: null }] },
  le_gusta: { tipo: 'FOODS', alimentos: [{ nombre: 'Pan', motivo: 'mal' }] },
  horarios: { tipo: 'TIMES', horas: { levanta: '7:30', acuesta: '' } },
};

// ─── El borrador ────────────────────────────────────────────────────────────────────────────────

describe('el borrador guarda lo tocado tal cual, y nada viene elegido', () => {
  test('texto y número quedan como texto; el Sí o no tiene tres estados', () => {
    const b = reducir([
      { tipo: 'escribir', fieldCode: 'notas', como: 'TEXT', texto: 'ho' },
      { tipo: 'escribir', fieldCode: 'comidas_por_dia', como: 'NUMBER', texto: '4,5' },
      { tipo: 'elegir-si-o-no', fieldCode: 'come_fuera', eleccion: 'SI' },
    ]);
    expect(b.notas).toEqual({ tipo: 'TEXT', texto: 'ho' });
    expect(b.comidas_por_dia).toEqual({ tipo: 'NUMBER', texto: '4,5' });
    expect(valorComo(b, 'come_fuera', 'BOOLEAN').eleccion).toBe('SI');
    expect(valorComo(reducir([{ tipo: 'elegir-si-o-no', fieldCode: 'come_fuera', eleccion: '' }], b), 'come_fuera', 'BOOLEAN').eleccion).toBe('');
    // Lo que no se tocó es el valor vacío de su tipo, y lo guardado con otro tipo no se mezcla.
    expect(valorComo(b, 'donde', 'CHOICE')).toEqual({ tipo: 'CHOICE', opcion: null, otro: '' });
    expect(valorComo(b, 'notas', 'LIST')).toEqual({ tipo: 'LIST', renglones: [] });
    expect(hayAlgoEscrito(BORRADOR_VACIO)).toBe(false);
    expect(hayAlgoEscrito(b)).toBe(true);
    expect(hayAlgoEscrito({ notas: { tipo: 'TEXT', texto: '   ' } })).toBe(false);
  });

  test('una opción: elegir, soltar y el texto de «Otro»', () => {
    const b = reducir([
      { tipo: 'elegir-opcion', fieldCode: 'donde', opcion: 'otro' },
      { tipo: 'escribir-otro', fieldCode: 'donde', texto: 'en el club' },
    ]);
    expect(b.donde).toEqual({ tipo: 'CHOICE', opcion: 'otro', otro: 'en el club' });
    expect(valorComo(reducir([{ tipo: 'elegir-opcion', fieldCode: 'donde', opcion: null }], b), 'donde', 'CHOICE').opcion).toBeNull();
  });

  test('varias opciones: la exclusiva va sola, el tope frena y volver a tocar saca', () => {
    const ev = (opcion: string): EventoDeBorrador => ({ tipo: 'alternar-opcion', fieldCode: 'evita', opcion, exclusivas: ['ninguna'], maximo: 2 });
    const dos = reducir([ev('gluten'), ev('lactosa')]);
    expect(valorComo(dos, 'evita', 'MULTI_CHOICE').opciones).toEqual(['gluten', 'lactosa']);
    // Con el tope alcanzado, una tercera no entra.
    expect(valorComo(reducir([ev('otro')], dos), 'evita', 'MULTI_CHOICE').opciones).toEqual(['gluten', 'lactosa']);
    // «Ninguna» saca las demás; sumar una común después saca a «Ninguna».
    const ninguna = reducir([ev('ninguna')], dos);
    expect(valorComo(ninguna, 'evita', 'MULTI_CHOICE').opciones).toEqual(['ninguna']);
    expect(valorComo(reducir([ev('gluten')], ninguna), 'evita', 'MULTI_CHOICE').opciones).toEqual(['gluten']);
    expect(valorComo(reducir([ev('gluten')], dos), 'evita', 'MULTI_CHOICE').opciones).toEqual(['lactosa']);
    expect(valorComo(reducir([ev('otro'), { tipo: 'escribir-otro', fieldCode: 'evita', texto: 'azúcar' }]), 'evita', 'MULTI_CHOICE')).toEqual({ tipo: 'MULTI_CHOICE', opciones: ['otro'], otro: 'azúcar' });
  });

  test('la lista: sumar con ids que no se repiten, editar un renglón, quitar y el tope', () => {
    const sumar: EventoDeBorrador = { tipo: 'sumar-renglon', fieldCode: 'comidas', maximo: 3 };
    const b = reducir([sumar, sumar, { tipo: 'editar-subcampo', fieldCode: 'comidas', id: 2, code: 'nombre', valor: 'Cena' }, { tipo: 'quitar-renglon', fieldCode: 'comidas', id: 1 }, sumar]);
    expect(valorComo(b, 'comidas', 'LIST').renglones).toEqual([
      { id: 2, valores: { nombre: 'Cena' } },
      { id: 3, valores: {} },
    ]);
    const lleno = reducir([sumar, sumar, sumar, sumar]);
    expect(valorComo(lleno, 'comidas', 'LIST').renglones).toHaveLength(3);
  });

  test('la tabla: una columna por fila, y tocar de nuevo la suelta', () => {
    const b = reducir([
      { tipo: 'elegir-celda', fieldCode: 'ejercicios', fila: 'sentadilla', columna: 'solo' },
      { tipo: 'elegir-celda', fieldCode: 'ejercicios', fila: 'flexion', columna: 'ayuda' },
      { tipo: 'elegir-celda', fieldCode: 'ejercicios', fila: 'sentadilla', columna: null },
    ]);
    expect(valorComo(b, 'ejercicios', 'MATRIX').celdas).toEqual({ flexion: 'ayuda' });
  });

  test('los alimentos: los sugeridos se alternan, los escritos no se repiten, cada uno lleva su motivo', () => {
    const b = reducir([
      { tipo: 'alternar-alimento', fieldCode: 'no_come', nombre: 'Leche', maximo: 5 },
      { tipo: 'sumar-alimento', fieldCode: 'no_come', nombre: '  miel ', maximo: 5 },
      { tipo: 'sumar-alimento', fieldCode: 'no_come', nombre: 'MIEL', maximo: 5 },
      { tipo: 'sumar-alimento', fieldCode: 'no_come', nombre: '   ', maximo: 5 },
      { tipo: 'motivo-de-alimento', fieldCode: 'no_come', nombre: 'leche', motivo: 'mal' },
    ]);
    expect(valorComo(b, 'no_come', 'FOODS').alimentos).toEqual([
      { nombre: 'Leche', motivo: 'mal' },
      { nombre: 'miel', motivo: null },
    ]);
    expect(valorComo(reducir([{ tipo: 'alternar-alimento', fieldCode: 'no_come', nombre: 'Leche', maximo: 5 }], b), 'no_come', 'FOODS').alimentos).toEqual([{ nombre: 'miel', motivo: null }]);
    expect(valorComo(reducir([{ tipo: 'quitar-alimento', fieldCode: 'no_come', nombre: 'Miel' }], b), 'no_come', 'FOODS').alimentos).toEqual([{ nombre: 'Leche', motivo: 'mal' }]);
    const tope = reducir([{ tipo: 'sumar-alimento', fieldCode: 'no_come', nombre: 'Pan', maximo: 2 }], b);
    expect(valorComo(tope, 'no_come', 'FOODS').alimentos).toHaveLength(2);
  });

  test('cargar reemplaza todo y limpiar deja el borrador vacío; dos borradores iguales no son «algo sin guardar»', () => {
    const cargado = reducir([{ tipo: 'cargar', valores: COMPLETO }]);
    expect(cargado).toBe(COMPLETO);
    expect(mismoBorrador(cargado, { ...COMPLETO })).toBe(true);
    expect(mismoBorrador(reducir([{ tipo: 'escribir-hora', fieldCode: 'horarios', parte: 'acuesta', texto: '23:00' }], cargado), COMPLETO)).toBe(false);
    expect(reducir([{ tipo: 'limpiar' }], cargado)).toEqual({});
  });
});

// ─── Del borrador a las respuestas ──────────────────────────────────────────────────────────────

describe('al enviar, lo vacío se omite y lo escrito se interpreta recién ahí', () => {
  test('las respuestas van en el orden del formulario, sin espacios de más ni renglones vacíos', () => {
    const { respuestas, errores, idsDeRenglones } = armarRespuestas(SECCIONES, SOLICITUD, COMPLETO);
    expect(errores).toEqual({});
    expect(respuestas.map((r) => r.fieldCode)).toEqual(['notas', 'comidas_por_dia', 'come_fuera', 'donde', 'veces_fuera', 'evita', 'comidas', 'ejercicios', 'no_come', 'le_gusta', 'horarios']);
    const porCampo = Object.fromEntries(respuestas.map((r) => [r.fieldCode, r.answer]));
    expect(porCampo.notas).toEqual({ type: 'TEXT', text: 'hola' });
    expect(porCampo.comidas_por_dia).toEqual({ type: 'NUMBER', number: 4, unit: 'comidas' });
    expect(porCampo.come_fuera).toEqual({ type: 'BOOLEAN', yes: true });
    expect(porCampo.donde).toEqual({ type: 'CHOICE', option: 'otro', otherText: 'en lo de mi vieja' });
    // «Otro» sin texto viaja sin texto, no vacío.
    expect(porCampo.evita).toEqual({ type: 'MULTI_CHOICE', options: ['gluten', 'otro'], otherText: null });
    expect(porCampo.comidas).toEqual({
      type: 'LIST',
      items: [
        { nombre: 'Desayuno', veces: 3, momento: 'manana', afuera: false },
        { nombre: 'Cena', veces: 2.5 },
      ],
    });
    // El renglón vacío (id 2) no viajó: la posición 1 de `items` es el renglón 3.
    expect(idsDeRenglones).toEqual({ comidas: [1, 3] });
    expect(porCampo.ejercicios).toEqual({ type: 'MATRIX', cells: [{ row: 'sentadilla', column: 'solo' }] });
    expect(porCampo.no_come).toEqual({ type: 'FOODS', foods: [{ name: 'Leche', reason: 'mal' }, { name: 'Miel', reason: null }] });
    // Un campo sin motivos no manda motivo, aunque el borrador traiga uno de otra plantilla.
    expect(porCampo.le_gusta).toEqual({ type: 'FOODS', foods: [{ name: 'Pan', reason: null }] });
    expect(porCampo.horarios).toEqual({ type: 'TIMES', times: [{ part: 'levanta', time: '07:30' }] });
    // Y el dominio no le encuentra ningún problema: lo que arma la APK es lo que acepta la API.
    expect(problemasAntesDeEnviar(SECCIONES, SOLICITUD, armarRespuestas(SECCIONES, SOLICITUD, COMPLETO))).toBeNull();
  });

  test('un campo sin tocar no viaja; un Sí o no sin elegir tampoco; solo lo pedido', () => {
    const { respuestas } = armarRespuestas(SECCIONES, { ...SOLICITUD, requestedFieldCodes: ['notas', 'come_fuera'] }, { ...COMPLETO, come_fuera: { tipo: 'BOOLEAN', eleccion: '' } });
    expect(respuestas.map((r) => r.fieldCode)).toEqual(['notas']);
    expect(armarRespuestas(SECCIONES, SOLICITUD, BORRADOR_VACIO).respuestas).toEqual([]);
  });

  test('lo oculto por una condición no viaja, y su error tampoco frena (DL-164 D-2)', () => {
    const cerrado: Borrador = { ...COMPLETO, come_fuera: { tipo: 'BOOLEAN', eleccion: 'NO' }, veces_fuera: { tipo: 'NUMBER', texto: 'muchas' } };
    const { respuestas, errores } = armarRespuestas(SECCIONES, SOLICITUD, cerrado);
    expect(respuestas.map((r) => r.fieldCode)).not.toContain('donde');
    expect(respuestas.map((r) => r.fieldCode)).not.toContain('veces_fuera');
    expect(errores).toEqual({});
    expect(camposQueSeVen(SECCIONES, SOLICITUD, cerrado).has('donde')).toBe(false);
    expect(camposQueSeVen(SECCIONES, SOLICITUD, COMPLETO).has('donde')).toBe(true);
    // «donde» es requerida, pero oculta no se exige.
    expect(problemasAntesDeEnviar(SECCIONES, SOLICITUD, armarRespuestas(SECCIONES, SOLICITUD, cerrado))).toBeNull();
  });

  test('lo escrito que no se entiende se marca en su campo, renglón o parte, y no viaja', () => {
    const b: Borrador = {
      ...COMPLETO,
      comidas_por_dia: { tipo: 'NUMBER', texto: '4.000' },
      comidas: { tipo: 'LIST', renglones: [{ id: 7, valores: { nombre: 'Cena', veces: 'tres' } }] },
      horarios: { tipo: 'TIMES', horas: { levanta: '25:00', acuesta: '7h15' } },
    };
    const armadas = armarRespuestas(SECCIONES, SOLICITUD, b);
    expect(Object.keys(armadas.errores).sort()).toEqual(['comidas/7/veces', 'comidas_por_dia', 'horarios/levanta'].sort());
    expect(armadas.errores[claveDeSubcampo('comidas', 7, 'veces')]).toMatch(/número/);
    expect(armadas.errores[claveDeParte('horarios', 'levanta')]).toBe(T.horaIlegible);
    const porCampo = Object.fromEntries(armadas.respuestas.map((r) => [r.fieldCode, r.answer]));
    expect(porCampo.comidas_por_dia).toBeUndefined();
    expect(porCampo.comidas).toEqual({ type: 'LIST', items: [{ nombre: 'Cena' }] });
    expect(porCampo.horarios).toEqual({ type: 'TIMES', times: [{ part: 'acuesta', time: '07:15' }] });
    const antes = problemasAntesDeEnviar(SECCIONES, SOLICITUD, armadas);
    expect(antes?.titulo).toBe(T.datoIlegible);
    expect(antes?.errores).toEqual(armadas.errores);
  });

  test('las horas, como las escribe la gente', () => {
    expect(horaNormalizada('7:30')).toBe('07:30');
    expect(horaNormalizada(' 07.30 ')).toBe('07:30');
    expect(horaNormalizada('0730')).toBe('07:30');
    expect(horaNormalizada('23h59')).toBe('23:59');
    expect(horaNormalizada('24:00')).toBeNull();
    expect(horaNormalizada('7:60')).toBeNull();
    expect(horaNormalizada('mañana')).toBeNull();
    expect(horaNormalizada('7')).toBeNull();
  });
});

// ─── Lo que falta y lo que la API rechaza, por campo ────────────────────────────────────────────

describe('la validación del dominio, antes de enviar y al volver de la API', () => {
  test('los requeridos que se ven y faltan se marcan, con el texto de P0 si no hay otra cosa', () => {
    const armadas = armarRespuestas(SECCIONES, SOLICITUD, { notas: { tipo: 'TEXT', texto: 'hola' } });
    const antes = problemasAntesDeEnviar(SECCIONES, SOLICITUD, armadas);
    expect(antes?.titulo).toBe(COPY_FORMULARIOS.faltaRequerido);
    // «donde» depende de «come_fuera», que no se respondió: oculta, no se exige.
    expect(Object.keys(antes?.errores ?? {}).sort()).toEqual(['come_fuera', 'comidas', 'comidas_por_dia']);
    expect(antes?.errores.comidas).toBe(MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.REQUIRED]);
    expect(antes?.lineas).toContain(`Las comidas de tu semana: ${MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.REQUIRED]}`);
  });

  test('con un valor fuera de lo que admite, el resumen cuenta los campos y cada uno dice lo suyo', () => {
    const armadas = armarRespuestas(SECCIONES, SOLICITUD, { comidas_por_dia: { tipo: 'NUMBER', texto: '50' } });
    const antes = problemasAntesDeEnviar(SECCIONES, SOLICITUD, armadas);
    expect(antes?.titulo).toBe(COPY.resumenDeErrores(3));
    expect(antes?.errores.comidas_por_dia).toBe(MENSAJE_DE_PROBLEMA_V2.FORM_ANSWER_ABOVE_MAXIMUM);
  });

  test('un issue de la API sobre un renglón vuelve a ese renglón, por su id', () => {
    const { errores, lineas } = erroresDeProblemas(
      [
        { code: CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID, path: 'answers[5].answer.items[1].veces', fieldCode: 'comidas' },
        { code: CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED, path: 'answers[5].answer.items[0].nombre', fieldCode: 'comidas' },
        { code: CODIGO_DE_PROBLEMA_V2.TOO_MANY, path: 'answers[6].answer', fieldCode: 'evita' },
      ],
      CAMPOS,
      { comidas: [1, 3] },
    );
    expect(errores).toEqual({
      [claveDeSubcampo('comidas', 3, 'veces')]: MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID],
      [claveDeSubcampo('comidas', 1, 'nombre')]: MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED],
      evita: MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.TOO_MANY],
    });
    // Una línea por campo, con su rótulo, nunca el código.
    expect(lineas).toEqual([`Las comidas de tu semana: ${MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID]}`, `Qué evitás: ${MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.TOO_MANY]}`]);
  });

  test('el rechazo de la API: por campo, dato no aceptado, lo cargado que cambió o apareció, y lo que decide otro', () => {
    const fallo = (codigo: string, issues: unknown[] = []): Resultado<unknown> => ({ ok: false, tipo: 'API', status: 422, codigo, issues }) as unknown as Resultado<unknown>;
    const respuesta = { desdePropuesta: false, esCorreccion: false };
    const confirmacion = { desdePropuesta: true, esCorreccion: false };
    const porCampo = rechazoV2(fallo('FORM_RESPONSE_INVALID', [{ code: 'FORM_ANSWER_EXCLUSIVE_OPTION', path: 'answers[0].answer', fieldCode: 'evita' }, { sinForma: true }]), CAMPOS, { idsDeRenglones: {} }, respuesta);
    expect(porCampo).toEqual({ tipo: 'por-campo', errores: { evita: MENSAJE_DE_PROBLEMA_V2.FORM_ANSWER_EXCLUSIVE_OPTION }, lineas: [`Qué evitás: ${MENSAJE_DE_PROBLEMA_V2.FORM_ANSWER_EXCLUSIVE_OPTION}`], resumen: COPY.resumenDeErrores(1) });
    expect(rechazoV2(fallo('FORM_RESPONSE_INVALID'), CAMPOS, { idsDeRenglones: {} }, respuesta)).toEqual({ tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada });
    // Al confirmar lo cargado: eso cambió desde que se vio.
    expect(rechazoV2(fallo('VERSION_CONFLICT'), CAMPOS, { idsDeRenglones: {} }, confirmacion)).toEqual({ tipo: 'version-vieja', mensaje: T.propuestaCambio, acciones: ['cargar', 'volver'] });
    // Al responder sin haber visto una propuesta: el profesional cargó algo mientras la persona completaba (API-FRI-04).
    // El envío queda suspendido con las mismas salidas; volver a leer trae la propuesta y abre la revisión.
    expect(rechazoV2(fallo('VERSION_CONFLICT'), CAMPOS, { idsDeRenglones: {} }, respuesta)).toEqual({ tipo: 'version-vieja', mensaje: T.aparecioPropuesta, acciones: ['cargar', 'volver'] });
    // El 409 de una corrección (API-FRI-05) no es de una propuesta: lo interpreta `desenlaceDeEnvio` con su texto.
    expect(rechazoV2(fallo('VERSION_CONFLICT'), CAMPOS, { idsDeRenglones: {} }, { desdePropuesta: false, esCorreccion: true })).toBeNull();
    expect(rechazoV2(fallo('FORM_REQUEST_NOT_RESPONDABLE'), CAMPOS, { idsDeRenglones: {} }, confirmacion)).toBeNull();
    expect(rechazoV2({ ok: false, tipo: 'RED' }, CAMPOS, { idsDeRenglones: {} }, confirmacion)).toBeNull();
  });
});

// ─── Lo cargado por el profesional: precargar, leer en palabras, contar lo corregido ────────────

describe('lo que cargó el profesional se lee en palabras y se puede corregir tocando', () => {
  const PROPUESTAS: RespuestaDeCampoV2Entrada[] = [
    { fieldCode: 'comidas_por_dia', answer: { type: 'NUMBER', number: 4, unit: 'comidas' } },
    { fieldCode: 'come_fuera', answer: { type: 'BOOLEAN', yes: true } },
    { fieldCode: 'donde', answer: { type: 'CHOICE', option: 'club', otherText: null } },
    { fieldCode: 'evita', answer: { type: 'MULTI_CHOICE', options: ['lactosa'], otherText: null } },
    { fieldCode: 'comidas', answer: { type: 'LIST', items: [{ nombre: 'Desayuno', veces: 3.5, afuera: true }] } },
    { fieldCode: 'ejercicios', answer: { type: 'MATRIX', cells: [{ row: 'flexion', column: 'ayuda' }] } },
    { fieldCode: 'no_come', answer: { type: 'FOODS', foods: [{ name: 'Leche', reason: 'mal' }] } },
    { fieldCode: 'horarios', answer: { type: 'TIMES', times: [{ part: 'levanta', time: '06:45' }] } },
  ];

  test('precargar y volver a armar da lo mismo que se cargó', () => {
    const b = borradorDeRespuestas(SECCIONES, PROPUESTAS);
    expect(valorComo(b, 'comidas_por_dia', 'NUMBER').texto).toBe('4');
    expect(valorComo(b, 'comidas', 'LIST').renglones).toEqual([{ id: 1, valores: { nombre: 'Desayuno', veces: '3,5', afuera: 'SI' } }]);
    expect(armarRespuestas(SECCIONES, SOLICITUD, b).respuestas).toEqual(PROPUESTAS);
    expect(cuantasCorrigio(SECCIONES, PROPUESTAS, armarRespuestas(SECCIONES, SOLICITUD, b).respuestas)).toBe(0);
    // Un campo cargado con un tipo que no es el de la plantilla no se precarga.
    expect(borradorDeRespuestas(SECCIONES, [{ fieldCode: 'notas', answer: { type: 'NUMBER', number: 1, unit: null } }])).toEqual({});
  });

  test('cada corrección cuenta: un valor cambiado, uno quitado, uno sumado', () => {
    const b = reducir(
      [
        { tipo: 'elegir-celda', fieldCode: 'ejercicios', fila: 'flexion', columna: 'solo' },
        { tipo: 'quitar-alimento', fieldCode: 'no_come', nombre: 'Leche' },
        { tipo: 'escribir', fieldCode: 'notas', como: 'TEXT', texto: 'Nada más' },
      ],
      borradorDeRespuestas(SECCIONES, PROPUESTAS),
    );
    expect(cuantasCorrigio(SECCIONES, PROPUESTAS, armarRespuestas(SECCIONES, SOLICITUD, b).respuestas)).toBe(3);
  });

  test('en palabras: por sección, con las etiquetas, lo oculto afuera y lo no respondido como tal', () => {
    const partes = seccionesEnPalabras(SECCIONES, SOLICITUD, PROPUESTAS);
    expect(partes.map((s) => s.titulo)).toEqual(['Hábitos', 'Tus comidas']);
    const habitos = Object.fromEntries(partes[0]!.lineas.map((l) => [l.etiqueta, l.valor]));
    expect(habitos).toEqual({
      'Algo más que quieras contar': null,
      'Cuántas comidas hacés por día': '4 comidas',
      'Comés fuera de tu casa': 'Sí',
      'Dónde comés fuera': 'En el club',
      'Cuántas veces por semana': null,
      'Qué evitás': 'Lactosa',
    });
    const comidas = Object.fromEntries(partes[1]!.lineas.map((l) => [l.etiqueta, l.valor]));
    // El número de un renglón se lee con la unidad de su subcampo («por semana»): lo decide `resumenDeValor` del dominio.
    expect(comidas['Las comidas de tu semana']).toBe('Desayuno · 3,5 por semana · Sí');
    expect(comidas['Qué podés hacer hoy']).toBe('Flexión: Con ayuda');
    expect(comidas['Alimentos que no comés']).toBe('Leche (Me cae mal)');
    expect(comidas['Tus horarios']).toBe('Me levanto: 06:45');
    // Con «no come fuera», la condicional desaparece de la lectura.
    const cerrada = seccionesEnPalabras(SECCIONES, SOLICITUD, [{ fieldCode: 'come_fuera', answer: { type: 'BOOLEAN', yes: false } }]);
    expect(cerrada[0]!.lineas.map((l) => l.fieldCode)).not.toContain('donde');
    // Solo lo pedido.
    expect(seccionesEnPalabras(SECCIONES, { ...SOLICITUD, requestedFieldCodes: ['notas'] }, PROPUESTAS)).toEqual([{ sectionCode: 'habitos', titulo: 'Hábitos', lineas: [{ fieldCode: 'notas', etiqueta: 'Algo más que quieras contar', valor: null }] }]);
  });

  test('para corregir se parte de lo que vale hoy: la corrección vigente, o la original', () => {
    // Lo guardado viene con su procedencia, siempre declarada por la persona (09 §22.7).
    const guardadas = PROPUESTAS.map((r) => ({ ...r, provenance: 'SELF_REPORTED' as const }));
    const original = { answers: guardadas };
    const corregida = { rectificationId: 'r1', previousRectificationId: null, reason: 'me confundí', answers: [guardadas[0]!], version: 'v2', recordedAt: '2026-11-04T10:00:00Z' };
    expect(respuestasVigentes({ original, rectifications: [corregida], effectiveView: { kind: 'RECTIFIED', rectificationId: 'r1' } })).toEqual([guardadas[0]]);
    expect(respuestasVigentes({ original, rectifications: [corregida], effectiveView: { kind: 'ORIGINAL' } })).toEqual(guardadas);
    expect(respuestasVigentes({ original, rectifications: [], effectiveView: { kind: 'NOT_RESOLVABLE' } })).toEqual(guardadas);
  });
});

// ─── La bandeja ─────────────────────────────────────────────────────────────────────────────────

describe('la bandeja agrupa por lo que falta hacer', () => {
  const actor = { identityId: 'p1', displayName: 'Sofía Paz' };
  const solicitud = (formRequestId: string, extra: Partial<SolicitudPropiaV2>): SolicitudPropiaV2 => ({
    formRequestId,
    professional: actor,
    advisee: { identityId: 'a1', displayName: 'Diego Sosa' },
    relationshipId: 'v1',
    purpose: 'Planificar',
    scope: 'NUTRICION',
    templateId: 't1',
    templateVersionId: 'tv1',
    templateName: 'Cómo comés hoy',
    requestedFieldCodes: ['notas'],
    requiredFieldCodes: [],
    status: 'PENDING',
    createdAt: '2026-11-04T10:00:00Z',
    respondable: true,
    usesNewTypes: true,
    estimatedMinutes: 8,
    pendingProposal: null,
    ...extra,
  });
  const propuesta = { proposalId: 'pp1', professional: actor, loadedAt: '2026-11-04T11:00:00Z', version: 'pv1' };

  test('para confirmar, para responder y respondidos, en el orden en que llegaron', () => {
    const lista = [solicitud('s1', {}), solicitud('s2', { status: 'RESPONDED' }), solicitud('s3', { pendingProposal: propuesta }), solicitud('s4', { respondable: false })];
    const g = gruposDeLaBandeja(lista);
    expect(g.paraConfirmar.map((s) => s.formRequestId)).toEqual(['s3']);
    expect(g.paraResponder.map((s) => s.formRequestId)).toEqual(['s1', 's4']);
    expect(g.respondidos.map((s) => s.formRequestId)).toEqual(['s2']);
    expect(gruposDeLaBandeja([])).toEqual({ paraConfirmar: [], paraResponder: [], respondidos: [] });
  });

  test('el rótulo de una pregunta dice «Opcional» solo si no es requerida', () => {
    expect(rotuloDe({ fieldCode: 'notas', label: 'Notas' }, SOLICITUD)).toBe('Notas (Opcional)');
    expect(rotuloDe({ fieldCode: 'comidas', label: 'Comidas' }, SOLICITUD)).toBe('Comidas');
  });
});
