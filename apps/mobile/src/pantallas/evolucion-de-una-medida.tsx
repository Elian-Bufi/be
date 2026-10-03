/**
 * APK · «Mi evolución» → Evolución: la lectura en el tiempo de una medida (tanda del 2026-10-03).
 *
 * - **Una medida por vez.** Se elige de la lista de las que tienen mediciones en el período, agrupadas por familia.
 * - **Los días.** 30, 60 o 90, dentro del período que ya trajo la API (hasta 92 días). Es un recorte en el teléfono: no
 *   hace pedidos nuevos.
 * - **Un grupo de comparabilidad por vez.** Si la medida tiene observaciones con otro protocolo, método o unidad, se
 *   elige el grupo; nunca se mezclan en un eje (REG-06-162/164).
 * - **El gráfico es de puntos sobre un eje temporal a escala**, sin líneas ni áreas entre tomas (REG-06-166). La
 *   geometría está en `src/grafico-de-evolucion.ts`, con sus pruebas.
 * - **Elegir una observación.** Con un toque, o con «Anterior» y «Siguiente», que también alcanzan a dos puntos casi
 *   encimados. El detalle dice fecha, valor, unidad, protocolo y método, cómo se obtuvo y si se corrigió.
 * - **La lista equivalente** tiene los mismos datos, con los días sin dato: es el camino del lector de pantalla.
 * Lo elegido (medida, días y grupo) se recuerda mientras dure la sesión.
 */
import {
  cantidad,
  compararPorCatalogo,
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_CLASE_DE_DATO,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  grupoVigente,
  metricaVigente,
  nombreDelGrupo,
  nombreDeMetodo,
  nombreDeMetrica,
  numero,
  observacionesDelGrupo,
  prepararSerie,
  type EvolucionResponse,
  type FamiliaDeMedicion,
  type Observacion,
  type SerieApi,
} from '@be/domain';
import { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as TextoSvg } from 'react-native-svg';
import { anchoEstimado } from '../composicion-de-la-figura';
import { fecha, fechaCivil } from '../formato';
import { componerGrafico, puntoMasCercano, type ComposicionDelGrafico } from '../grafico-de-evolucion';
import { useSeleccionRecordada } from '../lecturas';
import { Aviso, Ayuda, Boton, Cifra, COLOR, Desplegable, estilosPorTema, Parrafo, Rotulo, Segmentos, Tarjeta } from '../ui';
import { HuecoDeLaSerie, PuntoDeLaSerie } from './serie-en-lista';

type Datos = EvolucionResponse['data'];
const DIAS = ['30', '60', '90'] as const;
type Dias = (typeof DIAS)[number];
const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/** Los últimos `dias` días civiles del período, sin salirse de él. */
function recortarPeriodo(periodo: Datos['period'], dias: number): { start: string; end: string } {
  const fin = new Date(`${periodo.end}T12:00:00Z`);
  const desde = new Date(fin);
  desde.setUTCDate(desde.getUTCDate() - (dias - 1));
  const start = desde.toISOString().slice(0, 10);
  return { start: start < periodo.start ? periodo.start : start, end: periodo.end };
}

