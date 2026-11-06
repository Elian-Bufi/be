'use client';

/**
 * Lo que comparten Resumen, Línea de tiempo y Analizar: la sesión, el asesorado, el período y la navegación por la URL.
 * Las lecturas van siempre a la API, que decide con el PDP en cada una: no hay caché de datos de salud en el navegador.
 *
 * WP-DASHBOARD-COMPRENSION:
 * - **Acceso actual (§3.A):** si una lectura dice que un área ya no está disponible, se avisa a la ficha, que vuelve a
 *   preguntar el estado de los vínculos y del resumen: el encabezado nunca dice «Activo» mientras el análisis dice «No
 *   disponible». Una falla de red no es una revocación: solo avisa la respuesta explícita de la API.
 * - **Lecturas de a pocas:** como mucho cuatro a la vez (`limitarLectura`): la ficha completa pide varias proyecciones y
 *   una base cargada responde mejor de a pocas que todas juntas.
 */
import { usePathname, useSearchParams } from 'next/navigation';
import { cambiarLaDireccion } from '../../../../lib/direccion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DashboardResponse, DominioDeAnalisis } from '@be/domain';
import type { Resultado } from '../../../../lib/api';
import { motivoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { hrefConCambios, leerPeriodo, type Periodo } from './estado';

// Las fallas de una lectura viven en `lib/fallas` (las usa también el Espacio profesional): acá se vuelven a exportar
// para las vistas de la ficha.
export { motivoDeFalla, razonDeFalla, textoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';

/**
 * El resumen por dominio de API-DSH-03, tal como lo leyó la ficha: también es el acceso actual por área. Si la lectura
 * falló, guarda por qué: «esperá un minuto» no es lo mismo que «revisá la conexión», y la ficha lo dice.
 */
export type PanelDelResumen =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'listo'; readonly datos: DashboardResponse['data'] };

export interface ContextoDelSeguimiento {
  readonly token: string;
  /** API-DSH-03 de la ficha (planes, objetivos, revisiones y disponibilidad por área). */
  readonly panel: PanelDelResumen;
  readonly recargarPanel: () => void;
  /** Sube cuando cambió lo que se puede leer, y cuando se pide «Actualizar»: las lecturas de la ficha se repiten. */
  readonly versionDeAcceso: number;
  readonly asesoradoId: string;
  /**
   * Una lectura dijo que un área no está disponible con el acceso de ahora: la ficha vuelve a preguntar el acceso actual
   * (vínculos y resumen) si el encabezado todavía la mostraba disponible. Sin dominio: no se sabe cuál (un 404 general).
   */
  readonly avisarSinAcceso: (dominio: DominioDeAnalisis | null) => void;
  /** El nombre visible del asesorado en la ficha (el mismo del encabezado), o null si todavía no se leyó. */
  readonly nombreDelAsesorado: string | null;
  readonly periodo: Periodo;
  readonly parametros: URLSearchParams;
  /** Verdadero si la respuesta cerró la sesión (la UI ya redirige). */
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** La URL de la ficha con cambios en la query (`null` quita). */
  readonly href: (cambios: Readonly<Record<string, string | null>>) => string;
  /** Navega a esa URL reemplazando la entrada del historial (los filtros no llenan el «Atrás» del navegador). */
  readonly ir: (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => void;
  /** La identidad del profesional que mira la ficha: decide, por ejemplo, si una nota de coordinación es suya. */
  readonly yoId: string;
  /** DL-140: abre «Escribir una nota de coordinación» (el diálogo vive en la ficha), o la corrección de una nota propia. */
  readonly abrirNota: (pedido: PedidoDeNota) => void;
}

/** Lo que se le pide al diálogo de la nota: escribir una nueva, o corregir una propia con otra que la cita (CRD-D7). */
export interface PedidoDeNota {
  readonly corrige?: { readonly noteId: string; readonly fecha: string; readonly origen: DominioDeAnalisis } | null;
}

const Contexto = createContext<ContextoDelSeguimiento | null>(null);

export function useSeguimiento(): ContextoDelSeguimiento {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSeguimiento fuera de la ficha del asesorado');
  return c;
}

export function ProveedorDelSeguimiento({
  token,
  asesoradoId,
  nombreDelAsesorado,
  sesionPerdida,
  avisarSinAcceso,
  panel,
  recargarPanel,
  versionDeAcceso,
  yoId,
  abrirNota,
  children,
}: {
  token: string;
  asesoradoId: string;
  nombreDelAsesorado: string | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  avisarSinAcceso: (dominio: DominioDeAnalisis | null) => void;
  panel: PanelDelResumen;
  recargarPanel: () => void;
  versionDeAcceso: number;
  yoId: string;
  abrirNota: (pedido: PedidoDeNota) => void;
  children: ReactNode;
}) {
  const params = useSearchParams();
  const ruta = usePathname();
  const clave = params.toString();
  const parametros = useMemo(() => new URLSearchParams(clave), [clave]);
  const periodo = useMemo(() => leerPeriodo(parametros), [parametros]);
  const href = useCallback((cambios: Readonly<Record<string, string | null>>) => hrefConCambios(ruta, parametros, cambios), [ruta, parametros]);
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => {
      const destino = hrefConCambios(ruta, parametros, cambios);
      // Sin pedido al servidor: sin conexión, el enrutador navegaba a la página de error del navegador (bloque 3).
      cambiarLaDireccion(destino, { agregarAlHistorial: opciones?.agregarAlHistorial });
    },
    [ruta, parametros],
  );
  const valor = useMemo(
    () => ({ token, asesoradoId, avisarSinAcceso, panel, recargarPanel, versionDeAcceso, nombreDelAsesorado, periodo, parametros, sesionPerdida, href, ir, yoId, abrirNota }),
    [token, asesoradoId, avisarSinAcceso, panel, recargarPanel, versionDeAcceso, nombreDelAsesorado, periodo, parametros, sesionPerdida, href, ir, yoId, abrirNota],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// ─── Lecturas de a pocas ───────────────────────────────────────────────────────────────────────

const LECTURAS_SIMULTANEAS = 4;
let enCurso = 0;
const enEspera: (() => void)[] = [];

/** Corre una lectura cuando hay lugar: como mucho cuatro a la vez en toda la ficha. No guarda nada: solo ordena. */
export async function limitarLectura<T>(leer: () => Promise<T>): Promise<T> {
  if (enCurso >= LECTURAS_SIMULTANEAS) await new Promise<void>((listo) => enEspera.push(listo));
  enCurso++;
  try {
    return await leer();
  } finally {
    enCurso--;
    enEspera.shift()?.();
  }
}

// ─── Lecturas con guarda de respuesta tardía ───────────────────────────────────────────────────

export type Lectura<T> = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly datos: T } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Una lectura de la API identificada por `clave` (asesorado, período, filtros…). Si la clave cambia antes de que llegue la
 * respuesta anterior, esa respuesta se descarta: una respuesta tardía nunca pinta datos de otro asesorado ni de otro
 * filtro (encargo §15; PRO-21). `null` como clave: no se lee.
 */
export function useLectura<T>(clave: string | null, leer: () => Promise<Resultado<T>>, dominio: DominioDeAnalisis | null = null): { readonly lectura: Lectura<T>; readonly recargar: () => void } {
  const { sesionPerdida, avisarSinAcceso, versionDeAcceso } = useSeguimiento();
  const [lectura, setLectura] = useState<Lectura<T>>({ tipo: 'cargando' });
  const generacion = useRef(0);
  const leerRef = useRef(leer);
  leerRef.current = leer;
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (clave === null) return;
    const esta = ++generacion.current;
    setLectura({ tipo: 'cargando' });
    void limitarLectura(() => leerRef.current()).then((r) => {
      if (esta !== generacion.current) return;
      if (sesionPerdida(r)) return;
      if (r.ok) setLectura({ tipo: 'listo', datos: r.datos });
      else if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') {
        setLectura({ tipo: 'no-disponible' });
        avisarSinAcceso(dominio);
      } else setLectura({ tipo: 'error', motivo: motivoDeFalla(r) });
    });
    // `dominio` y `avisarSinAcceso` no cambian la lectura: no la repiten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, vuelta, sesionPerdida, versionDeAcceso]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, recargar };
}
