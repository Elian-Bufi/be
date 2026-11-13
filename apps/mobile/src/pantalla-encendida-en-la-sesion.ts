/**
 * PG-05 (WP-PULIDO-GRANDES): la pantalla encendida durante la sesión, con expo-keep-awake. La regla está en
 * `pantalla-encendida.ts`; acá, la app adelante o atrás y la casilla guardada en el teléfono.
 */
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { crearControlDeLaPantalla, debeEstarEncendida, type PantallaDelTelefono } from './pantalla-encendida';
import { usePreferenciasDelTelefono } from './preferencias-en-el-telefono';

/** La etiqueta propia de BE: liberar la de la sesión no toca otra que se haya pedido. */
const ETIQUETA = 'be-sesion-en-curso';

const TELEFONO: PantallaDelTelefono = {
  // Si el teléfono no deja, la sesión sigue igual: la pantalla se apaga como siempre.
  prender: () => void activateKeepAwakeAsync(ETIQUETA).catch(() => undefined),
  liberar: () => void deactivateKeepAwake(ETIQUETA).catch(() => undefined),
};

/** Mantiene la pantalla encendida mientras `corriendo`, con la app adelante y la casilla prendida. */
export function usePantallaEncendida(corriendo: boolean): void {
  const { pantallaEncendida } = usePreferenciasDelTelefono();
  const [primerPlano, setPrimerPlano] = useState(AppState.currentState === 'active');
  const [control] = useState(() => crearControlDeLaPantalla(TELEFONO));
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (momento) => setPrimerPlano(momento === 'active'));
    return () => suscripcion.remove();
  }, []);
  useEffect(() => {
    control.actualizar(debeEstarEncendida({ corriendo, primerPlano, preferencia: pantallaEncendida }));
  }, [control, corriendo, primerPlano, pantallaEncendida]);
  // Salir de la sesión la libera, siempre.
  useEffect(() => () => control.terminar(), [control]);
}
