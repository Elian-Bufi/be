/**
 * APK · Entrenamiento del asesorado (docs/paquetes/WP-06.md §5; B10-06 §25-§38, §52-§58; WP-ENTRENAMIENTO-SERIES §7).
 * - **Tres pestañas** (WP-ENTRENAMIENTO-SERIES §7.1): **Hoy**, las sesiones del plan vigente que se pueden hacer hoy, cada
 *   una con «N ejercicios · M series», su estado e «Iniciar entrenamiento» o «Continuar entrenamiento»; **Plan**, las
 *   sesiones en su orden con los objetivos de cada serie (`plan-por-serie.tsx`); e **Historial**, el de siempre
 *   (`historial.tsx`), con los tiempos en el detalle de cada sesión. «Registrar otro día» sigue como acción secundaria y
 *   abre la sesión sin cronómetros: el pasado no se cronometra.
 * - El estado de cada sesión sale **solo** de `vistaDeOcurrencia`: sin registro es «No iniciada» o «Sin registro», nunca
 *   «No realizada» (H-09-TRN-01; B10-06:626-640). Si hay varias, la persona elige cuál hace: BE no decide (DL-077).
 * - **La sesión guiada** (`PantallaDeSesion`, con las piezas de `sesion-enfocada.tsx`; PA-01 y PA-02, Dirección del
 *   2026-11-02): la franja de progreso arriba, un ejercicio a la vez con su imagen y su técnica, y la tabla con lo
 *   planificado en gris, la columna Tiempo y una casilla por serie: tildar registra lo escrito y, en lo vacío, lo
 *   planificado (`recordedAs`), y destildar deshace. Lo escrito se guarda en el teléfono aunque no se registre, así que la
 *   barra inferior queda visible y salir no pregunta. Lo registrado se guarda primero en el teléfono, por cuenta
 *   (`entrenamiento-en-curso.ts`), y viaja después: API-TRN-17 para las series y API-TIE-01 para los tiempos.
 *   «Sustituir ejercicio» registra otro ejercicio en lugar del planificado, como en la 0.13.2 (DL-151; las reglas, en
 *   `sustitucion-de-ejercicio.ts`): necesita conexión y no toca los tiempos.
 * - **Finalizar** muestra antes un resumen, manda el fin de la sesión (SESSION_FINISHED) y confirma el borrador
 *   (API-TRN-18). Confirmar es definitivo, y después se corrige sin borrar (B10-06:820-898).
 * - Un resultado incierto ofrece reintentar con la misma Idempotency-Key: no duplica.
 * - DL-091: toda cantidad se escribe con `cantidad`/`numero` de `@be/domain` y toda entrada se lee con `leerNumero`, que
 *   acepta coma o punto; una escritura denegada con el 404 no revelador retira el contenido (B10-06:1145-1148).
 */
import {
  calcularTiempos,
  cantidad,
  cantidadDeSeries,
  COPY,
  COPY_AGENDA_DE_ENTRENAMIENTO as AG,
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  COPY_REGISTRO_POR_NIVELES,
  COPY_REVISIONES_PROPIAS,
  duracionParaMostrar,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  leerNumero,
  lineasDePrescripcion,
  nivelDeDetalleDelRegistro,
  numero,
  registroVigente,
  seCargoComoElPlan,
  textoDelNivelDeDetalle,
  vistaDeOcurrencia,
  type AgendaDeHoyResponse,
  type BorradorDeEjecucion,
  type EjecucionDeEntrenamiento,
  type HoyDeEntrenamientoResponse,
  type Ocurrencia,
  type Prescripcion,
  type PrescripcionConObjetivos,
  type RegistroDeEjecucion,
  type Resultado,
  type SesionDeOcurrencia,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AccessibilityInfo, Alert, Text, useWindowDimensions, Vibration, View } from 'react-native';
import { ajustesDelDescanso, marcaDeLaExplicacion, useAjustesDelDescanso } from '../ajustes-del-descanso';
import { seMuestraLaExplicacion } from '../explicacion-de-los-tiempos';
import { cancelarAvisoDelDescanso, pedirPermisoDeAvisos, permisoDeAvisos, programarAvisoDelDescanso } from '../avisos-del-telefono';
import { accionAlDestildar, accionAlTildar, filaDeAcciones, llegoAlRecomendado, pedidoDelPermiso, planDelAviso, queHaceElMedio, type PermisoDeAvisos } from '../descanso-automatico';
import { usePublicarFilaFija } from '../fila-fija';
import { TEXTOS_DEL_DESCANSO } from '../textos-del-descanso';
import { estadoDeSincronizacion, type SesionLocal } from '../almacen-de-entrenamiento';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { corridaAbierta, enVivoDeLaCorrida, estadoLocal, eventosDeLaCorrida, type AccionDeTiempo, type MotivoDeRechazoLocal } from '../corrida-de-entrenamiento';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { entrenamientoLocal, useEntrenamientoLocal } from '../entrenamiento-en-curso';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { fecha, fechaCivil, fechaLarga, hora as horaDe } from '../formato';
import { Icono } from '../icono';
import { IconoDeEjercicio } from '../iconos-de-entrenamiento';
import { esIncierto, falloDe, useClaveDeIntento } from '../intento';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Ruta, type Salida } from '../navegacion';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { enCursoDeLaApi, enCursoEnElTelefono, marchaDeLaSesionEnCurso, otraSesionEnCurso, sePuedeIniciar, sesionEnCursoParaMostrar, vistaDeLaSesion, type EnCurso, type MarchaDeLaCorrida } from '../sesion-en-curso';
import { condicionQueCorresponde, horaTomadaAlEmpezar, inicioDeLaCorrida, motivoParaNoFinalizar, motivoQueViaja, renglonesDelResultado, TEXTOS_DEL_CIERRE, tiempoDeLaSesionAbierta, tiemposResumidos } from '../cierre-de-la-sesion';
import { cuentaDelRecorrido, posicionEnLaSesion, segundosMedidosDeLaFila, tiempoDelEjercicioEnVivo, tramosDelRecorrido } from '../franja-de-la-sesion';
import {
  bandaDeLaSerie,
  basesDeLaPrescripcion,
  claveDeFila,
  disposicionDeLaTabla,
  ejerciciosYSeries,
  escritaDeLaSerie,
  escritasDelEjercicio,
  FILA_VACIA,
  filasDelEjercicio,
  focoTrasElDescanso,
  focoTrasTildar,
  guardadasVigentes,
  hayAlgoEscrito,
  MAXIMO_DE_SERIES,
  motivoDeLaLectura,
  pendientesDeRegistrar,
  primeraSinRegistrar,
  problemaParaConfirmar,
  resumenDelRegistro,
  alTerminarLaSerie,
  anuncioParaRegistrar,
  serieAlTildar,
  serieQueOriginaElDescanso,
  sesionDesdeLaOcurrencia,
  AVISO_SIN_PLAN_POR_SERIE,
  textoDeTiempo,
  unidadDelEjercicio,
  type ErroresDeFila,
  type FilaDeLaTabla,
  type FilaEscrita,
  type FilaEscritaGuardada,
  type SerieLocal,
  type Unidad,
} from '../series-de-la-sesion';
import { sePuedeOfrecer, TEXTOS_DEL_REGISTRO_RAPIDO } from '../registro-rapido';
import { cambiosParaSustituir, ejercicioRealizadoDe, sePuedeSustituir, sustitucionDe, textoDeLaConfirmacion, TEXTOS_DE_LA_SUSTITUCION, type EjercicioNombrado } from '../sustitucion-de-ejercicio';
import { Aviso, Boton, Campo, COLOR, Dato, Desplegable, EstadoVacio, estilosPorTema, Insignia, Parrafo, Pestanas, Seccion, Segmentos, Subtitulo, Tarjeta, Titulo } from '../ui';
import { ContenidoDelHistorial } from './historial';
import { PlanPorSerie } from './plan-por-serie';
import { AlLado, aRegistroRapido } from './registro-rapido';
import {
  AvisoDeMedicionAbierta,
  AyudaDeLaTabla,
  BandaDelPlan,
  BloqueDeDescanso,
  duracionParaLeer,
  EjercicioActivo,
  ErroresDeLaFila,
  EstadoDelEnvio,
  ExplicacionDeLosTiempos,
  FranjaDeLaSesion,
  HojaDelDescanso,
  RutinaDeLaSesion,
  SeriesDelResumen,
  SustituirEjercicio,
  TablaDeSeries,
  TecnicaDelEjercicio,
  type EstadoDelDescanso,
  type RelojDeLaTabla,
  type Temporizador,
} from './sesion-enfocada';
import { TEXTOS_DE_LA_SESION } from '../textos-de-la-sesion';
import { TiemposDeLaEjecucion } from './tiempos-de-la-sesion';

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

/** La fecha local de hoy en la zona del borrador: después de las 21 en Buenos Aires, en UTC ya es mañana. */
const hoyEn = (zona: string): string => new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/**
 * Lo planificado de una prescripción, completo y una línea por dato (DL-105), con la presentación que comparte con el
 * website: todas las series (una pirámide 10/8/6 ya no es «3 × 10») con sus notas, la intensidad con su referencia, la
 * carga sugerida aparte del criterio (B10-06:463-477), los parámetros con su unidad y la nota.
 */
export function textoDePrescripcion(p: Prescripcion): string {
  return lineasDePrescripcion(p).join('\n');
}

/**
 * Antes de una acción sensible se pregunta (B10-10:337: no se ejecuta de un toque, y menos al lado de una frecuente). El
 * diálogo del sistema es accesible y dice qué pasa. Lo que descarta algo es `destructive`; lo que cambia sin borrar (una
 * sustitución con series ya registradas), `default`.
 */
function preguntar(titulo: string, detalle: string, accion: string, estilo: 'destructive' | 'default' = 'destructive'): Promise<boolean> {
  return new Promise((resolver) =>
    Alert.alert(
      titulo,
      detalle,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: accion, style: estilo, onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    ),
  );
}

/** DL-137: al empezar una sesión con otra pendiente, qué hace la persona con la pendiente. */
/** «Terminar serie N» con una medición de más de diez horas (AV2-30): qué pasó con ella, como en su diálogo. */
function preguntarPorLaMedicionLarga(detalle: string): Promise<'termino-ahora' | 'incompleta' | 'cancelar'> {
  return new Promise((resolver) =>
    Alert.alert(
      COPY_ENTRENAMIENTO_POR_SERIE.medicionAbierta,
      detalle,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver('cancelar') },
        { text: COPY_ENTRENAMIENTO_POR_SERIE.dejarIncompleta, onPress: () => resolver('incompleta') },
        { text: COPY_ENTRENAMIENTO_POR_SERIE.terminoAhora, onPress: () => resolver('termino-ahora') },
      ],
      { cancelable: true, onDismiss: () => resolver('cancelar') },
    ),
  );
}

function preguntarPorLaPendiente(p: { readonly etiqueta: string; readonly fecha: string }): Promise<'saltear' | 'dejar' | 'cancelar'> {
  return new Promise((resolver) =>
    Alert.alert(
      AG.preguntaPendiente(p.etiqueta, p.fecha),
      AG.preguntaPendienteDetalle,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver('cancelar') },
        { text: AG.dejarlaPendiente, onPress: () => resolver('dejar') },
        { text: AG.saltearla, onPress: () => resolver('saltear') },
      ],
      { cancelable: true, onDismiss: () => resolver('cancelar') },
    ),
  );
}

/** Por qué no se pudo marcar un tiempo, dicho para la persona. */
function textoDelRechazo(motivo: MotivoDeRechazoLocal): string {
  switch (motivo) {
    case 'ANOTHER_SESSION_IN_PROGRESS':
      return `${COPY_ENTRENAMIENTO_POR_SERIE.sesionSinFinalizar}. Continualo o dejalo incompleto en Entrenamiento.`;
    case 'SESSION_PAUSED':
      return 'La sesión está en pausa. Reanudala para seguir.';
    case 'MEASUREMENT_OPEN':
      return 'Hay una medición abierta. Finalizala primero.';
    case 'SESSION_FINISHED':
      return 'Este entrenamiento ya terminó.';
    case 'SESSION_NOT_STARTED':
      return 'El entrenamiento todavía no empezó.';
    case 'SESSION_ALREADY_STARTED':
      return 'Este entrenamiento ya empezó.';
    default:
      return 'No se pudo marcar ese tiempo.';
  }
}

// ─── Entrenamiento: Hoy · Plan · Historial ──────────────────────────────────────────────────────

type VistaDeEntrenamiento = 'HOY' | 'PLAN' | 'HISTORIAL';
const VISTAS: readonly { readonly valor: VistaDeEntrenamiento; readonly texto: string }[] = [
  { valor: 'HOY', texto: COPY_ENTRENAMIENTO_POR_SERIE.hoy },
  { valor: 'PLAN', texto: COPY_ENTRENAMIENTO_POR_SERIE.plan },
  { valor: 'HISTORIAL', texto: COPY_ENTRENAMIENTO_POR_SERIE.historial },
];

export function PantallaDeEntrenamiento({ token, identidadId, salir, ir }: { token: string; identidadId: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  // La pestaña elegida se recuerda mientras dure la sesión.
  const [vista, setVista] = useSeleccionRecordada<VistaDeEntrenamiento>(token, 'entrenamiento:vista', 'HOY');
  const pedir = useCallback((): Promise<Resultado<HoyDeEntrenamientoResponse>> => api.hoyDeEntrenamiento(token), [token]);
  // Al entrar se verifica antes de mostrar (src/ciclo-de-lectura.ts).
  // La clave nombra el día civil, en la zona con la que la API resuelve «hoy». A la medianoche cambia, y se vuelve a leer.
  const hoyDeLaApi = useDiaDeLaApi();
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `entrenamiento-hoy:${hoyDeLaApi}`, pedir, sesionPerdida);

  let contenido: ReactNode;
  // «Tu historial» no depende del plan (DL-096): se ve aunque Hoy y Plan no estén disponibles.
  if (vista === 'HISTORIAL') contenido = <ContenidoDelHistorial token={token} identidadId={identidadId} salir={salir} ir={ir} />;
  else if (retirado) {
    // Una escritura denegada con el 404 no revelador retira el contenido entero (B10-06:1145-1148): queda el mismo estado
    // neutral que con el acceso suspendido.
    contenido = (
      <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible}>
        <Boton texto="Ir a Vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
      </Aviso>
    );
  } else if (!r) contenido = <Cargando forma="lista" />;
  else if (!r.ok) contenido = <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />;
  else {
    const hoy = r.datos.data;
    contenido = (
      <>
        <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
        {/* Vacía: qué va a aparecer acá y el siguiente paso (vuelta 2), no solo que no hay plan. */}
        {hoy.planState === 'NO_ACTIVE_PLAN' ? <EstadoVacio icono="entrenamiento" {...TEXTOS_DE_LA_VUELTA.vacios.entrenamientoSinPlan} accion={{ texto: TEXTOS_DE_LA_VUELTA.vacios.entrenamientoSinPlan.accion, onPress: () => ir({ nombre: 'vinculos' }) }} /> : null}
        {hoy.planState === 'NOT_AVAILABLE' ? (
          <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible}>
            <Boton texto="Ir a Vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
          </Aviso>
        ) : null}
        {vista === 'HOY' ? (
          <HoyDeEntrenamiento hoy={hoy} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} recargar={() => void cargar()} />
        ) : (
          <PlanPorSerie token={token} hoy={hoy} sesionPerdida={sesionPerdida} />
        )}
      </>
    );
  }

  return (
    <View>
      <Titulo>{COPY_ENTRENAMIENTO.pestana}</Titulo>
      <Pestanas etiqueta="Qué ver de tu entrenamiento" opciones={VISTAS} valor={vista} alElegir={setVista} />
      {contenido}
      {/* REV-A (DL-134): las revisiones de tu profesional, completas; son historia, así que están aunque no haya plan. */}
      {vista !== 'HOY' ? <Boton texto={COPY_REVISIONES_PROPIAS.entrada} tipo="secundario" onPress={() => ir({ nombre: 'revisiones', area: 'ENTRENAMIENTO' })} /> : null}
    </View>
  );
}

