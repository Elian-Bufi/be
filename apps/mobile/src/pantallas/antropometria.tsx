/**
 * APK · «Mi evolución» (RF-049, RF-065; API-ANT-06 del lado del asesorado; B10-07; DL-111; DL-117).
 *
 * La persona ve su evolución antropométrica en cuatro vistas, todas sobre la misma lectura de la API:
 * 1. **Mapa corporal**: la figura de la lámina de Dirección con los sitios medidos en la toma elegida. Cada sitio tiene
 *    su valor, la diferencia con el anterior comparable y su gráfico chico de puntos por toma (`figura-de-la-toma.tsx`);
 * 2. **Indicadores**: lo que no tiene un sitio en la figura (peso, talla, diámetros y los resultados de las fórmulas),
 *    en tarjetas sin cuerpo, cada una con su gráfico chico (`indicadores.tsx`);
 * 3. **Comparar**: la toma elegida frente a la anterior comparable, medida por medida (`comparar-tomas.tsx`);
 * 4. **Evolución**: una medida en el tiempo, con su gráfico de puntos a escala y su lista (`evolucion-de-una-medida.tsx`).
 *
 * Mapa corporal e Indicadores reemplazan a la vista «Toma» (cierre del 2026-10-04): son la misma toma, partida entre lo
 * que tiene sitio en la figura y lo que no. No suman un nivel de navegación.
 *
 * Con las mismas honestidades que el website:
 * - un tramo sin medición vigente llega como **hueco**, con su rango y su cantidad de días, y no se completa con cero
 *   ni arrastra el valor anterior (REG-06-165/166; INV-06-176/177);
 * - cada punto conserva su clase —medido, reportado o calculado— y dice si su valor vigente viene de una corrección
 *   (04:1090; INV-06-178; REG-06-16);
 * - un tramo no comparable se señala con su motivo, en vez de convertirse en silencio (REG-06-162/163/164);
 * - nada se califica (TEST-PRJ-009): una diferencia es un número con signo, sin color de «mejor» o «peor».
 *
 * Por eso tampoco hay gráfico de línea: una línea tendría que inventar el tramo que falta.
 *
 * La pantalla es de solo lectura: el asesorado no corrige ni anula mediciones (eso es del profesional, REG-06-219).
 * Cada valor se escribe con `cantidad`/`numero` de `@be/domain`, con la coma decimal del país.
 */
import {
  cantidad,
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  numero,
  textoDeDiferenciaAntropometrica,
  tomasDelPeriodo,
  type EvolucionResponse,
  type FamiliaDeMedicion,
  type MedidaDeLaToma,
  type TomaDelPeriodo,
  type UltimaToma,
} from '@be/domain';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { diasQueIncluyen, eleccionesDelPedido, otrasTomasDelDia, seVeElSelectorDeTomas, vistaDeLaToma, type Dias, type Vista } from '../disposicion-de-la-toma';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { dia, fechaCivil, fechaCorta } from '../formato';
import { puntosDeLaToma, resumenDe, type EnLaToma, type PuntosDeLaToma } from '../graficos-por-toma';
import { memoria, useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { leerMiEvolucion } from '../lecturas-de-las-zonas';
import { useSesionPerdida, type Ruta, type Salida, type VistaDeEvolucion } from '../navegacion';
import { comoSeLeenLosPuntos, enumerar, frasePorToma } from '../textos-por-toma';
import { Aviso, Ayuda, Boton, Desplegable, estilosPorTema, Parrafo, Rotulo, Segmentos, Titulo } from '../ui';
import { CompararTomas } from './comparar-tomas';
import { textoDeLaClase, textoDelAnterior, textoDelMetodo } from './detalle-de-la-medida';
import { EvolucionDeUnaMedida } from './evolucion-de-una-medida';
import { estaEnLaFigura, FiguraDeLaToma } from './figura-de-la-toma';
import { Indicadores } from './indicadores';
import { EvolucionPorToma } from './puntos-por-toma';

type Datos = EvolucionResponse['data'];

const sinMediciones = (d: Datos): boolean => d.metrics.every((m) => m.series.length === 0);

/**
 * Lo que una toma puede no mostrar, por cómo proyecta la API (D-3 en docs/ux/INICIO-Y-NAVEGACION.md). Va en «Cómo se
 * lee» del mapa y de los indicadores, para que una toma reconstruida no se lea como completa sin serlo.
 */
const QUE_PUEDE_FALTAR =
  'Qué puede no verse de una toma: BE muestra una medición por día y por medida. Si ese día hubo dos evaluaciones, o el mismo resultado se calculó con dos métodos, se ve una sola. Una medición anulada, o con correcciones que no se pueden ordenar, no aparece.';

export function PantallaDeMiEvolucion({
  token,
  salir,
  ir,
  vista,
  metrica,
}: {
  token: string;
  salir: (m: Salida) => void;
  ir: (r: Ruta) => void;
  /** Desde Inicio se puede abrir una vista y una medida (DL-117): es un pedido de una sola vez. */
  vista?: VistaDeEvolucion;
  metrica?: string;
}) {
  // El pedido se fija como elección antes del primer dibujo; después manda lo que elija la persona.
  useState(() => {
    for (const [clave, valor] of eleccionesDelPedido({ vista, metrica })) memoria.recordarSeleccion<string | null>(token, clave, valor);
    return null;
  });
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(() => leerMiEvolucion(api, token), [token]);
  // Al entrar se verifica antes de mostrar (src/ciclo-de-lectura.ts). La clave nombra el período que se pide: los últimos 90 días, o el anterior con mediciones (`leerMiEvolucion`).
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mi-evolucion:ultimos-90', pedir, sesionPerdida);
  // DL-115 · con el A3 revocado o nunca otorgado, lo propio no se lee (08:406). No es un error ni «sin mediciones»: los
  // datos siguen guardados. Cada visita vuelve a preguntar a la API; si niega el acceso, lo recordado se borra.
  const sinA3 = r !== null && !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';

  return (
    <View>
      <Titulo>{COPY_ANTROPOMETRIA.miEvolucion}</Titulo>
      <SinActualizar visible={sinActualizar} onReintentar={cargar} />
      {r === null ? <Cargando forma="figura" /> : null}
      {r && !r.ok && !sinA3 ? <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} /> : null}
      {sinA3 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.evolucionNecesitaA3}>
          <Boton texto={COPY_ANTROPOMETRIA.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      ) : null}
      {r?.ok ? <Evolucion datos={r.datos} token={token} /> : null}
    </View>
  );
}

