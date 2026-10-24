'use client';

/**
 * «¿Con qué información cuento para revisar el objetivo?» (WP-DASHBOARD-COMPRENSION, eje 2): qué hay registrado por
 * área, de qué fechas, qué falta y qué es comparable, con las acciones para preparar la revisión o pedir contexto. Describe
 * la información disponible; no dice si alcanza para decidir (no hay veredicto de suficiencia).
 *
 * Un dato que no se pudo leer lo dice en su renglón («No se pudo leer»), nunca «Ninguno» ni «0»; arriba, un solo
 * «Reintentar lo que faltó» vuelve a pedir las lecturas que fallaron (encargo de consolidación, bloque 5).
 */
import { NOMBRE_DEL_AREA, cantidad, numero, type CalidadDeEntrada, type LineaDeTiempoResponse, type TipoDeEvento } from '@be/domain';
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil, fecha } from '../../../../lib/formato';
import { razonDeFalla, useLectura, useSeguimiento, type MotivoDeFalla } from './contexto';
import { conRetorno, valorDeRetorno } from './estado';
import { enumerar } from './etapas-en-pantalla';
import { ICONO_DE_FALLA } from './iconos-de-metrica';
import type { Disponibles } from './series';

const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

/** Cómo quedó la lectura de la que sale un dato. */
type DeLaLectura = 'cargando' | 'falla' | 'sin-acceso' | 'lista';

/** Un dato según su lectura: mientras llega, nada; si falló, que no se pudo leer (no es una ausencia ni un cero). */
function segunLaLectura(lectura: DeLaLectura, dato: () => ReactNode): ReactNode {
  if (lectura === 'cargando') return <span className="tenue">…</span>;
  if (lectura === 'falla') return <span className="tenue">No se pudo leer: no quiere decir que no haya.</span>;
  if (lectura === 'sin-acceso') return <span className="tenue">No disponible con tu acceso actual.</span>;
  return dato();
}

export function InformacionParaRevisar({ area, disponibles }: { area: 'NUTRICION' | 'ENTRENAMIENTO' | null; disponibles: Disponibles }) {
  const { token, asesoradoId, periodo, panel, parametros, href } = useSeguimiento();
  const id = useId();
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(`informacion|${asesoradoId}|${periodo.desde}|${periodo.hasta}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, limit: '1' }),
  );
  if (panel.tipo !== 'listo') return <Cargando />;
  const d = panel.datos.domains;
  const datos = lectura.tipo === 'listo' ? lectura.datos.data : null;
  // De qué lectura sale cada dato: la línea de tiempo (las sesiones) y lo que hay en el período, por área.
  const deLaLinea: DeLaLectura = lectura.tipo === 'cargando' ? 'cargando' : lectura.tipo === 'error' ? 'falla' : lectura.tipo === 'no-disponible' ? 'sin-acceso' : 'lista';
  const deDisponibles = (falla: MotivoDeFalla | null): DeLaLectura => (disponibles.cargando ? 'cargando' : falla ? 'falla' : 'lista');
  const faltan: readonly { readonly que: string; readonly motivo: MotivoDeFalla; readonly reintentar: () => void }[] = [
    ...(lectura.tipo === 'error' ? [{ que: 'las sesiones registradas en el período', motivo: lectura.motivo, reintentar: recargar }] : []),
    ...(disponibles.falla ? [{ que: 'los datos del período de cada área', motivo: disponibles.falla, reintentar: disponibles.recargar }] : []),
  ];
  const primeraFalta = faltan[0];
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
      {primeraFalta ? (
        <BloqueDeEstado
          tipo="error"
          icono={ICONO_DE_FALLA[primeraFalta.motivo]}
          titulo="Falta una parte de la información"
          onReintentar={() => faltan.forEach((f) => f.reintentar())}
          textoDelBoton="Reintentar lo que faltó"
          rol="alert"
        >
          No pudimos leer {enumerar(faltan.map((f) => f.que))}. {razonDeFalla(primeraFalta.motivo)} Cada dato que falta lo dice en su renglón.
        </BloqueDeEstado>
      ) : null}
      <div className="planificacion-por-area">
        {mostrar('NUTRICION') && d.nutrition.available ? (
          <div className="subseccion planificacion-por-area__area">
            <h4>{NOMBRE_DEL_AREA.NUTRICION}</h4>
            <dl className="datos">
              <div>
                <dt>Registros de comida</dt>
                <dd>
                  {segunLaLectura(deDisponibles(disponibles.fallas.nutricion), () =>
                    c ? (
                      <>
                        {contar(c.records, 'registro', 'registros')} en {contar(c.daysWithRecords, 'día', 'días')} de {numero(c.daysInPeriod)}: {numero(c.recordsWithQuantities)} con cantidades y{' '}
                        {numero(c.recordsWithoutQuantities)} sin cantidades{c.differentMealsWithoutQuantities ? ` (${contar(c.differentMealsWithoutQuantities, 'comida diferente', 'comidas diferentes')})` : ''}
                      </>
                    ) : (
                      'Sin registros en el período'
                    ),
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
                  {segunLaLectura(deLaLinea, () => (
                    <>
                      {contar(deTipo('TRAINING_SESSION_RECORDED'), 'sesión', 'sesiones')}
                      {conCalidad('SESSION_WITH_DEVIATION') ? ` · ${numero(conCalidad('SESSION_WITH_DEVIATION'))} con cambios` : ''}
                      {conCalidad('SESSION_NOT_COMPLETED') ? ` · ${numero(conCalidad('SESSION_NOT_COMPLETED'))} registradas como no realizadas` : ''}
                      {conCalidad('SESSION_SUMMARY_ONLY') ? ` · ${numero(conCalidad('SESSION_SUMMARY_ONLY'))} resumidas, sin series` : ''}
                    </>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Ejercicios con sesiones</dt>
                <dd>
                  {segunLaLectura(deDisponibles(disponibles.fallas.entrenamiento), () => (
                    <>
                      {(disponibles.ejercicios ?? []).length === 0
                        ? 'Ninguno'
                        : (disponibles.ejercicios ?? [])
                            .slice(0, 6)
                            .map((e) => `${e.name} (${e.sessions}${e.lastDate ? `, la última el ${diaCivil(e.lastDate)}` : ''})`)
                            .join(' · ')}
                      {(disponibles.ejercicios ?? []).length > 6 ? ` · y ${numero((disponibles.ejercicios ?? []).length - 6)} más` : ''}
                    </>
                  ))}
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
                <dd>
                  {segunLaLectura(deDisponibles(disponibles.fallas.antropometria), () =>
                    (disponibles.antropometria ?? []).length === 0 ? 'Ninguna' : (disponibles.antropometria ?? []).map((m) => `${m.name} (${m.observations})`).join(' · '),
                  )}
                </dd>
              </div>
              <div>
                <dt>Comparabilidad</dt>
                <dd>
                  {segunLaLectura(deDisponibles(disponibles.fallas.antropometria), () =>
                    (disponibles.antropometria ?? []).some((m) => m.comparabilityGroups > 1)
                      ? `Cambió el protocolo, el método o la unidad en: ${(disponibles.antropometria ?? [])
                          .filter((m) => m.comparabilityGroups > 1)
                          .map((m) => m.name)
                          .join(', ')}. Sus series se cortan donde cambia.`
                      : 'Cada medida con tomas tiene un solo protocolo, método y unidad en el período.',
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
      <p className="acciones">
        <Link className="boton boton--secundario" href={ruta('forms', 'pedir')}>
          Pedir información
        </Link>
      </p>
    </section>
  );
}
