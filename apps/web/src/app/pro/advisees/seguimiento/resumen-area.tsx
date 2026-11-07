'use client';

/**
 * Las tarjetas por área del Resumen (WP-ESCRITORIO-AMABLE, parte 3; C-03, C-05, C-26 y C-31). Antes, lo de un área
 * estaba repartido en tres bloques (una fila de la tabla de planificación, sus observaciones mezcladas con las de las
 * otras, y su botón en «Acciones»): ahora está junto, de arriba abajo, en el orden en que se piensa una revisión.
 * 1. **Con qué se trabaja:** el objetivo (en Nutrición, con sus calorías y sus macros) y el plan vigente, con lo que
 *    rigió antes en el período. En Antropometría, las tomas.
 * 2. **Lo pendiente,** con su ícono y en negrita: una revisión registrada sin aplicar, la próxima revisión acordada
 *    cuando falta una semana o menos (o ya pasó), un borrador sin activar.
 * 3. **Lo nuevo desde la última revisión del área** (o, si no tiene, en el período elegido): cada cuenta en su renglón,
 *    con la cifra adelante. La cobertura del período queda a un clic cuando hay revisión, porque los indicadores ya
 *    la dicen.
 * 4. **La acción:** preparar la revisión o una toma.
 *
 * Los hechos son las observaciones de `sintesisDelResumen` (dominio), con sus mismas palabras: acá solo se reparten por
 * área y se escriben en renglones (`partesDeObservacion`). Cada renglón es un enlace a su evidencia. Un área sin acceso
 * no tiene tarjeta, ni a medias. Una parte que no se pudo leer se dice primero, en su tarjeta.
 *
 * WP-TABLERO-ALTA-GAMA TB-10 (DL-163 D-1): en un área con plan, después de lo que no se pudo leer va **el tramo del
 * ciclo** (`tramo-del-ciclo.tsx`), que lleva la próxima revisión acordada; lo nuevo desde la revisión va **en cifras, en
 * fila**; y después, **la pieza propia** del área (`pieza-del-area.tsx`): la barra partida de los registros en Nutrición
 * y las sesiones por ejercicio en Entrenamiento. Un área sin nada registrado muestra **«Empezar el plan» en miniatura**.
 * Desde TB-24 (TA-20), la de Antropometría es la composición de la última toma (`ComposicionDeLaUltimaToma`), con la línea
 * de los pesos de las tomas cuando ninguna tiene un método que los parta. Desde TB-50, debajo, la evolución de las
 * últimas tomas en pares de medidas (`EvolucionDeLasTomasEnLaTarjeta`), de la misma lectura; desde TB-51, la barra va
 * en kilos con el porcentaje al lado.
 */
import {
  COPY_PISTAS,
  COPY_PRIMER_PLAN,
  claveDeObservacion,
  COPY_VINCULO,
  fechaCivil,
  NOMBRE_DEL_AREA,
  numero,
  partesDeObservacion,
  textoDeObservacion,
  textoDelAlcance,
  type AccionDelResumen,
  type AlcanceDeObservacion,
  type AreaDelResumen,
  type DashboardResponse,
  type FormatoDeLaSintesis,
  type NombreDeIcono,
  type ObservacionDelResumen,
  type ParteDeObservacion,
  type ReglaDelResumen,
  type ResumenDeEntrenamiento,
  type ResumenDeNutricion,
  type VigenciaDePlan,
} from '@be/domain';
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaDelAnioEnCurso, diaSinElAnioEnCurso } from '../../../../lib/formato';
import { tramoDelCiclo } from '../../../../lib/reloj';
import { useLectura, useSeguimiento } from './contexto';
import { conRetorno, hoyEn, restarDias, valorDeRetorno } from './estado';
import { ICONO_DEL_AREA } from './iconos-de-metrica';
import { DIAS_POR_LECTURA, METRICAS_DE_LA_COMPOSICION } from './composicion';
import { useLecturaDeLaComposicion } from './composicion-en-pantalla';
import { METRICAS_DE_LA_EVOLUCION } from './evolucion-de-las-tomas';
import { EvolucionDeLasTomasEnLaTarjeta } from './evolucion-de-las-tomas-en-pantalla';
import { CifrasDesdeLaRevision, ComposicionDeLaUltimaToma, PrimerPlanEnMiniatura, RegistrosDelPeriodo, SesionesPorEjercicio } from './pieza-del-area';
import { losRegistrosDelPeriodo, sesionesPorEjercicio } from './piezas-del-area';
import type { Disponibles } from './series';
import { TiraDelObjetivo, type MacrosDelObjetivo } from './tira-del-objetivo';
import { TramoDelCiclo } from './tramo-del-ciclo';
import { Pista } from '../../../../components/pista';

