'use client';

/**
 * Un panel que se abre encima de la vista y retiene el foco: un `<dialog>` nativo, en modo modal. Lo usa la ficha para
 * un registro de origen (`PanelDeRegistro`) y, en una ventana angosta, lo que en una ancha va al costado: el detalle de
 * un hecho, el origen de un dato y el detalle de un registro en las pestañas de área.
 * - Escape y «Cerrar» lo cierran; al cerrarse, el navegador devuelve el foco a lo que lo abrió.
 * - Lo que muestra lo decide quien lo abre: el panel es solo el marco.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Panel({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      className="dialogo dialogo--panel"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <div className="dialogo__encabezado">
        <h2 id={`${id}-titulo`}>{titulo}</h2>
        <button type="button" className="boton boton--secundario" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
      {children}
    </dialog>
  );
}
