import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * La imagen de producción instala solo las dependencias declaradas de `@be/api`. `zod` no es una de ellas: es de
 * `@be/domain`, que es donde viven los contratos y las formas del dominio. El typecheck local no lo nota, porque el
 * monorepo tiene todo hoisted; el build del artefacto sí, y ahí ya es tarde (07 §36).
 *
 * Esta prueba es la guardia barata: si una importación de `zod` se cuela en `apps/api/src`, falla acá y dice dónde.
 * La forma correcta es definirla en el dominio y exportarla, como `leerEspecificacionDeMetodo`.
 */
const RAIZ = join(__dirname, '..');

function archivosTs(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(directorio, e.name);
    if (e.isDirectory()) return archivosTs(ruta);
    return e.isFile() && e.name.endsWith('.ts') ? [ruta] : [];
  });
}

describe('Dependencias del artefacto — 07 §36', () => {
  it('ningún archivo de apps/api importa zod: las formas del dominio se definen en @be/domain', () => {
    const culpables = archivosTs(RAIZ).filter((f) => /from '(zod)'|require\('zod'\)/.test(readFileSync(f, 'utf8')));
    expect(culpables.map((f) => f.slice(RAIZ.length + 1))).toEqual([]);
  });

  it('las dependencias declaradas de @be/api no incluyen zod', () => {
    const paquete = JSON.parse(readFileSync(join(RAIZ, '..', 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
    expect(Object.keys(paquete.dependencies ?? {})).not.toContain('zod');
  });
});
