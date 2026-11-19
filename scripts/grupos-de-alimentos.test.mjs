/**
 * WP-NUTRICION-ALIMENTOS (DL-180, NUA-05) · la siembra de los grupos de la tabla oficial dice lo mismo que la curaduría del
 * catálogo base: cada alimento de `prisma/datos/catalogo-base/alimentos.json` (los 385 de DL-141 y los ocho de DL-119)
 * está una sola vez en la migración, con el grupo de BE que corresponde a su grupo de la curaduría
 * (`GRUPO_DE_LA_CURADURIA`). Una migración aplicada no se regenera: si la curaduría cambia, esta prueba lo dice.
 *
 * Uso: node --test scripts/grupos-de-alimentos.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { GRUPO_DE_LA_CURADURIA, GRUPO_EN_LA_BASE } = require('../packages/domain/dist/index.js');
const curaduria = JSON.parse(readFileSync(new URL('../prisma/datos/catalogo-base/alimentos.json', import.meta.url), 'utf8'));
const migracion = readFileSync(new URL('../prisma/migrations/20261119120100_alimentos_del_catalogo/migration.sql', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** Los pares (FDC, grupo en la base) de la siembra de la tabla oficial. */
const sembrados = [...migracion.slice(migracion.indexOf('FROM (VALUES'), migracion.indexOf(') AS g("fdc", "grupo")')).matchAll(/\('(\d+)', '([A-Z_]+)'\)/g)].map((m) => [m[1], m[2]]);

/** Los ocho de DL-119 no tienen grupo en la curaduría: el suyo, decidido a mano. */
const DE_DL119 = { 168878: 'GRAINS', 169967: 'VEGETABLES', 170394: 'VEGETABLES', 170438: 'VEGETABLES', 171413: 'FATS', 171477: 'MEAT', 172421: 'LEGUMES', 175168: 'FISH' };

test('NUA-05 · cada alimento de la curaduría está una vez en la siembra, con su grupo', () => {
  const porFdc = new Map(sembrados);
  assert.equal(porFdc.size, sembrados.length, 'un FDC repetido en la siembra');
  assert.equal(sembrados.length, curaduria.alimentos.length + curaduria.alimentosDeDl119.length);
  for (const a of curaduria.alimentos) {
    const esperado = GRUPO_DE_LA_CURADURIA[a.grupo];
    assert.ok(esperado, `el grupo «${a.grupo}» de la curaduría no tiene un grupo de BE`);
    assert.equal(porFdc.get(a.fdcId), GRUPO_EN_LA_BASE[esperado], `${a.nombre} (FDC ${a.fdcId})`);
  }
  for (const a of curaduria.alimentosDeDl119) assert.equal(porFdc.get(a.fdcId), GRUPO_EN_LA_BASE[DE_DL119[a.fdcId]], `${a.nombre} (FDC ${a.fdcId})`);
});

test('NUA-05 · la siembra solo agrega: saltea lo que ya tiene grupo y no toca otras tablas', () => {
  assert.match(migracion, /WHERE NOT EXISTS \(SELECT 1 FROM "grupo_de_alimento" x WHERE x\."elemento_id" = v\."elemento_id"\)/);
  // Ninguna sentencia cambia, borra o altera lo que ya estaba: solo crea y agrega (las restricciones van a las tablas nuevas).
  assert.doesNotMatch(migracion, /^\s*(UPDATE|DELETE|DROP|TRUNCATE)\b/m);
  const alteradas = [...migracion.matchAll(/^ALTER TABLE "([a-z_]+)"/gm)].map((m) => m[1]);
  assert.deepEqual([...new Set(alteradas)].sort(), ['alimento_compartido', 'grupo_de_alimento', 'revision_administrativa_de_alimento']);
});
