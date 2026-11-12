'use client';

/**
 * La versión en preparación del plan de entrenamiento (B10-06 §8-§23): Bloque → Microciclo opcional → Sesión → Ejercicio.
 * - Un plan sin microciclos es natural: las sesiones cuelgan del bloque. Con microciclos, van bajo ellos. Nunca se
 *   fuerza un microciclo vacío (B10-06:275-281).
 * - El propósito del bloque o del microciclo es texto libre: sin «Acumulación / Intensificación / Descarga» como
 *   únicos tipos (B10-06:332-342).
 * - Validar informa los problemas vinculados a bloque → sesión → ejercicio, sin «Programa óptimo» (B10-06:563-591).
 * - «Guardar ahora» no activa (ED-03). Activar pide confirmación con la consecuencia literal de B10-06:607.
 * - El borrador se lee con API-SER-01, que trae los tres estados de cada objetivo por serie (DL-122); API-TRN-09 no los
 *   trae porque lo lee también la APK instalada.
 *
 * **La composición (WP-ESCRITORIO-AREAS, parte 8; maqueta 28).** Se mira una sesión por vez —la del bloque y, si el
 * bloque los usa, del microciclo elegidos—, con sus ejercicios plegados: cada uno dice en un renglón lo que piden sus
 * series, con lo escrito y todavía sin guardar. Lo que se usa de vez en cuando (cambiar un nombre, quitar, organizar por
 * microciclos, guardar como plantilla o como habitual) va en un menú. Hace lo mismo que antes:
 * - **Lo que se mira vive en la dirección,** por su posición: `bloque`, `micro`, `sesion` y los ejercicios abiertos
 *   (`ejercicios`). «Actualizar» y volver atrás lo conservan. Al entrar no hay ningún ejercicio abierto.
 * - **Lo que no deja guardar se lista con su lugar,** antes de pedirle nada a la API: un nombre vacío, el objetivo de
 *   intensidad que falta, un dato que no se entiende. Un dato mal escrito ya no viaja: en un descanso o en el RIR de una
 *   serie se guardaba, en silencio, como «sin objetivo».
 * - **«Revisar y activar…» (ED-07, DJ-6) abre «Antes de activar» siempre:** lo que impide activar, lo que queda sin
 *   completar, lo que cambia frente a la vigente y lo que va a ver la persona, y ahí se fija la próxima revisión, que es
 *   parte de ese acto. Con cambios sin guardar, primero se guardan. Si la persona todavía no usó una app que muestre los
 *   objetivos por serie y el plan los tiene, eso impide activar y se dice por qué (precierre del 2026-10-06, §2; hasta
 *   ED-08, la API todavía lo espera).
 * - **Cada problema lleva a su lugar:** elige el bloque, el microciclo y la sesión, abre el ejercicio y deja el foco ahí.
 */
