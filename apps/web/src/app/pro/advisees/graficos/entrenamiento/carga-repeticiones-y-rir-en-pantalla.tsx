'use client';

/**
 * GR-03 en pantalla · Carga, repeticiones y RIR de la misma serie, en tres paneles alineados (WP-GRAFICOS fase 2, rama B;
 * DL-174). Un panel por magnitud, con el mismo eje de fechas y la regla del cursor común: sin doble eje. El RIR indicado
 * de cada sesión va hueco en el panel del RIR. Un RIR sin escribir no es 0, y lo tildado sin escribir va hueco y gris.
 *
 * Lee la carga, las repeticiones y el RIR del número de serie elegido (API-PRJ-01, por `leerSerieDelCatalogo`) y el
 * comparador (lo indicado y lo cargado después), que comparte con los otros gráficos del historial mientras está en vuelo.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useMemo } from 'react';
import type { EstadoDeSerie } from '../../seguimiento/series';
import { inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { carrilesDeCargaRepeticionesYRir, rirIndicadoPorSesion } from './carga-repeticiones-y-rir';
import { cargadasDespues, fechasCargadasDespues, observacionesDelPeriodo } from './comparador';
import { COPY_DE_LOS_GRAFICOS as G } from '../copy';
import { COPY_CARGA_REPETICIONES_Y_RIR as C } from './copy';
import { useComparador, useLecturaDeLaSerie } from './lecturas-del-ejercicio';

const LEYENDA: readonly SentidoDeLaMarca[] = ['REGISTRADO', 'INDICADO', 'CARGA_RAPIDA'];

const serieDe = (e: EstadoDeSerie) => (e.tipo === 'lista' ? e.serie : null);

export function CargaRepeticionesYRir({ lectura, periodo, densidad, ejercicio, bandas }: PropsDelGrafico) {
  const exerciseKey = ejercicio?.exerciseKey ?? null;
  const numero = ejercicio?.serie ?? 1;
  const { serie: leida, recargar } = useLecturaDeLaSerie(lectura, periodo, exerciseKey, numero, ejercicio?.unidad ?? null);
  const { comparador } = useComparador(lectura, periodo, exerciseKey !== null);

  const carriles = useMemo(() => {
    if (!leida || !exerciseKey) return [];
    const observaciones =
      comparador.tipo === 'lista' ? observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta) : [];
    const tardias = comparador.tipo === 'lista' ? cargadasDespues(comparador.ejecuciones) : new Set<string>();
    return carrilesDeCargaRepeticionesYRir(
      { carga: serieDe(leida.carga), repeticiones: serieDe(leida.repeticiones), rir: serieDe(leida.rir) },
      { serie: numero, indicado: rirIndicadoPorSesion(observaciones, numero), cargadoTarde: fechasCargadasDespues(observaciones, tardias) },
    );
  }, [leida, exerciseKey, comparador, periodo, numero]);

  if (!exerciseKey) return null;
  if (!leida) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  const estados = [leida.carga, leida.repeticiones, leida.rir];
  // Las tres pasan por el mismo PDP: sin acceso, el gráfico no está.
  if (estados.some((e) => e.tipo === 'sin-acceso')) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  const falla = estados.find((e): e is Extract<EstadoDeSerie, { tipo: 'error' }> => e.tipo === 'error');
  if (falla) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: falla.motivo }} onReintentar={recargar} />;
  if (estados.some((e) => e.tipo === 'cargando')) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  if (carriles.every((c) => c.puntos.every((p) => p.valor === null))) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinDatos(numero) }} />;
  const notas = [C.sinRirEscrito, C.rirDelPlan, comparador.tipo === 'error' ? C.sinIndicado : C.indicadoHueco, ...(comparador.tipo === 'lista' && comparador.enTramos ? [G.leidoEnTramos] : [])];
  return (
    <section className="grafico-de-entrenamiento" aria-label={C.titulo(numero)} data-grafico="GR-03">
      <PanelesAlineados titulo={C.titulo(numero)} periodo={periodo} carriles={carriles} bandas={bandas} densidad={densidad} leyenda={LEYENDA} notas={notas} />
    </section>
  );
}
