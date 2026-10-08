/**
 * APK · Entrenamiento del asesorado (docs/paquetes/WP-06.md §5; B10-06 §25-§38, §52-§58; WP-ENTRENAMIENTO-SERIES §7).
 * - **Tres pestañas** (WP-ENTRENAMIENTO-SERIES §7.1): **Hoy**, las sesiones del plan vigente que se pueden hacer hoy, cada
 *   una con «N ejercicios · M series», su estado e «Iniciar entrenamiento» o «Continuar entrenamiento»; **Plan**, las
 *   sesiones en su orden con los objetivos de cada serie (`plan-por-serie.tsx`); e **Historial**, el de siempre
 *   (`historial.tsx`), con los tiempos en el detalle de cada sesión. «Registrar otro día» sigue como acción secundaria y
 *   abre la sesión sin cronómetros: el pasado no se cronometra.
 * - El estado de cada sesión sale **solo** de `vistaDeOcurrencia`: sin registro es «No iniciada» o «Sin registro», nunca
 *   «No realizada» (H-09-TRN-01; B10-06:626-640). Si hay varias, la persona elige cuál hace: BE no decide (DL-077).
 * - **La sesión enfocada** (`PantallaDeSesion`, con las piezas de `sesion-enfocada.tsx`): un ejercicio a la vez, su
 *   imagen y su técnica, la tabla compacta con lo planificado en gris, la banda del plan, el descanso y la serie
 *   cronometrada. Sin barra inferior. Lo que se registra se guarda primero en el teléfono, por cuenta
 *   (`entrenamiento-en-curso.ts`), y viaja después: API-TRN-17 para las series y API-TIE-01 para los tiempos.
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
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  duracionParaMostrar,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  ETIQUETA_DE_GRANULARIDAD,
  etiquetaDeCondicionRegistrada,
  leerNumero,
  lineasDePrescripcion,
  numero,
  registroVigente,
  textoDeDuracion,
  vistaDeOcurrencia,
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
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Alert, Text, useWindowDimensions, View } from 'react-native';
import { estadoDeSincronizacion, type SesionLocal } from '../almacen-de-entrenamiento';
import { api } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { corridaAbierta, enVivoDeLaCorrida, estadoLocal, eventosDeLaCorrida, type AccionDeTiempo, type MotivoDeRechazoLocal } from '../corrida-de-entrenamiento';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { entrenamientoLocal, useEntrenamientoLocal } from '../entrenamiento-en-curso';
import { Cargando, ErrorConReintento, SinActualizar } from '../estados';
import { fecha, fechaCivil, fechaLarga, hora as horaDe } from '../formato';
import { IconoDeEjercicio } from '../iconos-de-entrenamiento';
import { esIncierto, falloDe, useClaveDeIntento } from '../intento';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { useAccesoRetirado, useSesionPerdida, type Ir, type Ruta, type Salida } from '../navegacion';
import { enCursoDeLaApi, enCursoEnElTelefono, otraSesionEnCurso, sesionEnCursoParaMostrar, type EnCurso } from '../sesion-en-curso';
import {
  bandaDeLaSerie,
  basesDeLaPrescripcion,
  disposicionDeLaTabla,
  ejerciciosYSeries,
  FILA_VACIA,
  filasDelEjercicio,
  focoTrasElDescanso,
  guardadasDe,
  hayAlgoEscrito,
  leerFila,
  MAXIMO_DE_SERIES,
  primeraSinRegistrar,
  problemaParaConfirmar,
  puedeRegistrar,
  resumenDelRegistro,
  sesionDesdeLaOcurrencia,
  AVISO_SIN_PLAN_POR_SERIE,
  unidadDelEjercicio,
  type ErroresDeFila,
  type FilaEscrita,
  type SerieLocal,
  type Unidad,
} from '../series-de-la-sesion';
import { Aviso, Boton, Campo, COLOR, Dato, Desplegable, estilosPorTema, Insignia, Parrafo, Pestanas, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';
import { ContenidoDelHistorial } from './historial';
import { PlanPorSerie } from './plan-por-serie';
import {
  AvisoDeMedicionAbierta,
  AyudaDelRir,
  BandaDelPlan,
  BarraDeLaSesion,
  BloqueDeDescanso,
  CronometrarSerie,
  duracionParaLeer,
  EjercicioActivo,
  ErroresDeLaFila,
  EstadoDelEnvio,
  ExplicacionDeLosTiempos,
  RutinaDeLaSesion,
  SeriesDelResumen,
  TablaDeSeries,
  TecnicaDelEjercicio,
  textoDeLaCondicion,
  TiemposMarcados,
  type CronometroDeSerie,
  type EstadoDelDescanso,
  type Temporizador,
} from './sesion-enfocada';
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
 * diálogo del sistema es accesible y dice qué pasa.
 */
