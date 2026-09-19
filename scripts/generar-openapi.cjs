#!/usr/bin/env node
/**
 * Escribe docs/api/openapi.json desde @be/domain (09v7 T21). Requiere `npm run build:domain` antes.
 * Con --verificar no escribe: falla si el archivo versionado difiere del generado (control de drift en CI).
 */
const { mkdirSync, readFileSync, writeFileSync, existsSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { documentoOpenApi } = require('../packages/domain/dist/openapi.js');

const destino = join(__dirname, '..', 'docs', 'api', 'openapi.json');
const generado = `${JSON.stringify(documentoOpenApi(), null, 2)}\n`;

if (process.argv.includes('--verificar')) {
  const actual = existsSync(destino) ? readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') : '';
  if (actual !== generado) {
    process.stderr.write('docs/api/openapi.json no coincide con los contratos de @be/domain. Ejecutá: npm run openapi\n');
    process.exit(1);
  }
  process.stdout.write('OpenAPI al día con @be/domain.\n');
} else {
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, generado);
  process.stdout.write(`Escrito ${destino}\n`);
}
