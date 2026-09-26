/**
 * APK · «Tu historial» de entrenamiento (DL-096, opción A; RF pertinentes de UC-P17).
 *
 * El titular tiene acceso pleno a su «Plan entrenamiento + ejecución» y el fin del vínculo no destruye su historia
 * (08:199, 08:58). DL-089 lo llevó a la API; hasta acá ninguna pantalla la usaba: «Hoy» y el registro en diferido
 * operan sobre el plan vigente y —correctamente— pasan a «no disponible» con el B2 revocado. Esta sección lee la
 * historia propia con las operaciones que ya existen:
 * - sus planes (API-TRN-08) y cada plan tal como se aceptó (API-TRN-09), reutilizados sin cambio;
 * - sus sesiones registradas por período (API-TRN-19-LISTA), la lista que faltaba (DL-096).
 *
 * Las tres exigen solo el A3 vigente del titular: no dependen de un plan activo ni de que el profesional conserve el
 * acceso. Por eso esta pantalla funciona aunque «Hoy» esté no disponible. Es de solo lectura: no corrige ni edita.
 * El detalle de cada sesión —con su original y sus correcciones, sin ocultar ninguno— es la pantalla de ejecución que
 * ya existe (API-TRN-19).
 */
import {
  COPY_ENTRENAMIENTO,
  etiquetaDeCondicionRegistrada,
  type HistorialDeEntrenamientoResponse,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia } from '../formato';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, Dato, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';
import { resumenDePrescripcion } from './entrenamiento';

type Ejecucion = HistorialDeEntrenamientoResponse['data']['executions'][number];

/** Estado de una lectura: cargando, permitida con datos, sin A3 (403), o error de red/servidor. */
type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'sinA3' } | { tipo: 'error'; sinConexion: boolean };

/** La ventana por defecto de «Tu historial»: los últimos 90 días, dentro del tope del contrato (hasta un año). */
function ultimos90Dias(): { periodStart: string; periodEnd: string } {
  const fin = new Date();
  const inicio = new Date(fin.getTime() - 89 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { periodStart: iso(inicio), periodEnd: iso(fin) };
}

export function PantallaDeHistorial({ token, identidadId, salir, ir }: { token: string; identidadId: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [sesiones, setSesiones] = useState<Carga<Ejecucion[]>>({ tipo: 'cargando' });
  const [planes, setPlanes] = useState<Carga<ResumenDeVersionDePlanDeEntrenamiento[]>>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setSesiones({ tipo: 'cargando' });
    setPlanes({ tipo: 'cargando' });
    const [s, p] = await Promise.all([api.misEjecucionesDeEntrenamiento(token, ultimos90Dias()), api.listarPlanesDeEntrenamiento(token, identidadId)]);
    if (sesionPerdida(s) || sesionPerdida(p)) return;
    // Un 403 acá es la falta de A3 vigente (08:406): no es «no hay datos», es «no se puede leer sin el consentimiento».
    setSesiones(s.ok ? { tipo: 'listo', datos: [...s.datos.data.executions] } : s.tipo === 'API' && s.codigo === 'ACTION_FORBIDDEN' ? { tipo: 'sinA3' } : { tipo: 'error', sinConexion: s.tipo === 'RED' });
    setPlanes(p.ok ? { tipo: 'listo', datos: [...p.datos.data] } : p.tipo === 'API' && p.codigo === 'ACTION_FORBIDDEN' ? { tipo: 'sinA3' } : { tipo: 'error', sinConexion: p.tipo === 'RED' });
  }, [token, identidadId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const sinA3 = sesiones.tipo === 'sinA3' || planes.tipo === 'sinA3';

  return (
    <View>
      <Titulo>{COPY_ENTRENAMIENTO.tuHistorial}</Titulo>
      <Parrafo tenue>{COPY_ENTRENAMIENTO.historialIntro}</Parrafo>

      {sinA3 ? (
        <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.historialNecesitaA3}>
          <Boton texto={COPY_ENTRENAMIENTO.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      ) : (
        <>
          <Seccion titulo={COPY_ENTRENAMIENTO.sesionesRegistradas}>
            {sesiones.tipo === 'cargando' ? <Cargando /> : null}
            {sesiones.tipo === 'error' ? <ErrorConReintento sinConexion={sesiones.sinConexion} onReintentar={cargar} /> : null}
            {sesiones.tipo === 'listo' && sesiones.datos.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.sinSesionesEnPeriodo}</Parrafo> : null}
            {sesiones.tipo === 'listo'
              ? sesiones.datos.map((e) => (
                  <Tarjeta key={e.executionId}>
                    <Parrafo>{e.plannedSession.label}</Parrafo>
                    {/* Fecha civil de la sesión: se ancla a mediodía UTC para que no retroceda un día en zonas al oeste de UTC (igual que el detalle y «Hoy»). */}
                    <Parrafo tenue>{dia(`${e.date}T12:00:00Z`)}</Parrafo>
                    <Insignia texto={etiquetaDeCondicionRegistrada(e.original)} />
                    {e.effectiveView.kind === 'CORRECTED' ? <Insignia texto={COPY_ENTRENAMIENTO.corregida} /> : null}
                    <Boton texto={COPY_ENTRENAMIENTO.verLaSesion} tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: e.executionId, origen: 'historial' })} />
                  </Tarjeta>
                ))
              : null}
          </Seccion>

          <Seccion titulo={COPY_ENTRENAMIENTO.tusPlanes}>
            {planes.tipo === 'cargando' ? <Cargando /> : null}
            {planes.tipo === 'error' ? <ErrorConReintento sinConexion={planes.sinConexion} onReintentar={cargar} /> : null}
            {planes.tipo === 'listo' && planes.datos.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.sinPlanesEnHistorial}</Parrafo> : null}
            {planes.tipo === 'listo'
              ? planes.datos.map((v) => (
                  <Tarjeta key={v.planId}>
                    <Parrafo>{v.professional.displayName}</Parrafo>
                    {v.activatedAt ? <Parrafo tenue>{dia(v.activatedAt)}</Parrafo> : null}
                    {v.isEffective ? <Insignia texto={COPY_ENTRENAMIENTO.vigente} positiva /> : null}
                    <Boton texto={COPY_ENTRENAMIENTO.verElPlan} tipo="secundario" onPress={() => ir({ nombre: 'plan-de-entrenamiento', id: v.planId })} />
                  </Tarjeta>
                ))
              : null}
          </Seccion>
        </>
      )}
    </View>
  );
}

