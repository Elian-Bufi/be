import Link from 'next/link';
import { MenuDeCuenta } from './menu-de-cuenta';
import type { ReactNode } from 'react';
import isotipo from '../marca/isotipo-96.png';

/**
 * Encabezado de marca, el mismo en el tema claro y en el oscuro: el isotipo, «BE», la navegación de la sección cuando
 * hay sesión (B10-10 §9: navegación superior) y, en la esquina, el menú de la cuenta (`MenuDeCuenta`), con la apariencia
 * adentro. «Saltar al contenido» es el primer foco de cada página (B10-10 §7): lleva al `<main id="contenido">`.
 *
 * WP-ESCRITORIO-AMABLE (E-19; decisión de Dirección del 2026-10-10): el aviso «Ambiente de prueba · solo datos
 * sintéticos» ya no va en la barra. Que en `test` solo haya datos sintéticos (08 §33) se sigue diciendo donde alguien
 * puede cargar datos por primera vez: en el pie de la cara pública (`Pie`) y en el formulario de registro.
 */
export function Encabezado({ navegacion }: { navegacion?: ReactNode }) {
  return (
    <header className="encabezado">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Link href="/" className="encabezado__marca" aria-label="BE, ir al inicio">
        {/* El isotipo es decorativo: el nombre accesible del enlace ya dice «BE». */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={isotipo.src} width={36} height={36} alt="" />
        <span aria-hidden="true">BE</span>
      </Link>
      {navegacion}
      <MenuDeCuenta />
    </header>
  );
}
