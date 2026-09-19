'use client';

/**
 * Website `/account` (DL-025 A): Estado · Privacidad · Seguridad · Cerrar mi cuenta.
 * - Estado: solo el estado operativo (TEST-RF-006: nunca «habilitado»).
 * - Privacidad: A3 desde CON-05; `currentConsent: null` = no otorgado. Sin CTA de otorgamiento (DL-024).
 * - Seguridad: cerrar sesión / cerrar todas, separado de «Cerrar mi cuenta» (10-B02:436-458; 10-B10:297-339).
 * - Cierre (PROTO-10-ACC-06, 10-ADD): explicación → diálogo con consecuencias versionadas → confirmación explícita.
 * Carga con estructura real y sin datos ficticios; error con «Reintentar» (10-B10:343-378).
 */
import { CODIGOS_DE_SESION_NO_VALIDA, VERSION_VIGENTE, type MeResponse, type RequisitoDeConsentimientoDeSaludResponse } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Aviso } from '../../components/formulario';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../lib/api';
import { COPY } from '../../lib/copy';
import { useSesion } from '../../lib/sesion';

const ESTADO_OPERATIVO: Record<MeResponse['data']['accountOperationalState'], string> = {
  OPERATIVA: 'Operativa',
  SUSPENDIDA: 'Suspendida',
  CERRADA: 'Cerrada',
};

type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error' };

const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export function Cuenta() {
  const router = useRouter();
  const { sesion, olvidar } = useSesion();
  const saliendo = useRef(false);
  const [cuenta, setCuenta] = useState<Carga<MeResponse['data']>>({ tipo: 'cargando' });
  const [a3, setA3] = useState<Carga<RequisitoDeConsentimientoDeSaludResponse['data']>>({ tipo: 'cargando' });
  const [accion, setAccion] = useState<{ tipo: 'libre' } | { tipo: 'ocupado'; que: 'una' | 'todas' } | { tipo: 'error'; mensaje: string }>({
    tipo: 'libre',
  });

  const salir = useCallback(
    (destino: string) => {
      saliendo.current = true;
      olvidar();
      router.replace(destino);
    },
    [olvidar, router],
  );

  /** Si la API dice que la sesión ya no sirve, se olvida y se vuelve al login (retorno seguro a /account). */
  const sesionPerdida = useCallback(
    (r: Resultado<unknown>) => {
      if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
        salir('/login?volver=/account&aviso=sesion-no-valida');
        return true;
      }
      return false;
    },
    [salir],
  );

  const token = sesion?.token ?? null;

  const cargarCuenta = useCallback(async () => {
    if (!token) return;
    setCuenta({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    setCuenta(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error' });
  }, [token, sesionPerdida]);

  const cargarA3 = useCallback(async () => {
    if (!token) return;
    setA3({ tipo: 'cargando' });
    const r = await api.consultarRequisitoA3(token);
    if (sesionPerdida(r)) return;
    setA3(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    if (!token) {
      if (!saliendo.current) router.replace('/login?volver=/account');
      return;
    }
    void cargarCuenta();
    void cargarA3();
  }, [token, cargarCuenta, cargarA3, router]);

  async function cerrarSesion(que: 'una' | 'todas') {
    if (!token || accion.tipo === 'ocupado') return;
    setAccion({ tipo: 'ocupado', que });
    const r = que === 'una' ? await api.finalizarSesion(token) : await api.cerrarTodasLasSesiones(token);
    if (r.ok) return salir(`/login?aviso=${que === 'una' ? 'sesion-cerrada' : 'sesiones-cerradas'}`);
    if (sesionPerdida(r)) return;
    setAccion({ tipo: 'error', mensaje: r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible });
  }

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;

  return (
    <div className="secciones">
      <section className="seccion" aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado de la cuenta</h2>
        {cuenta.tipo === 'cargando' ? <p aria-busy="true">Cargando…</p> : null}
        {cuenta.tipo === 'error' ? <ErrorConReintento onReintentar={cargarCuenta} /> : null}
        {cuenta.tipo === 'listo' ? (
          <dl className="datos">
            <div>
              <dt>Estado operativo</dt>
              <dd>{ESTADO_OPERATIVO[cuenta.datos.accountOperationalState]}</dd>
            </div>
            <div>
              <dt>Esta sesión vence</dt>
              <dd>{fecha(cuenta.datos.session.expiresAt)}</dd>
            </div>
          </dl>
        ) : null}
        <p className="nota">El estado operativo indica si podés usar tu cuenta. No es una habilitación profesional ni una autorización sobre datos.</p>
      </section>

      <section className="seccion" aria-labelledby="titulo-privacidad">
        <h2 id="titulo-privacidad">Privacidad</h2>
        <h3>Tratamiento de datos de salud</h3>
        {a3.tipo === 'cargando' ? <p aria-busy="true">Cargando…</p> : null}
        {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} onReintentar={cargarA3} /> : null}
        {a3.tipo === 'listo' ? <EstadoA3 datos={a3.datos} /> : null}
      </section>

      <section className="seccion" aria-labelledby="titulo-seguridad">
        <h2 id="titulo-seguridad">Seguridad</h2>
        <p>Cerrar sesión no cierra tu cuenta.</p>
        {accion.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{accion.mensaje}</p>
          </Aviso>
        ) : null}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => cerrarSesion('una')} disabled={accion.tipo === 'ocupado'}>
            {accion.tipo === 'ocupado' && accion.que === 'una' ? 'Cerrando sesión…' : COPY.cerrarSesion}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => cerrarSesion('todas')} disabled={accion.tipo === 'ocupado'}>
            {accion.tipo === 'ocupado' && accion.que === 'todas' ? 'Cerrando sesiones…' : COPY.cerrarTodas}
          </button>
        </div>
      </section>

      <CierreDeCuenta token={token} alTerminar={() => salir('/?aviso=cierre-registrado')} alPerderSesion={sesionPerdida} alReautenticar={() => salir('/login?volver=/account&aviso=reautenticar')} />
    </div>
  );
}

