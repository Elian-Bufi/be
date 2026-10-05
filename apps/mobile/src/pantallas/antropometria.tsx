/**
 * APK · «Mi evolución» (RF-049, RF-065; API-ANT-06 del lado del asesorado; B10-07; DL-111; DL-117; DL-118).
 *
 * La persona ve su evolución antropométrica en tres vistas, todas sobre la misma lectura de la API (DL-118, Dirección
 * 2026-10-05):
 * 1. **Mapa corporal**: «¿cuáles son mis medidas más recientes?». La figura de la lámina de Dirección con los valores de
 *    una toma y su fecha (`figura-de-la-toma.tsx`);
 * 2. **Progreso**: «¿qué cambió en esta parte del cuerpo?». Por Torso y Piernas, con la figura de cada tren, el cambio
 *    respecto de la anterior comparable y los puntos sobre fechas reales (`progreso.tsx`);
 * 3. **Indicadores**: «¿qué datos y resultados tengo disponibles?». Lo que no tiene sitio en la figura (`indicadores.tsx`).
 *
 * Comparar salió como apartado: su lectura, cada medida frente a la anterior comparable, está en cada tarjeta de
 * Progreso. La vieja vista Evolución es el detalle de cada tarjeta (`progreso-de-una-medida.tsx`).
 *
 * **Sin vistas ni tomas vacías.** El mapa y Progreso aparecen si alguna toma tiene perímetros o pliegues; Indicadores, si
 * alguna tiene indicadores. Cada vista lista solo las tomas que tienen datos para ella. Si la toma elegida no los tiene,
 * la vista muestra la anterior más cercana que sí, y lo dice con las dos fechas (`disposicion-de-la-toma.ts`).
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
  tomasDelPeriodo,
  type EvolucionResponse,
  type FamiliaDeMedicion,
  type MedidaDeLaToma,
  type TomaDelPeriodo,
  type UltimaToma,
} from '@be/domain';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import {
  contenidoDeLaToma,
  eleccionesDelPedido,
  familiaDelSitio,
  otrasTomasDelDia,
  seVeElSelectorDeTomas,
  tieneDatosPara,
  tomaDeLaVista,
  vistaQueSeVe,
  vistasDisponibles,
  type ContenidoDeLaToma,
  type VistaVisible,
} from '../disposicion-de-la-toma';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { dia, fechaCivil, fechaCorta } from '../formato';
import { memoria, useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { leerMiEvolucion } from '../lecturas-de-las-zonas';
import { useSesionPerdida, type Ruta, type Salida, type VistaDeEvolucion } from '../navegacion';
import { resumenDe } from '../serie-de-la-medida';
import { enumerar } from '../textos-por-toma';
import { Aviso, Ayuda, Boton, Desplegable, estilosPorTema, Parrafo, Pestanas, Rotulo, Titulo } from '../ui';
import { estaEnLaFigura, FiguraDeLaToma } from './figura-de-la-toma';
import { Indicadores } from './indicadores';
import { Progreso } from './progreso';
import { textoDeLaClase, textoDelCambio } from './progreso-de-una-medida';

type Datos = EvolucionResponse['data'];

const sinMediciones = (d: Datos): boolean => d.metrics.every((m) => m.series.length === 0);

/**
 * Lo que una toma puede no mostrar, por cómo proyecta la API (D-3 en docs/ux/INICIO-Y-NAVEGACION.md). Va en «Cómo se
 * lee», para que una toma reconstruida no se lea como completa sin serlo.
 */
const QUE_PUEDE_FALTAR =
  'Qué puede no verse de una toma: BE muestra una medición por día y por medida. Si ese día hubo dos evaluaciones, o el mismo resultado se calculó con dos métodos, se ve una sola. Una medición anulada, o con correcciones que no se pueden ordenar, no aparece.';

