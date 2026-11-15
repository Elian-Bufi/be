'use client';

/**
 * Comparar etapas reales de planificación (WP-DASHBOARD-COMPRENSION, eje 4). Una etapa es la vigencia de una versión
 * activada del plan de un área (`etapasDelArea`, del dominio). La tabla usa el mismo criterio de resumen que «Comparar
 * dos períodos» (`compararEtapas` sobre las observaciones originales) y dice, por métrica, la regla de resumen, el valor
 * de cada etapa y la diferencia descriptiva (B − A), o por qué no se resta.
 *
 * La composición (WP-ESCRITORIO-AMABLE, C-12): la respuesta entra en una pantalla.
 * - **Dos tarjetas, A y B:** qué versión es, desde cuándo, hasta cuándo, cuánto duró y su cobertura, dicha una vez por
 *   etapa (`etapas-en-pantalla.ts`). Desde la tarjeta se abre su planificación y, si el área tiene más etapas, se elige
 *   otra: A es siempre la más antigua de las dos.
 * - **La tabla:** una fila por métrica, con su criterio debajo del nombre. Una celda dice su cobertura solo si no es la
 *   de la tarjeta (lo asociado a otra versión, en nutrición, y lo registrado fuera de las fechas, en entrenamiento, van
 *   con la cobertura).
 * - **Las mismas métricas en el tiempo:** tres gráficos chicos, con las dos etapas marcadas. Los gráficos grandes —con
 *   sus métricas para cambiar, sus modos, la lectura de una fecha, la tabla de datos y el resumen en texto— quedan a un
 *   clic («Abrir estos gráficos en grande»): no se quitó nada.
 * Las etapas se leen con su propio período (las dos completas, hasta un año): cambiar el período de la ficha no mueve
 * la referencia. La planificación de cada etapa se abre al costado, en solo lectura, y al cerrarla se vuelve acá.
 *
 * GR-24 (WP-GRAFICOS fase 2, DL-174): debajo de la tabla, **«Lado a lado, con todas las observaciones»**: cada métrica en
 * las dos etapas, con todos sus días, sesiones o tomas, la mediana como una raya y la cantidad escrita; con menos de 5 de
 * un lado no se dibuja y se dice cuánto hay. Con el 1RM estimado, la mediana del RIR y el rango de repeticiones de cada
 * etapa. Y lo que también cambió entre una etapa y otra (las versiones de la otra área que se activaron en el medio, si se
 * leen) y lo que BE no registra.
 *
 * La pasada visual (WP-GRAFICOS, 15/11; DISENO-VISUAL §2, GR-24):
 * - **Lo que cambió en lo indicado, dicho:** en una métrica registrada de Entrenamiento (las repeticiones, la carga o el
 *   RIR de una serie), si lo indicado por el plan cambió de A a B, la diferencia lo dice debajo («el plan indica 1
 *   repetición menos»): un «−1 rep» suelto se lee como un retroceso. Sale del comparador
 *   (`lectura-de-lo-indicado.ts`), con la versión que ejecutó cada sesión.
 * - **Nutrición, por semana:** una barra por semana con la media de los días con dato y los días como puntos tenues
 *   detrás (`MinigraficoPorSemana`), sin el peine de los días sin registros. «Día por día», a un toque.
 * - **Revisión del 15/11:** cada gráfico por semana dice a la vista con cuántos días se hizo cada media, cuántos son
 *   subtotales y cuántos quedaron afuera (§5.13), con el teclado y para el lector de pantalla; las semanas no cruzan el
 *   cambio de etapa; las marcas tienen su leyenda una vez, arriba. La descripción de cada gráfico chico ya no dice «la
 *   primera…; la última…» (§5.12). Si cambian las etapas, el modo vuelve al que conviene para el período nuevo.
 *
 * **Una sola media semanal (GR-VC13, rama D):** por semana, cada barra es la media de la semana de GR-12
 * (`semanasDeNutricion`, que llama a `mediasDeLasSemanas`): los días con cantidades en todos sus registros, si son 4 o
 * más; un subtotal no entra y se cuenta. Las semanas se siguen partiendo en el cambio de etapa. Una semana con días pero
 * sin media va con su contorno cortado y sus días se ven igual; de entrada va por semana solo si alguna semana tiene media
 * (GR-VC12, como GR-12). Los g/kg y la cantidad de registros van día por día. La tabla de arriba sigue con su criterio
 * de siempre (el de cada métrica): resume la etapa entera, no estas semanas.
 */
