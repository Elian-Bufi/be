'use client';

/**
 * Los indicadores del Resumen (WP-ESCRITORIO-AMABLE, parte 3): hasta cuatro, fijados por cuenta (API-VAN), cada uno en
 * su tarjeta con lo que hace falta para leer el número sin abrir nada más:
 * - **el valor,** grande, con su unidad, y **la regla** con que se resume el período (la misma de «Comparar dos
 *   períodos» y de las etapas: media de los días con valor, mediana de las sesiones, última toma del tramo comparable);
 * - **el minigráfico,** con los mismos puntos, cortes y días sin registros que «Analizar»;
 * - **la cobertura,** con las partes y las palabras del dominio (`partesDeLaCobertura`): cuántos días, sesiones o tomas
 *   lo sostienen y cuántos no. Antes había que bajar a «Qué se registró en el período» para leerla.
 *
 * Describen lo registrado, sin calificar: no hay verde ni rojo, flechas de tendencia ni distancia a un objetivo. Un
 * indicador que no se pudo leer, que no tiene datos o que no está disponible lo dice en su lugar, con su motivo: una
 * falla nunca es «sin datos», y «sin datos» nunca es un cero.
 */
import {
  claseEnPalabras,
  definicionDeMetrica,
  inicioDelPrimerPlan,
  METRICAS_DEL_DICCIONARIO,
  numero,
  partesDeLaCobertura,
  primerPlanDelPeriodo,
  resumenTextual,
  resumirPeriodo,
  type DefinicionDeMetrica,
  type FormatoDeLaSintesis,
  type ReferenciaDeMetrica,
  type SerieAnalitica,
  type VistaDeAnalisis,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { BloqueDeEstado, Cargando, ErrorConReintento, EstadoVacio } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api, nuevaClaveDeIdempotencia } from '../../../../lib/api';
