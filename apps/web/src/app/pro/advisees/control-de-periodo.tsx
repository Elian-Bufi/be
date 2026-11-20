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
import type { EtapaDePlanificacion } from '@be/domain';
import { useEffect, useId, useRef, useState } from 'react';
import { CampoDeFecha } from '../../../components/campo-de-fecha';
import { Icono } from '../../../components/icono';
import { diaYMesCivil, rangoCivil } from '../../../lib/formato';
import { COPY_DEL_PERIODO as P, etapaVecina, textoDeLaEtapa } from './graficos/periodo-de-los-graficos';
import { diasEntre, hoyEn } from './seguimiento/estado';

/**
 * WP-GRAFICOS-POR-FASE (GPF-01 a GPF-03): lo que suman los gráficos al control, sin cambiar el de la ficha ni el de las
 * áreas. «Desde que la acompañás» es un atajo más; «Por versión del plan» elige una versión activada de Entrenamiento o
 * de Nutrición, y con una elegida, «La anterior» y «La siguiente» quedan a la vista, al lado del botón.
 */
export interface OpcionesDeLosGraficos {
  readonly vinculo?: { readonly elegido: boolean; readonly onElegir: () => void };
  readonly versiones?: {
    /** Las versiones con al menos un día entero, de las áreas que se ven, en orden de activación. */
    readonly porArea: readonly (readonly EtapaDePlanificacion[])[];
    readonly elegida: EtapaDePlanificacion | null;
    readonly onElegir: (e: EtapaDePlanificacion) => void;
    /** Por qué no hay versiones para elegir, si no se pudieron leer. */
    readonly falla?: string | null;
  };
}

export interface PeriodoDelControl<D extends number> {
  /** El atajo elegido, o `null` si es un rango propio. */
  readonly preset: D | null;
  readonly desde: string;
  readonly hasta: string;
  /** TB-16: el período por omisión, acortado al inicio del acompañamiento (`seguimiento/estado.ts`). */
  readonly desdeElVinculo?: true;
}

