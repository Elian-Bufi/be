'use client';

/**
 * Resumen de Entrenamiento (B10-06 §2, §3, §7): estado del seguimiento, objetivo vigente, plan activo, última
 * evaluación, última sesión registrada, última revisión y próxima acción.
 * - Sin puntaje general, sin «fatiga» inferida, sin «riesgo» automático y sin progresión recomendada (B10-06:110-115).
 * - La evaluación marca la fuente de cada dato; el self-reported no se presenta como diagnóstico (B10-06:132-145).
 * - El objetivo es «Nueva versión de objetivo», nunca «Editar objetivo actual» (B10-06:253-259).
 * - PF-02 (DL-102): la evaluación cita respuestas de formulario **por referencia**. Lo citado se muestra como declarado
 *   por la persona, con su fecha, y nunca como un dato observado por el profesional (CA-FOR-04).
 */
import {
  CONCEPTOS_FRECUENTES_DE_ENTRENAMIENTO,
  COPY_DE_LA_EVALUACION,
  type ConceptoFrecuente,
  COPY_PRIMER_PLAN,
  COPY_ENTRENAMIENTO,
  COPY_FORMULARIOS,
  ETIQUETA_DE_FUENTE,
  ETIQUETA_DE_RESULTADO,
  etiquetaDeCondicionRegistrada,
  leerNumero,
  numero,
  registroVigente,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EvaluacionDeEntrenamiento,
  type RespuestaCitada,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type VersionDeObjetivoDeEntrenamiento,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Ayuda, AvisoFlotante } from '../../../../components/ayuda';
