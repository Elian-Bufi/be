import type { ReactNode } from 'react';
import { AntesDeSeguir } from '../../components/antes-de-seguir';

/**
 * Todo `/account` pasa por «Antes de seguir» (WP-USO-FINAL UF-01, UF-D4): con una sesión, primero lo que le falta a la
 * cuenta para seguir, como su nombre. Es la misma compuerta que la de `/pro`.
 */
export default function LayoutDeCuenta({ children }: { children: ReactNode }) {
  return <AntesDeSeguir espacio="cuenta">{children}</AntesDeSeguir>;
}
