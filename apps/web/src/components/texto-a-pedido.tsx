'use client';

/**
 * Un texto opcional que se lee en su lugar y se cambia a pedido (WP-ESCRITORIO-AREAS, parte 8): el propósito de un
 * bloque o de un microciclo, las indicaciones de una sesión. Es el par de `CampoDeNombre` para lo que puede no estar.
 * - Con texto, se lee con su rótulo y «Cambiar» al lado. Sin texto, ofrece agregarlo: no ocupa un campo vacío.
 * - «Cambiar» abre el campo en el lugar, con el foco. Salir de él lo cierra; Enter también, salvo en un texto de varios
 *   renglones, donde Enter es un renglón nuevo; Escape lo cierra siempre. Lo escrito queda: no hay nada que confirmar.
 * - Cerrado con el teclado, el foco vuelve al botón que lo abrió: no se pierde.
 */
import { useEffect, useRef } from 'react';
import { conNumerosPegados } from './en-partes';
import { Icono } from './icono';

export function TextoAPedido({
  id,
  rotulo,
  queEs,
  valor,
  maximo,
  renglones = 1,
  abierto,
  alAbrir,
  alCambiar,
  alCerrar,
}: {
  id: string;
  /** Cómo se llama el dato al leerlo: «Propósito», «Indicaciones de la sesión». */
  rotulo: string;
  /** Cómo se lo nombra al ofrecer agregarlo o cambiarlo: «un propósito», «indicaciones». */
  queEs: string;
  valor: string | null;
  maximo: number;
  /** Más de uno: un texto de varios renglones. */
  renglones?: number;
  abierto: boolean;
  alAbrir: () => void;
  alCambiar: (v: string | null) => void;
  alCerrar: () => void;
}) {
  const campo = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  // Si se cerró con el teclado, el foco vuelve al botón en cuanto está dibujado.
  const volverAlBoton = useRef(false);
  useEffect(() => {
    if (abierto) {
      if (document.activeElement !== campo.current) campo.current?.focus();
      return;
    }
    if (volverAlBoton.current) boton.current?.focus();
    volverAlBoton.current = false;
  }, [abierto]);

  if (!abierto) {
    const texto = valor?.trim() ?? '';
    return (
      <p className="texto-a-pedido" data-texto-a-pedido={id}>
        {texto ? (
          <>
            <span className="nivel-del-plan__rotulo">{rotulo}</span> <span className="texto-a-pedido__texto">{conNumerosPegados(texto)}</span>{' '}
            <button ref={boton} type="button" className="boton boton--enlace" onClick={alAbrir}>
              Cambiar<span className="visualmente-oculto"> {queEs}</span>
            </button>
          </>
        ) : (
          <button ref={boton} type="button" className="boton boton--enlace" onClick={alAbrir}>
            <Icono nombre="mas" tamano={18} />
            Agregar {queEs}
          </button>
        )}
      </p>
    );
  }
  const comun = {
    ref: campo,
    id,
    value: valor ?? '',
    maxLength: maximo,
    onBlur: alCerrar,
  };
  const cerrarConElTeclado = () => {
    volverAlBoton.current = true;
    alCerrar();
  };
  return (
    <div className="campo texto-a-pedido texto-a-pedido--abierto" data-texto-a-pedido={id}>
      <label htmlFor={id}>
        {rotulo} <span className="nota">(opcional)</span>
      </label>
      {renglones > 1 ? (
        <textarea
          {...comun}
          rows={renglones}
          onChange={(e) => alCambiar(e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cerrarConElTeclado();
          }}
        />
      ) : (
        <input
          {...comun}
          onChange={(e) => alCambiar(e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== 'Escape') return;
            e.preventDefault();
            cerrarConElTeclado();
          }}
        />
      )}
    </div>
  );
}
