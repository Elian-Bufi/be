'use client';

/**
 * PG-17 de WP-PULIDO-GRANDES (DL-173): la hoja del plan, para imprimirla o guardarla en PDF. La arma
 * `lib/hoja-del-plan.ts`; acá solo se dibuja.
 *
 * - **Va aparte de la página:** un portal, hijo directo de `<body>`. En pantalla no se ve (`.hoja-del-plan`, en
 *   globals.css); al imprimir se ve solo ella, y el resto de la página —el encabezado, la navegación, los botones, los
 *   avisos— no sale en el papel (TEST-PG-016).
 * - **Sin nada que se toque:** ni botones, ni enlaces, ni navegación. Es papel.
 * - **El QR para bajar la app** es el de la portada (`CodigoQr`, dibujado en el navegador), sin datos de la persona.
 * - **Negro sobre blanco en los dos temas,** con los tokens de la hoja; sin cortar una comida ni una sesión entre dos
 *   páginas (cada una, un bloque que no se parte), en A4 y en carta.
 */
import { createPortal } from 'react-dom';
import { COPY_HOJA_DEL_PLAN as C, type CuerpoDeLaHoja, type EjercicioDeLaHoja, type HojaDelPlan } from '../lib/hoja-del-plan';
import { CodigoQr } from './codigo-qr';

export function HojaDelPlanImpresa({ hoja }: { hoja: HojaDelPlan }) {
  if (typeof document === 'undefined') return null;
  return createPortal(<Hoja hoja={hoja} />, document.body);
}

function Hoja({ hoja }: { hoja: HojaDelPlan }) {
  return (
    <article className="hoja-del-plan" data-hoja-del-plan={hoja.area}>
      <header className="hoja-del-plan__cabeza">
        <div className="hoja-del-plan__titulos">
          <p className="hoja-del-plan__marca">{C.marca}</p>
          <h1>{hoja.titulo}</h1>
          <dl className="hoja-del-plan__datos" aria-label={C.datosDelPlan}>
            {hoja.datos.map((d) => (
              <div key={d.rotulo}>
                <dt>{d.rotulo}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="hoja-del-plan__app">
          <CodigoQr texto={hoja.app.enlace} etiqueta={hoja.app.etiqueta} tamano={120} />
          <figcaption>
            <strong>{hoja.app.titulo}</strong>
            <span>{hoja.app.texto}</span>
          </figcaption>
        </figure>
      </header>
      <Cuerpo cuerpo={hoja.cuerpo} />
      <footer className="hoja-del-plan__pie">
        {hoja.pie.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </footer>
    </article>
  );
}

function Cuerpo({ cuerpo }: { cuerpo: CuerpoDeLaHoja }) {
  if (cuerpo.vacio) return <p className="hoja-del-plan__tenue">{cuerpo.vacio}</p>;
  if (cuerpo.area === 'NUTRICION') {
    return (
      <>
        {cuerpo.dias.map((d, di) => (
          <section key={`${di}-${d.titulo}`} className="hoja-del-plan__grupo">
            <h2>{d.titulo}</h2>
            {d.vacio ? <p className="hoja-del-plan__tenue">{d.vacio}</p> : null}
            {d.comidas.map((m, mi) => (
              <section key={`${mi}-${m.nombre}`} className="hoja-del-plan__bloque">
                <h3>
                  {m.nombre} <span className="hoja-del-plan__tenue">· {m.cuantas}</span>
                </h3>
                {m.vacia ? <p className="hoja-del-plan__tenue">{m.vacia}</p> : null}
                <div className="hoja-del-plan__opciones">
                  {m.opciones.map((o, oi) => (
                    <div key={`${oi}-${o.titulo}`} className="hoja-del-plan__opcion">
                      <h4>{o.titulo}</h4>
                      {o.receta ? <p className="hoja-del-plan__tenue">{o.receta}</p> : null}
                      {o.vacia ? <p className="hoja-del-plan__tenue">{o.vacia}</p> : null}
                      {o.items.length > 0 ? (
                        <ul className="hoja-del-plan__items">
                          {o.items.map((i, ii) => (
                            <li key={`${ii}-${i.nombre}`}>
                              <span className="hoja-del-plan__item">{i.nombre}</span>
                              <span className="hoja-del-plan__cantidad">{i.indicado}</span>
                              {i.nota ? (
                                <span className="hoja-del-plan__nota">
                                  {C.nota}: {i.nota}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </section>
        ))}
      </>
    );
  }
  return (
    <>
      {cuerpo.sinDias ? <p className="hoja-del-plan__tenue">{cuerpo.sinDias}</p> : null}
      {cuerpo.grupos.map((g, gi) => (
        <section key={`${gi}-${g.titulo}`} className="hoja-del-plan__grupo">
          <h2>{g.titulo}</h2>
          {g.proposito ? <p className="hoja-del-plan__tenue">{g.proposito}</p> : null}
          {g.vacio ? <p className="hoja-del-plan__tenue">{g.vacio}</p> : null}
          {g.sesiones.map((s, si) => (
            <section key={`${si}-${s.titulo}`} className="hoja-del-plan__bloque">
              <h3>{s.titulo}</h3>
              <p className="hoja-del-plan__tenue">{[s.dias, s.cuenta].filter((x) => x !== null).join(' · ')}</p>
              {s.indicaciones ? (
                <p>
                  <strong>{C.indicaciones}:</strong> {s.indicaciones}
                </p>
              ) : null}
              {s.vacia ? <p className="hoja-del-plan__tenue">{s.vacia}</p> : null}
              {s.ejercicios.map((e, ei) => (
                <Ejercicio key={`${ei}-${e.nombre}`} ejercicio={e} />
              ))}
            </section>
          ))}
        </section>
      ))}
    </>
  );
}

function Ejercicio({ ejercicio: e }: { ejercicio: EjercicioDeLaHoja }) {
  return (
    <div className="hoja-del-plan__ejercicio">
      <h4>{e.nombre}</h4>
      <p className="hoja-del-plan__tenue">{e.resumen}</p>
      {e.series.length > 0 ? (
        <table className="hoja-del-plan__series">
          <caption className="visualmente-oculto">{C.seriesDe(e.nombre)}</caption>
          <thead>
            <tr>
              <th scope="col">{C.serie}</th>
              <th scope="col">{C.carga}</th>
              <th scope="col">{C.repeticiones}</th>
              {e.conRir ? <th scope="col">{C.rir}</th> : null}
              <th scope="col">{C.descanso}</th>
              {e.conNota ? <th scope="col">{C.nota}</th> : null}
            </tr>
          </thead>
          <tbody>
            {e.series.map((f) => (
              <tr key={f.serie}>
                <th scope="row">{f.serie}</th>
                <td>{f.carga ?? C.sinObjetivo}</td>
                <td>{f.repeticiones ?? C.sinObjetivo}</td>
                {e.conRir ? <td>{f.rir ?? C.sinObjetivo}</td> : null}
                <td>{f.descanso ?? C.sinObjetivo}</td>
                {e.conNota ? <td>{f.nota ?? ''}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {e.general.length > 0 ? (
        <dl className="hoja-del-plan__general">
          {e.general.map((g, i) => (
            <div key={`${i}-${g.rotulo}`}>
              <dt>{g.rotulo}</dt>
              <dd>{g.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
