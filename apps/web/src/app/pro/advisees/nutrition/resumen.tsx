'use client';

/**
 * NUT-01 Resumen (B05:157-210): el estado operativo sin abrir todas las fuentes. Objetivo efectivo, plan activo,
 * última evaluación, estado del seguimiento y revisión pendiente. Sin «score de adherencia», semáforo clínico ni
 * «paciente en riesgo» (B05:171-177). Los valores del objetivo se muestran como «declarados por el profesional», nunca
 * como «BE recomienda» (B05:195-210).
 */
import {
  COPY_NUTRICION,
  type ContextoDeRevisionResponse,
  type EvaluacionNutricional,
  type VersionDeObjetivo,
  type VersionDePlan,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { EstadoDeLectura, useNutricion } from './nutricion';
import { numerosDeVersion } from './plan';
import { FormularioDeEvaluacion, FormularioDeObjetivo } from './formularios';

interface Datos {
  evaluaciones: EvaluacionNutricional[];
  objetivos: VersionDeObjetivo[];
  planes: Omit<VersionDePlan, 'dayTypes'>[];
  contexto: ContextoDeRevisionResponse['data'];
}

export function VistaDeResumen() {
  const { token, asesoradoId, sesionPerdida, irA } = useNutricion();
  const [r, setR] = useState<Resultado<Datos> | null>(null);
  const [formulario, setFormulario] = useState<'evaluacion' | 'objetivo' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const [ev, ob, pl, cx] = await Promise.all([
      api.listarEvaluaciones(token, asesoradoId),
      api.listarObjetivos(token, asesoradoId),
      api.listarPlanes(token, asesoradoId),
      api.contextoDeRevision(token, asesoradoId),
    ]);
    for (const x of [ev, ob, pl, cx]) if (sesionPerdida(x)) return;
    const fallo = [ev, ob, pl, cx].find((x) => !x.ok);
    if (fallo) return setR(fallo as Resultado<Datos>);
    if (!ev.ok || !ob.ok || !pl.ok || !cx.ok) return;
    setR({ ok: true, datos: { evaluaciones: ev.datos.data, objetivos: ob.datos.data, planes: pl.datos.data, contexto: cx.datos.data } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <Resumen
          datos={r.datos}
          formulario={formulario}
          aviso={aviso}
          onFormulario={(f) => {
            setAviso(null);
            setFormulario(f);
          }}
          onListo={(texto) => {
            setFormulario(null);
            setAviso(texto);
            void cargar();
          }}
          onIrAlPlan={() => irA('plan')}
          onIrARevisiones={() => irA('revisiones')}
        />
      ) : null}
    </EstadoDeLectura>
  );
}

function Resumen({
  datos,
  formulario,
  aviso,
  onFormulario,
  onListo,
  onIrAlPlan,
  onIrARevisiones,
}: {
  datos: Datos;
  formulario: 'evaluacion' | 'objetivo' | null;
  aviso: string | null;
  onFormulario: (f: 'evaluacion' | 'objetivo' | null) => void;
  onListo: (texto: string) => void;
  onIrAlPlan: () => void;
  onIrARevisiones: () => void;
}) {
  const efectivo = datos.objetivos.find((o) => o.isEffective) ?? null;
  const activo = datos.planes.find((p) => p.isEffective) ?? null;
  const borrador = datos.planes.find((p) => p.state === 'DRAFT') ?? null;
  const ultima = datos.evaluaciones[0] ?? null;
  const proceso = datos.contexto.process;
  const pendiente = datos.contexto.pendingReview;

  return (
    <div className="secciones">
      {aviso ? (
        <Aviso tipo="exito" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}

      <section className="seccion" aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado del seguimiento</h2>
        <dl className="datos">
          <div>
            <dt>Seguimiento nutricional</dt>
            <dd>{proceso ? (proceso.state === 'ABIERTO' ? 'Abierto' : 'Cerrado') : 'Todavía no empezó: empieza al activar el primer plan.'}</dd>
          </div>
          <div>
            <dt>{COPY_NUTRICION.planActivo}</dt>
            <dd>
              {activo ? (
                <>
                  Versión {numerosDeVersion(datos.planes).get(activo.planId)} · activada el {fecha(activo.activatedAt as string)}{' '}
                  <button type="button" className="boton boton--enlace" onClick={onIrAlPlan}>
                    Ver plan
                  </button>
                </>
              ) : (
                COPY_NUTRICION.sinPlanActivo
              )}
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
            <dd>{ultima ? dia(ultima.occurredAt) : 'Sin evaluaciones registradas.'}</dd>
          </div>
          <div>
            <dt>{COPY_NUTRICION.revisionPendiente}</dt>
            <dd>
              {pendiente.pending ? (
                <>
                  Pendiente desde el {dia(`${pendiente.since}T12:00:00Z`)}{' '}
                  <button type="button" className="boton boton--enlace" onClick={onIrARevisiones}>
                    Ir a Revisiones
                  </button>
                </>
              ) : (
                'No hay una revisión pendiente.'
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="seccion" aria-labelledby="titulo-objetivo">
        <h2 id="titulo-objetivo">Objetivo</h2>
        {efectivo ? (
          <>
            <p className="nota">{COPY_NUTRICION.objetivoDeclarado}</p>
            <dl className="datos">
              <div>
                <dt>Requerimiento energético</dt>
                <dd>{efectivo.estimatedEnergyRequirement.value} kcal por día</dd>
              </div>
              <div>
                <dt>Proteínas · carbohidratos · grasas</dt>
                <dd>
                  {efectivo.macronutrientDistribution.protein.value} g · {efectivo.macronutrientDistribution.carbohydrate.value} g ·{' '}
                  {efectivo.macronutrientDistribution.fat.value} g por día
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
            {datos.objetivos.length > 1 ? (
              <details>
                <summary>Historia del objetivo ({datos.objetivos.length} versiones)</summary>
                <ol className="historial">
                  {datos.objetivos.map((o, i) => (
                    <li key={o.versionId}>
                      <span className="historial__evento">
                        V{datos.objetivos.length - i} · {o.isEffective ? 'vigente' : 'anterior'}
                      </span>{' '}
                      {o.estimatedEnergyRequirement.value} kcal · {dia(o.createdAt)} · {o.authoredBy.displayName}
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </>
        ) : (
          <p>{COPY_NUTRICION.sinObjetivo}</p>
        )}
      </section>

      {formulario === 'evaluacion' ? (
        <section className="seccion">
          <FormularioDeEvaluacion onRegistrada={() => onListo(COPY_NUTRICION.evaluacionRegistrada)} onCancelar={() => onFormulario(null)} />
        </section>
      ) : null}
      {formulario === 'objetivo' ? (
        <section className="seccion">
          <FormularioDeObjetivo evaluaciones={datos.evaluaciones} onEmitido={() => onListo('Nueva versión de objetivo guardada.')} onCancelar={() => onFormulario(null)} />
        </section>
      ) : null}
      {formulario === null ? (
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => onFormulario('evaluacion')}>
            {COPY_NUTRICION.nuevaEvaluacion}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => onFormulario('objetivo')}>
            {efectivo ? COPY_NUTRICION.nuevaVersionDeObjetivo : COPY_NUTRICION.definirObjetivo}
          </button>
        </div>
      ) : null}
    </div>
  );
}
