// El catálogo de BE tal como lo sembraron las migraciones, leído de los datos del repositorio (sin red ni base): el
// catálogo base de DL-141 (prisma/datos/catalogo-base), las correcciones de los cortes y los ocho alimentos de DL-119.
// La identidad y la versión de cada alimento salen de las mismas funciones que escribieron las migraciones (UUID v5),
// así que coinciden con las de cualquier base donde se aplicaron. Solo módulos nativos de Node 22.
import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparable, idDeAlimento, idDeVersionCorregida, idDeVersionDeAlimento } from '../../../../../../scripts/catalogo-base/sql.mjs';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..');
const leer = (...partes) => fs.readFileSync(join(RAIZ, ...partes), 'utf8');

const alimentos = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'alimentos.json'));
const correcciones = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'correcciones.json'));
const BASE = new Map(alimentos.alimentos.map((a) => [a.fdcId, a]));
const CORREGIDOS = new Map(correcciones.cortes.map((c) => [c.fdcId, c]));

/** Los ocho de DL-119, con su elemento, su versión, su nombre, su composición y su preparación, de su migración. */
export const DL119 = new Map(
  [
    ...leer('prisma', 'migrations', '20261005120000_recetas_medios_y_registro_v2', 'migration.sql').matchAll(
      /\('([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '(\{"referenceAmount"[^']*)', 'DISPONIBLE', '\{"fuente":"usda-fdc-sr-legacy"[^']*"externalId":"(\d+)"[^']*"preparationDescription":"([^"]+)"/g,
    ),
  ].map((m) => [m[5], { version: m[1], elemento: m[2], nombre: m[3], composicion: JSON.parse(m[4]), preparacion: m[6] }]),
);

/** Lo sembrado de demostración (WP-04): nunca entra en una receta, pero cuenta para saber si un nombre es ambiguo. */
export const DEMOSTRACION = [
  ...leer('prisma', 'migrations', '20260920100000_circuito_nutricional', 'migration.sql').matchAll(/'([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '\{"referenceAmount"/g),
].map((m) => ({ version: m[1], elemento: m[2], nombre: m[3] }));

/**
 * Un alimento por su FDC, como está hoy en el catálogo: fuente, identidad, versión vigente, nombre, preparación y
 * composición cada 100 g. Un corte corregido (correcciones.json) se cita por su versión corregida, con su nombre nuevo.
 */
export function alimentoPorFdc(fdc) {
  const a = BASE.get(fdc);
  if (a) {
    const c = CORREGIDOS.get(fdc);
    return {
      fuente: 'CATALOGO_BASE',
      fdcId: fdc,
      nombre: c ? c.nombre : a.nombre,
      preparacionDeLaFuente: c?.preparacion ?? a.preparacion,
      catalogItemId: idDeAlimento(fdc),
      catalogItemVersionId: c ? idDeVersionCorregida(fdc) : idDeVersionDeAlimento(fdc),
      composicion: a.composicion,
      grupo: a.grupo,
      descripcionUsda: a.usda.descripcion,
    };
  }
  const x = DL119.get(fdc);
  if (x) return { fuente: 'DL_119', fdcId: fdc, nombre: x.nombre, preparacionDeLaFuente: x.preparacion, catalogItemId: x.elemento, catalogItemVersionId: x.version, composicion: x.composicion, grupo: null, descripcionUsda: null };
  return null;
}

/**
 * Lo mismo que exige la prueba de contenido de las recetas originales (scripts/recetas-de-ejemplo.test.mjs): los
 * alimentos del catálogo (base, DL-119 y demostración) que tienen todas las palabras de lo que dice la receta, sin los
 * conectores. Si no hay ninguno, o hay más de uno y no uno solo que se llame exactamente así, la coincidencia es ambigua
 * y el ingrediente necesita su decisión escrita.
 */
const CONECTORES = new Set(['a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'u', 'y']);
const TODOS = [...alimentos.alimentos.map((a) => a.nombre), ...[...DL119.values()].map((x) => x.nombre), ...DEMOSTRACION.map((x) => x.nombre)];
export function candidatos(buscado) {
  const palabras = comparable(buscado)
    .split(' ')
    .filter((p) => !CONECTORES.has(p));
  return TODOS.filter((n) => palabras.every((p) => comparable(n).includes(p)));
}
// Más estricta que la de las originales: una coincidencia exacta resuelve solo si es de USDA (del catálogo base o de
// DL-119). Si lo único que se llama exactamente así es de demostración («Pechuga de pollo»), una búsqueda ingenua
// elegiría ese: es ambigua y necesita su decisión.
const DE_USDA = new Set([...alimentos.alimentos.map((a) => comparable(a.nombre)), ...[...DL119.values()].map((x) => comparable(x.nombre))]);
export function esAmbigua(buscado) {
  const c = candidatos(buscado);
  const exactas = c.filter((n) => comparable(n) === comparable(buscado));
  return c.length === 0 || (c.length > 1 && !(exactas.length === 1 && DE_USDA.has(comparable(exactas[0]))));
}
