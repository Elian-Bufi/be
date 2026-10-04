/**
 * APK · el mapa corporal: la figura de la lámina de Dirección con la toma elegida (DL-111; DL-117).
 *
 * Es el modo «Medición» del compositor (docs/direccion/LAMINA-DEL-COMPOSITOR.md) llevado al teléfono: la figura a la
 * derecha y, a la izquierda, las tarjetas del compositor con una fila por sitio medido —su valor y la diferencia con la
 * toma anterior comparable—, cada fila unida a su sitio por una guía. Perímetros y pliegues van por separado, como
 * Circunferencias y Pliegues en el compositor. Las posiciones, los rótulos, el orden de las tarjetas y el apilado son
 * los del compositor (`figura-de-lamina.ts`, en @be/domain); lo que cambia es la escala, para que el texto se lea.
 *
 * Dónde va cada cosa lo decide `composicion-de-la-figura.ts`, que también usa la maqueta del navegador. Con la letra de
 * la persona, si las tarjetas no entran, la figura pasa a números y los valores van en una lista debajo, que crece con
 * la letra sin tope (prueba de la 0.13.1: con la letra al máximo, los rótulos se cortaban).
 *
 * Anillos, puntos y guías se dibujan en SVG, con la receta de `dibujo-de-la-figura.ts`: cada anillo es una elipse de
 * verdad, con la mitad trasera punteada y la delantera llena (Dirección, 2026-10-01).
 *
 * **Selección coordinada** (tanda del 2026-10-03; cierre del 2026-10-04). Tocar una fila, un número o el sitio en la
 * figura elige esa medida: su guía y su sitio se resaltan, las demás guías se atenúan, y abajo aparece su detalle, con el
 * gráfico de puntos por toma y «Ver su evolución». Volver a tocarla la suelta. La relación no depende solo del color: la
 * fila elegida lleva borde y negrita, y su sitio, un aro propio. La medida elegida es la misma de los indicadores y de
 * Evolución (`mi-evolucion:medida`), y la toma es la del selector: todo dice de la misma toma y la misma medida.
 *
 * **Gráficos chicos en sus sitios** (cierre del 2026-10-04). Con más de una toma, cada fila de tarjeta lleva, debajo del
 * valor, los puntos de esa medida en cada toma, unidos a su sitio por la misma guía. Con números, van en cada fila de la
 * lista, junto al número del sitio. El ancho de cada gráfico es el de su fila: no desborda con ninguna cantidad de tomas.
 *
 * **Objetivos de 48 dp.** Las filas miden al menos 48 dp. En la figura, cada sitio responde hasta 24 dp de su dibujo,
 * sin agrandar lo que se ve (`sitioTocado`). Donde dos sitios quedan casi juntos, el toque no adivina: lo dice, y la
 * fila elige sin ambigüedad.
 *
 * La figura es de un hombre o de una mujer según elija la persona, y se recuerda en el teléfono: no se deduce de ningún
 * dato. Ubica, nunca califica (RF-048; INV-06-06; DL-073): los colores distinguen capas del dibujo, nunca rangos, y la
 * diferencia es un número con signo. El lector de pantalla no recorre la figura: los mismos datos, completos, están en
 * la lista de la toma, en la pantalla que la contiene.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colorDeLaCapa,
  COLORES_DE_LA_FIGURA,
  COPY_ANTROPOMETRIA,
  opacidadDeLaCapa,
  TARJETAS_DE_PERIMETROS,
  TARJETAS_DE_PLIEGUES,
  type ClaveDeLaLamina,
  type ColoresDeLaFigura,
  type MedidaDeLaToma,
  type SexoDeLaLamina,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Text as TextoSvg } from 'react-native-svg';
import { useApariencia } from '../apariencia';
import { ALTO_DEL_GRAFICO_EN_LA_FILA, componerLaFigura, familiaQueSeVe, INTERLINEA, LETRA, sitioTocado, type ComposicionDeLaFigura, type FamiliaDeLaFigura, type FilaDeLaTarjeta, type SitioDeLaFigura } from '../composicion-de-la-figura';
import { ANILLO_EN_EL_TELEFONO, arcoDeLaElipse, GUIA_EN_EL_TELEFONO, PLIEGUE_EN_EL_TELEFONO, PLIEGUE_POSTERIOR_EN_EL_TELEFONO, trazoDeLaGuia } from '../dibujo-de-la-figura';
import { PALETAS, type Tema } from '../tema';
import { Segmentos } from '../ui';
import { BrilloDeVidrio, sombraDeVidrio } from '../vidrio';
import type { PuntosDeLaToma } from '../graficos-por-toma';
import { DetalleDeLaMedida } from './detalle-de-la-medida';
import { PuntosPorToma } from './puntos-por-toma';

const IMAGEN: Readonly<Record<SexoDeLaLamina, ImageSourcePropType>> = {
  HOMBRE: require('../../assets/figura/hombre-entero.png') as ImageSourcePropType,
  MUJER: require('../../assets/figura/mujer-entero.png') as ImageSourcePropType,
};
const CLAVE_DE_LA_FIGURA = 'be-figura-de-la-toma';

/** Los sitios que la figura puede dibujar: los de las tarjetas del compositor, en el cuerpo entero. */
const SITIOS_EN_LA_FIGURA: ReadonlySet<string> = new Set([...TARJETAS_DE_PERIMETROS.ENTERO.flat(), ...TARJETAS_DE_PLIEGUES.ENTERO.flat()]);

