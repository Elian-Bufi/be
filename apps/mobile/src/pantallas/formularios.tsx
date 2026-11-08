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
 * - **lo cargado y no confirmado no queda en el perfil**: «No es correcto» lo borra y la solicitud sigue pendiente (D-6);
 * - **una parte por pantalla** (DL-165 D-1): «Parte N de M», «Anterior» y «Siguiente», y un repaso antes de enviar. Pasar
 *   de parte no exige nada: si quedó una obligatoria sin responder, la parte siguiente lo dice y deja volver. Un problema
 *   al enviar lleva a la parte de la primera pregunta marcada (`partes-de-formulario.ts`, del dominio).
 *
 * `respondable` lo decide la API en cada lectura, con la política vigente: si el vínculo se pausó o el consentimiento
 * se revocó, la solicitud sigue estando —es de la persona— pero ya no se puede responder.
 */
import {
  camposEnOrden,
  CODIGO_DE_LA_PARTE_DE_HABITOS,
  COPY,
  COPY_FORMULARIOS,
  COPY_FORMULARIOS_V2,
  COPY_HABITOS,
  desenlaceDeEnvio,
  estadoInicialDeFormulario,
  habilitacion,
  LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION,
  obligatoriasSinResponderDeLaParte,
  obligatoriosSinResponder,
  partesDelFormulario,
  pasoAcotado,
  pasoDelRepaso,
  preguntasQueSeVen,
  primeraParteCon,
  reducirFormulario,
  seOfreceQuitarRespuesta,
  sePuedeEnviar,
  topeDesdeLaTabla,
  type Accion,
  type CampoDePlantillaV2,
  type DetalleDeSolicitudV2,
  type Intencion,
  type ParteDelFormulario,
  type RespuestaDeCampoV2Entrada,
  type Resultado,
  type SolicitudPropiaV2,
  type VersionDePlantillaV2,
} from '@be/domain';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import { api } from '../api';
import { baseDelBorrador, hayQueGuardar, restauracionDe, type LecturaDelBorrador } from '../borrador-de-formulario';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { DialogoDeConfirmacion, useAccionConfirmada } from '../dialogo';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { dia, fecha } from '../formato';
import { borradoresDeFormularios as borradores } from '../formularios-en-el-telefono';
import {
  anuncioDeLaParte,
  armarRespuestas,
  BORRADOR_VACIO,
  borradorDeRespuestas,
  camposDeLosErrores,
  camposQueSeVen,
  cuantasCorrigio,
  cuantoFaltaEnPalabras,
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
  tieneAlgo,
  valorDe,
  type Borrador,
  type RespuestasArmadas,
} from '../formulario-v2';
import { precargaDelFormulario, seOfrecePrecargaDeHabitos } from '../habitos-en-el-telefono';
import { falloDe, useClaveDeIntento } from '../intento';
import { useLecturaRecordada } from '../lecturas';
import { leerLista } from '../lecturas-de-las-zonas';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { PreguntaV2 } from '../pregunta-v2';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { Aviso, Ayuda, Boton, Campo, Dato, Desplegable, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo, estilosPorTema } from '../ui';

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: readonly SolicitudPropiaV2[] } | { tipo: 'error'; sinConexion: boolean };

const V = COPY_FORMULARIOS_V2;
const APK = V.apk;

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
      {/* DL-165 D-3: no se dice cuánto lleva; lo dice «Parte 1 de 6» al abrirla. */}
      {s.respondable ? (
        <Boton texto={propuesta ? T.revisar : COPY_FORMULARIOS.completar} onPress={abrir} />
      ) : s.status === 'RESPONDED' ? (
        <Boton texto={T.verMiRespuesta} tipo="secundario" onPress={abrir} />
      ) : propuesta ? (
        // En pausa pero con algo cargado: se puede ver y, si no es correcto, descartar (FRI-08 no depende del PDP).
        <>
          <Parrafo tenue>{T.porAhoraNoSePuedeResponder}</Parrafo>
          <Boton texto={T.revisar} tipo="secundario" onPress={abrir} />
        </>
      ) : (
        <Parrafo tenue>{COPY_FORMULARIOS.yaNoSePuedeResponder}</Parrafo>
      )}
    </Tarjeta>
  );
}