import {
  compararEtapas,
  duracionDeLaEtapa,
  LENTE_DEL_AREA,
  numero,
  periodoDeLasEtapas,
  serieDisponible,
  TEXTO_SIN_DIFERENCIA_DE_ETAPAS,
  valorConUnidad,
  type EtapaDePlanificacion,
  type Medida,
  type OrigenDeDato,
  type ReferenciaDeMetrica,
  type ResumenDeEtapa,
} from '@be/domain';
import { escalaDeLaSerie, lecturaDelPunto } from '../graficos/arma-tu-grafico/compositor';
import { COPY_DE_LOS_CRUCES } from '../graficos/cruces/copy';
import { dosEtapasLadoALado, etapaDeLaPlanificacion } from '../graficos/cruces/dos-etapas';
import { DosEtapasEnPantalla } from '../graficos/cruces/dos-etapas-en-pantalla';
import { LO_QUE_BE_NO_REGISTRA, versionesEntreLasEtapas } from '../graficos/cruces/lo-que-tambien-cambio';
import dynamic from 'next/dynamic';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { BloqueDeEstado } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { diaCivil, diaDelAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { textoDeFalla, useSeguimiento } from './contexto';
import { hoyEn } from './estado';
import { coberturaDeLaEtapa, enumerar, etapasElegibles, finDeLaEtapa, partesDeLaEtapa, versionDeLaEtapa, type CoberturaDeLaEtapa } from './etapas-en-pantalla';
import { iconoDeLaReferencia } from './iconos-de-metrica';
import { Marca } from './marca';
import { Minigrafico } from './minigrafico';
import { useLoIndicadoDelEjercicio } from '../graficos/lectura-de-lo-indicado';
import { diferenciaDeLoIndicado, loIndicadoEnElTramo } from '../graficos/lo-indicado-en-el-tiempo';
import { LeyendaPorSemana, MarcaDeBarra, MinigraficoPorSemana } from '../graficos/minigrafico-por-semana';
import { diasDeLaSerieDeNutricion, metricaConMediaDeLaSemana, porSemanaDeEntrada, semanasDeNutricion } from '../graficos/cruces/semanas-de-nutricion';
import { marcasPorSemanaQueSeVen, type SemanaDeLaSerie } from '../graficos/semanas';
import { etapaEnPalabras } from './preguntas';
import { resumenSinPrimeroNiUltimo } from './resumen-del-grafico-chico';
import { nombreDeLaReferencia, tituloDeLaReferencia } from './selector';
import { useSeriesDelAnalisis, type Disponibles, type SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';

const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const CRITERIO: Readonly<Record<string, string>> = {
  MEDIA_DE_DIAS_CON_DATOS: 'Media de los días con valor',
  MEDIANA: 'Mediana de las sesiones',
  PRIMERO_Y_ULTIMO_COMPARABLES: 'Última toma del tramo comparable',
  TOTAL: 'Total',
};

/** Qué es cada punto de un gráfico chico: va después del nombre de la métrica, con su unidad. */
const CADA_PUNTO: Readonly<Record<string, string>> = { NUTRICION: 'por día', ENTRENAMIENTO: 'cada sesión', ANTROPOMETRIA: 'cada toma' };
/** Lo mismo, cuando una serie diaria va por semana (Nutrición): la barra es la media de la semana de GR-12 (GR-VC13). */
const POR_SEMANA = 'media de la semana (v1)';

/** La medida del comparador de una métrica registrada de Entrenamiento por serie, o `null` si no tiene lo indicado. */
function medidaDeLaMetrica(ref: ReferenciaDeMetrica): Medida | null {
  if (ref.metricId === 'entrenamiento.repeticiones') return { variable: 'repeticiones' };
  if (ref.metricId === 'entrenamiento.rir') return { variable: 'rir' };
  if (ref.metricId === 'entrenamiento.carga') return { variable: 'carga', unidad: ref.unit ?? 'kg' };
  return null;
}

/** El alto de un gráfico chico de la comparación: el dibujo y el renglón de las fechas. */
const ALTO_DEL_GRAFICO = 132;

const numeroDeVersion = (e: EtapaDePlanificacion): number => Number(versionDeLaEtapa(e)) || 0;

type Lista = SerieDelAnalisis & { estado: Extract<SerieDelAnalisis['estado'], { tipo: 'lista' }> };

export function ComparacionDeEtapas({
  area,
  a,
  b,
  metricas,
  etapas,
  etapasDeLaOtraArea,
  disponibles,
  enGrande,
  onEnGrande,
  pie,
  debajo,
  grandes,
}: {
  area: 'NUTRICION' | 'ENTRENAMIENTO';
  a: EtapaDePlanificacion;
  b: EtapaDePlanificacion;
  metricas: readonly ReferenciaDeMetrica[];
  /** Todas las etapas del área en el último año: las que cada tarjeta puede ofrecer. */
  etapas: readonly EtapaDePlanificacion[];
  /**
   * GR-24: las etapas del último año de la otra área (sus planes propios), para decir qué más se activó entre A y B.
   * Vacías sin acceso o sin plan propio; `null` si no se pudieron leer (se dice que no se sabe, no que no cambió).
   */
  etapasDeLaOtraArea: readonly EtapaDePlanificacion[] | null;
  disponibles: Disponibles;
  /** Los gráficos grandes están abiertos debajo: los chicos no se repiten. */
  enGrande: boolean;
  onEnGrande: (abrir: boolean) => void;
  /** Lo que va al pie de los gráficos chicos (la tabla de datos y el límite de la pregunta): lo arma quien tiene los datos. */
  pie?: ReactNode;
  /** Lo que el pie abre, debajo de la tarjeta de los gráficos chicos. */
  debajo?: ReactNode;
  /** Los gráficos grandes, con su barra y su lectura: van en el lugar de los chicos cuando se abren. */
  grandes?: ReactNode;
}) {
  const { ir, token, asesoradoId, sesionPerdida } = useSeguimiento();
  const id = useId();
  const hoy = hoyEn();
  const leido = useMemo(() => periodoDeLasEtapas(a, b, hoy, 366), [a, b, hoy]);
  const periodo = useMemo(() => ({ preset: null, desde: leido.desde, hasta: leido.hasta }), [leido.desde, leido.hasta]);
  const { series, reintentarFallidas } = useSeriesDelAnalisis(metricas, 'DAY', periodo);
  // Lo indicado del ejercicio de las métricas por serie, para decir qué cambió de A a B (solo en Entrenamiento).
  const exerciseKey = area === 'ENTRENAMIENTO' ? (metricas.find((m) => m.exerciseKey !== null && medidaDeLaMetrica(m) !== null)?.exerciseKey ?? null) : null;
  const indicado = useLoIndicadoDelEjercicio({ token, asesoradoId, sesionPerdida }, exerciseKey, leido.desde, leido.hasta);
  const loIndicadoEnLaDiferencia = (ref: ReferenciaDeMetrica): string | null => {
    const medida = medidaDeLaMetrica(ref);
    if (indicado.tipo !== 'lista' || medida === null || ref.exerciseKey !== exerciseKey) return null;
    const enLaEtapa = (e: EtapaDePlanificacion) => loIndicadoEnElTramo(indicado.observaciones, (o) => o.comparacion.planId === e.planVersionId, { serie: ref.setIndex, unidad: ref.unit ?? undefined });
    return diferenciaDeLoIndicado(enLaEtapa(a), enLaEtapa(b), medida);
  };
  // Nutrición va por semana de entrada (DISENO-VISUAL §1, principio 6) si alguna semana tiene media (GR-VC12); «Día por
  // día», a un toque. Lo elegido a mano manda hasta que cambien las etapas: entonces vuelve al que conviene.
  const [porSemanaElegido, setPorSemana] = useState<boolean | null>(null);
  useEffect(() => setPorSemana(null), [leido.desde, leido.hasta]);
  // Las que no se pudieron leer: cada fila lo dice, y se reintentan juntas, con un solo botón debajo de la tabla.
  const fallidas = series.filter((s) => s.estado.tipo === 'error').length;
  const [plan, setPlan] = useState<{ origen: OrigenDeDato; titulo: string; numero: number } | null>(null);
  const tipoDePlan: OrigenDeDato['type'] = area === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION';
  const nombreDelArea = area === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento';
  const dia = (fechaCivil: string): string => diaDelAnioEnCurso(fechaCivil, hoy);
  // La hora de la activación importa solo cuando separa dos etapas del mismo día.
  const conHora = a.desde === b.desde || a.ultimoDia === null || b.ultimoDia === null;

  // Cada métrica en las dos etapas, con el criterio del dominio. De acá salen la tabla y la cobertura de cada tarjeta.
  const filas = series.map((s, indice) => {
    const nombre = nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios);
    if (s.estado.tipo !== 'lista') return { s, indice, nombre, c: null };
    return { s: s as Lista, indice, nombre, c: compararEtapas(s.estado.observaciones, s.definicion, a, b, leido) };
  });
  const coberturaDe = (lado: 'a' | 'b'): CoberturaDeLaEtapa | null =>
    coberturaDeLaEtapa(filas.flatMap((f) => (f.c ? [{ clave: f.s.clave, nombre: f.nombre, partes: partesDeLaEtapa(f.c[lado], dia) }] : [])));
  const cobertura = { a: coberturaDe('a'), b: coberturaDe('b') };
  // El gris de «sin registros» acompaña a la cuenta solo si algún gráfico chico sombrea esos días.
  const sombrea = filas.some((f) => f.c !== null && (f.s as Lista).estado.serie.grain === 'DAY');
  const cargando = series.some((s) => s.estado.tipo === 'cargando');
  const dibujables = filas.flatMap((f) => (f.c !== null && (f.s as Lista).estado.serie.points.some((p) => p.value !== null) ? [{ ...f, s: f.s as Lista }] : []));
  // Lo que comparten los tres gráficos chicos: las dos etapas con su letra y las fechas del pie (el comienzo de cada una
  // y el final de lo leído).
  const bandas = useMemo(() => [a, b].flatMap((e, i) => (e.ultimoDia ? [{ desde: e.desde, hasta: e.ultimoDia, rotulo: i === 0 ? 'A' : 'B' }] : [])), [a, b]);
  const fechasDelPie = useMemo(() => [leido.desde, b.desde, leido.hasta], [leido.desde, leido.hasta, b.desde]);
  // GR-VC13: las semanas de cada métrica de Nutrición con la media de GR-12, partidas en el cambio de etapa.
  const semanasDe = new Map<string, SemanaDeLaSerie[]>(
    dibujables.flatMap(({ s }) => {
      const metrica = metricaConMediaDeLaSemana(s.definicion);
      return metrica !== null && s.estado.observaciones.grain === 'DAY' ? [[s.clave, semanasDeNutricion(s.estado.observaciones.points, metrica, leido.desde, leido.hasta, hoy, bandas)] as const] : [];
    }),
  );
  const porSemana = porSemanaElegido ?? porSemanaDeEntrada(leido.desde, leido.hasta, [...semanasDe.values()]);
  const conPorSemana = !enGrande && area === 'NUTRICION' && semanasDe.size > 0;
  // GR-24: cada métrica lado a lado, con todas sus observaciones (5 por lado como mínimo para dibujarse).
  const ladoALado = dibujables.map(({ s, indice }) => {
    const unidad = s.estado.serie.unit;
    const delCatalogo = serieDisponible(s.ref.metricId, unidad);
    return {
      s,
      indice,
      d: dosEtapasLadoALado({
        serie: s.estado.observaciones,
        definicion: s.definicion,
        a: etapaDeLaPlanificacion(a, 'A'),
        b: etapaDeLaPlanificacion(b, 'B'),
        leido,
        escala: delCatalogo ? escalaDeLaSerie(delCatalogo, unidad) : { enteros: false },
        lectura: (p) => lecturaDelPunto(p, s.definicion, unidad),
        fuerza: s.estado.fuerza ?? null,
      }),
    };
  });
  // Lo que también cambió entre una etapa y otra: las versiones de los planes propios (de esta área, entre A y B, y de la
  // otra) que se activaron en el medio. Salen de las etapas del último año, no de las versiones del período de la ficha:
  // con dos etapas de hace meses, lo de entonces no estaba ahí y se decía que no había cambiado nada.
  const [primera, segunda]: readonly [EtapaDePlanificacion, EtapaDePlanificacion] = a.desde <= b.desde ? [a, b] : [b, a];
  const tambienCambio = etapasDeLaOtraArea === null ? null : versionesEntreLasEtapas([...etapas, ...etapasDeLaOtraArea], primera, segunda, segunda.ultimoDia ?? leido.hasta);

  const tarjeta = (e: EtapaDePlanificacion, lado: 'A' | 'B') => {
    const otra = lado === 'A' ? b : a;
    const elegibles = etapasElegibles(etapas, e, otra, lado);
    const nombre = `${nombreDelArea} · versión ${versionDeLaEtapa(e)}`;
    const c = cobertura[lado === 'A' ? 'a' : 'b'];
    return (
      <article className="etapa" data-lado={lado} aria-label={`Etapa ${lado}: ${nombre}`}>
        <div className="etapa__cabecera">
          <span className="etapa__letra" aria-hidden="true">
            {lado}
          </span>
          {elegibles.length > 1 ? (
            <select
              className="etapa__selector"
              aria-label={`Etapa ${lado}`}
              value={e.planVersionId}
              onChange={(ev) => ir({ [lado === 'A' ? 'etapaA' : 'etapaB']: ev.target.value }, { agregarAlHistorial: true })}
            >
              {elegibles.map((x) => (
                <option key={x.planVersionId} value={x.planVersionId}>
                  {nombreDelArea} · versión {versionDeLaEtapa(x)}
                </option>
              ))}
            </select>
          ) : (
            <h4 className="etapa__nombre">{nombre}</h4>
          )}
          <button type="button" className="boton boton--enlace etapa__plan" onClick={() => setPlan({ origen: { type: tipoDePlan, id: e.planVersionId }, titulo: nombre, numero: numeroDeVersion(e) })}>
            <Icono nombre="plan" tamano={18} />
            Ver la planificación<span className="visualmente-oculto"> de la etapa {lado}</span>
          </button>
        </div>
        <dl className="etapa__datos">
          <div>
            <dt>Desde</dt>
            <dd>
              {dia(e.desde)}, al activarse{conHora ? ` (${horaDelDia(new Date(e.activadaEl))})` : ''}
            </dd>
          </div>
          <div>
            <dt>Hasta</dt>
            <dd>{finDeLaEtapa(e, etapas, dia)}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{duracionDeLaEtapa(e)}</dd>
          </div>
          {c ? (
            <div className="etapa__cobertura">
              <dt>Cobertura{c.deTodas ? '' : ` de ${enumerar(c.de)}`}</dt>
              <dd>
                {c.partes.map((parte, i) => (
                  <span key={parte}>
                    {i > 0 ? ' · ' : ''}
                    {/sin registros$/.test(parte) && sombrea ? <span className="muestra-de-hueco" aria-hidden="true" /> : null}
                    {parte}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </article>
    );
  };

  return (
    <section className="comparacion-de-etapas" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="visualmente-oculto">
        Comparación de dos etapas de {nombreDelArea}
      </h3>
      <div className="etapas">
        {tarjeta(a, 'A')}
        {tarjeta(b, 'B')}
      </div>
      {/* Las fechas de cada etapa están en su tarjeta. Lo que se leyó se dice solo si no las cubre enteras. */}
      {leido.recortado ? (
        <p className="nota comparacion-de-etapas__recorte">
          Se lee del {diaCivil(leido.desde)} al {diaCivil(leido.hasta)}: el máximo de lectura es un año, y la etapa A empezó antes. Lo previo no entra en el resumen.
        </p>
      ) : null}
      <div className="tarjeta-de-etapas">
        <div className="desplazable-x">
          <table className="tabla tabla--numeros tabla-de-etapas" aria-busy={cargando || undefined}>
            <caption className="visualmente-oculto">Cada métrica en las dos etapas, con el mismo criterio de resumen</caption>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                <th scope="col">
                  Etapa A · versión {versionDeLaEtapa(a)}
                </th>
                <th scope="col">
                  Etapa B · versión {versionDeLaEtapa(b)}
                </th>
                <th scope="col">Diferencia (B − A)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ s, nombre, c }) => {
                const titulo = (
                  <th scope="row">
                    <span className="tabla-de-etapas__metrica">
                      <Icono nombre={iconoDeLaReferencia(s.ref, s.definicion)} tamano={18} />
                      {nombre}
                    </span>
                    <span className="celda__detalle">{CRITERIO[s.definicion.resumenDePeriodo]}</span>
                  </th>
                );
                if (c === null) {
                  return (
                    <tr key={s.clave} data-metrica={s.clave}>
                      {titulo}
                      <td colSpan={3}>
                        {s.estado.tipo === 'cargando' ? 'Cargando…' : null}
                        {s.estado.tipo === 'sin-acceso' ? 'No está disponible con tu acceso actual.' : null}
                        {s.estado.tipo === 'sin-especificacion' ? 'BE no tiene todavía una especificación para calcularla.' : null}
                        {s.estado.tipo === 'sin-datos' ? 'Sin registros en las fechas leídas: no es un cero.' : null}
                        {s.estado.tipo === 'error' ? textoDeFalla(s.estado.motivo, nombre) : null}
                      </td>
                    </tr>
                  );
                }
                const lista = s as Lista;
                const unidad = lista.estado.serie.unit;
                return (
                  <tr key={s.clave} data-metrica={s.clave}>
                    {titulo}
                    <td data-etiqueta="Etapa A">
                      <CeldaDeEtapa r={c.a} s={lista} unidad={unidad} propia={cobertura.a?.propias.has(s.clave) ?? false} dia={dia} />
                    </td>
                    <td data-etiqueta="Etapa B">
                      <CeldaDeEtapa r={c.b} s={lista} unidad={unidad} propia={cobertura.b?.propias.has(s.clave) ?? false} dia={dia} />
                    </td>
                    <td className="tabla-de-etapas__diferencia" data-etiqueta="Diferencia (B − A)">
                      {c.diferencia === null ? (
                        c.motivoSinDiferencia ? (
                          <span className="tabla-de-etapas__sin-diferencia">{TEXTO_SIN_DIFERENCIA_DE_ETAPAS[c.motivoSinDiferencia]}</span>
                        ) : (
                          '—'
                        )
                      ) : (
                        <>
                          <strong>{`${c.diferencia > 0 ? '+' : ''}${valorConUnidad(c.diferencia, unidad, s.definicion.decimales)}`}</strong>
                          {loIndicadoEnLaDiferencia(s.ref) ? (
                            <span className="celda__detalle tabla-de-etapas__lo-indicado" data-cambio-de-lo-indicado>
                              {loIndicadoEnLaDiferencia(s.ref)}
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {fallidas > 0 ? (
          <BloqueDeEstado tipo="error" icono="aviso" onReintentar={reintentarFallidas} textoDelBoton="Reintentar las métricas que fallaron" rol="alert">
            {fallidas === 1 ? 'Una métrica no se pudo leer: su fila lo dice.' : `${numero(fallidas)} métricas no se pudieron leer: sus filas lo dicen.`}
          </BloqueDeEstado>
        ) : null}
      </div>
      {/* GR-24: las mismas métricas, lado a lado, con todas sus observaciones y la cantidad de cada etapa. */}
      {ladoALado.length > 0 ? (
        <section className="tarjeta-de-etapas etapas-lado-a-lado" aria-labelledby={`${id}-lado-a-lado`}>
          <h4 id={`${id}-lado-a-lado`}>Lado a lado, con todas las observaciones</h4>
          {ladoALado.map(({ s, indice, d }) => (
            <DosEtapasEnPantalla key={s.clave} titulo={tituloDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios)} d={d} decimales={s.definicion.decimales} indice={indice} densidad="COMPACTA" nivel={4} />
          ))}
          <div className="cruce__tambien">
            <h4>{COPY_DE_LOS_CRUCES.tambienCambio}</h4>
            {tambienCambio === null ? (
              <p className="nota">{COPY_DE_LOS_CRUCES.sinLasVersiones}</p>
            ) : tambienCambio.length > 0 ? (
              <ul>
                {tambienCambio.map((t) => (
                  <li key={t}>{t}.</li>
                ))}
              </ul>
            ) : (
              <p className="nota">{COPY_DE_LOS_CRUCES.sinCambiosQueSeSepan}</p>
            )}
            <p className="nota">
              {COPY_DE_LOS_CRUCES.noRegistra}: {LO_QUE_BE_NO_REGISTRA['GR-24'].join('; ')}.
            </p>
          </div>
        </section>
      ) : null}
      <div className="graficos-de-etapas">
        <div className="graficos-de-etapas__cabecera">
          <h4>Las mismas métricas, en el tiempo</h4>
          {enGrande ? null : <p className="graficos-de-etapas__nota">A y B son las dos etapas.</p>}
          {conPorSemana ? (
            <div className="graficos-de-etapas__grano" role="group" aria-label="Cómo se ven los días">
              <button type="button" className="chip-de-zona" aria-pressed={porSemana} onClick={() => setPorSemana(true)} data-por-semana>
                Por semana
              </button>
              <button type="button" className="chip-de-zona" aria-pressed={!porSemana} onClick={() => setPorSemana(false)} data-dia-por-dia>
                Día por día
              </button>
            </div>
          ) : null}
          {dibujables.length > 0 ? (
            <button type="button" className="boton boton--enlace graficos-de-etapas__abrir" onClick={() => onEnGrande(!enGrande)}>
              <Icono nombre={enGrande ? 'arriba' : 'analizar'} tamano={18} />
              {enGrande ? 'Volver a los gráficos chicos' : 'Abrir estos gráficos en grande'}
            </button>
          ) : null}
        </div>
        {/* Las marcas del dibujo por semana, una vez para los tres gráficos, con cómo se arma cada barra. */}
        {conPorSemana && porSemana ? <LeyendaPorSemana que={marcasPorSemanaQueSeVen([...semanasDe.values()].flat())} comoSeArma={COPY_DE_LOS_CRUCES.porSemana.comoSeArma} /> : null}
        {enGrande ? null : dibujables.length > 0 ? (
          <ul className="graficos-de-etapas__lista">
            {dibujables.map(({ s, indice }) => {
              const titulo = tituloDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios);
              const conObjetivo = s.estado.objetivo.length > 0;
              const semanas = semanasDe.get(s.clave) ?? null;
              const semanal = porSemana && semanas !== null;
              return (
                <li key={s.clave} className="grafico-chico" data-metrica={s.clave}>
                  <p className="grafico-chico__titulo">
                    {semanal ? <MarcaDeBarra indice={indice} /> : <Marca indice={indice} />}
                    <strong>{titulo}</strong>
                    <span className="grafico-chico__detalle">
                      {s.estado.serie.unit} · {semanal ? POR_SEMANA : CADA_PUNTO[s.definicion.area]}
                    </span>
                    {conObjetivo ? (
                      <span className="grafico-chico__muestra">
                        <Marca indice={indice} plan /> Objetivo del profesional
                      </span>
                    ) : null}
                  </p>
                  {semanal ? (
                    <MinigraficoPorSemana
                      dias={diasDeLaSerieDeNutricion(s.estado.observaciones.points)}
                      semanas={semanas ?? undefined}
                      unidad={s.estado.serie.unit}
                      desde={leido.desde}
                      hasta={leido.hasta}
                      hoy={hoy}
                      alto={ALTO_DEL_GRAFICO}
                      indice={indice}
                      bandas={bandas}
                      fechas={fechasDelPie}
                      plan={s.estado.objetivo}
                      titulo={titulo}
                    />
                  ) : (
                  <Minigrafico
                    serie={s.estado.observaciones}
                    desde={leido.desde}
                    hasta={leido.hasta}
                    hoy={hoy}
                    inicioDelPlan={null}
                    alto={ALTO_DEL_GRAFICO}
                    indice={indice}
                    bandas={bandas}
                    fechas={fechasDelPie}
                    plan={s.estado.objetivo}
                    ejeFino
                    descripcion={`Gráfico de ${titulo}, con las etapas A y B. ${resumenSinPrimeroNiUltimo(s.estado.observaciones, s.definicion, leido.desde, leido.hasta)}`}
                  />
                  )}
                </li>
              );
            })}
          </ul>
        ) : cargando ? null : fallidas > 0 && fallidas === series.length ? (
          // Una falla no es una ausencia: si ninguna se pudo leer, no se sabe si hay valores.
          <p className="graficos-de-etapas__nota">No pudimos leer estas métricas: no hay nada para dibujar, pero no es que no tengan valores. Se reintentan debajo de la tabla.</p>
        ) : (
          <p className="graficos-de-etapas__nota">
            {fallidas > 0
              ? 'Las métricas que se pudieron leer no tienen valores en las fechas de las dos etapas, y no es un cero; las demás no se pudieron leer.'
              : 'Ninguna de estas métricas tiene valores en las fechas de las dos etapas: no hay nada para dibujar, y no es un cero.'}
          </p>
        )}
        {enGrande ? null : pie}
      </div>
      {enGrande ? null : debajo}
      {/* Los grandes van acá, en el lugar de los chicos: con sus métricas para cambiar, sus modos y la lectura de una fecha. */}
      {grandes}
      <Ayuda titulo="Cómo se arman las etapas">
        <p>Una etapa empieza cuando se activa una versión del plan y termina cuando se activa la siguiente o se cierra el seguimiento. Un borrador no inicia una etapa.</p>
        <p>
          El día de una activación es de la versión nueva, así ningún día se cuenta dos veces. Si dos versiones se activaron el mismo día, la primera no tiene un día entero: se dice su duración en horas y
          no se resume por días.
        </p>
        <p>
          Se lee del {diaCivil(leido.desde)} al {diaCivil(leido.hasta)}.{' '}
          {LENTE_DEL_AREA[area] === 'VERSION_EJECUTADA'
            ? 'Cada sesión cuenta en la etapa de la versión que ejecutó, aunque se haya registrado después.'
            : 'Cada día cuenta en la etapa de su fecha; si sus registros quedaron asociados a otra versión, se dice.'}
        </p>
        {/* Qué no se resta y que la coincidencia no indica causa ya están a la vista: en la tabla y al pie. */}
        <p>
          La cobertura se dice una vez por etapa, en su tarjeta; una métrica la repite en su celda solo si la suya es otra. En nutrición cuenta los días de cada etapa: los que tienen valor, los que no
          tienen registros, los que tienen registros sin cantidades y hoy, que sigue en curso.
        </p>
      </Ayuda>
      <PanelDeRegistro origen={plan?.origen ?? null} titulo={plan?.titulo ?? ''} numeroDeVersion={plan?.numero} onCerrar={() => setPlan(null)} />
    </section>
  );
}

function CeldaDeEtapa({ r, s, unidad, propia, dia }: { r: ResumenDeEtapa; s: { definicion: Parameters<typeof valorParaMostrar>[1] }; unidad: string; propia: boolean; dia: (fechaCivil: string) => string }) {
  if (r.resumen === null) return <>{r.motivoSinResumen === 'SIN_DIA_ENTERO' ? 'Sin un día entero' : 'Fuera de lo leído'}</>;
  const x = r.resumen;
  // En una medida corporal el valor es la última toma del tramo; la primera dice de dónde venía en esa misma etapa.
  const primera = x.regla === 'PRIMERO_Y_ULTIMO_COMPARABLES' && x.primero && x.ultimo && x.primero.pointId !== x.ultimo.pointId && x.primero.value !== null ? x.primero.value : null;
  const partes = propia ? partesDeLaEtapa(r, dia) : null;
  return (
    <>
      <strong>{x.valor === null ? 'Sin valor' : valorParaMostrar(x.valor, s.definicion, unidad)}</strong>
      {primera !== null ? <span className="celda__detalle">Primera toma del tramo: {valorParaMostrar(primera, s.definicion, unidad)}</span> : null}
      {partes ? <span className="celda__detalle">{partes.join(' · ')}</span> : null}
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
