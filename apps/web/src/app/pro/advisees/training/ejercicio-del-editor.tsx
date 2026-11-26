'use client';

/**
 * Un ejercicio de la versión en preparación del plan de entrenamiento (WP-ESCRITORIO-AREAS, parte 8; maqueta 28).
 * Plegado, un renglón con lo que piden sus series —lo escrito, todavía sin guardar, resuelto como lo va a resolver la
 * API— y con lo que adentro pide atención. Abierto, sus series en una tabla y «Lo general del ejercicio» al costado.
 * - **Intensidad: % RM o RIR, o ninguno;** nunca los dos (B10-06:398-410). Con un criterio elegido, su objetivo no es
 *   opcional. La carga sugerida va aparte y no es el criterio (B10-06:463-477).
 * - **Cada objetivo de una serie tiene tres estados (DL-122),** en una sola celda: vacía, la serie toma el de lo
 *   general, que se lee en gris; con un valor, tiene el suyo; y con «Sin indicar en esta serie», que se elige con el botón de la
 *   celda, no tiene ninguno aunque lo general lo tenga. Lo que se ve es lo que recibe el asesorado: por eso ya no hace
 *   falta la tabla «Así lo ve tu asesorado». El RIR de una serie existe solo con el criterio RIR: al cambiar de
 *   criterio, se quita.
 * - **El descanso se lee «02:30».** Se escribe así o, como antes, en segundos («150»).
 * - **Lo que no se entiende no se guarda como otra cosa:** la celda lo marca, el renglón del ejercicio lo dice, también
 *   plegado, y el editor no deja guardar hasta corregirlo.
 * - Cómo se cuentan la carga y las repeticiones va a un clic; si ya hay algo elegido, se abre solo: no se esconde un dato.
 * - **Duplicar y reordenar** (TB-48): «Subir» y «Bajar» al lado de «Más», y «Duplicar ejercicio» adentro; la copia va
 *   justo después, abierta (`advisees/editar-la-estructura.ts`).
 */
import {
  BaseDeCargaSchema,
  BaseDeRepeticionesSchema,
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  ETIQUETA_DE_BASE_DE_CARGA,
  ETIQUETA_DE_BASE_DE_REPETICIONES,
  ETIQUETA_DE_CRITERIO,
  cuentaDeSeries,
  celdaDeObjetivoDelEditor,
  ejercicioPlegadoDelEditor,
  esLoQueTieneLaCelda,
  leerDescanso,
  leerNumero,
  objetivoElegidoEnLaCelda,
  objetivoEscritoEnLaCelda,
  entraEnLaEstimacion,
  textoDeSegundos,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type ImagenDeEjercicio,
  type OpcionDeLaCelda,
  COPY_NOTAS_PROPIAS,
  conElCalentamientoArriba,
  esDeCalentamiento,
  COPY_NOTACION_DEL_ESFUERZO,
  esfuerzoEnCampo,
  leerRpeEscrito,
  type NotacionDelEsfuerzo,
  type AproximacionesDelEjercicio,
  DESCANSO_DE_APROXIMACION,
  implementoDelEjercicio,
  cardioDe,
  conElCardio,
  sinElCardio,
  CARDIO_SIN_INDICAR,
  COPY_CARDIO,
} from '@be/domain';
import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { SeccionDeAproximaciones } from './aproximaciones-del-ejercicio';
import { CardioDelEjercicio } from './cardio-del-ejercicio';
import { conLasAproximacionesSinRir, cuantasAproximaciones, resumenDeLasAproximaciones, rotulosConAproximaciones, serieAlDesmarcarLaAproximacion } from './aproximaciones';
import { AYUDAS_DEL_EDITOR, ContenidoDeLaAyuda } from './ayudas-del-editor';
import { cifrasTrasLaTecla, textoDeLaMascara } from './mascara-de-tiempo';
import { EnPartes } from '../../../../components/en-partes';
import { Campo, RenglonDelAviso } from '../../../../components/formulario';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { ConFlechas } from '../../../../components/flechas-del-numero';
import { Icono } from '../../../../components/icono';
import type { ArrastreDeLaTarjeta } from './arrastrar-ejercicios';
import { MenuDeAcciones, type AccionDelMenu } from '../../../../components/menu-de-acciones';
import { numeroEnCampo } from '../../../../lib/formato';
import { COPY_DE_LOS_EDITORES as EDICION, sinLaSerie } from '../editar-la-estructura';
import { ImagenGuardadaDeEjercicio } from '../../exercises/imagen-de-ejercicio';
import { useEditorDeEntrenamiento } from './entrenamiento';
import { LineaDePrescripcion } from './linea-de-prescripcion';
import { COPY_ESCRITURA_RAPIDA } from './escritura-rapida';
import { cambioDeCriterio, conElCriterio, COPY_CAMBIO_DE_CRITERIO, deshacerElCambioDeCriterio, sigueElCambio, type CambioDeCriterio } from './cambio-de-criterio';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { COPY_DETALLE_DEL_EJERCICIO, DetalleDelEjercicio } from '../fuerza/detalle-del-ejercicio';
import { COPY_CARGA_DESDE_LA_ESTIMACION } from '../fuerza/carga-desde-la-estimacion';
import type { PrescripcionParaLaCarga } from '../fuerza/fuerza';
import { COPY_COPIAR } from './copiar-a';
import { COPY_LA_VEZ_PASADA_EN_EL_EDITOR, CuadroDeLaVezPasada } from './la-vez-pasada';
import {
  celdaDeLaPlanilla,
  conUnPaso,
  copiarHaciaAbajo,
  COPY_PLANILLA as PL,
  escribirEnLasSeries,
  LIMITES_DE_LA_PLANILLA,
  leerCargaDeLaPlanilla,
  leerDescansoDeLaPlanilla,
  leerRepeticiones,
  loQueNoSeEntiendeEnLasSeries,
  loQueSePierdeAlQuitarLaSerie,
  origenDeLaCelda,
  textoDeLoQueNoSeEntiende,
} from './planilla-de-series';
import { NotasAlLado, useNotasPropias } from '../notas-propias';
import { UnoRMDelEjercicio } from './uno-rm-del-ejercicio';
import { useNotacionDelEsfuerzo } from '../notacion-del-esfuerzo';

export type Bloques = EstructuraDePlanDeEntrenamientoEntrada['blocks'];
export type BloqueE = Bloques[number];
export type SesionE = NonNullable<BloqueE['sessions']>[number];
export type PrescripcionE = SesionE['prescriptions'][number];
type Criterio = 'PERCENT_RM' | 'RIR';
type Serie = PrescripcionE['sets'][number];
type Repeticiones = Serie['repetitions'];

/**
 * Lo escrito en un campo que se interpreta (un número, un rango, un tiempo). El campo guarda el texto tal como se
 * escribe y propaga lo interpretado: si mostrara siempre el valor interpretado, «6-» o «62.» se borrarían a mitad de
 * camino. Si el valor cambia desde afuera (al guardar, al quitar un ejercicio, al elegir «Sin indicar en esta serie»), el texto se
 * resincroniza; lo mal escrito queda a la vista mientras el valor siga siendo ese. Al salir del campo, lo que se
 * entendió puede pasar a su forma de mostrarse («150» → «02:30»).
 */
function useTextoInterpretado<T, E extends T = T>(
  valor: T,
  o: {
    /** Lo que resume el valor de afuera: cuando cambia, se vuelve a comparar con lo escrito. */
    readonly clave: string;
    readonly formatear: (v: T) => string;
    readonly interpretar: (s: string) => E;
    /** Si lo escrito ya dice ese valor: entonces el texto no se toca. */
    readonly mismo: (escrito: E, valor: T) => boolean;
    readonly alCambiar: (v: E) => void;
    readonly normalizarAlSalir?: boolean;
  },
) {
  const externo = o.formatear(valor);
  const [texto, setTexto] = useState(externo);
  useEffect(() => {
    // Solo importa el valor de afuera, que `clave` resume: formatear, interpretar y comparar son funciones puras.
    setTexto((t) => (o.mismo(o.interpretar(t), valor) ? t : externo));
  }, [externo, o.clave]);
  return {
    texto,
    alEscribir: (t: string) => {
      setTexto(t);
      o.alCambiar(o.interpretar(t));
    },
    // Lo que no se entendió se deja como está: la persona tiene que verlo para corregirlo.
    alSalir: () => {
      if (o.normalizarAlSalir) setTexto((t) => o.formatear(o.interpretar(t)) || t);
    },
  };
}

/** Un campo con su rótulo cuyo texto se interpreta. Con `noSeEntiende`, dice el formato cuando lo escrito no lo cumple. */
function CampoInterpretado<T>({
  valor,
  clave,
  formatear,
  interpretar,
  mismo,
  onCambiar,
  normalizarAlSalir,
  noSeEntiende,
  avisoAparte,
  ...campo
}: Omit<ComponentProps<typeof Campo>, 'value' | 'onChange' | 'onBlur' | 'error'> & {
  valor: T;
  clave: string;
  formatear: (v: T) => string;
  interpretar: (s: string) => T;
  mismo: (escrito: T, valor: T) => boolean;
  onCambiar: (v: T) => void;
  normalizarAlSalir?: boolean;
  /** El aviso del campo cuando hay algo escrito que no se entiende. */
  noSeEntiende?: string;
  /**
   * RP-22: el aviso no va debajo del campo sino en un renglón reservado de quien lo muestra (`id`): en una fila de campos
   * alineados por abajo, el renglón de uno solo los desalineaba. El campo se marca y avisa si lo escrito se entiende.
   */
  avisoAparte?: { readonly id: string; readonly onMal: (mal: boolean) => void };
}) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave, formatear, interpretar, mismo, alCambiar: onCambiar, normalizarAlSalir });
  const mal = !!noSeEntiende && texto.trim() !== '' && formatear(interpretar(texto)) === '';
  const onMal = avisoAparte?.onMal;
  useEffect(() => {
    onMal?.(mal);
  }, [mal, onMal]);
  if (avisoAparte) {
    const descripcion = [campo.ayuda ? `${campo.id}-ayuda` : null, mal ? avisoAparte.id : null].filter(Boolean).join(' ') || undefined;
    return <Campo {...campo} value={texto} aria-invalid={mal || undefined} aria-describedby={descripcion} onChange={(e) => alEscribir(e.target.value)} onBlur={alSalir} />;
  }
  // RP-22: solo el campo que puede avisar recibe `error` (y con él, su renglón reservado dentro de `.avisos-con-lugar`).
  return <Campo {...campo} value={texto} error={noSeEntiende ? (mal ? noSeEntiende : null) : undefined} onChange={(e) => alEscribir(e.target.value)} onBlur={alSalir} />;
}

/**
 * Un número del editor: vacío → null; lo que no es un número → NaN, que no deja guardar. La lectura la hace `leerNumero`
 * del dominio, que acepta coma o punto por igual (DL-091 punto 4).
 */
function leerValor(s: string): number | null {
  if (s.trim() === '') return null;
  return leerNumero(s) ?? Number.NaN;
}
const escribirNumero = (n: number | null): string => (n === null || Number.isNaN(n) ? '' : numeroEnCampo(n));
const mismoNumero = (a: number | null, b: number | null): boolean => Object.is(a, b);

/**
 * DL-192 · el RIR guardado, como se escribe en la notación del plan: «2» en RIR; «8», «8,5» o «6 o menos» en RPE. Lo que
 * se escribe en RPE se guarda como su RIR (`leerRpeEscrito`): «8» es RIR 2. El número guardado nunca cambia solo.
 */
