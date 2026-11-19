'use client';

/**
 * Un ejercicio de la versión en preparación del plan de entrenamiento (WP-ESCRITORIO-AREAS, parte 8; maqueta 28).
 * Plegado, un renglón con lo que piden sus series —lo escrito, todavía sin guardar, resuelto como lo va a resolver la
 * API— y con lo que adentro pide atención. Abierto, sus series en una tabla y «Lo general del ejercicio» al costado.
 * - **Intensidad: % RM o RIR, o ninguno;** nunca los dos (B10-06:398-410). Con un criterio elegido, su objetivo no es
 *   opcional. La carga sugerida va aparte y no es el criterio (B10-06:463-477).
 * - **Cada objetivo de una serie tiene tres estados (DL-122),** en una sola celda: vacía, la serie toma el de lo
 *   general, que se lee en gris; con un valor, tiene el suyo; y con «Sin objetivo», que se elige con el botón de la
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
  COPY_TIPOS_DE_SERIE,
  esDeCalentamiento,
  rotulosDeLasSeries,
} from '@be/domain';
import { useEffect, useId, useState, type ComponentProps, type KeyboardEvent } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
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
import { celdaDeLaPlanilla, copiarHaciaAbajo, COPY_PLANILLA as PL, escribirEnLasSeries, leerRepeticiones, loQueSePierdeAlQuitarLaSerie, origenDeLaCelda, volverALoGeneral, type ObjetivoDeLaSerie } from './planilla-de-series';
import { NotasAlLado, useNotasPropias } from '../notas-propias';

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
 * camino. Si el valor cambia desde afuera (al guardar, al quitar un ejercicio, al elegir «Sin objetivo»), el texto se
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
}) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave, formatear, interpretar, mismo, alCambiar: onCambiar, normalizarAlSalir });
  const mal = !!noSeEntiende && texto.trim() !== '' && formatear(interpretar(texto)) === '';
  return <Campo {...campo} value={texto} error={mal ? noSeEntiende : null} onChange={(e) => alEscribir(e.target.value)} onBlur={alSalir} />;
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
/** El descanso general: vacío → null; «02:30» o los segundos; lo demás → NaN. */
const leerElDescanso = (s: string): number | null => (s.trim() === '' ? null : (leerDescanso(s) ?? Number.NaN));
const escribirElDescanso = (n: number | null): string => (n === null || Number.isNaN(n) ? '' : (textoDeSegundos(n) ?? ''));

/** La unidad de las cargas de una prescripción: la de su carga sugerida, o kg. Las series usan la misma (DL-122). */
const unidadDe = (p: PrescripcionE): 'kg' | 'lb' => p.suggestedLoad?.unit ?? p.sets.find((x) => x.suggestedLoad)?.suggestedLoad?.unit ?? 'kg';

