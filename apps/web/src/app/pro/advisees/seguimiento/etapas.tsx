'use client';

/**
 * Comparar etapas reales de planificación (WP-DASHBOARD-COMPRENSION, eje 4). Una etapa es la vigencia de una versión
 * activada del plan de un área (`etapasDelArea`, del dominio). La tabla usa el mismo criterio de resumen que «Comparar
 * dos períodos» (`compararEtapas` sobre las observaciones originales) y dice, por métrica:
 * - el rango y la duración de cada etapa, cuántas observaciones y de qué tipo, la cobertura y lo que falta;
 * - la regla de resumen, el valor y la diferencia descriptiva (B − A), o por qué no se resta;
 * - lo asociado a otra versión (nutrición, por fechas) y lo registrado fuera de las fechas de la etapa (entrenamiento,
 *   por la versión que ejecutó cada sesión).
 * Las etapas se leen con su propio período (las dos completas, hasta un año): cambiar el período de la ficha no mueve
 * la referencia. La planificación de cada etapa se abre al costado, en solo lectura, y al cerrarla se vuelve acá.
 */
import {
  compararEtapas,
  duracionDeLaEtapa,
  etapaAnterior,
  LENTE_DEL_AREA,
  numero,
  partesDeLaCobertura,
  periodoDeLasEtapas,
  TEXTO_SIN_DIFERENCIA_DE_ETAPAS,
  valorConUnidad,
  type EtapaDePlanificacion,
  type OrigenDeDato,
  type ReferenciaDeMetrica,
  type ResumenDeEtapa,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useId, useMemo, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando } from '../../../../components/estados';
import { diaCivil, fecha } from '../../../../lib/formato';
import { textoDeFalla, useSeguimiento } from './contexto';
import { hoyEn } from './estado';
import { etapaEnPalabras } from './preguntas';
import { nombreDeLaReferencia } from './selector';
import { useSeriesDelAnalisis, type Disponibles } from './series';
import { valorParaMostrar } from './valores';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const CRITERIO: Readonly<Record<string, string>> = {
  MEDIA_DE_DIAS_CON_DATOS: 'Media de los días con valor',
  MEDIANA: 'Mediana de las sesiones',
  PRIMERO_Y_ULTIMO_COMPARABLES: 'Última toma del tramo comparable',
  TOTAL: 'Total',
};

const FIN: Readonly<Record<string, string>> = {
  SUCCESSOR_ACTIVATED: 'terminó al activarse la versión siguiente',
  FOLLOW_UP_CLOSED: 'terminó al cerrarse el seguimiento',
};

const numeroDeVersion = (e: EtapaDePlanificacion): number => Number(e.etiqueta.replace(/^v/, '')) || 0;

