'use client';

/**
 * Las tres vistas de la ficha (ESPECIFICACION.md §1) y el período que comparten. El período vive en la URL: es el mismo
 * en Resumen, Línea de tiempo y Analizar, y volver atrás lo recupera.
 * - Presets de 7, 30 y 90 días y un año, como botones con `aria-pressed`.
 * - Un rango propio con dos campos de fecha: la alternativa a arrastrar sobre un gráfico (WCAG 2.5.7).
 * - Se dice si el período incluye hoy, que todavía está en curso.
 */
import { diaCivil } from '../../../../lib/formato';
import { Pestanas } from '../../../../components/pestanas';
import { useEffect, useId, useState } from 'react';
import { useSeguimiento } from './contexto';
import { diasEntre, hoyEn, parametrosDePeriodo, PRESETS_DE_PERIODO, VISTAS_DEL_SEGUIMIENTO, type VistaDelSeguimiento } from './estado';

export function PestanasDelSeguimiento({ actual }: { actual: VistaDelSeguimiento }) {
  const { href } = useSeguimiento();
  return <Pestanas etiqueta="Vistas del seguimiento" vistas={VISTAS_DEL_SEGUIMIENTO} actual={actual} href={(clave) => href({ vista: clave === 'resumen' ? null : clave })} />;
}

export function SelectorDePeriodo() {
  const { periodo, ir } = useSeguimiento();
  const id = useId();
  const [abierto, setAbierto] = useState(periodo.preset === null);
  const [desde, setDesde] = useState(periodo.desde);
  const [hasta, setHasta] = useState(periodo.hasta);
  const [problema, setProblema] = useState<string | null>(null);
  // Un preset (o volver atrás) cambia el período: los campos del rango propio arrancan desde él, no desde el anterior.
  useEffect(() => {
    setDesde(periodo.desde);
    setHasta(periodo.hasta);
    setProblema(null);
  }, [periodo.desde, periodo.hasta]);
  const hoy = hoyEn();
  const aplicar = () => {
    if (!desde || !hasta) return setProblema('Elegí las dos fechas.');
    if (desde > hasta) return setProblema('La fecha de inicio tiene que ser anterior a la de fin.');
    if (diasEntre(desde, hasta) > 366) return setProblema('El período puede tener hasta 366 días.');
    setProblema(null);
    ir(parametrosDePeriodo({ preset: null, desde, hasta }));
  };
  return (
    <div className="periodo-del-seguimiento" role="group" aria-labelledby={`${id}-titulo`}>
      <p id={`${id}-titulo`} className="periodo-del-seguimiento__titulo">
        <strong>Período:</strong> {diaCivil(periodo.desde)} al {diaCivil(periodo.hasta)}
        {periodo.hasta === hoy ? <span className="nota"> · incluye hoy, que todavía está en curso</span> : null}
      </p>
      <div className="periodo-del-seguimiento__opciones">
        {PRESETS_DE_PERIODO.map((p) => (
          <button
            key={p.dias}
            type="button"
            className="chip"
            aria-pressed={periodo.preset === p.dias}
            onClick={() => {
              setAbierto(false);
              ir(parametrosDePeriodo({ preset: p.dias, desde: '', hasta: '' }));
            }}
          >
            {p.texto}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={periodo.preset === null} aria-expanded={abierto} aria-controls={`${id}-rango`} onClick={() => setAbierto(!abierto)}>
          Otro rango
        </button>
      </div>
      {abierto ? (
        <div id={`${id}-rango`} className="periodo-del-seguimiento__rango">
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
