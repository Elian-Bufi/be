'use client';

/**
 * WP-NUTRICION-PLANIFICACION · Dos piezas que comparan con el objetivo del día, sin calificar (la lógica, en
 * `planificacion.ts`):
 * - **NUP-06 · La suma de los rangos indicados frente al objetivo:** arriba de las comidas del día tipo, una tabla chica
 *   por kcal y por macro, con una franja que marca el objetivo. Es otra cuenta que «Rangos y totales» (lo que aportan las
 *   opciones armadas), y lo dice.
 * - **NUP-07 · Las kcal del objetivo y las de sus gramos:** cuánto suman los gramos con 4, 4 y 9 kcal por gramo, a la
 *   vista; si no coinciden con las kcal indicadas, un aviso neutro que no bloquea; y el porcentaje de cada macro con su
 *   base y sus gramos (decisión de Dirección del 18/11: en el website del profesional, el «%» va con su número real).
 */
import { MACROS_DEL_RANGO, type Rango, type VersionDeObjetivo } from '@be/domain';
import type { CSSProperties } from 'react';
import { Icono } from '../../../../components/icono';
import { COPY_PLANIFICACION as C, kcalDeLosGramos, objetivoDelDia, porcentajeDeLasKcal, sumaDeLosRangos, sumaFrenteAlObjetivo, type GramosDelObjetivo } from './planificacion';
import { COPY_RANGOS_INDICADOS, NOMBRE_DEL_MACRO, rangoEnPalabras, rangoEnUnaLinea } from './rangos-indicados';

