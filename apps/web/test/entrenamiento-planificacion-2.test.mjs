/**
 * WP-ENTRENAMIENTO-PLANIFICACION, tramo 2 (§6 y §7 del documento del paquete) · el editor del plan de Entrenamiento del
 * profesional: las bajas de la revisión adversaria que pesan para el profesional (el preset con la sesión vacía, el tope
 * de los bloques, los bloques en la versión activa y en lo compartido) y las sugerencias C5 a C9 y C11 de Dirección. Lo
 * puro se prueba con datos; de las pantallas se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const T = await import('../src/app/pro/advisees/topes-del-plan.ts');
const L = await import('../src/app/pro/advisees/training/bloques-en-la-lectura.ts');
const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = fuente('../src/app/pro/advisees/training/editor.tsx');
const GALERIA = fuente('../src/app/pro/advisees/galeria-de-presets.tsx');
const ESTRUCTURA = fuente('../src/app/pro/advisees/training/estructura-del-plan.tsx');
const COMPARTIDO = fuente('../src/app/pro/advisees/seguimiento/plan-compartido.tsx');

/** El máximo de un arreglo del contrato (zod 4), también si es opcional. */
function maximo(esquema) {
  let s = esquema;
  while (s._def.innerType) s = s._def.innerType;
  return s._def.checks.find((c) => c._zod.def.check === 'max_length')._zod.def.maximum;
}

// ─── §7 · los bloques en la versión activa y en el plan compartido ────────────────────────────────────────────

const leido = (order, exerciseGroupId = null) => ({ order, exerciseGroupId, prescriptionId: `p${order}` });
const enPalabras = (partes) => partes.map((x) => (x.tipo === 'suelto' ? `${x.ejercicio.order}` : `[${x.encabezado.nombre}: ${x.ejercicios.map((e) => e.order).join(' ')}]`));

test('§7 · la versión activa y lo compartido agrupan bajo su bloque, en el orden de la sesión', () => {
  const sesion = {
    // Llegan por `order`, no en el orden del arreglo.
    prescriptions: [leido(4), leido(2, 'g-1'), leido(1), leido(3, 'g-1'), leido(5, 'g-9')],
    exerciseGroups: [
      { groupId: 'g-2', label: 'Vacío', order: 2, kind: 'SEQUENTIAL', rounds: null, restAfterRoundSeconds: null },
      { groupId: 'g-1', label: 'Pierna', order: 1, kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 },
    ],
  };
  // El bloque vacío no se muestra; el que nombra un bloque que la sesión no tiene va suelto, a la vista.
  assert.deepEqual(enPalabras(L.partesParaLeer(sesion)), ['1', '[Pierna: 2 3]', '4', '5']);
  const bloque = L.partesParaLeer(sesion).find((x) => x.tipo === 'bloque');
  assert.equal(bloque.encabezado.detalle, 'En vueltas · se alternan 2 ejercicios · 3 vueltas · 90 s de descanso al terminar cada vuelta');
  assert.equal(bloque.encabezado.etiqueta, 'Bloque Pierna, en vueltas, se alternan 2 ejercicios, 3 vueltas, 90 s de descanso al terminar cada vuelta, 2 ejercicios.');
  // Sin bloques, la lista de siempre.
  assert.deepEqual(enPalabras(L.partesParaLeer({ prescriptions: [leido(2), leido(1)] })), ['1', '2']);
});

test('§7 · el encabezado describe y no le indica a nadie: lo leen profesionales', () => {
  const g = (x) => ({ groupId: 'g', label: '', kind: 'ROUNDS', rounds: 4, restAfterRoundSeconds: 0, ...x });
  assert.equal(L.detalleDelBloqueLeido(g(), 3), 'En vueltas · se alternan 3 ejercicios · 4 vueltas · sin pausa al terminar cada vuelta');
  assert.equal(L.detalleDelBloqueLeido(g({ restAfterRoundSeconds: null, rounds: 1 }), 2), 'En vueltas · se alternan 2 ejercicios · 1 vuelta');
  assert.equal(L.detalleDelBloqueLeido(g({ kind: 'SEQUENTIAL' }), 2), null);
  assert.equal(L.encabezadoLeido(g({ kind: 'SEQUENTIAL' }), 1, 1).nombre, 'Bloque 2');
  assert.equal(L.encabezadoLeido(g({ kind: 'SEQUENTIAL' }), 1, 1).etiqueta, 'Bloque 2, 1 ejercicio.');
  for (const x of [L.detalleDelBloqueLeido(g(), 2), L.encabezadoLeido(g(), 0, 2).etiqueta]) assert.doesNotMatch(x, /Alterná|descansá/);
});

