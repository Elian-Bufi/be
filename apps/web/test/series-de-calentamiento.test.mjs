/**
 * DL-178 (decisión de Dirección del 2026-11-18) · las series de calentamiento en el editor del plan de Entrenamiento: la
 * marca «C», el calentamiento arriba, las efectivas numeradas 1, 2, 3 y el aviso antes de activar. La lógica vive en el
 * dominio (`tipos-de-serie.ts`); de la planilla se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EJERCICIO = fuente('../src/app/pro/advisees/training/ejercicio-del-editor.tsx');
const EDITOR = fuente('../src/app/pro/advisees/training/editor.tsx');
const PLAN = fuente('../src/app/pro/advisees/training/estructura-del-plan.tsx');
const API = fuente('../src/lib/api.ts');

test('DL-178 · marcar «C» sube la serie arriba; las efectivas se numeran 1, 2, 3 y el calentamiento lleva «C»', () => {
  // Lo que hace la planilla al marcar la tercera serie: la marca y sube el calentamiento, sin cambiar el orden de cada tipo.
  const sets = [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 12 } }];
  const marcadas = d.conElCalentamientoArriba(sets.map((s, n) => (n === 2 ? { ...s, setKind: 'WARM_UP' } : s)));
  assert.deepEqual(
    marcadas.map((s) => [s.setKind ?? 'WORKING', s.repetitions.value]),
    [
      ['WARM_UP', 12],
      ['WORKING', 8],
      ['WORKING', 8],
    ],
  );
  assert.equal(d.calentamientoFueraDeLugar(marcadas), null, 'lo que guarda la planilla, la API lo acepta');
  assert.deepEqual(
    d.rotulosDeLasSeries(marcadas).map((r) => r.corto),
    ['C', '1', '2'],
  );
  // La planilla usa esas reglas: la casilla (DL-196: «Aproximación», ya no «C»), el reorden y los rótulos (A1, A2…).
  assert.match(EJERCICIO, /data-marcar-calentamiento=\{n \+ 1\}/);
  assert.match(EJERCICIO, /onCambiar\(\{ sets: conElCalentamientoArriba<Serie>\(sets\) \}\)/);
  assert.match(EJERCICIO, /rotulos\[n\]!\.corto/);
  assert.match(EJERCICIO, /const rotulos = rotulosConAproximaciones\(p\.sets\);/);
  assert.match(EJERCICIO, /COPY_SELECCION\.ayudaDeLaAproximacion/);
  assert.doesNotMatch(EJERCICIO, /COPY_TIPOS_DE_SERIE\.marca/);
  // Las celdas se nombran con el rótulo: «Calentamiento: repeticiones», «Serie 1: carga sugerida».
  assert.doesNotMatch(EJERCICIO, /\$\{S\} \$\{n \+ 1\}/);
});

test('DL-178 · el plan activo y la hoja muestran «C»; DL-196 (E3): la app de la persona ya no impide activar', () => {
  assert.match(PLAN, /f\.deCalentamiento \? <abbr title=\{COPY_TIPOS_DE_SERIE\.calentamiento\}>/);
  assert.doesNotMatch(EDITOR, /calentamientoBloqueado|setKindsDelivery|setTargetsDelivery|COPY_CALENTAMIENTO_Y_LA_APP|COPY_COMPATIBILIDAD_DE_CLIENTES/);
  assert.equal(d.COPY_CALENTAMIENTO_Y_LA_APP, undefined);
  assert.match(EDITOR, /WARM_UP_AFTER_WORKING_SET: '/);
  // El website declara la capacidad: las lecturas de Entrenamiento le llegan con el tipo de cada serie.
  assert.match(API, /capacidades: \[[^\]]*CAPACIDAD_TIPOS_DE_SERIE[,\]]/);
  // Los textos describen, no califican.
  for (const texto of Object.values(d.COPY_TIPOS_DE_SERIE).filter((t) => typeof t === 'string')) {
    assert.doesNotMatch(texto, /cumplimiento|adherencia|racha|puntaje|asesorado/i, texto);
  }
});

test('DL-178 · revisión adversaria: lo registrado se rotula por setIndex y con lo indicado; el editor abierto cuenta las efectivas', () => {
  const EJECUCIONES = fuente('../src/app/pro/advisees/training/ejecuciones.tsx');
  // Una serie salteada no renumera las que siguen, y el plan dice cuál es de calentamiento (D-5).
  assert.match(EJECUCIONES, /rotuloPorIndice\(\[\.\.\.\(planificado\.find\(\(p\) => p\.prescriptionId === e\.prescriptionId\)\?\.sets \?\? \[\]\), \.\.\.todas\]\)\(s\.setIndex\)/);
  assert.doesNotMatch(EJECUCIONES, /rotulosDeLasSeries\(todas\)/);
  const r = d.rotuloPorIndice([{ setIndex: 1, setKind: 'WARM_UP' }, { setIndex: 2 }, { setIndex: 3 }, { setIndex: 1 }, { setIndex: 3 }]);
  assert.deepEqual([r(1).largo, r(3).largo], ['Calentamiento', 'Serie 2']);
  assert.match(EJERCICIO, /abierto \? cuentaDeSeries\(p\.sets\) : plegado\.resumen/);
});
