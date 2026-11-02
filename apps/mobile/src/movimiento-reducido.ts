/**
 * Si la persona pidió reducir el movimiento en Android. Vive solo, sin piezas de interfaz, para que lo usen `ui.tsx` (la
 * casilla) y `estados.tsx` (la línea del encabezado) sin importarse entre sí.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Si la persona pidió reducir el movimiento en Android: la línea del encabezado, el aro del descanso, el indicador de la
 * recuperación y la casilla quedan quietos.
 */
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vigente = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (vigente) setReducido(r);
    });
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducido);
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);
  return reducido;
}
