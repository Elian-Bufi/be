/**
 * WP-CATALOGO-BASE (DL-141, tramos 2 y 3) · arma el SQL de las dos migraciones del catálogo base desde los datos curados
 * de `prisma/datos/catalogo-base/`. Funciones puras: los mismos datos dan siempre el mismo texto, byte a byte. Las usan el
 * generador (`generar-migracion.mjs`) y la prueba de contenido (`scripts/catalogo-base.test.mjs`), que exige que las
 * migraciones del repositorio sean exactamente lo que sale de acá.
 *
 * Solo módulos nativos de Node 22.
 */
import { createHash } from 'node:crypto';

/** Cuándo se bajaron las fuentes y se registró la siembra (la misma marca en todos los ambientes). */
export const MOMENTO = '2026-10-19T00:00:00.000Z';
export const SIEMBRA_DE_EJERCICIOS = 'WP-CATALOGO-BASE · DL-141 · tramo 2';
export const SIEMBRA_DE_ALIMENTOS = 'WP-CATALOGO-BASE · DL-141 · tramo 3';
export const CARPETA_DE_EJERCICIOS = '20261019120000_catalogo_base_de_ejercicios';
export const CARPETA_DE_ALIMENTOS = '20261019120100_catalogo_base_de_alimentos';

const NOTA_DEL_CATALOGO = 'Catálogo base: no es una recomendación ni una prescripción (INV-06-143).';
const NOTA_DEL_NOMBRE = 'Nombre alternativo curado por BE para el catálogo base: no es una recomendación ni una prescripción (INV-06-143).';
const AVISO_DE_LOS_MUSCULOS = 'Lo declara wger: no son zonas musculares de BE (09v12:397-401).';
const NOTA_DE_USDA = 'La descripción original de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0).';
const CONJUNTO_DE_USDA = 'FoodData Central · SR Legacy';
/** La nota administrativa de USDA que no es parte del nombre del alimento. */
const NOTA_ADMINISTRATIVA_DE_USDA = / \(Includes foods for USDA's Food Distribution Program\)$/;

// ─── UUID v5 ─────────────────────────────────────────────────────────────────────────────────────

/** RFC 4122 §4.3: el UUID versión 5 (SHA-1) de un nombre dentro de un espacio. */
export function uuidV5(nombre, espacio) {
  const hash = createHash('sha1').update(Buffer.from(espacio.replace(/-/g, ''), 'hex')).update(Buffer.from(nombre, 'utf8')).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** El espacio de nombres del catálogo base: el UUID v5 de «be.dl-141.catalogo-base» en el espacio URL del RFC 4122. */
export const ESPACIO = uuidV5('be.dl-141.catalogo-base', '6ba7b811-9dad-11d1-80b4-00c04fd430c8');

export const idDeEjercicio = (wgerId) => uuidV5(`wger:${wgerId}:ejercicio`, ESPACIO);
export const idDeVersionDeEjercicio = (wgerId) => uuidV5(`wger:${wgerId}:version`, ESPACIO);
export const idDeAlimento = (fdcId) => uuidV5(`usda-fdc:${fdcId}:elemento`, ESPACIO);
export const idDeVersionDeAlimento = (fdcId) => uuidV5(`usda-fdc:${fdcId}:version`, ESPACIO);
const idDeNombre = (clave, n) => uuidV5(`${clave}:nombre:${n.idioma}:${n.region ?? ''}:${n.origen}:${n.nombre}`, ESPACIO);

// ─── Escritura de SQL ────────────────────────────────────────────────────────────────────────────

/** Un literal de texto de SQL: comillas simples duplicadas (standard_conforming_strings, como en toda la base). */
const texto = (valor) => (valor === null || valor === undefined ? 'NULL' : `'${String(valor).replace(/'/g, "''")}'`);
const json = (valor) => texto(JSON.stringify(valor));
/** Un comentario de una línea: sin saltos ni punto y coma (las pruebas parten el archivo por «;» al final de línea). */
const comentario = (valor) => String(valor).replace(/[\r\n;]+/g, ' ');

/** Las filas de un VALUES, una por línea y con su comentario, en el orden de los datos. */
function filas(lista) {
  return lista.map(({ valores, nota }, i) => `    (${valores.join(', ')})${i < lista.length - 1 ? ',' : ''} -- ${comentario(nota)}`).join('\n');
}

/** El nombre en inglés de un alimento de USDA: su descripción, sin la nota administrativa del programa de distribución. */
export const nombreEnInglesDeUsda = (descripcion) => descripcion.replace(NOTA_ADMINISTRATIVA_DE_USDA, '');

/** Un nombre como lo compara el buscador: sin tildes ni mayúsculas, con un espacio entre palabras. */
export const comparable = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Un nombre alternativo igual al principal no agrega nada («Burpees», «Dulce de Leche»): no se siembra. */
const distintoDe = (nombre) => (n) => comparable(n.nombre) !== comparable(nombre);

// ─── Ejercicios (tramo 2) ────────────────────────────────────────────────────────────────────────

const musculo = (m) => (m.nombreEn ? `${m.nombre} (${m.nombreEn})` : m.nombre);

function licenciaDeWger(fuente, numero, autoria, que) {
  const conocida = fuente.licencias[String(numero)];
  if (!conocida) throw new Error(`${que}: wger declara una licencia desconocida (${numero})`);
  return { id: conocida.id, label: conocida.label, url: conocida.url, attribution: autoria };
}

/**
 * La traducción de wger de la que sale el nombre en castellano: la de wger al castellano si el nombre es suyo; si el nombre
 * es propio de BE, la inglesa, que es la que se tradujo.
 */
export function baseDelNombre(e) {
  return e.origenDelNombre === 'WGER' ? { ...e.traducciones.es, idioma: 'es' } : { ...e.traducciones.en, idioma: 'en' };
}

/**
 * Los nombres alternativos de un ejercicio, con su origen: primero el inglés de wger, después los curados. El inglés no
 * va si es igual al nombre («Burpees»).
 */
export function nombresAlternativosDeEjercicio(e) {
  return [{ nombre: e.traducciones.en.nombre, idioma: 'EN', region: null, origen: 'PROVEEDOR' }, ...e.nombresAlternativos.map((n) => ({ region: null, ...n }))].filter(distintoDe(e.nombre));
}

export function procedenciaDeEjercicio(e, fuente) {
  const base = baseDelNombre(e);
  const recurso = `https://wger.de/api/v2/exerciseinfo/${e.wgerId}/`;
  return {
    fuente: 'wger',
    carga: 'IMPORTACION_CONTROLADA',
    siembra: SIEMBRA_DE_EJERCICIOS,
    recurso,
    fuenteExterna: {
      provider: 'WGER',
      externalId: String(e.wgerId),
      receivedAt: MOMENTO,
      license: licenciaDeWger(fuente, base.licencia, base.autoria, `ejercicio ${e.wgerId}`),
    },
    nombre: { origen: e.origenDelNombre, traduccionDeWger: { id: base.id, idioma: base.idioma, nombre: base.nombre } },
    declaradoPorWger: {
      uuid: e.wger.uuid,
      categoria: e.wger.categoria.nombre,
      musculosPrincipales: e.wger.musculosPrincipales.map(musculo),
      musculosSecundarios: e.wger.musculosSecundarios.map(musculo),
      material: e.wger.material.map((m) => m.nombre),
      license: licenciaDeWger(fuente, e.wger.licencia.wger, e.wger.licencia.autoria, `ejercicio ${e.wgerId}`),
      aviso: AVISO_DE_LOS_MUSCULOS,
    },
    nota: NOTA_DEL_CATALOGO,
  };
}

function procedenciaDeNombreDeEjercicio(e, n, fuente) {
  if (n.origen !== 'PROVEEDOR') return { fuente: 'catalogo-base', siembra: SIEMBRA_DE_EJERCICIOS, nota: NOTA_DEL_NOMBRE };
  const t = n.idioma === 'EN' ? e.traducciones.en : e.traducciones.es;
  return {
    fuente: 'wger',
    siembra: SIEMBRA_DE_EJERCICIOS,
    recurso: `https://wger.de/api/v2/exerciseinfo/${e.wgerId}/`,
    traduccion: t.id,
    license: licenciaDeWger(fuente, t.licencia, t.autoria, `nombre ${n.nombre} del ejercicio ${e.wgerId}`),
  };
}

export function sqlDeEjercicios(datos) {
  const { fuente, ejercicios } = datos;
  const nombres = ejercicios.flatMap((e) => nombresAlternativosDeEjercicio(e).map((n) => ({ e, n })));
  const cabecera = [
    `-- WP-CATALOGO-BASE (DEUDA_LEGAJO DL-141, tramo 2 · D-3; aprobado por Dirección el 2026-10-16, tanda 3): el catálogo base`,
    `-- de ejercicios. ${ejercicios.length} ejercicios de wger (https://wger.de/), bajados el ${fuente.descargadoEl}, cada uno con la licencia y la autoría`,
    `-- que wger declara para su texto, y ${nombres.length} nombres alternativos.`,
    `-- GENERADA por scripts/catalogo-base/generar-migracion.mjs desde prisma/datos/catalogo-base/ejercicios.json: no se edita`,
    `-- a mano; se cambia el JSON y se vuelve a generar (prisma/datos/catalogo-base/LEEME.md).`,
    `-- - Cada ejercicio es CONTROLLED_IMPORT del proveedor WGER, sin profesional que lo cargue, y queda registrado como el`,
    `--   elemento de su ítem externo (D-1): importar después ese mismo ejercicio desde wger apunta a este y no crea otro.`,
    `-- - Si un profesional ya importó ese ejercicio (su ítem externo ya está), no se crea otro: los nombres alternativos se`,
    `--   suman al que ya estaba.`,
    `-- - El nombre en castellano es la traducción de wger (a lo sumo con otras mayúsculas) o uno propio de BE, traducido del`,
    `--   inglés; la procedencia dice cuál y de qué texto de wger sale, y la licencia de la fuente externa es la de ese texto.`,
    `--   El inglés de wger va como nombre alternativo de origen PROVEEDOR, con su licencia.`,
    `-- - La categoría, los músculos y el material que declara wger quedan en la procedencia como dato del proveedor: no son`,
    `--   zonas musculares de BE (09v12:397-401) y el ejercicio sigue sin zonas (REG-06-139). Sin imágenes.`,
    `-- - Identificadores UUID v5 deterministas (espacio «be.dl-141.catalogo-base»), y cada inserción saltea lo que ya está:`,
    `--   correrla dos veces no agrega nada.`,
    `-- Solo agrega filas: no toca tablas, triggers ni lo ya sembrado (REG-06-112). No es una recomendación (INV-06-143).`,
  ].join('\n');

  const sqlEjercicios = [
    `-- 1. Los ejercicios: uno por ejercicio de wger que todavía no tiene su ítem externo.`,
    `INSERT INTO "ejercicio_de_catalogo" ("id", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, 'CONTROLLED_IMPORT'::"ProcedenciaDeCatalogo", ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(ejercicios.map((e) => ({ valores: [texto(idDeEjercicio(e.wgerId)), texto(String(e.wgerId))], nota: e.nombre }))),
    `  ) AS n("id", "id_externo")`,
    ` WHERE NOT EXISTS (SELECT 1 FROM "item_externo_de_catalogo" x WHERE x."proveedor" = 'WGER' AND x."id_externo" = n."id_externo")`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  const sqlVersiones = [
    `-- 2. Su primera versión: el nombre en castellano y la procedencia, con la fuente externa y su licencia.`,
    `INSERT INTO "version_de_ejercicio" ("id", "ejercicio_id", "nombre", "disponibilidad", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, n."ejercicio_id"::uuid, n."nombre", 'DISPONIBLE'::"DisponibilidadDeElemento", n."procedencia"::jsonb, ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(
      ejercicios.map((e) => ({
        valores: [texto(idDeVersionDeEjercicio(e.wgerId)), texto(idDeEjercicio(e.wgerId)), texto(e.nombre), json(procedenciaDeEjercicio(e, fuente))],
        nota: `wger ${e.wgerId}`,
      })),
    ),
    `  ) AS n("id", "ejercicio_id", "nombre", "procedencia")`,
    ` WHERE EXISTS (SELECT 1 FROM "ejercicio_de_catalogo" e WHERE e."id" = n."ejercicio_id"::uuid)`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  const sqlItems = [
    `-- 3. El ítem externo: desde ahora, este es el ejercicio de ese número de wger para todos los profesionales (D-1).`,
    `INSERT INTO "item_externo_de_catalogo" ("proveedor", "id_externo", "ejercicio_id", "procedencia", "momento_de_registro")`,
    `SELECT 'WGER'::"ProveedorExterno", n."id_externo", n."ejercicio_id"::uuid, n."procedencia"::jsonb, ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(
      ejercicios.map((e) => ({
        valores: [
          texto(String(e.wgerId)),
          texto(idDeEjercicio(e.wgerId)),
          json({ fuente: 'migracion', siembra: SIEMBRA_DE_EJERCICIOS, recurso: `https://wger.de/api/v2/exerciseinfo/${e.wgerId}/` }),
        ],
        nota: e.nombre,
      })),
    ),
    `  ) AS n("id_externo", "ejercicio_id", "procedencia")`,
    ` WHERE EXISTS (SELECT 1 FROM "ejercicio_de_catalogo" e WHERE e."id" = n."ejercicio_id"::uuid)`,
    `ON CONFLICT DO NOTHING;`,
  ].join('\n');

  const sqlNombres = [
    `-- 4. Los nombres alternativos: el inglés de wger y su traducción cuando no es el nombre (PROVEEDOR), y los de otros`,
    `--    países que curó BE (SIEMBRA_DE_BE). Van al ejercicio del ítem externo: el sembrado acá o el que ya estaba.`,
    `INSERT INTO "nombre_alternativo_de_ejercicio" ("id", "ejercicio_id", "nombre", "idioma", "region", "origen", "proveedor", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, x."ejercicio_id", n."nombre", n."idioma"::"IdiomaDeNombre", n."region", n."origen"::"OrigenDeNombreAlternativo",`,
    `       n."proveedor"::"ProveedorExterno", n."procedencia"::jsonb, ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(
      nombres.map(({ e, n }) => ({
        valores: [
          texto(idDeNombre(`wger:${e.wgerId}`, n)),
          texto(String(e.wgerId)),
          texto(n.nombre),
          texto(n.idioma),
          texto(n.region),
          texto(n.origen),
          texto(n.origen === 'PROVEEDOR' ? 'WGER' : null),
          json(procedenciaDeNombreDeEjercicio(e, n, fuente)),
        ],
        nota: e.nombre,
      })),
    ),
    `  ) AS n("id", "id_externo", "nombre", "idioma", "region", "origen", "proveedor", "procedencia")`,
    `  JOIN "item_externo_de_catalogo" x ON x."proveedor" = 'WGER' AND x."id_externo" = n."id_externo"`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  return `${[cabecera, sqlEjercicios, sqlVersiones, sqlItems, sqlNombres].join('\n\n')}\n`;
}

// ─── Alimentos (tramo 3) ─────────────────────────────────────────────────────────────────────────

/** La procedencia de un alimento de USDA, con el formato de DL-119 al pie de la letra (`20261005120000_…`). */
export function procedenciaDeAlimento(a, fuente) {
  return {
    fuente: 'usda-fdc-sr-legacy',
    carga: 'IMPORTACION_CONTROLADA',
    siembra: SIEMBRA_DE_ALIMENTOS,
    recurso: `https://api.nal.usda.gov/fdc/v1/food/${a.fdcId}`,
    fuenteExterna: {
      provider: 'USDA_FDC_SR_LEGACY',
      externalId: a.fdcId,
      receivedAt: MOMENTO,
      license: { id: fuente.licencia.id, label: fuente.licencia.label, url: fuente.licencia.url, attribution: fuente.licencia.attribution },
      usdaReference: {
        dataset: CONJUNTO_DE_USDA,
        ndbNumber: a.usda.ndbNumber,
        originalDescription: a.usda.descripcion,
        publishedOn: a.usda.publicacion,
        preparationDescription: a.preparacion,
      },
    },
  };
}

