'use client';

/**
 * NUT-04 Plan (B05:355-398; 1301-1339): activo, borrador e historial.
 * - La versión activa se muestra en solo lectura, desde la instantánea: lo que ve el asesorado (REG-06-105). No hay
 *   botón que la edite (INV-06-109). Para corregirla: «Crear nueva versión a partir de esta» (CAND-NUT-D; DL-047).
 * - Un solo borrador por plan (REG-06-12): si ya hay uno, se sigue sobre ese.
 * - «Borrador creado», no «Plan creado correctamente» (B05:378-398).
 */
import { cantidad, COPY_NUTRICION, ETIQUETA_DE_PREPARACION, ETIQUETA_DE_UNIDAD, type VersionDePlan } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EditorDeBorrador } from './editor';
import { EstadoDeLectura, useNutricion } from './nutricion';

type Resumen = Omit<VersionDePlan, 'dayTypes'>;

/**
 * Número de versión para la persona: el orden de activación (1, 2, 3…). El campo `version` del 09 es el token de
 * concurrencia del recurso (09:255-257) y avanza con cada guardado: no sirve para mostrar.
 */
export function numerosDeVersion(versiones: readonly Resumen[]): Map<string, number> {
  const activadas = versiones.filter((v) => v.activatedAt).sort((a, b) => (a.activatedAt as string).localeCompare(b.activatedAt as string));
  return new Map(activadas.map((v, i) => [v.planId, i + 1]));
}

export function VistaDePlan() {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const [r, setR] = useState<Resultado<{ versiones: Resumen[]; activa: VersionDePlan | null; objetivo: string | null }> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creando, setCreando] = useState(false);
  const intento = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setR(null);
    const [lista, ob] = await Promise.all([api.listarPlanes(token, asesoradoId), api.objetivoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(lista) || sesionPerdida(ob)) return;
    if (!lista.ok) return setR(lista as Resultado<never>);
    if (!ob.ok) return setR(ob as Resultado<never>);
    const efectiva = lista.datos.data.find((v) => v.isEffective);
    let activa: VersionDePlan | null = null;
    if (efectiva) {
      const v = await api.consultarPlan(token, efectiva.planId);
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
    const res = await api.crearBorradorDePlan(
      token,
      asesoradoId,
      basadaEn
        ? { objectiveVersionId: r.datos.objetivo, basedOnPlanId: basadaEn }
        : { objectiveVersionId: r.datos.objetivo, initialStructure: { dayTypes: [{ label: 'Día habitual', meals: [] }] } },
      intento.actual(),
    );
    intento.registrar(res);
    setCreando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    setAviso({ tipo: 'exito', texto: COPY_NUTRICION.borradorCreado });
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
                <EditorDeBorrador
                  key={borrador.planId}
                  planId={borrador.planId}
                  onActivado={() => {
                    setAviso({ tipo: 'exito', texto: 'Versión activada. El asesorado ya ve esta planificación como vigente.' });
                    void cargar();
                  }}
                />
              );
            }
            return r.datos.objetivo ? (
              <div className="acciones">
                {r.datos.activa ? (
                  <button type="button" className="boton boton--primario" onClick={() => void crear(r.datos.activa!.planId)} disabled={creando}>
                    {COPY_NUTRICION.crearNuevaVersion}
                  </button>
                ) : (
                  <button type="button" className="boton boton--primario" onClick={() => void crear(null)} disabled={creando}>
                    {COPY_NUTRICION.crearNuevoPlan}
                  </button>
                )}
              </div>
            ) : null;
          })()}

          <section className="seccion" aria-labelledby="titulo-activo">
            <h2 id="titulo-activo">{COPY_NUTRICION.planActivo}</h2>
            {r.datos.activa ? <VersionSoloLectura version={r.datos.activa} numero={numerosDeVersion(r.datos.versiones).get(r.datos.activa.planId) ?? 1} /> : <p>{COPY_NUTRICION.sinPlanActivo}</p>}
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
                    <span className="historial__evento">Versión {numerosDeVersion(r.datos.versiones).get(v.planId)}</span> · activada el {fecha(v.activatedAt as string)}
                    {v.isEffective ? ' · vigente' : ' · anterior, conservada'}
                  </li>
                ))}
            </ol>
          </section>
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

/** La versión activada tal como la ve el asesorado: desde la instantánea, en solo lectura (B05:732-743, 1325-1339). */
export function VersionSoloLectura({ version, numero }: { version: VersionDePlan; numero: number }) {
  return (
    <>
      <p>
        <span className="insignia">{COPY_NUTRICION.soloLectura}</span> Versión {numero} · activada el {fecha(version.activatedAt as string)}
      </p>
      {version.snapshotDigest ? (
        <p className="nota">
          Huella de la instantánea: <span className="huella">{version.snapshotDigest.slice(0, 16)}…</span>
        </p>
      ) : null}
      {version.dayTypes.map((d) => (
        <div key={d.dayTypeId} className="nodo nodo--dia">
          <h3>{d.label}</h3>
          {d.meals.map((m) => (
            <div key={m.mealId} className="nodo nodo--comida">
              <h4>{m.label}</h4>
              {m.options.map((o) => (
                <div key={o.optionId} className="nodo nodo--opcion">
                  <p className="lista__titulo">{m.options.length > 1 ? `Opción ${o.order}: ${o.label}` : o.label}</p>
                  <ul>
                    {o.items.map((i) => (
                      <li key={i.itemId}>
                        {i.name}
                        {i.quantity ? ` · ${cantidad(i.quantity.value, ETIQUETA_DE_UNIDAD[i.quantity.unit])}` : ''}
                        {i.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[i.preparationState].toLowerCase()}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
