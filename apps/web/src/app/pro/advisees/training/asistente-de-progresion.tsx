'use client';

/**
 * DL-196 parte B (E12 y E19) · el asistente de «Progresión…» de una fase: corto, sin abrumar.
 *
 * - **Un modelo por vez** (lineal, doble progresión u ondulante), con su «?» y un ejemplo; la semana de descarga se suma
 *   a cualquiera o va sola. Todo «%» dice su base: «% de la carga de trabajo».
 * - **A toda la fase o a los ejercicios elegidos.**
 * - **La vista previa antes de aplicar:** el gráfico X/Y de un ejercicio (las semanas en X, la carga en Y, con la curva y
 *   el escalón de la descarga) y la tabla semana × ejercicio. Las cargas se redondean como las aproximaciones (EE-D03).
 * - **Se guarda como regla de la fase** (EE-D30) y se puede volver a usar: «Partir de la de…» trae la de otra fase.
 * - Desde la copia de una fase (E19), «Arrancar donde terminó…» sube las cargas de la copia a las de la última semana de
 *   la original antes de aplicar la regla.
 * Nada se escribe hasta «Aplicar a la fase».
 */
import {
  COPY_PROGRESIONES as P,
  DESCARGA_POR_OMISION,
  numero,
  OLAS_POR_OMISION,
  progresionEnPalabras,
  progresionPorOmision,
  type AproximacionesDelEjercicio,
  type ModeloDeProgresion,
  type ProgresionDeLaFase,
} from '@be/domain';
import { useEffect, useId, useMemo, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { GraficoDeSemanas } from './grafico-de-semanas';
import { celdaDeLaSemana, vistaPrevia, type EjercicioDeLaFase } from './progresion-del-editor';

const MODELOS: readonly (ModeloDeProgresion | null)[] = [null, 'LINEAR', 'DOUBLE', 'UNDULATING'];
const SEMANAS_SI_NO_TIENE = 4;

export interface ProgresionDeOtraFase {
  readonly fase: string;
  readonly progresion: ProgresionDeLaFase;
}

export interface AplicacionDeLaProgresion {
  readonly progresion: ProgresionDeLaFase | null;
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

export function AsistenteDeProgresion({
  abierto,
  persona,
  fase,
  blockId,
  semanasDeLaFase,
  ejercicios,
  aproximacionesDe,
  actual,
  otras,
  desdeLaCopia = null,
  onAplicar,
  onCerrar,
}: {
  abierto: boolean;
  persona: string | null;
  fase: string;
  blockId: string;
  semanasDeLaFase: number | null;
  ejercicios: readonly EjercicioDeLaFase[];
  aproximacionesDe: (id: string | null) => AproximacionesDelEjercicio | null;
  actual: ProgresionDeLaFase | null;
  otras: readonly ProgresionDeOtraFase[];
  /** E19: la copia recién hecha de otra fase, con la regla y los ejercicios de la original. */
  desdeLaCopia?: { readonly original: string; readonly progresion: ProgresionDeLaFase | null; readonly ejercicios: readonly EjercicioDeLaFase[]; readonly semanas: number | null } | null;
  onAplicar: (a: AplicacionDeLaProgresion) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const pasoDeEntrada = ejercicios.length > 0 ? vistaPrevia(progresionPorOmision(blockId, null, 2.5), ejercicios.slice(0, 1), 1, aproximacionesDe)[0]?.paso ?? 2.5 : 2.5;
  const inicial = actual ?? desdeLaCopia?.progresion ?? progresionPorOmision(blockId, 'LINEAR', pasoDeEntrada);
  const [regla, setRegla] = useState<ProgresionDeLaFase>({ ...inicial, blockId });
  const [semanas, setSemanas] = useState<number>(semanasDeLaFase ?? SEMANAS_SI_NO_TIENE);
  const [arrancar, setArrancar] = useState<boolean>(desdeLaCopia?.progresion != null);
  const [miro, setMiro] = useState<string | null>(null);
  // Al abrirse de nuevo (otra fase, o la misma con otra regla), empieza desde lo guardado.
  useEffect(() => {
    if (!abierto) return;
    setRegla({ ...(actual ?? desdeLaCopia?.progresion ?? progresionPorOmision(blockId, 'LINEAR', pasoDeEntrada)), blockId });
    setSemanas(semanasDeLaFase ?? SEMANAS_SI_NO_TIENE);
    setArrancar(desdeLaCopia?.progresion != null);
    setMiro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, blockId]);

  const cambiar = (c: Partial<ProgresionDeLaFase>) => setRegla((r) => ({ ...r, ...c }));
  const elegirModelo = (m: ModeloDeProgresion | null) => {
    const base = progresionPorOmision(blockId, m, pasoDeEntrada);
    setRegla((r) => ({ ...base, deload: r.deload, prescriptionIds: r.prescriptionIds }));
  };
  const unidades = new Set(ejercicios.map((e) => e.prescripcion.suggestedLoad?.unit ?? e.prescripcion.sets.find((s) => s.suggestedLoad)?.suggestedLoad?.unit ?? 'kg'));
  const unidad = unidades.size === 1 ? [...unidades][0]! : 'kg';
  const unidadEnTexto = unidades.size > 1 ? 'kg o lb, según el ejercicio' : unidad;
  const conRegla = regla.model !== null || regla.deload !== null;
  const filas = useMemo(() => (conRegla ? vistaPrevia(regla, ejercicios, semanas, aproximacionesDe) : []), [conRegla, regla, ejercicios, semanas, aproximacionesDe]);
  const vista = filas.find((f) => (f.prescriptionId ?? f.nombre) === miro) ?? filas[0] ?? null;
  const elegidos = regla.prescriptionIds;
  const alternarElegido = (pid: string) => {
    const lista = elegidos ?? [];
    const nueva = lista.includes(pid) ? lista.filter((x) => x !== pid) : [...lista, pid];
    cambiar({ prescriptionIds: nueva.length > 0 ? nueva : [] });
  };
  const sinElegidos = elegidos !== null && elegidos.length === 0;
  const descargaFuera = regla.deload && regla.deload.week > semanas ? P.fueraDeLaFase(regla.deload.week, semanas) : null;
  const seriesDeBase = new Map(filas.map((f) => [f.prescriptionId ?? f.nombre, ejercicios.find((e) => (e.prescriptionId ?? e.nombre) === (f.prescriptionId ?? f.nombre))?.prescripcion.sets.filter((s) => s.setKind !== 'WARM_UP').length ?? null]));

  const aplicar = () =>
    onAplicar({
      progresion: conRegla ? { ...regla, prescriptionIds: elegidos && elegidos.length > 0 ? elegidos : null } : null,
      semanas: semanasDeLaFase === null ? semanas : null,
      arrancarDondeTermino: arrancar && desdeLaCopia?.progresion != null,
    });

  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="panel"
      titulo={`${P.titulo} · ${fase}`}
      sobretitulo={persona}
      className="asistente-de-progresion"
      onCerrar={onCerrar}
      ancho
      principal={{ texto: conRegla ? P.aplicar : actual ? P.quitar : P.aplicar, alTocar: aplicar, apagado: sinElegidos ? 'Elegí al menos un ejercicio, o aplicala a toda la fase.' : ejercicios.length === 0 ? 'La fase todavía no tiene ejercicios.' : null }}
      pie={<p className="nota">{P.comoSeVe}</p>}
    >
      <div className="asistente-de-progresion__cuerpo" data-asistente-de-progresion={blockId}>

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

        {otras.length > 0 ? (
          <div className="asistente-de-progresion__otras">
            {otras.map((o) => (
              <button key={o.fase} type="button" className="chip-de-zona" onClick={() => setRegla({ ...o.progresion, blockId, prescriptionIds: null })} data-usar-la-de={o.fase}>
                {P.usarLaDe(o.fase)}
              </button>
            ))}
          </div>
        ) : null}

        <fieldset className="asistente-de-progresion__modelos">
          <legend>Modelo</legend>
          {/* El «?» de la esquina: qué es la regla y un ejemplo de cada modelo. */}
          <ExplicacionAPedido nombre="Cómo funciona la progresión, con ejemplos" como="div" lugar="esquina">
            <p>Una regla para toda la fase: cómo cambia la carga de trabajo semana a semana. La sesión sigue siendo la misma; la regla se lee encima.</p>
            {MODELOS.flatMap((m) =>
              m ? [
                <p key={m}>
                  <strong>{P.modelos[m]}.</strong> {P.queHace[m]} {P.ejemplos[m]}
                </p>,
              ] : [],
            )}
            <p>Las cargas se redondean como las aproximaciones: al paso del implemento (2,5 kg en la barra, 5 kg en una máquina, 1 kg en las mancuernas livianas).</p>
          </ExplicacionAPedido>
          <div className="selector-segmentado" role="radiogroup" aria-label="Modelo de progresión">
            {MODELOS.map((m) => (
              <label key={m ?? 'ninguno'} className="selector-segmentado__opcion" data-modelo={m ?? 'ninguno'}>
                <input type="radio" name={`${id}-modelo`} checked={regla.model === m} onChange={() => elegirModelo(m)} />
                <span>{m ? P.modelos[m] : P.sinModelo}</span>
              </label>
            ))}
          </div>
          {regla.model ? (
            <p className="asistente-de-progresion__que-hace nota">
              {P.queHace[regla.model]} {P.ejemplos[regla.model]}
            </p>
          ) : (
            <p className="asistente-de-progresion__que-hace nota">La carga de trabajo queda igual todas las semanas; podés sumar solo una descarga.</p>
          )}
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
          <ExplicacionAPedido nombre="Qué es la semana de descarga, con un ejemplo" como="div" lugar="esquina">
            <p>{P.descargaQueHace}</p>
            <p>{P.descargaEjemplo}</p>
          </ExplicacionAPedido>
          <div className="asistente-de-progresion__fila">
            <label className="casilla">
              <input
                type="checkbox"
                checked={regla.deload !== null}
                onChange={(e) => cambiar({ deload: e.target.checked ? { week: Math.min(semanas, 4), ...DESCARGA_POR_OMISION } : null })}
                data-descarga
              />
              {P.descarga}
            </label>
            {regla.deload ? (
              <>
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
              </>
            ) : null}
          </div>
          {regla.deload ? (
            <div className="asistente-de-progresion__fila" role="radiogroup" aria-label="Cómo es la descarga">
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

        <fieldset className="asistente-de-progresion__alcance">
          <legend>A qué se aplica</legend>
          <div className="asistente-de-progresion__fila" role="radiogroup">
            <label className="casilla">
              <input type="radio" name={`${id}-alcance`} checked={elegidos === null} onChange={() => cambiar({ prescriptionIds: null })} data-alcance="fase" />
              {P.aToda} · {ejercicios.length === 1 ? '1 ejercicio' : `${ejercicios.length} ejercicios`}
            </label>
            <label className="casilla">
              <input type="radio" name={`${id}-alcance`} checked={elegidos !== null} onChange={() => cambiar({ prescriptionIds: [] })} data-alcance="elegidos" />
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
            <ul className="asistente-de-progresion__elegidos" role="list">
              {ejercicios.map((e) =>
                e.prescriptionId ? (
                  <li key={e.prescriptionId}>
                    <label className="casilla">
                      <input type="checkbox" checked={elegidos.includes(e.prescriptionId)} onChange={() => alternarElegido(e.prescriptionId!)} />
                      {e.nombre} <span className="nota">· {e.sesion}</span>
                    </label>
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}
        </fieldset>

        <section className="asistente-de-progresion__vista-previa" aria-labelledby={`${id}-vista`} data-vista-previa={filas.length}>
          <h3 id={`${id}-vista`} className="asistente-de-progresion__subtitulo">
            {P.vistaPrevia}
            {conRegla ? <span className="nota"> · {progresionEnPalabras(regla, unidad)}</span> : null}
          </h3>
          {!conRegla ? (
            <p className="nota">Sin progresión ni descarga: la carga de trabajo queda igual todas las semanas.</p>
          ) : filas.length === 0 ? (
            <p className="nota">{ejercicios.length === 0 ? 'La fase todavía no tiene ejercicios.' : 'Elegí los ejercicios para ver cómo quedan.'}</p>
          ) : (
            <>
              {filas.length > 1 ? (
                <div className="asistente-de-progresion__ver" role="group" aria-label="Qué ejercicio se dibuja">
                  {filas.map((f) => (
                    <button key={f.prescriptionId ?? f.nombre} type="button" className="chip-de-zona" aria-pressed={vista === f} onClick={() => setMiro(f.prescriptionId ?? f.nombre)}>
                      {f.nombre}
                    </button>
                  ))}
                </div>
              ) : null}
              {vista ? (
                vista.semanas.some((s) => s.carga !== null) ? (
                  <GraficoDeSemanas
                    titulo={`${vista.nombre}: la carga de trabajo por semana`}
                    semanas={semanas}
                    unidad={vista.unidad}
                    descargas={vista.semanas.filter((s) => s.descarga).map((s) => s.semana)}
                    series={[{ clave: 'plan', nombre: 'Planificado', forma: 'plan', valores: vista.semanas.map((s) => s.carga) }]}
                    pie={<p className="nota">{P.redondeo(numero(vista.paso, 1), vista.unidad)}</p>}
                  />
                ) : (
                  <p className="nota">«{vista.nombre}» no tiene carga de trabajo escrita: la regla mueve solo sus repeticiones o sus series.</p>
                )
              ) : null}
              <div className="desplazable-x">
                <table className="tabla tabla--compacta asistente-de-progresion__tabla" data-tabla-de-la-progresion>
                  <caption className="visualmente-oculto">Semana por ejercicio</caption>
                  <thead>
                    <tr>
                      <th scope="col">Ejercicio</th>
                      {Array.from({ length: semanas }, (_, k) => (
                        <th key={k} scope="col" data-descarga={filas[0]?.semanas[k]?.descarga ? '' : undefined}>
                          {P.sem(k + 1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f) => (
                      <tr key={f.prescriptionId ?? f.nombre}>
                        <th scope="row">{f.nombre}</th>
                        {f.semanas.map((s) => (
                          <td key={s.semana} data-descarga={s.descarga ? '' : undefined}>
                            {celdaDeLaSemana(s, f.unidad, seriesDeBase.get(f.prescriptionId ?? f.nombre) ?? null)}
                            {s.ola ? <span className="nota"> {P.ola[s.ola]}</span> : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </CuadroEnfocado>
  );
}