export function ControlDePeriodo<D extends number>({
  periodo,
  atajos,
  maximoDeDias,
  onElegir,
  graficos,
}: {
  periodo: PeriodoDelControl<D>;
  /** WP-GRAFICOS-POR-FASE: «Desde que la acompañás» y «Por versión del plan», solo donde hay gráficos. */
  graficos?: OpcionesDeLosGraficos;
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
          {/* TB-16 (DL-163 D-7): el período por omisión, acortado al inicio del acompañamiento, lo dice. */}
          {graficos?.versiones?.elegida ? (
            <>
              <strong>{textoDeLaEtapa(graficos.versiones.elegida)}</strong>
            </>
          ) : graficos?.vinculo?.elegido ? (
            <>
              <strong>{P.desdeElVinculo}</strong>: {rangoCivil(periodo.desde, periodo.hasta)}
            </>
          ) : periodo.desdeElVinculo ? (
            <>
              <strong>Desde el {diaYMesCivil(periodo.desde)}</strong>, inicio del acompañamiento
            </>
          ) : (
            <>
              Período: <strong>{rangoCivil(periodo.desde, periodo.hasta)}</strong>
            </>
          )}{' '}
          · {dias === 1 ? '1 día' : `${dias} días`}
          {incluyeHoy ? ' · incluye hoy' : ''}
        </span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      {graficos?.versiones?.elegida ? <PasosEntreVersiones versiones={graficos.versiones} /> : null}
      {abierto ? (
        <div id={`${id}-panel`} className="periodo-del-seguimiento__panel" role="group" aria-labelledby={`${id}-titulo`}>
          <p id={`${id}-titulo`} className="periodo-del-seguimiento__titulo">
            <strong>Elegir el período</strong>
            {incluyeHoy ? <span className="nota"> · incluye hoy, que todavía está en curso</span> : null}
          </p>
          <div className="periodo-del-seguimiento__opciones">
            {atajos.map((p) => (
              <button key={p.dias} type="button" className="chip" aria-pressed={periodo.preset === p.dias && !graficos?.versiones?.elegida && !graficos?.vinculo?.elegido} onClick={() => elegir({ preset: p.dias, desde: '', hasta: '' })}>
                {p.texto}
              </button>
            ))}
            {graficos?.vinculo ? (
              <button type="button" className="chip" aria-pressed={graficos.vinculo.elegido} data-desde-el-vinculo onClick={() => { setAbierto(false); graficos.vinculo?.onElegir(); boton.current?.focus(); }}>
                {P.desdeElVinculo}
              </button>
            ) : null}
          </div>
          {graficos?.versiones ? <ElegirVersion id={id} versiones={graficos.versiones} alElegir={() => { setAbierto(false); boton.current?.focus(); }} /> : null}
          <div className="periodo-del-seguimiento__rango" role="group" aria-labelledby={`${id}-rango`}>
            <p id={`${id}-rango`} className="periodo-del-seguimiento__otro">
              {graficos ? P.aMedida : 'Otro rango'}
            </p>
            <CampoDeFecha id={`${id}-desde`} etiqueta="Desde" value={desde} max={hasta || hoy} hoy={hoy} vaciable onChange={setDesde} />
            <CampoDeFecha id={`${id}-hasta`} etiqueta="Hasta" value={hasta} min={desde || undefined} hoy={hoy} vaciable onChange={setHasta} />
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

type VersionesDelControl = NonNullable<OpcionesDeLosGraficos['versiones']>;

/** «Por versión del plan»: las versiones de cada área, en su grupo; elegir una cierra el control. */
function ElegirVersion({ id, versiones, alElegir }: { id: string; versiones: VersionesDelControl; alElegir: () => void }) {
  const todas = versiones.porArea.flat();
  return (
    <div className="periodo-del-seguimiento__rango" role="group" aria-labelledby={`${id}-version`} data-por-version>
      <p id={`${id}-version`} className="periodo-del-seguimiento__otro">
        {P.porVersion}
      </p>
      {todas.length === 0 ? (
        <p className="nota">{versiones.falla ?? P.sinVersiones}</p>
      ) : (
        <div className="campo">
          <label htmlFor={`${id}-version-elegida`}>{P.versionDelPlan}</label>
          <select
            id={`${id}-version-elegida`}
            value={versiones.elegida?.planVersionId ?? ''}
            onChange={(e) => {
              const elegida = todas.find((x) => x.planVersionId === e.target.value);
              if (!elegida) return;
              versiones.onElegir(elegida);
              alElegir();
            }}
          >
            <option value="" disabled>
              {P.elegirVersion}
            </option>
            {versiones.porArea
              .filter((lista) => lista.length > 0)
              .map((lista) => (
                <optgroup key={lista[0]!.dominio} label={P.areas[lista[0]!.dominio]}>
                  {[...lista].reverse().map((e) => (
                    <option key={e.planVersionId} value={e.planVersionId}>
                      {textoDeLaEtapa(e, false)}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>
      )}
      {versiones.falla && todas.length > 0 ? <p className="nota">{versiones.falla}</p> : null}
    </div>
  );
}

/** Con una versión elegida, «La anterior» y «La siguiente» del mismo plan, a la vista: se recorren sin abrir el control. */
function PasosEntreVersiones({ versiones }: { versiones: VersionesDelControl }) {
  const elegida = versiones.elegida;
  if (!elegida) return null;
  const delArea = versiones.porArea.find((l) => l.some((e) => e.planVersionId === elegida.planVersionId)) ?? [];
  const anterior = etapaVecina(delArea, elegida.planVersionId, -1);
  const siguiente = etapaVecina(delArea, elegida.planVersionId, 1);
  return (
    <span className="periodo-del-seguimiento__pasos" data-pasos-entre-versiones>
      <button type="button" className="boton boton--enlace" disabled={!anterior} onClick={() => anterior && versiones.onElegir(anterior)}>
        <Icono nombre="izquierda" tamano={18} />
        {P.laAnterior}
        {anterior ? <span className="visualmente-oculto">: {textoDeLaEtapa(anterior)}</span> : null}
      </button>
      <button type="button" className="boton boton--enlace" disabled={!siguiente} onClick={() => siguiente && versiones.onElegir(siguiente)}>
        {P.laSiguiente}
        {siguiente ? <span className="visualmente-oculto">: {textoDeLaEtapa(siguiente)}</span> : null}
        <Icono nombre="derecha" tamano={18} />
      </button>
    </span>
  );
}
