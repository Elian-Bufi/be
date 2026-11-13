/**
 * Lecturas protegidas de la APK durante la sesión (navegación del 2026-10-03; revisadas en la etapa A de la tanda
 * siguiente). Las reglas de la memoria están en @be/domain (`lecturas-de-la-sesion.ts`), y las del ciclo de cada
 * pantalla en `ciclo-de-lectura.ts`. Las dos tienen sus pruebas.
 *
 * Lo que ve la persona:
 * - Al entrar a una zona, la pantalla dibuja su estructura sin valores y corre la línea del encabezado hasta que la API
 *   confirma el acceso. Recién entonces aparecen los datos. Si la respuesta dice lo mismo que la última vez, se reusa lo
 *   ya calculado y se dibuja enseguida.
 * - Con la pantalla abierta, lo confirmado queda a la vista mientras se vuelve a confirmar: al volver del segundo plano
 *   (siempre, sin plazo) y después de una escritura de la misma pantalla.
 * - Si la API niega el acceso, lo confirmado se retira y la pantalla muestra su aviso. Con una falla pasajera (sin red,
 *   429, 5xx) queda lo confirmado con «No pudimos actualizar», o, si no había nada confirmado, «Reintentar».
 * - Si la sesión ya no sirve, se vuelve a Iniciar sesión y se olvida todo.
 * Se pide una vez por entrada: no se precarga nada ni se multiplica la carga sobre la API.
 */
import { crearMemoriaDeLecturas, type Resultado } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { crearCicloDeLectura, type CicloDeLectura, type EstadoDeLectura, type OpcionesDeCarga } from './ciclo-de-lectura';
import { eventoDelCiclo, horaDeLaPantalla, marcaTrasEvento, SIN_MARCA, type EventoDeLectura, type HoraDeLaPantalla, type MarcaDeLectura } from './hora-de-lo-que-ves';

/** Una sola memoria para toda la app, en el proceso. Nunca va a disco. */
export const memoria = crearMemoriaDeLecturas();

// Cuántas pantallas están confirmando lo que muestran: la línea del encabezado corre mientras haya alguna.
let enCurso = 0;
const oyentes = new Set<() => void>();
function contar(diferencia: 1 | -1): void {
  enCurso += diferencia;
  for (const oyente of oyentes) oyente();
}
const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};
const hayActualizaciones = () => enCurso > 0;

/** Para el encabezado: `true` mientras alguna pantalla confirma o actualiza lo que muestra. */
export function useHayActualizaciones(): boolean {
  return useSyncExternalStore(suscribir, hayActualizaciones);
}

// La raíz pide que todas las pantallas vuelvan a verificar desde cero: por ejemplo, si la sesión pudo vencer mientras el
// teléfono dormía (quizasVencida, en sesion-en-memoria.ts).
const oyentesDeEpoca = new Set<() => void>();
export function exigirVerificacion(): void {
  for (const oyente of oyentesDeEpoca) oyente();
}

// ─── PG-09 (WP-PULIDO-GRANDES): tirar para actualizar y la hora de lo que se ve ──────────────────
// Cada lectura a la vista deja su marca (cuándo la confirmó el servidor) y cómo volver a pedirla. La pantalla dice la
// hora más vieja de lo que muestra (`hora-de-lo-que-ves.ts`), y tirar hacia abajo vuelve a pedir todas.
const marcas = new Map<string, MarcaDeLectura>();
const recargas = new Map<string, () => Promise<void>>();
const oyentesDeLaHora = new Set<() => void>();
let horaVigente: HoraDeLaPantalla = horaDeLaPantalla([]);
function avisarLaHora(): void {
  const nueva = horaDeLaPantalla(marcas.values());
  if (nueva.hora === horaVigente.hora && nueva.fallo === horaVigente.fallo) return;
  horaVigente = nueva;
  for (const oyente of oyentesDeLaHora) oyente();
}
function marcar(id: string, evento: EventoDeLectura): void {
  marcas.set(id, marcaTrasEvento(marcas.get(id) ?? SIN_MARCA, evento, Date.now()));
  avisarLaHora();
}
function olvidarLaMarca(id: string): void {
  marcas.delete(id);
  recargas.delete(id);
  avisarLaHora();
}
const suscribirALaHora = (oyente: () => void) => {
  oyentesDeLaHora.add(oyente);
  return () => {
    oyentesDeLaHora.delete(oyente);
  };
};

/** La hora de lo que se ve en la pantalla: la más vieja de lo confirmado, y si algo no se pudo actualizar. */
export function useHoraDeLoQueVes(): HoraDeLaPantalla {
  return useSyncExternalStore(suscribirALaHora, () => horaVigente);
}

/** La hora de ahora, para el anuncio de App.tsx al terminar de tirar. */
export const horaDeLoQueVesAhora = (): HoraDeLaPantalla => horaVigente;

/** Tirar hacia abajo: vuelve a pedir todo lo que está a la vista, con lo confirmado a la vista mientras tanto. */
export async function actualizarLoQueSeVe(): Promise<void> {
  await Promise.all([...recargas.values()].map((recargar) => recargar().catch(() => undefined)));
}

/**
 * Para una lectura que no usa `useLecturaRecordada` (la lista paginada de Novedades): deja su marca con cada evento y se
 * ofrece para volver a pedir al tirar. `recargar` tiene que ser estable.
 */
