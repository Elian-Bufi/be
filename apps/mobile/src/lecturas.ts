/**
 * Lecturas recordadas durante la sesión (navegación, 2026-10-03). Las reglas están en @be/domain
 * (`lecturas-de-la-sesion.ts`) y tienen sus pruebas allá.
 *
 * Al volver a una zona, la pantalla muestra al instante lo último que leyó en esta sesión y lo vuelve a pedir en
 * silencio, con «Actualizando…» discreto. La respuesta nueva manda:
 * - si sale bien, reemplaza a la recordada;
 * - si la API niega el acceso o rechaza el pedido, lo recordado se borra y la pantalla muestra lo que corresponde, como
 *   antes;
 * - si la falla es pasajera (sin red, 429, 5xx), queda lo recordado con un aviso y «Reintentar»;
 * - si la sesión ya no sirve, se vuelve a Iniciar sesión y se olvida todo.
 * Se pide una vez por visita, como antes: no se precarga nada ni se multiplica la carga sobre la API.
 */
import { crearMemoriaDeLecturas, clasificarFalla, type Resultado } from '@be/domain';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/** Una sola memoria para toda la app, en el proceso. Nunca va a disco. */
export const memoria = crearMemoriaDeLecturas();

// Cuántas pantallas están volviendo a pedir lo que ya muestran: la línea del encabezado corre mientras haya alguna.
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

/** Para el encabezado: `true` mientras alguna pantalla actualiza en silencio lo que muestra. */
export function useHayActualizaciones(): boolean {
  return useSyncExternalStore(suscribir, hayActualizaciones);
}

export interface LecturaRecordada<T> {
  /** Lo que la pantalla dibuja: `null` solo mientras carga sin nada que mostrar. */
  readonly r: Resultado<T> | null;
  /** Hay datos a la vista y se están pidiendo de nuevo. */
  readonly actualizando: boolean;
  /** El último pedido falló de forma pasajera y quedó a la vista lo leído antes en esta sesión. */
  readonly sinActualizar: boolean;
  readonly cargar: () => Promise<void>;
}

/** Al volver del segundo plano se vuelve a pedir lo que está a la vista, si se leyó hace más que esto. */
const VOLVER_A_PEDIR_AL_VOLVER_MS = 30_000;

/**
 * Si la respuesta nueva dice lo mismo que la que se ve, queda la que se ve: con el mismo objeto, la pantalla no vuelve a
 * calcular ni a dibujar nada (la comparación cuesta mucho menos que redibujar la figura de «Mi evolución»).
 */
function conservarSiEsIgual<T>(nuevo: Resultado<T> & { ok: true }, aLaVista: Resultado<T> | null): Resultado<T> & { ok: true } {
  return aLaVista?.ok && JSON.stringify(aLaVista.datos) === JSON.stringify(nuevo.datos) ? aLaVista : nuevo;
}

interface Estado<T> {
  readonly clave: string;
  readonly r: Resultado<T> | null;
  readonly actualizando: boolean;
  readonly sinActualizar: boolean;
}

/**
 * Reemplaza el `useState` + `cargar` de una pantalla que lee al entrar. `pedir` tiene que ser estable (`useCallback`) y
 * devolver el resultado de la API tal cual: esta función decide qué se guarda y qué se muestra.
 */
export function useLecturaRecordada<T>(token: string, clave: string, pedir: () => Promise<Resultado<T>>, sesionPerdida: (r: Resultado<unknown>) => boolean): LecturaRecordada<T> {
  const [estado, setEstado] = useState<Estado<T>>(() => {
    const recordada = memoria.leer<T>(token, clave);
    return { clave, r: recordada === undefined ? null : { ok: true, datos: recordada }, actualizando: false, sinActualizar: false };
  });
  const aLaVista = useRef(estado);
  aLaVista.current = estado;
  const ultimoPedido = useRef(0);
  const montada = useRef(true);
  const leidaEn = useRef(0);
  const contando = useRef(false);
  const marcarActualizando = useCallback((si: boolean) => {
    if (contando.current === si) return;
    contando.current = si;
    contar(si ? 1 : -1);
  }, []);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
      marcarActualizando(false);
    };
  }, [marcarActualizando]);

  const cargar = useCallback(async () => {
    const pedido = ++ultimoPedido.current;
    const antes = aLaVista.current;
    const recordada = memoria.leer<T>(token, clave);
    // Mientras se pide, queda lo que ya se ve de esta misma lectura o lo recordado; si no hay nada, «Cargando…».
    const mientras: Resultado<T> | null = antes.clave === clave && antes.r?.ok ? antes.r : recordada === undefined ? null : { ok: true, datos: recordada };
    setEstado({ clave, r: mientras, actualizando: mientras !== null, sinActualizar: false });
    marcarActualizando(mientras !== null);

    for (let intento = 1; intento <= 3; intento++) {
      const marca = memoria.marca(token);
      const res = await pedir();
      // Una respuesta de otra visita o de un pedido viejo de esta pantalla no toca nada.
      if (!montada.current || pedido !== ultimoPedido.current) return;
      if (sesionPerdida(res)) return marcarActualizando(false);
      // Se pidió antes de que algo se olvidara (una escritura, por ejemplo): no se guarda ni se muestra, se pide de nuevo.
      if (marca !== memoria.marca(token) && intento < 3) continue;
      leidaEn.current = Date.now();
      marcarActualizando(false);
      if (res.ok) {
        const vigente = conservarSiEsIgual(res, mientras);
        memoria.guardar(token, marca, clave, vigente.datos);
        setEstado({ clave, r: vigente, actualizando: false, sinActualizar: false });
      } else if (mientras && clasificarFalla(res) === 'pasajera') {
        setEstado({ clave, r: mientras, actualizando: false, sinActualizar: true });
      } else {
        memoria.olvidar(clave);
        setEstado({ clave, r: res, actualizando: false, sinActualizar: false });
      }
      return;
    }
  }, [token, clave, pedir, sesionPerdida, marcarActualizando]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Al volver del segundo plano: lo que está a la vista pudo cambiar, o el acceso pudo revocarse desde otro dispositivo.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento === 'active' && Date.now() - leidaEn.current >= VOLVER_A_PEDIR_AL_VOLVER_MS) void cargar();
    });
    return () => suscripcion.remove();
  }, [cargar]);

  const deEstaClave = estado.clave === clave;
  return { r: deEstaClave ? estado.r : null, actualizando: deEstaClave && estado.actualizando, sinActualizar: deEstaClave && estado.sinActualizar, cargar };
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