/** Si una medida de la toma se dibuja en la figura: un perímetro o un pliegue con sitio en la lámina. */
export function estaEnLaFigura(metrica: string): boolean {
  return SITIOS_EN_LA_FIGURA.has(metrica);
}

/** El tema de la lámina que corresponde a cada apariencia de la APK (compositor: `light` y `blue`). */
const TEMA_DE_LA_LAMINA = { claro: 'CLARO', 'azul-noche': 'AZUL' } as const satisfies Readonly<Record<Tema, 'CLARO' | 'AZUL'>>;

/** Los colores de la lámina fuera del dibujo: tokens de cada tema (tema.ts), medidos por la prueba de contraste. */
const laminaDe = (tema: Tema) => {
  const p = PALETAS[tema];
  return {
    fondo: p.laminaFondo,
    tarjeta: p.laminaTarjeta,
    borde: p.laminaBorde,
    filo: p.laminaFilo,
    brillo: p.laminaBrillo,
    sombra: p.sombra,
    nombre: p.laminaNombre,
    valor: p.laminaValor,
    detalle: p.laminaDetalle,
    contorno: p.laminaContorno,
  };
};
type ColoresDeLamina = ReturnType<typeof laminaDe>;

/**
 * El contorno de la silueta: la misma imagen, teñida y corrida 1,25 dp en ocho direcciones, debajo del cuerpo. En Claro
 * separa el cuerpo blanco del fondo (medido: de 1,01:1 a 1,19:1 sin contorno; el contorno llega a 4:1).
 */
const CORRIMIENTOS_DEL_CONTORNO: readonly (readonly [number, number])[] = [
  [-1.25, 0],
  [1.25, 0],
  [0, -1.25],
  [0, 1.25],
  [-0.9, -0.9],
  [0.9, -0.9],
  [-0.9, 0.9],
  [0.9, 0.9],
];

