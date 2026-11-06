'use client';

/**
 * Revisiones de entrenamiento (B10-06 §42-§47).
 * - Ver el contexto no es revisar: hace falta «Registrar revisión» con todos sus componentes.
 * - Seis resultados, ninguno más: no hay un séptimo «Progresar». Una progresión se registra como «Ajustar» o
 *   «Sustituir» según su efecto sobre el plan, y la decide el profesional (B10-06:1053-1073; REG-06-117).
 * - El contexto no muestra volumen, marcas, mapa ni puntaje: esas proyecciones no existen en P0 (09v10 §40).
 * - Aplicar es un paso aparte: la revisión queda registrada aunque todavía no se aplique (B10-06:1077-1093).
 * - El período se elige (B10-06:1027-1036): al cerrar un bloque de cuatro semanas, la evidencia es de cuatro semanas.
 * WP-ESCRITORIO-AREAS, parte 10 (la maqueta 06, dibujada para Nutrición; DEC-17 a DEC-20): la misma pantalla que en
 * Nutrición, con las piezas de `revision-en-preparacion.tsx`. Lo que difiere: la evidencia son sesiones, la grilla trae
 * solo los días con sesiones y la cuenta de los demás (DEC-18), y el nuevo objetivo es un enunciado con su fundamento.
 * Los errores ahora se dicen también en cada campo, como en Nutrición.
 * DL-154 (hallazgo UX-02): cada revisión registrada dice su período, quién la registró y la evidencia que se marcó al
 * registrarla, consultable con «Ver la evidencia» (`evidencia-registrada.tsx`); una sesión se abre en el panel, con el
 * permiso de hoy.
 */
import {
  COPY_ENTRENAMIENTO,
  EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO,
  ETIQUETA_DE_RESULTADO,
  etiquetaDeCondicionRegistrada,
  fechaCivil,
  registroVigente,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EjecucionDeEntrenamiento,
  type EvaluacionDeEntrenamiento,
  type OrigenDeDato,
  type RevisionDeEntrenamiento,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo, erroresPorCampo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { motivoDeFalla, textoDeFalla } from '../../../../lib/fallas';
import { dia, diaDelAnioEnCurso, fecha, horaEnZona, rangoCivil } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { avisoDeMarcasQuitadas, marcasDelPeriodoNuevo, referenciasMarcadas, versionesDelPlan } from '../evidencia';
import { SeleccionDeEvidencia, type CandidataDeEvidencia } from '../evidencia-de-revision';
import { EvidenciaRegistrada } from '../evidencia-registrada';
import { Registro } from './ejecuciones';
import { usePreparar, useRetornoALaFicha } from '../retorno-y-preparacion';
import {
  AreaDeTexto,
  AYUDA_DE_LA_INTERPRETACION,
  BarraDeLaRevision,
  CabeceraDeLaRevision,
  ErrorDelCampo,
  LecturaDelPeriodo,
  PasoDeLaRevision,
  ResultadoDeLaRevision,
  SALIR_DE_LA_REVISION,
  useContextoDeLaRevision,
} from '../revision-en-preparacion';

type Contexto = ContextoDeRevisionDeEntrenamientoResponse['data'];
type ResultadoApi = keyof typeof ETIQUETA_DE_RESULTADO;
const RESULTADOS = Object.keys(ETIQUETA_DE_RESULTADO) as ResultadoApi[];
const SESIONES: readonly [string, string] = ['sesión', 'sesiones'];

export function VistaDeRevisiones() {
  const { asesoradoId, irA, ir } = useEntrenamiento();
  // WP-DASHBOARD-COMPRENSION (eje 5): «Preparar la revisión» desde la ficha abre la revisión nueva con el período desde la
  // última revisión, dicho como preparado por BE. Ver no es revisar: nada se registra hasta «Registrar revisión».
  const preparar = usePreparar();
  const retorno = useRetornoALaFicha(asesoradoId);
  const [aviso, setAviso] = useState<{ texto: string; alPlan?: boolean; volver?: string | null } | null>(null);

  return (
    <>
      {/* DL-113: el atajo al borrador va en el aviso, que por eso se queda hasta que se cierra. */}
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)} seQueda={!!aviso.alPlan || !!aviso.volver}>
          <p>{aviso.texto}</p>
          {aviso.volver ? (
            <p>
              {/* Un `Link`, no un ancla suelta: recargar la página cortaría la sesión, que vive en memoria (DL-012). */}
              <Link href={aviso.volver}>Volver a la ficha, donde estabas</Link>
            </p>
          ) : null}
          {aviso.alPlan ? (
            <p>
              <button type="button" className="boton boton--enlace" onClick={() => irA('plan')}>
                Abrir el borrador en Plan
              </button>
            </p>
          ) : null}
        </AvisoFlotante>
      ) : null}
      {preparar ? (
        <RevisionNueva
          onRegistrada={() => {
            setAviso({ texto: 'Revisión registrada. Todavía no se aplicó: aplicala desde la lista.', volver: retorno.href });
            ir(SALIR_DE_LA_REVISION);
          }}
        />
      ) : (
        <ListaDeRevisiones onAplicada={(texto, alPlan) => setAviso({ texto, alPlan })} />
      )}
    </>
  );
}

