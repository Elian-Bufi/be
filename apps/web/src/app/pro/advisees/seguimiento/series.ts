'use client';

/**
 * Las series de «Analizar»: una lectura de API-PRJ-01 por métrica elegida, con la clave de su proyección y sus
 * parámetros (DL-126). El cálculo es del servidor y del dominio; acá no se suma, promedia ni interpola nada.
 */
import {
  agregacionPara,
  definicionDeMetrica,
  type DefinicionDeMetrica,
  type EjercicioDelPeriodo,
  type FiltroDeProyeccion,
  type ProyeccionResponse,
  type ReferenciaDeMetrica,
  type ResultadoDeProyeccionNutricional,
  type SerieAnalitica,
  type VigenciaDePlan,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../../lib/api';
import { motivoDeFalla, useSeguimiento, type MotivoDeFalla } from './contexto';
import { claveDeLaReferencia, type GranoElegido, type Periodo } from './estado';

export type EstadoDeSerie =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly serie: SerieAnalitica; readonly bandas: readonly VigenciaDePlan[]; readonly parcial: boolean; readonly generada: string; readonly zona: string }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'sin-especificacion' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

export interface SerieDelAnalisis {
  readonly ref: ReferenciaDeMetrica;
  readonly clave: string;
  readonly definicion: DefinicionDeMetrica;
  /** El grano que se usó: el pedido si la métrica lo admite; si no, el suyo por defecto. */
  readonly grano: GranoElegido;
  readonly estado: EstadoDeSerie;
}

/** La definición de una referencia elegida; la unidad antropométrica no se conoce hasta leer la serie. */
export function definicionDe(ref: ReferenciaDeMetrica, unidad = ''): DefinicionDeMetrica | null {
  return definicionDeMetrica(ref.metricId, unidad);
}

/** El grano que se usa para una métrica: el pedido si lo admite, si no el suyo (y la pantalla lo dice). */
export function granoPara(definicion: DefinicionDeMetrica, pedido: GranoElegido): GranoElegido {
  return agregacionPara(definicion, pedido) !== null ? pedido : (definicion.granoPorDefecto as GranoElegido);
}

function pedidoDe(ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica, grano: GranoElegido, periodo: Periodo): { clave: ProyeccionResponse['data']['projectionKey']; filtro: FiltroDeProyeccion } | null {
  const base = { periodStart: periodo.desde, periodEnd: periodo.hasta };
  if (definicion.area === 'NUTRICION') return { clave: 'NUTRITION_PRESCRIBED_VS_RECORDED', filtro: { ...base, metric: String(definicion.parametro), grain: grano === 'WEEK' ? 'WEEK' : 'DAY' } };
  if (definicion.area === 'ENTRENAMIENTO') {
    if (!ref.exerciseKey) return null;
    const metrica = String(definicion.parametro);
    return {
      clave: 'TRAINING_PROGRESSION_BY_EXERCISE',
      filtro: {
        ...base,
        exerciseId: ref.exerciseKey,
        metric: metrica,
        ...(metrica !== 'SETS_RECORDED' ? { setIndex: String(ref.setIndex ?? 1) } : {}),
        ...(metrica === 'LOAD' && ref.unit ? { unit: ref.unit } : {}),
        grain: metrica === 'SETS_RECORDED' && grano === 'WEEK' ? 'WEEK' : 'ORIGINAL',
      },
    };
  }
  return { clave: 'ANTHROPOMETRY_LONGITUDINAL', filtro: { ...base, metric: String(definicion.parametro) } };
}

