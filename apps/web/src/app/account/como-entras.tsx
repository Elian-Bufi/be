'use client';

/**
 * RF-004 (DEUDA_LEGAJO DL-172; 05 UC-E06) · «Cómo entrás» en la cuenta: los métodos de acceso de la misma identidad.
 * - **Ver** (API-MET-01): la contraseña, con el correo de acceso, y Google, con el correo de esa cuenta.
 * - **Vincular Google** (API-MET-02): el botón de Google entrega el ID token y la persona confirma su contraseña de BE.
 *   Si la cuenta de Google tiene otro correo, la pantalla lo dice con los dos correos y vincula solo si la persona lo
 *   confirma. El token vive en la memoria de la pantalla mientras dura el paso.
 * - **Desvincular Google** (API-MET-03): con una confirmación, y solo si queda la contraseña (la API lo decide; la pantalla
 *   muestra el botón cuando el método dice `removable`). Sin una entrada reciente, lleva a entrar otra vez y vuelve acá.
 * Sin el client ID de Google en el build, se ve con qué se entra y no se ofrece vincular.
 */
import { COPY, COPY_METODOS_DE_ACCESO as C, type MetodosDeAccesoResponse } from '@be/domain';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ErrorConReintento } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { api } from '../../lib/api';
import { dia } from '../../lib/formato';
import { CLIENT_ID_WEB_DE_GOOGLE, dibujarBotonDeGoogle } from '../../lib/google';
import { useSesionPerdida } from '../../lib/sesion-requerida';

type Metodos = MetodosDeAccesoResponse['data'];
type Paso =
  | { readonly tipo: 'lista' }
  | { readonly tipo: 'contrasena'; readonly idToken: string }
  | { readonly tipo: 'correo-distinto'; readonly idToken: string; readonly credencial: string; readonly correoDeGoogle: string }
  | { readonly tipo: 'desvincular'; readonly metodoId: string };

