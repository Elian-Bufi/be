'use client';

/**
 * La seguridad del acceso administrativo (08 §25): cuántos códigos de recuperación quedan, generar unos nuevos (con la
 * contraseña otra vez, API-ADM-09) y reemplazar el autenticador (con la contraseña, API-ADM-07 y 08). Lo que hace el
 * operador si se pierden el autenticador y los códigos se dice acá, sin un atajo: restablecer el segundo factor es un
 * comando del operador, auditado, que obliga a configurarlo de nuevo.
 */
import { COPY, COPY_ADMINISTRACION, type EstadoDeSesionAdministrativaResponse } from '@be/domain';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { BloqueDeEstado, Cargando } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla, type MotivoDeFalla } from '../../../lib/fallas';
import { dia, horaDelDia } from '../../../lib/formato';
import { useAdministracion } from '../../../lib/sesion-administrativa';
import { ConfiguracionDelAutenticador } from '../acceso';

const S = COPY_ADMINISTRACION.seguridad;

type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'listo'; readonly datos: EstadoDeSesionAdministrativaResponse['data'] };

function GenerarCodigos({ alCancelar }: { alCancelar: () => void }) {
  const id = useId();
  const { sesion, mostrarCodigos, revisar } = useAdministracion();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    if (!contrasena) {
      setError(S.faltaContrasena);
      campo.current?.focus();
      return;
    }
    setError(null);
    setEnviando(true);
    const r = await apiAdministrativa.regenerarCodigos(sesion.token, contrasena);
    setEnviando(false);
    if (r.ok) {
      setContrasena('');
      mostrarCodigos(r.datos.data.recoveryCodes);
      alCancelar();
      return;
    }
    if (r.tipo === 'API' && r.codigo === 'INVALID_CREDENTIALS') {
      setError(S.contrasenaIncorrecta);
      campo.current?.focus();
      return;
    }
    if (revisar(r)) return;
    setFalla(r.tipo === 'RED' ? COPY.resultadoIncierto : r.codigo === 'RATE_LIMITED' ? COPY_ADMINISTRACION.segundoFactor.demasiadosIntentos : COPY.noDisponible);
  }

  return (
    <form className="panel" onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{COPY_ADMINISTRACION.codigos.regenerar}</h3>
      <p>{COPY_ADMINISTRACION.codigos.regenerarAyuda}</p>
      {falla ? (
        <Aviso tipo="error" enfocar>
          <p>{falla}</p>
        </Aviso>
      ) : null}
      <Campo
        ref={campo}
        id={`${id}-contrasena`}
        etiqueta={COPY_ADMINISTRACION.entrada.contrasena}
        type="password"
        autoComplete="current-password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        error={error}
        autoFocus
      />
      <div className="acciones">
        <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? COPY_ADMINISTRACION.segundoFactor.confirmando : COPY_ADMINISTRACION.codigos.regenerar}
        </button>
        <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
          {COPY_ADMINISTRACION.configuracion.cancelar}
        </button>
      </div>
    </form>
  );
}

export function SeguridadDelAcceso() {
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const [abierto, setAbierto] = useState<'codigos' | 'autenticador' | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    void apiAdministrativa.estadoDeLaSesion(token).then((r) => {
      if (!vigente) return;
      if (revisar(r)) return;
      setEstado(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', motivo: motivoDeFalla(r) });
    });
    return () => {
      vigente = false;
    };
    // Se vuelve a leer al cerrar un panel: los códigos que quedan cambian al generar unos nuevos.
  }, [token, vuelta, abierto, revisar]);

  return (
    <div className="seguridad-administrativa">
      <h1>{S.titulo}</h1>
      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.motivo]} titulo={`No pudimos cargar ${S.noLeida}`} onReintentar={() => setVuelta((n) => n + 1)} deQue={S.noLeida} rol="alert">
          {razonDeFalla(estado.motivo)}
        </BloqueDeEstado>
      ) : null}
      {estado.tipo === 'listo' ? (
        <>
          <p className="metadatos">
            {S.sesionVence(dia(estado.datos.session.expiresAt), horaDelDia(new Date(estado.datos.session.expiresAt)))} {S.vigencia}
          </p>
          <section className="seccion" aria-labelledby="seguridad-codigos">
            <h2 id="seguridad-codigos">{S.codigosVigentes}</h2>
            {estado.datos.recoveryCodesRemaining !== null ? (
              <p>
                {S.restantes(estado.datos.recoveryCodesRemaining)}
                {estado.datos.recoveryCodesRemaining <= 3 ? ` ${COPY_ADMINISTRACION.recuperacion.pocos}` : ''}
              </p>
            ) : null}
            {abierto === 'codigos' ? (
              <GenerarCodigos alCancelar={() => setAbierto(null)} />
            ) : (
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setAbierto('codigos')} disabled={abierto !== null}>
                  {COPY_ADMINISTRACION.codigos.regenerar}
                </button>
              </div>
            )}
          </section>
          <section className="seccion" aria-labelledby="seguridad-autenticador">
            <h2 id="seguridad-autenticador">{S.autenticador}</h2>
            <p>{S.autenticadorAyuda}</p>
            {abierto === 'autenticador' ? (
              <ConfiguracionDelAutenticador modo="reemplazo" alCancelar={() => setAbierto(null)} />
            ) : (
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setAbierto('autenticador')} disabled={abierto !== null}>
                  {COPY_ADMINISTRACION.configuracion.reemplazar}
                </button>
              </div>
            )}
          </section>
          <section className="seccion" aria-labelledby="seguridad-perdida">
            <h2 id="seguridad-perdida">Si perdés el acceso</h2>
            <p>{S.perdiste}</p>
          </section>
        </>
      ) : null}
    </div>
  );
}
