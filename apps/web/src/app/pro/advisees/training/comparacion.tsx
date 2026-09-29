'use client';

/**
 * Planificado y registrado (amplía la «comparación legible» de DL-105). Dos vistas con la misma lógica del dominio
 * (`comparacion-de-entrenamiento.ts`), que alimenta el gráfico y la tabla: no pueden decir cosas distintas.
 * - **Por serie**, dentro de una ejecución: barras agrupadas por el número real de la serie, lo planificado rayado y lo
 *   registrado lleno. Un rango se dibuja como franja de su mínimo a su máximo, no como un número.
 * - **Evolución de un ejercicio** en las ejecuciones del período: un punto por sesión registrada, para la serie que se
 *   elige. Las líneas se cortan donde no hay dato; lo planificado, además, cuando cambia la prescripción.
 *
 * Visualización accesible (B10-10 §11): título, período, unidad y leyenda; tabla equivalente siempre visible; estados
 * con rayado, forma y texto además del color; ningún dato solo al pasar el puntero. Cada serie o punto se elige con
 * clic, toque o teclado (flechas sobre el gráfico, o los botones y la tabla), y sus valores exactos quedan a la vista
 * con su fuente: el registro original o la corrección vigente, con el original a mano.
 *
 * No hay porcentajes, puntajes ni juicios: la diferencia es un dato («−1»), no una calificación (REG-06-125).
 */
import {
  COPY_COMPARACION,
  COPY_ENTRENAMIENTO,
  cantidad,
  claveDeMedida,
  compararEjecucion,
  diferenciaEnPalabras,
  etiquetaDeMedida,
  evolucion,
  intensidadPlanificada,
  medidasDeLaEvolucion,
  medidasDisponibles,
  numero,
  numerosDeSerie,
  observacionesDelEjercicio,
  rotuloCorto,
  seriesParaGraficar,
  textoPlanificado,
  textoRegistrado,
  unidadDeMedida,
  type ComparacionDeEjercicio,
  type Diferencia,
  type EjecucionDeEntrenamiento,
  type IdentidadDeVersiones,
  type FilaDeSerie,
  type Medida,
  type ObservacionDeEvolucion,
  type PuntoDeEvolucion,
  type RolDeLaObservacion,
  type SerieEjecutadaApi,
  type SerieParaGraficar,
  type ValorPlanificado,
  type ValorRegistrado,
} from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Aviso } from '../../../../components/formulario';
import { dia, diaCorto, fecha } from '../../../../lib/formato';

export interface Capas {
  readonly planificado: boolean;
  readonly registrado: boolean;
}

const AMBAS: Capas = { planificado: true, registrado: true };
const ALTO = 300;
/** El eje vertical empieza en cero (una barra que no empieza en cero exagera) y deja lugar arriba para el rótulo del valor. */
const DOMINIO: [number, (max: number) => number] = [0, (max) => Math.max(1, Math.ceil(max * 1.15))];

// ─── Controles compartidos ──────────────────────────────────────────────────────────────────────

/** Las dos capas se prenden y apagan por separado. Las casillas son, a la vez, la leyenda de color y forma. */
function ControlDeCapas({ capas, onCambio, lineas = false }: { capas: Capas; onCambio: (c: Capas) => void; lineas?: boolean }) {
  return (
    <fieldset className="capas">
      <legend>{COPY_COMPARACION.capas}</legend>
      <label className="capa">
        <input type="checkbox" checked={capas.planificado} onChange={(e) => onCambio({ ...capas, planificado: e.target.checked })} />
        <span className="muestra muestra--planificado" aria-hidden="true" />
        {COPY_COMPARACION.capaPlanificado}
        {lineas ? ' (línea discontinua, cuadrados; franja si es un rango)' : ' (rayado; franja si es un rango)'}
      </label>
      <label className="capa">
        <input type="checkbox" checked={capas.registrado} onChange={(e) => onCambio({ ...capas, registrado: e.target.checked })} />
        <span className="muestra muestra--registrado" aria-hidden="true" />
        {COPY_COMPARACION.capaRegistrado}
        {lineas ? ' (línea continua, círculos)' : ' (lleno)'}
      </label>
    </fieldset>
  );
}