/** La lista de revisiones registradas, con «Nueva revisión» (DEC-17). Su lectura no depende de un período. */
function ListaDeRevisiones({ onAplicada }: { onAplicada: (texto: string, alPlan: boolean) => void }) {
  const { token, asesoradoId, sesionPerdida, ir } = useEntrenamiento();
  const [r, setR] = useState<Resultado<{ data: Contexto }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, {});
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const contexto = r?.ok ? r.datos.data : null;

  return (
    <section className="revisiones" aria-labelledby="titulo-revisiones-trn">
      <div className="revisiones__encabezado">
        <h2 id="titulo-revisiones-trn">Revisiones registradas</h2>
        {contexto?.process?.state === 'ABIERTO' ? (
          <button type="button" className="boton boton--primario" onClick={() => ir({ preparar: '1' }, { agregarAlHistorial: true })}>
            Nueva revisión
          </button>
        ) : null}
      </div>
      <EstadoDeLectura r={r} onReintentar={cargar}>
        {contexto ? (
          <div className="secciones">
            {contexto.pendingReview.pending ? (
              <Aviso tipo="info">
                <p>Revisión pendiente desde el {dia(`${contexto.pendingReview.since}T12:00:00Z`)}.</p>
              </Aviso>
            ) : null}
            {contexto.process?.state !== 'ABIERTO' ? <SinSeguimientoAbierto contexto={contexto} /> : null}
            {contexto.previousReviews.length === 0 ? <p>Todavía no hay revisiones registradas.</p> : null}
            <ul className="lista">
              {contexto.previousReviews.map((rev) => (
                <ItemDeRevision
                  key={rev.reviewId}
                  revision={rev}
                  onAplicada={(texto, alPlan) => {
                    onAplicada(texto, alPlan);
                    void cargar();
                  }}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </EstadoDeLectura>
    </section>
  );
}

function SinSeguimientoAbierto({ contexto }: { contexto: Contexto }) {
  return (
    <Aviso tipo="info">
      <p>{contexto.process ? 'El seguimiento de entrenamiento está cerrado. La historia se conserva.' : 'El seguimiento empieza al activar el primer plan.'}</p>
    </Aviso>
  );
}

/** La revisión nueva (maqueta 06): la cabecera con el período, fuera del formulario, y el formulario en tres pasos. */
function RevisionNueva({ onRegistrada }: { onRegistrada: () => void }) {
  const area = useEntrenamiento();
  const { token, asesoradoId, sesionPerdida, ir } = area;
  const leer = useCallback((p: { periodStart?: string; periodEnd?: string }) => api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, p), [token, asesoradoId]);
  const lectura = useContextoDeLaRevision<Contexto>(leer, area);
  // Las evaluaciones no dependen del período: se leen una vez (las pide «Cambiar objetivo»).
  const [evaluaciones, setEvaluaciones] = useState<Resultado<{ data: EvaluacionDeEntrenamiento[] }> | null>(null);
  const leerEvaluaciones = useCallback(async () => {
    setEvaluaciones(null);
    const res = await api.listarEvaluacionesDeEntrenamiento(token, asesoradoId);
    if (!sesionPerdida(res)) setEvaluaciones(res);
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void leerEvaluaciones();
  }, [leerEvaluaciones]);
  const estado = lectura.primera && !lectura.primera.ok ? lectura.primera : evaluaciones && !evaluaciones.ok ? evaluaciones : lectura.contexto && evaluaciones ? evaluaciones : null;

  return (
    <section className="revision-nueva" aria-labelledby="titulo-revision-nueva-trn">
      <CabeceraDeLaRevision titulo="Nueva revisión de Entrenamiento" idDelTitulo="titulo-revision-nueva-trn" periodo={lectura.periodo} procedencia={lectura.procedencia} onElegirPeriodo={lectura.elegirPeriodo} />
      <EstadoDeLectura
        r={estado}
        onReintentar={() => {
          if (!lectura.contexto) lectura.reintentar();
          if (!evaluaciones?.ok) void leerEvaluaciones();
        }}
      >
        {lectura.contexto && evaluaciones?.ok ? (
          lectura.contexto.process?.state === 'ABIERTO' ? (
            <FormularioDeRevision contexto={lectura.contexto} evaluaciones={evaluaciones.datos.data} hoy={lectura.hoy} lectura={lectura} onRegistrada={onRegistrada} onCancelar={() => ir(SALIR_DE_LA_REVISION)} />
          ) : (
            <div className="secciones">
              <SinSeguimientoAbierto contexto={lectura.contexto} />
              <div className="acciones">
                <button type="button" className="boton boton--secundario" onClick={() => ir(SALIR_DE_LA_REVISION)}>
                  Ver las revisiones registradas
                </button>
              </div>
            </div>
          )
        ) : null}
      </EstadoDeLectura>
    </section>
  );
}

function FormularioDeRevision({
  contexto,
  evaluaciones,
  hoy,
  lectura,
  onRegistrada,
  onCancelar,
}: {
  contexto: Contexto;
  evaluaciones: readonly EvaluacionDeEntrenamiento[];
  hoy: string;
  lectura: { readonly leyendo: boolean; readonly falloDelPeriodo: string | null; readonly bloqueo: string | null; readonly reintentar: () => void };
  onRegistrada: () => void;
  onCancelar: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [evidencia, setEvidencia] = useState<Set<string>>(new Set());
  const [interpretacion, setInterpretacion] = useState('');
  const [resultado, setResultado] = useState<ResultadoApi | ''>('');
  const [fundamento, setFundamento] = useState('');
  const [accion, setAccion] = useState('');
  const [proxima, setProxima] = useState('');
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [fundamentoDelObjetivo, setFundamentoDelObjetivo] = useState('');
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  useCambiosSinGuardar(evidencia.size > 0 || resultado !== '' || [interpretacion, fundamento, accion, proxima, nuevoObjetivo, fundamentoDelObjetivo].some((t) => t.trim() !== ''), 'la revisión');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  // Las sesiones, por su día (lo dice el grupo); la planificación y el objetivo, aparte.
  const candidatas: CandidataDeEvidencia[] = useMemo(
    () => [
      ...contexto.registeredExecutions.map((x) => ({
        tipo: 'EXECUTION' as const,
        id: x.executionId,
        dia: x.date,
        texto: `${x.plannedSession.label} · ${etiquetaDeCondicionRegistrada(registroVigente(x))}`,
      })),
      ...versionesDelPlan(
        contexto.activePlanVersions.map((v) => ({
          planId: v.planId,
          dia: diaDelAnioEnCurso(fechaCivil(v.activatedAt as string, contexto.period.timeZone), hoy),
          hora: horaEnZona(v.activatedAt as string, contexto.period.timeZone),
          vigente: v.isEffective,
        })),
      ),
      ...(contexto.objective ? [{ tipo: 'OBJECTIVE_VERSION' as const, id: contexto.objective.versionId, dia: null, texto: 'Objetivo vigente' }] : []),
    ],
    [contexto, hoy],
  );

  // DEC-20: con otro período, se quita solo lo marcado que quedó afuera, y se dice. Lo escrito no cambia.
  const [avisoDeMarcas, setAvisoDeMarcas] = useState<string | null>(null);
  const periodoLeido = `${contexto.period.start}|${contexto.period.end}`;
  const periodoAnterior = useRef(periodoLeido);
  useEffect(() => {
    if (periodoAnterior.current === periodoLeido) return;
    periodoAnterior.current = periodoLeido;
    const { quedan, quitadas } = marcasDelPeriodoNuevo(evidencia, candidatas);
    if (quitadas > 0) setEvidencia(quedan);
    setAvisoDeMarcas(quitadas > 0 ? avisoDeMarcasQuitadas(quitadas) : null);
    // A propósito, solo cuando cambia el período leído: marcar o desmarcar no es motivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoLeido]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    // Lo que se ve todavía no es del período elegido: la barra dice por qué.
    if (lectura.bloqueo) return;
    const problemas: { id: string; texto: string }[] = [];
    if (evidencia.size === 0) problemas.push({ id: 'trn-revision-evidencia', texto: 'Elegí la evidencia que examinaste.' });
    if (!interpretacion.trim()) problemas.push({ id: 'trn-revision-interpretacion', texto: 'Falta la interpretación.' });
    if (!resultado) problemas.push({ id: 'trn-revision-resultado', texto: 'Elegí un resultado.' });
    if (!fundamento.trim()) problemas.push({ id: 'trn-revision-fundamento', texto: 'Falta el fundamento.' });
    if (!accion.trim()) problemas.push({ id: 'trn-revision-accion', texto: resultado === 'FINALIZE' ? 'Describí el cierre.' : 'Falta la próxima acción.' });
    if (resultado === 'RESCHEDULE_REVIEW' && !proxima) problemas.push({ id: 'trn-revision-proxima', texto: 'Para reprogramar, indicá la fecha de la próxima revisión.' });
    if (resultado === 'CHANGE_OBJECTIVE' && (!nuevoObjetivo.trim() || !fundamentoDelObjetivo.trim() || !evaluaciones[0])) {
      problemas.push({ id: 'trn-revision-objetivo', texto: 'Para cambiar el objetivo, escribí el nuevo y su fundamento (hace falta una evaluación).' });
    }
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0 || !resultado) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarRevisionDeEntrenamiento(
      token,
      asesoradoId,
      {
        period: contexto.period,
        evidenceReferences: referenciasMarcadas(candidatas, evidencia),
        interpretation: interpretacion.trim(),
        result: resultado,
        rationale: fundamento.trim(),
        nextAction: {
          description: accion.trim(),
          ...(proxima && resultado !== 'FINALIZE' ? { nextReviewAt: proxima } : {}),
          ...(resultado === 'CHANGE_OBJECTIVE' && evaluaciones[0]
            ? {
                objective: {
                  evaluationId: evaluaciones[0].evaluationId,
                  effectiveFrom: new Date().toISOString(),
                  effectiveUntil: null,
                  objective: { statement: nuevoObjetivo.trim() },
                  rationale: fundamentoDelObjetivo.trim(),
                },
              }
            : {}),
        },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onRegistrada();
  }

  // El mismo error que enumera el resumen se marca en su campo (B10-10:164-165; DL-091 punto 3), como en Nutrición.
  const porCampo = erroresPorCampo(errores);
  const errorDelObjetivo = porCampo['trn-revision-objetivo'] ?? null;

  return (
    <form className="revision-nueva__formulario" onSubmit={enviar} noValidate data-periodo={periodoLeido}>
      <ResumenDeErrores titulo="Para registrar la revisión falta:" errores={errores} intento={envios} />
      <div className="revision-nueva__columnas">
        <div className="revision-nueva__tarjeta">
          <PasoDeLaRevision
            numero={1}
            titulo="Lo que miraste"
            idDeLaAyuda="trn-revision-evidencia-ayuda"
            ayuda="Marcá solo lo que examinaste: nada viene marcado. Marcar un día marca cada una de sus sesiones; dejá marcadas solo las que miraste."
          >
            <LecturaDelPeriodo leyendo={lectura.leyendo} fallo={lectura.falloDelPeriodo} onReintentar={lectura.reintentar} />
            <SeleccionDeEvidencia
              id="trn-revision-evidencia"
              hoy={hoy}
              candidatas={candidatas}
              elegidas={evidencia}
              onCambiar={(siguiente) => {
                setEvidencia(siguiente);
                setAvisoDeMarcas(null);
              }}
              registros={SESIONES}
              sinRegistros="No hay sesiones registradas en el período."
              idDeLaAyuda="trn-revision-evidencia-ayuda"
              aviso={avisoDeMarcas}
              nota={contexto.missingData.length > 0 ? <p className="nota evidencia__nota">Días sin registro en el período: {contexto.missingData.length}. No hay dato de esos días.</p> : null}
              error={porCampo['trn-revision-evidencia'] ?? null}
            />
          </PasoDeLaRevision>
        </div>
        <div className="revision-nueva__tarjeta">
          <PasoDeLaRevision numero={2} titulo="Lo que observaste">
            <AreaDeTexto id="trn-revision-interpretacion" etiqueta="Interpretación" ayuda={AYUDA_DE_LA_INTERPRETACION} valor={interpretacion} onCambiar={setInterpretacion} maximo={4000} porCampo={porCampo} />
          </PasoDeLaRevision>
          <PasoDeLaRevision numero={3} titulo="Lo que decidís">
            <ResultadoDeLaRevision
              id="trn-revision-resultado"
              nombre="trn-resultado"
              resultados={RESULTADOS}
              etiquetas={ETIQUETA_DE_RESULTADO}
              efectos={EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO}
              valor={resultado}
              alElegir={setResultado}
              error={porCampo['trn-revision-resultado'] ?? null}
              explicacion={COPY_ENTRENAMIENTO.progresionComoAjuste}
            />
            <AreaDeTexto id="trn-revision-fundamento" etiqueta="Fundamento" valor={fundamento} onCambiar={setFundamento} filas={2} maximo={4000} porCampo={porCampo} />
            <div className="revision-nueva__siguiente">
              <AreaDeTexto id="trn-revision-accion" etiqueta={resultado === 'FINALIZE' ? 'Cierre' : 'Próxima acción'} valor={accion} onCambiar={setAccion} filas={2} maximo={2000} porCampo={porCampo} />
              {resultado !== 'FINALIZE' ? (
                <Campo
                  id="trn-revision-proxima"
                  etiqueta={resultado === 'RESCHEDULE_REVIEW' ? 'Fecha de la próxima revisión' : 'Próxima revisión (opcional)'}
                  type="date"
                  value={proxima}
                  onChange={(e) => setProxima(e.target.value)}
                  error={porCampo['trn-revision-proxima'] ?? null}
                />
              ) : null}
            </div>
            {resultado === 'CHANGE_OBJECTIVE' ? (
              <fieldset
                className={`grupo${errorDelObjetivo ? ' campo--error' : ''}`}
                id="trn-revision-objetivo"
                tabIndex={-1}
                aria-invalid={errorDelObjetivo ? true : undefined}
                aria-describedby={errorDelObjetivo ? 'trn-revision-objetivo-error' : undefined}
              >
                <legend>Nuevo objetivo</legend>
                <ErrorDelCampo id="trn-revision-objetivo" texto={errorDelObjetivo} />
                <AreaDeTexto id="trn-revision-objetivo-enunciado" etiqueta="Objetivo" valor={nuevoObjetivo} onCambiar={setNuevoObjetivo} filas={2} maximo={2000} porCampo={porCampo} />
                <AreaDeTexto id="trn-revision-objetivo-fundamento" etiqueta="Fundamento del objetivo" valor={fundamentoDelObjetivo} onCambiar={setFundamentoDelObjetivo} filas={2} maximo={4000} porCampo={porCampo} />
              </fieldset>
            ) : null}
          </PasoDeLaRevision>
        </div>
      </div>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <BarraDeLaRevision enviando={enviando} bloqueo={lectura.bloqueo} textoDelBoton={COPY_ENTRENAMIENTO.registrarRevision} alCancelar={onCancelar} />
    </form>
  );
}

function ItemDeRevision({ revision, onAplicada }: { revision: RevisionDeEntrenamiento; onAplicada: (texto: string, alPlan: boolean) => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function aplicar() {
    setAplicando(true);
    setFallo(null);
    const r = await api.aplicarRevisionDeEntrenamiento(token, revision.reviewId, intento.actual());
    intento.registrar(r);
    setAplicando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'CONTINUITY_ACTION_NOT_APPLICABLE') return setFallo('No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.');
      return setFallo(mensajeDeFallo(r));
    }
    const a = r.datos.data.application;
    const texto =
      a.processStateAfter === 'CERRADO'
        ? 'Seguimiento cerrado. La historia se conserva.'
        : a.createdPlanId
          ? 'Próxima acción aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.'
          : a.createdObjectiveVersionId
            ? 'Próxima acción aplicada: se emitió una nueva versión del objetivo.'
            : 'Próxima acción aplicada.';
    onAplicada(texto, Boolean(a.createdPlanId));
  }

  return (
    <li className="lista__item">
      <p className="lista__titulo">
        {ETIQUETA_DE_RESULTADO[revision.result]} · {fecha(revision.recordedAt)}
      </p>
      {/* DL-154: el contexto de la revisión, a la vista: qué período se revisó y quién la registró. */}
      <p className="nota">
        Entrenamiento · período revisado: {rangoCivil(revision.period.start, revision.period.end)} · registró: {revision.author.displayName}
      </p>
      <p>{revision.interpretation}</p>
      <p className="nota">
        Fundamento: {revision.rationale} · {revision.result === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}: {revision.nextAction.description}
      </p>
      <EvidenciaRegistrada
        area="TRAINING"
        revision={revision}
        leer={() => api.evidenciaDeRevisionDeEntrenamiento(token, revision.reviewId)}
        sesionPerdida={sesionPerdida}
        abrible={(o) => o.type === 'TRAINING_EXECUTION'}
        contenidoDelOrigen={(o, _item, alNoEstarDisponible) => <SesionDeLaEvidencia origen={o} onNoDisponible={alNoEstarDisponible} />}
      />
      {revision.application ? (
        <p>
          <span className="insignia insignia--si">Aplicada</span> {fecha(revision.application.appliedAt)}
        </p>
      ) : (
        <>
          <p className="nota">{EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO[revision.result]}</p>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <button type="button" className="boton boton--primario" onClick={() => void aplicar()} disabled={aplicando} aria-busy={aplicando}>
            {aplicando ? 'Aplicando…' : COPY_ENTRENAMIENTO.aplicarProximaAccion}
          </button>
        </>
      )}
    </li>
  );
}

/**
 * Una sesión de la evidencia, en el panel (DL-154): leída por API-TRN-19 con el permiso de hoy, con la corrección vigente
 * si la tiene. Si ya no se puede leer, lo dice y avisa a quien la abrió.
 */
function SesionDeLaEvidencia({ origen, onNoDisponible }: { origen: OrigenDeDato; onNoDisponible: () => void }) {
  const { token, sesionPerdida } = useEntrenamiento();
  const [r, setR] = useState<Resultado<{ data: EjecucionDeEntrenamiento }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarEjecucionDeEntrenamiento(token, origen.id);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, origen.id, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  // Como el detalle de una comida: un 404 (o un 403) es «sin acceso», el mismo texto para lo revocado y lo inexistente.
  const sinAcceso = r !== null && !r.ok && r.tipo === 'API' && (r.codigo === 'RESOURCE_NOT_FOUND' || r.status === 403);
  const aviso = useRef(onNoDisponible);
  aviso.current = onNoDisponible;
  useEffect(() => {
    if (sinAcceso) aviso.current();
  }, [sinAcceso]);
  if (r === null) return <Cargando />;
  if (sinAcceso) return <p className="nota">Esta sesión no está disponible con tu acceso actual.</p>;
  if (!r.ok) return <ErrorConReintento mensaje={textoDeFalla(motivoDeFalla(r), 'la sesión registrada')} onReintentar={() => void cargar()} />;
  const x = r.datos.data;
  const vigente = registroVigente(x);
  return (
    <div className="detalle-de-valores">
      <p>
        <strong>{x.plannedSession.label}</strong> · ocurrió el {fecha(x.occurredAt)} · registrada el {fecha(x.recordedAt)}
      </p>
      {x.corrections.length > 0 ? (
        <p className="nota">
          {x.effectiveView.kind === 'CORRECTED' ? 'Se muestra la corrección vigente' : 'Tiene correcciones'}: {x.corrections.map((c) => `${c.author.displayName}, ${fecha(c.recordedAt)}`).join(' · ')}
        </p>
      ) : null}
      {vigente ? <Registro registro={vigente} /> : <p className="nota">La vista vigente de esta sesión no se puede resolver.</p>}
    </div>
  );
}
