/**
 * APK · «Mi evolución»: el gráfico chico de una medida a lo largo de las tomas del período (DL-117, Dirección,
 * 2026-10-04). Un punto por toma, en el orden del selector (T1, T2, T3…), y **sin líneas**: entre dos tomas no se inventa
 * nada. Una toma sin la medida, o con otro protocolo, método o unidad, es un hueco: no hay punto, y la lista lo dice
 * (REG-06-162/165/166). La toma elegida va resaltada, rellena y más grande, así la selección se ve igual en todos los
 * gráficos. El gráfico no se toca ni se recorre: lo que dice está entero en su lista equivalente, en texto.
 */
import type { Observacion, TomaDelPeriodo } from '@be/domain';
import { Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { textoPorToma } from '../textos-por-toma';
import { COLOR, estilosPorTema } from '../ui';

const ALTO = 34;
const MARGEN = 8;

export function PuntosPorToma({ valores, tomas, elegida }: { valores: readonly (Observacion | null)[]; tomas: readonly TomaDelPeriodo[]; elegida: string }) {
  const numeros = valores.flatMap((o) => (o ? [o.punto.value] : []));
  if (tomas.length < 2 || numeros.length === 0) return null;
  const ancho = Math.max(104, tomas.length * 30);
  const minimo = Math.min(...numeros);
  const maximo = Math.max(...numeros);
  const x = (i: number) => MARGEN + (i * (ancho - 2 * MARGEN)) / (tomas.length - 1);
  // Con todos los valores iguales, los puntos van a media altura: no hay escala que inventar.
  const y = (v: number) => (maximo === minimo ? ALTO / 2 : MARGEN + (1 - (v - minimo) / (maximo - minimo)) * (ALTO - 2 * MARGEN));
  return (
    <View style={estilos.grafico} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={ancho} height={ALTO}>
        {/* La base: una referencia tenue, no una línea entre valores. */}
        <Line x1={MARGEN} x2={ancho - MARGEN} y1={ALTO - 1} y2={ALTO - 1} stroke={COLOR.borde} strokeWidth={1} />
        {tomas.map((t, i) => {
          const o = valores[i];
          if (!o) return null;
          const esLaElegida = t.evaluacionId === elegida;
          return esLaElegida ? (
            <Circle key={t.evaluacionId} cx={x(i)} cy={y(o.punto.value)} r={5.5} fill={COLOR.acento} />
          ) : (
            <Circle key={t.evaluacionId} cx={x(i)} cy={y(o.punto.value)} r={3.5} fill={COLOR.superficie} stroke={COLOR.tenue} strokeWidth={1.6} />
          );
        })}
      </Svg>
    </View>
  );
}

/** El gráfico chico con su lista equivalente debajo, para una fila o una ficha de la toma. */
export function EvolucionPorToma({ valores, tomas, elegida }: { valores: readonly (Observacion | null)[]; tomas: readonly TomaDelPeriodo[]; elegida: string }) {
  if (tomas.length < 2 || valores.every((o) => o === null)) return null;
  return (
    <View style={estilos.bloque}>
      <PuntosPorToma valores={valores} tomas={tomas} elegida={elegida} />
      <Text style={estilos.lista}>{textoPorToma(valores, tomas)}</Text>
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  bloque: { marginTop: 4 },
  grafico: { marginVertical: 2 },
  lista: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, fontVariant: ['tabular-nums'] },
}));
