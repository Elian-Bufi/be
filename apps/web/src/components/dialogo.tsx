'use client';

/**
 * Confirmación contextual con CTA explícito (10-B04 §26: sin «Escribí FINALIZAR»). `<dialog>` nativo en modo modal:
 * retiene el foco y lo devuelve al disparador al cerrar; Esc equivale a «Volver» salvo mientras se envía. El foco
 * inicial cae en el primer control (el motivo, si hay, o «Volver»): la acción de efecto nunca es la opción por defecto.
 */
import { COPY_VINCULO } from '@be/domain';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Aviso } from './formulario';

interface PropsDeDialogo {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly children: ReactNode;
  readonly textoVolver: string;
  readonly textoConfirmar: string;
  readonly textoEnviando: string;
  readonly peligro?: boolean;
  readonly enviando: boolean;
  readonly error?: string | null;
  readonly confirmarDeshabilitado?: boolean;
  readonly onVolver: () => void;
  readonly onConfirmar: () => void;
}

export function DialogoDeConfirmacion({
  abierto,
  titulo,
  children,
  textoVolver,
  textoConfirmar,
  textoEnviando,
  peligro = false,
  enviando,
  error = null,
  confirmarDeshabilitado = false,
  onVolver,
  onConfirmar,
}: PropsDeDialogo) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        if (!enviando) onVolver();
      }}
    >
      <h2 id={`${id}-titulo`}>{titulo}</h2>
      {children}
      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver} disabled={enviando}>
          {textoVolver}
        </button>
        <button
          type="button"
          className={`boton ${peligro ? 'boton--peligro' : 'boton--primario'}`}
          onClick={onConfirmar}
          disabled={enviando || confirmarDeshabilitado}
          aria-busy={enviando}
        >
          {enviando ? textoEnviando : textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}

/** Selector de motivo de una lista cerrada (DL-033), sin preselección: confirmar exige elegir. */
export function SelectorDeMotivo<M extends string>({
  motivos,
  etiquetas,
  valor,
  onCambio,
}: {
  motivos: readonly M[];
  etiquetas: Readonly<Record<M, string>>;
  valor: M | '';
  onCambio: (m: M | '') => void;
}) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={`${id}-motivo`}>{COPY_VINCULO.motivo}</label>
      <select id={`${id}-motivo`} value={valor} onChange={(e) => onCambio(e.target.value as M | '')}>
        <option value="">Elegí un motivo</option>
        {motivos.map((m) => (
          <option key={m} value={m}>
            {etiquetas[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