function preguntar(titulo: string, detalle: string, accion: string): Promise<boolean> {
  return new Promise((resolver) =>
    Alert.alert(
      titulo,
      detalle,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: accion, style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
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
        {hoy.planState === 'NO_ACTIVE_PLAN' ? <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.sinPlanAsesorado} /> : null}
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

  const remota = enCurso.r?.ok ? enCurso.r.datos.data.inProgress : null;
  // Primero la que informa la API, que es la que impide iniciar otra; después la del teléfono (`sesion-en-curso.ts`).
  const ahora: EnCurso | null = sesionEnCursoParaMostrar(remota, local.sesiones());
  // Una sesión en curso de otro día (pasó la medianoche): se retoma desde acá, aunque no esté en la lista de hoy.
  const deOtroDia = ahora && !hoy.occurrences.some((o) => o.occurrenceId === ahora.occurrenceId) ? ahora : null;

  return (
    <View>
      <Text style={estilos.fechaDeHoy} accessibilityRole="header">
        {fechaLarga(hoy.date)}
      </Text>
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
      {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
      {hoy.occurrences.map((o) => (
        <TarjetaDeOcurrencia key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} enCurso={ahora?.occurrenceId === o.occurrenceId} />
      ))}
      {hoy.planState === 'AVAILABLE' ? (
        // Plegado: es para lo que quedó sin registrar; lo de hoy va primero.
        <Desplegable titulo={COPY_ENTRENAMIENTO.registrarOtroDia} abiertoAlInicio={delDia !== null || aviso !== null}>
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
      <Boton texto="Actualizar" tipo="enlace" onPress={recargar} />
    </View>
  );
}

/**
 * «Tenés un entrenamiento sin finalizar»: continuarlo, o dejarlo incompleto sin afirmar cuándo terminó. Lo usan
 * Entrenamiento, Inicio y la sesión enfocada; `motivo` dice por qué aparece (por ejemplo, antes de iniciar otra sesión).
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
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: (r: Ruta) => void;
  enCurso: boolean;
}) {
  const { abriendo, fallo, abrir, otraEnCurso } = useAbrirOcurrencia({ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir });
  const vista = vistaDeOcurrencia(o, hoy);
  const deHoy = o.date === hoy;
  const continuar = enCurso || o.execution.state === 'DRAFT_IN_PROGRESS';
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
      <Insignia texto={vista.texto} positiva={vista.registrada} etiqueta="Estado" />
      {/* La acción va arriba, antes de lo planificado: con una sesión larga, al final de la tarjeta quedaba fuera de la vista. */}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {/* Otra sesión en curso: continuarla o dejarla incompleta; dejada incompleta, se vuelve a intentar iniciar esta. */}
      {otraEnCurso ? <AvisoDeEntrenamientoEnCurso enCurso={otraEnCurso} token={token} sesionPerdida={sesionPerdida} ir={ir} alTerminar={() => void abrir()} motivo={MOTIVO_ANTES_DE_INICIAR} /> : null}
      {o.execution.state === 'REGISTERED' && o.execution.executionId ? (
        <Boton texto="Ver registro" tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: o.execution.executionId! })} />
      ) : (
        <Boton texto={accion} onPress={() => void abrir()} ocupado={abriendo} />
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

type Dialogo = null | { readonly tipo: 'rutina' } | { readonly tipo: 'tecnica'; readonly prescriptionId: string };

/** Lo que se declara para no perderlo al salir: la serie a medio escribir de un ejercicio. */
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
  const [escritas, setEscritas] = useState<Readonly<Record<string, FilaEscrita>>>({});
  const [errores, setErrores] = useState<ErroresDeFila>({});
  const [unidades, setUnidades] = useState<Readonly<Record<string, Unidad>>>({});
  const [extras, setExtras] = useState<Readonly<Record<string, number>>>({});
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [hora, setHora] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'info' | 'exito'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [, setPulso] = useState(0);
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
  const unidad: Unidad = p ? (unidades[p.prescriptionId] ?? unidadDelEjercicio(p)) : 'kg';
  const proteccion = (l: SerieLocal) => almacen.proteccionDeSerie(draftId, l);
  const filas = p ? filasDelEjercicio(p, guardadasDe(local?.borrador ?? null, p.prescriptionId), local?.series ?? [], extras[p.prescriptionId] ?? 0, proteccion) : [];
  const focoGuardado = local?.foco && p && local.foco.prescriptionId === p.prescriptionId ? local.foco.setIndex : null;
  const filaActiva = filas.find((f) => f.setIndex === focoGuardado) ?? primeraSinRegistrar(filas) ?? filas[filas.length - 1] ?? null;
  const claveDeFila = p && filaActiva ? `${p.prescriptionId}:${filaActiva.setIndex}` : '';
  const escrita = escritas[claveDeFila] ?? FILA_VACIA;
  const vivo = local ? enVivoDeLaCorrida(local.corrida, almacen.reloj) : null;
  const calculo = local ? calcularTiempos(eventosDeLaCorrida(local.corrida), recomendadoDe) : null;
  const abierta = estado?.medicionAbierta ?? null;
  const deOtroProceso = local && modo === 'en-vivo' ? almacen.medicionDeOtroProceso(draftId) : null;
  const envio = local ? estadoDeSincronizacion(local, almacen.enviando(draftId)) : 'sincronizado';

  // Sin pérdidas silenciosas: una serie escrita y sin registrar, o el motivo y la hora del resumen, preguntan al salir.
  const conEscritura = prescripciones.find((x) => Object.entries(escritas).some(([clave, f]) => clave.startsWith(`${x.prescriptionId}:`) && hayAlgoEscrito(f)));
  useCambiosSinGuardar(loEscritoEn(conEscritura));
  const borrador = local?.borrador ?? null;
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

  function registrar() {
    if (!p || !filaActiva || enCurso.current) return;
    enCurso.current = true;
    try {
      const lectura = leerFila(escrita, filaActiva.setIndex, unidad);
      if (!lectura.ok) return setErrores(lectura.errores);
      setErrores({});
      // Se registra con el ejercicio que figura en el borrador (una sustitución hecha antes se respeta).
      const realizado = borrador?.exercises.find((e) => e.prescriptionId === p.prescriptionId)?.performedExerciseVersionId ?? p.exerciseVersionId;
      const resultado = entrenamientoLocal.registrarSerie(draftId, { prescriptionId: p.prescriptionId, performedExerciseVersionId: realizado, serie: lectura.serie });
      if (resultado !== 'registrada') return;
      setEscritas((actuales) => {
        const { [claveDeFila]: _registrada, ...resto } = actuales;
        return resto;
      });
      if (!filaActiva.planificada) setExtras((x) => ({ ...x, [p.prescriptionId]: 0 }));
      AccessibilityInfo.announceForAccessibility(COPY_ENTRENAMIENTO_POR_SERIE.serieGuardada(filaActiva.setIndex));
      void sincronizar();
    } finally {
      enCurso.current = false;
    }
  }

  function enfocar(setIndex: number) {
    if (!p) return;
    setErrores({});
    entrenamientoLocal.enfocar(draftId, { prescriptionId: p.prescriptionId, setIndex });
  }

  function escribir(campo: keyof FilaEscrita, texto: string) {
    if (!claveDeFila) return;
    setEscritas((actuales) => ({ ...actuales, [claveDeFila]: { ...(actuales[claveDeFila] ?? FILA_VACIA), [campo]: texto } }));
    if (errores[campo] || errores.fila) setErrores((x) => ({ ...x, [campo]: undefined, fila: undefined }));
  }

  function pasarA(prescriptionId: string) {
    const destino = prescripciones.find((x) => x.prescriptionId === prescriptionId);
    if (!destino) return;
    // Pasar a otro ejercicio es explícito: con la corrida, marca el ejercicio activo. Ver su técnica no.
    if (conCorrida && estado?.ejercicioActivo !== prescriptionId && !hacer({ tipo: 'activar-ejercicio', prescriptionId })) return;
    const filasDestino = filasDelEjercicio(destino, guardadasDe(borrador, prescriptionId), local?.series ?? [], extras[prescriptionId] ?? 0, proteccion);
    entrenamientoLocal.enfocar(draftId, { prescriptionId, setIndex: (primeraSinRegistrar(filasDestino) ?? filasDestino[0])?.setIndex ?? 1 });
    setErrores({});
    setDialogo(null);
  }

  function finalizarDescanso() {
    if (abierta?.kind !== 'REST') return;
    if (!hacer({ tipo: 'finalizar-descanso' }, 'Descanso finalizado')) return;
    if (p && filaActiva && abierta.prescriptionId === p.prescriptionId) enfocar(focoTrasElDescanso(filas, abierta.setIndex, filaActiva.setIndex));
  }

  /** La serie que se cronometra: la enfocada; con un descanso en curso, la que sigue a la del descanso. */
  const serieParaCronometrar = !p || !filaActiva ? null : abierta?.kind === 'REST' && abierta.prescriptionId === p.prescriptionId ? (primeraSinRegistrar(filas, abierta.setIndex)?.setIndex ?? null) : filaActiva.setIndex;

  function cronometrar() {
    if (!p || serieParaCronometrar === null) return;
    if (!hacer({ tipo: 'cronometrar-serie', prescriptionId: p.prescriptionId, setIndex: serieParaCronometrar }, COPY_ENTRENAMIENTO_POR_SERIE.serieEnCurso(serieParaCronometrar))) return;
    enfocar(serieParaCronometrar);
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
    await guardarEnElBorrador({ sessionCondition: 'NOT_COMPLETED', granularity: null, exercises: [], sessionSummary: null, reason: motivo.trim() || null });
  }

  /**
   * Finalizar: lo abierto ya se resolvió; se mandan las series, se cierra la corrida (SESSION_FINISHED) y se mandan los
   * tiempos; después se confirma el borrador (API-TRN-18) con su clave de idempotencia. Nada se confirma a medias.
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
      if (!s.borrador.sessionCondition) return setAviso({ tipo: 'error', texto: 'Falta indicar cómo resultó la sesión.' });
      if (motivo.trim() !== (s.borrador.reason ?? '').trim() && !(await guardarEnElBorrador({ reason: motivo.trim() || null }))) return;
      s = entrenamientoLocal.sesion(draftId);
      if (s?.borrador && s.borrador.date !== hoyEn(s.borrador.timeZone) && !s.borrador.occurredAt) {
        if (!/^\d{2}:\d{2}$/.test(hora)) return setAviso({ tipo: 'error', texto: COPY_ENTRENAMIENTO.horaRequerida });
        // Argentina no tiene horario de verano desde 2009: la zona del demo es UTC-3 todo el año. La API igual verifica
        // que el instante caiga en el día de la sesión.
        if (!(await guardarEnElBorrador({ occurredAt: new Date(`${s.borrador.date}T${hora}:00-03:00`).toISOString() }))) return;
      }
      const series = await entrenamientoLocal.sincronizarYEsperar(draftId);
      if (series && sesionPerdida(series)) return;
      s = entrenamientoLocal.sesion(draftId);
      if (!s) return;
      if (s.series.length > 0) return setAviso({ tipo: 'error', texto: 'Hay series guardadas en el teléfono que todavía no se enviaron. Revisá el estado del envío y reintentá.' });
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
  const resumen = resumenDelRegistro(s, borrador, local.series);
  const conflictos = local.series.filter((l) => l.enConflicto).map((l) => ({ ...l, nombre: nombreDe(l.prescriptionId) }));
  const e = COPY_ENTRENAMIENTO_POR_SERIE;

  const sesionSinPausas = estado?.cierre === null ? (vivo?.sesionSinPausas ?? null) : (calculo?.session.withoutPauses ?? null);
  const temporizador: Temporizador | null =
    modo === 'en-vivo' && estado?.runId && sesionSinPausas
      ? {
          texto: `${pausada ? `${e.sesionEnPausa} ·` : e.sesion} ${duracionParaMostrar(sesionSinPausas.ms) ?? '—'}`,
          calidad: sesionSinPausas.quality === 'MEASURED' ? null : ETIQUETA_DE_CALIDAD_DE_TIEMPO[sesionSinPausas.quality],
          etiqueta: `${pausada ? e.sesionEnPausa : e.sesion}, sin pausas: ${duracionParaLeer(sesionSinPausas.ms)}`,
        }
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
      guardado={almacen.estadoDelGuardado()}
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
    const deHoy = borrador ? borrador.date === hoyEn(borrador.timeZone) : true;
    return (
      <View>
        <Titulo>{e.resumenAntesDeFinalizar}</Titulo>
        <Parrafo tenue>{`${s.label} · ${fechaCivil(local.fecha)}`}</Parrafo>
        {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
        {modo === 'en-vivo' && abierta ? dialogoDeMedicion(deOtroProceso ? e.laSesionQuedoAbierta : e.medicionAbierta, abierta) : null}
        <Seccion titulo={COPY_ENTRENAMIENTO.series}>
          <SeriesDelResumen resumen={resumen} />
        </Seccion>
        {modo === 'en-vivo' ? (
          <Seccion titulo={e.tiemposDeLaSesion}>
            <TiemposMarcados tiempos={{ sesion: sesionSinPausas, calculo, nombreDe }} />
          </Seccion>
        ) : null}
        <Seccion titulo={COPY_ENTRENAMIENTO.condicionDeLaSesion}>
          {/* El motivo va antes que los botones: lo escrito viaja con la condición. */}
          <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} ayuda={COPY_ENTRENAMIENTO.ayudaDelMotivo} value={motivo} onChangeText={setMotivo} />
          <Parrafo>{textoDeLaCondicion(borrador?.sessionCondition ?? null)}</Parrafo>
          <Boton
            texto="Realizada"
            tipo={borrador?.sessionCondition === 'COMPLETED' ? 'primario' : 'secundario'}
            seleccionado={borrador?.sessionCondition === 'COMPLETED'}
            onPress={() => void guardarEnElBorrador({ sessionCondition: 'COMPLETED', reason: motivo.trim() || null })}
            deshabilitado={ocupado}
          />
          <Boton
            texto="Realizada con desvío"
            tipo={borrador?.sessionCondition === 'COMPLETED_WITH_DEVIATION' ? 'primario' : 'secundario'}
            seleccionado={borrador?.sessionCondition === 'COMPLETED_WITH_DEVIATION'}
            onPress={() => void guardarEnElBorrador({ sessionCondition: 'COMPLETED_WITH_DEVIATION', reason: motivo.trim() || null })}
            deshabilitado={ocupado}
          />
        </Seccion>
        {!deHoy && !borrador?.occurredAt ? <Campo etiqueta={`${COPY_ENTRENAMIENTO.horaDeLaSesion} (HH:MM)`} value={hora} onChangeText={setHora} keyboardType="numbers-and-punctuation" /> : null}
        {estadoDelEnvio}
        <Parrafo tenue>{COPY_ENTRENAMIENTO.confirmarEsDefinitivo}</Parrafo>
        <Boton texto={e.finalizarEntrenamiento} onPress={() => void finalizar()} ocupado={ocupado} />
        <Boton texto="Volver a la sesión" tipo="secundario" onPress={() => setFinalizando(false)} deshabilitado={ocupado} />
        {/* Lejos de «Finalizar» y de los botones frecuentes, y con confirmación si hay algo cargado (B10-10:337). */}
        <Seccion titulo="¿No pudiste entrenar?">
          <Boton texto={COPY_ENTRENAMIENTO.noPudeRealizarla} tipo="secundario" seleccionado={borrador?.sessionCondition === 'NOT_COMPLETED'} onPress={() => void noPude()} deshabilitado={ocupado} />
        </Seccion>
      </View>
    );
  }

  const bases = basesDeLaPrescripcion(p);
  const banda = filaActiva ? bandaDeLaSerie(filaActiva.setIndex, filaActiva.objetivo) : null;
  const registrable = filaActiva !== null && filaActiva.estado === 'sin-registrar';
  const siguienteFila = filaActiva ? primeraSinRegistrar(filas, filaActiva.setIndex) : null;
  const tituloDeLaSerie = !filaActiva
    ? null
    : filaActiva.estado !== 'sin-registrar'
      ? e.serieGuardada(filaActiva.setIndex)
      : filaActiva.planificada
        ? e.serieDe(filaActiva.setIndex, p.sets.length)
        : `${COPY_ENTRENAMIENTO.serie} ${numero(filaActiva.setIndex, 0)} · sin planificar`;
  // Al terminar el descanso: la fila que quedará enfocada, si no es la misma del descanso.
  const trasElDescanso = abierta?.kind === 'REST' && filaActiva && abierta.prescriptionId === p.prescriptionId ? focoTrasElDescanso(filas, abierta.setIndex, filaActiva.setIndex) : null;
  const descanso: EstadoDelDescanso | null =
    !conCorrida || !filaActiva
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
        : pausada || abierta?.kind === 'SET'
          ? null
          : { tipo: 'disponible', serie: filaActiva.setIndex, recomendado: filaActiva.objetivo?.restSeconds ?? null };
  const cronometro: CronometroDeSerie | null =
    !conCorrida || pausada
      ? null
      : abierta?.kind === 'SET'
        ? { tipo: 'en-curso', serie: abierta.setIndex, duracion: vivo?.medicionAbierta ?? null }
        : serieParaCronometrar === null
          ? null
          : abierta?.kind === 'REST'
            ? { tipo: 'tras-descanso', serie: serieParaCronometrar }
            : { tipo: 'disponible', serie: serieParaCronometrar };
  const medida = filaActiva ? (calculo?.timedSets.filter((t) => t.prescriptionId === p.prescriptionId && t.setIndex === filaActiva.setIndex && t.finishedAt !== null).pop() ?? null) : null;
  // Una serie de más es legítima: se ofrece cuando las planificadas ya tienen registro y no hay otra vacía esperando.
  const sePuedeAgregar = filas.length > 0 && Math.max(...filas.map((f) => f.setIndex)) < MAXIMO_DE_SERIES && filas.every((f) => f.estado !== 'sin-registrar');
  // El estado del envío se dice cuando hay algo registrado o pendiente: antes de registrar nada, no hay qué decir.
  const hayRegistro = local.series.length > 0 || (borrador?.exercises.some((x) => (x.sets ?? []).length > 0) ?? false);
  const mostrarEnvio = hayRegistro || envio !== 'sincronizado';
  const elegidaEnTecnica = dialogo?.tipo === 'tecnica' ? (s.prescriptions.find((x) => x.prescriptionId === dialogo.prescriptionId) ?? null) : null;

  return (
    <View>
      <BarraDeLaSesion nombre={s.label} temporizador={temporizador} onVerRutina={() => setDialogo({ tipo: 'rutina' })} />
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
      {modo === 'en-vivo' && estado?.runId && !almacen.explicacionVista() ? <ExplicacionDeLosTiempos onEntendido={() => entrenamientoLocal.marcarExplicacionVista()} /> : null}
      {pausada ? (
        <Aviso tipo="info" titulo={e.sesionEnPausa}>
          <Boton texto={e.reanudarSesion} onPress={() => void hacer({ tipo: 'reanudar' }, 'Sesión reanudada')} />
        </Aviso>
      ) : null}
      <EjercicioActivo token={token} sesionPerdida={sesionPerdida} prescripcion={p} posicion={indice + 1} total={s.prescriptions.length} bases={bases} onVerTecnica={() => setDialogo({ tipo: 'tecnica', prescriptionId: p.prescriptionId })} />
      {tituloDeLaSerie ? (
        <Text style={estilos.tituloDeLaSerie} accessibilityRole="header">
          {tituloDeLaSerie}
        </Text>
      ) : null}
      <TablaDeSeries filas={filas} activa={filaActiva?.setIndex ?? 0} unidad={unidad} escrita={escrita} errores={errores} disposicion={disposicionDeLaTabla(width - 40, fontScale)} onEnfocar={enfocar} onEscribir={escribir} />
      <ErroresDeLaFila errores={errores} />
      <View style={estilos.accionesDeLaTabla}>
        {registrable ? <Boton texto={`Cambiar a ${unidad === 'kg' ? 'lb' : 'kg'}`} tipo="enlace" onPress={() => setUnidades((u) => ({ ...u, [p.prescriptionId]: unidad === 'kg' ? 'lb' : 'kg' }))} /> : null}
        {sePuedeAgregar ? (
          <Boton
            texto="Agregar una serie"
            tipo="enlace"
            onPress={() => {
              const nueva = Math.max(...filas.map((f) => f.setIndex)) + 1;
              setExtras((x) => ({ ...x, [p.prescriptionId]: (x[p.prescriptionId] ?? 0) + 1 }));
              enfocar(nueva);
            }}
          />
        ) : null}
      </View>
      {banda ? <BandaDelPlan banda={banda} /> : null}
      {registrable ? <AyudaDelRir /> : null}
      <CronometrarSerie estado={cronometro} medida={medida ? `${e.duracionMedida}: ${textoDeDuracion(medida.duration)}` : null} onCronometrar={cronometrar} onFinalizar={() => void hacer({ tipo: 'finalizar-serie' }, 'Serie finalizada')} deshabilitado={ocupado} />
      {registrable && filaActiva ? (
        <>
          <Boton texto={e.registrarSerie(filaActiva.setIndex)} onPress={registrar} deshabilitado={!puedeRegistrar(escrita)} />
          {puedeRegistrar(escrita) ? null : <Text style={estilos.ayudaDelBoton}>{e.faltaUnDato}</Text>}
        </>
      ) : null}
      {!registrable && siguienteFila && abierta?.kind !== 'REST' ? <Boton texto={`Pasar a la serie ${numero(siguienteFila.setIndex, 0)}`} tipo="enlace" onPress={() => enfocar(siguienteFila.setIndex)} /> : null}
      {mostrarEnvio ? estadoDelEnvio : null}
      <BloqueDeDescanso
        estado={descanso}
        onIniciar={() => {
          // El descanso queda ligado a la serie enfocada, la que lo origina. Guardar una serie no lo inicia.
          if (filaActiva) hacer({ tipo: 'iniciar-descanso', prescriptionId: p.prescriptionId, setIndex: filaActiva.setIndex }, 'Descanso iniciado');
        }}
        onFinalizar={finalizarDescanso}
        deshabilitado={ocupado}
      />
      {siguiente ? (
        <>
          <Boton texto={e.siguienteEjercicio} tipo="secundario" onPress={() => pasarA(siguiente.prescriptionId)} deshabilitado={pausada} />
          {pausada ? <Text style={estilos.ayudaDelBoton}>Reanudá la sesión para cambiar de ejercicio.</Text> : null}
        </>
      ) : null}
      {conCorrida && !pausada ? <Boton texto={e.pausarSesion} tipo="secundario" onPress={() => void hacer({ tipo: 'pausar' }, e.sesionEnPausa)} /> : null}
      <Boton texto={e.finalizarEntrenamiento} tipo="secundario" onPress={() => setFinalizando(true)} />
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
    </View>
  );
}

