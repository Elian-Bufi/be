/**
 * APK · «Mi evolución» → Indicadores (DL-117; DL-118, Dirección 2026-10-05): «¿qué datos y resultados tengo
 * disponibles?». Lo que no tiene un sitio en la figura, en cuatro bloques (`bloquesDeIndicadores`):
 * - **Mediciones:** peso y talla.
 * - **Resultados de las fórmulas:** cada uno marcado como estimación, con el método en su nombre. Dos métodos nunca se
 *   comparan ni se elige uno «mejor»: cada resultado es su propia tarjeta.
 * - **Datos de la toma:** la edad al momento de la toma. Es un dato de la evaluación, no un progreso: va sin gráfico ni
 *   diferencia.
 * - **Más datos de esta toma:** los diámetros y lo que BE no clasifica, plegados.
 *
 * Cada tarjeta lleva el valor con su unidad, el cambio respecto de la anterior comparable con su fecha y, con dos
 * observaciones comparables o más, sus puntos sobre las fechas reales. Con una sola, solo el valor. Elegida, ocupa todo
 * el ancho y abre su detalle: el gráfico grande, la procedencia y la lista (`ProgresoDeUnaMedida`). Las tarjetas son de
 * vidrio: un filo finísimo, un brillo contenido y la sombra, sin borde fuerte; la elegida lleva el borde de acento.
 *
 * Nada califica (TEST-PRJ-009) y nada se inventa: no hay umbrales, diagnósticos ni totales, y no se recalcula nada en el
 * teléfono.
 */
import { cantidad, COPY_ANTROPOMETRIA, type EvolucionResponse, type MedidaDeLaToma, type UltimaToma } from '@be/domain';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { anchoDelValorEstimado, bloquesDeIndicadores, columnasDeIndicadores, RELLENO_DE_INDICADOR, SEPARACION_DE_INDICADORES } from '../disposicion-de-la-toma';
import { indiceDeLaToma, serieDeLaMedida } from '../serie-de-la-medida';
import { COLOR, Desplegable, estilosPorTema, Rotulo } from '../ui';
import { BrilloDeVidrio, sombraDeVidrio } from '../vidrio';
import { fraseDeLaSerie, GraficoCompacto, ProgresoDeUnaMedida, textoDeLaClase, textoDelCambio } from './progreso-de-una-medida';

type Datos = EvolucionResponse['data'];

/** El tamaño del valor en la tarjeta, en sp antes de la escala de la persona. */
const LETRA_DEL_VALOR = 22;