export function EvolucionDeUnaMedida({ datos, token }: { datos: Datos; token: string }) {
  const conDatos = useMemo(() => [...datos.metrics.filter((m) => m.series.length > 0)].sort((a, b) => compararPorCatalogo(a.metricCode, b.metricCode)), [datos]);
  const [pedida, setPedida] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:medida', null);
  const [dias, setDias] = useSeleccionRecordada<Dias>(token, 'mi-evolucion:dias', '90');
  const metrica = metricaVigente(conDatos, pedida);
  const serieApi = conDatos.find((m) => m.metricCode === metrica) ?? null;
  const preparada = useMemo(() => (serieApi ? prepararSerie(serieApi, datos.period.timeZone) : null), [serieApi, datos.period.timeZone]);
  const [grupoPedido, setGrupoPedido] = useSeleccionRecordada<string | null>(token, `mi-evolucion:grupo:${metrica ?? ''}`, null);
  const periodo = recortarPeriodo(datos.period, Number(dias));
  const grupo = preparada ? grupoVigente(preparada, grupoPedido) : null;
  const observaciones = useMemo(
    () => (preparada && grupo ? observacionesDelGrupo(preparada, grupo).filter((o) => o.fecha >= periodo.start && o.fecha <= periodo.end) : []),
    [preparada, grupo, periodo.start, periodo.end],
  );
  const [elegida, setElegida] = useState<number | null>(null);
  // Si cambian la medida, los días o el grupo, queda elegida la última observación.
  const indice = elegida !== null && elegida < observaciones.length ? elegida : observaciones.length - 1;

  if (!serieApi || !preparada || !metrica) return <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones} />;
  const gruposUsados = preparada.grupos.filter((g) => preparada.observaciones.some((o) => o.punto.comparabilityGroup === g.comparabilityGroup));
  const unidad = observaciones[0]?.punto.unit ?? preparada.observaciones[0]?.punto.unit ?? '';
  const elegir = (i: number | null) => setElegida(i);

  return (
    <View>
      <SelectorDeMedida metricas={conDatos} elegida={metrica} alElegir={(m) => { setPedida(m); setElegida(null); }} />
      <Segmentos
        etiqueta={COPY_ANTROPOMETRIA.ultimosDias}
        opciones={DIAS.map((d) => ({ valor: d, texto: `${d} días` }))}
        valor={dias}
        alElegir={(d) => {
          setDias(d);
          setElegida(null);
        }}
      />
      {gruposUsados.length > 1 ? (
        <>
          <Rotulo>{COPY_ANTROPOMETRIA.grupoDeLaMedida}</Rotulo>
          <Segmentos
            etiqueta={COPY_ANTROPOMETRIA.grupoDeLaMedida}
            opciones={gruposUsados.map((g) => ({ valor: g.comparabilityGroup, texto: nombreDelGrupo(g, gruposUsados) }))}
            valor={grupo ?? gruposUsados[0]!.comparabilityGroup}
            alElegir={(g) => {
              setGrupoPedido(g);
              setElegida(null);
            }}
          />
        </>
      ) : null}
      <Parrafo tenue>
        {`${fechaCivil(periodo.start)} — ${fechaCivil(periodo.end)} · ${unidad}`}
      </Parrafo>

      {observaciones.length === 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMedicionesDeLaMedida} />
      ) : (
        <>
          <GraficoDeEvolucion observaciones={observaciones} periodo={periodo} zonaHoraria={datos.period.timeZone} nombre={nombreDeMetrica(metrica)} elegida={indice} alElegir={elegir} />
          <DetalleDeLaObservacion observacion={observaciones[indice]!} esLaUltima={indice === observaciones.length - 1} />
          <View style={estilos.pasos}>
            <View style={estilos.paso}>
              <Boton texto={`‹ ${COPY_ANTROPOMETRIA.observacionAnterior}`} tipo="secundario" deshabilitado={indice <= 0} onPress={() => elegir(Math.max(0, indice - 1))} />
            </View>
            <View style={estilos.paso}>
              <Boton texto={`${COPY_ANTROPOMETRIA.observacionSiguiente} ›`} tipo="secundario" deshabilitado={indice >= observaciones.length - 1} onPress={() => elegir(Math.min(observaciones.length - 1, indice + 1))} />
            </View>
          </View>
        </>
      )}

      <Desplegable titulo={COPY_ANTROPOMETRIA.laEvolucionEnLista} detalle={`${numero(observaciones.length)} con dato en estos días`}>
        <ListaDeLaSerie serie={serieApi} desde={periodo.start} hasta={periodo.end} />
      </Desplegable>
      <Ayuda>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDelGrafico}</Parrafo>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeSinDato}</Parrafo>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
      </Ayuda>
    </View>
  );
}

