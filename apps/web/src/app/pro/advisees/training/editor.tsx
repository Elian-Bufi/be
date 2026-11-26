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
 *   parte de ese acto. Con cambios sin guardar, primero se guardan. DL-196 (E3): la versión de la app de la persona ya
 *   no impide nada: todos usan la última (Dirección, 19/11).
 * - **Cada problema lleva a su lugar:** elige el bloque, el microciclo y la sesión, abre el ejercicio y deja el foco ahí.
 *
 * **DL-196 (WP-EDITOR-ENTRENAMIENTO, parte A): dos columnas, como Nutrición.** Sin la columna izquierda: el centro se
 * desplaza con la página y tiene, de arriba hacia abajo, el plan (fechas, objetivo, anotaciones), las fases en
 * desplegables ordenados (cada una con sus semanas, su objetivo, sus días y sus sesiones) y «Agregar fase» con «Copiar la
 * fase anterior». A la derecha, el panel contextual: el almanaque para el plan, las fases y las sesiones; para un
 * ejercicio, su carga en el tiempo y «La vez pasada». «Antes de activar» va al lado de «Revisar y activar».
 */
import {
  COPY_AGENDA_DE_ENTRENAMIENTO,
  COPY_PRESETS,
  DIAS_DE_LA_SEMANA,
  COPY_DE_VERSIONES,
  COPY_GUARDADO,
  COPY_DE_ACTIVAR_EL_PLAN,
  COPY_DESCARTAR_LA_VERSION,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  COPY_HABITUALES,
  COPY_PLANTILLAS,
  COPY_PREPARACION_DE_PLANTILLA as PLT,
  ejerciciosConCargaEscrita,
  sinCargasSugeridas,
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
  conElComunDeLasSeries,
  redondeoDelEjercicio,
  loQueSeMiraEnElEditor,
  lugarDelProblemaDeEntrenamiento,
  motivoSinGuardarAhora,
  pedidoDeEjerciciosDelEditor,
  pedidoDeLaPosicion,
  COPY_BLOQUES_DE_LA_SESION,
  PROBLEMA_DE_BLOQUES,
  COPY_PROGRESIONES,
  conProgresion,
  progresionDeLaFase,
  progresionEnPalabras,
  cardioDe,
  conLaCargaSubida,
  conElCardio,
  CARDIO_SIN_INDICAR,
  esDeCardioPorLaClasificacion,
  progresionParaOtraFase,
  seAplicaA,
  sinProgresion,
  zonasACuidar as zonasACuidarDelFormulario,
  type ZonasACuidar,
  type VezPasada,
  nombreDeLaFase,
  nombreDelBloqueDeLaSesion,
  partesDeLaSesion,
  problemasDelEjercicio,
  sesionesDelBloque,
  ubicacionDelProblemaDeEntrenamiento,
  type AgendaDeEntrenamiento,
  type DiaDeLaSemana,
  type PresetDeEstructura,
  type PreparacionDePlantilla,
  type DetalleDelFallo,
  type ImagenDeEjercicio,
  type PlanConObjetivos,
  type SesionHabitual,
  type ValidationIssue,
  NOTACION_POR_OMISION,
  notacionDe,
  type NotacionDelEsfuerzo,
  fechasDeLasFases,
  mesParaAbrir,
  planificacionPodada,
  semanasDeLaFase,
  semanasQueSumanLasFases,
  semanasDeMas,
  conLaUltimaFaseRecortada,
  finDelPlan,
  ventanasDeLasSesiones,
  type MesDelAlmanaque,
  type PlanificacionDelPlan,
  RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO,
  planificacionDeLaPlantillaComoDelPlan,
  planificacionParaLaPlantilla,
} from '@be/domain';
import { BotonVerElRecorrido, RecorridoGuiado, useRecorridoGuiado } from '../../../../components/recorrido-guiado';
import { Almanaque, type SesionDelAlmanaque } from './almanaque';
import { letraDeLaSesion } from './letra-de-la-sesion';
import { COPY_VISTA_DE_LA_PERSONA, MOSTRAR_VISTA_DE_LA_PERSONA, VistaDeLaPersona } from './vista-de-la-persona';
import { BarraDeFases } from './barra-de-fases-en-pantalla';
import { COPY_BARRA_DE_FASES, diasEnCorto, faseConLaTecla, rangoDeLaBarra, tarjetasDeLaBarra } from './barra-de-fases';
import { criterioDeLaIntensidad, CuadroConfigurarPlan, CuadroDiasDeLaSemana, CuadroEditarFase, type IntensidadElegida } from './cuadros-del-plan';
import { AYUDAS_DEL_EDITOR, ContenidoDeLaAyuda } from './ayudas-del-editor';
import { MarcoDelPanel, PanelDelEjercicio, PatronesAPedido } from './panel-del-editor';
import { SugerenciaDeProgresionEnElPanel } from './sugerencia-de-progresion';
import { FOCO_DE_ENTRADA, focoDelElemento, mismoFoco, NOMBRE_DE_LA_VISTA, VISTAS_DEL_FOCO, vistaDelFoco, vistaPorTecla, type FocoDelEditor, type VistaDelPanel } from './panel-contextual';
import { AsistenteDeProgresion, type AplicacionDeLaProgresion } from './asistente-de-progresion';
import { GraficoDeSemanas } from './grafico-de-semanas';
import { AvisoDeZonaACuidar, CargaParaRepeticiones, CargaPorSemana, DistribucionConFichas, EstrellaDeFavorito } from './panel-de-la-parte-b';
import {
  baseDelEjercicio,
  cargasDeLaUltimaSemana,
  conCargaDeTrabajo,
  conFavorito,
  COPY_FAVORITOS,
  ejerciciosDeLaFase,
  esFavorito,
  repeticionesDeTrabajo,
  sesionesDeLaFase,
  sesionesParaDistribuir,
  unidadDeLaFase,
  vistaPrevia,
} from './progresion-del-editor';
import { LoQueImpideActivar } from './lo-que-impide-activar';
import {
  agendaConLaCopia,
  anotacionesDeLaFase,
  aproximacionesDe,
  colorDeLaFase,
  conAnotacionesDeLaFase,
  conAproximaciones,
  conInicio,
  conSemanasDeLaFase,
  copiarLaFase,
  nombreDeFaseNueva,
  planificacionConLaCopia,
  planificacionParaEditar,
} from './fases-del-plan';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ProveedorDeLaNotacion } from '../notacion-del-esfuerzo';
import { AvisoFlotante } from '../../../../components/ayuda';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { EnPartes } from '../../../../components/en-partes';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { TextoAPedido } from '../../../../components/texto-a-pedido';
import { api, type Resultado } from '../../../../lib/api';
import { EstadoDeGuardado } from '../../../../components/estado-de-guardado';
import { useAutoguardado } from '../../../../lib/autoguardado';
import { diaEnUnaFrase, horaDelDia, rangoCivil } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { eleccionAlActivar, fechaQueResulta, loQueFalta, NADA_ELEGIDO, type EleccionDeLaProxima } from '../../../../lib/cuando-la-revisas';
import { CuandoLaRevisas } from '../cuando-la-revisas';
import { conLasDeLaPosicion, type AlcanceDelPreset } from '../alcance-del-preset';
import { copiarElEjercicio, copiarLaSesion, copiarSobre, COPY_COPIAR, destinosDeLaSesion, loQueSeReemplaza, sesionesDelPlan, vistaPreviaDeLaSesion } from './copiar-a';
import { CuadroDeCopiar } from './cuadro-de-copiar';
import { alternarDia, COPY_ESTACION as CE, DIA_CORTO, DIA_LARGO, diasCompartidos, nombreDelChip, PRIMER_USO_DE_LA_ESTACION, ponerDias, sinDias, tiraDeLaSemana } from '../estacion/estacion';
import { GaleriaDePresets } from '../galeria-de-presets';
import { OtrasAreas } from '../seguimiento/otras-areas-en-pantalla';
import { PatronesDelPlan } from '../graficos/patrones/patrones-del-plan-en-pantalla';
import { PrimerUso } from '../../../../components/primer-uso';
import { ArmazonDelAsistente } from '../asistente/asistente';
import { COPY_ASISTENTE as CA, loQueLlevasArmado, pasoPedido, pasoQueSigue, sePuedeAvanzar, type PasoDelAsistente } from '../asistente/paso-que-sigue';
import {
  claveDeLaSesion,
  conLaEstructura,
  firmaDeLaCarga,
  gruposDelAsistente,
  loQueReemplazaLaEstructura,
  pestanaConLaTecla,
  pestanasDelPaso4,
  pestanaVigente,
  sesionesDelGrupo,
  type GrupoDelAsistente,
} from '../asistente/operaciones-del-asistente';
import { LineaDePrescripcion } from './linea-de-prescripcion';
import { prescripcionesDeLosMarcados } from './varios-a-la-vez';
import { COPY_ANTES_DE_ACTIVAR } from '../antes-de-activar';
import { compararEntrenamiento } from '../comparar-versiones';
import { AntesDeActivar } from '../cuadro-antes-de-activar';
import { CuadroDelDescarte } from '../cuadro-del-descarte';
import { ofreceDescartar, resultadoDelDescarte, textoDelDescarteQueNoSeHizo } from '../descartar-el-borrador';
import { conLosIdentificadoresNuevos, cualMande, huellaDelGuardado, type CuerpoDelGuardado } from '../es-lo-que-mande';
import { apilar, COPY_DESHACER, DESHACER_A_LA_VISTA_MS, desapilar, esCampoDeTexto, esDeshacer, type Instantanea } from './deshacer-del-editor';
import { moverHasta } from './reordenar';
import { useArrastreDeEjercicios, type SesionQueSeArrastra } from './arrastrar-ejercicios';
import { COPY_RESULTADO_DE_ACTIVAR, hayQueReleer, loQuePasoAlActivar, type VersionReleida } from '../resultado-de-activar';
import { useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { AVISO_DE_LOS_TOPES, esUnTope, motivoSinAgregarBloque, TEXTO_DE_LOS_TOPES, TOPES_DE_ENTRENAMIENTO, topesPasadosDeEntrenamiento } from '../topes-del-plan';
import { INCOMPLETO, loQueQuedaSinCompletarEnEntrenamiento, TEXTO_DE_LO_INCOMPLETO } from '../revisar-el-plan';
import { agruparAvisos, completarLasVacias, COPY_AVISOS_AGRUPADOS, leerLasRepeticiones, lugarDelEjercicio, seriesEnPalabras } from '../avisos-agrupados';
import { RenglonDeAviso, type CosaParaRevisar } from '../renglon-de-aviso';
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
import { agendaVigente, COPY_PROXIMAS_FECHAS, ProximasFechas, sesionesParaLaAgenda } from './agenda-del-plan';
import { AgregarEjercicio } from './agregar-ejercicio';
import { EjercicioDelEditor, type BloqueE, type Bloques, type PrescripcionE, type SesionE } from './ejercicio-del-editor';

/** DL-199 (ET3-20): lo que vuelve con «Deshacer»: la estructura, la planificación y la agenda. */
type LoQueSeDeshace = { readonly bloques: Bloques; readonly planificacion: PlanificacionDelPlan | null; readonly agenda: AgendaDeEntrenamiento | null };
import { BloqueDelEditor } from './bloque-del-editor';
import {
  abiertosTrasReordenar,
  agregarBloque as agregarBloqueALaSesion,
  agregarEjercicios,
  cambiarBloque,
  cambiarTipo,
  cambiarVueltas,
  deshacerTrasCambiarLasVueltas,
  destinoDelProblemaDelBloque,
  moverBloque,
  moverEjercicio as moverEnLaSesion,
  otrosBloques,
  pasarAlBloque,
  quitarBloque as quitarBloqueDeLaSesion,
  type CambioDeVueltas,
  type DeshacerLasVueltas,
  type SesionReordenada,
} from './bloques-del-editor';
import { COPY_REVISION_DE_LA_PLANTILLA, COPY_REVISION_DEL_PLAN, COPY_VOLVER_A_LA_REVISION, destinoDelLugar, RevisionDelPlan, type EstadoDeLaRevision, type Impedimento } from './revision-del-plan';
import {
  PRIMER_USO_DE_LA_PLANTILLA,
  AntesDeGuardarLaPlantilla,
  bloquesDeLaPreparacion,
  CabeceraDeLaPlantilla,
  comoPlan,
  cuerpoDeLaPreparacion,
  delCatalogoDeLaPreparacion,
  DescartarLaPreparacion,
  esDelPlan,
  guardadoDeLaPlantilla,
  metadatosDe,
  PreparacionQueYaNoEsta,
  type EdicionDePlantilla,
  type GuardadoDeLaPlantilla,
  type LoGuardado,
  type MetadatosDeLaPlantilla,
} from './edicion-de-plantilla';
import { campoParaEnfocar, camposDelProblema, SIN_APLICAR } from './ir-al-campo';
import { cantidadesDeSesionesVacias, COPY_SESIONES_VACIAS as SV, sesionesVacias } from './sesiones-vacias';
import { claveDeLaLinea, conLaLinea, COPY_ESCRITURA_RAPIDA, lineasConLosIdentificadores, lineasPendientes, lineasTrasReordenar, ordenTrasDuplicar, ordenTrasQuitar, type LineasSinAplicar } from './escritura-rapida';
import { NoDisponible, useEditorDeEntrenamiento } from './entrenamiento';
import { SelectorDeNivel } from './estructura-del-plan';
import { DialogoGuardarSesionHabitual, InsertarSesionHabitual, nombresDeHabitual, useEjerciciosHabituales, useSesionesHabituales } from './habituales';
import { DialogoGuardarPlantilla, NotaDeOrigen } from './plantillas';
import type { PlantillaParaEmpezar } from '../empezar-desde-plantilla';
import { COPY_PRESCRIPCION_HABITUAL, DialogoGuardarPrescripcionHabitual, usePrescripcionesHabituales } from './prescripcion-habitual';
import { COPY_DUPLICAR_EL_DIA as DD, diasDeDestino, duplicarElDia, sesionesDelDia } from '../estacion/duplicar-el-dia';

type MicrocicloE = NonNullable<BloqueE['microcycles']>[number];

/**
 * ENP-D10 y ENP-D18: el preset de prescripción elegido con la sesión vacía. Vive en esta pantalla, atado a la sesión (por
 * su identificador), hasta que se agregan ejercicios: entonces se escribe en cada uno. No se guarda solo en el plan, y el
 * texto lo dice.
 */
export const COPY_PRESCRIPCION_DE_LA_SESION = {
  paraLosQueAgregues: (nombre: string) => `Para los ejercicios que agregues: «${nombre}»`,
  dondeVive: 'Vive en esta pantalla: se escribe en cada ejercicio al agregarlo. Si cerrás o recargás el editor antes, no queda.',
  quitar: 'Quitar',
  elegido: (nombre: string) => `«${nombre}» se va a escribir en cada ejercicio que agregues a esta sesión. Hasta entonces vive en esta pantalla: no queda guardado.`,
} as const;

/** La jerarquía de API-SER-01 como entrada del PATCH, con los tres estados de cada serie (en el dominio, para que las pruebas editen igual). */
const aEntrada = (v: PlanConObjetivos): Bloques => estructuraConObjetivosComoEntrada(v);

/** ED-61: lo que quedó guardado en una versión, en la forma en que se compara con lo que mandó esta pantalla. */
const cuerpoGuardado = (v: PlanConObjetivos): CuerpoDelGuardado => ({ estructura: aEntrada(v), proximaRevision: v.nextReviewAt, agenda: v.agenda, objetivo: v.objectiveVersionId, planificacion: v.planning ?? null });

/**
 * DL-196: la planificación que viaja con los bloques que se mandan, podada igual que en la API (`planificacionPodada`):
 * así lo mandado y lo guardado se comparan bien después de un guardado sin respuesta (ED-61).
 */
function planificacionQueViaja(p: PlanificacionDelPlan | null, bloques: Bloques): PlanificacionDelPlan | null {
  const sesiones = bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]);
  return planificacionPodada(
    p,
    bloques.flatMap((b) => (b.blockId ? [b.blockId] : [])),
    sesiones.flatMap((s) => s.prescriptions.flatMap((x) => (x.prescriptionId ? [x.prescriptionId] : []))),
  );
}

/** Cada prescripción de la versión, en orden: de ahí salen los nombres y las imágenes por versión de ejercicio. */
function prescripcionesDe(v: PlanConObjetivos) {
  return v.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).flatMap((s) => s.prescriptions);
}

function nombresDe(v: PlanConObjetivos): Record<string, string> {
  return Object.fromEntries(prescripcionesDe(v).map((p) => [p.exerciseVersionId, p.exerciseName]));
}

/** §5.8: el ejercicio del catálogo de cada versión de ejercicio, para la fuerza estimada (la lista de la v1 es por ejercicio). */
function ejerciciosDe(v: PlanConObjetivos): Record<string, string> {
  return Object.fromEntries(prescripcionesDe(v).map((p) => [p.exerciseVersionId, p.exerciseId]));
}

function imagenesDe(v: PlanConObjetivos): Record<string, ImagenDeEjercicio | null> {
  return Object.fromEntries(prescripcionesDe(v).map((p) => [p.exerciseVersionId, p.image]));
}

const PROBLEMA: Readonly<Record<string, string>> = {
  // ENP-D13: lo que falta, dicho de lo que se nombra antes («Sesión B: no tiene ejercicios»).
  BLOCK_REQUIRED: 'no tiene ninguna fase',
  SESSION_REQUIRED: 'no tiene sesiones',
  PRESCRIPTION_REQUIRED: 'no tiene ejercicios',
  PHASES_EXCEED_PLAN_WEEKS: 'las fases suman más semanas que el plan: ajustá la duración o las fases',
  // DL-181: los bloques de la sesión.
  ...PROBLEMA_DE_BLOQUES,
  SESSIONS_AND_MICROCYCLES_IN_BLOCK: 'si la fase tiene microciclos, las sesiones van dentro de ellos',
  DUPLICATE_NODE_ID: 'hay un elemento repetido',
  WARM_UP_AFTER_WORKING_SET: 'las series de calentamiento van arriba, antes de las efectivas',
  INTENSITY_CRITERION_UNKNOWN: 'el criterio de intensidad no es % RM ni RIR',
  INTENSITY_CRITERIA_COMBINED: 'se eligen % RM o RIR, no los dos',
  PERCEIVED_EXERTION_AS_CRITERION: 'el esfuerzo percibido se registra en la sesión: no es un criterio de prescripción',
  INTENSITY_TARGET_OUT_OF_RANGE: 'el objetivo de intensidad no tiene sentido para ese criterio',
  SET_RIR_WITHOUT_RIR_CRITERION: 'un RIR por serie necesita que el ejercicio use el criterio RIR',
  SET_RIR_OUT_OF_RANGE: 'el RIR objetivo de una serie va de 0 a 10',
  EXERCISE_REFERENCE_INVALID: 'el ejercicio no está en el catálogo',
  EXERCISE_NOT_AVAILABLE: 'el ejercicio ya no está disponible',
  OBJECTIVE_NOT_EFFECTIVE: 'el borrador usa un objetivo que ya no es el vigente',
  SNAPSHOT_NOT_PRESERVABLE: 'no se pudo preservar la versión para la persona',
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
  // PLT (DL-182): lo que impide guardar una plantilla.
  ...PLT.problema,
};

/** Lo que no deja guardar: lo que el editor ve solo y, desde TB-48, los topes del contrato que se pasan. */
const loQueNoDejaGuardar = (bloques: Bloques) => [...loQueNoDejaGuardarElEntrenamiento(bloques), ...topesPasadosDeEntrenamiento(bloques)];


/** PLT: lo de la plantilla entera (su nombre, ninguna sesión, su estado) no tiene un lugar en la estructura. */
const DE_LA_PLANTILLA: ReadonlySet<string> = new Set(['name', 'blocks', 'templateId']);

/** Dónde está un problema, en palabras: los de la agenda, en «Días de entrenamiento». */
const dondeEsta = (p: ValidationIssue, bloques: Bloques): string =>
  p.path.startsWith('agenda') ? COPY_AGENDA_DE_ENTRENAMIENTO.titulo : DE_LA_PLANTILLA.has(p.path) ? 'Plan' : ubicacionDelProblemaDeEntrenamiento(p.path, bloques);


const esDelEditor = (codigo: string): boolean => (Object.values(N) as readonly string[]).includes(codigo);

/**
 * Una sesión nueva, «Sesión A», «Sesión B»… ENP-D17: nace con su identificador, como las de «Duplicar el día» (el contrato
 * lo admite y el servidor lo conserva): sus días se eligen enseguida, sin esperar al guardado, y lo que la pantalla le
 * ata (el preset de la sesión vacía) la sigue aunque se mueva o se quite otra.
 */
const sesionVacia = (n: number): SesionE => ({ sessionId: crypto.randomUUID(), label: `Sesión ${String.fromCharCode(64 + Math.min(n, 26))}`, instructions: null, prescriptions: [] });

// ENP-D01: «Bloque N» de un plan viejo se lee «Fase N»; el nombre guardado no cambia.
const nombreDelBloque = (b: { readonly label: string }, n: number): string => nombreDeLaFase(b.label, n);
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

