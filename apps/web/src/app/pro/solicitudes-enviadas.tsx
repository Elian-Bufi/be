'use client';

/**
 * «Solicitudes enviadas» (REL-02), como sección del Espacio (ED-41, WP-EDITORES-PROFESIONAL; antes, un diálogo que se
 * abría desde el pie del directorio). Muestra las que envió esta cuenta como profesional, con su estado y, si espera
 * respuesta, su vencimiento.
 * - **Filtros por estado y por persona** (`filtro-de-solicitudes.ts`): chips con su cuenta y una lista de personas. Se
 *   cruzan, y «Quitar los filtros» vuelve a verlas todas.
 * - Los botones que antes abrían el diálogo («Solicitudes enviadas» del directorio y la fila de «Esperan respuesta»)
 *   llevan a la sección y le dan el foco a su título; desde «Esperan respuesta», con «Pendientes» elegido.
 * - Si llega de un envío repetido, arriba dice por qué («Ya hay una solicitud pendiente igual…»), hasta cerrarlo.
 */
import { COPY_VINCULO, ETIQUETA_DE_FINALIDAD, type PaginaDeUnaLista, type SolicitudDeVinculo } from '@be/domain';
import { useId } from 'react';
import { BloqueDeEstado } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { Icono } from '../../components/icono';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { fecha, horaDelDia } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';
import { useNombres } from '../../lib/nombres-ocultos';
import { chipsDeEstado, cuantasSeVen, filtrarSolicitudes, filtroVigente, personasDeLasSolicitudes, SIN_FILTRO, type FiltroDeSolicitudes } from './filtro-de-solicitudes';
import { estadoDeLaSolicitud, venceElDiaYHora } from './vinculo-en-palabras';

export type EstadoDeLasSolicitudes = EstadoDeListaCompleta<PaginaDeUnaLista<SolicitudDeVinculo>>;

/** El ancla de la sección: los botones del Espacio llevan acá. */
export const ID_DE_SOLICITUDES_ENVIADAS = 'solicitudes-enviadas';

/** Las que envió esta cuenta como profesional: la lista trae también las que recibió como asesorada. */
export const solicitudesEnviadasPor = (solicitudes: readonly SolicitudDeVinculo[], profesionalId: string): SolicitudDeVinculo[] =>
  solicitudes.filter((s) => s.professional.identityId === profesionalId && s.initiatedBy === 'PROFESSIONAL');

