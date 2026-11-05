#!/usr/bin/env node
/**
 * WP-FORMULARIOS-DE-INICIO (DL-164, FI-02) · escribe la migración que siembra las dos plantillas de inicio desde el dominio:
 *   packages/domain/src/plantillas-de-inicio.ts (compilado en dist) → prisma/migrations/20261104130000_formularios_de_inicio_plantillas/migration.sql
 *
 * Uso: npm run build -w @be/domain && node scripts/formularios-de-inicio/generar-migracion-de-plantillas.mjs [--comprobar]
 * Con --comprobar no escribe nada: falla si la migración del repositorio no es exactamente la que sale del dominio, así el
 * `contenido` sembrado y `contenidoDePlantillaDeInicio` no divergen. Correrlo dos veces da el mismo archivo: los UUID son
 * fijos y están acá, y el JSON sale de JSON.stringify sin espacios. Solo módulos nativos de Node 22.
 *
 * Ojo: una migración ya aplicada en un ambiente no se puede cambiar (Prisma guarda su suma de verificación). Cambiar una
 * plantilla después de integrar es una versión nueva en una migración nueva, nunca esta regenerada.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2, contenidoDePlantillaDeInicio } = require(join(RAIZ, 'packages', 'domain', 'dist', 'plantillas-de-inicio.js'));

const CARPETA = '20261104130000_formularios_de_inicio_plantillas';
/** La misma marca en todos los ambientes: el día en que Dirección ratificó el paquete. */
const MOMENTO = '2026-11-04T00:00:00.000Z';

/** UUID fijos: las pruebas y las otras capas los nombran, y la migración tiene que dar lo mismo en cada ambiente. */
const IDS = {
  plantillaDeNutricionInicio: '6da670ad-a767-4177-8c34-cdaab80e0806',
  versionDeNutricionInicio: 'e1ad1e6a-bf90-46b0-923d-f27dafb67041',
  // FRM-ENTRENAMIENTO ya existe (migración 20260928000000, DL-100): la v2 sucede a su v1 y pasa a ser la vigente.
  plantillaDeEntrenamiento: '67e4d0b3-cf4a-41e7-9d84-6864c5dde951',
  versionDeEntrenamientoV1: '0fba80db-0a80-47a7-b183-130232ab7a9c',
  versionDeEntrenamientoV2: '0e34057f-8304-46bd-ac80-475c7093671f',
};

/** El rótulo de las otras plantillas del catálogo (FRM-SALUD, FRM-HABITOS, FRM-ENTRENAMIENTO v1), con la decisión de este paquete. */
const PROCEDENCIA = {
  rotulo: 'Catálogo sintético de demostración: preguntas de producto, no un instrumento clínico ni una evaluación de aptitud (DL-164 FI-02; D-D, docs/paquetes/WP-07.md).',
};

// ─── Lo que la migración da por sentado del dominio ──────────────────────────────────────────────

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(`generar-migracion-de-plantillas: ${mensaje}`);
}
exigir(PLANTILLA_NUTRICION_INICIO.clave === 'FRM-NUTRICION-INICIO' && PLANTILLA_NUTRICION_INICIO.version === '1', 'la plantilla de Nutrición tiene que ser FRM-NUTRICION-INICIO v1');
exigir(PLANTILLA_ENTRENAMIENTO_V2.clave === 'FRM-ENTRENAMIENTO' && PLANTILLA_ENTRENAMIENTO_V2.version === '2', 'la plantilla de Entrenamiento tiene que ser FRM-ENTRENAMIENTO v2');
for (const p of [PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2]) {
  const c = contenidoDePlantillaDeInicio(p);
  // Lo que exigen los CHECK de la base: nombre, propósito y versión con texto, y al menos una sección.
  exigir(c.format === 2 && Array.isArray(c.sections) && c.sections.length > 0, `${p.clave}: el contenido tiene que ser format 2 con secciones`);
  exigir([p.nombre, p.proposito, p.version].every((t) => t.trim() !== ''), `${p.clave}: nombre, propósito y versión no pueden estar vacíos`);
}

// ─── Escritura de SQL ────────────────────────────────────────────────────────────────────────────

/** Un literal de texto de SQL: comillas simples duplicadas (standard_conforming_strings, como en toda la base). */
const texto = (valor) => (valor === null || valor === undefined ? 'NULL' : `'${String(valor).replace(/'/g, "''")}'`);
const json = (valor) => texto(JSON.stringify(valor));
const cantidadDeCampos = (p) => p.sections.reduce((n, s) => n + s.fields.length, 0);

