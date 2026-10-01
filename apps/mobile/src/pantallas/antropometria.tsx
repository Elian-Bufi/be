/**
 * APK · «Mi evolución» (RF-049, RF-065; API-ANT-06 del lado del asesorado; B10-07; DL-111).
 *
 * La persona ve su evolución antropométrica en tres partes, todas sobre la misma lectura de la API:
 * 1. **Tu última toma**: la figura de la lámina de Dirección con los sitios medidos y la lista de medidas por familia,
 *    cada una con su valor anterior comparable y la diferencia como una resta (`ultimaToma`, en @be/domain);
 * 2. **Resultados de las fórmulas**: lo que el profesional calculó con un método del catálogo de BE, con el nombre del
 *    método y el anterior del mismo método (dos métodos distintos nunca se comparan);
 * 3. **Evolución por medida**: la serie de cada medida, con sus huecos.
 *
 * Para que se lea de un vistazo (Dirección, 2026-10-01), la figura va arriba y cada explicación queda plegada en su
 * «Cómo se lee»; la lista de lo que la figura ya muestra, en «La figura, en lista». Nada se borra: se pliega.
 *
 * Con las mismas honestidades que el website:
 * - un tramo sin medición vigente llega como **hueco**, con su rango y su cantidad de días, y no se completa con cero
 *   ni arrastra el valor anterior (REG-06-165/166; INV-06-176/177);
 * - cada punto conserva su clase —medido, reportado o calculado— y dice si su valor vigente viene de una corrección
 *   (04:1090; INV-06-178; REG-06-16);
 * - un tramo no comparable se señala con su motivo, en vez de convertirse en silencio (REG-06-162/163/164);
 * - nada se califica (TEST-PRJ-009): una diferencia es un número con signo, sin color de «mejor» o «peor».
 *
 * Por eso tampoco hay gráfico de línea: una línea tendría que inventar el tramo que falta. La lista es la forma honesta
 * de mostrar una serie con huecos, y en una pantalla de teléfono además es la legible.
 *
 * La pantalla es de solo lectura: el asesorado no corrige ni anula mediciones (eso es del profesional, REG-06-219).
 * Cada valor se escribe con `cantidad`/`numero` de `@be/domain`, con la coma decimal del país.
 */
import {
  cantidad,
  compararPorCatalogo,
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_CLASE_DE_DATO,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  nombreDeMetodo,
  nombreDeMetrica,
  numero,
  textoDeDiferenciaAntropometrica,
  ultimaToma,
  type EvolucionResponse,
  type FamiliaDeMedicion,
  type MedidaDeLaToma,
  type SerieApi,
  type UltimaToma,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia, fecha, fechaCivil } from '../formato';
import { useSesionPerdida, type Salida } from '../navegacion';
import { Aviso, Ayuda, Desplegable, estilosPorTema, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';
import { estaEnLaFigura, FiguraDeLaToma } from './figura-de-la-toma';

type Datos = EvolucionResponse['data'];

const sinMediciones = (d: Datos): boolean => d.metrics.every((m) => m.series.length === 0);

/** Los 90 días civiles que terminan el día anterior a `inicio` (`AAAA-MM-DD`), para la API. */
function periodoAnterior(inicio: string): { periodStart: string; periodEnd: string } {
  const fin = new Date(`${inicio}T12:00:00Z`);
  fin.setUTCDate(fin.getUTCDate() - 1);
  const desde = new Date(fin);
  desde.setUTCDate(desde.getUTCDate() - 89);
  return { periodStart: desde.toISOString().slice(0, 10), periodEnd: fin.toISOString().slice(0, 10) };
}
type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: Datos } | { tipo: 'error'; sinConexion: boolean };

