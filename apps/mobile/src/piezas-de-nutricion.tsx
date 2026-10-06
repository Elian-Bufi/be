/**
 * Piezas comunes del registro de comidas de la APK (WP-NUTRICION-RECETAS §9): la franja de macros, la caja de un aviso
 * informativo, la fila que abre algo y las casillas de «¿Cuánto comiste?». Siguen las reglas de `ui.tsx`: 48 dp de toque,
 * roles y estados accesibles, y el texto dice lo que el color acompaña.
 */
import type { Nutrientes } from '@be/domain';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { celdaDeMacro, celdasDeLaFranja, columnasDeLaFranja, LETRA_DE_LA_ETIQUETA, LETRA_DEL_VALOR, type CeldaDeMacro } from './franja-de-macros';
import { Flecha, IconoDeInformacion } from './iconos-de-nutricion';
import { COLOR, estilosPorTema } from './tema';
import { Cifra } from './ui';

/**
 * Calorías, Carbohidratos, Grasas y Proteínas. Cuatro columnas si entran; si no, dos por dos, y con letra muy grande una
 * columna, con la etiqueta arriba y el valor abajo (`franja-de-macros.ts`). Cada celda se lee entera.
 */
export function FranjaDeMacros({ nutrientes }: { nutrientes: Nutrientes }) {
  const { fontScale } = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  const celdas = celdasDeLaFranja(nutrientes);
  // El borde de la franja ocupa un dp de cada lado.
  const interior = Math.max(0, ancho - 2);
  const columnas = ancho > 0 ? columnasDeLaFranja(interior, fontScale, celdas) : 2;
  const anchoDeCelda = Math.floor(interior / columnas);
  return (
    <View style={estilos.franja} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0
        ? celdas.map((c, i) =>
            columnas === 1 ? (
              // El ancho explícito: sin él, la fila mide su contenido en una línea y no baja el valor a la siguiente.
              <View key={c.nutriente} style={[estilos.fila, { width: interior }, i > 0 && estilos.lineaArriba]} accessible accessibilityLabel={c.paraLeer}>
                <Text style={estilos.etiquetaEnFila}>{c.etiqueta}</Text>
                <ValorDeMacro celda={c} />
              </View>
            ) : (
              <View
                key={c.nutriente}
                style={[estilos.celda, { width: anchoDeCelda }, i % columnas !== 0 && estilos.lineaIzquierda, i >= columnas && estilos.lineaArriba]}
                accessible
                accessibilityLabel={c.paraLeer}
              >
                {/* Si en un teléfono la etiqueta no entra igual, se achica un poco en vez de partir la palabra. */}
                <Text style={estilos.etiqueta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                  {c.etiqueta}
                </Text>
                <ValorDeMacro celda={c} />
              </View>
            ),
          )
        : null}
    </View>
  );
}

/** La fibra, debajo de la franja: «Fibra: 5,4 g», o «Fibra: Sin dato». */
export function LineaDeFibra({ nutrientes }: { nutrientes: Nutrientes }) {
  const fibra = celdaDeMacro(nutrientes, 'fiberG');
  return <Text style={estilos.fibra}>{fibra.paraLeer}</Text>;
}

function ValorDeMacro({ celda }: { celda: CeldaDeMacro }) {
  if (celda.valor === null) return <Text style={estilos.sinDato}>{celda.texto}</Text>;
  return <Cifra valor={celda.valor} unidad={celda.unidad} tamano={LETRA_DEL_VALOR} />;
}

/** Un aviso informativo con su ícono: «Cantidades sin confirmar», «Macros sin calcular». Se lee como una sola frase. */
export function CajaInformativa({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <View style={estilos.caja} accessible accessibilityRole="summary" accessibilityLabel={texto ? `${titulo}. ${texto}` : titulo}>
      <IconoDeInformacion color={COLOR.acento} />
      <View style={estilos.textosDeCaja}>
        <Text style={estilos.tituloDeCaja}>{titulo}</Text>
        {texto ? <Text style={estilos.textoDeCaja}>{texto}</Text> : null}
      </View>
    </View>
  );
}

/**
 * Una fila que abre algo, con la flecha a la derecha: «Ver detalle», «Ver o corregir registro», «Seguir con mi día».
 * `destacada` la enmarca, como «Comí algo diferente», con un ícono y un detalle.
 */