function SelectorDeMedida({ id, medidas, medida, onCambio }: { id: string; medidas: readonly Medida[]; medida: Medida; onCambio: (clave: string) => void }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{COPY_COMPARACION.medida}</label>
      <select id={id} value={claveDeMedida(medida)} onChange={(e) => onCambio(e.target.value)}>
        {medidas.map((m) => (
          <option key={claveDeMedida(m)} value={claveDeMedida(m)}>
            {etiquetaDeMedida(m)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** El eje vertical con su unidad, sin repetirla: «Repeticiones (reps)», «Carga (kg)», «RIR». */
const ejeVertical = (m: Medida): string => (m.variable === 'repeticiones' ? `${etiquetaDeMedida(m)} (${unidadDeMedida(m)})` : etiquetaDeMedida(m));

/** La medida elegida, si sigue disponible; si no, la primera (siempre hay repeticiones). */
function medidaElegida(medidas: readonly Medida[], clave: string): Medida {
  return medidas.find((m) => claveDeMedida(m) === clave) ?? (medidas[0] as Medida);
}

/**
 * ¿Hay un puntero que pasa por encima (mouse)? El recuadro que sigue al puntero es una ayuda para ese caso. En una
 * pantalla táctil quedaría fijo encima del gráfico, y el panel de valores ya dice lo mismo: ahí no se muestra.
 */
const CONSULTA_PUNTERO = '(hover: hover) and (pointer: fine)';
function useConPuntero(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CONSULTA_PUNTERO);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CONSULTA_PUNTERO).matches,
    () => false,
  );
}

/**
 * El ancho mínimo de cada grupo del eje horizontal (una serie o una sesión), para que números, estados y valores no se
 * superpongan con muchas series o rótulos largos («−12,5 kg sug.»). Se estima por la cantidad de caracteres, con margen:
 * el recorrido lo mide en el navegador. Si el gráfico queda más ancho que su marco, el marco se desplaza por dentro y la
 * página no.
 */
function anchoPorGrupo(rotulos: readonly string[], valoresSobreBarras: readonly string[] = []): number {
  const texto = Math.max(0, ...rotulos.map((t) => t.length)) * 7.2 + 20;
  // Dos barras por grupo, cada una con su valor encima; las barras ocupan cerca del 80 % del grupo.
  const barras = valoresSobreBarras.length > 0 ? (2 * (Math.max(0, ...valoresSobreBarras.map((t) => t.length)) * 7.6 + 8)) / 0.8 : 0;
  return Math.ceil(Math.min(140, Math.max(64, texto, barras)));
}
const MARGEN_DEL_EJE = 70;

/**
 * El estado debajo del eje, en una o dos líneas: uno largo con espacios se parte en el último espacio («−12,5 kg» y
 * «sug.», «sin» e «identificar»), así cada grupo necesita menos ancho sin achicar la letra.
 */
function lineasDelRotulo(rotulo: string): string[] {
  const corte = rotulo.lastIndexOf(' ');
  return rotulo.length <= 10 || corte < 1 ? [rotulo] : [rotulo.slice(0, corte), rotulo.slice(corte + 1)];
}
const ALTO_DEL_EJE = 66;

/** El rótulo de un grupo del eje horizontal: la serie o la fecha, y debajo su estado, en una o dos líneas. */
function RotuloDelEje({ x, y, primera, estado, onElegir }: { x: number | string; y: number | string; primera: string; estado: string; onElegir: () => void }) {
  return (
    <g transform={`translate(${x},${y})`} className="grafico__elegible" onClick={onElegir}>
      <text textAnchor="middle" dy={14} className="grafico__tick">
        {primera}
      </text>
      {lineasDelRotulo(estado).map((linea, k) => (
        <text key={k} textAnchor="middle" dy={30 + k * 16} className="grafico__tick grafico__tick--estado">
          {linea}
        </text>
      ))}
    </g>
  );
}

/**
 * Trae a la vista, dentro del marco que se desplaza, el grupo elegido: con las flechas el marco no se mueve solo, porque
 * las teclas se usan para elegir. Se ubica por el rótulo del eje de ese grupo y se centra si quedó afuera.
 */
function useTraerALaVista(marco: RefObject<HTMLDivElement | null>, elegido: number | null) {
  useEffect(() => {
    const el = marco.current;
    if (!el || elegido === null) return;
    const rotulo = [...el.querySelectorAll('svg g[transform]')].filter((g) => g.querySelector(':scope > text.grafico__tick'))[elegido];
    if (!rotulo) return;
    const r = rotulo.getBoundingClientRect();
    const m = el.getBoundingClientRect();
    if (r.left < m.left || r.right > m.right) el.scrollLeft += r.left + r.width / 2 - (m.left + m.width / 2);
  }, [marco, elegido]);
}

/** Si el gráfico es más ancho que su marco (hay series o sesiones fuera de la vista), para decirlo con texto. */
function useSeDesplaza(marco: RefObject<HTMLDivElement | null>): boolean {
  const [seDesplaza, setSeDesplaza] = useState(false);
  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const medir = () => setSeDesplaza(el.scrollWidth > el.clientWidth + 1);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    return () => observador.disconnect();
  }, [marco]);
  return seDesplaza;
}