// ─── La ejecución registrada, con su corrección ─────────────────────────────────────────────

type UnidadDeCarga = 'kg' | 'lb';

/** «60 kg × 8 reps · RIR 2 · esfuerzo 7». Una carga que no se registró se dice así: no es «sin carga» (06:5675). */
function textoDeSerie(s: { load: { value: number; unit: string } | null; completedRepetitions: number | null; rir: number | null; perceivedExertion: number | null }): string {
  const reps = s.completedRepetitions === null ? '—' : numero(s.completedRepetitions);
  return `${s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada'} × ${reps} ${COPY_ENTRENAMIENTO.reps.toLowerCase()}${s.rir !== null ? ` · RIR ${numero(s.rir)}` : ''}${s.perceivedExertion !== null ? ` · esfuerzo ${numero(s.perceivedExertion)}` : ''}`;
}

function Registro({ registro }: { registro: RegistroDeEjecucion }) {
  return (
    <View>
      <Dato etiqueta={COPY_ENTRENAMIENTO.condicionDeLaSesion} valor={etiquetaDeCondicionRegistrada(registro)} />
      {registro.reason ? <Dato etiqueta="Motivo" valor={registro.reason} /> : null}
      {registro.exercises.map((e) => (
        <View key={e.prescriptionId}>
          <Dato
            etiqueta={e.substituted ? `${COPY_ENTRENAMIENTO.planificado}: ${e.prescribedExerciseName}` : e.performedExerciseName}
            valor={e.substituted ? `${COPY_ENTRENAMIENTO.ejecutado}: ${e.performedExerciseName}` : ''}
          />
          {(e.sets ?? []).map((s) => (
            <Parrafo key={s.setIndex}>
              {COPY_ENTRENAMIENTO.serie} {s.setIndex}: {textoDeSerie(s)}
            </Parrafo>
          ))}
          {e.executionSummary ? <Parrafo>{e.executionSummary.description}</Parrafo> : null}
        </View>
      ))}
      {registro.sessionSummary ? <Parrafo>{registro.sessionSummary.description}</Parrafo> : null}
    </View>
  );
}

