'use client';

/**
 * La fecha (o el tramo) elegida, compartida por todos los gráficos de una página (WP-GRAFICOS fase 2, DL-174). Sin
 * proveedor, cada gráfico tiene su cursor; con proveedor, todos comparten la fecha: es lo que hace «Patrones», donde las
 * tarjetas «En el tiempo» tienen el mismo ancho y el mismo eje. La lógica del teclado es pura (`moverElCursor`).
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

export function ProveedorDelCursor({ children }: { children: ReactNode }) {
  const cursor = useCursorPropio();
  return <Contexto.Provider value={cursor}>{children}</Contexto.Provider>;
}

/** El cursor de la página si hay proveedor; si no, el de este gráfico. */
export function useCursorDeFechas(): CursorConAcciones {
  const compartido = useContext(Contexto);
  const propio = useCursorPropio();
  return compartido ?? propio;
}
