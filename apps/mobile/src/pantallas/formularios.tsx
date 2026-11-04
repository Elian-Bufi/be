/**
 * APK · «Información que me pidieron» (RF-071; UC-P33) por el camino V2 de WP-FORMULARIOS-DE-INICIO (DL-164): la bandeja
 * (API-FRI-02) y una solicitud con su estructura (API-FRI-01), su detalle (API-FRI-03), la respuesta o su confirmación
 * (API-FRI-04), la corrección (API-FRI-05) y «No es correcto» (API-FRI-08). Sirve para cualquier solicitud, de P0 o con
 * tipos nuevos: las operaciones FRM quedan para las APK instaladas.
 *
 * Lo que esta pantalla tiene que sostener, y por eso el copy dice lo que dice:
 * - **no responder es una opción legítima**: no hay barra de completitud, ni recordatorio culposo, ni nada que
 *   presente una solicitud sin responder como un incumplimiento;
 * - **lo que se responde queda como declarado por la persona** (09 §22.7): también lo que cargó el profesional con
 *   ella y ella confirma; la respuesta dice quién lo cargó y qué corrigió (DL-164 D-4);
 * - **un campo que no se completa se omite**, no viaja como cero ni como vacío (09:1586-1587), y lo oculto por una
 *   condición no viaja (D-2);
 * - **corregir agrega, no reemplaza**: la respuesta anterior se conserva y se ve (09:1618);
 * - **lo cargado y no confirmado no queda en el perfil**: «No es correcto» lo borra y la solicitud sigue pendiente (D-6).
 *
 * `respondable` lo decide la API en cada lectura, con la política vigente: si el vínculo se pausó o el consentimiento
 * se revocó, la solicitud sigue estando —es de la persona— pero ya no se puede responder.
 */
import {
  camposEnOrden,
  COPY,
  COPY_FORMULARIOS,
  COPY_FORMULARIOS_V2,
  desenlaceDeEnvio,
  estadoInicialDeFormulario,
  habilitacion,
  LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION,
  reducirFormulario,
  sePuedeEnviar,
  valoresAdmitidos,
  type Accion,
  type CampoDePlantillaV2,
  type DetalleDeSolicitudV2,
  type Intencion,
  type RespuestaDeCampoV2Entrada,
  type Resultado,
  type SolicitudPropiaV2,
  type VersionDePlantillaV2,
} from '@be/domain';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { CampoDeAlimentos, CampoDeHorarios, ListaQueSeRepite, OPCIONES_SI_O_NO, OpcionUnica, OpcionesMultiples, TablaDeOpciones } from '../campos-de-formulario';
import { DialogoDeConfirmacion, useAccionConfirmada } from '../dialogo';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { fecha } from '../formato';
import {
  armarRespuestas,
  BORRADOR_VACIO,
  borradorDeRespuestas,
  camposQueSeVen,
  cuantasCorrigio,
  gruposDeLaBandeja,
  hayAlgoEscrito,
  mismoBorrador,
  problemasAntesDeEnviar,
  rechazoV2,
  reducirBorrador,
  respuestasVigentes,
  rotuloDe,
  seccionesEnPalabras,
  TEXTOS_DE_FORMULARIO_V2 as T,
  valorComo,
  type Borrador,
  type EleccionSiONo,
  type RespuestasArmadas,
} from '../formulario-v2';
import { falloDe, useClaveDeIntento } from '../intento';
import { useLecturaRecordada } from '../lecturas';
import { leerLista } from '../lecturas-de-las-zonas';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Ayuda, Boton, Campo, CampoSiONo, Dato, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo, estilos as ui, estilosPorTema } from '../ui';

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: readonly SolicitudPropiaV2[] } | { tipo: 'error'; sinConexion: boolean };

const APK = COPY_FORMULARIOS_V2.apk;