export function SolicitudesEnviadas({
  aviso,
  solicitudes,
  profesionalId,
  filtro: filtroPedido,
  onFiltro,
  onCerrarAviso,
  onReintentar,
  onVerMas,
}: {
  /** Por qué se llegó a la sección, si fue por un envío repetido. */
  aviso: string | null;
  solicitudes: EstadoDeLasSolicitudes;
  profesionalId: string;
  filtro: FiltroDeSolicitudes;
  onFiltro: (f: FiltroDeSolicitudes) => void;
  onCerrarAviso: () => void;
  onReintentar: () => void;
  onVerMas: () => void;
}) {
  const id = useId();
  // TB-05: una solicitud no lleva monograma (D-2), pero con «Ocultar nombres» tampoco nombre.
  const { delAsesorado } = useNombres();

  const propias = solicitudes.tipo === 'listo' ? solicitudesEnviadasPor(solicitudes.items, profesionalId) : [];
  const filtro = filtroVigente(propias, filtroPedido);
  const vistas = filtrarSolicitudes(propias, filtro);
  const chips = chipsDeEstado(propias, filtro);
  const personas = personasDeLasSolicitudes(propias, (s) => delAsesorado(s.advisee));
  const sinResponder = propias.filter((s) => s.state === 'PENDIENTE').length;
  const seVen = cuantasSeVen(vistas.length, propias.length, filtro);

  return (
    <section id={ID_DE_SOLICITUDES_ENVIADAS} className="tarjeta-del-espacio solicitudes-enviadas" aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="solicitar" tamano={24} />
        <h2 id={`${id}-titulo`}>Solicitudes enviadas</h2>
        {/* «Pendiente» es la palabra de BE para una solicitud que el asesorado todavía no respondió (10-B04). */}
        {sinResponder > 0 ? <span className="nota">{sinResponder === 1 ? '1 pendiente de respuesta' : `${sinResponder} pendientes de respuesta`}</span> : null}
      </div>
      {aviso ? (
        <Aviso tipo="info">
          <p>{aviso}</p>
          <p>
            <button type="button" className="boton boton--enlace" onClick={onCerrarAviso}>
              Entendido
            </button>
          </p>
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
      {/* Una lectura nueva que falló no borra la que había: se dice, con su hora (bloque 5 del encargo de consolidación). */}
      {solicitudes.tipo === 'listo' && solicitudes.fallaAlActualizar ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[solicitudes.fallaAlActualizar]} titulo="No pudimos actualizar las solicitudes" onReintentar={onReintentar} deQue="las solicitudes">
          {razonDeFalla(solicitudes.fallaAlActualizar)} Se ven las consultadas a las {horaDelDia(solicitudes.consultado)}.
        </BloqueDeEstado>
      ) : null}
      {solicitudes.tipo === 'listo' && propias.length === 0 ? <p>{COPY_VINCULO.sinSolicitudes}</p> : null}
      {solicitudes.tipo === 'listo' && propias.length > 0 ? (
        <>
          <div className="solicitudes-enviadas__filtros">
            <div className="solicitudes-enviadas__estados" role="group" aria-label="Filtrar por estado">
              {chips.map((c) => (
                <button key={c.estado} type="button" className="chip" aria-pressed={filtro.estado === c.estado} onClick={() => onFiltro({ ...filtro, estado: c.estado })}>
                  {c.rotulo} · {c.cuantas}
                </button>
              ))}
            </div>
            {personas.length > 1 ? (
              <label className="campo solicitudes-enviadas__persona">
                Persona
                <select value={filtro.persona ?? ''} onChange={(e) => onFiltro({ ...filtro, persona: e.target.value || null })}>
                  <option value="">Todas las personas</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <p className="nota" role="status">
            {seVen ? (
              <>
                {seVen}{' '}
                <button type="button" className="boton boton--enlace" onClick={() => onFiltro(SIN_FILTRO)}>
                  Quitar los filtros
                </button>
              </>
            ) : null}
          </p>
          {vistas.length === 0 ? (
            <p>Ninguna solicitud con estos filtros.</p>
          ) : (
            <table className="tabla">
              <caption className="visualmente-oculto">Solicitudes de vínculo que enviaste</caption>
              <thead>
                <tr>
                  <th scope="col">Persona</th>
                  <th scope="col">Alcance</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Enviada</th>
                </tr>
              </thead>
              <tbody>
                {vistas.map((s) => (
                  <tr key={s.relationshipRequestId} data-estado={s.state}>
                    <td data-etiqueta="Persona">{delAsesorado(s.advisee)}</td>
                    <td data-etiqueta="Alcance">
                      {s.scope.label} · {ETIQUETA_DE_FINALIDAD[s.purpose]}
                    </td>
                    <td data-etiqueta="Estado">
                      {estadoDeLaSolicitud(s.state, s.state === 'PENDIENTE' ? delAsesorado(s.advisee) : null)}
                      {s.state === 'PENDIENTE' && s.expiresAt ? <span className="nota solicitudes-enviadas__vence">{venceElDiaYHora(s.expiresAt)}</span> : null}
                    </td>
                    <td data-etiqueta="Enviada">{fecha(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
      {solicitudes.tipo === 'listo' && !solicitudes.completa ? (
        <p className="nota">
          Se leyeron las primeras {solicitudes.items.length}; los filtros y las cuentas son de esas.{' '}
          <button type="button" className="boton boton--enlace" onClick={onVerMas} disabled={solicitudes.actualizando}>
            Ver más
          </button>
        </p>
      ) : null}
    </section>
  );
}