test('§7 · las dos lecturas usan la misma regla (la del dominio, como el editor y la APK)', () => {
  assert.match(ESTRUCTURA, /\{partesParaLeer\(sesion\)\.map\(\(parte\) =>/);
  assert.match(ESTRUCTURA, /<BloqueDelPlan key=\{parte\.encabezado\.groupId\}/);
  assert.match(ESTRUCTURA, /nivel=\{nivel === 3 \? 4 : 5\}/, 'los ejercicios del bloque, un nivel de título más');
  assert.match(COMPARTIDO, /\{partesParaLeer\(s\)\.map\(\(parte\) =>/);
  assert.match(COMPARTIDO, /className="plan-compartido__bloque-de-la-sesion"/);
});

// ─── §7 · el tope de los bloques de la sesión ───────────────────────────────────────────────────────────────

test('§7 · «Agregar bloque» tiene el tope del contrato (20) y lo dice antes: el bloque 21 lo rechazaba el servidor', () => {
  assert.equal(T.TOPES_DE_ENTRENAMIENTO.bloquesDeLaSesion, maximo(d.SesionEntradaSchema.shape.exerciseGroups));
  assert.equal(T.motivoSinAgregarBloque(19), null);
  assert.equal(T.motivoSinAgregarBloque(20), 'Una sesión admite hasta 20 bloques: para otro, quitá uno.');
  const grupos = (n) => Array.from({ length: n }, (_, i) => ({ groupId: `g-${i + 1}` }));
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ sessions: [{ prescriptions: [], exerciseGroups: grupos(20) }] }]), []);
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ sessions: [{ prescriptions: [], exerciseGroups: grupos(21) }] }]), [{ code: T.TOPE.bloquesDeLaSesion, path: 'blocks[0].sessions[0]' }]);
  assert.match(EDITOR, /const sinAgregarBloque = sesion \? motivoSinAgregarBloque\(sesion\.exerciseGroups\?\.length \?\? 0\) : null;/);
  assert.match(EDITOR, /aria-disabled=\{sinAgregarBloque \? true : undefined\}/);
  assert.match(EDITOR, /data-tope-de-bloques/);
});

// ─── §7 · ENP-D17 y ENP-D18: el preset con la sesión vacía, atado a la sesión y dicho como es ──────────────────

test('ENP-D18 · el preset de la sesión vacía se recuerda por el identificador de la sesión, no por su lugar', () => {
  assert.match(EDITOR, /const claveDeEstaSesion = sesion\?\.sessionId \?\? null;/);
  assert.doesNotMatch(EDITOR, /const claveDeEstaSesion = `\$\{prefijo\}-s\$\{k\}`/, 'por la posición, quitar o mover otra sesión le pasaba la etiqueta a la que quedaba en su lugar');
  // Una sesión sin identificador (una habitual recién insertada) lo recibe al elegir el preset.
  assert.match(EDITOR, /const clave = sesion\.sessionId \?\? crypto\.randomUUID\(\);\n\s*if \(!sesion\.sessionId\) cambiarLaSesion\(\(s\) => \(\{ \.\.\.s, sessionId: clave \}\)\);/);
});

test('ENP-D17 · una sesión nueva nace con su identificador, como las de «Duplicar el día» (el contrato lo admite)', () => {
  assert.match(EDITOR, /const sesionVacia = \(n: number\): SesionE => \(\{ sessionId: crypto\.randomUUID\(\),/);
  // El contrato lo admite: un identificador de nodo, que el servidor conserva al normalizar.
  assert.equal(d.IdDeNodoSchema.safeParse('3f2c7a4e-9b1d-4c2a-8e5f-0a1b2c3d4e5f').success, true);
  const r = d.normalizarEstructuraDeEntrenamiento({ blocks: [{ label: 'Fase 1', sessions: [{ sessionId: 'mio-1', label: 'Sesión A', prescriptions: [] }] }] }, () => 'del-servidor');
  assert.equal(r.ok, true);
  assert.equal(r.contenido.blocks[0].sessions[0].sessionId, 'mio-1');
});

test('ENP-D18 · el texto dice la verdad: vive en esta pantalla hasta agregar ejercicios; no «queda como su prescripción»', () => {
  const todo = `${EDITOR}\n${GALERIA}`;
  assert.doesNotMatch(todo, /queda como su prescripción/);
  assert.match(EDITOR, /dondeVive: 'Vive en esta pantalla: se escribe en cada ejercicio al agregarlo\. Si cerrás o recargás el editor antes, no queda\.'/);
  assert.match(EDITOR, /data-donde-vive-el-preset/);
  assert.match(GALERIA, /No queda guardado en el plan hasta entonces\./);
});