const rirEnCampo = (notacion: NotacionDelEsfuerzo) => (n: number): string => (notacion === 'RIR' ? numeroEnCampo(n) : esfuerzoEnCampo(n, notacion));
const leerElRir = (notacion: NotacionDelEsfuerzo) => (s: string): number | null => (notacion === 'RIR' ? leerNumero(s) : leerRpeEscrito(s));
/** DL-192: el rango del campo, dicho en la notación. */
const RANGO_DEL_ESFUERZO: Readonly<Record<NotacionDelEsfuerzo, string>> = { RIR: '0 a 10', RPE: '6 o menos a 10' };
/** El descanso general: vacío → null; «02:30» o los segundos; lo demás → NaN. */
const leerElDescanso = (s: string): number | null => (s.trim() === '' ? null : (leerDescansoDeLaPlanilla(s, leerDescanso) ?? Number.NaN));
/** RP-22: la carga común: vacío → null; un número desde 0; lo demás (también lo negativo) → NaN. */
const leerLaCarga = (s: string): number | null => (s.trim() === '' ? null : (leerCargaDeLaPlanilla(s, leerNumero) ?? Number.NaN));
const leerCargaDeLaSerie = (s: string): number | null => leerCargaDeLaPlanilla(s, leerNumero);
const leerDescansoDeLaSerie = (s: string): number | null => leerDescansoDeLaPlanilla(s, leerDescanso);
const PASOS = { leerNumero, leerDescanso } as const;
type CampoConPaso = 'repetitions' | 'restSeconds' | 'suggestedLoad';
/** RP-22: ↑ y ↓ dan un paso en la celda (con Mayúsculas, cuatro); `null` si no es una flecha o no hay paso que dar. */
function pasoConLaFlecha(e: KeyboardEvent<HTMLInputElement>, campo: CampoConPaso, desde: number | null, unidad?: 'kg' | 'lb'): number | null {
  if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || e.ctrlKey || e.metaKey || e.altKey) return null;
  e.preventDefault();
  return conUnPaso(campo, e.currentTarget.value, desde, e.key === 'ArrowUp', { ...PASOS, unidad, grande: e.shiftKey });
}
/** RP-22: el paso de las flechitas a la vista (`ConFlechas`), desde lo escrito. */
const pasoConElMouse = (campo: CampoConPaso, texto: string, sube: boolean, unidad?: 'kg' | 'lb'): number | null => conUnPaso(campo, texto, null, sube, { ...PASOS, unidad });
const escribirElDescanso = (n: number | null): string => (n === null || Number.isNaN(n) ? '' : (textoDeSegundos(n) ?? ''));

/**
 * DL-196 (E15) · la máscara «mm:ss» de los campos de tiempo (`mascara-de-tiempo.ts`): el «:» queda fijo y lo que se
 * escribe entra por los minutos («3» es 03:00; «130», 01:30). Al entrar al campo se elige todo: la primera cifra empieza
 * de nuevo. Pegar sigue entendiendo «2:30» o los segundos. Las flechas dan su paso como siempre.
 */
function useMascaraDeTiempo(activa: boolean, alEscribir: (t: string) => void) {
  const cifras = useRef<string | null>(null);
  return {
    alEntrar: (e: FocusEvent<HTMLInputElement>) => {
      cifras.current = null;
      if (activa) e.currentTarget.select();
    },
    alSalir: () => {
      cifras.current = null;
    },
    /** Si la tecla era de la máscara (una cifra, Borrar, Suprimir o «:»): ya la escribió. */
    alTeclear: (e: KeyboardEvent<HTMLInputElement>): boolean => {
      if (!activa || e.ctrlKey || e.metaKey || e.altKey) return false;
      if (e.key === ':') {
        e.preventDefault();
        return true;
      }
      const siguiente = cifrasTrasLaTecla(cifras.current ?? '', e.key);
      if (siguiente === null) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') cifras.current = null;
        return false;
      }
      e.preventDefault();
      cifras.current = siguiente;
      alEscribir(textoDeLaMascara(siguiente));
      return true;
    },
  };
}

/** DL-196 (E11) · los pasos de las acciones rápidas: la carga en kg o lb, el descanso en segundos. */
const PASOS_RAPIDOS = { suggestedLoad: [-5, -2.5, -1, 1, 2.5, 5], restSeconds: [-15, -5, 5, 15] } as const;

/**
 * DL-196 (E11) · las acciones rápidas de un campo: al enfocar la carga, −5 · −2,5 · −1 · +1 · +2,5 · +5 (en su unidad);
 * al enfocar el descanso, −15 · −5 · +5 · +15 s. Aparecen debajo del campo mientras tiene el foco y no se llevan el foco
 * (las flechas del teclado siguen dando su paso). Nada baja de cero ni pasa una hora.
 */
function AccionesRapidas({ campo, unidad = 'kg', desde, alAplicar, de }: { campo: 'suggestedLoad' | 'restSeconds'; unidad?: 'kg' | 'lb'; desde: number | null; alAplicar: (n: number) => void; de: string }) {
  const sufijo = campo === 'restSeconds' ? 's' : unidad;
  return (
    <span className="acciones-rapidas" role="group" aria-label={`Acciones rápidas: ${de}`} data-acciones-rapidas={campo}>
      {PASOS_RAPIDOS[campo].map((paso) => (
        <button
          key={paso}
          type="button"
          tabIndex={-1}
          className="acciones-rapidas__paso"
          aria-label={`${paso > 0 ? 'Sumar' : 'Restar'} ${numeroEnCampo(Math.abs(paso))} ${sufijo} a ${de}`}
          // No se lleva el foco: el campo sigue siendo el que se edita.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => alAplicar(Math.min(campo === 'restSeconds' ? 3600 : Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(((desde ?? 0) + paso) * 100) / 100)))}
          data-paso={paso}
        >
          {paso > 0 ? '+' : '−'}
          {numeroEnCampo(Math.abs(paso))}
        </button>
      ))}
      <span className="acciones-rapidas__unidad" aria-hidden="true">
        {sufijo}
      </span>
    </span>
  );
}

/** El campo con sus acciones rápidas debajo, que se ven mientras el foco está adentro. */
const ConAccionesRapidas = ({ children, acciones }: { children: ReactNode; acciones: ReactNode }) => (
  <span className="con-acciones-rapidas">
    {children}
    {acciones}
  </span>
);

/** La unidad de las cargas de una prescripción: la de su carga sugerida, o kg. Las series usan la misma (DL-122). */
const unidadDe = (p: PrescripcionE): 'kg' | 'lb' => p.suggestedLoad?.unit ?? p.sets.find((x) => x.suggestedLoad)?.suggestedLoad?.unit ?? 'kg';

const noSeEntiendenLasReps = (r: Repeticiones): boolean => !!r && ('value' in r ? Number.isNaN(r.value) : Number.isNaN(r.min) || Number.isNaN(r.max));
/** DL-201: «Progresión…» en el «Más» del ejercicio. */
const COPY_PROGRESION_DEL_EJERCICIO = 'Progresión…';
const reps = (r: Repeticiones): string => (!r || noSeEntiendenLasReps(r) ? '' : 'value' in r ? String(r.value) : `${r.min}-${r.max}`);
// Vacío: sin repeticiones fijadas. Un número o un rango «8-12». Otra cosa no se guarda como si no hubiera nada; un rango
// al revés («12-8») tampoco (`leerRepeticiones`, en la planilla: la usan la celda y la edición conjunta).
const leerReps = (s: string): Repeticiones => leerRepeticiones(s);
const mismasReps = (a: Repeticiones, b: Repeticiones): boolean => reps(a) === reps(b) && noSeEntiendenLasReps(a) === noSeEntiendenLasReps(b);

