import type { Metadata, Viewport } from 'next';
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

/**
 * `interactive-widget=resizes-content`: con el teclado del teléfono abierto, la ventana se achica en vez de quedar tapada.
 * Así una barra fija abajo, como la de «Guardar» de la preparación, queda arriba del teclado y no detrás. En la prueba de
 * Dirección con la 0.13.1, «Guardar» no siempre se veía con el teclado abierto. El navegador que no lo conoce lo ignora.
 */
export const viewport: Viewport = { width: 'device-width', initialScale: 1, interactiveWidget: 'resizes-content' };

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