export function FiguraDeLaToma({
  medidas,
  fechaComparada,
  puntos,
  elegida,
  alElegir,
  verSuEvolucion,
}: {
  medidas: readonly MedidaDeLaToma[];
  fechaComparada: string | null;
  /** Las tomas del período y qué hay de cada medida en ellas. Con una sola toma no hay gráficos chicos. */
  puntos: PuntosDeLaToma;
  /** La medida elegida, la misma de los indicadores y de Evolución; `null` sin elección. */
  elegida: string | null;
  alElegir: (metrica: string | null) => void;
  verSuEvolucion: (m: MedidaDeLaToma) => void;
}) {
  const { tema } = useApariencia();
  const { fontScale } = useWindowDimensions();
  const [sexo, setSexo] = useState<SexoDeLaLamina>('HOMBRE');
  const conValor = new Set(medidas.map((m) => m.metrica));
  const hayPerimetros = TARJETAS_DE_PERIMETROS.ENTERO.flat().some((c) => conValor.has(c));
  const hayPliegues = TARJETAS_DE_PLIEGUES.ENTERO.flat().some((c) => conValor.has(c));
  // Al entrar con una medida elegida en otra vista, se ve su familia.
  const [familia, setFamilia] = useState<FamiliaDeLaFigura>(() =>
    elegida !== null && (TARJETAS_DE_PLIEGUES.ENTERO.flat() as readonly string[]).includes(elegida) ? 'PLIEGUES' : hayPerimetros ? 'PERIMETROS' : 'PLIEGUES',
  );
  const familiaVisible = familiaQueSeVe(familia, hayPerimetros, hayPliegues);
  const [ancho, setAncho] = useState(0);
  // Los sitios que quedaron casi juntos bajo el último toque: la pantalla lo dice en vez de elegir uno al azar.
  const [juntos, setJuntos] = useState<readonly ClaveDeLaLamina[] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_DE_LA_FIGURA)
      .then((v) => {
        if (v === 'HOMBRE' || v === 'MUJER') setSexo(v);
      })
      .catch(() => undefined);
  }, []);

  if (!hayPerimetros && !hayPliegues) return null;

  const elegirSexo = (s: SexoDeLaLamina) => {
    setSexo(s);
    AsyncStorage.setItem(CLAVE_DE_LA_FIGURA, s).catch(() => undefined);
  };
  const conPuntos = puntos.tomas.length > 1;
  const composicion = ancho > 0 ? componerLaFigura({ ancho, sexo, familia: familiaVisible, medidas, escalaDeLetra: fontScale, puntos: conPuntos }) : null;
  const lamina = laminaDe(tema);
  // La elegida vale solo si está en la familia que se ve.
  const sitioElegido = composicion?.sitios.find((x) => x.clave === elegida) ?? null;
  const alternar = (clave: ClaveDeLaLamina) => {
    setJuntos(null);
    alElegir(elegida === clave ? null : clave);
  };
  const tocar = (x: number, y: number) => {
    if (!composicion) return;
    const toque = sitioTocado(composicion.sitios, x, y);
    if (toque?.tipo === 'sitio') alternar(toque.clave);
    else if (toque?.tipo === 'ambiguo') setJuntos(toque.claves);
  };
  const rotulosJuntos = juntos ? (composicion?.sitios ?? []).filter((s) => juntos.includes(s.clave)).map((s) => s.rotulo) : [];

  return (
    <View>
      {/* La lámina: la familia arriba, compacta (una elección del mapa, distinta de las vistas de la pantalla), y debajo
          la figura. La figura se recorta en el borde derecho de esta caja (ENCUADRE, en composicion-de-la-figura.ts). */}
      <View style={{ backgroundColor: lamina.fondo, borderRadius: 18, overflow: 'hidden', marginTop: 6, marginBottom: 8 }}>
        {hayPerimetros && hayPliegues ? (
          <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            <Segmentos
              compactos
              etiqueta={COPY_ANTROPOMETRIA.medidasDeLaFigura}
              opciones={[
                { valor: 'PERIMETROS', texto: COPY_ANTROPOMETRIA.perimetrosEnLaFigura },
                { valor: 'PLIEGUES', texto: COPY_ANTROPOMETRIA.plieguesEnLaFigura },
              ]}
              valor={familiaVisible}
              alElegir={setFamilia}
            />
          </View>
        ) : null}
        <View onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {composicion ? <Lamina composicion={composicion} sexo={sexo} tema={tema} elegida={sitioElegido?.clave ?? null} alternar={alternar} tocar={tocar} puntos={conPuntos ? puntos : null} /> : null}
        </View>
      </View>
      {/* Con números, los valores van acá abajo y crecen con la letra. El lector de pantalla tiene la lista completa de la
          toma, más abajo en la pantalla, y no recorre esta. */}
      {composicion?.modo === 'NUMEROS' ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ListaDeNumeros sitios={composicion.sitios} ficha={composicion.ficha} lamina={lamina} elegida={sitioElegido?.clave ?? null} alternar={alternar} puntos={conPuntos ? puntos : null} />
        </View>
      ) : null}
      {rotulosJuntos.length > 1 ? (
        <Text style={{ fontSize: 14, lineHeight: 20, color: lamina.detalle, marginBottom: 6 }} accessibilityLiveRegion="polite">
          {`Ahí quedan juntos ${rotulosJuntos.join(' y ')}: tocá su fila para elegir uno.`}
        </Text>
      ) : null}
      {sitioElegido ? <DetalleDeLaMedida medida={sitioElegido.medida} rotulo={sitioElegido.rotulo} fechaComparada={fechaComparada} puntos={puntos} verSuEvolucion={verSuEvolucion} /> : null}
      {/* Hombre o mujer, debajo de la figura: es solo cómo se ve el dibujo, no cambia ningún dato. */}
      <Segmentos
        compactos
        etiqueta={COPY_ANTROPOMETRIA.figura}
        opciones={[
          { valor: 'HOMBRE', texto: COPY_ANTROPOMETRIA.figuraHombre },
          { valor: 'MUJER', texto: COPY_ANTROPOMETRIA.figuraMujer },
        ]}
        valor={sexo}
        alElegir={elegirSexo}
      />
    </View>
  );
}

