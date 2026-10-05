/**
 * APK · «Mi evolución»: los gráficos con fechas de una medida y su detalle (DL-118, Dirección 2026-10-05). La antigua
 * vista Evolución se absorbe acá: su gráfico va en el detalle de cada tarjeta de Progreso y de Indicadores.
 *
 * - **El gráfico primero.** Con el grupo comparable de la toma elegida, sin elegir antes medida, días ni método. La
 *   procedencia, el otro grupo y la lista van debajo.
 * - **Puntos sobre fechas reales**, sin líneas ni rellenos (REG-06-165/166): un tramo sin medición queda vacío. Un solo
 *   grupo de comparabilidad por eje (REG-06-162/164); el otro se elige en el detalle, nunca se mezcla.
 * - **El gráfico compacto** de las tarjetas usa la misma escala y la misma regla de eje que el grande, en poco alto.
 * - **La lista equivalente** dice lo mismo que el gráfico, con los huecos: es el camino del lector de pantalla.
 * Nada califica (TEST-PRJ-009): una diferencia es un número con signo, sin color de «mejor» o «peor».
 */
import {
  cantidad,
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_CLASE_DE_DATO,
  nombreDelGrupo,
  nombreDeMetodo,
  numero,
  textoDeDiferenciaAntropometrica,
  type EvolucionResponse,
  type FilaDeEvolucion,
  type MedidaDeLaToma,
  type Observacion,
  UNIDAD_ADIMENSIONAL,
} from '@be/domain';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as TextoSvg } from 'react-native-svg';
import { anchoEstimado, ESCALA_DESDE_LA_QUE_VAN_NUMEROS } from '../composicion-de-la-figura';
import { fecha, fechaCivil, fechaCorta } from '../formato';
import { componerGrafico, componerGraficoCompacto, puntoMasCercano, RADIO_COMPACTO, RADIO_COMPACTO_ELEGIDA, type ComposicionDelGrafico } from '../grafico-de-evolucion';
import { indiceDeLaToma, serieDeLaMedida } from '../serie-de-la-medida';
import { Boton, Cifra, COLOR, Desplegable, estilosPorTema, Parrafo, Rotulo, Segmentos, Tarjeta } from '../ui';
import { HuecoDeLaSerie, PuntoDeLaSerie } from './serie-en-lista';

type Datos = EvolucionResponse['data'];
type Periodo = { readonly start: string; readonly end: string };

// ─── Textos de una medida ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * El cambio respecto de la anterior comparable, en partes, para la cabecera de una tarjeta: la diferencia con su flecha y
 * con qué fecha se compara; o por qué no hay anterior. Es descriptivo, nunca califica: la flecha dice para dónde, no si es
 * bueno o malo, y va del mismo color hacia arriba y hacia abajo. Cada medida tiene su fecha: la cabecera de la pantalla no
 * la dice (ajuste de Dirección del 2026-10-05).
 */
export type PartesDelCambio =
  | { readonly tipo: 'diferencia'; readonly flecha: '↑' | '↓' | null; readonly diferencia: string; readonly respecto: string }
  | { readonly tipo: 'motivo'; readonly motivo: string };

export function partesDelCambio(medida: MedidaDeLaToma): PartesDelCambio {
  const { diferencia, anterior, motivoSinAnterior } = medida;
  if (diferencia && anterior) {
    const flecha = diferencia.delta > 0 ? '↑' : diferencia.delta < 0 ? '↓' : null;
    // Sin unidad (un índice), la cantidad termina en un espacio: se recorta.
    return { tipo: 'diferencia', flecha, diferencia: textoDeDiferenciaAntropometrica(diferencia).trim(), respecto: `respecto del ${fechaCorta(anterior.fecha)}` };
  }
  return { tipo: 'motivo', motivo: motivoSinAnterior === 'OTRO_GRUPO' ? COPY_ANTROPOMETRIA.sinAnteriorOtroGrupo : COPY_ANTROPOMETRIA.sinAnteriorComparable };
}