export function EjercicioDelEditor({
  id,
  posicion,
  prescripcion: p,
  nombre,
  imagen,
  abierto,
  problemas,
  alAlternar,
  onCambiar: onCambiarTalCual,
  onQuitar,
  esElPrimero,
  esElUltimo,
  onSubir,
  onBajar,
  onDuplicar,
  onCopiar,
  onAplicarLinea,
  revisar = null,
  exerciseId = null,
  nivel = 'h3',
  accionesDelBloque = [],
  lineaSinAplicar = '',
  onLineaSinAplicar,
  aproximaciones = null,
  onAproximaciones,
  intensidadDelPlan = null,
  sinIntensidad = false,
  onSinIntensidad,
  arrastre = null,
  progresionPropia = null,
  onProgresion,
}: {
  /** DL-201: su progresión propia en pocas palabras (plegado), si tiene; y abrir «Progresión…» con este ejercicio elegido. */
  progresionPropia?: string | null;
  onProgresion?: () => void;
  /** DL-199 (ET3-22): el asa para arrastrar y las teclas Alt+↑ y Alt+↓ (`arrastrar-ejercicios.tsx`); sin esto, no se arrastra. */
  arrastre?: ArrastreDeLaTarjeta | null;
  /** DL-197 (ET1-D10, ET1-D11): el criterio del plan, que hereda el ejercicio sin criterio propio; `null`, ninguno. */
  intensidadDelPlan?: Criterio | null;
  /** El ejercicio no lleva intensidad aunque el plan sí (la excepción, en «Más opciones»). */
  sinIntensidad?: boolean;
  onSinIntensidad?: (sin: boolean) => void;
  /** DL-196 (EE-07): cómo se arman las aproximaciones (de la planificación) y cómo se guarda; sin esto, no se ofrecen. */
  aproximaciones?: AproximacionesDelEjercicio | null;
  onAproximaciones?: (c: Omit<AproximacionesDelEjercicio, 'prescriptionId'>) => void;
  /** C7: lo escrito en la escritura rápida y todavía sin aplicar; vive en el editor (`escritura-rapida.ts`). */
  lineaSinAplicar?: string;
  onLineaSinAplicar?: (texto: string) => void;
  /** DL-181: el nivel del título; dentro de un bloque de la sesión, uno más (`h4`). */
  nivel?: 'h3' | 'h4';
  /** DL-181: «Pasar a Torso» o «Sacar del bloque», en su «Más». */
  accionesDelBloque?: readonly AccionDelMenu[];
  /** El prefijo de los identificadores de sus campos: `b0-s1-p2`, las posiciones del bloque, la sesión y el ejercicio. */
  id: string;
  posicion: number;
  prescripcion: PrescripcionE;
  nombre: string;
  imagen: ImagenDeEjercicio | null;
  abierto: boolean;
  /** Cuántos problemas de «Validar» hay adentro. */
  problemas: number;
  alAlternar: () => void;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  onQuitar: () => void;
  esElPrimero: boolean;
  esElUltimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  /** TB-48: la copia del ejercicio, justo después. */
  onDuplicar: () => void;
  /** ED-23: abre el cuadro de copiar el ejercicio, su prescripción o sus series. */
  onCopiar?: (que: 'ejercicio' | 'prescripcion' | 'series') => void;
  /** ED-22: la prescripción que dejó la línea, y la marca de la carga a revisar si cambiaron las repeticiones. */
  onAplicarLinea: (p: PrescripcionE, revisar: string | null) => void;
  /** DJ-8: la carga quedó escrita para otras repeticiones («escrita para 6-8: revisala»). */
  revisar?: string | null;
  /** El ejercicio del catálogo, si ya se conoce (lo trae la versión guardada): con él, la fuerza estimada (§5.8). */
  exerciseId?: string | null;
}) {
  // DL-197 (F15): cada cambio deja las aproximaciones sin RIR, en la forma que acepta el contrato.
  const onCambiar = (c: Partial<PrescripcionE>) => onCambiarTalCual(conLasAproximacionesSinRir(p, c));
  // PLT (DL-182): sin persona (una plantilla), el editor no pasa el ejercicio del catálogo y nada de esto se pide.
  const { token, asesoradoId, sesionPerdida } = useEditorDeEntrenamiento();
  // PG-16 (DL-173): «Anotar sobre este ejercicio», si el editor tiene las notas propias y se sabe qué ejercicio es.
  const notasPropias = useNotasPropias();
  const propio = useId();
  // DL-192: el renglón del ejercicio plegado, en la notación del plan.
  const notacionDelPlan = useNotacionDelEsfuerzo();
  const plegado = ejercicioPlegadoDelEditor(p, problemas, notacionDelPlan);
  // DL-199 (ET3-13 a ET3-15): un ejercicio de cardio se planifica con su duración, su distancia y su intensidad.
  const cardio = cardioDe(p);
  // ED-75: el detalle con la fuerza estimada, solo en los ejercicios de la lista de la v1 (RM-16).
  const conFuerza = exerciseId !== null && entraEnLaEstimacion(exerciseId);
  // ED-76 (EDT-56): las series elegidas en la planilla para las que se calcula la carga; `null`, la fila general.
  const [seriesDeLaCarga, setSeriesDeLaCarga] = useState<readonly number[] | null>(null);
  const [detalle, setDetalle] = useState(false);
  // GR-01 (WP-GRAFICOS, fase 1): «La vez pasada» de un ejercicio fuera de la lista de la v1, en su propio cuadro lateral,
  // sin la fuerza estimada. Los de la lista la ven dentro del detalle (ED-75): DL-174 abre el cuadro para todos, y la
  // fuerza estimada sigue solo en la lista de la v1 (GR-T70).
  const conLaVezPasada = !conFuerza && exerciseId !== null;
  const [vezPasada, setVezPasada] = useState(false);
  // DL-197 (F16): uno de los tres cuadros del ejercicio abierto: las aproximaciones, todas las series o «Más opciones».
  const [cuadro, setCuadro] = useState<'aproximaciones' | 'todas' | 'opciones' | null>(null);
  // ET1-D05 (revisión adversaria): «Editar todas las series» con algo escrito sin aplicar pregunta antes de cerrarse.
  const [todasConCambios, setTodasConCambios] = useState(false);
  // DL-197 (ET1-D11): el criterio que rige: el propio o, sin él (y sin la excepción), el del plan.
  const criterioEfectivo: Criterio | null = cardio ? null : ((p.intensity?.criterion as Criterio | undefined) ?? (sinIntensidad ? null : intensidadDelPlan));
  // Revisión adversaria (DL-197): el que hereda la intensidad del plan sin objetivo todavía se guarda sin criterio (así lo
  // lee la persona): plegado, se dice que falta el objetivo, como en uno con su criterio propio.
  const avisosDelPlegado = !p.intensity && criterioEfectivo !== null ? [E9.faltaElObjetivoHeredado, ...plegado.avisos] : plegado.avisos;
  const Titulo = nivel;
  return (
    // DL-196 (EE-05): el panel de la derecha sigue al ejercicio que se toca (`data-foco`).
    <section
      className="comida-del-plan ejercicio-del-editor"
      data-ejercicio={posicion + 1}
      data-recorrido="ejercicio"
      data-abierta={abierto ? '' : undefined}
      data-en-bloque={nivel === 'h4' ? '' : undefined}
      data-foco="ejercicio"
      data-foco-ejercicio={posicion}
      {...(arrastre?.propsDeLaTarjeta ?? {})}
    >
      <div className="comida-del-editor__cabecera">
        {arrastre?.asa ?? null}
        <Titulo className="comida-del-plan__titulo">
          <button type="button" id={`abrir-ejercicio-${id}`} className="comida-del-plan__boton" aria-expanded={abierto} aria-controls={`${propio}-cuerpo`} onClick={alAlternar}>
            <Icono nombre="entrenamiento" tamano={20} />
            <span className="comida-del-plan__textos">
              <span className="comida-del-plan__nombre">{nombre}</span>
              {/* Plegado dice lo que piden sus series; abierto, cuántas son: el detalle está abajo. */}
              <span className="comida-del-plan__cuenta" data-resumen>
                <EnPartes texto={abierto ? (cardio ? COPY_CARDIO.titulo : cuentaDeSeries(p.sets)) : plegado.resumen} />
              </span>
              {/* DL-201: plegado, la progresión propia del ejercicio («↑ +2,5 kg/sem»). */}
              {!abierto && progresionPropia ? (
                <span className="etiqueta-de-dato ejercicio-del-editor__progresion" data-progresion-propia>
                  {progresionPropia}
                </span>
              ) : null}
              {revisar ? (
                <span className="etiqueta-de-dato ejercicio-del-editor__revisar" data-carga-a-revisar>
                  <Icono nombre="aviso" tamano={15} />
                  {revisar}
                </span>
              ) : null}
              {/* C7: plegado, lo escrito sin aplicar se dice: no quedó en las series. */}
              {!abierto && lineaSinAplicar.trim() !== '' ? (
                <span className="etiqueta-de-dato ejercicio-del-editor__sin-aplicar" data-linea-sin-aplicar>
                  <Icono nombre="aviso" tamano={15} />
                  {COPY_ESCRITURA_RAPIDA.sinAplicar}: «{lineaSinAplicar.trim()}»
                </span>
              ) : null}
              {/* RP-19 (DL-196): abierto, lo que no se entiende lo dicen la celda marcada y el renglón reservado debajo de la
                  tabla. Si además apareciera acá mientras se escribe, la cabecera pasaba a dos renglones y corría las series. */}
              {!abierto && avisosDelPlegado.length > 0 ? (
                <span className="comida-del-editor__avisos" data-avisos>
                  <Icono nombre="aviso" tamano={18} />
                  <EnPartes texto={avisosDelPlegado.join(' · ')} />
                </span>
              ) : null}
            </span>
          </button>
        </Titulo>
        {abierto ? (
          <div className="comida-del-editor__acciones">
            {/* ENP-D16 (C4): «Copiar» a la vista, con un verbo para cada copia (ED-23, V3 E-02). */}
            {onCopiar ? (
              <MenuDeAcciones
                rotulo={`copiar ${nombre}, su prescripción o sus series`}
                texto="Copiar"
                icono="duplicar"
                conFlecha
                acciones={[
                  { clave: 'copiar-ejercicio', texto: COPY_COPIAR.copiarElEjercicio, alElegir: () => onCopiar('ejercicio') },
                  { clave: 'copiar-prescripcion', texto: COPY_COPIAR.copiarLaPrescripcion, alElegir: () => onCopiar('prescripcion') },
                  { clave: 'copiar-series', texto: COPY_COPIAR.copiarLasSeries, alElegir: () => onCopiar('series'), noSePuede: p.sets.length === 0 ? 'Este ejercicio todavía no tiene series.' : null },
                ]}
              />
            ) : null}
            <MenuDeAcciones
              rotulo={`más acciones de ${nombre}`}
              texto="Más"
              acciones={[
                ...(conFuerza ? [{ clave: 'detalle', texto: COPY_DETALLE_DEL_EJERCICIO.abrir, alElegir: () => setDetalle(true) }] : []),
                ...(conLaVezPasada ? [{ clave: 'la-vez-pasada', texto: COPY_LA_VEZ_PASADA_EN_EL_EDITOR.abrir, alElegir: () => setVezPasada(true) }] : []),
                ...(notasPropias && exerciseId !== null ? [{ clave: 'anotar', texto: COPY_NOTAS_PROPIAS.anotarSobreElEjercicio, alElegir: () => notasPropias.anotar({ tipo: 'EXERCISE', exerciseId, nombre }) }] : []),
                // DL-201: la progresión de este ejercicio (la suya, o «Sin progresión» aunque la fase tenga una).
                ...(onProgresion ? [{ clave: 'progresion', texto: COPY_PROGRESION_DEL_EJERCICIO, alElegir: onProgresion }] : []),
                // DL-197 (F9): subir y bajar, en «Más»: la cabecera queda con el nombre, «Copiar», «Más» y el chevrón.
                { clave: 'subir', texto: EDICION.subir, alElegir: onSubir, noSePuede: esElPrimero ? E9.yaEsElPrimero : null },
                { clave: 'bajar', texto: EDICION.bajar, alElegir: onBajar, noSePuede: esElUltimo ? E9.yaEsElUltimo : null },
                { clave: 'duplicar', texto: EDICION.duplicarEjercicio, alElegir: onDuplicar },
                // DL-199 (ET3-D15): pasar de series a cardio y al revés; lo de antes no se guarda aparte (se escribe de nuevo).
                cardio
                  ? { clave: 'a-series', texto: COPY_CARDIO.pasarASeries, alElegir: () => onCambiar(sinElCardio(p)) }
                  : { clave: 'a-cardio', texto: COPY_CARDIO.pasarACardio, alElegir: () => onCambiar(conElCardio(p, CARDIO_SIN_INDICAR)) },
                ...accionesDelBloque,
                { clave: 'quitar', texto: `Quitar ${nombre}`, alElegir: onQuitar },
              ]}
            />
          </div>
        ) : null}
        {/* DL-197 (F9): el chevrón, siempre en el extremo derecho; el que se toca es el nombre (el botón de arriba). */}
        <span className="ejercicio-del-editor__chevron" aria-hidden="true" onClick={alAlternar}>
          <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
        </span>
      </div>
      {/* PG-16: las notas propias atadas a este ejercicio, a la vista aunque esté plegado. */}
      <NotasAlLado ejercicio={exerciseId} />
      <div id={`${propio}-cuerpo`} className="comida-del-plan__cuerpo ejercicio-del-editor__cuerpo" hidden={!abierto}>
        {abierto ? (
          <>
            {cardio ? (
              <CardioDelEjercicio id={id} nombre={nombre} prescripcion={p} onCambiar={onCambiar} />
            ) : (
              <SeriesDelEjercicio id={id} nombre={nombre} prescripcion={p} onCambiar={onCambiar} criterio={criterioEfectivo} intensidadDelPlan={intensidadDelPlan} />
            )}
            <div className="ejercicio-del-editor__opciones" data-opciones-del-ejercicio>
              {onAproximaciones && !cardio ? (
                <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setCuadro('aproximaciones')} data-abrir-aproximaciones={cuantasAproximaciones(p)}>
                  <Icono nombre="sube" tamano={18} />
                  {E9.aproximaciones(cuantasAproximaciones(p))}
                  {resumenDeLasAproximaciones(p) ? <span className="nota ejercicio-del-editor__resumen-de-aproximaciones"> · {resumenDeLasAproximaciones(p)}</span> : null}
                </button>
              ) : null}
              {p.sets.length > 1 && !cardio ? (
                <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setCuadro('todas')} data-editar-todas-las-series>
                  <Icono nombre="lista" tamano={18} />
                  {E9.todas}
                </button>
              ) : null}
              <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setCuadro('opciones')} data-mas-opciones-del-ejercicio>
                <Icono nombre="opciones" tamano={18} />
                {E9.masOpciones}
                {p.intensity && intensidadDelPlan !== null && (p.intensity.criterion as Criterio) !== intensidadDelPlan ? <span className="nota"> · {E9.otraIntensidad}</span> : null}
              </button>
            </div>
            {/* DL-198 (ET2-01 a ET2-04): en % RM, el 1RM de referencia con su origen y la base de cada carga. */}
            {criterioEfectivo === 'PERCENT_RM' && asesoradoId !== null && exerciseId !== null ? (
              <UnoRMDelEjercicio id={id} nombre={nombre} prescripcion={p} unidad={unidadDe(p)} token={token} asesoradoId={asesoradoId} exerciseId={exerciseId} sesionPerdida={sesionPerdida} onCambiar={onCambiar} />
            ) : null}
            {onAproximaciones ? (
              <CuadroEnfocado
                abierto={cuadro === 'aproximaciones'}
                forma="dialogo"
                ancho
                titulo={E9.tituloAproximaciones}
                sobretitulo={nombre}
                ayuda={{ nombre: AYUDAS_DEL_EDITOR.aproximaciones.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.aproximaciones} /> }}
                onCerrar={() => setCuadro(null)}
              >
                <SeccionDeAproximaciones id={id} nombre={nombre} prescripcion={p} config={aproximaciones} onCambiar={onCambiar} onConfig={onAproximaciones} />
                <p className="nota" data-aproximaciones-en-la-tabla>
                  {resumenDeLasAproximaciones(p) ? E9.enLaTabla(resumenDeLasAproximaciones(p)!) : E9.sinAproximaciones}
                </p>
              </CuadroEnfocado>
            ) : null}
            <CuadroEnfocado abierto={cuadro === 'todas'} forma="dialogo" ancho titulo={E9.todas} sobretitulo={nombre} conCambios={todasConCambios} onCerrar={() => setCuadro(null)}>
              <EditarTodasLasSeries
                id={id}
                prescripcion={p}
                criterio={criterioEfectivo}
                onCambiar={onCambiar}
                onCerrar={() => setCuadro(null)}
                onConCambios={setTodasConCambios}
                onCalcularLaCarga={
                  conFuerza
                    ? (elegidas) => {
                        setCuadro(null);
                        setSeriesDeLaCarga(elegidas);
                        setDetalle(true);
                      }
                    : null
                }
              />
            </CuadroEnfocado>
            <CuadroEnfocado
              abierto={cuadro === 'opciones'}
              forma="dialogo"
              ancho
              titulo={E9.masOpciones}
              sobretitulo={nombre}
              ayuda={{ nombre: AYUDAS_DEL_EDITOR.intensidad.nombre, contenido: <ContenidoDeLaAyuda ayuda={AYUDAS_DEL_EDITOR.intensidad} /> }}
              onCerrar={() => setCuadro(null)}
            >
              <div className="mas-opciones-del-ejercicio" data-mas-opciones>
                {/* ENP-D14: el criterio (con su excepción al del plan), la referencia del % RM y las bases. */}
                {/* DL-199: el cardio no lleva criterio de intensidad de fuerza ni escritura rápida de series. */}
                {cardio ? null : <CriterioDelEjercicio id={id} nombre={nombre} prescripcion={p} onCambiar={onCambiar} intensidadDelPlan={intensidadDelPlan} sinIntensidad={sinIntensidad} onSinIntensidad={onSinIntensidad} />}
                {/* ED-22: la escritura rápida. */}
                {cardio ? null : <LineaDePrescripcion id={id} nombre={nombre} prescripcion={p} texto={onLineaSinAplicar ? lineaSinAplicar : undefined} onTexto={onLineaSinAplicar} onAplicar={(nueva, revisar) => onAplicarLinea(nueva, revisar)} />}
                <div className="ejercicio-del-editor__general">
                  <p className="ejercicio-del-plan__subtitulo">
                    {COPY_CRITERIO_ARRIBA.notasYParametros} <span className="nota">Opcional</span>
                  </p>
                  {imagen ? <ImagenGuardadaDeEjercicio token={token} medioId={imagen.mediaId} nombre={nombre} textoAlternativo={imagen.altText} sesionPerdida={sesionPerdida} chica /> : null}
                  <LoGeneralDelEjercicio id={id} prescripcion={p} onCambiar={onCambiar} />
                </div>
              </div>
            </CuadroEnfocado>
          </>
        ) : null}
      </div>
      {conFuerza && asesoradoId !== null ? (
        <DetalleDelEjercicio
          abierto={detalle}
          onCerrar={() => {
            setDetalle(false);
            setSeriesDeLaCarga(null);
          }}
          token={token}
          asesoradoId={asesoradoId}
          sesionPerdida={sesionPerdida}
          exerciseId={exerciseId!}
          nombre={nombre}
          unidad={unidadDe(p)}
          prescripcion={p as PrescripcionParaLaCarga}
          loQueIndica={<EnPartes texto={ejercicioPlegadoDelEditor(p, 0).resumen} />}
          onEscribir={(c) => onCambiar(c as Partial<PrescripcionE>)}
          series={seriesDeLaCarga}
          sets={p.sets}
          onEscribirEnLasSeries={(c) => onCambiar(c as Partial<PrescripcionE>)}
        />
      ) : null}
      {conLaVezPasada && exerciseId && asesoradoId !== null ? (
        <CuadroDeLaVezPasada
          abierto={vezPasada}
          onCerrar={() => setVezPasada(false)}
          token={token}
          asesoradoId={asesoradoId}
          sesionPerdida={sesionPerdida}
          exerciseId={exerciseId}
          nombre={nombre}
          loQueIndica={<EnPartes texto={ejercicioPlegadoDelEditor(p, 0).resumen} />}
        />
      ) : null}
    </section>
  );
}