export function EditorDePlan({
  planId,
  numero,
  objetivoVigente,
  vigente = null,
  onActivado,
  onDescartado,
  leerPlantillas,
  onReemplazarConPlantilla,
  plantillasNoSePueden = null,
  sinPlanActivo = false,
  plantilla = null,
}: {
  /** ENP-D12: todavía no hay un plan activo; se dice en la cabecera, en una etiqueta, y no en un renglón aparte. */
  sinPlanActivo?: boolean;
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
  /** Se activó. `texto`: lo que se dice si ya estaba activa (ED-62: un pedido anterior la había activado). */
  /** Activada (o ya activa): el texto del resultado, con el número y el nombre (ED-07). */
  onActivado: (texto: string) => void;
  /**
   * ED-01: la versión en preparación se descartó (o ya no estaba): la sección vuelve a leer el plan. `porOtraPestana`:
   * lo que se dice si la descartó otra pestaña (ED-62).
   */
  onDescartado: (porOtraPestana?: string) => void;
  /** ED-11: las plantillas de plan, para la pestaña de la galería de estructura. */
  leerPlantillas?: () => Promise<Resultado<readonly PlantillaParaEmpezar[]>>;
  /** ED-11: descartado este borrador, el plan crea otro desde la plantilla (API-TRN-07), que anota de cuál salió. */
  onReemplazarConPlantilla?: (templateVersionId: string) => void;
  /** EDT-54: por qué no se puede reemplazar con una plantilla (falta el objetivo vigente); `null`: se puede. */
  plantillasNoSePueden?: string | null;
  /**
   * PLT (DL-182): el editor edita la preparación de una plantilla, sin persona (`edicion-de-plantilla.tsx`): se guarda como
   * plantilla o como versión nueva, no se activa. `planId` es entonces el de la preparación, y lo de la persona no está.
   */
  plantilla?: EdicionDePlantilla | null;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado, parametros, ir } = useEditorDeEntrenamiento();
  const preparacionId = plantilla?.preparacionId ?? null;
  // DL-169: el nombre de la persona, o la referencia neutral, para decir quién no ve la versión y quién la va a ver.
  const persona = usePersonaDelArea();
  // PLT (DL-182): lo guardado: la versión en preparación del plan o la preparación de una plantilla (`LoGuardado`).
  const [version, setVersion] = useState<LoGuardado | null>(null);
  // PLT: en una plantilla, lo que viaja con la estructura (el nombre y la descripción de una nueva, las cargas), lo que
  // queda para completar al usarla (API-TPL-11), «Guardar plantilla» y la versión de la que partió, para lo que cambia.
  const [metadatos, setMetadatos] = useState<MetadatosDeLaPlantilla>({ nombre: '', descripcion: '', conCargas: false });
  const [paraCompletar, setParaCompletar] = useState<{ readonly version: string; readonly problemas: readonly ValidationIssue[] } | null>(null);
  const [guardandoLaPlantilla, setGuardandoLaPlantilla] = useState(false);
  const [falloAlGuardarLaPlantilla, setFalloAlGuardarLaPlantilla] = useState<string | null>(null);
  const intentoDeGuardarLaPlantilla = useClaveDeIntento();
  const [baseDeLaPlantilla, setBaseDeLaPlantilla] = useState<{ readonly bloques: Bloques; readonly nombres: Record<string, string> } | null | undefined>(undefined);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [bloques, setBloques] = useState<Bloques>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [imagenes, setImagenes] = useState<Record<string, ImagenDeEjercicio | null>>({});
  const [ejercicios, setEjercicios] = useState<Record<string, string>>({});
  const [proximaRevision, setProximaRevision] = useState('');
  // TB-15: «¿Cuándo la revisás?» al activar, con nada elegido (o la fecha que ya tenía la versión); la fecha que resulta
  // es la que se guarda en la versión antes de activarla.
  const [cuando, setCuando] = useState<EleccionDeLaProxima>(NADA_ELEGIDO);
  // La agenda (DL-137): los días de cada sesión, que se eligen junto a ella (C5). «Ver próximas fechas» abre lo que sale.
  const [agenda, setAgenda] = useState<AgendaDeEntrenamiento | null>(null);
  // DL-192 (RPE-D01): cómo se escribe el esfuerzo en esta versión. Viaja con cada guardado, como la agenda.
  const [notacion, setNotacion] = useState<NotacionDelEsfuerzo>(NOTACION_POR_OMISION);
  // DL-196: la planificación (fechas, semanas de las fases, objetivo, aproximaciones, anotaciones). Viaja con cada guardado.
  const [planificacion, setPlanificacion] = useState<PlanificacionDelPlan | null>(null);
  // DL-196 (EE-05): dónde está el foco del profesional (lo que muestra el panel), el mes del almanaque y si se ve grande.
  const [foco, setFoco] = useState<FocoDelEditor>(FOCO_DE_ENTRADA);
  const [mesDelAlmanaque, setMesDelAlmanaque] = useState<MesDelAlmanaque | null>(null);
  const [almanaqueGrande, setAlmanaqueGrande] = useState(false);
  // DL-196 parte B: la vista del panel (almanaque, distribución, progresión o favoritos), la distribución grande, el
  // asistente de la progresión (de una fase, o de la copia recién hecha) y las zonas a cuidar que declaró la persona.
  const [vistaElegida, setVistaElegida] = useState<VistaDelPanel>('almanaque');
  const [distribucionGrande, setDistribucionGrande] = useState(false);
  const [progresionAbierta, setProgresionAbierta] = useState<{
    readonly blockId: string;
    readonly copia: { readonly original: string; readonly originalId: string | null; readonly prescripciones: ReadonlyMap<string, string> } | null;
  } | null>(null);
  const [aCuidar, setACuidar] = useState<ZonasACuidar | null>(null);
  useEffect(() => {
    if (!token || asesoradoId === null) return;
    let vivo = true;
    // Lo declarado en el formulario (API-CTX-01). Si no se puede leer, no se marca nada: la silueta no inventa.
    void api.respuestasDelContexto(token, asesoradoId).then((r) => {
      if (vivo && r.ok) setACuidar(zonasACuidarDelFormulario(r.datos.data.forms));
    });
    return () => {
      vivo = false;
    };
  }, [token, asesoradoId]);
  // DL-196 (EE-06): la lista de «Antes de activar», desplegada al lado de «Revisar y activar».
  const [impideAbierto, setImpideAbierto] = useState(false);
  const [fechasAbiertas, setFechasAbiertas] = useState(false);
  // DL-197 (ET1-02 a ET1-04): el cuadro de configuración abierto: el plan, la fase o los días de la semana.
  const [cuadroDelPlan, setCuadroDelPlan] = useState<'plan' | 'fase' | 'dias' | null>(null);
  // DL-198 (ET2-12): «Ver como la persona», la sesión de una semana tal como le llega a la app (solo lectura).
  const [vistaDeLaPersona, setVistaDeLaPersona] = useState(false);
  // La fase recién agregada: «Editar fase» se abre cuando ya es la elegida, nunca con los datos de la anterior.
  const [faseQueSeAbre, setFaseQueSeAbre] = useState<number | null>(null);
  const [sucio, setSucio] = useState(false);
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
  // ED-07: la revisión de la API de lo guardado, para «Antes de activar» (`null`: todavía no se pidió). ENP-D13: con la
  // versión que se revisó; si lo guardado cambia, deja de valer.
  const [revision, setRevision] = useState<{ readonly estado: 'revisando' | 'lista' | 'fallo'; readonly problemas: readonly ValidationIssue[]; readonly version: string } | null>(null);
  // DL-181: el bloque al que suma el cajón de ejercicios (`null`: sueltos), el bloque cuyo nombre se cambia y el «Deshacer»
  // de las vueltas (la sesión como estaba).
  const [agregandoEn, setAgregandoEn] = useState<string | null>(null);
  const [renombrandoBloque, setRenombrandoBloque] = useState<string | null>(null);
  const [deshacerLaSesion, setDeshacerLaSesion] = useState<(DeshacerLasVueltas & { readonly donde: { readonly i: number; readonly j: number | null; readonly k: number } }) | null>(null);
  // ENP-D10: el preset elegido con la sesión vacía, que se aplica a cada ejercicio que se agregue, por sesión. Vive en la
  // pantalla: no es parte del plan.
  const [prescripcionDeLaSesion, setPrescripcionDeLaSesion] = useState<Readonly<Record<string, { readonly nombre: string; readonly aplicar: (p: PrescripcionE) => PrescripcionE }>>>({});
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
  // ED-11: reemplazar el borrador con una plantilla, desde la galería.
  const [reemplazando, setReemplazando] = useState(false);
  const [falloAlReemplazar, setFalloAlReemplazar] = useState<string | null>(null);
  // «Mis habituales» (PF-09 bis; DL-109): ejercicios a mano en el buscador; sesiones para guardar e insertar.
  const ejerciciosHabituales = useEjerciciosHabituales(token);
  const sesionesHabituales = useSesionesHabituales(token);
  const [sesionHabitual, setSesionHabitual] = useState<SesionE | null>(null);
  // ED-13: las prescripciones habituales (la galería las ofrece en «Tuyos») y el diálogo de guardar una.
  const prescripcionesHabituales = usePrescripcionesHabituales(token);
  const [prescripcionHabitual, setPrescripcionHabitual] = useState(false);
  // ED-24: «Duplicar el día», con el día de origen y el de destino elegido en su cuadro.
  const [duplicandoElDia, setDuplicandoElDia] = useState<{ readonly desde: DiaDeLaSemana; readonly hacia: DiaDeLaSemana | null } | null>(null);
  const [insertandoHabitual, setInsertandoHabitual] = useState(false);
  // C11: cuántas «Sesiones vacías» se arman de una vez (3, como A, B y C).
  const [cuantasVacias, setCuantasVacias] = useState(3);
  // «Agregar ejercicio»: el cajón suma a la sesión que se mira.
  const [agregando, setAgregando] = useState(false);
  // El texto que se está cambiando, y el campo que hay que enfocar después de ir a un problema.
  const [texto, setTexto] = useState<TextoQueSeCambia>(null);
  // C9: un campo, o los campos de un ejercicio en orden (el último, su renglón: `ir-al-campo.ts`).
  const [paraEnfocar, setParaEnfocar] = useState<string | readonly string[] | null>(null);
  // C9: «Volver a la revisión» después de «Ir a…»: desde el cuadro «Antes de activar» (con la fecha que se había elegido)
  // o desde el panel. Se ve en la sesión hasta volver o cerrarlo.
  const [volverALaRevision, setVolverALaRevision] = useState<{ readonly desde: 'cuadro'; readonly cuando: EleccionDeLaProxima } | { readonly desde: 'panel' } | null>(null);
  // DJ-8 (ED-11 y ED-22): las cargas que quedaron escritas para otras repeticiones, por sesión, con la firma del ejercicio
  // tal como quedó (`firmaDeLaCarga`): si se edita su carga o sus repeticiones, o se deshace, la marca deja de verse; si se
  // mueve, va con él. Es una marca de la pantalla, no un dato: no viaja ni se guarda (EDT-12).
  const [cargasARevisar, setCargasARevisar] = useState<Readonly<Record<string, readonly { readonly texto: string; readonly firma: string }[]>>>({});
  // ED-15: el panel a 1280 × 800 (se abre con «Panel» y se superpone al centro) y su pestaña (ED-25).
  const [panelAbierto, setPanelAbierto] = useState(false);
  // ED-23 y ED-24: el cuadro de copiar abierto (la sesión que se mira, o uno de sus ejercicios), o nada.
  const [copiando, setCopiando] = useState<{ readonly que: 'sesion' | 'semana' } | { readonly que: 'ejercicio' | 'prescripcion' | 'series'; readonly l: number } | null>(null);
  // ED-20: los días que trajo un preset de estructura, por nombre de sesión, para confirmarlos (son «del preset»).
  const [diasDelPreset, setDiasDelPreset] = useState<Readonly<Record<string, readonly DiaDeLaSemana[]>>>({});

  // ED-11: la galería de presets, abierta desde la sesión (prescripción) o desde la estructura.
  const [galeria, setGaleria] = useState<{ readonly tarea: 'prescripcion' | 'estructura'; readonly ejercicio: number | null } | null>(null);
  // ED-11 (DJ-8): «Deshacer» de la última aplicación, con las prescripciones de antes por posición. Es la operación
  // inversa, que se autoguarda como cualquier cambio; otro cambio cualquiera la retira, para que devuelva exacto.
  const [deshacer, setDeshacer] = useState<{ readonly texto: string; readonly lugar: Lugar & { readonly k: number }; readonly antes: ReadonlyMap<number, PrescripcionE>; readonly firmas: ReadonlySet<string> } | null>(null);
  // ED-14: «Siguiente» del asistente guarda y espera; si no pudo, el paso queda abierto con «Reintentar». Si viaja un
  // autoguardado, espera a que termine (`avanzarA`) y entonces decide.
  const [avanzando, setAvanzando] = useState(false);
  const [noAvanzo, setNoAvanzo] = useState(false);
  const [avanzarA, setAvanzarA] = useState<PasoDelAsistente | null>(null);
  // ED-14 (maqueta 03): la sesión que se mira en el paso 4, una pestaña por sesión de todo el plan.
  const [pestanaDelPaso4, setPestanaDelPaso4] = useState(0);
  // ED-14 y C7: lo escrito en la escritura rápida de cada ejercicio y todavía sin aplicar, por ejercicio (su identificador
  // o su lugar: `escritura-rapida.ts`), en la estación y en el paso 4 del asistente. Plegar, ir a otra sesión o a otra
  // pestaña no lo borra; salir o activar lo pregunta.
  const [lineas, setLineas] = useState<LineasSinAplicar>({});
  // DL-199 (ET3-20, ET3-21): «Deshacer» del último cambio: la pila de cómo estaba (la estructura, la planificación y la
  // agenda) y, después de un cambio grande, el aviso con «Deshacer» unos segundos.
  const pilaDeDeshacer = useRef<Instantanea<LoQueSeDeshace>[]>([]);
  const [avisoDeDeshacer, setAvisoDeDeshacer] = useState<{ readonly texto: string; readonly vez: number } | null>(null);
  const siguienteRef = useRef<((n: PasoDelAsistente) => Promise<void>) | null>(null);
  // ED-20: «Desde un preset» (paso 1) llega al paso 2 con la galería de estructuras abierta, una vez.
  // TEST-EDP-017: «Siguiente» pedido mientras viajaba un autoguardado decide cuando ese guardado termina.
  useEffect(() => {
    if (avanzarA === null || guardando) return;
    setAvanzarA(null);
    void siguienteRef.current?.(avanzarA);
  }, [avanzarA, guardando]);
  const presetPedido = parametros.get('preset');
  useEffect(() => {
    if (!version || presetPedido !== 'estructura') return;
    setGaleria({ tarea: 'estructura', ejercicio: null });
    ir({ preset: null });
  }, [version, presetPedido, ir]);

  const cargar = useCallback(async () => {
    setError(null);
    // PLT (DL-182): la preparación de una plantilla se lee con API-TPL-09; lo demás, como siempre.
    if (preparacionId) {
      const p = await api.consultarPreparacionDePlantilla(token, preparacionId);
      if (sesionPerdida(p)) return;
      if (!p.ok) return setError(p.tipo === 'API' && p.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
      const delCatalogo = delCatalogoDeLaPreparacion(p.datos.data);
      setVersion(guardadoDeLaPlantilla(p.datos.data));
      setBloques(bloquesDeLaPreparacion(p.datos.data));
      setNombres(delCatalogo.nombres);
      setImagenes(delCatalogo.imagenes);
      setEjercicios(delCatalogo.ejercicios);
      setMetadatos(metadatosDe(p.datos.data));
      // DL-198 (ET2-10): la planificación de la plantilla (semanas, aproximaciones, progresiones, intensidad).
      setPlanificacion(planificacionDeLaPlantillaComoDelPlan(p.datos.data.planning ?? null));
      pilaDeDeshacer.current = [];
      setAvisoDeDeshacer(null);
      setSucio(false);
      setFallo(false);
      setConflicto(false);
      sinRespuesta.current = [];
      return;
    }
    const r = await api.planConObjetivos(token, planId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
    setVersion(r.datos.data);
    setBloques(aEntrada(r.datos.data));
    setNombres(nombresDe(r.datos.data));
    setImagenes(imagenesDe(r.datos.data));
    setEjercicios(ejerciciosDe(r.datos.data));
    setProximaRevision(r.datos.data.nextReviewAt ?? '');
    setAgenda(r.datos.data.agenda);
    setNotacion(notacionDe(r.datos.data.effortNotation));
    setPlanificacion(r.datos.data.planning ?? null);
    pilaDeDeshacer.current = [];
    setAvisoDeDeshacer(null);
    setSucio(false);
    setFallo(false);
    setConflicto(false);
    sinRespuesta.current = [];
  }, [token, planId, sesionPerdida, preparacionId]);

  useEffect(() => {
    ediciones.current += 1;
  }, [bloques, agenda, proximaRevision, metadatos, notacion, planificacion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Después de ir a un problema, el foco va a su lugar en cuanto está dibujado (la sesión puede tardar un instante en
  // cambiar). Si la persona hace otra cosa antes, ese foco pendiente se olvida: no salta más tarde.
  // C9: con los campos de un ejercicio, se espera a que esté abierto y se elige el primero que esté dibujado.
  useEffect(() => {
    if (!paraEnfocar) return;
    const cual = campoParaEnfocar(
      typeof paraEnfocar === 'string' ? [paraEnfocar] : paraEnfocar,
      (id) => document.getElementById(id) !== null,
      (id) => document.getElementById(id)?.getAttribute('aria-expanded') === 'true',
    );
    const campo = cual ? document.getElementById(cual) : null;
    if (!campo) return;
    campo.focus({ preventScroll: true });
    campo.scrollIntoView({ block: 'center' });
    setParaEnfocar(null);
  });

  /** DL-199 (ET3-20): apila cómo estaba antes de un cambio; uno grande muestra «Deshacer» unos segundos. */
  const recordar = (grande: string | null = null, aparte = false) => {
    pilaDeDeshacer.current = apilar(pilaDeDeshacer.current, { bloques, planificacion, agenda }, Date.now(), grande, aparte);
    if (grande) setAvisoDeDeshacer({ texto: grande, vez: Date.now() });
  };
  const cambiar = (f: (b: Bloques) => Bloques, grande: string | null = null, aparte = false) => {
    recordar(grande, aparte);
    setBloques((b) => f(structuredClone(b)));
    setDeshacer(null);
    setDeshacerLaSesion(null);
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
    setParaEnfocar(null);
  };
  /**
   * DL-199 (ET3-20): lo que el guardado creó (los identificadores del servidor) también en lo apilado: si no, deshacer
   * devolvería un ejercicio sin su identificador y el guardado siguiente lo crearía de nuevo (con sus aproximaciones y su
   * agenda sueltas).
   */
  const conLosIdentificadoresEnLaPila = (enviados: Bloques, guardados: Bloques) => {
    pilaDeDeshacer.current = pilaDeDeshacer.current.map((x) => ({ ...x, estado: { ...x.estado, bloques: conLosIdentificadoresNuevos(x.estado.bloques, enviados, guardados) } }));
  };
  /** DL-199 (ET3-20): vuelve a como estaba antes del último cambio. */
  const deshacerElUltimo = () => {
    const r = desapilar(pilaDeDeshacer.current);
    if (!r) return setMensaje({ tipo: 'info', texto: COPY_DESHACER.nadaParaDeshacer });
    pilaDeDeshacer.current = r.pila;
    setBloques(r.estado.bloques);
    setPlanificacion(r.estado.planificacion);
    setAgenda(r.estado.agenda);
    setDeshacer(null);
    setDeshacerLaSesion(null);
    setAvisoDeDeshacer(null);
    setSucio(true);
    setProblemas(null);
    setParaEnfocar(null);
    setMensaje({ tipo: 'exito', texto: COPY_DESHACER.deshecho(r.grande) });
  };
  // DL-199 (ET3-21): el aviso se va solo a los ocho segundos, salvo que el foco o el puntero estén en él.
  useEffect(() => {
    if (!avisoDeDeshacer) return;
    let reloj: ReturnType<typeof setTimeout>;
    const intentar = () => {
      const aviso = document.querySelector('[data-deshacer-el-ultimo]')?.closest('.aviso-flotante');
      if (aviso && (aviso.contains(document.activeElement) || aviso.matches(':hover'))) reloj = setTimeout(intentar, 2000);
      else setAvisoDeDeshacer((a) => (a?.vez === avisoDeDeshacer.vez ? null : a));
    };
    reloj = setTimeout(intentar, DESHACER_A_LA_VISTA_MS);
    return () => clearTimeout(reloj);
  }, [avisoDeDeshacer]);
  // DL-199 (ET3-22, ET3-23): arrastrar los ejercicios de la sesión que se mira (la sesión se pone al día en cada dibujo).
  const sesionQueSeArrastra = useRef<SesionQueSeArrastra | null>(null);
  const arrastre = useArrastreDeEjercicios(() => sesionQueSeArrastra.current);
  const deshacerRef = useRef(deshacerElUltimo);
  deshacerRef.current = deshacerElUltimo;
  // DL-199 (ET3-D22): Ctrl+Z (Cmd+Z) deshace fuera de un campo de texto y fuera de un cuadro abierto (lo de adentro de un
  // cuadro es su borrador; en un campo, el navegador deshace lo escrito).
  useEffect(() => {
    const alTocar = (e: KeyboardEvent) => {
      if (!esDeshacer(e) || e.defaultPrevented) return;
      const foco = document.activeElement as HTMLElement | null;
      if (esCampoDeTexto(foco) || foco?.closest('dialog, [role="dialog"], [role="alertdialog"]')) return;
      if (document.querySelector('dialog[open]')) return;
      e.preventDefault();
      deshacerRef.current();
    };
    window.addEventListener('keydown', alTocar);
    return () => window.removeEventListener('keydown', alTocar);
  }, []);

  /**
   * Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. `reenvio` (ED-61): lo escrito después de un guardado
   * cuya respuesta se perdió, que se manda otra vez sobre la versión que ese guardado dejó, con las ediciones contadas
   * desde el primer envío.
   */
  async function guardar(automatico = false, reenvio: { readonly base: PlanConObjetivos; readonly bloques: Bloques; readonly ediciones: number } | null = null): Promise<LoGuardado | null> {
    // PLT (DL-182): la preparación de una plantilla se guarda con su operación (API-TPL-10).
    if (version && !esDelPlan(version)) return guardarLaPreparacion(automatico, version);
    const base = reenvio?.base ?? version;
    if (!base) return null;
    const bloquesEnviados = conElComunDeLasSeries(reenvio?.bloques ?? bloques);
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
    // DL-196: la planificación, podada como en la API.
    const planificacionEnviada = planificacionQueViaja(planificacion, bloquesEnviados);
    // ED-61: lo que se manda, por si la respuesta se pierde y el guardado siguiente da 409.
    const cuerpo: CuerpoDelGuardado = {
      estructura: bloquesEnviados,
      proximaRevision: proximaRevision || null,
      agenda: agendaEnviada,
      objetivo: actualizarObjetivo.objectiveVersionId ?? base.objectiveVersionId,
      planificacion: planificacionEnviada,
    };
    const r = await api.editarPlanDeEntrenamiento(token, planId, {
      expectedVersion: base.version,
      changes: { blocks: bloquesEnviados },
      nextReviewAt: proximaRevision || null,
      agenda: agendaEnviada,
      // DL-192: la notación viaja siempre; los valores de las series siguen siendo RIR.
      effortNotation: notacion,
      // DL-196: la planificación también; `null` la quita.
      planning: planificacionEnviada,
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
        if (actual && (sesionPerdida(actual) || accesoRetirado(actual))) {
          setGuardando(false);
          return null;
        }
        // Si la relectura tampoco respondió (sin red o un 5xx), no se sabe qué quedó guardado: no es un conflicto. Queda
        // como un guardado sin respuesta. Lo mandado sigue en la lista, y el intento siguiente vuelve a dar 409 y a releer.
        if (actual && !actual.ok) {
          setGuardando(false);
          setFallo(true);
          setDetalle({ ...detalleDelFallo(actual, horaDelDia(new Date())), motivo: 'SIN_RESPUESTA' });
          autoguardado.informar('SIN_RESPUESTA');
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
          setEjercicios((x) => ({ ...x, ...ejerciciosDe(guardada) }));
          if (huellaDelGuardado(cuerpo) !== huellaDelGuardado(mandado)) {
            return guardar(automatico, { base: guardada, bloques: conLosIdentificadoresNuevos(bloquesEnviados, mandado.estructura, aEntrada(guardada)), ediciones: edicionesAlEnviar });
          }
          setGuardando(false);
          setGuardadoA(horaDelDia(new Date()));
          autoguardado.informar('GUARDADO');
          if (ediciones.current === edicionesAlEnviar) {
            setBloques(aEntrada(guardada));
            // C7: lo escrito sin aplicar en un ejercicio que recién recibió su identificador pasa a él.
            setLineas((m) => lineasConLosIdentificadores(m, bloquesEnviados, aEntrada(guardada)));
            conLosIdentificadoresEnLaPila(bloquesEnviados, aEntrada(guardada));
            setAgenda(guardada.agenda);
            setPlanificacion(guardada.planning ?? null);
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
      // Sin respuesta, lo dice la barra, con «Reintentar» al lado (ED-03): también en el autoguardado, y sin un segundo
      // aviso igual que se lleve el foco.
      if (automatico || motivo === 'SIN_RESPUESTA') return null;
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
        // C7: lo escrito sin aplicar en un ejercicio que recién recibió su identificador pasa a él.
        setLineas((m) => lineasConLosIdentificadores(m, bloquesEnviados, aEntrada(detalle.datos.data)));
        conLosIdentificadoresEnLaPila(bloquesEnviados, aEntrada(detalle.datos.data));
        setAgenda(detalle.datos.data.agenda);
        setPlanificacion(detalle.datos.data.planning ?? null);
      }
      setNombres((n) => ({ ...n, ...nombresDe(detalle.datos.data) }));
      setImagenes((x) => ({ ...x, ...imagenesDe(detalle.datos.data) }));
      setEjercicios((x) => ({ ...x, ...ejerciciosDe(detalle.datos.data) }));
    }
    if (sinCambiosDespues) setSucio(false);
    return guardada;
  }

  // El autoguardado: la preparación se guarda sola en la primera pausa, si se puede y si no hay un acto abierto.
  const puedeGuardar = loQueNoDejaGuardar(bloques).length === 0;
  // ED-03: por qué «Guardar ahora» está apagado, o `null`.
  const sinGuardarAhora = motivoSinGuardarAhora({ guardando, sucio, conflicto });
  // Ctrl+S (Cmd+S) guarda ya, sin esperar la pausa del autoguardado; si no hay nada que guardar, no hace nada y el navegador
  // no abre su cuadro de «Guardar página».
  const guardarYaRef = useRef<() => void>(() => undefined);
  guardarYaRef.current = () => {
    if (!sinGuardarAhora) void guardar();
  };
  useEffect(() => {
    const alTocar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 's') return;
      if (document.querySelector('dialog[open]')) return;
      e.preventDefault();
      guardarYaRef.current();
    };
    window.addEventListener('keydown', alTocar);
    return () => window.removeEventListener('keydown', alTocar);
  }, []);
  const cambiosParaGuardar = useMemo(() => [bloques, agenda, proximaRevision, metadatos, notacion, planificacion], [bloques, agenda, proximaRevision, metadatos, notacion, planificacion]);
  const autoguardado = useAutoguardado({
    habilitado: !!version && sucio && puedeGuardar && !guardando && !conflicto && !confirmar && !activando && !guardarPlantilla && !descartar,
    cambios: cambiosParaGuardar,
    guardar: () => void guardar(true),
  });
  // ED-02: un enlace interno con cambios guarda antes de salir (si se puede: nada a medio escribir ni un conflicto) o
  // pregunta; recargar o cerrar la pestaña, también pregunta.
  useCambiosSinGuardar(sucio, plantilla ? 'la plantilla' : 'el plan en preparación', { sePuede: puedeGuardar && !conflicto, ocupado: guardando, guardar: async () => (await guardar()) !== null });
  // C7: lo escrito en la escritura rápida y sin aplicar no es parte del plan (no se guarda): salir o recargar pregunta.
  const lineasSinAplicar = lineasPendientes(lineas, bloques);
  useCambiosSinGuardar(lineasSinAplicar.length > 0, COPY_ESCRITURA_RAPIDA.alSalir);

  /**
   * ED-07: la revisión de la API de la versión guardada (API-TRN-11). Lo que dice entra en «Lo que impide activar»; la
   * validación final sigue siendo la de la API al activar. Revisar mira la forma, no la calidad (B10-06:563-591).
   */
  async function revisar(v: LoGuardado) {
    // PLT (DL-182): la de una plantilla mira lo que impide guardarla (API-TPL-11).
    if (!esDelPlan(v)) return revisarLaPreparacion(v);
    setRevision({ estado: 'revisando', problemas: [], version: v.version });
    const r = await api.validarPlanDeEntrenamiento(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    // Si mientras tanto se pidió la revisión de otra versión, esta respuesta ya no es la que se espera.
    setRevision((x) => (x && x.version !== v.version ? x : r.ok ? { estado: 'lista', problemas: r.datos.data.issues, version: v.version } : { estado: 'fallo', problemas: [], version: v.version }));
  }

  /**
   * ENP-D13: «Revisar ahora»: si hay algo sin guardar, primero se guarda; después se revisa lo que quedó guardado. Con un
   * guardado en curso (el autoguardado) o con un conflicto no se manda otro, como con «Guardar ahora»: dos guardados con
   * la misma versión de base darían un conflicto falso (409) de la pantalla consigo misma. Lo guardado se revisa solo
   * apenas termina. `motivoSinRevisar` dice por qué está apagado.
   */
  const motivoSinRevisar = sucio ? sinGuardarAhora : null;
  async function revisarAhora() {
    if (motivoSinRevisar) return;
    const v = sucio ? await guardar() : version;
    if (v) await revisar(v);
  }

  // ENP-D13: la revisión se pide sola cuando lo guardado se queda quieto un momento (no en cada tecla, ni con algo sin
  // guardar). Con «Antes de activar» abierto la pide el cuadro.
  useEffect(() => {
    if (!version || sucio || guardando || confirmar || revision?.version === version.version) return;
    const reloj = setTimeout(() => void revisar(version), 900);
    return () => clearTimeout(reloj);
    // `revisar` es de este render y lee lo mismo que estas dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, sucio, guardando, confirmar, revision?.version]);

  /** ED-07 (DJ-6): «Revisar y activar…» abre el cuadro siempre, también con algo por corregir o sin guardar. */
  function abrirAntesDeActivar() {
    abrirElCuadro(null);
  }
  /**
   * El cuadro «Antes de activar». C9: al volver de «Ir a…» (`previa`), con la fecha de la próxima revisión que se había
   * elegido: se conserva el contexto.
   */
  function abrirElCuadro(previa: EleccionDeLaProxima | null) {
    // PLT (DL-182): en una plantilla, el cuadro es «Antes de guardar», con la misma revisión de lo guardado.
    if (version && !esDelPlan(version)) {
      setVolverALaRevision(null);
      setFalloAlGuardarLaPlantilla(null);
      setRevision((x) => (x && x.version === version.version && x.estado !== 'fallo' ? x : null));
      setConfirmar(true);
      return;
    }
    if (!version) return;
    setVolverALaRevision(null);
    setFalloDeActivacion(null);
    setCuando(previa ?? eleccionAlActivar(version.nextReviewAt));
    setProximaRevision(previa ? (fechaQueResulta(previa, hoyEn()) ?? '') : (version.nextReviewAt ?? ''));
    // ENP-D13: si lo guardado ya está revisado (o se está revisando), el cuadro usa esa revisión; si no, la pide.
    setRevision((x) => (x && x.version === version.version && x.estado !== 'fallo' ? x : null));
    setConfirmar(true);
  }

  /** ED-07: cerrar el cuadro sin activar. La fecha es de este acto: vuelve a la que estaba guardada. */
  function cerrarAntesDeActivar() {
    if (plantilla) {
      setConfirmar(false);
      setFalloAlGuardarLaPlantilla(null);
      // Con el resultado incierto, la clave se conserva, como al activar (ED-62).
      if (!intentoDeGuardarLaPlantilla.quedoIncierto()) intentoDeGuardarLaPlantilla.descartar();
      return;
    }
    setConfirmar(false);
    setFalloDeActivacion(null);
    setProximaRevision(comoPlan(version)?.nextReviewAt ?? '');
    setCuando(NADA_ELEGIDO);
    // ED-62: con el resultado incierto, la clave se conserva: el intento siguiente (el mismo pedido) la reusa.
    if (!intentoDeActivar.quedoIncierto()) intentoDeActivar.descartar();
  }

  // PLT (DL-182): con «Antes de guardar» abierto, la versión de la que partió la plantilla, para decir lo que cambia.
  const deLaPlantilla = version && !esDelPlan(version) ? version.preparacion : null;
  const plantillaDeBase = deLaPlantilla?.templateId ?? null;
  const versionDeBase = deLaPlantilla?.baseVersionId ?? null;
  useEffect(() => {
    if (!confirmar || !plantillaDeBase || !versionDeBase) return;
    let vigente = true;
    setBaseDeLaPlantilla(undefined);
    void api.consultarPlantillaDeEntrenamiento(token, plantillaDeBase).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      // Si la vigente ya no es la de base, lo que cambia no se compara con otra: al guardar, la API lo dice (409).
      setBaseDeLaPlantilla(
        r.ok && r.datos.data.versionId === versionDeBase
          ? { bloques: r.datos.data.structure.blocks as Bloques, nombres: Object.fromEntries(Object.entries(r.datos.data.exercises).map(([id, e]) => [id, e.exerciseName])) }
          : null,
      );
    });
    return () => {
      vigente = false;
    };
  }, [confirmar, plantillaDeBase, versionDeBase, token, sesionPerdida]);

  // ED-07: con el cuadro abierto y todo guardado, la API revisa lo guardado (al abrirlo, o apenas llega la respuesta de
  // un guardado). Con cambios sin guardar, el cuadro ofrece primero «Guardar ahora».
  useEffect(() => {
    if (confirmar && version && !sucio && !guardando && (revision === null || revision.version !== version.version)) void revisar(version);
    // `revisar` es de este render y lee lo mismo que estas dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmar, version, sucio, guardando, revision]);

  async function activar() {
    if (!version || !esDelPlan(version) || fechaQueResulta(cuando, hoyEn()) === undefined) return;
    setActivando(true);
    setFalloDeActivacion(null);
    // La próxima revisión se fija en este acto: si cambió, se guarda antes, y se activa la versión que eso deja.
    let v: PlanConObjetivos | null = version;
    if (proximaRevision !== (version.nextReviewAt ?? '')) {
      v = comoPlan(await guardar());
      if (!v) {
        setActivando(false);
        return setFalloDeActivacion(COPY_DE_ACTIVAR_EL_PLAN.noSePudoGuardarAntes);
      }
    }
    // ED-62: la clave es la de este pedido (la versión que se activa); un resultado incierto la conserva.
    const r = await api.activarPlanDeEntrenamiento(token, planId, v.version, intentoDeActivar.actual(`${planId}:${v.version}`));
    intentoDeActivar.registrar(r);
    if (sesionPerdida(r) || accesoRetirado(r)) return setActivando(false);
    // ED-62: con un 409, un 422 sin lugar o sin respuesta, se relee la versión antes de decir qué pasó.
    let releida: VersionReleida | null = null;
    if (hayQueReleer(r)) {
      const actual = await api.planConObjetivos(token, planId);
      if (sesionPerdida(actual)) return setActivando(false);
      releida = actual.ok ? { estado: actual.datos.data.state, version: actual.datos.data.version } : actual.tipo === 'API' && actual.codigo === 'RESOURCE_NOT_FOUND' ? { estado: 'NO_ESTA' } : null;
    }
    setActivando(false);
    const que = loQuePasoAlActivar(r, releida, v.version);
    switch (que.tipo) {
      case 'ACTIVADA':
      case 'YA_QUEDO_ACTIVA':
        setConfirmar(false);
        return onActivado(que.tipo === 'YA_QUEDO_ACTIVA' ? COPY_RESULTADO_DE_ACTIVAR.yaQuedoActiva(numero, persona) : COPY_RESULTADO_DE_ACTIVAR.activada(numero, persona));
      case 'YA_NO_ESTA':
        // Se descartó en otra pestaña: no hay nada que activar ni que guardar; la sección vuelve a leer el plan.
        setConfirmar(false);
        setSucio(false);
        return onDescartado(COPY_RESULTADO_DE_ACTIVAR.yaNoEsta);
      case 'IMPIDE':
        // Lo que impide activar, con su lugar, en el mismo cuadro.
        setRevision({ estado: 'lista', problemas: que.problemas, version: v.version });
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.impide);
      case 'CAMBIO_EN_OTRA_PESTANA':
        // Al volver al plan, el aviso del conflicto ofrece «Cargar la versión guardada».
        setConflicto(true);
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.cambioEnOtraPestana);
      case 'OTRO_PLAN_VIGENTE':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.otroPlanVigente('entrenamiento'));
      case 'SIN_CAPACIDAD':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.sinCapacidad);
      case 'INCIERTO':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.incierto);
      default:
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.otro);
    }
  }

  /**
   * ED-01: descarta la versión en preparación con la versión que muestra la pantalla. Descartada, o si ya no estaba (se
   * descartó o se activó en otra pestaña), la sección vuelve a leer el plan; si no, el cuadro dice por qué.
   */
  async function descartarLaVersion() {
    // PLT (DL-182): en una plantilla se descarta lo preparado (API-TPL-13).
    if (plantilla) return descartarLaPreparacion();
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

  /**
   * ED-11 (Dirección, 2026-11-12): una plantilla elegida en la galería reemplaza el borrador. Se descarta con la versión
   * que muestra la pantalla, como «Descartar», y el plan crea el nuevo desde la plantilla; si el descarte no se hizo, la
   * galería dice por qué y nada cambia.
   */
  async function reemplazarConPlantilla(templateVersionId: string) {
    if (!version || reemplazando || !onReemplazarConPlantilla) return;
    // Sin el objetivo vigente, el nuevo no puede nacer: el borrador no se descarta, y la galería dice por qué (EDT-54).
    if (plantillasNoSePueden) return setFalloAlReemplazar(plantillasNoSePueden);
    setReemplazando(true);
    setFalloAlReemplazar(null);
    const r = await api.descartarBorradorDePlanDeEntrenamiento(token, planId, version.version, intentoDeDescartar.actual());
    intentoDeDescartar.registrar(r);
    setReemplazando(false);
    if (sesionPerdida(r)) return;
    const queNoSeHizo = textoDelDescarteQueNoSeHizo(resultadoDelDescarte(r));
    if (queNoSeHizo) return setFalloAlReemplazar(queNoSeHizo);
    setSucio(false);
    setGaleria(null);
    onReemplazarConPlantilla(templateVersionId);
  }

  // ── PLT (DL-182): guardar, revisar, guardar como plantilla y descartar lo preparado de una plantilla ──────────────
  /** Escribir el nombre, la descripción o el interruptor de las cargas es un cambio más: el autoguardado lo manda. */
  function cambiarMetadatos(m: MetadatosDeLaPlantilla) {
    setMetadatos(m);
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  }

  /** Lo que guardó el servidor pasa a la pantalla; lo escrito mientras viajaba se conserva y viaja en el próximo. */
  function adoptarLaPreparacion(p: PreparacionDePlantilla, bloquesEnviados: Bloques, edicionesAlEnviar: number): GuardadoDeLaPlantilla {
    const guardada = guardadoDeLaPlantilla(p);
    const delCatalogo = delCatalogoDeLaPreparacion(p);
    setGuardando(false);
    setVersion(guardada);
    setFallo(false);
    setConflicto(false);
    setGuardadoA(horaDelDia(new Date()));
    autoguardado.informar('GUARDADO');
    setNombres((n) => ({ ...n, ...delCatalogo.nombres }));
    setImagenes((x) => ({ ...x, ...delCatalogo.imagenes }));
    setEjercicios((x) => ({ ...x, ...delCatalogo.ejercicios }));
    if (ediciones.current === edicionesAlEnviar) {
      setBloques(bloquesDeLaPreparacion(p));
      // C7: lo escrito sin aplicar en un ejercicio que recién recibió su identificador pasa a él.
      setLineas((m) => lineasConLosIdentificadores(m, bloquesEnviados, bloquesDeLaPreparacion(p)));
      conLosIdentificadoresEnLaPila(bloquesEnviados, bloquesDeLaPreparacion(p));
      setSucio(false);
    }
    return guardada;
  }

  /**
   * PLT: el autoguardado de la preparación (API-TPL-10), con las mismas reglas que el del plan: lo que no deja guardar no
   * viaja; un 409 después de un guardado sin respuesta se compara con lo mandado (ED-61) antes de decir «conflicto».
   */
  async function guardarLaPreparacion(automatico: boolean, base: GuardadoDeLaPlantilla, reenvio: { readonly bloques: Bloques; readonly ediciones: number } | null = null): Promise<LoGuardado | null> {
    const bloquesEnviados = conElComunDeLasSeries(reenvio?.bloques ?? bloques);
    const impide = loQueNoDejaGuardar(bloquesEnviados);
    if (impide.length > 0) {
      if (automatico) return null;
      setProblemas(impide);
      setMensaje({ tipo: 'error', texto: impide.some((p) => esUnTope(p.code)) ? AVISO_DE_LOS_TOPES : avisoDeLoQueNoDejaGuardarElEntrenamiento(impide) });
      return null;
    }
    const nueva = base.preparacion.templateId === null;
    const edicionesAlEnviar = reenvio?.ediciones ?? ediciones.current;
    const m = metadatos;
    setGuardando(true);
    if (!automatico) setMensaje(null);
    const cuerpo = cuerpoDeLaPreparacion(bloquesEnviados, nueva, m);
    const r = await api.guardarPreparacionDePlantilla(token, base.preparacion.draftId, {
      expectedVersion: base.version,
      structure: { blocks: bloquesEnviados },
      ...(nueva ? { name: m.nombre.trim(), description: m.descripcion.trim() || null } : {}),
      copySuggestedLoads: m.conCargas,
      // DL-198 (ET2-10): la planificación viaja con la plantilla, sin nada de una persona.
      planning: planificacionParaLaPlantilla(planificacionQueViaja(planificacion, bloquesEnviados)),
    });
    if (sesionPerdida(r) || accesoRetirado(r)) {
      setGuardando(false);
      return null;
    }
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        const mandados = sinRespuesta.current;
        const leida = mandados.length > 0 && !reenvio ? await api.consultarPreparacionDePlantilla(token, base.preparacion.draftId) : null;
        if (leida && (sesionPerdida(leida) || accesoRetirado(leida))) {
          setGuardando(false);
          return null;
        }
        if (leida && !leida.ok) {
          setGuardando(false);
          setFallo(true);
          setDetalle({ ...detalleDelFallo(leida, horaDelDia(new Date())), motivo: 'SIN_RESPUESTA' });
          autoguardado.informar('SIN_RESPUESTA');
          return null;
        }
        const p = leida?.ok ? leida.datos.data : null;
        const cual = p ? cualMande(cuerpoDeLaPreparacion(p.structure.blocks, nueva, metadatosDe(p)), mandados) : -1;
        if (p && cual >= 0) {
          // Lo guardado es de esta pantalla: no hay conflicto. Si se escribió algo después, se manda sobre lo adoptado.
          sinRespuesta.current = [];
          const mandado = mandados[cual]!;
          if (huellaDelGuardado(cuerpo) !== huellaDelGuardado(mandado)) {
            return guardarLaPreparacion(automatico, guardadoDeLaPlantilla(p), { bloques: conLosIdentificadoresNuevos(bloquesEnviados, mandado.estructura, bloquesDeLaPreparacion(p)), ediciones: edicionesAlEnviar });
          }
          return adoptarLaPreparacion(p, bloquesEnviados, edicionesAlEnviar);
        }
        setGuardando(false);
        setConflicto(true);
        autoguardado.informar('OTRO');
        return null;
      }
      setGuardando(false);
      setFallo(true);
      setDetalle(detalleDelFallo(r, horaDelDia(new Date())));
      const motivo = falloDeGuardado(r);
      if (motivo === 'SIN_RESPUESTA') sinRespuesta.current = [...sinRespuesta.current, cuerpo];
      autoguardado.informar(motivo, ediciones.current !== edicionesAlEnviar);
      if (motivo === 'DEMASIADO_GRANDE') {
        setProblemas(null);
        setMensaje({ tipo: 'error', texto: COPY_GUARDADO.demasiadoGrande, sinFoco: automatico });
        return null;
      }
      if (automatico || motivo === 'SIN_RESPUESTA') return null;
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos de la plantilla que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    sinRespuesta.current = [];
    return adoptarLaPreparacion(r.datos.data, bloquesEnviados, edicionesAlEnviar);
  }

  /** PLT: la revisión de lo guardado (API-TPL-11): lo que impide guardarla y lo que queda para completar al usarla. */
  async function revisarLaPreparacion(v: GuardadoDeLaPlantilla) {
    setRevision({ estado: 'revisando', problemas: [], version: v.version });
    const r = await api.revisarPreparacionDePlantilla(token, v.preparacion.draftId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (r.ok) setParaCompletar({ version: v.version, problemas: r.datos.data.toComplete });
    setRevision((x) => (x && x.version !== v.version ? x : r.ok ? { estado: 'lista', problemas: r.datos.data.issues, version: v.version } : { estado: 'fallo', problemas: [], version: v.version }));
  }

  /** PLT: «Guardar plantilla» o «Guardar nueva versión» (API-TPL-12), con la versión de lo preparado que se ve. */
  async function guardarComoPlantilla() {
    if (!plantilla || !version || esDelPlan(version) || guardandoLaPlantilla) return;
    const p = version.preparacion;
    setGuardandoLaPlantilla(true);
    setFalloAlGuardarLaPlantilla(null);
    // La clave es la de este pedido (lo preparado en esta versión): un resultado incierto la conserva (ED-62).
    const r = await api.publicarPreparacionDePlantilla(token, p.draftId, version.version, intentoDeGuardarLaPlantilla.actual(`${p.draftId}:${version.version}`));
    intentoDeGuardarLaPlantilla.registrar(r);
    setGuardandoLaPlantilla(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'TEMPLATE_NAME_TAKEN') return setFalloAlGuardarLaPlantilla(COPY_PLANTILLAS.nombreTomado);
      if (r.tipo === 'API' && r.codigo === 'TEMPLATE_ARCHIVED') return setFalloAlGuardarLaPlantilla(PLT.problema.TEMPLATE_ARCHIVED ?? mensajeDeFallo(r));
      if (r.tipo === 'API' && r.codigo === 'OPERATION_NOT_READY') {
        setRevision({ estado: 'lista', problemas: r.issues, version: version.version });
        return setFalloAlGuardarLaPlantilla('Hay elementos por corregir antes de guardar la plantilla.');
      }
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        setConflicto(true);
        return setFalloAlGuardarLaPlantilla(COPY_GUARDADO.conflicto);
      }
      if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return setError('no-disponible');
      return setFalloAlGuardarLaPlantilla(mensajeDeFallo(r));
    }
    setSucio(false);
    setConfirmar(false);
    plantilla.onGuardada(r.datos.data, p.templateId === null);
  }

  /** PLT: descartar lo preparado (API-TPL-13). Si ya no estaba (se guardó o se descartó en otra pestaña), también se vuelve. */
  async function descartarLaPreparacion() {
    if (!plantilla || !version || esDelPlan(version) || descartando) return;
    const p = version.preparacion;
    setDescartando(true);
    setFalloDelDescarte(null);
    const r = await api.descartarPreparacionDePlantilla(token, p.draftId, version.version, intentoDeDescartar.actual());
    intentoDeDescartar.registrar(r);
    setDescartando(false);
    if (sesionPerdida(r)) return;
    const yaNoEstaba = !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';
    if (!r.ok && !yaNoEstaba) return setFalloDelDescarte(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? COPY_GUARDADO.conflicto : mensajeDeFallo(r));
    setSucio(false);
    setDescartar(false);
    plantilla.onDescartada(p.templateId === null || p.baseVersionNumber === null ? PLT.descartadaLaNueva : PLT.descartadosLosCambios(p.baseVersionNumber));
  }

  // DL-195 (GUI-08): el recorrido guiado aparece solo la primera vez que el profesional abre el editor de una versión del
  // plan (no en la plantilla ni en el asistente).
  const recorrido = useRecorridoGuiado('training-plan-editor', version !== null && !plantilla && esDelPlan(version) && pasoPedido(parametros.get('asistente')) === null);

  if (error === 'no-disponible' && plantilla) return <PreparacionQueYaNoEsta volver={plantilla.volver} />;
  if (error === 'no-disponible') return <NoDisponible />;
  if (error === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (!version) return <Cargando />;


  // La agenda que se ve: sin las sesiones que se sacaron ni los movimientos que dejaron de tener sentido (DL-137).
  const sesionesDeLaAgenda = sesionesParaLaAgenda(bloques);
  const agendaVisible = agendaVigente(agenda, sesionesDeLaAgenda);
  // C5: la agenda con alguna sesión con días (sin ninguna, al guardar viaja como «sin días»).
  const agendaConDias = agendaVisible && agendaVisible.sessions.length > 0 ? agendaVisible : null;
  const cambiarAgenda = (a: AgendaDeEntrenamiento | null) => {
    recordar();
    setAgenda(a);
    // Revisión del tramo 2: sin ninguna sesión con días, «Próximas fechas» se cierra (si no, volvía a abrirse sola con
    // el próximo día elegido).
    if (!a || a.sessions.length === 0) setFechasAbiertas(false);
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  };
  // ── DL-196: la planificación, las fechas de cada fase y las semanas en que va cada sesión ──────────────────────
  const plan = planificacionParaEditar(planificacion);
  const cambiarPlanificacion = (p: PlanificacionDelPlan, grande: string | null = null) => {
    recordar(grande);
    setPlanificacion(p);
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  };
  const fechasDeFases = fechasDeLasFases(plan, bloques);
  const ventanas = ventanasDeLasSesiones(plan, bloques);
  // DL-197 (ET1-D03, F4): las semanas que las fases pasan del plan; con alguna, no se activa.
  const fasesDeMas = plantilla ? 0 : semanasDeMas(plan, bloques);
  // Revisión adversaria (DL-197): los que heredan la intensidad del plan sin objetivo todavía quedan «sin completar».
  const herenciaDeLaIntensidad = plantilla ? null : { criterio: criterioDeLaIntensidad(plan.intensity), sinIntensidad: plan.withoutIntensity ?? [] };
  // La agenda empieza con el plan: si el plan tiene inicio, la agenda lo toma (los días se eligen en cada fase).
  const inicioDeLaAgenda = plan.startDate ?? hoyEn();
  const agendaDelPlan = (a: AgendaDeEntrenamiento | null): AgendaDeEntrenamiento | null => (a && plan.startDate && a.startDate !== plan.startDate ? { ...a, startDate: plan.startDate } : a);

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
  const impideGuardar = loQueNoDejaGuardar(bloques);
  const antesHayQueCorregir = impideGuardar.length > 0 ? 'Antes hay que corregir lo que no deja guardar esta versión.' : null;

  // ── PG-10: los avisos iguales del mismo ejercicio, en un renglón; «Completar» escribe solo las vacías ─────────────
  /**
   * Fija las repeticiones de las series vacías del grupo, de una vez, con la operación de siempre (el borrador se guarda
   * como cualquier cambio). «Deshacer» vuelve el ejercicio como estaba: las N series juntas. Un error, o `null`.
   */
  const completarElGrupo = (ejercicio: string, series: readonly number[], texto: string): string | null => {
    const valor = leerLasRepeticiones(texto);
    if (!valor) return COPY_AVISOS_AGRUPADOS.noSeEntiende;
    const l = lugarDelEjercicio(ejercicio);
    const antes = l ? sesionesDelGrupo(bloques, l)[l.k]?.prescriptions[l.l] : undefined;
    if (!l || !antes) return null;
    cambiar((x) => {
      const p = sesionesDelGrupo(x, l)[l.k]!.prescriptions[l.l]!;
      p.sets = completarLasVacias(p.sets, series, valor).sets;
      return x;
    });
    setDeshacer({
      texto: COPY_AVISOS_AGRUPADOS.completadas(seriesEnPalabras(series), texto.trim()),
      lugar: { i: l.i, j: l.j, k: l.k },
      antes: new Map([[l.l, structuredClone(antes)]]),
      firmas: new Set(),
    });
    return null;
  };
  /** Los avisos con el mismo motivo y el mismo ejercicio, en un renglón con el rango; uno solo queda como estaba. */
  const enGrupos = (lista: readonly ValidationIssue[], conLugar: (p: ValidationIssue, texto: string) => CosaParaRevisar): CosaParaRevisar[] => {
    const texto = (p: ValidationIssue) => TEXTO_DE_LO_INCOMPLETO[p.code] ?? 'revisá este elemento';
    return agruparAvisos(lista).map((g) => {
      const primero = g.avisos[0]!;
      if (g.avisos.length === 1 || g.ejercicio === null) return conLugar(primero, texto(primero));
      const ejercicio = g.ejercicio;
      return {
        texto: `${ubicacionDelProblemaDeEntrenamiento(ejercicio, bloques)}: ${seriesEnPalabras(g.series)} ${texto(primero)}`,
        detalle: g.avisos.map((p) => conLugar(p, texto(p))),
        completar: g.code === INCOMPLETO.sinRepeticiones ? { cuantas: g.series.length, alCompletar: (v: string) => completarElGrupo(ejercicio, g.series, v) } : null,
      };
    });
  };

  // ── ED-07: lo que dice «Antes de activar» ─────────────────────────────────────────────────────────────────────
  /** Cerrar el cuadro y llevar a una cosa por corregir: a su lugar, con el foco ahí. */
  const irDesdeElCuadro = (p: ValidationIssue) => () => {
    cerrarAntesDeActivar();
    irAlProblema(p);
    // C9: la fecha que se había elegido, para «Volver a la revisión». Es la de este dibujo: cerrar el cuadro la vuelve a la
    // guardada en el próximo.
    setVolverALaRevision({ desde: 'cuadro', cuando });
  };
  /**
   * C9: desde el panel, «Ir a…» lo cierra si está encima de la sesión (por debajo de 1440) —tapaba el campo— y deja
   * «Volver a la revisión».
   */
  const irDesdeElPanel = (p: ValidationIssue) => {
    setPanelAbierto(false);
    // DL-196 (EE-06): la lista de «Antes de activar» se cierra y deja «Volver a la revisión».
    setImpideAbierto(false);
    setVolverALaRevision({ desde: 'panel' });
    irAlProblema(p);
  };
  /** C9: volver a donde se estaba: el cuadro, con la fecha elegida, o la lista de «Antes de activar», desplegada. */
  const volverAhora = () => {
    const v = volverALaRevision;
    setVolverALaRevision(null);
    if (!v) return;
    if (v.desde === 'cuadro') return abrirElCuadro(v.cuando);
    setImpideAbierto(true);
    setPanelAbierto(true);
    setParaEnfocar('lo-que-impide-activar');
  };
  const conSuLugar = (p: ValidationIssue, texto: string) => ({ texto: `${dondeEsta(p, bloques)}: ${texto}`, ir: lugarDelProblemaDeEntrenamiento(p.path).bloque === null ? null : irDesdeElCuadro(p) });
  // Lo que impide activar: lo que el editor ve solo (al instante), lo que dijo la API de lo guardado y, hasta ED-08, la
  // app de la persona (la API todavía la espera).
  // C7: la escritura rápida sin aplicar no se activa ni se pierde: se resuelve antes, con «Ir a…» a su línea.
  const sinAplicar = lineasSinAplicar.map((x) => ({ issue: { code: SIN_APLICAR, path: x.ruta } as ValidationIssue, texto: COPY_ESCRITURA_RAPIDA.pendiente(x.texto) }));
  // DL-198 (pedido de la revisión de #324): las fases de más, con sus dos salidas también en el cuadro «Antes de activar».
  const fasesDeMasEnElCuadro = fasesDeMas > 0 ? [{ texto: COPY_FASES_DE_MAS.texto(semanasQueSumanLasFases(plan, bloques), plan.weeks ?? 0), ir: null, acciones: accionesDeLasFasesDeMas() }] : [];
  const impidenActivar = [
    ...fasesDeMasEnElCuadro,
    ...impideGuardar.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')),
    ...sinAplicar.map((x) => conSuLugar(x.issue, x.texto)),
    ...(revision?.estado === 'lista' && revision.version === version.version
      ? revision.problemas.filter((p) => !(p.code === 'PHASES_EXCEED_PLAN_WEEKS' && fasesDeMas > 0)).map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento'))
      : []),
  ];
  // TB-48: lo que queda sin completar no impide nada; se dice aparte, cada cosa con su lugar.
  // PG-10: los iguales del mismo ejercicio, en un renglón. Dentro del cuadro modal no se ofrece «Completar»: su
  // «Deshacer» vive en el aviso flotante, que con el cuadro abierto queda inerte y fuera del alcance del lector (revisión
  // de la tanda A). Cada aviso conserva su «Ir»; «Completar» sigue en el panel y en el asistente.
  const sinCompletarAlActivar = confirmar ? enGrupos(loQueQuedaSinCompletarEnEntrenamiento(bloques, herenciaDeLaIntensidad), conSuLugar).map((c) => ({ ...c, completar: null })) : [];
  // PLT (DL-182): «Antes de guardar». Lo de la plantilla entera se dice sin lugar; el nombre lleva a su campo.
  const enLaPlantilla = (p: ValidationIssue, texto: string): CosaParaRevisar =>
    DE_LA_PLANTILLA.has(p.path) ? { texto: texto.charAt(0).toUpperCase() + texto.slice(1), ir: p.path === 'name' ? irDesdeElCuadro(p) : null } : conSuLugar(p, texto);
  const impidenGuardar: CosaParaRevisar[] = plantilla
    ? [
        ...impideGuardar.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')),
        ...sinAplicar.map((x) => conSuLugar(x.issue, x.texto)),
        ...(revision?.estado === 'lista' && revision.version === version.version ? revision.problemas.map((p) => enLaPlantilla(p, PROBLEMA[p.code] ?? 'revisá este elemento')) : []),
      ]
    : [];
  const paraCompletarAlUsarla: CosaParaRevisar[] =
    plantilla && confirmar
      ? [
          ...(paraCompletar && paraCompletar.version === version.version ? paraCompletar.problemas.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')) : []),
          ...enGrupos(loQueQuedaSinCompletarEnEntrenamiento(bloques), conSuLugar).map((c) => ({ ...c, completar: null })),
        ]
      : [];
  // Lo que cambia frente a la versión de base, con las cargas que irían a la versión (D-2 de DL-108).
  const bloquesQueIrian = metadatos.conCargas ? bloques : sinCargasSugeridas({ blocks: bloques }).blocks;
  const cambiosFrenteALaBase =
    plantilla && confirmar && baseDeLaPlantilla
      ? compararEntrenamiento(baseDeLaPlantilla.bloques, bloquesQueIrian, {
          nombreDelEjercicio: (id) => nombres[id] ?? baseDeLaPlantilla.nombres[id] ?? 'Ejercicio',
          renglon: (p) => ejercicioPlegadoDelEditor(p, 0).resumen,
        })
      : baseDeLaPlantilla === undefined
        ? undefined
        : null;
  const cargasEscritas = plantilla ? ejerciciosConCargaEscrita({ blocks: bloques }) : 0;
  const nombresDeLaVigente = vigente?.plan ? nombresDe(vigente.plan) : {};
  // Frente a la vigente; en la primera versión, frente a nada: todo es «agregado». Sin la vigente leída, nada.
  const baseDeLaComparacion = vigente?.plan ? aEntrada(vigente.plan) : !comoPlan(version)?.predecessorPlanId ? [] : null;
  const cambiosFrenteALaVigente =
    confirmar && baseDeLaComparacion
      ? compararEntrenamiento(baseDeLaComparacion, bloques, {
          nombreDelEjercicio: (id) => nombres[id] ?? nombresDeLaVigente[id] ?? 'Ejercicio',
          // DL-192: los dos renglones, en la notación del borrador (la que se lee en el editor); si cambió, se dice.
          renglon: (p) => ejercicioPlegadoDelEditor(p, 0, notacion).resumen,
          ...(vigente?.plan
            ? { agendas: { vigente: vigente.plan.agenda, borrador: agendaVisible }, notaciones: { vigente: notacionDe(vigente.plan.effortNotation), borrador: notacion } }
            : {}),
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

  /**
   * DL-196 (E6): la fase nueva se llama con el primer «Fase N» libre (antes, con la cantidad: al quitar una, se repetía) y
   * nace con su identificador, para que sus semanas y sus anotaciones se guarden enseguida.
   */
  const agregarBloque = () => {
    const n = bloques.length;
    cambiar((x) => (x.push({ blockId: crypto.randomUUID(), label: nombreDeFaseNueva(x), sessions: [] }), x));
    elegirBloque(n);
    setFoco({ tipo: 'fase' });
    // DL-197 (ET1-03): nace con un nombre de compromiso y se abre «Editar fase» para cambiarlo (y sus semanas), en cuanto
    // la fase nueva es la elegida (la dirección cambia en el dibujo siguiente).
    setFaseQueSeAbre(n);
    setCuadroDelPlan('fase');
  };
  /** DL-196 (EE-02, E19): la fase anterior, copiada al final, con sus semanas, sus aproximaciones y los días de sus sesiones. */
  const duplicarLaFase = (desde: number) => {
    const original = bloques[desde];
    if (!original) return;
    // DL-197 (ET1-03): la copia va justo después de la original (antes, «Copiar la fase anterior» la ponía al final).
    const n = desde + 1;
    const copia = copiarLaFase(original, nombreDeFaseNueva(bloques), () => crypto.randomUUID());
    cambiar((x) => (x.splice(n, 0, copia.bloque), x));
    const conLaCopia = planificacionConLaCopia(plan, original.blockId, copia);
    cambiarPlanificacion(conLaCopia);
    // Los días se copian solo si la copia tiene fechas: sin ellas, sus sesiones irían todas las semanas junto con las de la
    // original, y la persona tendría las dos fases a la vez (EE-D02).
    // DL-197 (ET1-D03): sin contar el fin del plan: una copia que queda fuera tiene sus días igual (no va ninguna semana hasta
    // que se ajuste el plan, y entonces ya los tiene).
    const conFechas = (fechasDeLasFases({ ...conLaCopia, weeks: null }, [...bloques.slice(0, n), copia.bloque, ...bloques.slice(n)])[n] ?? null) !== null;
    const conDias = conFechas ? agendaConLaCopia(agendaVisible, copia) : agendaVisible;
    if (conDias !== agendaVisible) cambiarAgenda(conDias);
    const habiaDias = agendaVisible?.sessions.some((s) => copia.sesiones.has(s.sessionId)) ?? false;
    elegirBloque(n);
    setFoco({ tipo: 'fase' });
    setMensaje({
      tipo: 'exito',
      texto:
        conFechas || !habiaDias
          ? `«${nombreDelBloque(original, desde)}» copiada como «${copia.bloque.label}», con sus sesiones, sus semanas y sus días.`
          : `«${nombreDelBloque(original, desde)}» copiada como «${copia.bloque.label}», con sus sesiones. Los días no se copiaron: sin el inicio del plan y las semanas de cada fase, las dos fases irían todas las semanas a la vez.`,
    });
    // DL-196 parte B (E19): con la copia hecha, se ofrece aplicarle una progresión (o seguir la de la original).
    if (!plantilla && copia.bloque.blockId) {
      setProgresionAbierta({ blockId: copia.bloque.blockId, copia: { original: nombreDelBloque(original, desde), originalId: original.blockId ?? null, prescripciones: copia.prescripciones } });
    }
  };
  /** DL-196 parte B: los ejercicios de una fase, con sus nombres, para la progresión y la distribución. */
  const ejerciciosDeUnaFase = (b: BloqueE) => ejerciciosDeLaFase(b, (p) => nombres[p.exerciseVersionId] ?? 'Ejercicio', nombreDeLaSesion);
  const aproximacionesDeId = (id: string | null) => aproximacionesDe(plan, id);
  /**
   * DL-196 parte B (E12, E19): aplica lo elegido en el asistente. Desde una copia, «Arrancar donde terminó» corre las
   * cargas de trabajo de la copia a las de la última semana de la original (sin la descarga) antes de guardar la regla.
   */
  const aplicarLaProgresion = (blockId: string, nombre: string, a: AplicacionDeLaProgresion) => {
    let p = a.semanas !== null ? conSemanasDeLaFase(plan, blockId, a.semanas) : plan;
    const copia = progresionAbierta?.copia ?? null;
    if (a.arrancarDondeTermino && copia?.originalId) {
      const original = bloques.find((b) => b.blockId === copia.originalId);
      const regla = progresionDeLaFase(plan, copia.originalId);
      if (original && regla) {
        const ultimas = cargasDeLaUltimaSemana(vistaPrevia(regla, ejerciciosDeUnaFase(original), semanasDeLaFase(plan, copia.originalId) ?? 4, aproximacionesDeId));
        const nuevas = new Map([...copia.prescripciones].flatMap(([o, c]) => (ultimas.has(o) ? [[c, ultimas.get(o)!] as const] : [])));
        if (nuevas.size > 0) {
          cambiar((x) => {
            for (const b of x) {
              if (b.blockId !== blockId) continue;
              for (const ses of sesionesDeLaFase(b)) ses.prescriptions = ses.prescriptions.map((q) => (q.prescriptionId && nuevas.has(q.prescriptionId) ? conCargaDeTrabajo(q, nuevas.get(q.prescriptionId)!) : q));
            }
            return x;
          });
        }
      }
    }
    p = a.progresion ? conProgresion(p, a.progresion) : sinProgresion(p, blockId);
    cambiarPlanificacion(p, a.progresion ? COPY_DESHACER.aplicasteLaProgresion(nombre) : null);
    setProgresionAbierta(null);
    setMensaje({ tipo: 'exito', texto: a.progresion ? COPY_PROGRESIONES.aplicada(nombre) : COPY_PROGRESIONES.quitada(nombre) });
  };
  /** DL-197 (ET1-D10): cuántos ejercicios del plan tienen un criterio propio distinto del de esta intensidad. */
  const conOtraIntensidad = (i2: IntensidadElegida): number => {
    const criterio = i2 === 'RIR' || i2 === 'RPE' ? 'RIR' : i2 === 'PERCENT_RM' ? 'PERCENT_RM' : null;
    return bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]).flatMap((x) => x.prescriptions).filter((q) => q.intensity && q.intensity.criterion !== criterio).length;
  };
  /**
   * DL-197 (ET1-D10): «Pasarlos» a la intensidad del plan: los que tenían otra quedan sin criterio propio (heredan la del
   * plan, sin objetivo todavía: no traba el guardado) y sin el RIR de sus series, como al cambiar de criterio.
   */
  const pasarALaIntensidadDelPlan = (i2: PlanificacionDelPlan['intensity']) => {
    const criterio = criterioDeLaIntensidad(i2);
    const cuantos = bloques.flatMap((b) => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)]).flatMap((x) => x.prescriptions).filter((q) => q.intensity && q.intensity.criterion !== criterio).length;
    cambiar((x) => {
      for (const b of x)
        for (const ses of [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)])
          ses.prescriptions = ses.prescriptions.map((q) => (q.intensity && q.intensity.criterion !== criterio ? { ...q, intensity: null, sets: q.sets.map(({ rir: _r, ...y }) => y) } : q));
      return x;
    }, cuantos > 0 ? COPY_DESHACER.pasasteALaIntensidad(cuantos) : null);
  };
  /** GR-27 (DL-196 parte B): marca o desmarca un gráfico del panel como favorito de este plan. */
  const alternarFavorito = (kind: 'EXERCISE_LOAD' | 'PHASE_PROGRESSION' | 'PHASE_DISTRIBUTION', id: string | null | undefined) => {
    if (id) cambiarPlanificacion(conFavorito(plan, { kind, id }));
  };
  const estrella = (kind: 'EXERCISE_LOAD' | 'PHASE_PROGRESSION' | 'PHASE_DISTRIBUTION', id: string | null | undefined, deQue: string) =>
    !plantilla && id ? <EstrellaDeFavorito marcado={esFavorito(plan, { kind, id })} onCambiar={() => alternarFavorito(kind, id)} deQue={deQue} /> : null;
  const quitarBloque = () => {
    cambiar((x) => (x.splice(i, 1), x), COPY_DESHACER.quitasteLaFase(bloque?.label || `Fase ${i + 1}`));
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
    cambiar((x) => (x[i]!.microcycles!.splice(j, 1), x), COPY_DESHACER.quitasteLaSemana(bloque?.microcycles?.[j]?.label || `Semana ${j + 1}`));
    elegirMicrociclo(Math.max(0, j - 1));
  };
  const agregarSesion = () => {
    const n = sesiones.length;
    cambiar((x) => (lasSesiones(x).push(sesionVacia(n + 1)), x));
    elegirSesion(n);
    setTexto({ de: 'nombre-de-la-sesion', i, j, k: n });
  };
  /**
   * C11: «Sesiones vacías»: `cuantas` sesiones de una vez en la fase (o el microciclo) que se mira, sin pedir nombre ni
   * propósito (no se abre ningún campo); se mira la primera.
   */
  const topeDeSesiones = j !== null ? TOPES_DE_ENTRENAMIENTO.sesionesDelMicrociclo : TOPES_DE_ENTRENAMIENTO.sesionesDelBloque;
  const armarSesionesVacias = (cuantas: number) => {
    const n = sesiones.length;
    if (cuantas < 1 || n + cuantas > topeDeSesiones) return;
    cambiar((x) => (lasSesiones(x).push(...sesionesVacias(cuantas, n, () => crypto.randomUUID())), x));
    elegirSesion(n);
    setMensaje({ tipo: 'exito', texto: SV.armadas(cuantas, n) });
  };
  const quitarSesion = () => {
    cambiar((x) => (lasSesiones(x).splice(k, 1), x), COPY_DESHACER.quitasteLaSesion(sesion?.label || `Sesión ${k + 1}`));
    elegirSesion(Math.max(0, k - 1));
  };
  /** TB-48: la copia de la sesión va justo después, y se la mira con su nombre a la vista para cambiarlo. */
  const duplicarSesion = () => {
    // Revisión del tramo 2 (ENP-D17): la copia nace con su identificador, como «Agregar sesión»: sus días se eligen enseguida.
    cambiar((x) => (duplicarEn(lasSesiones(x), k, { ...copiaDeLaSesion(lasSesiones(x)[k]!, k), sessionId: crypto.randomUUID() }), x));
    elegirSesion(k + 1);
    setTexto({ de: 'nombre-de-la-sesion', i, j, k: k + 1 });
  };
  /** TB-48: mueve la sesión que se mira, con su identificador (la agenda no pierde sus días), y se la sigue mirando. */
  const moverSesion = (hacia: number) => {
    cambiar((x) => (mover(lasSesiones(x), k, hacia), x));
    elegirSesion(hacia);
  };
  /**
   * Una copia de la sesión habitual al final de las sesiones que se miran: sin los identificadores de sus ejercicios (el
   * servidor los asigna al guardar) y, desde la revisión del tramo 2 (ENP-D17), con uno nuevo para la sesión.
   */
  const insertarSesion = (h: SesionHabitual) => {
    const n = sesiones.length;
    setNombres((x) => ({ ...x, ...nombresDeHabitual(h) }));
    cambiar((x) => (lasSesiones(x).push({ ...structuredClone(h.structure), sessionId: crypto.randomUUID() }), x));
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
    // C7: lo escrito sin aplicar en el ejercicio que se quita se va con él.
    const p = sesion?.prescriptions[l];
    // Revisión del tramo 2: lo escrito en los de más abajo que todavía no tienen identificador sube con ellos.
    if (p && sesion) setLineas((m) => lineasTrasReordenar(conLaLinea(m, claveDeLaLinea(`${prefijo}-s${k}`, l, p.prescriptionId), ''), `${prefijo}-s${k}`, ordenTrasQuitar(sesion.prescriptions.length, l)));
    cambiar((x) => (lasSesiones(x)[k]!.prescriptions.splice(l, 1), x), COPY_DESHACER.quitasteElEjercicio(p ? (nombres[p.exerciseVersionId] ?? 'el ejercicio') : 'el ejercicio'));
    // Lo abierto acompaña a su ejercicio: los de más abajo suben un lugar.
    dejarAbiertos(posicionesTrasQuitar(abiertos, l));
  };
  /**
   * TB-48: sube o baja un ejercicio; lo abierto lo acompaña. DL-181: dentro de un bloque, entre los del bloque; uno suelto
   * salta un bloque entero (`bloques-del-editor.ts`).
   */
  const moverEjercicio = (l: number, hacia: -1 | 1) => {
    if (!sesion) return;
    const r = moverEnLaSesion(sesion, l, hacia);
    if (r) aplicarReordenada(r);
  };
  /** DL-181: escribe la sesión que dejó una operación de bloques y hace que lo abierto acompañe a cada ejercicio. */
  const aplicarReordenada = (r: SesionReordenada) => {
    // DL-199 (ET3-D20): cada movimiento se deshace solo, aunque vengan seguidos.
    cambiar((x) => ((lasSesiones(x)[k] = r.sesion), x), null, true);
    dejarAbiertos(abiertosTrasReordenar(abiertos, r.desdeDonde));
    // Revisión del tramo 2: lo escrito sin aplicar en uno sin identificador también acompaña a su ejercicio.
    setLineas((m) => lineasTrasReordenar(m, `${prefijo}-s${k}`, r.desdeDonde));
  };
  // DL-199 (ET3-22): soltar un ejercicio en otro lugar es subirlo o bajarlo de a un paso, con la regla de «Subir» y «Bajar»
  // (un bloque no se rompe); Alt+↑ y Alt+↓, un paso. El foco vuelve al asa del ejercicio movido.
  sesionQueSeArrastra.current = sesion
    ? {
        largo: sesion.prescriptions.length,
        alMover: (desde, hasta) => {
          const r = moverHasta(sesion, sesion.prescriptions.length, desde, hasta, moverEnLaSesion);
          if (!r) return null;
          aplicarReordenada(r);
          return r.posicion;
        },
        nombreDe: (l) => nombres[sesion.prescriptions[l]?.exerciseVersionId ?? ''] ?? 'Ejercicio',
        idDelAsa: (l) => `asa-${prefijo}-s${k}-p${l}`,
        alEnfocar: (id) => setParaEnfocar(id),
      }
    : null;
  // ── DL-181: los bloques de la sesión ─────────────────────────────────────────────────────────────────────────
  const claveDelBloque = (groupId: string) => `${prefijo}-s${k}-${groupId}`;
  // §7: el tope de bloques de la sesión (el del contrato), dicho antes de tocar.
  const sinAgregarBloque = sesion ? motivoSinAgregarBloque(sesion.exerciseGroups?.length ?? 0) : null;
  const agregarUnBloqueALaSesion = () => {
    if (!sesion || sinAgregarBloque) return;
    const r = agregarBloqueALaSesion(sesion);
    cambiar((x) => ((lasSesiones(x)[k] = r.sesion), x));
    // Nace con un nombre de compromiso y con su campo abierto: lo que se escribe lo reemplaza.
    setRenombrandoBloque(claveDelBloque(r.bloque.groupId));
  };
  const cambiarLaSesion = (f: (s: SesionE) => SesionE) => cambiar((x) => ((lasSesiones(x)[k] = f(lasSesiones(x)[k]!)), x));
  /**
   * ENP-D05: las vueltas igualan las series; si alguna serie cambió, «Deshacer» devuelve la sesión como estaba. Varios
   * cambios de vueltas seguidos en el mismo bloque (las flechas en la lista) se deshacen juntos: vuelve a como estaba antes
   * del primero (`deshacerTrasCambiarLasVueltas`).
   */
  const conLasVueltas = (groupId: string, f: (s: SesionE) => CambioDeVueltas) => {
    if (!sesion) return;
    const r = f(sesion);
    const previo = deshacerLaSesion;
    cambiar((x) => ((lasSesiones(x)[k] = r.sesion), x));
    const siguiente = deshacerTrasCambiarLasVueltas(previo, `${prefijo}-s${k}`, groupId, sesion, r);
    if (siguiente) setDeshacerLaSesion({ ...siguiente, donde: { i, j, k } });
  };
  const deshacerLasVueltas = () => {
    if (!deshacerLaSesion) return;
    const { donde, sesion: antes } = deshacerLaSesion;
    cambiar((x) => ((sesionesDelGrupo(x, donde)[donde.k] = structuredClone(antes)), x));
    setMensaje({ tipo: 'exito', texto: COPY_PRESETS.deshecho });
  };
  /**
   * ENP-D10 y ENP-D18: el preset elegido con la sesión vacía, para los ejercicios que se agreguen a esta sesión, atado a su
   * identificador: si se quita o se mueve otra sesión, no pasa a la que quedó en su lugar. Una sesión sin identificador
   * todavía (una habitual recién insertada) lo recibe al elegir el preset.
   */
  const claveDeEstaSesion = sesion?.sessionId ?? null;
  const prescripcionDeEstaSesion = claveDeEstaSesion ? (prescripcionDeLaSesion[claveDeEstaSesion] ?? null) : null;
  /** Un ejercicio de la sesión que se mira, suelto o dentro de su bloque (DL-181: ahí su título es de un nivel más). */
  const ejercicioEnLaSesion = (l: number, enBloque: boolean) => {
    if (!sesion) return null;
    const p = sesion.prescriptions[l]!;
    const nombre = nombres[p.exerciseVersionId] ?? 'Ejercicio';
    const suyo = p.exerciseGroupId ? (sesion.exerciseGroups ?? []).findIndex((g) => g.groupId === p.exerciseGroupId) : -1;
    const claveDeSuLinea = claveDeLaLinea(`${prefijo}-s${k}`, l, p.prescriptionId);
    return (
      <EjercicioDelEditor
        key={p.prescriptionId ?? `nuevo-${l}`}
        id={`${prefijo}-s${k}-p${l}`}
        posicion={l}
        // C7: lo escrito sin aplicar vive acá, por ejercicio: plegarlo o ir a otra sesión no lo borra.
        lineaSinAplicar={lineas[claveDeSuLinea] ?? ''}
        onLineaSinAplicar={(t) => setLineas((m) => conLaLinea(m, claveDeSuLinea, t))}
        nivel={enBloque ? 'h4' : 'h3'}
        prescripcion={p}
        nombre={nombre}
        imagen={imagenes[p.exerciseVersionId] ?? null}
        // DL-196 (EE-07): las aproximaciones, con cómo se arman guardado en la planificación (por el identificador del
        // ejercicio: si todavía no tiene, lo recibe ahora). DL-198 (ET2-10): también en una plantilla.
        aproximaciones={aproximacionesDe(plan, p.prescriptionId)}
        onAproximaciones={(c) => {
          const id = p.prescriptionId ?? crypto.randomUUID();
          if (!p.prescriptionId) cambiarEjercicio(l, { prescriptionId: id });
          cambiarPlanificacion(conAproximaciones(plan, { ...c, prescriptionId: id }));
        }}
        // DL-197 (ET1-D11): la intensidad del plan, que hereda; la excepción «sin intensidad» vive en la planificación.
        intensidadDelPlan={criterioDeLaIntensidad(plan.intensity)}
        sinIntensidad={!!p.prescriptionId && (plan.withoutIntensity ?? []).includes(p.prescriptionId)}
        onSinIntensidad={(sin) => {
          const id = p.prescriptionId ?? crypto.randomUUID();
          if (!p.prescriptionId) cambiarEjercicio(l, { prescriptionId: id });
          const otros = (plan.withoutIntensity ?? []).filter((x) => x !== id);
          cambiarPlanificacion({ ...plan, withoutIntensity: sin ? [...otros, id] : otros });
        }}
        // ET2-D05: el redondeo de las cargas del % RM, el del plan o la excepción del ejercicio (en la planificación).
        redondeo={redondeoDelEjercicio(plan, p.prescriptionId)}
        redondeoPropio={(p.prescriptionId ? plan.loadRoundingByExercise?.find((r) => r.prescriptionId === p.prescriptionId)?.step : undefined) ?? null}
        onRedondeo={(r) => {
          const id = p.prescriptionId ?? crypto.randomUUID();
          if (!p.prescriptionId) cambiarEjercicio(l, { prescriptionId: id });
          const otros = (plan.loadRoundingByExercise ?? []).filter((x) => x.prescriptionId !== id);
          cambiarPlanificacion({ ...plan, loadRoundingByExercise: r === null ? otros : [...otros, { prescriptionId: id, step: r }] });
        }}
        // PLT (DL-182): sin persona, sin la fuerza estimada ni «La vez pasada»: el ejercicio del catálogo no se pasa.
        exerciseId={asesoradoId === null ? null : (ejercicios[p.exerciseVersionId] ?? null)}
        abierto={abiertos.has(l)}
        problemas={problemasDelEjercicio(rutasConProblemas, { bloque: i, microciclo: j, sesion: k, ejercicio: l })}
        alAlternar={() => {
          const s = new Set(abiertos);
          if (!s.delete(l)) s.add(l);
          dejarAbiertos(s);
        }}
        onCambiar={(c) => cambiarEjercicio(l, c)}
        onQuitar={() => quitarEjercicio(l)}
        arrastre={arrastre.para(l)}
        esElPrimero={moverEnLaSesion(sesion, l, -1) === null}
        esElUltimo={moverEnLaSesion(sesion, l, 1) === null}
        onSubir={() => moverEjercicio(l, -1)}
        onBajar={() => moverEjercicio(l, 1)}
        onDuplicar={() => duplicarEjercicio(l)}
        onCopiar={(que) => setCopiando({ que, l })}
        revisar={cargaARevisar(`${prefijo}-s${k}`, p)}
        onAplicarLinea={(nueva, revisar) => {
          cambiar((x) => ((lasSesiones(x)[k]!.prescriptions[l] = nueva), x));
          marcarCargas(`${prefijo}-s${k}`, [{ p: nueva, texto: revisar }]);
        }}
        // DL-181: pasar el ejercicio a otro bloque de la sesión, o sacarlo del suyo.
        accionesDelBloque={[
          ...otrosBloques(sesion, l).map((g) => ({
            clave: `pasar-a-${g.groupId}`,
            texto: COPY_BLOQUES_DE_LA_SESION.moverAlBloque(nombreDelBloqueDeLaSesion(g, (sesion.exerciseGroups ?? []).indexOf(g))),
            alElegir: () => aplicarReordenada(pasarAlBloque(sesion, l, g.groupId)),
          })),
          ...(suyo >= 0 ? [{ clave: 'sacar-del-bloque', texto: COPY_BLOQUES_DE_LA_SESION.sacarDelBloque, alElegir: () => aplicarReordenada(pasarAlBloque(sesion, l, null)) }] : []),
        ]}
      />
    );
  };
  /** TB-48: la copia del ejercicio, con sus series y lo general, justo después y abierta. */
  const duplicarEjercicio = (l: number) => {
    cambiar((x) => (duplicarEn(lasSesiones(x)[k]!.prescriptions, l, copiaDelEjercicio(lasSesiones(x)[k]!.prescriptions[l]!)), x));
    dejarAbiertos(new Set([...posicionesTrasInsertar(abiertos, l + 1), l + 1]));
    // Revisión del tramo 2: lo escrito sin aplicar en los de más abajo sin identificador baja con ellos (la copia no lo lleva).
    if (sesion) setLineas((m) => lineasTrasReordenar(m, `${prefijo}-s${k}`, ordenTrasDuplicar(sesion.prescriptions.length, l)));
    // La copia no se lleva el foco: se dice dónde quedó (DL-113).
    setMensaje({ tipo: 'exito', texto: E.duplicado });
  };

  // ── ED-23 y ED-24: copiar la sesión a otro lugar, y el ejercicio, su prescripción o sus series ─────────────────
  const claveDelGrupo = (g: { readonly i: number; readonly j: number | null }) => `${g.i}:${g.j ?? ''}`;
  const delCuadroDeCopiar = (() => {
    if (!copiando || !sesion) return null;
    const nombreDeEstaSesion = nombreDeLaSesion(sesion, k);
    if (!('l' in copiando)) {
      const destinos = destinosDeLaSesion(bloques, { i, j }, copiando.que === 'semana');
      const grupo = (clave: string | undefined) => destinos.find((g) => claveDelGrupo(g) === clave);
      return {
        titulo: COPY_COPIAR.tituloDeLaSesion(nombreDeEstaSesion),
        leyenda: COPY_COPIAR.destino,
        varios: false,
        vacio: copiando.que === 'semana' ? COPY_COPIAR.sinOtraSemana : COPY_COPIAR.sinOtroLugar,
        opciones: destinos.map((g) => ({ clave: claveDelGrupo(g), nombre: g.nombre })),
        queSeCopia: null,
        vistaPrevia: (el: readonly string[]) => {
          const g = grupo(el[0]);
          return g ? vistaPreviaDeLaSesion(bloques, { i, j, k }, g) : null;
        },
        textoDelPrincipal: (el: readonly string[]) => (grupo(el[0]) ? COPY_COPIAR.copiarA(grupo(el[0])!.nombre) : COPY_COPIAR.copiar),
        onCopiar: (el: readonly string[]) => {
          const g = grupo(el[0]);
          if (!g) return COPY_COPIAR.elegiUnDestino;
          const r = copiarLaSesion(bloques, { i, j, k }, g);
          if (r.tipo === 'no-se-puede') return vistaPreviaDeLaSesion(bloques, { i, j, k }, g);
          cambiar(() => r.bloques);
          setCopiando(null);
          setMensaje({ tipo: 'exito', texto: COPY_COPIAR.copiada(g.nombre) });
          return null;
        },
      };
    }
    const l = copiando.l;
    const p = sesion.prescriptions[l];
    if (!p) return null;
    const nombreDelEjercicio = nombres[p.exerciseVersionId] ?? 'Ejercicio';
    if (copiando.que === 'ejercicio') {
      const destinos = sesionesDelPlan(bloques).filter((s) => !(s.i === i && s.j === j && s.k === k));
      const destino = (clave: string | undefined) => destinos.find((s) => `${claveDelGrupo(s)}:${s.k}` === clave);
      return {
        titulo: COPY_COPIAR.tituloDelEjercicio(nombreDelEjercicio, 'ejercicio'),
        leyenda: COPY_COPIAR.destino,
        varios: false,
        vacio: COPY_COPIAR.sinOtraSesion,
        opciones: destinos.map((s) => ({ clave: `${claveDelGrupo(s)}:${s.k}`, nombre: s.nombre })),
        queSeCopia: null,
        vistaPrevia: (el: readonly string[]) => (destino(el[0]) ? `Se suma «${nombreDelEjercicio}», con sus series y lo general, al final de ${destino(el[0])!.nombre}.` : null),
        textoDelPrincipal: (el: readonly string[]) => (destino(el[0]) ? COPY_COPIAR.copiarA(destino(el[0])!.nombre) : COPY_COPIAR.copiar),
        onCopiar: (el: readonly string[]) => {
          const s = destino(el[0]);
          if (!s) return COPY_COPIAR.elegiUnDestino;
          const r = copiarElEjercicio(bloques, { i, j, k, l }, s);
          if (r.tipo === 'no-se-puede') return r.motivo === 'TOPE' ? COPY_COPIAR.topeDeEjercicios : COPY_COPIAR.elegiUnDestino;
          cambiar(() => r.bloques);
          setCopiando(null);
          setMensaje({ tipo: 'exito', texto: COPY_COPIAR.copiada(s.nombre) });
          return null;
        },
      };
    }
    const que: 'prescripcion' | 'series' = copiando.que === 'series' ? 'series' : 'prescripcion';
    const otros = sesion.prescriptions.flatMap((x, m) => (m === l ? [] : [{ clave: String(m), nombre: `${m + 1}. ${nombres[x.exerciseVersionId] ?? 'Ejercicio'}` }]));
    const nombreDe = (x: PrescripcionE) => nombres[x.exerciseVersionId] ?? 'Ejercicio';
    return {
      titulo: COPY_COPIAR.tituloDelEjercicio(nombreDelEjercicio, que),
      leyenda: COPY_COPIAR.elegidos,
      varios: true,
      vacio: COPY_COPIAR.sinOtrosEjercicios,
      opciones: otros,
      queSeCopia: que === 'prescripcion' ? COPY_COPIAR.queSeCopiaDeLaPrescripcion : COPY_COPIAR.queSeCopiaDeLasSeries,
      vistaPrevia: (el: readonly string[]) => loQueSeReemplaza(bloques, { i, j, k, l }, el.map(Number), que, nombreDe),
      textoDelPrincipal: (el: readonly string[]) => COPY_COPIAR.copiarAEstos(el.length),
      onCopiar: (el: readonly string[]) => {
        if (el.length === 0) return COPY_COPIAR.elegiAlMenosUno;
        cambiar(() => copiarSobre(bloques, { i, j, k, l }, el.map(Number), que));
        setCopiando(null);
        setMensaje({ tipo: 'exito', texto: COPY_COPIAR.copiada(el.length === 1 ? '1 ejercicio' : `${el.length} ejercicios`) });
        return null;
      },
    };
  })();

  /**
   * Lleva a donde está un problema: elige su bloque, su microciclo y su sesión, abre su ejercicio y deja el foco ahí
   * (en el dato que hay que corregir, en el renglón del ejercicio o en el menú de lo que lo tiene). Si lo que falta es
   * un nombre, abre su campo.
   */
  const irAlProblema = (p: ValidationIssue) => {
    // PLT (DL-182): el nombre de una plantilla nueva se escribe en la cabecera.
    if (plantilla && p.path === 'name') return setParaEnfocar('nombre-de-la-plantilla');
    const l = lugarDelProblemaDeEntrenamiento(p.path);
    if (l.bloque === null) return;
    setInsertandoHabitual(false);
    ir({
      // ED-14: desde el paso «Revisar» del asistente, corregir es ir a la estación (el borrador es el mismo).
      asistente: null,
      bloque: pedidoDeLaPosicion(l.bloque),
      micro: l.microciclo === null ? null : pedidoDeLaPosicion(l.microciclo),
      sesion: l.sesion === null ? null : pedidoDeLaPosicion(l.sesion),
      ejercicios: l.ejercicio === null ? null : pedidoDeEjerciciosDelEditor(new Set([l.ejercicio])),
    });
    // DL-181: un problema de un bloque de la sesión lleva a su título (y, si le falta el nombre, abre su campo). Va antes
    // que el nombre de la sesión: la ruta de un bloque (`…sessions[k].exerciseGroups[n]`) también es «de la sesión», y
    // «Ir a…» abría el nombre de la sesión en lugar del suyo.
    if (l.sesion !== null && l.ejercicio === null) {
      const delGrupo = `b${l.bloque}${l.microciclo === null ? '' : `-m${l.microciclo}`}-s${l.sesion}`;
      const s = (l.microciclo === null ? bloques[l.bloque]?.sessions : bloques[l.bloque]?.microcycles?.[l.microciclo]?.sessions)?.[l.sesion];
      const delBloque = destinoDelProblemaDelBloque(p, s, delGrupo);
      if (delBloque) return 'renombrar' in delBloque ? setRenombrandoBloque(delBloque.renombrar) : setParaEnfocar(delBloque.enfocar);
    }
    if (p.code === N.faltaElNombre) {
      return setTexto({ de: l.sesion !== null ? 'nombre-de-la-sesion' : l.microciclo !== null ? 'nombre-del-microciclo' : 'nombre-del-bloque', i: l.bloque, j: l.microciclo, k: l.sesion });
    }
    // C9: lo que falta se ubica donde se agrega: una fase sin sesiones, en «Agregar sesión»; una sesión sin ejercicios,
    // en «Agregar ejercicios».
    if (l.sesion === null) return setParaEnfocar(p.code === 'SESSION_REQUIRED' ? 'agregar-sesion' : l.microciclo === null ? 'menu-del-bloque' : 'menu-del-microciclo');
    if (l.ejercicio === null) return setParaEnfocar(p.code === 'PRESCRIPTION_REQUIRED' ? 'agregar-ejercicios-a-la-sesion' : 'menu-de-la-sesion');
    setParaEnfocar(camposDelProblema(p, `b${l.bloque}${l.microciclo === null ? '' : `-m${l.microciclo}`}-s${l.sesion}-p${l.ejercicio}`, l.serie));
  };

  const agregarUnaSesion = (
    <MenuDeAcciones
      id="agregar-sesion"
      rotulo="agregar una sesión"
      texto={COPY_SEMANA_TIPO.nuevaSesion}
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
    bloque && sesion
      ? [
          nombreDelBloque(bloque, i),
          ...(microciclo && j !== null ? [nombreDelMicrociclo(microciclo, j)] : []),
          nombreDeLaSesion(sesion, k),
          // DL-181: el bloque al que suma, si se abrió desde su pie.
          ...(agregandoEn !== null ? (sesion.exerciseGroups ?? []).flatMap((g, n) => (g.groupId === agregandoEn ? [nombreDelBloqueDeLaSesion(g, n)] : [])) : []),
        ].join(' · ')
      : null;

  // ── ED-25: «Antes de activar», en vivo en el panel ─────────────────────────────────────────────────────────
  // Lo mismo que dice el cuadro (lo que el editor ve solo, lo que dijo la API de lo guardado y, hasta ED-08, la app de la
  // persona), cada cosa con su lugar; desde el panel, «Ir a corregir» va directo, sin cuadro que cerrar.
  const enElPanel = (p: ValidationIssue, texto: string) => ({ texto: `${dondeEsta(p, bloques)}: ${texto}`, ir: lugarDelProblemaDeEntrenamiento(p.path).bloque === null ? null : () => irDesdeElPanel(p) });
  // ENP-D13: la revisión honesta. Lo que dijo la API vale solo para la versión que revisó y mientras no haya cambios.
  const revisionVigente = revision && revision.version === version.version && !sucio ? revision : null;
  const estadoDeLaRevision: EstadoDeLaRevision = revisionVigente ? (revisionVigente.estado === 'revisando' ? 'revisando' : revisionVigente.estado) : 'pendiente';
  const impedimento = (p: ValidationIssue): Impedimento => {
    const lugar = dondeEsta(p, bloques);
    // PLT (DL-182): el nombre de una plantilla nueva tiene su lugar: su campo, en la cabecera.
    const alNombre = plantilla !== null && p.path === 'name';
    const sePuedeIr = lugarDelProblemaDeEntrenamiento(p.path).bloque !== null || alNombre;
    return { lugar, texto: PROBLEMA[p.code] ?? 'revisá este elemento', destino: sePuedeIr ? (alNombre ? PLT.irAlNombre : destinoDelLugar(lugar)) : null, ir: sePuedeIr ? () => irDesdeElPanel(p) : null };
  };
  const delEditor: Impedimento[] = [
    ...(fasesDeMas > 0
      ? [
          {
            lugar: 'Plan',
            texto: COPY_FASES_DE_MAS.texto(semanasQueSumanLasFases(plan, bloques), plan.weeks ?? 0),
            destino: null,
            ir: null,
            acciones: accionesDeLasFasesDeMas(),
          } satisfies Impedimento,
        ]
      : []),
    ...impideGuardar.map(impedimento),
    // C7: la escritura rápida sin aplicar, con «Ir a…» a su línea.
    ...sinAplicar.map((x) => ({ ...impedimento(x.issue), texto: x.texto })),
  ];
  /** ET1-D03: las dos salidas de las fases de más, en el panel y en el cuadro «Antes de activar» (DL-198). */
  function accionesDeLasFasesDeMas(): NonNullable<Impedimento['acciones']> {
    const recortadas = conLaUltimaFaseRecortada(plan, bloques);
    const ultima = [...bloques].map((b, n) => ({ b, n })).reverse().find(({ b }) => (semanasDeLaFase(plan, b.blockId) ?? 0) > 0);
    return [
              {
                texto: COPY_FASES_DE_MAS.llevar(semanasQueSumanLasFases(plan, bloques)),
                alTocar: () => {
                  const n = semanasQueSumanLasFases(plan, bloques);
                  alCambiarElPlan({ ...plan, weeks: n });
                  setMensaje({ tipo: 'exito', texto: COPY_FASES_DE_MAS.llevado(n) });
                },
                clave: 'llevar-el-plan',
              },
              {
                texto: COPY_FASES_DE_MAS.recortar,
                noSePuede: recortadas ? null : COPY_FASES_DE_MAS.noAlcanza,
                alTocar: () => {
                  if (!recortadas || !ultima) return;
                  cambiarPlanificacion(recortadas);
                  setMensaje({ tipo: 'exito', texto: COPY_FASES_DE_MAS.recortada(nombreDelBloque(ultima.b, ultima.n), semanasDeLaFase(recortadas, ultima.b.blockId) ?? 0) });
                },
                clave: 'recortar-la-ultima',
              },
    ];
  }
  const delServidor: Impedimento[] = revisionVigente?.estado === 'lista' ? revisionVigente.problemas.filter((p) => !(p.code === 'PHASES_EXCEED_PLAN_WEEKS' && fasesDeMas > 0)).map(impedimento) : [];
  const cuantosImpiden = delEditor.length + delServidor.length;
  const revisionEnElPanel = (
    <RevisionDelPlan estado={estadoDeLaRevision} sinGuardar={sucio} delServidor={delServidor} delEditor={delEditor} motivoSinRevisar={motivoSinRevisar} guardando={guardando} onRevisar={() => void revisarAhora()} para={plantilla ? 'guardar' : 'activar'} />
  );
  const sinCompletarEnVivo = enGrupos(loQueQuedaSinCompletarEnEntrenamiento(bloques, herenciaDeLaIntensidad), enElPanel);
  /** El nombre de una sesión por su identificador, como lo dice la agenda. */
  const nombreDeLaSesionPorId = (id: string): string => sesionesDeLaAgenda.find((x) => x.sessionId === id)?.nombre ?? C.sesion;

  // ── DJ-8: la marca «escrita para 6-8: revisala», por sesión y con la firma del ejercicio como quedó ───────────────
  const marcarCargas = (clave: string, filas: readonly { readonly p: PrescripcionE; readonly texto: string | null }[]) =>
    setCargasARevisar((m) => {
      const firmas = new Set(filas.map((f) => firmaDeLaCarga(f.p)));
      const nuevas = filas.flatMap((f) => (f.texto ? [{ texto: f.texto, firma: firmaDeLaCarga(f.p) }] : []));
      return { ...m, [clave]: [...(m[clave] ?? []).filter((x) => !firmas.has(x.firma)), ...nuevas] };
    });
  const cargaARevisar = (clave: string, p: PrescripcionE): string | null => {
    const firma = firmaDeLaCarga(p);
    return (cargasARevisar[clave] ?? []).find((x) => x.firma === firma)?.texto ?? null;
  };

  // ── ED-11: aplicar un preset y deshacerlo ────────────────────────────────────────────────────────────────────
  /** DJ-8: escribe las prescripciones nuevas en la sesión que se mira; «Deshacer» guarda las de antes. */
  const aplicarElPreset = (a: AlcanceDelPreset, nombre: string) => {
    const lugar = { i, j, k };
    cambiar((x) => {
      const s = lasSesiones(x)[k]!;
      s.prescriptions = conLasDeLaPosicion(s.prescriptions, a.nuevas);
      return x;
    });
    const filas = a.filas.map((f) => ({ p: a.nuevas.get(f.posicion)!, texto: f.cambio.carga.revisar }));
    marcarCargas(claveDeLaSesion(lugar, k), filas);
    setDeshacer({ texto: `«${nombre}»: ${COPY_PRESETS.aplicado(a.filas.length)}`, lugar, antes: a.antes, firmas: new Set(filas.map((f) => firmaDeLaCarga(f.p))) });
  };
  /** La operación inversa: vuelve a escribir las prescripciones de antes, que se guardan como cualquier cambio. */
  const deshacerLaAplicacion = () => {
    if (!deshacer) return;
    const { lugar, antes, firmas } = deshacer;
    cambiar((x) => {
      const s = sesionesDelGrupo(x, lugar)[lugar.k]!;
      s.prescriptions = conLasDeLaPosicion(s.prescriptions, antes);
      return x;
    });
    // Las marcas de lo que se deshace se van con ello.
    const clave = claveDeLaSesion(lugar, lugar.k);
    setCargasARevisar((m) => ({ ...m, [clave]: (m[clave] ?? []).filter((x) => !firmas.has(x.firma)) }));
    setMensaje({ tipo: 'exito', texto: COPY_PRESETS.deshecho });
  };
  /** ED-11: un preset de estructura se suma a las sesiones que se miran y reemplaza solo las que no tienen nada propio. */
  const tieneDias = (s: SesionE) => !!s.sessionId && (agendaVisible?.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays.length ?? 0) > 0;
  const aplicarLaEstructura = (p: PresetDeEstructura) => {
    cambiar((x) => {
      conLaEstructura(lasSesiones(x), p.sesiones.map((s) => s.nombre), tieneDias);
      return x;
    });
    setDiasDelPreset(Object.fromEntries(p.sesiones.map((s) => [s.nombre, s.dias])));
    setMensaje({ tipo: 'exito', texto: COPY_PRESETS.estructuraEscribe(p.sesiones.length) });
  };

  /** ED-24: los días de una sesión en siete chips y «Sin día»; la estación y el paso 5 del asistente usan los mismos. */
  const chipsDeDias = (s: SesionE, n: number) => {
    // PLT (DL-182): una plantilla no tiene días: se eligen en el plan de cada persona.
    if (plantilla) return null;
    const id = s.sessionId;
    if (!id) return <p className="nota">{CE.primeroGuardar}</p>;
    const dias = agendaVisible?.sessions.find((x) => x.sessionId === id)?.weekdays ?? [];
    return (
      <div className="estacion__chips" role="group" aria-label={CE.diasDe(nombreDeLaSesion(s, n))}>
        {DIAS_DE_LA_SEMANA.map((d) => (
          <button key={d} type="button" className="estacion__chip" aria-pressed={dias.includes(d)} aria-label={nombreDelChip(d)} data-dia={d}                   onClick={() => cambiarAgenda(agendaDelPlan(alternarDia(agendaVisible, id, d, inicioDeLaAgenda)))}>
            {DIA_CORTO[d]}
          </button>
        ))}
        <button type="button" className="estacion__chip estacion__chip--sin-dia" aria-pressed={dias.length === 0} onClick={() => agendaVisible && cambiarAgenda(sinDias(agendaVisible, id))}>
          {CE.sinDia}
        </button>
      </div>
    );
  };
  /** ED-20: los días que trajo un preset, marcados «del preset», para confirmar. */
  const diasDelPresetDe = (s: SesionE) => {
    if (plantilla) return null;
    const id = s.sessionId;
    const dias = id ? (agendaVisible?.sessions.find((x) => x.sessionId === id)?.weekdays ?? []) : [];
    const delPreset = diasDelPreset[s.label] ?? [];
    return id && dias.length === 0 && delPreset.length > 0 ? (
      <button type="button" className="boton boton--discreto" data-dias-del-preset onClick={() => cambiarAgenda(ponerDias(agendaVisible, id, delPreset, hoyEn()))}>
        {CE.confirmarDelPreset(delPreset.map((d) => DIA_LARGO[d]).join(', '))}
      </button>
    ) : null;
  };

  // ── ED-14 y ED-20: el asistente, sobre el mismo borrador y las mismas operaciones que la estación ─────────────────
  // Cada paso escribe solo lo que toca (con `cambiar` o `cambiarAgenda`, como la estación): lo que no muestra (los
  // valores propios de una serie, las notas, los parámetros) viaja intacto (TEST-EDP-021 y TEST-EDP-055).
  // PLT (DL-182): el asistente arma el plan de una persona (sus días, activarlo): en una plantilla no está.
  const pasoDelAsistente = plantilla ? null : pasoPedido(parametros.get('asistente'));
  const sugerido = pasoQueSigue(bloques, agendaVisible);
  const irAlPaso = (n: PasoDelAsistente | null) => {
    setNoAvanzo(false);
    ir({ asistente: n === null ? null : String(n) });
  };
  /** TEST-EDP-017: «Siguiente» guarda y espera la respuesta; si falla, no avanza. Con un autoguardado en viaje, espera. */
  const siguiente = async (n: PasoDelAsistente) => {
    setNoAvanzo(false);
    setAvanzando(true);
    const decision = await sePuedeAvanzar({ sucio, guardando, guardar: () => guardar() });
    setAvanzando(false);
    if (decision === 'espera') return setAvanzarA(n);
    if (decision === 'no-avanza') return setNoAvanzo(true);
    irAlPaso(n);
  };
  siguienteRef.current = siguiente;
  // Los pasos 2 a 5 recorren todas las sesiones del plan, por bloque y por semana (como `pasoQueSigue`).
  const grupos = gruposDelAsistente(bloques);
  const conVariosGrupos = grupos.length > 1;
  const TituloDeSesion = conVariosGrupos ? 'h5' : 'h4';
  /** Llevar la estación a una sesión de otro grupo: el cajón de ejercicios y la galería escriben en la que se mira. */
  const mirarLaSesion = (g: GrupoDelAsistente, n: number) => {
    setParaEnfocar(null);
    ir({ bloque: pedidoDeLaPosicion(g.i), micro: g.j !== null ? pedidoDeLaPosicion(g.j) : null, sesion: pedidoDeLaPosicion(n), ejercicios: null });
  };
  const conCadaSesion = (f: (s: SesionE, n: number, g: GrupoDelAsistente) => ReactNode, alPie?: (g: GrupoDelAsistente) => ReactNode) =>
    grupos.length === 0 ? (
      <p className="nota">{C.sinSesiones}</p>
    ) : (
      grupos.map((g) => (
        <div key={`${g.i}-${g.j ?? ''}`} className="asistente__grupo" data-grupo-del-asistente={claveDeLaSesion(g, 0).replace(/-s0$/, '')}>
          {conVariosGrupos ? <h4 className="asistente__grupo-titulo">{g.titulo}</h4> : null}
          {g.sesiones.length === 0 ? (
            <p className="nota">{C.sinSesiones}</p>
          ) : (
            <ol className="asistente__sesiones">
              {g.sesiones.map((s, n) => (
                <li key={s.sessionId ?? `nueva-${n}`} className="asistente__sesion" data-sesion-del-asistente={n + 1}>
                  {f(s, n, g)}
                </li>
              ))}
            </ol>
          )}
          {alPie?.(g)}
        </div>
      ))
    );
  const contenidoDelPaso = (p: PasoDelAsistente): { titulo: string; cuerpo: ReactNode } => {
    switch (p) {
      case 1:
        return {
          titulo: CA.puntoDePartida,
          cuerpo: (
            <>
              <p>{CA.yaHayBorrador}</p>
              <button
                type="button"
                className="boton boton--quieto"
                onClick={() => {
                  setFalloDelDescarte(null);
                  setDescartar(true);
                }}
              >
                {COPY_DESCARTAR_LA_VERSION.accion}
              </button>
            </>
          ),
        };
      case 2:
        return {
          titulo: CA.estructura,
          cuerpo: (
            <>
              {conCadaSesion(
                (s, n, g) => (
                  <label className="asistente__campo">
                    <span>{CA.nombreDeLaSesion(n + 1)}</span>
                    <input type="text" maxLength={120} value={s.label} onChange={(e) => cambiar((x) => ((sesionesDelGrupo(x, g)[n]!.label = e.target.value), x))} />
                  </label>
                ),
                (g) => (
                  <div className="asistente__acciones">
                    <button type="button" className="boton boton--quieto" data-asistente-agregar-sesion onClick={() => cambiar((x) => (sesionesDelGrupo(x, g).push(sesionVacia(g.sesiones.length + 1)), x))}>
                      <Icono nombre="mas" tamano={18} />
                      {conVariosGrupos ? CA.agregarSesionEn(g.titulo) : CA.agregarSesion}
                    </button>
                    <button
                      type="button"
                      className="boton boton--quieto"
                      data-asistente-preset-de-estructura
                      onClick={() => {
                        if (conVariosGrupos) mirarLaSesion(g, 0);
                        setGaleria({ tarea: 'estructura', ejercicio: null });
                      }}
                    >
                      <Icono nombre="plantillas" tamano={18} />
                      {conVariosGrupos ? CA.presetDeEstructuraEn(g.titulo) : CA.presetDeEstructura}
                    </button>
                  </div>
                ),
              )}
            </>
          ),
        };
      case 3:
        return {
          titulo: CA.ejercicios,
          cuerpo: conCadaSesion((s, n, g) => (
            <>
              <TituloDeSesion>{nombreDeLaSesion(s, n)}</TituloDeSesion>
              {s.prescriptions.length === 0 ? <p className="nota">{CA.sinEjercicios}</p> : <p>{s.prescriptions.map((x) => nombres[x.exerciseVersionId] ?? 'Ejercicio').join(' · ')}</p>}
              <button
                type="button"
                className="boton boton--quieto"
                onClick={() => {
                  mirarLaSesion(g, n);
                  setAgregando(true);
                }}
              >
                <Icono nombre="mas" tamano={18} />
                {CA.agregarEjercicios(nombreDeLaSesion(s, n))}
              </button>
            </>
          )),
        };
      case 4: {
        // ED-14 (maqueta 03): una pestaña por sesión de todo el plan; el panel tiene los ejercicios de la elegida, con su
        // línea de prescripción y su preset. Las flechas, Inicio y Fin recorren las pestañas (el patrón de ARIA).
        const pestanas = pestanasDelPaso4(grupos, nombreDeLaSesion);
        if (pestanas.length === 0) return { titulo: CA.prescripcion, cuerpo: <p className="nota">{C.sinSesiones}</p> };
        const elegida = pestanaVigente(pestanaDelPaso4, pestanas.length);
        const { g, n, clave: claveElegida } = pestanas[elegida]!;
        const s = g.sesiones[n]!;
        const idDeLaPestana = (clave: string) => `paso-4-pestana-${clave}`;
        return {
          titulo: CA.prescripcion,
          cuerpo: (
            <div className="asistente__paso-4" data-pestanas-del-paso-4>
              <div
                className="estacion__pestanas asistente__pestanas"
                role="tablist"
                aria-label={CA.sesionesDelPlan}
                onKeyDown={(e) => {
                  const destino = pestanaConLaTecla(elegida, pestanas.length, e.key);
                  if (destino === null) return;
                  e.preventDefault();
                  setPestanaDelPaso4(destino);
                  document.getElementById(idDeLaPestana(pestanas[destino]!.clave))?.focus();
                }}
              >
                {pestanas.map((t, k) => (
                  <button
                    key={t.clave}
                    type="button"
                    role="tab"
                    id={idDeLaPestana(t.clave)}
                    aria-selected={k === elegida}
                    aria-controls="paso-4-panel"
                    tabIndex={k === elegida ? 0 : -1}
                    data-pestana-del-paso-4={k + 1}
                    onClick={() => setPestanaDelPaso4(k)}
                  >
                    {t.rotulo}
                    <span className="nota"> · {CA.cuantosEjercicios(t.ejercicios)}</span>
                  </button>
                ))}
              </div>
              <div key={claveElegida} role="tabpanel" id="paso-4-panel" aria-labelledby={idDeLaPestana(claveElegida)} className="asistente__sesion" data-sesion-del-asistente={n + 1}>
                {s.prescriptions.length === 0 ? <p className="nota">{CA.sinEjercicios}</p> : null}
                {s.prescriptions.map((x, l) => {
                  // Como en la maqueta 03: el nombre a la vista, lo que tiene ahora y la marca de la carga, y al lado la línea.
                  const clave = claveDeLaSesion(g, n);
                  const nombre = nombres[x.exerciseVersionId] ?? 'Ejercicio';
                  const revisar = cargaARevisar(clave, x);
                  // C7: la misma clave que en la estación (el identificador o el lugar): lo escrito acá se ve allá, y al revés.
                  const pendiente = claveDeLaLinea(clave, l, x.prescriptionId);
                  return (
                    <div key={x.prescriptionId ?? `nuevo-${l}`} className="asistente__ejercicio" data-ejercicio-del-asistente={l + 1}>
                      <p className="asistente__ejercicio-actual">
                        <strong>{nombre}</strong> <span className="nota">· {CA.ahora}: {ejercicioPlegadoDelEditor(x, 0).resumen}</span>
                        {revisar ? (
                          <span className="etiqueta-de-dato ejercicio-del-editor__revisar" data-carga-a-revisar>
                            {revisar}
                          </span>
                        ) : null}
                      </p>
                      <LineaDePrescripcion
                        id={`asistente-${clave}-p${l}`}
                        nombre={nombre}
                        prescripcion={x}
                        texto={lineas[pendiente] ?? ''}
                        onTexto={(t) => setLineas((m) => conLaLinea(m, pendiente, t))}
                        onAplicar={(nueva, texto) => {
                          cambiar((b) => ((sesionesDelGrupo(b, g)[n]!.prescriptions[l] = nueva), b));
                          marcarCargas(clave, [{ p: nueva, texto }]);
                        }}
                      />
                    </div>
                  );
                })}
                {s.prescriptions.length > 0 ? (
                  <button
                    type="button"
                    className="boton boton--quieto"
                    onClick={() => {
                      mirarLaSesion(g, n);
                      setGaleria({ tarea: 'prescripcion', ejercicio: null });
                    }}
                  >
                    <Icono nombre="plantillas" tamano={18} />
                    {CA.presetDePrescripcion(nombreDeLaSesion(s, n))}
                  </button>
                ) : null}
              </div>
            </div>
          ),
        };
      }
      case 5:
        return {
          titulo: CA.dias,
          cuerpo: (
            <>
              <p className="nota">{CA.diasAyuda}</p>
              {conCadaSesion((s, n) => (
                <>
                  <TituloDeSesion>{nombreDeLaSesion(s, n)}</TituloDeSesion>
                  {chipsDeDias(s, n)}
                  {diasDelPresetDe(s)}
                </>
              ))}
            </>
          ),
        };
      case 6:
        return {
          titulo: CA.revisar,
          cuerpo: (
            <>
              <p className="nota">{CA.revisarAyuda}</p>
              {/* Un título que no afirma nada: lo que hay lo dice la revisión, con su estado (el título «Impide activar»
                  quedaba arriba de «no se encontraron impedimentos»). */}
              <h4>{COPY_REVISION_DEL_PLAN.titulo}</h4>
              {/* ENP-D13: el mismo estado inequívoco que el panel. */}
              {revisionEnElPanel}
              <h4>
                {CE.quedaSinCompletar} <span className="nota">· {CE.noImpide}</span>
              </h4>
              {sinCompletarEnVivo.length === 0 ? (
                <p className="nota">{CE.nadaSinCompletar}</p>
              ) : (
                <ul className="estacion__lista-del-panel">
                  {sinCompletarEnVivo.map((x) => (
                    <li key={x.texto}>
                      <RenglonDeAviso cosa={x} textoIr={CA.irEnLaEstacion} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ),
        };
      case 7:
        return { titulo: CA.activar, cuerpo: <p>{CA.activarAyuda(persona ?? 'la persona')}</p> };
    }
  };
  const asistente = pasoDelAsistente
    ? (() => {
        const { titulo, cuerpo } = contenidoDelPaso(pasoDelAsistente);
        const proximo = pasoDelAsistente < 7 ? ((pasoDelAsistente + 1) as PasoDelAsistente) : null;
        return (
          <ArmazonDelAsistente
            paso={pasoDelAsistente}
            sugerido={sugerido}
            titulo={titulo}
            onElegirPaso={irAlPaso}
            onAtras={pasoDelAsistente > 1 ? () => irAlPaso((pasoDelAsistente - 1) as PasoDelAsistente) : null}
            onEstacion={() => irAlPaso(null)}
            principal={
              proximo
                ? { texto: CA.siguiente(proximo), onClick: () => void siguiente(proximo), ocupado: avanzando || avanzarA !== null ? CA.guardando : null }
                : { texto: COPY_ANTES_DE_ACTIVAR.revisarYActivar, onClick: abrirAntesDeActivar }
            }
            noAvanzo={noAvanzo}
            onReintentar={() => proximo && void siguiente(proximo)}
            armado={pasoDelAsistente > 1 ? loQueLlevasArmado(bloques, agendaVisible, (d) => DIA_CORTO[d as DiaDeLaSemana]) : null}
          >
            {cuerpo}
          </ArmazonDelAsistente>
        );
      })()
    : null;

  // ── DL-196: el plan, las fases y el panel contextual ───────────────────────────────────────────────────────────
  /** El panel sigue a lo que se toca o enfoca en el centro (`data-foco`). */
  const alMirar = (el: EventTarget | null) => {
    const f = focoDelElemento(el instanceof Element ? el : null);
    if (f && !mismoFoco(f, foco)) setFoco(f);
  };
  /**
   * El plan cambia; si cambió el inicio, la agenda empieza ese día (sin los movimientos de antes del inicio, que la API
   * rechazaría).
   */
  const alCambiarElPlan = (p: PlanificacionDelPlan) => {
    cambiarPlanificacion(p);
    if (agendaVisible && p.startDate && agendaVisible.startDate !== p.startDate) {
      const inicio = p.startDate;
      cambiarAgenda({ ...agendaVisible, startDate: inicio, moves: agendaVisible.moves.filter((m) => m.from >= inicio && m.to >= inicio) });
    }
  };
  /** Lo que se escribe de la fase abierta necesita su identificador: si todavía no tiene (una de antes), lo recibe ahora. */
  const conIdDeLaFase = (f: (id: string) => void) => {
    if (!bloque) return;
    const id = bloque.blockId ?? crypto.randomUUID();
    if (!bloque.blockId) cambiar((x) => ((x[i]!.blockId = id), x));
    f(id);
  };
  /** El renglón de una fase plegada: sus semanas, sus fechas y cuántas sesiones tiene. */
  const resumenDeLaFase = (b: BloqueE, n: number): string => {
    const semanas = semanasDeLaFase(plan, b.blockId);
    const fechas = fechasDeFases[n];
    return [semanas ? `${semanas} ${semanas === 1 ? 'semana' : 'semanas'}` : COPY_FASES.sinSemanas, ...(fechas ? [rangoCivil(fechas.desde, fechas.hasta)] : []), sesionesDelBloque(b)].join(' · ');
  };
  const nombresDeLasFases = bloques.map(nombreDelBloque);
  // DL-197 (ET1-01): el rango del plan para la cabecera, las fases de más (F4) y la semana tipo de la fase elegida.
  const rangoDelPlan = plantilla ? null : rangoDeLaBarra(fechasDeFases, rangoCivil, plan.startDate, plan.startDate && plan.weeks ? finDelPlan(plan.startDate, plan.weeks) : null);
  const diasDe = (x: SesionE): readonly DiaDeLaSemana[] => (x.sessionId ? (agendaVisible?.sessions.find((y) => y.sessionId === x.sessionId)?.weekdays ?? []) : []);
  const semanaTipo = sesiones.flatMap((x, m) => (diasDe(x).length > 0 ? [`${letraDeLaSesion(m)} ${diasEnCorto(diasDe(x))}`] : []));
  /** DL-197 (ET1-05): las sesiones de la fase como tarjetas («A Torso · Lun · Jue»); la elegida, resaltada. */
  const tarjetasDeSesiones = (
    <div className="sesiones-de-la-fase" data-sesiones-de-la-fase={sesiones.length}>
      <div className="sesiones-de-la-fase__lista" role="tablist" aria-label={COPY_SEMANA_TIPO.sesionesDeLaFase}>
        {sesiones.map((x, m) => (
          <button
            key={x.sessionId ?? `sesion-${m}`}
            type="button"
            role="tab"
            id={`tarjeta-de-sesion-${m + 1}`}
            className="tarjeta-de-sesion"
            aria-selected={m === k}
            tabIndex={m === k ? 0 : -1}
            data-elegir-sesion={m + 1}
            onClick={() => {
              if (m !== k) elegirSesion(m);
              setFoco({ tipo: 'sesion' });
            }}
            onKeyDown={(e) => {
              const otra = faseConLaTecla(m, sesiones.length, e.key);
              if (otra === null) return;
              e.preventDefault();
              elegirSesion(otra);
              document.getElementById(`tarjeta-de-sesion-${otra + 1}`)?.focus();
            }}
          >
            <span className="tarjeta-de-sesion__letra" aria-hidden="true">
              {letraDeLaSesion(m)}
            </span>
            <span className="tarjeta-de-sesion__nombre">{nombreDeLaSesion(x, m)}</span>
            {diasDe(x).length > 0 ? <span className="tarjeta-de-sesion__dias">{diasEnCorto(diasDe(x))}</span> : null}
          </button>
        ))}
      </div>
      {agregarUnaSesion}
    </div>
  );
  const sesionesDelAlmanaque = new Map<string, SesionDelAlmanaque>(
    bloques.flatMap((b, n) =>
      [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)].flatMap((s, m) => (s.sessionId ? [[s.sessionId, { nombre: nombreDeLaSesion(s, m), letra: letraDeLaSesion(m), fase: n }] as const] : [])),
    ),
  );
  /** Tocar un día del almanaque lleva a esa sesión: su fase, su microciclo (si tiene) y la sesión quedan elegidos. */
  const irALaSesionDelAlmanaque = (sessionId: string) => {
    bloques.forEach((b, n) => {
      const directa = (b.sessions ?? []).findIndex((s) => s.sessionId === sessionId);
      if (directa >= 0) return ir({ bloque: pedidoDeLaPosicion(n), micro: null, sesion: pedidoDeLaPosicion(directa), ejercicios: null });
      (b.microcycles ?? []).forEach((m, mm) => {
        const enElMicro = m.sessions.findIndex((s) => s.sessionId === sessionId);
        if (enElMicro >= 0) ir({ bloque: pedidoDeLaPosicion(n), micro: pedidoDeLaPosicion(mm), sesion: pedidoDeLaPosicion(enElMicro), ejercicios: null });
      });
    });
    setAlmanaqueGrande(false);
    setFoco({ tipo: 'sesion' });
    setParaEnfocar('menu-de-la-sesion');
  };
  const mesQueSeMira = mesDelAlmanaque ?? mesParaAbrir(plan, hoyEn());
  const deQueEsElAlmanaque = foco.tipo === 'fase' && bloque ? nombreDelBloque(bloque, i) : foco.tipo === 'sesion' && sesion ? nombreDeLaSesion(sesion, k) : COPY_FASES.elPlan;
  const almanaque = (meses: number) => (
    <Almanaque
      mes={mesQueSeMira}
      onMes={setMesDelAlmanaque}
      fases={fechasDeFases}
      nombresDeLasFases={nombresDeLasFases}
      agenda={agendaConDias}
      ventanas={ventanas}
      sesiones={sesionesDelAlmanaque}
      hoy={hoyEn()}
      onIrALaSesion={irALaSesionDelAlmanaque}
      meses={meses}
    />
  );
  // Un ejercicio con su ejercicio del catálogo conocido (lo trae la versión guardada) muestra su panel; si no, el almanaque.
  const ejercicioEnFoco = foco.tipo === 'ejercicio' ? sesion?.prescriptions[foco.l] : undefined;
  const ejercicioDelCatalogo = ejercicioEnFoco ? (ejercicios[ejercicioEnFoco.exerciseVersionId] ?? null) : null;
  // ── DL-196 parte B: la carga por semana de un ejercicio, la distribución, la progresión y los favoritos ─────────────
  /** Lo planificado de cada semana de la fase para un ejercicio: con la regla de su fase, o su carga de trabajo todas las semanas. */
  const planDelEjercicio = (b: BloqueE, q: PrescripcionE) => {
    const nombre = nombres[q.exerciseVersionId] ?? 'Ejercicio';
    const semanas = semanasDeLaFase(plan, b.blockId) ?? 4;
    const regla = progresionDeLaFase(plan, b.blockId);
    const base = baseDelEjercicio(q, nombre, aproximacionesDeId(q.prescriptionId ?? null));
    const filas = regla && seAplicaA(regla, q.prescriptionId) ? vistaPrevia(regla, [{ prescriptionId: q.prescriptionId ?? null, nombre, sesion: '', prescripcion: q }], semanas, aproximacionesDeId)[0]?.semanas : null;
    return {
      nombre,
      unidad: base.unidad,
      plan: filas ? filas.map((f) => ({ carga: f.carga, descarga: f.descarga })) : Array.from({ length: semanas }, () => ({ carga: base.carga, descarga: false })),
    };
  };
  /** La carga por semana de un ejercicio, con lo registrado, dentro del panel de «La vez pasada». */
  const cargaPorSemanaDe = (n: number, q: PrescripcionE, exerciseId: string) => {
    const b = bloques[n];
    if (!b || asesoradoId === null) return null;
    const d = planDelEjercicio(b, q);
    const conAsesorado = asesoradoId;
    return (veces: readonly VezPasada[] | null) => (
      <CargaPorSemana
        token={token}
        asesoradoId={conAsesorado}
        sesionPerdida={sesionPerdida}
        exerciseId={exerciseId}
        nombre={d.nombre}
        unidad={d.unidad}
        fase={fechasDeFases[n] ?? null}
        plan={d.plan}
        veces={veces}
        acciones={estrella('EXERCISE_LOAD', q.prescriptionId, `la carga por semana de ${d.nombre}`)}
      />
    );
  };
  /** La distribución de una fase, con las zonas de sus ejercicios. */
  const distribucionDe = (b: BloqueE, chica: boolean) => (
    <DistribucionConFichas
      token={token}
      sesionPerdida={sesionPerdida}
      ids={[...new Set(sesionesDeLaFase(b).flatMap((s) => s.prescriptions.flatMap((q) => (ejercicios[q.exerciseVersionId] ? [ejercicios[q.exerciseVersionId]!] : []))))]}
      armar={(zonasDe) => sesionesParaDistribuir(b, agendaVisible, (q) => zonasDe(ejercicios[q.exerciseVersionId] ?? null))}
      aCuidar={aCuidar}
      chica={chica}
      onVerEstructuras={chica ? null : () => setGaleria({ tarea: 'estructura', ejercicio: null })}
    />
  );
  /** La progresión de una fase en el panel: la regla en palabras y su curva en el primer ejercicio con carga. */
  const progresionDe = (b: BloqueE, n: number) => {
    const regla = progresionDeLaFase(plan, b.blockId);
    const semanas = semanasDeLaFase(plan, b.blockId) ?? 4;
    const filas = regla ? vistaPrevia(regla, ejerciciosDeUnaFase(b), semanas, aproximacionesDeId) : [];
    const conCarga = filas.find((f) => f.semanas.some((x) => x.carga !== null)) ?? null;
    return (
      <div className="progresion-en-el-panel" data-progresion-en-el-panel={regla ? 'con-regla' : 'sin-regla'}>
        <p className="nota">{regla ? progresionEnPalabras(regla, conCarga?.unidad ?? 'kg') : `${nombreDelBloque(b, n)} no tiene progresión: la carga de trabajo queda igual todas las semanas.`}</p>
        {conCarga ? (
          <GraficoDeSemanas
            titulo={`${conCarga.nombre}: la carga planificada por semana`}
            semanas={semanas}
            unidad={conCarga.unidad}
            descargas={conCarga.semanas.filter((x) => x.descarga).map((x) => x.semana)}
            series={[{ clave: 'plan', nombre: 'Planificado', forma: 'plan', valores: conCarga.semanas.map((x) => x.carga) }]}
          />
        ) : null}
        <button type="button" className="boton boton--quieto boton--compacto" onClick={() => b.blockId && setProgresionAbierta({ blockId: b.blockId, copia: null })} data-abrir-progresion-del-panel>
          <Icono nombre="sube" tamano={18} />
          {COPY_PROGRESIONES.abrir}
        </button>
      </div>
    );
  };
  /** GR-27: los gráficos marcados en este plan, cada uno dibujado con lo de hoy. Lo que ya no está, se dice. */
  const favoritosDelPlan = (
    <div className="favoritos-del-plan" data-favoritos-del-plan={(plan.favoriteCharts ?? []).length}>
      {(plan.favoriteCharts ?? []).length === 0 ? <p className="nota">{COPY_FAVORITOS.vacio}</p> : null}
      {(plan.favoriteCharts ?? []).map((g) => {
        const clave = `${g.kind}:${g.id}`;
        if (g.kind === 'EXERCISE_LOAD') {
          const n = bloques.findIndex((b) => sesionesDeLaFase(b).some((s) => s.prescriptions.some((q) => q.prescriptionId === g.id)));
          const q = n >= 0 ? sesionesDeLaFase(bloques[n]!).flatMap((s) => s.prescriptions).find((x) => x.prescriptionId === g.id) : undefined;
          const exerciseId = q ? ejercicios[q.exerciseVersionId] : undefined;
          if (!q || !exerciseId || asesoradoId === null) {
            return (
              <p key={clave} className="nota">
                {COPY_FAVORITOS.yaNoEsta}
              </p>
            );
          }
          return (
            <PanelDelEjercicio
              key={clave}
              token={token}
              asesoradoId={asesoradoId}
              sesionPerdida={sesionPerdida}
              exerciseId={exerciseId}
              nombre={nombres[q.exerciseVersionId] ?? 'Ejercicio'}
              loQueIndica={null}
              cargaPorSemana={cargaPorSemanaDe(n, q, exerciseId)}
              soloElGrafico
            />
          );
        }
        const n = bloques.findIndex((b) => b.blockId === g.id);
        const b = bloques[n];
        if (!b) {
          return (
            <p key={clave} className="nota">
              {COPY_FAVORITOS.yaNoEsta}
            </p>
          );
        }
        const deQue = `${g.kind === 'PHASE_PROGRESSION' ? COPY_PROGRESIONES.titulo : NOMBRE_DE_LA_VISTA.distribucion} · ${nombreDelBloque(b, n)}`;
        return (
          <section key={clave} className="favoritos-del-plan__grafico" aria-label={deQue}>
            <div className="favoritos-del-plan__cabecera">
              <h4 className="ejercicio-del-plan__subtitulo">{deQue}</h4>
              {estrella(g.kind, g.id, deQue)}
            </div>
            {g.kind === 'PHASE_PROGRESSION' ? progresionDe(b, n) : distribucionDe(b, true)}
          </section>
        );
      })}
    </div>
  );
  const vistas: readonly VistaDelPanel[] = foco.tipo === 'ejercicio' ? [] : VISTAS_DEL_FOCO[foco.tipo];
  const vista = vistaDelFoco(foco.tipo, vistaElegida);
  /** EE-D40: el selector de vistas del panel, como pestañas (← y → con el teclado). */
  const selectorDeVistas =
    vistas.length > 1 ? (
      <div className="selector-de-vistas" role="tablist" aria-label="Qué muestra el panel" data-selector-de-vistas>
        {vistas.map((v) => (
          <button
            key={v}
            id={`vista-del-panel-${v}`}
            type="button"
            role="tab"
            aria-selected={v === vista}
            aria-controls="vista-del-panel"
            tabIndex={v === vista ? 0 : -1}
            className="selector-de-vistas__opcion"
            onClick={() => setVistaElegida(v)}
            onKeyDown={(e) => {
              const otra = vistaPorTecla(vistas, vista, e.key);
              if (!otra) return;
              e.preventDefault();
              setVistaElegida(otra);
              document.getElementById(`vista-del-panel-${otra}`)?.focus();
            }}
            data-vista={v}
          >
            {/* DL-197 (F6): un control segmentado compacto: el ícono arriba y el nombre entero abajo (nada se corta). */}
            <Icono nombre={ICONO_DE_LA_VISTA[v]} tamano={18} />
            <span className="selector-de-vistas__nombre">{NOMBRE_DE_LA_VISTA[v]}</span>
          </button>
        ))}
      </div>
    ) : null;
  const deQueEsLaFase = bloque ? nombreDelBloque(bloque, i) : COPY_FASES.elPlan;
  const panelDelFoco =
    ejercicioEnFoco && ejercicioDelCatalogo && asesoradoId !== null ? (
      <PanelDelEjercicio
        key={ejercicioDelCatalogo}
        token={token}
        asesoradoId={asesoradoId}
        sesionPerdida={sesionPerdida}
        exerciseId={ejercicioDelCatalogo}
        nombre={nombres[ejercicioEnFoco.exerciseVersionId] ?? 'Ejercicio'}
        loQueIndica={<EnPartes texto={ejercicioPlegadoDelEditor(ejercicioEnFoco, 0, notacion).resumen} />}
        antes={<AvisoDeZonaACuidar token={token} sesionPerdida={sesionPerdida} exerciseId={ejercicioDelCatalogo} aCuidar={aCuidar} />}
        // DL-199 (ET3-10 a ET3-12): la sugerencia de progresión desde lo que hizo la persona; nunca cambia nada sola. El cardio no la lleva.
        sugerencia={
          plantilla || foco.tipo !== 'ejercicio' || cardioDe(ejercicioEnFoco)
            ? null
            : (veces) => {
                const l = foco.l;
                const regla = bloque ? progresionDeLaFase(plan, bloque.blockId) : null;
                return (
                  <SugerenciaDeProgresionEnElPanel
                    veces={veces}
                    exerciseId={ejercicioDelCatalogo}
                    prescripcion={ejercicioEnFoco}
                    nombre={nombres[ejercicioEnFoco.exerciseVersionId] ?? ''}
                    notacion={notacion}
                    conProgresionDeLaFase={!!regla && regla.model !== null && seAplicaA(regla, ejercicioEnFoco.prescriptionId)}
                    onAplicar={(sugerida) => cambiarEjercicio(l, conLaCargaSubida(ejercicioEnFoco, sugerida))}
                  />
                );
              }
        }
        cargaPorSemana={plantilla ? null : cargaPorSemanaDe(i, ejercicioEnFoco, ejercicioDelCatalogo)}
        despues={
          plantilla ? null : (
            <CargaParaRepeticiones
              token={token}
              asesoradoId={asesoradoId}
              sesionPerdida={sesionPerdida}
              exerciseId={ejercicioDelCatalogo}
              unidad={baseDelEjercicio(ejercicioEnFoco, nombres[ejercicioEnFoco.exerciseVersionId] ?? '', null).unidad}
              notacion={notacion}
              repeticionesDeEntrada={repeticionesDeTrabajo(ejercicioEnFoco)}
              rirDeEntrada={ejercicioEnFoco.intensity?.criterion === 'RIR' ? ejercicioEnFoco.intensity.target.value : null}
            />
          )
        }
      />
    ) : (
      <>
        {selectorDeVistas}
        <div id="vista-del-panel" role={vistas.length > 1 ? 'tabpanel' : undefined} aria-labelledby={vistas.length > 1 ? `vista-del-panel-${vista}` : undefined} data-vista-del-panel={vista}>
          {vista === 'distribucion' && bloque ? (
            <MarcoDelPanel id="panel-de-la-distribucion" deQue={deQueEsLaFase} titulo={NOMBRE_DE_LA_VISTA.distribucion} onAbrirGrande={() => setDistribucionGrande(true)} acciones={estrella('PHASE_DISTRIBUTION', bloque.blockId, `la distribución de ${deQueEsLaFase}`)}>
              {distribucionDe(bloque, false)}
            </MarcoDelPanel>
          ) : vista === 'progresion' && bloque ? (
            <MarcoDelPanel id="panel-de-la-progresion" deQue={deQueEsLaFase} titulo={COPY_PROGRESIONES.titulo} onAbrirGrande={null} acciones={estrella('PHASE_PROGRESSION', bloque.blockId, `la progresión de ${deQueEsLaFase}`)}>
              {progresionDe(bloque, i)}
            </MarcoDelPanel>
          ) : vista === 'favoritos' ? (
            <MarcoDelPanel id="panel-de-los-favoritos" deQue={COPY_FASES.elPlan} titulo={COPY_FAVORITOS.titulo} onAbrirGrande={null}>
              {favoritosDelPlan}
              {asesoradoId !== null ? (
                <PatronesAPedido>
                  {/* WP-GRAFICOS rama E (GR-27): los gráficos de la persona con el enfoque de este plan; nada de acá escribe en el plan. */}
                  <PatronesDelPlan token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} area="ENTRENAMIENTO" planId={comoPlan(version)?.trainingPlanId ?? null} />
                </PatronesAPedido>
              ) : null}
            </MarcoDelPanel>
          ) : (
            <MarcoDelPanel id="panel-del-almanaque" deQue={deQueEsElAlmanaque} titulo={COPY_FASES.almanaque} onAbrirGrande={() => setAlmanaqueGrande(true)}>
              {almanaque(1)}
            </MarcoDelPanel>
          )}
        </div>
      </>
    );
  /** «Antes de activar» (o «Antes de guardar», en una plantilla): lo que impide y lo que queda sin completar, cada cosa con su «Ir a…». */
  const loQueImpide = (
    <>
      {/* DL-199 (ET3, E5): cómo se actualiza esta lista va en el «?» de su esquina, no en un párrafo al pie. */}
      <div className="encabezado-con-ayuda">
        {plantilla ? (
          <h3 data-revision-para-guardar>
            <Icono nombre="revision" tamano={15} /> {COPY_REVISION_DE_LA_PLANTILLA.titulo}
          </h3>
        ) : (
          <h3>
            <Icono nombre="revision" tamano={15} />
            {COPY_REVISION_DEL_PLAN.titulo}
          </h3>
        )}
        <ExplicacionAPedido nombre="Cómo se actualiza esta revisión" como="div" lugar="esquina">
          <p data-revision-en-vivo>{plantilla ? PLT.sinPersona : CE.enVivo(persona)}</p>
          <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>
            Ejemplo: escribís el RIR que faltaba en un ejercicio; al guardarse solo el plan, la revisión vuelve a correr y ese renglón de «Queda sin completar» se va.
          </p>
        </ExplicacionAPedido>
      </div>
      {/* ENP-D13: el estado de la revisión, siempre dicho; nunca «nada impide» antes de que responda la API. */}
      {revisionEnElPanel}
    </>
  );
  /** Lo que queda sin completar NO impide activar: no entra en «N cosas impiden activar» ni en su lista. */
  const loQueQuedaSinCompletar = (
    <>
      <h3>
        {CE.quedaSinCompletar} <span className="nota">· {CE.noImpide}</span>
      </h3>
      {sinCompletarEnVivo.length === 0 ? (
        <p className="nota">{CE.nadaSinCompletar}</p>
      ) : (
        <ul className="estacion__lista-del-panel">
          {/* La clave es el texto del renglón, no la posición: lo abierto no pasa a la fila siguiente (PG-10). */}
          {sinCompletarEnVivo.map((x) => (
            <li key={x.texto}>
              <RenglonDeAviso cosa={x} textoIr={CE.irACorregir} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
  /** La edición de una plantilla muestra las dos cosas juntas en su panel; «Antes de activar» solo lo que impide. */
  const listaAntesDeActivar = (
    <>
      {loQueImpide}
      {loQueQuedaSinCompletar}
    </>
  );

  return (
    // DL-192: todo lo de abajo (las series, la lectura de cada ejercicio, la fuerza estimada) va en la notación del borrador.
    <ProveedorDeLaNotacion value={plantilla ? NOTACION_POR_OMISION : notacion}>
    <section className="seccion editor-del-plan editor-de-entrenamiento estacion" aria-labelledby="titulo-borrador" data-estacion data-panel-abierto={panelAbierto ? '' : undefined} data-en-el-asistente={pasoDelAsistente ? '' : undefined}>
      {/* ED-15 (DJ-6): la barra de comandos, fija, con cada acción siempre en el mismo lugar. El único botón lleno es
          «Revisar y activar…». «Guardar como preset» y lo demás van en el «⋯» (ED-12). */}
      {esDelPlan(version) ? (
      <div className="editor-del-plan__cabecera estacion__barra" data-barra-de-comandos>
        {/* DJ-6: la versión en preparación lleva número (el de las activadas más uno) y dice que la persona no la ve. */}
        <h2 id="titulo-borrador">
          {COPY_DE_VERSIONES.versionEnPreparacion(numero)}{' '}
          <span className="etiqueta-de-dato">
            <Icono nombre="borrador" tamano={15} />
            {COPY_DE_VERSIONES.noLaVe(persona)}
          </span>
          {sinPlanActivo ? (
            <span className="etiqueta-de-dato" data-sin-plan-activo>
              {COPY_ENTRENAMIENTO.sinPlanActivo}
            </span>
          ) : null}
        </h2>
        <div className="editor-del-plan__acciones">
          {/* DL-195 (GUI-10): «Ver el recorrido», el primero de la barra: un lugar fijo, que no se mueve con el estado. */}
          {pasoDelAsistente ? null : <BotonVerElRecorrido alTocar={recorrido.abrir} conPalabraCorta />}
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
          {/* El guardado es automático y el estado lo dice («Guardando…», «Guardado», «No se guardó · Reintentar»). «Guardar ahora»
              queda en el «…» y con Ctrl+S: la barra es de un solo renglón y no tiene lugar para un botón más (RP-19). */}
          {/* ED-07 (DJ-6): «Revisar y activar…», la única entrada a activar, fija y llena (el único botón lleno de la
              barra). Abre «Antes de activar» siempre, también con algo por corregir o sin guardar, y no cambia de nombre
              ni de lugar mientras se escribe. */}
          {/* En el asistente, la acción principal es la del paso (un solo principal por vista). */}
          {/* DL-196 (EE-06): «Antes de activar» ya no es una pestaña del panel: va al lado del botón, con cuántas cosas
              impiden activar, y despliega la lista. */}
          {pasoDelAsistente ? null : (
            <LoQueImpideActivar cuantos={cuantosImpiden} estado={estadoDeLaRevision} delEditor={delEditor.length} abierto={impideAbierto} onAbrir={setImpideAbierto}>
              {loQueImpide}
            </LoQueImpideActivar>
          )}
          {pasoDelAsistente ? null : (
            <button type="button" className="boton boton--primario" data-revisar-y-activar onClick={abrirAntesDeActivar}>
              <Icono nombre="activar" tamano={18} />
              {COPY_ANTES_DE_ACTIVAR.revisarYActivar}
            </button>
          )}
          {!pasoDelAsistente ? (
            <MenuDeAcciones
              id="mas-de-la-version"
              rotulo={CE.masDeLaVersion}
              acciones={[
                { clave: 'guardar-ahora', texto: COPY_GUARDADO.guardarAhora, alElegir: () => void guardar(), noSePuede: sinGuardarAhora },
                ...(!ofreceDescartar(version) ? [] : [
                { clave: 'estructura', texto: CE.galeriaDeEstructura, alElegir: () => setGaleria({ tarea: 'estructura', ejercicio: null }) },
                { clave: 'plantilla', texto: `${CE.guardarComoPreset}: ${CE.elPlanComoPlantilla}`, alElegir: () => setGuardarPlantilla(true), noSePuede: antesHayQueCorregir },
                {
                  clave: 'sesion-habitual',
                  texto: `${CE.guardarComoPreset}: ${CE.laSesionComoHabitual}`,
                  alElegir: () => {
                    if (sesion) setSesionHabitual(structuredClone(sesion));
                  },
                  noSePuede: antesHayQueCorregir ?? (sesion ? null : C.sinSesiones),
                },
                { clave: 'prescripcion-habitual', texto: `${CE.guardarComoPreset}: ${CE.lasSeriesComoPrescripcion}`, alElegir: () => setPrescripcionHabitual(true), noSePuede: antesHayQueCorregir ?? (sesion?.prescriptions.some((x) => x.sets.length > 0) ? null : CE.sinSeriesParaPrescripcion) },
                // ED-14: retomar no depende de nada guardado aparte: el paso que sigue se deduce del borrador.
                { clave: 'seguir-asistente', texto: CA.seguirConElAsistente(sugerido), alElegir: () => irAlPaso(sugerido) },
                { clave: 'asistente', texto: CE.rehacerConElAsistente, alElegir: () => irAlPaso(1) },
                {
                  clave: 'descartar',
                  texto: COPY_DESCARTAR_LA_VERSION.accion,
                  alElegir: () => {
                    setFalloDelDescarte(null);
                    setDescartar(true);
                  },
                },
                ]),
              ]}
            />
          ) : null}
        </div>
      </div>
      ) : (
        // PLT (DL-182): la cabecera de la plantilla: su nombre, de dónde parte, las cargas y «Revisar y guardar…».
        <CabeceraDeLaPlantilla
          preparacion={version.preparacion}
          metadatos={metadatos}
          onMetadatos={cambiarMetadatos}
          cargasEscritas={cargasEscritas}
          estadoDeGuardado={
            <>
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
            </>
          }
          onRevisarYGuardar={abrirAntesDeActivar}
          alDescartar={() => {
            setFalloDelDescarte(null);
            setDescartar(true);
          }}
          panelAbierto={panelAbierto}
          onPanel={() => setPanelAbierto((x) => !x)}
          textosDelPanel={{ abrir: CE.abrirPanel, cerrar: CE.cerrarPanel }}
        />
      )}
      {pasoDelAsistente ? null : (
      <>
      {/* TEST-EDP-018: los saltos entre las zonas, para el teclado. Se ven al recibir el foco. */}
      <nav className="estacion__saltos" aria-label={CE.saltos}>
        {(
          [
            ['zona-editor', CE.irAlEditor],
            ['zona-panel', CE.irAlPanel],
          ] as const
        ).map(([zona, texto]) => (
          <button
            key={zona}
            type="button"
            className="boton boton--discreto" data-navega
            onClick={() => {
              if (zona === 'zona-panel') setPanelAbierto(true);
              document.getElementById(zona)?.focus();
            }}
          >
            {texto}
          </button>
        ))}
      </nav>
      </>
      )}
      {conflicto ? (
        <Aviso tipo="error" enfocar>
          <p>{COPY_GUARDADO.conflicto}</p>
          <p className="nota">{COPY_GUARDADO.cargarGuardadaAclaracion}</p>
          <button type="button" className="boton boton--secundario" onClick={() => void cargar()}>
            {COPY_GUARDADO.cargarGuardada}
          </button>
        </Aviso>
      ) : null}
      {esDelPlan(version) && version.templateOrigin ? <NotaDeOrigen token={token} origen={version.templateOrigin} /> : null}

      {objetivoVigente && esDelPlan(version) && objetivoVigente !== version.objectiveVersionId ? (
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
                    // DL-196 (E2): «Ir a…» va como botón discreto con flecha, no como texto subrayado.
                    <button type="button" className="boton boton--discreto" data-navega data-problema onClick={() => irAlProblema(p)}>
                      {ubicacionDelProblemaDeEntrenamiento(p.path, bloques)}: {PROBLEMA[p.code] ?? 'revisá este elemento'}
                      <Icono nombre="derecha" tamano={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {mensaje.deValidar ? <p className="nota">{COPY_ENTRENAMIENTO.noJuzga}</p> : null}
        </Aviso>
      ) : null}

      {asistente ?? (
      // DL-196 (EE-01, E5 y E7): dos columnas, como Nutrición. Sin la columna izquierda: el centro se desplaza con la página y
      // tiene, de arriba hacia abajo, el plan y sus fases en desplegables; a la derecha, el panel contextual.
      <div className="estacion__zonas editor-de-entrenamiento__zonas">
        <div
          id="zona-editor"
          className="estacion__zona estacion__centro editor-de-entrenamiento__centro"
          data-zona="editor"
          role="region"
          aria-label={CE.editor}
          tabIndex={-1}
          // DL-196 (EE-05): lo que se toca o recibe el foco decide qué muestra el panel (`data-foco`, `panel-contextual.ts`).
          onFocus={(e) => alMirar(e.target)}
          onPointerDown={(e) => alMirar(e.target)}
        >
          {/* C9: después de «Ir a…», la vuelta a la revisión, fija arriba mientras se corrige. */}
          {volverALaRevision ? (
            <div className="estacion__volver" data-volver-a-la-revision={volverALaRevision.desde}>
              <p className="nota">{volverALaRevision.desde === 'cuadro' ? (plantilla ? PLT.volverALaRevision : COPY_VOLVER_A_LA_REVISION.desdeElCuadro) : COPY_VOLVER_A_LA_REVISION.desdeElPanel}</p>
              <button type="button" className="boton boton--secundario boton--compacto" data-volver-ahora onClick={volverAhora}>
                <Icono nombre="izquierda" tamano={15} />
                {COPY_VOLVER_A_LA_REVISION.volver}
              </button>
              <button
                type="button"
                className="boton boton--discreto"
                data-ocultar-la-vuelta
                onClick={() => {
                  setVolverALaRevision(null);
                  // Revisión del tramo 2: el botón desaparece con la barra; el foco no se pierde, queda en la sesión.
                  setParaEnfocar('zona-editor');
                }}
              >
                {COPY_VOLVER_A_LA_REVISION.ocultar}
              </button>
            </div>
          ) : null}
          {/* ED-17: lo que antes se repetía en un párrafo fijo va en una ayuda de primer uso que se cierra. */}
          {plantilla ? <PrimerUso {...PRIMER_USO_DE_LA_PLANTILLA} /> : <PrimerUso {...PRIMER_USO_DE_LA_ESTACION} />}
          {/* DL-197 (ET1-01): «Fases del plan» con su barra horizontal; debajo, la fase elegida (su pestaña). */}
          <section className="fases-del-plan" aria-labelledby="titulo-fases">
            <BarraDeFases
              rango={rangoDelPlan}
              tarjetas={tarjetasDeLaBarra(plan, bloques)}
              elegida={i}
              onElegir={(n) => {
                if (n !== i) elegirBloque(n);
                setFoco({ tipo: 'fase' });
              }}
              onAgregar={agregarBloque}
              onConfigurar={() => setCuadroDelPlan('plan')}
              deMas={!plantilla && fasesDeMas > 0 ? { suman: semanasQueSumanLasFases(plan, bloques), plan: plan.weeks ?? 0 } : null}
              onResolver={() => setImpideAbierto(true)}
              idDelPanel="fase-abierta"
              ayuda={
                <>
                  <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.fase} />
                  <p data-que-es-la-fase>{COPY_ENTRENAMIENTO.queEsLaFase}</p>
                  <p>{plantilla ? COPY_FASES.ayudaEnLaPlantilla : COPY_FASES.ayuda}</p>
                </>
              }
            />
            {bloques.length === 0 ? <p className="nota">{C.sinBloques}</p> : null}
            {bloque ? (
                  <div className="fase-del-plan" data-fase={colorDeLaFase(i)} data-abierta="" data-fase-del-plan={i + 1}>
                    <div className="fase-del-plan__cabecera" data-foco="fase">
                      <h3 className="fase-del-plan__titulo">
                        <span className="fase-del-plan__numero" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span className="fase-del-plan__nombre">{nombreDelBloque(bloque, i)}</span>
                        <span className="fase-del-plan__resumen">
                          <EnPartes texto={resumenDeLaFase(bloque, i)} />
                        </span>
                      </h3>
                      <div className="fase-del-plan__acciones">
                        <button type="button" id="editar-fase" className="boton boton--secundario boton--compacto" onClick={() => setCuadroDelPlan('fase')} data-editar-fase>
                          <Icono nombre="texto" tamano={18} />
                          {COPY_BARRA_DE_FASES.editar}
                        </button>
                        {plantilla ? null : (
                          <button type="button" id="dias-de-la-semana" className="boton boton--quieto boton--compacto" onClick={() => setCuadroDelPlan('dias')} data-abrir-dias-de-la-semana>
                            <Icono nombre="calendario" tamano={18} />
                            {COPY_BARRA_DE_FASES.dias}
                          </button>
                        )}
                        <MenuDeAcciones
                          id="menu-del-bloque"
                          rotulo={`más acciones de la fase ${nombreDelBloque(bloque, i)}`}
                          acciones={[
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
                            { clave: 'duplicar', texto: 'Duplicar la fase', alElegir: () => duplicarLaFase(i) },
                            { clave: 'quitar', texto: 'Quitar esta fase', alElegir: quitarBloque, noSePuede: bloques.length <= 1 ? 'Es la única fase de la versión.' : null },
                          ]}
                        />
                      </div>
                    </div>
                      <div id="fase-abierta" className="fase-del-plan__cuerpo" role="tabpanel" aria-labelledby={`tarjeta-de-fase-${i + 1}`}>
                        <div className="fase-del-plan__datos" data-foco="fase">
                          {bloque.purpose?.trim() ? (
                            <p className="nota fase-del-plan__objetivo" data-objetivo-de-la-fase>
                              <span className="fase-del-plan__rotulo">{plantilla ? 'Propósito' : 'Objetivo'}:</span> {bloque.purpose}
                            </p>
                          ) : null}
                          {/* DL-196 parte B (E12): la progresión de la fase, a pedido. La regla guardada se lee en un renglón fijo.
                              DL-198 (ET2-10): también en una plantilla, que la guarda con su planificación. */}
                            <div className="fase-del-plan__progresion" data-progresion-de-la-fase={progresionDeLaFase(plan, bloque.blockId)?.model ?? (progresionDeLaFase(plan, bloque.blockId) ? 'descarga' : 'ninguna')}>
                              <button type="button" className="boton boton--quieto boton--compacto" onClick={() => conIdDeLaFase((id) => setProgresionAbierta({ blockId: id, copia: null }))} data-abrir-progresion>
                                <Icono nombre="sube" tamano={18} />
                                {COPY_PROGRESIONES.abrir}
                              </button>
                              <span className="nota">{progresionDeLaFase(plan, bloque.blockId) ? progresionEnPalabras(progresionDeLaFase(plan, bloque.blockId)!, unidadDeLaFase(ejerciciosDeUnaFase(bloque))) : COPY_PROGRESIONES.sinModelo}</span>
                            </div>
                          {microciclo && j !== null ? (
                            <div className="plan__niveles niveles-del-editor">
                              <SelectorDeNivel
                                nivel="microciclo"
                                rotulo={C.microciclo}
                                opciones={paraElegir((bloque.microcycles ?? []).map(nombreDelMicrociclo))}
                                elegido={{ order: j + 1, label: nombreDelMicrociclo(microciclo, j) }}
                                onElegir={(o) => elegirMicrociclo(o - 1)}
                              >
                                <button type="button" className="boton boton--quieto boton--compacto" data-agregar-microciclo onClick={agregarMicrociclo}>
                                  <Icono nombre="mas" tamano={18} />
                                  {COPY_ENTRENAMIENTO.agregarMicrociclo}
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
                              {seCambia('nombre-del-microciclo', delMicrociclo) || microciclo.label.trim() === '' ? (
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
                            </div>
                          ) : null}
                          {/* DL-196 (EE-02): los días de la semana de la fase, con qué sesión va cada día. Una plantilla no tiene
                              días: se eligen en el plan de cada persona. */}
                          {plantilla ? (
                            <p className="nota estacion__fechas" data-sin-dias-en-la-plantilla>
                              {PLT.sinDias}
                            </p>
                          ) : (
                            <div className="semana-tipo" data-semana-tipo>
                              <p className="nota semana-tipo__renglon">
                                <span className="fase-del-plan__rotulo">{COPY_SEMANA_TIPO.titulo}:</span>{' '}
                                {semanaTipo.length > 0 ? semanaTipo.join(' · ') : COPY_SEMANA_TIPO.sinDias}
                              </p>
                              <div className="dias-de-la-fase__pie">
                                {sesiones.map((s) => (
                                  <Fragment key={s.sessionId ?? s.label}>{diasDelPresetDe(s)}</Fragment>
                                ))}
                                {sesiones.flatMap((s) => {
                                  const compartidos = s.sessionId ? diasCompartidos(agendaVisible, s.sessionId, nombreDeLaSesionPorId) : [];
                                  return compartidos.length > 0
                                    ? [
                                        <p key={s.sessionId} className="nota" data-dia-compartido>
                                          {CE.compartido(compartidos)}
                                        </p>,
                                      ]
                                    : [];
                                })}
                                {agendaConDias ? (
                                  <button
                                    id="ver-proximas-fechas"
                                    type="button"
                                    className="boton boton--discreto"
                                    aria-expanded={fechasAbiertas}
                                    aria-controls={fechasAbiertas ? 'proximas-fechas' : undefined}
                                    data-ver-proximas-fechas
                                    onClick={() => {
                                      setFechasAbiertas(!fechasAbiertas);
                                      if (!fechasAbiertas) setParaEnfocar('titulo-agenda');
                                    }}
                                  >
                                    <Icono nombre="calendario" tamano={15} />
                                    {fechasAbiertas ? COPY_PROXIMAS_FECHAS.ocultar : COPY_PROXIMAS_FECHAS.ver}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          )}
                          {/* C5: lo que sale de los días, a pedido: el inicio, la semana con «Duplicar el día» (ED-24) y las
                              dos semanas que siguen. */}
                          {fechasAbiertas && agendaConDias ? (
                            <ProximasFechas
                              agenda={agendaConDias}
                              sesiones={sesionesDeLaAgenda}
                              hoy={hoyEn()}
                              onCerrar={() => {
                                setFechasAbiertas(false);
                                document.getElementById('ver-proximas-fechas')?.focus();
                              }}
                              onCambiar={cambiarAgenda}
                              // DL-196: las fechas de la fase (como en el almanaque) y el inicio, que es el del plan.
                              ventanas={ventanas}
                              onInicio={plan.startDate ? (f) => alCambiarElPlan(conInicio(plan, f)) : undefined}
                              semana={
                                <ol className="estacion__tira" aria-label={CE.semana}>
                                  {tiraDeLaSemana(agendaConDias, nombreDeLaSesionPorId).map((d) => (
                                    <li key={d.dia} data-con-sesion={d.sesiones.length > 0 ? '' : undefined}>
                                      <span className="nota">{DIA_LARGO[d.dia]}</span>
                                      <span>{d.sesiones.length > 0 ? d.sesiones.join(' · ') : CE.sinSesionEseDia}</span>
                                      {/* ED-24: «Duplicar el día» copia las sesiones de ese día a otro (Dirección, 2026-11-12). */}
                                      {d.sesiones.length > 0 ? (
                                        <button type="button" className="boton boton--discreto estacion__duplicar-el-dia" data-duplicar-el-dia={d.dia} onClick={() => setDuplicandoElDia({ desde: d.dia, hacia: null })}>
                                          <Icono nombre="duplicar" tamano={15} />
                                          {DD.accion}
                                          <span className="visualmente-oculto"> {DIA_LARGO[d.dia]}</span>
                                        </button>
                                      ) : null}
                                    </li>
                                  ))}
                                </ol>
                              }
                            />
                          ) : null}
                        </div>
                        <div className="fase-del-plan__sesiones" data-foco="sesion" data-recorrido="sesiones">
                          <div className="plan__niveles niveles-del-editor">
                            {sesion ? (
                              <>
                              {tarjetasDeSesiones}
                              <div className="sesion-elegida__cabecera" data-sesion-elegida={k + 1}>
                                <h4 className="sesion-elegida__titulo">
                                  <span className="tarjeta-de-sesion__letra" aria-hidden="true">
                                    {letraDeLaSesion(k)}
                                  </span>
                                  {nombreDeLaSesion(sesion, k)}
                                </h4>
                                {MOSTRAR_VISTA_DE_LA_PERSONA ? (
                                  <button type="button" className="boton boton--quieto boton--compacto sesion-elegida__ver-como" onClick={() => setVistaDeLaPersona(true)} data-ver-como-la-persona>
                                    <Icono nombre="ver" tamano={18} />
                                    {COPY_VISTA_DE_LA_PERSONA.abrir}
                                  </button>
                                ) : null}
                                <MenuDeAcciones
                                  id="menu-de-la-sesion"
                                  rotulo={`más acciones de la sesión ${nombreDeLaSesion(sesion, k)}`}
                                  alineado="izquierda"
                                  acciones={[
                                    { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => setTexto({ de: 'nombre-de-la-sesion', ...deLaSesion }) },
                                    // TB-48: duplicar y mover la sesión que se mira.
                                    { clave: 'duplicar', texto: E.duplicarSesion, alElegir: duplicarSesion },
                                    // ED-24 (V3 E-01): copiar a otro lugar, con destino y vista previa.
                                    { clave: 'copiar', texto: COPY_COPIAR.copiarLaSesion, alElegir: () => setCopiando({ que: 'sesion' }), noSePuede: destinosDeLaSesion(bloques, { i, j }).length === 0 ? COPY_COPIAR.sinOtroLugar : null },
                                    ...(j !== null ? [{ clave: 'semana', texto: COPY_COPIAR.copiarAOtraSemana, alElegir: () => setCopiando({ que: 'semana' }), noSePuede: destinosDeLaSesion(bloques, { i, j }, true).length === 0 ? COPY_COPIAR.sinOtraSemana : null }] : []),
                                    { clave: 'antes', texto: E.moverAntes, alElegir: () => moverSesion(k - 1), noSePuede: k === 0 ? E.yaEsElPrimero : null },
                                    { clave: 'despues', texto: E.moverDespues, alElegir: () => moverSesion(k + 1), noSePuede: k === sesiones.length - 1 ? E.yaEsElUltimo : null },
                                    { clave: 'habitual', texto: COPY_HABITUALES.guardarComoHabitual, alElegir: () => setSesionHabitual(structuredClone(sesion)), noSePuede: antesHayQueCorregir },
                                    { clave: 'quitar', texto: 'Quitar esta sesión', alElegir: quitarSesion },
                                  ]}
                                />
                                <span className="nota nivel-del-plan__cuenta" data-cuenta-de-la-sesion>
                                  <EnPartes texto={cuentaDeLaSesion(sesion)} />
                                </span>
                              </div>
                              </>
                            ) : (
                              <div className="nivel-del-plan" data-nivel="sesion" data-forma="ninguna">
                                <span className="nivel-del-plan__rotulo">{C.sesion}</span>
                                <span className="nota">{C.sinSesiones}</span>
                                {agregarUnaSesion}
                                {/* C11: «Sesiones vacías»: con una cantidad, A, B y C de una vez, sin pedir nombre ni propósito. */}
                                {cantidadesDeSesionesVacias(sesiones.length, topeDeSesiones).length > 0 ? (
                                  <div className="estacion__sesiones-vacias con-ayuda-en-la-esquina" role="group" aria-labelledby="titulo-sesiones-vacias" data-sesiones-vacias>
                                    <span id="titulo-sesiones-vacias" className="nivel-del-plan__rotulo">
                                      {SV.titulo}
                                    </span>
                                    <label>
                                      <span className="visualmente-oculto">{SV.cuantas}</span>
                                      <select value={cuantasVacias} onChange={(e) => setCuantasVacias(Number(e.target.value))} data-cuantas-sesiones-vacias>
                                        {cantidadesDeSesionesVacias(sesiones.length, topeDeSesiones).map((m) => (
                                          <option key={m} value={m}>
                                            {m}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <button type="button" className="boton boton--secundario boton--compacto" data-armar-sesiones-vacias onClick={() => armarSesionesVacias(cuantasVacias)}>
                                      <Icono nombre="mas" tamano={15} />
                                      {SV.armar(cuantasVacias, sesiones.length)}
                                    </button>
                                    <ExplicacionAPedido nombre="Qué son las sesiones vacías" lugar="esquina">
                                      {plantilla ? SV.ayudaEnLaPlantilla : SV.ayuda}
                                    </ExplicacionAPedido>
                                  </div>
                                ) : null}
                              </div>
                            )}
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
                                  className="boton boton--discreto"
                                  onClick={() => {
                                    setInsertandoHabitual(false);
                                    document.getElementById('agregar-sesion')?.focus();
                                  }}
                                >
                                  {COPY_HABITUALES.cancelar}
                                </button>
                              </div>
                            ) : null}
                          </div>
                          {sesion ? (
                            <div className="estacion__acciones-de-la-sesion">
                              {/* ED-11: la galería de presets de prescripción, para la sesión que se mira. ENP-D10: con la sesión vacía, también. */}
                              <button type="button" className="boton boton--quieto boton--compacto" data-galeria-de-prescripcion onClick={() => setGaleria({ tarea: 'prescripcion', ejercicio: null })}>
                                <Icono nombre="plantillas" tamano={18} />
                                {CE.presets}
                              </button>
                              {/* DL-199 (ET3, E5): las indicaciones, en el mismo renglón que «Presets»; con texto o abiertas, toman el renglón entero. */}
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
                              {prescripcionDeEstaSesion && claveDeEstaSesion ? (
                                <div className="estacion__prescripcion-de-la-sesion con-ayuda-en-la-esquina" data-prescripcion-de-la-sesion>
                                  <p className="etiqueta-de-dato">
                                    <Icono nombre="aplicar" tamano={15} />
                                    {COPY_PRESCRIPCION_DE_LA_SESION.paraLosQueAgregues(prescripcionDeEstaSesion.nombre)}
                                    <button type="button" className="boton boton--discreto" onClick={() => setPrescripcionDeLaSesion(({ [claveDeEstaSesion]: _quitada, ...resto }) => resto)}>
                                      {COPY_PRESCRIPCION_DE_LA_SESION.quitar}
                                      <span className="visualmente-oculto"> {prescripcionDeEstaSesion.nombre}</span>
                                    </button>
                                  </p>
                                  {/* ENP-D18: dice dónde vive: no es algo guardado en el plan. DL-196 (E4): en el «?». */}
                                  <ExplicacionAPedido nombre="Dónde queda este preset" lugar="esquina">
                                    <span data-donde-vive-el-preset>{COPY_PRESCRIPCION_DE_LA_SESION.dondeVive}</span>
                                  </ExplicacionAPedido>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          {sesion ? (
                            <div className="comidas-del-plan ejercicios-del-editor" data-sesion={k + 1}>
                              {sesion.prescriptions.length === 0 && (sesion.exerciseGroups?.length ?? 0) === 0 ? <p className="nota">{C.sinEjercicios}</p> : null}
                              {/* DL-181: las partes de la sesión, en orden: ejercicios sueltos y bloques con los suyos. */}
                              {partesDeLaSesion(sesion).map((parte) => {
                                if (parte.tipo === 'suelto') return ejercicioEnLaSesion(parte.ejercicio.posicion, false);
                                const g = parte.bloque;
                                const m = parte.posicionDelBloque;
                                const clave = claveDelBloque(g.groupId);
                                return (
                                  <BloqueDelEditor
                                    key={g.groupId}
                                    id={`${prefijo}-s${k}-g${m}`}
                                    posicion={m}
                                    bloque={g}
                                    ejercicios={parte.ejercicios.length}
                                    sePuedeSubir={moverBloque(sesion, g.groupId, -1) !== null}
                                    sePuedeBajar={moverBloque(sesion, g.groupId, 1) !== null}
                                    renombrando={renombrandoBloque === clave}
                                    onRenombrar={() => setRenombrandoBloque(clave)}
                                    onTerminarDeRenombrar={() => setRenombrandoBloque(null)}
                                    onCambiarNombre={(v) => cambiarLaSesion((s) => cambiarBloque(s, g.groupId, { label: v }))}
                                    onCambiarTipo={(tipo) => conLasVueltas(g.groupId, (s) => cambiarTipo(s, g.groupId, tipo))}
                                    onCambiarVueltas={(v) => conLasVueltas(g.groupId, (s) => cambiarVueltas(s, g.groupId, v))}
                                    onCambiarDescanso={(v) => cambiarLaSesion((s) => cambiarBloque(s, g.groupId, { restAfterRoundSeconds: v }))}
                                    onSubir={() => {
                                      const r = moverBloque(sesion, g.groupId, -1);
                                      if (r) aplicarReordenada(r);
                                    }}
                                    onBajar={() => {
                                      const r = moverBloque(sesion, g.groupId, 1);
                                      if (r) aplicarReordenada(r);
                                    }}
                                    onQuitar={() => {
                                      cambiarLaSesion((s) => quitarBloqueDeLaSesion(s, g.groupId));
                                      setMensaje({ tipo: 'exito', texto: COPY_BLOQUES_DE_LA_SESION.quitarBloqueDetalle });
                                    }}
                                    onAgregarEjercicios={() => {
                                      setAgregandoEn(g.groupId);
                                      setAgregando(true);
                                    }}
                                  >
                                    {parte.ejercicios.map((e) => ejercicioEnLaSesion(e.posicion, true))}
                                  </BloqueDelEditor>
                                );
                              })}
                              <div className="editor-del-plan__al-pie con-ayuda-en-la-esquina">
                                <button
                                  type="button"
                                  id="agregar-ejercicios-a-la-sesion"
                                  className="boton boton--quieto"
                                  data-agregar-ejercicio
                                  data-recorrido="agregar-ejercicio"
                                  onClick={() => {
                                    setAgregandoEn(null);
                                    setAgregando(true);
                                  }}
                                >
                                  <Icono nombre="mas" tamano={18} />
                                  {COPY_ENTRENAMIENTO.agregarEjercicio}
                                </button>
                                {/* DL-181: un bloque nuevo, «Seguido», con su nombre a la vista para cambiarlo. §7: en el tope del
                                    contrato (20 por sesión) queda apagado, con su motivo a la vista. */}
                                <button
                                  type="button"
                                  className="boton boton--quieto"
                                  data-agregar-bloque-de-la-sesion
                                  data-recorrido="agregar-bloque"
                                  aria-disabled={sinAgregarBloque ? true : undefined}
                                  aria-describedby={sinAgregarBloque ? `${prefijo}-s${k}-tope-de-bloques` : undefined}
                                  onClick={() => {
                                    if (!sinAgregarBloque) agregarUnBloqueALaSesion();
                                  }}
                                >
                                  <Icono nombre="mas" tamano={18} />
                                  {COPY_BLOQUES_DE_LA_SESION.agregarBloque}
                                </button>
                                {sinAgregarBloque ? (
                                  <p id={`${prefijo}-s${k}-tope-de-bloques`} className="nota editor-del-plan__tope" data-tope-de-bloques>
                                    {sinAgregarBloque}
                                  </p>
                                ) : null}
                                {/* DL-196 (E4): «Qué es un bloque» y de dónde salen los ejercicios, en el «?» de la esquina. */}
                                <ExplicacionAPedido nombre="Qué es un bloque" como="div" lugar="esquina">
                                  <p>Los ejercicios salen del catálogo BE, de tus habituales o se crean a mano.</p>
                                  <p>{COPY_BLOQUES_DE_LA_SESION.queEs}</p>
                                  <p>{COPY_BLOQUES_DE_LA_SESION.ayudaSeguido}</p>
                                  <p>{COPY_BLOQUES_DE_LA_SESION.ayudaEnVueltas}</p>
                                </ExplicacionAPedido>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                  </div>
            ) : null}
          </section>
        </div>
        {/* DL-196 (EE-05): el panel contextual. «Antes de activar» ya no es una pestaña: va al lado de «Revisar y activar». */}
        <aside id="zona-panel" className="estacion__zona estacion__panel panel-del-editor" data-zona="panel" aria-label={CE.panel} tabIndex={-1} data-foco-del-panel={foco.tipo} data-recorrido="editor-entrenamiento-panel">
          {plantilla ? (
            // PLT (DL-182): en una plantilla, el panel es la revisión para guardarla (no hay persona ni fechas).
            <div aria-label={COPY_REVISION_DE_LA_PLANTILLA.titulo} data-panel-en-vivo>
              {listaAntesDeActivar}
            </div>
          ) : (
            panelDelFoco
          )}
          {/* «Otras áreas» solo aparece si tiene algo (sin datos, no ocupa nada). */}
          {!plantilla && asesoradoId !== null ? <OtrasAreas token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} area="ENTRENAMIENTO" /> : null}
          {/* DL-196 parte B: «Patrones» (el enfoque GR-27 del plan) pasó a la vista «Favoritos» del panel. */}
        </aside>
      </div>
      )}

      {/* ED-23 y ED-24: el cuadro de copiar, con destino, vista previa y un solo principal. */}
      <CuadroDeCopiar
        abierto={delCuadroDeCopiar !== null}
        titulo={delCuadroDeCopiar?.titulo ?? ''}
        sobretitulo={persona}
        leyenda={delCuadroDeCopiar?.leyenda ?? ''}
        opciones={delCuadroDeCopiar?.opciones ?? []}
        varios={delCuadroDeCopiar?.varios ?? false}
        vacio={delCuadroDeCopiar?.vacio ?? ''}
        queSeCopia={delCuadroDeCopiar?.queSeCopia ?? null}
        vistaPrevia={delCuadroDeCopiar?.vistaPrevia ?? (() => null)}
        textoDelPrincipal={delCuadroDeCopiar?.textoDelPrincipal ?? (() => '')}
        onCopiar={delCuadroDeCopiar?.onCopiar ?? (() => null)}
        onCerrar={() => setCopiando(null)}
      />

      {deshacerLaSesion ? (
        <AvisoFlotante onCerrar={() => setDeshacerLaSesion(null)} seQueda>
          <p>
            {COPY_BLOQUES_DE_LA_SESION.igualadas(deshacerLaSesion.vueltas)}{' '}
            <button type="button" className="boton boton--discreto" data-deshacer-las-vueltas onClick={deshacerLasVueltas}>
              <Icono nombre="deshacer" tamano={15} />
              {COPY_PRESETS.deshacer}
            </button>
          </p>
        </AvisoFlotante>
      ) : null}
      {arrastre.anuncio}
      {/* DL-199 (ET3-21): después de un cambio grande, «Deshacer» unos segundos, flotante (no corre nada: RP-19). */}
      {avisoDeDeshacer && !deshacer && !deshacerLaSesion ? (
        <AvisoFlotante key={avisoDeDeshacer.vez} onCerrar={() => setAvisoDeDeshacer(null)} seQueda>
          <p data-deshacer-el-ultimo>
            {avisoDeDeshacer.texto}{' '}
            <button type="button" className="boton boton--discreto" data-deshacer-el-ultimo-boton onClick={deshacerElUltimo} aria-keyshortcuts="Control+Z">
              <Icono nombre="deshacer" tamano={15} />
              {COPY_DESHACER.deshacer}
            </button>
          </p>
        </AvisoFlotante>
      ) : null}
      {deshacer ? (
        <AvisoFlotante onCerrar={() => setDeshacer(null)} seQueda>
          <p>
            {deshacer.texto}{' '}
            <button type="button" className="boton boton--discreto" data-deshacer onClick={deshacerLaAplicacion}>
              <Icono nombre="deshacer" tamano={15} />
              {COPY_PRESETS.deshacer}
            </button>
          </p>
        </AvisoFlotante>
      ) : null}

      <GaleriaDePresets
        abierto={galeria !== null}
        tarea={galeria?.tarea ?? 'prescripcion'}
        persona={persona}
        sesion={sesion ?? null}
        nombreDeLaSesion={sesion ? nombreDeLaSesion(sesion, k) : ''}
        ejercicio={galeria?.ejercicio ?? null}
        seReemplazan={loQueReemplazaLaEstructura(sesiones, tieneDias).map((n) => nombreDeLaSesion(sesiones[n]!, n))}
        nombreDe={(p) => nombres[p.exerciseVersionId] ?? 'Ejercicio'}
        habituales={sesionesHabituales.sesiones}
        prescripcionesHabituales={prescripcionesHabituales.lista}
        plantillas={
          leerPlantillas && onReemplazarConPlantilla
            ? { leer: leerPlantillas, borrador: `versión ${numero} en preparación`, reemplazando, error: falloAlReemplazar, noSePuede: plantillasNoSePueden, onReemplazar: (id) => void reemplazarConPlantilla(id) }
            : null
        }
        onAplicarPrescripcion={aplicarElPreset}
        onElegirParaLaSesionVacia={(nombre, aplicar) => {
          if (!sesion) return;
          // ENP-D18: atado al identificador de la sesión; si todavía no tiene (una habitual recién insertada), lo recibe ahora.
          const clave = sesion.sessionId ?? crypto.randomUUID();
          if (!sesion.sessionId) cambiarLaSesion((s) => ({ ...s, sessionId: clave }));
          setPrescripcionDeLaSesion((m) => ({ ...m, [clave]: { nombre, aplicar } }));
          setMensaje({ tipo: 'exito', texto: COPY_PRESCRIPCION_DE_LA_SESION.elegido(nombre) });
        }}
        onAplicarEstructura={aplicarLaEstructura}
        onInsertarHabitual={insertarSesion}
        onCerrar={() => setGaleria(null)}
      />

      {/* DL-196 parte B (E12, E19): el asistente de la progresión de una fase, o de la copia recién hecha. */}
      {progresionAbierta
        ? (() => {
            const n = bloques.findIndex((b) => b.blockId === progresionAbierta.blockId);
            const b = bloques[n];
            if (!b || !b.blockId) return null;
            const id = b.blockId;
            const copia = progresionAbierta.copia;
            const original = copia?.originalId ? bloques.find((x) => x.blockId === copia.originalId) : undefined;
            const reglaOriginal = copia?.originalId ? progresionDeLaFase(plan, copia.originalId) : null;
            return (
              <AsistenteDeProgresion
                abierto
                persona={persona}
                fase={nombreDelBloque(b, n)}
                blockId={id}
                semanasDeLaFase={semanasDeLaFase(plan, id)}
                ejercicios={ejerciciosDeUnaFase(b)}
                aproximacionesDe={aproximacionesDeId}
                actual={progresionDeLaFase(plan, id)}
                otras={bloques.flatMap((x, m) => {
                  const r = x.blockId && x.blockId !== id ? progresionDeLaFase(plan, x.blockId) : null;
                  return r ? [{ fase: nombreDelBloque(x, m), progresion: r }] : [];
                })}
                desdeLaCopia={
                  copia && original
                    ? {
                        original: copia.original,
                        progresion: reglaOriginal ? progresionParaOtraFase(reglaOriginal, id, copia.prescripciones) : null,
                        ejercicios: ejerciciosDeUnaFase(original),
                        semanas: semanasDeLaFase(plan, copia.originalId),
                      }
                    : null
                }
                onAplicar={(a) => aplicarLaProgresion(id, nombreDelBloque(b, n), a)}
                onCerrar={() => setProgresionAbierta(null)}
              />
            );
          })()
        : null}

      {/* DL-196 parte B: la distribución grande, con la silueta más alta y la tabla entera. */}
      <CuadroEnfocado
        abierto={distribucionGrande && !!bloque}
        forma="panel"
        titulo={`${NOMBRE_DE_LA_VISTA.distribucion} · ${deQueEsLaFase}`}
        sobretitulo={persona}
        className="distribucion-grande"
        onCerrar={() => setDistribucionGrande(false)}
      >
        {distribucionGrande && bloque ? distribucionDe(bloque, false) : null}
      </CuadroEnfocado>

      {/* DL-196 (EE-04): el almanaque grande, tres meses seguidos. */}
      <CuadroEnfocado abierto={almanaqueGrande} forma="panel" titulo={COPY_FASES.almanaque} sobretitulo={persona} className="almanaque-grande" onCerrar={() => setAlmanaqueGrande(false)}>
        {almanaqueGrande ? almanaque(3) : null}
      </CuadroEnfocado>

      <DialogoGuardarPlantilla
        token={token}
        abierto={guardarPlantilla}
        estructura={{ blocks: bloques }}
        planificacion={planificacionParaLaPlantilla(planificacionQueViaja(planificacion, bloques))}
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

      {/* ED-24: «Duplicar el día», con el día de destino y la vista previa antes de copiar. */}
      <CuadroEnfocado
        abierto={duplicandoElDia !== null}
        forma="dialogo"
        titulo={duplicandoElDia ? DD.titulo(duplicandoElDia.desde) : ''}
        principal={
          duplicandoElDia
            ? {
                texto: duplicandoElDia.hacia ? DD.principal(duplicandoElDia.hacia) : DD.accion,
                apagado: !duplicandoElDia.hacia ? DD.nadaElegido : null,
                alTocar: () => {
                  const { desde, hacia } = duplicandoElDia;
                  if (!hacia) return;
                  const r = duplicarElDia(bloques, agendaVisible, desde, hacia, () => crypto.randomUUID());
                  if (r.tipo !== 'duplicado') return setMensaje({ tipo: 'error', texto: DD.motivo[r.motivo] });
                  cambiar(() => r.bloques);
                  cambiarAgenda(r.agenda);
                  setDuplicandoElDia(null);
                  setMensaje({ tipo: 'exito', texto: DD.hecho(r.copiadas.length, hacia) });
                },
              }
            : null
        }
        onCerrar={() => setDuplicandoElDia(null)}
      >
        {duplicandoElDia ? (
          <div className="duplicar-el-dia" data-cuadro-duplicar-el-dia>
            <fieldset className="segmentos">
              <legend>{DD.destino}</legend>
              <div className="segmentos__fila">
                {diasDeDestino(duplicandoElDia.desde).map((d) => (
                  <label key={d} className="segmento">
                    <input type="radio" name="duplicar-el-dia" checked={duplicandoElDia.hacia === d} onChange={() => setDuplicandoElDia({ desde: duplicandoElDia.desde, hacia: d })} />
                    {DIA_CORTO[d]}
                    <span className="visualmente-oculto"> ({DIA_LARGO[d]})</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {duplicandoElDia.hacia ? <p data-vista-previa-del-dia>{DD.vistaPrevia(sesionesDelDia(bloques, agendaVisible, duplicandoElDia.desde), duplicandoElDia.hacia)}</p> : null}
          </div>
        ) : null}
      </CuadroEnfocado>

      <DialogoGuardarPrescripcionHabitual
        token={token}
        abierto={prescripcionHabitual && !!sesion}
        ejercicios={(sesion?.prescriptions ?? []).map((x) => ({ nombre: nombres[x.exerciseVersionId] ?? 'Ejercicio', prescripcion: x }))}
        existentes={prescripcionesHabituales.lista}
        onCerrar={() => setPrescripcionHabitual(false)}
        onGuardada={(h) => {
          setPrescripcionHabitual(false);
          setMensaje({ tipo: 'exito', texto: COPY_PRESCRIPCION_HABITUAL.guardada(h.name) });
          void prescripcionesHabituales.recargar();
        }}
      />

      {/* DL-195: el recorrido guiado del editor, sobre todo lo demás (va en un portal). */}
      <RecorridoGuiado definicion={RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO} abierto={recorrido.abierto} alCerrar={recorrido.cerrar} />

      {/* DL-198 (ET2-12): «Ver como la persona». */}
      {MOSTRAR_VISTA_DE_LA_PERSONA && bloque ? (
        <VistaDeLaPersona
          abierto={vistaDeLaPersona}
          onCerrar={() => setVistaDeLaPersona(false)}
          bloque={bloque}
          bloques={bloques}
          planificacion={plan}
          notacion={notacion}
          persona={persona}
          sesionInicial={k}
          nombreDe={(x) => nombres[x.exerciseVersionId] ?? 'Ejercicio'}
          letraDe={letraDeLaSesion}
        />
      ) : null}

      {/* DL-197 (ET1-02 a ET1-04): los cuadros de configuración. Los cuadros configuran; el panel, a la derecha, es para mirar. */}
      {/* DL-198 (ET2-10): en una plantilla, sin fechas, objetivo ni anotaciones (`enLaPlantilla`). */}
        <CuadroConfigurarPlan
          enLaPlantilla={!!plantilla}
          abierto={cuadroDelPlan === 'plan'}
          sobretitulo={persona}
          planificacion={plan}
          notacion={notacion}
          semanasDeLasFases={semanasQueSumanLasFases(plan, bloques)}
          conOtraIntensidad={conOtraIntensidad}
          onGuardar={(c) => {
            alCambiarElPlan(c.planificacion);
            if (c.notacion !== notacion) setNotacion(c.notacion);
            if (c.pasarLosDemas) pasarALaIntensidadDelPlan(c.planificacion.intensity);
            setSucio(true);
            // Sin aviso flotante: lo configurado se lee en «Fases del plan · fechas» (el aviso tapaba la fase).
            setCuadroDelPlan(null);
          }}
          onCerrar={() => setCuadroDelPlan(null)}
        />

      {bloque ? (
        <CuadroEditarFase
          key={bloque.blockId ?? `fase-${i}`}
          abierto={cuadroDelPlan === 'fase' && (faseQueSeAbre === null || faseQueSeAbre === i)}
          sobretitulo={persona}
          enLaPlantilla={!!plantilla}
          fase={{ nombre: bloque.label, semanas: semanasDeLaFase(plan, bloque.blockId), objetivo: bloque.purpose ?? null, anotaciones: anotacionesDeLaFase(plan, bloque.blockId) }}
          fechas={(() => {
            const t = tarjetasDeLaBarra(plan, bloques)[i];
            const fechas = fechasDeFases[i];
            return [t && t.desde !== null && t.hasta !== null ? COPY_BARRA_DE_FASES.semanas(t.desde, t.hasta) : null, fechas ? rangoCivil(fechas.desde, fechas.hasta) : null].filter(Boolean).join(' · ') || null;
          })()}
          sePuedeQuitar={bloques.length > 1}
          onGuardar={(e) => {
            setFaseQueSeAbre(null);
            cambiar((x) => ((x[i]!.label = e.nombre), (x[i]!.purpose = e.objetivo), x));
            // DL-198 (ET2-10): una plantilla guarda las semanas de la fase; las anotaciones son de un plan con persona.
            conIdDeLaFase((id) => cambiarPlanificacion(plantilla ? conSemanasDeLaFase(plan, id, e.semanas) : conAnotacionesDeLaFase(conSemanasDeLaFase(plan, id, e.semanas), id, e.anotaciones)));
            setCuadroDelPlan(null);
          }}
          onDuplicar={() => {
            setCuadroDelPlan(null);
            duplicarLaFase(i);
          }}
          onQuitar={() => {
            setCuadroDelPlan(null);
            quitarBloque();
          }}
          onCerrar={() => {
            setCuadroDelPlan(null);
            setFaseQueSeAbre(null);
          }}
        />
      ) : null}
      {bloque && !plantilla ? (
        <CuadroDiasDeLaSemana
          abierto={cuadroDelPlan === 'dias'}
          sobretitulo={persona}
          fase={[nombreDelBloque(bloque, i), resumenDeLaFase(bloque, i)].join(' · ')}
          sesiones={sesiones.map((x, m) => ({ id: x.sessionId ?? null, letra: letraDeLaSesion(m), nombre: nombreDeLaSesion(x, m), dias: diasDe(x) }))}
          onGuardar={(filas) => {
            cambiar((x) => {
              lasSesiones(x).forEach((y, m) => {
                const nuevo = filas[m]?.nombre;
                if (nuevo && nuevo !== y.label) y.label = nuevo;
              });
              return x;
            });
            let a = agendaVisible;
            for (const fila of filas) if (fila.id) a = ponerDias(a, fila.id, fila.dias, inicioDeLaAgenda);
            if (a !== agendaVisible) cambiarAgenda(agendaDelPlan(a));
            setCuadroDelPlan(null);
          }}
          onCerrar={() => setCuadroDelPlan(null)}
        />
      ) : null}

      <AgregarEjercicio
        abierto={agregando && !!sesion}
        deDonde={dondeSeAgrega}
        habituales={ejerciciosHabituales}
        prescripcionDeLaSesion={prescripcionDeEstaSesion?.nombre ?? null}
        // Revisión adversaria (DL-197): lo que la sesión ya tiene se marca en la lista, por versión y por ejercicio.
        enLaSesion={new Set((sesion?.prescriptions ?? []).flatMap((q) => [q.exerciseVersionId, ...(ejercicios[q.exerciseVersionId] ? [ejercicios[q.exerciseVersionId]!] : [])]))}
        onAgregar={(marcados, prescripcion) => {
          if (!sesion) return;
          setNombres((n) => ({ ...n, ...Object.fromEntries(marcados.map((e) => [e.versionId, e.name])) }));
          // ED-21: entran juntos, en el orden marcado; sin prescripción para todos, cada uno con una serie para completar.
          // ENP-D10: sin una escrita en el cajón, con la de la sesión, si se eligió. DL-181: al bloque desde cuyo pie se abrió.
          // DL-199 (ET3-13): los de cardio por su clasificación entran como cardio, con la duración sin indicar.
          const nuevas = prescripcionesDeLosMarcados(marcados, prescripcion).map((x, n) =>
            esDeCardioPorLaClasificacion(marcados[n] as { classification?: { muscleGroup?: string | null } | null }) ? conElCardio(x, CARDIO_SIN_INDICAR) : !prescripcion && prescripcionDeEstaSesion ? prescripcionDeEstaSesion.aplicar(x) : x,
          );
          aplicarReordenada(agregarEjercicios(sesion, nuevas, agregandoEn));
        }}
        onCerrar={() => {
          setAgregando(false);
          setAgregandoEn(null);
        }}
      />

      {esDelPlan(version) ? (
      <AntesDeActivar
        abierto={confirmar}
        area="Entrenamiento"
        persona={persona}
        numero={numero}
        vigente={vigente?.numero ?? null}
        primera={!version.predecessorPlanId}
        impiden={impidenActivar}
        sinCompletar={sinCompletarAlActivar}
        // ENP-D13: el cuadro no dice «Nada impide activar» antes de que la API revise esta versión. Sin su revisión (recién
        // abierto, o con la de otra versión), está revisando; con cambios sin guardar, ofrece primero «Guardar ahora».
        revisando={!sucio && (revision === null || revision.version !== version.version || revision.estado === 'revisando')}
        sinRevisar={revision?.estado === 'fallo' && revision.version === version.version}
        onVolverARevisar={() => void revisar(version)}
        sinGuardar={sucio}
        guardando={guardando}
        conflicto={conflicto}
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
      ) : (
        <AntesDeGuardarLaPlantilla
          abierto={confirmar}
          preparacion={version.preparacion}
          impiden={impidenGuardar}
          paraCompletar={paraCompletarAlUsarla}
          revisando={!sucio && (revision === null || revision.version !== version.version || revision.estado === 'revisando')}
          sinRevisar={revision?.estado === 'fallo' && revision.version === version.version}
          onVolverARevisar={() => void revisar(version)}
          sinGuardar={sucio}
          guardando={guardando}
          conflicto={conflicto}
          onGuardarAhora={() => void guardar()}
          cambios={cambiosFrenteALaBase}
          cargas={cargasEscritas > 0 ? (metadatos.conCargas ? PLT.cargasVan(cargasEscritas) : PLT.cargasEscritasNoVan(cargasEscritas)) : null}
          guardandoLaPlantilla={guardandoLaPlantilla}
          error={falloAlGuardarLaPlantilla}
          onGuardar={() => void guardarComoPlantilla()}
          onVolver={cerrarAntesDeActivar}
        />
      )}

      {esDelPlan(version) ? (
      <CuadroDelDescarte
        abierto={descartar}
        persona={persona}
        numero={numero}
        vigente={vigente ? { numero: vigente.numero, desde: diaEnUnaFrase(vigente.desde) } : null}
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
      ) : (
        <DescartarLaPreparacion
          abierto={descartar}
          preparacion={version.preparacion}
          enviando={descartando}
          error={falloDelDescarte}
          onVolver={() => {
            setDescartar(false);
            setFalloDelDescarte(null);
          }}
          onDescartar={() => void descartarLaVersion()}
        />
      )}
    </section>
    </ProveedorDeLaNotacion>
  );
}

/**
 * PLT (DL-182): el mismo editor sobre la preparación de una plantilla, sin persona. Se guarda como plantilla o como una
 * versión nueva, no se activa: lo del plan de una persona (activar, la agenda, el asistente) no se usa.
 */
export function EditorDePlantilla({ plantilla }: { readonly plantilla: EdicionDePlantilla }) {
  return <EditorDePlan planId={plantilla.preparacionId} numero={0} objetivoVigente={null} onActivado={sinPersona} onDescartado={sinPersona} plantilla={plantilla} />;
}

/** Sin persona no hay versión que activar ni borrador del plan que descartar: lo preparado lo resuelve `plantilla`. */
const sinPersona = (): void => undefined;

/** DL-196: los textos del plan y sus fases en el editor. */
/** DL-197 (ET1-04): la semana tipo de la fase, en un renglón; la matriz va en el cuadro «Días de la semana». */
const COPY_SEMANA_TIPO = {
  titulo: 'Semana tipo',
  sinDias: 'todavía sin días: elegilos en «Días de la semana»',
  sesionesDeLaFase: 'Las sesiones de la fase: elegí una para verla',
  nuevaSesion: 'Nueva sesión',
} as const;

/** DL-197 (ET1-D03, F4): «Antes de activar» con las fases de más, y sus dos salidas. */
const COPY_FASES_DE_MAS = {
  texto: (suman: number, plan: number) => `las fases suman ${suman} semanas y el plan dura ${plan}: lo de después del fin no tendría fechas`,
  llevar: (n: number) => `Llevar el plan a ${n} semanas`,
  recortar: 'Recortar la última fase',
  noAlcanza: 'A la última fase le quedaría menos de una semana: acortá otras fases o llevá el plan a la suma.',
  llevado: (n: number) => `El plan pasó a ${n} semanas: las fases entran enteras.`,
  recortada: (nombre: string, n: number) => `«${nombre}» quedó con ${n} ${n === 1 ? 'semana' : 'semanas'}: las fases entran en el plan.`,
} as const;

/** DL-197 (F6): el ícono de cada vista del panel. */
const ICONO_DE_LA_VISTA: Readonly<Record<VistaDelPanel, 'calendario' | 'entrenamiento' | 'sube' | 'habitual'>> = { almanaque: 'calendario', distribucion: 'entrenamiento', progresion: 'sube', favoritos: 'habitual' };

const COPY_FASES = {
  titulo: 'Fases',
  elPlan: 'El plan',
  almanaque: 'Almanaque',
  ayuda: 'Cada fase dura unas semanas: una detrás de la otra desde el inicio del plan. Adentro van sus días de la semana y sus sesiones.',
  ayudaEnLaPlantilla: 'En una plantilla, las fases no tienen fechas: las toman en el plan de cada persona.',
  sinSemanas: 'Sin semanas',
  copiarLaAnterior: 'Copiar la fase anterior',
} as const;