function Lamina({
  composicion,
  sexo,
  tema,
  elegida,
  alternar,
  tocar,
  puntos,
}: {
  composicion: ComposicionDeLaFigura;
  sexo: SexoDeLaLamina;
  tema: Tema;
  elegida: ClaveDeLaLamina | null;
  alternar: (clave: ClaveDeLaLamina) => void;
  tocar: (x: number, y: number) => void;
  puntos: PuntosDeLaToma | null;
}) {
  const colores = COLORES_DE_LA_FIGURA[TEMA_DE_LA_LAMINA[tema]];
  const lamina = laminaDe(tema);
  const { ancho, alto, imagen, tarjetas, guias, sitios, modo, ficha } = composicion;
  const lugar = (dx = 0, dy = 0) => ({ position: 'absolute' as const, left: imagen.x + dx, top: imagen.y + dy, width: imagen.ancho, height: imagen.alto });

  return (
    <View style={{ height: alto, overflow: 'hidden' }}>
      {CORRIMIENTOS_DEL_CONTORNO.map(([dx, dy]) => (
        <Image key={`${dx},${dy}`} source={IMAGEN[sexo]} style={[lugar(dx, dy), { tintColor: lamina.contorno }]} resizeMode="stretch" />
      ))}
      <Image source={IMAGEN[sexo]} style={lugar()} resizeMode="stretch" />
      {/* Un solo dibujo encima del cuerpo, con las guías y los sitios; las tarjetas van encima de todo. Los sitios van
          después de las guías: alguna guía pasa junto al punto de otro sitio y así pasa por detrás, sin taparlo. */}
      <Svg width={ancho} height={alto} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        {guias.map((g) => {
          const t = g.posterior ? GUIA_EN_EL_TELEFONO.posterior : GUIA_EN_EL_TELEFONO.normal;
          // Con una medida elegida, su guía se resalta y las demás se atenúan; sin elección, todas igual.
          const opacidad = elegida === null ? 1 : g.clave === elegida ? 1 : 0.2;
          const grosor = g.clave === elegida ? t.grosor + 0.9 : t.grosor;
          return (
            <G key={`guia-${g.clave}`} opacity={opacidad}>
              <Path d={trazoDeLaGuia(g.desde, g.quiebre, g.hasta)} fill="none" stroke={colores[t.color]} strokeWidth={grosor} strokeDasharray={[...t.guiones]} />
              <Circle cx={g.desde.x + 0.5} cy={g.desde.y} r={t.radioDelPunto} fill={colores[t.colorDelPunto]} />
            </G>
          );
        })}
        {sitios.map((s) => (
          <CapasDelSitio key={s.clave} sitio={s} colores={colores} />
        ))}
        {/* El aro de la elegida: una forma propia, no solo un color. */}
        {sitios
          .filter((s) => s.clave === elegida)
          .map((s) =>
            s.anillo ? (
              <Ellipse key={`elegida-${s.clave}`} cx={s.cx} cy={s.cy} rx={s.anillo.rx + 5} ry={s.anillo.ry + 5} fill="none" stroke={lamina.valor} strokeWidth={2} />
            ) : (
              <Circle key={`elegida-${s.clave}`} cx={s.cx} cy={s.cy} r={11} fill="none" stroke={lamina.valor} strokeWidth={2} />
            ),
          )}
        {modo === 'NUMEROS'
          ? tarjetas.map((t) => {
              const f = t.filas[0]!;
              return <Ficha key={`ficha-${f.sitio.clave}`} x={t.x + 2 + ficha / 2} y={f.y} diametro={ficha} numero={f.sitio.numero} lamina={lamina} />;
            })
          : null}
      </Svg>
      {/* Tocar la figura elige el sitio más cercano, hasta 24 dp de su dibujo: un objetivo de 48 dp sin agrandar lo que se
          ve. Donde dos sitios quedan casi juntos, no elige ninguno (sitioTocado). Las tarjetas van después, encima: sus
          filas reciben su propio toque. */}
      <Pressable onPress={(e) => tocar(e.nativeEvent.locationX, e.nativeEvent.locationY)} style={{ position: 'absolute', left: 0, top: 0, width: ancho, height: alto }} accessible={false} />
      {modo === 'TARJETAS'
        ? tarjetas.map((t) => (
            <View
              key={`tarjeta-${t.filas[0]!.sitio.clave}`}
              style={{
                position: 'absolute',
                left: t.x,
                top: t.y,
                width: t.ancho,
                height: t.alto,
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: lamina.filo,
                backgroundColor: lamina.tarjeta,
                ...sombraDeVidrio(lamina.sombra),
              }}
            >
              <BrilloDeVidrio color={lamina.brillo} radio={14} />
              {t.filas.map((f) => (
                <FilaDeLaLamina key={f.sitio.clave} fila={f} lamina={lamina} elegida={f.sitio.clave === elegida} alternar={alternar} puntos={puntos} />
              ))}
            </View>
          ))
        : null}
    </View>
  );
}

