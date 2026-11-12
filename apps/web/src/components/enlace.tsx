'use client';

/**
 * ED-02 · El enlace interno del website: el `<Link>` de Next, que pasa por la guardia de la salida (`SalidaSegura`).
 *
 * Con cambios sin guardar en un editor, tocar un enlace guarda antes de salir (si todo se puede guardar) o pregunta, con
 * «Tenés cambios sin guardar». Sin cambios, o fuera del espacio profesional (donde no hay guardia), es un `<Link>` común.
 *
 * Antes, la guardia la ponía cada enlace a mano, en el `onNavigate`: la barra, las pestañas y «Volver a la ficha». Los
 * demás no la tenían: la marca «BE», la campana de Novedades, el menú de la cuenta o «Ir a Mis recetas» adentro del
 * editor de Nutrición. Escribir una cantidad y tocar uno de esos antes de la pausa del autoguardado perdía lo escrito sin
 * aviso (revisión adversaria de la etapa 1). Ahora en `app/pro/**` y en `components/**` nadie importa `next/link`
 * directo: todos usan este (TEST-EDP-003, la lectura de `salida-segura.test.mjs`).
 *
 * El destino va como texto: es el que se sigue después de guardar o de preguntar. Con `replace` (las pestañas de un área),
 * la navegación reemplaza la entrada del historial, también después de guardar.
 */
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useAlNavegar } from './salida-segura';

type PropsDelEnlace = Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'> & { readonly href: string };

export function Enlace({ href, replace, ...resto }: PropsDelEnlace) {
  const alNavegar = useAlNavegar();
  return <Link {...resto} href={href} replace={replace} onNavigate={alNavegar(href, replace ?? false)} />;
}
