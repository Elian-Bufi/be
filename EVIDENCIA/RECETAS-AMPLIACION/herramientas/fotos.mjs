#!/usr/bin/env node
// Las fotos de las 66 recetas (encargo nocturno de Dirección del 2026-10-28, §11): de los originales que entrega la
// herramienta de generación a los archivos que se suben a BE, con todo registrado. No genera imágenes: las recibe.
//
//   node fotos.mjs preparar --originales <carpeta> --entrega <carpeta> [--vistas <carpeta>] [--herramienta <texto>]
//   node fotos.mjs registrar --entrega <carpeta>
//
// - **preparar** lee cada original (`R017-nombre.png`, o `.jpg`/`.webp`; las 16 originales también como `R001-…`) y:
//   - lo deja como está: el original se conserva, con su tamaño nativo y su SHA-256;
//   - escribe en --entrega el archivo que se sube a BE, con el nombre que espera cada herramienta de carga
//     (`01-…jpg` para las originales y `R017-…jpg` para las nuevas): JPEG de 1600 × 1200, recortado al centro a 4:3 si
//     hacía falta, y reescalado si hacía falta, con la transparencia aplanada sobre blanco, como hace BE. Cada
//     transformación queda escrita; un reescalado hacia arriba se dice como tal (el detalle no es nativo);
//   - con --vistas, compone para cada foto una hoja de revisión en los dos temas (Claro y Azul noche): el original, la
//     entrega, el detalle 4:3 del website, la tarjeta 4:3, el recorte 16:10 de la APK y una miniatura;
//   - busca duplicados exactos (mismo SHA-256) y fotos sospechosamente parecidas (huella perceptual), que hay que mirar a
//     ojo: una diferencia de hash no garantiza que dos imágenes sean distintas;
//   - escribe el registro en `<entrega>/fotos.json`. No toca el repositorio.
// - **registrar** vuelve a medir la entrega y copia el registro a `EVIDENCIA/RECETAS-AMPLIACION/fotos.json`, de donde lo
//   leen el inventario, la galería y los PDF. Es el único paso que escribe en el repositorio.
//
// La revisión técnica (medidas, formato, peso) la hace esta herramienta. La revisión visual (que la foto sea la de la
// receta, sin ingredientes de más, con un corte plausible) y la aprobación de Dirección se anotan aparte en el registro:
// la herramienta nunca las da por hechas.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { problemasDeLaFoto } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { leerAmpliacion, leerVistaCombinada } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/ampliacion.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..', '..');
export const RUTA_DEL_REGISTRO = join(RAIZ, 'EVIDENCIA', 'RECETAS-AMPLIACION', 'fotos.json');
export const ENTREGA = { ancho: 1600, alto: 1200, calidad: 90 };
/** Los colores de los dos temas, de apps/mobile/src/tema.ts (los mismos que usan las vistas de los ejercicios). */
export const TEMAS = {
  claro: { fondo: '#F2F6FC', superficie: '#FFFFFF', borde: '#E3ECFF', texto: '#0A1F44', tenue: '#62728A' },
  'azul-noche': { fondo: '#011325', superficie: '#052238', borde: '#173F61', texto: '#FFFFFF', tenue: '#8DCAE5' },
};

const USO = `Uso:
  node fotos.mjs preparar --originales <carpeta> --entrega <carpeta> [--vistas <carpeta>] [--herramienta <texto>]
  node fotos.mjs registrar --entrega <carpeta>`;

/** El código de receta de un archivo original: `R017-…` o, para las 16 originales, también `01-…`. */
export function codigoDelArchivo(archivo) {
  if (!/\.(png|jpe?g|webp)$/i.test(archivo)) return null;
  const r = /^R(\d{3})-/i.exec(archivo);
  if (r) return `R${r[1]}`;
  const n = /^(\d{1,2})-/.exec(archivo);
  return n && Number(n[1]) >= 1 && Number(n[1]) <= 16 ? `R${String(Number(n[1])).padStart(3, '0')}` : null;
}

/** El recorte al centro que deja una imagen en 4:3. `null` si ya es 4:3. */
export function recorteA4x3(ancho, alto) {
  if (ancho * 3 === alto * 4) return null;
  if (ancho * 3 > alto * 4) {
    const w = Math.round((alto * 4) / 3);
    return { left: Math.floor((ancho - w) / 2), top: 0, width: w, height: alto };
  }
  const h = Math.round((ancho * 3) / 4);
  return { left: 0, top: Math.floor((alto - h) / 2), width: ancho, height: h };
}

