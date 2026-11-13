/**
 * Inicio · las tarjetas de Entrenamiento (DL-117, DL-166 y DL-170): las sesiones de hoy con su estado real, y la actividad
 * de los últimos 30 días. Abrir un borrador usa el mismo circuito de Entrenamiento (`useAbrirOcurrencia`) y va solo al
 * tocar: «Empezar» empieza la sesión enfocada (WP-ENTRENAMIENTO-SERIES §7.1).
 *
 * **Con una sesión en curso** (API-TIE-04, o la corrida del teléfono si la API no responde), Inicio muestra solo esa
 * (DL-170, AV2-09; error 1 de la crítica de la 0.23, cuando las otras seguían ofreciendo «Empezar»): su nombre, «En
 * curso» o «En pausa» como etiqueta neutra con el reloj, «2 ejercicios · 7 series» y, si la corrida es de este teléfono,
 * el ejercicio y la serie («Sentadilla goblet · serie 3»); «Continuar», ancho, y «Ver las N sesiones ›». Si es de otro
 * día, también «Dejarlo incompleto». «Ya la hice» de otras sesiones no se ofrece acá (AV2-D4): queda en Entrenamiento.
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
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { corridaAbierta } from '../corrida-de-entrenamiento';
import { useEntrenamientoLocal } from '../entrenamiento-en-curso';
import { SinActualizar } from '../estados';
import { ejerciciosYSeries } from '../series-de-la-sesion';
import { fechaCivil } from '../formato';
import { useLecturaRecordada, type LecturaRecordada } from '../lecturas';
import type { ActividadDeEntrenamiento as ActividadLeida } from '../lecturas-de-inicio';
import { useAccesoRetirado, type Ir } from '../navegacion';
import { sePuedeOfrecer, TEXTOS_DEL_REGISTRO_RAPIDO } from '../registro-rapido';
import { lineaDeLaSerie, marchaDeLaSesionEnCurso, sesionEnCursoParaMostrar, vistaDeLaSesion, type EnCurso, type MarchaDeLaCorrida } from '../sesion-en-curso';
import { actividadDeInicio, detalleDeLaSesion } from '../inicio-de-hoy';
import { TEXTOS_DE_LA_VUELTA, TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { Aviso, Boton, Cifra, Desplegable, Insignia, Parrafo } from '../ui';
import { AvisoDeEntrenamientoEnCurso, MOTIVO_ANTES_DE_INICIAR, useAbrirOcurrencia, useDejarIncompleto } from './entrenamiento';
import { AlLado, aRegistroRapido } from './registro-rapido';
import { estilos, faltaElA3, LineaDeInicio, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/**
 * API-TRN-14, con la misma clave que Entrenamiento de hoy. Sin el A3, la API responde «no disponible», no un 403. La
 * lectura la hace Inicio y la comparte con la tira de la semana (AV2-08), así no se pide dos veces.
 */