/** El cambio en una línea, para el lector de pantalla, el mapa y las listas: «−0,5 cm respecto del 25 jul»; o el motivo. */
export function textoDelCambio(medida: MedidaDeLaToma): string {
  const partes = partesDelCambio(medida);
  return partes.tipo === 'diferencia' ? `${partes.diferencia} ${partes.respecto}` : partes.motivo;
}

/** El valor en dos partes, para escribir la unidad más chica que el número: «56» y «cm». Sin dimensión, sin unidad. */
export function partesDelValor(punto: { readonly value: number; readonly unit: string }): { readonly numero: string; readonly unidad: string } {
  return { numero: numero(punto.value), unidad: punto.unit === UNIDAD_ADIMENSIONAL ? '' : punto.unit };
}

/**
 * La cabecera de una tarjeta con la forma del ejemplo de Dirección (2026-10-05): el valor grande con su unidad chica y, a
 * la derecha, el cambio con su flecha y, debajo, con qué fecha se compara. Sin anterior comparable, el motivo va en su
 * propia línea.
 *
 * **Apilada** en una tarjeta angosta o con letra grande: el cambio va debajo del valor, alineado con él, en una línea
 * que se parte si hace falta. Al costado se apretaba, y alineado a la derecha debajo del valor se leía mal.
 */
export function ValorYCambio({ medida, tamano, angosta = false }: { medida: MedidaDeLaToma; tamano: number; angosta?: boolean }) {
  const { fontScale } = useWindowDimensions();
  const valor = partesDelValor(medida.actual.punto);
  const cambio = partesDelCambio(medida);
  const textoDelValor = (
    <Text style={[estilos.valorGrande, { fontSize: tamano, lineHeight: Math.round(tamano * 1.22) }]}>
      {valor.numero}
      {valor.unidad ? <Text style={estilos.unidadChica}>{` ${valor.unidad}`}</Text> : null}
    </Text>
  );
  if (angosta || fontScale >= ESCALA_DESDE_LA_QUE_VAN_NUMEROS) {
    return (
      <View style={estilos.valorApilado}>
        {textoDelValor}
        {cambio.tipo === 'diferencia' ? (
          <Text style={estilos.respectoEnLinea}>
            <Text style={estilos.diferencia}>{cambio.flecha ? `${cambio.flecha} ${cambio.diferencia}` : cambio.diferencia}</Text>
            {` ${cambio.respecto}`}
          </Text>
        ) : (
          <Text style={estilos.motivo}>{cambio.motivo}</Text>
        )}
      </View>
    );
  }
  return (
    <View style={estilos.valorYCambio}>
      {textoDelValor}
      {cambio.tipo === 'diferencia' ? (
        <View style={estilos.cambio}>
          <Text style={estilos.diferencia}>{cambio.flecha ? `${cambio.flecha} ${cambio.diferencia}` : cambio.diferencia}</Text>
          <Text style={estilos.respecto}>{cambio.respecto}</Text>
        </View>
      ) : (
        <Text style={estilos.motivo}>{cambio.motivo}</Text>
      )}
    </View>
  );
}

/** El anterior comparable, o por qué no lo hay; con la fecha. */
export function textoDelAnterior(medida: MedidaDeLaToma): string {
  const { anterior, motivoSinAnterior } = medida;
  if (!anterior) return motivoSinAnterior === 'OTRO_GRUPO' ? COPY_ANTROPOMETRIA.sinAnteriorOtroGrupo : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  return `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}, el ${fechaCivil(anterior.fecha)}`;
}

/** El método de un resultado de fórmula, con su nombre del catálogo. */
export const textoDelMetodo = (medida: MedidaDeLaToma): string =>
  `${COPY_ANTROPOMETRIA.metodoDelResultado}: ${nombreDeMetodo(medida.actual.grupo?.methodVersionId ?? null) ?? COPY_ANTROPOMETRIA.metodoSinNombre}`;

/** La clase del dato si no es medido, y si su valor vigente viene de una corrección. */
export function textoDeLaClase(medida: MedidaDeLaToma): string | null {
  const { punto } = medida.actual;
  const partes = [punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass], punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}

