import type { SeccionDePlantillaV2 } from '@be/domain';
import { ErrorDeApi } from '../http/errores';
import { camposV2PorCodigo, contenidoDePropuesta, contenidoDeRespuestasV2, definicionV2, desenlaceApi, esVersionV2, exigirRespuestasValidas, respuestasV2De } from './lectura-formularios-v2';

/**
 * DL-164 · lo que decide el formato de una versión y cómo se guarda y se lee cada respuesta, sin base:
 * - una versión es V2 solo si declara `format: 2`; la de P0 se traduce con sus límites internos (DL-101);
 * - lo guardado en V1 se lee en V2 por el tipo del valor; lo que se guarda para una versión de P0 vuelve a la forma V1,
 *   para que FRM-05 lo siga sirviendo a las APK instaladas;
 * - el 422 trae un issue por problema y, para la propuesta, no exige los obligatorios.
 */
const P0 = {
  sections: [{ sectionCode: 'antecedentes', title: 'Antecedentes', fields: [
    { fieldCode: 'trn_objetivo_declarado', label: 'Objetivo', dataType: 'TEXT', unit: null, category: 'OBJETIVOS_Y_PREFERENCIAS', helpText: null },
    { fieldCode: 'trn_dias_por_semana', label: 'Días por semana', dataType: 'NUMBER', unit: 'días por semana', category: 'HABITOS_Y_CONTEXTO', helpText: 'De 1 a 7' },
    { fieldCode: 'fuma', label: 'Fuma', dataType: 'BOOLEAN', unit: null, category: 'HABITOS_Y_CONTEXTO', helpText: null },
  ] }],
  numberLimits: { trn_dias_por_semana: { minimum: 1, maximum: 7, integer: true } },
};
const op = (code: string) => ({ code, label: code });
const base = { category: 'HABITOS_Y_CONTEXTO' as const, helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const SECCIONES_V2: SeccionDePlantillaV2[] = [{ sectionCode: 's', title: 'S', intro: null, fields: [
  { ...base, fieldCode: 'nut_jornada', label: 'Jornada', dataType: 'CHOICE', options: [op('oficina'), op('turnos')], otherOptionCode: null },
  { ...base, fieldCode: 'nut_condiciones', label: 'Condiciones', dataType: 'MULTI_CHOICE', options: [op('diabetes'), op('hipertension'), op('ninguna')], maxSelected: null, exclusiveOptionCodes: ['ninguna'], otherOptionCode: null },
  { ...base, fieldCode: 'nut_diabetes_tipo', label: 'Tipo', dataType: 'CHOICE', options: [op('tipo_1'), op('tipo_2')], otherOptionCode: null, showIf: { fieldCode: 'nut_condiciones', anyOf: ['diabetes'] } },
] }];
const V2 = { format: 2, estimatedMinutes: 12, sections: SECCIONES_V2 };
const SOLICITUD = { requestedFieldCodes: ['nut_jornada', 'nut_condiciones', 'nut_diabetes_tipo'], requiredFieldCodes: ['nut_jornada', 'nut_condiciones'] };

describe('DL-164 · el formato de una versión', () => {
  it('es V2 solo con `format: 2`; una de P0 no lo tiene', () => {
    expect(esVersionV2(V2)).toBe(true);
    expect(esVersionV2(P0)).toBe(false);
    expect(esVersionV2({ format: '2', sections: [] })).toBe(false);
    expect(esVersionV2(null)).toBe(false);
  });

  it('la de P0 se traduce campo por campo, con los límites internos en el NUMBER, sin tipos nuevos ni minutos', () => {
    const d = definicionV2(P0);
    expect(d.usesNewTypes).toBe(false);
    expect(d.estimatedMinutes).toBeNull();
    const campos = camposV2PorCodigo(d.sections);
    expect(campos.get('trn_objetivo_declarado')).toMatchObject({ dataType: 'TEXT', multiline: true, maxLength: 2000, showIf: null, requiredByDefault: false });
    expect(campos.get('trn_dias_por_semana')).toMatchObject({ dataType: 'NUMBER', unit: 'días por semana', limits: { minimum: 1, maximum: 7, integer: true } });
    expect(campos.get('fuma')).toMatchObject({ dataType: 'BOOLEAN' });
    expect(d.sections[0]!.intro).toBeNull();
  });

  it('la V2 se sirve tal cual, con sus minutos; minutos que no son un entero positivo salen como null', () => {
    expect(definicionV2(V2)).toEqual({ usesNewTypes: true, estimatedMinutes: 12, sections: SECCIONES_V2 });
    expect(definicionV2({ ...V2, estimatedMinutes: 0 }).estimatedMinutes).toBeNull();
    expect(definicionV2({ ...V2, estimatedMinutes: undefined }).estimatedMinutes).toBeNull();
  });
});

describe('DL-164 · de lo guardado al contrato V2, y del contrato a lo que se guarda', () => {
  it('lo guardado en V1 se lee en V2 por el tipo del valor, siempre SELF_REPORTED', () => {
    const v1 = { answers: [
      { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza', unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' },
      { fieldCode: 'trn_dias_por_semana', value: 3, unit: 'días por semana', profileSourceRef: null, provenance: 'SELF_REPORTED' },
      { fieldCode: 'fuma', value: false, unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' },
    ] };
    expect(respuestasV2De(v1)).toEqual([
      { fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT', text: 'Ganar fuerza' }, provenance: 'SELF_REPORTED' },
      { fieldCode: 'trn_dias_por_semana', answer: { type: 'NUMBER', number: 3, unit: 'días por semana' }, provenance: 'SELF_REPORTED' },
      { fieldCode: 'fuma', answer: { type: 'BOOLEAN', yes: false }, provenance: 'SELF_REPORTED' },
    ]);
    const v2 = { format: 2, answers: [{ fieldCode: 'nut_jornada', answer: { type: 'CHOICE', option: 'turnos', otherText: null }, provenance: 'SELF_REPORTED' }] };
    expect(respuestasV2De(v2)).toEqual([{ fieldCode: 'nut_jornada', answer: { type: 'CHOICE', option: 'turnos', otherText: null }, provenance: 'SELF_REPORTED' }]);
  });

  it('para una versión de P0 se guarda la forma V1 de siempre; para una V2, el formato 2 con la procedencia por campo', () => {
    const camposP0 = camposV2PorCodigo(definicionV2(P0).sections);
    const respuestas = [
      { fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT' as const, text: '  Ganar fuerza ' } },
      { fieldCode: 'trn_dias_por_semana', answer: { type: 'NUMBER' as const, number: 3, unit: 'días por semana' } },
      { fieldCode: 'fuma', answer: { type: 'BOOLEAN' as const, yes: true } },
    ];
    expect(contenidoDeRespuestasV2(camposP0, false, respuestas)).toEqual({ answers: [
      { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza', unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' },
      { fieldCode: 'trn_dias_por_semana', value: 3, unit: 'días por semana', profileSourceRef: null, provenance: 'SELF_REPORTED' },
      { fieldCode: 'fuma', value: true, unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' },
    ] });
    const camposV2 = camposV2PorCodigo(SECCIONES_V2);
    const eleccion = [{ fieldCode: 'nut_condiciones', answer: { type: 'MULTI_CHOICE' as const, options: ['hipertension', 'diabetes'], otherText: null } }];
    // En su forma canónica: las opciones en el orden del campo.
    expect(contenidoDeRespuestasV2(camposV2, true, eleccion)).toEqual({ format: 2, answers: [{ fieldCode: 'nut_condiciones', answer: { type: 'MULTI_CHOICE', options: ['diabetes', 'hipertension'], otherText: null }, provenance: 'SELF_REPORTED' }] });
    expect(contenidoDePropuesta(camposV2, eleccion)).toEqual({ format: 2, answers: [{ fieldCode: 'nut_condiciones', answer: { type: 'MULTI_CHOICE', options: ['diabetes', 'hipertension'], otherText: null } }] });
  });
});

describe('DL-164 · la validación que lanza el 422', () => {
  const jornada = { fieldCode: 'nut_jornada', answer: { type: 'CHOICE' as const, option: 'oficina', otherText: null } };
  const condiciones = { fieldCode: 'nut_condiciones', answer: { type: 'MULTI_CHOICE' as const, options: ['ninguna'], otherText: null } };

  it('completas y coherentes, no lanza', () => {
    expect(() => exigirRespuestasValidas(SECCIONES_V2, SOLICITUD, [jornada, condiciones], { exigirObligatorios: true })).not.toThrow();
  });

  it('un obligatorio sin responder es FORM_ANSWER_REQUIRED al responder, y no es un problema en la propuesta', () => {
    expect(() => exigirRespuestasValidas(SECCIONES_V2, SOLICITUD, [jornada], { exigirObligatorios: false })).not.toThrow();
    let error: unknown;
    try {
      exigirRespuestasValidas(SECCIONES_V2, SOLICITUD, [jornada], { exigirObligatorios: true });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({ status: 422, code: 'FORM_RESPONSE_INVALID', details: { issues: [{ code: 'FORM_ANSWER_REQUIRED', path: 'answers', fieldCode: 'nut_condiciones' }] } });
  });

  it('lo oculto por una condición no se guarda (FORM_ANSWER_NOT_VISIBLE), también en la propuesta; el issue no repite el valor', () => {
    const tipo = { fieldCode: 'nut_diabetes_tipo', answer: { type: 'CHOICE' as const, option: 'tipo_2', otherText: null } };
    let error: unknown;
    try {
      exigirRespuestasValidas(SECCIONES_V2, SOLICITUD, [jornada, condiciones, tipo], { exigirObligatorios: false });
    } catch (e) {
      error = e;
    }
    expect(error).toMatchObject({ status: 422, details: { issues: [{ code: 'FORM_ANSWER_NOT_VISIBLE', path: 'answers[2].answer', fieldCode: 'nut_diabetes_tipo' }] } });
    expect(JSON.stringify((error as ErrorDeApi).details)).not.toContain('tipo_2');
  });
});

describe('DL-164 · el desenlace de una propuesta', () => {
  const fila = (estado: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'RETIRADA') =>
    ({ id: 'p', solicitudId: 's', profesionalId: 'pro', contenido: null, estado, version: 2, cargadaEn: new Date('2026-11-04T10:00:00Z'), resueltaEn: new Date('2026-11-05T10:00:00Z'), procedencia: {}, momentoDeRegistro: new Date('2026-11-04T10:00:00Z') }) as never;

  it('solo la rechazada y la retirada tienen desenlace; la pendiente y la confirmada, null', () => {
    expect(desenlaceApi(fila('RECHAZADA'))).toEqual({ outcome: 'REJECTED', loadedAt: '2026-11-04T10:00:00.000Z', resolvedAt: '2026-11-05T10:00:00.000Z' });
    expect(desenlaceApi(fila('RETIRADA'))?.outcome).toBe('WITHDRAWN');
    expect(desenlaceApi(fila('PENDIENTE'))).toBeNull();
    expect(desenlaceApi(fila('CONFIRMADA'))).toBeNull();
  });
});
