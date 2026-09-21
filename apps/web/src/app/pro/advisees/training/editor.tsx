'use client';

/**
 * Editor del borrador de plan (B10-06 §8-§23): Bloque → Microciclo opcional → Sesión → Prescripción de ejercicio.
 * - Un plan sin microciclos es natural: las sesiones cuelgan del bloque. Con microciclos, van bajo ellos. Nunca se
 *   fuerza un microciclo vacío (B10-06:275-281).
 * - El propósito del bloque o del microciclo es texto libre: sin «Acumulación / Intensificación / Descarga» como
 *   únicos tipos (B10-06:332-342).
 * - Intensidad: se elige **% RM o RIR**, o ninguno; nunca los dos a la vez (B10-06:398-410). La carga sugerida va
 *   aparte y se dice que no es el criterio (B10-06:463-477).
 * - Validar informa los problemas vinculados a bloque → sesión → ejercicio, sin «Programa óptimo» (B10-06:563-591).
 * - «Guardar» no activa. Activar pide confirmación con la consecuencia literal de B10-06:607.
 */
import {
  COPY,
  COPY_ENTRENAMIENTO,
  ETIQUETA_DE_CRITERIO,
  type EjercicioDeCatalogo,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type ValidationIssue,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import { useCallback, useEffect, useState, type ComponentProps, type FormEvent } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { NoDisponible, useEntrenamiento } from './entrenamiento';

type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
type BloqueE = Bloques[number];
type SesionE = NonNullable<BloqueE['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];
type Criterio = 'PERCENT_RM' | 'RIR';

/** La jerarquía de la respuesta como entrada del PATCH: con los identificadores, sin `order` ni nombres. */
function aEntrada(v: VersionDePlanDeEntrenamiento): Bloques {
  const sesion = (s: VersionDePlanDeEntrenamiento['blocks'][number]['sessions'][number]): SesionE => ({
    sessionId: s.sessionId,
    label: s.label,
    instructions: s.instructions,
    prescriptions: s.prescriptions.map((p) => ({
      prescriptionId: p.prescriptionId,
      exerciseVersionId: p.exerciseVersionId,
      sets: p.sets.map((x) => ({ repetitions: x.repetitions, note: x.note })),
      intensity: p.intensity ? { criterion: p.intensity.criterion, target: { value: p.intensity.target.value, reference: p.intensity.target.reference } } : null,
      suggestedLoad: p.suggestedLoad,
      professionalParameters: p.professionalParameters.map((q) => ({ label: q.label, value: q.value, unit: q.unit })),
      note: p.note,
    })),
  });
  return v.blocks.map((b) => ({
    blockId: b.blockId,
    label: b.label,
    purpose: b.purpose,
    microcycles: b.microcycles.map((m) => ({ microcycleId: m.microcycleId, label: m.label, purpose: m.purpose, sessions: m.sessions.map(sesion) })),
    sessions: b.sessions.map(sesion),
  }));
}

function nombresDe(v: VersionDePlanDeEntrenamiento): Record<string, string> {
  const n: Record<string, string> = {};
  const de = (s: VersionDePlanDeEntrenamiento['blocks'][number]['sessions']) => s.forEach((x) => x.prescriptions.forEach((p) => (n[p.exerciseVersionId] = p.exerciseName)));
  v.blocks.forEach((b) => {
    de(b.sessions);
    b.microcycles.forEach((m) => de(m.sessions));
  });
  return n;
}

/** Ubicación de un problema sin rutas técnicas: «Bloque 1 → Semana 1 → Sesión A → Ejercicio 2» (B10-06:571-577). */
function ubicacion(path: string, b: Bloques): string {
  // Un 400 de forma trae la ruta con puntos (changes.blocks.0.sessions.1…): se lee igual que la del dominio.
  const normalizada = path.replace(/^changes\./, '').replace(/\.(\d+)/g, '[$1]');
  const m = normalizada.match(/^blocks\[(\d+)\](?:\.microcycles\[(\d+)\])?(?:\.sessions\[(\d+)\])?(?:\.prescriptions\[(\d+)\])?/);
  if (!m) return 'Plan';
  const bloque = b[Number(m[1])];
  const partes = [bloque?.label || `Bloque ${Number(m[1]) + 1}`];
  const micro = m[2] !== undefined ? bloque?.microcycles?.[Number(m[2])] : undefined;
  if (m[2] !== undefined) partes.push(micro?.label || `Microciclo ${Number(m[2]) + 1}`);
  const sesiones = micro ? micro.sessions : bloque?.sessions;
  if (m[3] !== undefined) partes.push(sesiones?.[Number(m[3])]?.label || `Sesión ${Number(m[3]) + 1}`);
  if (m[4] !== undefined) partes.push(`Ejercicio ${Number(m[4]) + 1}`);
  return partes.join(' → ');
}

const PROBLEMA: Readonly<Record<string, string>> = {
  BLOCK_REQUIRED: 'falta al menos un bloque',
  SESSION_REQUIRED: 'falta al menos una sesión',
  PRESCRIPTION_REQUIRED: 'falta al menos un ejercicio',
  SESSIONS_AND_MICROCYCLES_IN_BLOCK: 'si el bloque tiene microciclos, las sesiones van dentro de ellos',
  DUPLICATE_NODE_ID: 'hay un elemento repetido',
  INTENSITY_CRITERION_UNKNOWN: 'el criterio de intensidad no es % RM ni RIR',
  INTENSITY_CRITERIA_COMBINED: 'se eligen % RM o RIR, no los dos',
  PERCEIVED_EXERTION_AS_CRITERION: 'el esfuerzo percibido se registra en la sesión: no es un criterio de prescripción',
  INTENSITY_TARGET_OUT_OF_RANGE: 'el objetivo de intensidad no tiene sentido para ese criterio',
  EXERCISE_REFERENCE_INVALID: 'el ejercicio no está en el catálogo',
  EXERCISE_NOT_AVAILABLE: 'el ejercicio ya no está disponible',
  OBJECTIVE_NOT_EFFECTIVE: 'el borrador usa un objetivo que ya no es el vigente',
  SNAPSHOT_NOT_PRESERVABLE: 'no se pudo preservar la versión para el asesorado',
  // Fallas de forma del pedido (400): un número que falta o que no se entiende.
  INVALID_TYPE: 'falta un número o no se entiende lo escrito',
  INVALID_UNION: 'falta un número o no se entiende lo escrito',
  TOO_SMALL: 'el número es demasiado chico',
  TOO_BIG: 'el número es demasiado grande',
  NOT_MULTIPLE_OF: 'el número no es entero',
};

const sesionVacia = (n: number): SesionE => ({ label: `Sesión ${String.fromCharCode(64 + Math.min(n, 26))}`, instructions: null, prescriptions: [] });

export function EditorDePlan({ planId, onActivado }: { planId: string; onActivado: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const [version, setVersion] = useState<VersionDePlanDeEntrenamiento | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [bloques, setBloques] = useState<Bloques>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [proximaRevision, setProximaRevision] = useState('');
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const [objetivoVigente, setObjetivoVigente] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setError(null);
    const [r, ob] = await Promise.all([api.consultarPlanDeEntrenamiento(token, planId), api.objetivoDeEntrenamientoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(r) || sesionPerdida(ob)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
    setVersion(r.datos.data);
    setBloques(aEntrada(r.datos.data));
    setNombres(nombresDe(r.datos.data));
    setProximaRevision(r.datos.data.nextReviewAt ?? '');
    setSucio(false);
    setObjetivoVigente(ob.ok ? (ob.datos.data.objective?.versionId ?? null) : null);
  }, [token, planId, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiar = (f: (b: Bloques) => Bloques) => {
    setBloques((b) => f(structuredClone(b)));
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  };

  async function guardar(): Promise<VersionDePlanDeEntrenamiento | null> {
    if (!version) return null;
    setGuardando(true);
    setMensaje(null);
    const actualizarObjetivo = objetivoVigente && objetivoVigente !== version.objectiveVersionId ? { objectiveVersionId: objetivoVigente } : {};
    const r = await api.editarPlanDeEntrenamiento(token, planId, { expectedVersion: version.version, changes: { blocks: bloques }, nextReviewAt: proximaRevision || null, ...actualizarObjetivo });
    setGuardando(false);
    if (sesionPerdida(r)) return null;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    setVersion(r.datos.data);
    setBloques(aEntrada(r.datos.data));
    setNombres((n) => ({ ...n, ...nombresDe(r.datos.data) }));
    setSucio(false);
    return r.datos.data;
  }

  async function validar() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    const r = await api.validarPlanDeEntrenamiento(token, planId, v.version);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: mensajeDeFallo(r) });
    setProblemas(r.datos.data.issues);
    setMensaje(r.datos.data.valid ? { tipo: 'exito', texto: COPY_ENTRENAMIENTO.sinProblemas } : { tipo: 'error', texto: 'Hay elementos por corregir antes de activar.' });
  }

  async function activar() {
    if (!version) return;
    setActivando(true);
    setFalloDeActivacion(null);
    const r = await api.activarPlanDeEntrenamiento(token, planId, version.version, intentoDeActivar.actual());
    intentoDeActivar.registrar(r);
    setActivando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) {
        setConfirmar(false);
        setProblemas(r.issues);
        return setMensaje({ tipo: 'error', texto: 'Hay elementos por corregir antes de activar.' });
      }
      if (r.tipo === 'API' && r.codigo === 'CAPACITY_NOT_AVAILABLE') return setFalloDeActivacion('No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.');
      if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_CONFLICT') return setFalloDeActivacion('El asesorado ya tiene un plan de entrenamiento vigente con otro profesional.');
      return setFalloDeActivacion(esIncierto(r) ? COPY.resultadoIncierto : 'No pudimos activar el plan. Probá de nuevo.');
    }
    setConfirmar(false);
    onActivado();
  }

  if (error === 'no-disponible') return <NoDisponible />;
  if (error === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (!version) return <Cargando />;

  const editorDeSesiones = (sesiones: SesionE[], ruta: (b: Bloques) => SesionE[], prefijo: string) => (
    <>
      {sesiones.map((s, k) => (
        <fieldset key={s.sessionId ?? k} className="nodo nodo--comida">
          <legend>{s.label || `Sesión ${k + 1}`}</legend>
          <Campo id={`${prefijo}-s${k}-nombre`} etiqueta="Nombre de la sesión" value={s.label} onChange={(e) => cambiar((x) => ((ruta(x)[k]!.label = e.target.value), x))} maxLength={120} />
          <div className="campo">
            <label htmlFor={`${prefijo}-s${k}-indicaciones`}>{COPY_ENTRENAMIENTO.indicaciones} (opcional)</label>
            <textarea id={`${prefijo}-s${k}-indicaciones`} rows={2} value={s.instructions ?? ''} onChange={(e) => cambiar((x) => ((ruta(x)[k]!.instructions = e.target.value || null), x))} maxLength={2000} />
          </div>
          <ul className="items">
            {s.prescriptions.map((p, l) => (
              <EditorDePrescripcion
                key={p.prescriptionId ?? l}
                id={`${prefijo}-s${k}-p${l}`}
                prescripcion={p}
                nombre={nombres[p.exerciseVersionId] ?? 'Ejercicio'}
                onCambiar={(c) => cambiar((x) => ((ruta(x)[k]!.prescriptions[l] = { ...p, ...c }), x))}
                onQuitar={() => cambiar((x) => (ruta(x)[k]!.prescriptions.splice(l, 1), x))}
              />
            ))}
          </ul>
          <BuscadorDeEjercicios
            id={`${prefijo}-s${k}-buscar`}
            onElegir={(e) => {
              setNombres((n) => ({ ...n, [e.versionId]: e.name }));
              cambiar((x) => (ruta(x)[k]!.prescriptions.push({ exerciseVersionId: e.versionId, sets: [{ repetitions: null }], intensity: null }), x));
            }}
          />
          <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (ruta(x).splice(k, 1), x))}>
            Quitar sesión
          </button>
        </fieldset>
      ))}
    </>
  );

  return (
    <section className="seccion" aria-labelledby="titulo-borrador">
      <h2 id="titulo-borrador">
        Versión en preparación <span className="insignia">{COPY_ENTRENAMIENTO.borrador}</span>
      </h2>
      <p className="nota">El borrador no es visible para el asesorado. Guardar no activa.</p>
      {version.predecessorPlanId ? <p className="nota">Nueva versión a partir de la versión activa. La versión activa no cambia hasta que actives esta.</p> : null}
      {objetivoVigente && objetivoVigente !== version.objectiveVersionId ? (
        <Aviso tipo="info">
          <p>Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.</p>
        </Aviso>
      ) : null}

      <div className="jerarquia">
        {bloques.map((b, i) => {
          const conMicro = (b.microcycles ?? []).length > 0;
          return (
            <fieldset key={b.blockId ?? i} className="nodo nodo--dia">
              <legend>
                {COPY_ENTRENAMIENTO.bloque} {i + 1}
              </legend>
              <Campo id={`b${i}-nombre`} etiqueta="Nombre del bloque" value={b.label} onChange={(e) => cambiar((x) => ((x[i]!.label = e.target.value), x))} maxLength={120} />
              <Campo id={`b${i}-proposito`} etiqueta={`${COPY_ENTRENAMIENTO.proposito} (opcional)`} ayuda="Texto libre: BE no fija tipos de bloque." value={b.purpose ?? ''} onChange={(e) => cambiar((x) => ((x[i]!.purpose = e.target.value || null), x))} maxLength={1000} />
              {conMicro
                ? (b.microcycles ?? []).map((m, j) => (
                    <fieldset key={m.microcycleId ?? j} className="nodo nodo--opcion">
                      <legend>
                        {COPY_ENTRENAMIENTO.microciclo} {j + 1}
                      </legend>
                      <Campo id={`b${i}-m${j}-nombre`} etiqueta="Nombre del microciclo" value={m.label} onChange={(e) => cambiar((x) => ((x[i]!.microcycles![j]!.label = e.target.value), x))} maxLength={120} />
                      <Campo id={`b${i}-m${j}-proposito`} etiqueta={`${COPY_ENTRENAMIENTO.proposito} (opcional)`} value={m.purpose ?? ''} onChange={(e) => cambiar((x) => ((x[i]!.microcycles![j]!.purpose = e.target.value || null), x))} maxLength={1000} />
                      {editorDeSesiones(m.sessions, (x) => x[i]!.microcycles![j]!.sessions, `b${i}-m${j}`)}
                      <div className="acciones">
                        <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x[i]!.microcycles![j]!.sessions.push(sesionVacia(m.sessions.length + 1)), x))}>
                          {COPY_ENTRENAMIENTO.agregarSesion}
                        </button>
                        <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x[i]!.microcycles!.splice(j, 1), x))}>
                          Quitar microciclo
                        </button>
                      </div>
                    </fieldset>
                  ))
                : editorDeSesiones(b.sessions ?? [], (x) => (x[i]!.sessions ??= []), `b${i}`)}
              <div className="acciones">
                {conMicro ? (
                  <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x[i]!.microcycles!.push({ label: `Semana ${(b.microcycles ?? []).length + 1}`, purpose: null, sessions: [] }), x))}>
                    {COPY_ENTRENAMIENTO.agregarMicrociclo}
                  </button>
                ) : (
                  <>
                    <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => ((x[i]!.sessions ??= []).push(sesionVacia((b.sessions ?? []).length + 1)), x))}>
                      {COPY_ENTRENAMIENTO.agregarSesion}
                    </button>
                    {(b.sessions ?? []).length === 0 ? (
                      <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => ((x[i]!.microcycles = [{ label: 'Semana 1', purpose: null, sessions: [] }]), x))}>
                        Organizar por microciclos
                      </button>
                    ) : null}
                  </>
                )}
                {bloques.length > 1 ? (
                  <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x.splice(i, 1), x))}>
                    Quitar bloque
                  </button>
                ) : null}
              </div>
            </fieldset>
          );
        })}
        <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x.push({ label: `Bloque ${x.length + 1}`, sessions: [] }), x))}>
          {COPY_ENTRENAMIENTO.agregarBloque}
        </button>
      </div>

      <Campo
        id="trn-proxima-revision"
        etiqueta="Próxima revisión (opcional)"
        ayuda="Si la fijás, al activar queda como revisión pendiente del seguimiento a partir de esa fecha."
        type="date"
        value={proximaRevision}
        onChange={(e) => {
          setProximaRevision(e.target.value);
          setSucio(true);
        }}
      />

      <p className="nota" aria-live="polite">
        {guardando ? 'Guardando…' : sucio ? 'Hay cambios sin guardar.' : 'Guardado.'}
      </p>
      {mensaje ? (
        <Aviso tipo={mensaje.tipo} enfocar={mensaje.tipo !== 'info'}>
          <p>{mensaje.texto}</p>
          {problemas && problemas.length > 0 ? (
            <ul>
              {problemas.map((p, i) => (
                <li key={i}>
                  {ubicacion(p.path, bloques)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                </li>
              ))}
            </ul>
          ) : null}
        </Aviso>
      ) : null}
      <p className="nota">{COPY_ENTRENAMIENTO.noJuzga}</p>
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => void guardar()} disabled={guardando || !sucio}>
          {COPY_ENTRENAMIENTO.guardarBorrador}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => void validar()} disabled={guardando}>
          {COPY_ENTRENAMIENTO.validarPlan}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => setConfirmar(true)} disabled={guardando || sucio}>
          {COPY_ENTRENAMIENTO.activarPlan}
        </button>
      </div>
      {sucio ? <p className="nota">Guardá los cambios antes de activar.</p> : null}

      <DialogoDeConfirmacion
        abierto={confirmar}
        titulo={COPY_ENTRENAMIENTO.activarPlan}
        textoVolver="Volver"
        textoConfirmar="Activar esta versión"
        textoEnviando="Activando…"
        enviando={activando}
        error={falloDeActivacion}
        onVolver={() => {
          setConfirmar(false);
          setFalloDeActivacion(null);
          intentoDeActivar.descartar();
        }}
        onConfirmar={() => void activar()}
      >
        <p>{COPY_ENTRENAMIENTO.consecuenciaDeActivar}</p>
      </DialogoDeConfirmacion>
    </section>
  );
}