export function EntrenamientoDeHoy({
  token,
  dia,
  lectura,
  sesionPerdida,
  ir,
}: {
  token: string;
  dia: string;
  lectura: LecturaRecordada<HoyDeEntrenamientoResponse>;
  sesionPerdida: AlPerderLaSesion;
  ir: Ir;
}) {
  const { r, cargar, sinActualizar } = lectura;
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
  // La corrida de este teléfono, si la sesión en curso corre acá: de ella salen la pausa (si la API no respondió) y la serie.
  const delTelefono = ahora ? (local.sesiones().find((s) => s.draftId === ahora.draftId) ?? null) : null;
  // Abrir un borrador es una escritura: con el 404 no revelador, la tarjeta retira lo que mostraba (B10-06:1145-1148).
  const { retirado, accesoRetirado } = useAccesoRetirado();
  let contenido: ReactNode;
  if (retirado) contenido = <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>;
  else if (!r) contenido = <Verificando />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else if (ahora) {
    // AV2-09: con una sesión en curso se ve solo esa. Ninguna otra ofrece empezar.
    const deHoy = r.datos.data.occurrences.find((o) => o.occurrenceId === ahora.occurrenceId) ?? null;
    contenido = (
      <SesionEnCursoDeInicio
        enCurso={ahora}
        marcha={marchaDeLaSesionEnCurso(remota, delTelefono)}
        prescripciones={deHoy?.plannedSession.prescriptions ?? delTelefono?.sesion?.prescriptions ?? null}
        serie={lineaDeLaSerie(delTelefono)}
        sesiones={r.datos.data.occurrences.length}
        deOtroDia={deHoy === null}
        token={token}
        sesionPerdida={sesionPerdida}
        ir={ir}
        alTerminar={() => {
          void enCurso.cargar();
          void cargar();
        }}
      />
    );
  } else {
    const hoy = r.datos.data;
    // AV-17: sin plan, una línea con el texto de siempre, no una tarjeta.
    if (hoy.planState === 'NO_ACTIVE_PLAN') return <LineaDeInicio zona="entrenamiento" texto={COPY_ENTRENAMIENTO.sinPlanAsesorado} />;
    if (hoy.planState === 'NOT_AVAILABLE')
      contenido = (
        <>
          <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>
          <Boton texto="Ver tus vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </>
      );
    else if (hoy.occurrences.length === 0) contenido = <Parrafo>Tu plan no tiene sesiones para hoy.</Parrafo>;
    else if (agenda) {
      // Con agenda: solo la sesión de hoy, y lo pendiente en un renglón (se resuelve en Entrenamiento).
      const etiqueta = (sessionId: string): string => hoy.occurrences.find((o) => o.plannedSession.sessionId === sessionId)?.plannedSession.label ?? AG.sesion;
      const deHoy = hoy.occurrences.filter((o) => agenda.today.some((f) => f.sessionId === o.plannedSession.sessionId));
      contenido = (
        <>
          {deHoy.length === 0 ? <Parrafo>{AG.hoyNoHaySesion}</Parrafo> : null}
          {deHoy.map((o) => (
            <SesionDeHoy key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} />
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
          {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
          {hoy.occurrences.map((o) => (
            <SesionDeHoy key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} />
          ))}
        </>
      );
  }
  return (
    <TarjetaDeInicio zona="entrenamiento" titulo={T.entrenamiento}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
    </TarjetaDeInicio>
  );
}

/**
 * La sesión en curso, sola (AV2-09): la etiqueta neutra con el reloj, el nombre, lo que tiene y, si corre en este
 * teléfono, el ejercicio y la serie; «Continuar», ancho, y «Ver las N sesiones ›». Si es de otro día, también «Dejarlo
 * incompleto», que pregunta antes de escribir.
 */
function SesionEnCursoDeInicio({
  enCurso: e,
  marcha,
  prescripciones,
  serie,
  sesiones,
  deOtroDia,
  token,
  sesionPerdida,
  ir,
  alTerminar,
}: {
  enCurso: EnCurso;
  marcha: MarchaDeLaCorrida;
  /** Las de la sesión de hoy o las de la corrida del teléfono: solo se cuentan. */
  prescripciones: readonly { readonly sets: readonly unknown[] }[] | null;
  serie: string | null;
  sesiones: number;
  deOtroDia: boolean;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  ir: Ir;
  alTerminar: () => void;
}) {
  const { dejando, fallo, dejarIncompleto } = useDejarIncompleto({ enCurso: e, token, sesionPerdida, alTerminar });
  const lo = [prescripciones ? ejerciciosYSeries(prescripciones) : null, deOtroDia ? fechaCivil(e.fecha) : null].filter((p): p is string => p !== null).join(' · ');
  return (
    <View>
      <Insignia texto={marcha === 'en-pausa' ? T.enPausa : COPY_ENTRENAMIENTO.enCurso} icono="reloj" etiqueta="Estado" />
      <Text style={estilos.nombre}>{e.etiqueta}</Text>
      {lo ? <Text style={estilos.detalle}>{lo}</Text> : null}
      {serie ? <Text style={estilos.detalle}>{serie}</Text> : null}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      <Boton
        texto={T.continuar}
        etiqueta={`${T.continuar} ${e.etiqueta}`}
        onPress={() => ir({ nombre: 'sesion-de-entrenamiento', draftId: e.draftId, occurrenceId: e.occurrenceId, fecha: e.fecha, modo: 'en-vivo', etiqueta: e.etiqueta })}
      />
      {deOtroDia ? <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.dejarSesionIncompleta} tipo="secundario" onPress={() => void dejarIncompleto()} ocupado={dejando} /> : null}
      {sesiones > 1 ? <Boton texto={T.verLasSesiones(sesiones)} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'entrenamiento' })} /> : null}
    </View>
  );
}

