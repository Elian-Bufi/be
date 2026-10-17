/**
 * APK · «Continuar con Google» en Iniciar sesión y en Crear cuenta (WP-ACCESO-GOOGLE; DEUDA_LEGAJO DL-138, RF-003,
 * UC-E05). Sin el client ID en el build no se muestra nada y la pantalla queda como siempre. Los mismos pasos que el
 * website, con la misma regla del dominio (`pasoDeAccesoConGoogle`):
 * - **Entrar** (API-GOO-01): la persona elige su cuenta de Google y la API abre la sesión, que se guarda como la del login.
 * - **Vincular** (API-GOO-02): si ya hay una cuenta BE con ese correo y contraseña, Google se le suma solo después de que la
 *   persona confirma esa contraseña. Nunca se vincula sola (UC-E05 E02).
 * - **Crear** (API-GOO-03): si no hay cuenta, el alta con las mismas tres casillas que el alta con correo. Registra un
 *   asesorado, como el alta con correo (DL-024).
 * Mientras dura un paso, el correo y la contraseña quedan detrás de «Volver»: el acceso local sigue siempre (UC-E05 E01).
 */
import { COPY, COPY_ACCESO_GOOGLE as C, pasoDeAccesoConGoogle, type PasoDeAccesoConGoogle } from '@be/domain';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ActosDelAlta, erroresDeLosActos, NINGUN_ACTO_MARCADO, type ActosMarcados, type ErroresDeLosActos } from '../actos-del-alta';
import { api } from '../api';
import { CLIENT_ID_WEB_DE_GOOGLE, elegirCuentaDeGoogle } from '../google';
import { Aviso, Boton, Campo, COLOR, Parrafo, Subtitulo, estilos as ui, estilosPorTema } from '../ui';

/** La misma firma que el login: la sesión de BE y la hora del servidor de la respuesta (DL-012). */
export type AlIniciar = (token: string, expiresAt: string, identidadId: string, fechaDelServidor: string | null) => void;

type Estado =
  | { readonly tipo: 'inicio'; readonly aviso: string | null }
  | { readonly tipo: 'eligiendo' }
  | { readonly tipo: 'verificando' }
  | { readonly tipo: 'vincular'; readonly idToken: string; readonly correo: string }
  | { readonly tipo: 'crear'; readonly idToken: string; readonly correo: string };

type Seguir = (paso: PasoDeAccesoConGoogle, idToken: string) => void;

/**
 * `subir` lleva la pantalla al principio, donde están el paso nuevo y los avisos: el botón que se toca puede quedar al
 * final de un formulario largo.
 */
export function AccesoConGoogle({ alIniciar, subir, children }: { alIniciar: AlIniciar; subir: () => void; children: ReactNode }) {
  if (!CLIENT_ID_WEB_DE_GOOGLE) return <>{children}</>;
  return (
    <ConGoogle alIniciar={alIniciar} subir={subir}>
      {children}
    </ConGoogle>
  );
}

function ConGoogle({ alIniciar, subir, children }: { alIniciar: AlIniciar; subir: () => void; children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio', aviso: null });

  const seguir: Seguir = (paso, idToken) => {
    switch (paso.tipo) {
      case 'SESION': {
        const { session, actor } = paso.sesion.data;
        return alIniciar(session.accessToken, session.expiresAt, actor.identityId, paso.fechaDelServidor);
      }
      case 'VINCULAR':
        subir();
        return setEstado({ tipo: 'vincular', idToken, correo: paso.correo });
      case 'CREAR':
        subir();
        return setEstado({ tipo: 'crear', idToken, correo: paso.correo });
      case 'AVISO':
      case 'CAMPO':
        // Un aviso al entrar, o uno que invalida lo que dio Google: de vuelta al principio, con el correo y la contraseña.
        subir();
        return setEstado({ tipo: 'inicio', aviso: paso.mensaje });
    }
  };

  // Un doble toque no abre dos veces la elección de cuenta: el estado recién cambia en el próximo dibujo.
  const enCurso = useRef(false);
  async function continuar() {
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      setEstado({ tipo: 'eligiendo' });
      const cuenta = await elegirCuentaDeGoogle();
      if (cuenta.tipo === 'NO_DISPONIBLE') return setEstado({ tipo: 'inicio', aviso: C.noDisponible });
      if (cuenta.tipo !== 'ID_TOKEN') return setEstado({ tipo: 'inicio', aviso: null });
      setEstado({ tipo: 'verificando' });
      seguir(pasoDeAccesoConGoogle('ENTRAR', await api.iniciarSesionConGoogle(cuenta.idToken), 'APK'), cuenta.idToken);
    } finally {
      enCurso.current = false;
    }
  }

  const volver = () => setEstado({ tipo: 'inicio', aviso: null });

  if (estado.tipo === 'vincular') return <PasoDeVincular key={estado.idToken} idToken={estado.idToken} correo={estado.correo} seguir={seguir} volver={volver} subir={subir} />;
  if (estado.tipo === 'crear') return <PasoDeCrear key={estado.idToken} idToken={estado.idToken} correo={estado.correo} seguir={seguir} volver={volver} subir={subir} />;

  const ocupado = estado.tipo === 'eligiendo' || estado.tipo === 'verificando';
  return (
    <>
      {estado.tipo === 'inicio' && estado.aviso ? <Aviso tipo="error" titulo={estado.aviso} /> : null}
      <BotonDeGoogle texto={estado.tipo === 'verificando' ? C.verificando : C.continuarConGoogle} ocupado={ocupado} onPress={() => void continuar()} />
      <View style={estilos.separador} accessible accessibilityLabel={C.separador}>
        <View style={estilos.raya} />
        <Text style={ui.tenue}>{C.separador}</Text>
        <View style={estilos.raya} />
      </View>
      {children}
    </>
  );
}