/** Recorre una lista con el teclado: flechas, Inicio y Fin. Devuelve el índice nuevo, o `null` si la tecla no es suya. */
function indiceConTeclado(e: KeyboardEvent, actual: number | null, total: number): number | null {
  if (total === 0) return null;
  const desde = actual ?? -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return Math.min(desde + 1, total - 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return Math.max(desde - 1, 0);
  if (e.key === 'Home') return 0;
  if (e.key === 'End') return total - 1;
  return null;
}

/** Rayado para lo planificado y para las sesiones sin dato: el estado se ve sin depender del color (B10-10 §11). */
function Patrones({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-planificado`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="var(--superficie)" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--grafico-planificado)" strokeWidth="2.5" />
      </pattern>
      <pattern id={`${id}-hueco`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="var(--grafico-hueco)" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

// ─── Detalle y tabla ────────────────────────────────────────────────────────────────────────────

/** «60 kg × 10 reps · RIR 2 · esfuerzo percibido 7», con lo que no se registró dicho como tal. */
function serieCompleta(s: SerieEjecutadaApi): string {
  const partes = [
    `${s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada'} × ${s.completedRepetitions === null ? 'repeticiones no registradas' : `${numero(s.completedRepetitions)} ${COPY_ENTRENAMIENTO.reps.toLowerCase()}`}`,
    s.rir === null ? 'RIR no registrado' : `${COPY_ENTRENAMIENTO.rir} ${numero(s.rir)}`,
  ];
  if (s.perceivedExertion !== null) partes.push(`esfuerzo percibido ${numero(s.perceivedExertion)}`);
  return partes.join(' · ');
}

function textoDeLaFuente(c: ComparacionDeEjercicio): string {
  const f = c.fuente;
  if (f.tipo === 'no-resoluble') return COPY_COMPARACION.vistaNoResoluble;
  if (f.tipo === 'original') return `${COPY_COMPARACION.registroOriginal}, registrado el ${fecha(f.registradoEl)}`;
  const quien = f.rolDelAutor === 'PROFESSIONAL' ? COPY_ENTRENAMIENTO.corregidoPorElProfesional : 'Corregido por el asesorado';
  return `${COPY_COMPARACION.correccionVigente}: ${quien} (${f.autor}), el ${fecha(f.registradaEl)}. Motivo: ${f.motivo}`;
}

/** Qué se sabe de la versión registrada, cuando no es la prescripta (el contrato la informa como sustitución). */
const EJERCICIO_REGISTRADO: Readonly<Record<'mismo-ejercicio' | 'otro-ejercicio' | 'desconocida', string>> = {
  'mismo-ejercicio': 'otra versión del mismo ejercicio del catálogo',
  'otro-ejercicio': 'otro ejercicio',
  desconocida: 'otra versión del catálogo; no se puede saber si es el mismo ejercicio',
};

const ROL: Readonly<Record<RolDeLaObservacion, string | null>> = {
  'planificado-y-registrado': null,
  sustituido: 'Se registró otro ejercicio en lugar de este: lo registrado no es de este ejercicio.',
  'por-sustitucion': 'Este ejercicio se registró en lugar de otro: lo planificado era de otro ejercicio.',
  'registrado-sin-identidad': 'Se registró una versión del catálogo que las sesiones del período no permiten identificar: no se sabe si es este ejercicio, y no se compara.',
  'planificado-sin-identidad': 'Esta versión se registró en lugar de lo planificado, y las sesiones del período no permiten saber si es el mismo ejercicio: no se compara.',
};

/**
 * Los valores exactos de la serie o el punto elegidos, con su contexto: lo planificado de esa serie y de la
 * prescripción, lo registrado completo, la diferencia y la fuente, con el original si una corrección cambió la serie.
 */
function DetalleDeValores({
  titulo,
  c,
  fila,
  planificado,
  registrado,
  diferencia,
  medida,
  rol = 'planificado-y-registrado',
  children,
}: {
  titulo: string;
  c: ComparacionDeEjercicio;
  fila: FilaDeSerie | null;
  planificado: ValorPlanificado;
  registrado: ValorRegistrado;
  diferencia: Diferencia | null;
  medida: Medida;
  rol?: RolDeLaObservacion;
  children?: ReactNode;
}) {
  const nota = fila?.planificada.tipo === 'planificada' ? fila.planificada.nota : null;
  const intensidad = intensidadPlanificada(c.prescripcion);
  const serieRegistrada = fila?.registrada.tipo === 'registrada' ? fila.registrada.serie : null;
  return (
    <div className="detalle-de-valores">
      <h4>{titulo}</h4>
      {ROL[rol] ? <p className="nota">{ROL[rol]}</p> : null}
      <dl>
        <dt>
          {COPY_COMPARACION.capaPlanificado} · {etiquetaDeMedida(medida)}
        </dt>
        <dd>
          {textoPlanificado(planificado, medida)}
          {nota ? ` · ${nota}` : ''}
        </dd>
        <dt>{COPY_COMPARACION.capaRegistrado} · {etiquetaDeMedida(medida)}</dt>
        <dd>{textoRegistrado(registrado, medida)}</dd>
        <dt>{COPY_COMPARACION.diferencia}</dt>
        <dd>{diferencia ? diferenciaEnPalabras(diferencia, medida) : 'No hay dos valores comparables'}</dd>
        <dt>{COPY_COMPARACION.valoresExactos}</dt>
        <dd>{serieRegistrada ? serieCompleta(serieRegistrada) : '—'}</dd>
        <dt>Prescripción</dt>
        <dd>
          {[intensidad ?? COPY_ENTRENAMIENTO.sinCriterio, c.cargaSugerida ? `${COPY_ENTRENAMIENTO.cargaSugerida}: ${cantidad(c.cargaSugerida.value, c.cargaSugerida.unit)}` : null, c.nota ? `${COPY_ENTRENAMIENTO.notas}: ${c.nota}` : null]
            .filter(Boolean)
            .join(' · ')}
        </dd>
        {c.resumen ? (
          <>
            <dt>{COPY_ENTRENAMIENTO.resumenDelEjercicio}</dt>
            <dd>{c.resumen}</dd>
          </>
        ) : null}
        {c.realizado && c.identidad !== 'misma-version' && c.identidad !== 'sin-registro' ? (
          <>
            <dt>Ejercicio registrado</dt>
            <dd>
              {c.realizado.nombre}: {EJERCICIO_REGISTRADO[c.identidad]}
            </dd>
          </>
        ) : null}
        <dt>Registro</dt>
        <dd>{textoDeLaFuente(c)}</dd>
        {fila?.corregida ? (
          <>
            <dt>{COPY_COMPARACION.enElOriginal}</dt>
            <dd>{fila.enElOriginal ? serieCompleta(fila.enElOriginal) : COPY_COMPARACION.noEstabaEnElOriginal}</dd>
          </>
        ) : null}
      </dl>
      {children}
    </div>
  );
}

// ─── A · Por serie, dentro de una ejecución ─────────────────────────────────────────────────────

interface DatoDeSerie {
  readonly numero: number;
  readonly plan: [number, number] | null;
  readonly reg: number | null;
  readonly etiquetaPlan: string;
  readonly etiquetaReg: string;
  readonly rotulo: string;
}

const numeroCorto = (v: ValorPlanificado): string => (v.tipo === 'valor' ? numero(v.valor) : v.tipo === 'rango' ? `${numero(v.min)}-${numero(v.max)}` : '');

function datosPorSerie(series: readonly SerieParaGraficar[], medida: Medida): DatoDeSerie[] {
  return series.map((s) => ({
    numero: s.numero,
    plan: s.planificado.tipo === 'valor' ? [0, s.planificado.valor] : s.planificado.tipo === 'rango' ? [s.planificado.min, s.planificado.max] : null,
    reg: s.registrado.tipo === 'valor' ? s.registrado.valor : null,
    etiquetaPlan: numeroCorto(s.planificado),
    etiquetaReg: s.registrado.tipo === 'valor' ? numero(s.registrado.valor) : '',
    rotulo: rotuloCorto(s, medida),
  }));
}

/**
 * Una ejecución registrada, prescripción por prescripción: el profesional elige el ejercicio y la variable, y ve cada
 * serie planificada al lado de la registrada con el mismo número.
 */
export function ComparacionPorSerie({
  ejecucion,
  prescriptionId: inicial,
  identidad,
}: {
  ejecucion: EjecucionDeEntrenamiento;
  prescriptionId?: string;
  /** La identidad de las versiones de todo el período: la misma que usa la evolución, así las dos vistas coinciden. */
  identidad: IdentidadDeVersiones;
}) {
  const id = useId();
  const comparaciones = useMemo(() => compararEjecucion(ejecucion, identidad), [ejecucion, identidad]);
  const [prescriptionId, setPrescriptionId] = useState(inicial ?? comparaciones[0]?.prescriptionId ?? '');
  const [claveMedida, setClaveMedida] = useState('repeticiones');
  const [capas, setCapas] = useState<Capas>(AMBAS);
  const [elegida, setElegida] = useState<number | null>(null);
  const c = comparaciones.find((x) => x.prescriptionId === prescriptionId) ?? comparaciones[0];
  if (!c) return <p>{COPY_ENTRENAMIENTO.sinPrescripciones}</p>;
  const medidas = medidasDisponibles([c]);
  const medida = medidaElegida(medidas, claveMedida);
  const series = seriesParaGraficar(c, medida);
  const s = elegida !== null ? series[elegida] : undefined;
  const titulo = `${COPY_COMPARACION.porSerie}: ${c.prescripto.nombre}, ${dia(`${c.fecha}T12:00:00Z`)}`;

  return (
    <div className="grafico">
      <div className="grafico__controles">
        {comparaciones.length > 1 ? (
          <div className="campo">
            <label htmlFor={`${id}-ejercicio`}>{COPY_COMPARACION.ejercicio}</label>
            <select
              id={`${id}-ejercicio`}
              value={c.prescriptionId}
              onChange={(e) => {
                setPrescriptionId(e.target.value);
                setElegida(null);
              }}
            >
              {comparaciones.map((x) => (
                <option key={x.prescriptionId} value={x.prescriptionId}>
                  {opcionDeEjercicio(x)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <SelectorDeMedida id={`${id}-medida`} medidas={medidas} medida={medida} onCambio={setClaveMedida} />
        <ControlDeCapas capas={capas} onCambio={setCapas} />
      </div>
      <AvisosDeLaComparacion c={c} medida={medida} />
      {series.length === 0 ? (
        <p>{COPY_COMPARACION.sinSeries}</p>
      ) : (
        <>
          <GraficoPorSerie id={id} titulo={titulo} series={series} medida={medida} capas={capas} elegida={elegida} onElegir={setElegida} />
          <ul className="selector-de-series" aria-label="Elegir una serie para ver sus valores">
            {series.map((x, i) => (
              <li key={x.numero}>
                <button type="button" className="chip" aria-pressed={elegida === i} onClick={() => setElegida(elegida === i ? null : i)}>
                  {COPY_ENTRENAMIENTO.serie} {numero(x.numero)}
                </button>
              </li>
            ))}
          </ul>
          <div aria-live="polite">
            {s ? (
              <DetalleDeValores
                titulo={`${COPY_ENTRENAMIENTO.serie} ${numero(s.numero)}`}
                c={c}
                fila={s.fila}
                planificado={s.planificado}
                registrado={s.registrado}
                diferencia={s.diferencia}
                medida={medida}
              />
            ) : null}
          </div>
          <TablaPorSerie c={c} series={series} medida={medida} />
        </>
      )}
    </div>
  );
}

/** Cómo se ofrece una prescripción para elegir: con lo que se sabe de lo registrado, sin afirmar de más. */
function opcionDeEjercicio(x: ComparacionDeEjercicio): string {
  if (!x.realizado || x.identidad === 'misma-version' || x.identidad === 'sin-registro') return x.prescripto.nombre;
  if (x.identidad === 'mismo-ejercicio') return `${x.prescripto.nombre} (otra versión: ${x.realizado.nombre})`;
  return `${x.prescripto.nombre} (se registró ${x.realizado.nombre})`;
}

/** Qué se dice de una sustitución, según lo que se sabe de la identidad (el mismo criterio que la evolución). */
const AVISO_DE_IDENTIDAD: Readonly<Partial<Record<ComparacionDeEjercicio['identidad'], string>>> = {
  'mismo-ejercicio': COPY_COMPARACION.otraVersionDelMismo,
  'otro-ejercicio': COPY_COMPARACION.sustitucion,
  desconocida: COPY_COMPARACION.identidadSinResolver,
};

/** Lo que el gráfico no puede decir solo: sustitución, resumen, vista no resoluble y cómo se lee lo planificado. */
function AvisosDeLaComparacion({ c, medida }: { c: ComparacionDeEjercicio; medida: Medida }) {
  const notas: string[] = [];
  if (medida.variable === 'carga' && c.cargaSugerida) notas.push(COPY_COMPARACION.sugeridaNoEsObligacion);
  if (medida.variable === 'carga' && c.porcentajeRm) notas.push(COPY_COMPARACION.rmNoSeConvierte);
  if (medida.variable === 'rir' && c.rirObjetivo !== null) notas.push(COPY_COMPARACION.rirDeLaPrescripcion);
  return (
    <>
      {c.fuente.tipo === 'no-resoluble' ? (
        <Aviso tipo="info">
          <p>{COPY_COMPARACION.vistaNoResoluble}</p>
        </Aviso>
      ) : null}
      {c.realizado && AVISO_DE_IDENTIDAD[c.identidad] ? (
        <Aviso tipo="info">
          <p>
            {COPY_ENTRENAMIENTO.planificado}: {c.prescripto.nombre} · {COPY_ENTRENAMIENTO.ejecutado}: {c.realizado.nombre}. {AVISO_DE_IDENTIDAD[c.identidad]}
          </p>
        </Aviso>
      ) : null}
      {c.resumen ? (
        <p className="nota">
          {COPY_ENTRENAMIENTO.resumenDelEjercicio}: {c.resumen}
        </p>
      ) : null}
      <p className="nota">
        {COPY_COMPARACION.ausenciaNoEsCero} {COPY_COMPARACION.sinDeclaracionPorSerie} {notas.join(' ')}
      </p>
    </>
  );
}

function GraficoPorSerie({
  id,
  titulo,
  series,
  medida,
  capas,
  elegida,
  onElegir,
}: {
  id: string;
  titulo: string;
  series: readonly SerieParaGraficar[];
  medida: Medida;
  capas: Capas;
  elegida: number | null;
  onElegir: (i: number | null) => void;
}) {
  const conPuntero = useConPuntero();
  const marco = useRef<HTMLDivElement>(null);
  useTraerALaVista(marco, elegida);
  const seDesplaza = useSeDesplaza(marco);
  const datos = datosPorSerie(series, medida);
  const ancho = anchoPorGrupo(
    datos.flatMap((d) => [`${COPY_ENTRENAMIENTO.serie} ${numero(d.numero)}`, ...lineasDelRotulo(d.rotulo)]),
    datos.flatMap((d) => [d.etiquetaPlan, d.etiquetaReg]),
  );
  const unidad = unidadDeMedida(medida);
  const resumen = series.map((s) => `${COPY_ENTRENAMIENTO.serie} ${numero(s.numero)}: ${COPY_COMPARACION.capaPlanificado.toLowerCase()} ${textoPlanificado(s.planificado, medida)}, ${COPY_COMPARACION.capaRegistrado.toLowerCase()} ${textoRegistrado(s.registrado, medida)}`).join('. ');
  return (
    <figure className="grafico__figura" aria-labelledby={`${id}-titulo`}>
      <figcaption id={`${id}-titulo`} className="nota">
        {titulo}. Eje vertical: {ejeVertical(medida)}. Eje horizontal: número real de la serie.
      </figcaption>
      {!capas.planificado && !capas.registrado ? <p>{COPY_COMPARACION.capaOculta}</p> : null}
      <div className="grafico__desplazable" ref={marco}>
        <div
          className="grafico__lienzo"
          style={{ minWidth: `${series.length * ancho + MARGEN_DEL_EJE}px` }}
          tabIndex={0}
          role="group"
          onClick={(e) => e.currentTarget.focus({ preventScroll: true })}
          aria-label={`${titulo}. ${resumen}. Usá las flechas para recorrer las series; los valores de la serie elegida aparecen debajo del gráfico.`}
          onKeyDown={(e) => {
            const i = indiceConTeclado(e, elegida, series.length);
            if (i === null) return;
            e.preventDefault();
            onElegir(i);
          }}
        >
          <ResponsiveContainer height={ALTO} initialDimension={{ width: 640, height: ALTO }}>
            <BarChart
              data={datos}
              margin={{ top: 24, right: 12, bottom: 8, left: 4 }}
              barGap={4}
              accessibilityLayer={false}
            >
              <Patrones id={id} />
              <CartesianGrid vertical={false} stroke="var(--borde)" />
              {elegida !== null && datos[elegida] ? <ReferenceArea x1={datos[elegida].numero} x2={datos[elegida].numero} fill="var(--fondo-suave)" stroke="var(--foco)" strokeWidth={2} /> : null}
              <XAxis
                dataKey="numero"
                interval={0}
                height={ALTO_DEL_EJE}
                tickLine={false}
                axisLine={{ stroke: 'var(--borde-control)' }}
                tick={({ x, y, index }: { x: number | string; y: number | string; index: number }) => (
                  <RotuloDelEje x={x} y={y} primera={`${COPY_ENTRENAMIENTO.serie} ${numero(datos[index]?.numero ?? 0)}`} estado={datos[index]?.rotulo ?? ''} onElegir={() => onElegir(index)} />
                )}
              />
              <YAxis
                domain={DOMINIO}
                allowDecimals={medida.variable !== 'repeticiones'}
                width={48}
                tick={{ fill: 'var(--tenue)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--borde-control)' }}
                label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: 12 }}
              />
              {conPuntero ? (
                <Tooltip cursor={{ fill: 'var(--fondo-suave)' }} content={({ active, label }) => (active ? <TooltipDeSerie serie={series.find((s) => s.numero === label)} medida={medida} /> : null)} />
              ) : null}
              {capas.planificado ? (
                <Bar dataKey="plan" name={COPY_COMPARACION.capaPlanificado} fill={`url(#${id}-planificado)`} stroke="var(--grafico-planificado)" strokeWidth={2} maxBarSize={48} minPointSize={3} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)}>
                  <LabelList dataKey="etiquetaPlan" position="top" className="grafico__valor" />
                </Bar>
              ) : null}
              {capas.registrado ? (
                <Bar dataKey="reg" name={COPY_COMPARACION.capaRegistrado} fill="var(--grafico-registrado)" maxBarSize={48} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)}>
                  <LabelList dataKey="etiquetaReg" position="top" className="grafico__valor" />
                </Bar>
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {seDesplaza ? <p className="nota">{COPY_COMPARACION.seDesplazaSeries}</p> : null}
    </figure>
  );
}

function TooltipDeSerie({ serie, medida }: { serie: SerieParaGraficar | undefined; medida: Medida }) {
  if (!serie) return null;
  return (
    <div className="grafico__tooltip">
      <p>
        <strong>
          {COPY_ENTRENAMIENTO.serie} {numero(serie.numero)}
        </strong>
      </p>
      <p>
        {COPY_COMPARACION.capaPlanificado}: {textoPlanificado(serie.planificado, medida)}
      </p>
      <p>
        {COPY_COMPARACION.capaRegistrado}: {textoRegistrado(serie.registrado, medida)}
      </p>
      {serie.diferencia ? <p>{diferenciaEnPalabras(serie.diferencia, medida)}</p> : null}
    </div>
  );
}

function TablaPorSerie({ c, series, medida }: { c: ComparacionDeEjercicio; series: readonly SerieParaGraficar[]; medida: Medida }) {
  return (
    <>
      <p className="nota">{COPY_COMPARACION.tablaMuestraAmbas}</p>
      <table className="tabla">
        <caption className="nota">
          {COPY_COMPARACION.tablaEquivalente}: {c.prescripto.nombre} · {etiquetaDeMedida(medida)}
        </caption>
        <thead>
          <tr>
            <th scope="col">{COPY_ENTRENAMIENTO.serie}</th>
            <th scope="col">{COPY_COMPARACION.capaPlanificado}</th>
            <th scope="col">{COPY_COMPARACION.capaRegistrado}</th>
            <th scope="col">{COPY_COMPARACION.diferencia}</th>
            <th scope="col">{COPY_COMPARACION.valoresExactos}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.numero}>
              <th scope="row">
                {COPY_ENTRENAMIENTO.serie} {numero(s.numero)}
              </th>
              <td data-etiqueta={COPY_COMPARACION.capaPlanificado}>
                {textoPlanificado(s.planificado, medida)}
                {s.fila.planificada.tipo === 'planificada' && s.fila.planificada.nota ? ` · ${s.fila.planificada.nota}` : ''}
              </td>
              <td data-etiqueta={COPY_COMPARACION.capaRegistrado}>
                {textoRegistrado(s.registrado, medida)}
                {s.fila.corregida ? (
                  <>
                    {' '}
                    <span className="insignia">{COPY_ENTRENAMIENTO.corregida}</span>
                  </>
                ) : null}
              </td>
              <td data-etiqueta={COPY_COMPARACION.diferencia}>{s.diferencia ? diferenciaEnPalabras(s.diferencia, medida) : '—'}</td>
              <td data-etiqueta={COPY_COMPARACION.valoresExactos}>
                {s.fila.registrada.tipo === 'registrada' ? serieCompleta(s.fila.registrada.serie) : '—'}
                {s.fila.corregida ? ` (${COPY_COMPARACION.enElOriginal.toLowerCase()}: ${s.fila.enElOriginal ? serieCompleta(s.fila.enElOriginal) : 'no estaba'})` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ─── B · Evolución de un ejercicio ──────────────────────────────────────────────────────────────

/** La primera línea del eje de la evolución: «17/9», y «17/9 (2)» si ese día hubo más de una sesión. */
function rotuloDelEje(p: PuntoDeEvolucion): string {
  const o = p.observacion;
  return `${diaCorto(o.comparacion.fecha)}${o.delDia.total > 1 ? ` (${o.delDia.orden})` : ''}`;
}

/** El rótulo de una observación: «8 sept 2026 · Sesión A», y «2 de 2 del día» si ese día hubo más de una. */
function rotuloDeObservacion(o: ObservacionDeEvolucion): string {
  const c = o.comparacion;
  return `${dia(`${c.fecha}T12:00:00Z`)} · ${c.sesion}${o.delDia.total > 1 ? ` · ${o.delDia.orden} de ${o.delDia.total} del día` : ''}`;
}

export function EvolucionDelEjercicio({
  ejecuciones,
  periodo,
  clave,
  nombre,
  versiones,
  onAbrir,
}: {
  ejecuciones: readonly EjecucionDeEntrenamiento[];
  /** Todas las ejecuciones del período: de ahí sale la identidad de cada versión, aunque `ejecuciones` venga filtrada. */
  periodo: readonly EjecucionDeEntrenamiento[];
  clave: string;
  nombre: string;
  /** planId → «activada el …», para decir a qué versión pertenece cada punto. */
  versiones: ReadonlyMap<string, string>;
  onAbrir: (executionId: string, prescriptionId: string) => void;
}) {
  const id = useId();
  const observaciones = useMemo(() => observacionesDelEjercicio(ejecuciones, clave, periodo), [ejecuciones, clave, periodo]);
  const numeros = numerosDeSerie(observaciones);
  const [claveMedida, setClaveMedida] = useState('repeticiones');
  const [numeroElegido, setNumeroElegido] = useState<number | null>(null);
  const [capas, setCapas] = useState<Capas>(AMBAS);
  const [elegido, setElegido] = useState<number | null>(null);

  if (observaciones.length === 0) {
    // Con un filtro de versión, el ejercicio puede estar en el período y no en la versión elegida: se dice eso.
    const enElPeriodo = ejecuciones.length < periodo.length && observacionesDelEjercicio(periodo, clave, periodo).length > 0;
    return <p>{enElPeriodo ? COPY_COMPARACION.sinObservacionesEnLaVersion : COPY_COMPARACION.sinObservaciones}</p>;
  }
  // De cada observación, solo el lado que es de este ejercicio (lo planificado, lo registrado o los dos).
  const medidas = medidasDeLaEvolucion(observaciones);
  const medida = medidaElegida(medidas, claveMedida);
  const numeroDeSerie = numeroElegido !== null && numeros.includes(numeroElegido) ? numeroElegido : (numeros[0] ?? 1);
  const puntos = evolucion(observaciones, medida, numeroDeSerie);
  const p = elegido !== null ? puntos[elegido] : undefined;
  const conValor = puntos.some((x) => x.planificado.tipo === 'valor' || x.planificado.tipo === 'rango' || x.registrado.tipo === 'valor');
  const titulo = `${COPY_COMPARACION.evolucion}: ${nombre}, ${COPY_ENTRENAMIENTO.serie.toLowerCase()} ${numero(numeroDeSerie)}`;

  return (
    <div className="grafico">
      <div className="grafico__controles">
        <SelectorDeMedida id={`${id}-medida`} medidas={medidas} medida={medida} onCambio={setClaveMedida} />
        <div className="campo">
          <label htmlFor={`${id}-serie`}>{COPY_COMPARACION.serieElegida}</label>
          <select
            id={`${id}-serie`}
            value={numeroDeSerie}
            onChange={(e) => {
              setNumeroElegido(Number(e.target.value));
              setElegido(null);
            }}
          >
            {numeros.map((n) => (
              <option key={n} value={n}>
                {COPY_ENTRENAMIENTO.serie} {numero(n)}
              </option>
            ))}
          </select>
        </div>
        <ControlDeCapas capas={capas} onCambio={setCapas} lineas />
      </div>
      <p className="nota">
        {COPY_COMPARACION.unidadDeObservacion} {COPY_COMPARACION.comparaConSuPrescripcion} {COPY_COMPARACION.lineasSeCortan}
      </p>
      <ul className="leyenda" aria-label="Leyenda">
        <li>
          <span className="muestra muestra--hueco" aria-hidden="true" /> Franja gris rayada: sesión sin valor registrado de esta serie (el motivo está en la tabla)
        </li>
        <li>Línea vertical discontinua: empieza otra versión del plan</li>
      </ul>
      {observaciones.length === 1 ? <p className="nota">Hay una sola sesión con este ejercicio en el período: todavía no hay evolución que mirar. Podés ampliar el período (hasta 92 días).</p> : null}
      {!conValor ? <p>No hay valores de {etiquetaDeMedida(medida).toLowerCase()} para esta serie en el período. La tabla dice por qué en cada sesión.</p> : null}
      {medida.variable === 'carga' ? <p className="nota">{`${COPY_COMPARACION.sugeridaNoEsObligacion} ${COPY_COMPARACION.rmNoSeConvierte}`}</p> : null}
      {medida.variable === 'rir' ? <p className="nota">{COPY_COMPARACION.rirDeLaPrescripcion}</p> : null}
      <GraficoDeEvolucion id={id} titulo={titulo} puntos={puntos} medida={medida} capas={capas} elegido={elegido} onElegir={setElegido} onAbrir={onAbrir} />
      <div aria-live="polite">
        {p ? (
          <DetalleDeValores
            titulo={rotuloDeObservacion(p.observacion)}
            c={p.observacion.comparacion}
            fila={p.fila}
            planificado={p.planificado}
            registrado={p.registrado}
            diferencia={p.diferencia}
            medida={medida}
            rol={p.observacion.rol}
          >
            <p className="nota">
              {`Ocurrió el ${fecha(p.observacion.comparacion.ocurrio)}`}
              {versiones.get(p.observacion.comparacion.planId) ? ` · Versión del plan activada el ${versiones.get(p.observacion.comparacion.planId)}` : ''}
            </p>
            <button type="button" className="boton boton--secundario" onClick={() => onAbrir(p.observacion.comparacion.executionId, p.observacion.comparacion.prescriptionId)}>
              {COPY_COMPARACION.verLaEjecucion}
            </button>
          </DetalleDeValores>
        ) : null}
      </div>
      <TablaDeEvolucion puntos={puntos} medida={medida} numeroDeSerie={numeroDeSerie} nombre={nombre} elegido={elegido} onElegir={setElegido} onAbrir={onAbrir} />
    </div>
  );
}

type DatoDeEvolucion = Record<string, number | string | [number, number] | null | boolean>;

function GraficoDeEvolucion({
  id,
  titulo,
  puntos,
  medida,
  capas,
  elegido,
  onElegir,
  onAbrir,
}: {
  id: string;
  titulo: string;
  puntos: readonly PuntoDeEvolucion[];
  medida: Medida;
  capas: Capas;
  elegido: number | null;
  onElegir: (i: number | null) => void;
  onAbrir: (executionId: string, prescriptionId: string) => void;
}) {
  const conPuntero = useConPuntero();
  const marco = useRef<HTMLDivElement>(null);
  // En una pantalla angosta el gráfico se desplaza de costado: el punto elegido (por ejemplo, con las flechas) se trae a
  // la vista si quedó afuera.
  useTraerALaVista(marco, elegido);
  const seDesplaza = useSeDesplaza(marco);
  const ancho = anchoPorGrupo(puntos.flatMap((p) => [rotuloDelEje(p), ...lineasDelRotulo(rotuloCorto(p, medida))]));
  const unidad = unidadDeMedida(medida);
  const tramosPlan = [...new Set(puntos.flatMap((p) => (p.tramoPlanificado === null ? [] : [p.tramoPlanificado])))];
  const tramosReg = [...new Set(puntos.flatMap((p) => (p.tramoRegistrado === null ? [] : [p.tramoRegistrado])))];
  const datos: DatoDeEvolucion[] = puntos.map((p) => {
    const d: DatoDeEvolucion = { indice: p.indice, rango: p.planificado.tipo === 'rango' ? [p.planificado.min, p.planificado.max] : null };
    if (p.tramoPlanificado !== null && p.planificado.tipo === 'valor') d[`p${p.tramoPlanificado}`] = p.planificado.valor;
    if (p.tramoRegistrado !== null && p.registrado.tipo === 'valor') d[`r${p.tramoRegistrado}`] = p.registrado.valor;
    return d;
  });
  // Dónde empieza otra versión del plan: la prescripción de cada punto es la de su versión.
  const cambiosDeVersion = puntos.filter((p, i) => i > 0 && puntos[i - 1]!.observacion.comparacion.planId !== p.observacion.comparacion.planId).map((p) => p.indice);
  const resumen = puntos
    .map((p) => `${rotuloDeObservacion(p.observacion)}: ${COPY_COMPARACION.capaPlanificado.toLowerCase()} ${textoPlanificado(p.planificado, medida)}, ${COPY_COMPARACION.capaRegistrado.toLowerCase()} ${textoRegistrado(p.registrado, medida)}`)
    .join('. ');
  return (
    <figure className="grafico__figura" aria-labelledby={`${id}-titulo`}>
      <figcaption id={`${id}-titulo`} className="nota">
        {titulo}. Eje vertical: {ejeVertical(medida)}. Eje horizontal: sesiones registradas, en orden.
      </figcaption>
      {!capas.planificado && !capas.registrado ? <p>{COPY_COMPARACION.capaOculta}</p> : null}
      <div className="grafico__desplazable" ref={marco}>
        <div
          className="grafico__lienzo"
          style={{ minWidth: `${puntos.length * ancho + MARGEN_DEL_EJE}px` }}
          tabIndex={0}
          role="group"
          onClick={(e) => e.currentTarget.focus({ preventScroll: true })}
          aria-label={`${titulo}. ${resumen}. Usá las flechas para recorrer las sesiones y Enter para abrir la ejecución elegida.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && elegido !== null && puntos[elegido]) {
              e.preventDefault();
              const c = puntos[elegido].observacion.comparacion;
              onAbrir(c.executionId, c.prescriptionId);
              return;
            }
            const i = indiceConTeclado(e, elegido, puntos.length);
            if (i === null) return;
            e.preventDefault();
            onElegir(i);
          }}
        >
          <ResponsiveContainer height={ALTO} initialDimension={{ width: 640, height: ALTO }}>
            <ComposedChart
              data={datos}
              margin={{ top: 24, right: 16, bottom: 8, left: 4 }}
              accessibilityLayer={false}
            >
              <Patrones id={id} />
              <CartesianGrid vertical={false} stroke="var(--borde)" />
              {capas.registrado
                ? puntos
                    .filter((p) => p.registrado.tipo !== 'valor')
                    .map((p) => <ReferenceArea key={`hueco-${p.indice}`} x1={p.indice} x2={p.indice} fill={`url(#${id}-hueco)`} fillOpacity={1} strokeOpacity={0} className="grafico__elegible" onClick={() => onElegir(p.indice)} />)
                : null}
              {elegido !== null ? <ReferenceArea x1={elegido} x2={elegido} fill="var(--fondo-suave)" fillOpacity={0.6} stroke="var(--foco)" strokeWidth={2} /> : null}
              {cambiosDeVersion.map((x) => (
                <ReferenceLine key={`version-${x}`} x={x} stroke="var(--tenue)" strokeDasharray="4 4" />
              ))}
              <XAxis
                dataKey="indice"
                type="category"
                interval={0}
                height={ALTO_DEL_EJE}
                tickLine={false}
                axisLine={{ stroke: 'var(--borde-control)' }}
                tick={({ x, y, index }: { x: number | string; y: number | string; index: number }) => {
                  const p = puntos[index];
                  if (!p) return <g />;
                  return <RotuloDelEje x={x} y={y} primera={rotuloDelEje(p)} estado={rotuloCorto(p, medida)} onElegir={() => onElegir(index)} />;
                }}
              />
              <YAxis
                domain={DOMINIO}
                allowDecimals={medida.variable !== 'repeticiones'}
                width={48}
                tick={{ fill: 'var(--tenue)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--borde-control)' }}
                label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: 12 }}
              />
              {conPuntero ? (
                <Tooltip
                  cursor={{ stroke: 'var(--borde-control)' }}
                  content={({ active, label }) => (active ? <TooltipDePunto punto={puntos[Number(label)]} medida={medida} /> : null)}
                />
              ) : null}
              {capas.planificado ? (
                <Bar dataKey="rango" name="Rango planificado" fill={`url(#${id}-planificado)`} stroke="var(--grafico-planificado)" strokeWidth={2} barSize={14} minPointSize={3} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)} />
              ) : null}
              {capas.planificado
                ? tramosPlan.map((t) => (
                    <Line
                      key={`p${t}`}
                      dataKey={`p${t}`}
                      name={COPY_COMPARACION.capaPlanificado}
                      type="linear"
                      stroke="var(--grafico-planificado)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      connectNulls={false}
                      isAnimationActive={false}
                      activeDot={false}
                      dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) =>
                        cx === undefined || cy === undefined ? <g key={`pd${t}-${index}`} /> : <rect key={`pd${t}-${index}`} x={cx - 5} y={cy - 5} width={10} height={10} fill="var(--superficie)" stroke="var(--grafico-planificado)" strokeWidth={2} className="grafico__elegible" onClick={() => index !== undefined && onElegir(index)} />
                      }
                    />
                  ))
                : null}
              {capas.registrado
                ? tramosReg.map((t) => (
                    <Line
                      key={`r${t}`}
                      dataKey={`r${t}`}
                      name={COPY_COMPARACION.capaRegistrado}
                      type="linear"
                      stroke="var(--grafico-registrado)"
                      strokeWidth={2.5}
                      connectNulls={false}
                      isAnimationActive={false}
                      activeDot={false}
                      dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) =>
                        cx === undefined || cy === undefined ? <g key={`rd${t}-${index}`} /> : <circle key={`rd${t}-${index}`} cx={cx} cy={cy} r={5} fill="var(--grafico-registrado)" stroke="var(--superficie)" strokeWidth={1.5} className="grafico__elegible" onClick={() => index !== undefined && onElegir(index)} />
                      }
                    />
                  ))
                : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {seDesplaza ? <p className="nota">{COPY_COMPARACION.seDesplazaSesiones}</p> : null}
    </figure>
  );
}

