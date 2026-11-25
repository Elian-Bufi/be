'use client';

/**
 * DL-196 parte B · las herramientas nuevas del panel contextual del editor de Entrenamiento (`panel-contextual.ts`):
 *
 * - **La carga por semana de un ejercicio** (E7, E18): lo planificado (punteado, con la progresión de su fase y el escalón
 *   de la descarga) contra lo realizado (lleno, lo más alto de cada semana de la fase) y el máximo estimado (Epley v1 de
 *   DL-171, solo en los ejercicios de su lista, con la banda orientativa en rombos huecos).
 * - **La carga para N repeticiones** a un RIR (o RPE) dado, con la cuenta a la vista y los límites del método.
 * - **La distribución de la fase** (E13, E20): la silueta como mapa de calor de series por semana, la frecuencia, los
 *   equilibrios, las zonas a cuidar y el acceso a las estructuras de la galería de presets.
 * - **La estrella de favoritos** (GR-27): marca el gráfico en la planificación de la versión.
 * Nada de lo que hay acá escribe en el plan, salvo la estrella (con el clic del profesional).
 */
import {
  cargaParaRepeticiones,
  COPY_DISTRIBUCION as D,
  distribucionPorMusculo,
  entraEnLaEstimacion,
  equilibrios,
  maximoPorSemana,
  nivelDeCalor,
  NIVELES_DEL_CALOR,
  nombreDeZona,
  numero,
  PASOS_DEL_REDONDEO,
  semanaDeLaFecha,
  seriesEnPalabras,
  TOPE_DE_LA_ESTIMACION,
  TOPE_DEL_NUCLEO,
  zonaEnPalabras,
  zonasDelEjercicioACuidar,
  type DistribucionDeLaFase,
  type FaseEnElCalendario,
  type NotacionDelEsfuerzo,
  type SesionParaDistribuir,
  type VezPasada,
  type ZonasACuidar,
} from '@be/domain';
import { AYUDAS_DEL_EDITOR, ContenidoDeLaAyuda } from './ayudas-del-editor';
import { useId, useState, type ReactNode } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { FiguraDeCalor } from '../../../../components/figura-de-calor';
import type { Resultado } from '../../../../lib/api';
import { useFichasVisuales } from '../../../../lib/fichas-visuales';
import { valorDeLaTarjeta } from '../fuerza/fuerza';
import { useLecturaDeFuerza } from '../fuerza/lectura-de-fuerza';
import { GraficoDeSemanas, type SerieDeSemanas } from './grafico-de-semanas';

// ─── La estrella ─────────────────────────────────────────────────────────────────────────────

export function EstrellaDeFavorito({ marcado, onCambiar, deQue }: { marcado: boolean; onCambiar: () => void; deQue: string }) {
  return (
    <button type="button" className="boton boton--quieto boton--compacto estrella-de-favorito" aria-pressed={marcado} onClick={onCambiar} data-favorito={marcado ? 'si' : 'no'}>
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="estrella-de-favorito__dibujo">
        <path d="M8 1.6l1.95 4.1 4.45.55-3.27 3.08.85 4.42L8 11.6l-3.98 2.15.85-4.42L1.6 6.25l4.45-.55z" />
      </svg>
      {marcado ? 'Favorito' : 'Marcar'}
      <span className="visualmente-oculto">{marcado ? `: ${deQue} está en los favoritos del plan; quitarlo` : `: ${deQue} como favorito del plan`}</span>
    </button>
  );
}

// ─── La carga por semana de un ejercicio ─────────────────────────────────────────────────────

export interface PlanDeLaSemana {
  readonly carga: number | null;
  readonly descarga: boolean;
}

/** Lo más alto registrado de cada vez, en la unidad pedida. */
function cargasRegistradas(veces: readonly VezPasada[], unidad: 'kg' | 'lb'): { readonly fecha: string; readonly valor: number }[] {
  return veces.flatMap((v) => {
    if (v.como.tipo !== 'series') return [];
    const cargas = v.como.series.flatMap((s) => (s.carga && s.carga.unit === unidad ? [s.carga.value] : []));
    return cargas.length > 0 ? [{ fecha: v.fecha, valor: Math.max(...cargas) }] : [];
  });
}

