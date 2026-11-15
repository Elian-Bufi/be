/**
 * WP-GRAFICOS fase 2 (DL-174), «Patrones» y los enfoques (GR-27).
 * Este archivo lo escribe solo la rama de «Patrones» y los enfoques (E), con sus IDs (TEST-GRF-080 en adelante); la
 * rama base deja la primera prueba de su registro.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { esIdDeGrafico } from '@be/domain';

// Los módulos de los gráficos importan sin extensión (como pide el website): el gancho prueba con `.ts`.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const { REGISTRO_DE_GRAFICOS } = await import('../src/app/pro/advisees/graficos/registros.ts');

test('TEST-GRF-080 · el registro de la rama es una lista de gráficos con identificadores estables y sin repetir', () => {
  for (const lista of [REGISTRO_DE_GRAFICOS.todos]) {
    assert.ok(Array.isArray(lista));
    const ids = lista.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const g of lista) {
      assert.ok(esIdDeGrafico(g.id), g.id);
      assert.match(g.codigo, /^(GR|SP)-\d{2}$/, g.id);
      assert.equal(typeof g.ofrecido, 'function', g.id);
    }
  }
});
