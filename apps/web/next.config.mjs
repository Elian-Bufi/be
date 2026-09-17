/**
 * Export estático servido por Render Static Site (07 CAND-07-J, opción C).
 * Cabeceras de seguridad y rewrite /api/* → API se declaran en render.yaml (el host estático las aplica).
 * Sin variables NEXT_PUBLIC_* (07 §27): la identidad de build se inyecta en tiempo de build y no es secreta.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  env: {
    BE_COMMIT: process.env.RENDER_GIT_COMMIT ?? '',
    BE_CONSTRUIDO_EN: new Date().toISOString(),
  },
};

export default nextConfig;