function HoyDeEntrenamiento({
  hoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
  recargar,
}: {
  hoy: HoyDeEntrenamientoResponse['data'];
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
  recargar: () => void;
}) {
  const local = useEntrenamientoLocal();
  // La sesión en curso de cualquier día, de este o de otro dispositivo. Si la API no la puede dar, vale la del teléfono.
  const pedirEnCurso = useCallback(() => api.sesionEnCurso(token), [token]);
  const enCurso = useLecturaRecordada(token, 'entrenamiento-en-curso', pedirEnCurso, sesionPerdida);
  const [otroDia, setOtroDia] = useState('');
  const [errorDeFecha, setErrorDeFecha] = useState<string | null>(null);
  const [delDia, setDelDia] = useState<{ fecha: string; ocurrencias: Ocurrencia[] } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  /** DL-078: para registrar una sesión de un día anterior. */
  async function verOtroDia() {
    setAviso(null);
    setErrorDeFecha(null);
    // El error de la fecha va en su campo, no solo arriba (B10-10:36, 164-165).
    if (!/^\d{4}-\d{2}-\d{2}$/.test(otroDia)) return setErrorDeFecha('Escribí la fecha como AAAA-MM-DD.');
    const res = await api.ocurrenciasDeEntrenamiento(token, { periodStart: otroDia, periodEnd: otroDia });
    if (sesionPerdida(res)) return;
    if (!res.ok) return setAviso('No pudimos ver ese día. Revisá que no sea una fecha futura ni de hace más de un mes.');
    setDelDia({ fecha: otroDia, ocurrencias: res.datos.data.occurrences });
  }

  // DL-137: la agenda del día (API-AGE-01). Si el plan no tiene días, o la API todavía no la ofrece, «Hoy» sigue como
  // siempre: todas las sesiones, y la persona elige.
  // La misma lectura que la tarjeta de Inicio: la misma clave, con el día civil de la API.
  const diaDeLaApi = useDiaDeLaApi();
  const pedirAgenda = useCallback(() => api.agendaDeEntrenamiento(token), [token]);
  const lecturaDeLaAgenda = useLecturaRecordada(token, `entrenamiento-agenda:${diaDeLaApi}`, pedirAgenda, sesionPerdida);
  const agenda = lecturaDeLaAgenda.r?.ok && lecturaDeLaAgenda.r.datos.data.planState === 'AVAILABLE' && lecturaDeLaAgenda.r.datos.data.startDate ? lecturaDeLaAgenda.r.datos.data : null;
  const recargarTodo = () => {
    recargar();
    void lecturaDeLaAgenda.cargar();
  };

  const remota = enCurso.r?.ok ? enCurso.r.datos.data.inProgress : null;
  // Primero la que informa la API, que es la que impide iniciar otra; después la del teléfono (`sesion-en-curso.ts`).
  const ahora: EnCurso | null = sesionEnCursoParaMostrar(remota, local.sesiones());
  // DL-170 (AV2-09): si la que corre está en pausa, la etiqueta lo dice; y con una en curso, ninguna otra ofrece empezar.
  const marcha = ahora ? marchaDeLaSesionEnCurso(remota, local.sesiones().find((s) => s.draftId === ahora.draftId)) : null;
  // Una sesión en curso de otro día (pasó la medianoche): se retoma desde acá, aunque no esté en la lista de hoy.
  const deOtroDia = ahora && !hoy.occurrences.some((o) => o.occurrenceId === ahora.occurrenceId) ? ahora : null;
  const tarjeta = (o: Ocurrencia, pendiente: PendienteParaPreguntar | null = null) => (
    <TarjetaDeOcurrencia
      key={o.occurrenceId}
      ocurrencia={o}
      hoy={hoy.date}
      token={token}
      sesionPerdida={sesionPerdida}
      accesoRetirado={accesoRetirado}
      ir={ir}
      enCurso={ahora?.occurrenceId === o.occurrenceId}
      marcha={ahora?.occurrenceId === o.occurrenceId ? marcha : null}
      bloqueadaPor={sePuedeIniciar(o.occurrenceId, ahora) ? null : ahora}
      pendiente={pendiente}
      alSaltear={recargarTodo}
    />
  );

  return (
    <View>
      <View style={estilos.filaDeLaFecha}>
        <Icono nombre="calendario" tamano={20} tono="acento" />
        <Text style={estilos.fechaDeHoy} accessibilityRole="header">
          {fechaLarga(hoy.date)}
        </Text>
      </View>
      {deOtroDia ? (
        <AvisoDeEntrenamientoEnCurso
          enCurso={deOtroDia}
          token={token}
          sesionPerdida={sesionPerdida}
          ir={ir}
          alTerminar={() => {
            void enCurso.cargar();
            recargar();
          }}
        />
      ) : null}
      {agenda ? (
        <AgendaDelDia agenda={agenda} hoy={hoy} tarjeta={tarjeta} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} alSaltear={recargarTodo} enCurso={ahora} />
      ) : (
        <>
          {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
          {hoy.occurrences.map((o) => tarjeta(o))}
        </>
      )}
      {hoy.planState === 'AVAILABLE' ? (
        // Plegado: es para lo que quedó sin registrar; lo de hoy va primero.
        <Desplegable titulo={COPY_ENTRENAMIENTO.registrarOtroDia} icono="cargado-otro-dia" abiertoAlInicio={delDia !== null || aviso !== null}>
          <Parrafo tenue>Si hiciste una sesión otro día y no la registraste, podés registrarla ahora. El pasado no se cronometra: se registran las series.</Parrafo>
          <Campo
            etiqueta="Fecha (AAAA-MM-DD)"
            value={otroDia}
            error={errorDeFecha}
            onChangeText={(v) => {
              setOtroDia(v);
              setErrorDeFecha(null);
            }}
            keyboardType="numbers-and-punctuation"
          />
          <Boton texto="Ver sesiones de ese día" tipo="secundario" onPress={() => void verOtroDia()} />
          {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
          {delDia ? (
            delDia.ocurrencias.length === 0 ? (
              <Parrafo>Ese día tu plan no estaba vigente.</Parrafo>
            ) : (
              delDia.ocurrencias.map((o) => <TarjetaDeOcurrencia key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} enCurso={false} />)
            )
          ) : null}
        </Desplegable>
      ) : null}
      <Boton texto="Actualizar" tipo="enlace" onPress={recargarTodo} />
    </View>
  );
}

type AgendaDelDiaApi = AgendaDeHoyResponse['data'];

/** Una sesión pendiente, para preguntar por ella antes de empezar otra (Dirección, 2026-10-16). */
interface PendienteParaPreguntar {
  readonly etiqueta: string;
  readonly fecha: string;
  readonly occurrenceId: string;
}

/**
 * DL-137 D-5: saltear es registrar la sesión «no realizada» en su fecha prevista, sin hora (la API pone el final de ese
 * día). Si el borrador de esa fecha ya tiene datos cargados no se toca: se le pide a la persona que lo abra. Devuelve
 * `null` si quedó registrada, o el motivo para mostrar.
 */
async function saltearSesion(token: string, occurrenceId: string, clave: string, sesionPerdida: AlPerderLaSesion): Promise<string | null | 'sesion'> {
  const b = await api.abrirBorradorDeEjecucion(token, occurrenceId);
  if (sesionPerdida(b)) return 'sesion';
  if (!b.ok) return falloDe(b).mensaje;
  const borrador = b.datos.data;
  if (borrador.state === 'REGISTERED') return null;
  if (borrador.granularity !== null || borrador.exercises.length > 0 || borrador.sessionSummary !== null) return AG.conDatosCargados;
  const g = await api.guardarBorradorDeEjecucion(token, borrador.draftId, { expectedVersion: borrador.version, changes: { sessionCondition: 'NOT_COMPLETED' } });
  if (sesionPerdida(g)) return 'sesion';
  if (!g.ok) return falloDe(g).mensaje;
  const c = await api.confirmarEjecucion(token, borrador.draftId, g.datos.data.version, clave);
  if (sesionPerdida(c)) return 'sesion';
  if (!c.ok) return c.tipo === 'API' && c.codigo === 'EXECUTION_ALREADY_REGISTERED' ? null : esIncierto(c) ? COPY.resultadoIncierto : falloDe(c).mensaje;
  return null;
}

/**
 * La agenda del día (DL-137): lo que toca hoy, lo que quedó pendiente con «Hacerla hoy» y «Saltearla», lo que viene, y
 * las otras sesiones del plan plegadas (se puede entrenar fuera de la agenda). Los nombres salen de las ocurrencias de
 * «Hoy», que traen todas las sesiones del plan.
 */
function AgendaDelDia({
  agenda,
  hoy,
  tarjeta,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
  alSaltear,
  enCurso,
}: {
  agenda: AgendaDelDiaApi;
  hoy: HoyDeEntrenamientoResponse['data'];
  tarjeta: (o: Ocurrencia, pendiente?: PendienteParaPreguntar | null) => ReactNode;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
  alSaltear: () => void;
  /** La sesión en curso, si hay una: con ella, «Hacerla hoy» no se ofrece (AV2-09). */
  enCurso: EnCurso | null;
}) {
  const deLaSesion = (sessionId: string): Ocurrencia | undefined => hoy.occurrences.find((o) => o.plannedSession.sessionId === sessionId);
  const deHoy = agenda.today.flatMap((f) => deLaSesion(f.sessionId) ?? []);
  const previstasHoy = new Set(agenda.today.map((f) => f.sessionId));
  const otras = hoy.occurrences.filter((o) => !previstasHoy.has(o.plannedSession.sessionId));
  const pendientes = agenda.pending.flatMap((p) => {
    const o = deLaSesion(p.sessionId);
    return o ? [{ ...p, ocurrenciaDeHoy: o }] : [];
  });
  /** Al empezar una sesión, la primera pendiente de otra sesión: la persona decide si la saltea o la deja. */
  const pendienteParaPreguntar = (o: Ocurrencia): PendienteParaPreguntar | null => {
    const p = pendientes.find((x) => x.sessionId !== o.plannedSession.sessionId);
    return p ? { etiqueta: p.ocurrenciaDeHoy.plannedSession.label, fecha: p.plannedDate, occurrenceId: p.occurrenceId } : null;
  };

  return (
    <View>
      <Subtitulo>{AG.hoyTeToca}</Subtitulo>
      {deHoy.length === 0 ? <Parrafo tenue>{AG.hoyNoHaySesion}</Parrafo> : deHoy.map((o) => tarjeta(o, pendienteParaPreguntar(o)))}
      {pendientes.length > 0 ? (
        <>
          <Subtitulo>{AG.tePendiente}</Subtitulo>
          {pendientes.map((p) => (
            <TarjetaDePendiente
              key={p.occurrenceId}
              etiqueta={p.ocurrenciaDeHoy.plannedSession.label}
              fecha={p.plannedDate}
              occurrenceId={p.occurrenceId}
              ocurrenciaDeHoy={p.ocurrenciaDeHoy}
              token={token}
              sesionPerdida={sesionPerdida}
              accesoRetirado={accesoRetirado}
              ir={ir}
              alSaltear={alSaltear}
              bloqueadaPor={sePuedeIniciar(p.ocurrenciaDeHoy.occurrenceId, enCurso) ? null : enCurso}
            />
          ))}
        </>
      ) : null}
      {agenda.upcoming.length > 0 ? (
        <>
          <Subtitulo>{AG.loQueViene}</Subtitulo>
          {agenda.upcoming.map((u) => (
            <Text key={`${u.plannedDate}-${u.sessionId}`} style={estilos.ejercicioDeLaSesion}>
              {AG.proxima(deLaSesion(u.sessionId)?.plannedSession.label ?? AG.sesion, u.plannedDate, hoy.date)}
            </Text>
          ))}
        </>
      ) : null}
      {otras.length > 0 ? (
        <Desplegable titulo={AG.otrasSesiones}>
          <Parrafo tenue>{AG.otrasSesionesAyuda}</Parrafo>
          {otras.map((o) => tarjeta(o, pendienteParaPreguntar(o)))}
        </Desplegable>
      ) : null}
    </View>
  );
}

/** Una sesión que quedó pendiente: hacerla hoy (la ocurrencia de hoy de esa sesión la resuelve, D-4) o saltearla. */
function TarjetaDePendiente({
  etiqueta,
  fecha: prevista,
  occurrenceId,
  ocurrenciaDeHoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
  alSaltear,
  bloqueadaPor,
}: {
  etiqueta: string;
  fecha: string;
  occurrenceId: string;
  ocurrenciaDeHoy: Ocurrencia;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
  alSaltear: () => void;
  /** Otra sesión en curso: mientras tanto, «Hacerla hoy» no se ofrece (AV2-09). «La hice ese día» sí (AV2-D4). */
  bloqueadaPor: EnCurso | null;
}) {
  const { abriendo, fallo, abrir, otraEnCurso } = useAbrirOcurrencia({ ocurrencia: ocurrenciaDeHoy, token, sesionPerdida, accesoRetirado, ir });
  const intento = useClaveDeIntento();
  const [salteando, setSalteando] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  // PA-03: «La hice ese día» registra la de esa fecha, sin cronómetros; si esa fecha corre en el teléfono, se continúa ahí.
  const local = useEntrenamientoLocal();
  const laHiceEseDia = !local.sesiones().some((s) => s.occurrenceId === occurrenceId);

  async function saltear() {
    if (!(await preguntar(AG.saltearTitulo, AG.saltearDetalle(etiqueta, prevista), AG.saltearla))) return;
    setSalteando(true);
    setProblema(null);
    const motivo = await saltearSesion(token, occurrenceId, intento.actual(), sesionPerdida);
    setSalteando(false);
    if (motivo === 'sesion') return;
    if (motivo !== COPY.resultadoIncierto) intento.descartar();
    if (motivo) return setProblema(motivo);
    void AccessibilityInfo.announceForAccessibility(AG.salteada);
    alSaltear();
  }

  return (
    <Tarjeta>
      <Subtitulo>{AG.pendiente(etiqueta, prevista)}</Subtitulo>
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {problema ? <Aviso tipo="error" titulo={problema} /> : null}
      {otraEnCurso ? <AvisoDeEntrenamientoEnCurso enCurso={otraEnCurso} token={token} sesionPerdida={sesionPerdida} ir={ir} alTerminar={() => void abrir()} motivo={MOTIVO_ANTES_DE_INICIAR} /> : null}
      {bloqueadaPor ? <Parrafo tenue>{TEXTOS_DE_LA_VUELTA.hayUnEntrenamientoEnCurso(bloqueadaPor.etiqueta)}</Parrafo> : null}
      <AlLado>
        {bloqueadaPor ? null : <Boton texto={AG.hacerlaHoy} onPress={() => void abrir()} ocupado={abriendo} deshabilitado={salteando} />}
        {laHiceEseDia ? (
          <Boton
            texto={TEXTOS_DEL_REGISTRO_RAPIDO.laHiceEseDia}
            tipo="secundario"
            onPress={() => ir(aRegistroRapido(ocurrenciaDeHoy, { occurrenceId, fecha: prevista }))}
            deshabilitado={abriendo || salteando}
            icono="ya-la-hice"
          />
        ) : null}
      </AlLado>
      <Boton texto={AG.saltearla} tipo="secundario" icono="salteada" onPress={() => void saltear()} ocupado={salteando} deshabilitado={abriendo} />
    </Tarjeta>
  );
}

