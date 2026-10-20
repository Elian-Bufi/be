'use client';

/**
 * «Agregar ítem» (WP-ESCRITORIO-AREAS, parte 7; maqueta 21; C-52): el buscador del catálogo, en un cajón al costado del
 * editor del plan de comidas, que sigue a la vista por detrás. Hace lo mismo que el recuadro que antes se abría dentro
 * de cada opción —buscar en el catálogo BE, elegir un habitual, crear un alimento a mano e importar uno—, y nada más.
 * Son las tres vías del legajo (B05:535-552; B10-05 §18): la importación es una opción más, nunca la búsqueda principal
 * obligatoria (WP-08).
 * - **Busca al enviar** (Enter o la lupa), como antes. Los resultados van en una tabla con las calorías y los tres
 *   macros de cada alimento, en el orden de BE; los de un líquido lo dicen («cada 100 ml»).
 * - **Una búsqueda que falla dice su motivo y se reintenta:** no es «No encontramos alimentos con ese nombre».
 * - **Una búsqueda sin resultados dice qué se buscó** y ofrece «Limpiar búsqueda», que vacía el campo (y con él el filtro
 *   de los habituales), devuelve el foco al campo y deja el cajón como al abrirse (bloque 5 del encargo de consolidación).
 * - **Elegir no cierra el cajón:** el alimento se suma a la opción, sin cantidad, y el cajón lo anuncia («Agregado:
 *   Arroz»). Se pueden sumar varios seguidos; se cierra con «Cerrar» o con Escape.
 * - «Crear manualmente» e «Importar desde Open Food Facts» se abren adentro, en el lugar de los resultados, con «Volver
 *   a la búsqueda»: no hay un diálogo encima de otro.
 * - Al abrirse, el foco va al campo de búsqueda: es para lo que se abre.
 * La cuenta («4 en el catálogo») se dice solo cuando la búsqueda trajo todo: se piden 20 y la API no informa el total.
 * Si un alimento apareció por un nombre alternativo, se dice cuál: «Palta (aguacate)» (DL-141).
 */
import {
  cantidad as formatearCantidad,
  COPY_HABITUALES,
  habitualesQueCoinciden,
  COPY_INTEGRACIONES,
  COPY_NUTRICION,
  leerNumero,
  motivoDeNumeroIlegible,
  nombreAlternativoComoAclaracion,
  type ElementoDeCatalogo,
  type ElementoEncontrado,
} from '@be/domain';
import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Cajon } from '../../../../components/cajon';
import { Cargando } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { OrigenEnElCatalogo } from '../../../../components/origen-en-el-catalogo';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import type { AlimentosHabituales } from './habituales';
import { ImportacionDeOpenFoodFacts } from './importacion';
import { useNutricion } from './nutricion';

const CUANTOS_SE_PIDEN = 20;

type Busqueda =
  | { readonly tipo: 'sin-buscar' }
  | { readonly tipo: 'buscando'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly texto: string; readonly alimentos: readonly ElementoEncontrado[]; readonly hayMas: boolean }
  | { readonly tipo: 'falla'; readonly texto: string; readonly motivo: string };

/** Los cuatro valores de un alimento, en el orden de BE: calorías, carbohidratos, grasas y proteínas. */
const valoresDe = (e: ElementoDeCatalogo): readonly string[] => [
  formatearCantidad(e.composition.energyKcal, 'kcal'),
  formatearCantidad(e.composition.carbohydrateG, 'g'),
  formatearCantidad(e.composition.fatG, 'g'),
  formatearCantidad(e.composition.proteinG, 'g'),
];

