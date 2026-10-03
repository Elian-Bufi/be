'use client';

/**
 * La evolución de una métrica antropométrica, vista (B10-07; API-ANT-06; RF-049). Gráfico, panel de la observación
 * elegida y tabla se dibujan con la misma preparación de la serie (`prepararSerie`, en @be/domain), así no pueden decir
 * cosas distintas.
 *
 * - **Solo puntos, sobre un eje temporal a escala.** Nada une dos observaciones: un tramo sin medición queda vacío, y
 *   sigue en la tabla como hueco con sus días (REG-06-165/166; INV-06-176/177). Sin interpolación, suavizado ni
 *   tendencia calculada.
 * - **Un eje por grupo de comparabilidad.** Si la métrica tiene observaciones con otro protocolo, método o unidad, se
 *   elige el grupo que se ve; nunca se mezclan unidades en el mismo eje ni se convierten (REG-06-162/164).
 * - **La selección es por `sourceId`.** Dos observaciones el mismo día son dos puntos («1 de 2 del día»), y el panel
 *   muestra la que se eligió, no la de una fecha.
 * - **Accesible** (B10-10 §11): clic, toque y teclado (flechas, Inicio, Fin) eligen; el recuadro flotante es solo para
 *   el puntero; la tabla equivalente tiene todo. La corrección vigente se marca por texto, y la no comparabilidad, por
 *   forma (rombo) y por texto: el tema no puede ocultar la diferencia.
 * - **El origen se abre por la ruta existente** (Evaluaciones, con la evaluación preseleccionada): no concede permisos
 *   ni precarga nada.
 */
import {
  cantidad,
  COPY_ANTROPOMETRIA,
  COPY_EVOLUCION,
  diasEnPalabras,
  diferenciaDescriptiva,
  decimalesDelEje,
  dominioDelEjeVertical,
  ETIQUETA_DE_CLASE_DE_DATO,
  fechaCivil,
  grupoVigente,
  limitesDelPeriodo,
  marcasDelPeriodo,
  metodoEnPalabras,
  motivosEnPalabras,
  nombreDelGrupo,
  nombreDeMetrica,
  numero,
  observacionesDelGrupo,
  observacionPorId,
  prepararSerie,
  protocoloEnPalabras,
  resumenDeObservacion,
  textoDeDiferenciaAntropometrica,
  unidadDelGrupo,
  type Observacion,
  type SerieApi,
  type SeriePreparada,
} from '@be/domain';
import { useEffect, useId, useMemo, useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Ayuda } from '../../../../components/ayuda';
import { Aviso } from '../../../../components/formulario';
import { diaCivil, fechaEnZona } from '../../../../lib/formato';
import { indiceConTeclado, useConPuntero } from '../../../../lib/graficos';

const ALTO = 300;


