'use client';

/**
 * «Ver el plan completo» (WP-TABLERO-ALTA-GAMA TB-52; DL-163 D-13, ampliada por Dirección el 2026-11-07: «Sí, plan
 * completo de solo lectura»): el plan vigente de otra área que la persona le comparte con «resumen y plan», en un panel
 * que se abre encima de la página y devuelve el foco al cerrarse (`Panel`).
 * - **Solo lectura · lo comparte la persona,** con quién lo armó, desde cuándo rige y la próxima revisión, solo la fecha.
 * - **El objetivo vigente y lo registrado por semana,** en cifras, sin «%» (T13).
 * - **El plan entero:** Nutrición, con lo que ya dibuja Nutrición · Plan (el día tipo y sus comidas, con las opciones y
 *   los ítems con sus cantidades); Entrenamiento, cada bloque con sus sesiones, y cada ejercicio con sus series,
 *   repeticiones, RIR y carga, con la misma presentación que comparte con la APK (DL-105). Las sesiones van plegadas, con
 *   lo que tienen en su renglón; la primera, abierta.
 * - **Sin plan vigente:** «Esa área no tiene un plan vigente.» (TA-92). Nada de versiones anteriores.
 * - Lo único que se puede hacer es «Dejar una nota a …», que abre el redactor de siempre (TB-53).
 * No lee nada: el plan llega leído por el panel «Otras áreas» (API-RES-06), al desplegarlo.
 */
import {
  COPY_DEL_PLAN,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_ALCANCE,
  cuentaDeLaSesion,
  diaTipoElegido,
  lineasDePrescripcion,
  sesionesDelBloque,
  type PlanCompartido,
} from '@be/domain';
import { useState } from 'react';
import { conNumerosPegados } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';
import { Panel } from '../../../../components/panel';
import { Retrato } from '../../../../components/retrato';
import { diaCivil, diaSinElAnioEnCurso } from '../../../../lib/formato';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { ComidasDelPlan, SelectorDeDiaTipo } from '../nutrition/estructura-del-plan';
import { TiraDelObjetivo } from './tira-del-objetivo';
import { COPY_OTRAS_AREAS as T, encabezadoDelPlan, tablaDelAvance } from './otras-areas';

type DeEntrenamiento = Extract<PlanCompartido, { area: 'ENTRENAMIENTO' }>;
type DeNutricion = Extract<PlanCompartido, { area: 'NUTRICION' }>;
type Sesion = DeEntrenamiento['plan']['blocks'][number]['sessions'][number];
const enOrden = <X extends { readonly order: number }>(lista: readonly X[]): X[] => [...lista].sort((a, b) => a.order - b.order);

