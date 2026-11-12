'use client';

/**
 * ED-02 y ED-65 · La guardia de la salida con cambios sin guardar (WP-EDITORES-PROFESIONAL; ED-D10). La regla y los textos
 * están en `lib/salida-segura.ts`.
 *
 * - `SalidaSegura` envuelve el espacio profesional (`app/pro/layout.tsx`): lleva la cuenta de los editores con cambios,
 *   dice «Guardando antes de salir…» y muestra el cuadro «Tenés cambios sin guardar».
 * - Un editor avisa lo que tiene con `useCambiosParaSalir` (y, si es un borrador con autoguardado, cómo guardarlo ya).
 *   Recargar o cerrar la pestaña también pregunta: el navegador muestra su propio aviso (`beforeunload`).
 * - Un enlace interno pasa por la guardia con `useAlNavegar`, en el `onNavigate` de `<Link>`: la barra, las pestañas y
 *   «Volver a la ficha». Si hay que guardar o preguntar, la navegación espera; después sigue con el enrutador.
 * - El cuadro: «Seguir editando» es el principal y tiene el foco; Escape es «Seguir editando» (nunca sale), y al cerrarse
 *   el foco vuelve al enlace. «Salir sin guardar» sale.
 * - Una lista con el detalle abierto en el lugar (las plantillas y los habituales) pasa por la guardia al cerrarlo, abrir
 *   otro o volver a leerse (`useDetalleConGuardia`).
 */
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { COPY_SALIDA_SEGURA as S, guardarAntesDeSalir, queHacerAlSalir, type FotoDelEditor } from '../lib/salida-segura';
import { Icono } from './icono';

/** Cómo se guarda un borrador antes de salir. Sin esto, salir con cambios pregunta. */
export interface GuardarAntesDeSalir {
  /** Se puede guardar ya: nada a medio escribir ni un conflicto. */
  readonly sePuede: boolean;
  /** Un guardado está viajando: se espera su respuesta antes de mandar otro. */
  readonly ocupado: boolean;
  /** Guarda ya, sin la pausa; `true` solo con la respuesta del servidor. */
  readonly guardar: () => Promise<boolean>;
}

/** Lo último que dibujó un editor con cambios (`lib/salida-segura.ts`). */
type Entrada = FotoDelEditor;

type AlNavegar = (evento: { preventDefault: () => void }) => void;

/** Adónde se va: un enlace interno o una acción de la página (volver a la lista, cerrar el editor). */
type Destino = { readonly href: string; readonly reemplazar: boolean } | { readonly accion: () => void };

interface ContextoDeLaSalida {
  readonly anotar: (clave: string, leer: (() => Entrada) | null) => void;
  /** Para el `onNavigate` de un enlace: si hay que guardar o preguntar, cancela la navegación y la sigue después. */
  readonly alNavegar: (href: string, reemplazar: boolean) => AlNavegar;
  /** Para una acción que saca del editor sin cambiar de página: la hace ya, o después de guardar o de preguntar. */
  readonly antesDe: (accion: () => void) => void;
}

const Contexto = createContext<ContextoDeLaSalida | null>(null);

const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

export function SalidaSegura({ children }: { children: ReactNode }) {
  const router = useRouter();
  const entradas = useRef(new Map<string, () => Entrada>());
  const ocupada = useRef(false);
  const [guardando, setGuardando] = useState(false);
  const [preguntar, setPreguntar] = useState<{ readonly destino: Destino; readonly que: readonly string[]; readonly noSeGuardo: boolean } | null>(null);

  const contexto = useMemo<ContextoDeLaSalida>(() => {
    const ir = (destino: Destino) => {
      if ('accion' in destino) destino.accion();
      else if (destino.reemplazar) router.replace(destino.href);
      else router.push(destino.href);
    };
    const conCambios = () => [...entradas.current.values()].map((leer) => ({ leer, ahora: leer() })).filter((x) => x.ahora.hay);
    /** `true` si se puede seguir ya (sin cambios); si no, guarda o pregunta, y sigue después. */
    const salir = (destino: Destino): boolean => {
      const pendientes = conCambios();
      const que = queHacerAlSalir(pendientes.map((x) => ({ que: x.ahora.que, sePuedeGuardar: !!x.ahora.guardarAntes?.sePuede })));
      if (que.tipo === 'SALIR') return true;
      if (ocupada.current) return false;
      if (que.tipo === 'PREGUNTAR') {
        setPreguntar({ destino, que: que.que, noSeGuardo: false });
        return false;
      }
      // Todo se puede guardar: se guarda ya y se sale con la respuesta del servidor, solo si no quedó nada pendiente (lo
      // escrito mientras viajaba el guardado también se guarda: `guardarAntesDeSalir`).
      ocupada.current = true;
      setGuardando(true);
      void (async () => {
        const fin = await guardarAntesDeSalir(() => [...entradas.current.values()], esperar);
        ocupada.current = false;
        setGuardando(false);
        if (fin.tipo === 'SALIR') return ir(destino);
        setPreguntar({ destino, que: fin.que, noSeGuardo: true });
      })();
      return false;
    };
    return {
      anotar: (clave, leer) => {
        if (leer) entradas.current.set(clave, leer);
        else entradas.current.delete(clave);
      },
      alNavegar: (href, reemplazar) => (evento) => {
        if (!salir({ href, reemplazar })) evento.preventDefault();
      },
      antesDe: (accion) => {
        if (salir({ accion })) accion();
      },
    };
  }, [router]);

  return (
    <Contexto.Provider value={contexto}>
      {children}
      <p className="salida-segura__guardando" role="status" aria-live="polite" data-guardando-antes-de-salir={guardando ? '' : undefined}>
        {guardando ? (
          <>
            <Icono nombre="reloj" tamano={15} />
            {S.guardandoAntesDeSalir}
          </>
        ) : null}
      </p>
      <CuadroDeLaSalida
        abierto={preguntar !== null}
        que={preguntar?.que ?? []}
        noSeGuardo={preguntar?.noSeGuardo ?? false}
        onSeguirEditando={() => setPreguntar(null)}
        onSalirSinGuardar={() => {
          const pendiente = preguntar;
          setPreguntar(null);
          if (!pendiente) return;
          if ('accion' in pendiente.destino) pendiente.destino.accion();
          else if (pendiente.destino.reemplazar) router.replace(pendiente.destino.href);
          else router.push(pendiente.destino.href);
        }}
      />
    </Contexto.Provider>
  );
}