/**
 * Dejar incompleta una sesión en curso, sin afirmar cuándo terminó: pregunta antes, cierra la corrida con los eventos
 * del teléfono (o con los de la API, si corre en otro dispositivo) y los manda. Lo usan el aviso de abajo y la tarjeta de
 * la sesión en curso de Inicio (DL-170, AV2-09). Solo escribe cuando la persona lo confirma.
 */
export function useDejarIncompleto({ enCurso: e, token, sesionPerdida, alTerminar }: { enCurso: EnCurso; token: string; sesionPerdida: AlPerderLaSesion; alTerminar: () => void }) {
  const [dejando, setDejando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function dejarIncompleto() {
    const decidido = await preguntar(
      COPY_ENTRENAMIENTO_POR_SERIE.dejarSesionIncompleta,
      'Los tiempos de ese entrenamiento quedan incompletos: no se cierra a esta hora. Lo que registraste en las series sigue en su borrador.',
      COPY_ENTRENAMIENTO_POR_SERIE.dejarSesionIncompleta,
    );
    if (!decidido) return;
    setDejando(true);
    setFallo(null);
    await entrenamientoLocal.listo();
    entrenamientoLocal.preparar({ draftId: e.draftId, occurrenceId: e.occurrenceId, fecha: e.fecha, modo: 'en-vivo', etiqueta: e.etiqueta });
    const local = entrenamientoLocal.sesion(e.draftId);
    // Sin la corrida en el teléfono (otro dispositivo), se toma la de la API: el cierre sigue a sus eventos.
    if (local && estadoLocal(local.corrida).runId === null) {
      const t = await api.tiemposDelBorrador(token, e.draftId);
      if (sesionPerdida(t)) return;
      if (t.ok) entrenamientoLocal.fijarTiemposDelServidor(e.draftId, t.datos.data.events.map((x) => x.event));
    }
    const r = entrenamientoLocal.accion(e.draftId, { tipo: 'dejar-incompleta' });
    if (!r.ok) {
      setDejando(false);
      return setFallo(textoDelRechazo(r.motivo));
    }
    // Se manda todo lo pendiente de esa sesión, también si un envío anterior quedó trabado por un conflicto de tiempos
    // (un inicio rechazado porque había otra en curso): son los mismos eventos, y si siguen sin poder guardarse, el
    // conflicto vuelve a aparecer en esa sesión sin perder nada.
    await entrenamientoLocal.reintentar(e.draftId);
    const envio = await entrenamientoLocal.sincronizarYEsperar(e.draftId);
    setDejando(false);
    if (envio && sesionPerdida(envio)) return;
    alTerminar();
  }

  return { dejando, fallo, dejarIncompleto } as const;
}

/**
 * «Tenés un entrenamiento sin finalizar»: continuarlo, o dejarlo incompleto sin afirmar cuándo terminó. Lo usan
 * Entrenamiento y la sesión enfocada; `motivo` dice por qué aparece (por ejemplo, antes de iniciar otra sesión).
 */
export function AvisoDeEntrenamientoEnCurso({
  enCurso: e,
  token,
  sesionPerdida,
  ir,
  alTerminar,
  motivo,
}: {
  enCurso: EnCurso;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  ir: Ir;
  alTerminar: () => void;
  motivo?: string;
}) {
  const { dejando, fallo, dejarIncompleto } = useDejarIncompleto({ enCurso: e, token, sesionPerdida, alTerminar });
  return (
    <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO_POR_SERIE.sesionSinFinalizar}>
      <Parrafo>{`${e.etiqueta} · ${fechaCivil(e.fecha)}`}</Parrafo>
      {motivo ? <Parrafo>{motivo}</Parrafo> : null}
      {fallo ? <Parrafo>{fallo}</Parrafo> : null}
      <Boton
        texto={COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento}
        onPress={() => ir({ nombre: 'sesion-de-entrenamiento', draftId: e.draftId, occurrenceId: e.occurrenceId, fecha: e.fecha, modo: 'en-vivo', etiqueta: e.etiqueta })}
      />
      <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.dejarSesionIncompleta} tipo="secundario" onPress={() => void dejarIncompleto()} ocupado={dejando} />
    </Aviso>
  );
}

/**
 * Empieza la corrida de un borrador, o toma la que la API ya tiene (otro dispositivo, o la app reinstalada): nunca dos
 * corridas para el mismo borrador. «Iniciar entrenamiento» es la acción explícita que la empieza. Devuelve `null` si
 * quedó lista, `''` si la sesión se cerró, o el motivo para mostrar.
 */
async function empezarLaCorrida(token: string, draftId: string, prescriptionId: string | undefined, sesionPerdida: AlPerderLaSesion): Promise<string | null> {
  const local = entrenamientoLocal.sesion(draftId);
  if (!local || estadoLocal(local.corrida).runId !== null) return null;
  const t = await api.tiemposDelBorrador(token, draftId);
  if (sesionPerdida(t)) return '';
  if (t.ok && t.datos.data.runId !== null) {
    entrenamientoLocal.fijarTiemposDelServidor(draftId, t.datos.data.events.map((e) => e.event));
    return null;
  }
  if (!prescriptionId) return null;
  const inicio = entrenamientoLocal.accion(draftId, { tipo: 'iniciar', prescriptionId });
  if (!inicio.ok) return textoDelRechazo(inicio.motivo);
  AccessibilityInfo.announceForAccessibility('Entrenamiento iniciado');
  void entrenamientoLocal.sincronizar(draftId);
  return null;
}

/**
 * Abrir el borrador de una sesión y llevar a registrarla (API-TRN-15): es una escritura, y va solo cuando la persona toca
 * «Iniciar entrenamiento» o «Continuar entrenamiento». Hoy, además, empieza la corrida (o continúa la que hay). La usan
 * Entrenamiento e Inicio (DL-117), con el mismo circuito y los mismos mensajes. Si la sesión ya estaba registrada, lleva
 * al registro.
 */
export function useAbrirOcurrencia({
  ocurrencia: o,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
}: {
  ocurrencia: Ocurrencia;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: (r: Ruta) => void;
}) {
  const [abriendo, setAbriendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  // La sesión en curso que hay que continuar o dejar incompleta antes de iniciar esta (`sesion-en-curso.ts`).
  const [otraEnCurso, setOtraEnCurso] = useState<EnCurso | null>(null);
  const hoy = useDiaDeLaApi();
  // Si la persona se fue de la pantalla, o salió de la sesión, mientras se abría el borrador, la respuesta no la mueve:
  // una respuesta tardía no se muestra ni navega (revisión de la candidata). El borrador queda abierto en la API, y
  // «Continuar entrenamiento» lo retoma.
  const montada = useRef(true);
  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  async function abrir() {
    const modo = o.date === hoy ? 'en-vivo' : 'otro-dia';
    setFallo(null);
    setOtraEnCurso(null);
    // Si el entrenamiento de esta sesión ya está en el teléfono, se retoma sin pedir nada: también sin red. Si mientras
    // tanto se registró en otro dispositivo, la sesión enfocada lo ve al leer el borrador y lleva al registro.
    const enElTelefono = entrenamientoLocal.sesiones().find((s) => s.occurrenceId === o.occurrenceId && s.modo === modo);
    if (enElTelefono) {
      return ir({ nombre: 'sesion-de-entrenamiento', draftId: enElTelefono.draftId, occurrenceId: o.occurrenceId, sesion: o.plannedSession, fecha: o.date, modo, etiqueta: o.plannedSession.label });
    }
    // Una sola sesión en curso por titular, de cualquier día y de cualquier dispositivo: antes de abrir el borrador se le
    // pregunta a la API (API-TIE-04) y se mira el teléfono. Si hay otra, se ofrece continuarla o dejarla incompleta, y no se
    // abre nada (defecto de la 0.15.0-candidata.1: se abría otro borrador y el rechazo llegaba al registrar una serie).
    if (modo === 'en-vivo') {
      setAbriendo(true);
      const enCurso = await api.sesionEnCurso(token);
      if (!montada.current) return;
      setAbriendo(false);
      if (sesionPerdida(enCurso)) return;
      const otra = otraSesionEnCurso(o.occurrenceId, enCurso.ok ? enCurso.datos.data.inProgress : undefined, entrenamientoLocal.sesiones());
      if (otra) return setOtraEnCurso(otra);
    }
    setAbriendo(true);
    const r = await api.abrirBorradorDeEjecucion(token, o.occurrenceId);
    if (!montada.current) return;
    setAbriendo(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      // Abrir el borrador es una escritura: con el 404 no revelador, quien la usa retira su contenido entero en vez de
      // dejar el plan viejo con un aviso encima (B10-06:1145-1148).
      if (accesoRetirado(r)) return;
      if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return setFallo('Tu plan ya no está vigente. Actualizá la pantalla.');
      if (r.tipo === 'API' && r.codigo === 'OCCURRENCE_NOT_EXECUTABLE') return setFallo('Esa sesión no se puede registrar para esa fecha.');
      return setFallo(falloDe(r).mensaje);
    }
    const b = r.datos.data;
    if (b.state === 'REGISTERED' && b.executionId) return ir({ nombre: 'ejecucion-de-entrenamiento', id: b.executionId });
    if (modo === 'en-vivo') {
      setAbriendo(true);
      await entrenamientoLocal.listo();
      entrenamientoLocal.preparar({
        draftId: b.draftId,
        occurrenceId: o.occurrenceId,
        fecha: o.date,
        modo,
        etiqueta: o.plannedSession.label,
        sesion: sesionDesdeLaOcurrencia(o.plannedSession),
        objetivosGenerales: true,
      });
      entrenamientoLocal.fijarBorrador(b.draftId, b);
      const motivo = await empezarLaCorrida(token, b.draftId, o.plannedSession.prescriptions[0]?.prescriptionId, sesionPerdida);
      if (!montada.current) return;
      setAbriendo(false);
      if (motivo === '') return;
      if (motivo) return setFallo(motivo);
    }
    ir({ nombre: 'sesion-de-entrenamiento', draftId: b.draftId, occurrenceId: o.occurrenceId, sesion: o.plannedSession, fecha: o.date, modo, etiqueta: o.plannedSession.label });
  }

  return { abriendo, fallo, abrir, otraEnCurso } as const;
}

/** El texto del aviso cuando la persona tocó «Iniciar entrenamiento» con otra sesión en curso. */
export const MOTIVO_ANTES_DE_INICIAR = 'Para iniciar esta sesión, primero continuá ese entrenamiento o dejalo incompleto. Lo que registraste en sus series se conserva.';

/**
 * Dentro de una sesión cuyo inicio la API rechazó porque había otra en curso (ANOTHER_SESSION_IN_PROGRESS): cuál es la
 * otra (API-TIE-04 o el teléfono), para continuarla o dejarla incompleta desde acá. Dejada incompleta, esta sesión vuelve
 * a enviar sus eventos pendientes, los mismos: lo marcado y lo escrito se conservan, y lo que ya llegó no se repite.
 */
function OtraSesionQueBloquea({ draftId, token, sesionPerdida, ir, alTerminar }: { draftId: string; token: string; sesionPerdida: AlPerderLaSesion; ir: Ir; alTerminar: () => Promise<unknown> }) {
  const [otra, setOtra] = useState<EnCurso | null>(null);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    void api.sesionEnCurso(token).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      const remota = r.ok ? r.datos.data.inProgress : null;
      setOtra(remota && remota.draftId !== draftId ? enCursoDeLaApi(remota) : enCursoEnElTelefono(entrenamientoLocal.sesiones().filter((s) => s.draftId !== draftId)));
    });
    return () => {
      vigente = false;
    };
  }, [token, draftId, vuelta]);
  if (!otra) return null;
  return (
    <AvisoDeEntrenamientoEnCurso
      enCurso={otra}
      token={token}
      sesionPerdida={sesionPerdida}
      ir={ir}
      motivo="Hasta que lo cierres, los tiempos de esta sesión no se guardan. Lo que registraste acá sigue en el teléfono."
      alTerminar={() => {
        setOtra(null);
        void alTerminar().then(() => setVuelta((v) => v + 1));
      }}
    />
  );
}

function TarjetaDeOcurrencia({
  ocurrencia: o,
  hoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
  enCurso,
  marcha = null,
  bloqueadaPor = null,
  pendiente = null,
  alSaltear,
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: (r: Ruta) => void;
  enCurso: boolean;
  /** Si esta es la sesión en curso: en curso o en pausa. La etiqueta sale de acá, no de cualquier borrador (AV2-09). */
  marcha?: MarchaDeLaCorrida | null;
  /** Otra sesión en curso, si la hay: mientras tanto esta no ofrece empezar (AV2-09). «Ya la hice» sí (AV2-D4). */
  bloqueadaPor?: EnCurso | null;
  /** DL-137: una sesión pendiente de otro día, para preguntar por ella antes de empezar esta. */
  pendiente?: PendienteParaPreguntar | null;
  alSaltear?: () => void;
}) {
  const { abriendo, fallo, abrir, otraEnCurso } = useAbrirOcurrencia({ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir });
  const intentoDeSaltear = useClaveDeIntento();
  const [problema, setProblema] = useState<string | null>(null);
  // La etiqueta: «En curso» o «En pausa» solo para la corrida abierta (AV2-09); el resto, desde `vistaDeOcurrencia`.
  const vista = vistaDeLaSesion(vistaDeOcurrencia(o, hoy), o.execution, marcha);
  const deHoy = o.date === hoy;
  // Con otra sesión en curso, esta no se empieza hoy: primero se continúa o se deja incompleta la otra.
  const sinEmpezar = deHoy && bloqueadaPor !== null;
  const continuar = enCurso || o.execution.state === 'DRAFT_IN_PROGRESS';
  // PA-03 (DL-160): «Ya la hice» registra la sesión por pasos, sin cronómetros, también hoy. Solo sin borrador.
  const local = useEntrenamientoLocal();
  const yaLaHice = sePuedeOfrecer(o, enCurso, local.sesiones());

  /**
   * Empezar una sesión con otra pendiente: la persona decide si la saltea o la deja pendiente (Dirección, 2026-10-16).
   * BE no la saltea solo: dejarla pendiente es tan válido como saltearla.
   */
  async function empezar() {
    setProblema(null);
    if (pendiente && deHoy && !continuar) {
      const decision = await preguntarPorLaPendiente(pendiente);
      if (decision === 'cancelar') return;
      if (decision === 'saltear') {
        const motivo = await saltearSesion(token, pendiente.occurrenceId, intentoDeSaltear.actual(), sesionPerdida);
        if (motivo === 'sesion') return;
        if (motivo !== COPY.resultadoIncierto) intentoDeSaltear.descartar();
        if (motivo) return setProblema(motivo);
        alSaltear?.();
      }
    }
    await abrir();
  }
  // Hoy se entrena con los cronómetros; otro día se registra lo hecho, sin cronómetros.
  const accion = deHoy
    ? continuar
      ? COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento
      : COPY_ENTRENAMIENTO_POR_SERIE.iniciarEntrenamiento
    : continuar
      ? COPY_ENTRENAMIENTO.continuarSesion
      : COPY_ENTRENAMIENTO.comenzarSesion;

  return (
    <Tarjeta>
      <View style={estilos.cabezaDeSesion}>
        <View style={estilos.iconoDeSesion}>
          <IconoDeEjercicio color={COLOR.acento} tamano={30} />
        </View>
        <View style={estilos.textosDeSesion}>
          <Subtitulo>{o.plannedSession.label}</Subtitulo>
          <Parrafo tenue>{`${ejerciciosYSeries(o.plannedSession.prescriptions)}${deHoy ? '' : ` · ${fechaCivil(o.date)}`}`}</Parrafo>
        </View>
      </View>
      <Insignia texto={vista.texto} hecha={vista.hecha} etiqueta="Estado" icono={vista.icono} />
      {/* La acción va arriba, antes de lo planificado: con una sesión larga, al final de la tarjeta quedaba fuera de la vista. */}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {problema ? <Aviso tipo="error" titulo={problema} /> : null}
      {/* Otra sesión en curso: continuarla o dejarla incompleta; dejada incompleta, se vuelve a intentar iniciar esta. */}
      {otraEnCurso ? <AvisoDeEntrenamientoEnCurso enCurso={otraEnCurso} token={token} sesionPerdida={sesionPerdida} ir={ir} alTerminar={() => void abrir()} motivo={MOTIVO_ANTES_DE_INICIAR} /> : null}
      {o.execution.state === 'REGISTERED' && o.execution.executionId ? (
        <Boton texto="Ver registro" tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: o.execution.executionId! })} />
      ) : (
        <>
          {sinEmpezar && bloqueadaPor ? <Parrafo tenue>{TEXTOS_DE_LA_VUELTA.hayUnEntrenamientoEnCurso(bloqueadaPor.etiqueta)}</Parrafo> : null}
          <AlLado>
            {sinEmpezar ? null : <Boton texto={accion} onPress={() => void empezar()} ocupado={abriendo} />}
            {yaLaHice ? <Boton texto={TEXTOS_DEL_REGISTRO_RAPIDO.yaLaHice} tipo="secundario" onPress={() => ir(aRegistroRapido(o))} deshabilitado={abriendo} icono="ya-la-hice" /> : null}
          </AlLado>
        </>
      )}
      {o.plannedSession.prescriptions.map((p) => (
        <Text key={p.prescriptionId} style={estilos.ejercicioDeLaSesion}>
          {`${p.exerciseName} · ${cantidadDeSeries(p.sets.length)}`}
        </Text>
      ))}
      {o.plannedSession.instructions ? <Parrafo tenue>{o.plannedSession.instructions}</Parrafo> : null}
    </Tarjeta>
  );
}

