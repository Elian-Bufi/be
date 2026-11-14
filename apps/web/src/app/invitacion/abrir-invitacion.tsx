'use client';

/**
 * Lo que ve quien abre el enlace de una invitación en el navegador (WP-INVITACION; DEUDA_LEGAJO DL-136).
 * - En Android, «Abrir en la app BE» usa un enlace `intent:` con el esquema `be://`: si la APK está instalada la abre en
 *   la invitación; si no, Chrome lleva a la descarga. Con los App Links verificados, tocar el enlace en WhatsApp ya abre
 *   la APK y esta página ni se ve.
 * - En una computadora, el mismo enlace como QR, para escanearlo con el teléfono.
 * - El token sale del fragmento y queda en el navegador: esta página no llama a la API.
 * - Sin la app, la descarga va al archivo de la última publicación, el mismo de la portada (PG-06), y no a la página de
 *   publicaciones de GitHub, en inglés (PG-17 de WP-PULIDO-GRANDES, §10 punto 5).
 */
import { COPY_INVITACION, tokenDelFragmento } from '@be/domain';
import { useEffect, useState } from 'react';
import { CodigoQr } from '../../components/codigo-qr';
import { APK_DE_LA_ULTIMA } from '../../lib/descarga-de-la-app';

const PAQUETE = 'com.elianbufi.be';

type Lectura = { tipo: 'leyendo' } | { tipo: 'sin-invitacion' } | { tipo: 'lista'; token: string; android: boolean; enlace: string };

export function AbrirInvitacion() {
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'leyendo' });

  useEffect(() => {
    const token = tokenDelFragmento(window.location.hash);
    setLectura(token ? { tipo: 'lista', token, android: /Android/i.test(navigator.userAgent), enlace: window.location.href } : { tipo: 'sin-invitacion' });
  }, []);

  if (lectura.tipo === 'leyendo') return <h1>{COPY_INVITACION.paginaTitulo}</h1>;
  if (lectura.tipo === 'sin-invitacion') {
    return (
      <>
        <h1>{COPY_INVITACION.paginaTitulo}</h1>
        <p>{COPY_INVITACION.sinInvitacion}</p>
      </>
    );
  }
  return (
    <>
      <h1>{COPY_INVITACION.paginaTitulo}</h1>
      <p>{COPY_INVITACION.paginaTexto}</p>
      {lectura.android ? (
        <p>
          <a
            className="boton boton--primario"
            href={`intent://invitacion?t=${encodeURIComponent(lectura.token)}#Intent;scheme=be;package=${PAQUETE};S.browser_fallback_url=${encodeURIComponent(APK_DE_LA_ULTIMA)};end`}
          >
            {COPY_INVITACION.abrirEnLaApp}
          </a>
        </p>
      ) : (
        <figure className="invitar__qr">
          <CodigoQr texto={lectura.enlace} etiqueta={COPY_INVITACION.desdeLaComputadora} />
          <figcaption className="nota">{COPY_INVITACION.desdeLaComputadora}</figcaption>
        </figure>
      )}
      <p>
        <a className="boton boton--secundario" href={APK_DE_LA_ULTIMA} download rel="noopener noreferrer" data-bajar-la-app>
          {COPY_INVITACION.descargar}
        </a>
      </p>
      <p className="nota">{COPY_INVITACION.despuesDeInstalar}</p>
    </>
  );
}
