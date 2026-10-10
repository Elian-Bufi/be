'use client';

/**
 * Resumen de la ficha («¿Qué necesito revisar?»; WP-DASHBOARD-COMPRENSION, eje 1), en el orden del encargo:
 * 1. **Objetivo y planificación** por área: lo vigente hoy (objetivo con su fecha y su autoría, plan con su versión) y lo
 *    que rigió en el período, con la última revisión, la próxima acordada y el borrador si lo hay.
 * 2. **Para tu próxima revisión:** observaciones factuales de reglas fijas (`sintesisDelResumen`, del dominio), cada una
 *    con su área, su alcance (desde la última revisión de esa área, o el período elegido), de dónde sale y la acción que
 *    la profundiza. Las primeras cuatro a la vista; «Ver todas» con el total autorizado. Una lectura que falló se dice.
 * 3. **Acciones:** preparar una revisión, analizar un cambio, solicitar contexto. Abrir la ficha no crea nada.
 * 4. **Indicadores** fijados (hasta 4, por cuenta con API-VAN), sin colores de juicio (PRO-02).
 * 5. **Cobertura del período y últimos hechos**, juntos: qué se registró y qué falta, nunca un porcentaje de adherencia.
 */
import {
  claveDeObservacion,
  COPY_VINCULO,
  definicionDeMetrica,
  fechaCivil,
  FUENTE_DE_LA_REGLA,
  METRICAS_DEL_DICCIONARIO,
  NOMBRE_DE_DOMINIO,
  NOMBRE_DEL_AREA,
  numero,
  cantidad,
  partesDeLaCobertura,
  primerPlanDelPeriodo,
  PREGUNTAS_PROFESIONALES,
  resumirPeriodo,
  sintesisDelResumen,
  textoDeObservacion,
  textoDelAlcance,
  textoDelPrimerPlan,
  type AccionDelResumen,
  type CalidadDeEntrada,
  type DatosDeLaSintesis,
  type IdDePregunta,
  type LecturaDeLaSintesis,
  type LineaDeTiempoResponse,
  type NovedadesDeUnArea,
  type ObservacionDelResumen,
  type OrigenDeDato,
  type ReferenciaDeMetrica,
  type ResumenDeEntrenamiento,
  type ResumenDeNutricion,
  type TipoDeEvento,
  type VigenciaDePlan,
  type VistaDeAnalisis,
} from '@be/domain';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando, ErrorConReintento, EstadoVacio } from '../../../../components/estados';
import { api, nuevaClaveDeIdempotencia } from '../../../../lib/api';
import { diaCivil, fecha, horaEnZona } from '../../../../lib/formato';
import { valorParaMostrar } from './valores';
import { textoDeFalla, useLectura, useSeguimiento, type Lectura } from './contexto';
import { claveDeLaReferencia, codificarReferencia, conRetorno, hoyEn, parametrosDePregunta, restarDias, valorDeRetorno } from './estado';
import { nombreDeLaReferencia } from './selector';
import { useDisponibles, useSeriesDelAnalisis, type Disponibles } from './series';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const MAXIMO_DE_INDICADORES = 4;
const OBSERVACIONES_A_LA_VISTA = 4;
const ZONA = 'America/Argentina/Buenos_Aires';

/** «1 sesión registrada», «3 sesiones registradas». */
const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;
/** La fecha civil de un instante en la zona del asesorado, «4 sept 2026». */
const diaDe = (instante: string): string => diaCivil(fechaCivil(instante, ZONA));
const FORMATO = { fecha: diaCivil, dia: diaDe };

