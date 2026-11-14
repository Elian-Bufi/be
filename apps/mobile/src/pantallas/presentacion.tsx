/**
 * APK · La primera vez: BE se presenta y promete (PG-13 de WP-PULIDO-GRANDES, DL-173, con PG-D8). La raíz (App.tsx) la
 * muestra después de «Antes de seguir», una sola vez por teléfono y por cuenta, en lugar de la app y sin la barra ni la
 * campana. Las reglas están en `presentacion.ts`, con su prueba (TEST-PG-012).
 *
 * - **Tres tarjetas cortas, sin cuestionario.** «Saltar» en todas, arriba; «Siguiente» y «Anterior» abajo; con el dedo,
 *   de costado. TalkBack lee «Tarjeta 1 de 3» con el título, y lo anuncia al pasar de una a otra. Con «reducir
 *   movimiento», cambian sin fundido.
 * - **Los avisos, solo en la tercera,** diciendo cuáles llegan, con «Activar avisos» y «Ahora no» del mismo peso: ninguna
 *   de las dos empuja. Activarlos pide el permiso de Android en ese momento y hace lo mismo que en Cuenta; la respuesta se
 *   dice con las palabras de Cuenta, y «Entrar a BE» sigue. Con «Ahora no» no se piden.
 * - **Atrás** vuelve a la tarjeta anterior; en la primera deja la app, como una raíz: no pasa a la pantalla de abajo.
 * - Al terminar (saltar, «Ahora no» o entrar), lo visto se guarda en el teléfono y la raíz muestra la app.
 */
import { COPY_NOVEDADES } from '@be/domain';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { AccessibilityInfo, Animated, BackHandler, PanResponder, Text, View } from 'react-native';
import { api } from '../api';
import { activar } from '../avisos';
import { dependenciasDeAvisos } from '../avisos-del-telefono';
import { useMovimientoReducido } from '../movimiento-reducido';
import {
  activarDesdeLaPresentacion,
  CUANTAS_TARJETAS,
  PRESENTACION_AL_EMPEZAR,
  presentacionTras,
  respuestaDeLosAvisos,
  sePuedenPedirLosAvisos,
  TARJETA_DE_LOS_AVISOS,
  TARJETAS_DE_LA_PRESENTACION as TARJETAS,
  TEXTOS_DE_LA_PRESENTACION as T,
} from '../presentacion';
import { registroDeLaPresentacion } from '../presentacion-en-el-telefono';
import { Aviso, Boton, estilosPorTema, Parrafo, Superficie } from '../ui';

/** Lo que tarda en entrar una tarjeta, sin «reducir movimiento». */
const FUNDIDO_DE_LA_TARJETA_MS = 180;

