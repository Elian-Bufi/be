/**
 * Confirmación contextual con CTA explícito para pausar, reanudar, finalizar y revocar (10-B04 §18, §22-§26: sin
 * «Escribí FINALIZAR»). El botón «atrás» de Android equivale a «Volver», salvo mientras se envía. La acción de efecto
 * nunca es la única salida: «Volver» está siempre, primero.
 */
import { COPY, COPY_VINCULO, ETIQUETA_DE_MOTIVO, type Resultado } from '@be/domain';
import { useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { falloDe, useClaveDeIntento, type Fallo } from './intento';
import { Aviso, Boton, COLOR, VELO, estilos as ui } from './ui';

export function DialogoDeConfirmacion({
  visible,
  titulo,
  children,
  textoConfirmar,
  textoEnviando,
  peligro = false,
  enviando,
  fallo,
  confirmarDeshabilitado = false,
  onVolver,
  onConfirmar,
  onActualizar,
}: {
  visible: boolean;
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  textoEnviando: string;
  peligro?: boolean;
  enviando: boolean;
  fallo: Fallo | null;
  confirmarDeshabilitado?: boolean;
  onVolver: () => void;
  onConfirmar: () => void;
  onActualizar: () => void;
}) {
  // Con la vista vieja o el recurso fuera de alcance, confirmar de nuevo fallaría igual: primero hay que actualizar.
  const puedeConfirmar = !fallo || fallo.tipo === 'incierto' || fallo.tipo === 'otro';
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!enviando) onVolver();
      }}
    >
      <View style={estilos.fondo}>
        <ScrollView contentContainerStyle={estilos.centrado}>
          <View style={estilos.dialogo} accessibilityViewIsModal>
            <Text style={ui.tituloDeSeccion} accessibilityRole="header">
              {titulo}
            </Text>
            {children}
            {fallo ? <Aviso tipo="error" titulo={fallo.mensaje} /> : null}
            <Boton texto={COPY_VINCULO.volver} tipo="secundario" onPress={onVolver} deshabilitado={enviando} />
            {fallo?.tipo === 'actualizar' ? <Boton texto="Actualizar" onPress={onActualizar} /> : null}
            {puedeConfirmar ? (
              <Boton
                texto={enviando ? textoEnviando : fallo?.tipo === 'incierto' ? COPY.reintentar : textoConfirmar}
                tipo={peligro ? 'peligro' : 'primario'}
                onPress={onConfirmar}
                ocupado={enviando}
                deshabilitado={confirmarDeshabilitado}
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

type Motivo = keyof typeof ETIQUETA_DE_MOTIVO;

/** Motivo de una lista cerrada (DL-033), sin preselección: confirmar exige elegir. */
export function SelectorDeMotivo<M extends Motivo>({
  motivos,
  valor,
  onCambio,
  deshabilitado = false,
}: {
  motivos: readonly M[];
  valor: M | null;
  onCambio: (m: M) => void;
  deshabilitado?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={COPY_VINCULO.motivo} style={estilos.grupo}>
      <Text style={ui.etiqueta}>{COPY_VINCULO.motivo}</Text>
      {motivos.map((m) => {
        const elegido = valor === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegido, disabled: deshabilitado }}
            disabled={deshabilitado}
            onPress={() => onCambio(m)}
            style={({ pressed }) => [estilos.opcion, elegido && estilos.opcionElegida, pressed && ui.presionado, deshabilitado && ui.deshabilitado]}
          >
            <View style={estilos.circulo}>{elegido ? <View style={estilos.punto} /> : null}</View>
            <Text style={estilos.textoDeOpcion}>{ETIQUETA_DE_MOTIVO[m]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type EstadoDeConfirmacion = { readonly tipo: 'cerrado' } | { readonly tipo: 'abierto' } | { readonly tipo: 'enviando' } | { readonly tipo: 'fallo'; readonly fallo: Fallo };

/**
 * Estado y key de una acción con confirmación. Cada apertura es un intento lógico nuevo. Con resultado incierto, el
 * diálogo ofrece «Reintentar» con la misma key y el mismo pedido; «Volver» abandona el intento y recarga la vista para
 * mostrar lo que realmente quedó (10-B10:430-438). Igual si la vista quedó vieja o el recurso ya no se puede abrir.
 * Las revocaciones no envían key (idempotentes por semántica): la que se crea acá no sale del APK.
 */
export function useAccionConfirmada({
  sesionPerdida,
  alTerminar,
  alRecargar,
  propios,
}: {
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alTerminar: () => void;
  alRecargar: () => void;
  /** Mensajes propios de la operación para algunos códigos (por ejemplo, 403 al reanudar). */
  propios?: Readonly<Record<string, Fallo>>;
}) {
  const intento = useClaveDeIntento();
  const [estado, setEstado] = useState<EstadoDeConfirmacion>({ tipo: 'cerrado' });
  const enCurso = useRef(false);
  const fallo = estado.tipo === 'fallo' ? estado.fallo : null;

  function cerrar(recargar: boolean) {
    intento.descartar();
    setEstado({ tipo: 'cerrado' });
    if (recargar) alRecargar();
  }

  return {
    visible: estado.tipo !== 'cerrado',
    enviando: estado.tipo === 'enviando',
    /** Mientras el resultado es incierto, el pedido no cambia: el reintento debe ser el mismo intento. */
    congelado: estado.tipo === 'enviando' || fallo?.tipo === 'incierto',
    fallo,
    abrir() {
      intento.descartar();
      setEstado({ tipo: 'abierto' });
    },
    volver() {
      if (!enCurso.current) cerrar(fallo !== null && fallo.tipo !== 'otro');
    },
    actualizar() {
      if (!enCurso.current) cerrar(true);
    },
    async ejecutar(llamada: (clave: string) => Promise<Resultado<unknown>>) {
      if (enCurso.current) return;
      enCurso.current = true;
      setEstado({ tipo: 'enviando' });
      const r = await llamada(intento.actual());
      enCurso.current = false;
      intento.registrar(r);
      if (r.ok) {
        setEstado({ tipo: 'cerrado' });
        alTerminar();
        return;
      }
      if (sesionPerdida(r)) return;
      setEstado({ tipo: 'fallo', fallo: falloDe(r, propios) });
    },
  };
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: VELO },
  centrado: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: COLOR.superficie, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLOR.borde },
  grupo: { marginVertical: 8 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLOR.bordeControl,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: COLOR.fondo,
  },
  opcionElegida: { borderColor: COLOR.acento, borderWidth: 2, backgroundColor: COLOR.superficie },
  circulo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLOR.acento,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  punto: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLOR.acento },
  textoDeOpcion: { flex: 1, fontSize: 16, color: COLOR.texto },
});