/** Lo que dicen los puntos de una medida en una frase, para el lector de pantalla: cuántos, entre qué fechas y el elegido. */
export function fraseDeLaSerie(observaciones: readonly Observacion[], elegida: number | null): string | null {
  if (observaciones.length < 2) return null;
  const primera = observaciones[0]!;
  const ultima = observaciones[observaciones.length - 1]!;
  const esta = elegida === null ? null : observaciones[elegida];
  return `${numero(observaciones.length)} mediciones comparables entre el ${fechaCivil(primera.fecha)} y el ${fechaCivil(ultima.fecha)}${esta ? `; la de esta toma, ${cantidad(esta.punto.value, esta.punto.unit)}` : ''}`;
}

// ─── El gráfico compacto, para las tarjetas ─────────────────────────────────────────────────────────────────────────

/**
 * Los puntos de una medida en una tarjeta, con la forma del ejemplo de Dirección (2026-10-05): tres líneas de referencia
 * con su valor, los puntos sin unir sobre sus fechas reales, la toma bajo cada punto y, debajo, los valores en fila. La
 * observación de la toma elegida va llena y más grande, y su toma y su valor, resaltados. No recibe toques: la tarjeta
 * entera es el objetivo. Con menos de dos observaciones no se dibuja.
 */
export function GraficoCompacto({ observaciones, tomas, periodo, zonaHoraria, elegida }: { observaciones: readonly Observacion[]; tomas: readonly (string | null)[]; periodo: Periodo; zonaHoraria: string; elegida: number | null }) {
  const { fontScale } = useWindowDimensions();
  const escala = Math.max(1, fontScale);
  const [ancho, setAncho] = useState(0);
  const alto = Math.round(96 + 28 * (Math.min(escala, 2) - 1));
  const grafico = useMemo(
    () => (ancho > 0 ? componerGraficoCompacto({ observaciones, tomas, elegida, periodo, zonaHoraria, ancho, alto, escalaDeLetra: escala, anchoDelTexto: anchoEstimado, formatoDelValor: (v) => numero(v) }) : null),
    [observaciones, tomas, elegida, periodo, zonaHoraria, ancho, alto, escala],
  );
  if (observaciones.length < 2) return null;
  const letra = 11 * escala;
  return (
    <View style={estilos.compacto} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ height: alto }} onLayout={(e) => setAncho(Math.floor(e.nativeEvent.layout.width))}>
        {grafico ? (
          <Svg width={ancho} height={alto}>
            {grafico.marcasY.map((m) => (
              <G key={`y-${m.valor}`}>
                <Line x1={grafico.area.izquierda} x2={grafico.area.derecha} y1={m.y} y2={m.y} stroke={COLOR.borde} strokeWidth={1} />
                <TextoSvg x={grafico.area.izquierda - 6} y={m.y + letra * 0.35} fontSize={letra} fill={COLOR.tenue} textAnchor="end">
                  {numero(m.valor)}
                </TextoSvg>
              </G>
            ))}
            {grafico.tomas.map((t) => (
              <TextoSvg key={`t-${t.indice}`} x={t.x} y={alto - 4} fontSize={letra} fontWeight={t.indice === elegida ? '800' : '400'} fill={t.indice === elegida ? COLOR.texto : COLOR.tenue} textAnchor="middle">
                {t.texto}
              </TextoSvg>
            ))}
            {grafico.puntos.map((p) =>
              p.indice === elegida ? (
                <Circle key={p.observacion.punto.sourceId} cx={p.x} cy={p.y} r={RADIO_COMPACTO_ELEGIDA} fill={COLOR.acento} stroke={COLOR.superficie} strokeWidth={1.5} />
              ) : (
                <Circle key={p.observacion.punto.sourceId} cx={p.x} cy={p.y} r={RADIO_COMPACTO} fill={COLOR.superficie} stroke={COLOR.acento} strokeWidth={2} />
              ),
            )}
          </Svg>
        ) : null}
      </View>
      {/* Los valores, en el orden de los puntos: se leen sin adivinarlos en la escala. El punto medio va pegado al valor
          anterior, para que ningún renglón empiece con él. */}
      <View style={estilos.valores}>
        <Text style={estilos.textoDeValores}>
          {observaciones.map((o, i) => (
            <Fragment key={o.punto.sourceId}>
              {i > 0 ? ' · ' : null}
              <Text style={i === elegida ? estilos.valorElegido : undefined}>{numero(o.punto.value)}</Text>
            </Fragment>
          ))}
        </Text>
      </View>
    </View>
  );
}