const noSeEntiendenLasReps = (r: Repeticiones): boolean => !!r && ('value' in r ? Number.isNaN(r.value) : Number.isNaN(r.min) || Number.isNaN(r.max));
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
  onCambiar,
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
}: {
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
  // PLT (DL-182): sin persona (una plantilla), el editor no pasa el ejercicio del catálogo y nada de esto se pide.
  const { token, asesoradoId, sesionPerdida } = useEditorDeEntrenamiento();
  // PG-16 (DL-173): «Anotar sobre este ejercicio», si el editor tiene las notas propias y se sabe qué ejercicio es.
  const notasPropias = useNotasPropias();
  const propio = useId();
  const plegado = ejercicioPlegadoDelEditor(p, problemas);
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
  const Titulo = nivel;
  return (
    <section className="comida-del-plan ejercicio-del-editor" data-ejercicio={posicion + 1} data-abierta={abierto ? '' : undefined} data-en-bloque={nivel === 'h4' ? '' : undefined}>
      <div className="comida-del-editor__cabecera">
        <Titulo className="comida-del-plan__titulo">
          <button type="button" id={`abrir-ejercicio-${id}`} className="comida-del-plan__boton" aria-expanded={abierto} aria-controls={`${propio}-cuerpo`} onClick={alAlternar}>
            <Icono nombre="entrenamiento" tamano={20} />
            <span className="comida-del-plan__textos">
              <span className="comida-del-plan__nombre">{nombre}</span>
              {/* Plegado dice lo que piden sus series; abierto, cuántas son: el detalle está abajo. */}
              <span className="comida-del-plan__cuenta" data-resumen>
                <EnPartes texto={abierto ? cuentaDeSeries(p.sets) : plegado.resumen} />
              </span>
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
              {plegado.avisos.length > 0 ? (
                <span className="comida-del-editor__avisos" data-avisos>
                  <Icono nombre="aviso" tamano={18} />
                  <EnPartes texto={plegado.avisos.join(' · ')} />
                </span>
              ) : null}
            </span>
            <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
          </button>
        </Titulo>
        {abierto ? (
          <div className="comida-del-editor__acciones">
            {/* Se apagan con `aria-disabled`: al llegar a la punta, el botón que se tocó conserva el foco. */}
            <button type="button" className="boton boton--quieto boton--compacto" aria-disabled={esElPrimero || undefined} onClick={() => !esElPrimero && onSubir()}>
              <Icono nombre="ordenar" tamano={18} />
              {EDICION.subir}
              <span className="visualmente-oculto"> {nombre}</span>
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" aria-disabled={esElUltimo || undefined} onClick={() => !esElUltimo && onBajar()} data-bajar>
              {EDICION.bajar}
              <span className="visualmente-oculto"> {nombre}</span>
            </button>
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
                { clave: 'duplicar', texto: EDICION.duplicarEjercicio, alElegir: onDuplicar },
                ...accionesDelBloque,
                { clave: 'quitar', texto: `Quitar ${nombre}`, alElegir: onQuitar },
              ]}
            />
          </div>
        ) : null}
      </div>
      {/* PG-16: las notas propias atadas a este ejercicio, a la vista aunque esté plegado. */}
      <NotasAlLado ejercicio={exerciseId} />
      <div id={`${propio}-cuerpo`} className="comida-del-plan__cuerpo ejercicio-del-editor__cuerpo" hidden={!abierto}>
        {abierto ? (
          <>
            {conFuerza ? (
              <p className="ejercicio-del-editor__fuerza">
                <button type="button" className="boton boton--quieto boton--compacto" data-detalle-con-fuerza onClick={() => setDetalle(true)}>
                  <Icono nombre="estimado" tamano={18} />
                  {COPY_DETALLE_DEL_EJERCICIO.abrir}
                  <span className="visualmente-oculto"> de {nombre}</span>
                </button>
              </p>
            ) : conLaVezPasada ? (
              <p className="ejercicio-del-editor__fuerza">
                <button type="button" className="boton boton--quieto boton--compacto" data-la-vez-pasada-del-ejercicio onClick={() => setVezPasada(true)}>
                  <Icono nombre="linea-de-tiempo" tamano={18} />
                  {COPY_LA_VEZ_PASADA_EN_EL_EDITOR.abrir}
                  <span className="visualmente-oculto"> de {nombre}</span>
                </button>
              </p>
            ) : null}
            {/* ENP-D14 (C2): el criterio, la unidad y las bases de la carga y de las repeticiones, arriba de las series que
                dependen de ellos; la tabla de series ocupa todo el ancho, sin desplazamiento propio. */}
            <CriterioDelEjercicio id={id} prescripcion={p} onCambiar={onCambiar} />
            {/* ED-22: la prescripción en una línea, arriba de las series que escribe. */}
            <LineaDePrescripcion id={id} nombre={nombre} prescripcion={p} texto={onLineaSinAplicar ? lineaSinAplicar : undefined} onTexto={onLineaSinAplicar} onAplicar={(nueva, revisar) => onAplicarLinea(nueva, revisar)} />
            <SeriesDelEjercicio
              id={id}
              nombre={nombre}
              prescripcion={p}
              onCambiar={onCambiar}
              onCalcularLaCarga={
                conFuerza
                  ? (elegidas) => {
                      setSeriesDeLaCarga(elegidas);
                      setDetalle(true);
                    }
                  : null
              }
            />
            <div className="ejercicio-del-editor__general">
              <p className="ejercicio-del-plan__subtitulo">
                {COPY_CRITERIO_ARRIBA.notasYParametros} <span className="nota">Opcional</span>
              </p>
              {imagen ? <ImagenGuardadaDeEjercicio token={token} medioId={imagen.mediaId} nombre={nombre} textoAlternativo={imagen.altText} sesionPerdida={sesionPerdida} chica /> : null}
              <LoGeneralDelEjercicio id={id} prescripcion={p} onCambiar={onCambiar} />
            </div>
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
  return (
    <div className="celda-de-objetivo" data-estado={celda.estado} data-origen={marca ?? undefined}>
      <input
        id={id}
        aria-label={rotulo}
        aria-describedby={`${id}-estado`}
        aria-invalid={celda.estado === 'no-se-entiende' || undefined}
        inputMode={entero ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={texto}
        placeholder={origen.placeholder}
        data-en-gris={celda.enGris ? '' : undefined}
        // «Sin indicar» es un texto: se acomoda distinto que un número.
        data-texto={texto === '' && origen.placeholder === PL.sinIndicar ? '' : undefined}
        onChange={(e) => alEscribir(e.target.value)}
        onBlur={alSalir}
      />
      {marca ? (
        <span className="celda-de-objetivo__origen" aria-hidden="true" data-origen-de-la-celda>
          {marca}
        </span>
      ) : null}
      <span id={`${id}-estado`} className="visualmente-oculto">
        {origen.descripcion}
      </span>
      <MenuDeAcciones rotulo={`Opciones para ${queEs}`} icono="abajo" acciones={celda.opciones.map((o) => ({ clave: o, texto: OPCION_DE_LA_CELDA[o], alElegir: () => onCambiar(objetivoElegidoEnLaCelda(o)) }))} />
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
  noSeEntiende,
}: {
  id: string;
  rotulo: string;
  valor: number | null;
  formatear: (n: number | null) => string;
  interpretar: (t: string) => number | null;
  onCambiar: (v: number | null) => void;
  /** Lo que se dice, a la vista y asociado al campo, cuando lo escrito no se entiende (WCAG 3.3.1), como en lo general de antes. */
  noSeEntiende: string;
}) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave: String(valor), formatear, interpretar, mismo: mismoNumero, alCambiar: onCambiar, normalizarAlSalir: true });
  const mal = texto.trim() !== '' && Number.isNaN(interpretar(texto));
  return (
    <>
      <input
        id={id}
        className="celda-de-serie"
        aria-label={rotulo}
        aria-invalid={mal || undefined}
        aria-describedby={mal ? `${id}-no-se-entiende` : undefined}
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onChange={(e) => alEscribir(e.target.value)}
        onBlur={alSalir}
      />
      {mal ? (
        <span id={`${id}-no-se-entiende`} className="campo__error" data-celda-general-no-se-entiende>
          {noSeEntiende}
        </span>
      ) : null}
    </>
  );
}

