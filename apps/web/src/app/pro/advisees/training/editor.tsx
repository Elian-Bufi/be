'use client';

/**
 * La versión en preparación del plan de entrenamiento (B10-06 §8-§23): Bloque → Microciclo opcional → Sesión → Ejercicio.
 * - Un plan sin microciclos es natural: las sesiones cuelgan del bloque. Con microciclos, van bajo ellos. Nunca se
 *   fuerza un microciclo vacío (B10-06:275-281).
 * - El propósito del bloque o del microciclo es texto libre: sin «Acumulación / Intensificación / Descarga» como
 *   únicos tipos (B10-06:332-342).
 * - Validar informa los problemas vinculados a bloque → sesión → ejercicio, sin «Programa óptimo» (B10-06:563-591).
 * - «Guardar cambios» no activa. Activar pide confirmación con la consecuencia literal de B10-06:607.
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
 * - **«Activar plan» guarda antes, si hace falta,** y recién entonces pregunta. El diálogo dice qué entra y qué queda, y
 *   ahí se fija la próxima revisión, que es parte de ese acto. Si el asesorado todavía no usó una app que muestre los
 *   objetivos por serie y el plan los tiene, «Activar plan» está apagado y dice por qué (precierre del 2026-10-06, §2).
 * - **Cada problema lleva a su lugar:** elige el bloque, el microciclo y la sesión, abre el ejercicio y deja el foco ahí.
 */