/** El botón, con la «G» de Google en sus colores (las pautas de Google) y el texto en el del tema. */
function BotonDeGoogle({ texto, ocupado, onPress }: { texto: string; ocupado: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: ocupado, busy: ocupado }}
      disabled={ocupado}
      onPress={onPress}
      style={({ pressed }) => [ui.boton, ui.boton_secundario, estilos.botonDeGoogle, ocupado && ui.deshabilitado, pressed && ui.presionado]}
    >
      <Svg width={20} height={20} viewBox="0 0 48 48" accessible={false}>
        <Path fill={COLOR.googleRojo} d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <Path fill={COLOR.googleAzul} d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <Path fill={COLOR.googleAmarillo} d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <Path fill={COLOR.googleVerde} d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
      <Text style={[ui.textoBoton, estilos.textoDeGoogle]}>{texto}</Text>
    </Pressable>
  );
}

/** Anuncia el título del paso al abrirlo: el lector de pantalla dice dónde está la persona. */
function useAnuncio(titulo: string) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(titulo);
  }, [titulo]);
}

/** GOOGLE_LINK_REQUIRED: confirmar la contraseña de la cuenta BE de ese correo (API-GOO-02). */
function PasoDeVincular({ idToken, correo, seguir, volver, subir }: { idToken: string; correo: string; seguir: Seguir; volver: () => void; subir: () => void }) {
  useAnuncio(C.vincularTitulo);
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (enviando) return;
    setAviso(null);
    if (!contrasena) return setError(C.contrasenaRequerida);
    setError(null);
    setEnviando(true);
    const paso = pasoDeAccesoConGoogle('VINCULAR', await api.vincularGoogle(idToken, contrasena), 'APK');
    setEnviando(false);
    if (paso.tipo === 'CAMPO') return setError(paso.mensaje);
    if (paso.tipo === 'AVISO' && !paso.reiniciar) {
      subir();
      return setAviso(paso.mensaje);
    }
    if (paso.tipo === 'SESION') setContrasena('');
    seguir(paso, idToken);
  }

  return (
    <>
      <Subtitulo>{C.vincularTitulo}</Subtitulo>
      {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
      <Parrafo>{C.vincularTexto(correo)}</Parrafo>
      <Campo
        etiqueta={C.contrasena}
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        error={error}
      />
      <Boton texto={enviando ? C.vinculando : C.vincular} onPress={() => void enviar()} ocupado={enviando} />
      <Boton texto={C.volver} tipo="secundario" onPress={volver} deshabilitado={enviando} />
    </>
  );
}

/** GOOGLE_ACCOUNT_NOT_FOUND: crear la cuenta con Google, con A1, A2 y la declaración de mayoría de edad (API-GOO-03). */
function PasoDeCrear({ idToken, correo, seguir, volver, subir }: { idToken: string; correo: string; seguir: Seguir; volver: () => void; subir: () => void }) {
  useAnuncio(C.crearTitulo);
  const [marcados, setMarcados] = useState<ActosMarcados>(NINGUN_ACTO_MARCADO);
  const [errores, setErrores] = useState<ErroresDeLosActos>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (enviando) return;
    setAviso(null);
    const encontrados = erroresDeLosActos(marcados);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return subir();
    setEnviando(true);
    const paso = pasoDeAccesoConGoogle('CREAR', await api.registrarConGoogle(idToken, marcados.mayoria), 'APK');
    setEnviando(false);
    if (paso.tipo === 'CAMPO') {
      setErrores({ mayoria: paso.mensaje });
      return subir();
    }
    if (paso.tipo === 'AVISO' && !paso.reiniciar) {
      setAviso(paso.mensaje);
      return subir();
    }
    seguir(paso, idToken);
  }

  const cantidad = Object.keys(errores).length;
  return (
    <>
      <Subtitulo>{C.crearTitulo}</Subtitulo>
      {cantidad > 0 ? <Aviso tipo="error" titulo={COPY.resumenDeErrores(cantidad)} /> : null}
      {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
      <Parrafo>{C.crearTexto(correo)}</Parrafo>
      <Parrafo tenue>{C.avisoDePrueba}</Parrafo>
      <ActosDelAlta marcados={marcados} errores={errores} alCambiar={(acto, valor) => setMarcados((m) => ({ ...m, [acto]: valor }))} />
      <Boton texto={enviando ? C.creando : C.crear} onPress={() => void enviar()} ocupado={enviando} />
      <Boton texto={C.volver} tipo="secundario" onPress={volver} deshabilitado={enviando} />
    </>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  botonDeGoogle: { flexDirection: 'row', gap: 12 },
  textoDeGoogle: { color: COLOR.texto },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  raya: { flex: 1, height: 1, backgroundColor: COLOR.borde },
}));
