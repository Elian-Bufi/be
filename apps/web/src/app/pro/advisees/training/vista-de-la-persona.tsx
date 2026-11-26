'use client';

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-12) · «Ver como la persona»: la sesión de una semana de la fase tal como le
 * llega a la app, para mirar antes de activar. Solo lectura (los cuadros configuran; esto muestra).
 * - **La misma cuenta que la API:** cada ejercicio en esa semana con la progresión de su fase (`sesionDeLaSemana`, la que
 *   aplican API-TRN-09, «Hoy» y API-SER-02) y el objetivo efectivo de cada serie (`objetivosEfectivos`).
 * - **Los mismos textos que la APK:** «Plan de la serie 2: 85 kg · 6 rep. · RIR 2», «Calentamiento», «Descanso
 *   recomendado 02:00» (`textoDelPlanDeLaSerie`, `rotulosDeLasSeries`, en la notación del plan).
 * - Lo que la persona no ve (las anotaciones, la regla de la progresión, el 1RM) no aparece.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
  COPY_ESFUERZO_DE_LA_SESION,
  COPY_TIPOS_DE_SERIE,
  cuentaDeSeries,
  diaDeLaEstimacion,
  esSemanaDeDescarga,
  fechasDeLasFases,
  inicioDeLaSemana,
  numero,
  objetivosEfectivos,
  progresionDeLaFase,
  rotulosDeLasSeries,
  semanaEnPalabras,
  semanasDeLaFase,
  sesionDeLaSemana,
  textoDelPlanDeLaSerie,
  textoDeSegundos,
  type NotacionDelEsfuerzo,
  type PlanificacionDelPlan,
  type SemanaDeLaFase,
  cardioDe,
  cardioEnPalabras,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Icono } from '../../../../components/icono';
import type { BloqueE, PrescripcionE, SesionE } from './ejercicio-del-editor';

type SerieE = PrescripcionE['sets'][number];

export const COPY_VISTA_DE_LA_PERSONA = {
  abrir: 'Ver como la persona',
  titulo: 'Así le llega a la app',
  queEs: 'La sesión de una semana de esta fase, como la ve la persona en su teléfono: los ejercicios, cada serie con su objetivo y la carga de esa semana. Es solo para mirar.',
  sesion: 'Sesión',
  semana: 'Semana',
  sinSesiones: 'Esta fase todavía no tiene sesiones.',
  sinEjercicios: 'Esta sesión todavía no tiene ejercicios.',
  sinGuardar: 'Lo que ves es lo que está en el editor, aunque no se haya guardado todavía.',
  conProgresion: 'Las cargas y las repeticiones son las de esa semana: la progresión de la fase ya está aplicada.',
  sinProgresion: 'La fase no tiene progresión: todas las semanas llegan iguales.',
  alTerminar: 'Al terminar, la app le pregunta:',
  ayuda:
    'Elegí la sesión y la semana. Cada serie dice lo que la persona va a ver en «Plan de la serie»: la carga, las repeticiones y el RIR (o el RPE), y el descanso. Ejemplo: con 80 kg y +2,5 kg por semana, en la semana 3 la serie 1 dice «Plan de la serie 1: 85 kg · 6 rep. · RIR 2».',
} as const;

/** El texto de una serie como lo dice la app, y su descanso. */
function lineasDeLaSerie(objetivo: ReturnType<typeof objetivosEfectivos>[number], notacion: NotacionDelEsfuerzo): { readonly plan: string; readonly descanso: string | null } {
  const plan = textoDelPlanDeLaSerie({ repetitions: objetivo.repetitions, rir: objetivo.rir, suggestedLoad: objetivo.suggestedLoad, restSeconds: objetivo.restSeconds }, notacion);
  const segundos = objetivo.restSeconds;
  return { plan, descanso: segundos === null ? null : `${COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado} ${textoDeSegundos(segundos)}` };
}

