/**
 * La hora del servidor, para saber qué día es «hoy» para la API (DL-117, cierre del 2026-10-04).
 *
 * Cada respuesta de la API trae la cabecera `Date`: la hora del servidor al responder, truncada al segundo. Es la misma
 * cabecera con la que la sesión mide su vigencia (`fechaDelServidor`, en el cliente de @be/domain). `api.ts` la registra
 * en todas las respuestas, también en las de error, como un 400 por período futuro.
 *
 * - **Nunca se adelanta al servidor.** Cada cabecera es, como mucho, la hora del servidor en el momento en que llega. Desde
 *   ahí, el tiempo se cuenta con un reloj **monótono** del teléfono, que no salta si la persona cambia la hora ni si la red
 *   la corrige. La hora estimada es la mejor de esas cotas: la más alta. Una respuesta que tardó en bajar da una cota más
 *   baja y se descarta sola.
 * - **No depende de la hora del teléfono**, salvo antes de la primera respuesta: entonces no hay otra fuente.
 * - **Se renueva.** Una referencia de más de diez minutos se reemplaza por la cabecera nueva aunque sea menos ajustada,
 *   porque el reloj monótono también deriva, aunque poco. Ese cambio puede atrasar la estimación un segundo; el día que
 *   muestra la app no vuelve atrás por eso (`diaSinRetroceso`).
 *
 * **Límite:** la API decide «hoy» con la hora de su base de datos, y la cabecera sale del proceso de la API. Las dos están
 * sincronizadas en el servidor, y la espera de la medianoche suma medio segundo. Si la base se atrasara más que eso, la
 * primera lectura del día nuevo podría llegar con el día anterior. La actividad lo dice, porque muestra el período que
 * respondió la API.
 *
 * Es lógica pura, sin React ni red. La alimenta `api.ts` con cada respuesta, la usa `useDiaDeLaApi`, y la prueba
 * `scripts/inicio.test.mjs` con relojes de prueba, sin esperas.
 */

/** Los relojes del teléfono que usa la estimación. En la app, `performance.now()` y `Date.now()`. */
export interface RelojesDelTelefono {
  /** Un reloj que no salta: cuenta el tiempo transcurrido aunque cambie la hora del teléfono. */
  monotono(): number;
  /** La hora del teléfono. Solo se usa antes de la primera respuesta. */
  pared(): number;
}

export interface RelojDelServidor {
  /** Registra la cabecera `Date` de una respuesta, en el momento en que llega. */
  registrar(fecha: string | null | undefined): void;
  /** La hora del servidor estimada ahora, en ms. Sin respuestas todavía, la del teléfono. */
  ahora(): number;
  /** Si ya hubo una respuesta con hora. */
  conocido(): boolean;
  /** Avisa cuando la estimación cambia un segundo o más: la pantalla vuelve a calcular el día y su próxima medianoche. */
  suscribir(oyente: () => void): () => void;
}

/** Una referencia así de vieja se reemplaza aunque la cabecera nueva sea menos ajustada: el reloj monótono deriva. */
export const VIGENCIA_DE_LA_REFERENCIA_MS = 10 * 60_000;
/** Menos que esto es el truncamiento de la cabecera: no cambia el día ni su medianoche de forma apreciable, y no se avisa. */
const AVISO_DESDE_MS = 1000;

export function crearRelojDelServidor(relojes: RelojesDelTelefono): RelojDelServidor {
  /** La mejor cota: la hora del servidor y el reloj monótono del teléfono en ese momento. */
  let referencia: { readonly servidor: number; readonly monotono: number } | null = null;
  const oyentes = new Set<() => void>();
  const proyectar = (r: { servidor: number; monotono: number }, monotono: number) => r.servidor + (monotono - r.monotono);
  return {
    registrar(fecha) {
      const servidor = fecha ? Date.parse(fecha) : Number.NaN;
      if (!Number.isFinite(servidor)) return;
      const monotono = relojes.monotono();
      const anterior = referencia ? proyectar(referencia, monotono) : null;
      const vigente = referencia !== null && monotono - referencia.monotono < VIGENCIA_DE_LA_REFERENCIA_MS;
      // Una cota más baja (una respuesta que tardó en bajar, o el truncamiento) no mejora nada, salvo que la referencia ya sea vieja.
      if (anterior !== null && servidor <= anterior && vigente) return;
      referencia = { servidor, monotono };
      if (anterior === null || Math.abs(servidor - anterior) >= AVISO_DESDE_MS) for (const oyente of oyentes) oyente();
    },
    ahora: () => (referencia ? proyectar(referencia, relojes.monotono()) : relojes.pared()),
    conocido: () => referencia !== null,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}

/** El reloj de toda la app, en el proceso. No va a disco: con cada respuesta se vuelve a medir. */
export const relojDelServidor = crearRelojDelServidor({ monotono: () => performance.now(), pared: () => Date.now() });

/**
 * El día que muestra la app no vuelve atrás: si la estimación ya pasó la medianoche, el servidor también, porque la
 * estimación nunca se le adelanta. La única excepción es el paso de la hora del teléfono a la del servidor (la primera
 * respuesta): la hora del teléfono podía ir adelantada. Devuelve el mismo objeto si nada cambia.
 */
export function diaSinRetroceso(anterior: { readonly dia: string; readonly conocido: boolean } | null, estimado: string, conocido: boolean): { readonly dia: string; readonly conocido: boolean } {
  if (anterior && anterior.dia === estimado && anterior.conocido === conocido) return anterior;
  if (anterior && anterior.conocido === conocido && estimado < anterior.dia) return anterior;
  return { dia: estimado, conocido };
}

/** Lo que el vigía usa del entorno: un temporizador. En la app, `setTimeout`; en la prueba, uno que se adelanta a mano. */
export interface Temporizador {
  /** Espera `ms` y avisa. Devuelve cómo cancelar la espera. */
  esperar(ms: number, alCumplirse: () => void): () => void;
}

/**
 * Vigila el cambio de día de la API, sin React: es lo que hace `useDiaDeLaApi`. Avisa a la medianoche del servidor y cada
 * vez que la estimación de la hora cambia. En los dos casos vuelve a programar la espera con la hora nueva. `mirar` hace
 * lo mismo a pedido: al volver del segundo plano, porque con el teléfono dormido la espera puede no haberse cumplido.
 *
 * `msHastaElCambio` recibe la hora estimada del servidor y dice cuánto falta para el día siguiente. Como la estimación
 * nunca se adelanta al servidor, cuando se cumple la espera el servidor ya está en el día nuevo.
 */
export function vigilarElDia(
  reloj: Pick<RelojDelServidor, 'ahora' | 'suscribir'>,
  msHastaElCambio: (horaDelServidor: number) => number,
  temporizador: Temporizador,
  avisar: () => void,
): { mirar(): void; parar(): void } {
  let cancelar = () => {};
  const programar = () => {
    cancelar();
    cancelar = temporizador.esperar(msHastaElCambio(reloj.ahora()), mirar);
  };
  const mirar = () => {
    avisar();
    programar();
  };
  programar();
  const desuscribir = reloj.suscribir(mirar);
  return {
    mirar,
    parar() {
      cancelar();
      desuscribir();
    },
  };
}