function TooltipDePunto({ punto, medida }: { punto: PuntoDeEvolucion | undefined; medida: Medida }) {
  if (!punto) return null;
  return (
    <div className="grafico__tooltip">
      <p>
        <strong>{rotuloDeObservacion(punto.observacion)}</strong>
      </p>
      <p>
        {COPY_COMPARACION.capaPlanificado}: {textoPlanificado(punto.planificado, medida)}
      </p>
      <p>
        {COPY_COMPARACION.capaRegistrado}: {textoRegistrado(punto.registrado, medida)}
      </p>
      {punto.diferencia ? <p>{diferenciaEnPalabras(punto.diferencia, medida)}</p> : null}
      <p className="nota">Clic o toque para ver el detalle</p>
    </div>
  );
}

function TablaDeEvolucion({
  puntos,
  medida,
  numeroDeSerie,
  nombre,
  elegido,
  onElegir,
  onAbrir,
}: {
  puntos: readonly PuntoDeEvolucion[];
  medida: Medida;
  numeroDeSerie: number;
  nombre: string;
  elegido: number | null;
  onElegir: (i: number) => void;
  onAbrir: (executionId: string, prescriptionId: string) => void;
}) {
  return (
    <>
      <p className="nota">{COPY_COMPARACION.tablaMuestraAmbas}</p>
      <table className="tabla">
        <caption className="nota">
          {COPY_COMPARACION.tablaEquivalente}: {nombre} · {COPY_ENTRENAMIENTO.serie.toLowerCase()} {numero(numeroDeSerie)} · {etiquetaDeMedida(medida)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Sesión</th>
            <th scope="col">{COPY_COMPARACION.capaPlanificado}</th>
            <th scope="col">{COPY_COMPARACION.capaRegistrado}</th>
            <th scope="col">{COPY_COMPARACION.diferencia}</th>
            <th scope="col">Registro</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => {
            const c = p.observacion.comparacion;
            return (
              <tr key={p.observacion.clave} aria-current={elegido === p.indice ? 'true' : undefined}>
                <th scope="row">{rotuloDeObservacion(p.observacion)}</th>
                <td data-etiqueta={COPY_COMPARACION.capaPlanificado}>{textoPlanificado(p.planificado, medida)}</td>
                <td data-etiqueta={COPY_COMPARACION.capaRegistrado}>
                  {textoRegistrado(p.registrado, medida)}
                  {p.fila?.corregida ? (
                    <>
                      {' '}
                      <span className="insignia">{COPY_ENTRENAMIENTO.corregida}</span>
                    </>
                  ) : null}
                </td>
                <td data-etiqueta={COPY_COMPARACION.diferencia}>{p.diferencia ? diferenciaEnPalabras(p.diferencia, medida) : '—'}</td>
                <td data-etiqueta="Registro">{c.fuente.tipo === 'correccion' ? COPY_COMPARACION.correccionVigente : c.fuente.tipo === 'original' ? COPY_COMPARACION.registroOriginal : COPY_COMPARACION.sinDato}</td>
                <td data-etiqueta="Acciones">
                  <button type="button" className="boton boton--enlace" onClick={() => onElegir(p.indice)} aria-label={`Ver los valores de ${rotuloDeObservacion(p.observacion)}`}>
                    Ver valores
                  </button>{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => onAbrir(c.executionId, c.prescriptionId)} aria-label={`${COPY_COMPARACION.verLaEjecucion} del ${rotuloDeObservacion(p.observacion)}`}>
                    {COPY_COMPARACION.verLaEjecucion}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
