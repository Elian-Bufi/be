'use client';

/**
 * Pestaña Antropometría del workspace (B10-07). Navegación local Evaluaciones / En preparación / Evolución.
 * - Cada vista pregunta a la API: el PDP decide en cada lectura, sin caché (08 §27.3).
 * - 404 = no hay nada que mostrar, con el texto neutral de siempre, igual que en Nutrición (10-B10:407).
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: «siguiente operación deny →
 *   UI limpia contenido» (B10-06:1145-1148; DL-091 punto 1).
 * - La vista activa vive en la URL (`vista=`).
 */
import { COPY_ANTROPOMETRIA, COPY_VINCULO } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import type { Resultado } from '../../../../lib/api';
import { SinEspacioProfesional, useEspacioProfesional } from '../../espacio-profesional';
import { VistaDeEvaluaciones } from './evaluaciones';
import { VistaDeEvolucion } from './evolucion';
import { VistaDePreparacion } from './preparacion';

export const VISTAS = [
  { clave: 'evaluaciones', texto: 'Evaluaciones' },
  { clave: 'preparacion', texto: 'En preparación' },
  { clave: 'evolucion', texto: COPY_ANTROPOMETRIA.evolucion },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeAntropometria {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  readonly irA: (vista: Vista) => void;
}

const Contexto = createContext<ContextoDeAntropometria | null>(null);

export function useAntropometria(): ContextoDeAntropometria {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAntropometria fuera de la pestaña Antropometría');
  return c;
}

/** Texto neutral del 404 del profesional (10-B10:407): el mismo para lo ajeno y para lo inexistente. */
export function NoDisponible() {
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Link href="/pro">{COPY_VINCULO.volver}</Link>
      </p>
    </Aviso>
  );
}

export function EstadoDeLectura({ r, onReintentar, children }: { r: Resultado<unknown> | null; onReintentar: () => void; children: ReactNode }) {
  if (!r) return <Cargando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return <NoDisponible />;
  if (!r.ok) return <ErrorConReintento onReintentar={onReintentar} />;
  return <>{children}</>;
}

export function Antropometria() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'evaluaciones';
  const ruta = usePathname();
  const router = useRouter();
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees/anthropometry?id=${id}`);

  const irA = useCallback((v: Vista) => router.replace(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`), [router, ruta, id]);
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  const contexto = useMemo(() => (token ? { token, asesoradoId: id, sesionPerdida, accesoRetirado, irA } : null), [token, id, sesionPerdida, accesoRetirado, irA]);

  if (!token || !contexto) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  return (
    <Contexto.Provider value={contexto}>
      <p>
        <Link href={`/pro/advisees?id=${encodeURIComponent(id)}`}>Volver al workspace del asesorado</Link>
      </p>
      <h1>{COPY_ANTROPOMETRIA.pestana}</h1>
      {retirado ? <NoDisponible /> : <Secciones ruta={ruta} id={id} vista={vista} />}
    </Contexto.Provider>
  );
}

function Secciones({ ruta, id, vista }: { ruta: string; id: string; vista: Vista }) {
  return (
    <>
      <nav className="pestanas" aria-label="Secciones de Antropometría">
        <ul>
          {VISTAS.map((v) => (
            <li key={v.clave}>
              <Link href={`${ruta}?id=${encodeURIComponent(id)}&vista=${v.clave}`} aria-current={v.clave === vista ? 'page' : undefined} replace>
                {v.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {vista === 'evaluaciones' ? <VistaDeEvaluaciones /> : null}
      {vista === 'preparacion' ? <VistaDePreparacion /> : null}
      {vista === 'evolucion' ? <VistaDeEvolucion /> : null}
    </>
  );
}
