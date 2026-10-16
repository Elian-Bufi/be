'use client';

/**
 * La campana del encabezado (WP-NOVEDADES-Y-AVISOS, DL-133; RF-061): lleva al centro de novedades del espacio en el que
 * está la persona —«/pro/news» en el espacio profesional, «/account/news» en la cuenta— y dice cuántas tiene sin leer.
 * - Solo con sesión. El número se pide al cambiar de página (una lectura liviana: una novedad y el conteo).
 * - El número es un dato, no una alerta: sin colores de alarma ni animación (UC-P30: «no se presentan como alertas
 *   clínicas»). El nombre accesible lo dice entero: «Novedades, 2 sin leer».
 * - Si la lectura falla, la campana queda sin número: las novedades siguen en su página.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { Icono } from './icono';

export function CampanaDeNovedades() {
  const ruta = usePathname();
  const { sesion } = useSesion();
  const token = sesion?.token ?? null;
  const [sinLeer, setSinLeer] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    void api.consultarNovedades(token, { limit: '1' }).then((r) => {
      if (vigente) setSinLeer(r.ok ? r.datos.unreadCount : null);
    });
    return () => {
      vigente = false;
    };
  }, [token, ruta]);

  if (!token) return null;
  const destino = ruta.startsWith('/pro') ? '/pro/news' : '/account/news';
  const actual = ruta === destino;
  const nombre = sinLeer && sinLeer > 0 ? `Novedades, ${sinLeer} sin leer` : 'Novedades';
  return (
    <Link href={destino} className="campana-de-novedades" aria-label={nombre} aria-current={actual ? 'page' : undefined}>
      <Icono nombre="novedades" />
      <span className="campana-de-novedades__palabra" aria-hidden="true">
        Novedades
      </span>
      {sinLeer && sinLeer > 0 ? (
        <span className="campana-de-novedades__cuenta" aria-hidden="true">
          {sinLeer > 99 ? '99+' : sinLeer}
        </span>
      ) : null}
    </Link>
  );
}
