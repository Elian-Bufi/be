'use client';

/**
 * El segundo factor del profesional (WP-USO-FINAL UF-11; DL-169; UF-D12; TEST-UF-014): la compuerta de `/pro`, adentro de
 * «Antes de seguir». Con una sesión, antes de montar la página se pregunta el estado (API-MFA-01, `pasoDelSegundoFactor`):
 * - **Verificado, o sin perfil profesional:** va la página. Se pregunta una vez por sesión y por pestaña.
 * - **Falta el código:** el del autenticador (API-MFA-02) o, si se perdió, uno de recuperación (API-MFA-03).
 * - **Sin autenticador:** se configura (API-MFA-04 y 05): el QR o la clave a mano, un código para confirmar y los diez
 *   códigos de recuperación, que se muestran una sola vez.
 * - **Sin autenticador y con el plazo vencido:** cerrar la sesión y volver a entrar.
 * - **Sin respuesta:** «Reintentar», y se reintenta solo al volver la conexión. No se deja pasar.
 * El paso no se puede saltear, y «Cerrar sesión» siempre está. La garantía es del servidor: sin el segundo factor, la API
 * no responde nada de lo profesional. La clave, el QR y los códigos no se guardan en el navegador.
 * Accesible: cada paso lleva el foco a su título, los campos tienen su etiqueta y su error, y los avisos se anuncian.
 */
import {
  COPY,
  COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL,
  normalizarCodigoDelAutenticador,
  normalizarCodigoDeRecuperacion,
  type ConfiguracionDelAutenticadorResponse,
  type Resultado,
} from '@be/domain';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '../lib/api';
import { CERRANDO_SESION, useCerrarSesion } from '../lib/cerrar-sesion';
import { horaDelDia } from '../lib/formato';
import { alEnviarUnCodigo, claveEnGrupos, claveParaCopiar, pasoDelSegundoFactor, restoDelEnlaceOtpauth, type PasoDelSegundoFactor } from '../lib/segundo-factor-del-profesional';
import { EsperandoSesion, useSesion } from '../lib/sesion';
import { useSesionPerdida } from '../lib/sesion-requerida';
import { CodigoQr } from './codigo-qr';
import { Encabezado } from './encabezado';
import { Cargando, ErrorConReintento } from './estados';
import { Aviso, Campo } from './formulario';
import { NavegacionProfesional } from './navegacion';

const C = COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL;
const hora = (iso: string): string => horaDelDia(new Date(iso));

/** La sesión a la que API-MFA-01 ya le dijo que puede seguir: con ella, esta pestaña no vuelve a preguntar. */
let verificada: string | null = null;

type Lectura = { readonly para: string; readonly paso: PasoDelSegundoFactor };