export function PantallaDeMiEvolucion({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.miEvolucionAntropometrica(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCarga({ tipo: 'error', sinConexion: r.tipo === 'RED' });
    // La API mira de a 92 días como mucho. Si los últimos 90 no tienen ninguna medición, se mira hacia atrás, de a
    // 90 días y hasta un año: quien se mide cada tres o cuatro meses tiene que ver su última toma. La pantalla dice
    // qué período muestra. Si tampoco hay nada, queda el período actual, que dice que no hay mediciones.
    let datos = r.datos.data;
    for (let i = 0; i < 3 && sinMediciones(datos); i++) {
      const anterior = await api.miEvolucionAntropometrica(token, periodoAnterior(datos.period.start));
      if (sesionPerdida(anterior)) return;
      if (!anterior.ok) break;
      datos = anterior.datos.data;
    }
    setCarga({ tipo: 'listo', datos: sinMediciones(datos) ? r.datos.data : datos });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <View>
      <Titulo>{COPY_ANTROPOMETRIA.miEvolucion}</Titulo>
      {carga.tipo === 'cargando' ? <Cargando /> : null}
      {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} /> : null}
      {carga.tipo === 'listo' ? <Evolucion datos={carga.datos} /> : null}
    </View>
  );
}

/**
 * El orden de la pantalla (Dirección, 2026-10-01: que se lea de un vistazo): arriba la toma con la figura; después los
 * resultados de las fórmulas; después la evolución por medida. Cada explicación queda plegada en su «Cómo se lee».
 */
function Evolucion({ datos }: { datos: Datos }) {
  const conDatos = datos.metrics.filter((s) => s.series.length > 0);
  const toma = ultimaToma(datos);
  return (
    <>
      <Parrafo tenue>
        {COPY_ANTROPOMETRIA.periodo}: {dia(`${datos.period.start}T12:00:00Z`)} — {dia(`${datos.period.end}T12:00:00Z`)}
      </Parrafo>
      {conDatos.length === 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones}>
          <Parrafo tenue>Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.</Parrafo>
        </Aviso>
      ) : null}
      {toma ? <LaUltimaToma toma={toma} /> : null}
      {toma && toma.derivadas.length > 0 ? <ResultadosDeLasFormulas toma={toma} /> : null}
      {conDatos.length > 0 ? (
        <Seccion titulo={COPY_ANTROPOMETRIA.evolucionPorMedida}>
          {[...conDatos]
            .sort((a, b) => compararPorCatalogo(a.metricCode, b.metricCode))
            .map((serie) => (
              <SerieDeLaMetrica key={serie.metricCode} serie={serie} />
            ))}
          <Ayuda>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeSinDato}</Parrafo>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
          </Ayuda>
        </Seccion>
      ) : null}
    </>
  );
}

/** El orden de las familias en la lista: el de la lámina (perímetros, después pliegues). */
const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/** Las medidas de la toma agrupadas por familia, en el orden de la lámina, con un subtítulo por familia. */
function ListaPorFamilia({ medidas }: { medidas: readonly MedidaDeLaToma[] }) {
  return (
    <>
      {FAMILIAS.map((familia) => {
        const deLaFamilia = medidas.filter((m) => (FAMILIA_DE_METRICA[m.metrica] ?? 'OTRAS') === familia);
        if (deLaFamilia.length === 0) return null;
        return (
          <View key={familia}>
            <Subtitulo>{ETIQUETA_DE_FAMILIA[familia]}</Subtitulo>
            {deLaFamilia.map((m) => (
              <FilaDeLaToma key={m.metrica} medida={m} />
            ))}
          </View>
        );
      })}
    </>
  );
}

/**
 * La toma, con la figura arriba. Lo que la figura ya muestra (perímetros y pliegues) queda en una lista plegada, con el
 * valor anterior, su fecha y la clase del dato: es la versión completa para leer —y la que recorre el lector de
 * pantalla, porque la figura no se recorre—. Lo que la figura no dibuja (peso, talla, diámetros…) va a la vista.
 */
