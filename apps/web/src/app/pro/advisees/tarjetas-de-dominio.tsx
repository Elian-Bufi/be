'use client';

/**
 * Tarjetas de dominio del Resumen (B10-08 §10): disponibilidad, **resumen factual**, último evento visible, próxima
 * acción visible y acceso al detalle. Nada más.
 *
 * Lo que estas tarjetas no hacen, porque el legajo lo prohíbe explícitamente (B10-08 §10; 09v11 §15, regla crítica):
 * semáforo clínico, «estado general», color de riesgo, score y ranking. Los estados describen **datos**, no a la
 * persona: por eso «2 registros en el período» y nunca «buena adherencia». Un dato que falta se dice que falta
 * (RF-053), sin rellenarlo con un cero ni con un guion que parezca un valor.
 *
 * Cada bloque conserva dominio, período, procedencia y autoría (B10-08 §8.3): el resumen dice **quién** escribió el
 * objetivo y **cuándo** se activó el plan, porque el dashboard es composición de read models, no una síntesis nueva.
 */
import { cantidad, COPY_VINCULO, numero, type DashboardResponse } from '@be/domain';
import Link from 'next/link';
import { dia, fecha } from '../../../lib/formato';

type Dominios = DashboardResponse['data']['domains'];

/** Una fila de dato del resumen. El valor ausente se dice; no se muestra vacío. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const sinDato = <span className="tenue">{COPY_VINCULO.sinDatosTodavia}</span>;

export function TarjetaDeNutricion({ entrada, id }: { entrada: Dominios['nutrition']; id: string }) {
  if (!entrada.available) return null;
  const s = entrada.summary;
  return (
    <Tarjeta titulo="Nutrición" enlace={`/pro/advisees/nutrition?id=${encodeURIComponent(id)}`} textoDelEnlace="Abrir Nutrición" vacio={s === null}>
      {s ? (
        <dl className="datos">
          <Dato etiqueta="Plan vigente">{s.activePlan ? `Activado el ${fecha(s.activePlan.activatedAt)}` : sinDato}</Dato>
          <Dato etiqueta="Requerimiento energético estimado">
            {s.objective ? (
              <>
                {cantidad(s.objective.estimatedEnergyRequirement.value, 'kcal por día')} · {s.objective.authoredBy.displayName}
              </>
            ) : (
              sinDato
            )}
          </Dato>
          <Dato etiqueta="Registros del asesorado en el período">
            {numero(s.registeredIntakes, 0)}
            {s.lastIntakeAt ? <> · último el {fecha(s.lastIntakeAt)}</> : null}
          </Dato>
          <Dato etiqueta="Última revisión">{s.lastReview ? `${fecha(s.lastReview.recordedAt)} · ${s.lastReview.author.displayName}` : sinDato}</Dato>
          <Dato etiqueta="Próxima revisión acordada">{s.activePlan?.nextReviewAt ? dia(`${s.activePlan.nextReviewAt}T12:00:00.000Z`) : sinDato}</Dato>
        </dl>
      ) : null}
    </Tarjeta>
  );
}

export function TarjetaDeEntrenamiento({ entrada, id }: { entrada: Dominios['training']; id: string }) {
  if (!entrada.available) return null;
  const s = entrada.summary;
  return (
    <Tarjeta titulo="Entrenamiento" enlace={`/pro/advisees/training?id=${encodeURIComponent(id)}`} textoDelEnlace="Abrir Entrenamiento" vacio={s === null}>
      {s ? (
        <dl className="datos">
          <Dato etiqueta="Plan vigente">{s.activePlan ? `Activado el ${fecha(s.activePlan.activatedAt)}` : sinDato}</Dato>
          <Dato etiqueta="Objetivo vigente">{s.objective && s.objective.statement ? `${s.objective.statement} · ${s.objective.authoredBy.displayName}` : sinDato}</Dato>
          <Dato etiqueta="Sesiones registradas en el período">
            {numero(s.registeredExecutions, 0)}
            {s.lastExecutionAt ? <> · última el {fecha(s.lastExecutionAt)}</> : null}
          </Dato>
          <Dato etiqueta="Última revisión">{s.lastReview ? `${fecha(s.lastReview.recordedAt)} · ${s.lastReview.author.displayName}` : sinDato}</Dato>
          <Dato etiqueta="Próxima revisión acordada">{s.activePlan?.nextReviewAt ? dia(`${s.activePlan.nextReviewAt}T12:00:00.000Z`) : sinDato}</Dato>
        </dl>
      ) : null}
    </Tarjeta>
  );
}

export function TarjetaDeAntropometria({ entrada, id }: { entrada: Dominios['anthropometry']; id: string }) {
  if (!entrada.available) return null;
  const s = entrada.summary;
  return (
    <Tarjeta titulo="Antropometría" enlace={`/pro/advisees/anthropometry?id=${encodeURIComponent(id)}`} textoDelEnlace="Abrir Antropometría" vacio={s === null}>
      {s ? (
        <dl className="datos">
          <Dato etiqueta="Última evaluación registrada">
            {s.lastEvaluation ? `${fecha(s.lastEvaluation.occurredAt)} · ${s.lastEvaluation.author.displayName}` : sinDato}
          </Dato>
          <Dato etiqueta="Evaluaciones registradas en el período">{numero(s.registeredEvaluations, 0)}</Dato>
        </dl>
      ) : null}
    </Tarjeta>
  );
}

function Tarjeta({
  titulo,
  enlace,
  textoDelEnlace,
  vacio,
  children,
}: {
  titulo: string;
  enlace: string;
  textoDelEnlace: string;
  vacio: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="tarjeta-de-dominio" aria-labelledby={`dominio-${titulo.toLowerCase()}`}>
      <h3 id={`dominio-${titulo.toLowerCase()}`}>{titulo}</h3>
      {vacio ? <p className="tenue">{COPY_VINCULO.sinDatosTodavia}</p> : children}
      <p>
        <Link href={enlace}>{textoDelEnlace}</Link>
      </p>
    </section>
  );
}
