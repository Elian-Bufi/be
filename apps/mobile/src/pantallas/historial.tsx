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
  type HistorialDeEntrenamientoResponse,
  type Resultado,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { dia, ultimosDiasEnZona, ultimosDiasHasta } from '../formato';
import { DIAS_DEL_HISTORIAL, filaDePlan, filaDeSesion, TEXTOS_DEL_HISTORIAL, type FilaDelHistorial } from '../historial-en-filas';
import { Icono } from '../icono';
import { desgloseDeActividad } from '../inicio-de-hoy';
import { memoria, useLecturaRecordada } from '../lecturas';
import { DIAS_DE_ACTIVIDAD, leerActividadDeEntrenamiento } from '../lecturas-de-inicio';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { Aviso, Boton, Dato, EstadoVacio, estilosPorTema, Insignia, Parrafo, Seccion, Subtitulo, Titulo } from '../ui';
import { volverAHoy, type DondeSeVe } from '../volver-a-hoy';
import { textoDePrescripcion } from './entrenamiento';

type Ejecucion = HistorialDeEntrenamientoResponse['data']['executions'][number];

/** Estado de una lectura: cargando, permitida con datos, sin A3 (403), o error de red/servidor. */
type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'sinA3' } | { tipo: 'error'; sinConexion: boolean };

/**
 * La ventana por defecto de «Tu historial»: los últimos 90 días, dentro del tope del contrato (hasta un año). Las fechas
 * son civiles en **Buenos Aires, configurada acá de forma explícita**: coincide con la zona con la que hoy la API resuelve
 * «hoy» (`ZONA_POR_DEFECTO` del servidor). No se descubre de `period.timeZone` en tiempo de ejecución: si la zona del
 * servidor cambiara, esta constante tiene que cambiar con ella. Calcularlas en UTC pedía «mañana» de 21 a 24 h y la API
 * respondía 400 `PERIOD_IN_FUTURE` (validación en teléfono de la 0.11.1).
 */
const ZONA_DEL_HISTORIAL = 'America/Argentina/Buenos_Aires';
const ultimos90Dias = () => ultimosDiasEnZona(DIAS_DEL_HISTORIAL, ZONA_DEL_HISTORIAL);

export function PantallaDeHistorial({ token, identidadId, salir, ir }: { token: string; identidadId: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  return (
    <View>
      <Titulo>{COPY_ENTRENAMIENTO.tuHistorial}</Titulo>
      <ContenidoDelHistorial token={token} identidadId={identidadId} salir={salir} ir={ir} hoy={{ en: 'pantalla', recordar: (clave, vista) => memoria.recordarSeleccion(token, clave, vista), ir }} />
    </View>
  );
}

/**
 * El contenido de «Tu historial», sin título: la pantalla propia (desde Inicio y el menú) y la pestaña Historial de
 * Entrenamiento (WP-ENTRENAMIENTO-SERIES §7.1) muestran lo mismo.
 */
/**
 * Los mismos 30 días que «Tu actividad» de Inicio, desglosados: realizadas, con desvío y no realizadas. Es la misma
 * lectura, con la misma clave (`leerActividadDeEntrenamiento`), así el total coincide con el número de Inicio (AVD-2). Un
 * día sin registro no cuenta como «no realizada» (DL-106). Mientras se lee o si falla, no se dibuja: la lista de abajo
 * dice lo suyo.
 */
function DesgloseDe30Dias({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const hoy = useDiaDeLaApi();
  const periodo = useMemo(() => ultimosDiasHasta(hoy, DIAS_DE_ACTIVIDAD), [hoy]);
  const pedir = useCallback(() => leerActividadDeEntrenamiento(api, token, periodo), [token, periodo]);
  const { r } = useLecturaRecordada(token, `inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`, pedir, sesionPerdida);
  if (!r?.ok || r.datos.registradas === 0) return null;
  return <Parrafo>{desgloseDeActividad(r.datos).texto}</Parrafo>;
}

export function ContenidoDelHistorial({
  token,
  identidadId,
  salir,
  ir,
  hoy,
}: {
  token: string;
  identidadId: string;
  salir: (m: Salida) => void;
  ir: (r: Ruta) => void;
  /** Dónde se ve: en la pestaña, «Ir a Entrenamiento» elige Hoy; en la pantalla propia, la deja recordada y va. */
  hoy: DondeSeVe;
}) {
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
      <Parrafo tenue>{COPY_ENTRENAMIENTO.historialIntro}</Parrafo>
      {/* DL-166 (AV-07, AVD-2): el desglose de los últimos 30 días, con la misma lectura que el número de Inicio. */}
      {sinA3 ? null : <DesgloseDe30Dias token={token} sesionPerdida={sesionPerdida} />}

      {sinA3 ? (
        <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.historialNecesitaA3}>
          <Boton texto={COPY_ENTRENAMIENTO.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      ) : (
        <>
          <Seccion titulo={COPY_ENTRENAMIENTO.sesionesRegistradas}>
            {sesiones.tipo === 'cargando' ? <Cargando /> : null}
            {sesiones.tipo === 'error' ? <ErrorConReintento sinConexion={sesiones.sinConexion} onReintentar={cargar} /> : null}
            {sesiones.tipo === 'listo' && sesiones.datos.length === 0 ? <EstadoVacio icono="calendario" {...TEXTOS_DE_LA_VUELTA.vacios.sinSesionesEnElPeriodo} accion={{ texto: TEXTOS_DE_LA_VUELTA.vacios.sinSesionesEnElPeriodo.accion, onPress: () => volverAHoy('entrenamiento', hoy) }} /> : null}
            {/* AV2-22: la lista dice su período, y cada sesión es una fila que se toca entera, sin botón propio. */}
            <Text style={estilos.periodo}>{TEXTOS_DEL_HISTORIAL.periodo}</Text>
            {sesiones.tipo === 'listo'
              ? sesiones.datos.map((e, i) => (
                  <FilaQueAbreElHistorial key={e.executionId} fila={filaDeSesion(e)} ultima={i === sesiones.datos.length - 1} onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: e.executionId })} />
                ))
              : null}
          </Seccion>

          <Seccion titulo={COPY_ENTRENAMIENTO.tusPlanes}>
            {planes.tipo === 'cargando' ? <Cargando /> : null}
            {planes.tipo === 'error' ? <ErrorConReintento sinConexion={planes.sinConexion} onReintentar={cargar} /> : null}
            {planes.tipo === 'listo' && planes.datos.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.sinPlanesEnHistorial}</Parrafo> : null}
            {planes.tipo === 'listo'
              ? planes.datos.map((v, i) => (
                  <FilaQueAbreElHistorial key={v.planId} fila={filaDePlan(v)} ultima={i === planes.datos.length - 1} onPress={() => ir({ nombre: 'plan-de-entrenamiento', id: v.planId })} />
                ))
              : null}
          </Seccion>
        </>
      )}
    </View>
  );
}

