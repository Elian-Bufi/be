/**
 * La fila fija de acciones de la sesión (PV-11 y PV-12, DL-166; AV-13 y AV-14): Pausar o Reanudar, la acción del momento
 * («Empezar serie N» o «Terminar serie N») y Siguiente ejercicio, apilada sobre la navegación, también fija. La arma la
 * sesión (`pantallas/entrenamiento.tsx`) con `filaDeAcciones` y la dibuja App.tsx fuera del contenido que se desplaza:
 * queda abajo y nada flota sobre lo que se lee.
 *
 * La sesión publica los datos de la fila (los textos y si se puede tocar) y sus acciones por una referencia, que siempre
 * apunta a las de su último dibujo. App.tsx se vuelve a dibujar solo cuando cambian los datos: así no hay un ciclo entre
 * las dos, y un toque nunca usa una acción vieja.
 *
 * - Un doble toque es una sola acción: después de tocar la del medio, la fila no acepta otro toque por un momento (la
 *   regla de la corrida, además, rechaza abrir dos mediciones).
 * - Con letra grande sigue en una fila: los textos largos bajan a dos renglones dentro de su botón, sin cortarse ni
 *   achicarse (PV-13).
 * - Con el teclado abierto no se dibuja, como la barra.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTecladoAbierto } from './barra-de-zonas';
import type { FilaDeAcciones } from './descanso-automatico';
import { Icono } from './icono';
import { TEXTOS_DEL_DESCANSO } from './textos-del-descanso';
import { estilosPorTema } from './ui';

export interface AccionesDeLaFila {
  izquierda(): void;
  medio(): void;
  siguiente(): void;
}

export interface FilaPublicada {
  readonly datos: FilaDeAcciones;
  readonly ocupado: boolean;
  readonly acciones: { readonly current: AccionesDeLaFila };
}

let publicada: FilaPublicada | null = null;
let clave = '';
const oyentes = new Set<() => void>();

function fijar(fila: FilaPublicada | null) {
  publicada = fila;
  const nueva = fila ? JSON.stringify([fila.datos, fila.ocupado]) : '';
  if (nueva === clave) return;
  clave = nueva;
  oyentes.forEach((o) => o());
}
const suscribir = (alCambiar: () => void) => {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
};
const actual = () => publicada;

/** La sesión publica su fila en cada dibujo y la retira al desmontarse. `null`: sin fila (otro día, sin corrida). */
export function usePublicarFilaFija(datos: FilaDeAcciones | null, ocupado: boolean, acciones: AccionesDeLaFila): void {
  const ref = useRef(acciones);
  ref.current = acciones;
  useEffect(() => {
    fijar(datos ? { datos, ocupado, acciones: ref } : null);
  });
  useEffect(() => () => fijar(null), []);
}

/** La fila publicada, para App.tsx. */
export function useFilaFija(): FilaPublicada | null {
  return useSyncExternalStore(suscribir, actual, actual);
}

/** Lo que tarda en volver a aceptar la acción del medio: un doble toque es una sola acción. */
const ESPERA_ENTRE_TOQUES_MS = 700;

/** La fila, dibujada por App.tsx sobre la navegación fija. Informa su alto para que el contenido lo deje libre. */
export function FilaFijaDeLaSesion({ fila, abajo, alMedir }: { fila: FilaPublicada; abajo: number; alMedir: (alto: number) => void }) {
  const tecladoAbierto = useTecladoAbierto();
  const ultimoToque = useRef(0);
  useEffect(() => {
    if (tecladoAbierto) alMedir(0);
  }, [tecladoAbierto, alMedir]);
  if (tecladoAbierto) return null;
  const { datos, ocupado, acciones } = fila;
  const medioHabilitado = datos.medio !== null && datos.motivo === null && !ocupado;
  const tocarElMedio = () => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < ESPERA_ENTRE_TOQUES_MS) return;
    ultimoToque.current = ahora;
    acciones.current.medio();
  };
  return (
    <View style={[estilos.fila, { bottom: abajo }]} onLayout={(e) => alMedir(Math.ceil(e.nativeEvent.layout.height))} accessibilityLabel={TEXTOS_DEL_DESCANSO.accionesDeLaSesion}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={datos.izquierda.texto}
        onPress={() => acciones.current.izquierda()}
        disabled={ocupado}
        style={({ pressed }) => [estilos.lateral, pressed && estilos.presionado]}
      >
        <Icono nombre={datos.izquierda.tipo === 'pausar' ? 'espera' : 'actualizar'} tamano={20} tono="acento" />
        <Text style={estilos.textoLateral}>{datos.izquierda.texto}</Text>
      </Pressable>
      {datos.medio ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={datos.motivo ? `${datos.medio.texto}. ${datos.motivo}` : datos.medio.texto}
          accessibilityState={{ disabled: !medioHabilitado }}
          onPress={tocarElMedio}
          disabled={!medioHabilitado}
          style={({ pressed }) => [estilos.medio, !medioHabilitado && estilos.deshabilitado, pressed && estilos.presionado]}
        >
          <Icono nombre={datos.medio.tipo === 'empezar-serie' ? 'derecha' : 'tilde'} tamano={20} tono="botonTexto" />
          <Text style={estilos.textoDelMedio}>{datos.medio.texto}</Text>
        </Pressable>
      ) : (
        <View style={estilos.medioVacio} />
      )}
      {datos.siguienteEjercicio ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={datos.siguienteEjercicio.texto}
          accessibilityState={{ disabled: !datos.siguienteEjercicio.habilitado || ocupado }}
          disabled={!datos.siguienteEjercicio.habilitado || ocupado}
          onPress={() => acciones.current.siguiente()}
          style={({ pressed }) => [estilos.lateral, (!datos.siguienteEjercicio?.habilitado || ocupado) && estilos.deshabilitado, pressed && estilos.presionado]}
        >
          <Icono nombre="derecha" tamano={20} tono="acento" />
          <Text style={estilos.textoLateral}>{datos.siguienteEjercicio.texto}</Text>
        </Pressable>
      ) : (
        <View style={estilos.lateral} />
      )}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // Opaca y de lado a lado: nada se ve a través de ella.
  fila: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: COLOR.superficie, borderTopWidth: 1, borderTopColor: COLOR.borde },
  lateral: { width: 84, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 4 },
  textoLateral: { fontSize: 12, lineHeight: 15, fontWeight: '700', color: COLOR.acento, textAlign: 'center' },
  medio: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 10, backgroundColor: COLOR.botonFondo },
  medioVacio: { flex: 1 },
  textoDelMedio: { fontSize: 17, fontWeight: '800', color: COLOR.botonTexto, flexShrink: 1, textAlign: 'center' },
  deshabilitado: { opacity: 0.5 },
  presionado: { opacity: 0.7 },
}));
