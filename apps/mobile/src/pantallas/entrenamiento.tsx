/**
 * APK · Entrenamiento del asesorado (docs/paquetes/WP-06.md §5; B10-06 §25-§38, §52-§58).
 * - «Entrenamiento de hoy» muestra las sesiones de la instantánea vigente. Si hay varias, la persona elige cuál hizo:
 *   BE no decide por ella (DL-077). El estado de cada una sale **solo** de `vistaDeOcurrencia`: sin registro es «No
 *   iniciada» o «Sin registro», nunca «No realizada» (H-09-TRN-01; B10-06:626-640).
 * - «Comenzar sesión» y «Continuar sesión» abren siempre el mismo borrador de la ocurrencia (S10-TRN-01, 02).
 * - Registro incremental: carga, reps y RIR opcional → «+ Registrar serie», en la misma pantalla, sin abrir una por
 *   serie ni modales entre series (B10-06:1221, 1227-1238). Cada serie se guarda al registrarla.
 * - «No pude realizarla» es un acto explícito, con motivo opcional: no se fuerza explicación (B10-06:800-816).
 * - «Revisar sesión» → «Confirmar sesión»: confirmar es definitivo, y después se corrige sin borrar (B10-06:820-898).
 * - Un resultado incierto ofrece reintentar con la misma Idempotency-Key: no duplica.
 */
import {
  COPY,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_CRITERIO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  vistaDeOcurrencia,
  type BorradorDeEjecucion,
  type EjecucionDeEntrenamiento,
  type EjercicioDeCatalogo,
  type EjercicioRegistradoEntrada,
  type HoyDeEntrenamientoResponse,
  type Ocurrencia,
  type Prescripcion,
  type RegistroDeEjecucion,
  type Resultado,
  type SesionDeOcurrencia,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia, fecha } from '../formato';
import { esIncierto, falloDe, useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, Campo, Dato, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';

type Hoy = HoyDeEntrenamientoResponse['data'];
type Granularidad = 'SET' | 'EXERCISE_OR_SESSION';

/** La fecha local de hoy en la zona del borrador: después de las 21 en Buenos Aires, en UTC ya es mañana. */
const hoyEn = (zona: string): string => new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** «3 × 8 · RIR 2 · Carga sugerida 60 kg»: lo planificado, con la carga separada del criterio (B10-06:463-477). */
function resumenDePrescripcion(p: Prescripcion): string {
  const reps = (s: Prescripcion['sets'][number]) => (!s.repetitions ? '—' : 'value' in s.repetitions ? `${s.repetitions.value}` : `${s.repetitions.min}-${s.repetitions.max}`);
  const partes = [p.sets.length > 0 ? `${p.sets.length} × ${reps(p.sets[0]!)}` : ''];
  if (p.intensity) partes.push(`${ETIQUETA_DE_CRITERIO[p.intensity.criterion]} ${p.intensity.target.value}${p.intensity.criterion === 'PERCENT_RM' ? ' % RM' : ''}`);
  if (p.suggestedLoad) partes.push(`${COPY_ENTRENAMIENTO.cargaSugerida} ${p.suggestedLoad.value} ${p.suggestedLoad.unit}`);
  return partes.filter(Boolean).join(' · ');
}

// ─── Entrenamiento de hoy ────────────────────────────────────────────────────────────────────

export function PantallaDeEntrenamiento({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [r, setR] = useState<Resultado<HoyDeEntrenamientoResponse> | null>(null);
  const [otroDia, setOtroDia] = useState('');
  const [delDia, setDelDia] = useState<{ fecha: string; ocurrencias: Ocurrencia[] } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.hoyDeEntrenamiento(token);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** DL-078: para registrar una sesión de un día anterior. */
  async function verOtroDia() {
    setAviso(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(otroDia)) return setAviso('Escribí la fecha como AAAA-MM-DD.');
    const res = await api.ocurrenciasDeEntrenamiento(token, { periodStart: otroDia, periodEnd: otroDia });
    if (sesionPerdida(res)) return;
    if (!res.ok) return setAviso('No pudimos ver ese día. Revisá que no sea una fecha futura ni de hace más de un mes.');
    setDelDia({ fecha: otroDia, ocurrencias: res.datos.data.occurrences });
  }

  if (!r) return <Cargando />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  const hoy: Hoy = r.datos.data;

  return (
    <View>
      <Titulo>{COPY_ENTRENAMIENTO.entrenamientoDeHoy}</Titulo>
      {hoy.planState === 'NO_ACTIVE_PLAN' ? <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.sinPlanAsesorado} /> : null}
      {hoy.planState === 'NOT_AVAILABLE' ? (
        <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible}>
          <Boton texto="Ir a Vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </Aviso>
      ) : null}
      {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
      {hoy.occurrences.map((o) => (
        <TarjetaDeOcurrencia key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} ir={ir} />
      ))}

      {hoy.planState === 'AVAILABLE' ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.registrarOtroDia}>
          <Parrafo tenue>Si hiciste una sesión otro día y no la registraste, podés registrarla ahora.</Parrafo>
          <Campo etiqueta="Fecha (AAAA-MM-DD)" value={otroDia} onChangeText={setOtroDia} keyboardType="numbers-and-punctuation" />
          <Boton texto="Ver sesiones de ese día" tipo="secundario" onPress={() => void verOtroDia()} />
          {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
          {delDia ? (
            delDia.ocurrencias.length === 0 ? (
              <Parrafo>Ese día tu plan no estaba vigente.</Parrafo>
            ) : (
              delDia.ocurrencias.map((o) => <TarjetaDeOcurrencia key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} ir={ir} />)
            )
          ) : null}
        </Seccion>
      ) : null}
      <Boton texto="Actualizar" tipo="enlace" onPress={() => void cargar()} />
    </View>
  );
}

