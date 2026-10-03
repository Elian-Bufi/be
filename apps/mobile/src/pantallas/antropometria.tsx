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
  CODIGOS_DE_SESION_NO_VALIDA,
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
  type Resultado,
  type UltimaToma,
} from '@be/domain';
import { memo, useCallback, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { useLecturaRecordada } from '../lecturas';
import { dia, fecha, fechaCivil } from '../formato';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Ayuda, Boton, Desplegable, estilosPorTema, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';
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
/**
 * La API mira de a 92 días como mucho. Si los últimos 90 no tienen ninguna medición, se mira hacia atrás, de a 90 días y
 * hasta un año: quien se mide cada tres o cuatro meses tiene que ver su última toma. La pantalla dice qué período
 * muestra. Si tampoco hay nada, queda el período actual, que dice que no hay mediciones.
 */
async function leerMiEvolucion(token: string): Promise<Resultado<Datos>> {
  const r = await api.miEvolucionAntropometrica(token);
  if (!r.ok) return r;
  let datos = r.datos.data;
  for (let i = 0; i < 3 && sinMediciones(datos); i++) {
    const anterior = await api.miEvolucionAntropometrica(token, periodoAnterior(datos.period.start));
    // Una sesión que ya no sirve corta la búsqueda y se informa; cualquier otra falla deja lo que ya se tiene.
    if (!anterior.ok && anterior.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(anterior.codigo)) return anterior;
    if (!anterior.ok) break;
    datos = anterior.datos.data;
  }
  return { ok: true, datos: sinMediciones(datos) ? r.datos.data : datos };
}

export function PantallaDeMiEvolucion({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(() => leerMiEvolucion(token), [token]);
  // Al volver a la zona se ve lo último leído en esta sesión mientras se vuelve a pedir (src/lecturas.ts).
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mi-evolucion', pedir, sesionPerdida);
  // DL-115 · con el A3 revocado o nunca otorgado, lo propio no se lee (08:406). No es un error ni «sin mediciones»: los
  // datos siguen guardados. Cada visita vuelve a preguntar a la API; si niega el acceso, lo recordado se borra.
  const sinA3 = r !== null && !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';

  return (
    <View>
      <Titulo>{COPY_ANTROPOMETRIA.miEvolucion}</Titulo>
      <SinActualizar visible={sinActualizar} onReintentar={cargar} />
      {r === null ? <Cargando /> : null}
      {r && !r.ok && !sinA3 ? <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} /> : null}
      {sinA3 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.evolucionNecesitaA3}>
          <Boton texto={COPY_ANTROPOMETRIA.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      ) : null}
      {r?.ok ? <Evolucion datos={r.datos} /> : null}
    </View>
  );
}

/**
 * El resumen de la toma se calcula una vez por respuesta: al volver a la zona con lo recordado, no se repite. Se guarda
 * con la respuesta como clave débil, así se va con ella cuando se olvida.
 */
const resumenes = new WeakMap<Datos, UltimaToma | null>();
function resumenDe(datos: Datos): UltimaToma | null {
  let resumen = resumenes.get(datos);
  if (resumen === undefined) {
    resumen = ultimaToma(datos);
    resumenes.set(datos, resumen);
  }
  return resumen;
}

/**
 * El orden de la pantalla (Dirección, 2026-10-01: que se lea de un vistazo): arriba la toma con la figura; después los
 * resultados de las fórmulas; después la evolución por medida. Cada explicación queda plegada en su «Cómo se lee».
 *
 * DL-113 · cada fecha se dice una vez: la de la toma en su título; con cuál se compara, en la línea de abajo; y el
 * período, en la evolución por medida, que es lo que abarca. Antes iban las tres seguidas arriba de todo.
 */
