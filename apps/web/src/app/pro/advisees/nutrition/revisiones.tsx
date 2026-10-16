'use client';

/**
 * NUT-14 Contexto, NUT-15 Registrar revisión y NUT-16 Aplicar continuidad (B05:1134-1295).
 * - Abrir esta pantalla no es revisar (RF-034; 06:5881): hace falta «Registrar revisión» con todos sus componentes.
 * - Resultados: Mantener / Ajustar / Sustituir / Reprogramar revisión / Cambiar objetivo / Finalizar (B05:1197-1204).
 *   Sin «Recomendación BE: ajustar» (B05:1162-1176): BE no sugiere un resultado.
 * - Aplicar es un paso aparte (B05:1240-1261): la revisión queda registrada aunque todavía no se aplique.
 * - «Finalizar» no es «Eliminar plan»: la historia se conserva (B05:1283-1295).
 * WP-ESCRITORIO-AREAS, parte 10 (maqueta 06; DEC-17 a DEC-20): por defecto se ve la lista de revisiones registradas, con
 * «Nueva revisión». La revisión nueva es otra pantalla de la misma sección (`preparar=1`, también desde la ficha), en tres
 * pasos y con la barra de «Registrar revisión» pegada abajo; al registrar o cancelar se vuelve a la lista. Las piezas
 * comunes con Entrenamiento están en `revision-en-preparacion.tsx`.
 */
import {
  COPY_NUTRICION,
  EFECTO_VISIBLE_DE_RESULTADO,
  ETIQUETA_DE_RESULTADO,
  fechaCivil,
  type ContextoDeRevisionResponse,
  type EvaluacionNutricional,
  type Revision,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { Aviso, Campo, erroresPorCampo, ResumenDeErrores } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, diaDelAnioEnCurso, fecha, horaEnZona } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { avisoDeMarcasQuitadas, diasDelPeriodo, marcasDelPeriodoNuevo, referenciasMarcadas, versionesDelPlan } from '../evidencia';
import { SeleccionDeEvidencia, type CandidataDeEvidencia } from '../evidencia-de-revision';
import { useCambiosSinGuardar } from '../marco-del-area';
import { usePreparar, useRetornoALaFicha } from '../retorno-y-preparacion';
import {
  AreaDeTexto,
  AYUDA_DE_LA_INTERPRETACION,
  BarraDeLaRevision,
  CabeceraDeLaRevision,
  LecturaDelPeriodo,
  PasoDeLaRevision,
  ResultadoDeLaRevision,
  SALIR_DE_LA_REVISION,
  useContextoDeLaRevision,
} from '../revision-en-preparacion';
import { CamposDeObjetivo, aObjetivo, erroresDeObjetivo, objetivoVacio } from './formularios';
import { EstadoDeLectura, useNutricion } from './nutricion';

type Contexto = ContextoDeRevisionResponse['data'];
type ResultadoApi = keyof typeof ETIQUETA_DE_RESULTADO;
const RESULTADOS = Object.keys(ETIQUETA_DE_RESULTADO) as ResultadoApi[];
const COMIDAS: readonly [string, string] = ['comida', 'comidas'];