export function SegundoFactorDelProfesional({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const { sesion, restaurando } = useSesion();
  const token = sesion?.token ?? null;
  const { sesionPerdida } = useSesionPerdida(ruta);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const [avisoAlVolver, setAvisoAlVolver] = useState<string | null>(null);
  const perdida = useRef(sesionPerdida);
  perdida.current = sesionPerdida;

  const alPerderLaSesion = useCallback((r: Resultado<unknown>): boolean => {
    setSaliendo(true);
    return perdida.current(r);
  }, []);
  /** Vuelve a preguntar el estado, con un aviso para el paso que se muestre después (si lo hay). */
  const preguntarDeNuevo = useCallback((aviso: string | null = null) => {
    setAvisoAlVolver(aviso);
    setVuelta((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!token || token === verificada) return;
    let vigente = true;
    setLectura(null);
    void api.segundoFactorDeLaSesion(token).then((r) => {
      if (!vigente) return;
      const paso = pasoDelSegundoFactor(r);
      if (paso.tipo === 'sesion') {
        alPerderLaSesion(r);
        return;
      }
      if (paso.tipo === 'seguir') verificada = token;
      setLectura({ para: token, paso });
    });
    return () => {
      vigente = false;
    };
  }, [token, vuelta, alPerderLaSesion]);

  // Revisión adversarial de la etapa 2: `verificada` no se enteraba si otra sesión reemplazaba el autenticador o renovaba
  // los códigos (el servidor deja esta sesión en REQUIRED, y /pro se veía vacío). Se vuelve a preguntar, sin tapar la
  // página, al cambiar de pantalla dentro de /pro y al volver a la pestaña; si ya no sigue, se muestra el paso.
  useEffect(() => {
    if (!token) return;
    let vigente = true;
    const revisar = () => {
      if (verificada !== token || document.visibilityState !== 'visible') return;
      void api.segundoFactorDeLaSesion(token).then((r) => {
        if (!vigente || verificada !== token) return;
        const nuevo = pasoDelSegundoFactor(r);
        if (nuevo.tipo === 'seguir' || nuevo.tipo === 'sin-respuesta') return;
        if (nuevo.tipo === 'sesion') {
          alPerderLaSesion(r);
          return;
        }
        verificada = null;
        setLectura({ para: token, paso: nuevo });
      });
    };
    revisar();
    document.addEventListener('visibilitychange', revisar);
    return () => {
      vigente = false;
      document.removeEventListener('visibilitychange', revisar);
    };
  }, [token, ruta, alPerderLaSesion]);

  const paso: PasoDelSegundoFactor | null = token === null ? null : token === verificada ? { tipo: 'seguir' } : lectura?.para === token ? lectura.paso : null;
  const sinRespuesta = paso?.tipo === 'sin-respuesta';
  useEffect(() => {
    if (!sinRespuesta) return;
    const alVolver = () => preguntarDeNuevo();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [sinRespuesta, preguntarDeNuevo]);

  if (saliendo) return <Marco><EsperandoSesion /></Marco>;
  if (token === null) return restaurando ? <Marco><EsperandoSesion /></Marco> : <>{children}</>;
  if (paso === null) return <Marco><Cargando /></Marco>;
  switch (paso.tipo) {
    case 'seguir':
      return <>{children}</>;
    case 'codigo':
      return (
        <MarcoDelPaso>
          <PasoDelCodigo key={`${token}-${vuelta}`} token={token} avisoInicial={avisoAlVolver} alTerminar={preguntarDeNuevo} alPerderLaSesion={alPerderLaSesion} />
        </MarcoDelPaso>
      );
    case 'configurar':
      return (
        <MarcoDelPaso>
          <PasoDeConfiguracion key={`${token}-${vuelta}`} token={token} plazo={paso.plazo} avisoInicial={avisoAlVolver} alTerminar={preguntarDeNuevo} alPerderLaSesion={alPerderLaSesion} />
        </MarcoDelPaso>
      );
    case 'volver-a-entrar':
      return (
        <MarcoDelPaso>
          <PasoDeVolverAEntrar />
        </MarcoDelPaso>
      );
    case 'sin-respuesta':
    case 'sesion':
      return (
        <Marco>
          <ErrorConReintento onReintentar={() => preguntarDeNuevo()} />
        </Marco>
      );
  }
}

/** Mientras se espera o si no hubo respuesta: el encabezado del espacio, para que nada salte. */
function Marco({ children }: { children: ReactNode }) {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido">
        {children}
      </main>
    </>
  );
}

/** El paso, solo: sin la navegación ni las novedades, que llevarían a otra pantalla. El menú de la cuenta queda. */
function MarcoDelPaso({ children }: { children: ReactNode }) {
  return (
    <>
      <Encabezado campana={false} />
      <main id="contenido" className="contenido acceso">
        {children}
      </main>
    </>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, [children]);
  return (
    <h1 ref={titulo} tabIndex={-1}>
      {children}
    </h1>
  );
}

function CerrarSesion() {
  const salida = useCerrarSesion();
  return (
    <>
      <button type="button" className="boton boton--secundario" onClick={() => void salida.cerrar()} disabled={salida.cerrando} aria-busy={salida.cerrando}>
        {salida.cerrando ? CERRANDO_SESION : C.salir}
      </button>
      {salida.problema ? (
        <p className="campo__error" role="alert">
          {salida.problema}
        </p>
      ) : null}
    </>
  );
}

interface PropiedadesDelPaso {
  readonly token: string;
  readonly avisoInicial: string | null;
  readonly alTerminar: (aviso?: string | null) => void;
  readonly alPerderLaSesion: (r: Resultado<unknown>) => boolean;
}

/** El código del autenticador o, si se perdió, uno de recuperación. */
function PasoDelCodigo({ token, avisoInicial, alTerminar, alPerderLaSesion }: PropiedadesDelPaso) {
  const [modo, setModo] = useState<'autenticador' | 'recuperacion'>('autenticador');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(avisoInicial);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const conAutenticador = modo === 'autenticador';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    const valido = conAutenticador ? normalizarCodigoDelAutenticador(codigo) : normalizarCodigoDeRecuperacion(codigo);
    if (!valido) {
      setError(conAutenticador ? C.codigo.formaInvalida : C.recuperacion.formaInvalida);
      campo.current?.focus();
      return;
    }
    setError(null);
    setEnviando(true);
    const r = conAutenticador ? await api.verificarSegundoFactorDeLaSesion(token, codigo) : await api.usarCodigoDeRecuperacionDeLaSesion(token, codigo);
    setEnviando(false);
    const que = alEnviarUnCodigo(r);
    switch (que.tipo) {
      case 'listo':
        setCodigo('');
        return alTerminar(r.ok && !conAutenticador ? C.recuperacion.despues(r.datos.data.recoveryCodesRemaining) : null);
      case 'campo':
        setCodigo('');
        setError(que.mensaje);
        campo.current?.focus();
        return;
      case 'bloqueado':
        setCodigo('');
        setModo('recuperacion');
        setAviso(C.codigo.bloqueado);
        return;
      case 'releer':
        return alTerminar(que.aviso);
      case 'sesion':
        alPerderLaSesion(r);
        return;
      case 'aviso':
        setAviso(que.mensaje);
        return;
    }
  }

  return (
    <div className="acceso-administrativo">
      <Titulo>{conAutenticador ? C.codigo.titulo : C.recuperacion.titulo}</Titulo>
      <p className="bajada">{C.codigo.queEs}</p>
      <form className="formulario" onSubmit={enviar} noValidate>
        {aviso ? (
          <Aviso tipo="info" enfocar>
            <p>{aviso}</p>
          </Aviso>
        ) : null}
        <Campo
          ref={campo}
          id={conAutenticador ? 'mfa-codigo' : 'mfa-recuperacion'}
          etiqueta={conAutenticador ? C.codigo.campo : C.recuperacion.campo}
          ayuda={conAutenticador ? C.codigo.ayuda : C.recuperacion.ayuda}
          error={error}
          value={codigo}
          onChange={(ev) => setCodigo(ev.target.value)}
          required
          {...(conAutenticador
            ? { inputMode: 'numeric' as const, autoComplete: 'one-time-code', maxLength: 8, className: 'campo-de-codigo' }
            : { autoComplete: 'off', autoCapitalize: 'characters', spellCheck: false, maxLength: 32, className: 'campo-de-codigo' })}
        />
        <div className="acciones">
          <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? C.codigo.confirmando : C.codigo.confirmar}
          </button>
          <button
            type="button"
            className="boton boton--enlace mfa-cambiar-modo"
            disabled={enviando}
            onClick={() => {
              setModo(conAutenticador ? 'recuperacion' : 'autenticador');
              setCodigo('');
              setError(null);
              setAviso(null);
            }}
          >
            {conAutenticador ? C.codigo.usarRecuperacion : C.codigo.usarAutenticador}
          </button>
          <CerrarSesion />
        </div>
      </form>
      <details className="ayuda">
        <summary>{C.codigo.perdisteTitulo}</summary>
        <div className="ayuda__cuerpo">
          <p>{C.codigo.perdiste}</p>
        </div>
      </details>
    </div>
  );
}

