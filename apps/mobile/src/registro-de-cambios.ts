/**
 * El registro de lo escrito sin guardar (DL-117: sin pérdidas silenciosas), sin React ni react-native, para probarlo
 * sin teléfono (`scripts/historial-navegacion.test.mjs`). Lo usan `cambios-sin-guardar.tsx` y la raíz (App.tsx).
 */

/** Lo que se perdería al salir, por pantalla o tarjeta que lo declara. */
export type RegistroDeCambios = {
  declarar(id: string, que: string | null): void;
  /** Lo primero que se perdería, o `null` si no hay nada escrito sin guardar. */
  pendiente(): string | null;
  olvidar(): void;
};

export function crearRegistroDeCambios(): RegistroDeCambios {
  const pendientes = new Map<string, string>();
  return {
    declarar(id, que) {
      if (que) pendientes.set(id, que);
      else pendientes.delete(id);
    },
    pendiente() {
      for (const que of pendientes.values()) return que;
      return null;
    },
    olvidar() {
      pendientes.clear();
    },
  };
}

/**
 * Sale enseguida si no hay nada escrito sin guardar. Si hay, pregunta, y sale solo si la persona lo confirma.
 *
 * Al confirmar no se olvida lo declarado: lo borra cada pantalla al desmontarse. Si se olvidara acá y la pantalla no se
 * desmontara, quedaría lo escrito sin declarar, y la salida siguiente lo perdería sin preguntar (revisión de la
 * candidata: tocar la raíz en la que ya se estaba).
 */
export function salirConCuidado(registro: RegistroDeCambios, salir: () => void, preguntar: (que: string, confirmar: () => void) => void): void {
  const que = registro.pendiente();
  if (!que) return salir();
  preguntar(que, salir);
}
