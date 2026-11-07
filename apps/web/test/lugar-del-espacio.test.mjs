/**
 * WP-TABLERO-ALTA-GAMA TB-07 y TB-12 (DL-163 D-4; TA-46) · TEST-TAG-035: volver al Espacio profesional donde se estaba,
 * con el cajón apagado o prendido. Sin React (`src/app/pro/lugar-del-espacio.ts`) y con una mirada a las pantallas que
 * guardan y usan el lugar:
 *  1. el lugar guarda identificadores, nunca nombres, y solo valores conocidos; viejo, roto o del futuro no se retoma;
 *  2. al volver, el foco va a lo que se abrió o, si ya no está, a lo que seguía;
 *  3. cada ficha de «Tu semana», cada verbo de «Te toca a vos» y cada salida del cajón guardan el lugar y llevan
 *     `origen=espacio`, y el marco del área ofrece «Volver al Espacio profesional, donde estabas»;
 *  4. el lugar se lee antes que la cartera: el período del último registro no hace leerla dos veces.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const L = await import('../src/app/pro/lugar-del-espacio.ts');
const { terminosProhibidosDeCarteraEn } = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/${ruta}`, import.meta.url), 'utf8');
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const clave = (n, kind = 'REVIEW_OVERDUE', area = 'nutrition') => `${kind}|${area}|${ID(n)}`;
const base = { origen: 'mesa', fila: clave(1), siguientes: [clave(2), clave(3, 'NO_ACTIVE_PLAN', 'training')], filtro: { tipos: ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON'], area: 'nutrition' }, modo: 'persona', periodo: { periodStart: '2026-10-01' } };

test('TEST-TAG-035 · el lugar guarda identificadores y valores conocidos, nunca nombres', () => {
  const lugar = L.lugarDelEspacioParaGuardar(base, 1000);
  assert.deepEqual(lugar, { ...base, guardado: 1000 });
  assert.doesNotMatch(JSON.stringify(lugar), /Persona|displayName|nombre|Sofía|Diego/);
  for (const malo of [
    { ...base, fila: 'REVIEW_OVERDUE|nutrition|Diego Sosa' },
    { ...base, siguientes: [clave(2), 'Norma Castro'] },
    { ...base, filtro: { tipos: ['INVENTADO'], area: null } },
    { ...base, filtro: { tipos: [], area: 'otra' } },
    { ...base, modo: 'todo' },
    { ...base, origen: 'otro' },
    { ...base, periodo: { periodStart: 'ayer' } },
  ]) {
    assert.equal(L.lugarDelEspacioParaGuardar(malo, 1000), null, JSON.stringify(malo));
  }
  // Lo que seguía se guarda con un tope.
  const muchos = Array.from({ length: 40 }, (_, i) => clave(10 + i));
  assert.equal(L.lugarDelEspacioParaGuardar({ ...base, siguientes: muchos }, 1).siguientes.length, L.SIGUIENTES_QUE_SE_GUARDAN);
});

test('TEST-TAG-035 · se retoma solo un lugar reciente y entero', () => {
  const texto = JSON.stringify(L.lugarDelEspacioParaGuardar(base, 1000));
  assert.deepEqual(L.lugarDelEspacioLeido(texto, 2000), { ...base, guardado: 1000 });
  assert.equal(L.lugarDelEspacioLeido(texto, 1000 + L.VIGENCIA_DEL_LUGAR_DEL_ESPACIO_MS + 1), null);
  assert.equal(L.lugarDelEspacioLeido(texto, 999), null);
  assert.equal(L.lugarDelEspacioLeido('{roto', 2000), null);
  assert.equal(L.lugarDelEspacioLeido(null, 2000), null);
  assert.equal(L.lugarDelEspacioLeido(JSON.stringify({ ...base, fila: 'Diego Sosa', guardado: 1000 }), 2000), null);
});

test('TEST-TAG-035 · al volver, el foco va a lo que se abrió o a lo que seguía', () => {
  const lugar = L.lugarDelEspacioParaGuardar(base, 1);
  assert.deepEqual(L.dondeVolver(lugar, () => true), { clave: clave(1), laMisma: true });
  assert.deepEqual(L.dondeVolver(lugar, (c) => c !== clave(1)), { clave: clave(2), laMisma: false });
  assert.deepEqual(L.dondeVolver(lugar, (c) => c === clave(3, 'NO_ACTIVE_PLAN', 'training')), { clave: clave(3, 'NO_ACTIVE_PLAN', 'training'), laMisma: false });
  assert.equal(L.dondeVolver(lugar, () => false), null);
  // Lo que seguía, en el orden de la vista.
  assert.deepEqual(L.siguientesDe([clave(5), clave(1), clave(2), clave(3)], clave(1)), [clave(2), clave(3)]);
  assert.deepEqual(L.siguientesDe([clave(5)], clave(1)), []);
  assert.equal(L.conOrigenEnElEspacio('/pro/advisees/nutrition?id=x&vista=revisiones'), '/pro/advisees/nutrition?id=x&vista=revisiones&origen=espacio');
  assert.equal(L.conOrigenEnElEspacio('/pro/advisees'), '/pro/advisees?origen=espacio');
});

test('TEST-TAG-035 · cada ficha, cada verbo y cada salida del cajón guardan el lugar y llevan el retorno', () => {
  const mesa = leer('te-toca-a-vos.tsx');
  assert.match(mesa, /<Link className="pendiente__enlace" href=\{conOrigenEnElEspacio\(rutaQueResuelve\(p\)\)\}[^>]*data-pendiente=\{claveDelPendiente\(p\)\} onClick=\{\(\) => alAbrir\?\.\(p\)\}>/);
  const semana = leer('tu-semana-en-pantalla.tsx');
  assert.match(semana, /<Link className="ficha-de-la-semana" href=\{conOrigenEnElEspacio\(rutaQueResuelve\(f\)\)\} data-ficha=\{claveDelPendiente\(f\)\} onClick=\{\(\) => alAbrir\?\.\(f\)\}>/);
  const cajon = leer('cajon-de-a-una.tsx');
  assert.match(cajon, /if \(actual\) onSalir\(actual\);/);
  assert.match(cajon, /href=\{conOrigenEnElEspacio\(salida\.href\)\}/);
  const espacio = leer('espacio-profesional.tsx');
  for (const origen of ['semana', 'mesa', 'cajon']) assert.match(espacio, new RegExp(`guardarDondeEstabas\\('${origen}', `), origen);
  // El marco del área ofrece volver al Espacio: /pro, sin parámetros.
  const marco = leer('advisees/marco-del-area.tsx');
  assert.match(marco, /useSearchParams\(\)\.get\('origen'\) === 'espacio'/);
  assert.match(marco, /\{ href: '\/pro', texto: COPY_LUGAR\.volver \}/);
  assert.doesNotMatch(espacio, /router\.(push|replace)\(['`]\/pro\?/);
});

test('TEST-TAG-035 · el lugar se lee antes que la cartera, se usa una vez y, si se salió por el cajón, manda el cajón', () => {
  const espacio = leer('espacio-profesional.tsx');
  assert.match(espacio, /token && id && lugarLeido\s*\?\s*\(filtro: \{ cursor\?: string; limit: string \}\)/);
  assert.match(espacio, /const lugar = leerLugarDelEspacio\(Date\.now\(\)\);\s*guardarLugarDelEspacio\(null\);/);
  assert.match(espacio, /setFiltro\(lugar\.filtro\);\s*setModo\(lugar\.modo\);\s*setPeriodo\(lugar\.periodo\);/);
  assert.match(espacio, /if \(seAbrioElCajon\.current\) return;/);
  assert.match(espacio, /dondeVolver\(lugar, /);
});

test('TEST-TAG-035 · los textos pasan la prueba de términos de la cartera', () => {
  for (const t of Object.values(L.COPY_LUGAR)) {
    assert.deepEqual(terminosProhibidosDeCarteraEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px|foco/i, t);
  }
});
