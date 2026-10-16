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
  cantidadDeSeries,
  celdaDeObjetivoDelEditor,
  ejercicioPlegadoDelEditor,
  esLoQueTieneLaCelda,
  leerDescanso,
  leerNumero,
  objetivoElegidoEnLaCelda,
  objetivoEscritoEnLaCelda,
  textoDeSegundos,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type ImagenDeEjercicio,
  type OpcionDeLaCelda,
} from '@be/domain';
import { useEffect, useId, useState, type ComponentProps } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { numeroEnCampo } from '../../../../lib/formato';
import { ImagenGuardadaDeEjercicio } from '../../exercises/imagen-de-ejercicio';
import { useEntrenamiento } from './entrenamiento';

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
// Vacío: sin repeticiones fijadas. Un número o un rango «8-12». Otra cosa no se guarda como si no hubiera nada.
const leerReps = (s: string): Repeticiones => {
  if (s.trim() === '') return null;
  const rango = s.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (rango) return { min: Number(rango[1]), max: Number(rango[2]) };
  const n = Number(s.trim());
  return { value: Number.isInteger(n) && n > 0 ? n : Number.NaN };
};
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
}: {
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
}) {
  const { token, sesionPerdida } = useEntrenamiento();
  const propio = useId();
  const plegado = ejercicioPlegadoDelEditor(p, problemas);
  return (
    <section className="comida-del-plan ejercicio-del-editor" data-ejercicio={posicion + 1} data-abierta={abierto ? '' : undefined}>
      <div className="comida-del-editor__cabecera">
        <h3 className="comida-del-plan__titulo">
          <button type="button" id={`abrir-ejercicio-${id}`} className="comida-del-plan__boton" aria-expanded={abierto} aria-controls={`${propio}-cuerpo`} onClick={alAlternar}>
            <Icono nombre="entrenamiento" tamano={20} />
            <span className="comida-del-plan__textos">
              <span className="comida-del-plan__nombre">{nombre}</span>
              {/* Plegado dice lo que piden sus series; abierto, cuántas son: el detalle está abajo. */}
              <span className="comida-del-plan__cuenta" data-resumen>
                <EnPartes texto={abierto ? cantidadDeSeries(p.sets.length) : plegado.resumen} />
              </span>
              {plegado.avisos.length > 0 ? (
                <span className="comida-del-editor__avisos" data-avisos>
                  <Icono nombre="aviso" tamano={18} />
                  <EnPartes texto={plegado.avisos.join(' · ')} />
                </span>
              ) : null}
            </span>
            <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
          </button>
        </h3>
        {abierto ? (
          <div className="comida-del-editor__acciones">
            <MenuDeAcciones rotulo={`más acciones de ${nombre}`} texto="Más" acciones={[{ clave: 'quitar', texto: `Quitar ${nombre}`, alElegir: onQuitar }]} />
          </div>
        ) : null}
      </div>
      <div id={`${propio}-cuerpo`} className="comida-del-plan__cuerpo ejercicio-del-editor__cuerpo" hidden={!abierto}>
        {abierto ? (
          <>
            <SeriesDelEjercicio id={id} nombre={nombre} prescripcion={p} onCambiar={onCambiar} />
            <div className="ejercicio-del-editor__general">
              <p className="ejercicio-del-plan__subtitulo">
                {C.loGeneral} <span className="nota">Opcional</span>
              </p>
              {imagen ? <ImagenGuardadaDeEjercicio token={token} medioId={imagen.mediaId} nombre={nombre} textoAlternativo={imagen.altText} sesionPerdida={sesionPerdida} chica /> : null}
              <LoGeneralDelEjercicio id={id} prescripcion={p} onCambiar={onCambiar} />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

const OPCION_DE_LA_CELDA: Readonly<Record<OpcionDeLaCelda, string>> = { 'sin-objetivo': 'Sin objetivo en esta serie', 'de-lo-general': 'Tomar de lo general' };

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
  const { texto, alEscribir, alSalir } = useTextoInterpretado<number | null | undefined, number | undefined>(valor, {
    clave: valor === undefined ? 'nada' : String(valor),
    formatear: (v) => (typeof v === 'number' && !Number.isNaN(v) ? escribir(v) : ''),
    interpretar: (t) => objetivoEscritoEnLaCelda(t, leer),
    mismo: esLoQueTieneLaCelda,
    alCambiar: onCambiar,
    normalizarAlSalir: true,
  });
  return (
    <div className="celda-de-objetivo" data-estado={celda.estado}>
      <input
        id={id}
        aria-label={rotulo}
        aria-describedby={`${id}-estado`}
        aria-invalid={celda.estado === 'no-se-entiende' || undefined}
        inputMode={entero ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={texto}
        placeholder={celda.sinValor}
        data-en-gris={celda.enGris ? '' : undefined}
        // «Sin objetivo» es un texto: se acomoda distinto que un número.
        data-texto={texto === '' && celda.sinValor === COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo ? '' : undefined}
        onChange={(e) => alEscribir(e.target.value)}
        onBlur={alSalir}
      />
      <span id={`${id}-estado`} className="visualmente-oculto">
        {celda.descripcion}
      </span>
      <MenuDeAcciones rotulo={`Opciones para ${queEs}`} icono="abajo" acciones={celda.opciones.map((o) => ({ clave: o, texto: OPCION_DE_LA_CELDA[o], alElegir: () => onCambiar(objetivoElegidoEnLaCelda(o)) }))} />
    </div>
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
function SeriesDelEjercicio({ id, nombre, prescripcion: p, onCambiar }: { id: string; nombre: string; prescripcion: PrescripcionE; onCambiar: (c: Partial<PrescripcionE>) => void }) {
  const conRir = (p.intensity?.criterion as Criterio | undefined) === 'RIR';
  const unidad = unidadDe(p);
  const valido = (n: number | null | undefined): n is number => typeof n === 'number' && !Number.isNaN(n);
  // Lo que toma de lo general una serie que no tiene el suyo. Si lo general está mal escrito, todavía no hay qué tomar.
  const cargaGeneral = p.suggestedLoad && valido(p.suggestedLoad.value) ? numeroEnCampo(p.suggestedLoad.value) : null;
  const rirGeneral = conRir && p.intensity && valido(p.intensity.target.value) ? numeroEnCampo(p.intensity.target.value) : null;
  const descansoGeneral = valido(p.restSeconds) ? textoDeSegundos(p.restSeconds) : null;
  const S = COPY_ENTRENAMIENTO.serie;
  const cambiarLaSerie = (n: number, f: (s: Serie) => Serie) => onCambiar({ sets: p.sets.map((x, m) => (m === n ? f(x) : x)) });
  /** Cambia un objetivo de una serie con sus tres estados: `undefined` quita la clave (la serie toma de lo general). */
  const cambiarElObjetivo = (n: number, campo: 'rir' | 'suggestedLoad' | 'restSeconds', valor: unknown) =>
    cambiarLaSerie(n, (x) => {
      const copia: Record<string, unknown> = { ...x };
      if (valor === undefined) delete copia[campo];
      else copia[campo] = valor;
      return copia as Serie;
    });
  return (
    <div className="ejercicio-del-editor__series">
      {p.sets.length === 0 ? (
        <p className="nota">{C.sinSeries}</p>
      ) : (
        <table className="tabla series-del-editor">
          <caption className="visualmente-oculto">Las series de {nombre}, con el objetivo que recibe tu asesorado en cada una</caption>
          <thead>
            <tr>
              <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</th>
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
              <th scope="col">{C.nota}</th>
            </tr>
          </thead>
          <tbody>
            {p.sets.map((s, n) => (
              <tr key={n} data-serie={n + 1}>
                <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
                  {n + 1}
                </th>
                <td data-etiqueta="Repeticiones">
                  <CeldaDeRepeticiones id={`${id}-serie-${n}`} rotulo={`${S} ${n + 1}: repeticiones (un número o un rango, 8-12)`} valor={s.repetitions} onCambiar={(r) => cambiarLaSerie(n, (x) => ({ ...x, repetitions: r }))} />
                </td>
                <td data-etiqueta={`${C.cargaSugerida} (${unidad})`}>
                  <CeldaDeObjetivo
                    id={`${id}-serie-${n}-carga`}
                    rotulo={`${S} ${n + 1}: carga sugerida (${unidad})`}
                    queEs={`la carga sugerida de la serie ${n + 1}`}
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
                      rotulo={`${S} ${n + 1}: RIR objetivo (0 a 10)`}
                      queEs={`el RIR de la serie ${n + 1}`}
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
                    rotulo={`${S} ${n + 1}: descanso (como 02:30, o en segundos)`}
                    queEs={`el descanso de la serie ${n + 1}`}
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
                    aria-label={`${S} ${n + 1}: ${COPY_ENTRENAMIENTO.notaDeSerie}`}
                    value={s.note ?? ''}
                    maxLength={200}
                    onChange={(e) => cambiarLaSerie(n, (x) => ({ ...x, note: e.target.value || null }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="ejercicio-del-editor__pie-de-series">
        {/* Una serie nueva copia las repeticiones de la anterior; sus objetivos propios no se copian: toma de lo general. */}
        <button type="button" className="boton boton--secundario" data-agregar-serie onClick={() => onCambiar({ sets: [...p.sets, { repetitions: p.sets[p.sets.length - 1]?.repetitions ?? null }] })}>
          <Icono nombre="mas" tamano={18} />
          Agregar serie
        </button>
        {p.sets.length > 0 ? (
          <>
            <p className="nota">En gris, lo que la serie toma de lo general. Escribí un valor para que tenga el suyo, o elegí «{COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo}» con la flecha de la celda. Es lo que recibe tu asesorado.</p>
            <button type="button" className="boton boton--enlace" onClick={() => onCambiar({ sets: p.sets.slice(0, -1) })}>
              Quitar la última serie
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Lo general del ejercicio: el criterio de intensidad con su objetivo, la carga sugerida con su unidad, el descanso
 * recomendado y las notas; a un clic, cómo se cuentan la carga y las repeticiones; y los parámetros.
 */
function LoGeneralDelEjercicio({ id, prescripcion: p, onCambiar }: { id: string; prescripcion: PrescripcionE; onCambiar: (c: Partial<PrescripcionE>) => void }) {
  const criterio = (p.intensity?.criterion as Criterio | undefined) ?? '';
  const parametros = p.professionalParameters ?? [];
  const unidad = unidadDe(p);
  return (
    <div className="lo-general-del-editor">
      <p className="nota">La carga y el descanso son los que toman las series que no tienen uno propio.</p>
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
              // (REG-06-128).
              onCambiar({
                intensity: c ? { criterion: c, target: { value: Number.NaN, reference: null } } : null,
                ...(c === 'RIR' ? {} : { sets: p.sets.map(({ rir: _sinRir, ...x }) => x) }),
              });
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
      {p.intensity && criterio === 'PERCENT_RM' ? (
        <Campo
          id={`${id}-referencia`}
          etiqueta={`${COPY_ENTRENAMIENTO.referenciaDeRm} (opcional)`}
          ayuda="Por ejemplo: 1RM estimado por el método que usaste. BE no estima la repetición máxima."
          value={p.intensity.target.reference?.description ?? ''}
          onChange={(e) => onCambiar({ intensity: { ...p.intensity!, target: { ...p.intensity!.target, reference: e.target.value ? { description: e.target.value } : null } } })}
          maxLength={500}
        />
      ) : null}
      <div className="lo-general-del-editor__par">
        <div className="lo-general-del-editor__carga">
          <CampoInterpretado
            id={`${id}-carga`}
            etiqueta={COPY_ENTRENAMIENTO.cargaSugerida}
            inputMode="decimal"
            valor={p.suggestedLoad ? p.suggestedLoad.value : null}
            clave={String(p.suggestedLoad ? p.suggestedLoad.value : null)}
            formatear={escribirNumero}
            interpretar={leerValor}
            mismo={mismoNumero}
            noSeEntiende="No se entiende: va un número."
            onCambiar={(v) => onCambiar({ suggestedLoad: v === null ? null : { value: v, unit: unidad } })}
          />
          <div className="campo">
            <label htmlFor={`${id}-unidad`}>Unidad</label>
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
        <CampoInterpretado
          id={`${id}-descanso`}
          etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado}
          ayuda="02:30, o en segundos"
          valor={p.restSeconds ?? null}
          clave={String(p.restSeconds ?? null)}
          formatear={escribirElDescanso}
          interpretar={leerElDescanso}
          mismo={mismoNumero}
          normalizarAlSalir
          noSeEntiende="No se entiende: va como 02:30, o en segundos enteros."
          onCambiar={(v) => onCambiar({ restSeconds: v })}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-nota`}>{COPY_ENTRENAMIENTO.notas}</label>
        <textarea id={`${id}-nota`} rows={2} value={p.note ?? ''} onChange={(e) => onCambiar({ note: e.target.value || null })} maxLength={1000} />
      </div>
      {/* A un clic. Si ya hay una base elegida, se abre solo: no se esconde un dato cargado. */}
      <details className="a-un-clic" open={!!p.loadBasis || !!p.repetitionBasis || undefined} data-bases>
        <summary>Cómo se cuentan la carga y las repeticiones</summary>
        <div className="lo-general-del-editor__par">
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
      </details>
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