/** El cuadro «Tenés cambios sin guardar» (maqueta 12): «Seguir editando» es el principal, con el foco; Escape, también. */
function CuadroDeLaSalida({ abierto, que, noSeGuardo, onSeguirEditando, onSalirSinGuardar }: { abierto: boolean; que: readonly string[]; noSeGuardo: boolean; onSeguirEditando: () => void; onSalirSinGuardar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const seguir = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      dialogo.showModal();
      seguir.current?.focus();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-que`}
      data-salida-segura
      onCancel={(e) => {
        e.preventDefault();
        onSeguirEditando();
      }}
    >
      <h2 id={`${id}-titulo`}>{S.titulo}</h2>
      <p id={`${id}-que`}>
        {S.queSePierde(que)}
        {noSeGuardo ? ` ${S.noSeGuardo}` : ''}
      </p>
      <div className="acciones">
        <button type="button" className="boton boton--quieto" data-salir-sin-guardar onClick={onSalirSinGuardar}>
          {S.salirSinGuardar}
        </button>
        <button ref={seguir} type="button" className="boton boton--primario" data-seguir-editando onClick={onSeguirEditando}>
          {S.seguirEditando}
        </button>
      </div>
    </dialog>
  );
}

/**
 * Para un enlace interno: el `onNavigate` que pasa por la guardia. Fuera del espacio profesional (sin `SalidaSegura`),
 * no hace nada. `reemplazar`: el enlace reemplaza la entrada del historial (las pestañas de un área).
 */
export function useAlNavegar(): (href: string, reemplazar?: boolean) => AlNavegar | undefined {
  const salida = useContext(Contexto);
  return (href, reemplazar = false) => (salida ? salida.alNavegar(href, reemplazar) : undefined);
}

/**
 * Para una acción que saca del editor sin cambiar de página (volver a la lista): la hace ya, o después de guardar o de
 * preguntar. Fuera del espacio profesional, la hace ya.
 */
export function useAntesDeSalir(): (accion: () => void) => void {
  const salida = useContext(Contexto);
  return (accion) => (salida ? salida.antesDe(accion) : accion());
}

/**
 * ED-65 · Una lista que abre el detalle de un elemento en el mismo lugar (las plantillas y los habituales). Cerrar el
 * detalle, abrir otro, cambiar el filtro o volver a leer la lista lo desmontan: si el detalle tiene cambios sin guardar,
 * esas acciones pasan por la guardia y preguntan, como «Volver a la lista» de las recetas. Si no tiene, van derecho,
 * aunque otro editor de la página tenga los suyos: a ese no lo tocan. El detalle avisa con `useAvisarALaLista`.
 */
export function useDetalleConGuardia(): { readonly anotar: (hay: boolean) => void; readonly antes: (accion: () => void) => void } {
  const antesDeSalir = useAntesDeSalir();
  const conCambios = useRef(false);
  const anotar = useCallback((hay: boolean) => {
    conCambios.current = hay;
  }, []);
  return { anotar, antes: (accion: () => void) => (conCambios.current ? antesDeSalir(accion) : accion()) };
}

/** El detalle de `useDetalleConGuardia` le dice a su lista si tiene cambios sin guardar, y que ya no, al cerrarse. */
export function useAvisarALaLista(hay: boolean, avisar: (hay: boolean) => void): void {
  useEffect(() => {
    avisar(hay);
    return () => avisar(false);
  }, [hay, avisar]);
}

/**
 * Un editor avisa lo que tiene sin guardar, con el nombre de lo que es («el plan en preparación»), y, si es un borrador
 * con autoguardado, cómo guardarlo antes de salir. Recargar o cerrar la pestaña con algo sin guardar pide confirmar (el
 * navegador muestra su propio aviso). Lo que nunca llegó al servidor no se guarda en el navegador.
 */
export function useCambiosParaSalir(hay: boolean, que: string, guardarAntes: GuardarAntesDeSalir | null = null): void {
  const salida = useContext(Contexto);
  const clave = useId();
  const ultimo = useRef<Entrada>({ hay, que, guardarAntes });
  ultimo.current = { hay, que, guardarAntes };
  useEffect(() => {
    if (!salida) return;
    salida.anotar(clave, () => ultimo.current);
    return () => salida.anotar(clave, null);
  }, [salida, clave]);
  useEffect(() => {
    if (!hay) return;
    const alSalir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [hay]);
}
