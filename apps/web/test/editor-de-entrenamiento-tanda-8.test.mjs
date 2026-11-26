/**
 * Tanda 8 del editor de Entrenamiento (ET2-D18, ratificada el 2026-11-26 con un matiz) · sin React: en el borrador, un 1RM
 * nuevo recalcula las cargas de todo el borrador (también los plegados) en un solo cambio con su aviso; la versión activa
 * muestra el 1RM congelado; la versión nueva toma el vigente y avisa. Las cuentas, en el dominio
 * (`packages/domain/src/uno-rm-de-la-activacion.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const raiz = (ruta) => readFileSync(new URL(`../../../${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const ESTRUCTURA = leer('app/pro/advisees/training/estructura-del-plan.tsx');
const PLAN = leer('app/pro/advisees/training/plan.tsx');
const PLANES = raiz('apps/api/src/entrenamiento/planes.service.ts');

test('T8-01 · borrador: el 1RM de todos los ejercicios en % RM (también los plegados) se lee junto, y un cambio recalcula todo', () => {
  assert.match(EDITOR, /const r = await api\.unoRMDeLaPersona\(token, asesoradoId, idsEnPorcentaje\.split\(','\)\);/);
  assert.match(EDITOR, /\.filter\(\(q\) => q\.intensity\?\.criterion === 'PERCENT_RM'\)/);
  // Un solo cambio que se deshace, con su aviso de una línea.
  assert.match(EDITOR, /recordar\(COPY_UNO_RM_DE_LA_ACTIVACION\.recalculadas\(r\.cuantas\)\);\n\s*setBloques\(r\.bloques\);/);
  // Un 1RM nuevo en un ejercicio se vuelve a leer para todo el borrador.
  assert.match(EDITOR, /onUnoRMCambiado=\{\(\) => setLecturaDelUnoRM\(\(n\) => n \+ 1\)\}/);
  // Los hooks van antes de las salidas tempranas de la carga.
  assert.ok(EDITOR.indexOf('const [lecturaDelUnoRM, setLecturaDelUnoRM]') < EDITOR.indexOf("if (error === 'no-disponible' && plantilla) return"));
});

test('T8-02 · activa: la API congela el 1RM en la instantánea; la vista lo dice y un 1RM nuevo no la cambia', () => {
  assert.match(PLANES, /const contenido = await this\.conElUnoRMCongelado\(tx, v, catalogo, fechaLocalEn\(momento, ZONA_POR_DEFECTO\)\);/);
  assert.match(PLANES, /const instantanea = construirInstantaneaDeEntrenamiento\(contenido, catalogo\);/);
  // Activar no cambia el contenido validado (la base lo exige): la versión pasa a ACTIVADA sin tocar `contenido`.
  assert.match(PLANES, /data: \{ estado: 'ACTIVADA', version: v\.version \+ 1, momentoDeActivacion: momento \} \}/);
  assert.match(ESTRUCTURA, /\{unoRMDeLaActivacionEnUnRenglon\(congelado\)\}/);
  assert.match(PLAN, /version\.state === 'ACTIVATED' \? \(version\.planning\?\.oneRepMaxAtActivation \?\? \[\]\)/);
});

test('T8-03 · versión nueva: parte de la instantánea con el 1RM congelado; el editor toma el vigente, avisa y lo saca', () => {
  // La sucesora copia la instantánea (con `planning.oneRepMaxAtActivation`).
  assert.match(PLANES, /contenido = JSON\.parse\(JSON\.stringify\(\(base\?\.instantanea\?\.contenido/);
  assert.match(EDITOR, /const cambios = cambiosDesdeLaActivacion\(congelados, vigentesDelBorrador\.mapa\);/);
  assert.match(EDITOR, /COPY_UNO_RM_DE_LA_ACTIVACION\.cambio\(nombreDe\(cambios\[0\]!\.exerciseId\), cambios\[0\]!\)/);
  assert.match(EDITOR, /setPlanificacion\(sinElUnoRMDeLaActivacion\(planDelUnoRM\)\);/);
});
