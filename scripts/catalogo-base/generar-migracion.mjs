/**
 * WP-CATALOGO-BASE (DL-141, tramos 2 y 3, y la correspondencia con la fuente) · escribe las migraciones del catálogo base
 * y su documento de fuentes desde los datos curados:
 *   prisma/datos/catalogo-base/ejercicios.json   → prisma/migrations/20261019120000_catalogo_base_de_ejercicios/migration.sql
 *   prisma/datos/catalogo-base/alimentos.json    → prisma/migrations/20261019120100_catalogo_base_de_alimentos/migration.sql
 *   prisma/datos/catalogo-base/correcciones.json → prisma/migrations/20261019210000_catalogo_base_correspondencia_de_cortes/migration.sql
 *   los tres                                     → docs/catalogo/FUENTES.md (las atribuciones, D-6, y la correspondencia)
 *
 * Uso: node scripts/catalogo-base/generar-migracion.mjs [--verificar]
 * Con --verificar no escribe nada: falla si algún archivo del repositorio no es exactamente el que sale de los datos.
 * Correrlo dos veces da los mismos archivos (UUID v5 y orden fijo). Solo módulos nativos de Node 22.
 *
 * Ojo: una migración ya aplicada en un ambiente no se puede cambiar (Prisma guarda su suma de verificación). Cambiar los
 * datos después de integrar es una migración nueva, no esta regenerada.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fuentesEnMarkdown } from './fuentes.mjs';
import { CARPETA_DE_ALIMENTOS, CARPETA_DE_CORRECCIONES, CARPETA_DE_EJERCICIOS, sqlDeAlimentos, sqlDeCorrecciones, sqlDeEjercicios } from './sql.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATOS = join(RAIZ, 'prisma', 'datos', 'catalogo-base');
const verificar = process.argv.includes('--verificar');

const leer = (archivo) => JSON.parse(readFileSync(join(DATOS, archivo), 'utf8'));
const ejercicios = leer('ejercicios.json');
const alimentos = leer('alimentos.json');
const correcciones = leer('correcciones.json');
const salidas = [
  { archivo: join(RAIZ, 'prisma', 'migrations', CARPETA_DE_EJERCICIOS, 'migration.sql'), texto: sqlDeEjercicios(ejercicios) },
  { archivo: join(RAIZ, 'prisma', 'migrations', CARPETA_DE_ALIMENTOS, 'migration.sql'), texto: sqlDeAlimentos(alimentos) },
  { archivo: join(RAIZ, 'prisma', 'migrations', CARPETA_DE_CORRECCIONES, 'migration.sql'), texto: sqlDeCorrecciones(correcciones, alimentos) },
  { archivo: join(RAIZ, 'docs', 'catalogo', 'FUENTES.md'), texto: fuentesEnMarkdown(ejercicios, alimentos, correcciones) },
];

let distintas = 0;
for (const { archivo, texto } of salidas) {
  const relativo = archivo.slice(RAIZ.length + 1);
  if (verificar) {
    let actual = null;
    try {
      actual = readFileSync(archivo, 'utf8');
    } catch {
      // no existe: cuenta como distinto
    }
    if (actual !== texto) {
      distintas += 1;
      console.error(`${relativo}: no es el que sale de los datos. Correr node scripts/catalogo-base/generar-migracion.mjs`);
    }
  } else {
    mkdirSync(dirname(archivo), { recursive: true });
    writeFileSync(archivo, texto);
    console.log(`${relativo}: ${texto.length} caracteres`);
  }
}
if (distintas > 0) process.exit(1);
