'use client';

/**
 * Las tres cifras del Espacio profesional (WP-TABLERO-ALTA-GAMA TB-06; DL-163 D-3), debajo del saludo:
 * - **«Te toca a vos»** y su desglose (Revisiones, Planes y Tomas, las vistas de DL-107) filtran el carril de abajo:
 *   son botones con `aria-pressed`, y tocar el elegido vuelve a «Todo».
 * - **«Esperan respuesta»** (formularios, solicitudes e invitaciones) y **«Personas»** (las de «Tus asesorados», por
 *   área) son enlaces dentro de la página, sin `aria-pressed`: llevan a su sección.
 * Cada una dice «al menos» si faltan páginas por leer, y nada se cuenta mientras su lista no se leyó: sin lectura, no hay
 * número. Ninguna cifra ordena ni marca a nadie: cuentan pendientes y personas, no lo que hacen las personas.
 */
import { contarPendientesPorVista, filtroDeLaVistaDePendientes, vistaDeLosFiltrosDePendientes, COPY_CARTERA, numero, type FiltroDePendientes } from '@be/domain';
import { useId } from 'react';
import { COPY_MESA, VISTAS_QUE_TE_TOCAN, type VistaQueTeToca } from './mesa';
import type { PendienteDeCartera } from '@be/domain';

/** Una cuenta leída: cuántos y si la lista se leyó entera. `null`: todavía no (o falló). */
export type Cuenta = { readonly n: number; readonly completa: boolean } | null;

const cifra = (c: Cuenta): string => (c ? COPY_MESA.cifra(c.n, c.completa).replace(String(c.n), numero(c.n)) : '—');

export function CifrasDelEspacio({
  saludo,
  teTocan,
  completa,
  filtro,
  onFiltro,
  esperan,
  personas,
}: {
  /** «Buen día, Sofía», o a secas. */
  saludo: string;
  /** Los pendientes de «Te toca a vos», leídos; `null` mientras se leen. */
  teTocan: readonly PendienteDeCartera[] | null;
  completa: boolean;
  filtro: FiltroDePendientes;
  onFiltro: (f: FiltroDePendientes) => void;
  esperan: { readonly total: Cuenta; readonly formularios: Cuenta; readonly solicitudes: Cuenta; readonly invitaciones: Cuenta };
  personas: { readonly total: Cuenta; readonly porArea: readonly { readonly area: string; readonly personas: number }[] };
}) {
  const id = useId();
  const cuentas = teTocan ? contarPendientesPorVista(teTocan) : null;
  const elegida = vistaDeLosFiltrosDePendientes(filtro);
  const de = (v: VistaQueTeToca): Cuenta => (cuentas ? { n: cuentas[v], completa } : null);
  const elegir = (v: VistaQueTeToca) => onFiltro(filtroDeLaVistaDePendientes(elegida === v && v !== 'TODO' ? 'TODO' : v));

  return (
    <div className="encabezado-del-espacio">
      <p className="encabezado-del-espacio__saludo">{saludo}</p>
      <div className="cifras-del-espacio">
        <section className="cifra-del-espacio" aria-labelledby={`${id}-te-toca`}>
          <button type="button" className="cifra-del-espacio__principal" aria-pressed={elegida === 'TODO'} aria-describedby={`${id}-te-toca-desglose`} onClick={() => elegir('TODO')}>
            <span className="cifra-del-espacio__numero cifra">{cifra(de('TODO'))}</span>
            <span id={`${id}-te-toca`} className="cifra-del-espacio__nombre">
              {COPY_MESA.teToca}
            </span>
          </button>
          <ul id={`${id}-te-toca-desglose`} className="cifra-del-espacio__desglose" aria-label={`${COPY_MESA.teToca}, por tipo`}>
            {VISTAS_QUE_TE_TOCAN.filter((v) => v !== 'TODO').map((v) => (
              <li key={v}>
                <button type="button" className="cifra-del-espacio__parte" aria-pressed={elegida === v} onClick={() => elegir(v)}>
                  {COPY_CARTERA.vista[v]} <span className="cifra">{cifra(de(v))}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="cifra-del-espacio" aria-labelledby={`${id}-esperan`}>
          <a className="cifra-del-espacio__principal" href="#esperan-respuesta" aria-describedby={`${id}-esperan-desglose`}>
            <span className="cifra-del-espacio__numero cifra">{cifra(esperan.total)}</span>
            <span id={`${id}-esperan`} className="cifra-del-espacio__nombre">
              {COPY_MESA.esperan}
            </span>
          </a>
          <p id={`${id}-esperan-desglose`} className="cifra-del-espacio__desglose nota">
            {COPY_MESA.formularios} <span className="cifra">{cifra(esperan.formularios)}</span> · {COPY_MESA.solicitudes} <span className="cifra">{cifra(esperan.solicitudes)}</span> · {COPY_MESA.invitaciones}{' '}
            <span className="cifra">{cifra(esperan.invitaciones)}</span>
          </p>
        </section>
        <section className="cifra-del-espacio" aria-labelledby={`${id}-personas`}>
          <a className="cifra-del-espacio__principal" href="#tus-asesorados" aria-describedby={`${id}-personas-desglose`}>
            <span className="cifra-del-espacio__numero cifra">{cifra(personas.total)}</span>
            <span id={`${id}-personas`} className="cifra-del-espacio__nombre">
              {COPY_MESA.personas}
            </span>
          </a>
          <p id={`${id}-personas-desglose`} className="cifra-del-espacio__desglose nota">
            {personas.total && personas.porArea.length > 0
              ? personas.porArea.map((a, i) => (
                  <span key={a.area}>
                    {i > 0 ? ' · ' : ''}
                    {a.area} <span className="cifra">{numero(a.personas)}</span>
                  </span>
                ))
              : personas.total
                ? 'Sin áreas con acceso'
                : '—'}
          </p>
        </section>
      </div>
    </div>
  );
}