export function PantallaDeEjecucionDeEntrenamiento({ token, id, avisoInicial, salir }: { token: string; id: string; avisoInicial?: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const { retirado, accesoRetirado } = useAccesoRetirado();
  const [r, setR] = useState<Resultado<{ data: EjecucionDeEntrenamiento }> | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(avisoInicial ?? null);

  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarEjecucionDeEntrenamiento(token, id);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, id, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Corregir es una escritura: denegada con el 404 no revelador, el registro se retira de la pantalla.
  if (retirado) return <Aviso tipo="info" titulo={COPY_ENTRENAMIENTO.planNoDisponible} />;
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
        <Seccion titulo={COPY_ENTRENAMIENTO.correccionVigente}>
          <Parrafo tenue>
            {vigente.authorRole === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : COPY_ENTRENAMIENTO.corregidoPorVos} · {fecha(vigente.recordedAt)} · {vigente.reason}
          </Parrafo>
          <Registro registro={vigente.correction} />
        </Seccion>
      ) : null}
      <Seccion titulo={COPY_ENTRENAMIENTO.registroOriginal}>
        <Parrafo tenue>Registrado el {fecha(x.recordedAt)}</Parrafo>
        <Registro registro={x.original} />
      </Seccion>
      {/* Los tiempos marcados, cada uno con su calidad (API-TIE-03). Una sesión registrada sin tiempos sigue sin tiempos. */}
      <TiemposDeLaEjecucion token={token} executionId={x.executionId} nombreDe={nombreDe} sesionPerdida={sesionPerdida} />
      {x.corrections.length > 1 ? (
        <Seccion titulo={COPY_ENTRENAMIENTO.historialDeCorrecciones}>
          {x.corrections.map((c) => (
            <Parrafo key={c.correctionId}>
              {fecha(c.recordedAt)} · {c.author.displayName} · {c.reason}
            </Parrafo>
          ))}
        </Seccion>
      ) : null}
      {corrigiendo ? (
        <FormularioDeCorreccion
          token={token}
          ejecucion={x}
          sesionPerdida={sesionPerdida}
          accesoRetirado={accesoRetirado}
          onCorregida={() => {
            setCorrigiendo(false);
            setAviso('Corrección registrada. El registro original se conserva.');
            void cargar();
          }}
          onCancelar={() => setCorrigiendo(false)}
        />
      ) : (
        <Boton texto={COPY_ENTRENAMIENTO.corregirRegistro} tipo="secundario" onPress={() => setCorrigiendo(true)} />
      )}
    </View>
  );
}