function TarjetaDeOcurrencia({
  ocurrencia: o,
  hoy,
  token,
  sesionPerdida,
  ir,
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  ir: (r: Ruta) => void;
}) {
  const [abriendo, setAbriendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const vista = vistaDeOcurrencia(o, hoy);

  async function abrir() {
    setAbriendo(true);
    setFallo(null);
    const r = await api.abrirBorradorDeEjecucion(token, o.occurrenceId);
    setAbriendo(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return setFallo('Tu plan ya no está vigente. Actualizá la pantalla.');
      if (r.tipo === 'API' && r.codigo === 'OCCURRENCE_NOT_EXECUTABLE') return setFallo('Esa sesión no se puede registrar para esa fecha.');
      return setFallo(falloDe(r).mensaje);
    }
    if (r.datos.data.state === 'REGISTERED' && r.datos.data.executionId) return ir({ nombre: 'ejecucion-de-entrenamiento', id: r.datos.data.executionId });
    ir({ nombre: 'sesion-de-entrenamiento', draftId: r.datos.data.draftId, sesion: o.plannedSession, fecha: o.date });
  }

  return (
    <Tarjeta>
      <Subtitulo>{o.plannedSession.label}</Subtitulo>
      <Parrafo tenue>
        {o.plannedSession.blockLabel}
        {o.plannedSession.microcycleLabel ? ` · ${o.plannedSession.microcycleLabel}` : ''}
        {o.date !== hoy ? ` · ${dia(`${o.date}T12:00:00Z`)}` : ''}
      </Parrafo>
      <Insignia texto={vista.texto} positiva={vista.registrada} etiqueta="Estado" />
      {o.plannedSession.prescriptions.map((p) => (
        <Dato key={p.prescriptionId} etiqueta={p.exerciseName} valor={resumenDePrescripcion(p)} />
      ))}
      {o.plannedSession.instructions ? <Parrafo tenue>{o.plannedSession.instructions}</Parrafo> : null}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {o.execution.state === 'REGISTERED' && o.execution.executionId ? (
        <Boton texto="Ver registro" tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: o.execution.executionId! })} />
      ) : (
        <Boton texto={o.execution.state === 'DRAFT_IN_PROGRESS' ? COPY_ENTRENAMIENTO.continuarSesion : COPY_ENTRENAMIENTO.comenzarSesion} onPress={() => void abrir()} ocupado={abriendo} />
      )}
    </Tarjeta>
  );
}

