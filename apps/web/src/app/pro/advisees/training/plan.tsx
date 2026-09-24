'use client';

/**
 * Plan de entrenamiento (B10-06 §9-§10, §24): Activo, Borradores e Historial, con insignias «Borrador / Activo /
 * Anterior» claras y no solo por color.
 * - La versión activa se muestra en solo lectura, desde la instantánea: lo que ve el asesorado (REG-06-112). Para
 *   cambiarla: «Crear nueva versión a partir de esta» (DL-047).
 * - Un solo borrador por plan: si ya hay uno, se sigue sobre ese.
 * - Activar no se hace desde «Guardar» (B10-06:609): es un acto aparte, con su consecuencia a la vista.
 */
import {
  cantidad,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_CRITERIO,
  numero,
  type Bloque,
  type Prescripcion,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EditorDePlan } from './editor';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';

/** Número de versión para la persona: el orden de activación. El `version` del 09 es un token de concurrencia. */
function numerosDeVersion(versiones: readonly ResumenDeVersionDePlanDeEntrenamiento[]): Map<string, number> {
  const activadas = versiones.filter((v) => v.activatedAt).sort((a, b) => (a.activatedAt as string).localeCompare(b.activatedAt as string));
  return new Map(activadas.map((v, i) => [v.planId, i + 1]));
}

