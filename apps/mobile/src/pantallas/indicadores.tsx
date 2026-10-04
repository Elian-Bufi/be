/**
 * APK · «Mi evolución» → Indicadores: lo de la toma elegida que no tiene un sitio en la figura (cierre del 2026-10-04).
 *
 * - **Medidas:** peso, talla, diámetros y las que la lámina no dibuja. **Resultados de las fórmulas:** cada uno con su
 *   método; dos métodos nunca se comparan.
 * - **Tarjetas sin cuerpo**, en dos columnas cuando entran y en una cuando la letra o el ancho lo piden
 *   (`columnasDeIndicadores`): una tarjeta no parte su valor.
 * - Cada tarjeta lleva su valor, la diferencia con el anterior comparable y su gráfico chico de puntos por toma.
 * - **Elegir una tarjeta** la abre a todo el ancho con su detalle: el anterior con su fecha, el gráfico más grande con su
 *   lista y «Ver su evolución». Es la misma elección de medida del mapa corporal y de Evolución.
 */
import { cantidad, COPY_ANTROPOMETRIA, textoDeDiferenciaAntropometrica, type MedidaDeLaToma, type UltimaToma } from '@be/domain';
import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { anchoDelValorEstimado, columnasDeIndicadores, RELLENO_DE_INDICADOR, SEPARACION_DE_INDICADORES } from '../disposicion-de-la-toma';
import { Aviso, Boton, estilosPorTema, Rotulo } from '../ui';
import type { PuntosDeLaToma } from '../graficos-por-toma';
import { DetalleDeLaMedida, textoDeLaClase, textoDelAnterior, textoDelMetodo } from './detalle-de-la-medida';
import { estaEnLaFigura } from './figura-de-la-toma';
import { EvolucionPorToma } from './puntos-por-toma';

/** El tamaño del valor en la tarjeta, en sp antes de la escala de la persona. */
const LETRA_DEL_VALOR = 22;

