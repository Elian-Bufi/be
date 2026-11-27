// Uso, desde la raíz del repositorio:
//   node docs/entrega/fuentes/herramientas/generar-der.mjs prisma/schema.prisma docs/entrega/fuentes/14-der-fuente.dbml docs/entrega/REPASO-DE-LA-ENTREGA-2026-11-23.md prisma/migrations <carpeta de salida>
// Escribe en la carpeta de salida 14-der-fuente.dbml, cifras.json (las cifras del anexo C) y piezas.md (por módulo: los datos,
// la tabla de tablas, el diagrama Mermaid, el diccionario y el diagrama de clases; la matriz de módulos y los conjuntos de valores).
// Las notas escritas a mano salen de la fuente DBML que se le pasa: se conservan de una generación a la siguiente.
// Regenera la fuente DBML del DER y las piezas en Markdown del 14 y del 15 desde prisma/schema.prisma,
// conservando las notas escritas a mano de la fuente DBML anterior (15/11) y del repaso del 23/11.
// Uso: node modelo.mjs <schema.prisma> <dbml viejo> <repaso.md> <migraciones> <carpeta de salida>
import fs from 'node:fs';
import path from 'node:path';

const [, , rutaEsquema, rutaDbml, rutaRepaso, rutaMigraciones, salida] = process.argv;
fs.mkdirSync(salida, { recursive: true });

