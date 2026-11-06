'use client';

/**
 * UC-ADM-01 · el historial administrativo de un profesional (API-ADM-12): los hechos de su verificación y de su
 * habilitación, del más nuevo al más viejo, con quién los hizo (un administrador, con su nombre de la administración, o el
 * servicio interno de BE), el fundamento interno y el texto comunicado. La historia anterior a este paquete queda como
 * estaba: esos hechos son del servicio interno y no tienen versión revisada.
 * Es la historia de las decisiones sobre el profesional, no un visor de auditoría: no muestra nada de salud.
 */
import { ALCANCES, COPY, COPY_ADMINISTRACION, ETIQUETA_DE_ALCANCE, type Alcance, type EntradaDelHistorialAdministrativo } from '@be/domain';
import { useEffect, useId, useRef, useState } from 'react';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../components/estados';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla, type MotivoDeFalla } from '../../../lib/fallas';
import { fecha } from '../../../lib/formato';
import { useAdministracion } from '../../../lib/sesion-administrativa';

const F = COPY_ADMINISTRACION.ficha;

type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'listo'; readonly entradas: readonly EntradaDelHistorialAdministrativo[]; readonly siguiente: string | null; readonly mas: 'quieto' | 'cargando' | 'error' };

/** Un estado del 06, en palabras; `null` si no es uno conocido (no se muestra un código). */
function estadoEnPalabras(e: string | null): string | null {
  if (e === null) return null;
  const v = COPY_ADMINISTRACION.estadoDeVerificacion as Readonly<Record<string, string>>;
  const h = COPY_ADMINISTRACION.estadoDeHabilitacion as Readonly<Record<string, string>>;
  return e in v && e !== 'ninguno' ? v[e]! : e in h && e !== 'ninguno' ? h[e]! : null;
}

function Entrada({ e }: { e: EntradaDelHistorialAdministrativo }) {
  const antes = estadoEnPalabras(e.previousState);
  const despues = estadoEnPalabras(e.newState);
  const transicion = despues ? (antes === despues ? F.sinCambioDeEstado(despues) : F.transicion(antes, despues)) : null;
  const momento = e.occurredAt ?? e.recordedAt;
  return (
    <li className="hecho-administrativo">
      <p className="hecho-administrativo__cabecera">
        <time dateTime={momento}>{fecha(momento)}</time>
        <span aria-hidden="true"> · </span>
        <span>{e.scope ? ETIQUETA_DE_ALCANCE[e.scope] : F.perfil}</span>
        <span aria-hidden="true"> · </span>
        <strong>{COPY_ADMINISTRACION.hecho[e.kind] ?? e.kind}</strong>
      </p>
      {transicion ? <p>{transicion}</p> : null}
      <p className="nota">{e.actor.type === 'ADMINISTRATOR' ? COPY_ADMINISTRACION.deAdministracion(e.actor.displayName) : COPY_ADMINISTRACION.automatico}</p>
      {e.rationale ? (
        <p className="hecho-administrativo__texto">
          <span className="hecho-administrativo__rotulo">{COPY_ADMINISTRACION.fundamentoInterno}:</span> {e.rationale}
        </p>
      ) : null}
      {e.messageToProfessional ? (
        <p className="hecho-administrativo__texto">
          <span className="hecho-administrativo__rotulo">{COPY_ADMINISTRACION.textoAlProfesional}:</span> «{e.messageToProfessional}»
        </p>
      ) : null}
      {e.reviewedVersion !== null ? <p className="nota">{COPY_ADMINISTRACION.versionRevisada(e.reviewedVersion)}</p> : null}
    </li>
  );
}

export function HistorialAdministrativo({ profesionalId, refresco }: { profesionalId: string; refresco: number }) {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [alcance, setAlcance] = useState<Alcance | ''>('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const pedido = useRef(0);

  useEffect(() => {
    if (!token) return;
    const n = ++pedido.current;
    setEstado({ tipo: 'cargando' });
    void apiAdministrativa.historialDeProfesional(token, profesionalId, { limit: 20, ...(alcance ? { scope: alcance } : {}) }).then((r) => {
      if (n !== pedido.current) return;
      if (revisar(r)) return;
      if (!r.ok) return setEstado({ tipo: 'error', motivo: motivoDeFalla(r) });
      setEstado({ tipo: 'listo', entradas: r.datos.data, siguiente: r.datos.page.nextCursor, mas: 'quieto' });
    });
  }, [token, profesionalId, alcance, refresco, vuelta, revisar]);

  async function verMas() {
    if (!token || estado.tipo !== 'listo' || !estado.siguiente) return;
    const n = pedido.current;
    setEstado({ ...estado, mas: 'cargando' });
    const r = await apiAdministrativa.historialDeProfesional(token, profesionalId, { limit: 20, cursor: estado.siguiente, ...(alcance ? { scope: alcance } : {}) });
    if (n !== pedido.current) return;
    if (revisar(r)) return;
    setEstado((e) => (e.tipo !== 'listo' ? e : r.ok ? { tipo: 'listo', entradas: [...e.entradas, ...r.datos.data], siguiente: r.datos.page.nextCursor, mas: 'quieto' } : { ...e, mas: 'error' }));
  }

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <div className="encabezado-de-bloque">
        <h2 id={`${id}-titulo`}>{F.historial}</h2>
        <div className="campo campo--en-linea">
          <label htmlFor={`${id}-area`}>{F.historialDelArea}</label>
          <select id={`${id}-area`} value={alcance} onChange={(e) => setAlcance(e.target.value as Alcance | '')}>
            <option value="">{COPY_ADMINISTRACION.lista.todas}</option>
            {ALCANCES.map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_DE_ALCANCE[a]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="metadatos">{F.historialAyuda}</p>
      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.motivo]} titulo={`No pudimos cargar ${F.historialNoLeido}`} onReintentar={() => setVuelta((n) => n + 1)} deQue={F.historialNoLeido} rol="alert">
          {razonDeFalla(estado.motivo)}
        </BloqueDeEstado>
      ) : null}
      {estado.tipo === 'listo' ? (
        estado.entradas.length === 0 ? (
          <EstadoVacio titulo={alcance ? F.historialVacioDelArea : F.historialVacio} icono="sin-datos" />
        ) : (
          <>
            <ol className="historial-administrativo">
              {estado.entradas.map((e) => (
                <Entrada key={e.eventId} e={e} />
              ))}
            </ol>
            {estado.siguiente ? (
              <div className="acciones">
                {estado.mas === 'error' ? (
                  <p className="nota" role="alert">
                    {COPY.errorAlTraerMas}
                  </p>
                ) : null}
                <button type="button" className="boton boton--secundario" onClick={() => void verMas()} disabled={estado.mas === 'cargando'} aria-busy={estado.mas === 'cargando'}>
                  {estado.mas === 'cargando' ? 'Cargando…' : estado.mas === 'error' ? COPY.reintentar : F.masHistorial}
                </button>
              </div>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
