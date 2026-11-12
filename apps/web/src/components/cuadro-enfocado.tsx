'use client';

/**
 * ED-10 (WP-EDITORES-PROFESIONAL, §2.3) · El cuadro enfocado: cuando aparece mucha información (el buscador, la galería
 * de presets, el detalle de una serie, «Antes de activar»), va en un cuadro y no en la página. Une el cajón (un panel al
 * costado) y el diálogo (al centro): es un `<dialog>` nativo en modo modal, que retiene el foco y, al cerrarse, el
 * navegador se lo devuelve a lo que lo abrió.
 *
 * Las reglas de §2.3, todas acá:
 * - **un solo botón principal** (`principal`): el cuadro no dibuja otro lleno;
 * - el título dice qué se decide, y **al abrirse el foco va al título** (o a `focoInicial`, un buscador);
 * - **Escape y «Cancelar» no escriben nada:** solo llaman a `onCerrar`. Mientras está `ocupado` (un envío en curso) no
 *   se cierra, porque su resultado tiene que poder leerse;
 * - **con cambios (`conCambios`), cerrar pregunta,** en el mismo cuadro: un cuadro no abre otro encima. «Seguir
 *   editando» tiene el foco;
 * - el paso siguiente reemplaza al anterior en el mismo cuadro: lo decide quien lo abre, con su contenido.
 *
 * Dibuja su contenido solo mientras está abierto: lo que tiene que sobrevivir al cierre vive en quien lo abre.
 */
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Icono } from './icono';

export const COPY_CUADRO_ENFOCADO = {
  cerrar: 'Cerrar',
  cancelar: 'Cancelar',
  preguntaAlCerrar: '¿Cerrar sin guardar lo que cambiaste acá?',
  explicacionAlCerrar: 'Lo que escribiste en este cuadro no se aplicó todavía. Si lo cerrás, se pierde.',
  seguirEditando: 'Seguir editando',
  cerrarSinGuardar: 'Cerrar sin guardar',
} as const;

export interface PrincipalDelCuadro {
  readonly texto: string;
  readonly alTocar: () => void;
  /** Por qué está apagado, dicho a su lado; `null` o ausente: se puede tocar. */
  readonly apagado?: string | null;
  readonly enviando?: boolean;
  readonly textoEnviando?: string;
}

