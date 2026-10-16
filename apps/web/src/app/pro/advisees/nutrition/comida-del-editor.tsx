'use client';

/**
 * Una comida de la versión en preparación (WP-ESCRITORIO-AREAS, parte 7; maqueta 17): plegada, un renglón con su nombre,
 * cuántas opciones tiene y lo que adentro pide atención; abierta, sus opciones en pestañas y los ítems de la opción
 * elegida en una tabla. Es otra composición de lo que el editor ya hacía: no agrega ni quita ninguna operación.
 * - **Plegar no esconde lo que falta:** una comida sin nombre, una cantidad que no se entiende o un problema de «Validar»
 *   se dicen en el renglón plegado.
 * - **Las opciones no son equivalencias** (B05): se elige cuál se edita, y todas pesan lo mismo. Una opción que nació de
 *   una receta va en lectura (DL-119).
 * - **Cada campo de la tabla dice de qué alimento es** en su nombre accesible; el título de la columna lo dice a la vista.
 * - **El nombre se cambia a pedido** («Cambiar el nombre»): el campo aparece en el lugar, con el foco adentro, y Enter o
 *   salir de él lo cierra (`components/campo-de-nombre.tsx`). Lo que se acaba de agregar nace con el campo abierto.
 */
import {
  cantidad as formatearCantidad,
  comidaPlegadaDelEditor,
  COPY_HABITUALES,
  COPY_NUTRICION,
  COPY_RECETAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  leerNumero,
  motivoDeNumeroIlegible,
  pestanaDeLaOpcion,
  type EstructuraDePlanEntrada,
  type RecetaDeOpcion,
  type VersionDePlan,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { EnPartes } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { numeroEnCampo } from '../../../../lib/formato';

export type Estructura = EstructuraDePlanEntrada['dayTypes'];
export type ComidaEnEdicion = Estructura[number]['meals'][number];
export type OpcionEnEdicion = ComidaEnEdicion['options'][number];
export type ItemEnEdicion = OpcionEnEdicion['items'][number];
type ItemsGuardados = VersionDePlan['dayTypes'][number]['meals'][number]['options'][number]['items'];
type Preparacion = 'RAW' | 'COOKED' | 'AS_PURCHASED';
type Unidad = 'g' | 'ml' | 'unit';

/** Qué nombre se está cambiando dentro de una comida: el de la comida o el de una de sus opciones. */
export type NombreEnEdicion = { readonly de: 'comida' } | { readonly de: 'opcion'; readonly opcion: number } | null;

export function ComidaDelEditor({
  id,
  posicion,
  comida,
  abierta,
  problemas,
  esLaPrimera,
  opcionElegida,
  nombreEnEdicion,
  nombres,
  recetas,
  itemsDeLaReceta,
  alAlternar,
  alElegirOpcion,
  alEditarNombre,
  alCambiar,
  alSubir,
  alQuitar,
  alGuardarComoHabitual,
  alAgregarItem,
  alAgregarReceta,
}: {
  /** El prefijo de los identificadores de sus campos: `I-J`, las posiciones del día tipo y de la comida. */
  id: string;
  posicion: number;
  comida: ComidaEnEdicion;
  abierta: boolean;
  /** Cuántos problemas de «Validar» hay adentro. */
  problemas: number;
  esLaPrimera: boolean;
  opcionElegida: number;
  nombreEnEdicion: NombreEnEdicion;
  nombres: Readonly<Record<string, string>>;
  recetas: Readonly<Record<string, RecetaDeOpcion>>;
  itemsDeLaReceta: (optionId: string | undefined) => ItemsGuardados | null;
  alAlternar: () => void;
  alElegirOpcion: (k: number) => void;
  alEditarNombre: (que: NombreEnEdicion) => void;
  /** Cambia la comida: recibe una copia que se puede modificar. */
  alCambiar: (f: (m: ComidaEnEdicion) => void) => void;
  alSubir: () => void;
  alQuitar: () => void;
  alGuardarComoHabitual: () => void;
  alAgregarItem: (k: number) => void;
  alAgregarReceta: () => void;
}) {
  const propio = useId();
  const plegada = comidaPlegadaDelEditor(comida, posicion, problemas);
  const k = Math.min(opcionElegida, comida.options.length - 1);
  const opcion = k >= 0 ? comida.options[k] : undefined;
  const conRecetas = comida.options.some((o) => o.recipeVersionId);
  const cambiandoElNombre = nombreEnEdicion?.de === 'comida';
  const cambiandoElDeLaOpcion = nombreEnEdicion?.de === 'opcion' && nombreEnEdicion.opcion === k;
  return (
    <section className="comida-del-plan comida-del-editor" data-comida={posicion + 1} data-abierta={abierta ? '' : undefined}>
      <div className="comida-del-editor__cabecera">
        <h3 className="comida-del-plan__titulo">
          <button type="button" id={`abrir-comida-${id}`} className="comida-del-plan__boton" aria-expanded={abierta} aria-controls={`${propio}-cuerpo`} onClick={alAlternar}>
            <Icono nombre="comida" tamano={20} />
            <span className="comida-del-plan__textos">
              <span className="comida-del-plan__nombre">{plegada.titulo}</span>
              <span className="comida-del-plan__cuenta" data-resumen>
                <EnPartes texto={plegada.opciones} />
              </span>
              {plegada.avisos.length > 0 ? (
                <span className="comida-del-editor__avisos" data-avisos>
                  <Icono nombre="aviso" tamano={18} />
                  <EnPartes texto={plegada.avisos.join(' · ')} />
                </span>
              ) : null}
            </span>
            <Icono nombre={abierta ? 'arriba' : 'abajo'} tamano={18} />
          </button>
        </h3>
        {abierta ? (
          <div className="comida-del-editor__acciones">
            <button type="button" className="boton boton--quieto boton--compacto" disabled={esLaPrimera} onClick={alSubir}>
              <Icono nombre="ordenar" tamano={18} />
              Subir
            </button>
            <MenuDeAcciones
              rotulo={`más acciones de ${plegada.titulo}`}
              texto="Más"
              acciones={[
                { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => alEditarNombre({ de: 'comida' }) },
                { clave: 'habitual', texto: COPY_HABITUALES.guardarComoHabitual, alElegir: alGuardarComoHabitual, noSePuede: conRecetas ? COPY_RECETAS.recetaEnPlantilla : null },
                { clave: 'quitar', texto: 'Quitar comida', alElegir: alQuitar },
              ]}
            />
          </div>
        ) : null}
      </div>
      <div id={`${propio}-cuerpo`} className="comida-del-plan__cuerpo comida-del-editor__cuerpo" hidden={!abierta}>
        {abierta ? (
          <>
            {cambiandoElNombre || comida.label.trim() === '' ? (
              <CampoDeNombre
                id={`comida-${id}`}
                etiqueta="Nombre de la comida"
                valor={comida.label}
                maximo={80}
                enfocar={cambiandoElNombre}
                despues={`abrir-comida-${id}`}
                alEmpezar={() => alEditarNombre({ de: 'comida' })}
                alCambiar={(v) => alCambiar((m) => void (m.label = v))}
                alTerminar={() => alEditarNombre(null)}
              />
            ) : null}
            <div className="comida-del-editor__opciones">
              {comida.options.length > 0 ? (
                <fieldset className="pestanas-de-opcion">
                  <legend className="visualmente-oculto">Opción de {plegada.titulo} que se edita</legend>
                  {comida.options.map((o, n) => (
                    <label key={o.optionId ?? `nueva-${n}`} className="pestana-de-opcion" data-receta={o.recipeVersionId ? '' : undefined}>
                      <input type="radio" id={`pestana-${id}-${n}`} name={`${propio}-opcion`} checked={n === k} onChange={() => alElegirOpcion(n)} />
                      {o.recipeVersionId ? <Icono nombre="receta" tamano={18} /> : null}
                      <span>{pestanaDeLaOpcion(o, n)}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <p className="nota">Esta comida todavía no tiene opciones.</p>
              )}
              <MenuDeAcciones
                rotulo={`agregar una opción a ${plegada.titulo}`}
                texto="Agregar opción"
                icono="mas"
                conFlecha
                acciones={[
                  {
                    clave: 'vacia',
                    texto: 'Una opción nueva',
                    alElegir: () => {
                      const nueva = comida.options.length;
                      alCambiar((m) => void m.options.push({ label: `Opción ${nueva + 1}`, items: [] }));
                      alElegirOpcion(nueva);
                      alEditarNombre({ de: 'opcion', opcion: nueva });
                    },
                  },
                  { clave: 'receta', texto: COPY_RECETAS.agregarComoOpcion, alElegir: alAgregarReceta },
                ]}
              />
            </div>
            {conRecetas ? <p className="nota">{COPY_RECETAS.avisoDeOpciones}</p> : null}
            {opcion ? (
              <div className="opcion-del-editor" data-opcion={k + 1}>
                {cambiandoElDeLaOpcion || opcion.label.trim() === '' ? (
                  <CampoDeNombre
                    id={`opcion-${id}-${k}`}
                    etiqueta="Nombre de la opción"
                    valor={opcion.label}
                    maximo={120}
                    enfocar={cambiandoElDeLaOpcion}
                    despues={`pestana-${id}-${k}`}
                    alEmpezar={() => alEditarNombre({ de: 'opcion', opcion: k })}
                    alCambiar={(v) => alCambiar((m) => void (m.options[k]!.label = v))}
                    alTerminar={() => alEditarNombre(null)}
                  />
                ) : null}
                {opcion.recipeVersionId ? (
                  <OpcionDeReceta receta={recetas[opcion.recipeVersionId] ?? null} items={itemsDeLaReceta(opcion.optionId)} nombres={nombres} />
                ) : opcion.items.length === 0 ? (
                  <p className="nota">Esta opción todavía no tiene ítems.</p>
                ) : (
                  <div className="desplazable-x">
                    <table className="tabla items-del-editor">
                      <caption className="visualmente-oculto">Los ítems de {pestanaDeLaOpcion(opcion, k)}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Alimento</th>
                          <th scope="col">Cantidad</th>
                          <th scope="col">Unidad</th>
                          <th scope="col">{COPY_NUTRICION.estadoDePreparacion}</th>
                          <th scope="col">
                            <span className="visualmente-oculto">Quitar</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {opcion.items.map((it, l) => (
                          <FilaDeItem
                            key={it.itemId ?? `nuevo-${l}`}
                            id={`item-${id}-${k}-${l}`}
                            item={it}
                            nombre={nombres[it.catalogItemId] ?? 'Elemento'}
                            onCambiar={(cambio) => alCambiar((m) => void (m.options[k]!.items[l] = { ...it, ...cambio }))}
                            onQuitar={() => alCambiar((m) => void m.options[k]!.items.splice(l, 1))}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="opcion-del-editor__pie">
                  {opcion.recipeVersionId ? null : (
                    <>
                      <button type="button" className="boton boton--secundario" data-agregar-item onClick={() => alAgregarItem(k)}>
                        <Icono nombre="mas" tamano={18} />
                        Agregar ítem
                      </button>
                      <span className="nota">Del catálogo BE, de tus habituales o creado a mano.</span>
                    </>
                  )}
                  <span className="opcion-del-editor__del-nombre">
                    <button type="button" className="boton boton--enlace" onClick={() => alEditarNombre({ de: 'opcion', opcion: k })}>
                      Cambiar el nombre
                    </button>
                    <button
                      type="button"
                      className="boton boton--enlace"
                      onClick={() => {
                        alCambiar((m) => void m.options.splice(k, 1));
                        alElegirOpcion(Math.max(0, k - 1));
                      }}
                    >
                      Quitar opción {k + 1}
                    </button>
                  </span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Un ítem, en su fila: el alimento y sus tres datos. El campo de la cantidad guarda el texto tal como se escribe y
 * propaga lo interpretado: si mostrara siempre el número interpretado, «72,» se borraría a mitad de camino y no se
 * podría escribir un decimal. Se resincroniza cuando el valor cambia desde afuera (al guardar, al quitar un ítem).
 */
export function FilaDeItem({ id, item, nombre, onCambiar, onQuitar }: { id: string; item: ItemEnEdicion; nombre: string; onCambiar: (c: Partial<ItemEnEdicion>) => void; onQuitar: () => void }) {
  const magnitud = item.quantity;
  const externo = numeroEnCampo(magnitud?.value);
  const [escrito, setEscrito] = useState(externo);
  useEffect(() => {
    setEscrito((t) => (numeroEnCampo(leerNumero(t)) === externo ? t : externo));
  }, [externo]);
  // Lo que no es un número se señala en el campo, en vez de guardarse como cero en silencio (B10-10:164-165).
  const error = escrito.trim() !== '' && leerNumero(escrito) === null ? motivoDeNumeroIlegible(escrito) : null;
  return (
    <tr className="item-del-editor">
      <th scope="row" className="item-del-editor__nombre">
        {nombre}
      </th>
      <td data-etiqueta="Cantidad" className={error ? 'campo--error' : undefined}>
        <input
          id={`${id}-cantidad`}
          className="item-del-editor__cantidad"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`Cantidad de ${nombre}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-cantidad-error` : undefined}
          value={escrito}
          onChange={(e) => {
            setEscrito(e.target.value);
            const n = leerNumero(e.target.value);
            if (e.target.value.trim() === '') return onCambiar({ quantity: null });
            // Lo que no se entiende viaja como NaN, igual que en entrenamiento: el guardado se niega y lo señala, en
            // vez de guardar en silencio el último número válido que había en el campo.
            onCambiar({ quantity: { value: n ?? Number.NaN, unit: magnitud?.unit ?? 'g' } });
          }}
        />
        {error ? (
          <p id={`${id}-cantidad-error`} className="campo__error">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        ) : null}
      </td>
      <td data-etiqueta="Unidad">
        <select id={`${id}-unidad`} aria-label={`Unidad de ${nombre}`} value={magnitud?.unit ?? 'g'} disabled={!magnitud} onChange={(e) => magnitud && onCambiar({ quantity: { ...magnitud, unit: e.target.value as Unidad } })}>
          {(Object.keys(ETIQUETA_DE_UNIDAD) as Unidad[]).map((u) => (
            <option key={u} value={u}>
              {ETIQUETA_DE_UNIDAD[u]}
            </option>
          ))}
        </select>
      </td>
      <td data-etiqueta={COPY_NUTRICION.estadoDePreparacion}>
        <select
          id={`${id}-preparacion`}
          aria-label={`${COPY_NUTRICION.estadoDePreparacion} de ${nombre}`}
          value={item.preparationState ?? ''}
          onChange={(e) => onCambiar({ preparationState: (e.target.value || null) as Preparacion | null })}
        >
          <option value="">Sin indicar</option>
          {(Object.keys(ETIQUETA_DE_PREPARACION) as Preparacion[]).map((p) => (
            <option key={p} value={p}>
              {ETIQUETA_DE_PREPARACION[p]}
            </option>
          ))}
        </select>
      </td>
      <td className="item-del-editor__quitar">
        <button type="button" className="boton boton--quieto item-del-editor__boton-de-quitar" aria-label={`Quitar ${nombre}`} title={`Quitar ${nombre}`} onClick={onQuitar}>
          <Icono nombre="cerrar" tamano={18} />
        </button>
      </td>
    </tr>
  );
}

/**
 * Una opción que nació de una receta (DL-119): la receta y su versión, y los ítems de una porción que armó la API, en
 * lectura. Antes de guardar, todavía no hay ítems: se dice.
 */
function OpcionDeReceta({ receta, items, nombres }: { receta: RecetaDeOpcion | null; items: ItemsGuardados | null; nombres: Readonly<Record<string, string>> }) {
  return (
    <div className="opcion-de-receta">
      <p>
        <span className="insignia">{receta ? COPY_RECETAS.opcionDeReceta(receta.name, receta.versionNumber) : 'Receta'}</span>
      </p>
      <p className="nota">{COPY_RECETAS.porcionDeLaOpcion}</p>
      {items ? (
        <ul className="lista-compacta">
          {items.map((it) => (
            <li key={it.itemId}>
              <strong>{it.name || nombres[it.catalogItemId] || 'Elemento'}</strong>
              {it.quantity ? ` · ${formatearCantidad(it.quantity.value, ETIQUETA_DE_UNIDAD[it.quantity.unit])}` : ''}
              {it.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[it.preparationState].toLowerCase()}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="nota">{COPY_RECETAS.ingredientesAlGuardar}</p>
      )}
    </div>
  );
}
