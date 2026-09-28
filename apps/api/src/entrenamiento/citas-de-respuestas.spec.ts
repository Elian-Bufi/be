import { validarCitas } from './citas-de-respuestas';

/**
 * PF-02 · DL-102 · reglas de `validarCitas` que la integración no puede forzar: la lectura única por respuesta (dos citas
 * de la misma respuesta quedan en la misma versión aunque una rectificación se confirme en el medio) y el orden de los
 * controles. Sin base: una transacción falsa que cuenta las lecturas y cambia la cadena entre llamadas.
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
