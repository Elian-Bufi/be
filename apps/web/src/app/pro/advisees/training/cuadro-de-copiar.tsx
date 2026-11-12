'use client';

/**
 * ED-23 y ED-24 · El cuadro de copiar (ED-10): se elige el destino (uno, o varios ejercicios), se ve antes lo que pasa y
 * hay un solo principal. «Cancelar» y Escape no escriben nada. La lógica vive en `copiar-a.ts`.
 */
import { useEffect, useId, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Aviso } from '../../../../components/formulario';
import { COPY_COPIAR } from './copiar-a';

export interface OpcionDeCopiar {
  readonly clave: string;
  readonly nombre: string;
}

export function CuadroDeCopiar({
  abierto,
  titulo,
  sobretitulo,
  leyenda,
  opciones,
  varios,
  vacio,
  queSeCopia = null,
  vistaPrevia,
  textoDelPrincipal,
  onCopiar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  sobretitulo: string | null;
  leyenda: string;
  opciones: readonly OpcionDeCopiar[];
  /** Varios ejercicios a la vez (casillas) o un solo destino (radios). */
  varios: boolean;
  /** Lo que se dice si no hay adónde copiar. */
  vacio: string;
  queSeCopia?: string | null;
  vistaPrevia: (elegidos: readonly string[]) => string | null;
  textoDelPrincipal: (elegidos: readonly string[]) => string;
  /** Copia; devuelve por qué no se pudo, o `null` si se hizo. */
  onCopiar: (elegidos: readonly string[]) => string | null;
  onCerrar: () => void;
}) {
  const id = useId();
  const [elegidos, setElegidos] = useState<readonly string[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!abierto) return;
    setElegidos([]);
    setError(null);
  }, [abierto]);
  const alternar = (clave: string) => {
    setError(null);
    setElegidos((e) => (varios ? (e.includes(clave) ? e.filter((x) => x !== clave) : [...e, clave]) : [clave]));
  };
  const previa = elegidos.length > 0 ? vistaPrevia(elegidos) : null;
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      titulo={titulo}
      sobretitulo={sobretitulo}
      principal={
        opciones.length > 0
          ? {
              texto: textoDelPrincipal(elegidos),
              apagado: elegidos.length === 0 ? (varios ? COPY_COPIAR.elegiAlMenosUno : COPY_COPIAR.elegiUnDestino) : null,
              alTocar: () => {
                const motivo = onCopiar(elegidos);
                if (motivo) setError(motivo);
              },
            }
          : null
      }
      onCerrar={onCerrar}
    >
      {opciones.length === 0 ? (
        <p>{vacio}</p>
      ) : (
        <fieldset className="cuadro-de-copiar" data-cuadro-de-copiar>
          <legend>{leyenda}</legend>
          {opciones.map((o) => (
            <label key={o.clave} className="cuadro-de-copiar__opcion">
              <input type={varios ? 'checkbox' : 'radio'} name={`${id}-destino`} checked={elegidos.includes(o.clave)} onChange={() => alternar(o.clave)} />
              {o.nombre}
            </label>
          ))}
        </fieldset>
      )}
      {queSeCopia ? <p className="nota">{queSeCopia}</p> : null}
      {previa ? (
        <p className="cuadro-de-copiar__previa" role="status" data-vista-previa>
          {previa}
        </p>
      ) : null}
      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}
    </CuadroEnfocado>
  );
}
