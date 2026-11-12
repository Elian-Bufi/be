/**
 * ED-21 · Elegir varios ejercicios a la vez (WP-EDITORES-PROFESIONAL). La lógica, sin React (`varios-a-la-vez.ts`); del
 * buscador se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const V = await import('../src/app/pro/advisees/training/varios-a-la-vez.ts');
const BUSCADOR = readFileSync(new URL('../src/app/pro/advisees/training/agregar-ejercicio.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const ej = (versionId, name) => ({ versionId, exerciseId: `x-${versionId}`, name });

test('TEST-EDP-022 · el orden marcado se respeta y nada entra sin «Agregar»', () => {
  const frontal = ej('a', 'Sentadilla frontal');
  const bulgara = ej('b', 'Sentadilla búlgara');
  const propia = ej('c', 'Sentadilla con pausa');
  // «sentadilla» escrita: marca dos y crea uno (lo creado queda marcado al final).
  let m = V.alternarMarcado([], bulgara);
  m = V.alternarMarcado(m, frontal);
  m = [...m, propia];
  assert.deepEqual(m.map((x) => x.versionId), ['b', 'a', 'c']);
  // Desmarcar no reordena a los demás; volver a marcar va al final.
  assert.deepEqual(V.alternarMarcado(m, frontal).map((x) => x.versionId), ['b', 'c']);
  assert.deepEqual(V.alternarMarcado(V.alternarMarcado(m, bulgara), bulgara).map((x) => x.versionId), ['a', 'c', 'b']);
  // Con un solo «Agregar», los tres entran en ese orden, cada uno con una serie para completar.
  const entran = V.prescripcionesDeLosMarcados(m, null);
  assert.deepEqual(entran.map((p) => p.exerciseVersionId), ['b', 'a', 'c']);
  assert.deepEqual(entran[0], { exerciseVersionId: 'b', sets: [{ repetitions: null }], intensity: null });
  // Con la prescripción para todos, los tres la tienen (ED-22).
  const leida = d.leerPrescripcion('4×8-12 RIR 2 · 90 s');
  assert.ok(leida.ok);
  for (const p of V.prescripcionesDeLosMarcados(m, leida.leida)) {
    assert.equal(p.sets.length, 4);
    assert.equal(p.intensity.criterion, 'RIR');
    assert.equal(p.intensity.target.value, 2);
  }
  assert.equal(V.COPY_VARIOS_A_LA_VEZ.agregar(3, V.sesionDeDonde('Fuerza · Semana 1 · Piernas A')), 'Agregar 3 a Piernas A');
  // En el buscador, marcar no le avisa nada al editor: solo «Agregar» llama a \`onAgregar\`.
  assert.equal((BUSCADOR.match(/onAgregar\(/g) ?? []).length, 1);
  assert.match(BUSCADOR, /const agregar = \(\) => \{\n\s*if \(marcados\.length === 0\) return setFalta\(true\);/);
  // Una prescripción que no se entiende no se aplica.
  assert.match(BUSCADOR, /if \(lectura && !lectura\.ok\) return;/);
});

test('ED-21 · los chips por zona salen de lo encontrado y filtran sin perder ninguno que nombre una elegida', async () => {
  const Z = await import('../src/app/pro/advisees/training/varios-a-la-vez.ts');
  const orden = (z) => ['pectoral', 'dorsal', 'cuadriceps'].indexOf(z);
  const r = (id, zonas) => ({ id, muscleZones: zonas.map((zoneId, n) => ({ zoneId, role: n === 0 ? 'PRIMARY' : 'SECONDARY' })) });
  const encontrados = [r('a', ['cuadriceps']), r('b', ['dorsal', 'pectoral']), r('c', []), r('d', ['pectoral'])];
  assert.deepEqual(Z.zonasDeLosResultados(encontrados, orden), ['pectoral', 'dorsal', 'cuadriceps']);
  assert.deepEqual(Z.conLasZonas(encontrados, []).map((x) => x.id), ['a', 'b', 'c', 'd']);
  // Una zona secundaria también cuenta; los elegidos se suman (o), no se cruzan (y).
  assert.deepEqual(Z.conLasZonas(encontrados, ['pectoral']).map((x) => x.id), ['b', 'd']);
  assert.deepEqual(Z.conLasZonas(encontrados, ['pectoral', 'cuadriceps']).map((x) => x.id), ['a', 'b', 'd']);
});
