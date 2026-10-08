'use client';

/**
 * Analizar («¿Cómo evolucionaron estas variables?»; encargo §8; ESPECIFICACION.md §4). Hasta tres métricas, cada una
 * vista de una proyección de API-PRJ-01 con el cálculo del dominio:
 * - tres modos: paneles sincronizados (por defecto), superpuestas en valores reales (misma familia y unidad) y cambio
 *   relativo (contra una referencia explícita y positiva). Un modo que no corresponde se deshabilita y dice por qué;
 * - un panel de lectura persistente para la fecha elegida: el valor exacto nunca depende de pasar el puntero;
 * - «Cómo se calcula», la tabla de datos, el resumen textual y la comparación de dos períodos (sin conclusiones
 *   causales: «coincidencia temporal; no indica causa»);
 * - todo el estado en la URL; un punto abre su registro de origen y al cerrarlo la vista sigue igual.
 */
import {
  cambioRelativo,
  compararPeriodos,
  csvDelAnalisis,
  lecturaEnFecha,
  nombreDeLaExportacion,
  textoDeFaltante,
  NOMBRE_DE_DOMINIO,
  numero,
  puntosRelativos,
  referenciaDeLaSerie,
  resumenTextual,
  superposicionPermitida,
  valorConUnidad,
  type LineaDeTiempoResponse,
  type OrigenDeDato,
  type PuntoAnalitico,
  type Referencia,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useId, useMemo, useState } from 'react';