function LaUltimaToma({ toma }: { toma: UltimaToma }) {
  const enLaFigura = toma.medidas.filter((m) => estaEnLaFigura(m.metrica));
  const fueraDeLaFigura = toma.medidas.filter((m) => !estaEnLaFigura(m.metrica));
  return (
    <Seccion titulo={COPY_ANTROPOMETRIA.tuUltimaToma}>
      {/* Una sola línea de contexto: de cuándo es la toma y con cuál se compara. */}
      <Parrafo>
        {COPY_ANTROPOMETRIA.tomaDel} {fechaCivil(toma.fecha)}
        {toma.fechaAnterior ? `. ${COPY_ANTROPOMETRIA.comparadaCon} ${fechaCivil(toma.fechaAnterior)}.` : null}
      </Parrafo>
      <FiguraDeLaToma medidas={toma.medidas} />
      <ListaPorFamilia medidas={fueraDeLaFigura} />
      {enLaFigura.length > 0 ? (
        <Desplegable titulo="La figura, en lista" detalle={enLaFigura.length === 1 ? '1 medida, con su valor anterior' : `${numero(enLaFigura.length)} medidas, con su valor anterior`}>
          <ListaPorFamilia medidas={enLaFigura} />
        </Desplegable>
      ) : null}
      <Ayuda>
        {enLaFigura.length > 0 ? <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeFigura}</Parrafo> : null}
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeDiferencia}</Parrafo>
      </Ayuda>
    </Seccion>
  );
}

function ResultadosDeLasFormulas({ toma }: { toma: UltimaToma }) {
  return (
    <Seccion titulo={COPY_ANTROPOMETRIA.resultadosDeLasFormulas}>
      {toma.derivadas.map((m) => (
        <FilaDeLaToma key={`${m.metrica}-${m.actual.punto.comparabilityGroup}`} medida={m} conMetodo />
      ))}
      <Ayuda>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeResultados}</Parrafo>
      </Ayuda>
    </Seccion>
  );
}

/**
 * Una medida de la toma: nombre y valor, el método si es un resultado de fórmula, y el anterior comparable con la
 * diferencia. El lector de pantalla la lee como una sola frase.
 */
function FilaDeLaToma({ medida, conMetodo = false }: { medida: MedidaDeLaToma; conMetodo?: boolean }) {
  const { actual, anterior, diferencia } = medida;
  const valor = cantidad(actual.punto.value, actual.punto.unit);
  const metodo = conMetodo ? `${COPY_ANTROPOMETRIA.metodoDelResultado}: ${nombreDeMetodo(actual.grupo?.methodVersionId ?? null) ?? COPY_ANTROPOMETRIA.metodoSinNombre}` : null;
  const antes = anterior ? `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}, el ${fechaCivil(anterior.fecha)}` : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  const cambio = diferencia ? `${COPY_ANTROPOMETRIA.diferencia}: ${textoDeDiferenciaAntropometrica(diferencia)}` : null;
  const clase = actual.punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[actual.punto.dataClass];
  const corregida = actual.punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null;
  return (
    <View style={estilos.fila} accessible accessibilityLabel={[medida.nombre, valor, metodo, antes, cambio, clase, corregida].filter(Boolean).join('. ')}>
      <View style={estilos.cabezaDeFila}>
        <Text style={estilos.nombre}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{valor}</Text>
      </View>
      {metodo ? <Text style={estilos.detalle}>{metodo}</Text> : null}
      <Text style={estilos.detalle}>{antes}</Text>
      {cambio ? <Text style={estilos.diferencia}>{cambio}</Text> : null}
      {clase || corregida ? <Text style={estilos.detalle}>{[clase, corregida].filter(Boolean).join(' · ')}</Text> : null}
    </View>
  );
}

