/**
 * APK · Cuenta: Estado · Privacidad · Seguridad · Cerrar mi cuenta (docs/paquetes/WP-02.md §5).
 * - Estado: solo el estado operativo, nunca «habilitado» (TEST-RF-006).
 * - Privacidad: A3 desde CON-05; `currentConsent: null` = no otorgado; sin CTA de otorgamiento (DL-024).
 * - Seguridad: cerrar sesión / cerrar todas, separado del cierre de cuenta (10-B02:436-458).
 * - Cierre (PROTO-10-ACC-06): explicación → modal con consecuencias versionadas → «Confirmar cierre».
 */
import {
  CODIGOS_DE_SESION_NO_VALIDA,
  COPY,
  VERSION_VIGENTE,
  type MeResponse,
  type RequisitoDeConsentimientoDeSaludResponse,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, nuevaClaveDeIdempotencia } from '../api';
import { Aviso, Boton, COLOR, Parrafo, Seccion, Titulo, estilos as ui } from '../ui';

type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error'; sinConexion: boolean };

const ESTADO_OPERATIVO: Record<MeResponse['data']['accountOperationalState'], string> = {
  OPERATIVA: 'Operativa',
  SUSPENDIDA: 'Suspendida',
  CERRADA: 'Cerrada',
};

const fecha = (iso: string) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export type Salida = 'sesion-cerrada' | 'sesiones-cerradas' | 'sesion-no-valida' | 'reautenticar' | 'cierre-registrado';

export function PantallaDeCuenta({ token, salir }: { token: string; salir: (motivo: Salida) => void }) {
  const [cuenta, setCuenta] = useState<Carga<MeResponse['data']>>({ tipo: 'cargando' });
  const [a3, setA3] = useState<Carga<RequisitoDeConsentimientoDeSaludResponse['data']>>({ tipo: 'cargando' });
  const [accion, setAccion] = useState<'libre' | 'una' | 'todas' | { error: string }>('libre');

  const sesionPerdida = useCallback(
    (r: Resultado<unknown>) => {
      if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
        salir('sesion-no-valida');
        return true;
      }
      return false;
    },
    [salir],
  );

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

      <Seccion titulo="Estado de la cuenta">
        {cuenta.tipo === 'cargando' ? <Parrafo tenue>Cargando…</Parrafo> : null}
        {cuenta.tipo === 'error' ? <ErrorConReintento sinConexion={cuenta.sinConexion} onReintentar={cargarCuenta} /> : null}
        {cuenta.tipo === 'listo' ? (
          <>
            <Dato etiqueta="Estado operativo" valor={ESTADO_OPERATIVO[cuenta.datos.accountOperationalState]} />
            <Dato etiqueta="Esta sesión vence" valor={fecha(cuenta.datos.session.expiresAt)} />
          </>
        ) : null}
        <Parrafo tenue>El estado operativo indica si podés usar tu cuenta. No es una habilitación profesional ni una autorización sobre datos.</Parrafo>
      </Seccion>

      <Seccion titulo="Privacidad">
        <Text style={ui.etiqueta}>Tratamiento de datos de salud</Text>
        {a3.tipo === 'cargando' ? <Parrafo tenue>Cargando…</Parrafo> : null}
        {a3.tipo === 'error' ? <ErrorConReintento mensaje={COPY.errorA3} sinConexion={a3.sinConexion} onReintentar={cargarA3} /> : null}
        {a3.tipo === 'listo' ? <EstadoA3 datos={a3.datos} /> : null}
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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Text style={ui.negrita}>{etiqueta}</Text>
      <Text style={ui.parrafo}>{valor}</Text>
    </View>
  );
}

function EstadoA3({ datos }: { datos: RequisitoDeConsentimientoDeSaludResponse['data'] }) {
  const [verTexto, setVerTexto] = useState(false);
  const otorgado = datos.currentConsent?.state === 'ACTIVE';
  return (
    <>
      <View style={[estilos.insignia, otorgado ? estilos.insigniaSi : null]} accessible accessibilityLabel={`Tratamiento de datos de salud: ${otorgado ? 'otorgado' : 'no otorgado'}`}>
        <Text style={[estilos.textoInsignia, otorgado ? { color: COLOR.exito } : null]}>{otorgado ? 'Otorgado' : 'No otorgado'}</Text>
      </View>
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

function ErrorConReintento({ mensaje = COPY.errorDeVista, sinConexion, onReintentar }: { mensaje?: string; sinConexion: boolean; onReintentar: () => void }) {
  // 10-B10:68-82: offline en el APK = «Sin conexión / Reintentar».
  return (
    <Aviso tipo="error" titulo={sinConexion ? 'Sin conexión' : mensaje}>
      <Boton texto={COPY.reintentar} tipo="secundario" onPress={onReintentar} />
    </Aviso>
  );
}

/** Cierre síncrono (DL-016): la versión de consecuencias mostrada es la que se envía; reintentos con la misma key. */
function CierreDeCuenta({ token, salir, sesionPerdida }: { token: string; salir: (m: Salida) => void; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [estado, setEstado] = useState<'cerrado' | 'abierto' | 'enviando' | 'incierto' | 'step-up' | { error: string }>('cerrado');
  const clave = useRef<string | null>(null);
  const consecuencias = VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE;
  const parrafos = consecuencias.texto.split('\n\n').slice(1);

  function abrir() {
    clave.current = nuevaClaveDeIdempotencia();
    setEstado('abierto');
  }

  async function confirmar() {
    if (estado === 'enviando' || !clave.current) return;
    setEstado('enviando');
    const r = await api.solicitarCierre(token, clave.current);
    if (r.ok) return salir('cierre-registrado');
    if (r.tipo === 'RED') return setEstado('incierto');
    if (r.codigo === 'STEP_UP_REQUIRED') return setEstado('step-up');
    if (sesionPerdida(r)) return;
    setEstado({ error: r.codigo === 'VALIDATION_FAILED' ? COPY.versionDesactualizada : COPY.noDisponible });
  }

  const cerrar = () => {
    if (estado !== 'enviando') setEstado('cerrado');
  };

  return (
    <Seccion titulo={COPY.cerrarMiCuenta} peligro>
      <Parrafo>Si cerrás tu cuenta, no vas a poder volver a iniciar sesión con ella. Antes de confirmar vas a ver las consecuencias.</Parrafo>
      <Boton texto={COPY.cerrarMiCuenta} tipo="peligroSecundario" onPress={abrir} />

      <Modal visible={estado !== 'cerrado'} transparent animationType="fade" onRequestClose={cerrar}>
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
            <Boton texto={COPY.cancelar} tipo="secundario" onPress={cerrar} deshabilitado={estado === 'enviando'} />
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
  dato: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 4 },
  insignia: { alignSelf: 'flex-start', borderWidth: 2, borderColor: COLOR.tenue, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginVertical: 6 },
  insigniaSi: { borderColor: COLOR.exito },
  textoInsignia: { fontWeight: '700', color: COLOR.tenue, fontSize: 15 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
});