export function FilaQueAbre({
  texto,
  detalle,
  icono,
  onPress,
  destacada = false,
  acento = false,
  deshabilitada = false,
}: {
  texto: string;
  detalle?: string;
  icono?: ReactNode;
  onPress: () => void;
  destacada?: boolean;
  /** El texto en el color del acento, como un enlace dentro de una tarjeta. */
  acento?: boolean;
  deshabilitada?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${texto}. ${detalle}` : texto}
      accessibilityState={{ disabled: deshabilitada }}
      disabled={deshabilitada}
      onPress={onPress}
      style={({ pressed }) => [estilos.filaQueAbre, destacada && estilos.filaDestacada, pressed && estilos.presionada, deshabilitada && estilos.deshabilitada]}
    >
      {icono ? <View style={estilos.iconoDeFila}>{icono}</View> : null}
      <View style={estilos.textosDeFila}>
        <Text style={[estilos.textoDeFila, acento && estilos.textoAcento, destacada && estilos.textoDestacado]}>{texto}</Text>
        {detalle ? <Text style={estilos.detalleDeFila}>{detalle}</Text> : null}
      </View>
      <Flecha color={acento || destacada ? COLOR.acento : COLOR.texto} hacia="derecha" />
    </Pressable>
  );
}

/** Una casilla con su texto, sin premarcar: el estado lo decide quien la usa. */
export function CasillaSimple({
  marcada,
  texto,
  paraLeer,
  onCambio,
  deshabilitada = false,
}: {
  marcada: boolean;
  texto: string;
  /** Lo que dice el lector, si el texto solo no alcanza: «No lo comí: arroz». */
  paraLeer?: string;
  onCambio: (marcada: boolean) => void;
  deshabilitada?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada, disabled: deshabilitada }}
      accessibilityLabel={paraLeer ?? texto}
      disabled={deshabilitada}
      onPress={() => onCambio(!marcada)}
      style={({ pressed }) => [estilos.filaDeCasilla, pressed && estilos.presionada, deshabilitada && estilos.deshabilitada]}
    >
      <View style={[estilos.casilla, marcada && estilos.casillaMarcada]}>{marcada ? <Text style={estilos.tilde}>✓</Text> : null}</View>
      <Text style={estilos.textoDeCasilla}>{texto}</Text>
    </Pressable>
  );
}

/** Un botón que despliega una parte de la pantalla, con su estado para el lector y la flecha hacia abajo o arriba. */
export function Desplegador({ texto, abierto, onPress }: { texto: string; abierto: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: abierto }}
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [estilos.desplegador, abierto && estilos.desplegadorAbierto, pressed && estilos.presionada]}
    >
      <Text style={estilos.textoDeDesplegador}>{texto}</Text>
      <View style={{ transform: [{ rotate: abierto ? '-90deg' : '90deg' }] }}>
        <Flecha color={COLOR.acento} hacia="derecha" />
      </View>
    </Pressable>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  franja: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, backgroundColor: COLOR.fondo, marginVertical: 6 },
  celda: { paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderColor: COLOR.borde },
  // Una columna (letra muy grande): la etiqueta arriba y el valor abajo, igual en las cuatro filas.
  fila: { alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderColor: COLOR.borde },
  lineaIzquierda: { borderLeftWidth: 1 },
  lineaArriba: { borderTopWidth: 1 },
  etiqueta: { fontSize: LETRA_DE_LA_ETIQUETA, lineHeight: 16, fontWeight: '600', color: COLOR.tenue, textAlign: 'center' },
  etiquetaEnFila: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: COLOR.tenue },
  sinDato: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: COLOR.tenue },
  fibra: { fontSize: 14, lineHeight: 19, color: COLOR.tenue, marginBottom: 4 },
  caja: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 14, marginVertical: 8, backgroundColor: COLOR.superficie },
  textosDeCaja: { flex: 1 },
  tituloDeCaja: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: COLOR.texto },
  textoDeCaja: { fontSize: 15, lineHeight: 21, color: COLOR.tenue, marginTop: 2 },
  filaQueAbre: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8, marginVertical: 2 },
  filaDestacada: { borderWidth: 1, borderColor: COLOR.acento, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginVertical: 8, backgroundColor: COLOR.superficie },
  iconoDeFila: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  textosDeFila: { flex: 1 },
  textoDeFila: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: COLOR.texto },
  textoAcento: { color: COLOR.acento },
  textoDestacado: { fontSize: 17 },
  detalleDeFila: { fontSize: 14, lineHeight: 19, color: COLOR.tenue },
  presionada: { opacity: 0.8 },
  deshabilitada: { opacity: 0.6 },
  filaDeCasilla: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12, paddingVertical: 4 },
  casilla: { width: 28, height: 28, borderWidth: 2, borderColor: COLOR.acento, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  casillaMarcada: { backgroundColor: COLOR.acento },
  tilde: { color: COLOR.botonTexto, fontWeight: '800', fontSize: 18 },
  textoDeCasilla: { flex: 1, fontSize: 16, lineHeight: 22, color: COLOR.texto },
  desplegador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 8, marginTop: 4 },
  desplegadorAbierto: { borderBottomWidth: 0 },
  textoDeDesplegador: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '700', color: COLOR.acento },
}));