export function EvolucionDeMetrica({
  serie,
  zonaHoraria,
  periodo,
  onAbrirEvaluacion,
}: {
  serie: SerieApi;
  zonaHoraria: string;
  periodo: { readonly start: string; readonly end: string };
  onAbrirEvaluacion: (evaluationId: string) => void;
}) {
  const id = useId();
  const preparada = useMemo(() => prepararSerie(serie, zonaHoraria), [serie, zonaHoraria]);
  const [grupoPedido, setGrupoPedido] = useState<string | null>(null);
  const grupo = grupoVigente(preparada, grupoPedido);
  const visibles = useMemo(() => (grupo ? observacionesDelGrupo(preparada, grupo) : []), [preparada, grupo]);
  // La selección es por identidad: si la observación ya no está (cambió el período o el grupo), no queda un detalle viejo.
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const elegida = observacionPorId(preparada, elegidaId);
  const elegidaVisible = elegida && elegida.punto.comparabilityGroup === grupo ? elegida : null;
  // La comparada vale solo si existe, está en el grupo visible y no es la misma observación elegida: si la persona
  // pasa a elegir como principal la que estaba comparando, la comparación se vacía en el estado y en el selector.
  const [comparadaId, setComparadaId] = useState<string | null>(null);
  const comparadaCandidata = observacionPorId(preparada, comparadaId);
  const comparada = comparadaCandidata && comparadaCandidata.punto.comparabilityGroup === grupo && comparadaCandidata.punto.sourceId !== elegidaVisible?.punto.sourceId ? comparadaCandidata : null;
  useEffect(() => {
    if (elegidaId && !elegidaVisible) setElegidaId(null);
    if (comparadaId && !comparada) setComparadaId(null);
  }, [elegidaId, elegidaVisible, comparadaId, comparada]);

  const ficha = preparada.grupos.find((g) => g.comparabilityGroup === grupo) ?? null;
  const unidad = visibles[0] ? unidadDelGrupo(ficha, visibles[0].punto) : (ficha?.unit ?? '');
  const titulo = `${COPY_ANTROPOMETRIA.evolucion}: ${nombreDeMetrica(serie.metricCode)}${ficha ? ` · ${nombreDelGrupo(ficha, preparada.grupos)}` : ''}`;
  const indiceElegido = elegidaVisible ? visibles.findIndex((o) => o.punto.sourceId === elegidaVisible.punto.sourceId) : null;

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{nombreDeMetrica(serie.metricCode)}</h2>
      {/* DL-113 · cómo se leen el gráfico y la tabla, plegado: arriba quedan los datos. */}
      <Ayuda>
        <p>{COPY_ANTROPOMETRIA.explicacionDeSinDato}</p>
        <p>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</p>
        <p>{COPY_EVOLUCION.tablaAclaracion}</p>
      </Ayuda>
      {preparada.observaciones.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinMediciones}</p> : null}
      {preparada.variosGrupos ? (
        <>
          <Aviso tipo="info">
            <p>{COPY_EVOLUCION.variosGrupos}</p>
          </Aviso>
          <div className="campo grafico__controles">
            <label htmlFor={`${id}-grupo`}>{COPY_EVOLUCION.grupo}</label>
            <select id={`${id}-grupo`} value={grupo ?? ''} onChange={(e) => setGrupoPedido(e.target.value)}>
              {preparada.grupos
                .filter((g) => preparada.observaciones.some((o) => o.punto.comparabilityGroup === g.comparabilityGroup))
                .map((g) => (
                  <option key={g.comparabilityGroup} value={g.comparabilityGroup}>
                    {nombreDelGrupo(g, preparada.grupos)} ({numero(observacionesDelGrupo(preparada, g.comparabilityGroup).length)})
                  </option>
                ))}
            </select>
          </div>
        </>
      ) : null}
      {visibles.length === 1 ? <p className="nota">{COPY_EVOLUCION.unaSola}</p> : null}
      {visibles.length > 0 ? (
        <Grafico id={id} titulo={titulo} visibles={visibles} unidad={unidad} periodo={periodo} zonaHoraria={zonaHoraria} elegido={indiceElegido} onElegir={(i) => setElegidaId(i === null ? null : (visibles[i]?.punto.sourceId ?? null))} />
      ) : null}
      <div aria-live="polite">
        {elegidaVisible ? (
          <Detalle observacion={elegidaVisible} ficha={ficha} grupos={preparada.grupos} unidad={unidad} zonaHoraria={zonaHoraria} onAbrir={onAbrirEvaluacion}>
            {visibles.length > 1 ? (
              <Comparacion id={id} elegida={elegidaVisible} candidatas={visibles.filter((o) => o.punto.sourceId !== elegidaVisible.punto.sourceId)} comparada={comparada} zonaHoraria={zonaHoraria} onElegir={setComparadaId} />
            ) : null}
          </Detalle>
        ) : visibles.length > 0 ? (
          <p className="nota">{COPY_EVOLUCION.ninguna}</p>
        ) : null}
      </div>
      <Tabla preparada={preparada} grupo={grupo} zonaHoraria={zonaHoraria} elegidaId={elegidaVisible?.punto.sourceId ?? null} onElegir={setElegidaId} />
    </section>
  );
}

interface Dato {
  readonly x: number;
  readonly y: number;
  readonly sourceId: string;
}

