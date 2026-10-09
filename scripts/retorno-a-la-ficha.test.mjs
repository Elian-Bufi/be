/**
 * La ficha del asesorado en la URL (WP-DASHBOARD-COMPRENSION, ejes 2 y 5; `apps/web/src/app/pro/advisees/seguimiento/
 * estado.ts`):
 * - `volver` lleva la configuración de la ficha a una pestaña de área como identificadores, enumerados y fechas, y la
 *   ficha se reconstruye con sus mismos lectores, sin salir de `/pro/advisees` del mismo asesorado;
 * - la ficha en su estado inicial también es un lugar al que volver;
 * - una pregunta que no valida con el esquema del dominio se descarta entera, y el corte de una revisión es un instante.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { conRetorno, leerCorte, leerPregunta, parametrosDePregunta, retornoALaFicha, valorDeRetorno } = await import('../apps/web/src/app/pro/advisees/seguimiento/estado.ts');

const ID = '0b6a7f52-3c1d-4e8f-9a2b-5c6d7e8f9a01';
const OTRO = '1c7b8a63-4d2e-4f90-8b3c-6d7e8f9a0b12';
const parametros = (url) => new URL(url, 'http://ficha.invalid').searchParams;

test('la ficha en su estado inicial también es un lugar al que volver', () => {
  const valor = valorDeRetorno(new URLSearchParams(`id=${ID}`));
  assert.equal(valor, 'vista=resumen');
  assert.equal(retornoALaFicha(valor, ID), `/pro/advisees?id=${ID}`);
  assert.equal(conRetorno(`/pro/advisees/nutrition?id=${ID}&vista=revisiones`, valor), `/pro/advisees/nutrition?id=${ID}&vista=revisiones&volver=vista%3Dresumen`);
});

test('Analizar con una pregunta, sus parámetros y un período propio vuelve igual', () => {
  const ficha = new URLSearchParams(
    `id=${ID}&vista=analizar&desde=2026-09-01&hasta=2026-10-09&pregunta=progreso-de-un-ejercicio&ejercicio=e:${OTRO}&serie=2&unidad=kg&m=${encodeURIComponent(`entrenamiento.carga~e:${OTRO}~2~kg`)}`,
  );
  const p = parametros(retornoALaFicha(valorDeRetorno(ficha), ID));
  assert.equal(p.get('id'), ID);
  assert.equal(p.get('vista'), 'analizar');
  assert.deepEqual([p.get('desde'), p.get('hasta')], ['2026-09-01', '2026-10-09']);
  assert.deepEqual([p.get('pregunta'), p.get('ejercicio'), p.get('serie'), p.get('unidad')], ['progreso-de-un-ejercicio', `e:${OTRO}`, '2', 'kg']);
  assert.equal(p.get('m'), `entrenamiento.carga~e:${OTRO}~2~kg`);
});

test('la línea de tiempo con lo nuevo desde una revisión vuelve con su corte y sus filtros', () => {
  const ficha = new URLSearchParams(`id=${ID}&vista=linea&p=30&areas=NUTRITION&novedades=${encodeURIComponent('2026-09-19T11:00:00-03:00')}`);
  const p = parametros(retornoALaFicha(valorDeRetorno(ficha), ID));
  assert.equal(p.get('vista'), 'linea');
  assert.equal(p.get('p'), '30');
  assert.equal(p.get('areas'), 'NUTRITION');
  // El corte vuelve como instante normalizado: es el mismo momento.
  assert.equal(p.get('novedades'), '2026-09-19T14:00:00.000Z');
});

test('lo que no valida se descarta y nunca se sale de la ficha del mismo asesorado', () => {
  const destino = retornoALaFicha(`vista=linea&q=${encodeURIComponent('texto libre')}&areas=NUTRITION,INVENTADA&novedades=no-es-un-instante&id=${OTRO}`, ID);
  const p = parametros(destino);
  assert.ok(destino.startsWith(`/pro/advisees?id=${ID}&`), destino);
  assert.equal(p.get('id'), ID);
  assert.equal(p.get('q'), null);
  assert.equal(p.get('novedades'), null);
  assert.equal(p.get('areas'), 'NUTRITION');
  assert.equal(retornoALaFicha('vista=resumen', 'no-es-un-uuid'), null);
  assert.equal(retornoALaFicha(null, ID), null);
  assert.equal(retornoALaFicha(`vista=resumen&${'x'.repeat(2001)}`, ID), null);
  // Sin `volver`, la pestaña no agrega nada.
  assert.equal(conRetorno(`/pro/advisees/training?id=${ID}`, null), `/pro/advisees/training?id=${ID}`);
});

test('una pregunta que no valida con el esquema se descarta entera; la que valida va y vuelve igual', () => {
  assert.equal(leerPregunta(new URLSearchParams('pregunta=inventada&area=NUTRICION')), null);
  assert.equal(leerPregunta(new URLSearchParams('pregunta=progreso-de-un-ejercicio&serie=99')), null);
  // Una versión de plan es un UUID: un texto no pasa, ni con forma de identificador.
  assert.equal(leerPregunta(new URLSearchParams('pregunta=comparar-etapas&etapaA=no-es-un-id')), null);
  assert.equal(leerPregunta(new URLSearchParams(`pregunta=cambio-desde-el-plan&version=${encodeURIComponent('texto libre de la persona')}`)), null);
  const elegida = leerPregunta(new URLSearchParams(`pregunta=comparar-etapas&area=ENTRENAMIENTO&etapaA=${ID}&etapaB=${OTRO}&ejercicio=v:${OTRO}&serie=1&unidad=lb`));
  assert.deepEqual(elegida, { id: 'comparar-etapas', params: { area: 'ENTRENAMIENTO', stageA: ID, stageB: OTRO, exerciseKey: `v:${OTRO}`, setIndex: 1, unit: 'lb' } });
  assert.deepEqual(leerPregunta(new URLSearchParams(Object.entries(parametrosDePregunta(elegida)).filter(([, v]) => v !== null))), elegida);
});

test('el corte de una revisión es un instante; cualquier otra cosa no filtra', () => {
  assert.equal(leerCorte(new URLSearchParams('novedades=2026-09-19T14:00:00Z')), '2026-09-19T14:00:00.000Z');
  for (const v of ['2026-09-19', 'ayer', '2026-13-40T99:00:00Z', '']) assert.equal(leerCorte(new URLSearchParams(`novedades=${encodeURIComponent(v)}`)), null, v);
});
