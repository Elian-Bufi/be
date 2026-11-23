'use client';

/**
 * Una comida de la versión en preparación (WP-ESCRITORIO-AREAS, parte 7; maqueta 17): plegada, un renglón con su nombre,
 * cuántas opciones tiene y lo que adentro pide atención; abierta, sus opciones, cada una en su renglón, y los ítems de la
 * opción abierta en una tabla. Es otra composición de lo que el editor ya hacía: no agrega ni quita ninguna operación.
 * - **Plegar no esconde lo que falta:** una comida sin nombre, una cantidad que no se entiende o un problema de «Validar»
 *   se dicen en el renglón plegado.
 * - **Las opciones no son equivalencias** (B05): todas pesan lo mismo. Una opción que nació de una receta va en lectura
 *   (DL-119).
 * - **Cada campo de la tabla dice de qué alimento es** en su nombre accesible; el título de la columna lo dice a la vista.
 * - **El nombre se cambia a pedido** («Cambiar el nombre»): el campo aparece en el lugar, con el foco adentro, y Enter o
 *   salir de él lo cierra (`components/campo-de-nombre.tsx`). Lo que se acaba de agregar nace con el campo abierto.
 * - **La nota de cada ítem** (WP-TABLERO-ALTA-GAMA TB-48): estaba en el contrato y la persona la lee en la app junto al
 *   ingrediente, pero el editor no la dejaba escribir. Va en un renglón debajo del ítem, a pedido («Agregar una nota
 *   sobre …», `components/texto-a-pedido.tsx`), hasta 300 caracteres. No cambia lo que lee la app: el campo ya
 *   existía.
 * - **ED-31 y ED-33 (WP-EDITORES-PROFESIONAL):** la opción dice su total al instante («703 kcal · P 45 g · …»), como
 *   estimación del editor, y lo que falta dice «Sin dato» y qué lo impide; «+ Opción de alimentos» y «+ Opción de
 *   receta» van por separado (una opción es de alimentos o de receta, nunca las dos); quitar una opción con contenido
 *   lo decide el editor, que pregunta con lo que se va.
 * - **Duplicar y reordenar** (TB-48): «Duplicar comida» en «Más», «Subir» y «Bajar» al lado, y «Duplicar opción N» junto
 *   a cambiar su nombre. La copia va justo después y nace con su nombre a la vista (`advisees/editar-la-estructura.ts`).
 *
 * **WP-NUTRICION-PLANIFICACION (primer tramo).** Los números, donde se decide (la lógica, en `planificacion.ts`):
 * - **NUP-01:** cada alimento dice lo que aporta con su cantidad, debajo de su nombre, y cambia mientras se escriben los
 *   gramos; al pasar el mouse por esa línea, o con el foco en su cantidad, su composición cada 100 g y de dónde sale.
 * - **NUP-02:** la comida plegada dice, además de cuántas opciones tiene, lo que aporta de la que menos a la que más y su
 *   rango indicado, si lo tiene.
 * - **NUP-03 (NUP-D04):** cada opción es un renglón plegable con su nombre y sus números; desplegada, la tabla y las
 *   acciones de siempre. Una abierta por comida, o ninguna.
 * - **NUP-05:** el rango de la comida se ve y se indica acá mismo.
 * - **RP-20 (WP-RECORRIDO-PLAN-PULIDO, DL-188), en lugar de las líneas de NUP-04:** debajo del encabezado, plegada o
 *   abierta, una franja por kcal, P, C y G con cada opción frente al rango indicado de la comida; adentro de la opción
 *   abierta, la misma franja con esa opción sola, que se mueve con cada tecla de una cantidad. El día frente a su rango
 *   pasó al panel «Rangos y totales» (RP-21).
 * - **NUP-12:** la comida vacía dice por dónde empezar: una comida habitual, copiar de otra comida, una receta o alimentos.
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
  COPY_NOTAS_PROPIAS,
  COPY_ALIMENTOS,
  equivalenciaEnPalabras,
} from '@be/domain';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { EnPartes } from '../../../../components/en-partes';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { Pista } from '../../../../components/pista';
import { TextoAPedido } from '../../../../components/texto-a-pedido';
import { numeroEnCampo } from '../../../../lib/formato';
import { conNumero, conUnidad, iconoDeLaFila, numeroDelCampo, opcionesDeUnidad, useDatosDelAlimento, valorDeLaUnidad } from './alimentos-del-catalogo';
import { COPY_DE_LOS_EDITORES as E } from '../editar-la-estructura';
import { COPY_DE_OTRA_COMIDA, MAXIMO_DE_OPCIONES } from './opcion-de-otra-comida';
import { COPY_VERSION_NUEVA } from './version-nueva-de-la-receta';
import { aporteDelItem, aporteEnPalabras, aporteEnUnaLinea, cifrasDeLoQueAporta, comidaVacia, composicionEnLaPista, COPY_PLANIFICACION as CP, loQueAportaLaComida, loQueAportaLaComidaEnPalabras, numerosDeLaOpcion, type LineaFrenteAlRango } from './planificacion';
import { colorDeLaOpcion, COPY_FRANJAS, enLasBarrasEnPalabras, franjasDeLaComida, NOMBRE_DEL_COLOR } from './franjas-por-comida';
import { FranjasDeLaComida, FranjasQueSeLeen } from './franjas-de-la-comida';
import { cifrasDelTotal, COPY_RANGOS, faltantesDeLaOpcion, queFaltaEnPalabras, totalEnPalabras, type ComposicionConocida, type RangoPorNutriente, type TotalDeLaOpcion } from './rangos';
import { rangoEnPalabras } from './rangos-indicados';
import { NutrientesConIconos, RangoIndicadoConIconos } from './cantidad-del-macro';
import { RangoEnUnRenglon, type RangoParaIndicar } from './suma-de-los-rangos';
import { NotasAlLado, useNotasPropias } from '../notas-propias';
import { COPY_OPCION_COMO_RECETA } from './opcion-como-receta';

export type Estructura = EstructuraDePlanEntrada['dayTypes'];
export type ComidaEnEdicion = Estructura[number]['meals'][number];
export type OpcionEnEdicion = ComidaEnEdicion['options'][number];
export type ItemEnEdicion = OpcionEnEdicion['items'][number];
type ItemsGuardados = VersionDePlan['dayTypes'][number]['meals'][number]['options'][number]['items'];
type Preparacion = 'RAW' | 'COOKED' | 'AS_PURCHASED';
type Unidad = 'g' | 'ml' | 'unit';

/** Qué nombre se está cambiando dentro de una comida: el de la comida o el de una de sus opciones. */
export type NombreEnEdicion = { readonly de: 'comida' } | { readonly de: 'opcion'; readonly opcion: number } | null;

