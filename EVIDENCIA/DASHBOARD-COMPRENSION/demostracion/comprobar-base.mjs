// Comprueba, solo leyendo, el PostgreSQL de la demostración: qué directorio de datos está usando (tiene que ser el de
// BE_PG_DATOS: así se sabe que arrancó la copia indicada y no otra), que exista be_test_comprension y a qué bases están
// conectados los clientes (con la API arriba, solo a be_test_comprension). No escribe nada.
//
// Uso, con PostgreSQL arriba y la misma BE_PG_DATOS con la que se lo arrancó (en Git Bash):
//   BE_PG_DATOS='C:\...\datos' node EVIDENCIA/DASHBOARD-COMPRENSION/demostracion/comprobar-base.mjs
// El cliente `pg` es el del lanzador versionado (herramientas/postgres-local; si falta, `npm ci` ahí).
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(new URL('../../DASHBOARD-PROFESIONAL/herramientas/postgres-local/package.json', import.meta.url));
const { Client } = require('pg');
const puerto = Number(process.env.BE_PG_PUERTO ?? 55442);
const esperado = process.env.BE_PG_DATOS;
const normal = (p) => path.resolve(p).replaceAll('/', '\\').toLowerCase();

const cliente = new Client({ connectionString: `postgresql://be_test:be_test@localhost:${puerto}/postgres` });
try {
  await cliente.connect();
} catch (error) {
  console.log(`FALLA: PostgreSQL no responde en :${puerto} (${error.code ?? error.message}). Arrancalo primero.`);
  process.exit(1);
}
try {
  const fallas = [];
  const { rows: [{ data_directory: directorio }] } = await cliente.query('SHOW data_directory');
  console.log(`Directorio de datos en uso: ${directorio}`);
  if (!esperado) fallas.push('Falta BE_PG_DATOS para compararlo.');
  else if (normal(directorio) !== normal(esperado)) fallas.push(`No es el de BE_PG_DATOS (${esperado}).`);

  const { rowCount: base } = await cliente.query(`SELECT 1 FROM pg_database WHERE datname = 'be_test_comprension'`);
  console.log(`Base be_test_comprension: ${base ? 'existe' : 'NO EXISTE'}`);
  if (!base) fallas.push('Falta la base be_test_comprension.');

  const { rows: conexiones } = await cliente.query(`
    SELECT datname, count(*)::int AS n FROM pg_stat_activity
     WHERE backend_type = 'client backend' AND pid <> pg_backend_pid() AND datname IS NOT NULL
     GROUP BY 1 ORDER BY 1`);
  console.log(`Clientes conectados, por base: ${conexiones.map((c) => `${c.datname} (${c.n})`).join(', ') || 'ninguno'}`);
  const ajenas = conexiones.filter((c) => c.datname !== 'be_test_comprension');
  if (ajenas.length) fallas.push(`Hay clientes en otras bases: ${ajenas.map((c) => c.datname).join(', ')}.`);

  console.log(fallas.length ? `FALLA: ${fallas.join(' ')}` : 'OK: es el directorio indicado, la base está y ningún cliente usa otra base.');
  process.exitCode = fallas.length ? 1 : 0;
} finally {
  await cliente.end();
}
