/**
 * PG-05 de WP-PULIDO-GRANDES (DL-173, con PG-D3 a ratificar): la pantalla no se apaga mientras corre la sesión, con el
 * teléfono apoyado en el banco y el descanso a la vista, como en Strong y Hevy. Es lógica pura: la usa
 * `pantalla-encendida-en-la-sesion.ts` (con expo-keep-awake) y la prueba `pantalla-encendida.test.ts` (TEST-PG-004).
 *
 * - **Se prende** desde «Iniciar entrenamiento», con la sesión corriendo en vivo y la app adelante.
 * - **Se libera** al pausar, al finalizar, al salir de la sesión o al mandar la app a segundo plano. Al volver a la sesión
 *   en curso (o a primer plano, o al reanudar), se prende otra vez.
 * - **Con la casilla apagada,** nunca se pide.
 * - No sube el brillo, no la deja prendida fuera de la sesión y no la prende en Nutrición.
 */

export interface CondicionesDeLaPantalla {
  /** La sesión corre en vivo: iniciada, sin pausa y sin finalizar. */
  readonly corriendo: boolean;
  /** La app está adelante. */
  readonly primerPlano: boolean;
  /** La casilla «Mantener la pantalla encendida durante la sesión». */
  readonly preferencia: boolean;
}

export const debeEstarEncendida = (c: CondicionesDeLaPantalla): boolean => c.preferencia && c.corriendo && c.primerPlano;

/** Lo que hace el teléfono: prender o liberar la pantalla. */
export interface PantallaDelTelefono {
  prender(): void;
  liberar(): void;
}

export interface ControlDeLaPantalla {
  /** Con lo que corresponde ahora: prende o libera solo si cambia. */
  actualizar(debe: boolean): void;
  /** La pantalla de la sesión se fue: si estaba prendida, la libera. */
  terminar(): void;
  prendida(): boolean;
}

export function crearControlDeLaPantalla(pantalla: PantallaDelTelefono): ControlDeLaPantalla {
  let prendida = false;
  const liberar = () => {
    if (!prendida) return;
    prendida = false;
    pantalla.liberar();
  };
  return {
    actualizar(debe) {
      if (!debe) return liberar();
      if (prendida) return;
      prendida = true;
      pantalla.prender();
    },
    terminar: liberar,
    prendida: () => prendida,
  };
}