export function VistaDeLaPersona({
  abierto,
  onCerrar,
  bloque,
  bloques,
  planificacion,
  notacion,
  persona,
  sesionInicial,
  nombreDe,
  letraDe,
}: {
  abierto: boolean;
  onCerrar: () => void;
  bloque: BloqueE;
  bloques: readonly BloqueE[];
  planificacion: PlanificacionDelPlan | null;
  notacion: NotacionDelEsfuerzo;
  persona: string | null;
  /** La sesión que estaba elegida en el editor. */
  sesionInicial: number;
  nombreDe: (p: PrescripcionE) => string;
  letraDe: (n: number) => string;
}) {
  const T = COPY_VISTA_DE_LA_PERSONA;
  const id = useId();
  const sesiones: SesionE[] = [...(bloque.sessions ?? []), ...(bloque.microcycles ?? []).flatMap((m) => m.sessions)];
  const semanas = Math.max(1, semanasDeLaFase(planificacion, bloque.blockId) ?? 1);
  const [sesion, setSesion] = useState(0);
  const [semana, setSemana] = useState(1);
  useEffect(() => {
    if (!abierto) return;
    setSesion(Math.min(Math.max(0, sesionInicial), Math.max(0, sesiones.length - 1)));
    setSemana(1);
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const progresion = progresionDeLaFase(planificacion, bloque.blockId);
  const laSemana: SemanaDeLaFase | null = progresion ? { progresion, semana: Math.min(semana, semanas), semanas } : null;
  const fase = bloque.blockId ? (fechasDeLasFases(planificacion, bloques).find((f) => f?.blockId === bloque.blockId) ?? null) : null;
  const elegida = sesiones[sesion] ?? null;
  const enLaSemana = elegida ? sesionDeLaSemana(elegida, laSemana, planificacion, nombreDe) : null;
  const pedirElEsfuerzo = !!planificacion?.askSessionEffort;
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      className="vista-de-la-persona"
      titulo={T.titulo}
      sobretitulo={persona}
      // DL-199 (ET3, E5): qué es esta vista y que muestra lo no guardado van en su «?»; a la vista, la sesión.
      ayuda={{
        nombre: `Qué muestra «${T.abrir}»`,
        contenido: (
          <>
            <p>{T.queEs}</p>
            <p>{T.sinGuardar}</p>
            <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>
              {T.ayuda}
            </p>
          </>
        ),
      }}
      onCerrar={onCerrar}
    >
      <div className="vista-de-la-persona__cuerpo" data-vista-de-la-persona>
        {sesiones.length === 0 ? (
          <p className="nota">{T.sinSesiones}</p>
        ) : (
          <>
            <div className="vista-de-la-persona__elegir">
              <div className="campo">
                <label htmlFor={`${id}-sesion`}>{T.sesion}</label>
                <select id={`${id}-sesion`} value={sesion} onChange={(e) => setSesion(Number(e.target.value))} data-vista-sesion>
                  {sesiones.map((s, n) => (
                    <option key={s.sessionId ?? n} value={n}>
                      {letraDe(n)} · {s.label || `Sesión ${n + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor={`${id}-semana`}>{T.semana}</label>
                <select id={`${id}-semana`} value={semana} onChange={(e) => setSemana(Number(e.target.value))} data-vista-semana>
                  {Array.from({ length: semanas }, (_, n) => n + 1).map((n) => (
                    <option key={n} value={n}>
                      {semanaEnPalabras({ semana: n, semanas, descarga: !!progresion && esSemanaDeDescarga({ progresion, semana: n, semanas }) })}
                      {fase ? ` · ${diaDeLaEstimacion(inicioDeLaSemana(fase, n))}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="nota vista-de-la-persona__regla" data-vista-con-progresion={progresion ? '' : undefined}>
              <Icono nombre="info" tamano={15} /> {progresion ? T.conProgresion : T.sinProgresion}
            </p>
            {/* El teléfono: un marco angosto con la sesión, como en la app. */}
            <div className="telefono-de-muestra" role="group" aria-label={`${T.titulo}: ${elegida?.label ?? ''}`}>
              <div className="telefono-de-muestra__pantalla">
                <p className="telefono-de-muestra__sobretitulo">
                  {laSemana ? semanaEnPalabras({ semana: laSemana.semana, semanas, descarga: esSemanaDeDescarga(laSemana) }) : bloque.label}
                </p>
                <h3 className="telefono-de-muestra__titulo">{elegida?.label || `Sesión ${sesion + 1}`}</h3>
                {enLaSemana && enLaSemana.prescriptions.length > 0 ? (
                  <ol className="telefono-de-muestra__ejercicios">
                    {enLaSemana.prescriptions.map((p, k) => {
                      const objetivos = objetivosEfectivos(p);
                      const rotulos = rotulosDeLasSeries(p.sets as readonly SerieE[]);
                      return (
                        <li key={p.prescriptionId ?? k} className="telefono-de-muestra__ejercicio" data-vista-ejercicio={k + 1}>
                          <p className="telefono-de-muestra__nombre">{nombreDe(p)}</p>
                          {/* DL-199 (ET3-14): el cardio, con su duración, su distancia y su intensidad; se tilda al terminar. */}
                          {cardioDe(p) ? (
                            <p className="telefono-de-muestra__plan" data-vista-cardio>
                              {cardioEnPalabras(cardioDe(p)!)}
                            </p>
                          ) : (
                            <>
                          <p className="nota">{cuentaDeSeries(p.sets)}</p>
                          <ul className="telefono-de-muestra__series">
                            {objetivos.map((o, n) => {
                              const r = rotulos[n]!;
                              const { plan, descanso } = lineasDeLaSerie(o, notacion);
                              return (
                                <li key={n} className="telefono-de-muestra__serie" data-calentamiento={r.numero === null ? '' : undefined} data-vista-serie={n + 1}>
                                  <span className="telefono-de-muestra__rotulo">{r.numero === null ? COPY_TIPOS_DE_SERIE.calentamiento : COPY_ENTRENAMIENTO_POR_SERIE.planDeLaSerie(r.numero)}</span>
                                  <span className="telefono-de-muestra__plan">{plan}</span>
                                  {descanso ? <span className="telefono-de-muestra__descanso">{descanso}</span> : null}
                                </li>
                              );
                            })}
                          </ul>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="nota">{T.sinEjercicios}</p>
                )}
                {pedirElEsfuerzo ? (
                  <div className="telefono-de-muestra__al-terminar" data-vista-esfuerzo>
                    <p className="nota">{T.alTerminar}</p>
                    <p className="telefono-de-muestra__pregunta">{COPY_ESFUERZO_DE_LA_SESION.pregunta}</p>
                    <p className="nota">{COPY_ESFUERZO_DE_LA_SESION.preguntaAclaracion}</p>
                    <div className="telefono-de-muestra__escala" aria-hidden="true">
                      {Array.from({ length: 11 }, (_, n) => (
                        <span key={n}>{numero(n)}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </CuadroEnfocado>
  );
}
