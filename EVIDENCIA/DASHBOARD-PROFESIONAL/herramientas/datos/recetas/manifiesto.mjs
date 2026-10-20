// Las recetas de ejemplo (encargo de Dirección del 2026-10-19, bloque 4): lo que se lee del manifiesto congelado y las
// cuentas que no dependen de la API. Funciones puras, sin red ni base: las usan la herramienta (`recetas.mjs`) y la prueba
// de contenido (`scripts/recetas-de-ejemplo.test.mjs`). Solo módulos nativos de Node 22.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RUTA_DEL_MANIFIESTO = join(dirname(fileURLToPath(import.meta.url)), 'manifiesto.json');
export const leerManifiesto = (ruta = RUTA_DEL_MANIFIESTO) => JSON.parse(readFileSync(ruta, 'utf8'));

export const ESTADOS = ['RAW', 'COOKED', 'AS_PURCHASED'];
export const FUENTES = ['CATALOGO_BASE', 'DL_119'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** El nombre de un archivo, sin tildes ni signos: «Bowl de quinoa, huevo» → «bowl-de-quinoa-huevo». */
export const sinTildes = (texto) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
/** El archivo de foto que se espera para una receta: el número con dos cifras y el nombre. */
export const archivoEsperado = (receta) => `${String(receta.numero).padStart(2, '0')}-${sinTildes(receta.nombre)}.jpg`;
/** La foto de una receta entre los archivos de una carpeta: la que empieza con su número (01-…, 1-…), en JPEG, PNG o WebP. */
export const fotoDe = (receta, archivos) => archivos.find((f) => /\.(jpe?g|png|webp)$/i.test(f) && Number(/^(\d+)-/.exec(f)?.[1]) === receta.numero) ?? null;

/**
 * Lo que dice la preparación de la fuente sobre su estado. Una cantidad cocida no se calcula con la composición de lo
 * crudo, ni al revés: el estado de cada ingrediente tiene que ser el de su alimento.
 */
const COCCION = /\b(cocid|cocinad|hervid|al horno|asad|a la parrilla|a la plancha|al grill|frit|revuelt|poch|omelette|dorad|brasead|al vapor)/i;
const CRUDO = /\b(crud|fresc)/i;
export function estadoCoherente(estado, preparacion) {
  const cocido = COCCION.test(preparacion);
  if (estado === 'COOKED') return cocido;
  if (estado === 'RAW') return CRUDO.test(preparacion) && !cocido;
  return estado === 'AS_PURCHASED' && !cocido;
}

/** Los problemas de forma del manifiesto, uno por línea. Vacío: está bien formado. */
export function problemasDelManifiesto(m) {
  const p = [];
  if (!Array.isArray(m.recetas) || m.recetas.length === 0) return ['el manifiesto no tiene recetas'];
  const numeros = m.recetas.map((r) => r.numero);
  if (numeros.some((n, i) => n !== i + 1)) p.push(`los números van de 1 a ${m.recetas.length}, en orden: ${numeros.join(', ')}`);
  const nombres = m.recetas.map((r) => sinTildes(r.nombre));
  for (const [i, n] of nombres.entries()) if (nombres.indexOf(n) !== i) p.push(`nombre repetido: ${m.recetas[i].nombre}`);
  for (const r of m.recetas) {
    const que = `receta ${r.numero}`;
    if (typeof r.nombre !== 'string' || r.nombre.trim() !== r.nombre || r.nombre.length === 0 || r.nombre.length > 120) p.push(`${que}: el nombre`);
    if (r.descripcion !== null && (typeof r.descripcion !== 'string' || r.descripcion.length > 500)) p.push(`${que}: la descripción`);
    if (!Number.isInteger(r.porciones) || r.porciones < 1 || r.porciones > 50) p.push(`${que}: las porciones`);
    if (!Array.isArray(r.pasos) || r.pasos.length > 20 || r.pasos.some((s) => typeof s !== 'string' || s.trim() === '' || s.length > 500)) p.push(`${que}: los pasos`);
    if (r.imagen !== archivoEsperado(r)) p.push(`${que}: la imagen esperada es ${archivoEsperado(r)}, no ${r.imagen}`);
    if (!Array.isArray(r.ingredientes) || r.ingredientes.length === 0 || r.ingredientes.length > 40) p.push(`${que}: los ingredientes`);
    for (const [j, i] of (r.ingredientes ?? []).entries()) {
      const ique = `${que}, ingrediente ${j + 1} (${i.nombre})`;
      if (!FUENTES.includes(i.fuente)) p.push(`${ique}: la fuente ${i.fuente}`);
      if (!UUID.test(i.catalogItemId ?? '') || !UUID.test(i.catalogItemVersionId ?? '')) p.push(`${ique}: el ítem y la versión del catálogo`);
      if (!/^\d+$/.test(i.fdcId ?? '')) p.push(`${ique}: el FDC`);
      if (!(i.cantidad?.valor > 0 && i.cantidad.valor <= 5000) || !['g', 'ml'].includes(i.cantidad?.unidad)) p.push(`${ique}: la cantidad`);
      if (!ESTADOS.includes(i.estado)) p.push(`${ique}: el estado ${i.estado}`);
      else if (!estadoCoherente(i.estado, i.preparacionDeLaFuente ?? '')) p.push(`${ique}: el estado ${i.estado} no es el de «${i.preparacionDeLaFuente}»`);
      if (i.decision !== null && (typeof i.decision !== 'string' || i.decision.trim().length < 10)) p.push(`${ique}: la decisión`);
    }
  }
  return p;
}

/** El cuerpo de API-REC-07 (calcular sin guardar) y de API-REC-01 (crear), con los ingredientes por identidad y versión. */
export function pedidoDeCalculo(receta, cambios = {}) {
  return {
    servings: cambios.porciones ?? receta.porciones,
    ingredients: receta.ingredientes.map((i, j) => ({
      catalogItemId: i.catalogItemId,
      catalogItemVersionId: i.catalogItemVersionId,
      quantity: { value: j === cambios.ingrediente ? i.cantidad.valor + cambios.gramos : i.cantidad.valor, unit: i.cantidad.unidad },
      preparationState: i.estado,
    })),
  };
}
export const pedidoDeCreacion = (receta) => ({ name: receta.nombre, description: receta.descripcion, ...pedidoDeCalculo(receta), steps: receta.pasos });

export const NUTRIENTES = ['energyKcal', 'carbohydrateG', 'fatG', 'proteinG', 'fiberG'];

/**
 * El cálculo hecho de nuevo, sin la lógica de BE: gramos ÷ 100 × el valor cada 100 g, sumado, con números de JavaScript.
 * Un nutriente sin dato en algún ingrediente queda `null` (desconocido, nunca cero), como en BE. Sirve para comprobar el
 * de la API, que es exacto: coinciden hasta el redondeo de los flotantes.
 */
export function calculoIndependiente(receta, composicionDe, cambios = {}) {
  const pedido = pedidoDeCalculo(receta, cambios);
  const total = {};
  for (const n of NUTRIENTES) {
    let suma = 0;
    for (const [j, ing] of pedido.ingredients.entries()) {
      const c = composicionDe(receta.ingredientes[j]);
      const valor = c?.[n];
      const unidadDeLaComposicion = c?.referenceAmount === '100ml' ? 'ml' : 'g';
      if (valor === null || valor === undefined || ing.quantity.unit !== unidadDeLaComposicion) {
        suma = null;
        break;
      }
      suma += (ing.quantity.value / 100) * Number(valor);
    }
    total[n] = suma;
  }
  const porPorcion = Object.fromEntries(NUTRIENTES.map((n) => [n, total[n] === null ? null : total[n] / pedido.servings]));
  return { total, porPorcion };
}

/** Si dos valores (el exacto de la API, como texto, y uno de JavaScript) son el mismo hasta el redondeo de los flotantes. */
export function coinciden(exacto, numero) {
  if (exacto === null || numero === null) return exacto === null && numero === null;
  const a = Number(exacto);
  return Math.abs(a - numero) <= 1e-6 * Math.max(1, Math.abs(a));
}

/**
 * La clave de idempotencia de una escritura: la misma receta (o la misma foto) da siempre la misma clave, así que un
 * reintento no crea otra. Si cambia lo que se manda, cambia la clave: la herramienta mira antes si la receta ya está.
 */
export const claveDeIdempotencia = (receta, parte, contenido) =>
  `recetas-de-ejemplo-v1-${String(receta.numero).padStart(2, '0')}-${parte}-${createHash('sha256').update(typeof contenido === 'string' ? contenido : JSON.stringify(contenido)).digest('hex').slice(0, 16)}`;

/** Las medidas de una imagen JPEG, PNG o WebP leídas de sus primeros bytes, sin decodificarla. `null` si no se reconoce. */
export function medidasDeImagen(bytes) {
  const b = Buffer.from(bytes);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { tipo: 'image/png', ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const fragmento = b.toString('ascii', 12, 16);
    if (fragmento === 'VP8X') return { tipo: 'image/webp', ancho: 1 + b.readUIntLE(24, 3), alto: 1 + b.readUIntLE(27, 3) };
    if (fragmento === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { tipo: 'image/webp', ancho: 1 + (v & 0x3fff), alto: 1 + ((v >> 14) & 0x3fff) };
    }
    if (fragmento === 'VP8 ') return { tipo: 'image/webp', ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff };
    return null;
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marca = b[i + 1];
      if (marca === 0xd8 || (marca >= 0xd0 && marca <= 0xd7) || marca === 0x01) {
        i += 2;
        continue;
      }
      const largo = b.readUInt16BE(i + 2);
      if (marca >= 0xc0 && marca <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marca)) return { tipo: 'image/jpeg', ancho: b.readUInt16BE(i + 7), alto: b.readUInt16BE(i + 5) };
      i += 2 + largo;
    }
    return null;
  }
  return null;
}

