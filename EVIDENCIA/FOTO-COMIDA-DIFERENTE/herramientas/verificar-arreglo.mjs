// Verificación del arreglo con archivos con la forma de Android (`fotos-android.mjs`), el `fetch` de la APK emulado
// (`expo-fetch-emulado.mjs`) y la API real de `test`, como DEMO-A01. Cada caso sigue la pantalla corregida:
// elegir (`fotoDesdeElSelector`), leer (`leerLaFoto`), la intención (API-MED-01) y la subida (API-MED-02). Después se lee
// lo guardado (API-MED-03 y 04) para ver medidas, orientación y metadatos, y se suprime (API-MED-05): no queda ninguna foto.
// No registra comidas. Además, un reintento: la misma subida repetida en la misma ruta es el mismo medio.
import { createRequire } from 'node:module';
import { fetchDeExpo, pedidos, VERSION_DE_EXPO } from './expo-fetch-emulado.mjs';
import { generar } from './fotos-android.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(`${REPO}/package.json`);
const d = require(`${REPO}/packages/domain/dist/index.js`);
const sharp = require('sharp');
const borrador = await import(pathToFileURL(`${REPO}/apps/mobile/src/borrador-de-comida-diferente.ts`).href);
const BASE = process.env.BE_API ?? 'https://be-api-hndp.onrender.com/api/v1';

// La sesión de DEMO-A01 (APK) llega por el entorno: ninguna credencial queda en el repositorio.
const a01 = { token: process.env.BE_TOKEN_A01 };
if (!a01.token) throw new Error('Falta BE_TOKEN_A01: el token de una sesión APK de la cuenta de prueba.');
const api = d.crearClienteBe({ baseUrl: BASE, superficie: 'APK', fetch: fetchDeExpo });
const clave = () => `verif-foto-${crypto.randomUUID()}`;
const subidos = [];
let fallas = 0;
const exigir = (cond, que) => {
  if (!cond) {
    fallas++;
    console.log(`  FALLA: ${que}`);
  }
};

console.log(`expo ${VERSION_DE_EXPO} · API ${BASE}`);
for (const caso of await generar()) {
  console.log(`\n${caso.nombre} · selector ${caso.selector.mimeType} ${caso.selector.width}×${caso.selector.height} · ${caso.bytes} bytes`);
  const elegida = borrador.fotoDesdeElSelector(caso.selector);
  if (!elegida.foto) {
    console.log(`  al elegir: ${elegida.motivo}`);
    exigir(caso.esperado === elegida.motivo, `esperado ${caso.esperado}`);
    continue;
  }
  const leida = await borrador.leerLaFoto(elegida.foto, fetchDeExpo);
  if (!leida.ok) {
    console.log(`  al leer: ${leida.motivo} (no se pidió la ruta) · aviso «${borrador.AVISO_DE_FOTO_INVALIDA[leida.motivo]}»`);
    exigir(caso.esperado === leida.motivo, `esperado ${caso.esperado}`);
    continue;
  }
  console.log(`  al leer: ${leida.bytes.byteLength} bytes, tipo real ${leida.tipo}`);
  const intencion = await api.crearIntencionDeSubida(a01.token, { purpose: 'MEAL_EVIDENCE', contentType: leida.tipo, byteSize: leida.bytes.byteLength, provenance: 'PERSON_PROVIDED', authorship: null }, clave());
  if (!intencion.ok) {
    console.log(`  API-MED-01: ${JSON.stringify(intencion)}`);
    exigir(false, 'intención');
    continue;
  }
  const { mediaId, uploadPath } = intencion.datos.data;
  subidos.push(mediaId);
  const subida = await api.subirMedio(uploadPath, leida.bytes, leida.tipo);
  const enviado = pedidos.at(-1).contentType;
  console.log(`  API-MED-02: Content-Type enviado ${JSON.stringify(enviado)} → ${subida.ok ? `200 ${subida.datos.data.status} · guardada ${subida.datos.data.width}×${subida.datos.data.height}, ${subida.datos.data.byteSize} bytes, ${subida.datos.data.contentType}` : `${subida.status} ${subida.codigo} ${JSON.stringify(subida.issues)}`}`);
  exigir(enviado === leida.tipo, 'el Content-Type enviado es el tipo real');
  exigir(subida.ok && subida.datos.data.status === 'AVAILABLE', 'sube');
  if (!subida.ok) continue;
  // Lo guardado: medidas (orientación), formato y metadatos.
  const acceso = await api.accederAMedio(a01.token, mediaId);
  const guardada = Buffer.from(await (await fetch(`${BASE}${acceso.datos.data.path}`)).arrayBuffer());
  const m = await sharp(guardada).metadata();
  const verticalOriginal = caso.selector.height > caso.selector.width;
  console.log(`  guardada: ${m.format} ${m.width}×${m.height} · EXIF ${m.exif ? 'presente' : 'ninguno'} · ICC ${m.icc ? 'presente' : 'ninguno'} · XMP ${m.xmp ? 'presente' : 'ninguno'}`);
  exigir(m.format === 'jpeg', 'JPEG');
  exigir(!m.exif && !m.xmp, 'sin metadatos (GPS, marca, modelo)');
  exigir(verticalOriginal === m.height > m.width, 'conserva la orientación');
}

// Reintentos sobre la foto de la cámara: la misma subida dos veces es el mismo medio; una subida cortada se repite en la
// misma ruta (la pantalla lo hace si la ruta sigue vigente).
console.log('\nreintentos');
const camara = (await generar()).find((c) => c.nombre === 'camara-horizontal.jpeg');
const foto = borrador.fotoDesdeElSelector(camara.selector).foto;
const leida = await borrador.leerLaFoto(foto, fetchDeExpo);
const intencion = await api.crearIntencionDeSubida(a01.token, { purpose: 'MEAL_EVIDENCE', contentType: leida.tipo, byteSize: leida.bytes.byteLength, provenance: 'PERSON_PROVIDED', authorship: null }, clave());
subidos.push(intencion.datos.data.mediaId);
// La primera respuesta «se pierde» (sin red, la pantalla conserva la ruta) y la subida se repite en la misma ruta.
const primera = await api.subirMedio(intencion.datos.data.uploadPath, leida.bytes, leida.tipo);
const repetida = await api.subirMedio(intencion.datos.data.uploadPath, leida.bytes, leida.tipo);
console.log(`  subida: ${primera.ok ? primera.datos.data.mediaId.slice(0, 8) : primera.codigo} · repetida en la misma ruta: ${repetida.ok ? repetida.datos.data.mediaId.slice(0, 8) : repetida.codigo}`);
exigir(primera.ok && repetida.ok && primera.datos.data.mediaId === repetida.datos.data.mediaId, 'la misma subida repetida es el mismo medio');

// Limpieza: cada foto de prueba se suprime (API-MED-05), con su registro de supresión.
let suprimidos = 0;
for (const id of subidos) {
  const r = await api.suprimirMedio(a01.token, id, clave());
  if (r.ok && r.datos.data.status === 'DELETED') suprimidos++;
}
console.log(`\nsuprimidas ${suprimidos} de ${subidos.length} fotos de prueba`);
exigir(suprimidos === subidos.length, 'limpieza');
console.log(fallas === 0 ? 'RESULTADO: todo como se esperaba' : `RESULTADO: ${fallas} fallas`);
process.exitCode = fallas === 0 ? 0 : 1;