type AreaConPlan = 'NUTRICION' | 'ENTRENAMIENTO';
const RUTA_DEL_AREA: Readonly<Record<AreaDelResumen, string>> = { NUTRICION: 'nutrition', ENTRENAMIENTO: 'training', ANTROPOMETRIA: 'anthropometry' };

/** El ícono de un hecho que no es una cuenta: lo pendiente y los cambios se reconocen por su forma, no por un color. */
const ICONO_DE_LA_REGLA: Readonly<Partial<Record<ReglaDelResumen, NombreDeIcono>>> = {
  REVISION_SIN_APLICAR: 'revision',
  PROXIMA_REVISION: 'reloj',
  BORRADOR_SIN_ACTIVAR: 'borrador',
  PLAN_ACTIVADO_DESPUES_DEL_CORTE: 'activar',
  OBJETIVO_NUEVO_DESPUES_DEL_CORTE: 'objetivo',
  CAMBIO_DE_COMPARABILIDAD: 'protocolo',
};

export interface PropsDeLasAreas {
  readonly disponibles: Disponibles;
  /** Las observaciones de la síntesis, de todas las áreas; `null` mientras se leen. */
  readonly observaciones: readonly ObservacionDelResumen[] | null;
  readonly formato: FormatoDeLaSintesis;
  readonly macros: MacrosDelObjetivo;
  readonly onReintentarMacros: () => void;
  readonly onAbrirToma: (evaluationId: string) => void;
}

/** El área con plan vigente cuya próxima revisión acordada es la más cercana: la única con el botón lleno (C-26). */
export function areaDeLaProximaRevision(d: DashboardResponse['data']['domains']): AreaConPlan | null {
  const candidatas = (
    [
      ['NUTRICION', d.nutrition],
      ['ENTRENAMIENTO', d.training],
    ] as const
  ).flatMap(([area, e]) => (e.available && e.summary?.activePlan?.nextReviewAt ? [{ area, fecha: e.summary.activePlan.nextReviewAt }] : []));
  // Con la misma fecha queda la primera en el orden de BE: Nutrición.
  return [...candidatas].sort((a, b) => a.fecha.localeCompare(b.fecha))[0]?.area ?? null;
}

