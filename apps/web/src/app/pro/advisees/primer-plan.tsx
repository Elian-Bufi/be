'use client';

/**
 * «Empezar el plan» (pedido de Dirección del 2026-10-18; DEUDA_LEGAJO DL-145): lo que muestra el Plan de un área cuando
 * todavía no hay ninguno, ni activo ni en preparación. Es la misma pieza en Nutrición y en Entrenamiento.
 *
 * - **La regla se queda** (B10-06; 09v10:613): el plan nace de un objetivo vigente, y el objetivo, de una evaluación.
 * - **Lo que cambia es el camino.** Antes, el Plan vacío decía «primero definí el objetivo» y mandaba a Resumen, donde el
 *   botón del objetivo estaba apagado hasta registrar una evaluación, más abajo. Ahora los tres pasos están acá, en
 *   orden: el que toca está abierto; los que ya están, dicen «Listo»; los que vienen, después de cuál.
 * - Cada área pone sus formularios (los mismos de Resumen) y sus acciones del plan (crear o empezar desde una plantilla).
 *   Esta pieza no escribe nada: solo ordena.
 */
import { COPY_PRIMER_PLAN as C } from '@be/domain';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono } from '../../../components/icono';

type Paso = 'evaluacion' | 'objetivo';
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
  readonly formularioDeObjetivo: ReactNode;
  /** Crear el plan o empezarlo desde una plantilla: las acciones del área, cuando ya hay un objetivo. */
  readonly accionesDelPlan: ReactNode;
  /** A dónde lleva «Pedir información a la persona», si el área lo ofrece. */
  readonly pedirInformacion?: string | null;
}

export function PrimerPlan(p: PrimerPlanProps) {
  const hayEvaluacion = typeof p.evaluacion === 'string';
  const estados: Record<'evaluacion' | 'objetivo' | 'plan', Estado> = {
    evaluacion: hayEvaluacion || p.objetivoDesde ? 'listo' : 'ahora',
    objetivo: p.objetivoDesde ? 'listo' : hayEvaluacion ? 'ahora' : 'despues',
    plan: p.objetivoDesde ? 'ahora' : 'despues',
  };
  return (
    <section className="primer-plan" aria-labelledby="primer-plan-titulo" data-primer-plan>
      <h2 id="primer-plan-titulo">{C.titulo}</h2>
      <ol className="primer-plan__pasos">
        <PasoDelPlan numero={1} titulo={C.pasoEvaluacion} estado={p.evaluacion === null ? 'despues' : estados.evaluacion}>
          {p.evaluacion === null ? <p className="nota">Cargando…</p> : null}
          {typeof p.evaluacion === 'string' ? <p className="nota">{C.evaluacionLista(p.evaluacion)}</p> : null}
          {p.evaluacion === false && !p.objetivoDesde ? (
            p.abierto === 'evaluacion' ? (
              p.formularioDeEvaluacion
            ) : (
              <div className="acciones">
                <button type="button" className="boton boton--primario" onClick={() => p.onAbrir('evaluacion')} data-paso-evaluacion>
                  <Icono nombre="mas" tamano={18} />
                  {C.registrarEvaluacion}
                </button>
                {p.pedirInformacion ? (
                  <Link className="boton boton--secundario" href={p.pedirInformacion}>
                    <Icono nombre="solicitar" tamano={18} />
                    {C.pedirInformacion}
                  </Link>
                ) : null}
              </div>
            )
          ) : null}
        </PasoDelPlan>
        <PasoDelPlan numero={2} titulo={C.pasoObjetivo} estado={estados.objetivo}>
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
          {estados.objetivo === 'despues' ? <p className="nota">{C.despuesDeLaEvaluacion}</p> : null}
        </PasoDelPlan>
        <PasoDelPlan numero={3} titulo={C.pasoPlan} estado={estados.plan}>
          {estados.plan === 'ahora' ? <div className="acciones">{p.accionesDelPlan}</div> : <p className="nota">{C.despuesDelObjetivo}</p>}
        </PasoDelPlan>
      </ol>
    </section>
  );
}

function PasoDelPlan({ numero, titulo, estado, children }: { numero: number; titulo: string; estado: Estado; children: ReactNode }) {
  return (
    <li className={`primer-plan__paso primer-plan__paso--${estado}`} aria-current={estado === 'ahora' ? 'step' : undefined}>
      <span className="primer-plan__marca" aria-hidden="true">
        {estado === 'listo' ? <Icono nombre="tilde" tamano={18} /> : numero}
      </span>
      <div className="primer-plan__cuerpo">
        <h3>
          {titulo}
          {estado === 'listo' ? <span className="primer-plan__listo">{C.pasoListo}</span> : null}
        </h3>
        {children}
      </div>
    </li>
  );
}
