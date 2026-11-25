'use client';

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-05) · el panel derecho del editor de Entrenamiento: contextual, con su marco y las
 * herramientas de la parte A (`panel-contextual.ts`). Cada herramienta se abre grande, como «La vez pasada».
 * - **El marco:** arriba, de qué es (el plan, la fase, la sesión o el ejercicio) y la herramienta; «Abrir grande» a la
 *   derecha. Abajo de la herramienta, «Otras áreas» (solo si tiene algo: si no, no ocupa nada) y «Patrones», a pedido.
 * - **Un ejercicio:** su carga en el tiempo (si ya hay datos) y «La vez pasada»; grande, el cuadro de «La vez pasada» con
 *   el historial del ejercicio y sus gráficos (GR-03 a GR-06).
 * - Nada de lo que hay acá escribe en el plan.
 */
import type { VezPasada } from '@be/domain';
import { useId, useState, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import type { Resultado } from '../../../../lib/api';
import { diaYMesCivil, numeroEnCampo } from '../../../../lib/formato';
import { COPY_LA_VEZ_PASADA_EN_EL_EDITOR, CuadroDeLaVezPasada, LaVezPasada, useLaVezPasada } from './la-vez-pasada';
import { puntosDeCarga, type PuntoDeCarga } from './panel-contextual';

export const COPY_PANEL_DEL_EDITOR = {
  panel: 'Panel del editor',
  abrirGrande: 'Abrir grande',
  almanaque: 'Almanaque',
  cargaEnElTiempo: 'La carga en el tiempo',
  cargaEnElTiempoQueEs: (unidad: string) => `La carga más alta que registró la persona cada vez que hizo este ejercicio, en ${unidad}.`,
  laVezPasada: COPY_LA_VEZ_PASADA_EN_EL_EDITOR.abrir,
  patrones: 'Patrones de la persona',
  verPatrones: 'Ver los patrones',
  ocultarPatrones: 'Ocultar los patrones',
  sinPersona: 'Una plantilla no tiene persona: no hay registros que mirar.',
} as const;
const T = COPY_PANEL_DEL_EDITOR;

/** El marco del panel: de qué es, qué herramienta muestra y «Abrir grande». */
export function MarcoDelPanel({ id, deQue, titulo, onAbrirGrande, children }: { id: string; deQue: string; titulo: string; onAbrirGrande: (() => void) | null; children: ReactNode }) {
  return (
    <section className="marco-del-panel" aria-labelledby={`${id}-titulo`} data-marco-del-panel>
      <div className="marco-del-panel__cabecera">
        <div className="marco-del-panel__titulos">
          <p className="marco-del-panel__de-que" data-de-que={deQue}>
            {deQue}
          </p>
          <h3 id={`${id}-titulo`} className="marco-del-panel__titulo">
            {titulo}
          </h3>
        </div>
      </div>
      {/* DL-197 (F6): «Abrir grande», en su propio renglón: con el título al lado, el panel se desbordaba. */}
      {onAbrirGrande ? (
        <div className="marco-del-panel__abrir">
          <button type="button" className="boton boton--discreto boton--compacto" onClick={onAbrirGrande} data-abrir-grande>
            <Icono nombre="ver-todo" tamano={18} />
            {T.abrirGrande}
            <span className="visualmente-oculto">: {titulo}</span>
          </button>
        </div>
      ) : null}
      {children}
    </section>
  );
}

const ANCHO = 280;
const ALTO = 84;
const MARGEN = 8;

/**
 * La carga más alta de cada vez, en una línea con sus puntos. Es un dibujo chico: el número de la última vez se dice al
 * lado, y la lista entera queda para el lector de pantalla. Lo completo está en «Abrir grande» (el historial).
 */
export function CargaEnElTiempo({ puntos, unidad }: { puntos: readonly PuntoDeCarga[]; unidad: 'kg' | 'lb' }) {
  const id = useId();
  // DL-197 (F8): desde 0, como todo gráfico de carga (GUIA-UX-UI).
  const min = 0;
  const max = Math.max(...puntos.map((p) => p.carga));
  const rango = max - min || 1;
  const x = (n: number) => (puntos.length === 1 ? ANCHO / 2 : MARGEN + (n * (ANCHO - 2 * MARGEN)) / (puntos.length - 1));
  const y = (c: number) => ALTO - MARGEN - ((c - min) * (ALTO - 2 * MARGEN)) / rango;
  const ultimo = puntos[puntos.length - 1]!;
  return (
    <figure className="carga-en-el-tiempo" aria-labelledby={`${id}-titulo`} data-carga-en-el-tiempo={puntos.length}>
      <figcaption id={`${id}-titulo`} className="ejercicio-del-plan__subtitulo">
        {T.cargaEnElTiempo}{' '}
        <span className="nota">
          · última: {numeroEnCampo(ultimo.carga)} {unidad}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="carga-en-el-tiempo__dibujo" role="img" aria-label={T.cargaEnElTiempoQueEs(unidad)} preserveAspectRatio="none">
        <line x1={MARGEN} x2={ANCHO - MARGEN} y1={y(min)} y2={y(min)} className="carga-en-el-tiempo__base" />
        {puntos.length > 1 ? <polyline points={puntos.map((p, n) => `${x(n)},${y(p.carga)}`).join(' ')} className="carga-en-el-tiempo__linea" fill="none" /> : null}
        {puntos.map((p, n) => (
          <circle key={`${p.fecha}-${n}`} cx={x(n)} cy={y(p.carga)} r={3.5} className="carga-en-el-tiempo__punto" />
        ))}
      </svg>
      <div className="carga-en-el-tiempo__eje nota" aria-hidden="true">
        <span>{diaYMesCivil(puntos[0]!.fecha)}</span>
        <span>
          {numeroEnCampo(min)}–{numeroEnCampo(max)} {unidad}
        </span>
        <span>{diaYMesCivil(ultimo.fecha)}</span>
      </div>
      <ul className="visualmente-oculto">
        {puntos.map((p, n) => (
          <li key={`${p.fecha}-${n}`}>{`${diaYMesCivil(p.fecha)}: ${numeroEnCampo(p.carga)} ${unidad}`}</li>
        ))}
      </ul>
    </figure>
  );
}

/** El panel de un ejercicio: su carga en el tiempo y «La vez pasada». Grande, el cuadro de «La vez pasada» con su historial. */
export function PanelDelEjercicio({
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  loQueIndica,
  antes = null,
  cargaPorSemana = null,
  despues = null,
  soloElGrafico = false,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  nombre: string;
  loQueIndica: ReactNode;
  /** DL-196 parte B: lo que va arriba (el aviso de las zonas a cuidar, con su lugar reservado). */
  antes?: ReactNode;
  /** DL-196 parte B: la carga por semana de la fase, con lo registrado; en lugar de «La carga en el tiempo». */
  cargaPorSemana?: ((veces: readonly VezPasada[] | null) => ReactNode) | null;
  /** DL-196 parte B: lo que va antes de «La vez pasada» (la carga para N repeticiones). */
  despues?: ReactNode;
  /** DL-196 parte B (favoritos del plan): solo la carga por semana, sin el marco ni «La vez pasada». */
  soloElGrafico?: boolean;
}) {
  const id = useId();
  const { lectura, recargar } = useLaVezPasada(token, asesoradoId, exerciseId, sesionPerdida);
  const [grande, setGrande] = useState(false);
  const carga = lectura.tipo === 'lista' ? puntosDeCarga(lectura.veces) : null;
  if (soloElGrafico) return <>{cargaPorSemana ? cargaPorSemana(lectura.tipo === 'lista' ? lectura.veces : null) : null}</>;
  return (
    <MarcoDelPanel id={id} deQue={nombre} titulo={T.laVezPasada} onAbrirGrande={() => setGrande(true)}>
      {antes}
      {cargaPorSemana ? cargaPorSemana(lectura.tipo === 'lista' ? lectura.veces : null) : carga && carga.puntos.length > 1 ? <CargaEnElTiempo puntos={carga.puntos} unidad={carga.unidad} /> : null}
      {despues}
      <LaVezPasada lectura={lectura} recargar={recargar} nombre={nombre} />
      <CuadroDeLaVezPasada abierto={grande} onCerrar={() => setGrande(false)} token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} exerciseId={exerciseId} nombre={nombre} loQueIndica={loQueIndica} />
    </MarcoDelPanel>
  );
}

/** «Patrones», a pedido: no se lee nada hasta abrirlo. */
export function PatronesAPedido({ children }: { children: ReactNode }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="panel-del-editor__a-pedido" data-panel-patrones>
      <button type="button" className="boton boton--discreto" aria-expanded={abierto} aria-controls={`${id}-patrones`} onClick={() => setAbierto((a) => !a)} data-ver-patrones>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={15} />
        {abierto ? T.ocultarPatrones : T.verPatrones}
      </button>
      <div id={`${id}-patrones`} hidden={!abierto}>
        {abierto ? children : null}
      </div>
    </div>
  );
}