/**
 * «Mi evolución» por tareas. Arriba, una sola línea dice de qué toma se trata y con cuál se compara (DL-113: cada fecha,
 * una vez). La vista, la toma y la medida elegidas se recuerdan mientras dure la sesión, y la medida es la misma en el
 * mapa, en los indicadores y en Evolución. Todo sale de la misma lectura: cambiar de vista no hace pedidos.
 */
const Evolucion = memo(function Evolucion({ datos, token }: { datos: Datos; token: string }) {
  const [vista, setVista] = useSeleccionRecordada<Vista>(token, 'mi-evolucion:vista', 'TOMA');
  // DL-117 · el selector de tomas: T1, T2, T3… por evaluación, nunca por fecha. Sin elección, la última. La elección se
  // recuerda mientras dure la sesión, y si esa toma ya no está en la respuesta, vuelve a la última.
  const [pedida, setPedida] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:toma', null);
  const [medida, setMedida] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:medida', null);
  // Cerrar el detalle en el mapa o en los indicadores no cambia la medida de Evolución: solo lo cierra.
  const [cerrada, setCerrada] = useState(false);
  const tomas = useMemo(() => tomasDelPeriodo(datos), [datos]);
  const ultima = tomas[tomas.length - 1] ?? null;
  const elegida = tomas.find((t) => t.evaluacionId === pedida) ?? ultima;
  const toma = elegida ? resumenDe(datos, elegida.evaluacionId) : null;
  const puntos = useMemo(() => (elegida ? puntosDeLaToma(datos, tomas, elegida.evaluacionId) : null), [datos, tomas, elegida]);
  const periodo = `${COPY_ANTROPOMETRIA.periodo}: ${dia(`${datos.period.start}T12:00:00Z`)} — ${dia(`${datos.period.end}T12:00:00Z`)}`;
  const visible = vistaDeLaToma(vista, toma ? toma.medidas.some((m) => estaEnLaFigura(m.metrica)) : false);
  // El pedido de Inicio («Ver la toma») o la primera visita se resuelven una sola vez: después, cambiar de toma no cambia
  // de vista por su cuenta.
  useEffect(() => {
    if (toma && vista === 'TOMA') setVista(visible);
  }, [toma, vista, visible, setVista]);
  if (sinMediciones(datos) || !toma || !elegida || !puntos) {
    return (
      <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones}>
        <Parrafo tenue>Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.</Parrafo>
        <Parrafo tenue>{periodo}</Parrafo>
      </Aviso>
    );
  }
  const otras = otrasTomasDelDia(tomas, elegida.evaluacionId);
  const abierta = cerrada ? null : medida;
  const elegirEnLaToma = (m: string | null) => {
    if (m === null) setCerrada(true);
    else {
      setMedida(m);
      setCerrada(false);
    }
  };
  const elegirEnEvolucion = (m: string | null) => {
    setMedida(m);
    setCerrada(false);
  };
  // «Ver su evolución»: la misma medida, con el mismo grupo de comparabilidad, y días que incluyan esa toma.
  const verSuEvolucion = (m: MedidaDeLaToma) => {
    memoria.recordarSeleccion<string | null>(token, `mi-evolucion:grupo:${m.metrica}`, m.actual.punto.comparabilityGroup);
    memoria.recordarSeleccion<Dias>(token, 'mi-evolucion:dias', diasQueIncluyen(m.actual.fecha, datos.period.end, memoria.leerSeleccion<Dias>(token, 'mi-evolucion:dias') ?? '90'));
    elegirEnEvolucion(m.metrica);
    setVista('EVOLUCION');
  };
  const frase = (m: MedidaDeLaToma) => fraseConTomas(fraseDeLaMedida(m, toma.fechaAnterior), puntos.estados(m), puntos.tomas, elegida.evaluacionId);
  const medidasALaVista = toma.medidas.length;
  return (
    <>
      {/* Una línea: qué toma es, con cuál se compara y qué hay. Son cantidades reales, no un indicador. */}
      <View style={estilos.encabezadoDeLaToma} accessible>
        <Text style={estilos.fechaDeLaToma}>{`${elegida === ultima ? COPY_ANTROPOMETRIA.tuUltimaToma : `Toma ${elegida.etiqueta}`}: ${fechaCivil(toma.fecha)}`}</Text>
        <Text style={estilos.detalle}>
          {[
            toma.fechaAnterior ? `${COPY_ANTROPOMETRIA.comparadaCon} ${fechaCivil(toma.fechaAnterior)}` : COPY_ANTROPOMETRIA.sinAnteriorComparable,
            `${numero(medidasALaVista)} ${medidasALaVista === 1 ? 'medida' : 'medidas'}${otras.length > 0 ? ' a la vista' : ''}`,
            toma.derivadas.length > 0 ? `${numero(toma.derivadas.length)} ${toma.derivadas.length === 1 ? 'resultado de fórmula' : 'resultados de fórmulas'}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Segmentos
        etiqueta={COPY_ANTROPOMETRIA.queVer}
        opciones={[
          { valor: 'MAPA', texto: 'Mapa corporal' },
          { valor: 'INDICADORES', texto: 'Indicadores' },
          { valor: 'COMPARAR', texto: COPY_ANTROPOMETRIA.vistaComparar },
          { valor: 'EVOLUCION', texto: COPY_ANTROPOMETRIA.vistaEvolucion },
        ]}
        valor={visible}
        alElegir={setVista}
      />
      {seVeElSelectorDeTomas(visible, tomas.length) ? <SelectorDeToma tomas={tomas} elegida={elegida.evaluacionId} alElegir={setPedida} periodo={periodo} /> : null}
      {visible !== 'EVOLUCION' && otras.length > 0 ? <TomaQuePuedeEstarIncompleta toma={toma} otras={otras} /> : null}
      {visible === 'MAPA' ? (
        <MapaCorporal toma={toma} puntos={puntos} medida={abierta} alElegir={elegirEnLaToma} verSuEvolucion={verSuEvolucion} irAIndicadores={() => setVista('INDICADORES')} frase={frase} />
      ) : null}
      {visible === 'INDICADORES' ? (
        <>
          <Indicadores toma={toma} puntos={puntos} elegida={abierta} alElegir={elegirEnLaToma} verSuEvolucion={verSuEvolucion} irAlMapa={() => setVista('MAPA')} frase={frase} />
          <ComoSeLeenLosPuntos puntos={puntos} medidas={[...toma.medidas.filter((m) => !estaEnLaFigura(m.metrica)), ...toma.derivadas]} />
          <Ayuda>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeDiferencia}</Parrafo>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeResultados}</Parrafo>
            <Parrafo tenue>{QUE_PUEDE_FALTAR}</Parrafo>
          </Ayuda>
        </>
      ) : null}
      {visible === 'COMPARAR' ? <CompararTomas toma={toma} etiqueta={elegida.etiqueta} /> : null}
      {visible === 'EVOLUCION' ? <EvolucionDeUnaMedida datos={datos} token={token} medida={medida} alElegirMedida={elegirEnEvolucion} /> : null}
    </>
  );
});

/**
 * Las tomas del período, de la más vieja a la más nueva, con sus fechas reales. Elegir una cambia a la vez el mapa, los
 * indicadores, sus gráficos chicos y la comparación: todo dice de la misma toma.
 */
function SelectorDeToma({ tomas, elegida, alElegir, periodo }: { tomas: readonly TomaDelPeriodo[]; elegida: string; alElegir: (id: string) => void; periodo: string }) {
  return (
    <View style={estilos.selector}>
      <Text style={estilos.rotuloDelSelector} accessibilityRole="header">
        Tomas del período
      </Text>
      <Segmentos etiqueta="Qué toma ver" opciones={tomas.map((t) => ({ valor: t.evaluacionId, texto: `${t.etiqueta} · ${fechaCorta(t.fecha)}` }))} valor={elegida} alElegir={alElegir} />
      <Text style={estilos.detalle}>{periodo}</Text>
    </View>
  );
}

/**
 * D-3 · si ese día hubo otra evaluación, esta toma puede estar incompleta: la API muestra una medición por día y por
 * medida, y lo que las dos tomaron se ve de una sola. La pantalla no la presenta como completa.
 */
function TomaQuePuedeEstarIncompleta({ toma, otras }: { toma: UltimaToma; otras: readonly TomaDelPeriodo[] }) {
  const cuales = enumerar(otras.map((t) => t.etiqueta));
  return (
    <Aviso tipo="info" titulo="Esta toma puede estar incompleta">
      <Text style={estilos.textoDeAviso}>
        {`El ${fechaCivil(toma.fecha)} también hubo ${otras.length === 1 ? 'otra evaluación' : 'otras evaluaciones'} (${cuales}). BE muestra una sola medición por día y por medida: si dos evaluaciones de ese día tomaron la misma medida, se ve una. Las medidas que no se ven siguen registradas en su evaluación.`}
      </Text>
    </Aviso>
  );
}

/**
 * El mapa corporal: la figura con los sitios medidos en la toma elegida, cada uno con su valor, su diferencia y su
 * gráfico chico. Lo que la figura muestra queda también en una lista plegada, con el valor anterior, su fecha y la
 * clase del dato: es la versión completa para leer, y la que recorre el lector de pantalla, porque la figura no se
 * recorre.
 */
function MapaCorporal({
  toma,
  puntos,
  medida,
  alElegir,
  verSuEvolucion,
  irAIndicadores,
  frase,
}: {
  toma: UltimaToma;
  puntos: PuntosDeLaToma;
  medida: string | null;
  alElegir: (metrica: string | null) => void;
  verSuEvolucion: (m: MedidaDeLaToma) => void;
  irAIndicadores: () => void;
  frase: (m: MedidaDeLaToma) => string;
}) {
  const enLaFigura = toma.medidas.filter((m) => estaEnLaFigura(m.metrica));
  if (enLaFigura.length === 0) {
    return (
      <Aviso tipo="info" titulo="Esta toma no tiene medidas en la figura">
        <Text style={estilos.textoDeAviso}>Sus medidas no tienen un sitio en la figura: están en los indicadores.</Text>
        <Boton texto="Ver los indicadores" tipo="secundario" onPress={irAIndicadores} />
      </Aviso>
    );
  }
  return (
    <View>
      <FiguraDeLaToma medidas={toma.medidas} fechaComparada={toma.fechaAnterior} puntos={puntos} elegida={medida} alElegir={alElegir} verSuEvolucion={verSuEvolucion} />
      <ComoSeLeenLosPuntos puntos={puntos} medidas={enLaFigura} />
      <Desplegable titulo="La figura, en lista" detalle={enLaFigura.length === 1 ? '1 medida, con su valor anterior' : `${numero(enLaFigura.length)} medidas, con su valor anterior`}>
        <ListaPorFamilia medidas={enLaFigura} fechaComparada={toma.fechaAnterior} puntos={puntos} frase={frase} />
      </Desplegable>
      <Ayuda>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeFigura}</Parrafo>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeDiferencia}</Parrafo>
        <Parrafo tenue>{QUE_PUEDE_FALTAR}</Parrafo>
      </Ayuda>
    </View>
  );
}

/** Cómo se lee el eje de los gráficos chicos: el orden de las tomas, no el tiempo. Solo si hay gráficos. */
function ComoSeLeenLosPuntos({ puntos, medidas }: { puntos: PuntosDeLaToma; medidas: readonly MedidaDeLaToma[] }) {
  if (puntos.tomas.length < 2 || medidas.length === 0) return null;
  const conOtroGrupo = medidas.some((m) => puntos.estados(m).some((e) => e.tipo === 'otro-grupo'));
  return <Text style={estilos.pie}>{comoSeLeenLosPuntos(puntos.tomas, conOtroGrupo)}</Text>;
}

/** El orden de las familias en la lista: el de la lámina (perímetros, después pliegues). */
const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/** Las medidas de la toma agrupadas por familia, en el orden de la lámina, con un subtítulo por familia. */
function ListaPorFamilia({ medidas, fechaComparada, puntos, frase }: { medidas: readonly MedidaDeLaToma[]; fechaComparada: string | null; puntos: PuntosDeLaToma; frase: (m: MedidaDeLaToma) => string }) {
  return (
    <>
      {FAMILIAS.map((familia) => {
        const deLaFamilia = medidas.filter((m) => (FAMILIA_DE_METRICA[m.metrica] ?? 'OTRAS') === familia);
        if (deLaFamilia.length === 0) return null;
        return (
          <View key={familia}>
            <Rotulo>{ETIQUETA_DE_FAMILIA[familia]}</Rotulo>
            {deLaFamilia.map((m) => (
              <FilaDeLaToma key={m.metrica} medida={m} fechaComparada={fechaComparada} puntos={puntos} frase={frase(m)} />
            ))}
          </View>
        );
      })}
    </>
  );
}

/** Lo que el lector de pantalla dice de una medida, en una sola frase. */
function fraseDeLaMedida(medida: MedidaDeLaToma, fechaComparada: string | null): string {
  const { actual, diferencia } = medida;
  const cambio = diferencia ? `${COPY_ANTROPOMETRIA.diferencia}: ${textoDeDiferenciaAntropometrica(diferencia)}` : null;
  const metodo = actual.punto.dataClass === 'DERIVED' ? textoDelMetodo(medida) : null;
  return [medida.nombre, cantidad(actual.punto.value, actual.punto.unit), metodo, textoDelAnterior(medida, fechaComparada), cambio, textoDeLaClase(medida)].filter(Boolean).join('. ');
}

/** La frase de una medida y, si hay más de una toma, lo que tiene en cada una: el gráfico chico, dicho en palabras. */
function fraseConTomas(frase: string, estados: readonly EnLaToma[], tomas: readonly TomaDelPeriodo[], elegida: string): string {
  return tomas.length > 1 && estados.some((e) => e.tipo !== 'sin-dato') ? `${frase}. Por toma: ${frasePorToma(estados, tomas, elegida, fechaCorta)}` : frase;
}

/**
 * Una medida de la lista: nombre y valor, el anterior comparable con la diferencia, la clase del dato y su gráfico chico
 * con la lista equivalente. El lector de pantalla la lee como una sola frase.
 */
function FilaDeLaToma({ medida, fechaComparada, puntos, frase }: { medida: MedidaDeLaToma; fechaComparada: string | null; puntos: PuntosDeLaToma; frase: string }) {
  const { actual, diferencia } = medida;
  const clase = textoDeLaClase(medida);
  // Compacta (referencia estética de Dirección, 2026-10-03): el nombre con el valor a la derecha y, en una sola línea
  // debajo, la diferencia y el anterior. El lector de pantalla sigue leyendo la frase completa.
  return (
    <View style={estilos.fila} accessible accessibilityLabel={frase}>
      <View style={estilos.cabezaDeFila}>
        <Text style={estilos.nombre}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{cantidad(actual.punto.value, actual.punto.unit)}</Text>
      </View>
      <Text style={estilos.detalle}>
        {diferencia ? <Text style={estilos.diferencia}>{`${textoDeDiferenciaAntropometrica(diferencia)}  ·  `}</Text> : null}
        {textoDelAnterior(medida, fechaComparada)}
      </Text>
      {clase ? <Text style={estilos.detalle}>{clase}</Text> : null}
      <EvolucionPorToma estados={puntos.estados(medida)} tomas={puntos.tomas} elegida={puntos.elegida} />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  selector: { marginTop: 4, marginBottom: 6 },
  rotuloDelSelector: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: COLOR.tenue, marginTop: 8 },
  encabezadoDeLaToma: { marginBottom: 4 },
  fechaDeLaToma: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  textoDeAviso: { fontSize: 15, lineHeight: 21, color: COLOR.texto, marginBottom: 4 },
  pie: { fontSize: 13, lineHeight: 19, color: COLOR.tenue, marginVertical: 6 },
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 9 },
  cabezaDeFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  valor: { fontSize: 18, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 14, color: COLOR.tenue, marginTop: 2 },
  diferencia: { fontSize: 14, fontWeight: '700', color: COLOR.texto },
}));