export function useMarcaDeLectura(evento: EventoDeLectura, recargar: () => Promise<void>): void {
  const id = useId();
  useEffect(() => {
    recargas.set(id, recargar);
    return () => olvidarLaMarca(id);
  }, [id, recargar]);
  useEffect(() => marcar(id, evento), [id, evento]);
}

export interface LecturaRecordada<T> {
  /** Lo que la pantalla dibuja. `null` mientras se verifica la entrada: estructura sin valores. */
  readonly r: Resultado<T> | null;
  /** Hay datos confirmados a la vista y se están confirmando de nuevo. */
  readonly actualizando: boolean;
  /** La última confirmación falló de forma pasajera y quedó a la vista lo confirmado antes en esta entrada. */
  readonly sinActualizar: boolean;
  readonly cargar: (opciones?: OpcionesDeCarga) => Promise<void>;
}

/** Sin nada confirmado y sin una respuesta que valga: se presenta como un error común, con «Reintentar». */
const SIN_CONFIRMAR: Resultado<never> = { ok: false, tipo: 'API', status: 0, codigo: 'NO_CONFIRMADO', issues: [] };

function comoResultado<T>(estado: EstadoDeLectura<T>): Resultado<T> | null {
  switch (estado.tipo) {
    case 'verificando':
      return null;
    case 'listo':
      return { ok: true, datos: estado.datos };
    case 'rechazado':
      return estado.falla;
    case 'sin-confirmar':
      return estado.falla ?? SIN_CONFIRMAR;
  }
}

/**
 * Reemplaza el `useState` + `cargar` de una pantalla que lee al entrar. `pedir` y `sesionPerdida` tienen que ser
 * estables (`useCallback`). La clave tiene que nombrar todo lo que cambia la respuesta: la zona, el día, el período, la
 * elección.
 */
export function useLecturaRecordada<T>(token: string, clave: string, pedir: () => Promise<Resultado<T>>, sesionPerdida: (r: Resultado<unknown>) => boolean): LecturaRecordada<T> {
  // El estado lleva la clave con la que se obtuvo: si la clave cambió y el efecto todavía no corrió, no se dibuja lo de
  // la clave anterior.
  const [conClave, setConClave] = useState<{ readonly clave: string; readonly estado: EstadoDeLectura<T> }>({ clave, estado: { tipo: 'verificando' } });
  const estado: EstadoDeLectura<T> = conClave.clave === clave ? conClave.estado : { tipo: 'verificando' };
  const ciclo = useRef<CicloDeLectura<T> | null>(null);
  const idDeLaMarca = useId();

  useEffect(() => {
    const c = crearCicloDeLectura<T>({
      memoria,
      token,
      clave,
      pedir,
      sesionPerdida,
      alCambiar: (nuevo) => {
        // PG-09: la marca de esta lectura, con lo que le pasó (pedir no mueve la hora; confirmar, sí).
        marcar(idDeLaMarca, eventoDelCiclo(nuevo));
        setConClave({ clave, estado: nuevo });
      },
    });
    ciclo.current = c;
    recargas.set(idDeLaMarca, () => c.cargar());
    setConClave({ clave, estado: { tipo: 'verificando' } });
    void c.cargar();
    return () => {
      c.terminar();
      if (ciclo.current === c) ciclo.current = null;
      olvidarLaMarca(idDeLaMarca);
    };
  }, [token, clave, pedir, sesionPerdida, idDeLaMarca]);

  // La línea del encabezado corre mientras la pantalla confirma, al entrar o al actualizar.
  const ocupada = estado.tipo === 'verificando' || (estado.tipo === 'listo' && estado.actualizando);
  useEffect(() => {
    if (!ocupada) return;
    contar(1);
    return () => contar(-1);
  }, [ocupada]);

  // Al volver del segundo plano se confirma de nuevo, siempre: la API pudo revocar el acceso mientras tanto.
  useEffect(() => {
    let anterior = AppState.currentState;
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento === 'active' && anterior !== 'active') void ciclo.current?.cargar();
      anterior = momento;
    });
    return () => suscripcion.remove();
  }, []);

  // Cuando la raíz exige verificar de nuevo, la pantalla deja de mostrar lo confirmado hasta que la API conteste.
  useEffect(() => {
    const alExigir = () => void ciclo.current?.cargar({ desdeCero: true });
    oyentesDeEpoca.add(alExigir);
    return () => {
      oyentesDeEpoca.delete(alExigir);
    };
  }, []);

  const cargar = useCallback((opciones?: OpcionesDeCarga) => ciclo.current?.cargar(opciones) ?? Promise.resolve(), []);
  return {
    r: comoResultado(estado),
    actualizando: estado.tipo === 'listo' && estado.actualizando,
    sinActualizar: estado.tipo === 'listo' && estado.sinActualizar,
    cargar,
  };
}

/** Una elección de la pantalla que se recuerda al volver, mientras dure la sesión: qué día del plan, qué familia. */
export function useSeleccionRecordada<T>(token: string, clave: string, inicial: T): readonly [T, (valor: T) => void] {
  const [valor, setValor] = useState<T>(() => memoria.leerSeleccion<T>(token, clave) ?? inicial);
  const elegir = useCallback(
    (nuevo: T) => {
      memoria.recordarSeleccion(token, clave, nuevo);
      setValor(nuevo);
    },
    [token, clave],
  );
  return [valor, elegir] as const;
}