/** Lo que se le hace a un original para llegar a la entrega, en palabras, y cómo se hace. */
export function planDeDerivacion({ ancho, alto, conAlfa, formato }) {
  const recorte = recorteA4x3(ancho, alto);
  const w = recorte ? recorte.width : ancho;
  const h = recorte ? recorte.height : alto;
  const factor = ENTREGA.ancho / w;
  const transformaciones = [];
  if (recorte) transformaciones.push(`recorte al centro de ${ancho} × ${alto} a ${w} × ${h} (4:3)`);
  if (Math.abs(factor - 1) > 1e-9) {
    const x = factor.toLocaleString('es-AR', { maximumFractionDigits: 3 });
    transformaciones.push(factor > 1 ? `reescalado ×${x} a ${ENTREGA.ancho} × ${ENTREGA.alto} (Lanczos): el detalle no es nativo` : `reducido ×${x} a ${ENTREGA.ancho} × ${ENTREGA.alto} (Lanczos)`);
  }
  if (conAlfa) transformaciones.push('transparencia aplanada sobre blanco, como hace BE');
  transformaciones.push(`${formato === 'jpeg' && transformaciones.length === 0 ? 'recodificado' : 'codificado'} en JPEG de calidad ${ENTREGA.calidad}, sin metadatos`);
  return { recorte, factor, agrandado: factor > 1 + 1e-9, transformaciones };
}

