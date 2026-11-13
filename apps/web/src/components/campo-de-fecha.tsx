'use client';

/**
 * PG-14 de WP-PULIDO-GRANDES (DL-173): el campo de fecha del website del profesional, en lugar del nativo.
 * - Se lee en palabras («vie 27 nov»; con otro año, «vie 27 nov 2027») y el lector de pantalla oye la fecha completa
 *   («viernes 27 de noviembre de 2026»), aunque el navegador esté en inglés.
 * - El calendario arranca el lunes y se maneja entero con el teclado: flechas, Inicio y Fin (la semana), Re Pág y
 *   Av Pág (el mes; con Mayúscula, el año), Enter para elegir y Escape para cerrar sin cambiar nada.
 * - Respeta los mismos `min` y `max` que tenía cada campo nativo: un día fuera de los límites no se puede elegir.
 * - Manda la misma fecha civil `AAAA-MM-DD` que mandaba el nativo: lo que llega a cada pantalla no cambia.
 * El botón lleva el `id` del campo: los resúmenes de errores y «Ir a corregir» siguen llevando el foco ahí.
 * La lógica está en `lib/fecha-en-palabras.ts` (TEST-PG-013). Las frases («en 2 semanas») y las revisiones marcadas
 * quedan para otra vuelta (PG-D9).
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  acotar,
  COPY_CAMPO_DE_FECHA as C,
  DIAS_DE_LA_GRILLA,
  DIAS_LARGOS,
  dentroDeLosLimites,
  esFechaCivil,
  fechaCompleta,
  fechaConLaTecla,
  fechaCorta,
  hoyEnBuenosAires,
  mesEnPalabras,
  primeroDelMes,
  semanasDelMes,
  sumarMeses,
} from '../lib/fecha-en-palabras';
import { Icono } from './icono';

export interface PropsDelCampoDeFecha {
  id: string;
  etiqueta: ReactNode;
  /** El texto de la etiqueta, para el nombre del calendario cuando la etiqueta no es un texto. */
  etiquetaEnTexto?: string;
  /** La fecha civil elegida, o `''`. */
  value: string;
  /** Recibe la fecha civil `AAAA-MM-DD`, como el `e.target.value` del campo nativo (`''` solo al quitarla). */
  onChange: (fecha: string) => void;
  min?: string;
  max?: string;
  ayuda?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Ofrece «Quitar la fecha» (el nativo dejaba borrarla). */
  vaciable?: boolean;
  /** Sin el `div.campo` alrededor: la etiqueta y el campo quedan sueltos, para una grilla que ya los ordena. */
  sinEnvoltorio?: boolean;
  /** La fecha de hoy (por defecto, la de Buenos Aires): decide si se escribe el año y marca el día. */
  hoy?: string;
}

