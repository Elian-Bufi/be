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
  COPY_ENTRENAMIENTO_POR_SERIE,
  textoDelPlanDeLaSerie,
  COPY_REGISTRO_POR_NIVELES,
  type ObjetivosDeLaVersion,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Ayuda } from '../../../../components/ayuda';
import { Aviso } from '../../../../components/formulario';
import { indiceConTeclado, useConPuntero } from '../../../../lib/graficos';
import { dia, diaCorto, fecha } from '../../../../lib/formato';
import { LETRA_MINIMA, medidaDeMarca } from '../seguimiento/geometria';
import { Aro, Punto, Rombo } from '../seguimiento/marca';

export interface Capas {
  readonly planificado: boolean;
  readonly registrado: boolean;
}

const AMBAS: Capas = { planificado: true, registrado: true };
const ALTO = 300;
/**
 * Lo planificado y lo registrado van en el color de la primera métrica, como en «Analizar» (TB-03; DL-163 D-3): los
 * distingue la forma (contorno discontinuo, línea discontinua y rombo hueco contra lleno y línea continua), no un
 * naranja contra un azul.
 */
const COLOR = 'var(--metrica-1)';
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
        {lineas ? ' (línea discontinua, rombos huecos; franja si es un rango)' : ' (contorno discontinuo; franja si es un rango)'}
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

/**
 * Cuántos grupos del eje (series o sesiones) quedan fuera de la vista del marco, para decirlo con texto. Cuenta los
 * rótulos del eje cuyo recuadro cae fuera del marco: un desborde de unos píxeles por márgenes no es un grupo oculto, y
 * antes se avisaba «hay más a los costados» con las tres series a la vista. Se vuelve a medir al desplazar y al cambiar
 * de tamaño, así el número sigue a lo que la persona ve.
 */
function useFueraDeLaVista(marco: RefObject<HTMLDivElement | null>): number {
  const [fuera, setFuera] = useState(0);
  const medir = useCallback(() => {
    const el = marco.current;
    if (!el) return;
    const m = el.getBoundingClientRect();
    const rotulos = [...el.querySelectorAll('svg g[transform]')].filter((g) => g.querySelector(':scope > text.grafico__tick'));
    setFuera(rotulos.filter((g) => {
      const r = g.getBoundingClientRect();
      return r.right < m.left + 1 || r.left > m.right - 1;
    }).length);
  }, [marco]);
  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    el.addEventListener('scroll', medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener('scroll', medir);
    };
  }, [marco, medir]);
  // Después de cada dibujo del componente (otra variable, otra capa, otros datos) se vuelve a medir, aunque el marco no
  // cambie de tamaño: el primer dibujo ocurre antes de que Recharts ubique los rótulos, y lo cubre la notificación
  // inicial del ResizeObserver; esto cubre los redibujos que no mueven el tamaño. Si el número no cambia, React no
  // vuelve a dibujar.
  useEffect(() => {
    medir();
  });
  return fuera;
}


/**
 * Rayado para las sesiones sin dato: el estado se ve sin depender del color (B10-10 §11). Lo planificado ya no va
 * rayado (TB-03): va en contorno discontinuo del color de la métrica, como en «Analizar».
 */