import {
  COPY,
  COPY_COMPATIBILIDAD_DE_CLIENTES,
  COPY_DE_ACTIVAR_EL_PLAN,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  COPY_HABITUALES,
  COPY_PLANTILLAS,
  PROBLEMA_DEL_EDITOR_DE_ENTRENAMIENTO as N,
  avisoDeLoQueNoDejaGuardarElEntrenamiento,
  cuentaDeLaSesion,
  ejerciciosAbiertosEnElEditor,
  estructuraConObjetivosComoEntrada,
  loQueEntraAlActivarElEntrenamiento,
  loQueNoDejaGuardarElEntrenamiento,
  loQueSeMiraEnElEditor,
  lugarDelProblemaDeEntrenamiento,
  pedidoDeEjerciciosDelEditor,
  pedidoDeLaPosicion,
  planExigeObjetivosPorSerie,
  problemasDelEjercicio,
  sesionesDelBloque,
  ubicacionDelProblemaDeEntrenamiento,
  type ImagenDeEjercicio,
  type PlanConObjetivos,
  type SesionHabitual,
  type ValidationIssue,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { EnPartes } from '../../../../components/en-partes';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { TextoAPedido } from '../../../../components/texto-a-pedido';
import { api } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { AgregarEjercicio } from './agregar-ejercicio';
import { EjercicioDelEditor, type BloqueE, type Bloques, type PrescripcionE, type SesionE } from './ejercicio-del-editor';
import { NoDisponible, useEntrenamiento } from './entrenamiento';
import { SelectorDeNivel } from './estructura-del-plan';
import { DialogoGuardarSesionHabitual, InsertarSesionHabitual, nombresDeHabitual, useEjerciciosHabituales, useSesionesHabituales } from './habituales';
import { DialogoGuardarPlantilla, NotaDeOrigen } from './plantillas';

type MicrocicloE = NonNullable<BloqueE['microcycles']>[number];

/** La jerarquía de API-SER-01 como entrada del PATCH, con los tres estados de cada serie (en el dominio, para que las pruebas editen igual). */
const aEntrada = (v: PlanConObjetivos): Bloques => estructuraConObjetivosComoEntrada(v);

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
};

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
  objetivoVigente,
  vigente = null,
  onActivado,
}: {
  planId: string;
  /** El objetivo vigente hoy, que ya leyó la sección: si es más nuevo que el de la versión, al guardar pasa a usarlo. */
  objetivoVigente: string | null;
  /** La versión que rige hoy, que al activar esta queda en el historial; `null` si es la primera. */
  vigente?: { readonly numero: number; readonly desde: string } | null;
  onActivado: () => void;
}) {
  const { token, sesionPerdida, accesoRetirado, parametros, ir } = useEntrenamiento();
  const [version, setVersion] = useState<PlanConObjetivos | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [bloques, setBloques] = useState<Bloques>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [imagenes, setImagenes] = useState<Record<string, ImagenDeEjercicio | null>>({});
  const [proximaRevision, setProximaRevision] = useState('');
  const [sucio, setSucio] = useState(false);
  useCambiosSinGuardar(sucio, 'el plan en preparación');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string; deValidar?: boolean } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  // «Guardar como plantilla» sobre el borrador tal como está en pantalla (PF-09; DL-108); sin origen: no es una versión activada.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();
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
    setSucio(false);
  }, [token, planId, sesionPerdida]);

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

  /** Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. */
  async function guardar(): Promise<PlanConObjetivos | null> {
    if (!version) return null;
    // Un nombre vacío o un dato que no se entiende pueden estar en otro bloque, en otra sesión o en un ejercicio
    // plegado: se listan, y cada uno lleva a su lugar. Nada de eso viaja: un dato mal escrito se guardaría como «nada».
    const impide = loQueNoDejaGuardarElEntrenamiento(bloques);
    if (impide.length > 0) {
      setProblemas(impide);
      setMensaje({ tipo: 'error', texto: avisoDeLoQueNoDejaGuardarElEntrenamiento(impide) });
      return null;
    }
    setGuardando(true);
    setMensaje(null);
    const actualizarObjetivo = objetivoVigente && objetivoVigente !== version.objectiveVersionId ? { objectiveVersionId: objetivoVigente } : {};
    const r = await api.editarPlanDeEntrenamiento(token, planId, { expectedVersion: version.version, changes: { blocks: bloques }, nextReviewAt: proximaRevision || null, ...actualizarObjetivo });
    if (sesionPerdida(r) || accesoRetirado(r)) {
      setGuardando(false);
      return null;
    }
    if (!r.ok) {
      setGuardando(false);
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    // La respuesta de API-TRN-10 tiene la forma que lee la APK instalada, sin los objetivos por serie: el borrador se
    // vuelve a leer con API-SER-01. Si esa lectura falla, lo guardado es lo que se mandó y solo cambia el token.
    const detalle = await api.planConObjetivos(token, planId);
    setGuardando(false);
    if (sesionPerdida(detalle)) return null;
    const guardada: PlanConObjetivos = detalle.ok ? detalle.datos.data : { ...version, version: r.datos.data.version, nextReviewAt: r.datos.data.nextReviewAt, objectiveVersionId: r.datos.data.objectiveVersionId };
    setVersion(guardada);
    if (detalle.ok) {
      setBloques(aEntrada(detalle.datos.data));
      setNombres((n) => ({ ...n, ...nombresDe(detalle.datos.data) }));
      setImagenes((x) => ({ ...x, ...imagenesDe(detalle.datos.data) }));
    }
    setSucio(false);
    return guardada;
  }

  async function validar() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    const r = await api.validarPlanDeEntrenamiento(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: mensajeDeFallo(r) });
    setProblemas(r.datos.data.issues);
    // Validar revisa la forma, no la calidad del programa: se dice junto al resultado (B10-06:563-591).
    setMensaje(r.datos.data.valid ? { tipo: 'exito', texto: `${COPY_ENTRENAMIENTO.sinProblemas} ${COPY_ENTRENAMIENTO.noJuzga}` } : { tipo: 'error', texto: COPY_ENTRENAMIENTO.hayElementosPorCorregir, deValidar: true });
  }

  /** «Activar plan»: con cambios, guarda antes; si no se puede guardar, no pregunta nada (el motivo queda a la vista). */
  async function abrirLaActivacion() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    setFalloDeActivacion(null);
    setConfirmar(true);
  }

  async function activar() {
    if (!version) return;
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

  if (error === 'no-disponible') return <NoDisponible />;
  if (error === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (!version) return <Cargando />;

  // Precierre del 2026-10-06, §2: las APK instaladas muestran solo los objetivos generales. Si el plan escrito tiene
  // objetivos distintos por serie (la misma regla que aplica la API) y el asesorado todavía no usó una app que los
  // muestre (API-SER-01), no se puede activar: se dice por qué, y la API lo rechaza igual (409 CLIENT_CAPABILITY_REQUIRED).
  const exigeObjetivosPorSerie = planExigeObjetivosPorSerie({ blocks: bloques });
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
  // El prefijo de los identificadores de lo que cuelga del bloque o del microciclo: `b0`, `b0-m1`.
  const prefijo = `b${i}${j !== null ? `-m${j}` : ''}`;
  const abiertos = ejerciciosAbiertosEnElEditor(sesion?.prescriptions.length ?? 0, parametros.get('ejercicios'));
  /** La lista de sesiones que se edita —las del microciclo o las del bloque—, dentro de una copia de la estructura. */
  const lasSesiones = (x: Bloques): SesionE[] => (j !== null ? x[i]!.microcycles![j]!.sessions : (x[i]!.sessions ??= []));
  // Lo que el editor ve solo ya lo dice cada ejercicio con sus palabras: al renglón van los problemas de «Validar».
  const rutasConProblemas = (problemas ?? []).filter((p) => !esDelEditor(p.code)).map((p) => p.path);
  const impideGuardar = loQueNoDejaGuardarElEntrenamiento(bloques);
  const antesHayQueCorregir = impideGuardar.length > 0 ? 'Antes hay que corregir lo que no deja guardar esta versión.' : null;

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
  const organizarPorMicrociclos = () => {
    cambiar((x) => ((x[i]!.microcycles = [{ label: 'Semana 1', purpose: null, sessions: [] }]), x));
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
  /** Una copia de la sesión habitual (sin identificadores: el servidor los asigna al guardar) al final de las sesiones que se miran. */
  const insertarSesion = (h: SesionHabitual) => {
    const n = sesiones.length;
    setNombres((x) => ({ ...x, ...nombresDeHabitual(h) }));
    cambiar((x) => (lasSesiones(x).push(structuredClone(h.structure)), x));
    elegirSesion(n);
    setInsertandoHabitual(false);
    // DL-113: es el resultado de una acción, así que aparece donde se está mirando.
    setMensaje({ tipo: 'exito', texto: COPY_HABITUALES.insertadaSesion });
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
    dejarAbiertos(new Set([...abiertos].filter((p) => p !== l).map((p) => (p > l ? p - 1 : p))));
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
          noSePuede: sesionesHabituales.sesiones.length === 0 ? 'Todavía no guardaste ninguna sesión como habitual.' : null,
        },
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
          <p className="editor-del-plan__estado" aria-live="polite" data-estado={guardando ? 'guardando' : sucio ? 'sin-guardar' : 'guardado'}>
            {guardando ? COPY_ENTRENAMIENTO.guardando : sucio ? COPY_ENTRENAMIENTO.cambiosSinGuardar : COPY_ENTRENAMIENTO.guardado}
          </p>
          <MenuDeAcciones
            rotulo="Más acciones de esta versión"
            acciones={[{ clave: 'plantilla', texto: COPY_PLANTILLAS.guardarComoPlantilla, alElegir: () => setGuardarPlantilla(true), noSePuede: antesHayQueCorregir }]}
          />
          {/* Los tres se apagan con `aria-disabled`, no con `disabled`: un botón deshabilitado pierde el foco, y quien
              guarda con el teclado quedaría fuera de lugar (y «Volver», en el diálogo, no tendría a dónde volver). */}
          <button
            type="button"
            className="boton boton--quieto"
            aria-disabled={guardando || undefined}
            onClick={() => {
              if (!guardando) void validar();
            }}
          >
            {COPY_ENTRENAMIENTO.validarPlan}
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            aria-disabled={guardando || bloqueadoPorLaApp || undefined}
            aria-describedby={bloqueadoPorLaApp ? 'motivo-sin-activar' : undefined}
            onClick={() => {
              if (!guardando && !bloqueadoPorLaApp) void abrirLaActivacion();
            }}
          >
            <Icono nombre="activar" tamano={18} />
            {COPY_ENTRENAMIENTO.activarPlan}
          </button>
          <button
            type="button"
            className="boton boton--primario"
            aria-disabled={guardando || !sucio || undefined}
            onClick={() => {
              if (!guardando && sucio) void guardar();
            }}
          >
            {COPY_ENTRENAMIENTO.guardarCambios}
          </button>
        </div>
      </div>
      <p className="nota editor-del-plan__que-es">
        El asesorado no ve esta versión, y guardar no la activa{version.predecessorPlanId ? ': la versión activa no cambia hasta que actives esta' : ''}.
      </p>
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
        <Aviso tipo={mensaje.tipo} enfocar={mensaje.tipo !== 'info'}>
          <p>{mensaje.texto}</p>
          {problemas && problemas.length > 0 ? (
            <ul className="problemas-del-plan">
              {problemas.map((p, n) => (
                <li key={n}>
                  {/* Cada problema lleva a su lugar: con una sesión por vez y los ejercicios plegados, no hay que ir a buscarlo. */}
                  {lugarDelProblemaDeEntrenamiento(p.path).bloque === null ? (
                    <>
                      {ubicacionDelProblemaDeEntrenamiento(p.path, bloques)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
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
                        noSePuede: sesiones.length > 0 ? 'Solo mientras el bloque no tiene sesiones: con microciclos, las sesiones van dentro de ellos.' : null,
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
                { clave: 'habitual', texto: COPY_HABITUALES.guardarComoHabitual, alElegir: () => setSesionHabitual(structuredClone(sesion)), noSePuede: antesHayQueCorregir },
                { clave: 'quitar', texto: 'Quitar esta sesión', alElegir: quitarSesion },
              ]}
            />
            {/* El plan no asigna días: con más de una sesión, la persona elige cuál hace. */}
            {sesiones.length > 1 ? <span className="nota nivel-del-plan__detalle">{C.sinDiaAsignado}</span> : null}
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
          <div className="sesion-habitual-a-pedido" data-habituales="sesiones">
            <InsertarSesionHabitual id={prefijo} sesiones={sesionesHabituales.sesiones} onInsertar={insertarSesion} />
            <button type="button" className="boton boton--enlace" onClick={() => setInsertandoHabitual(false)}>
              Cancelar
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

      <DialogoDeConfirmacion
        abierto={confirmar}
        titulo={COPY_ENTRENAMIENTO.activarPlan}
        textoVolver={COPY_DE_ACTIVAR_EL_PLAN.volver}
        textoConfirmar={COPY_DE_ACTIVAR_EL_PLAN.activarEstaVersion}
        textoEnviando={COPY_DE_ACTIVAR_EL_PLAN.activando}
        enviando={activando}
        error={falloDeActivacion}
        focoEnVolver
        onVolver={() => {
          setConfirmar(false);
          setFalloDeActivacion(null);
          // La fecha es de este acto: si no se activa, vuelve a la que estaba guardada.
          setProximaRevision(version.nextReviewAt ?? '');
          intentoDeActivar.descartar();
        }}
        onConfirmar={() => void activar()}
      >
        <p>{COPY_ENTRENAMIENTO.consecuenciaDeActivar}</p>
        <div className="lo-que-cambia-al-activar" data-lo-que-cambia>
          {[COPY_DE_ACTIVAR_EL_PLAN.entra(loQueEntraAlActivarElEntrenamiento(bloques)), ...(vigente ? [COPY_DE_ACTIVAR_EL_PLAN.queda(vigente.numero, diaSinElAnioEnCurso(vigente.desde))] : [])].map((frase) => (
            <p key={frase.quien}>
              <strong>{frase.quien}</strong>
              {frase.que}
            </p>
          ))}
        </div>
        <Campo
          id="trn-proxima-revision"
          etiqueta={`${COPY_DE_ACTIVAR_EL_PLAN.proximaRevision} (${COPY_DE_ACTIVAR_EL_PLAN.opcional})`}
          ayuda={COPY_DE_ACTIVAR_EL_PLAN.ayudaDeLaRevision}
          type="date"
          value={proximaRevision}
          onChange={(e) => setProximaRevision(e.target.value)}
        />
      </DialogoDeConfirmacion>
    </section>
  );
}
