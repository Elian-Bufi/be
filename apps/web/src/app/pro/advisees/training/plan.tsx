'use client';

/**
 * Plan de entrenamiento (B10-06 §9-§10, §24), recompuesto en WP-ESCRITORIO-AREAS, parte 6 (maqueta 24; C-69, C-80, C-81).
 * - La versión activa se muestra en solo lectura, desde la instantánea: lo que ve el asesorado (REG-06-112). Para
 *   cambiarla: «Nueva versión del plan» (DL-047).
 * - Un solo borrador por plan: si ya hay uno, se sigue sobre ese y no se ofrece crear otro.
 * - Activar no se hace desde «Guardar» (B10-06:609): es un acto aparte, con su consecuencia a la vista.
 * - La versión activa se lee con API-SER-01: cada serie muestra el objetivo que recibe el teléfono, heredado o propio
 *   (DL-122), y «Guardar como plantilla» conserva los objetivos por serie.
 * - **Un selector de versión** cuando hay una en preparación y una activa (C-39): se mira una u otra. La que está en
 *   preparación queda montada al pasar a la activa: lo escrito sin guardar no se pierde.
 * - **Se mira una sesión por vez, con un ejercicio abierto** (C-69): el bloque, el microciclo si el bloque los usa, y la
 *   sesión se eligen (C-81); los demás ejercicios dicen en un renglón lo que piden.
 * - **Lo elegido vive en la dirección** (`version`, `bloque`, `micro`, `sesion`, `ejercicios`): «Actualizar» y volver
 *   atrás lo conservan.
 * - Una versión en preparación se edita con la misma composición (parte 8; `editor.tsx`): una sesión por vez, con los
 *   ejercicios plegados. Lo que se mira usa los mismos nombres en la dirección, por posición: al pasar de una versión a
 *   la otra se sigue en el mismo lugar.
 */