export function CargaPorSemana({
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  unidad,
  fase,
  plan,
  veces,
  acciones = null,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  nombre: string;
  unidad: 'kg' | 'lb';
  /** La fase con sus fechas; sin fechas, lo realizado no se ubica en sus semanas. */
  fase: FaseEnElCalendario | null;
  /** Lo planificado de cada semana (con la progresión de la fase, si tiene). */
  plan: readonly PlanDeLaSemana[];
  veces: readonly VezPasada[] | null;
  acciones?: ReactNode;
}) {
  const conEstimacion = entraEnLaEstimacion(exerciseId);
  const { lectura } = useLecturaDeFuerza(token, asesoradoId, conEstimacion ? exerciseId : undefined, { unidad, sesionPerdida });
  const semanas = fase?.semanas ?? plan.length;
  const series: SerieDeSemanas[] = [{ clave: 'plan', nombre: 'Planificado', forma: 'plan', valores: plan.map((p) => p.carga) }];
  if (fase && veces) {
    const hecho = maximoPorSemana(fase, cargasRegistradas(veces, unidad));
    if (hecho.some((v) => v !== null)) series.push({ clave: 'hecho', nombre: 'Realizado', forma: 'hecho', valores: hecho });
  }
  if (fase && lectura.tipo === 'lista' && lectura.encendido && lectura.encendido.unidad === unidad) {
    // El más alto de cada semana, y si ese es de la banda orientativa (rombo hueco).
    const porSemana: ({ readonly valor: number; readonly orientativa: boolean } | null)[] = Array.from({ length: fase.semanas }, () => null);
    for (const p of lectura.encendido.puntos) {
      const s = semanaDeLaFecha(fase, p.date);
      if (s === null || s > fase.semanas) continue;
      const antes = porSemana[s - 1];
      if (!antes || p.estimate.value > antes.valor) porSemana[s - 1] = { valor: p.estimate.value, orientativa: p.estimate.band === 'ORIENTATIVE' };
    }
    if (porSemana.some((v) => v !== null)) {
      series.push({ clave: 'estimado', nombre: 'Máximo estimado', forma: 'estimado', valores: porSemana.map((v) => v?.valor ?? null), orientativas: porSemana.map((v) => v?.orientativa ?? false) });
    }
  }
  if (!plan.some((p) => p.carga !== null) && series.length === 1) {
    return (
      <p className="nota carga-por-semana__vacia" data-carga-por-semana="sin-datos">
        «{nombre}» no tiene carga de trabajo escrita ni registros en esta fase: no hay nada que dibujar todavía.
      </p>
    );
  }
  return (
    <div className="carga-por-semana" data-carga-por-semana={series.map((s) => s.clave).join(' ')}>
      <GraficoDeSemanas
        titulo={`${nombre}: la carga por semana`}
        semanas={Math.max(1, semanas)}
        unidad={unidad}
        series={series}
        descargas={plan.flatMap((p, k) => (p.descarga ? [k + 1] : []))}
        acciones={acciones}
        pie={
          <p className="nota">
            {!fase ? 'La fase no tiene fechas: lo realizado no se ubica en sus semanas. ' : ''}
            {conEstimacion ? `El máximo estimado es Epley v1: solo series de hasta ${TOPE_DE_LA_ESTIMACION} repeticiones equivalentes con RIR de hasta 2; de más de ${TOPE_DEL_NUCLEO}, orientativo (rombo hueco).` : ''}
          </p>
        }
      />
    </div>
  );
}

// ─── La carga para N repeticiones ────────────────────────────────────────────────────────────

const leer = (t: string): number => Number(t.replace(',', '.'));

