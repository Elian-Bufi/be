'use client';

/**
 * Pestaña Nutrición del workspace (B10-05). Navegación local Resumen / Plan / Registros / Revisiones (B05:124-131); nunca
 * «Evaluaciones / Objetivos / Planes / Comidas / Adherencia» como navegación global (B05:135-145).
 * - Cada vista pregunta a la API: el PDP decide en cada lectura, sin caché (08 §27.3).
 * - 404 = no hay nada que mostrar, con el texto neutral de siempre (UC-I02 E05; 10-B10:407): el mismo para un asesorado
 *   inexistente, ajeno, de otro alcance o que revocó.
 * - Una **escritura** denegada retira el contenido de toda la pestaña, no solo la acción: si el asesorado revocó el
 *   acceso, «siguiente operación deny → UI limpia contenido» (B10-06:1145-1148; DL-091 punto 1).
 * - La vista activa vive en la URL (`vista=`), así «Actualizar» y volver atrás la conservan.
 */
import { COPY_NUTRICION, COPY_VINCULO } from '@be/domain';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Pestanas } from '../../../../components/pestanas';
import { MigasDelAsesorado } from '../../../../components/migas';
import { Aviso } from '../../../../components/formulario';
import type { Resultado } from '../../../../lib/api';
import { SinEspacioProfesional, useEspacioProfesional } from '../../espacio-profesional';
import { conVolver, EnlaceDeRetorno, useRetornoALaFicha } from '../retorno-y-preparacion';
import { VistaDePlan } from './plan';
import { VistaDeRegistros } from './registros';
import { VistaDeResumen } from './resumen';
import { VistaDeRevisiones } from './revisiones';

export const VISTAS = [
  { clave: 'resumen', texto: COPY_NUTRICION.resumen },
  { clave: 'plan', texto: 'Plan' },
  { clave: 'registros', texto: COPY_NUTRICION.registros },
  { clave: 'revisiones', texto: COPY_NUTRICION.revisiones },
] as const;
export type Vista = (typeof VISTAS)[number]['clave'];

export interface ContextoDeNutricion {
  readonly token: string;
  readonly asesoradoId: string;
  /** Verdadero si la respuesta cerró la sesión (la UI ya redirige). */
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** `true` si una escritura recibió el 404 no revelador: la pestaña pasa a «no disponible» entera. */
  readonly accesoRetirado: (r: Resultado<unknown>) => boolean;
  readonly irA: (vista: Vista) => void;
}

const Contexto = createContext<ContextoDeNutricion | null>(null);

export function useNutricion(): ContextoDeNutricion {
  const c = useContext(Contexto);
  if (!c) throw new Error('useNutricion fuera de la pestaña Nutrición');
  return c;
}

/** Texto neutral del 404 del profesional (10-B10:407). */
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

export function Nutricion() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'resumen';
  const ruta = usePathname();
  const router = useRouter();
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees/nutrition?id=${id}`);

  const retorno = useRetornoALaFicha(id);
  const irA = useCallback((v: Vista) => router.replace(conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`, retorno.valor)), [router, ruta, id, retorno.valor]);
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
      <MigasDelAsesorado id={id} pestana={COPY_NUTRICION.pestana} volver={retorno.href} />
      <h1>{COPY_NUTRICION.pestana}</h1>
      <EnlaceDeRetorno href={retorno.href} />
      {retirado ? <NoDisponible /> : <Secciones ruta={ruta} id={id} vista={vista} volver={retorno.valor} />}
    </Contexto.Provider>
  );
}

function Secciones({ ruta, id, vista, volver }: { ruta: string; id: string; vista: Vista; volver: string | null }) {
  return (
    <>
      <Pestanas etiqueta="Secciones de Nutrición" vistas={VISTAS} actual={vista} href={(clave) => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${clave}`, volver)} />
      {vista === 'resumen' ? <VistaDeResumen /> : null}
      {vista === 'plan' ? <VistaDePlan /> : null}
      {vista === 'registros' ? <VistaDeRegistros /> : null}
      {vista === 'revisiones' ? <VistaDeRevisiones /> : null}
    </>
  );
}
