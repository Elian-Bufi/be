/**
 * ED-02 y ED-65 · Salir con cambios sin guardar (WP-EDITORES-PROFESIONAL; ED-D10, decidida y reescrita).
 *
 * Antes, recargar o cerrar la pestaña avisaba (`beforeunload`), pero un enlace interno no: si el profesional escribía y en
 * menos de los 4 s de la pausa del autoguardado iba a «Mis recetas», lo escrito se perdía sin aviso. El editor de recetas
 * y las plantillas no tenían ninguna guardia. Ahora, con un enlace interno (la barra, las pestañas de la ficha y del área,
 * «Volver a la ficha»):
 * - **sin cambios,** se sale;
 * - **si todo lo que hay se puede guardar** (un borrador que se guarda solo, sin nada a medio escribir ni un conflicto),
 *   aparece «Guardando antes de salir…» y se sale con la respuesta del servidor;
 * - **si algo no se puede guardar, falla o hay un conflicto,** el cuadro «Tenés cambios sin guardar», con «Seguir
 *   editando» (el principal) y «Salir sin guardar». Una receta nunca se guarda sola: guardarla crea una versión.
 *
 * Nunca se pierde nada en silencio, y nada se guarda en el navegador (DL-148 D-5). «Atrás» del navegador queda como un
 * límite declarado.
 *
 * Sin React ni red: la regla y los textos. El cuadro y la guardia de los enlaces están en `components/salida-segura.tsx`.
 */

/** Lo que tiene sin guardar un editor abierto. */
export interface CambiosParaSalir {
  /** Qué es, para decirlo: «el plan en preparación», «la receta». */
  readonly que: string;
  /** Se puede guardar ya, sin preguntar: un borrador con autoguardado, sin nada a medio escribir ni un conflicto. */
  readonly sePuedeGuardar: boolean;
}

export type QueHacerAlSalir =
  | { readonly tipo: 'SALIR' }
  | { readonly tipo: 'GUARDAR_Y_SALIR' }
  | { readonly tipo: 'PREGUNTAR'; readonly que: readonly string[] };

/** Qué pasa al tocar un enlace interno con estos editores abiertos (solo los que tienen cambios). */
export function queHacerAlSalir(cambios: readonly CambiosParaSalir[]): QueHacerAlSalir {
  if (cambios.length === 0) return { tipo: 'SALIR' };
  if (cambios.every((c) => c.sePuedeGuardar)) return { tipo: 'GUARDAR_Y_SALIR' };
  return { tipo: 'PREGUNTAR', que: [...new Set(cambios.map((c) => c.que))] };
}

const enumerar = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);

export const COPY_SALIDA_SEGURA = {
  guardandoAntesDeSalir: 'Guardando antes de salir…',
  titulo: 'Tenés cambios sin guardar',
  queSePierde: (que: readonly string[]): string => `Si salís ahora, se pierde lo que escribiste en ${enumerar(que)} y todavía no se guardó.`,
  noSeGuardo: 'No pudimos guardarlo antes de salir: sigue acá, sin guardar.',
  seguirEditando: 'Seguir editando',
  salirSinGuardar: 'Salir sin guardar',
} as const;

/** Cuánto se espera, como mucho, a que termine un guardado que ya estaba viajando antes de mandar el de la salida. */
export const ESPERA_DE_UN_GUARDADO_EN_VIAJE_MS = 15_000;

/**
 * Lo que la guardia lee de un editor con cambios: lo último que dibujó. Es otro objeto en cada dibujo, y su `guardar` es
 * el de ese dibujo (con la versión que conocía).
 */
export interface FotoDelEditor {
  readonly hay: boolean;
  readonly que: string;
  readonly guardarAntes: {
    /** Se puede guardar ya: nada a medio escribir ni un conflicto. */
    readonly sePuede: boolean;
    /** Un guardado está viajando. */
    readonly ocupado: boolean;
    /** Guarda ya; `true` solo con la respuesta del servidor. */
    readonly guardar: () => Promise<boolean>;
  } | null;
}

/** Cuántas veces, como mucho, se guarda antes de salir: lo escrito mientras viaja un guardado va en el siguiente. */
export const RONDAS_ANTES_DE_SALIR = 3;
/** Cuánto se espera, como mucho, el dibujo que sigue a un guardado: hasta ahí, el editor no sabe qué quedó guardado. */
export const ESPERA_DEL_DIBUJO_MS = 2_000;

export type FinDeLaSalida = { readonly tipo: 'SALIR' } | { readonly tipo: 'PREGUNTAR'; readonly que: readonly string[] };

/**
 * ED-02 · «Guardando antes de salir…»: guarda lo que hay y dice si se puede salir. Se sale solo cuando ningún editor
 * tiene cambios.
 * - Un guardado que ya viajaba se espera: dos pedidos con la misma versión darían un conflicto.
 * - Después de cada guardado se espera el dibujo siguiente del editor: hasta ahí, lo que se lee es lo de antes de la
 *   respuesta (sus cambios y su versión vieja), y guardar con eso daría un conflicto.
 * - Lo escrito mientras viajaba el guardado sigue pendiente, y se guarda en la ronda siguiente (revisión adversaria de la
 *   etapa 1: antes se salía igual, y se perdía sin aviso).
 * - Si algo no se puede guardar, un guardado falla, o después de las rondas se sigue escribiendo, pregunta.
 */
export async function guardarAntesDeSalir(editores: () => readonly (() => FotoDelEditor)[], esperar: (ms: number) => Promise<unknown>): Promise<FinDeLaSalida> {
  const conCambios = () => editores().filter((leer) => leer().hay);
  const preguntar = (): FinDeLaSalida => ({ tipo: 'PREGUNTAR', que: [...new Set(conCambios().map((leer) => leer().que))] });
  for (let ronda = 0; ronda < RONDAS_ANTES_DE_SALIR; ronda++) {
    const pendientes = conCambios();
    if (pendientes.length === 0) return { tipo: 'SALIR' };
    for (const leer of pendientes) {
      for (let espera = 0; leer().guardarAntes?.ocupado && espera < ESPERA_DE_UN_GUARDADO_EN_VIAJE_MS; espera += 100) await esperar(100);
      const foto = leer();
      if (!foto.hay) continue;
      if (!foto.guardarAntes?.sePuede || foto.guardarAntes.ocupado) return preguntar();
      if (!(await foto.guardarAntes.guardar())) return preguntar();
      // Hasta el dibujo siguiente, la foto es la de antes de la respuesta. Si el editor ya no está, no hay qué esperar.
      for (let espera = 0; (leer() === foto || leer().guardarAntes?.ocupado) && editores().includes(leer); espera += 50) {
        if (espera >= ESPERA_DEL_DIBUJO_MS) return preguntar();
        await esperar(50);
      }
    }
  }
  return conCambios().length === 0 ? { tipo: 'SALIR' } : preguntar();
}