/**
 * Lo que la persona escribió y no se puede leer como número. `leerNumero` de `@be/domain` devuelve `null` tanto para el
 * campo vacío como para lo que no es un número, así que la diferencia la hace el texto: vacío es «no cargó nada»
 * —legítimo, el RIR es opcional—; escrito y sin leer es un error que hay que decir.
 */
const sinLeer = (t: string): boolean => t.trim() !== '' && leerNumero(t) === null;

/**
 * Un número ya guardado, escrito dentro de un campo editable: solo cambia el punto decimal por la coma. Acá no va
 * `numero`, que es para **mostrar**: separa los miles con punto, y cambiaría el valor que la persona no tocó. Lo que se
 * precarga tiene que volver de `leerNumero` idéntico a como salió.
 */
const paraEditar = (v: number): string => String(v).replace('.', ',');

type Condicion = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';
interface SerieEnCorreccion {
  readonly carga: string;
  readonly unidad: UnidadDeCarga;
  readonly reps: string;
  readonly rir: string;
}
interface EstadoDeCorreccion {
  readonly condicion: Condicion;
  readonly motivoDeCondicion: string;
  readonly series: readonly (readonly SerieEnCorreccion[])[];
  readonly resumenes: readonly string[];
  readonly resumenDeSesion: string;
}