/**
 * Un campo cuyo texto se interpreta (un número, un rango): guarda el texto tal como se escribe y propaga lo
 * interpretado. Si el campo mostrara siempre el valor interpretado, «6-» o «62.» se borrarían a mitad de camino y no se
 * podría escribir un rango ni una carga con decimales. Lo que no se entiende se propaga como NaN: el guardado falla y
 * señala el ejercicio, en vez de guardar otra cosa en silencio. Si el valor cambia desde afuera (al guardar, al quitar
 * un ejercicio), el texto se resincroniza.
 */
function CampoInterpretado<T>({
  valor,
  formatear,
  interpretar,
  onCambiar,
  ...campo
}: Omit<ComponentProps<typeof Campo>, 'value' | 'onChange'> & { valor: T; formatear: (v: T) => string; interpretar: (s: string) => T; onCambiar: (v: T) => void }) {
  const externo = formatear(valor);
  const [texto, setTexto] = useState(externo);
  useEffect(() => {
    // Solo importa el valor de afuera: formatear e interpretar son funciones puras.
    setTexto((t) => (formatear(interpretar(t)) === externo ? t : externo));
  }, [externo]);
  return (
    <Campo
      {...campo}
      value={texto}
      onChange={(e) => {
        setTexto(e.target.value);
        onCambiar(interpretar(e.target.value));
      }}
    />
  );
}

