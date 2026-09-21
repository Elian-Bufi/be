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
  cantidadDeSeries,
  COPY,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_CRITERIO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  registroVigente,
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
import { Alert, View } from 'react-native';
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
  // «75 % RM» y «RIR 2»: el rótulo del criterio va una sola vez.
  if (p.intensity) partes.push(p.intensity.criterion === 'PERCENT_RM' ? `${p.intensity.target.value} ${ETIQUETA_DE_CRITERIO.PERCENT_RM}` : `${ETIQUETA_DE_CRITERIO.RIR} ${p.intensity.target.value}`);
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

type Unidad = 'kg' | 'lb';
interface SerieEnCarga {
  readonly carga: string;
  readonly unidad: Unidad;
  readonly reps: string;
  readonly rir: string;
  readonly esfuerzo: string;
}

/** Un número con coma o punto. Vacío → null; lo que no es un número → NaN, para que no se guarde como otra cosa. */
const leerNumero = (s: string): number | null => (s.trim() === '' ? null : Number(s.trim().replace(',', '.')));

/** Lo que el borrador ya tiene cargado, dicho para la persona: «3 series», «1 resumen». `null` si no tiene nada. */
function loCargado(b: BorradorDeEjecucion): string | null {
  const series = b.exercises.reduce((n, e) => n + (e.sets?.length ?? 0), 0);
  if (series > 0) return cantidadDeSeries(series);
  const resumenes = b.exercises.filter((e) => e.executionSummary).length + (b.sessionSummary ? 1 : 0);
  return resumenes === 0 ? null : resumenes === 1 ? '1 resumen' : `${resumenes} resúmenes`;
}

/**
 * Antes de descartar lo registrado, se pregunta (B10-10:337: una acción sensible no se ejecuta de un toque, y menos al
 * lado de una frecuente). El diálogo del sistema es accesible y dice qué se pierde.
 */