/** La medida que se ve y, al tocar «Cambiar de medida», la lista de las que tienen mediciones, por familia. */
function SelectorDeMedida({ metricas, elegida, alElegir }: { metricas: readonly SerieApi[]; elegida: string; alElegir: (m: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={estilos.selector}>
      <View style={estilos.cabezaDelSelector}>
        <View style={estilos.textoDelSelector}>
          <Text style={estilos.rotuloDelSelector}>{COPY_ANTROPOMETRIA.medida.toLocaleUpperCase('es-AR')}</Text>
          <Text style={estilos.medidaElegida}>{nombreDeMetrica(elegida)}</Text>
        </View>
        <Boton texto={abierto ? 'Listo' : COPY_ANTROPOMETRIA.cambiarDeMedida} tipo="secundario" onPress={() => setAbierto((a) => !a)} />
      </View>
      {abierto
        ? FAMILIAS.map((familia) => {
            const deLaFamilia = metricas.filter((m) => (FAMILIA_DE_METRICA[m.metricCode] ?? 'OTRAS') === familia);
            if (deLaFamilia.length === 0) return null;
            return (
              <View key={familia}>
                <Rotulo>{ETIQUETA_DE_FAMILIA[familia]}</Rotulo>
                <Segmentos
                  etiqueta={ETIQUETA_DE_FAMILIA[familia]}
                  opciones={deLaFamilia.map((m) => ({ valor: m.metricCode, texto: nombreDeMetrica(m.metricCode) }))}
                  valor={elegida}
                  alElegir={(m) => {
                    alElegir(m);
                    setAbierto(false);
                  }}
                />
              </View>
            );
          })
        : null}
    </View>
  );
}

/**
 * El gráfico de puntos. La etiqueta con el valor va sobre la observación elegida; la última del período se distingue
 * con un punto más grande. El lector de pantalla oye un resumen y recorre la lista equivalente.
 */
function GraficoDeEvolucion({
  observaciones,
  periodo,
  zonaHoraria,
  nombre,
  elegida,
  alElegir,
}: {
  observaciones: readonly Observacion[];
  periodo: { start: string; end: string };
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
    <View
      style={estilos.grafico}
      onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))}
      accessible
      accessibilityRole="image"
      accessibilityLabel={resumen}
    >
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
        {esLaUltima ? <Parrafo tenue>{COPY_ANTROPOMETRIA.esLaUltima}</Parrafo> : null}
      </View>
    </Tarjeta>
  );
}

/** Los puntos y los días sin dato de la serie, dentro de los días elegidos: la misma información que el gráfico. */
function ListaDeLaSerie({ serie, desde, hasta }: { serie: SerieApi; desde: string; hasta: string }) {
  const tramos = [
    ...serie.series.filter((p) => p.occurredAt.slice(0, 10) >= desde && p.occurredAt.slice(0, 10) <= hasta).map((punto) => ({ orden: punto.occurredAt.slice(0, 10), tipo: 'punto' as const, punto })),
    ...serie.gaps.filter((h) => h.to >= desde && h.from <= hasta).map((hueco) => ({ orden: hueco.from, tipo: 'hueco' as const, hueco })),
  ].sort((a, b) => a.orden.localeCompare(b.orden));
  return (
    <View>
      {tramos.map((t) =>
        t.tipo === 'punto' ? (
          <PuntoDeLaSerie key={t.punto.sourceId} punto={t.punto} metodo={nombreDeMetodo(serie.comparability.groups.find((g) => g.comparabilityGroup === t.punto.comparabilityGroup)?.methodVersionId ?? null)} />
        ) : (
          <HuecoDeLaSerie key={`hueco-${t.hueco.from}`} hueco={t.hueco} />
        ),
      )}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  selector: { marginVertical: 4 },
  cabezaDelSelector: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  textoDelSelector: { flexShrink: 1, minWidth: 140 },
  rotuloDelSelector: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: COLOR.tenue },
  medidaElegida: { fontSize: 20, fontWeight: '800', color: COLOR.texto },
  grafico: { marginVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficie, overflow: 'hidden' },
  fechaDelDetalle: { fontSize: 14, fontWeight: '700', color: COLOR.tenue, marginBottom: 2 },
  pasos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paso: { flexGrow: 1, flexBasis: 140 },
}));
