/**
 * El día civil de «hoy» con el que la API resuelve sus lecturas (zona `ZONA_DE_LA_API`), y que cambia solo con la app
 * abierta (DL-117: cambio de día). Las pantallas lo usan en la clave de sus lecturas: al cambiar el día, cambia la clave
 * y la pantalla vuelve a preguntar, sin mostrar lo de ayer como si fuera de hoy (G2 de `ciclo-de-lectura.ts`).
 *
 * Se vuelve a mirar en dos momentos: a la medianoche de esa zona, con un temporizador, y al volver del segundo plano,
 * porque con el teléfono dormido el temporizador puede no correr.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { hoyEnZona, msHastaElProximoDia, ZONA_DE_LA_API } from './formato';

export function useDiaDeLaApi(): string {
  const [dia, setDia] = useState(() => hoyEnZona(ZONA_DE_LA_API));
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const mirar = () => {
      setDia(hoyEnZona(ZONA_DE_LA_API));
      clearTimeout(temporizador);
      temporizador = setTimeout(mirar, msHastaElProximoDia(ZONA_DE_LA_API));
    };
    temporizador = setTimeout(mirar, msHastaElProximoDia(ZONA_DE_LA_API));
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