// ─── La sesión: borrador incremental, revisión y confirmación ───────────────────────────────

export function PantallaDeSesion({
  token,
  draftId,
  sesion,
  fechaDeLaSesion,
  salir,
  ir,
  subir,
}: {
  token: string;
  draftId: string;
  sesion: SesionDeOcurrencia;
  fechaDeLaSesion: string;
  salir: (m: Salida) => void;
  ir: (r: Ruta) => void;
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [b, setB] = useState<BorradorDeEjecucion | null>(null);
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'info' | 'exito'; texto: string } | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [hora, setHora] = useState('');
  const intentoDeConfirmar = useClaveDeIntento();
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    const r = await api.consultarBorradorDeEjecucion(token, draftId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(true);
    setB(r.datos.data);
    setMotivo(r.datos.data.reason ?? '');
  }, [token, draftId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Guardado incremental: cada cambio va con la versión que se ve; si otra pantalla la cambió, se recarga. */
  async function guardar(cambios: Parameters<typeof api.guardarBorradorDeEjecucion>[2]['changes']): Promise<boolean> {
    if (!b) return false;
    setGuardando(true);
    setAviso(null);
    const r = await api.guardarBorradorDeEjecucion(token, draftId, { expectedVersion: b.version, changes: cambios });
    setGuardando(false);
    if (sesionPerdida(r)) return false;
    if (!r.ok) {
      const f = falloDe(r);
      setAviso({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato que no se puede guardar. Revisalo.' : f.mensaje });
      if (f.tipo === 'actualizar') void cargar();
      return false;
    }
    setB(r.datos.data);
    return true;
  }

  const ejercicios = (): EjercicioRegistradoEntrada[] =>
    (b?.exercises ?? []).map((e) =>
      e.sets
        ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: e.sets }
        : { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: e.executionSummary ?? { description: '' } },
    );

  async function elegirGranularidad(g: Granularidad) {
    // Cambiar de forma no inventa datos: lo cargado en la otra forma no se convierte (09v10:1101).
    await guardar({ granularity: g, exercises: [], sessionSummary: null });
  }

  async function registrarSerie(p: Prescripcion, realizado: string, serie: { carga: string; reps: string; rir: string }) {
    const n = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));
    const actuales = ejercicios();
    const existente = actuales.find((e) => e.prescriptionId === p.prescriptionId);
    const series = existente && 'sets' in existente ? existente.sets : [];
    const nueva = {
      setIndex: series.length + 1,
      load: n(serie.carga) === null ? null : { value: n(serie.carga) as number, unit: 'kg' as const },
      completedRepetitions: n(serie.reps) === null ? null : Math.round(n(serie.reps) as number),
      rir: n(serie.rir),
      perceivedExertion: null,
    };
    const actualizado = { prescriptionId: p.prescriptionId, performedExerciseVersionId: realizado, sets: [...series, nueva] };
    return guardar({ exercises: existente ? actuales.map((e) => (e.prescriptionId === p.prescriptionId ? actualizado : e)) : [...actuales, actualizado] });
  }

  async function sustituir(p: Prescripcion, e: EjercicioDeCatalogo) {
    const actuales = ejercicios();
    const existente = actuales.find((x) => x.prescriptionId === p.prescriptionId);
    const nuevo: EjercicioRegistradoEntrada =
      b?.granularity === 'EXERCISE_OR_SESSION'
        ? { prescriptionId: p.prescriptionId, performedExerciseVersionId: e.versionId, executionSummary: existente && 'executionSummary' in existente ? existente.executionSummary : { description: 'Sustituido.' } }
        : { prescriptionId: p.prescriptionId, performedExerciseVersionId: e.versionId, sets: existente && 'sets' in existente ? existente.sets : [] };
    await guardar({ exercises: existente ? actuales.map((x) => (x.prescriptionId === p.prescriptionId ? nuevo : x)) : [...actuales, nuevo] });
  }

  async function resumir(p: Prescripcion, texto: string) {
    const actuales = ejercicios();
    const existente = actuales.find((x) => x.prescriptionId === p.prescriptionId);
    const nuevo = { prescriptionId: p.prescriptionId, performedExerciseVersionId: existente?.performedExerciseVersionId ?? p.exerciseVersionId, executionSummary: { description: texto } };
    await guardar({ exercises: existente ? actuales.map((x) => (x.prescriptionId === p.prescriptionId ? nuevo : x)) : [...actuales, nuevo] });
  }

  async function noPude() {
    // Un acto explícito: sin granularidad ni series, con motivo opcional (REG-06-131).
    await guardar({ sessionCondition: 'NOT_COMPLETED', granularity: null, exercises: [], sessionSummary: null, reason: motivo.trim() || null });
    setRevisando(true);
  }

  async function confirmar() {
    if (!b) return;
    const esOtroDia = b.date !== hoyEn(b.timeZone) && !b.occurredAt;
    if (esOtroDia) {
      if (!/^\d{2}:\d{2}$/.test(hora)) return setAviso({ tipo: 'error', texto: COPY_ENTRENAMIENTO.horaRequerida });
      // Argentina no tiene horario de verano desde 2009: la zona del demo es UTC-3 todo el año. La API igual verifica
      // que el instante caiga en el día de la sesión.
      const instante = new Date(`${b.date}T${hora}:00-03:00`).toISOString();
      if (!(await guardar({ occurredAt: instante }))) return;
    }
    setConfirmando(true);
    const vigente = await api.consultarBorradorDeEjecucion(token, draftId);
    if (sesionPerdida(vigente)) return;
    if (!vigente.ok) {
      setConfirmando(false);
      return setAviso({ tipo: 'error', texto: falloDe(vigente).mensaje });
    }
    const r = await api.confirmarEjecucion(token, draftId, vigente.datos.data.version, intentoDeConfirmar.actual());
    intentoDeConfirmar.registrar(r);
    setConfirmando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'EXECUTION_DRAFT_NOT_READY') {
        const codigos = r.issues.map((i) => i.code);
        return setAviso({
          tipo: 'error',
          texto: codigos.includes('SESSION_CONDITION_REQUIRED')
            ? 'Falta indicar cómo resultó la sesión.'
            : codigos.includes('OCCURRED_AT_REQUIRED')
              ? COPY_ENTRENAMIENTO.horaRequerida
              : 'Falta registrar algo de la sesión antes de confirmar.',
        });
      }
      if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED') return setAviso({ tipo: 'info', texto: 'Esta sesión ya estaba registrada.' });
      return setAviso({ tipo: 'error', texto: esIncierto(r) ? COPY.resultadoIncierto : falloDe(r).mensaje });
    }
    subir();
    ir({ nombre: 'ejecucion-de-entrenamiento', id: r.datos.data.executionId, aviso: COPY_ENTRENAMIENTO.sesionRegistrada });
  }

  if (error) return <ErrorConReintento sinConexion={false} onReintentar={cargar} />;
  if (!b) return <Cargando />;
  const deHoy = b.date === hoyEn(b.timeZone);

  if (revisando) {
    return (
      <View>
        <Titulo>{COPY_ENTRENAMIENTO.revisarSesion}</Titulo>
        <Parrafo>
          {sesion.label} · {dia(`${fechaDeLaSesion}T12:00:00Z`)}
        </Parrafo>
        <ResumenDeRegistro registro={b} />
        {!deHoy && !b.occurredAt ? <Campo etiqueta={`${COPY_ENTRENAMIENTO.horaDeLaSesion} (HH:MM)`} value={hora} onChangeText={setHora} keyboardType="numbers-and-punctuation" /> : null}
        <Parrafo tenue>{COPY_ENTRENAMIENTO.confirmarEsDefinitivo}</Parrafo>
        {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
        <Boton texto={COPY_ENTRENAMIENTO.confirmarSesion} onPress={() => void confirmar()} ocupado={confirmando} />
        <Boton texto="Volver a la sesión" tipo="secundario" onPress={() => setRevisando(false)} deshabilitado={confirmando} />
      </View>
    );
  }

  return (
    <View>
      <Titulo>{sesion.label}</Titulo>
      <Parrafo tenue>
        {sesion.blockLabel}
        {deHoy ? '' : ` · ${dia(`${fechaDeLaSesion}T12:00:00Z`)}`}
      </Parrafo>
      {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.granularidad}>
        <Boton texto={ETIQUETA_DE_GRANULARIDAD.SET} tipo={b.granularity === 'SET' ? 'primario' : 'secundario'} onPress={() => void elegirGranularidad('SET')} deshabilitado={guardando} />
        <Boton
          texto={ETIQUETA_DE_GRANULARIDAD.EXERCISE_OR_SESSION}
          tipo={b.granularity === 'EXERCISE_OR_SESSION' ? 'primario' : 'secundario'}
          onPress={() => void elegirGranularidad('EXERCISE_OR_SESSION')}
          deshabilitado={guardando}
        />
      </Seccion>
      {b.granularity
        ? sesion.prescriptions.map((p) => (
            <EjercicioEnCurso
              key={p.prescriptionId}
              token={token}
              prescripcion={p}
              registrado={b.exercises.find((e) => e.prescriptionId === p.prescriptionId) ?? null}
              granularidad={b.granularity as Granularidad}
              guardando={guardando}
              onSerie={(realizado, serie) => registrarSerie(p, realizado, serie)}
              onSustituir={(e) => void sustituir(p, e)}
              onResumen={(t) => void resumir(p, t)}
              sesionPerdida={sesionPerdida}
            />
          ))
        : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.condicionDeLaSesion}>
        <Boton texto="Realizada" tipo={b.sessionCondition === 'COMPLETED' ? 'primario' : 'secundario'} onPress={() => void guardar({ sessionCondition: 'COMPLETED' })} deshabilitado={guardando || !b.granularity} />
        <Boton
          texto="Realizada con desvío"
          tipo={b.sessionCondition === 'COMPLETED_WITH_DEVIATION' ? 'primario' : 'secundario'}
          onPress={() => void guardar({ sessionCondition: 'COMPLETED_WITH_DEVIATION', reason: motivo.trim() || null })}
          deshabilitado={guardando || !b.granularity}
        />
        <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} value={motivo} onChangeText={setMotivo} />
        <Boton texto={COPY_ENTRENAMIENTO.noPudeRealizarla} tipo="enlace" onPress={() => void noPude()} deshabilitado={guardando} />
      </Seccion>
      <Boton texto={COPY_ENTRENAMIENTO.revisarSesion} onPress={() => setRevisando(true)} deshabilitado={guardando || !b.sessionCondition} />
    </View>
  );
}

