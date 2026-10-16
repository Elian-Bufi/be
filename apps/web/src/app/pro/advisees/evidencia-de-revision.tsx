'use client';

/**
 * La evidencia que el profesional examinó para una revisión (NUT-15 y TRN-15; pasada del 2026-10-09). Una casilla suelta
 * por registro llegaba a 70 en un período de nutrición, antes de «Registrar revisión». Ahora:
 * - **Agrupada por tipo y, los registros, por día.** La planificación y el objetivo van aparte, en una fila; los días, en
 *   una grilla, cada uno con su casilla y su cuenta, y sus registros se despliegan dentro del día, a todo el ancho.
 * - **Selección explícita por grupo:** marcar un día (o «Marcar las 44 comidas») marca, una por una, las de ese grupo. Lo
 *   que viaja sigue siendo la lista de referencias individuales: el contrato no cambia.
 * - **Nada viene marcado ni se registra al abrir:** BE no elige evidencia por el profesional.
 * - **Se ve lo marcado y se cambia:** el resumen dice cuánto y de qué días; «Ver lo que marcaste» lo lista con «Quitar».
 * - **Marcar no es haber examinado:** la casilla es la declaración del profesional. La ayuda pide dejar marcado solo lo
 *   que examinó; ningún rótulo dice «examinado» por haber marcado un grupo.
 * Parte 10 de WP-ESCRITORIO-AREAS (maqueta 06; DEC-18): en Nutrición la grilla tiene todos los días del período, y los que
 * no tienen registros se ven, sin casilla (no son un cero: no hay nada que marcar). En Entrenamiento van solo los días
 * con sesiones y, debajo, la cuenta de los demás. La fecha va sin el año en curso.
 * La lógica (agrupar, marcar, resumir, los días) está en `evidencia.ts`, con su prueba.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { diaDelAnioEnCurso } from '../../../lib/formato';
import { cuantas, cuentaDelDia, estadoDelGrupo, estadoDichoDelGrupo, marcar, porDia, resumenDeLoMarcado, type CandidataDeEvidencia, type NombresDeLosRegistros } from './evidencia';

export type { CandidataDeEvidencia } from './evidencia';

/**
 * Una casilla que marca o desmarca un grupo entero; mixta si hay una parte marcada. Su nombre empieza por lo que se ve
 * («11 sept 3 comidas») y termina con el estado dicho en palabras, para quien no ve la casilla.
 */
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
        {children}
        <span className="visualmente-oculto">, {estadoDichoDelGrupo(marcadas, ids.length)}</span>
      </span>
    </label>
  );
}

