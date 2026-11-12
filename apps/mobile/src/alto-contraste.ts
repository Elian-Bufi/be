/**
 * Si la persona prendió el «Texto de alto contraste» de Android (WP-APP-VUELTA-2 §3.2, DL-170). Vive solo, como
 * `movimiento-reducido.ts`, para que lo use la raíz sin importar piezas de interfaz. Con él, el vidrio vuelve a ser la
 * superficie opaca y el fondo de la app queda liso. En un teléfono que no lo informa, se toma como apagado.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useAltoContraste(): boolean {
  const [alto, setAlto] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let vigente = true;
    AccessibilityInfo.isHighTextContrastEnabled()
      .then((r) => {
        if (vigente) setAlto(r);
      })
      .catch(() => undefined);
    const suscripcion = AccessibilityInfo.addEventListener('highTextContrastChanged', setAlto);
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);
  return alto;
}
