/**
 * La barra de la APK con la letra de la persona (DL-117; cierre del 2026-10-04): `apps/mobile/src/disposicion-de-la-barra.ts`.
 * Se verifica, por comportamiento y sin teléfono, el orden de prioridades para que entren las cinco etiquetas:
 *  1. reparto y espacio útil: una fila mientras entren con al menos el 90 % de su tamaño;
 *  2. alto: si no, dos filas, con el mismo orden de lectura (3 arriba y 2 abajo);
 *  3. letra: solo si aun así no entran, baja lo justo; y nunca hay un tope de crecimiento.
 * El tamaño efectivo medido en el render, con Roboto, está en EVIDENCIA/INICIO-Y-NAVEGACION/LEEME.md.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const barra = await import('../apps/mobile/src/disposicion-de-la-barra.ts');

const ZONAS = ['inicio', 'nutricion', 'entrenamiento', 'evolucion', 'informacion'];
const disponer = (anchoDePantalla, escalaDeLetra) => barra.disposicionDeLaBarra({ anchoDePantalla, escalaDeLetra, zonas: ZONAS });
const ANCHOS = [320, 360, 390, 412];
const ESCALAS = [1, 1.15, 1.3, 1.5, 1.8, 2];

test('los cinco destinos, siempre y en el mismo orden de lectura, en una fila o en dos', () => {
  for (const ancho of ANCHOS) {
    for (const escala of ESCALAS) {
      const d = disponer(ancho, escala);
      assert.deepEqual(d.filas.flat(), ZONAS, `${ancho} dp ×${escala}`);
      assert.ok(d.filas.length === 1 || (d.filas.length === 2 && d.filas[0].length === 3 && d.filas[1].length === 2), `${ancho} dp ×${escala}: ${d.filas.length} filas`);
    }
  }
});

test('una fila mientras las etiquetas entren con al menos el 90 % de su tamaño; si no, dos filas', () => {
  for (const ancho of ANCHOS) {
    for (const escala of ESCALAS) {
      const d = disponer(ancho, escala);
      if (d.filas.length === 1) assert.ok(d.escalaEfectiva >= escala * barra.TOLERANCIA_EN_UNA_FILA - 1e-9, `${ancho} dp ×${escala}: una fila achicaría a ${d.escalaEfectiva}`);
    }
  }
  // Los casos de la revisión: con la letra de siempre, una fila; con letra grande en un teléfono común, dos.
  assert.equal(disponer(360, 1).filas.length, 1);
  assert.equal(disponer(360, 1).escalaEfectiva, 1, 'en 360 dp con la letra de siempre, sin achicar');
  assert.equal(disponer(412, 1.3).filas.length, 1);
  assert.equal(disponer(360, 1.3).filas.length, 2);
  assert.equal(disponer(320, 1.15).filas.length, 2);
  assert.equal(disponer(412, 1.5).filas.length, 2);
});

test('las etiquetas crecen con la letra, sin tope: en dos filas llegan al tamaño pedido o casi, salvo el caso más justo', () => {
  for (const ancho of [360, 390, 412]) {
    for (const escala of ESCALAS) {
      const d = disponer(ancho, escala);
      assert.ok(d.escalaEfectiva >= escala * barra.TOLERANCIA_EN_UNA_FILA - 1e-9, `${ancho} dp ×${escala}: queda en ${d.escalaEfectiva}`);
      // En dos filas, entera desde 390 dp; en 360 dp, a lo sumo un 5 % menos con la holgura de la estimación.
      if (d.filas.length === 2 && ancho >= 390) assert.equal(d.escalaEfectiva, escala, `${ancho} dp ×${escala}: en dos filas no se achica`);
      if (d.filas.length === 2) assert.ok(d.escalaEfectiva >= escala * 0.95, `${ancho} dp ×${escala}: en dos filas queda en ${d.escalaEfectiva}`);
    }
  }
  // Antes, con el tope de 1,15, en 360 dp la letra ×2 quedaba en 12 × 1,15 × 0,96 ≈ 13,2 sp. Ahora, unos 24 sp.
  assert.ok(disponer(360, 2).escalaEfectiva * barra.LETRA_DE_LA_BARRA > 23);
  // En 320 dp con la letra al doble, ni dos filas alcanzan: la letra baja lo justo, y sigue muy por encima del tope viejo.
  const justo = disponer(320, 2);
  assert.equal(justo.filas.length, 2);
  assert.ok(justo.escalaEfectiva < 2 && justo.escalaEfectiva * barra.LETRA_DE_LA_BARRA > 20, `queda en ${justo.escalaEfectiva * barra.LETRA_DE_LA_BARRA} sp`);
});

test('en un teléfono angosto, la cápsula se acerca a los bordes antes de achicar la letra', () => {
  assert.equal(barra.margenDeLaBarra(320), 6);
  assert.equal(barra.margenDeLaBarra(360), 8);
  assert.equal(barra.margenDeLaBarra(412), 12);
  assert.ok(disponer(320, 1).anchoUtil > 320 - 2 * 8 - 8, 'con 6 dp de margen queda más ancho útil');
});

test('el ancho de cada etiqueta es el medido con Roboto en negrita: «Entrenamiento» es la más ancha', () => {
  const em = barra.ANCHO_DE_LAS_ETIQUETAS_EN_EM;
  assert.deepEqual(Object.keys(em).sort(), [...ZONAS].sort());
  assert.equal(Object.entries(em).sort((a, b) => b[1] - a[1])[0][0], 'entrenamiento');
  assert.ok(em.entrenamiento * barra.LETRA_DE_LA_BARRA > 78 && em.entrenamiento * barra.LETRA_DE_LA_BARRA < 80, 'unos 79 dp a 12 sp');
});
