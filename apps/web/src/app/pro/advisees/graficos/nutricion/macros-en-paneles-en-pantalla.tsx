'use client';

/**
 * GR-13 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): los cuatro macronutrientes en paneles, en gramos por día, y la
 * tarjeta de los gramos por kilo de peso (GR-T13). La de g/kg la ofrece el registro solo con Nutrición y Antropometría y
 * tomas y planes propios en las dos (GR-T48): así ningún gráfico pide la lectura de un área que no está. Las reglas están
 * en `macros-en-paneles.ts` y `gramos-por-kilo.ts`; acá solo se lee y se dibuja.
 */
import { inicioDelEje } from '../eje-de-fechas';
import { GraficoOEstado, useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido } from '../nutricion-y-cuerpo/leido';
import type { GraficoArmado } from '../nutricion-y-cuerpo/lienzo';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';
import { leerDiasCargadosDespues, leerMetricasNutricionales, leerPesosParaLosDias } from './lecturas-de-nutricion';
import { graficoDeMacros, graficoDeMacrosPorKilo, MACROS_DEL_GRAFICO, MACROS_POR_KILO } from './macros-en-paneles';

export function MacrosEnPaneles({ lectura, periodo, densidad }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<GraficoArmado>> => {
    const desde = inicioDelEje(periodo);
    const [macros, tarde] = await Promise.all([
      leerMetricasNutricionales(
        lectura,
        MACROS_DEL_GRAFICO.map((m) => m.metrica),
        desde,
        periodo.hasta,
      ),
      leerDiasCargadosDespues(lectura, desde, periodo.hasta),
    ]);
    if (macros.tipo !== 'LISTO') return macros;
    if (tarde.tipo === 'SESION') return tarde;
    const resultados = macros.datos.flatMap((m) => (m.resultado ? [m.resultado] : []));
    if (resultados.length < MACROS_DEL_GRAFICO.length || resultados.every((r) => r.recorded.points.length === 0)) return { tipo: 'SIN_DATOS', texto: C.sinRegistrosEnElPeriodo };
    return { tipo: 'LISTO', datos: graficoDeMacros({ resultados, macros: MACROS_DEL_GRAFICO, cargadoTarde: tarde.tipo === 'LISTO' ? tarde.datos : null, desde, hasta: periodo.hasta }) };
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.desdeElVinculo]);
  return <GraficoOEstado titulo={C.macros.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad={densidad} />;
}

export function MacrosPorKilo({ lectura, periodo, densidad }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<GraficoArmado>> => {
    const desde = inicioDelEje(periodo);
    const [macros, tarde] = await Promise.all([
      leerMetricasNutricionales(
        lectura,
        MACROS_POR_KILO.map((m) => m.metrica),
        desde,
        periodo.hasta,
      ),
      leerDiasCargadosDespues(lectura, desde, periodo.hasta),
    ]);
    if (macros.tipo !== 'LISTO') return macros;
    if (tarde.tipo === 'SESION') return tarde;
    const resultados = macros.datos.flatMap((m) => (m.resultado ? [m.resultado] : []));
    if (resultados.length < MACROS_POR_KILO.length || resultados.every((r) => r.recorded.points.length === 0)) return { tipo: 'SIN_DATOS', texto: C.sinRegistrosEnElPeriodo };
    const primerDia = resultados.flatMap((r) => r.recorded.points.filter((p) => p.value !== null).map((p) => p.date)).sort()[0] ?? null;
    const pesos = await leerPesosParaLosDias(lectura, periodo, primerDia);
    if (pesos.tipo !== 'LISTO') return pesos;
    return {
      tipo: 'LISTO',
      datos: graficoDeMacrosPorKilo({
        resultados,
        macros: MACROS_POR_KILO,
        cargadoTarde: tarde.tipo === 'LISTO' ? tarde.datos : null,
        desde,
        hasta: periodo.hasta,
        pesos: pesos.datos.pesos,
        pesoBuscadoDesde: pesos.datos.buscadoDesde,
      }),
    };
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.desdeElVinculo]);
  return <GraficoOEstado titulo={C.porKilo.titulo} estado={estado} reintentar={reintentar} periodo={periodo} densidad={densidad} />;
}
