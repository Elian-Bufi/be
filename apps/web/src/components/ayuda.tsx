'use client';

/**
 * DL-113 · dos piezas de la guía de UX (`docs/ux/GUIA-UX-UI.md`):
 * - `Ayuda`: las explicaciones largas, plegadas. La pantalla muestra primero lo que la persona viene a hacer; el por qué
 *   y el cómo se lee quedan a un toque. Es un `<details>` nativo: se abre con teclado y el lector de pantalla dice si
 *   está abierto. Nada se borra: lo que el legajo exige decir queda adentro.
 * - `AvisoFlotante`: el resultado de una acción, donde la persona está mirando. Aparece fijo abajo de la pantalla, sin
 *   mover la página ni robar el foco, y se anuncia al lector de pantalla. Es para los éxitos; un error se queda junto
 *   al formulario, con el foco, para poder corregirlo.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Ayuda({ titulo = 'Cómo se lee', children }: { titulo?: string; children: ReactNode }) {
  return (
    <details className="ayuda">
      <summary>{titulo}</summary>
      <div className="ayuda__cuerpo">{children}</div>
    </details>
  );
}

/** Lo mínimo que dura un aviso, y cuánto se suma por cada letra: unas 14 por segundo, una lectura tranquila. */
const DURACION_MINIMA_MS = 6000;
const MS_POR_LETRA = 70;

/**
 * - Se va solo cuando alcanzó a leerse: 6 segundos como mínimo, más según el largo del texto. No se va mientras la
 *   persona lo mira o tiene el foco adentro, ni nunca con `seQueda`: un aviso que trae un enlace o un botón no puede
 *   desaparecer con la acción adentro (WCAG 2.2.1).
 * - El texto entra un instante después que la región: un `role="status"` que aparece ya con texto no siempre se anuncia.
 */
export function AvisoFlotante({ children, onCerrar, seQueda = false }: { children: ReactNode; onCerrar: () => void; seQueda?: boolean }) {
  // La última función de cierre, sin reiniciar el reloj en cada dibujo del padre.
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  const caja = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pausado, setPausado] = useState(false);
  useEffect(() => {
    const cuadro = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(cuadro);
  }, []);
  useEffect(() => {
    if (!visible || seQueda || pausado) return;
    const letras = caja.current?.textContent?.length ?? 0;
    const reloj = setTimeout(() => cerrar.current(), Math.max(DURACION_MINIMA_MS, 2000 + letras * MS_POR_LETRA));
    return () => clearTimeout(reloj);
  }, [visible, seQueda, pausado]);
  return (
    <div
      className="aviso-flotante"
      role="status"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="aviso-flotante__texto" ref={caja}>
        {visible ? children : null}
      </div>
      <button type="button" className="aviso-flotante__cerrar" onClick={() => cerrar.current()} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
