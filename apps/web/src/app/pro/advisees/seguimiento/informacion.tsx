'use client';

/**
 * «¿Con qué información cuento para revisar el objetivo?» (WP-DASHBOARD-COMPRENSION, eje 2): qué hay registrado por
 * área, de qué fechas, qué falta y qué es comparable, con las acciones para preparar la revisión o pedir contexto. Describe
 * la información disponible; no dice si alcanza para decidir (no hay veredicto de suficiencia).
 */
import { NOMBRE_DEL_AREA, cantidad, numero, type CalidadDeEntrada, type LineaDeTiempoResponse, type TipoDeEvento } from '@be/domain';
import Link from 'next/link';
import { useId } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil, fecha } from '../../../../lib/formato';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { conRetorno, valorDeRetorno } from './estado';
import type { Disponibles } from './series';

const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

export function InformacionParaRevisar({ area, disponibles }: { area: 'NUTRICION' | 'ENTRENAMIENTO' | null; disponibles: Disponibles }) {
  const { token, asesoradoId, periodo, panel, parametros, href } = useSeguimiento();
  const id = useId();
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(`informacion|${asesoradoId}|${periodo.desde}|${periodo.hasta}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '1' }),
  );
  if (panel.tipo !== 'listo') return <Cargando />;
  const d = panel.datos.domains;
  const datos = lectura.tipo === 'listo' ? lectura.datos.data : null;
  const deTipo = (t: TipoDeEvento) => datos?.periodCounts.byEventType.find((x) => x.eventType === t)?.count ?? 0;
  const conCalidad = (c: CalidadDeEntrada) => datos?.periodCounts.byQuality.find((x) => x.quality === c)?.count ?? 0;
  const volver = valorDeRetorno(parametros);
  const ruta = (a: 'nutrition' | 'training' | 'forms', vista: string) => conRetorno(`/pro/advisees/${a}?id=${encodeURIComponent(asesoradoId)}&vista=${vista}`, volver);
  const mostrar = (a: 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA') => area === null || area === a || a === 'ANTROPOMETRIA';
  const c = disponibles.coberturaNutricional;
  /** El corte de un área y el camino a lo nuevo desde entonces (la línea de tiempo filtrada, como desde el Resumen). */
  const corte = (dominio: 'NUTRITION' | 'TRAINING', recordedAt: string | null) =>
    recordedAt ? (
      <>
        La revisión del {fecha(recordedAt)} ·{' '}
        <Link href={href({ vista: 'linea', areas: dominio, novedades: recordedAt, tipos: null, estados: null, calidad: null, tardias: null, plan: null, ej: null })}>Ver lo nuevo desde esa revisión</Link>
      </>
    ) : (
      'Sin revisiones: se mira el período elegido'
    );

  return (
    <section className="informacion-para-revisar" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>La información disponible del {diaCivil(periodo.desde)} al {diaCivil(periodo.hasta)}</h3>
      <p className="metadatos">Describe lo que hay, de qué fechas y qué es comparable. No dice si alcanza: eso lo decidís vos.</p>
      {disponibles.cargando || lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'lo registrado en el período')} onReintentar={recargar} /> : null}
      <div className="planificacion-por-area">
        {mostrar('NUTRICION') && d.nutrition.available ? (
          <div className="subseccion planificacion-por-area__area">
            <h4>{NOMBRE_DEL_AREA.NUTRICION}</h4>
            <dl className="datos">
              <div>
                <dt>Registros de comida</dt>
                <dd>
                  {c ? (
                    <>
                      {contar(c.records, 'registro', 'registros')} en {contar(c.daysWithRecords, 'día', 'días')} de {numero(c.daysInPeriod)}: {numero(c.recordsWithQuantities)} con cantidades y{' '}
                      {numero(c.recordsWithoutQuantities)} sin cantidades{c.differentMealsWithoutQuantities ? ` (${contar(c.differentMealsWithoutQuantities, 'comida diferente', 'comidas diferentes')})` : ''}
                    </>
                  ) : (
                    'Sin registros en el período'
                  )}
                </dd>
              </div>
              <div>
                <dt>Último registro</dt>
                <dd>{d.nutrition.summary?.lastIntakeAt ? fecha(d.nutrition.summary.lastIntakeAt) : 'Sin registros'}</dd>
              </div>
              <div>
                <dt>Objetivo vigente</dt>
                <dd>
                  {d.nutrition.summary?.objective
                    ? `${cantidad(d.nutrition.summary.objective.estimatedEnergyRequirement.value, 'kcal por día')} (requerimiento energético estimado) · rige desde el ${fecha(d.nutrition.summary.objective.effectiveFrom)} · ${d.nutrition.summary.objective.authoredBy.displayName}`
                    : 'Sin objetivo vigente'}
                </dd>
              </div>
              <div>
                <dt>Corte para lo nuevo</dt>
                <dd>{corte('NUTRITION', d.nutrition.summary?.lastReview?.recordedAt ?? null)}</dd>
              </div>
            </dl>
            <p className="acciones">
              <Link className="boton boton--secundario boton--compacto" href={ruta('nutrition', 'revisiones&preparar=1')}>
                Preparar la revisión de Nutrición
              </Link>
            </p>
          </div>
        ) : null}
        {mostrar('ENTRENAMIENTO') && d.training.available ? (
          <div className="subseccion planificacion-por-area__area">
            <h4>{NOMBRE_DEL_AREA.ENTRENAMIENTO}</h4>
            <dl className="datos">
              <div>
                <dt>Sesiones registradas</dt>
                <dd>
                  {contar(deTipo('TRAINING_SESSION_RECORDED'), 'sesión', 'sesiones')}
                  {conCalidad('SESSION_WITH_DEVIATION') ? ` · ${numero(conCalidad('SESSION_WITH_DEVIATION'))} con cambios` : ''}
                  {conCalidad('SESSION_NOT_COMPLETED') ? ` · ${numero(conCalidad('SESSION_NOT_COMPLETED'))} registradas como no realizadas` : ''}
                  {conCalidad('SESSION_SUMMARY_ONLY') ? ` · ${numero(conCalidad('SESSION_SUMMARY_ONLY'))} resumidas, sin series` : ''}
                </dd>
              </div>
              <div>
                <dt>Ejercicios con sesiones</dt>
                <dd>
                  {(disponibles.ejercicios ?? []).length === 0
                    ? 'Ninguno'
                    : (disponibles.ejercicios ?? [])
                        .slice(0, 6)
                        .map((e) => `${e.name} (${e.sessions}${e.lastDate ? `, la última el ${diaCivil(e.lastDate)}` : ''})`)
                        .join(' · ')}
                  {(disponibles.ejercicios ?? []).length > 6 ? ` · y ${numero((disponibles.ejercicios ?? []).length - 6)} más` : ''}
                </dd>
              </div>
              <div>
                <dt>Objetivo vigente</dt>
                <dd>
                  {d.training.summary?.objective
                    ? `${d.training.summary.objective.statement || 'Sin enunciado'} · rige desde el ${fecha(d.training.summary.objective.effectiveFrom)} · ${d.training.summary.objective.authoredBy.displayName}`
                    : 'Sin objetivo vigente'}
                </dd>
              </div>
              <div>
                <dt>Corte para lo nuevo</dt>
                <dd>{corte('TRAINING', d.training.summary?.lastReview?.recordedAt ?? null)}</dd>
              </div>
            </dl>
            <p className="acciones">
              <Link className="boton boton--secundario boton--compacto" href={ruta('training', 'revisiones&preparar=1')}>
                Preparar la revisión de Entrenamiento
              </Link>
            </p>
          </div>
        ) : null}
        {d.anthropometry.available ? (
          <div className="subseccion planificacion-por-area__area">
            <h4>{NOMBRE_DEL_AREA.ANTROPOMETRIA}</h4>
            <dl className="datos">
              <div>
                <dt>Tomas en el período</dt>
                <dd>{numero(d.anthropometry.summary?.registeredEvaluations ?? 0)}</dd>
              </div>
              <div>
                <dt>Medidas con tomas</dt>
                <dd>{(disponibles.antropometria ?? []).length === 0 ? 'Ninguna' : (disponibles.antropometria ?? []).map((m) => `${m.name} (${m.observations})`).join(' · ')}</dd>
              </div>
              <div>
                <dt>Comparabilidad</dt>
                <dd>
                  {(disponibles.antropometria ?? []).some((m) => m.comparabilityGroups > 1)
                    ? `Cambió el protocolo, el método o la unidad en: ${(disponibles.antropometria ?? [])
                        .filter((m) => m.comparabilityGroups > 1)
                        .map((m) => m.name)
                        .join(', ')}. Sus series se cortan donde cambia.`
                    : 'Cada medida con tomas tiene un solo protocolo, método y unidad en el período.'}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
      <p className="acciones">
        <Link className="boton boton--secundario" href={ruta('forms', 'pedir')}>
          Solicitar contexto
        </Link>
      </p>
    </section>
  );
}