// ─── El detalle de una medida ────────────────────────────────────────────────────────────────────────────────────────

/**
 * El progreso de una medida, al abrir su tarjeta: el gráfico con fechas, la observación elegida con su procedencia,
 * «Anterior» y «Siguiente», el otro grupo si lo hay y la lista equivalente. Empieza en la observación de la toma elegida.
 */
export function ProgresoDeUnaMedida({ datos, metrica, grupoInicial, evaluacionId, nombre }: { datos: Datos; metrica: string; grupoInicial: string | null; evaluacionId: string; nombre: string }) {
  const [grupoPedido, setGrupoPedido] = useState<string | null>(grupoInicial);
  const serie = useMemo(() => serieDeLaMedida(datos, metrica, grupoPedido), [datos, metrica, grupoPedido]);
  const [elegida, setElegida] = useState<number | null>(null);
  const deLaToma = indiceDeLaToma(serie.observaciones, evaluacionId);
  const indice = elegida !== null && elegida < serie.observaciones.length ? elegida : (deLaToma ?? serie.observaciones.length - 1);
  if (serie.observaciones.length === 0) return <Parrafo tenue>{COPY_ANTROPOMETRIA.sinMedicionesDeLaMedida}</Parrafo>;
  const observacion = serie.observaciones[indice]!;
  return (
    <View style={estilos.detalle}>
      <GraficoConFechas observaciones={serie.observaciones} periodo={datos.period} zonaHoraria={datos.period.timeZone} nombre={nombre} elegida={indice} alElegir={setElegida} />
      <DetalleDeLaObservacion observacion={observacion} esLaUltima={indice === serie.observaciones.length - 1} />
      {serie.observaciones.length > 1 ? (
        <View style={estilos.pasos}>
          <View style={estilos.paso}>
            <Boton texto={`‹ ${COPY_ANTROPOMETRIA.observacionAnterior}`} tipo="secundario" deshabilitado={indice <= 0} onPress={() => setElegida(Math.max(0, indice - 1))} />
          </View>
          <View style={estilos.paso}>
            <Boton texto={`${COPY_ANTROPOMETRIA.observacionSiguiente} ›`} tipo="secundario" deshabilitado={indice >= serie.observaciones.length - 1} onPress={() => setElegida(Math.min(serie.observaciones.length - 1, indice + 1))} />
          </View>
        </View>
      ) : null}
      {serie.grupos.length > 1 ? (
        <View>
          <Rotulo>{COPY_ANTROPOMETRIA.grupoDeLaMedida}</Rotulo>
          <Segmentos
            etiqueta={COPY_ANTROPOMETRIA.grupoDeLaMedida}
            opciones={serie.grupos.map((g) => ({ valor: g.comparabilityGroup, texto: nombreDelGrupo(g, serie.grupos) }))}
            valor={serie.grupo ?? serie.grupos[0]!.comparabilityGroup}
            alElegir={(g) => {
              setGrupoPedido(g);
              setElegida(null);
            }}
          />
          <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
        </View>
      ) : null}
      <Desplegable titulo={COPY_ANTROPOMETRIA.laEvolucionEnLista} detalle={`${numero(serie.observaciones.length)} con dato en el período`}>
        <ListaDeLaSerie filas={serie.filas} />
      </Desplegable>
    </View>
  );
}

/**
 * El gráfico de puntos grande. La etiqueta con el valor va sobre la observación elegida; la última del período se
 * distingue con un punto más grande. El lector de pantalla oye un resumen y recorre la lista equivalente.
 */
