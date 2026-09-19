/**
 * APK · Iniciar sesión (PROTO-10-ACC-05): un único mensaje neutral para todo fallo (10-B02:198-225). Sin recuperación.
 */
import { COPY } from '@be/domain';
import { useState } from 'react';
import { api } from '../api';
import { Aviso, Boton, Campo, Titulo } from '../ui';

export function PantallaDeLogin({
  aviso,
  alIniciar,
  irARegistro,
}: {
  aviso?: string;
  /** El identificador de la identidad solo sirve para mostrar lo propio (por ejemplo, los vínculos donde es asesorado). */
  alIniciar: (token: string, expiresAt: string, identidadId: string) => void;
  irARegistro: () => void;
}) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (enviando) return;
    if (!correo.trim() || !contrasena) return setError('Completá el correo electrónico y la contraseña.');
    setEnviando(true);
    setError(null);
    const r = await api.iniciarSesion(correo, contrasena);
    setEnviando(false);
    if (r.ok) {
      setContrasena('');
      return alIniciar(r.datos.data.session.accessToken, r.datos.data.session.expiresAt, r.datos.data.actor.identityId);
    }
    if (r.tipo === 'RED') return setError(COPY.resultadoIncierto);
    if (r.codigo === 'RATE_LIMITED') return setError(COPY.demasiadosIntentos);
    if (r.codigo === 'INVALID_CREDENTIALS' || r.codigo === 'INVALID_REQUEST') return setError(COPY.loginFallido);
    return setError(COPY.noDisponible);
  }

  return (
    <>
      <Titulo>Iniciar sesión</Titulo>
      {aviso && !error ? <Aviso tipo="info" titulo={aviso} /> : null}
      {error ? <Aviso tipo="error" titulo={error} /> : null}
      <Campo
        etiqueta="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
      />
      <Campo
        etiqueta="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <Boton texto={enviando ? 'Iniciando sesión…' : COPY.iniciarSesion} onPress={enviar} ocupado={enviando} />
      <Boton texto="¿No tenés cuenta? Crear cuenta" tipo="enlace" onPress={irARegistro} />
    </>
  );
}
