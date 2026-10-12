'use client';

/**
 * La estructura de una versión activada del plan de comidas, en solo lectura y desde su instantánea: lo que ve el
 * asesorado (WP-ESCRITORIO-AREAS, parte 5; maqueta 16; C-35 y C-45). La usan la sección «Plan» de Nutrición y la
 * planificación de una etapa en la ficha, que es una columna angosta: por eso las opciones se acomodan al ancho de su
 * caja y no al de la ventana.
 * - **Se lee de a un día tipo.** Con uno solo no hay nada que elegir: se dice su nombre.
 * - **Las comidas, plegadas,** cada una en un renglón con su cantidad de opciones y sus nombres: plegar no esconde.
 * - **Las opciones, lado a lado y todas a la vista:** se elige una, no son equivalencias y ninguna es la principal.
 * - **Un ítem sin cantidad lo dice.** La nota de un ítem se lee como la lee el asesorado en la APK.
 * Las reglas (qué día se muestra, qué comidas están abiertas, cómo se dice un ítem) son del dominio
 * (`plan-de-nutricion.ts`), con sus pruebas: acá solo se dibujan.
 */
import { COPY_DEL_PLAN, COPY_PLANTILLAS, COPY_RECETAS, comidasAbiertas, indicadoDelItem, opcionesEnPalabras, pedidoDeComidas, tituloDeLaOpcion, type VersionDePlan } from '@be/domain';
import { useId } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';

/** El espacio que no se parte, escrito con su código: en la fuente no se distingue de un espacio común. */
const PEGADO = '\u00A0';

type DiaTipo = VersionDePlan['dayTypes'][number];
type Comida = DiaTipo['meals'][number];

/**
 * El día tipo que se mira. Con más de uno, un control segmentado; con uno solo, su nombre. Hasta siete, con el nombre
 * que les puso el profesional: los segmentos bajan de renglón antes que salirse de la pantalla.
 */
