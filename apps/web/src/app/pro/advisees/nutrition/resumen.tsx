'use client';

/**
 * NUT-01 Resumen (B05:157-210): el estado operativo sin abrir todas las fuentes. Objetivo efectivo, plan activo,
 * última evaluación, estado del seguimiento y revisión pendiente. Sin «score de adherencia», semáforo clínico ni
 * «paciente en riesgo» (B05:171-177). Los valores del objetivo se muestran como «declarados por el profesional», nunca
 * como «BE recomienda» (B05:195-210).
 *
 * Bloque 5 del encargo de consolidación (2026-10-19): las cuatro lecturas tienen cada una su estado. Si falla una, el
 * resto sigue a la vista, el aviso de arriba dice qué falta y vuelve a pedir solo eso, y cada dato que dependía de lo
 * que falta dice «No se pudo leer», nunca «no hay» (`lecturas-parciales.tsx`).
 */
import { COPY_PRIMER_PLAN, cantidad, COPY_NUTRICION, type ContextoDeRevisionResponse, type EvaluacionNutricional, type VersionDeObjetivo, type VersionDePlan } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { datosDe, fallo, LecturasParciales, SegunLectura, type Lectura } from '../lecturas-parciales';
import { useNutricion } from './nutricion';
import { numerosDeVersion } from './plan';
import { FormularioDeEvaluacion, FormularioDeObjetivo } from './formularios';

interface Lecturas {
  readonly evaluaciones: Lectura<EvaluacionNutricional[]>;
  readonly objetivos: Lectura<VersionDeObjetivo[]>;
  readonly planes: Lectura<Omit<VersionDePlan, 'dayTypes'>[]>;
  readonly contexto: Lectura<ContextoDeRevisionResponse['data']>;
}
type Clave = keyof Lecturas;
const TODAS: readonly Clave[] = ['evaluaciones', 'objetivos', 'planes', 'contexto'];
const NOMBRE: Readonly<Record<Clave, string>> = {
  evaluaciones: 'las evaluaciones',
  objetivos: 'los objetivos',
  planes: 'las versiones del plan',
  contexto: 'el estado del seguimiento',
};

export function VistaDeResumen() {
  const { token, asesoradoId, sesionPerdida, irA } = useNutricion();
  const [lecturas, setLecturas] = useState<Lecturas>({ evaluaciones: null, objetivos: null, planes: null, contexto: null });
  const [formulario, setFormulario] = useState<'evaluacion' | 'objetivo' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Una respuesta que llega después de un pedido más nuevo de la misma lectura no lo pisa.
  const turnos = useRef<Record<Clave, number>>({ evaluaciones: 0, objetivos: 0, planes: 0, contexto: 0 });

  /** Lee lo pedido (todo, o solo lo que falló); lo demás queda como está. */
  const leer = useCallback(
    async (cuales: readonly Clave[]) => {
      const turno = Object.fromEntries(cuales.map((c) => [c, ++turnos.current[c]])) as Partial<Record<Clave, number>>;
      const pedido = (c: Clave) => cuales.includes(c);
      // Lo que se vuelve a pedir pasa a «Cargando…» en su lugar; lo demás queda a la vista.
      setLecturas((l) => ({
        evaluaciones: pedido('evaluaciones') ? null : l.evaluaciones,
        objetivos: pedido('objetivos') ? null : l.objetivos,
        planes: pedido('planes') ? null : l.planes,
        contexto: pedido('contexto') ? null : l.contexto,
      }));
      const [ev, ob, pl, cx] = await Promise.all([
        pedido('evaluaciones') ? api.listarEvaluaciones(token, asesoradoId) : null,
        pedido('objetivos') ? api.listarObjetivos(token, asesoradoId) : null,
        pedido('planes') ? api.listarPlanes(token, asesoradoId) : null,
        pedido('contexto') ? api.contextoDeRevision(token, asesoradoId) : null,
      ]);
      for (const x of [ev, ob, pl, cx]) if (x && sesionPerdida(x)) return;
      const vigente = (c: Clave) => turno[c] === turnos.current[c];
      setLecturas((l) => ({
        evaluaciones: ev && vigente('evaluaciones') ? datosDe(ev) : l.evaluaciones,
        objetivos: ob && vigente('objetivos') ? datosDe(ob) : l.objetivos,
        planes: pl && vigente('planes') ? datosDe(pl) : l.planes,
        contexto: cx && vigente('contexto') ? datosDe(cx) : l.contexto,
      }));
    },
    [token, asesoradoId, sesionPerdida],
  );

  useEffect(() => {
    void leer(TODAS);
  }, [leer]);

  return (
    <LecturasParciales
      lecturas={TODAS.map((c) => ({ nombre: NOMBRE[c], lectura: lecturas[c] }))}
      onReintentar={() => void leer(TODAS.filter((c) => fallo(lecturas[c])))}
    >
      <Resumen
        lecturas={lecturas}
        formulario={formulario}
        aviso={aviso}
        onCerrarAviso={() => setAviso(null)}
        onFormulario={(f) => {
          setAviso(null);
          setFormulario(f);
        }}
        onListo={(texto) => {
          setFormulario(null);
          setAviso(texto);
          void leer(TODAS);
        }}
        onIrAlPlan={() => irA('plan')}
        onIrARevisiones={() => irA('revisiones')}
      />
    </LecturasParciales>
  );
}

