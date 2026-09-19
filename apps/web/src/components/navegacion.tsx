'use client';

/**
 * Navegación de las rutas con sesión. Dos espacios separados (10-B01; criterio 11A n.º 1): el del asesorado vive bajo
 * `/account` y nunca bajo `/pro` (DL-025); el profesional tiene su propio espacio en `/pro` (DL-041).
 * Mostrar u ocultar un enlace no autoriza nada: cada operación la decide la API.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DE_CUENTA = [
  { href: '/account', texto: 'Cuenta' },
  { href: '/account/relationships', texto: 'Vínculos' },
  { href: '/account/privacy', texto: 'Privacidad' },
] as const;

const PROFESIONAL = [
  { href: '/pro', texto: 'Espacio profesional' },
  { href: '/account', texto: 'Cuenta' },
] as const;

export function NavegacionDeCuenta() {
  return <Navegacion etiqueta="Tu cuenta" enlaces={DE_CUENTA} />;
}

export function NavegacionProfesional() {
  return <Navegacion etiqueta="Espacio profesional" enlaces={PROFESIONAL} />;
}

function Navegacion({ etiqueta, enlaces }: { etiqueta: string; enlaces: readonly { href: string; texto: string }[] }) {
  const ruta = usePathname();
  // La sección actual es el enlace más específico que contiene la ruta: /account/relationships/detail marca «Vínculos».
  const actual = enlaces
    .filter((e) => ruta === e.href || ruta.startsWith(`${e.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="navegacion" aria-label={etiqueta}>
      <ul>
        {enlaces.map((e) => (
          <li key={e.href}>
            <Link href={e.href} aria-current={e.href === actual ? (ruta === e.href ? 'page' : 'location') : undefined}>
              {e.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
