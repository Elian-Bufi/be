// Levanta el PostgreSQL de esta carpeta y crea las bases que se le pasan (por omisión, be_test_comprension; la
// demostración de WP-DASHBOARD-PROFESIONAL usa be_test_dashboard). Queda corriendo hasta Ctrl+C, o hasta
// `node parar.mjs` desde otra terminal.
// Uso, en esta carpeta: `npm ci` (una vez; descarga PostgreSQL 16) y `node iniciar.mjs [bases…]`.
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { apagar, clave, datos, puerto, usuario } from './postgres.mjs';

const bases = process.argv.length > 2 ? process.argv.slice(2) : ['be_test_comprension'];
for (const base of bases) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(base)) throw new Error(`Nombre de base no válido: ${base}`);
}

const pg = new EmbeddedPostgres({
  databaseDir: datos,
  user: usuario,
  password: clave,
  port: puerto,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});
// En Windows, stop() de embedded-postgres mata el proceso a la fuerza (taskkill /f), y su gancho de salida lo llama con
// Ctrl+C. Se reemplaza por el apagado ordenado.
pg.stop = apagar;

if (!fs.existsSync(path.join(datos, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const cliente = pg.getPgClient();
await cliente.connect();
for (const base of bases) {
  const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [base]);
  if (rowCount === 0) await cliente.query(`CREATE DATABASE "${base}"`);
  console.log(rowCount === 0 ? `Base creada: ${base}` : `Base existente: ${base}`);
}
await cliente.end();
console.log(`PostgreSQL 16 listo en :${puerto} (usuario ${usuario}). Se apaga con Ctrl+C o con node parar.mjs.`);

// Si lo apagó `node parar.mjs`, este proceso también termina.
setInterval(() => {
  if (!fs.existsSync(path.join(datos, 'postmaster.pid'))) process.exit(0);
}, 2000);
