'use client';

/**
 * Navegación de las rutas con sesión. Dos espacios separados (10-B01; criterio 11A n.º 1): el del asesorado vive bajo
 * `/account` y nunca bajo `/pro` (DL-025); el profesional tiene su propio espacio en `/pro` (DL-041).
 * Mostrar u ocultar un enlace no autoriza nada: cada operación la decide la API.
 *
 * WP-ESCRITORIO-AMABLE: en el espacio profesional quedan los cuatro lugares de trabajo; «Cuenta» está en el menú de la
 * esquina del encabezado (`MenuDeCuenta`).
 */
import { Enlace } from './enlace';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useActualALaVista } from './pestanas';

const DE_CUENTA = [
  { href: '/account', texto: 'Cuenta' },
  { href: '/account/relationships', texto: 'Vínculos' },
  { href: '/account/privacy', texto: 'Privacidad' },
] as const;

const PROFESIONAL = [
  { href: '/pro', texto: 'Espacio profesional' },
  { href: '/pro/templates', texto: 'Plantillas y habituales' },
  { href: '/pro/recipes', texto: 'Mis recetas' },
  { href: '/pro/exercises', texto: 'Mis ejercicios' },
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
  // DL-113: en el teléfono la línea se desplaza de costado; la sección actual queda siempre a la vista.
  const lista = useRef<HTMLUListElement>(null);
  useActualALaVista(lista, actual);
  // ED-02: con cambios sin guardar, un enlace de la barra guarda antes o pregunta (en /pro; en /account no hay editores).
  return (
    <nav className="navegacion" aria-label={etiqueta}>
      <ul ref={lista} className="desplazable-x">
        {enlaces.map((e) => (
          <li key={e.href}>
            <Enlace href={e.href} aria-current={e.href === actual ? (ruta === e.href ? 'page' : 'location') : undefined}>
              {e.texto}
            </Enlace>
          </li>
        ))}
      </ul>
    </nav>
  );
}
