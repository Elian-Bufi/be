import { CrearRecetaRequestSchema } from '@be/domain';
import { join } from 'node:path';
import { esBaseLocal } from './comando-del-recetario';
import { leerSemillaDelRecetario } from './semilla-del-recetario';

const RAIZ = join(__dirname, '..', '..', '..', '..');

describe('DL-191 · TEST-REC-006 y 007: la semilla del Recetario de BE', () => {
  it('TEST-REC-006 · son las 150 recetas, R001 a R151 sin R150, cada una con un nombre distinto y la forma de una receta de BE', () => {
    const recetas = leerSemillaDelRecetario(RAIZ);
    expect(recetas).toHaveLength(150);
    expect(recetas.map((r) => r.codigo)).toEqual(Array.from({ length: 151 }, (_, i) => `R${String(i + 1).padStart(3, '0')}`).filter((c) => c !== 'R150'));
    expect(new Set(recetas.map((r) => r.nombre)).size).toBe(150);
    for (const r of recetas) {
      // La misma forma que acepta API-REC-01: lo que entra al recetario lo puede copiar y citar cualquiera.
      const cuerpo = {
        name: r.nombre,
        description: r.descripcion,
        servings: r.porciones,
        steps: r.pasos,
        ingredients: r.ingredientes.map((i) => ({ catalogItemId: i.catalogItemId, catalogItemVersionId: i.catalogItemVersionId, quantity: { value: i.cantidad.valor, unit: i.cantidad.unidad }, preparationState: i.estado })),
      };
      expect(CrearRecetaRequestSchema.safeParse(cuerpo).success).toBe(true);
    }
  });

  it('TEST-REC-006b · no se repite ningún nombre (ni sin tildes ni en mayúsculas) ni ningún archivo de foto (código y nombre)', () => {
    const recetas = leerSemillaDelRecetario(RAIZ);
    const clave = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    expect(new Set(recetas.map((r) => clave(r.nombre))).size).toBe(recetas.length);
    expect(new Set(recetas.map((r) => `${r.codigo}-${clave(r.nombre)}`)).size).toBe(recetas.length);
    expect(new Set(recetas.map((r) => r.codigo)).size).toBe(recetas.length);
  });

  it('TEST-REC-007 · el comando solo escribe sin más en una base local; otra pide la autorización explícita', () => {
    expect(esBaseLocal('postgresql://be:clave@localhost:55442/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@127.0.0.1:5432/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@[::1]:5432/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@dpg-sintetico.oregon-postgres.render.com/be')).toBe(false);
    expect(esBaseLocal('no es una url')).toBe(false);
  });
});
