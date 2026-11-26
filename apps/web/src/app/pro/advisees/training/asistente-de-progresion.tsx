'use client';

/**
 * DL-196 parte B (E12 y E19) y DL-201 · el cuadro de «Progresión…»: ancho, en dos columnas y sin desplazarse a 1280 × 720.
 *
 * - **Configura a la izquierda** (ET1-D20: los cuadros configuran; el panel lateral solo muestra): a qué se aplica, el
 *   modelo (en una fila), sus parámetros y la semana de descarga.
 * - **La vista previa a la derecha, en vivo:** el gráfico de la carga por semana (desde 0, ET1-D17) y la tabla de las
 *   semanas de un ejercicio de muestra, elegido entre los afectados. La descarga, marcada.
 * - **Por ejercicio (DL-201), con el patrón de la intensidad (ET1-D11):** «Toda la fase» guarda la regla de la fase, que
 *   hereda cada ejercicio; «Ejercicios elegidos» guarda una regla propia de esos ejercicios, que pisa la de la fase. Un
 *   ejercicio lleva como mucho una propia: sumarlo a esta lo saca de la otra (lo avisa su ficha «Regla propia»).
 * - **Un solo «?»,** en la esquina del cuadro, con un ejemplo resuelto de cada modelo y de la descarga.
 * - Desde la copia de una fase (E19), «Arrancar donde terminó…» sube las cargas de la copia a las de la última semana de
 *   la original antes de aplicar la regla.
 * Nada se escribe hasta el botón principal.
 */
import {
  cambiaAlgo,
  COPY_PROGRESIONES as P,
  DESCARGA_POR_OMISION,
  numero,
  OLAS_POR_OMISION,
  progresionCorta,
  progresionDeLaFase,
  progresionEnPalabras,
  progresionPorOmision,
  reglaPropiaDe,
  type AproximacionesDelEjercicio,
  type ModeloDeProgresion,
  type PlanificacionDelPlan,
  type ProgresionDeLaFase,
} from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { GraficoDeSemanas } from './grafico-de-semanas';
import { celdaDeLaSemana, ejerciciosAfectados, vistaPrevia, type EjercicioDeLaFase } from './progresion-del-editor';

const MODELOS: readonly (ModeloDeProgresion | null)[] = [null, 'LINEAR', 'DOUBLE', 'UNDULATING'];
const SEMANAS_SI_NO_TIENE = 4;

export interface ProgresionDeOtraFase {
  readonly fase: string;
  readonly progresion: ProgresionDeLaFase;
}

export interface AplicacionDeLaProgresion {
  /**
   * La regla elegida. Con `prescriptionIds` en `null`, la de la fase (`null` entera: quitarla); con ejercicios, la propia
   * de esos ejercicios (sin modelo ni descarga: «Sin progresión» para ellos).
   */
  readonly progresion: ProgresionDeLaFase | null;
  /** La regla propia que se estaba editando, que se reemplaza (DL-201). */
  readonly reemplaza: ProgresionDeLaFase | null;
  /** Las semanas de la fase, si no tenía y se dijeron acá. */
  readonly semanas: number | null;
  /** E19: arrancar la copia con las cargas de la última semana de la original. */
  readonly arrancarDondeTermino: boolean;
}

/** Un número de un campo, o el de antes si no se entiende. */
const leer = (texto: string, antes: number): number => {
  const n = Number(texto.replace(',', '.'));
  return Number.isFinite(n) ? n : antes;
};

const claveDe = (e: EjercicioDeLaFase): string => e.prescriptionId ?? e.nombre;

/** Lo que dice el «?» del cuadro: qué es la regla, un ejemplo resuelto de cada modelo y de la descarga. */
function AyudaDeLaProgresion() {
  return (
    <>
      <p>Una regla dice cómo cambia la carga de trabajo semana a semana. La sesión sigue siendo la misma; la regla se lee encima, y la persona ve la carga de cada semana.</p>
      <p>
        <strong>Toda la fase o por ejercicio.</strong> La regla de la fase la hereda cada ejercicio. Un ejercicio puede tener la suya, que pisa la de la fase, o «Sin progresión»: queda igual todas las semanas.
      </p>
      {MODELOS.flatMap((m) =>
        m
          ? [
              <p key={m}>
                <strong>{P.modelos[m]}.</strong> {P.queHace[m]} {P.ejemplos[m]}
              </p>,
            ]
          : [],
      )}
      <p>
        <strong>{P.descarga}.</strong> {P.descargaQueHace} {P.descargaEjemplo}
      </p>
      <p>Las cargas se redondean como las aproximaciones: al paso del implemento (2,5 kg en la barra, 5 kg en una máquina, 1 kg en las mancuernas livianas).</p>
    </>
  );
}