export function PantallaDeFormularios({ token, identidadId, salir, ir }: { token: string; identidadId: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const pedir = useCallback(async () => {
    const r = await leerLista(api, token);
    // FR-01 · con la bandeja recién leída (nunca con la recordada), se borra del teléfono lo escrito en solicitudes que
    // ya no están pendientes.
    if (r.ok) void borradores.conservarSegunLaLista(identidadId, r.datos.solicitudes, r.datos.completa);
    return r;
  }, [token, identidadId]);
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
      {/* DL-165 D-9 (FR-10): «Mis hábitos», arriba de la bandeja. Es lo que la persona contó de su día y su semana, y la
          autorización para compartirlo con sus profesionales. */}
      <Tarjeta>
        <Subtitulo>{COPY_HABITOS.apk.entradaTitulo}</Subtitulo>
        <Parrafo tenue>{COPY_HABITOS.apk.entradaBajada}</Parrafo>
        <Boton texto={COPY_HABITOS.apk.verMisHabitos} tipo="secundario" onPress={() => ir({ nombre: 'mis-habitos' })} />
      </Tarjeta>
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
 *   y confirmar manda lo que quedó, con la versión de lo cargado (`fromProposal`);
 * - lo propio (lo tocado y el motivo) se guarda cifrado en el teléfono, por cuenta y por solicitud (FR-01,
 *   `borrador-de-formulario.ts`): sobrevive a que se cierre la app, vuelve al abrir la solicitud antes que la precarga, y
 *   se borra al enviar, al descartar lo cargado (si no era lo de la persona) o cuando ya no queda nada propio.
 */
export function PantallaDeMiSolicitud({
  token,
  identidadId,
  id,
  salir,
  volver,
  ir,
  subir,
}: {
  token: string;
  identidadId: string;
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
  /**
   * FR-01 · el borrador en el teléfono. `esperando`: todavía no se decidió qué se restaura, y no se escribe nada (lo vacío
   * del primer dibujo borraría lo guardado). `activo`: lo propio se guarda con cada cambio. `sin-telefono`: no se pudo
   * leer lo guardado, y no se escribe encima de lo que no se vio: lo escrito queda solo en la pantalla, como antes.
   */
  const [enElTelefono, setEnElTelefono] = useState<'esperando' | 'activo' | 'sin-telefono'>('esperando');
  /** La última escritura en el teléfono falló: lo escrito sigue en la pantalla, pero un cierre lo perdería. */
  const [falloAlGuardar, setFalloAlGuardar] = useState(false);
  /** Lo que se mostró venía del teléfono: la pantalla lo dice hasta que se envíe. */
  const [recuperado, setRecuperado] = useState(false);
  /** Lo guardado se lee una sola vez por visita, junto con la primera consulta a la API. */
  const lecturaGuardada = useRef<Promise<LecturaDelBorrador> | null>(null);
  const restauracionDecidida = useRef(false);
  /** Si puede haber algo de esta solicitud guardado en el teléfono: si no, no hace falta borrar nada. */
  const hayAlgoGuardado = useRef(false);
  /** Avisos por campo, subcampo o parte: lo que no se entiende o la API no aceptó se marca ahí, no se descarta en silencio. */
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** Cada envío vuelve a montar el aviso, así se anuncia aunque el texto sea el mismo que en el intento anterior. */
  const [envios, setEnvios] = useState(0);
  const [enviando, setEnviando] = useState(false);
  /** Con algo cargado por el profesional: la persona eligió corregirlo en el formulario en vez de leerlo en palabras. */
  const [corrigiendo, setCorrigiendo] = useState(false);
  /**
   * DL-165 D-1 · la parte que se ve, desde 0; una más que la última es el repaso. No se guarda en el teléfono: al volver,
   * el formulario abre en la primera parte con lo escrito.
   */
  const [paso, setPaso] = useState(0);
  /** Lo que quedó sin responder en la parte que se acaba de dejar: la siguiente lo dice y deja volver. */
  const [quedaron, setQuedaron] = useState<{ readonly indice: number; readonly titulo: string; readonly n: number } | null>(null);
  /**
   * DL-165 D-18 · «¿Sigue igual?»: de cuándo es lo vigente de «Tus hábitos» que se precargó, para decirlo en esa parte.
   * `null`: no se precargó nada (hay respuesta, algo cargado, un borrador recuperado, o la persona no tiene hábitos).
   */
  const [habitosDesde, setHabitosDesde] = useState<string | null>(null);
  const clave = useClaveDeIntento();
  const motivo = estado.borrador.motivo;
  /** La persona escribió algo propio (no lo precargado sin tocar): se declara al salir y se le dice que sigue ahí. */
  const tieneBorradorPropio = hayAlgoEscrito(borrador) && !mismoBorrador(borrador, base);
  const hayAlgoPropio = tieneBorradorPropio || motivo.trim() !== '';
  /** Lo propio no está protegido ante un cierre: no se pudo leer lo guardado, o la última escritura falló. */
  const sinProteger = enElTelefono === 'sin-telefono' || falloAlGuardar;
  // Salir por la barra, la cabecera o atrás pregunta antes solo si lo escrito se perdería (DL-117): guardado en el
  // teléfono, no se pierde, y la pregunta «¿Salir sin guardar?» no sería cierta. Es la regla del entrenamiento (PA-02).
  useCambiosSinGuardar(hayAlgoPropio && (enElTelefono !== 'activo' || falloAlGuardar) ? 'tus respuestas' : null);

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
      // FR-01 · lo guardado en el teléfono se lee mientras se consulta la API (nunca lanza: si falla, dice «sin leer»).
      if (!restauracionDecidida.current && !lecturaGuardada.current) lecturaGuardada.current = borradores.leer(identidadId, id);
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
      // FR-01 · lo guardado vuelve antes que la precarga: si corresponde con lo que dice la API, es lo que se ve.
      let restaurado = false;
      if (!restauracionDecidida.current && lecturaGuardada.current) {
        const lectura = await lecturaGuardada.current;
        restauracionDecidida.current = true;
        if (lectura.tipo === 'sin-leer') setEnElTelefono('sin-telefono');
        else {
          const decision = restauracionDe(lectura.tipo === 'guardado' ? lectura.guardado : null, r.datos.data, v.datos.data.sections);
          if (decision.tipo === 'descartar') void borradores.borrar(identidadId, id);
          if (decision.tipo === 'restaurar') {
            editar({ tipo: 'cargar', valores: decision.borrador });
            setBase(decision.base);
            if (decision.motivo !== '') despachar({ tipo: 'editar-motivo', motivo: decision.motivo });
            setCorrigiendo(decision.corrigiendo);
            setRecuperado(true);
            hayAlgoGuardado.current = true;
            restaurado = true;
          }
          setEnElTelefono('activo');
        }
      }
      // Para corregir, se parte de lo que vale hoy: la persona cambia lo que cambió y la historia queda (09:1618).
      if (intencion === 'abrir' && response && !restaurado && !hayAlgoEscrito(borradorActual.current)) precargar(borradorDeRespuestas(v.datos.data.sections, respuestasVigentes(response)));
      // DL-165 D-18 · «¿Sigue igual?»: una solicitud nueva con la parte «Tus hábitos» abre con lo vigente de lo que pide.
      // Es lo propio de la persona, en su teléfono (API-HBT-01); lo que envíe es la respuesta del área que lo pidió. Si la
      // lectura falla, no hay vigente o ya hay algo escrito o recuperado, el formulario abre como siempre.
      const loCargado = r.datos.data.proposal;
      if (intencion === 'abrir' && seOfrecePrecargaDeHabitos({ response, proposal: loCargado, respondable, status: request.status }, v.datos.data.sections, restaurado || hayAlgoEscrito(borradorActual.current))) {
        const h = await api.misHabitos(token);
        if (sesionPerdida(h)) return;
        const precarga = h.ok ? precargaDelFormulario(v.datos.data.sections, request, h.datos.data.current) : null;
        if (precarga && !hayAlgoEscrito(borradorActual.current)) {
          precargar(borradorDeRespuestas(v.datos.data.sections, precarga.respuestas));
          setHabitosDesde(precarga.desde);
        }
      }
      despachar({ tipo: 'carga-lista', vista: { status: request.status, response, respondable } });
    },
    [token, identidadId, id, sesionPerdida, precargar],
  );

  useEffect(() => {
    void cargar('abrir');
  }, [cargar]);

  /**
   * FR-01 · lo propio se guarda en el teléfono con cada cambio, con una demora corta; si ya no queda nada propio, se
   * borra. Hasta decidir qué se restaura, o si no se pudo leer lo guardado, no se escribe nada.
   */
  const detalle = datos?.detalle ?? null;
  useEffect(() => {
    if (enElTelefono !== 'activo' || !detalle) return;
    if (!hayQueGuardar(borrador, base, motivo)) {
      if (hayAlgoGuardado.current) void borradores.borrar(identidadId, id);
      hayAlgoGuardado.current = false;
      setFalloAlGuardar(false);
      return;
    }
    hayAlgoGuardado.current = true;
    borradores.escribir(
      {
        version: 1,
        identidadId,
        formRequestId: id,
        templateVersionId: detalle.request.templateVersionId,
        base: baseDelBorrador({ response: detalle.response, proposal: detalle.proposal, corrigiendo }),
        borrador,
        motivo,
      },
      (guardado) => setFalloAlGuardar(!guardado),
    );
  }, [enElTelefono, detalle, borrador, base, motivo, corrigiendo, identidadId, id]);

  // Lo que esperaba su demora se guarda ya al salir de la pantalla y al pasar a segundo plano: Android puede cerrar la app.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento !== 'active') void borradores.guardarYa();
    });
    return () => {
      suscripcion.remove();
      void borradores.guardarYa();
    };
  }, []);

  /**
   * Una escritura quedó registrada: el aviso, volver a leer, y limpiar el borrador, salvo que la escritura no haya sido
   * de él (`conservarBorrador`): descartar lo que cargó el profesional no envía nada de lo que la persona escribió. Lo
   * que se limpia se borra también del teléfono; lo que se conserva sigue guardado.
   */
  const terminarEscritura = useCallback(
    (texto: string, opciones: { readonly conservarBorrador: boolean } = { conservarBorrador: false }) => {
      despachar({ tipo: 'enviado', texto });
      if (!opciones.conservarBorrador) {
        editar({ tipo: 'limpiar' });
        setBase(BORRADOR_VACIO);
        void borradores.borrar(identidadId, id);
        hayAlgoGuardado.current = false;
        setRecuperado(false);
        setHabitosDesde(null);
      }
      setErrores({});
      setCorrigiendo(false);
      setPaso(0);
      setQuedaron(null);
      subir();
      void cargar('abrir');
    },
    [cargar, subir, identidadId, id],
  );

  /**
   * «No es correcto»: un diálogo propio de la app, y después API-FRI-08. Lo cargado se borra; la solicitud sigue
   * pendiente. Lo que la persona había escrito (por ejemplo, antes de que apareciera lo cargado) queda en el formulario;
   * si estaba corrigiendo lo cargado, el borrador era eso y se limpia. Los fallos propios de FRI-08: el 409 (lo que se vio
   * ya no es lo pendiente: cambió, lo retiraron o ya se resolvió) pide volver a leer; el 404 y lo inesperado, `falloDe`.
   */
  const rechazo = useAccionConfirmada({
    sesionPerdida,
    alTerminar: () => terminarEscritura(APK.rechazado, { conservarBorrador: !corrigiendo }),
    alRecargar: () => void cargar('abrir'),
    propios: { VERSION_CONFLICT: { mensaje: T.propuestaCambioAntesDeDescartar, tipo: 'actualizar' } },
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
  const visibles = camposQueSeVen(secciones, request, borrador);
  const esCorreccion = response !== null;
  /** Hay algo cargado por el profesional que espera: se lee en palabras antes que nada. */
  const hayPropuesta = proposal !== null && !esCorreccion;
  /** Lo cargado se confirma (tal cual o corregido) solo mientras la solicitud admite responder. */
  const desdePropuesta = hayPropuesta && puede.modo === 'responder';
  /** En pausa (el PDP dice que no se puede responder) lo cargado igual se ve y se puede descartar: no confirmar ni corregir. */
  const revisionSinResponder = hayPropuesta && !desdePropuesta;
  const enRevision = hayPropuesta && !corrigiendo;
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
    setHabitosDesde(null);
    setCorrigiendo(true);
    setPaso(0);
    setQuedaron(null);
    subir();
  };

  /** Deja el formulario y vuelve a leer lo cargado en palabras; lo tocado se descarta. */
  const volverALoCargado = () => {
    precargar(BORRADOR_VACIO);
    setCorrigiendo(false);
    setPaso(0);
    setQuedaron(null);
    subir();
  };

  // ─── DL-165 D-1 · una parte por pantalla, y el repaso al final ────────────────────────────────────────────
  const partes = partesDelFormulario(secciones, request);
  const repaso = pasoDelRepaso(partes);
  const actual = pasoAcotado(partes, paso);
  const enRepaso = actual === repaso;
  const parte = enRepaso ? null : (partes[actual] ?? null);
  const porCodigo = new Map(campos.map((c) => [c.fieldCode, c] as const));
  /** Lo que se mandaría hoy: de ahí salen lo que falta en cada parte y el repaso. */
  const armadasHoy = armarRespuestas(secciones, request, borrador);

  /**
   * Cambia de parte. Hacia adelante, si en la que se deja quedó una obligatoria sin responder, la siguiente lo dice y deja
   * volver: pasar no exige nada, lo que frena es el envío. El lector de pantalla anuncia la parte nueva.
   */
  const irAlPaso = (destino: number) => {
    const siguiente = pasoAcotado(partes, destino);
    const faltan = parte && siguiente > actual ? obligatoriasSinResponderDeLaParte(parte, secciones, request, armadasHoy.respuestas) : [];
    setQuedaron(parte && faltan.length > 0 ? { indice: parte.indice, titulo: parte.titulo, n: faltan.length } : null);
    setPaso(siguiente);
    subir();
    const nueva = partes[siguiente];
    AccessibilityInfo.announceForAccessibility(nueva ? anuncioDeLaParte(partes.length, siguiente, nueva.titulo) : V.repaso);
  };

  /** Un problema al enviar lleva a la primera parte que tiene una pregunta marcada, con el aviso arriba. */
  const irAlProblema = (marcados: Readonly<Record<string, string>>) => {
    const destino = primeraParteCon(partes, camposDeLosErrores(marcados));
    setQuedaron(null);
    if (destino !== null) setPaso(destino);
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
      irAlProblema(antes.errores);
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
      const desenlace = rechazoV2(r, campos, armadas, { desdePropuesta, esCorreccion }) ?? desenlaceDeEnvio(r, [], { esCorreccion });
      if (desenlace) {
        if (desenlace.tipo === 'por-campo') {
          if (origen === 'tal-cual') corregirLoCargado();
          setErrores(desenlace.errores);
          irAlProblema(desenlace.errores);
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
        {/* El aviso de volver a consultar habla de campos y de enviar; acá se lee lo cargado, así que se dice para esta pantalla. */}
        {estado.aviso?.tipo === 'info' ? (
          <Aviso tipo="info" titulo={T.volvimosAConsultar}>
            {tieneBorradorPropio ? <Parrafo tenue>{T.loEscritoSigue}</Parrafo> : null}
          </Aviso>
        ) : estado.aviso ? (
          <Aviso tipo={estado.aviso.tipo} titulo={estado.aviso.texto} />
        ) : recuperado && tieneBorradorPropio ? (
          // FR-01 · lo que la persona había escrito volvió del teléfono, y sigue ahí si descarta lo cargado.
          <Aviso tipo="info" titulo={T.recuperamosLoEscrito}>
            <Parrafo tenue>{T.siDescartasLoCargado}</Parrafo>
          </Aviso>
        ) : null}
        <RespuestasEnPalabras datos={datos} respuestas={proposal.answers} comoSecciones />
        <Seccion titulo={COPY_FORMULARIOS.responder}>
          <Parrafo>{APK.efectoDeConfirmar}</Parrafo>
          <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo>
          {avisoDeProblema}
          {revisionSinResponder && !problema ? (
            <Aviso tipo="info" titulo={T.porAhoraNoSePuedeResponder}>
              <Parrafo tenue>{T.revisarSinResponder}</Parrafo>
              {acciones(['recuperar', 'volver'])}
            </Aviso>
          ) : null}
          <Boton texto={problema?.incierto ? COPY.reintentar : APK.confirmar} onPress={() => void enviar('tal-cual')} ocupado={enviando} deshabilitado={enviando || !sePuedeEnviar(estado)} />
          <Boton texto={APK.corregir} tipo="secundario" onPress={corregirLoCargado} deshabilitado={enviando || !desdePropuesta} />
          <Boton texto={APK.rechazar} tipo="peligroSecundario" onPress={rechazo.abrir} deshabilitado={enviando} />
        </Seccion>
        {dialogoDeRechazo}
      </View>
    );
  }

  // ─── El formulario: los nueve tipos, por sección, solo lo pedido y lo que se ve con lo respondido ────────────
  // Cada pregunta la dibuja `PreguntaV2` (la misma de «Mis hábitos»): el rótulo con «(Opcional)», «Quitar respuesta» en
  // una opcional con algo elegido (DL-165 D-2) y, en un número con su tope en una tabla, cuánto admite (D-5).
  const dibujarCampo = (c: CampoDePlantillaV2) => (
    <PreguntaV2
      key={c.fieldCode}
      campo={c}
      etiqueta={rotuloDe(c, request)}
      borrador={borrador}
      errores={errores}
      puedeQuitar={seOfreceQuitarRespuesta(c, request, tieneAlgo(valorDe(borrador, c)))}
      tope={topeDesdeLaTabla(c, secciones, armadasHoy.respuestas)}
      editar={editar}
      alTocar={limpiarError}
    />
  );

  const textoDelBoton = problema?.incierto ? COPY.reintentar : esCorreccion ? COPY_FORMULARIOS.rectificar : desdePropuesta ? APK.confirmar : COPY_FORMULARIOS.enviarRespuesta;
  const alEmpezar = actual === 0 && !enRepaso;
  const cuantoFalta = cuantoFaltaEnPalabras(partes.length, actual, enRepaso);
  const faltanEnTotal = obligatoriosSinResponder(secciones, request, armadasHoy.respuestas);

  return (
    <View>
      <Titulo>{request.templateName}</Titulo>
      {/* Quién lo pide, siempre a la vista; el para qué y «Podés no responder», plegados (PV-4, AV-08; GUIA III.7). */}
      <Parrafo tenue>
        {COPY_FORMULARIOS.pedidoPor} {request.professional.displayName}
      </Parrafo>
      <Desplegable titulo={TEXTOS_DE_LA_VUELTA.paraQueLoPide} variante="enlace" icono="pregunta">
        <Parrafo tenue>{request.purpose}</Parrafo>
        <Parrafo tenue>{COPY_FORMULARIOS.podesNoResponder}</Parrafo>
      </Desplegable>
      {/* DL-165 D-1 y D-3: cuánto falta lo dice la parte, no un tiempo estimado. */}
      {/* Ronda 2.1: con una sola parte («Tus hábitos» aparte) no se dice «Parte 1 de 1» (`cuantoFaltaEnPalabras`). */}
      {cuantoFalta ? <Parrafo tenue>{cuantoFalta}</Parrafo> : null}
      {/* El texto va como título del aviso: así se anuncia al lector de pantalla y se lee en negrita, como todos (D-C3). */}
      {estado.aviso ? <Aviso tipo={estado.aviso.tipo} titulo={estado.aviso.texto} /> : recuperado && hayAlgoPropio ? <Aviso tipo="info" titulo={T.recuperamosLoEscrito} /> : null}
      {/* FR-01 · si lo escrito no quedó en el teléfono, se dice: un cierre de la app lo perdería. */}
      {sinProteger && hayAlgoPropio ? <Parrafo tenue>{T.noSeGuardoEnElTelefono}</Parrafo> : null}
      {/* Un problema al enviar se dice arriba de la parte adonde llevó, que es donde está la primera pregunta marcada. */}
      {enRepaso ? null : avisoDeProblema}

      {alEmpezar && response ? (
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

      {/* Mientras se corrige lo cargado, siempre hay vuelta a leerlo en palabras, aunque al releer la solicitud haya quedado en pausa. */}
      {corrigiendo && proposal ? (
        <Aviso tipo="info" titulo={T.loQueCargo(proposal.professional.displayName)}>
          <Parrafo tenue>{T.corrigiendo}</Parrafo>
          <Boton texto={T.volverALoCargado} tipo="enlace" onPress={volverALoCargado} />
        </Aviso>
      ) : null}
      {/* DL-165 D-2: se dice una sola vez, al empezar. */}
      {alEmpezar ? <Parrafo tenue>{COPY_FORMULARIOS.loQueRespondesEsTuyo}</Parrafo> : null}
      {estado.borradorSinEnviar ? <Parrafo>{COPY_FORMULARIOS.borradorSinEnviar}</Parrafo> : null}
      {/* Lo que quedó sin responder en la parte de antes: pasar no exige nada, y se puede volver. */}
      {quedaron && !enRepaso ? (
        <Aviso tipo="info" titulo={V.quedaronSinResponder(quedaron.n, quedaron.titulo)}>
          <Boton texto={V.volverALaParte(quedaron.titulo)} tipo="enlace" onPress={() => irAlPaso(quedaron.indice)} />
        </Aviso>
      ) : null}

      {parte ? (
        <Seccion key={parte.sectionCode} titulo={parte.titulo}>
          {parte.intro ? <Parrafo tenue>{parte.intro}</Parrafo> : null}
          {/* DL-165 D-18: lo vigente de «Tus hábitos» vino precargado; la persona confirma o cambia. */}
          {habitosDesde && parte.sectionCode === CODIGO_DE_LA_PARTE_DE_HABITOS ? (
            <Aviso tipo="info" titulo={COPY_HABITOS.apk.sigueIgual(dia(habitosDesde))}>
              <Parrafo tenue>{COPY_HABITOS.apk.sigueIgualDetalle}</Parrafo>
            </Aviso>
          ) : null}
          {preguntasQueSeVen(parte, visibles).length > 0 ? (
            preguntasQueSeVen(parte, visibles).map((codigo) => {
              const c = porCodigo.get(codigo);
              return c ? dibujarCampo(c) : null;
            })
          ) : (
            <Parrafo tenue>{V.parteSinPreguntas}</Parrafo>
          )}
        </Seccion>
      ) : (
        <Repaso
          datos={datos}
          partes={partes}
          respuestas={armadasHoy.respuestas}
          faltan={faltanEnTotal}
          onCambiar={(indice) => irAlPaso(indice)}
        />
      )}

      {/* Moverse entre las partes: «Anterior» desde la segunda; «Siguiente», o «Repasar» en la última. */}
      <View style={estilos.navegacion}>
        {actual > 0 ? <Boton texto={V.anterior} tipo="secundario" icono="volver" onPress={() => irAlPaso(actual - 1)} deshabilitado={enviando} /> : null}
        {!enRepaso ? <Boton texto={actual === partes.length - 1 ? V.repasar : V.siguiente} onPress={() => irAlPaso(actual + 1)} deshabilitado={enviando} /> : null}
      </View>

      {enRepaso ? (
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
          {hayPropuesta ? <Boton texto={APK.rechazar} tipo="peligroSecundario" onPress={rechazo.abrir} deshabilitado={enviando} /> : null}
        </Seccion>
      ) : null}
      {dialogoDeRechazo}
    </View>
  );
}

/**
 * DL-165 D-1 · el repaso, antes de enviar: lo respondido por parte, en palabras y con las etiquetas de la plantilla, con
 * «Cambiar» en cada una. Lo obligatorio sin responder se dice en su renglón y en una línea arriba; enviar lo frena y
 * lleva a su parte.
 */
function Repaso({
  datos,
  partes,
  respuestas,
  faltan,
  onCambiar,
}: {
  datos: Datos;
  partes: readonly ParteDelFormulario[];
  respuestas: readonly RespuestaDeCampoV2Entrada[];
  faltan: readonly string[];
  onCambiar: (indice: number) => void;
}) {
  const porSeccion = new Map(seccionesEnPalabras(datos.plantilla.sections, datos.detalle.request, respuestas).map((s) => [s.sectionCode, s] as const));
  const obligatorias = new Set(datos.detalle.request.requiredFieldCodes);
  return (
    <View>
      <Parrafo tenue>{V.repasoBajada}</Parrafo>
      {faltan.length > 0 ? <Aviso tipo="info" titulo={V.faltanPorResponder(faltan.length)} /> : null}
      {partes.map((p) => {
        const s = porSeccion.get(p.sectionCode);
        if (!s) return null;
        return (
          <Seccion key={p.sectionCode} titulo={p.titulo}>
            {s.lineas.map((l) => (
              <Dato key={l.fieldCode} etiqueta={l.etiqueta} valor={l.valor ?? (obligatorias.has(l.fieldCode) ? V.obligatoriaSinResponder : V.sinResponder)} apilado />
            ))}
            <Boton texto={V.cambiarParte} etiqueta={V.cambiarParteDe(p.titulo)} tipo="enlace" onPress={() => onCambiar(p.indice)} />
          </Seccion>
        );
      })}
    </View>
  );
}

const estilos = estilosPorTema(() => ({
  // «Anterior» y «Siguiente», uno debajo del otro: con letra grande, dos botones en fila no entran.
  navegacion: { marginTop: 8, gap: 8 },
}));
