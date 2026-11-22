import { CrearRecetaRequestSchema } from '@be/domain';
import { join } from 'node:path';
import { esBaseLocal } from './comando-del-recetario';
import { leerSemillaDelRecetario } from './semilla-del-recetario';

const RAIZ = join(__dirname, '..', '..', '..', '..');

describe('DL-191 · TEST-REC-006 y 007: la semilla del Recetario de BE', () => {
  it('TEST-REC-006 · son las 66 recetas, R001 a R066, cada una con un nombre distinto y la forma de una receta de BE', () => {
    const recetas = leerSemillaDelRecetario(RAIZ);
    expect(recetas).toHaveLength(66);
    expect(recetas.map((r) => r.codigo)).toEqual(Array.from({ length: 66 }, (_, i) => `R${String(i + 1).padStart(3, '0')}`));
    expect(new Set(recetas.map((r) => r.nombre)).size).toBe(66);
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

  it('TEST-REC-007 · el comando solo escribe sin más en una base local; otra pide la autorización explícita', () => {
    expect(esBaseLocal('postgresql://be:clave@localhost:55442/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@127.0.0.1:5432/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@[::1]:5432/be')).toBe(true);
    expect(esBaseLocal('postgresql://be:clave@dpg-sintetico.oregon-postgres.render.com/be')).toBe(false);
    expect(esBaseLocal('no es una url')).toBe(false);
  });
});