function EstadoA3({ datos }: { datos: RequisitoDeConsentimientoDeSaludResponse['data'] }) {
  const otorgado = datos.currentConsent?.state === 'ACTIVE';
  return (
    <>
      <p className="estado-a3">
        <span className={`insignia ${otorgado ? 'insignia--si' : 'insignia--no'}`}>{otorgado ? 'Otorgado' : 'No otorgado'}</span>
      </p>
      {!otorgado ? <p>{COPY.cuentaSinA3}</p> : null}
      <details>
        <summary>Ver el texto del tratamiento de datos de salud (versión {datos.consentVersion.id})</summary>
        <div className="texto-legal">
          {datos.consentVersion.text.split('\n\n').map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      </details>
    </>
  );
}

function ErrorConReintento({ mensaje = COPY.errorDeVista, onReintentar }: { mensaje?: string; onReintentar: () => void }) {
  return (
    <Aviso tipo="error">
      <p>
        {mensaje}{' '}
        <button type="button" className="boton boton--enlace" onClick={onReintentar}>
          {COPY.reintentar}
        </button>
      </p>
    </Aviso>
  );
}

/**
 * Cierre síncrono (DL-016). El diálogo muestra el texto de consecuencias de la versión que se envía; «Confirmar cierre»
 * es la confirmación explícita. Cancelar no crea solicitud ni cambia el estado (10-ADD:55-73). Los reintentos por
 * incertidumbre de red usan la misma Idempotency-Key.
 */
function CierreDeCuenta({
  token,
  alTerminar,
  alPerderSesion,
  alReautenticar,
}: {
  token: string;
  alTerminar: () => void;
  alPerderSesion: (r: Resultado<unknown>) => boolean;
  alReautenticar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const clave = useRef<string | null>(null);
  const [estado, setEstado] = useState<
    { tipo: 'cerrado' } | { tipo: 'abierto' } | { tipo: 'enviando' } | { tipo: 'incierto' } | { tipo: 'step-up' } | { tipo: 'error'; mensaje: string }
  >({ tipo: 'cerrado' });
  const consecuencias = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE;
  const parrafos = consecuencias.texto.split('\n\n').slice(1); // el primero es el título

  function abrir() {
    clave.current = nuevaClaveDeIdempotencia();
    setEstado({ tipo: 'abierto' });
    dialogo.current?.showModal(); // modal nativo: retiene el foco y lo devuelve al disparador al cerrar
  }

  function cancelar() {
    if (estado.tipo === 'enviando') return;
    dialogo.current?.close();
    setEstado({ tipo: 'cerrado' });
  }

  async function confirmar() {
    if (estado.tipo === 'enviando' || !clave.current) return;
    setEstado({ tipo: 'enviando' });
    const r = await api.solicitarCierre(token, clave.current);
    if (r.ok) {
      dialogo.current?.close();
      alTerminar();
      return;
    }
    if (r.tipo === 'RED') return setEstado({ tipo: 'incierto' });
    if (r.codigo === 'STEP_UP_REQUIRED') return setEstado({ tipo: 'step-up' });
    if (alPerderSesion(r)) return;
    setEstado({ tipo: 'error', mensaje: r.codigo === 'VALIDATION_FAILED' ? COPY.versionDesactualizada : COPY.noDisponible });
  }

  return (
    <section className="seccion seccion--cierre" aria-labelledby="titulo-cierre">
      <h2 id="titulo-cierre">{COPY.cerrarMiCuenta}</h2>
      <p>Si cerrás tu cuenta, no vas a poder volver a iniciar sesión con ella. Antes de confirmar vas a ver las consecuencias.</p>
      <button type="button" className="boton boton--peligro-secundario" onClick={abrir}>
        {COPY.cerrarMiCuenta}
      </button>

      <dialog ref={dialogo} className="dialogo" aria-labelledby="dialogo-titulo" aria-describedby="dialogo-texto" onCancel={(e) => { e.preventDefault(); cancelar(); }}>
        <h2 id="dialogo-titulo">{COPY.cerrarMiCuenta}</h2>
        <div id="dialogo-texto">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="acto__version">
          Texto de consecuencias · versión <code>{consecuencias.id}</code>
        </p>
        {estado.tipo === 'incierto' ? (
          <Aviso tipo="error" enfocar>
            <p>{COPY.verificando}</p>
            <p>{COPY.resultadoIncierto}</p>
          </Aviso>
        ) : null}
        {estado.tipo === 'step-up' ? (
          <Aviso tipo="error" enfocar>
            <p>{COPY.stepUp}</p>
            <p>
              <button type="button" className="boton boton--primario" onClick={alReautenticar}>
                Iniciar sesión de nuevo
              </button>
            </p>
          </Aviso>
        ) : null}
        {estado.tipo === 'error' ? (
          <Aviso tipo="error" enfocar>
            <p>{estado.mensaje}</p>
          </Aviso>
        ) : null}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={cancelar} disabled={estado.tipo === 'enviando'} autoFocus>
            {COPY.cancelar}
          </button>
          {estado.tipo !== 'step-up' ? (
            <button type="button" className="boton boton--peligro" onClick={confirmar} disabled={estado.tipo === 'enviando'} aria-busy={estado.tipo === 'enviando'}>
              {estado.tipo === 'enviando' ? 'Cerrando cuenta…' : estado.tipo === 'incierto' ? COPY.reintentar : COPY.confirmarCierre}
            </button>
          ) : null}
        </div>
      </dialog>
    </section>
  );
}
