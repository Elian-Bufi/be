'use client';

/**
 * «La vez pasada» en el editor del plan (WP-GRAFICOS GR-01, DL-174, fase 1; la misma pieza que PG-11 de
 * WP-PULIDO-GRANDES): en el cuadro lateral del ejercicio, debajo de «Lo que indica el plan» y nunca mezclado con eso, lo
 * que la persona registró las últimas tres veces que hizo el ejercicio, serie por serie (carga con su unidad ×
 * repeticiones · RIR). Las reglas son las del dominio (`la-vez-pasada.ts`); acá solo se lee y se dibuja:
 * - **La lectura** es API-TRN-21 (las sesiones registradas en los planes de quien mira, y lo dice: «en tus planes») de los
 *   últimos 91 días, armada en el cliente: la propuesta de gráficos lo pide así para la fase 1. Se lee al abrir el cuadro,
 *   cada vez: no hay caché de datos de salud en el navegador. La tabla dice desde cuándo leyó.
 * - **Lo escrito va lleno y lo precargado del plan, hueco y en gris,** con su texto: «carga rápida» (DL-161) o «con la
 *   carga del plan» (ED-70). Lo cargado otro día y lo corregido llevan su etiqueta. Nada es solo color.
 * - **Una vez hecha con otro ejercicio lo dice** («Se hizo con Prensa de piernas») y no se toma como el mismo; una
 *   resumida dice que no tiene series. Una serie que falta queda «—», sin dato, nunca en cero.
 * - **Sin flechas ni juicios:** no compara una vez con otra, no sugiere una carga (eso es «Calcular la carga desde la
 *   estimación», ED-76, que confirma el profesional) y no califica una vez frente a otra.
 *
 * Los ejercicios de la lista de la v1 (RM-16) la ven dentro de «Detalle y fuerza estimada» (ED-75); los demás, en
 * `CuadroDeLaVezPasada`, el mismo cuadro lateral sin la fuerza estimada: el alcance de ED-75 no cambia.
 */
import {
  COPY_LA_VEZ_PASADA,
  fechaEnPocasPalabras,
  loQueSeHizo,
  marcaDelPlan,
  textoDeLaSerie,
  VECES_EN_EL_EDITOR,
  vecesPasadas,
  type SerieDeLaVezPasada,
  type VezPasada,
} from '@be/domain';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { EnPartes } from '../../../../components/en-partes';
import { BloqueDeEstado } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { usePersonaDelArea } from '../marco-del-area';
import { hoyEn, restarDias } from '../seguimiento/estado';

/** Cuántos días se leen: 91 con hoy. API-TRN-21 acepta 92, y el hoy de la API puede ir un día adelante del navegador. */
const DIAS_QUE_SE_LEEN = 91;

export const COPY_LA_VEZ_PASADA_EN_EL_EDITOR = {
  abrir: 'La vez pasada',
  queEs: (persona: string, desde: string) => `Lo que registró ${persona} las últimas veces que hizo este ejercicio en tus planes, serie por serie, desde el ${desde}.`,
  ninguna: (desde: string) => `Sin sesiones registradas con este ejercicio en tus planes desde el ${desde}.`,
  sesion: 'Sesión',
  serie: (n: number) => `Serie ${n}`,
  loRegistrado: 'Lo registrado',
  caption: (persona: string, nombre: string) => `${COPY_LA_VEZ_PASADA.titulo}: lo que registró ${persona} de ${nombre}, por sesión y por serie`,
  sinDato: 'sin dato',
  escrito: 'Escrito por la persona',
  delPlan: 'Carga rápida: tildada sin escribir, con los valores del plan',
  cargadaOtroDia: 'Cargada otro día',
  corregida: 'Corregida',
  noSeComparan: 'Lo que indica el plan está arriba y no se mezcla con esto: no se comparan ni se suma nada.',
  noSeLeyo: 'No pudimos leer las sesiones registradas de este ejercicio.',
  noDisponible: 'Con el acceso de ahora no podés ver los registros de Entrenamiento de esta persona.',
  persona: 'la persona',
  loQueIndicaElPlan: 'Lo que indica el plan',
} as const;
const C = COPY_LA_VEZ_PASADA_EN_EL_EDITOR;

export type LecturaDeLaVezPasada =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'lista'; readonly veces: readonly VezPasada[]; readonly hoy: string; readonly desde: string };

/**
 * Lee las sesiones registradas de los últimos días (API-TRN-21) y arma las últimas veces del ejercicio. `undefined` en
 * `exerciseId`: no lee (el cuadro está cerrado).
 */