export function AsistenteDeProgresion({
  abierto,
  persona,
  fase,
  blockId,
  semanasDeLaFase,
  ejercicios,
  aproximacionesDe,
  plan,
  desdeElEjercicio = null,
  otras,
  desdeLaCopia = null,
  onAplicar,
  onUsarLaDeLaFase,
  onCerrar,
}: {
  abierto: boolean;
  persona: string | null;
  fase: string;
  blockId: string;
  semanasDeLaFase: number | null;
  ejercicios: readonly EjercicioDeLaFase[];
  aproximacionesDe: (id: string | null) => AproximacionesDelEjercicio | null;
  /** La planificación de hoy: la regla de la fase y las propias de los ejercicios. */
  plan: PlanificacionDelPlan;
  /** DL-201: abierto desde «Más» de un ejercicio, con ese ejercicio elegido. */
  desdeElEjercicio?: string | null;
  otras: readonly ProgresionDeOtraFase[];
  /** E19: la copia recién hecha de otra fase, con la regla y los ejercicios de la original. */
  desdeLaCopia?: { readonly original: string; readonly progresion: ProgresionDeLaFase | null; readonly ejercicios: readonly EjercicioDeLaFase[]; readonly semanas: number | null } | null;
  onAplicar: (a: AplicacionDeLaProgresion) => void;
  /** DL-201: los ejercicios vuelven a la regla de la fase («Usar la de la fase»). */
  onUsarLaDeLaFase: (prescriptionIds: readonly string[]) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const pasoDeEntrada = ejercicios.length > 0 ? (vistaPrevia(progresionPorOmision(blockId, null, 2.5), ejercicios.slice(0, 1), 1, aproximacionesDe)[0]?.paso ?? 2.5) : 2.5;
  const deLaFase = progresionDeLaFase(plan, blockId);
  // La regla que se edita: la propia del ejercicio, si se abrió desde él y tiene; si no, la de la fase.
  const editada = desdeElEjercicio ? reglaPropiaDe(plan, blockId, desdeElEjercicio) : deLaFase;
  const inicial = useMemo<ProgresionDeLaFase>(() => {
    if (desdeElEjercicio) return editada ?? { ...(deLaFase ?? progresionPorOmision(blockId, 'LINEAR', pasoDeEntrada)), blockId, prescriptionIds: [desdeElEjercicio] };
    return { ...(deLaFase ?? desdeLaCopia?.progresion ?? progresionPorOmision(blockId, 'LINEAR', pasoDeEntrada)), blockId, prescriptionIds: null };
    // Se arma una vez por apertura: el editor monta el cuadro de nuevo para otra fase u otro ejercicio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [regla, setRegla] = useState<ProgresionDeLaFase>(inicial);
  const [semanas, setSemanas] = useState<number>(semanasDeLaFase ?? SEMANAS_SI_NO_TIENE);
  const [arrancar, setArrancar] = useState<boolean>(desdeLaCopia?.progresion != null);
  const [muestra, setMuestra] = useState<string | null>(desdeElEjercicio);

  const cambiar = (c: Partial<ProgresionDeLaFase>) => setRegla((r) => ({ ...r, ...c }));
  const elegirModelo = (m: ModeloDeProgresion | null) => {
    const base = progresionPorOmision(blockId, m, pasoDeEntrada);
    setRegla((r) => ({ ...base, deload: r.deload, prescriptionIds: r.prescriptionIds }));
  };
  const unidades = new Set(ejercicios.map((e) => e.prescripcion.suggestedLoad?.unit ?? e.prescripcion.sets.find((s) => s.suggestedLoad)?.suggestedLoad?.unit ?? 'kg'));
  const unidad = unidades.size === 1 ? [...unidades][0]! : 'kg';
  const unidadEnTexto = unidades.size > 1 ? 'kg o lb, según el ejercicio' : unidad;
  const conRegla = cambiaAlgo(regla);
  const elegidos = regla.prescriptionIds;
  const alternarElegido = (pid: string) => {
    const lista = elegidos ?? [];
    cambiar({ prescriptionIds: lista.includes(pid) ? lista.filter((x) => x !== pid) : [...lista, pid] });
  };
  const sinElegidos = elegidos !== null && elegidos.length === 0;
  const descargaFuera = regla.deload && regla.deload.week > semanas ? P.fueraDeLaFase(regla.deload.week, semanas) : null;

  // Los ejercicios a los que llega la regla y el de muestra (el elegido, o el primero con carga).
  const afectados = useMemo(() => ejerciciosAfectados(plan, blockId, ejercicios, elegidos), [plan, blockId, ejercicios, elegidos]);
  const conPropiaFuera = elegidos === null ? ejercicios.length - afectados.length : 0;
  const deMuestra = afectados.find((e) => claveDe(e) === muestra) ?? afectados.find((e) => vistaPrevia(regla, [e], 1, aproximacionesDe)[0]?.semanas[0]?.carga != null) ?? afectados[0] ?? null;
  const fila = useMemo(() => (deMuestra ? (vistaPrevia(regla, [deMuestra], semanas, aproximacionesDe)[0] ?? null) : null), [regla, deMuestra, semanas, aproximacionesDe]);
  const seriesDeBase = deMuestra ? deMuestra.prescripcion.sets.filter((s) => s.setKind !== 'WARM_UP').length : null;

  // Las sesiones de la fase, en orden, con sus ejercicios (para las casillas agrupadas).
  const porSesion = useMemo(() => {
    const grupos: { sesion: string; ejercicios: EjercicioDeLaFase[] }[] = [];
    for (const e of ejercicios) {
      if (!e.prescriptionId) continue;
      const g = grupos.find((x) => x.sesion === e.sesion);
      if (g) g.ejercicios.push(e);
      else grupos.push({ sesion: e.sesion, ejercicios: [e] });
    }
    return grupos;
  }, [ejercicios]);

  // La propia que se edita se reemplaza al aplicar; si se pasa a «Toda la fase», queda como estaba.
  const reemplaza = elegidos !== null && editada?.prescriptionIds ? editada : null;
  const aplicar = () =>
    onAplicar({
      progresion: elegidos === null ? (conRegla ? { ...regla, blockId } : null) : { ...regla, blockId },
      reemplaza,
      semanas: semanasDeLaFase === null ? semanas : null,
      arrancarDondeTermino: arrancar && desdeLaCopia?.progresion != null,
    });
  const textoPrincipal = elegidos !== null ? P.aplicarA(elegidos.length) : !conRegla && deLaFase ? P.quitar : P.aplicar;
  const conCambios = JSON.stringify(regla) !== JSON.stringify(inicial) || (semanasDeLaFase === null && semanas !== SEMANAS_SI_NO_TIENE);

  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      titulo={[P.tituloCorto, fase, persona].filter(Boolean).join(' · ')}
      className="asistente-de-progresion"
      conCambios={conCambios}
      ayuda={{ nombre: 'Cómo funciona la progresión, con ejemplos', contenido: <AyudaDeLaProgresion /> }}
      onCerrar={onCerrar}
      principal={{
        texto: textoPrincipal,
        alTocar: aplicar,
        apagado: ejercicios.length === 0 ? 'La fase todavía no tiene ejercicios.' : sinElegidos ? 'Elegí al menos un ejercicio, o aplicala a toda la fase.' : null,
      }}
      pie={
        <div className="asistente-de-progresion__pie">
          <p className="nota">{P.comoSeVe}</p>
          {reemplaza ? (
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => onUsarLaDeLaFase(reemplaza.prescriptionIds!)} data-usar-la-de-la-fase>
              {P.usarLaDeLaFase}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="asistente-de-progresion__cuerpo" data-asistente-de-progresion={blockId} data-desde-el-ejercicio={desdeElEjercicio ?? undefined}>
        <div className="asistente-de-progresion__configuracion">
          {desdeLaCopia ? (
            <div className="asistente-de-progresion__copia" data-desde-la-copia>
              <p className="nota">Copia de «{desdeLaCopia.original}».</p>
              {desdeLaCopia.progresion ? (
                <label className="casilla">
                  <input type="checkbox" checked={arrancar} onChange={(e) => setArrancar(e.target.checked)} data-arrancar-donde-termino />
                  Arrancar donde terminó «{desdeLaCopia.original}»: las cargas de su última semana pasan a ser las de trabajo de la copia
                </label>
              ) : null}
            </div>
          ) : null}

          <fieldset className="asistente-de-progresion__alcance">
            <legend>{P.seAplicaA}</legend>
            <div className="asistente-de-progresion__fila" role="radiogroup" aria-label={P.seAplicaA}>
              <label className="casilla">
                <input type="radio" name={`${id}-alcance`} checked={elegidos === null} onChange={() => cambiar({ prescriptionIds: null })} data-alcance="fase" />
                {P.aToda} ({ejercicios.length === 1 ? '1 ejercicio' : `${ejercicios.length} ejercicios`})
              </label>
              <label className="casilla">
                <input type="radio" name={`${id}-alcance`} checked={elegidos !== null} onChange={() => cambiar({ prescriptionIds: desdeElEjercicio ? [desdeElEjercicio] : [] })} data-alcance="elegidos" />
                {P.aLosElegidos}
              </label>
              {semanasDeLaFase === null ? (
                <label>
                  La fase dura
                  <input type="number" min={1} max={52} value={semanas} onChange={(e) => setSemanas(Math.max(1, Math.min(52, Math.round(leer(e.target.value, semanas)))))} data-campo="semanas-de-la-fase" />
                  semanas
                </label>
              ) : null}
            </div>
            {elegidos !== null ? (
              // Si la lista es larga, se desplaza solo ella: el cuadro no.
              <div className="asistente-de-progresion__elegidos" data-elegidos={elegidos.length}>
                {porSesion.map((g) => (
                  <div key={g.sesion} className="asistente-de-progresion__sesion" role="group" aria-label={g.sesion}>
                    <p className="asistente-de-progresion__nombre-de-la-sesion">{g.sesion}</p>
                    <ul role="list">
                      {g.ejercicios.map((e) => {
                        const propia = reglaPropiaDe(plan, blockId, e.prescriptionId);
                        const otra = propia && propia !== editada ? propia : null;
                        return (
                          <li key={e.prescriptionId}>
                            <label className="casilla">
                              <input type="checkbox" checked={elegidos.includes(e.prescriptionId!)} onChange={() => alternarElegido(e.prescriptionId!)} data-elegido={e.prescriptionId} />
                              <span>{e.nombre}</span>
                              {otra ? (
                                <span className="etiqueta-de-dato asistente-de-progresion__propia" title={`${P.propia}: ${progresionEnPalabras(otra, unidad)}`} data-con-regla-propia>
                                  {P.propia} · {progresionCorta(otra, unidad)}
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
            {/* RP-19: el renglón de la nota está siempre, con o sin texto. */}
            <p className="nota asistente-de-progresion__aviso" data-con-propia-fuera={conPropiaFuera || undefined}>
              {conPropiaFuera > 0 ? `${P.conPropias(conPropiaFuera)}: sigue${conPropiaFuera === 1 ? '' : 'n'} con la suya.` : elegidos !== null ? 'Un ejercicio con otra regla propia pasa a esta.' : ' '}
            </p>
          </fieldset>

          <fieldset className="asistente-de-progresion__modelos">
            <legend>Modelo</legend>
            {otras.length > 0 ? (
              <div className="asistente-de-progresion__otras">
                {otras.map((o) => (
                  <button key={o.fase} type="button" className="chip-de-zona" onClick={() => setRegla({ ...o.progresion, blockId, prescriptionIds: regla.prescriptionIds })} data-usar-la-de={o.fase}>
                    {P.usarLaDe(o.fase)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="selector-segmentado asistente-de-progresion__selector" role="radiogroup" aria-label="Modelo de progresión">
              {MODELOS.map((m) => (
                <label key={m ?? 'ninguno'} className="selector-segmentado__opcion" data-modelo={m ?? 'ninguno'}>
                  <input type="radio" name={`${id}-modelo`} checked={regla.model === m} onChange={() => elegirModelo(m)} />
                  <span>{m ? P.modelos[m] : P.sinModelo}</span>
                </label>
              ))}
            </div>
            <p className="asistente-de-progresion__que-hace nota">{regla.model ? P.queHace[regla.model] : 'La carga de trabajo queda igual todas las semanas; podés sumar solo una descarga.'}</p>
            {regla.model === 'LINEAR' ? (
              <div className="asistente-de-progresion__fila">
                <label>
                  Carga +
                  <input type="number" inputMode="decimal" min={0} max={50} step={0.5} value={regla.loadStep ?? 0} onChange={(e) => cambiar({ loadStep: Math.max(0, Math.min(50, leer(e.target.value, regla.loadStep ?? 0))) })} data-campo="paso-de-carga" />
                  <span>{unidadEnTexto} por semana</span>
                </label>
                <label>
                  Repeticiones +
                  <input type="number" min={0} max={5} step={1} value={regla.repStep ?? 0} onChange={(e) => cambiar({ repStep: Math.max(0, Math.min(5, Math.round(leer(e.target.value, regla.repStep ?? 0)))) })} data-campo="paso-de-repeticiones" />
                  <span>por semana</span>
                </label>
              </div>
            ) : null}
            {regla.model === 'DOUBLE' && regla.repRange ? (
              <div className="asistente-de-progresion__fila">
                <label>
                  De
                  <input type="number" min={1} max={49} value={regla.repRange.min} onChange={(e) => cambiar({ repRange: { min: Math.max(1, Math.min(regla.repRange!.max - 1, Math.round(leer(e.target.value, regla.repRange!.min)))), max: regla.repRange!.max } })} data-campo="rango-desde" />
                </label>
                <label>
                  a
                  <input type="number" min={2} max={50} value={regla.repRange.max} onChange={(e) => cambiar({ repRange: { min: regla.repRange!.min, max: Math.max(regla.repRange!.min + 1, Math.min(50, Math.round(leer(e.target.value, regla.repRange!.max)))) } })} data-campo="rango-hasta" />
                  <span>repeticiones; después</span>
                </label>
                <label>
                  <span className="visualmente-oculto">Cuánto sube la carga</span>+
                  <input type="number" inputMode="decimal" min={0} max={50} step={0.5} value={regla.loadStep ?? 0} onChange={(e) => cambiar({ loadStep: Math.max(0, Math.min(50, leer(e.target.value, regla.loadStep ?? 0))) })} data-campo="paso-de-carga" />
                  <span>{unidadEnTexto}</span>
                </label>
              </div>
            ) : null}
            {regla.model === 'UNDULATING' ? (
              <div className="asistente-de-progresion__fila">
                {(['Pesada', 'Liviana', 'Media'] as const).map((nombre, k) => (
                  <label key={nombre}>
                    {nombre}
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={(regla.waves ?? OLAS_POR_OMISION)[k]}
                      onChange={(e) => {
                        const olas = [...(regla.waves ?? OLAS_POR_OMISION)];
                        olas[k] = Math.max(40, Math.min(100, Math.round(leer(e.target.value, olas[k]!))));
                        cambiar({ waves: olas });
                      }}
                      data-campo={`ola-${k + 1}`}
                    />
                  </label>
                ))}
                <span className="nota">% de la carga de trabajo</span>
              </div>
            ) : null}
          </fieldset>

          <fieldset className="asistente-de-progresion__descarga">
            <legend className="visualmente-oculto">{P.descarga}</legend>
            <div className="asistente-de-progresion__fila">
              <label className="casilla">
                <input type="checkbox" checked={regla.deload !== null} onChange={(e) => cambiar({ deload: e.target.checked ? { week: Math.min(semanas, 4), ...DESCARGA_POR_OMISION } : null })} data-descarga />
                {P.descarga}
              </label>
              {regla.deload ? (
                <label>
                  en la semana
                  <select value={regla.deload.week} onChange={(e) => cambiar({ deload: { ...regla.deload!, week: Number(e.target.value) } })} data-campo="semana-de-descarga">
                    {Array.from({ length: Math.max(semanas, regla.deload.week) }, (_, k) => k + 1).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            {regla.deload ? (
              <div className="asistente-de-progresion__modos" role="radiogroup" aria-label="Cómo es la descarga">
                <label className="casilla">
                  <input type="radio" name={`${id}-descarga`} checked={regla.deload.mode === 'LOAD'} onChange={() => cambiar({ deload: { ...regla.deload!, mode: 'LOAD' } })} />
                  La carga al
                  <input
                    type="number"
                    min={40}
                    max={95}
                    value={regla.deload.workingLoadShare}
                    onChange={(e) => cambiar({ deload: { ...regla.deload!, mode: 'LOAD', workingLoadShare: Math.max(40, Math.min(95, Math.round(leer(e.target.value, regla.deload!.workingLoadShare)))) } })}
                    data-campo="parte-de-la-descarga"
                  />
                  % de la carga de trabajo de la semana anterior
                </label>
                <label className="casilla">
                  <input type="radio" name={`${id}-descarga`} checked={regla.deload.mode === 'SETS'} onChange={() => cambiar({ deload: { ...regla.deload!, mode: 'SETS' } })} />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={regla.deload.setsRemoved}
                    onChange={(e) => cambiar({ deload: { ...regla.deload!, mode: 'SETS', setsRemoved: Math.max(1, Math.min(10, Math.round(leer(e.target.value, regla.deload!.setsRemoved)))) } })}
                    data-campo="series-menos"
                  />
                  series menos, con la misma carga
                </label>
              </div>
            ) : null}
            {/* RP-19: el aviso de la descarga fuera de la fase tiene su renglón. */}
            <p className="nota asistente-de-progresion__aviso">{descargaFuera ?? ' '}</p>
          </fieldset>
        </div>

        <section className="asistente-de-progresion__vista-previa" aria-labelledby={`${id}-vista`} data-vista-previa={afectados.length}>
          <h3 id={`${id}-vista`} className="asistente-de-progresion__subtitulo">
            {P.vistaPrevia}
            <span className="nota"> · {conRegla ? progresionEnPalabras(regla, unidad) : P.sinModelo}</span>
          </h3>
          {afectados.length === 0 ? (
            <p className="nota">{ejercicios.length === 0 ? 'La fase todavía no tiene ejercicios.' : elegidos !== null ? 'Elegí los ejercicios para ver cómo quedan.' : 'Todos los ejercicios de la fase tienen su regla propia.'}</p>
          ) : (
            <>
              <label className="asistente-de-progresion__muestra">
                {P.ejemploDeMuestra}
                <select value={deMuestra ? claveDe(deMuestra) : ''} onChange={(e) => setMuestra(e.target.value)} data-campo="ejercicio-de-muestra">
                  {afectados.map((e) => (
                    <option key={claveDe(e)} value={claveDe(e)}>
                      {e.nombre} · {e.sesion}
                    </option>
                  ))}
                </select>
              </label>
              {fila && deMuestra ? (
                <>
                  {fila.semanas.some((s) => s.carga !== null) ? (
                    <GraficoDeSemanas
                      titulo={`${fila.nombre}: la carga de trabajo por semana`}
                      semanas={semanas}
                      unidad={fila.unidad}
                      descargas={fila.semanas.filter((s) => s.descarga).map((s) => s.semana)}
                      series={[{ clave: 'plan', nombre: 'Planificado', forma: 'plan', valores: fila.semanas.map((s) => s.carga) }]}
                      pie={<p className="nota">{P.redondeo(numero(fila.paso, 1), fila.unidad)}</p>}
                    />
                  ) : (
                    <p className="nota">«{fila.nombre}» no tiene carga de trabajo escrita: la regla mueve solo sus repeticiones o sus series.</p>
                  )}
                  <div className="desplazable-x">
                    <table className="tabla tabla--compacta asistente-de-progresion__tabla" data-tabla-de-la-progresion>
                      <caption className="visualmente-oculto">Las semanas de {fila.nombre}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Semana</th>
                          {fila.semanas.map((s) => (
                            <th key={s.semana} scope="col" data-descarga={s.descarga ? '' : undefined}>
                              {P.sem(s.semana)}
                              {s.descarga ? <span className="asistente-de-progresion__marca-de-descarga">descarga</span> : null}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">Carga</th>
                          {fila.semanas.map((s) => (
                            <td key={s.semana} data-descarga={s.descarga ? '' : undefined}>
                              {celdaDeLaSemana(s, fila.unidad, seriesDeBase)}
                              {s.ola ? <span className="nota"> {P.ola[s.ola]}</span> : null}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </>
          )}
        </section>
      </div>
    </CuadroEnfocado>
  );
}
