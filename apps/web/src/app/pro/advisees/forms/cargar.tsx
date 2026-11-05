'use client';

/**
 * «Cargar con la persona» (WP-FORMULARIOS-DE-INICIO, FI-05; API-FRI-03, 01 y 06; DL-164 D-3 y D-4). Cuando la
 * entrevista es en el consultorio, el profesional completa el formulario de una solicitud pendiente con lo que la
 * persona le cuenta, y lo envía para que ella lo confirme desde su app. Es una sección a todo el ancho de Información
 * (`vista=cargar&solicitud=…`), no un cajón: un formulario de 34 preguntas con listas y tablas no entra en 50 rem.
 * - **Lo cargado no es una respuesta ni queda en el perfil** hasta que la persona lo confirma: lo dice la bajada y lo
 *   repite el pie, junto al botón. Mientras espera, se puede editar (reemplaza, con la versión que se vio) y retirar
 *   (desde la solicitud abierta).
 * - **Solo las preguntas pedidas y visibles.** Las condicionales aparecen cuando su condición se cumple y, si deja de
 *   cumplirse, su respuesta se retira (DL-164 D-2). Cada pregunta dice para qué se usa.
 * - **La revisión es la del dominio** (`validarRespuestasV2`), igual que en la API y en la APK: lo que la API
 *   rechazaría se dice junto a cada campo y frena el envío. Un obligatorio sin responder se marca pero no frena: la
 *   persona lo completa al confirmar (API-FRI-06 tampoco lo exige).
 * - Un número que no se entiende, un «Otro» sin texto o una lista con un renglón incompleto no se mandan como cero ni
 *   vacíos: se dicen. Un renglón sumado y dejado sin nada no es un problema: no viaja (`sinRenglonesVacios`, igual que
 *   la APK). Un rechazo de la API por los datos (`422`) vuelve a marcar los campos; un «no disponible» avisa al marco.
 *   Cambiar algo después de un resultado incierto es otro intento.
 * - Lo escrito se pierde al salir sin enviar: «Volver» pregunta antes, en la página; «Actualizar» y el navegador avisan
 *   (`useCambiosSinGuardar`).
 * - **Una parte por pantalla, como en la app** (DL-165 D-1, `partes-de-formulario.ts`): «Parte N de M», «Anterior» y
 *   «Siguiente», un índice de las partes con las obligatorias que le faltan a cada una (D-7) y un repaso antes de enviar.
 *   Pasar de parte no exige nada; un problema al enviar lleva a la parte de la primera pregunta marcada.
 */
