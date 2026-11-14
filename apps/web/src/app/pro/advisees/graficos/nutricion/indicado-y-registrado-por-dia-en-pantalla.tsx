'use client';

/**
 * GR-14 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): lo indicado y lo registrado, día por día, con la tira por
 * comida. `IndicadoYRegistradoPorDia` es el gráfico del registro («Patrones»): lee las cuatro métricas y las comidas de
 * cada día (API-NUT-17 en tramos de 92 días). `DiaPorDia` es el de «Registros» de Nutrición: las comidas ya las leyó esa
 * vista para el mismo período, así que solo lee las métricas. Las reglas están en `indicado-y-registrado-por-dia.ts`.
 */
import type { ContrasteDescriptivo } from '@be/domain';
import { useMemo } from 'react';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import { GraficoOEstado, useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido, Leido } from '../nutricion-y-cuerpo/leido';
import type { GraficoArmado } from '../nutricion-y-cuerpo/lienzo';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';
import { graficoDeLaComparacion, METRICAS_DE_LA_COMPARACION } from './indicado-y-registrado-por-dia';
import { leerComidasDeCadaDia, leerMetricasNutricionales, type LecturaBase, type LecturaNutricional } from './lecturas-de-nutricion';

type DiasDelContraste = ContrasteDescriptivo['days'];

/** El gráfico armado con lo leído, o «sin datos» si no hay nada registrado ni indicado en el período. */
function armar(metricas: Leido<readonly LecturaNutricional[]>, contraste: DiasDelContraste | null, desde: string, hasta: string, enTramos: boolean): GraficoLeido<GraficoArmado> {
  if (metricas.tipo !== 'LISTO') return metricas;
  const resultados = metricas.datos.flatMap((m) => (m.resultado ? [m.resultado] : []));
  const conAlgo = resultados.some((r) => r.recorded.points.length > 0 || r.prescribed.planned.days.some((d) => d.state === 'DETERMINED'));
  if (resultados.length < METRICAS_DE_LA_COMPARACION.length || !conAlgo) return { tipo: 'SIN_DATOS', texto: C.sinRegistrosEnElPeriodo };
  return { tipo: 'LISTO', datos: graficoDeLaComparacion({ resultados, contraste, desde, hasta, enTramos }) };
}

const METRICAS = METRICAS_DE_LA_COMPARACION.map((m) => m.metrica);

export function IndicadoYRegistradoPorDia({ lectura, periodo, densidad }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<GraficoArmado>> => {
    const desde = inicioDelEje(periodo);
    const [metricas, comidas] = await Promise.all([leerMetricasNutricionales(lectura, METRICAS, desde, periodo.hasta), leerComidasDeCadaDia(lectura, periodo)]);
    if (comidas.tipo === 'SESION') return comidas;
    return armar(metricas, comidas.tipo === 'LISTO' ? comidas.datos.dias : null, desde, periodo.hasta, comidas.tipo === 'LISTO' && comidas.datos.enTramos);
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.desdeElVinculo]);
  return <GraficoOEstado titulo={C.indicadoYRegistrado.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad={densidad} />;
}

/** «Día por día» en «Registros»: el mismo gráfico, con las comidas que la vista ya leyó para ese período. */
export function DiaPorDia({ lectura, desde, hasta, hoy, contraste }: { lectura: LecturaBase; desde: string; hasta: string; hoy: string; contraste: DiasDelContraste }) {
  const periodo = useMemo((): PeriodoDelGrafico => ({ desde, hasta, hoy, desdeElVinculo: null }), [desde, hasta, hoy]);
  const { estado, reintentar } = useGraficoLeido(
    async (): Promise<GraficoLeido<GraficoArmado>> => armar(await leerMetricasNutricionales(lectura, METRICAS, desde, hasta), contraste, desde, hasta, false),
    [lectura.token, lectura.asesoradoId, desde, hasta, contraste],
  );
  return <GraficoOEstado titulo={C.indicadoYRegistrado.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad="COMPLETA" />;
}
