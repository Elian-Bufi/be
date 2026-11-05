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
 */
import {
  camposVisibles,
  CODIGO_DE_PROBLEMA_V2,
  COPY,
  COPY_FORMULARIOS as F,
  COPY_FORMULARIOS_V2 as V,
  COPY_SOLICITUDES as C,
  COPY_VINCULO,
  MENSAJE_DE_PROBLEMA_V2,
  obligatoriosSinResponder,
  sinRespuestasOcultas,
  type DetalleDeSolicitudV2,
  type ProblemaDeRespuestaV2,
  type RespuestaDeCampoV2Entrada,
  type ValorDeRespuestaV2,
  type VersionDePlantillaV2,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Aviso, ResumenDeErrores } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { dia, diaSinElAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAvisarSinAcceso, useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { CampoV2 } from './campos-v2';
import { conRespuesta, mensajesPorCampo, problemasDeLaApi, respuestaDe, respuestasParaEnviar, revisarAntesDeEnviar, sinRenglonesVacios } from './formulario-de-inicio';
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
    if (revision.bloqueantes.length > 0) return;
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
        // DL-104: un rechazo por los datos no es una falla del servicio; cada problema vuelve a su campo.
        setBloqueantes(problemasDeLaApi(r.issues, enviadas));
        setIntentos((n) => n + 1);
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
    .map((c) => ({ id: idDe(c.fieldCode), texto: `${c.label}: ${mensajes.get(c.fieldCode)?.[0] ?? ''}` }));
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
                <ResumenDeErrores titulo={T.revisar} errores={resumenDeProblemas} intento={intentos} />

                {listo.version.sections.map((s) => {
                  const deLaSeccion = s.fields.filter((c) => pedidas.has(c.fieldCode) && visibles.has(c.fieldCode));
                  if (deLaSeccion.length === 0) return null;
                  return (
                    <section key={s.sectionCode} className="formulario-de-inicio__seccion" aria-labelledby={`fri-seccion-${s.sectionCode}`} data-seccion={s.sectionCode}>
                      <h3 id={`fri-seccion-${s.sectionCode}`}>{s.title}</h3>
                      {s.intro ? <p className="nota formulario-de-inicio__intro">{s.intro}</p> : null}
                      {deLaSeccion.map((c) => {
                        const id = idDe(c.fieldCode);
                        const deEsta = mensajes.get(c.fieldCode) ?? [];
                        const falta = intentos > 0 && sinResponder.includes(c.fieldCode);
                        const descripcion = [c.helpText ? `${id}-ayuda` : null, c.purpose ? `${id}-para-que` : null, ...deEsta.map((_, i) => `${id}-problema-${i}`), falta ? `${id}-falta` : null].filter(Boolean).join(' ') || undefined;
                        return (
                          <fieldset key={c.fieldCode} id={id} className="pregunta-de-inicio" data-pregunta={c.fieldCode} data-con-problema={deEsta.length > 0 ? 'si' : undefined} tabIndex={-1}>
                            <legend className="pregunta-de-inicio__pregunta">
                              <span id={`${id}-texto`}>{c.label}</span>{' '}
                              <span className="etiqueta-de-dato">{solicitud.requiredFieldCodes.includes(c.fieldCode) ? V.obligatoria : V.opcional}</span>
                            </legend>
                            {c.helpText ? (
                              <p id={`${id}-ayuda`} className="campo__ayuda">
                                {c.helpText}
                              </p>
                            ) : null}
                            {c.purpose ? (
                              <p id={`${id}-para-que`} className="nota pregunta-de-inicio__para-que">
                                <Icono nombre="info" tamano={15} />
                                <span>
                                  {V.paraQue}: {c.purpose}
                                </span>
                              </p>
                            ) : null}
                            <CampoV2 id={`${id}-control`} campo={c} valor={respuestaDe(respuestas, c.fieldCode)} onCambiar={(v) => cambiar(c.fieldCode, v)} deshabilitado={enviando} labelledBy={`${id}-texto`} describedBy={descripcion} />
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
                  );
                })}

                <div className="acciones acciones--fijas formulario-de-inicio__pie">
                  <button type="button" className="boton boton--primario" onClick={() => void enviar()} disabled={enviando} aria-busy={enviando} data-enviar>
                    <Icono nombre="solicitar" tamano={18} />
                    {enviando ? C.enviando : envio.tipo === 'error' && envio.incierto ? COPY.reintentar : propuesta ? V.web.reemplazar : V.web.enviar}
                  </button>
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
