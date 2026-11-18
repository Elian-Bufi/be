'use client';

/**
 * La fecha (o el tramo) elegida, compartida por todos los gráficos de una página (WP-GRAFICOS fase 2, DL-174). Sin
 * proveedor, cada gráfico tiene su cursor; con proveedor, todos comparten la fecha: es lo que hace «Patrones», donde las
 * tarjetas «En el tiempo» tienen el mismo ancho y el mismo eje. La lógica del teclado es pura (`moverElCursor`).
 * Una página que ya tiene su fecha elegida (la de «Analizar») le da el proveedor controlado, y la cinta comparte esa
 * fecha con sus gráficos (WP-GRAFICOS §3.8; rama D).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { acotarAlIntervalo, fechaVistaAdentro, type IntervaloQueSeVe } from './arma-tu-grafico/fecha-compartida';
import type { CursorDeFechas } from './eje-de-fechas';

export type { CursorDeFechas } from './eje-de-fechas';

export interface CursorConAcciones extends CursorDeFechas {
  readonly elegir: (f: string | null) => void;
  readonly elegirTramo: (t: CursorDeFechas['tramo']) => void;
  /** Cambia la fecha y el tramo juntos (el teclado). */
  readonly fijar: (c: CursorDeFechas) => void;
}

const Contexto = createContext<CursorConAcciones | null>(null);

function useCursorPropio(): CursorConAcciones {
  const [cursor, setCursor] = useState<CursorDeFechas>({ fecha: null, tramo: null });
  return useMemo(
    () => ({
      ...cursor,
      elegir: (fecha: string | null) => setCursor({ fecha, tramo: null }),
      elegirTramo: (tramo: CursorDeFechas['tramo']) => setCursor((c) => ({ fecha: tramo ? (c.fecha ?? tramo.hasta) : c.fecha, tramo })),
      fijar: (c: CursorDeFechas) => setCursor(c),
    }),
    [cursor],
  );
}

export interface PropsDelProveedorDelCursor {
  readonly children: ReactNode;
  /**
   * La fecha elegida afuera, cuando la página ya tiene la suya (la de «Analizar», que vive en la URL). Con
   * `alElegirFecha`, el cursor es controlado: lo que se elige adentro (en la cinta) se le avisa a la página, y la página
   * decide la fecha. El tramo sigue adentro mientras la fecha de afuera caiga en él. Sin `alElegirFecha`, el cursor es
   * propio, como siempre.
   */
  readonly fecha?: string | null;
  readonly alElegirFecha?: (fecha: string | null) => void;
  /**
   * Lo que se ve, si la página acota la fecha elegida a eso (la de «Analizar»). El proveedor le avisa la fecha ya acotada
   * y recuerda la que se eligió adentro: un evento de la cinta que empieza antes de lo que se ve (la barra de una versión
   * vigente desde antes) sigue elegido, y la flecha pasa al siguiente (`fechaVistaAdentro`).
   */
  readonly limites?: IntervaloQueSeVe | null;
}

export function ProveedorDelCursor({ children, fecha = null, alElegirFecha, limites = null }: PropsDelProveedorDelCursor) {
  const propio = useCursorPropio();
  const [tramo, setTramo] = useState<CursorDeFechas['tramo']>(null);
  const [pedida, setPedida] = useState<string | null>(null);
  const desde = limites?.desde ?? null;
  const hasta = limites?.hasta ?? null;
  const controlado = useMemo<CursorConAcciones | null>(() => {
    if (!alElegirFecha) return null;
    const intervalo = desde !== null && hasta !== null ? { desde, hasta } : null;
    const vista = fechaVistaAdentro(fecha, pedida, intervalo);
    const vigente = tramo !== null && vista !== null && vista >= tramo.desde && vista <= tramo.hasta ? tramo : null;
    /** Le avisa a la página la fecha elegida adentro, acotada a lo que se ve, y la recuerda. */
    const avisar = (f: string | null) => {
      setPedida(f);
      alElegirFecha(f === null || intervalo === null ? f : acotarAlIntervalo(f, intervalo));
    };
    return {
      fecha: vista,
      tramo: vigente,
      elegir: (f: string | null) => {
        setTramo(null);
        avisar(f);
      },
      elegirTramo: (t: CursorDeFechas['tramo']) => {
        setTramo(t);
        // La fecha queda dentro del tramo: si la de ahora cae afuera, el tramo se perdería en el próximo dibujo.
        avisar(t ? (vista !== null && vista >= t.desde && vista <= t.hasta ? vista : t.hasta) : vista);
      },
      fijar: (c: CursorDeFechas) => {
        setTramo(c.tramo);
        avisar(c.fecha);
      },
    };
  }, [alElegirFecha, fecha, pedida, tramo, desde, hasta]);
  return <Contexto.Provider value={controlado ?? propio}>{children}</Contexto.Provider>;
}

/** El cursor de la página si hay proveedor; si no, el de este gráfico. */
export function useCursorDeFechas(): CursorConAcciones {
  const compartido = useContext(Contexto);
  const propio = useCursorPropio();
  return compartido ?? propio;
}
