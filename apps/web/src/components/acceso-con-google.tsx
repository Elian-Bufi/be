'use client';

/**
 * «Continuar con Google» en Iniciar sesión y en Crear cuenta (WP-ACCESO-GOOGLE; DEUDA_LEGAJO DL-138, RF-003, UC-E05).
 * Sin el client ID en el build no se muestra nada y la pantalla queda como siempre.
 * - **Entrar** (API-GOO-01): Google entrega el ID token y la API abre la sesión, que se guarda como la del login.
 * - **Vincular** (API-GOO-02): si ya hay una cuenta BE con ese correo y contraseña, Google se le suma solo después de que
 *   la persona confirma esa contraseña. Nunca se vincula sola (UC-E05 E02).
 * - **Crear** (API-GOO-03): si no hay cuenta, el alta con las mismas tres casillas que el alta con correo. Registra un
 *   asesorado, como el alta con correo (DL-024).
 * Mientras dura un paso, el formulario de correo y contraseña queda detrás de «Volver»: Google es una opción más, y el
 * acceso local sigue siempre (UC-E05 E01). Qué hacer con cada respuesta lo decide `pasoDeAccesoConGoogle`, la misma regla
 * que usa la APK.
 */
import { COPY, COPY_ACCESO_GOOGLE as C, pasoDeAccesoConGoogle, type IniciarSesionResponse, type PasoDeAccesoConGoogle } from '@be/domain';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '../lib/api';
import { CLIENT_ID_WEB_DE_GOOGLE, dibujarBotonDeGoogle } from '../lib/google';
import { ActosDelAlta, erroresDeLosActos, idDelActo, NINGUN_ACTO_MARCADO, type ActoDelAlta, type ActosMarcados, type ErroresDeLosActos } from './actos-del-alta';
import { Aviso, Campo, ResumenDeErrores } from './formulario';

type Estado =
  | { readonly tipo: 'inicio'; readonly aviso: string | null }
  | { readonly tipo: 'verificando' }
  | { readonly tipo: 'vincular'; readonly idToken: string; readonly correo: string }
  | { readonly tipo: 'crear'; readonly idToken: string; readonly correo: string };

/** Lo que un paso le devuelve al conjunto: la sesión, otro paso o un aviso que vuelve al principio. */
type Seguir = (paso: PasoDeAccesoConGoogle, idToken: string) => void;

export function AccesoConGoogle({ alEntrar, children }: { alEntrar: (sesion: IniciarSesionResponse) => void; children: ReactNode }) {
  if (!CLIENT_ID_WEB_DE_GOOGLE) return <>{children}</>;
  return (
    <ConGoogle clientId={CLIENT_ID_WEB_DE_GOOGLE} alEntrar={alEntrar}>
      {children}
    </ConGoogle>
  );
}

function ConGoogle({ clientId, alEntrar, children }: { clientId: string; alEntrar: (sesion: IniciarSesionResponse) => void; children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio', aviso: null });

  const seguir: Seguir = (paso, idToken) => {
    switch (paso.tipo) {
      case 'SESION':
        return alEntrar(paso.sesion);
      case 'VINCULAR':
        return setEstado({ tipo: 'vincular', idToken, correo: paso.correo });
      case 'CREAR':
        return setEstado({ tipo: 'crear', idToken, correo: paso.correo });
      case 'AVISO':
      case 'CAMPO':
        // Un aviso al entrar, o uno que invalida lo que dio Google: de vuelta al principio, con el correo y la contraseña.
        return setEstado({ tipo: 'inicio', aviso: paso.mensaje });
    }
  };

  async function entrar(idToken: string) {
    setEstado({ tipo: 'verificando' });
    seguir(pasoDeAccesoConGoogle('ENTRAR', await api.iniciarSesionConGoogle(idToken), 'WEB'), idToken);
  }

  const volver = () => setEstado({ tipo: 'inicio', aviso: null });

  if (estado.tipo === 'vincular') return <PasoDeVincular key={estado.idToken} idToken={estado.idToken} correo={estado.correo} seguir={seguir} volver={volver} />;
  if (estado.tipo === 'crear') return <PasoDeCrear key={estado.idToken} idToken={estado.idToken} correo={estado.correo} seguir={seguir} volver={volver} />;

  return (
    <>
      <div className="acceso-con-google">
        {estado.tipo === 'inicio' && estado.aviso ? (
          <Aviso tipo="error" enfocar>
            <p>{estado.aviso}</p>
          </Aviso>
        ) : null}
        {estado.tipo === 'verificando' ? (
          <p className="acceso-con-google__boton" role="status">
            {C.verificando}
          </p>
        ) : (
          <BotonDeGoogle clientId={clientId} alRecibir={(idToken) => void entrar(idToken)} />
        )}
      </div>
      {children}
    </>
  );
}

/**
 * El botón de Google, con «o con tu correo» debajo. Si el script de Google no carga (sin red, un bloqueador), lo dice y
 * el formulario de siempre queda igual.
 */
function BotonDeGoogle({ clientId, alRecibir }: { clientId: string; alRecibir: (idToken: string) => void }) {
  const lugar = useRef<HTMLDivElement>(null);
  const [sinGoogle, setSinGoogle] = useState(false);
  // El último `alRecibir`: el botón se dibuja una vez, y cada render trae una función nueva.
  const receptor = useRef(alRecibir);
  receptor.current = alRecibir;

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
        if (vigente) setSinGoogle(true);
      },
    );
    return () => {
      vigente = false;
      retirar?.();
    };
  }, [clientId]);

  if (sinGoogle) return <p className="nota">{C.noDisponible}</p>;
  return (
    <>
      <div ref={lugar} className="acceso-con-google__boton" />
      <p className="acceso-con-google__separador">{C.separador}</p>
    </>
  );
}

