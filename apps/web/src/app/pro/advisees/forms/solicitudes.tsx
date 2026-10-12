'use client';

/**
 * «Solicitudes» (WP-07; RF-071; API-FRM-02, 04 y 05; WP-ESCRITORIO-AREAS, parte 4; maqueta 26): lo que el profesional le
 * pidió a esta persona y lo que ella declaró. Pedir no concede nada, lo respondido es **declarado por la persona** —no
 * una medición ni un diagnóstico (09 §22.7)—, y una solicitud sin responder no es una falta: se muestra como lo que es.
 *
 * - **La lista se lee entera, una vez,** en el orden de la API (la más nueva primero). Las vistas con nombre cuentan
 *   solicitudes por su estado, sobre esa lista: elegir una no le pide nada a la API.
 * - **La lista no trae si la persona corrigió su respuesta:** sale del detalle de cada solicitud respondida, que se lee
 *   después de la lista, de a tres y hasta veinte. Por eso abrir una solicitud respondida no vuelve a leer nada.
 * - **El detalle se abre al costado,** sin tapar la lista; en una ventana angosta, encima. La solicitud abierta y la
 *   vista elegida viven en la dirección (`solicitud=`, `ver=`): «Actualizar» las conserva.
 * - **Lo que declaró va por pregunta pedida, con la respuesta que rige** —la elige el dominio (`loDeclarado`), por la
 *   relación que da la API, nunca por la fecha—, y «Declarado por la persona» se dice una vez. La original se conserva:
 *   está en la historia, con lo que respondió en cada versión a un clic.
 * - El texto de cada pregunta sale de la versión del formulario de la solicitud (API-FRM-02, una vez por versión). La
 *   pantalla nunca muestra el código de una pregunta: si esa lectura falla, lo dice.
 *
 * Cada lectura pasa por el PDP, sin caché (08 §27.3): una solicitud que dejó de ser revelable deja de listarse, y su
 * detalle responde el mismo 404 neutral que lo inexistente (10-B10:407).
 */
import {
  COPY,
  COPY_FORMULARIOS as F,
  COPY_SOLICITUDES as C,
  ETIQUETA_DE_ALCANCE,
  contarLasVistasDeSolicitudes,
  loDeclarado,
  solicitudEnLaVista,
  todasLasPaginas,
  VISTAS_DE_SOLICITUDES,
  type RespuestaDeFormulario,
  type SolicitudDeFormulario,
  type VersionDeLaRespuesta,
  type VersionDePlantilla,
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
import { useDetalleAlCostado } from '../seguimiento/al-costado';
import { EstadoDeLectura, useFormularios } from './formularios';

/** De cuántas solicitudes respondidas se lee la respuesta para decir en la lista si la persona la corrigió. */
const SOLICITUDES_CON_RESPUESTA = 20;
/** Cuántas respuestas se piden a la vez: cada una es una lectura protegida, y cuenta para el cupo del profesional. */
const RESPUESTAS_A_LA_VEZ = 3;

const PARAMETRO_DE_LA_VISTA: Readonly<Record<Vista, string | null>> = { TODAS: null, SIN_RESPONDER: 'sin-responder', RESPONDIDAS: 'respondidas' };
const vistaDe = (valor: string | null): Vista => VISTAS_DE_SOLICITUDES.find((v) => PARAMETRO_DE_LA_VISTA[v] === valor) ?? 'TODAS';

type Lista = { readonly solicitudes: readonly SolicitudDeFormulario[]; readonly completa: boolean };
/** La respuesta de una solicitud, leída de su detalle (API-FRM-05). */
type Respuesta = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly respuesta: RespuestaDeFormulario | null } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'fallo' };
/** La versión del formulario de una solicitud: de ahí sale el texto de cada pregunta. */
type Formulario = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly version: VersionDePlantilla } | { readonly tipo: 'fallo' };

const hora = (iso: string): string => horaDelDia(new Date(iso));
const mismoDia = (a: string, b: string): boolean => dia(a) === dia(b);