export function AgregarItem({
  abierto,
  deDonde,
  habituales,
  onElegir,
  onCerrar,
}: {
  abierto: boolean;
  /** A qué opción de qué comida se le suma: «Almuerzo · opción 1: Pollo, arroz y verduras». */
  deDonde: string | null;
  habituales: AlimentosHabituales;
  onElegir: (e: ElementoDeCatalogo) => void;
  onCerrar: () => void;
}) {
  const [modo, setModo] = useState<'buscar' | 'manual' | 'importar'>('buscar');
  // El campo de búsqueda: al abrirse el cajón, el foco va ahí.
  const campo = useRef<HTMLInputElement>(null);
  // Cada vez que se abre, empieza por la búsqueda.
  useEffect(() => {
    if (abierto) setModo('buscar');
  }, [abierto]);
  return (
    <Cajon
      abierto={abierto}
      titulo="Agregar ítem"
      sobretitulo={deDonde}
      focoInicial={campo}
      onCerrar={onCerrar}
      pie={
        modo === 'buscar' ? (
          <>
            <p className="nota agregar-item__antes">El alimento se agrega sin cantidad: la completás en la tabla de la opción. {COPY_NUTRICION.catalogoSintetico}</p>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('manual')}>
              <Icono nombre="mas" tamano={18} />
              {COPY_NUTRICION.crearManualmente}
            </button>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('importar')}>
              <Icono nombre="descargar" tamano={18} />
              {COPY_INTEGRACIONES.importarDesdeOpenFoodFacts}
            </button>
          </>
        ) : null
      }
    >
      <ContenidoDeAgregarItem modo={modo} alCambiarDeModo={setModo} campo={campo} habituales={habituales} onElegir={onElegir} />
    </Cajon>
  );
}

