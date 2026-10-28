#!/usr/bin/env node
// Arma la entrega legible de las recetas (encargo nocturno de Dirección del 2026-10-28, §12) desde los manifiestos, la
// vista combinada, el inventario del material visual y, si existe, el registro de fotos. Sin red ni dependencias:
//   PAQUETE-DE-GENERACION.md y paquete-de-generacion.json · el paquete para generar las 66 fotos en otra herramienta
//   RECETARIO.md                                         · las 50 nuevas, legibles, y la vista de las 66
//   datos/recetario.json y datos/contacto.json           · lo que leen los dos PDF (Typst)
// Uso, desde la raíz del repositorio: node EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs [--verificar]
// Con --verificar no escribe: falla si algún archivo no es el que sale de los datos.
import fs from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerAmpliacion, leerVistaCombinada } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/ampliacion.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CARPETA = resolve(AQUI, '..');
const RAIZ = resolve(CARPETA, '..', '..');
const verificar = process.argv.includes('--verificar');

const ampliacion = leerAmpliacion();
const vista = leerVistaCombinada();
const inventario = JSON.parse(fs.readFileSync(join(RAIZ, 'EVIDENCIA', 'MATERIAL-VISUAL', 'inventario.json'), 'utf8'));
const fichas = new Map(inventario.contenidos.filter((c) => c.tipo === 'receta').map((c) => [c.codigo, c]));
const RUTA_DEL_REGISTRO = join(CARPETA, 'fotos.json');
const registro = fs.existsSync(RUTA_DEL_REGISTRO) ? JSON.parse(fs.readFileSync(RUTA_DEL_REGISTRO, 'utf8')) : { fotos: {} };
const foto = (codigo) => registro.fotos[codigo] ?? null;

