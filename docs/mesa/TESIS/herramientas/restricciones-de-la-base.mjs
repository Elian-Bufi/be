// Lista, leyendo el SQL de las migraciones en orden, los índices únicos parciales vigentes al final (los que dicen «uno
// solo mientras…»), con su tabla y la migración que los crea. Las CANTIDADES de reglas no salen de acá sino del catálogo
// de una base real: ver restricciones-en-base.cjs y datos/restricciones-en-base.json.
// Uso: node restricciones-de-la-base.mjs → datos/indices-parciales.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const dir = join(raiz, 'prisma/migrations');
const migraciones = readdirSync(dir).filter((d) => /^\d{14}_/.test(d)).sort();
const quitarComentarios = (s) => s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const nombre = (s) => s.replace(/"/g, '').replace(/^public\./, '').toLowerCase();

const funciones = new Map();
const disparadores = new Map(); // tabla.nombre → { tabla }
const unicos = new Map(); // nombre → { parcial }
const checks = new Map(); // tabla.nombre
const foraneas = new Map();
const ejemplos = { parciales: [], checks: [] };

for (const m of migraciones) {
  const sql = quitarComentarios(readFileSync(join(dir, m, 'migration.sql'), 'utf8'));
  // Sentencias aproximadas: el SQL de funciones usa $$…$$; se recorta por ; fuera de los bloques $$.
  const partes = [];
  let actual = '';
  let enDolar = false;
  for (let i = 0; i < sql.length; i++) {
    if (sql.startsWith('$$', i)) {
      enDolar = !enDolar;
      actual += '$$';
      i++;
      continue;
    }
    if (sql[i] === ';' && !enDolar) {
      partes.push(actual.trim());
      actual = '';
    } else actual += sql[i];
  }
  for (const p of partes) {
    let r;
    if ((r = p.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+("?[\w.]+"?)/i))) funciones.set(nombre(r[1]), m);
    else if ((r = p.match(/^DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?("?[\w.]+"?)/i))) funciones.delete(nombre(r[1]));
    else if ((r = p.match(/^CREATE\s+(?:CONSTRAINT\s+)?TRIGGER\s+("?\w+"?)[\s\S]*?\bON\s+("?[\w.]+"?)/i))) disparadores.set(`${nombre(r[2])}.${nombre(r[1])}`, m);
    else if ((r = p.match(/^DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?("?\w+"?)\s+ON\s+("?[\w.]+"?)/i))) disparadores.delete(`${nombre(r[2])}.${nombre(r[1])}`);
    else if ((r = p.match(/^CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?("?\w+"?)\s+ON\s+("?[\w.]+"?)/i))) {
      const parcial = /\)\s*WHERE\s+/i.test(p);
      const def = p.replace(/\s+/g, ' ').match(/\bON\s+\S+\s*(?:USING\s+\w+\s*)?(\([\s\S]*)$/i)?.[1] ?? '';
      unicos.set(nombre(r[1]), { parcial, tabla: nombre(r[2]), migracion: m, definicion: def.replace(/"/g, '') });
      if (parcial) ejemplos.parciales.push({ indice: nombre(r[1]), tabla: nombre(r[2]), migracion: m });
    } else if ((r = p.match(/^DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?("?[\w.]+"?)/i))) unicos.delete(nombre(r[1]));
    else if ((r = p.match(/^ALTER\s+TABLE\s+(?:ONLY\s+)?("?[\w.]+"?)([\s\S]*)$/i))) {
      const tabla = nombre(r[1]);
      for (const c of r[2].matchAll(/ADD\s+CONSTRAINT\s+("?\w+"?)\s+(CHECK|FOREIGN\s+KEY|UNIQUE)/gi)) {
        const k = `${tabla}.${nombre(c[1])}`;
        if (/^CHECK/i.test(c[2])) {
          checks.set(k, m);
          if (ejemplos.checks.length < 400) ejemplos.checks.push({ restriccion: nombre(c[1]), tabla, migracion: m });
        } else if (/^FOREIGN/i.test(c[2])) foraneas.set(k, m);
        else unicos.set(nombre(c[1]), { parcial: false, tabla, migracion: m });
      }
      for (const c of r[2].matchAll(/DROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?("?\w+"?)/gi)) {
        const k = `${tabla}.${nombre(c[1])}`;
        checks.delete(k);
        foraneas.delete(k);
        unicos.delete(nombre(c[1]));
      }
    } else if ((r = p.match(/^CREATE\s+TABLE\s+("?[\w.]+"?)\s*\(([\s\S]*)\)\s*$/i))) {
      const tabla = nombre(r[1]);
      for (const c of r[2].matchAll(/CONSTRAINT\s+("?\w+"?)\s+CHECK/gi)) checks.set(`${tabla}.${nombre(c[1])}`, m);
    }
  }
}

const parciales = [...unicos.entries()].filter(([, u]) => u.parcial).map(([n, u]) => ({ indice: n, tabla: u.tabla, migracion: u.migracion, definicion: u.definicion }));
writeFileSync(join(aqui, '../datos/indices-parciales.json'), JSON.stringify({ _que_es: 'Índices únicos parciales vigentes al final de las migraciones (lectura del SQL).', indices: parciales }, null, 1));
console.log(`índices únicos parciales: ${parciales.length}`);