/**
 * Una fila de tarjeta: el rótulo del compositor, el valor y la diferencia con la toma anterior comparable y, con más de
 * una toma, el gráfico chico de esa medida. Crece con la letra de la persona; el alto y el ancho del gráfico los calculó
 * la composición, y el rótulo puede ir en dos líneas.
 */
function FilaDeLaLamina({
  fila,
  lamina,
  elegida,
  alternar,
  puntos,
}: {
  fila: FilaDeLaTarjeta;
  lamina: ColoresDeLamina;
  elegida: boolean;
  alternar: (clave: ClaveDeLaLamina) => void;
  puntos: PuntosDeLaToma | null;
}) {
  const { sitio } = fila;
  const rotulo = { fontSize: LETRA.rotulo, lineHeight: INTERLINEA.rotulo, color: lamina.nombre, fontWeight: elegida ? ('800' as const) : ('500' as const) };
  const valor = { fontSize: LETRA.valor, fontWeight: '700' as const, color: lamina.valor };
  const detalle = { fontSize: LETRA.detalle, lineHeight: INTERLINEA.detalle, color: lamina.detalle };
  return (
    <Pressable
      onPress={() => alternar(sitio.clave)}
      accessibilityRole="button"
      accessibilityState={{ selected: elegida }}
      style={{ height: fila.alto, justifyContent: 'center', marginHorizontal: -6, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: elegida ? lamina.valor : 'transparent' }}
    >
      {fila.enLinea ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
          <Text style={[rotulo, { flexShrink: 1 }]} numberOfLines={1}>
            {sitio.rotulo}
          </Text>
          <Text style={valor} numberOfLines={1}>
            {sitio.valor}
          </Text>
        </View>
      ) : (
        <>
          <Text style={rotulo} numberOfLines={fila.lineasDelRotulo}>
            {sitio.rotulo}
          </Text>
          {/* El valor, contra el borde derecho como en las filas en línea: los valores forman una columna. */}
          <Text style={[valor, { lineHeight: INTERLINEA.valor, textAlign: 'right' }]} numberOfLines={1}>
            {sitio.valor}
          </Text>
        </>
      )}
      {/* La última línea, igual en todas las filas: la diferencia a la izquierda y el gráfico a la derecha. */}
      {sitio.diferencia || (puntos && fila.anchoDeLosPuntos) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          {sitio.diferencia ? <Text style={detalle}>{sitio.diferencia}</Text> : <View />}
          {puntos && fila.anchoDeLosPuntos ? <PuntosPorToma estados={puntos.estados(sitio.medida)} elegida={puntos.elegida} ancho={fila.anchoDeLosPuntos} alto={ALTO_DEL_GRAFICO_EN_LA_FILA} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** La ficha de un número, en la columna de la izquierda: el mismo número que en la lista de abajo. */
function Ficha({ x, y, diametro, numero, lamina }: { x: number; y: number; diametro: number; numero: number; lamina: ColoresDeLamina }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={diametro / 2} fill={lamina.tarjeta} stroke={lamina.borde} strokeWidth={1} />
      <TextoSvg x={x} y={y + diametro * 0.18} fontSize={diametro * 0.5} fontWeight="700" fill={lamina.valor} textAnchor="middle">
        {String(numero)}
      </TextoSvg>
    </G>
  );
}

/**
 * Con números, los valores de la figura: el número, el rótulo y el valor con su diferencia. Es texto común, que crece con
 * la letra sin tope; si el valor no entra al lado del rótulo, baja a la línea siguiente.
 */
function ListaDeNumeros({
  sitios,
  ficha,
  lamina,
  elegida,
  alternar,
  puntos,
}: {
  sitios: readonly SitioDeLaFigura[];
  ficha: number;
  lamina: ColoresDeLamina;
  elegida: ClaveDeLaLamina | null;
  alternar: (clave: ClaveDeLaLamina) => void;
  puntos: PuntosDeLaToma | null;
}) {
  // El ancho del texto de cada fila, para su gráfico chico: todas miden lo mismo, y se toma el de la primera.
  const [anchoDelTexto, setAnchoDelTexto] = useState(0);
  return (
    <View style={{ backgroundColor: lamina.fondo, borderRadius: 16, padding: 10, marginBottom: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: lamina.nombre, marginBottom: 6 }}>{COPY_ANTROPOMETRIA.numerosDeLaFigura}</Text>
      {sitios.map((s) => (
        <Pressable
          key={s.clave}
          onPress={() => alternar(s.clave)}
          accessibilityRole="button"
          accessibilityState={{ selected: s.clave === elegida }}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 48, paddingVertical: 6, paddingHorizontal: 4, borderTopWidth: s.numero === 1 ? 0 : 1, borderTopColor: lamina.borde, borderRadius: 8, borderWidth: s.clave === elegida ? 1 : 0, borderColor: lamina.valor }}
        >
          <View style={{ width: ficha, height: ficha, borderRadius: ficha / 2, borderWidth: 1, borderColor: lamina.borde, backgroundColor: lamina.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: lamina.valor }} maxFontSizeMultiplier={1.6}>
              {String(s.numero)}
            </Text>
          </View>
          <View style={{ flex: 1 }} onLayout={s.numero === 1 ? (e) => setAnchoDelTexto(Math.floor(e.nativeEvent.layout.width)) : undefined}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 10 }}>
              <Text style={{ fontSize: 15, color: lamina.nombre, flexShrink: 1 }}>{s.rotulo}</Text>
              <Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: lamina.valor }}>{s.valor}</Text>
                {s.diferencia ? <Text style={{ fontSize: 14, color: lamina.detalle }}>{`  ${s.diferencia}`}</Text> : null}
              </Text>
            </View>
            {puntos && anchoDelTexto > 0 ? (
              <View style={{ marginTop: 4 }}>
                <PuntosPorToma estados={puntos.estados(s.medida)} elegida={puntos.elegida} ancho={anchoDelTexto} alto={24} />
              </View>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Las capas de un sitio (`dibujo-de-la-figura.ts`), de abajo hacia arriba: un anillo es una elipse partida en su mitad
 * trasera y su mitad delantera; un punto, círculos concéntricos. Una capa sin color en el tema no se dibuja.
 */
function CapasDelSitio({ sitio, colores }: { sitio: SitioDeLaFigura; colores: ColoresDeLaFigura }) {
  const capas = sitio.anillo ? ANILLO_EN_EL_TELEFONO : sitio.posterior ? PLIEGUE_POSTERIOR_EN_EL_TELEFONO : PLIEGUE_EN_EL_TELEFONO;
  return (
    <G>
      {capas.map((capa, i) => {
        const color = colorDeLaCapa(capa, colores);
        if (!color) return null;
        const opacidad = opacidadDeLaCapa(capa, colores);
        // Un trazo punteado termina en recto; uno lleno, redondeado, así el resplandor se cierra suave en las puntas.
        const pintura =
          capa.grosor === undefined
            ? { fill: color }
            : capa.guiones
              ? { fill: 'none', stroke: color, strokeWidth: capa.grosor, strokeDasharray: [...capa.guiones] }
              : { fill: 'none', stroke: color, strokeWidth: capa.grosor, strokeLinecap: 'round' as const };
        if (sitio.anillo && capa.tramo && capa.tramo !== 'COMPLETO') {
          return <Path key={i} d={arcoDeLaElipse({ cx: sitio.cx, cy: sitio.cy, rx: sitio.anillo.rx, ry: sitio.anillo.ry }, capa.tramo)} opacity={opacidad} {...pintura} />;
        }
        if (capa.radio !== undefined) return <Circle key={i} cx={sitio.cx} cy={sitio.cy} r={capa.radio} opacity={opacidad} {...pintura} />;
        return null;
      })}
    </G>
  );
}
