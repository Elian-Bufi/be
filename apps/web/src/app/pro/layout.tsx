import type { ReactNode } from 'react';
import { AntesDeSeguir } from '../../components/antes-de-seguir';

/**
 * Todo `/pro` pasa por «Antes de seguir» (WP-USO-FINAL UF-01, UF-D4): con una sesión, primero lo que le falta a la
 * cuenta para seguir, como su nombre personal. Es la misma compuerta que la de `/account`.
 */
export default function LayoutDelEspacioProfesional({ children }: { children: ReactNode }) {
  return <AntesDeSeguir espacio="pro">{children}</AntesDeSeguir>;
}