/** El nombre de cada vista en sus pestañas. */
const NOMBRE_DE_LA_VISTA: Readonly<Record<VistaVisible, string>> = { MAPA: 'Mapa corporal', PROGRESO: 'Progreso', INDICADORES: 'Indicadores' };

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
 * «Mi evolución» por tareas. Arriba, las vistas; debajo, la fecha de la toma que muestra la vista y cuál es. La fecha
 * con la que se compara cada medida va en su tarjeta, porque cada una puede tener otra anterior comparable (ajuste de
 * Dirección del 2026-10-05). La vista, la toma y la medida elegidas se recuerdan mientras dure la sesión, y la medida
 * es la misma en el mapa, en Progreso y en los indicadores. Todo sale de la misma lectura: cambiar de vista no hace pedidos.
 */
const Evolucion = memo(function Evolucion({ datos, token }: { datos: Datos; token: string }) {
  const [vista, setVista] = useSeleccionRecordada<string>(token, 'mi-evolucion:vista', 'TOMA');
  // DL-117 · el selector de tomas: T1, T2, T3… por evaluación, nunca por fecha. Sin elección, la última.
  const [pedida, setPedida] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:toma', null);
  const [medida, setMedida] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:medida', null);
  const tomas = useMemo(() => tomasDelPeriodo(datos), [datos]);
  const contenidos = useMemo(() => {
    const vacio = { medidas: [], derivadas: [] };
    return new Map<string, ContenidoDeLaToma>(tomas.map((t) => [t.evaluacionId, contenidoDeLaToma(resumenDe(datos, t.evaluacionId) ?? vacio)]));
  }, [datos, tomas]);
  const disponibles = vistasDisponibles([...contenidos.values()]);
  const ultima = tomas[tomas.length - 1] ?? null;
  const visible = vistaQueSeVe(vista, disponibles, ultima ? (contenidos.get(ultima.evaluacionId)?.conSitios ?? false) : false);
  // El pedido de Inicio («Ver la toma»), la primera visita y las vistas de la versión anterior se resuelven una sola vez,
  // con los datos: después, cambiar de toma no cambia de vista por su cuenta.
  useEffect(() => {
    if (visible && (vista === 'TOMA' || vista === 'COMPARAR' || vista === 'EVOLUCION')) setVista(visible);
  }, [vista, visible, setVista]);
  const periodo = `${COPY_ANTROPOMETRIA.periodo}: ${dia(`${datos.period.start}T12:00:00Z`)} — ${dia(`${datos.period.end}T12:00:00Z`)}`;
  if (sinMediciones(datos) || !visible || !ultima) {
    return (
      <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones}>
        <Parrafo tenue>Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.</Parrafo>
        <Parrafo tenue>{periodo}</Parrafo>
      </Aviso>
    );
  }
  const tieneDatos = (t: TomaDelPeriodo) => tieneDatosPara(visible, contenidos.get(t.evaluacionId)!);
  const elegida = tomas.find((t) => t.evaluacionId === pedida) ?? ultima;
  const deLaVista = tomas.filter(tieneDatos);
  const mostrada = tomaDeLaVista(tomas, elegida.evaluacionId, tieneDatos) ?? deLaVista[deLaVista.length - 1]!;
  const toma = resumenDe(datos, mostrada.evaluacionId);
  if (!toma) return null;
  const otras = otrasTomasDelDia(tomas, mostrada.evaluacionId);
  const elegirMedida = (m: string | null) => setMedida(m);
  // «Ver su progreso» (desde el mapa): la misma medida, en Progreso, con su familia y el panel que la tiene.
  const verSuProgreso = (m: MedidaDeLaToma) => {
    setMedida(m.metrica);
    memoria.recordarSeleccion<string | null>(token, 'mi-evolucion:familia', familiaDelSitio(m.metrica));
    memoria.recordarSeleccion<string | null>(token, 'mi-evolucion:panel', null);
    setVista('PROGRESO');
  };
  const nombreDeLaToma = mostrada === ultima ? 'Última toma' : `Toma ${mostrada.etiqueta}`;
  return (
    <>
      {/* Las vistas, en pestañas: son la navegación de la pantalla. Con una sola vista, no hay pestañas. */}
      {disponibles.length > 1 ? (
        <Pestanas etiqueta={COPY_ANTROPOMETRIA.queVer} opciones={disponibles.map((v) => ({ valor: v, texto: NOMBRE_DE_LA_VISTA[v] }))} valor={visible} alElegir={setVista} />
      ) : null}
      {/* La toma: su fecha y cuál es, y las tomas que tienen datos para esta vista. Con qué fecha se compara lo dice cada
          tarjeta: cada medida puede tener otra anterior comparable (ajuste de Dirección del 2026-10-05). */}
      <View style={estilos.encabezadoDeLaToma} accessible accessibilityLabel={`${nombreDeLaToma}, ${fechaCivil(toma.fecha)}`}>
        <Text style={estilos.fechaDeLaToma}>{fechaCivil(toma.fecha)}</Text>
        <Text style={estilos.contexto}>{nombreDeLaToma}</Text>
      </View>
      {mostrada !== elegida ? <Text style={estilos.otraToma}>{otraTomaQueLaElegida(visible, elegida, mostrada)}</Text> : null}
      {seVeElSelectorDeTomas(deLaVista.length) ? <SelectorDeToma tomas={deLaVista} elegida={mostrada.evaluacionId} alElegir={setPedida} periodo={periodo} /> : null}
      {otras.length > 0 ? <TomaQuePuedeEstarIncompleta toma={toma} otras={otras} /> : null}
      {visible === 'MAPA' ? <MapaCorporal toma={toma} medida={medida} alElegir={elegirMedida} verSuProgreso={verSuProgreso} /> : null}
      {visible === 'PROGRESO' ? (
        <>
          <Progreso datos={datos} token={token} toma={toma} medida={medida} alElegir={elegirMedida} />
          <Ayuda>
            <Parrafo tenue>Progreso muestra cada sitio de una zona con su valor en la toma elegida y el cambio respecto de la anterior comparable. El número de cada tarjeta es el de su sitio en la figura.</Parrafo>
            <Parrafo tenue>Los puntos están sobre las fechas reales del período: dos mediciones cercanas en el tiempo quedan cerca. La de la toma elegida va más grande y llena. Tocá una tarjeta para ver el gráfico grande, con cada medición.</Parrafo>
            <Parrafo tenue>Si el torso tiene muchas medidas, se reparte en dos partes. Es la misma toma: cambiar de parte no cambia la fecha ni los valores.</Parrafo>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
            <Parrafo tenue>{periodoDeLasTomas(periodo)}</Parrafo>
            <Parrafo tenue>{QUE_PUEDE_FALTAR}</Parrafo>
          </Ayuda>
        </>
      ) : null}
      {visible === 'INDICADORES' ? (
        <>
          <Indicadores datos={datos} toma={toma} elegida={medida} alElegir={elegirMedida} />
          <Ayuda>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeDiferencia}</Parrafo>
            <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeResultados}</Parrafo>
            <Parrafo tenue>Los puntos de cada tarjeta están sobre las fechas reales del período. Con una sola medición comparable, la tarjeta muestra solo el valor.</Parrafo>
            <Parrafo tenue>{periodoDeLasTomas(periodo)}</Parrafo>
            <Parrafo tenue>{QUE_PUEDE_FALTAR}</Parrafo>
          </Ayuda>
        </>
      ) : null}
    </>
  );
});

