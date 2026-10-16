'use client';

/**
 * La estructura de una versión activada del plan de entrenamiento, en solo lectura y desde su instantánea: lo que ve el
 * asesorado (WP-ESCRITORIO-AREAS, parte 6; maqueta 24; C-69, C-80 y C-81). La usan la sección «Plan» de Entrenamiento y
 * la planificación de una etapa en la ficha, que es una columna angosta: por eso se acomoda al ancho de su caja y no al
 * de la ventana, y **no depende del contexto de la pestaña** (quien la usa le pasa con qué leer la imagen del
 * ejercicio).
 * - **Se mira una sesión por vez:** la del bloque y, si el bloque los usa, del microciclo elegidos. Con una sola cosa
 *   para elegir se dice su nombre; con hasta cuatro, un control; con cinco o más, una lista que dice cuántas hay.
 * - **Los ejercicios, plegados,** cada uno en un renglón con lo que piden sus series: plegar no esconde.
 * - **Abierto, un ejercicio muestra lo que recibe el asesorado,** serie por serie, con el objetivo que resolvió la API
 *   (DL-122) y la nota de cada serie; y, al lado, lo general del ejercicio.
 * Las reglas (qué se mira, cómo se dice un ejercicio plegado, las series y lo general) son del dominio
 * (`lectura-del-plan-de-entrenamiento.ts`), con sus pruebas: acá solo se dibujan.
 */
import {
  COPY_DEL_PLAN_DE_ENTRENAMIENTO as C,
  COPY_ENTRENAMIENTO_POR_SERIE,
  NINGUN_EJERCICIO,
  abiertosPorOrden,
  cuentaDeLaSesion,
  encabezadoDelEjercicio,
  loGeneralDelEjercicio,
  pedidoDeAbiertos,
  renglonDelEjercicio,
  seriesDelEjercicio,
  type PrescripcionConObjetivos,
  type SesionConObjetivos,
} from '@be/domain';
import { useId, type ReactNode } from 'react';
import { EnPartes, conNumerosPegados } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';
import type { Resultado } from '../../../../lib/api';
import { ImagenGuardadaDeEjercicio } from '../../exercises/imagen-de-ejercicio';

