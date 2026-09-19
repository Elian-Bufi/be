/**
 * Export estático servido por Render Static Site (07 CAND-07-J, export estático; DL-007).
 * Cabeceras de seguridad (HSTS, CSP) en render.yaml: el host estático las aplica.
 * Sin variables NEXT_PUBLIC_* (07 §27): la identidad de build y la URL pública de la API se inyectan en tiempo de build
 * y no son secretas.
 *
 * DL-030 (decisión de Dirección, 2026-09-19): el website llama a la API **directo**, con CORS, y no por un rewrite
 * same-origin. Detrás del rewrite, la API veía un pool de IPs del proxy de Render y no la de la persona, y la
 * evidencia de A1/A2 necesita la IP real (08 §12.2). Es un desvío fundamentado de 07 CAND-07-J C.
 * - Build en Render: BE_API_BASE_URL es obligatoria y https; sin ella el build falla (no se publica un website roto).
 * - `next dev` (solo local): sin BE_API_BASE_URL, /api/* se reescribe a BE_API_LOCAL (por defecto http://localhost:3001).
 * @type {import('next').NextConfig}
 */
const desarrollo = process.env.NODE_ENV === 'development';
const apiBaseUrl = (process.env.BE_API_BASE_URL ?? '').replace(/\/+$/, '');

if (process.env.RENDER && !/^https:\/\/[a-z0-9.-]+$/i.test(apiBaseUrl)) {
  throw new Error('BE_API_BASE_URL es obligatoria en el build de Render: origen https de la API, sin ruta (DL-030)');
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
    BE_COMMIT: process.env.RENDER_GIT_COMMIT ?? '',
    BE_CONSTRUIDO_EN: new Date().toISOString(),
    BE_API_BASE_URL: apiBaseUrl,
  },
};

export default nextConfig;
