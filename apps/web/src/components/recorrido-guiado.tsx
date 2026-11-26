'use client';

/**
 * DL-195 (WP-RECORRIDOS-GUIADOS) · Un recorrido guiado: todo se oscurece menos la zona que se explica, y un cartel corto,
 * al lado, dice qué es y cómo se usa. Pedido de Dirección del 2026-11-23: «como en las buenas apps, un tutorial para las
 * primeras veces que se usan las interfaces».
 *
 * - **La pieza es propia, sin librería (GUI-D01):** un hueco con una sombra enorme alrededor (el velo) y un cartel que se
 *   ubica con `ubicarCartel` de @be/domain: abajo, arriba, a la derecha o a la izquierda del hueco, sin taparlo y adentro
 *   de la ventana. Los colores salen de los tokens, así se ve igual de BE en Claro y en Azul noche.
 * - **Nada se corre (RP-19):** todo es `position: fixed` y va en un portal; no se bloquea el desplazamiento de la página
 *   (sacar la barra de desplazamiento corre todo de costado). Mientras está abierto, una capa transparente toma los
 *   clics: el recorrido es modal, como un diálogo.
 * - **Teclado:** Escape omite, las flechas izquierda y derecha retroceden y avanzan, y Tab no sale del cartel. Al abrir y
 *   en cada paso, el foco va al título, así el lector de pantalla lo lee; al cerrar, vuelve adonde estaba.
 * - **Accesible:** el cartel es un `dialog` modal, con su título, su texto y cómo se maneja con el teclado; el velo y el
 *   hueco son solo para la vista. Con `prefers-reduced-motion`, el hueco salta sin animarse y el desplazamiento no es suave.
 * - **Se adapta a la ventana:** un paso cuyo elemento no está en la pantalla (o no se ve: mide 0) se saltea; uno que está
 *   pero cortado, se desplaza hasta él. Al desplazar o cambiar el tamaño de la ventana, el hueco y el cartel lo siguen.
 *
 * Los pasos se anclan con `data-recorrido="…"` en la pantalla (GUI-D06). Cuándo aparece solo y qué se recuerda lo decide
 * `useRecorridoGuiado`: la primera vez que el usuario abre la interfaz, recordado por la API por usuario.
 */
import {
  apareceSolo,
  claveDelRespaldo,
  COPY_RECORRIDOS_GUIADOS as C,
  huecoDe,
  leerRespaldo,
  moverse,
  pasosPresentes,
  pendientesDeMandar,
  seVeEntero,
  ubicarCartel,
  unirVistos,
  type DefinicionDelRecorrido,
  type EstadoDelRecorrido,
  type Movimiento,
  type PasoPresente,
  type RecorridoGuiado as IdDelRecorrido,
  type RectEnPantalla,
  type UbicacionDelCartel,
} from '@be/domain';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { Icono } from './icono';

/**
 * El elemento de un ancla que se ve (mide más de 0): uno escondido (un panel cerrado) no cuenta. El ancla `x` es
 * `data-recorrido="x"` o, si la pantalla ya marcaba ese lugar con un atributo propio, `data-x` («Revisar y activar…» es
 * `data-revisar-y-activar`, que las guardias de la barra piden tal cual): GUI-D06. El atributo propio vale solo para las
 * anclas de esta lista: otros `data-…` con el mismo nombre marcan otra cosa (`data-agregar-bloque` es el de las fases).
 */
const ANCLAS_CON_ATRIBUTO_PROPIO: ReadonlySet<string> = new Set(['revisar-y-activar']);

