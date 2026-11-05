#!/usr/bin/env node
/**
 * Escribe las migraciones que siembran las plantillas de inicio desde el dominio (packages/domain/src/plantillas-de-inicio.ts,
 * compilado en dist), una por paquete:
 * - WP-FORMULARIOS-DE-INICIO (DL-164, FI-02) → prisma/migrations/20261104130000_formularios_de_inicio_plantillas/migration.sql:
 *   FRM-NUTRICION-INICIO v1 y FRM-ENTRENAMIENTO v2, de formato 2.
 * - WP-FORMULARIOS-RONDA-2 (DL-165, FR-06) → prisma/migrations/20261105120000_formularios_ronda_2_plantillas/migration.sql:
 *   FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO v3, de formato 3, sucesoras de las de DL-164.
 *
 * Uso: npm run build -w @be/domain && node scripts/formularios-de-inicio/generar-migracion-de-plantillas.mjs [--comprobar]
 * Con --comprobar no escribe nada: falla si una migración del repositorio no es exactamente la que sale del dominio, así el
 * `contenido` sembrado y `contenidoDePlantillaDeInicio` no divergen. Correrlo dos veces da los mismos archivos: los UUID son
 * fijos y están acá, y el JSON sale de JSON.stringify sin espacios. Solo módulos nativos de Node 22.
 *
 * Ojo: una migración ya aplicada en un ambiente no se puede cambiar (Prisma guarda su suma de verificación). Cambiar una
 * plantilla después de integrar es una versión nueva en una migración nueva, nunca una de estas regenerada: por eso la de
 * DL-164 sale igual, byte por byte, aunque el dominio sume versiones.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(RAIZ, 'packages', 'domain', 'dist');
const { PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2, PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3, SECCION_DE_HABITOS, contenidoDePlantillaDeInicio } = require(join(DIST, 'plantillas-de-inicio.js'));
const { loQueUsaDelFormato3 } = require(join(DIST, 'formularios-v2.js'));

/** UUID fijos: las pruebas y las otras capas los nombran, y cada migración tiene que dar lo mismo en cada ambiente. */
const IDS = {
  plantillaDeNutricionInicio: '6da670ad-a767-4177-8c34-cdaab80e0806',
  versionDeNutricionInicio: 'e1ad1e6a-bf90-46b0-923d-f27dafb67041',
  // FRM-ENTRENAMIENTO ya existe (migración 20260928000000, DL-100): la v2 sucede a su v1 y pasa a ser la vigente.
  plantillaDeEntrenamiento: '67e4d0b3-cf4a-41e7-9d84-6864c5dde951',
  versionDeEntrenamientoV1: '0fba80db-0a80-47a7-b183-130232ab7a9c',
  versionDeEntrenamientoV2: '0e34057f-8304-46bd-ac80-475c7093671f',
  // DL-165 (FR-06): las sucesoras de formato 3.
  versionDeNutricionInicioV2: '98fb045a-af5d-4122-98c4-71240587adc9',
  versionDeEntrenamientoV3: '3bb9b4c2-efd8-4d80-9c0c-2a4769819478',
};

// ─── Lo que las migraciones dan por sentado del dominio ──────────────────────────────────────────

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(`generar-migracion-de-plantillas: ${mensaje}`);
}
exigir(PLANTILLA_NUTRICION_INICIO.clave === 'FRM-NUTRICION-INICIO' && PLANTILLA_NUTRICION_INICIO.version === '1', 'la plantilla de Nutrición tiene que ser FRM-NUTRICION-INICIO v1');
exigir(PLANTILLA_ENTRENAMIENTO_V2.clave === 'FRM-ENTRENAMIENTO' && PLANTILLA_ENTRENAMIENTO_V2.version === '2', 'la plantilla de Entrenamiento tiene que ser FRM-ENTRENAMIENTO v2');
exigir(PLANTILLA_NUTRICION_INICIO_V2.clave === 'FRM-NUTRICION-INICIO' && PLANTILLA_NUTRICION_INICIO_V2.version === '2', 'la sucesora de Nutrición tiene que ser FRM-NUTRICION-INICIO v2');
exigir(PLANTILLA_ENTRENAMIENTO_V3.clave === 'FRM-ENTRENAMIENTO' && PLANTILLA_ENTRENAMIENTO_V3.version === '3', 'la sucesora de Entrenamiento tiene que ser FRM-ENTRENAMIENTO v3');
// DL-165 D-9 (FR-10): la parte «Tus hábitos» es la misma en las dos de formato 3, campo por campo, y no está en las de
// formato 2. Responderla agrega una versión de los hábitos de la persona (API-FRI-04).
for (const p of [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3]) {
  const parte = p.sections.filter((s) => s.sectionCode === SECCION_DE_HABITOS.sectionCode);
  exigir(parte.length === 1 && JSON.stringify(parte[0]) === JSON.stringify(SECCION_DE_HABITOS), `${p.clave} v${p.version}: la parte «Tus hábitos» tiene que ser SECCION_DE_HABITOS, una vez`);
}
for (const p of [PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2]) {
  exigir(!p.sections.some((s) => s.sectionCode === SECCION_DE_HABITOS.sectionCode), `${p.clave} v${p.version}: una versión de formato 2 no trae la parte «Tus hábitos»`);
}
for (const [p, formato] of [
  [PLANTILLA_NUTRICION_INICIO, 2],
  [PLANTILLA_ENTRENAMIENTO_V2, 2],
  [PLANTILLA_NUTRICION_INICIO_V2, 3],
  [PLANTILLA_ENTRENAMIENTO_V3, 3],
]) {
  const c = contenidoDePlantillaDeInicio(p);
  // Lo que exigen los CHECK de la base: nombre, propósito y versión con texto, y al menos una sección.
  exigir(c.format === formato && Array.isArray(c.sections) && c.sections.length > 0, `${p.clave} v${p.version}: el contenido tiene que ser format ${formato} con secciones`);
  exigir([p.nombre, p.proposito, p.version].every((t) => t.trim() !== ''), `${p.clave} v${p.version}: nombre, propósito y versión no pueden estar vacíos`);
  // DL-165 D-10: lo de formato 3 va solo en el formato 3 (la APK 0.20 recibe el 2), y una de formato 3 lo usa.
  const usos = loQueUsaDelFormato3(c.sections);
  exigir(formato === 3 ? usos.length > 0 : usos.length === 0, `${p.clave} v${p.version}: formato ${formato} con ${usos.length ? usos.join('; ') : 'nada del formato 3'}`);
}