function EjercicioEnCurso({
  token,
  prescripcion: p,
  registrado,
  granularidad,
  guardando,
  onSerie,
  onSustituir,
  onResumen,
  sesionPerdida,
}: {
  token: string;
  prescripcion: Prescripcion;
  registrado: BorradorDeEjecucion['exercises'][number] | null;
  granularidad: Granularidad;
  guardando: boolean;
  onSerie: (realizado: string, serie: { carga: string; reps: string; rir: string }) => Promise<boolean>;
  onSustituir: (e: EjercicioDeCatalogo) => void;
  onResumen: (texto: string) => void;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
}) {
  const ultima = registrado?.sets?.[registrado.sets.length - 1] ?? null;
  // «Copiar carga anterior» como ayuda visible: el valor se ve y se edita antes de guardar (B10-06:1242-1255).
  const [serie, setSerie] = useState({ carga: ultima?.load ? String(ultima.load.value) : p.suggestedLoad ? String(p.suggestedLoad.value) : '', reps: '', rir: '' });
  const [resumen, setResumen] = useState(registrado?.executionSummary?.description ?? '');
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<EjercicioDeCatalogo[] | null>(null);

  async function buscar() {
    const r = await api.buscarEjercicios(token, texto.trim());
    if (sesionPerdida(r)) return;
    setResultados(r.ok ? r.datos.data : []);
  }

  return (
    <Tarjeta>
      <Subtitulo>{p.exerciseName}</Subtitulo>
      <Dato etiqueta={COPY_ENTRENAMIENTO.planificado} valor={resumenDePrescripcion(p)} />
      {registrado?.substituted ? (
        <>
          <Dato etiqueta={COPY_ENTRENAMIENTO.ejecutado} valor={registrado.performedExerciseName} />
          <Insignia texto={COPY_ENTRENAMIENTO.sustituido} />
        </>
      ) : null}
      {granularidad === 'SET' ? (
        <>
          {(registrado?.sets ?? []).map((s) => (
            <Parrafo key={s.setIndex}>
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {s.load ? `${s.load.value} ${s.load.unit}` : 'sin carga'} × {s.completedRepetitions ?? '—'}
              {s.rir !== null ? ` · RIR ${s.rir}` : ''} · {COPY_ENTRENAMIENTO.registradaEnBorrador}
            </Parrafo>
          ))}
          <Campo etiqueta={`${COPY_ENTRENAMIENTO.carga} (kg)`} value={serie.carga} onChangeText={(v) => setSerie({ ...serie, carga: v })} keyboardType="decimal-pad" />
          <Campo etiqueta={COPY_ENTRENAMIENTO.reps} value={serie.reps} onChangeText={(v) => setSerie({ ...serie, reps: v })} keyboardType="number-pad" />
          <Campo etiqueta={`${COPY_ENTRENAMIENTO.rir} (opcional)`} ayuda={COPY_ENTRENAMIENTO.explicacionRir} value={serie.rir} onChangeText={(v) => setSerie({ ...serie, rir: v })} keyboardType="number-pad" />
          <Boton
            texto={COPY_ENTRENAMIENTO.registrarSerie}
            deshabilitado={guardando || (serie.carga.trim() === '' && serie.reps.trim() === '')}
            onPress={() =>
              void onSerie(registrado?.performedExerciseVersionId ?? p.exerciseVersionId, serie).then((ok) => {
                if (ok) setSerie({ ...serie, reps: '', rir: '' });
              })
            }
          />
        </>
      ) : (
        <>
          <Campo etiqueta={COPY_ENTRENAMIENTO.resumenDelEjercicio} value={resumen} onChangeText={setResumen} multiline />
          <Boton texto="Guardar resumen" tipo="secundario" onPress={() => onResumen(resumen.trim())} deshabilitado={guardando || resumen.trim() === ''} />
        </>
      )}
      {buscando ? (
        <View>
          <Campo etiqueta="Buscar el ejercicio que hiciste" value={texto} onChangeText={setTexto} />
          <Boton texto="Buscar" tipo="secundario" onPress={() => void buscar()} />
          {(resultados ?? []).map((e) => (
            <Boton
              key={e.versionId}
              texto={`${COPY_ENTRENAMIENTO.confirmarSustitucion}: ${e.name}`}
              tipo="secundario"
              onPress={() => {
                onSustituir(e);
                setBuscando(false);
                setResultados(null);
              }}
            />
          ))}
          {resultados && resultados.length === 0 ? <Parrafo tenue>No encontramos ejercicios con ese nombre.</Parrafo> : null}
          <Boton texto="Cancelar" tipo="enlace" onPress={() => setBuscando(false)} />
        </View>
      ) : (
        <Boton texto={COPY_ENTRENAMIENTO.sustituirEjercicio} tipo="enlace" onPress={() => setBuscando(true)} />
      )}
    </Tarjeta>
  );
}