/**
 * Una sesión de hoy con su estado real, sin otra en curso. «Registrada · No realizada» no se presenta como hecha, y un
 * borrador sin corrida no dice «En curso» (AV2-09).
 */
function SesionDeHoy({
  ocurrencia: o,
  hoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
}) {
  const { abriendo, fallo, abrir, otraEnCurso } = useAbrirOcurrencia({ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir });
  const vista = vistaDeLaSesion(vistaDeOcurrencia(o, hoy), o.execution, null);
  const local = useEntrenamientoLocal();
  // «Continuar» si hay un borrador en curso o si en este teléfono corre su entrenamiento.
  const continuar = o.execution.state === 'DRAFT_IN_PROGRESS' || local.sesiones().some((s) => s.occurrenceId === o.occurrenceId && corridaAbierta(s.corrida));
  const executionId = o.execution.state === 'REGISTERED' ? o.execution.executionId : null;
  // PA-03 (DL-160): «Ya la hice», al lado de «Empezar», para registrarla por pasos y sin cronómetros.
  const yaLaHice = !continuar && sePuedeOfrecer(o, false, local.sesiones());
  // DL-166 (AV-06): el nombre y el estado a la vista; el bloque, la semana y los ejercicios, plegados (III.7).
  const detalle = detalleDeLaSesion(o.plannedSession);
  return (
    <View style={estilos.fila}>
      <Text style={estilos.nombre}>{o.plannedSession.label}</Text>
      <Insignia texto={vista.texto} hecha={vista.hecha} etiqueta="Estado" icono={vista.icono} />
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {/* La red de seguridad: si la lectura estaba vieja y había otra en curso, se ofrece continuarla o dejarla incompleta. */}
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

// ─── La actividad de 30 días, en una tarjeta chica (AV2-07, AV2-12) ─────────────────────────────

/**
 * API-TRN-19-LISTA, la lista de «Tu historial», de los últimos 30 días: solo se cuenta. La lectura la hace Inicio y la
 * comparte con la tira de la semana; es la misma clave que «Tu historial». Una tarjeta chica, al lado de la medida, como
 * en la maqueta: «2 realizadas · 1 no realizada · 30 días», y el lector, «Actividad de los últimos 30 días: 2 realizadas
 * y 1 no realizada» (§3.4).
 */
export function ActividadDeEntrenamiento({ lectura, ir, ancho, iconoArriba }: { lectura: LecturaRecordada<ActividadLeida>; ir: Ir; ancho: number; iconoArriba: boolean }) {
  const { r, cargar, sinActualizar } = lectura;
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_ENTRENAMIENTO.historialNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    // DL-170 (AV2-12, con AV2-D2): lo hecho y lo no hecho por separado, de la misma lectura que «Tu historial».
    const a = actividadDeInicio(r.datos);
    contenido = a.vacia ? (
      <Parrafo tenue>{a.texto}</Parrafo>
    ) : (
      <View accessible accessibilityLabel={a.paraLeer}>
        {a.realizadas !== null ? <Cifra valor={numero(a.realizadas)} unidad={a.unidad} tamano={26} /> : null}
        <Text style={estilos.detalle}>{a.detalle}</Text>
      </View>
    );
  }
  return (
    <TarjetaDeInicio zona="entrenamiento" titulo={T.actividad} icono="linea-de-tiempo" ancho={ancho} iconoArriba={iconoArriba}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
    </TarjetaDeInicio>
  );
}
