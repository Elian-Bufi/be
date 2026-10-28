#!/usr/bin/env node
/**
 * Revisa una carpeta de registro del lanzador (scripts/aab/lanzar-aab.ps1) con el mismo detector de credenciales del
 * verificador: por nombre y por contenido, sin imprimir nunca lo encontrado (solo el archivo y el tipo de marcador).
 * Sale con 0 si está limpia y con 1 si hay algo para revisar antes de compartirla. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS.
 *
 *   node scripts/aab/revisar-registro.mjs <carpeta>
 */
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { buscarCredenciales } from './credenciales.mjs';

const carpeta = process.argv[2];
if (!carpeta || !existsSync(carpeta) || !statSync(carpeta).isDirectory()) {
  console.error('Uso: node scripts/aab/revisar-registro.mjs <carpeta de registro>');
  process.exit(2);
}
const r = buscarCredenciales(resolve(carpeta));
console.log(`registro revisado: ${r.archivos} archivo(s), ${r.bytes} bytes, ${r.hallazgos.length} hallazgo(s)`);
for (const h of r.hallazgos) console.log(`- ${h.archivo}: ${h.marcador}`);
process.exit(r.hallazgos.length ? 1 : 0);
