/**
 * APK · «Mi evolución»: el gráfico chico de una medida a lo largo de las tomas del período (DL-117, Dirección,
 * 2026-10-04). Un punto por toma, **en el orden del selector** (T1, T2, T3…, a la misma distancia: no es el tiempo), y
 * **sin líneas**: entre dos tomas no se inventa nada. Una toma sin la medida es un hueco. Una toma con la medida en otro
 * protocolo, método o unidad lleva una raya corta sobre la base: no es un valor y no se compara (REG-06-162/165/166). La
 * toma elegida va resaltada, rellena y más grande, así la selección se ve igual en todos los gráficos.
 *
 * Dónde va cada punto lo decide `graficos-por-toma.ts`, con el ancho exacto del lugar: el gráfico no desborda con
 * ninguna cantidad de tomas. No se toca ni se recorre: lo que dice está entero en su lista equivalente, en texto.
 */
import type { TomaDelPeriodo } from '@be/domain';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { geometriaDePuntos, type EnLaToma } from '../graficos-por-toma';
import { textoPorToma } from '../textos-por-toma';
import { COLOR, estilosPorTema } from '../ui';

/** El gráfico, con un ancho y un alto dados. `elegida`: el índice de la toma elegida. */
export function PuntosPorToma({ estados, elegida, ancho, alto }: { estados: readonly EnLaToma[]; elegida: number; ancho: number; alto: number }) {
  const g = geometriaDePuntos({ ancho, alto, estados, elegida });
  if (!g) return null;
  return (
    <View style={{ width: ancho, height: alto }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={ancho} height={alto}>
        {/* La base: una referencia tenue, no una línea entre valores. */}
        <Line x1={g.base.x1} x2={g.base.x2} y1={g.base.y} y2={g.base.y} stroke={COLOR.borde} strokeWidth={1} />
        {/* Otro grupo: una raya en la x de su toma, sobre la base. No es un valor. */}
        {g.marcas.map((m) => (
          <Line key={`otro-${m.indice}`} x1={m.x} x2={m.x} y1={m.y1} y2={m.y2} stroke={COLOR.tenue} strokeWidth={1.5} />
        ))}
        {g.puntos.map((p) =>
          p.elegida ? (
            <Circle key={p.indice} cx={p.x} cy={p.y} r={p.radio} fill={COLOR.acento} />
          ) : (
            <Circle key={p.indice} cx={p.x} cy={p.y} r={p.radio} fill={COLOR.superficie} stroke={COLOR.tenue} strokeWidth={Math.min(1.6, p.radio * 0.5)} />
          ),
        )}
      </Svg>
    </View>
  );
}

/**
 * El gráfico con el ancho de su lugar, sus extremos rotulados (T1 a la izquierda, la última a la derecha) y, si se pide,
 * su lista equivalente debajo. Mientras no se conoce el ancho, ocupa su alto sin dibujar, para que nada salte.
 */
export function EvolucionPorToma({
  estados,
  tomas,
  elegida,
  alto = 26,
  conLista = true,
}: {
  estados: readonly EnLaToma[];
  tomas: readonly TomaDelPeriodo[];
  elegida: number;
  alto?: number;
  conLista?: boolean;
}) {
  const [ancho, setAncho] = useState(0);
  if (tomas.length < 2 || estados.every((e) => e.tipo === 'sin-dato')) return null;
  return (
    <View style={estilos.bloque}>
      <View onLayout={(e) => setAncho(Math.floor(e.nativeEvent.layout.width))} style={{ height: alto }}>
        {ancho > 0 ? <PuntosPorToma estados={estados} elegida={elegida} ancho={ancho} alto={alto} /> : null}
      </View>
      <View style={estilos.extremos} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text style={estilos.extremo}>{tomas[0]!.etiqueta}</Text>
        <Text style={estilos.extremo}>{tomas[tomas.length - 1]!.etiqueta}</Text>
      </View>
      {conLista ? <Text style={estilos.lista}>{textoPorToma(estados, tomas)}</Text> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  bloque: { marginTop: 6 },
  extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  extremo: { fontSize: 12, lineHeight: 16, color: COLOR.tenue },
  lista: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, fontVariant: ['tabular-nums'], marginTop: 2 },
}));
