/**
 * APK · «Mi evolución»: el detalle de la medida elegida, en el mapa corporal o en los indicadores (cierre del 2026-10-04).
 *
 * Dice su valor, el anterior comparable con su fecha y la diferencia, el método si es un resultado de fórmula, y la clase
 * del dato si no es medido. Debajo, su gráfico de puntos por toma, más grande, con los extremos rotulados y la lista
 * equivalente. «Ver su evolución» abre la vista Evolución con la misma medida y el mismo grupo de comparabilidad: ahí el
 * gráfico usa las fechas.
 */
import { cantidad, COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, nombreDeMetodo, textoDeDiferenciaAntropometrica, type MedidaDeLaToma } from '@be/domain';
import { Text, View } from 'react-native';
import { fechaCivil } from '../formato';
import type { PuntosDeLaToma } from '../graficos-por-toma';
import { Boton, estilosPorTema } from '../ui';
import { EvolucionPorToma } from './puntos-por-toma';

/** El anterior comparable, o por qué no lo hay; con la fecha si no es la de la comparación de la toma. */
export function textoDelAnterior(medida: MedidaDeLaToma, fechaComparada: string | null): string {
  const { anterior, motivoSinAnterior } = medida;
  if (!anterior) return motivoSinAnterior === 'OTRO_GRUPO' ? COPY_ANTROPOMETRIA.sinAnteriorOtroGrupo : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  return `${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}${anterior.fecha === fechaComparada ? '' : `, el ${fechaCivil(anterior.fecha)}`}`;
}

/** El método de un resultado de fórmula, con su nombre del catálogo. */
export const textoDelMetodo = (medida: MedidaDeLaToma): string =>
  `${COPY_ANTROPOMETRIA.metodoDelResultado}: ${nombreDeMetodo(medida.actual.grupo?.methodVersionId ?? null) ?? COPY_ANTROPOMETRIA.metodoSinNombre}`;

/** La clase del dato si no es medido, y si su valor vigente viene de una corrección. */
export function textoDeLaClase(medida: MedidaDeLaToma): string | null {
  const { punto } = medida.actual;
  const partes = [punto.dataClass === 'MEASURED' ? null : ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass], punto.correctionState === 'CORRECTED' ? COPY_ANTROPOMETRIA.corregida : null].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}

export function DetalleDeLaMedida({
  medida,
  rotulo,
  fechaComparada,
  puntos,
  verSuEvolucion,
  enLaTarjeta = false,
}: {
  medida: MedidaDeLaToma;
  /** El nombre en la figura, si no es el de la medida («Tríceps · posterior»). */
  rotulo?: string;
  fechaComparada: string | null;
  puntos: PuntosDeLaToma;
  verSuEvolucion: (m: MedidaDeLaToma) => void;
  /** Dentro de su tarjeta de indicador, que ya dice el nombre y el valor: sin título ni marco propio. */
  enLaTarjeta?: boolean;
}) {
  const { actual, diferencia } = medida;
  const clase = textoDeLaClase(medida);
  const esResultado = actual.punto.dataClass === 'DERIVED';
  return (
    <View style={enLaTarjeta ? estilos.enLaTarjeta : estilos.detalle}>
      <View accessible accessibilityLiveRegion="polite">
        {enLaTarjeta ? null : <Text style={estilos.titulo}>{`${rotulo ?? medida.nombre}: ${cantidad(actual.punto.value, actual.punto.unit)}`}</Text>}
        {diferencia ? <Text style={estilos.diferencia}>{`${COPY_ANTROPOMETRIA.diferencia}: ${textoDeDiferenciaAntropometrica(diferencia)}`}</Text> : null}
        <Text style={estilos.texto}>{textoDelAnterior(medida, fechaComparada)}</Text>
        {esResultado ? <Text style={estilos.texto}>{textoDelMetodo(medida)}</Text> : null}
        {clase ? <Text style={estilos.texto}>{clase}</Text> : null}
      </View>
      <EvolucionPorToma estados={puntos.estados(medida)} tomas={puntos.tomas} elegida={puntos.elegida} alto={40} />
      <Boton texto="Ver su evolución" tipo="enlace" onPress={() => verSuEvolucion(medida)} />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  enLaTarjeta: { marginTop: 2 },
  detalle: { borderRadius: 12, borderWidth: 1, borderColor: COLOR.acento, backgroundColor: COLOR.superficie, paddingVertical: 10, paddingHorizontal: 12, marginVertical: 6 },
  titulo: { fontSize: 16, lineHeight: 22, fontWeight: '800', color: COLOR.texto },
  diferencia: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLOR.texto, marginTop: 2 },
  texto: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, marginTop: 2 },
}));