// C8: «común» y «sin indicar», las mismas palabras que dice cada celda.
const OPCION_DE_LA_CELDA: Readonly<Record<OpcionDeLaCelda, string>> = { 'sin-objetivo': PL.sinIndicarEnEstaSerie, 'de-lo-general': PL.usarElComun };

/**
 * La celda de un objetivo de una serie: un campo y, al lado, el botón que deja quitarle ese objetivo a la serie o
 * volver a tomarlo de lo general. Qué muestra y qué deja en la serie lo decide el dominio (`celdaDeObjetivoDelEditor`).
 */
function CeldaDeObjetivo({
  id,
  rotulo,
  queEs,
  valor,
  deLoGeneral,
  escribir,
  leer,
  entero = false,
  onCambiar,
  paso = null,
  aviso,
}: {
  id: string;
  /** El nombre del campo: «Serie 2: carga sugerida (kg)». */
  rotulo: string;
  /** De qué son las opciones del botón: «la carga sugerida de la serie 2». */
  queEs: string;
  /** `undefined`: toma de lo general; `null`: sin objetivo; un número: propio de la serie; NaN: no se entiende. */
  valor: number | null | undefined;
  /** Lo que toma de lo general, como se escribe en la celda («62,5», «02:30»); `null` si lo general no lo tiene. */
  deLoGeneral: string | null;
  escribir: (n: number) => string;
  leer: (t: string) => number | null;
  entero?: boolean;
  onCambiar: (v: number | null | undefined) => void;
  /** RP-22: el paso de las flechas (la carga y el descanso; el RIR es del criterio de intensidad y no lo tiene). */
  paso?: { readonly campo: 'restSeconds' | 'suggestedLoad'; readonly unidad?: 'kg' | 'lb' } | null;
  /** RP-22: el renglón reservado debajo de la tabla, que dice qué no se entiende. */
  aviso?: string;
}) {
  const celda = celdaDeObjetivoDelEditor(valor, deLoGeneral);
  // C8: de dónde sale el valor, dicho en la celda («común», «propio» o «Sin indicar») y para el lector.
  const origen = origenDeLaCelda(celda.estado, deLoGeneral);
  const { texto, alEscribir, alSalir } = useTextoInterpretado<number | null | undefined, number | undefined>(valor, {
    clave: valor === undefined ? 'nada' : String(valor),
    formatear: (v) => (typeof v === 'number' && !Number.isNaN(v) ? escribir(v) : ''),
    interpretar: (t) => objetivoEscritoEnLaCelda(t, leer),
    mismo: esLoQueTieneLaCelda,
    alCambiar: onCambiar,
    normalizarAlSalir: true,
  });
  // Lo escrito viaja al valor en cada tecla (`alEscribir`): la marca sigue a lo que hay en la celda.
  const marca = origen.marca;
  // DL-196 (E15): el descanso, con la máscara «mm:ss».
  const mascara = useMascaraDeTiempo(paso?.campo === 'restSeconds', alEscribir);
  // DL-196 (E11): las acciones rápidas parten de lo que tiene la celda: lo suyo o, si no tiene, lo común.
  const desde = typeof valor === 'number' && !Number.isNaN(valor) ? valor : deLoGeneral !== null ? leer(deLoGeneral) : null;
  const campo = (
    <input
      id={id}
      aria-label={rotulo}
      aria-describedby={celda.estado === 'no-se-entiende' && aviso ? `${id}-estado ${aviso}` : `${id}-estado`}
      aria-invalid={celda.estado === 'no-se-entiende' || undefined}
      inputMode={entero ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={texto}
      title={paso ? COPY_DE_LOS_NUMEROS.flechas(paso.campo, paso.unidad) : undefined}
      onKeyDown={(e) => {
        if (mascara.alTeclear(e) || !paso) return;
        const n = pasoConLaFlecha(e, paso.campo, deLoGeneral === null ? null : leer(deLoGeneral), paso.unidad);
        if (n !== null) alEscribir(escribir(n));
      }}
      onFocus={mascara.alEntrar}
      placeholder={origen.placeholder}
      data-en-gris={celda.enGris ? '' : undefined}
      // «Sin indicar» es un texto: se acomoda distinto que un número.
      data-texto={texto === '' && origen.placeholder === PL.sinIndicar ? '' : undefined}
      data-mascara-de-tiempo={paso?.campo === 'restSeconds' ? '' : undefined}
      onChange={(e) => alEscribir(e.target.value)}
      onBlur={() => {
        mascara.alSalir();
        alSalir();
      }}
    />
  );
  return (
    <div className="celda-de-objetivo" data-estado={celda.estado} data-origen={marca ?? undefined}>
      {paso ? <ConAccionesRapidas acciones={<AccionesRapidas campo={paso.campo} unidad={paso.unidad} desde={desde} alAplicar={(n) => alEscribir(escribir(n))} de={queEs} />}>{campo}</ConAccionesRapidas> : campo}
      {marca ? (
        <span className="celda-de-objetivo__origen" aria-hidden="true" data-origen-de-la-celda>
          {marca}
        </span>
      ) : null}
      <span id={`${id}-estado`} className="visualmente-oculto">
        {origen.descripcion}
      </span>
      {/* DL-196 (E14): el menú de la celda es discreto: se ve al pasar o al entrar a la celda. */}
      <span className="celda-de-objetivo__opciones">
        <MenuDeAcciones rotulo={`Opciones para ${queEs}`} icono="abajo" acciones={celda.opciones.map((o) => ({ clave: o, texto: OPCION_DE_LA_CELDA[o], alElegir: () => onCambiar(objetivoElegidoEnLaCelda(o)) }))} />
      </span>
    </div>
  );
}

/**
 * ED-23 · Un valor de la fila «General» (la carga sugerida o el descanso de la prescripción): el que toman las series que
 * no tienen uno propio. Vacío, no hay valor general; lo que no se entiende queda a la vista, marcado, y no deja guardar.
 */
function CeldaGeneral({
  id,
  rotulo,
  valor,
  formatear,
  interpretar,
  onCambiar,
  paso,
  aviso,
}: {
  id: string;
  rotulo: string;
  valor: number | null;
  formatear: (n: number | null) => string;
  interpretar: (t: string) => number | null;
  onCambiar: (v: number | null) => void;
  /** RP-22: el paso de las flechas. */
  paso: { readonly campo: 'restSeconds' | 'suggestedLoad'; readonly unidad?: 'kg' | 'lb' };
  /**
   * RP-22: el `id` del renglón reservado debajo de la tabla, donde se dice qué no se entiende y cómo se escribe (WCAG
   * 3.3.1): antes el aviso iba dentro de la celda y alargaba la fila mientras se escribía.
   */
  aviso: string;
}) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave: String(valor), formatear, interpretar, mismo: mismoNumero, alCambiar: onCambiar, normalizarAlSalir: true });
  const mal = texto.trim() !== '' && Number.isNaN(interpretar(texto));
  const paso1 = (sube: boolean) => {
    const n = pasoConElMouse(paso.campo, texto, sube, paso.unidad);
    if (n !== null) alEscribir(formatear(n));
  };
  const mascara = useMascaraDeTiempo(paso.campo === 'restSeconds', alEscribir);
  const desde = valor !== null && !Number.isNaN(valor) ? valor : null;
  return (
    <ConAccionesRapidas acciones={<AccionesRapidas campo={paso.campo} unidad={paso.unidad} desde={desde} alAplicar={(n) => alEscribir(formatear(n))} de={rotulo.toLowerCase()} />}>
    <ConFlechas que={rotulo.toLowerCase()} alSubir={() => paso1(true)} alBajar={() => paso1(false)}>
      <input
        id={id}
        className="celda-de-serie"
        aria-label={rotulo}
        aria-invalid={mal || undefined}
        aria-describedby={mal ? aviso : undefined}
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        title={COPY_DE_LOS_NUMEROS.flechas(paso.campo, paso.unidad)}
        data-celda-general-no-se-entiende={mal ? '' : undefined}
        data-mascara-de-tiempo={paso.campo === 'restSeconds' ? '' : undefined}
        onChange={(e) => alEscribir(e.target.value)}
        onKeyDown={(e) => {
          if (mascara.alTeclear(e)) return;
          const n = pasoConLaFlecha(e, paso.campo, null, paso.unidad);
          if (n !== null) alEscribir(formatear(n));
        }}
        onFocus={mascara.alEntrar}
        onBlur={() => {
          mascara.alSalir();
          alSalir();
        }}
      />
    </ConFlechas>
    </ConAccionesRapidas>
  );
}

/** Las repeticiones de una serie: un número o un rango. No se toman de lo general: son de cada serie. */
function CeldaDeRepeticiones({ id, rotulo, valor, onCambiar, aviso }: { id: string; rotulo: string; valor: Repeticiones; onCambiar: (r: Repeticiones) => void; aviso: string }) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave: JSON.stringify(valor), formatear: reps, interpretar: leerReps, mismo: mismasReps, alCambiar: onCambiar, normalizarAlSalir: true });
  const mal = noSeEntiendenLasReps(valor);
  const paso1 = (sube: boolean) => {
    const n = pasoConElMouse('repetitions', texto, sube);
    if (n !== null) alEscribir(String(n));
  };
  return (
    <ConFlechas que={rotulo.toLowerCase()} alSubir={() => paso1(true)} alBajar={() => paso1(false)}>
    <input
      id={id}
      className="celda-de-serie"
      aria-label={rotulo}
      aria-invalid={mal || undefined}
      aria-describedby={mal ? aviso : undefined}
      autoComplete="off"
      value={texto}
      title={COPY_DE_LOS_NUMEROS.flechas('repetitions')}
      onChange={(e) => alEscribir(e.target.value)}
      onKeyDown={(e) => {
        const n = pasoConLaFlecha(e, 'repetitions', null);
        if (n !== null) alEscribir(String(n));
      }}
      onBlur={alSalir}
    />
    </ConFlechas>
  );
}