const Evolucion = memo(function Evolucion({ datos }: { datos: Datos }) {
  const conDatos = datos.metrics.filter((s) => s.series.length > 0);
  const toma = resumenDe(datos);
  const periodo = `${COPY_ANTROPOMETRIA.periodo}: ${dia(`${datos.period.start}T12:00:00Z`)} — ${dia(`${datos.period.end}T12:00:00Z`)}`;
  return (
    <>
      {conDatos.length === 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones}>
          <Parrafo tenue>Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.</Parrafo>
          <Parrafo tenue>{periodo}</Parrafo>
        </Aviso>
      ) : null}
      {toma ? <LaUltimaToma toma={toma} /> : null}
      {toma && toma.derivadas.length > 0 ? <ResultadosDeLasFormulas toma={toma} /> : null}
      {conDatos.length > 0 ? (
        <Seccion titulo={COPY_ANTROPOMETRIA.evolucionPorMedida}>
          <Parrafo tenue>{periodo}</Parrafo>
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
});

/** El orden de las familias en la lista: el de la lámina (perímetros, después pliegues). */
const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/**
 * Las familias cortas van en fichas, una al lado de la otra: peso y talla, y los tres diámetros óseos (referencia
 * estética de Dirección, 2026-10-03). Las demás, en filas.
 */
const EN_FICHAS: ReadonlySet<FamiliaDeMedicion> = new Set(['MASA_Y_ESTATURA', 'DIAMETROS']);

/** Las medidas de la toma agrupadas por familia, en el orden de la lámina, con un subtítulo por familia. */
function ListaPorFamilia({ medidas, fechaComparada }: { medidas: readonly MedidaDeLaToma[]; fechaComparada: string | null }) {
  return (
    <>
      {FAMILIAS.map((familia) => {
        const deLaFamilia = medidas.filter((m) => (FAMILIA_DE_METRICA[m.metrica] ?? 'OTRAS') === familia);
        if (deLaFamilia.length === 0) return null;
        return (
          <View key={familia}>
            <Subtitulo>{ETIQUETA_DE_FAMILIA[familia]}</Subtitulo>
            {EN_FICHAS.has(familia) ? (
              <View style={estilos.fichas}>
                {deLaFamilia.map((m) => (
                  <FichaDeLaToma key={m.metrica} medida={m} fechaComparada={fechaComparada} />
                ))}
              </View>
            ) : (
              deLaFamilia.map((m) => <FilaDeLaToma key={m.metrica} medida={m} fechaComparada={fechaComparada} />)
            )}
          </View>
        );
      })}
    </>
  );
}

/** Lo que el lector de pantalla dice de una medida, en una sola frase, sea fila o ficha. */
function fraseDeLaMedida(medida: MedidaDeLaToma, fechaComparada: string | null, metodo: string | null = null): string {
  const { actual, anterior, diferencia } = medida;
  const antes = anterior
    ? `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}${anterior.fecha === fechaComparada ? '' : `, el ${fechaCivil(anterior.fecha)}`}`
    : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  const cambio = diferencia ? `${COPY_ANTROPOMETRIA.diferencia}: ${textoDeDiferenciaAntropometrica(diferencia)}` : null;
  const clase = actual.punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[actual.punto.dataClass];
  const corregida = actual.punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null;
  return [medida.nombre, cantidad(actual.punto.value, actual.punto.unit), metodo, antes, cambio, clase, corregida].filter(Boolean).join('. ');
}

/**
 * Una ficha: el nombre, el valor grande y, debajo, la diferencia y el anterior. Con letra grande, las fichas ocupan más
 * ancho y bajan a la línea siguiente, en vez de partir el valor.
 */
function FichaDeLaToma({ medida, fechaComparada }: { medida: MedidaDeLaToma; fechaComparada: string | null }) {
  const { fontScale } = useWindowDimensions();
  const { actual, anterior, diferencia } = medida;
  const clase = actual.punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[actual.punto.dataClass];
  const corregida = actual.punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null;
  return (
    <View style={[estilos.ficha, { minWidth: 96 * Math.min(fontScale, 2.2) }]} accessible accessibilityLabel={fraseDeLaMedida(medida, fechaComparada)}>
      <Text style={estilos.nombreDeFicha}>{medida.nombre}</Text>
      <Text style={estilos.valorDeFicha}>{cantidad(actual.punto.value, actual.punto.unit)}</Text>
      {diferencia ? <Text style={estilos.diferenciaDeFicha}>{textoDeDiferenciaAntropometrica(diferencia)}</Text> : null}
      <Text style={estilos.detalle}>
        {anterior
          ? `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}${anterior.fecha === fechaComparada ? '' : `, el ${fechaCivil(anterior.fecha)}`}`
          : COPY_ANTROPOMETRIA.sinAnteriorComparable}
      </Text>
      {clase || corregida ? <Text style={estilos.detalle}>{[clase, corregida].filter(Boolean).join(' · ')}</Text> : null}
    </View>
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
    <Seccion titulo={`${COPY_ANTROPOMETRIA.tuUltimaToma}: ${fechaCivil(toma.fecha)}`}>
      {/* Una línea: con cuál se compara y qué hay. Son cantidades reales de la toma, no un indicador. */}
      <Parrafo tenue>
        {[
          toma.fechaAnterior ? `${COPY_ANTROPOMETRIA.comparadaCon} ${fechaCivil(toma.fechaAnterior)}` : COPY_ANTROPOMETRIA.sinAnteriorComparable,
          `${numero(toma.medidas.length)} ${toma.medidas.length === 1 ? 'medida' : 'medidas'}`,
          toma.derivadas.length > 0 ? `${numero(toma.derivadas.length)} ${toma.derivadas.length === 1 ? 'resultado de fórmula' : 'resultados de fórmulas'}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Parrafo>
      <FiguraDeLaToma medidas={toma.medidas} />
      <ListaPorFamilia medidas={fueraDeLaFigura} fechaComparada={toma.fechaAnterior} />
      {enLaFigura.length > 0 ? (
        <Desplegable titulo="La figura, en lista" detalle={enLaFigura.length === 1 ? '1 medida, con su valor anterior' : `${numero(enLaFigura.length)} medidas, con su valor anterior`}>
          <ListaPorFamilia medidas={enLaFigura} fechaComparada={toma.fechaAnterior} />
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
        <FilaDeLaToma key={`${m.metrica}-${m.actual.punto.comparabilityGroup}`} medida={m} conMetodo fechaComparada={toma.fechaAnterior} />
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
function FilaDeLaToma({ medida, conMetodo = false, fechaComparada }: { medida: MedidaDeLaToma; conMetodo?: boolean; fechaComparada: string | null }) {
  const { actual, anterior, diferencia } = medida;
  const valor = cantidad(actual.punto.value, actual.punto.unit);
  const metodo = conMetodo ? `${COPY_ANTROPOMETRIA.metodoDelResultado}: ${nombreDeMetodo(actual.grupo?.methodVersionId ?? null) ?? COPY_ANTROPOMETRIA.metodoSinNombre}` : null;
  // La fecha del anterior ya está arriba («Comparada con…»): en la fila va solo si este valor viene de otra toma.
  const antes = anterior
    ? `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}${anterior.fecha === fechaComparada ? '' : `, el ${fechaCivil(anterior.fecha)}`}`
    : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  const clase = actual.punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[actual.punto.dataClass];
  const corregida = actual.punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null;
  // Compacta (referencia estética de Dirección, 2026-10-03): el nombre con el valor a la derecha y, en una sola línea
  // debajo, la diferencia y el anterior. El lector de pantalla sigue leyendo la frase completa.
  return (
    <View style={estilos.fila} accessible accessibilityLabel={fraseDeLaMedida(medida, fechaComparada, metodo)}>
      <View style={estilos.cabezaDeFila}>
        <Text style={estilos.nombre}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{valor}</Text>
      </View>
      {metodo ? <Text style={estilos.detalle}>{metodo}</Text> : null}
      <Text style={estilos.detalle}>
        {diferencia ? <Text style={estilos.diferencia}>{`${textoDeDiferenciaAntropometrica(diferencia)}  ·  `}</Text> : null}
        {antes}
      </Text>
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
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 9 },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  ficha: { flexGrow: 1, flexBasis: 0, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.fondo },
  nombreDeFicha: { fontSize: 13, fontWeight: '600', color: COLOR.tenue },
  valorDeFicha: { fontSize: 22, fontWeight: '800', color: COLOR.texto, marginTop: 2 },
  diferenciaDeFicha: { fontSize: 14, fontWeight: '700', color: COLOR.texto, marginTop: 2 },
  cabezaDeFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  valor: { fontSize: 18, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 14, color: COLOR.tenue, marginTop: 2 },
  diferencia: { fontSize: 14, fontWeight: '700', color: COLOR.texto },
  serie: { borderTopWidth: 1, borderTopColor: COLOR.borde },
  cabezaDeSerie: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  textoDeCabeza: { flexShrink: 1 },
  accion: { fontSize: 15, fontWeight: '700', color: COLOR.acento },
  presionado: { opacity: 0.8 },
}));