export function ComoEntras({ token, alReautenticar }: { token: string; alReautenticar: () => void }) {
  const id = useId();
  const { sesionPerdida } = useSesionPerdida(usePathname() ?? '/account');
  const [metodos, setMetodos] = useState<Metodos | 'falla' | null>(null);
  const [paso, setPaso] = useState<Paso>({ tipo: 'lista' });
  const [aviso, setAviso] = useState<{ readonly tipo: 'info' | 'error'; readonly texto: string } | null>(null);

  const leer = useCallback(async () => {
    setMetodos(null);
    const r = await api.metodosDeAcceso(token);
    if (!r.ok && sesionPerdida(r)) return;
    setMetodos(r.ok ? r.datos.data : 'falla');
  }, [token, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);

  /** Lo que dice cada rechazo de vincular o desvincular, sin códigos en pantalla. */
  const mensajeDe = (codigo: string): string => {
    switch (codigo) {
      case 'DE_OTRA_CUENTA':
        return C.deOtraCuenta;
      case 'GOOGLE_ACCOUNT_ALREADY_LINKED':
        return C.yaTieneOtra;
      case 'GOOGLE_ACCOUNT_REPLACEMENT_NOT_AVAILABLE':
        return C.otraAnterior;
      case 'LAST_ACCESS_METHOD':
        return C.ultimoMetodo;
      case 'MFA_REQUIRED':
        return C.segundoFactor;
      case 'DEPENDENCY_UNAVAILABLE':
        return C.sinGoogle;
      case 'GOOGLE_TOKEN_INVALID':
        return C.tokenInvalido;
      case 'GOOGLE_EMAIL_NOT_VERIFIED':
        return C.correoNoVerificado;
      case 'RATE_LIMITED':
        return COPY.demasiadosIntentos;
      default:
        return COPY.noDisponible;
    }
  };

  const correoDeAcceso = metodos && metodos !== 'falla' ? (metodos.methods.find((m) => m.type === 'PASSWORD')?.email ?? '') : '';

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{C.titulo}</h2>
      <p>{C.queEs}</p>
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}
      {metodos === null ? <p aria-busy="true">{C.cargando}</p> : null}
      {metodos === 'falla' ? <ErrorConReintento mensaje={C.sinLeer} onReintentar={() => void leer()} /> : null}
      {metodos && metodos !== 'falla' ? (
        <>
          <ul className="lista-simple">
            {metodos.methods.map((m) => (
              <li key={m.methodId}>
                <p>
                  <strong>{C.tipos[m.type]}</strong>
                  {m.email ? ` · ${m.email}` : ''}
                </p>
                <p className="nota">{C.vinculadoEl(dia(m.linkedAt))}</p>
                {m.removable && paso.tipo === 'lista' ? (
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton boton--secundario"
                      onClick={() => {
                        setAviso(null);
                        setPaso({ tipo: 'desvincular', metodoId: m.methodId });
                      }}
                    >
                      {C.desvincular}
                    </button>
                  </div>
                ) : null}
                {paso.tipo === 'desvincular' && paso.metodoId === m.methodId ? (
                  <Desvincular
                    token={token}
                    metodoId={m.methodId}
                    alTerminar={(r) => {
                      setPaso({ tipo: 'lista' });
                      if (r.tipo === 'listo') {
                        setMetodos(r.metodos);
                        setAviso({ tipo: 'info', texto: C.desvinculada });
                      } else if (r.tipo === 'error') setAviso({ tipo: 'error', texto: mensajeDe(r.codigo) });
                    }}
                    alReautenticar={alReautenticar}
                    sesionPerdida={sesionPerdida}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          {metodos.methods.length === 1 && metodos.methods[0]?.type === 'GOOGLE' ? <p className="nota">{C.soloConGoogle}</p> : null}
          {metodos.canLinkGoogle && CLIENT_ID_WEB_DE_GOOGLE ? (
            <>
              <h3>{C.vincularTitulo}</h3>
              {paso.tipo === 'lista' || paso.tipo === 'desvincular' ? (
                <>
                  <p>{C.vincularTexto}</p>
                  <BotonDeGoogle
                    clientId={CLIENT_ID_WEB_DE_GOOGLE}
                    alRecibir={(idToken) => {
                      setAviso(null);
                      setPaso({ tipo: 'contrasena', idToken });
                    }}
                    alFallar={() => setAviso({ tipo: 'error', texto: C.sinGoogle })}
                  />
                </>
              ) : null}
              {paso.tipo === 'contrasena' || paso.tipo === 'correo-distinto' ? (
                <Vincular
                  token={token}
                  paso={paso}
                  correoDeAcceso={correoDeAcceso}
                  alPedirConfirmacion={(credencial, correoDeGoogle) => setPaso({ tipo: 'correo-distinto', idToken: paso.idToken, credencial, correoDeGoogle })}
                  alTerminar={(r) => {
                    setPaso({ tipo: 'lista' });
                    if (r.tipo === 'listo') {
                      setMetodos(r.metodos);
                      setAviso({ tipo: 'info', texto: C.vinculada });
                    } else if (r.tipo === 'error') setAviso({ tipo: 'error', texto: mensajeDe(r.codigo) });
                  }}
                  sesionPerdida={sesionPerdida}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

type Final = { readonly tipo: 'listo'; readonly metodos: Metodos } | { readonly tipo: 'error'; readonly codigo: string } | { readonly tipo: 'cancelado' };

/** El botón de Google (el iframe de Google Identity Services), dibujado una vez. */
function BotonDeGoogle({ clientId, alRecibir, alFallar }: { clientId: string; alRecibir: (idToken: string) => void; alFallar: () => void }) {
  const lugar = useRef<HTMLDivElement>(null);
  const receptor = useRef(alRecibir);
  receptor.current = alRecibir;
  const falla = useRef(alFallar);
  falla.current = alFallar;
  useEffect(() => {
    const elemento = lugar.current;
    if (!elemento) return;
    let vigente = true;
    let retirar: (() => void) | null = null;
    dibujarBotonDeGoogle(clientId, elemento, (idToken) => receptor.current(idToken)).then(
      (alRetirar) => {
        if (vigente) retirar = alRetirar;
        else alRetirar();
      },
      () => {
        if (vigente) falla.current();
      },
    );
    return () => {
      vigente = false;
      retirar?.();
    };
  }, [clientId]);
  return <div ref={lugar} className="acceso-con-google__boton" />;
}

/** El paso de vincular: la contraseña de BE y, si la cuenta de Google tiene otro correo, la confirmación con los dos. */
function Vincular({
  token,
  paso,
  correoDeAcceso,
  alPedirConfirmacion,
  alTerminar,
  sesionPerdida,
}: {
  token: string;
  paso: Extract<Paso, { tipo: 'contrasena' | 'correo-distinto' }>;
  correoDeAcceso: string;
  alPedirConfirmacion: (credencial: string, correoDeGoogle: string) => void;
  alTerminar: (r: Final) => void;
  sesionPerdida: (r: Parameters<ReturnType<typeof useSesionPerdida>['sesionPerdida']>[0]) => boolean;
}) {
  const id = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const [credencial, setCredencial] = useState(paso.tipo === 'correo-distinto' ? paso.credencial : '');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => titulo.current?.focus(), [paso.tipo]);

  async function enviar(confirmar: boolean) {
    if (enviando) return;
    if (!credencial) return setError(C.contrasenaRequerida);
    setError(null);
    setEnviando(true);
    const r = await api.vincularMetodoDeAcceso(token, { type: 'GOOGLE', idToken: paso.idToken, credential: credencial, ...(confirmar ? { confirmDifferentEmail: true } : {}) });
    setEnviando(false);
    if (r.ok) return alTerminar({ tipo: 'listo', metodos: r.datos.data });
    if (r.tipo === 'RED') return setError(COPY.resultadoIncierto);
    if (sesionPerdida(r)) return;
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.some((i) => i.path === 'credential')) return setError(C.contrasenaIncorrecta);
    if (r.codigo === 'GOOGLE_EMAIL_MISMATCH' && r.correoDeGoogle) return alPedirConfirmacion(credencial, r.correoDeGoogle);
    alTerminar({ tipo: 'error', codigo: r.codigo === 'GOOGLE_ACCOUNT_ALREADY_LINKED' ? 'DE_OTRA_CUENTA' : r.codigo });
  }

  if (paso.tipo === 'correo-distinto') {
    return (
      <div className="formulario">
        <h4 ref={titulo} tabIndex={-1}>
          {C.correoDistintoTitulo}
        </h4>
        <p>{C.correoDistintoTexto(paso.correoDeGoogle, correoDeAcceso)}</p>
        {error ? (
          <Aviso tipo="error" enfocar>
            <p>{error}</p>
          </Aviso>
        ) : null}
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => void enviar(true)} disabled={enviando} aria-busy={enviando}>
            {enviando ? C.vinculando : C.vincularIgual}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => alTerminar({ tipo: 'cancelado' })} disabled={enviando}>
            {C.elegirOtra}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="formulario"
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void enviar(false);
      }}
    >
      <h4 ref={titulo} tabIndex={-1}>
        {C.vincularTitulo}
      </h4>
      <div className={`campo${error ? ' campo--error' : ''}`}>
        <label htmlFor={`${id}-contrasena`}>{C.contrasena}</label>
        <input
          id={`${id}-contrasena`}
          type="password"
          autoComplete="current-password"
          value={credencial}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(ev) => {
            setError(null);
            setCredencial(ev.target.value);
          }}
        />
        {error ? (
          <p id={`${id}-error`} className="campo__error">
            {error}
          </p>
        ) : null}
      </div>
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? C.vinculando : C.vincular}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => alTerminar({ tipo: 'cancelado' })} disabled={enviando}>
          {COPY.cancelar}
        </button>
      </div>
    </form>
  );
}

/** La confirmación de desvincular Google: dice que se sigue entrando con la contraseña y que la cuenta no cambia. */
function Desvincular({
  token,
  metodoId,
  alTerminar,
  alReautenticar,
  sesionPerdida,
}: {
  token: string;
  metodoId: string;
  alTerminar: (r: Final) => void;
  alReautenticar: () => void;
  sesionPerdida: (r: Parameters<ReturnType<typeof useSesionPerdida>['sesionPerdida']>[0]) => boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function desvincular() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    const r = await api.desvincularMetodoDeAcceso(token, metodoId);
    setEnviando(false);
    if (r.ok) return alTerminar({ tipo: 'listo', metodos: r.datos.data });
    if (r.tipo === 'RED') return setError(COPY.resultadoIncierto);
    if (sesionPerdida(r)) return;
    if (r.codigo === 'STEP_UP_REQUIRED') return alReautenticar();
    alTerminar({ tipo: 'error', codigo: r.codigo });
  }
  return (
    <div className="formulario" role="group" aria-label={C.desvincular}>
      <p>{C.desvincularConfirmar}</p>
      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--peligro" onClick={() => void desvincular()} disabled={enviando} aria-busy={enviando}>
          {enviando ? C.desvinculando : C.desvincularSi}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => alTerminar({ tipo: 'cancelado' })} disabled={enviando}>
          {COPY.cancelar}
        </button>
      </div>
    </div>
  );
}
