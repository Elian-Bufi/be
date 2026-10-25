'use client';

/**
 * El acceso a la consola de Administración (WP-ADMINISTRACION, DL-155; 08 §25), en el orden en que se recorre:
 * 1. **Entrada** (API-ADM-01): correo y contraseña de la cuenta administrativa. El rechazo es neutral, como en el login
 *    común: no dice si el correo existe ni si la cuenta tiene el rol.
 * 2. **Segundo factor** (API-ADM-05 y 06): el código del autenticador o, si se perdió, un código de recuperación, que
 *    sirve una sola vez. Cinco códigos que no valen cierran la sesión.
 * 3. **Configuración** (API-ADM-07 y 08), la primera vez o después de un restablecimiento del operador: el código de
 *    incorporación, el QR (o la clave a mano) y un código para confirmar. Para reemplazar el autenticador, la contraseña.
 * 4. **Códigos de recuperación**, que se muestran una sola vez al configurar o al generar unos nuevos.
 * Lo que decide qué paso falta es lo que dice la API; esta pantalla no supone nada. La clave del autenticador, el QR y los
 * códigos no se guardan en el navegador ni se escriben en ningún registro.
 */
import {
  COPY,
  COPY_ADMINISTRACION,
  normalizarCodigoDeIncorporacion,
  normalizarCodigoDeRecuperacion,
  normalizarCodigoDelAutenticador,
  type ConfiguracionDelAutenticadorResponse,
  type ResultadoAdministrativo,
} from '@be/domain';
import { useEffect, useRef, useState, type FormEvent, type Ref } from 'react';
import { CodigoQr } from '../../components/codigo-qr';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { apiAdministrativa } from '../../lib/api-administrativa';
import { horaDelDia } from '../../lib/formato';
import { useAdministracion, type MotivoDeSalida } from '../../lib/sesion-administrativa';

const A = COPY_ADMINISTRACION;
const hora = (iso: string): string => horaDelDia(new Date(iso));

const AVISO_DE_SALIDA: Readonly<Record<MotivoDeSalida, { readonly tipo: 'info' | 'error'; readonly texto: string }>> = {
  vencida: { tipo: 'info', texto: A.entrada.sesionVencida },
  plazo: { tipo: 'info', texto: A.entrada.plazoVencido },
  intentos: { tipo: 'error', texto: A.entrada.cerradaPorIntentos },
  cerrada: { tipo: 'info', texto: A.entrada.sesionCerrada },
  'sin-conexion': { tipo: 'error', texto: A.entrada.sinConexion },
  'no-configurada': { tipo: 'error', texto: A.entrada.noConfigurada },
};

// ─── 1. Entrada ────────────────────────────────────────────────────────────────────────────────

export function EntradaAdministrativa() {
  const { guardar, motivo } = useAdministracion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ 'adm-correo'?: string; 'adm-contrasena'?: string }>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const encontrados: typeof errores = {};
    if (!correo.trim()) encontrados['adm-correo'] = A.entrada.faltaCorreo;
    if (!contrasena) encontrados['adm-contrasena'] = A.entrada.faltaContrasena;
    setErrores(encontrados);
    setIntento((n) => n + 1);
    setFalla(null);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    const r = await apiAdministrativa.iniciarSesion(correo.trim(), contrasena);
    setEnviando(false);
    if (r.ok) {
      setContrasena('');
      guardar(r.datos);
      return;
    }
    if (r.tipo === 'RED') return setFalla(COPY.loginSinConexion);
    if (r.codigo === 'INVALID_CREDENTIALS' || r.codigo === 'INVALID_REQUEST' || r.codigo === 'UNKNOWN_FIELD') return setFalla(A.entrada.credencialesInvalidas);
    if (r.codigo === 'RATE_LIMITED') return setFalla(A.segundoFactor.demasiadosIntentos);
    if (r.codigo === 'ADMINISTRATION_NOT_AVAILABLE') return setFalla(A.entrada.noConfigurada);
    return setFalla(COPY.noDisponible);
  }

  const lista = Object.entries(errores).map(([id, texto]) => ({ id, texto: texto as string }));
  const salida = motivo ? AVISO_DE_SALIDA[motivo] : null;
  return (
    <div className="acceso-administrativo">
      <h1>{A.entrada.titulo}</h1>
      <p className="bajada">{A.entrada.queEs}</p>
      <form className="formulario" onSubmit={enviar} noValidate>
        {salida && !falla && lista.length === 0 ? (
          <Aviso tipo={salida.tipo}>
            <p>{salida.texto}</p>
          </Aviso>
        ) : null}
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <Campo
          id="adm-correo"
          etiqueta={A.entrada.correo}
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores['adm-correo']}
        />
        <Campo
          id="adm-contrasena"
          etiqueta={A.entrada.contrasena}
          type="password"
          autoComplete="current-password"
          required
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores['adm-contrasena']}
        />
        <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? A.entrada.entrando : A.entrada.continuar}
        </button>
      </form>
    </div>
  );
}