/** Una tarjeta por área disponible, en el orden de todo BE: Nutrición, Entrenamiento y Antropometría. */
export function TarjetasDeArea(p: PropsDeLasAreas) {
  const { panel, asesoradoId, parametros, href } = useSeguimiento();
  if (panel.tipo !== 'listo') return null;
  const d = panel.datos.domains;
  const volver = valorDeRetorno(parametros);
  const ruta = (area: AreaDelResumen, vista?: string, extra = '') => conRetorno(`/pro/advisees/${RUTA_DEL_AREA[area]}?id=${encodeURIComponent(asesoradoId)}${vista ? `&vista=${vista}` : ''}${extra}`, volver);
  const enlaceDe = (a: AccionDelResumen): { href: string; texto: string } | null => {
    switch (a.tipo) {
      case 'REVISIONES':
        return { href: ruta(a.area, 'revisiones'), texto: 'Abrir las revisiones' };
      case 'PLANIFICACION':
        return { href: ruta(a.area, 'plan'), texto: 'Ir a la planificación' };
      case 'LINEA_DE_TIEMPO':
        return { href: href({ vista: 'linea', areas: a.dominio, novedades: a.desde, tipos: null, estados: null, calidad: null, tardias: null, plan: null, ej: null }), texto: 'Ver en la línea de tiempo' };
      case 'ANTROPOMETRIA':
        return { href: ruta('ANTROPOMETRIA', 'evaluaciones'), texto: 'Abrir Antropometría' };
      case 'PREGUNTA':
        return { href: href({ vista: 'analizar', pregunta: a.pregunta, area: a.area }), texto: a.pregunta === 'informacion-para-revisar' ? 'Ver la información disponible' : 'Comparar etapas' };
      case 'TOMA':
        return null;
    }
  };
  const llena = areaDeLaProximaRevision(d);
  const hoy = hoyEn();
  /**
   * La próxima revisión acordada está siempre en la tarjeta, una sola vez (TB-10): en el tramo del ciclo, que dice la
   * fecha y cuánto falta o cuánto venció. Con el tramo dibujado, el pendiente «Próxima revisión» del dominio no se repite
   * debajo. Sin tramo (sin fecha, o con la revisión de esa fecha ya registrada), los pendientes quedan como los arma el
   * dominio.
   */
  const conReloj = (resumen: ResumenDeNutricion | ResumenDeEntrenamiento): boolean => tramoDelCiclo(resumen, hoy)?.tipo === 'RELOJ';
  // A13 de la propuesta: con dos o más tarjetas en fila, la pieza propia va plegada, con lo que se ve de un vistazo en el
  // renglón que la abre; así la tarjeta no pasa su tope y los indicadores entran en la primera pantalla. Con una sola
  // área, la tarjeta va al costado de los indicadores y la pieza queda abierta.
  const plegada = [d.nutrition.available, d.training.available, d.anthropometry.available].filter(Boolean).length >= 2;
  const delArea = (area: AreaDelResumen) => (p.observaciones === null ? null : p.observaciones.filter((o) => o.area === area));
  const comunes = { formato: p.formato, enlaceDe };
  const c = p.disponibles.coberturaNutricional;
  const ultimaToma = d.anthropometry.available ? (d.anthropometry.summary?.lastEvaluation?.occurredAt ?? null) : null;
  return (
    <>
      {d.nutrition.available ? (
        <Tarjeta area="NUTRICION" abrir={ruta('NUTRICION')}>
          {d.nutrition.summary ? (
            <>
              <dl className="area__contexto">
                <div>
                  <dt>
                    <Icono nombre="objetivo" tamano={18} />
                    Objetivo
                  </dt>
                  <dd>{d.nutrition.summary.objective ? <span className="tenue">por día · desde el {p.formato.dia(d.nutrition.summary.objective.effectiveFrom)}</span> : <span className="tenue">{COPY_VINCULO.sinDatosTodavia}</span>}</dd>
                </div>
                {/* Los cuatro números del objetivo, en su propio renglón y de lado a lado de la tarjeta. */}
                {d.nutrition.summary.objective ? (
                  <div className="area__tira">
                    <dt className="visualmente-oculto">Objetivo del día, en números</dt>
                    <dd>
                      <TiraDelObjetivo calorias={d.nutrition.summary.objective.estimatedEnergyRequirement.value} macros={p.macros} onReintentar={p.onReintentarMacros} />
                    </dd>
                  </div>
                ) : null}
                <FilaDelPlan area="NUTRICION" resumen={d.nutrition.summary} vigencias={p.disponibles.vigencias.nutricion} href={ruta('NUTRICION', 'plan')} formato={p.formato} />
              </dl>
              <Hechos
                area="NUTRICION"
                observaciones={delArea('NUTRICION')}
                revision={d.nutrition.summary.lastReview}
                revisiones={ruta('NUTRICION', 'revisiones')}
                tramo={<TramoDelCiclo area="NUTRICION" resumen={d.nutrition.summary} hoy={hoy} fecha={p.formato.fecha} revisiones={ruta('NUTRICION', 'revisiones')} />}
                sinLaProxima={conReloj(d.nutrition.summary)}
                pieza={(periodo) => <RegistrosDelPeriodo cobertura={c} plegada={plegada}>{periodo}</RegistrosDelPeriodo>}
                absorbeElPeriodo={plegada && losRegistrosDelPeriodo(c) !== null}
                // Lo que la cobertura del área dice además de su frase. Los anulados y los rectificados están en la barra
                // partida de los registros del período (TB-10), a la vista.
                detallesDeLaCobertura={
                  c?.differentMealsWithoutQuantities ? [cuenta(c.differentMealsWithoutQuantities, 'comida diferente, entre los registros sin cantidades', 'comidas diferentes, entre los registros sin cantidades')] : []
                }
                {...comunes}
              />
              <AccionDeRevisar area="NUTRICION" resumen={d.nutrition.summary} href={ruta('NUTRICION', 'revisiones', '&preparar=1')} llena={llena === 'NUTRICION'} />
            </>
          ) : (
            <EmpezarElPlan area="NUTRICION" href={ruta('NUTRICION', 'plan')} />
          )}
        </Tarjeta>
      ) : null}
      {d.training.available ? (
        <Tarjeta area="ENTRENAMIENTO" abrir={ruta('ENTRENAMIENTO')}>
          {d.training.summary ? (
            <>
              <dl className="area__contexto">
                <div>
                  <dt>
                    <Icono nombre="objetivo" tamano={18} />
                    Objetivo
                  </dt>
                  <dd>
                    {d.training.summary.objective ? (
                      <>
                        {/* Un enunciado largo no empuja lo demás fuera de la pantalla: tres renglones a la vista; entero, al abrir el área. */}
                        <span className="area__enunciado">{d.training.summary.objective.statement || 'Objetivo sin enunciado'}</span>
                        <span className="tenue area__desde">desde el {p.formato.dia(d.training.summary.objective.effectiveFrom)}</span>
                      </>
                    ) : (
                      <span className="tenue">{COPY_VINCULO.sinDatosTodavia}</span>
                    )}
                  </dd>
                </div>
                <FilaDelPlan area="ENTRENAMIENTO" resumen={d.training.summary} vigencias={p.disponibles.vigencias.entrenamiento} href={ruta('ENTRENAMIENTO', 'plan')} formato={p.formato} />
              </dl>
              <Hechos
                area="ENTRENAMIENTO"
                observaciones={delArea('ENTRENAMIENTO')}
                revision={d.training.summary.lastReview}
                revisiones={ruta('ENTRENAMIENTO', 'revisiones')}
                tramo={<TramoDelCiclo area="ENTRENAMIENTO" resumen={d.training.summary} hoy={hoy} fecha={p.formato.fecha} revisiones={ruta('ENTRENAMIENTO', 'revisiones')} />}
                sinLaProxima={conReloj(d.training.summary)}
                pieza={(periodo) => (
                  <SesionesPorEjercicio ejercicios={p.disponibles.ejercicios} fecha={p.formato.fecha} plegada={plegada}>
                    {periodo}
                  </SesionesPorEjercicio>
                )}
                absorbeElPeriodo={plegada && sesionesPorEjercicio(p.disponibles.ejercicios) !== null}
                detallesDeLaCobertura={[]}
                {...comunes}
              />
              <AccionDeRevisar area="ENTRENAMIENTO" resumen={d.training.summary} href={ruta('ENTRENAMIENTO', 'revisiones', '&preparar=1')} llena={llena === 'ENTRENAMIENTO'} />
            </>
          ) : (
            <EmpezarElPlan area="ENTRENAMIENTO" href={ruta('ENTRENAMIENTO', 'plan')} />
          )}
        </Tarjeta>
      ) : null}
      {d.anthropometry.available ? (
        <Tarjeta area="ANTROPOMETRIA" abrir={ruta('ANTROPOMETRIA', 'evaluaciones')}>
          {d.anthropometry.summary ? (
            <dl className="area__contexto">
              <div>
                <dt>
                  <Icono nombre="perimetro" tamano={18} />
                  Tomas
                </dt>
                <dd>
                  {d.anthropometry.summary.registeredEvaluations === 0 ? 'Ninguna en el período' : d.anthropometry.summary.registeredEvaluations === 1 ? 'Una en el período' : `${numero(d.anthropometry.summary.registeredEvaluations, 0)} en el período`}
                  {d.anthropometry.summary.lastEvaluation ? (
                    <>
                      <span className="tenue"> · </span>
                      {/* La última toma es lo que se toca para abrirla: su fecha a la vista; «Ver la toma», para el lector de pantalla. */}
                      <button type="button" className="boton boton--enlace" onClick={() => d.anthropometry.available && d.anthropometry.summary?.lastEvaluation && p.onAbrirToma(d.anthropometry.summary.lastEvaluation.evaluationId)}>
                        <span className="visualmente-oculto">Ver la toma: </span>la última, el {p.formato.dia(d.anthropometry.summary.lastEvaluation.occurredAt)}
                      </button>
                    </>
                  ) : null}
                </dd>
              </div>
              {/* Antropometría no tiene objetivo, plan ni revisiones en BE: lo nuevo se mira en el período elegido. */}
              <div>
                <dt>
                  <Icono nombre="revision" tamano={18} />
                  Revisiones
                </dt>
                <dd>No tiene revisiones en BE</dd>
              </div>
            </dl>
          ) : (
            <p className="tenue area__sin-datos">{COPY_VINCULO.sinDatosTodavia}</p>
          )}
          <Hechos
            area="ANTROPOMETRIA"
            observaciones={delArea('ANTROPOMETRIA')}
            revision={null}
            revisiones={null}
            // TB-24 (TA-20): la composición de la última toma o, sin método, la línea de los pesos.
            pieza={() => <PiezaDeAntropometria ultimaToma={ultimaToma} plegada={plegada} href={ruta('ANTROPOMETRIA', 'composicion')} hrefDeLaEvolucion={ruta('ANTROPOMETRIA', 'evolucion')} />}
            detallesDeLaCobertura={[]}
            {...comunes}
          />
          <div className="area__accion">
            {/* Abre la toma en preparación: no guarda ni registra nada hasta que se confirme allá. */}
            <Link className="boton boton--secundario" href={ruta('ANTROPOMETRIA', 'preparacion')}>
              <Icono nombre="mas" tamano={20} />
              Preparar una toma
            </Link>
          </div>
        </Tarjeta>
      ) : null}
    </>
  );
}

