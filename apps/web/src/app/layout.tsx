import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SCRIPT_DE_INICIO, TEMA_PREDETERMINADO } from '../lib/apariencia';
import { ProveedorDeSesion } from '../lib/sesion';
import './tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'BE',
  description: 'BE — Plataforma integrada de inteligencia en salud.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // El atributo lo pone el script de inicio antes del primer dibujo con la preferencia guardada; el valor del HTML
    // servido es el predeterminado, y `suppressHydrationWarning` cubre la diferencia solo en este atributo.
    <html lang="es-AR" data-tema={TEMA_PREDETERMINADO} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_INICIO }} />
      </head>
      <body>
        <ProveedorDeSesion>{children}</ProveedorDeSesion>
      </body>
    </html>
  );
}
