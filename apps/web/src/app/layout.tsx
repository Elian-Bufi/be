import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
    <html lang="es-AR">
      <body>
        <ProveedorDeSesion>{children}</ProveedorDeSesion>
      </body>
    </html>
  );
}
