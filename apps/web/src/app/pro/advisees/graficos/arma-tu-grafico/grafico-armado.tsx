'use client';

/**
 * Un gráfico armado con «Armá tu gráfico» (GR-26; WP-GRAFICOS fase 2, DL-174): hasta tres series del catálogo, en
 * «Alineadas» o «Superpuestas». Lo usan la vista previa del compositor y «Patrones» (un gráfico propio de un enfoque).
 *
 * - **Guarda referencias, nunca datos:** cada vez que se dibuja, lee cada serie con el acceso de este momento.
 * - **Una serie de un área sin acceso no se dibuja** ni deja un hueco: si no queda ninguna, el gráfico no está.
 * - **«Superpuestas» con las reglas del dominio:** si las series no se pueden superponer (otro eje X, tres unidades),
 *   se dibujan alineadas y se dice por qué. La frase de la coincidencia va con dos áreas o con dos ejes.
 */
import { entraEnLaEstimacion, estimacionALaVista, fraseDeLaCoincidencia, numero, serieDisponible, type ReferenciaDeMetrica, type SerieElegida } from '@be/domain';
import { useEffect, useState } from 'react';
import { carrilDeSerie, puntosDeLaFuerza } from '../adaptadores';
import type { CarrilDePuntos } from '../carriles';
import { EstadoDelGraficoEnPantalla, type EstadoDelGrafico } from '../estado-del-grafico';
import { leerSerieDelCatalogo, type ParametrosDeLectura } from '../lecturas';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { PanelesAlineados, type DensidadDelGrafico } from '../paneles-alineados';
import { leerLaFuerza } from '../cruces/lecturas-de-los-cruces';
import { ejercicioDeLaClave, escalaDeLaSerie, lecturaDelPunto, motivoDeSuperpuestas, NOMBRE_DEL_MODO, serieElegidaDe, superposicionDeLasElegidas, type ModoArmado } from './compositor';
import { GraficoSuperpuesto } from './superpuestas-en-pantalla';

/** Lo que guarda un gráfico propio de un enfoque (`GraficoDelEnfoqueSchema`, `kind: 'CUSTOM'`): solo referencias. */
export interface GraficoArmado {
  readonly title: string;
  readonly series: readonly ReferenciaDeMetrica[];
  readonly mode: ModoArmado;
}

interface SerieLeida {
  readonly carril: CarrilDePuntos;
  readonly nombreCorto: string;
  readonly elegida: SerieElegida;
}

type EstadoDelArmado = EstadoDelGrafico | { readonly tipo: 'LISTA'; readonly series: readonly SerieLeida[] };

/** El nombre de una serie con su ejercicio, si lo tiene: «Carga · Sentadilla · serie 1 (kg)». */
function nombreDe(ref: ReferenciaDeMetrica, nombre: string, ejercicios: ReadonlyMap<string, string>): string {
  if (!ref.exerciseKey) return nombre;
  return `${nombre} · ${ejercicios.get(ref.exerciseKey) ?? 'ejercicio'}${ref.setIndex !== null ? ` · serie ${ref.setIndex}` : ''}${ref.unit ? ` (${ref.unit})` : ''}`;
}

/** Lee una serie y la arma como carril; `null` si no se puede dibujar (sin acceso, sin datos), con el porqué. */
async function leerUna(
  p: ParametrosDeLectura,
  ref: ReferenciaDeMetrica,
  indice: number,
  ejercicios: ReadonlyMap<string, string>,
): Promise<{ readonly tipo: 'lista'; readonly serie: SerieLeida } | { readonly tipo: 'sin-acceso' | 'sin-datos' | 'cargando' } | { readonly tipo: 'error'; readonly motivo: Extract<EstadoDelGrafico, { tipo: 'ERROR' }>['motivo'] }> {
  const catalogo = serieDisponible(ref.metricId);
  if (!catalogo) return { tipo: 'sin-datos' };
  const exerciseId = ref.exerciseKey ? ejercicioDeLaClave(ref.exerciseKey) : null;
  if (catalogo.id === 'entrenamiento.1rm-estimado') {
    if (!exerciseId || !entraEnLaEstimacion(exerciseId)) return { tipo: 'sin-datos' };
    const unidad = ref.unit ?? 'kg';
    const f = await leerLaFuerza(p, exerciseId, unidad, false);
    if (f.tipo !== 'lista') return f.tipo === 'error' ? f : { tipo: f.tipo === 'sin-especificacion' ? 'sin-datos' : f.tipo };
    const nombre = nombreDe(ref, catalogo.definicion.nombre, ejercicios);
    const carril: CarrilDePuntos = {
      tipo: 'PUNTOS',
      id: `${catalogo.id}|${indice}`,
      nombre,
      unidad,
      metodo: catalogo.metodo?.nombre ?? null,
      indice,
      puntos: puntosDeLaFuerza(f.puntos, unidad, (x) => `${estimacionALaVista({ carga: x.estimate.load.value, repeticiones: x.estimate.completedRepetitions, rir: x.estimate.rir, unidad: x.estimate.load.unit })} · ${x.estimate.completedRepetitions} rep · RIR ${numero(x.estimate.rir, 1)}${x.source === 'OBSERVED' ? ' · observada por el profesional' : ''}`),
      indicado: [],
      escalones: [],
      unir: catalogo.unirPuntos,
      escala: escalaDeLaSerie(catalogo, unidad),
      cobertura: [],
      descripcion: `${numero(f.puntos.length, 0)} ${f.puntos.length === 1 ? 'sesión' : 'sesiones'} con una estimación.`,
    };
    return { tipo: 'lista', serie: { carril, nombreCorto: catalogo.definicion.nombreCorto, elegida: { serie: catalogo, unidad } } };
  }
  const grano = catalogo.definicion.area === 'NUTRICION' ? 'DAY' : 'ORIGINAL';
  const leida = await leerSerieDelCatalogo(p, ref, grano);
  if (leida.tipo !== 'lista') return leida.tipo === 'error' ? leida : { tipo: leida.tipo === 'sin-especificacion' ? 'sin-datos' : leida.tipo };
  const unidad = leida.serie.unit;
  const elegida = serieElegidaDe(ref.metricId, unidad, grano);
  if (!elegida) return { tipo: 'sin-datos' };
  const carril = carrilDeSerie(leida.serie, elegida.serie, {
    id: `${catalogo.id}|${indice}`,
    nombre: nombreDe(ref, elegida.serie.definicion.nombre, ejercicios),
    indice,
    metodo: elegida.serie.metodo?.rotulo ?? null,
    escala: escalaDeLaSerie(elegida.serie, unidad),
    descripcion: `${numero(leida.serie.points.filter((x) => x.value !== null).length, 0)} observaciones con valor.`,
    lectura: (x) => lecturaDelPunto(x, elegida.serie.definicion, unidad),
  });
  return { tipo: 'lista', serie: { carril, nombreCorto: elegida.serie.definicion.nombreCorto, elegida } };
}

