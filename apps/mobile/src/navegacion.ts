/**
 * Navegación del APK por estado, sin librería de rutas: cada pantalla es un valor de `Ruta` (App.tsx la dibuja).
 * «Atrás» (botón de Android o enlace visible) va a la pantalla lógica anterior, no a la historia cronológica, y nunca
 * cierra la sesión. La sesión vive solo en memoria (DL-012): perderla lleva a Iniciar sesión.
 */
import { CODIGOS_DE_SESION_NO_VALIDA, type Resultado, type SesionDeOcurrencia } from '@be/domain';
import { useCallback } from 'react';

export type Ruta =
  | { readonly nombre: 'bienvenida'; readonly aviso?: string }
  | { readonly nombre: 'registro' }
  | { readonly nombre: 'login'; readonly aviso?: string }
  | { readonly nombre: 'cuenta' }
  | { readonly nombre: 'vinculos' }
  | { readonly nombre: 'vinculo'; readonly id: string }
  | { readonly nombre: 'consentimiento'; readonly vinculoId: string }
  | { readonly nombre: 'privacidad' }
  | { readonly nombre: 'hoy' }
  | { readonly nombre: 'plan-actual' }
  | { readonly nombre: 'registros-nutricionales' }
  | { readonly nombre: 'registro-nutricional'; readonly id: string }
  | { readonly nombre: 'mi-evolucion' }
  | { readonly nombre: 'entrenamiento' }
  | { readonly nombre: 'sesion-de-entrenamiento'; readonly draftId: string; readonly sesion: SesionDeOcurrencia; readonly fecha: string }
  | { readonly nombre: 'ejecucion-de-entrenamiento'; readonly id: string; readonly aviso?: string };

/** Por qué termina la sesión en el APK; cada motivo tiene su aviso en App.tsx. */
export type Salida = 'sesion-cerrada' | 'sesiones-cerradas' | 'sesion-no-valida' | 'reautenticar' | 'cierre-registrado';

/** Pantallas que necesitan una sesión en memoria. */
export function requiereSesion(ruta: Ruta): boolean {
  return ruta.nombre !== 'bienvenida' && ruta.nombre !== 'registro' && ruta.nombre !== 'login';
}

/** Pantalla lógica anterior. `null`: no hay (Bienvenida y Cuenta), y el botón de Android queda en manos del sistema. */
export function anterior(ruta: Ruta): Ruta | null {
  switch (ruta.nombre) {
    case 'registro':
    case 'login':
      return { nombre: 'bienvenida' };
    case 'vinculos':
    case 'privacidad':
    case 'hoy':
    case 'mi-evolucion':
    case 'entrenamiento':
      return { nombre: 'cuenta' };
    case 'sesion-de-entrenamiento':
    case 'ejecucion-de-entrenamiento':
      return { nombre: 'entrenamiento' };
    case 'plan-actual':
    case 'registros-nutricionales':
      return { nombre: 'hoy' };
    case 'registro-nutricional':
      return { nombre: 'registros-nutricionales' };
    case 'vinculo':
      return { nombre: 'vinculos' };
    case 'consentimiento':
      return { nombre: 'vinculo', id: ruta.vinculoId };
    default:
      return null;
  }
}

/** Texto del enlace visible para volver: ninguna navegación depende solo de un gesto o del botón del sistema (10-B10 §9). */
export function textoDeVolverA(destino: Ruta): string {
  switch (destino.nombre) {
    case 'cuenta':
      return 'Volver a Cuenta';
    case 'vinculos':
      return 'Volver a Vínculos';
    case 'vinculo':
      return 'Volver al vínculo';
    case 'hoy':
      return 'Volver a Hoy';
    case 'entrenamiento':
      return 'Volver a Entrenamiento de hoy';
    case 'registros-nutricionales':
      return 'Volver a Registros';
    default:
      return 'Volver';
  }
}

/** «Esta sesión ya no sirve»: la UI olvida el token y vuelve a Iniciar sesión. Devuelve `true` si salió. */
export function useSesionPerdida(salir: (motivo: Salida) => void) {
  return useCallback(
    (r: Resultado<unknown>) => {
      if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
        salir('sesion-no-valida');
        return true;
      }
      return false;
    },
    [salir],
  );
}