// ─── La sesión enfocada ─────────────────────────────────────────────────────────────────────────

type Dialogo = null | { readonly tipo: 'rutina' } | { readonly tipo: 'tecnica' | 'sustituir'; readonly prescriptionId: string };

/** Lo que se declara para no perderlo al salir, si el guardado en el teléfono falló: lo escrito en un ejercicio. */
const loEscritoEn = (p: PrescripcionConObjetivos | undefined): string | null => (p ? `lo que cargaste en «${p.exerciseName}»` : null);

/** La descripción de una medición abierta: «Descanso · Serie 1 · Sentadilla goblet, desde las 10:42». */
function descripcionDeLaMedicion(m: { readonly kind: 'REST' | 'SET'; readonly setIndex: number; readonly prescriptionId: string; readonly inicio: { readonly at: { readonly civil: string } } }, nombreDe: (id: string) => string): string {
  const que = m.kind === 'REST' ? COPY_ENTRENAMIENTO_POR_SERIE.descansoDeLaSerie(m.setIndex) : COPY_ENTRENAMIENTO_POR_SERIE.serieEnCurso(m.setIndex);
  return `${que} · ${nombreDe(m.prescriptionId)}, desde las ${horaDe(m.inicio.at.civil)}.`;
}

export function PantallaDeSesion({
  token,
  draftId,
  occurrenceId,
  sesion: ocurrenciaPlanificada,
  fechaDeLaSesion,
  modo: modoDeLaRuta,
  etiqueta,
  salir,
  ir,
  subir,
}: {
  token: string;
  draftId: string;
  occurrenceId?: string;
  sesion?: SesionDeOcurrencia;
  fechaDeLaSesion: string;
  modo?: 'en-vivo' | 'otro-dia';
  etiqueta?: string;
  salir: (m: Salida) => void;
  ir: Ir;
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  const almacen = useEntrenamientoLocal();
  const local: SesionLocal | null = almacen.sesion(draftId);
  const hoy = useDiaDeLaApi();
  const modo = local?.modo ?? modoDeLaRuta ?? (fechaDeLaSesion === hoy ? 'en-vivo' : 'otro-dia');
  const [carga, setCarga] = useState<'leyendo' | 'lista' | 'error'>('leyendo');
  // Lo escrito vive en el almacén del teléfono (PA-01): acá quedan solo los errores de la última fila que se quiso tildar.
  const [errores, setErrores] = useState<{ readonly setIndex: number; readonly errores: ErroresDeFila } | null>(null);
  /**
   * AV2-30: la serie que «Terminar serie N» no pudo registrar porque falta un dato, con lo que falta. La fila fija pasa a
   * «Registrar serie N» con ese motivo junto al botón; se olvida al registrarla, al cronometrar otra o al cambiar de ejercicio.
   */
  const [porRegistrar, setPorRegistrar] = useState<{ readonly prescriptionId: string; readonly setIndex: number; readonly nota: string } | null>(null);
  /** La fila en la que se escribe el tiempo sin medirlo (se mantuvo apretado su reloj). */
  const [escribiendoTiempo, setEscribiendoTiempo] = useState<number | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [hora, setHora] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'info' | 'exito'; texto: string } | null>(null);
  /** Por qué no se pudo guardar una sustitución: se dice en su diálogo, no arriba de la pantalla, que queda detrás. */
  const [falloDeSustitucion, setFalloDeSustitucion] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [, setPulso] = useState(0);
  // DL-166 (AV-11, AV-12): los ajustes del descanso (en el teléfono), su hoja, y el permiso de avisos, pedido en contexto.
  const ajustes = useAjustesDelDescanso();
  const [hojaDelDescanso, setHojaDelDescanso] = useState(false);
  const [permiso, setPermiso] = useState<PermisoDeAvisos>('dado');
  const [permisoCerrado, setPermisoCerrado] = useState(false);
  useEffect(() => {
    void permisoDeAvisos().then(setPermiso);
  }, []);
  // Un doble toque es una sola operación: el segundo toque llega antes de que la pantalla se vuelva a dibujar.
  const enCurso = useRef(false);
  const intentoDeConfirmar = useClaveDeIntento();
  const { width, fontScale } = useWindowDimensions();

  const sincronizar = useCallback(async () => {
    const r = await entrenamientoLocal.sincronizar(draftId);
    if (r && !sesionPerdida(r)) accesoRetirado(r);
  }, [draftId, sesionPerdida, accesoRetirado]);

  /** Al entrar: el borrador (API-TRN-16), la sesión con sus objetivos (API-SER-02) y los tiempos (API-TIE-02). */
  const leer = useCallback(async () => {
    setCarga('leyendo');
    await entrenamientoLocal.listo();
    const b = await api.consultarBorradorDeEjecucion(token, draftId);
    if (sesionPerdida(b)) return;
    if (!b.ok && accesoRetirado(b)) return;
    if (b.ok && b.datos.data.state === 'REGISTERED' && b.datos.data.executionId) {
      entrenamientoLocal.descartar(draftId);
      return ir({ nombre: 'ejecucion-de-entrenamiento', id: b.datos.data.executionId }, 'reemplazar');
    }
    const ocurrencia = occurrenceId ?? entrenamientoLocal.sesion(draftId)?.occurrenceId ?? (b.ok ? b.datos.data.occurrenceId : null);
    if (!ocurrencia) return setCarga('error');
    entrenamientoLocal.preparar({
      draftId,
      occurrenceId: ocurrencia,
      fecha: b.ok ? b.datos.data.date : fechaDeLaSesion,
      modo,
      etiqueta: etiqueta ?? ocurrenciaPlanificada?.label ?? COPY_ENTRENAMIENTO.pestana,
      sesion: ocurrenciaPlanificada ? sesionDesdeLaOcurrencia(ocurrenciaPlanificada) : null,
      objetivosGenerales: true,
    });
    if (b.ok) entrenamientoLocal.fijarBorrador(draftId, b.datos.data);
    const s = await api.sesionParaRegistrar(token, ocurrencia);
    if (sesionPerdida(s)) return;
    if (s.ok) entrenamientoLocal.fijarSesionDelPlan(draftId, s.datos.data.session, false);
    if (modo === 'en-vivo') {
      const t = await api.tiemposDelBorrador(token, draftId);
      if (sesionPerdida(t)) return;
      if (t.ok) entrenamientoLocal.fijarTiemposDelServidor(draftId, t.datos.data.events.map((e) => e.event));
    }
    // Sin red se sigue con lo guardado en el teléfono; sin nada guardado, no hay qué mostrar.
    setCarga(entrenamientoLocal.sesion(draftId)?.sesion ? 'lista' : 'error');
    void sincronizar();
  }, [token, draftId, occurrenceId, fechaDeLaSesion, modo, etiqueta, ocurrenciaPlanificada, sesionPerdida, accesoRetirado, ir, sincronizar]);

  // Se lee una vez al entrar; «Reintentar» vuelve a leer.
  const leido = useRef(false);
  useEffect(() => {
    if (leido.current) return;
    leido.current = true;
    void leer();
  }, [leer]);

  // Al salir de la sesión (por la barra, la cabecera o atrás), lo escrito que esperaba su demora se guarda ya (PA-01).
  useEffect(
    () => () => {
      void entrenamientoLocal.guardarYa();
    },
    [],
  );

  // ─── Lo que se deriva ───
  const estado = local ? estadoLocal(local.corrida) : null;
  const corre = !!estado && estado.runId !== null && estado.cierre === null && (!estado.pausada || estado.medicionAbierta !== null);
  // Un redibujo por segundo mientras corre. No mide nada: lo que se muestra sale de los instantes (`enVivo`).
  useEffect(() => {
    if (!corre) return;
    const intervalo = setInterval(() => setPulso((n) => n + 1), 1000);
    return () => clearInterval(intervalo);
  }, [corre]);

  const sesionDelPlan = local?.sesion ?? null;
  const prescripciones = sesionDelPlan?.prescriptions ?? [];
  const nombreDe = (id: string) => prescripciones.find((x) => x.prescriptionId === id)?.exerciseName ?? 'Ejercicio';
  const recomendadoDe = (id: string, setIndex: number) => prescripciones.find((x) => x.prescriptionId === id)?.sets.find((s) => s.setIndex === setIndex)?.target.restSeconds ?? null;
  const conCorrida = modo === 'en-vivo' && estado !== null && estado.runId !== null && estado.cierre === null;
  const activoDeLaCorrida = conCorrida ? estado.ejercicioActivo : null;
  const p = prescripciones.find((x) => x.prescriptionId === (activoDeLaCorrida ?? local?.foco?.prescriptionId)) ?? prescripciones[0] ?? null;
  const borrador = local?.borrador ?? null;
  const quitadas = local?.quitadas ?? [];
  const escritasDeLaSesion = local?.escritas ?? {};
  const unidadDe = (x: PrescripcionConObjetivos): Unidad => local?.unidades[x.prescriptionId] ?? unidadDelEjercicio(x);
  const unidad: Unidad = p ? unidadDe(p) : 'kg';
  const proteccion = (l: SerieLocal) => almacen.proteccionDeSerie(draftId, l);
  /** Las filas de un ejercicio: lo del servidor sin lo destildado, lo del teléfono, las filas de más y las escritas. */
  const filasDe = (x: PrescripcionConObjetivos) => filasDelEjercicio(x, guardadasVigentes(borrador, x.prescriptionId, quitadas), local?.series ?? [], local?.filasDeMas[x.prescriptionId] ?? 0, proteccion, escritasDelEjercicio(escritasDeLaSesion, x.prescriptionId).keys());
  const escritasDelActivo = p ? escritasDelEjercicio(escritasDeLaSesion, p.prescriptionId) : new Map<number, FilaEscritaGuardada>();
  const filas = p ? filasDe(p) : [];
  const focoGuardado = local?.foco && p && local.foco.prescriptionId === p.prescriptionId ? local.foco.setIndex : null;
  const filaActiva = filas.find((f) => f.setIndex === focoGuardado) ?? primeraSinRegistrar(filas) ?? filas[filas.length - 1] ?? null;
  const vivo = local ? enVivoDeLaCorrida(local.corrida, almacen.reloj) : null;
  const calculo = local ? calcularTiempos(eventosDeLaCorrida(local.corrida), recomendadoDe) : null;
  const abierta = estado?.medicionAbierta ?? null;
  const deOtroProceso = local && modo === 'en-vivo' ? almacen.medicionDeOtroProceso(draftId) : null;
  const envio = local ? estadoDeSincronizacion(local, almacen.enviando(draftId)) : 'sincronizado';

  // Lo escrito queda guardado en el teléfono (PA-01): salir ya no pregunta por eso, salvo que el guardado haya fallado o
  // que no se haya podido leer lo guardado. El motivo y la hora del resumen siguen preguntando: viven en la pantalla.
  const guardado = almacen.estadoDelGuardado();
  const sinProteger = guardado === 'fallo-al-guardar' || guardado === 'sin-leer';
  const conEscritura = sinProteger ? prescripciones.find((x) => Object.entries(escritasDeLaSesion).some(([clave, f]) => clave.startsWith(`${x.prescriptionId}:`) && hayAlgoEscrito(f))) : undefined;
  useCambiosSinGuardar(loEscritoEn(conEscritura));
  useCambiosSinGuardar(borrador !== null && (motivo.trim() !== (borrador.reason ?? '').trim() || (finalizando && hora.trim() !== '')) ? 'lo que escribiste en esta sesión' : null);

  // La fila enfocada se guarda en el teléfono: al volver, la misma fila del mismo ejercicio.
  const idDelFoco = p?.prescriptionId ?? null;
  const serieDelFoco = filaActiva?.setIndex ?? null;
  useEffect(() => {
    if (idDelFoco !== null && serieDelFoco !== null) entrenamientoLocal.enfocar(draftId, { prescriptionId: idDelFoco, setIndex: serieDelFoco });
  }, [draftId, idDelFoco, serieDelFoco]);

  // El motivo de la condición: el guardado, una vez, cuando llega el borrador. Después manda lo que escribe la persona.
  const motivoInicial = useRef(false);
  useEffect(() => {
    if (!borrador || motivoInicial.current) return;
    motivoInicial.current = true;
    setMotivo(borrador.reason ?? '');
  }, [borrador]);

  // ─── Las acciones ───
  function hacer(accion: AccionDeTiempo, anuncio?: string): boolean {
    setAviso(null);
    const r = entrenamientoLocal.accion(draftId, accion);
    if (!r.ok) {
      setAviso({ tipo: 'error', texto: textoDelRechazo(r.motivo) });
      return false;
    }
    // Al lector de pantalla, solo el inicio y el fin: el conteo no se anuncia.
    if (anuncio) AccessibilityInfo.announceForAccessibility(anuncio);
    void sincronizar();
    return true;
  }

  function enfocar(setIndex: number) {
    if (!p) return;
    setErrores(null);
    setEscribiendoTiempo((x) => (x === setIndex ? x : null));
    entrenamientoLocal.enfocar(draftId, { prescriptionId: p.prescriptionId, setIndex });
  }

  /** Lo escrito en una fila va al almacén del teléfono con la unidad del ejercicio; una fila que queda vacía se olvida. */
  function escribir(setIndex: number, campo: keyof FilaEscrita, texto: string) {
    if (!p) return;
    const previa = escritasDelActivo.get(setIndex);
    const fila: FilaEscritaGuardada = { ...FILA_VACIA, tiempo: '', ...previa, [campo]: texto, unidad };
    entrenamientoLocal.escribirEnFila(draftId, claveDeFila(p.prescriptionId, setIndex), hayAlgoEscrito(fila) ? fila : null);
    if (errores?.setIndex === setIndex && (errores.errores[campo] || errores.errores.fila)) setErrores({ setIndex, errores: { ...errores.errores, [campo]: undefined, fila: undefined } });
  }

  /**
   * Cierra la serie cronometrada que está abierta y anota lo medido en el tiempo de su fila, si todavía no está
   * registrada (DL-161: medido, nunca inferido). Devuelve los segundos medidos, o `null`.
   */
  function pararElReloj(medida: { readonly prescriptionId: string; readonly setIndex: number }, accion: AccionDeTiempo = { tipo: 'finalizar-serie' }, anuncio = TEXTOS_DE_LA_SESION.serieMedida(medida.setIndex)): number | null {
    if (!hacer(accion, anuncio)) return null;
    const s = entrenamientoLocal.sesion(draftId);
    if (!s) return null;
    const segundos = segundosMedidosDeLaFila(s.corrida, medida.prescriptionId, medida.setIndex);
    if (segundos === null) return null;
    const presc = prescripciones.find((x) => x.prescriptionId === medida.prescriptionId);
    const yaRegistrada = !!presc && filasDe(presc).some((f) => f.setIndex === medida.setIndex && f.estado !== 'sin-registrar');
    if (presc && !yaRegistrada) {
      const clave = claveDeFila(medida.prescriptionId, medida.setIndex);
      const previa = s.escritas[clave];
      entrenamientoLocal.escribirEnFila(draftId, clave, { ...FILA_VACIA, ...previa, tiempo: textoDeTiempo(segundos), unidad: previa?.unidad ?? unidadDe(presc) });
    }
    return segundos;
  }

  /** El reloj de la fila: lo para si es el de esa serie; si no, para el que corría (si había uno) y arranca el de esta. */
  function relojDeLaFila(setIndex: number) {
    if (!p || enCurso.current) return;
    if (abierta?.kind === 'SET' && abierta.prescriptionId === p.prescriptionId && abierta.setIndex === setIndex) {
      pararElReloj(abierta);
      return;
    }
    if (abierta?.kind === 'SET') {
      pararElReloj(abierta);
      const ahora = entrenamientoLocal.sesion(draftId);
      if (ahora && estadoLocal(ahora.corrida).medicionAbierta?.kind === 'SET') return;
    }
    // Con un descanso en curso, la acción compuesta lo finaliza y arranca la serie en el mismo instante.
    if (!hacer({ tipo: 'cronometrar-serie', prescriptionId: p.prescriptionId, setIndex }, COPY_ENTRENAMIENTO_POR_SERIE.serieEnCurso(setIndex))) return;
    setPorRegistrar(null);
    enfocar(setIndex);
  }

  function escribirTiempo(setIndex: number) {
    enfocar(setIndex);
    setEscribiendoTiempo(setIndex);
  }

  /**
   * La casilla de la fila (PA-02). Tildar registra la serie con lo escrito y, en lo vacío, lo planificado que se veía, y
   * para su reloj si corría; el foco pasa a la próxima sin registrar del mismo ejercicio. Destildar deshace el registro
   * mientras la sesión no se confirmó: lo escrito vuelve a la fila.
   */
  function tildar(f: FilaDeLaTabla) {
    if (!p || enCurso.current) return;
    enCurso.current = true;
    try {
      if (f.estado === 'sin-registrar') {
        let escrita: FilaEscrita = escritasDelActivo.get(f.setIndex) ?? FILA_VACIA;
        const unidadDeLaFila = escritasDelActivo.get(f.setIndex)?.unidad ?? unidad;
        const cronometrandose = abierta?.kind === 'SET' && abierta.prescriptionId === p.prescriptionId && abierta.setIndex === f.setIndex;
        // AV2-30 (revisión): se valida antes de cerrar el reloj y de empezar el descanso, con lo que se lleva medido.
        if (cronometrandose) {
          const ahora = entrenamientoLocal.sesion(draftId);
          const ms = ahora ? (enVivoDeLaCorrida(ahora.corrida, almacen.reloj)?.medicionAbierta?.ms ?? null) : null;
          const plan = alTerminarLaSerie(escrita, f.objetivo, f.setIndex, unidadDeLaFila, ms);
          if (plan.tipo === 'medicion-larga') {
            // No se escribe en la fila: se resuelve como la medición que quedó abierta, y después se registra.
            const serie = { prescriptionId: p.prescriptionId, setIndex: f.setIndex };
            enfocar(f.setIndex);
            void preguntarPorLaMedicionLarga(plan.anuncio).then((resolucion) => {
              if (resolucion === 'cancelar') return;
              if (!hacer({ tipo: 'resolver-medicion', resolucion }, resolucion === 'termino-ahora' ? 'Medición finalizada' : 'Medición incompleta')) return;
              setPorRegistrar({ ...serie, nota: TEXTOS_DE_LA_SESION.medicionResuelta(f.setIndex) });
            });
            return;
          }
          if (plan.tipo === 'falta-un-dato') {
            // Solo se para el reloj: sin descanso, la serie sigue sin registrar y la fila fija dice qué falta.
            pararElReloj(abierta);
            enfocar(f.setIndex);
            setErrores({ setIndex: f.setIndex, errores: plan.errores });
            setPorRegistrar({ prescriptionId: p.prescriptionId, setIndex: f.setIndex, nota: plan.anuncio });
            AccessibilityInfo.announceForAccessibility(plan.anuncio);
            return;
          }
        }
        // DL-166 (PV-7, AVD-3): con el ajuste automático, el descanso de esta serie empieza al tildarla, salvo tras la
        // última del ejercicio. Si la serie se estaba cronometrando, la misma acción cierra su medición.
        const ultimaDelEjercicio = f.setIndex === Math.max(...filas.map((x) => x.setIndex));
        const descansoAuto = accionAlTildar(estado, ajustesDelDescanso.actuales(), { prescriptionId: p.prescriptionId, setIndex: f.setIndex, ultimaDelEjercicio });
        let descansoEmpezado = false;
        if (abierta?.kind === 'SET' && abierta.prescriptionId === p.prescriptionId && abierta.setIndex === f.setIndex) {
          const medidos = descansoAuto ? pararElReloj(abierta, descansoAuto, anuncioDelDescanso(f.setIndex)) : pararElReloj(abierta);
          descansoEmpezado = descansoAuto !== null && medidos !== null;
          if (medidos !== null) escrita = { ...escrita, tiempo: textoDeTiempo(medidos) };
        }
        const lectura = serieAlTildar(escrita, f.objetivo, f.setIndex, unidadDeLaFila);
        if (!lectura.ok) {
          const anuncio = anuncioParaRegistrar(escrita, f.objetivo, f.setIndex, lectura.errores);
          enfocar(f.setIndex);
          setErrores({ setIndex: f.setIndex, errores: lectura.errores });
          if (porRegistrar?.prescriptionId === p.prescriptionId && porRegistrar.setIndex === f.setIndex) setPorRegistrar({ ...porRegistrar, nota: anuncio });
          AccessibilityInfo.announceForAccessibility(anuncio);
          return;
        }
        setErrores(null);
        setPorRegistrar(null);
        // Se registra con el ejercicio que figura en el borrador: una sustitución hecha antes se respeta (DL-151).
        const resultado = entrenamientoLocal.registrarSerie(draftId, { prescriptionId: p.prescriptionId, performedExerciseVersionId: ejercicioRealizadoDe(borrador, p), serie: lectura.serie }, { olvidarFilasDeMas: !f.planificada });
        if (resultado !== 'registrada') return;
        setEscribiendoTiempo(null);
        AccessibilityInfo.announceForAccessibility(TEXTOS_DE_LA_SESION.serieRegistradaAnuncio(f.setIndex));
        if (descansoAuto && !descansoEmpezado) hacer(descansoAuto, anuncioDelDescanso(f.setIndex));
        const tildadas = filas.map((x): FilaDeLaTabla => (x.setIndex === f.setIndex ? { ...x, estado: 'pendiente-de-enviar' } : x));
        const siguiente = focoTrasTildar(tildadas, f.setIndex, filaActiva?.setIndex ?? f.setIndex);
        entrenamientoLocal.enfocar(draftId, { prescriptionId: p.prescriptionId, setIndex: siguiente });
        void sincronizar();
        return;
      }
      if (f.estado === 'en-conflicto' || !f.registrada) return;
      const restaurar = escritaDeLaSerie(f.registrada, unidad);
      const conAlgo = hayAlgoEscrito(restaurar);
      // Una carga registrada en otra unidad vuelve con su unidad: la columna del ejercicio pasa a esa.
      if (conAlgo && restaurar.carga !== '' && restaurar.unidad !== unidad) entrenamientoLocal.fijarUnidad(draftId, p.prescriptionId, restaurar.unidad);
      if (entrenamientoLocal.quitarSerie(draftId, p.prescriptionId, f.setIndex, conAlgo ? restaurar : null) !== 'quitada') return;
      // Destildar con su descanso corriendo lo termina (AVD-3): el evento no se borra, se cierra.
      const terminarElDescanso = accionAlDestildar(estado, { prescriptionId: p.prescriptionId, setIndex: f.setIndex });
      if (terminarElDescanso) hacer(terminarElDescanso);
      setErrores(null);
      AccessibilityInfo.announceForAccessibility(TEXTOS_DE_LA_SESION.serieDestildada(f.setIndex));
      entrenamientoLocal.enfocar(draftId, { prescriptionId: p.prescriptionId, setIndex: f.setIndex });
      void sincronizar();
    } finally {
      enCurso.current = false;
    }
  }

  function pasarA(prescriptionId: string) {
    const destino = prescripciones.find((x) => x.prescriptionId === prescriptionId);
    if (!destino) return;
    // Pasar a otro ejercicio es explícito: con la corrida, marca el ejercicio activo. Ver su técnica no.
    if (conCorrida && estado?.ejercicioActivo !== prescriptionId && !hacer({ tipo: 'activar-ejercicio', prescriptionId })) return;
    const filasDestino = filasDe(destino);
    entrenamientoLocal.enfocar(draftId, { prescriptionId, setIndex: (primeraSinRegistrar(filasDestino) ?? filasDestino[0])?.setIndex ?? 1 });
    setErrores(null);
    setPorRegistrar(null);
    setEscribiendoTiempo(null);
    setDialogo(null);
  }

  function finalizarDescanso() {
    if (abierta?.kind !== 'REST') return;
    if (!hacer({ tipo: 'finalizar-descanso' }, 'Descanso finalizado')) return;
    if (p && filaActiva && abierta.prescriptionId === p.prescriptionId) enfocar(focoTrasElDescanso(filas, abierta.setIndex, filaActiva.setIndex));
  }

  /** «Pausar sesión»: en pausa no se mide nada; si una serie se estaba midiendo, lo medido queda en su fila. */
  function pausar() {
    if (abierta?.kind === 'SET') pararElReloj(abierta, { tipo: 'pausar' }, COPY_ENTRENAMIENTO_POR_SERIE.sesionEnPausa);
    else hacer({ tipo: 'pausar' }, COPY_ENTRENAMIENTO_POR_SERIE.sesionEnPausa);
  }

  async function iniciarEntrenamiento() {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    const motivoDelFallo = await empezarLaCorrida(token, draftId, p?.prescriptionId, sesionPerdida);
    setOcupado(false);
    enCurso.current = false;
    if (motivoDelFallo) setAviso({ tipo: 'error', texto: motivoDelFallo });
  }

  /** Guarda un cambio del borrador (la condición, la hora) con la versión vigente, después de mandar lo pendiente. */
  async function guardarEnElBorrador(cambios: Parameters<typeof api.guardarBorradorDeEjecucion>[2]['changes']): Promise<boolean> {
    setOcupado(true);
    setAviso(null);
    const previo = await entrenamientoLocal.sincronizarYEsperar(draftId);
    if (previo && sesionPerdida(previo)) return false;
    const vigente = entrenamientoLocal.sesion(draftId)?.borrador;
    if (!vigente) {
      setOcupado(false);
      setAviso({ tipo: 'error', texto: COPY.resultadoIncierto });
      return false;
    }
    const r = await api.guardarBorradorDeEjecucion(token, draftId, { expectedVersion: vigente.version, changes: cambios });
    setOcupado(false);
    if (sesionPerdida(r)) return false;
    if (!r.ok) {
      if (accesoRetirado(r)) return false;
      const f = falloDe(r);
      if (f.tipo === 'actualizar') void entrenamientoLocal.actualizarBorrador(draftId);
      setAviso({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato que no se puede guardar. Revisalo.' : f.mensaje });
      return false;
    }
    entrenamientoLocal.fijarBorrador(draftId, r.datos.data);
    return true;
  }

  /**
   * «Confirmar sustitución» (DL-151): el ejercicio realizado de la prescripción, con API-TRN-17. Como
   * `guardarEnElBorrador`, primero manda lo pendiente y guarda con la versión vigente; pero los cambios se arman sobre ese
   * borrador vigente (`cambiosParaSustituir`), y el fallo se dice en el diálogo. Con series ya registradas, antes
   * pregunta: pasan a contar como el elegido. No arma eventos ni cambia la fila enfocada: los tiempos siguen como estaban.
   */
  async function sustituir(prescripcion: PrescripcionConObjetivos, elegido: EjercicioNombrado) {
    if (enCurso.current) return;
    enCurso.current = true;
    setFalloDeSustitucion(null);
    try {
      const enElTelefono = entrenamientoLocal.sesion(draftId);
      const antes = sustitucionDe(prescripcion, enElTelefono?.borrador ?? null, enElTelefono?.series ?? []);
      const confirmacion = textoDeLaConfirmacion(antes, elegido);
      if (confirmacion && !(await preguntar(COPY_ENTRENAMIENTO.sustituirEjercicio, confirmacion, COPY_ENTRENAMIENTO.confirmarSustitucion, 'default'))) return;
      setOcupado(true);
      const previo = await entrenamientoLocal.sincronizarYEsperar(draftId);
      if (previo && sesionPerdida(previo)) return;
      const vigente = entrenamientoLocal.sesion(draftId)?.borrador ?? null;
      if (!vigente) return setFalloDeSustitucion(COPY.resultadoIncierto);
      if (!sePuedeSustituir(vigente)) return setFalloDeSustitucion(TEXTOS_DE_LA_SUSTITUCION.cambioLaSesion);
      const cambios = cambiosParaSustituir(vigente, prescripcion, elegido.versionId);
      if (!cambios) return setDialogo(null);
      const r = await api.guardarBorradorDeEjecucion(token, draftId, { expectedVersion: vigente.version, changes: cambios });
      if (sesionPerdida(r)) return;
      if (!r.ok) {
        if (accesoRetirado(r)) return;
        const f = falloDe(r, { EXERCISE_REFERENCE_INVALID: { mensaje: TEXTOS_DE_LA_SUSTITUCION.noSePuedeRegistrar, tipo: 'otro' } });
        // Otro dispositivo cambió el borrador, o no se sabe si llegó: se relee, y la tarjeta dice lo que quedó guardado.
        if (f.tipo === 'actualizar' || f.tipo === 'incierto') void entrenamientoLocal.actualizarBorrador(draftId);
        // Sin respuesta (R-5): no se sabe si llegó; se dice eso, con lo que hacer, y que lo registrado no se pierde.
        return setFalloDeSustitucion(f.tipo === 'incierto' ? TEXTOS_DE_LA_SUSTITUCION.sinRespuestaAlGuardar : f.mensaje);
      }
      entrenamientoLocal.fijarBorrador(draftId, r.datos.data);
      setDialogo(null);
      AccessibilityInfo.announceForAccessibility(TEXTOS_DE_LA_SUSTITUCION.anuncio(elegido.nombre, elegido.versionId === antes.planificado.versionId));
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  async function cambiarAPorSerie() {
    if (!borrador) return;
    const cargado = borrador.exercises.length > 0 || borrador.sessionSummary !== null;
    if (cargado && !(await preguntar('Registrar por serie', 'Se descarta lo cargado por ejercicio o sesión: lo cargado de una forma no se pasa a la otra.', 'Descartar y seguir'))) return;
    await guardarEnElBorrador({ granularity: 'SET', exercises: [], sessionSummary: null });
  }

  async function noPude() {
    if (!borrador) return;
    // Un acto explícito: sin granularidad ni series, con motivo opcional (REG-06-131). Si ya había algo registrado, se
    // descarta, y se pregunta antes.
    const series = borrador.exercises.reduce((n, e) => n + (e.sets?.length ?? 0), 0) + (local?.series.length ?? 0);
    if (series > 0 && !(await preguntar(COPY_ENTRENAMIENTO.noPudeRealizarla, `Se descartan ${cantidadDeSeries(series)} de esta sesión.`, 'Descartar y seguir'))) return;
    entrenamientoLocal.descartarSeries(draftId);
    await guardarEnElBorrador({ sessionCondition: 'NOT_COMPLETED', granularity: null, exercises: [], sessionSummary: null, reason: motivoQueViaja('NOT_COMPLETED', motivo) });
  }

  /** Lo escrito sin registrar de toda la sesión, en el teléfono ahora (PA-01). */
  function pendientesAhora() {
    const s = entrenamientoLocal.sesion(draftId);
    return s?.sesion ? pendientesDeRegistrar(s.sesion, s.borrador, s.series, s.quitadas, s.escritas) : [];
  }

  /**
   * «Registrarlas», en «Antes de finalizar» (PA-01): registra de una lo escrito sin registrar, como si se tildara cada
   * fila. Las que no se pueden registrar quedan escritas, y se dice por qué.
   */
  function registrarPendientes() {
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      let registradas = 0;
      const fallas: string[] = [];
      for (const x of pendientesAhora()) {
        if (!x.lectura.ok) {
          fallas.push(TEXTOS_DE_LA_SESION.noSePudoRegistrar(x.nombre, x.setIndex, motivoDeLaLectura(x.lectura)));
          continue;
        }
        const presc = prescripciones.find((q) => q.prescriptionId === x.prescriptionId);
        if (!presc) continue;
        const r = entrenamientoLocal.registrarSerie(draftId, { prescriptionId: x.prescriptionId, performedExerciseVersionId: ejercicioRealizadoDe(entrenamientoLocal.sesion(draftId)?.borrador ?? null, presc), serie: x.lectura.serie }, { olvidarFilasDeMas: !x.planificada });
        if (r === 'registrada') registradas++;
      }
      const hechas = registradas > 0 ? TEXTOS_DE_LA_SESION.registradasDeUna(registradas) : null;
      if (fallas.length > 0) setAviso({ tipo: 'error', texto: [hechas, ...fallas].filter((x): x is string => x !== null).join(' ') });
      else if (hechas) setAviso({ tipo: 'info', texto: hechas });
      if (hechas) AccessibilityInfo.announceForAccessibility(hechas);
      void sincronizar();
    } finally {
      enCurso.current = false;
    }
  }

  async function descartarEscritas() {
    if (!(await preguntar(TEXTOS_DE_LA_SESION.descartarLoEscrito, TEXTOS_DE_LA_SESION.descartarDetalle, TEXTOS_DE_LA_SESION.descartar))) return;
    entrenamientoLocal.olvidarEscritas(draftId, pendientesAhora().map((x) => claveDeFila(x.prescriptionId, x.setIndex)));
  }

  /**
   * Finalizar: lo abierto ya se resolvió; se mandan las series, se cierra la corrida (SESSION_FINISHED) y se mandan los
   * tiempos; después se confirma el borrador (API-TRN-18) con su clave de idempotencia. Nada se confirma a medias. Lo
   * escrito sin registrar no se pierde en silencio: primero se registra o se descarta (PA-01).
   */
  async function finalizar() {
    if (enCurso.current) return;
    enCurso.current = true;
    setAviso(null);
    setOcupado(true);
    try {
      let s = entrenamientoLocal.sesion(draftId);
      if (!s?.borrador) return setAviso({ tipo: 'error', texto: COPY.resultadoIncierto });
      if (modo === 'en-vivo' && estadoLocal(s.corrida).medicionAbierta) return setAviso({ tipo: 'error', texto: 'Hay una medición abierta: resolvela antes de finalizar.' });
      if (pendientesAhora().length > 0) return setAviso({ tipo: 'error', texto: TEXTOS_DE_LA_SESION.quedanEscritas });
      // AV2-31: «Realizada» viene elegida solo cuando los datos lo dicen (todo lo del plan registrado, nada sustituido).
      const condicion = s.borrador.sessionCondition ?? (s.sesion ? condicionQueCorresponde(resumenDelRegistro(s.sesion, s.borrador, s.series, s.quitadas, s.escritas)) : null);
      if (!condicion) return setAviso({ tipo: 'error', texto: TEXTOS_DEL_CIERRE.faltaLaCondicion });
      const cambiaLaCondicion = condicion !== s.borrador.sessionCondition;
      // Con «Realizada» no viaja motivo, aunque haya quedado algo escrito al pasar por el desvío.
      const elMotivo = motivoQueViaja(condicion, motivo);
      const cambiaElMotivo = elMotivo !== (s.borrador.reason?.trim() || null);
      if ((cambiaLaCondicion || cambiaElMotivo) && !(await guardarEnElBorrador({ ...(cambiaLaCondicion ? { sessionCondition: condicion } : {}), ...(cambiaElMotivo ? { reason: elMotivo } : {}) }))) return;
      s = entrenamientoLocal.sesion(draftId);
      // Una «no realizada» de un día pasado no tiene hora: la API pone el último instante de ese día (DL-137 D-5).
      if (s?.borrador && !s.borrador.occurredAt && s.borrador.sessionCondition !== 'NOT_COMPLETED') {
        // AV2-35: la hora se toma sola al empezar, si «Iniciar entrenamiento» cayó en el día de la sesión.
        const tomada = horaTomadaAlEmpezar({ fechaDeLaSesion: s.borrador.date, zona: s.borrador.timeZone, inicio: inicioDeLaCorrida(eventosDeLaCorrida(s.corrida)) });
        if (tomada) {
          if (!(await guardarEnElBorrador({ occurredAt: tomada }))) return;
        } else if (s.borrador.date !== hoyEn(s.borrador.timeZone)) {
          if (!/^\d{2}:\d{2}$/.test(hora)) return setAviso({ tipo: 'error', texto: COPY_ENTRENAMIENTO.horaRequerida });
          // Argentina no tiene horario de verano desde 2009: la zona del demo es UTC-3 todo el año. La API igual verifica
          // que el instante caiga en el día de la sesión.
          if (!(await guardarEnElBorrador({ occurredAt: new Date(`${s.borrador.date}T${hora}:00-03:00`).toISOString() }))) return;
        }
      }
      const series = await entrenamientoLocal.sincronizarYEsperar(draftId);
      if (series && sesionPerdida(series)) return;
      s = entrenamientoLocal.sesion(draftId);
      if (!s) return;
      if (s.series.length > 0 || s.quitadas.length > 0) return setAviso({ tipo: 'error', texto: 'Hay series guardadas en el teléfono que todavía no se enviaron. Revisá el estado del envío y reintentá.' });
      const falta = problemaParaConfirmar(s.borrador);
      if (falta) return setAviso({ tipo: 'error', texto: falta });
      if (modo === 'en-vivo' && corridaAbierta(s.corrida)) {
        const fin = entrenamientoLocal.accion(draftId, { tipo: 'finalizar' });
        if (!fin.ok) return setAviso({ tipo: 'error', texto: textoDelRechazo(fin.motivo) });
      }
      if (modo === 'en-vivo') {
        const tiempos = await entrenamientoLocal.sincronizarYEsperar(draftId);
        if (tiempos && sesionPerdida(tiempos)) return;
        if ((entrenamientoLocal.sesion(draftId)?.corrida.pendientes.length ?? 0) > 0) return setAviso({ tipo: 'error', texto: 'Los tiempos todavía no se enviaron. Revisá el estado del envío y reintentá.' });
      }
      const vigente = await api.consultarBorradorDeEjecucion(token, draftId);
      if (sesionPerdida(vigente)) return;
      if (!vigente.ok) return setAviso({ tipo: 'error', texto: falloDe(vigente).mensaje });
      const r = await api.confirmarEjecucion(token, draftId, vigente.datos.data.version, intentoDeConfirmar.actual());
      intentoDeConfirmar.registrar(r);
      if (sesionPerdida(r)) return;
      if (!r.ok) {
        if (accesoRetirado(r)) return;
        if (r.tipo === 'API' && r.codigo === 'EXECUTION_DRAFT_NOT_READY') {
          const codigos = r.issues.map((i) => i.code);
          return setAviso({
            tipo: 'error',
            texto: codigos.includes('SESSION_CONDITION_REQUIRED')
              ? 'Falta indicar cómo resultó la sesión.'
              : codigos.includes('OCCURRED_AT_REQUIRED')
                ? COPY_ENTRENAMIENTO.horaRequerida
                : codigos.includes('OCCURRED_AT_OUTSIDE_PLAN_VERSION')
                  ? 'A esa hora regía otra versión de tu plan. Revisá la hora de la sesión.'
                  : 'Falta registrar algo de la sesión antes de confirmar.',
          });
        }
        if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED') return setAviso({ tipo: 'info', texto: 'Esta sesión ya estaba registrada.' });
        return setAviso({ tipo: 'error', texto: esIncierto(r) ? COPY.resultadoIncierto : falloDe(r).mensaje });
      }
      // Registrada: lo del teléfono ya no hace falta.
      entrenamientoLocal.descartar(draftId);
      subir();
      // El registro reemplaza al borrador: volver lleva adonde se había abierto el borrador (Inicio o Entrenamiento).
      ir({ nombre: 'ejecucion-de-entrenamiento', id: r.datos.data.executionId, aviso: COPY_ENTRENAMIENTO.sesionRegistrada }, 'reemplazar');
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  /** Lo que dice TalkBack al empezar un descanso: «Descanso iniciado, recomendado 1 minuto 30». Nada en el medio. */
  function anuncioDelDescanso(setIndex: number): string {
    const rec = p ? recomendadoDe(p.prescriptionId, setIndex) : null;
    return TEXTOS_DEL_DESCANSO.descansoIniciado(rec === null ? null : duracionParaLeer(rec * 1000));
  }

  // DL-166 (AV-10, AV-12): al llegar al recomendado, el anuncio y la vibración, una sola vez; con la app abierta.
  const descansoAbierto = abierta?.kind === 'REST' ? abierta : null;
  const recomendadoDelDescanso = descansoAbierto ? recomendadoDe(descansoAbierto.prescriptionId, descansoAbierto.setIndex) : null;
  const msDelDescanso = descansoAbierto ? (vivo?.medicionAbierta?.ms ?? null) : null;
  const msAnterior = useRef<number | null>(null);
  useEffect(() => {
    if (llegoAlRecomendado(msAnterior.current, msDelDescanso, recomendadoDelDescanso) && recomendadoDelDescanso !== null) {
      AccessibilityInfo.announceForAccessibility(TEXTOS_DEL_DESCANSO.llegasteA(duracionParaLeer(recomendadoDelDescanso * 1000)));
      if (ajustes.vibrar) Vibration.vibrate([0, 400, 200, 400]);
    }
    msAnterior.current = msDelDescanso;
  });
  // El aviso con el teléfono bloqueado: se programa al empezar el descanso y se cancela cuando deja de correr (terminó
  // antes, se pausó, se destildó o se finalizó). Se recalcula solo cuando cambia el descanso, la pausa o los ajustes.
  const idDelDescanso = descansoAbierto?.measurementId ?? null;
  const enPausa = !!estado?.pausada;
  useEffect(() => {
    const plan = planDelAviso({ descansoCorriendo: idDelDescanso !== null, pausada: enPausa, recomendadoS: recomendadoDelDescanso, transcurridoMs: msDelDescanso ?? 0, ajustes, permiso });
    if (plan) void programarAvisoDelDescanso(plan.enSegundos);
    else void cancelarAvisoDelDescanso();
    // El transcurrido se lee al programar; no hace falta reprogramar cada segundo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDelDescanso, enPausa, recomendadoDelDescanso, ajustes, permiso]);
  const avisoDelPermiso = pedidoDelPermiso({ ajustes, permiso, descansoCorriendo: idDelDescanso !== null, cerradoEnEstaSesion: permisoCerrado });
  async function permitirAvisos() {
    setPermiso(await pedirPermisoDeAvisos());
    setPermisoCerrado(true);
  }

  // DL-166 (PV-11, AV-13 y AV-14): la fila fija de acciones, apilada sobre la navegación. Solo con la corrida en vivo.
  const indiceDelActivo = p ? prescripciones.findIndex((x) => x.prescriptionId === p.prescriptionId) : -1;
  const ejercicioSiguiente = indiceDelActivo >= 0 ? (prescripciones[indiceDelActivo + 1] ?? null) : null;
  const datosDeLaFila =
    conCorrida && p && !finalizando
      ? filaDeAcciones({
          pausada: estado.pausada,
          abierta,
          prescriptionId: p.prescriptionId,
          siguienteSinRegistrar: primeraSinRegistrar(filas)?.setIndex ?? null,
          haySiguienteEjercicio: ejercicioSiguiente !== null,
          porRegistrar: porRegistrar?.prescriptionId === p.prescriptionId && filas.some((f) => f.setIndex === porRegistrar.setIndex && f.estado === 'sin-registrar') ? porRegistrar : null,
        })
      : null;
  usePublicarFilaFija(datosDeLaFila, ocupado, {
    izquierda: () => (estado?.pausada ? hacer({ tipo: 'reanudar' }, 'Sesión reanudada') : pausar()),
    // «Empezar serie N» con un descanso corriendo es la acción compuesta de siempre. «Terminar serie N» tilda la serie,
    // como su casilla: la registra, cierra su reloj, empieza el descanso y pasa a la siguiente (AV2-30).
    medio: () => {
      if (!datosDeLaFila?.medio) return;
      const toque = queHaceElMedio(datosDeLaFila.medio, filas);
      const fila = filas.find((f) => f.setIndex === toque.setIndex);
      if (toque.tipo === 'tildar' && fila) tildar(fila);
      else relojDeLaFila(toque.setIndex);
    },
    siguiente: () => {
      if (ejercicioSiguiente) pasarA(ejercicioSiguiente.prescriptionId);
    },
  });

  // AV2-33: la explicación de los tiempos, una sola vez por cuenta. Se decide una vez al abrir la sesión y se marca al
  // mostrarla: queda a la vista hasta «Entendido» o hasta salir, y la próxima vez ya no aparece.
  const cuentaAbierta = almacen.cuenta();
  const vistaEnElTelefono = useSyncExternalStore(marcaDeLaExplicacion.suscribir, () => (cuentaAbierta ? marcaDeLaExplicacion.vista(cuentaAbierta) : null));
  useEffect(() => {
    if (cuentaAbierta) void marcaDeLaExplicacion.leer(cuentaAbierta);
  }, [cuentaAbierta]);
  const [explicacion, setExplicacion] = useState<'sin-decidir' | 'a-la-vista' | 'no'>('sin-decidir');
  const enVivoConCorrida = modo === 'en-vivo' && !!estado?.runId;
  const decision = seMuestraLaExplicacion({ enVivo: enVivoConCorrida, vistaEnLasSesiones: almacen.lista() ? almacen.explicacionVista() : null, vistaEnElTelefono });
  useEffect(() => {
    if (explicacion !== 'sin-decidir' || !enVivoConCorrida || decision === null || !cuentaAbierta) return;
    setExplicacion(decision ? 'a-la-vista' : 'no');
    if (decision) {
      void marcaDeLaExplicacion.marcar(cuentaAbierta);
      entrenamientoLocal.marcarExplicacionVista();
    }
  }, [explicacion, enVivoConCorrida, decision, cuentaAbierta]);

  // AV2-31: en el cierre, lo que falló se dice junto al botón y el lector de pantalla lo anuncia.
  useEffect(() => {
    if (finalizando && aviso?.tipo === 'error') AccessibilityInfo.announceForAccessibility(aviso.texto);
  }, [finalizando, aviso]);

  // ─── Lo que se ve ───
  // Escritura denegada: se retira el borrador de la pantalla y queda el estado neutral. Volver está en la cabecera.
  if (retirado) return <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible} />;
  if (!local?.sesion || !p) {
    if (carga === 'leyendo') return <Cargando forma="lista" />;
    return <ErrorConReintento sinConexion={false} onReintentar={() => void leer()} />;
  }
  const s = local.sesion;
  const indice = s.prescriptions.findIndex((x) => x.prescriptionId === p.prescriptionId);
  const siguiente = s.prescriptions[indice + 1] ?? null;
  const pausada = conCorrida && estado.pausada;
  const resumen = resumenDelRegistro(s, borrador, local.series, quitadas, escritasDeLaSesion);
  const conflictos = local.series.filter((l) => l.enConflicto).map((l) => ({ ...l, nombre: nombreDe(l.prescriptionId) }));
  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  const t = TEXTOS_DE_LA_SESION;

  const sesionSinPausas = estado?.cierre === null ? (vivo?.sesionSinPausas ?? null) : (calculo?.session.withoutPauses ?? null);
  // AV2-37: una sesión que quedó abierta otro día no cuenta «89:08:26»: dice desde cuándo está abierta, con su fecha.
  const inicioDeLaSesion = inicioDeLaCorrida(eventosDeLaCorrida(local.corrida));
  const abiertaDesde =
    conCorrida && inicioDeLaSesion ? tiempoDeLaSesionAbierta(Date.parse(almacen.reloj.ahora().civil) - Date.parse(inicioDeLaSesion), inicioDeLaSesion, borrador?.timeZone) : ({ tipo: 'conteo' } as const);
  const temporizador: Temporizador | null =
    abiertaDesde.tipo === 'desde'
      ? { texto: abiertaDesde.texto, calidad: null, etiqueta: abiertaDesde.texto }
      : modo === 'en-vivo' && estado?.runId && sesionSinPausas
      ? {
          texto: `${pausada ? `${e.sesionEnPausa} ·` : e.sesion} ${duracionParaMostrar(sesionSinPausas.ms) ?? '—'}`,
          calidad: sesionSinPausas.quality === 'MEASURED' ? null : ETIQUETA_DE_CALIDAD_DE_TIEMPO[sesionSinPausas.quality],
          etiqueta: `${pausada ? e.sesionEnPausa : e.sesion}, sin pausas: ${duracionParaLeer(sesionSinPausas.ms)}`,
        }
      : null;
  // El tiempo en el ejercicio actual, con la corrida abierta: sus tramos activos, sin las pausas (PA-02).
  const enElEjercicio = conCorrida ? tiempoDelEjercicioEnVivo(local.corrida, almacen.reloj.ahora(), p.prescriptionId) : null;
  const temporizadorDelEjercicio: Temporizador | null =
    enElEjercicio && enElEjercicio.ms !== null && abiertaDesde.tipo === 'conteo'
      ? { texto: `${t.esteEjercicio} ${duracionParaMostrar(enElEjercicio.ms) ?? '—'}`, calidad: null, etiqueta: `${t.esteEjercicio}: ${duracionParaLeer(enElEjercicio.ms)}` }
      : null;

  const dialogoDeMedicion = (titulo: string, m: NonNullable<typeof abierta>) => (
    <AvisoDeMedicionAbierta
      titulo={titulo}
      descripcion={descripcionDeLaMedicion(m, nombreDe)}
      ocupado={ocupado}
      onTerminoAhora={() => void hacer({ tipo: 'resolver-medicion', resolucion: 'termino-ahora' }, 'Medición finalizada')}
      onIncompleta={() => void hacer({ tipo: 'resolver-medicion', resolucion: 'incompleta' }, 'Medición incompleta')}
    />
  );

  const estadoDelEnvioSinBloqueo = (
    <EstadoDelEnvio
      estado={envio}
      guardado={guardado}
      problema={local.problema}
      conflictos={conflictos}
      onReintentar={() => void entrenamientoLocal.reintentar(draftId)}
      onReintentarGuardado={() => void entrenamientoLocal.reintentarGuardado()}
      onReintentarLectura={() => void entrenamientoLocal.reintentarLectura()}
      onActualizar={() => void entrenamientoLocal.actualizarBorrador(draftId)}
      onUsarLoDelServidor={() =>
        void preguntar('Usar los tiempos guardados', 'Se descartan los tiempos marcados en este teléfono que todavía no se guardaron. Lo ya guardado no cambia.', 'Descartar los del teléfono').then((si) => {
          if (si) void entrenamientoLocal.usarLosTiemposDelServidor(draftId);
        })
      }
      onDescartarSerie={(l) =>
        void preguntar('Descartar la serie del teléfono', `Se descarta la serie ${l.serie.setIndex} de ${nombreDe(l.prescriptionId)} guardada en este teléfono. La del servidor queda como está.`, 'Descartar').then((si) => {
          if (si) entrenamientoLocal.descartarSerie(draftId, l.prescriptionId, l.serie.setIndex);
        })
      }
    />
  );
  // El inicio de esta sesión se rechazó porque hay otra en curso: se ofrece resolver la otra desde acá.
  const bloqueadaPorOtra = local.problema?.tipo === 'conflicto' && local.problema.de === 'tiempos' && local.problema.motivo === 'ANOTHER_SESSION_IN_PROGRESS';
  const estadoDelEnvio = (
    <>
      {estadoDelEnvioSinBloqueo}
      {bloqueadaPorOtra ? <OtraSesionQueBloquea draftId={draftId} token={token} sesionPerdida={sesionPerdida} ir={ir} alTerminar={() => entrenamientoLocal.reintentar(draftId)} /> : null}
    </>
  );

  if (finalizando) {
    // AV2-31 a AV2-34: el cierre es corto. Arriba, el resultado y cómo resultó; junto al botón, por qué no se puede
    // finalizar todavía o qué falló; el detalle (las series y los tiempos), plegado.
    const C = TEXTOS_DEL_CIERRE;
    const deHoy = borrador ? borrador.date === hoyEn(borrador.timeZone) : true;
    const pendientes = pendientesDeRegistrar(s, borrador, local.series, quitadas, escritasDeLaSesion);
    const porEjercicio = s.prescriptions.flatMap((x) => {
      const series = pendientes.filter((q) => q.prescriptionId === x.prescriptionId).map((q) => q.setIndex);
      return series.length > 0 ? [{ prescriptionId: x.prescriptionId, nombre: x.exerciseName, series }] : [];
    });
    const sugerida = condicionQueCorresponde(resumen);
    const condicion = borrador?.sessionCondition ?? sugerida;
    const zona = borrador?.timeZone;
    const horaTomada = borrador ? horaTomadaAlEmpezar({ fechaDeLaSesion: borrador.date, zona: borrador.timeZone, inicio: inicioDeLaCorrida(eventosDeLaCorrida(local.corrida)) }) : null;
    const pideLaHora = !deHoy && !borrador?.occurredAt && condicion !== 'NOT_COMPLETED' && horaTomada === null;
    const motivoParaNo = motivoParaNoFinalizar({
      condicion,
      medicionAbierta: modo === 'en-vivo' && abierta !== null,
      escritasSinRegistrar: porEjercicio.length > 0,
      faltaLaHora: pideLaHora && !/^\d{2}:\d{2}$/.test(hora),
    });
    const tiempos = modo === 'en-vivo' ? tiemposResumidos(calculo, s.prescriptions.map((x) => ({ prescriptionId: x.prescriptionId, nombre: x.exerciseName }))) : [];
    // AV2-37: con la sesión abierta otro día, el cierre no cuenta «Sin pausas: 89:08:26»; dice desde cuándo está abierta.
    const renglones = renglonesDelResultado(resumen, abiertaDesde.tipo === 'desde' ? abiertaDesde : { tipo: 'conteo', sinPausasMs: modo === 'en-vivo' ? (sesionSinPausas?.ms ?? null) : null });
    const elegir = (c: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION') => void guardarEnElBorrador({ sessionCondition: c, reason: motivoQueViaja(c, motivo) });
    const campoDelMotivo = <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} ayuda={COPY_ENTRENAMIENTO.ayudaDelMotivo} value={motivo} onChangeText={setMotivo} />;
    return (
      <View>
        <Titulo>{C.titulo}</Titulo>
        <Parrafo tenue>{`${s.label} · ${fechaCivil(local.fecha)}`}</Parrafo>
        {modo === 'en-vivo' && abierta ? dialogoDeMedicion(deOtroProceso ? e.laSesionQuedoAbierta : e.medicionAbierta, abierta) : null}
        {/* Lo escrito sin registrar, antes que todo: se registra de una o se descarta, nunca se pierde en silencio (PA-01). */}
        {porEjercicio.length > 0 ? (
          <Seccion titulo={t.escritasTitulo} icono="borrador">
            {porEjercicio.map((x) => (
              <Parrafo key={x.prescriptionId}>{t.escritasDe(x.nombre, x.series)}</Parrafo>
            ))}
            <Parrafo tenue>{t.escritasPregunta}</Parrafo>
            <Boton texto={t.registrarlas} onPress={registrarPendientes} deshabilitado={ocupado} />
            <Boton texto={t.descartarLoEscrito} tipo="peligroSecundario" onPress={() => void descartarEscritas()} deshabilitado={ocupado} />
          </Seccion>
        ) : null}
        <Seccion titulo={C.comoResulto} icono="desvio">
          <Parrafo>{renglones.resultado}</Parrafo>
          {renglones.abierta ? <Parrafo tenue>{renglones.abierta}</Parrafo> : null}
          <Segmentos
            etiqueta={C.comoResulto}
            opciones={[
              { valor: 'COMPLETED', texto: C.realizada },
              { valor: 'COMPLETED_WITH_DEVIATION', texto: C.conDesvio },
            ]}
            valor={(condicion === 'COMPLETED' || condicion === 'COMPLETED_WITH_DEVIATION' ? condicion : 'ninguna') as 'COMPLETED' | 'COMPLETED_WITH_DEVIATION'}
            alElegir={elegir}
            deshabilitado={ocupado}
          />
          {!borrador?.sessionCondition && sugerida ? <Parrafo tenue>{C.porQueRealizada}</Parrafo> : null}
          {/* El motivo, con el desvío: lo escrito viaja con la condición. Con la no realizada, va abajo, en su sección. */}
          {condicion === 'COMPLETED_WITH_DEVIATION' ? campoDelMotivo : null}
          {pideLaHora ? <Campo etiqueta={`${COPY_ENTRENAMIENTO.horaDeLaSesion} (HH:MM)`} value={hora} onChangeText={setHora} keyboardType="numbers-and-punctuation" /> : null}
          {!pideLaHora && !borrador?.occurredAt && horaTomada ? <Parrafo tenue>{C.horaTomada(horaDe(horaTomada, zona))}</Parrafo> : null}
        </Seccion>
        {estadoDelEnvio}
        {/* Junto al botón: lo que falta o lo que falló. Arriba de todo, la persona no lo veía (AV2-31). */}
        {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
        {motivoParaNo ? <Parrafo>{motivoParaNo}</Parrafo> : <Parrafo tenue>{COPY_ENTRENAMIENTO.confirmarEsDefinitivo}</Parrafo>}
        <Boton texto={e.finalizarEntrenamiento} onPress={() => void finalizar()} ocupado={ocupado} deshabilitado={motivoParaNo !== null} />
        <Boton
          texto={C.volverALaSesion}
          tipo="secundario"
          onPress={() => {
            setAviso(null);
            setFinalizando(false);
          }}
          deshabilitado={ocupado}
        />
        <Desplegable titulo={C.detalle} icono="series">
          <SeriesDelResumen resumen={resumen} />
          <Parrafo tenue>{t.sinTildarNoCuentan}</Parrafo>
          {tiempos.length > 0 ? (
            <View>
              <Text style={estilos.tituloDelDetalle}>{e.tiemposDeLaSesion}</Text>
              {tiempos.map((r) => (
                <View key={r.prescriptionId} style={estilos.renglonDeTiempos}>
                  <Text style={estilos.nombreEnElDetalle}>{r.nombre}</Text>
                  {r.descansos ? <Text style={estilos.textoDelDetalle}>{r.descansos}</Text> : null}
                  {r.series ? <Text style={estilos.textoDelDetalle}>{r.series}</Text> : null}
                </View>
              ))}
              <Parrafo tenue>{COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}</Parrafo>
            </View>
          ) : null}
        </Desplegable>
        {/* Lejos de «Finalizar» y de los botones frecuentes, y con confirmación si hay algo cargado (B10-10:337). */}
        <Seccion titulo="¿No pudiste entrenar?" icono="salteada">
          {/* El motivo de la no realizada, opcional (REG-06-131; B10 §34): antes del botón y con ella elegida. */}
          {condicion !== 'COMPLETED_WITH_DEVIATION' ? campoDelMotivo : null}
          <Boton texto={COPY_ENTRENAMIENTO.noPudeRealizarla} tipo="secundario" seleccionado={borrador?.sessionCondition === 'NOT_COMPLETED'} onPress={() => void noPude()} deshabilitado={ocupado} />
        </Seccion>
      </View>
    );
  }

  const bases = basesDeLaPrescripcion(p);
  const banda = filaActiva ? bandaDeLaSerie(filaActiva.setIndex, filaActiva.objetivo) : null;
  // La serie que origina un descanso que se inicia ahora: la que se hizo, no la que viene (al tildar, el foco avanza).
  const serieDelDescanso = filaActiva ? serieQueOriginaElDescanso(filas, filaActiva.setIndex) : null;
  // Al terminar el descanso: la fila que quedará enfocada, si no es la misma del descanso.
  const trasElDescanso = abierta?.kind === 'REST' && filaActiva && abierta.prescriptionId === p.prescriptionId ? focoTrasElDescanso(filas, abierta.setIndex, filaActiva.setIndex) : null;
  const descanso: EstadoDelDescanso | null =
    !conCorrida || !filaActiva || serieDelDescanso === null
      ? null
      : abierta?.kind === 'REST'
        ? {
            tipo: 'en-curso',
            serie: abierta.setIndex,
            ejercicio: abierta.prescriptionId !== p.prescriptionId ? nombreDe(abierta.prescriptionId) : null,
            duracion: vivo?.medicionAbierta ?? null,
            recomendado: recomendadoDe(abierta.prescriptionId, abierta.setIndex),
            siguiente: trasElDescanso !== null && trasElDescanso !== abierta.setIndex ? trasElDescanso : null,
          }
        : pausada || abierta?.kind === 'SET' || ajustes.inicio === 'automatico'
          ? null
          : { tipo: 'disponible', serie: serieDelDescanso, recomendado: recomendadoDe(p.prescriptionId, serieDelDescanso) };
  // El reloj de las filas: solo en vivo, con la corrida abierta y sin pausa. Otro día el tiempo se escribe.
  const relojDeLaTabla: RelojDeLaTabla = {
    disponible: conCorrida && !pausada,
    enCurso:
      abierta?.kind === 'SET' && abierta.prescriptionId === p.prescriptionId
        ? { setIndex: abierta.setIndex, texto: duracionParaMostrar(vivo?.medicionAbierta?.ms ?? null) ?? '—', minutos: duracionParaLeer(vivo?.medicionAbierta?.ms ?? null) }
        : null,
  };
  // Una serie de más es legítima: se ofrece cuando las planificadas ya tienen registro y no hay otra vacía esperando.
  const sePuedeAgregar = filas.length > 0 && Math.max(...filas.map((f) => f.setIndex)) < MAXIMO_DE_SERIES && filas.every((f) => f.estado !== 'sin-registrar');
  const hayParaEscribir = filas.some((f) => f.estado === 'sin-registrar');
  // El estado del envío se dice cuando hay algo registrado o pendiente: antes de registrar nada, no hay qué decir.
  const hayRegistro = local.series.length > 0 || (borrador?.exercises.some((x) => (x.sets ?? []).length > 0) ?? false);
  const mostrarEnvio = hayRegistro || envio !== 'sincronizado';
  const elegidaEnTecnica = dialogo?.tipo === 'tecnica' ? (s.prescriptions.find((x) => x.prescriptionId === dialogo.prescriptionId) ?? null) : null;
  // La sustitución del ejercicio activo (DL-151): lo planificado y lo ejecutado según el borrador, y si se ofrece.
  const sustitucion = sustitucionDe(p, borrador, local.series);
  const aSustituir = dialogo?.tipo === 'sustituir' ? (s.prescriptions.find((x) => x.prescriptionId === dialogo.prescriptionId) ?? null) : null;

  return (
    <View>
      <FranjaDeLaSesion
        sesion={s.label}
        ejercicio={p.exerciseName}
        posicion={posicionEnLaSesion(indice + 1, s.prescriptions.length, filaActiva, p.sets.length)}
        tramos={tramosDelRecorrido(resumen, p.prescriptionId)}
        cuenta={cuentaDelRecorrido(resumen)}
        tiempoDeLaSesion={temporizador}
        tiempoDelEjercicio={temporizadorDelEjercicio}
        onVerRutina={() => setDialogo({ tipo: 'rutina' })}
      />
      {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      {local.objetivosGenerales ? (
        <Aviso tipo="info" titulo={AVISO_SIN_PLAN_POR_SERIE}>
          <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.reintentar} tipo="secundario" onPress={() => void leer()} deshabilitado={carga === 'leyendo'} />
        </Aviso>
      ) : null}
      {borrador?.granularity === 'EXERCISE_OR_SESSION' ? (
        <Aviso tipo="info" titulo={`Esta sesión se empezó a registrar ${ETIQUETA_DE_GRANULARIDAD.EXERCISE_OR_SESSION.toLowerCase()}.`}>
          <Boton texto="Registrar por serie" tipo="secundario" onPress={() => void cambiarAPorSerie()} deshabilitado={ocupado} />
        </Aviso>
      ) : null}
      {deOtroProceso ? dialogoDeMedicion(e.laSesionQuedoAbierta, deOtroProceso) : null}
      {modo === 'en-vivo' && estado?.runId === null ? (
        <Aviso tipo="info" titulo="El cronómetro de la sesión todavía no empezó.">
          <Boton texto={e.iniciarEntrenamiento} onPress={() => void iniciarEntrenamiento()} ocupado={ocupado} />
        </Aviso>
      ) : null}
      {explicacion === 'a-la-vista' ? <ExplicacionDeLosTiempos onEntendido={() => setExplicacion('no')} /> : null}
      {pausada ? <Aviso tipo="info" titulo={e.sesionEnPausa} /> : null}
      <EjercicioActivo
        token={token}
        sesionPerdida={sesionPerdida}
        prescripcion={p}
        posicion={indice + 1}
        total={s.prescriptions.length}
        bases={bases}
        ejecutado={sustitucion.ejecutado?.nombre ?? null}
        conNombre={false}
        onVerTecnica={() => setDialogo({ tipo: 'tecnica', prescriptionId: p.prescriptionId })}
        onSustituir={
          sePuedeSustituir(borrador)
            ? () => {
                setFalloDeSustitucion(null);
                setDialogo({ tipo: 'sustituir', prescriptionId: p.prescriptionId });
              }
            : undefined
        }
      />
      {/* DL-166 (PV-7): el descanso va debajo del ejercicio y arriba de sus series, con el engranaje de sus ajustes. */}
      <BloqueDeDescanso
        estado={descanso}
        onIniciar={() => {
          // Con «Lo inicio yo»: el descanso queda ligado a la serie que lo origina, la última hecha.
          if (serieDelDescanso !== null) hacer({ tipo: 'iniciar-descanso', prescriptionId: p.prescriptionId, setIndex: serieDelDescanso }, anuncioDelDescanso(serieDelDescanso));
        }}
        onFinalizar={finalizarDescanso}
        onAjustes={() => setHojaDelDescanso(true)}
        avisoDelPermiso={avisoDelPermiso}
        onPermitir={() => void permitirAvisos()}
        onAhoraNo={() => setPermisoCerrado(true)}
        deshabilitado={ocupado}
      />
      {/* La ayuda por defecto, plegada junto al encabezado de la tabla, con el ícono de ayuda (PA-02). */}
      <AyudaDeLaTabla />
      <TablaDeSeries
        filas={filas}
        activa={filaActiva?.setIndex ?? 0}
        unidad={unidad}
        escritas={escritasDelActivo}
        errores={errores}
        // El ancho de la fila: la pantalla menos los 20 dp de relleno de cada lado y los 6 del borde y el relleno de la fila.
        disposicion={disposicionDeLaTabla(width - 52, fontScale)}
        reloj={relojDeLaTabla}
        escribiendoTiempo={escribiendoTiempo}
        ocupado={ocupado}
        acciones={{ onEnfocar: enfocar, onEscribir: escribir, onTildar: tildar, onReloj: relojDeLaFila, onEscribirTiempo: escribirTiempo }}
      />
      <ErroresDeLaFila errores={errores} />
      <View style={estilos.accionesDeLaTabla}>
        {hayParaEscribir ? <Boton texto={t.cambiarUnidad(unidad === 'kg' ? 'lb' : 'kg')} tipo="enlace" onPress={() => entrenamientoLocal.fijarUnidad(draftId, p.prescriptionId, unidad === 'kg' ? 'lb' : 'kg')} /> : null}
        {sePuedeAgregar ? (
          <Boton
            texto={t.agregarUnaSerie}
            tipo="enlace"
            onPress={() => {
              const nueva = Math.max(...filas.map((f) => f.setIndex)) + 1;
              entrenamientoLocal.fijarFilasDeMas(draftId, p.prescriptionId, (local.filasDeMas[p.prescriptionId] ?? 0) + 1);
              enfocar(nueva);
            }}
          />
        ) : null}
      </View>
      {banda ? <BandaDelPlan banda={banda} /> : null}
      {mostrarEnvio ? estadoDelEnvio : null}
      {/* Siguiente ejercicio y Pausar están en la fila fija (PV-11); sin corrida en vivo, Siguiente ejercicio queda acá. */}
      {siguiente && !conCorrida ? <Boton texto={e.siguienteEjercicio} tipo="secundario" onPress={() => pasarA(siguiente.prescriptionId)} /> : null}
      {/* «Finalizar entrenamiento» queda al final de la pantalla y en «Ver rutina», como antes: no compite en la fila. */}
      <Boton
        texto={e.finalizarEntrenamiento}
        tipo="secundario"
        onPress={() => {
          // Un aviso de la sesión (un rechazo de una acción de tiempo) no es del cierre: no se arrastra ni se anuncia ahí.
          setAviso(null);
          setFinalizando(true);
        }}
      />
      <HojaDelDescanso
        visible={hojaDelDescanso}
        ajustes={ajustes}
        permiso={permiso}
        onCambiar={(cambios) => void ajustesDelDescanso.cambiar(cambios)}
        onPermitir={() => void permitirAvisos()}
        onCerrar={() => setHojaDelDescanso(false)}
      />
      <RutinaDeLaSesion
        visible={dialogo?.tipo === 'rutina'}
        sesion={s}
        activo={p.prescriptionId}
        resumen={resumen}
        puedeCambiar={!pausada}
        motivoParaNoCambiar={pausada ? 'Reanudá la sesión para cambiar de ejercicio.' : null}
        onVerTecnica={(id) => setDialogo({ tipo: 'tecnica', prescriptionId: id })}
        onPasarA={pasarA}
        onCerrar={() => setDialogo(null)}
      />
      <TecnicaDelEjercicio visible={elegidaEnTecnica !== null} prescripcion={elegidaEnTecnica} token={token} sesionPerdida={sesionPerdida} onCerrar={() => setDialogo(null)} />
      <SustituirEjercicio
        visible={aSustituir !== null}
        sustitucion={aSustituir ? sustitucionDe(aSustituir, borrador, local.series) : null}
        buscar={(texto) => api.buscarEjercicios(token, texto)}
        sesionPerdida={sesionPerdida}
        ocupado={ocupado}
        fallo={falloDeSustitucion}
        onElegir={(elegido) => {
          if (aSustituir) void sustituir(aSustituir, elegido);
        }}
        onCerrar={() => setDialogo(null)}
      />
    </View>
  );
}

// ─── La ejecución registrada, con su corrección ─────────────────────────────────────────────

/** «60 kg × 8 reps · RIR 2 · esfuerzo 7». Una carga que no se registró se dice así: no es «sin carga» (06:5675). */
function textoDeSerie(s: { load: { value: number; unit: string } | null; completedRepetitions: number | null; rir: number | null; perceivedExertion: number | null }): string {
  const reps = s.completedRepetitions === null ? '—' : numero(s.completedRepetitions);
  return `${s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada'} × ${reps} ${COPY_ENTRENAMIENTO.reps.toLowerCase()}${s.rir !== null ? ` · RIR ${numero(s.rir)}` : ''}${s.perceivedExertion !== null ? ` · esfuerzo ${numero(s.perceivedExertion)}` : ''}`;
}

/**
 * El nivel de detalle de un registro, con el mismo rótulo que lee el profesional (DL-161, `textoDelNivelDeDetalle`):
 * «Cargada como el plan», «Parte como el plan», «Con detalle» o «Resumida, sin series». `null` para una sesión no
 * realizada, que ya lo dice su condición, o si no se puede decir.
 */
export function textoDelNivelDelRegistro(registro: Pick<RegistroDeEjecucion, 'sessionCondition' | 'granularity' | 'exercises'>): string | null {
  const nivel = nivelDeDetalleDelRegistro(registro);
  return nivel === null || nivel === 'NO_REALIZADA' ? null : textoDelNivelDeDetalle(nivel);
}

function Registro({ registro }: { registro: RegistroDeEjecucion }) {
  const nivel = textoDelNivelDelRegistro(registro);
  return (
    <View>
      <Dato etiqueta={COPY_ENTRENAMIENTO.condicionDeLaSesion} valor={etiquetaDeCondicionRegistrada(registro)} />
      {nivel ? <Dato etiqueta={COPY_REGISTRO_POR_NIVELES.comoSeCargo} valor={nivel} /> : null}
      {registro.reason ? <Dato etiqueta="Motivo" valor={registro.reason} apilado /> : null}
      {registro.exercises.map((e) => (
        <View key={e.prescriptionId}>
          <Dato
            etiqueta={e.substituted ? `${COPY_ENTRENAMIENTO.planificado}: ${e.prescribedExerciseName}` : e.performedExerciseName}
            valor={e.substituted ? `${COPY_ENTRENAMIENTO.ejecutado}: ${e.performedExerciseName}` : ''}
          />
          {/* La serie tildada sin escribir dice «como el plan», como en el website: sus valores son los del plan. */}
          {(e.sets ?? []).map((s) => (
            <Parrafo key={s.setIndex}>
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {textoDeSerie(s)}
              {seCargoComoElPlan(s) ? ` · ${COPY_REGISTRO_POR_NIVELES.comoElPlan}` : ''}
            </Parrafo>
          ))}
          {e.executionSummary ? <Parrafo>{e.executionSummary.description}</Parrafo> : null}
        </View>
      ))}
      {registro.sessionSummary ? <Parrafo>{registro.sessionSummary.description}</Parrafo> : null}
    </View>
  );
}

export function PantallaDeEjecucionDeEntrenamiento({ token, id, avisoInicial, salir, ir }: { token: string; id: string; avisoInicial?: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [r, setR] = useState<Resultado<{ data: EjecucionDeEntrenamiento }> | null>(null);
  // El aviso llega con la ruta: «Corrección registrada», al volver de la corrección (PA-04).
  const aviso = avisoInicial ?? null;

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarEjecucionDeEntrenamiento(token, id);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Esta pantalla solo lee: la corrección, que escribe, retira el contenido en la suya si el acceso ya no está.
  if (!r) return <Cargando />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  const x = r.datos.data;
  const vigente = x.effectiveView.kind === 'CORRECTED' ? x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) : null;
  const nombreDe = (prescriptionId: string) => x.plannedSession.prescriptions.find((p) => p.prescriptionId === prescriptionId)?.exerciseName ?? 'Ejercicio';

  return (
    <View>
      <Titulo>{x.plannedSession.label}</Titulo>
      <Parrafo tenue>{fechaCivil(x.date)}</Parrafo>
      {aviso ? <Aviso tipo="exito" titulo={aviso} /> : null}
      {vigente ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.correccionVigente} icono="corregido">
          <Parrafo tenue>
            {vigente.authorRole === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : COPY_ENTRENAMIENTO.corregidoPorVos} · {fecha(vigente.recordedAt)} · {vigente.reason}
          </Parrafo>
          <Registro registro={vigente.correction} />
        </Seccion>
      ) : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.registroOriginal} icono="texto">
        <Parrafo tenue>Registrado el {fecha(x.recordedAt)}</Parrafo>
        <Registro registro={x.original} />
      </Seccion>
      {/* Los tiempos marcados, cada uno con su calidad (API-TIE-03). Una sesión registrada sin tiempos sigue sin tiempos. */}
      <TiemposDeLaEjecucion token={token} executionId={x.executionId} nombreDe={nombreDe} sesionPerdida={sesionPerdida} />
      {x.corrections.length > 1 ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.historialDeCorrecciones} icono="linea-de-tiempo">
          {x.corrections.map((c) => (
            <Parrafo key={c.correctionId}>
              {fecha(c.recordedAt)} · {c.author.displayName} · {c.reason}
            </Parrafo>
          ))}
        </Seccion>
      ) : null}
      {/* PA-04: la corrección tiene su pantalla, con las tarjetas y las filas del registro. Al registrarla se vuelve acá. */}
      <Boton texto={COPY_ENTRENAMIENTO.corregirRegistro} tipo="secundario" icono="corregido" onPress={() => ir({ nombre: 'corregir-ejecucion', id: x.executionId })} />
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // La fecha con el calendario al lado (PA-06): el margen va en la fila.
  filaDeLaFecha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 4 },
  fechaDeHoy: { flexShrink: 1, fontSize: 19, fontWeight: '800', color: COLOR.texto },
  cabezaDeSesion: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoDeSesion: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficieElevada, alignItems: 'center', justifyContent: 'center' },
  textosDeSesion: { flex: 1 },
  ejercicioDeLaSesion: { fontSize: 15, lineHeight: 22, color: COLOR.texto },
  tituloDeLaSerie: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginTop: 8 },
  accionesDeLaTabla: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  ayudaDelBoton: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, textAlign: 'center', marginBottom: 4 },
  // El detalle plegado del cierre (AV2-34): un renglón por ejercicio, con sus descansos y sus series medidas.
  tituloDelDetalle: { fontSize: 16, fontWeight: '800', color: COLOR.texto, marginTop: 12, marginBottom: 4 },
  renglonDeTiempos: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLOR.borde, gap: 2 },
  nombreEnElDetalle: { fontSize: 15, fontWeight: '700', color: COLOR.texto },
  textoDelDetalle: { fontSize: 14, lineHeight: 20, color: COLOR.texto },
}));
