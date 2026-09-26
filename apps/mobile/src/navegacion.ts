/**
 * Navegación del APK por estado, sin librería de rutas: cada pantalla es un valor de `Ruta` (App.tsx la dibuja).
 * «Atrás» (botón de Android o enlace visible) va a la pantalla lógica anterior, no a la historia cronológica, y nunca
 * cierra la sesión. La sesión vive solo en memoria (DL-012): perderla lleva a Iniciar sesión.
 */
import { CODIGOS_DE_SESION_NO_VALIDA, type Resultado, type SesionDeOcurrencia } from '@be/domain';
import { useCallback, useState } from 'react';

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
  | { readonly nombre: 'historial-de-entrenamiento' }
  | { readonly nombre: 'plan-de-entrenamiento'; readonly id: string }
  | { readonly nombre: 'mis-solicitudes' }
  | { readonly nombre: 'mi-solicitud'; readonly id: string }
  | { readonly nombre: 'sesion-de-entrenamiento'; readonly draftId: string; readonly sesion: SesionDeOcurrencia; readonly fecha: string }
  | { readonly nombre: 'ejecucion-de-entrenamiento'; readonly id: string; readonly aviso?: string; readonly origen?: 'hoy' | 'historial' };

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
    case 'historial-de-entrenamiento':
    case 'mis-solicitudes':
      return { nombre: 'cuenta' };
    case 'plan-de-entrenamiento':
      return { nombre: 'historial-de-entrenamiento' };
    case 'mi-solicitud':
      return { nombre: 'mis-solicitudes' };
    case 'sesion-de-entrenamiento':
      return { nombre: 'entrenamiento' };
    case 'ejecucion-de-entrenamiento':
      // El detalle se abre desde «Entrenamiento de hoy» y desde «Tu historial»: volver regresa al origen (DL-096).
      return ruta.origen === 'historial' ? { nombre: 'historial-de-entrenamiento' } : { nombre: 'entrenamiento' };
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
    case 'mis-solicitudes':
      return 'Volver a Información';
    case 'historial-de-entrenamiento':
      return 'Volver a Tu historial';
    default:
      return 'Volver';
  }
}

/**
 * «Escritura denegada → contenido retirado» (B10-06:1145-1148; S10-TRN-09). Si una **escritura** del asesorado recibe
 * el 404 no revelador —el mismo para inexistente, ajeno, de otro alcance o revocado (10-B04 §40)—, la pantalla no deja
 * el contenido viejo con un aviso encima: lo retira entero y queda en su estado neutral, el mismo que muestra cuando el
 * acceso está suspendido. Es el mecanismo `accesoRetirado` del website
 * (apps/web/src/app/pro/advisees/training/entrenamiento.tsx), escrito una sola vez para las pantallas del APK.
 *
 * El APK no recibe un 403 propio de «acceso suspendido»: la suspensión llega como `planState: 'NOT_AVAILABLE'` en la
 * lectura siguiente, y por eso el estado neutral es el mismo aviso que esa lectura ya dibuja.
 */
export function useAccesoRetirado(): { readonly retirado: boolean; readonly accesoRetirado: (r: Resultado<unknown>) => boolean } {
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  return { retirado, accesoRetirado };
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
