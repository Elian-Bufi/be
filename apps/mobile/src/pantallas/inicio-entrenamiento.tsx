/**
 * Inicio · las tarjetas de Entrenamiento (DL-117): las sesiones de hoy con su estado real, y la actividad de los últimos
 * 30 días. Abrir un borrador usa el mismo circuito de Entrenamiento (`useAbrirOcurrencia`) y va solo al tocar: «Iniciar
 * entrenamiento» empieza la sesión enfocada, y «Continuar entrenamiento» retoma la que corre en este teléfono
 * (WP-ENTRENAMIENTO-SERIES §7.1). Una sesión en curso de otro día o de otro dispositivo (API-TIE-04) se muestra arriba,
 * para continuarla o dejarla incompleta, como en Entrenamiento: con ella abierta no se inicia otra (`sesion-en-curso.ts`).
 */
import {
  COPY_AGENDA_DE_ENTRENAMIENTO as AG,
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  numero,
  vistaDeOcurrencia,
  type HoyDeEntrenamientoResponse,
  type Ocurrencia,
  type Resultado,
} from '@be/domain';
import { useCallback, useMemo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { corridaAbierta } from '../corrida-de-entrenamiento';
import { useEntrenamientoLocal } from '../entrenamiento-en-curso';
import { SinActualizar } from '../estados';
import { ejerciciosYSeries } from '../series-de-la-sesion';
import { fechaCivil, ultimosDiasHasta } from '../formato';
import { iconoDelEstado } from '../iconos-de-entrenamiento';
import { useLecturaRecordada } from '../lecturas';
import { detalleDeActividad, DIAS_DE_ACTIVIDAD, leerActividadDeEntrenamiento } from '../lecturas-de-inicio';
import { useAccesoRetirado, type Ir } from '../navegacion';
import { sePuedeOfrecer, TEXTOS_DEL_REGISTRO_RAPIDO } from '../registro-rapido';
import { sesionEnCursoParaMostrar, sesionRealizada } from '../sesion-en-curso';
import { actividadEnUnNumero, detalleDeLaSesion } from '../inicio-de-hoy';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { Aviso, Boton, Cifra, Desplegable, Insignia, Parrafo } from '../ui';
import { AvisoDeEntrenamientoEnCurso, MOTIVO_ANTES_DE_INICIAR, useAbrirOcurrencia } from './entrenamiento';
import { AlLado, aRegistroRapido } from './registro-rapido';
import { estilos, faltaElA3, LineaDeInicio, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-TRN-14, con la misma clave que Entrenamiento de hoy. Sin el A3, la API responde «no disponible», no un 403. */
export function EntrenamientoDeHoy({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback((): Promise<Resultado<HoyDeEntrenamientoResponse>> => api.hoyDeEntrenamiento(token), [token]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `entrenamiento-hoy:${dia}`, pedir, sesionPerdida);
  // La sesión en curso de cualquier día y dispositivo (API-TIE-04), con la misma clave que Entrenamiento; si la API no la
  // da, vale la del teléfono.
  const pedirEnCurso = useCallback(() => api.sesionEnCurso(token), [token]);
  const enCurso = useLecturaRecordada(token, 'entrenamiento-en-curso', pedirEnCurso, sesionPerdida);
  // DL-137: con agenda, Inicio muestra lo que toca hoy y lo pendiente (la misma lectura que Entrenamiento, API-AGE-01).
  const pedirAgenda = useCallback(() => api.agendaDeEntrenamiento(token), [token]);
  const lecturaDeLaAgenda = useLecturaRecordada(token, `entrenamiento-agenda:${dia}`, pedirAgenda, sesionPerdida);
  const agenda = lecturaDeLaAgenda.r?.ok && lecturaDeLaAgenda.r.datos.data.planState === 'AVAILABLE' && lecturaDeLaAgenda.r.datos.data.startDate ? lecturaDeLaAgenda.r.datos.data : null;
  const local = useEntrenamientoLocal();
  const remota = enCurso.r?.ok ? enCurso.r.datos.data.inProgress : null;
  const ahora = sesionEnCursoParaMostrar(remota, local.sesiones());
  // Abrir un borrador es una escritura: con el 404 no revelador, la tarjeta retira lo que mostraba (B10-06:1145-1148).
  const { retirado, accesoRetirado } = useAccesoRetirado();
  let contenido: ReactNode;
  if (retirado) contenido = <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>;
  else if (!r) contenido = <Verificando />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    const hoy = r.datos.data;
    // Una sesión en curso que no es de las de hoy (de otro día): se ofrece continuarla o dejarla incompleta.
    const deOtroDia = ahora && !hoy.occurrences.some((o) => o.occurrenceId === ahora.occurrenceId) ? ahora : null;
    const avisoDeOtroDia = deOtroDia ? (
      <AvisoDeEntrenamientoEnCurso
        enCurso={deOtroDia}
        token={token}
        sesionPerdida={sesionPerdida}
        ir={ir}
        alTerminar={() => {
          void enCurso.cargar();
          void cargar();
        }}
      />
    ) : null;
    // AV-17: sin plan, una línea con el texto de siempre, no una tarjeta (salvo que haya una sesión de otro día abierta).
    if (hoy.planState === 'NO_ACTIVE_PLAN' && !avisoDeOtroDia) return <LineaDeInicio zona="entrenamiento" texto={COPY_ENTRENAMIENTO.sinPlanAsesorado} />;
    if (hoy.planState === 'NO_ACTIVE_PLAN') contenido = <Parrafo>{COPY_ENTRENAMIENTO.sinPlanAsesorado}</Parrafo>;
    else if (hoy.planState === 'NOT_AVAILABLE')
      contenido = (
        <>
          <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>
          <Boton texto="Ver tus vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </>
      );
    else if (hoy.occurrences.length === 0)
      contenido = (
        <>
          {avisoDeOtroDia}
          <Parrafo>Tu plan no tiene sesiones para hoy.</Parrafo>
        </>
      );
    else if (agenda) {
      // Con agenda: solo la sesión de hoy, y lo pendiente en un renglón (se resuelve en Entrenamiento).
      const etiqueta = (sessionId: string): string => hoy.occurrences.find((o) => o.plannedSession.sessionId === sessionId)?.plannedSession.label ?? AG.sesion;
      const deHoy = hoy.occurrences.filter((o) => agenda.today.some((f) => f.sessionId === o.plannedSession.sessionId));
      contenido = (
        <>
          {avisoDeOtroDia}
          {deHoy.length === 0 ? <Parrafo>{AG.hoyNoHaySesion}</Parrafo> : null}
          {deHoy.map((o) => (
            <SesionDeHoy key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} enCurso={ahora?.occurrenceId === o.occurrenceId} />
          ))}
          {agenda.pending.map((p) => (
            <Parrafo key={p.occurrenceId}>{`${AG.tePendiente}: ${AG.pendiente(etiqueta(p.sessionId), p.plannedDate)}`}</Parrafo>
          ))}
          {deHoy.length === 0 && agenda.upcoming[0] ? <Parrafo tenue>{AG.proxima(etiqueta(agenda.upcoming[0].sessionId), agenda.upcoming[0].plannedDate, hoy.date)}</Parrafo> : null}
        </>
      );
    } else
      contenido = (
        <>
          {avisoDeOtroDia}
          {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
          {hoy.occurrences.map((o) => (
            <SesionDeHoy key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} enCurso={ahora?.occurrenceId === o.occurrenceId} />
          ))}
        </>
      );
  }
  return (
    <TarjetaDeInicio zona="entrenamiento" titulo={COPY_ENTRENAMIENTO.entrenamientoDeHoy}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
    </TarjetaDeInicio>
  );
}

/** Una sesión de hoy con su estado real. «Registrada · No realizada» no se presenta como hecha. */
function SesionDeHoy({
  ocurrencia: o,
  hoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
  enCurso,
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
  /** Si esta es la sesión en curso, en este teléfono o según la API. */
  enCurso: boolean;
}) {
  const { abriendo, fallo, abrir, otraEnCurso } = useAbrirOcurrencia({ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir });
  const vista = vistaDeOcurrencia(o, hoy);
  const local = useEntrenamientoLocal();
  // «Continuar» si hay un borrador en curso, si es la sesión en curso o si en este teléfono corre su entrenamiento.
  const continuar = enCurso || o.execution.state === 'DRAFT_IN_PROGRESS' || local.sesiones().some((s) => s.occurrenceId === o.occurrenceId && corridaAbierta(s.corrida));
  const executionId = o.execution.state === 'REGISTERED' ? o.execution.executionId : null;
  // PA-03 (DL-160): «Ya la hice», al lado de «Iniciar entrenamiento», para registrarla por pasos y sin cronómetros.
  const yaLaHice = !continuar && sePuedeOfrecer(o, enCurso, local.sesiones());
  // DL-166 (AV-06): el nombre y el estado a la vista; el bloque, la semana y los ejercicios, plegados (III.7).
  const detalle = detalleDeLaSesion(o.plannedSession);
  return (
    <View style={estilos.fila}>
      <Text style={estilos.nombre}>{o.plannedSession.label}</Text>
      <Insignia texto={vista.texto} hecha={sesionRealizada(o.execution)} etiqueta="Estado" icono={iconoDelEstado(o.execution)} />
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {/* Otra sesión en curso: continuarla o dejarla incompleta; dejada incompleta, se vuelve a intentar iniciar esta. */}
      {otraEnCurso ? <AvisoDeEntrenamientoEnCurso enCurso={otraEnCurso} token={token} sesionPerdida={sesionPerdida} ir={ir} alTerminar={() => void abrir()} motivo={MOTIVO_ANTES_DE_INICIAR} /> : null}
      {executionId ? (
        <Boton texto="Ver registro" tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: executionId })} />
      ) : (
        <AlLado>
          <Boton texto={continuar ? COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento : TEXTOS_DE_LA_VUELTA.empezar} onPress={() => void abrir()} ocupado={abriendo} />
          {yaLaHice ? <Boton texto={TEXTOS_DEL_REGISTRO_RAPIDO.yaLaHice} tipo="secundario" onPress={() => ir(aRegistroRapido(o))} deshabilitado={abriendo} icono="ya-la-hice" /> : null}
        </AlLado>
      )}
      <Desplegable titulo={ejerciciosYSeries(o.plannedSession.prescriptions)} icono="lista">
        {detalle.bloque ? <Text style={estilos.detalle}>{detalle.bloque}</Text> : null}
        {detalle.ejercicios.map((e) => (
          <Text key={e} style={estilos.renglonDeDato}>
            {e}
          </Text>
        ))}
        {detalle.yMas ? <Text style={estilos.detalle}>{detalle.yMas}</Text> : null}
      </Desplegable>
    </View>
  );
}

