/**
 * APK · Crear cuenta (PROTO-10-ACC-01). A1 y A2: dos casillas separadas, cada una con etiqueta, versión y texto propios;
 * nunca premarcadas. A3 NO forma parte del registro (10-B02:137-141). Después del alta no hay auto-login (10-B02:170-194).
 */
import {
  COPY,
  MENSAJE_DE_CAMPO,
  VERSION_VIGENTE,
  identificadorLocalValido,
  normalizarIdentificadorLocal,
  problemaDeCredencialLocal,
  type VersionDeTexto,
} from '@be/domain';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { api, nuevaClaveDeIdempotencia } from '../api';
import { TextoVersionado } from '../texto-versionado';
import { Aviso, Boton, Campo, Casilla, Parrafo, Titulo, estilos as ui } from '../ui';

type Errores = Partial<Record<'correo' | 'contrasena' | 'a1' | 'a2', string>>;
type Estado = 'editando' | 'enviando' | 'creada' | 'no-disponible' | 'incierto' | { error: string };

export function PantallaDeRegistro({ irALogin }: { irALogin: () => void }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>('editando');
  const [texto, setTexto] = useState<VersionDeTexto | null>(null);
  const clave = useRef(nuevaClaveDeIdempotencia());
  const cambiar = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    clave.current = nuevaClaveDeIdempotencia(); // otros datos = otro intento lógico
  };

  async function enviar() {
    if (estado === 'enviando') return;
    const encontrados: Errores = {};
    if (!identificadorLocalValido(normalizarIdentificadorLocal(correo))) encontrados.correo = MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
    const problema = problemaDeCredencialLocal(contrasena);
    if (problema) encontrados.contrasena = MENSAJE_DE_CAMPO[problema];
    if (!a1) encontrados.a1 = MENSAJE_DE_CAMPO.A1_REQUERIDO;
    if (!a2) encontrados.a2 = MENSAJE_DE_CAMPO.A2_REQUERIDO;
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEstado('enviando');
    const r = await api.registrar({ correo, contrasena }, clave.current);
    if (r.ok) {
      setContrasena('');
      return setEstado('creada');
    }
    if (r.tipo === 'RED') return setEstado('incierto');
    if (r.codigo === 'REGISTRATION_NOT_AVAILABLE') {
      clave.current = nuevaClaveDeIdempotencia();
      return setEstado('no-disponible');
    }
    if (r.codigo === 'INVALID_REQUEST') {
      const deLaApi: Errores = {};
      for (const i of r.issues) {
        if (i.path === 'identity.localIdentifier') deLaApi.correo = MENSAJE_DE_CAMPO[i.code] ?? MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
        if (i.path === 'identity.localCredential') deLaApi.contrasena = MENSAJE_DE_CAMPO[i.code] ?? MENSAJE_DE_CAMPO.CREDENCIAL_DEMASIADO_CORTA;
      }
      setErrores(deLaApi);
      return setEstado('editando');
    }
    if (r.codigo === 'TERMS_VERSION_NOT_ACCEPTABLE' || r.codigo === 'PRIVACY_VERSION_NOT_ACCEPTABLE') return setEstado({ error: COPY.versionDesactualizada });
    if (r.codigo === 'RATE_LIMITED') return setEstado({ error: COPY.demasiadosIntentos });
    return setEstado({ error: COPY.noDisponible });
  }

  if (estado === 'creada') {
    return (
      <>
        <Titulo>Crear cuenta</Titulo>
        <Aviso tipo="exito" titulo={COPY.cuentaCreada}>
          <Boton texto={COPY.iniciarSesion} onPress={irALogin} />
        </Aviso>
      </>
    );
  }

  const cantidad = Object.keys(errores).length;
  return (
    <>
      <Titulo>Crear cuenta</Titulo>
      {cantidad > 0 ? <Aviso tipo="error" titulo={COPY.resumenDeErrores(cantidad)} /> : null}
      {estado === 'no-disponible' ? (
        <Aviso tipo="error" titulo={COPY.registroNoDisponible}>
          <Parrafo>{COPY.registroNoDisponibleAyuda}</Parrafo>
          <Boton texto={COPY.iniciarSesion} tipo="enlace" onPress={irALogin} />
        </Aviso>
      ) : null}
      {estado === 'incierto' ? <Aviso tipo="error" titulo={COPY.resultadoIncierto} /> : null}
      {typeof estado === 'object' ? <Aviso tipo="error" titulo={estado.error} /> : null}

      <Parrafo tenue>Ambiente de prueba: usá un correo inventado (por ejemplo, terminado en @example.invalid) y una contraseña que no uses en otro lado.</Parrafo>

      <Campo
        etiqueta="Correo electrónico"
        value={correo}
        onChangeText={cambiar(setCorreo)}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={errores.correo}
      />
      <Campo
        etiqueta="Contraseña"
        ayuda="Al menos 12 caracteres."
        value={contrasena}
        onChangeText={cambiar(setContrasena)}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errores.contrasena}
      />

      <Text style={[ui.etiqueta, { marginTop: 12 }]} accessibilityRole="header">
        Antes de crear la cuenta
      </Text>
      <Parrafo tenue>Son dos confirmaciones distintas, cada una con su propio texto y su propia versión.</Parrafo>

      <Casilla marcada={a1} onCambio={cambiar(setA1)} titulo={COPY.a1Titulo} texto={COPY.a1Texto} error={errores.a1}>
        <Boton texto="Leer los términos de uso" tipo="enlace" onPress={() => setTexto(VERSION_VIGENTE.TERMINOS)} />
        <Text style={ui.tenue}>versión {VERSION_VIGENTE.TERMINOS.id}</Text>
      </Casilla>
      <Casilla marcada={a2} onCambio={cambiar(setA2)} titulo={COPY.a2Titulo} texto={COPY.a2Texto} error={errores.a2}>
        <Boton texto="Leer la información de privacidad" tipo="enlace" onPress={() => setTexto(VERSION_VIGENTE.PRIVACIDAD_INFO)} />
        <Text style={ui.tenue}>versión {VERSION_VIGENTE.PRIVACIDAD_INFO.id}</Text>
      </Casilla>

      <Parrafo tenue>Crear la cuenta no autoriza el tratamiento de datos de salud. Esa autorización es un paso aparte, que podés dar o no más adelante.</Parrafo>

      <Boton texto={estado === 'enviando' ? 'Creando cuenta…' : estado === 'incierto' ? COPY.reintentar : 'Crear cuenta'} onPress={enviar} ocupado={estado === 'enviando'} />
      <Boton texto="¿Ya tenés cuenta? Iniciar sesión" tipo="enlace" onPress={irALogin} />

      <TextoVersionado version={texto} visible={texto !== null} alCerrar={() => setTexto(null)} />
    </>
  );
}