import {
  ayudaDeLaPregunta,
  camposVisibles,
  CODIGO_DE_PROBLEMA_V2,
  COPY,
  COPY_FORMULARIOS as F,
  COPY_FORMULARIOS_V2 as V,
  COPY_SOLICITUDES as C,
  COPY_VINCULO,
  MENSAJE_DE_PROBLEMA_V2,
  obligatoriosSinResponder,
  parteDeLaPregunta,
  partesDelFormulario,
  pasoAcotado,
  pasoDelRepaso,
  preguntasQueSeVen,
  primeraParteCon,
  sinRespuestasOcultas,
  topeDesdeLaTabla,
  type DetalleDeSolicitudV2,
  type ParteDelFormulario,
  type ProblemaDeRespuestaV2,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
  type ValorDeRespuestaV2,
  type VersionDePlantillaV2,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { dia, diaSinElAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso, useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { CampoV2, ParaQueDeLaPregunta } from './campos-v2';
import { conRespuesta, lineasDeValor, mensajesPorCampo, problemasDeLaApi, respuestaDe, respuestasParaEnviar, revisarAntesDeEnviar, sinRenglonesVacios } from './formulario-de-inicio';
import { EstadoDeLectura, useFormularios } from './formularios';

/** Los textos propios de esta pantalla (los que comparte con la APK están en `COPY_FORMULARIOS_V2`). */
const T = {
  volver: 'Volver a la solicitud',
  formulario: 'Formulario',
  sinSolicitud: 'Para cargar con la persona, abrí primero una solicitud pendiente.',
  deOtroProfesional: 'Esta solicitud la pidió otro profesional: solo quien la pidió puede cargarla con la persona.',
  yaRespondida: 'Esta solicitud ya tiene respuesta: no hay nada más que cargar. La ves en la solicitud.',
  revisar: 'Revisá lo cargado antes de enviar',
  laCompletaAlConfirmar: 'La persona la completa al confirmar.',
  sinNada: 'Cargá al menos una respuesta para enviar.',
  cargado: 'Enviado. Queda «Esperando que lo confirme»: la persona lo ve en su app.',
  cambiosGuardados: 'Cambios guardados. Sigue «Esperando que lo confirme».',
  volverALeer: 'Volver a leer',
  releido: 'Volvimos a leer la solicitud. Lo que escribiste sigue en los campos: revisalo y enviá de nuevo.',
  respondidas: (n: number, de: number) => `${n} de ${de} respondidas`,
  noQuedaHastaConfirmar: 'No queda en su perfil hasta que lo confirme. Puede corregir cualquier respuesta antes, o decir que no es correcto.',
  salirPregunta: '¿Volvés sin enviar? Lo que cargaste en esta pantalla se pierde.',
  siVolver: 'Sí, volver',
  seguirCargando: 'Seguir cargando',
} as const;

/** Los rechazos de API-FRI-06 que dependen de la solicitud: se dicen, en vez de «el servicio no está disponible». */
const RECHAZO: Readonly<Record<string, string>> = {
  FORM_REQUEST_NOT_RESPONDABLE: 'Esta solicitud ya no admite cargar respuestas: puede que la persona ya la haya respondido o que el acceso haya cambiado. Volvé a la solicitud para verla.',
  VERSION_CONFLICT: 'Lo cargado cambió desde que abriste esta pantalla: la persona pudo confirmarlo o decir que no es correcto. Volvé a leer y, si sigue pendiente, enviá de nuevo.',
};

type Lectura = { readonly vista: DetalleDeSolicitudV2; readonly version: VersionDePlantillaV2 };
type Envio = { readonly tipo: 'editando' } | { readonly tipo: 'enviando' } | { readonly tipo: 'error'; readonly texto: string; readonly incierto: boolean; readonly conflicto: boolean };

const idDe = (fieldCode: string) => `fri-${fieldCode}`;

export function CargaConLaPersona() {
  const { token, sesionPerdida, avisar, parametros, ir, yoId } = useFormularios();
  const persona = usePersonaDelArea();
  const avisarSinAcceso = useAvisarSinAcceso();
  const intento = useClaveDeIntento();
  const solicitudId = parametros.get('solicitud');
  const [lectura, setLectura] = useState<Resultado<Lectura> | null>(null);
  const [respuestas, setRespuestas] = useState<readonly RespuestaDeCampoV2Entrada[]>([]);
  /** La versión de lo cargado antes, si espera confirmación: se reemplaza con ella. `null` crea. */
  const [expectedVersion, setExpectedVersion] = useState<string | null>(null);
  const [tocado, setTocado] = useState(false);
  const tocadoRef = useRef(false);
  /** Lo que la revisión frenó en el último intento; cada campo que cambia sale de acá. */
  const [bloqueantes, setBloqueantes] = useState<readonly ProblemaDeRespuestaV2[]>([]);
  /** Sube con cada intento de envío: el resumen de problemas toma el foco solo entonces. */
  const [intentos, setIntentos] = useState(0);
  const [envio, setEnvio] = useState<Envio>({ tipo: 'editando' });
  const [releido, setReleido] = useState(false);
  /** «Volver» con algo cargado y sin enviar pregunta antes, en la página: nada se descarta en silencio. */
  const [saliendo, setSaliendo] = useState(false);
  const preguntaDeSalida = useRef<HTMLParagraphElement>(null);
  const idDeSalida = useId();
  useEffect(() => {
    if (saliendo) preguntaDeSalida.current?.focus();
  }, [saliendo]);
  const enviando = envio.tipo === 'enviando';
  useCambiosSinGuardar(tocado, 'lo cargado con la persona');

  const cargar = useCallback(async () => {
    if (!solicitudId) return;
    setLectura(null);
    const vista = await api.consultarVistaDeSolicitud(token, solicitudId);
    if (sesionPerdida(vista)) return;
    if (!vista.ok) return setLectura(vista);
    const { request, proposal } = vista.datos.data;
    const version = await api.consultarDefinicionDePlantilla(token, request.templateId, request.templateVersionId);
    if (sesionPerdida(version)) return;
    if (!version.ok) return setLectura(version);
    setLectura({ ok: true, datos: { vista: vista.datos.data, version: version.datos.data } });
    // Lo cargado antes (si espera confirmación) llena el formulario; después de un conflicto, lo escrito se conserva y
    // solo se toma la versión nueva.
    setExpectedVersion(proposal?.version ?? null);
    if (!tocadoRef.current) setRespuestas(proposal ? sinRespuestasOcultas(version.datos.data.sections, proposal.answers) : []);
  }, [token, solicitudId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const listo = lectura?.ok ? lectura.datos : null;
  const solicitud = listo?.vista.request ?? null;
  const secciones = useMemo(() => listo?.version.sections ?? [], [listo]);
  const visibles = useMemo(() => camposVisibles(secciones, respuestas), [secciones, respuestas]);
  const pedidas = useMemo(() => new Set(solicitud?.requestedFieldCodes ?? []), [solicitud]);
  const sinResponder = useMemo(() => (solicitud ? obligatoriosSinResponder(secciones, solicitud, respuestas) : []), [secciones, solicitud, respuestas]);
  const mensajes = useMemo(() => mensajesPorCampo(bloqueantes), [bloqueantes]);
  const campos = useMemo(() => secciones.flatMap((s) => s.fields), [secciones]);

  // ─── DL-165 D-1 · una parte por pantalla, como en la app (`partes-de-formulario.ts`) ──────────────────────────
  const partes = useMemo(() => (solicitud ? partesDelFormulario(secciones, solicitud) : []), [secciones, solicitud]);
  const [paso, setPaso] = useState(0);
  /** Lo que quedó sin responder en la parte que se acaba de dejar: la siguiente lo dice y deja volver. */
  const [quedaron, setQuedaron] = useState<{ readonly indice: number; readonly titulo: string; readonly n: number } | null>(null);
  const repaso = pasoDelRepaso(partes);
  const actual = pasoAcotado(partes, paso);
  const enRepaso = actual === repaso;
  const parte = enRepaso ? null : (partes[actual] ?? null);
  /** DL-165 D-7 · cuántas obligatorias le faltan a cada parte: van en el índice de las partes. */
  const faltanPorParte = useMemo(() => {
    const m = new Map<number, number>();
    for (const codigo of sinResponder) {
      const i = parteDeLaPregunta(partes, codigo);
      if (i !== null) m.set(i, (m.get(i) ?? 0) + 1);
    }
    return m;
  }, [partes, sinResponder]);
  const porCodigo = useMemo(() => new Map(campos.map((c) => [c.fieldCode, c] as const)), [campos]);
  const deLaParte = parte ? preguntasQueSeVen(parte, visibles).flatMap((codigo) => porCodigo.get(codigo) ?? []) : [];
  /** Al cambiar de parte, el foco va a su título: con el teclado, la parte nueva empieza ahí (no en el botón que se tocó). */
  const tituloDeLaParte = useRef<HTMLHeadingElement>(null);
  const cambioDeParte = useRef(false);
  useEffect(() => {
    if (!cambioDeParte.current) return;
    cambioDeParte.current = false;
    tituloDeLaParte.current?.focus();
  }, [paso]);

  /** Cambia de parte. Hacia adelante, si en la que se deja quedó una obligatoria sin responder, la siguiente lo dice. */
  const irAlPaso = (destino: number) => {
    const siguiente = pasoAcotado(partes, destino);
    const faltan = parte && siguiente > actual ? (faltanPorParte.get(parte.indice) ?? 0) : 0;
    setQuedaron(parte && faltan > 0 ? { indice: parte.indice, titulo: parte.titulo, n: faltan } : null);
    cambioDeParte.current = siguiente !== actual;
    setPaso(siguiente);
  };
  /** Un problema al enviar lleva a la primera parte que tiene una pregunta marcada. */
  const irAlProblema = (problemas: readonly ProblemaDeRespuestaV2[]) => {
    const destino = primeraParteCon(partes, problemas.map((p) => p.fieldCode));
    setQuedaron(null);
    if (destino !== null && destino !== actual) {
      cambioDeParte.current = false;
      setPaso(destino);
    }
  };

  /** Un cambio del profesional: se puede perder, resuelve lo marcado en ese campo y es otro intento. */
  const cambiar = (fieldCode: string, valor: ValorDeRespuestaV2 | null) => {
    setRespuestas((rs) => conRespuesta(secciones, rs, fieldCode, valor));
    setTocado(true);
    tocadoRef.current = true;
    intento.descartar();
    setBloqueantes((b) => (b.some((p) => p.fieldCode === fieldCode) ? b.filter((p) => p.fieldCode !== fieldCode) : b));
    setReleido(false);
    setSaliendo(false);
    if (envio.tipo === 'error') setEnvio({ tipo: 'editando' });
  };

  async function enviar() {
    if (!listo || !solicitud || !solicitudId || enviando) return;
    // Un renglón de lista sumado y dejado vacío no viaja ni frena (igual que la APK): sale del estado antes de revisar,
    // así cada «Renglón n» de los mensajes es el que se ve en la pantalla.
    const limpias = sinRenglonesVacios(respuestas);
    if (limpias !== respuestas) setRespuestas(limpias);
    const revision = revisarAntesDeEnviar(secciones, solicitud, limpias);
    setBloqueantes(revision.bloqueantes);
    setIntentos((n) => n + 1);
    if (revision.bloqueantes.length > 0) return irAlProblema(revision.bloqueantes);
    if (limpias.length === 0) return setEnvio({ tipo: 'error', texto: T.sinNada, incierto: false, conflicto: false });
    setEnvio({ tipo: 'enviando' });
    const enviadas = respuestasParaEnviar(secciones, limpias);
    const r = await api.cargarPropuestaDeRespuesta(token, solicitudId, { expectedVersion, answers: enviadas }, intento.actual());
    intento.registrar(r);
    if (sesionPerdida(r)) return setEnvio({ tipo: 'editando' });
    if (!r.ok) {
      // El «no disponible» de una escritura: el marco vuelve a preguntar el acceso (F-09).
      if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') avisarSinAcceso();
      if (r.tipo === 'API' && r.codigo === 'FORM_RESPONSE_INVALID') {
        // DL-104: un rechazo por los datos no es una falla del servicio; cada problema vuelve a su campo, en su parte.
        const deLaApi = problemasDeLaApi(r.issues, enviadas);
        setBloqueantes(deLaApi);
        setIntentos((n) => n + 1);
        irAlProblema(deLaApi);
        return setEnvio({ tipo: 'error', texto: F.respuestaNoAceptada, incierto: false, conflicto: false });
      }
      const conflicto = r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT';
      return setEnvio({ tipo: 'error', texto: RECHAZO[r.tipo === 'API' ? r.codigo : ''] ?? mensajeDeFallo(r, COPY_VINCULO.recursoNoDisponible), incierto: esIncierto(r), conflicto });
    }
    setTocado(false);
    tocadoRef.current = false;
    setEnvio({ tipo: 'editando' });
    // El éxito lo dice la página de la solicitud, que se abre con lo cargado y «Esperando que lo confirme» (DL-113).
    avisar(expectedVersion === null ? T.cargado : T.cambiosGuardados);
    ir({ vista: 'solicitudes' });
  }

  /** Después de un conflicto: se vuelve a leer la solicitud; lo escrito queda. */
  async function volverALeer() {
    setEnvio({ tipo: 'editando' });
    await cargar();
    setReleido(true);
  }

  /** Vuelve a la solicitud abierta (`solicitud=` queda en la dirección). Lo escrito sin enviar se pierde: ya se preguntó. */
  const salir = () => {
    setTocado(false);
    tocadoRef.current = false;
    ir({ vista: 'solicitudes' });
  };
  const volver = (
    <button type="button" className="boton boton--secundario" onClick={() => (tocado ? setSaliendo(true) : salir())} disabled={enviando}>
      <Icono nombre="volver" tamano={18} />
      {T.volver}
    </button>
  );

  const resumenDeProblemas = campos
    .filter((c) => mensajes.has(c.fieldCode))
    .map((c) => ({ id: idDe(c.fieldCode), texto: `${c.label}: ${mensajes.get(c.fieldCode)?.[0] ?? ''}`, parte: parteDeLaPregunta(partes, c.fieldCode) }));
  const pedidasVisibles = campos.filter((c) => pedidas.has(c.fieldCode) && visibles.has(c.fieldCode));
  const propuesta = listo?.vista.proposal ?? null;
  const esMia = solicitud !== null && solicitud.professional.identityId === yoId;

  return (
    <section className="registros formulario-de-inicio" aria-labelledby="titulo-carga">
      <div className="registros__encabezado">
        <h2 id="titulo-carga">{V.web.cargar}</h2>
        <p className="nota registros__bajada">{V.web.cargarBajada}</p>
        <div className="formulario-de-inicio__volver">{volver}</div>
      </div>
      {saliendo ? (
        // La confirmación va en la página, donde está la acción: lo cargado sigue a la vista mientras se decide.
        <div className="confirmacion-en-linea" role="group" aria-labelledby={idDeSalida}>
          <p id={idDeSalida} ref={preguntaDeSalida} tabIndex={-1}>
            {T.salirPregunta}
          </p>
          <div className="acciones">
            <button type="button" className="boton boton--peligro" onClick={salir}>
              {T.siVolver}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setSaliendo(false)}>
              {T.seguirCargando}
            </button>
          </div>
        </div>
      ) : null}

      {!solicitudId ? (
        <Aviso tipo="info">
          <p>{T.sinSolicitud}</p>
        </Aviso>
      ) : (
        <EstadoDeLectura r={lectura} onReintentar={() => void cargar()} que="el formulario">
          {listo && solicitud ? (
            !esMia ? (
              <Aviso tipo="info">
                <p>{T.deOtroProfesional}</p>
              </Aviso>
            ) : solicitud.status !== 'PENDING' ? (
              <Aviso tipo="info">
                <p>{T.yaRespondida}</p>
              </Aviso>
            ) : (
              <div className="formulario-de-inicio__cuerpo" data-solicitud={solicitud.formRequestId}>
                <dl className="solicitud-abierta__datos">
                  <div>
                    <dt>{T.formulario}</dt>
                    <dd>
                      {solicitud.templateName}
                      {persona ? ` · ${persona}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>{C.paraQue}</dt>
                    <dd>«{solicitud.purpose}»</dd>
                  </div>
                  <div>
                    <dt>{C.loPediste}</dt>
                    <dd>
                      El {dia(solicitud.createdAt)} a las {horaDelDia(new Date(solicitud.createdAt))}
                    </dd>
                  </div>
                </dl>
                {propuesta ? (
                  <p className="formulario-de-inicio__en-espera">
                    <span className="etiqueta-de-dato" data-estado="EN_ESPERA">
                      <Icono nombre="reloj" tamano={15} />
                      {V.web.esperando}
                    </span>
                    <span className="nota">{V.web.cargadoPorVos(diaSinElAnioEnCurso(propuesta.loadedAt))}</span>
                  </p>
                ) : null}
                {releido ? (
                  <Aviso tipo="info">
                    <p>{T.releido}</p>
                  </Aviso>
                ) : null}
                {envio.tipo === 'error' ? (
                  <Aviso tipo="error" enfocar>
                    <p>{envio.texto}</p>
                    {envio.conflicto ? (
                      <p>
                        <button type="button" className="boton boton--enlace" onClick={() => void volverALeer()}>
                          {T.volverALeer}
                        </button>
                      </p>
                    ) : null}
                  </Aviso>
                ) : null}
                <ProblemasDeLaCarga problemas={resumenDeProblemas} intento={intentos} actual={actual} partes={partes} onIrAParte={irAlPaso} />

                {/* DL-165 D-1 y D-7: las partes, con lo que le falta a cada una; desde acá se va a cualquiera, y al repaso. */}
                <nav className="partes-del-formulario" aria-label={V.partesDelFormulario}>
                  <ol>
                    {partes.map((p) => {
                      const faltan = faltanPorParte.get(p.indice) ?? 0;
                      return (
                        <li key={p.sectionCode}>
                          <button type="button" className="partes-del-formulario__parte" aria-current={p.indice === actual ? 'step' : undefined} onClick={() => irAlPaso(p.indice)} disabled={enviando} data-parte={p.sectionCode}>
                            <span className="partes-del-formulario__titulo">
                              {p.indice + 1}. {p.titulo}
                            </span>
                            {faltan > 0 ? <span className="partes-del-formulario__faltan">{V.obligatoriasPorResponder(faltan)}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                    <li>
                      <button type="button" className="partes-del-formulario__parte" aria-current={enRepaso ? 'step' : undefined} onClick={() => irAlPaso(repaso)} disabled={enviando} data-parte="repaso">
                        <span className="partes-del-formulario__titulo">{V.repaso}</span>
                      </button>
                    </li>
                  </ol>
                </nav>
                <p className="formulario-de-inicio__paso" aria-live="polite">
                  {enRepaso ? V.repaso : V.parte(actual + 1, partes.length)}
                </p>
                {quedaron && !enRepaso ? (
                  <Aviso tipo="info">
                    <p>
                      {V.quedaronSinResponder(quedaron.n, quedaron.titulo)}{' '}
                      <button type="button" className="boton boton--enlace" onClick={() => irAlPaso(quedaron.indice)}>
                        {V.volverALaParte(quedaron.titulo)}
                      </button>
                    </p>
                  </Aviso>
                ) : null}

                {parte ? (
                  <section key={parte.sectionCode} className="formulario-de-inicio__seccion" aria-labelledby={`fri-seccion-${parte.sectionCode}`} data-seccion={parte.sectionCode}>
                    <h3 id={`fri-seccion-${parte.sectionCode}`} ref={tituloDeLaParte} tabIndex={-1}>
                      {parte.titulo}
                    </h3>
                    {parte.intro ? <p className="nota formulario-de-inicio__intro">{parte.intro}</p> : null}
                    {deLaParte.length === 0 ? <p className="nota">{V.parteSinPreguntas}</p> : null}
                    {deLaParte.map((c) => {
                      const id = idDe(c.fieldCode);
                      const deEsta = mensajes.get(c.fieldCode) ?? [];
                      const falta = intentos > 0 && sinResponder.includes(c.fieldCode);
                      // DL-165 D-2: la ayuda a la vista es corta; en un texto, es su texto de muestra (y la lee el lector).
                      const ayuda = ayudaDeLaPregunta(c);
                      const conAyuda = ayuda.aLaVista !== null || ayuda.deMuestra !== null;
                      // DL-165 D-5: un número con su tope en una tabla dice cuánto admite con lo marcado.
                      const tope = topeDesdeLaTabla(c, secciones, respuestas);
                      const descripcion =
                        [conAyuda ? `${id}-ayuda` : null, tope ? `${id}-tope` : null, c.purpose ? `${id}-para-que` : null, ...deEsta.map((_, i) => `${id}-problema-${i}`), falta ? `${id}-falta` : null].filter(Boolean).join(' ') || undefined;
                      return (
                        <fieldset key={c.fieldCode} id={id} className="pregunta-de-inicio" data-pregunta={c.fieldCode} data-con-problema={deEsta.length > 0 ? 'si' : undefined} tabIndex={-1}>
                          <legend className="pregunta-de-inicio__pregunta">
                            <span id={`${id}-texto`}>{c.label}</span>{' '}
                            {/* DL-165 D-7: la obligatoria se distingue también por su forma, no solo por la palabra. */}
                            <span className="etiqueta-de-dato" data-obligatoria={solicitud.requiredFieldCodes.includes(c.fieldCode) ? 'si' : undefined}>
                              {solicitud.requiredFieldCodes.includes(c.fieldCode) ? V.obligatoria : V.opcional}
                            </span>
                          </legend>
                          {ayuda.aLaVista ? (
                            <p id={`${id}-ayuda`} className="campo__ayuda">
                              {ayuda.aLaVista}
                            </p>
                          ) : ayuda.deMuestra ? (
                            <span id={`${id}-ayuda`} className="visualmente-oculto">
                              {ayuda.deMuestra}
                            </span>
                          ) : null}
                          {tope ? (
                            <p id={`${id}-tope`} className="campo__ayuda">
                              {V.hastaLoMarcado(tope.tope, tope.tabla)}
                            </p>
                          ) : null}
                          <CampoV2 id={`${id}-control`} campo={c} valor={respuestaDe(respuestas, c.fieldCode)} onCambiar={(v) => cambiar(c.fieldCode, v)} deshabilitado={enviando} labelledBy={`${id}-texto`} describedBy={descripcion} />
                          {c.purpose ? <ParaQueDeLaPregunta idDelTexto={`${id}-para-que`} pregunta={c.label} texto={c.purpose} /> : null}
                          {deEsta.map((m, i) => (
                            <p key={m} id={`${id}-problema-${i}`} className="campo__error">
                              <span aria-hidden="true">⚠ </span>
                              {m}
                            </p>
                          ))}
                          {falta ? (
                            <p id={`${id}-falta`} className="nota pregunta-de-inicio__falta">
                              {MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.REQUIRED]} {T.laCompletaAlConfirmar}
                            </p>
                          ) : null}
                        </fieldset>
                      );
                    })}
                  </section>
                ) : (
                  <RepasoDeLoCargado secciones={secciones} partes={partes} respuestas={respuestas} visibles={visibles} obligatorias={solicitud.requiredFieldCodes} onCambiar={irAlPaso} tituloRef={tituloDeLaParte} />
                )}

                {/* Moverse entre las partes; en el repaso, enviar. Lo que hay que saber antes de enviar queda junto al botón. */}
                <div className="acciones acciones--fijas formulario-de-inicio__pie">
                  {actual > 0 ? (
                    <button type="button" className="boton boton--secundario" onClick={() => irAlPaso(actual - 1)} disabled={enviando} data-anterior>
                      <Icono nombre="volver" tamano={18} />
                      {V.anterior}
                    </button>
                  ) : null}
                  {enRepaso ? (
                    <button type="button" className="boton boton--primario" onClick={() => void enviar()} disabled={enviando} aria-busy={enviando} data-enviar>
                      <Icono nombre="solicitar" tamano={18} />
                      {enviando ? C.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : propuesta ? V.web.reemplazar : V.web.enviar}
                    </button>
                  ) : (
                    <button type="button" className="boton boton--primario" onClick={() => irAlPaso(actual + 1)} disabled={enviando} data-siguiente>
                      {actual === partes.length - 1 ? V.repasar : V.siguiente}
                      <Icono nombre="derecha" tamano={18} />
                    </button>
                  )}
                  <p className="acciones__estado">
                    <span aria-live="polite">{T.respondidas(respuestas.length, pedidasVisibles.length)}</span> · {T.noQuedaHastaConfirmar}
                  </p>
                </div>
              </div>
            )
          ) : null}
        </EstadoDeLectura>
      )}
    </section>
  );
}

/**
 * Lo que la revisión o la API frenaron, todo junto y con el foco en el intento (como `ResumenDeErrores`). Lo de la parte
 * que se ve es un enlace a su pregunta; lo de otra parte, un botón que la abre.
 */
function ProblemasDeLaCarga({
  problemas,
  intento,
  actual,
  partes,
  onIrAParte,
}: {
  problemas: readonly { readonly id: string; readonly texto: string; readonly parte: number | null }[];
  intento: number;
  actual: number;
  partes: readonly ParteDelFormulario[];
  onIrAParte: (indice: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hay = problemas.length > 0;
  useEffect(() => {
    if (hay) ref.current?.focus();
    // A propósito depende solo del envío (intento), no de la lista.
  }, [intento]);
  if (!hay) return null;
  return (
    <div ref={ref} className="aviso aviso--error" role="alert" tabIndex={-1}>
      <p className="aviso__titulo">{T.revisar}</p>
      <ul>
        {problemas.map((p) => (
          <li key={p.id}>
            {p.parte === null || p.parte === actual ? (
              <a href={`#${p.id}`}>{p.texto}</a>
            ) : (
              <button type="button" className="boton boton--enlace" onClick={() => onIrAParte(p.parte as number)}>
                {p.texto} ({partes[p.parte]?.titulo ?? ''})
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * DL-165 D-1 · el repaso de lo cargado: por parte, cada pregunta pedida que se ve con su valor en renglones (o «Sin
 * cargar», con «obligatoria» si lo es), y «Cambiar» en cada parte. Las obligatorias sin cargar no frenan: la persona las
 * completa al confirmar.
 */
function RepasoDeLoCargado({
  secciones,
  partes,
  respuestas,
  visibles,
  obligatorias,
  onCambiar,
  tituloRef,
}: {
  secciones: readonly SeccionDePlantillaV2[];
  partes: readonly ParteDelFormulario[];
  respuestas: readonly RespuestaDeCampoV2Entrada[];
  visibles: ReadonlySet<string>;
  obligatorias: readonly string[];
  onCambiar: (indice: number) => void;
  tituloRef: RefObject<HTMLHeadingElement | null>;
}) {
  const campos = new Map(secciones.flatMap((s) => s.fields).map((c) => [c.fieldCode, c] as const));
  return (
    <section className="formulario-de-inicio__seccion formulario-de-inicio__repaso" aria-labelledby="fri-repaso" data-seccion="repaso">
      <h3 id="fri-repaso" ref={tituloRef} tabIndex={-1}>
        {V.repaso}
      </h3>
      <p className="nota formulario-de-inicio__intro">{V.web.repasoBajada}</p>
      {partes.map((p) => {
        const codigos = preguntasQueSeVen(p, visibles);
        if (codigos.length === 0) return null;
        return (
          <div key={p.sectionCode} className="lo-declarado__seccion" data-seccion={p.sectionCode}>
            <h4 className="lo-declarado__titulo-de-seccion">{p.titulo}</h4>
            <dl className="lo-declarado lo-cargado">
              {codigos.map((codigo) => {
                const campo = campos.get(codigo);
                const valor = respuestaDe(respuestas, codigo);
                const lineas = valor ? lineasDeValor(campo, valor) : [];
                return (
                  <div key={codigo} className="lo-declarado__fila" data-pregunta={codigo}>
                    <dt>{campo?.label ?? codigo}</dt>
                    <dd>
                      {lineas.length > 1 ? (
                        <ul className="lo-declarado__lineas">
                          {lineas.map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                        </ul>
                      ) : lineas.length === 1 ? (
                        <span className="lo-declarado__valor">{lineas[0]}</span>
                      ) : (
                        <span className="lo-declarado__sin-responder">{obligatorias.includes(codigo) ? `${V.web.sinCargar} · ${V.obligatoria.toLowerCase()}` : V.web.sinCargar}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p>
              <button type="button" className="boton boton--enlace" onClick={() => onCambiar(p.indice)} aria-label={V.cambiarParteDe(p.titulo)}>
                {V.cambiarParte}
              </button>
            </p>
          </div>
        );
      })}
    </section>
  );
}
