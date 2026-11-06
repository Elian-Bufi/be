import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ProveedorDeSesionAdministrativa } from '../../lib/sesion-administrativa';
import { EncabezadoAdministrativo } from './encabezado-administrativo';

export const metadata: Metadata = { title: 'Administración · BE' };

/**
 * Website `/admin` — la consola de Administración (WP-ADMINISTRACION, DL-155; UC-ADM-01 a 05). Tiene su propia sesión
 * (`ProveedorDeSesionAdministrativa`), con segundo factor, y su propia barra: no comparte nada con la sesión de
 * profesionales y personas. El servidor exige el rol y el segundo factor en cada operación; lo que esta consola muestra u
 * oculta no autoriza nada.
 */
export default function LayoutDeAdministracion({ children }: { children: ReactNode }) {
  return (
    <ProveedorDeSesionAdministrativa>
      <EncabezadoAdministrativo />
      {children}
    </ProveedorDeSesionAdministrativa>
  );
}
