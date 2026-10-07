// Reproducción del defecto de la 0.15.0-candidata.1 (Nutrición → Cena → «Comí algo diferente» → Cámara → Guardar), con
// el código de la candidata: la selección y la validación de `borrador-de-comida-diferente.ts` de `main`, la lectura y la
// subida como `pantallas/comida-diferente.tsx` (`fetch(uri)` → `.blob()` → `api.subirMedio(ruta, blob, tipo)`), el
// cliente real de `@be/domain` y el `fetch` de Expo emulado. Contra la API real de `test`, como DEMO-A01.
// No registra ninguna comida: solo la intención y la subida (un medio sin asociar, que solo ve quien lo subió).
import { createRequire } from 'node:module';
import { fetchDeExpo, pedidos, VERSION_DE_EXPO } from './expo-fetch-emulado.mjs';
import { generar } from './fotos-android.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(`${REPO}/package.json`);
const d = require(`${REPO}/packages/domain/dist/index.js`);
// Para reproducir el defecto, MODULO apunta al módulo de la candidata (por ejemplo, el de `main` en ace91eb).
const borrador = await import(process.env.MODULO ?? pathToFileURL(`${REPO}/apps/mobile/src/borrador-de-comida-diferente.ts`).href);

// La sesión de DEMO-A01 (APK) llega por el entorno: ninguna credencial queda en el repositorio.
const a01 = { token: process.env.BE_TOKEN_A01 };
if (!a01.token) throw new Error('Falta BE_TOKEN_A01: el token de una sesión APK de la cuenta de prueba.');
const api = d.crearClienteBe({ baseUrl: process.env.BE_API ?? 'https://be-api-hndp.onrender.com/api/v1', superficie: 'APK', fetch: fetchDeExpo });
const caso = (await generar()).find((c) => c.nombre === 'camara-horizontal.jpeg');
console.log(`expo ${VERSION_DE_EXPO} · ${caso.nombre} (${caso.bytes} bytes)`);

// 1. Elegir: la vista previa aparece si el selector la acepta.
const elegida = borrador.fotoDesdeElSelector(caso.selector);
console.log('selección:', elegida.motivo ?? `aceptada, tipo ${elegida.foto.tipo}`);
// 2. Guardar: leer los bytes como en la candidata.
const blob = await (await fetchDeExpo(elegida.foto.uri)).blob();
console.log(`lectura: Blob de ${blob.size} bytes, tipo «${blob.type}»`);
const motivo = borrador.motivoDeFotoInvalida({ ...elegida.foto, bytes: blob.size });
console.log('validación en el teléfono:', motivo ?? 'pasa');
// 3. La intención (API-MED-01) y la subida (API-MED-02).
const intencion = await api.crearIntencionDeSubida(a01.token, { purpose: 'MEAL_EVIDENCE', contentType: elegida.foto.tipo, byteSize: blob.size, provenance: 'PERSON_PROVIDED', authorship: null }, `repro-${crypto.randomUUID()}`);
console.log('API-MED-01:', intencion.ok ? `201 · medio ${intencion.datos.data.mediaId.slice(0, 8)}…` : JSON.stringify(intencion));
const subida = await api.subirMedio(intencion.datos.data.uploadPath, blob, elegida.foto.tipo);
console.log('API-MED-02: Content-Type enviado', JSON.stringify(pedidos.at(-1).contentType), '(la app pidió', JSON.stringify(elegida.foto.tipo) + ')');
console.log('API-MED-02:', subida.ok ? `200 · ${subida.datos.data.status}` : `${subida.status} ${subida.codigo} ${JSON.stringify(subida.issues)}`);
// 4. Lo que muestra la pantalla (fotoRechazada de la candidata).
if (!subida.ok && subida.tipo === 'API' && /^FILE_/.test(subida.codigo)) {
  const aviso = subida.codigo === 'FILE_CONTENT_INVALID' ? borrador.AVISO_DE_FOTO_INVALIDA.DIMENSIONES : borrador.AVISO_DE_FOTO_INVALIDA.TIPO;
  console.log('pantalla:', aviso);
}
// Limpieza: el medio de la intención (sin bytes) se suprime (API-MED-05).
const suprimido = await api.suprimirMedio(a01.token, intencion.datos.data.mediaId, `repro-${crypto.randomUUID()}`);
console.log('limpieza: medio', suprimido.ok ? suprimido.datos.data.status : JSON.stringify(suprimido));
