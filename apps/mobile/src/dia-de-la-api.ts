/**
 * El día civil de «hoy» con el que la API resuelve sus lecturas (zona `ZONA_DE_LA_API`), que cambia solo con la app
 * abierta (DL-117: cambio de día). Las pantallas lo usan en la clave de sus lecturas: al cambiar el día, cambia la clave
 * y la pantalla vuelve a preguntar, sin mostrar lo de ayer como si fuera de hoy (G2 de `ciclo-de-lectura.ts`).
 *
 * **La hora es la del servidor** (`reloj-del-servidor.ts`), medida con la cabecera `Date` de las respuestas y contada con
 * un reloj monótono, y no la del teléfono. La medianoche se espera con esa hora. Como la estimación nunca se adelanta al
 * servidor, al cambiar el día la API ya está en el día nuevo, y no hace falta un margen fijo (cierre del 2026-10-04; antes
 * eran 5 s). El día no vuelve atrás por una medición más lenta (`diaSinRetroceso`).
 *
 * Se vuelve a mirar (`vigilarElDia`, probado en `scripts/inicio.test.mjs`):
 * - a la medianoche del servidor, con un temporizador;
 * - cuando la estimación de la hora cambia, porque llegó una respuesta;
 * - al volver del segundo plano, porque con el teléfono dormido el temporizador puede no correr.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { diaDeLaApi, msHastaLaMedianocheDeLaApi } from './formato';
import { diaSinRetroceso, relojDelServidor, vigilarElDia, type Temporizador } from './reloj-del-servidor';

const TEMPORIZADOR: Temporizador = {
  esperar(ms, alCumplirse) {
    const espera = setTimeout(alCumplirse, ms);
    return () => clearTimeout(espera);
  },
};

const estimado = () => ({ dia: diaDeLaApi(relojDelServidor.ahora()), conocido: relojDelServidor.conocido() });

export function useDiaDeLaApi(): string {
  const [estado, setEstado] = useState(estimado);
  useEffect(() => {
    const mirar = () =>
      setEstado((anterior) => {
        const ahora = estimado();
        return diaSinRetroceso(anterior, ahora.dia, ahora.conocido);
      });
    const vigia = vigilarElDia(relojDelServidor, msHastaLaMedianocheDeLaApi, TEMPORIZADOR, mirar);
    // Por si la hora cambió entre el primer dibujo y este efecto.
    mirar();
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento === 'active') vigia.mirar();
    });
    return () => {
      vigia.parar();
      suscripcion.remove();
    };
  }, []);
  return estado.dia;
}
