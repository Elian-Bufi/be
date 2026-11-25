/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-12) · escribe la migración de la clasificación de los ejercicios del catálogo
 * base desde la tabla curada:
 *   prisma/datos/catalogo-base/clasificacion-de-ejercicios.csv → prisma/migrations/20261125120000_clasificacion_de_ejercicios/migration.sql
 *
 * La tabla es la **propuesta de BE, a validar por Dirección**: el grupo es la categoría de wger; el equipamiento, el material
 * de wger completado o corregido donde la nota dice «equipamiento propuesto»; el patrón y las articulaciones, con criterio de
 * entrenador. Va en español para que Elián la lea y la corrija; acá se traduce a los códigos del contrato.
 *
 * Uso: node scripts/catalogo-base/generar-clasificacion.mjs [--verificar]
 * Con --verificar no escribe nada: falla si la migración no es exactamente la que sale de la tabla, o si la tabla no tiene
 * los 186 ejercicios de ejercicios.json con valores conocidos. Solo módulos nativos de Node 22.
 *
 * Ojo: una migración aplicada no se cambia. Si Elián corrige la tabla después de integrar, va una migración nueva con los
 * cambios (este script se copia con otra carpeta), no esta regenerada.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CARPETA_DE_LA_CLASIFICACION = '20261125120000_clasificacion_de_ejercicios';
const TABLA = join(RAIZ, 'prisma', 'datos', 'catalogo-base', 'clasificacion-de-ejercicios.csv');
const EJERCICIOS = join(RAIZ, 'prisma', 'datos', 'catalogo-base', 'ejercicios.json');
const MIGRACION = join(RAIZ, 'prisma', 'migrations', CARPETA_DE_LA_CLASIFICACION, 'migration.sql');

export const GRUPO = { Pecho: 'CHEST', Espalda: 'BACK', Piernas: 'LEGS', Hombros: 'SHOULDERS', Brazos: 'ARMS', Abdomen: 'ABS', Pantorrillas: 'CALVES', Cardio: 'CARDIO' };
export const EQUIPO = {
  Barra: 'BARBELL',
  'Barra Z': 'EZ_BAR',
  Mancuernas: 'DUMBBELL',
  Kettlebell: 'KETTLEBELL',
  Polea: 'CABLE',
  Máquina: 'MACHINE',
  Banco: 'BENCH',
  'Banco inclinado': 'INCLINE_BENCH',
  'Barra de dominadas': 'PULL_UP_BAR',
  'Banda elástica': 'BAND',
  Colchoneta: 'MAT',
  'Pelota suiza': 'SWISS_BALL',
  'Peso corporal': 'BODYWEIGHT',
  Otro: 'OTHER',
};
export const PATRON = { Empuje: 'PUSH', Tracción: 'PULL', Sentadilla: 'SQUAT', Bisagra: 'HINGE', Zancada: 'LUNGE', Core: 'CORE', Cardio: 'CARDIO', Otro: 'OTHER' };
export const ARTICULACIONES = { Mono: 'SINGLE', Multi: 'MULTI' };

/** Un renglón del CSV con «;», con las comillas dobles de siempre. */
function campos(renglon) {
  const salida = [];
  let actual = '';
  let entre = false;
  for (let n = 0; n < renglon.length; n += 1) {
    const c = renglon[n];
    if (entre && c === '"' && renglon[n + 1] === '"') {
      actual += '"';
      n += 1;
    } else if (c === '"') entre = !entre;
    else if (c === ';' && !entre) {
      salida.push(actual);
      actual = '';
    } else actual += c;
  }
  salida.push(actual);
  return salida;
}

/** La tabla leída y traducida, con los problemas que tenga (vacío si está bien). */
export function leerLaClasificacion(texto, ejercicios) {
  const renglones = texto.replace(/\r\n/g, '\n').split('\n').filter((r) => r.trim() !== '');
  const [cabecera, ...resto] = renglones;
  const problemas = [];
  if (cabecera !== 'wgerId;nombre;nombre_en;grupo;equipamiento;patron;articulaciones;nota') problemas.push('la cabecera cambió');
  const filas = resto.map((r, n) => {
    const [wgerId, nombre, , grupo, equipamiento, patron, articulaciones] = campos(r);
    const equipo = equipamiento.split('+').map((x) => x.trim()).filter(Boolean);
    const fila = { wgerId: Number(wgerId), nombre, grupo: GRUPO[grupo], equipamiento: equipo.map((x) => EQUIPO[x]), patron: PATRON[patron], articulaciones: ARTICULACIONES[articulaciones] };
    if (!fila.grupo) problemas.push(`fila ${n + 2}: grupo «${grupo}»`);
    if (equipo.length === 0 || fila.equipamiento.some((x) => !x)) problemas.push(`fila ${n + 2}: equipamiento «${equipamiento}»`);
    if (!fila.patron) problemas.push(`fila ${n + 2}: patrón «${patron}»`);
    if (!fila.articulaciones) problemas.push(`fila ${n + 2}: articulaciones «${articulaciones}»`);
    return fila;
  });
  const esperados = new Set(ejercicios.map((e) => e.wgerId));
  const vistos = new Set(filas.map((f) => f.wgerId));
  if (vistos.size !== filas.length) problemas.push('hay un wgerId repetido');
  for (const id of esperados) if (!vistos.has(id)) problemas.push(`falta el ejercicio ${id}`);
  for (const id of vistos) if (!esperados.has(id)) problemas.push(`el ejercicio ${id} no es del catálogo base`);
  return { filas: [...filas].sort((a, b) => a.wgerId - b.wgerId), problemas };
}

