/**
 * El día civil de «hoy» con el que la API resuelve sus lecturas (zona `ZONA_DE_LA_API`), y que cambia solo con la app
 * abierta (DL-117: cambio de día). Las pantallas lo usan en la clave de sus lecturas: al cambiar el día, cambia la clave
 * y la pantalla vuelve a preguntar, sin mostrar lo de ayer como si fuera de hoy (G2 de `ciclo-de-lectura.ts`).
 *
 * Se vuelve a mirar en dos momentos: a la medianoche de esa zona, con un temporizador, y al volver del segundo plano,
 * porque con el teléfono dormido el temporizador puede no correr.
 *
 * La medianoche se mira con el reloj del teléfono, y la API con el de su base. El temporizador espera 5 s más: si el
 * teléfono va un poco adelantado, no pide «hoy» cuando para la API todavía es ayer (revisión de la candidata).
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { hoyEnZona, msHastaElProximoDia, ZONA_DE_LA_API } from './formato';

/** Lo que el temporizador espera después de la medianoche del teléfono, por si su reloj va adelantado. */
export const MARGEN_DEL_RELOJ_MS = 5000;

export function useDiaDeLaApi(): string {
  const [dia, setDia] = useState(() => hoyEnZona(ZONA_DE_LA_API));
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const mirar = () => {
      setDia(hoyEnZona(ZONA_DE_LA_API));
      clearTimeout(temporizador);
      temporizador = setTimeout(mirar, msHastaElProximoDia(ZONA_DE_LA_API) + MARGEN_DEL_RELOJ_MS);
    };
    temporizador = setTimeout(mirar, msHastaElProximoDia(ZONA_DE_LA_API) + MARGEN_DEL_RELOJ_MS);
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento === 'active') mirar();
    });
    return () => {
      clearTimeout(temporizador);
      suscripcion.remove();
    };
  }, []);
  return dia;
}