/** Un día con registros: su casilla, su cuenta y, a un toque, sus registros uno por uno, dentro del día. */
function DiaDeEvidencia({
  dia,
  hoy,
  items,
  elegidas,
  onMarcar,
  registros,
}: {
  dia: string;
  hoy: string;
  items: readonly CandidataDeEvidencia[];
  elegidas: ReadonlySet<string>;
  onMarcar: (ids: readonly string[], si: boolean) => void;
  registros: NombresDeLosRegistros;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const ids = items.map((c) => c.id);
  const { marcadas, todas } = estadoDelGrupo(ids, elegidas);
  const fecha = diaDelAnioEnCurso(dia, hoy);
  return (
    <li className="evidencia__dia" data-dia={dia} data-abierto={abierto ? 'si' : undefined} data-marcado={marcadas === 0 ? undefined : todas ? 'todo' : 'parte'}>
      <div className="evidencia__fila">
        <CasillaDeGrupo ids={ids} elegidas={elegidas} onMarcar={onMarcar}>
          <strong className="evidencia__fecha">{fecha}</strong> <span className="evidencia__cuenta">{cuentaDelDia(items.length, marcadas, registros)}</span>
        </CasillaDeGrupo>
        <button type="button" className="boton boton--enlace evidencia__ver" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((a) => !a)}>
          {abierto ? 'Ocultar' : 'Ver'}
          <span className="visualmente-oculto">
            {' '}
            {cuantas(items.length, registros)} del {fecha}
          </span>
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
  hoy,
  candidatas,
  elegidas,
  onCambiar,
  registros,
  sinRegistros,
  diasDelPeriodo = null,
  idDeLaAyuda,
  nota = null,
  aviso = null,
  error = null,
}: {
  id: string;
  /** Hoy, en la zona del profesional: la fecha de un día del año en curso va sin el año. */
  hoy: string;
  candidatas: readonly CandidataDeEvidencia[];
  elegidas: ReadonlySet<string>;
  onCambiar: (siguiente: Set<string>) => void;
  /** «comida»/«comidas» o «sesión»/«sesiones». */
  registros: NombresDeLosRegistros;
  /** Qué decir si el período no tiene registros. */
  sinRegistros: string;
  /** Todos los días del período, si la grilla los muestra todos (Nutrición): los que no tienen registros van sin casilla. */
  diasDelPeriodo?: readonly string[] | null;
  /** La ayuda la dice el paso que contiene la selección («Marcá solo lo que examinaste…»); acá se la nombra. */
  idDeLaAyuda: string;
  /** Lo que se agrega debajo de los días (en Entrenamiento, la cuenta de los días sin registro). */
  nota?: ReactNode;
  /** Lo que pasó con lo marcado al cambiar el período (DEC-20). */
  aviso?: string | null;
  error?: string | null;
}) {
  const onMarcar = (ids: readonly string[], si: boolean) => onCambiar(marcar(elegidas, ids, si));
  const otras = candidatas.filter((c) => c.dia === null);
  const dias = porDia(candidatas);
  const conRegistros = new Map(dias);
  const delPeriodo = dias.flatMap(([, items]) => items);
  const marcadas = candidatas.filter((c) => elegidas.has(c.id));
  const titulo = `${registros[1].charAt(0).toUpperCase()}${registros[1].slice(1)} del período, por día`;
  // La grilla: todos los días (Nutrición) o solo los que tienen registros (Entrenamiento), del primero al último.
  const grilla = diasDelPeriodo ? [...new Set([...diasDelPeriodo, ...conRegistros.keys()])].sort() : [...conRegistros.keys()];

  return (
    <fieldset className={`grupo evidencia${error ? ' campo--error' : ''}`} id={id} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={`${idDeLaAyuda}${error ? ` ${id}-error` : ''}`}>
      <legend className="visualmente-oculto">Evidencia que examinaste</legend>
      {error ? (
        <p id={`${id}-error`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}

      {otras.length > 0 ? (
        <div className="evidencia__seccion evidencia__otras">
          {otras.map((c) => (
            <label key={c.id} className="acto">
              <input type="checkbox" checked={elegidas.has(c.id)} onChange={(e) => onMarcar([c.id], e.target.checked)} /> {c.texto}
            </label>
          ))}
        </div>
      ) : null}

      <div className="evidencia__seccion">
        <div className="evidencia__cabecera">
          <h4 className="evidencia__titulo">{titulo}</h4>
          {delPeriodo.length > 1 ? (
            <CasillaDeGrupo ids={delPeriodo.map((c) => c.id)} elegidas={elegidas} onMarcar={onMarcar}>
              Marcar {cuantas(delPeriodo.length, registros)}
            </CasillaDeGrupo>
          ) : null}
        </div>
        {aviso ? (
          <p className="evidencia__aviso" role="status">
            {aviso}
          </p>
        ) : null}
        {dias.length === 0 ? <p className="evidencia__vacio">{sinRegistros}</p> : null}
        {grilla.length > 0 && dias.length > 0 ? (
          <ul className="evidencia__dias">
            {grilla.map((dia) => {
              const items = conRegistros.get(dia);
              return items ? (
                <DiaDeEvidencia key={dia} dia={dia} hoy={hoy} items={items} elegidas={elegidas} onMarcar={onMarcar} registros={registros} />
              ) : (
                <li key={dia} className="evidencia__sin-registros" data-dia={dia}>
                  <strong className="evidencia__fecha">{diaDelAnioEnCurso(dia, hoy)}</strong> <span className="evidencia__cuenta">sin registros</span>
                </li>
              );
            })}
          </ul>
        ) : null}
        {nota}
      </div>

      <div className="evidencia__pie">
        <p className="evidencia__resumen" role="status">
          {resumenDeLoMarcado(candidatas, elegidas, registros)}
        </p>
        {marcadas.length > 0 ? (
          <details className="evidencia__marcadas">
            <summary>Ver lo que marcaste ({marcadas.length})</summary>
            <ul className="evidencia__lista">
              {marcadas.map((c) => (
                <li key={c.id}>
                  {c.dia ? `${diaDelAnioEnCurso(c.dia, hoy)} · ` : ''}
                  {c.texto}{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => onMarcar([c.id], false)}>
                    Quitar
                    <span className="visualmente-oculto">
                      : {c.dia ? `${diaDelAnioEnCurso(c.dia, hoy)}, ` : ''}
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
      </div>
    </fieldset>
  );
}
