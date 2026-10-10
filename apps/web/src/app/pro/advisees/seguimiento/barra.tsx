'use client';

/**
 * Las tres vistas de la ficha (ESPECIFICACION.md §1) y el período que comparten. El período vive en la URL: es el mismo
 * en Resumen, Línea de tiempo y Analizar, y volver atrás lo recupera.
 *
 * WP-ESCRITORIO-AMABLE (C-02): el período es **un solo control**. A la vista dice qué período es y cuántos días tiene; al
 * abrirlo están los atajos (7, 30 y 90 días, y un año) y el rango propio, con dos campos de fecha, que es la alternativa
 * a arrastrar sobre un gráfico (WCAG 2.5.7). Antes eran cinco botones siempre a la vista.
 * - Elegir un atajo o aplicar un rango cierra el control. Escape también, y devuelve el foco al botón.
 * - Se sigue diciendo si el período incluye hoy, que todavía está en curso: en el botón, corto, y entero al abrir.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { Pestanas } from '../../../../components/pestanas';
import { rangoCivil } from '../../../../lib/formato';
import { useSeguimiento } from './contexto';
import { diasEntre, hoyEn, parametrosDePeriodo, PRESETS_DE_PERIODO, VISTAS_DEL_SEGUIMIENTO, type VistaDelSeguimiento } from './estado';

export function PestanasDelSeguimiento({ actual }: { actual: VistaDelSeguimiento }) {
  const { href } = useSeguimiento();
  return <Pestanas etiqueta="Vistas del seguimiento" vistas={VISTAS_DEL_SEGUIMIENTO} actual={actual} href={(clave) => href({ vista: clave === 'resumen' ? null : clave })} />;
}

export function SelectorDePeriodo() {
  const { periodo, ir } = useSeguimiento();
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
  const elegir = (cambios: Readonly<Record<string, string | null>>) => {
    setAbierto(false);
    ir(cambios);
    boton.current?.focus();
  };
  const aplicar = () => {
    if (!desde || !hasta) return setProblema('Elegí las dos fechas.');
    if (desde > hasta) return setProblema('La fecha de inicio tiene que ser anterior a la de fin.');
    if (diasEntre(desde, hasta) > 366) return setProblema('El período puede tener hasta 366 días.');
    setProblema(null);
    elegir(parametrosDePeriodo({ preset: null, desde, hasta }));
  };
  return (
    <div ref={raiz} className="periodo-del-seguimiento">
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
            {PRESETS_DE_PERIODO.map((p) => (
              <button key={p.dias} type="button" className="chip" aria-pressed={periodo.preset === p.dias} onClick={() => elegir(parametrosDePeriodo({ preset: p.dias, desde: '', hasta: '' }))}>
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