import { Cargando } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { leerAnalisis, parametrosDeAnalisis, restarDias, type EstadoDeAnalisis, type GranoElegido, type Modo } from './estado';
import { ESTILOS, Marca, type SerieParaDibujar } from './lienzo';
import { nombreDeLaReferencia, PresetsDeAnalisis, SelectorDeMetricas } from './selector';
import { useDisponibles, useSeriesDelAnalisis, type SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';
import { VistasGuardadas } from './vistas-guardadas';

const Lienzo = dynamic(() => import('./lienzo').then((m) => m.Lienzo), { ssr: false, loading: () => <Cargando /> });
const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

const MOTIVO_SIN_REFERENCIA: Readonly<Record<string, string>> = {
  ESCALA_NO_ADMITE: 'no admite cambio relativo (no es una escala de razón)',
  SIN_OBSERVACIONES: 'no tiene observaciones en los días de referencia',
  NO_POSITIVA: 'su referencia es cero o negativa',
};
const MOTIVO_SIN_SUPERPOSICION: Readonly<Record<string, string>> = {
  UNA_SOLA_METRICA: 'hace falta más de una métrica',
  UNIDADES_DISTINTAS: 'las métricas tienen unidades distintas',
  FAMILIAS_DISTINTAS: 'son medidas de distinta clase, aunque compartan unidad',
  SIN_FAMILIA: 'alguna métrica no se puede superponer con otras',
};
const CALIDAD: Readonly<Record<PuntoAnalitico['quality'], string>> = { COMPLETE: 'sin faltantes', PARTIAL: 'subtotal de lo registrado', UNKNOWN: 'sin valor conocido' };
/** Un balde incompleto: el día de hoy, que sigue en curso, o una semana que el período corta. */
const textoDeIncompleto = (p: PuntoAnalitico): string => (p.dateEnd ? 'semana sin completar en el período' : 'día en curso: el valor todavía puede cambiar');
const calidadDelPunto = (p: PuntoAnalitico): string => (p.partialBucket ? `${CALIDAD[p.quality]} · ${textoDeIncompleto(p)}` : CALIDAD[p.quality]);
const HITOS = 'NUTRITION_PLAN_ACTIVATED,TRAINING_PLAN_ACTIVATED,NUTRITION_OBJECTIVE_SET,TRAINING_OBJECTIVE_SET,NUTRITION_REVIEW_RECORDED,TRAINING_REVIEW_RECORDED,FOLLOW_UP_OPENED,FOLLOW_UP_CLOSED';

export function Analizar() {
  const { token, asesoradoId, periodo, parametros, ir } = useSeguimiento();
  const id = useId();
  const estado = useMemo(() => leerAnalisis(parametros), [parametros]);
  const cambiar = (c: Partial<EstadoDeAnalisis>) => ir(parametrosDeAnalisis({ ...estado, ...c }));
  const disponibles = useDisponibles();
  const { series, recargar } = useSeriesDelAnalisis(estado.metricas, estado.grano);
  const [intervalo, setIntervalo] = useState<{ desde: string; hasta: string } | null>(null);
  const desde = intervalo && intervalo.desde >= periodo.desde ? intervalo.desde : periodo.desde;
  const hasta = intervalo && intervalo.hasta <= periodo.hasta ? intervalo.hasta : periodo.hasta;
  const [aviso, setAviso] = useState<string | null>(null);
  const [puntoAbierto, setPuntoAbierto] = useState<{ indice: number; punto: PuntoAnalitico; origen: OrigenDeDato | null } | null>(null);

  const listas = series.filter((s): s is SerieDelAnalisis & { estado: Extract<SerieDelAnalisis['estado'], { tipo: 'lista' }> } => s.estado.tipo === 'lista');
  const nombres = series.map((s) => nombreDeLaReferencia(s.ref, s.definicion, disponibles.ejercicios));

  // La referencia del cambio relativo: los primeros N días de lo que se ve.
  const refHasta = restarDias(desde, -(estado.diasDeReferencia - 1));
  const referencias = new Map<string, Referencia>(listas.map((s) => [s.clave, referenciaDeLaSerie(s.estado.serie, s.definicion, desde, refHasta < hasta ? refHasta : hasta)]));
  const superposicion = superposicionPermitida(listas.map((s) => ({ definicion: s.definicion, unidad: s.estado.serie.unit })));
  const sinReferencia = listas.filter((s) => referencias.get(s.clave)?.tipo !== 'valida');
  const relativoPosible = listas.length > 0 && sinReferencia.length === 0;
  const modo: Modo = estado.modo === 'OVERLAY' && !superposicion.permitida ? 'PANELS' : estado.modo === 'RELATIVE' && !relativoPosible ? 'PANELS' : estado.modo;

  const dibujables: SerieParaDibujar[] = listas.map((s) => {
    const indice = series.indexOf(s);
    const ref = referencias.get(s.clave);
    const relativos = modo === 'RELATIVE' && ref?.tipo === 'valida' ? new Map(puntosRelativos(s.estado.serie, ref).map((p) => [p.pointId, p.relativo])) : null;
    return {
      indice,
      nombre: nombres[indice] ?? s.definicion.nombre,
      unidad: s.estado.serie.unit,
      serie: s.estado.serie,
      valor: (p) => (relativos ? (relativos.get(p.pointId) ?? null) : p.value),
      decimales: s.definicion.decimales,
    };
  });
  const fechasConDato = useMemo(
    () => [...new Set(listas.flatMap((s) => s.estado.serie.points.filter((p) => p.value !== null && p.date >= desde && p.date <= hasta).map((p) => p.date)))].sort(),
    [listas, desde, hasta],
  );
  const fecha = estado.fecha && estado.fecha >= desde && estado.fecha <= hasta ? estado.fecha : (fechasConDato[fechasConDato.length - 1] ?? null);

  const bandas = estado.bandas
    ? [...new Map(listas.flatMap((s) => s.estado.bandas.map((b) => [b.planVersionId, { ...b, area: b.domain === 'NUTRITION' ? 'Nutrición' : 'Entrenamiento' }] as const))).values()]
    : [];
  const { lectura: hitosLeidos } = useLectura<LineaDeTiempoResponse>(estado.eventos ? `hitos|${asesoradoId}|${periodo.desde}|${periodo.hasta}` : null, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.desde, periodEnd: periodo.hasta, type: HITOS, limit: '50' }),
  );
  const hitos = estado.eventos && hitosLeidos.tipo === 'listo' ? hitosLeidos.datos.data.entries.map((e) => ({ fecha: e.occurredDate, texto: e.title })) : [];

  const descripcion = listas.map((s) => resumenTextual(s.estado.serie, s.definicion, desde, hasta)).join(' ');
  const marcas = estado.metricas.map((_, i) => <Marca key={i} indice={i} conTrazo={modo !== 'PANELS'} />);

  return (
    <section className="seccion analizar" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Analizar</h2>
      <p className="nota">Hasta tres métricas en el mismo tiempo. Coincidencia temporal: no indica causa.</p>
      <div className="analizar__cuerpo">
        <div className="analizar__seleccion">
          <SelectorDeMetricas elegidas={estado.metricas} disponibles={disponibles} onCambiar={(metricas) => cambiar({ metricas, fecha: null })} marcas={marcas} />
          <PresetsDeAnalisis
            disponibles={disponibles}
            hayMetricas={estado.metricas.length > 0}
            onAplicar={(metricas, preset, faltantes, comparar) => {
              const mitad = restarDias(periodo.hasta, Math.floor((Date.parse(periodo.hasta) - Date.parse(periodo.desde)) / 86_400_000 / 2));
              cambiar({
                metricas: preset.comparaPeriodos && metricas.length === 0 ? estado.metricas : metricas,
                fecha: null,
                comparacion: comparar ? { a: { desde: periodo.desde, hasta: restarDias(mitad, 1) }, b: { desde: mitad, hasta: periodo.hasta } } : estado.comparacion,
              });
              setAviso(
                [preset.limite, faltantes.length > 0 ? `Sin datos en el período para: ${faltantes.map((f) => f.replace(/^[a-z]+\./, '').replace(/-/g, ' ')).join(', ')}. Elegí otra métrica si querés.` : ''].filter(Boolean).join(' '),
              );
            }}
          />
          {aviso ? (
            <p className="nota" role="status">
              {aviso}
            </p>
          ) : null}
        </div>

        <div className="analizar__lienzo">
          {intervalo ? (
            <p className="nota">
              Intervalo: {diaCivil(desde)} al {diaCivil(hasta)}.{' '}
              <button type="button" className="boton boton--enlace" onClick={() => setIntervalo(null)}>
                Restablecer vista
              </button>
            </p>
          ) : null}
          <SeleccionDeIntervalo desde={desde} hasta={hasta} minimo={periodo.desde} maximo={periodo.hasta} onCambiar={(d, h) => setIntervalo({ desde: d, hasta: h })} />
          {estado.metricas.length === 0 ? <p>Elegí una métrica o una pregunta para empezar.</p> : null}
          {series.map((s, i) =>
            s.estado.tipo === 'lista' ? null : (
              <EstadoDeUnaSerie key={s.clave} nombre={nombres[i] ?? s.definicion.nombre} estado={s.estado} onReintentar={recargar} />
            ),
          )}
          {listas.some((s) => s.estado.parcial) ? <p className="nota">Vista parcial: hay datos de esta área que no ves (los de otro profesional).</p> : null}
          {dibujables.length > 0 ? (
            <>
              <ul className="leyenda" aria-label="Leyenda">
                {dibujables.map((d) => (
                  <li key={d.indice}>
                    <Marca indice={d.indice} conTrazo={modo !== 'PANELS'} /> {d.nombre} · {modo === 'PANELS' ? ESTILOS[d.indice]?.nombreDeLaMarca : `${ESTILOS[d.indice]?.nombreDeLaMarca}, ${ESTILOS[d.indice]?.nombreDelTrazo}`}
                  </li>
                ))}
                <li>
                  <Marca indice={0} hueco /> Hueco: subtotal (falta algún dato), o día o semana sin completar
                </li>
              </ul>
              {modo === 'RELATIVE' ? (
                <ul className="referencias" aria-label="Referencias del cambio relativo">
                  {listas.map((s) => {
                    const r = referencias.get(s.clave);
                    const indice = series.indexOf(s);
                    return r?.tipo === 'valida' ? (
                      <li key={s.clave}>
                        <Marca indice={indice} /> <strong>{nombres[indice]}</strong>: {textoDeReferencia(r, s)}
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : null}
              {hitos.length > 0 ? (
                <details className="hitos">
                  <summary>Hitos del período ({numero(hitos.length)}): las líneas verticales punteadas</summary>
                  <ul>
                    {hitos.map((h, i) => (
                      <li key={`${h.fecha}-${i}`}>
                        {diaCivil(h.fecha)} · {h.texto}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <Lienzo
                modo={modo}
                series={dibujables}
                desde={desde}
                hasta={hasta}
                fecha={fecha}
                fechasConDato={fechasConDato}
                onFecha={(f) => cambiar({ fecha: f })}
                onPunto={(indice, punto) => {
                  cambiar({ fecha: punto.date });
                  setPuntoAbierto({ indice, punto, origen: null });
                }}
                onIntervalo={(d, h) => setIntervalo({ desde: d, hasta: h })}
                bandas={bandas}
                hitos={hitos}
                referencia={modo === 'RELATIVE' ? { desde, hasta: refHasta < hasta ? refHasta : hasta } : null}
                descripcion={descripcion}
              />
            </>
          ) : null}
        </div>

        {/* En escritorio ancho, la lectura queda fija al costado de los gráficos mientras se recorren las fechas. */}
        {dibujables.length > 0 ? (
          <div className="analizar__lectura">
            <PanelDeLectura
              fecha={fecha}
              fechasConDato={fechasConDato}
              series={listas}
              nombres={nombres}
              todas={series}
              referencias={modo === 'RELATIVE' ? referencias : null}
              conTrazo={modo !== 'PANELS'}
              onFecha={(f) => cambiar({ fecha: f })}
              onAbrir={(indice, punto) => setPuntoAbierto({ indice, punto, origen: null })}
            />
          </div>
        ) : null}

        <div className="analizar__opciones">
          <fieldset className="capas">
            <legend>Cómo se leen</legend>
            <ModoElegible modo="PANELS" actual={modo} cambiar={(m) => cambiar({ modo: m })} texto="Paneles sincronizados" motivo={null} />
            <ModoElegible modo="OVERLAY" actual={modo} cambiar={(m) => cambiar({ modo: m })} texto="Superpuestas en valores reales" motivo={superposicion.permitida ? null : (MOTIVO_SIN_SUPERPOSICION[superposicion.motivo ?? ''] ?? null)} />
            <ModoElegible
              modo="RELATIVE"
              actual={modo}
              cambiar={(m) => cambiar({ modo: m })}
              texto="Cambio relativo"
              motivo={relativoPosible ? null : listas.length === 0 ? 'no hay series cargadas' : `${sinReferencia.map((s) => nombres[series.indexOf(s)]).join(', ')}: ${sinReferencia.map((s) => MOTIVO_SIN_REFERENCIA[(referencias.get(s.clave) as { motivo?: string } | undefined)?.motivo ?? ''] ?? '').join('; ')}`}
            />
          </fieldset>
          <fieldset className="capas">
            <legend>Grano</legend>
            {(['ORIGINAL', 'DAY', 'WEEK'] as const).map((g) => (
              <label key={g} className="capa">
                <input type="radio" name={`${id}-grano`} checked={estado.grano === g} onChange={() => cambiar({ grano: g as GranoElegido })} />
                {g === 'ORIGINAL' ? 'Cada registro' : g === 'DAY' ? 'Por día' : 'Por semana'}
              </label>
            ))}
            {series.some((s) => s.grano !== estado.grano) ? (
              <p className="nota">
                {series
                  .filter((s) => s.grano !== estado.grano)
                  .map((s) => `${nombres[series.indexOf(s)]}: ${s.grano === 'ORIGINAL' ? 'cada toma o sesión' : s.grano === 'DAY' ? 'por día' : 'por semana'} (el grano pedido no aplica)`)
                  .join('. ')}
                .
              </p>
            ) : null}
          </fieldset>
          <fieldset className="capas">
            <legend>Capas</legend>
            <label className="capa">
              <input type="checkbox" checked={estado.bandas} onChange={() => cambiar({ bandas: !estado.bandas })} />
              Vigencia de planes
            </label>
            <label className="capa">
              <input type="checkbox" checked={estado.eventos} onChange={() => cambiar({ eventos: !estado.eventos })} />
              Hitos (activaciones, objetivos, revisiones)
            </label>
          </fieldset>
          {modo === 'RELATIVE' || estado.modo === 'RELATIVE' ? (
            <div className="campo">
              <label htmlFor={`${id}-ref`}>Referencia: los primeros días</label>
              <input id={`${id}-ref`} type="number" min={1} max={31} value={estado.diasDeReferencia} onChange={(e) => cambiar({ diasDeReferencia: Math.min(31, Math.max(1, Number(e.target.value) || 7)) })} />
            </div>
          ) : null}
          <VistasGuardadas estado={estado} />
        </div>
      </div>

      {listas.length > 0 ? (
        <>
          <ComoSeCalcula series={listas} nombres={nombres} todas={series} />
          <TablaDeDatos series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} />
          <ExportarCsv series={listas} nombres={nombres} todas={series} desde={desde} hasta={hasta} />
          <section aria-labelledby={`${id}-resumen`}>
            <h3 id={`${id}-resumen`}>Resumen en texto</h3>
            {listas.map((s) => (
              <p key={s.clave}>{resumenTextual(s.estado.serie, s.definicion, desde, hasta)}</p>
            ))}
          </section>
          <ComparacionDePeriodos series={listas} nombres={nombres} todas={series} estado={estado} cambiar={cambiar} minimo={periodo.desde} maximo={periodo.hasta} />
        </>
      ) : null}

      <PanelDeRegistro
        origen={puntoAbierto ? (puntoAbierto.origen ?? puntoAbierto.punto.sources[0] ?? null) : null}
        titulo={puntoAbierto ? `${nombres[puntoAbierto.indice] ?? ''} · ${diaCivil(puntoAbierto.punto.date)}` : ''}
        onCerrar={() => setPuntoAbierto(null)}
      >
        {puntoAbierto ? <DetalleDelPunto abierto={puntoAbierto} serie={series[puntoAbierto.indice]} onOrigen={(o) => setPuntoAbierto({ ...puntoAbierto, origen: o })} /> : null}
      </PanelDeRegistro>
    </section>
  );
}

function ModoElegible({ modo, actual, cambiar, texto, motivo }: { modo: Modo; actual: Modo; cambiar: (m: Modo) => void; texto: string; motivo: string | null }) {
  const id = useId();
  return (
    <div className="modo-elegible">
      <label className="capa">
        <input type="radio" name="modo-de-lectura" checked={actual === modo} disabled={motivo !== null} aria-describedby={motivo ? `${id}-motivo` : undefined} onChange={() => cambiar(modo)} />
        {texto}
      </label>
      {motivo ? (
        <p id={`${id}-motivo`} className="nota">
          No disponible: {motivo}.
        </p>
      ) : null}
    </div>
  );
}

function SeleccionDeIntervalo({ desde, hasta, minimo, maximo, onCambiar }: { desde: string; hasta: string; minimo: string; maximo: string; onCambiar: (d: string, h: string) => void }) {
  const id = useId();
  return (
    <details className="intervalo">
      <summary>Elegir un intervalo con fechas (también se puede arrastrar sobre un gráfico)</summary>
      <div className="acciones">
        <div className="campo">
          <label htmlFor={`${id}-d`}>Desde</label>
          <input id={`${id}-d`} type="date" min={minimo} max={hasta} value={desde} onChange={(e) => e.target.value && onCambiar(e.target.value, hasta)} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-h`}>Hasta</label>
          <input id={`${id}-h`} type="date" min={desde} max={maximo} value={hasta} onChange={(e) => e.target.value && onCambiar(desde, e.target.value)} />
        </div>
      </div>
    </details>
  );
}

function EstadoDeUnaSerie({ nombre, estado, onReintentar }: { nombre: string; estado: Exclude<SerieDelAnalisis['estado'], { tipo: 'lista' }>; onReintentar: () => void }) {
  if (estado.tipo === 'cargando') return <p className="nota">Cargando {nombre}…</p>;
  if (estado.tipo === 'sin-acceso') return <p className="nota">{nombre}: no está disponible con tu acceso actual.</p>;
  if (estado.tipo === 'sin-especificacion') return <p className="nota">{nombre}: BE no tiene todavía una especificación para calcularla.</p>;
  return (
    <p className="campo__error">
      {textoDeFalla(estado.motivo, nombre)} Las otras métricas siguen.{' '}
      <button type="button" className="boton boton--enlace" onClick={onReintentar}>
        Reintentar
      </button>
    </p>
  );
}

type Lista = SerieDelAnalisis & { estado: Extract<SerieDelAnalisis['estado'], { tipo: 'lista' }> };

const REGLA_DE_REFERENCIA: Readonly<Record<Extract<Referencia, { tipo: 'valida' }>['regla'], string>> = {
  MEDIA: 'media de los días con valor',
  MEDIANA: 'mediana de las sesiones',
  PRIMERA: 'primera toma del rango',
};

/** La referencia explícita del cambio relativo: regla, rango, valor y n (encargo §12; DICCIONARIO §1). */
function textoDeReferencia(r: Extract<Referencia, { tipo: 'valida' }>, s: Lista): string {
  const extras = [
    // Con menos de 3 observaciones la referencia es frágil (un día atípico mueve todo el cambio relativo): se dice, sin
    // bloquear. La primera toma de antropometría es una sola por definición.
    `n = ${numero(r.n)}${r.regla !== 'PRIMERA' && r.n < 3 ? ': pocas observaciones, la referencia es frágil' : ''}`,
    ...(r.parciales ? [`${numero(r.parciales)} ${r.parciales === 1 ? 'subtotal' : 'subtotales'}`] : []),
    ...(r.incompletos ? [`${numero(r.incompletos)} sin completar, fuera de la referencia`] : []),
    ...(r.tramo !== null ? ['solo se compara con su mismo tramo comparable'] : []),
  ];
  return `${REGLA_DE_REFERENCIA[r.regla]} del ${diaCivil(r.desde)} al ${diaCivil(r.hasta)}, ${valorParaMostrar(r.valor, s.definicion, s.estado.serie.unit)} (${extras.join('; ')})`;
}

/** El cambio relativo de un punto contra su referencia, dicho en palabras; `null` si no corresponde. */
function relativoDelPunto(p: PuntoAnalitico, r: Referencia | undefined): string | null {
  if (!r || r.tipo !== 'valida' || p.value === null) return null;
  if (r.tramo !== null && p.segment !== r.tramo) return 'sin cambio relativo: es de otro tramo comparable que la referencia';
  const v = cambioRelativo(p.value, r.valor);
  return `${v > 0 ? '+' : ''}${numero(Number(v.toFixed(1)))} % contra la referencia`;
}

function PanelDeLectura({
  fecha,
  fechasConDato,
  series,
  nombres,
  todas,
  referencias,
  conTrazo,
  onFecha,
  onAbrir,
}: {
  fecha: string | null;
  fechasConDato: readonly string[];
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  /** En el modo de cambio relativo: la referencia de cada serie; la lectura dice el cambio y el valor real. */
  referencias: ReadonlyMap<string, Referencia> | null;
  /** Si la muestra lleva el trazo de la línea (solo cuando las series comparten un gráfico). */
  conTrazo: boolean;
  onFecha: (f: string) => void;
  onAbrir: (indice: number, punto: PuntoAnalitico) => void;
}) {
  const id = useId();
  const i = fecha ? fechasConDato.indexOf(fecha) : -1;
  return (
    <section className="detalle-de-valores panel-de-lectura" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{fecha ? `Lectura del ${diaCivil(fecha)}` : 'Lectura'}</h3>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={i <= 0} onClick={() => onFecha(fechasConDato[i - 1]!)}>
          Fecha anterior con datos
        </button>
        <div className="campo">
          <label htmlFor={`${id}-fecha`}>Fecha elegida</label>
          <input id={`${id}-fecha`} type="date" value={fecha ?? ''} onChange={(e) => e.target.value && onFecha(e.target.value)} />
        </div>
        <button type="button" className="boton boton--secundario" disabled={i < 0 || i >= fechasConDato.length - 1} onClick={() => onFecha(fechasConDato[i + 1]!)}>
          Fecha siguiente con datos
        </button>
      </div>
      <div aria-live="polite">
        {fecha
          ? series.map((s) => {
              const indice = todas.indexOf(s);
              const l = lecturaEnFecha(s.estado.serie, fecha, true);
              return (
                <div key={s.clave} className="panel-de-lectura__metrica">
                  <p>
                    <Marca indice={indice} conTrazo={conTrazo} /> <strong>{nombres[indice]}</strong>
                  </p>
                  {l.tipo === 'valores' ? (
                    l.puntos.map((p) => (
                      <div key={p.pointId}>
                        <p>
                          {referencias && relativoDelPunto(p, referencias.get(s.clave)) ? <strong>{relativoDelPunto(p, referencias.get(s.clave))} · valor real </strong> : null}
                          {p.value === null ? 'Sin valor conocido' : valorParaMostrar(p.value, s.definicion, s.estado.serie.unit)} · {calidadDelPunto(p)} · n = {numero(p.n)}
                          {p.dateEnd ? ` · semana del ${diaCivil(p.date)} al ${diaCivil(p.dateEnd)}` : ''}
                          {p.corrected ? ' · con una corrección vigente' : ''}
                        </p>
                        {p.detail.length > 0 ? <p className="nota">{p.detail.map((d) => `${d.label}: ${d.value}`).join(' · ')}</p> : null}
                        {p.missing.length > 0 ? <p className="nota">Falta: {p.missing.map((m) => `${numero(m.count)} ${textoDeFaltante(m.reason)}`).join(', ')}</p> : null}
                        <button type="button" className="boton boton--enlace" onClick={() => onAbrir(indice, p)}>
                          Ver el origen de este dato
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="nota">
                      Sin dato en esta fecha.
                      {l.masCercano
                        ? ` El más cercano: ${diaCivil(l.masCercano.punto.date)}, a ${numero(l.masCercano.distanciaDias)} ${l.masCercano.distanciaDias === 1 ? 'día' : 'días'}: ${valorParaMostrar(l.masCercano.punto.value as number, s.definicion, s.estado.serie.unit)}. No es simultáneo.`
                        : ''}
                    </p>
                  )}
                </div>
              );
            })
          : null}
      </div>
    </section>
  );
}


function DetalleDelPunto({ abierto, serie, onOrigen }: { abierto: { indice: number; punto: PuntoAnalitico; origen: OrigenDeDato | null }; serie: SerieDelAnalisis | undefined; onOrigen: (o: OrigenDeDato) => void }) {
  const p = abierto.punto;
  const actual = abierto.origen ?? p.sources[0] ?? null;
  return (
    <div>
      <p>
        {p.value === null || !serie ? 'Sin valor conocido' : valorParaMostrar(p.value, serie.definicion, serie.estado.tipo === 'lista' ? serie.estado.serie.unit : serie.definicion.unidad)} · {calidadDelPunto(p)} · n = {numero(p.n)}
      </p>
      {p.sources.length > 1 ? (
        <>
          <p className="nota">
            Este dato sale de {numero(p.sources.length)} registros{p.sourcesTruncated ? ' (y más, que no se listan)' : ''}. Elegí cuál abrir:
          </p>
          <ul className="selector-de-series">
            {p.sources.map((o, i) => (
              <li key={o.id}>
                <button type="button" className="chip" aria-pressed={actual?.id === o.id} onClick={() => onOrigen(o)}>
                  Registro {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function ComoSeCalcula({ series, nombres, todas }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[] }) {
  return (
    <details className="como-se-calcula">
      <summary>Cómo se calcula</summary>
      {series.map((s) => (
        <div key={s.clave}>
          <h4>{nombres[todas.indexOf(s)]}</h4>
          <p>{s.definicion.explicacion}</p>
          <p>{s.definicion.comoSeCalcula}</p>
          <p className="nota">{s.definicion.ausencias}</p>
          <ul>
            {[...new Set([...s.definicion.limites, ...s.estado.serie.notes])].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="nota">
            Área: {NOMBRE_DE_DOMINIO[s.definicion.area === 'NUTRICION' ? 'NUTRITION' : s.definicion.area === 'ENTRENAMIENTO' ? 'TRAINING' : 'ANTHROPOMETRY']} · generada el {new Date(s.estado.generada).toLocaleString('es-AR')}
          </p>
        </div>
      ))}
    </details>
  );
}

function TablaDeDatos({ series, nombres, todas, desde, hasta }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[]; desde: string; hasta: string }) {
  const fechas = [...new Set(series.flatMap((s) => s.estado.serie.points.filter((p) => p.date >= desde && p.date <= hasta).map((p) => p.date)))].sort().reverse();
  return (
    <details className="tabla-de-datos">
      <summary>Tabla de datos ({numero(fechas.length)} fechas)</summary>
      <div className="desplazable-x">
        <table className="tabla tabla--numeros">
          <caption className="visualmente-oculto">Valores por fecha de las métricas elegidas</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              {series.map((s) => (
                <th key={s.clave} scope="col">
                  {nombres[todas.indexOf(s)]} ({s.estado.serie.unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fechas.map((f) => (
              <tr key={f}>
                <th scope="row">{diaCivil(f)}</th>
                {series.map((s) => {
                  const del = s.estado.serie.points.filter((p) => p.date === f);
                  return (
                    <td key={s.clave}>
                      {del.length === 0
                        ? 'Sin dato'
                        : del
                            .map((p) =>
                              p.value === null
                                ? 'Sin valor conocido'
                                : `${valorParaMostrar(p.value, s.definicion, s.estado.serie.unit)}${p.quality === 'PARTIAL' ? ' (subtotal)' : ''}${p.partialBucket ? (p.dateEnd ? ' (semana sin completar)' : ' (día en curso)') : ''}`,
                            )
                            .join(' · ')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Descargar lo que se ve (encargo §16): los puntos de la tabla, en CSV, armados en el navegador con lo que la API ya
 * autorizó. Sin operación nueva ni enlace público; el archivo no lleva el nombre de nadie.
 */
function ExportarCsv({ series, nombres, todas, desde, hasta }: { series: readonly Lista[]; nombres: readonly string[]; todas: readonly SerieDelAnalisis[]; desde: string; hasta: string }) {
  const { nombreDelAsesorado } = useSeguimiento();
  const [aviso, setAviso] = useState<string | null>(null);
  const descargar = () => {
    const csv = csvDelAnalisis({
      asesorado: nombreDelAsesorado ?? 'Asesorado',
      desde,
      hasta,
      zona: series[0]?.estado.zona ?? 'America/Argentina/Buenos_Aires',
      generadoEl: new Date().toISOString(),
      series: series.map((s) => ({ nombre: nombres[todas.indexOf(s)] ?? s.definicion.nombre, definicion: s.definicion, serie: s.estado.serie })),
    });
    // Con BOM, para que una planilla lea los acentos como UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreDeLaExportacion(desde, hasta);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAviso(`Descargado: ${a.download}.`);
  };
  return (
    <div className="exportar">
      <button type="button" className="boton boton--secundario" onClick={descargar}>
        Descargar los datos (CSV)
      </button>
      <p className="nota">Lo que ves, del {diaCivil(desde)} al {diaCivil(hasta)}: valores, calidad, cobertura, método y fecha de generación. El archivo queda en tu equipo: cuidalo como un dato de salud.</p>
      {aviso ? (
        <p className="nota" role="status">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

function ComparacionDePeriodos({
  series,
  nombres,
  todas,
  estado,
  cambiar,
  minimo,
  maximo,
}: {
  series: readonly Lista[];
  nombres: readonly string[];
  todas: readonly SerieDelAnalisis[];
  estado: EstadoDeAnalisis;
  cambiar: (c: Partial<EstadoDeAnalisis>) => void;
  minimo: string;
  maximo: string;
}) {
  const id = useId();
  const c = estado.comparacion;
  const poner = (lado: 'a' | 'b', campo: 'desde' | 'hasta', valor: string) => {
    if (!valor) return;
    const base = c ?? { a: { desde: minimo, hasta: minimo }, b: { desde: maximo, hasta: maximo } };
    cambiar({ comparacion: { ...base, [lado]: { ...base[lado], [campo]: valor } } });
  };
  return (
    <section aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>Comparar dos períodos</h3>
      <p className="nota">El mismo criterio de resumen en los dos; cada uno dice su duración, cuántas observaciones tiene y su cobertura. Coincidencia temporal; no indica causa.</p>
      <div className="acciones">
        {(['a', 'b'] as const).map((lado) => (
          <fieldset key={lado} className="capas">
            <legend>Período {lado.toUpperCase()}</legend>
            <div className="campo">
              <label htmlFor={`${id}-${lado}-d`}>Desde</label>
              <input id={`${id}-${lado}-d`} type="date" min={minimo} max={maximo} value={c?.[lado].desde ?? ''} onChange={(e) => poner(lado, 'desde', e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor={`${id}-${lado}-h`}>Hasta</label>
              <input id={`${id}-${lado}-h`} type="date" min={minimo} max={maximo} value={c?.[lado].hasta ?? ''} onChange={(e) => poner(lado, 'hasta', e.target.value)} />
            </div>
          </fieldset>
        ))}
        {c ? (
          <button type="button" className="boton boton--enlace" onClick={() => cambiar({ comparacion: null })}>
            Quitar la comparación
          </button>
        ) : null}
      </div>
      {c && c.a.desde <= c.a.hasta && c.b.desde <= c.b.hasta ? (
        <div className="desplazable-x">
          <table className="tabla tabla--numeros">
            <caption className="visualmente-oculto">Comparación de los dos períodos por métrica</caption>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                <th scope="col">Criterio</th>
                <th scope="col">
                  A · {diaCivil(c.a.desde)} al {diaCivil(c.a.hasta)}
                </th>
                <th scope="col">
                  B · {diaCivil(c.b.desde)} al {diaCivil(c.b.hasta)}
                </th>
                <th scope="col">B − A</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const r = compararPeriodos(s.estado.serie, s.definicion, c.a, c.b);
                const unidad = s.estado.serie.unit;
                const celda = (x: typeof r.a) =>
                  x.valor === null
                    ? `Sin valor (${numero(x.duracionDias)} días)`
                    : `${valorParaMostrar(x.valor, s.definicion, unidad)} · n = ${numero(x.n)} de ${numero(x.observaciones)} · ${numero(x.duracionDias)} días${x.parciales ? ` · ${numero(x.parciales)} subtotales` : ''}${
                        x.incompletos ? (s.definicion.resumenDePeriodo === 'TOTAL' ? ' · incluye un día o una semana sin completar' : ` · ${numero(x.incompletos)} sin completar, fuera del resumen`) : ''
                      }`;
                return (
                  <tr key={s.clave}>
                    <th scope="row">{nombres[todas.indexOf(s)]}</th>
                    <td>{CRITERIO[s.definicion.resumenDePeriodo]}</td>
                    <td>{celda(r.a)}</td>
                    <td>{celda(r.b)}</td>
                    <td>{r.diferencia === null ? (MOTIVO_SIN_DIFERENCIA[r.motivoSinDiferencia ?? ''] ?? '—') : `${r.diferencia > 0 ? '+' : ''}${valorConUnidad(r.diferencia, unidad, s.definicion.decimales)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

const CRITERIO: Readonly<Record<string, string>> = {
  MEDIA_DE_DIAS_CON_DATOS: 'Media de los días con valor',
  MEDIANA: 'Mediana de las sesiones',
  PRIMERO_Y_ULTIMO_COMPARABLES: 'Última toma del tramo comparable',
  TOTAL: 'Total',
};
const MOTIVO_SIN_DIFERENCIA: Readonly<Record<string, string>> = {
  SIN_VALOR_EN_ALGUNO: 'No se calcula: un período no tiene valores',
  DURACIONES_DISTINTAS: 'No se calcula: totales de períodos de distinta duración',
  TRAMOS_NO_COMPARABLES: 'No se calcula: cambió el método o el protocolo entre los dos',
  PERIODO_INCOMPLETO: 'No se calcula: un total incluye el día en curso o una semana sin completar',
};
