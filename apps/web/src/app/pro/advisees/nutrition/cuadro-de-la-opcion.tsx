'use client';

/**
 * ED-31 (WP-EDITORES-PROFESIONAL; maqueta 06) · La opción en un cuadro: su nombre, sus alimentos en una tabla, el
 * buscador adentro y, al costado, el total al instante, lo que cubren las opciones de su comida y el objetivo general.
 * La lógica está en `opcion-en-un-cuadro.ts`; la cuenta, en `rangos.ts` (la del dominio, `SUM_SOURCE_PER_100G_V1`).
 *
 * - Lo abre «Agregar ítem» de una opción de alimentos. Trabaja sobre una copia: el
 *   borrador cambia solo con «Guardar la opción», que aplica la regla del plan (sin nombre o con una cantidad que no se
 *   entiende, dice por qué y lleva al campo).
 * - El buscador es un combobox con grilla (ARIA 1.2): el foco queda en el campo y la celda marcada se anuncia por
 *   `aria-activedescendant`. Enter suma el alimento marcado y el cuadro sigue abierto. Cada resultado lleva su estrella
 *   («Marcar como habitual», DL-109) en su propia celda: la flecha a la derecha llega a ella y Enter la alterna.
 * - «Crearlo a mano» e «Importarlo de Open Food Facts» reemplazan el contenido del cuadro, con «Volver a la opción»: no
 *   se abre un cuadro encima de otro (§2.3). Lo buscado se conserva, «Crearlo a mano» arranca con ese nombre, y al volver
 *   el foco vuelve al buscador y se anuncia lo agregado.
 * - **WP-NUTRICION-PLANIFICACION:** cada alimento dice lo que aporta con su cantidad y, en la pista, su composición cada
 *   100 g y de dónde sale (NUP-01); al costado, la opción como queda frente al rango indicado de su comida y el día frente
 *   al suyo, en vivo y sin calificar (NUP-04).
 * - **WP-NUTRICION-ALIMENTOS (DL-180):** cada resultado lleva el ícono de su grupo (NUA-05) y el nivel de su origen a la
 *   vista: «Verificado», «Tuyo» o «De otro profesional» (NUA-03). Lo de otro profesional va después y, al elegirlo, se
 *   mira primero: el aviso y su composición cada 100 g, con «Sumarlo» o «Volver a buscar». Un alimento con un equivalente
 *   verificado (NUA-04) lleva ese verificado justo antes, como sugerencia.
 */
import {
  cantidad as formatearCantidad,
  COPY_ALIMENTOS,
  COPY_HABITUALES,
  COPY_MIS_ALIMENTOS,
  habitualesQueCoinciden,
  iconoDelAlimento,
  origenEnElCatalogo,
  type ElementoDeCatalogo,
  type ElementoEncontrado,
  type EquivalenteVerificado,
  type Rango as RangoIndicado,
  type VersionDeObjetivo,
} from '@be/domain';
import { useContext, useEffect, useId, useRef, useState, type RefObject } from 'react';
import { avisoDeEquivalente, conSugeridos, ContextoDeLosAlimentos, datosDelAlimento, etiquetaDelNivel, type DatosDelAlimento } from './alimentos-del-catalogo';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Enlace } from '../../../../components/enlace';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { dia as fechaDelDia } from '../../../../lib/formato';
import { mensajeDeFallo } from '../../../../lib/intento';
import { TiraDelObjetivo } from '../seguimiento/tira-del-objetivo';
import { CrearManualmente } from './agregar-item';
import { FilaDeItem, type OpcionEnEdicion } from './comida-del-editor';
import type { AlimentosHabituales } from './habituales';
import { ImportacionDeOpenFoodFacts } from './importacion';
import { useNutricion } from './nutricion';
import {
  cambioLaOpcion,
  columnaTrasTecla,
  completitudEnPalabras,
  COPY_OPCION_EN_UN_CUADRO as C,
  esDeDemostracion,
  hayQueBuscar,
  itemNuevo,
  loQueNoDejaGuardarLaOpcion,
  marcadoTrasTecla,
  PAUSA_DEL_BUSCADOR,
  resultadosDelBuscador,
} from './opcion-en-un-cuadro';
import { useNumeroDelObjetivo } from './numero-del-objetivo';
import { COPY_VERSION_DEL_OBJETIVO } from './version-del-objetivo';
import { FrenteALosRangos } from './comida-del-editor';
import { COPY_PLANIFICACION, diaFrenteAlRango, origenBreve } from './planificacion';
import { COPY_FRANJAS, franjasDeLaComida } from './franjas-por-comida';
import { FranjasDeLaComida } from './franjas-de-la-comida';
import { COPY_RANGOS, faltantesDeLaOpcion, fibraDeLaOpcion, itemsParaElTotal, NUTRIENTES_DEL_RANGO, queFaltaEnPalabras, rangoDeLaComida, rangoDelDia, rangoEnUnaCelda, totalDeLaOpcion, type Composiciones, type RangoPorNutriente, type TotalDeLaOpcion } from './rangos';

