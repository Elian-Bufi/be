/**
 * APK · «Antes de seguir» (WP-USO-FINAL, UF-01 punto 4 y UF-D4; DEUDA_LEGAJO DL-169; TEST-UF-005): lo que la cuenta tiene
 * que completar antes de usar BE, según API-ACC-07. La raíz (App.tsx) la muestra en lugar de la app mientras la compuerta
 * no deje seguir (`nombre-obligatorio.ts`), sin la barra, sin la campana y sin «Volver».
 * - **Mientras pregunta,** la misma espera que la sesión recuperada («Preparando tu espacio»): nada de la cuenta.
 * - **Falta el nombre:** «¿Cómo te llamás?», la explicación y el campo «Nombre y apellido». Si la identidad tiene perfil
 *   profesional, la API propone ese nombre: viene escrito, con su ayuda, y la persona lo confirma o lo corrige. Guardar lee
 *   el perfil propio y lo cambia con su versión (API-ACC-06); si cambió en otro lugar, lo vuelve a leer y lo dice; si el
 *   nombre no sirve, lo dice el campo. Guardado, la raíz vuelve a preguntar qué falta, y con nada, entra.
 * - **La versión nueva de los términos o de la privacidad** (UF-05): el texto completo de cada una, con su versión y su
 *   fecha, y un botón que los acepta (API-ACC-08) con la versión que se mostró. Si la API dice que ya no es la vigente, pide
 *   actualizar la app. Quien no quiere aceptarlos puede cerrar sesión o cerrar su cuenta, ahí mismo.
 * - **Un paso que esta versión no conoce** (o una versión de un texto que no tiene): pide actualizar la app.
 * - **No se saltea.** El botón Atrás de Android hace lo de una raíz, como en Inicio: deja la app, sin pasar a la pantalla
 *   de abajo, y al volver el paso sigue ahí. «Cerrar sesión» está siempre, como en Sesión y este teléfono.
 * Nada queda plegado: lo que hace falta para decidir está a la vista (GUIA-UX-UI III.7). Los textos son los del dominio
 * (`COPY_DEL_NOMBRE`), iguales en el website.
 */
import { botonDeAceptar, COPY, COPY_DEL_NOMBRE as N, COPY_TEXTOS_VIGENTES as T, LARGO_MAXIMO_DEL_NOMBRE_VISIBLE, normalizarNombreVisible, type TextoAAceptar, type VersionDeTexto } from '@be/domain';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler } from 'react-native';
import { api } from '../api';
import { useSesionPerdida, type Salida } from '../navegacion';
import { dia } from '../formato';
import { aceptarLosTextos, completarLosTextos, guardarElNombre, revisarElNombre, type AlCompletarLosTextos, type Compuerta, type TextoPendiente } from '../nombre-obligatorio';
import { Aviso, Boton, Campo, Parrafo, Seccion, Titulo } from '../ui';
import { CierreDeCuenta, retirarAvisos } from './cuenta';
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
  /** El nombre quedó guardado o los textos, aceptados: la raíz vuelve a preguntar qué falta (API-ACC-07) y, con nada, entra. */
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
      {compuerta.tipo === 'textos' ? <PasoDeLosTextos pendientes={compuerta.pendientes} token={token} salir={salir} alAceptar={alGuardar} /> : null}
      {compuerta.tipo === 'actualizar' ? <Aviso tipo="info" titulo={N.pasoDesconocidoApk} /> : null}
      <CerrarSesion token={token} identidadId={identidadId} salir={salir} />
      {compuerta.tipo === 'textos' ? (
        <Seccion titulo={T.cerrarCuenta}>
          <CierreDeCuentaDelPaso token={token} identidadId={identidadId} salir={salir} />
        </Seccion>
      ) : null}
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
 * UF-05 (DL-169): los textos que pide la API. Los que esta APK no trae en su catálogo (una versión publicada después de
 * construirla) se leen de API-ACC-09 antes de mostrarlos (UF-T57); si la API no la tiene o devuelve otra, hay que
 * actualizar, y sin red se puede reintentar.
 */
