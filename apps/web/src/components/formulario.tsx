'use client';

/**
 * Piezas de formulario accesibles (10-B10 §6-§8): label persistente (el placeholder no la sustituye), error asociado al
 * campo con texto (no solo color), resumen de errores que recibe el foco.
 */
import { forwardRef, useEffect, useRef, useState, type FocusEvent, type HTMLAttributes, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { Icono } from './icono';
import {
  alEnviar,
  alSalirDelCampo,
  anuncioDeLosAvisos,
  COPY_AVISOS_VIVOS,
  enfocarLoQueFalta,
  idsDelCampo,
  renglonesDelResumen,
  siguienteQueFalta,
  SIN_AVISOS,
  type AvisosDelFormulario,
  type ErrorDeCampo,
} from './validacion-viva';

interface PropsDeCampo extends InputHTMLAttributes<HTMLInputElement> {
  readonly id: string;
  readonly etiqueta: string;
  readonly ayuda?: string;
  readonly error?: string | null;
}

export const Campo = forwardRef<HTMLInputElement, PropsDeCampo>(function Campo({ id, etiqueta, ayuda, error, ...resto }, ref) {
  const descripcion = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  // RP-19 (DL-188): un campo que recibe `error` (aunque sea `null`) puede avisar. Dentro de `.avisos-con-lugar`, su renglón
  // del aviso queda reservado: el aviso que aparece o se va no corre lo que está debajo.
  return (
    <div className={`campo${error ? ' campo--error' : ''}`} data-con-aviso={error !== undefined ? '' : undefined}>
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
  // RP-19 (DL-188): los renglones del envío quedan hasta el envío siguiente; lo corregido se marca y no se va. Si se fuera,
  // el resumen se achicaría un renglón y el formulario entero subiría justo al pasar al campo siguiente. La lista del envío
  // se toma en el mismo render en que cambia `intento` (no se pinta un cuadro con la lista vieja).
  const [delEnvio, setDelEnvio] = useState({ intento, lista: errores });
  if (delEnvio.intento !== intento) setDelEnvio({ intento, lista: errores });
  const renglones = renglonesDelResumen(delEnvio.intento === intento ? delEnvio.lista : errores, errores);
  useEffect(() => {
    if (hayErrores) ref.current?.focus();
    // A propósito depende solo del envío (intento), no de la lista.
  }, [intento]);
  if (renglones.length === 0) return null;
  const todoCorregido = renglones.every((e) => e.corregido);
  return (
    <div ref={ref} className={`aviso aviso--${todoCorregido ? 'info' : 'error'} resumen-de-errores`} role="alert" tabIndex={-1} data-resumen-de-errores>
      <p className="aviso__titulo">{todoCorregido ? COPY_AVISOS_VIVOS.todoCorregido : titulo}</p>
      <ul>
        {renglones.map((e) => (
          <li key={e.id} data-corregido={e.corregido ? '' : undefined}>
            {e.corregido ? <Icono nombre="tilde" tamano={15} /> : null}
            <a href={`#${e.id}`}>{e.texto}</a>
            {e.corregido ? <span className="visualmente-oculto"> ({COPY_AVISOS_VIVOS.corregido})</span> : null}
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
 * RP-19 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · «Sin saltos»: un renglón con su lugar reservado para lo que va y viene
 * mientras se escribe o se elige (un aviso, lo que falta de una suma, por qué un botón está apagado). Siempre está en la
 * página y, vacío, ocupa lo mismo: lo que aparece no corre los campos ni los botones. `juntoAlBoton`: al lado de un botón,
 * con su alto, para que el botón no se mueva aunque el texto ocupe dos renglones. `anunciar`: el lector de pantalla lo lee
 * al cambiar. Las reglas, en `globals.css` (bloque RP-19).
 */
export function RenglonDelAviso({
  tipo = 'nota',
  juntoAlBoton = false,
  anunciar = false,
  className,
  children,
  ...resto
}: HTMLAttributes<HTMLSpanElement> & { tipo?: 'nota' | 'error' | 'exito'; juntoAlBoton?: boolean; anunciar?: boolean }) {
  const hay = children !== null && children !== undefined && children !== false && children !== '';
  const clases = ['renglon-del-aviso', `renglon-del-aviso--${tipo}`, juntoAlBoton ? 'renglon-del-aviso--junto-al-boton' : null, className].filter(Boolean).join(' ');
  return (
    <span {...resto} className={clases} aria-live={anunciar ? 'polite' : undefined} data-renglon-del-aviso={hay ? 'con-aviso' : 'vacio'}>
      {hay && tipo === 'error' ? <span aria-hidden="true">⚠ </span> : null}
      {children}
    </span>
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
    /** NUP-09: en el `onKeyDown` del `<form>`: Enter, mientras falten datos, pasa al siguiente campo que falta. */
    alEnter: (evento: KeyboardEvent<HTMLElement>): void => enterAlQueFalta(evento, ultimo.current().map((e) => e.id)),
  };
}

/** Los campos de una línea donde Enter envía el formulario: los demás (casillas, botones, archivos) no se tocan. */
const SIN_ENTER = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'color', 'range']);

/**
 * NUP-09 (WP-NUTRICION-PLANIFICACION; NUP-D09) · Enter en un campo de una línea: si falta algo en otro campo del
 * formulario (`faltan`, sus `id`), lleva el foco al siguiente que falta (o al primero) en vez de enviar. Si no falta nada
 * en otro, o si el que falta no puede recibir el foco (apagado o escondido), Enter envía como siempre, y el envío muestra
 * lo que falte. No toca las áreas de texto (Enter es un renglón nuevo), las listas ni los botones. Lo usa
 * `useAvisosVivos`; un formulario sin ella lo llama con su propia lista.
 */
export function enterAlQueFalta(evento: KeyboardEvent<HTMLElement>, faltan: readonly string[]): void {
  if (evento.key !== 'Enter' || evento.defaultPrevented || evento.shiftKey || evento.altKey || evento.ctrlKey || evento.metaKey || evento.nativeEvent.isComposing) return;
  const campo = evento.target;
  if (!(campo instanceof HTMLInputElement) || SIN_ENTER.has(campo.type)) return;
  // Un buscador con su lista (un combobox) usa Enter para elegir: es suyo.
  if (campo.getAttribute('role') === 'combobox') return;
  const forma = evento.currentTarget;
  const lugares = faltan.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null && forma.contains(e));
  // El orden del formulario: el campo actual y los que faltan, como están en la página.
  const enOrden = [...new Set<HTMLElement>([campo, ...lugares])].sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const actual = enOrden.indexOf(campo);
  // Un grupo que contiene al campo (un `fieldset` con su aviso) es el campo actual.
  const posiciones = lugares.map((e) => (e === campo || e.contains(campo) ? actual : enOrden.indexOf(e)));
  const destino = siguienteQueFalta(actual, posiciones);
  if (destino === null) return;
  // Se frena el envío solo si el foco llegó: un campo apagado o escondido no lo recibe, y Enter envía como siempre.
  if (enfocarLoQueFalta(enOrden[destino]!)) evento.preventDefault();
}

/** ED-04: la región que lee el lector de pantalla cuando ya no queda nada por corregir («Listo para registrar»). */
export function AnuncioDeLosAvisos({ texto }: { texto: string }) {
  return (
    <p className="visualmente-oculto" role="status" aria-live="polite" data-anuncio-de-los-avisos>
      {texto}
    </p>
  );
}