/** Las series de las métricas elegidas. Una respuesta tardía de otra selección se descarta. */
export function useSeriesDelAnalisis(metricas: readonly ReferenciaDeMetrica[], grano: GranoElegido): { readonly series: readonly SerieDelAnalisis[]; readonly recargar: () => void } {
  const { token, asesoradoId, periodo, sesionPerdida } = useSeguimiento();
  const [estados, setEstados] = useState<Readonly<Record<string, EstadoDeSerie>>>({});
  const [vuelta, setVuelta] = useState(0);
  const generacion = useRef(0);
  const pedidas = useMemo(
    () =>
      metricas.flatMap((ref) => {
        const definicion = definicionDe(ref);
        if (!definicion) return [];
        return [{ ref, clave: claveDeLaReferencia(ref), definicion, grano: granoPara(definicion, grano) }];
      }),
    [metricas, grano],
  );
  const clave = `${asesoradoId}|${periodo.desde}|${periodo.hasta}|${pedidas.map((p) => `${p.clave}@${p.grano}`).join(',')}|${vuelta}`;
  useEffect(() => {
    const esta = ++generacion.current;
    setEstados({});
    for (const p of pedidas) {
      const pedido = pedidoDe(p.ref, p.definicion, p.grano, periodo);
      if (!pedido) {
        setEstados((e) => ({ ...e, [p.clave]: { tipo: 'error', motivo: 'OTRO' } }));
        continue;
      }
      void api.proyeccion(token, asesoradoId, pedido.clave, pedido.filtro).then((r) => {
        if (esta !== generacion.current || sesionPerdida(r)) return;
        let estado: EstadoDeSerie = { tipo: 'error', motivo: 'OTRO' };
        if (!r.ok) estado = r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'error', motivo: motivoDeFalla(r) };
        else {
          const d = r.datos.data;
          if (d.dataState === 'NOT_AVAILABLE_TO_VIEW') estado = { tipo: 'sin-acceso' };
          else if (d.dataState === 'INSUFFICIENT_INFORMATION') estado = { tipo: 'sin-especificacion' };
          else if (d.result) {
            const res = d.result;
            const serie =
              res.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? res.recorded : res.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? (res.progression?.series ?? null) : (res.series[0] ?? null);
            const bandas = res.kind === 'ANTHROPOMETRY_LONGITUDINAL' ? [] : res.planVersions;
            if (serie) estado = { tipo: 'lista', serie, bandas, parcial: d.partialView, generada: d.generatedAt, zona: d.period.timeZone };
          }
        }
        setEstados((e) => ({ ...e, [p.clave]: estado }));
      });
    }
    // `clave` resume lo que cambia la lectura; `pedidas` y `periodo` están dentro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  const series = pedidas.map((p) => {
    const estado = estados[p.clave] ?? { tipo: 'cargando' as const };
    // La unidad antropométrica sale de los datos: la definición se rehace con ella.
    const definicion = estado.tipo === 'lista' && p.definicion.area === 'ANTROPOMETRIA' ? (definicionDe(p.ref, estado.serie.unit) ?? p.definicion) : p.definicion;
    return { ref: p.ref, clave: p.clave, definicion, grano: p.grano, estado };
  });
  return { series, recargar: () => setVuelta((v) => v + 1) };
}

/** Lo que el selector puede ofrecer con los datos y permisos de este asesorado en el período. */
export interface Disponibles {
  readonly nutricion: boolean;
  readonly ejercicios: readonly EjercicioDelPeriodo[] | null;
  readonly antropometria: readonly { readonly metricCode: string; readonly name: string; readonly observations: number; readonly units: readonly string[] }[] | null;
  /** La cobertura nutricional del período, de la misma lectura: días, registros con y sin cantidades, anulados. */
  readonly coberturaNutricional: ResultadoDeProyeccionNutricional['coverage'] | null;
  /** Si alguna de las tres lecturas falló: lo que falta no es «sin datos», y la pantalla lo dice. */
  readonly falla: MotivoDeFalla | null;
  readonly cargando: boolean;
  readonly recargar: () => void;
}

const SIN_DISPONIBLES = { nutricion: false, ejercicios: null, antropometria: null, coberturaNutricional: null, falla: null, cargando: true } as const;

export function useDisponibles(): Disponibles {
  const { token, asesoradoId, periodo, sesionPerdida } = useSeguimiento();
  const [d, setD] = useState<Omit<Disponibles, 'recargar'>>(SIN_DISPONIBLES);
  const [vuelta, setVuelta] = useState(0);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  const generacion = useRef(0);
  useEffect(() => {
    const esta = ++generacion.current;
    setD(SIN_DISPONIBLES);
    const base = { periodStart: periodo.desde, periodEnd: periodo.hasta };
    void Promise.all([
      api.proyeccion(token, asesoradoId, 'NUTRITION_PRESCRIBED_VS_RECORDED', { ...base, metric: 'RECORDS' }),
      api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', base),
      api.proyeccion(token, asesoradoId, 'ANTHROPOMETRY_LONGITUDINAL', base),
    ]).then(([n, t, a]) => {
      if (esta !== generacion.current || sesionPerdida(n) || sesionPerdida(t) || sesionPerdida(a)) return;
      const visible = (r: typeof n) => r.ok && r.datos.data.dataState !== 'NOT_AVAILABLE_TO_VIEW';
      // Un 404 es «sin acceso» (anti-enumeración); cualquier otra falla se declara.
      const fallida = [n, t, a].find((r) => !r.ok && !(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND'));
      setD({
        falla: fallida ? motivoDeFalla(fallida) : null,
        nutricion: visible(n),
        ejercicios: visible(t) && t.ok && t.datos.data.result?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? [...t.datos.data.result.exercises].sort((x, y) => y.sessions - x.sessions) : null,
        antropometria: visible(a) && a.ok && a.datos.data.result?.kind === 'ANTHROPOMETRY_LONGITUDINAL' ? a.datos.data.result.available : null,
        coberturaNutricional: visible(n) && n.ok && n.datos.data.result?.kind === 'NUTRITION_PRESCRIBED_VS_RECORDED' ? n.datos.data.result.coverage : null,
        cargando: false,
      });
    });
  }, [token, asesoradoId, periodo.desde, periodo.hasta, sesionPerdida, vuelta]);
  return useMemo(() => ({ ...d, recargar }), [d, recargar]);
}
