// La ampliación de las recetas de ejemplo (encargo nocturno de Dirección del 2026-10-28): las funciones puras que usan
// `armar.mjs`, la herramienta de carga (`cargar.mjs`) y la prueba de contenido (scripts/recetas-ampliacion.test.mjs).
// Sin red ni base. Solo módulos nativos de Node 22.
//
// La ampliación es un paquete con identidad propia, al lado del manifiesto congelado de las dieciséis (que no se toca):
// - cada receta nueva tiene un código editorial (R017 a R066), no un número del 1 al N;
// - su foto se llama `R017-nombre.jpg`: las originales empiezan con su número (`01-…`), así que las dos pueden vivir en
//   la misma carpeta sin confundirse;
// - sus claves de idempotencia empiezan con el identificador del paquete: no pueden coincidir con las de las originales.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESTADOS, estadoCoherente, FUENTES, sinTildes } from '../manifiesto.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const ID_DEL_PAQUETE = 'recetas-ampliacion-2026-10-28';
export const RUTA_DEL_MANIFIESTO = join(AQUI, 'manifiesto.json');
export const RUTA_DE_LA_VISTA = join(AQUI, 'vista-combinada.json');
export const leerAmpliacion = (ruta = RUTA_DEL_MANIFIESTO) => JSON.parse(readFileSync(ruta, 'utf8'));
export const leerVistaCombinada = (ruta = RUTA_DE_LA_VISTA) => JSON.parse(readFileSync(ruta, 'utf8'));

/** Los códigos de la ampliación, en orden: R017 a R066. */
export const CODIGOS = Array.from({ length: 50 }, (_, k) => `R${String(17 + k).padStart(3, '0')}`);

/** El archivo de foto que se espera para una receta nueva: su código y su nombre sin tildes. */
export const archivoEsperado = (receta) => `${receta.codigo}-${sinTildes(receta.nombre)}.jpg`;
/** La foto de una receta nueva entre los archivos de una carpeta: la que empieza con su código (R017-…), en JPEG, PNG o WebP. */
export const fotoDe = (receta, archivos) => archivos.find((f) => /\.(jpe?g|png|webp)$/i.test(f) && /^(R\d{3})-/i.exec(f)?.[1]?.toUpperCase() === receta.codigo) ?? null;

/** La descripción que guarda BE (hasta 500 caracteres): el momento, el rendimiento y la porción. */
export const descripcionDe = (r) => `${r.momento}. ${r.rendimiento} Porción: ${r.porcion.charAt(0).toLowerCase()}${r.porcion.slice(1)}`;

/** La huella de la formulación: lo que BE guarda de la receta (nombre, descripción, porciones, ingredientes y pasos). */
export function huellaDe(receta) {
  const canonica = JSON.stringify({
    nombre: receta.nombre,
    descripcion: receta.descripcion,
    porciones: receta.porciones,
    ingredientes: receta.ingredientes.map((i) => [i.catalogItemVersionId, i.cantidad.valor, i.cantidad.unidad, i.estado]),
    pasos: receta.pasos,
  });
  return createHash('sha256').update(canonica).digest('hex').slice(0, 16);
}

/**
 * La clave de idempotencia de una escritura: el paquete, el código, la parte y lo que se manda. La misma receta (o la
 * misma foto) da siempre la misma clave, así que un reintento no crea otra; si cambia lo que se manda, cambia la clave.
 */
export const claveDeIdempotencia = (receta, parte, contenido) =>
  `${ID_DEL_PAQUETE}-v1-${receta.codigo}-${parte}-${createHash('sha256').update(typeof contenido === 'string' ? contenido : JSON.stringify(contenido)).digest('hex').slice(0, 16)}`;

/**
 * Las palabras de los pasos que nombran un ingrediente, con los FDC que lo cubren: si un paso dice «sal», la receta tiene
 * que llevar sal en la lista. El agua no cuenta: el agua de hervir y descartar no aporta nada al cálculo.
 */
