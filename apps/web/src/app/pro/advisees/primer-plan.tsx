'use client';

/**
 * «Empezar el plan» (pedido de Dirección del 2026-10-18; DEUDA_LEGAJO DL-145): lo que muestra el Plan de un área cuando
 * todavía no hay ninguno, ni activo ni en preparación. Es la misma pieza en Nutrición y en Entrenamiento.
 *
 * - **La regla se queda** (B10-06; 09v10:613): el plan nace de un objetivo vigente, y el objetivo, de una evaluación.
 * - **RP-10 (DL-189) · los pasos en una franja:** «① Evaluación › ② Objetivo › ③ Plan», finita y arriba, con el estado de
 *   cada paso. Debajo, abierto, solo el paso que toca: los que vienen ya no ocupan la pantalla con «Después de…». Un paso
 *   listo se abre tocándolo en la franja (EI-D16), para ver la evaluación registrada con sus formularios (EVF-05) o el
 *   objetivo vigente; uno que viene no se abre.
 * - Cada área pone sus formularios (los mismos de Resumen) y sus acciones del plan (crear o empezar desde una plantilla).
 *   Con `evaluacionAbierta` (Nutrición, RP-12), la evaluación se ve directamente en su paso, sin «Registrar la evaluación»
 *   antes: es el pantallazo del caso. Esta pieza no escribe nada: solo ordena.
 */
import { COPY_EVALUACION_INICIAL as EI, COPY_PRIMER_PLAN as C } from '@be/domain';
import { Enlace } from '../../../components/enlace';
import { useEffect, useState, type ReactNode } from 'react';
import { Icono } from '../../../components/icono';

type Paso = 'evaluacion' | 'objetivo';
type Etapa = Paso | 'plan';
type Estado = 'listo' | 'ahora' | 'despues';

export interface PrimerPlanProps {
  /** `null` mientras se lee; si no, el día de la última evaluación registrada, o `false` si no hay ninguna. */
  readonly evaluacion: string | false | null;
  /** El día desde el que rige el objetivo vigente, o `null` si no hay. */
  readonly objetivoDesde: string | null;
  /** El enunciado del objetivo vigente, si el área lo tiene. */
  readonly objetivoTexto?: string | null;
  readonly abierto: Paso | null;
  readonly onAbrir: (paso: Paso) => void;
  readonly formularioDeEvaluacion: ReactNode;
  /** RP-12 (DL-189): la evaluación se muestra abierta en su paso, sin el botón que la abre (Nutrición). */
  readonly evaluacionAbierta?: boolean;
  /** DL-185 (EVF-05): lo que se muestra de la evaluación registrada, debajo de «Registrada el …» (los formularios vinculados). */
  readonly detalleDeLaEvaluacion?: ReactNode;
  readonly formularioDeObjetivo: ReactNode;
  /** Crear el plan o empezarlo desde una plantilla: las acciones del área, cuando ya hay un objetivo. */
  readonly accionesDelPlan: ReactNode;
  /** A dónde lleva «Pedir información a la persona», si el área lo ofrece. */
  readonly pedirInformacion?: string | null;
}

const ETAPAS: readonly { readonly etapa: Etapa; readonly titulo: string }[] = [
  { etapa: 'evaluacion', titulo: C.pasoEvaluacion },
  { etapa: 'objetivo', titulo: C.pasoObjetivo },
  { etapa: 'plan', titulo: C.pasoPlan },
];

