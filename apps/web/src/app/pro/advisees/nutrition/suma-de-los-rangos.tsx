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
import { MACROS_DEL_RANGO, type MacroDelRango, type Rango, type VersionDeObjetivo } from '@be/domain';
import { useId, type CSSProperties } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Icono } from '../../../../components/icono';
import { COPY_PLANIFICACION as C, kcalDeLosGramos, objetivoDelDia, porcentajeDeLasKcal, porcentajeEnUnaParte, sinLasKcalDeLosGramos, sumaDeLosRangos, sumaFrenteAlObjetivo, type GramosDelObjetivo } from './planificacion';
import { COPY_RANGOS_INDICADOS, NOMBRE_DEL_MACRO, rangoEnPalabras } from './rangos-indicados';
import { RangoIndicadoConIconos, RotuloConIcono } from './cantidad-del-macro';

/**
 * NUP-06: la tabla de la suma. `comidas`: cada comida del día tipo con su rango indicado (o `null`). RP-19 (DL-188, pedido
 * del 22/11): en el editor ya no va arriba de las comidas (aparecía de golpe al proponer y corría todo); su chequeo es una
 * línea del «Reparto por comida» y esta tabla, `enDetalle`, queda detrás de su «?»: sin título ni recuadro propios.
 */
export function SumaDeLosRangosIndicados({ comidas, objetivo, enDetalle = false }: { comidas: readonly { readonly nombre: string; readonly rango: Rango | null }[]; objetivo: VersionDeObjetivo | null; enDetalle?: boolean }) {
  // Puede haber más de una en la página: cada una con su id.
  const id = useId();
  if (comidas.length === 0) return null;
  const suma = sumaDeLosRangos(comidas);
  const sinRangos = MACROS_DEL_RANGO.every((m) => suma.macros[m].conRango === 0);
  const filas = sumaFrenteAlObjetivo(suma, objetivo ? objetivoDelDia(objetivo) : null);
  const notas = [...new Set(filas.flatMap((f) => (f.nota ? [f.clave === 'kcal' ? f.nota : `${f.nombre}: ${f.nota}`] : [])))];
  return (
    <section
      className={`suma-de-los-rangos${enDetalle ? ' suma-de-los-rangos--en-detalle' : ''}`}
      aria-labelledby={enDetalle ? undefined : `${id}-titulo`}
      aria-label={enDetalle ? C.sumaTitulo : undefined}
      data-suma-de-los-rangos={enDetalle ? 'en-detalle' : ''}
    >
      {enDetalle ? null : (
        <h3 id={`${id}-titulo`} className="suma-de-los-rangos__titulo">
          <Icono nombre="objetivo" tamano={18} />
          {C.sumaTitulo}
        </h3>
      )}
      <p className="nota">{C.sumaAyuda}</p>
      {sinRangos ? (
        <p className="nota" data-sin-rangos>
          {C.sumaSinRangos}
        </p>
      ) : (
        <>
          {objetivo ? null : <p className="nota">{C.sumaSinObjetivo}</p>}
          <div className="desplazable-x">
            <table className="tabla suma-de-los-rangos__tabla">
              <caption className="visualmente-oculto">{C.sumaTitulo}</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visualmente-oculto">Qué</span>
                  </th>
                  <th scope="col">{C.columnaSuma}</th>
                  <th scope="col">
                    <span className="visualmente-oculto">La suma y el objetivo en una franja</span>
                  </th>
                  <th scope="col">{C.columnaObjetivo}</th>
                  <th scope="col">{C.columnaUbicacion}</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.clave} data-fila-de-la-suma={f.clave}>
                    <th scope="row">
                      <RotuloConIcono macro={f.clave} texto={f.nombre} />
                    </th>
                    <td className="suma-de-los-rangos__cifra">{f.suma}</td>
                    {/* La franja: la suma como una banda y el objetivo como una marca, en la misma escala. Sin color de juicio:
                        el texto de al lado es el que dice dónde queda. */}
                    <td className="suma-de-los-rangos__celda-de-la-franja">
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
                    </td>
                    <td className="suma-de-los-rangos__cifra">{f.objetivoCifra ?? '—'}</td>
                    <td>{f.ubicacion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Lo que deja una suma sin tope y de dónde salen las kcal, una vez, debajo: la tabla queda de un renglón por fila. */}
          {notas.length > 0 ? (
            <p className="nota suma-de-los-rangos__notas" data-notas-de-la-suma>
              {notas.join('. ')}.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * NUP-07: las kcal que suman los gramos del objetivo, frente a las indicadas, y el porcentaje de cada macro con su base.
 * Mientras falte un macro, dice qué se va a ver; nunca suma a medias. Un objetivo viejo con macros en proporción de las
 * kcal (`enProporcion`) ya los tiene escritos: dice que no hay gramos que sumar.
 */
export function KcalDelObjetivo({ kcal, gramos, enProporcion = [], compacto = false }: { kcal: number | null; gramos: GramosDelObjetivo; enProporcion?: readonly MacroDelRango[]; compacto?: boolean }) {
  const k = kcalDeLosGramos(gramos, kcal);
  // Compacto (el objetivo del editor), sin gramos que sumar: se dice solo si es porque hay macros en proporción de las
  // kcal (SAN-04, DL-193: lo decía el paso 2 del asistente). «Con los tres macros escritos…» es del formulario.
  if (!k && compacto) {
    return enProporcion.length > 0 ? (
      <p className="nota kcal-del-objetivo" data-kcal-del-objetivo data-en-proporcion>
        {sinLasKcalDeLosGramos(enProporcion)}
      </p>
    ) : null;
  }
  if (!k) {
    return (
      <p className="nota kcal-del-objetivo" data-kcal-del-objetivo>
        {sinLasKcalDeLosGramos(enProporcion)}
      </p>
    );
  }
  const porcentajes = MACROS_DEL_RANGO.flatMap((m) => {
    const p = porcentajeDeLasKcal(m, gramos[m], kcal);
    return p ? [[m, p] as const] : [];
  });
  // El objetivo vigente, arriba de las comidas. RP-08 (DL-188): la cuenta de los gramos y la parte de cada macro, detrás
  // de un «?» junto al objetivo del día: las comidas quedan a la vista. Si no coinciden, el aviso corto sigue a la vista.
  if (compacto) {
    const partes = MACROS_DEL_RANGO.flatMap((m) => {
      const p = porcentajeEnUnaParte(m, gramos[m], kcal);
      return p ? [p] : [];
    });
    const noCoinciden = !!k.frente && kcal !== null && !k.frente.coinciden;
    return (
      <div className="kcal-del-objetivo kcal-del-objetivo--compacto" data-kcal-del-objetivo>
        {noCoinciden && kcal !== null ? (
          <p className="kcal-del-objetivo__aviso" data-no-coinciden>
            <Icono nombre="aviso" tamano={18} />
            <span>{C.noCoincidenCorto(k, kcal)}</span>
          </p>
        ) : null}
        <ExplicacionAPedido nombre={C.cuentaDeLosGramos} como="div">
          <p className="kcal-del-objetivo__renglon">
            {C.kcalEnUnRenglon(k)}
            {k.frente && kcal !== null ? (k.frente.coinciden ? ` · ${C.coinciden(kcal)}` : `. ${C.noCoinciden(k, kcal)}`) : '.'}
          </p>
          {partes.length > 0 ? (
            <p className="kcal-del-objetivo__renglon" data-porcentajes-del-objetivo>
              <EnPartes texto={partes.join(' · ')} />
            </p>
          ) : null}
        </ExplicacionAPedido>
      </div>
    );
  }
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
 * del editor, mientras se arma (no recién en «Revisar»).
 */
export function RangoEnUnRenglon({ de, rango, soloElBoton = false }: { de: string; rango: RangoParaIndicar; soloElBoton?: boolean }) {
  // Con el rango ya a la vista en otro lado (el encabezado de la comida), el renglón es solo el botón.
  if (soloElBoton && rango.indicado && !rango.alIndicar) return null;
  return (
    <p className="rango-en-un-renglon nota" data-rango-en-un-renglon>
      {soloElBoton && rango.indicado ? null : rango.indicado ? (
        <>
          <span aria-hidden="true">
            {C.rangoDeLaComida(de)}: <RangoIndicadoConIconos rango={rango.indicado} />
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