function elementoDelAncla(ancla: string): HTMLElement | null {
  const nombre = CSS.escape(ancla);
  const selectores = [`[data-recorrido="${nombre}"]`, ...(ANCLAS_CON_ATRIBUTO_PROPIO.has(ancla) ? [`[data-${nombre}]`] : [])];
  for (const selector of selectores) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (el.closest('[data-recorrido-guiado]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

/**
 * Si hay otro diálogo abierto (un `<dialog>` nativo: el «?» de la vista, una confirmación, el cuadro de un rango). Con uno
 * abierto, el recorrido no aparece solo (espera a que se cierre) y su teclado no se mete: el diálogo está en la capa
 * superior y deja inerte todo lo demás, así que Escape y Tab son de él.
 */
function otroDialogoAbierto(): boolean {
  for (const d of document.querySelectorAll('dialog[open]')) if (!d.closest('[data-recorrido-guiado]')) return true;
  return false;
}

const ventana = () => ({ ancho: document.documentElement.clientWidth, alto: document.documentElement.clientHeight });
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function leerDelNavegador(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}
function guardarEnElNavegador(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (una ventana privada): la próxima vez decide la API.
  }
}

/**
 * Cuándo aparece solo y qué se recuerda (GUI-08 y GUI-09). La API es la fuente (por usuario, en cualquier computadora); el
 * navegador guarda solo lo que no se pudo mandar y, si la API no responde al leer, es lo único que se sabe. Lo que quedó
 * en el navegador se le manda a la API la próxima vez que responda.
 * - `listo`: la interfaz está dibujada (el editor cargó su versión). Antes no se pregunta nada.
 */
export function useRecorridoGuiado(recorrido: IdDelRecorrido, listo: boolean): { abierto: boolean; abrir: () => void; cerrar: (estado: EstadoDelRecorrido | null) => void } {
  const { sesion } = useSesion();
  const token = sesion?.token ?? null;
  const identidadId = sesion?.identidadId ?? null;
  const [abierto, setAbierto] = useState(false);
  // Se decide una sola vez por montaje: guardar o recargar la versión no lo vuelve a abrir.
  const decidido = useRef(false);
  // Si el profesional ya lo abrió con «Ver el recorrido» (y quizá lo cerró) mientras se leía la API, no aparece solo otra vez.
  const tocado = useRef(false);

  useEffect(() => {
    if (!listo || !token || !identidadId || decidido.current) return;
    let vigente = true;
    let espera = 0;
    void (async () => {
      const clave = claveDelRespaldo(identidadId);
      const delNavegador = leerRespaldo(leerDelNavegador(clave));
      const r = await api.consultarRecorridosVistos(token);
      if (!vigente) return;
      decidido.current = true;
      const deLaApi = r.ok ? r.datos.data.map((x) => x.tourId) : [];
      if (r.ok) {
        // Lo que el navegador guardó mientras la API no respondía: ahora queda en la cuenta.
        for (const p of pendientesDeMandar(deLaApi, delNavegador)) void api.marcarRecorrido(token, p, { state: 'SKIPPED' });
      }
      if (tocado.current || !apareceSolo({ estado: 'listo', vistos: r.ok ? unirVistos(deLaApi, delNavegador) : delNavegador, deLaApi: r.ok }, recorrido)) return;
      // Con otro diálogo abierto, espera a que se cierre: no aparece encima ni debajo de él.
      const abrirSiSePuede = () => {
        if (!vigente || tocado.current) return;
        if (otroDialogoAbierto()) espera = window.setTimeout(abrirSiSePuede, 400);
        else setAbierto(true);
      };
      abrirSiSePuede();
    })();
    return () => {
      vigente = false;
      window.clearTimeout(espera);
    };
  }, [listo, token, identidadId, recorrido]);

  const cerrar = useCallback(
    (estado: EstadoDelRecorrido | null) => {
      tocado.current = true;
      setAbierto(false);
      // `null`: no había ningún paso para mostrar; no se marca, así aparece cuando la pantalla tenga qué mostrar.
      if (estado === null || !token || !identidadId) return;
      void api.marcarRecorrido(token, recorrido, { state: estado }).then((r) => {
        if (r.ok) return;
        const clave = claveDelRespaldo(identidadId);
        guardarEnElNavegador(clave, JSON.stringify(unirVistos(leerRespaldo(leerDelNavegador(clave)), [recorrido])));
      });
    },
    [token, identidadId, recorrido],
  );

  const abrir = useCallback(() => {
    tocado.current = true;
    setAbierto(true);
  }, []);
  return { abierto, abrir, cerrar };
}

/** «Ver el recorrido»: discreto y sin subrayado, en un lugar fijo de la interfaz (GUI-10). */
export function BotonVerElRecorrido({ alTocar, conPalabraCorta }: { alTocar: () => void; conPalabraCorta?: boolean }) {
  // Con `conPalabraCorta` (la barra de Entrenamiento, que es de un solo renglón) se ve «Recorrido»; el nombre accesible sigue
  // siendo «Ver el recorrido».
  return (
    <button type="button" className="boton boton--discreto recorrido__ver" data-ver-recorrido aria-label={conPalabraCorta ? C.verElRecorrido : undefined} title={conPalabraCorta ? C.verElRecorrido : undefined} onClick={alTocar}>
      <Icono nombre="info" tamano={18} />
      {conPalabraCorta ? <span className="recorrido__palabra" aria-hidden="true">{C.recorridoCorto}</span> : C.verElRecorrido}
    </button>
  );
}

interface Lugar {
  readonly hueco: RectEnPantalla;
  readonly cartel: UbicacionDelCartel | null;
}

export function RecorridoGuiado({ definicion, abierto, alCerrar }: { definicion: DefinicionDelRecorrido; abierto: boolean; alCerrar: (estado: EstadoDelRecorrido | null) => void }) {
  if (!abierto) return null;
  return <RecorridoAbierto definicion={definicion} alCerrar={alCerrar} />;
}

function RecorridoAbierto({ definicion, alCerrar }: { definicion: DefinicionDelRecorrido; alCerrar: (estado: EstadoDelRecorrido | null) => void }) {
  const id = useId();
  const cartel = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  // Los pasos que se pueden mostrar se calculan al abrir: «Paso n de m» no cambia mientras se recorre.
  const [pasos] = useState<readonly PasoPresente[]>(() => pasosPresentes(definicion.pasos, (a) => elementoDelAncla(a) !== null));
  const [indice, setIndice] = useState(0);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const paso = pasos[indice] ?? null;
  const ultimo = indice === pasos.length - 1;

  // El foco vuelve adonde estaba al cerrar («Ver el recorrido», o lo que tenía el foco cuando apareció solo).
  // Se toma al montar, antes de que el título se lleve el foco.
  const [previo] = useState<Element | null>(() => document.activeElement);
  useEffect(() => {
    return () => {
      const el = previo;
      if (el instanceof HTMLElement && el.isConnected) el.focus({ preventScroll: true });
    };
  }, [previo]);

  useEffect(() => {
    if (pasos.length === 0) alCerrar(null);
  }, [pasos.length, alCerrar]);

  // Un paso cuyo elemento se fue de la pantalla (o dejó de verse) se saltea; después del último, termina.
  const pasarDeLargo = useCallback(() => {
    const destino = moverse(indice, pasos.length, 'siguiente');
    if (destino.tipo === 'fin') alCerrar('SEEN');
    else setIndice(destino.indice);
  }, [indice, pasos.length, alCerrar]);

  const medir = useCallback(() => {
    if (!paso) return;
    const el = elementoDelAncla(paso.ancla);
    if (!el) {
      pasarDeLargo();
      return;
    }
    const v = ventana();
    const r = el.getBoundingClientRect();
    const hueco = huecoDe({ top: r.top, left: r.left, width: r.width, height: r.height }, v);
    const c = cartel.current;
    setLugar({ hueco, cartel: c ? ubicarCartel(hueco, { ancho: c.offsetWidth, alto: c.offsetHeight }, v) : null });
  }, [paso, pasarDeLargo]);

  const mover = useCallback(
    (movimiento: Movimiento) => {
      const destino = moverse(indice, pasos.length, movimiento);
      if (destino.tipo === 'fin') alCerrar('SEEN');
      else setIndice(destino.indice);
    },
    [indice, pasos.length, alCerrar],
  );

  // Cada paso: si su elemento se fue de la pantalla, se saltea; si está cortado, se desplaza hasta él.
  useLayoutEffect(() => {
    if (!paso) return;
    const el = elementoDelAncla(paso.ancla);
    if (!el) {
      pasarDeLargo();
      return;
    }
    const r = el.getBoundingClientRect();
    if (!seVeEntero({ top: r.top, left: r.left, width: r.width, height: r.height }, ventana())) {
      el.scrollIntoView({ block: r.height > ventana().alto ? 'start' : 'center', inline: 'nearest', behavior: sinMovimiento() ? 'auto' : 'smooth' });
    }
    medir();
  }, [paso, pasarDeLargo, medir]);

  // El foco va al título una vez por paso, cuando el cartel ya está ubicado: antes de medir, el cartel está con
  // `visibility: hidden` y un elemento oculto no toma el foco (el `focus()` no hace nada y el foco queda en la página).
  const enfocadoEn = useRef<string | null>(null);
  const ubicado = lugar?.cartel != null;
  useLayoutEffect(() => {
    if (!paso || !ubicado || enfocadoEn.current === paso.id) return;
    enfocadoEn.current = paso.id;
    titulo.current?.focus({ preventScroll: true });
  }, [paso, ubicado]);

  // Al desplazar (también el desplazamiento suave hacia el paso) o cambiar el tamaño de la ventana, lo sigue. También
  // cuando el elemento o la página cambian de tamaño sin desplazarse: un panel que termina de leer (el reparto, «Rangos y
  // totales») corre lo de abajo o agranda la zona, y el hueco quedaría sobre otra cosa.
  useEffect(() => {
    let cuadro = 0;
    const pedir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(medir);
    };
    window.addEventListener('scroll', pedir, { capture: true, passive: true });
    window.addEventListener('resize', pedir, { passive: true });
    const tamanos = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(pedir);
    const el = paso ? elementoDelAncla(paso.ancla) : null;
    if (tamanos) {
      tamanos.observe(document.body);
      if (el) tamanos.observe(el);
    }
    return () => {
      tamanos?.disconnect();
      cancelAnimationFrame(cuadro);
      window.removeEventListener('scroll', pedir, { capture: true });
      window.removeEventListener('resize', pedir);
    };
  }, [medir, paso]);

  // El teclado, en la captura: Escape omite, las flechas se mueven y Tab queda en el cartel.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      // Con otro diálogo encima (lo abrió un atajo), el teclado es de él: Escape lo cierra a él y no omite el recorrido.
      if (otroDialogoAbierto()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        alCerrar('SKIPPED');
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        mover(e.key === 'ArrowRight' ? 'siguiente' : 'anterior');
        return;
      }
      if (e.key !== 'Tab' || !cartel.current) return;
      const controles = [...cartel.current.querySelectorAll<HTMLElement>('button')];
      if (controles.length === 0) return;
      const primero = controles[0]!;
      const final = controles[controles.length - 1]!;
      const dentro = cartel.current.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === primero || document.activeElement === titulo.current)) {
        e.preventDefault();
        final.focus();
      } else if (!e.shiftKey && (!dentro || document.activeElement === final)) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclear, true);
    return () => document.removeEventListener('keydown', alTeclear, true);
  }, [alCerrar, mover]);

  if (!paso) return null;
  const hueco = lugar?.hueco;
  const ubicacion = lugar?.cartel;
  return createPortal(
    <div className="recorrido" data-recorrido-guiado={definicion.id} data-paso={paso.id}>
      {/* Toma los clics de afuera del cartel: mientras se recorre, la pantalla no se toca. */}
      <div className="recorrido__bloqueo" aria-hidden="true" />
      {hueco ? <div className="recorrido__hueco" aria-hidden="true" style={{ top: hueco.top, left: hueco.left, width: hueco.width, height: hueco.height }} /> : null}
      <div
        ref={cartel}
        className="recorrido__cartel"
        role="dialog"
        aria-modal="true"
        aria-label={definicion.nombre}
        aria-describedby={`${id}-paso ${id}-titulo ${id}-texto ${id}-teclado`}
        data-lado={ubicacion?.lado}
        style={ubicacion ? { top: ubicacion.top, left: ubicacion.left } : { visibility: 'hidden', top: 0, left: 0 }}
      >
        <p id={`${id}-paso`} className="recorrido__numero">
          {C.pasoDe(indice + 1, pasos.length)}
        </p>
        <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1} className="recorrido__titulo">
          {paso.titulo}
        </h2>
        <p id={`${id}-texto`} className="recorrido__texto">
          {paso.texto}
        </p>
        {ultimo ? <p className="nota recorrido__donde-volver">{C.dondeVolver}</p> : null}
        <p id={`${id}-teclado`} className="visualmente-oculto">
          {C.teclado}
        </p>
        <div className="recorrido__acciones">
          <button type="button" className="boton boton--discreto" data-omitir-recorrido onClick={() => alCerrar('SKIPPED')}>
            {C.omitir}
          </button>
          {/* «Anterior» está siempre: en el primer paso, apagado. Así «Siguiente» no cambia de lugar (RP-19). */}
          <button
            type="button"
            className="boton boton--secundario boton--compacto"
            data-anterior-del-recorrido
            aria-disabled={indice === 0 ? true : undefined}
            onClick={() => {
              if (indice > 0) mover('anterior');
            }}
          >
            {C.anterior}
          </button>
          <button type="button" className="boton boton--primario boton--compacto" data-siguiente-del-recorrido onClick={() => mover('siguiente')}>
            {ultimo ? C.terminar : C.siguiente}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