// ─── Actividad de entrenamiento ─────────────────────────────────────────────────────────────────

/** API-TRN-19-LISTA, la lista de «Tu historial», de los últimos 30 días: solo se cuenta. */
export function ActividadDeEntrenamiento({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const periodo = useMemo(() => ultimosDiasHasta(dia, DIAS_DE_ACTIVIDAD), [dia]);
  const pedir = useCallback(() => leerActividadDeEntrenamiento(api, token, periodo), [token, periodo]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`, pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_ENTRENAMIENTO.historialNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    // DL-166 (PV-5): un solo número, las sesiones registradas en 30 días. El desglose está en «Tu historial» (AV-07).
    const a = actividadEnUnNumero(r.datos);
    contenido =
      a.numero === 0 ? (
        <Parrafo>No registraste sesiones en estos días.</Parrafo>
      ) : (
        <View accessible accessibilityLabel={a.paraLeer}>
          <Cifra valor={numero(a.numero)} unidad={a.unidad} tamano={26} />
        </View>
      );
  }
  return (
    <TarjetaDeInicio
      zona="entrenamiento"
      titulo="Tu actividad"
      icono="linea-de-tiempo"
      detalle={detalleDeActividad(r && r.ok ? r.datos.periodo : null, fechaCivil)}
    >
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ver tu historial" tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'historial-de-entrenamiento' })} />
    </TarjetaDeInicio>
  );
}
