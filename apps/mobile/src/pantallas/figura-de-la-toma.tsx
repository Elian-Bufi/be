/**
 * APK · la figura de la lámina de Dirección con la última toma (DL-111).
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
  type ColoresDeLaFigura,
  type MedidaDeLaToma,
  type SexoDeLaLamina,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { Image, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, G, Path, Text as TextoSvg } from 'react-native-svg';
import { useApariencia } from '../apariencia';
import { componerLaFigura, INTERLINEA, LETRA, type ComposicionDeLaFigura, type FamiliaDeLaFigura, type FilaDeLaTarjeta, type SitioDeLaFigura } from '../composicion-de-la-figura';
import { ANILLO_EN_EL_TELEFONO, arcoDeLaElipse, GUIA_EN_EL_TELEFONO, PLIEGUE_EN_EL_TELEFONO, PLIEGUE_POSTERIOR_EN_EL_TELEFONO, trazoDeLaGuia } from '../dibujo-de-la-figura';
import { PALETAS, type Tema } from '../tema';
import { Segmentos } from '../ui';

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
  return { fondo: p.laminaFondo, tarjeta: p.laminaTarjeta, borde: p.laminaBorde, nombre: p.laminaNombre, valor: p.laminaValor, detalle: p.laminaDetalle, contorno: p.laminaContorno };
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

export function FiguraDeLaToma({ medidas }: { medidas: readonly MedidaDeLaToma[] }) {
  const { tema } = useApariencia();
  const { fontScale } = useWindowDimensions();
  const [sexo, setSexo] = useState<SexoDeLaLamina>('HOMBRE');
  const conValor = new Set(medidas.map((m) => m.metrica));
  const hayPerimetros = TARJETAS_DE_PERIMETROS.ENTERO.flat().some((c) => conValor.has(c));
  const hayPliegues = TARJETAS_DE_PLIEGUES.ENTERO.flat().some((c) => conValor.has(c));
  const [familia, setFamilia] = useState<FamiliaDeLaFigura>(hayPerimetros ? 'PERIMETROS' : 'PLIEGUES');
  const [ancho, setAncho] = useState(0);

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
  const composicion = ancho > 0 ? componerLaFigura({ ancho, sexo, familia, medidas, escalaDeLetra: fontScale }) : null;
  const lamina = laminaDe(tema);

  return (
    <View>
      {hayPerimetros && hayPliegues ? (
        <Segmentos
          etiqueta={COPY_ANTROPOMETRIA.medidasDeLaFigura}
          opciones={[
            { valor: 'PERIMETROS', texto: COPY_ANTROPOMETRIA.perimetrosEnLaFigura },
            { valor: 'PLIEGUES', texto: COPY_ANTROPOMETRIA.plieguesEnLaFigura },
          ]}
          valor={familia}
          alElegir={setFamilia}
        />
      ) : null}
      <View onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {composicion ? <Lamina composicion={composicion} sexo={sexo} tema={tema} /> : null}
        {/* Con números, los valores van acá abajo y crecen con la letra. El lector de pantalla tiene la lista completa
            de la toma, más abajo en la pantalla, y no recorre esta. */}
        {composicion?.modo === 'NUMEROS' ? <ListaDeNumeros sitios={composicion.sitios} ficha={composicion.ficha} lamina={lamina} /> : null}
      </View>
      {/* Hombre o mujer, debajo de la figura: es solo cómo se ve el dibujo, no cambia ningún dato. */}
      <Segmentos
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