import {
  COPY,
  COPY_AGENDA_DE_ENTRENAMIENTO,
  COPY_GUARDADO,
  COPY_COMPATIBILIDAD_DE_CLIENTES,
  COPY_DE_ACTIVAR_EL_PLAN,
  COPY_DESCARTAR_LA_VERSION,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  COPY_HABITUALES,
  COPY_PLANTILLAS,
  PROBLEMA_DE_AGENDA,
  PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO as N,
  avisoDeLoQueNoDejaGuardarElEntrenamiento,
  cuentaDeLaSesion,
  detalleDelFallo,
  ejercicioPlegadoDelEditor,
  ejerciciosAbiertosEnElEditor,
  estructuraConObjetivosComoEntrada,
  falloDeGuardado,
  loQueNoDejaGuardarElEntrenamiento,
  loQueSeMiraEnElEditor,
  lugarDelProblemaDeEntrenamiento,
  motivoSinGuardarAhora,
  pedidoDeEjerciciosDelEditor,
  pedidoDeLaPosicion,
  planExigeObjetivosPorSerie,
  problemasDelEjercicio,
  sesionesDelBloque,
  ubicacionDelProblemaDeEntrenamiento,
  type AgendaDeEntrenamiento,
  type DetalleDelFallo,
  type ImagenDeEjercicio,
  type PlanConObjetivos,
  type SesionHabitual,
  type ValidationIssue,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { EnPartes } from '../../../../components/en-partes';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { TextoAPedido } from '../../../../components/texto-a-pedido';
import { api } from '../../../../lib/api';
import { EstadoDeGuardado } from '../../../../components/estado-de-guardado';
import { useAutoguardado } from '../../../../lib/autoguardado';
import { diaSinElAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { eleccionAlActivar, fechaQueResulta, loQueFalta, NADA_ELEGIDO, type EleccionDeLaProxima } from '../../../../lib/cuando-la-revisas';
import { CuandoLaRevisas } from '../cuando-la-revisas';
import { COPY_ANTES_DE_ACTIVAR } from '../antes-de-activar';
import { compararEntrenamiento } from '../comparar-versiones';
import { AntesDeActivar } from '../cuadro-antes-de-activar';
import { CuadroDelDescarte } from '../cuadro-del-descarte';
import { ofreceDescartar, resultadoDelDescarte, textoDelDescarteQueNoSeHizo } from '../descartar-el-borrador';
import { conLosIdentificadoresNuevos, cualMande, huellaDelGuardado, type CuerpoDelGuardado } from '../es-lo-que-mande';
import { useCambiosSinGuardar } from '../marco-del-area';
import { AVISO_DE_LOS_TOPES, esUnTope, TEXTO_DE_LOS_TOPES, TOPES_DE_ENTRENAMIENTO, topesPasadosDeEntrenamiento } from '../topes-del-plan';
import { loQueQuedaSinCompletarEnEntrenamiento, TEXTO_DE_LO_INCOMPLETO } from '../revisar-el-plan';
import {
  COPY_DE_LOS_EDITORES as E,
  copiaDeLaSesion,
  copiaDelEjercicio,
  duplicarEn,
  loQuePasaConLasSesiones,
  mover,
  organizadoEnMicrociclos,
  posicionesTrasInsertar,
  posicionesTrasMover,
  posicionesTrasQuitar,
} from '../editar-la-estructura';
import { hoyEn } from '../seguimiento/estado';
import { AgendaDelPlan, agendaVigente, sesionesParaLaAgenda } from './agenda-del-plan';
import { AgregarEjercicio } from './agregar-ejercicio';
import { EjercicioDelEditor, type BloqueE, type Bloques, type PrescripcionE, type SesionE } from './ejercicio-del-editor';
import { NoDisponible, useEntrenamiento } from './entrenamiento';
import { SelectorDeNivel } from './estructura-del-plan';
import { DialogoGuardarSesionHabitual, InsertarSesionHabitual, nombresDeHabitual, useEjerciciosHabituales, useSesionesHabituales } from './habituales';
import { DialogoGuardarPlantilla, NotaDeOrigen } from './plantillas';

type MicrocicloE = NonNullable<BloqueE['microcycles']>[number];

/** La jerarquía de API-SER-01 como entrada del PATCH, con los tres estados de cada serie (en el dominio, para que las pruebas editen igual). */
const aEntrada = (v: PlanConObjetivos): Bloques => estructuraConObjetivosComoEntrada(v);

/** ED-61: lo que quedó guardado en una versión, en la forma en que se compara con lo que mandó esta pantalla. */
const cuerpoGuardado = (v: PlanConObjetivos): CuerpoDelGuardado => ({ estructura: aEntrada(v), proximaRevision: v.nextReviewAt, agenda: v.agenda, objetivo: v.objectiveVersionId });

/** Cada prescripción de la versión, en orden: de ahí salen los nombres y las imágenes por versión de ejercicio. */
function prescripcionesDe(v: PlanConObjetivos) {
  return v.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).flatMap((s) => s.prescriptions);
}

function nombresDe(v: PlanConObjetivos): Record<string, string> {
  return Object.fromEntries(prescripcionesDe(v).map((p) => [p.exerciseVersionId, p.exerciseName]));
}

function imagenesDe(v: PlanConObjetivos): Record<string, ImagenDeEjercicio | null> {
  return Object.fromEntries(prescripcionesDe(v).map((p) => [p.exerciseVersionId, p.image]));
}

const PROBLEMA: Readonly<Record<string, string>> = {
  BLOCK_REQUIRED: 'falta al menos un bloque',
  SESSION_REQUIRED: 'falta al menos una sesión',
  PRESCRIPTION_REQUIRED: 'falta al menos un ejercicio',
  SESSIONS_AND_MICROCYCLES_IN_BLOCK: 'si el bloque tiene microciclos, las sesiones van dentro de ellos',
  DUPLICATE_NODE_ID: 'hay un elemento repetido',
  INTENSITY_CRITERION_UNKNOWN: 'el criterio de intensidad no es % RM ni RIR',
  INTENSITY_CRITERIA_COMBINED: 'se eligen % RM o RIR, no los dos',
  PERCEIVED_EXERTION_AS_CRITERION: 'el esfuerzo percibido se registra en la sesión: no es un criterio de prescripción',
  INTENSITY_TARGET_OUT_OF_RANGE: 'el objetivo de intensidad no tiene sentido para ese criterio',
  SET_RIR_WITHOUT_RIR_CRITERION: 'un RIR por serie necesita que el ejercicio use el criterio RIR',
  SET_RIR_OUT_OF_RANGE: 'el RIR objetivo de una serie va de 0 a 10',
  EXERCISE_REFERENCE_INVALID: 'el ejercicio no está en el catálogo',
  EXERCISE_NOT_AVAILABLE: 'el ejercicio ya no está disponible',
  OBJECTIVE_NOT_EFFECTIVE: 'el borrador usa un objetivo que ya no es el vigente',
  SNAPSHOT_NOT_PRESERVABLE: 'no se pudo preservar la versión para el asesorado',
  // Fallas de forma del pedido (400): un número que falta o que no se entiende.
  INVALID_TYPE: 'falta un número o no se entiende lo escrito',
  INVALID_UNION: 'falta un número o no se entiende lo escrito',
  TOO_SMALL: 'falta un dato, o el número es demasiado chico',
  TOO_BIG: 'el número es demasiado grande, o hay más elementos de los que admite un plan',
  NOT_MULTIPLE_OF: 'el número no es entero',
  // Lo que el editor ve solo, antes de guardar.
  [N.faltaElNombre]: 'falta el nombre',
  [N.faltaElObjetivo]: 'falta el objetivo de intensidad, o no se entiende lo escrito',
  [N.repeticionesIlegibles]: 'las repeticiones no se entienden: van un número o un rango, como 8-12',
  [N.cargaIlegible]: 'la carga sugerida no se entiende',
  [N.rirIlegible]: 'el RIR no se entiende',
  [N.descansoIlegible]: 'el descanso no se entiende: va como 02:30, o en segundos',
  [N.parametroIncompleto]: 'a un parámetro le falta el nombre o el valor',
  // La agenda (DL-137): lo que la API rechaza de los días de entrenamiento.
  ...PROBLEMA_DE_AGENDA,
  // TB-48: los topes del contrato, avisados antes de guardar.
  ...TEXTO_DE_LOS_TOPES,
};

/** Lo que no deja guardar: lo que el editor ve solo y, desde TB-48, los topes del contrato que se pasan. */
const loQueNoDejaGuardar = (bloques: Bloques) => [...loQueNoDejaGuardarElEntrenamiento(bloques), ...topesPasadosDeEntrenamiento(bloques)];

/** Dónde está un problema, en palabras: los de la agenda, en «Días de entrenamiento». */
const dondeEsta = (p: ValidationIssue, bloques: Bloques): string =>
  p.path.startsWith('agenda') ? COPY_AGENDA_DE_ENTRENAMIENTO.titulo : ubicacionDelProblemaDeEntrenamiento(p.path, bloques);


const esDelEditor = (codigo: string): boolean => (Object.values(N) as readonly string[]).includes(codigo);

const sesionVacia = (n: number): SesionE => ({ label: `Sesión ${String.fromCharCode(64 + Math.min(n, 26))}`, instructions: null, prescriptions: [] });

const nombreDelBloque = (b: { readonly label: string }, n: number): string => b.label.trim() || `${COPY_ENTRENAMIENTO.bloque} ${n + 1}`;
const nombreDelMicrociclo = (m: { readonly label: string }, n: number): string => m.label.trim() || `${COPY_ENTRENAMIENTO.microciclo} ${n + 1}`;
const nombreDeLaSesion = (s: { readonly label: string }, n: number): string => s.label.trim() || `${C.sesion} ${n + 1}`;

/** Lo que se elige en un selector de nivel: el editor nombra las cosas por su posición, desde uno. */
const paraElegir = (nombres: readonly string[]) => nombres.map((label, n) => ({ order: n + 1, label }));

/** Dónde está lo que se cambia: las posiciones del bloque, del microciclo (si el bloque los usa) y de la sesión. */
interface Lugar {
  readonly i: number;
  readonly j: number | null;
  readonly k: number | null;
}
type QueTexto = 'nombre-del-bloque' | 'proposito-del-bloque' | 'nombre-del-microciclo' | 'proposito-del-microciclo' | 'nombre-de-la-sesion' | 'indicaciones';
/** El texto que se está cambiando: un nombre, un propósito o las indicaciones, con su lugar. */
type TextoQueSeCambia = (Lugar & { readonly de: QueTexto }) | null;

/** El campo al que lleva un problema dentro de un ejercicio: el dato que hay que corregir, o el renglón del ejercicio. */
function campoDelProblema(p: ValidationIssue, ejercicio: string, serie: number | null): string {
  if (serie !== null) {
    const cual = p.code === N.cargaIlegible ? '-carga' : p.code === N.rirIlegible ? '-rir' : p.code === N.descansoIlegible ? '-descanso' : '';
    return `${ejercicio}-serie-${serie}${cual}`;
  }
  if (p.code === N.faltaElObjetivo) return `${ejercicio}-objetivo`;
  if (p.code === N.cargaIlegible) return `${ejercicio}-carga`;
  if (p.code === N.descansoIlegible) return `${ejercicio}-descanso`;
  const parametro = /professionalParameters\[(\d+)\]/.exec(p.path);
  if (p.code === N.parametroIncompleto && parametro) return `${ejercicio}-param-${parametro[1]}-etiqueta`;
  return `abrir-ejercicio-${ejercicio}`;
}

export function EditorDePlan({
  planId,
  numero,
  objetivoVigente,
  vigente = null,
  onActivado,
  onDescartado,
}: {
  planId: string;
  /** El número de esta versión en preparación: el de las activadas más uno (DJ-6). */
  numero: number;
  /** El objetivo vigente hoy, que ya leyó la sección: si es más nuevo que el de la versión, al guardar pasa a usarlo. */
  objetivoVigente: string | null;
  /**
   * La versión que rige hoy, que al activar esta queda en el historial; `null` si es la primera. Con su plan, «Antes de
   * activar» dice lo que cambia (ED-07).
   */
  vigente?: { readonly numero: number; readonly desde: string; readonly plan?: PlanConObjetivos | null } | null;
  onActivado: () => void;
  /** ED-01: la versión en preparación se descartó (o ya no estaba): la sección vuelve a leer el plan. */
  onDescartado: () => void;
}) {
  const { token, sesionPerdida, accesoRetirado, parametros, ir } = useEntrenamiento();
  const [version, setVersion] = useState<PlanConObjetivos | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [bloques, setBloques] = useState<Bloques>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [imagenes, setImagenes] = useState<Record<string, ImagenDeEjercicio | null>>({});
  const [proximaRevision, setProximaRevision] = useState('');
  // TB-15: «¿Cuándo la revisás?» al activar, con nada elegido (o la fecha que ya tenía la versión); la fecha que resulta
  // es la que se guarda en la versión antes de activarla.
  const [cuando, setCuando] = useState<EleccionDeLaProxima>(NADA_ELEGIDO);
  // La agenda (DL-137): los días de cada sesión. Se ve plegada en un renglón y se abre para cambiarla.
  const [agenda, setAgenda] = useState<AgendaDeEntrenamiento | null>(null);
  const [agendaAbierta, setAgendaAbierta] = useState(false);
  const [sucio, setSucio] = useState(false);
  useCambiosSinGuardar(sucio, 'el plan en preparación');
  const [guardando, setGuardando] = useState(false);
  // Bloque 3 del encargo de consolidación (2026-10-19): el estado de escritura inequívoco, el conflicto con otra pestaña y
  // el autoguardado. «Guardado» solo con la respuesta del servidor; un 409 por versión no pisa nada.
  const [fallo, setFallo] = useState(false);
  // ED-03: el detalle técnico del último fallo (se ve plegado mientras dura el fallo).
  const [detalle, setDetalle] = useState<DetalleDelFallo | null>(null);
  const [conflicto, setConflicto] = useState(false);
  const [guardadoA, setGuardadoA] = useState<string | null>(null);
  // Cuántas ediciones hubo: lo que se escribe mientras viaja un guardado no se pisa con la respuesta.
  const ediciones = useRef(0);
  // ED-61: lo que esta pantalla mandó y no tuvo respuesta; ante un 409, se compara con lo guardado.
  const sinRespuesta = useRef<CuerpoDelGuardado[]>([]);
  // `sinFoco`: un aviso del autoguardado (DL-168) se anuncia sin sacarle el foco a lo que se está editando.
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string; deValidar?: boolean; sinFoco?: boolean } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  // ED-07: la revisión de la API de lo guardado, para «Antes de activar» (`null`: todavía no se pidió).
  const [revision, setRevision] = useState<{ readonly estado: 'revisando' | 'lista' | 'fallo'; readonly problemas: readonly ValidationIssue[] } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  // «Guardar como plantilla» sobre el borrador tal como está en pantalla (PF-09; DL-108); sin origen: no es una versión activada.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();
  // ED-01: «Descartar la versión en preparación», con su cuadro y su intento (la misma clave en un reintento).
  const [descartar, setDescartar] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [falloDelDescarte, setFalloDelDescarte] = useState<string | null>(null);
  const intentoDeDescartar = useClaveDeIntento();
  // «Mis habituales» (PF-09 bis; DL-109): ejercicios a mano en el buscador; sesiones para guardar e insertar.
  const ejerciciosHabituales = useEjerciciosHabituales(token);
  const sesionesHabituales = useSesionesHabituales(token);
  const [sesionHabitual, setSesionHabitual] = useState<SesionE | null>(null);
  const [insertandoHabitual, setInsertandoHabitual] = useState(false);
  // «Agregar ejercicio»: el cajón suma a la sesión que se mira.
  const [agregando, setAgregando] = useState(false);
  // El texto que se está cambiando, y el campo que hay que enfocar después de ir a un problema.
  const [texto, setTexto] = useState<TextoQueSeCambia>(null);
  const [paraEnfocar, setParaEnfocar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const r = await api.planConObjetivos(token, planId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
    setVersion(r.datos.data);
    setBloques(aEntrada(r.datos.data));
    setNombres(nombresDe(r.datos.data));
    setImagenes(imagenesDe(r.datos.data));
    setProximaRevision(r.datos.data.nextReviewAt ?? '');
    setAgenda(r.datos.data.agenda);
    setSucio(false);
    setFallo(false);
    setConflicto(false);
    sinRespuesta.current = [];
  }, [token, planId, sesionPerdida]);

  useEffect(() => {
    ediciones.current += 1;
  }, [bloques, agenda, proximaRevision]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Después de ir a un problema, el foco va a su lugar en cuanto está dibujado (la sesión puede tardar un instante en
  // cambiar). Si la persona hace otra cosa antes, ese foco pendiente se olvida: no salta más tarde.
  useEffect(() => {
    if (!paraEnfocar) return;
    const campo = document.getElementById(paraEnfocar);
    if (!campo) return;
    campo.focus();
    setParaEnfocar(null);
  });

  const cambiar = (f: (b: Bloques) => Bloques) => {
    setBloques((b) => f(structuredClone(b)));
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
    setParaEnfocar(null);
  };

  /**
   * Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. `reenvio` (ED-61): lo escrito después de un guardado
   * cuya respuesta se perdió, que se manda otra vez sobre la versión que ese guardado dejó, con las ediciones contadas
   * desde el primer envío.
   */
  async function guardar(automatico = false, reenvio: { readonly base: PlanConObjetivos; readonly bloques: Bloques; readonly ediciones: number } | null = null): Promise<PlanConObjetivos | null> {
    const base = reenvio?.base ?? version;
    if (!base) return null;
    const bloquesEnviados = reenvio?.bloques ?? bloques;
    // Un nombre vacío o un dato que no se entiende pueden estar en otro bloque, en otra sesión o en un ejercicio
    // plegado: se listan, y cada uno lleva a su lugar. Nada de eso viaja: un dato mal escrito se guardaría como «nada».
    const impide = loQueNoDejaGuardar(bloquesEnviados);
    if (impide.length > 0) {
      // El autoguardado espera a que se pueda guardar: no abre avisos mientras se escribe.
      if (automatico) return null;
      setProblemas(impide);
      setMensaje({ tipo: 'error', texto: impide.some((p) => esUnTope(p.code)) ? AVISO_DE_LOS_TOPES : avisoDeLoQueNoDejaGuardarElEntrenamiento(impide) });
      return null;
    }
    const edicionesAlEnviar = reenvio?.ediciones ?? ediciones.current;
    setGuardando(true);
    if (!automatico) setMensaje(null);
    const actualizarObjetivo = objetivoVigente && objetivoVigente !== base.objectiveVersionId ? { objectiveVersionId: objetivoVigente } : {};
    // La agenda viaja siempre: la que se ve, o `null` si no quedó ninguna sesión con días (DL-137).
    const dias = agendaVigente(agenda, sesionesParaLaAgenda(bloquesEnviados));
    const agendaEnviada = dias && dias.sessions.length > 0 ? dias : null;
    // ED-61: lo que se manda, por si la respuesta se pierde y el guardado siguiente da 409.
    const cuerpo: CuerpoDelGuardado = { estructura: bloquesEnviados, proximaRevision: proximaRevision || null, agenda: agendaEnviada, objetivo: actualizarObjetivo.objectiveVersionId ?? base.objectiveVersionId };
    const r = await api.editarPlanDeEntrenamiento(token, planId, {
      expectedVersion: base.version,
      changes: { blocks: bloquesEnviados },
      nextReviewAt: proximaRevision || null,
      agenda: agendaEnviada,
      ...actualizarObjetivo,
    });
    if (sesionPerdida(r) || accesoRetirado(r)) {
      setGuardando(false);
      return null;
    }
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        // ED-61: si un guardado de esta pantalla se quedó sin respuesta, lo guardado puede ser lo que mandó. Se relee y
        // se compara con cada cuerpo sin respuesta, sin los identificadores que puso el servidor.
        const mandados = sinRespuesta.current;
        const actual = mandados.length > 0 && !reenvio ? await api.planConObjetivos(token, planId) : null;
        if (actual && sesionPerdida(actual)) {
          setGuardando(false);
          return null;
        }
        const cual = actual?.ok ? cualMande(cuerpoGuardado(actual.datos.data), mandados) : -1;
        if (actual?.ok && cual >= 0) {
          // Lo guardado es de esta pantalla: no hay conflicto. Se adopta la versión que quedó (su token y sus
          // identificadores) y, si se escribió algo después, se manda sobre ella.
          sinRespuesta.current = [];
          const guardada = actual.datos.data;
          const mandado = mandados[cual]!;
          setVersion(guardada);
          setFallo(false);
          setNombres((n) => ({ ...n, ...nombresDe(guardada) }));
          setImagenes((x) => ({ ...x, ...imagenesDe(guardada) }));
          if (huellaDelGuardado(cuerpo) !== huellaDelGuardado(mandado)) {
            return guardar(automatico, { base: guardada, bloques: conLosIdentificadoresNuevos(bloquesEnviados, mandado.estructura, aEntrada(guardada)), ediciones: edicionesAlEnviar });
          }
          setGuardando(false);
          setGuardadoA(horaDelDia(new Date()));
          autoguardado.informar('GUARDADO');
          if (ediciones.current === edicionesAlEnviar) {
            setBloques(aEntrada(guardada));
            setAgenda(guardada.agenda);
            setSucio(false);
          }
          return guardada;
        }
        setGuardando(false);
        setConflicto(true);
        autoguardado.informar('OTRO');
        return null;
      }
      setGuardando(false);
      // Lo escrito queda como está: ni los bloques ni «sucio» cambian, y el próximo guardado lo vuelve a mandar.
      setFallo(true);
      setDetalle(detalleDelFallo(r, horaDelDia(new Date())));
      const motivo = falloDeGuardado(r);
      // ED-61: sin respuesta, el guardado pudo haber llegado. Se recuerda lo que se mandó, para reconocerlo ante un 409.
      if (motivo === 'SIN_RESPUESTA') sinRespuesta.current = [...sinRespuesta.current, cuerpo];
      // ED-60: un rechazo que no se arregla solo no se reintenta sin un cambio; sin respuesta, la espera crece.
      autoguardado.informar(motivo, ediciones.current !== edicionesAlEnviar);
      // DL-168: si el plan no entra, reintentar no lo arregla: se dice también en el autoguardado, sin mover el foco.
      if (motivo === 'DEMASIADO_GRANDE') {
        setProblemas(null);
        setMensaje({ tipo: 'error', texto: COPY_GUARDADO.demasiadoGrande, sinFoco: automatico });
        return null;
      }
      if (automatico) return null;
      if (motivo === 'SIN_RESPUESTA') {
        setMensaje({ tipo: 'error', texto: COPY_GUARDADO.sinRespuesta });
        return null;
      }
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    // La respuesta de API-TRN-10 tiene la forma que lee la APK instalada, sin los objetivos por serie: el borrador se
    // vuelve a leer con API-SER-01. Si esa lectura falla, lo guardado es lo que se mandó y solo cambia el token.
    const detalle = await api.planConObjetivos(token, planId);
    setGuardando(false);
    // ED-61: con una respuesta, lo que se mandó antes sin respuesta ya no es candidato (el token avanzó).
    sinRespuesta.current = [];
    if (sesionPerdida(detalle)) return null;
    const guardada: PlanConObjetivos = detalle.ok ? detalle.datos.data : { ...base, version: r.datos.data.version, nextReviewAt: r.datos.data.nextReviewAt, objectiveVersionId: r.datos.data.objectiveVersionId };
    setVersion(guardada);
    setFallo(false);
    setConflicto(false);
    setGuardadoA(horaDelDia(new Date()));
    autoguardado.informar('GUARDADO');
    // Lo escrito mientras viajaba el guardado se conserva: sigue pendiente y viaja en el próximo, con la versión nueva.
    const sinCambiosDespues = ediciones.current === edicionesAlEnviar;
    if (detalle.ok) {
      if (sinCambiosDespues) {
        setBloques(aEntrada(detalle.datos.data));
        setAgenda(detalle.datos.data.agenda);
      }
      setNombres((n) => ({ ...n, ...nombresDe(detalle.datos.data) }));
      setImagenes((x) => ({ ...x, ...imagenesDe(detalle.datos.data) }));
    }
    if (sinCambiosDespues) setSucio(false);
    return guardada;
  }

  // El autoguardado: la preparación se guarda sola en la primera pausa, si se puede y si no hay un acto abierto.
  const puedeGuardar = loQueNoDejaGuardar(bloques).length === 0;
  // ED-03: por qué «Guardar ahora» está apagado, o `null`.
  const sinGuardarAhora = motivoSinGuardarAhora({ guardando, sucio, conflicto });
  const cambiosParaGuardar = useMemo(() => [bloques, agenda, proximaRevision], [bloques, agenda, proximaRevision]);
  const autoguardado = useAutoguardado({
    habilitado: !!version && sucio && puedeGuardar && !guardando && !conflicto && !confirmar && !activando && !guardarPlantilla && !descartar,
    cambios: cambiosParaGuardar,
    guardar: () => void guardar(true),
  });

  /**
   * ED-07: la revisión de la API de la versión guardada (API-TRN-11). Lo que dice entra en «Lo que impide activar»; la
   * validación final sigue siendo la de la API al activar. Revisar mira la forma, no la calidad (B10-06:563-591).
   */
  async function revisar(v: PlanConObjetivos) {
    setRevision({ estado: 'revisando', problemas: [] });
    const r = await api.validarPlanDeEntrenamiento(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    setRevision(r.ok ? { estado: 'lista', problemas: r.datos.data.issues } : { estado: 'fallo', problemas: [] });
  }

  /** ED-07 (DJ-6): «Revisar y activar…» abre el cuadro siempre, también con algo por corregir o sin guardar. */
  function abrirAntesDeActivar() {
    if (!version) return;
    setFalloDeActivacion(null);
    setCuando(eleccionAlActivar(version.nextReviewAt));
    setProximaRevision(version.nextReviewAt ?? '');
    setRevision(null);
    setConfirmar(true);
  }

  /** ED-07: cerrar el cuadro sin activar. La fecha es de este acto: vuelve a la que estaba guardada. */
  function cerrarAntesDeActivar() {
    setConfirmar(false);
    setFalloDeActivacion(null);
    setProximaRevision(version?.nextReviewAt ?? '');
    setCuando(NADA_ELEGIDO);
    setRevision(null);
    intentoDeActivar.descartar();
  }

  // ED-07: con el cuadro abierto y todo guardado, la API revisa lo guardado (al abrirlo, o apenas llega la respuesta de
  // un guardado). Con cambios sin guardar, el cuadro ofrece primero «Guardar ahora».
  useEffect(() => {
    if (confirmar && version && !sucio && !guardando && revision === null) void revisar(version);
    // `revisar` es de este render y lee lo mismo que estas dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmar, version, sucio, guardando, revision]);

  async function activar() {
    if (!version || fechaQueResulta(cuando, hoyEn()) === undefined) return;
    setActivando(true);
    setFalloDeActivacion(null);
    // La próxima revisión se fija en este acto: si cambió, se guarda antes, y se activa la versión que eso deja.
    let v: PlanConObjetivos | null = version;
    if (proximaRevision !== (version.nextReviewAt ?? '')) {
      v = await guardar();
      if (!v) {
        setActivando(false);
        return setFalloDeActivacion(COPY_DE_ACTIVAR_EL_PLAN.noSePudoGuardarAntes);
      }
    }
    const r = await api.activarPlanDeEntrenamiento(token, planId, v.version, intentoDeActivar.actual());
    intentoDeActivar.registrar(r);
    setActivando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) {
        setConfirmar(false);
        setProblemas(r.issues);
        return setMensaje({ tipo: 'error', texto: COPY_ENTRENAMIENTO.hayElementosPorCorregir, deValidar: true });
      }
      if (r.tipo === 'API' && r.codigo === 'CAPACITY_NOT_AVAILABLE') return setFalloDeActivacion('No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.');
      if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_CONFLICT') return setFalloDeActivacion('El asesorado ya tiene un plan de entrenamiento vigente con otro profesional.');
      if (r.tipo === 'API' && r.codigo === 'CLIENT_CAPABILITY_REQUIRED') {
        void cargar();
        return setFalloDeActivacion(`${COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada} ${COPY_COMPATIBILIDAD_DE_CLIENTES.queHacer}`);
      }
      return setFalloDeActivacion(esIncierto(r) ? COPY.resultadoIncierto : 'No pudimos activar el plan. Probá de nuevo.');
    }
    setConfirmar(false);
    onActivado();
  }

  /**
   * ED-01: descarta la versión en preparación con la versión que muestra la pantalla. Descartada, o si ya no estaba (se
   * descartó o se activó en otra pestaña), la sección vuelve a leer el plan; si no, el cuadro dice por qué.
   */
  async function descartarLaVersion() {
    if (!version || descartando) return;
    setDescartando(true);
    setFalloDelDescarte(null);
    const r = await api.descartarBorradorDePlanDeEntrenamiento(token, planId, version.version, intentoDeDescartar.actual());
    intentoDeDescartar.registrar(r);
    setDescartando(false);
    if (sesionPerdida(r)) return;
    const queNoSeHizo = textoDelDescarteQueNoSeHizo(resultadoDelDescarte(r));
    if (queNoSeHizo) return setFalloDelDescarte(queNoSeHizo);
    // Lo que no se guardó se fue con la versión: salir ya no pregunta.
    setSucio(false);
    setDescartar(false);
    onDescartado();
  }

  if (error === 'no-disponible') return <NoDisponible />;
  if (error === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (!version) return <Cargando />;

  // Precierre del 2026-10-06, §2: las APK instaladas muestran solo los objetivos generales. Si el plan escrito tiene
  // objetivos distintos por serie (la misma regla que aplica la API) y el asesorado todavía no usó una app que los
  // muestre (API-SER-01), no se puede activar: se dice por qué, y la API lo rechaza igual (409 CLIENT_CAPABILITY_REQUIRED).
  const exigeObjetivosPorSerie = planExigeObjetivosPorSerie({ blocks: bloques });

  // La agenda que se ve: sin las sesiones que se sacaron ni los movimientos que dejaron de tener sentido (DL-137).
  const sesionesDeLaAgenda = sesionesParaLaAgenda(bloques);
  const agendaVisible = agendaVigente(agenda, sesionesDeLaAgenda);
  const cambiarAgenda = (a: AgendaDeEntrenamiento | null) => {
    setAgenda(a);
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  };
  const bloqueadoPorLaApp = exigeObjetivosPorSerie && !version.setTargetsDelivery.adviseeClientCapable;

  // ── Lo que se mira: el bloque, el microciclo y la sesión, por su posición, según la dirección ──────────────────
  const mira = loQueSeMiraEnElEditor(bloques, { bloque: parametros.get('bloque'), microciclo: parametros.get('micro'), sesion: parametros.get('sesion') });
  const i = mira.bloque;
  const bloque = i >= 0 ? bloques[i] : undefined;
  const j = mira.conMicrociclos ? mira.microciclo : null;
  const microciclo: MicrocicloE | undefined = j !== null ? bloque?.microcycles?.[j] : undefined;
  const sesiones: readonly SesionE[] = (microciclo ? microciclo.sessions : bloque?.sessions) ?? [];
  const k = mira.sesion;
  const sesion = k >= 0 ? sesiones[k] : undefined;
  const diasDeEstaSesion = sesion?.sessionId ? (agendaVisible?.sessions.find((x) => x.sessionId === sesion.sessionId)?.weekdays ?? []) : [];
  // El prefijo de los identificadores de lo que cuelga del bloque o del microciclo: `b0`, `b0-m1`.
  const prefijo = `b${i}${j !== null ? `-m${j}` : ''}`;
  const abiertos = ejerciciosAbiertosEnElEditor(sesion?.prescriptions.length ?? 0, parametros.get('ejercicios'));
  /** La lista de sesiones que se edita —las del microciclo o las del bloque—, dentro de una copia de la estructura. */
  const lasSesiones = (x: Bloques): SesionE[] => (j !== null ? x[i]!.microcycles![j]!.sessions : (x[i]!.sessions ??= []));
  // Lo que el editor ve solo ya lo dice cada ejercicio con sus palabras: al renglón van los problemas de «Validar».
  const rutasConProblemas = (problemas ?? []).filter((p) => !esDelEditor(p.code)).map((p) => p.path);
  const impideGuardar = loQueNoDejaGuardar(bloques);
  const antesHayQueCorregir = impideGuardar.length > 0 ? 'Antes hay que corregir lo que no deja guardar esta versión.' : null;

  // ── ED-07: lo que dice «Antes de activar» ─────────────────────────────────────────────────────────────────────
  /** Cerrar el cuadro y llevar a una cosa por corregir: a su lugar, con el foco ahí. */
  const irDesdeElCuadro = (p: ValidationIssue) => () => {
    cerrarAntesDeActivar();
    irAlProblema(p);
  };
  const conSuLugar = (p: ValidationIssue, texto: string) => ({ texto: `${dondeEsta(p, bloques)}: ${texto}`, ir: lugarDelProblemaDeEntrenamiento(p.path).bloque === null ? null : irDesdeElCuadro(p) });
  // Lo que impide activar: lo que el editor ve solo (al instante), lo que dijo la API de lo guardado y, hasta ED-08, la
  // app de la persona (la API todavía la espera).
  const impidenActivar = [
    ...impideGuardar.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')),
    ...(revision?.estado === 'lista' ? revision.problemas.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')) : []),
    ...(bloqueadoPorLaApp ? [{ texto: COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada, ir: null }] : []),
  ];
  // TB-48: lo que queda sin completar no impide nada; se dice aparte, cada cosa con su lugar.
  const sinCompletarAlActivar = confirmar ? loQueQuedaSinCompletarEnEntrenamiento(bloques).map((p) => conSuLugar(p, TEXTO_DE_LO_INCOMPLETO[p.code] ?? 'revisá este elemento')) : [];
  const nombresDeLaVigente = vigente?.plan ? nombresDe(vigente.plan) : {};
  // Frente a la vigente; en la primera versión, frente a nada: todo es «agregado». Sin la vigente leída, nada.
  const baseDeLaComparacion = vigente?.plan ? aEntrada(vigente.plan) : !version.predecessorPlanId ? [] : null;
  const cambiosFrenteALaVigente =
    confirmar && baseDeLaComparacion
      ? compararEntrenamiento(baseDeLaComparacion, bloques, {
          nombreDelEjercicio: (id) => nombres[id] ?? nombresDeLaVigente[id] ?? 'Ejercicio',
          renglon: (p) => ejercicioPlegadoDelEditor(p, 0).resumen,
          ...(vigente?.plan ? { agendas: { vigente: vigente.plan.agenda, borrador: agendaVisible } } : {}),
        })
      : null;
  // Lo que va a ver la persona: cada sesión, con sus días si los tiene, y lo que tiene.
  const loQueVeLaPersona = confirmar
    ? bloques
        .flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)])
        .map((s, n) => {
          const dias = s.sessionId ? (agendaVisible?.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays ?? []) : [];
          return `${dias.length > 0 ? `${COPY_AGENDA_DE_ENTRENAMIENTO.diasDeLaSesion(dias)}: ` : ''}${sesionesDeLaAgenda[n]?.nombre ?? nombreDeLaSesion(s, n)} · ${cuentaDeLaSesion(s)}`;
        })
    : [];

  const elegirBloque = (n: number) => {
    setParaEnfocar(null);
    setInsertandoHabitual(false);
    ir({ bloque: pedidoDeLaPosicion(n), micro: null, sesion: null, ejercicios: null });
  };
  const elegirMicrociclo = (n: number) => {
    setParaEnfocar(null);
    setInsertandoHabitual(false);
    ir({ micro: pedidoDeLaPosicion(n), sesion: null, ejercicios: null });
  };
  const elegirSesion = (n: number) => {
    setParaEnfocar(null);
    ir({ sesion: pedidoDeLaPosicion(n), ejercicios: null });
  };
  const dejarAbiertos = (s: ReadonlySet<number>) => {
    setParaEnfocar(null);
    ir({ ejercicios: pedidoDeEjerciciosDelEditor(s) });
  };

  const delBloque: Lugar = { i, j: null, k: null };
  const delMicrociclo: Lugar = { i, j, k: null };
  const deLaSesion: Lugar = { i, j, k };
  const seCambia = (de: QueTexto, l: Lugar): boolean => texto?.de === de && texto.i === l.i && texto.j === l.j && texto.k === l.k;
  const dejarDeCambiar = () => setTexto(null);

  const agregarBloque = () => {
    const n = bloques.length;
    cambiar((x) => (x.push({ label: `${COPY_ENTRENAMIENTO.bloque} ${n + 1}`, sessions: [] }), x));
    elegirBloque(n);
    // Nace con un nombre de compromiso y con su campo abierto: lo que se escribe lo reemplaza.
    setTexto({ de: 'nombre-del-bloque', i: n, j: null, k: null });
  };
  const quitarBloque = () => {
    cambiar((x) => (x.splice(i, 1), x));
    elegirBloque(Math.max(0, i - 1));
  };
  /** TB-48: también con sesiones sueltas, que pasan a la «Semana 1» con sus identificadores (la agenda no pierde sus días). */
  const organizarPorMicrociclos = () => {
    cambiar((x) => ((x[i] = organizadoEnMicrociclos(x[i]!)), x));
    elegirMicrociclo(0);
    setTexto({ de: 'nombre-del-microciclo', i, j: 0, k: null });
  };
  const agregarMicrociclo = () => {
    const n = bloque?.microcycles?.length ?? 0;
    cambiar((x) => ((x[i]!.microcycles ??= []).push({ label: `Semana ${n + 1}`, purpose: null, sessions: [] }), x));
    elegirMicrociclo(n);
    setTexto({ de: 'nombre-del-microciclo', i, j: n, k: null });
  };
  const quitarMicrociclo = () => {
    if (j === null) return;
    cambiar((x) => (x[i]!.microcycles!.splice(j, 1), x));
    elegirMicrociclo(Math.max(0, j - 1));
  };
  const agregarSesion = () => {
    const n = sesiones.length;
    cambiar((x) => (lasSesiones(x).push(sesionVacia(n + 1)), x));
    elegirSesion(n);
    setTexto({ de: 'nombre-de-la-sesion', i, j, k: n });
  };
  const quitarSesion = () => {
    cambiar((x) => (lasSesiones(x).splice(k, 1), x));
    elegirSesion(Math.max(0, k - 1));
  };
  /** TB-48: la copia de la sesión va justo después, y se la mira con su nombre a la vista para cambiarlo. */
  const duplicarSesion = () => {
    cambiar((x) => (duplicarEn(lasSesiones(x), k, copiaDeLaSesion(lasSesiones(x)[k]!, k)), x));
    elegirSesion(k + 1);
    setTexto({ de: 'nombre-de-la-sesion', i, j, k: k + 1 });
  };
  /** TB-48: mueve la sesión que se mira, con su identificador (la agenda no pierde sus días), y se la sigue mirando. */
  const moverSesion = (hacia: number) => {
    cambiar((x) => (mover(lasSesiones(x), k, hacia), x));
    elegirSesion(hacia);
  };
  /** Una copia de la sesión habitual (sin identificadores: el servidor los asigna al guardar) al final de las sesiones que se miran. */
  const insertarSesion = (h: SesionHabitual) => {
    const n = sesiones.length;
    setNombres((x) => ({ ...x, ...nombresDeHabitual(h) }));
    cambiar((x) => (lasSesiones(x).push(structuredClone(h.structure)), x));
    elegirSesion(n);
    setInsertandoHabitual(false);
    // DL-113: es el resultado de una acción, así que aparece donde se está mirando; el foco vuelve a «Agregar».
    setMensaje({ tipo: 'exito', texto: COPY_HABITUALES.insertadaSesion });
    document.getElementById('agregar-sesion')?.focus();
  };
  const cambiarEjercicio = (l: number, c: Partial<PrescripcionE>) =>
    cambiar((x) => {
      const s = lasSesiones(x)[k]!;
      s.prescriptions[l] = { ...s.prescriptions[l]!, ...c };
      return x;
    });
  const quitarEjercicio = (l: number) => {
    cambiar((x) => (lasSesiones(x)[k]!.prescriptions.splice(l, 1), x));
    // Lo abierto acompaña a su ejercicio: los de más abajo suben un lugar.
    dejarAbiertos(posicionesTrasQuitar(abiertos, l));
  };
  /** TB-48: sube o baja un ejercicio; lo abierto lo acompaña. */
  const moverEjercicio = (l: number, hacia: number) => {
    cambiar((x) => (mover(lasSesiones(x)[k]!.prescriptions, l, hacia), x));
    dejarAbiertos(posicionesTrasMover(abiertos, l, hacia));
  };
  /** TB-48: la copia del ejercicio, con sus series y lo general, justo después y abierta. */
  const duplicarEjercicio = (l: number) => {
    cambiar((x) => (duplicarEn(lasSesiones(x)[k]!.prescriptions, l, copiaDelEjercicio(lasSesiones(x)[k]!.prescriptions[l]!)), x));
    dejarAbiertos(new Set([...posicionesTrasInsertar(abiertos, l + 1), l + 1]));
    // La copia no se lleva el foco: se dice dónde quedó (DL-113).
    setMensaje({ tipo: 'exito', texto: E.duplicado });
  };

  /**
   * Lleva a donde está un problema: elige su bloque, su microciclo y su sesión, abre su ejercicio y deja el foco ahí
   * (en el dato que hay que corregir, en el renglón del ejercicio o en el menú de lo que lo tiene). Si lo que falta es
   * un nombre, abre su campo.
   */
  const irAlProblema = (p: ValidationIssue) => {
    const l = lugarDelProblemaDeEntrenamiento(p.path);
    if (l.bloque === null) return;
    setInsertandoHabitual(false);
    ir({
      bloque: pedidoDeLaPosicion(l.bloque),
      micro: l.microciclo === null ? null : pedidoDeLaPosicion(l.microciclo),
      sesion: l.sesion === null ? null : pedidoDeLaPosicion(l.sesion),
      ejercicios: l.ejercicio === null ? null : pedidoDeEjerciciosDelEditor(new Set([l.ejercicio])),
    });
    if (p.code === N.faltaElNombre) {
      return setTexto({ de: l.sesion !== null ? 'nombre-de-la-sesion' : l.microciclo !== null ? 'nombre-del-microciclo' : 'nombre-del-bloque', i: l.bloque, j: l.microciclo, k: l.sesion });
    }
    if (l.sesion === null) return setParaEnfocar(l.microciclo === null ? 'menu-del-bloque' : 'menu-del-microciclo');
    if (l.ejercicio === null) return setParaEnfocar('menu-de-la-sesion');
    setParaEnfocar(campoDelProblema(p, `b${l.bloque}${l.microciclo === null ? '' : `-m${l.microciclo}`}-s${l.sesion}-p${l.ejercicio}`, l.serie));
  };

  const agregarUnBloque = (
    <button type="button" className="boton boton--quieto boton--compacto" data-agregar-bloque onClick={agregarBloque}>
      <Icono nombre="mas" tamano={18} />
      Agregar<span className="visualmente-oculto"> un bloque</span>
    </button>
  );
  const agregarUnaSesion = (
    <MenuDeAcciones
      id="agregar-sesion"
      rotulo="agregar una sesión"
      texto="Agregar"
      icono="mas"
      conFlecha
      alineado="izquierda"
      acciones={[
        { clave: 'nueva', texto: 'Una sesión nueva', alElegir: agregarSesion },
        {
          clave: 'habitual',
          texto: 'Una sesión habitual',
          alElegir: () => setInsertandoHabitual(true),
          // Mientras se leen, o si no se pudieron leer, no se dice «todavía no guardaste» (bloque 5).
          noSePuede:
            sesionesHabituales.sesiones.length > 0
              ? null
              : sesionesHabituales.lectura === 'cargando'
                ? 'Leyendo tus sesiones habituales…'
                : sesionesHabituales.lectura === 'falla'
                  ? COPY_HABITUALES.sesionesNoSeLeyeron
                  : COPY_HABITUALES.sinSesiones,
        },
        // Si la lectura falló, se vuelve a pedir desde el mismo menú; si quedaron algunas leídas, lo dice su línea.
        ...(sesionesHabituales.lectura === 'falla'
          ? [
              {
                clave: 'releer',
                texto: COPY_HABITUALES.volverALeerSesiones,
                detalle: sesionesHabituales.sesiones.length > 0 ? COPY_HABITUALES.algunasSesionesNoSeLeyeron : null,
                alElegir: () => void sesionesHabituales.recargar(),
              },
            ]
          : []),
      ]}
    />
  );
  // «Fuerza: progresión · Semana 1 · A · Tren inferior»: el cajón tapa la sesión, y lo dice arriba.
  const dondeSeAgrega =
    bloque && sesion ? [nombreDelBloque(bloque, i), ...(microciclo && j !== null ? [nombreDelMicrociclo(microciclo, j)] : []), nombreDeLaSesion(sesion, k)].join(' · ') : null;

  return (
    <section className="seccion editor-del-plan editor-de-entrenamiento" aria-labelledby="titulo-borrador">
      <div className="editor-del-plan__cabecera">
        <h2 id="titulo-borrador">
          Versión en preparación{' '}
          <span className="etiqueta-de-dato">
            <Icono nombre="borrador" tamano={15} />
            {COPY_ENTRENAMIENTO.borrador}
          </span>
        </h2>
        <div className="editor-del-plan__acciones">
          <EstadoDeGuardado
            className="editor-del-plan__estado"
            guardando={guardando}
            sucio={sucio}
            puedeGuardar={puedeGuardar}
            fallo={fallo}
            conflicto={conflicto}
            guardadoA={guardadoA}
            detalle={detalle}
            onReintentar={() => void guardar()}
          />
          {/* ED-03 (DJ-6): «Guardar ahora», fijo y secundario junto al estado: guarda sin esperar la pausa. Apagado (con
              `aria-disabled`, que conserva el foco), dice por qué. */}
          <button
            type="button"
            className="boton boton--secundario"
            data-guardar-ahora
            aria-disabled={sinGuardarAhora ? true : undefined}
            aria-describedby={sinGuardarAhora ? 'motivo-sin-guardar-ahora' : undefined}
            onClick={() => {
              if (!sinGuardarAhora) void guardar();
            }}
          >
            <Icono nombre="guardar" tamano={18} />
            {COPY_GUARDADO.guardarAhora}
          </button>
          {sinGuardarAhora ? (
            <span id="motivo-sin-guardar-ahora" className="visualmente-oculto">
              {sinGuardarAhora}
            </span>
          ) : null}
          {/* TB-48: «Guardar como plantilla», con su texto y a la vista (antes, sola en un menú «⋯» sin texto). Si no se
              puede, está apagado (con `aria-disabled`, que conserva el foco) y dice por qué, al lector y al tocarlo. */}
          <button
            type="button"
            className="boton boton--quieto"
            data-guardar-como-plantilla
            aria-disabled={antesHayQueCorregir ? true : undefined}
            aria-describedby={antesHayQueCorregir ? 'motivo-sin-plantilla' : undefined}
            onClick={() => (antesHayQueCorregir ? setMensaje({ tipo: 'info', texto: antesHayQueCorregir }) : setGuardarPlantilla(true))}
          >
            <Icono nombre="plantillas" tamano={18} />
            {COPY_PLANTILLAS.guardarComoPlantilla}
          </button>
          {antesHayQueCorregir ? (
            <span id="motivo-sin-plantilla" className="visualmente-oculto">
              {antesHayQueCorregir}
            </span>
          ) : null}
          {/* ED-07 (DJ-6): «Revisar y activar…», la única entrada a activar, fija y llena (el único botón lleno de la
              barra). Abre «Antes de activar» siempre, también con algo por corregir o sin guardar, y no cambia de nombre
              ni de lugar mientras se escribe. */}
          <button type="button" className="boton boton--primario" data-revisar-y-activar onClick={abrirAntesDeActivar}>
            <Icono nombre="activar" tamano={18} />
            {COPY_ANTES_DE_ACTIVAR.revisarYActivar}
          </button>
          {/* ED-01: el «⋯» de la versión, con «Descartar la versión en preparación». La vigente nunca lo ofrece. */}
          {ofreceDescartar(version) ? (
            <MenuDeAcciones
              id="mas-de-la-version"
              rotulo={COPY_DESCARTAR_LA_VERSION.menu}
              acciones={[
                {
                  clave: 'descartar',
                  texto: COPY_DESCARTAR_LA_VERSION.accion,
                  alElegir: () => {
                    setFalloDelDescarte(null);
                    setDescartar(true);
                  },
                },
              ]}
            />
          ) : null}
        </div>
      </div>
      <p className="nota editor-del-plan__que-es">
        El asesorado no ve esta versión, y guardar no la activa{version.predecessorPlanId ? ': la versión activa no cambia hasta que actives esta' : ''}.
      </p>
      {conflicto ? (
        <Aviso tipo="error" enfocar>
          <p>{COPY_GUARDADO.conflicto}</p>
          <p className="nota">{COPY_GUARDADO.cargarGuardadaAclaracion}</p>
          <button type="button" className="boton boton--secundario" onClick={() => void cargar()}>
            {COPY_GUARDADO.cargarGuardada}
          </button>
        </Aviso>
      ) : null}
      {version.templateOrigin ? <NotaDeOrigen token={token} origen={version.templateOrigin} /> : null}
      {bloqueadoPorLaApp ? (
        <Aviso tipo="info">
          <div id="motivo-sin-activar">
            <p>
              <strong>{COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueadaTitulo}</strong>
            </p>
            <p>{COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada}</p>
            <p>{COPY_COMPATIBILIDAD_DE_CLIENTES.queHacer}</p>
          </div>
        </Aviso>
      ) : exigeObjetivosPorSerie ? (
        <p className="nota editor-del-plan__que-es" data-listo-para-activar>
          {COPY_COMPATIBILIDAD_DE_CLIENTES.listoParaActivar}
        </p>
      ) : null}
      {objetivoVigente && objetivoVigente !== version.objectiveVersionId ? (
        <Aviso tipo="info">
          <p>Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.</p>
        </Aviso>
      ) : null}

      {mensaje && mensaje.tipo === 'exito' ? (
        <AvisoFlotante onCerrar={() => setMensaje(null)}>
          <p>{mensaje.texto}</p>
        </AvisoFlotante>
      ) : null}
      {mensaje && mensaje.tipo !== 'exito' ? (
        <Aviso tipo={mensaje.tipo} enfocar={(mensaje.tipo !== 'info' || !!mensaje.deValidar) && !mensaje.sinFoco}>
          <p>{mensaje.texto}</p>
          {problemas && problemas.length > 0 ? (
            <ul className="problemas-del-plan">
              {problemas.map((p, n) => (
                <li key={n}>
                  {/* Cada problema lleva a su lugar: con una sesión por vez y los ejercicios plegados, no hay que ir a buscarlo. */}
                  {lugarDelProblemaDeEntrenamiento(p.path).bloque === null ? (
                    <>
                      {dondeEsta(p, bloques)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                    </>
                  ) : (
                    <button type="button" className="boton boton--enlace" data-problema onClick={() => irAlProblema(p)}>
                      {ubicacionDelProblemaDeEntrenamiento(p.path, bloques)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {mensaje.deValidar ? <p className="nota">{COPY_ENTRENAMIENTO.noJuzga}</p> : null}
        </Aviso>
      ) : null}

      <AgendaDelPlan
        agenda={agendaVisible}
        sesiones={sesionesDeLaAgenda}
        hoy={hoyEn()}
        abierta={agendaAbierta}
        onAbrir={() => setAgendaAbierta(true)}
        onCerrar={() => setAgendaAbierta(false)}
        onCambiar={cambiarAgenda}
      />

      <div className="plan__niveles niveles-del-editor">
        {bloque ? (
          <SelectorDeNivel nivel="bloque" rotulo={C.bloque} opciones={paraElegir(bloques.map(nombreDelBloque))} elegido={{ order: i + 1, label: nombreDelBloque(bloque, i) }} onElegir={(o) => elegirBloque(o - 1)}>
            {agregarUnBloque}
            <MenuDeAcciones
              id="menu-del-bloque"
              rotulo={`más acciones del bloque ${nombreDelBloque(bloque, i)}`}
              alineado="izquierda"
              acciones={[
                { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => setTexto({ de: 'nombre-del-bloque', ...delBloque }) },
                // Un bloque organiza sus sesiones bajo microciclos o directamente, nunca las dos cosas (09v10:281-283).
                ...(mira.conMicrociclos
                  ? []
                  : [
                      {
                        clave: 'microciclos',
                        texto: 'Organizar por microciclos',
                        alElegir: organizarPorMicrociclos,
                        // TB-48: se ofrece siempre; si el bloque ya tiene sesiones, dice adónde van.
                        detalle: loQuePasaConLasSesiones(sesiones.length),
                        noSePuede: sesiones.length > TOPES_DE_ENTRENAMIENTO.sesionesDelMicrociclo ? E.topeDelMicrociclo(TOPES_DE_ENTRENAMIENTO.sesionesDelMicrociclo, sesiones.length) : null,
                      },
                    ]),
                { clave: 'quitar', texto: 'Quitar este bloque', alElegir: quitarBloque, noSePuede: bloques.length <= 1 ? 'Es el único bloque de la versión.' : null },
              ]}
            />
            <span className="nota nivel-del-plan__detalle" data-sesiones-del-bloque>
              <EnPartes texto={sesionesDelBloque(bloque)} />
            </span>
            <TextoAPedido
              id={`b${i}-proposito`}
              rotulo={C.proposito}
              queEs="un propósito"
              valor={bloque.purpose ?? null}
              maximo={1000}
              abierto={seCambia('proposito-del-bloque', delBloque)}
              alAbrir={() => setTexto({ de: 'proposito-del-bloque', ...delBloque })}
              alCambiar={(v) => cambiar((x) => ((x[i]!.purpose = v), x))}
              alCerrar={dejarDeCambiar}
            />
          </SelectorDeNivel>
        ) : (
          <div className="nivel-del-plan" data-nivel="bloque" data-forma="ninguno">
            <p className="nota">{C.sinBloques}</p>
            {agregarUnBloque}
          </div>
        )}
        {bloque && (seCambia('nombre-del-bloque', delBloque) || bloque.label.trim() === '') ? (
          <CampoDeNombre
            id={`b${i}-nombre`}
            etiqueta="Nombre del bloque"
            valor={bloque.label}
            maximo={120}
            enfocar={seCambia('nombre-del-bloque', delBloque)}
            despues="menu-del-bloque"
            alEmpezar={() => setTexto({ de: 'nombre-del-bloque', ...delBloque })}
            alCambiar={(v) => cambiar((x) => ((x[i]!.label = v), x))}
            alTerminar={dejarDeCambiar}
          />
        ) : null}

        {bloque && microciclo && j !== null ? (
          <SelectorDeNivel
            nivel="microciclo"
            rotulo={C.microciclo}
            opciones={paraElegir((bloque.microcycles ?? []).map(nombreDelMicrociclo))}
            elegido={{ order: j + 1, label: nombreDelMicrociclo(microciclo, j) }}
            onElegir={(o) => elegirMicrociclo(o - 1)}
          >
            <button type="button" className="boton boton--quieto boton--compacto" data-agregar-microciclo onClick={agregarMicrociclo}>
              <Icono nombre="mas" tamano={18} />
              Agregar<span className="visualmente-oculto"> un microciclo</span>
            </button>
            <MenuDeAcciones
              id="menu-del-microciclo"
              rotulo={`más acciones del microciclo ${nombreDelMicrociclo(microciclo, j)}`}
              alineado="izquierda"
              acciones={[
                { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => setTexto({ de: 'nombre-del-microciclo', ...delMicrociclo }) },
                { clave: 'quitar', texto: 'Quitar este microciclo', alElegir: quitarMicrociclo },
              ]}
            />
            <TextoAPedido
              id={`${prefijo}-proposito`}
              rotulo={C.proposito}
              queEs="un propósito"
              valor={microciclo.purpose ?? null}
              maximo={1000}
              abierto={seCambia('proposito-del-microciclo', delMicrociclo)}
              alAbrir={() => setTexto({ de: 'proposito-del-microciclo', ...delMicrociclo })}
              alCambiar={(v) => cambiar((x) => ((x[i]!.microcycles![j]!.purpose = v), x))}
              alCerrar={dejarDeCambiar}
            />
          </SelectorDeNivel>
        ) : null}
        {microciclo && j !== null && (seCambia('nombre-del-microciclo', delMicrociclo) || microciclo.label.trim() === '') ? (
          <CampoDeNombre
            id={`${prefijo}-nombre`}
            etiqueta="Nombre del microciclo"
            valor={microciclo.label}
            maximo={120}
            enfocar={seCambia('nombre-del-microciclo', delMicrociclo)}
            despues="menu-del-microciclo"
            alEmpezar={() => setTexto({ de: 'nombre-del-microciclo', ...delMicrociclo })}
            alCambiar={(v) => cambiar((x) => ((x[i]!.microcycles![j]!.label = v), x))}
            alTerminar={dejarDeCambiar}
          />
        ) : null}

        {bloque && sesion ? (
          <SelectorDeNivel nivel="sesion" rotulo={C.sesion} opciones={paraElegir(sesiones.map(nombreDeLaSesion))} elegido={{ order: k + 1, label: nombreDeLaSesion(sesion, k) }} onElegir={(o) => elegirSesion(o - 1)}>
            {agregarUnaSesion}
            <MenuDeAcciones
              id="menu-de-la-sesion"
              rotulo={`más acciones de la sesión ${nombreDeLaSesion(sesion, k)}`}
              alineado="izquierda"
              acciones={[
                { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => setTexto({ de: 'nombre-de-la-sesion', ...deLaSesion }) },
                // TB-48: duplicar y mover la sesión que se mira.
                { clave: 'duplicar', texto: E.duplicarSesion, alElegir: duplicarSesion },
                { clave: 'antes', texto: E.moverAntes, alElegir: () => moverSesion(k - 1), noSePuede: k === 0 ? E.yaEsElPrimero : null },
                { clave: 'despues', texto: E.moverDespues, alElegir: () => moverSesion(k + 1), noSePuede: k === sesiones.length - 1 ? E.yaEsElUltimo : null },
                { clave: 'habitual', texto: COPY_HABITUALES.guardarComoHabitual, alElegir: () => setSesionHabitual(structuredClone(sesion)), noSePuede: antesHayQueCorregir },
                { clave: 'quitar', texto: 'Quitar esta sesión', alElegir: quitarSesion },
              ]}
            />
            {/* Con agenda, los días de esta sesión (DL-137); sin agenda, con más de una sesión, la persona elige cuál hace. */}
            {agendaVisible ? (
              <span className="nota nivel-del-plan__detalle" data-dias-de-la-sesion>
                {diasDeEstaSesion.length > 0 ? COPY_AGENDA_DE_ENTRENAMIENTO.diasDeLaSesion(diasDeEstaSesion) : COPY_AGENDA_DE_ENTRENAMIENTO.sinDias}
              </span>
            ) : sesiones.length > 1 ? (
              <span className="nota nivel-del-plan__detalle">{C.sinDiaAsignado}</span>
            ) : null}
            <span className="nota nivel-del-plan__cuenta" data-cuenta-de-la-sesion>
              <EnPartes texto={cuentaDeLaSesion(sesion)} />
            </span>
          </SelectorDeNivel>
        ) : bloque ? (
          <div className="nivel-del-plan" data-nivel="sesion" data-forma="ninguna">
            <span className="nivel-del-plan__rotulo">{C.sesion}</span>
            <span className="nota">{C.sinSesiones}</span>
            {agregarUnaSesion}
          </div>
        ) : null}
        {sesion && (seCambia('nombre-de-la-sesion', deLaSesion) || sesion.label.trim() === '') ? (
          <CampoDeNombre
            id={`${prefijo}-s${k}-nombre`}
            etiqueta="Nombre de la sesión"
            valor={sesion.label}
            maximo={120}
            enfocar={seCambia('nombre-de-la-sesion', deLaSesion)}
            despues="menu-de-la-sesion"
            alEmpezar={() => setTexto({ de: 'nombre-de-la-sesion', ...deLaSesion })}
            alCambiar={(v) => cambiar((x) => ((lasSesiones(x)[k]!.label = v), x))}
            alTerminar={dejarDeCambiar}
          />
        ) : null}
        {insertandoHabitual ? (
          <div
            className="sesion-habitual-a-pedido"
            data-habituales="sesiones"
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return;
              e.stopPropagation();
              setInsertandoHabitual(false);
              document.getElementById('agregar-sesion')?.focus();
            }}
          >
            <InsertarSesionHabitual id={prefijo} sesiones={sesionesHabituales.sesiones} onInsertar={insertarSesion} />
            <button
              type="button"
              className="boton boton--enlace"
              onClick={() => {
                setInsertandoHabitual(false);
                document.getElementById('agregar-sesion')?.focus();
              }}
            >
              {COPY_HABITUALES.cancelar}
            </button>
          </div>
        ) : null}
        {sesion ? (
          <TextoAPedido
            id={`${prefijo}-s${k}-indicaciones`}
            rotulo={COPY_ENTRENAMIENTO.indicacionesDeLaSesion}
            queEs="indicaciones de la sesión"
            valor={sesion.instructions ?? null}
            maximo={2000}
            renglones={2}
            abierto={seCambia('indicaciones', deLaSesion)}
            alAbrir={() => setTexto({ de: 'indicaciones', ...deLaSesion })}
            alCambiar={(v) => cambiar((x) => ((lasSesiones(x)[k]!.instructions = v), x))}
            alCerrar={dejarDeCambiar}
          />
        ) : null}
      </div>

      {sesion ? (
        <div className="comidas-del-plan ejercicios-del-editor" data-sesion={k + 1}>
          {sesion.prescriptions.length === 0 ? <p className="nota">{C.sinEjercicios}</p> : null}
          {sesion.prescriptions.map((p, l) => (
            <EjercicioDelEditor
              key={p.prescriptionId ?? `nuevo-${l}`}
              id={`${prefijo}-s${k}-p${l}`}
              posicion={l}
              prescripcion={p}
              nombre={nombres[p.exerciseVersionId] ?? 'Ejercicio'}
              imagen={imagenes[p.exerciseVersionId] ?? null}
              abierto={abiertos.has(l)}
              problemas={problemasDelEjercicio(rutasConProblemas, { bloque: i, microciclo: j, sesion: k, ejercicio: l })}
              alAlternar={() => {
                const s = new Set(abiertos);
                if (!s.delete(l)) s.add(l);
                dejarAbiertos(s);
              }}
              onCambiar={(c) => cambiarEjercicio(l, c)}
              onQuitar={() => quitarEjercicio(l)}
              esElPrimero={l === 0}
              esElUltimo={l === sesion.prescriptions.length - 1}
              onSubir={() => moverEjercicio(l, l - 1)}
              onBajar={() => moverEjercicio(l, l + 1)}
              onDuplicar={() => duplicarEjercicio(l)}
            />
          ))}
          <div className="editor-del-plan__al-pie">
            <button type="button" className="boton boton--quieto" data-agregar-ejercicio onClick={() => setAgregando(true)}>
              <Icono nombre="mas" tamano={18} />
              {COPY_ENTRENAMIENTO.agregarEjercicio}
            </button>
            <span className="nota">Del catálogo BE, de tus habituales o creado a mano.</span>
          </div>
        </div>
      ) : null}

      <DialogoGuardarPlantilla
        token={token}
        abierto={guardarPlantilla}
        estructura={{ blocks: bloques }}
        origen={null}
        onCerrar={() => setGuardarPlantilla(false)}
        onGuardada={() => {
          setGuardarPlantilla(false);
          setMensaje({ tipo: 'exito', texto: COPY_PLANTILLAS.guardada });
        }}
      />
      <DialogoGuardarSesionHabitual
        token={token}
        abierto={sesionHabitual !== null}
        sesion={sesionHabitual}
        existentes={sesionesHabituales.sesiones}
        onCerrar={() => setSesionHabitual(null)}
        onGuardada={() => {
          setSesionHabitual(null);
          setMensaje({ tipo: 'exito', texto: COPY_HABITUALES.guardadaSesion });
          void sesionesHabituales.recargar();
        }}
      />

      <AgregarEjercicio
        abierto={agregando && !!sesion}
        deDonde={dondeSeAgrega}
        habituales={ejerciciosHabituales}
        onElegir={(e) => {
          setNombres((n) => ({ ...n, [e.versionId]: e.name }));
          // El ejercicio nace con una serie, sin repeticiones ni criterio: se completan en la sesión.
          cambiar((x) => (lasSesiones(x)[k]!.prescriptions.push({ exerciseVersionId: e.versionId, sets: [{ repetitions: null }], intensity: null }), x));
        }}
        onCerrar={() => setAgregando(false)}
      />

      <AntesDeActivar
        abierto={confirmar}
        area="Entrenamiento"
        numero={numero}
        vigente={vigente?.numero ?? null}
        primera={!version.predecessorPlanId}
        impiden={impidenActivar}
        sinCompletar={sinCompletarAlActivar}
        revisando={revision?.estado === 'revisando'}
        sinRevisar={revision?.estado === 'fallo'}
        onVolverARevisar={() => void revisar(version)}
        sinGuardar={sucio}
        guardando={guardando}
        onGuardarAhora={() => void guardar()}
        cambios={cambiosFrenteALaVigente}
        loQueVe={loQueVeLaPersona}
        eligioCuando={fechaQueResulta(cuando, hoyEn()) !== undefined}
        activando={activando}
        error={falloDeActivacion}
        onActivar={() => void activar()}
        onVolver={cerrarAntesDeActivar}
        cuando={
          <CuandoLaRevisas
            id="trn-proxima-revision"
            hoy={hoyEn()}
            momento="ACTIVAR"
            conSinFecha
            primerPlan={!vigente}
            eleccion={cuando}
            alElegir={(e) => {
              setCuando(e);
              setProximaRevision(fechaQueResulta(e, hoyEn()) ?? '');
            }}
            aviso={loQueFalta(cuando, hoyEn())}
          />
        }
      />

      <CuadroDelDescarte
        abierto={descartar}
        numero={numero}
        vigente={vigente ? { numero: vigente.numero, desde: diaSinElAnioEnCurso(vigente.desde) } : null}
        sinGuardar={sucio}
        enviando={descartando}
        error={falloDelDescarte}
        onCancelar={() => {
          // La clave no se descarta: si el último intento quedó incierto, el próximo la reusa (`registrar` la libera
          // después de una respuesta definitiva).
          setDescartar(false);
          setFalloDelDescarte(null);
        }}
        onDescartar={() => void descartarLaVersion()}
      />
    </section>
  );
}