export function PlanCompartidoAbierto({
  area,
  lectura,
  onCerrar,
  onDejarNota,
}: {
  /** `null`: cerrado. */
  area: 'NUTRICION' | 'ENTRENAMIENTO' | null;
  /** Lo que devolvió API-RES-06 para esa área: el plan, o `null` si no tiene uno vigente. */
  lectura: PlanCompartido | null | undefined;
  onCerrar: () => void;
  onDejarNota: (plan: PlanCompartido) => void;
}) {
  const { delProfesional } = useNombres();
  const etiqueta = area ? ETIQUETA_DE_ALCANCE[area] : '';
  const plan = lectura ?? null;
  return (
    <Panel abierto={area !== null} titulo={T.tituloDelPlan(etiqueta)} onCerrar={onCerrar}>
      {area !== null ? (
        <div className="plan-compartido" data-plan-compartido={area}>
          <p>
            <span className="etiqueta-de-dato">
              <Icono nombre="candado" tamano={15} />
              {T.soloLectura}
            </span>
          </p>
          {plan === null ? (
            <p className="nota" data-sin-plan-vigente>
              {T.sinPlanVigente}
            </p>
          ) : (
            <>
              <ul className="plan-compartido__encabezado">
                {encabezadoDelPlan(plan, delProfesional, (iso) => diaSinElAnioEnCurso(iso), diaCivil).map((l, i) => (
                  <li key={l} className={i === 0 ? 'con-retrato' : undefined}>
                    {i === 0 ? <Retrato nombre={delProfesional(plan.author)} /> : null}
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <section className="plan-compartido__seccion" aria-label={T.objetivo}>
                <h3>{T.objetivo}</h3>
                {plan.area === 'NUTRICION' ? <ObjetivoDeNutricion plan={plan} /> : plan.objective ? <p>{plan.objective.objective.statement}</p> : <p className="nota">{T.sinObjetivo}</p>}
              </section>
              <LoRegistrado plan={plan} />
              <section className="plan-compartido__seccion" aria-label={T.elPlan}>
                <h3>{T.elPlan}</h3>
                {plan.area === 'NUTRICION' ? <PlanDeNutricion plan={plan} /> : <PlanDeEntrenamiento plan={plan} />}
              </section>
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => onDejarNota(plan)} data-dejar-nota>
                  <Icono nombre="texto" tamano={18} />
                  {T.dejarUnaNota(delProfesional(plan.author))}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Panel>
  );
}

function ObjetivoDeNutricion({ plan }: { plan: DeNutricion }) {
  if (!plan.objective) return <p className="nota">{T.sinObjetivo}</p>;
  return <TiraDelObjetivo calorias={plan.objective.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: plan.objective.macronutrientDistribution }} onReintentar={() => {}} />;
}

/** Lo registrado por semana desde que rige, en una tabla de cifras: sin «%» y sin colores por el valor. */
function LoRegistrado({ plan }: { plan: PlanCompartido }) {
  const tabla = tablaDelAvance(plan.progress, diaCivil);
  return (
    <section className="plan-compartido__seccion" aria-label={T.loRegistrado}>
      <h3>{T.loRegistrado}</h3>
      {tabla.filas.length === 0 ? (
        <p className="nota">{T.sinSemanas}</p>
      ) : (
        <div className="desplazable-x">
          <table className="plan-compartido__avance">
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col">{tabla.encabezado}</th>
              </tr>
            </thead>
            <tbody>
              {tabla.filas.map((f) => (
                <tr key={f.semana}>
                  <th scope="row">{f.semana}</th>
                  <td>{f.cifra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tabla.previstas ? <p className="nota">{tabla.previstas}</p> : null}
    </section>
  );
}

/** El plan de comidas, con lo mismo que dibuja Nutrición · Plan: un día tipo por vez y sus comidas plegadas. */
function PlanDeNutricion({ plan }: { plan: DeNutricion }) {
  const [pedido, setPedido] = useState<{ readonly dia: string | null; readonly comidas: string | null }>({ dia: null, comidas: null });
  const dia = diaTipoElegido(plan.plan.dayTypes, pedido.dia);
  return (
    <div className="version-del-plan">
      <SelectorDeDiaTipo dias={plan.plan.dayTypes} elegido={dia} onElegir={(orden) => setPedido({ dia: String(orden), comidas: null })} />
      {dia ? <ComidasDelPlan dia={dia} pedido={pedido.comidas} onPedir={(comidas) => setPedido((p) => ({ ...p, comidas }))} nivel={4} /> : <p className="nota">{COPY_DEL_PLAN.sinDiasTipo}</p>}
    </div>
  );
}

/** El plan de entrenamiento entero: cada bloque, con sus microciclos si los usa, y sus sesiones. */
function PlanDeEntrenamiento({ plan }: { plan: DeEntrenamiento }) {
  const bloques = enOrden(plan.plan.blocks);
  if (bloques.length === 0) return <p className="nota">{C.sinBloques}</p>;
  let primera = true;
  const abrirLaPrimera = () => {
    const es = primera;
    primera = false;
    return es;
  };
  return (
    <div className="plan-compartido__entrenamiento">
      {bloques.map((b) => (
        <section key={b.blockId} className="plan-compartido__bloque" aria-label={b.label}>
          <h4>
            {b.label} <span className="nota">· {sesionesDelBloque(b)}</span>
          </h4>
          {b.purpose ? (
            <p className="nota">
              {C.proposito}: {b.purpose}
            </p>
          ) : null}
          {b.microcycles.length > 0
            ? enOrden(b.microcycles).map((m) => (
                <div key={m.microcycleId} className="plan-compartido__microciclo">
                  <h5>{m.label}</h5>
                  {m.purpose ? (
                    <p className="nota">
                      {C.proposito}: {m.purpose}
                    </p>
                  ) : null}
                  <Sesiones sesiones={m.sessions} abrir={abrirLaPrimera} />
                </div>
              ))
            : <Sesiones sesiones={b.sessions} abrir={abrirLaPrimera} />}
        </section>
      ))}
    </div>
  );
}

function Sesiones({ sesiones, abrir }: { sesiones: readonly Sesion[]; abrir: () => boolean }) {
  if (sesiones.length === 0) return <p className="nota">{C.sinSesiones}</p>;
  return (
    <>
      {enOrden(sesiones).map((s) => (
        <details key={s.sessionId} className="plan-compartido__sesion" open={abrir()}>
          <summary>
            <strong>{s.label}</strong> <span className="nota">{cuentaDeLaSesion(s)}</span>
          </summary>
          {s.instructions ? (
            <p className="indicaciones-de-la-sesion">
              <span className="nivel-del-plan__rotulo">{COPY_ENTRENAMIENTO.indicacionesDeLaSesion}</span> {conNumerosPegados(s.instructions)}
            </p>
          ) : null}
          <ol className="plan-compartido__ejercicios">
            {enOrden(s.prescriptions).map((p) => (
              <li key={p.prescriptionId}>
                <strong>{p.exerciseName}</strong>
                <ul className="lista-compacta">
                  {lineasDePrescripcion(p, { sinCriterioExplicito: true }).map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </>
  );
}
