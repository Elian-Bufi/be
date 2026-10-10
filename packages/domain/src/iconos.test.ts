/**
 * La familia de íconos: lo que tiene que cumplir cada dibujo para que el website y la APK lo dibujen igual.
 * - los nombres no se repiten, están en minúsculas y son los mismos en la lista y en el mapa;
 * - cada ícono tiene al menos una forma, y cada trazo empieza con un «mover a»;
 * - las formas con medidas caben en el lienzo de 24;
 * - lo único lleno son puntos: un círculo lleno mide, como mucho, 2 de radio;
 * - no hay ninguno de los que BE no usa (la gota queda para el agua; estrellas, medallas y caritas son calificar).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICONOS, LIENZO_DE_ICONO, NOMBRES_DE_ICONO, type FormaDeIcono } from './iconos';

/** Todas las formas de un ícono, con las de adentro de sus grupos. */
function formasDe(formas: readonly FormaDeIcono[]): FormaDeIcono[] {
  return formas.flatMap((f) => (f.forma === 'grupo' ? [f, ...formasDe(f.formas)] : [f]));
}

test('los nombres de los íconos no se repiten y coinciden con el mapa', () => {
  assert.equal(new Set(NOMBRES_DE_ICONO).size, NOMBRES_DE_ICONO.length);
  assert.deepEqual([...NOMBRES_DE_ICONO].sort(), Object.keys(ICONOS).sort());
  for (const nombre of NOMBRES_DE_ICONO) assert.match(nombre, /^[a-z]+(-[a-z]+)*$/, nombre);
});

test('cada ícono tiene formas dibujables dentro del lienzo', () => {
  const enElLienzo = (n: number) => Number.isFinite(n) && n >= 0 && n <= LIENZO_DE_ICONO;
  for (const nombre of NOMBRES_DE_ICONO) {
    const formas = formasDe(ICONOS[nombre].formas);
    assert.ok(formas.length > 0, `${nombre}: sin formas`);
    for (const f of formas) {
      if (f.forma === 'trazo') assert.match(f.d, /^M/, `${nombre}: un trazo que no empieza con «mover a»`);
      if (f.forma === 'circulo') assert.ok(enElLienzo(f.cx - f.r) && enElLienzo(f.cx + f.r) && enElLienzo(f.cy - f.r) && enElLienzo(f.cy + f.r), `${nombre}: un círculo se sale del lienzo`);
      if (f.forma === 'rectangulo') assert.ok(enElLienzo(f.x) && enElLienzo(f.y) && enElLienzo(f.x + f.ancho) && enElLienzo(f.y + f.alto) && f.radio >= 0, `${nombre}: un rectángulo se sale del lienzo`);
      if (f.forma === 'grupo') assert.ok(f.formas.length > 0, `${nombre}: un grupo vacío`);
    }
  }
});

test('lo único lleno de la familia son puntos', () => {
  for (const nombre of NOMBRES_DE_ICONO) {
    for (const f of formasDe(ICONOS[nombre].formas)) {
      if (f.forma === 'circulo' && f.lleno) assert.ok(f.r <= 2, `${nombre}: un círculo lleno de radio ${f.r} ya no es un punto`);
    }
  }
});

test('no hay íconos que califiquen ni la gota, que queda para el agua', () => {
  const noSeUsan = ['gota', 'estrella', 'medalla', 'trofeo', 'carita', 'racha', 'corona', 'pulgar'];
  const nombres: readonly string[] = NOMBRES_DE_ICONO;
  assert.deepEqual(noSeUsan.filter((n) => nombres.includes(n)), []);
});
