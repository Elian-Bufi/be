'use client';

/**
 * «Solicitudes enviadas» (REL-02), en un diálogo que se abre desde el pie del directorio (WP-ESCRITORIO-AMABLE,
 * parte 5): la tabla de siempre, a un clic. Muestra las que envió esta cuenta como profesional, con su estado.
 * - `<dialog>` nativo en modo modal (GUIA I.3). Se abre por el principio: el foco va al título.
 * - Si llega de un envío repetido, arriba dice por qué se abrió («Ya hay una solicitud pendiente igual…»).
 */
import { COPY_VINCULO, ETIQUETA_DE_FINALIDAD, type PaginaDeUnaLista, type SolicitudDeVinculo } from '@be/domain';
import { useEffect, useId, useRef } from 'react';
import { BloqueDeEstado } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { fecha } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';

export type EstadoDeLasSolicitudes = EstadoDeListaCompleta<PaginaDeUnaLista<SolicitudDeVinculo>>;

/** Las que envió esta cuenta como profesional: la lista trae también las que recibió como asesorada. */
export const solicitudesEnviadasPor = (solicitudes: readonly SolicitudDeVinculo[], profesionalId: string): SolicitudDeVinculo[] =>
  solicitudes.filter((s) => s.professional.identityId === profesionalId && s.initiatedBy === 'PROFESSIONAL');

export function SolicitudesEnviadas({
  abierto,
  aviso,
  solicitudes,
  profesionalId,
  onCerrar,
  onReintentar,
  onVerMas,
}: {
  abierto: boolean;
  /** Por qué se abrió sola, si fue así. */
  aviso: string | null;
  solicitudes: EstadoDeLasSolicitudes;
  profesionalId: string;
  onCerrar: () => void;
  onReintentar: () => void;
  onVerMas: () => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      titulo.current?.focus();
      d.scrollTop = 0;
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const propias = solicitudes.tipo === 'listo' ? solicitudesEnviadasPor(solicitudes.items, profesionalId) : [];

  return (
    <dialog ref={dialogo} className="dialogo dialogo--solicitudes" aria-labelledby={`${id}-titulo`} onClose={onCerrar}>
      <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1}>
        Solicitudes enviadas
      </h2>
      {aviso ? (
        <Aviso tipo="info">
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      {solicitudes.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando las solicitudes…
        </p>
      ) : null}
      {solicitudes.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[solicitudes.motivo]} titulo="No pudimos cargar las solicitudes" onReintentar={onReintentar} deQue="las solicitudes">
          {razonDeFalla(solicitudes.motivo)}
        </BloqueDeEstado>
      ) : null}
      {solicitudes.tipo === 'listo' ? (
        propias.length === 0 ? (
          <p>{COPY_VINCULO.sinSolicitudes}</p>
        ) : (
          <table className="tabla">
            <caption className="visualmente-oculto">Solicitudes de vínculo que enviaste</caption>
            <thead>
              <tr>
                <th scope="col">Asesorado</th>
                <th scope="col">Alcance</th>
                <th scope="col">Estado</th>
                <th scope="col">Enviada</th>
              </tr>
            </thead>
            <tbody>
              {propias.map((s) => (
                <tr key={s.relationshipRequestId} data-estado={s.state}>
                  <td data-etiqueta="Asesorado">{s.advisee.displayName}</td>
                  <td data-etiqueta="Alcance">
                    {s.scope.label} · {ETIQUETA_DE_FINALIDAD[s.purpose]}
                  </td>
                  <td data-etiqueta="Estado">{COPY_VINCULO.estadoDeSolicitud[s.state]}</td>
                  <td data-etiqueta="Enviada">{fecha(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
      {solicitudes.tipo === 'listo' && !solicitudes.completa ? (
        <p className="nota">
          Se leyeron las primeras {solicitudes.items.length}.{' '}
          <button type="button" className="boton boton--enlace" onClick={onVerMas} disabled={solicitudes.actualizando}>
            Ver más
          </button>
        </p>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
