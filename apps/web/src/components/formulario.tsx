'use client';

/**
 * Piezas de formulario accesibles (10-B10 §6-§8): label persistente (el placeholder no la sustituye), error asociado al
 * campo con texto (no solo color), resumen de errores que recibe el foco.
 */
import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface PropsDeCampo extends InputHTMLAttributes<HTMLInputElement> {
  readonly id: string;
  readonly etiqueta: string;
  readonly ayuda?: string;
  readonly error?: string | null;
}

export const Campo = forwardRef<HTMLInputElement, PropsDeCampo>(function Campo({ id, etiqueta, ayuda, error, ...resto }, ref) {
  const descripcion = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {ayuda ? (
        <p id={`${id}-ayuda`} className="campo__ayuda">
          {ayuda}
        </p>
      ) : null}
      <input ref={ref} id={id} aria-invalid={error ? true : undefined} aria-describedby={descripcion} {...resto} />
      {error ? (
        <p id={`${id}-error`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function ResumenDeErrores({ titulo, errores }: { titulo: string; errores: readonly { id: string; texto: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errores.length > 0) ref.current?.focus();
  }, [errores]);
  if (errores.length === 0) return null;
  return (
    <div ref={ref} className="aviso aviso--error" role="alert" tabIndex={-1}>
      <p className="aviso__titulo">{titulo}</p>
      <ul>
        {errores.map((e) => (
          <li key={e.id}>
            <a href={`#${e.id}`}>{e.texto}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Aviso({ tipo, children, enfocar = false }: { tipo: 'error' | 'info' | 'exito'; children: ReactNode; enfocar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (enfocar) ref.current?.focus();
  }, [enfocar]);
  return (
    <div ref={ref} className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'} tabIndex={enfocar ? -1 : undefined}>
      {children}
    </div>
  );
}