type DatosDeConfiguracion = ConfiguracionDelAutenticadorResponse['data'];

/**
 * Configurar el autenticador: la primera vez (con `plazo`) o para reemplazarlo desde «Seguridad» (`reemplazo`). El
 * secreto vive en memoria hasta confirmar; al confirmar, los diez códigos se muestran una sola vez.
 */
export function PasoDeConfiguracion({
  token,
  plazo,
  avisoInicial,
  alTerminar,
  alPerderLaSesion,
  reemplazo = false,
  alCancelar,
}: PropiedadesDelPaso & { readonly plazo: string | null; readonly reemplazo?: boolean; readonly alCancelar?: () => void }) {
  const [datos, setDatos] = useState<DatosDeConfiguracion | null>(null);
  const [codigos, setCodigos] = useState<readonly string[] | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(avisoInicial);
  const [enviando, setEnviando] = useState(false);
  /** Si se copió la clave: `si`, `no` (sin permiso del navegador: se copia a mano) o `null` antes de intentarlo. */
  const [copiada, setCopiada] = useState<'si' | 'no' | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  /**
   * Copia la clave tal como se ve, sin los espacios de los grupos ni el relleno del final, como la piden las aplicaciones
   * de códigos. Va al portapapeles porque la persona lo pide; no se guarda en ningún otro lado.
   */
  async function copiarLaClave(secreto: string) {
    try {
      await navigator.clipboard.writeText(claveParaCopiar(secreto));
      setCopiada('si');
    } catch {
      setCopiada('no');
    }
  }

  async function empezar() {
    if (enviando) return;
    setAviso(null);
    setEnviando(true);
    const r = await api.iniciarConfiguracionDeLaSesion(token);
    setEnviando(false);
    if (r.ok) return setDatos(r.datos.data);
    const que = alEnviarUnCodigo(r);
    if (que.tipo === 'sesion') return void alPerderLaSesion(r);
    if (que.tipo === 'releer') return alTerminar(que.aviso);
    setAviso(que.tipo === 'aviso' ? que.mensaje : COPY.noDisponible);
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    if (!normalizarCodigoDelAutenticador(codigo)) {
      setError(C.codigo.formaInvalida);
      campo.current?.focus();
      return;
    }
    setError(null);
    setEnviando(true);
    const r = await api.confirmarConfiguracionDeLaSesion(token, codigo);
    setEnviando(false);
    if (r.ok) {
      setCodigo('');
      setDatos(null);
      setCodigos(r.datos.data.recoveryCodes);
      return;
    }
    const que = alEnviarUnCodigo(r);
    switch (que.tipo) {
      case 'campo':
        setCodigo('');
        setError(que.mensaje);
        campo.current?.focus();
        return;
      case 'sesion':
        alPerderLaSesion(r);
        return;
      case 'releer':
        // La configuración pendiente ya no está (venció): se empieza de nuevo.
        setDatos(null);
        setAviso(que.aviso ?? C.configuracion.vencida);
        return;
      default:
        setAviso(que.tipo === 'aviso' ? que.mensaje : COPY.noDisponible);
    }
  }

  if (codigos) {
    return (
      <div className="acceso-administrativo">
        <Titulo>{C.codigos.titulo}</Titulo>
        <p>{C.codigos.ayuda}</p>
        <ol className="codigos-de-recuperacion">
          {codigos.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ol>
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => alTerminar(reemplazo ? C.configuracion.reemplazado : null)}>
            {C.codigos.listo}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={reemplazo ? 'panel' : 'acceso-administrativo'}>
      <Titulo>{reemplazo ? C.configuracion.reemplazar : C.configuracion.titulo}</Titulo>
      <p className="bajada">{reemplazo ? C.configuracion.reemplazarAyuda : C.configuracion.queEs}</p>
      {plazo ? <p className="nota">{C.configuracion.plazo(hora(plazo))}</p> : null}
      {aviso ? (
        <Aviso tipo="info" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      {!datos ? (
        <div className="acciones">
          <button type="button" className="boton boton--primario mfa-empezar" onClick={() => void empezar()} disabled={enviando} aria-busy={enviando}>
            {enviando ? C.configuracion.empezando : C.configuracion.empezar}
          </button>
          {alCancelar ? (
            <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
              {C.configuracion.cancelar}
            </button>
          ) : (
            <CerrarSesion />
          )}
        </div>
      ) : (
        <form className="formulario" onSubmit={confirmar} noValidate>
          <ol className="pasos-de-configuracion">
            <li>
              <p>{C.configuracion.paso2}</p>
              <div className="configuracion-del-autenticador">
                <CodigoQr texto={datos.otpauthUri} etiqueta={C.configuracion.etiquetaQr} tamano={200} />
                {/* La clave a la vista, con su botón para copiarla, y el enlace que abre la aplicación: así se configura
                    también desde el mismo teléfono, donde el QR no se puede escanear. */}
                <div className="clave-a-la-vista">
                  <p className="clave-a-la-vista__rotulo">{C.configuracion.clave}</p>
                  <p className="clave-del-autenticador">
                    <code>{claveEnGrupos(datos.secret)}</code>
                  </p>
                  <div className="acciones">
                    <button type="button" className="boton boton--secundario" onClick={() => void copiarLaClave(datos.secret)}>
                      {C.configuracion.copiarLaClave}
                    </button>
                    <a className="boton boton--secundario" href={`otpauth://${restoDelEnlaceOtpauth(datos.otpauthUri)}`}>
                      {C.configuracion.abrirEnLaAplicacion}
                    </a>
                  </div>
                  <p className="nota" role="status" aria-live="polite">
                    {copiada === 'si' ? C.configuracion.claveCopiada : copiada === 'no' ? C.configuracion.noSePudoCopiar : ''}
                  </p>
                  <p className="nota">{C.configuracion.desdeElTelefono}</p>
                  <p className="nota">{C.configuracion.cuenta(datos.accountName, datos.issuer)}</p>
                  <p className="nota">{C.configuracion.datosDeLaClave}</p>
                </div>
              </div>
              <p className="nota">{C.configuracion.vence(hora(datos.expiresAt))}</p>
            </li>
            <li>
              <Campo
                ref={campo}
                id="mfa-codigo-nuevo"
                etiqueta={C.codigo.campo}
                ayuda={C.configuracion.paso3}
                error={error}
                value={codigo}
                onChange={(ev) => setCodigo(ev.target.value)}
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                className="campo-de-codigo"
              />
            </li>
          </ol>
          <div className="acciones">
            <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando ? C.codigo.confirmando : C.codigo.confirmar}
            </button>
            {alCancelar ? (
              <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
                {C.configuracion.cancelar}
              </button>
            ) : (
              <CerrarSesion />
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/** Sin autenticador y con el plazo vencido: cerrar la sesión y volver a entrar. */
function PasoDeVolverAEntrar() {
  return (
    <div className="acceso-administrativo">
      <Titulo>{C.volverAEntrar.titulo}</Titulo>
      <Aviso tipo="info">
        <p>{C.volverAEntrar.texto}</p>
      </Aviso>
      <div className="acciones">
        <CerrarSesion />
      </div>
    </div>
  );
}