const cuenta = (n: number, uno: string, varios: string): ParteDeObservacion => ({ cifra: numero(n), texto: n === 1 ? uno : varios });

/**
 * La pieza de Antropometría (TB-24; TA-20 y TA-26): lee API-ANT-06 en la ventana de 92 días que termina en la última
 * toma, con el peso y las masas, para la barra de esa toma y lo que cambió desde la anterior. Una lectura más al abrir el
 * Resumen, solo con Antropometría y alguna toma. TB-50 (TA-73): la misma lectura suma las medidas de los pares, para la
 * evolución de las últimas tomas: ninguna petición nueva.
 */
function PiezaDeAntropometria({ ultimaToma, plegada, href, hrefDeLaEvolucion }: { ultimaToma: string | null; plegada: boolean; href: string; hrefDeLaEvolucion: string }) {
  const { token, asesoradoId, sesionPerdida } = useSeguimiento();
  const hasta = ultimaToma ? fechaCivil(ultimaToma, ZONA_DE_LA_FICHA) : null;
  const desde = hasta ? restarDias(hasta, DIAS_POR_LECTURA - 1) : null;
  const { lectura, recargar } = useLecturaDeLaComposicion(token, asesoradoId, desde, hasta, sesionPerdida, METRICAS_DE_LA_TARJETA);
  if (!desde || !hasta) return null;
  const hoy = hoyEn();
  return (
    <>
      <ComposicionDeLaUltimaToma lectura={lectura} recargar={recargar} desde={desde} hasta={hasta} fecha={(c) => diaDelAnioEnCurso(c, hoy)} href={href} plegada={plegada} />
      {lectura.tipo === 'lista' ? <EvolucionDeLasTomasEnLaTarjeta tomas={lectura.tomas} plegada={plegada} href={hrefDeLaEvolucion} /> : null}
    </>
  );
}
/** Lo que pide la tarjeta de Antropometría en su única lectura: el peso y las masas, y las medidas de los pares (TB-50). */
const METRICAS_DE_LA_TARJETA: readonly string[] = [...new Set([...METRICAS_DE_LA_COMPOSICION, ...METRICAS_DE_LA_EVOLUCION])];
const ZONA_DE_LA_FICHA = 'America/Argentina/Buenos_Aires';

