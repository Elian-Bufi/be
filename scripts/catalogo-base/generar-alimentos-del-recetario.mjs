/**
 * Alimentos del Recetario de BE (2026-11-26) · escribe la migración que suma al catálogo base los alimentos que las 84
 * recetas nuevas necesitaban y no estaban, desde los datos curados:
 *   prisma/datos/catalogo-base/alimentos-del-recetario.json → prisma/migrations/20261126130000_alimentos_del_recetario/migration.sql
 *
 * Es la misma siembra que la del catálogo base de alimentos (`sqlDeAlimentos`: mismo formato, misma fuente, misma forma de
 * citar, mismos identificadores UUID v5), en una migración nueva: la del catálogo base ya está aplicada y no se regenera.
 *
 * Uso: node scripts/catalogo-base/generar-alimentos-del-recetario.mjs [--verificar]
 * Con --verificar no escribe: falla si la migración del repositorio no es la que sale de los datos. Solo módulos nativos de Node 22.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOMENTO, SIEMBRA_DE_ALIMENTOS, sqlDeAlimentos } from './sql.mjs';

export const CARPETA_DEL_RECETARIO = '20261126130000_alimentos_del_recetario';
export const MOMENTO_DEL_RECETARIO = '2026-11-26T13:00:00.000Z';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** El grupo de BE de cada grupo de la curaduría que usan estos alimentos (los de `GRUPO_EN_LA_BASE` del dominio). */
export const GRUPO_EN_LA_BASE_DEL_RECETARIO = {
  'Cereales, harinas y panificados': 'CEREALES',
  'Cerdo y fiambres': 'CARNES',
  Quesos: 'LACTEOS',
  'Verduras y hortalizas': 'VERDURAS',
};

export function sqlDelRecetario(datos) {
  const { alimentos } = datos;
  const todo = sqlDeAlimentos({ fuente: datos.fuente, alimentos, alimentosDeDl119: [] });
  const cuerpo = todo.slice(todo.indexOf('-- 1. Los alimentos'));
  const cabecera = [
    `-- WP-RECETARIO · alimentos del Recetario de BE del 2026-11-26 (aprobado por Dirección): ${alimentos.length} alimentos de USDA FoodData Central ·`,
    `-- SR Legacy (dominio público, CC0 1.0; se cita «USDA Agricultural Research Service») que las recetas R067 a R151 necesitan y el`,
    `-- catálogo base no tenía: ${alimentos.map((a) => a.nombre).join(', ')}.`,
    `-- GENERADA por scripts/catalogo-base/generar-alimentos-del-recetario.mjs desde prisma/datos/catalogo-base/alimentos-del-recetario.json:`,
    `-- no se edita a mano. Es la misma siembra, con el mismo formato y la misma procedencia, que la del catálogo base de`,
    `-- alimentos (20261019120100), en una migración nueva porque aquella ya está aplicada y no se regenera.`,
    `-- - La composición cada 100 g es la de SR Legacy tal cual; ningún valor se completa ni se estima (el maíz blanco en grano no`,
    `--   trae fibra en la fuente y queda sin ella).`,
    `-- - Un registro de SR Legacy que ya está en el catálogo no se vuelve a crear, y cada inserción saltea lo que ya está.`,
    `-- - Cada alimento tiene su grupo (NUA-05), como los del catálogo base.`,
    `-- Solo agrega filas. No es una recomendación (INV-06-143).`,
  ].join('\n');
  const sembrado = cuerpo
    .replaceAll(MOMENTO, MOMENTO_DEL_RECETARIO)
    .replaceAll(SIEMBRA_DE_ALIMENTOS, datos.siembra)
    .replace('-- 3. Los nombres alternativos de estos alimentos y de los de DL-119: el inglés de USDA y los de otros países.', '-- 3. Los nombres alternativos de estos alimentos: el inglés de USDA y los de otros países.');
  const filasDeGrupos = alimentos.map((a, k) => {
    const grupo = GRUPO_EN_LA_BASE_DEL_RECETARIO[a.grupo];
    if (!grupo) throw new Error(`El grupo «${a.grupo}» de ${a.nombre} no tiene un grupo de BE`);
    return `    ('${a.fdcId}', '${grupo}')${k < alimentos.length - 1 ? ',' : ' '} -- ${a.nombre}`;
  });
  const grupos = [
    `-- 4. El grupo de cada alimento (NUA-05), buscado por su FDC en la procedencia de sus versiones. Saltea lo que ya tiene grupo.`,
    `INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "procedencia", "momento_de_registro")`,
    `SELECT DISTINCT ON (v."elemento_id") v."elemento_id", 1, g."grupo"::"GrupoDeAlimento",`,
    `       '{"fuente":"catalogo-base-grupos","siembra":"${datos.siembra}","nota":"El grupo de la curaduría de los alimentos del recetario (prisma/datos/catalogo-base/alimentos-del-recetario.json)."}'::jsonb,`,
    `       '${MOMENTO_DEL_RECETARIO}'::timestamptz`,
    `  FROM (VALUES`,
    ...filasDeGrupos,
    `  ) AS g("fdc", "grupo")`,
    `  JOIN "version_de_elemento_nutricional" v`,
    `    ON v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY' AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = g."fdc"`,
    ` WHERE NOT EXISTS (SELECT 1 FROM "grupo_de_alimento" x WHERE x."elemento_id" = v."elemento_id")`,
    ` ORDER BY v."elemento_id";`,
  ].join('\n');
  return `${[cabecera, sembrado.trimEnd(), grupos].join('\n\n')}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const datos = JSON.parse(readFileSync(join(RAIZ, 'prisma', 'datos', 'catalogo-base', 'alimentos-del-recetario.json'), 'utf8'));
  const archivo = join(RAIZ, 'prisma', 'migrations', CARPETA_DEL_RECETARIO, 'migration.sql');
  const texto = sqlDelRecetario(datos);
  if (process.argv.includes('--verificar')) {
    let actual = null;
    try {
      actual = readFileSync(archivo, 'utf8');
    } catch {
      // no existe
    }
    if (actual !== texto) {
      console.error(`${CARPETA_DEL_RECETARIO}/migration.sql: no es el que sale de los datos. Correr node scripts/catalogo-base/generar-alimentos-del-recetario.mjs`);
      process.exit(1);
    }
    console.log('Sin problemas.');
  } else {
    mkdirSync(dirname(archivo), { recursive: true });
    writeFileSync(archivo, texto);
    console.log(`${CARPETA_DEL_RECETARIO}/migration.sql: ${texto.length} caracteres`);
  }
}
