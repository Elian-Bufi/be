'use client';

/**
 * «Esperan respuesta» (WP-TABLERO-ALTA-GAMA TB-11; DL-163 D-4): lo que el profesional ya hizo y espera a la persona.
 * - **Los formularios sin responder,** de la cartera (API-CAR-01), con el monograma: la persona tiene un vínculo y su
 *   nombre se ve. «Ver la solicitud» lleva a la solicitud, como en la lista de DL-107.
 * - **Las solicitudes de vínculo sin responder** (REL-02) y **las invitaciones sin usar** (API-INV-02, la lectura nueva
 *   de TB-06): sin monograma (D-2: ni las solicitudes ni las invitaciones a quien no tiene un vínculo vigente lo llevan).
 *   Abren sus listas, con lo que ya se puede hacer ahí (anular, copiar el enlace).
 * Va por antigüedad, lo que espera hace más primero (`mesa.ts`), sin colores ni marcas por persona. Cada lista que no se
 * pudo leer lo dice en su lugar: una falla no es «nada espera».
 */
import { COPY_CARTERA, fechaCivil, numero, type Invitacion, type SolicitudDeVinculo } from '@be/domain';
import { Enlace } from '../../components/enlace';
import { useId } from 'react';
import { Icono } from '../../components/icono';
import { Retrato } from '../../components/retrato';
import { diaDelAnioEnCurso } from '../../lib/formato';
import { useNombres } from '../../lib/nombres-ocultos';
import { COPY_MESA, loQueEspera } from './mesa';
import { rutaQueResuelve, textoDePendiente } from './pendiente-en-una-fila';
import type { EstadoDeLaCartera } from './te-toca-a-vos';

/** Una lista leída entera, o por qué no. */
export type ListaQueEspera<T> = { readonly tipo: 'cargando' } | { readonly tipo: 'error' } | { readonly tipo: 'listo'; readonly items: readonly T[]; readonly completa: boolean };

export function EsperanRespuesta({
  cartera,
  solicitudes,
  invitaciones,
  hoy,
  zona,
  onVerSolicitudes,
  onVerInvitaciones,
}: {
  cartera: EstadoDeLaCartera;
  /** Las solicitudes enviadas por esta cuenta como profesional. */
  solicitudes: ListaQueEspera<SolicitudDeVinculo>;
  invitaciones: ListaQueEspera<Invitacion>;
  /** La fecha civil de la cartera, para escribir los días como en «Te toca a vos». */
  hoy: string;
  zona: string;
  onVerSolicitudes: () => void;
  onVerInvitaciones: () => void;
}) {
  const id = useId();
  const nombres = useNombres();
  const formularios = cartera.tipo === 'listo' ? cartera.items : [];
  const items = loQueEspera(formularios, solicitudes.tipo === 'listo' ? solicitudes.items : [], invitaciones.tipo === 'listo' ? invitaciones.items : [], zona);
  const dia = (f: string) => (hoy ? diaDelAnioEnCurso(f, hoy) : f);
  const fallas = ([cartera.tipo === 'error' ? COPY_MESA.formularios : null, solicitudes.tipo === 'error' ? COPY_MESA.solicitudes : null, invitaciones.tipo === 'error' ? COPY_MESA.invitaciones : null] as (string | null)[]).filter(
    (f): f is string => f !== null,
  );
  const cargando = cartera.tipo === 'cargando' || solicitudes.tipo === 'cargando' || invitaciones.tipo === 'cargando';

  return (
    <section id="esperan-respuesta" className="tarjeta-del-espacio esperan" aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="espera" tamano={24} />
        <h2 id={`${id}-titulo`}>{COPY_MESA.esperan}</h2>
      </div>
      {fallas.length > 0 ? (
        <p className="nota esperan__falla" role="status">
          No pudimos leer: {fallas.join(', ').toLowerCase()}. «Actualizar», en «{COPY_MESA.teToca}», vuelve a intentarlo.
        </p>
      ) : null}
      {items.length === 0 ? (
        cargando ? (
          <p className="cargando" role="status">
            Cargando lo que espera respuesta…
          </p>
        ) : fallas.length === 0 ? (
          <p className="pendientes__vacio">
            <Icono nombre="espera" tamano={20} />
            {COPY_MESA.vacioEsperan}
          </p>
        ) : null
      ) : (
        <ul className="esperan__lista">
          {items.map((e) => {
            if (e.tipo === 'formulario') {
              const p = e.pendiente;
              const quien = nombres.delAsesorado(p.advisee);
              const texto = textoDePendiente(p, dia);
              return (
                <li key={e.clave} className="esperan__renglon" data-tipo="formulario">
                  <span className="con-retrato">
                    <Retrato nombre={quien} />
                    <span className="esperan__quien">{quien}</span>
                  </span>
                  <span className="esperan__que">
                    {texto} · {COPY_CARTERA.dominio[p.domain]}
                  </span>
                  <Enlace className="pendiente__enlace" href={rutaQueResuelve(p)} aria-label={`${COPY_CARTERA.accion[p.kind]}: ${quien}, ${texto}`}>
                    {COPY_CARTERA.accion[p.kind]}
                    <Icono nombre="derecha" tamano={18} />
                  </Enlace>
                </li>
              );
            }
            if (e.tipo === 'solicitud') {
              const s = e.solicitud;
              const quien = nombres.delAsesorado(s.advisee);
              const texto = COPY_MESA.solicitud(s.scope.label, dia(e.desde));
              return (
                <li key={e.clave} className="esperan__renglon" data-tipo="solicitud">
                  <span className="esperan__quien">{quien}</span>
                  <span className="esperan__que">{texto}</span>
                  <button type="button" className="boton boton--enlace pendiente__enlace" aria-label={`${COPY_MESA.verLasSolicitudes}: ${quien}, ${texto}`} onClick={onVerSolicitudes}>
                    {COPY_MESA.verLasSolicitudes}
                  </button>
                </li>
              );
            }
            const i = e.invitacion;
            const texto = COPY_MESA.invitacion(i.scope.label, dia(fechaCivil(i.expiresAt, zona)));
            return (
              <li key={e.clave} className="esperan__renglon" data-tipo="invitacion">
                <span className="esperan__quien nota">{COPY_MESA.sinPersonaTodavia}</span>
                <span className="esperan__que">{texto}</span>
                <button type="button" className="boton boton--enlace pendiente__enlace" aria-haspopup="dialog" aria-label={`${COPY_MESA.verLasInvitaciones}: ${texto}`} onClick={onVerInvitaciones}>
                  {COPY_MESA.verLasInvitaciones}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 0 ? <p className="visualmente-oculto">{numero(items.length)} en total.</p> : null}
    </section>
  );
}