export function SelectorDeDiaTipo({ dias, elegido, onElegir }: { dias: readonly DiaTipo[]; elegido: DiaTipo | null; onElegir: (orden: number) => void }) {
  const nombre = useId();
  const enOrden = [...dias].sort((a, b) => a.order - b.order);
  if (!elegido) return null;
  if (enOrden.length === 1) {
    return (
      <p className="dia-tipo-del-plan" data-dia-tipo="unico">
        <span className="dia-tipo-del-plan__rotulo">{COPY_DEL_PLAN.diaTipo}</span> <strong>{elegido.label}</strong>
      </p>
    );
  }
  return (
    <fieldset className="segmentos segmentos--que-bajan" data-dia-tipo="varios">
      <legend>{COPY_DEL_PLAN.diaTipo}</legend>
      <div className="segmentos__fila">
        {enOrden.map((d) => (
          <label key={d.dayTypeId} className="segmento">
            <input type="radio" name={nombre} value={d.order} checked={d.dayTypeId === elegido.dayTypeId} onChange={() => onElegir(d.order)} />
            {d.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Las comidas de un día tipo. `pedido` dice cuáles están abiertas, como lo escribe la dirección de la página (`null`: la
 * primera); `onPedir` recibe lo que hay que escribir cuando cambia. `nivel` es el del título de cada comida: 3 en la
 * sección «Plan», 4 dentro del detalle de la ficha, que ya tiene su título.
 */
export function ComidasDelPlan({ dia, pedido, onPedir, nivel = 3 }: { dia: DiaTipo; pedido: string | null; onPedir: (pedido: string | null) => void; nivel?: 3 | 4 }) {
  const comidas = [...dia.meals].sort((a, b) => a.order - b.order);
  const abiertas = comidasAbiertas(comidas, pedido);
  if (comidas.length === 0) return <p className="nota">{COPY_DEL_PLAN.sinComidas}</p>;
  const todas = abiertas.size === comidas.length;
  const alternar = (orden: number) => {
    const queda = new Set(abiertas);
    if (queda.has(orden)) queda.delete(orden);
    else queda.add(orden);
    onPedir(pedidoDeComidas(comidas, queda));
  };
  return (
    <div className="comidas-del-plan">
      <div className="comidas-del-plan__barra">
        <p className="nota">{COPY_PLANTILLAS.comidas(comidas.length)}</p>
        {comidas.length > 1 ? (
          <button type="button" className="boton boton--enlace" data-todas-las-comidas onClick={() => onPedir(pedidoDeComidas(comidas, todas ? new Set() : new Set(comidas.map((c) => c.order))))}>
            {todas ? COPY_DEL_PLAN.plegarTodas : COPY_DEL_PLAN.abrirTodas}
          </button>
        ) : null}
      </div>
      {comidas.map((m) => (
        <ComidaDelPlan key={m.mealId} comida={m} abierta={abiertas.has(m.order)} onAlternar={() => alternar(m.order)} nivel={nivel} />
      ))}
    </div>
  );
}

function ComidaDelPlan({ comida, abierta, onAlternar, nivel }: { comida: Comida; abierta: boolean; onAlternar: () => void; nivel: 3 | 4 }) {
  const id = useId();
  const opciones = [...comida.options].sort((a, b) => a.order - b.order);
  const Titulo = nivel === 3 ? 'h3' : 'h4';
  const TituloDeOpcion = nivel === 3 ? 'h4' : 'h5';
  return (
    <section className="comida-del-plan" data-comida={comida.order} data-abierta={abierta ? '' : undefined}>
      <Titulo className="comida-del-plan__titulo">
        <button type="button" className="comida-del-plan__boton" aria-expanded={abierta} aria-controls={`${id}-opciones`} onClick={onAlternar}>
          <Icono nombre="comida" tamano={20} />
          <span className="comida-del-plan__textos">
            <span className="comida-del-plan__nombre">{comida.label}</span>
            <span className="comida-del-plan__cuenta">{opcionesEnPalabras(opciones.length)}</span>
            {/* Plegada, la comida dice igual qué opciones tiene: el día entero se lee sin abrir nada. */}
            {!abierta && opciones.length > 0 ? (
              <span className="comida-del-plan__opciones">
                <EnPartes texto={opciones.map((o) => o.label).join(' · ')} />
              </span>
            ) : null}
          </span>
          <Icono nombre={abierta ? 'arriba' : 'abajo'} tamano={18} />
        </button>
      </Titulo>
      <div id={`${id}-opciones`} className="comida-del-plan__cuerpo" hidden={!abierta}>
        {abierta ? (
          opciones.length === 0 ? (
            <p className="nota">{COPY_DEL_PLAN.sinOpciones}</p>
          ) : (
            <div className="opciones-del-plan">
              {opciones.map((o) => (
                <article key={o.optionId} className="opcion-del-plan" data-opcion={o.order}>
                  <TituloDeOpcion className="opcion-del-plan__titulo">{tituloDeLaOpcion(o, opciones.length)}</TituloDeOpcion>
                  {o.recipe ? (
                    <p className="opcion-del-plan__receta nota">
                      <Icono nombre="receta" tamano={18} />
                      <span>
                        {/* El separador queda al final del renglón de arriba, nunca al principio del de abajo. */}
                        {COPY_RECETAS.opcionDeReceta(o.recipe.name, o.recipe.versionNumber)}
                        {PEGADO}· {COPY_RECETAS.porcionDeLaOpcion}
                      </span>
                    </p>
                  ) : null}
                  {o.items.length === 0 ? (
                    <p className="nota">{COPY_DEL_PLAN.sinItems}</p>
                  ) : (
                    <ul className="items-del-plan">
                      {o.items.map((i) => (
                        <li key={i.itemId}>
                          <span className="items-del-plan__nombre">{i.name}</span>
                          <span className="items-del-plan__indicado">
                            <EnPartes texto={indicadoDelItem(i)} />
                          </span>
                          {i.note ? (
                            <span className="items-del-plan__nota">
                              {COPY_DEL_PLAN.notaDelItem}: {i.note}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