// ─── Piezas comunes de los pasos con código ────────────────────────────────────────────────────

/**
 * Lo que hacen los pasos con código ante una respuesta que no es un éxito. Devuelve el texto para el campo o para el aviso,
 * o `null` si ya se ocupó (la sesión se olvidó o el estado se volvió a leer).
 */
function useRespuestaDeUnPaso() {
  const { sesion, olvidar, revisar, segundoFactor } = useAdministracion();
  // El último «te quedan N intentos»: si era el último, un SESSION_REVOKED es por los intentos.
  const restantes = useRef<number | null>(null);
  const token = sesion?.token ?? null;

  /** Vuelve a preguntar por el estado de la sesión: un paso que ya no corresponde, o una respuesta que no llegó. */
  async function releer(): Promise<'VERIFIED' | 'OTRO' | 'SIN_RESPUESTA'> {
    if (!token) return 'OTRO';
    const r = await apiAdministrativa.estadoDeLaSesion(token);
    if (r.ok) {
      segundoFactor(r.datos.data.secondFactor);
      return r.datos.data.secondFactor.state === 'VERIFIED' ? 'VERIFIED' : 'OTRO';
    }
    if (revisar(r)) return 'OTRO';
    return 'SIN_RESPUESTA';
  }

  /** `pasoNoPermitido`: lo que se dice si el paso ya no corresponde al estado de la sesión (después de volver a leerlo). */
  async function tratar(r: ResultadoAdministrativo<unknown>, pasoNoPermitido: string = COPY.noDisponible): Promise<{ readonly campo?: string; readonly aviso?: string } | null> {
    if (r.ok) return null;
    if (r.tipo === 'RED') {
      // Sin respuesta: el código pudo haberse aceptado. Antes de pedir otro, se pregunta.
      const ahora = await releer();
      return ahora === 'VERIFIED' ? null : { aviso: COPY.resultadoIncierto };
    }
    if (r.codigo === 'SECOND_FACTOR_INVALID' || r.codigo === 'INCORPORATION_CODE_INVALID') {
      restantes.current = r.intentosRestantes ?? null;
      const n = r.intentosRestantes ?? 0;
      return { campo: r.codigo === 'INCORPORATION_CODE_INVALID' ? `${A.configuracion.incorporacionInvalida}${n > 0 ? ` ${A.segundoFactor.intentosRestantes(n)}` : ''}` : A.segundoFactor.invalido(n) };
    }
    if (r.codigo === 'SESSION_REVOKED') {
      olvidar(restantes.current === 1 ? 'intentos' : null);
      return null;
    }
    if (revisar(r)) return null;
    if (r.codigo === 'RATE_LIMITED') return { aviso: A.segundoFactor.demasiadosIntentos };
    if (r.codigo === 'INVALID_STATE_TRANSITION') {
      await releer();
      return { aviso: pasoNoPermitido };
    }
    if (r.codigo === 'INVALID_CREDENTIALS') return { campo: A.seguridad.contrasenaIncorrecta };
    if (r.codigo === 'ADMINISTRATION_NOT_AVAILABLE') return { aviso: A.entrada.noConfigurada };
    return { aviso: COPY.noDisponible };
  }

  return { tratar };
}

