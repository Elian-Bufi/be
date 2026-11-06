// El verificador del material visual: sin red, sin API y sin dependencias (Node 22). Comprueba que el inventario
// corresponde al manifiesto de las recetas y a la selección, que los nombres de archivo son estables y únicos, que nada
// sin archivo se presenta como imagen, y que los archivos reales existen y miden lo que dice el inventario. Con --fotos,
// revisa además las fotos de recetas de una carpeta con los mismos criterios que `recetas.mjs revisar` (problemasDeLaFoto).
// Uso, desde la raíz del repositorio:
//   node EVIDENCIA/MATERIAL-VISUAL/herramientas/verificar.mjs [--fotos <carpeta>] [--imagenes <carpeta con NN-… o A..-/E..->]
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archivoEsperado, ESTADOS, fotoDe, leerManifiesto, medidasDeImagen, problemasDeLaFoto, sinTildes } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { fotoDe as fotoDeLaAmpliacion, leerAmpliacion } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/ampliacion.mjs';
import { ALIMENTOS, EJERCICIOS, RECETAS } from './seleccion.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CARPETA = join(AQUI, '..');
const RAIZ = join(CARPETA, '..', '..');
const arg = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i > 0 ? process.argv[i + 1] : null;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ESTADOS_DE_REVISION = ['PENDIENTE_DE_GENERACION', 'ARCHIVO_REAL_PENDIENTE_DE_REVISION_HUMANA'];

const problemas = [];
const avisos = [];
const mal = (texto) => problemas.push(texto);

const inventario = JSON.parse(fs.readFileSync(join(CARPETA, 'inventario.json'), 'utf8'));
const manifiesto = leerManifiesto();
const ampliacion = leerAmpliacion();
const porTipo = (t) => inventario.contenidos.filter((c) => c.tipo === t);
const recetas = porTipo('receta');
const alimentos = porTipo('alimento');
const ejercicios = porTipo('ejercicio');

// Cantidades de los encargos: las 16 recetas originales más las 50 de la ampliación del 2026-10-28 (66), hasta 16
// alimentos y 15 ejercicios. El tope de 32 contenidos de Nutrición era del encargo del 2026-10-27; el del 2026-10-28
// amplía las recetas a 66 y deja los alimentos como estaban.
const esperadas = manifiesto.recetas.length + ampliacion.recetas.length;
if (recetas.length !== esperadas) mal(`recetas: ${recetas.length} en el inventario y ${esperadas} en los dos manifiestos`);
if (alimentos.length > 16) mal(`alimentos: ${alimentos.length} (hasta 16)`);
if (ejercicios.length !== 15) mal(`ejercicios: ${ejercicios.length} (se esperan 15)`);

// Identificadores y archivos únicos.
const repetidos = (lista) => lista.filter((x, i) => lista.indexOf(x) !== i);
for (const [que, lista] of [
  ['identificadores', inventario.contenidos.map((c) => c.id)],
  ['archivos', inventario.contenidos.map((c) => c.archivo)],
  ['alimentos del catálogo', alimentos.map((a) => a.identificador.catalogItemId)],
  ['nombres de alimentos', alimentos.map((a) => a.nombre)],
  ['ejercicios del catálogo', ejercicios.filter((e) => e.identificador.exerciseId).map((e) => e.identificador.exerciseId)],
  ['nombres de ejercicios', ejercicios.map((e) => e.nombre)],
]) {
  const r = repetidos(lista);
  if (r.length) mal(`${que} repetidos: ${[...new Set(r)].join(', ')}`);
}

// Recetas: cada una del manifiesto, con su archivo esperado, sus ingredientes tal cual y su presentación.
for (const r of manifiesto.recetas) {
  const c = recetas.find((x) => x.identificador.numero === r.numero);
  if (!c) {
    mal(`receta ${r.numero}: falta en el inventario`);
    continue;
  }
  if (c.nombre !== r.nombre) mal(`receta ${r.numero}: el nombre es «${c.nombre}» y el manifiesto dice «${r.nombre}»`);
  if (c.archivo !== r.imagen || c.archivo !== archivoEsperado(r)) mal(`receta ${r.numero}: el archivo es «${c.archivo}» y se espera «${r.imagen}»`);
  if (!RECETAS[r.numero]) mal(`receta ${r.numero}: falta su presentación en seleccion.mjs`);
  const ingredientes = r.ingredientes.map((i) => `${i.nombre}|${i.cantidad.valor} ${i.cantidad.unidad}|${i.estado}`).join(';');
  const delInventario = c.ingredientes.map((i) => `${i.nombre}|${i.cantidad}|${i.estado}`).join(';');
  if (ingredientes !== delInventario) mal(`receta ${r.numero}: los ingredientes del inventario no son los del manifiesto`);
  for (const i of r.ingredientes) if (!c.prompt.includes(i.nombre)) mal(`receta ${r.numero}: el prompt no nombra «${i.nombre}»`);
}