import {
  COPY_PISTAS,
  COPY_AGENDA_DE_ENTRENAMIENTO,
  COPY_PRIMER_PLAN,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  COPY_PLANTILLAS,
  estructuraConObjetivosComoEntrada,
  historialDeVersiones,
  lineasDePrescripcion,
  loQueSeMiraDelPlan,
  nombresEnUnaFrase,
  numerosDeVersionDePlan,
  sesionesDelBloque,
  todasLasPaginas,
  type LoQueSeMiraDelPlan,
  type PlanConObjetivos,
  type Prescripcion,
  type ResumenDeVersionDePlanDeEntrenamiento,
  type EvaluacionDeEntrenamiento,
  type VersionDelHistorial,
} from '@be/domain';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { EnPartes, conNumerosPegados } from '../../../../components/en-partes';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { tomarAvisoPara } from '../../../../lib/aviso-al-llegar';
import { diaSinElAnioEnCurso, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { DialogoEmpezarDesdePlantilla, type PlantillaParaEmpezar } from '../empezar-desde-plantilla';
import { PrimerPlan } from '../primer-plan';
import { HistorialDelPlan, MenuDePlantillas, SelectorDeVersion, type VersionMostrada } from '../versiones-del-plan';
import { resumenDeLaAgenda, sesionesParaLaAgenda } from './agenda-del-plan';
import { EditorDePlan } from './editor';
import { EstadoDeLectura, useEntrenamiento } from './entrenamiento';
import { EjerciciosDeLaSesion, SelectorDeNivel, type AccesoALasImagenes } from './estructura-del-plan';
import { FormularioDeEvaluacion, FormularioDeObjetivo } from './resumen';
import { DialogoGuardarPlantilla } from './plantillas';
import { Pista } from '../../../../components/pista';

/**
 * Número de versión para la persona: el orden de activación. El `version` del 09 es un token de concurrencia. Lo usa
 * también Registros, para decir frente a qué versión se registró una sesión. La regla es del dominio.
 */
export const numerosDeVersion = (versiones: readonly ResumenDeVersionDePlanDeEntrenamiento[]): Map<string, number> => numerosDeVersionDePlan(versiones);

interface Datos {
  readonly versiones: readonly ResumenDeVersionDePlanDeEntrenamiento[];
  readonly activa: PlanConObjetivos | null;
  /** El objetivo vigente hoy: con él nace una versión nueva. */
  readonly objetivo: string | null;
  /** Desde cuándo rige y qué dice: «Empezar el plan» lo muestra como el paso que ya está (DL-145). */
  readonly objetivoDesde: string | null;
  readonly objetivoTexto: string | null;
}

/** Lo que pide la dirección de la sección, y lo que se quita al elegir cada cosa: lo de más adentro vuelve a lo primero. */
const LO_DE_ADENTRO = { bloque: { micro: null, sesion: null, ejercicios: null }, micro: { sesion: null, ejercicios: null }, sesion: { ejercicios: null } } as const;
const TODO_LO_ELEGIDO = { version: null, bloque: null, micro: null, sesion: null, ejercicios: null } as const;

export function VistaDePlan() {
  const { token, asesoradoId, sesionPerdida, accesoRetirado, parametros, ir, irA } = useEntrenamiento();
  const [r, setR] = useState<Resultado<Datos> | null>(null);
  // Qué lectura falló, para decirlo: «No pudimos cargar esta vista» no decía cuál (bloque 5).
  const [queFallo, setQueFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creando, setCreando] = useState(false);
  // «Guardar como plantilla» sobre la versión activa (PF-09; DL-108): abre el diálogo con la estructura de esa versión.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [desdePlantilla, setDesdePlantilla] = useState(false);
  const [falloDesdePlantilla, setFalloDesdePlantilla] = useState<string | null>(null);
  // Una clave por acto: crear desde la activa y crear desde una plantilla son pedidos distintos.
  const intentoDeCrear = useClaveDeIntento();
  const intentoDeAplicar = useClaveDeIntento();

  // Lo que la página de formularios dejó dicho al volver de un pedido hecho desde «Empezar el plan» (DL-145).
  useEffect(() => {
    const alLlegar = tomarAvisoPara('/pro/advisees/training');
    if (alLlegar) setAviso({ tipo: 'exito', texto: alLlegar });
  }, []);

  const cargar = useCallback(async () => {
    setR(null);
    setQueFallo(null);
    // Todas las versiones, no las primeras: el número de cada una es su lugar entre todas las activadas.
    const [lista, ob] = await Promise.all([todasLasPaginas((f) => api.listarPlanesDeEntrenamiento(token, asesoradoId, f)), api.objetivoDeEntrenamientoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(lista) || sesionPerdida(ob)) return;
    if (!lista.ok || !ob.ok) setQueFallo(nombresEnUnaFrase([lista.ok ? null : 'las versiones del plan', ob.ok ? null : 'el objetivo vigente'].filter((x): x is string => x !== null)));
    if (!lista.ok) return setR(lista as Resultado<never>);
    if (!ob.ok) return setR(ob as Resultado<never>);
    const efectiva = lista.datos.data.find((v) => v.isEffective);
    let activa: PlanConObjetivos | null = null;
    if (efectiva) {
      const v = await api.planConObjetivos(token, efectiva.planId);
      if (sesionPerdida(v)) return;
      if (!v.ok) {
        setQueFallo('la versión activa del plan');
        return setR(v as Resultado<never>);
      }
      activa = v.datos.data;
    }
    const vigente = ob.datos.data.objective;
    setR({
      ok: true,
      datos: { versiones: lista.datos.data, activa, objetivo: vigente?.versionId ?? null, objetivoDesde: vigente?.effectiveFrom ?? null, objetivoTexto: vigente?.objective.statement ?? null },
    });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const objetivo = r?.ok ? r.datos.objetivo : null;

  async function crear(basadaEn: string | null) {
    if (!objetivo) return;
    setCreando(true);
    setAviso(null);
    const res = await api.crearPlanDeEntrenamiento(
      token,
      asesoradoId,
      basadaEn ? { objectiveVersionId: objetivo, basedOnPlanId: basadaEn } : { objectiveVersionId: objetivo, initialStructure: { blocks: [{ label: 'Bloque 1', sessions: [] }] } },
      intentoDeCrear.actual(),
    );
    intentoDeCrear.registrar(res);
    setCreando(false);
    // Una escritura denegada retira el contenido de la pestaña entera.
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    setAviso({ tipo: 'exito', texto: 'Borrador creado. No es visible para el asesorado hasta que lo actives.' });
    ir(TODO_LO_ELEGIDO);
    await cargar();
  }

  /** Crear el borrador desde una plantilla propia (API-TRN-07 con `fromTemplateVersionId`): nace de la persona, con su objetivo. */
  async function aplicar(templateVersionId: string) {
    if (!objetivo) return;
    setCreando(true);
    setFalloDesdePlantilla(null);
    const res = await api.crearPlanDeEntrenamiento(token, asesoradoId, { objectiveVersionId: objetivo, fromTemplateVersionId: templateVersionId }, intentoDeAplicar.actual());
    intentoDeAplicar.registrar(res);
    setCreando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setFalloDesdePlantilla(res.tipo === 'API' && res.codigo === 'TEMPLATE_ARCHIVED' ? COPY_PLANTILLAS.archivadaNoSeAplica : mensajeDeFallo(res));
    setDesdePlantilla(false);
    setAviso({ tipo: 'exito', texto: COPY_PLANTILLAS.aplicada });
    ir(TODO_LO_ELEGIDO);
    await cargar();
  }

  const leerPlantillas = useCallback(async (): Promise<Resultado<readonly PlantillaParaEmpezar[]>> => {
    const res = await todasLasPaginas((f) => api.listarPlantillasDeEntrenamiento(token, { state: 'ACTIVE', ...f }));
    // Con la sesión vencida la pantalla ya redirige: el resultado se devuelve igual, para no dejar el diálogo cargando.
    if (sesionPerdida(res) || !res.ok) return res as Resultado<never>;
    return {
      ok: true,
      datos: res.datos.data.map((p) => ({
        versionId: p.versionId,
        nombre: p.name,
        detalle: `${COPY_PLANTILLAS.sesiones(p.sessionCount)} · ${p.copiedLoads ? COPY_PLANTILLAS.conCargas : COPY_PLANTILLAS.sinCargas}`,
      })),
    };
  }, [token, sesionPerdida]);

  const abrirDesdePlantilla = () => {
    setFalloDesdePlantilla(null);
    setDesdePlantilla(true);
  };

  return (
    <EstadoDeLectura r={r} onReintentar={cargar} que={queFallo}>
      {r?.ok
        ? (() => {
            const { versiones, activa } = r.datos;
            const borrador = versiones.find((v) => v.state === 'DRAFT') ?? null;
            const historial = historialDeVersiones(versiones);
            const numeroDeLaActiva = activa ? (historial.find((v) => v.planId === activa.planId)?.numero ?? 1) : null;
            // Con una versión en preparación, es la que se muestra, salvo que la dirección pida la activa y la haya.
            const mostrada: VersionMostrada = borrador && !(activa && parametros.get('version') === 'activa') ? 'preparacion' : 'activa';
            // Las acciones que crean una versión: solo sin borrador, y con un objetivo vigente del que nacer.
            const sePuedeCrear = !borrador && !!objetivo;
            const desdeUnaPlantilla = (
              <button type="button" className="boton boton--quieto" onClick={abrirDesdePlantilla} disabled={creando} data-empezar-desde-plantilla>
                <Icono nombre="plantillas" tamano={18} />
                {COPY_PLANTILLAS.empezarDesdePlantilla}
              </button>
            );
            const botonDeLaVersion = (
              <button type="button" className="boton boton--primario" onClick={() => void crear(activa ? activa.planId : null)} disabled={creando} data-crear-version>
                <Icono nombre={activa ? 'duplicar' : 'plan'} tamano={18} />
                {activa ? COPY_ENTRENAMIENTO.crearNuevaVersion : COPY_ENTRENAMIENTO.crearPlan}
              </button>
            );
            // DL-146: la pista dice por qué es una versión nueva y no una edición (DL-047; UC-P10 V07).
            const crearLaVersion = activa ? <Pista texto={COPY_PISTAS.plan.nuevaVersion}>{botonDeLaVersion}</Pista> : botonDeLaVersion;
            const irAlResumen = (
              <button type="button" className="boton boton--enlace" onClick={() => irA('resumen')}>
                {C.irAResumen}
              </button>
            );
            return (
              <div className="plan" data-version={mostrada}>
                {aviso && aviso.tipo === 'exito' ? (
                  <AvisoFlotante onCerrar={() => setAviso(null)}>
                    <p>{aviso.texto}</p>
                  </AvisoFlotante>
                ) : null}
                {aviso && aviso.tipo === 'error' ? (
                  <Aviso tipo="error" enfocar>
                    <p>{aviso.texto}</p>
                  </Aviso>
                ) : null}

                {borrador && activa ? <SelectorDeVersion mostrada={mostrada} numeroDeLaActiva={numeroDeLaActiva ?? 1} onElegir={(cual) => ir({ version: cual === 'activa' ? 'activa' : null })} /> : null}

                {borrador ? (
                  // Queda montada aunque se mire la activa: lo escrito sin guardar sigue ahí al volver.
                  <div className="plan__preparacion" hidden={mostrada !== 'preparacion'}>
                    {!activa ? <p className="nota">{COPY_ENTRENAMIENTO.sinPlanActivo}</p> : null}
                    <EditorDePlan
                      key={borrador.planId}
                      planId={borrador.planId}
                      objetivoVigente={objetivo}
                      vigente={activa && activa.activatedAt ? { numero: numeroDeLaActiva ?? 1, desde: activa.activatedAt } : null}
                      onActivado={() => {
                        setAviso({ tipo: 'exito', texto: `${COPY_ENTRENAMIENTO.planActivado}. El asesorado ya ve esta planificación como vigente.` });
                        ir(TODO_LO_ELEGIDO);
                        void cargar();
                      }}
                    />
                    {!activa && historial.length > 0 ? <HistorialDelPlan historial={historial} huella={null} /> : null}
                  </div>
                ) : null}

                {mostrada === 'activa' && activa ? (
                  <PlanActivo
                    version={activa}
                    numero={numeroDeLaActiva ?? 1}
                    historial={historial}
                    acciones={
                      <>
                        {borrador ? <p className="nota plan__ya-hay">{C.yaHayUnaEnPreparacion}</p> : null}
                        {/* Las plantillas, en su menú: la principal va sola, contra el borde (crítica de diseño, 2026-10-15). */}
                        <MenuDePlantillas alGuardar={() => setGuardarPlantilla(true)} alEmpezar={sePuedeCrear ? abrirDesdePlantilla : null} />
                        {sePuedeCrear ? crearLaVersion : null}
                      </>
                    }
                    aviso={
                      !objetivo && !borrador ? (
                        <Aviso tipo="info">
                          <p>
                            {C.primeroElObjetivo} {irAlResumen}
                          </p>
                        </Aviso>
                      ) : null
                    }
                  />
                ) : null}

                {mostrada === 'activa' && !activa ? (
                  <>
                    {/* Sin plan: los tres pasos en orden, en esta misma pantalla (DL-145). La acción principal va primera. */}
                    <PrimerPlanDeEntrenamiento
                      objetivoDesde={r.datos.objetivoDesde}
                      objetivoTexto={r.datos.objetivoTexto}
                      accionesDelPlan={
                        sePuedeCrear ? (
                          <>
                            {crearLaVersion}
                            {desdeUnaPlantilla}
                          </>
                        ) : null
                      }
                      onObjetivo={() => {
                        setAviso({ tipo: 'exito', texto: COPY_PRIMER_PLAN.objetivoDefinido });
                        void cargar();
                      }}
                    />
                    {historial.length > 0 ? <HistorialDelPlan historial={historial} huella={null} /> : null}
                  </>
                ) : null}

                {activa ? (
                  <DialogoGuardarPlantilla
                    token={token}
                    abierto={guardarPlantilla}
                    estructura={{ blocks: estructuraConObjetivosComoEntrada(activa) }}
                    origen={activa.planId}
                    onCerrar={() => setGuardarPlantilla(false)}
                    onGuardada={() => {
                      setGuardarPlantilla(false);
                      setAviso({ tipo: 'exito', texto: COPY_PLANTILLAS.guardada });
                    }}
                  />
                ) : null}
                <DialogoEmpezarDesdePlantilla
                  abierto={desdePlantilla}
                  leer={leerPlantillas}
                  creando={creando}
                  error={falloDesdePlantilla}
                  onCerrar={() => setDesdePlantilla(false)}
                  onAplicar={(id) => void aplicar(id)}
                />
              </div>
            );
          })()
        : null}
    </EstadoDeLectura>
  );
}

/**
 * Lo planificado de una prescripción, una línea por dato, con la presentación que comparte con la APK (DL-105): todas
 * las series con sus notas, la intensidad con su referencia, la carga sugerida, los parámetros y la nota. Sin criterio
 * de intensidad, el website lo dice: el profesional tiene que verlo.
 */
export function LineasDePrescripcion({ prescripcion }: { prescripcion: Prescripcion }) {
  return (
    <ul className="lista-compacta">
      {lineasDePrescripcion(prescripcion, { sinCriterioExplicito: true }).map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

/** Lo que pide quien mira: de la dirección, en la sección «Plan»; de la visita, en la ficha. */
interface Pedido {
  readonly bloque: string | null;
  readonly micro: string | null;
  readonly sesion: string | null;
  readonly ejercicios: string | null;
}

/**
 * El bloque, el microciclo y la sesión que se miran, y los ejercicios de esa sesión. Al elegir algo, lo de más adentro
 * vuelve a lo primero: los ejercicios abiertos son de una sesión, y las sesiones, de un bloque o de un microciclo.
 */
function SesionQueSeMira({
  version,
  pedido,
  alPedir,
  acceso,
  nivel,
  alCostado = null,
}: {
  version: PlanConObjetivos;
  pedido: Pedido;
  alPedir: (cambios: Partial<Pedido>) => void;
  acceso: AccesoALasImagenes;
  nivel: 3 | 4;
  /** Lo que va al lado de los ejercicios: el historial, en la sección «Plan». */
  alCostado?: ReactNode;
}) {
  const mira: LoQueSeMiraDelPlan = loQueSeMiraDelPlan(version.blocks, { bloque: pedido.bloque, microciclo: pedido.micro, sesion: pedido.sesion });
  // Lo primero no se escribe: es lo que se ve sin pedir nada.
  const orden = <T extends { readonly order: number }>(lista: readonly T[], elegido: number): string | null => (Math.min(...lista.map((x) => x.order)) === elegido ? null : String(elegido));
  if (!mira.bloque) return <p className="nota">{C.sinBloques}</p>;
  // DL-137: con agenda, qué días va cada sesión y desde cuándo.
  const agenda = version.agenda && version.agenda.sessions.length > 0 ? version.agenda : null;
  const diasDeLaSesion = agenda?.sessions.find((x) => x.sessionId === mira.sesion?.sessionId)?.weekdays ?? [];
  return (
    <>
      {agenda ? (
        <p className="nota plan__agenda" data-agenda-del-plan>
          <strong>{COPY_AGENDA_DE_ENTRENAMIENTO.titulo}:</strong> {resumenDeLaAgenda(agenda, sesionesParaLaAgenda(version.blocks))}
        </p>
      ) : null}
      <div className="plan__niveles">
        <SelectorDeNivel nivel="bloque" rotulo={C.bloque} opciones={version.blocks} elegido={mira.bloque} onElegir={(o) => alPedir({ bloque: orden(version.blocks, o), ...LO_DE_ADENTRO.bloque })}>
          <span className="nota nivel-del-plan__detalle">
            <EnPartes texto={[sesionesDelBloque(mira.bloque), ...(mira.bloque.purpose ? [`${C.proposito}: ${mira.bloque.purpose}`] : [])].join(' · ')} />
          </span>
        </SelectorDeNivel>
        {mira.microciclo ? (
          <SelectorDeNivel nivel="microciclo" rotulo={C.microciclo} opciones={mira.bloque.microcycles} elegido={mira.microciclo} onElegir={(o) => alPedir({ micro: orden(mira.bloque!.microcycles, o), ...LO_DE_ADENTRO.micro })}>
            {mira.microciclo.purpose ? (
              <span className="nota nivel-del-plan__detalle">
                {C.proposito}: {mira.microciclo.purpose}
              </span>
            ) : null}
          </SelectorDeNivel>
        ) : null}
        {mira.sesion ? (
          <SelectorDeNivel nivel="sesion" rotulo={C.sesion} opciones={mira.sesiones} elegido={mira.sesion} onElegir={(o) => alPedir({ sesion: orden(mira.sesiones, o), ...LO_DE_ADENTRO.sesion })}>
            {/* Con agenda, los días de esta sesión (DL-137); sin agenda, con más de una sesión, la persona elige cuál hace. */}
            {agenda ? (
              <span className="nota nivel-del-plan__detalle" data-dias-de-la-sesion>
                {diasDeLaSesion.length > 0 ? COPY_AGENDA_DE_ENTRENAMIENTO.diasDeLaSesion(diasDeLaSesion) : COPY_AGENDA_DE_ENTRENAMIENTO.sinDias}
              </span>
            ) : mira.sesiones.length > 1 ? (
              <span className="nota nivel-del-plan__detalle">{C.sinDiaAsignado}</span>
            ) : null}
          </SelectorDeNivel>
        ) : (
          <p className="nota">{C.sinSesiones}</p>
        )}
        {mira.sesion?.instructions ? (
          <p className="indicaciones-de-la-sesion">
            <span className="nivel-del-plan__rotulo">{COPY_ENTRENAMIENTO.indicacionesDeLaSesion}</span> {conNumerosPegados(mira.sesion.instructions)}
          </p>
        ) : null}
      </div>
      <div className="plan__cuerpo">
        {mira.sesion ? <EjerciciosDeLaSesion sesion={mira.sesion} pedido={pedido.ejercicios} onPedir={(ejercicios) => alPedir({ ejercicios })} acceso={acceso} nivel={nivel} /> : <div />}
        {alCostado}
      </div>
    </>
  );
}

function PlanActivo({ version, numero, historial, acciones, aviso }: { version: PlanConObjetivos; numero: number; historial: readonly VersionDelHistorial[]; acciones: ReactNode; aviso: ReactNode }) {
  const { token, sesionPerdida, parametros, ir } = useEntrenamiento();
  const activadaEl = diaSinElAnioEnCurso(version.activatedAt as string);
  return (
    <section className="plan__activo" aria-labelledby="titulo-activo">
      <div className="plan__encabezado">
        <h2 id="titulo-activo">Plan activo</h2>
        <span className="etiqueta-de-dato">
          <Icono nombre="candado" tamano={15} />
          Solo lectura
        </span>
        <p className="plan__version">
          <EnPartes texto={[C.versionActivada(numero, activadaEl), ...(version.isEffective ? [C.esLoQueVe] : [])].join(' · ')} />
        </p>
        <div className="plan__acciones">{acciones}</div>
      </div>
      {aviso}
      <SesionQueSeMira
        version={version}
        pedido={{ bloque: parametros.get('bloque'), micro: parametros.get('micro'), sesion: parametros.get('sesion'), ejercicios: parametros.get('ejercicios') }}
        alPedir={(cambios) => ir(cambios as Record<string, string | null>)}
        acceso={{ token, sesionPerdida }}
        nivel={3}
        alCostado={<HistorialDelPlan historial={historial} huella={version.snapshotDigest} />}
      />
    </section>
  );
}

/**
 * La versión activada tal como rigió, desde su instantánea y en solo lectura, para el detalle de una etapa en la ficha:
 * una columna angosta, con su título. No usa el contexto de la pestaña Entrenamiento —en la ficha no existe—: quien la
 * muestra le pasa con qué leer la imagen de un ejercicio. Lo elegido (el bloque, la sesión, los ejercicios abiertos) dura
 * lo que el detalle abierto: la dirección de la ficha es de la ficha.
 */
export function PlanSoloLectura({ version, numero: numeroDeVersion, acceso }: { version: PlanConObjetivos; numero: number; acceso: AccesoALasImagenes }) {
  const [pedido, setPedido] = useState<Pedido>({ bloque: null, micro: null, sesion: null, ejercicios: null });
  return (
    <div className="version-del-plan">
      <p>
        Versión {numeroDeVersion} · activada el {fecha(version.activatedAt as string)}
      </p>
      {version.snapshotDigest ? (
        <p className="nota">
          {C.huella}: <span className="huella">{version.snapshotDigest.slice(0, 16)}…</span>
        </p>
      ) : null}
      <SesionQueSeMira version={version} pedido={pedido} alPedir={(cambios) => setPedido((p) => ({ ...p, ...cambios }))} acceso={acceso} nivel={4} />
    </div>
  );
}

/**
 * «Empezar el plan» de Entrenamiento (DL-145): lee las evaluaciones y pone los formularios de Resumen en el paso que toca.
 * Una lectura que falla se dice como falla, nunca como «todavía no hay evaluación» (`EstadoDeLectura`).
 */
function PrimerPlanDeEntrenamiento({
  objetivoDesde,
  objetivoTexto,
  accionesDelPlan,
  onObjetivo,
}: {
  objetivoDesde: string | null;
  objetivoTexto: string | null;
  accionesDelPlan: ReactNode;
  onObjetivo: () => void;
}) {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const [r, setR] = useState<Resultado<readonly EvaluacionDeEntrenamiento[]> | null>(null);
  const [abierto, setAbierto] = useState<'evaluacion' | 'objetivo' | null>(null);
  const leer = useCallback(async () => {
    const res = await api.listarEvaluacionesDeEntrenamiento(token, asesoradoId);
    if (sesionPerdida(res)) return;
    setR(res.ok ? { ok: true, datos: res.datos.data } : (res as Resultado<never>));
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);
  const evaluaciones = r?.ok ? r.datos : [];
  const ultima = [...evaluaciones].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  return (
    <EstadoDeLectura r={r} onReintentar={() => void leer()} que="las evaluaciones">
      <PrimerPlan
        evaluacion={ultima ? diaSinElAnioEnCurso(ultima.occurredAt) : false}
        objetivoDesde={objetivoDesde ? diaSinElAnioEnCurso(objetivoDesde) : null}
        objetivoTexto={objetivoTexto}
        abierto={abierto}
        onAbrir={setAbierto}
        formularioDeEvaluacion={
          <FormularioDeEvaluacion
            conTitulo={false}
            onRegistrada={() => {
              setAbierto('objetivo');
              void leer();
            }}
            onCancelar={() => setAbierto(null)}
          />
        }
        formularioDeObjetivo={
          <FormularioDeObjetivo
            evaluaciones={evaluaciones}
            onEmitido={() => {
              setAbierto(null);
              onObjetivo();
            }}
            onCancelar={() => setAbierto(null)}
          />
        }
        accionesDelPlan={accionesDelPlan}
        pedirInformacion={`/pro/advisees/forms?id=${encodeURIComponent(asesoradoId)}&vista=pedir&plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento-plan`}
      />
    </EstadoDeLectura>
  );
}