/** Un número con coma o punto decimal. Vacío → null; lo que no es un número → NaN. */
function leerNumero(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : Number.NaN;
}
const escribirNumero = (n: number | null): string => (n === null || Number.isNaN(n) ? '' : String(n));

/** Una prescripción: series y repeticiones, criterio de intensidad explícito, carga sugerida aparte, parámetros. */
function EditorDePrescripcion({ id, prescripcion: p, nombre, onCambiar, onQuitar }: { id: string; prescripcion: PrescripcionE; nombre: string; onCambiar: (c: Partial<PrescripcionE>) => void; onQuitar: () => void }) {
  const criterio = (p.intensity?.criterion as Criterio | undefined) ?? '';
  type Repeticiones = PrescripcionE['sets'][number]['repetitions'];
  const reps = (r: Repeticiones) => (!r ? '' : 'value' in r ? (Number.isNaN(r.value) ? '' : String(r.value)) : `${r.min}-${r.max}`);
  // Vacío: sin repeticiones fijadas. Un número o un rango «8-12». Otra cosa no se guarda como si no hubiera nada.
  const leerReps = (s: string): Repeticiones => {
    if (s.trim() === '') return null;
    const rango = s.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
    if (rango) return { min: Number(rango[1]), max: Number(rango[2]) };
    const n = Number(s.trim());
    return { value: Number.isInteger(n) && n > 0 ? n : Number.NaN };
  };
  const parametros = p.professionalParameters ?? [];
  return (
    <li className="fila-de-item">
      <strong>{nombre}</strong>
      <fieldset className="grupo">
        <legend>
          {COPY_ENTRENAMIENTO.series} y {COPY_ENTRENAMIENTO.repeticiones.toLowerCase()}
        </legend>
        {p.sets.map((s, i) => (
          <CampoInterpretado
            key={i}
            id={`${id}-serie-${i}`}
            etiqueta={`${COPY_ENTRENAMIENTO.serie} ${i + 1}: repeticiones (un número o un rango, 8-12)`}
            valor={s.repetitions}
            formatear={reps}
            interpretar={leerReps}
            onCambiar={(r) => onCambiar({ sets: p.sets.map((x, j) => (j === i ? { ...x, repetitions: r } : x)) })}
          />
        ))}
        <div className="acciones">
          <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ sets: [...p.sets, { repetitions: p.sets[p.sets.length - 1]?.repetitions ?? null }] })}>
            Agregar serie
          </button>
          {p.sets.length > 0 ? (
            <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ sets: p.sets.slice(0, -1) })}>
              Quitar la última serie
            </button>
          ) : null}
        </div>
      </fieldset>
      <fieldset className="grupo">
        <legend>{COPY_ENTRENAMIENTO.intensidad}</legend>
        <div className="campo">
          <label htmlFor={`${id}-criterio`}>Criterio</label>
          <select
            id={`${id}-criterio`}
            value={criterio}
            onChange={(e) => {
              const c = e.target.value as Criterio | '';
              onCambiar({ intensity: c ? { criterion: c, target: { value: c === 'RIR' ? 2 : 70, reference: null } } : null });
            }}
          >
            <option value="">{COPY_ENTRENAMIENTO.sinCriterio}</option>
            {(Object.keys(ETIQUETA_DE_CRITERIO) as Criterio[]).map((c) => (
              <option key={c} value={c}>
                {ETIQUETA_DE_CRITERIO[c]}
              </option>
            ))}
          </select>
          {criterio === 'RIR' ? <p className="campo__ayuda">{COPY_ENTRENAMIENTO.explicacionRir}</p> : null}
        </div>
        {p.intensity ? (
          <>
            <CampoInterpretado
              id={`${id}-objetivo`}
              etiqueta={`${COPY_ENTRENAMIENTO.objetivoDeIntensidad} (${ETIQUETA_DE_CRITERIO[criterio as Criterio]})`}
              inputMode="decimal"
              valor={p.intensity.target.value}
              formatear={escribirNumero}
              // Con un criterio elegido, el objetivo es obligatorio: vacío no es cero.
              interpretar={(t) => leerNumero(t) ?? Number.NaN}
              onCambiar={(v) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, value: v } } })}
            />
            {criterio === 'PERCENT_RM' ? (
              <Campo
                id={`${id}-referencia`}
                etiqueta={`${COPY_ENTRENAMIENTO.referenciaDeRm} (opcional)`}
                ayuda="Por ejemplo: 1RM estimado por el método que usaste. BE no estima la repetición máxima."
                value={p.intensity.target.reference?.description ?? ''}
                onChange={(e) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, reference: e.target.value ? { description: e.target.value } : null } } })}
                maxLength={500}
              />
            ) : null}
          </>
        ) : null}
      </fieldset>
      <fieldset className="grupo">
        <legend>{COPY_ENTRENAMIENTO.cargaSugerida} (opcional)</legend>
        <p className="campo__ayuda">{COPY_ENTRENAMIENTO.cargaNoEsIntensidad}</p>
        <div className="fila-de-dato">
          <CampoInterpretado
            id={`${id}-carga`}
            etiqueta={COPY_ENTRENAMIENTO.carga}
            inputMode="decimal"
            valor={p.suggestedLoad ? p.suggestedLoad.value : null}
            formatear={escribirNumero}
            interpretar={leerNumero}
            onCambiar={(v) => onCambiar({ suggestedLoad: v === null ? null : { value: v, unit: p.suggestedLoad?.unit ?? 'kg' } })}
          />
          <div className="campo">
            <label htmlFor={`${id}-unidad`}>Unidad</label>
            <select id={`${id}-unidad`} value={p.suggestedLoad?.unit ?? 'kg'} disabled={!p.suggestedLoad} onChange={(e) => p.suggestedLoad && onCambiar({ suggestedLoad: { ...p.suggestedLoad, unit: e.target.value as 'kg' | 'lb' } })}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
      </fieldset>
      <fieldset className="grupo">
        <legend>{COPY_ENTRENAMIENTO.parametros} (opcional)</legend>
        {parametros.map((q, i) => (
          <div key={i} className="fila-de-dato">
            <Campo id={`${id}-param-${i}-etiqueta`} etiqueta="Parámetro" value={q.label} onChange={(e) => onCambiar({ professionalParameters: parametros.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} maxLength={60} />
            <Campo
              id={`${id}-param-${i}-valor`}
              etiqueta="Valor"
              value={String(q.value)}
              onChange={(e) => {
                const v = e.target.value;
                onCambiar({ professionalParameters: parametros.map((x, j) => (j === i ? { ...x, value: /^\d+([.,]\d+)?$/.test(v.trim()) ? Number(v.replace(',', '.')) : v } : x)) });
              }}
              maxLength={120}
            />
            <Campo id={`${id}-param-${i}-unidad`} etiqueta="Unidad (si es un número)" value={q.unit ?? ''} onChange={(e) => onCambiar({ professionalParameters: parametros.map((x, j) => (j === i ? { ...x, unit: e.target.value || null } : x)) })} maxLength={20} />
            <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ professionalParameters: parametros.filter((_, j) => j !== i) })}>
              Quitar parámetro
            </button>
          </div>
        ))}
        <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ professionalParameters: [...parametros, { label: 'Descanso', value: 90, unit: 's' }] })}>
          Agregar parámetro
        </button>
      </fieldset>
      <div className="campo">
        <label htmlFor={`${id}-nota`}>{COPY_ENTRENAMIENTO.notas} (opcional)</label>
        <textarea id={`${id}-nota`} rows={2} value={p.note ?? ''} onChange={(e) => onCambiar({ note: e.target.value || null })} maxLength={1000} />
      </div>
      <button type="button" className="boton boton--enlace" onClick={onQuitar}>
        Quitar {nombre}
      </button>
    </li>
  );
}

