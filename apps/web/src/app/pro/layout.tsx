import type { ReactNode } from 'react';
import { AntesDeSeguir } from '../../components/antes-de-seguir';
import { SalidaSegura } from '../../components/salida-segura';
import { SegundoFactorDelProfesional } from '../../components/segundo-factor-del-profesional';

/**
 * Todo `/pro` pasa por dos compuertas, en este orden:
 * 1. **«Antes de seguir»** (WP-USO-FINAL UF-01, UF-D4): con una sesión, primero lo que le falta a la cuenta para seguir,
 *    como su nombre personal. Es la misma compuerta que la de `/account`.
 * 2. **El segundo factor del profesional** (UF-11, UF-D12): antes de ver a una persona, el código de la aplicación de
 *    códigos, una vez por sesión; la primera vez, se configura. `/account` no lo pide: es de la persona.
 *
 * ED-02 y ED-65 (WP-EDITORES-PROFESIONAL): un enlace interno con cambios sin guardar guarda antes de salir o pregunta
 * (`SalidaSegura`).
 */
export default function LayoutDelEspacioProfesional({ children }: { children: ReactNode }) {
  return (
    <SalidaSegura>
      <AntesDeSeguir espacio="pro">
        <SegundoFactorDelProfesional>{children}</SegundoFactorDelProfesional>
      </AntesDeSeguir>
    </SalidaSegura>
  );
}
