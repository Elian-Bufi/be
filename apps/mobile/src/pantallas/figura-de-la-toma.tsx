/**
 * APK · la figura de la lámina de Dirección con la última toma (DL-111).
 *
 * Es el modo «Medición» del compositor (docs/direccion/LAMINA-DEL-COMPOSITOR.md) llevado al teléfono: la figura a la
 * derecha y, a la izquierda, las tarjetas del compositor con una fila por sitio medido —su valor y la diferencia con la
 * toma anterior comparable—, cada fila unida a su sitio por una guía. Perímetros y pliegues van por separado, como
 * Circunferencias y Pliegues en el compositor. Las posiciones, los rótulos, el orden de las tarjetas y el apilado son
 * los del compositor (`figura-de-lamina.ts`, en @be/domain); lo que cambia es la escala, para que el texto se lea.
 *
 * La figura es de un hombre o de una mujer según elija la persona, y se recuerda en el teléfono: no se deduce de ningún
 * dato. Ubica, nunca califica (RF-048; INV-06-06; DL-073): los colores distinguen capas del dibujo, nunca rangos, y la
 * diferencia es un número con signo. El lector de pantalla no recorre la figura: los mismos datos, completos, están en
 * la lista de la toma, debajo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  anilloEnLaLamina,
  apilarTarjetas,
  cantidad,
  COLORES_DE_LA_FIGURA,
  COPY_ANTROPOMETRIA,
  esPliegueDeLaCaraPosterior,
  FIGURAS_DE_LA_LAMINA,
  numero,
  puntoEnLaLamina,
  ROTULO_EN_LA_LAMINA,
  TARJETAS_DE_PERIMETROS,
  TARJETAS_DE_PLIEGUES,
  type ClaveDeLaLamina,
  type MedidaDeLaToma,
  type RectanguloEnLaLamina,
  type SexoDeLaLamina,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { useApariencia } from '../apariencia';
import { PALETAS, type Tema } from '../tema';
import { Boton, Parrafo } from '../ui';

const IMAGEN: Readonly<Record<SexoDeLaLamina, ImageSourcePropType>> = {
  HOMBRE: require('../../assets/figura/hombre-entero.png') as ImageSourcePropType,
  MUJER: require('../../assets/figura/mujer-entero.png') as ImageSourcePropType,
};
const CLAVE_DE_LA_FIGURA = 'be-figura-de-la-toma';

type Familia = 'PERIMETROS' | 'PLIEGUES';

/** El tema de la lámina que corresponde a cada apariencia de la APK (compositor: `light` y `blue`). */
const TEMA_DE_LA_LAMINA = { claro: 'CLARO', 'azul-noche': 'AZUL' } as const satisfies Readonly<Record<Tema, 'CLARO' | 'AZUL'>>;

/** Los colores de la lámina fuera del dibujo: tokens de cada tema (tema.ts), medidos por la prueba de contraste. */
const laminaDe = (tema: Tema) => {
  const p = PALETAS[tema];
  return { fondo: p.laminaFondo, tarjeta: p.laminaTarjeta, borde: p.laminaBorde, nombre: p.laminaNombre, valor: p.laminaValor, detalle: p.laminaDetalle };
};
type ColoresDeLamina = ReturnType<typeof laminaDe>;

