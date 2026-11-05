'use client';

/**
 * «Solicitudes» (WP-07; RF-071; API-FRM-04, API-FRI-01 y 03; WP-ESCRITORIO-AREAS, parte 4; maqueta 26): lo que el
 * profesional le pidió a esta persona y lo que ella declaró. Pedir no concede nada, lo respondido es **declarado por la
 * persona** —no una medición ni un diagnóstico (09 §22.7)—, y una solicitud sin responder no es una falta: se muestra
 * como lo que es.
 *
 * - **La lista se lee entera, una vez,** con FRM-04, en el orden de la API (la más nueva primero). Las vistas con nombre
 *   cuentan solicitudes por su estado, sobre esa lista: elegir una no le pide nada a la API.
 * - **El detalle es el de API-FRI-03** (WP-FORMULARIOS-DE-INICIO, DL-164): sirve cualquier versión —de P0 o con tipos
 *   nuevos— y trae la respuesta en formato V2, lo que el profesional cargó y espera confirmación, y el desenlace de lo
 *   último que no se confirmó. La lista no trae nada de eso: se lee después de la lista, de a tres y hasta veinte, para
 *   decir en cada renglón si la persona corrigió su respuesta o si lo cargado espera confirmación.
 * - **El detalle se abre al costado,** sin tapar la lista; en una ventana angosta, encima. La solicitud abierta y la
 *   vista elegida viven en la dirección (`solicitud=`, `ver=`): «Actualizar» las conserva.
 * - **Lo que declaró va por pregunta pedida, con la respuesta que rige** —la elige el dominio (`loDeclarado`), por la
 *   relación que da la API, nunca por la fecha—, y «Declarado por la persona» se dice una vez. Si lo cargó un
 *   profesional y la persona lo confirmó, la procedencia lo dice con sus dos actos y fechas (D-4), y cada respuesta que
 *   corrigió antes de confirmar lo dice. La original se conserva: está en la historia, con lo que respondió en cada
 *   versión a un clic.
 * - **Mientras lo cargado espera** (D-3), la solicitud sigue pendiente: el profesional que lo cargó lo ve, lo puede
 *   editar o retirar (con confirmación en la página), y nadie más lo ve hasta que la persona confirme. Si al retirar la
 *   API dice que eso ya cambió (409: la persona confirmó o rechazó en el medio), se dice y se vuelve a leer la solicitud
 *   y la lista: lo que queda en pantalla es lo que hay, no lo que había.
 * - El texto de cada pregunta sale de la versión del formulario de la solicitud (API-FRI-01, una vez por versión). La
 *   pantalla nunca muestra el código de una pregunta: si esa lectura falla, lo dice.
 * - FI-07: en la respuesta de «Cómo comés hoy», las comidas que contó la persona van en una tabla para decidir con ella.
 *
 * Cada lectura pasa por el PDP, sin caché (08 §27.3): una solicitud que dejó de ser revelable deja de listarse, y su
 * detalle responde el mismo 404 neutral que lo inexistente (10-B10:407).
 */
import {
  camposEnOrden,
  COPY,
  COPY_FORMULARIOS as F,
  COPY_FORMULARIOS_V2 as V,
  COPY_SOLICITUDES as C,
  COPY_VINCULO,
  contarLasVistasDeSolicitudes,
  ETIQUETA_DE_ALCANCE,
  solicitudEnLaVista,
  todasLasPaginas,
  VISTAS_DE_SOLICITUDES,
  type DetalleDeSolicitudV2,
  type SolicitudDeFormulario,
  type VersionDeLaRespuesta,
  type VersionDePlantillaV2,
  type VistaDeSolicitudes as Vista,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { EstadoVacio } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { Panel } from '../../../../components/panel';
import { BotonDeVista } from '../../../../components/vista-con-nombre';
import { api, type Resultado } from '../../../../lib/api';
import { dia, diaSinElAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso } from '../marco-del-area';
import { useDetalleAlCostado } from '../seguimiento/al-costado';
import { campoDeComidas, CLAVE_DE_NUTRICION_INICIO, comidasDeclaradas } from './comidas-declaradas';
import { ComidasParaDecidir } from './comidas-para-decidir';
import { lineasDeValor, porSeccion } from './formulario-de-inicio';
import { EstadoDeLectura, useFormularios } from './formularios';
import { loDeclaradoV2 } from './lo-declarado-v2';

/** De cuántas solicitudes se lee el detalle para decir en la lista si la persona corrigió, o si lo cargado espera confirmación. */
const SOLICITUDES_CON_DETALLE = 20;
/** Cuántos detalles se piden a la vez: cada uno es una lectura protegida, y cuenta para el cupo del profesional. */
const DETALLES_A_LA_VEZ = 3;

const PARAMETRO_DE_LA_VISTA: Readonly<Record<Vista, string | null>> = { TODAS: null, SIN_RESPONDER: 'sin-responder', RESPONDIDAS: 'respondidas' };
const vistaDe = (valor: string | null): Vista => VISTAS_DE_SOLICITUDES.find((v) => PARAMETRO_DE_LA_VISTA[v] === valor) ?? 'TODAS';

/** Los textos propios de lo cargado con la persona en esta pantalla (los que comparte con la APK están en `COPY_FORMULARIOS_V2`). */
const T = {
  loQueCargaste: 'Lo que cargaste',
  noQuedaHastaConfirmar: 'Hasta que lo confirme, no queda en su perfil y no lo ve nadie más. Puede corregir cualquier respuesta antes de confirmar, o decir que no es correcto.',
  editarLoCargado: 'Editar lo cargado',
  siRetirar: 'Sí, retirar',
  retirando: 'Retirando…',
  volver: 'Volver',
  corregidaAntesDeConfirmar: 'Corregida antes de confirmar',
  cambioMientrasRetirabas: 'Lo cargado cambió desde que abriste esta solicitud: la persona pudo confirmarlo o decir que no es correcto, o se editó desde otro lugar. Volvimos a leer la solicitud: lo que ves ahora es lo que hay.',
  volvimosALeer: 'Volvimos a leer la solicitud.',
} as const;

type Lista = { readonly solicitudes: readonly SolicitudDeFormulario[]; readonly completa: boolean };
/** El detalle V2 de una solicitud (API-FRI-03): la respuesta, lo cargado que espera confirmación y el desenlace de lo que no se confirmó. */
type Detalle = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly detalle: DetalleDeSolicitudV2 } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'fallo' };
/** La versión del formulario de una solicitud, en formato V2: de ahí salen el texto de cada pregunta y sus opciones. */
type Formulario = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly version: VersionDePlantillaV2 } | { readonly tipo: 'fallo' };

