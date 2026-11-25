/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-07 a ET2-09) · «¿Qué tan duro fue el entrenamiento, en general?», en la
 * pantalla de la sesión ya registrada, arriba de la nota para tu profe. Aparece solo si el plan lo pide (API-SER-02 trae
 * `askSessionEffort`), y solo la primera vez: llega con la ruta que abre «Finalizar», no desde «Tu historial».
 * - **Once opciones, del 0 al 10,** en una grilla de botones grandes (48 dp o más), con la palabra de la escala debajo
 *   donde cambia. Cada una es un `radio`: TalkBack dice el número, la palabra y si está elegida. Sin colores de juicio:
 *   la elegida va con el color de lo que se toca, como cualquier opción de la app.
 * - **Los minutos,** escritos con los del cronómetro de la sesión (sin pausas), editables y opcionales.
 * - **«Guardar» y «Ahora no».** Se manda aparte (API-ESF-01) con su clave de idempotencia: si no hay respuesta,
 *   «Reintentar» usa la misma. Si falla, la sesión sigue registrada. «Ahora no» la saca de la pantalla, sin mandar nada.
 * Las reglas (el cuerpo con los minutos y su origen, qué pasa con cada respuesta) están en `esfuerzo-de-la-sesion.ts`.
 */
import type { Resultado } from '@be/domain';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { cuerpoDelEsfuerzo, etiquetaDelPunto, filasDeLaEscala, minutosIniciales, palabraDebajo, POR_FILA, TEXTO_DEL_MOTIVO_DEL_ESFUERZO, TEXTOS_DEL_ESFUERZO as T, trasGuardarElEsfuerzo, type MotivoDelEsfuerzo } from '../esfuerzo-de-la-sesion';
import { useClaveDeIntento } from '../intento';
import { Aviso, Boton, Campo, estilosPorTema, Parrafo, Seccion } from '../ui';
import { useSuperficieDeControl } from '../vidrio';

type Estado =
  | { readonly tipo: 'preguntando' }
  | { readonly tipo: 'guardando' }
  | { readonly tipo: 'guardado'; readonly valor: number | null }
  | { readonly tipo: 'salteado' }
  | { readonly tipo: 'no-se-guardo'; readonly motivo: MotivoDelEsfuerzo; readonly reintentable: boolean };

export function EsfuerzoDeLaSesion({
  token,
  executionId,
  delCronometro,
  sesionPerdida,
}: {
  token: string;
  executionId: string;
  /** Los minutos del cronómetro de la sesión, sin pausas; `null` si no hubo cronómetro. */
  delCronometro: number | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
}) {
  const [valor, setValor] = useState<number | null>(null);
  const [minutos, setMinutos] = useState(() => minutosIniciales(delCronometro));
  const [estado, setEstado] = useState<Estado>({ tipo: 'preguntando' });
  const [minutosConError, setMinutosConError] = useState(false);
  const intento = useClaveDeIntento();

  // Cambiar algo después de un envío sin respuesta es otro pedido: otra clave (con la misma, la API lo rechazaría).
  const cambiar = (nuevo: { valor?: number; minutos?: string }) => {
    if (estado.tipo === 'no-se-guardo') {
      intento.descartar();
      setEstado({ tipo: 'preguntando' });
    }
    if (nuevo.valor !== undefined) setValor(nuevo.valor);
    if (nuevo.minutos !== undefined) {
      setMinutos(nuevo.minutos);
      setMinutosConError(false);
    }
  };

  async function guardar() {
    if (estado.tipo === 'guardando') return;
    const armado = cuerpoDelEsfuerzo({ valor, minutosEscritos: minutos, delCronometro });
    if (!armado.ok) {
      if (armado.motivo === 'minutos') setMinutosConError(true);
      return;
    }
    setEstado({ tipo: 'guardando' });
    const r = await api.registrarEsfuerzoDeLaSesion(token, executionId, armado.cuerpo, intento.actual());
    intento.registrar(r);
    if (sesionPerdida(r)) return;
    const despues = trasGuardarElEsfuerzo(r);
    if (despues.tipo === 'no-se-guardo') return setEstado(despues);
    // Con el 409 (ya estaba respondido) no se repite un número que puede ser el de otro intento.
    setEstado({ tipo: 'guardado', valor: r.ok ? r.datos.data.rating : null });
    AccessibilityInfo.announceForAccessibility(T.guardado);
  }

  if (estado.tipo === 'salteado') return null;
  if (estado.tipo === 'guardado') {
    return (
      <Aviso tipo="exito" titulo={T.guardado}>
        {estado.valor !== null ? <Parrafo>{T.elegido(estado.valor)}</Parrafo> : null}
      </Aviso>
    );
  }

  const guardando = estado.tipo === 'guardando';
  const sinReintento = estado.tipo === 'no-se-guardo' && !estado.reintentable;
  return (
    <Seccion titulo={T.pregunta} icono="reportado">
      <Parrafo tenue>{T.preguntaAclaracion}</Parrafo>
      <GrillaDeLaEscala valor={valor} alElegir={(v) => cambiar({ valor: v })} deshabilitado={guardando} />
      <Campo
        etiqueta={T.minutos}
        ayuda={delCronometro !== null && minutos.trim() === String(delCronometro) ? T.minutosDelCronometro(delCronometro) : T.minutosAyuda}
        value={minutos}
        onChangeText={(v) => cambiar({ minutos: v.replace(/[^\d]/g, '') })}
        keyboardType="number-pad"
        maxLength={3}
        editable={!guardando}
        error={minutosConError ? T.minutosInvalidos : null}
      />
      {estado.tipo === 'no-se-guardo' ? (
        <Aviso tipo="error" titulo={T.noSeGuardo}>
          <Parrafo>{TEXTO_DEL_MOTIVO_DEL_ESFUERZO[estado.motivo]}</Parrafo>
        </Aviso>
      ) : null}
      <View style={estilos.acciones}>
        {sinReintento ? null : (
          <Boton
            texto={guardando ? T.guardando : estado.tipo === 'no-se-guardo' ? T.reintentar : T.guardar}
            onPress={() => void guardar()}
            ocupado={guardando}
            deshabilitado={valor === null}
          />
        )}
        <Boton texto={T.saltear} tipo="secundario" deshabilitado={guardando} onPress={() => setEstado({ tipo: 'salteado' })} />
      </View>
    </Seccion>
  );
}