/** El resumen antes de confirmar: ejercicios, sustituciones, series y condición (B10-06:824-838). */
function ResumenDeRegistro({ registro: b }: { registro: BorradorDeEjecucion }) {
  return (
    <View>
      {b.sessionCondition ? <Dato etiqueta={COPY_ENTRENAMIENTO.condicionDeLaSesion} valor={etiquetaDeCondicionRegistrada({ sessionCondition: b.sessionCondition })} /> : null}
      {b.reason ? <Dato etiqueta="Motivo" valor={b.reason} /> : null}
      {b.exercises.map((e) => (
        <Dato
          key={e.prescriptionId}
          etiqueta={e.substituted ? `${e.prescribedExerciseName} → ${e.performedExerciseName}` : e.performedExerciseName}
          valor={e.sets ? `${e.sets.length} ${COPY_ENTRENAMIENTO.series.toLowerCase()}` : (e.executionSummary?.description ?? '')}
        />
      ))}
    </View>
  );
}

// ─── La ejecución registrada, con su corrección ─────────────────────────────────────────────

function Registro({ registro }: { registro: RegistroDeEjecucion }) {
  return (
    <View>
      <Dato etiqueta={COPY_ENTRENAMIENTO.condicionDeLaSesion} valor={etiquetaDeCondicionRegistrada(registro)} />
      {registro.reason ? <Dato etiqueta="Motivo" valor={registro.reason} /> : null}
      {registro.exercises.map((e) => (
        <View key={e.prescriptionId}>
          <Dato
            etiqueta={e.substituted ? `${COPY_ENTRENAMIENTO.planificado}: ${e.prescribedExerciseName}` : e.performedExerciseName}
            valor={e.substituted ? `${COPY_ENTRENAMIENTO.ejecutado}: ${e.performedExerciseName}` : ''}
          />
          {(e.sets ?? []).map((s) => (
            <Parrafo key={s.setIndex}>
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {s.load ? `${s.load.value} ${s.load.unit}` : 'sin carga'} × {s.completedRepetitions ?? '—'}
              {s.rir !== null ? ` · RIR ${s.rir}` : ''}
            </Parrafo>
          ))}
          {e.executionSummary ? <Parrafo>{e.executionSummary.description}</Parrafo> : null}
        </View>
      ))}
      {registro.sessionSummary ? <Parrafo>{registro.sessionSummary.description}</Parrafo> : null}
    </View>
  );
}