export function ComparacionDeEtapas({
  area,
  a,
  b,
  metricas,
  etapas,
  disponibles,
}: {
  area: 'NUTRICION' | 'ENTRENAMIENTO';
  a: EtapaDePlanificacion;
  b: EtapaDePlanificacion;
  metricas: readonly ReferenciaDeMetrica[];
  /** Todas las etapas del área en el último año (para «Etapa anterior»). */
  etapas: readonly EtapaDePlanificacion[];
  disponibles: Disponibles;
}) {
  const { ir } = useSeguimiento();
  const id = useId();
  const leido = useMemo(() => periodoDeLasEtapas(a, b, hoyEn(), 366), [a, b]);
  const periodo = useMemo(() => ({ preset: null, desde: leido.desde, hasta: leido.hasta }), [leido.desde, leido.hasta]);
  const { series, recargar } = useSeriesDelAnalisis(metricas, 'DAY', periodo);
  const [plan, setPlan] = useState<{ origen: OrigenDeDato; titulo: string; numero: number } | null>(null);
  const tipoDePlan: OrigenDeDato['type'] = area === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION';
  const nombreDelArea = area === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento';
  const anteriorDeA = etapaAnterior(etapas, a.planVersionId);

  const tarjeta = (e: EtapaDePlanificacion, lado: 'A' | 'B') => (
    <article className="etapa" aria-labelledby={`${id}-${lado}`}>
      <p className="etapa__rotulo">Etapa {lado}</p>
      <h4 id={`${id}-${lado}`}>
        {nombreDelArea} · versión {e.etiqueta.replace(/^v/, '')}
      </h4>
      <dl className="datos">
        <div>
          <dt>Desde</dt>
          <dd>{fecha(e.activadaEl)} (activación)</dd>
        </div>
        <div>
          <dt>Hasta</dt>
          <dd>{e.abierta ? 'Sigue vigente (hasta hoy, en curso)' : e.ultimoDia ? `${diaCivil(e.ultimoDia)}; ${FIN[e.motivoDeFin ?? ''] ?? 'terminó'}` : `el mismo día; ${FIN[e.motivoDeFin ?? ''] ?? 'terminó'}`}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{duracionDeLaEtapa(e)}</dd>
        </div>
      </dl>
      <div className="acciones">
        <button type="button" className="boton boton--enlace" onClick={() => setPlan({ origen: { type: tipoDePlan, id: e.planVersionId }, titulo: `${nombreDelArea} · versión ${e.etiqueta.replace(/^v/, '')}`, numero: numeroDeVersion(e) })}>
          Ver la planificación de esta etapa
        </button>
        {lado === 'A' && anteriorDeA ? (
          <button type="button" className="boton boton--enlace" onClick={() => ir({ etapaA: anteriorDeA.planVersionId }, { agregarAlHistorial: true })}>
            Etapa anterior ({anteriorDeA.etiqueta})
          </button>
        ) : null}
      </div>
    </article>
  );

  return (
    <section className="comparacion-de-etapas" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="visualmente-oculto">
        Comparación de dos etapas de {nombreDelArea}
      </h3>
      <div className="etapas">
        {tarjeta(a, 'A')}
        {tarjeta(b, 'B')}
      </div>
      <p className="metadatos">
        Se lee del {diaCivil(leido.desde)} al {diaCivil(leido.hasta)}
        {leido.recortado ? ': el máximo de lectura es un año, y la etapa A empezó antes. Lo previo no entra en el resumen' : ''}. {LENTE_DEL_AREA[area] === 'VERSION_EJECUTADA'
          ? 'Cada sesión cuenta en la etapa de la versión que ejecutó, aunque se haya registrado después.'
          : 'Cada día cuenta en la etapa de su fecha; si sus registros quedaron asociados a otra versión, se dice.'}
      </p>
      {series.some((s) => s.estado.tipo === 'cargando') ? <Cargando /> : null}
      <div className="desplazable-x">
        <table className="tabla tabla--numeros tabla-de-etapas">
          <caption className="visualmente-oculto">Cada métrica en las dos etapas, con el mismo criterio de resumen</caption>
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              <th scope="col">Criterio</th>
              <th scope="col">A · {a.etiqueta}</th>
              <th scope="col">B · {b.etiqueta}</th>
              <th scope="col">B − A</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const nombre = nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios);
              if (s.estado.tipo !== 'lista') {
                return (
                  <tr key={s.clave}>
                    <th scope="row">{nombre}</th>
                    <td colSpan={4}>
                      {s.estado.tipo === 'cargando' ? 'Cargando…' : null}
                      {s.estado.tipo === 'sin-acceso' ? 'No está disponible con tu acceso actual.' : null}
                      {s.estado.tipo === 'sin-especificacion' ? 'BE no tiene todavía una especificación para calcularla.' : null}
                      {s.estado.tipo === 'error' ? (
                        <>
                          {textoDeFalla(s.estado.motivo, nombre)}{' '}
                          <button type="button" className="boton boton--enlace" onClick={recargar}>
                            Reintentar
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              }
              const c = compararEtapas(s.estado.observaciones, s.definicion, a, b, leido);
              const unidad = s.estado.serie.unit;
              return (
                <tr key={s.clave}>
                  <th scope="row">{nombre}</th>
                  <td>{CRITERIO[s.definicion.resumenDePeriodo]}</td>
                  <td>
                    <CeldaDeEtapa r={c.a} s={s} unidad={unidad} />
                  </td>
                  <td>
                    <CeldaDeEtapa r={c.b} s={s} unidad={unidad} />
                  </td>
                  <td>{c.diferencia === null ? (c.motivoSinDiferencia ? TEXTO_SIN_DIFERENCIA_DE_ETAPAS[c.motivoSinDiferencia] : '—') : `${c.diferencia > 0 ? '+' : ''}${valorConUnidad(c.diferencia, unidad, s.definicion.decimales)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Ayuda titulo="Cómo se arman las etapas">
        <p>Una etapa empieza cuando se activa una versión del plan y termina cuando se activa la siguiente o se cierra el seguimiento. Un borrador no inicia una etapa.</p>
        <p>
          El día de una activación es de la versión nueva, así ningún día se cuenta dos veces. Si dos versiones se activaron el mismo día, la primera no tiene un día entero: se dice su duración en horas y
          no se resume por días.
        </p>
        {/* Qué no se resta y que la coincidencia no indica causa ya están a la vista: en la pregunta y en el encabezado. */}
        <p>En nutrición, la cobertura cuenta los días de cada etapa: los que tienen valor, los que no tienen registros, los que tienen registros sin cantidades y hoy, que sigue en curso.</p>
      </Ayuda>
      <PanelDeRegistro origen={plan?.origen ?? null} titulo={plan?.titulo ?? ''} numeroDeVersion={plan?.numero} onCerrar={() => setPlan(null)} />
    </section>
  );
}

function CeldaDeEtapa({ r, s, unidad }: { r: ResumenDeEtapa; s: { definicion: Parameters<typeof valorParaMostrar>[1] }; unidad: string }) {
  if (r.resumen === null) return <>{r.motivoSinResumen === 'SIN_DIA_ENTERO' ? 'Sin un día entero' : 'Fuera de lo leído'}</>;
  const x = r.resumen;
  const partes = [
    `${r.rango ? `del ${diaCivil(r.rango.desde)} al ${diaCivil(r.rango.hasta)}` : ''}`,
    // La misma cobertura que «Comparar dos períodos» y los indicadores: en nutrición, los días del rango por categoría.
    ...partesDeLaCobertura(x),
    ...(r.deOtraVersion ? [`${numero(r.deOtraVersion)} ${r.deOtraVersion === 1 ? 'día con registros asociados' : 'días con registros asociados'} a otra versión`] : []),
    ...(r.fueraDeLasFechas ? [`${numero(r.fueraDeLasFechas)} fuera de las fechas de la etapa`] : []),
    ...(r.recortada ? ['la lectura no cubre la etapa entera'] : []),
  ].filter(Boolean);
  return (
    <>
      <strong>{x.valor === null ? 'Sin valor' : valorParaMostrar(x.valor, s.definicion, unidad)}</strong>
      <span className="celda__detalle">{partes.join(' · ')}</span>
    </>
  );
}

/** Las etapas del período, como lista: el camino del teclado a lo que las bandas del gráfico permiten (eje 4). */
export function EtapasDelPeriodo({ etapas, area, onVerPlan, onComparar }: { etapas: readonly EtapaDePlanificacion[]; area: 'NUTRICION' | 'ENTRENAMIENTO'; onVerPlan: (e: EtapaDePlanificacion) => void; onComparar: (a: EtapaDePlanificacion, b: EtapaDePlanificacion) => void }) {
  if (etapas.length === 0) return null;
  return (
    <ul className="etapas-del-periodo" aria-label={`Etapas de ${area === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento'} en el período`}>
      {etapas.map((e, i) => (
        <li key={e.planVersionId}>
          <span>{etapaEnPalabras(e)}</span>{' '}
          <button type="button" className="boton boton--enlace" onClick={() => onVerPlan(e)}>
            Ver la planificación<span className="visualmente-oculto"> de {e.etiqueta}</span>
          </button>
          {i > 0 ? (
            <button type="button" className="boton boton--enlace" onClick={() => onComparar(etapas[i - 1] as EtapaDePlanificacion, e)}>
              Comparar con {etapas[i - 1]?.etiqueta}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