export function PrimerPlan(p: PrimerPlanProps) {
  const hayEvaluacion = typeof p.evaluacion === 'string';
  const estados: Record<Etapa, Estado> = {
    evaluacion: hayEvaluacion || p.objetivoDesde ? 'listo' : 'ahora',
    objetivo: p.objetivoDesde ? 'listo' : hayEvaluacion ? 'ahora' : 'despues',
    plan: p.objetivoDesde ? 'ahora' : 'despues',
  };
  // Mientras se leen las evaluaciones, el paso que toca es el primero: todavía no se sabe más.
  const estadoDe = (etapa: Etapa): Estado => (p.evaluacion === null ? (etapa === 'evaluacion' ? 'ahora' : 'despues') : estados[etapa]);
  const actual: Etapa = ETAPAS.find((e) => estadoDe(e.etapa) === 'ahora')?.etapa ?? 'plan';
  // EI-D16: el paso listo que se tocó en la franja; sin tocar ninguno, el que toca. Si el que toca cambia, vuelve a ese.
  const [mirado, setMirado] = useState<Etapa | null>(null);
  useEffect(() => setMirado(null), [actual]);
  const mostrado = mirado ?? actual;
  const textoDelEstado = (etapa: Etapa): string => {
    const estado = estadoDe(etapa);
    if (estado === 'ahora') return EI.ahora;
    if (estado === 'despues') return EI.despues;
    if (etapa === 'evaluacion' && typeof p.evaluacion === 'string') return EI.evaluacionLista(p.evaluacion);
    if (etapa === 'objetivo' && p.objetivoDesde) return EI.objetivoListo(p.objetivoDesde);
    return C.pasoListo;
  };
  const titulo = ETAPAS.find((e) => e.etapa === mostrado)?.titulo ?? '';
  // Con la evaluación abierta en su paso (Nutrición), su título lo pone el formulario, con la fecha al lado.
  const conTitulo = !(mostrado === 'evaluacion' && p.evaluacionAbierta && p.evaluacion === false && !p.objetivoDesde);

  return (
    <section className="primer-plan" aria-labelledby="primer-plan-titulo" data-primer-plan>
      <h2 id="primer-plan-titulo">{C.titulo}</h2>
      {/* RP-10: los tres pasos en una franja, con su estado. Solo el que toca (o el listo que se tocó) se abre debajo. */}
      <ol className="primer-plan__franja" aria-label={EI.franja} data-franja-de-pasos>
        {ETAPAS.map((e, i) => {
          const estado = estadoDe(e.etapa);
          const seAbre = estado !== 'despues';
          return (
            <li key={e.etapa} className={`primer-plan__etapa primer-plan__etapa--${estado}`} data-etapa={e.etapa} data-estado={estado}>
              <button
                type="button"
                className="primer-plan__boton-de-etapa"
                aria-current={estado === 'ahora' ? 'step' : undefined}
                aria-expanded={seAbre ? mostrado === e.etapa : undefined}
                aria-controls={seAbre ? 'primer-plan-paso' : undefined}
                disabled={!seAbre}
                onClick={() => setMirado(e.etapa === actual ? null : e.etapa)}
              >
                <span className="primer-plan__marca" aria-hidden="true">
                  {estado === 'listo' ? <Icono nombre="tilde" tamano={15} /> : i + 1}
                </span>
                <span className="primer-plan__nombre">{e.titulo}</span>
                <span className="primer-plan__estado">{textoDelEstado(e.etapa)}</span>
              </button>
              {i < ETAPAS.length - 1 ? (
                <span className="primer-plan__separador" aria-hidden="true">
                  ›
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div id="primer-plan-paso" className="primer-plan__abierto" data-paso-abierto={mostrado}>
        {conTitulo ? <h3 className="primer-plan__titulo-del-paso">{titulo}</h3> : null}
        {mostrado === 'evaluacion' ? (
          <>
            {p.evaluacion === null ? <p className="nota">Cargando…</p> : null}
            {typeof p.evaluacion === 'string' ? <p className="nota">{C.evaluacionLista(p.evaluacion)}</p> : null}
            {typeof p.evaluacion === 'string' ? p.detalleDeLaEvaluacion : null}
            {p.evaluacion === false && !p.objetivoDesde ? (
              p.evaluacionAbierta || p.abierto === 'evaluacion' ? (
                p.formularioDeEvaluacion
              ) : (
                <div className="acciones">
                  <button type="button" className="boton boton--primario" onClick={() => p.onAbrir('evaluacion')} data-paso-evaluacion>
                    <Icono nombre="mas" tamano={18} />
                    {C.registrarEvaluacion}
                  </button>
                  {p.pedirInformacion ? (
                    <Enlace className="boton boton--secundario" href={p.pedirInformacion}>
                      <Icono nombre="solicitar" tamano={18} />
                      {C.pedirInformacion}
                    </Enlace>
                  ) : null}
                </div>
              )
            ) : null}
          </>
        ) : null}
        {mostrado === 'objetivo' ? (
          <>
            {p.objetivoDesde ? (
              <>
                {p.objetivoTexto ? <p className="primer-plan__enunciado">{p.objetivoTexto}</p> : null}
                <p className="nota">{C.objetivoListo(p.objetivoDesde)}</p>
              </>
            ) : null}
            {estados.objetivo === 'ahora' ? (
              p.abierto === 'objetivo' ? (
                p.formularioDeObjetivo
              ) : (
                <div className="acciones">
                  <button type="button" className="boton boton--primario" onClick={() => p.onAbrir('objetivo')} data-paso-objetivo>
                    <Icono nombre="objetivo" tamano={18} />
                    {C.definirObjetivo}
                  </button>
                </div>
              )
            ) : null}
          </>
        ) : null}
        {mostrado === 'plan' && estados.plan === 'ahora' ? <div className="acciones">{p.accionesDelPlan}</div> : null}
      </div>
    </section>
  );
}