/**
 * Un área todavía sin nada registrado (ni objetivo, ni plan, ni registros): lo que hay que hacer es empezar el plan. Desde
 * TB-10, los tres pasos en miniatura (R-8), con el que toca a la vista; el botón lleva al Plan del área, donde están los
 * formularios (DL-145). Para saber si ya hay una evaluación, una lectura más por área sin plan (A15 de la propuesta). Si
 * esa lectura falla, quedan las palabras de antes y el botón.
 */
function EmpezarElPlan({ area, href }: { area: 'NUTRICION' | 'ENTRENAMIENTO'; href: string }) {
  const { token, asesoradoId } = useSeguimiento();
  const { lectura } = useLectura<{ readonly data: readonly { readonly occurredAt: string }[] }>(
    `evaluaciones|${area}|${asesoradoId}`,
    () => (area === 'NUTRICION' ? api.listarEvaluaciones(token, asesoradoId) : api.listarEvaluacionesDeEntrenamiento(token, asesoradoId)),
    area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING',
  );
  if (lectura.tipo === 'error' || lectura.tipo === 'no-disponible') {
    return (
      <div className="area__sin-datos">
        <p className="tenue">{COPY_VINCULO.sinDatosTodavia}</p>
        <Link className="boton boton--secundario" href={href}>
          <Icono nombre="plan" tamano={18} />
          {COPY_PRIMER_PLAN.titulo}
        </Link>
      </div>
    );
  }
  const ultima = lectura.tipo === 'listo' ? ([...lectura.datos.data].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null) : undefined;
  return <PrimerPlanEnMiniatura evaluacion={ultima === undefined ? null : ultima ? diaSinElAnioEnCurso(ultima.occurredAt) : false} href={href} />;
}