export function ResumenDelSeguimiento() {
  const { token, asesoradoId, periodo, panel, recargarPanel } = useSeguimiento();
  const disponibles = useDisponibles();
  // Una sola lectura de la línea de tiempo trae la cobertura de entrenamiento y los últimos hechos (sus conteos son del
  // conjunto autorizado, antes de los filtros).
  const { lectura: delPeriodo, recargar: recargarDelPeriodo } = useLectura<LineaDeTiempoResponse>(`del-periodo|${asesoradoId}|${periodo.desde}|${periodo.hasta}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '6' }),
  );
  const novedadesDeNutricion = useNovedades('NUTRICION');
  const novedadesDeEntrenamiento = useNovedades('ENTRENAMIENTO');
  const [origen, setOrigen] = useState<{ origen: OrigenDeDato; titulo: string } | null>(null);

  if (panel.tipo === 'cargando') return <Cargando />;
  if (panel.tipo === 'error') return <ErrorConReintento mensaje="No pudimos leer el resumen por área. No es una ausencia de datos: reintentá." onReintentar={recargarPanel} />;
  if (panel.tipo !== 'listo') return null;

  return (
    <>
      <ObjetivoYPlanificacion disponibles={disponibles} onAbrir={(o, titulo) => setOrigen({ origen: o, titulo })} />
      <div className="resumen__revision">
        <ParaTuProximaRevision
          disponibles={disponibles}
          delPeriodo={delPeriodo}
          novedades={{ NUTRICION: novedadesDeNutricion, ENTRENAMIENTO: novedadesDeEntrenamiento }}
          onReintentar={() => {
            disponibles.recargar();
            recargarDelPeriodo();
            novedadesDeNutricion.recargar();
            novedadesDeEntrenamiento.recargar();
          }}
          onAbrir={(o, titulo) => setOrigen({ origen: o, titulo })}
        />
        <Acciones />
      </div>
      <IndicadoresDelResumen disponibles={disponibles} />
      <DelPeriodo disponibles={disponibles} lectura={delPeriodo} recargar={recargarDelPeriodo} />
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

// ─── 1 · Objetivo y planificación ───────────────────────────────────────────────────────────────

const etiquetaDeVersion = (planVersionId: string, vigencias: readonly VigenciaDePlan[]): string => {
  const v = vigencias.find((x) => x.planVersionId === planVersionId);
  return v ? `versión ${v.label.replace(/^v/, '')}` : 'versión vigente';
};

/**
 * «v1 (del 18 jul al 3 sept) · v2 (desde el 4 sept)»: lo que rigió en el período, sin solapar el día del corte. Una
 * versión reemplazada el mismo día en que se activó rigió unas horas: no se escribe «del 4 sept al 3 sept».
 */
function rigieron(vigencias: readonly VigenciaDePlan[]): string | null {
  if (vigencias.length === 0) return null;
  return [...vigencias]
    .sort((a, b) => a.activatedAt.localeCompare(b.activatedAt))
    .map((v) =>
      v.to === null
        ? `${v.label} (desde el ${diaCivil(v.from)})`
        : v.to <= v.from
          ? `${v.label} (unas horas del ${diaCivil(v.from)})`
          : `${v.label} (del ${diaCivil(v.from)} al ${diaCivil(restarDias(v.to, 1))})`,
    )
    .join(' · ');
}

function ObjetivoYPlanificacion({ disponibles, onAbrir }: { disponibles: Disponibles; onAbrir: (o: OrigenDeDato, titulo: string) => void }) {
  const { panel, asesoradoId, parametros } = useSeguimiento();
  const id = useId();
  if (panel.tipo !== 'listo') return null;
  const d = panel.datos.domains;
  const volver = valorDeRetorno(parametros);
  const ruta = (area: string, vista: string) => conRetorno(`/pro/advisees/${area}?id=${encodeURIComponent(asesoradoId)}&vista=${vista}`, volver);
  const ningunaArea = !d.nutrition.available && !d.training.available && !d.anthropometry.available;
  const ultimaToma = d.anthropometry.available ? (d.anthropometry.summary?.lastEvaluation?.evaluationId ?? null) : null;
  // Una fila por área y las mismas columnas en todas: se compara de un vistazo y entra en la primera pantalla junto con
  // la síntesis (encargo §5: con quién trabajo, qué buscamos, qué cambió y qué requiere mi revisión).
  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      {/* Sin una línea de metadatos: el período ya está en la barra, y «vigente hoy» y «antes, en el período» se dicen en
          cada celda. Esa línea empujaba la síntesis fuera de la primera pantalla. */}
      <h2 id={`${id}-titulo`}>Objetivo y planificación</h2>
      {ningunaArea ? <EstadoVacio titulo="Ninguna área disponible con tu acceso actual">El acceso de cada área se ve en el encabezado de la ficha.</EstadoVacio> : null}
      {ningunaArea ? null : (
        <div className="desplazable-x">
          <table className="tabla tabla-de-planificacion">
            <caption className="visualmente-oculto">Objetivo, planificación y revisiones de cada área</caption>
            <thead>
              <tr>
                <th scope="col">Área</th>
                <th scope="col">Objetivo vigente hoy</th>
                <th scope="col">Plan vigente hoy</th>
                <th scope="col">Revisiones</th>
              </tr>
            </thead>
            <tbody>
              {d.nutrition.available ? (
                <FilaDeArea
                  titulo="Nutrición"
                  resumen={d.nutrition.summary}
                  objetivo={
                    d.nutrition.summary?.objective
                      ? `${cantidad(d.nutrition.summary.objective.estimatedEnergyRequirement.value, 'kcal por día')} (requerimiento energético estimado)`
                      : null
                  }
                  vigencias={disponibles.vigencias.nutricion}
                  enlaces={{ plan: ruta('nutrition', 'plan'), revisiones: ruta('nutrition', 'revisiones') }}
                />
              ) : null}
              {d.training.available ? (
                <FilaDeArea
                  titulo="Entrenamiento"
                  resumen={d.training.summary}
                  objetivo={d.training.summary?.objective ? d.training.summary.objective.statement || 'Objetivo sin enunciado' : null}
                  vigencias={disponibles.vigencias.entrenamiento}
                  enlaces={{ plan: ruta('training', 'plan'), revisiones: ruta('training', 'revisiones') }}
                />
              ) : null}
              {d.anthropometry.available ? (
                <tr>
                  <th scope="row">Antropometría</th>
                  {/* Antropometría no tiene objetivo ni plan en BE: lo que la representa es la última toma. */}
                  <td colSpan={2}>
                    {d.anthropometry.summary?.lastEvaluation ? (
                      <>
                        Última toma: {fecha(d.anthropometry.summary.lastEvaluation.occurredAt)} · {d.anthropometry.summary.lastEvaluation.author.displayName} ·{' '}
                        <button type="button" className="boton boton--enlace" onClick={() => ultimaToma && onAbrir({ type: 'ANTHROPOMETRIC_EVALUATION', id: ultimaToma }, 'Última toma')}>
                          Ver la toma
                        </button>
                      </>
                    ) : (
                      <span className="tenue">{COPY_VINCULO.sinDatosTodavia}</span>
                    )}
                    {' · '}
                    <span className="dato-secundario dato-secundario--en-linea">
                      {d.anthropometry.summary?.registeredEvaluations === 1 ? 'una toma en el período' : `${numero(d.anthropometry.summary?.registeredEvaluations ?? 0, 0)} tomas en el período`} ·{' '}
                      <Link href={ruta('anthropometry', 'evaluaciones')}>Abrir Antropometría</Link>
                    </span>
                  </td>
                  {/* Sin revisiones, lo nuevo se mira en el período elegido: lo dice cada observación de la síntesis. */}
                  <td>No tiene revisiones en BE</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FilaDeArea({
  titulo,
  resumen,
  objetivo,
  vigencias,
  enlaces,
}: {
  titulo: string;
  resumen: ResumenDeNutricion | ResumenDeEntrenamiento | null;
  objetivo: string | null;
  vigencias: readonly VigenciaDePlan[];
  enlaces: { plan: string; revisiones: string };
}) {
  const sinDato = <span className="tenue">{COPY_VINCULO.sinDatosTodavia}</span>;
  // Las versiones que rigieron en el período además de la vigente hoy (la vigente ya se dice arriba, con su fecha).
  const anteriores = rigieron(vigencias.filter((x) => x.planVersionId !== resumen?.activePlan?.planVersionId));
  const revision = resumen?.lastReview ?? null;
  if (!resumen) {
    return (
      <tr>
        <th scope="row">{titulo}</th>
        <td colSpan={3}>{sinDato}</td>
      </tr>
    );
  }
  return (
    <tr>
      <th scope="row">{titulo}</th>
      <td>
        {objetivo && resumen.objective ? (
          <>
            {objetivo}
            <span className="dato-secundario">
              Desde el {diaDe(resumen.objective.effectiveFrom)} · {resumen.objective.authoredBy.displayName}
            </span>
          </>
        ) : (
          sinDato
        )}
      </td>
      {/* Lo vigente hoy y lo que rigió antes en el período, en la misma celda: son dos preguntas distintas, dichas juntas. */}
      <td>
        {resumen.activePlan ? (
          <>
            {etiquetaDeVersion(resumen.activePlan.planVersionId, vigencias).replace(/^./, (c) => c.toUpperCase())}, desde el {diaDe(resumen.activePlan.activatedAt)} ·{' '}
            <Link href={enlaces.plan}>Ver la planificación</Link>
          </>
        ) : (
          <>Sin plan vigente hoy</>
        )}
        {anteriores ? <span className="dato-secundario">{resumen.activePlan ? 'Antes, en el período' : 'En el período'}: {anteriores}</span> : null}
        {!resumen.activePlan && !anteriores ? <span className="dato-secundario">Ninguna versión activada toca el período.</span> : null}
        {resumen.draftPlan ? (
          <span className="dato-secundario">
            Borrador del {diaDe(resumen.draftPlan.recordedAt)}: todavía no rige · <Link href={enlaces.plan}>Ir al borrador</Link>
          </span>
        ) : null}
      </td>
      <td>
        {revision ? (
          <>
            Última: {diaDe(revision.recordedAt)} · {revision.author.displayName} ·{' '}
            {revision.application ? (
              diaDe(revision.application.appliedAt) === diaDe(revision.recordedAt) ? 'aplicada' : `aplicada el ${diaDe(revision.application.appliedAt)}`
            ) : (
              <strong>registrada, sin aplicar</strong>
            )}{' '}
            · <Link href={enlaces.revisiones}>Ver revisiones</Link>
          </>
        ) : (
          <>Sin revisiones registradas: lo nuevo se mira en el período elegido.</>
        )}
        <span className="dato-secundario">Próxima acordada: {resumen.activePlan?.nextReviewAt ? diaCivil(resumen.activePlan.nextReviewAt) : 'sin fecha acordada'}</span>
      </td>
    </tr>
  );
}

// ─── 2 · Para tu próxima revisión ───────────────────────────────────────────────────────────────

function ParaTuProximaRevision({
  disponibles,
  delPeriodo,
  novedades,
  onReintentar,
  onAbrir,
}: {
  disponibles: Disponibles;
  delPeriodo: Lectura<LineaDeTiempoResponse>;
  novedades: Readonly<Record<'NUTRICION' | 'ENTRENAMIENTO', Novedades>>;
  onReintentar: () => void;
  onAbrir: (o: OrigenDeDato, titulo: string) => void;
}) {
  const { panel, periodo, parametros, asesoradoId, href } = useSeguimiento();
  const id = useId();
  const [todas, setTodas] = useState(false);
  const cargando = disponibles.cargando || delPeriodo.tipo === 'cargando' || novedades.NUTRICION.cargando || novedades.ENTRENAMIENTO.cargando;
  const observaciones = useMemo(() => {
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
  }, [panel, cargando, delPeriodo, disponibles, novedades, periodo]);

  const volver = valorDeRetorno(parametros);
  const enlaceDe = (a: AccionDelResumen): { href: string; texto: string } | null => {
    const area = (x: 'NUTRICION' | 'ENTRENAMIENTO') => (x === 'NUTRICION' ? 'nutrition' : 'training');
    switch (a.tipo) {
      case 'REVISIONES':
        return { href: conRetorno(`/pro/advisees/${area(a.area)}?id=${encodeURIComponent(asesoradoId)}&vista=revisiones`, volver), texto: 'Abrir las revisiones' };
      case 'PLANIFICACION':
        return { href: conRetorno(`/pro/advisees/${area(a.area)}?id=${encodeURIComponent(asesoradoId)}&vista=plan`, volver), texto: 'Ir a la planificación' };
      case 'LINEA_DE_TIEMPO':
        return { href: href({ vista: 'linea', areas: a.dominio, novedades: a.desde, tipos: null, estados: null, calidad: null, tardias: null, plan: null, ej: null }), texto: 'Ver en la línea de tiempo' };
      case 'ANTROPOMETRIA':
        return { href: conRetorno(`/pro/advisees/anthropometry?id=${encodeURIComponent(asesoradoId)}&vista=evaluaciones`, volver), texto: 'Abrir Antropometría' };
      case 'PREGUNTA':
        return { href: href({ vista: 'analizar', pregunta: a.pregunta, area: a.area }), texto: a.pregunta === 'informacion-para-revisar' ? 'Ver la información disponible' : 'Comparar etapas' };
      case 'TOMA':
        return null;
    }
  };

  const generadas = observaciones ?? [];
  const fallas = generadas.filter((o) => o.regla === 'PARTE_NO_DISPONIBLE');
  const hechos = generadas.filter((o) => o.regla !== 'PARTE_NO_DISPONIBLE');
  const visibles = todas ? hechos : hechos.slice(0, OBSERVACIONES_A_LA_VISTA);
  const consultado = disponibles.leidoEl;

  return (
    <section className="seccion para-tu-revision" aria-labelledby={`${id}-titulo`}>
      <div className="encabezado-de-bloque">
        <h2 id={`${id}-titulo`}>Para tu próxima revisión</h2>
        {hechos.length > OBSERVACIONES_A_LA_VISTA ? (
          <button type="button" className="boton boton--enlace" aria-expanded={todas} aria-controls={`${id}-lista`} onClick={() => setTodas(!todas)}>
            {todas ? 'Ver menos' : `Ver todas (${numero(hechos.length)})`}
          </button>
        ) : null}
      </div>
      {/* Una línea: el alcance y la hora de los datos, dichos una vez para todo el bloque. */}
      <p className="metadatos">
        Hechos por área, desde su última revisión o, si no tiene, en el período elegido
        {consultado ? ` (datos consultados a las ${horaEnZona(consultado, ZONA)})` : ''}.
      </p>
      {observaciones === null ? <Cargando /> : null}
      {observaciones !== null && hechos.length === 0 && fallas.length === 0 ? (
        <EstadoVacio titulo="Nada para preparar con tu acceso actual">No hay áreas disponibles o todavía no hay datos ni planificación.</EstadoVacio>
      ) : null}
      {/* Lo que falta va primero (GUIA II.7): debajo de la lista, la síntesis parecía completa al leerla de arriba abajo. */}
      {fallas.length > 0 ? (
        <div className="observaciones__fallas" role="status">
          {fallas.map((o) => (
            <p key={claveDeObservacion(o)} className="campo__error">
              {NOMBRE_DEL_AREA[o.area]}: {textoDeObservacion(o, FORMATO)}
            </p>
          ))}
          <button type="button" className="boton boton--secundario boton--compacto" onClick={onReintentar}>
            Reintentar
          </button>
        </div>
      ) : null}
      {visibles.length > 0 ? (
        <ol id={`${id}-lista`} className="observaciones">
          {visibles.map((o) => (
            <Observacion key={claveDeObservacion(o)} o={o} enlace={o.accion ? enlaceDe(o.accion) : null} onAbrir={onAbrir} />
          ))}
        </ol>
      ) : null}
      <Ayuda titulo="Cómo se arma esta lista">
        <p>
          Con reglas fijas, sin inteligencia artificial y sin calificar: primero lo pendiente (una revisión sin aplicar, la próxima revisión acordada dentro de una semana o pasada, un borrador sin
          activar), después los cambios de planificación o de comparabilidad, lo nuevo y, al final, la cobertura.
        </p>
        <p>
          «Desde la revisión» separa lo que ocurrió después, lo que se cargó después sobre días anteriores y lo que se corrigió después, con los instantes de registro de cada dato. Abrir la ficha
          no registra una revisión ni una nota.
        </p>
      </Ayuda>
    </section>
  );
}

function Observacion({ o, enlace, onAbrir }: { o: ObservacionDelResumen; enlace: { href: string; texto: string } | null; onAbrir: (o: OrigenDeDato, titulo: string) => void }) {
  return (
    <li className="observacion" data-regla={o.regla} data-prioridad={o.prioridad}>
      <p className="observacion__alcance">
        <strong>{NOMBRE_DEL_AREA[o.area]}</strong> · {textoDelAlcance(o.alcance, FORMATO)}
      </p>
      <p className="observacion__texto">{textoDeObservacion(o, FORMATO)}</p>
      <p className="observacion__pie">
        <span className="nota">Sale de {FUENTE_DE_LA_REGLA[o.regla]}.</span>{' '}
        {enlace ? (
          <Link href={enlace.href}>
            {enlace.texto}
            <span className="visualmente-oculto"> ({NOMBRE_DEL_AREA[o.area]})</span>
          </Link>
        ) : null}
        {o.accion?.tipo === 'TOMA' ? (
          <button type="button" className="boton boton--enlace" onClick={() => onAbrir({ type: 'ANTHROPOMETRIC_EVALUATION', id: (o.accion as { evaluationId: string }).evaluationId }, 'Última toma')}>
            Ver la toma
          </button>
        ) : null}
      </p>
    </li>
  );
}

// ─── 3 · Acciones ───────────────────────────────────────────────────────────────────────────────

function Acciones() {
  const { panel, asesoradoId, parametros, href } = useSeguimiento();
  const id = useId();
  if (panel.tipo !== 'listo') return null;
  const d = panel.datos.domains;
  const volver = valorDeRetorno(parametros);
  const conPlan = (e: typeof d.nutrition | typeof d.training) => e.available && e.summary?.activePlan;
  const areas = [...(conPlan(d.nutrition) ? (['NUTRICION'] as const) : []), ...(conPlan(d.training) ? (['ENTRENAMIENTO'] as const) : [])];
  const preparar = (area: 'NUTRICION' | 'ENTRENAMIENTO') => conRetorno(`/pro/advisees/${area === 'NUTRICION' ? 'nutrition' : 'training'}?id=${encodeURIComponent(asesoradoId)}&vista=revisiones&preparar=1`, volver);
  // Una pregunta prepara la vista desde cero: sin las métricas ni los parámetros de un análisis anterior. Con una sola
  // área con plan, el área ya viene elegida (se ve y se puede cambiar).
  const aLaPregunta = (pregunta: IdDePregunta) =>
    href({ vista: 'analizar', m: null, f: null, ...parametrosDePregunta({ id: pregunta, params: areas.length === 1 && areas[0] ? { area: areas[0] } : {} }) });
  return (
    <section className="seccion acciones-del-resumen" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Acciones</h2>
      <ul className="acciones-del-resumen__lista">
        {areas.map((area) => (
          <li key={area}>
            <Link className="boton boton--secundario" href={preparar(area)}>
              Preparar la revisión de {NOMBRE_DEL_AREA[area]}
            </Link>
            <p className="nota">Abre el formulario con el período desde la última revisión. No registra nada hasta que lo confirmes.</p>
          </li>
        ))}
        <li>
          <Link className="boton boton--secundario" href={aLaPregunta('cambio-desde-el-plan')}>
            Analizar un cambio
          </Link>
          <p className="nota">Desde que empezó un plan, con sus etapas e hitos.</p>
        </li>
        {/* «Solicitar contexto» está en el marco de la ficha, a la vista en las tres vistas (WP-ESCRITORIO-AMABLE). */}
      </ul>
      {/* La entrada por preguntas también desde el Resumen (eje 2). «Analizar un cambio» ya es la primera. */}
      <div className="subseccion preguntas-del-resumen">
        <h3 id={`${id}-preguntas`}>Empezar por una pregunta</h3>
        <ul className="preguntas-del-resumen__lista" aria-labelledby={`${id}-preguntas`}>
          {PREGUNTAS_PROFESIONALES.filter((p) => p.principal && p.id !== 'cambio-desde-el-plan').map((p) => (
            <li key={p.id}>
              <Link href={aLaPregunta(p.id)}>{p.pregunta}</Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href={href({ vista: 'analizar', m: null, f: null, ...parametrosDePregunta(null) })}>Más preguntas o análisis personalizado</Link>
        </p>
      </div>
    </section>
  );
}

// ─── 4 · Indicadores ────────────────────────────────────────────────────────────────────────────

/** Los indicadores por defecto, con lo que hay: energía registrada, registros, peso y las series del ejercicio más registrado. */
function indicadoresPorDefecto(d: Disponibles): ReferenciaDeMetrica[] {
  const sin = { exerciseKey: null, setIndex: null, unit: null };
  const lista: ReferenciaDeMetrica[] = [];
  if (d.nutricion) lista.push({ metricId: 'nutricion.energia', ...sin }, { metricId: 'nutricion.registros', ...sin });
  const peso = d.antropometria?.find((m) => m.metricCode === 'peso') ?? d.antropometria?.[0];
  if (peso) lista.push({ metricId: `antropometria.${peso.metricCode}`, ...sin });
  const ej = d.ejercicios?.[0];
  if (ej) lista.push({ metricId: 'entrenamiento.series-registradas', exerciseKey: ej.exerciseKey, setIndex: null, unit: null });
  return lista.slice(0, MAXIMO_DE_INDICADORES);
}

function IndicadoresDelResumen({ disponibles }: { disponibles: Disponibles }) {
  const { token, sesionPerdida } = useSeguimiento();
  const [guardada, setGuardada] = useState<Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null | undefined>(undefined);
  // Si no se pudo leer la elección guardada, se muestran los de por defecto y se dice: no es que se haya perdido.
  const [sinLeerLaEleccion, setSinLeerLaEleccion] = useState(false);
  const cargar = useCallback(async () => {
    const r = await api.listarVistasDeAnalisis(token);
    if (sesionPerdida(r)) return;
    setSinLeerLaEleccion(!r.ok);
    setGuardada(r.ok ? ((r.datos.data.find((v) => v.usage === 'SUMMARY_INDICATORS') as Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | undefined) ?? null) : null);
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const indicadores = guardada ? guardada.configuration.metrics : guardada === null ? indicadoresPorDefecto(disponibles) : [];
  return (
    <>
      {disponibles.falla ? <ErrorConReintento mensaje={textoDeFalla(disponibles.falla, 'qué datos hay en el período')} onReintentar={disponibles.recargar} /> : null}
      {sinLeerLaEleccion ? <p className="nota">No pudimos leer los indicadores que elegiste: se muestran los de por defecto. Tu elección sigue guardada.</p> : null}
      <Indicadores indicadores={indicadores} disponibles={disponibles} guardada={guardada ?? null} alGuardar={() => void cargar()} cargando={guardada === undefined || disponibles.cargando} />
    </>
  );
}

function Indicadores({
  indicadores,
  disponibles,
  guardada,
  alGuardar,
  cargando,
}: {
  indicadores: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  guardada: Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null;
  alGuardar: () => void;
  cargando: boolean;
}) {
  const id = useId();
  const { periodo, href } = useSeguimiento();
  const { series, recargar } = useSeriesDelAnalisis(cargando ? [] : indicadores, 'DAY');
  const [editando, setEditando] = useState(false);
  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <div className="encabezado-de-bloque">
        <h2 id={`${id}-titulo`}>Indicadores</h2>
        <button type="button" className="boton boton--secundario boton--compacto" aria-expanded={editando} onClick={() => setEditando(!editando)}>
          {editando ? 'Cerrar' : 'Elegir indicadores'}
        </button>
      </div>
      <p className="metadatos">
        Del {diaCivil(periodo.desde)} al {diaCivil(periodo.hasta)}. {guardada ? 'Los elegiste vos.' : 'Los de por defecto: podés elegir otros.'} Describen lo registrado, sin calificar.
      </p>
      {cargando ? <Cargando /> : null}
      <ul className="indicadores">
        {series.map((s) => {
          const nombre = nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios);
          return (
            <li key={s.clave} className="indicador">
              <h3>{nombre}</h3>
              {s.estado.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
              {s.estado.tipo === 'sin-acceso' ? <p className="nota">No disponible con tu acceso actual.</p> : null}
              {s.estado.tipo === 'error' ? (
                <p className="campo__error">
                  {textoDeFalla(s.estado.motivo, 'este indicador')}{' '}
                  <button type="button" className="boton boton--enlace" onClick={recargar}>
                    Reintentar<span className="visualmente-oculto"> {nombre}</span>
                  </button>
                </p>
              ) : null}
              {s.estado.tipo === 'lista' ? <ValorDelIndicador serie={s.estado.observaciones} definicion={s.definicion} desde={periodo.desde} hasta={periodo.hasta} /> : null}
              <Link className="boton boton--enlace" href={href({ vista: 'analizar', m: codificarReferencia(s.ref), modo: null, f: null, pregunta: null })}>
                Analizar<span className="visualmente-oculto"> {nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {!cargando && !disponibles.falla && series.length === 0 ? (
        <EstadoVacio titulo="Sin indicadores con datos en este período">Probá con un período más largo o elegí otros indicadores.</EstadoVacio>
      ) : null}
      {editando ? (
        <EditorDeIndicadores
          actuales={indicadores}
          disponibles={disponibles}
          guardada={guardada}
          alGuardar={() => {
            setEditando(false);
            alGuardar();
          }}
          alConflicto={alGuardar}
        />
      ) : null}
    </section>
  );
}

function ValorDelIndicador({ serie, definicion, desde, hasta }: { serie: Parameters<typeof resumirPeriodo>[0]; definicion: NonNullable<ReturnType<typeof definicionDeMetrica>>; desde: string; hasta: string }) {
  const r = resumirPeriodo(serie, definicion, desde, hasta, hoyEn());
  if (r.valor === null) return <p>{r.incompletos > 0 ? 'Solo hay datos de hoy, que sigue en curso: todavía no hay un día completo que resumir.' : 'Sin datos en el período.'}</p>;
  if (definicion.resumenDePeriodo === 'PRIMERO_Y_ULTIMO_COMPARABLES') {
    const ultimo = r.ultimo;
    const primero = r.primero;
    return (
      <>
        <p className="indicador__valor">{valorParaMostrar(r.valor, definicion, serie.unit)}</p>
        <p className="nota">Última toma: {ultimo ? diaCivil(ultimo.date) : '—'}</p>
        {primero && ultimo && primero.pointId !== ultimo.pointId && primero.value !== null ? (
          <p className="nota">
            Primera comparable del período: {valorParaMostrar(primero.value, definicion, serie.unit)} el {diaCivil(primero.date)} · diferencia {r.valor - primero.value > 0 ? '+' : ''}
            {numero(Number((r.valor - primero.value).toFixed(definicion.decimales)))} {serie.unit} ({numero(r.n)} tomas comparables)
          </p>
        ) : (
          <p className="nota">Una sola observación comparable: no hay con qué comparar.</p>
        )}
      </>
    );
  }
  // La cobertura que hace falta para leer el valor, dicha en el lugar (GUIA-UX-UI I.2) y con las mismas partes que la
  // tabla de etapas y «Comparar dos períodos»: en nutrición, los días del período por categoría; el día en curso aparte.
  const regla = definicion.resumenDePeriodo === 'MEDIA_DE_DIAS_CON_DATOS' ? 'Media' : definicion.resumenDePeriodo === 'MEDIANA' ? 'Mediana' : 'Total';
  const texto = `${regla} · ${partesDeLaCobertura(r).join(' · ')}`;
  return (
    <>
      <p className="indicador__valor">{valorParaMostrar(r.valor, definicion, serie.unit)}</p>
      <p className="nota">{texto}</p>
    </>
  );
}

function EditorDeIndicadores({
  actuales,
  disponibles,
  guardada,
  alGuardar,
  alConflicto,
}: {
  actuales: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  guardada: Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }> | null;
  alGuardar: () => void;
  /** Vuelve a leer la elección guardada sin cerrar el editor: lo marcado acá no se pierde. */
  alConflicto: () => void;
}) {
  const { token, sesionPerdida } = useSeguimiento();
  const id = useId();
  const candidatas = useMemo(() => {
    const sin = { exerciseKey: null, setIndex: null, unit: null };
    const lista: ReferenciaDeMetrica[] = [];
    if (disponibles.nutricion) for (const m of METRICAS_DEL_DICCIONARIO.filter((x) => x.area === 'NUTRICION' && x.implementada)) lista.push({ metricId: m.id, ...sin });
    for (const m of disponibles.antropometria ?? []) lista.push({ metricId: `antropometria.${m.metricCode}`, ...sin });
    for (const e of (disponibles.ejercicios ?? []).slice(0, 5)) lista.push({ metricId: 'entrenamiento.series-registradas', exerciseKey: e.exerciseKey, setIndex: null, unit: null });
    return lista;
  }, [disponibles]);
  const [elegidas, setElegidas] = useState<readonly ReferenciaDeMetrica[]>(actuales);
  const [error, setError] = useState<string | null>(null);
  const alternar = (r: ReferenciaDeMetrica) => {
    const clave = claveDeLaReferencia(r);
    setElegidas((e) => (e.some((x) => claveDeLaReferencia(x) === clave) ? e.filter((x) => claveDeLaReferencia(x) !== clave) : e.length >= MAXIMO_DE_INDICADORES ? e : [...e, r]));
  };
  const guardar = async () => {
    if (elegidas.length === 0) return setError('Elegí al menos uno.');
    const configuracion = { schemaVersion: 1 as const, metrics: [...elegidas] };
    const r = guardada
      ? await api.reemplazarVistaDeAnalisis(token, guardada.viewId, { expectedVersion: guardada.version, name: 'Indicadores del resumen', configuration: configuracion })
      : await api.crearVistaDeAnalisis(token, { usage: 'SUMMARY_INDICATORS', name: 'Indicadores del resumen', configuration: configuracion }, nuevaClaveDeIdempotencia());
    if (sesionPerdida(r)) return;
    // Un conflicto: la elección guardada cambió en otra pestaña. Se vuelve a leer (así el próximo «Guardar» parte de la
    // versión nueva) y lo marcado acá se conserva: guardar de nuevo es una decisión explícita. Antes el aviso decía «se
    // volvieron a leer» sin hacerlo, y cada intento volvía a chocar con la misma versión vieja.
    if (!r.ok && r.tipo === 'API' && (r.codigo === 'VERSION_CONFLICT' || r.codigo === 'RESOURCE_CONFLICT')) {
      alConflicto();
      return setError('Los indicadores cambiaron en otra pestaña. Tu elección sigue acá: si la guardás, reemplaza la que se guardó allá.');
    }
    if (!r.ok) return setError('No pudimos guardar los indicadores. Probá de nuevo.');
    alGuardar();
  };
  return (
    <fieldset className="capas editor-de-indicadores">
      <legend>Hasta {MAXIMO_DE_INDICADORES} indicadores (se guardan en tu cuenta y valen para todos tus asesorados)</legend>
      {candidatas.map((r) => {
        const clave = claveDeLaReferencia(r);
        const marcada = elegidas.some((x) => claveDeLaReferencia(x) === clave);
        return (
          <label key={clave} className="capa">
            <input type="checkbox" checked={marcada} disabled={!marcada && elegidas.length >= MAXIMO_DE_INDICADORES} onChange={() => alternar(r)} />
            {nombreDeLaReferencia(r, definicionDeMetrica(r.metricId, ''), disponibles.ejercicios)}
          </label>
        );
      })}
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => void guardar()}>
          Guardar indicadores
        </button>
        <span className="nota" id={`${id}-cuantos`}>
          {elegidas.length} de {MAXIMO_DE_INDICADORES}
        </span>
      </div>
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

// ─── 5 · Cobertura del período y últimos hechos ─────────────────────────────────────────────────

/**
 * Lo que pasó en el período: la cobertura por área —lo que se registró y lo que falta, con su denominador; nunca un
 * porcentaje global— y los últimos hechos, de la misma lectura de la línea de tiempo.
 */
function DelPeriodo({ disponibles, lectura, recargar }: { disponibles: Disponibles; lectura: Lectura<LineaDeTiempoResponse>; recargar: () => void }) {
  const { href, periodo } = useSeguimiento();
  const id = useId();
  const datos = lectura.tipo === 'listo' ? lectura.datos.data : null;
  // Si el plan empezó a regir dentro del período, se dice: los días anteriores no tenían dónde registrarse.
  const primerPlan = (vigencias: readonly VigenciaDePlan[]) => {
    const desde = primerPlanDelPeriodo(vigencias, periodo.desde);
    return desde ? ` · ${textoDelPrimerPlan(desde, FORMATO)}` : '';
  };
  const deTipo = (tipo: TipoDeEvento) => datos?.periodCounts.byEventType.find((x) => x.eventType === tipo)?.count ?? 0;
  const conCalidad = (calidad: CalidadDeEntrada) => datos?.periodCounts.byQuality.find((x) => x.quality === calidad)?.count ?? 0;
  const c = disponibles.coberturaNutricional;
  return (
    <div className="resumen__periodo">
      <section className="seccion" aria-labelledby={`${id}-cobertura`}>
        <h2 id={`${id}-cobertura`}>Qué se registró en el período</h2>
        <p className="metadatos">Cobertura del registro, no adherencia: qué hay y qué falta, sin calificar.</p>
        {lectura.tipo === 'cargando' || disponibles.cargando ? <Cargando /> : null}
        {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'lo registrado en el período')} onReintentar={recargar} /> : null}
        {lectura.tipo === 'no-disponible' ? <p>{COPY_VINCULO.recursoNoDisponible}</p> : null}
        <dl className="cobertura">
          {c ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.NUTRITION}</dt>
              <dd>
                {contar(c.daysWithRecords, 'día', 'días')} de {numero(c.daysInPeriod)} con algún registro · {contar(c.records, 'registro', 'registros')}: {numero(c.recordsWithQuantities)} con cantidades y {numero(c.recordsWithoutQuantities)} sin cantidades
                {c.differentMealsWithoutQuantities ? ` (${contar(c.differentMealsWithoutQuantities, 'comida diferente', 'comidas diferentes')})` : ''}
                {c.annulledExcluded ? ` · ${contar(c.annulledExcluded, 'anulado', 'anulados')} fuera de los totales` : ''}
                {c.rectifiedCountedOnce ? ` · ${contar(c.rectifiedCountedOnce, 'rectificado, contado', 'rectificados, contados')} una vez` : ''}
                {primerPlan(disponibles.vigencias.nutricion)}
              </dd>
            </div>
          ) : null}
          {datos?.sourceDomains.includes('TRAINING') ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.TRAINING}</dt>
              <dd>
                {contar(deTipo('TRAINING_SESSION_RECORDED'), 'sesión registrada', 'sesiones registradas')}
                {conCalidad('SESSION_WITH_DEVIATION') ? ` · ${numero(conCalidad('SESSION_WITH_DEVIATION'))} con cambios` : ''}
                {conCalidad('SESSION_NOT_COMPLETED') ? ` · ${contar(conCalidad('SESSION_NOT_COMPLETED'), 'registrada como no realizada', 'registradas como no realizadas')}` : ''}
                {conCalidad('SESSION_SUMMARY_ONLY') ? ` · ${contar(conCalidad('SESSION_SUMMARY_ONLY'), 'resumida, sin series', 'resumidas, sin series')}` : ''}. Sin calendario prescripto, no hay «sesiones esperadas».
                {primerPlan(disponibles.vigencias.entrenamiento).replace(/^ · /, ' ')}
              </dd>
            </div>
          ) : null}
          {datos?.sourceDomains.includes('ANTHROPOMETRY') ? (
            <div>
              <dt>{NOMBRE_DE_DOMINIO.ANTHROPOMETRY}</dt>
              <dd>{contar(deTipo('ANTHROPOMETRIC_EVALUATION_RECORDED'), 'toma registrada', 'tomas registradas')}</dd>
            </div>
          ) : null}
          {datos && datos.periodCounts.recordedLate > 0 ? (
            <div>
              <dt>Cargado otro día</dt>
              <dd>
                {datos.periodCounts.recordedLate === 1 ? 'Un hecho se registró un día posterior al que ocurrió' : `${numero(datos.periodCounts.recordedLate)} hechos se registraron un día posterior al que ocurrieron`} (carga
                tardía).
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      <section className="seccion" aria-labelledby={`${id}-recientes`}>
        <h2 id={`${id}-recientes`}>Lo último que pasó</h2>
        {datos ? (
          datos.entries.length === 0 ? (
            <p>No hay hechos registrados en este período.</p>
          ) : (
            <ul className="recientes">
              {datos.entries.map((e) => (
                <li key={e.timelineEntryId}>
                  <span className="nota">{diaCivil(e.occurredDate)}</span> · {NOMBRE_DE_DOMINIO[e.domain]} · {e.title}
                  {e.state === 'ANNULLED' ? ' (anulado)' : ''}
                  {e.recordedLate ? ' · carga tardía' : ''}
                </li>
              ))}
            </ul>
          )
        ) : null}
        <Link href={href({ vista: 'linea' })}>Ver todo en la línea de tiempo</Link>
      </section>
    </div>
  );
}