// ---------- DBML viejo: módulos, colores y notas ----------
function leerDbml(texto, conSecciones) {
  const tablas = new Map();
  let seccion = null;
  const lineas = texto.replace(/\r/g, '').split('\n');
  let actual = null;
  const nota = (s) => (s.match(/note:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
  for (const l of lineas) {
    const sec = l.match(/^\/\/ ─── (.+?) ─+$/);
    if (sec && conSecciones) { seccion = sec[1]; continue; }
    const t = l.match(/^Table (\w+)(?: \[headercolor: (#[0-9A-Fa-f]+)\])? \{/);
    if (t) { actual = { nombre: t[1], color: t[2], seccion, columnas: new Map(), nota: '' }; tablas.set(t[1], actual); continue; }
    if (!actual) continue;
    if (l === '}') { actual = null; continue; }
    const n = l.match(/^  Note: '((?:[^'\\]|\\.)*)'/);
    if (n) { actual.nota = n[1]; continue; }
    const c = l.match(/^  (\w+) [^[]+(\[.*\])?$/);
    if (c && !/^\s*indexes/.test(l)) { const nn = nota(l); if (nn !== undefined) actual.columnas.set(c[1], nn); }
  }
  return tablas;
}
const viejo = leerDbml(fs.readFileSync(rutaDbml, 'utf8'), true);
const repaso = fs.readFileSync(rutaRepaso, 'utf8');
const bloqueRepaso = (repaso.match(/```dbml\n([\s\S]*?)```/) || [])[1] || '';
const delRepaso = leerDbml(bloqueRepaso, false);

const MODULOS = ['Identidad y acceso', 'Administración, derechos y auditoría', 'Profesionales, vínculos y consentimiento', 'Proceso de acompañamiento', 'Nutrición', 'Recetas, fotos y registro de comidas', 'Antropometría', 'Entrenamiento', 'Catálogos e importación', 'Formularios y hábitos', 'Lo que se comparte entre áreas', 'Herramientas del profesional', 'Novedades y avisos'];
const colorDe = {};
for (const t of viejo.values()) if (t.seccion && t.color) colorDe[t.seccion] = t.color;
// Las tablas que no estaban en la fuente del 15/11, con su módulo.
const MODULO_NUEVO = {
  alimento_compartido: 'Catálogos e importación', alimento_del_canon: 'Catálogos e importación', grupo_de_alimento: 'Catálogos e importación',
  medidas_caseras_de_alimento: 'Catálogos e importación', revision_administrativa_de_alimento: 'Catálogos e importación',
  autorizacion_de_historia_anterior: 'Lo que se comparte entre áreas',
  calculo_del_objetivo_nutricional: 'Nutrición', cita_de_respuesta_en_evaluacion_nutricional: 'Nutrición',
  conjunto_de_graficos: 'Herramientas del profesional', eleccion_de_conjunto_de_graficos: 'Herramientas del profesional',
  preparacion_de_plantilla_de_entrenamiento: 'Herramientas del profesional',
  copia_de_receta_del_recetario: 'Recetas, fotos y registro de comidas', decision_sobre_propuesta_al_recetario: 'Recetas, fotos y registro de comidas',
  propuesta_al_recetario: 'Recetas, fotos y registro de comidas', receta_del_recetario: 'Recetas, fotos y registro de comidas',
  variante_de_medio: 'Recetas, fotos y registro de comidas',
  vinculo_de_formulario_en_evaluacion: 'Formularios y hábitos',
  // Las del editor de Entrenamiento (DL-195 a DL-199, integradas en main).
  clasificacion_de_ejercicio: 'Catálogos e importación', decision_sobre_plantilla_de_be: 'Administración, derechos y auditoría',
  esfuerzo_de_sesion_de_entrenamiento: 'Entrenamiento', uno_rm_de_referencia: 'Entrenamiento',
  recorrido_guiado_visto: 'Herramientas del profesional',
};

// ---------- Esquema de Prisma ----------
const esquema = fs.readFileSync(rutaEsquema, 'utf8').replace(/\r/g, '');
const lineas = esquema.split('\n');
const modelos = [];
const enums = [];
let doc = [];
for (let i = 0; i < lineas.length; i++) {
  const l = lineas[i];
  if (/^\/\/\//.test(l)) { doc.push(l.replace(/^\/\/\/\s?/, '')); continue; }
  const m = l.match(/^(model|enum) (\w+) \{/);
  if (!m) { if (l.trim() === '' || !/^\/\//.test(l)) doc = []; continue; }
  const cuerpo = [];
  let j = i + 1;
  while (lineas[j] !== '}') cuerpo.push(lineas[j++]);
  const bloque = { nombre: m[2], doc: doc.join(' ').trim(), cuerpo };
  doc = [];
  (m[1] === 'model' ? modelos : enums).push(bloque);
  i = j;
}
const nombresEnum = new Set(enums.map((e) => e.nombre));
const nombresModelo = new Set(modelos.map((m) => m.nombre));
for (const e of enums) {
  e.valores = [];
  let d = [];
  for (const l of e.cuerpo) {
    const s = l.trim();
    if (s.startsWith('///')) { d.push(s.replace(/^\/\/\/\s?/, '')); continue; }
    const v = s.match(/^(\w+)/);
    if (v && !s.startsWith('//') && !s.startsWith('@@')) { e.valores.push(v[1]); d = []; }
  }
}
const ESCALARES = new Set(['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes']);
for (const m of modelos) {
  m.campos = [];
  m.relaciones = [];
  m.indices = [];
  m.tabla = m.nombre;
  let d = [];
  for (const l of m.cuerpo) {
    const s = l.trim();
    if (s.startsWith('///')) { d.push(s.replace(/^\/\/\/\s?/, '')); continue; }
    if (!s || s.startsWith('//')) { if (!s) d = []; continue; }
    if (s.startsWith('@@')) {
      const mp = s.match(/^@@map\("(\w+)"\)/);
      if (mp) m.tabla = mp[1];
      const ix = s.match(/^@@(id|unique|index)\(\[([^\]]+)\]/);
      if (ix) m.indices.push({ tipo: ix[1], campos: ix[2].split(',').map((x) => x.trim().replace(/\(.*\)$/, '')) });
      continue;
    }
    const f = s.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!f) continue;
    const [, nombre, tipo, lista, opcional, resto] = f;
    const comentario = (resto.match(/\/\/\/?\s?(.*)$/) || [])[1];
    const attrs = resto.replace(/\/\/.*$/, '');
    const docCampo = [...d, comentario].filter(Boolean).join(' ').trim();
    d = [];
    if (nombresModelo.has(tipo)) {
      const rel = attrs.match(/@relation\(([^)]*(?:\([^)]*\))?[^)]*)\)/);
      const fields = rel && rel[1].match(/fields:\s*\[([^\]]+)\]/);
      if (fields) {
        const refs = rel[1].match(/references:\s*\[([^\]]+)\]/);
        m.relaciones.push({ campos: fields[1].split(',').map((x) => x.trim()), destino: tipo, refs: refs[1].split(',').map((x) => x.trim()) });
      }
      continue;
    }
    if (lista && !ESCALARES.has(tipo) && !nombresEnum.has(tipo)) continue;
    const col = (attrs.match(/@map\("(\w+)"\)/) || [])[1] || nombre;
    const db = (attrs.match(/@db\.(\w+(?:\([^)]*\))?)/) || [])[1];
    let tipoSql;
    if (nombresEnum.has(tipo)) tipoSql = tipo;
    else if (db) {
      tipoSql = db.replace(/^Uuid$/, 'uuid').replace(/^Timestamptz/, 'timestamptz').replace(/^Timestamp/, 'timestamp').replace(/^Date$/, 'date').replace(/^Decimal/, 'numeric').replace(/^VarChar/, 'varchar').replace(/^Char/, 'char').replace(/^SmallInt$/, 'smallint').replace(/^Text$/, 'text').replace(/^Integer$/, 'integer').replace(/^Real$/, 'real').replace(/^DoublePrecision$/, 'double precision').replace(/^JsonB$/, 'jsonb').replace(/^Inet$/, 'inet').replace(/^ByteA$/, 'bytea').replace(/^Time/, 'time');
    } else tipoSql = { String: 'text', Int: 'integer', BigInt: 'bigint', Float: 'double precision', Decimal: 'numeric', Boolean: 'boolean', DateTime: 'timestamp(3)', Json: 'jsonb', Bytes: 'bytea' }[tipo];
    tipoSql = tipoSql.replace(/\s*,\s*/g, ',');
    if (lista) tipoSql += '[]';
    let def = null;
    const dm = attrs.match(/@default\((.*?)\)(?=\s|$|\s*@)/) || attrs.match(/@default\((.*)\)/);
    if (dm) {
      let v = dm[1];
      if (/^dbgenerated\("(.*)"\)$/.test(v)) def = '`' + v.match(/^dbgenerated\("(.*)"\)$/)[1] + '`';
      else if (/^now\(\)$/.test(v)) def = '`now()`';
      else if (/^(uuid|cuid)\(\)$/.test(v)) def = '`gen_random_uuid()`';
      else if (/^autoincrement\(\)$/.test(v)) def = 'INCREMENT';
      else if (/^".*"$/.test(v)) def = `'${v.slice(1, -1)}'`;
      else if (/^-?\d+(\.\d+)?$/.test(v) || v === 'true' || v === 'false') def = v;
      else if (/^\w+$/.test(v)) def = `'${v}'`;
      else def = '`' + v + '`';
    }
    m.campos.push({ nombre, col, tipo: tipoSql, tipoPrisma: tipo, opcional: !!opcional, id: /@id\b/.test(attrs), unico: /@unique\b/.test(attrs), def, doc: docCampo });
  }
}
const porNombre = new Map(modelos.map((m) => [m.nombre, m]));
const colDe = (m, campo) => (m.campos.find((c) => c.nombre === campo) || { col: campo }).col;
for (const m of modelos) {
  m.modulo = viejo.get(m.tabla)?.seccion || MODULO_NUEVO[m.tabla];
  if (!m.modulo) throw new Error('Sin módulo: ' + m.tabla);
  m.moduloN = MODULOS.indexOf(m.modulo) + 1;
}
for (const m of modelos) {
  for (const r of m.relaciones) {
    const dest = porNombre.get(r.destino);
    r.cols = r.campos.map((c) => colDe(m, c));
    r.destTabla = dest.tabla;
    r.destCols = r.refs.map((c) => colDe(dest, c));
    r.destMod = dest.moduloN;
    const campo = m.campos.find((c) => c.nombre === r.campos[0]);
    const unicoCompuesto = m.indices.some((ix) => (ix.tipo === 'unique' || ix.tipo === 'id') && ix.campos.length === r.campos.length && ix.campos.every((c) => r.campos.includes(c)));
    r.unoAUno = (r.campos.length === 1 && campo && (campo.unico || campo.id)) || unicoCompuesto;
    r.opcional = r.campos.some((c) => m.campos.find((x) => x.nombre === c)?.opcional);
  }
}
// Orden: el de la fuente vieja; las nuevas, al final de su módulo, en orden del esquema.
const ordenViejo = [...viejo.keys()];
modelos.sort((a, b) => a.moduloN - b.moduloN || ((ordenViejo.indexOf(a.tabla) + 1 || 1e6) - (ordenViejo.indexOf(b.tabla) + 1 || 1e6)));

// ---------- Notas ----------
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const desc = (s) => String(s).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
const COMUNES = { id: 'Identificador único de la fila.', procedencia: 'De dónde vino la fila: la fuente, la superficie (app o website), la operación, el caso de uso y el pedido que la produjo.', momento_de_registro: 'Cuándo BE guardó la fila.', momento_de_ocurrencia: 'Cuándo pasó el hecho en la realidad; vacío si no se sabe.' };
const SUELTAS = {
  ancho: 'El ancho, en píxeles.', alto: 'El alto, en píxeles.', grupo: 'El grupo del alimento.',
  medidas: 'Las medidas caseras, cada una con su equivalencia en gramos.',
  evaluacion_nutricional_id: 'La evaluación de Nutrición, si el vínculo es de esa área.',
  evaluacion_de_entrenamiento_id: 'La evaluación de Entrenamiento, si el vínculo es de esa área.',
  vinculado_en: 'Cuándo se vinculó.', desvinculado_en: 'Cuándo se desvinculó; vacío mientras sigue vinculado.',
  version_base_id: 'La versión de la que partió.', plan_de_entrenamiento_id: 'El plan de entrenamiento.',
  plan_nutricional_id: 'El plan nutricional.', conjunto_id: 'El conjunto de gráficos.',
};
// La nota más usada para un nombre de columna en la fuente anterior, para las columnas nuevas sin comentario.
const frecuentes = new Map();
for (const t of viejo.values()) for (const [col, n] of t.columnas) { const k = frecuentes.get(col) || new Map(); k.set(n, (k.get(n) || 0) + 1); frecuentes.set(col, k); }
const notaFrecuente = (col) => { const k = frecuentes.get(col); if (!k) return ''; return desc([...k.entries()].sort((a, b) => b[1] - a[1])[0][0]); };
const limpiarDoc =(s) => s.replace(/\s+/g, ' ').replace(/^(DL-\d+|[A-Z]{2,4}-\d+[A-Z]?)(\s*\([^)]*\))?\s*[—:-]\s*/, '').trim();
const COLUMNAS_NUEVAS = {
  'evaluacion_nutricional.notas': 'Las «Anotaciones» del profesional, hasta 4.000 caracteres: ninguna lectura de la persona las devuelve.',
  'evaluacion_de_entrenamiento.notas': 'Las «Anotaciones» del profesional, hasta 4.000 caracteres: ninguna lectura de la persona las devuelve.',
  'version_de_plan_de_entrenamiento.contenido': 'Fases, semanas, sesiones, bloques y prescripciones, con identificadores estables. Puede declarar la notación del esfuerzo (RPE); lo guardado en cada serie es siempre el RIR.',
  'receta.profesional_id': 'El profesional dueño; vacío en una receta del Recetario de BE.',
  'version_de_receta.autor_id': 'Quién escribió la versión; vacío solo en una receta del recetario sembrada por BE.',
};
function notaColumna(m, c) {
  if (COLUMNAS_NUEVAS[`${m.tabla}.${c.col}`]) return COLUMNAS_NUEVAS[`${m.tabla}.${c.col}`];
  const v = viejo.get(m.tabla)?.columnas.get(c.col) ?? delRepaso.get(m.tabla)?.columnas.get(c.col);
  if (v !== undefined) return desc(v);
  if (c.doc) return limpiarDoc(c.doc);
  return COMUNES[c.col] || SUELTAS[c.col] || notaFrecuente(c.col);
}
function notaTabla(m) {
  const v = viejo.get(m.tabla)?.nota || delRepaso.get(m.tabla)?.nota;
  if (v) return desc(v);
  return limpiarDoc(m.doc || '');
}
// Cambios que pide el repaso del 23/11 sobre tablas que ya estaban.
const NOTAS_NUEVAS = {
  receta: 'Una receta propia del profesional o, sin profesional, del Recetario de BE.',
  cita_de_respuesta_en_evaluacion_nutricional: 'Una respuesta de formulario citada en una evaluación de Nutrición: es una referencia, no una copia, y fija la versión vigente al citar.',
  calculo_del_objetivo_nutricional: 'Con qué se escribió una versión del objetivo: la toma de Antropometría o los datos a mano, los valores usados, el método y sus parámetros. Solo se agrega.',
  grupo_de_alimento: 'El grupo de un alimento, aparte de sus versiones: cambiarlo no crea una versión ni toca planes, recetas ni registros. El vigente es el de mayor número.',
  alimento_compartido: 'Histórica: un alimento cargado a mano que veían los demás profesionales. Desde que lo cargado a mano es propio de quien lo cargó, no se escribe.',
  alimento_del_canon: 'Un alimento que Administración sumó al catálogo verificado («Sumar al canon»), con su fuente y, si salió de una carga a mano, la carga de la que partió.',
  medidas_caseras_de_alimento: 'Las medidas caseras de un alimento (la unidad, la cucharada, la taza y la porción), cada una con su equivalencia en gramos. Cada cambio es una versión nueva.',
  revision_administrativa_de_alimento: 'Cada decisión de Administración sobre un alimento cargado a mano, contra la versión que vio: certificarlo con su fuente o marcar su equivalente verificado. La vigente es la de mayor número.',
  vinculo_de_formulario_en_evaluacion: 'Un formulario que la persona respondió, vinculado entero a una evaluación inicial de Nutrición o de Entrenamiento. Es una referencia, no una copia.',
  autorizacion_de_historia_anterior: 'La autorización de la persona para que el profesional nuevo de un área vea lo que pasó antes en esa área, en solo lectura y sin las notas privadas. Se puede retirar; cada cambio es una versión.',
  preparacion_de_plantilla_de_entrenamiento: 'El trabajo en curso de una plantilla de entrenamiento, privado y sin persona, que se guarda solo. Guardar la plantilla crea una versión nueva.',
  conjunto_de_graficos: 'Un enfoque: un conjunto de hasta seis gráficos con nombre, propio del profesional y reutilizable con cualquier persona. Guarda solo referencias, nunca datos de una persona.',
  eleccion_de_conjunto_de_graficos: 'El enfoque que el profesional eligió para una persona o para uno de sus planes con ella. Queda hasta que se cambie.',
};

// ---------- DBML ----------
const fks = modelos.flatMap((m) => m.relaciones.map((r) => ({ ...r, tabla: m.tabla, mod: m.moduloN })));
const totalColumnas = modelos.reduce((s, m) => s + m.campos.length, 0);
let dbml = `// BE · Diagrama entidad-relación · fuente en DBML
// Generado desde prisma/schema.prisma, el archivo con el que se crean las migraciones. No se edita a mano:
// si el esquema cambia, se vuelve a generar. Para verlo: https://dbdiagram.io/d → pegar este texto (o Import → DBML).

Project BE {
  database_type: 'PostgreSQL'
  Note: 'Modelo de datos de BE: ${modelos.length} tablas, ${fks.length} claves foráneas y ${enums.length} conjuntos de valores, en 13 módulos. Ninguna clave foránea borra en cascada: todas son restrict.'
}
`;
for (let k = 0; k < MODULOS.length; k++) {
  const mod = MODULOS[k];
  dbml += `\n// ─── ${mod} ${'─'.repeat(Math.max(3, 93 - mod.length))}\n`;
  for (const m of modelos.filter((x) => x.moduloN === k + 1)) {
    dbml += `\nTable ${m.tabla} [headercolor: ${colorDe[mod]}] {\n`;
    const colsFk = new Set(m.relaciones.flatMap((r) => r.cols));
    for (const c of m.campos) {
      const a = [];
      if (c.id) a.push('pk');
      const enPkCompuesta = m.indices.some((i) => i.tipo === 'id' && i.campos.includes(c.nombre));
      if (!c.opcional && !c.id && !enPkCompuesta) a.push('not null');
      if (c.unico) a.push('unique');
      if (c.def === 'INCREMENT') a.push('increment');
      else if (c.def) a.push(`default: ${c.def}`);
      const n = notaColumna(m, c);
      if (n) a.push(`note: '${esc(n)}'`);
      dbml += `  ${c.col} ${/[ [,]/.test(c.tipo) ? '"' + c.tipo + '"' : c.tipo}${a.length ? ' [' + a.join(', ') + ']' : ''}\n`;
    }
    const ix = m.indices.map((i) => {
      const cols = i.campos.map((x) => colDe(m, x));
      const t = cols.length > 1 ? `(${cols.join(', ')})` : cols[0];
      return `    ${t}${i.tipo === 'id' ? ' [pk]' : i.tipo === 'unique' ? ' [unique]' : ''}`;
    });
    if (ix.length) dbml += `\n  indexes {\n${ix.join('\n')}\n  }\n`;
    const nt = NOTAS_NUEVAS[m.tabla] || notaTabla(m);
    if (nt) dbml += `\n  Note: '${esc(nt)}'\n`;
    dbml += '}\n';
    m.notaFinal = nt;
  }
}
dbml += `\n// ─── Relaciones: una por clave foránea (${fks.length}) ─────────────────────────────────────────────\n\n`;
for (const r of fks) {
  const a = r.cols.length > 1 ? `(${r.cols.join(', ')})` : r.cols[0];
  const b = r.destCols.length > 1 ? `(${r.destCols.join(', ')})` : r.destCols[0];
  dbml += `Ref: ${r.tabla}.${a} ${r.unoAUno ? '-' : '>'} ${r.destTabla}.${b} [delete: restrict]\n`;
}
dbml += `\n// ─── Conjuntos de valores (${enums.length}) ─────────────────────────────────────────────\n\n`;
for (const e of enums) dbml += `Enum ${e.nombre} {\n${e.valores.map((v) => '  ' + v).join('\n')}\n}\n`;
dbml += `\n// ─── Módulos ─────────────────────────────────────────────\n`;
for (let k = 0; k < MODULOS.length; k++) {
  dbml += `\nTableGroup "${MODULOS[k]}" [color: ${colorDe[MODULOS[k]]}] {\n${modelos.filter((x) => x.moduloN === k + 1).map((m) => '  ' + m.tabla).join('\n')}\n}\n`;
}
fs.writeFileSync(path.join(salida, '14-der-fuente.dbml'), dbml);

// ---------- Cifras ----------
const migraciones = fs.readdirSync(rutaMigraciones, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
let checks = 0;
const sqls = fs.readdirSync(rutaMigraciones, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => { try { return fs.readFileSync(path.join(rutaMigraciones, d.name, 'migration.sql'), 'utf8'); } catch { return ''; } }).join('\n');
const conProcedencia = modelos.filter((m) => m.campos.some((c) => c.col === 'procedencia' && c.tipo === 'jsonb'));
{
  const conCheck = new Set();
  for (const s of sqls.split(';')) {
    if (!/jsonb_typeof\s*\(\s*"?procedencia/i.test(s)) continue;
    const t = s.match(/(?:ALTER|CREATE) TABLE\s+(?:IF NOT EXISTS\s+)?"?(\w+)/i);
    if (t) conCheck.add(t[1]);
  }
  checks = conCheck.size;
}
const entre = fks.filter((r) => r.mod !== r.destMod);
const cifras = {
  tablas: modelos.length, columnas: totalColumnas, fks: fks.length, entreModulos: entre.length,
  aIdentidad: entre.filter((r) => r.destMod === 1).length, unoAUno: fks.filter((r) => r.unoAUno).length,
  cadenas: fks.filter((r) => r.tabla === r.destTabla).length, enums: enums.length,
  jsonb: modelos.reduce((s, m) => s + m.campos.filter((c) => c.tipo === 'jsonb').length, 0),
  conProcedencia: conProcedencia.length, conCheck: checks, migraciones,
  nuevas: modelos.filter((m) => !viejo.has(m.tabla)).map((m) => m.tabla),
};
cifras.porModulo = MODULOS.map((mod, k) => {
  const ms = modelos.filter((m) => m.moduloN === k + 1);
  return {
    modulo: mod, tablas: ms.length, columnas: ms.reduce((s, m) => s + m.campos.length, 0),
    internas: fks.filter((r) => r.mod === k + 1 && r.destMod === k + 1).length,
    haciaOtros: fks.filter((r) => r.mod === k + 1 && r.destMod !== k + 1).length,
    llegan: fks.filter((r) => r.mod !== k + 1 && r.destMod === k + 1).length,
    asociaciones: fks.filter((r) => r.mod === k + 1).length,
  };
});
fs.writeFileSync(path.join(salida, 'cifras.json'), JSON.stringify(cifras, null, 1));

// ---------- Markdown ----------
const fmt = (n) => n.toLocaleString('es-AR');
const md = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const primeraFrase = (s) => s;
const ent = (t) => t.replace(/[^A-Za-z0-9_]/g, '_');
function mermaidModulo(k) {
  const ms = modelos.filter((m) => m.moduloN === k + 1);
  const dentro = new Set(ms.map((m) => m.tabla));
  const out = ['erDiagram'];
  const externas = new Set();
  for (const m of ms) {
    out.push(`  ${ent(m.tabla)} {`);
    const colsFk = new Set(m.relaciones.flatMap((r) => r.cols));
    for (const c of m.campos) {
      const k2 = [c.id || m.indices.some((i) => i.tipo === 'id' && i.campos.includes(c.nombre)) ? 'PK' : '', colsFk.has(c.col) ? 'FK' : '', c.unico ? 'UK' : ''].filter(Boolean).join(', ');
      out.push(`    ${c.tipo.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+$/, '')} ${c.col}${k2 ? ' ' + k2 : ''}`);
    }
    out.push('  }');
  }
  for (const m of ms) {
    for (const r of m.relaciones) {
      if (!dentro.has(r.destTabla)) externas.add(r.destTabla);
      const izq = r.unoAUno ? (r.opcional ? '|o' : '||') : (r.opcional ? '}o' : '}|');
      out.push(`  ${ent(m.tabla)} ${izq}--${r.opcional ? 'o|' : '||'} ${ent(r.destTabla)} : "${r.cols.join(', ')}"`);
    }
  }
  return { texto: out.join('\n'), externas: [...externas] };
}
function claseModulo(k) {
  const ms = modelos.filter((m) => m.moduloN === k + 1);
  const dentro = new Set(ms.map((m) => m.nombre));
  const out = ['classDiagram', '  direction LR'];
  for (const m of ms) {
    out.push(`  class ${m.nombre} {`, '    <<persistencia>>');
    const colsFk = new Set(m.relaciones.flatMap((r) => r.campos));
    for (const c of m.campos) if (!colsFk.has(c.nombre)) out.push(`    +${c.tipoPrisma}${c.opcional ? '?' : ''} ${c.nombre}`);
    out.push('  }');
  }
  for (const m of ms) {
    for (const r of m.relaciones) {
      const mult = r.unoAUno ? (r.opcional ? '0..1' : '1') : '*';
      out.push(`  ${m.nombre} "${mult}" --> "${r.opcional ? '0..1' : '1'}" ${r.destino} : ${r.campos.join(', ')}`);
    }
  }
  return out.join('\n');
}
let piezas = '';
for (let k = 0; k < MODULOS.length; k++) {
  const ms = modelos.filter((m) => m.moduloN === k + 1);
  const pm = cifras.porModulo[k];
  const mer = mermaidModulo(k);
  piezas += `<!-- MODULO ${String(k + 1).padStart(2, '0')} -->\n`;
  piezas += `- **${pm.tablas}** tablas\n- **${pm.internas}** relaciones internas\n- **${pm.haciaOtros}** claves hacia otros módulos\n- **${pm.llegan}** claves que llegan de otros\n\n`;
  piezas += `<!-- TABLA ${String(k + 1).padStart(2, '0')} -->\n| Tabla | Para qué | Campos | FK |\n| --- | --- | --- | --- |\n`;
  for (const m of ms) piezas += `| \`${m.tabla}\` | ${md(primeraFrase(m.notaFinal))} | ${m.campos.length} | ${m.relaciones.length} |\n`;
  piezas += `\n<!-- MERMAID ${String(k + 1).padStart(2, '0')} -->\n\`\`\`mermaid\n${mer.texto}\n\`\`\`\n\n`;
  piezas += `<!-- DICCIONARIO ${String(k + 1).padStart(2, '0')} -->\n| Tabla | Campo | Tipo | Clave | Nulo | Descripción |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const m of ms) {
    const colsFk = new Set(m.relaciones.flatMap((r) => r.cols));
    m.campos.forEach((c, i) => {
      const clave = [c.id || m.indices.some((x) => x.tipo === 'id' && x.campos.includes(c.nombre)) ? 'PK' : '', colsFk.has(c.col) ? 'FK' : '', c.unico ? 'UK' : ''].filter(Boolean).join(' ');
      piezas += `| ${i === 0 ? `**\`${m.tabla}\`**` : ' '} | \`${c.col}\` | ${c.tipo} | ${clave || ' '} | ${c.opcional ? 'sí' : ' '} | ${md(notaColumna(m, c)) || ' '} |\n`;
    });
  }
  piezas += `\n<!-- CLASES ${String(k + 1).padStart(2, '0')} -->\n\`\`\`mermaid\n${claseModulo(k)}\n\`\`\`\n\n`;
}
// La matriz de módulos: claves de la fila (origen) a la columna (destino).
piezas += `<!-- MATRIZ -->\n| De \\ A | ${MODULOS.map((_, k) => String(k + 1).padStart(2, '0')).join(' | ')} |\n|${' --- |'.repeat(MODULOS.length + 1)}\n`;
for (let a = 1; a <= MODULOS.length; a++) {
  const celdas = MODULOS.map((_, k) => { const n = fks.filter((r) => r.mod === a && r.destMod === k + 1).length; return n ? (a === k + 1 ? `**${n}**` : String(n)) : '·'; });
  piezas += `| ${String(a).padStart(2, '0')} ${MODULOS[a - 1]} | ${celdas.join(' | ')} |\n`;
}
piezas += '\n';
// Anexo B: conjuntos de valores y dónde se usan.
piezas += `<!-- ENUMS -->\n| Conjunto | Valores | Dónde se usa |\n| --- | --- | --- |\n`;
for (const e of enums) {
  const usos = modelos.flatMap((m) => m.campos.filter((c) => c.tipoPrisma === e.nombre).map((c) => `\`${m.tabla}.${c.col}\``));
  piezas += `| \`${e.nombre}\` | ${e.valores.join(' · ')} | ${usos.join(', ') || '—'} |\n`;
}
fs.writeFileSync(path.join(salida, 'piezas.md'), piezas);
console.log(JSON.stringify({ ...cifras, porModulo: undefined }, null, 0));
console.log(cifras.porModulo.map((p) => `${p.modulo}: ${p.tablas} tablas, ${p.internas} internas, ${p.haciaOtros} hacia, ${p.llegan} llegan, ${p.columnas} col`).join('\n'));
