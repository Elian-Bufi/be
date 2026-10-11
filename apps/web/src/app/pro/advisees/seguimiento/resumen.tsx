'use client';

/**
 * Resumen de la ficha («¿Qué tengo pendiente con esta persona?»). WP-ESCRITORIO-AMABLE, parte 3: se organiza **por
 * área**, no por tipo de información, para que lo de cada área se lea junto y entre en la primera pantalla.
 * 1. **Una tarjeta por área disponible** (`resumen-area.tsx`): con qué se trabaja (objetivo y plan, o las tomas), lo
 *    pendiente, lo nuevo desde su última revisión y la acción que corresponde. Los hechos son las observaciones de
 *    reglas fijas de `sintesisDelResumen` (dominio), con sus mismas palabras.
 * 2. **Indicadores** (`resumen-indicadores.tsx`): hasta cuatro, cada uno con su valor, su regla, su minigráfico y su
 *    cobertura.
 * 3. **Empezar por una pregunta:** las preguntas principales, que arman «Analizar».
 *
 * Las preguntas van donde no le quitan lugar a los indicadores: al final con tres áreas, en la columna libre con dos, y
 * debajo de los indicadores, al costado de la tarjeta, con una sola. El orden del documento es siempre el que se ve.
 *
 * Lo que se mudó (no se quitó): «Qué se registró en el período» está en cada tarjeta (a un clic cuando hay revisión) y
 * en la cobertura de cada indicador; «Lo último que pasó» es la pestaña «Línea de tiempo»; «de dónde sale» cada hecho y
 * cómo se arma la lista están en «Cómo se lee esta vista». Abrir la ficha no crea ni registra nada.
 */
import {
  fechaCivil,
  numero,
  PREGUNTAS_PROFESIONALES,
  sintesisDelResumen,
  type CalidadDeEntrada,
  type DatosDeLaSintesis,
  type FormatoDeLaSintesis,
  type IdDePregunta,
  type LecturaDeLaSintesis,
  type LineaDeTiempoResponse,
  type NovedadesDeUnArea,
  type ObservacionDelResumen,
  type OrigenDeDato,
  type TipoDeEvento,
} from '@be/domain';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Cargando, ErrorConReintento, EstadoVacio } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaDelAnioEnCurso } from '../../../../lib/formato';
import { useLectura, useSeguimiento, type Lectura } from './contexto';
import { hoyEn, parametrosDePregunta, restarDias } from './estado';
import { TarjetasDeArea } from './resumen-area';
import { IndicadoresDelResumen } from './resumen-indicadores';
import { useDisponibles, type Disponibles } from './series';
import type { MacrosDelObjetivo } from './tira-del-objetivo';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const ZONA = 'America/Argentina/Buenos_Aires';

/**
 * Cómo se escriben las fechas en el Resumen: sin el año si es el año en curso («20 sept»), con el año si no. El período,
 * con su año, está en el marco de la ficha. Se arma por visita: «hoy» cambia.
 */
function formatoDelResumen(hoy: string): FormatoDeLaSintesis {
  return { fecha: (f) => diaDelAnioEnCurso(f, hoy), dia: (instante) => diaDelAnioEnCurso(fechaCivil(instante, ZONA), hoy) };
}