/**
 * Una fila de «Tu historial» (AV2-22): el nombre, la fecha y el estado como etiqueta neutra, con la tilde si fue
 * realizada; el detalle en `tenue`, en una línea, y la flecha. Va dentro de la sección, que ya es de vidrio: la fila no
 * suma una superficie, solo la línea que la separa de la siguiente. Se toca entera y TalkBack la lee como un botón.
 */
function FilaQueAbreElHistorial({ fila, ultima, onPress }: { fila: FilaDelHistorial; ultima: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={fila.paraLeer} onPress={onPress} style={({ pressed }) => [estilos.fila, !ultima && estilos.conLinea, pressed && estilos.presionada]}>
      <View style={estilos.textos} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text style={estilos.titulo}>{fila.titulo}</Text>
        <View style={estilos.lineaDeEstado}>
          {fila.fecha ? <Text style={estilos.fecha}>{fila.fecha}</Text> : null}
          {fila.estado ? <Insignia texto={fila.estado} hecha={fila.hecha} /> : null}
        </View>
        {fila.detalle ? (
          <Text style={estilos.detalle} numberOfLines={1}>
            {fila.detalle}
          </Text>
        ) : null}
      </View>
      <Icono nombre="derecha" tamano={20} tono="tenue" />
    </Pressable>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  periodo: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: COLOR.tenue, marginTop: -2, marginBottom: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10 },
  conLinea: { borderBottomWidth: 1, borderBottomColor: COLOR.borde },
  presionada: { opacity: 0.6 },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, lineHeight: 22, fontWeight: '800', color: COLOR.texto },
  lineaDeEstado: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10 },
  fecha: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  detalle: { fontSize: 13, lineHeight: 18, color: COLOR.tenue },
}));

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
      {plan.isEffective ? <Insignia texto={COPY_ENTRENAMIENTO.vigente} /> : null}
      {/* La versión histórica se muestra tal como se aceptó: los nombres son los de su instantánea, no los del catálogo actual (REG-06-112). */}
      {sesiones.map((s) => (
        <Seccion key={s.sessionId} titulo={s.label}>
          {s.instructions ? <Parrafo tenue>{s.instructions}</Parrafo> : null}
          {s.prescriptions.length === 0 ? <Parrafo tenue>{COPY_ENTRENAMIENTO.sinPrescripciones}</Parrafo> : null}
          {s.prescriptions.map((p) => (
            <Dato key={p.prescriptionId} etiqueta={p.exerciseName} valor={textoDePrescripcion(p)} apilado />
          ))}
        </Seccion>
      ))}
      {sesiones.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.planSinSesiones}</Parrafo> : null}
    </View>
  );
}
