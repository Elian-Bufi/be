'use client';

/**
 * GR-12 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): lee las calorías por día y lo cargado después, y las dibuja
 * con lo que se sabe de cada día, el objetivo, la media de cada semana y las temporadas (GR-11). Las reglas están en
 * `energia-por-dia.ts`; acá solo se lee y se dibuja.
 */
import { inicioDelEje } from '../eje-de-fechas';
import { GraficoOEstado, useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido } from '../nutricion-y-cuerpo/leido';
import type { GraficoArmado } from '../nutricion-y-cuerpo/lienzo';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';
import { graficoDeEnergia } from './energia-por-dia';
import { leerDiasCargadosDespues, leerMetricaNutricional } from './lecturas-de-nutricion';

export function EnergiaPorDia({ lectura, periodo, densidad }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<GraficoArmado>> => {
    const desde = inicioDelEje(periodo);
    const [energia, tarde] = await Promise.all([leerMetricaNutricional(lectura, 'ENERGY', desde, periodo.hasta), leerDiasCargadosDespues(lectura, desde, periodo.hasta)]);
    if (energia.tipo !== 'LISTO') return energia;
    if (tarde.tipo === 'SESION') return tarde;
    const resultado = energia.datos.resultado;
    if (!resultado || resultado.recorded.points.length === 0) return { tipo: 'SIN_DATOS', texto: C.sinRegistrosEnElPeriodo };
    return { tipo: 'LISTO', datos: graficoDeEnergia({ resultado, cargadoTarde: tarde.tipo === 'LISTO' ? tarde.datos : null, desde, hasta: periodo.hasta, hoy: periodo.hoy }) };
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.hoy, periodo.desdeElVinculo]);
  return <GraficoOEstado titulo={C.energia.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad={densidad} />;
}