export function Indicadores({ datos, toma, elegida, alElegir }: { datos: Datos; toma: UltimaToma; elegida: string | null; alElegir: (metrica: string | null) => void }) {
  const { fontScale } = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  const bloques = bloquesDeIndicadores(toma);
  const conTarjeta = [...bloques.mediciones, ...bloques.resultados, ...bloques.masDatos];
  const escala = Math.max(1, fontScale);
  const anchoDelValorMasLargo = Math.max(0, ...conTarjeta.map((m) => anchoDelValorEstimado(cantidad(m.actual.punto.value, m.actual.punto.unit), LETRA_DEL_VALOR * escala)));
  const columnas = ancho > 0 ? columnasDeIndicadores({ ancho, escalaDeLetra: fontScale, anchoDelValorMasLargo }) : 1;
  const anchoDeTarjeta = columnas === 2 ? Math.floor((ancho - SEPARACION_DE_INDICADORES) / 2) : ancho;
  const grilla = (lista: readonly MedidaDeLaToma[], marca: (m: MedidaDeLaToma) => string | null, enUnaColumna = false) => (
    <View style={estilos.grilla}>
      {lista.map((m) => (
        <Indicador
          key={`${m.metrica}-${m.actual.punto.comparabilityGroup}`}
          datos={datos}
          medida={m}
          evaluacionId={toma.evaluacionId}
          ancho={m.metrica === elegida || enUnaColumna ? ancho : anchoDeTarjeta}
          elegida={m.metrica === elegida}
          alTocar={() => alElegir(m.metrica === elegida ? null : m.metrica)}
          marca={marca(m)}
        />
      ))}
    </View>
  );
  return (
    <View onLayout={(e) => setAncho(Math.floor(e.nativeEvent.layout.width))}>
      {ancho > 0 ? (
        <>
          {bloques.mediciones.length > 0 ? (
            <>
              <Rotulo>Mediciones</Rotulo>
              {grilla(bloques.mediciones, (m) => textoDeLaClase(m))}
            </>
          ) : null}
          {bloques.resultados.length > 0 ? (
            <>
              <Rotulo>{COPY_ANTROPOMETRIA.resultadosDeLasFormulas}</Rotulo>
              {/* Un resultado es una estimación: la marca lo dice, y si se corrigió, también. */}
              {grilla(bloques.resultados, (m) => ['Estimación', m.actual.punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null].filter(Boolean).join(' · '))}
            </>
          ) : null}
          {bloques.contexto.length > 0 ? (
            <>
              <Rotulo>Datos de la toma</Rotulo>
              {bloques.contexto.map((m) => (
                <Text key={m.metrica} style={estilos.contexto}>
                  {`${m.nombre}: `}
                  <Text style={estilos.valorDeContexto}>{cantidad(m.actual.punto.value, m.actual.punto.unit)}</Text>
                </Text>
              ))}
            </>
          ) : null}
          {bloques.masDatos.length > 0 ? (
            <Desplegable titulo="Más datos de esta toma" detalle={bloques.masDatos.length === 1 ? '1 medida' : `${bloques.masDatos.length} medidas`}>
              {grilla(bloques.masDatos, (m) => textoDeLaClase(m), true)}
            </Desplegable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/**
 * Una tarjeta: el nombre, el valor grande, el cambio respecto de la anterior comparable con su fecha, su marca y sus
 * puntos sobre fechas reales. Elegida, ocupa todo el ancho y suma el detalle. Toda la tarjeta es el objetivo del toque.
 */
function Indicador({
  datos,
  medida,
  evaluacionId,
  ancho,
  elegida,
  alTocar,
  marca,
}: {
  datos: Datos;
  medida: MedidaDeLaToma;
  evaluacionId: string;
  ancho: number;
  elegida: boolean;
  alTocar: () => void;
  marca: string | null;
}) {
  const grupo = medida.actual.punto.comparabilityGroup;
  const serie = useMemo(() => serieDeLaMedida(datos, medida.metrica, grupo), [datos, medida.metrica, grupo]);
  const indice = indiceDeLaToma(serie.observaciones, evaluacionId);
  const valor = cantidad(medida.actual.punto.value, medida.actual.punto.unit);
  const cambio = textoDelCambio(medida);
  const frase = [medida.nombre, valor, cambio, marca, fraseDeLaSerie(serie.observaciones, indice)].filter(Boolean).join('. ');
  return (
    <View style={[estilos.tarjeta, elegida && estilos.tarjetaElegida, { width: ancho }]}>
      <BrilloDeVidrio color={COLOR.vidrioBrillo} radio={16} />
      <Pressable onPress={alTocar} accessibilityRole="button" accessibilityState={{ selected: elegida, expanded: elegida }} accessibilityLabel={frase} style={({ pressed }) => [estilos.toque, pressed && estilos.presionado]}>
        <Text style={[estilos.nombre, elegida && estilos.nombreElegido]}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{valor}</Text>
        <Text style={medida.diferencia ? estilos.diferencia : estilos.sinDiferencia}>{cambio}</Text>
        {marca ? <Text style={estilos.marca}>{marca}</Text> : null}
        {elegida ? null : <GraficoCompacto observaciones={serie.observaciones} periodo={datos.period} zonaHoraria={datos.period.timeZone} elegida={indice} />}
      </Pressable>
      {elegida ? <ProgresoDeUnaMedida datos={datos} metrica={medida.metrica} grupoInicial={grupo} evaluacionId={evaluacionId} nombre={medida.nombre} /> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: SEPARACION_DE_INDICADORES, marginBottom: 8 },
  // Vidrio: la superficie, un filo finísimo, la sombra y, adentro, el brillo. Sin borde fuerte; la elegida lleva el de acento.
  tarjeta: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLOR.vidrioFilo,
    backgroundColor: COLOR.superficie,
    padding: RELLENO_DE_INDICADOR - 1,
    ...sombraDeVidrio(COLOR.sombra),
  },
  tarjetaElegida: { borderColor: COLOR.acento, borderWidth: 2, padding: RELLENO_DE_INDICADOR - 2 },
  toque: { minHeight: 48 },
  presionado: { opacity: 0.8 },
  nombre: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: COLOR.texto },
  nombreElegido: { fontWeight: '800', color: COLOR.texto },
  valor: { fontSize: LETRA_DEL_VALOR, lineHeight: 28, fontWeight: '800', color: COLOR.texto, marginTop: 2 },
  diferencia: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: COLOR.texto, marginTop: 2 },
  sinDiferencia: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 2 },
  marca: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLOR.tenue, marginTop: 2 },
  contexto: { fontSize: 15, lineHeight: 22, color: COLOR.tenue, marginBottom: 8 },
  valorDeContexto: { fontWeight: '800', color: COLOR.texto },
}));
