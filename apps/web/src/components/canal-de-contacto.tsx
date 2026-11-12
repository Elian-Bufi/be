'use client';

/**
 * UF-07 de WP-USO-FINAL (DL-169) · el canal de ayuda y contacto, leído de la API (API-SOP-01) cada vez que se muestra: el
 * website es estático y ninguna dirección queda escrita en él, así que un cambio de configuración se ve sin otro build.
 * - **Completo** (`/help` y `/account`): soporte y privacidad, cada uno con qué se escribe ahí y su `mailto:`.
 * - **Solo soporte** (`/recover`, la recuperación asistida): la dirección a la que hay que escribir.
 * Sin configuración, dice que el canal todavía no está publicado; sin respuesta, lo dice y ofrece reintentar.
 */
import { COPY_AYUDA, type CanalDeContactoResponse } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

type Estado = { readonly tipo: 'cargando' } | { readonly tipo: 'sin-respuesta' } | { readonly tipo: 'listo'; readonly canal: CanalDeContactoResponse['data'] };
const A = COPY_AYUDA;

export function CanalDeContacto({ soloSoporte = false }: { soloSoporte?: boolean }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  const leer = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = await api.consultarCanalDeContacto();
    setEstado(r.ok ? { tipo: 'listo', canal: r.datos.data } : { tipo: 'sin-respuesta' });
  }, []);
  useEffect(() => {
    void leer();
  }, [leer]);

  if (estado.tipo === 'cargando') {
    return (
      <p className="nota" aria-busy="true">
        {A.cargando}
      </p>
    );
  }
  if (estado.tipo === 'sin-respuesta') {
    return (
      <div className="canal-de-contacto">
        <p role="alert">{A.sinRespuesta}</p>
        <button type="button" className="boton boton--secundario boton--compacto" onClick={() => void leer()}>
          {A.reintentar}
        </button>
      </div>
    );
  }
  const { supportEmail, privacyEmail } = estado.canal;
  const vias = [
    { clave: 'soporte', textos: A.soporte, direccion: supportEmail },
    ...(soloSoporte ? [] : [{ clave: 'privacidad', textos: A.privacidad, direccion: privacyEmail }]),
  ].filter((v) => v.direccion !== null);
  if (vias.length === 0) return <p className="nota">{A.sinCanal}</p>;
  return (
    <ul className="canal-de-contacto lista-simple">
      {vias.map((v) => (
        <li key={v.clave}>
          <p>
            <strong>{v.textos.titulo}</strong> · {v.textos.queEs}
          </p>
          <p>
            {/* El destino empieza con «mailto:» escrito acá, para que la guardia de enlaces vea que no recarga la página. */}
            <a href={`mailto:${v.direccion}?subject=${encodeURIComponent(v.textos.asunto)}`}>{v.direccion}</a>
          </p>
        </li>
      ))}
    </ul>
  );
}