/** RP-22: lo que dicen los números de la planilla sobre sus límites y sus flechas. */
const COPY_DE_LOS_NUMEROS = {
  flechas: (campo: 'repetitions' | 'restSeconds' | 'suggestedLoad', unidad: 'kg' | 'lb' = 'kg'): string => {
    const L = LIMITES_DE_LA_PLANILLA;
    if (campo === 'repetitions') return `De ${L.repeticiones.minimo} a ${L.repeticiones.maximo}, o un rango como 8-12. ↑ y ↓ suman o restan 1.`;
    if (campo === 'restSeconds') return 'De 00:00 a 60:00, como 02:30 o en segundos. ↑ y ↓ suman o restan 15 segundos.';
    return `Desde 0 ${unidad}. ↑ y ↓ suman o restan ${numeroEnCampo(L.carga.paso[unidad])} ${unidad}.`;
  },
  // El pie de la tabla, detrás de un «?» (RP-05 y RP-08: lo largo, a un toque).
  comoSeLeeLaTabla: 'Cómo se lee la tabla y sus atajos',
  flechasEnLaTabla: 'Con ↑ y ↓ un número da un paso (con Mayúsculas, cuatro): 1 repetición, 15 segundos de descanso o 2,5 kg de carga (5 lb).',
} as const;

/**
 * Las series, una por fila: sus repeticiones, sus objetivos (la carga sugerida, el RIR si ese es el criterio, y el
 * descanso) y su nota. Lo que una celda muestra en gris es lo que la serie toma de lo general.
 */
