'use client';

/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-T56) · restablecer el segundo factor de un profesional (API-ADM-19). Un profesional que
 * perdió el autenticador y los códigos de recuperación, o al que otro le configuró uno, escribe por el canal de ayuda;
 * Administración lo verifica fuera de BE y, acá, lo restablece con el fundamento. Su autenticador y sus códigos dejan de
 * valer y se cierran todas sus sesiones: al volver a entrar, lo configura de nuevo.
 * - **Pide confirmación** antes de enviar: cierra todas las sesiones de la cuenta, también las de la app.
 * - **Sin idempotencia:** repetirlo no cambia más de lo que ya cambió, así que un resultado incierto se puede reintentar.
 */
import { COPY, COPY_RESTABLECER_SEGUNDO_FACTOR, LARGO_MAXIMO_DEL_FUNDAMENTO, type SegundoFactorRestablecidoResponse, type ValidationIssue } from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { useAdministracion } from '../../../lib/sesion-administrativa';

const T = COPY_RESTABLECER_SEGUNDO_FACTOR;

const CAMPO_DEL_ISSUE = (i: ValidationIssue): string => (i.path === 'rationale' ? 'rsf-fundamento' : 'rsf-correo');

export function RestablecerSegundoFactor() {
  const { sesion, revisar } = useAdministracion();
  const [correo, setCorreo] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState<SegundoFactorRestablecidoResponse['data'] | null>(null);
  const [intento, setIntento] = useState(0);

  function mostrar(porCampo: Record<string, string>) {
    setErrores(porCampo);
    setIntento((n) => n + 1);
  }

  /** El primer paso: revisar los campos y pedir la confirmación. */
  function revisarYConfirmar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setFalla(null);
    setHecho(null);
    const encontrados: Record<string, string> = {};
    if (!correo.trim()) encontrados['rsf-correo'] = T.problemas.INVALID_LOCAL_IDENTIFIER!;
    if (!fundamento.trim()) encontrados['rsf-fundamento'] = T.problemas.RATIONALE_REQUIRED!;
    if (Object.keys(encontrados).length > 0) return mostrar(encontrados);
    setErrores({});
    setConfirmando(true);
  }

  async function restablecer() {
    if (enviando || !sesion) return;
    setEnviando(true);
    const r = await apiAdministrativa.restablecerSegundoFactor(sesion.token, { email: correo, rationale: fundamento });
    setEnviando(false);
    setConfirmando(false);
    if (r.ok) {
      setHecho(r.datos.data);
      setFundamento('');
      return;
    }
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setFalla(COPY.resultadoIncierto);
    if (revisar(r)) return;
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.length > 0) {
      const porCampo: Record<string, string> = {};
      for (const i of r.issues) porCampo[CAMPO_DEL_ISSUE(i)] ??= T.problemas[i.code] ?? COPY.noDisponible;
      return mostrar(porCampo);
    }
    if (r.codigo === 'RESOURCE_NOT_FOUND') return mostrar({ 'rsf-correo': T.sinCuenta });
    setFalla(COPY.noDisponible);
  }

  const lista = Object.entries(errores).map(([id, texto]) => ({ id, texto }));
  return (
    <section className="panel" aria-labelledby="rsf-titulo">
      <h2 id="rsf-titulo">{T.titulo}</h2>
      <p className="bajada">{T.queEs}</p>
      <p className="nota">{T.siHayDudas}</p>
      {hecho ? (
        <Aviso tipo="exito" enfocar>
          <p>{T.hecho(hecho.authenticatorRevoked, hecho.sessionsRevoked)}</p>
        </Aviso>
      ) : null}
      <form className="formulario" onSubmit={revisarYConfirmar} noValidate>
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <Campo
          id="rsf-correo"
          etiqueta={T.correo}
          type="email"
          autoComplete="off"
          value={correo}
          onChange={(ev) => {
            setConfirmando(false);
            setCorreo(ev.target.value);
          }}
          error={errores['rsf-correo']}
          required
        />
        <div className={`campo${errores['rsf-fundamento'] ? ' campo--error' : ''}`}>
          <label htmlFor="rsf-fundamento">{T.fundamento}</label>
          <p id="rsf-fundamento-ayuda" className="campo__ayuda">
            {T.fundamentoAyuda}
          </p>
          <textarea
            id="rsf-fundamento"
            rows={3}
            maxLength={LARGO_MAXIMO_DEL_FUNDAMENTO}
            value={fundamento}
            aria-invalid={errores['rsf-fundamento'] ? true : undefined}
            aria-describedby={errores['rsf-fundamento'] ? 'rsf-fundamento-ayuda rsf-fundamento-error' : 'rsf-fundamento-ayuda'}
            onChange={(ev) => {
              setConfirmando(false);
              setFundamento(ev.target.value);
            }}
          />
          {errores['rsf-fundamento'] ? (
            <p id="rsf-fundamento-error" className="campo__error">
              {errores['rsf-fundamento']}
            </p>
          ) : null}
        </div>
        {confirmando ? (
          <Aviso tipo="info" enfocar>
            <p>{T.confirmar}</p>
            <div className="acciones">
              <button type="button" className="boton boton--peligro" onClick={() => void restablecer()} disabled={enviando} aria-busy={enviando}>
                {enviando ? T.restableciendo : T.siRestablecer}
              </button>
              <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)} disabled={enviando}>
                {T.cancelar}
              </button>
            </div>
          </Aviso>
        ) : (
          <button type="submit" className="boton boton--secundario">
            {T.restablecer}
          </button>
        )}
      </form>
    </section>
  );
}
