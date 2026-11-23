'use client';

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-06) · «Antes de activar» deja de ser una pestaña del panel: va al lado de «Revisar y
 * activar», como un aviso corto que dice cuántas cosas impiden activar («4 cosas impiden activar ›»). Al tocarlo se
 * despliega la lista, con lo que impide y lo que queda sin completar; cada cosa lleva directo a completarla.
 * - Es un botón que despliega (`aria-expanded`); Escape lo cierra y devuelve el foco; tocar afuera también lo cierra.
 * - Mientras la API revisa lo guardado, lo dice; nunca «nada impide» antes de su respuesta (ENP-D13).
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import type { EstadoDeLaRevision } from './revision-del-plan';

export const COPY_LO_QUE_IMPIDE_ACTIVAR = {
  impiden: (n: number) => (n === 1 ? '1 cosa impide activar' : `${n} cosas impiden activar`),
  revisando: 'Revisando lo guardado…',
  sinRevisar: 'Sin revisar todavía',
  nada: 'Nada impide activar',
  titulo: 'Antes de activar',
} as const;
const T = COPY_LO_QUE_IMPIDE_ACTIVAR;

/** El texto del aviso: cuántas cosas impiden, o si se está revisando, o que nada impide. */
export function textoDelAviso(cuantos: number, estado: EstadoDeLaRevision, delEditor: number): string {
  if (cuantos > 0 && (estado === 'lista' || delEditor > 0)) return T.impiden(cuantos);
  if (estado === 'revisando') return T.revisando;
  if (estado === 'lista') return T.nada;
  return T.sinRevisar;
}

export function LoQueImpideActivar({
  cuantos,
  estado,
  delEditor,
  abierto,
  onAbrir,
  children,
}: {
  cuantos: number;
  estado: EstadoDeLaRevision;
  /** Cuántas cosas ve el editor solo (sin esperar a la API). */
  delEditor: number;
  abierto: boolean;
  onAbrir: (abierto: boolean) => void;
  /** La lista: lo que impide (con su «Ir a…») y lo que queda sin completar. */
  children: ReactNode;
}) {
  const id = useId();
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) onAbrir(false);
    };
    document.addEventListener('pointerdown', afuera);
    return () => document.removeEventListener('pointerdown', afuera);
  }, [abierto, onAbrir]);
  const texto = textoDelAviso(cuantos, estado, delEditor);
  const impide = cuantos > 0 && (estado === 'lista' || delEditor > 0);
  return (
    <div
      ref={caja}
      className="lo-que-impide-activar"
      data-impide={impide ? '' : undefined}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !abierto) return;
        e.stopPropagation();
        onAbrir(false);
        boton.current?.focus();
      }}
    >
      <button
        ref={boton}
        type="button"
        className="boton boton--discreto lo-que-impide-activar__boton"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        onClick={() => onAbrir(!abierto)}
        id="lo-que-impide-activar"
        data-lo-que-impide-activar={impide ? cuantos : 0}
        data-recorrido="editor-entrenamiento-antes-de-activar"
      >
        <Icono nombre={impide ? 'aviso' : estado === 'lista' ? 'tilde' : 'espera'} tamano={15} />
        {texto}
        <Icono nombre={abierto ? 'arriba' : 'derecha'} tamano={15} />
      </button>
      <div id={`${id}-lista`} className="lo-que-impide-activar__lista" role="region" aria-label={T.titulo} hidden={!abierto} data-panel-en-vivo>
        {abierto ? children : null}
      </div>
    </div>
  );
}