import { textoDeFalla, useSeguimiento } from './contexto';
import { claveDeLaReferencia, codificarReferencia, hoyEn } from './estado';
import { ICONO_DE_CLASE, ICONO_DE_FALLA, iconoDeLaReferencia } from './iconos-de-metrica';
import { Minigrafico } from './minigrafico';
import { nombreDeLaReferencia } from './selector';
import { useSeriesDelAnalisis, type Disponibles, type SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';

const MAXIMO_DE_INDICADORES = 4;
type Guardada = Extract<VistaDeAnalisis, { usage: 'SUMMARY_INDICATORS' }>;
const SIN_EJERCICIO = { exerciseKey: null, setIndex: null, unit: null } as const;

/** La carga de la primera serie de un ejercicio, en su unidad; si no registra cargas, sus series registradas. */
function indicadorDelEjercicio(e: NonNullable<Disponibles['ejercicios']>[number]): ReferenciaDeMetrica {
  const unidad = e.loadUnits[0];
  return unidad ? { metricId: 'entrenamiento.carga', exerciseKey: e.exerciseKey, setIndex: e.setNumbers[0] ?? 1, unit: unidad } : { metricId: 'entrenamiento.series-registradas', exerciseKey: e.exerciseKey, setIndex: null, unit: null };
}

/**
 * Los indicadores por defecto, con lo que hay y en el orden de las áreas: calorías y proteínas registradas, la carga
 * de la primera serie del ejercicio más registrado y el peso. Es la misma elección con la que abre la entrada de
 * «Analizar». Un área sin datos o sin acceso no aporta el suyo.
 */
export function indicadoresPorDefecto(d: Disponibles): ReferenciaDeMetrica[] {
  const lista: ReferenciaDeMetrica[] = [];
  if (d.nutricion) lista.push({ metricId: 'nutricion.energia', ...SIN_EJERCICIO }, { metricId: 'nutricion.proteinas', ...SIN_EJERCICIO });
  const ejercicio = d.ejercicios?.[0];
  if (ejercicio) lista.push(indicadorDelEjercicio(ejercicio));
  const peso = d.antropometria?.find((m) => m.metricCode === 'peso') ?? d.antropometria?.[0];
  if (peso) lista.push({ metricId: `antropometria.${peso.metricCode}`, ...SIN_EJERCICIO });
  return lista.slice(0, MAXIMO_DE_INDICADORES);
}

export function IndicadoresDelResumen({ disponibles, formato }: { disponibles: Disponibles; formato: FormatoDeLaSintesis }) {
  const { token, sesionPerdida } = useSeguimiento();
  const [guardada, setGuardada] = useState<Guardada | null | undefined>(undefined);
  // Si no se pudo leer la elección guardada, se muestran los de por defecto y se dice: no es que se haya perdido.
  const [sinLeerLaEleccion, setSinLeerLaEleccion] = useState(false);
  const cargar = useCallback(async () => {
    const r = await api.listarVistasDeAnalisis(token);
    if (sesionPerdida(r)) return;
    setSinLeerLaEleccion(!r.ok);
    setGuardada(r.ok ? ((r.datos.data.find((v) => v.usage === 'SUMMARY_INDICATORS') as Guardada | undefined) ?? null) : null);
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const indicadores = useMemo(() => (guardada ? guardada.configuration.metrics : guardada === null ? indicadoresPorDefecto(disponibles) : []), [guardada, disponibles]);
  return <Indicadores indicadores={indicadores} disponibles={disponibles} guardada={guardada ?? null} sinLeerLaEleccion={sinLeerLaEleccion} alGuardar={() => void cargar()} cargando={guardada === undefined || disponibles.cargando} formato={formato} />;
}

function Indicadores({
  indicadores,
  disponibles,
  guardada,
  sinLeerLaEleccion,
  alGuardar,
  cargando,
  formato,
}: {
  indicadores: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  guardada: Guardada | null;
  sinLeerLaEleccion: boolean;
  alGuardar: () => void;
  cargando: boolean;
  formato: FormatoDeLaSintesis;
}) {
  const id = useId();
  const { periodo, href } = useSeguimiento();
  const pedidos = useMemo(() => (cargando ? [] : indicadores), [cargando, indicadores]);
  const { series, recargar } = useSeriesDelAnalisis(pedidos, 'DAY');
  const [editando, setEditando] = useState(false);
  const hoy = hoyEn();
  return (
    <section className="indicadores-del-resumen" aria-labelledby={`${id}-titulo`}>
      <div className="encabezado-de-bloque">
        <h2 id={`${id}-titulo`}>Indicadores</h2>
        <p className="metadatos">
          Del {formato.fecha(periodo.desde)} al {formato.fecha(periodo.hasta)} · describen lo registrado, sin calificar
        </p>
        <button type="button" className="boton boton--enlace" aria-expanded={editando} aria-controls={`${id}-editor`} onClick={() => setEditando(!editando)}>
          {editando ? 'Cerrar' : 'Elegir indicadores'}
        </button>
      </div>
      {disponibles.falla ? <ErrorConReintento mensaje={textoDeFalla(disponibles.falla, 'qué datos hay en el período')} onReintentar={disponibles.recargar} /> : null}
      {sinLeerLaEleccion ? <p className="nota">No pudimos leer los indicadores que elegiste: se muestran los de por defecto. Tu elección sigue guardada.</p> : null}
      {cargando ? <Cargando /> : null}
      {series.length > 0 ? (
        <ul className="indicadores">
          {series.map((s) => {
            const nombre = nombreDelIndicador(s, disponibles);
            return (
              <li key={s.clave} className="indicador" data-metrica={s.ref.metricId}>
                {/* El nombre abre el gráfico grande en «Analizar»: como en las tarjetas, un renglón con flecha abre algo. */}
                <h3>
                  <Link className="indicador__analizar" href={href({ vista: 'analizar', m: codificarReferencia(s.ref), modo: null, f: null, pregunta: null })}>
                    <Icono nombre={iconoDeLaReferencia(s.ref, s.definicion)} tamano={20} />
                    <span className="indicador__nombre">
                      {nombre}
                      <span className="visualmente-oculto"> · analizar</span>
                    </span>
                    <Icono nombre="derecha" tamano={18} />
                  </Link>
                </h3>
                {s.estado.tipo === 'cargando' ? (
                  <BloqueDeEstado tipo="cargando" icono="cargando">
                    Cargando…
                  </BloqueDeEstado>
                ) : null}
                {s.estado.tipo === 'sin-acceso' ? (
                  <BloqueDeEstado tipo="sin-acceso" icono="candado">
                    No disponible con tu acceso actual.
                  </BloqueDeEstado>
                ) : null}
                {s.estado.tipo === 'sin-especificacion' ? (
                  <BloqueDeEstado tipo="sin-especificacion" icono="info">
                    BE no tiene todavía una especificación para calcularlo.
                  </BloqueDeEstado>
                ) : null}
                {s.estado.tipo === 'sin-datos' ? (
                  <BloqueDeEstado tipo="sin-puntos" icono="sin-datos">
                    Sin registros en este período: no es un cero.
                  </BloqueDeEstado>
                ) : null}
                {s.estado.tipo === 'error' ? (
                  <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[s.estado.motivo]} onReintentar={recargar} deQue={nombre}>
                    {textoDeFalla(s.estado.motivo, 'este indicador')}
                  </BloqueDeEstado>
                ) : null}
                {s.estado.tipo === 'lista' ? (
                  <ValorDelIndicador
                    nombre={nombre}
                    serie={s.estado.observaciones}
                    definicion={s.definicion}
                    desde={periodo.desde}
                    hasta={periodo.hasta}
                    hoy={hoy}
                    // Desde cuándo hubo un plan en el que registrar: vale para lo que se registra contra un plan.
                    inicioDelPlan={s.definicion.area === 'ANTROPOMETRIA' ? null : primerPlanDelPeriodo(s.definicion.area === 'NUTRICION' ? disponibles.vigencias.nutricion : disponibles.vigencias.entrenamiento, periodo.desde)}
                    formato={formato}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!cargando && !disponibles.falla && series.length === 0 ? (
        <EstadoVacio titulo="Sin indicadores con datos en este período">Probá con un período más largo o elegí otros indicadores.</EstadoVacio>
      ) : null}
      {/* Menos de cuatro: se dice que no faltan por un error, y qué se puede hacer. */}
      {!cargando && !disponibles.falla && series.length > 0 && series.length < MAXIMO_DE_INDICADORES && !guardada ? (
        <p className="indicadores__sin-mas">
          <Icono nombre="sin-datos" tamano={20} />
          <span>
            <strong>Sin más indicadores con datos en este período.</strong> Probá con un período más largo o elegí otros indicadores.
          </span>
        </p>
      ) : null}
      <div id={`${id}-editor`}>
        {editando ? (
          <EditorDeIndicadores
            actuales={indicadores}
            disponibles={disponibles}
            guardada={guardada}
            alGuardar={() => {
              setEditando(false);
              alGuardar();
            }}
            alConflicto={alGuardar}
          />
        ) : null}
      </div>
    </section>
  );
}

/**
 * El nombre de un indicador: el completo de la métrica («Calorías registradas»), o la medida con su ejercicio y su serie
 * («Carga · Peso muerto · serie 1»). La unidad no va en el nombre: está al lado del valor.
 */
function nombreDelIndicador(s: SerieDelAnalisis, disponibles: Disponibles): string {
  if (s.definicion.area === 'NUTRICION') return s.definicion.nombre;
  return nombreDeLaReferencia({ ...s.ref, unit: null }, s.definicion, disponibles.ejercicios);
}

/** Cómo se resume el período, dicho antes de la cobertura: la regla es de la métrica y es la misma en todo BE. */
const REGLA: Readonly<Record<DefinicionDeMetrica['resumenDePeriodo'], string>> = {
  MEDIA_DE_DIAS_CON_DATOS: 'Media de los días con valor',
  MEDIANA: 'Mediana de las sesiones',
  TOTAL: 'Total del período',
  PRIMERO_Y_ULTIMO_COMPARABLES: 'Última toma',
};

function ValorDelIndicador({
  nombre,
  serie,
  definicion,
  desde,
  hasta,
  hoy,
  inicioDelPlan,
  formato,
}: {
  nombre: string;
  serie: SerieAnalitica;
  definicion: DefinicionDeMetrica;
  desde: string;
  hasta: string;
  hoy: string;
  inicioDelPlan: string | null;
  formato: FormatoDeLaSintesis;
}) {
  const r = resumirPeriodo(serie, definicion, desde, hasta, hoy);
  if (r.valor === null) {
    return (
      <BloqueDeEstado tipo="sin-puntos" icono="sin-datos">
        {r.incompletos > 0 ? 'Solo hay datos de hoy, que sigue en curso: todavía no hay un día completo que resumir.' : 'Sin datos en el período: no es un cero.'}
      </BloqueDeEstado>
    );
  }
  const valor = valorParaMostrar(r.valor, definicion, serie.unit);
  const corte = valor.lastIndexOf(' ');
  const deTomas = definicion.resumenDePeriodo === 'PRIMERO_Y_ULTIMO_COMPARABLES';
  const ultimo = r.ultimo;
  const primero = r.primero;
  // La última sesión de una métrica que se resume con la mediana: el número de hoy al lado del número del período.
  const conValor = serie.points.filter((p) => p.value !== null && p.date >= desde && p.date <= hasta);
  const ultimaSesion = definicion.resumenDePeriodo === 'MEDIANA' ? (conValor[conValor.length - 1] ?? null) : null;
  // La cobertura, con las mismas partes que la tabla de etapas y «Comparar dos períodos» (GUIA-UX-UI I.2).
  const cobertura = partesDeLaCobertura(r);
  const sombrea = serie.grain === 'DAY' && serie.gaps.length > 0;
  return (
    <>
      <div className="indicador__dato">
        <p className="indicador__valor">
          {corte > 0 ? (
            <>
              {valor.slice(0, corte)} <small>{valor.slice(corte + 1)}{definicion.resumenDePeriodo === 'MEDIA_DE_DIAS_CON_DATOS' ? ' por día' : ''}</small>
            </>
          ) : (
            valor
          )}
        </p>
        {/* La clase del dato, donde llega: en una toma. En comidas y series BE todavía no la distingue. */}
        {deTomas && ultimo?.dataClass ? (
          <span className="etiqueta-de-dato" title={claseEnPalabras(ultimo.dataClass, ultimo.method)}>
            <Icono nombre={ICONO_DE_CLASE[ultimo.dataClass]} tamano={15} />
            <span className="visualmente-oculto">Clase de dato: </span>
            {/^\S+?(?=[\s:,]|$)/.exec(claseEnPalabras(ultimo.dataClass, ultimo.method))?.[0]}
          </span>
        ) : null}
      </div>
      <p className="indicador__regla">
        {deTomas ? `${REGLA[definicion.resumenDePeriodo]}: ${ultimo ? formato.fecha(ultimo.date) : '—'}` : REGLA[definicion.resumenDePeriodo]}
      </p>
      <Minigrafico serie={serie} desde={desde} hasta={hasta} hoy={hoy} inicioDelPlan={inicioDelPlan} descripcion={`Gráfico de ${nombre}. ${resumenTextual(serie, definicion, desde, hasta)}`} />
      <p className="indicador__cobertura">
        {cobertura.map((parte, i) => (
          <span key={parte}>
            {i > 0 ? ' · ' : ''}
            {/* La muestra gris acompaña a la cuenta solo si el minigráfico sombrea esos días. */}
            {/sin registros$/.test(parte) && sombrea ? <span className="muestra-de-hueco" aria-hidden="true" /> : null}
            {parte}
          </span>
        ))}
      </p>
      {inicioDelPlan ? (
        <p className="indicador__nota">
          <span className="muestra-de-inicio" aria-hidden="true" />
          {inicioDelPrimerPlan(inicioDelPlan, formato)}
        </p>
      ) : null}
      {deTomas ? (
        <p className="indicador__nota">
          {primero && ultimo && primero.pointId !== ultimo.pointId && primero.value !== null
            ? `Primera comparable del período: ${valorParaMostrar(primero.value, definicion, serie.unit)} el ${formato.fecha(primero.date)} · diferencia ${r.valor - primero.value > 0 ? '+' : ''}${numero(Number((r.valor - primero.value).toFixed(definicion.decimales)))} ${serie.unit} (${numero(r.n)} tomas comparables)`
            : 'Una sola observación comparable: no hay con qué comparar.'}
        </p>
      ) : null}
      {ultimaSesion && ultimaSesion.value !== null ? (
        <p className="indicador__nota">
          Última sesión: {formato.fecha(ultimaSesion.date)} · {valorParaMostrar(ultimaSesion.value, definicion, serie.unit)}
        </p>
      ) : null}
    </>
  );
}

function EditorDeIndicadores({
  actuales,
  disponibles,
  guardada,
  alGuardar,
  alConflicto,
}: {
  actuales: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  guardada: Guardada | null;
  alGuardar: () => void;
  /** Vuelve a leer la elección guardada sin cerrar el editor: lo marcado acá no se pierde. */
  alConflicto: () => void;
}) {
  const { token, sesionPerdida } = useSeguimiento();
  const id = useId();
  const candidatas = useMemo(() => {
    const lista: ReferenciaDeMetrica[] = [];
    if (disponibles.nutricion) for (const m of METRICAS_DEL_DICCIONARIO.filter((x) => x.area === 'NUTRICION' && x.implementada)) lista.push({ metricId: m.id, ...SIN_EJERCICIO });
    // De cada ejercicio (los cinco más registrados): la carga de su primera serie, si registra cargas, y sus series.
    for (const e of (disponibles.ejercicios ?? []).slice(0, 5)) {
      const carga = indicadorDelEjercicio(e);
      if (carga.metricId === 'entrenamiento.carga') lista.push(carga);
      lista.push({ metricId: 'entrenamiento.series-registradas', exerciseKey: e.exerciseKey, setIndex: null, unit: null });
    }
    for (const m of disponibles.antropometria ?? []) lista.push({ metricId: `antropometria.${m.metricCode}`, ...SIN_EJERCICIO });
    return lista;
  }, [disponibles]);
  const [elegidas, setElegidas] = useState<readonly ReferenciaDeMetrica[]>(actuales);
  const [error, setError] = useState<string | null>(null);
  const alternar = (r: ReferenciaDeMetrica) => {
    const clave = claveDeLaReferencia(r);
    setElegidas((e) => (e.some((x) => claveDeLaReferencia(x) === clave) ? e.filter((x) => claveDeLaReferencia(x) !== clave) : e.length >= MAXIMO_DE_INDICADORES ? e : [...e, r]));
  };
  const guardar = async () => {
    if (elegidas.length === 0) return setError('Elegí al menos uno.');
    const configuracion = { schemaVersion: 1 as const, metrics: [...elegidas] };
    const r = guardada
      ? await api.reemplazarVistaDeAnalisis(token, guardada.viewId, { expectedVersion: guardada.version, name: 'Indicadores del resumen', configuration: configuracion })
      : await api.crearVistaDeAnalisis(token, { usage: 'SUMMARY_INDICATORS', name: 'Indicadores del resumen', configuration: configuracion }, nuevaClaveDeIdempotencia());
    if (sesionPerdida(r)) return;
    // Un conflicto: la elección guardada cambió en otra pestaña. Se vuelve a leer (así el próximo «Guardar» parte de la
    // versión nueva) y lo marcado acá se conserva: guardar de nuevo es una decisión explícita. Antes el aviso decía «se
    // volvieron a leer» sin hacerlo, y cada intento volvía a chocar con la misma versión vieja.
    if (!r.ok && r.tipo === 'API' && (r.codigo === 'VERSION_CONFLICT' || r.codigo === 'RESOURCE_CONFLICT')) {
      alConflicto();
      return setError('Los indicadores cambiaron en otra pestaña. Tu elección sigue acá: si la guardás, reemplaza la que se guardó allá.');
    }
    if (!r.ok) return setError('No pudimos guardar los indicadores. Probá de nuevo.');
    alGuardar();
  };
  // Lo que está elegido y hoy no se puede ofrecer (un ejercicio sin registros en este período, o de otra persona): sigue
  // a la vista y se puede desmarcar; nada queda elegido sin verse.
  const fueraDeLaLista = elegidas.filter((x) => !candidatas.some((c) => claveDeLaReferencia(c) === claveDeLaReferencia(x)));
  return (
    <fieldset className="capas editor-de-indicadores">
      <legend>
        Hasta {MAXIMO_DE_INDICADORES} indicadores (se guardan en tu cuenta y valen para todos tus asesorados). {guardada ? 'Los elegiste vos.' : 'Hoy se ven los de por defecto.'}
      </legend>
      {[...candidatas, ...fueraDeLaLista].map((r) => {
        const clave = claveDeLaReferencia(r);
        const marcada = elegidas.some((x) => claveDeLaReferencia(x) === clave);
        return (
          <label key={clave} className="capa">
            <input type="checkbox" checked={marcada} disabled={!marcada && elegidas.length >= MAXIMO_DE_INDICADORES} onChange={() => alternar(r)} />
            {nombreDeLaReferencia(r, definicionDeMetrica(r.metricId, ''), disponibles.ejercicios)}
          </label>
        );
      })}
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => void guardar()}>
          Guardar indicadores
        </button>
        <span className="nota" id={`${id}-cuantos`}>
          {elegidas.length} de {MAXIMO_DE_INDICADORES}
        </span>
      </div>
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