function PasoDeLosTextos({ pendientes, token, salir, alAceptar }: { pendientes: readonly TextoPendiente[]; token: string; salir: (motivo: Salida) => void; alAceptar: () => Promise<void> }) {
  const [completos, setCompletos] = useState<AlCompletarLosTextos | null>(null);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setCompletos(null);
    void completarLosTextos(api, pendientes).then((r) => {
      if (vigente) setCompletos(r);
    });
    return () => {
      vigente = false;
    };
  }, [pendientes, vuelta]);

  if (completos === null) return <Parrafo tenue>{T.trayendo}</Parrafo>;
  if (completos.tipo === 'actualizar') return <Aviso tipo="info" titulo={N.pasoDesconocidoApk} />;
  if (completos.tipo === 'sin-respuesta') {
    return (
      <>
        <Aviso tipo="error" titulo={T.sinTexto} />
        <Boton texto={COPY.reintentar} tipo="secundario" onPress={() => setVuelta((n) => n + 1)} />
      </>
    );
  }
  return <TextosParaAceptar pendientes={completos.pendientes} token={token} salir={salir} alAceptar={alAceptar} />;
}

/**
 * La versión nueva de los términos y de la información de privacidad, cada una con su texto completo, su versión y su
 * fecha. Un botón las acepta, de a una y con la versión que se mostró (API-ACC-08). No se saltea: abajo están «Cerrar
 * sesión» y el cierre de la cuenta.
 */
function TextosParaAceptar({
  pendientes,
  token,
  salir,
  alAceptar,
}: {
  pendientes: readonly { readonly texto: TextoAAceptar; readonly version: VersionDeTexto }[];
  token: string;
  salir: (motivo: Salida) => void;
  alAceptar: () => Promise<void>;
}) {
  const [aviso, setAviso] = useState<{ readonly mensaje: string; readonly actualizar: boolean } | null>(null);
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${N.antesDeSeguir}. ${pendientes.map((p) => T.titulo[p.texto]).join('. ')}`);
  }, [pendientes]);

  async function aceptar() {
    if (aceptando) return;
    setAviso(null);
    setAceptando(true);
    const r = await aceptarLosTextos(api, token, pendientes);
    switch (r.tipo) {
      case 'aceptados':
        await alAceptar();
        break;
      case 'actualizar':
        setAviso({ mensaje: r.mensaje, actualizar: true });
        break;
      case 'aviso':
        setAviso({ mensaje: r.mensaje, actualizar: false });
        break;
      case 'sesion-perdida':
        return salir(r.motivo);
    }
    setAceptando(false);
  }

  return (
    <>
      <Parrafo>{T.explicacion}</Parrafo>
      {pendientes.map((p) => (
        <Seccion key={p.version.id} titulo={T.titulo[p.texto]}>
          <Parrafo tenue>{T.version(p.version.id, dia(p.version.vigenteDesde))}</Parrafo>
          {p.version.texto.split('\n\n').map((parrafo, i) => (
            <Parrafo key={i}>{parrafo}</Parrafo>
          ))}
        </Seccion>
      ))}
      {aviso ? <Aviso tipo={aviso.actualizar ? 'info' : 'error'} titulo={aviso.mensaje} /> : null}
      {aviso?.actualizar ? null : (
        <Boton texto={aceptando ? T.aceptando : botonDeAceptar(pendientes.map((p) => p.texto))} onPress={() => void aceptar()} ocupado={aceptando} />
      )}
    </>
  );
}

/** El cierre de la cuenta de Cuenta, para quien no quiere aceptar la versión nueva (UF-05). */
function CierreDeCuentaDelPaso({ token, identidadId, salir }: { token: string; identidadId: string; salir: (motivo: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  return <CierreDeCuenta token={token} identidadId={identidadId} salir={salir} sesionPerdida={sesionPerdida} />;
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