function Lamina({ composicion, sexo, tema }: { composicion: ComposicionDeLaFigura; sexo: SexoDeLaLamina; tema: Tema }) {
  const colores = COLORES_DE_LA_FIGURA[TEMA_DE_LA_LAMINA[tema]];
  const lamina = laminaDe(tema);
  const { ancho, alto, imagen, tarjetas, guias, sitios, modo, ficha } = composicion;
  const lugar = (dx = 0, dy = 0) => ({ position: 'absolute' as const, left: imagen.x + dx, top: imagen.y + dy, width: imagen.ancho, height: imagen.alto });

  return (
    <View style={{ height: alto, backgroundColor: lamina.fondo, borderRadius: 16, overflow: 'hidden', marginVertical: 8 }}>
      {CORRIMIENTOS_DEL_CONTORNO.map(([dx, dy]) => (
        <Image key={`${dx},${dy}`} source={IMAGEN[sexo]} style={[lugar(dx, dy), { tintColor: lamina.contorno }]} resizeMode="stretch" />
      ))}
      <Image source={IMAGEN[sexo]} style={lugar()} resizeMode="stretch" />
      {/* Un solo dibujo encima del cuerpo, con las guías y los sitios; las tarjetas van encima de todo. Los sitios van
          después de las guías: alguna guía pasa junto al punto de otro sitio y así pasa por detrás, sin taparlo. */}
      <Svg width={ancho} height={alto} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        {guias.map((g) => {
          const t = g.posterior ? GUIA_EN_EL_TELEFONO.posterior : GUIA_EN_EL_TELEFONO.normal;
          return (
            <G key={`guia-${g.clave}`}>
              <Path d={trazoDeLaGuia(g.desde, g.quiebre, g.hasta)} fill="none" stroke={colores[t.color]} strokeWidth={t.grosor} strokeDasharray={[...t.guiones]} />
              <Circle cx={g.desde.x + 0.5} cy={g.desde.y} r={t.radioDelPunto} fill={colores[t.colorDelPunto]} />
            </G>
          );
        })}
        {sitios.map((s) => (
          <CapasDelSitio key={s.clave} sitio={s} colores={colores} />
        ))}
        {modo === 'NUMEROS'
          ? tarjetas.map((t) => {
              const f = t.filas[0]!;
              return <Ficha key={`ficha-${f.sitio.clave}`} x={t.x + 2 + ficha / 2} y={f.y} diametro={ficha} numero={f.sitio.numero} lamina={lamina} />;
            })
          : null}
      </Svg>
      {modo === 'TARJETAS'
        ? tarjetas.map((t) => (
            <View
              key={`tarjeta-${t.filas[0]!.sitio.clave}`}
              style={{ position: 'absolute', left: t.x, top: t.y, width: t.ancho, height: t.alto, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: lamina.borde, backgroundColor: lamina.tarjeta }}
            >
              {t.filas.map((f) => (
                <FilaDeLaLamina key={f.sitio.clave} fila={f} lamina={lamina} />
              ))}
            </View>
          ))
        : null}
    </View>
  );
}

/**
 * Una fila de tarjeta: el rótulo del compositor, el valor y la diferencia con la toma anterior comparable. Crece con la
 * letra de la persona; el alto lo calculó la composición para esa letra, y el rótulo puede ir en dos líneas.
 */
function FilaDeLaLamina({ fila, lamina }: { fila: FilaDeLaTarjeta; lamina: ColoresDeLamina }) {
  const { sitio } = fila;
  return (
    <View style={{ height: fila.alto, justifyContent: 'center' }}>
      <Text style={{ fontSize: LETRA.rotulo, lineHeight: INTERLINEA.rotulo, color: lamina.nombre }} numberOfLines={fila.lineasDelRotulo}>
        {sitio.rotulo}
      </Text>
      <Text numberOfLines={1} style={{ lineHeight: INTERLINEA.valor }}>
        <Text style={{ fontSize: LETRA.valor, fontWeight: '700', color: lamina.valor }}>{sitio.valor}</Text>
        {sitio.diferencia ? <Text style={{ fontSize: LETRA.detalle, color: lamina.detalle }}>{`  ${sitio.diferencia}`}</Text> : null}
      </Text>
    </View>
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
function ListaDeNumeros({ sitios, ficha, lamina }: { sitios: readonly SitioDeLaFigura[]; ficha: number; lamina: ColoresDeLamina }) {
  return (
    <View style={{ backgroundColor: lamina.fondo, borderRadius: 16, padding: 10, marginBottom: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: lamina.nombre, marginBottom: 6 }}>{COPY_ANTROPOMETRIA.numerosDeLaFigura}</Text>
      {sitios.map((s) => (
        <View key={s.clave} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, borderTopWidth: s.numero === 1 ? 0 : 1, borderTopColor: lamina.borde }}>
          <View style={{ width: ficha, height: ficha, borderRadius: ficha / 2, borderWidth: 1, borderColor: lamina.borde, backgroundColor: lamina.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: lamina.valor }} maxFontSizeMultiplier={1.6}>
              {String(s.numero)}
            </Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 10 }}>
            <Text style={{ fontSize: 15, color: lamina.nombre, flexShrink: 1 }}>{s.rotulo}</Text>
            <Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: lamina.valor }}>{s.valor}</Text>
              {s.diferencia ? <Text style={{ fontSize: 14, color: lamina.detalle }}>{`  ${s.diferencia}`}</Text> : null}
            </Text>
          </View>
        </View>
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