function Grafico({
  id,
  titulo,
  visibles,
  unidad,
  periodo,
  zonaHoraria,
  elegido,
  onElegir,
}: {
  id: string;
  titulo: string;
  visibles: readonly Observacion[];
  unidad: string;
  periodo: { readonly start: string; readonly end: string };
  zonaHoraria: string;
  elegido: number | null;
  onElegir: (i: number | null) => void;
}) {
  const conPuntero = useConPuntero();
  const datos: Dato[] = visibles.map((o) => ({ x: o.instante, y: o.punto.value, sourceId: o.punto.sourceId }));
  // El eje vertical con margen arriba y abajo, sin forzar el cero: la regla es la misma que en la APK. Se calcula con el
  // mínimo y el máximo juntos, así los índices (≈ 0,85) se redondean en centésimas y sus rótulos llevan esos decimales.
  const valores = datos.map((d) => d.y);
  const minimo = valores.length > 0 ? Math.min(...valores) : 0;
  const maximo = valores.length > 0 ? Math.max(...valores) : 1;
  const dominio = dominioDelEjeVertical(minimo, maximo);
  const decimales = Math.max(1, decimalesDelEje(minimo, maximo));
  // El eje cubre el período pedido, a escala y recortado en la zona del período (la misma con la que la API lo recortó):
  // un mes con dos mediciones se ve como un mes, y una toma de las 23:30 del último día sigue adentro aunque el
  // navegador esté en otra zona. Las marcas son fechas civiles de esa zona, nunca posteriores al último día.
  const { desde, hasta } = limitesDelPeriodo(periodo, zonaHoraria);
  const marcas = marcasDelPeriodo(periodo, zonaHoraria);
  const resumen = visibles.map((o) => `${diaCivil(o.fecha)}${o.delDia.total > 1 ? ` (${COPY_EVOLUCION.delDia(o.delDia.orden, o.delDia.total)})` : ''}: ${resumenDeObservacion(o)}`).join('. ');
  return (
    <figure className="grafico__figura">
      <figcaption className="nota">
        {titulo}. {COPY_EVOLUCION.ejeTemporal} {COPY_EVOLUCION.zona(zonaHoraria)}
      </figcaption>
      <div
        className="grafico__lienzo"
        tabIndex={0}
        role="group"
        onClick={(e) => e.currentTarget.focus({ preventScroll: true })}
        aria-label={`${titulo}. ${resumen}. Usá las flechas para recorrer las observaciones; la elegida se describe debajo del gráfico.`}
        onKeyDown={(e) => {
          const i = indiceConTeclado(e, elegido, visibles.length);
          if (i === null) return;
          e.preventDefault();
          onElegir(i);
        }}
      >
        <ResponsiveContainer height={ALTO} initialDimension={{ width: 640, height: ALTO }}>
          <ScatterChart margin={{ top: 20, right: 24, bottom: 8, left: 4 }} accessibilityLayer={false}>
            <CartesianGrid stroke="var(--borde)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[desde, hasta]}
              ticks={marcas.map((m) => m.instante)}
              interval={0}
              // El rótulo se dibuja acá, con la fecha civil de la zona del período: no depende del filtrado de marcas de
              // Recharts ni de la zona del navegador.
              tick={({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value?: number } }) => (
                <g transform={`translate(${x ?? 0},${y ?? 0})`}>
                  <text textAnchor="middle" dy={14} className="grafico__tick">
                    {Number.isFinite(Number(payload?.value)) ? diaCivil(fechaCivil(new Date(Number(payload?.value)).toISOString(), zonaHoraria)) : ''}
                  </text>
                </g>
              )}
              axisLine={{ stroke: 'var(--borde-control)' }}
              tickLine={false}
              height={36}
            />
            <YAxis dataKey="y" type="number" domain={[dominio.desde, dominio.hasta]} width={56} tickFormatter={(v: number) => numero(v, decimales)} tick={{ fill: 'var(--tenue)', fontSize: 12 }} axisLine={{ stroke: 'var(--borde-control)' }} label={{ value: unidad, angle: -90, position: 'insideLeft', fill: 'var(--tenue)', fontSize: 12 }} />
            {conPuntero ? <Tooltip cursor={false} content={({ active, payload }) => (active && payload?.[0] ? <Recuadro observacion={visibles.find((o) => o.punto.sourceId === (payload[0]!.payload as Dato).sourceId)} zonaHoraria={zonaHoraria} /> : null)} /> : null}
            <Scatter
              data={datos}
              isAnimationActive={false}
              shape={(props: { cx?: number; cy?: number; payload?: Dato }) => {
                const o = visibles.find((v) => v.punto.sourceId === props.payload?.sourceId);
                const i = visibles.indexOf(o as Observacion);
                if (props.cx === undefined || props.cy === undefined || !o) return <g />;
                const esElegido = i === elegido;
                const noComparable = o.punto.incomparableWithPrevious.length > 0;
                return (
                  <g className="grafico__elegible" onClick={() => onElegir(i)} aria-hidden="true">
                    {esElegido ? <circle cx={props.cx} cy={props.cy} r={11} fill="none" stroke="var(--foco)" strokeWidth={3} /> : null}
                    {noComparable ? (
                      <rect x={props.cx - 6} y={props.cy - 6} width={12} height={12} transform={`rotate(45 ${props.cx} ${props.cy})`} fill="var(--grafico-registrado)" stroke="var(--superficie)" strokeWidth={1.5} />
                    ) : (
                      <circle cx={props.cx} cy={props.cy} r={6} fill="var(--grafico-registrado)" stroke="var(--superficie)" strokeWidth={1.5} />
                    )}
                    {o.punto.correctionState === 'CORRECTED' ? <circle cx={props.cx} cy={props.cy} r={2} fill="var(--superficie)" /> : null}
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <ul className="leyenda" aria-label="Leyenda">
        <li>
          <span className="muestra muestra--punto" aria-hidden="true" /> Observación comparable con la anterior
        </li>
        <li>
          <span className="muestra muestra--rombo" aria-hidden="true" /> {COPY_ANTROPOMETRIA.noComparable} (el motivo, en la tabla)
        </li>
        <li>Un punto con centro claro: valor corregido</li>
      </ul>
    </figure>
  );
}

function Recuadro({ observacion: o, zonaHoraria }: { observacion: Observacion | undefined; zonaHoraria: string }) {
  if (!o) return null;
  return (
    <div className="grafico__tooltip">
      <p>
        <strong>{fechaEnZona(o.punto.occurredAt, zonaHoraria)}</strong>
        {o.delDia.total > 1 ? ` · ${COPY_EVOLUCION.delDia(o.delDia.orden, o.delDia.total)}` : ''}
      </p>
      <p>{resumenDeObservacion(o)}</p>
      <p className="nota">Clic o toque para ver el detalle</p>
    </div>
  );
}

function Detalle({ observacion: o, ficha, grupos, unidad, zonaHoraria, onAbrir, children }: { observacion: Observacion; ficha: SeriePreparada['grupos'][number] | null; grupos: SeriePreparada['grupos']; unidad: string; zonaHoraria: string; onAbrir: (evaluationId: string) => void; children?: React.ReactNode }) {
  const motivos = motivosEnPalabras(o);
  return (
    <div className="detalle-de-valores">
      <h4>
        {COPY_EVOLUCION.puntoElegido}: {fechaEnZona(o.punto.occurredAt, zonaHoraria)}
        {o.delDia.total > 1 ? ` · ${COPY_EVOLUCION.delDia(o.delDia.orden, o.delDia.total)}` : ''}
      </h4>
      <dl>
        <dt>{COPY_EVOLUCION.valor}</dt>
        <dd>{cantidad(o.punto.value, unidad)}</dd>
        <dt>{COPY_EVOLUCION.momento}</dt>
        <dd>{fechaEnZona(o.punto.occurredAt, zonaHoraria)}</dd>
        <dt>{COPY_EVOLUCION.registro}</dt>
        <dd>{fechaEnZona(o.punto.recordedAt, zonaHoraria)}</dd>
        <dt>{COPY_EVOLUCION.clase}</dt>
        <dd>{ETIQUETA_DE_CLASE_DE_DATO[o.punto.dataClass]}</dd>
        <dt>{COPY_EVOLUCION.protocolo}</dt>
        <dd>{ficha ? protocoloEnPalabras(ficha, grupos) : '—'}</dd>
        {ficha?.methodVersionId ? (
          <>
            <dt>{COPY_EVOLUCION.metodo}</dt>
            <dd>{metodoEnPalabras(ficha.methodVersionId)}</dd>
          </>
        ) : null}
        <dt>{COPY_EVOLUCION.correccion}</dt>
        <dd>{o.punto.correctionState === 'CORRECTED' ? COPY_EVOLUCION.vieneDeCorreccion : COPY_EVOLUCION.sinCorreccion}</dd>
        <dt>{COPY_EVOLUCION.comparabilidad}</dt>
        <dd>{motivos.length === 0 ? COPY_ANTROPOMETRIA.comparableConElAnterior : `${COPY_ANTROPOMETRIA.noComparable}: ${motivos.join(', ')}`}</dd>
      </dl>
      <button type="button" className="boton boton--secundario" onClick={() => onAbrir(o.punto.sourceEvaluationId)}>
        {COPY_EVOLUCION.abrirEvaluacion}
      </button>
      {children}
    </div>
  );
}

function Comparacion({ id, elegida, candidatas, comparada, zonaHoraria, onElegir }: { id: string; elegida: Observacion; candidatas: readonly Observacion[]; comparada: Observacion | null; zonaHoraria: string; onElegir: (sourceId: string | null) => void }) {
  const d = comparada ? diferenciaDescriptiva(elegida, comparada) : null;
  return (
    <div className="campo">
      <label htmlFor={`${id}-comparar`}>{COPY_EVOLUCION.compararCon}</label>
      <select id={`${id}-comparar`} value={comparada?.punto.sourceId ?? ''} onChange={(e) => onElegir(e.target.value || null)}>
        <option value="">{COPY_EVOLUCION.sinComparar}</option>
        {candidatas.map((o) => (
          <option key={o.punto.sourceId} value={o.punto.sourceId}>
            {fechaEnZona(o.punto.occurredAt, zonaHoraria)} · {resumenDeObservacion(o)}
          </option>
        ))}
      </select>
      {comparada ? (
        <p>
          <strong>{COPY_EVOLUCION.diferencia}:</strong> {d ? `${textoDeDiferenciaAntropometrica(d)}, ${diasEnPalabras(d.dias)}` : COPY_EVOLUCION.noComparables}
          <br />
          <span className="nota">{COPY_EVOLUCION.diferenciaAclaracion}</span>
        </p>
      ) : null}
    </div>
  );
}

function Tabla({ preparada, grupo, zonaHoraria, elegidaId, onElegir }: { preparada: SeriePreparada; grupo: string | null; zonaHoraria: string; elegidaId: string | null; onElegir: (sourceId: string) => void }) {
  const diasSinDato = preparada.filas.reduce((n, f) => (f.tipo === 'hueco' ? n + f.hueco.days : n), 0);
  return (
    <>
      <table className="tabla">
        <caption className="nota">
          {COPY_EVOLUCION.tabla}: {numero(preparada.observaciones.length)} con dato · {numero(diasSinDato)} {COPY_ANTROPOMETRIA.sinDato.toLowerCase()}
        </caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">{COPY_ANTROPOMETRIA.valor}</th>
            <th scope="col">Cómo se obtuvo</th>
            <th scope="col">Comparabilidad</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {preparada.filas.map((f) =>
            f.tipo === 'hueco' ? (
              <tr key={`hueco-${f.hueco.from}`}>
                <th scope="row">{f.hueco.days === 1 ? diaCivil(f.hueco.from) : `${diaCivil(f.hueco.from)} — ${diaCivil(f.hueco.to)}`}</th>
                <td data-etiqueta={COPY_ANTROPOMETRIA.valor}>
                  <span className="insignia">{f.hueco.days === 1 ? COPY_ANTROPOMETRIA.sinDato : `${numero(f.hueco.days)} días ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`}</span>
                </td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            ) : (
              <tr key={f.observacion.punto.sourceId} aria-current={f.observacion.punto.sourceId === elegidaId ? 'true' : undefined}>
                <th scope="row">
                  {fechaEnZona(f.observacion.punto.occurredAt, zonaHoraria)}
                  {f.observacion.delDia.total > 1 ? ` · ${COPY_EVOLUCION.delDia(f.observacion.delDia.orden, f.observacion.delDia.total)}` : ''}
                </th>
                <td data-etiqueta={COPY_ANTROPOMETRIA.valor}>
                  {cantidad(f.observacion.punto.value, unidadDelGrupo(f.observacion.grupo, f.observacion.punto))}
                  {f.observacion.punto.correctionState === 'CORRECTED' ? (
                    <>
                      {' '}
                      <span className="insignia">{COPY_ANTROPOMETRIA.corregida}</span>
                    </>
                  ) : null}
                </td>
                <td data-etiqueta="Cómo se obtuvo">
                  {ETIQUETA_DE_CLASE_DE_DATO[f.observacion.punto.dataClass]}
                  {f.observacion.grupo ? ` · ${f.observacion.grupo.protocolName}` : ''}
                </td>
                <td data-etiqueta="Comparabilidad">
                  {f.observacion.punto.incomparableWithPrevious.length === 0 ? COPY_ANTROPOMETRIA.comparableConElAnterior : `${COPY_ANTROPOMETRIA.noComparable}: ${motivosEnPalabras(f.observacion).join(', ')}`}
                  {grupo && f.observacion.punto.comparabilityGroup !== grupo ? ' · en otro grupo, no está en el gráfico actual' : ''}
                </td>
                <td data-etiqueta="Acciones">
                  {f.observacion.punto.comparabilityGroup === grupo ? (
                    <button type="button" className="boton boton--enlace" onClick={() => onElegir(f.observacion.punto.sourceId)} aria-label={`${COPY_EVOLUCION.elegirEnTabla}: ${fechaEnZona(f.observacion.punto.occurredAt, zonaHoraria)}`}>
                      {COPY_EVOLUCION.elegirEnTabla}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </>
  );
}
