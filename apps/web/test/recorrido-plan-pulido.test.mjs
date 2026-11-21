/**
 * WP-RECORRIDO-PLAN-PULIDO (DL-188) · Lo que pidió Dirección al recorrer la planificación de Nutrición en el escritorio
 * profesional, sin React: la cabecera del área en una franja con la revalidación al recuperar el foco (RP-01), los errores
 * que no mueven los campos (RP-03), el ícono con el número y la abreviatura (RP-07), la cuenta de los gramos detrás de un
 * «?» (RP-08) y el reparto por comida en el plan (RP-06). El calculador (RP-05, RP-09) está en objetivo-y-calculador.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const N = await import('../src/app/pro/advisees/datos-nuevos.ts');
const A = await import('../src/app/pro/advisees/nutrition/abreviaturas-de-macros.ts');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');

const YO = 'p-yo';
const OTRO = 'p-otro';
const dominios = (cambios = {}) => ({
  nutrition: {
    available: true,
    relationshipId: 'r1',
    summary: {
      activePlan: { planVersionId: 'v1', activatedAt: '2026-11-01T10:00:00.000Z', nextReviewAt: null },
      objective: { objectiveVersionId: 'o1', estimatedEnergyRequirement: { value: 2500, unit: 'kcal/day' }, authoredBy: { identityId: YO, displayName: 'Yo' }, effectiveFrom: '2026-11-01T10:00:00.000Z' },
      lastReview: null,
      draftPlan: { planVersionId: 'v2', recordedAt: '2026-11-20T10:00:00.000Z', fromReviewId: null },
      registeredIntakes: 4,
      lastIntakeAt: '2026-11-20T13:00:00.000Z',
      ...cambios,
    },
  },
  training: { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' },
  anthropometry: { available: true, relationshipId: 'r3', summary: null },
});

test('RP-01 · la huella cambia con lo que llega de otros, y no con lo que escribe quien mira', () => {
  const base = N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios(), YO);
  // Un registro nuevo de la persona: hay datos nuevos.
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios({ registeredIntakes: 5, lastIntakeAt: '2026-11-21T09:00:00.000Z' }), YO)));
  // Un objetivo de otro profesional: también.
  const deOtro = dominios({ objective: { objectiveVersionId: 'o2', estimatedEnergyRequirement: { value: 2400, unit: 'kcal/day' }, authoredBy: { identityId: OTRO, displayName: 'Otra' }, effectiveFrom: '2026-11-21T10:00:00.000Z' } });
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], deOtro, YO)));
  // Lo propio (el borrador guardado, la versión activada, un objetivo propio nuevo): no es «nuevo».
  const propio = dominios({
    draftPlan: { planVersionId: 'v2', recordedAt: '2026-11-21T11:00:00.000Z', fromReviewId: null },
    activePlan: { planVersionId: 'v3', activatedAt: '2026-11-21T11:00:00.000Z', nextReviewAt: null },
    objective: { objectiveVersionId: 'o3', estimatedEnergyRequirement: { value: 2300, unit: 'kcal/day' }, authoredBy: { identityId: YO, displayName: 'Yo' }, effectiveFrom: '2026-11-21T11:00:00.000Z' },
  });
  assert.equal(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], propio, YO)), false);
  // El acceso que cambia, también se dice.
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Pausado'], dominios(), YO)));
  // Una falla no se compara, y sin la primera lectura no hay nada que decir.
  assert.equal(N.huellaDelArea('NUTRICION', [], null, YO), null);
  assert.equal(N.hayDatosNuevos(null, base), false);
  assert.equal(N.hayDatosNuevos(base, null), false);
  // Un área mira solo lo suyo: un cambio en otra no la toca.
  const conOtraArea = { ...dominios(), training: { available: true, relationshipId: 'r2', summary: null } };
  assert.equal(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], conOtraArea, YO)), false);
  assert.ok(N.hayDatosNuevos(N.huellaDelArea(null, [], dominios(), YO), N.huellaDelArea(null, [], conOtraArea, YO)));
  // Sin nombres: solo estados e identificadores.
  assert.doesNotMatch(base, /Yo|Otra/);
});

test('RP-01 · la cabecera: sin «Actualizar» ni «Consultado a las»; la vuelta como botón; el acceso en un chip; «Hay datos nuevos · Ver»', () => {
  const marco = leer('app/pro/advisees/marco-del-area.tsx');
  assert.doesNotMatch(marco, /Consultado a las \{|horaDelDia|>\s*Actualizar\s*</);
  assert.match(marco, /className="boton boton--fantasma boton--compacto marco-del-area__volver"/);
  assert.match(marco, /const fichaDe = nombre \? `Ficha de \$\{nombre\}` : 'Ficha de la persona';/);
  assert.match(marco, /document\.visibilityState === 'visible' && Date\.now\(\) - ultimaConsulta\.current > VOLVER_A_LEER_AL_VOLVER_MS\) void leer\(true, 'comparar'\)/);
  assert.match(marco, /<span className="marco-del-area__nuevos" role="status">/);
  // «Ver» pasa por la guardia de la salida: un borrador sin guardar no se pisa.
  assert.match(marco, /antesDeSalir\(\(\) => \{\s*setHayNuevos\(false\);/);
  assert.match(marco, /className="chip-del-acceso" data-chip-del-acceso/);
  const ficha = leer('app/pro/advisees/workspace.tsx');
  assert.doesNotMatch(ficha, /Consultado a las \{|horaDelDia/);
  assert.match(ficha, /void leer\(true, 'comparar'\)/);
  const css = leer('app/globals.css');
  assert.match(css, /\.chip-del-acceso \{[^}]*white-space: nowrap;/);
  for (const t of Object.values(N.COPY_DATOS_NUEVOS)) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i);
});

test('RP-03 · las filas de campos se alinean por arriba y el botón suelto baja lo que ocupa un rótulo', () => {
  const css = leer('app/globals.css');
  const regla = css.slice(css.indexOf('RP-03 (WP-RECORRIDO-PLAN-PULIDO'));
  assert.match(regla, /\.fila-de-dato,\s*\.campos-del-ingrediente,\s*\.lo-general-del-editor__par,\s*\.medicion-libre \{\s*align-items: start;/);
  assert.match(regla, /\.fila-de-dato > \.boton,\s*\.fila-de-dato > \.acciones \{\s*margin-top: calc\(1\.55rem \+ 0\.3rem\);/);
});

test('RP-07 · ícono, número y abreviatura, con la palabra completa para el lector de pantalla', () => {
  assert.equal(A.cantidadAbreviada('kcal', '2.500'), '2.500 kcal');
  assert.equal(A.cantidadAbreviada('protein', '112'), '112 g P');
  assert.equal(A.cantidadAbreviada('carbohydrate', '335'), '335 g C');
  assert.equal(A.cantidadAbreviada('fat', '80'), '80 g G');
  assert.equal(A.cantidadEnPalabras('protein', '112'), '112 gramos de proteínas');
  assert.equal(A.cantidadEnPalabras('kcal', '2.500'), '2.500 kilocalorías');
  assert.equal(A.cantidadEnPalabras('fat', '110 a 134'), '110 a 134 gramos de grasas');
  assert.deepEqual(A.ICONO_DEL_MACRO, { kcal: 'calorias', protein: 'proteinas', carbohydrate: 'carbohidratos', fat: 'grasas' });
  const pieza = leer('app/pro/advisees/nutrition/cantidad-del-macro.tsx');
  assert.match(pieza, /<span aria-hidden="true">\{cantidadAbreviada\(macro, cifra\)\}<\/span>/);
  assert.match(pieza, /<span className="visualmente-oculto">\{cantidadEnPalabras\(macro, cifra\)\}<\/span>/);
});