import { Aviso, Campo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { tomarAvisoPara } from '../../../../lib/aviso-al-llegar';
import { Cargando } from '../../../../components/estados';
import { datosDe, fallo, LecturasParciales, SegunLectura, type Lectura } from '../lecturas-parciales';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import {
  alternarSeleccion,
  cargarPaginaDeCitables,
  cargarPaginasDeCitables,
  citasAEnviar,
  claveDe,
  excesoDeSeleccion,
  LIMITE_DE_PAGINA,
  MAXIMO_DE_CITAS,
  reconciliarSeleccion,
  valorDeclarado,
  type Citable,
  type FuenteDeContexto,
} from './contexto-citable';
import { useEntrenamiento } from './entrenamiento';
import { ConceptosFrecuentes, lugarDelConcepto } from '../conceptos-frecuentes';
import { evaluacionMasReciente } from '../evaluacion-reciente';

interface Lecturas {
  readonly evaluaciones: Lectura<readonly EvaluacionDeEntrenamiento[]>;
  /** El objetivo vigente; adentro, `null` si no hay. */
  readonly objetivo: Lectura<VersionDeObjetivoDeEntrenamiento | null>;
  readonly historia: Lectura<readonly VersionDeObjetivoDeEntrenamiento[]>;
  readonly planes: Lectura<readonly ResumenDeVersionDePlanDeEntrenamiento[]>;
  readonly contexto: Lectura<ContextoDeRevisionDeEntrenamientoResponse['data']>;
}
type Clave = keyof Lecturas;
const TODAS: readonly Clave[] = ['evaluaciones', 'objetivo', 'historia', 'planes', 'contexto'];
const NOMBRE: Readonly<Record<Clave, string>> = {
  evaluaciones: 'las evaluaciones',
  objetivo: 'el objetivo vigente',
  historia: 'el historial de objetivos',
  planes: 'las versiones del plan',
  contexto: 'el estado del seguimiento',
};

/**
 * Bloque 5 del encargo de consolidación (2026-10-19): las cinco lecturas tienen cada una su estado. Si falla una, el
 * resto sigue a la vista, el aviso de arriba dice qué falta y vuelve a pedir solo eso, y cada dato que dependía de lo
 * que falta dice «No se pudo leer», nunca «no hay» (`lecturas-parciales.tsx`).
 */
export function VistaDeResumen() {
  const { token, asesoradoId, sesionPerdida, irA } = useEntrenamiento();
  const [lecturas, setLecturas] = useState<Lecturas>({ evaluaciones: null, objetivo: null, historia: null, planes: null, contexto: null });
  const [formulario, setFormulario] = useState<'evaluacion' | 'objetivo' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Una respuesta que llega después de un pedido más nuevo de la misma lectura no lo pisa.
  const turnos = useRef<Record<Clave, number>>({ evaluaciones: 0, objetivo: 0, historia: 0, planes: 0, contexto: 0 });
  // Lo que alguien dejó dicho para esta página antes de volver a ella: «Solicitud enviada.», cuando el pedido de
  // contexto salió de acá (CA-FOR-06). Se toma una vez.
  useEffect(() => {
    const alLlegar = tomarAvisoPara('/pro/advisees/training');
    if (alLlegar) setAviso(alLlegar);
  }, []);

  /** Lee lo pedido (todo, o solo lo que falló); lo demás queda como está. */
  const leer = useCallback(
    async (cuales: readonly Clave[]) => {
      const turno = Object.fromEntries(cuales.map((c) => [c, ++turnos.current[c]])) as Partial<Record<Clave, number>>;
      const pedido = (c: Clave) => cuales.includes(c);
      // Lo que se vuelve a pedir pasa a «Cargando…» en su lugar; lo demás queda a la vista.
      setLecturas((l) => ({
        evaluaciones: pedido('evaluaciones') ? null : l.evaluaciones,
        objetivo: pedido('objetivo') ? null : l.objetivo,
        historia: pedido('historia') ? null : l.historia,
        planes: pedido('planes') ? null : l.planes,
        contexto: pedido('contexto') ? null : l.contexto,
      }));
      const [ev, ob, hi, pl, cx] = await Promise.all([
        pedido('evaluaciones') ? api.listarEvaluacionesDeEntrenamiento(token, asesoradoId) : null,
        pedido('objetivo') ? api.objetivoDeEntrenamientoEfectivo(token, asesoradoId) : null,
        pedido('historia') ? api.listarObjetivosDeEntrenamiento(token, asesoradoId) : null,
        pedido('planes') ? api.listarPlanesDeEntrenamiento(token, asesoradoId) : null,
        pedido('contexto') ? api.contextoDeRevisionDeEntrenamiento(token, asesoradoId) : null,
      ]);
      for (const x of [ev, ob, hi, pl, cx]) if (x && sesionPerdida(x)) return;
      const vigente = (c: Clave) => turno[c] === turnos.current[c];
      setLecturas((l) => ({
        evaluaciones: ev && vigente('evaluaciones') ? datosDe(ev) : l.evaluaciones,
        objetivo: ob && vigente('objetivo') ? (ob.ok ? { ok: true, datos: ob.datos.data.objective } : (ob as Resultado<never>)) : l.objetivo,
        historia: hi && vigente('historia') ? datosDe(hi) : l.historia,
        planes: pl && vigente('planes') ? datosDe(pl) : l.planes,
        contexto: cx && vigente('contexto') ? datosDe(cx) : l.contexto,
      }));
    },
    [token, asesoradoId, sesionPerdida],
  );

  useEffect(() => {
    void leer(TODAS);
  }, [leer]);

  const { evaluaciones, objetivo, historia } = lecturas;
  // Una versión nueva del objetivo se funda en una evaluación y reemplaza a la vigente: hacen falta las dos lecturas.
  const sePuedeEmitir = !!evaluaciones?.ok && !!objetivo?.ok && evaluaciones.datos.length > 0;
  const porQueNo =
    evaluaciones === null || objetivo === null
      ? null
      : !evaluaciones.ok || !objetivo.ok
        ? 'Para una versión nueva del objetivo hay que poder leer las evaluaciones y el objetivo vigente.'
        : evaluaciones.datos.length === 0
          ? 'El objetivo se funda en una evaluación: registrá una primero.'
          : null;

  return (
    <LecturasParciales lecturas={TODAS.map((c) => ({ nombre: NOMBRE[c], lectura: lecturas[c] }))} onReintentar={() => void leer(TODAS.filter((c) => fallo(lecturas[c])))}>
      <div className="secciones">
        {aviso ? (
          <AvisoFlotante onCerrar={() => setAviso(null)}>
            <p>{aviso}</p>
          </AvisoFlotante>
        ) : null}
        <Estado lecturas={lecturas} onIrA={irA} />

        <section className="seccion" aria-labelledby="titulo-objetivo">
          <h2 id="titulo-objetivo">{COPY_ENTRENAMIENTO.objetivoVigente}</h2>
          <SegunLectura lectura={objetivo}>
            {(vigente) =>
              vigente ? (
                <>
                  <p>{vigente.objective.statement}</p>
                  <p className="nota">
                    Fundamento: {vigente.rationale} · vigente desde el {fecha(vigente.effectiveFrom)}
                  </p>
                </>
              ) : (
                <p>{COPY_ENTRENAMIENTO.sinObjetivo}</p>
              )
            }
          </SegunLectura>
          {historia?.ok && historia.datos.length > 1 ? (
            <details>
              <summary>Historial del objetivo ({historia.datos.length} versiones)</summary>
              <ol className="historial">
                {historia.datos.map((v) => (
                  <li key={v.versionId}>
                    {fecha(v.createdAt)} · {v.objective.statement} {v.isEffective ? <span className="insignia">vigente</span> : null}
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
          {formulario === 'objetivo' && evaluaciones?.ok ? (
            <FormularioDeObjetivo
              evaluaciones={evaluaciones.datos}
              onEmitido={() => {
                setFormulario(null);
                setAviso('Nueva versión del objetivo emitida. La anterior se conserva en el historial.');
                void leer(TODAS);
              }}
              onCancelar={() => setFormulario(null)}
            />
          ) : (
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => setFormulario('objetivo')} disabled={!sePuedeEmitir}>
                {objetivo?.ok && objetivo.datos ? COPY_ENTRENAMIENTO.nuevaVersionDeObjetivo : COPY_ENTRENAMIENTO.definirObjetivo}
              </button>
            </div>
          )}
          {porQueNo ? <p className="nota">{porQueNo}</p> : null}
        </section>

        <section className="seccion" aria-labelledby="titulo-evaluacion">
          <h2 id="titulo-evaluacion">Evaluaciones</h2>
          {evaluaciones === null ? <Cargando /> : null}
          {evaluaciones && !evaluaciones.ok ? <p className="nota">No se pudieron leer las evaluaciones: el aviso de arriba las vuelve a pedir.</p> : null}
          {evaluaciones?.ok && evaluaciones.datos.length === 0 ? <p>{COPY_ENTRENAMIENTO.sinEvaluacion}</p> : null}
          {evaluaciones?.ok ? (
            <ul className="lista">
              {evaluaciones.datos.map((e) => (
                <li key={e.evaluationId} className="lista__item">
                  <p className="lista__titulo">Evaluación del {fecha(e.occurredAt)}</p>
                  <dl className="datos">
                    {e.assessment.entries.map((d, i) => (
                      <div key={i}>
                        <dt>{d.concept}</dt>
                        <dd>
                          {/* Un dato de evaluación puede ser texto o número: el número se muestra con coma (DL-091 punto 4). */}
                          {typeof d.value === 'number' ? numero(d.value) : String(d.value)}
                          {d.unit ? ` ${d.unit}` : ''} <span className="nota">· {ETIQUETA_DE_FUENTE[d.source]}{d.methodStatement ? ` · Método: ${d.methodStatement}` : ''}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {e.formResponseReferences.length > 0 ? <ContextoCitado citas={e.formResponseReferences} /> : null}
                  {e.context ? <p className="nota">Contexto: {e.context}</p> : null}
                  {e.professionalNotes ? <p className="nota">{e.professionalNotes}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {formulario === 'evaluacion' ? (
            <FormularioDeEvaluacion
              onRegistrada={() => {
                setFormulario(null);
                setAviso('Evaluación registrada.');
                void leer(TODAS);
              }}
              onCancelar={() => setFormulario(null)}
            />
          ) : (
            <>
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setFormulario('evaluacion')}>
                  {COPY_ENTRENAMIENTO.nuevaEvaluacion}
                </button>
                {/* PF-02 (CA-FOR-06): pedir contexto desde acá y volver acá al enviarlo. */}
                <Link className="boton boton--secundario" href={`/pro/advisees/forms?id=${encodeURIComponent(asesoradoId)}&vista=pedir&plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento`}>
                  {COPY_ENTRENAMIENTO.solicitarContexto}
                </Link>
              </div>
              <Ayuda titulo="Qué se le pide a la persona">
                <p>{COPY_ENTRENAMIENTO.ayudaSolicitarContexto}</p>
              </Ayuda>
            </>
          )}
        </section>
      </div>
    </LecturasParciales>
  );
}

/** Estado del seguimiento, plan activo, última sesión registrada, última revisión y próxima acción. Cada dato, según su lectura. */
function Estado({ lecturas, onIrA }: { lecturas: Lecturas; onIrA: (v: 'plan' | 'ejecuciones' | 'revisiones') => void }) {
  const { planes, contexto } = lecturas;
  return (
    <section className="seccion" aria-labelledby="titulo-estado">
      <h2 id="titulo-estado">Estado del seguimiento</h2>
      <dl className="datos">
        <div>
          <dt>Seguimiento</dt>
          <dd>
            <SegunLectura lectura={contexto}>{(c) => (c.process ? (c.process.state === 'ABIERTO' ? 'Abierto' : 'Cerrado') : 'Empieza al activar el primer plan')}</SegunLectura>
          </dd>
        </div>
        <div>
          <dt>Plan activo</dt>
          <dd>
            <SegunLectura lectura={planes}>
              {(versiones) => {
                const activo = versiones.find((p) => p.isEffective) ?? null;
                return (
                  <>
                    {activo ? `Activado el ${fecha(activo.activatedAt as string)}` : COPY_ENTRENAMIENTO.sinPlanActivo}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => onIrA('plan')}>
                      {activo ? 'Ver plan' : COPY_PRIMER_PLAN.titulo}
                    </button>
                  </>
                );
              }}
            </SegunLectura>
          </dd>
        </div>
        <div>
          {/* El período es el que devolvió la lectura, no un «últimos 7 días» fijo que podía no ser cierto (DL-091 punto 2). */}
          <dt>
            Última sesión registrada
            {contexto?.ok ? ` (${dia(`${contexto.datos.period.start}T12:00:00Z`)} a ${dia(`${contexto.datos.period.end}T12:00:00Z`)})` : ''}
          </dt>
          <dd>
            <SegunLectura lectura={contexto}>
              {(c) => {
                const ultima = [...c.registeredExecutions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
                return (
                  <>
                    {ultima ? `${ultima.plannedSession.label} · ${dia(`${ultima.date}T12:00:00Z`)} · ${etiquetaDeCondicionRegistrada(registroVigente(ultima))}` : COPY_ENTRENAMIENTO.sinEjecuciones}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => onIrA('ejecuciones')}>
                      Ver registros
                    </button>
                  </>
                );
              }}
            </SegunLectura>
          </dd>
        </div>
        <div>
          <dt>Última revisión</dt>
          <dd>
            <SegunLectura lectura={contexto}>
              {(c) => {
                const revision = c.previousReviews[0] ?? null;
                return (
                  <>
                    {revision ? `${ETIQUETA_DE_RESULTADO[revision.result]} · ${fecha(revision.recordedAt)} · Próxima acción: ${revision.nextAction.description}` : 'Todavía no hay revisiones.'}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => onIrA('revisiones')}>
                      Ver revisiones
                    </button>
                  </>
                );
              }}
            </SegunLectura>
          </dd>
        </div>
      </dl>
      {contexto?.ok && contexto.datos.pendingReview.pending ? (
        <Aviso tipo="info">
          <p>Revisión pendiente desde el {dia(`${contexto.datos.pendingReview.since}T12:00:00Z`)}.</p>
        </Aviso>
      ) : null}
    </section>
  );
}

/** Lo citado en una evaluación (DL-102): declarado por la persona, con fecha, y el aviso si lo actualizó después. */
function ContextoCitado({ citas }: { citas: readonly RespuestaCitada[] }) {
  return (
    <div>
      <p className="lista__titulo">{COPY_ENTRENAMIENTO.contextoCitado}</p>
      <dl className="datos">
        {citas.map((c) => (
          <div key={`${c.formResponseId}#${c.fieldCode}`}>
            <dt>{c.label}</dt>
            <dd>
              {valorDeclarado(c.value, c.unit)}{' '}
              <span className="nota">
                · {COPY_FORMULARIOS.declaradoPorLaPersona} el {fecha(c.answeredAt)}
              </span>
              {c.laterVersionExists ? <p className="nota">{COPY_ENTRENAMIENTO.actualizadaDespues}</p> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type Fuente = 'REPORTED' | 'OBSERVED' | 'CALCULATED';
interface Dato {
  concepto: string;
  valor: string;
  unidad: string;
  fuente: Fuente;
  metodo: string;
}
const datoVacio = (): Dato => ({ concepto: '', valor: '', unidad: '', fuente: 'REPORTED', metodo: '' });
const ahoraLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Evaluación: datos previos con su fuente (B10-06 §3). Un dato calculado declara su método: BE no calcula. */
/**
 * DL-146: dentro de «Empezar el plan», el paso ya se llama «Evaluación inicial» (`conTitulo={false}`). Los conceptos
 * frecuentes llenan el primer dato vacío; el contexto declarado sin respuestas ocupa una línea; el contexto y las notas,
 * opcionales, van plegados.
 */
export function FormularioDeEvaluacion({ onRegistrada, onCancelar, conTitulo = true }: { onRegistrada: () => void; onCancelar: () => void; conTitulo?: boolean }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [datos, setDatos] = useState<Dato[]>([datoVacio()]);
  const [notas, setNotas] = useState('');
  const [contexto, setContexto] = useState('');
  const [ocurrencia, setOcurrencia] = useState(ahoraLocal());
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  // Contexto declarado (DL-102; auditoría del #102): páginas de FRM-04, versión vista por respuesta y tope de 20 citas.
  const [citables, setCitables] = useState<readonly Citable[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [paginas, setPaginas] = useState(0);
  const [cargaDeContexto, setCargaDeContexto] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [citadas, setCitadas] = useState<readonly string[]>([]);
  const [topeAvisado, setTopeAvisado] = useState(false);
  const [conflicto, setConflicto] = useState(false);
  const [cambiadas, setCambiadas] = useState<readonly string[]>([]);
  const plantillas = useRef(new Map());
  const cambiar = (i: number, cambio: Partial<Dato>) => setDatos((ds) => ds.map((d, j) => (j === i ? { ...d, ...cambio } : d)));
  function elegirConcepto(c: ConceptoFrecuente) {
    const i = lugarDelConcepto(datos);
    setDatos((ds) => (i < ds.length ? ds.map((d, j) => (j === i ? { ...d, concepto: c.concepto, unidad: c.unidad } : d)) : [...ds, { ...datoVacio(), concepto: c.concepto, unidad: c.unidad }]));
    window.setTimeout(() => document.getElementById(`trn-dato-${i}-valor`)?.focus(), 0);
  }
  const fuente = useMemo<FuenteDeContexto>(
    () => ({
      listar: (cursor) => api.listarSolicitudesDeFormulario(token, asesoradoId, { status: 'RESPONDED', limit: LIMITE_DE_PAGINA, ...(cursor ? { cursor } : {}) }),
      detalle: (formRequestId) => api.consultarSolicitudDeFormulario(token, formRequestId),
      version: (templateId, templateVersionId) => api.consultarVersionDePlantilla(token, templateId, templateVersionId),
    }),
    [token, asesoradoId],
  );

  const cargarContexto = useCallback(async () => {
    setCargaDeContexto('cargando');
    const r = await cargarPaginasDeCitables(fuente, plantillas.current, { minimo: 1 });
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCargaDeContexto('error');
    setCitables(r.datos.citables);
    setSiguiente(r.datos.siguiente);
    setPaginas(r.datos.paginas);
    setCargaDeContexto('listo');
  }, [fuente, sesionPerdida]);

  useEffect(() => {
    void cargarContexto();
  }, [cargarContexto]);

  /** «Cargar más»: la página siguiente se agrega; la selección se conserva. */
  async function cargarMas() {
    if (!siguiente) return;
    setCargaDeContexto('cargando');
    const r = await cargarPaginaDeCitables(fuente, siguiente, plantillas.current);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCargaDeContexto('error');
    setCitables((cs) => [...cs, ...r.datos.citables]);
    setSiguiente(r.datos.siguiente);
    setPaginas((n) => n + 1);
    setCargaDeContexto('listo');
  }

  /**
   * Después de un 409: relee desde el principio al menos las páginas que había (y más, si una elegida se corrió) y
   * desmarca, señalándolas, las elegidas que cambiaron.
   */
  async function actualizarContexto() {
    setCargaDeContexto('cargando');
    const r = await cargarPaginasDeCitables(fuente, plantillas.current, { minimo: Math.max(paginas, 1), buscadas: citadas });
    if (sesionPerdida(r)) return;
    if (!r.ok) return setCargaDeContexto('error');
    const { seleccion, cambiadas: nuevas } = reconciliarSeleccion(citadas, citables, r.datos.citables);
    setCitables(r.datos.citables);
    setSiguiente(r.datos.siguiente);
    setPaginas(r.datos.paginas);
    setCitadas(seleccion);
    setCambiadas(nuevas);
    setConflicto(false);
    setCargaDeContexto('listo');
  }

  function alternar(c: Citable) {
    const r = alternarSeleccion(citadas, claveDe(c));
    setCitadas(r.seleccion);
    setTopeAvisado(r.topeAlcanzado);
    if (r.seleccion.includes(claveDe(c))) setCambiadas((cs) => cs.filter((x) => x !== claveDe(c)));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    // Una fecha vacía o a medio escribir se avisa acá: si no, `new Date('')` rompía el envío sin ningún mensaje.
    if (!ocurrencia || Number.isNaN(new Date(ocurrencia).getTime())) problemas.push({ id: 'trn-evaluacion-ocurrencia', texto: 'Falta la fecha y hora de la evaluación.' });
    datos.forEach((d, i) => {
      if (!d.concepto.trim()) problemas.push({ id: `trn-dato-${i}-concepto`, texto: `Dato ${i + 1}: falta el concepto.` });
      if (!d.valor.trim()) problemas.push({ id: `trn-dato-${i}-valor`, texto: `Dato ${i + 1}: falta el valor.` });
      if (d.fuente === 'CALCULATED' && !d.metodo.trim()) problemas.push({ id: `trn-dato-${i}-metodo`, texto: `Dato ${i + 1}: un dato calculado declara su método.` });
    });
    // Tope de citas y conflicto pendiente: se validan también acá, no solo al marcar.
    if (excesoDeSeleccion(citadas) !== null) problemas.push({ id: 'trn-contexto', texto: COPY_ENTRENAMIENTO.excesoDeCitas });
    if (conflicto) problemas.push({ id: 'trn-contexto', texto: COPY_ENTRENAMIENTO.actualizaAntesDeRegistrar });
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.crearEvaluacionDeEntrenamiento(
      token,
      asesoradoId,
      {
        occurredAt: new Date(ocurrencia).toISOString(),
        assessment: {
          entries: datos.map((d) => ({
            concept: d.concepto.trim(),
            // Un valor que es un número se guarda como número, escrito con coma o con punto (DL-091 punto 4).
            value: leerNumero(d.valor) ?? d.valor.trim(),
            unit: d.unidad.trim() || null,
            source: d.fuente,
            methodStatement: d.fuente === 'CALCULATED' ? d.metodo.trim() : null,
          })),
        },
        evidenceReferences: [],
        // DL-102: referencias, en el orden en que se muestran, cada una con la versión que se vio (precondición).
        formResponseReferences: citasAEnviar(citables, citadas),
        professionalNotes: notas.trim() || null,
        context: contexto.trim() || null,
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    // 409 por versión: una respuesta elegida cambió. No se registró nada; lo escrito queda y se pide actualizar y revisar.
    if (!r.ok && r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' && r.issues.some((i) => i.code === 'FORM_RESPONSE_VERSION_CHANGED')) {
      setConflicto(true);
      return;
    }
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onRegistrada();
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {conTitulo ? <h3>{COPY_ENTRENAMIENTO.nuevaEvaluacion}</h3> : null}
      <ResumenDeErrores titulo="Revisá estos datos:" errores={errores} intento={envios} />
      <Campo id="trn-evaluacion-ocurrencia" etiqueta="Fecha y hora de la evaluación" type="datetime-local" value={ocurrencia} onChange={(e) => setOcurrencia(e.target.value)} required />
      <fieldset className="grupo">
        <legend>Datos de la evaluación</legend>
        <p className="campo__ayuda">Cada dato indica de dónde sale: lo informado por el asesorado no es un diagnóstico.</p>
        <ConceptosFrecuentes conceptos={CONCEPTOS_FRECUENTES_DE_ENTRENAMIENTO} usados={datos.map((d) => d.concepto)} etiqueta={COPY_DE_LA_EVALUACION.paraEmpezar} onElegir={elegirConcepto} />
        {datos.map((d, i) => (
          <div key={i} className="fila-de-dato">
            <Campo id={`trn-dato-${i}-concepto`} etiqueta="Concepto" value={d.concepto} onChange={(e) => cambiar(i, { concepto: e.target.value })} maxLength={120} />
            <Campo id={`trn-dato-${i}-valor`} etiqueta="Valor" value={d.valor} onChange={(e) => cambiar(i, { valor: e.target.value })} maxLength={500} />
            <Campo id={`trn-dato-${i}-unidad`} etiqueta="Unidad (opcional)" value={d.unidad} onChange={(e) => cambiar(i, { unidad: e.target.value })} maxLength={30} />
            <div className="campo">
              <label htmlFor={`trn-dato-${i}-fuente`}>Fuente</label>
              <select id={`trn-dato-${i}-fuente`} value={d.fuente} onChange={(e) => cambiar(i, { fuente: e.target.value as Fuente })}>
                {(Object.keys(ETIQUETA_DE_FUENTE) as Fuente[]).map((f) => (
                  <option key={f} value={f}>
                    {ETIQUETA_DE_FUENTE[f]}
                  </option>
                ))}
              </select>
            </div>
            {d.fuente === 'CALCULATED' ? <Campo id={`trn-dato-${i}-metodo`} etiqueta="Método declarado" value={d.metodo} onChange={(e) => cambiar(i, { metodo: e.target.value })} maxLength={500} /> : null}
            {datos.length > 1 ? (
              <button type="button" className="boton boton--enlace" onClick={() => setDatos((ds) => ds.filter((_, j) => j !== i))}>
                Quitar dato {i + 1}
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" className="boton boton--secundario" onClick={() => setDatos((ds) => [...ds, datoVacio()])}>
          Agregar dato
        </button>
      </fieldset>
      <fieldset className="grupo" id="trn-contexto">
        <legend>{COPY_ENTRENAMIENTO.contextoDeclarado}</legend>
        {/* Sin respuestas que citar, el bloque es una línea: lo que se explica sirve cuando hay algo para marcar. */}
        {cargaDeContexto === 'listo' && citables.length === 0 && !siguiente ? null : (
          <>
            <p className="campo__ayuda">{COPY_ENTRENAMIENTO.ayudaContextoDeclarado}</p>
            <p className="campo__ayuda" id="trn-contexto-limite">
              {COPY_ENTRENAMIENTO.limiteDeCitas} Marcaste {citadas.length} de {MAXIMO_DE_CITAS}.
            </p>
          </>
        )}
        {conflicto ? (
          <Aviso tipo="error" enfocar>
            <p>{COPY_ENTRENAMIENTO.contextoCambio}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void actualizarContexto()}>
              {COPY_ENTRENAMIENTO.actualizarContexto}
            </button>
          </Aviso>
        ) : null}
        {!conflicto && cambiadas.length > 0 ? (
          <Aviso tipo="info" enfocar>
            <p>{COPY_ENTRENAMIENTO.revisarCambiadas}</p>
            {cambiadas.some((k) => !citables.some((c) => claveDe(c) === k)) ? <p>{COPY_ENTRENAMIENTO.respuestaYaNoDisponible}</p> : null}
          </Aviso>
        ) : null}
        {topeAvisado || citadas.length >= MAXIMO_DE_CITAS ? <p className="nota" id="trn-contexto-tope">{COPY_ENTRENAMIENTO.topeDeCitasAlcanzado}</p> : null}
        {citables.map((c) => {
          const clave = claveDe(c);
          const id = `trn-cita-${c.formResponseId}-${c.fieldCode}`;
          const marcada = citadas.includes(clave);
          return (
            <div key={clave} className="campo-de-plantilla">
              <input type="checkbox" id={id} checked={marcada} disabled={!marcada && citadas.length >= MAXIMO_DE_CITAS} onChange={() => alternar(c)} aria-describedby="trn-contexto-limite" />
              <label htmlFor={id}>
                {c.etiqueta}: {c.valor}{' '}
                <span className="nota">
                  · {COPY_FORMULARIOS.declaradoPorLaPersona} el {fecha(c.fecha)}
                </span>
              </label>
              {cambiadas.includes(clave) ? (
                <p className="nota" data-cambiada="si">
                  {COPY_ENTRENAMIENTO.respuestaCambiada}
                </p>
              ) : null}
            </div>
          );
        })}
        {cargaDeContexto === 'cargando' ? <p className="nota">Cargando…</p> : null}
        {cargaDeContexto === 'error' ? (
          // Reintenta lo que falló: la primera página si no se cargó ninguna; si no, la página pendiente (aunque las
          // cargadas no hayan traído respuestas de entrenamiento).
          <button type="button" className="boton boton--enlace" onClick={() => void (paginas === 0 ? cargarContexto() : cargarMas())}>
            No se pudo cargar el contexto declarado. Reintentar
          </button>
        ) : null}
        {cargaDeContexto === 'listo' && citables.length === 0 ? <p className="nota">{siguiente ? COPY_ENTRENAMIENTO.hayMasContexto : COPY_ENTRENAMIENTO.sinContextoParaCitar}</p> : null}
        {cargaDeContexto === 'listo' && siguiente ? (
          <button type="button" className="boton boton--secundario" onClick={() => void cargarMas()}>
            {COPY_ENTRENAMIENTO.cargarMasContexto}
          </button>
        ) : null}
      </fieldset>
      <details className="campos-opcionales" open={contexto !== '' || notas !== '' ? true : undefined}>
        <summary>{COPY_DE_LA_EVALUACION.contextoYNotas}</summary>
        <div className="campo">
          <label htmlFor="trn-evaluacion-contexto">Contexto (opcional)</label>
          <p className="campo__ayuda">En qué situación se hizo la evaluación: consulta inicial, cambio de bloque, vuelta de una lesión.</p>
          <textarea id="trn-evaluacion-contexto" rows={2} value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={1000} />
        </div>
        <div className="campo">
          <label htmlFor="trn-evaluacion-notas">Notas del profesional (opcional)</label>
          <textarea id="trn-evaluacion-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={4000} />
        </div>
      </details>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando || conflicto} aria-busy={enviando}>
          {enviando ? 'Registrando…' : 'Registrar evaluación'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Objetivo: un enunciado con fundamento, fundado en una evaluación. El 09 no fija su contenido (09v10:228). */
export function FormularioDeObjetivo({ evaluaciones, onEmitido, onCancelar }: { evaluaciones: readonly EvaluacionDeEntrenamiento[]; onEmitido: () => void; onCancelar: () => void }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [evaluacion, setEvaluacion] = useState(evaluacionMasReciente(evaluaciones));
  // En el primer plan, el formulario se abre apenas se registra la evaluación, antes de que la lista vuelva a leerse.
  useEffect(() => {
    if (evaluaciones.length > 0) setEvaluacion((e) => e || evaluacionMasReciente(evaluaciones));
  }, [evaluaciones]);
  const [enunciado, setEnunciado] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [desde, setDesde] = useState(ahoraLocal());
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const problemas: { id: string; texto: string }[] = [];
    if (!enunciado.trim()) problemas.push({ id: 'trn-objetivo-enunciado', texto: 'Falta el objetivo.' });
    if (!fundamento.trim()) problemas.push({ id: 'trn-objetivo-fundamento', texto: 'Falta el fundamento.' });
    if (!desde || Number.isNaN(new Date(desde).getTime())) problemas.push({ id: 'trn-objetivo-desde', texto: 'Falta desde cuándo rige el objetivo.' });
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.crearObjetivoDeEntrenamiento(
      token,
      asesoradoId,
      { evaluationId: evaluacion, effectiveFrom: new Date(desde).toISOString(), effectiveUntil: null, objective: { statement: enunciado.trim() }, rationale: fundamento.trim() },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onEmitido();
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3>{COPY_ENTRENAMIENTO.nuevaVersionDeObjetivo}</h3>
      <ResumenDeErrores titulo="Para emitir el objetivo falta:" errores={errores} intento={envios} />
      <div className="campo">
        <label htmlFor="trn-objetivo-evaluacion">Evaluación de referencia</label>
        <select id="trn-objetivo-evaluacion" value={evaluacion} onChange={(e) => setEvaluacion(e.target.value)}>
          {evaluaciones.map((ev) => (
            <option key={ev.evaluationId} value={ev.evaluationId}>
              Evaluación del {fecha(ev.occurredAt)}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="trn-objetivo-enunciado">Objetivo</label>
        <textarea id="trn-objetivo-enunciado" rows={2} value={enunciado} onChange={(e) => setEnunciado(e.target.value)} maxLength={2000} />
      </div>
      <div className="campo">
        <label htmlFor="trn-objetivo-fundamento">Fundamento</label>
        <textarea id="trn-objetivo-fundamento" rows={3} value={fundamento} onChange={(e) => setFundamento(e.target.value)} maxLength={4000} />
      </div>
      <Campo id="trn-objetivo-desde" etiqueta="Vigente desde" type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} />
      <p className="nota">La versión anterior no se edita: queda en el historial.</p>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Emitiendo…' : 'Emitir nueva versión'}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