/** NUP-05: el rango indicado de la comida, y cómo se indica o se cambia desde acá. */
export interface RangoDeLaComida extends RangoParaIndicar {
  /** RP-D47: los rangos todavía se están leyendo y la comida ya se guardó: la franja guarda su lugar. */
  readonly leyendo?: boolean;
}

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
  imagenDeLaOpcion,
  alGuardarComoReceta,
  composiciones,
  origenes,
  rangoDeOpciones,
  rango,
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
  enLasBarras,
  sePuedeMostrarEnLasBarras,
  alAlternarEnLasBarras,
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
  /** La opción abierta; `-1`: ninguna (NUP-D04). */
  opcionElegida: number;
  nombreEnEdicion: NombreEnEdicion;
  nombres: Readonly<Record<string, string>>;
  recetas: Readonly<Record<string, RecetaDeOpcion>>;
  /** RP-24 (RP-D92): la miniatura de una opción de receta, en su cabecera, y en el cuerpo cargar o cambiar la imagen. */
  imagenDeLaOpcion?: (recipeVersionId: string, donde: 'cabecera' | 'cuerpo') => ReactNode;
  /**
   * RP-25: guardar la opción de alimentos `k` como receta, desde «Guardar como receta» (en la opción abierta) o desde
   * «Agregar foto» (en su cabecera, donde una receta muestra su miniatura).
   */
  alGuardarComoReceta?: (k: number, origen: 'foto' | 'receta') => void;
  /** NUP-01: la composición de cada alimento y de dónde sale, por su identidad en el catálogo. */
  composiciones: ReadonlyMap<string, ComposicionConocida>;
  origenes: ReadonlyMap<string, string>;
  /** NUP-02: lo que aporta la comida, de la opción que menos a la que más; `null` si no se calculó. */
  rangoDeOpciones: RangoPorNutriente | null;
  /** NUP-05: el rango indicado de esta comida y cómo indicarlo. */
  rango: RangoDeLaComida;
  /** Con la versión que cita la opción: la porción guardada de otra versión no vale (después de «Usar la versión N»). */
  itemsDeLaReceta: (optionId: string | undefined, recipeVersionId: string) => ItemsGuardados | null;
  /** ED-32: si la receta de la opción `k` tiene una versión más nueva, su número y lo que cambia en una porción. */
  versionNueva: (
    k: number,
  ) => { readonly numero: number; readonly cambios: readonly string[]; readonly conLaPorcionDeAhora: boolean; readonly nutrientes: readonly string[]; readonly conLaEstimacion: boolean } | null;
  alUsarLaVersionNueva: (k: number) => void;
  alAlternar: () => void;
  /** Abre la opción `k`; `-1` las pliega a todas. */
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
  /** RP-23: las opciones de esta comida (por la clave de su franja) que se muestran en las barras. */
  enLasBarras: ReadonlySet<string>;
  /** RP-23: si la opción `k` se puede tildar (ella, su comida y su día tipo, ya guardados). */
  sePuedeMostrarEnLasBarras: (k: number) => boolean;
  /** RP-23: tildar o destildar la opción `k`. */
  alAlternarEnLasBarras: (k: number) => void;
}) {
  const propio = useId();
  // PG-16 (DL-173): «Anotar sobre esta comida», si el editor tiene las notas propias.
  const notasPropias = useNotasPropias();
  const plegada = comidaPlegadaDelEditor(comida, posicion, problemas);
  const k = opcionElegida >= 0 && opcionElegida < comida.options.length ? opcionElegida : -1;
  const opcion = k >= 0 ? comida.options[k] : undefined;
  const conRecetas = comida.options.some((o) => o.recipeVersionId);
  const cambiandoElNombre = nombreEnEdicion?.de === 'comida';
  const cambiandoElDeLaOpcion = nombreEnEdicion?.de === 'opcion' && nombreEnEdicion.opcion === k;
  const total = opcion ? totalDeLaOpcion(k) : null;
  const nueva = opcion?.recipeVersionId ? versionNueva(k) : null;
  const faltan = total ? faltantesDeLaOpcion(total) : [];
  // NUP-02: lo que aporta la comida y su rango indicado, también plegada.
  const aporta = rangoDeOpciones ? loQueAportaLaComida(rangoDeOpciones, comida.options.length) : null;
  const aportaEnPalabras = rangoDeOpciones ? loQueAportaLaComidaEnPalabras(rangoDeOpciones, comida.options.length) : null;
  const conAlgo = !!opcion && (opcion.items.length > 0 || !!opcion.recipeVersionId);
  // RP-20: cada opción frente al rango indicado de la comida, una franja por kcal, P, C y G, también plegada. Sale de lo
  // que está en pantalla (cada tecla de una cantidad la mueve); una opción de receta, con la porción de su versión guardada.
  // RP-23: cada opción con su lugar (de ahí su color); la franja de la comida, con el promedio y solo las tildadas.
  const paraLaFranja = comida.options.map((o, n) => ({ clave: o.optionId ?? `nueva-${n}`, nombre: pestanaDeLaOpcion(o, n), total: totalDeLaOpcion(n), lugar: n }));
  const franjas = franjasDeLaComida(rango.indicado, paraLaFranja);
  // RP-20 (B): la opción abierta sola frente al rango de su comida, en vivo. Reemplaza las líneas de NUP-04.
  const franjasDeLaOpcion = opcion && conAlgo ? franjasDeLaComida(rango.indicado, [paraLaFranja[k]!]) : null;
  /** RP-23: la casilla de la opción `n`, con su punto de color, si la comida tiene franja. */
  const conCasillas = !!franjas;
  const vacia = comidaVacia(comida);
  /** NUP-12: «alimentos» abre la primera opción vacía en su cuadro; sin opciones, nace la 1 y se abre. */
  const empezarConAlimentos = () => {
    if (comida.options.length === 0) {
      alCambiar((m) => void m.options.push({ label: 'Opción 1', items: [] }));
      alElegirOpcion(0);
    }
    alAgregarItem(Math.max(0, comida.options.findIndex((o) => o.items.length === 0 && !o.recipeVersionId)));
  };
  return (
    <section className="comida-del-plan comida-del-editor" data-comida={posicion + 1} data-recorrido="comida" data-abierta={abierta ? '' : undefined}>
      <div className="comida-del-editor__cabecera">
        <h3 className="comida-del-plan__titulo">
          <button type="button" id={`abrir-comida-${id}`} className="comida-del-plan__boton" aria-expanded={abierta} aria-controls={`${propio}-cuerpo`} onClick={alAlternar}>
            <Icono nombre="comida" tamano={20} />
            <span className="comida-del-plan__textos">
              <span className="comida-del-plan__nombre">{plegada.titulo}</span>
              <span className="comida-del-plan__cuenta" data-resumen>
                <EnPartes texto={plegada.opciones} />
              </span>
              {/* NUP-02: de la opción que menos aporta a la que más; las iniciales a la vista, los nombres para el lector. */}
              {aporta ? (
                <span className="comida-del-editor__aporta" data-aporta-la-comida>
                  {/* RP-07 (DL-188): cada cantidad con el ícono de su macro. */}
                  <span aria-hidden="true">
                    <NutrientesConIconos cifras={cifrasDeLoQueAporta(rangoDeOpciones!, comida.options.length)!} sinDato={COPY_RANGOS.sinDato} />
                  </span>
                  <span className="visualmente-oculto">{aportaEnPalabras}</span>
                </span>
              ) : null}
              {/* Con la franja debajo (RP-20), el rango ya está en cada renglón: el encabezado no lo repite. */}
              {rango.indicado && !franjas ? (
                <span className="comida-del-editor__indicado" data-rango-indicado-de-la-comida>
                  <span aria-hidden="true">
                    {CP.indicado}: <RangoIndicadoConIconos rango={rango.indicado} />
                  </span>
                  <span className="visualmente-oculto">Rango indicado: {rangoEnPalabras(rango.indicado)}</span>
                </span>
              ) : null}
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
                ...(notasPropias
                  ? [{ clave: 'anotar', texto: COPY_NOTAS_PROPIAS.anotarSobreLaComida, alElegir: () => notasPropias.anotar({ tipo: 'MEAL', nombre: comida.label.trim() }), noSePuede: comida.label.trim() === '' ? 'Ponele un nombre a la comida para anotar sobre ella.' : null }]
                  : []),
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
      {/* RP-20: las opciones frente al rango de la comida, plegada o abierta. Sin rango no se dibuja (el renglón para
          indicarlo va adentro); mientras se leen los rangos, guarda su lugar (RP-D47). */}
      {franjas ? (
        <div className="comida-del-editor__franjas" data-franjas-de-la-comida data-rango-indicado-de-la-comida>
          <FranjasDeLaComida franjas={franjas} comida={plegada.titulo} elegidas={enLasBarras} enLasBarras={enLasBarrasEnPalabras(paraLaFranja, enLasBarras)} />
        </div>
      ) : rango.leyendo ? (
        <div className="comida-del-editor__franjas" data-franjas-de-la-comida data-leyendo-el-rango>
          <FranjasQueSeLeen />
        </div>
      ) : null}
      {/* PG-16: las notas propias atadas a esta comida (por su nombre), a la vista aunque esté plegada. */}
      <NotasAlLado comida={comida.label} />
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
            {/* NUP-05: el rango de la comida se ve y se indica mientras se arma, no recién en «Revisar». */}
            <RangoEnUnRenglon de={plegada.titulo} rango={rango} soloElBoton />
            {/* NUP-12: la comida vacía dice por dónde empezar, con lo que ya existía, antes que nada. */}
            {vacia ? (
              <p className="comida-del-editor__empeza" data-empeza-con>
                <span>{CP.empezaCon}</span>
                <AccionDeInicio texto={CP.unaHabitual} noSePuede={noSePuedeUsarHabitual} alTocar={alUsarHabitual} comida={plegada.titulo} />
                <span aria-hidden="true">·</span>
                <AccionDeInicio texto={CP.copiarDeOtra} noSePuede={noSePuedeCopiar} alTocar={alCopiarDesdeOtra} comida={plegada.titulo} />
                <span aria-hidden="true">·</span>
                <AccionDeInicio texto={CP.unaReceta} noSePuede={null} alTocar={alAgregarReceta} comida={plegada.titulo} />
                <span aria-hidden="true">·</span>
                <AccionDeInicio texto={CP.alimentos} noSePuede={null} alTocar={empezarConAlimentos} comida={plegada.titulo} />
              </p>
            ) : null}
            <div className="comida-del-editor__opciones">
              {comida.options.length > 0 ? (
                <ul className="opciones-plegables" aria-label={`Opciones de ${plegada.titulo}`}>
                  {comida.options.map((o, n) => {
                    const abiertaLaOpcion = n === k;
                    const totalDeEsta = totalDeLaOpcion(n);
                    const numeros = totalDeEsta ? numerosDeLaOpcion(totalDeEsta) : null;
                    return (
                      <li key={o.optionId ?? `nueva-${n}`} className="opcion-plegable" data-opcion-plegable={n + 1} data-abierta={abiertaLaOpcion ? '' : undefined} data-receta={o.recipeVersionId ? '' : undefined}>
                        {/* RP-23: la casilla y el punto de color, en el renglón de la cabecera (no la agrandan). */}
                        <div className="opcion-plegable__fila">
                          {conCasillas ? <CasillaEnLasBarras lugar={n} tildada={enLasBarras.has(paraLaFranja[n]!.clave)} sinGuardar={!sePuedeMostrarEnLasBarras(n)} alAlternar={() => alAlternarEnLasBarras(n)} /> : null}
                          <h4 className="opcion-plegable__titulo">
                            <button
                              type="button"
                              id={`pestana-${id}-${n}`}
                              className="opcion-plegable__boton"
                              aria-expanded={abiertaLaOpcion}
                              aria-controls={`${propio}-opcion-${n}`}
                              onClick={() => alElegirOpcion(abiertaLaOpcion ? -1 : n)}
                            >
                              {o.recipeVersionId ? (imagenDeLaOpcion?.(o.recipeVersionId, 'cabecera') ?? <Icono nombre="receta" tamano={18} />) : <Icono nombre="alimento" tamano={18} />}
                              <span className="opcion-plegable__nombre">{pestanaDeLaOpcion(o, n)}</span>
                              {numeros ? (
                                <span className="opcion-plegable__numeros" data-numeros-de-la-opcion>
                                  <span aria-hidden="true">
                                    <EnPartes texto={numeros.linea} />
                                  </span>
                                  <span className="visualmente-oculto">{numeros.palabras}</span>
                                </span>
                              ) : null}
                              <Icono nombre={abiertaLaOpcion ? 'arriba' : 'abajo'} tamano={18} />
                            </button>
                          </h4>
                          {/* RP-25: una opción de alimentos no tiene foto; la foto es de una receta. Al lado de la cabecera
                              (no adentro: un botón no va dentro de otro), un acceso discreto que la guarda como receta. */}
                          {alGuardarComoReceta && !o.recipeVersionId && o.items.length > 0 ? (
                            <button
                              type="button"
                              className="boton boton--discreto boton--compacto opcion-plegable__foto"
                              data-agregar-foto-a-la-opcion={n + 1}
                              aria-label={COPY_OPCION_COMO_RECETA.agregarFotoA(pestanaDeLaOpcion(o, n))}
                              title={COPY_OPCION_COMO_RECETA.agregarFotoA(pestanaDeLaOpcion(o, n))}
                              onClick={() => alGuardarComoReceta(n, 'foto')}
                            >
                              <Icono nombre="imagen" tamano={18} />
                              {COPY_OPCION_COMO_RECETA.agregarFoto}
                            </button>
                          ) : null}
                        </div>
                        <div id={`${propio}-opcion-${n}`} className="opcion-plegable__cuerpo" hidden={!abiertaLaOpcion}>
                          {abiertaLaOpcion && opcion ? (
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
                                  {/* RP-24 (RP-D92): la imagen de la receta, acá mismo: cargarla o cambiarla la cambia en Mis recetas. */}
                                  {imagenDeLaOpcion ? <div className="opcion-del-editor__imagen" data-imagen-de-la-opcion>{imagenDeLaOpcion(opcion.recipeVersionId, 'cuerpo')}</div> : null}
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
                                      {/* API-PLN-01 (§8.7): la porción de ahora la estima el servidor; la nueva, el cálculo guardado de la receta. */}
                                      {nueva.nutrientes.length > 0 ? (
                                        <>
                                          <p className="nota">{nueva.conLaEstimacion ? COPY_VERSION_NUEVA.nutrientesDeLaPorcion : COPY_VERSION_NUEVA.nutrientesDeLaNueva}:</p>
                                          <ul className="lista-compacta" data-nutrientes-de-la-porcion>
                                            {nueva.nutrientes.map((c) => (
                                              <li key={c}>{c}</li>
                                            ))}
                                          </ul>
                                        </>
                                      ) : null}
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
                                          composicion={composiciones.get(it.catalogItemId)}
                                          origen={origenes.get(it.catalogItemId) ?? null}
                                          onCambiar={(cambio) => alCambiar((m) => void (m.options[k]!.items[l] = { ...it, ...cambio }))}
                                          onQuitar={() => alCambiar((m) => void m.options[k]!.items.splice(l, 1))}
                                        />
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {/* ED-31: el total de la opción, al instante; lo que falta, «Sin dato» y por qué. */}
                              {total && conAlgo ? (
                                <div className="opcion-del-editor__total" data-total-de-la-opcion>
                                  <p>
                                    <strong>
                                      {/* Las iniciales a la vista; el lector de pantalla lee los nombres completos. */}
                                      <span aria-hidden="true">
                                        <NutrientesConIconos cifras={cifrasDelTotal(total)} sinDato={COPY_RANGOS.sinDato} />
                                      </span>
                                      <span className="visualmente-oculto">{totalEnPalabras(total)}</span>
                                    </strong>{' '}
                                    <span className="nota">· {COPY_OPCIONES.estimacion}</span>
                                  </p>
                                  {faltan.length > 0 ? <p className="nota">{faltan.slice(0, 3).map(queFaltaEnPalabras).join('; ')}{faltan.length > 3 ? `; y ${faltan.length - 3} más` : ''}</p> : null}
                                </div>
                              ) : null}
                              {/* RP-20 (B): la opción frente al rango de su comida, en franjas que se mueven con cada tecla.
                                  Reemplaza las líneas de NUP-04. Ubica, no califica: sin rojo ni verde, y no bloquea. */}
                              {franjasDeLaOpcion ? (
                                <div className="opcion-del-editor__franjas" data-franjas-de-la-opcion>
                                  <p className="opcion-del-editor__franjas-titulo">
                                    <Icono nombre="rango" tamano={18} />
                                    {COPY_FRANJAS.tituloDeLaOpcion}
                                    <span className="nota"> · {COPY_FRANJAS.ubicaNoCalifica}</span>
                                  </p>
                                  <FranjasDeLaComida franjas={franjasDeLaOpcion} comida={plegada.titulo} variante="opcion" />
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
                                  <button type="button" className="boton boton--discreto" onClick={() => alEditarNombre({ de: 'opcion', opcion: k })}>
                                    Cambiar el nombre
                                  </button>
                                  {/* RP-25: la opción de alimentos, en Mis recetas; después puede tener foto. */}
                                  {alGuardarComoReceta && !opcion.recipeVersionId && opcion.items.length > 0 ? (
                                    <button type="button" className="boton boton--discreto" data-guardar-como-receta={k + 1} aria-haspopup="dialog" onClick={() => alGuardarComoReceta(k, 'receta')}>
                                      {COPY_OPCION_COMO_RECETA.guardarComoReceta}
                                    </button>
                                  ) : null}
                                  <button type="button" className="boton boton--discreto" data-duplicar-opcion onClick={() => alDuplicarOpcion(k)}>
                                    {E.duplicarOpcion(k)}
                                  </button>
                                  <button
                                    type="button"
                                    className="boton boton--discreto"
                                    onClick={() => alQuitarOpcion(k)}
                                  >
                                    Quitar opción {k + 1}
                                  </button>
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
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
                <button type="button" className="boton boton--quieto boton--compacto" data-opcion-de-receta data-recorrido="opcion-de-receta" disabled={comida.options.length >= MAXIMO_DE_OPCIONES} onClick={alAgregarReceta}>
                  <Icono nombre="receta" tamano={18} />
                  {COPY_OPCIONES.deReceta}
                  <span className="visualmente-oculto"> {COPY_OPCIONES.en(plegada.titulo)}</span>
                </button>
                {comida.options.length >= MAXIMO_DE_OPCIONES ? <span className="nota">{COPY_OPCIONES.tope(MAXIMO_DE_OPCIONES)}</span> : null}
              </span>
            </div>
            {conRecetas ? <p className="nota">{COPY_RECETAS.avisoDeOpciones}</p> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * RP-23 (RP-D82, RP-D83): la casilla de una opción y su punto de color, junto a su cabecera. Tildada, el punto de la opción
 * aparece en las barras de la comida y del panel, en ese color. La etiqueta la oye el lector («Mostrar la opción 2 en las
 * barras de la comida»); a la vista, la casilla y el punto, que dice su color al pasar el puntero.
 */
function CasillaEnLasBarras({ lugar, tildada, sinGuardar, alAlternar }: { lugar: number; tildada: boolean; sinGuardar: boolean; alAlternar: () => void }) {
  const color = colorDeLaOpcion(lugar);
  const nombreDelColor = NOMBRE_DEL_COLOR[color]!;
  // Sin guardar, apagada y diciendo por qué: su lugar y su identidad todavía cambian (ver `opciones-en-las-barras.ts`).
  return (
    <label className="en-las-barras" data-en-las-barras={lugar + 1} data-sin-guardar={sinGuardar ? '' : undefined} title={sinGuardar ? COPY_FRANJAS.alGuardarseSePuedeMostrar : COPY_FRANJAS.suPunto(lugar + 1, nombreDelColor)}>
      <input type="checkbox" checked={tildada && !sinGuardar} disabled={sinGuardar} onChange={alAlternar} />
      <span className="en-las-barras__punto" data-color-de-la-opcion={color} aria-hidden="true" />
      <span className="visualmente-oculto">
        {COPY_FRANJAS.mostrarEnLasBarras(lugar + 1, nombreDelColor)}
        {sinGuardar ? ` ${COPY_FRANJAS.alGuardarseSePuedeMostrar}` : ''}
      </span>
    </label>
  );
}

/** NUP-12: una forma de empezar la comida vacía. Si no se puede, queda apagada y dice por qué (a la vista y al lector). */
function AccionDeInicio({ texto, noSePuede, alTocar, comida }: { texto: string; noSePuede: string | null; alTocar: () => void; comida: string }) {
  if (noSePuede) {
    return (
      <Pista texto={noSePuede}>
        <button type="button" className="boton boton--discreto" aria-disabled onClick={() => undefined}>
          {texto}
          <span className="visualmente-oculto"> en {comida}</span>
        </button>
      </Pista>
    );
  }
  return (
    <button type="button" className="boton boton--discreto" aria-haspopup="dialog" onClick={alTocar}>
      {texto}
      <span className="visualmente-oculto"> en {comida}</span>
    </button>
  );
}

/**
 * NUP-04: la opción frente al rango de su comida y el día frente al suyo, una línea por macro. Neutro: sin color de
 * juicio; lo que queda afuera lleva un ícono que ubica (no una alarma) y el lector lo oye en el texto. Una opción todavía
 * sin alimentos (`sinAlimentos`, en el cuadro de la opción) no tiene nada que ubicar: una sola indicación neutra en vez de
 * una línea «sin dato» por macro.
 */
export function FrenteALosRangos({ lineas, sinAlimentos = false, titulo = CP.frenteAlRango }: { lineas: readonly LineaFrenteAlRango[]; sinAlimentos?: boolean; titulo?: string }) {
  return (
    <div className="frente-a-los-rangos" data-frente-a-los-rangos>
      <p className="frente-a-los-rangos__titulo">
        <Icono nombre="objetivo" tamano={18} />
        {titulo}
        {sinAlimentos ? null : <span className="nota"> · {CP.frenteAlRangoAyuda}</span>}
      </p>
      {sinAlimentos ? (
        <p className="nota" data-frente-sin-alimentos>
          {CP.frenteSinAlimentos}
        </p>
      ) : (
        <ul className="lista-compacta">
          {lineas.map((l) => (
            <li key={l.texto} data-afuera={l.afuera ? '' : undefined}>
              {l.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Un ítem, en su fila: el alimento y sus tres datos. El campo de la cantidad guarda el texto tal como se escribe y
 * propaga lo interpretado: si mostrara siempre el número interpretado, «72,» se borraría a mitad de camino y no se
 * podría escribir un decimal. Se resincroniza cuando el valor cambia desde afuera (al guardar, al quitar un ítem).
 *
 * NUP-01: debajo del nombre, lo que aporta con su cantidad, en vivo (la cantidad se propaga con cada tecla); la pista con
 * su composición cada 100 g aparece al pasar el mouse por esa línea y con el foco en la cantidad (que la lee como
 * descripción).
 */
export function FilaDeItem({
  id,
  item,
  nombre,
  composicion,
  origen = null,
  onCambiar,
  onQuitar,
}: {
  id: string;
  item: ItemEnEdicion;
  nombre: string;
  /** NUP-01: la composición del alimento, si se conoce (o «leyendo»). */
  composicion: ComposicionConocida | undefined;
  /** NUP-01: de dónde sale («USDA», «Demostración»…), si se sabe. */
  origen?: string | null;
  onCambiar: (c: Partial<ItemEnEdicion>) => void;
  onQuitar: () => void;
}) {
  // DL-180: el ícono de su grupo (NUA-05) y, si se retiró del catálogo, la marca discreta (NUA-02): se sigue viendo, no
  // se esconde; validar y activar piden cambiarlo.
  const datos = useDatosDelAlimento(item.catalogItemId);
  // NUA-08: un alimento que se compone cada 100 ml mide sus medidas en mililitros.
  const ml = typeof composicion === 'object' && composicion.referenceAmount === '100ml';
  const magnitud = item.quantity;
  // NUA-08: con una medida casera, el campo es cuántas; la cantidad del ítem sigue en gramos.
  const externo = numeroEnCampo(numeroDelCampo(item));
  const [escrito, setEscrito] = useState(externo);
  useEffect(() => {
    setEscrito((t) => (numeroEnCampo(leerNumero(t)) === externo ? t : externo));
  }, [externo]);
  // Lo que no es un número se señala en el campo, en vez de guardarse como cero en silencio (B10-10:164-165).
  const error = escrito.trim() !== '' && leerNumero(escrito) === null ? motivoDeNumeroIlegible(escrito) : null;
  const [notaAbierta, setNotaAbierta] = useState(false);
  const aporte = aporteDelItem({ catalogItemId: item.catalogItemId, quantity: magnitud, nombre }, composicion);
  const pista = composicionEnLaPista(composicion, origen);
  return (
    <>
    <tr className="item-del-editor" data-retirado={datos.retirado ? '' : undefined}>
      <th scope="row" className="item-del-editor__nombre">
        <span className="item-del-editor__grupo" data-grupo={datos.grupo ?? 'sin-grupo'}>
          <Icono nombre={iconoDeLaFila(datos)} tamano={20} />
        </span>
        {nombre}
        {datos.retirado ? (
          <span className="etiqueta-de-dato item-del-editor__retirado" data-marca-retirado>
            {COPY_ALIMENTOS.retirado}
            <span className="visualmente-oculto">. {COPY_ALIMENTOS.retiradoParaActivar}</span>
          </span>
        ) : null}
        {/* NUP-01: lo que aporta con su cantidad; la pista, al pasar el mouse. */}
        <Pista texto={pista}>
          <span className="item-del-editor__aporte" data-aporte-del-item>
            <span aria-hidden="true">
              <EnPartes texto={aporteEnUnaLinea(aporte)} />
            </span>
            <span className="visualmente-oculto">{aporteEnPalabras(aporte)}</span>
          </span>
        </Pista>
      </th>
      <td data-etiqueta="Cantidad" className={error ? 'campo--error' : undefined}>
        <Pista texto={pista}>
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
              onCambiar(conNumero(item, n ?? Number.NaN, ml));
            }}
          />
        </Pista>
        {error ? (
          <p id={`${id}-cantidad-error`} className="campo__error">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        ) : null}
      </td>
      <td data-etiqueta="Unidad">
        {/* NUA-08: las medidas caseras del alimento, con su equivalencia, junto a las unidades de siempre. Con medidas, se
            puede elegir una antes de escribir la cantidad: empieza con 1. */}
        <select id={`${id}-unidad`} aria-label={`Unidad de ${nombre}`} value={valorDeLaUnidad(item)} disabled={!magnitud && datos.medidas.length === 0} onChange={(e) => onCambiar(conUnidad(item, e.target.value, datos.medidas, ml))}>
          {opcionesDeUnidad(datos.medidas, ETIQUETA_DE_UNIDAD as Readonly<Record<Unidad, string>>, ml, item.householdMeasure).map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
        {item.householdMeasure && magnitud && Number.isFinite(magnitud.value) ? (
          <span className="nota item-del-editor__equivale" data-equivale-a>
            {COPY_ALIMENTOS.equivaleA(
              formatearCantidad(magnitud.value, magnitud.unit === 'ml' ? 'ml' : 'g'),
              equivalenciaEnPalabras({ kind: item.householdMeasure.kind, amount: item.householdMeasure.amountPerUnit }, magnitud.unit === 'ml' ? '100ml' : '100g'),
            )}
          </span>
        ) : null}
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
