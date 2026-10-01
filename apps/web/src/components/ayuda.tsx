'use client';

/**
 * DL-113 · dos piezas de la guía de UX (`docs/ux/GUIA-UX-UI.md`):
 * - `Ayuda`: las explicaciones largas, plegadas. La pantalla muestra primero lo que la persona viene a hacer; el por qué
 *   y el cómo se lee quedan a un toque. Es un `<details>` nativo: se abre con teclado y el lector de pantalla dice si
 *   está abierto. Nada se borra: lo que el legajo exige decir queda adentro.
 * - `AvisoFlotante`: el resultado de una acción, donde la persona está mirando. Aparece fijo abajo de la pantalla, sin
 *   mover la página ni robar el foco, se anuncia al lector de pantalla y se va solo a los 6 segundos. Es para los
 *   éxitos; un error se queda junto al formulario, con el foco, para poder corregirlo.
 */
import { useEffect, useRef, type ReactNode } from 'react';

export function Ayuda({ titulo = 'Cómo se lee', children }: { titulo?: string; children: ReactNode }) {
  return (
    <details className="ayuda">
      <summary>{titulo}</summary>
      <div className="ayuda__cuerpo">{children}</div>
    </details>
  );
}

const DURACION_MS = 6000;

export function AvisoFlotante({ children, onCerrar }: { children: ReactNode; onCerrar: () => void }) {
  // La última función de cierre, sin reiniciar el reloj en cada dibujo del padre.
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  useEffect(() => {
    const reloj = setTimeout(() => cerrar.current(), DURACION_MS);
    return () => clearTimeout(reloj);
  }, []);
  return (
    <div className="aviso-flotante" role="status">
      <div className="aviso-flotante__texto">{children}</div>
      <button type="button" className="aviso-flotante__cerrar" onClick={() => cerrar.current()} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