export function PantallaDePresentacion({ token, identidadId }: { token: string; identidadId: string }) {
  const [paso, despachar] = useReducer(presentacionTras, PRESENTACION_AL_EMPEZAR);
  const movimientoReducido = useMovimientoReducido();
  const entrada = useRef(new Animated.Value(1)).current;
  const indice = useRef(paso.indice);
  indice.current = paso.indice;

  // Atrás: la tarjeta anterior; en la primera, deja la app, como una raíz (no pasa a la pantalla de abajo).
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (indice.current > 0) despachar({ tipo: 'anterior' });
      else BackHandler.exitApp();
      return true;
    });
    return () => suscripcion.remove();
  }, []);

  // Terminada: lo visto se guarda en el teléfono y la raíz, que mira el registro, muestra la app.
  useEffect(() => {
    if (paso.terminada) void registroDeLaPresentacion.marcarVista(identidadId);
  }, [paso.terminada, identidadId]);

  // Al pasar de tarjeta: TalkBack dice cuál es y la tarjeta entra con un fundido corto (sin él, con «reducir movimiento»).
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    AccessibilityInfo.announceForAccessibility(`${T.tarjeta(paso.indice + 1, CUANTAS_TARJETAS)}. ${TARJETAS[paso.indice].titulo}`);
    if (movimientoReducido) return;
    entrada.setValue(0);
    Animated.timing(entrada, { toValue: 1, duration: FUNDIDO_DE_LA_TARJETA_MS, useNativeDriver: true }).start();
  }, [paso.indice, movimientoReducido, entrada]);

  // El dedo de costado pasa de tarjeta; los toques siguen yendo a los botones.
  const gesto = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evento, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_evento, g) => despachar({ tipo: 'gesto', dx: g.dx, dy: g.dy }),
        onPanResponderTerminationRequest: () => true,
      }),
    [],
  );

  /** «Activar avisos»: solo en la tercera y una sola vez (`sePuedenPedirLosAvisos`); lo mismo que en Cuenta. */
  async function pedirLosAvisos() {
    if (!sePuedenPedirLosAvisos(paso)) return;
    despachar({ tipo: 'pedir-avisos' });
    const sesion = { token, identidadId };
    const estado = await activarDesdeLaPresentacion({
      activar: () => activar(dependenciasDeAvisos, sesion),
      primeraVez: async () => {
        const r = await api.consultarPreferenciasDeAvisos(token);
        return r.ok ? r.datos.data.updatedAt === null : null;
      },
      encenderLosRecordatorios: async () => {
        await api.reemplazarPreferenciasDeAvisos(token, { mealLogReminder: true, trainingLogReminder: true });
      },
    });
    despachar({ tipo: 'avisos-respondidos', estado });
  }

  const tarjeta = TARJETAS[paso.indice];
  const enLosAvisos = paso.indice === TARJETA_DE_LOS_AVISOS;
  const pidiendo = paso.avisos.tipo === 'pidiendo';
  const cual = T.tarjeta(paso.indice + 1, CUANTAS_TARJETAS);
  return (
    <View {...gesto.panHandlers}>
      <View style={estilos.arriba}>
        {/* Lo que dice el lector va con el título de la tarjeta: acá, una sola vez y solo a la vista. */}
        <Text style={estilos.cual} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {cual}
        </Text>
        <Boton texto={T.saltar} tipo="enlace" etiqueta={T.saltarParaLeer} deshabilitado={pidiendo} onPress={() => despachar({ tipo: 'saltar' })} />
      </View>
      <Animated.View style={{ opacity: entrada }}>
        <Superficie style={estilos.tarjeta}>
          <Text style={estilos.titulo} accessibilityRole="header" accessibilityLabel={`${cual}. ${tarjeta.titulo}`}>
            {tarjeta.titulo}
          </Text>
          <Parrafo>{tarjeta.texto}</Parrafo>
          {enLosAvisos ? (
            <View style={estilos.avisos}>
              <Text style={estilos.subtitulo} accessibilityRole="header">
                {T.avisosTitulo}
              </Text>
              <Parrafo tenue>{T.avisosQueLlegan}</Parrafo>
              <Parrafo tenue>{T.avisosRecordatorios}</Parrafo>
              {paso.avisos.tipo === 'respondidos' ? (
                <>
                  <Aviso
                    tipo="info"
                    titulo={respuestaDeLosAvisos(paso.avisos.estado, { activos: COPY_NOVEDADES.avisosActivos, sinPermiso: COPY_NOVEDADES.avisosSinPermiso, noDisponibles: COPY_NOVEDADES.avisosNoDisponibles })}
                  />
                  <Boton texto={T.entrar} onPress={() => despachar({ tipo: 'entrar' })} />
                </>
              ) : (
                <>
                  {/* Las dos respuestas, del mismo peso: ninguna empuja (PG-D8). */}
                  <Boton texto={pidiendo ? T.activando : T.activarAvisos} tipo="secundario" icono="novedades" ocupado={pidiendo} onPress={() => void pedirLosAvisos()} />
                  <Boton texto={T.ahoraNo} tipo="secundario" deshabilitado={pidiendo} onPress={() => despachar({ tipo: 'ahora-no' })} />
                  <Parrafo tenue>{T.avisosDespues}</Parrafo>
                </>
              )}
            </View>
          ) : null}
        </Superficie>
      </Animated.View>
      {/* Dónde está, a la vista: el número arriba y estos puntos, que también cambian de forma (no solo de color). */}
      <View style={estilos.puntos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {TARJETAS.map((t, i) => (
          <View key={t.titulo} style={[estilos.punto, i === paso.indice ? estilos.puntoActual : null]} />
        ))}
      </View>
      <View style={estilos.abajo}>
        {!enLosAvisos ? <Boton texto={T.siguiente} icono="derecha" iconoAlFinal onPress={() => despachar({ tipo: 'siguiente' })} /> : null}
        {paso.indice > 0 ? <Boton texto={T.anterior} tipo="enlace" icono="izquierda" deshabilitado={pidiendo} onPress={() => despachar({ tipo: 'anterior' })} /> : null}
      </View>
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  arriba: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  cual: { fontSize: 14, fontWeight: '600', color: COLOR.tenue },
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 20, padding: 20, marginVertical: 8 },
  titulo: { fontSize: 24, lineHeight: 31, fontWeight: '800', color: COLOR.texto, marginBottom: 10 },
  subtitulo: { fontSize: 18, fontWeight: '700', color: COLOR.texto, marginTop: 8, marginBottom: 4 },
  avisos: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 12, paddingTop: 12, gap: 8 },
  puntos: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 12 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.bordeControl },
  puntoActual: { width: 24, backgroundColor: COLOR.acento },
  abajo: { gap: 8 },
}));
