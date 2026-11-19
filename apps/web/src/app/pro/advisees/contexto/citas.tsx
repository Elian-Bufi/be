'use client';

/**
 * WP-CONTEXTO-DE-LA-PERSONA (CTX-D12): «Citar» va a lo que se está escribiendo. El formulario abierto (la evaluación o el
 * objetivo de Entrenamiento o de Nutrición) se anota como receptor de citas; el panel del contexto lo lee y muestra «Citar»
 * al lado de cada respuesta. Sin nada abierto, no hay receptor y «Citar» no aparece. El marco del área pone el proveedor,
 * así el panel y la sección lo comparten.
 */
import type { CitaPosible } from '@be/domain';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import type { ResultadoDeCitar } from './panel-de-contexto';

export interface ReceptorDeCitas {
  /** El área de lo que se escribe: la evaluación cita solo las de su área (DL-102, DL-179). */
  readonly area: 'ENTRENAMIENTO' | 'NUTRICION';
  readonly destino: 'evaluacion' | 'objetivo';
  /**
   * Las claves con la versión vista (`claveDeCitaVista`) de lo que ya está citado, para mostrar «Citada». Con la versión: si
   * la persona corrigió y el panel se volvió a leer, «Citar» vuelve a aparecer y reemplaza la cita vieja.
   */
  readonly citadas: ReadonlySet<string>;
  /** El tope de citas (20 en la evaluación), o `null` sin tope (el fundamento del objetivo). */
  readonly maximo: number | null;
  /** Las citas de un renglón (la respuesta y su detalle), juntas: entran todas o ninguna (`sumarCitas`). */
  readonly citar: (citas: readonly CitaPosible[]) => ResultadoDeCitar;
}

interface ContextoDeCitas {
  readonly receptor: ReceptorDeCitas | null;
  readonly anotar: (id: string, receptor: ReceptorDeCitas | null) => void;
}

const Contexto = createContext<ContextoDeCitas | null>(null);

export function ProveedorDeCitas({ children }: { children: ReactNode }) {
  // El último que se anotó manda: si hay dos abiertos, es el que se abrió después.
  const [anotados, setAnotados] = useState<readonly { readonly id: string; readonly receptor: ReceptorDeCitas }[]>([]);
  const anotar = useCallback((id: string, receptor: ReceptorDeCitas | null) => {
    setAnotados((xs) => {
      const sin = xs.filter((x) => x.id !== id);
      if (!receptor) return sin.length === xs.length ? xs : sin;
      const i = xs.findIndex((x) => x.id === id);
      if (i >= 0) return xs.map((x) => (x.id === id ? { id, receptor } : x));
      return [...sin, { id, receptor }];
    });
  }, []);
  const valor = useMemo(() => ({ receptor: anotados.at(-1)?.receptor ?? null, anotar }), [anotados, anotar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Un formulario abierto se anota como receptor mientras está montado. Fuera de un área no hace nada. */
export function useReceptorDeCitas(receptor: ReceptorDeCitas | null): void {
  const c = useContext(Contexto);
  const id = useId();
  const anotar = c?.anotar;
  useEffect(() => {
    if (!anotar) return;
    anotar(id, receptor);
  }, [anotar, id, receptor]);
  useEffect(() => () => anotar?.(id, null), [anotar, id]);
}

/** El receptor de ahora, para el panel; `null` si no hay nada abierto donde citar. */
export function useReceptorActual(): ReceptorDeCitas | null {
  return useContext(Contexto)?.receptor ?? null;
}