// Recetas nuevas: cada una de la ampliación, con su código, su archivo esperado, sus ingredientes tal cual y su presentación.
for (const r of ampliacion.recetas) {
  const c = recetas.find((x) => x.identificador.codigo === r.codigo);
  if (!c) {
    mal(`receta ${r.codigo}: falta en el inventario`);
    continue;
  }
  if (c.id !== `receta-${r.codigo}` || c.codigo !== r.codigo || c.origen !== 'NUEVA') mal(`receta ${r.codigo}: el identificador, el código o el origen`);
  if (c.nombre !== r.nombre) mal(`receta ${r.codigo}: el nombre es «${c.nombre}» y el manifiesto dice «${r.nombre}»`);
  if (c.archivo !== r.foto.archivo) mal(`receta ${r.codigo}: el archivo es «${c.archivo}» y se espera «${r.foto.archivo}»`);
  const ingredientes = r.ingredientes.map((i) => `${i.nombre}|${i.cantidad.valor} ${i.cantidad.unidad}|${i.estado}`).join(';');
  const delInventario = c.ingredientes.map((i) => `${i.nombre}|${i.cantidad}|${i.estado}`).join(';');
  if (ingredientes !== delInventario) mal(`receta ${r.codigo}: los ingredientes del inventario no son los del manifiesto`);
  if (!c.prompt.includes(`«${r.nombre}»`) || !c.prompt.includes(r.foto.presentacion)) mal(`receta ${r.codigo}: el prompt no nombra la receta o no lleva su presentación`);
}
const codigos = recetas.map((x) => x.codigo);
if (new Set(codigos).size !== codigos.length || codigos.some((x) => !/^R\d{3}$/.test(x ?? ''))) mal('recetas: los códigos R001 a R066 no son únicos o no tienen la forma R000');

// Alimentos: identificadores del catálogo, estado válido y nombre de archivo estable.
for (const a of alimentos) {
  const s = ALIMENTOS.find((x) => `alimento-${x.codigo}` === a.id);
  if (!s) mal(`${a.id}: no está en seleccion.mjs`);
  if (!UUID.test(a.identificador.catalogItemId) || !UUID.test(a.identificador.catalogItemVersionId)) mal(`${a.id}: identificadores del catálogo inválidos`);
  if (!ESTADOS.includes(a.estado)) mal(`${a.id}: estado «${a.estado}» (RAW, COOKED o AS_PURCHASED)`);
  if (s && a.archivo !== `${s.codigo}-${sinTildes(s.nombre)}.jpg`) mal(`${a.id}: el archivo «${a.archivo}» no es el estable`);
}
// Si un alimento también está en una receta del manifiesto, tiene que ser la misma identidad y versión.
const delManifiesto = new Map(manifiesto.recetas.flatMap((r) => r.ingredientes.map((i) => [i.catalogItemId, i.catalogItemVersionId])));
for (const a of alimentos) {
  const v = delManifiesto.get(a.identificador.catalogItemId);
  if (v && v !== a.identificador.catalogItemVersionId) mal(`${a.id}: la versión ${a.identificador.catalogItemVersionId} no es la del manifiesto (${v})`);
  if (!delManifiesto.has(a.identificador.catalogItemId)) avisos.push(`${a.id} (${a.nombre}): no está en el manifiesto; su versión sale de la migración del catálogo base y hay que confirmar que siga vigente`);
}

// Ejercicios: los del catálogo con identidad y versión; los del paquete con su archivo real.
for (const e of ejercicios) {
  const s = EJERCICIOS.find((x) => `ejercicio-${x.codigo}` === e.id);
  if (!s) mal(`${e.id}: no está en seleccion.mjs`);
  if (e.identificador.exerciseId && (!UUID.test(e.identificador.exerciseId) || !UUID.test(e.identificador.versionId))) mal(`${e.id}: identificadores del catálogo inválidos`);
  if (!e.identificador.exerciseId && !e.archivoReal) mal(`${e.id}: sin identidad del catálogo ni archivo real`);
}

