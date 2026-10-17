'use client';

/**
 * La portada con la sesión abierta (DL-025; pedido de Dirección del 2026-10-17): quien ya inició sesión y vuelve a «/»
 * (el isotipo del encabezado, «Atrás») no ve «Comenzar» ni «Ya tengo una cuenta», sino que va a su inicio: el
 * profesional, a su espacio, y el resto, a Cuenta. Mientras la API responde, la portada no se muestra.
 *
 * Sin sesión (la primera visita, o después de recargar: el token vive solo en la memoria de la pestaña, DL-012), la
 * portada se muestra como siempre.
 */
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { buscarInicioPropio } from '../lib/inicio';
import { useSesion } from '../lib/sesion';

export function PortadaConSesion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { sesion } = useSesion();
  const token = sesion?.token ?? null;

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    void buscarInicioPropio(token).then((destino) => {
      if (vigente) router.replace(destino);
    });
    return () => {
      vigente = false;
    };
  }, [token, router]);

  if (!token) return children;
  return (
    <main id="contenido" className="landing">
      <p className="nota" aria-busy="true">
        Ya iniciaste sesión: te llevamos a tu inicio…
      </p>
    </main>
  );
}
