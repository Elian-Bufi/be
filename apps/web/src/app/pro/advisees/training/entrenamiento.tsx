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
 *
 * WP-ESCRITORIO-AREAS (parte 0): el encabezado es el marco del área, común a las cuatro (`MarcoDelArea`). La tercera
 * sección se lee «Registros», como en Nutrición (C-65); su clave en la URL sigue siendo `ejecuciones` (F-03).
 */
import { COPY_ENTRENAMIENTO } from '@be/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Resultado } from '../../../../lib/api';
import { useEspacioProfesional } from '../../espacio-profesional';
import { EstadoDeLecturaDelArea, MarcoDelArea, NoDisponibleEnElArea } from '../marco-del-area';
import { conVolver, useRetornoALaFicha } from '../retorno-y-preparacion';
import { VistaDeEjecuciones } from './ejecuciones';
import { VistaDePlan } from './plan';
import { VistaDeResumen } from './resumen';
import { VistaDeRevisiones } from './revisiones';

export const VISTAS = [
  { clave: 'resumen', texto: COPY_ENTRENAMIENTO.resumen, icono: 'resumen' },
  { clave: 'plan', texto: COPY_ENTRENAMIENTO.plan, icono: 'plan' },
  { clave: 'ejecuciones', texto: COPY_ENTRENAMIENTO.ejecuciones, icono: 'lista' },
  { clave: 'revisiones', texto: COPY_ENTRENAMIENTO.revisiones, icono: 'revision' },
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

/** Texto neutral del 404 del profesional (10-B10:407). Es el del marco del área, que vuelve a preguntar el acceso. */
export const NoDisponible = NoDisponibleEnElArea;

/** Resultado de una lectura de la vista: 404 → neutral; otra falla → su motivo y «Reintentar». */
export const EstadoDeLectura = EstadoDeLecturaDelArea;

export function Entrenamiento() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vistaPedida = parametros.get('vista');
  const vista: Vista = VISTAS.some((v) => v.clave === vistaPedida) ? (vistaPedida as Vista) : 'resumen';
  const ruta = usePathname();
  const router = useRouter();
  const sesion = useEspacioProfesional(`/pro/advisees/training?id=${id}`);
  const { token, sesionPerdida } = sesion;

  const retorno = useRetornoALaFicha(id);
  const irA = useCallback((v: Vista) => router.replace(conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${v}`, retorno.valor)), [router, ruta, id, retorno.valor]);
  const [retirado, setRetirado] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setRetirado(true);
    return true;
  }, []);
  const volverALeer = useCallback(() => setRetirado(false), []);
  const contexto = useMemo(() => (token ? { token, asesoradoId: id, sesionPerdida, accesoRetirado, irA } : null), [token, id, sesionPerdida, accesoRetirado, irA]);

  return (
    <MarcoDelArea
      alcance="ENTRENAMIENTO"
      titulo={COPY_ENTRENAMIENTO.pestana}
      etiqueta="Secciones de Entrenamiento"
      id={id}
      sesion={sesion}
      retorno={retorno}
      vistas={VISTAS}
      vista={vista}
      href={(clave) => conVolver(`${ruta}?id=${encodeURIComponent(id)}&vista=${clave}`, retorno.valor)}
      retirado={retirado}
      onActualizar={volverALeer}
    >
      {contexto ? (
        <Contexto.Provider value={contexto}>
          {vista === 'resumen' ? <VistaDeResumen /> : null}
          {vista === 'plan' ? <VistaDePlan /> : null}
          {vista === 'ejecuciones' ? <VistaDeEjecuciones /> : null}
          {vista === 'revisiones' ? <VistaDeRevisiones /> : null}
        </Contexto.Provider>
      ) : null}
    </MarcoDelArea>
  );
}