/** La composición cada 100 g, con las claves del dominio (`ComposicionSchema`) en orden fijo. */
export function composicionDeAlimento(a) {
  const c = a.composicion;
  const r = { referenceAmount: c.referenceAmount, energyKcal: c.energyKcal, proteinG: c.proteinG, carbohydrateG: c.carbohydrateG, fatG: c.fatG };
  if (c.fiberG !== undefined) r.fiberG = c.fiberG;
  return r;
}

/**
 * Los nombres alternativos de un alimento: primero la descripción de USDA en inglés, después los curados. La descripción
 * no va si es igual al nombre («Dulce de Leche»).
 */
export function nombresAlternativosDeAlimento(nombre, descripcionUsda, curados) {
  return [
    { nombre: nombreEnInglesDeUsda(descripcionUsda), idioma: 'EN', region: null, origen: 'SIEMBRA_DE_BE', deUsda: true },
    ...curados.map((n) => ({ region: null, origen: 'SIEMBRA_DE_BE', ...n })),
  ].filter(distintoDe(nombre));
}

export function sqlDeAlimentos(datos) {
  const { fuente, alimentos, alimentosDeDl119 } = datos;
  const nombres = [
    ...alimentos.flatMap((a) => nombresAlternativosDeAlimento(a.nombre, a.usda.descripcion, a.nombresAlternativos).map((n) => ({ fdcId: a.fdcId, elementoId: idDeAlimento(a.fdcId), nombreDelAlimento: a.nombre, n }))),
    ...alimentosDeDl119.flatMap((a) => nombresAlternativosDeAlimento(a.nombre, a.descripcionUsda, a.nombresAlternativos).map((n) => ({ fdcId: a.fdcId, elementoId: a.elementoId, nombreDelAlimento: a.nombre, n }))),
  ];
  const cabecera = [
    `-- WP-CATALOGO-BASE (DEUDA_LEGAJO DL-141, tramo 3 · D-4; aprobado por Dirección el 2026-10-16, tanda 3): el catálogo base`,
    `-- de alimentos. ${alimentos.length} alimentos de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0; se cita «USDA Agricultural`,
    `-- Research Service»), bajados el ${fuente.descargadoEl}, con nombres en castellano rioplatense, y ${nombres.length} nombres alternativos (los de`,
    `-- estos alimentos y el inglés de los ${alimentosDeDl119.length} que sembró DL-119).`,
    `-- GENERADA por scripts/catalogo-base/generar-migracion.mjs desde prisma/datos/catalogo-base/alimentos.json: no se edita a`,
    `-- mano; se cambia el JSON y se vuelve a generar (prisma/datos/catalogo-base/LEEME.md).`,
    `-- - Cada alimento es CONTROLLED_IMPORT sin profesional que lo cargue, como los de referencia de DL-119, y su procedencia`,
    `--   sigue ese formato al pie de la letra: proveedor USDA_FDC_SR_LEGACY, FDC, licencia CC0-1.0 y la referencia del registro`,
    `--   (conjunto, NDB, descripción original, publicación y preparación). USDA no es un proveedor de importación (WP-08):`,
    `--   no tiene ítem externo, y lo ven todos porque no es de nadie (como lo sembrado).`,
    `-- - La composición cada 100 g es la de SR Legacy tal cual: energía, proteínas, carbohidratos «by difference», grasas y`,
    `--   fibra. Ningún valor se completa ni se estima.`,
    `-- - Un registro de SR Legacy que ya está en el catálogo (los de DL-119) no se vuelve a crear: a esos solo se les suma`,
    `--   la descripción en inglés como nombre alternativo.`,
    `-- - Los nombres alternativos son del origen SIEMBRA_DE_BE: el inglés es la descripción original de USDA, y los de otros`,
    `--   países los curó BE. USDA no es un proveedor de la tabla de nombres (su origen PROVEEDOR es solo Open Food Facts).`,
    `-- - Identificadores UUID v5 deterministas (espacio «be.dl-141.catalogo-base»), y cada inserción saltea lo que ya está:`,
    `--   correrla dos veces no agrega nada.`,
    `-- Solo agrega filas: no toca tablas, triggers ni lo ya sembrado (REG-06-112). No es una recomendación (INV-06-143).`,
  ].join('\n');

  const sqlElementos = [
    `-- 1. Los alimentos: uno por registro de SR Legacy que todavía no está en el catálogo.`,
    `INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, 'CONTROLLED_IMPORT'::"ProcedenciaDeCatalogo", ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(alimentos.map((a) => ({ valores: [texto(idDeAlimento(a.fdcId)), texto(a.fdcId)], nota: a.nombre }))),
    `  ) AS n("id", "fdc")`,
    ` WHERE NOT EXISTS (`,
    `   SELECT 1 FROM "version_de_elemento_nutricional" v`,
    `    WHERE v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'`,
    `      AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = n."fdc"`,
    `      AND v."elemento_id" <> n."id"::uuid)`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  const sqlVersiones = [
    `-- 2. Su primera versión: el nombre en castellano, la composición cada 100 g y la procedencia.`,
    `INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, n."elemento_id"::uuid, n."nombre", n."composicion"::jsonb, 'DISPONIBLE'::"DisponibilidadDeElemento", n."procedencia"::jsonb,`,
    `       ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(
      alimentos.map((a) => ({
        valores: [texto(idDeVersionDeAlimento(a.fdcId)), texto(idDeAlimento(a.fdcId)), texto(a.nombre), json(composicionDeAlimento(a)), json(procedenciaDeAlimento(a, fuente))],
        nota: `FDC ${a.fdcId}`,
      })),
    ),
    `  ) AS n("id", "elemento_id", "nombre", "composicion", "procedencia")`,
    ` WHERE EXISTS (SELECT 1 FROM "elemento_de_catalogo_nutricional" e WHERE e."id" = n."elemento_id"::uuid)`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  const sqlNombres = [
    `-- 3. Los nombres alternativos de estos alimentos y de los de DL-119: el inglés de USDA y los de otros países.`,
    `INSERT INTO "nombre_alternativo_de_alimento" ("id", "elemento_id", "nombre", "idioma", "region", "origen", "procedencia", "momento_de_registro")`,
    `SELECT n."id"::uuid, e."id", n."nombre", n."idioma"::"IdiomaDeNombre", n."region", 'SIEMBRA_DE_BE'::"OrigenDeNombreAlternativo", n."procedencia"::jsonb,`,
    `       ${texto(MOMENTO)}::timestamptz`,
    `  FROM (VALUES`,
    filas(
      nombres.map(({ fdcId, elementoId, nombreDelAlimento, n }) => ({
        valores: [
          texto(idDeNombre(`usda-fdc:${fdcId}`, n)),
          texto(elementoId),
          texto(n.nombre),
          texto(n.idioma),
          texto(n.region),
          json(
            n.deUsda
              ? { fuente: 'usda-fdc-sr-legacy', siembra: SIEMBRA_DE_ALIMENTOS, recurso: `https://api.nal.usda.gov/fdc/v1/food/${fdcId}`, nota: NOTA_DE_USDA }
              : { fuente: 'catalogo-base', siembra: SIEMBRA_DE_ALIMENTOS, nota: NOTA_DEL_NOMBRE },
          ),
        ],
        nota: nombreDelAlimento,
      })),
    ),
    `  ) AS n("id", "elemento_id", "nombre", "idioma", "region", "procedencia")`,
    `  JOIN "elemento_de_catalogo_nutricional" e ON e."id" = n."elemento_id"::uuid`,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join('\n');

  return `${[cabecera, sqlElementos, sqlVersiones, sqlNombres].join('\n\n')}\n`;
}