export function PantallaDeEjecucionDeEntrenamiento({ token, id, avisoInicial, salir }: { token: string; id: string; avisoInicial?: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [r, setR] = useState<Resultado<{ data: EjecucionDeEntrenamiento }> | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(avisoInicial ?? null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarEjecucionDeEntrenamiento(token, id);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!r) return <Cargando />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  const x = r.datos.data;
  const vigente = x.effectiveView.kind === 'CORRECTED' ? x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) : null;

  return (
    <View>
      <Titulo>{x.plannedSession.label}</Titulo>
      <Parrafo tenue>{dia(`${x.date}T12:00:00Z`)}</Parrafo>
      {aviso ? <Aviso tipo="exito" titulo={aviso} /> : null}
      {vigente ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.correccionVigente}>
          <Parrafo tenue>
            {vigente.authorRole === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : COPY_ENTRENAMIENTO.corregidoPorVos} · {fecha(vigente.recordedAt)} · {vigente.reason}
          </Parrafo>
          <Registro registro={vigente.correction} />
        </Seccion>
      ) : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.registroOriginal}>
        <Parrafo tenue>Registrado el {fecha(x.recordedAt)}</Parrafo>
        <Registro registro={x.original} />
      </Seccion>
      {x.corrections.length > 1 ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.historialDeCorrecciones}>
          {x.corrections.map((c) => (
            <Parrafo key={c.correctionId}>
              {fecha(c.recordedAt)} · {c.author.displayName} · {c.reason}
            </Parrafo>
          ))}
        </Seccion>
      ) : null}
      {corrigiendo ? (
        <FormularioDeCorreccion
          token={token}
          ejecucion={x}
          sesionPerdida={sesionPerdida}
          onCorregida={() => {
            setCorrigiendo(false);
            setAviso('Corrección registrada. El registro original se conserva.');
            void cargar();
          }}
          onCancelar={() => setCorrigiendo(false)}
        />
      ) : (
        <Boton texto={COPY_ENTRENAMIENTO.corregirRegistro} tipo="secundario" onPress={() => setCorrigiendo(true)} />
      )}
    </View>
  );
}

