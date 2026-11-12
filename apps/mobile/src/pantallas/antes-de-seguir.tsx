/**
 * APK · «Antes de seguir» (WP-USO-FINAL, UF-01 punto 4 y UF-D4; DEUDA_LEGAJO DL-169; TEST-UF-005): lo que la cuenta tiene
 * que completar antes de usar BE, según API-ACC-07. La raíz (App.tsx) la muestra en lugar de la app mientras la compuerta
 * no deje seguir (`nombre-obligatorio.ts`), sin la barra, sin la campana y sin «Volver».
 * - **Mientras pregunta,** la misma espera que la sesión recuperada («Preparando tu espacio»): nada de la cuenta.
 * - **Falta el nombre:** «¿Cómo te llamás?», la explicación y el campo «Nombre y apellido». Si la identidad tiene perfil
 *   profesional, la API propone ese nombre: viene escrito, con su ayuda, y la persona lo confirma o lo corrige. Guardar lee
 *   el perfil propio y lo cambia con su versión (API-ACC-06); si cambió en otro lugar, lo vuelve a leer y lo dice; si el
 *   nombre no sirve, lo dice el campo. Guardado, la raíz vuelve a preguntar qué falta, y con nada, entra.
 * - **Un paso que esta versión no conoce** (o una respuesta que no reconoce): pide actualizar la app.
 * - **No se saltea.** El botón Atrás de Android hace lo de una raíz, como en Inicio: deja la app, sin pasar a la pantalla
 *   de abajo, y al volver el paso sigue ahí. «Cerrar sesión» está siempre, como en Sesión y este teléfono.
 * Nada queda plegado: lo que hace falta para decidir está a la vista (GUIA-UX-UI III.7). Los textos son los del dominio
 * (`COPY_DEL_NOMBRE`), iguales en el website.
 */
import { COPY, COPY_DEL_NOMBRE as N, LARGO_MAXIMO_DEL_NOMBRE_VISIBLE, normalizarNombreVisible } from '@be/domain';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler } from 'react-native';
import { api } from '../api';
import { useSesionPerdida, type Salida } from '../navegacion';
import { guardarElNombre, revisarElNombre, type Compuerta } from '../nombre-obligatorio';
import { Aviso, Boton, Campo, Parrafo, Seccion, Titulo } from '../ui';
import { retirarAvisos } from './cuenta';
import { PantallaDeRecuperacion } from './recuperacion';

const NADA = () => undefined;

export function PantallaAntesDeSeguir({
  compuerta,
  token,
  identidadId,
  salir,
  alGuardar,
}: {
  compuerta: Compuerta;
  token: string;
  identidadId: string;
  salir: (motivo: Salida) => void;
  /** El nombre quedó guardado: la raíz vuelve a preguntar qué falta (API-ACC-07) y, con nada, entra. */
  alGuardar: () => Promise<void>;
}) {
  // No se saltea: Atrás hace lo de una raíz (deja la app) y no llega al de App.tsx, que llevaría a la pantalla de abajo.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => suscripcion.remove();
  }, []);

  if (compuerta.tipo === 'preguntando') return <PantallaDeRecuperacion fase={{ tipo: 'comprobando' }} reintentar={NADA} iniciarDeNuevo={NADA} />;
  return (
    <>
      <Titulo>{N.antesDeSeguir}</Titulo>
      {compuerta.tipo === 'nombre' ? <PasoDelNombre propuesta={compuerta.propuesta} token={token} salir={salir} alGuardar={alGuardar} /> : null}
      {compuerta.tipo === 'actualizar' ? <Aviso tipo="info" titulo={N.pasoDesconocidoApk} /> : null}
      <CerrarSesion token={token} identidadId={identidadId} salir={salir} />
    </>
  );
}

/** «¿Cómo te llamás?»: el nombre que falta, con la propuesta de la API si la hay. */
function PasoDelNombre({ propuesta, token, salir, alGuardar }: { propuesta: string | null; token: string; salir: (motivo: Salida) => void; alGuardar: () => Promise<void> }) {
  const [texto, setTexto] = useState(propuesta ?? '');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // El lector de pantalla dice dónde está la persona al llegar, y el error del campo cuando aparece (el campo lo lleva en
  // su nombre, como en Crear cuenta).
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${N.antesDeSeguir}. ${N.pregunta}`);
  }, []);
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  async function guardar() {
    if (guardando) return;
    setAviso(null);
    const revisado = revisarElNombre(texto);
    if (!revisado.ok) return setError(revisado.mensaje);
    setError(null);
    setGuardando(true);
    const r = await guardarElNombre(api, token, texto);
    switch (r.tipo) {
      case 'guardado':
        await alGuardar();
        break;
      case 'campo':
        setError(r.mensaje);
        break;
      case 'cambio-en-otro-lugar':
        if (r.nombre) setTexto(r.nombre);
        setAviso(r.mensaje);
        break;
      case 'aviso':
        setAviso(r.mensaje);
        break;
      case 'sesion-perdida':
        return salir(r.motivo);
    }
    setGuardando(false);
  }

  return (
    <Seccion titulo={N.pregunta}>
      <Parrafo>{N.explicacion}</Parrafo>
      {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
      <Campo
        etiqueta={N.etiqueta}
        ayuda={propuesta ? N.ayudaConElNombreProfesional : N.ayuda}
        value={texto}
        onChangeText={setTexto}
        onBlur={() => setTexto((t) => normalizarNombreVisible(t))}
        maxLength={LARGO_MAXIMO_DEL_NOMBRE_VISIBLE + 20}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={() => void guardar()}
        error={error}
      />
      <Boton texto={guardando ? N.guardando : N.guardarYSeguir} onPress={() => void guardar()} ocupado={guardando} />
    </Seccion>
  );
}

/**
 * «Cerrar sesión», siempre a mano: lo mismo que en Sesión y este teléfono. Antes de cerrar, este teléfono deja de recibir
 * los avisos de la cuenta (DL-133); sin respuesta de la API, se dice y se puede volver a intentar.
 */
function CerrarSesion({ token, identidadId, salir }: { token: string; identidadId: string; salir: (motivo: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [saliendo, setSaliendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function cerrar() {
    if (saliendo) return;
    setSaliendo(true);
    setAviso(null);
    await retirarAvisos(token, identidadId);
    const r = await api.finalizarSesion(token);
    if (r.ok) return salir('sesion-cerrada');
    if (sesionPerdida(r)) return;
    setSaliendo(false);
    setAviso(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
  }

  return (
    <>
      {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
      <Boton texto={saliendo ? 'Cerrando sesión…' : N.salir} tipo="secundario" onPress={() => void cerrar()} ocupado={saliendo} />
    </>
  );
}
