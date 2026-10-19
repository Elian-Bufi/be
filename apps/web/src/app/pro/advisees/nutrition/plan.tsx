'use client';

/**
 * NUT-04 Plan (B05:355-398; 1301-1339), recompuesto en WP-ESCRITORIO-AREAS, parte 5 (maqueta 16; C-31, C-35, C-39, C-45).
 * - La versión activa se muestra en solo lectura, desde la instantánea: lo que ve el asesorado (REG-06-105). No hay
 *   botón que la edite (INV-06-109). Para corregirla: «Nueva versión del plan» (CAND-NUT-D; DL-047).
 * - Un solo borrador por plan (REG-06-12): si ya hay uno, se sigue sobre ese y no se ofrece crear otro.
 * - «Borrador creado», no «Plan creado correctamente» (B05:378-398).
 * - **Un selector de versión** cuando hay una en preparación y una activa (C-39): se mira una u otra. La que está en
 *   preparación queda montada al pasar a la activa: lo escrito sin guardar no se pierde.
 * - **El plan activo se lee de a un día tipo, con las comidas plegadas** (C-35), y con el objetivo del día a la vista
 *   (C-31): el que cita esa versión, no el que rija hoy si es otro.
 * - **Lo elegido vive en la dirección** (`version`, `dia`, `comidas`): «Actualizar» y volver atrás lo conservan.
 * - Una versión en preparación sigue en el editor de siempre, hasta su parte (la 7).
 */