/** Las repeticiones de una serie: un número o un rango. No se toman de lo general: son de cada serie. */
function CeldaDeRepeticiones({ id, rotulo, valor, onCambiar }: { id: string; rotulo: string; valor: Repeticiones; onCambiar: (r: Repeticiones) => void }) {
  const { texto, alEscribir, alSalir } = useTextoInterpretado(valor, { clave: JSON.stringify(valor), formatear: reps, interpretar: leerReps, mismo: mismasReps, alCambiar: onCambiar, normalizarAlSalir: true });
  return <input id={id} className="celda-de-serie" aria-label={rotulo} aria-invalid={noSeEntiendenLasReps(valor) || undefined} autoComplete="off" value={texto} onChange={(e) => alEscribir(e.target.value)} onBlur={alSalir} />;
}

/**
 * Las series, una por fila: sus repeticiones, sus objetivos (la carga sugerida, el RIR si ese es el criterio, y el
 * descanso) y su nota. Lo que una celda muestra en gris es lo que la serie toma de lo general.
 */
function SeriesDelEjercicio({
  id,
  nombre,
  prescripcion: p,
  onCambiar,
  onCalcularLaCarga = null,
}: {
  id: string;
  nombre: string;
  prescripcion: PrescripcionE;
  onCambiar: (c: Partial<PrescripcionE>) => void;
  /** ED-76 (EDT-56): abre el cálculo de la carga para las series elegidas; `null` fuera de la lista de la v1. */
  onCalcularLaCarga?: ((elegidas: readonly number[]) => void) | null;
}) {
  const conRir = (p.intensity?.criterion as Criterio | undefined) === 'RIR';
  const unidad = unidadDe(p);
  const valido = (n: number | null | undefined): n is number => typeof n === 'number' && !Number.isNaN(n);
  // Lo que toma de lo general una serie que no tiene el suyo. Si lo general está mal escrito, todavía no hay qué tomar.
  const cargaGeneral = p.suggestedLoad && valido(p.suggestedLoad.value) ? numeroEnCampo(p.suggestedLoad.value) : null;
  const rirGeneral = conRir && p.intensity && valido(p.intensity.target.value) ? numeroEnCampo(p.intensity.target.value) : null;
  const descansoGeneral = valido(p.restSeconds) ? textoDeSegundos(p.restSeconds) : null;
  // DL-178: las efectivas se numeran 1, 2, 3 como siempre; las de calentamiento llevan «C» y van arriba.
  const rotulos = rotulosDeLasSeries(p.sets);
  const cual = (n: number): string => (rotulos[n]?.numero == null ? 'esta serie de calentamiento' : `la serie ${rotulos[n]!.numero}`);
  const cambiarLaSerie = (n: number, f: (s: Serie) => Serie) => onCambiar({ sets: p.sets.map((x, m) => (m === n ? f(x) : x)) });
  /** DL-178: marca o desmarca una serie como calentamiento; el calentamiento sube arriba, sin cambiar el orden de cada tipo. */
  const marcarCalentamiento = (n: number) => {
    setElegidas(new Set());
    const sets = p.sets.map((x, m): Serie => {
      if (m !== n) return x;
      const { setKind: _tipo, ...resto } = x;
      return esDeCalentamiento(x) ? resto : { ...resto, setKind: 'WARM_UP' };
    });
    onCambiar({ sets: conElCalentamientoArriba<Serie>(sets) });
  };
  // ED-23: las series elegidas, para escribirles un valor o devolverlas a lo general; y la serie que se va a quitar.
  const [elegidas, setElegidas] = useState<ReadonlySet<number>>(new Set());
  // ENP-D16 (C4): «Seleccionar series» a la vista; las casillas y la barra aparecen al pedirlo.
  const [seleccionando, setSeleccionando] = useState(false);
  const [campo, setCampo] = useState<ObjetivoDeLaSerie | 'repetitions'>('repetitions');
  const [valor, setValor] = useState('');
  const [noSeEntiende, setNoSeEntiende] = useState(false);
  const [quitando, setQuitando] = useState<number | null>(null);
  const elegir = (n: number) =>
    setElegidas((e) => {
      const x = new Set(e);
      if (!x.delete(n)) x.add(n);
      return x;
    });
  const escribirEnLasElegidas = () => {
    // ENP-D16: las repeticiones (un número o un rango) también se escriben en todas las elegidas.
    if (campo === 'repetitions') {
      const r = leerReps(valor);
      if (r === null || noSeEntiendenLasReps(r)) return setNoSeEntiende(true);
      setNoSeEntiende(false);
      return onCambiar({ sets: p.sets.map((x, m) => (elegidas.has(m) ? { ...x, repetitions: r } : x)) });
    }
    const leido = campo === 'restSeconds' ? leerDescanso(valor) : leerNumero(valor);
    if (leido === null) return setNoSeEntiende(true);
    setNoSeEntiende(false);
    onCambiar({ sets: escribirEnLasSeries(p.sets, elegidas, campo, campo === 'suggestedLoad' ? { value: leido, unit: unidad } : leido) });
  };
  /** TEST-EDP-056: con valores propios, quitar los nombra antes y pide confirmar; sin ellos, quita. */
  const pedirQuitar = (n: number) => {
    if (loQueSePierdeAlQuitarLaSerie(p.sets, n)) return setQuitando(n);
    quitar(n);
  };
  const quitar = (n: number) => {
    setElegidas(new Set());
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
  /** Cambia un objetivo de una serie con sus tres estados: `undefined` quita la clave (la serie toma de lo general). */
  const cambiarElObjetivo = (n: number, campo: 'rir' | 'suggestedLoad' | 'restSeconds', valor: unknown) =>
    cambiarLaSerie(n, (x) => {
      const copia: Record<string, unknown> = { ...x };
      if (valor === undefined) delete copia[campo];
      else copia[campo] = valor;
      return copia as Serie;
    });
  const soltar = () => {
    setElegidas(new Set());
    setSeleccionando(false);
    setNoSeEntiende(false);
  };
  return (
    <div className="ejercicio-del-editor__series" data-seleccionando={seleccionando ? '' : undefined}>
      {p.sets.length === 0 ? <p className="nota">{C.sinSeries}</p> : null}
      <>
        {p.sets.length > 1 && !seleccionando ? (
          <div className="series-del-editor__seleccionar">
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setSeleccionando(true)} data-seleccionar-series>
              <Icono nombre="lista" tamano={18} />
              {COPY_SELECCION.seleccionar}
              <span className="visualmente-oculto"> de {nombre}</span>
            </button>
          </div>
        ) : null}
        {seleccionando ? (
          <div className="series-del-editor__elegidas" role="group" aria-label={PL.elegidas(elegidas.size)} data-series-elegidas={elegidas.size}>
            <strong aria-live="polite">{elegidas.size === 0 ? COPY_SELECCION.ninguna : PL.elegidas(elegidas.size)}</strong>
            <button type="button" className="boton boton--enlace" onClick={() => setElegidas(elegidas.size === p.sets.length ? new Set() : new Set(p.sets.map((_, n) => n)))} data-elegir-todas>
              {elegidas.size === p.sets.length ? COPY_SELECCION.ningunaDeNuevo : COPY_SELECCION.todas}
            </button>
            <label>
              <span className="visualmente-oculto">{PL.campo}</span>
              <select value={campo} onChange={(e) => setCampo(e.target.value as ObjetivoDeLaSerie | 'repetitions')} data-campo-de-las-elegidas>
                <option value="repetitions">{COPY_SELECCION.repeticiones}</option>
                <option value="restSeconds">{COPY_ENTRENAMIENTO.descanso}</option>
                <option value="suggestedLoad">{C.cargaSugerida}</option>
                {conRir ? <option value="rir">{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</option> : null}
              </select>
            </label>
            <label>
              <span className="visualmente-oculto">{PL.valor}</span>
              <input
                className="celda-de-serie"
                value={valor}
                placeholder={campo === 'restSeconds' ? '02:00' : campo === 'repetitions' ? '8 u 8-12' : ''}
                aria-describedby={noSeEntiende ? `${id}-elegidas-no-se-entiende` : undefined}
                aria-invalid={noSeEntiende || undefined}
                onChange={(e) => setValor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    escribirEnLasElegidas();
                  }
                }}
              />
            </label>
            <button type="button" className="boton boton--secundario boton--compacto" aria-disabled={elegidas.size === 0 || undefined} onClick={() => elegidas.size > 0 && escribirEnLasElegidas()} data-escribir-en-las-elegidas>
              {elegidas.size > 0 ? COPY_SELECCION.escribirEn(elegidas.size) : PL.escribir}
            </button>
            {campo !== 'repetitions' ? (
              <button type="button" className="boton boton--quieto boton--compacto" aria-disabled={elegidas.size === 0 || undefined} onClick={() => elegidas.size > 0 && onCambiar({ sets: volverALoGeneral(p.sets, elegidas) })} data-volver-a-lo-general>
                {PL.volverALoGeneral}
              </button>
            ) : null}
            {onCalcularLaCarga ? (
              <button type="button" className="boton boton--quieto boton--compacto" data-calcular-la-carga-de-las-elegidas onClick={() => onCalcularLaCarga([...elegidas].sort((a, b) => a - b))}>
                <Icono nombre="calculado" tamano={18} />
                {COPY_CARGA_DESDE_LA_ESTIMACION.abrirEnLasElegidas}
              </button>
            ) : null}
            <button type="button" className="boton boton--enlace" onClick={soltar} data-terminar-la-seleccion>
              {COPY_SELECCION.listo}
            </button>
            {noSeEntiende ? (
              <p id={`${id}-elegidas-no-se-entiende`} className="campo__error" role="alert">
                {campo === 'repetitions' ? COPY_SELECCION.repeticionesNoSeEntienden : PL.noSeEntiende}
              </p>
            ) : null}
          </div>
        ) : null}
        <table className="tabla series-del-editor" onKeyDown={alTeclear}>
          <caption className="visualmente-oculto">Las series de {nombre}, con el objetivo que recibe la persona en cada una</caption>
          <thead>
            <tr>
              {seleccionando ? (
                <th scope="col" className="series-del-editor__columna-elegir">
                  <span className="visualmente-oculto">Elegir</span>
                </th>
              ) : null}
              {/* Revisión del tramo 2: la columna lleva el rótulo «Común» de su fila: con 3 rem, «Común» se pisaba con «en
                  cada serie» de la columna de al lado. */}
              <th scope="col" className="series-del-editor__columna-serie">
                {COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}
              </th>
              <th scope="col">
                Repeticiones <span className="nota">8 u 8-12</span>
              </th>
              <th scope="col">
                {C.cargaSugerida} <span className="nota">{unidad}</span>
              </th>
              {conRir ? (
                <th scope="col">
                  {COPY_ENTRENAMIENTO_POR_SERIE.columnaRir} <span className="nota">0 a 10</span>
                </th>
              ) : null}
              <th scope="col">
                {COPY_ENTRENAMIENTO.descanso} <span className="nota">02:30</span>
              </th>
              <th scope="col" className="series-del-editor__columna-nota">
                {C.nota}
              </th>
              <th scope="col" className="series-del-editor__columna-quitar">
                <span className="visualmente-oculto">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* ED-23 y C8: la fila «Común», dentro de la tabla. Lo que tiene es lo que toman las series sin valor propio. */}
            <tr className="series-del-editor__general" data-fila-general>
              {seleccionando ? <td className="series-del-editor__elegir" /> : null}
              <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
                {PL.general}
                <span className="visualmente-oculto"> {PL.generalDetalle}</span>
              </th>
              <td data-etiqueta="Repeticiones">
                <span className="nota">{PL.repeticionesPorSerie}</span>
              </td>
              <td data-etiqueta={`${C.cargaSugerida} (${unidad})`}>
                <CeldaGeneral
                  id={`${id}-carga`}
                  rotulo={`${PL.general}: ${C.cargaSugerida.toLowerCase()} (${unidad})`}
                  valor={p.suggestedLoad ? p.suggestedLoad.value : null}
                  formatear={escribirNumero}
                  interpretar={leerValor}
                  onCambiar={(v) => onCambiar({ suggestedLoad: v === null ? null : { value: v, unit: unidad } })}
                  noSeEntiende="No se entiende: va un número."
                />
              </td>
              {conRir ? (
                <td data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}>
                  {/* El RIR común es el objetivo del criterio, que se escribe arriba de la tabla (ENP-D14). */}
                  <span data-rir-general>{rirGeneral ?? '—'}</span> <span className="nota">{PL.rirDeLaIntensidad}</span>
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
                  noSeEntiende="No se entiende: va como 02:30, o en segundos enteros."
                />
              </td>
              <td className="series-del-editor__nota">
                <span className="nota">{PL.notaDeLoGeneral}</span>
              </td>
              <td />
            </tr>
            {p.sets.map((s, n) => (
              <tr key={n} data-serie={n + 1} data-elegida={elegidas.has(n) ? '' : undefined} data-calentamiento={esDeCalentamiento(s) ? '' : undefined}>
                {seleccionando ? (
                  <td className="series-del-editor__elegir">
                    <input type="checkbox" checked={elegidas.has(n)} onChange={() => elegir(n)} aria-label={PL.elegir(n + 1)} />
                  </td>
                ) : null}
                <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
                  <span className="series-del-editor__numero" title={rotulos[n]!.largo}>
                    {rotulos[n]!.corto}
                  </span>
                  {/* DL-178: «C» marca la serie como calentamiento: se registra y no entra en los cálculos. */}
                  <label className="series-del-editor__calentamiento" title={COPY_TIPOS_DE_SERIE.ayudaDelEditor}>
                    <input type="checkbox" id={`${id}-serie-${n}-calentamiento`} checked={esDeCalentamiento(s)} onChange={() => marcarCalentamiento(n)} data-marcar-calentamiento={n + 1} />
                    <span aria-hidden="true">{COPY_TIPOS_DE_SERIE.marca}</span>
                    <span className="visualmente-oculto">{`${COPY_TIPOS_DE_SERIE.marcarComoCalentamiento} (${rotulos[n]!.largo})`}</span>
                  </label>
                </th>
                <td data-etiqueta="Repeticiones">
                  <CeldaDeRepeticiones id={`${id}-serie-${n}`} rotulo={`${rotulos[n]!.largo}: repeticiones (un número o un rango, 8-12)`} valor={s.repetitions} onCambiar={(r) => cambiarLaSerie(n, (x) => ({ ...x, repetitions: r }))} />
                </td>
                <td data-etiqueta={`${C.cargaSugerida} (${unidad})`}>
                  <CeldaDeObjetivo
                    id={`${id}-serie-${n}-carga`}
                    rotulo={`${rotulos[n]!.largo}: carga sugerida (${unidad})`}
                    queEs={`la carga sugerida de ${cual(n)}`}
                    valor={s.suggestedLoad === undefined ? undefined : s.suggestedLoad === null ? null : s.suggestedLoad.value}
                    deLoGeneral={cargaGeneral}
                    escribir={numeroEnCampo}
                    leer={leerNumero}
                    onCambiar={(v) => cambiarElObjetivo(n, 'suggestedLoad', v === undefined || v === null ? v : { value: v, unit: unidad })}
                  />
                </td>
                {conRir ? (
                  <td data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}>
                    <CeldaDeObjetivo
                      id={`${id}-serie-${n}-rir`}
                      rotulo={`${rotulos[n]!.largo}: RIR objetivo (0 a 10)`}
                      queEs={`el RIR de ${cual(n)}`}
                      valor={s.rir}
                      deLoGeneral={rirGeneral}
                      escribir={numeroEnCampo}
                      leer={leerNumero}
                      onCambiar={(v) => cambiarElObjetivo(n, 'rir', v)}
                    />
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
                    leer={leerDescanso}
                    entero
                    onCambiar={(v) => cambiarElObjetivo(n, 'restSeconds', v)}
                  />
                </td>
                <td data-etiqueta={C.nota} className="series-del-editor__nota">
                  {/* La nota por serie ya viajaba en el contrato y se conservaba al guardar, pero no se podía escribir (DL-105). */}
                  <input
                    id={`${id}-serie-${n}-nota`}
                    className="celda-de-serie"
                    aria-label={`${rotulos[n]!.largo}: ${COPY_ENTRENAMIENTO.notaDeSerie}`}
                    value={s.note ?? ''}
                    maxLength={200}
                    onChange={(e) => cambiarLaSerie(n, (x) => ({ ...x, note: e.target.value || null }))}
                  />
                </td>
                {/* TB-48: cada serie se quita en su fila, también una del medio; las de abajo pasan a numerarse una menos. */}
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
            ))}
          </tbody>
        </table>
      </>
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
        {/* Una serie nueva copia las repeticiones de la anterior; sus objetivos propios no se copian: toma de lo general. */}
        <button type="button" id={`${id}-agregar-serie`} className="boton boton--secundario" data-agregar-serie onClick={() => onCambiar({ sets: [...p.sets, { repetitions: p.sets[p.sets.length - 1]?.repetitions ?? null }] })}>
          <Icono nombre="mas" tamano={18} />
          Agregar serie
        </button>
        {p.sets.length > 0 ? <p className="nota">{PL.atajo}</p> : null}
        {p.sets.length > 0 ? <p className="nota" data-ayuda-del-calentamiento>{COPY_TIPOS_DE_SERIE.ayudaDelEditor}</p> : null}
        {/* C8: cómo se lee cada valor; la celda lo dice sola («común», «propio» o «Sin indicar»). */}
        {p.sets.length > 0 ? <p className="nota" data-como-se-lee-cada-valor>{PL.comoSeLee}</p> : null}
      </div>
    </div>
  );
}

