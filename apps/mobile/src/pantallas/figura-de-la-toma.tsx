/**
 * APK · la figura de la lámina de Dirección con la última toma (DL-111).
 *
 * Es el modo «Medición» del compositor (docs/direccion/LAMINA-DEL-COMPOSITOR.md) llevado al teléfono: la figura a la
 * derecha y, a la izquierda, las tarjetas del compositor con una fila por sitio medido —su valor y la diferencia con la
 * toma anterior comparable—, cada fila unida a su sitio por una guía. Perímetros y pliegues van por separado, como
 * Circunferencias y Pliegues en el compositor. Las posiciones, los rótulos, el orden de las tarjetas y el apilado son
 * los del compositor (`figura-de-lamina.ts`, en @be/domain); lo que cambia es la escala, para que el texto se lea.
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
  anilloEnLaLamina,
  apilarTarjetas,
  cantidad,
  colorDeLaCapa,
  COLORES_DE_LA_FIGURA,
  COPY_ANTROPOMETRIA,
  esPliegueDeLaCaraPosterior,
  FIGURAS_DE_LA_LAMINA,
  numero,
  opacidadDeLaCapa,
  puntoEnLaLamina,
  ROTULO_EN_LA_LAMINA,
  TARJETAS_DE_PERIMETROS,
  TARJETAS_DE_PLIEGUES,
  type ClaveDeLaLamina,
  type ColoresDeLaFigura,
  type MedidaDeLaToma,
  type RectanguloEnLaLamina,
  type SexoDeLaLamina,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useApariencia } from '../apariencia';
import { ANILLO_EN_EL_TELEFONO, arcoDeLaElipse, GUIA_EN_EL_TELEFONO, PLIEGUE_EN_EL_TELEFONO, PLIEGUE_POSTERIOR_EN_EL_TELEFONO, trazoDeLaGuia } from '../dibujo-de-la-figura';
import { PALETAS, type Tema } from '../tema';
import { Boton } from '../ui';

const IMAGEN: Readonly<Record<SexoDeLaLamina, ImageSourcePropType>> = {
  HOMBRE: require('../../assets/figura/hombre-entero.png') as ImageSourcePropType,
  MUJER: require('../../assets/figura/mujer-entero.png') as ImageSourcePropType,
};
const CLAVE_DE_LA_FIGURA = 'be-figura-de-la-toma';

type Familia = 'PERIMETROS' | 'PLIEGUES';

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
  return { fondo: p.laminaFondo, tarjeta: p.laminaTarjeta, borde: p.laminaBorde, nombre: p.laminaNombre, valor: p.laminaValor, detalle: p.laminaDetalle };
};
type ColoresDeLamina = ReturnType<typeof laminaDe>;

/** Medidas del dibujo en dp. Las letras de la figura escalan hasta 1,2 veces; la lista de la pantalla escala sin tope. */
const FILA = 44;
const RELLENO = 6;
const SEPARACION = 8;
const MARGEN = 10;
const ESCALA_MAXIMA_DEL_TEXTO = 1.2;

interface Sitio {
  readonly medida: MedidaDeLaToma;
  readonly clave: ClaveDeLaLamina;
  /** Centro del sitio y el borde izquierdo del dibujo (anillo o punto), en dp del recuadro. */
  readonly cx: number;
  readonly cy: number;
  readonly izquierda: number;
  readonly anillo: { readonly rx: number; readonly ry: number } | null;
  readonly posterior: boolean;
}