/** NUP-06: la tabla de la suma. `comidas`: cada comida del día tipo con su rango indicado (o `null`). */
export function SumaDeLosRangosIndicados({ comidas, objetivo }: { comidas: readonly { readonly nombre: string; readonly rango: Rango | null }[]; objetivo: VersionDeObjetivo | null }) {
  if (comidas.length === 0) return null;
  const suma = sumaDeLosRangos(comidas);
  const sinRangos = MACROS_DEL_RANGO.every((m) => suma.macros[m].conRango === 0);
  const filas = sumaFrenteAlObjetivo(suma, objetivo ? objetivoDelDia(objetivo) : null);
  return (
    <section className="suma-de-los-rangos" aria-labelledby="suma-de-los-rangos-titulo" data-suma-de-los-rangos>
      <h3 id="suma-de-los-rangos-titulo" className="suma-de-los-rangos__titulo">
        <Icono nombre="objetivo" tamano={18} />
        {C.sumaTitulo}
      </h3>
      <p className="nota">{C.sumaAyuda}</p>
      {sinRangos ? (
        <p className="nota" data-sin-rangos>
          {C.sumaSinRangos}
        </p>
      ) : (
        <>
          {objetivo ? null : <p className="nota">{C.sumaSinObjetivo}</p>}
          <table className="tabla suma-de-los-rangos__tabla">
            <caption className="visualmente-oculto">{C.sumaTitulo}</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="visualmente-oculto">Qué</span>
                </th>
                <th scope="col">{C.columnaSuma}</th>
                <th scope="col">{C.columnaObjetivo}</th>
                <th scope="col">{C.columnaUbicacion}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.clave} data-fila-de-la-suma={f.clave}>
                  <th scope="row">{f.nombre}</th>
                  <td>
                    {f.suma}
                    {/* La franja: la suma como una banda y el objetivo como una marca, en la misma escala. Sin color de juicio:
                        el texto de al lado es el que dice dónde queda. */}
                    {f.franja ? (
                      <span
                        className="suma-de-los-rangos__franja"
                        aria-hidden="true"
                        data-abierta={f.franja.abierta ? '' : undefined}
                        style={{ '--desde': f.franja.desde, '--hasta': f.franja.hasta, '--objetivo': f.franja.objetivo ?? -10 } as CSSProperties}
                      >
                        <span className="suma-de-los-rangos__banda" />
                        {f.franja.objetivo !== null ? <span className="suma-de-los-rangos__marca" /> : null}
                      </span>
                    ) : null}
                    {f.nota ? <span className="nota suma-de-los-rangos__nota">{f.nota}</span> : null}
                  </td>
                  <td>{f.objetivo ?? '—'}</td>
                  <td>{f.ubicacion ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

/**
 * NUP-07: las kcal que suman los gramos del objetivo, frente a las indicadas, y el porcentaje de cada macro con su base.
 * Mientras falte un macro, dice qué se va a ver; nunca suma a medias.
 */
export function KcalDelObjetivo({ kcal, gramos }: { kcal: number | null; gramos: GramosDelObjetivo }) {
  const k = kcalDeLosGramos(gramos, kcal);
  if (!k) {
    return (
      <p className="nota kcal-del-objetivo" data-kcal-del-objetivo>
        {COPY_KCAL.conLosTres}
      </p>
    );
  }
  const porcentajes = MACROS_DEL_RANGO.flatMap((m) => {
    const p = porcentajeDeLasKcal(m, gramos[m], kcal);
    return p ? [[m, p] as const] : [];
  });
  return (
    <div className="kcal-del-objetivo" data-kcal-del-objetivo>
      <p>{C.kcalDeLosGramos(k)}</p>
      {k.frente && kcal !== null ? (
        k.frente.coinciden ? (
          <p className="nota">{C.coinciden(kcal)}</p>
        ) : (
          <p className="kcal-del-objetivo__aviso" data-no-coinciden>
            <Icono nombre="aviso" tamano={18} />
            <span>{C.noCoinciden(k, kcal)}</span>
          </p>
        )
      ) : null}
      {porcentajes.length > 0 ? (
        <ul className="lista-compacta kcal-del-objetivo__porcentajes" data-porcentajes-del-objetivo>
          {porcentajes.map(([m, p]) => (
            <li key={m}>
              {NOMBRE_DEL_MACRO[m]}: {p}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** NUP-05: un rango indicado y cómo se indica o se cambia desde donde se arma (`alIndicar` en `null`: todavía no se puede). */
export interface RangoParaIndicar {
  readonly indicado: Rango | null;
  readonly alIndicar: (() => void) | null;
  /** Por qué no se puede indicar todavía; `null` si se puede o si no hay nada que decir (una versión activada). */
  readonly porQueNo: string | null;
}

/**
 * NUP-05: el rango de una comida o de un día tipo en un renglón, con su botón para indicarlo o cambiarlo: en la comida
 * del editor y en los pasos 3, 4 y 5 del asistente, mientras se arma (no recién en «Revisar»).
 */
export function RangoEnUnRenglon({ de, rango }: { de: string; rango: RangoParaIndicar }) {
  return (
    <p className="rango-en-un-renglon nota" data-rango-en-un-renglon>
      {rango.indicado ? (
        <>
          <span aria-hidden="true">
            {C.rangoDeLaComida(de)}: {rangoEnUnaLinea(rango.indicado)}
          </span>
          <span className="visualmente-oculto">
            {C.rangoDeLaComida(de)}: {rangoEnPalabras(rango.indicado)}
          </span>
        </>
      ) : (
        <span>
          {COPY_RANGOS_INDICADOS.sinRango}: {de}
        </span>
      )}{' '}
      {rango.alIndicar ? (
        <button type="button" className="boton boton--enlace" aria-haspopup="dialog" data-indicar-rango onClick={rango.alIndicar}>
          {rango.indicado ? COPY_RANGOS_INDICADOS.cambiar(de) : COPY_RANGOS_INDICADOS.escribir(de)}
        </button>
      ) : rango.porQueNo ? (
        <span>· {rango.porQueNo}</span>
      ) : null}
    </p>
  );
}

export const COPY_KCAL = {
  conLosTres: 'Con los tres macros escritos se ve cuántas kcal suman, con 4, 4 y 9 kcal por gramo.',
} as const;
