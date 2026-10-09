// Levanta el PostgreSQL de `datos` (ver postgres.mjs) y comprueba que existan las bases pedidas (por omisión,
// be_test_comprension; la demostración de WP-DASHBOARD-PROFESIONAL usa be_test_dashboard). Queda corriendo hasta Ctrl+C,
// o hasta `node parar.mjs` desde otra terminal con el mismo `BE_PG_DATOS`.
//
// Uso, en esta carpeta, con `npm ci` hecho una vez (descarga PostgreSQL 16):
//   BE_PG_DATOS=<clúster existente> node iniciar.mjs [bases…]   usa un clúster que ya existe; si falta, no arranca
//   node iniciar.mjs --crear [bases…]                           crea el clúster de ./datos y las bases que falten
// Sin `--crear` no se crea nada: un clúster o una base que faltan son un error, no una base vacía nueva.
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { apagar, clave, corriendo, datos, puerto, usuario } from './postgres.mjs';

const argumentos = process.argv.slice(2);
const crear = argumentos.includes('--crear');
const pedidas = argumentos.filter((a) => a !== '--crear');
const bases = pedidas.length > 0 ? pedidas : ['be_test_comprension'];
for (const base of bases) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(base)) throw new Error(`Nombre de base no válido: ${base}`);
}

const salir = (mensaje) => {
  console.error(mensaje);
  process.exit(1);
};
if (!fs.existsSync(path.join(datos, 'PG_VERSION')) && !crear) {
  salir(`No hay un clúster de PostgreSQL en ${datos}.\nPara usar uno existente, indicá su directorio en BE_PG_DATOS. Para crear uno nuevo ahí: node iniciar.mjs --crear [bases…].`);
}
if (await corriendo()) salir(`Ya hay un PostgreSQL corriendo sobre ${datos}: no se levanta otro.`);

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

console.log(`Directorio de datos: ${datos}`);
if (!fs.existsSync(path.join(datos, 'PG_VERSION'))) {
  console.log('Se crea un clúster nuevo (--crear).');
  await pg.initialise();
}
await pg.start();
const cliente = pg.getPgClient();
await cliente.connect();
const faltan = [];
for (const base of bases) {
  const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [base]);
  if (rowCount > 0) console.log(`Base existente: ${base}`);
  else if (crear) {
    await cliente.query(`CREATE DATABASE "${base}"`);
    console.log(`Base creada: ${base}`);
  } else faltan.push(base);
}
await cliente.end();
if (faltan.length > 0) {
  console.error(`Faltan las bases ${faltan.join(', ')} en ${datos}: no se crean sin --crear. Se apaga.`);
  await apagar();
  process.exit(1);
}
console.log(`PostgreSQL 16 listo en :${puerto} (usuario ${usuario}). Se apaga con Ctrl+C o con node parar.mjs.`);

// Si lo apagó `node parar.mjs`, este proceso también termina.
setInterval(() => {
  if (!fs.existsSync(path.join(datos, 'postmaster.pid'))) process.exit(0);
}, 2000);