export function FiguraDeLaToma({ medidas }: { medidas: readonly MedidaDeLaToma[] }) {
  const { tema } = useApariencia();
  const [sexo, setSexo] = useState<SexoDeLaLamina>('HOMBRE');
  const conValor = new Set(medidas.map((m) => m.metrica));
  const hayPerimetros = TARJETAS_DE_PERIMETROS.ENTERO.flat().some((c) => conValor.has(c));
  const hayPliegues = TARJETAS_DE_PLIEGUES.ENTERO.flat().some((c) => conValor.has(c));
  const [familia, setFamilia] = useState<Familia>(hayPerimetros ? 'PERIMETROS' : 'PLIEGUES');
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

  return (
    <View>
      {hayPerimetros && hayPliegues ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Boton texto={COPY_ANTROPOMETRIA.perimetrosEnLaFigura} tipo={familia === 'PERIMETROS' ? 'primario' : 'secundario'} seleccionado={familia === 'PERIMETROS'} onPress={() => setFamilia('PERIMETROS')} />
          </View>
          <View style={{ flex: 1 }}>
            <Boton texto={COPY_ANTROPOMETRIA.plieguesEnLaFigura} tipo={familia === 'PLIEGUES' ? 'primario' : 'secundario'} seleccionado={familia === 'PLIEGUES'} onPress={() => setFamilia('PLIEGUES')} />
          </View>
        </View>
      ) : null}
      <View onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {ancho > 0 ? <Lamina ancho={ancho} sexo={sexo} familia={familia} medidas={medidas} tema={tema} /> : null}
      </View>
      {/* Hombre o mujer, debajo de la figura: es solo cómo se ve el dibujo, no cambia ningún dato. */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Boton texto={COPY_ANTROPOMETRIA.figuraHombre} tipo={sexo === 'HOMBRE' ? 'primario' : 'secundario'} seleccionado={sexo === 'HOMBRE'} onPress={() => elegirSexo('HOMBRE')} />
        </View>
        <View style={{ flex: 1 }}>
          <Boton texto={COPY_ANTROPOMETRIA.figuraMujer} tipo={sexo === 'MUJER' ? 'primario' : 'secundario'} seleccionado={sexo === 'MUJER'} onPress={() => elegirSexo('MUJER')} />
        </View>
      </View>
    </View>
  );
}

