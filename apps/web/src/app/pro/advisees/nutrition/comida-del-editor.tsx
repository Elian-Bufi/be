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
 * - **La nota de cada ítem** (WP-TABLERO-ALTA-GAMA TB-48): estaba en el contrato y la persona la lee en la app junto al
 *   ingrediente, pero el editor no la dejaba escribir. Va en un renglón debajo del ítem, a pedido («Agregar una nota
 *   sobre …», `components/texto-a-pedido.tsx`), hasta 300 caracteres. No cambia lo que lee la app: el campo ya
 *   existía.
 * - **ED-31 y ED-33 (WP-EDITORES-PROFESIONAL):** la opción elegida dice su total al instante («703 kcal · P 45 g · …»),
 *   como estimación del editor, y lo que falta dice «Sin dato» y qué lo impide; «+ Opción de alimentos» y «+ Opción de
 *   receta» van por separado (una opción es de alimentos o de receta, nunca las dos); quitar una opción con contenido
 *   lo decide el editor, que pregunta con lo que se va.
 * - **Duplicar y reordenar** (TB-48): «Duplicar comida» en «Más», «Subir» y «Bajar» al lado, y «Duplicar opción N» junto
 *   a cambiar su nombre. La copia va justo después y nace con su nombre a la vista (`advisees/editar-la-estructura.ts`).
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
import { TextoAPedido } from '../../../../components/texto-a-pedido';
import { numeroEnCampo } from '../../../../lib/formato';
import { COPY_DE_LOS_EDITORES as E } from '../editar-la-estructura';
import { COPY_DE_OTRA_COMIDA, MAXIMO_DE_OPCIONES } from './opcion-de-otra-comida';
import { COPY_VERSION_NUEVA } from './version-nueva-de-la-receta';
import { faltantesDeLaOpcion, queFaltaEnPalabras, totalEnPalabras, totalEnUnaLinea, type TotalDeLaOpcion } from './rangos';

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
  esLaUltima,
  opcionElegida,
  nombreEnEdicion,
  nombres,
  recetas,
  itemsDeLaReceta,
  versionNueva,
  alUsarLaVersionNueva,
  alAlternar,
  alElegirOpcion,
  alEditarNombre,
  alCambiar,
  alSubir,
  alBajar,
  alDuplicar,
  alDuplicarOpcion,
  alQuitar,
  alGuardarComoHabitual,
  noSePuedeCopiar,
  noSePuedeUsarHabitual,
  alCopiarDesdeOtra,
  alUsarHabitual,
  alAgregarItem,
  alAgregarReceta,
  alQuitarOpcion,
  totalDeLaOpcion,
}: {
  /** El prefijo de los identificadores de sus campos: `I-J`, las posiciones del día tipo y de la comida. */
  id: string;
  posicion: number;
  comida: ComidaEnEdicion;
  abierta: boolean;
  /** Cuántos problemas de «Validar» hay adentro. */
  problemas: number;
  esLaPrimera: boolean;
  esLaUltima: boolean;
  opcionElegida: number;
  nombreEnEdicion: NombreEnEdicion;
  nombres: Readonly<Record<string, string>>;
  recetas: Readonly<Record<string, RecetaDeOpcion>>;
  /** Con la versión que cita la opción: la porción guardada de otra versión no vale (después de «Usar la versión N»). */
  itemsDeLaReceta: (optionId: string | undefined, recipeVersionId: string) => ItemsGuardados | null;
  /** ED-32: si la receta de la opción `k` tiene una versión más nueva, su número y lo que cambia en una porción. */
  versionNueva: (k: number) => { readonly numero: number; readonly cambios: readonly string[]; readonly conLaPorcionDeAhora: boolean } | null;
  alUsarLaVersionNueva: (k: number) => void;
  alAlternar: () => void;
  alElegirOpcion: (k: number) => void;
  alEditarNombre: (que: NombreEnEdicion) => void;
  /** Cambia la comida: recibe una copia que se puede modificar. */
  alCambiar: (f: (m: ComidaEnEdicion) => void) => void;
  alSubir: () => void;
  alBajar: () => void;
  /** TB-48: la copia de la comida, justo después. */
  alDuplicar: () => void;
  /** TB-48: la copia de la opción `k`, justo después. */
  alDuplicarOpcion: (k: number) => void;
  alQuitar: () => void;
  alGuardarComoHabitual: () => void;
  /** ED-33: por qué no se puede copiar desde otra comida o usar una habitual (`null`: se puede). */
  noSePuedeCopiar: string | null;
  noSePuedeUsarHabitual: string | null;
  alCopiarDesdeOtra: () => void;
  alUsarHabitual: () => void;
  alAgregarItem: (k: number) => void;
  alAgregarReceta: () => void;
  /** ED-33: quitar la opción `k`; con contenido, el editor pregunta antes. */
  alQuitarOpcion: (k: number) => void;
  /** ED-31: el total de la opción `k`, estimado en el editor. */
  totalDeLaOpcion: (k: number) => TotalDeLaOpcion | null;
}) {
  const propio = useId();
  const plegada = comidaPlegadaDelEditor(comida, posicion, problemas);
  const k = Math.min(opcionElegida, comida.options.length - 1);
  const opcion = k >= 0 ? comida.options[k] : undefined;
  const conRecetas = comida.options.some((o) => o.recipeVersionId);
  const cambiandoElNombre = nombreEnEdicion?.de === 'comida';
  const cambiandoElDeLaOpcion = nombreEnEdicion?.de === 'opcion' && nombreEnEdicion.opcion === k;
  const total = opcion ? totalDeLaOpcion(k) : null;
  const nueva = opcion?.recipeVersionId ? versionNueva(k) : null;
  const faltan = total ? faltantesDeLaOpcion(total) : [];
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
            {/* Se apagan con `aria-disabled`: al llegar a la punta, el botón que se tocó conserva el foco (TB-48). */}
            <button type="button" className="boton boton--quieto boton--compacto" aria-disabled={esLaPrimera || undefined} onClick={() => !esLaPrimera && alSubir()}>
              <Icono nombre="ordenar" tamano={18} />
              {E.subir}
              <span className="visualmente-oculto"> {plegada.titulo}</span>
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" aria-disabled={esLaUltima || undefined} onClick={() => !esLaUltima && alBajar()} data-bajar>
              {E.bajar}
              <span className="visualmente-oculto"> {plegada.titulo}</span>
            </button>
            <MenuDeAcciones
              rotulo={`más acciones de ${plegada.titulo}`}
              texto="Más"
              acciones={[
                { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => alEditarNombre({ de: 'comida' }) },
                { clave: 'duplicar', texto: E.duplicarComida, alElegir: alDuplicar },
                // ED-33: una opción más, desde otra comida del plan o desde una comida habitual.
                { clave: 'copiar-desde-otra', texto: COPY_DE_OTRA_COMIDA.copiar, alElegir: alCopiarDesdeOtra, noSePuede: noSePuedeCopiar },
                { clave: 'usar-habitual', texto: COPY_DE_OTRA_COMIDA.usarHabitual, alElegir: alUsarHabitual, noSePuede: noSePuedeUsarHabitual },
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
              {/* ED-33: las dos clases de opción, por separado y a la vista. Una opción es de alimentos o de receta. */}
              <span className="comida-del-editor__agregar-opcion">
                <button
                  type="button"
                  className="boton boton--quieto boton--compacto"
                  data-opcion-de-alimentos
                  disabled={comida.options.length >= MAXIMO_DE_OPCIONES}
                  onClick={() => {
                    const nueva = comida.options.length;
                    alCambiar((m) => void m.options.push({ label: `Opción ${nueva + 1}`, items: [] }));
                    alElegirOpcion(nueva);
                    alEditarNombre({ de: 'opcion', opcion: nueva });
                  }}
                >
                  <Icono nombre="mas" tamano={18} />
                  {COPY_OPCIONES.deAlimentos}
                  <span className="visualmente-oculto"> {COPY_OPCIONES.en(plegada.titulo)}</span>
                </button>
                <button type="button" className="boton boton--quieto boton--compacto" data-opcion-de-receta disabled={comida.options.length >= MAXIMO_DE_OPCIONES} onClick={alAgregarReceta}>
                  <Icono nombre="receta" tamano={18} />
                  {COPY_OPCIONES.deReceta}
                  <span className="visualmente-oculto"> {COPY_OPCIONES.en(plegada.titulo)}</span>
                </button>
                {comida.options.length >= MAXIMO_DE_OPCIONES ? <span className="nota">{COPY_OPCIONES.tope(MAXIMO_DE_OPCIONES)}</span> : null}
              </span>
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
                  <>
                    <OpcionDeReceta receta={recetas[opcion.recipeVersionId] ?? null} items={itemsDeLaReceta(opcion.optionId, opcion.recipeVersionId)} nombres={nombres} />
                    {/* ED-32: «Hay una versión 3 de esta receta», con lo que cambia, y pasarla solo a pedido. */}
                    {nueva ? (
                      <div className="version-nueva-de-la-receta" data-version-nueva={nueva.numero}>
                        <p>
                          <Icono nombre="aviso" tamano={18} />
                          <strong>{COPY_VERSION_NUEVA.hay(nueva.numero)}</strong>
                        </p>
                        <p className="nota">{nueva.conLaPorcionDeAhora ? COPY_VERSION_NUEVA.loQueCambia : COPY_VERSION_NUEVA.ingredientesDeLaNueva}:</p>
                        <ul className="lista-compacta">
                          {nueva.cambios.slice(0, 6).map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                          {nueva.cambios.length > 6 ? <li>y {nueva.cambios.length - 6} más</li> : null}
                        </ul>
                        <button type="button" className="boton boton--secundario boton--compacto" onClick={() => alUsarLaVersionNueva(k)}>
                          {COPY_VERSION_NUEVA.usarla(nueva.numero)}
                        </button>
                        <p className="nota">{COPY_VERSION_NUEVA.queHace}</p>
                      </div>
                    ) : null}
                  </>
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
                {/* ED-31: el total de la opción, al instante; lo que falta, «Sin dato» y por qué. */}
                {total ? (
                  <div className="opcion-del-editor__total" data-total-de-la-opcion>
                    <p>
                      <strong>
                        {/* Las iniciales a la vista; el lector de pantalla lee los nombres completos. */}
                        <span aria-hidden="true">{totalEnUnaLinea(total)}</span>
                        <span className="visualmente-oculto">{totalEnPalabras(total)}</span>
                      </strong>{' '}
                      <span className="nota">· {COPY_OPCIONES.estimacion}</span>
                    </p>
                    {faltan.length > 0 ? <p className="nota">{faltan.slice(0, 3).map(queFaltaEnPalabras).join('; ')}{faltan.length > 3 ? `; y ${faltan.length - 3} más` : ''}</p> : null}
                  </div>
                ) : null}
                <div className="opcion-del-editor__pie">
                  {opcion.recipeVersionId ? null : (
                    <>
                      <button type="button" className="boton boton--secundario" data-agregar-item aria-haspopup="dialog" onClick={() => alAgregarItem(k)}>
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
                    <button type="button" className="boton boton--enlace" data-duplicar-opcion onClick={() => alDuplicarOpcion(k)}>
                      {E.duplicarOpcion(k)}
                    </button>
                    <button
                      type="button"
                      className="boton boton--enlace"
                      onClick={() => alQuitarOpcion(k)}
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
  const [notaAbierta, setNotaAbierta] = useState(false);
  return (
    <>
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
    {/* TB-48: la nota del ítem, que la persona lee en la app junto al ingrediente. */}
    <tr className="item-del-editor__nota">
      <td colSpan={5}>
        <TextoAPedido
          id={`${id}-nota`}
          rotulo={COPY_NOTA_DEL_ITEM.rotulo}
          queEs={COPY_NOTA_DEL_ITEM.queEs(nombre)}
          valor={item.note ?? null}
          maximo={COPY_NOTA_DEL_ITEM.maximo}
          abierto={notaAbierta}
          alAbrir={() => setNotaAbierta(true)}
          alCambiar={(v) => onCambiar({ note: v })}
          alCerrar={() => setNotaAbierta(false)}
        />
      </td>
    </tr>
    </>
  );
}


/** ED-33: las dos clases de opción. */
export const COPY_OPCIONES = {
  deAlimentos: 'Opción de alimentos',
  deReceta: 'Opción de receta',
  en: (comida: string) => `en ${comida}`,
  tope: (n: number) => `Una comida lleva hasta ${n} opciones.`,
  estimacion: 'estimación del editor',
} as const;

/** TB-48: los textos de la nota de un ítem. La persona la lee en la app tal como se escribe. */
export const COPY_NOTA_DEL_ITEM = { rotulo: 'Nota para la persona', queEs: (nombre: string): string => `una nota sobre ${nombre}`, maximo: 300 } as const;

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
