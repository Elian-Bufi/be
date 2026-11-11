import { citasResueltas, validarCitas } from './citas-de-respuestas';

/**
 * PF-02 · DL-102 · reglas de `validarCitas` que la integración no puede forzar: la lectura única por respuesta (dos citas
 * de la misma respuesta quedan en la misma versión aunque una rectificación se confirme en el medio) y el orden de los
 * controles. Sin base: una transacción falsa que cuenta las lecturas y cambia la cadena entre llamadas.
 * DL-164: una respuesta guardada en V2 (FRM-ENTRENAMIENTO v2) se cita igual que una de P0, y se lee en palabras.
 */
const PRO = '11111111-1111-4111-8111-111111111111';
const ASE = '22222222-2222-4222-8222-222222222222';
// Con letras, así `toUpperCase()` cambia el identificador y la prueba ejercita la normalización.
const R = 'a3c9e1f0-7b2d-4e8a-9f6c-1d2b3c4d5e6f';
const RECT_1 = '44444444-4444-4444-8444-444444444444';
const RECT_2 = '55555555-5555-4555-8555-555555555555';

const respuesta = (rectificaciones: { id: string; correccionPreviaId: string | null; answers: string[] }[]) => ({
  id: R,
  asesoradoId: ASE,
  contenido: { answers: [{ fieldCode: 'trn_dias_por_semana', value: 3 }, { fieldCode: 'trn_objetivo_declarado', value: 'x' }] },
  solicitud: { profesionalId: PRO, alcance: 'ENTRENAMIENTO' },
  rectificaciones: rectificaciones.map((r) => ({ id: r.id, correccionPreviaId: r.correccionPreviaId, contenido: { answers: r.answers.map((fieldCode) => ({ fieldCode, value: 1 })) } })),
});

/** Primera lectura: una rectificación. Si se volviera a leer, ya habría dos (una rectificación concurrente). */
function txQueCambia() {
  let lecturas = 0;
  const tx = {
    respuestaDeFormulario: {
      findUnique: async () => {
        lecturas++;
        const una = [{ id: RECT_1, correccionPreviaId: null, answers: ['trn_dias_por_semana', 'trn_objetivo_declarado'] }];
        return respuesta(lecturas === 1 ? una : [...una, { id: RECT_2, correccionPreviaId: RECT_1, answers: ['trn_dias_por_semana', 'trn_objetivo_declarado'] }]);
      },
    },
  };
  return { tx: tx as never, lecturas: () => lecturas };
}

describe('DL-102 · validarCitas', () => {
  it('lee cada respuesta una sola vez: dos citas de la misma respuesta quedan en la misma rectificación', async () => {
    expect(R.toUpperCase()).not.toBe(R);
    const { tx, lecturas } = txQueCambia();
    const citas = await validarCitas(tx, [
      { formResponseId: R, fieldCode: 'trn_dias_por_semana' },
      { formResponseId: R.toUpperCase(), fieldCode: 'trn_objetivo_declarado' },
    ], { profesionalId: PRO, asesoradoId: ASE });
    expect(lecturas()).toBe(1);
    expect(citas.map((c) => c.rectificacionId)).toEqual([RECT_1, RECT_1]);
    expect(citas.map((c) => c.respuestaId)).toEqual([R, R]);
  });

  it('una repetición con otras mayúsculas se detecta por el id canónico, en el índice de la segunda', async () => {
    const { tx } = txQueCambia();
    await expect(
      validarCitas(tx, [
        { formResponseId: R, fieldCode: 'trn_dias_por_semana' },
        { formResponseId: R.toUpperCase(), fieldCode: 'trn_dias_por_semana' },
      ], { profesionalId: PRO, asesoradoId: ASE }),
    ).rejects.toMatchObject({ status: 422, details: { issues: [{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: 'formResponseReferences[1]' }] } });
  });

  it('un id que no es UUID se rechaza sin leer la base; una respuesta ajena, con el mismo error que una inexistente', async () => {
    let lecturas = 0;
    const tx = { respuestaDeFormulario: { findUnique: async () => { lecturas++; return null; } } } as never;
    const errorDe = async (formResponseId: string) => validarCitas(tx, [{ formResponseId, fieldCode: 'trn_dias_por_semana' }], { profesionalId: PRO, asesoradoId: ASE }).catch((e: unknown) => e);
    const malformado = await errorDe('no-es-un-uuid');
    expect(lecturas).toBe(0);
    const inexistente = await errorDe(R);
    expect(lecturas).toBe(1);
    const ajena = await validarCitas(
      { respuestaDeFormulario: { findUnique: async () => ({ ...respuesta([]), asesoradoId: PRO }) } } as never,
      [{ formResponseId: R, fieldCode: 'trn_dias_por_semana' }],
      { profesionalId: PRO, asesoradoId: ASE },
    ).catch((e: unknown) => e);
    expect(JSON.stringify(malformado)).toEqual(JSON.stringify(inexistente));
    expect(JSON.stringify(ajena)).toEqual(JSON.stringify(inexistente));
  });
});

