'use client';

/**
 * Confirmación contextual con CTA explícito (10-B04 §26: sin «Escribí FINALIZAR»). `<dialog>` nativo en modo modal:
 * retiene el foco y lo devuelve al disparador al cerrar; Esc y tocar afuera (NUP-11) equivalen a «Volver» salvo mientras se
 * envía, y si se escribió algo adentro, primero preguntan en el mismo diálogo («Seguir editando» devuelve el foco adonde
 * se estaba). El foco inicial cae en el primer control (el motivo, si hay, o «Volver»): la acción de efecto nunca es la
 * opción por defecto.
 *
 * Se abre y se cierra en un efecto de diseño (`useLayoutEffect`), antes de los efectos comunes de la página. Cerrar un
 * diálogo modal devuelve el foco a quien lo abrió: si eso pasara después, le sacaría el foco a lo que la página enfoca al
 * cerrarlo. Pasaba con «Ir a corregir» de «Antes de activar» y un nombre vacío: el campo tomaba el foco y el cierre se lo
 * devolvía a «Revisar y activar…» (revisión adversaria de la etapa 1 de WP-EDITORES-PROFESIONAL).
 */
import { COPY_VINCULO } from '@be/domain';
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { COPY_CUADRO_ENFOCADO } from './cuadro-enfocado';
import { Aviso } from './formulario';
import { useSeguirEditando, useTocarAfuera } from './tocar-afuera';

/** El primer control del diálogo, donde cae el foco al abrirlo. */
const PRIMER_CONTROL = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';

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
  const seguir = useRef<HTMLButtonElement>(null);
  const id = useId();
  // NUP-11 (NUP-D10): si se escribió algo adentro desde que se abrió, Escape y tocar afuera primero preguntan.
  const escrito = useRef(false);
  const [preguntando, setPreguntando] = useState(false);

  useLayoutEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      escrito.current = false;
      setPreguntando(false);
      dialogo.showModal();
      if (focoEnVolver) volver.current?.focus();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto, focoEnVolver]);

  useLayoutEffect(() => {
    if (preguntando) seguir.current?.focus();
  }, [preguntando]);
  // «Seguir editando»: la pregunta se va con su botón, y el foco vuelve adonde se estaba (o al primer control, como al
  // abrir), no al documento.
  const seguirEditando = useSeguirEditando(ref, () => ref.current?.querySelector<HTMLElement>(PRIMER_CONTROL) ?? null, preguntando);

  /** Escape y tocar afuera: nunca mientras se envía; con algo escrito, preguntan. «Volver» es explícito y no pregunta. */
  const pedirVolver = () => {
    if (enviando) return;
    if (escrito.current && !preguntando) return setPreguntando(true);
    setPreguntando(false);
    onVolver();
  };
  const afuera = useTocarAfuera(pedirVolver, !enviando);

  return (
    <dialog
      ref={ref}
      className={ancho ? 'dialogo dialogo--ancho' : 'dialogo'}
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        pedirVolver();
      }}
      onInput={() => {
        escrito.current = true;
      }}
      onFocus={seguirEditando.alEnfocar}
      {...afuera}
    >
      <h2 id={`${id}-titulo`}>{titulo}</h2>
      {children}
      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}
      {/* NUP-11: la pregunta va en el mismo diálogo, en el lugar de las acciones: un diálogo no abre otro encima. */}
      {preguntando ? (
        <div className="dialogo__pregunta" role="alertdialog" aria-labelledby={`${id}-pregunta`} aria-describedby={`${id}-explicacion`} data-pregunta-al-cerrar>
          <p id={`${id}-pregunta`}>
            <strong>{COPY_CUADRO_ENFOCADO.preguntaAlCerrar}</strong>
          </p>
          <p id={`${id}-explicacion`} className="nota">
            {COPY_CUADRO_ENFOCADO.explicacionAlCerrar}
          </p>
          <p className="dialogo__acciones-de-la-pregunta">
            <button ref={seguir} type="button" className="boton boton--secundario" onClick={() => seguirEditando.seguir(() => setPreguntando(false))}>
              {COPY_CUADRO_ENFOCADO.seguirEditando}
            </button>
            <button type="button" className="boton boton--quieto" onClick={pedirVolver}>
              {COPY_CUADRO_ENFOCADO.cerrarSinGuardar}
            </button>
          </p>
        </div>
      ) : (
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
      )}
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
