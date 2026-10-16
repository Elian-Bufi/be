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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DashboardResponse, DominioDeAnalisis } from '@be/domain';
import type { Resultado } from '../../../../lib/api';
import { hrefConCambios, leerPeriodo, type Periodo } from './estado';

/** El resumen por dominio de API-DSH-03, tal como lo leyó la ficha: también es el acceso actual por área. */
export type PanelDelResumen = { readonly tipo: 'cargando' } | { readonly tipo: 'error' } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'listo'; readonly datos: DashboardResponse['data'] };

export interface ContextoDelSeguimiento {
  readonly token: string;
  /** API-DSH-03 de la ficha (planes, objetivos, revisiones y disponibilidad por área). */
  readonly panel: PanelDelResumen;
  readonly recargarPanel: () => void;
  /** Sube cuando cambió lo que se puede leer: las lecturas de la ficha se repiten con el acceso nuevo. */
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
  children: ReactNode;
}) {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const clave = params.toString();
  const parametros = useMemo(() => new URLSearchParams(clave), [clave]);
  const periodo = useMemo(() => leerPeriodo(parametros), [parametros]);
  const href = useCallback((cambios: Readonly<Record<string, string | null>>) => hrefConCambios(ruta, parametros, cambios), [ruta, parametros]);
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => {
      const destino = hrefConCambios(ruta, parametros, cambios);
      if (opciones?.agregarAlHistorial) router.push(destino, { scroll: false });
      else router.replace(destino, { scroll: false });
    },
    [router, ruta, parametros],
  );
  const valor = useMemo(
    () => ({ token, asesoradoId, avisarSinAcceso, panel, recargarPanel, versionDeAcceso, nombreDelAsesorado, periodo, parametros, sesionPerdida, href, ir }),
    [token, asesoradoId, avisarSinAcceso, panel, recargarPanel, versionDeAcceso, nombreDelAsesorado, periodo, parametros, sesionPerdida, href, ir],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// ─── Fallas: por qué no llegó una lectura ──────────────────────────────────────────────────────

/** Por qué falló una lectura. Decide el texto; el código de la API nunca se muestra (10-B01:1146-1189). */
export type MotivoDeFalla = 'LIMITE' | 'RED' | 'SERVICIO' | 'OTRO';

export function motivoDeFalla(r: Resultado<unknown>): MotivoDeFalla {
  if (r.ok) return 'OTRO';
  if (r.tipo === 'RED') return 'RED';
  // El límite de lecturas protegidas es por profesional y por minuto: explorar muy rápido puede tocarlo.
  if (r.codigo === 'RATE_LIMITED') return 'LIMITE';
  return r.status >= 500 ? 'SERVICIO' : 'OTRO';
}

/** El texto de una falla, con lo que se puede hacer. Una falla nunca se presenta como ausencia de datos. */
export function textoDeFalla(motivo: MotivoDeFalla, que: string): string {
  switch (motivo) {
    case 'LIMITE':
      return `No pudimos cargar ${que}: hubo muchas consultas seguidas. Esperá un minuto y reintentá.`;
    case 'RED':
      return `No pudimos cargar ${que}: no hay conexión con BE. Revisá la conexión y reintentá.`;
    case 'SERVICIO':
      return `No pudimos cargar ${que}: BE no está disponible en este momento. Reintentá en unos minutos.`;
    default:
      return `No pudimos cargar ${que}. No es una ausencia de datos: reintentá.`;
  }
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