function Resumen({
  lecturas,
  formulario,
  aviso,
  onCerrarAviso,
  onFormulario,
  onListo,
  onIrAlPlan,
  onIrARevisiones,
}: {
  lecturas: Lecturas;
  formulario: 'evaluacion' | 'objetivo' | null;
  aviso: string | null;
  onCerrarAviso: () => void;
  onFormulario: (f: 'evaluacion' | 'objetivo' | null) => void;
  onListo: (texto: string) => void;
  onIrAlPlan: () => void;
  onIrARevisiones: () => void;
}) {
  const { evaluaciones, objetivos, planes, contexto } = lecturas;
  const efectivo = objetivos?.ok ? (objetivos.datos.find((o) => o.isEffective) ?? null) : null;
  const borrador = planes?.ok ? (planes.datos.find((p) => p.state === 'DRAFT') ?? null) : null;
  // Una versión nueva del objetivo se funda en una evaluación y reemplaza a la vigente: hacen falta las dos lecturas.
  const objetivoNoSePuede = !evaluaciones?.ok || !objetivos?.ok ? 'Para una versión nueva del objetivo hay que poder leer las evaluaciones y el objetivo vigente.' : null;

  return (
    <div className="secciones">
      {aviso ? (
        <AvisoFlotante onCerrar={onCerrarAviso}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}

      <section className="seccion" aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado del seguimiento</h2>
        <dl className="datos">
          <div>
            <dt>Seguimiento nutricional</dt>
            <dd>
              <SegunLectura lectura={contexto}>
                {(c) => (c.process ? (c.process.state === 'ABIERTO' ? 'Abierto' : 'Cerrado') : 'Todavía no empezó: empieza al activar el primer plan.')}
              </SegunLectura>
            </dd>
          </div>
          <div>
            <dt>{COPY_NUTRICION.planActivo}</dt>
            <dd>
              <SegunLectura lectura={planes}>
                {(versiones) => {
                  const activo = versiones.find((p) => p.isEffective) ?? null;
                  return activo ? (
                    <>
                      Versión {numerosDeVersion(versiones).get(activo.planId)} · activada el {fecha(activo.activatedAt as string)}{' '}
                      <button type="button" className="boton boton--enlace" onClick={onIrAlPlan}>
                        Ver plan
                      </button>
                    </>
                  ) : (
                    <>
                      {COPY_NUTRICION.sinPlanActivo}{' '}
                      <button type="button" className="boton boton--enlace" onClick={onIrAlPlan}>
                        {COPY_PRIMER_PLAN.titulo}
                      </button>
                    </>
                  );
                }}
              </SegunLectura>
            </dd>
          </div>
          {borrador ? (
            <div>
              <dt>{COPY_NUTRICION.borrador}</dt>
              <dd>
                Hay un borrador en preparación. No es visible para el asesorado.{' '}
                <button type="button" className="boton boton--enlace" onClick={onIrAlPlan}>
                  Abrir borrador
                </button>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Última evaluación</dt>
            <dd>
              <SegunLectura lectura={evaluaciones}>{(lista) => (lista[0] ? dia(lista[0].occurredAt) : 'Sin evaluaciones registradas.')}</SegunLectura>
            </dd>
          </div>
          <div>
            <dt>{COPY_NUTRICION.revisionPendiente}</dt>
            <dd>
              <SegunLectura lectura={contexto}>
                {(c) =>
                  c.pendingReview.pending ? (
                    <>
                      Pendiente desde el {dia(`${c.pendingReview.since}T12:00:00Z`)}{' '}
                      <button type="button" className="boton boton--enlace" onClick={onIrARevisiones}>
                        Ir a Revisiones
                      </button>
                    </>
                  ) : (
                    'No hay una revisión pendiente.'
                  )
                }
              </SegunLectura>
            </dd>
          </div>
        </dl>
      </section>

      <section className="seccion" aria-labelledby="titulo-objetivo">
        <h2 id="titulo-objetivo">Objetivo</h2>
        {objetivos === null ? <Cargando /> : null}
        {objetivos && !objetivos.ok ? <p className="nota">No se pudo leer el objetivo: el aviso de arriba lo vuelve a pedir.</p> : null}
        {objetivos?.ok && efectivo ? (
          <>
            <p className="nota">{COPY_NUTRICION.objetivoDeclarado}</p>
            <dl className="datos">
              <div>
                <dt>Requerimiento energético</dt>
                <dd>{cantidad(efectivo.estimatedEnergyRequirement.value, 'kcal')} por día</dd>
              </div>
              <div>
                <dt>Proteínas · carbohidratos · grasas</dt>
                <dd>
                  {cantidad(efectivo.macronutrientDistribution.protein.value, 'g')} · {cantidad(efectivo.macronutrientDistribution.carbohydrate.value, 'g')} ·{' '}
                  {cantidad(efectivo.macronutrientDistribution.fat.value, 'g')} por día
                </dd>
              </div>
              <div>
                <dt>Fundamento</dt>
                <dd>{efectivo.rationale}</dd>
              </div>
              <div>
                <dt>Vigente desde</dt>
                <dd>{dia(efectivo.effectiveFrom)}</dd>
              </div>
            </dl>
            {objetivos.datos.length > 1 ? (
              <details>
                <summary>Historia del objetivo ({objetivos.datos.length} versiones)</summary>
                <ol className="historial">
                  {objetivos.datos.map((o, i) => (
                    <li key={o.versionId}>
                      <span className="historial__evento">
                        V{objetivos.datos.length - i} · {o.isEffective ? 'vigente' : 'anterior'}
                      </span>{' '}
                      {cantidad(o.estimatedEnergyRequirement.value, 'kcal')} · {dia(o.createdAt)} · {o.authoredBy.displayName}
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </>
        ) : null}
        {objetivos?.ok && !efectivo ? <p>{COPY_NUTRICION.sinObjetivo}</p> : null}
      </section>

      {formulario === 'evaluacion' ? (
        <section className="seccion">
          <FormularioDeEvaluacion onRegistrada={() => onListo(COPY_NUTRICION.evaluacionRegistrada)} onCancelar={() => onFormulario(null)} />
        </section>
      ) : null}
      {formulario === 'objetivo' && evaluaciones?.ok ? (
        <section className="seccion">
          <FormularioDeObjetivo evaluaciones={evaluaciones.datos} onEmitido={() => onListo('Nueva versión de objetivo guardada.')} onCancelar={() => onFormulario(null)} />
        </section>
      ) : null}
      {formulario === null ? (
        <>
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => onFormulario('evaluacion')}>
              {COPY_NUTRICION.nuevaEvaluacion}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => onFormulario('objetivo')} disabled={!!objetivoNoSePuede} aria-describedby={objetivoNoSePuede ? 'objetivo-no-se-puede' : undefined}>
              {efectivo ? COPY_NUTRICION.nuevaVersionDeObjetivo : COPY_NUTRICION.definirObjetivo}
            </button>
          </div>
          {objetivoNoSePuede && (evaluaciones !== null && objetivos !== null) ? (
            <p id="objetivo-no-se-puede" className="nota">
              {objetivoNoSePuede}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
