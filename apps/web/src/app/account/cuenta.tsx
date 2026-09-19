'use client';

/**
 * Website `/account` (DL-025 A): Estado · Tu identificador BE · Privacidad · Seguridad · Cerrar mi cuenta.
 * - Estado: solo el estado operativo (TEST-RF-006: nunca «habilitado»).
 * - Tu identificador BE (DL-035): lo que el asesorado comparte con el profesional para recibir una solicitud. Por sí
 *   solo no da acceso a nada: el acceso exige vínculo aceptado y consentimiento (RF-021).
 * - Privacidad: resumen de A3 desde CON-05 (`currentConsent: null` = no otorgado). La gestión de A3 y de los
 *   consentimientos a profesionales vive en /account/privacy (WP-03; PROTO-10-ACC-03/04 cierran la mitad A3 de DL-024).
 * - Espacio profesional: el enlace aparece solo si la API informa la capacidad, y no autoriza nada (09v8 ACC-05).
 * - Seguridad: cerrar sesión / cerrar todas, separado de «Cerrar mi cuenta» (10-B02:436-458; 10-B10:297-339).
 * - Cierre (PROTO-10-ACC-06, 10-ADD): explicación → diálogo con consecuencias versionadas → confirmación explícita.
 * Carga con estructura real y sin datos ficticios; error con «Reintentar» (10-B10:343-378).
 */
import { CODIGOS_DE_SESION_NO_VALIDA, COPY_VINCULO, VERSION_VIGENTE, type MeResponse, type RequisitoDeConsentimientoDeSaludResponse } from '@be/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorConReintento } from '../../components/estados';
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
        {cuenta.tipo === 'listo' && cuenta.datos.actorCapabilities.includes('PROFESSIONAL_WORKSPACE') ? (
          <p>
            <Link className="boton boton--secundario" href="/pro">
              Ir al espacio profesional
            </Link>
          </p>
        ) : null}
      </section>

      {cuenta.tipo === 'listo' ? <TuIdentificador identityId={cuenta.datos.identityId} /> : null}

      <section className="seccion" aria-labelledby="titulo-privacidad">
        <h2 id="titulo-privacidad">Privacidad</h2>
        <h3>Tratamiento de datos de salud</h3>
        {a3.tipo === 'cargando' ? <p aria-busy="true">Cargando…</p> : null}
        {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} onReintentar={cargarA3} /> : null}
        {a3.tipo === 'listo' ? <EstadoA3 datos={a3.datos} /> : null}
        <p>
          <Link href="/account/privacy">Gestionar privacidad y consentimientos</Link>
        </p>
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

/**
 * «Tu identificador BE» (DL-035): se comparte con el profesional para que pueda enviar la solicitud. Copiar es una
 * comodidad; si el portapapeles no está disponible, el texto queda seleccionable.
 */
function TuIdentificador({ identityId }: { identityId: string }) {
  const [copiado, setCopiado] = useState<'no' | 'si' | 'error'>('no');
  async function copiar() {
    try {
      await navigator.clipboard.writeText(identityId);
      setCopiado('si');
    } catch {
      setCopiado('error');
    }
  }
  return (
    <section className="seccion" aria-labelledby="titulo-identificador">
      <h2 id="titulo-identificador">{COPY_VINCULO.tuIdentificador}</h2>
      <p>
        <code className="identificador">{identityId}</code>
      </p>
      <p className="nota">{COPY_VINCULO.ayudaTuIdentificador}</p>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={copiar}>
          Copiar identificador
        </button>
        <Link className="boton boton--secundario" href="/account/relationships">
          Ver vínculos
        </Link>
      </div>
      <p role="status" className="nota">
        {copiado === 'si' ? 'Identificador copiado.' : copiado === 'error' ? 'No pudimos copiarlo: seleccionalo y copialo a mano.' : ''}
      </p>
    </section>
  );
}


