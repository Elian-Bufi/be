'use client';

/**
 * Confirmación contextual con CTA explícito (10-B04 §26: sin «Escribí FINALIZAR»). `<dialog>` nativo en modo modal:
 * retiene el foco y lo devuelve al disparador al cerrar; Esc equivale a «Volver» salvo mientras se envía. El foco
 * inicial cae en el primer control (el motivo, si hay, o «Volver»): la acción de efecto nunca es la opción por defecto.
 *
 * Se abre y se cierra en un efecto de diseño (`useLayoutEffect`), antes de los efectos comunes de la página. Cerrar un
 * diálogo modal devuelve el foco a quien lo abrió: si eso pasara después, le sacaría el foco a lo que la página enfoca al
 * cerrarlo. Pasaba con «Ir a corregir» de «Antes de activar» y un nombre vacío: el campo tomaba el foco y el cierre se lo
 * devolvía a «Revisar y activar…» (revisión adversaria de la etapa 1 de WP-EDITORES-PROFESIONAL).
 */
import { COPY_VINCULO } from '@be/domain';
import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
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
  /** Al abrirse, el foco va a «Volver»: para un diálogo con un campo adentro, que si no se llevaría el foco. */
  readonly focoEnVolver?: boolean;
  /** ED-07: por qué el botón de efecto está apagado, dicho a su lado (y al lector, como su descripción). */
  readonly motivo?: string | null;
  /** ED-07: un cuadro con más para leer («Antes de activar»): más ancho, en dos columnas si entran. */
  readonly ancho?: boolean;
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
  focoEnVolver = false,
  motivo = null,
  ancho = false,
  onVolver,
  onConfirmar,
}: PropsDeDialogo) {
  const ref = useRef<HTMLDialogElement>(null);
  const volver = useRef<HTMLButtonElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      dialogo.showModal();
      if (focoEnVolver) volver.current?.focus();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto, focoEnVolver]);

  return (
    <dialog
      ref={ref}
      className={ancho ? 'dialogo dialogo--ancho' : 'dialogo'}
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
        <button ref={volver} type="button" className="boton boton--secundario" onClick={onVolver} disabled={enviando}>
          {textoVolver}
        </button>
        {/* El motivo va pegado al botón que explica, del lado del principal (maqueta 10): antes de «Volver» se leía como
            su causa. */}
        {motivo ? (
          <p id={`${id}-motivo`} className="nota dialogo__motivo">
            {motivo}
          </p>
        ) : null}
        <button
          type="button"
          className={`boton ${peligro ? 'boton--peligro' : 'boton--primario'}`}
          onClick={onConfirmar}
          disabled={enviando || confirmarDeshabilitado}
          aria-busy={enviando}
          aria-describedby={motivo ? `${id}-motivo` : undefined}
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