function Tarjeta({ area, abrir, children }: { area: AreaDelResumen; abrir: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="area" data-area={area} aria-labelledby={`${id}-titulo`}>
      <header className="area__cabecera">
        <h2 id={`${id}-titulo`}>
          <Icono nombre={ICONO_DEL_AREA[area]} tamano={24} />
          {NOMBRE_DEL_AREA[area]}
        </h2>
        <Link className="area__abrir" href={abrir}>
          Abrir {NOMBRE_DEL_AREA[area]}
          <Icono nombre="abrir" tamano={18} />
        </Link>
      </header>
      {children}
    </section>
  );
}

/**
 * «v1 (del 18 jul al 3 sept) · v2 (desde el 4 sept)»: lo que rigió en el período, sin solapar el día del corte. Una
 * versión reemplazada el mismo día en que se activó rigió unas horas: no se escribe «del 4 sept al 3 sept».
 */
function rigieron(vigencias: readonly VigenciaDePlan[], fecha: (f: string) => string): string | null {
  if (vigencias.length === 0) return null;
  return [...vigencias]
    .sort((a, b) => a.activatedAt.localeCompare(b.activatedAt))
    .map((v) => (v.to === null ? `${v.label} (desde el ${fecha(v.from)})` : v.to <= v.from ? `${v.label} (unas horas del ${fecha(v.from)})` : `${v.label} (del ${fecha(v.from)} al ${fecha(restarDias(v.to, 1))})`))
    .join(' · ');
}

/** El plan vigente hoy, con su versión y su fecha, y lo que rigió antes en el período: dos preguntas distintas, juntas. */
function FilaDelPlan({ area, resumen, vigencias, href, formato }: { area: AreaConPlan; resumen: ResumenDeNutricion | ResumenDeEntrenamiento; vigencias: readonly VigenciaDePlan[]; href: string; formato: FormatoDeLaSintesis }) {
  const vigente = resumen.activePlan;
  const etiqueta = vigente ? vigencias.find((x) => x.planVersionId === vigente.planVersionId)?.label : undefined;
  // Las versiones que rigieron en el período además de la vigente hoy (la vigente ya se dice, con su fecha).
  const anteriores = rigieron(vigencias.filter((x) => x.planVersionId !== vigente?.planVersionId), formato.fecha);
  return (
    <div>
      <dt>
        <Icono nombre="plan" tamano={18} />
        Plan
      </dt>
      <dd>
        {vigente ? (
          <>
            <Link href={href}>
              {etiqueta ? `Versión ${etiqueta.replace(/^v/, '')}` : 'Versión vigente'}
              <span className="visualmente-oculto"> · ver la planificación de {NOMBRE_DEL_AREA[area]}</span>
            </Link>
            <span className="tenue"> · desde el {formato.dia(vigente.activatedAt)}</span>
          </>
        ) : (
          <>Sin plan vigente hoy</>
        )}
        {anteriores ? (
          <span className="tenue">
            {' '}
            · {vigente ? 'antes, en el período' : 'en el período'}: {anteriores}
          </span>
        ) : null}
        {!vigente && !anteriores ? <span className="tenue"> · ninguna versión activada toca el período</span> : null}
      </dd>
    </div>
  );
}

/**
 * Los hechos de un área, por alcance: primero lo que no se pudo leer, después lo pendiente (hoy), lo nuevo desde la
 * última revisión y lo del período. Cada grupo dice su alcance con las palabras del dominio; lo pendiente es de hoy y lo
 * lleva escrito para el lector de pantalla. Lo que no se pudo leer no lleva un «Reintentar» propio: es la misma operación
 * en las tres tarjetas, y se reintenta una vez, arriba de ellas («Reintentar lo que faltó», bloque 5).
 */
