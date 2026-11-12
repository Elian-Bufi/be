/**
 * APK · Recuperar el acceso (UF-03 de WP-USO-FINAL, DL-169; UF-D9; 04 RF-005, UC-E09). Se abre desde Iniciar sesión,
 * con «¿Olvidaste tu contraseña?», en dos pasos:
 * 1. **Pedir** (API-ACC-P1-01): el correo de la cuenta. La pantalla dice lo mismo exista o no la cuenta. Sin proveedor de
 *    correo (`delivery` ASSISTED), dice cómo pedirle el código a Administración por el canal de ayuda.
 * 2. **Completar** (API-ACC-P1-02): el código y la contraseña nueva, dos veces. Un código que no vale, siempre el mismo
 *    mensaje, con «Pedir otro código». Al cambiarla, entra con la contraseña nueva, como el login.
 * Una cuenta que entra con Google no tiene contraseña: la pantalla lo recuerda.
 */
import { COPY, COPY_RECUPERACION, MENSAJE_DE_CAMPO, normalizarCodigoDeRecuperacionDeAcceso, problemaDeCredencialLocal, type EntregaDelCodigo } from '@be/domain';
import { useState } from 'react';
import { api } from '../api';
import { Aviso, Boton, Campo, Parrafo, Titulo } from '../ui';
import type { AlIniciar } from './acceso-con-google';

const R = COPY_RECUPERACION;
type Paso = { readonly tipo: 'pedir' } | { readonly tipo: 'completar'; readonly recoveryId: string; readonly entrega: EntregaDelCodigo } | { readonly tipo: 'listo' };

export function PantallaDeRecuperarElAcceso({ irALogin, alIniciar, subir }: { irALogin: () => void; alIniciar: AlIniciar; subir: () => void }) {
  const [paso, setPaso] = useState<Paso>({ tipo: 'pedir' });
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; codigo?: string; contrasena?: string; repetida?: string }>({});
  const [falla, setFalla] = useState<{ readonly texto: string; readonly pedirOtro?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedir() {
    if (enviando) return;
    setFalla(null);
    if (!correo.trim()) return setErrores({ correo: R.correoFalta });
    setErrores({});
    setEnviando(true);
    const r = await api.pedirRecuperacion(correo);
    setEnviando(false);
    subir();
    if (r.ok) {
      setCodigo('');
      return setPaso({ tipo: 'completar', recoveryId: r.datos.data.recoveryId, entrega: r.datos.data.delivery });
    }
    if (r.tipo === 'RED') return setFalla({ texto: COPY.resultadoIncierto });
    if (r.codigo === 'RATE_LIMITED') return setFalla({ texto: COPY.demasiadosIntentos });
    if (r.codigo === 'VALIDATION_FAILED') return setErrores({ correo: R.correoInvalido });
    setFalla({ texto: COPY.noDisponible });
  }

  async function completar() {
    if (enviando || paso.tipo !== 'completar') return;
    setFalla(null);
    const encontrados: typeof errores = {};
    if (!codigo.trim()) encontrados.codigo = R.codigoFalta;
    else if (!normalizarCodigoDeRecuperacionDeAcceso(codigo)) encontrados.codigo = R.codigoInvalido;
    const problema = problemaDeCredencialLocal(contrasena);
    if (problema) encontrados.contrasena = MENSAJE_DE_CAMPO[problema] ?? R.contrasenaAyuda;
    else if (contrasena !== repetida) encontrados.repetida = R.noCoinciden;
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    const r = await api.completarRecuperacion(paso.recoveryId, codigo, contrasena);
    if (!r.ok) {
      setEnviando(false);
      subir();
      if (r.tipo === 'RED') return setFalla({ texto: COPY.resultadoIncierto });
      if (r.codigo === 'RECOVERY_CODE_INVALID') return setFalla({ texto: R.codigoInvalido, pedirOtro: true });
      if (r.codigo === 'RATE_LIMITED') return setFalla({ texto: COPY.demasiadosIntentos });
      if (r.codigo === 'VALIDATION_FAILED') return setErrores({ contrasena: MENSAJE_DE_CAMPO[r.issues[0]?.code ?? ''] ?? R.contrasenaAyuda });
      return setFalla({ texto: COPY.noDisponible });
    }
    // La contraseña cambió: entra con ella, como el login. Si ahora no puede, ofrece Iniciar sesión.
    setPaso({ tipo: 'listo' });
    subir();
    const sesion = await api.iniciarSesion(correo, contrasena);
    setContrasena('');
    setRepetida('');
    setEnviando(false);
    if (sesion.ok) alIniciar(sesion.datos.data.session.accessToken, sesion.datos.data.session.expiresAt, sesion.datos.data.actor.identityId, sesion.fechaDelServidor ?? null);
  }

  if (paso.tipo === 'listo') {
    return (
      <>
        <Titulo>{R.titulo}</Titulo>
        <Aviso tipo="exito" titulo={R.listo} />
        {enviando ? <Parrafo tenue>{R.entrando}</Parrafo> : <Boton texto={R.irAEntrar} onPress={irALogin} />}
      </>
    );
  }

  return (
    <>
      <Titulo>{R.titulo}</Titulo>
      {falla ? <Aviso tipo="error" titulo={falla.texto} /> : null}
      {paso.tipo === 'pedir' ? (
        <>
          <Parrafo>{R.queEs}</Parrafo>
          <Campo
            etiqueta={R.correo}
            value={correo}
            onChangeText={setCorreo}
            error={errores.correo}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
          />
          <Boton texto={enviando ? R.pidiendo : R.pedir} onPress={() => void pedir()} ocupado={enviando} />
          <Parrafo tenue icono="info">
            {R.conGoogle}
          </Parrafo>
        </>
      ) : (
        <>
          <Aviso tipo="info" titulo={paso.entrega === 'EMAIL' ? R.pedidoPorCorreo : R.pedidoAsistido} />
          {falla?.pedirOtro ? <Boton texto={R.pedirOtro} tipo="secundario" onPress={() => void pedir()} deshabilitado={enviando} /> : null}
          <Campo
            etiqueta={R.codigo}
            ayuda={R.codigoAyuda}
            value={codigo}
            onChangeText={setCodigo}
            error={errores.codigo}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={20}
          />
          <Campo
            etiqueta={R.contrasenaNueva}
            ayuda={R.contrasenaAyuda}
            value={contrasena}
            onChangeText={setContrasena}
            error={errores.contrasena}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Campo
            etiqueta={R.repetir}
            value={repetida}
            onChangeText={setRepetida}
            error={errores.repetida}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Boton texto={enviando ? R.cambiando : R.cambiar} onPress={() => void completar()} ocupado={enviando} />
          {falla?.pedirOtro ? null : <Boton texto={R.pedirOtro} tipo="enlace" onPress={() => void pedir()} deshabilitado={enviando} />}
        </>
      )}
      <Boton texto={R.volver} tipo="enlace" onPress={irALogin} deshabilitado={enviando} />
    </>
  );
}