/** Medidas del dibujo en dp. Las letras de la figura escalan hasta 1,2 veces; la lista de abajo escala sin tope. */
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
      <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeFigura}</Parrafo>
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
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Boton texto={COPY_ANTROPOMETRIA.figuraHombre} tipo={sexo === 'HOMBRE' ? 'primario' : 'secundario'} seleccionado={sexo === 'HOMBRE'} onPress={() => elegirSexo('HOMBRE')} />
        </View>
        <View style={{ flex: 1 }}>
          <Boton texto={COPY_ANTROPOMETRIA.figuraMujer} tipo={sexo === 'MUJER' ? 'primario' : 'secundario'} seleccionado={sexo === 'MUJER'} onPress={() => elegirSexo('MUJER')} />
        </View>
      </View>
      <View onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {ancho > 0 ? <Lamina ancho={ancho} sexo={sexo} familia={familia} medidas={medidas} tema={tema} /> : null}
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
  const bordes = apilarTarjetas(
    grupos.map((g, i) => ({ alto: altos[i]!, centroDeseado: g.reduce((n, s) => n + s.cy, 0) / g.length })),
    { tope: MARGEN, piso: alto - MARGEN, separacion: SEPARACION },
  );

  return (
    <View style={{ height: alto, backgroundColor: lamina.fondo, borderRadius: 12, overflow: 'hidden', marginVertical: 8 }}>
      <Image source={IMAGEN[sexo]} style={{ position: 'absolute', left: imagen.x, top: imagen.y, width: imagen.ancho, height: imagen.alto }} resizeMode="stretch" />
      {todos.map((s) => (s.anillo ? <Anillo key={s.clave} sitio={s} colores={colores} /> : <Punto key={s.clave} sitio={s} colores={colores} />))}
      {grupos.map((g, i) =>
        g.map((s, fila) => {
          const y = bordes[i]! + RELLENO + fila * FILA + FILA / 2;
          const quiebre = anchoDeTarjeta + 10;
          const color = s.posterior ? colores.posterior : colores.guia;
          return (
            <View key={`guia-${s.clave}`} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
              <Segmento x1={anchoDeTarjeta + 2} y1={y} x2={quiebre} y2={y} color={color} />
              <Segmento x1={quiebre} y1={y} x2={s.izquierda - 3} y2={s.cy} color={color} />
              <View style={{ position: 'absolute', left: anchoDeTarjeta, top: y - 2.5, width: 5, height: 5, borderRadius: 2.5, backgroundColor: colores.guiaPunto }} />
            </View>
          );
        }),
      )}
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

/** El anillo de un perímetro: una elipse achatada (compositor: `ringG`), con su resplandor. */
function Anillo({ sitio, colores }: { sitio: Sitio; colores: (typeof COLORES_DE_LA_FIGURA)['CLARO'] }) {
  const { rx, ry } = sitio.anillo!;
  return (
    <>
      <View style={{ position: 'absolute', left: sitio.cx - rx - 2, top: sitio.cy - ry - 2, width: 2 * rx + 4, height: 2 * ry + 4, borderRadius: ry + 2, borderWidth: 4, borderColor: colores.anilloResplandor, opacity: 0.3 }} />
      <View style={{ position: 'absolute', left: sitio.cx - rx, top: sitio.cy - ry, width: 2 * rx, height: 2 * ry, borderRadius: ry, borderWidth: 2, borderColor: colores.anilloNucleo }} />
    </>
  );
}

/** El punto de un pliegue (compositor: `dotG`); el de la cara posterior va con el aro punteado. */
function Punto({ sitio, colores }: { sitio: Sitio; colores: (typeof COLORES_DE_LA_FIGURA)['CLARO'] }) {
  const aro = sitio.posterior ? colores.posterior : colores.puntoAro;
  const relleno = sitio.posterior ? colores.posteriorFondo : colores.puntoRelleno;
  return (
    <>
      <View style={{ position: 'absolute', left: sitio.cx - 11, top: sitio.cy - 11, width: 22, height: 22, borderRadius: 11, backgroundColor: colores.anilloResplandor, opacity: 0.18 }} />
      <View
        style={{ position: 'absolute', left: sitio.cx - 7, top: sitio.cy - 7, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: aro, borderStyle: sitio.posterior ? 'dashed' : 'solid', backgroundColor: relleno ?? 'transparent' }}
      />
      <View style={{ position: 'absolute', left: sitio.cx - 2, top: sitio.cy - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: sitio.posterior ? colores.posterior : colores.puntoCentro }} />
    </>
  );
}

/** Un tramo recto de guía entre dos puntos: una barra fina girada sobre su centro. */
function Segmento({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const largo = Math.hypot(x2 - x1, y2 - y1);
  if (largo < 0.5) return null;
  const angulo = Math.atan2(y2 - y1, x2 - x1);
  return (
    <View
      style={{ position: 'absolute', left: (x1 + x2) / 2 - largo / 2, top: (y1 + y2) / 2 - 0.75, width: largo, height: 1.5, backgroundColor: color, transform: [{ rotate: `${angulo}rad` }] }}
    />
  );
}