const hora = (iso: string): string => horaDelDia(new Date(iso));
const mismoDia = (a: string, b: string): boolean => dia(a) === dia(b);

export function VistaDeSolicitudes() {
  const { token, asesoradoId, sesionPerdida, parametros, ir } = useFormularios();
  const id = useId();
  const [lista, setLista] = useState<Resultado<Lista> | null>(null);
  const [detalles, setDetalles] = useState<ReadonlyMap<string, Detalle>>(() => new Map());
  const [formularios, setFormularios] = useState<ReadonlyMap<string, Formulario>>(() => new Map());
  /** Lo que ya se pidió: ningún detalle ni ningún formulario se pide dos veces por abrir otra solicitud. */
  const detallesPedidos = useRef(new Set<string>());
  const formulariosPedidos = useRef(new Set<string>());

  /** Lee la lista. En silencio (tras un cambio que pudo mover el estado de una solicitud), la que había sigue a la vista y, si la relectura falla, se queda. */
  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLista(null);
      const r = await todasLasPaginas((f) => api.listarSolicitudesDeFormulario(token, asesoradoId, f));
      if (sesionPerdida(r)) return;
      if (!r.ok && silencioso) return;
      setLista(r.ok ? { ok: true, datos: { solicitudes: r.datos.data, completa: r.datos.completa } } : (r as Resultado<never>));
    },
    [token, asesoradoId, sesionPerdida],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const leerDetalle = useCallback(
    async (solicitudId: string) => {
      setDetalles((m) => (m.get(solicitudId)?.tipo === 'listo' ? m : new Map(m).set(solicitudId, { tipo: 'cargando' })));
      const r = await api.consultarVistaDeSolicitud(token, solicitudId);
      if (sesionPerdida(r)) return;
      // El 404 es neutral: no existe, o dejó de estar autorizada. No se distingue, como en toda la API.
      const noDisponible = !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';
      setDetalles((m) => new Map(m).set(solicitudId, r.ok ? { tipo: 'listo', detalle: r.datos.data } : { tipo: noDisponible ? 'no-disponible' : 'fallo' }));
    },
    [token, sesionPerdida],
  );
  const pedirDetalle = useCallback(
    (solicitudId: string) => {
      if (detallesPedidos.current.has(solicitudId)) return Promise.resolve();
      detallesPedidos.current.add(solicitudId);
      return leerDetalle(solicitudId);
    },
    [leerDetalle],
  );
  const leerFormulario = useCallback(
    async (s: Pick<SolicitudDeFormulario, 'templateId' | 'templateVersionId'>) => {
      setFormularios((m) => new Map(m).set(s.templateVersionId, { tipo: 'cargando' }));
      const r = await api.consultarDefinicionDePlantilla(token, s.templateId, s.templateVersionId);
      if (sesionPerdida(r)) return;
      setFormularios((m) => new Map(m).set(s.templateVersionId, r.ok ? { tipo: 'listo', version: r.datos.data } : { tipo: 'fallo' }));
    },
    [token, sesionPerdida],
  );

  const solicitudes = lista?.ok ? lista.datos.solicitudes : null;
  const abiertaId = parametros.get('solicitud');
  const abierta = useMemo(() => solicitudes?.find((s) => s.formRequestId === abiertaId) ?? null, [solicitudes, abiertaId]);

  // El detalle de la solicitud abierta se lee primero. Los de las demás, después y de a pocos, para decir en la lista
  // cuál se corrigió y cuál tiene algo cargado que espera confirmación.
  useEffect(() => {
    if (!solicitudes) return;
    let vivo = true;
    void (async () => {
      if (abierta) await pedirDetalle(abierta.formRequestId);
      const cola = solicitudes
        .slice(0, SOLICITUDES_CON_DETALLE)
        .map((s) => s.formRequestId)
        .filter((x) => !detallesPedidos.current.has(x));
      while (vivo && cola.length > 0) await Promise.all(cola.splice(0, DETALLES_A_LA_VEZ).map(pedirDetalle));
    })();
    return () => {
      vivo = false;
    };
  }, [solicitudes, abierta, pedirDetalle]);

  // El formulario de la solicitud abierta, una vez por versión.
  useEffect(() => {
    if (!abierta || formulariosPedidos.current.has(abierta.templateVersionId)) return;
    formulariosPedidos.current.add(abierta.templateVersionId);
    void leerFormulario(abierta);
  }, [abierta, leerFormulario]);

  // El detalle: al costado si la ventana lo deja; si no, encima.
  const alCostado = useDetalleAlCostado();
  const raiz = useRef<HTMLDivElement>(null);
  const detalle = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const idDeLaAbierta = abierta?.formRequestId ?? null;
  // Al abrir el detalle al costado, el foco va a su título: con el teclado, el detalle está después de toda la lista.
  useEffect(() => {
    if (idDeLaAbierta !== null && alCostado) titulo.current?.focus({ preventScroll: true });
  }, [idDeLaAbierta, alCostado]);
  /** Cierra el detalle. Si el foco estaba adentro, vuelve al renglón de esa solicitud. */
  const cerrar = useCallback(
    (devolverElFoco: boolean) => {
      const anterior = idDeLaAbierta;
      ir({ solicitud: null });
      if (anterior === null || !devolverElFoco) return;
      // La dirección cambia en el próximo dibujo: el foco se devuelve después.
      requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>(`[data-solicitud="${CSS.escape(anterior)}"]`)?.focus({ preventScroll: true }));
    },
    [idDeLaAbierta, ir],
  );
  const conDetalleAlCostado = abierta !== null && alCostado;
  useEffect(() => {
    if (!conDetalleAlCostado) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !(e.target instanceof Node) || !raiz.current?.contains(e.target)) return;
      cerrar(detalle.current?.contains(e.target) ?? false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [conDetalleAlCostado, cerrar]);

  const vista = vistaDe(parametros.get('ver'));
  const cuentas = useMemo(() => contarLasVistasDeSolicitudes(solicitudes ?? []), [solicitudes]);
  const aLaVista = useMemo(() => (solicitudes ?? []).filter((s) => solicitudEnLaVista(s, vista)), [solicitudes, vista]);
  const completa = lista?.ok ? lista.datos.completa : true;
  const corrigio = (s: SolicitudDeFormulario): boolean => {
    const d = detalles.get(s.formRequestId);
    return d?.tipo === 'listo' && (d.detalle.response?.rectifications.length ?? 0) > 0;
  };
  /** Lo cargado por este profesional espera que la persona lo confirme (D-3): solo él lo ve en el detalle. */
  const enEspera = (s: SolicitudDeFormulario): boolean => {
    const d = detalles.get(s.formRequestId);
    return s.status === 'PENDING' && d?.tipo === 'listo' && d.detalle.proposal !== null;
  };
  const contenidoDeLaAbierta = abierta ? (
    <DetalleDeSolicitud
      key={abierta.formRequestId}
      solicitud={abierta}
      detalle={detalles.get(abierta.formRequestId)}
      formulario={formularios.get(abierta.templateVersionId)}
      onReleerElDetalle={(opciones) => {
        void leerDetalle(abierta.formRequestId);
        // Si la persona confirmó en el medio, la solicitud dejó de estar pendiente: el estado y las cuentas salen de la lista.
        if (opciones?.conLaLista) void cargar(true);
      }}
      onReintentarElFormulario={() => void leerFormulario(abierta)}
    />
  ) : null;
  // El pedido es un cajón que se abre sobre esta sección (`vista=pedir`): «atrás», en el navegador, lo cierra.
  const pedidoAbierto = parametros.get('vista') === 'pedir';
  const pedir = (
    <button type="button" className="boton boton--primario" onClick={() => ir({ vista: 'pedir' }, { agregarAlHistorial: true })}>
      <Icono nombre="solicitar" tamano={18} />
      {F.pedirInformacion}
    </button>
  );

  return (
    <section className="registros solicitudes-del-area" aria-labelledby="titulo-solicitudes">
      <div className="registros__encabezado">
        <h2 id="titulo-solicitudes">{F.solicitudes}</h2>
        <p className="nota registros__bajada">{C.bajada}</p>
        {/* Sin ninguna solicitud, «Pedir información» va dentro del estado vacío, que es donde se mira (crítica de diseño,
            2026-10-15): uno solo, nunca dos. */}
        {solicitudes?.length === 0 ? null : <div className="solicitudes-del-area__pedir">{pedir}</div>}
      </div>

      <EstadoDeLectura r={lista} onReintentar={() => void cargar()}>
        {solicitudes ? (
          solicitudes.length === 0 ? (
            <EstadoVacio titulo={F.sinSolicitudes} icono="solicitar" accion={pedir} />
          ) : (
            <>
              <div className="vistas-de-la-linea registros__vistas">
                <div className="vistas-de-la-linea__vistas" role="group" aria-labelledby={`${id}-ver`}>
                  <span id={`${id}-ver`} className="vistas-de-la-linea__rotulo">
                    {C.ver}
                  </span>
                  {VISTAS_DE_SOLICITUDES.map((v) => (
                    <BotonDeVista
                      key={v}
                      clave={v}
                      nombre={C.vista[v]}
                      elegida={vista === v}
                      cuenta={cuentas[v]}
                      alMenos={!completa}
                      unidad={C.unidadDeLaVista}
                      // Elegir una vista reemplaza a la que estaba; volver a tocarla deja «Todas». No le pide nada a la API.
                      onElegir={() => ir({ ver: vista === v ? null : PARAMETRO_DE_LA_VISTA[v], solicitud: null }, { agregarAlHistorial: true })}
                    />
                  ))}
                </div>
              </div>
              {!completa ? <p className="nota">{C.lecturaIncompleta}</p> : null}

              {aLaVista.length === 0 ? (
                <EstadoVacio
                  titulo={C.ningunaCoincide}
                  accion={
                    <button type="button" className="boton boton--secundario" onClick={() => ir({ ver: null }, { agregarAlHistorial: true })}>
                      {C.verTodas}
                    </button>
                  }
                />
              ) : (
                <div ref={raiz} className="linea__cuerpo solicitudes__cuerpo" data-con-detalle={conDetalleAlCostado ? 'si' : undefined}>
                  <div className="solicitudes__lista">
                    <ol className="lista-de-solicitudes">
                      {aLaVista.map((s) => (
                        <li key={s.formRequestId}>
                          {/* El renglón entero abre la solicitud. */}
                          <button type="button" className="solicitud-de-la-lista" data-solicitud={s.formRequestId} aria-current={s.formRequestId === idDeLaAbierta ? 'true' : undefined} onClick={() => ir({ solicitud: s.formRequestId })}>
                            <span className="solicitud-de-la-lista__cabecera">
                              <span className="solicitud-de-la-lista__nombre">{s.templateName}</span>
                              <Estado solicitud={s} enEspera={enEspera(s)} />
                            </span>
                            <span className="solicitud-de-la-lista__datos">
                              <EnPartes texto={[`${F.pedidoEl} ${diaSinElAnioEnCurso(s.createdAt)}`, ETIQUETA_DE_ALCANCE[s.scope], C.preguntas(s.requestedFieldCodes.length), ...(corrigio(s) ? [C.corrigioSuRespuesta] : [])].join(' · ')} />
                            </span>
                            <span className="solicitud-de-la-lista__para-que">
                              {C.paraQue}: «{s.purpose}»
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                    <p className="nota solicitudes__al-pie">{C.alPie}</p>
                  </div>
                  {abierta && alCostado ? (
                    <aside ref={detalle} className="detalle-del-hecho detalle-de-solicitud" aria-labelledby={`${id}-detalle`}>
                      <div className="detalle-del-hecho__cabecera">
                        <p className="detalle-del-hecho__rotulo">{C.detalle}</p>
                        <button type="button" className="boton boton--enlace" onClick={() => cerrar(true)}>
                          <Icono nombre="cerrar" tamano={18} />
                          Cerrar
                        </button>
                      </div>
                      <h3 id={`${id}-detalle`} ref={titulo} tabIndex={-1} className="detalle-de-solicitud__titulo">
                        {abierta.templateName} <Estado solicitud={abierta} enEspera={enEspera(abierta)} />
                      </h3>
                      {contenidoDeLaAbierta}
                    </aside>
                  ) : null}
                </div>
              )}

              {/* Pedida por la dirección y ya no está en la lista: se dice, sin tapar la lista. */}
              {abiertaId && !abierta ? (
                <Aviso tipo="info">
                  <p>
                    {C.detalleNoDisponible}{' '}
                    <button type="button" className="boton boton--enlace" onClick={() => ir({ solicitud: null })}>
                      {C.verTodas}
                    </button>
                  </p>
                </Aviso>
              ) : null}

              {/* En una ventana angosta el detalle no entra al costado: se abre encima, en un panel que retiene el foco.
                  Con el pedido abierto espera: dos diálogos encima a la vez no se pueden recorrer. */}
              <Panel abierto={abierta !== null && !alCostado && !pedidoAbierto} titulo={abierta?.templateName ?? ''} onCerrar={() => ir({ solicitud: null })}>
                {abierta && !alCostado ? (
                  <>
                    <p className="detalle-de-solicitud__estado">
                      <Estado solicitud={abierta} enEspera={enEspera(abierta)} />
                    </p>
                    {contenidoDeLaAbierta}
                  </>
                ) : null}
              </Panel>
            </>
          )
        ) : null}
      </EstadoDeLectura>
    </section>
  );
}

/**
 * El estado de una solicitud, con palabras. «Sin responder» lleva su ícono: es un hecho, no una alarma, y no lleva
 * color. Si lo cargado por el profesional espera que la persona lo confirme, lo dice: la solicitud sigue pendiente.
 */
function Estado({ solicitud, enEspera = false }: { solicitud: Pick<SolicitudDeFormulario, 'status'>; enEspera?: boolean }) {
  const pendiente = solicitud.status === 'PENDING';
  return (
    <span className="etiqueta-de-dato" data-estado={pendiente && enEspera ? 'EN_ESPERA' : solicitud.status}>
      {pendiente ? <Icono nombre="reloj" tamano={15} /> : null}
      {pendiente ? (enEspera ? V.web.esperando : F.pendiente) : F.respondida}
    </span>
  );
}

type Retiro = { readonly tipo: 'no' } | { readonly tipo: 'confirmando'; readonly error: string | null } | { readonly tipo: 'enviando' };

/**
 * Una solicitud abierta: cuándo y para qué se pidió, cuándo respondió la persona, lo que declaró por pregunta pedida —con
 * la respuesta que rige—, la historia de la respuesta y, mientras está pendiente, lo cargado con la persona.
 */
function DetalleDeSolicitud({
  solicitud,
  detalle,
  formulario,
  onReleerElDetalle,
  onReintentarElFormulario,
}: {
  solicitud: SolicitudDeFormulario;
  detalle: Detalle | undefined;
  formulario: Formulario | undefined;
  /** Vuelve a leer el detalle: después de una falla, y después de retirar lo cargado. Con `conLaLista`, también la lista (el estado de la solicitud pudo cambiar). */
  onReleerElDetalle: (opciones?: { readonly conLaLista?: boolean }) => void;
  onReintentarElFormulario: () => void;
}) {
  const { token, asesoradoId, sesionPerdida, avisar, ir, yoId } = useFormularios();
  const avisarSinAcceso = useAvisarSinAcceso();
  const intento = useClaveDeIntento();
  const id = useId();
  const vista = detalle?.tipo === 'listo' ? detalle.detalle : null;
  const version = formulario?.tipo === 'listo' ? formulario.version : null;
  const declarado = useMemo(() => (vista ? loDeclaradoV2(solicitud, vista.response, version) : null), [solicitud, vista, version]);
  const campos = useMemo(() => new Map(camposEnOrden(version?.sections ?? []).map((c) => [c.fieldCode, c] as const)), [version]);
  const leyendoElFormulario = !formulario || formulario.tipo === 'cargando';
  const pregunta = (texto: string | null): ReactNode => texto ?? (leyendoElFormulario ? '…' : C.preguntaSinLeer);
  /**
   * Una pregunta pedida: su texto y, si se marcó así, «Requerida», que sigue a la última palabra. No ocupa un renglón
   * propio si entra al lado: con preguntas de dos renglones, cada fila medía uno más.
   */
  const preguntaPedida = (f: { readonly pregunta: string | null; readonly requerida: boolean }): ReactNode => (
    <>
      {pregunta(f.pregunta)}
      {f.requerida ? (
        <>
          {' '}
          <span className="etiqueta-de-dato">{C.requerida}</span>
        </>
      ) : null}
    </>
  );
  /** Las preguntas pedidas, cuando no hay una respuesta que rija para mostrar al lado. */
  const soloPreguntas = declarado ? (
    <ul className="preguntas-pedidas">
      {declarado.filas.map((f) => (
        <li key={f.codigo} data-pregunta={f.codigo}>
          {preguntaPedida(f)}
        </li>
      ))}
    </ul>
  ) : null;
  /** Un valor en renglones: una lista o una tabla van por ítem; lo demás, en una línea. */
  const enRenglones = (lineas: readonly string[]): ReactNode =>
    lineas.length > 1 ? (
      <ul className="lo-declarado__lineas">
        {lineas.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    ) : (
      <span className="lo-declarado__valor">{lineas[0] ?? ''}</span>
    );
  /** El valor que rige de una pregunta, en renglones; sin la versión, el texto que ya calculó el dominio. */
  const valorQueRige = (codigo: string, texto: string): ReactNode => {
    const cruda = declarado?.queRige?.find((a) => a.fieldCode === codigo);
    return enRenglones(cruda ? lineasDeValor(campos.get(codigo), cruda.answer) : [texto]);
  };

  // Lo cargado con la persona (D-3): solo lo ve quien lo cargó, y solo él puede cargar: el profesional de la solicitud.
  const esMia = solicitud.professional.identityId === yoId;
  const propuesta = vista?.proposal ?? null;
  const desenlace = vista?.lastProposalOutcome ?? null;
  const [retiro, setRetiro] = useState<Retiro>({ tipo: 'no' });
  /** Un retiro que no pudo ser porque lo que se veía ya era viejo: se dice afuera del bloque, que la relectura va a cambiar. */
  const [avisoDelRetiro, setAvisoDelRetiro] = useState<{ readonly tipo: 'info' | 'error'; readonly texto: string } | null>(null);
  const preguntaDeRetiro = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (retiro.tipo === 'confirmando') preguntaDeRetiro.current?.focus();
  }, [retiro.tipo]);
  async function retirar() {
    if (!propuesta) return;
    setRetiro({ tipo: 'enviando' });
    const r = await api.retirarPropuestaDeRespuesta(token, solicitud.formRequestId, { expectedVersion: propuesta.version }, intento.actual());
    intento.registrar(r);
    if (sesionPerdida(r)) return setRetiro({ tipo: 'confirmando', error: null });
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') avisarSinAcceso();
      // Un resultado incierto se reintenta desde acá, con la misma clave: lo que se ve sigue valiendo.
      if (esIncierto(r)) return setRetiro({ tipo: 'confirmando', error: mensajeDeFallo(r, COPY_VINCULO.recursoNoDisponible) });
      // Un rechazo cierto —el 409 porque la persona confirmó o rechazó en el medio, o lo cargado se editó desde otro
      // lugar— deja viejo el bloque «Lo que cargaste»: se cierra la confirmación, se dice qué pasó y se vuelve a leer la
      // solicitud (la lista también: pudo dejar de estar pendiente). Con el detalle releído, el bloque pasa solo a «Lo que
      // declaró» o a las preguntas pedidas con el desenlace.
      const conflicto = r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT';
      setRetiro({ tipo: 'no' });
      setAvisoDelRetiro(conflicto ? { tipo: 'info', texto: T.cambioMientrasRetirabas } : { tipo: 'error', texto: `${mensajeDeFallo(r, COPY_VINCULO.recursoNoDisponible)} ${T.volvimosALeer}` });
      return onReleerElDetalle({ conLaLista: true });
    }
    setRetiro({ tipo: 'no' });
    setAvisoDelRetiro(null);
    avisar(V.web.retirado(diaSinElAnioEnCurso(r.datos.data.resolvedAt)));
    onReleerElDetalle();
  }

  // FI-07: las comidas que contó la persona en «Cómo comés hoy», en su versión que rige.
  const comidas = useMemo(() => {
    if (!version || version.key !== CLAVE_DE_NUTRICION_INICIO || !declarado?.queRige) return [];
    const campo = campoDeComidas(version.sections);
    return campo ? comidasDeclaradas(campo, declarado.queRige.find((a) => a.fieldCode === campo.fieldCode)?.answer) : [];
  }, [version, declarado]);

  return (
    <div className="solicitud-abierta" data-solicitud={solicitud.formRequestId}>
      <dl className="solicitud-abierta__datos">
        <div>
          <dt>{C.loPediste}</dt>
          <dd>
            El {dia(solicitud.createdAt)} a las {hora(solicitud.createdAt)}, {C.enElArea} {ETIQUETA_DE_ALCANCE[solicitud.scope]}
          </dd>
        </div>
        <div>
          <dt>{C.paraQue}</dt>
          <dd>«{solicitud.purpose}»</dd>
        </div>
        {declarado?.respondioEl ? (
          <div>
            <dt>{C.respondio}</dt>
            <dd>
              El {diaSinElAnioEnCurso(declarado.respondioEl)} a las {hora(declarado.respondioEl)}
              {declarado.corrigioEl ? ` ${C.yLoCorrigio} ${mismoDia(declarado.respondioEl, declarado.corrigioEl) ? '' : `el ${diaSinElAnioEnCurso(declarado.corrigioEl)} `}a las ${hora(declarado.corrigioEl)}` : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      {!detalle || detalle.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          {C.leyendoLaRespuesta}
        </p>
      ) : null}
      {detalle?.tipo === 'no-disponible' ? (
        <Aviso tipo="info">
          <p>{C.detalleNoDisponible}</p>
        </Aviso>
      ) : null}
      {/* Una falla de esta lectura no es «todavía sin responder». */}
      {detalle?.tipo === 'fallo' ? (
        <Aviso tipo="error">
          <p>
            {C.detalleNoCargo}{' '}
            <button type="button" className="boton boton--enlace" onClick={() => onReleerElDetalle()}>
              {COPY.reintentar}
            </button>
          </p>
        </Aviso>
      ) : null}
      {formulario?.tipo === 'fallo' ? (
        <Aviso tipo="error">
          <p>
            {C.preguntasNoCargaron}{' '}
            <button type="button" className="boton boton--enlace" onClick={onReintentarElFormulario}>
              {COPY.reintentar}
            </button>
          </p>
        </Aviso>
      ) : null}
      {avisoDelRetiro ? (
        <Aviso tipo={avisoDelRetiro.tipo} enfocar>
          <p data-retiro-no-hecho>{avisoDelRetiro.texto}</p>
        </Aviso>
      ) : null}

      {declarado?.estado === 'SIN_RESPONDER' && propuesta ? (
        // Lo cargado espera que la persona lo confirme (D-3): se muestra, se edita y se retira desde acá.
        <section className="solicitud-abierta__bloque propuesta-en-espera" aria-labelledby={`${id}-cargado`} data-propuesta={propuesta.proposalId}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-cargado`}>{T.loQueCargaste}</h4>
            <span className="etiqueta-de-dato" data-estado="EN_ESPERA">
              <Icono nombre="reloj" tamano={15} />
              {V.web.esperando}
            </span>
          </div>
          <p className="nota">{V.web.cargadoPorVos(diaSinElAnioEnCurso(propuesta.loadedAt))}</p>
          <p className="nota">{T.noQuedaHastaConfirmar}</p>
          {/* Por sección del formulario, como se cargó; sin la versión leída, todo seguido. */}
          {porSeccion(version?.sections ?? null, propuesta.answers.map((a) => a.fieldCode)).map((g) => (
            <div key={g.clave} className="lo-declarado__seccion" data-seccion={g.clave}>
              {g.titulo ? <h5 className="lo-declarado__titulo-de-seccion">{g.titulo}</h5> : null}
              <dl className="lo-declarado lo-cargado">
                {g.codigos.map((codigo) => {
                  const a = propuesta.answers.find((x) => x.fieldCode === codigo);
                  return a ? (
                    <div key={a.fieldCode} className="lo-declarado__fila" data-pregunta={a.fieldCode}>
                      <dt>{pregunta(campos.get(a.fieldCode)?.label ?? null)}</dt>
                      <dd>{enRenglones(lineasDeValor(campos.get(a.fieldCode), a.answer))}</dd>
                    </div>
                  ) : null;
                })}
              </dl>
            </div>
          ))}
          {retiro.tipo === 'no' ? (
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => ir({ vista: 'cargar' }, { agregarAlHistorial: true })}>
                <Icono nombre="borrador" tamano={18} />
                {T.editarLoCargado}
              </button>
              <button
                type="button"
                className="boton boton--peligro-secundario"
                onClick={() => {
                  setAvisoDelRetiro(null);
                  setRetiro({ tipo: 'confirmando', error: null });
                }}
              >
                <Icono nombre="deshacer" tamano={18} />
                {V.web.retirar}
              </button>
            </div>
          ) : (
            // La confirmación va en la página, en el lugar de la acción: no abre un diálogo sobre el panel del detalle.
            <div className="confirmacion-en-linea" role="group" aria-labelledby={`${id}-retirar`}>
              <p id={`${id}-retirar`} ref={preguntaDeRetiro} tabIndex={-1}>
                {V.web.retirarPregunta}
              </p>
              {retiro.tipo === 'confirmando' && retiro.error ? (
                <Aviso tipo="error">
                  <p>{retiro.error}</p>
                </Aviso>
              ) : null}
              <div className="acciones">
                <button type="button" className="boton boton--peligro" onClick={() => void retirar()} disabled={retiro.tipo === 'enviando'} aria-busy={retiro.tipo === 'enviando'}>
                  {retiro.tipo === 'enviando' ? T.retirando : T.siRetirar}
                </button>
                <button type="button" className="boton boton--secundario" onClick={() => setRetiro({ tipo: 'no' })} disabled={retiro.tipo === 'enviando'}>
                  {T.volver}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {declarado?.estado === 'SIN_RESPONDER' && !propuesta ? (
        <section className="solicitud-abierta__bloque" aria-labelledby={`${id}-pedido`}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-pedido`}>{C.preguntasPedidas}</h4>
          </div>
          {soloPreguntas}
          <p className="nota solicitud-abierta__sin-responder">{F.sinRespuestaTodavia}</p>
          {/* Lo último que se cargó y no se confirmó (D-6): queda solo cuándo y cómo terminó, para quien lo cargó. */}
          {desenlace ? (
            <p className="nota" data-desenlace={desenlace.outcome}>
              {desenlace.outcome === 'REJECTED' ? V.web.noConfirmado(diaSinElAnioEnCurso(desenlace.resolvedAt)) : V.web.retirado(diaSinElAnioEnCurso(desenlace.resolvedAt))}
            </p>
          ) : null}
          {esMia ? (
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => ir({ vista: 'cargar' }, { agregarAlHistorial: true })} data-cargar>
                <Icono nombre="persona" tamano={18} />
                {V.web.cargar}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {declarado && declarado.estado !== 'SIN_RESPONDER' ? (
        <section className="solicitud-abierta__bloque" aria-labelledby={`${id}-declarado`}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-declarado`}>{C.loQueDeclaro}</h4>
            {/* La procedencia se dice una vez, para todas las respuestas: cada una es declarada por la persona. Si la
                transcribió un profesional, se dicen los dos actos con sus fechas (D-4). */}
            <span className="etiqueta-de-dato" data-procedencia={declarado.transcripcion ? 'transcripcion' : undefined}>
              <Icono nombre="reportado" tamano={15} />
              {F.declaradoPorLaPersona}
            </span>
            {declarado.transcripcion ? (
              <p className="nota lo-declarado__transcripcion" data-transcripcion>
                {V.web.transcripcion(declarado.transcripcion.professional.displayName, diaSinElAnioEnCurso(declarado.transcripcion.loadedAt), diaSinElAnioEnCurso(declarado.transcripcion.confirmedAt))} · {V.web.corregidas(declarado.transcripcion.correctedFieldCodes.length)}
              </p>
            ) : null}
            <p className="nota">{C.noEsMedicionNiDiagnostico}</p>
          </div>
          {declarado.estado === 'SIN_RESOLVER' ? (
            <>
              <Aviso tipo="info">
                <p>{C.noSePuedeDecirCualRige}</p>
              </Aviso>
              {soloPreguntas}
            </>
          ) : (
            <>
              {/* Los nombres de las columnas, una vez. Cada fila es una pregunta con su respuesta: se lee igual sin ellos. */}
              <div className="lo-declarado__columnas" aria-hidden="true">
                <span>{C.pregunta}</span>
                <span>{C.respuestaQueRige}</span>
              </div>
              {/* Por sección del formulario, como lo respondió la persona; sin la versión leída, todas seguidas. */}
              {porSeccion(version?.sections ?? null, declarado.filas.map((f) => f.codigo)).map((g) => (
                <div key={g.clave} className="lo-declarado__seccion" data-seccion={g.clave}>
                  {g.titulo ? <h5 className="lo-declarado__titulo-de-seccion">{g.titulo}</h5> : null}
                  <dl className="lo-declarado">
                    {g.codigos.map((codigo) => {
                      const f = declarado.filas.find((x) => x.codigo === codigo);
                      return f ? (
                        <div key={f.codigo} className="lo-declarado__fila" data-pregunta={f.codigo}>
                          <dt>{preguntaPedida(f)}</dt>
                          <dd>
                            {/* Una pregunta sin responder es un hueco: se dice, no se muestra vacía. */}
                            {f.valor !== null ? valorQueRige(f.codigo, f.valor) : <span className="lo-declarado__sin-responder">{C.sinResponder}</span>}
                            {f.corregida ? (
                              <span className="etiqueta-de-dato">
                                <Icono nombre="corregido" tamano={15} />
                                {C.corregida}
                              </span>
                            ) : null}
                            {declarado.corregidasAntesDeConfirmar.has(f.codigo) ? (
                              <span className="etiqueta-de-dato" data-corregida-antes-de-confirmar>
                                <Icono nombre="corregido" tamano={15} />
                                {T.corregidaAntesDeConfirmar}
                              </span>
                            ) : null}
                            {f.antes ? (
                              <span className="nota lo-declarado__antes">
                                {C.antes}: {f.antes.tipo === 'VALOR' ? `«${f.antes.texto}»` : `${C.antesSinResponder}.`}
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      ) : null;
                    })}
                  </dl>
                </div>
              ))}
            </>
          )}
        </section>
      ) : null}

      {comidas.length > 0 ? <ComidasParaDecidir comidas={comidas} asesoradoId={asesoradoId} /> : null}

      {declarado && declarado.historia.length > 0 ? (
        <section className="solicitud-abierta__bloque" aria-labelledby={`${id}-historia`}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-historia`}>{C.historia}</h4>
            <p className="nota">{C.laOriginalSeConserva}</p>
          </div>
          <ol className="historia-de-medicion historia-de-respuesta">
            {declarado.historia.map((v) => (
              <Version key={v.id} version={v} pedidas={declarado.pedidas} pregunta={pregunta} />
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

/** Una versión de la respuesta: cuándo quedó registrada, si rige, el motivo de la corrección y, a un clic, lo que respondió. */
function Version({ version: v, pedidas, pregunta }: { version: VersionDeLaRespuesta; pedidas: number; pregunta: (texto: string | null) => ReactNode }) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  return (
    <li className="historia-de-medicion__evento" data-version={v.tipo} data-rige={v.rige ? 'si' : undefined}>
      <span className="historia-de-medicion__cuando">
        {diaSinElAnioEnCurso(v.cuando)}, {hora(v.cuando)}
      </span>
      <div className="historia-de-medicion__que">
        <p className="historia-de-medicion__titulo">
          {v.tipo === 'CORRECCION' ? F.correccion : F.respuestaOriginal}
          {v.rige ? (
            <>
              {' '}
              <span className="etiqueta-de-dato">{F.vigente}</span>
            </>
          ) : null}
        </p>
        {v.motivo !== null ? (
          <p className="nota">
            {C.motivoQueEscribio}: «{v.motivo}»
          </p>
        ) : null}
        <p className="nota historia-de-respuesta__cuenta">{C.respondioDe(v.respondidas, pedidas)}</p>
        <button type="button" className="boton boton--enlace" aria-expanded={abierta} aria-controls={`${id}-respuestas`} onClick={() => setAbierta(!abierta)}>
          {abierta ? C.ocultarLoRespondido : C.verLoRespondido}
        </button>
        {abierta ? (
          <dl className="datos historia-de-respuesta__respuestas" id={`${id}-respuestas`}>
            {v.respuestas.map((r) => (
              <div key={r.codigo}>
                <dt>{pregunta(r.pregunta)}</dt>
                <dd>{r.valor}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </li>
  );
}
