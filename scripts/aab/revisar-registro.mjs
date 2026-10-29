#!/usr/bin/env node
/**
 * Revisa una carpeta de registro del lanzador (scripts/aab/lanzar-aab.ps1), o la evidencia de una firma, con el mismo
 * detector de credenciales del verificador: por nombre y por contenido, sin imprimir nunca lo encontrado (solo el
 * archivo y el tipo de marcador). Con `--respaldo` (2026-10-29), busca además los valores literales de las contraseñas
 * y del alias de la keystore, que se leen del respaldo y nunca se escriben. Sale con 0 si está limpia, con 1 si hay
 * algo para revisar antes de compartirla y con 2 si se usó mal. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS.
 *
 *   node scripts/aab/revisar-registro.mjs <carpeta> [--respaldo <carpeta con credentials.json>]
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buscarCredenciales } from './credenciales.mjs';

const [carpeta, ...resto] = process.argv.slice(2);
const uso = () => {
  console.error('Uso: node scripts/aab/revisar-registro.mjs <carpeta de registro> [--respaldo <carpeta con credentials.json>]');
  process.exit(2);
};
if (!carpeta || !existsSync(carpeta) || !statSync(carpeta).isDirectory()) uso();
let respaldo = null;
if (resto.length) {
  if (resto.length !== 2 || resto[0] !== '--respaldo') uso();
  respaldo = resto[1];
  if (!existsSync(join(respaldo, 'credentials.json'))) uso();
}
let valoresLiterales = [];
if (respaldo) {
  const k = JSON.parse(readFileSync(join(respaldo, 'credentials.json'), 'utf8')).android?.keystore ?? {};
  valoresLiterales = [k.keystorePassword, k.keyPassword, k.keyAlias].filter(Boolean);
}
const r = buscarCredenciales(resolve(carpeta), { valoresLiterales });
valoresLiterales = null;
console.log(`registro revisado: ${r.archivos} archivo(s), ${r.bytes} bytes, ${r.hallazgos.length} hallazgo(s)${respaldo ? '; valores del respaldo buscados: sí' : ''}`);
for (const h of r.hallazgos) console.log(`- ${h.archivo}: ${h.marcador}`);
process.exit(r.hallazgos.length ? 1 : 0);