/** Lo de adentro del cajón: vive solo mientras está abierto, así que cada apertura empieza con el buscador vacío. */
function ContenidoDeAgregarItem({
  modo,
  alCambiarDeModo,
  campo,
  habituales,
  onElegir,
}: {
  modo: 'buscar' | 'manual' | 'importar';
  alCambiarDeModo: (m: 'buscar' | 'manual' | 'importar') => void;
  campo: RefObject<HTMLInputElement | null>;
  habituales: AlimentosHabituales;
  onElegir: (e: ElementoDeCatalogo) => void;
}) {
  const { token, sesionPerdida } = useNutricion();
  const id = useId();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState<Busqueda>({ tipo: 'sin-buscar' });
  const [agregado, setAgregado] = useState<{ readonly nombre: string; readonly veces: number } | null>(null);
  const pedido = useRef(0);

  // Al volver de crear o de importar, el foco vuelve al campo. Al abrirse, lo pone el cajón (`focoInicial`).
  useEffect(() => {
    if (modo === 'buscar') campo.current?.focus({ preventScroll: true });
  }, [modo, campo]);

  const buscar = async (que: string) => {
    const esta = ++pedido.current;
    setBusqueda({ tipo: 'buscando', texto: que });
    const r = await api.buscarEnCatalogo(token, que);
    // Una respuesta que llega después de otra búsqueda no pisa a la más nueva.
    if (esta !== pedido.current || sesionPerdida(r)) return;
    setBusqueda(r.ok ? { tipo: 'lista', texto: que, alimentos: r.datos.data, hayMas: r.datos.page.hasMore } : { tipo: 'falla', texto: que, motivo: mensajeDeFallo(r) });
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void buscar(texto.trim());
  };
  /** «Limpiar búsqueda»: el campo vacío (y con él el filtro de los habituales), el foco en él y el cajón como al abrirse. */
  const limpiar = () => {
    pedido.current += 1;
    setTexto('');
    setBusqueda({ tipo: 'sin-buscar' });
    campo.current?.focus();
  };
  const elegir = (e: ElementoDeCatalogo) => {
    onElegir(e);
    setAgregado((a) => ({ nombre: e.name, veces: (a?.veces ?? 0) + 1 }));
  };

  if (modo === 'manual') {
    return (
      <CrearManualmente
        id={`${id}-nuevo`}
        nombreInicial={busqueda.tipo === 'lista' && busqueda.alimentos.length === 0 ? busqueda.texto : ''}
        onCreado={(e) => {
          elegir(e);
          alCambiarDeModo('buscar');
        }}
        onVolver={() => alCambiarDeModo('buscar')}
      />
    );
  }
  if (modo === 'importar') {
    return (
      <div className="agregar-item__otro">
        <button type="button" className="boton boton--enlace agregar-item__volver" onClick={() => alCambiarDeModo('buscar')}>
          <Icono nombre="izquierda" tamano={18} />
          Volver a la búsqueda
        </button>
        <ImportacionDeOpenFoodFacts
          id={`${id}-importar`}
          onIncorporado={(e) => {
            elegir(e);
            alCambiarDeModo('buscar');
          }}
          onCargarManualmente={() => alCambiarDeModo('manual')}
        />
      </div>
    );
  }

  const alimentos = busqueda.tipo === 'lista' ? busqueda.alimentos : [];
  // Los habituales se filtran mientras se escribe; el catálogo, al enviar (bloque 5).
  const filtro = texto.trim();
  const alaVista = habitualesQueCoinciden(habituales.habituales, filtro);
  // Con el catálogo ya buscado con ese texto, los habituales no repiten que se busca con Enter: el resultado está debajo.
  const catalogoBuscado = busqueda.tipo !== 'sin-buscar' && busqueda.texto === filtro;
  return (
    <div className="agregar-item">
      <form onSubmit={enviar} className="agregar-item__buscador" role="search">
        <label htmlFor={`${id}-texto`} className="visualmente-oculto">
          Buscar en el catálogo BE
        </label>
        <span className="agregar-item__campo">
          <Icono nombre="buscar" tamano={20} />
          <input ref={campo} id={`${id}-texto`} type="search" value={texto} maxLength={80} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar en el catálogo BE" autoComplete="off" spellCheck={false} enterKeyHint="search" />
        </span>
        {busqueda.tipo === 'lista' && !busqueda.hayMas && busqueda.alimentos.length > 0 ? (
          <span className="agregar-item__cuenta" data-cuenta-del-catalogo>
            {busqueda.alimentos.length} en el catálogo
          </span>
        ) : null}
        <button type="submit" className="boton boton--quieto agregar-item__enviar">
          Buscar
        </button>
      </form>

      {/* Lo que se acaba de sumar, dicho donde la persona está mirando: el editor quedó detrás del velo. */}
      <p className="agregar-item__agregado" role="status" aria-live="polite" data-agregado>
        {agregado ? `Agregado: ${agregado.nombre}${agregado.veces > 1 ? ` (van ${agregado.veces})` : ''}. Podés sumar otro o cerrar.` : null}
      </p>

      <section className="agregar-item__habituales" aria-labelledby={`${id}-habituales`} data-habituales="alimentos">
        <h3 id={`${id}-habituales`} className="agregar-item__titulo">
          <Icono nombre="habitual" tamano={18} />
          {COPY_HABITUALES.alimentosHabituales}
          {habituales.habituales.length > 0 ? (
            <span className="nota" data-habituales-coinciden={filtro ? alaVista.length : undefined}>
              {filtro ? COPY_HABITUALES.coinciden(alaVista.length, habituales.habituales.length, filtro) : 'Los que marcaste: se agregan con un clic.'}
            </span>
          ) : null}
        </h3>
        {habituales.lectura === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos leer tus alimentos habituales. {habituales.motivoDeLectura}</p>
            <button type="button" className="boton boton--secundario" onClick={habituales.recargar}>
              Reintentar
            </button>
          </Aviso>
        ) : habituales.lectura === 'cargando' ? (
          <Cargando />
        ) : habituales.habituales.length === 0 ? (
          <p className="nota">{COPY_HABITUALES.sinAlimentosHabituales}</p>
        ) : alaVista.length === 0 ? (
          <p className="nota" data-habituales-sin-coincidencias>
            {COPY_HABITUALES.ningunoCoincide(filtro, catalogoBuscado)}
          </p>
        ) : (
          <ul className="agregar-item__fichas">
            {alaVista.map((el) => (
              <li key={el.catalogItemId}>
                <button type="button" className="boton boton--quieto boton--compacto" aria-label={`Agregar ${el.name}`} onClick={() => elegir(el)}>
                  <Icono nombre="mas" tamano={18} />
                  {el.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {habituales.fallo ? (
          <p className="nota" role="status">
            {habituales.fallo}
          </p>
        ) : null}
      </section>

      <section className="agregar-item__resultados" aria-labelledby={`${id}-catalogo`} data-resultados={busqueda.tipo}>
        <h3 id={`${id}-catalogo`} className="agregar-item__titulo">
          <Icono nombre="alimento" tamano={18} />
          En el catálogo BE
          {busqueda.tipo === 'lista' && alimentos.length > 0 ? (
            <span className="nota">
              {busqueda.hayMas ? `Los primeros ${CUANTOS_SE_PIDEN}` : alimentos.length === 1 ? '1 alimento' : `${alimentos.length} alimentos`}
              {busqueda.texto ? ` con «${busqueda.texto}»` : ''}
            </span>
          ) : null}
        </h3>
        {busqueda.tipo === 'sin-buscar' ? <p className="nota">Escribí el nombre de un alimento y buscalo con Enter.</p> : null}
        {busqueda.tipo === 'buscando' ? <Cargando /> : null}
        {busqueda.tipo === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos buscar en el catálogo. {busqueda.motivo}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void buscar(busqueda.texto)}>
              Reintentar
            </button>
          </Aviso>
        ) : null}
        {busqueda.tipo === 'lista' && alimentos.length === 0 ? (
          <>
            <p data-sin-resultados>
              {busqueda.texto ? `Ningún alimento coincide con «${busqueda.texto}».` : 'El catálogo no trajo alimentos.'} Podés crearlo a mano o importarlo, con los botones de abajo.
            </p>
            <div className="acciones">
              <button type="button" className="boton boton--secundario boton--compacto" onClick={limpiar}>
                Limpiar búsqueda
              </button>
            </div>
          </>
        ) : null}
        {busqueda.tipo === 'lista' && alimentos.length > 0 ? (
          <>
            <div className="desplazable-x">
              <table className="tabla alimentos-del-catalogo">
                <caption className="visualmente-oculto">Alimentos del catálogo BE que coinciden, con sus valores cada 100 g o cada 100 ml</caption>
                <thead>
                  <tr>
                    <th scope="col">Alimento</th>
                    <th scope="col" className="alimentos-del-catalogo__numero">
                      Calorías
                    </th>
                    <th scope="col" className="alimentos-del-catalogo__numero">
                      Carbohidratos
                    </th>
                    <th scope="col" className="alimentos-del-catalogo__numero">
                      Grasas
                    </th>
                    <th scope="col" className="alimentos-del-catalogo__numero">
                      Proteínas
                    </th>
                    <th scope="col">
                      <span className="visualmente-oculto">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alimentos.map((el) => {
                    const marcado = habituales.esHabitual(el.catalogItemId);
                    const [calorias, carbohidratos, grasas, proteinas] = valoresDe(el);
                    return (
                      <tr key={el.catalogItemId} data-alimento={el.catalogItemId}>
                        <th scope="row">
                          <span className="alimentos-del-catalogo__nombre">
                            {el.name}
                            {el.matchedAlternativeName ? <span className="nombre-alternativo"> ({nombreAlternativoComoAclaracion(el.matchedAlternativeName)})</span> : null}
                          </span>
                          {/* DL-141 D-6: de dónde sale, breve; el detalle, en la pista del origen. */}
                          <span className="nota alimentos-del-catalogo__detalle">
                            {el.composition.referenceAmount === '100ml' ? 'cada 100 ml' : 'cada 100 g'} · <OrigenEnElCatalogo item={el} />
                          </span>
                        </th>
                        <td className="alimentos-del-catalogo__numero" data-etiqueta="Calorías">
                          {calorias}
                        </td>
                        <td className="alimentos-del-catalogo__numero" data-etiqueta="Carbohidratos">
                          {carbohidratos}
                        </td>
                        <td className="alimentos-del-catalogo__numero" data-etiqueta="Grasas">
                          {grasas}
                        </td>
                        <td className="alimentos-del-catalogo__numero" data-etiqueta="Proteínas">
                          {proteinas}
                        </td>
                        <td className="alimentos-del-catalogo__acciones">
                          <button
                            type="button"
                            className="boton boton--quieto alimentos-del-catalogo__habitual"
                            aria-pressed={marcado}
                            aria-label={`${marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}: ${el.name}`}
                            title={marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}
                            onClick={() => void habituales.alternar(el)}
                          >
                            <Icono nombre="habitual" tamano={18} />
                          </button>
                          <button type="button" className="boton boton--secundario boton--compacto" aria-label={`Elegir ${el.name}`} onClick={() => elegir(el)}>
                            Elegir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {busqueda.hayMas ? <p className="nota">Hay más alimentos que coinciden: escribí algo más del nombre para acotar.</p> : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

/** «Crear manualmente»: un alimento propio, con sus valores cada 100 g. Lo crea y lo suma a la opción. */
function CrearManualmente({ id, nombreInicial, onCreado, onVolver }: { id: string; nombreInicial: string; onCreado: (e: ElementoDeCatalogo) => void; onVolver: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [nuevo, setNuevo] = useState({ nombre: nombreInicial, kcal: '', c: '', g: '', p: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    // Los mismos requisitos de siempre, señalados en el campo que falta (B10-10:164-165).
    const problemas: Record<string, string> = {};
    if (!nuevo.nombre.trim()) problemas['nombre'] = 'Falta el nombre del alimento.';
    const valores: Record<string, number> = {};
    for (const [clave, texto] of [
      ['kcal', nuevo.kcal],
      ['c', nuevo.c],
      ['g', nuevo.g],
      ['p', nuevo.p],
    ] as const) {
      const n = leerNumero(texto);
      if (n === null) problemas[clave] = texto.trim() === '' ? 'Falta el valor cada 100 g.' : motivoDeNumeroIlegible(texto);
      else if (n < 0) problemas[clave] = 'El valor no puede ser menor que cero.';
      else valores[clave] = n;
    }
    setErrores(problemas);
    if (Object.keys(problemas).length > 0) return setFallo(null);
    setCreando(true);
    const r = await api.crearElementoDeCatalogo(
      token,
      { name: nuevo.nombre.trim(), itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: valores['kcal']!, proteinG: valores['p']!, carbohydrateG: valores['c']!, fatG: valores['g']! } },
      intento.actual(),
    );
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onCreado(r.datos.data);
  }

  return (
    <form className="agregar-item__otro" onSubmit={(e) => void crear(e)} noValidate>
      <button type="button" className="boton boton--enlace agregar-item__volver" onClick={onVolver}>
        <Icono nombre="izquierda" tamano={18} />
        Volver a la búsqueda
      </button>
      <h3 className="agregar-item__titulo">{COPY_NUTRICION.crearManualmente}</h3>
      <p className="nota">Un alimento tuyo, con sus valores cada 100 g. Queda en el catálogo para volver a usarlo.</p>
      <Campo id={`${id}-nombre`} etiqueta="Nombre" value={nuevo.nombre} maxLength={120} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} error={errores['nombre'] ?? null} />
      <div className="agregar-item__valores">
        <Campo id={`${id}-kcal`} etiqueta="Calorías (kcal)" inputMode="decimal" value={nuevo.kcal} onChange={(e) => setNuevo({ ...nuevo, kcal: e.target.value })} error={errores['kcal'] ?? null} />
        <Campo id={`${id}-c`} etiqueta="Carbohidratos (g)" inputMode="decimal" value={nuevo.c} onChange={(e) => setNuevo({ ...nuevo, c: e.target.value })} error={errores['c'] ?? null} />
        <Campo id={`${id}-g`} etiqueta="Grasas (g)" inputMode="decimal" value={nuevo.g} onChange={(e) => setNuevo({ ...nuevo, g: e.target.value })} error={errores['g'] ?? null} />
        <Campo id={`${id}-p`} etiqueta="Proteínas (g)" inputMode="decimal" value={nuevo.p} onChange={(e) => setNuevo({ ...nuevo, p: e.target.value })} error={errores['p'] ?? null} />
      </div>
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={creando}>
          {creando ? 'Creando…' : 'Crear y agregar'}
        </button>
      </div>
    </form>
  );
}