function SeriesDelEjercicio({
  id,
  nombre,
  prescripcion: p,
  onCambiar,
  criterio,
  intensidadDelPlan,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  /** DL-197 (ET1-D11): el criterio que rige el ejercicio: el suyo o, si no tiene, el del plan (heredado); `null`, ninguno. */
  criterio: Criterio | null;
  /** El criterio del plan, para saber si escribir el objetivo crea el criterio propio o lo hereda. */
  intensidadDelPlan: Criterio | null;
}) {
  const conRir = criterio === 'RIR';
  const conPorcentaje = criterio === 'PERCENT_RM';
  // DL-192: el RIR se escribe y se lee en la notación del plan; lo guardado sigue siendo el RIR.
  const notacion = useNotacionDelEsfuerzo();
  const esfuerzo = COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion];
  const unidad = unidadDe(p);
  const valido = (n: number | null | undefined): n is number => typeof n === 'number' && !Number.isNaN(n);
  const cargaGeneral = p.suggestedLoad && valido(p.suggestedLoad.value) ? numeroEnCampo(p.suggestedLoad.value) : null;
  const rirGeneral = conRir && p.intensity && valido(p.intensity.target.value) ? rirEnCampo(notacion)(p.intensity.target.value) : null;
  const descansoGeneral = valido(p.restSeconds) ? textoDeSegundos(p.restSeconds) : null;
  // DL-196 (EE-07): las aproximaciones se rotulan A1, A2…; las efectivas, 1, 2, 3 como siempre.
  const rotulos = rotulosConAproximaciones(p.sets);
  const cual = (n: number): string => (rotulos[n]?.numero == null ? `la ${rotulos[n]?.largo.toLowerCase() ?? 'aproximación'}` : `la serie ${rotulos[n]!.numero}`);
  const primeraEfectiva = p.sets.some(esDeCalentamiento) ? p.sets.findIndex((s) => !esDeCalentamiento(s)) : -1;
  const cambiarLaSerie = (n: number, f: (s: Serie) => Serie) => onCambiar({ sets: p.sets.map((x, m) => (m === n ? f(x) : x)) });
  /**
   * DL-178: marca o desmarca una serie como aproximación; las aproximaciones suben arriba. DL-197 (F15): marcada, no lleva
   * RIR («—», no el común) y toma su descanso corto propio si no tenía uno.
   */
  const marcarCalentamiento = (n: number) => {
    const sets = p.sets.map((x, m): Serie => {
      if (m !== n) return x;
      const { setKind: _tipo, ...resto } = x;
      // DL-199 (ET3-26): desmarcada, vuelve a ser efectiva con lo común: sin el RIR vacío ni el descanso propio.
      if (esDeCalentamiento(x)) return serieAlDesmarcarLaAproximacion(resto) as Serie;
      return { ...resto, setKind: 'WARM_UP', rir: null, restSeconds: resto.restSeconds ?? DESCANSO_DE_APROXIMACION };
    });
    onCambiar({ sets: conElCalentamientoArriba<Serie>(sets) });
  };
  const [quitando, setQuitando] = useState<number | null>(null);
  // F13: lo que no se entiende del objetivo común (un % RM de menos de 30), en el mismo renglón reservado.
  const [avisoDeLaIntensidad, setAvisoDeLaIntensidad] = useState<string | null>(null);
  const pedirQuitar = (n: number) => {
    if (loQueSePierdeAlQuitarLaSerie(p.sets, n)) return setQuitando(n);
    quitar(n);
  };
  const quitar = (n: number) => {
    setQuitando(null);
    onCambiar({ sets: sinLaSerie(p.sets, n) });
  };
  /** Ctrl+D (o Cmd+D): la celda toma el valor de la serie de arriba. */
  const alTeclear = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'd') return;
    const celda = celdaDeLaPlanilla((e.target as HTMLElement).id, id);
    if (!celda || celda.serie === 0) return;
    e.preventDefault();
    onCambiar({ sets: copiarHaciaAbajo(p.sets, celda.serie, celda.campo) });
  };
  const cambiarElObjetivo = (n: number, campo: 'rir' | 'suggestedLoad' | 'restSeconds', valor: unknown) => {
    // DL-197: un RIR de una serie con el criterio heredado del plan crea el criterio propio (el objetivo común falta).
    if (campo === 'rir' && valor !== undefined && !p.intensity) {
      return onCambiar({ intensity: { criterion: 'RIR', target: { value: Number.NaN, reference: null } } as PrescripcionE['intensity'], sets: p.sets.map((x, m) => (m === n ? ({ ...x, rir: valor } as Serie) : x)) });
    }
    cambiarLaSerie(n, (x) => {
      const copia: Record<string, unknown> = { ...x };
      if (valor === undefined) delete copia[campo];
      else copia[campo] = valor;
      return copia as Serie;
    });
  };
  /** DL-197 (F10): la unidad, en un chip del encabezado de la carga: cambiarla no convierte los números. */
  const otraUnidad = unidad === 'kg' ? 'lb' : 'kg';
  const cambiarLaUnidad = () =>
    onCambiar({
      ...(p.suggestedLoad ? { suggestedLoad: { ...p.suggestedLoad, unit: otraUnidad } } : {}),
      sets: p.sets.map((x) => (x.suggestedLoad ? { ...x, suggestedLoad: { ...x.suggestedLoad, unit: otraUnidad } } : x)),
    });
  /** El objetivo común de la intensidad: escribirlo crea el criterio (heredado del plan o el propio); vaciarlo lo hereda. */
  const cambiarElObjetivoComun = (v: number | null) => {
    if (!criterio) return;
    const propio = (p.intensity?.criterion as Criterio | undefined) ?? null;
    if (v === null) {
      const vuelveAlPlan = propio === null || propio === intensidadDelPlan;
      // Revisión adversaria (DL-197): sin criterio propio, ninguna serie puede llevar la clave `rir` (el contrato rechaza el
      // guardado con SET_RIR_WITHOUT_RIR_CRITERION). Si alguna tiene un RIR escrito, el criterio queda sin objetivo («Falta
      // el objetivo», como antes) y ese RIR no se pierde; si solo hay «sin objetivo en esta serie», la clave se va con él.
      const conRirEscrito = p.sets.some((x) => typeof x.rir === 'number');
      if (vuelveAlPlan && criterio === intensidadDelPlan && !conRirEscrito) return onCambiar({ intensity: null, sets: p.sets.map(({ rir: _sinRir, ...x }) => x as Serie) });
      return onCambiar({ intensity: { criterion: criterio, target: { value: Number.NaN, reference: p.intensity?.target.reference ?? null } } as PrescripcionE['intensity'] });
    }
    onCambiar({ intensity: { criterion: criterio, target: { value: v, reference: p.intensity?.target.reference ?? null } } as PrescripcionE['intensity'] });
  };
  const aviso = `${id}-no-se-entiende`;
  const queNoSeEntiende = loQueNoSeEntiendeEnLasSeries(id, p, p.sets.map((_, n) => cual(n)));
  const textoDelAviso = avisoDeLaIntensidad ?? textoDeLoQueNoSeEntiende(queNoSeEntiende);
  // F14: el colSpan real (con `table-layout: fixed`, 99 desarmaba las columnas) y los anchos por clase, en el colgroup.
  const columnas = 7 + (criterio ? 1 : 0);
  const nombreDeLaIntensidad = conRir ? esfuerzo : conPorcentaje ? ETIQUETA_DE_CRITERIO.PERCENT_RM : '';
  return (
    <div className="ejercicio-del-editor__series">
      {p.sets.length === 0 ? <p className="nota">{C.sinSeries}</p> : null}
      <table className="tabla series-del-editor" onKeyDown={alTeclear} data-columnas={columnas}>
        <caption className="visualmente-oculto">Las series de {nombre}, con el objetivo que recibe la persona en cada una</caption>
        <colgroup>
          <col className="series-del-editor__col-serie" />
          <col className="series-del-editor__col-aprox" />
          <col className="series-del-editor__col-reps" />
          <col className="series-del-editor__col-carga" />
          {criterio ? <col className="series-del-editor__col-intensidad" /> : null}
          <col className="series-del-editor__col-descanso" />
          <col className="series-del-editor__col-nota" />
          <col className="series-del-editor__col-quitar" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</th>
            <th scope="col" title={COPY_SELECCION.ayudaDeLaAproximacion}>
              {COPY_SELECCION.aprox}
            </th>
            <th scope="col">{COPY_SELECCION.repeticiones}</th>
            <th scope="col">
              <span className="series-del-editor__con-chip">
                {COPY_SERIES.carga}
                <button type="button" className="chip-de-unidad" onClick={cambiarLaUnidad} aria-label={COPY_SERIES.unidad(unidad, otraUnidad)} title={COPY_SERIES.unidad(unidad, otraUnidad)} data-unidad-de-la-carga={unidad}>
                  {unidad}
                </button>
              </span>
            </th>
            {criterio ? (
              <th scope="col" data-columna-de-intensidad={criterio}>
                {nombreDeLaIntensidad}
              </th>
            ) : null}
            <th scope="col">{COPY_ENTRENAMIENTO.descanso}</th>
            <th scope="col">{C.nota}</th>
            <th scope="col">
              <span className="visualmente-oculto">Quitar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* ED-23 y C8: la fila «Común». Lo que tiene es lo que toman las series sin valor propio. */}
          <tr className="series-del-editor__general" data-fila-general>
            <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
              {PL.general}
              <span className="visualmente-oculto"> {PL.generalDetalle}</span>
            </th>
            <td />
            <td data-etiqueta="Repeticiones">
              <span className="nota" aria-hidden="true">
                —
              </span>
              <span className="visualmente-oculto">{COPY_SERIES.repeticionesEnCadaSerie}</span>
            </td>
            <td data-etiqueta={`${COPY_SERIES.carga} (${unidad})`}>
              <CeldaGeneral
                id={`${id}-carga`}
                rotulo={`${PL.general}: ${C.cargaSugerida.toLowerCase()} (${unidad})`}
                valor={p.suggestedLoad ? p.suggestedLoad.value : null}
                formatear={escribirNumero}
                interpretar={leerLaCarga}
                onCambiar={(v) => onCambiar({ suggestedLoad: v === null ? null : { value: v, unit: unidad } })}
                paso={{ campo: 'suggestedLoad', unidad }}
                aviso={aviso}
              />
            </td>
            {criterio ? (
              <td data-etiqueta={nombreDeLaIntensidad}>
                <CeldaDeIntensidad
                  id={`${id}-objetivo-comun`}
                  rotulo={`${PL.general}: ${nombreDeLaIntensidad} objetivo`}
                  criterio={criterio}
                  notacion={notacion}
                  valor={p.intensity && (p.intensity.criterion as Criterio) === criterio ? p.intensity.target.value : null}
                  onCambiar={cambiarElObjetivoComun}
                  onAviso={setAvisoDeLaIntensidad}
                  aviso={aviso}
                />
              </td>
            ) : null}
            <td data-etiqueta={COPY_ENTRENAMIENTO.descanso}>
              <CeldaGeneral
                id={`${id}-descanso`}
                rotulo={`${PL.general}: ${COPY_ENTRENAMIENTO.descanso.toLowerCase()} (como 02:30, o en segundos)`}
                valor={p.restSeconds ?? null}
                formatear={escribirElDescanso}
                interpretar={leerElDescanso}
                onCambiar={(v) => onCambiar({ restSeconds: v })}
                paso={{ campo: 'restSeconds' }}
                aviso={aviso}
              />
            </td>
            <td className="series-del-editor__nota">
              <span className="nota" aria-hidden="true">
                —
              </span>
            </td>
            <td />
          </tr>
          {p.sets.map((s, n) => (
            <Fragment key={n}>
              {n === 0 && primeraEfectiva > 0 ? (
                <tr className="series-del-editor__grupo" aria-hidden="true">
                  <td colSpan={columnas}>{COPY_SELECCION.grupoAproximaciones}</td>
                </tr>
              ) : null}
              {n === primeraEfectiva && n > 0 ? (
                <tr className="series-del-editor__grupo" aria-hidden="true">
                  <td colSpan={columnas}>{COPY_SELECCION.grupoEfectivas}</td>
                </tr>
              ) : null}
              <tr data-serie={n + 1} data-calentamiento={esDeCalentamiento(s) ? '' : undefined}>
                <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
                  <span className="series-del-editor__numero" title={rotulos[n]!.largo}>
                    {rotulos[n]!.corto}
                  </span>
                </th>
                {/* F14: la casilla «Aproximación», en su propia columna. */}
                <td className="series-del-editor__aprox" data-etiqueta={COPY_SELECCION.aproximacion}>
                  <input type="checkbox" id={`${id}-serie-${n}-calentamiento`} checked={esDeCalentamiento(s)} onChange={() => marcarCalentamiento(n)} aria-label={`${COPY_SELECCION.aproximacion} (${rotulos[n]!.largo})`} data-marcar-calentamiento={n + 1} />
                </td>
                <td data-etiqueta="Repeticiones">
                  <CeldaDeRepeticiones id={`${id}-serie-${n}`} rotulo={`${rotulos[n]!.largo}: repeticiones (un número o un rango, 8-12)`} valor={s.repetitions} onCambiar={(r) => cambiarLaSerie(n, (x) => ({ ...x, repetitions: r }))} aviso={aviso} />
                </td>
                <td data-etiqueta={`${COPY_SERIES.carga} (${unidad})`}>
                  <CeldaDeObjetivo
                    id={`${id}-serie-${n}-carga`}
                    rotulo={`${rotulos[n]!.largo}: carga sugerida (${unidad})`}
                    queEs={`la carga sugerida de ${cual(n)}`}
                    valor={s.suggestedLoad === undefined ? undefined : s.suggestedLoad === null ? null : s.suggestedLoad.value}
                    deLoGeneral={cargaGeneral}
                    escribir={numeroEnCampo}
                    leer={leerCargaDeLaSerie}
                    onCambiar={(v) => cambiarElObjetivo(n, 'suggestedLoad', v === undefined || v === null ? v : { value: v, unit: unidad })}
                    paso={{ campo: 'suggestedLoad', unidad }}
                    aviso={aviso}
                  />
                </td>
                {criterio ? (
                  <td data-etiqueta={nombreDeLaIntensidad}>
                    {/* F15: una aproximación no lleva RIR («—»), salvo que se le haya escrito uno; el % RM es el común. */}
                    {conRir && !(esDeCalentamiento(s) && (s.rir === null || s.rir === undefined)) ? (
                      <CeldaDeObjetivo
                        id={`${id}-serie-${n}-rir`}
                        rotulo={`${rotulos[n]!.largo}: ${esfuerzo} objetivo (${RANGO_DEL_ESFUERZO[notacion]})`}
                        queEs={`el ${esfuerzo} de ${cual(n)}`}
                        valor={s.rir}
                        deLoGeneral={rirGeneral}
                        escribir={rirEnCampo(notacion)}
                        leer={leerElRir(notacion)}
                        onCambiar={(v) => cambiarElObjetivo(n, 'rir', v)}
                        aviso={aviso}
                      />
                    ) : (
                      <span className="nota series-del-editor__sin-intensidad" data-sin-intensidad-en-la-serie>
                        <span aria-hidden="true">—</span>
                        <span className="visualmente-oculto">{esDeCalentamiento(s) ? COPY_SERIES.aproximacionSinRir : COPY_SERIES.porcentajeComun}</span>
                      </span>
                    )}
                  </td>
                ) : null}
                <td data-etiqueta={COPY_ENTRENAMIENTO.descanso}>
                  <CeldaDeObjetivo
                    id={`${id}-serie-${n}-descanso`}
                    rotulo={`${rotulos[n]!.largo}: descanso (como 02:30, o en segundos)`}
                    queEs={`el descanso de ${cual(n)}`}
                    valor={s.restSeconds}
                    deLoGeneral={descansoGeneral}
                    escribir={(v) => textoDeSegundos(v) ?? ''}
                    leer={leerDescansoDeLaSerie}
                    entero
                    onCambiar={(v) => cambiarElObjetivo(n, 'restSeconds', v)}
                    paso={{ campo: 'restSeconds' }}
                    aviso={aviso}
                  />
                </td>
                <td data-etiqueta={C.nota} className="series-del-editor__nota">
                  <input
                    id={`${id}-serie-${n}-nota`}
                    className="celda-de-serie"
                    aria-label={`${rotulos[n]!.largo}: ${COPY_ENTRENAMIENTO.notaDeSerie}`}
                    value={s.note ?? ''}
                    maxLength={200}
                    onChange={(e) => cambiarLaSerie(n, (x) => ({ ...x, note: e.target.value || null }))}
                  />
                </td>
                <td className="series-del-editor__quitar">
                  <button
                    type="button"
                    className="boton boton--quieto item-del-editor__boton-de-quitar"
                    aria-label={`${EDICION.quitarLaSerie(n)} de ${nombre}`}
                    title={EDICION.quitarLaSerie(n)}
                    data-quitar-serie={n + 1}
                    onClick={() => pedirQuitar(n)}
                  >
                    <Icono nombre="cerrar" tamano={18} />
                  </button>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
      {/* RP-22: siempre en la página; vacío, ocupa lo mismo. Lo que se marca en una celda no corre las filas ni el pie. */}
      {p.sets.length > 0 || queNoSeEntiende.length > 0 || avisoDeLaIntensidad ? (
        <RenglonDelAviso id={aviso} tipo={queNoSeEntiende.length > 0 || avisoDeLaIntensidad ? 'error' : 'nota'} anunciar title={textoDelAviso ?? undefined} data-lo-que-no-se-entiende={queNoSeEntiende.length + (avisoDeLaIntensidad ? 1 : 0)}>
          {textoDelAviso}
        </RenglonDelAviso>
      ) : null}
      {/* TEST-EDP-056: lo que se pierde se dice antes, con «Cancelar» enfocado; cancelar no toca nada. */}
      <CuadroEnfocado
        abierto={quitando !== null}
        forma="dialogo"
        titulo={PL.quitarTitulo((quitando ?? 0) + 1)}
        sobretitulo={nombre}
        focoEnCancelar
        principal={{ texto: PL.quitar((quitando ?? 0) + 1), alTocar: () => quitando !== null && quitar(quitando) }}
        onCerrar={() => setQuitando(null)}
      >
        <p data-lo-que-se-pierde>{quitando !== null ? loQueSePierdeAlQuitarLaSerie(p.sets, quitando) : null}</p>
      </CuadroEnfocado>
      <div className="ejercicio-del-editor__pie-de-series">
        <button type="button" id={`${id}-agregar-serie`} className="boton boton--secundario boton--compacto" data-agregar-serie onClick={() => onCambiar({ sets: [...p.sets, { repetitions: p.sets[p.sets.length - 1]?.repetitions ?? null }] })}>
          <Icono nombre="mas" tamano={18} />
          Agregar serie
        </button>
        {p.sets.length > 0 ? (
          <ExplicacionAPedido nombre={COPY_DE_LOS_NUMEROS.comoSeLeeLaTabla} como="div" lugar="esquina">
            <p className="nota" data-como-se-lee-cada-valor>{PL.comoSeLee}</p>
            <p className="nota" data-ayuda-del-calentamiento>{COPY_SELECCION.ayudaDeLaAproximacion}</p>
            <p className="nota">{COPY_SERIES.comoSeEscribe}</p>
            <p className="nota">{PL.atajo}</p>
            <p className="nota">{COPY_DE_LOS_NUMEROS.flechasEnLaTabla}</p>
          </ExplicacionAPedido>
        ) : null}
      </div>
    </div>
  );
}

/** DL-197 (F10, F13, F14, F15): los textos nuevos de la planilla. */
const COPY_SERIES = {
  carga: 'Carga',
  unidad: (de: string, a: string) => `Unidad de la carga: ${de}. Tocá para pasar a ${a} (no convierte los números).`,
  repeticionesEnCadaSerie: 'Las repeticiones van en cada serie.',
  aproximacionSinRir: 'Sin RIR: es una aproximación.',
  porcentajeComun: 'El % RM es el común de la fila de arriba.',
  comoSeEscribe: 'Las repeticiones, como 8 o 8-12; el descanso, mm:ss («3» es 03:00; «130», 01:30).',
  porcentajeBajo: '¿Quisiste escribir un RIR? El % RM va de 30 a 100: para el RIR, elegilo como intensidad en «Más opciones».',
  porcentajeNoSeEntiende: 'No se entiende el % RM: va un número de 30 a 100.',
} as const;

/** F13: el % RM más bajo que se acepta. Debajo, lo más probable es un RIR escrito en el lugar equivocado. */
export const PORCENTAJE_RM_MINIMO = 30;

/**
 * DL-197 (F16): el objetivo común de la intensidad, en la fila «Común» de la planilla: el RIR (o el RPE, en la notación del
 * plan) o el % RM. Vacío no es cero: el ejercicio hereda el criterio del plan sin objetivo todavía.
 */
function CeldaDeIntensidad({
  id,
  rotulo,
  criterio,
  notacion,
  valor,
  onCambiar,
  onAviso,
  aviso,
}: {
  id: string;
  rotulo: string;
  criterio: Criterio;
  notacion: NotacionDelEsfuerzo;
  valor: number | null;
  onCambiar: (v: number | null) => void;
  onAviso: (texto: string | null) => void;
  aviso: string;
}) {
  const formatear = (v: number | null) => (v === null || Number.isNaN(v) ? '' : criterio === 'RIR' ? rirEnCampo(notacion)(v) : numeroEnCampo(v));
  const interpretar = (t: string): number | null => {
    if (t.trim() === '') return null;
    if (criterio === 'RIR') return leerElRir(notacion)(t) ?? Number.NaN;
    const n = leerNumero(t);
    return n === null || n < PORCENTAJE_RM_MINIMO || n > 100 ? Number.NaN : n;
  };
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave: `${criterio}:${valor}`, formatear, interpretar, mismo: mismoNumero, alCambiar: onCambiar, normalizarAlSalir: true });
  const mal = texto.trim() !== '' && Number.isNaN(interpretar(texto));
  useEffect(() => {
    if (!mal) return onAviso(null);
    const n = leerNumero(texto);
    onAviso(criterio === 'PERCENT_RM' ? (n !== null && n >= 0 && n < PORCENTAJE_RM_MINIMO ? COPY_SERIES.porcentajeBajo : COPY_SERIES.porcentajeNoSeEntiende) : `No se entiende el ${COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion]}: va de ${RANGO_DEL_ESFUERZO[notacion]}.`);
    // El aviso depende solo de lo escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mal, texto]);
  useEffect(() => () => onAviso(null), [onAviso]);
  return (
    <input
      id={id}
      className="celda-de-serie"
      aria-label={rotulo}
      aria-invalid={mal || undefined}
      aria-describedby={mal ? aviso : undefined}
      inputMode="decimal"
      autoComplete="off"
      value={texto}
      placeholder={criterio === 'PERCENT_RM' ? '75' : notacion === 'RPE' ? '8' : '2'}
      data-objetivo-comun={criterio}
      data-celda-general-no-se-entiende={mal ? '' : undefined}
      onChange={(e) => alEscribir(e.target.value)}
      onBlur={alSalir}
    />
  );
}

/**
 * DL-197 (F16): «Editar todas las series», en un cuadro. Se eligen las series (las efectivas, por omisión) y se escribe lo
 * que se quiere cambiar: **lo que queda vacío conserva su valor**. «Aplicar» lo escribe en todas las elegidas de una vez.
 */
function EditarTodasLasSeries({
  id,
  prescripcion: p,
  criterio,
  onCambiar,
  onCerrar,
  onCalcularLaCarga = null,
  onConCambios,
}: {
  id: string;
  prescripcion: PrescripcionE;
  criterio: Criterio | null;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  onCerrar: () => void;
  /** ED-76 (EDT-56): la carga de las elegidas desde la fuerza estimada; `null` fuera de la lista de la v1. */
  onCalcularLaCarga?: ((elegidas: readonly number[]) => void) | null;
  /** Si hay algo escrito sin aplicar: el cuadro pregunta antes de cerrarse (ET1-D05). Al cerrarse, vuelve a `false`. */
  onConCambios?: (conCambios: boolean) => void;
}) {
  const notacion = useNotacionDelEsfuerzo();
  const esfuerzo = COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion];
  const unidad = unidadDe(p);
  const rotulos = rotulosConAproximaciones(p.sets);
  const [elegidas, setElegidas] = useState<ReadonlySet<number>>(() => new Set(p.sets.flatMap((s, n) => (esDeCalentamiento(s) ? [] : [n]))));
  const [valores, setValores] = useState({ reps: '', carga: '', rir: '', descanso: '', nota: '' });
  const [mal, setMal] = useState<string | null>(null);
  const escrito = Object.values(valores).some((v) => v.trim() !== '');
  useEffect(() => {
    onConCambios?.(escrito);
  }, [escrito, onConCambios]);
  useEffect(() => () => onConCambios?.(false), [onConCambios]);
  const campo = (clave: keyof typeof valores, rotulo: string, ejemplo: string) => (
    <div className="campo editar-todas__campo">
      <label htmlFor={`${id}-todas-${clave}`}>{rotulo}</label>
      <input id={`${id}-todas-${clave}`} value={valores[clave]} placeholder={ejemplo} autoComplete="off" onChange={(e) => setValores((v) => ({ ...v, [clave]: e.target.value }))} data-todas={clave} />
    </div>
  );
  const aplicar = () => {
    if (elegidas.size === 0) return setMal(COPY_TODAS.ninguna);
    let sets = p.sets;
    if (valores.reps.trim()) {
      const r = leerReps(valores.reps);
      if (r === null || noSeEntiendenLasReps(r)) return setMal(COPY_SELECCION.repeticionesNoSeEntienden);
      sets = sets.map((x, m) => (elegidas.has(m) ? { ...x, repetitions: r } : x));
    }
    if (valores.carga.trim()) {
      const c = leerCargaDeLaSerie(valores.carga);
      if (c === null) return setMal(COPY_SELECCION.cargaNoSeEntiende);
      sets = escribirEnLasSeries(sets, elegidas, 'suggestedLoad', { value: c, unit: unidad });
    }
    if (valores.rir.trim() && criterio === 'RIR') {
      const r = leerElRir(notacion)(valores.rir);
      if (r === null) return setMal(`No se entiende el ${esfuerzo}: va de ${RANGO_DEL_ESFUERZO[notacion]}.`);
      sets = escribirEnLasSeries(sets, elegidas, 'rir', r);
    }
    if (valores.descanso.trim()) {
      const d = leerDescansoDeLaSerie(valores.descanso);
      if (d === null) return setMal(COPY_SELECCION.descansoNoSeEntiende);
      sets = escribirEnLasSeries(sets, elegidas, 'restSeconds', d);
    }
    if (valores.nota.trim()) sets = sets.map((x, m) => (elegidas.has(m) ? { ...x, note: valores.nota.trim() } : x));
    onCambiar({ sets, ...(valores.rir.trim() && criterio === 'RIR' && !p.intensity ? { intensity: { criterion: 'RIR', target: { value: Number.NaN, reference: null } } as PrescripcionE['intensity'] } : {}) });
    onCerrar();
  };
  return (
    <div className="editar-todas" data-editar-todas-las-series>
      <fieldset className="editar-todas__series">
        <legend>{COPY_TODAS.cuales}</legend>
        <div className="editar-todas__casillas">
          {p.sets.map((s, n) => (
            <label key={n} className="editar-todas__casilla" data-calentamiento={esDeCalentamiento(s) ? '' : undefined}>
              <input
                type="checkbox"
                checked={elegidas.has(n)}
                onChange={() =>
                  setElegidas((e) => {
                    const x = new Set(e);
                    if (!x.delete(n)) x.add(n);
                    return x;
                  })
                }
                data-elegir-serie={n + 1}
              />
              {rotulos[n]!.corto}
              <span className="visualmente-oculto"> ({rotulos[n]!.largo})</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="editar-todas__campos">
        {campo('reps', COPY_SELECCION.repeticiones, '8 u 8-12')}
        {campo('carga', `${COPY_SERIES.carga} (${unidad})`, '60')}
        {criterio === 'RIR' ? campo('rir', esfuerzo, notacion === 'RPE' ? '8' : '2') : null}
        {campo('descanso', COPY_ENTRENAMIENTO.descanso, '02:00')}
        {campo('nota', C.nota, '')}
      </div>
      {/* RP-19: el renglón del aviso, siempre. */}
      <p className={mal ? 'campo__error editar-todas__aviso' : 'nota editar-todas__aviso'} role={mal ? 'alert' : undefined}>
        {mal ?? COPY_TODAS.loVacio}
      </p>
      <div className="acciones">
        {onCalcularLaCarga ? (
          <button type="button" className="boton boton--quieto boton--compacto" data-calcular-la-carga-de-las-elegidas onClick={() => onCalcularLaCarga([...elegidas].sort((a, b) => a - b))}>
            <Icono nombre="calculado" tamano={18} />
            {COPY_CARGA_DESDE_LA_ESTIMACION.abrirEnLasElegidas}
          </button>
        ) : null}
        <button type="button" className="boton boton--discreto" onClick={onCerrar}>
          Cancelar
        </button>
        <button type="button" className="boton boton--primario" onClick={aplicar} data-aplicar-a-todas>
          {COPY_TODAS.aplicar(elegidas.size)}
        </button>
      </div>
    </div>
  );
}

const COPY_TODAS = {
  titulo: 'Editar todas las series',
  cuales: 'En qué series',
  loVacio: 'Lo que dejes vacío conserva su valor en cada serie.',
  ninguna: 'Elegí por lo menos una serie.',
  aplicar: (n: number) => (n === 1 ? 'Aplicar a 1 serie' : `Aplicar a ${n} series`),
} as const;

/** ENP-D16 (C4): la edición conjunta de series. */
const COPY_SELECCION = {
  seleccionar: 'Cambiar varias series',
  ninguna: 'Elegí las series en la tabla y,',
  enLasElegidas: (n: number) => (n === 1 ? 'En la serie elegida,' : `En las ${n} series elegidas,`),
  poner: 'poner',
  en: 'en',
  aplicar: 'Aplicar',
  ayuda:
    'Tildá las series que querés cambiar (o «Elegir todas»), elegí qué dato y escribí el valor: «Aplicar» lo escribe en todas las elegidas de una vez. «Volver a lo común» les saca el valor propio. «Listo» cierra la barra.',
  ayudaComun: 'Lo común es lo que toman las series que no tienen un valor propio: se escribe en la primera fila de la tabla.',
  aproximacion: 'Aproximación',
  aprox: 'Aprox.',
  ayudaDeLaAproximacion: 'Marcá las series de aproximación: van arriba de las efectivas, se registran y no entran en las cuentas ni en los gráficos.',
  grupoAproximaciones: 'Aproximaciones',
  grupoEfectivas: 'Efectivas',
  todas: 'Elegir todas',
  ningunaDeNuevo: 'Ninguna',
  repeticiones: 'Repeticiones',
  escribirEn: (n: number) => (n === 1 ? 'Escribir en 1 serie' : `Escribir en ${n} series`),
  listo: 'Listo',
  repeticionesNoSeEntienden: 'No se entiende: va un número o un rango, como 8-12.',
  // RP-22: los mismos límites que las celdas.
  cargaNoSeEntiende: 'No se entiende: va un número desde 0.',
  descansoNoSeEntiende: 'No se entiende: va como 02:30, o en segundos, hasta 60:00.',
} as const;

/** DL-197 (F9, F16): los textos de la tarjeta del ejercicio. */
const E9 = {
  yaEsElPrimero: 'Ya es el primero.',
  yaEsElUltimo: 'Ya es el último.',
  aproximaciones: (n: number) => `Aproximaciones · ${n}`,
  tituloAproximaciones: 'Aproximaciones',
  todas: 'Editar todas las series',
  masOpciones: 'Más opciones',
  otraIntensidad: 'otra intensidad',
  enLaTabla: (r: string) => `En la tabla: ${r}.`,
  sinAproximaciones: 'Todavía no tiene aproximaciones.',
  /** Hereda la intensidad del plan y todavía no tiene objetivo: la persona lo lee sin criterio hasta que se escriba. */
  faltaElObjetivoHeredado: 'Falta el objetivo de intensidad del plan',
} as const;

/** ENP-D14: los textos del criterio arriba de las series. */
const COPY_CRITERIO_ARRIBA = {
  titulo: 'Intensidad y bases de las series',
  notasYParametros: 'Notas y parámetros',
  // DL-196 (E8 y E16): todas las explicaciones del renglón, en el «?» de la esquina, con un ejemplo de cada dato.
  queEsCadaDato: 'Qué es cada dato del criterio',
  intensidad: 'Intensidad: el criterio con el que se indica qué tan exigente es cada serie. Se elige uno, o ninguno: nunca dos.',
  rpe:
    'RPE: la escala de esfuerzo percibido, del 1 al 10. Dice qué tan dura se sintió la serie: 1, casi nada; 10, el máximo esfuerzo posible.',
  rpeYRir:
    'En la práctica se usa anclada a las repeticiones en reserva (la escala de Zourdos): RPE 10 = no podía hacer otra; RPE 9 ≈ me quedaba 1; RPE 8 ≈ me quedaban 2; RPE 7 ≈ me quedaban 3. Por eso BE guarda el RIR: es el mismo dato en las dos escalas.',
  rir: 'RIR: las repeticiones en reserva, cuántas más podría haber hecho. Por ejemplo, RIR 2 = me quedaban 2.',
  porcentaje: '% RM: una parte de la carga máxima para una repetición (1RM). Por ejemplo, con un 1RM de 100 kg, 75 % RM son 75 kg. La referencia dice cómo se estimó ese 1RM.',
  objetivo: (rango: string) => `Objetivo: con un criterio elegido, es necesario. En esta escala va de ${rango}; en % RM, hasta 100.`,
  unidad: 'Unidad: la de todas las cargas del ejercicio. Cambiarla no convierte los números.',
  bases:
    'La carga es: una sola mancuerna o implemento, por mancuerna (cuando son dos) o la carga externa total. Las repeticiones son: por serie o por lado. Sin elegir, se toma la del implemento (por mancuerna en las mancuernas; si no, la total) y por serie.',
  // F11: no parecen datos que faltan.
  carga: 'La carga es…',
  repeticiones: 'Las repeticiones son…',
  porOmision: (etiqueta: string) => `${etiqueta.charAt(0).toUpperCase()}${etiqueta.slice(1)} (por omisión)`,
  laDelPlan: (nombre: string) => `La del plan: ${nombre}`,
  soloCargaYRepeticiones: 'solo carga y repeticiones',
} as const;

type EleccionDeIntensidad = 'PLAN' | 'RIR' | 'PERCENT_RM' | 'SIN';

/**
 * ENP-D14 y DL-197 (ET1-D11, F11 a F13) · En «Más opciones» del ejercicio: la intensidad (la del plan, que se hereda, u otra
 * por excepción) con su objetivo y la referencia del % RM, y cómo se cuentan la carga y las repeticiones. La unidad va en
 * el chip del encabezado de la carga (F10).
 */
function CriterioDelEjercicio({
  id,
  nombre,
  prescripcion: p,
  onCambiar,
  intensidadDelPlan,
  sinIntensidad,
  onSinIntensidad,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  intensidadDelPlan: Criterio | null;
  sinIntensidad: boolean;
  onSinIntensidad?: (sin: boolean) => void;
}) {
  const propio = (p.intensity?.criterion as Criterio | undefined) ?? null;
  // DL-192: en un plan en RPE, el criterio RIR se elige y se escribe como RPE; lo guardado sigue siendo el RIR.
  const notacion = useNotacionDelEsfuerzo();
  const nombreDelCriterio = (c: Criterio): string => (c === 'RIR' ? COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion] : ETIQUETA_DE_CRITERIO[c]);
  const delPlan = intensidadDelPlan ? nombreDelCriterio(intensidadDelPlan) : COPY_CRITERIO_ARRIBA.soloCargaYRepeticiones;
  const eleccion: EleccionDeIntensidad = propio ? (propio === intensidadDelPlan ? 'PLAN' : propio) : sinIntensidad && intensidadDelPlan !== null ? 'SIN' : 'PLAN';
  // C7: lo que se quitó al cambiar de criterio, con «Deshacer», mientras siga el criterio elegido.
  const [cambio, setCambio] = useState<CambioDeCriterio<PrescripcionE['intensity']> | null>(null);
  const avisoDelCambio = cambio && sigueElCambio(p, cambio) ? cambio : null;
  const [objetivoMal, setObjetivoMal] = useState(false);
  const elegir = (e: EleccionDeIntensidad) => {
    // Elegir no trae un objetivo: el número lo escribe el profesional (09v10:339-340). Sin RIR, el RIR de cada serie se
    // quita (sería un segundo criterio, REG-06-128). Lo que se quita se dice, con «Deshacer».
    const nuevo: Criterio | '' = e === 'PLAN' || e === 'SIN' ? '' : e === intensidadDelPlan ? '' : e;
    const hereda = nuevo === '' && e !== 'SIN';
    // Heredar el del plan cuando el propio ya es ese: no cambia nada.
    if (hereda && propio === intensidadDelPlan && propio !== null) return onSinIntensidad?.(false);
    setCambio(cambioDeCriterio(p, nuevo));
    onCambiar(conElCriterio(p, nuevo));
    onSinIntensidad?.(e === 'SIN');
  };
  // F11: lo que se toma sin elegir, del implemento.
  const cargaPorOmision = implementoDelEjercicio(nombre, null) === 'MANCUERNA' ? 'PER_IMPLEMENT' : 'TOTAL_EXTERNAL';
  return (
    <div className="criterio-del-ejercicio con-ayuda-en-la-esquina" role="group" aria-label={COPY_CRITERIO_ARRIBA.titulo} data-criterio-del-ejercicio>
      <ExplicacionAPedido nombre={COPY_CRITERIO_ARRIBA.queEsCadaDato} como="div" lugar="esquina">
        <p>{COPY_CRITERIO_ARRIBA.intensidad}</p>
        <p data-ayuda-del-rpe>{COPY_CRITERIO_ARRIBA.rpe}</p>
        <p>{COPY_CRITERIO_ARRIBA.rpeYRir}</p>
        <p>{COPY_CRITERIO_ARRIBA.rir}</p>
        <p>{COPY_CRITERIO_ARRIBA.porcentaje}</p>
        <p>{COPY_CRITERIO_ARRIBA.objetivo(RANGO_DEL_ESFUERZO[notacion])}</p>
        <p>{COPY_CRITERIO_ARRIBA.bases}</p>
      </ExplicacionAPedido>
      <div className="lo-general-del-editor__par">
        <div className="campo">
          <label htmlFor={`${id}-criterio`}>{COPY_ENTRENAMIENTO.intensidad}</label>
          <select id={`${id}-criterio`} value={eleccion} onChange={(e) => elegir(e.target.value as EleccionDeIntensidad)} data-intensidad-del-ejercicio={eleccion}>
            <option value="PLAN">{COPY_CRITERIO_ARRIBA.laDelPlan(delPlan)}</option>
            {(Object.keys(ETIQUETA_DE_CRITERIO) as Criterio[])
              .filter((c) => c !== intensidadDelPlan)
              .map((c) => (
                <option key={c} value={c}>
                  {nombreDelCriterio(c)}
                </option>
              ))}
            {intensidadDelPlan !== null ? <option value="SIN">{COPY_ENTRENAMIENTO.sinCriterio}</option> : null}
          </select>
        </div>
        {p.intensity ? (
          <CampoInterpretado
            id={`${id}-objetivo`}
            etiqueta={`${COPY_ENTRENAMIENTO.objetivoDeIntensidad} (${nombreDelCriterio(propio!)})`}
            inputMode="decimal"
            valor={p.intensity.target.value}
            clave={String(p.intensity.target.value)}
            formatear={propio === 'RIR' && notacion === 'RPE' ? (v) => (v === null || Number.isNaN(v) ? '' : esfuerzoEnCampo(v, 'RPE')) : escribirNumero}
            interpretar={(t) => {
              if (propio === 'RIR' && notacion === 'RPE') return t.trim() === '' ? Number.NaN : (leerRpeEscrito(t) ?? Number.NaN);
              const v = leerValor(t) ?? Number.NaN;
              // F13: un % RM de menos de 30 no se guarda: lo más probable es un RIR escrito acá.
              return propio === 'PERCENT_RM' && v < PORCENTAJE_RM_MINIMO ? Number.NaN : v;
            }}
            mismo={mismoNumero}
            noSeEntiende={propio === 'RIR' && notacion === 'RPE' ? 'No se entiende: va un RPE de 6 a 10, de a medio punto, o «6 o menos».' : propio === 'PERCENT_RM' ? COPY_SERIES.porcentajeBajo : 'No se entiende: va un número.'}
            avisoAparte={{ id: `${id}-objetivo-aviso`, onMal: setObjetivoMal }}
            onCambiar={(v) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, value: v } } })}
          />
        ) : null}
      </div>
      {/* F12 (RP-19): el renglón del aviso del cambio de criterio está siempre: aparecer no corre los campos. */}
      <p className="nota criterio-del-ejercicio__aviso" role="status" data-cambio-de-criterio={avisoDelCambio ? '' : undefined}>
        {avisoDelCambio ? (
          <>
            <span>{avisoDelCambio.texto}</span>
            <button
              type="button"
              className="boton boton--discreto"
              data-deshacer-el-criterio
              onClick={() => {
                onCambiar(deshacerElCambioDeCriterio(p, avisoDelCambio));
                setCambio(null);
              }}
            >
              <Icono nombre="deshacer" tamano={15} />
              {COPY_CAMBIO_DE_CRITERIO.deshacer}
            </button>
          </>
        ) : (
          ' '
        )}
      </p>
      {p.intensity && propio === 'PERCENT_RM' ? (
        <Campo
          id={`${id}-referencia`}
          etiqueta={`${COPY_ENTRENAMIENTO.referenciaDeRm} (opcional)`}
          placeholder="1RM estimado por…"
          value={p.intensity.target.reference?.description ?? ''}
          onChange={(e) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, reference: e.target.value ? { description: e.target.value } : null } } })}
          maxLength={500}
        />
      ) : null}
      {/* F11: «La carga es…» y «Las repeticiones son…», con lo que se toma sin elegir a la vista (no parece un dato que falta). */}
      <div className="criterio-del-ejercicio__bases" data-bases>
        <div className="campo">
          <label htmlFor={`${id}-base-carga`}>{COPY_CRITERIO_ARRIBA.carga}</label>
          <select
            id={`${id}-base-carga`}
            value={p.loadBasis ?? ''}
            onChange={(e) => {
              const b = BaseDeCargaSchema.safeParse(e.target.value);
              onCambiar({ loadBasis: b.success ? b.data : null });
            }}
          >
            <option value="">{COPY_CRITERIO_ARRIBA.porOmision(ETIQUETA_DE_BASE_DE_CARGA[cargaPorOmision])}</option>
            {BaseDeCargaSchema.options.map((b) => (
              <option key={b} value={b}>
                {ETIQUETA_DE_BASE_DE_CARGA[b]}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-base-reps`}>{COPY_CRITERIO_ARRIBA.repeticiones}</label>
          <select
            id={`${id}-base-reps`}
            value={p.repetitionBasis ?? ''}
            onChange={(e) => {
              const b = BaseDeRepeticionesSchema.safeParse(e.target.value);
              onCambiar({ repetitionBasis: b.success ? b.data : null });
            }}
          >
            <option value="">{COPY_CRITERIO_ARRIBA.porOmision(ETIQUETA_DE_BASE_DE_REPETICIONES.PER_SET)}</option>
            {BaseDeRepeticionesSchema.options.map((b) => (
              <option key={b} value={b}>
                {ETIQUETA_DE_BASE_DE_REPETICIONES[b]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* RP-22: con un criterio propio, el renglón del aviso de su objetivo está siempre, al pie del recuadro. */}
      {p.intensity ? (
        <RenglonDelAviso id={`${id}-objetivo-aviso`} tipo={objetivoMal ? 'error' : 'nota'} className="criterio-del-ejercicio__aviso-del-objetivo" data-objetivo-no-se-entiende={objetivoMal ? '' : undefined}>
          {objetivoMal ? (propio === 'PERCENT_RM' ? COPY_SERIES.porcentajeBajo : 'No se entiende el objetivo: va un número.') : null}
        </RenglonDelAviso>
      ) : null}
    </div>
  );
}

/**
 * Lo general del ejercicio que no cambia cómo se lee cada serie: las notas y los parámetros. El criterio, la unidad y las
 * bases van arriba de las series (`CriterioDelEjercicio`, ENP-D14).
 */
function LoGeneralDelEjercicio({ id, prescripcion: p, onCambiar }: { id: string; prescripcion: PrescripcionE; onCambiar: (c: Partial<PrescripcionE>) => void }) {
  const parametros = p.professionalParameters ?? [];
  return (
    <div className="lo-general-del-editor">
      <div className="campo">
        <label htmlFor={`${id}-nota`}>{COPY_ENTRENAMIENTO.notas}</label>
        <textarea id={`${id}-nota`} rows={2} value={p.note ?? ''} onChange={(e) => onCambiar({ note: e.target.value || null })} maxLength={1000} />
      </div>
      <div className="parametros-del-editor" data-parametros>
        {parametros.length > 0 ? (
          <>
            <p className="ejercicio-del-plan__subtitulo">Parámetros</p>
            <p className="campo__ayuda">{COPY_ENTRENAMIENTO.ayudaDeTempo}</p>
          </>
        ) : null}
        {parametros.map((q, n) => (
          <div key={n} className="fila-de-dato">
            <Campo id={`${id}-param-${n}-etiqueta`} etiqueta="Parámetro" value={q.label} onChange={(e) => onCambiar({ professionalParameters: parametros.map((x, m) => (m === n ? { ...x, label: e.target.value } : x)) })} maxLength={60} />
            {/* Un parámetro puede ser texto o número; el número se escribe y se muestra con coma (DL-091 punto 4). El campo
                guarda el texto tal como se escribe: si mostrara el número interpretado, «1,0» se volvería «1» y «1,05» no
                se podría escribir. */}
            <CampoInterpretado
              id={`${id}-param-${n}-valor`}
              etiqueta="Valor"
              valor={q.value}
              clave={`${typeof q.value}:${q.value}`}
              formatear={(v) => (typeof v === 'number' ? numeroEnCampo(v) : v)}
              interpretar={(s) => leerNumero(s) ?? s}
              mismo={(a, b) => a === b}
              onCambiar={(v) => onCambiar({ professionalParameters: parametros.map((x, m) => (m === n ? { ...x, value: v } : x)) })}
              maxLength={120}
            />
            <Campo id={`${id}-param-${n}-unidad`} etiqueta="Unidad (si es un número)" value={q.unit ?? ''} onChange={(e) => onCambiar({ professionalParameters: parametros.map((x, m) => (m === n ? { ...x, unit: e.target.value || null } : x)) })} maxLength={20} />
            <button type="button" className="boton boton--discreto" onClick={() => onCambiar({ professionalParameters: parametros.filter((_, m) => m !== n) })}>
              Quitar parámetro
            </button>
          </div>
        ))}
        {/* DL-122: el descanso tiene su campo propio. Un parámetro «Descanso» que ya existía se conserva tal cual, sin
            reinterpretarlo: ya no se ofrece el atajo que lo creaba. */}
        <button type="button" className="boton boton--discreto" data-agregar-parametro onClick={() => onCambiar({ professionalParameters: [...parametros, { label: '', value: '', unit: null }] })}>
          <Icono nombre="mas" tamano={18} />
          Agregar parámetro
        </button>
      </div>
    </div>
  );
}
