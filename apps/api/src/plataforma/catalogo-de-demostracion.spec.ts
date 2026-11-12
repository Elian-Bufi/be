import { ejercicioVisible } from '../entrenamiento/catalogo.service';
import { alimentoVisible } from '../nutricion/catalogo.service';
import { ofreceDemostracion, sinLoDeDemostracion } from './catalogo-de-demostracion';

/**
 * TEST-UF-013 (UF-09 de WP-USO-FINAL; DL-169; UF-D10), en la unidad de la API: el filtro de cada catálogo según el
 * ambiente. Que en producción el buscador no ofrezca lo sembrado y que un plan nuevo no lo acepte lo prueba la integración
 * (test/integration/catalogo-de-demostracion.int-spec.ts) con PostgreSQL de verdad.
 */
describe('TEST-UF-013 · el catálogo de demostración según el ambiente de la API', () => {
  it('lo ofrecen test y desarrollo; producción, no', () => {
    expect(ofreceDemostracion({ appEnv: 'test' })).toBe(true);
    expect(ofreceDemostracion({ appEnv: 'development' })).toBe(true);
    expect(ofreceDemostracion({ appEnv: 'production' })).toBe(false);
  });

  it('donde no se ofrece, el filtro deja afuera lo sembrado como demostración; donde se ofrece, no deja nada afuera', () => {
    const produccion = sinLoDeDemostracion(false);
    expect(produccion.sql).toBe('e."procedencia" <> ?::"ProcedenciaDeCatalogo"');
    expect(produccion.values).toEqual(['BE_SYNTHETIC_SEED']);
    const prueba = sinLoDeDemostracion(true);
    expect(prueba.sql).toBe('TRUE');
    expect(prueba.values).toEqual([]);
  });

  it('los dos catálogos lo aplican en lo que ve cada actor, que es lo que usan los buscadores y cada validación', () => {
    for (const visible of [alimentoVisible('00000000-0000-4000-8000-000000000001', false), ejercicioVisible(['00000000-0000-4000-8000-000000000001'], false)]) {
      expect(visible.sql.endsWith(' AND e."procedencia" <> ?::"ProcedenciaDeCatalogo"')).toBe(true);
      expect(visible.values).toContain('BE_SYNTHETIC_SEED');
    }
    for (const visible of [alimentoVisible('00000000-0000-4000-8000-000000000001', true), ejercicioVisible(['00000000-0000-4000-8000-000000000001'], true)]) {
      expect(visible.sql.endsWith(' AND TRUE')).toBe(true);
      expect(visible.values).not.toContain('BE_SYNTHETIC_SEED');
    }
  });
});