/** La serie de una medida, plegada: abrirla muestra sus puntos y sus huecos. */
function SerieDeLaMetrica({ serie }: { serie: SerieApi }) {
  const [abierta, setAbierta] = useState(false);
  const diasSinDato = serie.gaps.reduce((n, g) => n + g.days, 0);
  const nombre = nombreDeMetrica(serie.metricCode);
  const resumen = `${numero(serie.series.length)} con dato · ${numero(diasSinDato)} ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`;
  /** Puntos y huecos, ordenados por fecha. Los huecos ya vienen agrupados en rangos desde la API. */
  const tramos = [
    ...serie.series.map((punto) => ({ orden: punto.occurredAt.slice(0, 10), tipo: 'punto' as const, punto })),
    ...serie.gaps.map((hueco) => ({ orden: hueco.from, tipo: 'hueco' as const, hueco })),
  ].sort((a, b) => a.orden.localeCompare(b.orden));

  return (
    <View style={estilos.serie}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${nombre}. ${resumen}. ${abierta ? COPY_ANTROPOMETRIA.ocultarEvolucion : COPY_ANTROPOMETRIA.verEvolucion}`}
        onPress={() => setAbierta((x) => !x)}
        style={({ pressed }) => [estilos.cabezaDeSerie, pressed && estilos.presionado]}
      >
        <View style={estilos.textoDeCabeza}>
          <Text style={estilos.nombre}>{nombre}</Text>
          <Text style={estilos.detalle}>{resumen}</Text>
        </View>
        <Text style={estilos.accion}>{abierta ? COPY_ANTROPOMETRIA.ocultarEvolucion : COPY_ANTROPOMETRIA.verEvolucion}</Text>
      </Pressable>
      {abierta
        ? tramos.map((t) =>
            t.tipo === 'punto' ? (
              <PuntoDeLaSerie key={t.punto.sourceId} punto={t.punto} metodo={nombreDeMetodo(serie.comparability.groups.find((g) => g.comparabilityGroup === t.punto.comparabilityGroup)?.methodVersionId ?? null)} />
            ) : (
              <HuecoDeLaSerie key={`hueco-${t.hueco.from}`} hueco={t.hueco} />
            ),
          )
        : null}
    </View>
  );
}

/** Un día con medición vigente; si es un resultado de fórmula, con el método que lo dio. */
function PuntoDeLaSerie({ punto, metodo }: { punto: SerieApi['series'][number]; metodo: string | null }) {
  return (
    <Tarjeta>
      <Subtitulo>{fecha(punto.occurredAt)}</Subtitulo>
      <Parrafo>{cantidad(punto.value, punto.unit)}</Parrafo>
      {punto.dataClass === 'DERIVED' ? (
        <Parrafo tenue>
          {COPY_ANTROPOMETRIA.metodoDelResultado}: {metodo ?? COPY_ANTROPOMETRIA.metodoSinNombre}
        </Parrafo>
      ) : null}
      <Insignia texto={ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]} etiqueta={`${COPY_ANTROPOMETRIA.origenDelDato}: ${ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]}`} />
      {punto.correctionState === 'CORRECTED' ? <Insignia texto={COPY_ANTROPOMETRIA.corregida} etiqueta={COPY_ANTROPOMETRIA.corregida} /> : null}
      {punto.incomparableWithPrevious.length > 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.noComparable}>
          <Parrafo tenue>{punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(' · ')}</Parrafo>
        </Aviso>
      ) : null}
    </Tarjeta>
  );
}

/**
 * Los días sin medición vigente, dichos como lo que son: un rango, sin valor, sin cero y sin nada que los una.
 * Agruparlos no es ocultarlos —se dicen todos, con sus fechas y su cantidad—: es evitar que noventa filas iguales
 * tapen los días que sí tienen medición.
 */
function HuecoDeLaSerie({ hueco }: { hueco: SerieApi['gaps'][number] }) {
  const desde = dia(`${hueco.from}T12:00:00Z`);
  const hasta = dia(`${hueco.to}T12:00:00Z`);
  const texto = hueco.days === 1 ? desde : `${desde} — ${hasta}`;
  const detalle = hueco.days === 1 ? COPY_ANTROPOMETRIA.sinDato : `${numero(hueco.days)} días ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`;
  return (
    <Tarjeta>
      <Subtitulo>{texto}</Subtitulo>
      <Insignia texto={detalle} etiqueta={`${texto}: ${detalle}`} />
    </Tarjeta>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 10 },
  cabezaDeFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  valor: { fontSize: 18, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 14, color: COLOR.tenue, marginTop: 2 },
  diferencia: { fontSize: 15, fontWeight: '600', color: COLOR.texto, marginTop: 2 },
  serie: { borderTopWidth: 1, borderTopColor: COLOR.borde },
  cabezaDeSerie: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  textoDeCabeza: { flexShrink: 1 },
  accion: { fontSize: 15, fontWeight: '700', color: COLOR.acento },
  presionado: { opacity: 0.8 },
}));