/** Con qué se lee la imagen de un ejercicio: lo da la pestaña o la ficha, la que esté usando la pieza. */
export interface AccesoALasImagenes {
  readonly token: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

/** Hasta cuántas cosas se eligen con un control a la vista; con más, una lista (C-81). */
const HASTA_CUANTAS_CON_BOTONES = 4;

/**
 * Un nivel del plan entre los que se elige: el bloque, el microciclo o la sesión. Con uno solo no hay nada que elegir y
 * se dice su nombre. Los nombres los escribe el profesional: los segmentos bajan de renglón antes que salirse.
 */
export function SelectorDeNivel<T extends { readonly order: number; readonly label: string }>({
  nivel,
  rotulo,
  opciones,
  elegido,
  onElegir,
  children,
}: {
  /** Va en `data-nivel`: por él lo encuentran los recorridos. */
  nivel: 'bloque' | 'microciclo' | 'sesion';
  rotulo: string;
  opciones: readonly T[];
  elegido: T | null;
  onElegir: (orden: number) => void;
  /** Lo que se dice de lo elegido, al lado: cuántas sesiones tiene el bloque, su propósito. */
  children?: ReactNode;
}) {
  const id = useId();
  if (!elegido) return null;
  const enOrden = [...opciones].sort((a, b) => a.order - b.order);
  const forma = enOrden.length === 1 ? 'unico' : enOrden.length <= HASTA_CUANTAS_CON_BOTONES ? 'botones' : 'lista';
  return (
    <div className="nivel-del-plan" data-nivel={nivel} data-forma={forma}>
      {forma === 'unico' ? (
        <p className="nivel-del-plan__unico">
          <span className="nivel-del-plan__rotulo">{rotulo}</span> <strong>{elegido.label}</strong>
        </p>
      ) : null}
      {forma === 'botones' ? (
        <fieldset className="segmentos segmentos--que-bajan">
          <legend>{rotulo}</legend>
          <div className="segmentos__fila">
            {enOrden.map((o) => (
              <label key={o.order} className="segmento">
                <input type="radio" name={id} value={o.order} checked={o.order === elegido.order} onChange={() => onElegir(o.order)} />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {forma === 'lista' ? (
        <p className="nivel-del-plan__lista">
          <label htmlFor={`${id}-lista`} className="nivel-del-plan__rotulo">
            {rotulo}
          </label>
          <select id={`${id}-lista`} value={elegido.order} onChange={(e) => onElegir(Number(e.target.value))}>
            {enOrden.map((o) => (
              <option key={o.order} value={o.order}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="nota">
            {enOrden.findIndex((o) => o.order === elegido.order) + 1} {C.deCuantas(enOrden.length)}
          </span>
        </p>
      ) : null}
      {children}
    </div>
  );
}

/**
 * Los ejercicios de una sesión (sus indicaciones las dice quien la muestra, arriba). `pedido` dice cuáles están abiertos, como lo escribe la dirección de la página (`null`:
 * el primero); `onPedir` recibe lo que hay que escribir cuando cambia. `nivel` es el del título de cada ejercicio: 3 en
 * la sección «Plan», 4 dentro del detalle de la ficha, que ya tiene su título.
 */
export function EjerciciosDeLaSesion({
  sesion,
  pedido,
  onPedir,
  acceso,
  nivel = 3,
}: {
  sesion: SesionConObjetivos;
  pedido: string | null;
  onPedir: (pedido: string | null) => void;
  acceso: AccesoALasImagenes;
  nivel?: 3 | 4;
}) {
  const ejercicios = [...sesion.prescriptions].sort((a, b) => a.order - b.order);
  const abiertos = abiertosPorOrden(ejercicios, pedido);
  const todos = abiertos.size === ejercicios.length;
  const alternar = (orden: number) => {
    const queda = new Set(abiertos);
    if (queda.has(orden)) queda.delete(orden);
    else queda.add(orden);
    onPedir(pedidoDeAbiertos(ejercicios, queda, NINGUN_EJERCICIO));
  };
  return (
    <div className="comidas-del-plan ejercicios-del-plan">
      {ejercicios.length === 0 ? (
        <p className="nota">{C.sinEjercicios}</p>
      ) : (
        <>
          <div className="comidas-del-plan__barra">
            <p className="nota" data-cuenta-de-la-sesion>
              <EnPartes texto={cuentaDeLaSesion(sesion)} />
            </p>
            {ejercicios.length > 1 ? (
              <button type="button" className="boton boton--enlace" data-todos-los-ejercicios onClick={() => onPedir(pedidoDeAbiertos(ejercicios, todos ? new Set() : new Set(ejercicios.map((e) => e.order)), NINGUN_EJERCICIO))}>
                {todos ? C.plegarTodos : C.abrirTodos}
              </button>
            ) : null}
          </div>
          {ejercicios.map((p) => (
            <EjercicioDelPlan key={p.prescriptionId} prescripcion={p} abierto={abiertos.has(p.order)} onAlternar={() => alternar(p.order)} acceso={acceso} nivel={nivel} />
          ))}
        </>
      )}
    </div>
  );
}

function EjercicioDelPlan({ prescripcion: p, abierto, onAlternar, acceso, nivel }: { prescripcion: PrescripcionConObjetivos; abierto: boolean; onAlternar: () => void; acceso: AccesoALasImagenes; nivel: 3 | 4 }) {
  const id = useId();
  const Titulo = nivel === 3 ? 'h3' : 'h4';
  const { filas, conRir, conNota } = seriesDelEjercicio(p);
  const general = loGeneralDelEjercicio(p);
  const sinObjetivo = <span className="tenue">{COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo}</span>;
  return (
    <section className="comida-del-plan ejercicio-del-plan" data-ejercicio={p.order} data-abierta={abierto ? '' : undefined}>
      <Titulo className="comida-del-plan__titulo">
        <button type="button" className="comida-del-plan__boton" aria-expanded={abierto} aria-controls={`${id}-series`} onClick={onAlternar}>
          <Icono nombre="entrenamiento" tamano={20} />
          <span className="comida-del-plan__textos">
            <span className="comida-del-plan__nombre">{p.exerciseName}</span>
            {/* Plegado dice lo que piden sus series; abierto, cuántas son y con qué criterio: el detalle está abajo. */}
            <span className="comida-del-plan__cuenta" data-resumen>
              <EnPartes texto={abierto ? encabezadoDelEjercicio(p) : renglonDelEjercicio(p)} />
            </span>
          </span>
          <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
        </button>
      </Titulo>
      <div id={`${id}-series`} className="comida-del-plan__cuerpo ejercicio-del-plan__cuerpo" hidden={!abierto}>
        {abierto ? (
          <>
            <div className="ejercicio-del-plan__series">
              {filas.length === 0 ? (
                <p className="nota">{C.sinSeries}</p>
              ) : (
                <div className="desplazable-x">
                  <table className="tabla series-del-plan">
                    <caption>{C.loQueRecibe}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}</th>
                        <th scope="col">{C.cargaSugerida}</th>
                        <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones}</th>
                        {conRir ? <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.columnaRir}</th> : null}
                        <th scope="col">{COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado}</th>
                        {conNota ? <th scope="col">{C.nota}</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f) => (
                        <tr key={f.serie} data-serie={f.serie}>
                          {/* En una pantalla angosta la tabla se apila y no se ven los títulos de las columnas: cada dato lleva el
                              suyo (B10-10 §9), salvo los que ya dicen qué son («6 rep.», «RIR 1») y una nota que no hay. */}
                          <th scope="row" data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.columnaSerie}>
                            {f.serie}
                          </th>
                          <td data-etiqueta={C.cargaSugerida}>{f.carga ?? sinObjetivo}</td>
                          <td data-etiqueta={f.repeticiones === null ? COPY_ENTRENAMIENTO_POR_SERIE.columnaRepeticiones : undefined}>{f.repeticiones ?? sinObjetivo}</td>
                          {conRir ? <td data-etiqueta={f.rir === null ? COPY_ENTRENAMIENTO_POR_SERIE.columnaRir : undefined}>{f.rir ?? sinObjetivo}</td> : null}
                          <td data-etiqueta={COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado}>{f.descanso ?? sinObjetivo}</td>
                          {conNota ? (
                            <td className="series-del-plan__nota" data-etiqueta={f.nota ? C.nota : undefined}>
                              {f.nota ? conNumerosPegados(f.nota) : ''}
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ejercicio-del-plan__general">
              <p className="ejercicio-del-plan__subtitulo">{C.loGeneral}</p>
              {p.image ? <ImagenGuardadaDeEjercicio token={acceso.token} medioId={p.image.mediaId} nombre={p.exerciseName} textoAlternativo={p.image.altText} sesionPerdida={acceso.sesionPerdida} chica /> : null}
              <dl className="lo-general-del-ejercicio">
                {general.map((g, i) => (
                  <div key={`${i}-${g.rotulo}`}>
                    <dt>{g.rotulo}</dt>
                    <dd>{conNumerosPegados(g.valor)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