// ─── Escritura de SQL ────────────────────────────────────────────────────────────────────────────

/** Un literal de texto de SQL: comillas simples duplicadas (standard_conforming_strings, como en toda la base). */
const texto = (valor) => (valor === null || valor === undefined ? 'NULL' : `'${String(valor).replace(/'/g, "''")}'`);
const json = (valor) => texto(JSON.stringify(valor));
const cantidadDeCampos = (p) => p.sections.reduce((n, s) => n + s.fields.length, 0);

function filaDeVersion({ id, plantillaId, predecesoraId, plantilla, procedencia, momento }) {
  return [
    `  (${texto(id)}, ${texto(plantillaId)}, ${texto(predecesoraId)}, ${texto(plantilla.version)},`,
    `   ${texto(plantilla.nombre)},`,
    `   ${texto(plantilla.proposito)},`,
    `   ${texto(plantilla.dominio)},`,
    `   ${json(contenidoDePlantillaDeInicio(plantilla))},`,
    `   ${json(procedencia)},`,
    `   ${texto(momento)})`,
  ].join('\n');
}

// ─── DL-164 · FI-02 (aplicada en test: sale igual, byte por byte) ────────────────────────────────

/** La misma marca en todos los ambientes: el día en que Dirección ratificó el paquete. */
const MOMENTO = '2026-11-04T00:00:00.000Z';
/** El rótulo de las otras plantillas del catálogo (FRM-SALUD, FRM-HABITOS, FRM-ENTRENAMIENTO v1), con la decisión de este paquete. */
const PROCEDENCIA = {
  rotulo: 'Catálogo sintético de demostración: preguntas de producto, no un instrumento clínico ni una evaluación de aptitud (DL-164 FI-02; D-D, docs/paquetes/WP-07.md).',
};

const nutricion = PLANTILLA_NUTRICION_INICIO;
const entrenamiento = PLANTILLA_ENTRENAMIENTO_V2;
const sqlDeInicio = `-- WP-FORMULARIOS-DE-INICIO · FI-02 (DEUDA_LEGAJO DL-164, ratificada por Dirección el 2026-11-04): las dos plantillas de
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
${filaDeVersion({ id: IDS.versionDeNutricionInicio, plantillaId: IDS.plantillaDeNutricionInicio, predecesoraId: null, plantilla: nutricion, procedencia: PROCEDENCIA, momento: MOMENTO })},
${filaDeVersion({ id: IDS.versionDeEntrenamientoV2, plantillaId: IDS.plantillaDeEntrenamiento, predecesoraId: IDS.versionDeEntrenamientoV1, plantilla: entrenamiento, procedencia: PROCEDENCIA, momento: MOMENTO })};
`;

// ─── DL-165 · FR-06 ──────────────────────────────────────────────────────────────────────────────

/** El día en que Dirección ratificó la ronda 2. */
const MOMENTO_DE_LA_RONDA_2 = '2026-11-05T00:00:00.000Z';
const PROCEDENCIA_DE_LA_RONDA_2 = {
  rotulo: 'Catálogo sintético de demostración: preguntas de producto, no un instrumento clínico ni una evaluación de aptitud (DL-165 FR-06 y FR-10; D-D, docs/paquetes/WP-07.md).',
};

