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
 */
import {
  claveDeObservacion,
  COPY_VINCULO,
  DIAS_DE_ANTICIPACION_DE_LA_REVISION,
  diasEntreFechas,
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
import { useSeguimiento } from './contexto';
import { conRetorno, hoyEn, restarDias, valorDeRetorno } from './estado';
import { ICONO_DEL_AREA } from './iconos-de-metrica';
import type { Disponibles } from './series';
import { TiraDelObjetivo, type MacrosDelObjetivo } from './tira-del-objetivo';

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
  /** Vuelve a leer todo lo que la síntesis no pudo completar. */
  readonly onReintentar: () => void;
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
   * La próxima revisión acordada, para decirla junto al corte: la fecha, o `null` si no hay ninguna acordada. `undefined`:
   * no se dice ahí, porque no hay plan vigente o porque ya es un pendiente de la tarjeta (la misma regla del dominio: a
   * una semana o menos, o ya pasada). Así la fecha está siempre en la tarjeta, una sola vez.
   */
  const proximaDe = (resumen: ResumenDeNutricion | ResumenDeEntrenamiento): string | null | undefined => {
    if (!resumen.activePlan) return undefined;
    const fecha = resumen.activePlan.nextReviewAt;
    return fecha !== null && diasEntreFechas(hoy, fecha) <= DIAS_DE_ANTICIPACION_DE_LA_REVISION ? undefined : fecha;
  };
  const delArea = (area: AreaDelResumen) => (p.observaciones === null ? null : p.observaciones.filter((o) => o.area === area));
  const comunes = { formato: p.formato, enlaceDe, onReintentar: p.onReintentar };
  const c = p.disponibles.coberturaNutricional;
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
                proxima={proximaDe(d.nutrition.summary)}
                // Lo que la cobertura del área dice además de su frase: entra y sale de los totales, y cómo se cuenta.
                detallesDeLaCobertura={
                  c
                    ? [
                        ...(c.differentMealsWithoutQuantities ? [cuenta(c.differentMealsWithoutQuantities, 'comida diferente, entre los registros sin cantidades', 'comidas diferentes, entre los registros sin cantidades')] : []),
                        ...(c.annulledExcluded ? [cuenta(c.annulledExcluded, 'anulado, fuera de los totales', 'anulados, fuera de los totales')] : []),
                        ...(c.rectifiedCountedOnce ? [cuenta(c.rectifiedCountedOnce, 'rectificado, contado una vez', 'rectificados, contados una vez')] : []),
                      ]
                    : []
                }
                {...comunes}
              />
              <AccionDeRevisar area="NUTRICION" resumen={d.nutrition.summary} href={ruta('NUTRICION', 'revisiones', '&preparar=1')} llena={llena === 'NUTRICION'} />
            </>
          ) : (
            <p className="tenue area__sin-datos">{COPY_VINCULO.sinDatosTodavia}</p>
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
                proxima={proximaDe(d.training.summary)}
                detallesDeLaCobertura={[{ cifra: null, texto: 'Sin calendario prescripto, no hay «sesiones esperadas».' }]}
                {...comunes}
              />
              <AccionDeRevisar area="ENTRENAMIENTO" resumen={d.training.summary} href={ruta('ENTRENAMIENTO', 'revisiones', '&preparar=1')} llena={llena === 'ENTRENAMIENTO'} />
            </>
          ) : (
            <p className="tenue area__sin-datos">{COPY_VINCULO.sinDatosTodavia}</p>
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
          <Hechos area="ANTROPOMETRIA" observaciones={delArea('ANTROPOMETRIA')} revision={null} revisiones={null} detallesDeLaCobertura={[]} {...comunes} />
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
 * lleva escrito para el lector de pantalla.
 */
function Hechos({
  area,
  observaciones,
  revision,
  revisiones,
  proxima,
  detallesDeLaCobertura,
  formato,
  enlaceDe,
  onReintentar,
}: {
  area: AreaDelResumen;
  observaciones: readonly ObservacionDelResumen[] | null;
  /** La última revisión del área: su corte. `null` si no tiene (o si el área no tiene revisiones en BE). */
  revision: ResumenDeNutricion['lastReview'];
  /** A dónde se abren las revisiones del área; `null` si no tiene. */
  revisiones: string | null;
  /** La próxima revisión acordada, si se dice junto al corte: la fecha, o `null` si no hay ninguna acordada. */
  proxima?: string | null;
  detallesDeLaCobertura: readonly ParteDeObservacion[];
  formato: FormatoDeLaSintesis;
  enlaceDe: (a: AccionDelResumen) => { href: string; texto: string } | null;
  onReintentar: () => void;
}) {
  if (observaciones === null) return <Cargando />;
  const fallas = observaciones.filter((o) => o.regla === 'PARTE_NO_DISPONIBLE');
  // La última toma ya está en el contexto de la tarjeta («Tomas»), con el botón que la abre: no se repite como hecho.
  const hechos = observaciones.filter((o) => o.regla !== 'PARTE_NO_DISPONIBLE' && o.regla !== 'ULTIMA_TOMA');
  const de = (tipo: AlcanceDeObservacion['tipo']) => hechos.filter((o) => o.alcance.tipo === tipo);
  const pendientes = de('HOY');
  const desdeLaRevision = de('DESDE_LA_REVISION');
  const delPeriodo = de('PERIODO');
  const fila = (o: ObservacionDelResumen) => (
    <Hecho key={claveDeObservacion(o)} o={o} formato={formato} enlace={o.accion ? enlaceDe(o.accion) : null} detalles={o.regla === 'COBERTURA_NUTRICIONAL' || o.regla === 'COBERTURA_DE_ENTRENAMIENTO' ? detallesDeLaCobertura : []} />
  );
  const aplicacion = revision?.application ? (formato.dia(revision.application.appliedAt) === formato.dia(revision.recordedAt) ? 'aplicada' : `aplicada el ${formato.dia(revision.application.appliedAt)}`) : null;
  const elPeriodo = delPeriodo[0] ? textoDelAlcance(delPeriodo[0].alcance, formato) : null;
  // El ciclo de revisiones en una línea: a la izquierda, el corte (la última revisión, o el período si no tiene); a la
  // derecha, la próxima acordada cuando no es un pendiente.
  const deLaProxima =
    proxima !== undefined ? (
      <span className="tenue area__proxima">
        Próxima<span className="visualmente-oculto"> revisión acordada</span>: {proxima ? formato.fecha(proxima) : 'sin fecha acordada'}
      </span>
    ) : null;
  return (
    <div className="area__hechos">
      {/* Lo que falta va primero (GUIA II.7): debajo de la lista, la tarjeta parecía completa al leerla de arriba abajo. */}
      {fallas.length > 0 ? (
        <div className="observaciones__fallas" role="status">
          <BloqueDeEstado tipo="error" icono="aviso" onReintentar={onReintentar} deQue={NOMBRE_DEL_AREA[area]}>
            {fallas.map((o) => (
              <span key={claveDeObservacion(o)} className="observaciones__falla" data-regla={o.regla}>
                {textoDeObservacion(o, formato)}
              </span>
            ))}
          </BloqueDeEstado>
        </div>
      ) : null}
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
            {deLaProxima}
          </p>
          {desdeLaRevision.length > 0 ? <ul className="observaciones">{desdeLaRevision.map(fila)}</ul> : null}
          {/* Con revisión, lo del período queda a un clic: los indicadores ya dicen la cobertura de cada número. */}
          {delPeriodo.length > 0 ? (
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
            {deLaProxima}
          </p>
          <ul className="observaciones">{delPeriodo.map(fila)}</ul>
        </>
      ) : revisiones ? (
        // Sin revisión y sin nada del período que decir (su lectura no aplica o falló): igual se dice dónde está parada.
        <p className="area__corte">
          <span className="tenue">Sin revisiones registradas</span>
          {deLaProxima}
        </p>
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
      <Link className={llena ? 'boton boton--primario' : 'boton boton--secundario'} href={href}>
        <Icono nombre="revision" tamano={20} />
        Preparar la revisión de {NOMBRE_DEL_AREA[area]}
      </Link>
    </div>
  );
}
