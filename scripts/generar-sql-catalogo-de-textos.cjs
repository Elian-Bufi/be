#!/usr/bin/env node
/**
 * Genera los INSERT del catálogo de textos (VersionDeTexto) desde @be/domain, para pegarlos en una migración.
 * La fuente única de los textos es packages/domain/src/textos.ts; la migración es una copia verificada por
 * test/integration/schema.int-spec.ts (hash y texto de la base = los de @be/domain).
 * Uso: npm run build:domain && node scripts/generar-sql-catalogo-de-textos.cjs
 */
const { CATALOGO_DE_TEXTOS } = require('../packages/domain/dist/textos.js');

const ETIQUETA = '$be_texto$';
const lineas = ['-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.'];
for (const v of CATALOGO_DE_TEXTOS) {
  for (const campo of [v.titulo, v.texto, v.finalidad]) {
    if (campo.includes(ETIQUETA)) throw new Error(`El texto ${v.id} contiene el delimitador ${ETIQUETA}`);
  }
  lineas.push(
    `INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES (` +
      `'${v.id}', '${v.tipo}', ${ETIQUETA}${v.titulo}${ETIQUETA}, '${v.finalidad}', ${ETIQUETA}${v.texto}${ETIQUETA}, '${v.hash}', '${v.vigenteDesde}');`,
  );
}
process.stdout.write(lineas.join('\n') + '\n');