/** «Agregar ejercicio → buscar catálogo BE» o «Crear manualmente» (B10-06:485-498). wger llega en WP-07. */
function BuscadorDeEjercicios({ id, onElegir }: { id: string; onElegir: (e: EjercicioDeCatalogo) => void }) {
  const { token, sesionPerdida } = useEntrenamiento();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<EjercicioDeCatalogo[] | null>(null);
  const [manual, setManual] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();

  async function buscar(e: FormEvent) {
    e.preventDefault();
    const r = await api.buscarEjercicios(token, texto.trim());
    if (sesionPerdida(r)) return;
    setResultados(r.ok ? r.datos.data : []);
  }

  async function crear() {
    if (!nombre.trim()) return setFallo('Escribí el nombre del ejercicio.');
    const r = await api.crearEjercicio(token, nombre.trim(), intento.actual());
    intento.registrar(r);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onElegir(r.datos.data);
    setManual(false);
    setAbierto(false);
    setNombre('');
  }

  if (!abierto) {
    return (
      <button type="button" className="boton boton--secundario" onClick={() => setAbierto(true)}>
        {COPY_ENTRENAMIENTO.agregarEjercicio}
      </button>
    );
  }
  return (
    <div className="buscador">
      <form onSubmit={buscar} className="fila-de-dato">
        <Campo id={`${id}-texto`} etiqueta={COPY_ENTRENAMIENTO.buscarEjercicio} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="submit" className="boton boton--secundario">
          Buscar
        </button>
      </form>
      <p className="nota">{COPY_ENTRENAMIENTO.catalogoSintetico}</p>
      {resultados ? (
        resultados.length === 0 ? (
          <p>No encontramos ejercicios con ese nombre.</p>
        ) : (
          <ul className="lista">
            {resultados.map((ej) => (
              <li key={ej.versionId} className="lista__item">
                <span>
                  {ej.name}
                  {ej.provenance === 'PROFESSIONAL_MANUAL' ? <span className="nota"> · cargado por vos</span> : null}
                </span>
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    onElegir(ej);
                    setAbierto(false);
                    setResultados(null);
                    setTexto('');
                  }}
                >
                  Elegir {ej.name}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
      {manual ? (
        <fieldset className="grupo">
          <legend>{COPY_ENTRENAMIENTO.crearManualmente}</legend>
          <Campo id={`${id}-nombre`} etiqueta="Nombre del ejercicio" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
          <p className="nota">Las zonas musculares y el material didáctico se suman más adelante.</p>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void crear()}>
              Crear y agregar
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" className="boton boton--enlace" onClick={() => setManual(true)}>
          {COPY_ENTRENAMIENTO.crearManualmente}
        </button>
      )}
      <button type="button" className="boton boton--enlace" onClick={() => setAbierto(false)}>
        Cerrar búsqueda
      </button>
    </div>
  );
}
