// El `fetch` global de la APK (Expo 57: `expo/src/winter/runtime.native.ts` instala `expo/fetch`), emulado en Node con
// su código JS real y su lado nativo de Android reproducido según la fuente:
// - el cuerpo y las cabeceras pasan por `normalizeBodyInitAsync` y `overrideHeaders` de
//   `node_modules/expo/src/winter/fetch/RequestUtils.ts`, transpilados tal cual;
// - un `file://` se responde como `OkHttpFileUrlInterceptor.kt`: código 200, el cuerpo del archivo y NINGUNA cabecera
//   (el tipo va en el `ResponseBody`, que no se copia a las cabeceras: `NativeResponse.createResponseInit` solo lee
//   `response.headers`);
// - `Response.blob()` toma el tipo de la cabecera `content-type` o `''`, como `FetchResponse.ts`;
// - el pedido sale con las cabeceras que quedaron, como `NativeRequest.kt` (`Request.Builder().headers(headers)`).
// Registra las cabeceras de cada pedido saliente en `pedidos`, para mostrar qué recibió la API.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(`${REPO}/package.json`);
const ts = require('typescript');
const EXPO = `${REPO}/node_modules/expo`;
export const VERSION_DE_EXPO = require(`${EXPO}/package.json`).version;

function cargarTs(ruta, modulos) {
  const fuente = readFileSync(ruta, 'utf8');
  const { outputText } = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function('exports', 'require', 'module', outputText)(module.exports, (m) => {
    if (m in modulos) return modulos[m];
    throw new Error(`módulo no previsto: ${m}`);
  }, module);
  return module.exports;
}
const blobUtils = cargarTs(`${EXPO}/src/utils/blobUtils.ts`, {});
export const RequestUtils = cargarTs(`${EXPO}/src/winter/fetch/RequestUtils.ts`, { '../../utils/blobUtils': blobUtils, './convertFormData': {} });

export const pedidos = [];

/** Lo que devuelve `expo/fetch`: `blob()` con el tipo de la cabecera, como `FetchResponse.ts`. */
function respuestaDeExpo(r) {
  return {
    ok: r.ok,
    status: r.status,
    headers: r.headers,
    arrayBuffer: () => r.arrayBuffer(),
    text: () => r.text(),
    json: () => r.json(),
    async blob() {
      const type = r.headers.get('content-type') ?? '';
      return new Blob([await r.arrayBuffer()], { type });
    },
  };
}

export async function fetchDeExpo(entrada, init = {}) {
  const url = String(entrada);
  if (url.startsWith('file://')) {
    // OkHttpFileUrlInterceptor: 200 y el archivo, sin cabeceras.
    try {
      const bytes = readFileSync(fileURLToPath(url));
      return respuestaDeExpo(new Response(bytes, { status: 200 }));
    } catch {
      return respuestaDeExpo(new Response('File not found', { status: 404, headers: { 'content-type': 'text/plain' } }));
    }
  }
  let headers = RequestUtils.normalizeHeadersInit(init.headers);
  const { body, overriddenHeaders } = await RequestUtils.normalizeBodyInitAsync(init.body);
  if (overriddenHeaders) headers = RequestUtils.overrideHeaders(headers, overriddenHeaders);
  pedidos.push({ metodo: init.method ?? 'GET', url, contentType: (headers.find(([k]) => k.toLowerCase() === 'content-type') ?? [null, '(sin cabecera)'])[1] });
  const r = await fetch(url, { method: init.method, headers, body, redirect: 'follow' });
  return respuestaDeExpo(r);
}