export function VistaDeRevisiones() {
  const { asesoradoId, irA, ir } = useNutricion();
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
            setAviso({ texto: `${COPY_NUTRICION.revisionRegistrada}. Todavía no se aplicó: aplicala desde la lista.`, alPlan: false, volver: retorno.href });
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
  const { token, asesoradoId, sesionPerdida, ir } = useNutricion();
  const [r, setR] = useState<Resultado<{ data: Contexto }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.contextoDeRevision(token, asesoradoId, {});
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const contexto = r?.ok ? r.datos.data : null;

  return (
    <section className="revisiones" aria-labelledby="titulo-revisiones">
      <div className="revisiones__encabezado">
        <h2 id="titulo-revisiones">Revisiones registradas</h2>
        {contexto?.process?.state === 'ABIERTO' ? (
          <button type="button" className="boton boton--primario" onClick={() => ir({ preparar: '1' }, { agregarAlHistorial: true })}>
            {COPY_NUTRICION.nuevaRevision}
          </button>
        ) : null}
      </div>
      <EstadoDeLectura r={r} onReintentar={cargar}>
        {contexto ? (
          <div className="secciones">
            {contexto.pendingReview.pending ? (
              <Aviso tipo="info">
                <p>
                  {COPY_NUTRICION.revisionPendiente} desde el {dia(`${contexto.pendingReview.since}T12:00:00Z`)}.
                </p>
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
      <p>{contexto.process ? 'El seguimiento nutricional está cerrado. La historia se conserva.' : 'El seguimiento empieza al activar el primer plan.'}</p>
    </Aviso>
  );
}

/** La revisión nueva (maqueta 06): la cabecera con el período, fuera del formulario, y el formulario en tres pasos. */
function RevisionNueva({ onRegistrada }: { onRegistrada: () => void }) {
  const area = useNutricion();
  const { token, asesoradoId, sesionPerdida, ir } = area;
  const leer = useCallback((p: { periodStart?: string; periodEnd?: string }) => api.contextoDeRevision(token, asesoradoId, p), [token, asesoradoId]);
  const lectura = useContextoDeLaRevision<Contexto>(leer, area);
  // Las evaluaciones no dependen del período: se leen una vez (las pide «Cambiar objetivo»).
  const [evaluaciones, setEvaluaciones] = useState<Resultado<{ data: EvaluacionNutricional[] }> | null>(null);
  const leerEvaluaciones = useCallback(async () => {
    setEvaluaciones(null);
    const res = await api.listarEvaluaciones(token, asesoradoId);
    if (!sesionPerdida(res)) setEvaluaciones(res);
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void leerEvaluaciones();
  }, [leerEvaluaciones]);
  const estado = lectura.primera && !lectura.primera.ok ? lectura.primera : evaluaciones && !evaluaciones.ok ? evaluaciones : lectura.contexto && evaluaciones ? evaluaciones : null;

  return (
    <section className="revision-nueva" aria-labelledby="titulo-revision-nueva">
      <CabeceraDeLaRevision titulo="Nueva revisión de Nutrición" idDelTitulo="titulo-revision-nueva" periodo={lectura.periodo} procedencia={lectura.procedencia} onElegirPeriodo={lectura.elegirPeriodo} />
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
  evaluaciones: readonly EvaluacionNutricional[];
  hoy: string;
  lectura: { readonly leyendo: boolean; readonly falloDelPeriodo: string | null; readonly bloqueo: string | null; readonly reintentar: () => void };
  onRegistrada: () => void;
  onCancelar: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [evidencia, setEvidencia] = useState<Set<string>>(new Set());
  const [interpretacion, setInterpretacion] = useState('');
  const [resultado, setResultado] = useState<ResultadoApi | ''>('');
  const [fundamento, setFundamento] = useState('');
  const [accion, setAccion] = useState('');
  const [proxima, setProxima] = useState('');
  const [objetivo, setObjetivo] = useState(objetivoVacio(evaluaciones[0]?.evaluationId ?? ''));
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  useCambiosSinGuardar(evidencia.size > 0 || resultado !== '' || [interpretacion, fundamento, accion, proxima].some((t) => t.trim() !== ''), 'la revisión');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  // Las comidas, por su día civil (lo dice el grupo) con la hora y el tipo; la planificación y el objetivo, aparte.
  const candidatas: CandidataDeEvidencia[] = useMemo(
    () => [
      ...contexto.registeredIntakes.map((i) => ({
        tipo: 'EXECUTION' as const,
        id: i.executionId,
        dia: i.localDate,
        texto: `${horaEnZona(i.occurredAt, i.timeZone)} · ${i.origin === 'PRESCRIBED' ? 'Comida del plan' : 'Comida fuera del plan'}${i.description ? ` · «${i.description}»` : ''}`,
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
    if (evidencia.size === 0) problemas.push({ id: 'revision-evidencia', texto: 'Elegí la evidencia que examinaste.' });
    if (!interpretacion.trim()) problemas.push({ id: 'revision-interpretacion', texto: 'Falta la interpretación.' });
    if (!resultado) problemas.push({ id: 'revision-resultado', texto: 'Elegí un resultado.' });
    if (!fundamento.trim()) problemas.push({ id: 'revision-fundamento', texto: 'Falta el fundamento.' });
    if (!accion.trim()) problemas.push({ id: 'revision-accion', texto: resultado === 'FINALIZE' ? 'Describí el cierre.' : 'Falta la próxima acción.' });
    if (resultado === 'RESCHEDULE_REVIEW' && !proxima) problemas.push({ id: 'revision-proxima', texto: 'Para reprogramar, indicá la fecha de la próxima revisión.' });
    if (resultado === 'CHANGE_OBJECTIVE') problemas.push(...erroresDeObjetivo(objetivo, 'revision-objetivo'));
    setErrores(problemas);
    setEnvios((n) => n + 1);
    if (problemas.length > 0 || !resultado) return;
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarRevision(
      token,
      asesoradoId,
      {
        period: contexto.period,
        // Cada referencia, una por una: marcar un día marca sus registros, y el contrato no cambia.
        evidenceReferences: referenciasMarcadas(candidatas, evidencia),
        interpretation: interpretacion.trim(),
        result: resultado,
        rationale: fundamento.trim(),
        nextAction: {
          description: accion.trim(),
          ...(proxima && resultado !== 'FINALIZE' ? { nextReviewAt: proxima } : {}),
          ...(resultado === 'CHANGE_OBJECTIVE' ? { objective: aObjetivo(objetivo) } : {}),
        },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onRegistrada();
  }

  // El mismo error que enumera el resumen se marca en su campo (B10-10:164-165; DL-091 punto 3).
  const porCampo = erroresPorCampo(errores);

  return (
    <form className="revision-nueva__formulario" onSubmit={enviar} noValidate data-periodo={periodoLeido}>
      <ResumenDeErrores titulo="Para registrar la revisión falta:" errores={errores} intento={envios} />
      <div className="revision-nueva__columnas">
        <div className="revision-nueva__tarjeta">
          <PasoDeLaRevision
            numero={1}
            titulo="Lo que miraste"
            idDeLaAyuda="revision-evidencia-ayuda"
            ayuda="Marcá solo lo que examinaste: nada viene marcado. Marcar un día marca cada una de sus comidas; dejá marcadas solo las que miraste."
          >
            <LecturaDelPeriodo leyendo={lectura.leyendo} fallo={lectura.falloDelPeriodo} onReintentar={lectura.reintentar} />
            <SeleccionDeEvidencia
              id="revision-evidencia"
              hoy={hoy}
              candidatas={candidatas}
              elegidas={evidencia}
              onCambiar={(siguiente) => {
                setEvidencia(siguiente);
                setAvisoDeMarcas(null);
              }}
              registros={COMIDAS}
              sinRegistros="No hay comidas registradas en el período."
              diasDelPeriodo={diasDelPeriodo(contexto.period.start, contexto.period.end)}
              idDeLaAyuda="revision-evidencia-ayuda"
              aviso={avisoDeMarcas}
              error={porCampo['revision-evidencia'] ?? null}
            />
          </PasoDeLaRevision>
        </div>
        <div className="revision-nueva__tarjeta">
          <PasoDeLaRevision numero={2} titulo="Lo que observaste">
            <AreaDeTexto id="revision-interpretacion" etiqueta="Interpretación" ayuda={AYUDA_DE_LA_INTERPRETACION} valor={interpretacion} onCambiar={setInterpretacion} maximo={4000} porCampo={porCampo} />
          </PasoDeLaRevision>
          <PasoDeLaRevision numero={3} titulo="Lo que decidís">
            <ResultadoDeLaRevision
              id="revision-resultado"
              nombre="resultado"
              resultados={RESULTADOS}
              etiquetas={ETIQUETA_DE_RESULTADO}
              efectos={EFECTO_VISIBLE_DE_RESULTADO}
              valor={resultado}
              alElegir={setResultado}
              error={porCampo['revision-resultado'] ?? null}
            />
            <AreaDeTexto id="revision-fundamento" etiqueta="Fundamento" valor={fundamento} onCambiar={setFundamento} filas={2} maximo={4000} porCampo={porCampo} />
            <div className="revision-nueva__siguiente">
              <AreaDeTexto id="revision-accion" etiqueta={resultado === 'FINALIZE' ? 'Cierre' : 'Próxima acción'} valor={accion} onCambiar={setAccion} filas={2} maximo={2000} porCampo={porCampo} />
              {resultado !== 'FINALIZE' ? (
                <Campo
                  id="revision-proxima"
                  etiqueta={resultado === 'RESCHEDULE_REVIEW' ? 'Fecha de la próxima revisión' : 'Próxima revisión (opcional)'}
                  type="date"
                  value={proxima}
                  onChange={(e) => setProxima(e.target.value)}
                  error={porCampo['revision-proxima'] ?? null}
                />
              ) : null}
            </div>
            {resultado === 'CHANGE_OBJECTIVE' ? (
              <fieldset className="grupo">
                <legend>Nuevo objetivo</legend>
                <CamposDeObjetivo valores={objetivo} onCambiar={setObjetivo} evaluaciones={evaluaciones} prefijo="revision-objetivo" errores={porCampo} />
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
      <BarraDeLaRevision enviando={enviando} bloqueo={lectura.bloqueo} textoDelBoton={COPY_NUTRICION.registrarRevision} alCancelar={onCancelar} />
    </form>
  );
}

function ItemDeRevision({ revision, onAplicada }: { revision: Revision; onAplicada: (texto: string, alPlan: boolean) => void }) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function aplicar() {
    setAplicando(true);
    setFallo(null);
    const r = await api.aplicarRevision(token, revision.reviewId, intento.actual());
    intento.registrar(r);
    setAplicando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
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
          ? 'Continuidad aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.'
          : a.createdObjectiveVersionId
            ? 'Continuidad aplicada: se emitió una nueva versión del objetivo.'
            : COPY_NUTRICION.continuidadAplicada;
    onAplicada(texto, Boolean(a.createdPlanId));
  }

  return (
    <li className="lista__item">
      <p className="lista__titulo">
        {ETIQUETA_DE_RESULTADO[revision.result]} · {fecha(revision.recordedAt)}
      </p>
      <p>{revision.interpretation}</p>
      <p className="nota">
        Fundamento: {revision.rationale} · {revision.result === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}: {revision.nextAction.description}
      </p>
      {revision.application ? (
        <p>
          <span className="insignia insignia--si">Aplicada</span> {fecha(revision.application.appliedAt)}
        </p>
      ) : (
        <>
          <p className="nota">{EFECTO_VISIBLE_DE_RESULTADO[revision.result]}</p>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <button type="button" className="boton boton--primario" onClick={() => void aplicar()} disabled={aplicando} aria-busy={aplicando}>
            {aplicando ? 'Aplicando…' : COPY_NUTRICION.aplicarContinuidad}
          </button>
        </>
      )}
    </li>
  );
}
