/**
 * APK · Cuenta: Vínculos · Estado · Tu identificador BE · Privacidad · Seguridad · Cerrar mi cuenta
 * (docs/paquetes/WP-02.md §5; docs/paquetes/WP-03.md §5).
 * - Estado: solo el estado operativo, nunca «habilitado» (TEST-RF-006).
 * - Tu identificador BE: el que el profesional necesita para solicitar un vínculo (DL-035). Por sí solo no da acceso a
 *   nada; se muestra seleccionable y se comparte con el menú del sistema.
 * - Privacidad: resumen de A3 desde CON-05 (`currentConsent: null` = no otorgado) y el acceso a «Privacidad y
 *   consentimientos», donde A3 ya tiene su CTA de otorgamiento y de revocación (PROTO-10-ACC-03/04 cierran la mitad A3
 *   de DL-024).
 * - Seguridad: cerrar sesión / cerrar todas, separado del cierre de cuenta (10-B02:436-458).
 * - Cierre (PROTO-10-ACC-06): explicación → modal con consecuencias versionadas → «Confirmar cierre».
 */
import {
  COPY,
  COPY_ANTROPOMETRIA,
  COPY_ENTRENAMIENTO,
  COPY_FORMULARIOS,
  COPY_VINCULO,
  VERSION_VIGENTE,
  type MeResponse,
  type RequisitoDeConsentimientoDeSaludResponse,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { api, nuevaClaveDeIdempotencia } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, COLOR, Dato, Insignia, Parrafo, Seccion, Titulo, estilos as ui } from '../ui';

type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error'; sinConexion: boolean };

const ESTADO_OPERATIVO: Record<MeResponse['data']['accountOperationalState'], string> = {
  OPERATIVA: 'Operativa',
  SUSPENDIDA: 'Suspendida',
  CERRADA: 'Cerrada',
};