function Hechos({
  area,
  observaciones,
  revision,
  revisiones,
  tramo = null,
  sinLaProxima = false,
  pieza = null,
  absorbeElPeriodo = false,
  detallesDeLaCobertura,
  formato,
  enlaceDe,
}: {
  area: AreaDelResumen;
  observaciones: readonly ObservacionDelResumen[] | null;
  /** La última revisión del área: su corte. `null` si no tiene (o si el área no tiene revisiones en BE). */
  revision: ResumenDeNutricion['lastReview'];
  /** A dónde se abren las revisiones del área; `null` si no tiene. */
  revisiones: string | null;
  /** El tramo del ciclo (TB-10): va primero, después de lo que no se pudo leer. */
  tramo?: ReactNode;
  /** Con el tramo dibujado, la próxima revisión ya está en él: el pendiente del dominio no se repite. */
  sinLaProxima?: boolean;
  /**
   * La pieza propia del área (TB-10): después de lo nuevo desde la revisión. Recibe los renglones del período, para
   * llevarlos adentro cuando va plegada (`absorbeElPeriodo`): la tarjeta tiene un solo plegado.
   */
  pieza?: ((periodo: ReactNode) => ReactNode) | null;
  absorbeElPeriodo?: boolean;
  detallesDeLaCobertura: readonly ParteDeObservacion[];
  formato: FormatoDeLaSintesis;
  enlaceDe: (a: AccionDelResumen) => { href: string; texto: string } | null;
}) {
  if (observaciones === null) return <Cargando />;
  const fallas = observaciones.filter((o) => o.regla === 'PARTE_NO_DISPONIBLE');
  // La última toma ya está en el contexto de la tarjeta («Tomas»), con el botón que la abre: no se repite como hecho.
  const hechos = observaciones.filter((o) => o.regla !== 'PARTE_NO_DISPONIBLE' && o.regla !== 'ULTIMA_TOMA' && !(sinLaProxima && o.regla === 'PROXIMA_REVISION'));
  const de = (tipo: AlcanceDeObservacion['tipo']) => hechos.filter((o) => o.alcance.tipo === tipo);
  const pendientes = de('HOY');
  // Lo nuevo desde el corte va en cifras, en fila (TB-10, R-3); los demás hechos desde la revisión, en renglones.
  const novedades = de('DESDE_LA_REVISION').find((o) => o.regla === 'NOVEDADES_DESDE_EL_CORTE') ?? null;
  const desdeLaRevision = de('DESDE_LA_REVISION').filter((o) => o !== novedades);
  const enlaceDeLasNovedades = novedades?.accion ? enlaceDe(novedades.accion) : null;
  const delPeriodo = de('PERIODO');
  const fila = (o: ObservacionDelResumen) => (
    <Hecho key={claveDeObservacion(o)} o={o} formato={formato} enlace={o.accion ? enlaceDe(o.accion) : null} detalles={o.regla === 'COBERTURA_NUTRICIONAL' || o.regla === 'COBERTURA_DE_ENTRENAMIENTO' ? detallesDeLaCobertura : []} />
  );
  const aplicacion = revision?.application ? (formato.dia(revision.application.appliedAt) === formato.dia(revision.recordedAt) ? 'aplicada' : `aplicada el ${formato.dia(revision.application.appliedAt)}`) : null;
  const elPeriodo = delPeriodo[0] ? textoDelAlcance(delPeriodo[0].alcance, formato) : null;
  return (
    <div className="area__hechos">
      {/* Lo que falta va primero (GUIA II.7): debajo de la lista, la tarjeta parecía completa al leerla de arriba abajo. */}
      {fallas.length > 0 ? (
        <div className="observaciones__fallas" role="status">
          <BloqueDeEstado tipo="error" icono="aviso">
            {fallas.map((o) => (
              <span key={claveDeObservacion(o)} className="observaciones__falla" data-regla={o.regla}>
                {textoDeObservacion(o, formato)}
              </span>
            ))}
          </BloqueDeEstado>
        </div>
      ) : null}
      {tramo}
      {pendientes.length > 0 ? <ul className="observaciones observaciones--pendientes">{pendientes.map(fila)}</ul> : null}
      {revision ? (
        <>
          <p className="area__corte">
            <span>
              <strong>
                Desde la{' '}
                {revisiones ? (
                  <Link href={revisiones}>
                    revisión del {formato.dia(revision.recordedAt)}
                    <span className="visualmente-oculto"> · ver las revisiones de {NOMBRE_DEL_AREA[area]}</span>
                  </Link>
                ) : (
                  `revisión del ${formato.dia(revision.recordedAt)}`
                )}
              </strong>
              {aplicacion ? <span className="tenue"> · {aplicacion}</span> : null}
            </span>
          </p>
          {novedades ? <CifrasDesdeLaRevision partes={partesDeObservacion(novedades, formato)} href={enlaceDeLasNovedades?.href ?? null} texto={enlaceDeLasNovedades?.texto ?? ''} /> : null}
          {desdeLaRevision.length > 0 ? <ul className="observaciones">{desdeLaRevision.map(fila)}</ul> : null}
          {pieza ? pieza(absorbeElPeriodo && delPeriodo.length > 0 ? <ul className="observaciones">{delPeriodo.map(fila)}</ul> : null) : null}
          {/* Con revisión, lo del período queda a un clic: los indicadores ya dicen la cobertura de cada número. */}
          {delPeriodo.length > 0 && !absorbeElPeriodo ? (
            <details className="area__periodo">
              <summary>
                {elPeriodo}: cobertura del registro ({numero(delPeriodo.length)})
              </summary>
              <ul className="observaciones">{delPeriodo.map(fila)}</ul>
            </details>
          ) : null}
        </>
      ) : delPeriodo.length > 0 ? (
        <>
          <p className="area__corte">
            <span>
              <strong>{elPeriodo}</strong>
              {revisiones ? <span className="tenue"> · sin revisiones registradas</span> : null}
            </span>
          </p>
          <ul className="observaciones">{delPeriodo.map(fila)}</ul>
          {pieza ? pieza(null) : null}
        </>
      ) : revisiones ? (
        // Sin revisión y sin nada del período que decir (su lectura no aplica o falló): igual se dice dónde está parada.
        <>
          <p className="area__corte">
            <span className="tenue">Sin revisiones registradas</span>
          </p>
          {pieza ? pieza(null) : null}
        </>
      ) : pieza ? (
        pieza(null)
      ) : null}
    </div>
  );
}

