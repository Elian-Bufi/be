'use client';

/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005, UC-E09) · recuperar el acceso local, en dos pasos:
 * 1. **Pedir** (API-ACC-P1-01): el correo de la cuenta. La respuesta es la misma exista o no la cuenta, y la pantalla dice
 *    lo mismo en todos los casos: «Si hay una cuenta con contraseña con ese correo, te mandamos un código». Sin proveedor
 *    de correo (`delivery` ASSISTED), dice cómo pedirle el código a Administración por el canal de ayuda.
 * 2. **Completar** (API-ACC-P1-02): el código y la contraseña nueva, dos veces. Un código que no vale, siempre el mismo
 *    mensaje, con «Pedir otro código». Al cambiarla, entra con la contraseña nueva y sigue como el login.
 * Una cuenta que entra con Google no tiene contraseña: la pantalla lo recuerda y ofrece volver a «Continuar con Google».
 */
import { COPY, COPY_RECUPERACION, LARGO_MINIMO_DE_CREDENCIAL, MENSAJE_DE_CAMPO, normalizarCodigoDeRecuperacionDeAcceso, problemaDeCredencialLocal, type EntregaDelCodigo } from '@be/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { api } from '../../lib/api';
import { buscarInicioPropio } from '../../lib/inicio';
import { useSesion } from '../../lib/sesion';

const R = COPY_RECUPERACION;
type Paso = { readonly tipo: 'pedir' } | { readonly tipo: 'completar'; readonly recoveryId: string; readonly entrega: EntregaDelCodigo };

