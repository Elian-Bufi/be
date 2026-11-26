'use client';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-22 y ET3-23) · reordenar los ejercicios de la sesión **arrastrando** desde su
 * asa, o **con el teclado** (Alt+↑ y Alt+↓ con el foco en cualquier parte del ejercicio; también «Subir» y «Bajar» en su
 * «Más»). Arrastrar y soltar del navegador (HTML5), sin librerías.
 * - El asa está siempre (RP-19: aparecer al pasar el mouse correría el título); la marca de dónde cae es una línea hecha
 *   con una sombra, que no ocupa lugar.
 * - Lo que se mueve se le dice al lector en un renglón oculto con `aria-live` («“Sentadilla” quedó en el lugar 2 de 5»).
 * - La regla es la de «Subir» y «Bajar» (`reordenar.ts`): arrastrar no rompe un bloque de la sesión.
 */
import { useState, type DragEvent, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { COPY_REORDENAR, destinoAlSoltar, pasoDelTeclado } from './reordenar';

export interface ArrastreDeLaTarjeta {
  /** Lo que va en la tarjeta del ejercicio (la `section`): dónde se suelta y las teclas. */
  readonly propsDeLaTarjeta: HTMLAttributes<HTMLElement> & { readonly 'data-soltar'?: 'arriba' | 'abajo' };
  /** El asa, al principio de la cabecera. */
  readonly asa: ReactNode;
}

const TIPO = 'application/x-be-ejercicio';

/**
 * Lo que necesita el arrastre de la sesión que se mira: `alMover(desde, hasta)` mueve y devuelve dónde quedó (o `null` si
 * no se movió); `nombreDe(l)` es el nombre del ejercicio para el anuncio; `idDelAsa(l)`, el identificador del asa de cada
 * posición (para volver a poner el foco).
 */
export interface SesionQueSeArrastra {
  readonly largo: number;
  readonly alMover: (desde: number, hasta: number) => number | null;
  readonly nombreDe: (l: number) => string;
  readonly idDelAsa: (l: number) => string;
  readonly alEnfocar: (id: string) => void;
}

/**
 * El hook va antes de los `return` tempranos del editor; la sesión se le pasa con `sesion()`, que se lee al dibujar cada
 * tarjeta y al mover (el editor la pone al día en cada dibujo).
 */
export function useArrastreDeEjercicios(sesion: () => SesionQueSeArrastra | null): { readonly para: (l: number) => ArrastreDeLaTarjeta; readonly anuncio: ReactNode } {
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<{ readonly l: number; readonly arriba: boolean } | null>(null);
  const [texto, setTexto] = useState('');

  const mover = (desde: number, hasta: number, conElTeclado: boolean) => {
    const s = sesion();
    if (!s) return;
    const nombre = s.nombreDe(desde);
    const quedo = s.alMover(desde, hasta);
    setTexto(quedo === null ? COPY_REORDENAR.noSeMueve(nombre) : COPY_REORDENAR.movido(nombre, quedo, s.largo));
    if (quedo !== null && conElTeclado) s.alEnfocar(s.idDelAsa(quedo));
  };

  const mitadDeArriba = (e: DragEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientY < r.top + r.height / 2;
  };

  const para = (l: number): ArrastreDeLaTarjeta => {
    const s = sesion();
    const nombre = s?.nombreDe(l) ?? '';
    return {
    propsDeLaTarjeta: {
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        const paso = pasoDelTeclado(e);
        // En un desplegable, Alt+↓ lo abre: es del navegador.
        if (paso === null || (e.target as HTMLElement).tagName === 'SELECT') return;
        e.preventDefault();
        e.stopPropagation();
        mover(l, l + paso, true);
      },
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (arrastrando === null || !e.dataTransfer.types.includes(TIPO)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const arriba = mitadDeArriba(e);
        if (sobre?.l !== l || sobre.arriba !== arriba) setSobre({ l, arriba });
      },
      onDragLeave: (e: DragEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && sobre?.l === l) setSobre(null);
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        if (arrastrando === null) return;
        e.preventDefault();
        const desde = arrastrando;
        setArrastrando(null);
        setSobre(null);
        const hasta = destinoAlSoltar(desde, l, mitadDeArriba(e));
        if (hasta !== desde) mover(desde, hasta, false);
      },
      ...(sobre?.l === l && arrastrando !== null && arrastrando !== l ? { 'data-soltar': sobre.arriba ? 'arriba' : 'abajo' } : {}),
      ...(arrastrando === l ? { 'data-arrastrando': '' } : {}),
    } as ArrastreDeLaTarjeta['propsDeLaTarjeta'],
    asa: (
      <button
        type="button"
        id={s?.idDelAsa(l)}
        className="ejercicio-del-editor__asa"
        draggable
        data-asa-de-arrastre
        aria-label={`${COPY_REORDENAR.agarrar}: «${nombre}». Alt+↑ y Alt+↓ lo mueven`}
        title={COPY_REORDENAR.ayuda}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData(TIPO, String(l));
          // La imagen que se arrastra es la tarjeta entera, no solo el asa.
          const tarjeta = e.currentTarget.closest('section');
          if (tarjeta) e.dataTransfer.setDragImage(tarjeta, 24, 24);
          setArrastrando(l);
        }}
        onDragEnd={() => {
          setArrastrando(null);
          setSobre(null);
        }}
        onKeyDown={(e) => {
          // Con el foco en el asa, ↑ y ↓ solas también mueven (es lo que se espera de un asa).
          if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          e.stopPropagation();
          mover(l, l + (e.key === 'ArrowUp' ? -1 : 1), true);
        }}
      >
        <Icono nombre="ordenar" tamano={18} />
      </button>
    ),
    };
  };

  return {
    para,
    anuncio: (
      <p className="visualmente-oculto" aria-live="polite" data-anuncio-del-reordenar>
        {texto}
      </p>
    ),
  };
}
