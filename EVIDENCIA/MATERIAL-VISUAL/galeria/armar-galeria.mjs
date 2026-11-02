// Arma la galería para el teléfono (galeria.html) desde la plantilla y el inventario. Las imágenes no se versionan:
// se copian a <salida>/img desde la carpeta persistente del material (ver ../LEEME.md, «Fuera del repositorio»).
//
//   node EVIDENCIA/MATERIAL-VISUAL/galeria/armar-galeria.mjs <salida> [<carpeta del material>]
//
// La carpeta del material por omisión es C:/Users/bufim/BE-material-visual. La galería publicada del 2026-10-28 salió de
// esta plantilla y de este inventario.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const [salida, material = 'C:/Users/bufim/BE-material-visual'] = process.argv.slice(2);
if (!salida) {
  console.error('Uso: node armar-galeria.mjs <salida> [<carpeta del material>]');
  process.exit(2);
}

const inventario = JSON.parse(readFileSync(join(aqui, '..', 'inventario.json'), 'utf8'));
const datos = inventario.contenidos.map((x) => ({
  id: x.id,
  tipo: x.tipo,
  nombre: x.nombre,
  estado: x.estado ?? null,
  archivo: x.archivo,
  real: x.archivoReal ? { ancho: x.archivoReal.ancho, alto: x.archivoReal.alto, bytes: x.archivoReal.bytes, tipo: x.archivoReal.tipo } : null,
  formato: x.formato,
  donde: x.dondeSeMuestra,
  procedencia: x.procedencia,
  prompt: x.prompt,
  revision: x.estadoDeRevision,
  obs: x.observaciones ?? [],
}));

const plantilla = readFileSync(join(aqui, 'plantilla.html'), 'utf8');
if (!plantilla.includes('/*INVENTARIO*/')) throw new Error('La plantilla perdió la marca /*INVENTARIO*/');
// «<» escapado: así ningún texto del inventario puede cerrar la etiqueta <script> que lo contiene.
const json = JSON.stringify(datos).replace(/</g, '\\u003c');
mkdirSync(join(salida, 'img'), { recursive: true });
writeFileSync(join(salida, 'galeria.html'), plantilla.split('/*INVENTARIO*/').join(json));

const imagenes = [
  ['ejercicios/existentes/como-las-guarda-be', ['sentadilla_goblet.jpg', 'peso_muerto_rumano_mancuernas.jpg', 'zancada_estatica.jpg']],
  ['ejercicios/existentes/vistas', ['sentadilla_goblet', 'peso_muerto_rumano_mancuernas', 'zancada_estatica'].flatMap((b) => [`${b}-claro.png`, `${b}-azul-noche.png`])],
  ['.', ['encuadre-de-recetas.png']],
];
for (const [carpeta, archivos] of imagenes) for (const a of archivos) copyFileSync(join(material, carpeta, a), join(salida, 'img', a));
console.log(`galería en ${join(salida, 'galeria.html')}, con ${datos.length} contenidos y 10 imágenes en img/`);