/**
 * Lo que se espera de una foto de receta antes de subirla (encargo del 2026-10-19, bloque 4: un criterio común de
 * encuadre y proporción). El servidor la recodifica en JPEG de hasta 1600 px por el lado mayor (LIMITES_DE_MEDIO).
 */
export const FOTO_ESPERADA = {
  bytesMaximos: 10 * 1024 * 1024,
  ladoMayorMinimo: 1200,
  /** Horizontal 4:3, con margen: 1,25 a 1,40 (el detalle la muestra entera en 4:3 y la tarjeta la recorta al centro). */
  proporcionMinima: 1.25,
  proporcionMaxima: 1.4,
};
/** Los problemas de una foto, uno por línea. Vacío: sirve. */
export function problemasDeLaFoto(bytes, archivo) {
  const p = [];
  if (bytes.length > FOTO_ESPERADA.bytesMaximos) p.push(`${archivo}: pesa ${(bytes.length / 1024 / 1024).toFixed(1)} MB (hasta 10 MB)`);
  const m = medidasDeImagen(bytes);
  if (!m) return [...p, `${archivo}: no es un JPEG, un PNG ni un WebP reconocible`];
  const extension = /\.png$/i.test(archivo) ? 'image/png' : /\.webp$/i.test(archivo) ? 'image/webp' : 'image/jpeg';
  if (m.tipo !== extension) p.push(`${archivo}: la extensión no es la de su contenido (${m.tipo})`);
  if (Math.max(m.ancho, m.alto) < FOTO_ESPERADA.ladoMayorMinimo) p.push(`${archivo}: ${m.ancho} × ${m.alto} px (el lado mayor, desde ${FOTO_ESPERADA.ladoMayorMinimo})`);
  const proporcion = m.ancho / m.alto;
  if (proporcion < FOTO_ESPERADA.proporcionMinima || proporcion > FOTO_ESPERADA.proporcionMaxima) p.push(`${archivo}: proporción ${proporcion.toFixed(2)} (se espera horizontal, cerca de 4:3)`);
  return p;
}
