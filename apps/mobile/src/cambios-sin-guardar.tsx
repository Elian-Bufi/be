/**
 * «Sin pérdidas silenciosas» (DL-117, decisión de Dirección del 2026-10-04). Una pantalla con algo escrito y todavía sin
 * guardar lo declara (`useCambiosSinGuardar`). Salir de ella por la barra, la cabecera, el avatar, el menú o el botón
 * atrás pregunta antes, con el diálogo del sistema, que es accesible y dice qué se pierde. «Seguir acá» es la salida
 * segura, y es la que elige el botón atrás sobre el diálogo.
 *
 * Solo preguntan esas salidas, que son las mismas en toda la app. Lo que una pantalla hace por sí misma (registrar y
 * pasar al detalle, ir a Privacidad desde un aviso) lo decide esa pantalla. Que la sesión termine tampoco pregunta: el
 * aviso de la sesión dice por qué se salió.
 *
 * No guarda nada en el teléfono: lo escrito vive en la pantalla, y la declaración solo dice que existe. El registro, sin
 * React, está en `registro-de-cambios.ts`.
 */
import { createContext, useContext, useEffect, useId, type ReactNode } from 'react';
import { Alert } from 'react-native';
import type { RegistroDeCambios } from './registro-de-cambios';

const Contexto = createContext<RegistroDeCambios | null>(null);

export function ProveedorDeCambios({ registro, children }: { registro: RegistroDeCambios; children: ReactNode }) {
  return <Contexto.Provider value={registro}>{children}</Contexto.Provider>;
}

/**
 * Declara lo que se perdería al salir, dicho para la persona («el registro de «Almuerzo»»), o `null` si no hay nada
 * escrito sin guardar. Al desmontarse, la pantalla deja de declararlo.
 */
export function useCambiosSinGuardar(que: string | null): void {
  const registro = useContext(Contexto);
  const id = useId();
  useEffect(() => {
    registro?.declarar(id, que);
  }, [registro, id, que]);
  useEffect(() => () => registro?.declarar(id, null), [registro, id]);
}

/** Pregunta antes de salir con algo escrito sin guardar. `confirmar` corre solo si la persona lo elige. */
export function preguntarAntesDeSalir(que: string, confirmar: () => void): void {
  Alert.alert(
    '¿Salir sin guardar?',
    `Todavía no guardaste ${que}. Si salís ahora, se pierde lo que escribiste.`,
    [
      { text: 'Seguir acá', style: 'cancel' },
      { text: 'Salir sin guardar', style: 'destructive', onPress: confirmar },
    ],
    { cancelable: true },
  );
}
