'use client';

/**
 * La fecha (o el tramo) elegida, compartida por todos los gráficos de una página (WP-GRAFICOS fase 2, DL-174). Sin
 * proveedor, cada gráfico tiene su cursor; con proveedor, todos comparten la fecha: es lo que hace «Patrones», donde las
 * tarjetas «En el tiempo» tienen el mismo ancho y el mismo eje. La lógica del teclado es pura (`moverElCursor`).
 * Una página que ya tiene su fecha elegida (la de «Analizar») le da el proveedor controlado, y la cinta comparte esa
 * fecha con sus gráficos (WP-GRAFICOS §3.8; rama D).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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
}

export function ProveedorDelCursor({ children, fecha = null, alElegirFecha }: PropsDelProveedorDelCursor) {
  const propio = useCursorPropio();
  const [tramo, setTramo] = useState<CursorDeFechas['tramo']>(null);
  const controlado = useMemo<CursorConAcciones | null>(() => {
    if (!alElegirFecha) return null;
    const vigente = tramo !== null && fecha !== null && fecha >= tramo.desde && fecha <= tramo.hasta ? tramo : null;
    return {
      fecha,
      tramo: vigente,
      elegir: (f: string | null) => {
        setTramo(null);
        alElegirFecha(f);
      },
      elegirTramo: (t: CursorDeFechas['tramo']) => {
        setTramo(t);
        alElegirFecha(t ? (fecha ?? t.hasta) : fecha);
      },
      fijar: (c: CursorDeFechas) => {
        setTramo(c.tramo);
        alElegirFecha(c.fecha);
      },
    };
  }, [alElegirFecha, fecha, tramo]);
  return <Contexto.Provider value={controlado ?? propio}>{children}</Contexto.Provider>;
}

/** El cursor de la página si hay proveedor; si no, el de este gráfico. */
export function useCursorDeFechas(): CursorConAcciones {
  const compartido = useContext(Contexto);
  const propio = useCursorPropio();
  return compartido ?? propio;
}