/** La huella perceptual (dHash de 64 bits): parecida para dos imágenes que se ven parecidas, aunque sus bytes difieran. */
export async function huellaPerceptual(entrada) {
  const { data } = await sharp(entrada).flatten({ background: '#ffffff' }).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | (data[y * 9 + x] > data[y * 9 + x + 1] ? 1n : 0n);
  return bits.toString(16).padStart(16, '0');
}
export function distancia(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}
/** Desde cuántos bits de diferencia dos fotos dejan de ser «sospechosamente parecidas» (de 64). */
export const UMBRAL_DE_PARECIDO = 8;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** La hoja de revisión de una foto en un tema: cómo se verá en BE, recortada como la recorta cada pantalla. */
async function hojaDeRevision(original, entrega, receta, tema, salida) {
  const c = TEMAS[tema];
  // El original se muestra con su proporción nativa: si es alto, lo de abajo baja lo que haga falta.
  const altoDelOriginal = Math.round((320 * original.alto) / original.ancho);
  const y = 360 + Math.max(0, 64 + altoDelOriginal + 36 - 360);
  const marcos = [
    { x: 24, y: 64, w: 320, h: altoDelOriginal, rotulo: `Original · ${original.ancho} × ${original.alto}`, img: () => sharp(original.bytes).flatten({ background: '#ffffff' }).resize(320, altoDelOriginal, { fit: 'fill' }) },
    { x: 368, y: 64, w: 320, h: 240, rotulo: 'Entrega · 1600 × 1200 (4:3)', img: () => sharp(entrega).resize(320, 240) },
    { x: 24, y, w: 448, h: 336, rotulo: 'Website · detalle 4:3 (28rem)', img: () => sharp(entrega).resize(448, 336, { fit: 'cover' }) },
    { x: 496, y, w: 104, h: 78, rotulo: 'Website · tarjeta 4:3 (6,5rem)', img: () => sharp(entrega).resize(104, 78, { fit: 'cover' }) },
    { x: 496, y: y + 110, w: 64, h: 48, rotulo: 'Miniatura · 64 px', img: () => sharp(entrega).resize(64, 48, { fit: 'cover' }) },
    { x: 24, y: y + 380, w: 360, h: 225, rotulo: 'APK · 16:10 al ancho de la pantalla (360 dp)', img: () => sharp(entrega).resize(360, 225, { fit: 'cover' }) },
  ];
  const ancho = 712;
  const alto = y + 380 + 225 + 32;
  const capas = [];
  for (const m of marcos) capas.push({ input: await m.img().png().toBuffer(), left: m.x, top: m.y });
  const textos = marcos.map((m) => `<text x="${m.x}" y="${m.y - 10}" font-family="sans-serif" font-size="14" fill="${c.tenue}">${escapar(m.rotulo)}</text>`).join('');
  const bordes = marcos.map((m) => `<rect x="${m.x - 0.5}" y="${m.y - 0.5}" width="${m.w + 1}" height="${m.h + 1}" rx="6" fill="none" stroke="${c.borde}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="100%" height="100%" fill="${c.fondo}"/><text x="24" y="32" font-family="sans-serif" font-size="18" font-weight="bold" fill="${c.texto}">${escapar(`${receta.codigo} · ${receta.nombre}`)}</text><text x="${ancho - 24}" y="32" text-anchor="end" font-family="sans-serif" font-size="14" fill="${c.tenue}">${tema === 'claro' ? 'Claro' : 'Azul noche'}</text>${textos}${bordes}</svg>`;
  await sharp(Buffer.from(svg)).composite(capas).png().toFile(salida);
}

function leerArgumentos(argv) {
  const [modo, ...resto] = argv;
  const o = { modo };
  for (let k = 0; k < resto.length; k++) {
    const a = resto[k];
    if (['--originales', '--entrega', '--vistas', '--herramienta'].includes(a)) {
      if (resto[k + 1] === undefined) throw new Error(`Falta el valor de ${a}.\n${USO}`);
      o[a.slice(2)] = resto[++k];
    } else throw new Error(`No conozco «${a}».\n${USO}`);
  }
  if (!['preparar', 'registrar'].includes(modo)) throw new Error(USO);
  return o;
}

export async function preparar({ originales, entrega, vistas = null, herramienta = null }, { escribir = console.log } = {}) {
  if (!originales || !entrega) throw new Error(`Faltan --originales o --entrega.\n${USO}`);
  if (resolve(originales) === resolve(entrega)) throw new Error('--entrega tiene que ser otra carpeta: los originales no se pisan.');
  const vista = leerVistaCombinada();
  const ampliacion = leerAmpliacion();
  const porCodigo = new Map(vista.recetas.map((r) => [r.codigo, r]));
  const huellaDe = new Map(ampliacion.recetas.map((r) => [r.codigo, r.huella]));
  // El prompt con que se pidió cada foto, del paquete de generación: queda en el registro junto a la imagen.
  const rutaDelPaquete = join(RAIZ, 'EVIDENCIA', 'RECETAS-AMPLIACION', 'paquete-de-generacion.json');
  const promptDe = new Map(fs.existsSync(rutaDelPaquete) ? JSON.parse(fs.readFileSync(rutaDelPaquete, 'utf8')).recetas.map((r) => [r.codigo, r.prompt]) : []);
  fs.mkdirSync(entrega, { recursive: true });
  if (vistas) fs.mkdirSync(vistas, { recursive: true });
  const fotos = {};
  const desconocidos = [];
  const repetidos = [];
  const archivos = fs.existsSync(originales) ? fs.readdirSync(originales).filter((f) => !f.startsWith('.')).sort() : [];
  for (const archivo of archivos) {
    const codigo = codigoDelArchivo(archivo);
    const receta = codigo ? porCodigo.get(codigo) : null;
    if (!receta) {
      desconocidos.push(archivo);
      continue;
    }
    if (fotos[codigo]) {
      repetidos.push([fotos[codigo].original.archivo, archivo]);
      continue;
    }
    const ruta = resolve(originales, archivo);
    const bytes = fs.readFileSync(ruta);
    const meta = await sharp(bytes).metadata();
    const original = { archivo, ruta, tipo: `image/${meta.format === 'jpeg' ? 'jpeg' : meta.format}`, ancho: meta.width, alto: meta.height, bytes: bytes.length, sha256: sha256(bytes), conAlfa: Boolean(meta.hasAlpha) };
    const plan = planDeDerivacion({ ancho: meta.width, alto: meta.height, conAlfa: meta.hasAlpha, formato: meta.format });
    let tuberia = sharp(bytes);
    if (plan.recorte) tuberia = tuberia.extract(plan.recorte);
    const salidaBytes = await tuberia.resize(ENTREGA.ancho, ENTREGA.alto, { fit: 'fill', kernel: 'lanczos3' }).flatten({ background: '#ffffff' }).jpeg({ quality: ENTREGA.calidad }).toBuffer();
    const rutaDeEntrega = resolve(entrega, receta.archivoDeFoto);
    fs.writeFileSync(rutaDeEntrega, salidaBytes);
    const problemas = problemasDeLaFoto(salidaBytes, receta.archivoDeFoto);
    const registro = {
      codigo,
      nombre: receta.nombre,
      origen: receta.origen,
      huellaDeLaFormulacion: huellaDe.get(codigo) ?? null,
      original: { ...original, huellaPerceptual: await huellaPerceptual(bytes) },
      entrega: { archivo: receta.archivoDeFoto, ruta: rutaDeEntrega, tipo: 'image/jpeg', ancho: ENTREGA.ancho, alto: ENTREGA.alto, bytes: salidaBytes.length, sha256: sha256(salidaBytes), huellaPerceptual: await huellaPerceptual(salidaBytes) },
      transformaciones: plan.transformaciones,
      agrandada: plan.agrandado,
      herramienta,
      prompt: promptDe.get(codigo) ?? null,
      revision: {
        tecnica: problemas.length === 0 ? 'VERIFICADA' : `CON_PROBLEMAS: ${problemas.join('; ')}`,
        visualDelAgente: null,
        direccion: null,
      },
      vistas: [],
    };
    if (vistas) {
      for (const tema of Object.keys(TEMAS)) {
        const destino = resolve(vistas, `${codigo}-${tema}.png`);
        await hojaDeRevision({ ...original, bytes }, salidaBytes, { codigo, nombre: receta.nombre }, tema, destino);
        registro.vistas.push(destino);
      }
    }
    fotos[codigo] = registro;
    escribir(`${codigo} ${receta.nombre}: ${archivo} (${meta.width} × ${meta.height}) → ${receta.archivoDeFoto} · ${plan.transformaciones.join(' · ')}${problemas.length ? ` · PROBLEMAS: ${problemas.join('; ')}` : ''}`);
  }
  // Duplicados exactos y fotos parecidas, entre todas: una foto repetida con otro recorte o color no cuenta como otra.
  const lista = Object.values(fotos);
  const duplicadosExactos = [];
  const parecidas = [];
  for (let a = 0; a < lista.length; a++)
    for (let b = a + 1; b < lista.length; b++) {
      const x = lista[a];
      const y = lista[b];
      if (x.original.sha256 === y.original.sha256 || x.entrega.sha256 === y.entrega.sha256) duplicadosExactos.push([x.codigo, y.codigo]);
      else {
        const d = distancia(x.entrega.huellaPerceptual, y.entrega.huellaPerceptual);
        if (d <= UMBRAL_DE_PARECIDO) parecidas.push([x.codigo, y.codigo, d]);
      }
    }
  const faltantes = vista.recetas.filter((r) => !fotos[r.codigo]).map((r) => r.codigo);
  const registro = {
    registro: 'Las fotos de las recetas de ejemplo: el original de cada una, la entrega que se sube a BE y lo que se le hizo (encargo nocturno de Dirección del 2026-10-28, §11)',
    preparadoEl: new Date().toISOString(),
    estadosDeRevision: {
      tecnica: 'Medidas, formato y peso, con el criterio de las herramientas de carga (VERIFICADA o CON_PROBLEMAS). La hace esta herramienta.',
      visualDelAgente: 'Que la foto sea la de su receta, sin ingredientes de más, con una cocción y una escala plausibles, en los recortes de BE. Se anota a mano después de mirar cada hoja de revisión.',
      direccion: 'La aprobación de Dirección. Se anota a mano; nunca la da la herramienta.',
    },
    resumen: { recetas: vista.recetas.length, conFoto: lista.length, faltantes: faltantes.length, agrandadas: lista.filter((f) => f.agrandada).length, conProblemasTecnicos: lista.filter((f) => f.revision.tecnica !== 'VERIFICADA').length, duplicadosExactos: duplicadosExactos.length, parecidas: parecidas.length },
    fotos,
    faltantes,
    desconocidos,
    repetidos,
    duplicadosExactos,
    parecidas,
  };
  fs.writeFileSync(resolve(entrega, 'fotos.json'), `${JSON.stringify(registro, null, 2)}\n`);
  escribir(
    `\n${lista.length} de ${vista.recetas.length} recetas con foto · faltan ${faltantes.length} · agrandadas ${registro.resumen.agrandadas} · con problemas técnicos ${registro.resumen.conProblemasTecnicos} · duplicados exactos ${duplicadosExactos.length} · parecidas ${parecidas.length} · archivos que no son de ninguna receta ${desconocidos.length}. Registro: ${resolve(entrega, 'fotos.json')}`,
  );
  return registro;
}

export function registrar({ entrega }, { escribir = console.log, destino = RUTA_DEL_REGISTRO } = {}) {
  if (!entrega) throw new Error(`Falta --entrega.\n${USO}`);
  const registro = JSON.parse(fs.readFileSync(resolve(entrega, 'fotos.json'), 'utf8'));
  for (const f of Object.values(registro.fotos)) {
    const bytes = fs.readFileSync(f.entrega.ruta);
    if (sha256(bytes) !== f.entrega.sha256) throw new Error(`${f.codigo}: ${f.entrega.ruta} cambió desde que se preparó. Volver a correr «preparar».`);
    if (sha256(fs.readFileSync(f.original.ruta)) !== f.original.sha256) throw new Error(`${f.codigo}: el original ${f.original.ruta} cambió desde que se preparó.`);
  }
  fs.writeFileSync(destino, `${JSON.stringify(registro, null, 2)}\n`);
  escribir(`Registradas ${Object.keys(registro.fotos).length} fotos en ${destino}. Después: node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs`);
  return registro;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = leerArgumentos(process.argv.slice(2));
    if (o.modo === 'preparar') await preparar(o);
    else registrar(o);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
// Para la galería y los PDF: el registro del repositorio, si existe.
export const leerRegistro = () => (fs.existsSync(RUTA_DEL_REGISTRO) ? JSON.parse(fs.readFileSync(RUTA_DEL_REGISTRO, 'utf8')) : null);
export const extensionValida = (archivo) => ['.png', '.jpg', '.jpeg', '.webp'].includes(extname(archivo).toLowerCase());