export function CuadroEnfocado({
  abierto,
  forma = 'panel',
  titulo,
  sobretitulo = null,
  ocupado = false,
  conCambios = false,
  focoInicial,
  principal = null,
  pie = null,
  ancho = false,
  focoEnCancelar = false,
  className = '',
  onCerrar,
  children,
}: {
  abierto: boolean;
  /** `panel`: al costado, a toda la altura (el buscador, la galería). `dialogo`: al centro (una serie, una receta). */
  forma?: 'panel' | 'dialogo';
  titulo: string;
  /** De quién es lo que se decide («Diego Sosa · Entrenamiento»): el cuadro tapa el marco de la página. */
  sobretitulo?: string | null;
  ocupado?: boolean;
  /** Hay algo escrito en el cuadro que no se aplicó: cerrar pregunta. */
  conCambios?: boolean;
  focoInicial?: RefObject<HTMLElement | null>;
  /** El único botón lleno del cuadro. Sin él, el cuadro solo se lee y se cierra. */
  principal?: PrincipalDelCuadro | null;
  /** Lo que va en el pie junto al principal: lo que hay que saber antes de tocarlo. */
  pie?: ReactNode;
  /** Un diálogo con más para leer: más ancho. */
  ancho?: boolean;
  /** Una confirmación que hace perder algo (ED-23): el foco entra en «Cancelar». */
  focoEnCancelar?: boolean;
  className?: string;
  onCerrar: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const seguirRef = useRef<HTMLButtonElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const [preguntando, setPreguntando] = useState(false);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      setPreguntando(false);
      ((focoEnCancelar ? cancelarRef.current : null) ?? focoInicial?.current ?? tituloRef.current)?.focus({ preventScroll: true });
    }
    if (!abierto && d.open) d.close();
    // `focoInicial` es una referencia: no cambia entre un dibujo y otro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (preguntando) seguirRef.current?.focus();
  }, [preguntando]);

  /** Escape, «Cerrar» y «Cancelar»: nunca escriben. Con cambios, primero preguntan. */
  const pedirCerrar = () => {
    if (ocupado) return;
    if (conCambios && !preguntando) return setPreguntando(true);
    setPreguntando(false);
    onCerrar();
  };

  const clase = ['dialogo', 'cuadro-enfocado', forma === 'panel' ? 'cajon' : 'cuadro-enfocado--dialogo', ancho ? 'dialogo--ancho' : '', className].filter(Boolean).join(' ');
  return (
    <dialog
      ref={ref}
      className={clase}
      aria-labelledby={`${id}-titulo`}
      data-cuadro-enfocado={forma}
      onCancel={(e) => {
        e.preventDefault();
        pedirCerrar();
      }}
      onClose={() => {
        if (abierto) onCerrar();
      }}
    >
      <div className="cajon__cabecera">
        <div>
          {sobretitulo ? <p className="cajon__sobretitulo">{sobretitulo}</p> : null}
          <h2 id={`${id}-titulo`} ref={tituloRef} tabIndex={-1}>
            {titulo}
          </h2>
        </div>
        <button type="button" className="boton boton--enlace cajon__cerrar" onClick={pedirCerrar} disabled={ocupado}>
          <Icono nombre="cerrar" tamano={18} />
          {COPY_CUADRO_ENFOCADO.cerrar}
        </button>
      </div>
      <div className="cajon__cuerpo">{abierto ? children : null}</div>
      {abierto && preguntando ? (
        <div className="cajon__pie cuadro-enfocado__pregunta" role="alertdialog" aria-labelledby={`${id}-pregunta`} aria-describedby={`${id}-explicacion`}>
          <p id={`${id}-pregunta`}>
            <strong>{COPY_CUADRO_ENFOCADO.preguntaAlCerrar}</strong>
          </p>
          <p id={`${id}-explicacion`} className="nota">
            {COPY_CUADRO_ENFOCADO.explicacionAlCerrar}
          </p>
          <div className="acciones">
            <button ref={seguirRef} type="button" className="boton boton--secundario" onClick={() => setPreguntando(false)}>
              {COPY_CUADRO_ENFOCADO.seguirEditando}
            </button>
            <button type="button" className="boton boton--quieto" data-cerrar-sin-guardar onClick={pedirCerrar}>
              {COPY_CUADRO_ENFOCADO.cerrarSinGuardar}
            </button>
          </div>
        </div>
      ) : null}
      {abierto && !preguntando && (pie || principal) ? (
        <div className="cajon__pie">
          {pie}
          {principal ? (
            <div className="acciones">
              <button ref={cancelarRef} type="button" className="boton boton--enlace" onClick={pedirCerrar} disabled={ocupado} data-cancelar-del-cuadro>
                {COPY_CUADRO_ENFOCADO.cancelar}
              </button>
              {principal.apagado ? (
                <p id={`${id}-motivo`} className="nota dialogo__motivo">
                  {principal.apagado}
                </p>
              ) : null}
              <button
                type="button"
                className="boton boton--primario"
                data-principal-del-cuadro
                aria-disabled={principal.apagado ? true : undefined}
                aria-describedby={principal.apagado ? `${id}-motivo` : undefined}
                aria-busy={principal.enviando || undefined}
                disabled={principal.enviando}
                onClick={() => {
                  if (!principal.apagado && !principal.enviando) principal.alTocar();
                }}
              >
                {principal.enviando ? (principal.textoEnviando ?? principal.texto) : principal.texto}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