/** Por qué la vista muestra otra toma que la elegida, con las dos fechas. */
function otraTomaQueLaElegida(vista: VistaVisible, elegida: TomaDelPeriodo, mostrada: TomaDelPeriodo): string {
  const falta = vista === 'INDICADORES' ? 'no tiene indicadores' : 'no tiene perímetros ni pliegues';
  return `La ${elegida.etiqueta} (${fechaCorta(elegida.fecha)}) ${falta}: se ve la ${mostrada.etiqueta}, del ${fechaCorta(mostrada.fecha)}.`;
}

/**
 * Las tomas de la vista, de la más vieja a la más nueva, con sus fechas reales. Elegir una cambia a la vez el mapa,
 * Progreso y los indicadores: todo dice de la misma toma.
 */
function SelectorDeToma({ tomas, elegida, alElegir, periodo }: { tomas: readonly TomaDelPeriodo[]; elegida: string; alElegir: (id: string) => void; periodo: string }) {
  const desplazamiento = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      ref={desplazamiento}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.tomas}
      contentContainerStyle={estilos.filaDeTomas}
      accessibilityRole="radiogroup"
      accessibilityLabel={`Qué toma ver. ${periodo}`}
    >
      {tomas.map((t) => {
        const esLaElegida = t.evaluacionId === elegida;
        return (
          <Pressable
            key={t.evaluacionId}
            accessibilityRole="radio"
            accessibilityState={{ checked: esLaElegida }}
            accessibilityLabel={`${t.etiqueta}, ${fechaCivil(t.fecha)}`}
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => alElegir(t.evaluacionId)}
            // La elegida queda a la vista: si no entra de entrada (con doce tomas, la última), la fila se desliza hasta ella.
            onLayout={
              esLaElegida
                ? (e) => {
                    const { x, width: anchoDeLaFicha } = e.nativeEvent.layout;
                    if (x + anchoDeLaFicha > width - 16) desplazamiento.current?.scrollTo({ x: Math.max(0, x - 24), animated: false });
                  }
                : undefined
            }
            style={({ pressed }) => [estilos.toma, esLaElegida && estilos.tomaElegida, pressed && estilos.presionado]}
          >
            <Text style={[estilos.textoDeToma, esLaElegida && estilos.textoDeTomaElegida]}>{`${t.etiqueta} · ${fechaCorta(t.fecha)}`}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** El período de las tomas, para «Cómo se lee»: T1 es la primera del período que se ve, no la primera de la historia. */
function periodoDeLasTomas(periodo: string): string {
  return `Las tomas T1, T2, T3… son las evaluaciones del período, de la más vieja a la más nueva. ${periodo}.`;
}

/**
 * D-3 · si ese día hubo otra evaluación, esta toma puede estar incompleta: la API muestra una medición por día y por
 * medida, y lo que las dos tomaron se ve de una sola. La pantalla no la presenta como completa.
 */
function TomaQuePuedeEstarIncompleta({ toma, otras }: { toma: UltimaToma; otras: readonly TomaDelPeriodo[] }) {
  const [abierto, setAbierto] = useState(false);
  const cuales = enumerar(otras.map((t) => t.etiqueta));
  // Lo que se ve de esta toma: las medidas y, aparte, los resultados de fórmulas, que no son medidas.
  const medidas = toma.medidas.length;
  const resultados = toma.derivadas.length;
  const seVen = `${numero(medidas)} ${medidas === 1 ? 'medida' : 'medidas'}${resultados > 0 ? ` y ${numero(resultados)} ${resultados === 1 ? 'resultado de fórmula' : 'resultados de fórmulas'}` : ''}`;
  return (
    <Aviso tipo="info" titulo="Esta toma puede estar incompleta">
      <Text style={estilos.textoDeAviso}>{`El ${fechaCorta(toma.fecha)} también hubo ${otras.length === 1 ? 'otra evaluación' : 'otras evaluaciones'} (${cuales}).`}</Text>
      {abierto ? (
        <Text style={estilos.textoDeAviso}>
          {`BE muestra una sola medición por día y por medida: si dos evaluaciones de ese día tomaron la misma medida, se ve una. De esta toma se ${medidas + resultados === 1 ? 've' : 'ven'} ${seVen}; lo que no se ve sigue registrado en su evaluación.`}
        </Text>
      ) : null}
      <Boton texto={abierto ? 'Menos detalle' : 'Por qué'} tipo="enlace" onPress={() => setAbierto((a) => !a)} />
    </Aviso>
  );
}

/**
 * El mapa corporal: la figura con los valores de la toma, sin gráficos chicos (DL-118). Lo que la figura muestra queda
 * también en una lista plegada, con el cambio y la clase del dato: es la versión completa para leer, y la que recorre el
 * lector de pantalla, porque la figura no se recorre.
 */
function MapaCorporal({ toma, medida, alElegir, verSuProgreso }: { toma: UltimaToma; medida: string | null; alElegir: (metrica: string | null) => void; verSuProgreso: (m: MedidaDeLaToma) => void }) {
  const enLaFigura = toma.medidas.filter((m) => estaEnLaFigura(m.metrica));
  return (
    <View>
      <FiguraDeLaToma medidas={toma.medidas} elegida={medida} alElegir={alElegir} verSuProgreso={verSuProgreso} />
      <Desplegable titulo="La figura, en lista" detalle={enLaFigura.length === 1 ? '1 medida, con su cambio' : `${numero(enLaFigura.length)} medidas, con su cambio`}>
        <ListaPorFamilia medidas={enLaFigura} />
      </Desplegable>
      <Ayuda>
        <Parrafo tenue>El mapa muestra los valores de una toma, con su fecha. Tocá un sitio o su fila para ver el cambio y su progreso.</Parrafo>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeFigura}</Parrafo>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeDiferencia}</Parrafo>
        <Parrafo tenue>{QUE_PUEDE_FALTAR}</Parrafo>
      </Ayuda>
    </View>
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
            <Rotulo>{ETIQUETA_DE_FAMILIA[familia]}</Rotulo>
            {deLaFamilia.map((m) => (
              <FilaDeLaToma key={m.metrica} medida={m} />
            ))}
          </View>
        );
      })}
    </>
  );
}