export function ResumenDelSeguimiento() {
  const { token, asesoradoId, periodo, panel, recargarPanel, href } = useSeguimiento();
  const disponibles = useDisponibles();
  // Una sola lectura de la línea de tiempo trae la cobertura de entrenamiento (sus conteos son del conjunto autorizado,
  // antes de los filtros). Los hechos no se listan acá: son la pestaña «Línea de tiempo».
  const { lectura: delPeriodo, recargar: recargarDelPeriodo } = useLectura<LineaDeTiempoResponse>(`del-periodo|${asesoradoId}|${periodo.desde}|${periodo.hasta}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '1' }),
  );
  const novedadesDeNutricion = useNovedades('NUTRICION');
  const novedadesDeEntrenamiento = useNovedades('ENTRENAMIENTO');
  const { macros, recargar: recargarMacros } = useMacrosDelObjetivo();
  const [origen, setOrigen] = useState<{ origen: OrigenDeDato; titulo: string } | null>(null);
  const hoy = hoyEn();
  const formato = useMemo(() => formatoDelResumen(hoy), [hoy]);
  const observaciones = useSintesis(disponibles, delPeriodo, { NUTRICION: novedadesDeNutricion, ENTRENAMIENTO: novedadesDeEntrenamiento });

  if (panel.tipo === 'cargando') return <Cargando />;
  if (panel.tipo === 'error') return <ErrorConReintento mensaje="No pudimos leer el resumen por área. No es una ausencia de datos: reintentá." onReintentar={recargarPanel} />;
  if (panel.tipo !== 'listo') return null;

  const d = panel.datos.domains;
  const areas = [d.nutrition.available, d.training.available, d.anthropometry.available].filter(Boolean).length;
  const tarjetas = (
    <TarjetasDeArea
      disponibles={disponibles}
      observaciones={observaciones}
      formato={formato}
      macros={macros}
      onReintentarMacros={recargarMacros}
      onReintentar={() => {
        disponibles.recargar();
        recargarDelPeriodo();
        novedadesDeNutricion.recargar();
        novedadesDeEntrenamiento.recargar();
      }}
      onAbrirToma={(evaluationId) => setOrigen({ origen: { type: 'ANTHROPOMETRIC_EVALUATION', id: evaluationId }, titulo: 'Última toma' })}
    />
  );
  const indicadores = <IndicadoresDelResumen disponibles={disponibles} formato={formato} />;
  const tardias = delPeriodo.tipo === 'listo' ? delPeriodo.datos.data.periodCounts.recordedLate : 0;
  return (
    <>
      {areas === 0 ? <EstadoVacio titulo="Ninguna área disponible con tu acceso actual">El acceso de cada área se ve en el encabezado de la ficha.</EstadoVacio> : null}
      {areas === 1 ? (
        // Una sola área: su tarjeta a la izquierda y, al costado, los indicadores y las preguntas. En el documento van
        // en ese mismo orden.
        <div className="resumen resumen--una-area">
          <div className="areas" data-areas={areas}>
            {tarjetas}
          </div>
          <div className="resumen__costado">
            {indicadores}
            <PreguntasDelResumen />
          </div>
        </div>
      ) : null}
      {areas === 2 ? (
        // Dos áreas: las preguntas ocupan el lugar que queda al lado de las tarjetas, sin correr los indicadores.
        <div className="resumen">
          <div className="areas" data-areas={areas}>
            {tarjetas}
            <PreguntasDelResumen />
          </div>
          {indicadores}
        </div>
      ) : null}
      {areas === 3 ? (
        // Tres áreas: primero lo de esta persona (las áreas y sus indicadores); las preguntas, que son caminos para
        // analizar y también están en «Analizar», van después. Así los indicadores entran en la primera pantalla.
        <div className="resumen">
          <div className="areas" data-areas={areas}>
            {tarjetas}
          </div>
          {indicadores}
          <PreguntasDelResumen />
        </div>
      ) : null}
      {/* Lo que no es de un área sola: cuántos hechos se cargaron otro día. Se ven, uno por uno, en la línea de tiempo. */}
      {tardias > 0 ? (
        <p className="resumen__tardias nota">
          <Icono nombre="cargado-otro-dia" tamano={18} />
          <span>
            Cargado otro día: {tardias === 1 ? 'un hecho del período se registró un día posterior al que ocurrió' : `${numero(tardias)} hechos del período se registraron un día posterior al que ocurrieron`} (carga tardía).{' '}
            <Link href={href({ vista: 'linea', tardias: '1', areas: null, novedades: null, tipos: null, estados: null, calidad: null, plan: null, ej: null })}>Verlos en la línea de tiempo</Link>
          </span>
        </p>
      ) : null}
      <PanelDeRegistro origen={origen?.origen ?? null} titulo={origen?.titulo ?? ''} onCerrar={() => setOrigen(null)} />
    </>
  );
}

// ─── Lo nuevo desde la última revisión de un área ───────────────────────────────────────────────

type Novedades = LecturaDeLaSintesis<NovedadesDeUnArea> & { readonly cargando: boolean; readonly recargar: () => void };

/**
 * Lo nuevo desde la última revisión registrada del área: API-DSH-04 con `since` (el instante de la revisión), en el área y
 * hasta un año hacia atrás (el máximo del análisis). Sin revisión, no hay corte: esa parte no aplica.
 */
function useNovedades(area: 'NUTRICION' | 'ENTRENAMIENTO'): Novedades {
  const { token, asesoradoId, panel } = useSeguimiento();
  const dominio = area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING';
  const entrada = panel.tipo === 'listo' ? (area === 'NUTRICION' ? panel.datos.domains.nutrition : panel.datos.domains.training) : null;
  const corte = entrada && entrada.available ? (entrada.summary?.lastReview?.recordedAt ?? null) : null;
  const hoy = hoyEn();
  const desde = restarDias(hoy, 365);
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(
    corte ? `novedades|${asesoradoId}|${dominio}|${corte}|${hoy}` : null,
    () => api.lineaDeTiempo(token, asesoradoId, { periodStart: desde, periodEnd: hoy, domain: dominio, since: corte ?? undefined, limit: '1' }),
    dominio,
  );
  if (corte === null) return { estado: 'NO_APLICA', cargando: false, recargar };
  if (lectura.tipo === 'cargando') return { estado: 'NO_APLICA', cargando: true, recargar };
  if (lectura.tipo === 'error') return { estado: 'FALLO', cargando: false, recargar };
  if (lectura.tipo === 'no-disponible' || !lectura.datos.data.sinceCounts) return { estado: 'NO_APLICA', cargando: false, recargar };
  return { estado: 'LISTA', valor: { conteos: lectura.datos.data.sinceCounts, leidoDesde: desde }, cargando: false, recargar };
}

// ─── Los macros del objetivo nutricional ────────────────────────────────────────────────────────

type ObjetivoEfectivo = Extract<Awaited<ReturnType<typeof api.objetivoEfectivo>>, { ok: true }>['datos'];

/**
 * Los macros del objetivo vigente (API-NUT-06, «objetivo efectivo»): el resumen de la ficha trae solo las calorías. Se
 * piden únicamente si Nutrición está disponible y tiene objetivo. Si la versión que llega no es la del resumen (cambió
 * entre las dos lecturas), no se mezclan números de dos objetivos: quedan las calorías.
 */
function useMacrosDelObjetivo(): { readonly macros: MacrosDelObjetivo; readonly recargar: () => void } {
  const { token, asesoradoId, panel } = useSeguimiento();
  const objetivo = panel.tipo === 'listo' && panel.datos.domains.nutrition.available ? (panel.datos.domains.nutrition.summary?.objective ?? null) : null;
  const { lectura, recargar } = useLectura<ObjetivoEfectivo>(objetivo ? `macros|${asesoradoId}|${objetivo.objectiveVersionId}` : null, () => api.objetivoEfectivo(token, asesoradoId), 'NUTRITION');
  if (!objetivo) return { macros: null, recargar };
  if (lectura.tipo === 'cargando') return { macros: { estado: 'cargando' }, recargar };
  if (lectura.tipo === 'error') return { macros: { estado: 'falla' }, recargar };
  if (lectura.tipo === 'no-disponible') return { macros: null, recargar };
  const efectivo = lectura.datos.data.objective;
  return { macros: efectivo && efectivo.versionId === objetivo.objectiveVersionId ? { estado: 'listos', valor: efectivo.macronutrientDistribution } : null, recargar };
}

// ─── La síntesis: los hechos de cada área ───────────────────────────────────────────────────────

/** Las observaciones de la síntesis, con lo que cada lectura dejó leer. `null` mientras alguna todavía se está leyendo. */
function useSintesis(disponibles: Disponibles, delPeriodo: Lectura<LineaDeTiempoResponse>, novedades: Readonly<Record<'NUTRICION' | 'ENTRENAMIENTO', Novedades>>): ObservacionDelResumen[] | null {
  const { panel, periodo } = useSeguimiento();
  const cargando = disponibles.cargando || delPeriodo.tipo === 'cargando' || novedades.NUTRICION.cargando || novedades.ENTRENAMIENTO.cargando;
  return useMemo(() => {
    if (panel.tipo !== 'listo' || cargando) return null;
    const d = panel.datos.domains;
    const lineaLista = delPeriodo.tipo === 'listo' ? delPeriodo.datos.data : null;
    const deTipo = (t: TipoDeEvento) => lineaLista?.periodCounts.byEventType.find((x) => x.eventType === t)?.count ?? 0;
    const conCalidad = (c: CalidadDeEntrada) => lineaLista?.periodCounts.byQuality.find((x) => x.quality === c)?.count ?? 0;
    const sinNovedades = (n: Novedades): LecturaDeLaSintesis<NovedadesDeUnArea> => (n.estado === 'LISTA' ? { estado: 'LISTA', valor: n.valor } : { estado: n.estado });
    const datos: DatosDeLaSintesis = {
      hoy: hoyEn(),
      zonaHoraria: ZONA,
      periodo: { desde: periodo.desde, hasta: periodo.hasta },
      nutricion: d.nutrition.available
        ? {
            resumen: d.nutrition.summary,
            novedades: sinNovedades(novedades.NUTRICION),
            cobertura: disponibles.fallas.nutricion ? { estado: 'FALLO' } : disponibles.coberturaNutricional ? { estado: 'LISTA', valor: disponibles.coberturaNutricional } : { estado: 'NO_APLICA' },
            vigencias: disponibles.vigencias.nutricion,
          }
        : null,
      entrenamiento: d.training.available
        ? {
            resumen: d.training.summary,
            novedades: sinNovedades(novedades.ENTRENAMIENTO),
            cobertura:
              delPeriodo.tipo === 'error'
                ? { estado: 'FALLO' }
                : lineaLista?.sourceDomains.includes('TRAINING')
                  ? {
                      estado: 'LISTA',
                      valor: {
                        sesiones: deTipo('TRAINING_SESSION_RECORDED'),
                        conCambios: conCalidad('SESSION_WITH_DEVIATION'),
                        noRealizadas: conCalidad('SESSION_NOT_COMPLETED'),
                        resumidas: conCalidad('SESSION_SUMMARY_ONLY'),
                      },
                    }
                  : { estado: 'NO_APLICA' },
            vigencias: disponibles.vigencias.entrenamiento,
          }
        : null,
      antropometria: d.anthropometry.available
        ? {
            resumen: d.anthropometry.summary,
            comparabilidad: disponibles.fallas.antropometria
              ? { estado: 'FALLO' }
              : disponibles.antropometria
                ? { estado: 'LISTA', valor: disponibles.antropometria.map((m) => ({ metricCode: m.metricCode, nombre: m.name, grupos: m.comparabilityGroups })) }
                : { estado: 'NO_APLICA' },
          }
        : null,
    };
    return sintesisDelResumen(datos);
  }, [panel, cargando, delPeriodo, disponibles, novedades.NUTRICION, novedades.ENTRENAMIENTO, periodo]);
}

// ─── Empezar por una pregunta ───────────────────────────────────────────────────────────────────

/**
 * Las preguntas principales, también desde el Resumen (WP-DASHBOARD-COMPRENSION, eje 2). Una pregunta prepara «Analizar»
 * desde cero: sin las métricas ni los parámetros de un análisis anterior. Con una sola área con plan, el área ya viene
 * elegida (se ve y se puede cambiar). La del ejercicio no se ofrece sin acceso a Entrenamiento: no tendría qué mostrar.
 */
function PreguntasDelResumen() {
  const { panel, href } = useSeguimiento();
  const id = useId();
  if (panel.tipo !== 'listo') return null;
  const d = panel.datos.domains;
  const conPlan = (e: typeof d.nutrition | typeof d.training) => e.available && e.summary?.activePlan;
  const areas = [...(conPlan(d.nutrition) ? (['NUTRICION'] as const) : []), ...(conPlan(d.training) ? (['ENTRENAMIENTO'] as const) : [])];
  const aLaPregunta = (pregunta: IdDePregunta) => href({ vista: 'analizar', m: null, f: null, ...parametrosDePregunta({ id: pregunta, params: areas.length === 1 && areas[0] ? { area: areas[0] } : {} }) });
  const preguntas = PREGUNTAS_PROFESIONALES.filter((p) => p.principal && (p.id !== 'progreso-de-un-ejercicio' || d.training.available));
  return (
    <nav className="preguntas-del-resumen" aria-labelledby={`${id}-titulo`}>
      {/* Según el ancho que le toque: una franja de un renglón, o una tarjeta con las preguntas una debajo de la otra. */}
      <div className="preguntas-del-resumen__caja">
        <h2 id={`${id}-titulo`}>
          <Icono nombre="pregunta" tamano={20} />
          Empezar por una pregunta
        </h2>
        <ul className="preguntas-del-resumen__lista">
          {preguntas.map((p) => (
            <li key={p.id}>
              <Link href={aLaPregunta(p.id)}>{p.pregunta}</Link>
            </li>
          ))}
        </ul>
        <Link className="preguntas-del-resumen__mas" href={href({ vista: 'analizar', m: null, f: null, ...parametrosDePregunta(null) })}>
          Más preguntas
        </Link>
      </div>
    </nav>
  );
}