function Patrones({ id }: { id: string }) {
  return (
    <defs>
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
  // DL-161: la marca de la serie, como en la tabla de la sesión.
  if (s.recordedAs === 'AS_PLANNED') partes.push(COPY_REGISTRO_POR_NIVELES.comoElPlan);
  return partes.join(' · ');
}

/**
 * La diferencia en palabras, o por qué no hay: una serie de carga rápida (tildada sin escribir, DL-161) lo dice; las
 * demás, con `sinDiferencia`.
 */
function textoDeLaDiferencia(p: { readonly diferencia: Diferencia | null; readonly cargaRapida?: true }, medida: Medida, sinDiferencia: string): string {
  if (p.diferencia) return diferenciaEnPalabras(p.diferencia, medida);
  return p.cargaRapida ? COPY_REGISTRO_POR_NIVELES.noSeComparaTildada : sinDiferencia;
}

/** La marca de lo registrado en la leyenda: un punto lleno, o hueco si es de carga rápida (DL-161). */
function MuestraDeRegistrado({ hueca = false }: { hueca?: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" className="muestra-de-registrado">
      <circle cx={7} cy={7} r={hueca ? 4 : 3.5} fill={hueca ? 'var(--superficie)' : COLOR} stroke={hueca ? COLOR : 'none'} strokeWidth={1.5} />
    </svg>
  );
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
  cargaRapida,
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
  /** DL-161: lo registrado se tildó sin escribir; la diferencia dice por qué no se compara. */
  cargaRapida?: true;
  medida: Medida;
  rol?: RolDeLaObservacion;
  children?: ReactNode;
}) {
  const nota = fila?.planificada.tipo === 'planificada' ? fila.planificada.nota : null;
  // DL-122: con el objetivo efectivo de la serie, el plan de esa serie (heredado o propio) se dice entero.
  const objetivo = fila?.planificada.tipo === 'planificada' ? fila.planificada.objetivo : undefined;
  const planDeLaSerie =
    fila && fila.planificada.tipo === 'planificada' && objetivo ? textoDelPlanDeLaSerie({ repetitions: fila.planificada.repeticiones, rir: objetivo.rir, suggestedLoad: objetivo.carga, restSeconds: null }) : null;
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
        {planDeLaSerie ? (
          <>
            <dt>{COPY_ENTRENAMIENTO_POR_SERIE.planDeLaSerie(fila!.numero)}</dt>
            <dd>{planDeLaSerie}</dd>
          </>
        ) : null}
        <dt>{COPY_COMPARACION.capaRegistrado} · {etiquetaDeMedida(medida)}</dt>
        <dd>{textoRegistrado(registrado, medida)}</dd>
        <dt>{COPY_COMPARACION.diferencia}</dt>
        <dd>{textoDeLaDiferencia({ diferencia, cargaRapida }, medida, 'No hay dos valores comparables')}</dd>
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
  objetivos,
}: {
  ejecucion: EjecucionDeEntrenamiento;
  prescriptionId?: string;
  /** La identidad de las versiones de todo el período: la misma que usa la evolución, así las dos vistas coinciden. */
  identidad: IdentidadDeVersiones;
  /** DL-122: los objetivos por serie de la versión que rigió (API-SER-01). Sin ellos, el RIR y la carga son los de la prescripción. */
  objetivos?: ObjetivosDeLaVersion;
}) {
  const id = useId();
  const comparaciones = useMemo(() => compararEjecucion(ejecucion, identidad, objetivos), [ejecucion, identidad, objetivos]);
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
      <AvisosDeLaComparacion c={c} medida={medida} conTabla={series.length > 0} />
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
                cargaRapida={s.cargaRapida}
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
function AvisosDeLaComparacion({ c, medida, conTabla }: { c: ComparacionDeEjercicio; medida: Medida; conTabla: boolean }) {
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
      {/* DL-113 · cómo se leen el gráfico y la tabla, plegado: a la vista quedan los avisos y los datos. */}
      <Ayuda>
        <p>
          {COPY_COMPARACION.ausenciaNoEsCero} {COPY_COMPARACION.sinDeclaracionPorSerie} {notas.join(' ')}
        </p>
        {conTabla ? <p>{COPY_COMPARACION.tablaMuestraAmbas}</p> : null}
      </Ayuda>
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
  const fueraDeLaVista = useFueraDeLaVista(marco);
  const datos = datosPorSerie(series, medida);
  const ancho = anchoPorGrupo(
    datos.flatMap((d) => [`${COPY_ENTRENAMIENTO.serie} ${numero(d.numero)}`, ...lineasDelRotulo(d.rotulo)]),
    datos.flatMap((d) => [d.etiquetaPlan, d.etiquetaReg]),
  );
  const unidad = unidadDeMedida(medida);
  const resumen = series
    .map(
      (s) =>
        `${COPY_ENTRENAMIENTO.serie} ${numero(s.numero)}: ${COPY_COMPARACION.capaPlanificado.toLowerCase()} ${textoPlanificado(s.planificado, medida)}, ${COPY_COMPARACION.capaRegistrado.toLowerCase()} ${textoRegistrado(s.registrado, medida)}${s.cargaRapida ? ` (${COPY_REGISTRO_POR_NIVELES.cargaRapida})` : ''}`,
    )
    .join('. ');
  // DL-161: la barra de lo registrado va hueca si la serie se tildó sin escribir; la leyenda lo dice solo si hay alguna.
  const hayCargaRapida = series.some((s) => s.cargaRapida && s.registrado.tipo === 'valor');
  return (
    <figure className="grafico__figura" aria-labelledby={`${id}-titulo`}>
      <figcaption id={`${id}-titulo`} className="nota">
        {titulo}. Eje vertical: {ejeVertical(medida)}. Eje horizontal: número real de la serie.
      </figcaption>
      {hayCargaRapida && capas.registrado ? (
        <ul className="leyenda" aria-label="Leyenda">
          <li>
            <MuestraDeRegistrado hueca /> {COPY_REGISTRO_POR_NIVELES.leyendaCargaRapida}
          </li>
        </ul>
      ) : null}
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
              barGap={3}
              accessibilityLayer={false}
            >
              <Patrones id={id} />
              <CartesianGrid vertical={false} stroke="var(--borde)" />
              {/* Lo elegido (TB-02): la columna en el fondo suave y la guía fina y continua, como en «Analizar». El foco del
                  teclado es el del marco del gráfico; ya no se confunde con lo elegido. */}
              {elegida !== null && datos[elegida] ? <ReferenceArea x1={datos[elegida].numero} x2={datos[elegida].numero} fill="var(--fondo-suave)" stroke="none" /> : null}
              {elegida !== null && datos[elegida] ? <ReferenceLine className="grafico__guia" x={datos[elegida].numero} stroke="var(--tenue)" strokeWidth={1} /> : null}
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
                tick={{ fill: 'var(--tenue)', fontSize: LETRA_MINIMA }}
                axisLine={false}
                tickLine={false}
                label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: LETRA_MINIMA }}
              />
              {conPuntero ? (
                <Tooltip cursor={{ fill: 'var(--fondo-suave)' }} content={({ active, label }) => (active ? <TooltipDeSerie serie={series.find((s) => s.numero === label)} medida={medida} /> : null)} />
              ) : null}
              {capas.planificado ? (
                <Bar dataKey="plan" name={COPY_COMPARACION.capaPlanificado} fill="var(--superficie)" stroke={COLOR} strokeWidth={1.25} strokeDasharray="3 2" maxBarSize={20} minPointSize={3} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)}>
                  <LabelList dataKey="etiquetaPlan" position="top" className="grafico__valor" />
                </Bar>
              ) : null}
              {capas.registrado ? (
                <Bar dataKey="reg" name={COPY_COMPARACION.capaRegistrado} fill={COLOR} maxBarSize={20} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)}>
                  {/* DL-161: hueca la de carga rápida (tildada sin escribir), con el contorno del color de lo registrado. */}
                  {series.map((s) =>
                    s.cargaRapida ? <Cell key={`reg-${s.numero}`} fill="var(--superficie)" stroke={COLOR} strokeWidth={1.5} /> : <Cell key={`reg-${s.numero}`} fill={COLOR} />,
                  )}
                  <LabelList dataKey="etiquetaReg" position="top" className="grafico__valor" />
                </Bar>
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {fueraDeLaVista > 0 ? <p className="nota">{COPY_COMPARACION.fueraDeLaVista(fueraDeLaVista, 'series')}</p> : null}
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
      {serie.diferencia || serie.cargaRapida ? <p>{textoDeLaDiferencia(serie, medida, '')}</p> : null}
    </div>
  );
}

