#!/usr/bin/env node
// Las imágenes de los ejercicios de la demostración (DL-162 y DL-123), desde `imagenes.json` y por identidad
// (`ejercicios-de-la-demo.json`), como la herramienta de las recetas.
//
//   node fotos.mjs revisar [--destino local|test] [--carpeta <carpeta>]
//   node fotos.mjs cargar  --destino local|test --curador <correo administrador> --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura [--carpeta <carpeta>] [--reemplazar]
//
// - **revisar** (y cualquier modo sin --confirmo-escritura) no escribe nada: busca cada imagen en la carpeta por su código
//   (E04-…), revisa el tipo por sus bytes, el peso, las medidas y el formato pedido (vertical 5:6, al menos 1000 × 1200),
//   y que tenga autoría, licencia y texto alternativo. Con --destino, además dice qué ejercicio ya tiene imagen.
// - **cargar** escribe: los propios de la cuenta PRO_T, por la API (API-MED-01, la subida firmada de API-MED-02 y
//   API-EJE-02), salvo los que ya tienen imagen (con --reemplazar, se reemplaza); los del catálogo de todos, con el
//   comando de curaduría de BE (`curaduria-comando.js imagenes`), con una cuenta administradora como curadora. Repetir
//   la misma imagen no suma nada.
// Nunca imprime credenciales ni la URL de la base. No corre contra test sin la autorización de Dirección.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { medidasDeImagen } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { archivoDeTrabajo, CARPETA, claveDe, clienteDe, correrComando, destinoDe, ejerciciosDeLaDemo, ESCRIBIR_EXIGE, leerArgumentos, leerJson, sesionDeEntrenamiento } from './comun.mjs';

const USO = `Uso:
  node fotos.mjs revisar [--destino local|test] [--carpeta <carpeta>]
  node fotos.mjs cargar  --destino local|test --curador <correo administrador> --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura [--carpeta <carpeta>] [--reemplazar]`;

const DIEZ_MB = 10 * 1024 * 1024;

/** El manifiesto unido a las identidades: cada imagen con su ejercicio y lo común (procedencia, autoría, licencia). */
export function leerManifiesto(ruta = path.join(CARPETA, 'imagenes.json')) {
  const m = leerJson(ruta);
  const demo = leerJson(path.join(CARPETA, 'ejercicios-de-la-demo.json'));
  const porClave = new Map(demo.ejercicios.map((e) => [e.clave, e]));
  return {
    ...m,
    ejercicios: m.imagenes.map((i) => {
      const e = porClave.get(i.clave);
      if (!e) throw new Error(`El manifiesto cita «${i.clave}», que no está en ejercicios-de-la-demo.json.`);
      return { ...e, ...m.comunes, ...i, altText: i.altText ?? null };
    }),
  };
}

/** El archivo de cada imagen, por su código (E04-…): el nombre del manifiesto o cualquier otro con ese prefijo. */
function archivoDe(carpeta, e) {
  if (!fs.existsSync(carpeta)) return null;
  const archivos = fs.readdirSync(carpeta);
  if (archivos.includes(e.archivo)) return path.join(carpeta, e.archivo);
  const otro = archivos.find((f) => f.startsWith(`${e.codigoDeImagen}-`) && /\.(png|jpe?g|webp)$/i.test(f));
  return otro ? path.join(carpeta, otro) : null;
}

/** Lo que impide cargar una imagen (problemas) y lo que conviene mirar (avisos). */
export function revisarImagen(e, bytes) {
  const problemas = [];
  const avisos = [];
  const medidas = medidasDeImagen(bytes);
  if (!medidas) problemas.push('no es PNG, JPEG ni WebP');
  if (bytes.length > DIEZ_MB) problemas.push('pesa más de 10 MB');
  if (medidas && (Math.min(medidas.ancho, medidas.alto) < 64 || Math.max(medidas.ancho, medidas.alto) > 8000)) problemas.push(`mide ${medidas.ancho} × ${medidas.alto}: cada lado va de 64 a 8000 px`);
  if (medidas && (medidas.ancho < 1000 || medidas.alto < 1200)) avisos.push(`mide ${medidas.ancho} × ${medidas.alto}: el pedido es al menos 1000 × 1200`);
  if (medidas && Math.abs(medidas.ancho / medidas.alto - 5 / 6) > 0.05) avisos.push('no es vertical 5:6');
  if (!e.altText || !e.altText.trim()) problemas.push('falta el texto alternativo');
  if (!e.authorship || !e.authorship.trim()) problemas.push('falta la autoría');
  if (!e.license?.kind) problemas.push('falta la licencia');
  return { medidas, problemas, avisos };
}