/** Las once opciones, de cuatro por fila (0-3, 4-7, 8-10): se leen de izquierda a derecha y de arriba abajo. */
function GrillaDeLaEscala({ valor, alElegir, deshabilitado }: { valor: number | null; alElegir: (v: number) => void; deshabilitado: boolean }) {
  // Con el vidrio, cada opción es un control de su nivel, como los Segmentos; apagado, la superficie de siempre.
  const control = useSuperficieDeControl();
  return (
    <View style={estilos.grilla} accessibilityRole="radiogroup" accessibilityLabel={T.escala}>
      {filasDeLaEscala().map((fila) => (
        <View key={fila[0]} style={estilos.fila}>
          {fila.map((v) => {
            const elegida = v === valor;
            const palabra = palabraDebajo(v);
            return (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityLabel={etiquetaDelPunto(v)}
                accessibilityState={{ checked: elegida, selected: elegida, disabled: deshabilitado }}
                onPress={() => alElegir(v)}
                disabled={deshabilitado}
                style={({ pressed }) => [estilos.punto, control, control && estilos.radioDelPunto, elegida && estilos.puntoElegido, deshabilitado && estilos.puntoDeshabilitado, pressed && estilos.presionado]}
              >
                <Text style={[estilos.numero, elegida && estilos.textoElegido]}>{v}</Text>
                {palabra ? (
                  <Text style={[estilos.palabra, elegida && estilos.textoElegido]} numberOfLines={2}>
                    {palabra}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          {/* La última fila, más corta, guarda el lugar de las que faltan: todas las opciones miden lo mismo. */}
          {Array.from({ length: POR_FILA - fila.length }, (_, i) => (
            <View key={`hueco-${i}`} style={estilos.hueco} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  grilla: { gap: 8, marginVertical: 8 },
  // Cada fila reparte su ancho entre cuatro opciones iguales (sin porcentajes: `flex`).
  fila: { flexDirection: 'row', gap: 8 },
  hueco: { flex: 1 },
  punto: {
    flex: 1,
    minHeight: 64,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR.bordeControl,
    backgroundColor: COLOR.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  // La receta del vidrio trae su radio: el del punto se repone encima, como en los Segmentos.
  radioDelPunto: { borderRadius: 14 },
  puntoElegido: { backgroundColor: COLOR.botonFondo, borderColor: COLOR.botonFondo },
  puntoDeshabilitado: { opacity: 0.6 },
  numero: { fontSize: 22, fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'] },
  palabra: { fontSize: 12, lineHeight: 15, color: COLOR.tenue, textAlign: 'center' },
  textoElegido: { color: COLOR.botonTexto },
  presionado: { opacity: 0.8 },
  acciones: { gap: 8, marginTop: 4 },
}));