export function useLaVezPasada(
  token: string,
  asesoradoId: string,
  exerciseId: string | undefined,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
): { readonly lectura: LecturaDeLaVezPasada; readonly recargar: () => void } {
  const [lectura, setLectura] = useState<LecturaDeLaVezPasada>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (exerciseId === undefined) return;
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    // Sin `periodEnd`: la API toma su hoy y lee desde `periodStart`.
    void api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, { periodStart: restarDias(hoyEn(), DIAS_QUE_SE_LEEN - 1) }).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (!r.ok) return setLectura(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-disponible' } : { tipo: 'error', motivo: motivoDeFalla(r) });
      const d = r.datos.data;
      setLectura({ tipo: 'lista', veces: vecesPasadas(d.registeredExecutions, exerciseId, { cuantas: VECES_EN_EL_EDITOR }), hoy: d.period.end, desde: d.period.start });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, exerciseId, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, recargar };
}

/** La marca de cada serie: llena si la escribió la persona; hueca si vino toda del plan (carga rápida). Sigue al texto. */
function MarcaDeOrigen({ hueca = false }: { hueca?: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true" className="la-vez-pasada__marca-de-origen">
      <circle cx={6} cy={6} r={hueca ? 4 : 4.5} fill={hueca ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={hueca ? 1.5 : 0} />
    </svg>
  );
}

/** Una serie registrada: el texto, su marca y, si vino del plan, lo que vino del plan dicho en palabras. */
function CeldaDeSerie({ serie }: { serie: SerieDeLaVezPasada }) {
  const delPlan = marcaDelPlan(serie, COPY_LA_VEZ_PASADA.cargaRapida);
  return (
    <span className={serie.cargaRapida ? 'la-vez-pasada__serie la-vez-pasada__serie--del-plan' : 'la-vez-pasada__serie'} data-carga-rapida={serie.cargaRapida ? '' : undefined}>
      <MarcaDeOrigen hueca={serie.cargaRapida} />
      <span>
        <EnPartes texto={textoDeLaSerie(serie)} />
        {delPlan ? <span className="la-vez-pasada__del-plan">{delPlan}</span> : null}
      </span>
    </span>
  );
}

/** «Se hizo con Prensa de piernas»: la frase del dominio, con mayúscula, para una celda sola. */
const conMayuscula = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** La tabla de las veces: una fila por sesión, una columna por número de serie. */
function TablaDeLaVezPasada({ veces, hoy, persona, nombre }: { veces: readonly VezPasada[]; hoy: string; persona: string; nombre: string }) {
  const numeros = [...new Set(veces.flatMap((v) => (v.como.tipo === 'series' ? v.como.series.map((s) => s.numero) : [])))].sort((a, b) => a - b);
  const conSeries = numeros.length > 0;
  const hayDelPlan = veces.some((v) => v.como.tipo === 'series' && v.como.series.some((s) => s.cargaRapida));
  return (
    <>
      <div className="desplazable-x">
        <table className="tabla la-vez-pasada__tabla">
          <caption className="visualmente-oculto">{C.caption(persona, nombre)}</caption>
          <thead>
            <tr>
              <th scope="col">{C.sesion}</th>
              {conSeries ? (
                numeros.map((n) => (
                  <th scope="col" key={n}>
                    {C.serie(n)}
                  </th>
                ))
              ) : (
                <th scope="col">{C.loRegistrado}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {veces.map((v) => (
              <tr key={`${v.executionId}|${v.fecha}|${v.sesion}`} data-vez={v.executionId}>
                <th scope="row">
                  <span className="la-vez-pasada__fecha">{fechaEnPocasPalabras(v.fecha, hoy)}</span>
                  <span className="visualmente-oculto"> ({fechaEnPocasPalabras(v.fecha, hoy, true)})</span>
                  <span className="nota la-vez-pasada__sesion">{v.sesion}</span>
                  {v.cargadaOtroDia ? (
                    <span className="etiqueta-de-dato la-vez-pasada__etiqueta" data-cargada-otro-dia>
                      <Icono nombre="cargado-otro-dia" tamano={15} />
                      {C.cargadaOtroDia}
                    </span>
                  ) : null}
                  {v.corregida ? (
                    <span className="etiqueta-de-dato la-vez-pasada__etiqueta" data-corregida>
                      <Icono nombre="corregido" tamano={15} />
                      {C.corregida}
                    </span>
                  ) : null}
                </th>
                {v.como.tipo === 'series' ? (
                  numeros.map((n) => {
                    const s = v.como.tipo === 'series' ? v.como.series.find((x) => x.numero === n) : undefined;
                    return (
                      <td key={n}>
                        {s ? (
                          <CeldaDeSerie serie={s} />
                        ) : (
                          <span className="nota">
                            <span aria-hidden="true">—</span>
                            <span className="visualmente-oculto">{C.sinDato}</span>
                          </span>
                        )}
                      </td>
                    );
                  })
                ) : (
                  <td colSpan={Math.max(1, numeros.length)} className="la-vez-pasada__otra">
                    {conMayuscula(loQueSeHizo(v, 'profesional'))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Cada serie dice en texto si vino del plan; la leyenda explica las dos marcas una vez. */}
      {conSeries ? (
        <ul className="leyenda la-vez-pasada__leyenda">
          <li>
            <MarcaDeOrigen />
            {C.escrito}
          </li>
          {hayDelPlan ? (
            <li>
              <MarcaDeOrigen hueca />
              {C.delPlan}
            </li>
          ) : null}
        </ul>
      ) : null}
      {veces.some((v) => v.como.tipo === 'series' && v.como.enLugarDe) ? (
        <ul className="nota la-vez-pasada__en-lugar-de">
          {veces.flatMap((v) => (v.como.tipo === 'series' && v.como.enLugarDe ? [<li key={v.executionId}>{`${fechaEnPocasPalabras(v.fecha, hoy)}: ${COPY_LA_VEZ_PASADA.enLugarDe(v.como.enLugarDe)}`}</li>] : []))}
        </ul>
      ) : null}
    </>
  );
}

/** La sección «La vez pasada» del cuadro del ejercicio, con sus estados de lectura. */
export function LaVezPasada({ lectura, recargar, nombre }: { lectura: LecturaDeLaVezPasada; recargar: () => void; nombre: string }) {
  const id = useId();
  const persona = usePersonaDelArea() ?? C.persona;
  return (
    <section className="la-vez-pasada" aria-labelledby={`${id}-titulo`} data-la-vez-pasada>
      <p id={`${id}-titulo`} className="ejercicio-del-plan__subtitulo">
        {COPY_LA_VEZ_PASADA.titulo}
      </p>
      {lectura.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando…
        </p>
      ) : null}
      {lectura.tipo === 'error' ? (
        // Una lectura que falló no es un ejercicio sin historia: se dice y se reintenta.
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} onReintentar={recargar} deQue="las sesiones registradas del ejercicio">
          {C.noSeLeyo}
        </BloqueDeEstado>
      ) : null}
      {lectura.tipo === 'no-disponible' ? <p data-no-disponible>{C.noDisponible}</p> : null}
      {lectura.tipo === 'lista' ? (
        lectura.veces.length === 0 ? (
          <p className="nota" data-sin-veces>
            {C.ninguna(fechaEnPocasPalabras(lectura.desde, lectura.hoy))}
          </p>
        ) : (
          <>
            <p className="nota la-vez-pasada__que-es">{C.queEs(persona, fechaEnPocasPalabras(lectura.desde, lectura.hoy))}</p>
            <TablaDeLaVezPasada veces={lectura.veces} hoy={lectura.hoy} persona={persona} nombre={nombre} />
            <p className="nota la-vez-pasada__no-se-comparan">{C.noSeComparan}</p>
          </>
        )
      ) : null}
    </section>
  );
}

/**
 * El cuadro lateral de un ejercicio que no está en la lista de la v1 (RM-16): «Lo que indica el plan» arriba y «La vez
 * pasada» abajo, el mismo diseño que el detalle con la fuerza estimada, sin la fuerza. Abrirlo no cambia nada del plan.
 */
export function CuadroDeLaVezPasada({
  abierto,
  onCerrar,
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  loQueIndica,
}: {
  abierto: boolean;
  onCerrar: () => void;
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  nombre: string;
  loQueIndica: ReactNode;
}) {
  const { lectura, recargar } = useLaVezPasada(token, asesoradoId, abierto ? exerciseId : undefined, sesionPerdida);
  return (
    <CuadroEnfocado abierto={abierto} forma="panel" titulo={nombre} className="detalle-con-fuerza cuadro-de-la-vez-pasada" onCerrar={onCerrar}>
      <div className="detalle-del-ejercicio">
        <section className="detalle-del-ejercicio__plan" aria-label={C.loQueIndicaElPlan}>
          <p className="ejercicio-del-plan__subtitulo">{C.loQueIndicaElPlan}</p>
          <div className="detalle-del-ejercicio__indica">{loQueIndica}</div>
        </section>
        <LaVezPasada lectura={lectura} recargar={recargar} nombre={nombre} />
      </div>
    </CuadroEnfocado>
  );
}