export function Indicadores({
  toma,
  puntos,
  elegida,
  alElegir,
  verSuEvolucion,
  irAlMapa,
  frase,
}: {
  toma: UltimaToma;
  puntos: PuntosDeLaToma;
  elegida: string | null;
  alElegir: (metrica: string | null) => void;
  verSuEvolucion: (m: MedidaDeLaToma) => void;
  irAlMapa: () => void;
  /** La frase completa de una medida para el lector de pantalla, con sus valores por toma. */
  frase: (m: MedidaDeLaToma) => string;
}) {
  const { fontScale } = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  const medidas = toma.medidas.filter((m) => !estaEnLaFigura(m.metrica));
  const resultados = toma.derivadas;
  if (medidas.length + resultados.length === 0) {
    return (
      <Aviso tipo="info" titulo="Esta toma no tiene indicadores">
        <Text style={estilos.textoDeAviso}>Sus medidas tienen un sitio en la figura: están en el mapa corporal.</Text>
        <Boton texto="Ver el mapa corporal" tipo="secundario" onPress={irAlMapa} />
      </Aviso>
    );
  }
  const escala = Math.max(1, fontScale);
  const anchoDelValorMasLargo = Math.max(...[...medidas, ...resultados].map((m) => anchoDelValorEstimado(cantidad(m.actual.punto.value, m.actual.punto.unit), LETRA_DEL_VALOR * escala)));
  const columnas = ancho > 0 ? columnasDeIndicadores({ ancho, escalaDeLetra: fontScale, anchoDelValorMasLargo }) : 1;
  const anchoDeTarjeta = columnas === 2 ? Math.floor((ancho - SEPARACION_DE_INDICADORES) / 2) : ancho;
  const grilla = (lista: readonly MedidaDeLaToma[]) => (
    <View style={estilos.grilla}>
      {lista.map((m) => (
        <Indicador
          key={`${m.metrica}-${m.actual.punto.comparabilityGroup}`}
          medida={m}
          ancho={m.metrica === elegida ? ancho : anchoDeTarjeta}
          elegida={m.metrica === elegida}
          alTocar={() => alElegir(m.metrica === elegida ? null : m.metrica)}
          fechaComparada={toma.fechaAnterior}
          puntos={puntos}
          verSuEvolucion={verSuEvolucion}
          frase={frase(m)}
        />
      ))}
    </View>
  );
  return (
    <View onLayout={(e) => setAncho(Math.floor(e.nativeEvent.layout.width))}>
      {ancho > 0 ? (
        <>
          {medidas.length > 0 ? (
            <>
              <Rotulo>Medidas</Rotulo>
              {grilla(medidas)}
            </>
          ) : null}
          {resultados.length > 0 ? (
            <>
              <Rotulo>{COPY_ANTROPOMETRIA.resultadosDeLasFormulas}</Rotulo>
              {grilla(resultados)}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/**
 * Una tarjeta: el nombre, el valor grande, la diferencia, el anterior, el método si es un resultado, y el gráfico chico.
 * Elegida, ocupa todo el ancho y suma el detalle. Toda la tarjeta es el objetivo del toque, de 48 dp o más.
 */
function Indicador({
  medida,
  ancho,
  elegida,
  alTocar,
  fechaComparada,
  puntos,
  verSuEvolucion,
  frase,
}: {
  medida: MedidaDeLaToma;
  ancho: number;
  elegida: boolean;
  alTocar: () => void;
  fechaComparada: string | null;
  puntos: PuntosDeLaToma;
  verSuEvolucion: (m: MedidaDeLaToma) => void;
  frase: string;
}) {
  const { actual, diferencia } = medida;
  const esResultado = actual.punto.dataClass === 'DERIVED';
  const clase = textoDeLaClase(medida);
  return (
    <View style={[estilos.tarjeta, elegida && estilos.tarjetaElegida, { width: ancho }]}>
      <Pressable onPress={alTocar} accessibilityRole="button" accessibilityState={{ selected: elegida }} accessibilityLabel={frase} style={({ pressed }) => [estilos.toque, pressed && estilos.presionado]}>
        <Text style={[estilos.nombre, elegida && estilos.nombreElegido]}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{cantidad(actual.punto.value, actual.punto.unit)}</Text>
        {diferencia && !elegida ? <Text style={estilos.diferencia}>{textoDeDiferenciaAntropometrica(diferencia)}</Text> : null}
        {elegida ? null : <Text style={estilos.detalle}>{textoDelAnterior(medida, fechaComparada)}</Text>}
        {esResultado && !elegida ? <Text style={estilos.detalle}>{textoDelMetodo(medida)}</Text> : null}
        {clase && !elegida ? <Text style={estilos.detalle}>{clase}</Text> : null}
        {elegida ? null : <EvolucionPorToma estados={puntos.estados(medida)} tomas={puntos.tomas} elegida={puntos.elegida} conLista={false} />}
      </Pressable>
      {elegida ? <DetalleDeLaMedida medida={medida} fechaComparada={fechaComparada} puntos={puntos} verSuEvolucion={verSuEvolucion} enLaTarjeta /> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  textoDeAviso: { fontSize: 15, lineHeight: 21, color: COLOR.texto, marginBottom: 6 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: SEPARACION_DE_INDICADORES, marginBottom: 8 },
  tarjeta: { borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.fondo, padding: RELLENO_DE_INDICADOR - 1 },
  tarjetaElegida: { borderColor: COLOR.acento, borderWidth: 2, padding: RELLENO_DE_INDICADOR - 2 },
  toque: { minHeight: 48 },
  presionado: { opacity: 0.8 },
  nombre: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLOR.tenue },
  nombreElegido: { fontWeight: '800', color: COLOR.texto },
  valor: { fontSize: LETRA_DEL_VALOR, lineHeight: 28, fontWeight: '800', color: COLOR.texto, marginTop: 2 },
  diferencia: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: COLOR.texto, marginTop: 2 },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, marginTop: 2 },
}));