const nutricionV2 = PLANTILLA_NUTRICION_INICIO_V2;
const entrenamientoV3 = PLANTILLA_ENTRENAMIENTO_V3;
const sqlDeLaRonda2 = `-- WP-FORMULARIOS-RONDA-2 · FR-06 y FR-10 (DEUDA_LEGAJO DL-165, ratificada por Dirección el 2026-11-05): las versiones
-- nuevas de las dos plantillas de inicio, de formato 3, sucesoras de las de DL-164 (que quedan históricas: las Solicitudes
-- ya creadas siguen en su versión, REG-06-209). Las dos traen la parte común «Tus hábitos» (D-9, FR-10), igual en las dos:
-- el sueño y los horarios, la actividad del día, el deporte en la semana y el estrés. Responderla o confirmarla agrega una
-- versión de los hábitos de la persona (API-FRI-04; habitos_de_la_persona, migración 20261105130100).
-- - ${nutricionV2.clave} v${nutricionV2.version} «${nutricionV2.nombre}» (${nutricionV2.dominio}, ${cantidadDeCampos(nutricionV2)} campos en ${nutricionV2.sections.length} partes): sucede a la v1 (predecesora_id =
--   ${IDS.versionDeNutricionInicio}). Empieza con «Tus hábitos», donde la v1 abría con los horarios (D-15); el embarazo no
--   viene pedido (D-4) y los ejemplos de las comidas van como texto de muestra del renglón (D-2); quedan las obligatorias de
--   la v1 (D-7), y la parte común suma las suyas.
-- - ${entrenamientoV3.clave} v${entrenamientoV3.version} «${entrenamientoV3.nombre}» (${entrenamientoV3.dominio}, ${cantidadDeCampos(entrenamientoV3)} campos en ${entrenamientoV3.sections.length} partes): sucede a la v2 (predecesora_id =
--   ${IDS.versionDeEntrenamientoV2}). «Tus hábitos» va antes de «Tu semana para entrenar» (D-15), con la otra actividad y sus
--   días y su momento (D-6); el embarazo no viene pedido ni es obligatorio, y la pregunta de las indicaciones médicas suma
--   el ejemplo (D-4); los días y el momento en una tabla, con los días por semana sin pasar de los marcados (D-5). Conserva
--   los seis códigos de la v1 (DL-100).
-- D-10: una versión con "format": 3 solo se le entrega a un cliente que declara forms-format-3 (X-BE-Capabilities). Para la
-- APK 0.20 y las anteriores no existe: FRI-02 no la lista y FRI-01 y FRI-03 a 08 responden 404, como FRM con las V2.
-- Solo agrega filas (be_solo_agregar; sucesión del mismo objeto, 20260921220000). Sin minutos estimados (D-3).
--
-- GENERADO desde @be/domain (packages/domain/src/plantillas-de-inicio.ts, contenidoDePlantillaDeInicio) por
-- scripts/formularios-de-inicio/generar-migracion-de-plantillas.mjs. Con --comprobar falla si este archivo difiere. No se
-- edita a mano.

INSERT INTO "version_de_plantilla_de_formulario"
  ("id", "plantilla_id", "predecesora_id", "version", "nombre", "proposito", "dominio", "contenido", "procedencia", "momento_de_registro") VALUES
${filaDeVersion({ id: IDS.versionDeNutricionInicioV2, plantillaId: IDS.plantillaDeNutricionInicio, predecesoraId: IDS.versionDeNutricionInicio, plantilla: nutricionV2, procedencia: PROCEDENCIA_DE_LA_RONDA_2, momento: MOMENTO_DE_LA_RONDA_2 })},
${filaDeVersion({ id: IDS.versionDeEntrenamientoV3, plantillaId: IDS.plantillaDeEntrenamiento, predecesoraId: IDS.versionDeEntrenamientoV2, plantilla: entrenamientoV3, procedencia: PROCEDENCIA_DE_LA_RONDA_2, momento: MOMENTO_DE_LA_RONDA_2 })};
`;

// ─── Escribir o comprobar ────────────────────────────────────────────────────────────────────────

const MIGRACIONES = [
  { carpeta: '20261104130000_formularios_de_inicio_plantillas', sql: sqlDeInicio },
  { carpeta: '20261105120000_formularios_ronda_2_plantillas', sql: sqlDeLaRonda2 },
];

let distintas = 0;
for (const { carpeta, sql } of MIGRACIONES) {
  const archivo = join(RAIZ, 'prisma', 'migrations', carpeta, 'migration.sql');
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
      distintas++;
    } else console.log(`${relativo}: al día con @be/domain.`);
  } else {
    mkdirSync(dirname(archivo), { recursive: true });
    writeFileSync(archivo, sql);
    console.log(`${relativo}: ${sql.length} caracteres`);
  }
}
if (distintas > 0) process.exit(1);