export function GraficoConFechas({
  observaciones,
  periodo,
  zonaHoraria,
  nombre,
  elegida,
  alElegir,
}: {
  observaciones: readonly Observacion[];
  periodo: Periodo;
  zonaHoraria: string;
  nombre: string;
  elegida: number;
  alElegir: (i: number) => void;
}) {
  const { fontScale } = useWindowDimensions();
  const escala = Math.max(1, fontScale);
  const [ancho, setAncho] = useState(0);
  const alto = Math.round(190 + 46 * Math.min(escala, 2));
  const grafico: ComposicionDelGrafico | null = useMemo(
    () =>
      ancho > 0
        ? componerGrafico({
            observaciones,
            periodo,
            zonaHoraria,
            ancho,
            alto,
            escalaDeLetra: escala,
            anchoDelTexto: anchoEstimado,
            formatoDelValor: (v) => numero(v),
            formatoDeLaFecha: (f) => fechaCivil(f).replace(/ \d{4}$/, ''),
          })
        : null,
    [observaciones, periodo, zonaHoraria, ancho, alto, escala],
  );
  const ultima = observaciones[observaciones.length - 1]!;
  const resumen = `${nombre}: ${numero(observaciones.length)} ${observaciones.length === 1 ? 'medición' : 'mediciones'} entre ${fechaCivil(periodo.start)} y ${fechaCivil(periodo.end)}; la última, ${cantidad(ultima.punto.value, ultima.punto.unit)} el ${fechaCivil(ultima.fecha)}.`;
  const letra = 12 * escala;
  const p = grafico?.puntos[elegida] ?? null;

  return (
    <View style={estilos.grafico} onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))} accessible accessibilityRole="image" accessibilityLabel={resumen}>
      {grafico ? (
        <Pressable
          onPress={(e) => {
            const i = puntoMasCercano(grafico, e.nativeEvent.locationX, e.nativeEvent.locationY, 28);
            if (i !== null) alElegir(i);
          }}
        >
          <Svg width={ancho} height={alto}>
            {grafico.marcasY.map((m) => (
              <G key={`y-${m.valor}`}>
                <Line x1={grafico.area.izquierda} x2={grafico.area.derecha} y1={m.y} y2={m.y} stroke={COLOR.borde} strokeWidth={1} />
                <TextoSvg x={grafico.area.izquierda - 6} y={m.y + letra * 0.35} fontSize={letra} fill={COLOR.tenue} textAnchor="end">
                  {numero(m.valor)}
                </TextoSvg>
              </G>
            ))}
            {grafico.marcasX.map((m) => (
              <TextoSvg key={`x-${m.fecha}`} x={m.x} y={alto - 8} fontSize={letra} fill={COLOR.tenue} textAnchor="middle">
                {fechaCivil(m.fecha).replace(/ \d{4}$/, '')}
              </TextoSvg>
            ))}
            {/* Una guía vertical fina bajo la observación elegida, para leer su fecha. No une observaciones. */}
            {p ? <Line x1={p.x} x2={p.x} y1={grafico.area.arriba} y2={grafico.area.abajo} stroke={COLOR.tenue} strokeWidth={1} strokeDasharray={[3, 4]} /> : null}
            {grafico.puntos.map((q) => {
              const esUltima = q.indice === grafico.puntos.length - 1;
              return <Circle key={q.observacion.punto.sourceId} cx={q.x} cy={q.y} r={esUltima ? 7 : 5} fill={COLOR.acento} stroke={COLOR.superficie} strokeWidth={1.5} />;
            })}
            {p ? <Circle cx={p.x} cy={p.y} r={11} fill="none" stroke={COLOR.texto} strokeWidth={2} /> : null}
            {p ? <Etiqueta grafico={grafico} x={p.x} y={p.y} texto={cantidad(p.observacion.punto.value, p.observacion.punto.unit)} letra={letra} /> : null}
          </Svg>
        </Pressable>
      ) : (
        <View style={{ height: alto }} />
      )}
    </View>
  );
}