export function CargaParaRepeticiones({
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  unidad,
  notacion,
  repeticionesDeEntrada,
  rirDeEntrada,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  unidad: 'kg' | 'lb';
  notacion: NotacionDelEsfuerzo;
  repeticionesDeEntrada: number | null;
  rirDeEntrada: number | null;
}) {
  const id = useId();
  const conEstimacion = entraEnLaEstimacion(exerciseId);
  const { lectura } = useLecturaDeFuerza(token, asesoradoId, conEstimacion ? exerciseId : undefined, { unidad, sesionPerdida });
  const [reps, setReps] = useState(String(repeticionesDeEntrada ?? 8));
  const enRpe = notacion === 'RPE';
  const [esfuerzo, setEsfuerzo] = useState(String(enRpe ? 10 - (rirDeEntrada ?? 2) : (rirDeEntrada ?? 2)));
  const rir = enRpe ? 10 - leer(esfuerzo) : leer(esfuerzo);
  const valor = lectura.tipo === 'lista' ? valorDeLaTarjeta(lectura.apagado?.puntos ?? [], lectura.encendido?.puntos ?? []) : null;
  const paso = PASOS_DEL_REDONDEO[unidad][0]!;
  const r = valor && valor.estimate.load.unit === unidad ? cargaParaRepeticiones(valor.estimate.value, unidad, leer(reps), rir, paso) : null;
  const ayuda = (
    <ExplicacionAPedido nombre={AYUDAS_DEL_EDITOR.cargaParaRepeticiones.nombre} como="div" lugar="esquina">
      <ContenidoDeLaAyuda
        ayuda={AYUDAS_DEL_EDITOR.cargaParaRepeticiones}
        extra={
          <>
            <p>
              {enRpe
                ? 'El RPE es la escala de esfuerzo percibido; en la escala anclada a las repeticiones en reserva, RPE 8 equivale a dejar 2 (RIR 2).'
                : 'El RIR son las repeticiones que quedan en reserva al terminar la serie.'}
            </p>
            <p>Solo con RIR de 0 a 2 y hasta {TOPE_DE_LA_ESTIMACION} repeticiones equivalentes; de más de {TOPE_DEL_NUCLEO}, es orientativa. Es para los seis ejercicios con barra de la lista del método.</p>
          </>
        }
      />
    </ExplicacionAPedido>
  );
  if (!conEstimacion) {
    return (
      <section className="carga-para-repeticiones carga-para-repeticiones--no-aplica con-ayuda-en-la-esquina" aria-label="Carga para N repeticiones" data-carga-para-repeticiones="no-aplica">
        <p className="nota">
          <span className="carga-para-repeticiones__rotulo">Carga para N repeticiones:</span> no aplica a este ejercicio.
        </p>
        {ayuda}
      </section>
    );
  }
  let resultado: ReactNode;
  if (!conEstimacion) resultado = <p className="nota">El máximo estimado (Epley v1) es solo para los seis ejercicios con barra de su lista: este no está, así que no hay cuenta.</p>;
  else if (lectura.tipo === 'cargando') resultado = <p className="nota">Leyendo el máximo estimado…</p>;
  else if (!valor) resultado = <p className="nota">No hay datos suficientes: hace falta una serie registrada de este ejercicio con carga, repeticiones y RIR de hasta 2 (hasta {TOPE_DE_LA_ESTIMACION} repeticiones equivalentes).</p>;
  else if (!r || !r.hay)
    resultado = (
      <p className="nota" data-fuera-de-los-limites>
        {r && r.motivo === 'FUERA_DE_LOS_LIMITES' ? `Fuera de los límites del método: ${enRpe ? 'RPE de 8 a 10 (RIR de 0 a 2)' : 'RIR de 0 a 2'}, y repeticiones más RIR hasta ${TOPE_DE_LA_ESTIMACION}.` : 'Escribí repeticiones enteras desde 1 y un esfuerzo que tenga sentido.'}
      </p>
    );
  else
    resultado = (
      <div className="carga-para-repeticiones__resultado" data-carga-calculada={r.carga}>
        <p className="carga-para-repeticiones__numero">
          {numero(r.carga, 2)} {r.unidad}
          {r.orientativa ? <span className="nota"> · orientativa</span> : null}
        </p>
        <p className="nota carga-para-repeticiones__cuenta">{r.cuenta}</p>
      </div>
    );
  return (
    <section className="carga-para-repeticiones" aria-labelledby={`${id}-titulo`} data-carga-para-repeticiones>
      <div className="carga-para-repeticiones__cabecera">
        <h4 id={`${id}-titulo`} className="ejercicio-del-plan__subtitulo">
          Carga para N repeticiones
        </h4>
        {ayuda}
      </div>
      <div className="carga-para-repeticiones__campos">
        <label>
          <input type="number" min={1} max={12} value={reps} onChange={(e) => setReps(e.target.value)} data-campo="repeticiones-para-la-carga" />
          repeticiones
        </label>
        <label>
          {enRpe ? 'a RPE' : 'con RIR'}
          <input type="number" min={enRpe ? 8 : 0} max={enRpe ? 10 : 2} step={0.5} value={esfuerzo} onChange={(e) => setEsfuerzo(e.target.value)} data-campo="esfuerzo-para-la-carga" />
        </label>
      </div>
      {/* RP-19: el resultado tiene su lugar; cambia de texto sin mover lo de abajo. */}
      <div className="carga-para-repeticiones__lugar" aria-live="polite">
        {resultado}
      </div>
    </section>
  );
}