/** Una solicitud en la bandeja: qué es, quién la pidió, cuánto lleva y qué sigue (revisar, completar o ver). */
function TarjetaDeSolicitud({ s, ir }: { s: SolicitudPropiaV2; ir: (r: Ruta) => void }) {
  const abrir = () => ir({ nombre: 'mi-solicitud', id: s.formRequestId });
  const propuesta = s.status === 'PENDING' ? s.pendingProposal : null;
  return (
    <Tarjeta>
      <Parrafo>{s.templateName}</Parrafo>
      <Insignia texto={s.status === 'RESPONDED' ? COPY_FORMULARIOS.respondida : propuesta ? APK.paraConfirmar : COPY_FORMULARIOS.pendiente} positiva={s.status === 'RESPONDED'} />
      <Parrafo tenue>
        {COPY_FORMULARIOS.pedidoPor} {s.professional.displayName} · {fecha(s.createdAt)}
      </Parrafo>
      <Parrafo tenue>{s.purpose}</Parrafo>
      {propuesta ? <Parrafo tenue>{T.cargadoPorEl(propuesta.professional.displayName, fecha(propuesta.loadedAt))}</Parrafo> : null}
      {s.status === 'PENDING' && s.estimatedMinutes !== null && !propuesta ? <Parrafo tenue icono="reloj">{COPY_FORMULARIOS_V2.minutos(s.estimatedMinutes)}</Parrafo> : null}
      {s.respondable ? (
        <Boton texto={propuesta ? T.revisar : COPY_FORMULARIOS.completar} onPress={abrir} />
      ) : s.status === 'RESPONDED' ? (
        <Boton texto={T.verMiRespuesta} tipo="secundario" onPress={abrir} />
      ) : (
        <Parrafo tenue>{COPY_FORMULARIOS.yaNoSePuedeResponder}</Parrafo>
      )}
    </Tarjeta>
  );
}

