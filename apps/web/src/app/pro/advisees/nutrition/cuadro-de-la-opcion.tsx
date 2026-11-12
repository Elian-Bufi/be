'use client';

/**
 * ED-31 (WP-EDITORES-PROFESIONAL; maqueta 06) · La opción en un cuadro: su nombre, sus alimentos en una tabla, el
 * buscador adentro y, al costado, el total al instante, el rango de su comida y el objetivo general. La lógica está en
 * `opcion-en-un-cuadro.ts`; la cuenta, en `rangos.ts` (la del dominio, `SUM_SOURCE_PER_100G_V1`).
 *
 * - Lo abren «Agregar ítem» de una opción de alimentos y el paso 5 del asistente (ED-30). Trabaja sobre una copia: el
 *   borrador cambia solo con «Guardar la opción».
 * - El buscador es un combobox (ARIA 1.2): el foco queda en el campo y el marcado se anuncia por
 *   `aria-activedescendant`. Enter suma el marcado; el cuadro sigue abierto.
 * - «Crearlo a mano» e «Importarlo de Open Food Facts» reemplazan el contenido del cuadro, con «Volver a la opción»: no
 *   se abre un cuadro encima de otro (§2.3).
 */
import { cantidad as formatearCantidad, habitualesQueCoinciden, origenEnElCatalogo, type ElementoDeCatalogo, type ElementoEncontrado, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
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
  completitudEnPalabras,
  COPY_OPCION_EN_UN_CUADRO as C,
  esDeDemostracion,
  hayQueBuscar,
  itemNuevo,
  marcadoTrasTecla,
  PAUSA_DEL_BUSCADOR,
  resultadosDelBuscador,
} from './opcion-en-un-cuadro';
import { COPY_RANGOS, faltantesDeLaOpcion, itemsParaElTotal, NUTRIENTES_DEL_RANGO, queFaltaEnPalabras, rangoDeLaComida, rangoEnUnaCelda, totalDeLaOpcion, type Composiciones, type TotalDeLaOpcion } from './rangos';