async function revisar(opciones) {
  const m = leerManifiesto();
  const carpeta = opciones.carpeta ?? m.carpeta;
  const filas = m.ejercicios.map((e) => {
    const archivo = archivoDe(carpeta, e);
    if (!archivo) return { ...e, archivo: null, problemas: [e.opcional ? 'sin imagen (es opcional)' : 'sin imagen todavía'], avisos: [], opcionalSinImagen: Boolean(e.opcional) };
    const bytes = fs.readFileSync(archivo);
    return { ...e, archivo, bytes, ...revisarImagen(e, bytes) };
  });
  let destino = null;
  if (opciones.destino) {
    const d = destinoDe(opciones.destino, USO);
    const api = clienteDe(d.api);
    const token = await sesionDeEntrenamiento(api, d);
    const resueltos = new Map((await ejerciciosDeLaDemo(api, token, d, m)).map((e) => [e.clave, e]));
    for (const f of filas) f.destino = resueltos.get(f.clave);
    destino = { d, api, token };
  }
  for (const f of filas) {
    const hoy = f.destino ? (f.destino.encontrado ? (f.destino.ficha.image ? '  [ya tiene imagen]' : '  [sin imagen]') : '  [no está en el destino]') : '';
    const estado = f.problemas.length === 0 ? '✓' : f.opcionalSinImagen ? '·' : '✗';
    process.stdout.write(`${estado} ${f.codigoDeImagen} ${f.nombre}: ${f.archivo ? path.basename(f.archivo) : f.archivo === null ? 'sin archivo' : ''}${f.medidas ? ` ${f.medidas.ancho} × ${f.medidas.alto}` : ''}${[...f.problemas, ...f.avisos].length ? ` — ${[...f.problemas, ...f.avisos].join('; ')}` : ''}${hoy}\n`);
  }
  return { filas, destino };
}

/** Un ejercicio propio: la intención de subida (API-MED-01), los bytes por la ruta firmada (API-MED-02) y la asociación (API-EJE-02). */
async function cargarPropia(destino, f, reemplazar) {
  const { d, api, token } = destino;
  const ficha = f.destino.ficha;
  if (ficha.image && !reemplazar) return 'ya tenía imagen (con --reemplazar, se reemplaza)';
  const huella = createHash('sha256').update(f.bytes).digest('hex');
  const intencion = (
    await api.pedir('POST', '/me/media/upload-intents', {
      token,
      cuerpo: { purpose: 'EXERCISE_REFERENCE', contentType: f.medidas.tipo, byteSize: f.bytes.length, provenance: f.provenance, authorship: f.authorship },
      clave: claveDe('intencion', f.destino.exerciseId, huella),
    })
  ).data;
  const subida = await fetch(`${d.api}/api/v1${intencion.uploadPath}`, { method: 'PUT', headers: { 'Content-Type': f.medidas.tipo, 'X-BE-Surface': 'WEB' }, body: f.bytes });
  // Una intención repetida devuelve el mismo medio; si su ruta venció (10 minutos) y no se subió, se pide otra.
  if (!subida.ok && subida.status !== 404) throw new Error(`${f.nombre}: la subida respondió ${subida.status}`);
  if (subida.status === 404) throw new Error(`${f.nombre}: la ruta de subida venció; repetí la carga, que pide otra intención.`);
  await api.pedir('PUT', `/training/exercises/${f.destino.exerciseId}/image`, {
    token,
    cuerpo: { exerciseVersionId: ficha.versionId, mediaId: intencion.mediaId, expectedImageVersion: ficha.imageVersion, altText: f.altText, license: f.license, technicalReview: f.technicalReview },
    clave: claveDe('asociar', f.destino.exerciseId, intencion.mediaId),
  });
  return 'subida y asociada por la API';
}

async function cargar(opciones) {
  if (!opciones['confirmo-escritura'] || !opciones.operador || !opciones.fundamento || !opciones.curador || !opciones.destino) throw new Error(`${ESCRIBIR_EXIGE} Las del catálogo de todos piden además --curador.\n${USO}`);
  const { filas, destino } = await revisar(opciones);
  const listas = filas.filter((f) => f.archivo && f.problemas.length === 0);
  const conProblemas = filas.filter((f) => f.archivo && f.problemas.length > 0);
  if (conProblemas.length > 0) throw new Error(`Hay imágenes con problemas: ${conProblemas.map((f) => f.codigoDeImagen).join(', ')}. No se escribió nada.`);
  const faltan = listas.filter((f) => !f.destino?.encontrado);
  if (faltan.length > 0) throw new Error(`No se encontraron por identidad en el destino: ${faltan.map((f) => f.nombre).join(', ')}. No se escribió nada.`);
  for (const f of listas.filter((x) => x.ambito === 'PROPIO')) process.stdout.write(`✓ ${f.codigoDeImagen} ${f.nombre}: ${await cargarPropia(destino, f, opciones.reemplazar)}\n`);
  const delCatalogo = listas.filter((x) => x.ambito === 'CATALOGO');
  if (delCatalogo.length > 0) {
    const manifiesto = archivoDeTrabajo('imagenes-del-catalogo.json', {
      imagenes: delCatalogo.map((f) => ({ exerciseId: f.exerciseId, archivo: f.archivo, contentType: f.medidas.tipo, provenance: f.provenance, authorship: f.authorship, altText: f.altText, license: f.license, technicalReview: f.technicalReview })),
    });
    const r = correrComando(destino.d, 'imagenes', manifiesto, { operador: opciones.operador, fundamento: opciones.fundamento, curador: opciones.curador, escribir: true });
    for (const x of r.resultados) process.stdout.write(`${x.escrito ? '✓' : '='} ${x.nombre}: ${x.escrito ? `curada por BE (versión de imagen ${x.imageVersion})` : 'ya tenía esa imagen'}\n`);
  }
  process.stdout.write('Listo.\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opciones = leerArgumentos(process.argv.slice(2), { modos: ['revisar', 'cargar'], valores: ['destino', 'carpeta', 'curador', 'operador', 'fundamento'], banderas: ['confirmo-escritura', 'reemplazar'], uso: USO });
    if (opciones.modo === 'revisar') await revisar(opciones);
    else await cargar(opciones);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