/** La etiqueta del valor elegido, arriba del punto, siempre dentro del gráfico. */
function Etiqueta({ grafico, x, y, texto, letra }: { grafico: ComposicionDelGrafico; x: number; y: number; texto: string; letra: number }) {
  const ancho = anchoEstimado(texto, letra, true) + 16;
  const alto = letra * 1.6;
  const izquierda = Math.min(Math.max(x - ancho / 2, 2), grafico.ancho - ancho - 2);
  const arriba = Math.max(2, y - 18 - alto);
  return (
    <G>
      <Rect x={izquierda} y={arriba} width={ancho} height={alto} rx={alto / 2} fill={COLOR.superficieElevada} stroke={COLOR.borde} strokeWidth={1} />
      <TextoSvg x={izquierda + ancho / 2} y={arriba + alto * 0.68} fontSize={letra} fontWeight="700" fill={COLOR.texto} textAnchor="middle">
        {texto}
      </TextoSvg>
    </G>
  );
}

/** Lo que dice la observación elegida, completo y en palabras: fecha, valor, protocolo y método, origen y corrección. */
function DetalleDeLaObservacion({ observacion, esLaUltima }: { observacion: Observacion; esLaUltima: boolean }) {
  const { punto, grupo, delDia } = observacion;
  const metodo = grupo?.methodVersionId ? nombreDeMetodo(grupo.methodVersionId) : null;
  const delDiaTexto = delDia.total > 1 ? ` · ${delDia.orden} de ${delDia.total} del día` : '';
  return (
    <Tarjeta>
      <View accessible accessibilityLiveRegion="polite">
        <Text style={estilos.fechaDelDetalle}>{`${fecha(punto.occurredAt)}${delDiaTexto}`}</Text>
        <Cifra valor={numero(punto.value)} unidad={punto.unit} tamano={24} />
        {grupo ? <Parrafo tenue>{grupo.protocolName}{metodo ? ` · ${COPY_ANTROPOMETRIA.metodoDelResultado}: ${metodo}` : ''}</Parrafo> : null}
        <Parrafo tenue>{`${COPY_ANTROPOMETRIA.origenDelDato}: ${ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]}${punto.correctionState === 'CORRECTED' ? ` · ${COPY_ANTROPOMETRIA.corregida}` : ''}`}</Parrafo>
        {/* Sin elección de días (DL-118), la última es la del período que trajo la lectura. */}
        {esLaUltima ? <Parrafo tenue>Es la última del período.</Parrafo> : null}
      </View>
    </Tarjeta>
  );
}

/** Las mediciones del grupo y los días sin dato, dentro del período: lo mismo que el gráfico, de las mismas filas. */
function ListaDeLaSerie({ filas }: { filas: readonly FilaDeEvolucion[] }) {
  return (
    <View>
      {filas.map((f) =>
        f.tipo === 'observacion' ? (
          <PuntoDeLaSerie key={f.observacion.punto.sourceId} punto={f.observacion.punto} metodo={nombreDeMetodo(f.observacion.grupo?.methodVersionId ?? null)} />
        ) : (
          <HuecoDeLaSerie key={`hueco-${f.hueco.from}`} hueco={f.hueco} />
        ),
      )}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  detalle: { marginTop: 8 },
  grafico: { marginVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, overflow: 'hidden' },
  fechaDelDetalle: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, marginBottom: 2 },
  pasos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paso: { flexGrow: 1, flexBasis: 140 },
  valorYCambio: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 12, rowGap: 2, marginTop: 4 },
  valorGrande: { fontWeight: '800', color: COLOR.texto },
  unidadChica: { fontSize: 15, fontWeight: '700', color: COLOR.tenue },
  cambio: { marginLeft: 'auto', alignItems: 'flex-end' },
  diferencia: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: COLOR.acento, textAlign: 'right' },
  respecto: { fontSize: 13, lineHeight: 17, color: COLOR.tenue, textAlign: 'right' },
  motivo: { flexBasis: '100%', fontSize: 13, lineHeight: 18, color: COLOR.tenue },
  valorApilado: { marginTop: 4, rowGap: 2 },
  respectoEnLinea: { fontSize: 13, lineHeight: 21, color: COLOR.tenue },
  compacto: { marginTop: 6 },
  valores: { marginTop: 4, borderRadius: 10, backgroundColor: COLOR.superficieElevada, paddingVertical: 4, paddingHorizontal: 10 },
  textoDeValores: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: COLOR.texto, textAlign: 'center' },
  valorElegido: { fontWeight: '800', color: COLOR.acento },
}));
