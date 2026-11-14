'use client';

/**
 * GR-20 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): la masa grasa según cada método, con un eje común por panel,
 * en el lienzo de esta rama. `MasasPorMetodo` dibuja las tomas ya leídas («Evolución › Por método»); `MasaGrasaPorMetodo`
 * es el gráfico del registro, que lee solo las masas en tramos de 92 días. Las reglas están en `masa-grasa-por-metodo.ts`.
 */
import { useMemo } from 'react';
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { GraficoOEstado, useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido } from '../nutricion-y-cuerpo/leido';
import type { GraficoArmado } from '../nutricion-y-cuerpo/lienzo';
import { LienzoDeNutricionYCuerpo } from '../nutricion-y-cuerpo/lienzo-en-pantalla';
import type { DensidadDelGrafico } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';
import { leerTomasDelPeriodo } from './lecturas-de-antropometria';
import { graficoDeMasas, MEDIDAS_DE_GR20 } from './masa-grasa-por-metodo';
import { conTomasDeOtros, observacionesDeLasTomas, type ObservacionDeLaToma } from './tomas';

/** GR-20 con las tomas ya leídas. */
export function MasasPorMetodo({ observaciones, periodo, parcial, enTramos, densidad = 'COMPLETA' }: { observaciones: readonly ObservacionDeLaToma[]; periodo: PeriodoDelGrafico; parcial: boolean; enTramos: boolean; densidad?: DensidadDelGrafico }) {
  const grafico = useMemo(() => graficoDeMasas(observaciones, inicioDelEje(periodo), periodo.hasta, { parcial, enTramos }), [observaciones, periodo, parcial, enTramos]);
  if (grafico === null) {
    return (
      <div className="grafico-base">
        <h3 className="grafico-base__titulo">{C.masas.titulo}</h3>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.masas.sinMasas }} />
      </div>
    );
  }
  return <LienzoDeNutricionYCuerpo titulo={C.masas.titulo} periodo={periodo} grafico={grafico} densidad={densidad} />;
}

/** GR-20 del registro: lee solo las masas del período, en tramos de 92 días. */
export function MasaGrasaPorMetodo({ lectura, periodo, densidad }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<GraficoArmado>> => {
    const leidas = await leerTomasDelPeriodo(lectura, periodo, MEDIDAS_DE_GR20);
    if (leidas.tipo !== 'LISTO') return leidas;
    const grafico = graficoDeMasas(observacionesDeLasTomas(leidas.datos.respuestas), inicioDelEje(periodo), periodo.hasta, {
      parcial: conTomasDeOtros(leidas.datos.respuestas),
      enTramos: leidas.datos.enTramos,
    });
    return grafico === null ? { tipo: 'SIN_DATOS', texto: C.masas.sinMasas } : { tipo: 'LISTO', datos: grafico };
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.desdeElVinculo]);
  return <GraficoOEstado titulo={C.masas.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad={densidad} />;
}