/** Lleva el foco al título del paso al abrirlo: el lector de pantalla anuncia dónde está la persona. */
function useTituloEnfocado() {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, []);
  return titulo;
}

/** GOOGLE_LINK_REQUIRED: confirmar la contraseña de la cuenta BE de ese correo (API-GOO-02). */
function PasoDeVincular({ idToken, correo, seguir, volver }: { idToken: string; correo: string; seguir: Seguir; volver: () => void }) {
  const titulo = useTituloEnfocado();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    setAviso(null);
    if (!contrasena) {
      setError(C.contrasenaRequerida);
      setIntento((n) => n + 1);
      return;
    }
    setError(null);
    setEnviando(true);
    const paso = pasoDeAccesoConGoogle('VINCULAR', await api.vincularGoogle(idToken, contrasena), 'WEB');
    setEnviando(false);
    if (paso.tipo === 'CAMPO') {
      setError(paso.mensaje);
      setIntento((n) => n + 1);
      return;
    }
    if (paso.tipo === 'AVISO' && !paso.reiniciar) return setAviso(paso.mensaje);
    if (paso.tipo === 'SESION') setContrasena('');
    seguir(paso, idToken);
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2 ref={titulo} tabIndex={-1}>
        {C.vincularTitulo}
      </h2>
      <ResumenDeErrores titulo={COPY.resumenDeErrores(error ? 1 : 0)} errores={error ? [{ id: 'google-contrasena', texto: error }] : []} intento={intento} />
      {aviso ? (
        <Aviso tipo="error" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      <p>{C.vincularTexto(correo)}</p>
      <Campo
        id="google-contrasena"
        etiqueta={C.contrasena}
        type="password"
        autoComplete="current-password"
        required
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        error={error}
      />
      <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
        {enviando ? C.vinculando : C.vincular}
      </button>
      <button className="boton boton--secundario" type="button" onClick={volver} disabled={enviando}>
        {C.volver}
      </button>
    </form>
  );
}

/** GOOGLE_ACCOUNT_NOT_FOUND: crear la cuenta con Google, con A1, A2 y la declaración de mayoría de edad (API-GOO-03). */
function PasoDeCrear({ idToken, correo, seguir, volver }: { idToken: string; correo: string; seguir: Seguir; volver: () => void }) {
  const titulo = useTituloEnfocado();
  const [marcados, setMarcados] = useState<ActosMarcados>(NINGUN_ACTO_MARCADO);
  const [errores, setErrores] = useState<ErroresDeLosActos>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    setAviso(null);
    const encontrados = erroresDeLosActos(marcados);
    setErrores(encontrados);
    setIntento((n) => n + 1);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    const paso = pasoDeAccesoConGoogle('CREAR', await api.registrarConGoogle(idToken, marcados.mayoria), 'WEB');
    setEnviando(false);
    if (paso.tipo === 'CAMPO') {
      setErrores({ mayoria: paso.mensaje });
      setIntento((n) => n + 1);
      return;
    }
    if (paso.tipo === 'AVISO' && !paso.reiniciar) return setAviso(paso.mensaje);
    seguir(paso, idToken);
  }

  const lista = (Object.entries(errores) as [ActoDelAlta, string][]).map(([acto, texto]) => ({ id: idDelActo(acto, 'google-'), texto }));
  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2 ref={titulo} tabIndex={-1}>
        {C.crearTitulo}
      </h2>
      <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
      {aviso ? (
        <Aviso tipo="error" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      <p>{C.crearTexto(correo)}</p>
      <p className="nota">{C.avisoDePrueba}</p>
      <ActosDelAlta prefijo="google-" marcados={marcados} errores={errores} alCambiar={(acto, valor) => setMarcados((m) => ({ ...m, [acto]: valor }))} />
      <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
        {enviando ? C.creando : C.crear}
      </button>
      <button className="boton boton--secundario" type="button" onClick={volver} disabled={enviando}>
        {C.volver}
      </button>
    </form>
  );
}