const texto = (s) => `'${String(s).replace(/'/g, "''")}'`;

export function sqlDeLaClasificacion(filas) {
  const valores = filas.map(
    (f, n) =>
      `    (${texto(String(f.wgerId))}, ${texto(f.grupo)}, ARRAY[${f.equipamiento.map(texto).join(', ')}]::"EquipamientoDeEjercicio"[], ${texto(f.patron)}, ${texto(f.articulaciones)})${n === filas.length - 1 ? '' : ','} -- ${f.nombre.replace(/\n/g, ' ')}`,
  );
  return `${[
    `-- DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-12; docs/paquetes/WP-EDITOR-ENTRENAMIENTO-TANDA-1.md): la clasificación`,
    `-- de los ejercicios, para los filtros de «Agregar ejercicios» (grupo muscular, equipamiento, patrón y articulaciones).`,
    `-- GENERADA por scripts/catalogo-base/generar-clasificacion.mjs desde prisma/datos/catalogo-base/clasificacion-de-ejercicios.csv:`,
    `-- no se edita. Migración aditiva: cuatro tipos nuevos y cuatro columnas opcionales; nada de lo anterior se toca.`,
    `-- - La siembra va a la versión vigente de cada ejercicio de wger por su ítem externo: la del catálogo base o la de un`,
    `--   profesional que lo importó antes. Lo que no está (un ambiente sin el catálogo base) no se toca.`,
    `-- - Es la PROPUESTA de BE, a validar por Dirección (ET1-D12): corregirla después es una migración nueva.`,
    ``,
    `-- CreateEnum`,
    `CREATE TYPE "GrupoMuscularDeEjercicio" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'CALVES', 'CARDIO');`,
    ``,
    `-- CreateEnum`,
    `CREATE TYPE "EquipamientoDeEjercicio" AS ENUM ('BARBELL', 'EZ_BAR', 'DUMBBELL', 'KETTLEBELL', 'CABLE', 'MACHINE', 'BENCH', 'INCLINE_BENCH', 'PULL_UP_BAR', 'BAND', 'MAT', 'SWISS_BALL', 'BODYWEIGHT', 'OTHER');`,
    ``,
    `-- CreateEnum`,
    `CREATE TYPE "PatronDeMovimiento" AS ENUM ('PUSH', 'PULL', 'SQUAT', 'HINGE', 'LUNGE', 'CORE', 'CARDIO', 'OTHER');`,
    ``,
    `-- CreateEnum`,
    `CREATE TYPE "ArticulacionesDeEjercicio" AS ENUM ('SINGLE', 'MULTI');`,
    ``,
    `-- AlterTable`,
    `ALTER TABLE "version_de_ejercicio" ADD COLUMN     "articulaciones" "ArticulacionesDeEjercicio",`,
    `ADD COLUMN     "equipamiento" "EquipamientoDeEjercicio"[] DEFAULT ARRAY[]::"EquipamientoDeEjercicio"[],`,
    `ADD COLUMN     "grupo_muscular" "GrupoMuscularDeEjercicio",`,
    `ADD COLUMN     "patron" "PatronDeMovimiento";`,
    ``,
    `-- La siembra: ${filas.length} ejercicios del catálogo base.`,
    `UPDATE "version_de_ejercicio" v`,
    `   SET "grupo_muscular" = n."grupo"::"GrupoMuscularDeEjercicio",`,
    `       "equipamiento" = n."equipamiento",`,
    `       "patron" = n."patron"::"PatronDeMovimiento",`,
    `       "articulaciones" = n."articulaciones"::"ArticulacionesDeEjercicio"`,
    `  FROM (VALUES`,
    ...valores,
    `  ) AS n("id_externo", "grupo", "equipamiento", "patron", "articulaciones")`,
    `  JOIN "item_externo_de_catalogo" i ON i."proveedor" = 'WGER' AND i."id_externo" = n."id_externo"`,
    ` WHERE v."ejercicio_id" = i."ejercicio_id"`,
    `   AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id");`,
  ].join('\n')}\n`;
}

const esElPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esElPrincipal) {
  const verificar = process.argv.includes('--verificar');
  const { filas, problemas } = leerLaClasificacion(readFileSync(TABLA, 'utf8'), JSON.parse(readFileSync(EJERCICIOS, 'utf8')).ejercicios);
  if (problemas.length > 0) {
    console.error(problemas.join('\n'));
    process.exit(1);
  }
  const sql = sqlDeLaClasificacion(filas);
  if (verificar) {
    let actual = null;
    try {
      actual = readFileSync(MIGRACION, 'utf8');
    } catch {
      // no existe
    }
    if (actual !== sql) {
      console.error(`${MIGRACION.slice(RAIZ.length + 1)}: no es la que sale de la tabla. Correr node scripts/catalogo-base/generar-clasificacion.mjs`);
      process.exit(1);
    }
  } else {
    mkdirSync(dirname(MIGRACION), { recursive: true });
    writeFileSync(MIGRACION, sql);
    console.log(`${MIGRACION.slice(RAIZ.length + 1)}: ${filas.length} ejercicios`);
  }
}