// Nada sin archivo se presenta como imagen; todo archivo real existe y mide lo que dice el inventario.
for (const c of inventario.contenidos) {
  if (!ESTADOS_DE_REVISION.includes(c.estadoDeRevision)) mal(`${c.id}: estado de revisión «${c.estadoDeRevision}»`);
  if (!c.prompt || c.prompt.length < 80) mal(`${c.id}: sin prompt`);
  if (c.archivoReal && c.estadoDeRevision !== 'ARCHIVO_REAL_PENDIENTE_DE_REVISION_HUMANA') mal(`${c.id}: tiene archivo real y su estado es «${c.estadoDeRevision}»`);
  if (!c.archivoReal && c.estadoDeRevision !== 'PENDIENTE_DE_GENERACION') mal(`${c.id}: no tiene archivo real y su estado dice que sí`);
  if (c.archivoReal) {
    const ruta = resolve(RAIZ, c.archivoReal.ruta);
    if (!fs.existsSync(ruta)) {
      mal(`${c.id}: falta el archivo ${c.archivoReal.ruta}`);
      continue;
    }
    const bytes = fs.readFileSync(ruta);
    const m = medidasDeImagen(bytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (!m || m.ancho !== c.archivoReal.ancho || m.alto !== c.archivoReal.alto || bytes.length !== c.archivoReal.bytes || sha !== c.archivoReal.sha256) mal(`${c.id}: ${c.archivoReal.ruta} no mide lo que dice el inventario`);
  }
}

// Con --fotos: las fotos de recetas de una carpeta, como las revisaría `recetas.mjs revisar` (sin subirlas).
const fotos = arg('--fotos');
if (fotos) {
  const archivos = fs.existsSync(fotos) ? fs.readdirSync(fotos) : [];
  let conFoto = 0;
  for (const r of manifiesto.recetas) {
    const f = fotoDe(r, archivos);
    if (!f) continue;
    conFoto++;
    for (const p of problemasDeLaFoto(fs.readFileSync(join(fotos, f)), f)) mal(`foto de la receta ${r.numero}: ${p}`);
  }
  for (const r of ampliacion.recetas) {
    const f = fotoDeLaAmpliacion(r, archivos);
    if (!f) continue;
    conFoto++;
    for (const p of problemasDeLaFoto(fs.readFileSync(join(fotos, f)), f)) mal(`foto de la receta ${r.codigo}: ${p}`);
  }
  avisos.push(`fotos de recetas en ${fotos}: ${conFoto} de ${esperadas}`);
}
// Con --imagenes: los archivos de alimentos y ejercicios generados, por su nombre estable.
const imagenes = arg('--imagenes');
if (imagenes) {
  const archivos = fs.existsSync(imagenes) ? fs.readdirSync(imagenes) : [];
  for (const c of [...alimentos, ...ejercicios.filter((e) => !e.archivoReal)]) {
    const f = archivos.find((x) => x.replace(/\.(png|webp)$/i, '.jpg') === c.archivo);
    if (!f) continue;
    const m = medidasDeImagen(fs.readFileSync(join(imagenes, f)));
    if (!m) mal(`${c.id}: ${f} no es un JPEG, un PNG ni un WebP`);
    else if (c.tipo === 'alimento' && m.ancho !== m.alto) mal(`${c.id}: ${f} mide ${m.ancho} × ${m.alto} (se espera cuadrada)`);
    else if (c.tipo === 'ejercicio' && !(m.alto > m.ancho)) mal(`${c.id}: ${f} mide ${m.ancho} × ${m.alto} (se espera vertical)`);
  }
}

const r = inventario.resumen;
console.log(`inventario: ${r.recetas} recetas, ${r.alimentos} alimentos, ${r.ejercicios} ejercicios · con archivo real: ${r.conArchivoReal} · pendientes de generación: ${r.pendientesDeGeneracion}`);
for (const a of avisos) console.log(`aviso: ${a}`);
if (problemas.length) {
  console.log(`\nPROBLEMAS (${problemas.length}):\n${problemas.map((p) => `  - ${p}`).join('\n')}`);
  process.exitCode = 1;
} else console.log('\nSIN PROBLEMAS: el inventario corresponde al manifiesto y a la selección, y los archivos reales miden lo que dice.');