function Lamina({ ancho, sexo, familia, medidas, tema }: { ancho: number; sexo: SexoDeLaLamina; familia: Familia; medidas: readonly MedidaDeLaToma[]; tema: Tema }) {
  const figura = FIGURAS_DE_LA_LAMINA[sexo].ENTERO;
  const colores = COLORES_DE_LA_FIGURA[TEMA_DE_LA_LAMINA[tema]];
  const lamina = laminaDe(tema);

  // La figura a la derecha, con el cuerpo en algo menos de la mitad del ancho (compositor: `figGeom`, `LAY`).
  const anchoDelCuerpo = ancho * 0.46;
  const anchoDeImagen = anchoDelCuerpo / (figura.cuerpo.ancho / 100);
  const altoDeImagen = (anchoDeImagen * figura.altoPx) / figura.anchoPx;
  const altoDelCuerpo = (altoDeImagen * figura.cuerpo.alto) / 100;

  // Los sitios con valor en la toma, agrupados en las tarjetas del compositor (`GR`, `GF`), en su orden.
  const porClave = new Map(medidas.map((m) => [m.metrica, m]));
  const lugares = familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues;
  const claves = (familia === 'PERIMETROS' ? TARJETAS_DE_PERIMETROS.ENTERO : TARJETAS_DE_PLIEGUES.ENTERO)
    .map((grupo) => grupo.filter((clave) => porClave.has(clave) && (lugares as Readonly<Record<string, unknown>>)[clave] !== undefined))
    .filter((grupo) => grupo.length > 0);
  if (claves.length === 0) return null;

  // En el teléfono las filas son más altas, en proporción, que en la lámina: con muchos sitios, las tarjetas piden más
  // alto que el cuerpo. La figura se centra en ese alto, así la diferencia se reparte arriba y abajo.
  const altos = claves.map((g) => g.length * FILA + 2 * RELLENO);
  const necesario = altos.reduce((a, b) => a + b, 0) + (claves.length - 1) * SEPARACION + 2 * MARGEN;
  const alto = Math.max(altoDelCuerpo + 2 * MARGEN, necesario);
  const desplazamiento = (alto - altoDelCuerpo - 2 * MARGEN) / 2;
  const centroX = ancho - anchoDelCuerpo / 2 - 4;
  const imagen: RectanguloEnLaLamina = {
    x: centroX - (figura.cuerpo.centroX / 100) * anchoDeImagen,
    y: MARGEN + desplazamiento - (figura.cuerpo.arriba / 100) * altoDeImagen,
    ancho: anchoDeImagen,
    alto: altoDeImagen,
  };
  const grupos = claves.map((grupo) =>
    grupo.map((clave): Sitio => {
      const medida = porClave.get(clave)!;
      if (familia === 'PERIMETROS') {
        const a = anilloEnLaLamina(imagen, figura.perimetros[clave as keyof typeof figura.perimetros]!);
        return { medida, clave, cx: a.cx, cy: a.cy, izquierda: a.cx - a.rx, anillo: { rx: a.rx, ry: Math.max(a.ry, 3) }, posterior: false };
      }
      const p = puntoEnLaLamina(imagen, figura.pliegues[clave as keyof typeof figura.pliegues]!);
      return { medida, clave, cx: p.cx, cy: p.cy, izquierda: p.cx - 7, anillo: null, posterior: esPliegueDeLaCaraPosterior(clave) };
    }),
  );
  const todos = grupos.flat();
  // Las tarjetas terminan antes del sitio que queda más a la izquierda, con lugar para el quiebre de la guía.
  const anchoDeTarjeta = Math.max(120, Math.min(ancho * 0.52, Math.min(...todos.map((s) => s.izquierda)) - 22));
  // En el teléfono las tarjetas se apilan en el orden de la altura media de sus sitios, no por el borde de arriba como en
  // el compositor: a esta escala, ese orden cruzaba las guías del tronco (ver `apilarTarjetas`).
  const bordes = apilarTarjetas(
    grupos.map((g, i) => ({ alto: altos[i]!, centroDeseado: g.reduce((n, s) => n + s.cy, 0) / g.length })),
    { tope: MARGEN, piso: alto - MARGEN, separacion: SEPARACION },
    'CENTRO',
  );

  return (
    <View style={{ height: alto, backgroundColor: lamina.fondo, borderRadius: 12, overflow: 'hidden', marginVertical: 8 }}>
      <Image source={IMAGEN[sexo]} style={{ position: 'absolute', left: imagen.x, top: imagen.y, width: imagen.ancho, height: imagen.alto }} resizeMode="stretch" />
      {/* Un solo dibujo encima del cuerpo, con las guías y los sitios; las tarjetas van encima de todo. Los sitios van
          después de las guías: en el teléfono, con todos los pliegues, alguna guía pasa junto al punto de otro sitio (el
          subescapular, junto al antebrazo), y así pasa por detrás del punto en lugar de taparlo. */}
      <Svg width={ancho} height={alto} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        {grupos.map((g, i) =>
          g.map((s, fila) => {
            const y = bordes[i]! + RELLENO + fila * FILA + FILA / 2;
            const t = s.posterior ? GUIA_EN_EL_TELEFONO.posterior : GUIA_EN_EL_TELEFONO.normal;
            return (
              <G key={`guia-${s.clave}`}>
                <Path d={trazoDeLaGuia({ x: anchoDeTarjeta + 2, y }, anchoDeTarjeta + 10, { x: s.izquierda - 3, y: s.cy })} fill="none" stroke={colores[t.color]} strokeWidth={t.grosor} strokeDasharray={[...t.guiones]} />
                <Circle cx={anchoDeTarjeta + 2.5} cy={y} r={t.radioDelPunto} fill={colores[t.colorDelPunto]} />
              </G>
            );
          }),
        )}
        {todos.map((s) => (
          <CapasDelSitio key={s.clave} sitio={s} colores={colores} />
        ))}
      </Svg>
      {grupos.map((g, i) => (
        <View
          key={`tarjeta-${g[0]!.clave}`}
          style={{ position: 'absolute', left: MARGEN / 2, top: bordes[i], width: anchoDeTarjeta - MARGEN / 2, height: altos[i], paddingVertical: RELLENO, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: lamina.borde, backgroundColor: lamina.tarjeta }}
        >
          {g.map((s) => (
            <FilaDeLaLamina key={s.clave} sitio={s} lamina={lamina} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Una fila de tarjeta: el rótulo del compositor, el valor y la diferencia con la toma anterior comparable. */
function FilaDeLaLamina({ sitio, lamina }: { sitio: Sitio; lamina: ColoresDeLamina }) {
  const { actual, diferencia } = sitio.medida;
  const signo = diferencia ? (diferencia.delta < 0 ? '−' : diferencia.delta > 0 ? '+' : '') : '';
  return (
    <View style={{ height: FILA, justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, color: lamina.nombre }} numberOfLines={1} maxFontSizeMultiplier={ESCALA_MAXIMA_DEL_TEXTO}>
        {ROTULO_EN_LA_LAMINA[sitio.clave]}
        {sitio.posterior ? ' · posterior' : ''}
      </Text>
      <Text numberOfLines={1} maxFontSizeMultiplier={ESCALA_MAXIMA_DEL_TEXTO}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: lamina.valor }}>{cantidad(actual.punto.value, actual.punto.unit)}</Text>
        {diferencia ? <Text style={{ fontSize: 12, color: lamina.detalle }}>{`  ${signo}${numero(Math.abs(diferencia.delta))}`}</Text> : null}
      </Text>
    </View>
  );
}

/**
 * Las capas de un sitio (`dibujo-de-la-figura.ts`), de abajo hacia arriba: un anillo es una elipse partida en su mitad
 * trasera y su mitad delantera; un punto, círculos concéntricos. Una capa sin color en el tema no se dibuja.
 */
function CapasDelSitio({ sitio, colores }: { sitio: Sitio; colores: ColoresDeLaFigura }) {
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