export function PantallaDeFormularios({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(() => leerLista(api, token), [token]);
  // Al entrar se verifica antes de mostrar (src/ciclo-de-lectura.ts).
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mis-solicitudes', pedir, sesionPerdida);
  const carga: Carga = r === null ? { tipo: 'cargando' } : r.ok ? { tipo: 'listo', datos: r.datos.solicitudes } : { tipo: 'error', sinConexion: r.tipo === 'RED' };
  /** DL-115 · sin A3 la lista sigue, pero lo propio no se lee ni se responde: se dice arriba, con el camino a Privacidad. */
  const sinA3 = r?.ok === true && r.datos.sinA3;
  // Tres grupos por lo que falta hacer; un grupo vacío no se dibuja.
  const grupos = carga.tipo === 'listo' ? gruposDeLaBandeja(carga.datos) : null;
  const grupo = (titulo: string, solicitudes: readonly SolicitudPropiaV2[]) =>
    solicitudes.length === 0 ? null : (
      <Seccion titulo={titulo}>
        {solicitudes.map((s) => (
          <TarjetaDeSolicitud key={s.formRequestId} s={s} ir={ir} />
        ))}
      </Seccion>
    );

  return (
    <View>
      <Titulo>{COPY_FORMULARIOS.pestana}</Titulo>
      <SinActualizar visible={sinActualizar} onReintentar={cargar} />
      <Parrafo tenue>{COPY_FORMULARIOS.podesNoResponder}</Parrafo>
      {sinA3 ? (
        <Aviso tipo="info" titulo={COPY_FORMULARIOS.necesitaA3}>
          <Boton texto={COPY_FORMULARIOS.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
        </Aviso>
      ) : null}
      {carga.tipo === 'cargando' ? <Cargando forma="lista" /> : null}
      {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} /> : null}
      {carga.tipo === 'listo' && carga.datos.length === 0 ? <Parrafo>{COPY_FORMULARIOS.sinSolicitudesPropias}</Parrafo> : null}
      {grupos ? (
        <>
          {grupo(APK.paraConfirmar, grupos.paraConfirmar)}
          {grupo(APK.paraResponder, grupos.paraResponder)}
          {grupo(APK.respondido, grupos.respondidos)}
        </>
      ) : null}
    </View>
  );
}

// ─── Una solicitud: responder, corregir, revisar lo cargado (API-FRI-01, 03, 04, 05 y 08) ───────

interface Datos {
  readonly detalle: DetalleDeSolicitudV2;
  readonly plantilla: VersionDePlantillaV2;
}

/** La ayuda de una pregunta: su texto de ayuda (o uno por defecto) y para qué se usa el dato. */
function ayudaDe(c: CampoDePlantillaV2, porDefecto?: string): string | undefined {
  const partes = [c.helpText ?? porDefecto, c.purpose ? `${COPY_FORMULARIOS_V2.paraQue}: ${c.purpose}` : null].filter((p): p is string => !!p);
  return partes.length ? partes.join(' ') : undefined;
}

/** Las respuestas en palabras, por sección, con las etiquetas de la plantilla: lo guardado y lo cargado se leen igual. */
function RespuestasEnPalabras({ datos, respuestas, comoSecciones }: { datos: Datos; respuestas: readonly RespuestaDeCampoV2Entrada[]; comoSecciones: boolean }) {
  const partes = seccionesEnPalabras(datos.plantilla.sections, datos.detalle.request, respuestas);
  return (
    <>
      {partes.map((s) =>
        comoSecciones ? (
          <Seccion key={s.sectionCode} titulo={s.titulo}>
            {s.lineas.map((l) => (
              <Dato key={l.fieldCode} etiqueta={l.etiqueta} valor={l.valor ?? COPY_FORMULARIOS_V2.sinResponder} apilado />
            ))}
          </Seccion>
        ) : (
          <View key={s.sectionCode}>
            {partes.length > 1 ? <Subtitulo>{s.titulo}</Subtitulo> : null}
            {s.lineas.map((l) => (
              <Dato key={l.fieldCode} etiqueta={l.etiqueta} valor={l.valor ?? COPY_FORMULARIOS_V2.sinResponder} apilado />
            ))}
          </View>
        ),
      )}
    </>
  );
}

/**
 * Una solicitud propia: responder, corregir, revisar lo que cargó el profesional o solo ver. El estado de la carga, el
 * problema y la suspensión viven en `reducirFormulario` (dominio, `recuperacion-de-formulario.ts`); el borrador V2, en
 * `reducirBorrador` (`formulario-v2.ts`), con sus pruebas:
 * - qué se puede hacer sale del contrato: FRI-03 trae la solicitud, la respuesta, la propuesta y `respondable` (el PDP);
 * - la carga y su reintento son una sola operación con intención («abrir» o «recuperar»);
 * - el borrador solo se limpia cuando un envío se registra, y cargar nunca reenvía;
 * - con algo cargado por el profesional, primero se lee en palabras; «Corregir» abre el formulario con eso precargado
 *   y confirmar manda lo que quedó, con la versión de lo cargado (`fromProposal`).
 */
export function PantallaDeMiSolicitud({
  token,
  id,
  salir,
  volver,
  ir,
  subir,
}: {
  token: string;
  id: string;
  salir: (m: Salida) => void;
  volver: () => void;
  ir: (r: Ruta) => void;
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [estado, despachar] = useReducer(reducirFormulario, estadoInicialDeFormulario);
  const [borrador, editar] = useReducer(reducirBorrador, BORRADOR_VACIO);
  /** Lo que se precargó (la respuesta vigente o lo cargado): sin tocarlo, no hay nada «sin guardar». */
  const [base, setBase] = useState<Borrador>(BORRADOR_VACIO);
  const borradorActual = useRef(borrador);
  borradorActual.current = borrador;
  const [datos, setDatos] = useState<Datos | null>(null);
  /** Avisos por campo, subcampo o parte: lo que no se entiende o la API no aceptó se marca ahí, no se descarta en silencio. */
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** Cada envío vuelve a montar el aviso, así se anuncia aunque el texto sea el mismo que en el intento anterior. */
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  /** Con algo cargado por el profesional: la persona eligió corregirlo en el formulario en vez de leerlo en palabras. */
  const [corrigiendo, setCorrigiendo] = useState(false);
  const clave = useClaveDeIntento();
  const motivo = estado.borrador.motivo;
  // El borrador (lo tocado y el motivo) se declara: salir por la barra, la cabecera o atrás pregunta antes (DL-117).
  useCambiosSinGuardar((hayAlgoEscrito(borrador) && !mismoBorrador(borrador, base)) || motivo.trim() !== '' ? 'tus respuestas' : null);

  const precargar = useCallback((valores: Borrador) => {
    editar({ tipo: 'cargar', valores });
    setBase(valores);
    setErrores({});
  }, []);

  /**
   * Lee el detalle (FRI-03, con `respondable`) y la estructura (FRI-01). Una sola función para abrir, recuperar y
   * reintentar: el resultado lo interpreta el reductor según la intención. Leer no toca la clave de idempotencia ni el
   * borrador, salvo para precargar la respuesta vigente la primera vez que se abre una que se puede corregir.
   */
  const cargar = useCallback(
    async (intencion: Intencion) => {
      despachar({ tipo: 'cargar', intencion });
      const fallar = (r: Resultado<unknown>) => despachar({ tipo: 'carga-fallida', sinConexion: !r.ok && r.tipo === 'RED' });
      const r = await api.consultarVistaDeSolicitud(token, id);
      if (sesionPerdida(r)) return;
      // DL-115 · sin A3, lo propio no se lee (08:406): ni la solicitud ni la respuesta. Lo escrito queda en el estado.
      if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') return despachar({ tipo: 'carga-sin-a3' });
      if (!r.ok) return fallar(r);
      const { request, response, respondable } = r.datos.data;
      const v = await api.consultarDefinicionDePlantilla(token, request.templateId, request.templateVersionId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return fallar(v);
      setDatos({ detalle: r.datos.data, plantilla: v.datos.data });
      // Para corregir, se parte de lo que vale hoy: la persona cambia lo que cambió y la historia queda (09:1618).
      if (intencion === 'abrir' && response && !hayAlgoEscrito(borradorActual.current)) precargar(borradorDeRespuestas(v.datos.data.sections, respuestasVigentes(response)));
      despachar({ tipo: 'carga-lista', vista: { status: request.status, response, respondable } });
    },
    [token, id, sesionPerdida, precargar],
  );

  useEffect(() => {
    void cargar('abrir');
  }, [cargar]);

  const terminarEscritura = useCallback(
    (texto: string) => {
      despachar({ tipo: 'enviado', texto });
      editar({ tipo: 'limpiar' });
      setBase(BORRADOR_VACIO);
      setErrores({});
      setCorrigiendo(false);
      subir();
      void cargar('abrir');
    },
    [cargar, subir],
  );

  // «No es correcto»: un diálogo propio de la app, y después API-FRI-08. Lo cargado se borra; la solicitud sigue pendiente.
  const rechazo = useAccionConfirmada({
    sesionPerdida,
    alTerminar: () => terminarEscritura(APK.rechazado),
    alRecargar: () => void cargar('abrir'),
    propios: { RESOURCE_NOT_FOUND: { mensaje: T.propuestaYaNoEsta, tipo: 'actualizar' }, FORM_REQUEST_NOT_RESPONDABLE: { mensaje: COPY_FORMULARIOS.noSePuedeResponderYa, tipo: 'actualizar' } },
  });

  if (estado.carga.tipo === 'sin-a3') {
    return (
      <View>
        <Titulo>{COPY_FORMULARIOS.pestana}</Titulo>
        <Aviso tipo="info" titulo={COPY_FORMULARIOS.necesitaA3}>
          <Boton texto={COPY_FORMULARIOS.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
          <Boton texto={COPY_FORMULARIOS.volverAMisSolicitudes} tipo="enlace" onPress={volver} />
        </Aviso>
      </View>
    );
  }
  if (estado.carga.tipo === 'error') {
    // El reintento conserva la intención: si era recuperar lo guardado, sigue siéndolo y termina con el mismo aviso.
    const intencion = estado.carga.intencion;
    return <ErrorConReintento sinConexion={estado.carga.sinConexion} onReintentar={() => void cargar(intencion)} />;
  }
  if (estado.carga.tipo === 'cargando' || !datos) return <Cargando />;

  const { request, response, proposal } = datos.detalle;
  const secciones = datos.plantilla.sections;
  const vista = estado.carga.vista;
  const puede = habilitacion(vista);
  const campos = camposEnOrden(secciones);
  const pedidos = new Set(request.requestedFieldCodes);
  const visibles = camposQueSeVen(secciones, request, borrador);
  const esCorreccion = response !== null;
  /** Lo cargado por el profesional se confirma (tal cual o corregido) solo mientras la solicitud admite responder. */
  const desdePropuesta = proposal !== null && puede.modo === 'responder';
  const enRevision = desdePropuesta && !corrigiendo;
  const problema = estado.problema;
  // Si se abrió una solicitud que no admite acción y no hay otro problema a la vista, se dice por qué, con salidas.
  const sinAccion =
    !problema && puede.modo === 'sin-accion' ? (puede.motivo === 'no-admite-respuesta' ? COPY_FORMULARIOS.yaNoSePuedeResponder : COPY_FORMULARIOS.noSePuedeCorregirYa) : null;

  const limpiarError = (fieldCode: string) => {
    if (!Object.keys(errores).some((k) => k === fieldCode || k.startsWith(`${fieldCode}/`))) return;
    setErrores((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== fieldCode && !k.startsWith(`${fieldCode}/`))));
  };

  /** Abre el formulario con lo cargado precargado: lo que cambie queda como respuesta de la persona al confirmar. */
  const corregirLoCargado = () => {
    if (!proposal) return;
    precargar(borradorDeRespuestas(secciones, proposal.answers));
    setCorrigiendo(true);
    subir();
  };

  /** Deja el formulario y vuelve a leer lo cargado en palabras; lo tocado se descarta. */
  const volverALoCargado = () => {
    precargar(BORRADOR_VACIO);
    setCorrigiendo(false);
    subir();
  };

  /**
   * Envía: `borrador` manda lo que está en los campos; `tal-cual` confirma lo cargado sin abrir el formulario. En los dos
   * casos se revisa con las reglas del dominio antes, y lo que no pasa vuelve a su campo (si hace falta, abriendo el
   * formulario con lo cargado para que se vea qué falta).
   */
  async function enviar(origen: 'borrador' | 'tal-cual') {
    setEnvios((n) => n + 1);
    const armadas: RespuestasArmadas = origen === 'tal-cual' && proposal ? { respuestas: proposal.answers, errores: {}, idsDeRenglones: {} } : armarRespuestas(secciones, request, borrador);
    const antes = problemasAntesDeEnviar(secciones, request, armadas);
    if (antes) {
      if (origen === 'tal-cual') corregirLoCargado();
      setErrores(antes.errores);
      return despachar({ tipo: 'rechazado', desenlace: { tipo: 'por-campo', errores: antes.errores, resumen: antes.titulo, lineas: antes.lineas } });
    }
    // La API pide al menos una respuesta (min(1)); el mensaje dice eso, no que falta un requerido (D-C3).
    if (armadas.respuestas.length === 0) return despachar({ tipo: 'problema-local', titulo: COPY_FORMULARIOS.sinNingunaRespuesta });
    setErrores({});
    despachar({ tipo: 'enviando' });
    setEnviando(true);
    const answers = [...armadas.respuestas];
    const r = esCorreccion
      ? await api.corregirRespuestaV2(token, response.formResponseId, { expectedVersion: response.version, reason: motivo, answers }, clave.actual())
      : await api.responderSolicitudV2(token, id, { answers, fromProposal: desdePropuesta && proposal ? { proposalId: proposal.proposalId, expectedVersion: proposal.version } : null }, clave.actual());
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      // Un rechazo por los datos vuelve a cada campo; ya no se puede, versión vieja o envío anterior guardado: el reductor
      // lo traduce y suspende el envío hasta volver a leer. Lo escrito queda y no se reenvía solo.
      const desenlace = rechazoV2(r, campos, armadas, { desdePropuesta }) ?? desenlaceDeEnvio(r, [], { esCorreccion });
      if (desenlace) {
        if (desenlace.tipo === 'por-campo') {
          if (origen === 'tal-cual') corregirLoCargado();
          setErrores(desenlace.errores);
        }
        return despachar({ tipo: 'rechazado', desenlace });
      }
      // Red, servicio o no disponible: `falloDe`. Si el resultado es incierto, se reintenta con la misma clave.
      const fallo = falloDe(r);
      return despachar({ tipo: 'fallo', titulo: fallo.mensaje, incierto: fallo.tipo === 'incierto' });
    }
    const texto = esCorreccion
      ? COPY_FORMULARIOS.rectificacionEnviada
      : desdePropuesta && proposal
        ? [APK.confirmado, origen === 'borrador' ? APK.corregidas(cuantasCorrigio(secciones, proposal.answers, answers)) : null].filter(Boolean).join(' ')
        : COPY_FORMULARIOS.respuestaEnviada;
    terminarEscritura(texto);
  }

  const acciones = (lista: readonly Accion[]) => (
    <>
      {lista.includes('recuperar') ? (
        <Boton texto={esCorreccion || puede.modo !== 'sin-accion' ? COPY_FORMULARIOS.cargarLoGuardado : COPY_FORMULARIOS.actualizarEstado} tipo="secundario" onPress={() => void cargar('recuperar')} />
      ) : null}
      {lista.includes('privacidad') ? <Boton texto={COPY_FORMULARIOS.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} /> : null}
      {lista.includes('volver') ? <Boton texto={COPY_FORMULARIOS.volverAMisSolicitudes} tipo="enlace" onPress={volver} /> : null}
    </>
  );

  const avisoDeProblema = problema ? (
    <Aviso key={envios} tipo="error" titulo={problema.titulo}>
      {problema.lineas.map((l) => (
        <Parrafo key={l}>{l}</Parrafo>
      ))}
      {acciones(problema.acciones)}
    </Aviso>
  ) : null;

  const dialogoDeRechazo = proposal ? (
    <DialogoDeConfirmacion
      visible={rechazo.visible}
      titulo={APK.rechazar}
      textoConfirmar={APK.rechazarSi}
      textoEnviando={T.rechazando}
      peligro
      enviando={rechazo.enviando}
      fallo={rechazo.fallo}
      onVolver={rechazo.volver}
      onActualizar={rechazo.actualizar}
      onConfirmar={() => void rechazo.ejecutar((claveDeIntento) => api.rechazarPropuestaDeRespuesta(token, id, { expectedVersion: proposal.version }, claveDeIntento))}
    >
      <Parrafo>{APK.rechazarPregunta}</Parrafo>
    </DialogoDeConfirmacion>
  ) : null;

  // ─── Revisá lo que cargó {profesional} (FI-06): en palabras, con el efecto escrito antes de confirmar ──────────
  if (enRevision && proposal) {
    const profesional = proposal.professional.displayName;
    return (
      <View>
        <Titulo>{APK.revisarTitulo(profesional)}</Titulo>
        <Parrafo tenue>{APK.revisarBajada(profesional, request.templateName, fecha(proposal.loadedAt))}</Parrafo>
        {estado.aviso ? <Aviso tipo={estado.aviso.tipo} titulo={estado.aviso.texto} /> : null}
        <RespuestasEnPalabras datos={datos} respuestas={proposal.answers} comoSecciones />
        <Seccion titulo={COPY_FORMULARIOS.responder}>
          <Parrafo>{APK.efectoDeConfirmar}</Parrafo>
          <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo>
          {avisoDeProblema}
          <Boton texto={problema?.incierto ? COPY.reintentar : APK.confirmar} onPress={() => void enviar('tal-cual')} ocupado={enviando} deshabilitado={enviando || !sePuedeEnviar(estado)} />
          <Boton texto={APK.corregir} tipo="secundario" onPress={corregirLoCargado} deshabilitado={enviando} />
          <Boton texto={APK.rechazar} tipo="peligroSecundario" onPress={rechazo.abrir} deshabilitado={enviando} />
        </Seccion>
        {dialogoDeRechazo}
      </View>
    );
  }

  // ─── El formulario: los nueve tipos, por sección, solo lo pedido y lo que se ve con lo respondido ────────────
  const dibujarCampo = (c: CampoDePlantillaV2) => {
    const etiqueta = rotuloDe(c, request);
    const error = errores[c.fieldCode] ?? null;
    const cabecera = { etiqueta, ayuda: c.helpText, paraQue: c.purpose, error };
    const tocar = (fieldCode: string) => limpiarError(fieldCode);
    switch (c.dataType) {
      case 'TEXT':
        return (
          <Campo
            key={c.fieldCode}
            etiqueta={etiqueta}
            ayuda={ayudaDe(c, COPY_FORMULARIOS.omitirCampo)}
            value={valorComo(borrador, c.fieldCode, 'TEXT').texto}
            error={error}
            onChangeText={(t) => {
              editar({ tipo: 'escribir', fieldCode: c.fieldCode, como: 'TEXT', texto: t });
              tocar(c.fieldCode);
            }}
            maxLength={c.maxLength}
            {...(c.multiline ? { multiline: true, style: [ui.entrada, estilos.textoLargo, error ? ui.entradaConError : null] } : {})}
          />
        );
      case 'NUMBER':
        return (
          <Campo
            key={c.fieldCode}
            etiqueta={c.unit ? `${etiqueta} (${c.unit})` : etiqueta}
            ayuda={ayudaDe(c, c.limits ? valoresAdmitidos(c.limits, c.unit) : COPY_FORMULARIOS.omitirCampo)}
            value={valorComo(borrador, c.fieldCode, 'NUMBER').texto}
            error={error}
            onChangeText={(t) => {
              editar({ tipo: 'escribir', fieldCode: c.fieldCode, como: 'NUMBER', texto: t });
              tocar(c.fieldCode);
            }}
            // El teclado decimal de Android puede ofrecer coma: por eso el valor se lee con `leerNumero` al enviar.
            keyboardType="decimal-pad"
          />
        );
      case 'BOOLEAN':
        // Sí/No se elige entre dos opciones: escribirlo obligaría a interpretar el texto, y lo mal interpretado
        // quedaría guardado como declarado por la persona (09 §22.7).
        return (
          <CampoSiONo
            key={c.fieldCode}
            etiqueta={etiqueta}
            ayuda={ayudaDe(c, COPY_FORMULARIOS.elegiSiONo)}
            opciones={OPCIONES_SI_O_NO}
            valor={valorComo(borrador, c.fieldCode, 'BOOLEAN').eleccion}
            onCambio={(v) => {
              editar({ tipo: 'elegir-si-o-no', fieldCode: c.fieldCode, eleccion: v as EleccionSiONo });
              tocar(c.fieldCode);
            }}
            pista={COPY_FORMULARIOS.volverASinResponder}
          />
        );
      case 'CHOICE': {
        const v = valorComo(borrador, c.fieldCode, 'CHOICE');
        return (
          <OpcionUnica
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            valor={v.opcion}
            otro={v.otro}
            onCambio={(opcion) => {
              editar({ tipo: 'elegir-opcion', fieldCode: c.fieldCode, opcion });
              tocar(c.fieldCode);
            }}
            onOtro={(texto) => editar({ tipo: 'escribir-otro', fieldCode: c.fieldCode, texto })}
          />
        );
      }
      case 'MULTI_CHOICE': {
        const v = valorComo(borrador, c.fieldCode, 'MULTI_CHOICE');
        return (
          <OpcionesMultiples
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            elegidas={v.opciones}
            otro={v.otro}
            onAlternar={(opcion) => {
              editar({ tipo: 'alternar-opcion', fieldCode: c.fieldCode, opcion, exclusivas: c.exclusiveOptionCodes, maximo: c.maxSelected });
              tocar(c.fieldCode);
            }}
            onOtro={(texto) => editar({ tipo: 'escribir-otro', fieldCode: c.fieldCode, texto })}
          />
        );
      }
      case 'LIST':
        return (
          <ListaQueSeRepite
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            renglones={valorComo(borrador, c.fieldCode, 'LIST').renglones}
            errores={errores}
            onSumar={() => editar({ tipo: 'sumar-renglon', fieldCode: c.fieldCode, maximo: c.maxItems })}
            onQuitar={(renglon) => {
              editar({ tipo: 'quitar-renglon', fieldCode: c.fieldCode, id: renglon });
              tocar(c.fieldCode);
            }}
            onEditar={(renglon, code, valor) => {
              editar({ tipo: 'editar-subcampo', fieldCode: c.fieldCode, id: renglon, code, valor });
              tocar(c.fieldCode);
            }}
          />
        );
      case 'MATRIX':
        return (
          <TablaDeOpciones
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            celdas={valorComo(borrador, c.fieldCode, 'MATRIX').celdas}
            onElegir={(fila, columna) => {
              editar({ tipo: 'elegir-celda', fieldCode: c.fieldCode, fila, columna });
              tocar(c.fieldCode);
            }}
          />
        );
      case 'FOODS':
        return (
          <CampoDeAlimentos
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            alimentos={valorComo(borrador, c.fieldCode, 'FOODS').alimentos}
            onAlternarSugerido={(nombre) => {
              editar({ tipo: 'alternar-alimento', fieldCode: c.fieldCode, nombre, maximo: c.maxItems });
              tocar(c.fieldCode);
            }}
            onSumar={(nombre) => {
              editar({ tipo: 'sumar-alimento', fieldCode: c.fieldCode, nombre, maximo: c.maxItems });
              tocar(c.fieldCode);
            }}
            onQuitar={(nombre) => {
              editar({ tipo: 'quitar-alimento', fieldCode: c.fieldCode, nombre });
              tocar(c.fieldCode);
            }}
            onMotivo={(nombre, motivoDelAlimento) => editar({ tipo: 'motivo-de-alimento', fieldCode: c.fieldCode, nombre, motivo: motivoDelAlimento })}
          />
        );
      case 'TIMES':
        return (
          <CampoDeHorarios
            key={c.fieldCode}
            cabecera={cabecera}
            campo={c}
            horas={valorComo(borrador, c.fieldCode, 'TIMES').horas}
            errores={errores}
            onEditar={(parte, texto) => {
              editar({ tipo: 'escribir-hora', fieldCode: c.fieldCode, parte, texto });
              tocar(c.fieldCode);
            }}
          />
        );
    }
  };

  const textoDelBoton = problema?.incierto ? COPY.reintentar : esCorreccion ? COPY_FORMULARIOS.rectificar : desdePropuesta ? APK.confirmar : COPY_FORMULARIOS.enviarRespuesta;

  return (
    <View>
      <Titulo>{request.templateName}</Titulo>
      <Parrafo tenue>
        {COPY_FORMULARIOS.pedidoPor} {request.professional.displayName} · {request.purpose}
      </Parrafo>
      {!esCorreccion && !desdePropuesta && datos.plantilla.estimatedMinutes !== null ? <Parrafo tenue icono="reloj">{COPY_FORMULARIOS_V2.minutos(datos.plantilla.estimatedMinutes)}</Parrafo> : null}
      {/* El texto va como título del aviso: así se anuncia al lector de pantalla y se lee en negrita, como todos (D-C3). */}
      {estado.aviso ? <Aviso tipo={estado.aviso.tipo} titulo={estado.aviso.texto} /> : null}

      {response ? (
        <Seccion titulo={COPY_FORMULARIOS.respuestaOriginal}>
          {response.effectiveView.kind === 'ORIGINAL' ? <Insignia texto={COPY_FORMULARIOS.vigente} positiva /> : null}
          {/* La procedencia (DL-164 D-4): quién lo cargó, cuándo se confirmó y cuánto se corrigió antes. */}
          {response.transcription ? (
            <Parrafo tenue icono="persona">
              {T.transcripcion(response.transcription.professional.displayName, fecha(response.transcription.loadedAt), fecha(response.transcription.confirmedAt))} {T.corregisteAntes(response.transcription.correctedFieldCodes.length)}
            </Parrafo>
          ) : null}
          <RespuestasEnPalabras datos={datos} respuestas={response.original.answers} comoSecciones={false} />
          {response.rectifications.map((c) => (
            <View key={c.rectificationId}>
              <Parrafo tenue>
                {COPY_FORMULARIOS.correccion} · {fecha(c.recordedAt)} · {c.reason}
              </Parrafo>
              {response.effectiveView.kind === 'RECTIFIED' && response.effectiveView.rectificationId === c.rectificationId ? <Insignia texto={COPY_FORMULARIOS.vigente} positiva /> : null}
              <RespuestasEnPalabras datos={datos} respuestas={c.answers} comoSecciones={false} />
            </View>
          ))}
          <Ayuda>
            <Parrafo tenue>{COPY_FORMULARIOS.rectificarConservaHistoria}</Parrafo>
          </Ayuda>
        </Seccion>
      ) : null}

      {desdePropuesta && proposal ? (
        <Aviso tipo="info" titulo={T.loQueCargo(proposal.professional.displayName)}>
          <Parrafo tenue>{T.corrigiendo}</Parrafo>
          <Boton texto={T.volverALoCargado} tipo="enlace" onPress={volverALoCargado} />
        </Aviso>
      ) : null}
      <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo>
      {estado.borradorSinEnviar ? <Parrafo>{COPY_FORMULARIOS.borradorSinEnviar}</Parrafo> : null}

      {secciones.map((s) => {
        const delFormulario = s.fields.filter((c) => pedidos.has(c.fieldCode) && visibles.has(c.fieldCode));
        if (delFormulario.length === 0) return null;
        return (
          <Seccion key={s.sectionCode} titulo={s.title}>
            {s.intro ? <Parrafo tenue>{s.intro}</Parrafo> : null}
            {delFormulario.map(dibujarCampo)}
          </Seccion>
        );
      })}

      <Seccion titulo={esCorreccion ? COPY_FORMULARIOS.rectificar : COPY_FORMULARIOS.responder}>
        {esCorreccion ? <Campo etiqueta={COPY_FORMULARIOS.motivoDeRectificacion} value={motivo} maxLength={LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION} onChangeText={(m) => despachar({ tipo: 'editar-motivo', motivo: m })} /> : null}
        {desdePropuesta ? <Parrafo>{APK.efectoDeConfirmar}</Parrafo> : null}
        {avisoDeProblema}
        {sinAccion ? (
          <Aviso tipo="info" titulo={sinAccion}>
            {acciones(['recuperar', 'volver'])}
          </Aviso>
        ) : null}
        <Boton
          texto={textoDelBoton}
          onPress={() => void enviar('borrador')}
          ocupado={enviando}
          // Solo se envía si la solicitud lo admite y ningún rechazo conocido lo suspendió (`sePuedeEnviar`).
          deshabilitado={enviando || !sePuedeEnviar(estado) || (esCorreccion && motivo.trim().length === 0)}
        />
        {desdePropuesta ? <Boton texto={APK.rechazar} tipo="peligroSecundario" onPress={rechazo.abrir} deshabilitado={enviando} /> : null}
      </Seccion>
      {dialogoDeRechazo}
    </View>
  );
}

const estilos = estilosPorTema(() => ({
  // Un texto de varias líneas, con lo escrito arriba: el estilo del campo, más alto (como en «Comí algo diferente»).
  textoLargo: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
}));
