'use client';

/**
 * Piezas de formulario accesibles (10-B10 §6-§8): label persistente (el placeholder no la sustituye), error asociado al
 * campo con texto (no solo color), resumen de errores que recibe el foco.
 */
import { forwardRef, useEffect, useRef, useState, type FocusEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { alEnviar, alSalirDelCampo, anuncioDeLosAvisos, idsDelCampo, SIN_AVISOS, type AvisosDelFormulario, type ErrorDeCampo } from './validacion-viva';

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

/**
 * El mismo error que va al resumen, indexado por el `id` del campo: el resumen enumera y el campo se marca, no una
 * cosa o la otra (10-B10 §6; B10-10:36, 164-165; DL-091 punto 3). Para un `<select>` o un `<textarea>`, que no pasan
 * por `Campo`, se usa con `aria-invalid` y `aria-describedby` a mano.
 */
export function erroresPorCampo(errores: readonly { id: string; texto: string }[]): Readonly<Record<string, string>> {
  const porCampo: Record<string, string> = {};
  for (const e of errores) porCampo[e.id] ??= e.texto;
  return porCampo;
}

/**
 * El foco va al resumen solo cuando un envío produce errores (`intento` cambia), nunca en cada render: si no, cada
 * tecla que el usuario escribe para corregir un campo le devolvería el foco al resumen (10-B10 §6-§7).
 */
export function ResumenDeErrores({ titulo, errores, intento }: { titulo: string; errores: readonly { id: string; texto: string }[]; intento: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hayErrores = errores.length > 0;
  useEffect(() => {
    if (hayErrores) ref.current?.focus();
    // A propósito depende solo del envío (intento), no de la lista.
  }, [intento]);
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

/**
 * ED-04 (WP-EDITORES-PROFESIONAL) · Los avisos de un formulario, vivos: se muestran al enviar y se actualizan al salir de
 * cada campo; mientras se escribe, nada cambia (la regla, en `validacion-viva.ts`). `validar` dice lo que falta ahora.
 * El formulario pone `alSalir` en el `onBlur` de su `<form>`, `errores` y `envios` en `ResumenDeErrores`, y
 * `AnuncioDeLosAvisos` con el texto de listo.
 */
export function useAvisosVivos(validar: () => readonly ErrorDeCampo[]) {
  const [avisos, setAvisos] = useState<AvisosDelFormulario>(SIN_AVISOS);
  const [envios, setEnvios] = useState(0);
  const ultimo = useRef(validar);
  ultimo.current = validar;
  return {
    errores: avisos.mostrados,
    envios,
    /** Al enviar: muestra todo lo que falta y lo devuelve. */
    alEnviar: (): readonly ErrorDeCampo[] => {
      const ahora = ultimo.current();
      setAvisos(alEnviar(ahora));
      setEnvios((n) => n + 1);
      return ahora;
    },
    /** En el `onBlur` del `<form>`: el campo que se dejó dice lo que tiene ahora. */
    alSalir: (evento: FocusEvent<HTMLElement>): void => {
      const campo = idsDelCampo(evento.target, evento.currentTarget);
      setAvisos((a) => alSalirDelCampo(a, campo, ultimo.current()));
    },
    /** Lo que oye el lector cuando ya no queda nada por corregir. */
    anuncio: (listo: string): string => anuncioDeLosAvisos(avisos, listo),
  };
}

/** ED-04: la región que lee el lector de pantalla cuando ya no queda nada por corregir («Listo para registrar»). */
export function AnuncioDeLosAvisos({ texto }: { texto: string }) {
  return (
    <p className="visualmente-oculto" role="status" aria-live="polite" data-anuncio-de-los-avisos>
      {texto}
    </p>
  );
}