export function VistaDeSolicitudes() {
  const { token, asesoradoId, sesionPerdida, parametros, ir } = useFormularios();
  const id = useId();
  const [lista, setLista] = useState<Resultado<Lista> | null>(null);
  const [respuestas, setRespuestas] = useState<ReadonlyMap<string, Respuesta>>(() => new Map());
  const [formularios, setFormularios] = useState<ReadonlyMap<string, Formulario>>(() => new Map());
  /** Lo que ya se pidió: ninguna respuesta ni ningún formulario se pide dos veces por abrir otra solicitud. */
  const respuestasPedidas = useRef(new Set<string>());
  const formulariosPedidos = useRef(new Set<string>());

  const cargar = useCallback(async () => {
    setLista(null);
    const r = await todasLasPaginas((f) => api.listarSolicitudesDeFormulario(token, asesoradoId, f));
    if (sesionPerdida(r)) return;
    setLista(r.ok ? { ok: true, datos: { solicitudes: r.datos.data, completa: r.datos.completa } } : (r as Resultado<never>));
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const leerRespuesta = useCallback(
    async (solicitudId: string) => {
      setRespuestas((m) => (m.get(solicitudId)?.tipo === 'lista' ? m : new Map(m).set(solicitudId, { tipo: 'cargando' })));
      const r = await api.consultarSolicitudDeFormulario(token, solicitudId);
      if (sesionPerdida(r)) return;
      // El 404 es neutral: no existe, o dejó de estar autorizada. No se distingue, como en toda la API.
      const noDisponible = !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';
      setRespuestas((m) => new Map(m).set(solicitudId, r.ok ? { tipo: 'lista', respuesta: r.datos.data.response } : { tipo: noDisponible ? 'no-disponible' : 'fallo' }));
    },
    [token, sesionPerdida],
  );
  const pedirRespuesta = useCallback(
    (solicitudId: string) => {
      if (respuestasPedidas.current.has(solicitudId)) return Promise.resolve();
      respuestasPedidas.current.add(solicitudId);
      return leerRespuesta(solicitudId);
    },
    [leerRespuesta],
  );
  const leerFormulario = useCallback(
    async (s: Pick<SolicitudDeFormulario, 'templateId' | 'templateVersionId'>) => {
      setFormularios((m) => new Map(m).set(s.templateVersionId, { tipo: 'cargando' }));
      const r = await api.consultarVersionDePlantilla(token, s.templateId, s.templateVersionId);
      if (sesionPerdida(r)) return;
      setFormularios((m) => new Map(m).set(s.templateVersionId, r.ok ? { tipo: 'listo', version: r.datos.data } : { tipo: 'fallo' }));
    },
    [token, sesionPerdida],
  );

  const solicitudes = lista?.ok ? lista.datos.solicitudes : null;
  const abiertaId = parametros.get('solicitud');
  const abierta = useMemo(() => solicitudes?.find((s) => s.formRequestId === abiertaId) ?? null, [solicitudes, abiertaId]);

  // La respuesta de la solicitud abierta se lee primero. Las de las demás respondidas, después y de a pocas, para decir
  // en la lista cuál se corrigió. Una solicitud sin responder no tiene nada más que leer: ya está entera en la lista.
  useEffect(() => {
    if (!solicitudes) return;
    let vivo = true;
    void (async () => {
      if (abierta?.status === 'RESPONDED') await pedirRespuesta(abierta.formRequestId);
      const cola = solicitudes
        .filter((s) => s.status === 'RESPONDED')
        .slice(0, SOLICITUDES_CON_RESPUESTA)
        .map((s) => s.formRequestId)
        .filter((x) => !respuestasPedidas.current.has(x));
      while (vivo && cola.length > 0) await Promise.all(cola.splice(0, RESPUESTAS_A_LA_VEZ).map(pedirRespuesta));
    })();
    return () => {
      vivo = false;
    };
  }, [solicitudes, abierta, pedirRespuesta]);

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
  /** Una solicitud sin responder no tiene respuesta que leer: su detalle es lo que ya trae la lista. */
  const respuestaDe = (s: SolicitudDeFormulario): Respuesta | undefined => (s.status === 'PENDING' ? { tipo: 'lista', respuesta: null } : respuestas.get(s.formRequestId));
  const corrigio = (s: SolicitudDeFormulario): boolean => {
    const r = respuestas.get(s.formRequestId);
    return r?.tipo === 'lista' && (r.respuesta?.rectifications.length ?? 0) > 0;
  };
  const contenidoDeLaAbierta = abierta ? (
    <DetalleDeSolicitud
      key={abierta.formRequestId}
      solicitud={abierta}
      respuesta={respuestaDe(abierta)}
      formulario={formularios.get(abierta.templateVersionId)}
      onReintentarLaRespuesta={() => void leerRespuesta(abierta.formRequestId)}
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
        <div className="solicitudes-del-area__pedir">{pedir}</div>
      </div>

      <EstadoDeLectura r={lista} onReintentar={() => void cargar()}>
        {solicitudes ? (
          solicitudes.length === 0 ? (
            <EstadoVacio titulo={F.sinSolicitudes} />
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
                              <Estado solicitud={s} />
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
                        {abierta.templateName} <Estado solicitud={abierta} />
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
                      <Estado solicitud={abierta} />
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

/** El estado de una solicitud, con palabras. «Sin responder» lleva su ícono: es un hecho, no una alarma, y no lleva color. */
function Estado({ solicitud }: { solicitud: Pick<SolicitudDeFormulario, 'status'> }) {
  return (
    <span className="etiqueta-de-dato" data-estado={solicitud.status}>
      {solicitud.status === 'PENDING' ? <Icono nombre="reloj" tamano={15} /> : null}
      {solicitud.status === 'RESPONDED' ? F.respondida : F.pendiente}
    </span>
  );
}

/**
 * Una solicitud abierta: cuándo y para qué se pidió, cuándo respondió la persona, lo que declaró por pregunta pedida —con
 * la respuesta que rige— y la historia de la respuesta.
 */
function DetalleDeSolicitud({
  solicitud,
  respuesta,
  formulario,
  onReintentarLaRespuesta,
  onReintentarElFormulario,
}: {
  solicitud: SolicitudDeFormulario;
  respuesta: Respuesta | undefined;
  formulario: Formulario | undefined;
  onReintentarLaRespuesta: () => void;
  onReintentarElFormulario: () => void;
}) {
  const id = useId();
  const declarado = useMemo(
    () => (respuesta?.tipo === 'lista' ? loDeclarado(solicitud, respuesta.respuesta, formulario?.tipo === 'listo' ? formulario.version : null) : null),
    [solicitud, respuesta, formulario],
  );
  const leyendoElFormulario = !formulario || formulario.tipo === 'cargando';
  const pregunta = (texto: string | null): ReactNode => texto ?? (leyendoElFormulario ? '…' : C.preguntaSinLeer);
  /** Las preguntas pedidas, cuando no hay una respuesta que rija para mostrar al lado. */
  const soloPreguntas = declarado ? (
    <ul className="preguntas-pedidas">
      {declarado.filas.map((f) => (
        <li key={f.codigo} data-pregunta={f.codigo}>
          {pregunta(f.pregunta)}
          {f.requerida ? <span className="etiqueta-de-dato">{C.requerida}</span> : null}
        </li>
      ))}
    </ul>
  ) : null;

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

      {!respuesta || respuesta.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          {C.leyendoLaRespuesta}
        </p>
      ) : null}
      {respuesta?.tipo === 'no-disponible' ? (
        <Aviso tipo="info">
          <p>{C.detalleNoDisponible}</p>
        </Aviso>
      ) : null}
      {/* Una falla de esta lectura no es «todavía sin responder». */}
      {respuesta?.tipo === 'fallo' ? (
        <Aviso tipo="error">
          <p>
            {C.detalleNoCargo}{' '}
            <button type="button" className="boton boton--enlace" onClick={onReintentarLaRespuesta}>
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

      {declarado?.estado === 'SIN_RESPONDER' ? (
        <section className="solicitud-abierta__bloque" aria-labelledby={`${id}-pedido`}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-pedido`}>{C.preguntasPedidas}</h4>
          </div>
          {soloPreguntas}
          <p className="nota solicitud-abierta__sin-responder">{F.sinRespuestaTodavia}</p>
        </section>
      ) : null}

      {declarado && declarado.estado !== 'SIN_RESPONDER' ? (
        <section className="solicitud-abierta__bloque" aria-labelledby={`${id}-declarado`}>
          <div className="solicitud-abierta__titulo-de-bloque">
            <h4 id={`${id}-declarado`}>{C.loQueDeclaro}</h4>
            {/* La procedencia se dice una vez, para todas las respuestas: cada una es declarada por la persona. */}
            <span className="etiqueta-de-dato" data-procedencia>
              <Icono nombre="reportado" tamano={15} />
              {F.declaradoPorLaPersona}
            </span>
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
              <dl className="lo-declarado">
                {declarado.filas.map((f) => (
                  <div key={f.codigo} className="lo-declarado__fila" data-pregunta={f.codigo}>
                    <dt>
                      {pregunta(f.pregunta)}
                      {f.requerida ? <span className="etiqueta-de-dato">{C.requerida}</span> : null}
                    </dt>
                    <dd>
                      {/* Una pregunta sin responder es un hueco: se dice, no se muestra vacía. */}
                      {f.valor !== null ? <span className="lo-declarado__valor">{f.valor}</span> : <span className="lo-declarado__sin-responder">{C.sinResponder}</span>}
                      {f.corregida ? (
                        <span className="etiqueta-de-dato">
                          <Icono nombre="corregido" tamano={15} />
                          {C.corregida}
                        </span>
                      ) : null}
                      {f.antes ? (
                        <span className="nota lo-declarado__antes">
                          {C.antes}: {f.antes.tipo === 'VALOR' ? `«${f.antes.texto}»` : `${C.antesSinResponder}.`}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
      ) : null}

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
