// Arma la galería para el teléfono (galeria.html) desde la plantilla y el inventario: las 66 recetas con su ficha
// completa, los 16 alimentos y los 15 ejercicios. Las imágenes no se versionan: se copian a <salida>/img desde la carpeta
// del material (las tres de ejercicios, sus vistas y la maqueta del encuadre) y, si hay fotos de recetas registradas
// (EVIDENCIA/RECETAS-AMPLIACION/fotos.json), una miniatura de cada una a <salida>/img/recetas.
//
//   node EVIDENCIA/MATERIAL-VISUAL/galeria/armar-galeria.mjs <salida> <carpeta del material>
//
// En la máquina donde se preparó, la carpeta del material es C:/Users/bufim/BE-material-visual (ver ../LEEME.md). La
// galería sale entera en <salida>: galeria.html e img/, con rutas relativas, así que se abre desde cualquier lugar.
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const [salida, material] = process.argv.slice(2);
if (!salida || !material) {
  console.error('Uso: node armar-galeria.mjs <salida> <carpeta del material>');
  process.exit(2);
}

const inventario = JSON.parse(fs.readFileSync(join(aqui, '..', 'inventario.json'), 'utf8'));
const recortar = (x) => (x ? { ancho: x.ancho, alto: x.alto, bytes: x.bytes, tipo: x.tipo } : null);
const contenidos = inventario.contenidos.map((x) =>
  x.tipo === 'receta'
    ? {
        id: x.id,
        tipo: x.tipo,
        codigo: x.codigo,
        origen: x.origen,
        familia: x.familia,
        familiaNombre: x.familiaNombre,
        nombre: x.nombre,
        momento: x.momento,
        porciones: x.porciones,
        porcion: x.porcion,
        archivo: x.archivo,
        archivoReal: recortar(x.archivoReal),
        transformaciones: x.transformaciones ?? [],
        revisionDeLaFoto: x.revisionDeLaFoto ?? null,
        ingredientes: x.ingredientes.map((i) => ({ parte: i.parte, nombre: i.nombre, cantidad: i.cantidad, estado: i.estado })),
        pasos: x.pasos,
        composicionPorPorcion: x.composicionPorPorcion,
        presentacion: x.presentacion,
        noDebe: x.noDebe,
        prompt: x.prompt,
      }
    : {
        id: x.id,
        tipo: x.tipo,
        nombre: x.nombre,
        estado: x.estado ?? null,
        archivo: x.archivo,
        archivoReal: recortar(x.archivoReal),
        formato: x.formato,
        dondeSeMuestra: x.dondeSeMuestra,
        procedencia: x.procedencia,
        prompt: x.prompt,
        observaciones: x.observaciones ?? [],
      },
);

const plantilla = fs.readFileSync(join(aqui, 'plantilla.html'), 'utf8');
if (!plantilla.includes('/*INVENTARIO*/')) throw new Error('La plantilla perdió la marca /*INVENTARIO*/');
// «<» escapado: así ningún texto del inventario puede cerrar la etiqueta <script> que lo contiene.
const json = JSON.stringify({ contenidos }).replace(/</g, '\\u003c');
fs.mkdirSync(join(salida, 'img', 'recetas'), { recursive: true });
fs.writeFileSync(join(salida, 'galeria.html'), plantilla.split('/*INVENTARIO*/').join(json));

const imagenes = [
  ['ejercicios/existentes/como-las-guarda-be', ['sentadilla_goblet.jpg', 'peso_muerto_rumano_mancuernas.jpg', 'zancada_estatica.jpg']],
  ['ejercicios/existentes/vistas', ['sentadilla_goblet', 'peso_muerto_rumano_mancuernas', 'zancada_estatica'].flatMap((b) => [`${b}-claro.png`, `${b}-azul-noche.png`])],
  ['.', ['encuadre-de-recetas.png']],
];
let copiadas = 0;
for (const [carpeta, archivos] of imagenes)
  for (const a of archivos) {
    fs.copyFileSync(join(material, carpeta, a), join(salida, 'img', a));
    copiadas++;
  }

// Las fotos de recetas registradas: una miniatura de 800 × 600 de la entrega (la que se sube a BE), sin el original.
const registro = join(aqui, '..', '..', 'RECETAS-AMPLIACION', 'fotos.json');
const fotos = fs.existsSync(registro) ? Object.values(JSON.parse(fs.readFileSync(registro, 'utf8')).fotos) : [];
if (fotos.length > 0) {
  const { default: sharp } = await import('sharp');
  for (const f of fotos) await sharp(f.entrega.ruta).resize(800, 600, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(join(salida, 'img', 'recetas', `${f.codigo}.jpg`));
}
console.log(`galería en ${join(salida, 'galeria.html')}: ${contenidos.length} contenidos, ${copiadas} imágenes del material y ${fotos.length} fotos de recetas en img/`);
