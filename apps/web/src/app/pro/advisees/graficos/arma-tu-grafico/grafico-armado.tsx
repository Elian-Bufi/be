'use client';

/**
 * Un gráfico armado con «Armá tu gráfico» (GR-26; WP-GRAFICOS fase 2, DL-174): hasta tres series del catálogo, en
 * «Alineadas» o «Superpuestas». Lo usan la vista previa del compositor y «Patrones» (un gráfico propio de un enfoque).
 *
 * - **Guarda referencias, nunca datos:** cada vez que se dibuja, lee cada serie con el acceso de este momento.
 * - **Una serie de un área sin acceso no se pide, no se dibuja ni deja un hueco** (`serieConAcceso`, con el `acceso` de
 *   este momento): si no queda ninguna, el gráfico no está. La API decide igual en cada lectura.
 * - **«Superpuestas» con las reglas del dominio:** si las series no se pueden superponer (otro eje X, tres unidades),
 *   se dibujan alineadas y se dice por qué. La frase de la coincidencia va con dos áreas o con dos ejes.
 */
import { entraEnLaEstimacion, estimacionALaVista, fraseDeLaCoincidencia, numero, serieDisponible, type AccesoDeLaPersona, type ReferenciaDeMetrica, type SerieElegida } from '@be/domain';
import { useEffect, useState } from 'react';
import { carrilDeSerie, puntosDeLaFuerza } from '../adaptadores';
import type { CarrilDePuntos } from '../carriles';
import { EstadoDelGraficoEnPantalla, type EstadoDelGrafico } from '../estado-del-grafico';
import { leerSerieDelCatalogo, type ParametrosDeLectura } from '../lecturas';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { PanelesAlineados, type DensidadDelGrafico } from '../paneles-alineados';
import { leerLaFuerza } from '../cruces/lecturas-de-los-cruces';
import {
  carrilesConLasParejas,
  ejercicioDeLaClave,
  escalaDeLaSerie,
  esLoIndicado,
  lecturaDelPunto,
  leyendaDeLasSeries,
  motivoDeSuperpuestas,
  NOMBRE_DE_LA_PAREJA,
  NOMBRE_DEL_MODO,
  serieConAcceso,
  serieElegidaDe,
  superposicionDeLasElegidas,
  unirLaSerie,
  type ModoArmado,
} from './compositor';
import { GraficoSuperpuesto } from './superpuestas-en-pantalla';

/** Lo que guarda un gráfico propio de un enfoque (`GraficoDelEnfoqueSchema`, `kind: 'CUSTOM'`): solo referencias. */
export interface GraficoArmado {
  readonly title: string;
  readonly series: readonly ReferenciaDeMetrica[];
  readonly mode: ModoArmado;
}

interface SerieLeida {
  readonly ref: ReferenciaDeMetrica;
  readonly carril: CarrilDePuntos;
  readonly nombreCorto: string;
  readonly elegida: SerieElegida;
}

type EstadoDelArmado = EstadoDelGrafico | { readonly tipo: 'LISTA'; readonly series: readonly SerieLeida[]; readonly sinDatos?: string | null };

/**
 * WP-GRAFICOS-POR-FASE: una serie elegida que no tiene observaciones en el período no se dibuja, pero se dice (antes
 * desaparecía sin aviso, y «Carga × repeticiones indicada y hecha» mostraba solo lo hecho). Un área sin acceso, no.
 */
function notaDeLasSinDatos(refs: readonly ReferenciaDeMetrica[], leidas: readonly { readonly tipo: string }[]): string | null {
  const sinDatos = refs.filter((_, i) => leidas[i]?.tipo === 'sin-datos');
  if (sinDatos.length === 0) return null;
  const nombres = sinDatos.map((r) => `«${serieDisponible(r.metricId)?.definicion.nombreCorto ?? r.metricId}»`).join(', ');
  const rango = sinDatos.some((r) => r.metricId === 'entrenamiento.carga-por-repeticiones-indicada') ? ' Lo indicado con un rango de repeticiones es un rango y no se dibuja como un número.' : '';
  return `Sin observaciones en el período: ${nombres}.${rango}`;
}

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
  acceso: AccesoDeLaPersona,
): Promise<{ readonly tipo: 'lista'; readonly serie: SerieLeida } | { readonly tipo: 'sin-acceso' | 'sin-datos' | 'cargando' } | { readonly tipo: 'error'; readonly motivo: Extract<EstadoDelGrafico, { tipo: 'ERROR' }>['motivo'] }> {
  const catalogo = serieDisponible(ref.metricId);
  if (!catalogo) return { tipo: 'sin-datos' };
  // Una serie de un área sin acceso no se pide: el enfoque guarda la referencia, no el permiso.
  if (!serieConAcceso(catalogo, acceso)) return { tipo: 'sin-acceso' };
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
    return { tipo: 'lista', serie: { ref, carril, nombreCorto: catalogo.definicion.nombreCorto, elegida: { serie: catalogo, unidad } } };
  }
  const grano = catalogo.definicion.area === 'NUTRICION' ? 'DAY' : 'ORIGINAL';
  const leida = await leerSerieDelCatalogo(p, ref, grano);
  if (leida.tipo !== 'lista') return leida.tipo === 'error' ? leida : { tipo: leida.tipo === 'sin-especificacion' ? 'sin-datos' : leida.tipo };
  const unidad = leida.serie.unit;
  const elegida = serieElegidaDe(ref.metricId, unidad, grano);
  if (!elegida) return { tipo: 'sin-datos' };
  const delCatalogo = carrilDeSerie(leida.serie, elegida.serie, {
    id: `${catalogo.id}|${indice}`,
    nombre: nombreDe(ref, elegida.serie.definicion.nombre, ejercicios),
    indice,
    metodo: elegida.serie.metodo?.rotulo ?? null,
    escala: escalaDeLaSerie(elegida.serie, unidad),
    descripcion: `${numero(leida.serie.points.filter((x) => x.value !== null).length, 0)} observaciones con valor.`,
    lectura: (x) => lecturaDelPunto(x, elegida.serie.definicion, unidad),
  });
  // GR-T59: lo indicado (el RIR indicado) va suelto, sin línea, como en «Analizar».
  const carril: CarrilDePuntos = { ...delCatalogo, unir: unirLaSerie(elegida.serie) };
  return { tipo: 'lista', serie: { ref, carril, nombreCorto: elegida.serie.definicion.nombreCorto, elegida } };
}

