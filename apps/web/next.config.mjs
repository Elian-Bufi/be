/**
 * Export estático servido por Render Static Site (07 CAND-07-J, opción C).
 * Cabeceras de seguridad y rewrite /api/* → API se declaran en render.yaml (el host estático las aplica).
 * Sin variables NEXT_PUBLIC_* (07 §27): la identidad de build se inyecta en tiempo de build y no es secreta.
 * En `next dev` (solo local) el mismo rewrite apunta a BE_API_LOCAL (por defecto http://localhost:3001).
 * @type {import('next').NextConfig}
 */
const desarrollo = process.env.NODE_ENV === 'development';

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
  },
};

export default nextConfig;