/** Un hecho: un renglón entero que abre su evidencia. Las cuentas van una por renglón, con la cifra adelante. */
function Hecho({ o, formato, enlace, detalles }: { o: ObservacionDelResumen; formato: FormatoDeLaSintesis; enlace: { href: string; texto: string } | null; detalles: readonly ParteDeObservacion[] }) {
  const icono = ICONO_DE_LA_REGLA[o.regla];
  const parte = (p: ParteDeObservacion, clave: string, clase = '') => (
    <span key={clave} className={`${p.cifra === null ? 'observacion__frase' : 'observacion__cuenta'}${clase}`}>
      {p.cifra !== null ? (
        <>
          <strong className="cifra">{p.cifra}</strong>{' '}
        </>
      ) : null}
      {p.texto}
    </span>
  );
  const contenido = (
    <>
      {icono ? <Icono nombre={icono} tamano={20} /> : null}
      <span className="observacion__cuerpo">
        {/* El alcance de cada hecho, para quien no ve bajo qué título está: «Nutrición · Hoy». */}
        <span className="observacion__alcance visualmente-oculto">
          {NOMBRE_DEL_AREA[o.area]} · {textoDelAlcance(o.alcance, formato)}:{' '}
        </span>
        <span className="observacion__texto">{partesDeObservacion(o, formato).map((p, i) => parte(p, `p${i}`))}</span>
        {detalles.length > 0 ? <span className="observacion__detalles">{detalles.map((p, i) => parte(p, `d${i}`, ' observacion__detalle'))}</span> : null}
      </span>
      {enlace ? (
        <>
          <span className="visualmente-oculto"> · {enlace.texto}</span>
          <Icono nombre="derecha" tamano={18} />
        </>
      ) : null}
    </>
  );
  return (
    <li className="observacion" data-regla={o.regla} data-prioridad={o.prioridad}>
      {enlace ? (
        <Link className="observacion__fila" href={enlace.href}>
          {contenido}
        </Link>
      ) : (
        <div className="observacion__fila">{contenido}</div>
      )}
    </li>
  );
}

/**
 * La acción del área: preparar su revisión. Solo con un plan vigente (sin plan no hay qué revisar). El botón lleno es
 * uno solo en todo el Resumen: el del área con la próxima revisión acordada más cercana. La fecha la fijó el profesional;
 * BE no decide qué es urgente. Esa fecha está siempre en la tarjeta: como pendiente, o junto al corte.
 */
function AccionDeRevisar({ area, resumen, href, llena }: { area: AreaConPlan; resumen: ResumenDeNutricion | ResumenDeEntrenamiento; href: string; llena: boolean }) {
  if (!resumen.activePlan) return null;
  return (
    <div className="area__accion">
      <Pista texto={COPY_PISTAS.revision.preparar}>
        <Link className={llena ? 'boton boton--primario' : 'boton boton--secundario'} href={href}>
          <Icono nombre="revision" tamano={20} />
          Preparar la revisión de {NOMBRE_DEL_AREA[area]}
        </Link>
      </Pista>
    </div>
  );
}
