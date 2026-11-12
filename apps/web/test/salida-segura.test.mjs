/**
 * ED-02 y ED-65 · Salir con cambios sin guardar (WP-EDITORES-PROFESIONAL; ED-D10; TEST-EDP-003 y TEST-EDP-052).
 *
 * Un enlace interno con cambios sin guardar guarda antes de salir (si todo se puede guardar) o pregunta, con «Seguir
 * editando» como principal; nunca se pierde nada en silencio, y nada se guarda en el navegador. Cada editor del website
 * profesional con cambios tiene la guardia; la receta nunca se guarda sola (guardarla crea una versión).
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const S = await import('../src/lib/salida-segura.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('TEST-EDP-003 · la regla: sin cambios se sale; si todo se puede guardar, se guarda y se sale; si no, se pregunta', () => {
  assert.deepEqual(S.queHacerAlSalir([]), { tipo: 'SALIR' });
  assert.deepEqual(S.queHacerAlSalir([{ que: 'el plan en preparación', sePuedeGuardar: true }]), { tipo: 'GUARDAR_Y_SALIR' });
  // Algo a medio escribir, un conflicto o un editor que no se guarda solo (una receta): se pregunta, con lo que se pierde.
  assert.deepEqual(S.queHacerAlSalir([{ que: 'el plan en preparación', sePuedeGuardar: false }]), { tipo: 'PREGUNTAR', que: ['el plan en preparación'] });
  assert.deepEqual(S.queHacerAlSalir([{ que: 'el plan en preparación', sePuedeGuardar: true }, { que: 'la receta', sePuedeGuardar: false }]), {
    tipo: 'PREGUNTAR',
    que: ['el plan en preparación', 'la receta'],
  });
  assert.equal(S.COPY_SALIDA_SEGURA.titulo, 'Tenés cambios sin guardar');
  assert.equal(S.COPY_SALIDA_SEGURA.guardandoAntesDeSalir, 'Guardando antes de salir…');
  assert.equal(S.COPY_SALIDA_SEGURA.queSePierde(['el plan en preparación', 'la receta']), 'Si salís ahora, se pierde lo que escribiste en el plan en preparación y la receta y todavía no se guardó.');
});

test('TEST-EDP-003 · el cuadro: «Seguir editando» es el principal y tiene el foco; Escape nunca sale', () => {
  const c = leer('components/salida-segura.tsx');
  assert.match(c, /<button ref=\{seguir\} type="button" className="boton boton--primario" data-seguir-editando onClick=\{onSeguirEditando\}>/);
  assert.match(c, /dialogo\.showModal\(\);\n\s*seguir\.current\?\.focus\(\);/);
  assert.match(c, /onCancel=\{\(e\) => \{\n\s*e\.preventDefault\(\);\n\s*onSeguirEditando\(\);/);
  assert.match(c, /data-salir-sin-guardar/);
  // «Guardando antes de salir…» se anuncia, y se sale solo con la respuesta del servidor.
  assert.match(c, /role="status" aria-live="polite" data-guardando-antes-de-salir/);
  assert.match(c, /if \(todo\) return ir\(destino\);/);
  // Un guardado que ya viajaba se espera: dos pedidos con la misma versión darían un conflicto.
  assert.match(c, /leer\(\)\.guardarAntes\?\.ocupado && espera < ESPERA_DE_UN_GUARDADO_EN_VIAJE_MS/);
  // Nada se guarda en el navegador (DL-148 D-5).
  for (const ruta of ['components/salida-segura.tsx', 'lib/salida-segura.ts']) assert.doesNotMatch(leer(ruta), /localStorage|sessionStorage|indexedDB/, ruta);
});

test('TEST-EDP-003 · cada enlace interno pasa por la guardia: la barra, las pestañas y «Volver a la ficha»', () => {
  // La guardia envuelve a la compuerta de UF-01, que sigue siendo la de siempre (TEST-UF-005).
  assert.match(leer('app/pro/layout.tsx'), /<SalidaSegura>\n\s*<AntesDeSeguir espacio="pro">\{children\}<\/AntesDeSeguir>\n\s*<\/SalidaSegura>/);
  assert.match(leer('components/navegacion.tsx'), /<Link href=\{e\.href\} [^>]*onNavigate=\{alNavegar\(e\.href\)\}>/);
  assert.match(leer('components/pestanas.tsx'), /<Link href=\{href\(v\.clave\)\} [^>]*replace onNavigate=\{alNavegar\(href\(v\.clave\), true\)\}>/);
  assert.match(leer('app/pro/advisees/marco-del-area.tsx'), /<Link href=\{camino\.href\} onNavigate=\{alNavegar\(camino\.href\)\}>/);
  // Los dos editores de planes se guardan antes de salir, si se puede: nada a medio escribir ni un conflicto.
  for (const ruta of ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx']) {
    assert.match(
      leer(ruta),
      /useCambiosSinGuardar\(sucio, 'el plan en preparación', \{ sePuede: puedeGuardar && !conflicto, ocupado: guardando, guardar: async \(\) => \(await guardar\(\)\) !== null \}\);/,
      ruta,
    );
  }
  // El marco del área deja la guardia (y el aviso de recargar) en un solo lugar.
  assert.match(leer('app/pro/advisees/marco-del-area.tsx'), /useCambiosParaSalir\(hay, que, guardarAntes\);/);
});

/** Los editores del website profesional que pueden quedar con cambios sin guardar, y cómo avisan. */
const EDITORES = [
  ['app/pro/advisees/training/editor.tsx', /useCambiosSinGuardar\(sucio, /],
  ['app/pro/advisees/nutrition/editor.tsx', /useCambiosSinGuardar\(sucio, /],
  ['app/pro/advisees/training/revisiones.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/nutrition/revisiones.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/nutrition/registros.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/forms/pedir.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/forms/cargar.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/anthropometry/preparacion.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/anthropometry/medicion.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/advisees/anthropometry/calculos.tsx', /useCambiosSinGuardar\(/],
  ['app/pro/recipes/editor-de-receta.tsx', /useCambiosParaSalir\(sucio, 'la receta'\);/],
  ['app/pro/templates/mis-plantillas.tsx', /useCambiosParaSalir\(/],
  ['app/pro/templates/mis-plantillas-nutricion.tsx', /useCambiosParaSalir\(/],
  ['app/pro/templates/mis-habituales.tsx', /useCambiosParaSalir\(/],
  ['app/pro/templates/mis-habituales-nutricion.tsx', /useCambiosParaSalir\(/],
];

test('TEST-EDP-052 · cada editor con cambios tiene la guardia de salida', () => {
  for (const [ruta, guardia] of EDITORES) assert.match(leer(ruta), guardia, `${ruta}: sin la guardia de salida`);
});

test('TEST-EDP-052 · la receta nunca se guarda sola al salir, y «Volver a la lista» también pregunta', () => {
  const receta = leer('app/pro/recipes/editor-de-receta.tsx');
  // Sin `guardarAntes`: salir con cambios siempre pregunta (guardar una receta crea una versión, DL-119).
  assert.doesNotMatch(receta, /useCambiosParaSalir\(sucio, 'la receta', /);
  assert.match(receta, /onClick=\{\(\) => antesDeSalir\(onVolver\)\}/);
});