/**
 * «Corregir registro» (B10-06:868-886): exige motivo **y un cambio**. Se corrigen la condición y su motivo, la carga
 * (con su unidad), las repeticiones y el RIR de cada serie, y los resúmenes; la corrección lleva el registro completo y
 * el original no se toca (REG-06-116).
 * - Corregir a «No pude realizarla» deja la corrección sin series: el original las conserva.
 * - Corregir un «No pude realizarla» a realizada pide contar cómo fue la sesión: no se inventan series que no se
 *   registraron (09v10:1099-1101).
 */
function FormularioDeCorreccion({
  token,
  ejecucion: x,
  sesionPerdida,
  accesoRetirado,
  onCorregida,
  onCancelar,
}: {
  token: string;
  ejecucion: EjecucionDeEntrenamiento;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  onCorregida: () => void;
  onCancelar: () => void;
}) {
  const base = registroVigente(x);
  const inicial: EstadoDeCorreccion = {
    condicion: base.sessionCondition,
    motivoDeCondicion: base.reason ?? '',
    series: base.exercises.map((e) =>
      (e.sets ?? []).map((s) => ({
        carga: s.load ? paraEditar(s.load.value) : '',
        unidad: (s.load?.unit ?? 'kg') as UnidadDeCarga,
        reps: s.completedRepetitions === null ? '' : paraEditar(s.completedRepetitions),
        rir: s.rir === null ? '' : paraEditar(s.rir),
      })),
    ),
    resumenes: base.exercises.map((e) => e.executionSummary?.description ?? ''),
    resumenDeSesion: base.sessionSummary?.description ?? '',
  };
  const [estado, setEstado] = useState<EstadoDeCorreccion>(inicial);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();
  useCambiosSinGuardar(motivo.trim() !== '' || JSON.stringify(estado) !== JSON.stringify(inicial) ? 'la corrección del registro' : null);
  const sinDatosOriginales = base.sessionCondition === 'NOT_COMPLETED';

  /** El registro corregido que describe un estado del formulario. El inicial describe lo que hoy rige. */
  function construir(e: EstadoDeCorreccion) {
    const reason = e.motivoDeCondicion.trim() || null;
    if (e.condicion === 'NOT_COMPLETED') return { granularity: null, sessionCondition: e.condicion, reason, exercises: [], sessionSummary: null };
    if (sinDatosOriginales) {
      return { granularity: 'EXERCISE_OR_SESSION' as const, sessionCondition: e.condicion, reason, exercises: [], sessionSummary: e.resumenDeSesion.trim() ? { description: e.resumenDeSesion.trim() } : null };
    }
    return {
      granularity: base.granularity,
      sessionCondition: e.condicion,
      reason,
      exercises: base.exercises.map((ej, i) =>
        ej.sets
          ? {
              prescriptionId: ej.prescriptionId,
              performedExerciseVersionId: ej.performedExerciseVersionId,
              sets: ej.sets.map((s, j) => {
                const v = e.series[i]?.[j];
                const carga = v ? leerNumero(v.carga) : null;
                const reps = v ? leerNumero(v.reps) : null;
                return {
                  setIndex: s.setIndex,
                  load: carga === null ? null : { value: carga, unit: v?.unidad ?? 'kg' },
                  completedRepetitions: reps === null ? null : Math.round(reps),
                  rir: v ? leerNumero(v.rir) : null,
                  perceivedExertion: s.perceivedExertion,
                };
              }),
            }
          : { prescriptionId: ej.prescriptionId, performedExerciseVersionId: ej.performedExerciseVersionId, executionSummary: { description: (e.resumenes[i] ?? '').trim() } },
      ),
      sessionSummary: base.granularity === 'EXERCISE_OR_SESSION' && e.resumenDeSesion.trim() ? { description: e.resumenDeSesion.trim() } : null,
    };
  }

  const cambiarSerie = (i: number, j: number, cambio: Partial<SerieEnCorreccion>) =>
    setEstado((s) => ({ ...s, series: s.series.map((fila, a) => (a === i ? fila.map((c, k) => (k === j ? { ...c, ...cambio } : c)) : fila)) }));

  async function enviar() {
    if (!motivo.trim()) return setFallo('Contá por qué corregís el registro.');
    if (!estado.series.every((fila) => fila.every((v) => ![v.carga, v.reps, v.rir].some(sinLeer)))) return setFallo('Revisá los números de las series.');
    const correccion = construir(estado);
    // Corregir exige un cambio: una corrección igual a lo que rige no rectifica nada (B10-06:879-884).
    if (JSON.stringify(correccion) === JSON.stringify(construir(inicial))) return setFallo('La corrección no cambia nada del registro.');
    if (sinDatosOriginales && estado.condicion !== 'NOT_COMPLETED' && !estado.resumenDeSesion.trim()) return setFallo('Contá cómo fue la sesión.');
    setEnviando(true);
    setFallo(null);
    const r = await api.corregirEjecucion(token, x.executionId, { reason: motivo.trim(), correction: correccion }, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (accesoRetirado(r)) return;
    if (!r.ok) return setFallo(r.tipo === 'API' && r.issues.some((i) => i.code === 'CORRECTION_WITHOUT_CHANGES') ? 'La corrección no cambia nada del registro.' : r.tipo === 'API' && r.issues.length > 0 ? 'Hay un dato de la corrección que no se puede guardar.' : falloDe(r).mensaje);
    onCorregida();
  }

  const CONDICIONES: readonly { valor: Condicion; texto: string }[] = [
    { valor: 'COMPLETED', texto: 'Realizada' },
    { valor: 'COMPLETED_WITH_DEVIATION', texto: 'Realizada con desvío' },
    { valor: 'NOT_COMPLETED', texto: COPY_ENTRENAMIENTO.noPudeRealizarla },
  ];

  return (
    <Seccion titulo={COPY_ENTRENAMIENTO.corregirRegistro}>
      <Campo etiqueta={COPY_ENTRENAMIENTO.motivoDeLaCorreccion} value={motivo} onChangeText={setMotivo} />
      <Subtitulo>{COPY_ENTRENAMIENTO.condicionDeLaSesion}</Subtitulo>
      {CONDICIONES.map((c) => (
        <Boton key={c.valor} texto={c.texto} tipo={estado.condicion === c.valor ? 'primario' : 'secundario'} seleccionado={estado.condicion === c.valor} onPress={() => setEstado((s) => ({ ...s, condicion: c.valor }))} />
      ))}
      <Campo etiqueta={COPY_ENTRENAMIENTO.motivoOpcional} value={estado.motivoDeCondicion} onChangeText={(v) => setEstado((s) => ({ ...s, motivoDeCondicion: v }))} />
      {estado.condicion === 'NOT_COMPLETED' ? (
        <Parrafo tenue>La corrección queda sin series. El registro original se conserva tal como está.</Parrafo>
      ) : sinDatosOriginales ? (
        <Campo etiqueta={`${COPY_ENTRENAMIENTO.resumenDeLaSesion}: contá cómo fue`} value={estado.resumenDeSesion} onChangeText={(v) => setEstado((s) => ({ ...s, resumenDeSesion: v }))} multiline />
      ) : (
        <>
          {base.exercises.map((e, i) => (
            <View key={e.prescriptionId}>
              <Subtitulo>{e.performedExerciseName}</Subtitulo>
              {(e.sets ?? []).map((s, j) => {
                const v = estado.series[i]?.[j];
                return (
                  <View key={s.setIndex}>
                    <Parrafo>
                      {COPY_ENTRENAMIENTO.serie} {s.setIndex}
                    </Parrafo>
                    <Campo etiqueta={`${COPY_ENTRENAMIENTO.carga} (${v?.unidad ?? 'kg'})`} value={v?.carga ?? ''} onChangeText={(t) => cambiarSerie(i, j, { carga: t })} keyboardType="decimal-pad" />
                    <Boton texto={`Cambiar a ${v?.unidad === 'lb' ? 'kg' : 'lb'}`} tipo="enlace" onPress={() => cambiarSerie(i, j, { unidad: v?.unidad === 'lb' ? 'kg' : 'lb' })} />
                    <Campo etiqueta={COPY_ENTRENAMIENTO.reps} value={v?.reps ?? ''} onChangeText={(t) => cambiarSerie(i, j, { reps: t })} keyboardType="number-pad" />
                    {/* El RIR admite decimales (de 0 a 20): teclado decimal. */}
                    <Campo etiqueta={`${COPY_ENTRENAMIENTO.rir} (opcional)`} value={v?.rir ?? ''} onChangeText={(t) => cambiarSerie(i, j, { rir: t })} keyboardType="decimal-pad" />
                  </View>
                );
              })}
              {e.executionSummary ? (
                <Campo
                  etiqueta={COPY_ENTRENAMIENTO.resumenDelEjercicio}
                  value={estado.resumenes[i] ?? ''}
                  onChangeText={(t) => setEstado((s) => ({ ...s, resumenes: s.resumenes.map((r0, k) => (k === i ? t : r0)) }))}
                  multiline
                />
              ) : null}
            </View>
          ))}
          {base.granularity === 'EXERCISE_OR_SESSION' ? (
            <Campo etiqueta={`${COPY_ENTRENAMIENTO.resumenDeLaSesion} (opcional)`} value={estado.resumenDeSesion} onChangeText={(v) => setEstado((s) => ({ ...s, resumenDeSesion: v }))} multiline />
          ) : null}
        </>
      )}
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      <Boton texto="Registrar corrección" onPress={() => void enviar()} ocupado={enviando} />
      <Boton texto="Cancelar" tipo="enlace" onPress={onCancelar} deshabilitado={enviando} />
    </Seccion>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fechaDeHoy: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginTop: 10, marginBottom: 4 },
  cabezaDeSesion: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoDeSesion: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficieElevada, alignItems: 'center', justifyContent: 'center' },
  textosDeSesion: { flex: 1 },
  ejercicioDeLaSesion: { fontSize: 15, lineHeight: 22, color: COLOR.texto },
  tituloDeLaSerie: { fontSize: 19, fontWeight: '800', color: COLOR.texto, marginTop: 8 },
  accionesDeLaTabla: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  ayudaDelBoton: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, textAlign: 'center', marginBottom: 4 },
}));