/** ENP-D16 (C4): la edición conjunta de series. */
const COPY_SELECCION = {
  seleccionar: 'Seleccionar series',
  ninguna: 'Elegí las series',
  todas: 'Elegir todas',
  ningunaDeNuevo: 'Ninguna',
  repeticiones: 'Repeticiones',
  escribirEn: (n: number) => (n === 1 ? 'Escribir en 1 serie' : `Escribir en ${n} series`),
  listo: 'Listo',
  repeticionesNoSeEntienden: 'No se entiende: va un número o un rango, como 8-12.',
} as const;

/** ENP-D14: los textos del criterio arriba de las series. */
const COPY_CRITERIO_ARRIBA = {
  titulo: 'Criterio, unidad y bases de las series',
  notasYParametros: 'Notas y parámetros',
} as const;

/**
 * ENP-D14 (C2 de Dirección) · El criterio arriba de las series: el criterio de intensidad con su objetivo (y la referencia
 * del % RM), la unidad de la carga y cómo se cuentan la carga y las repeticiones. Van antes de la tabla porque definen cómo
 * se lee cada serie, y a la vista: no se esconden a un clic.
 */
function CriterioDelEjercicio({ id, prescripcion: p, onCambiar }: { id: string; prescripcion: PrescripcionE; onCambiar: (c: Partial<PrescripcionE>) => void }) {
  const criterio = (p.intensity?.criterion as Criterio | undefined) ?? '';
  const unidad = unidadDe(p);
  // C7: lo que se quitó al cambiar de criterio, con «Deshacer», mientras siga el criterio elegido.
  const [cambio, setCambio] = useState<CambioDeCriterio<PrescripcionE['intensity']> | null>(null);
  const avisoDelCambio = cambio && sigueElCambio(p, cambio) ? cambio : null;
  return (
    <div className="criterio-del-ejercicio" role="group" aria-label={COPY_CRITERIO_ARRIBA.titulo} data-criterio-del-ejercicio>
        <div className="lo-general-del-editor__par">
          <div className="campo">
            <label htmlFor={`${id}-criterio`}>{COPY_ENTRENAMIENTO.intensidad}</label>
            <select
              id={`${id}-criterio`}
              value={criterio}
              onChange={(e) => {
                const c = e.target.value as Criterio | '';
                // Elegir el criterio no trae un objetivo: el número lo escribe el profesional (09v10:339-340). Sin el
                // criterio RIR, el RIR de cada serie no tiene sentido: se quita, porque sería un segundo criterio
                // (REG-06-128). C7: lo que se quita se dice, con «Deshacer»; sin nada que perder, no se dice nada.
                setCambio(cambioDeCriterio(p, c));
                onCambiar(conElCriterio(p, c));
              }}
            >
              <option value="">{COPY_ENTRENAMIENTO.sinCriterio}</option>
              {(Object.keys(ETIQUETA_DE_CRITERIO) as Criterio[]).map((c) => (
                <option key={c} value={c}>
                  {ETIQUETA_DE_CRITERIO[c]}
                </option>
              ))}
            </select>
          </div>
          {p.intensity ? (
            <CampoInterpretado
              id={`${id}-objetivo`}
              etiqueta={`${COPY_ENTRENAMIENTO.objetivoDeIntensidad} (${ETIQUETA_DE_CRITERIO[criterio as Criterio]})`}
              // Con un criterio elegido, el objetivo no es opcional: vacío no es cero.
              ayuda={criterio === 'RIR' ? 'Necesario, de 0 a 10' : 'Necesario, hasta 100'}
              inputMode="decimal"
              valor={p.intensity.target.value}
              clave={String(p.intensity.target.value)}
              formatear={escribirNumero}
              interpretar={(t) => leerValor(t) ?? Number.NaN}
              mismo={mismoNumero}
              noSeEntiende="No se entiende: va un número."
              onCambiar={(v) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, value: v } } })}
            />
          ) : null}
        </div>
        {/* C7: qué se quitó al cambiar de criterio, con «Deshacer», que devuelve el criterio y los valores de antes. */}
        {avisoDelCambio ? (
          <p className="nota criterio-del-ejercicio__aviso" role="status" data-cambio-de-criterio>
            <span>{avisoDelCambio.texto}</span>
            <button
              type="button"
              className="boton boton--enlace"
              data-deshacer-el-criterio
              onClick={() => {
                onCambiar(deshacerElCambioDeCriterio(p, avisoDelCambio));
                setCambio(null);
              }}
            >
              <Icono nombre="deshacer" tamano={15} />
              {COPY_CAMBIO_DE_CRITERIO.deshacer}
            </button>
          </p>
        ) : null}
        {p.intensity && criterio === 'PERCENT_RM' ? (
          <Campo
            id={`${id}-referencia`}
            etiqueta={`${COPY_ENTRENAMIENTO.referenciaDeRm} (opcional)`}
            ayuda="Por ejemplo: 1RM estimado por el método que usaste. En los ejercicios de la lista de Epley v1, «Calcular la carga desde la estimación…» la escribe con el método y la fecha."
            value={p.intensity.target.reference?.description ?? ''}
            onChange={(e) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, reference: e.target.value ? { description: e.target.value } : null } } })}
            maxLength={500}
          />
        ) : null}
        <div className="lo-general-del-editor__par">
          <div className="lo-general-del-editor__carga">
            <div className="campo">
              <label htmlFor={`${id}-unidad`}>{PL.unidadDeLaCarga}</label>
              {/* Una sola unidad por prescripción: cambiarla cambia también la de las series, sin convertir números. */}
              <select
                id={`${id}-unidad`}
                value={unidad}
                onChange={(e) => {
                  const u = e.target.value as 'kg' | 'lb';
                  onCambiar({
                    ...(p.suggestedLoad ? { suggestedLoad: { ...p.suggestedLoad, unit: u } } : {}),
                    sets: p.sets.map((x) => (x.suggestedLoad ? { ...x, suggestedLoad: { ...x.suggestedLoad, unit: u } } : x)),
                  });
                }}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>
        {/* ENP-D14: las bases, a la vista y en el mismo renglón: cambian cómo se leen la carga y las repeticiones de abajo. */}
          <div className="criterio-del-ejercicio__bases" data-bases>
            <div className="campo">
              <label htmlFor={`${id}-base-carga`}>Cómo se cuenta la carga</label>
              <select
                id={`${id}-base-carga`}
                value={p.loadBasis ?? ''}
                onChange={(e) => {
                  const b = BaseDeCargaSchema.safeParse(e.target.value);
                  onCambiar({ loadBasis: b.success ? b.data : null });
                }}
              >
                <option value="">Sin indicar</option>
                {BaseDeCargaSchema.options.map((b) => (
                  <option key={b} value={b}>
                    {ETIQUETA_DE_BASE_DE_CARGA[b]}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor={`${id}-base-reps`}>Qué cuentan las repeticiones</label>
              <select
                id={`${id}-base-reps`}
                value={p.repetitionBasis ?? ''}
                onChange={(e) => {
                  const b = BaseDeRepeticionesSchema.safeParse(e.target.value);
                  onCambiar({ repetitionBasis: b.success ? b.data : null });
                }}
              >
                <option value="">Sin indicar</option>
                {BaseDeRepeticionesSchema.options.map((b) => (
                  <option key={b} value={b}>
                    {ETIQUETA_DE_BASE_DE_REPETICIONES[b]}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
            <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ professionalParameters: parametros.filter((_, m) => m !== n) })}>
              Quitar parámetro
            </button>
          </div>
        ))}
        {/* DL-122: el descanso tiene su campo propio. Un parámetro «Descanso» que ya existía se conserva tal cual, sin
            reinterpretarlo: ya no se ofrece el atajo que lo creaba. */}
        <button type="button" className="boton boton--enlace" data-agregar-parametro onClick={() => onCambiar({ professionalParameters: [...parametros, { label: '', value: '', unit: null }] })}>
          <Icono nombre="mas" tamano={18} />
          Agregar parámetro
        </button>
      </div>
    </div>
  );
}
