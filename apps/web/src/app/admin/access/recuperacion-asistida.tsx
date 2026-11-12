'use client';

/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9) · la recuperación asistida (API-ADM-18). Una persona que no puede recuperar su
 * contraseña por correo (BE todavía no tiene proveedor, o ya no usa ese correo) escribe por el canal de ayuda;
 * Administración la verifica fuera de BE y, acá, emite un código de un solo uso con el fundamento. Al emitirlo se cierran
 * todas las sesiones de la cuenta y se anulan los códigos anteriores.
 * - **El código se muestra una sola vez:** la base guarda su huella. Si se pierde, se emite otro (anula el anterior).
 * - **Sin idempotencia:** cada envío emite un código nuevo, así ninguno queda guardado. El botón se deshabilita mientras
 *   espera, y un resultado incierto lo dice: reintentar emite otro, que anula al que quizá se emitió.
 */
import { COPY, COPY_RECUPERACION, LARGO_MAXIMO_DEL_FUNDAMENTO, type RecuperacionAsistidaResponse, type ValidationIssue } from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { fecha } from '../../../lib/formato';
import { useAdministracion } from '../../../lib/sesion-administrativa';

const A = COPY_RECUPERACION.asistida;

const CAMPO_DEL_ISSUE = (i: ValidationIssue): string => (i.path === 'rationale' ? 'asis-fundamento' : 'asis-correo');

export function RecuperacionAsistida() {
  const { sesion, revisar } = useAdministracion();
  const [correo, setCorreo] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [emitido, setEmitido] = useState<RecuperacionAsistidaResponse['data'] | null>(null);
  const [intento, setIntento] = useState(0);

  function mostrar(porCampo: Record<string, string>) {
    setErrores(porCampo);
    setIntento((n) => n + 1);
  }

  async function emitir(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    setEmitido(null);
    const encontrados: Record<string, string> = {};
    if (!correo.trim()) encontrados['asis-correo'] = A.problemas.INVALID_LOCAL_IDENTIFIER;
    if (!fundamento.trim()) encontrados['asis-fundamento'] = A.problemas.RATIONALE_REQUIRED;
    if (Object.keys(encontrados).length > 0) return mostrar(encontrados);
    setErrores({});
    setEnviando(true);
    const r = await apiAdministrativa.emitirRecuperacionAsistida(sesion.token, { email: correo, rationale: fundamento });
    setEnviando(false);
    if (r.ok) {
      setEmitido(r.datos.data);
      setFundamento('');
      return;
    }
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setFalla(COPY.resultadoIncierto);
    if (revisar(r)) return;
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.length > 0) {
      const porCampo: Record<string, string> = {};
      for (const i of r.issues) porCampo[CAMPO_DEL_ISSUE(i)] ??= (A.problemas as Readonly<Record<string, string>>)[i.code] ?? COPY.noDisponible;
      return mostrar(porCampo);
    }
    if (r.codigo === 'RESOURCE_NOT_FOUND') return mostrar({ 'asis-correo': A.sinCuenta });
    setFalla(COPY.noDisponible);
  }

  const lista = Object.entries(errores).map(([id, texto]) => ({ id, texto }));
  return (
    <section className="panel" aria-labelledby="asis-titulo">
      <h2 id="asis-titulo">{A.titulo}</h2>
      <p className="bajada">{A.queEs}</p>
      {emitido ? (
        <Aviso tipo="exito" enfocar>
          <p>{A.emitido(emitido.sessionsRevoked)}</p>
          <p className="codigo-emitido">
            <code>{emitido.code}</code>
          </p>
          <p>{A.vence(fecha(emitido.expiresAt))}</p>
          <p>{A.comoSigue}</p>
        </Aviso>
      ) : null}
      <form className="formulario" onSubmit={emitir} noValidate>
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <Campo id="asis-correo" etiqueta={A.correo} type="email" autoComplete="off" value={correo} onChange={(ev) => setCorreo(ev.target.value)} error={errores['asis-correo']} required />
        <div className={`campo${errores['asis-fundamento'] ? ' campo--error' : ''}`}>
          <label htmlFor="asis-fundamento">{A.fundamento}</label>
          <p id="asis-fundamento-ayuda" className="campo__ayuda">
            {A.fundamentoAyuda}
          </p>
          <textarea
            id="asis-fundamento"
            rows={3}
            maxLength={LARGO_MAXIMO_DEL_FUNDAMENTO}
            value={fundamento}
            aria-invalid={errores['asis-fundamento'] ? true : undefined}
            aria-describedby={errores['asis-fundamento'] ? 'asis-fundamento-ayuda asis-fundamento-error' : 'asis-fundamento-ayuda'}
            onChange={(ev) => setFundamento(ev.target.value)}
          />
          {errores['asis-fundamento'] ? (
            <p id="asis-fundamento-error" className="campo__error">
              {errores['asis-fundamento']}
            </p>
          ) : null}
        </div>
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? A.emitiendo : A.emitir}
        </button>
      </form>
    </section>
  );
}
