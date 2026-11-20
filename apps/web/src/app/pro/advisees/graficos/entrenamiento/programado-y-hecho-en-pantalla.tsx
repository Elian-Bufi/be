'use client';

/**
 * Series y volumen, lo indicado y lo hecho, en pantalla (WP-GRAFICOS-POR-FASE, GPF-06; DL-187): dos paneles alineados
 * (las series y el volumen de carga externa), lleno lo hecho y hueco lo indicado, por sesión o por semana. Va en el
 * historial del cuadro del ejercicio, debajo de GR-05, con el comparador que ya se leyó para todos. Nada se escribe.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { COPY_DE_LOS_GRAFICOS as G } from '../copy';
import { diaYMes, inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { observacionesDelPeriodo } from './comparador';
import { useComparador } from './lecturas-del-ejercicio';
import { carrilesDeProgramadoYHecho, COPY_PROGRAMADO_Y_HECHO as C, programadoYHecho, type GranoDelVolumen } from './programado-y-hecho';

const LEYENDA: readonly SentidoDeLaMarca[] = ['REGISTRADO', 'INDICADO'];

export function ProgramadoYHechoEnPantalla({ lectura, periodo, densidad, ejercicio, bandas }: PropsDelGrafico) {
  const id = useId();
  const [grano, setGrano] = useState<GranoDelVolumen>('SESION');
  const exerciseKey = ejercicio?.exerciseKey ?? null;
  const unidad = ejercicio?.unidad ?? 'kg';
  const { comparador, recargar } = useComparador(lectura, periodo, exerciseKey !== null);
  const filas = useMemo(() => {
    if (comparador.tipo !== 'lista' || !exerciseKey) return null;
    const observaciones = observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta);
    return programadoYHecho(observaciones, unidad, grano);
  }, [comparador, exerciseKey, periodo, unidad, grano]);
  const carriles = useMemo(() => (filas ? carrilesDeProgramadoYHecho(filas, unidad) : []), [filas, unidad]);

  if (!exerciseKey || !ejercicio) return null;
  if (comparador.tipo === 'cargando') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  if (comparador.tipo === 'sin-acceso') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  if (comparador.tipo === 'error') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: comparador.motivo }} onReintentar={recargar} />;
  const titulo = C.titulo(ejercicio.nombre);
  const elegirGrano = (
    <div className="campo campo--en-linea" data-grano-del-volumen>
      <label htmlFor={`${id}-grano`}>{C.grano}</label>
      <select id={`${id}-grano`} value={grano} onChange={(e) => setGrano(e.target.value === 'SEMANA' ? 'SEMANA' : 'SESION')}>
        {(['SESION', 'SEMANA'] as const).map((g) => (
          <option key={g} value={g}>
            {C.granos[g]}
          </option>
        ))}
      </select>
    </div>
  );
  if (!filas || filas.length === 0) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinDatos }} />;
  return (
    <section className="grafico-de-entrenamiento" aria-label={titulo} data-grafico="GPF-06">
      <PanelesAlineados
        titulo={titulo}
        periodo={periodo}
        carriles={carriles}
        bandas={bandas}
        densidad={densidad}
        leyenda={LEYENDA}
        detalle={C.detalle(grano, G.periodo(diaYMes(inicioDelEje(periodo), periodo.hoy), periodo.hasta >= periodo.hoy ? null : diaYMes(periodo.hasta, periodo.hoy)))}
        notas={[C.queEs]}
        aclaraciones={[C.convencion, C.rangoDelVolumen, C.volumenSinIndicar, ...(comparador.enTramos ? [G.leidoEnTramos] : [])]}
        aLaVista={elegirGrano}
      />
    </section>
  );
}