/** Un campo de código: sin autocorrección ni mayúsculas automáticas, y con el error atado al campo. */
function CampoDeCodigo({
  id,
  etiqueta,
  ayuda,
  valor,
  onCambio,
  error,
  tipo,
  campo,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onCambio: (v: string) => void;
  error: string | null;
  tipo: 'totp' | 'texto' | 'contrasena';
  campo?: Ref<HTMLInputElement>;
}) {
  return (
    <Campo
      ref={campo}
      id={id}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      required
      {...(tipo === 'totp'
        ? { inputMode: 'numeric' as const, autoComplete: 'one-time-code', maxLength: 8, className: 'campo-de-codigo' }
        : tipo === 'contrasena'
          ? { type: 'password', autoComplete: 'current-password' }
          : { autoComplete: 'off', autoCapitalize: 'characters', spellCheck: false, maxLength: 32, className: 'campo-de-codigo' })}
    />
  );
}

// ─── 2. Segundo factor ─────────────────────────────────────────────────────────────────────────

export function PasoDelSegundoFactor() {
  const { sesion, segundoFactor, avisar } = useAdministracion();
  const { tratar } = useRespuestaDeUnPaso();
  const [modo, setModo] = useState<'autenticador' | 'recuperacion'>('autenticador');
  const [codigo, setCodigo] = useState('');
  const [errorDelCampo, setErrorDelCampo] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  // Al llegar a este paso (o al cambiar de modo), el foco va al título: el lector de pantalla dice dónde se está.
  useEffect(() => {
    titulo.current?.focus();
  }, [modo]);

  if (!sesion || sesion.segundoFactor.state !== 'REQUIRED') return null;
  const plazo = sesion.segundoFactor.deadline;
  const conAutenticador = modo === 'autenticador';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    const valido = conAutenticador ? normalizarCodigoDelAutenticador(codigo) : normalizarCodigoDeRecuperacion(codigo);
    if (!valido) {
      setErrorDelCampo(conAutenticador ? A.segundoFactor.formaInvalida : A.recuperacion.formaInvalida);
      campo.current?.focus();
      return;
    }
    setErrorDelCampo(null);
    setEnviando(true);
    const r = conAutenticador ? await apiAdministrativa.verificarCodigo(sesion.token, codigo) : await apiAdministrativa.usarCodigoDeRecuperacion(sesion.token, codigo);
    if (r.ok) {
      setEnviando(false);
      setCodigo('');
      if (!conAutenticador) {
        const n = r.datos.data.recoveryCodesRemaining;
        avisar(n <= 3 ? `${A.recuperacion.despues(n)} ${A.recuperacion.pocos}` : A.recuperacion.despues(n));
      }
      segundoFactor(r.datos.data.secondFactor);
      return;
    }
    const t = await tratar(r);
    setEnviando(false);
    if (!t) return;
    if (t.campo) {
      setCodigo('');
      setErrorDelCampo(t.campo);
      campo.current?.focus();
    }
    if (t.aviso) setFalla(t.aviso);
  }

  return (
    <div className="acceso-administrativo">
      <h1 ref={titulo} tabIndex={-1}>
        {conAutenticador ? A.segundoFactor.titulo : A.recuperacion.titulo}
      </h1>
      {plazo === null ? (
        <Aviso tipo="info">
          <p>{A.segundoFactor.porInactividad}</p>
        </Aviso>
      ) : (
        <p className="nota">{A.segundoFactor.plazo(hora(plazo))}</p>
      )}
      <form className="formulario" onSubmit={enviar} noValidate>
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <CampoDeCodigo
          id={conAutenticador ? 'adm-codigo' : 'adm-recuperacion'}
          etiqueta={conAutenticador ? A.segundoFactor.campo : A.recuperacion.campo}
          ayuda={conAutenticador ? A.segundoFactor.ayuda : A.recuperacion.ayuda}
          valor={codigo}
          onCambio={setCodigo}
          error={errorDelCampo}
          tipo={conAutenticador ? 'totp' : 'texto'}
          campo={campo}
        />
        <div className="acciones">
          <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? A.segundoFactor.confirmando : A.segundoFactor.confirmar}
          </button>
          <button
            type="button"
            className="boton boton--enlace"
            disabled={enviando}
            onClick={() => {
              setModo(conAutenticador ? 'recuperacion' : 'autenticador');
              setCodigo('');
              setErrorDelCampo(null);
              setFalla(null);
            }}
          >
            {conAutenticador ? A.segundoFactor.usarRecuperacion : A.segundoFactor.usarAutenticador}
          </button>
        </div>
      </form>
      <details className="ayuda">
        <summary>Si perdiste el autenticador y los códigos</summary>
        <div className="ayuda__cuerpo">
          <p>{A.seguridad.perdiste}</p>
        </div>
      </details>
    </div>
  );
}

