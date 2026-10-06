/**
 * Estados de carga compartidos (10-B10:343-378): «Cargando…» sin datos ficticios, error con «Reintentar» (offline en el
 * APK = «Sin conexión», 10-B10:68-82) y «Ver más» para las listas por cursor.
 */
import { COPY } from '@be/domain';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import type { EstadoDeLista } from './lista';
import { Aviso, Boton, Parrafo, estilosPorTema } from './ui';

/**
 * Lo que se ve mientras una pantalla espera a la API. Con `forma`, la pantalla conserva su estructura (bloques del alto
 * de lo que viene) y no muestra ningún valor hasta que la API confirma el acceso (etapa A, 2026-10-03). El lector de
 * pantalla oye «Cargando». Los bloques no se animan: el movimiento lo da la línea del encabezado, que respeta «reducir
 * movimiento».
 */
export function Cargando({ forma }: { forma?: 'lista' | 'figura' } = {}) {
  if (!forma) return <Parrafo tenue>Cargando…</Parrafo>;
  const altos = forma === 'figura' ? [22, 56, 440, 56, 72] : [72, 72, 72];
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Cargando" accessibilityLiveRegion="polite">
      {altos.map((alto, i) => (
        <View key={i} style={[estilosDeCarga.bloque, { height: alto }, i === 0 && forma === 'figura' ? estilosDeCarga.renglon : null]} />
      ))}
    </View>
  );
}

const estilosDeCarga = estilosPorTema((COLOR) => ({
  bloque: { borderRadius: 12, marginVertical: 6, backgroundColor: COLOR.superficie, borderWidth: 1, borderColor: COLOR.borde },
  renglon: { width: '60%', borderRadius: 6 },
}));

export function ErrorConReintento({ mensaje = COPY.errorDeVista, sinConexion, onReintentar }: { mensaje?: string; sinConexion: boolean; onReintentar: () => void }) {
  return (
    <Aviso tipo="error" titulo={sinConexion ? 'Sin conexión' : mensaje}>
      <Boton texto={COPY.reintentar} tipo="secundario" onPress={onReintentar} />
    </Aviso>
  );
}

/** Estado de una lista: «Cargando…», el error con «Reintentar», o nada (la pantalla dibuja los ítems). */
export function EstadoDeCarga<T>({ estado, onReintentar }: { estado: EstadoDeLista<T>; onReintentar: () => void }) {
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento sinConexion={estado.sinConexion} onReintentar={onReintentar} />;
  return null;
}

/** «Ver más» mientras la API diga que hay más (`page.hasMore`). Si la página siguiente falla, se reintenta desde acá. */
export function VerMas<T>({ estado, onVerMas }: { estado: EstadoDeLista<T>; onVerMas: () => void }) {
  if (estado.tipo !== 'listo' || !estado.siguiente) return null;
  const fallo = estado.mas === 'error' || estado.mas === 'sin-conexion';
  return (
    <>
      {fallo ? <Aviso tipo="error" titulo={estado.mas === 'sin-conexion' ? 'Sin conexión' : COPY.errorDeVista} /> : null}
      <Boton
        texto={estado.mas === 'cargando' ? 'Cargando…' : fallo ? COPY.reintentar : 'Ver más'}
        tipo="secundario"
        onPress={onVerMas}
        ocupado={estado.mas === 'cargando'}
      />
    </>
  );
}

/**
 * Navegación (2026-10-03). Una pantalla volvió a pedir lo que ya muestra y no pudo: queda lo leído antes en esta sesión,
 * con el aviso y «Reintentar». Mientras el pedido sigue en curso no se muestra nada acá: lo dice la línea del
 * encabezado (`LineaDeActualizacion`), que no corre la pantalla.
 */
export function SinActualizar({ visible, onReintentar }: { visible: boolean; onReintentar: () => void }) {
  if (!visible) return null;
  return (
    <Aviso tipo="info" titulo="No pudimos actualizar">
      <Parrafo tenue>Ves lo último que leímos en esta sesión.</Parrafo>
      <Boton texto={COPY.reintentar} tipo="secundario" onPress={onReintentar} />
    </Aviso>
  );
}

/**
 * Si la persona pidió reducir el movimiento en Android: la línea del encabezado, el aro del descanso y el indicador de la
 * recuperación quedan quietos.
 */
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vigente = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (vigente) setReducido(r);
    });
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducido);
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);
  return reducido;
}

/**
 * Navegación (2026-10-03). Una línea fina que corre sobre el borde inferior del encabezado mientras una pantalla vuelve a
 * pedir lo que ya muestra. No ocupa lugar ni tapa contenido: el refresco es discreto. El lector de pantalla no la
 * anuncia, porque lo que se ve ya es la lectura anterior; si el pedido falla, lo dice `SinActualizar`.
 */
export function LineaDeActualizacion({ activa }: { activa: boolean }) {
  const reducido = useMovimientoReducido();
  const avance = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    if (!activa || reducido || ancho === 0) return;
    avance.setValue(0);
    const vuelta = Animated.loop(Animated.timing(avance, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    vuelta.start();
    return () => vuelta.stop();
  }, [activa, reducido, ancho, avance]);

  if (!activa) return null;
  const tramo = ancho / 3;
  return (
    <View style={estilos.carril} onLayout={(e) => setAncho(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
      {reducido ? (
        <View style={[estilos.tramo, estilos.quieto]} />
      ) : (
        <Animated.View style={[estilos.tramo, { width: tramo, transform: [{ translateX: avance.interpolate({ inputRange: [0, 1], outputRange: [-tramo, ancho] }) }] }]} />
      )}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  carril: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, overflow: 'hidden' },
  // Corre sobre el borde fino de la cabecera (DL-117), en el color del acento: se ve en los dos temas.
  tramo: { height: 2, backgroundColor: COLOR.acento },
  quieto: { width: '100%', opacity: 0.6 },
}));
