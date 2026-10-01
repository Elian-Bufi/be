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
  COPY_ENTRENAMIENTO,
  COPY_PLANTILLAS,
  estructuraComoEntrada,
  lineasDePrescripcion,
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
import { DialogoGuardarPlantilla, InicioDesdePlantilla } from './plantillas';

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
  // «Guardar como plantilla» sobre la versión activa (PF-09; DL-108): abre el diálogo con la estructura de esa versión.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  // Cada plantilla guardada vuelve a cargar el selector «Empezar desde una plantilla», que la lista al montarse.
  const [plantillasGuardadas, setPlantillasGuardadas] = useState(0);
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

  /** Crear el borrador desde una plantilla propia (API-TRN-07 con `fromTemplateVersionId`): nace de la persona, con su objetivo. */
  async function aplicar(templateVersionId: string) {
    if (!r?.ok || !r.datos.objetivo) return;
    setCreando(true);
    setAviso(null);
    const res = await api.crearPlanDeEntrenamiento(token, asesoradoId, { objectiveVersionId: r.datos.objetivo, fromTemplateVersionId: templateVersionId }, intento.actual());
    intento.registrar(res);
    setCreando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setAviso({ tipo: 'error', texto: res.tipo === 'API' && res.codigo === 'TEMPLATE_ARCHIVED' ? COPY_PLANTILLAS.archivadaNoSeAplica : mensajeDeFallo(res) });
    setAviso({ tipo: 'exito', texto: COPY_PLANTILLAS.aplicada });
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
              <>
                <div className="acciones">
                  <button type="button" className="boton boton--primario" onClick={() => void crear(r.datos.activa?.planId ?? null)} disabled={creando}>
                    {r.datos.activa ? COPY_ENTRENAMIENTO.crearNuevaVersion : COPY_ENTRENAMIENTO.crearPlan}
                  </button>
                </div>
                <InicioDesdePlantilla key={plantillasGuardadas} token={token} deshabilitado={creando} onAplicar={(id) => void aplicar(id)} />
              </>
            ) : null;
          })()}

          <section className="seccion" aria-labelledby="titulo-activo">
            <h2 id="titulo-activo">
              Plan activo {r.datos.activa ? <span className="insignia">{COPY_ENTRENAMIENTO.activo}</span> : null}
            </h2>
            {r.datos.activa ? <PlanSoloLectura version={r.datos.activa} numero={numerosDeVersion(r.datos.versiones).get(r.datos.activa.planId) ?? 1} /> : <p>{COPY_ENTRENAMIENTO.sinPlanActivo}</p>}
            {r.datos.activa ? (
              <>
                <div className="acciones">
                  <button type="button" className="boton boton--secundario" onClick={() => setGuardarPlantilla(true)}>
                    {COPY_PLANTILLAS.guardarComoPlantilla}
                  </button>
                </div>
                <DialogoGuardarPlantilla
                  token={token}
                  abierto={guardarPlantilla}
                  estructura={{ blocks: estructuraComoEntrada(r.datos.activa) }}
                  origen={r.datos.activa.planId}
                  onCerrar={() => setGuardarPlantilla(false)}
                  onGuardada={() => {
                    setGuardarPlantilla(false);
                    setPlantillasGuardadas((n) => n + 1);
                    setAviso({ tipo: 'exito', texto: COPY_PLANTILLAS.guardada });
                  }}
                />
              </>
            ) : null}
          </section>

          <section className="seccion" aria-labelledby="titulo-historial">
            <h2 id="titulo-historial">Historial</h2>
            {/* Una sección vacía no dice nada: la ausencia se dice (B10-10 §16). */}
            {r.datos.versiones.some((v) => v.state === 'ACTIVATED') ? null : <p className="nota">Todavía no se activó ninguna versión.</p>}
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

/**
 * Lo planificado de una prescripción, una línea por dato, con la presentación que comparte con la APK (DL-105): todas
 * las series con sus notas, la intensidad con su referencia, la carga sugerida, los parámetros y la nota. Sin criterio
 * de intensidad, el website lo dice: el profesional tiene que verlo.
 */
export function LineasDePrescripcion({ prescripcion }: { prescripcion: Prescripcion }) {
  return (
    <ul className="lista-compacta">
      {lineasDePrescripcion(prescripcion, { sinCriterioExplicito: true }).map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

function SesionSoloLectura({ sesion }: { sesion: Bloque['sessions'][number] }) {
  return (
    <div className="nodo nodo--comida">
      <h4>{sesion.label}</h4>
      {sesion.instructions ? <p className="nota">{sesion.instructions}</p> : null}
      <ul>
        {sesion.prescriptions.map((p) => (
          <li key={p.prescriptionId}>
            <strong>{p.exerciseName}</strong>
            <LineasDePrescripcion prescripcion={p} />
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
