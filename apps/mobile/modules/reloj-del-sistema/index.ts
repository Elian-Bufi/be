/**
 * El módulo nativo `RelojDelSistema` (Android), o `null` donde no está: el navegador, Expo Go o una APK construida antes
 * de sumarlo. Sin él, la app usa el reloj del proceso (`reloj-de-sesion.ts`), y lo dice la base de cada instante.
 */
import { requireOptionalNativeModule } from 'expo';

export interface ModuloRelojDelSistema {
  msDesdeElArranque(): number;
  numeroDeArranque(): number | null;
}

export const RelojDelSistemaNativo: ModuloRelojDelSistema | null = requireOptionalNativeModule<ModuloRelojDelSistema>('RelojDelSistema');
