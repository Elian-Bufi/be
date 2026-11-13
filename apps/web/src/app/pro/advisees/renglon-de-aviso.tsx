'use client';

/**
 * PG-10 de WP-PULIDO-GRANDES (DL-173): un renglón de «Antes de activar» o de «Queda sin completar». Si es un grupo
 * (`avisos-agrupados.ts`), dice el rango en una línea, se abre para ver cada aviso con su «Ir a corregir» y, si las
 * series no tienen repeticiones, ofrece «Completar las cuatro»: un campo que fija las repeticiones de las vacías de una
 * vez. No completa nada solo, y deshacer vuelve atrás las del grupo juntas (el aviso de «Deshacer» del editor).
 */
import { useId, useState, type FormEvent } from 'react';
import { Icono } from '../../../components/icono';
import { COPY_AVISOS_AGRUPADOS as G } from './avisos-agrupados';

/** Una cosa que impide activar o que queda sin completar, con el camino a su lugar si lo tiene. */
export interface CosaParaRevisar {
  readonly texto: string;
  readonly ir?: (() => void) | null;
  /** Si es un grupo: cada aviso, con su lugar. */
  readonly detalle?: readonly CosaParaRevisar[];
  /** Si el grupo se puede completar de una vez: cuántas series y qué hacer con lo escrito (un error, o `null`). */
  readonly completar?: { readonly cuantas: number; readonly alCompletar: (valor: string) => string | null } | null;
}

export function RenglonDeAviso({ cosa, textoIr, claseIr = 'boton boton--enlace', conIcono = false }: { cosa: CosaParaRevisar; textoIr: string; claseIr?: string; conIcono?: boolean }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const botonIr = (ir: () => void) => (
    <button type="button" className={claseIr} onClick={ir}>
      {textoIr}
      {conIcono ? <Icono nombre="derecha" tamano={15} /> : null}
    </button>
  );
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const problema = cosa.completar?.alCompletar(valor) ?? null;
    setError(problema);
    if (problema === null) {
      setCompletando(false);
      setValor('');
    }
  };
  const detalle = cosa.detalle ?? [];
  return (
    <>
      <span>{cosa.texto}</span> {cosa.ir ? botonIr(cosa.ir) : null}
      {detalle.length > 0 || cosa.completar ? (
        <span className="renglon-de-aviso__acciones" data-grupo-de-avisos={detalle.length}>
          {cosa.completar && !completando ? (
            <button type="button" className="boton boton--quieto boton--compacto" data-completar-el-grupo onClick={() => (setCompletando(true), setError(null))}>
              {G.completar(cosa.completar.cuantas)}
            </button>
          ) : null}
          {detalle.length > 0 ? (
            <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={`${id}-detalle`} onClick={() => setAbierto((a) => !a)}>
              {abierto ? G.ocultar : G.verCadaUna(detalle.length)}
            </button>
          ) : null}
        </span>
      ) : null}
      {cosa.completar && completando ? (
        <form className="renglon-de-aviso__completar" onSubmit={enviar} noValidate>
          <label htmlFor={`${id}-reps`}>{G.repeticionesDeLas(cosa.completar.cuantas)}</label>
          <p id={`${id}-ayuda`} className="campo__ayuda">
            {G.ayuda}
          </p>
          <span className="renglon-de-aviso__fila">
            <input
              id={`${id}-reps`}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={valor}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ''}`}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCompletando(false);
                }
              }}
            />
            <button type="submit" className="boton boton--primario boton--compacto">
              {G.aplicar}
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setCompletando(false)}>
              {G.cancelar}
            </button>
          </span>
          {error ? (
            <p id={`${id}-error`} className="campo__error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
      {detalle.length > 0 && abierto ? (
        <ul id={`${id}-detalle`} className="renglon-de-aviso__detalle" data-detalle-del-grupo>
          {detalle.map((d, n) => (
            <li key={n}>
              <span>{d.texto}</span> {d.ir ? botonIr(d.ir) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