type Busqueda =
  | { readonly tipo: 'quieta' }
  | { readonly tipo: 'buscando'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly texto: string; readonly alimentos: readonly ElementoEncontrado[] }
  | { readonly tipo: 'falla'; readonly texto: string; readonly motivo: string };

type Agregado = { readonly nombre: string; readonly veces: number } | null;

const NOMBRE_DEL_TOTAL = { energyKcal: 'Energía', carbohydrateG: 'Carbohidratos', proteinG: 'Proteínas', fatG: 'Grasas' } as const;
const UNIDAD_DEL_TOTAL = { energyKcal: 'kcal', carbohydrateG: 'g', proteinG: 'g', fatG: 'g' } as const;
/** Un valor cada 100 g del catálogo: lo que la fuente no trae dice «sin dato», nunca cero. */
const valorDe = (v: number | string | null | undefined, unidad: string): string => (v === null || v === undefined ? 'sin dato' : formatearCantidad(Number(v), unidad));

export function CuadroDeLaOpcion({
  abierto,
  titulo,
  subtitulo,
  opcion,
  comida,
  otrasOpciones,
  nombres,
  composiciones,
  origenes,
  rangoIndicadoDeLaComida,
  rangoIndicadoDelDia,
  otrasComidasDelDia,
  objetivo,
  habituales,
  alGuardar,
  onCerrar,
}: {
  abierto: boolean;
  /** «Almuerzo · opción 1». */
  titulo: string;
  /** «Día habitual · se elige una de 3 opciones». */
  subtitulo: string;
  /** La opción como está en el borrador al abrir (o la nueva, que todavía no está). */
  opcion: OpcionEnEdicion | null;
  /** El nombre de su comida. */
  comida: string;
  /** Las demás opciones de la comida, con su total, para lo que cubren todas con esta como queda. */
  otrasOpciones: readonly { readonly nombre: string; readonly total: TotalDeLaOpcion }[];
  nombres: Readonly<Record<string, string>>;
  composiciones: Composiciones;
  /** NUP-01: de dónde sale cada alimento, por su identidad. */
  origenes: ReadonlyMap<string, string>;
  /** NUP-04: el rango indicado de la comida y el del día, si hay. */
  rangoIndicadoDeLaComida: RangoIndicado | null;
  rangoIndicadoDelDia: RangoIndicado | null;
  /** NUP-04: lo que aportan las demás comidas del día (de la opción que menos a la que más), para ubicar el día. */
  otrasComidasDelDia: readonly RangoPorNutriente[];
  objetivo: VersionDeObjetivo | null;
  habituales: AlimentosHabituales;
  /** «Guardar la opción»: la copia, con los nombres, las composiciones y los orígenes de lo que se sumó. */
  alGuardar: (
    opcion: OpcionEnEdicion,
    nuevos: {
      readonly nombres: Readonly<Record<string, string>>;
      readonly composiciones: ReadonlyMap<string, ElementoDeCatalogo['composition']>;
      readonly origenes: ReadonlyMap<string, string>;
      /** NUA-05: el grupo de cada alimento sumado (su ícono). */
      readonly alimentos: ReadonlyMap<string, DatosDelAlimento>;
    },
  ) => void;
  onCerrar: () => void;
}) {
  const [copia, setCopia] = useState<OpcionEnEdicion | null>(opcion);
  const [modo, setModo] = useState<'opcion' | 'manual' | 'importar'>('opcion');
  const [nombresNuevos, setNombresNuevos] = useState<Record<string, string>>({});
  const [composicionesNuevas, setComposicionesNuevas] = useState<ReadonlyMap<string, ElementoDeCatalogo['composition']>>(() => new Map());
  const [origenesNuevos, setOrigenesNuevos] = useState<ReadonlyMap<string, string>>(() => new Map());
  // NUA-05: el grupo de lo que se suma, para el ícono de su fila (los demás vienen del editor).
  const alimentosDelEditor = useContext(ContextoDeLosAlimentos);
  const [alimentosNuevos, setAlimentosNuevos] = useState<ReadonlyMap<string, DatosDelAlimento>>(() => new Map());
  // Lo buscado y lo último agregado viven acá: sobreviven a «Crearlo a mano» y a «Importarlo…».
  const [texto, setTexto] = useState('');
  const [agregado, setAgregado] = useState<Agregado>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const numeroDelObjetivo = useNumeroDelObjetivo(abierto ? objetivo : null);
  // Cada vez que se abre, la copia vuelve a ser la opción del borrador.
  useEffect(() => {
    if (!abierto) return;
    setCopia(opcion ? structuredClone(opcion) : null);
    setModo('opcion');
    setNombresNuevos({});
    setComposicionesNuevas(new Map());
    setOrigenesNuevos(new Map());
    setAlimentosNuevos(new Map());
    setTexto('');
    setAgregado(null);
    // Solo al abrir: la opción del borrador no cambia con el cuadro abierto (es modal).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  // NUP-11 (NUP-D10): lo escrito en «Crearlo a mano» o en «Importarlo…» todavía no está en la opción. Cerrar (tocar afuera,
  // Escape o «Cerrar») primero pregunta, como con la opción cambiada; «Volver a la opción» lo deja atrás a propósito.
  const [escritoAparte, setEscritoAparte] = useState(false);
  useEffect(() => setEscritoAparte(false), [modo, abierto]);
  const anotarLoEscrito = () => setEscritoAparte(true);
  // Al volver de «Crearlo a mano» o de «Importarlo…», el foco vuelve al buscador (WCAG 2.4.3); al abrir lo pone el cuadro.
  const modoAnterior = useRef(modo);
  useEffect(() => {
    if (modo === 'opcion' && modoAnterior.current !== 'opcion') buscador.current?.focus();
    modoAnterior.current = modo;
  }, [modo]);

  const todosLosNombres = { ...nombres, ...nombresNuevos };
  const todasLasComposiciones: Composiciones = new Map([...composiciones, ...composicionesNuevas]);
  const todosLosOrigenes: ReadonlyMap<string, string> = new Map([...origenes, ...origenesNuevos]);
  const todosLosAlimentos: ReadonlyMap<string, DatosDelAlimento> = new Map([...alimentosDelEditor, ...alimentosNuevos]);
  const sumar = (e: ElementoDeCatalogo | ElementoEncontrado) => {
    setNombresNuevos((n) => ({ ...n, [e.catalogItemId]: e.name }));
    setAlimentosNuevos((m) => new Map(m).set(e.catalogItemId, datosDelAlimento('foodGroup' in e ? e : undefined)));
    setComposicionesNuevas((m) => new Map(m).set(e.catalogItemId, e.composition));
    setOrigenesNuevos((m) => new Map(m).set(e.catalogItemId, origenBreve(e)));
    setCopia((o) => (o ? { ...o, items: [...o.items, itemNuevo(e.catalogItemId)] } : o));
    setAgregado((a) => ({ nombre: e.name, veces: (a?.veces ?? 0) + 1 }));
  };
  /** Creado a mano o importado: se suma, se vuelve a la opción y lo buscado ya no hace falta. */
  const sumarDeAfuera = (e: ElementoDeCatalogo) => {
    sumar(e);
    setTexto('');
    setModo('opcion');
  };
  const cambiar = (f: (o: OpcionEnEdicion) => void) =>
    setCopia((o) => {
      if (!o) return o;
      const x = structuredClone(o);
      f(x);
      return x;
    });

  const items = copia ? itemsParaElTotal(copia, todosLosNombres, () => null) : null;
  const total = copia ? totalDeLaOpcion(items, todasLasComposiciones) : null;
  const fibra = copia ? fibraDeLaOpcion(items, todasLasComposiciones) : null;
  const faltan = total ? faltantesDeLaOpcion(total) : [];
  const rango = total ? rangoDeLaComida([...otrasOpciones, { nombre: copia?.label || titulo, total }], comida) : null;
  const sinNombre = copia !== null && copia.label.trim() === '';
  const impide = copia ? loQueNoDejaGuardarLaOpcion(copia, todosLosNombres) : null;
  // Una opción nueva todavía vacía no tiene nada que ubicar: una sola indicación, no una línea «sin dato» por macro.
  const sinAlimentos = copia !== null && copia.items.length === 0 && !copia.recipeVersionId;
  // RP-20 (B): la opción como queda frente al rango de su comida, en franjas que se mueven con cada tecla. El día (con esta
  // opción en su comida) frente al suyo sigue en líneas (NUP-04): el cuadro tapa el panel «Rangos y totales».
  const franjas = total ? franjasDeLaComida(rangoIndicadoDeLaComida, [{ clave: 'cuadro', nombre: copia?.label.trim() || titulo, total }]) : null;
  const frenteDelDia = total && rango && !sinAlimentos ? diaFrenteAlRango(rangoDelDia([...otrasComidasDelDia, rango], ''), rangoIndicadoDelDia) : [];

  return (
    <CuadroEnfocado
      abierto={abierto && copia !== null}
      forma="dialogo"
      ancho
      titulo={titulo}
      sobretitulo={subtitulo}
      conCambios={Boolean(opcion && copia && cambioLaOpcion(opcion, copia)) || (modo !== 'opcion' && escritoAparte)}
      focoInicial={buscador}
      className="cuadro-de-la-opcion"
      principal={
        modo === 'opcion'
          ? {
              texto: C.guardar,
              apagado: impide?.motivo ?? null,
              // Apagado, lleva al campo que lo impide: el nombre o la cantidad que no se entiende.
              alTocarApagado: () => document.getElementById(impide && impide.fila !== null ? `cuadro-item-${impide.fila}-cantidad` : 'opcion-en-un-cuadro-nombre')?.focus(),
              alTocar: () => copia && alGuardar(copia, { nombres: nombresNuevos, composiciones: composicionesNuevas, origenes: origenesNuevos, alimentos: alimentosNuevos }),
            }
          : null
      }
      onCerrar={onCerrar}
    >
      {copia && modo === 'manual' ? (
        <CrearManualmente id="opcion-crear-a-mano" nombreInicial={texto.trim()} onCreado={sumarDeAfuera} onVolver={() => setModo('opcion')} alEscribir={anotarLoEscrito} />
      ) : null}
      {copia && modo === 'importar' ? (
        <div className="agregar-item__otro" onInput={anotarLoEscrito}>
          <button type="button" className="boton boton--enlace agregar-item__volver" onClick={() => setModo('opcion')}>
            <Icono nombre="izquierda" tamano={18} />
            {C.volver}
          </button>
          <ImportacionDeOpenFoodFacts id="opcion-importar" onIncorporado={sumarDeAfuera} onCargarManualmente={() => setModo('manual')} />
        </div>
      ) : null}
      {copia && modo === 'opcion' ? (
        <div className="cuadro-de-la-opcion__cuerpo">
          <div className="cuadro-de-la-opcion__principal">
            <div className={`campo cuadro-de-la-opcion__nombre${sinNombre ? ' campo--error' : ''}`}>
              <label htmlFor="opcion-en-un-cuadro-nombre">{C.nombre}</label>
              <input id="opcion-en-un-cuadro-nombre" value={copia.label} maxLength={120} autoComplete="off" aria-invalid={sinNombre || undefined} onChange={(e) => cambiar((o) => void (o.label = e.target.value))} />
            </div>
            {copia.items.length === 0 ? (
              <p className="nota">{C.sinItems}</p>
            ) : (
              <div className="desplazable-x">
                <ContextoDeLosAlimentos.Provider value={todosLosAlimentos}>
                <table className="tabla items-del-editor">
                  <caption className="visualmente-oculto">Los alimentos de {titulo}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Alimento</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Unidad</th>
                      <th scope="col">Estado de preparación</th>
                      <th scope="col">
                        <span className="visualmente-oculto">Quitar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {copia.items.map((it, l) => (
                      <FilaDeItem
                        key={it.itemId ?? `nuevo-${l}-${it.catalogItemId}`}
                        id={`cuadro-item-${l}`}
                        item={it}
                        nombre={todosLosNombres[it.catalogItemId] ?? 'Elemento'}
                        composicion={todasLasComposiciones.get(it.catalogItemId)}
                        origen={todosLosOrigenes.get(it.catalogItemId) ?? null}
                        onCambiar={(c) => cambiar((o) => void (o.items[l] = { ...o.items[l]!, ...c }))}
                        onQuitar={() => cambiar((o) => void o.items.splice(l, 1))}
                      />
                    ))}
                  </tbody>
                </table>
                </ContextoDeLosAlimentos.Provider>
              </div>
            )}
            <BuscadorDeLaOpcion campo={buscador} texto={texto} alEscribir={setTexto} agregado={agregado} habituales={habituales} alSumar={sumar} />
            <p className="nota cuadro-de-la-opcion__otro">
              {C.noEsta}{' '}
              <button type="button" className="boton boton--enlace" onClick={() => setModo('manual')}>
                {C.crearAMano}
              </button>{' '}
              ·{' '}
              <button type="button" className="boton boton--enlace" onClick={() => setModo('importar')}>
                {C.importar}
              </button>
            </p>
            {/* DL-180 (NUA-01): un alimento propio con un error se corrige en «Mis alimentos», sin dejar el plan. */}
            <p className="nota">
              {COPY_MIS_ALIMENTOS.enElCuadro}{' '}
              <Enlace href="/pro/foods" target="_blank" rel="noopener" data-ir-a-mis-alimentos>
                {COPY_MIS_ALIMENTOS.enOtraPestana}
              </Enlace>
            </p>
          </div>
          <aside className="cuadro-de-la-opcion__costado" aria-label="Totales de la opción">
            {total ? (
              <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-al-instante" data-total-de-la-opcion>
                <h3 id="opcion-al-instante">{C.alInstante}</h3>
                <dl className="cuadro-de-la-opcion__totales">
                  {NUTRIENTES_DEL_RANGO.map((n) => (
                    <div key={n}>
                      <dt>{NOMBRE_DEL_TOTAL[n]}</dt>
                      <dd>{total[n].exacto === null ? COPY_RANGOS.sinDato : `${formatearCantidad(Number(total[n].exacto), UNIDAD_DEL_TOTAL[n])}`}</dd>
                    </div>
                  ))}
                  {/* La fibra, como en la maqueta 06: lo que falta es «Sin dato», nunca cero. */}
                  <div data-fibra-de-la-opcion>
                    <dt>{C.fibra}</dt>
                    <dd>{fibra === null || fibra.exacto === null ? COPY_RANGOS.sinDato : formatearCantidad(Number(fibra.exacto), 'g')}</dd>
                  </div>
                </dl>
                {faltan.length > 0 ? <p className="nota">{faltan.slice(0, 3).map(queFaltaEnPalabras).join('; ')}{faltan.length > 3 ? `; y ${faltan.length - 3} más` : ''}</p> : null}
                <p className="nota">{C.comoSeCalcula}</p>
              </section>
            ) : null}
            {rango ? (
              <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-rango-de-la-comida">
                <h3 id="opcion-rango-de-la-comida">{C.rangoDe(comida)}</h3>
                <p>{NUTRIENTES_DEL_RANGO.map((n) => `${COPY_RANGOS.nutriente[n]}: ${rangoEnUnaCelda(rango[n], n)}`).join(' · ')}</p>
                <p className="nota">{C.conEstaOpcion}</p>
              </section>
            ) : null}
            {franjas || frenteDelDia.length > 0 ? (
              <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-frente-al-rango" data-frente-en-el-cuadro>
                {/* Sin rango en la comida, la tarjeta solo ubica el día: no se titula con el rango que no tiene. */}
                <h3 id="opcion-frente-al-rango">{franjas ? COPY_FRANJAS.frenteAlRangoDe(comida) : COPY_PLANIFICACION.frenteAlRango}</h3>
                {franjas ? <FranjasDeLaComida franjas={franjas} comida={comida} variante="opcion" /> : null}
                {frenteDelDia.length > 0 ? <FrenteALosRangos lineas={frenteDelDia} titulo={COPY_FRANJAS.elDiaFrenteAlSuyo} /> : null}
              </section>
            ) : null}
            <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-objetivo-general">
              <h3 id="opcion-objetivo-general">{C.objetivoGeneral}</h3>
              {objetivo ? (
                <>
                  <TiraDelObjetivo calorias={objetivo.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: objetivo.macronutrientDistribution }} onReintentar={() => undefined} />
                  {/* EDC-12: con su versión, como en el objetivo del editor. */}
                  <p className="nota">{COPY_VERSION_DEL_OBJETIVO.versionYFecha(numeroDelObjetivo, fechaDelDia(objetivo.effectiveFrom))}</p>
                </>
              ) : (
                <p className="nota">{C.sinObjetivo}</p>
              )}
            </section>
          </aside>
        </div>
      ) : null}
    </CuadroEnfocado>
  );
}

/**
 * El buscador del cuadro: un combobox con grilla, con los habituales primero y el catálogo, que busca mientras se
 * escribe. Cada fila tiene dos celdas: el alimento (Enter lo suma) y su estrella (Enter lo marca o lo quita de los
 * habituales). El foco no sale del campo: la celda marcada se anuncia por `aria-activedescendant`.
 */
function BuscadorDeLaOpcion({
  campo,
  texto,
  alEscribir,
  agregado,
  habituales,
  alSumar,
}: {
  campo: RefObject<HTMLInputElement | null>;
  texto: string;
  alEscribir: (t: string) => void;
  agregado: Agregado;
  habituales: AlimentosHabituales;
  alSumar: (e: ElementoDeCatalogo) => void;
}) {
  const { token, sesionPerdida } = useNutricion();
  const id = useId();
  const [busqueda, setBusqueda] = useState<Busqueda>({ tipo: 'quieta' });
  const [marcado, setMarcado] = useState(0);
  const [columna, setColumna] = useState<0 | 1>(0);
  const pedido = useRef(0);

  // Busca mientras se escribe, con una pausa: una respuesta vieja no pisa a la nueva.
  useEffect(() => {
    const q = texto.trim();
    const este = ++pedido.current;
    if (!hayQueBuscar(q)) {
      setBusqueda({ tipo: 'quieta' });
      return;
    }
    const espera = window.setTimeout(() => {
      setBusqueda({ tipo: 'buscando', texto: q });
      void api.buscarEnCatalogo(token, q).then((r) => {
        if (este !== pedido.current || sesionPerdida(r)) return;
        setBusqueda(r.ok ? { tipo: 'lista', texto: q, alimentos: r.datos.data } : { tipo: 'falla', texto: q, motivo: mensajeDeFallo(r) });
      });
    }, PAUSA_DEL_BUSCADOR);
    return () => window.clearTimeout(espera);
  }, [texto, token, sesionPerdida]);

  const q = texto.trim();
  const deHabituales = q ? habitualesQueCoinciden(habituales.habituales, q) : [];
  // NUA-04: el verificado equivalente de un alimento va justo antes de él, como sugerencia.
  const resultados = q
    ? conSugeridos(resultadosDelBuscador<ElementoDeCatalogo | ElementoEncontrado>(deHabituales, busqueda.tipo === 'lista' && busqueda.texto === q ? busqueda.alimentos : []), (e) => comoEncontrado(e as EquivalenteVerificado))
    : [];
  const actual = resultados.length > 0 ? Math.min(marcado, resultados.length - 1) : -1;
  const abierta = q.length > 0;
  const celda = (n: number, c: 0 | 1) => (c === 0 ? `${id}-r-${n}` : `${id}-r-${n}-habitual`);
  const escribir = (t: string) => {
    alEscribir(t);
    setMarcado(0);
    setColumna(0);
  };
  const sumar = (a: ElementoDeCatalogo) => {
    alSumar(a);
    escribir('');
    campo.current?.focus();
  };
  const elegir = (n: number) => {
    const r = resultados[n];
    if (!r) return;
    sumar(r.alimento);
  };
  const alternar = (n: number) => {
    const r = resultados[n];
    if (r) void habituales.alternar(r.alimento);
  };

  return (
    <div className="buscador-de-la-opcion">
      <label htmlFor={`${id}-campo`} className="visualmente-oculto">
        {C.buscar}
      </label>
      <span className="buscador-de-la-opcion__campo">
        <Icono nombre="buscar" tamano={20} />
        <input
          ref={campo}
          id={`${id}-campo`}
          role="combobox"
          aria-haspopup="grid"
          aria-expanded={abierta}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={actual >= 0 ? celda(actual, columna) : undefined}
          aria-describedby={`${id}-ayuda`}
          value={texto}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          placeholder={C.buscar}
          onChange={(e) => escribir(e.target.value)}
          onKeyDown={(e) => {
            const otra = columnaTrasTecla(columna, e.key, actual >= 0, e.currentTarget.selectionStart === e.currentTarget.value.length);
            if (otra !== null) {
              e.preventDefault();
              setColumna(otra);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setMarcado((m) => marcadoTrasTecla(m, resultados.length, e.key));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (actual >= 0 && columna === 1) alternar(actual);
              else if (actual >= 0) elegir(actual);
            } else if (e.key === 'Escape' && texto) {
              // Con algo escrito, Escape borra la búsqueda; vacío, cierra el cuadro.
              e.preventDefault();
              e.stopPropagation();
              escribir('');
            }
          }}
        />
        <span className="nota buscador-de-la-opcion__pista" aria-hidden="true">
          {C.pistaDelBuscador}
        </span>
      </span>
      <p id={`${id}-ayuda`} className="visualmente-oculto">
        {C.ayudaDelBuscador}
      </p>
      <p className="buscador-de-la-opcion__estado nota" role="status" aria-live="polite">
        {agregado ? C.agregado(agregado.nombre, agregado.veces) : null}
        {busqueda.tipo === 'buscando' && busqueda.texto === q ? ` ${C.buscando}` : null}
        {busqueda.tipo === 'lista' && busqueda.texto === q && resultados.length === 0 ? ` ${C.ningunoCoincide(q)}` : null}
      </p>
      {/* Una lectura de los habituales que falló no es «no tenés habituales»: se dice, y se vuelve a leer. */}
      {habituales.lectura === 'falla' ? (
        <Aviso tipo="error">
          <p>{C.habitualesNoSeLeyeron(habituales.motivoDeLectura)}</p>
          <button type="button" className="boton boton--secundario" onClick={habituales.recargar}>
            {C.reintentar}
          </button>
        </Aviso>
      ) : null}
      {habituales.fallo ? (
        <Aviso tipo="error">
          <p>{habituales.fallo}</p>
        </Aviso>
      ) : null}
      {busqueda.tipo === 'falla' && busqueda.texto === q ? (
        <Aviso tipo="error">
          <p>{C.noSePudoBuscar(busqueda.motivo)}</p>
        </Aviso>
      ) : null}
      <div id={`${id}-lista`} role="grid" aria-label="Alimentos que coinciden" className="buscador-de-la-opcion__lista" hidden={resultados.length === 0}>
        {resultados.map((r, n) => {
          const c = r.alimento.composition;
          const esHabitual = habituales.esHabitual(r.alimento.catalogItemId);
          return (
            <div key={r.alimento.catalogItemId} role="row" className="buscador-de-la-opcion__resultado" data-marcado={n === actual ? '' : undefined}>
              <div
                id={celda(n, 0)}
                role="gridcell"
                aria-selected={n === actual && columna === 0}
                className="buscador-de-la-opcion__alimento"
                data-celda-marcada={n === actual && columna === 0 ? '' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(n)}
              >
                <span className="buscador-de-la-opcion__nombre">
                  {/* NUA-05: el ícono de su grupo; el nombre ya dice qué es, así que el lector no lo repite. */}
                  <span className="buscador-de-la-opcion__grupo" data-grupo={('foodGroup' in r.alimento ? r.alimento.foodGroup : null) ?? 'sin-grupo'}>
                    <Icono nombre={iconoDelAlimento('foodGroup' in r.alimento ? r.alimento.foodGroup : null)} tamano={20} />
                  </span>
                  <strong>{r.alimento.name}</strong>
                  {r.habitual ? <span className="etiqueta-de-dato">{C.habitual}</span> : null}
                  {etiquetaDelNivel(r.alimento) ? (
                    <span className="etiqueta-de-dato buscador-de-la-opcion__nivel" data-nivel={'originLevel' in r.alimento ? r.alimento.originLevel : undefined}>
                      {etiquetaDelNivel(r.alimento)}
                    </span>
                  ) : null}
                </span>
                {r.sugeridoPor ? (
                  <span className="nota buscador-de-la-opcion__sugerido" data-sugerido-por={r.sugeridoPor}>
                    {COPY_ALIMENTOS.equivalenteSugerido(r.sugeridoPor)}
                  </span>
                ) : null}
                <span className="buscador-de-la-opcion__valores">
                  {valorDe(c.energyKcal, 'kcal')} · carbohidratos {valorDe(c.carbohydrateG, 'g')} · proteínas {valorDe(c.proteinG, 'g')} · grasas {valorDe(c.fatG, 'g')}
                </span>
                <span className="nota buscador-de-la-opcion__detalle">
                  {esDeDemostracion(r.alimento) ? <span className="etiqueta-de-dato buscador-de-la-opcion__demostracion">{C.datoDeDemostracion}</span> : null}
                  {/* El origen, breve y como texto: una celda de la grilla no lleva un enlace adentro. */}
                  {'origin' in r.alimento ? `${origenEnElCatalogo(r.alimento, fechaDelDia).breve} · ` : ''}
                  {C.cadaCien(c.referenceAmount === '100ml')} · {completitudEnPalabras(c)}
                  {'certification' in r.alimento && r.alimento.certification ? ` · ${COPY_ALIMENTOS.certificadoCon(r.alimento.certification.source)}` : ''}
                  {/* NUA-04: si su verificado equivalente no quedó justo arriba (ya estaba antes en la lista), lo nombra. */}
                  {avisoDeEquivalente(r.alimento) && resultados[n - 1]?.sugeridoPor !== r.alimento.name ? <span data-tiene-equivalente>{` · ${avisoDeEquivalente(r.alimento)}`}</span> : null}
                </span>
              </div>
              <div id={celda(n, 1)} role="gridcell" aria-selected={n === actual && columna === 1} className="buscador-de-la-opcion__estrella" data-celda-marcada={n === actual && columna === 1 ? '' : undefined}>
                {/* El foco no sale del campo: el botón se toca con el puntero, y con el teclado se llega por la grilla. */}
                <button
                  type="button"
                  tabIndex={-1}
                  className="boton boton--quieto alimentos-del-catalogo__habitual"
                  aria-pressed={esHabitual}
                  aria-label={`${esHabitual ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}: ${r.alimento.name}`}
                  title={esHabitual ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}
                  data-marcar-habitual
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => alternar(n)}
                >
                  <Icono nombre="habitual" tamano={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** NUA-04: un verificado sugerido, como una fila más del buscador. */
function comoEncontrado(e: EquivalenteVerificado): ElementoEncontrado {
  return { ...e, matchedAlternativeName: null, origin: { loadedBy: null, approximateCorrespondence: null }, originLevel: 'VERIFIED', certification: null, verifiedEquivalent: null };
}

