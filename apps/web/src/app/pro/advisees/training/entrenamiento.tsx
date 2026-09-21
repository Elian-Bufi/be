'use client';

/**
 * Pestaña Entrenamiento del workspace (B10-06 §1). Cuatro secciones: Resumen / Plan / Ejecuciones / Revisiones. Nunca
 * «Evaluaciones / Objetivos / Bloques / Microciclos / Sesiones / Series / RMs» como módulos globales desconectados
 * (B10-06:77-89): la evaluación y el objetivo viven en Resumen, la jerarquía del plan en Plan.
 * - Cada vista pregunta a la API: el PDP decide en cada lectura, sin caché (08 §27.3).
 * - 404 = no hay nada que mostrar, con el mismo texto neutral para inexistente, ajeno, de otro alcance o revocado.
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: si el asesorado revocó el
 *   acceso, «siguiente operación deny → UI limpia contenido» (B10-06:1145-1148; S10-TRN-09).
 * - La vista activa vive en la URL (`vista=`).
 */
import { COPY_ENTRENAMIENTO, COPY_VINCULO } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import type { Resultado } from '../../../../lib/api';
import { SinEspacioProfesional, useEspacioProfesional } from '../../espacio-profesional';
import { VistaDeEjecuciones } from './ejecuciones';
import { VistaDePlan } from './plan';
import { VistaDeResumen } from './resumen';
import { VistaDeRevisiones } from './revisiones';

export const VISTAS = [
  { clave: 'resumen', texto: COPY_ENTRENAMIENTO.resumen },
  { clave: 'plan', texto: COPY_ENTRENAMIENTO.plan },
  { clave: 'ejecuciones', texto: COPY_ENTRENAMIENTO.ejecuciones },
  { clave: 'revisiones', texto: COPY_ENTRENAMIENTO.revisiones },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeEntrenamiento {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  readonly irA: (vista: Vista) => void;
}

const Contexto = createContext<ContextoDeEntrenamiento | null>(null);

export function useEntrenamiento(): ContextoDeEntrenamiento {
  const c = useContext(Contexto);
  if (!c) throw new Error('useEntrenamiento fuera de la pestaña Entrenamiento');
  return c;
}

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

/** Resultado de una lectura de la vista: 404 → neutral; otro error → reintentar. */
export function EstadoDeLectura({ r, onReintentar, children }: { r: Resultado<unknown> | null; onReintentar: () => void; children: ReactNode }) {
  if (!r) return <Cargando />;
  if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return <NoDisponible />;
  if (!r.ok) return <ErrorConReintento onReintentar={onReintentar} />;
  return <>{children}</>;
}

export function Entrenamiento() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'resumen';
  const ruta = usePathname();
  const router = useRouter();
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees/training?id=${id}`);

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
      <h1>{COPY_ENTRENAMIENTO.pestana}</h1>
      {retirado ? <NoDisponible /> : <Secciones ruta={ruta} id={id} vista={vista} />}
    </Contexto.Provider>
  );
}

function Secciones({ ruta, id, vista }: { ruta: string; id: string; vista: Vista }) {
  return (
    <>
      <nav className="pestanas" aria-label="Secciones de Entrenamiento">
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
      {vista === 'resumen' ? <VistaDeResumen /> : null}
      {vista === 'plan' ? <VistaDePlan /> : null}
      {vista === 'ejecuciones' ? <VistaDeEjecuciones /> : null}
      {vista === 'revisiones' ? <VistaDeRevisiones /> : null}
    </>
  );
}