describe('DL-164 · una respuesta V2 se cita igual que una de P0', () => {
  const EVALUACION = '66666666-6666-4666-8666-666666666666';
  const SOLICITUD = '77777777-7777-4777-8777-777777777777';
  const op = (code: string, label: string) => ({ code, label });
  const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
  const VERSION_V2 = {
    format: 2,
    estimatedMinutes: 8,
    sections: [{ sectionCode: 'antes', title: 'Antes de entrenar', intro: null, fields: [
      { ...base, fieldCode: 'trn_dias_por_semana', label: 'Días por semana', dataType: 'NUMBER', unit: 'días por semana', limits: { minimum: 1, maximum: 7, integer: true } },
      { ...base, fieldCode: 'trn_experiencia', label: 'Experiencia', dataType: 'CHOICE', options: [op('nada', 'Nunca entrené'), op('algo', 'Entrené alguna vez')], otherOptionCode: null },
      { ...base, fieldCode: 'trn_otro_deporte', label: 'Otro deporte', dataType: 'LIST', itemLabel: 'deporte', minItems: 0, maxItems: 3,
        itemFields: [{ code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 60 }, { code: 'veces', label: 'Veces por semana', required: false, dataType: 'NUMBER', unit: null, limits: null }] },
    ] }],
  };
  const respuestaV2 = {
    id: R,
    solicitudId: SOLICITUD,
    asesoradoId: ASE,
    version: 1,
    momentoDeRegistro: new Date('2026-11-04T12:00:00Z'),
    contenido: { format: 2, answers: [
      { fieldCode: 'trn_dias_por_semana', answer: { type: 'NUMBER', number: 3, unit: null }, provenance: 'SELF_REPORTED' },
      { fieldCode: 'trn_experiencia', answer: { type: 'CHOICE', option: 'algo', otherText: null }, provenance: 'SELF_REPORTED' },
      { fieldCode: 'trn_otro_deporte', answer: { type: 'LIST', items: [{ cual: 'Fútbol', veces: 2 }] }, provenance: 'SELF_REPORTED' },
    ] },
    solicitud: { profesionalId: PRO, alcance: 'ENTRENAMIENTO' },
    templateVersion: { contenido: VERSION_V2 },
    rectificaciones: [],
  };
  const cita = (orden: number, codigoDeCampo: string) => ({ id: `cita-${orden}`, evaluacionId: EVALUACION, respuestaId: R, rectificacionId: null, codigoDeCampo, orden, respuesta: respuestaV2, rectificacion: null });

  it('validarCitas acepta el campo de una respuesta V2 por su fieldCode, en su versión', async () => {
    const tx = { respuestaDeFormulario: { findUnique: async () => respuestaV2 } } as never;
    const citas = await validarCitas(tx, [{ formResponseId: R, fieldCode: 'trn_experiencia', expectedVersion: 'v1' }], { profesionalId: PRO, asesoradoId: ASE });
    expect(citas).toEqual([{ respuestaId: R, rectificacionId: null, codigoDeCampo: 'trn_experiencia' }]);
    await expect(validarCitas(tx, [{ formResponseId: R, fieldCode: 'trn_no_existe' }], { profesionalId: PRO, asesoradoId: ASE })).rejects.toMatchObject({ status: 422 });
  });

  it('citasResueltas lee el número con la unidad de la plantilla, y una opción o una lista en palabras, con las etiquetas', async () => {
    const tx = { citaDeRespuestaEnEvaluacionDeEntrenamiento: { findMany: async () => [cita(1, 'trn_dias_por_semana'), cita(2, 'trn_experiencia'), cita(3, 'trn_otro_deporte')] } } as never;
    const resueltas = (await citasResueltas(tx, [EVALUACION])).get(EVALUACION)!;
    expect(resueltas.map((c) => [c.label, c.value, c.unit, c.citedVersion, c.laterVersionExists])).toEqual([
      ['Días por semana', 3, 'días por semana', 'v1', false],
      ['Experiencia', 'Entrené alguna vez', null, 'v1', false],
      ['Otro deporte', 'Fútbol · 2', null, 'v1', false],
    ]);
    expect(resueltas.every((c) => c.provenance === 'SELF_REPORTED' && c.formRequestId === SOLICITUD)).toBe(true);
  });
});
