// Lee prisma/schema.prisma y deja su estructura en datos/esquema.json: secciones, modelos, campos, claves, relaciones y
// enumeraciones, con los comentarios de documentación (///) que citan el legajo. Es la base del DER y del diccionario de
// datos: nada se escribe a mano. Uso: node leer-esquema.mjs [ruta-del-esquema] [salida]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const rutaEsquema = process.argv[2] ?? join(raiz, 'prisma/schema.prisma');
const salida = process.argv[3] ?? join(aqui, '../datos/esquema.json');
const lineas = readFileSync(rutaEsquema, 'utf8').split(/\r?\n/);

const ESCALARES = new Set(['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes']);
const secciones = [];
const modelos = [];
const enums = [];
let seccion = null;
let doc = [];
let bloque = null;

const limpiarDoc = (d) => d.map((x) => x.replace(/^\/\/\/\s?/, '')).join(' ').replace(/\s+/g, ' ').trim();

for (let i = 0; i < lineas.length; i++) {
  const l = lineas[i];
  const t = l.trim();
  if (!bloque) {
    const s = t.match(/^\/\/ ─── (.+?) ─+$/);
    if (s) {
      seccion = { titulo: s[1].trim(), linea: i + 1 };
      secciones.push(seccion);
      doc = [];
      continue;
    }
    if (t.startsWith('///')) {
      doc.push(t);
      continue;
    }
    const m = t.match(/^(model|enum)\s+(\w+)\s*\{/);
    if (m) {
      bloque = { tipo: m[1], nombre: m[2], linea: i + 1, seccion: seccion?.titulo ?? null, doc: limpiarDoc(doc), cuerpo: [] };
      doc = [];
      continue;
    }
    if (t && !t.startsWith('//')) doc = [];
    continue;
  }
  if (t === '}') {
    if (bloque.tipo === 'model') modelos.push(procesarModelo(bloque));
    else enums.push(procesarEnum(bloque));
    bloque = null;
    continue;
  }
  bloque.cuerpo.push({ texto: l, linea: i + 1 });
}

function procesarEnum(b) {
  const valores = [];
  let d = [];
  for (const { texto } of b.cuerpo) {
    const t = texto.trim();
    if (t.startsWith('///')) {
      d.push(t);
      continue;
    }
    const v = t.match(/^(\w+)/);
    if (v && !t.startsWith('@@') && !t.startsWith('//')) {
      valores.push({ valor: v[1], doc: limpiarDoc(d) || undefined });
      d = [];
    }
  }
  return { nombre: b.nombre, seccion: b.seccion, linea: b.linea, doc: b.doc, valores };
}

function argumentos(texto) {
  // Separa «a: b, c: [d, e]» respetando corchetes y comillas.
  const partes = [];
  let prof = 0;
  let actual = '';
  let comillas = false;
  for (const ch of texto) {
    if (ch === '"') comillas = !comillas;
    if (!comillas && (ch === '[' || ch === '(')) prof++;
    if (!comillas && (ch === ']' || ch === ')')) prof--;
    if (ch === ',' && prof === 0 && !comillas) {
      partes.push(actual.trim());
      actual = '';
    } else actual += ch;
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}
function lista(v) {
  return (v ?? '').trim().replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean);
}

function atributosDe(resto) {
  // Devuelve [{nombre, args}] para cada @atributo(...) de un campo.
  const res = [];
  const re = /@([\w.]+)/g;
  let m;
  while ((m = re.exec(resto))) {
    let args = null;
    let j = re.lastIndex;
    if (resto[j] === '(') {
      let prof = 0;
      let k = j;
      for (; k < resto.length; k++) {
        if (resto[k] === '(') prof++;
        if (resto[k] === ')') {
          prof--;
          if (prof === 0) break;
        }
      }
      args = resto.slice(j + 1, k);
      re.lastIndex = k + 1;
    }
    res.push({ nombre: m[1], args });
  }
  return res;
}

function procesarModelo(b) {
  const campos = [];
  const unicos = [];
  const indices = [];
  let clavePrimariaCompuesta = null;
  let tabla = null;
  let d = [];
  for (const { texto, linea } of b.cuerpo) {
    const t = texto.trim();
    if (!t) continue;
    if (t.startsWith('///')) {
      d.push(t);
      continue;
    }
    if (t.startsWith('//')) continue;
    if (t.startsWith('@@')) {
      const a = atributosDe(t)[0];
      const args = argumentos(a.args ?? '');
      const columnas = lista(args.find((x) => x.startsWith('[')) ?? args.find((x) => x.startsWith('fields:'))?.slice(7));
      const nombre = args.find((x) => x.startsWith('name:') || x.startsWith('map:'))?.split(':')[1].trim().replace(/"/g, '');
      if (a.nombre === 'unique') unicos.push({ columnas, nombre });
      else if (a.nombre === 'index') indices.push({ columnas, nombre });
      else if (a.nombre === 'id') clavePrimariaCompuesta = columnas;
      else if (a.nombre === 'map') tabla = (a.args ?? '').replace(/"/g, '');
      d = [];
      continue;
    }
    const m = t.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!m) continue;
    const [, nombre, tipo, esLista, opcional, resto] = m;
    const atr = atributosDe(resto.replace(/\/\/.*$/, ''));
    const campo = {
      nombre,
      tipo,
      lista: !!esLista,
      opcional: !!opcional,
      escalar: ESCALARES.has(tipo),
      linea,
      doc: limpiarDoc(d) || undefined,
    };
    for (const a of atr) {
      if (a.nombre === 'id') campo.clavePrimaria = true;
      else if (a.nombre === 'unique') campo.unico = true;
      else if (a.nombre === 'default') campo.predeterminado = a.args;
      else if (a.nombre === 'map') campo.columna = a.args.replace(/"/g, '');
      else if (a.nombre === 'updatedAt') campo.actualizadoEn = true;
      else if (a.nombre.startsWith('db.')) campo.tipoFisico = a.nombre.slice(3) + (a.args ? `(${a.args})` : '');
      else if (a.nombre === 'relation') {
        const args = argumentos(a.args ?? '');
        const nombreRel = args.find((x) => /^"/.test(x) || x.startsWith('name:'));
        campo.relacion = {
          nombre: nombreRel ? nombreRel.replace(/^name:\s*/, '').replace(/"/g, '') : undefined,
          campos: lista(args.find((x) => x.startsWith('fields:'))?.slice(7)),
          referencias: lista(args.find((x) => x.startsWith('references:'))?.slice(11)),
          alBorrar: args.find((x) => x.startsWith('onDelete:'))?.split(':')[1].trim(),
        };
      }
    }
    campos.push(campo);
    d = [];
  }
  return {
    nombre: b.nombre,
    tabla: tabla ?? b.nombre,
    seccion: b.seccion,
    linea: b.linea,
    doc: b.doc,
    campos,
    clavePrimariaCompuesta,
    unicos,
    indices,
  };
}

// Relaciones: una por cada campo que lleva la clave foránea (fields: [...]).
const porNombre = new Map(modelos.map((m) => [m.nombre, m]));
const enumsPorNombre = new Set(enums.map((e) => e.nombre));
const relaciones = [];
for (const m of modelos) {
  for (const c of m.campos) {
    if (c.escalar || enumsPorNombre.has(c.tipo)) continue;
    c.referenciaA = c.tipo;
    if (!c.relacion?.campos?.length) continue;
    const fks = c.relacion.campos;
    const unicaEnLaHija =
      (fks.length === 1 && (m.campos.find((x) => x.nombre === fks[0])?.unico || m.campos.find((x) => x.nombre === fks[0])?.clavePrimaria)) ||
      m.unicos.some((u) => u.columnas.length === fks.length && u.columnas.every((x) => fks.includes(x))) ||
      (m.clavePrimariaCompuesta && m.clavePrimariaCompuesta.length === fks.length && m.clavePrimariaCompuesta.every((x) => fks.includes(x)));
    const obligatoria = !c.opcional;
    for (const fk of fks) {
      const f = m.campos.find((x) => x.nombre === fk);
      if (f) f.claveForanea = { modelo: c.tipo, campo: c.relacion.referencias[fks.indexOf(fk)] };
    }
    const destino = porNombre.get(c.tipo);
    const inversa = destino?.campos.find(
      (x) => x.tipo === m.nombre && (x.relacion?.nombre ?? null) === (c.relacion.nombre ?? null) && !x.relacion?.campos?.length,
    );
    relaciones.push({
      desde: m.nombre,
      campo: c.nombre,
      clavesForaneas: fks,
      hacia: c.tipo,
      referencias: c.relacion.referencias,
      nombre: c.relacion.nombre,
      alBorrar: c.relacion.alBorrar ?? null,
      // Cardinalidad vista desde la hija (la que tiene la clave foránea) y desde el padre.
      cardinalidadHija: unicaEnLaHija ? '0..1' : '0..N',
      cardinalidadPadre: obligatoria ? '1' : '0..1',
      inversa: inversa?.nombre ?? null,
      autorreferencia: m.nombre === c.tipo,
    });
  }
}

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(
  salida,
  JSON.stringify(
    {
      fuente: 'prisma/schema.prisma',
      lineas: lineas.length,
      cuenta: { secciones: secciones.length, modelos: modelos.length, enums: enums.length, relaciones: relaciones.length },
      secciones,
      modelos,
      enums,
      relaciones,
    },
    null,
    1,
  ),
);
console.log(`esquema: ${modelos.length} modelos, ${enums.length} enumeraciones, ${relaciones.length} relaciones, ${secciones.length} secciones → ${salida}`);