// ─── La distribución de la fase ──────────────────────────────────────────────────────────────

export function DistribucionDeLaFase({
  sesiones,
  aCuidar,
  cargando = false,
  chica = false,
  onVerEstructuras = null,
}: {
  sesiones: readonly SesionParaDistribuir[];
  aCuidar: ZonasACuidar | null;
  cargando?: boolean;
  chica?: boolean;
  onVerEstructuras?: (() => void) | null;
}) {
  const id = useId();
  const [resaltada, setResaltada] = useState<string | null>(null);
  const d: DistribucionDeLaFase = distribucionPorMusculo(sesiones);
  const pares = equilibrios(d);
  const zonasACuidar = aCuidar?.zonas ?? [];
  return (
    <div className={`distribucion-de-la-fase${chica ? ' distribucion-de-la-fase--chica' : ''}`} data-distribucion-de-la-fase={d.zonas.length}>
      {!chica ? (
        <ExplicacionAPedido nombre="Cómo se cuenta la distribución" como="div" lugar="esquina">
          <p>{D.queMuestra}</p>
          <p>{D.ejemplo}</p>
          <p>{D.frecuenciaQueEs}</p>
          <p>{D.equilibriosQueEs}</p>
        </ExplicacionAPedido>
      ) : null}
      {cargando ? <p className="nota">Leyendo las zonas de los ejercicios…</p> : null}
      {!cargando && d.zonas.length === 0 ? <p className="nota">{D.sinSeries}</p> : null}
      {d.zonas.length > 0 || zonasACuidar.length > 0 ? (
        <div className="distribucion-de-la-fase__mapa">
          <FiguraDeCalor
            rotulo="distribucion"
            chica={chica}
            zonas={d.zonas.map((z) => ({ zoneId: z.zoneId, nivel: nivelDeCalor(z.series, d.maximo), texto: zonaEnPalabras(z) }))}
            aCuidar={zonasACuidar}
            resaltada={resaltada}
          />
          <div className="distribucion-de-la-fase__escala" aria-hidden="true">
            <span className="nota">{D.menos}</span>
            {Array.from({ length: NIVELES_DEL_CALOR }, (_, k) => (
              <span key={k} className={`distribucion-de-la-fase__nivel figura-de-calor__muestra--${k + 1}`} />
            ))}
            <span className="nota">{D.mas}</span>
            {zonasACuidar.length > 0 ? (
              <>
                <span className="distribucion-de-la-fase__nivel figura-de-calor__muestra--a-cuidar" />
                <span className="nota">{D.aCuidar}</span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* La silueta es decorativa para el lector: en la versión chica (favoritos), sin tabla, lo dice esta lista. */}
      {d.zonas.length > 0 && chica ? (
        <ul className="visualmente-oculto" data-distribucion-en-texto>
          {d.zonas.map((z) => (
            <li key={z.zoneId}>
              {zonaEnPalabras(z)}
              {zonasACuidar.includes(z.zoneId) ? ` (${D.aCuidar.toLowerCase()})` : ''}
            </li>
          ))}
        </ul>
      ) : null}
      {d.zonas.length > 0 && !chica ? (
        <table className="tabla tabla--compacta distribucion-de-la-fase__tabla" aria-labelledby={`${id}-tabla`} data-tabla-de-la-distribucion>
          <caption id={`${id}-tabla`} className="visualmente-oculto">
            Series por semana y frecuencia de cada músculo en la fase
          </caption>
          <thead>
            <tr>
              <th scope="col">Músculo</th>
              <th scope="col">Series por semana</th>
              <th scope="col">
                {D.frecuencia}
              </th>
            </tr>
          </thead>
          <tbody>
            {[...d.zonas]
              .sort((a, b) => b.series - a.series)
              .map((z) => (
                <tr key={z.zoneId} data-zona={z.zoneId} data-a-cuidar={zonasACuidar.includes(z.zoneId) ? '' : undefined}>
                  <th scope="row">
                    <button type="button" className="distribucion-de-la-fase__zona" onFocus={() => setResaltada(z.zoneId)} onBlur={() => setResaltada(null)} onMouseEnter={() => setResaltada(z.zoneId)} onMouseLeave={() => setResaltada(null)} aria-describedby={`${id}-tabla`}>
                      <span className={`distribucion-de-la-fase__nivel figura-de-calor__muestra--${nivelDeCalor(z.series, d.maximo)}`} aria-hidden="true" />
                      {z.nombre}
                      {zonasACuidar.includes(z.zoneId) ? (
                        <>
                          <span className="distribucion-de-la-fase__nivel figura-de-calor__muestra--a-cuidar" aria-hidden="true" />
                          <span className="visualmente-oculto"> ({D.aCuidar.toLowerCase()})</span>
                        </>
                      ) : null}
                    </button>
                  </th>
                  <td>
                    {numero(z.series, 1)} <span className="nota">· {z.ejercicios === 1 ? '1 ejercicio' : `${z.ejercicios} ejercicios`}</span>
                  </td>
                  <td>{D.dias(z.dias)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : null}
      {!chica && (d.sesionesSinDias > 0 || d.ejerciciosSinZonas > 0) ? (
        <p className="nota">
          {d.sesionesSinDias > 0 ? D.sesionesSinDias(d.sesionesSinDias) : ''} {d.ejerciciosSinZonas > 0 ? D.ejerciciosSinZonas(d.ejerciciosSinZonas) : ''}
        </p>
      ) : null}
      {!chica && aCuidar ? (
        <p className="nota distribucion-de-la-fase__a-cuidar" data-zonas-a-cuidar={aCuidar.zonas.join(' ')}>
          {D.aCuidarQueEs(aCuidar.declarado)}
        </p>
      ) : null}
      {!chica && pares.length > 0 ? (
        <section className="equilibrios" aria-labelledby={`${id}-equilibrios`}>
          <h4 id={`${id}-equilibrios`} className="ejercicio-del-plan__subtitulo">
            {D.equilibrios}
          </h4>
          <ul className="equilibrios__lista" role="list">
            {pares.map((p) => {
              const tope = Math.max(p.izquierda.series, p.derecha.series, 1);
              return (
                <li key={p.clave} className="equilibrios__par" data-equilibrio={p.clave}>
                  <span className="equilibrios__nombre">{p.izquierda.nombre}</span>
                  <span className="equilibrios__barras" aria-hidden="true">
                    <span className="equilibrios__barra equilibrios__barra--izquierda" style={{ inlineSize: `${(p.izquierda.series / tope) * 100}%` }} />
                    <span className="equilibrios__barra equilibrios__barra--derecha" style={{ inlineSize: `${(p.derecha.series / tope) * 100}%` }} />
                  </span>
                  <span className="equilibrios__nombre equilibrios__nombre--derecha">{p.derecha.nombre}</span>
                  <span className="equilibrios__valores nota">
                    {seriesEnPalabras(p.izquierda.series)} · {seriesEnPalabras(p.derecha.series)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {!chica && onVerEstructuras ? (
        <button type="button" className="boton boton--discreto boton--con-flecha" onClick={onVerEstructuras} data-ver-estructuras>
          {D.estructuras}: cuerpo entero, torso / piernas, empuje / tirón / piernas y por grupo muscular
        </button>
      ) : null}
    </div>
  );
}

/** El reparto típico de una estructura en la silueta, para la galería de presets (E13). */
export function RepartoEnLaSilueta({ reparto, nombre }: { reparto: DistribucionDeLaFase; nombre: string }) {
  const maximo = reparto.zonas.reduce((m, z) => Math.max(m, z.dias), 0);
  return (
    <figure className="reparto-en-la-silueta" data-reparto={nombre}>
      <FiguraDeCalor rotulo={`reparto-${nombre}`} chica zonas={reparto.zonas.map((z) => ({ zoneId: z.zoneId, nivel: nivelDeCalor(z.dias, maximo), texto: `${z.nombre}: ${D.porDia(z.dias)}` }))} />
      <figcaption className="nota">
        {D.frecuencia}:{' '}
        {[...reparto.zonas]
          .sort((a, b) => b.dias - a.dias)
          .map((z) => `${nombreDeZona(z.zoneId)} ${D.dias(z.dias)}`)
          .join(' · ')}
      </figcaption>
    </figure>
  );
}

/**
 * La distribución con las zonas vigentes de los ejercicios (la ficha visual, API-EJE-05): lee las fichas de los ejercicios
 * de la fase y arma las sesiones con ellas. Sin el área de Entrenamiento no muestra nada.
 */
export function DistribucionConFichas({
  token,
  sesionPerdida,
  ids,
  armar,
  aCuidar,
  chica = false,
  onVerEstructuras = null,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** Los ejercicios del catálogo de la fase. */
  ids: readonly string[];
  armar: (zonasDe: (exerciseId: string | null) => readonly { readonly zoneId: string; readonly role: 'PRIMARY' | 'SECONDARY' }[] | null) => SesionParaDistribuir[];
  aCuidar: ZonasACuidar | null;
  chica?: boolean;
  onVerEstructuras?: (() => void) | null;
}) {
  const { lectura, releer } = useFichasVisuales(token, ids, sesionPerdida);
  if (lectura.tipo === 'sin-area') return null;
  if (lectura.tipo === 'falla')
    return (
      <p className="nota" role="status">
        No pudimos leer las zonas de los ejercicios. {lectura.motivo}{' '}
        <button type="button" className="boton boton--discreto" onClick={releer}>
          Reintentar
        </button>
      </p>
    );
  const fichas = lectura.tipo === 'lista' ? lectura.fichas : new Map();
  const sesiones = armar((id) => (id ? (fichas.get(id.toLowerCase())?.muscleZones ?? null) : null));
  return <DistribucionDeLaFase sesiones={sesiones} aCuidar={aCuidar} cargando={lectura.tipo === 'cargando'} chica={chica} onVerEstructuras={onVerEstructuras} />;
}

/**
 * El aviso discreto de un ejercicio que trabaja una zona a cuidar (lo declarado en el formulario). Tiene su renglón
 * reservado en el panel (RP-19): aparece sin correr nada. Ubica, no indica.
 */
export function AvisoDeZonaACuidar({ token, sesionPerdida, exerciseId, aCuidar }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean; exerciseId: string; aCuidar: ZonasACuidar | null }) {
  const { lectura } = useFichasVisuales(token, aCuidar ? [exerciseId] : [], sesionPerdida);
  const zonas = aCuidar && lectura.tipo === 'lista' ? zonasDelEjercicioACuidar(lectura.fichas.get(exerciseId.toLowerCase())?.muscleZones ?? [], aCuidar) : [];
  return (
    <p className="nota aviso-de-zona-a-cuidar" role="status" data-aviso-de-zona-a-cuidar={zonas.join(' ') || undefined}>
      {zonas.length > 0 ? D.avisoDelEjercicio(zonas.map((z) => nombreDeZona(z) ?? z).join(' y ')) : ' '}
    </p>
  );
}