import {
  COPY_PISTAS,
  COPY_DEL_PLAN,
  COPY_NUTRICION,
  COPY_PRIMER_PLAN,
  COPY_PLANTILLAS,
  diaTipoElegido,
  estructuraNutricionalComoEntrada,
  historialDeVersiones,
  numerosDeVersionDePlan,
  todasLasPaginas,
  type EvaluacionNutricional,
  type VersionDelHistorial,
  type VersionDeObjetivo,
  type VersionDePlan,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { EnPartes } from '../../../../components/en-partes';
import { Cargando } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { diaSinElAnioEnCurso, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { DialogoEmpezarDesdePlantilla, type PlantillaParaEmpezar } from '../empezar-desde-plantilla';
import { PrimerPlan } from '../primer-plan';
import { TiraDelObjetivo } from '../seguimiento/tira-del-objetivo';
import { HistorialDelPlan, MenuDePlantillas, SelectorDeVersion, type VersionMostrada } from '../versiones-del-plan';
import { EditorDeBorrador } from './editor';
import { FormularioDeEvaluacion, FormularioDeObjetivo } from './formularios';
import { ComidasDelPlan, SelectorDeDiaTipo } from './estructura-del-plan';
import { EstadoDeLectura, useNutricion } from './nutricion';
import { DialogoGuardarPlantillaNutricional } from './plantillas';
import { Pista } from '../../../../components/pista';

type Resumen = Omit<VersionDePlan, 'dayTypes'>;

/**
 * Número de versión para la persona: el orden de activación (1, 2, 3…). El campo `version` del 09 es el token de
 * concurrencia del recurso (09:255-257) y avanza con cada guardado: no sirve para mostrar. La regla es del dominio.
 */
export const numerosDeVersion = (versiones: readonly Resumen[]): Map<string, number> => numerosDeVersionDePlan(versiones);

interface Datos {
  readonly versiones: readonly Resumen[];
  readonly activa: VersionDePlan | null;
  /** El objetivo vigente hoy: con él nace una versión nueva. */
  readonly objetivo: VersionDeObjetivo | null;
}


export function VistaDePlan() {
  const { token, asesoradoId, sesionPerdida, accesoRetirado, parametros, ir, irA } = useNutricion();
  const [r, setR] = useState<Resultado<Datos> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creando, setCreando] = useState(false);
  // «Guardar como plantilla» sobre la versión activa (PF-09; DL-108).
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [desdePlantilla, setDesdePlantilla] = useState(false);
  const [falloDesdePlantilla, setFalloDesdePlantilla] = useState<string | null>(null);
  // Una clave por acto: crear desde la activa y crear desde una plantilla son pedidos distintos.
  const intentoDeCrear = useClaveDeIntento();
  const intentoDeAplicar = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setR(null);
    // Todas las versiones, no las primeras: el número de cada una es su lugar entre todas las activadas.
    const [lista, ob] = await Promise.all([todasLasPaginas((f) => api.listarPlanes(token, asesoradoId, f)), api.objetivoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(lista) || sesionPerdida(ob)) return;
    if (!lista.ok) return setR(lista as Resultado<never>);
    if (!ob.ok) return setR(ob as Resultado<never>);
    const efectiva = lista.datos.data.find((v) => v.isEffective);
    let activa: VersionDePlan | null = null;
    if (efectiva) {
      const v = await api.consultarPlan(token, efectiva.planId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return setR(v as Resultado<never>);
      activa = v.datos.data;
    }
    setR({ ok: true, datos: { versiones: lista.datos.data, activa, objetivo: ob.datos.data.objective } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const objetivo = r?.ok ? r.datos.objetivo : null;

  async function crear(basadaEn: string | null) {
    if (!objetivo) return;
    setCreando(true);
    setAviso(null);
    const res = await api.crearBorradorDePlan(
      token,
      asesoradoId,
      basadaEn ? { objectiveVersionId: objetivo.versionId, basedOnPlanId: basadaEn } : { objectiveVersionId: objetivo.versionId, initialStructure: { dayTypes: [{ label: 'Día habitual', meals: [] }] } },
      intentoDeCrear.actual(),
    );
    intentoDeCrear.registrar(res);
    setCreando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(res) });
    setAviso({ tipo: 'exito', texto: COPY_NUTRICION.borradorCreado });
    ir({ version: null, dia: null, comidas: null });
    await cargar();
  }

  /** Crear el borrador desde una plantilla propia (API-NUT-07 con `fromTemplateVersionId`): nace de la persona, con su objetivo. */
  async function aplicar(templateVersionId: string) {
    if (!objetivo) return;
    setCreando(true);
    setFalloDesdePlantilla(null);
    const res = await api.crearBorradorDePlan(token, asesoradoId, { objectiveVersionId: objetivo.versionId, fromTemplateVersionId: templateVersionId }, intentoDeAplicar.actual());
    intentoDeAplicar.registrar(res);
    setCreando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return setFalloDesdePlantilla(res.tipo === 'API' && res.codigo === 'TEMPLATE_ARCHIVED' ? COPY_PLANTILLAS.archivadaNoSeAplica : mensajeDeFallo(res));
    setDesdePlantilla(false);
    setAviso({ tipo: 'exito', texto: COPY_PLANTILLAS.aplicada });
    ir({ version: null, dia: null, comidas: null });
    await cargar();
  }

  const leerPlantillas = useCallback(async (): Promise<Resultado<readonly PlantillaParaEmpezar[]>> => {
    const res = await todasLasPaginas((f) => api.listarPlantillasNutricionales(token, { state: 'ACTIVE', ...f }));
    // Con la sesión vencida la pantalla ya redirige: el resultado se devuelve igual, para no dejar el diálogo cargando.
    if (sesionPerdida(res) || !res.ok) return res as Resultado<never>;
    return {
      ok: true,
      datos: res.datos.data.map((p) => ({
        versionId: p.versionId,
        nombre: p.name,
        detalle: `${COPY_PLANTILLAS.comidas(p.mealCount)} · ${p.copiedQuantities ? COPY_PLANTILLAS.conCantidades : COPY_PLANTILLAS.sinCantidades}`,
      })),
    };
  }, [token, sesionPerdida]);

  const abrirDesdePlantilla = () => {
    setFalloDesdePlantilla(null);
    setDesdePlantilla(true);
  };

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
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
                {activa ? COPY_NUTRICION.crearNuevaVersion : COPY_NUTRICION.crearNuevoPlan}
              </button>
            );
            // DL-146: la pista dice por qué es una versión nueva y no una edición (DL-047; UC-P10 V07).
            const crearLaVersion = activa ? <Pista texto={COPY_PISTAS.plan.nuevaVersion}>{botonDeLaVersion}</Pista> : botonDeLaVersion;
            // En el encabezado la principal va última, contra el borde, y las plantillas en su menú; donde todavía no hay
            // un plan, la principal va primera y las plantillas con su botón.
            const empezarElPlan = sePuedeCrear ? (
              <>
                {crearLaVersion}
                {desdeUnaPlantilla}
              </>
            ) : null;
            const sinObjetivo = !objetivo && !borrador ? (
              <Aviso tipo="info">
                <p>
                  {COPY_DEL_PLAN.primeroElObjetivo}{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => irA('resumen')}>
                    {COPY_DEL_PLAN.irAResumen}
                  </button>
                </p>
              </Aviso>
            ) : null;
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
                    {!activa ? <p className="nota">{COPY_NUTRICION.sinPlanActivo}</p> : null}
                    <EditorDeBorrador
                      key={borrador.planId}
                      planId={borrador.planId}
                      objetivo={objetivo ?? null}
                      vigente={activa && activa.activatedAt ? { numero: numeroDeLaActiva ?? 1, desde: activa.activatedAt } : null}
                      onActivado={() => {
                        setAviso({ tipo: 'exito', texto: COPY_DEL_PLAN.versionActivadaAviso });
                        ir({ version: null, dia: null, comidas: null });
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
                    objetivoVigente={objetivo}
                    acciones={
                      <>
                        {!sePuedeCrear && borrador ? <p className="nota plan__ya-hay">{COPY_DEL_PLAN.yaHayUnaEnPreparacion}</p> : null}
                        <MenuDePlantillas alGuardar={() => setGuardarPlantilla(true)} alEmpezar={sePuedeCrear ? abrirDesdePlantilla : null} />
                        {sePuedeCrear ? crearLaVersion : null}
                      </>
                    }
                    aviso={sinObjetivo}
                  />
                ) : null}

                {mostrada === 'activa' && !activa ? (
                  <>
                    {/* Sin plan: los tres pasos en orden, en esta misma pantalla (DL-145). La acción principal va primera. */}
                    <PrimerPlanDeNutricion
                      objetivoDesde={objetivo?.effectiveFrom ?? null}
                      accionesDelPlan={empezarElPlan}
                      onObjetivo={() => {
                        setAviso({ tipo: 'exito', texto: COPY_PRIMER_PLAN.objetivoDefinido });
                        void cargar();
                      }}
                    />
                    {historial.length > 0 ? <HistorialDelPlan historial={historial} huella={null} /> : null}
                  </>
                ) : null}

                {activa ? (
                  <DialogoGuardarPlantillaNutricional
                    token={token}
                    abierto={guardarPlantilla}
                    estructura={estructuraNutricionalComoEntrada(activa)}
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

/** El objetivo que cita la versión: el vigente, si es ese; si no, se busca entre las versiones del objetivo. */
type ObjetivoDeLaVersion = { readonly estado: 'cargando' } | { readonly estado: 'listo'; readonly objetivo: VersionDeObjetivo; readonly esElVigente: boolean } | { readonly estado: 'falla' } | { readonly estado: 'no-esta' };

function useObjetivoDeLaVersion(version: VersionDePlan, vigente: VersionDeObjetivo | null): { readonly lectura: ObjetivoDeLaVersion; readonly reintentar: () => void } {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const esElVigente = vigente?.versionId === version.objectiveVersionId;
  const [leido, setLeido] = useState<ObjetivoDeLaVersion>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const generacion = useRef(0);
  useEffect(() => {
    if (esElVigente) return;
    const esta = ++generacion.current;
    setLeido({ estado: 'cargando' });
    void api.listarObjetivos(token, asesoradoId).then((res) => {
      if (esta !== generacion.current || sesionPerdida(res)) return;
      if (!res.ok) return setLeido({ estado: 'falla' });
      const objetivo = res.datos.data.find((o) => o.versionId === version.objectiveVersionId);
      setLeido(objetivo ? { estado: 'listo', objetivo, esElVigente: false } : { estado: 'no-esta' });
    });
    return () => {
      generacion.current++;
    };
  }, [esElVigente, token, asesoradoId, sesionPerdida, version.objectiveVersionId, intento]);
  return { lectura: esElVigente && vigente ? { estado: 'listo', objetivo: vigente, esElVigente: true } : leido, reintentar: () => setIntento((n) => n + 1) };
}

function PlanActivo({
  version,
  numero,
  historial,
  objetivoVigente,
  acciones,
  aviso,
}: {
  version: VersionDePlan;
  numero: number;
  historial: readonly VersionDelHistorial[];
  objetivoVigente: VersionDeObjetivo | null;
  acciones: ReactNode;
  aviso: ReactNode;
}) {
  const { parametros, ir } = useNutricion();
  const { lectura: objetivo, reintentar } = useObjetivoDeLaVersion(version, objetivoVigente);
  const dia = diaTipoElegido(version.dayTypes, parametros.get('dia'));
  const primero = diaTipoElegido(version.dayTypes, null);
  const activadaEl = diaSinElAnioEnCurso(version.activatedAt as string);
  return (
    <section className="plan__activo" aria-labelledby="titulo-activo">
      <div className="plan__encabezado">
        <h2 id="titulo-activo">{COPY_NUTRICION.planActivo}</h2>
        <span className="etiqueta-de-dato">
          <Icono nombre="candado" tamano={15} />
          {COPY_NUTRICION.soloLectura}
        </span>
        <p className="plan__version">
          <EnPartes texto={[COPY_DEL_PLAN.versionActivada(numero, activadaEl), ...(version.isEffective ? [COPY_DEL_PLAN.esLoQueVe] : [])].join(' · ')} />
        </p>
        <div className="plan__acciones">{acciones}</div>
      </div>
      {aviso}

      <div className="plan__dia">
        {/* Elegir otro día tipo deja abierta su primera comida: las abiertas son de un día. */}
        <SelectorDeDiaTipo dias={version.dayTypes} elegido={dia} onElegir={(orden) => ir({ dia: orden === primero?.order ? null : String(orden), comidas: null })} />
        <div className="plan__objetivo" data-objetivo={objetivo.estado}>
          <p className="plan__objetivo-titulo">
            <Icono nombre="objetivo" tamano={18} />
            {COPY_DEL_PLAN.objetivoDelDia}
          </p>
          {objetivo.estado === 'cargando' ? <Cargando /> : null}
          {objetivo.estado === 'listo' ? (
            <TiraDelObjetivo calorias={objetivo.objetivo.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: objetivo.objetivo.macronutrientDistribution }} onReintentar={reintentar} />
          ) : null}
          {objetivo.estado === 'falla' || objetivo.estado === 'no-esta' ? (
            <p className="nota plan__objetivo-falla">
              {COPY_DEL_PLAN.objetivoNoSeLeyo}{' '}
              {objetivo.estado === 'falla' ? (
                <button type="button" className="boton boton--enlace" onClick={reintentar}>
                  Reintentar<span className="visualmente-oculto"> la lectura del objetivo</span>
                </button>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      {objetivo.estado === 'listo' && !objetivo.esElVigente ? <p className="nota plan__objetivo-nota">{objetivoVigente ? COPY_DEL_PLAN.objetivoAnterior : COPY_DEL_PLAN.objetivoYaNoRige}</p> : null}

      <div className="plan__cuerpo">
        {dia ? <ComidasDelPlan dia={dia} pedido={parametros.get('comidas')} onPedir={(pedido) => ir({ comidas: pedido })} /> : <p className="nota">{COPY_DEL_PLAN.sinDiasTipo}</p>}
        <HistorialDelPlan historial={historial} huella={version.snapshotDigest} />
      </div>
    </section>
  );
}

/**
 * La versión activada tal como rigió, desde su instantánea y en solo lectura (B05:732-743, 1325-1339), para el detalle de
 * una etapa en la ficha: una columna angosta, con su título. Lo elegido (el día tipo, las comidas abiertas) dura lo que
 * el detalle abierto: la dirección de la ficha es de la ficha.
 */
export function VersionSoloLectura({ version, numero }: { version: VersionDePlan; numero: number }) {
  const [pedido, setPedido] = useState<{ readonly dia: string | null; readonly comidas: string | null }>({ dia: null, comidas: null });
  const dia = diaTipoElegido(version.dayTypes, pedido.dia);
  return (
    <div className="version-del-plan">
      <p>
        <span className="etiqueta-de-dato">
          <Icono nombre="candado" tamano={15} />
          {COPY_NUTRICION.soloLectura}
        </span>{' '}
        Versión {numero} · activada el {fecha(version.activatedAt as string)}
      </p>
      {version.snapshotDigest ? (
        <p className="nota">
          {COPY_DEL_PLAN.huella}: <span className="huella">{version.snapshotDigest.slice(0, 16)}…</span>
        </p>
      ) : null}
      <SelectorDeDiaTipo dias={version.dayTypes} elegido={dia} onElegir={(orden) => setPedido({ dia: String(orden), comidas: null })} />
      {dia ? <ComidasDelPlan dia={dia} pedido={pedido.comidas} onPedir={(comidas) => setPedido((p) => ({ ...p, comidas }))} nivel={4} /> : <p className="nota">{COPY_DEL_PLAN.sinDiasTipo}</p>}
    </div>
  );
}

/**
 * «Empezar el plan» de Nutrición (DL-145): lee las evaluaciones y pone los formularios de Resumen en el paso que toca.
 * Una lectura que falla se dice como falla, nunca como «todavía no hay evaluación» (`EstadoDeLectura`).
 */
function PrimerPlanDeNutricion({ objetivoDesde, accionesDelPlan, onObjetivo }: { objetivoDesde: string | null; accionesDelPlan: ReactNode; onObjetivo: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const [r, setR] = useState<Resultado<readonly EvaluacionNutricional[]> | null>(null);
  const [abierto, setAbierto] = useState<'evaluacion' | 'objetivo' | null>(null);
  const leer = useCallback(async () => {
    const res = await api.listarEvaluaciones(token, asesoradoId);
    if (sesionPerdida(res)) return;
    setR(res.ok ? { ok: true, datos: res.datos.data } : (res as Resultado<never>));
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);
  const evaluaciones = r?.ok ? r.datos : [];
  const ultima = [...evaluaciones].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  return (
    <EstadoDeLectura r={r} onReintentar={() => void leer()}>
      <PrimerPlan
        evaluacion={ultima ? diaSinElAnioEnCurso(ultima.occurredAt) : false}
        objetivoDesde={objetivoDesde ? diaSinElAnioEnCurso(objetivoDesde) : null}
        abierto={abierto}
        onAbrir={setAbierto}
        formularioDeEvaluacion={
          <FormularioDeEvaluacion
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
        pedirInformacion={`/pro/advisees/forms?id=${encodeURIComponent(asesoradoId)}&vista=pedir`}
      />
    </EstadoDeLectura>
  );
}