function filaDeVersion({ id, plantillaId, predecesoraId, plantilla }) {
  return [
    `  (${texto(id)}, ${texto(plantillaId)}, ${texto(predecesoraId)}, ${texto(plantilla.version)},`,
    `   ${texto(plantilla.nombre)},`,
    `   ${texto(plantilla.proposito)},`,
    `   ${texto(plantilla.dominio)},`,
    `   ${json(contenidoDePlantillaDeInicio(plantilla))},`,
    `   ${json(PROCEDENCIA)},`,
    `   ${texto(MOMENTO)})`,
  ].join('\n');
}

const nutricion = PLANTILLA_NUTRICION_INICIO;
const entrenamiento = PLANTILLA_ENTRENAMIENTO_V2;
const sql = `-- WP-FORMULARIOS-DE-INICIO · FI-02 (DEUDA_LEGAJO DL-164, ratificada por Dirección el 2026-11-04): las dos plantillas de
-- inicio en el catálogo, con el contenido en el formato 2 del contrato V2 (WP §5, CampoDePlantillaV2Schema).
-- - ${nutricion.clave} v${nutricion.version} «${nutricion.nombre}» (${nutricion.dominio}, ${cantidadDeCampos(nutricion)} campos, ${nutricion.estimatedMinutes} min): plantilla nueva, sin predecesora.
-- - ${entrenamiento.clave} v${entrenamiento.version} «${entrenamiento.nombre}» (${entrenamiento.dominio}, ${cantidadDeCampos(entrenamiento)} campos, ${entrenamiento.estimatedMinutes} min): sucede a la v1 de DL-100 (misma
--   plantilla, predecesora_id = ${IDS.versionDeEntrenamientoV1}) y pasa a ser la vigente. La v1 queda histórica: FRM-02 y
--   FRM-05 la siguen leyendo, FRM-03 ya no la deja pedir (422 FORM_TEMPLATE_NOT_SELECTABLE). Conserva sus seis códigos
--   (CONTEXTO_DE_ENTRENAMIENTO, DL-100).
-- Solo agrega filas, como las otras siembras del catálogo (be_solo_agregar, una raíz por plantilla y sucesión del mismo
-- objeto, 20260921220000). Sintético de demostración (D-D, docs/paquetes/WP-07.md).
-- D-5: una versión con "format": 2 no entra en el contrato V1. FRM-02 responde 404 y FRM-06 no lista sus Solicitudes, las
-- sirven API-FRI-01 a 08. Las APK instaladas no cambian.
--
-- GENERADO desde @be/domain (packages/domain/src/plantillas-de-inicio.ts, contenidoDePlantillaDeInicio) por
-- scripts/formularios-de-inicio/generar-migracion-de-plantillas.mjs. Con --comprobar falla si este archivo difiere. No se
-- edita a mano.

INSERT INTO "plantilla_de_formulario" ("id", "clave", "momento_de_registro") VALUES
  (${texto(IDS.plantillaDeNutricionInicio)}, ${texto(nutricion.clave)}, ${texto(MOMENTO)});

INSERT INTO "version_de_plantilla_de_formulario"
  ("id", "plantilla_id", "predecesora_id", "version", "nombre", "proposito", "dominio", "contenido", "procedencia", "momento_de_registro") VALUES
${filaDeVersion({ id: IDS.versionDeNutricionInicio, plantillaId: IDS.plantillaDeNutricionInicio, predecesoraId: null, plantilla: nutricion })},
${filaDeVersion({ id: IDS.versionDeEntrenamientoV2, plantillaId: IDS.plantillaDeEntrenamiento, predecesoraId: IDS.versionDeEntrenamientoV1, plantilla: entrenamiento })};
`;

const archivo = join(RAIZ, 'prisma', 'migrations', CARPETA, 'migration.sql');
const relativo = archivo.slice(RAIZ.length + 1).replace(/\\/g, '/');
if (process.argv.includes('--comprobar')) {
  let actual = null;
  try {
    actual = readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    // no existe: cuenta como distinto
  }
  if (actual !== sql) {
    console.error(`${relativo}: no es el que sale del dominio. Correr node scripts/formularios-de-inicio/generar-migracion-de-plantillas.mjs`);
    process.exit(1);
  }
  console.log(`${relativo}: al día con @be/domain.`);
} else {
  mkdirSync(dirname(archivo), { recursive: true });
  writeFileSync(archivo, sql);
  console.log(`${relativo}: ${sql.length} caracteres`);
}