const ESTADO = { RAW: 'crudo', COOKED: 'cocido', AS_PURCHASED: 'como se compra' };
const numero = (x, d = 0) => (x === null || x === undefined ? 's/d' : Number(x).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const gramos = (g) => `${Number(g).toLocaleString('es-AR', { maximumFractionDigits: 1 })} g`;
const conFoto = vista.recetas.filter((r) => foto(r.codigo)).length;
const estadoDeFoto = (codigo) => {
  const f = foto(codigo);
  if (!f) return 'Falta la foto';
  if (f.revision?.direccion) return 'Foto aprobada por Dirección';
  if (f.revision?.visualDelAgente) return 'Foto revisada por el agente';
  return f.revision?.tecnica === 'VERIFICADA' ? 'Foto verificada técnicamente' : 'Foto con problemas técnicos';
};
/** El nombre del archivo que se guarda desde la herramienta de generación: el código y el nombre, en PNG. */
const archivoDeSalida = (r) => `${r.codigo}-${r.archivoDeFoto.replace(/^(R\d{3}|\d{2})-/, '').replace(/\.jpg$/, '')}.png`;

// ─── El paquete de generación ─────────────────────────────────────────────────────────────────────────────────

const paquete = vista.recetas.map((r) => {
  const f = fichas.get(r.codigo);
  return {
    codigo: r.codigo,
    nombre: r.nombre,
    origen: r.origen,
    familia: vista.familias[r.familia],
    archivoDeSalida: archivoDeSalida(r),
    archivoDeEntrega: r.archivoDeFoto,
    presentacion: f.presentacion,
    noDebe: f.noDebe,
    prompt: f.prompt,
    estado: estadoDeFoto(r.codigo),
  };
});
const PRIMER_LOTE = ['R017', 'R029', 'R037', 'R052'];

const md = [];
md.push('# Paquete de generación de las fotos de las 66 recetas');
md.push('');
md.push('**Para ejecutar en otra herramienta.** La sesión de Claude Code del 2026-10-28 no tenía con qué generar imágenes');
md.push('(**BLOQUEADO_POR_HERRAMIENTA**, ver `docs/paquetes/NOCTURNO-2026-10-28.md`). Este paquete es para la sesión de ChatGPT');
md.push('de Dirección, que sí genera imágenes. **Un prompt no es una foto:** hasta que no haya un archivo, la receta figura como');
md.push(`«falta la foto». Hoy: **${conFoto} de 66 con foto**.`);
md.push('');
md.push('## Paso a paso');
md.push('');
md.push('1. **Un primer lote variado, para ajustar el estilo antes de seguir:**');
md.push(`   ${PRIMER_LOTE.map((c) => `${c} (${vista.recetas.find((r) => r.codigo === c).nombre})`).join(', ')}.`);
md.push('   Si algo se aparta de la serie (luz, fondo, vajilla, escala), corregirlo en el pedido y repetir.');
md.push('2. **Una imagen por receta.** Pegar el prompt completo de cada una (ya trae el estilo común) y pedir formato horizontal:');
md.push('   4:3 si la herramienta lo ofrece; si no, 3:2 apaisado (la herramienta de fotos lo recorta a 4:3 al centro y lo dice).');
md.push('3. **Guardar cada imagen con su nombre de salida exacto** (por ejemplo, `R017-tarta-de-pollo-y-puerro.png`) en una sola');
md.push('   carpeta de originales. También las 16 originales van con su código (`R001-…`). No editar las imágenes: el original se');
md.push('   conserva tal cual.');
md.push('4. **Mirar cada una contra su ficha antes de seguir.** Es la receta correcta, una sola porción, sin ingredientes que no');
md.push('   estén en la receta, sin texto, manos ni marcas, con una cocción y una escala plausibles. Si no, regenerarla.');
md.push('5. **Preparar las entregas** (sin tocar los originales), desde la raíz del repositorio:');
md.push('');
md.push('   ```bash');
md.push('   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs preparar --originales <originales> --entrega <entrega> --vistas <vistas> --herramienta "ChatGPT, generación de imágenes"');
md.push('   ```');
md.push('');
md.push('   Deja en `<entrega>` los JPEG de 1600 × 1200 que se suben a BE, con los nombres que esperan las herramientas de carga;');
md.push('   en `<vistas>`, una hoja de revisión por foto y por tema (Claro y Azul noche), con los recortes reales de BE; y en');
md.push('   `<entrega>/fotos.json`, el registro: medidas nativas, transformaciones, SHA-256, duplicados y fotos parecidas.');
md.push('6. **Revisar las hojas** y anotar la revisión visual en el registro. Después:');
md.push('');
md.push('   ```bash');
md.push('   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs registrar --entrega <entrega>');
md.push('   node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs');
md.push('   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs');
md.push('   ```');
md.push('');
md.push('   Eso actualiza el inventario, la galería, el recetario y los PDF con las fotos que haya.');
md.push('7. **Cargar en test es otra autorización:** las herramientas de carga escriben solo con `--confirmo-escritura`.');
md.push('');
md.push('## Las 66, con su nombre de salida');
md.push('');
md.push('| Código | Receta | Origen | Guardar como | Se entrega como | Estado |');
md.push('|---|---|---|---|---|---|');
for (const p of paquete) md.push(`| ${p.codigo} | ${p.nombre} | ${p.origen === 'ORIGINAL' ? 'original' : 'nueva'} | \`${p.archivoDeSalida}\` | \`${p.archivoDeEntrega}\` | ${p.estado} |`);
md.push('');
md.push('## Los prompts');
md.push('');
for (const p of paquete) {
  md.push(`### ${p.codigo} · ${p.nombre}`);
  md.push('');
  md.push(`- **Guardar como:** \`${p.archivoDeSalida}\`. **Familia:** ${p.familia}. **Estado:** ${p.estado}.`);
  md.push(`- **Presentación:** ${p.presentacion}`);
  md.push(`- **No debe aparecer:** ${p.noDebe.join(', ')}.`);
  md.push('');
  md.push('```text');
  md.push(p.prompt);
  md.push('```');
  md.push('');
}
md.push('---');
md.push('Generado por `EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs` desde el inventario del material visual. No editar a mano.');

// ─── El recetario ─────────────────────────────────────────────────────────────────────────────────────────────

const r_ = [];
r_.push('# Recetario · las 50 recetas nuevas (y la vista de las 66)');
r_.push('');
r_.push('Ampliación de las recetas de ejemplo de BE (encargo nocturno de Dirección del 2026-10-28). Cocina familiar argentina para');
r_.push('personas que entrenan: comida reconocible, con cantidades claras. Es una **selección editorial**, no un ranking de lo');
r_.push('más consumido.');
r_.push('');
r_.push('**Cómo leer la composición:** sale del catálogo de BE (USDA FoodData Central · SR Legacy), sumando gramos por el valor');
r_.push('cada 100 g. Es una **estimación**, no una prescripción ni una medición:');
r_.push('');
r_.push('| Estado | |');
r_.push('|---|---|');
r_.push('| Calculado por el sistema | Lo comprueba la prueba de integración: API-REC-07 da lo mismo que este recetario |');
r_.push('| Revisado por el agente | Sí, el 2026-10-28 |');
r_.push('| Cocinado y pesado | **No** |');
r_.push('| Validado por una persona | **No** |');
r_.push('');
r_.push(`**Fotos:** ${conFoto} de 66. Las que faltan están en el paquete de generación (\`PAQUETE-DE-GENERACION.md\`).`);
r_.push('');
r_.push('## La vista de las 66');
r_.push('');
r_.push('| Código | Receta | Familia | Origen | Porciones | kcal / proteínas por porción | Foto |');
r_.push('|---|---|---|---|---|---|---|');
for (const r of vista.recetas) {
  const f = fichas.get(r.codigo);
  const c = f.composicionPorPorcion;
  r_.push(`| ${r.codigo} | ${r.nombre} | ${vista.familias[r.familia]} | ${r.origen === 'ORIGINAL' ? 'original' : 'nueva'} | ${r.porciones} | ${numero(c.energyKcal)} kcal · ${numero(c.proteinG, 1)} g | ${estadoDeFoto(r.codigo)} |`);
}
r_.push('');
r_.push('Las familias de las 16 originales son editoriales, para leerlas junto con las nuevas: su manifiesto congelado no las tiene.');
r_.push('');
if (ampliacion.reemplazos.length) {
  r_.push('## El reemplazo');
  r_.push('');
  for (const x of ampliacion.reemplazos) r_.push(`- **${x.codigo}:** «${x.propuesta}» → «${x.reemplazo}». ${x.motivo}`);
  r_.push('');
}
for (const r of ampliacion.recetas) {
  const c = r.composicion;
  r_.push(`## ${r.codigo} · ${r.nombre}`);
  r_.push('');
  r_.push(`**${r.familiaNombre}** · ${r.momento}. ${r.rendimiento} **Porción:** ${r.porcion.charAt(0).toLowerCase()}${r.porcion.slice(1)}`);
  r_.push('');
  r_.push(r.motivo);
  if (r.distingue) r_.push(`\n*${r.distingue}*`);
  if (r.nota) r_.push(`\n**Ojo:** ${r.nota}`);
  r_.push('');
  r_.push('| Parte | Ingrediente (del catálogo) | Cantidad | Estado |');
  r_.push('|---|---|---|---|');
  for (const i of r.ingredientes) r_.push(`| ${i.parte} | ${i.nombre} | ${gramos(i.cantidad.valor)} | ${ESTADO[i.estado]} |`);
  r_.push('');
  r_.push('**Preparación**');
  r_.push('');
  r.pasos.forEach((p, k) => r_.push(`${k + 1}. ${p}`));
  r_.push('');
  const t = r.tiempos;
  r_.push(`**Equipo:** ${r.equipo.join(', ')}. **Tiempos orientativos:** ${t.preparacion} min de preparación, ${t.coccion} min de cocción${t.reposo ? `, ${t.reposo} min de reposo` : ''}.`);
  if (r.practicas.length) r_.push(`\n**Para tener en cuenta:** ${r.practicas.join(' ')}`);
  r_.push('');
  r_.push('| Por porción | Energía | Proteínas | Carbohidratos | Grasas | Fibra |');
  r_.push('|---|---|---|---|---|---|');
  r_.push(`| ${r.porciones > 1 ? `1 de ${r.porciones}` : 'La receta'} | ${numero(c.porPorcion.energyKcal)} kcal | ${numero(c.porPorcion.proteinG, 1)} g | ${numero(c.porPorcion.carbohydrateG, 1)} g | ${numero(c.porPorcion.fatG, 1)} g | ${numero(c.porPorcion.fiberG, 1)} g |`);
  r_.push(`| La receta entera | ${numero(c.total.energyKcal)} kcal | ${numero(c.total.proteinG, 1)} g | ${numero(c.total.carbohydrateG, 1)} g | ${numero(c.total.fatG, 1)} g | ${numero(c.total.fiberG, 1)} g |`);
  r_.push('');
  const notas = [...r.procedencia.adaptaciones.map((a) => `Adaptación: ${a}`), ...r.procedencia.supuestos.map((s) => `Supuesto: ${s}`)];
  if (notas.length) {
    for (const n of notas) r_.push(`- ${n}`);
    r_.push('');
  }
  const decisiones = r.ingredientes.filter((i) => i.decision);
  if (decisiones.length) {
    r_.push('<details><summary>Por qué estos alimentos del catálogo</summary>');
    r_.push('');
    for (const i of [...new Map(decisiones.map((i) => [i.fdcId, i])).values()]) r_.push(`- **${i.nombre}:** ${i.decision}`);
    r_.push('');
    r_.push('</details>');
    r_.push('');
  }
  r_.push(`**Foto:** \`${r.foto.archivo}\` · ${estadoDeFoto(r.codigo)}.`);
  r_.push('');
}
r_.push('---');
r_.push(`${ampliacion.procedencia.comun} Generado por \`EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs\` desde el manifiesto de la ampliación. No editar a mano.`);

// ─── Los datos de los PDF ─────────────────────────────────────────────────────────────────────────────────────

const recetario = {
  generado: 'EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs',
  conFoto,
  familias: vista.familias,
  vista: vista.recetas.map((r) => {
    const c = fichas.get(r.codigo).composicionPorPorcion;
    return { codigo: r.codigo, nombre: r.nombre, familia: vista.familias[r.familia], origen: r.origen, porciones: r.porciones, kcal: numero(c.energyKcal), proteinas: numero(c.proteinG, 1), foto: estadoDeFoto(r.codigo) };
  }),
  reemplazos: ampliacion.reemplazos,
  recetas: ampliacion.recetas.map((r) => ({
    codigo: r.codigo,
    nombre: r.nombre,
    familia: r.familiaNombre,
    momento: r.momento,
    rendimiento: r.rendimiento,
    porcion: r.porcion,
    motivo: r.motivo,
    distingue: r.distingue,
    nota: r.nota,
    porciones: r.porciones,
    ingredientes: r.ingredientes.map((i) => ({ parte: i.parte, nombre: i.nombre, cantidad: gramos(i.cantidad.valor), estado: ESTADO[i.estado] })),
    pasos: r.pasos,
    equipo: r.equipo.join(', '),
    tiempos: `${r.tiempos.preparacion} min de preparación · ${r.tiempos.coccion} min de cocción${r.tiempos.reposo ? ` · ${r.tiempos.reposo} min de reposo` : ''}`,
    practicas: r.practicas,
    porPorcion: { kcal: numero(r.composicion.porPorcion.energyKcal), proteinas: numero(r.composicion.porPorcion.proteinG, 1), carbohidratos: numero(r.composicion.porPorcion.carbohydrateG, 1), grasas: numero(r.composicion.porPorcion.fatG, 1), fibra: numero(r.composicion.porPorcion.fiberG, 1) },
    total: { kcal: numero(r.composicion.total.energyKcal), proteinas: numero(r.composicion.total.proteinG, 1), carbohidratos: numero(r.composicion.total.carbohydrateG, 1), grasas: numero(r.composicion.total.fatG, 1), fibra: numero(r.composicion.total.fiberG, 1) },
    notas: [...r.procedencia.adaptaciones.map((a) => `Adaptación: ${a}`), ...r.procedencia.supuestos.map((s) => `Supuesto: ${s}`)],
    foto: { archivo: r.foto.archivo, estado: estadoDeFoto(r.codigo) },
  })),
};
const contacto = {
  generado: 'EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs',
  conFoto,
  recetas: vista.recetas.map((r) => ({
    codigo: r.codigo,
    nombre: r.nombre,
    familia: vista.familias[r.familia],
    origen: r.origen === 'ORIGINAL' ? 'original' : 'nueva',
    // La ruta de la miniatura desde la raíz de la carpeta de trabajo de los PDF (la arma pdf.mjs; Typst lee «/…» desde
    // la raíz y no desde la plantilla); null si falta la foto.
    imagen: foto(r.codigo) ? `/img/${r.codigo}.jpg` : null,
    estado: estadoDeFoto(r.codigo),
  })),
};

const salidas = [
  { archivo: join(CARPETA, 'PAQUETE-DE-GENERACION.md'), texto: `${md.join('\n')}\n` },
  { archivo: join(CARPETA, 'paquete-de-generacion.json'), texto: `${JSON.stringify({ paquete: 'Las 66 fotos de recetas, para generar en otra herramienta', conFoto, primerLote: PRIMER_LOTE, recetas: paquete }, null, 1)}\n` },
  { archivo: join(CARPETA, 'RECETARIO.md'), texto: `${r_.join('\n')}\n` },
  { archivo: join(CARPETA, 'datos', 'recetario.json'), texto: `${JSON.stringify(recetario, null, 1)}\n` },
  { archivo: join(CARPETA, 'datos', 'contacto.json'), texto: `${JSON.stringify(contacto, null, 1)}\n` },
];
let distintas = 0;
for (const { archivo, texto } of salidas) {
  const rel = relative(RAIZ, archivo).replace(/\\/g, '/');
  if (verificar) {
    if (!fs.existsSync(archivo) || fs.readFileSync(archivo, 'utf8') !== texto) {
      distintas++;
      console.error(`${rel}: no es el que sale de los datos. Correr armar-entrega.mjs`);
    }
  } else {
    fs.mkdirSync(dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, texto);
    console.log(`${rel}: ${texto.length} caracteres`);
  }
}
if (distintas) process.exit(1);
if (verificar) console.log('Sin diferencias: la entrega es la que sale de los datos.');
