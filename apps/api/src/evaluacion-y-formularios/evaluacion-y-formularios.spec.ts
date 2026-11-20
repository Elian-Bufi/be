/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · TEST-EVF-005 y TEST-EVF-006, sin base: qué versión es la vigente de una respuesta
 * y cómo se dice un vínculo (la vinculada, su fecha y la más nueva, si hay). Lo demás, contra PostgreSQL, en
 * `test/integration/evaluacion-y-formularios.int-spec.ts`.
 */
import { FormularioVinculadoSchema } from '@be/domain';
import { vigenteDe, vinculoApi } from './evaluacion-y-formularios.service';

const R = '11111111-1111-4111-8111-111111111111';
const C1 = '22222222-2222-4222-8222-222222222222';
const C2 = '33333333-3333-4333-8333-333333333333';
const t = (dia: number) => new Date(Date.UTC(2026, 10, dia, 13));

type Correccion = { id: string; correccionPreviaId: string | null; version: number; momentoDeRegistro: Date };
const respuesta = (rectificaciones: Correccion[]) => ({ id: R, version: 1, momentoDeRegistro: t(10), rectificaciones });

describe('TEST-EVF-005 · la versión vigente de una respuesta', () => {
  it('sin correcciones, la original', () => {
    expect(vigenteDe(respuesta([]))).toEqual({ rectificacionId: null, version: 1, momento: t(10) });
  });
  it('con una cadena de correcciones, la última', () => {
    const r = respuesta([
      { id: C1, correccionPreviaId: null, version: 2, momentoDeRegistro: t(12) },
      { id: C2, correccionPreviaId: C1, version: 3, momentoDeRegistro: t(14) },
    ]);
    expect(vigenteDe(r)).toEqual({ rectificacionId: C2, version: 3, momento: t(14) });
  });
  it('una cadena que se bifurca no se resuelve', () => {
    const r = respuesta([
      { id: C1, correccionPreviaId: null, version: 2, momentoDeRegistro: t(12) },
      { id: C2, correccionPreviaId: null, version: 2, momentoDeRegistro: t(13) },
    ]);
    expect(vigenteDe(r)).toBeNull();
  });
});

describe('TEST-EVF-006 · un vínculo dice la versión vinculada y, si hay, la más nueva; nunca las respuestas', () => {
  const fila = (rectificacion: Correccion | null, cadena: Correccion[]) =>
    ({
      id: '44444444-4444-4444-8444-444444444444',
      vinculadoEn: t(15),
      rectificacion,
      respuesta: {
        ...respuesta(cadena),
        transcripcion: null,
        solicitud: {
          id: '55555555-5555-4555-8555-555555555555',
          alcance: 'NUTRICION',
          proposito: 'Para empezar tu plan',
          momentoDeRegistro: t(9),
          templateVersion: { nombre: 'Cómo comés hoy', version: '2', contenido: {}, plantilla: { clave: 'FRM-NUTRICION-INICIO' } },
        },
      },
    }) as unknown as Parameters<typeof vinculoApi>[0];

  it('vinculada la original y sin correcciones: sin la más nueva', () => {
    const v = vinculoApi(fila(null, []));
    expect(FormularioVinculadoSchema.parse(v)).toEqual(v);
    expect(v).toMatchObject({ linkedVersion: 'v1', answeredAt: t(10).toISOString(), linkedAt: t(15).toISOString(), laterVersion: null, templateName: 'Cómo comés hoy' });
  });
  it('vinculada la original y la persona corrigió después: la más nueva, con su fecha', () => {
    const v = vinculoApi(fila(null, [{ id: C1, correccionPreviaId: null, version: 2, momentoDeRegistro: t(18) }]));
    expect(v.linkedVersion).toBe('v1');
    expect(v.laterVersion).toEqual({ version: 'v2', answeredAt: t(18).toISOString() });
  });
  it('vinculada la corrección vigente: sin la más nueva', () => {
    const c = { id: C1, correccionPreviaId: null, version: 2, momentoDeRegistro: t(12) };
    const v = vinculoApi(fila(c, [c]));
    expect(v).toMatchObject({ linkedVersion: 'v2', answeredAt: t(12).toISOString(), laterVersion: null });
  });
});