/**
 * Cierre síncrono (DL-016). El diálogo muestra el texto de consecuencias de la versión que se envía; «Confirmar cierre»
 * es la confirmación explícita. Cancelar ANTES de confirmar no crea solicitud ni cambia el estado (10-ADD:55-73).
 * Resultado incierto (sin respuesta o respuesta no reconocible): la Idempotency-Key se conserva, «Cancelar» deja de
 * ofrecerse y el aviso queda visible aunque se cierre el diálogo; «Reintentar» usa la MISMA key (10-B10:430-438), así
 * el servidor devuelve el resultado original aunque la sesión ya se haya revocado por el cierre.
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
    { tipo: 'inactivo' } | { tipo: 'abierto' } | { tipo: 'enviando' } | { tipo: 'incierto' } | { tipo: 'step-up' } | { tipo: 'error'; mensaje: string }
  >({ tipo: 'inactivo' });
  const consecuencias = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE;
  const parrafos = consecuencias.texto.split('\n\n').slice(1); // el primero es el título
  const incierto = estado.tipo === 'incierto';

  function abrir() {
    // Una key nueva solo si no hay un intento anterior sin confirmar.
    if (!incierto || !clave.current) clave.current = nuevaClaveDeIdempotencia();
    if (!incierto) setEstado({ tipo: 'abierto' });
    dialogo.current?.showModal(); // modal nativo: retiene el foco y lo devuelve al disparador al cerrar
  }

  /** Cierra el diálogo. Si el resultado es incierto, el estado (y la key) se conservan y el aviso queda en la sección. */
  function salirDelDialogo() {
    if (estado.tipo === 'enviando') return;
    dialogo.current?.close();
    if (!incierto) setEstado({ tipo: 'inactivo' });
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
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setEstado({ tipo: 'incierto' });
    // Respuesta definitiva: el próximo intento es otro intento lógico (key nueva al reabrir).
    if (r.codigo === 'STEP_UP_REQUIRED') return setEstado({ tipo: 'step-up' });
    if (alPerderSesion(r)) return;
    const consecuenciasViejas = r.codigo === 'VALIDATION_FAILED' && r.issues.some((i) => i.code === 'CONSEQUENCES_NOT_PRESENTED');
    setEstado({ tipo: 'error', mensaje: consecuenciasViejas ? COPY.consecuenciasDesactualizadasWeb : COPY.noDisponible });
  }

  return (
    <section className="seccion seccion--cierre" aria-labelledby="titulo-cierre">
      <h2 id="titulo-cierre">{COPY.cerrarMiCuenta}</h2>
      <p>Si cerrás tu cuenta, no vas a poder volver a iniciar sesión con ella. Antes de confirmar vas a ver las consecuencias.</p>
      {incierto ? (
        <Aviso tipo="error">
          <p>{COPY.cierreSinConfirmar}</p>
        </Aviso>
      ) : null}
      <button type="button" className="boton boton--peligro-secundario" onClick={abrir}>
        {incierto ? COPY.reintentar : COPY.cerrarMiCuenta}
      </button>

      <dialog
        ref={dialogo}
        className="dialogo"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-texto"
        onCancel={(e) => {
          e.preventDefault();
          salirDelDialogo();
        }}
      >
        <h2 id="dialogo-titulo">{COPY.cerrarMiCuenta}</h2>
        <div id="dialogo-texto">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="acto__version">
          Texto de consecuencias · versión <code>{consecuencias.id}</code>
        </p>
        {incierto ? (
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
          <button type="button" className="boton boton--secundario" onClick={salirDelDialogo} disabled={estado.tipo === 'enviando'} autoFocus>
            {incierto ? 'Volver a la cuenta' : COPY.cancelar}
          </button>
          {estado.tipo !== 'step-up' ? (
            <button
              type="button"
              className="boton boton--peligro"
              onClick={confirmar}
              disabled={estado.tipo === 'enviando'}
              aria-busy={estado.tipo === 'enviando'}
            >
              {estado.tipo === 'enviando' ? 'Cerrando cuenta…' : incierto ? COPY.reintentar : COPY.confirmarCierre}
            </button>
          ) : null}
        </div>
      </dialog>
    </section>
  );
}