function TablaPorSerie({ c, series, medida }: { c: ComparacionDeEjercicio; series: readonly SerieParaGraficar[]; medida: Medida }) {
  return (
    <>
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
              <td data-etiqueta={COPY_COMPARACION.diferencia}>{textoDeLaDiferencia(s, medida, '—')}</td>
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
  objetivosPorVersion,
}: {
  ejecuciones: readonly EjecucionDeEntrenamiento[];
  /** Todas las ejecuciones del período: de ahí sale la identidad de cada versión, aunque `ejecuciones` venga filtrada. */
  periodo: readonly EjecucionDeEntrenamiento[];
  clave: string;
  nombre: string;
  /** planId → «activada el …», para decir a qué versión pertenece cada punto. */
  versiones: ReadonlyMap<string, string>;
  onAbrir: (executionId: string, prescriptionId: string) => void;
  /** DL-122: los objetivos por serie de cada versión del período, por `planId`. */
  objetivosPorVersion?: ReadonlyMap<string, ObjetivosDeLaVersion>;
}) {
  const id = useId();
  const observaciones = useMemo(() => observacionesDelEjercicio(ejecuciones, clave, periodo, objetivosPorVersion), [ejecuciones, clave, periodo, objetivosPorVersion]);
  const numeros = numerosDeSerie(observaciones);
  const [claveMedida, setClaveMedida] = useState('repeticiones');
  const [numeroElegido, setNumeroElegido] = useState<number | null>(null);
  const [capas, setCapas] = useState<Capas>(AMBAS);
  const [elegido, setElegido] = useState<number | null>(null);

  if (observaciones.length === 0) {
    // Con un filtro de versión, el ejercicio puede estar en el período y no en la versión elegida: se dice eso.
    const enElPeriodo = ejecuciones.length < periodo.length && observacionesDelEjercicio(periodo, clave, periodo, objetivosPorVersion).length > 0;
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
      {/* DL-113 · cómo se leen el gráfico y la tabla, plegado: a la vista quedan la leyenda y los datos. */}
      <Ayuda>
        <p>
          {COPY_COMPARACION.unidadDeObservacion} {COPY_COMPARACION.comparaConSuPrescripcion} {COPY_COMPARACION.lineasSeCortan}
        </p>
        {medida.variable === 'carga' ? <p>{`${COPY_COMPARACION.sugeridaNoEsObligacion} ${COPY_COMPARACION.rmNoSeConvierte}`}</p> : null}
        {medida.variable === 'rir' ? <p>{COPY_COMPARACION.rirDeLaPrescripcion}</p> : null}
        <p>{COPY_COMPARACION.tablaMuestraAmbas}</p>
      </Ayuda>
      <ul className="leyenda" aria-label="Leyenda">
        <li>
          <span className="muestra muestra--hueco" aria-hidden="true" /> Franja gris rayada: sesión sin valor registrado de esta serie (el motivo está en la tabla)
        </li>
        <li>Línea vertical discontinua: empieza otra versión del plan</li>
        {/* DL-161: solo si hay alguna: lo tildado sin escribir va hueco y no se compara; lo escrito, lleno. */}
        {puntos.some((x) => x.cargaRapida) ? (
          <li data-leyenda="carga-rapida">
            <MuestraDeRegistrado hueca /> {COPY_REGISTRO_POR_NIVELES.leyendaCargaRapida}
          </li>
        ) : null}
      </ul>
      {observaciones.length === 1 ? <p className="nota">Hay una sola sesión con este ejercicio en el período: todavía no hay evolución que mirar. Podés ampliar el período (hasta 92 días).</p> : null}
      {!conValor ? <p>No hay valores de {etiquetaDeMedida(medida).toLowerCase()} para esta serie en el período. La tabla dice por qué en cada sesión.</p> : null}
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
            cargaRapida={p.cargaRapida}
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
  const fueraDeLaVista = useFueraDeLaVista(marco);
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
    .map(
      (p) =>
        `${rotuloDeObservacion(p.observacion)}: ${COPY_COMPARACION.capaPlanificado.toLowerCase()} ${textoPlanificado(p.planificado, medida)}, ${COPY_COMPARACION.capaRegistrado.toLowerCase()} ${textoRegistrado(p.registrado, medida)}${p.cargaRapida ? ` (${COPY_REGISTRO_POR_NIVELES.cargaRapida})` : ''}`,
    )
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
              {/* Lo elegido (TB-02): la guía fina y continua y, sobre lo registrado, el aro del color de la serie. */}
              {elegido !== null ? <ReferenceLine className="grafico__guia" x={elegido} stroke="var(--tenue)" strokeWidth={1} /> : null}
              {cambiosDeVersion.map((x) => (
                <ReferenceLine key={`version-${x}`} x={x} stroke="var(--borde-control)" strokeWidth={1} strokeDasharray="1 3" />
              ))}
              <XAxis
                dataKey="indice"
                type="category"
                interval={0}
                height={ALTO_DEL_EJE}
                tickLine={false}
                axisLine={false}
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
                tick={{ fill: 'var(--tenue)', fontSize: LETRA_MINIMA }}
                axisLine={false}
                tickLine={false}
                label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: LETRA_MINIMA }}
              />
              {conPuntero ? (
                <Tooltip
                  cursor={{ stroke: 'var(--borde-control)' }}
                  content={({ active, label }) => (active ? <TooltipDePunto punto={puntos[Number(label)]} medida={medida} /> : null)}
                />
              ) : null}
              {capas.planificado ? (
                <Bar dataKey="rango" name="Rango planificado" fill="var(--banda)" stroke={COLOR} strokeWidth={1} strokeDasharray="4 3" barSize={14} minPointSize={3} isAnimationActive={false} className="grafico__elegible" onClick={(_dato: unknown, i: number) => onElegir(i)} />
              ) : null}
              {capas.planificado
                ? tramosPlan.map((t) => (
                    <Line
                      key={`p${t}`}
                      dataKey={`p${t}`}
                      name={COPY_COMPARACION.capaPlanificado}
                      type="linear"
                      stroke={COLOR}
                      strokeWidth={1.25}
                      strokeDasharray="4 3"
                      connectNulls={false}
                      isAnimationActive={false}
                      activeDot={false}
                      dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) =>
                        cx === undefined || cy === undefined ? (
                          <g key={`pd${t}-${index}`} />
                        ) : (
                          // TB-02: lo indicado en el plan es un rombo hueco del tamaño del hueco, como en «Analizar».
                          <g key={`pd${t}-${index}`} className="grafico__elegible" onClick={() => index !== undefined && onElegir(index)}>
                            <Rombo cx={cx} cy={cy} porDia={ancho} color={COLOR} />
                          </g>
                        )
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
                      stroke={COLOR}
                      strokeWidth={1.75}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      connectNulls={false}
                      isAnimationActive={false}
                      activeDot={false}
                      dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) =>
                        cx === undefined || cy === undefined ? (
                          <g key={`rd${t}-${index}`} />
                        ) : (
                          // TB-02: la marca con la regla de los cuatro gráficos. DL-161: la carga rápida (tildada sin escribir), hueca.
                          <g key={`rd${t}-${index}`} data-carga-rapida={index !== undefined && puntos[index]?.cargaRapida ? 'si' : undefined} className="grafico__elegible" onClick={() => index !== undefined && onElegir(index)}>
                            <Punto cx={cx} cy={cy} color={COLOR} medida={medidaDeMarca(index !== undefined && puntos[index]?.cargaRapida ? 'hueco' : 'lleno', ancho)} />
                            {index === elegido ? <Aro cx={cx} cy={cy} porDia={ancho} color={COLOR} /> : null}
                          </g>
                        )
                      }
                    />
                  ))
                : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {fueraDeLaVista > 0 ? <p className="nota">{COPY_COMPARACION.fueraDeLaVista(fueraDeLaVista, 'sesiones')}</p> : null}
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
      {punto.diferencia || punto.cargaRapida ? <p>{textoDeLaDiferencia(punto, medida, '')}</p> : null}
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
                <td data-etiqueta={COPY_COMPARACION.diferencia}>{textoDeLaDiferencia(p, medida, '—')}</td>
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
