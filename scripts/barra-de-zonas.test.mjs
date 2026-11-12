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

// DL-166 (AV-02): Perfil reemplaza a Información como quinto destino.
const ZONAS = ['inicio', 'nutricion', 'entrenamiento', 'evolucion', 'perfil'];
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

test('una fila mientras las etiquetas entren con su tamaño entero (DL-166: en una fila no se achican); si no, dos filas', () => {
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
  // Maqueta 08 de DL-166: con letra ×1,3 en 360 dp, dos filas enteras, con Evolución y Perfil abajo.
  assert.equal(disponer(360, 1.3).filas.length, 2);
  assert.deepEqual(disponer(360, 1.3).filas, [['inicio', 'nutricion', 'entrenamiento'], ['evolucion', 'perfil']]);
  assert.equal(disponer(360, 1.3).escalaEfectiva, 1.3);
  assert.equal(disponer(320, 1.15).filas.length, 2);
  assert.equal(disponer(412, 1.5).filas.length, 2);
});

test('las etiquetas crecen con la letra, sin tope: en dos filas llegan al tamaño pedido o casi, salvo el caso más justo', () => {
  for (const ancho of [360, 390, 412]) {
    for (const escala of ESCALAS) {
      const d = disponer(ancho, escala);
      // DL-166: la tolerancia es de una fila (ahí no se achica nada); en dos filas vale el piso de abajo.
      if (d.filas.length === 1) assert.ok(d.escalaEfectiva >= escala * barra.TOLERANCIA_EN_UNA_FILA - 1e-9, `${ancho} dp ×${escala}: queda en ${d.escalaEfectiva}`);
      // En dos filas, entera desde 390 dp; en 360 dp, a lo sumo un 5 % menos con la holgura de la estimación.
      if (d.filas.length === 2 && ancho >= 390) assert.equal(d.escalaEfectiva, escala, `${ancho} dp ×${escala}: en dos filas no se achica`);
      if (d.filas.length === 2) assert.ok(d.escalaEfectiva >= escala * 0.95, `${ancho} dp ×${escala}: en dos filas queda en ${d.escalaEfectiva}`);
    }
  }
  // Antes, con el tope de 1,15, en 360 dp la letra ×2 quedaba en 12 × 1,15 × 0,96 ≈ 13,2 sp. Ahora, unos 24 sp.
  assert.ok(disponer(360, 2).escalaEfectiva * barra.LETRA_DE_LA_BARRA > 23);
  // En 320 dp con la letra al doble, dos filas: si no alcanzaran, la letra bajaría lo justo; con «Perfil», alcanzan.
  const justo = disponer(320, 2);
  assert.equal(justo.filas.length, 2);
  assert.ok(justo.escalaEfectiva * barra.LETRA_DE_LA_BARRA > 20, `queda en ${justo.escalaEfectiva * barra.LETRA_DE_LA_BARRA} sp`);
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

// ─── WP-APP-VUELTA-2 (DL-170), TEST-AV2-007: la barra con la receta de vidrio (AV2-06) ───────────

const { readFileSync } = await import('node:fs');
const BARRA = readFileSync(new URL('../apps/mobile/src/barra-de-zonas.tsx', import.meta.url), 'utf8');
const TEMA = readFileSync(new URL('../apps/mobile/src/tema.ts', import.meta.url), 'utf8');
/** El valor de un token en un tema de tema.ts. */
function token(tema, clave) {
  const inicio = TEMA.search(new RegExp(`export const ${tema}(: \\w+)? = \\{`));
  return new RegExp(`\\n  ${clave}: '([^']+)'`).exec(TEMA.slice(inicio, TEMA.indexOf('};', inicio)))?.[1];
}

test('TEST-AV2-007 · un destino de 52 dp, por encima de los 48 del objetivo táctil', () => {
  assert.equal(barra.ALTO_DEL_DESTINO, 52);
  assert.ok(barra.ALTO_DEL_DESTINO >= 48);
  assert.equal(Number(/destino: \{[^}]*minHeight: (\d+)/.exec(BARRA)?.[1]), barra.ALTO_DEL_DESTINO, 'el estilo usa ese alto');
});

test('TEST-AV2-007 · con letra ×1,3 a 360 dp, dos filas enteras, sin cortar ni achicar ninguna etiqueta', () => {
  const d = disponer(360, 1.3);
  assert.deepEqual(d.filas, [['inicio', 'nutricion', 'entrenamiento'], ['evolucion', 'perfil']]);
  assert.equal(d.escalaEfectiva, 1.3);
  assert.doesNotMatch(BARRA, /numberOfLines=\{0\}|display: 'none'/);
});

test('TEST-AV2-007 · durante la sesión la barra es opaca; flotante, de vidrio con borde y línea de luz y sin «elevation»', () => {
  assert.equal(barra.tokenDelFondoDeLaBarra(true), 'fondo');
  assert.equal(barra.tokenDelFondoDeLaBarra(false), 'barraVidrio');
  for (const tema of ['AZUL_NOCHE', 'CLARO']) {
    assert.match(token(tema, 'fondo'), /^#[0-9a-f]{6}$/i, `${tema}: el fondo de la barra fija es opaco`);
    assert.match(token(tema, 'barraVidrio'), /^#[0-9a-f]{6}e0$/i, `${tema}: el vidrio de la barra, al 88 %`);
  }
  assert.match(BARRA, /const fondo = COLOR\[tokenDelFondoDeLaBarra\(fija\)\];/);
  assert.match(BARRA, /\? \[estilos\.fija, \{ paddingBottom: insets\.bottom \+ 4, backgroundColor: fondo \}\]/);
  const capsula = /\n  capsula: \{([\s\S]*?)\n  \},/.exec(BARRA)[1].replace(/\/\/.*$/gm, '');
  assert.match(capsula, /borderColor: COLOR\.vidrioFilo/);
  assert.match(capsula, /boxShadow: sombrasDeLaBarra\(COLOR\)/);
  assert.doesNotMatch(capsula, /elevation|shadowOpacity/, 'sin la sombra de elevation');
});
