/**
 * DL-195 · Recorridos guiados (WP-RECORRIDOS-GUIADOS §6): TEST-GUI-001 a 010, la lógica de los pasos (qué paso existe,
 * moverse, «Paso n de m»), el estado visto u omitido (cuándo aparece solo, el respaldo del navegador), dónde va el cartel
 * y los textos (cortos, sin términos prohibidos, con los nombres de la pantalla).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import {
  anclaDelPaso,
  apareceSolo,
  claveDelRespaldo,
  COPY_RECORRIDOS_GUIADOS,
  DEFINICIONES_DE_RECORRIDOS,
  huecoDe,
  leerRespaldo,
  MarcarRecorridoRequestSchema,
  moverse,
  pasosPresentes,
  pendientesDeMandar,
  RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO as E,
  RECORRIDO_DEL_EDITOR_DE_NUTRICION as N,
  RECORRIDOS_GUIADOS,
  RecorridosVistosResponseSchema,
  seVeEntero,
  ubicarCartel,
  unirVistos,
  type RectEnPantalla,
} from './recorridos-guiados';

const todas = (lista: readonly string[]) => (a: string) => lista.includes(a);

test('TEST-GUI-001 · un paso sin ancla en la pantalla se saltea, y «Paso n de m» cuenta solo los que están', () => {
  const sinEjercicio = pasosPresentes(E.pasos, todas(['sesiones', 'agregar-bloque', 'esfuerzo', 'agregar-ejercicio', 'revisar-y-activar']));
  assert.deepEqual(
    sinEjercicio.map((p) => p.id),
    ['sesiones', 'bloques', 'esfuerzo', 'catalogo', 'revisar'],
  );
  assert.equal(COPY_RECORRIDOS_GUIADOS.pasoDe(2, sinEjercicio.length), 'Paso 2 de 5');
  assert.deepEqual(pasosPresentes(E.pasos, () => false), []);
});

test('TEST-GUI-002 · un paso ilumina su primera ancla presente: el bloque si hay, si no «Agregar bloque»', () => {
  const bloques = E.pasos.find((p) => p.id === 'bloques')!;
  assert.equal(anclaDelPaso(bloques, todas(['bloque', 'agregar-bloque'])), 'bloque');
  assert.equal(anclaDelPaso(bloques, todas(['agregar-bloque'])), 'agregar-bloque');
  assert.equal(anclaDelPaso(bloques, todas([])), null);
  const rangos = N.pasos.find((p) => p.id === 'rangos-y-totales')!;
  assert.equal(anclaDelPaso(rangos, todas(['panel-de-nutricion'])), 'panel-de-nutricion');
});

test('TEST-GUI-003 · moverse: «Siguiente» avanza y después del último termina; «Anterior» no baja del primero', () => {
  assert.deepEqual(moverse(0, 3, 'siguiente'), { tipo: 'paso', indice: 1 });
  assert.deepEqual(moverse(2, 3, 'siguiente'), { tipo: 'fin' });
  assert.deepEqual(moverse(2, 3, 'anterior'), { tipo: 'paso', indice: 1 });
  assert.deepEqual(moverse(0, 3, 'anterior'), { tipo: 'paso', indice: 0 });
  assert.deepEqual(moverse(0, 0, 'siguiente'), { tipo: 'fin' });
  // Un índice fuera de rango (los pasos cambiaron) se acota antes de moverse.
  assert.deepEqual(moverse(9, 3, 'anterior'), { tipo: 'paso', indice: 1 });
});

test('TEST-GUI-004 · aparece solo la primera vez: nunca mientras se lee, y nunca si se vio o se omitió', () => {
  assert.equal(apareceSolo({ estado: 'leyendo' }, 'training-plan-editor'), false);
  assert.equal(apareceSolo({ estado: 'listo', vistos: [], deLaApi: true }, 'training-plan-editor'), true);
  assert.equal(apareceSolo({ estado: 'listo', vistos: ['training-plan-editor'], deLaApi: true }, 'training-plan-editor'), false);
  // Cada interfaz tiene el suyo: haber visto el de Entrenamiento no apaga el de Nutrición.
  assert.equal(apareceSolo({ estado: 'listo', vistos: ['training-plan-editor'], deLaApi: false }, 'nutrition-plan-editor'), true);
});

test('TEST-GUI-005 · el respaldo del navegador: por usuario, se une con la API y lo que falta se le manda', () => {
  assert.equal(claveDelRespaldo('id-1'), 'be:recorridos-vistos:id-1');
  assert.notEqual(claveDelRespaldo('id-1'), claveDelRespaldo('id-2'));
  assert.deepEqual(leerRespaldo('["nutrition-plan-editor","otro",3]'), ['nutrition-plan-editor']);
  assert.deepEqual(leerRespaldo('no es json'), []);
  assert.deepEqual(leerRespaldo(null), []);
  assert.deepEqual(leerRespaldo('{"a":1}'), []);
  assert.deepEqual(unirVistos(['training-plan-editor'], ['nutrition-plan-editor', 'training-plan-editor']), ['training-plan-editor', 'nutrition-plan-editor']);
  assert.deepEqual(pendientesDeMandar(['training-plan-editor'], ['nutrition-plan-editor', 'training-plan-editor']), ['nutrition-plan-editor']);
});

test('TEST-GUI-006 · el contrato: solo los recorridos que existen y los dos estados, sin campos de más', () => {
  assert.deepEqual([...RECORRIDOS_GUIADOS], ['training-plan-editor', 'nutrition-plan-editor']);
  assert.ok(MarcarRecorridoRequestSchema.safeParse({ state: 'SKIPPED' }).success);
  assert.ok(!MarcarRecorridoRequestSchema.safeParse({ state: 'DONE' }).success);
  assert.ok(!MarcarRecorridoRequestSchema.safeParse({ state: 'SEEN', identityId: 'x' }).success);
  assert.ok(RecorridosVistosResponseSchema.safeParse({ data: [{ tourId: 'training-plan-editor', state: 'SEEN', updatedAt: '2026-11-23T12:00:00.000Z' }] }).success);
  assert.ok(!RecorridosVistosResponseSchema.safeParse({ data: [{ tourId: 'otro', state: 'SEEN', updatedAt: '2026-11-23T12:00:00.000Z' }] }).success);
});

const VENTANA = { ancho: 1280, alto: 800 };
const CARTEL = { ancho: 360, alto: 200 };
const seTocan = (a: RectEnPantalla, b: RectEnPantalla) => a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

test('TEST-GUI-007 · el cartel va al lado del hueco, sin taparlo y adentro de la ventana', () => {
  const casos: [RectEnPantalla, string][] = [
    [{ top: 100, left: 100, width: 300, height: 80 }, 'abajo'],
    [{ top: 600, left: 100, width: 300, height: 120 }, 'arriba'],
    [{ top: 20, left: 20, width: 400, height: 760 }, 'derecha'],
    [{ top: 20, left: 860, width: 400, height: 760 }, 'izquierda'],
  ];
  for (const [hueco, lado] of casos) {
    const u = ubicarCartel(hueco, CARTEL, VENTANA);
    assert.equal(u.lado, lado);
    const cartel = { top: u.top, left: u.left, width: CARTEL.ancho, height: CARTEL.alto };
    assert.ok(!seTocan(cartel, hueco), `${lado}: el cartel tapa el hueco`);
    assert.ok(u.left >= 12 && u.left + CARTEL.ancho <= VENTANA.ancho - 12, `${lado}: se sale de costado`);
    assert.ok(u.top >= 12 && u.top + CARTEL.alto <= VENTANA.alto - 12, `${lado}: se sale de alto`);
  }
  // Un hueco que ocupa toda la ventana: el cartel va encima, abajo a la derecha, adentro de la ventana.
  const todo = ubicarCartel({ top: 0, left: 0, width: 1280, height: 800 }, CARTEL, VENTANA);
  assert.deepEqual(todo, { top: 800 - 200 - 12, left: 1280 - 360 - 12, lado: 'encima' });
});

test('TEST-GUI-008 · el hueco lleva un margen y no sale de la ventana; un elemento cortado se desplaza antes', () => {
  assert.deepEqual(huecoDe({ top: 100, left: 100, width: 50, height: 20 }, VENTANA), { top: 92, left: 92, width: 66, height: 36 });
  assert.deepEqual(huecoDe({ top: -40, left: 0, width: 50, height: 60 }, VENTANA), { top: 0, left: 0, width: 58, height: 28 });
  assert.equal(seVeEntero({ top: 10, left: 10, width: 100, height: 100 }, VENTANA), true);
  assert.equal(seVeEntero({ top: 760, left: 10, width: 100, height: 100 }, VENTANA), false);
});

test('TEST-GUI-009 · los textos son cortos, sin términos prohibidos, y en Entrenamiento nunca «volumen»', () => {
  const prohibidos = ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', 'volumen'];
  for (const d of Object.values(DEFINICIONES_DE_RECORRIDOS)) {
    assert.ok(d.pasos.length >= 5 && d.pasos.length <= 7, `${d.id}: cantidad de pasos`);
    for (const p of d.pasos) {
      const texto = `${p.titulo} ${p.texto}`.toLowerCase();
      for (const x of prohibidos) assert.ok(!texto.includes(x), `${d.id}/${p.id}: «${x}»`);
      assert.ok(!texto.includes('%'), `${d.id}/${p.id}: un % sin base`);
      assert.ok(p.texto.length <= 200, `${d.id}/${p.id}: el texto es largo (${p.texto.length})`);
      assert.ok(p.titulo.length <= 40, `${d.id}/${p.id}: el título es largo`);
      assert.ok(p.anclas.length > 0);
    }
  }
  for (const p of E.pasos) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(`${p.titulo} ${p.texto}`), [], p.id);
});

test('TEST-GUI-010 · los pasos pedidos, en orden y con los nombres de la pantalla', () => {
  assert.deepEqual(
    E.pasos.map((p) => p.id),
    ['sesiones', 'bloques', 'ejercicio', 'esfuerzo', 'catalogo', 'revisar'],
  );
  assert.deepEqual(
    N.pasos.map((p) => p.id),
    ['dias-tipo', 'opciones', 'reparto', 'rangos-y-totales', 'recetas', 'revisar'],
  );
  const textoDe = (d: typeof E) => d.pasos.map((p) => `${p.titulo} ${p.texto}`).join(' ');
  for (const nombre of ['«Sesiones»', '«Agregar sesión»', '«Seguido»', '«En vueltas»', 'Cómo se escribe el esfuerzo', 'Agregar ejercicios', 'Revisar y activar…', '«Común»']) assert.ok(textoDe(E).includes(nombre), nombre);
  for (const nombre of ['Días tipo', 'Reparto por comida', 'Rangos y totales', '«Opción de receta»', 'Recetario de BE', 'Revisar y activar…']) assert.ok(textoDe(N).includes(nombre), nombre);
});
