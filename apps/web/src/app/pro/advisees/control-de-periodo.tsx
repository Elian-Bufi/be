'use client';

/**
 * El período, en **un solo control** (WP-ESCRITORIO-AMABLE, C-02). A la vista dice qué período es, cuántos días tiene y
 * si incluye hoy; al abrirlo están los atajos y el rango propio, con dos campos de fecha, que es la alternativa a
 * arrastrar sobre un gráfico (WCAG 2.5.7).
 * - Elegir un atajo o aplicar un rango cierra el control. Escape también, y devuelve el foco al botón.
 * - Se sigue diciendo si el período incluye hoy, que todavía está en curso: en el botón, corto, y entero al abrir.
 *
 * Salió de la ficha (`seguimiento/barra.tsx`) para que lo usen también las pestañas de área (WP-ESCRITORIO-AREAS, parte
 * 1), con las mismas clases. Cada lugar le pasa sus atajos y su tope de días: la ficha admite hasta un año; el contexto
 * de una revisión, 92 días.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../../../components/icono';
import { rangoCivil } from '../../../lib/formato';
import { diasEntre, hoyEn } from './seguimiento/estado';

export interface PeriodoDelControl<D extends number> {
  /** El atajo elegido, o `null` si es un rango propio. */
  readonly preset: D | null;
  readonly desde: string;
  readonly hasta: string;
}

export function ControlDePeriodo<D extends number>({
  periodo,
  atajos,
  maximoDeDias,
  onElegir,
}: {
  periodo: PeriodoDelControl<D>;
  atajos: readonly { readonly dias: D; readonly texto: string }[];
  /** Cuántos días puede tener un rango propio, contando los dos extremos. */
  maximoDeDias: number;
  /** Con un atajo, `desde` y `hasta` van vacíos: los calcula quien lo recibe. */
  onElegir: (p: PeriodoDelControl<D>) => void;
}) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState(periodo.desde);
  const [hasta, setHasta] = useState(periodo.hasta);
  const [problema, setProblema] = useState<string | null>(null);
  // Un atajo (o volver atrás) cambia el período: los campos del rango propio arrancan desde él, no desde el anterior.
  useEffect(() => {
    setDesde(periodo.desde);
    setHasta(periodo.hasta);
    setProblema(null);
  }, [periodo.desde, periodo.hasta]);
  // Abierto, se cierra con Escape (el foco vuelve al botón) o al tocar fuera de él.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && e.target instanceof Node && !raiz.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);

  const hoy = hoyEn();
  const dias = diasEntre(periodo.desde, periodo.hasta);
  const incluyeHoy = periodo.hasta === hoy;
  const elegir = (p: PeriodoDelControl<D>) => {
    setAbierto(false);
    onElegir(p);
    boton.current?.focus();
  };
  const aplicar = () => {
    if (!desde || !hasta) return setProblema('Elegí las dos fechas.');
    if (desde > hasta) return setProblema('La fecha de inicio tiene que ser anterior a la de fin.');
    if (diasEntre(desde, hasta) > maximoDeDias) return setProblema(`El período puede tener hasta ${maximoDeDias} días.`);
    setProblema(null);
    elegir({ preset: null, desde, hasta });
  };
  return (
    <div
      ref={raiz}
      className="periodo-del-seguimiento"
      onBlur={(e) => {
        // El foco pasó a otro lugar de la página (no a otra ventana, que no trae destino): el panel se cierra, para
        // que no quede tapando lo que está debajo (WCAG 2.2, 2.4.11).
        if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <button ref={boton} type="button" className="periodo-del-seguimiento__boton" aria-expanded={abierto} aria-controls={`${id}-panel`} onClick={() => setAbierto(!abierto)}>
        <Icono nombre="calendario" />
        <span>
          Período: <strong>{rangoCivil(periodo.desde, periodo.hasta)}</strong> · {dias === 1 ? '1 día' : `${dias} días`}
          {incluyeHoy ? ' · incluye hoy' : ''}
        </span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {abierto ? (
        <div id={`${id}-panel`} className="periodo-del-seguimiento__panel" role="group" aria-labelledby={`${id}-titulo`}>
          <p id={`${id}-titulo`} className="periodo-del-seguimiento__titulo">
            <strong>Elegir el período</strong>
            {incluyeHoy ? <span className="nota"> · incluye hoy, que todavía está en curso</span> : null}
          </p>
          <div className="periodo-del-seguimiento__opciones">
            {atajos.map((p) => (
              <button key={p.dias} type="button" className="chip" aria-pressed={periodo.preset === p.dias} onClick={() => elegir({ preset: p.dias, desde: '', hasta: '' })}>
                {p.texto}
              </button>
            ))}
          </div>
          <div className="periodo-del-seguimiento__rango" role="group" aria-labelledby={`${id}-rango`}>
            <p id={`${id}-rango`} className="periodo-del-seguimiento__otro">
              Otro rango
            </p>
            <div className="campo">
              <label htmlFor={`${id}-desde`}>Desde</label>
              <input id={`${id}-desde`} type="date" value={desde} max={hasta || hoy} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor={`${id}-hasta`}>Hasta</label>
              <input id={`${id}-hasta`} type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <button type="button" className="boton boton--secundario" onClick={aplicar}>
              Aplicar
            </button>
          </div>
          {problema ? (
            <p className="campo__error" role="alert">
              {problema}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
