import type { ReactNode } from 'react';
import { AntesDeSeguir } from '../../components/antes-de-seguir';
import { SalidaSegura } from '../../components/salida-segura';

/**
 * Todo `/pro` pasa por «Antes de seguir» (WP-USO-FINAL UF-01, UF-D4): con una sesión, primero lo que le falta a la
 * cuenta para seguir, como su nombre personal. Es la misma compuerta que la de `/account`.
 *
 * ED-02 y ED-65 (WP-EDITORES-PROFESIONAL): un enlace interno con cambios sin guardar guarda antes de salir o pregunta
 * (`SalidaSegura`).
 */
export default function LayoutDelEspacioProfesional({ children }: { children: ReactNode }) {
  return (
    <SalidaSegura>
      <AntesDeSeguir espacio="pro">{children}</AntesDeSeguir>
    </SalidaSegura>
  );
}