export function GraficoArmadoEnPantalla({
  grafico,
  lectura,
  periodo,
  densidad = 'COMPLETA',
  ejercicios,
}: {
  grafico: GraficoArmado;
  lectura: Omit<ParametrosDeLectura, 'periodo'>;
  periodo: PeriodoDelGrafico;
  densidad?: DensidadDelGrafico;
  /** Los nombres de los ejercicios del período, por su clave (`e:` o `v:`). */
  ejercicios: ReadonlyMap<string, string>;
}) {
  const [estado, setEstado] = useState<EstadoDelArmado>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  const clave = `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${JSON.stringify(grafico.series)}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    if (grafico.series.length === 0) {
      setEstado({ tipo: 'SIN_DATOS', texto: 'Elegí al menos una serie.' });
      return;
    }
    setEstado({ tipo: 'CARGANDO' });
    const p = { ...lectura, periodo };
    void Promise.all(grafico.series.map((ref, i) => leerUna(p, ref, i, ejercicios))).then((leidas) => {
      if (!vigente || leidas.some((l) => l.tipo === 'cargando')) return;
      const fallida = leidas.find((l) => l.tipo === 'error');
      if (fallida && fallida.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: fallida.motivo });
      const listas = leidas.flatMap((l) => (l.tipo === 'lista' ? [l.serie] : []));
      // Una serie de un área sin acceso no se dibuja ni deja un hueco; si no queda ninguna, el gráfico no está.
      if (listas.length === 0) return setEstado(leidas.every((l) => l.tipo === 'sin-acceso') ? { tipo: 'SIN_ACCESO' } : { tipo: 'SIN_DATOS', texto: 'Sin observaciones de estas series en el período.' });
      setEstado({ tipo: 'LISTA', series: listas });
    });
    return () => {
      vigente = false;
    };
    // `clave` resume lo que cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  if (estado.tipo !== 'LISTA') return <EstadoDelGraficoEnPantalla estado={estado} onReintentar={() => setVuelta((v) => v + 1)} />;
  const elegidas = estado.series.map((s) => s.elegida);
  const carriles = estado.series.map((s) => s.carril);
  const nombres = estado.series.map((s) => s.nombreCorto);
  const superposicion = grafico.mode === 'OVERLAY' ? superposicionDeLasElegidas(elegidas) : null;
  if (superposicion?.permitida) {
    return (
      <GraficoSuperpuesto
        titulo={grafico.title}
        periodo={periodo}
        carriles={carriles}
        lados={superposicion.lados}
        nombresCortos={nombres}
        densidad={densidad}
        leyenda={['REGISTRADO', 'SUBTOTAL']}
        frase={fraseDeLaCoincidencia(elegidas, 'OVERLAY', superposicion.composicion?.ejesY.length ?? 1)}
      />
    );
  }
  const frase = fraseDeLaCoincidencia(elegidas, 'PANELS', elegidas.length);
  const motivo = superposicion && superposicion.motivo ? `${NOMBRE_DEL_MODO.OVERLAY}: ${motivoDeSuperpuestas(superposicion.motivo, superposicion.grupos, nombres).replace(/^«Superpuestas» /, '')}` : null;
  return <PanelesAlineados titulo={grafico.title} periodo={periodo} carriles={carriles} densidad={densidad} leyenda={['REGISTRADO', 'SUBTOTAL']} notas={[...(motivo ? [motivo] : []), ...(frase ? [frase] : [])]} />;
}