export function FormularioDeRecuperacion() {
  const router = useRouter();
  const { guardar } = useSesion();
  const [paso, setPaso] = useState<Paso>({ tipo: 'pedir' });
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<{ readonly texto: string; readonly pedirOtro?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [intento, setIntento] = useState(0);

  function mostrar(encontrados: Record<string, string>): boolean {
    setErrores(encontrados);
    setIntento((n) => n + 1);
    return Object.keys(encontrados).length > 0;
  }

  async function pedir(e?: FormEvent) {
    e?.preventDefault();
    if (enviando) return;
    setFalla(null);
    if (mostrar(correo.trim() ? {} : { 'rec-correo': R.correoFalta })) return;
    setEnviando(true);
    const r = await api.pedirRecuperacion(correo);
    setEnviando(false);
    if (r.ok) {
      setCodigo('');
      setPaso({ tipo: 'completar', recoveryId: r.datos.data.recoveryId, entrega: r.datos.data.delivery });
      return;
    }
    if (r.tipo === 'RED') return setFalla({ texto: COPY.resultadoIncierto });
    if (r.codigo === 'RATE_LIMITED') return setFalla({ texto: COPY.demasiadosIntentos });
    if (r.codigo === 'VALIDATION_FAILED') return void mostrar({ 'rec-correo': R.correoInvalido });
    setFalla({ texto: COPY.noDisponible });
  }

  async function completar(e: FormEvent) {
    e.preventDefault();
    if (enviando || paso.tipo !== 'completar') return;
    setFalla(null);
    const encontrados: Record<string, string> = {};
    if (!codigo.trim()) encontrados['rec-codigo'] = R.codigoFalta;
    else if (!normalizarCodigoDeRecuperacionDeAcceso(codigo)) encontrados['rec-codigo'] = R.codigoInvalido;
    const problema = problemaDeCredencialLocal(contrasena);
    if (problema) encontrados['rec-contrasena'] = MENSAJE_DE_CAMPO[problema] ?? R.contrasenaAyuda;
    else if (contrasena !== repetida) encontrados['rec-repetida'] = R.noCoinciden;
    if (mostrar(encontrados)) return;
    setEnviando(true);
    const r = await api.completarRecuperacion(paso.recoveryId, codigo, contrasena);
    if (!r.ok) {
      setEnviando(false);
      if (r.tipo === 'RED') return setFalla({ texto: COPY.resultadoIncierto });
      if (r.codigo === 'RECOVERY_CODE_INVALID') return setFalla({ texto: R.codigoInvalido, pedirOtro: true });
      if (r.codigo === 'RATE_LIMITED') return setFalla({ texto: COPY.demasiadosIntentos });
      if (r.codigo === 'VALIDATION_FAILED') return void mostrar({ 'rec-contrasena': MENSAJE_DE_CAMPO[r.issues[0]?.code ?? ''] ?? MENSAJE_DE_CAMPO.CREDENCIAL_DEMASIADO_CORTA! });
      return setFalla({ texto: COPY.noDisponible });
    }
    // La contraseña cambió: entra con ella, como el login. Si no puede entrar ahora, lo dice y ofrece Iniciar sesión.
    setListo(true);
    const sesion = await api.iniciarSesion(correo, contrasena);
    setContrasena('');
    setRepetida('');
    setEnviando(false);
    if (!sesion.ok) return;
    guardar(sesion.datos);
    void buscarInicioPropio(sesion.datos.data.session.accessToken).then((destino) => router.push(destino));
  }

  const lista = Object.entries(errores).map(([id, texto]) => ({ id, texto }));

  if (listo) {
    return (
      <div className="formulario">
        <Aviso tipo="exito" enfocar>
          <p>{R.listo}</p>
        </Aviso>
        {enviando ? (
          <p className="nota" aria-live="polite">
            {R.entrando}
          </p>
        ) : (
          <p>
            <Link href="/login">{R.irAEntrar}</Link>
          </p>
        )}
      </div>
    );
  }

  if (paso.tipo === 'pedir') {
    return (
      <form className="formulario" onSubmit={pedir} noValidate>
        <p className="bajada">{R.queEs}</p>
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla.texto}</p>
          </Aviso>
        ) : null}
        <Campo
          id="rec-correo"
          etiqueta={R.correo}
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={correo}
          onChange={(ev) => setCorreo(ev.target.value)}
          error={errores['rec-correo']}
        />
        <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? R.pidiendo : R.pedir}
        </button>
        <p className="nota">{R.conGoogle}</p>
        <p>
          <Link href="/login">{R.volver}</Link>
        </p>
      </form>
    );
  }

  return (
    <form className="formulario" onSubmit={completar} noValidate>
      <Aviso tipo="info">
        <p>{paso.entrega === 'EMAIL' ? R.pedidoPorCorreo : R.pedidoAsistido}</p>
      </Aviso>
      <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
      {falla ? (
        <Aviso tipo="error" enfocar>
          <p>{falla.texto}</p>
          {falla.pedirOtro ? (
            <p>
              <button type="button" className="boton boton--secundario boton--compacto" onClick={() => void pedir()} disabled={enviando}>
                {R.pedirOtro}
              </button>
            </p>
          ) : null}
        </Aviso>
      ) : null}
      <Campo
        id="rec-codigo"
        etiqueta={R.codigo}
        ayuda={R.codigoAyuda}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        required
        value={codigo}
        onChange={(ev) => setCodigo(ev.target.value)}
        error={errores['rec-codigo']}
      />
      <Campo
        id="rec-contrasena"
        etiqueta={R.contrasenaNueva}
        ayuda={R.contrasenaAyuda}
        type="password"
        autoComplete="new-password"
        minLength={LARGO_MINIMO_DE_CREDENCIAL}
        required
        value={contrasena}
        onChange={(ev) => setContrasena(ev.target.value)}
        error={errores['rec-contrasena']}
      />
      <Campo
        id="rec-repetida"
        etiqueta={R.repetir}
        type="password"
        autoComplete="new-password"
        required
        value={repetida}
        onChange={(ev) => setRepetida(ev.target.value)}
        error={errores['rec-repetida']}
      />
      <button className="boton boton--primario" type="submit" disabled={enviando} aria-busy={enviando}>
        {enviando ? R.cambiando : R.cambiar}
      </button>
      <p>
        <button type="button" className="boton boton--enlace" onClick={() => void pedir()} disabled={enviando}>
          {R.pedirOtro}
        </button>
      </p>
      <p>
        <Link href="/login">{R.volver}</Link>
      </p>
    </form>
  );
}