export function CampoDeFecha({ id, etiqueta, etiquetaEnTexto, value, onChange, min, max, ayuda, error, required, vaciable = false, sinEnvoltorio = false, hoy: hoyDado }: PropsDelCampoDeFecha) {
  const hoy = hoyDado ?? hoyEnBuenosAires();
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState<string>(() => acotar(esFechaCivil(value) ? value : hoy, min, max));
  const [mes, setMes] = useState<string>(() => primeroDelMes(foco));
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const grilla = useRef<HTMLTableElement>(null);
  const moverElFoco = useRef(false);

  const elegida = esFechaCivil(value) ? value : null;
  const descripcion = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const nombre = etiquetaEnTexto ?? (typeof etiqueta === 'string' ? etiqueta : '');

  const abrir = () => {
    const inicial = acotar(elegida ?? hoy, min, max);
    setFoco(inicial);
    setMes(primeroDelMes(inicial));
    moverElFoco.current = true;
    setAbierto(true);
  };
  const cerrar = (devolverElFoco: boolean) => {
    setAbierto(false);
    if (devolverElFoco) boton.current?.focus();
  };
  const elegir = (f: string) => {
    if (!dentroDeLosLimites(f, min, max)) return;
    cerrar(true);
    if (f !== value) onChange(f);
  };

  // El foco va al día que corresponde al abrir y con cada tecla (roving tabindex).
  useLayoutEffect(() => {
    if (!abierto || !moverElFoco.current) return;
    moverElFoco.current = false;
    grilla.current?.querySelector<HTMLButtonElement>(`button[data-fecha="${foco}"]`)?.focus();
  }, [abierto, foco, mes]);

  // Un toque fuera lo cierra, sin cambiar nada.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  const conTeclas = (e: KeyboardEvent<HTMLTableElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elegir(foco);
      return;
    }
    const nueva = fechaConLaTecla(foco, e.key, e.shiftKey, min, max);
    if (nueva === null) return;
    e.preventDefault();
    moverElFoco.current = true;
    setFoco(nueva);
    setMes(primeroDelMes(nueva));
  };
  const cambiarDeMes = (meses: number) => {
    const nuevoMes = sumarMeses(mes, meses);
    setMes(nuevoMes);
    // El foco de la grilla pasa al mismo día del mes nuevo, dentro de los límites.
    setFoco(acotar(sumarMeses(foco, meses), min, max));
  };

  const anio = Number(mes.slice(0, 4));
  const numeroDelMes = Number(mes.slice(5, 7)) - 1;
  const semanas = abierto ? semanasDelMes(anio, numeroDelMes) : [];
  const hayMesAnterior = !min || sumarMeses(mes, -1).slice(0, 7) >= min.slice(0, 7);
  const hayMesSiguiente = !max || sumarMeses(mes, 1).slice(0, 7) <= max.slice(0, 7);

  const campo = (
    <div
      className={`campo-de-fecha${abierto ? ' campo-de-fecha--abierto' : ''}`}
      ref={raiz}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && abierto) {
          e.preventDefault();
          e.stopPropagation();
          cerrar(true);
        }
      }}
      onBlur={(e) => {
        if (abierto && raiz.current && e.relatedTarget && !raiz.current.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        id={id}
        type="button"
        className="campo-de-fecha__boton"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-labelledby={`${id}-etiqueta ${id}`}
        aria-describedby={descripcion}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        data-campo-de-fecha
        data-valor={value}
        onClick={() => (abierto ? cerrar(false) : abrir())}
      >
        <Icono nombre="calendario" tamano={18} />
        <span aria-hidden="true" className={elegida ? undefined : 'campo-de-fecha__vacio'}>
          {elegida ? fechaCorta(elegida, hoy) : C.sinElegir}
        </span>
        <span className="visualmente-oculto">{elegida ? fechaCompleta(elegida) : C.sinElegirCompleto}</span>
      </button>
      {abierto ? (
        <div className="campo-de-fecha__calendario" role="dialog" aria-label={C.elegir(nombre)} data-calendario>
          <div className="campo-de-fecha__mes">
            <button type="button" className="boton boton--quieto boton--compacto" aria-label={C.mesAnterior} disabled={!hayMesAnterior} onClick={() => cambiarDeMes(-1)}>
              <Icono nombre="izquierda" tamano={18} />
            </button>
            <p id={`${id}-mes`} className="campo-de-fecha__titulo" aria-live="polite">
              {mesEnPalabras(anio, numeroDelMes)}
            </p>
            <button type="button" className="boton boton--quieto boton--compacto" aria-label={C.mesSiguiente} disabled={!hayMesSiguiente} onClick={() => cambiarDeMes(1)}>
              <Icono nombre="derecha" tamano={18} />
            </button>
          </div>
          <table ref={grilla} className="campo-de-fecha__grilla" aria-labelledby={`${id}-mes`} onKeyDown={conTeclas}>
            <thead>
              <tr>
                {DIAS_DE_LA_GRILLA.map((d, n) => (
                  <th key={d} scope="col" abbr={DIAS_LARGOS[n]}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semanas.map((semana, s) => (
                <tr key={s}>
                  {semana.map((f, n) =>
                    f === null ? (
                      <td key={n} />
                    ) : (
                      <td key={n}>
                        <button
                          type="button"
                          className="campo-de-fecha__dia"
                          data-fecha={f}
                          tabIndex={f === foco ? 0 : -1}
                          aria-label={`${fechaCompleta(f)}${f === hoy ? `, ${C.esHoy}` : ''}`}
                          aria-pressed={f === elegida}
                          aria-current={f === hoy ? 'date' : undefined}
                          aria-disabled={dentroDeLosLimites(f, min, max) ? undefined : true}
                          onClick={() => elegir(f)}
                          onFocus={() => f !== foco && setFoco(f)}
                        >
                          {Number(f.slice(8, 10))}
                        </button>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="visualmente-oculto">{C.ayudaDelTeclado}</p>
          <div className="campo-de-fecha__pie">
            {dentroDeLosLimites(hoy, min, max) ? (
              <button type="button" className="boton boton--enlace" onClick={() => elegir(hoy)}>
                {C.hoy}
              </button>
            ) : null}
            {vaciable && elegida ? (
              <button
                type="button"
                className="boton boton--enlace"
                onClick={() => {
                  cerrar(true);
                  onChange('');
                }}
              >
                {C.quitar}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );

  const etiquetaYAyuda = (
    <>
      <label id={`${id}-etiqueta`} htmlFor={id}>
        {etiqueta}
      </label>
      {ayuda ? (
        <p id={`${id}-ayuda`} className="campo__ayuda">
          {ayuda}
        </p>
      ) : null}
    </>
  );
  const mensaje = error ? (
    <p id={`${id}-error`} className="campo__error">
      <span aria-hidden="true">⚠ </span>
      {error}
    </p>
  ) : null;

  if (sinEnvoltorio) {
    return (
      <>
        {etiquetaYAyuda}
        {campo}
        {mensaje}
      </>
    );
  }
  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      {etiquetaYAyuda}
      {campo}
      {mensaje}
    </div>
  );
}
