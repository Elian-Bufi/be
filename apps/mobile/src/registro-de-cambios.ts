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
 * Sale enseguida si no hay nada escrito sin guardar. Si hay, pregunta, y sale solo si la persona lo confirma: entonces
 * olvida lo declarado, porque la pantalla que lo tenía se va.
 */
export function salirConCuidado(registro: RegistroDeCambios, salir: () => void, preguntar: (que: string, confirmar: () => void) => void): void {
  const que = registro.pendiente();
  if (!que) return salir();
  preguntar(que, () => {
    registro.olvidar();
    salir();
  });
}
