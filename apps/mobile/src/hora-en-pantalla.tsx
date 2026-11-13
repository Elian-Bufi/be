/**
 * PG-09 (WP-PULIDO-GRANDES, con PG-D15): debajo del título de Inicio, Nutrición, Entrenamiento y Novedades, chiquito y
 * siempre, de cuándo es lo que se ve: «Al día, 10:42» o, si la última lectura falló, «Ves lo de las 9:15». Sin nada
 * confirmado a la vista, no se dibuja. La regla está en `hora-de-lo-que-ves.ts`.
 */
import { Text } from 'react-native';
import { hora } from './formato';
import { textoDeLaHora } from './hora-de-lo-que-ves';
import { useHoraDeLoQueVes } from './lecturas';
import { estilosPorTema } from './tema';

/** La hora de 24 h de un instante, en la zona del teléfono: «10:42». */
export const horaDeUnInstante = (ms: number): string => hora(new Date(ms).toISOString());

export function HoraDeLoQueVes() {
  const texto = textoDeLaHora(useHoraDeLoQueVes(), horaDeUnInstante);
  if (!texto) return null;
  return <Text style={estilos.hora}>{texto}</Text>;
}

const estilos = estilosPorTema((COLOR) => ({
  // Tenue y chica, debajo del título: un dato, no un aviso. El título deja 10 dp abajo; la hora se acerca y deja aire.
  hora: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: -6, marginBottom: 10 },
}));