/** Una medida de la lista: nombre y valor, el cambio respecto de la anterior comparable y la clase del dato. */
function FilaDeLaToma({ medida }: { medida: MedidaDeLaToma }) {
  const valor = cantidad(medida.actual.punto.value, medida.actual.punto.unit);
  const cambio = textoDelCambio(medida);
  const clase = textoDeLaClase(medida);
  return (
    <View style={estilos.fila} accessible accessibilityLabel={[medida.nombre, valor, cambio, clase].filter(Boolean).join('. ')}>
      <View style={estilos.cabezaDeFila}>
        <Text style={estilos.nombre}>{medida.nombre}</Text>
        <Text style={estilos.valor}>{valor}</Text>
      </View>
      <Text style={estilos.detalle}>{cambio}</Text>
      {clase ? <Text style={estilos.detalle}>{clase}</Text> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  encabezadoDeLaToma: { marginTop: 10 },
  fechaDeLaToma: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: COLOR.texto },
  contexto: { fontSize: 13, lineHeight: 18, color: COLOR.tenue },
  otraToma: { fontSize: 13, lineHeight: 18, color: COLOR.texto, marginTop: 4 },
  tomas: { marginTop: 8, marginHorizontal: -20, flexGrow: 0 },
  filaDeTomas: { gap: 6, paddingHorizontal: 20, paddingVertical: 4 },
  toma: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  tomaElegida: { backgroundColor: COLOR.botonFondo },
  textoDeToma: { fontSize: 14, fontWeight: '600', color: COLOR.texto },
  textoDeTomaElegida: { fontWeight: '800', color: COLOR.botonTexto },
  presionado: { opacity: 0.8 },
  textoDeAviso: { fontSize: 15, lineHeight: 21, color: COLOR.texto, marginBottom: 4 },
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 9 },
  cabezaDeFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  valor: { fontSize: 18, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 14, color: COLOR.tenue, marginTop: 2 },
}));