export function GraficoArmadoEnPantalla({
  grafico,
  lectura,
  periodo,
  densidad = 'COMPLETA',
  ejercicios,
  acceso,
}: {
  grafico: GraficoArmado;
  lectura: Omit<ParametrosDeLectura, 'periodo'>;
  periodo: PeriodoDelGrafico;
  densidad?: DensidadDelGrafico;
  /** Los nombres de los ejercicios del período, por su clave (`e:` o `v:`). */
  ejercicios: ReadonlyMap<string, string>;
  /** Lo que el PDP deja leer hoy con esta persona: una serie de un área sin acceso no se pide. */
  acceso: AccesoDeLaPersona;
}) {
  const [estado, setEstado] = useState<EstadoDelArmado>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  // El acceso entra en la clave: si cambió un permiso, se vuelve a decidir qué se pide.
  const clave = `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${JSON.stringify(grafico.series)}|${JSON.stringify(acceso)}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    if (grafico.series.length === 0) {
      setEstado({ tipo: 'SIN_DATOS', texto: 'Elegí al menos una serie.' });
      return;
    }
    setEstado({ tipo: 'CARGANDO' });
    const p = { ...lectura, periodo };
    void Promise.all(grafico.series.map((ref, i) => leerUna(p, ref, i, ejercicios, acceso))).then((leidas) => {
      if (!vigente || leidas.some((l) => l.tipo === 'cargando')) return;
      const fallida = leidas.find((l) => l.tipo === 'error');
      if (fallida && fallida.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: fallida.motivo });
      const listas = leidas.flatMap((l) => (l.tipo === 'lista' ? [l.serie] : []));
      // Una serie de un área sin acceso no se dibuja ni deja un hueco; si no queda ninguna, el gráfico no está.
      if (listas.length === 0) return setEstado(leidas.every((l) => l.tipo === 'sin-acceso') ? { tipo: 'SIN_ACCESO' } : { tipo: 'SIN_DATOS', texto: 'Sin observaciones de estas series en el período.' });
      setEstado({ tipo: 'LISTA', series: listas, sinDatos: notaDeLasSinDatos(grafico.series, leidas) });
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
  // La leyenda dice solo lo que está dibujado, con lo que quiere decir cada forma en su serie.
  const leyenda = leyendaDeLasSeries(estado.series.map((s) => ({ id: s.elegida.serie.id, indicada: esLoIndicado(s.elegida.serie), marcas: s.carril.puntos.filter((p) => p.valor !== null).map((p) => p.marca) })));
  // Una serie de un área sin acceso no se dibuja y no deja rastro: si por eso quedó una sola, no se dice que
  // «Superpuestas» pide dos (sería decir que falta una).
  const sinTodas = estado.series.length < grafico.series.length;
  if (superposicion?.permitida) {
    return (
      <GraficoSuperpuesto
        titulo={grafico.title}
        periodo={periodo}
        carriles={carriles}
        lados={superposicion.lados}
        nombresCortos={nombres}
        densidad={densidad}
        leyenda={leyenda}
        frase={[fraseDeLaCoincidencia(elegidas, 'OVERLAY', superposicion.composicion?.ejesY.length ?? 1), estado.sinDatos].filter(Boolean).join(' ') || null}
      />
    );
  }
  const frase = fraseDeLaCoincidencia(elegidas, 'PANELS', elegidas.length);
  const motivo = superposicion && superposicion.motivo && !sinTodas ? `${NOMBRE_DEL_MODO.OVERLAY}: ${motivoDeSuperpuestas(superposicion.motivo, superposicion.grupos, nombres).replace(/^«Superpuestas» /, '')}` : null;
  // Lo indicado y lo hecho de un mismo ejercicio van en un solo panel, con la misma escala (como GPF-06).
  const alineados = carrilesConLasParejas(estado.series, (indicada, hecha) => nombreDe(hecha, NOMBRE_DE_LA_PAREJA[indicada.metricId] ?? indicada.metricId, ejercicios));
  return <PanelesAlineados titulo={grafico.title} periodo={periodo} carriles={alineados} densidad={densidad} leyenda={leyenda} notas={[...(motivo ? [motivo] : []), ...(frase ? [frase] : []), ...(estado.sinDatos ? [estado.sinDatos] : [])]} />;
}
