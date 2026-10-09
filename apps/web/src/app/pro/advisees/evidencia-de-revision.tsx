'use client';

/**
 * La evidencia que el profesional examinó para una revisión (NUT-15 y TRN-15; pasada del 2026-10-09). Una casilla suelta
 * por registro llegaba a 70 en un período de nutrición, antes de «Registrar revisión». Ahora:
 * - **Agrupada por tipo y, los registros, por día.** La planificación y el objetivo van aparte, uno por uno; cada día es
 *   una fila con su casilla y su estado, y sus registros se despliegan debajo.
 * - **Selección explícita por grupo:** «marcar las 4 comidas» de un día (o las del período) marca, una por una, las de ese
 *   grupo. Lo que viaja sigue siendo la lista de referencias individuales: el contrato no cambia.
 * - **Nada viene marcado ni se registra al abrir:** BE no elige evidencia por el profesional.
 * - **Se ve lo marcado y se cambia:** el resumen dice cuánto y de qué días; «Lo que marcaste» lo lista con «Quitar», y
 *   cada día se despliega para marcar o desmarcar sus registros uno por uno.
 * - **Marcar no es haber examinado:** la casilla es la declaración del profesional. El texto pide dejar marcado solo lo
 *   que examinó; ningún rótulo dice «examinado» por haber marcado un grupo.
 * La lógica (agrupar, marcar, resumir) está en `evidencia.ts`, con su prueba.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { diaCivil } from '../../../lib/formato';
import { cuantas, estadoDelGrupo, marcar, porDia, resumenDeLoMarcado, type CandidataDeEvidencia, type NombresDeLosRegistros } from './evidencia';

export type { CandidataDeEvidencia } from './evidencia';

/** Una casilla que marca o desmarca un grupo entero, con su estado en la misma línea; mixta si hay una parte marcada. */
function CasillaDeGrupo({ ids, elegidas, onMarcar, children }: { ids: readonly string[]; elegidas: ReadonlySet<string>; onMarcar: (ids: readonly string[], si: boolean) => void; children: ReactNode }) {
  const ref = useRef<HTMLInputElement>(null);
  const { marcadas, todas, mixto } = estadoDelGrupo(ids, elegidas);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixto;
  }, [mixto]);
  return (
    <label className="acto evidencia__grupo-casilla">
      <input ref={ref} type="checkbox" checked={todas} onChange={(e) => onMarcar(ids, e.target.checked)} />
      <span>
        {children} <span className="evidencia__estado">· {marcadas === 0 ? 'sin marcar' : todas ? 'todas marcadas' : `${marcadas} de ${ids.length} marcadas`}</span>
      </span>
    </label>
  );
}

/** Un día: su casilla de grupo y, a un toque, sus registros uno por uno. */
function DiaDeEvidencia({ dia, items, elegidas, onMarcar, registros }: { dia: string; items: readonly CandidataDeEvidencia[]; elegidas: ReadonlySet<string>; onMarcar: (ids: readonly string[], si: boolean) => void; registros: NombresDeLosRegistros }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  return (
    <li className="evidencia__dia">
      <div className="evidencia__fila">
        <CasillaDeGrupo ids={items.map((c) => c.id)} elegidas={elegidas} onMarcar={onMarcar}>
          <strong>{diaCivil(dia)}</strong> · marcar {cuantas(items.length, registros)}
        </CasillaDeGrupo>
        <button type="button" className="boton boton--enlace evidencia__ver" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((a) => !a)}>
          {abierto ? 'Ocultar' : 'Ver'} {items.length === 1 ? `la ${registros[0]}` : `las ${items.length}`}
          <span className="visualmente-oculto"> del {diaCivil(dia)}</span>
        </button>
      </div>
      {abierto ? (
        <div id={id} className="evidencia__registros">
          {items.map((c) => (
            <label key={c.id} className="acto">
              <input type="checkbox" checked={elegidas.has(c.id)} onChange={(e) => onMarcar([c.id], e.target.checked)} /> {c.texto}
            </label>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function SeleccionDeEvidencia({
  id,
  candidatas,
  elegidas,
  onCambiar,
  registros,
  sinRegistros,
  error = null,
}: {
  id: string;
  candidatas: readonly CandidataDeEvidencia[];
  elegidas: ReadonlySet<string>;
  onCambiar: (siguiente: Set<string>) => void;
  /** «comida»/«comidas» o «sesión»/«sesiones». */
  registros: NombresDeLosRegistros;
  /** Qué decir si el período no tiene registros. */
  sinRegistros: string;
  error?: string | null;
}) {
  const onMarcar = (ids: readonly string[], si: boolean) => onCambiar(marcar(elegidas, ids, si));
  const otras = candidatas.filter((c) => c.dia === null);
  const dias = porDia(candidatas);
  const delPeriodo = dias.flatMap(([, items]) => items);
  const marcadas = candidatas.filter((c) => elegidas.has(c.id));
  const titulo = `${registros[1].charAt(0).toUpperCase()}${registros[1].slice(1)} del período, por día`;

  return (
    <fieldset className={`grupo evidencia${error ? ' campo--error' : ''}`} id={id} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ''}`}>
      <legend>Evidencia que examinaste</legend>
      <p id={`${id}-ayuda`} className="campo__ayuda">
        Marcá lo que examinaste: nada viene marcado. Marcar un día marca cada uno de sus registros; dejá marcados solo los que miraste.
      </p>
      {error ? (
        <p id={`${id}-error`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
      <p className="evidencia__resumen" role="status">
        {resumenDeLoMarcado(candidatas, elegidas, registros)}
      </p>

      {otras.length > 0 ? (
        <div className="evidencia__seccion">
          <h3 className="evidencia__titulo">Planificación y objetivo</h3>
          {otras.map((c) => (
            <label key={c.id} className="acto">
              <input type="checkbox" checked={elegidas.has(c.id)} onChange={(e) => onMarcar([c.id], e.target.checked)} /> {c.texto}
            </label>
          ))}
        </div>
      ) : null}

      <div className="evidencia__seccion">
        <h3 className="evidencia__titulo">{titulo}</h3>
        {dias.length === 0 ? (
          <p>{sinRegistros}</p>
        ) : (
          <>
            {dias.length > 1 ? (
              <CasillaDeGrupo ids={delPeriodo.map((c) => c.id)} elegidas={elegidas} onMarcar={onMarcar}>
                Marcar {cuantas(delPeriodo.length, registros)} del período ({dias.length} días)
              </CasillaDeGrupo>
            ) : null}
            <ul className="evidencia__dias">
              {dias.map(([dia, items]) => (
                <DiaDeEvidencia key={dia} dia={dia} items={items} elegidas={elegidas} onMarcar={onMarcar} registros={registros} />
              ))}
            </ul>
          </>
        )}
      </div>

      {marcadas.length > 0 ? (
        <details className="evidencia__marcadas">
          <summary>Lo que marcaste ({marcadas.length})</summary>
          <ul className="evidencia__lista">
            {marcadas.map((c) => (
              <li key={c.id}>
                {c.dia ? `${diaCivil(c.dia)} · ` : ''}
                {c.texto}{' '}
                <button type="button" className="boton boton--enlace" onClick={() => onMarcar([c.id], false)}>
                  Quitar
                  <span className="visualmente-oculto">
                    : {c.dia ? `${diaCivil(c.dia)}, ` : ''}
                    {c.texto}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="boton boton--enlace" onClick={() => onCambiar(new Set())}>
            Desmarcar todo
          </button>
        </details>
      ) : null}
    </fieldset>
  );
}
