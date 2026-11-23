'use client';

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-02 y EE-03) · lo de arriba del centro del editor: el plan (inicio, duración o fin,
 * objetivo y anotaciones privadas) y, en cada fase, sus semanas, su objetivo, sus anotaciones y los días de la semana de
 * sus sesiones. Antes, la columna izquierda: Dirección la sacó (E5, E7) porque comprimía todo y repetía acciones.
 * - **Un renglón compacto por cosa;** las explicaciones van al «?» de la esquina (E4).
 * - **Las anotaciones son privadas:** lo dicen el candado y el rótulo; no viajan a la persona (EE-D05).
 * - **Los días** van en una tabla de sesiones por día (L a D): cada casilla prende o apaga esa sesión ese día.
 */
import {
  DIAS_DE_LA_SEMANA,
  finDelPlan,
  type DiaDeLaSemana,
  type FaseEnElCalendario,
  type PlanificacionDelPlan,
} from '@be/domain';
import { useId, useState, type ReactNode } from 'react';
import { CampoDeFecha } from '../../../../components/campo-de-fecha';
import { EncabezadoConAyuda, ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { diaCivil, rangoCivil } from '../../../../lib/formato';
import { DIA_CORTO, DIA_LARGO } from '../estacion/estacion';
import { conAnotacionesDelPlan, conFin, conInicio, conObjetivo, conSemanasDelPlan } from './fases-del-plan';

export const COPY_PLAN_Y_FASES = {
  elPlan: 'El plan',
  queEsElPlan: 'Cuándo empieza y cuánto dura el plan, y qué busca. El fin sale de la duración; si escribís el fin, la duración se ajusta.',
  inicio: 'Inicio',
  duracion: 'Duración',
  semanas: 'semanas',
  fin: 'Fin',
  sinInicio: 'Elegí cuándo empieza: con eso, cada fase y cada sesión tienen sus fechas.',
  objetivo: 'Objetivo del plan',
  // EE-D07: la app de la persona todavía no lo muestra; sí sale en la descarga de sus datos. No se promete lo que no pasa.
  objetivoAyuda: 'Lo que busca el plan, en tus palabras. La app de la persona todavía no lo muestra; sí va en la descarga de sus datos.',
  anotaciones: 'Anotaciones',
  soloVos: 'Solo vos',
  anotacionesAyuda: 'Lo que querés recordar de este plan: la persona no lo ve, ni en la app ni en lo que se descarga de sus datos.',
  resumen: (desde: string | null, semanas: number | null) =>
    desde && semanas ? `${rangoCivil(desde, finDelPlan(desde, semanas))} · ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}` : desde ? `Desde el ${diaCivil(desde)}` : 'Sin fechas todavía',
  lasFasesSuman: (suman: number, del: number) => (suman === del ? `Las fases ocupan las ${del} semanas.` : suman < del ? `Las fases suman ${suman} de ${del} semanas.` : `Las fases suman ${suman} semanas: ${suman - del} más que el plan.`),
  semanasDeLaFase: 'Semanas',
  objetivoDeLaFase: 'Objetivo de la fase',
  objetivoDeLaFaseAyuda: 'Qué busca esta fase. La persona lo ve con su plan.',
  fechasDeLaFase: (f: FaseEnElCalendario | null) => (f ? rangoCivil(f.desde, f.hasta) : 'Sin fechas: falta el inicio del plan o las semanas de una fase anterior'),
  dias: 'Días de la semana',
  diasAyuda:
    'Qué sesión va cada día, en las semanas de esta fase. Una sesión sin días no tiene fecha: la persona la elige cuando entrena. Dos sesiones el mismo día se pueden: las hace una detrás de la otra.',
  sinSesionesParaDias: 'Primero agregá una sesión: después elegís sus días.',
  diaDeLaSesion: (dia: DiaDeLaSemana, sesion: string) => `${DIA_LARGO[dia]}: ${sesion}`,
} as const;
const T = COPY_PLAN_Y_FASES;

/** Un número entero de semanas escrito, o `null` si el campo quedó vacío o no se entiende. */
const leerSemanas = (s: string, maximo: number): number | null => {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= maximo ? n : null;
};

/** Un área de texto con su rótulo, compacta: dos renglones que crecen con lo escrito. */
function Texto({ id, rotulo, valor, onCambiar, maximo, privado = false, placeholder }: { id: string; rotulo: ReactNode; valor: string | null | undefined; onCambiar: (v: string | null) => void; maximo: number; privado?: boolean; placeholder?: string }) {
  return (
    <div className={privado ? 'campo plan-y-fases__texto plan-y-fases__texto--privado' : 'campo plan-y-fases__texto'}>
      <label htmlFor={id}>{rotulo}</label>
      <textarea id={id} rows={2} maxLength={maximo} value={valor ?? ''} placeholder={placeholder} onChange={(e) => onCambiar(e.target.value || null)} />
    </div>
  );
}

/** El rótulo de las anotaciones, con el candado y «Solo vos». */
const RotuloPrivado = ({ texto }: { texto: string }) => (
  <>
    {texto}{' '}
    <span className="etiqueta-de-dato plan-y-fases__privado">
      <Icono nombre="candado" tamano={15} />
      {T.soloVos}
    </span>
  </>
);

/**
 * El plan: inicio, duración (o fin), objetivo y anotaciones. Se pliega en un renglón con las fechas; abierto, un renglón
 * de fechas y, debajo, el objetivo y las anotaciones lado a lado. La notación del esfuerzo va en el mismo renglón.
 */
export function DatosDelPlan({
  planificacion: p,
  onCambiar,
  notacion,
  semanasDeLasFases,
  abiertoDeEntrada,
}: {
  planificacion: PlanificacionDelPlan;
  onCambiar: (p: PlanificacionDelPlan) => void;
  /** La notación del esfuerzo del plan (`NotacionDelPlan`). */
  notacion: ReactNode;
  /** Cuántas semanas suman las fases que las tienen. */
  semanasDeLasFases: number;
  abiertoDeEntrada: boolean;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(abiertoDeEntrada);
  const [semanasEscritas, setSemanasEscritas] = useState<string | null>(null);
  const fin = p.startDate && p.weeks ? finDelPlan(p.startDate, p.weeks) : '';
  return (
    <section className="tarjeta-del-editor datos-del-plan" aria-labelledby={`${id}-titulo`} data-foco="plan" data-datos-del-plan data-recorrido="editor-entrenamiento-plan">
      <div className="tarjeta-del-editor__cabecera">
        <h3 id={`${id}-titulo`} className="tarjeta-del-editor__titulo">
          <button type="button" className="tarjeta-del-editor__boton" aria-expanded={abierto} aria-controls={`${id}-cuerpo`} onClick={() => setAbierto((a) => !a)} data-abrir-el-plan>
            <Icono nombre="calendario" tamano={18} />
            <span className="tarjeta-del-editor__nombre">{T.elPlan}</span>
            <span className="tarjeta-del-editor__resumen" data-resumen-del-plan>
              {T.resumen(p.startDate, p.weeks)}
            </span>
            <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
          </button>
        </h3>
        <ExplicacionAPedido nombre="Qué es el plan" lugar="esquina">
          {T.queEsElPlan}
        </ExplicacionAPedido>
      </div>
      <div id={`${id}-cuerpo`} className="tarjeta-del-editor__cuerpo" hidden={!abierto}>
        <div className="datos-del-plan__fechas">
          <div className="datos-del-plan__fecha" data-inicio-del-plan>
            <CampoDeFecha id={`${id}-inicio`} etiqueta={T.inicio} value={p.startDate ?? ''} onChange={(f) => onCambiar(conInicio(p, f))} vaciable />
          </div>
          <div className="campo datos-del-plan__semanas">
            <label htmlFor={`${id}-semanas`}>{T.duracion}</label>
            <span className="datos-del-plan__con-unidad">
              <input
                id={`${id}-semanas`}
                inputMode="numeric"
                value={semanasEscritas ?? (p.weeks === null ? '' : String(p.weeks))}
                aria-describedby={`${id}-unidad`}
                onChange={(e) => {
                  setSemanasEscritas(e.target.value);
                  onCambiar(conSemanasDelPlan(p, leerSemanas(e.target.value, 104)));
                }}
                onBlur={() => setSemanasEscritas(null)}
                data-semanas-del-plan
              />
              <span id={`${id}-unidad`} className="nota">
                {T.semanas}
              </span>
            </span>
          </div>
          {p.startDate ? (
            <div className="datos-del-plan__fecha" data-fin-del-plan>
              <CampoDeFecha id={`${id}-fin`} etiqueta={T.fin} value={fin} min={p.startDate} onChange={(f) => f && onCambiar(conFin(p, f))} />
            </div>
          ) : null}
          <div className="datos-del-plan__notacion">{notacion}</div>
        </div>
        {/* RP-19: el renglón de la nota está siempre: lo que cambia no corre lo de abajo. */}
        <p className="nota datos-del-plan__nota" aria-live="polite" data-nota-del-plan>
          {!p.startDate ? T.sinInicio : p.weeks && semanasDeLasFases > 0 ? T.lasFasesSuman(semanasDeLasFases, p.weeks) : ' '}
        </p>
        <div className="datos-del-plan__textos">
          <Texto id={`${id}-objetivo`} rotulo={T.objetivo} valor={p.goal} onCambiar={(v) => onCambiar(conObjetivo(p, v))} maximo={1000} placeholder={T.objetivoAyuda} />
          <Texto id={`${id}-anotaciones`} rotulo={<RotuloPrivado texto={T.anotaciones} />} valor={p.privateNotes?.plan} onCambiar={(v) => onCambiar(conAnotacionesDelPlan(p, v))} maximo={4000} privado placeholder={T.anotacionesAyuda} />
        </div>
      </div>
    </section>
  );
}

/** Lo de cada fase, arriba de sus sesiones: semanas (con sus fechas), objetivo y anotaciones. */
export function DatosDeLaFase({
  id,
  semanas,
  fechas,
  objetivo,
  anotaciones,
  onSemanas,
  onObjetivo,
  onAnotaciones,
}: {
  id: string;
  semanas: number | null;
  fechas: FaseEnElCalendario | null;
  objetivo: string | null | undefined;
  anotaciones: string | null;
  onSemanas: (n: number | null) => void;
  onObjetivo: (v: string | null) => void;
  onAnotaciones: (v: string | null) => void;
}) {
  const [escritas, setEscritas] = useState<string | null>(null);
  return (
    <div className="datos-de-la-fase" data-datos-de-la-fase>
      <div className="datos-de-la-fase__renglon">
        <div className="campo datos-del-plan__semanas">
          <label htmlFor={`${id}-semanas`}>{T.semanasDeLaFase}</label>
          <input
            id={`${id}-semanas`}
            inputMode="numeric"
            value={escritas ?? (semanas === null ? '' : String(semanas))}
            aria-describedby={`${id}-fechas`}
            onChange={(e) => {
              setEscritas(e.target.value);
              onSemanas(leerSemanas(e.target.value, 52));
            }}
            onBlur={() => setEscritas(null)}
            data-semanas-de-la-fase
          />
        </div>
        <p id={`${id}-fechas`} className="nota datos-de-la-fase__fechas" data-fechas-de-la-fase>
          <Icono nombre="calendario" tamano={15} />
          {T.fechasDeLaFase(fechas)}
        </p>
      </div>
      <div className="datos-del-plan__textos">
        <Texto id={`${id}-objetivo`} rotulo={T.objetivoDeLaFase} valor={objetivo} onCambiar={onObjetivo} maximo={1000} placeholder={T.objetivoDeLaFaseAyuda} />
        <Texto id={`${id}-anotaciones`} rotulo={<RotuloPrivado texto={T.anotaciones} />} valor={anotaciones} onCambiar={onAnotaciones} maximo={2000} privado />
      </div>
    </div>
  );
}

/** Una sesión de la fase, para la tabla de días. */
export interface SesionParaLosDias {
  readonly id: string | null;
  readonly nombre: string;
  /** La letra de la sesión en la fase (A, B, C…), la misma del almanaque. */
  readonly letra: string;
  readonly dias: readonly DiaDeLaSemana[];
}

/** La letra de una sesión por su posición en la fase: A, B, C… (después de la Z, el número). */
export const letraDeLaSesion = (n: number): string => (n < 26 ? String.fromCharCode(65 + n) : String(n + 1));

/**
 * Los días de la semana de la fase: una fila por sesión y una columna por día, de lunes a domingo. Cada casilla es un
 * botón que prende o apaga esa sesión ese día (escribe la agenda de DL-137). Debajo, lo que se avisa de los días.
 */
export function DiasDeLaFase({
  id,
  sesiones,
  onAlternar,
  pie,
}: {
  id: string;
  sesiones: readonly SesionParaLosDias[];
  onAlternar: (sesion: string, dia: DiaDeLaSemana) => void;
  /** Lo que va debajo: los días de un preset para confirmar, los días compartidos, «Ver próximas fechas». */
  pie?: ReactNode;
}) {
  return (
    <section className="dias-de-la-fase" aria-labelledby={`${id}-titulo`} data-dias-de-la-fase data-recorrido="editor-entrenamiento-dias">
      <EncabezadoConAyuda nivel={4} id={`${id}-titulo`} titulo={T.dias} nombre="Cómo se eligen los días" ayuda={T.diasAyuda} />
      {sesiones.length === 0 ? (
        <p className="nota">{T.sinSesionesParaDias}</p>
      ) : (
        <table className="dias-de-la-fase__tabla">
          <caption className="visualmente-oculto">{T.dias}</caption>
          <thead>
            <tr>
              <td />
              {DIAS_DE_LA_SEMANA.map((d) => (
                <th key={d} scope="col" abbr={DIA_LARGO[d]}>
                  {DIA_CORTO[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sesiones.map((s, n) => (
              <tr key={s.id ?? `sin-id-${n}`} data-dias-de-la-sesion={n + 1}>
                <th scope="row" className="dias-de-la-fase__sesion">
                  <span className="dias-de-la-fase__letra" aria-hidden="true">
                    {s.letra}
                  </span>
                  {s.nombre}
                </th>
                {DIAS_DE_LA_SEMANA.map((d) => (
                  <td key={d}>
                    <button
                      type="button"
                      className="dias-de-la-fase__dia"
                      aria-pressed={s.dias.includes(d)}
                      aria-label={T.diaDeLaSesion(d, s.nombre)}
                      disabled={!s.id}
                      data-dia={d}
                      onClick={() => s.id && onAlternar(s.id, d)}
                    >
                      <span aria-hidden="true">{s.dias.includes(d) ? s.letra : ''}</span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pie}
    </section>
  );
}