const PALABRAS = [
  [/\bsal(ar|ad[oa]s?)?\b/, ['173468']],
  [/\bpimienta\b/, ['170931', '170932']],
  [/\baceite\b/, ['171025', '172338', '171029', '171411', '172336', '171412', '171413']],
  [/\bajo\b/, ['169230', '171325']],
  [/\bperejil\b/, ['170416']],
  [/\boregano\b/, ['171328']],
  [/\blimon\b/, ['167747', '167746']],
  [/\bqueso\b/, ['170845', '171244', '171247', '170850', '173414', '171251', '171241', '173419', '170849', '173418', '172179', '173420', '173435', '172175']],
  [/\bmanteca\b/, ['173430', '173410']],
  [/\bazucar\b/, ['169655', '168833', '169656']],
  [/\bhuevos?\b/, ['171287', '173424', '172183', '172184']],
  [/\bleche\b/, ['171265', '171267', '170872', '171269', '173454', '170877']],
  [/\bharinas?\b/, ['168936', '168895', '168893', '174288', '168867']],
  [/\bpan rallado\b/, ['174928']],
  [/\bcaldo\b/, ['174536', '171538']],
  [/\bvinagre\b/, ['172237', '173469']],
  [/\bnuez moscada\b/, ['171326']],
  [/\bcomino\b/, ['170923']],
  [/\bpimenton\b/, ['171329']],
  [/\bcanela\b/, ['171320']],
  [/\bmostaza\b/, ['172234']],
  [/\bmayonesa\b/, ['171009', '173594']],
  [/\byogur\b/, ['171284', '170887', '171304', '170894', '173456']],
  [/\bricota\b/, ['170851', '171248']],
  [/\bmuzzarella\b/, ['170845', '171244']],
  [/\bparmesano\b/, ['171247']],
  [/\btomates?\b/, ['170457', '170051', '170460', '170459']],
  [/\bcebollas?\b/, ['170000', '170005']],
  [/\bmorron(es)?\b/, ['170108', '170427', '169383']],
  [/\bzanahorias?\b/, ['170393', '170394']],
  [/\bpapas?\b/, ['170026', '170093', '170440', '170438', '168555']],
  [/\barroz\b/, ['168877', '168880', '169703', '169704', '168878']],
  [/\batun\b/, ['173709', '173708', '175159']],
  [/\baceitunas?\b/, ['169096', '169094']],
  [/\blevadura\b/, ['175043']],
  [/\balmidon\b/, ['169698']],
  [/\bjamon\b/, ['173864']],
  [/\bbanana(s)?\b/, ['173944']],
  [/\bavena\b/, ['173904', '173905']],
  [/\bmani\b/, ['173806', '172430', '172470']],
];
/** Lo que nombran los pasos y no está en la lista de ingredientes. Vacío: los pasos solo usan lo que la receta lleva. */
export function ingredientesQueFaltanEnLaLista(receta) {
  const fdcs = new Set(receta.ingredientes.map((i) => i.fdcId));
  // «papel manteca» no es manteca, «a la crema» no aparece, y la palabra va sin tildes, como el nombre del archivo.
  const texto = sinTildes(receta.pasos.join(' ').replace(/papel manteca/gi, 'papel')).replace(/-/g, ' ');
  return PALABRAS.filter(([re, cubren]) => re.test(texto) && !cubren.some((f) => fdcs.has(f))).map(([re]) => re.source.replace(/\\b|\(es\)\?|\?|\(s\)/g, ''));
}

/** Los problemas de forma del paquete, uno por línea. Vacío: está bien formado. */
export function problemasDeLaAmpliacion(m, originales = null) {
  const p = [];
  if (m.paquete !== ID_DEL_PAQUETE) p.push(`el paquete es «${m.paquete}», no «${ID_DEL_PAQUETE}»`);
  if (!Array.isArray(m.recetas)) return [...p, "el paquete no tiene recetas"];
  if (m.recetas.length !== CODIGOS.length) p.push(`el paquete tiene ${m.recetas.length} recetas, no ${CODIGOS.length}`);
  const codigos = m.recetas.map((r) => r.codigo);
  if (codigos.some((c, k) => c !== CODIGOS[k])) p.push(`los códigos van de R017 a R066, en orden: ${codigos.join(', ')}`);
  const nombres = m.recetas.map((r) => sinTildes(r.nombre));
  for (const [k, n] of nombres.entries()) if (nombres.indexOf(n) !== k) p.push(`nombre repetido: ${m.recetas[k].nombre}`);
  if (originales) for (const o of originales.recetas) if (nombres.includes(sinTildes(o.nombre))) p.push(`«${o.nombre}» ya es una receta original`);
  for (const r of m.recetas) {
    const que = r.codigo;
    if (typeof r.nombre !== 'string' || r.nombre.trim() !== r.nombre || r.nombre.length === 0 || r.nombre.length > 120) p.push(`${que}: el nombre`);
    if (typeof r.descripcion !== 'string' || r.descripcion.length > 500) p.push(`${que}: la descripción`);
    if (!Number.isInteger(r.porciones) || r.porciones < 1 || r.porciones > 50) p.push(`${que}: las porciones`);
    if (!Array.isArray(r.pasos) || r.pasos.length === 0 || r.pasos.length > 20 || r.pasos.some((s) => typeof s !== 'string' || s.trim() === '' || s.length > 500)) p.push(`${que}: los pasos`);
    if (r.foto?.archivo !== archivoEsperado(r)) p.push(`${que}: la foto esperada es ${archivoEsperado(r)}, no ${r.foto?.archivo}`);
    if (!Array.isArray(r.ingredientes) || r.ingredientes.length === 0 || r.ingredientes.length > 40) p.push(`${que}: los ingredientes`);
    for (const [j, i] of (r.ingredientes ?? []).entries()) {
      const ique = `${que}, ingrediente ${j + 1} (${i.nombre})`;
      if (!FUENTES.includes(i.fuente)) p.push(`${ique}: la fuente ${i.fuente}`);
      if (!/^[0-9a-f-]{36}$/.test(i.catalogItemId ?? '') || !/^[0-9a-f-]{36}$/.test(i.catalogItemVersionId ?? '')) p.push(`${ique}: el ítem y la versión del catálogo`);
      if (!/^\d+$/.test(i.fdcId ?? '')) p.push(`${ique}: el FDC`);
      if (!(i.cantidad?.valor > 0 && i.cantidad.valor <= 5000) || i.cantidad?.unidad !== 'g') p.push(`${ique}: la cantidad`);
      if (!ESTADOS.includes(i.estado)) p.push(`${ique}: el estado ${i.estado}`);
      else if (!estadoCoherente(i.estado, i.preparacionDeLaFuente ?? '')) p.push(`${ique}: el estado ${i.estado} no es el de «${i.preparacionDeLaFuente}»`);
      if (i.decision !== null && (typeof i.decision !== 'string' || i.decision.trim().length < 10)) p.push(`${ique}: la decisión`);
    }
    const faltan = ingredientesQueFaltanEnLaLista(r);
    if (faltan.length > 0) p.push(`${que}: los pasos nombran ${faltan.join(', ')}, que no están en la lista`);
  }
  return p;
}