/**
 * «Corregir registro» (B10-06:868-886): exige motivo y el cambio. Se corrigen las cargas, las repeticiones y el RIR
 * de las series; la corrección lleva el registro completo y el original no se toca (REG-06-116).
 */
function FormularioDeCorreccion({
  token,
  ejecucion: x,
  sesionPerdida,
  onCorregida,
  onCancelar,
}: {
  token: string;
  ejecucion: EjecucionDeEntrenamiento;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCorregida: () => void;
  onCancelar: () => void;
}) {
  const base = x.effectiveView.kind === 'CORRECTED' ? (x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId)?.correction ?? x.original) : x.original;
  const [motivo, setMotivo] = useState('');
  const [series, setSeries] = useState(base.exercises.map((e) => (e.sets ?? []).map((s) => ({ carga: s.load ? String(s.load.value) : '', reps: s.completedRepetitions === null ? '' : String(s.completedRepetitions), rir: s.rir === null ? '' : String(s.rir) }))));
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();

  async function enviar() {
    if (!motivo.trim()) return setFallo('Contá por qué corregís el registro.');
    const n = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));
    setEnviando(true);
    setFallo(null);
    const r = await api.corregirEjecucion(
      token,
      x.executionId,
      {
        reason: motivo.trim(),
        correction: {
          granularity: base.granularity,
          sessionCondition: base.sessionCondition,
          reason: base.reason,
          sessionSummary: base.sessionSummary,
          exercises: base.exercises.map((e, i) =>
            e.sets
              ? {
                  prescriptionId: e.prescriptionId,
                  performedExerciseVersionId: e.performedExerciseVersionId,
                  sets: e.sets.map((s, j) => {
                    const v = series[i]?.[j];
                    return {
                      setIndex: s.setIndex,
                      load: v && n(v.carga) !== null ? { value: n(v.carga) as number, unit: s.load?.unit ?? 'kg' } : null,
                      completedRepetitions: v && n(v.reps) !== null ? Math.round(n(v.reps) as number) : null,
                      rir: v ? n(v.rir) : null,
                      perceivedExertion: s.perceivedExertion,
                    };
                  }),
                }
              : { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: e.executionSummary ?? { description: '' } },
          ),
        },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato de la corrección que no se puede guardar.' : falloDe(r).mensaje);
    onCorregida();
  }

  return (
    <Seccion titulo={COPY_ENTRENAMIENTO.corregirRegistro}>
      <Campo etiqueta={COPY_ENTRENAMIENTO.motivoDeLaCorreccion} value={motivo} onChangeText={setMotivo} />
      {base.exercises.map((e, i) => (
        <View key={e.prescriptionId}>
          <Subtitulo>{e.performedExerciseName}</Subtitulo>
          {(e.sets ?? []).map((s, j) => (
            <View key={s.setIndex}>
              <Parrafo>
                {COPY_ENTRENAMIENTO.serie} {s.setIndex}
              </Parrafo>
              <Campo
                etiqueta={`${COPY_ENTRENAMIENTO.carga} (${s.load?.unit ?? 'kg'})`}
                value={series[i]?.[j]?.carga ?? ''}
                onChangeText={(v) => setSeries((ss) => ss.map((fila, a) => (a === i ? fila.map((c, b) => (b === j ? { ...c, carga: v } : c)) : fila)))}
                keyboardType="decimal-pad"
              />
              <Campo
                etiqueta={COPY_ENTRENAMIENTO.reps}
                value={series[i]?.[j]?.reps ?? ''}
                onChangeText={(v) => setSeries((ss) => ss.map((fila, a) => (a === i ? fila.map((c, b) => (b === j ? { ...c, reps: v } : c)) : fila)))}
                keyboardType="number-pad"
              />
            </View>
          ))}
        </View>
      ))}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      <Boton texto="Registrar corrección" onPress={() => void enviar()} ocupado={enviando} />
      <Boton texto="Cancelar" tipo="enlace" onPress={onCancelar} deshabilitado={enviando} />
    </Seccion>
  );
}
