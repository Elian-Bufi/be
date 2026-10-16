'use client';

/**
 * Un código QR dibujado en el navegador (WP-INVITACION, DEUDA_LEGAJO DL-136). El enlace de una invitación lleva su token:
 * por eso el QR se arma acá y no en un servicio externo, que lo vería. Va negro sobre blanco (los tokens `--qr-fondo` y
 * `--qr-modulo`) y con margen, como lo leen las cámaras, en los dos temas.
 */
import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/** Los cuatro módulos de margen que piden los lectores alrededor del código. */
const MARGEN = 4;

export function CodigoQr({ texto, etiqueta, tamano = 200 }: { texto: string; etiqueta: string; tamano?: number }) {
  const { modulos, camino } = useMemo(() => {
    // Nivel M: tolera un 15 % de daño (una mancha, un reflejo en la pantalla) sin agrandar demasiado el código.
    const qr = qrcode(0, 'M');
    qr.addData(texto, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let fila = 0; fila < n; fila++) {
      for (let columna = 0; columna < n; columna++) if (qr.isDark(fila, columna)) d += `M${columna} ${fila}h1v1h-1z`;
    }
    return { modulos: n, camino: d };
  }, [texto]);
  const lado = modulos + MARGEN * 2;
  return (
    <svg
      className="codigo-qr"
      role="img"
      aria-label={etiqueta}
      width={tamano}
      height={tamano}
      viewBox={`${-MARGEN} ${-MARGEN} ${lado} ${lado}`}
      shapeRendering="crispEdges"
    >
      <rect className="codigo-qr__fondo" x={-MARGEN} y={-MARGEN} width={lado} height={lado} />
      <path className="codigo-qr__modulos" d={camino} />
    </svg>
  );
}