function confirmarDescarte(titulo: string, detalle: string): Promise<boolean> {
  return new Promise((resolver) =>
    Alert.alert(
      titulo,
      detalle,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: 'Descartar y seguir', style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    ),
  );
}

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
  const [resumenDeSesion, setResumenDeSesion] = useState('');
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
    setResumenDeSesion(r.datos.data.sessionSummary?.description ?? '');
  }, [token, draftId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /**
   * Guardado incremental: cada cambio va con la versión que se ve; si otra pantalla la cambió, se recarga. Devuelve
   * `null` si guardó, o el mensaje del fallo. El fallo de una acción de la tarjeta de un ejercicio se muestra en la
   * tarjeta, al lado de lo que la persona tocó; los demás, arriba.
   */
  async function guardarYDecir(cambios: Parameters<typeof api.guardarBorradorDeEjecucion>[2]['changes']): Promise<string | null> {
    if (!b) return 'Todavía no se cargó la sesión.';
    setGuardando(true);
    const r = await api.guardarBorradorDeEjecucion(token, draftId, { expectedVersion: b.version, changes: cambios });
    setGuardando(false);
    if (sesionPerdida(r)) return 'Tu sesión se cerró.';
    if (!r.ok) {
      const f = falloDe(r);
      if (f.tipo === 'actualizar') void cargar();
      return r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato que no se puede guardar. Revisalo.' : f.mensaje;
    }
    setB(r.datos.data);
    return null;
  }
  async function guardar(cambios: Parameters<typeof api.guardarBorradorDeEjecucion>[2]['changes']): Promise<boolean> {
    setAviso(null);
    const fallo = await guardarYDecir(cambios);
    if (fallo) setAviso({ tipo: 'error', texto: fallo });
    return fallo === null;
  }

  const ejercicios = (): EjercicioRegistradoEntrada[] =>
    (b?.exercises ?? []).map((e) =>
      e.sets
        ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: e.sets }
        : { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: e.executionSummary ?? { description: '' } },
    );

  async function elegirGranularidad(g: Granularidad) {
    if (!b || b.granularity === g) return;
    // Cambiar de forma no inventa datos: lo cargado en la otra forma no se convierte (09v10:1101). Por eso se descarta,
    // y se pregunta antes.
    const cargado = loCargado(b);
    if (cargado && !(await confirmarDescarte('Cambiar la forma de registrar', `Se descartan ${cargado} de esta sesión: lo cargado de una forma no se pasa a la otra.`))) return;
    await guardar({ granularity: g, exercises: [], sessionSummary: null });
  }

  async function registrarSerie(p: Prescripcion, realizado: string, serie: SerieEnCarga): Promise<string | null> {
    const carga = leerNumero(serie.carga);
    const reps = leerNumero(serie.reps);
    const rir = leerNumero(serie.rir);
    const esfuerzo = leerNumero(serie.esfuerzo);
    if ([carga, reps, rir, esfuerzo].some((n) => n !== null && Number.isNaN(n))) return 'Revisá los números de la serie.';
    if (esfuerzo !== null && (esfuerzo < 0 || esfuerzo > 10)) return 'El esfuerzo percibido va de 0 a 10.';
    const actuales = ejercicios();
    const existente = actuales.find((e) => e.prescriptionId === p.prescriptionId);
    const series = existente && 'sets' in existente ? existente.sets : [];
    const nueva = {
      setIndex: series.length + 1,
      load: carga === null ? null : { value: carga, unit: serie.unidad },
      completedRepetitions: reps === null ? null : Math.round(reps),
      rir,
      perceivedExertion: esfuerzo,
    };
    const actualizado = { prescriptionId: p.prescriptionId, performedExerciseVersionId: realizado, sets: [...series, nueva] };
    return guardarYDecir({ exercises: existente ? actuales.map((e) => (e.prescriptionId === p.prescriptionId ? actualizado : e)) : [...actuales, actualizado] });
  }

  /** Por serie, la sustitución se guarda sola. Por resumen, viaja con el resumen: no se inventa un texto por la persona. */
  async function sustituir(p: Prescripcion, e: EjercicioDeCatalogo): Promise<string | null> {
    const actuales = ejercicios();
    const existente = actuales.find((x) => x.prescriptionId === p.prescriptionId);
    const nuevo: EjercicioRegistradoEntrada =
      existente && 'executionSummary' in existente
        ? { prescriptionId: p.prescriptionId, performedExerciseVersionId: e.versionId, executionSummary: existente.executionSummary }
        : { prescriptionId: p.prescriptionId, performedExerciseVersionId: e.versionId, sets: existente && 'sets' in existente ? existente.sets : [] };
    return guardarYDecir({ exercises: existente ? actuales.map((x) => (x.prescriptionId === p.prescriptionId ? nuevo : x)) : [...actuales, nuevo] });
  }

  async function resumir(p: Prescripcion, texto: string, realizado: string | null): Promise<string | null> {
    const actuales = ejercicios();
    const existente = actuales.find((x) => x.prescriptionId === p.prescriptionId);
    const nuevo = { prescriptionId: p.prescriptionId, performedExerciseVersionId: realizado ?? existente?.performedExerciseVersionId ?? p.exerciseVersionId, executionSummary: { description: texto } };
    return guardarYDecir({ exercises: existente ? actuales.map((x) => (x.prescriptionId === p.prescriptionId ? nuevo : x)) : [...actuales, nuevo] });
  }

  async function noPude() {
    if (!b) return;
    // Un acto explícito: sin granularidad ni series, con motivo opcional (REG-06-131). Si ya había algo registrado, se
    // descarta, y se pregunta antes.
    const cargado = loCargado(b);
    if (cargado && !(await confirmarDescarte(COPY_ENTRENAMIENTO.noPudeRealizarla, `Se descartan ${cargado} de esta sesión.`))) return;
    if (await guardar({ sessionCondition: 'NOT_COMPLETED', granularity: null, exercises: [], sessionSummary: null, reason: motivo.trim() || null })) setRevisando(true);
  }

  /** «Revisar sesión» guarda antes el motivo, si cambió: lo que se escribió después de elegir la condición no se pierde. */
  async function revisar() {
    if (!b) return;
    if (motivo.trim() !== (b.reason ?? '') && !(await guardar({ reason: motivo.trim() || null }))) return;
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
              : codigos.includes('OCCURRED_AT_OUTSIDE_PLAN_VERSION')
                ? 'A esa hora regía otra versión de tu plan. Revisá la hora de la sesión.'
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
        {/* Lo elegido se dice con texto, no solo con el estilo del botón (B10-10:36). */}
        <Parrafo>{b.granularity ? `Elegiste: ${ETIQUETA_DE_GRANULARIDAD[b.granularity as Granularidad]}` : 'Todavía no elegiste cómo registrar.'}</Parrafo>
        <Boton texto={ETIQUETA_DE_GRANULARIDAD.SET} tipo={b.granularity === 'SET' ? 'primario' : 'secundario'} seleccionado={b.granularity === 'SET'} onPress={() => void elegirGranularidad('SET')} deshabilitado={guardando} />
        <Boton
          texto={ETIQUETA_DE_GRANULARIDAD.EXERCISE_OR_SESSION}
          tipo={b.granularity === 'EXERCISE_OR_SESSION' ? 'primario' : 'secundario'}
          seleccionado={b.granularity === 'EXERCISE_OR_SESSION'}
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
              onSustituir={(e) => sustituir(p, e)}
              onResumen={(t, realizado) => resumir(p, t, realizado)}
              sesionPerdida={sesionPerdida}
            />
          ))
        : null}
      {b.granularity === 'EXERCISE_OR_SESSION' ? (
        // «Sesión realizada + resumen» (B10-06:744-745): el registro agregado de toda la sesión.
        <Seccion titulo={COPY_ENTRENAMIENTO.resumenDeLaSesion}>
          <Campo etiqueta={`${COPY_ENTRENAMIENTO.resumenDeLaSesion} (opcional)`} value={resumenDeSesion} onChangeText={setResumenDeSesion} multiline />
          <Boton
            texto="Guardar resumen de la sesión"
            tipo="secundario"
            onPress={() => void guardar({ sessionSummary: resumenDeSesion.trim() ? { description: resumenDeSesion.trim() } : null })}
            deshabilitado={guardando || resumenDeSesion.trim() === (b.sessionSummary?.description ?? '')}
          />
        </Seccion>
      ) : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.condicionDeLaSesion}>
        {/* El motivo va antes que los botones: lo escrito viaja con la condición, y «Revisar sesión» lo guarda si cambió. */}
        <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} value={motivo} onChangeText={setMotivo} />
        <Parrafo>{b.sessionCondition ? `Elegiste: ${etiquetaDeCondicionRegistrada({ sessionCondition: b.sessionCondition })}` : 'Todavía no indicaste cómo resultó la sesión.'}</Parrafo>
        <Boton
          texto="Realizada"
          tipo={b.sessionCondition === 'COMPLETED' ? 'primario' : 'secundario'}
          seleccionado={b.sessionCondition === 'COMPLETED'}
          onPress={() => void guardar({ sessionCondition: 'COMPLETED', reason: motivo.trim() || null })}
          deshabilitado={guardando || !b.granularity}
        />
        <Boton
          texto="Realizada con desvío"
          tipo={b.sessionCondition === 'COMPLETED_WITH_DEVIATION' ? 'primario' : 'secundario'}
          seleccionado={b.sessionCondition === 'COMPLETED_WITH_DEVIATION'}
          onPress={() => void guardar({ sessionCondition: 'COMPLETED_WITH_DEVIATION', reason: motivo.trim() || null })}
          deshabilitado={guardando || !b.granularity}
        />
      </Seccion>
      <Boton texto={COPY_ENTRENAMIENTO.revisarSesion} onPress={() => void revisar()} deshabilitado={guardando || !b.sessionCondition} />
      {/* Lejos de «Revisar sesión» y de los botones frecuentes, y con confirmación si hay algo cargado (B10-10:337). */}
      <Seccion titulo="¿No pudiste entrenar?">
        <Boton texto={COPY_ENTRENAMIENTO.noPudeRealizarla} tipo="secundario" seleccionado={b.sessionCondition === 'NOT_COMPLETED'} onPress={() => void noPude()} deshabilitado={guardando} />
      </Seccion>
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
  onSerie: (realizado: string, serie: SerieEnCarga) => Promise<string | null>;
  onSustituir: (e: EjercicioDeCatalogo) => Promise<string | null>;
  onResumen: (texto: string, realizado: string | null) => Promise<string | null>;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
}) {
  const ultima = registrado?.sets?.[registrado.sets.length - 1] ?? null;
  // «Copiar carga anterior» como ayuda visible, **con su unidad**: el valor se ve y se edita antes de guardar
  // (B10-06:1242-1255). Una carga sugerida en libras no se precarga como kilos.
  const [serie, setSerie] = useState<SerieEnCarga>({
    carga: ultima?.load ? String(ultima.load.value) : p.suggestedLoad ? String(p.suggestedLoad.value) : '',
    unidad: ultima?.load?.unit ?? p.suggestedLoad?.unit ?? 'kg',
    reps: '',
    rir: '',
    esfuerzo: '',
  });
  const [resumen, setResumen] = useState(registrado?.executionSummary?.description ?? '');
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<EjercicioDeCatalogo[] | null>(null);
  const [falloDeBusqueda, setFalloDeBusqueda] = useState(false);
  // Por resumen, el ejercicio sustituto se elige y se guarda junto con el resumen que escribe la persona.
  const [sustitutoPendiente, setSustitutoPendiente] = useState<EjercicioDeCatalogo | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  async function buscar() {
    const r = await api.buscarEjercicios(token, texto.trim());
    if (sesionPerdida(r)) return;
    // Un error no es un catálogo vacío (B10-10:41).
    setFalloDeBusqueda(!r.ok);
    setResultados(r.ok ? r.datos.data : null);
  }

  async function elegirSustituto(e: EjercicioDeCatalogo) {
    setBuscando(false);
    setResultados(null);
    setFallo(null);
    if (granularidad === 'EXERCISE_OR_SESSION' && !registrado?.executionSummary) return setSustitutoPendiente(e);
    setFallo(await onSustituir(e));
  }

  const pendientes = granularidad === 'SET' ? p.sets.slice(registrado?.sets?.length ?? 0) : [];
  const realizado = sustitutoPendiente ?? null;

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
      {realizado ? (
        <>
          <Dato etiqueta={COPY_ENTRENAMIENTO.ejecutado} valor={realizado.name} />
          <Parrafo tenue>{COPY_ENTRENAMIENTO.sustituido}: se guarda con el resumen del ejercicio.</Parrafo>
        </>
      ) : null}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {granularidad === 'SET' ? (
        <>
          {(registrado?.sets ?? []).map((s) => (
            <Parrafo key={s.setIndex}>
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {textoDeSerie(s)} · {COPY_ENTRENAMIENTO.registradaEnBorrador}
            </Parrafo>
          ))}
          {pendientes.map((_, i) => (
            <Parrafo key={`p${i}`} tenue>
              {COPY_ENTRENAMIENTO.serie} {(registrado?.sets?.length ?? 0) + i + 1}: {COPY_ENTRENAMIENTO.pendiente}
            </Parrafo>
          ))}
          <Campo etiqueta={`${COPY_ENTRENAMIENTO.carga} (${serie.unidad})`} value={serie.carga} onChangeText={(v) => setSerie({ ...serie, carga: v })} keyboardType="decimal-pad" />
          <Boton texto="kg" tipo={serie.unidad === 'kg' ? 'primario' : 'secundario'} seleccionado={serie.unidad === 'kg'} onPress={() => setSerie({ ...serie, unidad: 'kg' })} />
          <Boton texto="lb" tipo={serie.unidad === 'lb' ? 'primario' : 'secundario'} seleccionado={serie.unidad === 'lb'} onPress={() => setSerie({ ...serie, unidad: 'lb' })} />
          <Campo etiqueta={COPY_ENTRENAMIENTO.reps} value={serie.reps} onChangeText={(v) => setSerie({ ...serie, reps: v })} keyboardType="number-pad" />
          <Campo etiqueta={`${COPY_ENTRENAMIENTO.rir} (opcional)`} ayuda={COPY_ENTRENAMIENTO.explicacionRir} value={serie.rir} onChangeText={(v) => setSerie({ ...serie, rir: v })} keyboardType="number-pad" />
          <Campo etiqueta={COPY_ENTRENAMIENTO.esfuerzoPercibido} ayuda="De 0 a 10, cómo sentiste la serie. No cambia lo que planificó tu profesional." value={serie.esfuerzo} onChangeText={(v) => setSerie({ ...serie, esfuerzo: v })} keyboardType="decimal-pad" />
          <Boton
            texto={COPY_ENTRENAMIENTO.registrarSerie}
            deshabilitado={guardando || (serie.carga.trim() === '' && serie.reps.trim() === '')}
            onPress={() =>
              void onSerie(registrado?.performedExerciseVersionId ?? p.exerciseVersionId, serie).then((f) => {
                setFallo(f);
                if (!f) setSerie({ ...serie, reps: '', rir: '', esfuerzo: '' });
              })
            }
          />
        </>
      ) : (
        <>
          <Campo etiqueta={COPY_ENTRENAMIENTO.resumenDelEjercicio} value={resumen} onChangeText={setResumen} multiline />
          <Boton
            texto="Guardar resumen"
            tipo="secundario"
            onPress={() =>
              void onResumen(resumen.trim(), realizado?.versionId ?? null).then((f) => {
                setFallo(f);
                if (!f) setSustitutoPendiente(null);
              })
            }
            deshabilitado={guardando || resumen.trim() === ''}
          />
        </>
      )}
      {buscando ? (
        <View>
          <Campo etiqueta="Buscar el ejercicio que hiciste" value={texto} onChangeText={setTexto} />
          <Boton texto="Buscar" tipo="secundario" onPress={() => void buscar()} />
          {falloDeBusqueda ? <Aviso tipo="error" titulo="No pudimos buscar en el catálogo. Probá de nuevo." /> : null}
          {(resultados ?? []).map((e) => (
            <Boton key={e.versionId} texto={`${COPY_ENTRENAMIENTO.confirmarSustitucion}: ${e.name}`} tipo="secundario" onPress={() => void elegirSustituto(e)} />
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

/** «60 kg × 8 reps · RIR 2 · esfuerzo 7». Una carga que no se registró se dice así: no es «sin carga» (06:5675). */
function textoDeSerie(s: { load: { value: number; unit: string } | null; completedRepetitions: number | null; rir: number | null; perceivedExertion: number | null }): string {
  return `${s.load ? `${s.load.value} ${s.load.unit}` : 'carga no registrada'} × ${s.completedRepetitions ?? '—'} ${COPY_ENTRENAMIENTO.reps.toLowerCase()}${s.rir !== null ? ` · RIR ${s.rir}` : ''}${s.perceivedExertion !== null ? ` · esfuerzo ${s.perceivedExertion}` : ''}`;
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
          valor={e.sets ? cantidadDeSeries(e.sets.length) : (e.executionSummary?.description ?? '')}
        />
      ))}
      {b.sessionSummary ? <Dato etiqueta={COPY_ENTRENAMIENTO.resumenDeLaSesion} valor={b.sessionSummary.description} /> : null}
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
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {textoDeSerie(s)}
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

type Condicion = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';
interface SerieEnCorreccion {
  readonly carga: string;
  readonly unidad: Unidad;
  readonly reps: string;
  readonly rir: string;
}
interface EstadoDeCorreccion {
  readonly condicion: Condicion;
  readonly motivoDeCondicion: string;
  readonly series: readonly (readonly SerieEnCorreccion[])[];
  readonly resumenes: readonly string[];
  readonly resumenDeSesion: string;
}

/**
 * «Corregir registro» (B10-06:868-886): exige motivo **y un cambio**. Se corrigen la condición y su motivo, la carga
 * (con su unidad), las repeticiones y el RIR de cada serie, y los resúmenes; la corrección lleva el registro completo y
 * el original no se toca (REG-06-116).
 * - Corregir a «No pude realizarla» deja la corrección sin series: el original las conserva.
 * - Corregir un «No pude realizarla» a realizada pide contar cómo fue la sesión: no se inventan series que no se
 *   registraron (09v10:1099-1101).
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
  const base = registroVigente(x);
  const inicial: EstadoDeCorreccion = {
    condicion: base.sessionCondition,
    motivoDeCondicion: base.reason ?? '',
    series: base.exercises.map((e) =>
      (e.sets ?? []).map((s) => ({
        carga: s.load ? String(s.load.value) : '',
        unidad: (s.load?.unit ?? 'kg') as Unidad,
        reps: s.completedRepetitions === null ? '' : String(s.completedRepetitions),
        rir: s.rir === null ? '' : String(s.rir),
      })),
    ),
    resumenes: base.exercises.map((e) => e.executionSummary?.description ?? ''),
    resumenDeSesion: base.sessionSummary?.description ?? '',
  };
  const [estado, setEstado] = useState<EstadoDeCorreccion>(inicial);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();
  const sinDatosOriginales = base.sessionCondition === 'NOT_COMPLETED';

  /** El registro corregido que describe un estado del formulario. El inicial describe lo que hoy rige. */
  function construir(e: EstadoDeCorreccion) {
    const reason = e.motivoDeCondicion.trim() || null;
    if (e.condicion === 'NOT_COMPLETED') return { granularity: null, sessionCondition: e.condicion, reason, exercises: [], sessionSummary: null };
    if (sinDatosOriginales) {
      return { granularity: 'EXERCISE_OR_SESSION' as const, sessionCondition: e.condicion, reason, exercises: [], sessionSummary: e.resumenDeSesion.trim() ? { description: e.resumenDeSesion.trim() } : null };
    }
    return {
      granularity: base.granularity,
      sessionCondition: e.condicion,
      reason,
      exercises: base.exercises.map((ej, i) =>
        ej.sets
          ? {
              prescriptionId: ej.prescriptionId,
              performedExerciseVersionId: ej.performedExerciseVersionId,
              sets: ej.sets.map((s, j) => {
                const v = e.series[i]?.[j];
                const carga = v ? leerNumero(v.carga) : null;
                const reps = v ? leerNumero(v.reps) : null;
                return {
                  setIndex: s.setIndex,
                  load: carga === null ? null : { value: carga, unit: v?.unidad ?? 'kg' },
                  completedRepetitions: reps === null ? null : Math.round(reps),
                  rir: v ? leerNumero(v.rir) : null,
                  perceivedExertion: s.perceivedExertion,
                };
              }),
            }
          : { prescriptionId: ej.prescriptionId, performedExerciseVersionId: ej.performedExerciseVersionId, executionSummary: { description: (e.resumenes[i] ?? '').trim() } },
      ),
      sessionSummary: base.granularity === 'EXERCISE_OR_SESSION' && e.resumenDeSesion.trim() ? { description: e.resumenDeSesion.trim() } : null,
    };
  }

  const cambiarSerie = (i: number, j: number, cambio: Partial<SerieEnCorreccion>) =>
    setEstado((s) => ({ ...s, series: s.series.map((fila, a) => (a === i ? fila.map((c, k) => (k === j ? { ...c, ...cambio } : c)) : fila)) }));

  async function enviar() {
    if (!motivo.trim()) return setFallo('Contá por qué corregís el registro.');
    const esNumero = (t: string) => t.trim() === '' || Number.isFinite(Number(t.trim().replace(',', '.')));
    if (!estado.series.every((fila) => fila.every((v) => esNumero(v.carga) && esNumero(v.reps) && esNumero(v.rir)))) return setFallo('Revisá los números de las series.');
    const correccion = construir(estado);
    // Corregir exige un cambio: una corrección igual a lo que rige no rectifica nada (B10-06:879-884).
    if (JSON.stringify(correccion) === JSON.stringify(construir(inicial))) return setFallo('La corrección no cambia nada del registro.');
    if (sinDatosOriginales && estado.condicion !== 'NOT_COMPLETED' && !estado.resumenDeSesion.trim()) return setFallo('Contá cómo fue la sesión.');
    setEnviando(true);
    setFallo(null);
    const r = await api.corregirEjecucion(token, x.executionId, { reason: motivo.trim(), correction: correccion }, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(r.tipo === 'API' && r.issues.some((i) => i.code === 'CORRECTION_WITHOUT_CHANGES') ? 'La corrección no cambia nada del registro.' : r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato de la corrección que no se puede guardar.' : falloDe(r).mensaje);
    onCorregida();
  }

  const CONDICIONES: readonly { valor: Condicion; texto: string }[] = [
    { valor: 'COMPLETED', texto: 'Realizada' },
    { valor: 'COMPLETED_WITH_DEVIATION', texto: 'Realizada con desvío' },
    { valor: 'NOT_COMPLETED', texto: COPY_ENTRENAMIENTO.noPudeRealizarla },
  ];

  return (
    <Seccion titulo={COPY_ENTRENAMIENTO.corregirRegistro}>
      <Campo etiqueta={COPY_ENTRENAMIENTO.motivoDeLaCorreccion} value={motivo} onChangeText={setMotivo} />
      <Subtitulo>{COPY_ENTRENAMIENTO.condicionDeLaSesion}</Subtitulo>
      {CONDICIONES.map((c) => (
        <Boton key={c.valor} texto={c.texto} tipo={estado.condicion === c.valor ? 'primario' : 'secundario'} seleccionado={estado.condicion === c.valor} onPress={() => setEstado((s) => ({ ...s, condicion: c.valor }))} />
      ))}
      <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} value={estado.motivoDeCondicion} onChangeText={(v) => setEstado((s) => ({ ...s, motivoDeCondicion: v }))} />
      {estado.condicion === 'NOT_COMPLETED' ? (
        <Parrafo tenue>La corrección queda sin series. El registro original se conserva tal como está.</Parrafo>
      ) : sinDatosOriginales ? (
        <Campo etiqueta={`${COPY_ENTRENAMIENTO.resumenDeLaSesion}: contá cómo fue`} value={estado.resumenDeSesion} onChangeText={(v) => setEstado((s) => ({ ...s, resumenDeSesion: v }))} multiline />
      ) : (
        <>
          {base.exercises.map((e, i) => (
            <View key={e.prescriptionId}>
              <Subtitulo>{e.performedExerciseName}</Subtitulo>
              {(e.sets ?? []).map((s, j) => {
                const v = estado.series[i]?.[j];
                return (
                  <View key={s.setIndex}>
                    <Parrafo>
                      {COPY_ENTRENAMIENTO.serie} {s.setIndex}
                    </Parrafo>
                    <Campo etiqueta={`${COPY_ENTRENAMIENTO.carga} (${v?.unidad ?? 'kg'})`} value={v?.carga ?? ''} onChangeText={(t) => cambiarSerie(i, j, { carga: t })} keyboardType="decimal-pad" />
                    <Boton texto={`Cambiar a ${v?.unidad === 'lb' ? 'kg' : 'lb'}`} tipo="enlace" onPress={() => cambiarSerie(i, j, { unidad: v?.unidad === 'lb' ? 'kg' : 'lb' })} />
                    <Campo etiqueta={COPY_ENTRENAMIENTO.reps} value={v?.reps ?? ''} onChangeText={(t) => cambiarSerie(i, j, { reps: t })} keyboardType="number-pad" />
                    <Campo etiqueta={`${COPY_ENTRENAMIENTO.rir} (opcional)`} value={v?.rir ?? ''} onChangeText={(t) => cambiarSerie(i, j, { rir: t })} keyboardType="number-pad" />
                  </View>
                );
              })}
              {e.executionSummary ? (
                <Campo
                  etiqueta={COPY_ENTRENAMIENTO.resumenDelEjercicio}
                  value={estado.resumenes[i] ?? ''}
                  onChangeText={(t) => setEstado((s) => ({ ...s, resumenes: s.resumenes.map((r0, k) => (k === i ? t : r0)) }))}
                  multiline
                />
              ) : null}
            </View>
          ))}
          {base.granularity === 'EXERCISE_OR_SESSION' ? (
            <Campo etiqueta={`${COPY_ENTRENAMIENTO.resumenDeLaSesion} (opcional)`} value={estado.resumenDeSesion} onChangeText={(v) => setEstado((s) => ({ ...s, resumenDeSesion: v }))} multiline />
          ) : null}
        </>
      )}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      <Boton texto="Registrar corrección" onPress={() => void enviar()} ocupado={enviando} />
      <Boton texto="Cancelar" tipo="enlace" onPress={onCancelar} deshabilitado={enviando} />
    </Seccion>
  );
}
