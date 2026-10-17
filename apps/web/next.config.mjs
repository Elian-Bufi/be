/**
 * Export estático servido por Render Static Site: 07 CAND-07-J opción B, «export estático + CORS» (DL-007, DL-030).
 * Cabeceras de seguridad (HSTS, CSP) en render.yaml: el host estático las aplica.
 * Sin variables NEXT_PUBLIC_* (07 §27): la identidad de build y la URL pública de la API se inyectan en tiempo de build
 * y no son secretas.
 *
 * DL-030 (decisión de Dirección, 2026-09-19): el website llama a la API **directo**, con CORS, y no por un rewrite
 * same-origin. Detrás del rewrite, la API veía un pool de IPs del proxy de Render y no la de la persona, y la
 * evidencia de A1/A2 necesita la IP real (08 §12.2). Se pasa de la opción C a la B de CAND-07-J, invocando su «salvo
 * necesidad».
 * - Build en Render: BE_API_BASE_URL es obligatoria y https; sin ella el build falla (no se publica un website roto).
 * - `next dev` (solo local): sin BE_API_BASE_URL, /api/* se reescribe a BE_API_LOCAL (por defecto http://localhost:3001).
 *
 * WP-ACCESO-GOOGLE (DL-138): BE_GOOGLE_WEB_CLIENT_ID es el client ID «Aplicación web» de Google. Es optativa y pública (va
 * en el JS del website, como en cualquier página con «Continuar con Google»); no es un secreto. Sin ella, el website no
 * muestra el botón ni carga nada de Google. Con un valor que no tiene la forma de un client ID, el build falla, como la
 * API con GOOGLE_CLIENT_IDS: puede ser un secreto pegado por error, y el mensaje no lo repite.
 * @type {import('next').NextConfig}
 */
import { readFileSync } from 'node:fs';

const desarrollo = process.env.NODE_ENV === 'development';
/** La versión del website sale de su package.json: una sola fuente, sin números escritos a mano en las pantallas. */
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
const apiBaseUrl = (process.env.BE_API_BASE_URL ?? '').replace(/\/+$/, '');
const googleWebClientId = (process.env.BE_GOOGLE_WEB_CLIENT_ID ?? '').trim();

if (process.env.RENDER && !/^https:\/\/[a-z0-9.-]+$/i.test(apiBaseUrl)) {
  throw new Error('BE_API_BASE_URL es obligatoria en el build de Render: origen https de la API, sin ruta (DL-030)');
}
// La misma forma que exige la API (apps/api/src/config/entorno.ts).
if (googleWebClientId && !/^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/.test(googleWebClientId)) {
  throw new Error('BE_GOOGLE_WEB_CLIENT_ID no tiene la forma de un client ID de Google (…apps.googleusercontent.com) (DL-138)');
}

const nextConfig = {
  ...(desarrollo
    ? {
        async rewrites() {
          return [{ source: '/api/:ruta*', destination: `${process.env.BE_API_LOCAL ?? 'http://localhost:3001'}/api/:ruta*` }];
        },
      }
    : { output: 'export' }),
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  env: {
    BE_VERSION: version,
    BE_COMMIT: process.env.RENDER_GIT_COMMIT ?? '',
    BE_CONSTRUIDO_EN: new Date().toISOString(),
    BE_API_BASE_URL: apiBaseUrl,
    BE_GOOGLE_WEB_CLIENT_ID: googleWebClientId,
  },
};

export default nextConfig;