// ─── 3. Configuración del autenticador ─────────────────────────────────────────────────────────

type DatosDeConfiguracion = ConfiguracionDelAutenticadorResponse['data'];

/**
 * - `incorporacion`: la primera vez (o después de un restablecimiento), con el código de incorporación. Va sola en la
 *   pantalla, con su título.
 * - `reemplazo`: desde «Seguridad», con la contraseña. El autenticador actual sigue valiendo hasta confirmar el nuevo.
 */
export function ConfiguracionDelAutenticador({ modo, alCancelar }: { modo: 'incorporacion' | 'reemplazo'; alCancelar?: () => void }) {
  const { sesion, segundoFactor, mostrarCodigos, avisar } = useAdministracion();
  const { tratar } = useRespuestaDeUnPaso();
  const [datos, setDatos] = useState<DatosDeConfiguracion | null>(null);
  const [entrada, setEntrada] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorDelCampo, setErrorDelCampo] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const incorporacion = modo === 'incorporacion';

  // Al pasar del primer paso al QR, el foco va al título del paso nuevo.
  useEffect(() => {
    if (datos || incorporacion) titulo.current?.focus();
  }, [datos, incorporacion]);

  if (!sesion) return null;
  const plazo = sesion.segundoFactor.state === 'ENROLLMENT_REQUIRED' ? sesion.segundoFactor.deadline : null;

  async function empezar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    if (incorporacion && !normalizarCodigoDeIncorporacion(entrada)) {
      setErrorDelCampo(A.configuracion.formaIncorporacion);
      campo.current?.focus();
      return;
    }
    if (!incorporacion && !entrada) {
      setErrorDelCampo(A.seguridad.faltaContrasena);
      campo.current?.focus();
      return;
    }
    setErrorDelCampo(null);
    setEnviando(true);
    const r = await apiAdministrativa.iniciarConfiguracion(sesion.token, incorporacion ? { codigoDeIncorporacion: entrada } : { contrasena: entrada });
    if (r.ok) {
      setEnviando(false);
      setEntrada('');
      setDatos(r.datos.data);
      return;
    }
    const t = await tratar(r);
    setEnviando(false);
    if (!t) return;
    if (t.campo) {
      setErrorDelCampo(t.campo);
      campo.current?.focus();
    }
    if (t.aviso) setFalla(t.aviso);
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    if (!normalizarCodigoDelAutenticador(codigo)) {
      setErrorDelCampo(A.segundoFactor.formaInvalida);
      campo.current?.focus();
      return;
    }
    setErrorDelCampo(null);
    setEnviando(true);
    const r = await apiAdministrativa.confirmarConfiguracion(sesion.token, codigo);
    if (r.ok) {
      setEnviando(false);
      setCodigo('');
      setDatos(null);
      if (!incorporacion) avisar(A.configuracion.reemplazado);
      mostrarCodigos(r.datos.data.recoveryCodes);
      segundoFactor(r.datos.data.secondFactor);
      alCancelar?.();
      return;
    }
    const t = await tratar(r, A.configuracion.vencida);
    setEnviando(false);
    if (!t) return;
    if (t.campo) {
      setCodigo('');
      setErrorDelCampo(t.campo);
      campo.current?.focus();
    }
    if (t.aviso) {
      // La configuración pendiente ya no está (venció): se vuelve a empezar desde el primer paso.
      if (t.aviso === A.configuracion.vencida) setDatos(null);
      setFalla(t.aviso);
    }
  }

  const Titulo = incorporacion ? 'h1' : 'h2';
  return (
    <div className={incorporacion ? 'acceso-administrativo' : 'panel'}>
      <Titulo ref={titulo} tabIndex={-1}>
        {incorporacion ? A.configuracion.titulo : A.configuracion.reemplazar}
      </Titulo>
      {incorporacion ? <p className="bajada">{A.configuracion.queEs}</p> : null}
      {plazo ? <p className="nota">{A.segundoFactor.plazo(hora(plazo))}</p> : null}
      {falla ? (
        <Aviso tipo="error" enfocar>
          <p>{falla}</p>
        </Aviso>
      ) : null}
      {!datos ? (
        <form className="formulario" onSubmit={empezar} noValidate>
          <p>{incorporacion ? A.configuracion.paso1 : A.configuracion.reemplazarAyuda}</p>
          <CampoDeCodigo
            id={incorporacion ? 'adm-incorporacion' : 'adm-contrasena-reemplazo'}
            etiqueta={incorporacion ? A.configuracion.campoIncorporacion : A.entrada.contrasena}
            valor={entrada}
            onCambio={setEntrada}
            error={errorDelCampo}
            tipo={incorporacion ? 'texto' : 'contrasena'}
            campo={campo}
          />
          <div className="acciones">
            <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando ? A.segundoFactor.confirmando : A.configuracion.continuar}
            </button>
            {alCancelar ? (
              <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
                {A.configuracion.cancelar}
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <form className="formulario" onSubmit={confirmar} noValidate>
          <ol className="pasos-de-configuracion">
            <li>
              <p>{A.configuracion.paso2}</p>
              <div className="configuracion-del-autenticador">
                <CodigoQr texto={datos.otpauthUri} etiqueta={A.configuracion.etiquetaQr} tamano={200} />
                <details className="ayuda">
                  <summary>{A.configuracion.clave}</summary>
                  <div className="ayuda__cuerpo">
                    <p className="clave-del-autenticador">
                      <code>{datos.secret.replace(/=+$/, '').match(/.{1,4}/g)?.join(' ')}</code>
                    </p>
                    <p className="nota">{A.configuracion.cuenta(datos.accountName, datos.issuer)}</p>
                    <p className="nota">{A.configuracion.datosDeLaClave}</p>
                  </div>
                </details>
              </div>
              <p className="nota">{A.configuracion.vence(hora(datos.expiresAt))}</p>
            </li>
            <li>
              <CampoDeCodigo id="adm-codigo-nuevo" etiqueta={A.segundoFactor.campo} ayuda={A.configuracion.paso3} valor={codigo} onCambio={setCodigo} error={errorDelCampo} tipo="totp" campo={campo} />
            </li>
          </ol>
          <div className="acciones">
            <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando ? A.segundoFactor.confirmando : A.segundoFactor.confirmar}
            </button>
            {alCancelar ? (
              <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
                {A.configuracion.cancelar}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}

// ─── 4. Códigos de recuperación ────────────────────────────────────────────────────────────────

/** Los diez códigos, una sola vez. Viven en memoria hasta «Ya los guardé». */
export function CodigosParaGuardar() {
  const { codigosPorGuardar, mostrarCodigos } = useAdministracion();
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, []);
  if (!codigosPorGuardar) return null;
  return (
    <div className="acceso-administrativo">
      <h1 ref={titulo} tabIndex={-1}>
        {A.codigos.titulo}
      </h1>
      <p>{A.codigos.ayuda}</p>
      <ol className="codigos-de-recuperacion">
        {codigosPorGuardar.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => mostrarCodigos(null)}>
          {A.codigos.listo}
        </button>
      </div>
    </div>
  );
}