export function VistaDePlan() {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const [r, setR] = useState<Resultado<{ versiones: ResumenDeVersionDePlanDeEntrenamiento[]; activa: VersionDePlanDeEntrenamiento | null; objetivo: string | null }> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creando, setCreando] = useState(false);
  const intento = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setR(null);
    const [lista, ob] = await Promise.all([api.listarPlanesDeEntrenamiento(token, asesoradoId), api.objetivoDeEntrenamientoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(lista) || sesionPerdida(ob)) return;
    if (!lista.ok) return setR(lista as Resultado<never>);
    if (!ob.ok) return setR(ob as Resultado<never>);
    const efectiva = lista.datos.data.find((v) => v.isEffective);
    let activa: VersionDePlanDeEntrenamiento | null = null;
    if (efectiva) {
      const v = await api.consultarPlanDeEntrenamiento(token, efectiva.planId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return setR(v as Resultado<never>);
      activa = v.datos.data;
    }
    setR({ ok: true, datos: { versiones: lista.datos.data, activa, objetivo: ob.datos.data.objective?.versionId ?? null } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function crear(basadaEn: string | null) {
    if (!r?.ok || !r.datos.objetivo) return;
    setCreando(true);
    setAviso(null);
    const res = await api.crearPlanDeEntrenamiento(
      token,
      asesoradoId,
      basadaEn ? { objectiveVersionId: r.datos.objetivo, basedOnPlanId: basadaEn } : { objectiveVersionId: r.datos.objetivo, initialStructure: { blocks: [{ label: 'Bloque 1', sessions: [] }] } },
      intento.actual(),
    );
    intento.registrar(res);
    setCreando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    setAviso({ tipo: 'exito', texto: 'Borrador creado. No es visible para el asesorado hasta que lo actives.' });
    await cargar();
  }

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          {aviso ? (
            <Aviso tipo={aviso.tipo} enfocar>
              <p>{aviso.texto}</p>
            </Aviso>
          ) : null}
          {!r.datos.objetivo ? (
            <Aviso tipo="info">
              <p>Para planificar, primero definí el objetivo en Resumen: el plan se relaciona con el objetivo vigente.</p>
            </Aviso>
          ) : null}

          {(() => {
            const borrador = r.datos.versiones.find((v) => v.state === 'DRAFT');
            if (borrador) {
              return (
                <EditorDePlan
                  key={borrador.planId}
                  planId={borrador.planId}
                  onActivado={() => {
                    setAviso({ tipo: 'exito', texto: `${COPY_ENTRENAMIENTO.planActivado}. El asesorado ya ve esta planificación como vigente.` });
                    void cargar();
                  }}
                />
              );
            }
            return r.datos.objetivo ? (
              <div className="acciones">
                <button type="button" className="boton boton--primario" onClick={() => void crear(r.datos.activa?.planId ?? null)} disabled={creando}>
                  {r.datos.activa ? COPY_ENTRENAMIENTO.crearNuevaVersion : COPY_ENTRENAMIENTO.crearPlan}
                </button>
              </div>
            ) : null;
          })()}

          <section className="seccion" aria-labelledby="titulo-activo">
            <h2 id="titulo-activo">
              Plan activo {r.datos.activa ? <span className="insignia">{COPY_ENTRENAMIENTO.activo}</span> : null}
            </h2>
            {r.datos.activa ? <PlanSoloLectura version={r.datos.activa} numero={numerosDeVersion(r.datos.versiones).get(r.datos.activa.planId) ?? 1} /> : <p>{COPY_ENTRENAMIENTO.sinPlanActivo}</p>}
          </section>

          <section className="seccion" aria-labelledby="titulo-historial">
            <h2 id="titulo-historial">Historial</h2>
            <ol className="historial">
              {r.datos.versiones
                .filter((v) => v.state === 'ACTIVATED')
                .map((v) => (
                  <li key={v.planId}>
                    <span className="historial__evento">Versión {numerosDeVersion(r.datos.versiones).get(v.planId)}</span> · activada el {fecha(v.activatedAt as string)}{' '}
                    <span className="insignia">{v.isEffective ? COPY_ENTRENAMIENTO.activo : COPY_ENTRENAMIENTO.anterior}</span>
                  </li>
                ))}
            </ol>
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

/** Cómo se lee una prescripción: series y repeticiones, criterio de intensidad, carga sugerida aparte, parámetros. */
export function textoDePrescripcion(p: Prescripcion): string[] {
  // Todo número que se muestra pasa por `numero`/`cantidad`: coma decimal rioplatense (DL-091 punto 4).
  const reps = (s: Prescripcion['sets'][number]) =>
    !s.repetitions ? 'sin repeticiones fijadas' : 'value' in s.repetitions ? numero(s.repetitions.value) : `${numero(s.repetitions.min)}-${numero(s.repetitions.max)}`;
  const partes: string[] = [];
  if (p.sets.length > 0) {
    const iguales = p.sets.every((s) => reps(s) === reps(p.sets[0]!));
    partes.push(iguales ? `${numero(p.sets.length)} × ${reps(p.sets[0]!)}` : p.sets.map((s) => `Serie ${numero(s.setIndex)}: ${reps(s)}`).join(' · '));
  }
  partes.push(
    p.intensity
      ? `${COPY_ENTRENAMIENTO.intensidad}: ${ETIQUETA_DE_CRITERIO[p.intensity.criterion]} · ${COPY_ENTRENAMIENTO.objetivoDeIntensidad}: ${numero(p.intensity.target.value)}${
          p.intensity.criterion === 'PERCENT_RM' ? ' % RM' : ''
        }${p.intensity.target.reference ? ` (${p.intensity.target.reference.description})` : ''}`
      : COPY_ENTRENAMIENTO.sinCriterio,
  );
  if (p.suggestedLoad) partes.push(`${COPY_ENTRENAMIENTO.cargaSugerida}: ${cantidad(p.suggestedLoad.value, p.suggestedLoad.unit)}`);
  // Un parámetro profesional puede traer texto o número: solo se formatea cuando es número.
  for (const q of p.professionalParameters) partes.push(`${q.label}: ${typeof q.value === 'number' ? numero(q.value) : q.value}${q.unit ? ` ${q.unit}` : ''}`);
  if (p.note) partes.push(p.note);
  return partes;
}

function SesionSoloLectura({ sesion }: { sesion: Bloque['sessions'][number] }) {
  return (
    <div className="nodo nodo--comida">
      <h4>{sesion.label}</h4>
      {sesion.instructions ? <p className="nota">{sesion.instructions}</p> : null}
      <ul>
        {sesion.prescriptions.map((p) => (
          <li key={p.prescriptionId}>
            <strong>{p.exerciseName}</strong> · {textoDePrescripcion(p).join(' · ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La versión activada tal como la ve el asesorado: desde la instantánea, en solo lectura. */
function PlanSoloLectura({ version, numero }: { version: VersionDePlanDeEntrenamiento; numero: number }) {
  return (
    <>
      <p>
        Versión {numero} · activada el {fecha(version.activatedAt as string)}
      </p>
      {version.snapshotDigest ? (
        <p className="nota">
          Huella de la instantánea: <span className="huella">{version.snapshotDigest.slice(0, 16)}…</span>
        </p>
      ) : null}
      {version.blocks.map((b) => (
        <div key={b.blockId} className="nodo nodo--dia">
          <h3>
            {b.label}
            {b.purpose ? <span className="nota"> · {b.purpose}</span> : null}
          </h3>
          {b.microcycles.map((m) => (
            <div key={m.microcycleId} className="nodo nodo--opcion">
              <p className="lista__titulo">
                {COPY_ENTRENAMIENTO.microciclo}: {m.label}
                {m.purpose ? ` · ${m.purpose}` : ''}
              </p>
              {m.sessions.map((s) => (
                <SesionSoloLectura key={s.sessionId} sesion={s} />
              ))}
            </div>
          ))}
          {b.sessions.map((s) => (
            <SesionSoloLectura key={s.sessionId} sesion={s} />
          ))}
        </div>
      ))}
    </>
  );
}
