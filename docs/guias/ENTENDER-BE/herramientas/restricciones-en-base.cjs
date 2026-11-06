// Aplica las migraciones de la versión de referencia en una base NUEVA y temporal de un PostgreSQL 16 local, cuenta las
// reglas en el catálogo (tablas, enumeraciones, claves, índices únicos y parciales, CHECK, disparadores y funciones) y
// borra la base. No toca ninguna otra base y no imprime credenciales.
// Uso (la URL apunta a la base de administración; el usuario necesita permiso para crear bases):
//   BE_TESIS_PG_URL=postgresql://usuario:clave@localhost:puerto/postgres PG_MODULO=<ruta del paquete pg> node restricciones-en-base.cjs
// Resultado: datos/restricciones-en-base.json
const fs = require('fs');
const path = require('path');
const { Client } = require(process.env.PG_MODULO || 'pg');

const url = process.env.BE_TESIS_PG_URL;
if (!url) throw new Error('falta BE_TESIS_PG_URL');
const BASE = 'be_tesis_restricciones_tmp';
const conBase = (b) => url.replace(/\/\w+$/, '/' + b);
const dir = path.resolve(__dirname, '../../../../prisma/migrations');

(async () => {
  const adm = new Client({ connectionString: conBase('postgres') });
  await adm.connect();
  await adm.query(`DROP DATABASE IF EXISTS ${BASE}`);
  await adm.query(`CREATE DATABASE ${BASE}`);
  const c = new Client({ connectionString: conBase(BASE) });
  await c.connect();
  const migs = fs.readdirSync(dir).filter((d) => /^\d{14}_/.test(d)).sort();
  for (const m of migs) await c.query(fs.readFileSync(path.join(dir, m, 'migration.sql'), 'utf8'));
  const q = async (s) => (await c.query(s)).rows[0];
  const publico = `join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'`;
  const r = {
    migraciones: migs.length,
    tablas: (await q(`select count(*)::int n from pg_class c ${publico} and c.relkind='r'`)).n,
    funcionesDeDisparador: (await q(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prorettype='trigger'::regtype`)).n,
    funcionesTotales: (await q(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'`)).n,
    disparadores: (await q(`select count(*)::int n from pg_trigger t join pg_class c on c.oid=t.tgrelid ${publico} and not t.tgisinternal`)).n,
    disparadoresDeRestriccion: (await q(`select count(*)::int n from pg_trigger t join pg_class c on c.oid=t.tgrelid ${publico} and not t.tgisinternal and t.tgconstraint <> 0`)).n,
    indicesUnicos: (await q(`select count(*)::int n from pg_index i join pg_class c on c.oid=i.indrelid ${publico} and i.indisunique and not i.indisprimary`)).n,
    indicesUnicosParciales: (await q(`select count(*)::int n from pg_index i join pg_class c on c.oid=i.indrelid ${publico} and i.indisunique and not i.indisprimary and i.indpred is not null`)).n,
    clavesPrimarias: (await q(`select count(*)::int n from pg_constraint where contype='p' and connamespace='public'::regnamespace`)).n,
    checks: (await q(`select count(*)::int n from pg_constraint where contype='c' and connamespace='public'::regnamespace`)).n,
    clavesForaneas: (await q(`select count(*)::int n from pg_constraint where contype='f' and connamespace='public'::regnamespace`)).n,
    foraneasRestrict: (await q(`select count(*)::int n from pg_constraint where contype='f' and connamespace='public'::regnamespace and confdeltype='r'`)).n,
    enums: (await q(`select count(*)::int n from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typtype='e'`)).n,
    version: (await q(`select version() v`)).v.split(',')[0],
  };
  await c.end();
  await adm.query(`DROP DATABASE ${BASE}`);
  await adm.end();
  r.fecha = new Date().toISOString();
  r.como = `Las ${migs.length} migraciones aplicadas en orden en una base nueva y temporal, contadas en el catálogo y borrada la base.`;
  fs.writeFileSync(path.resolve(__dirname, '../datos/restricciones-en-base.json'), JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => {
  console.error('ERROR', String(e.message).replace(/postgres(ql)?:\/\/\S+/g, '<url>'));
  process.exit(1);
});