export function PantallaDeCuenta({ token, salir, ir }: { token: string; salir: (motivo: Salida) => void; ir: (r: Ruta) => void }) {
  const [cuenta, setCuenta] = useState<Carga<MeResponse['data']>>({ tipo: 'cargando' });
  const [a3, setA3] = useState<Carga<RequisitoDeConsentimientoDeSaludResponse['data']>>({ tipo: 'cargando' });
  const [accion, setAccion] = useState<'libre' | 'una' | 'todas' | { error: string }>('libre');

  const sesionPerdida = useSesionPerdida(salir);

  const cargarCuenta = useCallback(async () => {
    setCuenta({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    setCuenta(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  const cargarA3 = useCallback(async () => {
    setA3({ tipo: 'cargando' });
    const r = await api.consultarRequisitoA3(token);
    if (sesionPerdida(r)) return;
    setA3(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargarCuenta();
    void cargarA3();
  }, [cargarCuenta, cargarA3]);

  async function cerrarSesion(que: 'una' | 'todas') {
    if (accion === 'una' || accion === 'todas') return;
    setAccion(que);
    const r = que === 'una' ? await api.finalizarSesion(token) : await api.cerrarTodasLasSesiones(token);
    if (r.ok) return salir(que === 'una' ? 'sesion-cerrada' : 'sesiones-cerradas');
    if (sesionPerdida(r)) return;
    setAccion({ error: r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible });
  }

  const ocupado = accion === 'una' || accion === 'todas';

  return (
    <>
      <Titulo>Cuenta</Titulo>
      <Boton texto="Nutrición: Hoy" onPress={() => ir({ nombre: 'hoy' })} />
      <Boton texto={`Entrenamiento: ${COPY_ENTRENAMIENTO.entrenamientoDeHoy}`} tipo="secundario" onPress={() => ir({ nombre: 'entrenamiento' })} />
      <Boton texto={`Antropometría: ${COPY_ANTROPOMETRIA.miEvolucion}`} tipo="secundario" onPress={() => ir({ nombre: 'mi-evolucion' })} />
      <Boton texto={`Información: ${COPY_FORMULARIOS.pestana}`} tipo="secundario" onPress={() => ir({ nombre: 'mis-solicitudes' })} />
      <Boton texto="Vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />

      <Seccion titulo="Estado de la cuenta">
        {cuenta.tipo === 'cargando' ? <Cargando /> : null}
        {cuenta.tipo === 'error' ? <ErrorConReintento sinConexion={cuenta.sinConexion} onReintentar={cargarCuenta} /> : null}
        {cuenta.tipo === 'listo' ? (
          <>
            <Dato etiqueta="Estado operativo" valor={ESTADO_OPERATIVO[cuenta.datos.accountOperationalState]} />
            <Dato etiqueta="Esta sesión vence" valor={fecha(cuenta.datos.session.expiresAt)} />
          </>
        ) : null}
        <Parrafo tenue>El estado operativo indica si podés usar tu cuenta. No es una habilitación profesional ni una autorización sobre datos.</Parrafo>
      </Seccion>

      <Seccion titulo={COPY_VINCULO.tuIdentificador}>
        {cuenta.tipo === 'cargando' ? <Cargando /> : null}
        {cuenta.tipo === 'error' ? <ErrorConReintento sinConexion={cuenta.sinConexion} onReintentar={cargarCuenta} /> : null}
        {cuenta.tipo === 'listo' ? <TuIdentificador id={cuenta.datos.identityId} /> : null}
      </Seccion>

      <Seccion titulo="Privacidad">
        <Text style={ui.etiqueta}>Tratamiento de datos de salud</Text>
        {a3.tipo === 'cargando' ? <Cargando /> : null}
        {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} sinConexion={a3.sinConexion} onReintentar={cargarA3} /> : null}
        {a3.tipo === 'listo' ? <EstadoA3 datos={a3.datos} /> : null}
        <Boton texto="Privacidad y consentimientos" tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
      </Seccion>

      <Seccion titulo="Seguridad">
        <Parrafo>Cerrar sesión no cierra tu cuenta.</Parrafo>
        {typeof accion === 'object' ? <Aviso tipo="error" titulo={accion.error} /> : null}
        <Boton texto={accion === 'una' ? 'Cerrando sesión…' : COPY.cerrarSesion} tipo="secundario" onPress={() => cerrarSesion('una')} ocupado={accion === 'una'} deshabilitado={ocupado} />
        <Boton texto={accion === 'todas' ? 'Cerrando sesiones…' : COPY.cerrarTodas} tipo="secundario" onPress={() => cerrarSesion('todas')} ocupado={accion === 'todas'} deshabilitado={ocupado} />
      </Seccion>

      <CierreDeCuenta token={token} salir={salir} sesionPerdida={sesionPerdida} />
    </>
  );
}

/** DL-035: el profesional solicita el vínculo con este identificador. Compartirlo es decisión de la persona. */
function TuIdentificador({ id }: { id: string }) {
  async function compartir() {
    try {
      await Share.share({ message: id });
    } catch {
      // Sin menú de compartir disponible: el identificador sigue a la vista y se puede seleccionar y copiar.
    }
  }
  return (
    <>
      <Text selectable style={estilos.identificador} accessibilityLabel={`${COPY_VINCULO.tuIdentificador}: ${id}`}>
        {id}
      </Text>
      <Parrafo tenue>{COPY_VINCULO.ayudaTuIdentificador}</Parrafo>
      <Boton texto="Compartir" tipo="secundario" onPress={() => void compartir()} />
    </>
  );
}

function EstadoA3({ datos }: { datos: RequisitoDeConsentimientoDeSaludResponse['data'] }) {
  const [verTexto, setVerTexto] = useState(false);
  const otorgado = datos.currentConsent?.state === 'ACTIVE';
  return (
    <>
      <Insignia texto={otorgado ? 'Otorgado' : 'No otorgado'} positiva={otorgado} etiqueta="Tratamiento de datos de salud" />
      {!otorgado ? <Parrafo>{COPY.cuentaSinA3}</Parrafo> : null}
      <Boton texto={verTexto ? 'Ocultar el texto' : `Ver el texto (versión ${datos.consentVersion.id})`} tipo="enlace" onPress={() => setVerTexto(!verTexto)} />
      {verTexto
        ? datos.consentVersion.text.split('\n\n').map((p, i) => (
            <Text key={i} style={ui.parrafo}>
              {p}
            </Text>
          ))
        : null}
    </>
  );
}

/**
 * Cierre síncrono (DL-016): la versión de consecuencias mostrada es la que se envía. Resultado incierto: la key se
 * conserva, «Cancelar» deja de ofrecerse y el aviso queda en la sección aunque se cierre el modal; «Reintentar» usa la
 * MISMA key (10-B10:430-438), así el servidor devuelve el resultado original aunque la sesión ya esté revocada.
 */
function CierreDeCuenta({ token, salir, sesionPerdida }: { token: string; salir: (m: Salida) => void; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [estado, setEstado] = useState<'cerrado' | 'abierto' | 'enviando' | 'incierto' | 'step-up' | { error: string }>('cerrado');
  const clave = useRef<string | null>(null);
  const consecuencias = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE;
  const parrafos = consecuencias.texto.split('\n\n').slice(1);

  const [visible, setVisible] = useState(false);
  const incierto = estado === 'incierto';

  function abrir() {
    if (!incierto || !clave.current) clave.current = nuevaClaveDeIdempotencia();
    if (!incierto) setEstado('abierto');
    setVisible(true);
  }

  async function confirmar() {
    if (estado === 'enviando' || !clave.current) return;
    setEstado('enviando');
    const r = await api.solicitarCierre(token, clave.current);
    if (r.ok) return salir('cierre-registrado');
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setEstado('incierto');
    if (r.codigo === 'STEP_UP_REQUIRED') return setEstado('step-up');
    if (sesionPerdida(r)) return;
    const consecuenciasViejas = r.codigo === 'VALIDATION_FAILED' && r.issues.some((i) => i.code === 'CONSEQUENCES_NOT_PRESENTED');
    setEstado({ error: consecuenciasViejas ? COPY.versionDesactualizadaApk : COPY.noDisponible });
  }

  /** Cierra el modal. Si el resultado es incierto, el estado y la key se conservan y el aviso queda en la sección. */
  const cerrar = () => {
    if (estado === 'enviando') return;
    setVisible(false);
    if (!incierto) setEstado('cerrado');
  };

  return (
    <Seccion titulo={COPY.cerrarMiCuenta} peligro>
      <Parrafo>Si cerrás tu cuenta, no vas a poder volver a iniciar sesión con ella. Antes de confirmar vas a ver las consecuencias.</Parrafo>
      {incierto && !visible ? <Aviso tipo="error" titulo={COPY.cierreSinConfirmar} /> : null}
      <Boton texto={incierto ? COPY.reintentar : COPY.cerrarMiCuenta} tipo="peligroSecundario" onPress={abrir} />

      <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={estilos.fondoModal}>
          <ScrollView contentContainerStyle={estilos.dialogo} accessibilityViewIsModal>
            <Text style={ui.tituloDeSeccion} accessibilityRole="header">
              {COPY.cerrarMiCuenta}
            </Text>
            {parrafos.map((p, i) => (
              <Parrafo key={i}>{p}</Parrafo>
            ))}
            <Text style={ui.tenue}>Texto de consecuencias · versión {consecuencias.id}</Text>
            {estado === 'incierto' ? (
              <Aviso tipo="error" titulo={COPY.verificando}>
                <Parrafo>{COPY.resultadoIncierto}</Parrafo>
              </Aviso>
            ) : null}
            {estado === 'step-up' ? (
              <Aviso tipo="error" titulo={COPY.stepUp}>
                <Boton texto="Iniciar sesión de nuevo" onPress={() => salir('reautenticar')} />
              </Aviso>
            ) : null}
            {typeof estado === 'object' ? <Aviso tipo="error" titulo={estado.error} /> : null}
            <Boton texto={incierto ? 'Volver a la cuenta' : COPY.cancelar} tipo="secundario" onPress={cerrar} deshabilitado={estado === 'enviando'} />
            {estado !== 'step-up' ? (
              <Boton
                texto={estado === 'enviando' ? 'Cerrando cuenta…' : estado === 'incierto' ? COPY.reintentar : COPY.confirmarCierre}
                tipo="peligro"
                onPress={confirmar}
                ocupado={estado === 'enviando'}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Seccion>
  );
}

const estilos = StyleSheet.create({
  identificador: {
    fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo', default: undefined }),
    fontSize: 16,
    color: COLOR.texto,
    backgroundColor: COLOR.fondoSuave,
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  fondoModal: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
});