type Busqueda =
  | { readonly tipo: 'quieta' }
  | { readonly tipo: 'buscando'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly texto: string; readonly alimentos: readonly ElementoEncontrado[] }
  | { readonly tipo: 'falla'; readonly texto: string; readonly motivo: string };

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
  /** La opción como está en el borrador al abrir. */
  opcion: OpcionEnEdicion | null;
  /** El nombre de su comida, para su rango. */
  comida: string;
  /** Las demás opciones de la comida con su total, para el rango con esta como queda. */
  otrasOpciones: readonly { readonly nombre: string; readonly total: TotalDeLaOpcion }[];
  nombres: Readonly<Record<string, string>>;
  composiciones: Composiciones;
  objetivo: VersionDeObjetivo | null;
  habituales: AlimentosHabituales;
  /** «Guardar la opción»: la copia, con los nombres y las composiciones de lo que se sumó. */
  alGuardar: (opcion: OpcionEnEdicion, nuevos: { readonly nombres: Readonly<Record<string, string>>; readonly composiciones: ReadonlyMap<string, ElementoDeCatalogo['composition']> }) => void;
  onCerrar: () => void;
}) {
  const [copia, setCopia] = useState<OpcionEnEdicion | null>(opcion);
  const [modo, setModo] = useState<'opcion' | 'manual' | 'importar'>('opcion');
  const [nombresNuevos, setNombresNuevos] = useState<Record<string, string>>({});
  const [composicionesNuevas, setComposicionesNuevas] = useState<ReadonlyMap<string, ElementoDeCatalogo['composition']>>(() => new Map());
  const buscador = useRef<HTMLInputElement>(null);
  // Cada vez que se abre, la copia vuelve a ser la opción del borrador.
  useEffect(() => {
    if (!abierto) return;
    setCopia(opcion ? structuredClone(opcion) : null);
    setModo('opcion');
    setNombresNuevos({});
    setComposicionesNuevas(new Map());
    // Solo al abrir: la opción del borrador no cambia con el cuadro abierto (es modal).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const todosLosNombres = { ...nombres, ...nombresNuevos };
  const todasLasComposiciones: Composiciones = new Map([...composiciones, ...composicionesNuevas]);
  const sumar = (e: ElementoDeCatalogo) => {
    setNombresNuevos((n) => ({ ...n, [e.catalogItemId]: e.name }));
    setComposicionesNuevas((m) => new Map(m).set(e.catalogItemId, e.composition));
    setCopia((o) => (o ? { ...o, items: [...o.items, itemNuevo(e.catalogItemId)] } : o));
  };
  const cambiar = (f: (o: OpcionEnEdicion) => void) =>
    setCopia((o) => {
      if (!o) return o;
      const x = structuredClone(o);
      f(x);
      return x;
    });

  const total = copia ? totalDeLaOpcion(itemsParaElTotal(copia, todosLosNombres, () => null), todasLasComposiciones) : null;
  const faltan = total ? faltantesDeLaOpcion(total) : [];
  const rango = total ? rangoDeLaComida([...otrasOpciones, { nombre: copia?.label || titulo, total }], comida) : null;
  const sinNombre = copia !== null && copia.label.trim() === '';

  return (
    <CuadroEnfocado
      abierto={abierto && copia !== null}
      forma="dialogo"
      ancho
      titulo={titulo}
      sobretitulo={subtitulo}
      conCambios={Boolean(opcion && copia && cambioLaOpcion(opcion, copia))}
      focoInicial={buscador}
      className="cuadro-de-la-opcion"
      principal={
        modo === 'opcion'
          ? {
              texto: C.guardar,
              apagado: sinNombre ? C.sinNombre : null,
              alTocar: () => copia && alGuardar(copia, { nombres: nombresNuevos, composiciones: composicionesNuevas }),
            }
          : null
      }
      onCerrar={onCerrar}
    >
      {copia && modo === 'manual' ? (
        <CrearManualmente
          id="opcion-crear-a-mano"
          nombreInicial=""
          onCreado={(e) => {
            sumar(e);
            setModo('opcion');
          }}
          onVolver={() => setModo('opcion')}
        />
      ) : null}
      {copia && modo === 'importar' ? (
        <div className="agregar-item__otro">
          <button type="button" className="boton boton--enlace agregar-item__volver" onClick={() => setModo('opcion')}>
            <Icono nombre="izquierda" tamano={18} />
            {C.volver}
          </button>
          <ImportacionDeOpenFoodFacts
            id="opcion-importar"
            onIncorporado={(e) => {
              sumar(e);
              setModo('opcion');
            }}
            onCargarManualmente={() => setModo('manual')}
          />
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
                        onCambiar={(c) => cambiar((o) => void (o.items[l] = { ...o.items[l]!, ...c }))}
                        onQuitar={() => cambiar((o) => void o.items.splice(l, 1))}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <BuscadorDeLaOpcion campo={buscador} habituales={habituales} alSumar={sumar} />
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
                </dl>
                {faltan.length > 0 ? <p className="nota">{faltan.slice(0, 3).map(queFaltaEnPalabras).join('; ')}{faltan.length > 3 ? `; y ${faltan.length - 3} más` : ''}</p> : null}
                <p className="nota">{C.comoSeCalcula}</p>
              </section>
            ) : null}
            {rango ? (
              <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-rango-de-la-comida">
                <h3 id="opcion-rango-de-la-comida">{C.rangoDe(comida)}</h3>
                <p>
                  {NUTRIENTES_DEL_RANGO.map((n) => `${COPY_RANGOS.nutriente[n]}: ${rangoEnUnaCelda(rango[n], n)}`).join(' · ')}
                </p>
                <p className="nota">{C.conEstaOpcion}</p>
              </section>
            ) : null}
            <section className="cuadro-de-la-opcion__tarjeta" aria-labelledby="opcion-objetivo-general">
              <h3 id="opcion-objetivo-general">{C.objetivoGeneral}</h3>
              {objetivo ? (
                <>
                  <TiraDelObjetivo calorias={objetivo.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: objetivo.macronutrientDistribution }} onReintentar={() => undefined} />
                  <p className="nota">Vigente desde el {fechaDelDia(objetivo.effectiveFrom)}.</p>
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

/** El buscador del cuadro: un combobox con los habituales primero y el catálogo, que busca mientras se escribe. */
function BuscadorDeLaOpcion({ campo, habituales, alSumar }: { campo: RefObject<HTMLInputElement | null>; habituales: AlimentosHabituales; alSumar: (e: ElementoDeCatalogo) => void }) {
  const { token, sesionPerdida } = useNutricion();
  const id = useId();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState<Busqueda>({ tipo: 'quieta' });
  const [marcado, setMarcado] = useState(0);
  const [agregado, setAgregado] = useState<{ readonly nombre: string; readonly veces: number } | null>(null);
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
  const resultados = q ? resultadosDelBuscador<ElementoDeCatalogo | ElementoEncontrado>(deHabituales, busqueda.tipo === 'lista' && busqueda.texto === q ? busqueda.alimentos : []) : [];
  const actual = resultados.length > 0 ? Math.min(marcado, resultados.length - 1) : -1;
  const abierta = q.length > 0;
  const elegir = (n: number) => {
    const r = resultados[n];
    if (!r) return;
    alSumar(r.alimento);
    setAgregado((a) => ({ nombre: r.alimento.name, veces: (a?.veces ?? 0) + 1 }));
    setTexto('');
    setMarcado(0);
    campo.current?.focus();
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
          aria-expanded={abierta}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={actual >= 0 ? `${id}-r-${actual}` : undefined}
          aria-describedby={`${id}-ayuda`}
          value={texto}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          placeholder={C.buscar}
          onChange={(e) => {
            setTexto(e.target.value);
            setMarcado(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setMarcado((m) => marcadoTrasTecla(m, resultados.length, e.key));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (actual >= 0) elegir(actual);
            } else if (e.key === 'Escape' && texto) {
              // Con algo escrito, Escape borra la búsqueda; vacío, cierra el cuadro.
              e.preventDefault();
              e.stopPropagation();
              setTexto('');
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
      {busqueda.tipo === 'falla' && busqueda.texto === q ? (
        <Aviso tipo="error">
          <p>{C.noSePudoBuscar(busqueda.motivo)}</p>
        </Aviso>
      ) : null}
      <ul id={`${id}-lista`} role="listbox" aria-label="Alimentos que coinciden" className="buscador-de-la-opcion__lista" hidden={resultados.length === 0}>
        {resultados.map((r, n) => {
          const c = r.alimento.composition;
          return (
            <li
              key={r.alimento.catalogItemId}
              id={`${id}-r-${n}`}
              role="option"
              aria-selected={n === actual}
              className="buscador-de-la-opcion__resultado"
              data-marcado={n === actual ? '' : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(n)}
            >
              <span className="buscador-de-la-opcion__nombre">
                <strong>{r.alimento.name}</strong>
                {r.habitual ? <span className="etiqueta-de-dato">{C.habitual}</span> : null}
              </span>
              <span className="buscador-de-la-opcion__valores">
                {valorDe(c.energyKcal, 'kcal')} · carbohidratos {valorDe(c.carbohydrateG, 'g')} · proteínas {valorDe(c.proteinG, 'g')} · grasas {valorDe(c.fatG, 'g')}
              </span>
              <span className="nota buscador-de-la-opcion__detalle">
                {esDeDemostracion(r.alimento) ? <span className="etiqueta-de-dato buscador-de-la-opcion__demostracion">{C.datoDeDemostracion}</span> : null}
                {/* El origen, breve y como texto: una opción de la lista no lleva un enlace adentro. */}
                {'origin' in r.alimento ? `${origenEnElCatalogo(r.alimento, fechaDelDia).breve} · ` : ''}
                {C.cadaCien(c.referenceAmount === '100ml')} · {completitudEnPalabras(c)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