// ─── Un plan tal como se aceptó (API-TRN-09), de solo lectura ───────────────────────────────────

/** Las sesiones de un plan: sueltas del bloque y dentro de sus microciclos, en el orden del contrato. */
function sesionesDe(plan: VersionDePlanDeEntrenamiento) {
  return plan.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]);
}

export function PantallaDePlanDeEntrenamiento({ token, id, salir }: { token: string; id: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga<VersionDePlanDeEntrenamiento>>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.consultarPlanDeEntrenamiento(token, id);
    if (sesionPerdida(r)) return;
    setCarga(r.ok ? { tipo: 'listo', datos: r.datos.data } : r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? { tipo: 'sinA3' } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (carga.tipo === 'cargando') return <Cargando />;
  if (carga.tipo === 'sinA3') return <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.historialNecesitaA3} />;
  if (carga.tipo === 'error') return <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} />;

  const plan = carga.datos;
  const sesiones = sesionesDe(plan);
  return (
    <View>
      <Titulo>{COPY_ENTRENAMIENTO.planHistoricoTitulo}</Titulo>
      <Parrafo tenue>{plan.professional.displayName}</Parrafo>
      {plan.activatedAt ? <Parrafo tenue>{dia(plan.activatedAt)}</Parrafo> : null}
      {plan.isEffective ? <Insignia texto={COPY_ENTRENAMIENTO.vigente} positiva /> : null}
      {/* La versión histórica se muestra tal como se aceptó: los nombres son los de su instantánea, no los del catálogo actual (REG-06-112). */}
      {sesiones.map((s) => (
        <Seccion key={s.sessionId} titulo={s.label}>
          {s.instructions ? <Parrafo tenue>{s.instructions}</Parrafo> : null}
          {s.prescriptions.length === 0 ? <Parrafo tenue>{COPY_ENTRENAMIENTO.sinPrescripciones}</Parrafo> : null}
          {s.prescriptions.map((p) => (
            <Dato key={p.prescriptionId} etiqueta={p.exerciseName} valor={resumenDePrescripcion(p)} />
          ))}
        </Seccion>
      ))}
      {sesiones.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.planSinSesiones}</Parrafo> : null}
    </View>
  );
}
